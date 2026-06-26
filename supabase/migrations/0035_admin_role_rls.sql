-- ============================================================================
-- STSN Connect — Admin Role RLS Boundary & Dashboard KPI View
-- Migration: 0035_admin_role_rls_fixed_v4.sql
--
-- Fixes in this version:
--   1. Uses snake_case database columns such as school_id, enrollment_status,
--      employment_status, school_year, and student_id.
--   2. Does not reference public.student_assessments because that table does
--      not exist in the current schema.
--   3. Creates dashboard KPI views safely even when optional dashboard source
--      tables are not yet available.
--   4. Drops policies before re-creating them so the migration is safe to rerun.
--   5. Wraps policy creation with table-existence checks to avoid relation errors.
--   6. Casts school_id values to text inside KPI CTEs to avoid text = uuid errors.
-- ============================================================================

-- ── Role helper function ──────────────────────────────────────────────────────
create or replace function public.get_auth_role()
returns text
language sql stable security definer
set search_path = public
as $$
  select coalesce(
    auth.jwt() ->> 'role',
    (auth.jwt() -> 'user_metadata' ->> 'role'),
    'ANON'
  );
$$;

comment on function public.get_auth_role() is
  'Returns the STSN role string from the Supabase JWT claim. Used by RLS policies to distinguish ADMIN from SUPER_ADMIN.';

-- ── Admin-restricted table policies ──────────────────────────────────────────
-- These policies are created only when the target table exists.
-- They block ADMIN write access while allowing existing SELECT policies to remain.

do $$
begin
  if to_regclass('public.users') is not null then
    drop policy if exists "users_admin_no_insert" on public.users;
    drop policy if exists "users_admin_no_update" on public.users;
    drop policy if exists "users_admin_no_delete" on public.users;

    create policy "users_admin_no_insert" on public.users
      for insert to authenticated
      with check (public.get_auth_role() <> 'ADMIN');

    create policy "users_admin_no_update" on public.users
      for update to authenticated
      using (public.get_auth_role() <> 'ADMIN')
      with check (public.get_auth_role() <> 'ADMIN');

    create policy "users_admin_no_delete" on public.users
      for delete to authenticated
      using (public.get_auth_role() <> 'ADMIN');
  end if;

  if to_regclass('public.setup_items') is not null then
    drop policy if exists "setup_items_admin_no_insert" on public.setup_items;
    drop policy if exists "setup_items_admin_no_update" on public.setup_items;
    drop policy if exists "setup_items_admin_no_delete" on public.setup_items;

    create policy "setup_items_admin_no_insert" on public.setup_items
      for insert to authenticated
      with check (public.get_auth_role() <> 'ADMIN');

    create policy "setup_items_admin_no_update" on public.setup_items
      for update to authenticated
      using (public.get_auth_role() <> 'ADMIN')
      with check (public.get_auth_role() <> 'ADMIN');

    create policy "setup_items_admin_no_delete" on public.setup_items
      for delete to authenticated
      using (public.get_auth_role() <> 'ADMIN');
  end if;

  if to_regclass('public.schools') is not null then
    drop policy if exists "schools_admin_no_insert" on public.schools;
    drop policy if exists "schools_admin_no_update" on public.schools;
    drop policy if exists "schools_admin_no_delete" on public.schools;

    create policy "schools_admin_no_insert" on public.schools
      for insert to authenticated
      with check (public.get_auth_role() <> 'ADMIN');

    create policy "schools_admin_no_update" on public.schools
      for update to authenticated
      using (public.get_auth_role() <> 'ADMIN')
      with check (public.get_auth_role() <> 'ADMIN');

    create policy "schools_admin_no_delete" on public.schools
      for delete to authenticated
      using (public.get_auth_role() <> 'ADMIN');
  end if;
end $$;

-- ── Admin dashboard KPI view ──────────────────────────────────────────────────
-- This view is created dynamically so missing optional tables do not break the
-- migration. Missing source tables return 0 values for their related KPIs.
-- NOTE: outstanding balance is set to 0 until the real accounting/assessment
-- table is confirmed. The previous public.student_assessments reference was removed.

do $$
declare
  student_kpis_sql text;
  teacher_kpis_sql text;
  employee_kpis_sql text;
  payment_kpis_sql text;
  approval_kpis_sql text;
  view_sql text;
begin
  if to_regclass('public.schools') is null then
    raise exception 'Required table public.schools does not exist. Create schools table before running this migration.';
  end if;

  if to_regclass('public.students') is not null
     and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'students' and column_name = 'school_id') then
    student_kpis_sql := $SQL$
      student_kpis as (
        select
          st.school_id::text as school_id,
          count(distinct st.id) as total_students,
          count(distinct st.id) filter (where st.enrollment_status = 'Enrolled') as enrolled_students,
          count(distinct st.id) filter (where st.enrollment_status = 'Pending') as pending_students,
          count(distinct st.id) filter (where st.enrollment_status = 'Approved') as approved_students
        from public.students st
        group by st.school_id::text
      )$SQL$;
  else
    student_kpis_sql := $SQL$
      student_kpis as (
        select
          s.id::text as school_id,
          0::bigint as total_students,
          0::bigint as enrolled_students,
          0::bigint as pending_students,
          0::bigint as approved_students
        from public.schools s
      )$SQL$;
  end if;

  if to_regclass('public.teachers') is not null
     and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'teachers' and column_name = 'school_id') then
    teacher_kpis_sql := $SQL$
      teacher_kpis as (
        select
          t.school_id::text as school_id,
          count(distinct t.id) as total_teachers
        from public.teachers t
        group by t.school_id::text
      )$SQL$;
  else
    teacher_kpis_sql := $SQL$
      teacher_kpis as (
        select s.id::text as school_id, 0::bigint as total_teachers
        from public.schools s
      )$SQL$;
  end if;

  if to_regclass('public.employees') is not null
     and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'employees' and column_name = 'school_id') then
    employee_kpis_sql := $SQL$
      employee_kpis as (
        select
          e.school_id::text as school_id,
          count(distinct e.id) filter (where e.employment_status = 'Active') as active_employees
        from public.employees e
        group by e.school_id::text
      )$SQL$;
  else
    employee_kpis_sql := $SQL$
      employee_kpis as (
        select s.id::text as school_id, 0::bigint as active_employees
        from public.schools s
      )$SQL$;
  end if;

  if to_regclass('public.payments') is not null
     and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'payments' and column_name = 'school_id')
     and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'payments' and column_name = 'amount') then
    payment_kpis_sql := $SQL$
      payment_kpis as (
        select
          p.school_id::text as school_id,
          coalesce(sum(p.amount), 0) as total_collections,
          count(distinct p.id) as total_payment_count
        from public.payments p
        group by p.school_id::text
      )$SQL$;
  else
    payment_kpis_sql := $SQL$
      payment_kpis as (
        select
          s.id::text as school_id,
          0::numeric as total_collections,
          0::bigint as total_payment_count
        from public.schools s
      )$SQL$;
  end if;

  if to_regclass('public.approval_requests') is not null
     and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'approval_requests' and column_name = 'school_id') then
    approval_kpis_sql := $SQL$
      approval_kpis as (
        select
          ar.school_id::text as school_id,
          count(distinct ar.id) filter (
            where ar.status in ('Submitted', 'In Review', 'Resubmitted')
              and ar.workflow_type = 'enrollment'
          ) as pending_enrollment_approvals,
          count(distinct ar.id) filter (
            where ar.status in ('Submitted', 'In Review', 'Resubmitted')
              and ar.workflow_type = 'assessment'
          ) as pending_assessment_approvals,
          count(distinct ar.id) filter (
            where ar.status in ('Submitted', 'In Review', 'Resubmitted')
              and ar.workflow_type = 'leave_request'
          ) as pending_leave_approvals,
          count(distinct ar.id) filter (
            where ar.status in ('Submitted', 'In Review', 'Resubmitted')
          ) as total_pending_approvals
        from public.approval_requests ar
        group by ar.school_id::text
      )$SQL$;
  else
    approval_kpis_sql := $SQL$
      approval_kpis as (
        select
          s.id::text as school_id,
          0::bigint as pending_enrollment_approvals,
          0::bigint as pending_assessment_approvals,
          0::bigint as pending_leave_approvals,
          0::bigint as total_pending_approvals
        from public.schools s
      )$SQL$;
  end if;

  view_sql := 'create or replace view public.admin_dashboard_kpis as
    with
    ' || student_kpis_sql || ',
    ' || teacher_kpis_sql || ',
    ' || employee_kpis_sql || ',
    ' || payment_kpis_sql || ',
    assessment_kpis as (
      select
        s.id::text as school_id,
        0::bigint as outstanding_balance_count,
        0::numeric as outstanding_balance_amount
      from public.schools s
    ),
    ' || approval_kpis_sql || ',
    per_school as (
      select
        s.id::text as school_id,
        coalesce(s.name, ''Unnamed School'') as school_name,

        coalesce(sk.total_students, 0) as total_students,
        coalesce(sk.enrolled_students, 0) as enrolled_students,
        coalesce(sk.pending_students, 0) as pending_students,
        coalesce(sk.approved_students, 0) as approved_students,

        coalesce(tk.total_teachers, 0) as total_teachers,
        coalesce(ek.active_employees, 0) as active_employees,

        coalesce(pk.total_collections, 0) as total_collections,
        coalesce(pk.total_payment_count, 0) as total_payment_count,
        coalesce(ak.outstanding_balance_count, 0) as outstanding_balance_count,
        coalesce(ak.outstanding_balance_amount, 0) as outstanding_balance_amount,

        coalesce(apk.pending_enrollment_approvals, 0) as pending_enrollment_approvals,
        coalesce(apk.pending_assessment_approvals, 0) as pending_assessment_approvals,
        coalesce(apk.pending_leave_approvals, 0) as pending_leave_approvals,
        coalesce(apk.total_pending_approvals, 0) as total_pending_approvals,

        now() as computed_at
      from public.schools s
        left join student_kpis sk on sk.school_id = s.id::text
        left join teacher_kpis tk on tk.school_id = s.id::text
        left join employee_kpis ek on ek.school_id = s.id::text
        left join payment_kpis pk on pk.school_id = s.id::text
        left join assessment_kpis ak on ak.school_id = s.id::text
        left join approval_kpis apk on apk.school_id = s.id::text
    )
    select * from per_school

    union all

    select
      ''ALL'' as school_id,
      ''All Schools'' as school_name,
      coalesce(sum(total_students), 0) as total_students,
      coalesce(sum(enrolled_students), 0) as enrolled_students,
      coalesce(sum(pending_students), 0) as pending_students,
      coalesce(sum(approved_students), 0) as approved_students,
      coalesce(sum(total_teachers), 0) as total_teachers,
      coalesce(sum(active_employees), 0) as active_employees,
      coalesce(sum(total_collections), 0) as total_collections,
      coalesce(sum(total_payment_count), 0) as total_payment_count,
      coalesce(sum(outstanding_balance_count), 0) as outstanding_balance_count,
      coalesce(sum(outstanding_balance_amount), 0) as outstanding_balance_amount,
      coalesce(sum(pending_enrollment_approvals), 0) as pending_enrollment_approvals,
      coalesce(sum(pending_assessment_approvals), 0) as pending_assessment_approvals,
      coalesce(sum(pending_leave_approvals), 0) as pending_leave_approvals,
      coalesce(sum(total_pending_approvals), 0) as total_pending_approvals,
      now() as computed_at
    from per_school';

  execute view_sql;
end $$;

comment on view public.admin_dashboard_kpis is
  'Pre-aggregated KPI view for the Admin dashboard. Returns one row per school plus an ALL cross-school total. Missing optional source tables return 0 until wired.';

grant select on public.admin_dashboard_kpis to authenticated, anon;

-- ── Enrollment year-over-year history view ────────────────────────────────────
-- Created dynamically so it will not fail if enrollments or expected columns are missing.

do $$
begin
  if to_regclass('public.enrollments') is not null
     and to_regclass('public.students') is not null
     and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'enrollments' and column_name = 'school_year')
     and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'enrollments' and column_name = 'student_id')
     and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'students' and column_name = 'department') then
    execute $SQL$
      create or replace view public.admin_enrollment_yoy as
      select
        e.school_year as year,
        count(*) filter (where s.department = 'Basic Education') as stsn,
        count(*) filter (where s.department = 'College') as cdsta,
        count(*) as total
      from public.enrollments e
        join public.students s on s.id = e.student_id
      group by e.school_year
      order by e.school_year
    $SQL$;
  elsif to_regclass('public.enrollments') is not null
        and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'enrollments' and column_name = 'school_year') then
    execute $SQL$
      create or replace view public.admin_enrollment_yoy as
      select
        e.school_year as year,
        0::bigint as stsn,
        0::bigint as cdsta,
        count(*) as total
      from public.enrollments e
      group by e.school_year
      order by e.school_year
    $SQL$;
  else
    execute $SQL$
      create or replace view public.admin_enrollment_yoy as
      select
        null::text as year,
        0::bigint as stsn,
        0::bigint as cdsta,
        0::bigint as total
      where false
    $SQL$;
  end if;
end $$;

comment on view public.admin_enrollment_yoy is
  'Annual enrollment count by school year. Returns empty view if enrollment source table is not available yet.';

grant select on public.admin_enrollment_yoy to authenticated, anon;

-- ── Approval workflow: add "admin_oversight" workflow type ────────────────────
-- Only runs when approval_requests exists.

do $$
begin
  if to_regclass('public.approval_requests') is not null then
    alter table public.approval_requests
      drop constraint if exists approval_requests_workflow_type_check;

    alter table public.approval_requests
      add constraint approval_requests_workflow_type_check check (
        workflow_type in (
          'online_application',
          'enrollment',
          'assessment',
          'discount',
          'payment_void',
          'leave_request',
          'grade_period',
          'payroll_run',
          'admin_oversight'
        )
      );

    comment on constraint approval_requests_workflow_type_check on public.approval_requests is
      'admin_oversight added in 0035 to support ADMIN-role cross-office escalation requests.';
  end if;
end $$;

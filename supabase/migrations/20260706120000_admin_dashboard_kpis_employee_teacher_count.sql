-- ============================================================================
-- STSN Connect — admin_dashboard_kpis.total_teachers: employee-based count
-- ----------------------------------------------------------------------------
-- Phase 6 blocker remediation (non-destructive). Repoints total_teachers away
-- from public.teachers so this view survives that table's eventual retirement.
--
-- Recreates the exact same admin_dashboard_kpis view shape introduced in
-- 0035_admin_role_rls.sql (same columns, same school-scoped + ALL-rows shape),
-- changing only the teacher_kpis CTE:
--   before: count(distinct t.id) from public.teachers t
--   after:  count(distinct e.id) from public.employees e
--           join public.employee_faculty_profiles efp on efp.employee_id = e.id
--           where efp.is_teaching_staff = true and e.employment_status = 'Active'
--
-- No other KPI logic changes. public.teachers is not read anywhere in this
-- migration. Safe to re-run (create or replace view).
-- ============================================================================

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

  if to_regclass('public.employee_faculty_profiles') is not null
     and to_regclass('public.employees') is not null
     and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'employees' and column_name = 'school_id')
     and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'employees' and column_name = 'employment_status')
     and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'employee_faculty_profiles' and column_name = 'is_teaching_staff') then
    teacher_kpis_sql := $SQL$
      teacher_kpis as (
        select
          e.school_id::text as school_id,
          count(distinct e.id) as total_teachers
        from public.employees e
        join public.employee_faculty_profiles efp on efp.employee_id = e.id
        where efp.is_teaching_staff = true
          and e.employment_status = 'Active'
        group by e.school_id::text
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
  'Pre-aggregated KPI view for the Admin dashboard. Returns one row per school plus an ALL cross-school total. total_teachers is sourced from employee_faculty_profiles/employees (Phase 6 remediation, 2026-07-06) and no longer depends on public.teachers. Missing optional source tables return 0 until wired.';

grant select on public.admin_dashboard_kpis to authenticated, anon;

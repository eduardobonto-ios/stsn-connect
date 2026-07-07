-- ============================================================================
-- STSN CONNECT - Demo teacher -> employee bridge cleanup (preserve + remap)
-- ----------------------------------------------------------------------------
-- Closes the teacher -> employee bridge gap for the 5 unresolved active demo
-- teachers (Arthur Reyes, Beatriz Cruz, Carlo Vergara, Elena Soriano,
-- Fe Domingo) and fixes the pre-existing Arthur/Beatriz login-linkage bug.
-- See:
--   docs/TEACHERS_TO_EMPLOYEES_BRIDGE_RECONCILIATION_REPORT.md
--   docs/TEACHERS_TO_EMPLOYEES_IDENTITY_MISMATCH_REPORT.md
--   docs/TEACHERS_TO_EMPLOYEES_DEMO_RESET_PLAN.md
--
-- Strategy: PRESERVE + REMAP, not delete + reseed.
--   - no teachers row is deleted
--   - no teacher_id / adviser_id / recorded_by column is dropped
--   - no dependent academic row (sections, class_schedules,
--     subject_class_loads, grade_periods, grades, learning_materials,
--     student_attendance, consultation_appointments) is deleted
--   - no public.teachers or public.employees table is dropped
--   - Phase 6 retirement (docs/TEACHERS_TO_EMPLOYEES_RETIREMENT_RUNBOOK.md) is
--     explicitly out of scope and is not touched by this migration
--
-- Idempotency: every statement below is individually guarded so this file can
-- be re-applied safely. The upfront guard block aborts loudly instead of
-- guessing if live data has drifted from either the known-bad seed state or
-- the known-fixed state this script was written against.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 0. Guards. Abort before changing anything if live data doesn't match what
--    this migration expects, instead of silently doing the wrong thing.
-- ----------------------------------------------------------------------------
do $$
declare
  v_missing_teachers text;
  v_teacher_login_user_id uuid;
  v_arthur_user_id uuid;
  v_beatriz_user_id uuid;
begin
  -- 0a. All 5 target teacher rows must exist.
  select string_agg(x.legacy_id, ', ') into v_missing_teachers
  from unnest(array['teach-arthur','teach-beatriz','teach-carlo','teach-elena','teach-fe']) as x(legacy_id)
  where not exists (select 1 from public.teachers t where t.legacy_id = x.legacy_id);

  if v_missing_teachers is not null then
    raise exception 'Guard failed: expected teacher legacy_id(s) not found: %. Aborting before any change.', v_missing_teachers;
  end if;

  -- 0b. Arthur/Beatriz user_id state must match either the known-bad seed
  --     state (fix required) or the known-fixed state (safe no-op below).
  --     Anything else is unrecognized drift -> fail safely.
  select id into v_teacher_login_user_id from public.users where legacy_id = 'user-teacher';
  select user_id into v_arthur_user_id from public.teachers where legacy_id = 'teach-arthur';
  select user_id into v_beatriz_user_id from public.teachers where legacy_id = 'teach-beatriz';

  if v_teacher_login_user_id is null then
    raise exception 'Guard failed: expected users row with legacy_id = ''user-teacher'' (teacher@stsn.edu.ph) not found.';
  end if;

  if v_beatriz_user_id is not distinct from v_teacher_login_user_id then
    raise notice 'Identity guard: known-bad seed state detected (teach-beatriz currently owns teacher@stsn.edu.ph). Will correct below.';
  elsif v_arthur_user_id is not distinct from v_teacher_login_user_id then
    raise notice 'Identity guard: already corrected (teach-arthur already owns teacher@stsn.edu.ph). Identity-fix steps below will no-op.';
  else
    raise exception 'Guard failed: teach-arthur/teach-beatriz user_id state matches neither the known-bad seed state nor the known-fixed state. Manual review required before re-running this migration.';
  end if;

  -- 0c. No duplicate employees row: if an employees row already exists for one
  --     of the 5 target emails, it must already be bridged back to its
  --     matching teacher (safe no-op) — otherwise this looks like a
  --     conflicting/duplicate employee record and we abort.
  if exists (
    select 1
    from public.employees e
    where e.email in (
      'arthur.reyes@stsn.edu.ph', 'beatriz.cruz@stsn.edu.ph', 'carlo.vergara@stsn.edu.ph',
      'elena.soriano@stsn.edu.ph', 'fe.domingo@cdsta.edu.ph'
    )
    and not exists (
      select 1 from public.teachers t
      where t.employee_id = e.id
        and t.legacy_id in ('teach-arthur','teach-beatriz','teach-carlo','teach-elena','teach-fe')
    )
  ) then
    raise exception 'Guard failed: an employees row already exists for one of the 5 target teacher emails but is not linked back to its expected teacher row. Manual review required before re-running this migration.';
  end if;

  -- 0d. No duplicate users row: if a users row already exists for Beatriz's
  --     dedicated login email, it must already be wired as
  --     teach-beatriz.user_id (safe no-op) — otherwise abort.
  if exists (
    select 1 from public.users u
    where u.email = 'beatriz.cruz@stsn.edu.ph'
      and not exists (
        select 1 from public.teachers t
        where t.legacy_id = 'teach-beatriz' and t.user_id = u.id
      )
  ) then
    raise exception 'Guard failed: a users row already exists for beatriz.cruz@stsn.edu.ph but is not linked as teach-beatriz.user_id. Manual review required before re-running this migration.';
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 1. Identity-mismatch fix (teacher@stsn.edu.ph should resolve to Arthur
--    Reyes; Beatriz Cruz gets her own login). Every statement is guarded so
--    this section is a no-op if already applied.
-- ----------------------------------------------------------------------------

-- 1a. Create Beatriz Cruz's own login, only if it doesn't already exist.
--     She owns a real, independent academic footprint (sections,
--     subject_class_loads, grade_periods, grades, learning_materials) and
--     must not be left without a login.
insert into public.users (
  legacy_id, school_id, email, name, role, is_active, avatar_url, department
)
select
  'user-beatriz-teacher',
  t.school_id,
  t.email,
  'Ms. Beatriz Cruz',
  'TEACHER',
  true,
  '',
  t.department
from public.teachers t
where t.legacy_id = 'teach-beatriz'
  and not exists (select 1 from public.users u where u.email = t.email)
  and not exists (select 1 from public.users u where u.legacy_id = 'user-beatriz-teacher');

-- 1b. Give Arthur Reyes the existing demo teacher login, only while his
--     user_id is still unset.
update public.teachers
set user_id = (select id from public.users where legacy_id = 'user-teacher')
where legacy_id = 'teach-arthur'
  and user_id is null;

-- 1c. Re-point Beatriz off Arthur's user_id and onto her own new login, only
--     while she is still pointing at the shared teacher@stsn.edu.ph login.
update public.teachers
set user_id = (select id from public.users where legacy_id = 'user-beatriz-teacher')
where legacy_id = 'teach-beatriz'
  and user_id = (select id from public.users where legacy_id = 'user-teacher');

-- 1d. Explicit RBAC role assignment for Beatriz's new user (mirrors the
--     pattern used by the original RBAC backfill in
--     20260701120000_security_rbac_schema.sql). Arthur's existing assignment
--     row (for user-teacher) already exists and needs no change.
insert into public.security_user_role_assignments (user_id, role_id, school_id, is_primary, is_active)
select
  u.id::text,
  r.id,
  u.school_id::text,
  true,
  true
from public.users u
join public.security_roles r on r.code = u.role
where u.legacy_id = 'user-beatriz-teacher'
on conflict (user_id, role_id) do nothing;

-- ----------------------------------------------------------------------------
-- 2. Create employees rows for the 5 unresolved active dummy teachers and
--    bridge teachers.employee_id. Each block is guarded by
--    "t.employee_id is null" on the insert's source row and again on the
--    final update, so re-running this migration after it has already
--    succeeded does not create duplicate employees rows.
--    salary stays 0 as an explicit placeholder demo value pending real HR
--    figures, consistent with the bridge reconciliation report.
-- ----------------------------------------------------------------------------

-- Arthur Reyes
with new_employee as (
  insert into public.employees
    (legacy_id, first_name, last_name, middle_name, email, user_id, department, position,
     position_title, school_id, salary, status, leave_balance, employment_status)
  select
    'emp-stsn-arthur-reyes', 'Arthur', 'Reyes', 'Panganiban', 'arthur.reyes@stsn.edu.ph',
    t.user_id, 'College', 'Instructor', 'Instructor — Information Technology & Computer Networks',
    t.school_id, 0, 'Full-Time', 0, 'Active'
  from public.teachers t
  where t.legacy_id = 'teach-arthur'
    and t.employee_id is null
  returning id
)
update public.teachers
set employee_id = (select id from new_employee)
where legacy_id = 'teach-arthur'
  and employee_id is null
  and exists (select 1 from new_employee);

-- Beatriz Cruz
with new_employee as (
  insert into public.employees
    (legacy_id, first_name, last_name, middle_name, email, user_id, department, position,
     position_title, school_id, salary, status, leave_balance, employment_status)
  select
    'emp-stsn-beatriz-cruz', 'Beatriz', 'Cruz', 'Soriano', 'beatriz.cruz@stsn.edu.ph',
    t.user_id, 'Basic Education', 'Instructor', 'Instructor — General Mathematics & Statistics',
    t.school_id, 0, 'Full-Time', 0, 'Active'
  from public.teachers t
  where t.legacy_id = 'teach-beatriz'
    and t.employee_id is null
  returning id
)
update public.teachers
set employee_id = (select id from new_employee)
where legacy_id = 'teach-beatriz'
  and employee_id is null
  and exists (select 1 from new_employee);

-- Carlo Vergara
with new_employee as (
  insert into public.employees
    (legacy_id, first_name, last_name, middle_name, email, user_id, department, position,
     position_title, school_id, salary, status, leave_balance, employment_status)
  select
    'emp-stsn-carlo-vergara', 'Carlo', 'Vergara', 'Dizon', 'carlo.vergara@stsn.edu.ph',
    t.user_id, 'College', 'Instructor', 'Instructor — Business Economics & Finance',
    t.school_id, 0, 'Full-Time', 0, 'Active'
  from public.teachers t
  where t.legacy_id = 'teach-carlo'
    and t.employee_id is null
  returning id
)
update public.teachers
set employee_id = (select id from new_employee)
where legacy_id = 'teach-carlo'
  and employee_id is null
  and exists (select 1 from new_employee);

-- Elena Soriano
with new_employee as (
  insert into public.employees
    (legacy_id, first_name, last_name, middle_name, email, user_id, department, position,
     position_title, school_id, salary, status, leave_balance, employment_status)
  select
    'emp-stsn-elena-soriano', 'Elena', 'Soriano', 'Basa', 'elena.soriano@stsn.edu.ph',
    t.user_id, 'Basic Education', 'Instructor', 'Instructor — English Language & Literature',
    t.school_id, 0, 'Full-Time', 0, 'Active'
  from public.teachers t
  where t.legacy_id = 'teach-elena'
    and t.employee_id is null
  returning id
)
update public.teachers
set employee_id = (select id from new_employee)
where legacy_id = 'teach-elena'
  and employee_id is null
  and exists (select 1 from new_employee);

-- Fe Domingo
with new_employee as (
  insert into public.employees
    (legacy_id, first_name, last_name, middle_name, email, user_id, department, position,
     position_title, school_id, salary, status, leave_balance, employment_status)
  select
    'emp-cdsta-fe-domingo', 'Fe', 'Domingo', 'Lacson', 'fe.domingo@cdsta.edu.ph',
    t.user_id, 'College', 'Instructor', 'Instructor — Hospitality Management',
    t.school_id, 0, 'Full-Time', 0, 'Active'
  from public.teachers t
  where t.legacy_id = 'teach-fe'
    and t.employee_id is null
  returning id
)
update public.teachers
set employee_id = (select id from new_employee)
where legacy_id = 'teach-fe'
  and employee_id is null
  and exists (select 1 from new_employee);

-- ----------------------------------------------------------------------------
-- 3. Backfill employee_faculty_profiles. Verbatim re-run of the idempotent
--    upsert already shipped in 20260705142000_employee_faculty_profiles.sql —
--    picks up any teachers row with a non-null employee_id, so this now
--    reaches all 8 teachers (previously only reached the 3 already-bridged).
-- ----------------------------------------------------------------------------
insert into public.employee_faculty_profiles (
  employee_id, teacher_id, specialization, advisory_section, is_teaching_staff
)
select
  t.employee_id, t.id, t.specialization, t.advisory_section, true
from public.teachers t
where t.employee_id is not null
on conflict (employee_id) do update set
  teacher_id = excluded.teacher_id,
  specialization = excluded.specialization,
  advisory_section = excluded.advisory_section,
  is_teaching_staff = excluded.is_teaching_staff,
  updated_at = now();

-- ----------------------------------------------------------------------------
-- 4. Backfill dependent-table employee_id columns. Verbatim re-run of the
--    idempotent updates already shipped in
--    20260705143000_academic_employee_ownership_columns.sql and
--    20260705144000_attendance_consultation_employee_ownership.sql — each is
--    guarded by "... employee_id is null", so already-bridged rows are not
--    re-touched and this now also reaches the 5 newly-bridged teachers.
-- ----------------------------------------------------------------------------
update public.sections s
set adviser_employee_id = t.employee_id
from public.teachers t
where s.adviser_id = t.id
  and s.adviser_id is not null
  and t.employee_id is not null
  and s.adviser_employee_id is null;

update public.class_schedules cs
set employee_id = t.employee_id
from public.teachers t
where cs.teacher_id = t.id
  and cs.teacher_id is not null
  and t.employee_id is not null
  and cs.employee_id is null;

update public.subject_class_loads scl
set employee_id = t.employee_id
from public.teachers t
where scl.teacher_id = t.id
  and t.employee_id is not null
  and scl.employee_id is null;

update public.grade_periods gp
set employee_id = t.employee_id
from public.teachers t
where gp.teacher_id = t.id
  and gp.teacher_id is not null
  and t.employee_id is not null
  and gp.employee_id is null;

update public.grades g
set employee_id = t.employee_id
from public.teachers t
where g.teacher_id = t.id
  and g.teacher_id is not null
  and t.employee_id is not null
  and g.employee_id is null;

update public.learning_materials lm
set employee_id = t.employee_id
from public.teachers t
where lm.teacher_id = t.id
  and lm.teacher_id is not null
  and t.employee_id is not null
  and lm.employee_id is null;

update public.student_attendance sa
set recorded_by_employee_id = t.employee_id
from public.teachers t
where sa.recorded_by = t.id
  and sa.recorded_by is not null
  and t.employee_id is not null
  and sa.recorded_by_employee_id is null;

update public.consultation_appointments ca
set employee_id = t.employee_id
from public.teachers t
where ca.teacher_id = t.id
  and ca.teacher_id is not null
  and t.employee_id is not null
  and ca.employee_id is null;

commit;

-- ============================================================================
-- ROLLBACK — run manually if this migration needs to be reversed. Not part of
-- the migration itself (this file only ever COMMITs the forward change).
--
-- Deleting the 5 employees rows below cascades (on delete set null / cascade,
-- per schema) through employee_faculty_profiles, teachers.employee_id, and
-- every dependent-table employee_id column touched in step 4 — none of that
-- needs separate reversal. Only the identity fix (step 1) needs explicit
-- reversal to restore the original (buggy) seed state.
-- ============================================================================

-- begin;
--
-- delete from public.employees
-- where legacy_id in (
--   'emp-stsn-arthur-reyes',
--   'emp-stsn-beatriz-cruz',
--   'emp-stsn-carlo-vergara',
--   'emp-stsn-elena-soriano',
--   'emp-cdsta-fe-domingo'
-- );
--
-- delete from public.employee_faculty_profiles p
-- using public.teachers t
-- where p.teacher_id = t.id
--   and t.legacy_id in ('teach-arthur','teach-beatriz','teach-carlo','teach-elena','teach-fe')
--   and not exists (select 1 from public.employees e where e.id = p.employee_id);
--
-- update public.teachers
-- set employee_id = null
-- where legacy_id in ('teach-arthur','teach-beatriz','teach-carlo','teach-elena','teach-fe');
--
-- delete from public.security_user_role_assignments a
-- using public.users u
-- where a.user_id = u.id::text
--   and u.legacy_id = 'user-beatriz-teacher';
--
-- update public.teachers
-- set user_id = (select id from public.users where legacy_id = 'user-teacher')
-- where legacy_id = 'teach-beatriz';
--
-- update public.teachers
-- set user_id = null
-- where legacy_id = 'teach-arthur';
--
-- delete from public.users where legacy_id = 'user-beatriz-teacher';
--
-- commit;

-- ============================================================================
-- VALIDATION SQL — run manually after applying this migration.
-- ============================================================================

-- 1. Teacher-to-employee bridge gaps (expect 0 rows after this migration).
-- select legacy_id, first_name, last_name, email
-- from public.teachers
-- where employee_id is null;

-- 2. Dependent rows still missing employee_id (expect 0 for all, modulo any
--    teacher rows intentionally left unbridged outside this migration's scope).
-- select 'sections' as tbl, count(*) from public.sections where adviser_id is not null and adviser_employee_id is null
-- union all
-- select 'class_schedules', count(*) from public.class_schedules where teacher_id is not null and employee_id is null
-- union all
-- select 'subject_class_loads', count(*) from public.subject_class_loads where teacher_id is not null and employee_id is null
-- union all
-- select 'grade_periods', count(*) from public.grade_periods where teacher_id is not null and employee_id is null
-- union all
-- select 'grades', count(*) from public.grades where teacher_id is not null and employee_id is null
-- union all
-- select 'learning_materials', count(*) from public.learning_materials where teacher_id is not null and employee_id is null
-- union all
-- select 'student_attendance', count(*) from public.student_attendance where recorded_by is not null and recorded_by_employee_id is null
-- union all
-- select 'consultation_appointments', count(*) from public.consultation_appointments where teacher_id is not null and employee_id is null;

-- 3. Arthur Reyes owns teacher@stsn.edu.ph.
-- select t.legacy_id, t.first_name, t.last_name, u.email as login_email
-- from public.teachers t
-- join public.users u on u.id = t.user_id
-- where u.email = 'teacher@stsn.edu.ph';
-- expect: teach-arthur / Arthur / Reyes

-- 4. Beatriz Cruz has her own login.
-- select t.legacy_id, t.first_name, t.last_name, u.email as login_email
-- from public.teachers t
-- join public.users u on u.id = t.user_id
-- where t.legacy_id = 'teach-beatriz';
-- expect: teach-beatriz / Beatriz / Cruz / beatriz.cruz@stsn.edu.ph

-- 5. ready_for_phase_6 (existing Phase 5 validation view).
-- select * from public.v_teacher_consolidation_validation_summary order by metric_name;

-- 6. Remaining Phase 6 blockers (existing Phase 6 prep view).
-- select * from public.v_teacher_consolidation_retirement_blockers;

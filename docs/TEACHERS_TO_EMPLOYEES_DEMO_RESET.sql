-- ============================================================================
-- Demo teacher bridge reset — Arthur Reyes, Beatriz Cruz, Carlo Vergara,
-- Elena Soriano, Fe Domingo
-- STATUS: FOR REVIEW ONLY. NOT executed. Do not run until explicitly approved.
-- Do not place this file in supabase/migrations until approved and confirmed
-- final — kept out of that directory so nothing picks it up automatically.
--
-- Scope: closes the teacher -> employee bridge gap for the 5 unresolved
-- teachers, backfills their dependent academic rows to employee-based
-- ownership, and fixes the pre-existing Beatriz/Arthur login-linkage bug.
--
-- Explicitly OUT of scope:
--   - dropping public.teachers or any teacher_id/adviser_id/recorded_by column
--   - Phase 6 retirement work of any kind
--   - deleting any dependent academic row (sections, class_schedules,
--     subject_class_loads, grade_periods, grades, learning_materials,
--     student_attendance, consultation_appointments)
--
-- Preconditions this script assumes (verified read-only immediately before
-- writing this script, 2026-07-05):
--   teachers.employee_id is null for legacy_id in
--     ('teach-arthur','teach-beatriz','teach-carlo','teach-elena','teach-fe')
--   teach-beatriz.user_id = the user row for legacy_id 'user-teacher'
--     (teacher@stsn.edu.ph / "Prof. Arthur Reyes") -- the known bug
--   teach-arthur.user_id is null
--   no users row exists yet with email beatriz.cruz@stsn.edu.ph
--   no employees row exists yet with any of the 5 teacher emails below
-- If any of these have drifted, the guard block aborts before changing
-- anything.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 0. Safety guard
-- ----------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from public.teachers
    where legacy_id in ('teach-arthur','teach-beatriz','teach-carlo','teach-elena','teach-fe')
      and employee_id is not null
  ) then
    raise exception 'Guard failed: at least one of the 5 target teachers already has employee_id set. Re-run the read-only inspection before applying this script.';
  end if;

  if not exists (
    select 1 from public.teachers
    where legacy_id = 'teach-beatriz'
      and user_id = (select id from public.users where legacy_id = 'user-teacher')
  ) then
    raise exception 'Guard failed: teach-beatriz.user_id no longer matches the expected mismatched state.';
  end if;

  if exists (select 1 from public.users where email = 'beatriz.cruz@stsn.edu.ph') then
    raise exception 'Guard failed: a users row already exists for beatriz.cruz@stsn.edu.ph.';
  end if;

  if exists (
    select 1 from public.employees
    where email in (
      'arthur.reyes@stsn.edu.ph', 'beatriz.cruz@stsn.edu.ph', 'carlo.vergara@stsn.edu.ph',
      'elena.soriano@stsn.edu.ph', 'fe.domingo@cdsta.edu.ph'
    )
  ) then
    raise exception 'Guard failed: an employees row already exists for one of the 5 target teacher emails.';
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 1. Identity-mismatch fix (verbatim scope from
--    TEACHERS_TO_EMPLOYEES_IDENTITY_MISMATCH_CORRECTION.sql). Must run before
--    step 2 so the new Arthur/Beatriz employees rows can pick up the
--    corrected user_id values.
-- ----------------------------------------------------------------------------

-- 1a. Create Beatriz Cruz's own login. Required because teach-beatriz owns a
--     real, independent 23-row academic footprint (4 sections, 2
--     subject_class_loads, 8 grade_periods, 3 grades, 6 learning_materials).
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
where t.legacy_id = 'teach-beatriz';

-- 1b. Give Arthur Reyes the existing demo teacher login (currently null).
update public.teachers
set user_id = (select id from public.users where legacy_id = 'user-teacher')
where legacy_id = 'teach-arthur';

-- 1c. Re-point Beatriz off Arthur's user_id and onto her own new login.
update public.teachers
set user_id = (select id from public.users where legacy_id = 'user-beatriz-teacher')
where legacy_id = 'teach-beatriz';

-- 1d. Explicit RBAC role assignment for Beatriz's new user (mirrors the
--     pattern used by the original RBAC backfill). Arthur's assignment row
--     already exists and is untouched.
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
-- 2. Create employees rows for the 5 dummy teachers and bridge them.
--    employees.user_id is set where a login now exists (Arthur, Beatriz),
--    left null for the other three (they have no teachers.user_id today and
--    none is being created for them here).
--    salary stays 0 as a placeholder demo value, consistent with the
--    original bridge reconciliation report; adjust before running if this
--    project is used for anything beyond UAT demos.
-- ----------------------------------------------------------------------------

-- Arthur Reyes (teacher id 6994b75f-1c3c-4c9b-9825-b3d92b6c3d2c)
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
  returning id
)
update public.teachers
set employee_id = (select id from new_employee)
where legacy_id = 'teach-arthur';

-- Beatriz Cruz (teacher id aeef4d4f-b741-45c4-98fd-d478ef6cb176)
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
  returning id
)
update public.teachers
set employee_id = (select id from new_employee)
where legacy_id = 'teach-beatriz';

-- Carlo Vergara (teacher id 7ab19363-5c82-47e4-990f-6b7b145974eb)
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
  returning id
)
update public.teachers
set employee_id = (select id from new_employee)
where legacy_id = 'teach-carlo';

-- Elena Soriano (teacher id 08606a78-703a-4be7-87c2-17dbce226c7b)
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
  returning id
)
update public.teachers
set employee_id = (select id from new_employee)
where legacy_id = 'teach-elena';

-- Fe Domingo (teacher id 6850db9f-06f1-4d58-bdde-510fb80b68bc)
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
  returning id
)
update public.teachers
set employee_id = (select id from new_employee)
where legacy_id = 'teach-fe';

-- ----------------------------------------------------------------------------
-- 3. Backfill employee_faculty_profiles. Verbatim re-run of the idempotent
--    insert already shipped in 20260705142000_employee_faculty_profiles.sql —
--    picks up any teachers row with a non-null employee_id, so this now
--    reaches all 8 (previously only reached the 3 already-bridged teachers).
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
--    guarded by "... employee_id is null", so already-bridged rows (from the
--    3 previously-resolved teachers) are not re-touched.
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
-- ROLLBACK SCRIPT
-- Run this only if the reset above was already committed and needs to be
-- reversed. Deleting the 5 employees rows cascades (on delete set null /
-- on delete cascade, per schema) through employee_faculty_profiles,
-- teachers.employee_id, and every dependent-table employee_id column set in
-- step 4 — none of that needs to be reversed by hand. Only the identity-fix
-- (step 1) needs explicit reversal.
-- ============================================================================

-- begin;
--
-- delete from public.employees
-- where email in (
--   'arthur.reyes@stsn.edu.ph',
--   'beatriz.cruz@stsn.edu.ph',
--   'carlo.vergara@stsn.edu.ph',
--   'elena.soriano@stsn.edu.ph',
--   'fe.domingo@cdsta.edu.ph'
-- );
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

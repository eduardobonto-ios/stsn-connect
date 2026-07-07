-- ============================================================================
-- Beatriz Cruz / Arthur Reyes identity mismatch — CORRECTION SCRIPT
-- STATUS: FOR REVIEW ONLY. NOT executed. Do not run until explicitly approved.
-- Do not place this file in supabase/migrations until approved and confirmed
-- final — it is intentionally kept out of that directory so nothing picks it
-- up and applies it automatically.
--
-- Scope: fixes the teachers.user_id / users login-linkage bug only.
-- Explicitly OUT of scope (per instruction): employees rows, teachers.employee_id,
-- any *_employee_id dual-key backfill, dropping any teacher-related column/table,
-- Phase 6 retirement work of any kind.
--
-- Preconditions this script assumes (verified read-only immediately before
-- writing this script):
--   users:    id=36a0b95e-dff8-49ad-8593-e1fcd8640f8a legacy_id=user-teacher
--             email=teacher@stsn.edu.ph name='Prof. Arthur Reyes' role=TEACHER
--             school_id=318fe65e-c2fc-4a7d-9cd8-78d3598fa925 department=College
--   teachers: id=6994b75f-1c3c-4c9b-9825-b3d92b6c3d2c legacy_id=teach-arthur
--             user_id=NULL email=arthur.reyes@stsn.edu.ph
--   teachers: id=aeef4d4f-b741-45c4-98fd-d478ef6cb176 legacy_id=teach-beatriz
--             user_id=36a0b95e-dff8-49ad-8593-e1fcd8640f8a (the bug)
--             email=beatriz.cruz@stsn.edu.ph department='Basic Education'
--   no users row exists yet with email beatriz.cruz@stsn.edu.ph or
--   legacy_id user-beatriz-teacher
--   security_roles has a row with code='TEACHER'
-- If any of these have drifted (e.g. someone already partially fixed this),
-- the guard block below aborts before making any change.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 0. Safety guard: abort if the live data no longer matches the assumptions
--    this script was written against, instead of silently doing the wrong
--    thing to whatever state the database happens to be in.
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from public.teachers
    where legacy_id = 'teach-beatriz'
      and user_id = (select id from public.users where legacy_id = 'user-teacher')
  ) then
    raise exception 'Guard failed: teach-beatriz.user_id no longer matches the expected mismatched state. Re-run the read-only inspection before applying this script.';
  end if;

  if exists (
    select 1 from public.users where email = 'beatriz.cruz@stsn.edu.ph'
  ) then
    raise exception 'Guard failed: a users row already exists for beatriz.cruz@stsn.edu.ph. Re-check whether this script has already been applied.';
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 1. Create Beatriz Cruz's own login.
--    Required because teach-beatriz genuinely owns independent academic data
--    (4 sections, 2 subject_class_loads, 8 grade_periods, 3 grades, 6
--    learning_materials — see inspection report) and is a real, distinct
--    teacher, not a duplicate of Arthur. Simply nulling her user_id would
--    correct the mismatch but would also strip a real, data-owning teacher
--    of all login access, which nothing else in this seed does intentionally.
--    Reuses her own teacher record's email and department so there is no
--    ambiguity about whose login this is.
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 2. Give Arthur Reyes the existing demo teacher login.
--    teach-arthur.user_id is currently NULL; point it at the existing
--    teacher@stsn.edu.ph / "Prof. Arthur Reyes" user row.
-- ----------------------------------------------------------------------------
update public.teachers
set user_id = (select id from public.users where legacy_id = 'user-teacher')
where legacy_id = 'teach-arthur';

-- ----------------------------------------------------------------------------
-- 3. Re-point Beatriz Cruz off Arthur's user_id and onto her own new login.
-- ----------------------------------------------------------------------------
update public.teachers
set user_id = (select id from public.users where legacy_id = 'user-beatriz-teacher')
where legacy_id = 'teach-beatriz';

-- ----------------------------------------------------------------------------
-- 4. Give the new Beatriz Cruz user an explicit RBAC role assignment, so role
--    resolution for her account is explicit rather than relying on the
--    users.role fallback in getPrimaryRoleCode(). Mirrors the same pattern
--    used by the original RBAC backfill in
--    20260701120000_security_rbac_schema.sql (section 11).
--    Arthur's existing assignment row (for user-teacher) is untouched — it
--    already exists and already has role TEACHER, so no action is needed for
--    him here.
-- ----------------------------------------------------------------------------
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

commit;

-- ============================================================================
-- ROLLBACK SCRIPT
-- Run this only if the correction above was already committed and needs to
-- be reversed. Restores the exact pre-correction state (including the
-- original bug) rather than any other state.
-- ============================================================================

-- begin;
--
-- -- Reverse step 4: drop the RBAC assignment created for Beatriz's new user.
-- delete from public.security_user_role_assignments a
-- using public.users u
-- where a.user_id = u.id::text
--   and u.legacy_id = 'user-beatriz-teacher';
--
-- -- Reverse step 3 and step 2: restore original (buggy) user_id wiring.
-- update public.teachers
-- set user_id = (select id from public.users where legacy_id = 'user-teacher')
-- where legacy_id = 'teach-beatriz';
--
-- update public.teachers
-- set user_id = null
-- where legacy_id = 'teach-arthur';
--
-- -- Reverse step 1: remove Beatriz's dedicated login.
-- delete from public.users where legacy_id = 'user-beatriz-teacher';
--
-- commit;

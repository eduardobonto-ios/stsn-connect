-- ============================================================================
-- STSN CONNECT - Phase 1.5 teachers -> employees audit views
-- ----------------------------------------------------------------------------
-- Adds reusable audit views for the consolidation bridge introduced in
-- 20260705140000_teachers_employee_bridge.sql.
--
-- Goals:
-- - show which teacher rows matched cleanly
-- - surface unresolved bridge rows and likely collision causes
-- - expose employees that do not currently map back to any teacher row
-- - provide a compact summary view for UAT / migration validation
-- ============================================================================

create or replace view public.v_teacher_employee_bridge_audit as
with teacher_base as (
  select
    t.id as teacher_id,
    t.legacy_id as teacher_legacy_id,
    t.school_id as teacher_school_id,
    t.user_id as teacher_user_id,
    t.first_name as teacher_first_name,
    t.last_name as teacher_last_name,
    t.middle_name as teacher_middle_name,
    t.department as teacher_department,
    t.email as teacher_email,
    lower(btrim(t.email)) as teacher_normalized_email,
    t.is_active as teacher_is_active,
    t.employee_id as bridged_employee_id
  from public.teachers t
),
employee_base as (
  select
    e.id as employee_id,
    e.legacy_id as employee_legacy_id,
    e.school_id as employee_school_id,
    e.user_id as employee_user_id,
    e.first_name as employee_first_name,
    e.last_name as employee_last_name,
    e.middle_name as employee_middle_name,
    e.department as employee_department,
    e.email as employee_email,
    lower(btrim(e.email)) as employee_normalized_email
  from public.employees e
),
employee_user_candidates as (
  select
    e.employee_user_id as user_id,
    count(*) as employee_user_candidate_count
  from employee_base e
  where e.employee_user_id is not null
  group by e.employee_user_id
),
employee_email_candidates as (
  select
    e.employee_normalized_email as normalized_email,
    count(*) as employee_email_candidate_count
  from employee_base e
  where e.employee_normalized_email is not null
    and e.employee_normalized_email <> ''
  group by e.employee_normalized_email
),
teacher_email_duplicates as (
  select
    tb.teacher_normalized_email as normalized_email,
    count(*) as teacher_email_row_count
  from teacher_base tb
  where tb.teacher_normalized_email is not null
    and tb.teacher_normalized_email <> ''
  group by tb.teacher_normalized_email
)
select
  tb.teacher_id,
  tb.teacher_legacy_id,
  tb.teacher_school_id,
  tb.teacher_user_id,
  tb.teacher_first_name,
  tb.teacher_last_name,
  tb.teacher_middle_name,
  tb.teacher_department,
  tb.teacher_email,
  tb.teacher_is_active,
  tb.bridged_employee_id as employee_id,
  eb.employee_legacy_id,
  eb.employee_school_id,
  eb.employee_user_id,
  eb.employee_first_name,
  eb.employee_last_name,
  eb.employee_middle_name,
  eb.employee_department,
  eb.employee_email,
  coalesce(euc.employee_user_candidate_count, 0) as employee_user_candidate_count,
  coalesce(eec.employee_email_candidate_count, 0) as employee_email_candidate_count,
  coalesce(ted.teacher_email_row_count, 0) as teacher_email_row_count,
  case
    when tb.bridged_employee_id is not null
         and tb.teacher_user_id is not null
         and eb.employee_user_id = tb.teacher_user_id
      then 'matched_by_user_id'
    when tb.bridged_employee_id is not null
         and tb.teacher_normalized_email is not null
         and eb.employee_normalized_email = tb.teacher_normalized_email
      then 'matched_by_email'
    when tb.bridged_employee_id is not null
      then 'matched_manually_or_other'
    when tb.teacher_user_id is not null
         and coalesce(euc.employee_user_candidate_count, 0) > 1
      then 'unresolved_multiple_employee_user_matches'
    when coalesce(eec.employee_email_candidate_count, 0) > 1
      then 'unresolved_multiple_employee_email_matches'
    when coalesce(eec.employee_email_candidate_count, 0) = 1
      then 'unresolved_single_employee_email_candidate'
    else 'unresolved_no_employee_match'
  end as bridge_status
from teacher_base tb
left join employee_base eb
  on eb.employee_id = tb.bridged_employee_id
left join employee_user_candidates euc
  on euc.user_id = tb.teacher_user_id
left join employee_email_candidates eec
  on eec.normalized_email = tb.teacher_normalized_email
left join teacher_email_duplicates ted
  on ted.normalized_email = tb.teacher_normalized_email;

comment on view public.v_teacher_employee_bridge_audit is
  'Teacher-to-employee consolidation audit. Shows current bridge status, linked employee row, and collision counts for user_id/email matching.';

create or replace view public.v_teacher_employee_bridge_summary as
select
  bridge_status,
  count(*) as teacher_count
from public.v_teacher_employee_bridge_audit
group by bridge_status
order by bridge_status;

comment on view public.v_teacher_employee_bridge_summary is
  'Compact count summary of teacher-to-employee bridge statuses for migration validation.';

create or replace view public.v_unlinked_employees_for_teacher_consolidation as
with bridged_employee_ids as (
  select distinct t.employee_id
  from public.teachers t
  where t.employee_id is not null
),
teacher_email_candidates as (
  select
    lower(btrim(t.email)) as normalized_email,
    count(*) as teacher_email_candidate_count
  from public.teachers t
  where t.email is not null
    and btrim(t.email) <> ''
  group by lower(btrim(t.email))
),
teacher_user_candidates as (
  select
    t.user_id,
    count(*) as teacher_user_candidate_count
  from public.teachers t
  where t.user_id is not null
  group by t.user_id
)
select
  e.id as employee_id,
  e.legacy_id as employee_legacy_id,
  e.school_id,
  e.user_id,
  e.first_name,
  e.last_name,
  e.middle_name,
  e.email,
  e.department,
  e.position,
  e.position_title,
  e.employment_status,
  coalesce(tuc.teacher_user_candidate_count, 0) as teacher_user_candidate_count,
  coalesce(tec.teacher_email_candidate_count, 0) as teacher_email_candidate_count,
  case
    when bei.employee_id is not null
      then 'already_bridged'
    when e.user_id is not null and coalesce(tuc.teacher_user_candidate_count, 0) > 0
      then 'teacher_exists_but_not_bridged'
    when coalesce(tec.teacher_email_candidate_count, 0) > 0
      then 'teacher_email_match_exists_but_not_bridged'
    else 'no_teacher_match'
  end as employee_teacher_status
from public.employees e
left join bridged_employee_ids bei
  on bei.employee_id = e.id
left join teacher_user_candidates tuc
  on tuc.user_id = e.user_id
left join teacher_email_candidates tec
  on tec.normalized_email = lower(btrim(e.email))
where bei.employee_id is null;

comment on view public.v_unlinked_employees_for_teacher_consolidation is
  'Employees not currently bridged from teachers, annotated with whether a teacher-side user_id or email candidate exists.';

grant select on public.v_teacher_employee_bridge_audit to authenticated, anon;
grant select on public.v_teacher_employee_bridge_summary to authenticated, anon;
grant select on public.v_unlinked_employees_for_teacher_consolidation to authenticated, anon;

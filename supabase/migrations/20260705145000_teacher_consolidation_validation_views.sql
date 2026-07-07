-- ============================================================================
-- STSN CONNECT - Phase 5 teacher consolidation validation views
-- ----------------------------------------------------------------------------
-- Adds reusable validation views for UAT and retirement readiness checks.
--
-- Goals:
-- - summarize teacher -> employee bridge coverage
-- - summarize dual-key backfill coverage across dependent tables
-- - expose retirement blockers before any destructive Phase 6 migration
-- ============================================================================

create or replace view public.v_teacher_consolidation_dual_key_gaps as
select
  'sections'::text as table_name,
  count(*)::bigint as total_rows,
  count(*) filter (where adviser_id is not null)::bigint as legacy_owner_rows,
  count(*) filter (where adviser_employee_id is not null)::bigint as employee_owner_rows,
  count(*) filter (
    where adviser_id is not null
      and adviser_employee_id is null
  )::bigint as missing_employee_owner_rows
from public.sections

union all

select
  'class_schedules'::text as table_name,
  count(*)::bigint as total_rows,
  count(*) filter (where teacher_id is not null)::bigint as legacy_owner_rows,
  count(*) filter (where employee_id is not null)::bigint as employee_owner_rows,
  count(*) filter (
    where teacher_id is not null
      and employee_id is null
  )::bigint as missing_employee_owner_rows
from public.class_schedules

union all

select
  'subject_class_loads'::text as table_name,
  count(*)::bigint as total_rows,
  count(*) filter (where teacher_id is not null)::bigint as legacy_owner_rows,
  count(*) filter (where employee_id is not null)::bigint as employee_owner_rows,
  count(*) filter (
    where teacher_id is not null
      and employee_id is null
  )::bigint as missing_employee_owner_rows
from public.subject_class_loads

union all

select
  'grade_periods'::text as table_name,
  count(*)::bigint as total_rows,
  count(*) filter (where teacher_id is not null)::bigint as legacy_owner_rows,
  count(*) filter (where employee_id is not null)::bigint as employee_owner_rows,
  count(*) filter (
    where teacher_id is not null
      and employee_id is null
  )::bigint as missing_employee_owner_rows
from public.grade_periods

union all

select
  'grades'::text as table_name,
  count(*)::bigint as total_rows,
  count(*) filter (where teacher_id is not null)::bigint as legacy_owner_rows,
  count(*) filter (where employee_id is not null)::bigint as employee_owner_rows,
  count(*) filter (
    where teacher_id is not null
      and employee_id is null
  )::bigint as missing_employee_owner_rows
from public.grades

union all

select
  'learning_materials'::text as table_name,
  count(*)::bigint as total_rows,
  count(*) filter (where teacher_id is not null)::bigint as legacy_owner_rows,
  count(*) filter (where employee_id is not null)::bigint as employee_owner_rows,
  count(*) filter (
    where teacher_id is not null
      and employee_id is null
  )::bigint as missing_employee_owner_rows
from public.learning_materials

union all

select
  'student_attendance'::text as table_name,
  count(*)::bigint as total_rows,
  count(*) filter (where recorded_by is not null)::bigint as legacy_owner_rows,
  count(*) filter (where recorded_by_employee_id is not null)::bigint as employee_owner_rows,
  count(*) filter (
    where recorded_by is not null
      and recorded_by_employee_id is null
  )::bigint as missing_employee_owner_rows
from public.student_attendance

union all

select
  'consultation_appointments'::text as table_name,
  count(*)::bigint as total_rows,
  count(*) filter (where teacher_id is not null)::bigint as legacy_owner_rows,
  count(*) filter (where employee_id is not null)::bigint as employee_owner_rows,
  count(*) filter (
    where teacher_id is not null
      and employee_id is null
  )::bigint as missing_employee_owner_rows
from public.consultation_appointments;

comment on view public.v_teacher_consolidation_dual_key_gaps is
  'Phase 5 validation summary for legacy teacher-owned rows versus employee-owned rows across all dual-key consolidation tables.';

create or replace view public.v_teacher_consolidation_validation_summary as
with bridge_summary as (
  select
    count(*)::bigint as teacher_rows,
    count(*) filter (where employee_id is not null)::bigint as bridged_teacher_rows,
    count(*) filter (where employee_id is null)::bigint as unresolved_teacher_rows
  from public.teachers
),
faculty_summary as (
  select
    count(*)::bigint as faculty_profile_rows
  from public.employee_faculty_profiles
),
faculty_gap_summary as (
  select
    count(*)::bigint as bridged_teachers_missing_faculty_profile
  from public.teachers t
  left join public.employee_faculty_profiles efp
    on efp.employee_id = t.employee_id
  where t.employee_id is not null
    and efp.employee_id is null
),
dual_key_summary as (
  select
    coalesce(sum(missing_employee_owner_rows), 0)::bigint as unresolved_dual_key_rows
  from public.v_teacher_consolidation_dual_key_gaps
),
metrics as (
  select 'teacher_rows'::text as metric_name, teacher_rows as metric_value from bridge_summary
  union all
  select 'bridged_teacher_rows'::text, bridged_teacher_rows from bridge_summary
  union all
  select 'unresolved_teacher_rows'::text, unresolved_teacher_rows from bridge_summary
  union all
  select 'faculty_profile_rows'::text, faculty_profile_rows from faculty_summary
  union all
  select 'bridged_teachers_missing_faculty_profile'::text, bridged_teachers_missing_faculty_profile from faculty_gap_summary
  union all
  select 'unresolved_dual_key_rows'::text, unresolved_dual_key_rows from dual_key_summary
)
select
  metric_name,
  metric_value,
  case
    when metric_name in (
      'unresolved_teacher_rows',
      'bridged_teachers_missing_faculty_profile',
      'unresolved_dual_key_rows'
    ) and metric_value > 0
      then false
    else true
  end as passes
from metrics;

comment on view public.v_teacher_consolidation_validation_summary is
  'Phase 5 validation metrics for bridge coverage, faculty profile coverage, and unresolved dual-key ownership gaps.';

create or replace view public.v_teacher_consolidation_retirement_readiness as
with blockers as (
  select
    max(case when metric_name = 'unresolved_teacher_rows' then metric_value else 0 end) as unresolved_teacher_rows,
    max(case when metric_name = 'bridged_teachers_missing_faculty_profile' then metric_value else 0 end) as bridged_teachers_missing_faculty_profile,
    max(case when metric_name = 'unresolved_dual_key_rows' then metric_value else 0 end) as unresolved_dual_key_rows
  from public.v_teacher_consolidation_validation_summary
)
select
  unresolved_teacher_rows,
  bridged_teachers_missing_faculty_profile,
  unresolved_dual_key_rows,
  (
    unresolved_teacher_rows = 0
    and bridged_teachers_missing_faculty_profile = 0
    and unresolved_dual_key_rows = 0
  ) as ready_for_phase_6
from blockers;

comment on view public.v_teacher_consolidation_retirement_readiness is
  'Single-row readiness gate for Phase 6. Returns false when unresolved teacher bridges, missing faculty profiles, or dual-key backfill gaps still exist.';

grant select on public.v_teacher_consolidation_dual_key_gaps to authenticated, anon;
grant select on public.v_teacher_consolidation_validation_summary to authenticated, anon;
grant select on public.v_teacher_consolidation_retirement_readiness to authenticated, anon;

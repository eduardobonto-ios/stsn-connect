-- ============================================================================
-- STSN CONNECT - Phase 6 teacher consolidation retirement footprint views
-- ----------------------------------------------------------------------------
-- Adds retirement-prep views that quantify how much legacy teacher-key data
-- still exists alongside employee-key ownership.
--
-- Goals:
-- - show where legacy teacher-owned columns are still populated
-- - distinguish dual-key rows from legacy-only rows
-- - support staged retirement planning without dropping anything yet
-- ============================================================================

create or replace view public.v_teacher_consolidation_legacy_key_footprint as
select
  'sections'::text as table_name,
  count(*) filter (where adviser_id is not null)::bigint as legacy_key_rows,
  count(*) filter (where adviser_employee_id is not null)::bigint as employee_key_rows,
  count(*) filter (
    where adviser_id is not null
      and adviser_employee_id is not null
  )::bigint as dual_key_rows,
  count(*) filter (
    where adviser_id is not null
      and adviser_employee_id is null
  )::bigint as legacy_only_rows
from public.sections

union all

select
  'class_schedules'::text,
  count(*) filter (where teacher_id is not null)::bigint,
  count(*) filter (where employee_id is not null)::bigint,
  count(*) filter (where teacher_id is not null and employee_id is not null)::bigint,
  count(*) filter (where teacher_id is not null and employee_id is null)::bigint
from public.class_schedules

union all

select
  'subject_class_loads'::text,
  count(*) filter (where teacher_id is not null)::bigint,
  count(*) filter (where employee_id is not null)::bigint,
  count(*) filter (where teacher_id is not null and employee_id is not null)::bigint,
  count(*) filter (where teacher_id is not null and employee_id is null)::bigint
from public.subject_class_loads

union all

select
  'grade_periods'::text,
  count(*) filter (where teacher_id is not null)::bigint,
  count(*) filter (where employee_id is not null)::bigint,
  count(*) filter (where teacher_id is not null and employee_id is not null)::bigint,
  count(*) filter (where teacher_id is not null and employee_id is null)::bigint
from public.grade_periods

union all

select
  'grades'::text,
  count(*) filter (where teacher_id is not null)::bigint,
  count(*) filter (where employee_id is not null)::bigint,
  count(*) filter (where teacher_id is not null and employee_id is not null)::bigint,
  count(*) filter (where teacher_id is not null and employee_id is null)::bigint
from public.grades

union all

select
  'learning_materials'::text,
  count(*) filter (where teacher_id is not null)::bigint,
  count(*) filter (where employee_id is not null)::bigint,
  count(*) filter (where teacher_id is not null and employee_id is not null)::bigint,
  count(*) filter (where teacher_id is not null and employee_id is null)::bigint
from public.learning_materials

union all

select
  'student_attendance'::text,
  count(*) filter (where recorded_by is not null)::bigint,
  count(*) filter (where recorded_by_employee_id is not null)::bigint,
  count(*) filter (where recorded_by is not null and recorded_by_employee_id is not null)::bigint,
  count(*) filter (where recorded_by is not null and recorded_by_employee_id is null)::bigint
from public.student_attendance

union all

select
  'consultation_appointments'::text,
  count(*) filter (where teacher_id is not null)::bigint,
  count(*) filter (where employee_id is not null)::bigint,
  count(*) filter (where teacher_id is not null and employee_id is not null)::bigint,
  count(*) filter (where teacher_id is not null and employee_id is null)::bigint
from public.consultation_appointments;

comment on view public.v_teacher_consolidation_legacy_key_footprint is
  'Phase 6 retirement-prep view. Quantifies legacy teacher-key population, dual-key coverage, and legacy-only rows across all consolidated ownership tables.';

grant select on public.v_teacher_consolidation_legacy_key_footprint to authenticated, anon;

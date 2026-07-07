-- ============================================================================
-- STSN Connect — student_grade_entries.employee_id: canonical grade write path
-- ----------------------------------------------------------------------------
-- Grade-flow mutation-UAT blocker remediation (non-destructive, Option B).
--
-- CONTEXT
-- The active grade-encoding UI (GradeEncodingPage → GradeInputView →
-- GradeSheetTable → GradeCellInput) writes ONLY to public.student_grade_entries
-- via store.saveGradeEntry(). All grade computation / display / principal
-- approval (GradesDirectoryPage, computePeriodGrade) reads student_grade_entries
-- + grade_periods, never public.grades. store.saveGrade() — the only writer of
-- public.grades — is dead code (its lone caller lives in a stale nested copy,
-- not the active app). So student_grade_entries is the CANONICAL active grade
-- write table, but it carries no direct employee-ownership column: ownership is
-- only reachable indirectly through grade_period_id → grade_periods.employee_id.
--
-- This migration adds a direct employee_id ownership column so newly-saved grade
-- entries can be stamped with employee ownership at write time and the Phase 6
-- mutation UAT can assert it on the exact touched row.
--
-- NON-DESTRUCTIVE: public.grades, teacher_id, grade_periods.teacher_id, and
-- every legacy/compat column stay in place. No Phase 6 retirement here.
-- Backfill derives ownership from each entry's grade period (already backfilled
-- by 20260705143000_academic_employee_ownership_columns.sql).
-- ============================================================================

alter table public.student_grade_entries
  add column if not exists employee_id uuid
    references public.employees(id) on delete set null on update cascade;

create index if not exists idx_student_grade_entries_employee_id
  on public.student_grade_entries (employee_id)
  where employee_id is not null;

comment on column public.student_grade_entries.employee_id is
  'Employee-based ownership of the grade entry, denormalized from the parent grade_periods owner. student_grade_entries is the canonical active grade write table (public.grades is legacy/backfill-only). Stamped at write time by store.saveGradeEntry()/addGradeItem().';

-- Backfill existing entries from their grade period's owner. Prefer the period's
-- already-backfilled employee_id; fall back to the period teacher's employee
-- bridge so demo rows created before the period backfill still resolve.
update public.student_grade_entries sge
set employee_id = coalesce(gp.employee_id, t.employee_id)
from public.grade_periods gp
left join public.teachers t on t.id = gp.teacher_id
where sge.grade_period_id = gp.id
  and sge.employee_id is null
  and coalesce(gp.employee_id, t.employee_id) is not null;

-- ----------------------------------------------------------------------------
-- Extend the Phase 5 dual-key validation view so Phase 6 readiness also tracks
-- the canonical grade write table. student_grade_entries has no teacher_id of
-- its own; its legacy owner is the parent grade period's teacher_id, so a row is
-- "missing" its employee owner only when the period is teacher-owned yet the
-- entry has no employee_id. A left join keeps orphan entries (no period) out of
-- the gap count so they cannot regress the readiness gate.
--
-- Recreates the exact same view shape as
-- 20260705145000_teacher_consolidation_validation_views.sql, adding only the
-- student_grade_entries branch.
-- ----------------------------------------------------------------------------
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
  'student_grade_entries'::text as table_name,
  count(*)::bigint as total_rows,
  count(*) filter (where gp.teacher_id is not null)::bigint as legacy_owner_rows,
  count(*) filter (where sge.employee_id is not null)::bigint as employee_owner_rows,
  count(*) filter (
    where gp.teacher_id is not null
      and sge.employee_id is null
  )::bigint as missing_employee_owner_rows
from public.student_grade_entries sge
left join public.grade_periods gp on gp.id = sge.grade_period_id

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
  'Phase 5 validation summary for legacy teacher-owned rows versus employee-owned rows across all dual-key consolidation tables. Includes student_grade_entries — the canonical active grade write table — whose legacy owner is derived from its parent grade period.';

grant select on public.v_teacher_consolidation_dual_key_gaps to authenticated, anon;

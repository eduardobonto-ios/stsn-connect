-- ============================================================================
-- STSN CONNECT - Phase 6 teacher consolidation retirement blockers
-- ----------------------------------------------------------------------------
-- Adds blocker-focused views for retirement planning.
--
-- Goals:
-- - surface actionable Phase 6 blockers in one place
-- - combine validation readiness metrics with legacy-key footprint signals
-- - keep retirement planning non-destructive until blockers are cleared
-- ============================================================================

create or replace view public.v_teacher_consolidation_retirement_blockers as
with validation_failures as (
  select
    'validation_metric'::text as blocker_type,
    metric_name as blocker_key,
    metric_value as blocker_value,
    case metric_name
      when 'unresolved_teacher_rows'
        then 'Teacher rows still exist without an employee bridge.'
      when 'bridged_teachers_missing_faculty_profile'
        then 'Bridged teachers are still missing employee_faculty_profiles rows.'
      when 'unresolved_dual_key_rows'
        then 'Legacy-owned rows still exist without employee-key backfill.'
      else 'Validation metric is still failing.'
    end as blocker_reason
  from public.v_teacher_consolidation_validation_summary
  where passes = false
),
legacy_only_failures as (
  select
    'legacy_only_rows'::text as blocker_type,
    table_name as blocker_key,
    legacy_only_rows as blocker_value,
    'Legacy teacher-owned keys are still populated without employee-key coverage in this table.'::text as blocker_reason
  from public.v_teacher_consolidation_legacy_key_footprint
  where legacy_only_rows > 0
),
combined as (
  select * from validation_failures
  union all
  select * from legacy_only_failures
)
select
  blocker_type,
  blocker_key,
  blocker_value,
  blocker_reason
from combined
order by blocker_type, blocker_key;

comment on view public.v_teacher_consolidation_retirement_blockers is
  'Phase 6 retirement blockers. Lists failing validation metrics and tables that still contain legacy-only teacher-key rows.';

create or replace view public.v_teacher_consolidation_retirement_dashboard as
select
  r.ready_for_phase_6,
  coalesce((select count(*) from public.v_teacher_consolidation_retirement_blockers), 0)::bigint as blocker_count,
  coalesce((select sum(blocker_value) from public.v_teacher_consolidation_retirement_blockers), 0)::bigint as total_blocked_rows
from public.v_teacher_consolidation_retirement_readiness r;

comment on view public.v_teacher_consolidation_retirement_dashboard is
  'Single-row Phase 6 retirement dashboard showing overall readiness, blocker count, and total blocked rows.';

grant select on public.v_teacher_consolidation_retirement_blockers to authenticated, anon;
grant select on public.v_teacher_consolidation_retirement_dashboard to authenticated, anon;

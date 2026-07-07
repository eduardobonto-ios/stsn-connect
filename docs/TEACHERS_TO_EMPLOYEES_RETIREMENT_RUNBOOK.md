# Teachers To Employees Retirement Runbook

## Purpose

Use this runbook only after Phase 5 UAT is complete and the retirement readiness gate is clean.

Required preflight SQL:

```sql
select * from public.v_teacher_consolidation_validation_summary order by metric_name;
select * from public.v_teacher_consolidation_dual_key_gaps order by table_name;
select * from public.v_teacher_consolidation_retirement_readiness;
```

Hard gate:

- Do not start Phase 6 unless `ready_for_phase_6 = true`.

## Preflight Conditions

- All active teacher rows are bridged to `employees`.
- All bridged teachers have `employee_faculty_profiles` rows where required.
- All dual-key ownership gaps are resolved across sections, schedules, loads, grades, materials, attendance, and consultation.
- No remaining app workflow depends on email-only teacher resolution.
- No remaining release blocker is open from the UAT checklist.

## Recommended Retirement Order

1. Refresh DB types and any generated client artifacts after the final pre-retirement schema state is confirmed.
2. Remove remaining app reads that still require legacy `teacherId` or `adviserId` fallback behavior.
3. Remove store-level writes that still sync faculty advisory state back into `public.teachers`.
4. Ship and verify the app with employee-based ownership as the primary path before destructive SQL runs.
5. Drop legacy foreign keys to `public.teachers` only after application rollback risk is acceptable.
6. Drop legacy ownership columns such as `teacher_id`, `adviser_id`, and `recorded_by` only after row-level validation passes in production-like data.
7. Drop `public.teachers` last.

## Validation After Each Retirement Step

- Confirm faculty portal loads for bridged teaching staff.
- Confirm grade encoding still scopes correctly.
- Confirm scheduling and section adviser assignment still work.
- Confirm attendance and consultation workflows still save correctly.
- Confirm profile pages still show faculty and employee details correctly.
- Confirm no SQL view, policy, or report still references `public.teachers`.

## Rollback Guidance

- Keep a reversible deployment boundary between “app no longer depends on `teachers`” and “database drops legacy columns”.
- If a post-cutover issue appears, restore the last safe application build before running further destructive SQL.
- Do not combine all retirement drops into one unreviewed migration if staged rollback is still needed.

## Signoff

- UAT signoff complete:
- Retirement approval owner:
- Planned production window:
- Rollback owner:

## Phase 6 Human Signoff

- UAT Owner:
- UAT Date:
- Approved for Phase 6: No
- Notes:
  - DB bridge/backfill validation is passing (`npm run validate:consolidation` → `ready_for_phase_6 = true` as of 2026-07-06; was `false` on 2026-07-05, closed by `supabase/migrations/20260705148000_demo_teacher_employee_bridge_cleanup.sql`).
  - Read-only consolidation Playwright checks are passing (`tests/e2e/teacher-employee-consolidation.spec.ts`, 7/7 as of 2026-07-06).
  - `public.admin_dashboard_kpis.total_teachers` no longer needs to depend on `public.teachers` — a repointing migration exists (`supabase/migrations/20260706120000_admin_dashboard_kpis_employee_teacher_count.sql`) but has not yet been confirmed applied to the live project; verify via `select * from public.admin_dashboard_kpis limit 1;` before treating this item as closed.
  - Mutation-based UAT (create schedule, submit attendance, create consultation, save grade) is not automated — see `docs/TEACHERS_TO_EMPLOYEES_UAT_CHECKLIST.md` → "Mutation UAT Required Before Phase 6" for the manual checklist and required signoff.
  - Phase 6 remains blocked until the dashboard KPI dependency is confirmed removed in the live project and mutation/manual UAT is signed off above. No approval currently exists in this repo.

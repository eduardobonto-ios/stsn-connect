# Teachers To Employees UAT Checklist

## Purpose

Use this checklist during Phase 5 to validate the teacher-to-employee consolidation before any Phase 6 retirement work.

Recommended SQL checkpoints:

```sql
select * from public.v_teacher_consolidation_validation_summary order by metric_name;
select * from public.v_teacher_consolidation_dual_key_gaps order by table_name;
select * from public.v_teacher_consolidation_retirement_readiness;
select * from public.v_teacher_employee_bridge_summary order by bridge_status;
```

These four checkpoints are now automated read-only via `npm run validate:consolidation` ([scripts/validate-teacher-consolidation.mjs](/C:/Users/VELOSO/Documents/GitHub/stsn-connect/scripts/validate-teacher-consolidation.mjs:1)), and several of the browser-driven checks below are automated via `npm run test:e2e -- tests/e2e/teacher-employee-consolidation.spec.ts`.

## Demo Salary Placeholder Risk (2026-07-06)

The 5 employees created by `20260705148000_demo_teacher_employee_bridge_cleanup.sql` (Arthur Reyes,
Beatriz Cruz, Carlo Vergara, Elena Soriano, Fe Domingo) have `salary = 0`, explicitly as a placeholder
per that migration's own comments and the prior bridge reconciliation report. No salary value was
invented or guessed here.

**Classification: demo-only, non-blocking for Phase 6.** This project is a demo/UAT environment —
fictional schools ("St. Theresa's School of Novaliches", "Colegio de Sta. Teresa de Avila"), a fixed
demo password (`password123` for every seeded account per `LoginOverlay.tsx`), and auto-seeded
SUPER_ADMIN on first load (see `helpers/auth.ts`). `salary = 0` is consistent with a placeholder used
throughout this seed set, not a sign of production HR data being entered incorrectly. It has no bearing
on the teacher→employee schema/FK retirement Phase 6 is scoped to. If this schema/dataset is ever
pointed at a real production HR deployment, real salary figures must be entered before go-live — but
that is a separate HR data-entry task, not a Phase 6 blocker.

## `public.teachers` RLS Risk (2026-07-06)

`public.teachers` RLS (`0002_rls.sql`) grants `anon` and `authenticated` full `select`/`insert`/`update`/`delete`
with no restricting conditions (`using (true)` / `with check (true)` throughout).

**Classification: non-blocking, do not harden in this pass.** Two reasons:

1. Phase 6 is scoped to drop `public.teachers` entirely once the mutation-UAT/signoff gate clears — any
   RLS hardening here would be thrown away by that same migration, not a durable fix.
2. This is not a `teachers`-specific gap: `public.employees` (`0002_rls.sql` lines 49–53), the intended
   canonical replacement, has the **exact same** fully-open `anon`+`authenticated` policy shape. Hardening
   `teachers` alone while `employees` stays open would not reduce actual risk exposure — a person could
   still read/write the same data through the successor table. This looks like a repo-wide RLS posture
   (open-by-default across most tables) appropriate for the current demo/UAT stage, not something specific
   to the teacher/employee consolidation.

**If Phase 6 is delayed indefinitely**, this open RLS posture should be revisited as a separate,
whole-schema RLS hardening effort — scoped across all tables consistently, not as a one-off fix to
`teachers`. No RLS migration is proposed in this pass since it would not be "clearly safe and necessary"
for the teacher/employee consolidation specifically.

## LATEST AUTOMATED RUN (2026-07-05)

`npm run validate:consolidation` against the live project in `.env`:

| metric | value | passes |
|---|---|---|
| teacher_rows | 8 | — |
| bridged_teacher_rows | 3 | — |
| unresolved_teacher_rows | 5 | **FAIL** |
| faculty_profile_rows | 3 | — |
| bridged_teachers_missing_faculty_profile | 0 | pass |
| unresolved_dual_key_rows | 52 | **FAIL** |

`v_teacher_employee_bridge_summary`: `matched_by_email` = 3, `unresolved_no_employee_match` = 5.

`v_teacher_consolidation_dual_key_gaps` (rows still missing an employee owner): `class_schedules` 3/8, `grade_periods` 14/14, `grades` 6/6, `learning_materials` 17/24, `sections` 8/12, `subject_class_loads` 4/5. `consultation_appointments` and `student_attendance` are fully backfilled (0 gaps) — those two tables have very little legacy data yet.

`v_teacher_consolidation_retirement_readiness.ready_for_phase_6`: **`false`**.

`npm run test:e2e -- tests/e2e/teacher-employee-consolidation.spec.ts` (read-only browser checks): **6/7 passing**. The one failure is a direct symptom of the bridge gap above: the demo `teacher@stsn.edu.ph` account resolves to teacher row "Beatriz Cruz" (matched via `user_id`), whose `employee_id` is `null` — so Faculty Portal's accrued-leave tile renders the `"— Days"` unresolved-fallback instead of a real balance. This is a data gap, not an app bug: `resolveEmployeeForTeacher()` is working as designed, there's just no bridged employee for this teacher yet.

**Conclusion: Phase 5 is not signed off. Do not proceed to Phase 6 until the 5 unresolved teacher rows are reconciled (see Data Validation below) and dual-key backfill is re-run for their owned rows.**

## LATEST AUTOMATED RUN (2026-07-06)

Re-verified live against the project in `.env` during Phase 6 blocker remediation. The bridge/backfill
gap reported on 2026-07-05 has since been closed by
`supabase/migrations/20260705148000_demo_teacher_employee_bridge_cleanup.sql`.

`npm run validate:consolidation`:

| metric | value | passes |
|---|---|---|
| teacher_rows | 8 | — |
| bridged_teacher_rows | 8 | pass |
| unresolved_teacher_rows | 0 | **pass** |
| faculty_profile_rows | 8 | — |
| bridged_teachers_missing_faculty_profile | 0 | pass |
| unresolved_dual_key_rows | 0 | **pass** |

`v_teacher_employee_bridge_summary`: `matched_by_email` = 6, `matched_by_user_id` = 2, no
`unresolved_no_employee_match` rows remain.

`v_teacher_consolidation_retirement_readiness.ready_for_phase_6`: **`true`**.

`npm run test:e2e -- tests/e2e/teacher-employee-consolidation.spec.ts`: **7/7 passing** (previously 6/7
on 2026-07-05; the one prior failure was the accrued-leave fallback for the then-unbridged demo
`teacher@stsn.edu.ph` account, which is now resolved since that teacher is bridged).

**This closes the DB-level bridge/backfill gate. It does not by itself clear Phase 6** — see "Mutation
UAT Required Before Phase 6" below and the retirement runbook's signoff section, both still open.

## Mutation UAT Required Before Phase 6

An **automated** mutation UAT now exists: `tests/e2e/teacher-employee-consolidation-mutation.spec.ts`
(added 2026-07-06). It drives each of the four write flows through the app UI, then queries Supabase to
confirm the employee-ownership column was populated on the touched row, and cleans up the rows it
created. It is fenced behind a hard safety guard (`tests/e2e/helpers/mutation-uat.ts`):

- Skips unless `ALLOW_MUTATION_UAT=true`.
- Skips unless `MUTATION_UAT_TARGET` is one of `local | demo | uat | test`.
- Refuses to run if `VITE_SUPABASE_URL` looks like a production project (`prod`/`production`/`live`).
- Verifies via a service-role client when `SUPABASE_SERVICE_ROLE_KEY` is present, else the anon client.

Run it (only against a safe DB):

```bash
ALLOW_MUTATION_UAT=true MUTATION_UAT_TARGET=demo npm run test:e2e:consolidation:mutation
```

> **NOT executed in the 2026-07-06 automated pass.** The `.env` in this repo points at the single shared
> demo/UAT Supabase project, and no `MUTATION_UAT_TARGET` / safe throwaway DB was configured. Running the
> writes there was declined per this document's own no-un-cleaned-rows-in-the-shared-project rule. The
> results below are therefore **PENDING execution in a safe UAT/local database** and an automated agent
> cannot serve as the human "Verified by" / UAT Owner this gate requires.

- [ ] Create/update schedule
  - Expected: `class_schedules.employee_id` is populated
  - Result: PENDING (not executed — safe DB not configured)
  - Verified row/id:
  - Verified by: Playwright mutation UAT (pending run)
  - Date:
- [ ] Submit attendance
  - Expected: `student_attendance.recorded_by_employee_id` is populated
  - Result: PENDING (not executed — safe DB not configured)
  - Verified row/id:
  - Verified by: Playwright mutation UAT (pending run)
  - Date:
- [ ] Create consultation
  - Expected: `consultation_appointments.employee_id` is populated
  - Result: PENDING (not executed — safe DB not configured)
  - Verified row/id:
  - Verified by: Playwright mutation UAT (pending run)
  - Date:
- [ ] Save/update grade
  - Expected: `student_grade_entries.employee_id` is populated **(ownership target changed 2026-07-06 — see architecture note below; was `grades.employee_id`)**
  - Result: PENDING (write-path blocker fixed; not executed — safe DB not configured)
  - Verified row/id:
  - Verified by: Playwright mutation UAT (pending run)
  - Date:

**Grade-flow blocker RESOLVED 2026-07-06 (Option B — canonical target = `student_grade_entries`).**
The grade-flow blocker was: the grade-encoding UI (`GradeEncodingPage` → `GradeInputView` →
`GradeSheetTable` → `GradeCellInput`) writes **only** `student_grade_entries` via `saveGradeEntry()`, while
the store's `saveGrade()` — the *only* writer of the flat `grades` table — is dead code (its lone caller,
`src/pages/GradingModule.tsx`, exists solely in a stale nested `Desktop/stsn-connect/` copy, not the active
app). So no reachable UI path produces a `grades` row.

Investigation confirmed `student_grade_entries` (+ `grade_periods`/`grade_items`/`grade_categories`) is the
**canonical active grade write/compute/approve model**: `GradesDirectoryPage`, `computePeriodGrade`, and the
principal approval queue all read `student_grade_entries` + `grade_periods` and never touch `grades`. The
flat `grades` table is legacy/backfill-only (read solely by the Student Portal for display). Forcing the
encoding UI onto `grades` would require mapping the per-item/period model onto `midterm_grade`/`final_grade`
— a non-deterministic, conflict-prone refactor. So we chose **Option B**:

- Migration `20260706130000_student_grade_entries_employee_ownership.sql` adds
  `student_grade_entries.employee_id` (FK → `employees`, `on delete set null`), backfills it from each
  entry's parent `grade_periods` owner, and extends `v_teacher_consolidation_dual_key_gaps` to track the
  canonical grade table (its legacy owner is the parent period's `teacher_id`).
- `store.saveGradeEntry()` and `store.addGradeItem()` now stamp `employee_id` (from the period's owner →
  teacher bridge → signed-in user) on every entry they write.
- The mutation spec's grade test now drives a real score edit on the **Grade Input** tab and asserts the
  exact touched `student_grade_entries` row carries `employee_id` (matching the signed-in faculty's
  employee), then restores the row's original score.

Existing-row backfill already populated all 6/6 legacy `grades` rows and all `student_grade_entries` rows,
but that is data migration, not write-path proof — closing that gap for the canonical table is exactly what
this fixed UAT flow now verifies once run against a safe DB. `public.grades`, `teacher_id`, and all legacy
columns remain in place (no Phase 6 retirement in this change).

Verification queries (schema-corrected 2026-07-06): the mutation spec uses the real column names in this
schema: `class_schedules.day` (not `day_of_week`) and `class_schedules.section` (text, not `section_id`);
`student_attendance.date` (not `attendance_date`); the grade flow now verifies
`student_grade_entries.employee_id` (the canonical grade write table), not `grades.midterm_grade`.

### Mutation UAT Signoff

- UAT Owner:
- UAT Date:
- Approved for Phase 6: No
- Notes:
  - Automated mutation spec implemented and discoverable (4 flows), but **not executed** in the
    2026-07-06 pass — no safe `MUTATION_UAT_TARGET` DB was configured and the repo `.env` points at the
    shared demo project. Execute it against a local/demo/uat/test Supabase with `ALLOW_MUTATION_UAT=true`
    and record Result / Verified row / Date per flow before checking any box.
  - The grade flow write-path blocker is **FIXED** (2026-07-06, Option B): the canonical grade write
    table `student_grade_entries` now carries `employee_id`, stamped by `saveGradeEntry()`/`addGradeItem()`,
    and the mutation spec verifies it. It remains **PENDING execution** against a safe DB like the other
    three flows — being executable is not the same as executed/verified by a human.
  - Human approval is still required separately: an automated agent cannot be the "Verified by" / UAT
    Owner, and `Approved for Phase 6` stays **No** until a named human signs off.

## Data Validation

- [x] Confirm `v_teacher_consolidation_validation_summary` shows `unresolved_teacher_rows = 0`. **Passing as of 2026-07-06 — was 5, now 0.**
- [x] Confirm `v_teacher_consolidation_validation_summary` shows `bridged_teachers_missing_faculty_profile = 0`. **Passing.**
- [x] Confirm `v_teacher_consolidation_validation_summary` shows `unresolved_dual_key_rows = 0`. **Passing as of 2026-07-06 — was 52, now 0.**
- [x] Review `v_teacher_employee_bridge_audit` for any remaining `unresolved_*` bridge statuses. **None remain — all 8 teachers are now `matched_by_email` (6) or `matched_by_user_id` (2) per `20260705148000_demo_teacher_employee_bridge_cleanup.sql`.**
- [ ] Review `v_unlinked_employees_for_teacher_consolidation` for employees that should have faculty coverage but are still unbridged. Not re-run in this pass — out of scope for the bridge-gap fix (that view tracks the reverse direction: employees without a teacher counterpart, not teachers without an employee).

## Faculty Portal

- [x] Sign in as a teaching user with a bridged `teachers.employee_id`. Automated (`teacher-employee-consolidation.spec.ts`) — **the default `teacher@stsn.edu.ph` demo account is now bridged (to Arthur Reyes, post identity-mismatch correction).**
- [x] Confirm the faculty portal loads without relying on email-only linkage. Loads; accrued leave now resolves to a real balance for the demo account (7/7 passing as of 2026-07-06).
- [ ] Confirm teaching load, schedules, and grade queues still show only the active faculty member's records. Page renders (automated); scoping *correctness* for a bridged account still needs a human pass — rendering without error is not the same as verifying the row set is exactly right.
- [ ] Confirm attendance submission writes both legacy and employee ownership during the dual-key phase. Still requires a mutation test — see "Mutation UAT Required Before Phase 6" above; not automated in this pass (no safe test-data/cleanup pattern exists yet).

## Scheduling And Sectioning

- [ ] Create a class schedule for a bridged faculty member. Still requires a mutation test — see "Mutation UAT Required Before Phase 6" above.
- [ ] Confirm the saved schedule includes employee-backed ownership.
- [ ] Confirm schedule conflict detection still works for the same faculty member across overlapping times.
- [ ] Assign a class adviser through scheduling or sectioning.
- [ ] Confirm the section keeps `adviser_id` and `adviser_employee_id` aligned.
- [x] Module renders for an admin session. Automated (`teacher-employee-consolidation.spec.ts`).

## Grading

- [x] Open Grade Encoding as a bridged faculty user. Page renders (automated); demo account is now bridged.
- [ ] Confirm only that faculty member's class loads appear. Renders correctly (automated); a human pass is still worthwhile to confirm the exact row set.
- [ ] Save or update a grade and confirm the canonical entry keeps employee ownership. Write-path blocker **fixed 2026-07-06 (Option B)**: the active grade table is `student_grade_entries` (not the legacy flat `grades` table), and `saveGradeEntry()`/`addGradeItem()` now stamp `student_grade_entries.employee_id`. Automated mutation test verifies the exact touched row — see "Mutation UAT Required Before Phase 6" above; still PENDING execution against a safe DB. Note: all 6/6 legacy `grades` rows and all `student_grade_entries` rows are backfilled, but that's existing-row backfill, not proof that a *new* grade save stamps ownership — which the fixed test now covers.
- [ ] Confirm grade directory filters still scope correctly for teacher sessions.

## Consultation

- [ ] Create a consultation request for a bridged faculty member. Still requires a mutation test — see "Mutation UAT Required Before Phase 6" above.
- [ ] Confirm the stored row includes both `teacher_id` and `employee_id`.
- [ ] Confirm pending and confirmed consultation lists still show the correct faculty label.
- [ ] Confirm employee-backed scoping still works when `employee_id` is present on the appointment.
- [x] Module renders and lists appointments. Automated (`teacher-employee-consolidation.spec.ts`).

## Profiles

- [x] Open My Profile as a bridged faculty user. Page renders (automated); demo account is now bridged.
- [ ] Confirm employee-backed profile details resolve before email fallback. Renders correctly (automated); a human pass is still worthwhile.
- [ ] Open the HR employee profile workspace for a bridged teacher/employee pair.
- [ ] Confirm the linked faculty indicator is driven by explicit bridge data when available.

## Retirement Readiness

- [x] Confirm `v_teacher_consolidation_retirement_readiness.ready_for_phase_6` is `true` before any destructive migration is approved. **Automated via `npm run validate:consolidation` — now `true` as of 2026-07-06.**
- [ ] Confirm no remaining app flows depend on `teachers(first_name,last_name)` relational selects. No `.from('teachers')` relational select found anywhere in `src/` during the 2026-07-06 blocker-remediation audit. One SQL object, `public.admin_dashboard_kpis.total_teachers`, still read `public.teachers` directly and has been repointed to `employee_faculty_profiles`/`employees` via `supabase/migrations/20260706120000_admin_dashboard_kpis_employee_teacher_count.sql` — apply that migration to close this item.
- [x] Confirm no unresolved manual bridge cases remain in UAT notes. **0 teacher rows are `unresolved_no_employee_match` as of 2026-07-06 (was 5).**

**DB-level and read-only gates are now clean. Phase 6 remains blocked on: (1) applying the `admin_dashboard_kpis` migration above, (2) the Mutation UAT signoff above, and (3) the retirement runbook's human signoff — see `docs/TEACHERS_TO_EMPLOYEES_RETIREMENT_RUNBOOK.md`.**

## Signoff

- UAT owner:
- Date:
- School / scope tested:
- Blocking issues: mutation UAT not yet performed/signed off; `admin_dashboard_kpis` migration not yet applied to the live project; retirement runbook signoff not yet recorded.
- Approved for Phase 6: `no` — no explicit human approval exists in this repo as of 2026-07-06.

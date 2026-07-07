# Demo Teacher Reset Plan — Bridge the 5 Unresolved Teachers via Employees

Status: **for review only. Nothing in this pass has been executed.**
Full SQL: [TEACHERS_TO_EMPLOYEES_DEMO_RESET.sql](TEACHERS_TO_EMPLOYEES_DEMO_RESET.sql)
Builds on: [TEACHERS_TO_EMPLOYEES_BRIDGE_RECONCILIATION_REPORT.md](TEACHERS_TO_EMPLOYEES_BRIDGE_RECONCILIATION_REPORT.md), [TEACHERS_TO_EMPLOYEES_IDENTITY_MISMATCH_CORRECTION.md](TEACHERS_TO_EMPLOYEES_IDENTITY_MISMATCH_CORRECTION.md), [TEACHERS_TO_EMPLOYEES_CONSOLIDATION_PLAN.md](TEACHERS_TO_EMPLOYEES_CONSOLIDATION_PLAN.md)

All facts below were re-verified read-only against the live project immediately before writing this
plan (`npm run validate:consolidation` plus direct `select`s against `teachers`, `users`, `employees`,
`schools`) — nothing has drifted since the 2026-07-05 reports above were written.

## 1. Recommended strategy

**Preserve + remap, not delete + reseed.** The 52 dependent rows owned by these 5 teachers are not
corrupt, orphaned, or duplicated — they are real, non-overlapping demo academic data (Arthur's College
IT sections/schedules, Beatriz's Basic Ed Grade 7–12 sections, plus lighter footprints for Carlo, Elena,
and Fe). The only two actual defects are:

1. **A missing bridge** — 5 of 8 `teachers` rows have no `employees` counterpart, so the app's
   employee-primary logic can't resolve them (this is a coverage gap, not bad data).
2. **A seed copy/paste bug** — `teach-beatriz.user_id` points at the login named "Prof. Arthur Reyes"
   (`teacher@stsn.edu.ph`), instead of `teach-arthur.user_id`. This is a metadata swap, not a data
   integrity problem — fixing it means re-pointing two `user_id` values and giving Beatriz her own
   login, not deleting anything.

Deleting and reseeding the dependent rows would destroy real, still-referenced demo academic history
(grades, schedules, materials) to fix what is actually a two-line linkage bug plus a five-row coverage
gap. Remapping is strictly less destructive and fully reversible.

## 2. Tables affected

| Table | Operation |
|---|---|
| `public.users` | 1 new row (Beatriz's own login) |
| `public.teachers` | `user_id` re-pointed (2 rows), `employee_id` set (5 rows) |
| `public.employees` | 5 new rows (Arthur, Beatriz, Carlo, Elena, Fe) |
| `public.employee_faculty_profiles` | 5 new rows (backfilled via existing idempotent Phase 2 insert) |
| `public.security_user_role_assignments` | 1 new row (Beatriz's TEACHER role) |
| `public.sections` (`adviser_employee_id`) | up to 8 rows backfilled |
| `public.class_schedules` (`employee_id`) | up to 3 rows backfilled |
| `public.subject_class_loads` (`employee_id`) | up to 4 rows backfilled |
| `public.grade_periods` (`employee_id`) | up to 14 rows backfilled |
| `public.grades` (`employee_id`) | up to 6 rows backfilled |
| `public.learning_materials` (`employee_id`) | up to 17 rows backfilled |
| `public.student_attendance`, `public.consultation_appointments` | 0 rows (no legacy ownership from these 5 teachers exists in either table today) |

No row is deleted. No column or table is dropped. `public.teachers` is not touched beyond `user_id` /
`employee_id` on the 5 rows in scope.

## 3. Row counts before cleanup (live, re-verified 2026-07-05)

Per-teacher dependent-row ownership (`teacher_id` / `adviser_id` / `recorded_by`):

| Teacher | sections (adviser) | class_schedules | subject_class_loads | grade_periods | grades | learning_materials | student_attendance | consultation_appointments |
|---|---|---|---|---|---|---|---|---|
| Arthur Reyes | 4 | 3 | 2 | 6 | 2 | 5 | 0 | 0 |
| Beatriz Cruz | 4 | 0 | 2 | 8 | 3 | 6 | 0 | 0 |
| Carlo Vergara | 0 | 0 | 0 | 0 | 1 | 1 | 0 | 0 |
| Elena Soriano | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 |
| Fe Domingo | 0 | 0 | 0 | 0 | 0 | 3 | 0 | 0 |
| **Total** | **8** | **3** | **4** | **14** | **6** | **17** | **0** | **0** |

These totals match `v_teacher_consolidation_dual_key_gaps.missing_employee_owner_rows` exactly (verified
live via `npm run validate:consolidation` just before writing this plan: `unresolved_teacher_rows = 5`,
`unresolved_dual_key_rows = 52` = 8+3+4+14+6+17). No count in the prior reports has changed.

Current identity/linkage state (confirmed live, matches the identity mismatch report exactly):

| teacher | `user_id` | `employee_id` |
|---|---|---|
| teach-arthur | `null` | `null` |
| teach-beatriz | `36a0b95e-...` (bug: this is `teacher@stsn.edu.ph`'s user, i.e. "Prof. Arthur Reyes") | `null` |
| teach-carlo | `null` | `null` |
| teach-elena | `null` | `null` |
| teach-fe | `null` | `null` |

No `users` row exists yet for `beatriz.cruz@stsn.edu.ph`. No `employees` row exists yet for any of the 5
teacher emails.

## 4. Approach taken (per your preferred approach)

- **Preserve dependent academic records** — no deletes anywhere in this script.
- **Create clean `employees` rows** for all 5 teachers, using their existing `teachers` data
  (name/email/department/school) as the source, plus `employees.user_id` set where a login exists —
  this makes the new employee rows immediately canonical, not just bridge placeholders.
- **Create `employee_faculty_profiles` rows** for all 5, by re-running the exact idempotent
  `insert ... on conflict` already shipped in
  [20260705142000_employee_faculty_profiles.sql](/C:/Users/VELOSO/Documents/GitHub/stsn-connect/supabase/migrations/20260705142000_employee_faculty_profiles.sql) —
  no new SQL needed here, it already backfills from any `teachers` row with a non-null `employee_id`.
- **`teachers.employee_id` set as temporary compatibility** only — `public.teachers` is not dropped,
  no FK to it is dropped, nothing about Phase 6 is started.
- **Backfill `employee_id` on dependent records** by re-running the exact idempotent `update ... where
  employee_id is null` statements already shipped in
  [20260705143000_academic_employee_ownership_columns.sql](/C:/Users/VELOSO/Documents/GitHub/stsn-connect/supabase/migrations/20260705143000_academic_employee_ownership_columns.sql) and
  [20260705144000_attendance_consultation_employee_ownership.sql](/C:/Users/VELOSO/Documents/GitHub/stsn-connect/supabase/migrations/20260705144000_attendance_consultation_employee_ownership.sql).
  These already ran once for the 3 already-bridged teachers (guarded by `is null`), so re-running them
  now only reaches the 52 rows blocked behind these 5 teachers — nothing already-bridged is re-touched.
- **Login correction**: `teacher@stsn.edu.ph` → re-pointed to `teach-arthur` (matches the login's own
  display name, "Prof. Arthur Reyes"). Beatriz gets her own new login
  (`beatriz.cruz@stsn.edu.ph`) with an explicit RBAC role assignment, because she owns a real,
  independent 23-row academic footprint (4 sections + 2 loads + 8 grade periods + 3 grades + 6
  materials) and nothing else in this seed leaves a data-owning teacher without a way to log in. Carlo,
  Elena, and Fe have no `teachers.user_id` today and none is created for them — nothing in scope asked
  for new logins for them, and creating unrequested ones would be scope creep.

## 5. Reviewable SQL script

See [TEACHERS_TO_EMPLOYEES_DEMO_RESET.sql](TEACHERS_TO_EMPLOYEES_DEMO_RESET.sql). Kept out of
`supabase/migrations/` until approved, matching the convention already used for the identity-mismatch
correction script. Structure:

0. Guard block — aborts the whole transaction if any of the 5 teachers already has `employee_id` set,
   if the Beatriz/Arthur `user_id` swap no longer matches the known state, or if a
   `beatriz.cruz@stsn.edu.ph` user already exists. Prevents double-applying.
1. Identity-mismatch fix (verbatim from the already-reviewed
   [TEACHERS_TO_EMPLOYEES_IDENTITY_MISMATCH_CORRECTION.sql](TEACHERS_TO_EMPLOYEES_IDENTITY_MISMATCH_CORRECTION.sql)):
   create Beatriz's login, re-point both `teachers.user_id` values, add her RBAC assignment.
2. Five `insert into employees ... returning id` blocks (one per teacher), each immediately followed by
   `update teachers set employee_id = ...`. Uses real values from the bridge reconciliation report
   (school, department, position, specialization-derived title); `salary` stays `0` as a placeholder,
   consistent with the reconciliation report's original recommendation.
3. Re-run the Phase 2 `employee_faculty_profiles` backfill insert (idempotent, `on conflict (employee_id)
   do update`).
4. Re-run the Phase 3 dual-key backfill updates for all 8 dependent-table columns (idempotent, `where
   ... employee_id is null`).

## 6. Rollback SQL / recovery notes

Because every Phase 3 employee-based column was added with `on delete set null` (and
`employee_faculty_profiles.employee_id` with `on delete cascade`), deleting the 5 new `employees` rows
automatically and safely unwinds step 2–4 in one shot:

```sql
begin;

-- Cascades: employee_faculty_profiles rows deleted (on delete cascade),
-- teachers.employee_id set null (on delete set null),
-- and every *_employee_id / adviser_employee_id / recorded_by_employee_id
-- column pointing at these 5 employees set null (on delete set null).
-- Legacy teacher_id/adviser_id/recorded_by columns are untouched throughout.
delete from public.employees
where email in (
  'arthur.reyes@stsn.edu.ph',
  'beatriz.cruz@stsn.edu.ph',
  'carlo.vergara@stsn.edu.ph',
  'elena.soriano@stsn.edu.ph',
  'fe.domingo@cdsta.edu.ph'
);

-- Reverse the identity-mismatch fix (steps 2-4 of block 1), restoring the
-- original (buggy) linkage — only run this if the identity fix itself also
-- needs to be undone, not just the employee creation.
delete from public.security_user_role_assignments a
using public.users u
where a.user_id = u.id::text
  and u.legacy_id = 'user-beatriz-teacher';

update public.teachers
set user_id = (select id from public.users where legacy_id = 'user-teacher')
where legacy_id = 'teach-beatriz';

update public.teachers
set user_id = null
where legacy_id = 'teach-arthur';

delete from public.users where legacy_id = 'user-beatriz-teacher';

commit;
```

Recovery note: no destructive delete touches `sections`, `class_schedules`, `subject_class_loads`,
`grade_periods`, `grades`, or `learning_materials` at any point — rollback only clears the new
employee-side pointers, never the original teacher-owned data.

## 7. Validation SQL after cleanup

```sql
-- 1. All 8 teachers now bridged, 0 unresolved.
select * from public.v_teacher_employee_bridge_summary order by bridge_status;
-- expect: matched_by_email or equivalent = 8, unresolved_no_employee_match = 0 (or absent)

-- 2. Aggregate readiness metrics.
select * from public.v_teacher_consolidation_validation_summary order by metric_name;
-- expect: unresolved_teacher_rows = 0, bridged_teachers_missing_faculty_profile = 0,
--         unresolved_dual_key_rows = 0, faculty_profile_rows = 8

-- 3. Dual-key gaps closed on every dependent table.
select * from public.v_teacher_consolidation_dual_key_gaps order by table_name;
-- expect: missing_employee_owner_rows = 0 for all 8 tables

-- 4. Retirement readiness gate.
select * from public.v_teacher_consolidation_retirement_readiness;
-- expect: ready_for_phase_6 = true  (DB-level gate only — see §8)

-- 5. Login correction confirmed.
select t.legacy_id, t.first_name, t.last_name, u.email as login_email, u.name as login_display_name
from public.teachers t join public.users u on u.id = t.user_id
where t.legacy_id in ('teach-arthur', 'teach-beatriz');
-- expect: teach-arthur -> teacher@stsn.edu.ph / "Prof. Arthur Reyes"
--         teach-beatriz -> beatriz.cruz@stsn.edu.ph / "Ms. Beatriz Cruz"

-- 6. No teacher shares a user_id with another.
select user_id, count(*) from public.teachers
where user_id is not null group by user_id having count(*) > 1;
-- expect: 0 rows

-- 7. Row counts unchanged on dependent tables (no data lost).
select 'sections' as tbl, count(*) as n from public.sections
union all select 'class_schedules', count(*) from public.class_schedules
union all select 'subject_class_loads', count(*) from public.subject_class_loads
union all select 'grade_periods', count(*) from public.grade_periods
union all select 'grades', count(*) from public.grades
union all select 'learning_materials', count(*) from public.learning_materials;
-- expect: identical totals to pre-run counts (12, 8, 5, 14, 6, 24 — from the live
--         validate:consolidation run), only employee_id columns change, not row counts
```

## 8. Does this clear the teacher-to-employee bridge gap?

**Yes, fully.** All 5 previously-unresolved teachers get a real `employees` row, `teachers.employee_id`
is set for all 8, `employee_faculty_profiles` covers all 8, and the dual-key backfill reaches all 52
previously-blocked rows. `unresolved_teacher_rows`, `bridged_teachers_missing_faculty_profile`, and
`unresolved_dual_key_rows` all go to 0 — the three inputs to `v_teacher_consolidation_retirement_readiness.ready_for_phase_6`
— so that view's DB-level gate flips to `true`.

## 9. Is Phase 6 still blocked after this cleanup?

**Yes — this plan does not start or unblock Phase 6, and shouldn't be read as doing so.** Two independent
reasons:

1. **You explicitly said not to proceed to Phase 6.** This script stops at closing the bridge gap.
2. **The DB gate flipping to `true` is necessary but not sufficient** per
   [TEACHERS_TO_EMPLOYEES_RETIREMENT_RUNBOOK.md](TEACHERS_TO_EMPLOYEES_RETIREMENT_RUNBOOK.md)'s
   preflight conditions and the consolidation plan's Phase 5 status: the mutation-based UAT specs
   (create schedule, submit attendance, create consultation, save grade) still don't exist, and a human
   signoff line in the runbook is still blank. Retirement (dropping `teacher_id`/`adviser_id` columns or
   `public.teachers` itself) requires that separate process signoff regardless of what this script does.

This script is scoped to close the data gap only — it does not touch any legacy FK, does not drop any
column, and does not drop `public.teachers`.

## Explicitly not done in this pass

- No SQL has been executed against the live database.
- No dependent academic row (`sections`, `class_schedules`, `subject_class_loads`, `grade_periods`,
  `grades`, `learning_materials`, `student_attendance`, `consultation_appointments`) is deleted.
- No column or table is dropped.
- Phase 6 is not started.

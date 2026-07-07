# Beatriz Cruz / Arthur Reyes Identity Mismatch — Inspection Report

Status: **investigation complete, no SQL executed**. This is a review document only.
Scope: this issue blocks Phase 5 sign-off and must be resolved before Phase 6 (`docs/TEACHERS_TO_EMPLOYEES_RETIREMENT_RUNBOOK.md`) begins. It does not create employees, does not set `teacher.employee_id`, and does not touch `public.teachers`/`public.employees` schema.

## 1. The user record for `teacher@n.edu.ph`

No such row exists. The demo TEACHER login is actually **`teacher@stsn.edu.ph`** (the `n.edu.ph` in the request appears to be shorthand/typo for `stsn.edu.ph`) — confirmed as the only STSN-school demo teacher account:

| id | legacy_id | email | name | role | school_id | department |
|---|---|---|---|---|---|---|
| `36a0b95e-dff8-49ad-8593-e1fcd8640f8a` | `user-teacher` | `teacher@stsn.edu.ph` | **Prof. Arthur Reyes** | TEACHER | `318fe65e-c2fc-4a7d-9cd8-78d3598fa925` (STSN) | College |

The `users.name` field says "Prof. Arthur Reyes" — that display name is the source of the expectation that this login should resolve to the Arthur Reyes teacher row.

## 2. The teacher row currently linked to that user_id

```sql
select * from public.teachers where user_id = '36a0b95e-dff8-49ad-8593-e1fcd8640f8a';
```

Returns **`teach-beatriz`** — first_name `Beatriz`, last_name `Cruz`, email `beatriz.cruz@stsn.edu.ph`, department `Basic Education`, specialization "General Mathematics & Statistics", advisory_section "St. Thomas". `employee_id` is `null`.

So the login whose display name says "Prof. Arthur Reyes" is currently bound, via `teachers.user_id`, to the **Beatriz Cruz** teacher row — a different person with a different department, different subjects, and a different advisory section.

## 3. The Arthur Reyes teacher row

| id | legacy_id | user_id | email | department | specialization | advisory_section | employee_id |
|---|---|---|---|---|---|---|---|
| `6994b75f-1c3c-4c9b-9825-b3d92b6c3d2c` | `teach-arthur` | **null** | `arthur.reyes@stsn.edu.ph` | College | Information Technology & Computer Networks | BSIT 1-A | null |

Arthur Reyes has **no `user_id` at all** — no login currently resolves to him.

## 4. The Beatriz Cruz teacher row

| id | legacy_id | user_id | email | department | specialization | advisory_section | employee_id |
|---|---|---|---|---|---|---|---|
| `aeef4d4f-b741-45c4-98fd-d478ef6cb176` | `teach-beatriz` | `36a0b95e-dff8-49ad-8593-e1fcd8640f8a` | `beatriz.cruz@stsn.edu.ph` | Basic Education | General Mathematics & Statistics | St. Thomas | null |

## 5. Existing employee rows for Arthur Reyes / Beatriz Cruz

None. Checked `employees` by `last_name ilike '%Reyes%'`, `last_name ilike '%Cruz%'`, and by exact email match on `arthur.reyes@stsn.edu.ph` / `beatriz.cruz@stsn.edu.ph` — no rows for either person.

The only `Cruz` in `employees` is **Danilo Cruz** (`emp-stsn-08`, `danilo.cruz@stsn.edu.ph`, Instructor I — Math Dept., Basic Education, `user_id` null). Department and subject area (Basic Education / Math) are coincidentally close to Beatriz Cruz's teaching assignment, but the first name, email, and employee_no are all distinct and there is no shared `user_id` or email — treat this as an **unrelated existing employee**, not a latent match for Beatriz. Do not bridge them.

Both Arthur Reyes and Beatriz Cruz are part of the 5 teacher rows already flagged `unresolved_no_employee_match` in `v_teacher_employee_bridge_summary` (see UAT checklist). Fixing the identity mismatch below does **not** resolve that bridge gap by itself — it only stops the login from being mis-attached ahead of whenever employee records for these two are eventually created.

## 6. Academic ownership footprint

Row counts by current `teacher_id`/`adviser_id`/`recorded_by`:

| table | column | Arthur Reyes rows | Beatriz Cruz rows |
|---|---|---|---|
| sections | adviser_id | 4 | 4 |
| class_schedules | teacher_id | 3 | 0 |
| subject_class_loads | teacher_id | 2 | 2 |
| grade_periods | teacher_id | 6 | 8 |
| grades | teacher_id | 2 | 3 |
| learning_materials | teacher_id | 5 | 6 |
| student_attendance | recorded_by | 0 | 0 |
| consultation_appointments | teacher_id | 0 | 0 |

**Both teachers own real, substantial, and non-overlapping academic data** (Arthur: College IT courses/sections/schedules; Beatriz: Basic Education Grade 7–12 sections, General Math, Oral Communication). None of these rows have their dual-key `employee_id` / `adviser_employee_id` / `recorded_by_employee_id` populated yet (expected — this is the pre-existing Phase 3 backfill gap, not new).

This is not a duplicate-person situation. These are two distinct, independently-loaded people. The bug is purely that the login's `user_id` was wired to the wrong one of the two.

## Root cause

Found in the original seed data, `supabase/migrations/0003_data.sql` (and duplicated in `combined_migration.sql`):

```sql
-- line 317: the login user, display name says "Prof. Arthur Reyes"
('user-teacher', (select id from public.schools where legacy_id = 'STSN'), 'teacher@stsn.edu.ph', 'Prof. Arthur Reyes', 'TEACHER', true, '', 'College'),

-- line 431: teach-arthur seeded with user_id = NULL
('teach-arthur', ..., NULL, 'Arthur', 'Reyes', 'Panganiban', 'College', 'arthur.reyes@stsn.edu.ph', ...),

-- line 432: teach-beatriz seeded with user_id = user-teacher  <-- BUG
('teach-beatriz', ..., (select id from public.users where legacy_id = 'user-teacher'), 'Beatriz', 'Cruz', 'Soriano', 'Basic Education', 'beatriz.cruz@stsn.edu.ph', ...),
```

The seed author wrote `('user-teacher')` as the third column value on the `teach-beatriz` insert instead of the `teach-arthur` insert directly above it — a copy/paste row-swap. This has been live since the original seed and was carried forward unchanged into `combined_migration.sql`. It predates the Teachers→Employees consolidation work; the consolidation's bridge logic (matches by `user_id` first, then normalized email) simply surfaced it, because:

- Arthur has no `user_id`, so bridge falls back to matching an employee by `arthur.reyes@stsn.edu.ph` — no such employee exists → `unresolved_no_employee_match`.
- Beatriz's `user_id` points at a user whose email is `teacher@stsn.edu.ph`, not `beatriz.cruz@stsn.edu.ph` — email-fallback bridge logic would look for an employee at `teacher@stsn.edu.ph`, which also doesn't exist → `unresolved_no_employee_match`.

This also explains the one failing Playwright check noted in the UAT log (`teacher@stsn.edu.ph` resolves to "Beatriz Cruz" with no bridged employee, so accrued leave renders the unresolved fallback).

## 7. Which row should keep the `teacher@stsn.edu.ph` user_id

**`teach-arthur`.** The login's `users.name` is literally "Prof. Arthur Reyes"; the teacher row's own `email` (`arthur.reyes@stsn.edu.ph`) matches the person named in the login. Beatriz Cruz's teacher row was never the intended owner of this login — it received the `user_id` only because of the seed copy/paste bug.

## 8. Does Beatriz Cruz need her own user account?

**Yes — a new account, not a cleared `user_id`.** Beatriz owns a real, independent academic footprint (12 sections/loads/materials/grades across Basic Education) that is distinct from Arthur's. Clearing her `user_id` to `null` would leave her with no login at all, which:

- breaks the one Playwright UAT check that currently depends on `teacher@stsn.edu.ph` resolving to *some* teacher with real data (it would just move the "no bridged employee" symptom rather than fix the underlying "wrong person" bug), and
- removes any way to exercise Beatriz's own grading/scheduling/consultation data end-to-end in future UAT, which the consolidation plan's Phase 5 checklist still needs (mutation-based specs are not yet built).

I checked how login actually works (`src/components/LoginOverlay.tsx`, `src/services/store.ts:730`): this app has no Supabase Auth — `login(email)` just looks up `public.users` by lowercase email match and accepts the fixed demo password `"password123"`. So "a separate user account" is a plain `insert into public.users`, nothing more (no Supabase Auth user object, no password hash to manage).

I also checked RBAC role resolution (`getPrimaryRoleCode` in `src/services/securityPermissionService.ts:61`): it reads `security_user_role_assignments` by `user_id` and falls back to `users.role` if no assignment row exists. The original Arthur/demo user has an explicit assignment row (`security_user_role_assignments`, role TEACHER, school STSN, `is_primary=true`, `is_active=true`, seeded by the RBAC backfill in `20260701120000_security_rbac_schema.sql:385`). A brand-new user row would have no assignment row and would fall back to `users.role = 'TEACHER'`, which still resolves correctly — but for consistency with every other user in this system I've included an explicit assignment insert for the new Beatriz account in the script below (optional but recommended).

## Recommended correction

1. Create a new `public.users` row for Beatriz Cruz, reusing her own teacher-record email (`beatriz.cruz@stsn.edu.ph`) as her login, same school (STSN) and department (Basic Education) as her teacher row.
2. Re-point `teachers.user_id`:
   - `teach-arthur.user_id` → the existing `teacher@stsn.edu.ph` user id (`36a0b95e-...`)
   - `teach-beatriz.user_id` → the new user id created in step 1
3. Add a matching `security_user_role_assignments` row for the new user (TEACHER role, STSN school, primary/active) so RBAC resolution is explicit rather than relying on the `users.role` fallback.
4. Leave `teacher.employee_id`, `public.employees`, and all dual-key `employee_id` columns untouched — those remain blocked behind the separate, larger 5-teacher bridge gap and are explicitly out of scope for this fix.

No row is deleted. No academic ownership rows (`sections`, `class_schedules`, `grade_periods`, `grades`, `learning_materials`) need to change — they already point at the correct `teacher_id` for the correct person; only the `teachers.user_id` login-linkage was wrong.

## Reviewable SQL (NOT executed)

```sql
begin;

-- 1. Create Beatriz Cruz's own login. Reuses her teacher record's own email
--    and department so it doesn't collide with the existing teacher@stsn.edu.ph
--    account (unique constraint on users.email).
insert into public.users (
  legacy_id, school_id, email, name, role, is_active, avatar_url, department
) values (
  'user-beatriz-teacher',
  (select school_id from public.teachers where legacy_id = 'teach-beatriz'),
  'beatriz.cruz@stsn.edu.ph',
  'Ms. Beatriz Cruz',
  'TEACHER',
  true,
  '',
  (select department from public.teachers where legacy_id = 'teach-beatriz')
)
returning id;
-- capture the returned id as :beatriz_user_id for the statements below,
-- or inline the same "select id from public.users where legacy_id = 'user-beatriz-teacher'"
-- subselect as done here.

-- 2. Re-point teach-arthur to the existing demo login (currently null).
update public.teachers
set user_id = (select id from public.users where legacy_id = 'user-teacher')
where legacy_id = 'teach-arthur';

-- 3. Re-point teach-beatriz to her new, dedicated login (currently the
--    misassigned teacher@stsn.edu.ph id).
update public.teachers
set user_id = (select id from public.users where legacy_id = 'user-beatriz-teacher')
where legacy_id = 'teach-beatriz';

-- 4. Give the new user an explicit RBAC role assignment, mirroring the
--    pattern used by the original RBAC backfill (20260701120000, section 11).
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
```

Notes on the script:
- Wrapped in a single transaction so it's all-or-nothing.
- Step 1's `insert ... returning id` is shown for review clarity; in practice steps 2–4 re-select the id by `legacy_id` so the whole script can run as one batch without needing to capture a variable between statements.
- Nothing in this script touches `teachers.employee_id`, `public.employees`, or any `*_employee_id` / `adviser_employee_id` / `recorded_by_employee_id` dual-key column.
- Nothing in this script touches `sections`, `class_schedules`, `subject_class_loads`, `grade_periods`, `grades`, `learning_materials`, `student_attendance`, or `consultation_appointments` — their existing `teacher_id`/`adviser_id`/`recorded_by` values already point at the correct person and don't need to change.

## Risks

- **Demo credential change**: after this runs, logging in as `teacher@stsn.edu.ph` will show Arthur Reyes's IT/College data instead of Beatriz's Basic Education data. Anyone who has bookmarked expectations around "the demo teacher login shows Grade 7–12 sections" will see different data after the fix. This is the intended correction, but worth flagging to anyone running manual demos.
- **New credential surface**: `beatriz.cruz@stsn.edu.ph` becomes a second working demo teacher login (same fixed password `password123`, per `LoginOverlay.tsx`). If demo credentials are documented anywhere external, that list needs a new entry.
- **`security_user_role_assignments.user_id` is `text`, not a real FK** (schema stores `users.id::text`, no foreign-key constraint). A typo in the subselect would silently insert an orphaned assignment row rather than fail loudly — the script above avoids this by always deriving the id via `legacy_id` lookups rather than hardcoding UUIDs.
- **No unique constraint on `teachers.user_id`** currently — so this update can't collide, but it also means nothing in the schema would have caught this seed bug automatically. Worth considering a `unique` constraint on `teachers.user_id` once all 8 teacher rows are correctly resolved, so this class of bug can't silently recur. (Out of scope for this fix — just a forward-looking note.)
- **Playwright / validate:consolidation impact**: `tests/e2e/teacher-employee-consolidation.spec.ts` and `npm run validate:consolidation` both currently encode the *old*, broken state (teacher@stsn.edu.ph → Beatriz Cruz, unbridged). After this fix, re-running them should still show `ready_for_phase_6 = false` (the underlying 5-teacher bridge gap is untouched), but the specific "accrued leave renders unresolved fallback" symptom will now be attached to whichever of Arthur/Beatriz is signed in, not swapped.

## Validation queries to run after correction

```sql
-- 1. Confirm the demo login now resolves to Arthur Reyes.
select t.legacy_id, t.first_name, t.last_name, t.email, u.email as login_email, u.name as login_display_name
from public.teachers t
join public.users u on u.id = t.user_id
where u.email = 'teacher@stsn.edu.ph';
-- expect: teach-arthur / Arthur / Reyes / arthur.reyes@stsn.edu.ph

-- 2. Confirm Beatriz now has her own, distinct login.
select t.legacy_id, t.first_name, t.last_name, u.email as login_email, u.name as login_display_name
from public.teachers t
join public.users u on u.id = t.user_id
where t.legacy_id = 'teach-beatriz';
-- expect: teach-beatriz / Beatriz / Cruz / beatriz.cruz@stsn.edu.ph

-- 3. Confirm no teacher row is left with a null user_id that previously had one,
--    and no two teacher rows share a user_id.
select user_id, count(*) from public.teachers where user_id is not null group by user_id having count(*) > 1;
-- expect: 0 rows

-- 4. Confirm the new user has an active RBAC role assignment.
select u.email, r.code as role_code, a.is_primary, a.is_active
from public.users u
join public.security_user_role_assignments a on a.user_id = u.id::text
join public.security_roles r on r.id = a.role_id
where u.legacy_id = 'user-beatriz-teacher';
-- expect: 1 row, TEACHER, is_primary=true, is_active=true

-- 5. Re-run the existing bridge/validation views to confirm this change didn't
--    regress anything else (both teachers should still show unresolved_no_employee_match
--    until real employee records are created for them — that's expected and out of scope here).
select * from public.v_teacher_employee_bridge_summary order by bridge_status;
select * from public.v_teacher_consolidation_validation_summary order by metric_name;
```

## Explicitly not done in this pass

- No SQL above has been executed against the live database.
- No employee rows created for Arthur Reyes or Beatriz Cruz.
- No `teachers.employee_id` values set.
- No columns or tables dropped.
- Phase 6 remains not started.

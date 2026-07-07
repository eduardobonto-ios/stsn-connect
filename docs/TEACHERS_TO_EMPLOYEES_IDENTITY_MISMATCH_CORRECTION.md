# Beatriz Cruz / Arthur Reyes Identity Mismatch — Final Correction Package

Status: **for review only. Not executed.** Run only on explicit approval.

Full SQL: [TEACHERS_TO_EMPLOYEES_IDENTITY_MISMATCH_CORRECTION.sql](TEACHERS_TO_EMPLOYEES_IDENTITY_MISMATCH_CORRECTION.sql)
Prior inspection: [TEACHERS_TO_EMPLOYEES_IDENTITY_MISMATCH_REPORT.md](TEACHERS_TO_EMPLOYEES_IDENTITY_MISMATCH_REPORT.md)

This package intentionally does **not** touch `public.employees`, `teachers.employee_id`, any `*_employee_id`/`adviser_employee_id`/`recorded_by_employee_id` dual-key column, or any table/column drop. Phase 6 remains not started.

## 1. Final SQL script

See [TEACHERS_TO_EMPLOYEES_IDENTITY_MISMATCH_CORRECTION.sql](TEACHERS_TO_EMPLOYEES_IDENTITY_MISMATCH_CORRECTION.sql). Summary of the four statements, all wrapped in one transaction with a leading safety guard:

0. Guard `do $$ ... $$` block — aborts the whole script if `teach-beatriz.user_id` no longer equals the known-buggy value, or if a `beatriz.cruz@stsn.edu.ph` user already exists. Prevents double-applying or applying against drifted state.
1. `insert into public.users ...` — creates Beatriz Cruz's own login.
2. `update public.teachers ... where legacy_id = 'teach-arthur'` — gives Arthur the existing demo login.
3. `update public.teachers ... where legacy_id = 'teach-beatriz'` — moves Beatriz off Arthur's user_id onto her new one.
4. `insert into public.security_user_role_assignments ...` — explicit TEACHER role assignment for Beatriz's new user.

## 2. Explanation of each SQL block

**Block 0 — Guard.** Re-checks the exact mismatch this script targets before mutating anything. If someone already partially fixed this by hand, or the data has otherwise moved on, the transaction raises an exception and rolls back with zero effect rather than compounding the problem.

**Block 1 — Create Beatriz's login.**
Whether a separate user row is *required* depends on how "required" is read:
- **Not required by schema**: `teachers.user_id` is nullable with no `NOT NULL` and no `unique` constraint (confirmed in `0001_schema.sql` / `20260705140000_teachers_employee_bridge.sql`), so setting it to `null` would not violate anything.
- **Required to satisfy the correction's intent**: Beatriz Cruz is a real, distinct teacher who currently owns 4 sections, 2 subject_class_loads, 8 grade_periods, 3 grades, and 6 learning_materials — a real academic footprint, not a placeholder. Simply nulling her `user_id` would "fix" the mismatch but leave a real, data-owning teacher with no way to ever log in and see her own data, which nothing else in this seed does intentionally (every other data-owning teacher either already has a login or is a known, tracked bridge gap — not a deliberately login-less row).

Given that, this script creates a dedicated login for her rather than nulling her out. This is the one judgment call in the script — flagged explicitly so it can be overridden before approval (see "Alternative considered" below).

The new row reuses her own teacher record's `email` (`beatriz.cruz@stsn.edu.ph`) and `department` (`Basic Education`) by selecting them from `public.teachers` rather than hardcoding, so it can't drift from her actual teacher record.

**Block 2 — Point Arthur at the existing demo login.** `teach-arthur.user_id` is currently `null`; this sets it to the `id` of the `teacher@stsn.edu.ph` / "Prof. Arthur Reyes" user. That display name already matches Arthur, so no change to `public.users` is needed for him — only the missing link on the `teachers` side.

**Block 3 — Move Beatriz off Arthur's user_id.** Re-points `teach-beatriz.user_id` from the demo-teacher id to her own newly created user's id.

**Block 4 — RBAC assignment for Beatriz.** `getPrimaryRoleCode()` (`src/services/securityPermissionService.ts:61`) resolves role via `security_user_role_assignments` first, falling back to `users.role` only if no active assignment row exists. Every other user in this system got an assignment row from the original RBAC backfill (`20260701120000_security_rbac_schema.sql:385`), which only ran once, historically — a brand-new user row created today would not automatically get one. This block adds it explicitly so Beatriz's role resolution is consistent with everyone else's, rather than silently depending on the fallback. Arthur's assignment row already exists (verified: `user_id=36a0b95e...`, role `TEACHER`, school STSN, `is_primary=true`, `is_active=true`) and needs no change.

## 3. What records will be changed

| table | operation | row(s) affected |
|---|---|---|
| `public.users` | INSERT | 1 new row: `legacy_id='user-beatriz-teacher'`, `email='beatriz.cruz@stsn.edu.ph'`, `name='Ms. Beatriz Cruz'`, `role='TEACHER'` |
| `public.teachers` | UPDATE | `teach-arthur`: `user_id` null → `teacher@stsn.edu.ph`'s user id |
| `public.teachers` | UPDATE | `teach-beatriz`: `user_id` `teacher@stsn.edu.ph`'s user id → her new user's id |
| `public.security_user_role_assignments` | INSERT | 1 new row for the new Beatriz user, role `TEACHER`, school STSN |

Nothing else changes. In particular: no row in `sections`, `class_schedules`, `subject_class_loads`, `grade_periods`, `grades`, `learning_materials`, `student_attendance`, or `consultation_appointments` is touched — their existing `teacher_id`/`adviser_id`/`recorded_by` values already point at the correct person. No `public.employees` row is created or modified. No `teachers.employee_id` value is set.

## 4. Rollback SQL

Included at the bottom of the `.sql` file, commented out so it can't run by accident:

```sql
begin;

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

This restores the exact pre-correction state, including the original bug (Beatriz holding Arthur's login). It is a true rollback, not a "fix forward differently" — use it only if the correction needs to be undone, not as a way to re-run the forward script.

## 5. Validation SQL to run after correction

```sql
-- 1. Demo login now resolves to Arthur Reyes.
select t.legacy_id, t.first_name, t.last_name, t.email, u.email as login_email, u.name as login_display_name
from public.teachers t
join public.users u on u.id = t.user_id
where u.email = 'teacher@stsn.edu.ph';
-- expect: teach-arthur / Arthur / Reyes / arthur.reyes@stsn.edu.ph

-- 2. Beatriz has her own, distinct login.
select t.legacy_id, t.first_name, t.last_name, u.email as login_email, u.name as login_display_name
from public.teachers t
join public.users u on u.id = t.user_id
where t.legacy_id = 'teach-beatriz';
-- expect: teach-beatriz / Beatriz / Cruz / beatriz.cruz@stsn.edu.ph

-- 3. No two teacher rows share a user_id.
select user_id, count(*)
from public.teachers
where user_id is not null
group by user_id
having count(*) > 1;
-- expect: 0 rows

-- 4. Beatriz's new user has exactly one active, primary TEACHER assignment.
select u.email, r.code as role_code, a.is_primary, a.is_active
from public.users u
join public.security_user_role_assignments a on a.user_id = u.id::text
join public.security_roles r on r.id = a.role_id
where u.legacy_id = 'user-beatriz-teacher';
-- expect: 1 row, TEACHER, is_primary=true, is_active=true

-- 5. Arthur's pre-existing assignment is untouched.
select u.email, r.code as role_code, a.is_primary, a.is_active
from public.users u
join public.security_user_role_assignments a on a.user_id = u.id::text
join public.security_roles r on r.id = a.role_id
where u.legacy_id = 'user-teacher';
-- expect: still 1 row, TEACHER, is_primary=true, is_active=true (unchanged)

-- 6. Academic ownership rows are unchanged (sanity check row counts still match
--    the pre-correction footprint — arthurId/beatrizId are the teachers.id values,
--    not the new/changed user ids).
select 'sections' as tbl, count(*) filter (where adviser_id = '6994b75f-1c3c-4c9b-9825-b3d92b6c3d2c') as arthur,
       count(*) filter (where adviser_id = 'aeef4d4f-b741-45c4-98fd-d478ef6cb176') as beatriz
from public.sections
where adviser_id in ('6994b75f-1c3c-4c9b-9825-b3d92b6c3d2c', 'aeef4d4f-b741-45c4-98fd-d478ef6cb176');
-- expect: arthur=4, beatriz=4 (unchanged from the inspection report)

-- 7. Bridge/validation views still reflect the same overall readiness gate
--    (both teachers should still be unresolved_no_employee_match — that's
--    expected and out of scope for this fix).
select * from public.v_teacher_employee_bridge_summary order by bridge_status;
select * from public.v_teacher_consolidation_validation_summary order by metric_name;
```

## 6. Risks / assumptions

- **Judgment call flagged in Block 1**: creating a new user for Beatriz is not schema-mandatory, only recommended. If the intent was actually "just stop Beatriz from using Arthur's login, her data doesn't need a login right now," the correct alternative is a two-line script instead:
  ```sql
  update public.teachers set user_id = (select id from public.users where legacy_id = 'user-teacher') where legacy_id = 'teach-arthur';
  update public.teachers set user_id = null where legacy_id = 'teach-beatriz';
  ```
  This still satisfies requirements 1 and 2 exactly, skips requirement 3/4 entirely (nothing to create), and is trivially reversible. Flagging this so the more conservative option can be chosen instead if preferred — say so and I'll swap the final script.
- **Demo credential change**: after this runs, `teacher@stsn.edu.ph` shows Arthur's College/IT data instead of Beatriz's Basic Education data. Anyone with memorized expectations about what that login shows will see different data.
- **New credential surface**: `beatriz.cruz@stsn.edu.ph` becomes a second working demo teacher login (same fixed password `password123` per `LoginOverlay.tsx`). If demo credentials are documented anywhere outside this repo, that list needs a new entry.
- **`security_user_role_assignments.user_id` is `text` with no FK constraint** — a typo could silently insert an orphaned row. The script avoids hardcoded UUIDs and always derives ids via `legacy_id`/`role code` lookups to reduce that risk, but it's still not a real foreign key at the schema level.
- **No unique constraint on `teachers.user_id`** — this update can't collide with anything, but it also means the schema won't catch this class of bug automatically in the future. Not fixed here (out of scope); worth a follow-up once all 8 teacher rows are correctly resolved.
- **Guard block assumes exact current state.** If anything about `teach-beatriz`, `user-teacher`, or a `beatriz.cruz@stsn.edu.ph` user changes between now and execution, the guard aborts the whole transaction rather than partially applying — re-run the read-only inspection first if execution is delayed.
- **Does not move Phase 5/6 forward.** After this runs, `v_teacher_consolidation_retirement_readiness.ready_for_phase_6` is still expected to be `false` — the broader 5-teacher bridge gap and 52-row dual-key backfill gap are untouched by design.

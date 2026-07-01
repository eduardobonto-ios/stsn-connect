# Page Assignment — Role Permission Save/Upsert Fix

**Area:** User Access & Authority → Page Assignment → Role Rights
**Scope:** Generic role→permission grant persistence. No role, module, or permission is special-cased.
**Date:** 2026-07-01

---

## Root cause

Two independent defects combined to make "enable a permission for a role" silently fail whenever the grant row did **not already exist**:

1. **App layer — errors swallowed, false success.**
   `setRolePermission` (in `src/services/securityPermissionService.ts`) persisted with a
   PostgREST `upsert(..., { onConflict: "role_id,permission_id" })` and only
   `console.error`-logged failures. `commitRolePerms` (in
   `src/features/accounts/pages/PageAssignmentPage.tsx`) then always showed a green
   "Saved" toast and reloaded — so a rejected write looked identical to a successful one.
   The row was never created, but the UI claimed it was.

2. **DB layer — the anon write was blocked / the conflict target could be absent.**
   The app writes with the Supabase **anon key through RLS**; the SQL editor runs
   privileged and **bypasses RLS**. That is why the manual
   `insert ... on conflict (role_id, permission_id) do update` worked but the UI save did
   not. If a `security_*` table has RLS enabled without a permissive policy (e.g. the
   table was created manually/partially, without §7 of `20260701120000`), anon writes
   fail silently — an `UPDATE` matches **0 rows with no error** and an `INSERT` is
   rejected. Separately, the `unique (role_id, permission_id)` constraint used by the
   old `onConflict` path is declared **inline** in `create table if not exists`, so it is
   never added retroactively if the table pre-existed — making `onConflict` fail with
   `42P10` in that scenario.

The net effect: **updates to existing grants sometimes worked, but inserting a missing
grant did not**, and the UI never surfaced why.

---

## Files inspected

| File | Finding |
| --- | --- |
| `src/features/accounts/pages/PageAssignmentPage.tsx` | Role Rights toggles → staged draft → `commitRolePerms`. Draft/dirty logic correct; **module-level permissions (`page_key = null`) are already included** (grouped per module, labeled "Module Access · View"). Saved to the **correct** table via `setRolePermission`. Only defect: no error handling / false success toast. |
| `src/services/securityPermissionService.ts` | `setRolePermission` was `onConflict` upsert with swallowed errors. `computeEffectivePermissions` treats `is_allowed = false` as an explicit deny (removes the key), and derives `modules` from allowed permissions — correct. |
| `src/services/store.ts` | `reloadSecurityPermissions` reloads the whole catalog and recomputes `effectivePermissions` for the current user — no stale-state bug. Login/initialize recompute from the catalog. |
| `src/config/navigation.config.ts` | `getAllowedModules` returns the RBAC effective module set when present. `GUARDIAN_PORTAL` nav item exists; sidebar filters by allowed modules. No hardcoding. |
| `src/config/app-routes.config.ts` | `/guardian-portal` ↔ `GUARDIAN_PORTAL` mapping present and generic. |
| `src/config/permissions.config.ts` | `GUARDIAN_PORTAL` is a valid `STSNModule` with a label. Fallback map unchanged. |
| `supabase/migrations/20260701120000_security_rbac_schema.sql` | Constraint declared inline in `create table if not exists` (not retroactive); permissive RLS in §7 (skipped if the table pre-existed the migration). |

No permission is filtered out by `page_key`, no wrong key is used, and role rights save to
`security_role_permissions` (not `security_user_permission_overrides`). The failure was
persistence + error handling, not selection/mapping.

---

## Broken save behavior (before)

```
toggle ON a permission with no existing grant row
  → setRolePermission upsert(onConflict) via anon key
      → INSERT rejected by RLS  (or 42P10 if constraint absent)
      → error console.error-logged, then discarded
  → commitRolePerms shows "Saved ✓" and reloads
  → row still missing; toggle silently reverts on next load
```

## Fixed save behavior (after)

```
toggle ON a permission
  → setRolePermission:
        SELECT id WHERE role_id = R AND permission_id = P
        if found  → UPDATE is_allowed = true  WHERE id = <found>
        if absent → INSERT (id, role_id = R, permission_id = P, is_allowed = true)
        throw on any DB error
  → commitRolePerms:
        success → reload + "Saved N rights" toast
        failure → reload + "Couldn't save some access rights" (danger) toast

toggle OFF a permission
  → existing row UPDATE is_allowed = false   (existing convention: explicit deny)
     (computeEffectivePermissions removes denied keys from the effective set)
```

The lookup is keyed only by `role_id` + `permission_id`, so it is **fully generic** and
works identically for module-level permissions (`page_key = null`) and page-level ones.
It no longer depends on a DB `ON CONFLICT` constraint, keeps the primary key stable across
toggles, and cannot create duplicate grant rows.

### Code changes

- `src/services/securityPermissionService.ts` — `setRolePermission` rewritten to
  lookup + update/insert and to `throw` on error.
- `src/features/accounts/pages/PageAssignmentPage.tsx` — `commitRolePerms` wrapped in
  `try/catch/finally`; real failures show a `danger` toast instead of a false success.
- `supabase/migrations/20260701130000_security_rbac_unique_constraints.sql` — idempotent
  migration that (a) guarantees the natural-key unique constraints exist and (b) restores
  the permissive anon+authenticated RLS policies on every `security_*` table. **This is the
  DB half of the fix and must be applied to the live database** — the app changes alone
  only make failures visible; they cannot grant the anon role write access.

---

## Tables affected

| Table | Effect |
| --- | --- |
| `security_role_permissions` | Insert/update of `is_allowed` per (role, permission). Primary write target. |
| `security_access_audit_logs` | One audit row per change (`ROLE_PERMISSION_GRANTED` / `ROLE_PERMISSION_REVOKED`). |
| `security_user_role_assignments`, `security_user_permission_overrides` | Unchanged behavior; the migration only ensures their unique constraint + RLS policy (used by the User Access tab). |
| `security_permissions`, `security_roles` | **Not modified.** No permissions or roles are created/removed. |

---

## SQL verification queries

**Grant state for a role (parameterize the role code / module):**

```sql
select
  sr.code as role_code,
  sr.name as role_name,
  sp.module_key,
  sp.page_key,
  sp.action_key,
  sp.label,
  srp.is_allowed
from security_role_permissions srp
join security_roles sr        on sr.id = srp.role_id
join security_permissions sp  on sp.id = srp.permission_id
where sr.code = 'REGISTRAR'
  and sp.module_key = 'GUARDIAN_PORTAL';
```

- After **enable + save**: returns `... | GUARDIAN_PORTAL | null | view | View Parent Portal | true`.
- After **disable + save**: returns the same row with `is_allowed = false`.

**No duplicate grant rows (should return 0 rows):**

```sql
select role_id, permission_id, count(*)
from security_role_permissions
group by role_id, permission_id
having count(*) > 1;
```

**RLS policy present on the write target (should return the `_all_anon_auth` policy):**

```sql
select tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public'
  and tablename = 'security_role_permissions';
```

**Audit trail for the change:**

```sql
select action, target_role_id, module_key, page_key, permission_key, new_value, created_at
from security_access_audit_logs
where action in ('ROLE_PERMISSION_GRANTED', 'ROLE_PERMISSION_REVOKED')
order by created_at desc
limit 20;
```

---

## Manual test checklist

Prerequisite: **apply migration `20260701130000` to the live Supabase project.**

1. [ ] Login as Super Admin / Admin → User Access & Authority → Page Assignment → Role Rights.
2. [ ] Select **Registrar**. Find **Parent Portal → Module Access · View**. It is currently OFF.
3. [ ] Toggle ON → Save. Toast reads "Saved 1 right for Registrar" (a `danger` toast means the DB rejected it — see Risks).
4. [ ] Run the grant-state query → row with `is_allowed = true`.
5. [ ] Refresh the page, reselect Registrar → the toggle is still ON (persisted).
6. [ ] Toggle OFF → Save → grant-state query returns `is_allowed = false`.
7. [ ] Toggle ON again → Save → `is_allowed = true`.
8. [ ] Run the duplicate-check query → 0 rows.
9. [ ] Hard refresh, logout, login as a **Registrar** user → **Parent Portal** appears in the sidebar; `/guardian-portal` loads.
10. [ ] Disable again, login as Registrar → Parent Portal is gone; `/guardian-portal` is not accessible.
11. [ ] Regression: repeat step 2–4 for a **page-level** permission (non-null `page_key`, e.g. Accounting → Student Ledger — Post) and confirm it saves/loads too.
12. [ ] Regression: Admin and Super Admin retain their existing access.

---

## Risks and rollback notes

- **The migration must be applied.** Without it, anon writes may still be blocked by RLS; the only visible change would be a `danger` toast on save instead of a false success. That toast is the signal that the DB rejected the write.
- **Demo RLS posture.** The migration (re)creates fully permissive anon+authenticated policies, matching the existing project posture (`0002_rls.sql`, `20260701120000` §7). Access enforcement stays at the app layer. **Tighten before production.**
- **`is_allowed = false` vs delete.** Disabling keeps the row with `is_allowed = false` (explicit deny), consistent with `computeEffectivePermissions`. If you later prefer hard deletes, change only the `else`/disable branch of `setRolePermission`.
- **Pre-existing observation (not changed here):** `MY_PROFILE` has no `security_permissions` row, so under active RBAC it is absent from the effective module set. `MyProfilePage` still renders, but its nav item may hide for RBAC-driven users. Out of scope for this fix; flagged for follow-up.
- **Rollback:** revert the two source files to restore the previous `onConflict` upsert and remove the try/catch. The migration is additive and idempotent; to roll it back, `drop constraint` the three `uq_security_*` constraints and/or restore prior RLS policies. Dropping the permissive policies without a replacement will re-block anon writes.
```

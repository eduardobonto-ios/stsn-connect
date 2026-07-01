# User Access & Page Assignment — System Audit (Step 1)

**Module:** User Access & Authority (`ACCOUNTS_SECURITY`)
**Date:** 2026-07-01
**Goal:** Add a real Page Assignment / Access Rights (RBAC) system on top of the
existing navy/gold Metronic-inspired module — role assignment, granular per-page
rights, user-specific overrides, and a full audit trail, enforceable by Supabase RLS.

---

## 1. Current Roles

### 1.1 Account-level role (`UserRole`) — `src/types/index.ts`
14 values, stored on `users.role` (text) and used everywhere for gating:

```
SUPER_ADMIN, ADMIN, PRINCIPAL, REGISTRAR, ACCOUNTING, TEACHER, STUDENT,
HR, EMPLOYEE, CASHIER, GUIDANCE, NURSE, PAYROLL, GUARDIAN
```

`UserDesignation` (`HEAD | OFFICER | STAFF | PRINCIPAL | ASST_PRINCIPAL`) is a
**separate** axis that drives L1/L2 approval gating — not module access.

### 1.2 Canonical role (`CanonicalRole`) — `src/types/role.types.ts`
13 values. `UserRole` collapses onto these via `ROLE_TO_CANONICAL`:

```
super-admin, admin, principal, registrar, accounting, teacher, student,
hr, cashier, guidance, nurse, payroll, guardian
```

Notable mappings: **`EMPLOYEE → teacher`** (no distinct employee permission set),
and `ADMIN` is intentionally **not** `super-admin` (excluded from
`ACCOUNTS_SECURITY`, `CORE_SETUP`, `PAYROLL_MANAGEMENT`, `ACCOUNTING`, `CASHIER`).

### 1.3 Role catalog (`ROLES`) — `src/config/roles.config.ts`
Only **11** role definitions with `{ id, label, description }`. **Missing** from the
catalog (but present as canonical roles): **`admin`** and **`principal`**. The
catalog is incomplete relative to `CanonicalRole`.

> ⚠️ **Risk:** Three different role lists exist (`UserRole` 14, `CanonicalRole` 13,
> `ROLES` 11). The new system must reconcile these or pick one as the seed source.

---

## 2. Current Permission Model

### 2.1 Modules (`STSNModule`) — `src/config/permissions.config.ts`
30 module keys (the access unit today). `Permission` is just an alias for
`STSNModule` — **module-level only, no page-level, no action-level rights**.

```
DASHBOARD, ACTION_CENTER, PAYROLL_DASHBOARD, ACCOUNTING_DASHBOARD, REGISTRAR,
STUDENT_DIRECTORY, ACCOUNTING, CASHIER, BOOKS_SETUP, GRADING, CURRICULUM,
STUDENT_PORTAL, FACULTY_PORTAL, FACULTY_ADMIN, HR_MANAGEMENT, ACCOUNTS_SECURITY,
CORE_SETUP, SCHEDULING, CLASS_SECTIONING, ONLINE_LEARNING, NURSE_CLINIC,
GUIDANCE, CONSULTATION, REGISTRAR_REPORTS, GUIDANCE_REPORTS, CLINIC_REPORTS,
ADMIN_REPORTS, PAYROLL_MANAGEMENT, GUARDIAN_PORTAL
```

### 2.2 Role → module map (`ROLE_PERMISSIONS`)
`Record<CanonicalRole, Permission[]>` — a static hardcoded map. Resolved via
`getPermissionsForRole(role)` (falls back to `["DASHBOARD"]`). This is the **single
source of truth** for access today, and it is **role-only by design** (comment:
"Permission checks are intentionally role-only — academic unit must never gate
module access").

### 2.3 What's missing
| Concept | Status today |
|---|---|
| Module-level access | ✅ `ROLE_PERMISSIONS` (hardcoded TS) |
| **Page / sub-page access** | ❌ none — sub-pages are nav children only |
| **Action rights** (view/create/edit/delete/export/print/approve/…) | ❌ none |
| **User-specific overrides** | ❌ none — role is the only input |
| **Persisted role assignment** | ⚠️ partial — `users.role` is a single text column |
| **Multi-role per user** | ❌ none |
| **Effective-from / effective-until** | ❌ none |
| **Access-change audit trail** | ❌ none (general approval audit exists, see §4) |

---

## 3. Navigation Filtering — `src/config/navigation.config.ts`

- `NAV_ITEMS` is the full tree: top-level `NavItem` (id = `STSNModule`) with nested
  `NavSubItem` children, some 3 levels deep (e.g. HR → Time & Attendance → Attendance).
- Children carry `targetModule` (category-group pattern) and `showForRoles`.
- `getNavItemsForRole(role, unit)` filters `NAV_ITEMS` against
  `getAllowedModules` (= `getPermissionsForRole`). A parent group shows if the user
  has the parent module **or** any child's `targetModule`.
- `App.tsx` calls `getAllowedModules` + `getNavItemsForRole` to render the sidebar.

> The **sub-page keys** (child `id`s) are the natural `page_key` catalog for the new
> per-page rights — e.g. `user-security`, `delegation-management`, `audit-log`,
> `admin-reports`, `ledger`, `discounts`, `billing`, `holds`, `queue`,
> `employee-life-cycles`, `payroll-management`, etc.

---

## 4. App-level Access Behavior — `src/App.tsx`

- No route guard component. `allowedModules = getAllowedModules(role, unit)` is
  passed to `<AppModuleRenderer allowedModules=… activeModule=… />`.
- Redirect logic: unknown/forbidden path → `getDefaultRouteForRole(role)`.
- **There is no `can()` / action-level gating anywhere** — buttons (Block, Provision,
  Approve, Void, Export…) are always rendered for whoever can see the page.
- Enforcement is **frontend-hide only**; RLS exists for some tables (e.g. 0035 admin
  boundary) but is role-string based via `get_auth_role()` JWT claim.

> ⚠️ **Risk:** `AppModuleRenderer` must be checked to confirm it actually rejects
> `activeModule ∉ allowedModules` (not yet verified in this audit — flag for Step 4).

---

## 5. Accounts / Security Page — `src/features/accounts/pages/AccountsManagementPage.tsx`

Current tabs (`AccountsSubPage`): **`user-security` | `delegation-management` |
`audit-log`** (plus `admin-reports` routed separately via nav `targetModule`).
- `user-security`: lists `users`, search, Provision modal (name/email/role),
  block/restore via `toggleUserStatus`, drill-down drawer.
- `ROLE_OPTIONS` here is a **4th hardcoded role list** (11 entries, omits ADMIN,
  PRINCIPAL, GUARDIAN) — another reconciliation point.
- Reuses the shared kit: `ModulePageHeader`, `AppTable`, `AppCard`, `AppModal`,
  `AppStatusBadge`, `AppTabs`, `AppButton`, `AppSelect`, `DrilldownDrawer`.

> **Plan:** add a new **"Page Assignment"** tab here (do **not** remove the existing 3
> tabs). Reuse the same shared components and navy/gold theme.

---

## 6. Existing Supabase Tables (relevant)

`users` (0001): `id uuid`, `legacy_id text`, `school_id uuid`, `email`, `name`,
`role text`, `is_active`, `avatar_url`, `department`, timestamps. **Single role
column, no role FK, no permission tables.**

- **No** `security_roles`, `security_permissions`, `security_role_permissions`,
  `security_user_role_assignments`, `security_user_permission_overrides`, or
  `security_access_audit_logs` tables exist.
- **No** general `audit_logs` table — the in-app `auditLog` (store) and
  `AuditLogPage` are **client-side only**. Persisted audit is limited to
  `assessment_audit_trail`, `discount_request_audit_trail`, and the
  `approval_requests / approval_steps / approval_actions` engine (0034).
- RLS convention: `public.get_auth_role()` reads role from JWT; admin-write blocked
  per table (0035). Migrations are idempotent (`if not exists`, `to_regclass`,
  `drop policy if exists`, `ON CONFLICT DO NOTHING`).
- Reference/lookup data convention: rows in `setup_items` keyed by `category`.

### Migration naming convention
Two eras: legacy `0001`–`0037`, and timestamped `YYYYMMDDHHMMSS_*` (e.g.
`20260630140000_hr_payroll_reference_setup_items_seed.sql`). **New RBAC migration
should use the timestamped form**, e.g. `20260701HHMMSS_security_rbac_schema.sql`.

---

## 7. Files That Need Changes

| File | Change |
|---|---|
| `supabase/migrations/20260701*_security_rbac_*.sql` | **NEW** — 6 tables + seed |
| `src/types/security-permissions.types.ts` | **NEW** — types for rights/perms |
| `src/services/securityPermissionService.ts` | **NEW** — load + resolve effective perms |
| `src/hooks/usePermissions.ts` | **NEW** — `can()`, `canPage()`, `hasModuleAccess()` |
| `src/config/permissions.config.ts` | extend — page/action catalogs; keep `ROLE_PERMISSIONS` as fallback |
| `src/config/roles.config.ts` | reconcile — add `admin`, `principal` (+ guardian already present) |
| `src/features/accounts/pages/AccountsManagementPage.tsx` | add **Page Assignment** tab (keep existing 3) |
| `src/features/accounts/**` (new components) | role/page/rights matrix editors, drawers |
| `src/services/store.ts` | load security perms on `initialize`/`login`; expose to UI |
| `src/App.tsx` / `AppModuleRenderer` | gate `activeModule` by effective perms; (optional) action gating |
| `src/config/navigation.config.ts` | nav filter to consult effective perms, not just `ROLE_PERMISSIONS` |

---

## 8. Risk Areas

1. **Four divergent role lists** (`UserRole`, `CanonicalRole`, `ROLES`,
   `ROLE_OPTIONS`). Seed `security_roles` from the canonical set and reconcile.
2. **`EMPLOYEE → teacher` collapse** — an EMPLOYEE-specific permission set may be
   expected; confirm before seeding.
3. **No persisted audit** — the existing Audit Log tab is client-only; the new
   `security_access_audit_logs` must be wired to actually persist.
4. **Frontend-only enforcement** — model must be RLS-ready (role string in JWT) so
   the same boundary holds server-side; do not regress 0035's ADMIN boundary.
5. **Permissions take effect on next login/session reload** — must define a clear
   load point (`initialize`/`login`) and cache invalidation, since the store loads
   everything once at boot.
6. **Don't break existing role-based nav** — `ROLE_PERMISSIONS` stays as the
   fallback/seed; the DB becomes the override-aware source of truth.
7. **3-level nav depth** — page-key catalog must capture nested sub-pages, not just
   top-level children.

---

## 9. Recommended Implementation Plan

1. **Migration (Step 3)** — create the 6 `security_*` tables (idempotent, timestamped
   name), enable RLS with `get_auth_role()`-based policies (SUPER_ADMIN/ADMIN full,
   others read-own), and seed:
   - `security_roles` ← canonical roles (incl. `admin`, `principal`, `employee`).
   - `security_permissions` ← `STSNModule` (module rows) + page rows from nav child
     ids + action rows from the 13-right vocabulary; only sensible (module,page,action)
     combos.
   - `security_role_permissions` ← expand `ROLE_PERMISSIONS` (super/admin = full).
   - `security_user_role_assignments` ← backfill from `users.role`.
2. **Types + Service + Hook (Step 4)** — `security-permissions.types.ts`,
   `securityPermissionService.ts` (loads roles/perms/assignments/overrides, computes
   effective set = role grants ⊕ user overrides), `usePermissions.ts` exposing
   `hasModuleAccess`, `hasPageAccess`, `can`, `canPage`,
   `getUserEffectivePermissions`, `getRolePermissions`.
3. **Wire enforcement** — store loads effective perms at `initialize`/`login`; nav
   filter + `AppModuleRenderer` consult them (fallback to `ROLE_PERMISSIONS` when DB
   empty, so nothing breaks offline); add action-level `can()` checks to high-value
   buttons.
4. **Page Assignment UI** — new tab in `AccountsManagementPage` with: (a) role→page
   rights matrix editor, (b) per-user role assignment, (c) per-user override editor,
   each writing to the security tables **and** `security_access_audit_logs`. Reuse
   `AppTable`/`AppModal`/`AppTabs`/`AppStatusBadge`/`AppCard`/`DrilldownDrawer`.
5. **Audit surfacing** — point the existing Audit Log tab (or a new sub-view) at
   `security_access_audit_logs` so changes are visible and exportable.

**Backwards-compat guarantee:** `ROLE_PERMISSIONS` remains as the seed and the
runtime fallback; if the security tables are empty/unavailable, behavior is identical
to today. The DB layer is purely additive.
```

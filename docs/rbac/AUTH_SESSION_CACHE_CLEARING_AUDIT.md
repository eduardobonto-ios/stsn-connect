# Auth Session / Cache Clearing Audit

Tracks what auth-, permission-, and navigation-related state is cleared or
recomputed across the login/logout lifecycle, so that switching users never
leaks one user's context into another's session.

---

## Cross-user login route reset

### Root cause

When a user logged out and a different user logged in, the app kept the previous
user's page as the landing route.

The redirect effect in [`src/App.tsx`](../../src/App.tsx) derived the target
route like this:

```js
const targetPath =
  currentRoute === null
    ? getDefaultRouteForRole(currentUser.role)
    : currentRoute.isKnownPath
      ? currentRoute.canonicalPath   // ← preserved the previous user's URL
      : getDefaultRouteForRole(currentUser.role);
```

`logout()` in [`src/services/store.ts`](../../src/services/store.ts) only cleared
`currentUser` and `effectivePermissions`; it never touched the URL. So after
logout the browser location still pointed at, e.g., `/accounts/page-assignment`.
When the next user logged in, `resolveAppRoute("/accounts/page-assignment")`
returned a **known path**, so `currentRoute.isKnownPath` was `true` and the effect
preserved `canonicalPath` — the previous user's page. Because that module was not
in the new user's `allowedModules`, `AppModuleRenderer` fell through to its
"Module unavailable" placeholder, which looked like the app was "stuck" on the
old page.

### Why the previous user's page was reused

- Logout left `location.pathname` untouched (a neutral route was never set).
- The redirect effect treated any **syntactically known** path as a valid target
  regardless of whether the *current* user could access it.
- Nothing recomputed a fresh landing route from the new user's RBAC-filtered
  sidebar on login.

### What route / module / session state is cleared

| State | When cleared | Where |
| --- | --- | --- |
| `currentUser` | logout | `store.logout()` (unchanged) |
| `effectivePermissions` | logout | `store.logout()` (unchanged) |
| Persisted auth session (`localStorage: stsn-connect-auth-session`) | logout | `store.logout()` → `clearStoredAuthSession()` (unchanged) |
| Current route / `location.pathname` | logout (now reset to `/`) | **new** logout-reset effect in `App.tsx` |
| Landing route on login | recomputed from fresh RBAC sidebar | **updated** redirect effect in `App.tsx` |

`activeModule`, `expandedModule`, and the various `*SubPage` values in `App.tsx`
are all **derived from `location`** (via `resolveAppRoute`), so resetting the URL
implicitly resets them — there is no separate persisted "selected module" state to
clear.

### How the first allowed menu item is selected

A new helper, `getFirstAllowedRoute(items)` in
[`src/config/app-routes.config.ts`](../../src/config/app-routes.config.ts), walks
the **already RBAC-filtered** sidebar items (`renderedSidebarItems` in `App.tsx`,
which are filtered by `getNavItemsForRole` + per-page `hasPageAccess`) in menu
order and returns the route of the first item the user can actually open:

- a plain top-level item → its own module route;
- a category-group child (`targetModule`) → that module's route
  (`CORE_SETUP` additionally carries the child id as its sub-page);
- a plain sub-page child → parent module + child id;
- nested groups → recurse into children;
- section headers (`isSection`) → skipped.

It returns `null` when the user has **no accessible modules**.

The login redirect flow is therefore:

```
logout → reset URL to "/"  (clears stale previous-user route)
  ↓
login → currentUser + fresh effectivePermissions set by store
  ↓
renderedSidebarItems recomputed from effective permissions
  ↓
firstAllowedRoute = getFirstAllowedRoute(renderedSidebarItems)
  ↓
redirect effect: currentRoute === null (URL is "/") → navigate(firstAllowedRoute)
```

`getDefaultRouteForRole(role)` remains only as a last-resort fallback when
`firstAllowedRoute` is `null`. Nothing is hardcoded per role; the landing route is
entirely data-driven from the RBAC-filtered menu, so it works identically for
Registrar, Cashier, Teacher, Admin, etc.

Known, still-valid deep links are **preserved**: on a hard refresh at `/registrar`
the restored session keeps that URL because `currentRoute.isKnownPath` is true and
the URL was never reset (logout is the only thing that resets it). Direct-URL RBAC
protection is unchanged — an unauthorized but syntactically valid URL still renders
`AppModuleRenderer`'s "Module unavailable" state.

### "No accessible modules" state

When `firstAllowedRoute` is `null` (a role/user with no allowed modules), the
redirect falls back to `getDefaultRouteForRole`, whose module is not in
`allowedModules`, so `AppModuleRenderer` renders its "This page is not available
for your current access." panel — a clean state that does not reuse any previous
user's route.

### Files changed

- `src/config/app-routes.config.ts` — added `getFirstAllowedRoute()` (+ internal
  `firstLeafRoute()` recursion) and imported the `NavItem` / `NavSubItem` types.
- `src/App.tsx` — imported `getFirstAllowedRoute`; added a `firstAllowedRoute`
  memo; added a logout-reset effect that navigates to `/` when logged out; updated
  the login redirect effect to land on `firstAllowedRoute` (falling back to
  `getDefaultRouteForRole`).

No changes were made to menu order, the auth/login mechanics in `store.ts`, or the
Page Assignment save/upsert path (tracked separately in
`PAGE_ASSIGNMENT_ROLE_PERMISSION_UPSERT_FIX.md`).

### Manual test checklist

- [ ] **Admin → Registrar:** Login as Admin/SuperAdmin, open Page Assignment
      (`/accounts/page-assignment`), logout, login as Registrar. Registrar lands
      on their first allowed menu item (not the Admin page); Admin-only pages are
      absent from the sidebar; direct navigation to `/accounts/page-assignment`
      shows "Module unavailable".
- [ ] **Registrar → Cashier:** Registrar visits a Registrar page, logout, login as
      Cashier. Cashier lands on their first allowed item; Registrar pages absent.
- [ ] **Cashier → Teacher:** Cashier visits Cashiering, logout, login as Teacher.
      Teacher lands on their first allowed item; Cashiering absent.
- [ ] **Same user re-login:** Registrar visits a non-default Registrar page,
      logout, login again as Registrar. App starts from the first allowed menu
      item, not the previously visited page.
- [ ] **No allowed modules:** A user/role with no allowed modules logs in and sees
      the "not available for your current access" state, with no stale route.
- [ ] **Hard refresh deep link:** While logged in on `/registrar`, refresh the
      page — the app stays on `/registrar` (deep link preserved).

### Validation results

- `npm run lint` (`tsc --noEmit`): **passed**, no errors.
- `npm run build`: **passed**, built successfully.

### Risks and rollback notes

- **Scope:** The change is confined to navigation route selection; auth, RBAC
  computation, and data loading are untouched.
- **Deep links:** Preserved for valid, still-accessible known paths. If a future
  requirement wants logout to *not* reset the URL (e.g. to resume where you left
  off after re-login), remove the logout-reset effect in `App.tsx` — but note that
  reintroduces the cross-user stale-route bug for same-URL known paths.
- **Redirect loops:** `firstAllowedRoute` returns canonical paths that
  `resolveAppRoute` echoes back unchanged, so the redirect effect converges in one
  navigation (verified against each module's `getPathForModule` output).
- **Rollback:** Revert the two edited files. `getFirstAllowedRoute` is additive and
  safe to leave in place even if the effects are reverted.

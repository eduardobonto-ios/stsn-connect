# STSN Connect Metronic Phase 3 Routing Tracker

Audit date: 2026-06-29

## Current Routing Findings

- Routing before Phase 3 was state-driven.
- `src/main.tsx` mounted `App` directly with no router provider.
- `src/App.tsx` owned both shell rendering and module/subpage navigation state.
- Navigation visibility already came from centralized config:
  - `src/config/navigation.config.ts`
  - `src/config/permissions.config.ts`
- Role-based module access was already permission-driven, but URL access was not.

## App.tsx Responsibilities Before Cleanup

- application initialization and loading gate
- role-based default landing selection
- sidebar, mobile drawer, top header, breadcrumb, announcement, search, and clock shell UI
- expanded/collapsed navigation group state
- active module and subpage state
- full module rendering switch for all top-level pages
- action-center to module navigation bridging
- mobile bottom-nav to module navigation bridging

## Current Menu / Role Behavior Preserved

- Sidebar/menu item labels, icons, descriptions, and groupings still come from `src/config/navigation.config.ts`.
- Role/module visibility still comes from `getAllowedModules()` and `getNavItemsForRole()`.
- No permission rules were changed in `src/config/permissions.config.ts`.
- Existing dashboard, sidebar, action-center, student-directory, and mobile bottom-nav navigation flows were preserved and now drive URLs instead of local-only state.

## Files Changed

- `src/main.tsx`
- `src/App.tsx`
- `src/config/app-routes.config.ts`
- `src/components/layout/AppModuleRenderer.tsx`
- `docs/uiux/STSN_CONNECT_METRONIC_PHASE_3_ROUTING_TRACKER.md`
- `docs/uiux/STSN_CONNECT_METRONIC_PHASE_0_5_AUDIT_TRACKER.md`

## Routes Added Or Normalized

- `/dashboard`
- `/action-center`
- `/registrar`
- `/registrar/reports`
- `/accounting-dashboard`
- `/accounting/:subPage`
- `/grading`
- `/curriculum`
- `/student-directory`
- `/student-portal/:subPage`
- `/faculty/admin`
- `/faculty/portal`
- `/hr/:subPage`
- `/payroll/dashboard`
- `/payroll/:subPage`
- `/accounts/:subPage`
- `/core-setup/:categoryKey`
- `/scheduling`
- `/class-sectioning`
- `/online-learning`
- `/books-setup`
- `/cashier/:subPage`
- `/clinic`
- `/guidance`
- `/guidance/reports`
- `/clinic/reports`
- `/admin/reports`
- `/consultation`
- `/guardian-portal`

## Direct URL Behavior

- Direct URL access now works for the migrated top-level module and subpage routes above.
- Root `/` now redirects to the same role-based landing page that `App.tsx` previously chose via local state.
- Known routes are normalized to canonical paths, for example module routes with omitted subpages now redirect to their default subpage path.
- Unauthorized but known module URLs still render the existing unavailable-state message rather than silently granting access.
- Student Portal record navigation preserves direct student targeting via `?studentId=...`.

## App.tsx Cleanup Completed

- Added `BrowserRouter` in `src/main.tsx`.
- Moved route parsing and route generation into `src/config/app-routes.config.ts`.
- Reduced `App.tsx` responsibility from owning module/subpage state to:
  - owning shell UI
  - syncing shell navigation with the router
  - preserving local expansion/search/drawer UI state
- Extracted top-level module rendering into `src/components/layout/AppModuleRenderer.tsx`.

## Skipped Routing Items

- No feature-page internals were rewritten into nested `Routes`.
- No redesign of the shell, sidebar, or module pages.
- No conversion of feature-local tabs, drawers, wizards, or modal flows into URL-managed state.
- No role or permission refactor.
- No table or data-source changes.

## Validation Results

- `npm.cmd run lint`: passed
- Typecheck: passed via `npm.cmd run lint` because the lint script is `tsc --noEmit`
- `npm.cmd run build`: passed outside the sandbox; sandboxed Vite config resolution is still blocked by the known access issue
- Route helper verification confirmed canonical direct-URL behavior for representative cases such as:
  - `/registrar`
  - `/accounting` -> `/accounting/dashboard`
  - `/accounting/ledger`
  - `/student-portal/overview?studentId=stud-001`
  - `/payroll` -> `/payroll/payroll-management`
- App render expectation after cleanup:
  - router-backed shell compiles
  - sidebar/menu logic compiles
  - role-based module filtering compiles
- Interactive browser QA could not run in this session because the in-app browser backend was unavailable (`agent.browsers.list()` returned no available browser backends)
- No `STSNDataTable`, `DataTableCard`, or `DataTables.net` dependency/source was reintroduced
- No Metronic dependency was added

## Remaining Routing Follow-Ups

- Breadcrumb labels are still partly hand-maintained in `App.tsx`; they can be derived from the route config in a later pass.
- Feature-local subflows remain state-driven:
  - Student Portal internal workflows
  - Accounting nested page actions
  - Registrar internal workflow/detail state
  - other modal/detail/wizard state across feature modules
- `App.tsx` still owns the shell and navigation expansion behavior; this is smaller than before but can be split further in a future shell/layout phase.
- No dedicated route-level 404 page was added in this phase; unknown paths normalize back to the role default route.

## Recommendation For Phase 4

- Treat Phase 3 as the safe routing-foundation pass.
- Best next step is a shell/layout composition pass:
  - move breadcrumb metadata into route config
  - extract sidebar/mobile drawer rendering into dedicated layout components
  - optionally migrate a small number of feature-internal subviews to route-aware state where it clearly improves direct linking without changing workflows

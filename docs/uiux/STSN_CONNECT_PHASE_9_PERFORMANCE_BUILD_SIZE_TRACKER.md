# STSN Connect Phase 9 Performance and Build Size Tracker

Audit date: 2026-06-30

Status: Completed safe frontend performance pass. No business logic, workflows, routing rules, data sources, permissions, or table behavior were changed.

## Files Reviewed

- `package.json`
- `vite.config.ts`
- `src/main.tsx`
- `src/App.tsx`
- `src/components/layout/AppModuleRenderer.tsx`
- `src/components/common/GlobalSearch.tsx`
- targeted `src/components/common/**` shared component scan
- targeted `src/features/**` module/page scan
- `docs/uiux/STSN_CONNECT_METRONIC_PHASE_0_5_AUDIT_TRACKER.md`

## Build Warnings Found

- Initial sandboxed `npm.cmd run build` failed before chunk analysis because Vite config bundling was blocked by managed workspace sandbox access:
  - `Cannot read directory "../../..": Access is denied.`
  - `Could not resolve "C:\\Users\\VELOSO\\Documents\\GitHub\\stsn-connect\\vite.config.ts"`
- After rerunning the production build unsandboxed, the build completed successfully with no Vite chunk-size warning.

## Chunk And Performance Issues Found

- `src/components/layout/AppModuleRenderer.tsx` eagerly imported nearly every major feature page, forcing large module code into the startup bundle even though only one active module renders at a time.
- `src/App.tsx` eagerly imported `GlobalSearch`, even though the modal only renders on demand.
- Largest reviewed source files indicate clear page-level split candidates:
  - `src/features/registrar/pages/RegistrarModulePage.tsx`
  - `src/features/accounting/pages/AccountingModulePage.tsx`
  - `src/features/student-portal/pages/StudentPortalPage.tsx`
  - `src/features/faculty/pages/FacultyPortalPage.tsx`
  - `src/features/cashier/pages/CashierModulePage.tsx`
- Build output after optimization still shows a relatively large app entry chunk and a large shared data chunk:
  - `dist/assets/index-hzfgcS9y.js`: `366.14 kB` raw, `103.69 kB` gzip
  - `dist/assets/data-vendor-BzLcMD-B.js`: `213.05 kB` raw, `55.21 kB` gzip
  - `dist/assets/AccountingModulePage-DtfEYCmj.js`: `278.45 kB` raw, `45.46 kB` gzip
  - `dist/assets/RegistrarModulePage-DFyO4Wgj.js`: `111.10 kB` raw, `25.61 kB` gzip
  - `dist/assets/HRManagementPage-cXWMk7kj.js`: `102.70 kB` raw, `19.69 kB` gzip

## Safe Optimizations Applied

- Fixed Vite ESM config path resolution in `vite.config.ts` by replacing `__dirname` usage with `fileURLToPath(new URL('.', import.meta.url))`.
- Added conservative Rollup manual chunking in `vite.config.ts` for:
  - React and router runtime
  - Supabase and Zustand data/runtime dependencies
  - UI/icon/motion dependencies
  - TanStack table dependencies
- Converted `src/components/layout/AppModuleRenderer.tsx` to `React.lazy()` page imports wrapped in `Suspense`, preserving all existing role checks, direct-route handling, and per-module prop wiring.
- Added a lightweight module loading fallback in `src/components/layout/AppModuleRenderer.tsx`.
- Deferred `GlobalSearch` loading in `src/App.tsx` so it is only fetched when the modal is opened.

## Files Changed

- `vite.config.ts`
- `src/App.tsx`
- `src/components/layout/AppModuleRenderer.tsx`
- `docs/uiux/STSN_CONNECT_PHASE_9_PERFORMANCE_BUILD_SIZE_TRACKER.md`
- `docs/uiux/STSN_CONNECT_METRONIC_PHASE_0_5_AUDIT_TRACKER.md`

## Behavior Preserved

- No UI redesign was performed.
- No routing behavior was changed.
- No business logic was changed.
- No data sources were changed.
- No workflows, approvals, payments, enrollment, grading, payroll, accounting, reports, or permissions logic were changed.
- No table behavior was changed.
- No DataTables.net, `STSNDataTable`, or `DataTableCard` was reintroduced.
- Existing role-based access checks still happen before module rendering.
- Existing direct URL resolution still happens through the current `App.tsx` route resolution flow.
- Existing sidebar and mobile navigation still use the same route/module transitions and callbacks.

## Risks And Deferred Optimizations

- The app entry chunk is still sizable because `App.tsx`, the shared store, route resolution, shell navigation, counts, notifications, and always-mounted shared chrome remain startup-critical.
- `data-vendor` remains large because Supabase and store-related runtime is legitimately shared across many modules.
- `AccountingModulePage`, `RegistrarModulePage`, and `HRManagementPage` are still large feature chunks internally; splitting inside those modules was intentionally deferred to avoid changing sub-page behavior, workflows, or direct deep-link expectations.
- CSS output remains large (`202.04 kB` raw) and may warrant a later audit of unused global styles and print/report-specific CSS, but this phase avoided broad style refactors.
- Browser-driven smoke testing could not be completed in-session because the in-app browser target was unavailable (`Browser is not available: iab`).

## Validation Results

- `npm.cmd run lint`: passed
- `npm.cmd run build`: passed when rerun unsandboxed to bypass the managed sandbox Vite config access issue
- Production build completed in `5.14s`
- Verified from code review:
  - app render path remains intact from `src/main.tsx` to `src/App.tsx`
  - direct routes still resolve through the existing `resolveAppRoute()` and navigation redirect logic
  - sidebar navigation and mobile navigation callbacks were not changed
  - major modules still receive the same props and guards through `AppModuleRenderer`
  - no business logic changed
  - no data sources changed
  - no routing behavior changed
  - no table behavior changed
  - no DataTables.net or Metronic dependency added
- Browser-click verification of rendered pages was not possible in this session because no controllable in-app browser target was available.

## Recommendation For Phase 10

- Run a targeted internal chunk audit for the remaining largest modules, starting with `AccountingModulePage`, `RegistrarModulePage`, and `HRManagementPage`, and only consider intra-module lazy loading where sub-page boundaries are already explicit and safe.
- Evaluate whether shared store bootstrapping can be narrowed for first render without changing data-source semantics.
- Review global CSS and print/report-only styling for safe dead-weight reduction after a dedicated visual regression plan is approved.

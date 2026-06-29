# STSN Connect Metronic Phase 5 Layout Shell Tracker

Audit date: 2026-06-29

## Scope

- Phase 5 was limited to shared shell modernization only:
  - desktop sidebar
  - top header / topbar
  - breadcrumb chrome
  - global content wrapper and spacing
  - mobile drawer shell behavior
- No feature-page internals, business workflows, role permissions, data sources, or table behavior were intentionally changed.

## Layout Files Reviewed

- `docs/uiux/STSN_CONNECT_METRONIC_PHASE_4_SHARED_COMPONENTS_TRACKER.md`
- `src/App.tsx`
- `src/index.css`
- `src/components/common/BreadcrumbBar.tsx`
- `src/components/common/MobileBottomNav.tsx`
- `src/components/common/UserProfileDropdown.tsx`
- `src/components/layout/AppModuleRenderer.tsx`
- `src/config/navigation.config.ts`
- `src/config/roles.config.ts`
- `src/config/permissions.config.ts`

## Classification Before Editing

### Safe layout-shell update now

- `src/App.tsx`
- `src/components/common/BreadcrumbBar.tsx`
- `src/index.css`

### Should be deferred to module-specific modernization

- feature pages under `src/features/**`
- report preview / print surfaces
- approval drawers and workflow review shells
- login/auth presentation

### Should be deferred due to routing/role risk

- `src/config/navigation.config.ts`
- `src/config/roles.config.ts`
- `src/config/permissions.config.ts`
- `src/components/layout/AppModuleRenderer.tsx`

### Already aligned enough

- route resolution and role gating structure
- breadcrumb data derivation in `src/App.tsx`

### Needs separate responsive QA

- tablet header density around search, clock, notifications, and user menu
- deep nested mobile drawer paths on smaller screens
- per-module page-width behavior after shared shell width normalization

## Current Shell Structure Reviewed

- `src/App.tsx` owns the desktop sidebar, top header, breadcrumb bar, urgent banner slot, scrollable content shell, mobile bottom nav, and mobile drawer.
- Navigation labels, hierarchy, and role visibility come from `src/config/navigation.config.ts` plus `src/config/permissions.config.ts`.
- Feature modules are still rendered through `src/components/layout/AppModuleRenderer.tsx` and were intentionally left behaviorally unchanged.

## Files Changed

- `src/App.tsx`
- `src/components/common/BreadcrumbBar.tsx`
- `src/index.css`
- `docs/uiux/STSN_CONNECT_METRONIC_PHASE_5_LAYOUT_SHELL_TRACKER.md`
- `docs/uiux/STSN_CONNECT_METRONIC_PHASE_0_5_AUDIT_TRACKER.md`

## Files Intentionally Skipped

- `src/config/navigation.config.ts`
- `src/config/roles.config.ts`
- `src/config/permissions.config.ts`
- `src/components/layout/AppModuleRenderer.tsx`
- all feature modules under `src/features/**`

## Sidebar Changes

- Increased desktop sidebar width slightly to give grouped navigation and submenu descriptions more breathing room.
- Standardized parent, child, and nested submenu spacing with dedicated shell classes instead of ad hoc per-row hover treatment.
- Tightened active and hover states around ERP token colors with subtle border, shadow, and inset treatment while preserving the existing selected-module logic.
- Normalized school badge spacing and surface treatment so the sidebar chrome reads as one consistent shell.
- Updated the mobile drawer to use the same shell language, spacing rhythm, and active-state treatment as the desktop sidebar.

## Header / Topbar Changes

- Rebased the shell header onto shared layout-shell classes in `src/index.css`.
- Tightened topbar padding and utility control spacing for a cleaner horizontal rhythm.
- Standardized the menu button, search trigger, and clock card onto the same shell utility treatment.
- Preserved notification and user-menu behavior; only the surrounding shell presentation changed.

## Breadcrumb / Page Shell Changes

- Wrapped the breadcrumb bar in dedicated shell chrome with shared padding, blur, border, and typography rules.
- Added a shared main-content container width and global shell padding in `src/App.tsx` + `src/index.css`.
- Moved the urgent announcement banner into an explicit shell slot so it aligns with the shared content edges.
- Unified the main content background onto a tokenized shell gradient instead of one-off inline values.

## Responsive Behavior Notes

- Mobile drawer width now caps relative to viewport width instead of a fixed narrow rail.
- Global shell padding now scales through CSS tokens and media queries for desktop, tablet, and mobile.
- Sidebar and nested submenu spacing now stay more readable in the mobile drawer.
- Further responsive QA is still recommended for dense tablet header states and deep multi-level nav trees.

## Preserved Navigation / Role Behavior

- Navigation labels were not changed.
- Menu hierarchy was not changed.
- `targetModule` and subpage routing behavior were not changed.
- Role visibility and permission filtering were not changed.
- Active menu determination logic was not changed.
- School badge display behavior was not changed.
- Notification, user/account menu, and mobile bottom nav behavior were not changed.

## Validation Results

- `npm.cmd run lint`: passed
- Typecheck status: passed via `npm.cmd run lint` because the project lint script remains `tsc --noEmit`
- `npm.cmd run build` inside sandbox: failed due the existing Vite config access restriction
- `npm.cmd run build` outside sandbox: passed
- Local render smoke check:
  - `npm.cmd run dev` started successfully on port `3000`
  - `http://127.0.0.1:3000` responded with HTTP `200`
- Confirmed no business logic or data-source code was intentionally changed in this phase
- Confirmed no table behavior was intentionally changed in this phase
- Confirmed no `STSNDataTable`, `DataTableCard`, or DataTables.net code was reintroduced
- Confirmed no Metronic dependency was added
- Browser-based visual smoke check could not be completed through the in-app browser because the browser runtime was unavailable in this session

## Recommended Phase 5B Or Phase 6 Scope

- Phase 5B:
  - focused responsive QA and tablet density cleanup for the shell
  - shared topbar/button/dropdown polish for `NotificationBell` and `UserProfileDropdown` if needed
  - optional shell-level treatment for announcement/banner alignment if the current urgent banner still feels visually detached
- Phase 6:
  - module-by-module modernization of deferred inner page shells and workflow-heavy surfaces
  - keep accounting, cashier, payroll, registrar, grading, and approval internals in dedicated validation tracks rather than a broad sweep

## Phase 5B Page Header and Spacing Normalization Notes

### Files Reviewed

- `src/index.css`
- `src/App.tsx`
- `src/components/common/ModulePageHeader.tsx`
- `src/components/common/PageHeader.tsx`
- `src/components/common/BreadcrumbBar.tsx`
- `src/components/common/AppCard.tsx`
- `src/components/common/AppKpiCard.tsx`
- `src/components/common/StatCard.tsx`
- `src/components/common/AppTable.tsx`
- `src/components/common/AppTabs.tsx`
- `src/features/registrar/pages/RegistrarModulePage.tsx`
- `src/features/grading/pages/GradesDirectoryPage.tsx`

### Files Changed

- `src/index.css`
- `src/components/common/ModulePageHeader.tsx`
- `src/components/common/PageHeader.tsx`
- `src/components/common/AppTable.tsx`
- `src/features/registrar/pages/RegistrarModulePage.tsx`
- `src/features/grading/pages/GradesDirectoryPage.tsx`
- `docs/uiux/STSN_CONNECT_METRONIC_PHASE_5_LAYOUT_SHELL_TRACKER.md`
- `docs/uiux/STSN_CONNECT_METRONIC_PHASE_0_5_AUDIT_TRACKER.md`

### Header / Spacing Fixes

- Increased shared header and table-toolbar padding slightly so page banners, local headers, and table controls sit on a more consistent vertical rhythm with the Phase 5 shell.
- Tightened shared `PageHeader` description spacing and `ModulePageHeader` title/subtitle alignment to reduce visual crowding without changing component behavior.
- Normalized shared `AppTable` toolbar and bulk-action strip spacing so pages using the common table component inherit the same header density.
- Added shared local-shell classes in `src/index.css` for detail-panel heroes, local table toolbars, local panel tabs, and lighter token-based table heads so page-specific fixes could reuse shell tokens instead of one-off colors.

### Enrollment Selected-Student Header Result

- Restyled the right-side selected learner header in `RegistrarModulePage` from the older dark detached gradient into the shared Phase 5 navy/gold shell language.
- Preserved selected row behavior, learner data, tab switching, status visibility, COR actions, assessment actions, and enrollment workflows.
- Updated only the local visual chrome for the profile hero, source badge, incomplete badge, accent line, and tab strip.

### Grades Directory Table-Header Result

- Replaced the heavy custom dark header row in the Grades Directory master table with the same ivory/gold token treatment already used by shared table headers.
- Aligned the local table toolbar area with the shell’s card/header spacing.
- Preserved grading data, period filtering, expansion behavior, subject counts, average calculations, status logic, and row actions.

### Items Deferred To Phase 6

- Broader Registrar detail-panel body redesign, assessment forms, and enrollment workflow surfaces.
- Wider Grades Directory row-detail modernization and nested grading controls beyond the local master-table header chrome.
- Responsive polish for dense tablet breakpoints where long labels, pills, and sticky panels still need dedicated QA.

### Validation Results

- `npm.cmd run lint`: pending at time of note update
- `npm.cmd run build`: pending at time of note update
- Expected preserved behavior:
  - app shell rendering
  - sidebar/header behavior
  - selected student panel behavior
  - Grades Directory behavior
  - table behavior, report/print/export behavior, and routing
  - no business-logic, data-source, or permission changes
  - no `DataTables.net` or Metronic dependency additions

### Phase 5C Readiness

- Yes. After this spacing/header normalization pass, the remaining shell-level work is primarily palette/theme harmonization and broader visual consistency rather than structural layout cleanup.

## Phase 5C Brand Theme Palette Harmonization Notes

### Files Reviewed

- `src/index.css`
- `src/components/common/ui-variants.ts`
- `src/components/common/ModulePageHeader.tsx`
- `src/components/common/PageHeader.tsx`
- `src/components/common/AppButton.tsx`
- `src/components/common/AppCard.tsx`
- `src/components/common/AppKpiCard.tsx`
- `src/components/common/StatCard.tsx`
- `src/components/common/AppStatusBadge.tsx`
- `src/components/common/AppTabs.tsx`
- `src/components/common/AppTable.tsx`
- `src/App.tsx`

### Files Changed

- `src/index.css`
- `src/components/common/ui-variants.ts`
- `src/components/common/ModulePageHeader.tsx`
- `src/components/common/PageHeader.tsx`
- `src/components/common/AppButton.tsx`
- `src/components/common/AppCard.tsx`
- `src/components/common/AppTabs.tsx`
- `src/components/common/AppTable.tsx`
- `src/App.tsx`
- `docs/uiux/STSN_CONNECT_METRONIC_PHASE_5_LAYOUT_SHELL_TRACKER.md`
- `docs/uiux/STSN_CONNECT_METRONIC_PHASE_0_5_AUDIT_TRACKER.md`

### Theme Tokens Changed

- Replaced the old brown/mocha-led global palette with a shared academic ERP palette centered on:
  - navy `#071C34`, `#0A2748`, `#123A63`
  - gold `#D6A21E`, `#E7B82F`, `#F2C94C`
  - ivory / cream `#FFFDF6`, `#F8F2E4`
  - border `#E6D9B8`
  - main text `#102033`
  - muted text `#64748B`
- Updated `--erp-*`, `--stsn-*`, banner, shell, border, shadow, focus, and surface tokens so shared components consume the new palette instead of one-off brown values.
- Preserved semantic blue/green/amber/red workflow and status tokens so approval, finance, and academic status meaning remains intact.

### Sidebar / Header Color Updates

- Shifted the desktop sidebar and mobile drawer from brown gradients to deep navy gradients with gold active accents.
- Updated active sidebar treatments, nested nav highlights, and shell utility surfaces to read as navy/gold instead of tan/brown.
- Tightened topbar utility controls onto ivory surfaces with navy text and gold border emphasis on hover.
- Kept the shell structure from Phase 5 while improving contrast and reducing the washed-out look.

### Button / Card / Table / Header Color Updates

- `AppButton`
  - primary buttons now use a gold gradient with dark navy text
  - college/dark-primary buttons now use navy gradients
  - outline/secondary variants now use ivory surfaces and border tokens
- `AppCard`, `PageHeader`, `ModulePageHeader`, and shared card gradients now use ivory/white surfaces, navy text, gold accents, and navy banners.
- `AppTabs` now uses the shared ivory surface and gold-accent active state.
- `AppTable` toolbar, bulk-action strip, search field, empty state, selected-row treatment, and pagination controls now use the harmonized token palette.
- `ui-variants.ts` brand tone now resolves to the shared navy/gold/ivory token family instead of the old cream/brown combination.

### Old Brown / Mocha Styling Removed Or Retained

- Removed or replaced brown/mocha-heavy shared styling from:
  - shell gradients
  - banner gradients
  - button gradients
  - plain shared table theme
  - filter chip active states
  - card hero/stat/section gradient helpers
- Retained existing semantic status colors for workflow, finance, and academic meaning.
- Kept the legacy `stsn-brown*` token names for compatibility, but remapped them to the new navy family so existing shared/component references continue working safely.

### Behavior Preserved

- No routing behavior was changed.
- No business logic, workflows, approvals, payments, reports, calculations, or data-source behavior was intentionally changed.
- No table behavior or shared `AppTable` API behavior was intentionally changed.
- No role-based visibility or navigation hierarchy was changed.
- No `STSNDataTable`, `DataTableCard`, or DataTables.net code was reintroduced.
- No Metronic dependency was added.

### Validation Result

- `npm.cmd run lint`: passed
- Typecheck status: passed via `npm.cmd run lint` because the project lint script remains `tsc --noEmit`
- `npm.cmd run build` inside sandbox: failed due the existing Vite config access restriction
- `npm.cmd run build` outside sandbox after the final Phase 5C edits: passed
- Local render smoke check:
  - `http://127.0.0.1:3000` responded with HTTP `200`
- Confirmed shared shell and shared component rendering should still propagate through the existing app wiring because no module logic or route logic changed

### Remaining Module-Specific Visual Follow-Ups

- Some feature pages still contain module-local raw blue/brown badges, banners, or control styling that should be modernized only in dedicated module passes.
- `AppStatusBadge` still correctly follows semantic status mappings, but any module-local non-semantic chips outside that shared component should be audited later.
- Dashboard and workflow-heavy modules may still contain page-local gradients or decorative surfaces that do not yet fully match the new academic ERP palette.

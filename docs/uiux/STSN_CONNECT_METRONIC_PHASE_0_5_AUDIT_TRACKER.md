# STSN Connect Metronic Phase 0.5 Audit Tracker

Audit date: 2026-06-28

Status: Completed for Phase 0.5 audit/inventory. No application source files were modified.

## Completed Items

- [x] Verified frontend stack against `package.json` and Vite/Tailwind entry points.
- [x] Verified `App.tsx` routing, layout, navigation, and module rendering responsibilities.
- [x] Verified navigation mode as state-driven rather than URL-driven.
- [x] Inventoried `STSNDataTable`, `DataTableCard`, DataTables.net usage, custom table wrappers, and raw table implementations.
- [x] Verified CSS variables, Tailwind 4 theme tokens, and layout/theme CSS in `src/index.css`.
- [x] Verified current status badge implementation and status color mappings.
- [x] Verified raw hex colors and scattered Tailwind status classes exist.
- [x] Verified Metronic reference location and `react.zip` extraction status.
- [x] Inventoried reusable UI/component patterns.
- [x] Identified centralized versus scattered UI patterns.
- [x] Identified shared/global files recommended for Phase 1.
- [x] Identified files not to touch yet.

## In-Progress Items

- [ ] None. Phase 0.5 audit is complete.

## Pending Items

- [ ] Phase 1 implementation approval.
- [ ] Shared/global component enhancement pass.
- [ ] Later feature-page migration pass after shared components are stabilized.
- [ ] Visual QA after implementation across desktop and mobile.

## Confirmed Frontend Stack

- React: `^19.0.1`
- React DOM: `^19.0.1`
- Vite: `^6.2.3`
- Tailwind CSS: `^4.1.14`
- Tailwind Vite plugin: `@tailwindcss/vite ^4.1.14`
- Zustand: `^5.0.14`
- Supabase: `@supabase/supabase-js ^2.108.2`
- DataTables.net: `datatables.net-dt ^2.3.8`
- DataTables React wrapper: `datatables.net-react ^1.0.2`
- React Router DOM is installed: `react-router-dom ^7.16.0`, but no router usage was found in `src`.

## Routing And Layout Findings

- `src/App.tsx` owns the current application shell.
- `App.tsx` handles login gating, role-based landing modules, sidebar navigation, mobile drawer navigation, top header, breadcrumbs, global search trigger, sub-page state, and conditional module rendering.
- Main module rendering is state-based through `activeModule` and related sub-page state variables.
- No `BrowserRouter`, `Routes`, `Route`, `RouterProvider`, `Link`, `NavLink`, `useNavigate`, or `useLocation` usage was found in `src`.
- Navigation configuration is centralized in `src/config/navigation.config.ts`, but actual route changes are React state updates, not URL route transitions.

## Current Shared Component Inventory

- Buttons: `AppButton`, CSS `.stsn-btn`, `.btn-primary-gradient`, `.btn-gold-gradient`
- Forms: `AppInput`, `AppSelect`, `AppTextarea`, `AppFormField`
- Search and filters: `AppSearchInput`, `AppFilterChip`, `DashboardFilterBar`, `DataTableCard` header search
- Modals and dialogs: `AppModal`, `AppConfirmDialog`, `AppPromptDialog`, `AppTypeConfirmDialog`, `DialogProvider`, `useAppDialog`
- Toasts and notifications: `AppToast`, `NotificationBell`, `UrgentAnnouncementBanner`
- Headers and shell UI: `ModulePageHeader`, `PageHeader`, `BreadcrumbBar`, `MobileBottomNav`, `GlobalSearch`
- Cards and KPI tiles: `AppCard`, `AppKpiCard`, `DashboardKpiCard`, `StatCard`, analytics card components
- Tables: `STSNDataTable`, `DataTableCard`, CSS `.stsn-plain-table`
- Badges and status: `AppStatusBadge`, `SLABadge`, `status-style.config`, `ui-variants`
- Empty/detail states: `EmptyState`, `DrilldownDrawer`, `ApprovalInbox`, `ApprovalDetailDrawer`
- Exports and actions: `ExportMenu`, `AppActionToolbar`

## Current Table And DataTable Implementation

- `src/components/common/STSNDataTable.tsx` is the centralized DataTables.net wrapper.
- It imports `datatables.net-react`, `datatables.net-dt`, and `datatables.net-dt/css/dataTables.dataTables.css`.
- It calls `DataTable.use(DT)`.
- It supports columns, custom render slots, search, pagination, row click, selected row styling, bulk selection, column visibility, localStorage persistence for hidden columns, and row color classes.
- `src/components/common/DataTableCard.tsx` provides a reusable card header with title, icon, subtitle, controlled search, actions, and a table body slot.
- `src/index.css` contains the `.stsn-datatable` theme and `.stsn-plain-table` styles.
- Raw table implementations still exist across feature pages, reports, previews, grade tables, import previews, portal pages, and accounting detail areas.
- Other custom table-related components include `ReportTable`, `ReportPreviewModal`, `GradeSheetTable`, and `GradeSummaryView`.

## Current Modal, Button, Form, Card, And Badge Patterns

- Modal/dialog system is partially centralized through `AppModal`, `DialogProvider`, `useAppDialog`, confirm, prompt, type-confirm, and toast components.
- Buttons are partially centralized, but many feature pages still use raw `<button>` markup with `btn-primary-gradient`, `bg-[#C5A059]`, `bg-red-*`, or bespoke icon button classes.
- Form controls are partially centralized, but many pages still use raw `input`, `select`, and `textarea` classes.
- Cards are partially centralized with `AppCard`, `AppKpiCard`, `DashboardKpiCard`, and `StatCard`, but many pages still use repeated `bg-white rounded-xl border shadow-sm` class strings.
- Status badges are partially centralized through `AppStatusBadge`, but most feature modules still use local status config maps or inline status ternaries.
- Tabs are not centralized. Several modules implement their own tab or segmented-control markup.
- Loading and error states are mostly local per page.

## Theme And CSS Findings

- Primary theme file: `src/index.css`.
- Tailwind 4 is used via `@import "tailwindcss"` and `@theme`.
- `@theme` defines STSN fonts and palette tokens:
  - `--font-sans`
  - `--font-display`
  - `--font-mono`
  - `--color-stsn-brown`
  - `--color-stsn-brown-dark`
  - `--color-stsn-brown-light`
  - `--color-stsn-brown-deep`
  - `--color-stsn-cream`
  - `--color-stsn-beige`
  - `--color-stsn-gold`
  - `--color-stsn-gold-light`
  - `--color-stsn-text`
- `:root` defines layout, card, text, focus, status background, and module banner tokens.
- `src/index.css` also defines typography classes, sidebar/header gradients, button gradients, card gradients, module banners, modal backdrop/header, tab active style, selected row style, filter chip styles, plain table styles, DataTable theme, billing table spacing, and print overrides.
- No root `tailwind.config.*` file was found.
- Raw hex colors and Tailwind arbitrary color classes are present in shared components and feature pages.

## Metronic Reference Status

- Expected prompt path: `docs/reference/metronic-react-v7`
- Actual verified path: `doc/reference/metronic-react-v7`
- `docs/reference/metronic-react-v7` does not exist.
- `react.zip` was not found during the scan.
- Conclusion: Metronic reference is already extracted under `doc/reference/metronic-react-v7`; no `react.zip` extraction appears pending.
- Metronic must remain a visual/layout reference only. Do not copy Metronic source code.

## Findings That Differ From Claude's Audit

- Metronic path differs if Claude reported `docs/reference/metronic-react-v7`; actual path is `doc/reference/metronic-react-v7`.
- Navigation differs if Claude assumed URL-driven routing; current app navigation is state-driven.
- Status badge centralization differs if Claude assumed full centralization; current badge styling is only partially centralized.
- Table standardization differs if Claude assumed all tables use DataTables; many raw/custom table implementations remain.

## Phase 1 Files To Touch

Shared/global files recommended for Phase 1 only:

- `src/index.css`
- `src/components/common/ui-variants.ts`
- `src/components/common/AppButton.tsx`
- `src/components/common/AppInput.tsx`
- `src/components/common/AppSelect.tsx`
- `src/components/common/AppTextarea.tsx`
- `src/components/common/AppFormField.tsx`
- `src/components/common/AppSearchInput.tsx`
- `src/components/common/AppFilterChip.tsx`
- `src/components/common/AppActionToolbar.tsx`
- `src/components/common/AppCard.tsx`
- `src/components/common/AppKpiCard.tsx`
- `src/components/common/StatCard.tsx`
- `src/components/common/ModulePageHeader.tsx`
- `src/components/common/PageHeader.tsx`
- `src/components/common/AppModal.tsx`
- `src/components/common/AppConfirmDialog.tsx`
- `src/components/common/AppPromptDialog.tsx`
- `src/components/common/AppTypeConfirmDialog.tsx`
- `src/components/common/AppToast.tsx`
- `src/components/common/DialogProvider.tsx`
- `src/components/common/EmptyState.tsx`
- `src/components/common/DataTableCard.tsx`
- `src/components/common/STSNDataTable.tsx`
- `src/components/common/AppStatusBadge.tsx`
- `src/components/common/SLABadge.tsx`
- `src/components/common/ExportMenu.tsx`
- `src/config/status-style.config.ts`

Optional only if Phase 1 explicitly includes shell visual normalization:

- `src/App.tsx`

## Files Not To Touch Yet

- `doc/reference/metronic-react-v7/**`
- `package.json`
- `package-lock.json`
- `vite.config.ts`
- `tsconfig.json`
- `src/main.tsx`
- `src/services/**`
- `src/lib/supabase.ts`
- `src/types/**`
- `src/config/navigation.config.ts`
- `src/config/permissions.config.ts`
- `src/config/roles.config.ts`
- `supabase/**`
- `database/**`
- `src/features/**` during Phase 1, except in a later migration phase
- `Desktop/**` copied or archival folders

## Risks Before Implementation

- `App.tsx` has high blast radius because it owns shell, navigation, role defaults, layout, and module rendering.
- `STSNDataTable` uses DataTables callbacks and DOM class mutation; visual changes must preserve sorting, pagination, row click, bulk selection, selected row styles, column visibility, and table reinitialization behavior.
- Status centralization can accidentally change domain-specific labels or workflow semantics.
- Raw feature-page UI cleanup should not happen in Phase 1 because it creates a large regression surface.
- Theme changes can shift contrast and density across the whole app, especially because raw hex values and local Tailwind classes still exist.
- Metronic should guide spacing, density, shell structure, and component polish only. Do not copy code or introduce Metronic package dependencies.

## Recommended Next Phase

Phase 1 should be a shared/global component enhancement pass only.

Recommended scope:

- [ ] Normalize and extend design tokens in `src/index.css`.
- [ ] Improve shared button variants and replace raw hex inside shared primitives.
- [ ] Improve shared form controls and field wrappers.
- [ ] Improve modal, dialog, and toast presentation.
- [ ] Improve page headers, cards, KPI cards, and empty states.
- [ ] Improve `DataTableCard` and `STSNDataTable` styling.
- [ ] Expand centralized status style mappings without migrating every feature page yet.
- [ ] Optionally polish `App.tsx` shell only if explicitly approved.

## Suggested Implementation Order

- [ ] Phase 1.1: Theme tokens and global CSS utilities.
- [ ] Phase 1.2: Buttons and form primitives.
- [ ] Phase 1.3: Modal, dialog, and toast primitives.
- [ ] Phase 1.4: Page headers, cards, KPI tiles, and empty states.
- [ ] Phase 1.5: DataTableCard and STSNDataTable.
- [ ] Phase 1.6: Status badge config expansion.
- [ ] Phase 1.7: Optional app shell polish.
- [x] Phase 2A: Add `AppTable` foundation with TanStack Table without migrating feature pages.
- [x] Phase 2B pilot: Migrate `AuditLogPage.tsx` to `AppTable`.
- [ ] Phase 2C: Continue gradual low-risk feature page migrations to `AppTable`.

## Phase 1 Implementation Notes

Audit date: 2026-06-28

### Completed

- [x] Added ERP semantic color tokens to `src/index.css`.
- [x] Exposed ERP/status tokens through the Tailwind CSS 4 `@theme` block.
- [x] Added workflow status tokens: draft, pending, review, approved, rejected, cancelled.
- [x] Added academic status tokens: active, enrolled, graduated, dropped, leave, suspended.
- [x] Added finance status tokens: credit, debit, balance, overdue, paid, partial, waived.
- [x] Added neutral/default status fallback tokens.
- [x] Updated `AppStatusBadge` to render semantic status classes from the centralized config.
- [x] Updated `status-style.config.ts` to remove raw Tailwind badge color utilities from centralized badge mappings.
- [x] Preserved existing badge labels and fallback behavior for unknown statuses.
- [x] Confirmed no Metronic code, SCSS, assets, class names, UI framework, or dependency was added.

### Files Changed

- `src/index.css`
- `src/config/status-style.config.ts`
- `src/components/common/AppStatusBadge.tsx`
- `docs/uiux/STSN_CONNECT_METRONIC_PHASE_0_5_AUDIT_TRACKER.md`

### Tokens Added

- ERP surface/text tokens: `--erp-page-bg`, `--erp-surface`, `--erp-surface-muted`, `--erp-border`, `--erp-text`, `--erp-text-muted`, `--erp-brand`, `--erp-accent`.
- Tailwind `@theme` ERP tokens: `--color-erp-*`.
- Workflow status tokens: `--status-draft-*`, `--status-pending-*`, `--status-review-*`, `--status-approved-*`, `--status-rejected-*`, `--status-cancelled-*`.
- Academic status tokens: `--status-academic-active-*`, `--status-academic-enrolled-*`, `--status-academic-graduated-*`, `--status-academic-dropped-*`, `--status-academic-leave-*`, `--status-academic-suspended-*`.
- Finance status tokens: `--status-finance-credit-*`, `--status-finance-debit-*`, `--status-finance-balance-*`, `--status-finance-overdue-*`, `--status-finance-paid-*`, `--status-finance-partial-*`, `--status-finance-waived-*`.
- Neutral fallback tokens: `--status-neutral-*`.

### Status Mappings Added Or Updated

- Workflow aliases now map to semantic classes such as `stsn-status-workflow-pending`, `stsn-status-workflow-review`, `stsn-status-workflow-approved`, `stsn-status-workflow-rejected`, and `stsn-status-workflow-cancelled`.
- Academic statuses now map to semantic classes such as `stsn-status-academic-active`, `stsn-status-academic-enrolled`, `stsn-status-academic-graduated`, `stsn-status-academic-dropped`, `stsn-status-academic-leave`, and `stsn-status-academic-suspended`.
- Finance statuses now map to semantic classes such as `stsn-status-finance-credit`, `stsn-status-finance-debit`, `stsn-status-finance-balance`, `stsn-status-finance-overdue`, `stsn-status-finance-paid`, `stsn-status-finance-partial`, and `stsn-status-finance-waived`.
- Unknown statuses keep their incoming label and use `stsn-status-neutral`.

### Raw Colors Replaced

- Centralized status badge mappings in `src/config/status-style.config.ts` no longer use raw Tailwind color utility strings such as `bg-amber-50 text-amber-700 border-amber-200`.
- `AppStatusBadge` now receives semantic status classes from the config and adds `data-status-family` and `data-status-token` metadata for future migration and QA.

### Raw Colors Intentionally Left For Later Phases

- Existing STSN brand tokens and global component styles in `src/index.css`.
- Chart color constants in `src/config/chart-theme.config.ts`.
- Feature-specific status maps in files such as `src/config/accounting.config.ts` and `src/config/books.config.ts`.
- Page-level raw status utility classes across `src/features/**`.
- One-off document preview and report styling in `src/components/ModalPreviews.tsx`.
- Layout/sidebar/header colors in `src/App.tsx`.

### Build, Typecheck, And Lint Result

- `npm run lint` could not run directly in PowerShell because local script execution is disabled for `npm.ps1`.
- `npm.cmd run lint` ran and failed on existing TypeScript issues outside the Phase 1 files, including `ApprovalInbox.tsx`, `AccountingDashboardPage.tsx`, `GuardianPortalPage.tsx`, `GuidanceModulePage.tsx`, `PayrollDashboardPage.tsx`, and `SchedulingModulePage.tsx`.
- `npm run build` could not run directly in PowerShell because local script execution is disabled for `npm.ps1`.
- `npm.cmd run build` first hit a sandbox access issue resolving `vite.config.ts`; rerunning the build outside the sandbox succeeded.
- Production build result: passed with the existing Vite chunk-size warning for the main JS bundle.

### Risks Or Follow-Up Items

- Centralized `AppStatusBadge` is now token-based, but many feature pages still render local status badges directly.
- Existing TypeScript/lint failures should be resolved before using lint as a regression gate.
- Feature-level raw status colors should be migrated gradually to `AppStatusBadge` or shared semantic status utilities.
- App-wide raw hex cleanup should remain a later phase because it touches shell, reports, print views, charts, and feature pages.
- Visual QA should be done after the TypeScript issues are cleared and before migrating one-off page implementations.

### Recommended Next Phase

- [ ] Phase 1.1: Resolve existing TypeScript/lint blockers so validation can be clean.
- [ ] Phase 1.2: Migrate feature-specific status maps to the centralized semantic status config where behavior is obvious.
- [ ] Phase 1.3: Enhance shared buttons, forms, cards, modals, and table containers using the new ERP tokens.
- [ ] Phase 1.4: Defer route/layout/App shell changes until explicitly approved.

## Phase 1 Verification Notes

Verification date: 2026-06-28

- Phase 1 shared/global work is substantially complete: `src/index.css` includes ERP semantic tokens, Tailwind CSS 4 `@theme` exposure, and workflow/academic/finance status tokens; `AppStatusBadge` uses `getStatusStyle`; `status-style.config.ts` centralizes semantic status classes and fallback behavior.
- Phase 1 is not fully complete across feature adoption: local status maps and inline raw Tailwind status badge classes still exist in feature/config files such as `src/config/accounting.config.ts`, `src/config/books.config.ts`, `src/features/accounting/pages/**`, `src/features/clinic/pages/ClinicModulePage.tsx`, `src/features/consultation/pages/ConsultationModulePage.tsx`, `src/features/guidance/pages/GuidanceModulePage.tsx`, `src/features/hr/pages/sub-pages/**`, `src/components/common/ApprovalInbox.tsx`, and `src/components/common/ApprovalDetailDrawer.tsx`.
- Recommendation: run a dedicated Phase 1-fix/status pass to migrate obvious feature-local status badges to `AppStatusBadge` or shared semantic helpers, while leaving chart, report, print, and app-shell color cleanup to later approved phases.

## Phase 1B Status Token Adoption Notes

Audit date: 2026-06-29

### Files Reviewed

- `src/config/status-style.config.ts`
- `src/components/common/AppStatusBadge.tsx`
- `src/config/accounting.config.ts`
- `src/config/books.config.ts`
- `src/features/books/pages/BooksSetupPage.tsx`
- `src/features/hr/pages/sub-pages/RecruitmentPage.tsx`
- `src/features/hr/pages/sub-pages/TimeManagementPage.tsx`
- `src/features/hr/pages/sub-pages/PayrollManagementPage.tsx`
- targeted search hits in `src/features/clinic/pages/ClinicModulePage.tsx`
- targeted search hits in `src/features/consultation/pages/ConsultationModulePage.tsx`
- targeted search hits in `src/features/cashier/pages/CashierModulePage.tsx`
- targeted search hits in `src/features/registrar/pages/RegistrarModulePage.tsx`

### Files Updated

- `src/config/status-style.config.ts`
- `src/config/accounting.config.ts`
- `src/config/books.config.ts`
- `src/features/books/pages/BooksSetupPage.tsx`
- `docs/uiux/STSN_CONNECT_METRONIC_PHASE_0_5_AUDIT_TRACKER.md`
- `docs/uiux/STSN_CONNECT_METRONIC_PHASE_2C_TABLE_MIGRATION_TRACKER.md`

### Status Maps Centralized

- `BOOK_PACKAGE_STATUS_BADGE` now resolves from the centralized semantic status config instead of raw Tailwind color classes.
- Safe portions of `DISCOUNT_STATUS_CONFIG`, `FINANCIAL_HOLD_STATUS_CONFIG`, and `ASSESSMENT_APPROVAL_STATUS_CONFIG` now resolve from the centralized semantic status config instead of local raw color strings.

### Raw Classes Replaced

- Removed raw status badge class strings from `src/config/books.config.ts`.
- Removed safe raw status badge class strings from `src/config/accounting.config.ts`.
- Replaced Books Setup status badge spans with `AppStatusBadge` in the main package grid and the package detail view.

### AppStatusBadge Adoption Completed

- `src/features/books/pages/BooksSetupPage.tsx`
  - package grid status column
  - package detail status display

### Missing Mappings Added

- `Returned for Documents`
- `Cleared`
- `Expired`

### Intentionally Deferred Status Styling

- `src/features/hr/pages/sub-pages/RecruitmentPage.tsx`
  - hiring-pipeline statuses are module-specific and tied to transition controls
- `src/features/hr/pages/sub-pages/TimeManagementPage.tsx`
  - `Manual`, `Biometric`, and `System` are source chips, not semantic statuses
- `src/features/hr/pages/sub-pages/PayrollManagementPage.tsx`
  - `Blocking` and `Warning` are severity indicators, and some chips double as action controls
- `src/features/clinic/pages/ClinicModulePage.tsx`
  - disposition badges are feature-specific medical outcomes
- `src/features/consultation/pages/ConsultationModulePage.tsx`
  - appointment badges are paired with feature-specific icon treatments
- `src/features/cashier/pages/CashierModulePage.tsx`
- `src/features/registrar/pages/RegistrarModulePage.tsx`
  - remaining approval-status styling includes banner/container treatments that are not safe `AppStatusBadge` swaps in this phase

### Validation Results

- `npm.cmd run lint`: passed
- Typecheck: passed via `npm.cmd run lint` because the lint script is `tsc --noEmit`
- `npm.cmd run build`: passed outside the sandbox after the known Vite config access limitation blocked the sandboxed build
- Production build warning remains the existing large-JS-chunk warning from Vite
- Unknown-status fallback remains centralized through `getStatusStyle()` and was verified with a direct config check; unknown labels still render with `stsn-status-neutral`
- No status labels, status meanings, workflow rules, calculations, routing, or data sources were changed by the Phase 1B edits
- No `STSNDataTable`, `DataTableCard`, `DataTables.net`, or Metronic dependency was reintroduced by these edits

### Remaining Phase 1 Follow-Ups

- Migrate feature-specific safe badge-only surfaces in dedicated module passes once workflow-specific mappings are explicitly approved
- Separate badge-token work from future banner/panel tokenization so approval containers in Registrar/Cashier are not altered accidentally

### Recommendation For Next Phase

- Treat Phase 1B as the safe centralized status-badge cleanup pass.
- Next best follow-up is a narrow feature-by-feature status adoption batch for modules with clearly approved domain mappings, starting with non-banner badge surfaces only.

## Phase 3 Cross-Reference

- Phase 3 routing cleanup was completed after the shared-token and table-migration phases.
- `src/main.tsx` now mounts the app inside `BrowserRouter`, and `src/App.tsx` now syncs shell navigation with centralized app-route mappings instead of owning module/subpage navigation purely through local state.
- Detailed findings and validation are tracked in `docs/uiux/STSN_CONNECT_METRONIC_PHASE_3_ROUTING_TRACKER.md`.

## Phase 4 Cross-Reference

- Phase 4 focused on the shared UI foundation only, enhancing common primitives and adding reusable components for tabs, action menus, and loading/error/empty states without forcing feature-page adoption yet.
- Detailed findings, created components, deferred module migrations, and validation are tracked in `docs/uiux/STSN_CONNECT_METRONIC_PHASE_4_SHARED_COMPONENTS_TRACKER.md`.

## Phase 4B Cross-Reference

- Phase 4B validated the shared UI foundation with a deliberately small low-risk adoption batch on Accounts Management and Audit Log.
- Detailed page-level adoption notes, deferred pages, preserved behaviors, and validation results are tracked in `docs/uiux/STSN_CONNECT_METRONIC_PHASE_4_SHARED_COMPONENTS_TRACKER.md`.

## Phase 4C Cross-Reference

- Phase 4C extended shared-component adoption into a constrained medium-risk batch, updating safe action-bar, tab, loading-state, and shared-table surfaces in Curriculum, Clinic, Guidance, and Consultation while deferring workflow-heavy modules.
- Detailed page review classifications, updated pages, intentional deferrals, and validation results are tracked in `docs/uiux/STSN_CONNECT_METRONIC_PHASE_4_SHARED_COMPONENTS_TRACKER.md`.

## Phase 4D Cross-Reference

- Phase 4D applied shared components only to selected high-risk report, accounting-statement, and payroll-payout shells where the UI swap stayed outside payment, posting, approval, receipt, export, and calculation logic.
- Detailed page review classifications, updated pages, intentional deferrals, preserved high-risk behavior, and validation results are tracked in `docs/uiux/STSN_CONNECT_METRONIC_PHASE_4_SHARED_COMPONENTS_TRACKER.md`.

## Phase 4E Cross-Reference

- Phase 4E was an audit-only pass that measured shared-component adoption coverage across the project and confirmed the remaining gaps are primarily module-specific workflow surfaces rather than shell-level blockers.
- Detailed coverage findings, remaining adoption opportunities, validation results, and the Phase 5 readiness recommendation are tracked in `docs/uiux/STSN_CONNECT_METRONIC_PHASE_4_SHARED_COMPONENTS_TRACKER.md`.

## Phase 5 Cross-Reference

- Phase 5 modernized the shared application shell only, tightening sidebar, topbar, breadcrumb, content-width, and mobile-drawer consistency while preserving existing navigation, routing, and role-based visibility behavior.
- Detailed layout-shell review notes, changed files, deferred areas, responsive notes, and validation results are tracked in `docs/uiux/STSN_CONNECT_METRONIC_PHASE_5_LAYOUT_SHELL_TRACKER.md`.

## Phase 5C Cross-Reference

- Phase 5C harmonized the shared brand/theme layer onto a navy, gold, ivory academic ERP palette, updating shell and shared-component colors through centralized tokens without changing business logic, routing, or workflow behavior.
- Detailed token changes, shared-component palette updates, preserved behaviors, and validation results are tracked in `docs/uiux/STSN_CONNECT_METRONIC_PHASE_5_LAYOUT_SHELL_TRACKER.md` under `Phase 5C Brand Theme Palette Harmonization Notes`.

## Phase 5B Cross-Reference

- Phase 5B normalized shared page-header and table-toolbar spacing, plus the Registrar selected-student header and Grades Directory local table header, without changing routing, data sources, or workflow logic.
- Detailed file review notes, preserved behaviors, deferred items, and validation results are tracked in `docs/uiux/STSN_CONNECT_METRONIC_PHASE_5_LAYOUT_SHELL_TRACKER.md` under `Phase 5B Page Header and Spacing Normalization Notes`.

## Phase 6A Cross-Reference

- Phase 6A modernized only the Dashboard and Action Center visual layer using the finalized shell, shared cards, shared KPI tiles, tabs, and queue states while preserving routing, workflow logic, data sources, counts, and role behavior.
- Detailed page review notes, changed files, deferred items, and validation results are tracked in `docs/uiux/STSN_CONNECT_METRONIC_PHASE_6_MODULE_MODERNIZATION_TRACKER.md`.

## Phase 6B Cross-Reference

- Phase 6B modernized the Registrar, Admissions/Enrollment shell areas, and Student Directory visual layer using shared cards, tabs, buttons, search, status, and `AppTable` presentation while preserving routing, data sources, student selection, enrollment actions, COR behavior, and workflow logic.
- Detailed page review notes, changed files, intentionally skipped raw/output surfaces, and validation results are tracked in `docs/uiux/STSN_CONNECT_METRONIC_PHASE_6_MODULE_MODERNIZATION_TRACKER.md`.

## Phase 6C Cross-Reference

- Phase 6C modernized the Accounting and Cashiering shell surfaces with shared cards, buttons, filters, KPI tiles, and status treatment while preserving accounting calculations, cashiering workflows, receipts, reports, routing, and data sources.
- Detailed review notes, changed files, intentionally skipped print/output surfaces, and validation results are tracked in `docs/uiux/STSN_CONNECT_METRONIC_PHASE_6_MODULE_MODERNIZATION_TRACKER.md`.

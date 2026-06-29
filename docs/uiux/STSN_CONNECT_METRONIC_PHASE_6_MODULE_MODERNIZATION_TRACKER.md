# STSN Connect Metronic Phase 6 Module Modernization Tracker

Audit date: 2026-06-29

## Scope

- Phase 6A was limited to Dashboard and Action Center modernization only.
- Routing, business logic, data sources, approval workflow behavior, role behavior, counts, calculations, and permissions were intentionally preserved.
- No `STSNDataTable`, `DataTableCard`, DataTables.net, Metronic package, Bootstrap, jQuery, Material UI, Redux, or new framework dependency was added.

## Phase 6A Dashboard and Action Center Modernization Notes

### Files Reviewed

- `src/features/dashboard/pages/DashboardPage.tsx`
- `src/features/action-center/pages/ActionCenterPage.tsx`
- `src/components/common/ApprovalInbox.tsx`
- `src/components/common/AppCard.tsx`
- `src/components/common/AppKpiCard.tsx`
- `src/components/common/AppTabs.tsx`
- `src/components/common/AppButton.tsx`
- `src/components/common/AppStatusBadge.tsx`
- `src/components/common/AppEmptyState.tsx`
- `src/components/common/AppLoadingState.tsx`
- `src/index.css`
- `docs/uiux/STSN_CONNECT_METRONIC_PHASE_5_LAYOUT_SHELL_TRACKER.md`
- `docs/uiux/STSN_CONNECT_METRONIC_PHASE_0_5_AUDIT_TRACKER.md`

### Files Changed

- `src/features/dashboard/pages/DashboardPage.tsx`
- `src/features/action-center/pages/ActionCenterPage.tsx`
- `src/components/common/ApprovalInbox.tsx`
- `docs/uiux/STSN_CONNECT_METRONIC_PHASE_6_MODULE_MODERNIZATION_TRACKER.md`
- `docs/uiux/STSN_CONNECT_METRONIC_PHASE_0_5_AUDIT_TRACKER.md`

### Dashboard Visual Updates

- Added an overview hero strip above the KPI area to reinforce the page as an analytics-first landing surface.
- Rebased primary dashboard summary tiles onto shared `AppKpiCard` styling for more consistent hierarchy and spacing.
- Refreshed the enrollment promo panel to use shared `AppCard` and `AppButton` treatment while keeping the existing CTA behavior.
- Swapped the annual enrollment metric toggle onto shared `AppTabs` so the chart controls match the rest of the ERP shell.
- Updated the Upcoming Events panel to use shared empty-state and button presentation.
- Rewrapped the annual analysis, events, calendar, finance, oversight, notice board, and quick-stats panels with shared card chrome for more consistent spacing and surface hierarchy.

### Action Center Visual Updates

- Rebased the Action Center summary tiles onto shared `AppKpiCard` styling.
- Added a focused queue summary banner to reinforce the work-queue role of the page without changing queue logic.
- Modernized the approval inbox shell with shared `AppCard`, `AppTabs`, `AppButton`, `AppLoadingState`, `AppEmptyState`, and `AppStatusBadge`.
- Improved approval row hierarchy, hover treatment, and SLA emphasis while preserving drawer open behavior and tab data behavior.

### Shared Components Used

- `AppCard`
- `AppKpiCard`
- `AppTabs`
- `AppButton`
- `AppStatusBadge`
- `AppEmptyState`
- `AppLoadingState`
- `AppTable`

### Behavior Preserved

- Dashboard routing and drill-down entry points were preserved.
- Action Center routing and navigation callback behavior were preserved.
- Approval tabs, counts, row visibility, and drawer actions were preserved.
- Supabase-backed inbox data behavior was preserved.
- Existing dashboard calculations, counts, statuses, and role-sensitive values were preserved.
- No approval workflow logic, data source wiring, or permission behavior was changed.
- No table behavior was intentionally changed, and no DataTables.net dependency was reintroduced.

### Items Deferred

- Dashboard chart color/token cleanup inside SVG primitives remains a later polish pass.
- Finance period toggles on the dashboard remain visual-only legacy buttons.
- Deeper Action Center filtering, sorting, and bulk workflow UX changes were deferred to avoid touching workflow behavior.
- Broader module-by-module KPI refactors outside Dashboard and Action Center were deferred to later Phase 6 work.

### Validation Results

- `npm.cmd run lint`: passed
- `npm.cmd run build`: passed after rerunning outside the sandbox because sandboxed Vite config resolution is blocked in this repo
- Local HTTP smoke check: `http://127.0.0.1:4173` returned `200`
- Confirmed by code review and validation scope:
  - no business logic changed
  - no data sources changed
  - no routing changed
  - no approval workflow logic changed
  - no counts, calculations, statuses, permissions, or role behavior changed intentionally
  - no table behavior changed intentionally
  - no DataTables.net or Metronic dependency added

### Recommended Next Phase 6B Scope

- Extend the same modernization approach into the next workflow-heavy page batch only where shared card/tab/empty-state adoption stays outside domain logic.
- Good candidates are approval-adjacent operational pages that already use `AppTable` and shared headers but still have older local KPI or panel chrome.
- Keep any approval-decision logic, registrar/accounting calculations, and complex form workflows in narrow validation tracks instead of broad redesign passes.

## Phase 6B Registrar Admissions and Student Directory Modernization Notes

### Files Reviewed

- `src/features/registrar/pages/RegistrarModulePage.tsx`
- `src/features/student-directory/pages/StudentDirectoryPage.tsx`
- `src/components/common/AppCard.tsx`
- `src/components/common/AppButton.tsx`
- `src/components/common/AppTabs.tsx`
- `src/components/common/AppStatusBadge.tsx`
- `src/components/common/AppTable.tsx`
- `src/components/common/AppSearchInput.tsx`
- `src/components/common/ModulePageHeader.tsx`
- `src/components/common/PageHeader.tsx`
- `docs/uiux/STSN_CONNECT_METRONIC_PHASE_0_5_AUDIT_TRACKER.md`

### Files Changed

- `src/features/registrar/pages/RegistrarModulePage.tsx`
- `src/features/student-directory/pages/StudentDirectoryPage.tsx`
- `docs/uiux/STSN_CONNECT_METRONIC_PHASE_6_MODULE_MODERNIZATION_TRACKER.md`
- `docs/uiux/STSN_CONNECT_METRONIC_PHASE_0_5_AUDIT_TRACKER.md`

### Registrar Visual Updates

- Reframed the Registrar page sub-module switcher into a shared `AppCard` plus `AppTabs` layout so Admissions & Directory, Online Queue, and Bulk Import align with the finalized shell.
- Replaced older local CTA, COR, and queue bulk-action button styling with shared `AppButton` variants while preserving the same click behavior and disabled conditions.
- Updated the main directory shell to use `AppCard`, `AppSearchInput`, `AppTable`, and `AppStatusBadge` for more consistent spacing, toolbar alignment, and row-state presentation.
- Modernized the selected student detail panel with shared card chrome, shared tabs, and theme-consistent hero styling without changing detail-tab behavior or student selection logic.
- Refreshed the Online Queue and Bulk Import headers and action areas to use the navy/gold/ivory shared surface treatment instead of the older brown-heavy local styling.

### Admissions/Enrollment Visual Updates

- Kept the admissions and enrollment workflow inside `RegistrarModulePage.tsx` behaviorally unchanged while improving only the visual grouping of directory, queue, and import work areas.
- Preserved the enrollment candidate launch path, queue review actions, and import staging flow while aligning headers, sub-tabs, and work panels with shared-shell spacing.
- Left enrollment calculations, fees, assessment states, payment dependencies, and approval rules untouched.

### Student Directory Visual Updates

- Rebuilt the page shell around `ModulePageHeader`, `AppCard`, and `AppTable` so the directory reads as a cleaner registry surface with stronger overview hierarchy.
- Added a top overview card and normalized KPI presentation using shared card styling while preserving the existing student counts and search-driven totals.
- Replaced the legacy table card/search shell with `AppTable` plus `AppSearchInput` and shared quick-action buttons, preserving the modal-launch behavior for overview, grades, ledger, and profile.
- Kept status rendering on shared `AppStatusBadge` and retained the same student filtering logic and modal content wiring.

### Shared Components Used

- `AppCard`
- `AppButton`
- `AppTabs`
- `AppStatusBadge`
- `AppTable`
- `AppSearchInput`
- `ModulePageHeader`
- `PageHeader`

### Raw/Print/Export Surfaces Intentionally Skipped

- COR preview, print, export, and generated document surfaces were intentionally left raw where they function as output or document-style views.
- Enrollment preview and import-preview data surfaces were not behaviorally redesigned beyond surrounding shell chrome.
- No document-output table structure was intentionally altered.

### Behavior Preserved

- No routing was changed.
- No business logic or data sources were changed.
- No enrollment workflow, student selection, assessment, payment, document, COR, import, or approval logic was changed.
- No calculations, fees, totals, statuses, permissions, or role behavior were changed intentionally.
- Table behavior was preserved, and no DataTables.net dependency was reintroduced.
- No Metronic package or framework dependency was added.

### Validation Results

- `npm.cmd run lint`: passed
- `npm.cmd run build`: passed after rerunning outside the sandbox because sandboxed Vite config resolution is blocked in this repo
- Local HTTP smoke check: `http://127.0.0.1:4174` returned `200`
- Confirmed by code review and validation scope:
  - app still renders
  - Registrar page still loads
  - Student Directory still loads
  - student selection behavior was preserved
  - enrollment tabs and registrar sub-tabs were preserved
  - enrollment actions, queue actions, COR access, and modal record access were preserved
  - no business logic changed
  - no data sources changed
  - no routing changed
  - no table behavior changed intentionally
  - no DataTables.net or Metronic dependency added

### Recommended Next Phase 6C Scope

- Continue with another constrained module batch that benefits from shared cards, table toolbars, and selected-detail panels but still has clear workflow boundaries.
- Prioritize modules with older local shell chrome rather than pages dominated by print surfaces or calculation-heavy approval flows.
- Keep export, preview, and document-output views on a separate validation track so visual polish does not disturb output fidelity.

## Phase 6C Accounting and Cashiering Modernization Notes

### Files Reviewed

- `src/features/accounting/pages/AccountingDashboardPage.tsx`
- `src/features/accounting/pages/AccountingModulePage.tsx`
- `src/features/accounting/pages/sub-pages/APAgingPage.tsx`
- `src/features/accounting/pages/sub-pages/ARAgingPage.tsx`
- `src/features/accounting/pages/sub-pages/ChartOfAccountsPage.tsx`
- `src/features/accounting/pages/sub-pages/CostCentersPage.tsx`
- `src/features/accounting/pages/sub-pages/FinancialStatementsPage.tsx`
- `src/features/accounting/pages/sub-pages/ItemProductManagementPage.tsx`
- `src/features/accounting/pages/sub-pages/JournalEntriesPage.tsx`
- `src/features/accounting/pages/sub-pages/PurchaseInvoicesPage.tsx`
- `src/features/accounting/pages/sub-pages/SalesInvoicesPage.tsx`
- `src/features/accounting/pages/sub-pages/SupplierManagementPage.tsx`
- `src/features/cashier/pages/CashierModulePage.tsx`
- `src/components/common/AppButton.tsx`
- `src/components/common/AppCard.tsx`
- `src/components/common/AppSearchInput.tsx`
- `src/components/common/AppStatusBadge.tsx`
- `src/components/common/AppTable.tsx`
- `src/components/common/ModulePageHeader.tsx`
- `docs/uiux/STSN_CONNECT_METRONIC_PHASE_0_5_AUDIT_TRACKER.md`

### Files Changed

- `src/features/accounting/pages/AccountingModulePage.tsx`
- `src/features/accounting/pages/sub-pages/ChartOfAccountsPage.tsx`
- `src/features/cashier/pages/CashierModulePage.tsx`
- `docs/uiux/STSN_CONNECT_METRONIC_PHASE_6_MODULE_MODERNIZATION_TRACKER.md`
- `docs/uiux/STSN_CONNECT_METRONIC_PHASE_0_5_AUDIT_TRACKER.md`

### Accounting Visual Updates

- Rebased Accounting KPI tiles onto shared `AppKpiCard` treatment for tighter hierarchy and more consistent spacing.
- Updated the student-ledger shell to use shared `AppCard`, `AppSearchInput`, `AppSelect`, and `AppButton` controls for search, filters, and actions while preserving the same ledger actions.
- Normalized financial-hold badge presentation in the Accounting dashboard summary with shared `AppStatusBadge`.
- Refreshed the student payment-receipt cards to use the finalized ivory surface treatment instead of the older mocha-heavy card chrome.
- Updated Chart of Accounts CTA, KPI strip, search, filter, and export controls onto shared primitives without changing table or account maintenance behavior.

### Cashiering Visual Updates

- Updated queue approval/status chips and awaiting-accounting state chips to shared `AppStatusBadge`.
- Rebased the primary collect-payment action and report export actions onto shared `AppButton` variants for cleaner alignment and more consistent shell polish.
- Preserved the existing queue, history, report, receipt, and void-request workflows while tightening button consistency around those surfaces.

### Shared Components Used

- `AppCard`
- `AppButton`
- `AppStatusBadge`
- `AppTable`
- `AppSearchInput`
- `AppSelect`
- `AppKpiCard`
- `ModulePageHeader`

### Print/Export/Receipt/Financial Output Surfaces Intentionally Skipped

- Statement of account, ledger print preview, receipt preview, and generated receipt output surfaces were left structurally raw where document fidelity matters more than shell styling.
- Financial statement report tables, posting-detail tables, and cashier report output rows kept their current data/table behavior.
- No print/export wiring, receipt rendering, or generated financial output logic was changed.

### Behavior Preserved

- No routing was changed.
- No business logic, accounting calculations, cashiering workflow logic, data sources, totals, balances, posting rules, or approval rules were changed.
- No payment, receipt, invoice, ledger, statement, aging, print, export, or report behavior was intentionally changed.
- Table behavior was preserved, and no `STSNDataTable`, `DataTableCard`, DataTables.net, or Metronic dependency was reintroduced.

### Validation Results

- `npm.cmd run lint`: passed
- `npm.cmd run build`: passed after rerunning outside the sandbox because sandboxed Vite config resolution is blocked in this repo
- Visual/code review confirmation within this Phase 6C pass:
  - no business logic changed
  - no data sources changed
  - no routing changed
  - no table behavior changed intentionally
  - no DataTables.net or Metronic dependency added

### Recommended Next Phase 6D Scope

- Continue with the remaining finance-adjacent operational modules that still use older local search/filter/button chrome but are less sensitive than print or approval-output surfaces.
- Prioritize safe shared-component adoption in setup and directory-style screens before deeper modal or document-surface redesign.
- Keep high-fidelity report, statement, receipt, and print surfaces on a narrower QA track so visual polish does not alter accounting output expectations.

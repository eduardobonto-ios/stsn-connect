# STSN Connect Metronic Phase 2C Table Migration Tracker

Audit date: 2026-06-28

## Phase 1B Cross-Reference

- After the table migration phases, Phase 1B status token adoption was completed for the remaining safe centralized badge/config surfaces, including Books Setup badge rendering and shared accounting/books status maps.

## Phase 2C.1 Inventory Source

No standalone Phase 2C.1 tracker file existed in `docs/uiux` at the start of Phase 2C.2. The available inventory source was the Phase 2A/2B tracker recommendation list plus local repository inspection of remaining `STSNDataTable` / `DataTableCard` usages.

Low-risk candidates selected from the recorded recommendations:

- `src/features/books/pages/BooksSetupPage.tsx`
- `src/features/student-directory/pages/StudentDirectoryPage.tsx`
- `src/features/accounts/pages/AccountsManagementPage.tsx`

Already migrated before Phase 2C.2:

- `src/features/admin/pages/AuditLogPage.tsx`

## Phase 2C.2 Batch Migration Notes

### Files Migrated

- `src/features/books/pages/BooksSetupPage.tsx`
- `src/features/student-directory/pages/StudentDirectoryPage.tsx`
- `src/features/accounts/pages/AccountsManagementPage.tsx`

### Tables Migrated

- Books Setup: `Book Packages`
- Student Directory: `Learner Registry` / `Student Registry`
- Accounts Management: `Provisioned User Profiles`

### Why These Files Were Low-Risk

- `BooksSetupPage.tsx`: one setup table, page-level filters/search, local modal actions, no row-click navigation, no bulk selection, no server-side paging.
- `StudentDirectoryPage.tsx`: one directory table, page-level search, existing modal quick-access buttons, no bulk selection, no server-side paging.
- `AccountsManagementPage.tsx`: one user-security table in a tab, page-level search, one row-click drawer, one row action, no bulk selection, no server-side paging.

### Files Skipped

- Accounting module and accounting sub-pages.
- HR sub-pages.
- Registrar module tables.
- Scheduling, grading, dashboard, curriculum, clinic, cashier, consultation, guidance, faculty, class-sectioning, and other remaining table pages.

### Why Skipped Files Were Not Migrated

- They were not explicitly marked low-risk in the available tracker notes.
- Many contain nested detail tables, report tables, multi-table pages, approval workflows, row selection, generated statements, modal/detail tables, or higher workflow blast radius.
- Phase 2C.2 intentionally avoids medium-risk and high-risk migrations.

### Behavior Preserved

- Existing data sources remain unchanged.
- Existing page-level filters and search state remain page-controlled.
- Existing action buttons and modal/drawer behavior remain wired to the same handlers.
- Existing status and badge renderings are preserved.
- Empty states are preserved through `AppTable` messages.
- Loading states are explicitly passed as `loading={false}` because these migrated tables are currently store-backed/client-side and did not expose async loading flags.
- Pagination remains client-side with 10 rows per page, matching the previous `STSNDataTable` default for these pages.
- Sorting remains client-side through `AppTable`; action columns are unsortable.
- Responsive horizontal overflow is provided by `AppTable`.

### Behavior Differences

- Table chrome now follows the Phase 2A `AppTable` ERP-token styling rather than the previous `DataTableCard` plus DataTables.net styling.
- Page-size selector is visible with a single `10` option because `AppTable` does not yet hide the selector when only one page size is supplied.
- Search inputs now live in the `AppTable` toolbar but remain controlled by each page to preserve count/filter/action consistency.
- Books Setup keeps a local untyped legacy column reference during migration to avoid broad file rewriting around encoded currency text; the rendered table uses the new typed `AppTable` columns.

### Shared Formatters Used

- No shared formatter replacements were introduced in Phase 2C.2.
- Existing local formatting was preserved where changing output could affect visible behavior, especially currency, status badges, role badges, and identity cells.

### Validation Results

- `npm.cmd run lint`: failed on existing unrelated TypeScript issues:
  - `src/components/common/ApprovalInbox.tsx`
  - `src/features/accounting/pages/AccountingDashboardPage.tsx`
  - `src/features/guardian/pages/GuardianPortalPage.tsx`
  - `src/features/guidance/pages/GuidanceModulePage.tsx`
  - `src/features/payroll/pages/PayrollDashboardPage.tsx`
  - `src/features/scheduling/pages/SchedulingModulePage.tsx`
- No Phase 2C.2 migrated file errors remained after fixing migration-caused issues in `BooksSetupPage.tsx`.
- `npm.cmd run build` outside the sandbox: passed.
- Production build warning remains the existing large JS chunk warning.
- Confirmed `STSNDataTable` still exists.
- Confirmed `DataTableCard` still exists.
- Confirmed `datatables.net-dt` and `datatables.net-react` remain in `package.json`.
- Confirmed no Metronic, Bootstrap, Material UI, Redux, direct jQuery, or Metronic dependency was added.
- Confirmed medium-risk and high-risk tables were not migrated.
- Confirmed existing DataTables pages still compile in the production build.

### Remaining STSNDataTable / DataTableCard Usages

Remaining usages still exist across:

- `src/features/accounting/pages/**`
- `src/features/hr/pages/sub-pages/**`
- `src/features/registrar/pages/RegistrarModulePage.tsx`
- `src/features/class-sectioning/pages/ClassSectioningModulePage.tsx`
- `src/features/curriculum/pages/CurriculumManagementPage.tsx`
- `src/features/scheduling/pages/SchedulingModulePage.tsx`
- `src/features/faculty/pages/FacultyAdminPage.tsx`
- `src/features/clinic/pages/ClinicModulePage.tsx`
- `src/features/cashier/pages/CashierModulePage.tsx`
- `src/features/consultation/pages/ConsultationModulePage.tsx`
- `src/features/guidance/pages/GuidanceModulePage.tsx`
- `src/features/grading/pages/GradesDirectoryPage.tsx`
- `src/features/dashboard/pages/DashboardPage.tsx`
- `src/components/common/DataTableCard.tsx`
- `src/components/common/STSNDataTable.tsx`

### Recommended Next Phase 2C.3 / Phase 2D Scope

- Phase 2C.3: migrate another small batch only after reviewing each candidate for nested tables, row selection, and workflow actions.
- Recommended next candidates for review: `BenefitsPage.tsx` benefit plan/statutory tables, `ShiftManagementPage.tsx` shift tables, and `TimeManagementPage.tsx` employee time log.
- Phase 2D: defer accounting, registrar, scheduling, payroll, and report/detail tables until `AppTable` supports any needed advanced behavior such as persisted column visibility, controlled pagination UI options, row selection, and multi-table detail patterns.

## Phase 2C.3 Medium-Risk Migration Notes

Audit date: 2026-06-28

### Files Migrated

- `src/features/hr/pages/sub-pages/BenefitsPage.tsx`
- `src/features/hr/pages/sub-pages/ShiftManagementPage.tsx`
- `src/features/hr/pages/sub-pages/TimeManagementPage.tsx`

### Tables Migrated

- Benefits: `Benefit Plans`
- Benefits: `Statutory Contribution Rules`
- Shift Management: `Shift Templates`
- Shift Management: `Employee Shift Assignments`
- Time Management: `Employee Time Logs`

### Files Skipped

- Accounting module and accounting sub-pages.
- Registrar module tables.
- Scheduling, grading, dashboard, curriculum, clinic, cashier, consultation, guidance, faculty, class-sectioning, payroll, leave, recruitment, attendance, onboarding, employee lifecycle, salary payout, and report/detail table pages.

### Why Skipped Files Were Not Migrated

- They remain higher-risk than this phase because they include accounting/academic workflows, report or detail tables, nested tables, approval workflows, payroll calculations, row selection, generated statements, or larger multi-table screens.
- Phase 2C.3 intentionally migrated only the medium-risk HR tables called out for review in the Phase 2C.2 tracker.

### Behavior Preserved

- Existing store data sources remain unchanged.
- Existing category/date/employee filters remain page-controlled.
- Existing add/log/assign modal workflows remain unchanged.
- Existing active/inactive toggle actions remain wired to the same store handlers.
- Existing approve and approve-all time-log behavior remains wired to the same handlers.
- Existing status/category/source badges and text rendering are preserved.
- Existing empty messages are preserved through `AppTable` with added helper descriptions.
- Existing client-side pagination sizes were preserved:
  - Benefits plans: 15 rows.
  - Statutory rules: 10 rows.
  - Shift templates: 15 rows.
  - Shift assignments: 15 rows.
  - Time logs: 20 rows.
- Existing searchable table behavior is preserved through `AppTable` global search.
- Sorting remains client-side through `AppTable`.
- Loading states are explicitly passed as `loading={false}` because these pages are currently store-backed/client-side.

### Behavior Differences

- Table chrome now follows the Phase 2A `AppTable` ERP-token styling rather than DataTables.net styling.
- Page-size selector is visible with a single allowed page size because `AppTable` does not yet hide the selector when one option is supplied.
- `AppTable` title/description areas replace the previous unframed or `DataTableCard` table shells.
- Shift Management tables now render `AppTable` titles inside each selected tab panel.

### Special Table Behaviors Found

- Benefits `Benefit Plans` has an in-row active/inactive toggle. The toggle still stops event propagation and calls `toggleBenefitPlanActive`.
- Shift `Shift Templates` has an in-row active/inactive toggle. The toggle still stops event propagation and calls `toggleShiftTemplateActive`.
- Shift Management has tab-switched table views. The `templates` and `assignments` tabs remain page state and render separate `AppTable` instances.
- Time Management has filter-controlled data, pending-count display, per-row approval, and approve-all behavior. The filter and approval handlers were preserved.
- Shift and Time modal forms are outside the table migration scope and were left unchanged.

### Shared Formatters Used

- No shared formatter replacements were introduced in Phase 2C.3.
- Local formatting was preserved for shift duration, PHP/percentage benefit shares, salary ranges, source badges, status badges, and employee identity cells.

### Validation Results

- `npm.cmd run lint`: failed on existing unrelated TypeScript issues:
  - `src/components/common/ApprovalInbox.tsx`
  - `src/features/accounting/pages/AccountingDashboardPage.tsx`
  - `src/features/guardian/pages/GuardianPortalPage.tsx`
  - `src/features/guidance/pages/GuidanceModulePage.tsx`
  - `src/features/payroll/pages/PayrollDashboardPage.tsx`
  - `src/features/scheduling/pages/SchedulingModulePage.tsx`
- No Phase 2C.3 migrated file errors appeared in the lint output.
- `npm.cmd run build`: failed in the sandbox with the known Vite config access issue.
- `npm.cmd run build` outside the sandbox: passed.
- Production build warning remains the existing large JS chunk warning.
- Confirmed the Phase 2C.3 files no longer reference `STSNDataTable` or `DataTableCard`.
- Confirmed high-risk tables were not migrated.
- Confirmed unmigrated DataTables pages still compile in the production build.
- Confirmed `STSNDataTable` still exists.
- Confirmed `DataTableCard` still exists.
- Confirmed `datatables.net-dt` and `datatables.net-react` remain in `package.json`.
- Confirmed no Metronic, Bootstrap, Material UI, Redux, direct jQuery, or Metronic dependency was added.

### Remaining STSNDataTable / DataTableCard Usages

Remaining usages still exist across:

- `src/features/accounting/pages/**`
- `src/features/hr/pages/sub-pages/AttendancePage.tsx`
- `src/features/hr/pages/sub-pages/EmployeeLifecyclePage.tsx`
- `src/features/hr/pages/sub-pages/LeaveManagementPage.tsx`
- `src/features/hr/pages/sub-pages/OnboardingPage.tsx`
- `src/features/hr/pages/sub-pages/PayrollManagementPage.tsx`
- `src/features/hr/pages/sub-pages/RecruitmentPage.tsx`
- `src/features/hr/pages/sub-pages/SalaryPayoutsPage.tsx`
- `src/features/registrar/pages/RegistrarModulePage.tsx`
- `src/features/class-sectioning/pages/ClassSectioningModulePage.tsx`
- `src/features/curriculum/pages/CurriculumManagementPage.tsx`
- `src/features/scheduling/pages/SchedulingModulePage.tsx`
- `src/features/faculty/pages/FacultyAdminPage.tsx`
- `src/features/clinic/pages/ClinicModulePage.tsx`
- `src/features/cashier/pages/CashierModulePage.tsx`
- `src/features/consultation/pages/ConsultationModulePage.tsx`
- `src/features/guidance/pages/GuidanceModulePage.tsx`
- `src/features/grading/pages/GradesDirectoryPage.tsx`
- `src/features/dashboard/pages/DashboardPage.tsx`
- `src/components/common/DataTableCard.tsx`
- `src/components/common/STSNDataTable.tsx`

### Recommended Next Phase 2C.4 High-Risk Migration Scope

- Review high-risk HR tables next only if the workflow owner accepts the blast radius:
  - `AttendancePage.tsx`
  - `LeaveManagementPage.tsx`
  - `EmployeeLifecyclePage.tsx`
  - `RecruitmentPage.tsx`
- Defer accounting, registrar, scheduling, payroll, financial statements, invoice detail tables, report/detail tables, and dashboard modal tables until `AppTable` supports any needed advanced behavior such as persisted column visibility, controlled page-size UI hiding, row selection, bulk actions, and multi-table detail patterns.

## Phase 2C.4 High-Risk Migration Notes

Audit date: 2026-06-28

### High-Risk Files Reviewed

- `src/features/hr/pages/sub-pages/AttendancePage.tsx`
- `src/features/hr/pages/sub-pages/LeaveManagementPage.tsx`
- `src/features/hr/pages/sub-pages/EmployeeLifecyclePage.tsx`
- `src/features/hr/pages/sub-pages/RecruitmentPage.tsx`
- Remaining inventory from repository search was grouped by workflow:
  - Student / Registrar / Enrollment: `RegistrarModulePage.tsx`, `ClassSectioningModulePage.tsx`, curriculum tables.
  - Accounting / Reports: `AccountingModulePage.tsx`, accounting sub-pages, financial statements, AP/AR aging, invoices, journals, dashboard modal report table.
  - Cashiering: `CashierModulePage.tsx`.
  - Grading: `GradesDirectoryPage.tsx`.
  - Payroll / HR: `PayrollManagementPage.tsx`, `SalaryPayoutsPage.tsx`, remaining HR workflow pages.
  - Faculty: `FacultyAdminPage.tsx`.
  - Clinic / Guidance / Consultation: `ClinicModulePage.tsx`, `GuidanceModulePage.tsx`, `ConsultationModulePage.tsx`.
  - Scheduling: `SchedulingModulePage.tsx`.

### Files Migrated

- `src/components/common/AppTable.tsx`
- `src/features/hr/pages/sub-pages/AttendancePage.tsx`
- `src/features/hr/pages/sub-pages/LeaveManagementPage.tsx`

### Tables Migrated

- Attendance: `Attendance Records`
- Leave Management: `Leave Requests`
- Leave Management: `Leave Types`

### Files Intentionally Skipped

- `src/features/hr/pages/sub-pages/EmployeeLifecyclePage.tsx`
- `src/features/hr/pages/sub-pages/RecruitmentPage.tsx`
- Accounting module and accounting sub-pages.
- Registrar, enrollment, scheduling, grading, cashiering, payroll, faculty, clinic, guidance, consultation, curriculum, dashboard, and report/detail table files.

### Reason Each Skipped File Was Deferred

- `EmployeeLifecyclePage.tsx`: uses selected-row highlighting and a side profile panel; should be migrated after `AppTable` has a formal selected-row API or after a dedicated QA pass for row selection behavior.
- `RecruitmentPage.tsx`: contains nested applicant tables inside a requisition detail panel plus multi-step applicant/requisition status transitions; best handled as a dedicated workflow batch.
- Accounting and report tables: contain financial workflows, generated statements, nested line/detail tables, and higher audit risk.
- Registrar/enrollment/class-sectioning/scheduling/grading tables: touch academic placement, enrollment, and schedule workflows with broader regression risk.
- Payroll/cashiering/faculty/clinic/guidance/consultation tables: deferred to keep Phase 2C.4 to one high-risk workflow batch.

### Behavior Preserved

- Existing store data sources remain unchanged.
- Attendance month, employee, and status filters remain page-controlled.
- Attendance status summary chips remain clickable and continue toggling the status filter.
- Attendance record modal trigger and save behavior remain unchanged.
- Leave request employee/status filters remain page-controlled.
- Leave request approval, rejection, and cancellation row actions remain wired to the same handlers and keep `stopPropagation`.
- Leave request SLA badge rendering is preserved.
- Leave request row color coding is preserved through the new `AppTable` `getRowClassName` callback.
- Leave request and leave type tab behavior remains unchanged.
- Existing empty messages and page sizes were preserved:
  - Attendance records: 20 rows.
  - Leave requests: 15 rows.
  - Leave types: 10 rows.
- Existing searchable table behavior is preserved through `AppTable` global search.
- Loading states are explicitly passed as `loading={false}` because these pages are currently store-backed/client-side.

### Behavior Differences

- Table chrome now follows the Phase 2A `AppTable` ERP-token styling rather than the previous `DataTableCard` plus DataTables.net styling.
- Page-size selector is visible with a single allowed page size because `AppTable` does not yet hide the selector when one option is supplied.
- Attendance summary chips now render as a standalone ERP-token bordered strip immediately above the table, preserving the old above-table position without nesting them in a `DataTableCard`.

### Workflow Risks Found

- `AppTable` needed row-level styling support to preserve `LeaveManagementPage.tsx` request status row colors.
- `EmployeeLifecyclePage.tsx` still needs selected-row support before migration.
- `RecruitmentPage.tsx` has nested applicant table behavior and pipeline transitions that should be migrated separately.
- Accounting/reporting tables remain the highest-risk group because table output may be financially meaningful or printable/exportable.

### Validation Results

- `npm.cmd run lint`: failed on existing unrelated TypeScript issues:
  - `src/components/common/ApprovalInbox.tsx`
  - `src/features/accounting/pages/AccountingDashboardPage.tsx`
  - `src/features/guardian/pages/GuardianPortalPage.tsx`
  - `src/features/guidance/pages/GuidanceModulePage.tsx`
  - `src/features/payroll/pages/PayrollDashboardPage.tsx`
  - `src/features/scheduling/pages/SchedulingModulePage.tsx`
- No Phase 2C.4 migrated file errors appeared in the lint output.
- `npm.cmd run build` outside the sandbox: passed.
- Production build warning remains the existing large JS chunk warning.
- Confirmed the Phase 2C.4 files no longer reference `STSNDataTable` or `DataTableCard`.
- Confirmed only the selected high-risk batch was migrated.
- Confirmed `STSNDataTable` still exists.
- Confirmed `DataTableCard` still exists.
- Confirmed `datatables.net-dt` and `datatables.net-react` remain in `package.json`.
- Confirmed no Metronic, Bootstrap, Material UI, Redux, direct jQuery, or Metronic dependency was added.

### Remaining STSNDataTable / DataTableCard Usages

Remaining usages still exist across:

- `src/features/accounting/pages/**`
- `src/features/cashier/pages/CashierModulePage.tsx`
- `src/features/class-sectioning/pages/ClassSectioningModulePage.tsx`
- `src/features/clinic/pages/ClinicModulePage.tsx`
- `src/features/consultation/pages/ConsultationModulePage.tsx`
- `src/features/curriculum/pages/CurriculumManagementPage.tsx`
- `src/features/dashboard/pages/DashboardPage.tsx`
- `src/features/faculty/pages/FacultyAdminPage.tsx`
- `src/features/grading/pages/GradesDirectoryPage.tsx`
- `src/features/guidance/pages/GuidanceModulePage.tsx`
- `src/features/hr/pages/sub-pages/EmployeeLifecyclePage.tsx`
- `src/features/hr/pages/sub-pages/OnboardingPage.tsx`
- `src/features/hr/pages/sub-pages/PayrollManagementPage.tsx`
- `src/features/hr/pages/sub-pages/RecruitmentPage.tsx`
- `src/features/hr/pages/sub-pages/SalaryPayoutsPage.tsx`
- `src/features/registrar/pages/RegistrarModulePage.tsx`
- `src/features/scheduling/pages/SchedulingModulePage.tsx`
- `src/components/common/DataTableCard.tsx`
- `src/components/common/STSNDataTable.tsx`

### Recommendation For Phase 2C.5 Or Phase 2D

- Phase 2C.5: migrate one remaining high-risk HR workflow at a time:
  - First candidate: `EmployeeLifecyclePage.tsx`, after adding selected-row support to `AppTable`.
  - Second candidate: `RecruitmentPage.tsx`, as its own nested-table/status-pipeline migration.
- Phase 2D: handle accounting, registrar/enrollment, scheduling, payroll, and report/detail tables only after `AppTable` supports selected rows, optional page-size selector hiding, persisted column visibility, row selection/bulk actions, and nested/detail table guidance.

## Phase 2C.5 AppTable Advanced Capability Notes

Audit date: 2026-06-28

### AppTable Capabilities Added

- Optional selected-row display support through `selectedRowId`, `selectedRowKey`, existing `getRowId`, and existing `onRowClick`.
- Keyboard-safe clickable rows for `onRowClick` tables using `tabIndex`, `role="button"`, and Enter/Space activation.
- Optional checkbox row selection through `enableRowSelection`.
- Controlled and uncontrolled selection support through `selectedRowIds`, `defaultSelectedRowIds`, and `onSelectionChange`.
- Select-all-visible support in the table header.
- Disabled row selection support through `isRowSelectionDisabled`.
- Optional bulk action toolbar through `renderBulkActions`, selected count display, and clear-selection action.
- Optional page-size selector hiding when `pageSizeOptions` contains only one value.
- Optional controlled pagination through `pageIndex`, `pageSize`, and `onPaginationChange`, while preserving the existing internal client-side pagination default.
- Optional persisted column visibility through `columnVisibilityPersistenceKey` with safe localStorage fallback.
- Compact/nested table layout support through `compact` and `density`.
- Action compatibility slots through `rightToolbar` and `tableActions`.

### Files Changed

- `src/components/common/AppTable.tsx`
- `docs/uiux/STSN_CONNECT_METRONIC_PHASE_2C_TABLE_MIGRATION_TRACKER.md`

### Backward Compatibility Notes

- Existing `AppTable` callers do not need to change.
- Existing search, sorting, loading state, empty state, row actions, row class names, and client-side pagination behavior remain enabled by default.
- Existing single-page-size migrated tables now hide the page-size dropdown instead of showing a one-option selector.
- Selection, selected-row styling, persistence, controlled pagination, compact density, and extra toolbar slots are opt-in.
- `STSNDataTable`, `DataTableCard`, and DataTables.net dependencies remain in place for unmigrated tables.

### API Changes

- New optional props: `rightToolbar`, `tableActions`, `columnVisibilityPersistenceKey`, `pageIndex`, `pageSize`, `onPaginationChange`, `selectedRowId`, `selectedRowKey`, `enableRowSelection`, `selectedRowIds`, `defaultSelectedRowIds`, `onSelectionChange`, `isRowSelectionDisabled`, `renderBulkActions`, `compact`, and `density`.
- Existing `getRowId`, `onRowClick`, and `getRowClassName` were preserved and now participate in selected-row and keyboard row interaction behavior.
- No dependency or routing changes were introduced.

### How Selected-Row Tables Should Migrate

- Pass a stable `getRowId` whenever the source record has an id.
- Pass `selectedRowId` to highlight the currently selected record.
- Use `selectedRowKey` only when the selected value is based on a row field that differs from TanStack's row id.
- Use `onRowClick` for master/detail or side-panel workflows; row click will remain keyboard accessible.

### How Bulk-Selection Tables Should Migrate

- Enable checkbox selection with `enableRowSelection`.
- Use uncontrolled selection for simple local workflows with `defaultSelectedRowIds`.
- Use controlled selection with `selectedRowIds` and `onSelectionChange` for approval, export, batch update, or cross-component state.
- Use `isRowSelectionDisabled` for locked, posted, archived, or non-actionable rows.
- Use `renderBulkActions` for workflow-specific batch buttons; keep export/print/download implementations in the feature page so existing behavior is preserved.

### How Nested/Detail Tables Should Migrate

- Use `compact` or `density="compact"` for nested/detail tables inside panels, modals, drawers, and expanded rows.
- Keep nested table data sources local to the detail view and provide a stable `getRowId` when rows can be sorted or selected.
- Prefer `tableActions` for small detail-table actions and `rightToolbar` for table-level commands.
- Keep nested tables inside an overflow-safe container and avoid nesting card shells inside existing card/detail shells.

### Validation Results

- `npm.cmd run lint`: failed on existing unrelated TypeScript issues:
  - `src/components/common/ApprovalInbox.tsx`
  - `src/features/accounting/pages/AccountingDashboardPage.tsx`
  - `src/features/guardian/pages/GuardianPortalPage.tsx`
  - `src/features/guidance/pages/GuidanceModulePage.tsx`
  - `src/features/payroll/pages/PayrollDashboardPage.tsx`
  - `src/features/scheduling/pages/SchedulingModulePage.tsx`
- No `AppTable` errors appeared in the lint/typecheck output.
- `npm.cmd run build`: failed in the sandbox with the known Vite config access issue.
- `npm.cmd run build` outside the sandbox: passed.
- Production build warning remains the existing large JS chunk warning.
- Confirmed no feature pages were migrated in Phase 2C.5.
- Confirmed no new dependency was added.
- Confirmed `STSNDataTable`, `DataTableCard`, `datatables.net-dt`, and `datatables.net-react` remain in the project.

### Recommended Next Phase 2C.6 Migration Batch

- First candidate: `src/features/hr/pages/sub-pages/EmployeeLifecyclePage.tsx`, using `selectedRowId`, `getRowId`, and `onRowClick` for the selected employee/profile panel workflow.
- Second candidate: `src/features/hr/pages/sub-pages/RecruitmentPage.tsx`, using `compact` nested `AppTable` instances for applicant/detail tables and preserving requisition/applicant status transitions.
- Keep accounting, registrar/enrollment, scheduling, payroll, cashiering, and report/detail tables deferred until the HR high-risk patterns have been exercised with the new advanced API.

## Phase 2C.6 Remaining HR Workflow Migration Notes

Audit date: 2026-06-28

### Files Reviewed

- `src/features/hr/pages/sub-pages/EmployeeLifecyclePage.tsx`
- `src/features/hr/pages/sub-pages/RecruitmentPage.tsx`
- `src/features/hr/pages/sub-pages/OnboardingPage.tsx`
- `src/features/hr/pages/sub-pages/PayrollManagementPage.tsx`
- `src/features/hr/pages/sub-pages/SalaryPayoutsPage.tsx`

### Files Migrated

- `src/features/hr/pages/sub-pages/EmployeeLifecyclePage.tsx`
- `src/features/hr/pages/sub-pages/RecruitmentPage.tsx`
- `src/features/hr/pages/sub-pages/OnboardingPage.tsx`
- `src/features/hr/pages/sub-pages/PayrollManagementPage.tsx`
- `src/features/hr/pages/sub-pages/SalaryPayoutsPage.tsx`
- `src/components/common/AppTable.tsx`

### Files Intentionally Skipped

- No target HR files were skipped.
- The custom payroll employee roster list and CSV import preview table in `PayrollManagementPage.tsx` were left unchanged because they were not `STSNDataTable` or `DataTableCard` usages.
- Accounting, registrar/enrollment, scheduling, grading, cashiering, clinic, guidance, consultation, dashboard, faculty, curriculum, and report/detail tables were not migrated in this phase.

### Tables Migrated

- Employee Lifecycle: `Employee Records`.
- Recruitment: `Job Requisitions`.
- Recruitment: nested requisition-detail `Applicants`.
- Recruitment: `All Applicants`.
- Onboarding: `Onboarding Employees`.
- Payroll Management: `Payroll Exceptions`.
- Payroll Management: `Payroll Runs`.
- Payroll Management: `Latest Run Lines`.
- Payroll Management: `Personal Bi-weekly Payroll Ledger`.
- Salary Payouts: `Salary Payout Batches`.
- Salary Payouts: nested payout-detail `Payout Lines`.

### Special Behaviors Preserved

- Employee Lifecycle selected-row profile panel, row click behavior, chevron row action, department/status filters, page-controlled search, and status-change modal were preserved.
- Recruitment requisition selected-row detail panel, requisition status transition buttons, applicant add modal, requisition add modal, applicant pipeline move/reject actions, tabs, and all-applicants table were preserved.
- Onboarding selected employee checklist panel, status filter chips, progress rendering, task complete action, and task skip action were preserved.
- Payroll exception review, payroll run submit/approve/create-payout actions, latest run lines, personal payroll paid-status toggle, payslip preview trigger, payroll run generation, legacy ledger action, add employee modal, and import workflow were preserved.
- Salary Payout selected batch detail panel, release action, status filter chips, and nested payout line rendering were preserved.

### AppTable Advanced Features Used

- `selectedRowId`, `getRowId`, and `onRowClick` for selected master/detail rows.
- `compact` for nested/detail and dense payroll workflow tables.
- Single-option `pageSizeOptions` to preserve previous fixed page lengths while hiding the page-size selector.
- `appTableColumnsFromLegacy` adapter to preserve existing cell render logic without retaining DataTables.net usage.
- `toolbar` for page-level filter/search controls previously supplied through `DataTableCard`.

### Behavior Differences

- Table chrome now follows `AppTable` ERP-token styling instead of `DataTableCard`/DataTables.net styling.
- Single-option page-size selectors are hidden by the Phase 2C.5 `AppTable` behavior.
- Employee Lifecycle keeps the search input in the `AppTable` toolbar with page-controlled filtering.
- Onboarding preserves the custom "No employees in onboarding" panel as a plain ERP-token section when there are no onboarding employees, and uses `AppTable` once employees exist.
- Payroll Management still uses its bespoke roster list and CSV preview table because those are not legacy table component usages.

### Validation Results

- `npm.cmd run lint`: failed on existing unrelated TypeScript issues:
  - `src/components/common/ApprovalInbox.tsx`
  - `src/features/accounting/pages/AccountingDashboardPage.tsx`
  - `src/features/guardian/pages/GuardianPortalPage.tsx`
  - `src/features/guidance/pages/GuidanceModulePage.tsx`
  - `src/features/payroll/pages/PayrollDashboardPage.tsx`
  - `src/features/scheduling/pages/SchedulingModulePage.tsx`
- No Phase 2C.6 migrated HR file errors appeared in the lint/typecheck output.
- `npm.cmd run build`: failed in the sandbox with the known Vite config access issue.
- `npm.cmd run build` outside the sandbox: passed.
- Production build warning remains the existing large JS chunk warning.
- Confirmed only the selected HR workflow table files were migrated.
- Confirmed accounting, registrar/enrollment, scheduling, grading, cashiering, clinic, guidance, consultation, dashboard, and report tables were not migrated.
- Confirmed `src/features/hr/pages/sub-pages/**` has no remaining `STSNDataTable`, `DataTableCard`, or `STSNColumn` references.
- Confirmed `STSNDataTable` still exists.
- Confirmed `DataTableCard` still exists.
- Confirmed `datatables.net-dt` and `datatables.net-react` remain in `package.json`.
- Confirmed no Metronic, Bootstrap, Material UI, Redux, direct jQuery, or Metronic dependency was added.

### Remaining STSNDataTable/DataTableCard Usages

Remaining usages still exist across:

- `src/features/accounting/pages/**`
- `src/features/cashier/pages/CashierModulePage.tsx`
- `src/features/class-sectioning/pages/ClassSectioningModulePage.tsx`
- `src/features/clinic/pages/ClinicModulePage.tsx`
- `src/features/consultation/pages/ConsultationModulePage.tsx`
- `src/features/curriculum/pages/CurriculumManagementPage.tsx`
- `src/features/dashboard/pages/DashboardPage.tsx`
- `src/features/faculty/pages/FacultyAdminPage.tsx`
- `src/features/grading/pages/GradesDirectoryPage.tsx`
- `src/features/guidance/pages/GuidanceModulePage.tsx`
- `src/features/registrar/pages/RegistrarModulePage.tsx`
- `src/features/scheduling/pages/SchedulingModulePage.tsx`
- `src/components/common/DataTableCard.tsx`
- `src/components/common/STSNDataTable.tsx`

### Recommendation For Phase 2C.7

- Migrate one non-accounting, non-registrar workflow group next.
- Recommended first candidates:
  - `src/features/faculty/pages/FacultyAdminPage.tsx`
  - `src/features/curriculum/pages/CurriculumManagementPage.tsx`
  - `src/features/grading/pages/GradesDirectoryPage.tsx` only if academic grading owners accept the regression risk.
- Continue deferring accounting, cashiering, registrar/enrollment, scheduling, clinic, guidance, consultation, dashboard modal/report tables, and financial/report-detail tables until their workflow-specific QA pass is scheduled.

## Phase 2C.7 Academic / Registrar / Scheduling Migration Notes

Audit date: 2026-06-28

### Files Reviewed

- `src/features/registrar/pages/RegistrarModulePage.tsx`
- `src/features/class-sectioning/pages/ClassSectioningModulePage.tsx`
- `src/features/curriculum/pages/CurriculumManagementPage.tsx`
- `src/features/scheduling/pages/SchedulingModulePage.tsx`
- `src/features/grading/pages/GradesDirectoryPage.tsx`
- `src/features/faculty/pages/FacultyAdminPage.tsx`
- Related folder scan: `src/features/registrar/components/EnrollmentWizard.tsx`, `src/features/faculty/pages/FacultyPortalPage.tsx`, `src/features/grading/components/GradeSheetTable.tsx`, and `src/features/grading/components/GradeSummaryView.tsx`.

### Files Migrated

- `src/features/registrar/pages/RegistrarModulePage.tsx`
- `src/features/class-sectioning/pages/ClassSectioningModulePage.tsx`
- `src/features/curriculum/pages/CurriculumManagementPage.tsx`
- `src/features/scheduling/pages/SchedulingModulePage.tsx`
- `src/features/grading/pages/GradesDirectoryPage.tsx`
- `src/features/faculty/pages/FacultyAdminPage.tsx`

### Files Intentionally Skipped

- `src/features/registrar/components/EnrollmentWizard.tsx`: raw subject preview table is embedded in the enrollment form wizard and is not a legacy table component usage.
- `src/features/faculty/pages/FacultyPortalPage.tsx`: faculty portal raw tables are separate portal/detail/entry surfaces outside the requested parent page migration.
- `src/features/grading/components/GradeSheetTable.tsx`: specialized grade-entry grid, not safe to standardize in this directory migration.
- `src/features/grading/components/GradeSummaryView.tsx`: grading summary/report table, deferred with report/detail tables.
- Registrar raw detail, document, payment, and import-preview tables inside `RegistrarModulePage.tsx`: deferred as detail/import validation surfaces.
- Faculty raw advisory, section-student, and attendance tables inside `FacultyAdminPage.tsx`: deferred as modal detail/entry surfaces.
- Class-sectioning print-window HTML table and view-students modal raw table: deferred because the print table is generated document markup and the modal is a detail view.
- Grades raw expandable master table: deferred because it uses custom expanded `<tr>` detail rows; should wait for an AppTable expansion/detail-row pattern.

### Tables Migrated

- Registrar: student admissions/directory table.
- Registrar: online application queue table.
- Class Sectioning: add-students eligible roster table with bulk selection.
- Class Sectioning: section registry table.
- Curriculum: active curriculum subject list.
- Curriculum: course programs table.
- Curriculum: subject catalog table.
- Scheduling: class schedules list table.
- Grading: nested student grades table inside expanded section detail.
- Faculty: faculty members directory table.

### Special Behaviors Preserved

- Registrar selected-student detail panel, row click behavior, selected-row display, status row coloring, source/status badges, COR modal trigger, online application row click into linked student enrollment detail, and bulk accept/reject queue actions.
- Class-sectioning add-students bulk selection, selected-count footer, capacity validation, assign-to-section save behavior, section status toggle, add/view/edit/delete row actions, and delete confirmation.
- Curriculum course/subject CRUD modal triggers, active curriculum subject removal action, empty state, and active curriculum selection behavior.
- Scheduling list/grid mode switch, filters, conflict-only mode, conflict icon display, conflict footer summary, active schedule toggle, edit/delete actions, and create/edit modal behavior.
- Grading nested student-grade renderers, teacher submission panel, period filter context, grade/rating badges, and fixed 50-row nested page length.
- Faculty search, KPI counts, row action buttons, and modal triggers for overview, schedule, attendance, and grading.

### AppTable Advanced Features Used

- `appTableColumnsFromLegacy` to preserve existing cell renderers while removing DataTables.net usage from migrated tables.
- `selectedRowId`, `getRowId`, and `onRowClick` for the registrar selected-student workflow.
- `enableRowSelection`, controlled `selectedRowIds`, and `onSelectionChange` for class-sectioning add-students bulk selection.
- `getRowClassName` for registrar status-colored rows and online application queue status coloring.
- `compact` for modal/nested academic tables.
- Single-option `pageSizeOptions` to preserve fixed page lengths while hiding one-option page-size controls.
- AppTable `toolbar` slots for page-controlled search and filters.

### Behavior Differences

- Migrated table chrome now uses AppTable ERP-token styling instead of `DataTableCard` / `STSNDataTable` / DataTables.net chrome.
- Page-controlled search inputs now live in AppTable toolbar slots for migrated wrapper tables.
- The scheduling table keeps its conflict summary as a small footer immediately below AppTable instead of inside `DataTableCard`.
- No workflow simplification, routing change, data-source change, or modal trigger change was introduced.

### Validation Results

- `rg` confirmed the six Phase 2C.7 target pages no longer reference `STSNDataTable`, `DataTableCard`, or `STSNColumn`.
- `npm.cmd run lint`: failed only on existing unrelated TypeScript issues:
  - `src/components/common/ApprovalInbox.tsx`
  - `src/features/accounting/pages/AccountingDashboardPage.tsx`
  - `src/features/guardian/pages/GuardianPortalPage.tsx`
  - `src/features/guidance/pages/GuidanceModulePage.tsx`
  - `src/features/payroll/pages/PayrollDashboardPage.tsx`
- No Phase 2C.7 migrated file errors remained in the lint/typecheck output.
- `npm.cmd run build`: failed in the sandbox with the known Vite config access issue.
- `npm.cmd run build` outside the sandbox: passed.
- Production build warning remains the existing large JS chunk warning.
- Confirmed accounting, cashiering, clinic, guidance, consultation, dashboard, and report/detail tables were not migrated.
- Confirmed `STSNDataTable` still exists.
- Confirmed `DataTableCard` still exists.
- Confirmed `datatables.net-dt` and `datatables.net-react` remain in `package.json`.
- Confirmed no Metronic, Bootstrap, Material UI, Redux, direct jQuery, or Metronic dependency was added.

### Remaining STSNDataTable/DataTableCard Usages

Remaining usages still exist across:

- `src/features/accounting/pages/**`
- `src/features/cashier/pages/CashierModulePage.tsx`
- `src/features/clinic/pages/ClinicModulePage.tsx`
- `src/features/consultation/pages/ConsultationModulePage.tsx`
- `src/features/dashboard/pages/DashboardPage.tsx`
- `src/features/guidance/pages/GuidanceModulePage.tsx`
- `src/components/common/DataTableCard.tsx`
- `src/components/common/STSNDataTable.tsx`

### Recommendation For Phase 2C.8

- Migrate clinic, consultation, and guidance as one student-services batch if workflow owners accept the shared clinical/guidance regression risk.
- Keep accounting, cashiering, dashboard modal/report tables, and financial report/detail tables deferred until a dedicated financial/report QA phase.
- Add or document a formal AppTable expandable/detail-row pattern before migrating the raw grading master table and other expandable/detail tables.

## Phase 2C.8 Student Support Migration Notes

Audit date: 2026-06-28

### Files Reviewed

- `src/features/clinic/pages/ClinicModulePage.tsx`
- `src/features/guidance/pages/GuidanceModulePage.tsx`
- `src/features/consultation/pages/ConsultationModulePage.tsx`

No related subpages/components exist under `src/features/clinic`, `src/features/guidance`, or `src/features/consultation`.

### Files Migrated

- `src/features/clinic/pages/ClinicModulePage.tsx`
- `src/features/guidance/pages/GuidanceModulePage.tsx`
- `src/features/consultation/pages/ConsultationModulePage.tsx`

### Files Intentionally Skipped

- No related support-module files were skipped because the three target folders only contain the parent page files.
- Consultation pending request cards inside `ConsultationModulePage.tsx` were left unchanged because they are a workflow action queue with confirm/decline controls and custom pagination, not a legacy table component.
- Clinic today's visits list and health profile cards inside `ClinicModulePage.tsx` were left unchanged because they are card/list workflow surfaces, not table components.
- Guidance form and detail modals inside `GuidanceModulePage.tsx` were left unchanged because they do not contain table usages.

### Tables Migrated

- Clinic: `Visit History`.
- Guidance: `Anecdotal Records`.
- Guidance: `Counseling Sessions`.
- Consultation: confirmed appointments table and its empty-state fallback for pending requests.

### Special Behaviors Preserved

- Clinic visit history keeps the same Supabase-loaded data source, page-controlled search/disposition filters, export source rows, disposition badges, detail modal trigger, 10-row pagination, and empty message.
- Guidance anecdotal records keep the same Supabase-loaded data source, shared search, incident type filter, confidential indicator, pending follow-up indicator, detail modal trigger, 10-row pagination, and empty message.
- Guidance counseling sessions keep the same shared search, status filter, status badges, detail modal trigger, 10-row pagination, and empty message.
- Consultation confirmed appointments keep the same scoped data source, search/status filter, status badge rendering, detail modal trigger, mark-completed workflow from the detail modal, 10-row pagination, and empty message.
- Consultation pending request queue, confirm/decline actions, confirmation modal, and custom pagination were preserved unchanged.

### AppTable Advanced Features Used

- `appTableColumnsFromLegacy` to preserve existing legacy column renderers while removing DataTables.net usage from migrated support tables.
- `getRowId` for stable row identity.
- `loading` to surface existing async load state in migrated support tables.
- Single-option `pageSizeOptions` to preserve fixed 10-row pagination while hiding one-option page-size controls.
- AppTable client-side sorting and pagination for migrated support tables.

### Behavior Differences

- Migrated table chrome now follows `AppTable` ERP-token styling instead of `STSNDataTable` / DataTables.net styling.
- Guidance confidential and follow-up icons now put tooltip text on wrapper spans instead of passing unsupported `title` props to lucide icons; visible behavior is unchanged.
- No workflow simplification, routing change, data-source change, modal trigger change, export change, or action change was introduced.

### Validation Results

- `rg` confirmed the three Phase 2C.8 target pages no longer reference `STSNDataTable`, `DataTableCard`, or `STSNColumn`.
- `npm.cmd run lint`: failed only on existing unrelated TypeScript issues:
  - `src/components/common/ApprovalInbox.tsx`
  - `src/features/accounting/pages/AccountingDashboardPage.tsx`
  - `src/features/guardian/pages/GuardianPortalPage.tsx`
  - `src/features/payroll/pages/PayrollDashboardPage.tsx`
- No Phase 2C.8 migrated file errors remained in the lint/typecheck output.
- `npm.cmd run build`: failed in the sandbox with the known Vite config access issue.
- `npm.cmd run build` outside the sandbox: passed.
- Production build warning remains the existing large JS chunk warning.
- Confirmed only clinic/guidance/consultation tables were migrated in this phase.
- Confirmed accounting, cashiering, dashboard, and unrelated report/detail tables were not migrated.
- Confirmed `STSNDataTable` still exists.
- Confirmed `DataTableCard` still exists.
- Confirmed `datatables.net-dt` and `datatables.net-react` remain in `package.json`.
- Confirmed no Metronic, Bootstrap, Material UI, Redux, direct jQuery, or Metronic dependency was added.

### Remaining STSNDataTable/DataTableCard Usages

Remaining usages still exist across:

- `src/features/accounting/pages/**`
- `src/features/cashier/pages/CashierModulePage.tsx`
- `src/features/dashboard/pages/DashboardPage.tsx`
- `src/components/common/DataTableCard.tsx`
- `src/components/common/STSNDataTable.tsx`

### Recommendation For Phase 2C.9

- Migrate cashiering next as its own workflow batch if owners accept payment-queue regression risk.
- Keep accounting and financial report/detail tables deferred for a dedicated financial QA phase.
- Keep dashboard modal/report tables deferred until report/detail table patterns are finalized.

## Phase 2C.9 Cashiering Migration Notes

Audit date: 2026-06-28

### Files Reviewed

- `src/features/cashier/pages/CashierModulePage.tsx`
- Related folder scan found no additional cashiering subpages/components under `src/features/cashier/**`.

### Files Migrated

- `src/features/cashier/pages/CashierModulePage.tsx`

### Files Intentionally Skipped

- No related cashiering files were skipped because the cashiering feature folder only contains the parent page.
- Payment Queue cards were left unchanged because they contain collect-payment actions, read-only assessment summaries, balance display, and custom 5-row card pagination.
- Awaiting Accounting cards were left unchanged because they are read-only workflow context, not table components.
- Collect Payment modal, Void Request modal, and Receipt Preview modal were left unchanged because they are payment/receipt workflow surfaces, not table usages.

### Tables Migrated

- Cashiering: `Payment Collection History`.
- Cashiering: `Report Generator` output table.

### Payment/Receipt Behaviors Preserved

- `openCollect` still preloads balance, method, remittance term, and clears OR errors.
- `handlePostPayment` still validates amount and unique BIR OR number, posts via `addPayment`, closes collect modal, and opens receipt preview.
- History `View` still calls `reprintReceipt`.
- History `Void` still opens the void request modal and preserves existing void eligibility logic.
- Void request submission still calls `submitVoidRequest` and remains accounting-approved.
- Receipt preview and `ReceiptPreview` payload are unchanged.
- Report export still uses the same `reportRows` and `reportColumns` payload for print/CSV/Excel/PDF.

### AppTable Advanced Features Used

- Native `AppTableColumn` definitions for nested payment/student history rows to preserve nested field rendering and sorting.
- Dynamic `AppTableColumn` definitions for report rows based on existing report schema.
- `getRowId` for stable payment row identity.
- Single-option `pageSizeOptions` to preserve fixed 10-row page length while hiding one-option selector.
- AppTable client-side sorting/pagination.

### Behavior Differences

- Migrated table chrome now uses AppTable ERP-token styling instead of STSNDataTable/DataTables.net styling.
- History amount formatting now uses existing `formatMoney`, preserving peso/currency display while avoiding legacy mojibake in the column renderer.
- Payment queue card pagination remains custom and unchanged.
- No workflow simplification, routing change, data-source change, modal trigger change, payment posting change, void request change, receipt preview change, or export behavior change was introduced.

### Validation Results

- `rg` confirmed `src/features/cashier/**` no longer references `STSNDataTable`, `DataTableCard`, `STSNColumn`, DataTables.net, or raw table markup.
- `npm.cmd run lint`: failed only on existing unrelated TypeScript issues:
  - `src/components/common/ApprovalInbox.tsx`
  - `src/features/accounting/pages/AccountingDashboardPage.tsx`
  - `src/features/guardian/pages/GuardianPortalPage.tsx`
  - `src/features/payroll/pages/PayrollDashboardPage.tsx`
- No Phase 2C.9 cashiering errors remained in lint/typecheck output.
- `npm.cmd run build`: failed in the sandbox with the known Vite config access issue.
- `npm.cmd run build` outside sandbox: passed.
- Production build warning remains the existing large JS chunk warning.
- Confirmed only cashiering tables were migrated in this phase.
- Confirmed accounting and dashboard/report/detail tables were not migrated.
- Confirmed `STSNDataTable` still exists.
- Confirmed `DataTableCard` still exists.
- Confirmed `datatables.net-dt` and `datatables.net-react` remain in `package.json`.
- Confirmed no Metronic, Bootstrap, Material UI, Redux, direct jQuery, or Metronic dependency was added.

### Remaining STSNDataTable/DataTableCard Usages

Remaining usages still exist across:

- `src/features/accounting/pages/**`
- `src/features/dashboard/pages/DashboardPage.tsx`
- `src/components/common/DataTableCard.tsx`
- `src/components/common/STSNDataTable.tsx`

### Recommendation For Phase 2C.10

- Migrate dashboard modal/report table only if report/detail scope is approved.
- Otherwise begin the accounting migration as a dedicated financial QA phase, starting with low-risk setup/reference tables before invoice, journal, aging, and statement detail tables.

## Phase 2C.10 Accounting Migration Notes

Audit date: 2026-06-28

### Accounting Files Reviewed

- `src/features/accounting/pages/AccountingModulePage.tsx`
- `src/features/accounting/pages/AccountingDashboardPage.tsx`
- `src/features/accounting/pages/sub-pages/CostCentersPage.tsx`
- `src/features/accounting/pages/sub-pages/SupplierManagementPage.tsx`
- `src/features/accounting/pages/sub-pages/ItemProductManagementPage.tsx`
- `src/features/accounting/pages/sub-pages/ChartOfAccountsPage.tsx`
- `src/features/accounting/pages/sub-pages/FinancialStatementsPage.tsx`
- `src/features/accounting/pages/sub-pages/JournalEntriesPage.tsx`
- `src/features/accounting/pages/sub-pages/SalesInvoicesPage.tsx`
- `src/features/accounting/pages/sub-pages/PurchaseInvoicesPage.tsx`
- `src/features/accounting/pages/sub-pages/ARAgingPage.tsx`
- `src/features/accounting/pages/sub-pages/APAgingPage.tsx`

### Files Migrated

- `src/features/accounting/pages/sub-pages/CostCentersPage.tsx`
- `src/features/accounting/pages/sub-pages/SupplierManagementPage.tsx`
- `src/features/accounting/pages/sub-pages/ItemProductManagementPage.tsx`

### Files Intentionally Skipped

- `src/features/accounting/pages/AccountingModulePage.tsx` was deferred because it mixes discounts, ledgers, financial holds, approval queues, assessment billing, and raw preview/detail tables in one parent workflow.
- `src/features/accounting/pages/sub-pages/ChartOfAccountsPage.tsx` was deferred because chart/account mappings control posting and reporting behavior.
- `src/features/accounting/pages/sub-pages/FinancialStatementsPage.tsx` was deferred because trial balance, statements, cash flow, and drilldown detail tables depend on generated financial statement behavior.
- `src/features/accounting/pages/sub-pages/JournalEntriesPage.tsx` was deferred because journal and journal-line detail tables affect posting workflows and debit/credit validation.
- `src/features/accounting/pages/sub-pages/SalesInvoicesPage.tsx` and `src/features/accounting/pages/sub-pages/PurchaseInvoicesPage.tsx` were deferred because invoice list and line detail tables carry invoice totals, statuses, posting, and modal detail behavior.
- `src/features/accounting/pages/sub-pages/ARAgingPage.tsx` and `src/features/accounting/pages/sub-pages/APAgingPage.tsx` were deferred because aging buckets, invoice/vendor summaries, and line detail tables are high-risk financial report/detail surfaces.
- `src/features/accounting/pages/AccountingDashboardPage.tsx` was skipped because no legacy table migration target was found there during the accounting table scan, and it already has an unrelated TypeScript issue.

### Tables Migrated

- Accounting setup: `Cost Centers`.
- Accounts Payable setup: `Supplier Registry`.
- Accounting setup: `Item & Product Catalog`.

### Financial Behaviors Preserved

- Supabase CRUD data sources and row-to-app mappings were unchanged.
- Add/edit modal triggers, save behavior, delete confirmation dialogs, and delete behavior were unchanged.
- Page-owned search and filter state remain the source of truth for filtered rows.
- Cost center code/name/type/description/GL account/status display remains unchanged.
- Supplier code/name/TIN/contact/payment terms/default GL account/status display remains unchanged.
- Item/product code/name/type/unit/sales price/purchase cost/GL mapping/status display remains unchanged.
- KPI counts and setup summary calculations were unchanged.
- Export buttons remain present and unchanged as existing UI actions.
- No financial formulas, totals, statuses, or GL mappings were changed.

### AppTable Advanced Features Used

- `appTableColumnsFromLegacy` to preserve existing legacy column renderers while removing DataTables.net usage from the selected setup tables.
- `loading` to preserve existing loading-state behavior.
- `getRowId` for stable row identity.
- `toolbar` for page-owned search controls.
- `rightToolbar` for existing filters and export buttons.
- Single-option `pageSizeOptions` to preserve the previous fixed 10-row or 15-row page lengths.
- AppTable client-side sorting and pagination.

### Behavior Differences

- Migrated setup table chrome now follows `AppTable` ERP-token styling instead of `DataTableCard` / `STSNDataTable` / DataTables.net styling.
- Loading state is now rendered by AppTable rather than a custom inline loader block.
- Search inputs use the AppTable toolbar styling but still update the same page-owned search state.
- No workflow simplification, routing change, data-source change, modal trigger change, CRUD change, financial calculation change, or mapping change was introduced.

### Validation Results

- `rg` confirmed the three Phase 2C.10 migrated files no longer reference `STSNDataTable`, `DataTableCard`, `STSNColumn`, DataTables.net, or raw table markup.
- `npm.cmd run lint`: failed only on existing unrelated TypeScript issues:
  - `src/components/common/ApprovalInbox.tsx`
  - `src/features/accounting/pages/AccountingDashboardPage.tsx`
  - `src/features/guardian/pages/GuardianPortalPage.tsx`
  - `src/features/payroll/pages/PayrollDashboardPage.tsx`
- No Phase 2C.10 migrated file errors remained in lint/typecheck output.
- `npm.cmd run build`: failed in the sandbox with the known Vite config access issue.
- `npm.cmd run build` outside sandbox: passed.
- Production build warning remains the existing large JS chunk warning.
- Confirmed only accounting setup/reference tables were migrated in this phase.
- Confirmed dashboard/report/detail tables outside accounting were not migrated.
- Confirmed high-risk accounting statement, invoice, journal, payment, aging, ledger, and report/detail tables were deferred.
- Confirmed `STSNDataTable` still exists.
- Confirmed `DataTableCard` still exists.
- Confirmed `datatables.net-dt` and `datatables.net-react` remain in `package.json`.
- Confirmed no Metronic, Bootstrap, Material UI, Redux, direct jQuery, or Metronic dependency was added.

### Remaining STSNDataTable/DataTableCard Usages

Remaining usages still exist across:

- `src/features/accounting/pages/AccountingModulePage.tsx`
- `src/features/accounting/pages/sub-pages/ChartOfAccountsPage.tsx`
- `src/features/accounting/pages/sub-pages/FinancialStatementsPage.tsx`
- `src/features/accounting/pages/sub-pages/JournalEntriesPage.tsx`
- `src/features/accounting/pages/sub-pages/SalesInvoicesPage.tsx`
- `src/features/accounting/pages/sub-pages/PurchaseInvoicesPage.tsx`
- `src/features/accounting/pages/sub-pages/ARAgingPage.tsx`
- `src/features/accounting/pages/sub-pages/APAgingPage.tsx`
- `src/features/dashboard/pages/DashboardPage.tsx`
- `src/components/common/DataTableCard.tsx`
- `src/components/common/STSNDataTable.tsx`

### Recommendation For Phase 2C.10B

- Continue accounting in a separate high-scrutiny pass, starting with medium-risk parent-page setup/monitoring tables only if owners accept the workflow risk.
- Defer financial statements, invoices, journals, ledgers, aging, and modal/detail tables until each workflow has dedicated financial QA notes and before/after verification of totals, statuses, and drilldown behavior.

## Phase 2C.10B Remaining Accounting High-Risk Migration Notes

Audit date: 2026-06-28

### Accounting Files Reviewed

- `src/features/accounting/pages/AccountingModulePage.tsx`
- `src/features/accounting/pages/AccountingDashboardPage.tsx`
- `src/features/accounting/pages/sub-pages/ChartOfAccountsPage.tsx`
- `src/features/accounting/pages/sub-pages/FinancialStatementsPage.tsx`
- `src/features/accounting/pages/sub-pages/JournalEntriesPage.tsx`
- `src/features/accounting/pages/sub-pages/SalesInvoicesPage.tsx`
- `src/features/accounting/pages/sub-pages/PurchaseInvoicesPage.tsx`
- `src/features/accounting/pages/sub-pages/ARAgingPage.tsx`
- `src/features/accounting/pages/sub-pages/APAgingPage.tsx`

### Files Migrated

- `src/features/accounting/pages/sub-pages/ChartOfAccountsPage.tsx`
- `src/features/accounting/pages/sub-pages/FinancialStatementsPage.tsx`
- `src/features/accounting/pages/sub-pages/JournalEntriesPage.tsx`
- `src/features/accounting/pages/sub-pages/SalesInvoicesPage.tsx`
- `src/features/accounting/pages/sub-pages/PurchaseInvoicesPage.tsx`
- `src/features/accounting/pages/sub-pages/ARAgingPage.tsx`
- `src/features/accounting/pages/sub-pages/APAgingPage.tsx`

### Files Intentionally Skipped

- `src/features/accounting/pages/AccountingModulePage.tsx` was deferred because it mixes discount setup, ledgers, preview/detail tables, financial holds, approval queues, assessment billing, and collection workflow surfaces in one parent module.
- `src/features/accounting/pages/AccountingDashboardPage.tsx` was skipped because no legacy accounting table migration target was found during the scan, and the file still has a known unrelated TypeScript issue.
- Raw editable line-entry tables inside `JournalEntriesPage.tsx`, `SalesInvoicesPage.tsx`, and `PurchaseInvoicesPage.tsx` were deferred because they are input grids with live debit/credit, subtotal, discount, GL, and validation behavior rather than read-only legacy table components.

### Tables Migrated

- Chart of Accounts hierarchy/search table.
- Financial Statements generated report table for trial balance, balance sheet, income statement, and cash flow.
- Financial Statements posting detail modal table.
- Journal Entries list table.
- Journal Entry read-only line detail modal table.
- Sales Invoices list table.
- Sales Invoice read-only line detail modal table.
- Purchase Invoices list table.
- Purchase Invoice read-only line detail modal table.
- AR Aging invoice table.
- AR Aging read-only invoice line modal table.
- AP Aging by-invoice table.
- AP Aging by-vendor table.
- AP Aging read-only invoice line modal table.

### Financial Behaviors Preserved

- Existing data sources, row mappers, derived financial rows, aging bucket calculations, statement totals, journal debit/credit totals, invoice subtotal/discount/total calculations, and GL mappings were not changed.
- Existing search and filter state remains page-owned and continues to filter the same derived row arrays before rendering.
- Existing row actions, modal triggers, edit/post/void/delete handlers, and detail target state were preserved.
- Chart of Accounts tree-mode sorting remains disabled to preserve hierarchy order and expand/collapse behavior.
- Journal, sales invoice, and purchase invoice editable line-entry grids were left unchanged to preserve validation, totals, and posting workflow behavior.
- Export buttons remain present as existing UI actions; no export, print, or download logic was changed.

### AppTable Advanced Features Used

- `appTableColumnsFromLegacy` to preserve existing column renderers and action buttons while removing DataTables.net rendering from migrated accounting sub-pages.
- `loading` for existing page load states.
- `toolbar` and `rightToolbar` for page-owned search, filters, and export buttons.
- `getRowId` for stable row identity.
- `compact` for read-only modal/detail line tables.
- Single-option `pageSizeOptions` to preserve fixed legacy page lengths while hiding one-option page-size selectors.
- AppTable client-side sorting and pagination for migrated display tables.

### Behavior Differences

- Migrated tables now use AppTable ERP-token chrome instead of `DataTableCard` / `STSNDataTable` / DataTables.net chrome.
- Search inputs now render inside AppTable toolbar slots but still update the same page-owned search state.
- AppTable loading and empty states replace the previous wrapper-level loading blocks for migrated display tables.
- No routing, financial formula, total, status, mapping, modal trigger, posting workflow, aging workflow, ledger calculation, export action, or statement generation logic was changed.

### Validation Results

- `rg` confirmed the seven Phase 2C.10B migrated sub-pages no longer reference `STSNDataTable`, `DataTableCard`, or `STSNColumn`.
- `npm.cmd run lint`: failed only on existing unrelated TypeScript issues:
  - `src/components/common/ApprovalInbox.tsx`
  - `src/features/accounting/pages/AccountingDashboardPage.tsx`
  - `src/features/guardian/pages/GuardianPortalPage.tsx`
  - `src/features/payroll/pages/PayrollDashboardPage.tsx`
- No Phase 2C.10B migrated file errors remained in lint/typecheck output.
- `npm.cmd run build`: failed in the sandbox with the known Vite config access issue.
- `npm.cmd run build` outside the sandbox: passed.
- Production build warning remains the existing large JS chunk warning.
- Confirmed only accounting sub-page tables were migrated in this phase.
- Confirmed dashboard/report/detail tables outside accounting were not migrated.
- Confirmed financial calculations, totals, statuses, and mappings were not changed.
- Confirmed `STSNDataTable` still exists.
- Confirmed `DataTableCard` still exists.
- Confirmed `datatables.net-dt` and `datatables.net-react` remain in `package.json`.
- Confirmed no Metronic, Bootstrap, Material UI, Redux, direct jQuery, or Metronic dependency was added.

### Remaining STSNDataTable/DataTableCard Usages

- `src/features/accounting/pages/AccountingModulePage.tsx`
- `src/features/dashboard/pages/DashboardPage.tsx`
- `src/components/common/DataTableCard.tsx`
- `src/components/common/STSNDataTable.tsx`

### Recommendation For Phase 2C.11

- Migrate `AccountingModulePage.tsx` as its own dedicated financial workflow phase, preferably split by section: discount setup, student ledger, financial holds, approval queue, and assessment billing.
- Defer raw editable journal/invoice line grids until AppTable has a documented editable-cell or form-grid pattern with before/after QA for totals, validation, and posting behavior.
- Keep dashboard modal/report/detail tables outside accounting deferred until the remaining accounting parent workflow is complete.

## Phase 2C.11 Dashboard / Report / Modal / Detail Migration Notes

Audit date: 2026-06-28

### Files Reviewed

- `src/features/dashboard/pages/DashboardPage.tsx`
- `src/features/accounting/pages/AccountingModulePage.tsx`
- `src/features/reports/components/ReportTable.tsx`
- `src/features/reports/components/ReportPreviewModal.tsx`
- `src/services/reportExportService.ts`
- `src/components/common/STSNDataTable.tsx`
- `src/components/common/DataTableCard.tsx`
- Focused raw table scan for dashboard, accounting, report, modal, detail, and generated-output table surfaces.

### Files Migrated

- `src/features/dashboard/pages/DashboardPage.tsx`
- `src/features/accounting/pages/AccountingModulePage.tsx`

### Tables Migrated

- Dashboard enrollment status modal student table.
- Accounting dashboard discount and scholarship summary table.
- Student ledger transaction table.
- Discount types setup table.
- Financial holds table.
- Assessment approval queue table.
- Basic Education assessment and billing table.
- College assessment and billing table.

### Files Intentionally Skipped

- `src/features/dashboard/pages/DashboardPage.tsx` raw analytics records table was left raw because it is a custom report-style panel tied to page-owned filters and dashboard print output.
- `src/features/dashboard/pages/DashboardPage.tsx` `handlePrint` generated HTML table was left unchanged because it is print output.
- `src/features/accounting/pages/AccountingModulePage.tsx` compact ledger preview/detail raw table was deferred because it is a modal/detail workflow readout.
- `src/features/accounting/pages/AccountingModulePage.tsx` assessment approval fee breakdown and payment schedule raw tables were deferred because they are generated approval-detail summaries with totals.
- `src/features/accounting/pages/sub-pages/JournalEntriesPage.tsx`, `SalesInvoicesPage.tsx`, and `PurchaseInvoicesPage.tsx` raw editable line-entry tables remain deferred per Phase 2C.10B because they are form grids with live validation and totals.
- `src/features/reports/components/ReportTable.tsx` and `ReportPreviewModal.tsx` were deferred because they are reusable report preview/rendering components, not legacy DataTables grids.
- `src/services/reportExportService.ts` was deferred because it builds export/download HTML output.

### Report / Detail / Modal Behaviors Preserved

- Dashboard modal state, close behavior, scoped student data source, status badges, school-year mapping, search, sorting, pagination, and empty state were preserved.
- Accounting dashboard financial summary data source and discount amount/percentage rendering were preserved.
- Student ledger selected-student workflow, filters, ledger rows, balances, receipt preview behavior, and raw print/statement/detail output were preserved.
- Discount type add/edit/delete/toggle actions, search, source filter, badges, and policy rendering were preserved.
- Financial hold status filtering, search, session-only clear/reactivate actions, badges, and explanatory footer were preserved.
- Assessment approval search, status filter, selected-row highlighting, row-click detail modal, review action, bulk selection, approve-all, return-all, and detail/action modal behavior were preserved.
- Assessment billing Basic Ed / College row mappings, status badges, totals, balances, and fee/program columns were preserved.
- Print, export, download, receipt preview, generated statement, report-export service, and raw report preview behavior were not changed.

### AppTable Advanced Features Used

- `appTableColumnsFromLegacy` to preserve existing legacy column renderers while removing DataTables.net rendering from migrated tables.
- `getRowId` for stable row identity across dashboard modal, accounting, billing, holds, and approval tables.
- `selectedRowId` / `selectedRowKey` for the assessment approval selected-row/detail behavior.
- `enableRowSelection`, controlled `selectedRowIds`, `onSelectionChange`, and `renderBulkActions` for the assessment approval queue bulk workflow.
- `toolbar` and `rightToolbar` for page-owned search controls, filters, and action buttons.
- Single-option `pageSizeOptions` to preserve fixed 10-row paging while hiding the page-size selector.
- AppTable client-side search, sorting, pagination, empty, and loading-ready table chrome.

### Behavior Differences

- Migrated tables now use AppTable ERP-token styling instead of `STSNDataTable` / `DataTableCard` / DataTables.net chrome.
- DataTableCard title/icon wrappers were replaced by AppTable title, description, toolbar, and rightToolbar areas.
- Assessment approval bulk action chrome now uses AppTable's selected-row action bar while preserving approve-all, return-all, and clear-selection behavior.
- No routing, formulas, totals, statuses, mappings, modal triggers, workflow handlers, generated output, export, print, or download logic was changed.

### Validation Results

- `rg` confirmed `src/features/dashboard/pages/DashboardPage.tsx` and `src/features/accounting/pages/AccountingModulePage.tsx` no longer reference `STSNDataTable`, `DataTableCard`, or `STSNColumn`.
- `rg` confirmed remaining `STSNDataTable` / `DataTableCard` usages are only the wrapper component definitions in `src/components/common/**`.
- `rg` confirmed raw table markup remains only in intentionally skipped report, print, generated-detail, editable-line, and preview surfaces.
- `npm.cmd run lint`: failed only on existing unrelated TypeScript issues:
  - `src/components/common/ApprovalInbox.tsx`
  - `src/features/accounting/pages/AccountingDashboardPage.tsx`
  - `src/features/guardian/pages/GuardianPortalPage.tsx`
  - `src/features/payroll/pages/PayrollDashboardPage.tsx`
- No Phase 2C.11 migrated file errors appeared in the lint/typecheck output.
- `npm.cmd run build`: failed in the sandbox with the known Vite config access issue.
- `npm.cmd run build` outside the sandbox: passed.
- Production build warning remains the existing large JS chunk warning.
- Confirmed only dashboard/report/modal/detail/miscellaneous safe tables were migrated.
- Confirmed report formulas, totals, statuses, mappings, generated outputs, print, export, and download behavior were not changed.
- Confirmed `STSNDataTable` still exists.
- Confirmed `DataTableCard` still exists.
- Confirmed `datatables.net-dt` and `datatables.net-react` remain in `package.json`.
- Confirmed no Metronic, Bootstrap, Material UI, Redux, direct jQuery, or Metronic dependency was added.

### Remaining STSNDataTable/DataTableCard Usages

- `src/components/common/STSNDataTable.tsx`
- `src/components/common/DataTableCard.tsx`

### Recommendation For Phase 2D

- Begin Phase 2D by deciding whether to retire the legacy wrappers and DataTables.net dependencies now that feature pages no longer depend on them.
- Before removing dependencies, run one final raw table audit and classify report/export/detail/editable form grids into documented AppTable patterns or intentional raw-output exceptions.
- Keep editable journal/invoice line grids, generated statement tables, print/export HTML builders, and report preview tables out of wrapper-removal scope unless AppTable gains documented editable-grid and report-output patterns with dedicated QA.

## Phase 2D Final Table Coverage Audit

Audit date: 2026-06-28

### Phase 1 Completion Status

- Phase 1 shared/global implementation is substantially complete:
  - `src/index.css` contains semantic ERP tokens and Tailwind CSS 4 `@theme` token exposure.
  - Workflow status tokens exist for draft, pending, review, approved, rejected, and cancelled.
  - Academic status tokens exist for active, enrolled, graduated, dropped, leave, and suspended.
  - Finance status tokens exist for credit, debit, balance, overdue, paid, partial, and waived.
  - `src/components/common/AppStatusBadge.tsx` uses centralized semantic status styles through `getStatusStyle`.
  - `src/config/status-style.config.ts` exists and centralizes workflow, academic, finance, neutral, generic, and fallback mappings.
  - Unknown statuses preserve their incoming label and use the neutral fallback class.
- Phase 1 is not fully complete across feature adoption:
  - Many feature pages still render local status badges with raw Tailwind color utility strings.
  - Some domain config files still expose local `badgeClass` maps instead of using the centralized semantic status config.
  - Lint/typecheck remains blocked by existing unrelated TypeScript errors, so Phase 1 cannot yet be validated with a clean lint gate.

### Phase 1 Missing Items / Follow-Up

- Migrate obvious feature-level local status maps to `AppStatusBadge` or a shared semantic status helper where labels/semantics match:
  - `src/config/accounting.config.ts`
  - `src/config/books.config.ts`
  - `src/features/accounting/pages/**`
  - `src/features/clinic/pages/ClinicModulePage.tsx`
  - `src/features/consultation/pages/ConsultationModulePage.tsx`
  - `src/features/guidance/pages/GuidanceModulePage.tsx`
  - `src/features/hr/pages/sub-pages/**`
  - `src/components/common/ApprovalInbox.tsx`
  - `src/components/common/ApprovalDetailDrawer.tsx`
- Keep chart colors, print/report preview colors, and shell/layout palette cleanup out of Phase 1 unless separately approved.

### Final AppTable Coverage

- All active feature-page usages of `STSNDataTable`, `STSNColumn`, and `DataTableCard` have been migrated away.
- Remaining `STSNDataTable` / `DataTableCard` references are only component definitions:
  - `src/components/common/STSNDataTable.tsx`
  - `src/components/common/DataTableCard.tsx`
- Active DataTables.net imports are only inside the unused legacy wrapper:
  - `src/components/common/STSNDataTable.tsx`
- `datatables.net-dt` and `datatables.net-react` remain declared in:
  - `package.json`
  - `package-lock.json`
- Migrated AppTable coverage includes the previously migrated feature pages plus the Phase 2C.11 dashboard/accounting parent tables. Current `rg "<AppTable"` shows AppTable in admin, accounts, books, student directory, HR, registrar, scheduling, grading, faculty admin, curriculum, clinic, consultation, guidance, cashier, dashboard, class sectioning, and accounting pages.

### Raw Table Usage Classification

#### Migrated To AppTable

- AppTable is now the active table component for data-grid style tables migrated during Phases 2B through 2C.11.
- Representative migrated coverage:
  - `src/features/admin/pages/AuditLogPage.tsx`
  - `src/features/accounts/pages/AccountsManagementPage.tsx`
  - `src/features/books/pages/BooksSetupPage.tsx`
  - `src/features/student-directory/pages/StudentDirectoryPage.tsx`
  - `src/features/hr/pages/sub-pages/**`
  - `src/features/registrar/pages/RegistrarModulePage.tsx`
  - `src/features/class-sectioning/pages/ClassSectioningModulePage.tsx`
  - `src/features/curriculum/pages/CurriculumManagementPage.tsx`
  - `src/features/scheduling/pages/SchedulingModulePage.tsx`
  - `src/features/grading/pages/GradesDirectoryPage.tsx`
  - `src/features/faculty/pages/FacultyAdminPage.tsx`
  - `src/features/clinic/pages/ClinicModulePage.tsx`
  - `src/features/consultation/pages/ConsultationModulePage.tsx`
  - `src/features/guidance/pages/GuidanceModulePage.tsx`
  - `src/features/cashier/pages/CashierModulePage.tsx`
  - `src/features/dashboard/pages/DashboardPage.tsx`
  - `src/features/accounting/pages/**`

#### Intentionally Kept Raw / Static Layout Tables

- `src/features/hr/pages/sub-pages/TaxesPage.tsx:15` tax bracket table is a static nested bracket display.
- `src/features/online-learning/pages/OnlineLearningPage.tsx:542` simple `stsn-plain-table` content list was not part of the DataTables migration surface.
- `src/features/faculty/pages/FacultyPortalPage.tsx:533` `stsn-plain-table` is a portal-side roster/content surface rather than a shared admin data grid.
- `src/features/faculty/pages/FacultyAdminPage.tsx:163`, `:316`, `:480` are compact nested advisory/section/attendance detail tables.
- `src/features/books/pages/BooksSetupPage.tsx:595` is the package book-list editor/detail table inside the package workflow.

#### Missed Migration / Safe To Migrate Before Or Alongside Dependency Removal

- `src/features/core-setup/pages/CoreSetupModulePage.tsx:322` appears to be a generic setup data grid with local pagination/search/actions. It is safe candidate material for a Phase 2D-fix pass, though it does not block DataTables.net removal because it is raw markup, not a DataTables.net usage.
- `src/features/online-learning/pages/OnlineLearningPage.tsx:542` could also be considered for an AppTable standardization pass if the module is in scope, but it does not block DataTables.net removal.

#### Deferred Because Of Business Workflow Risk

- `src/features/accounting/pages/sub-pages/JournalEntriesPage.tsx:770` editable journal line-entry grid.
- `src/features/accounting/pages/sub-pages/SalesInvoicesPage.tsx:703` editable sales invoice line-entry grid.
- `src/features/accounting/pages/sub-pages/PurchaseInvoicesPage.tsx:622` editable purchase invoice line-entry grid.
- `src/features/registrar/components/EnrollmentWizard.tsx:431` subject-load workflow table with add/drop action behavior.
- `src/features/registrar/pages/RegistrarModulePage.tsx:1952`, `:2363`, `:3011`, `:3517` fee breakdown, enrolled-subject, and import preview workflow tables.
- `src/features/hr/pages/sub-pages/PayrollManagementPage.tsx:1166` CSV import preview table with validation/error state.
- `src/features/faculty/pages/FacultyPortalPage.tsx:800`, `:852`, `:936`, `:983`, `:1067` portal grade/attendance/advisory workflow tables.
- `src/features/grading/pages/GradesDirectoryPage.tsx:693` expandable grading master table.
- `src/features/grading/components/GradeSummaryView.tsx:69` grade summary matrix.
- `src/features/grading/components/GradeSheetTable.tsx:95` grade-entry sheet matrix.
- `src/features/student-portal/pages/StudentPortalPage.tsx:674`, `:1004`, `:1623`, `:1655` portal report-card, receipt history, and assessment breakdown tables.

#### Deferred Because Of Report / Print / Export Behavior

- `src/services/reportExportService.ts:81` HTML export table builder.
- `src/features/reports/components/ReportTable.tsx:33` reusable report preview table.
- `src/features/reports/components/ReportPreviewModal.tsx:23` report preview modal table.
- `src/components/ModalPreviews.tsx:137`, `:437`, `:518` print/preview document tables.
- `src/features/dashboard/pages/DashboardPage.tsx:258` generated print table.
- `src/features/dashboard/pages/DashboardPage.tsx:426` dashboard analytics report-style table tied to print output.
- `src/features/class-sectioning/pages/ClassSectioningModulePage.tsx:717` generated print table.
- `src/features/class-sectioning/pages/ClassSectioningModulePage.tsx:759` section-student modal table paired with the print workflow.
- `src/features/accounting/pages/AccountingModulePage.tsx:970`, `:2189`, `:2241` ledger preview, fee breakdown, and payment schedule detail tables.
- `src/features/student-portal/pages/StudentPortalPage.tsx:1586`, `:1594` generated print assessment tables.
- `src/features/faculty/pages/FacultyPortalPage.tsx:1210` selected report output table.

### DataTables.net Usage Status

- No active feature page imports `STSNDataTable`, `DataTableCard`, `datatables.net-react`, or `datatables.net-dt`.
- `src/components/common/STSNDataTable.tsx` still imports `datatables.net-react`, `datatables.net-dt`, and DataTables CSS.
- `src/index.css` still contains legacy DataTables styling blocks such as `.stsn-datatable`, `.dataTables_wrapper`, and payroll/billing DataTables compatibility selectors.
- Because the only DataTables.net runtime imports are inside the unused wrapper, package cleanup is technically possible after a dedicated removal pass verifies no hidden dynamic imports or stale CSS assumptions remain.

### Removal Readiness

- Active usages of `STSNDataTable`: No, except the component definition itself.
- Active usages of `DataTableCard`: No, except the component definition itself.
- Active imports/usages of DataTables.net: Yes, but only in `src/components/common/STSNDataTable.tsx`.
- Are `datatables.net-dt` and `datatables.net-react` still required by active feature pages: No.
- Can `STSNDataTable.tsx` be removed safely: Yes in principle, in Phase 2E, after removing references from docs/CSS and running build validation.
- Can `DataTableCard.tsx` be removed safely: Yes in principle, in Phase 2E, after confirming no untracked or stale imports.
- Can DataTables.net dependencies be removed safely: Not in this audit phase; safe for Phase 2E cleanup after deleting the legacy wrapper and DataTables-specific CSS in the same controlled removal pass.

### Files Still Blocking Removal

- `src/components/common/STSNDataTable.tsx`
- `src/components/common/DataTableCard.tsx`
- `src/index.css` legacy DataTables CSS selectors:
  - `.dataTables_wrapper`
  - `.stsn-datatable table.dataTable`
  - `.payroll-workflow-table .dt-*`
  - `.billing-table-card table.dataTable`
- `package.json`
- `package-lock.json`

### Validation Results

- `npm.cmd run lint`: failed on existing unrelated TypeScript issues:
  - `src/components/common/ApprovalInbox.tsx`
  - `src/features/accounting/pages/AccountingDashboardPage.tsx`
  - `src/features/guardian/pages/GuardianPortalPage.tsx`
  - `src/features/payroll/pages/PayrollDashboardPage.tsx`
- `npm.cmd run build`: failed in the sandbox with the known Vite config access issue.
- `npm.cmd run build` outside the sandbox: passed.
- Production build warning remains the existing large JS chunk warning.
- This Phase 2D pass modified tracker markdown only.

### Recommendation For Phase 2E

- Phase 2E cleanup is safe to attempt as a dedicated removal pass, but not as part of this audit.
- Remove `STSNDataTable.tsx`, `DataTableCard.tsx`, DataTables.net dependencies, and DataTables-specific CSS together.
- Run `rg` for `STSNDataTable`, `DataTableCard`, `datatables.net`, `.stsn-datatable`, `.dataTables_wrapper`, `.dt-`, `payroll-workflow-table`, and `billing-table-card` after cleanup.
- Run build outside the sandbox if the known Vite config access issue recurs.

### Recommendation For Phase 2D-Fix Pass

- Migrate `src/features/core-setup/pages/CoreSetupModulePage.tsx:322` to AppTable before or immediately after Phase 2E if the goal is full data-grid standardization, though it is not a dependency-removal blocker.
- Consider a separate status-badge cleanup pass to migrate feature-local raw status maps to `AppStatusBadge` where behavior is obvious.
- Keep print/export/report/grade matrix/editable line grids raw until AppTable has explicit report-output, editable-grid, and matrix-table patterns with dedicated QA.

## Phase 2E DataTables Cleanup Notes

Audit date: 2026-06-28

### Files Removed

- `src/components/common/STSNDataTable.tsx`
- `src/components/common/DataTableCard.tsx`

### Dependencies Removed

- `datatables.net-dt`
- `datatables.net-react`
- The npm lockfile also dropped the unused transitive DataTables core and jQuery entries that were only present through the DataTables packages.

### CSS Removed

- Removed DataTables-specific typography targeting from `src/index.css`:
  - `.dataTables_wrapper`
- Removed the legacy STSN DataTables theme block from `src/index.css`:
  - `.stsn-datatable table.dataTable`
  - `.stsn-datatable .dt-search`
  - `.stsn-datatable .dt-length`
  - `.stsn-datatable .dt-paging`
  - `.stsn-datatable .dt-info`
  - `.stsn-datatable .dt-layout-row`
  - DataTables row-selection and ordering selectors.
- Removed payroll and billing compatibility selectors that targeted DataTables internals:
  - `.payroll-workflow-table .dt-*`
  - `.payroll-workflow-table table.dataTable`
  - `.billing-table-card table.dataTable`
- Kept generic non-DataTables layout helpers still used by migrated AppTable pages:
  - `.payroll-workflow-table-card`
  - `.payroll-workflow-table`
  - `.payroll-money-cell`
  - `.billing-table-card`
  - `.billing-table-wrapper`
- Kept `.stsn-plain-table` for intentionally raw/static tables.

### Remaining Table Stack Status

- AppTable is now the active shared table foundation for migrated data-grid pages.
- TanStack Table remains installed through `@tanstack/react-table`.
- `src/components/common/AppTable.tsx` remains in place and was not behaviorally changed during Phase 2E.
- No active source imports remain for `STSNDataTable`, `DataTableCard`, `datatables.net`, `datatables.net-dt`, or `datatables.net-react`.
- No DataTables.net dependencies remain in `package.json` or `package-lock.json`.
- No Metronic, Bootstrap, direct jQuery, Material UI, Redux, or DataTables dependency was added.

### Validation Results

- `rg -n "STSNDataTable|DataTableCard|datatables\.net|datatables.net-dt|datatables.net-react" src package.json package-lock.json`: no matches.
- `rg -n "stsn-datatable|dataTables_wrapper|table\.dataTable|\.dt-|dt-layout|dt-search|dt-paging|dt-info|dt-length" src/index.css src`: no matches.
- `rg -n "metronic|bootstrap|jquery|@mui|material|redux|datatables" package.json package-lock.json`: no matches.
- `npm.cmd run lint`: failed on existing unrelated TypeScript issues in:
  - `src/components/common/ApprovalInbox.tsx`
  - `src/features/accounting/pages/AccountingDashboardPage.tsx`
  - `src/features/guardian/pages/GuardianPortalPage.tsx`
  - `src/features/payroll/pages/PayrollDashboardPage.tsx`
- No lint/typecheck errors were reported for removed DataTables files, package cleanup, or AppTable imports.
- `npm.cmd run build`: failed inside the sandbox with the known Vite config access issue.
- `npm.cmd run build` outside the sandbox: passed.
- Production build warning remains the existing large JS chunk warning.

### Remaining Raw / Static Tables Intentionally Kept

- Static or portal-side plain tables remain intentionally outside Phase 2E:
  - `src/features/hr/pages/sub-pages/TaxesPage.tsx`
  - `src/features/online-learning/pages/OnlineLearningPage.tsx`
  - `src/features/faculty/pages/FacultyPortalPage.tsx`
  - Compact nested detail tables in `src/features/faculty/pages/FacultyAdminPage.tsx`
  - Package book-list editor/detail table in `src/features/books/pages/BooksSetupPage.tsx`
- Workflow, report, print, export, preview, matrix, generated-detail, and editable-line grids remain intentionally raw where Phase 2D classified them as out of AppTable cleanup scope.

### Recommendation For Next Phase

- Treat Phase 2E as complete for DataTables.net retirement.
- Next cleanup should focus on one separate theme at a time:
  - Migrate the safe raw setup grid in `src/features/core-setup/pages/CoreSetupModulePage.tsx` if full data-grid standardization is desired.
  - Resolve the existing unrelated TypeScript errors so lint/typecheck can become a clean validation gate.
  - Continue status-badge consolidation separately from table cleanup.
  - Keep report/export/print/matrix/editable form grids raw until AppTable has explicit documented patterns for those surfaces.

## Phase 2F Post-DataTables Module Table Alignment Notes

Audit date: 2026-06-28

### Files Reviewed

- `src/features/guardian/pages/GuardianPortalPage.tsx`
- `src/features/payroll/pages/PayrollDashboardPage.tsx`
- `src/features/payroll/pages/PayrollModulePage.tsx`
- `src/features/payroll/pages/sub-pages/TaxesPage.tsx`
- `src/features/student-portal/pages/StudentPortalPage.tsx`
- Project-wide remaining table-like surfaces under `src/features/**` via `rg` for raw `<table>` and `AppTable`.

### Classification Summary Before Edits

- Must migrate to AppTable now:
  - `src/features/student-portal/pages/StudentPortalPage.tsx`
    - Unlocked semestral report card table.
    - Receipt payment history audit table.
- Safe to keep as raw/static layout:
  - `src/features/guardian/pages/GuardianPortalPage.tsx`
    - No data-grid style table surface; page is card/list based.
  - `src/features/payroll/pages/PayrollDashboardPage.tsx`
    - Analytics/chart dashboard, not a tabular workflow page.
  - `src/features/payroll/pages/sub-pages/TaxesPage.tsx`
    - Static tax bracket table.
  - `src/features/student-portal/pages/StudentPortalPage.tsx`
    - Generated print tables in the assessment preview print builder.
- Needs AppTable but deferred due workflow risk / module-specific behavior:
  - `src/features/student-portal/pages/StudentPortalPage.tsx`
    - Enrollment assessment breakdown tables inside the multi-step fee preview flow were kept raw because they are tightly coupled to generated assessment/print output.

### Files Migrated

- `src/features/student-portal/pages/StudentPortalPage.tsx`

### AppTable Migrations Completed

- Student Portal `Unlocked Semestral Report Card` now uses `AppTable`.
- Student Portal `Receipt Payment History Audit` now uses `AppTable`.
- Preserved behavior:
  - existing grade-release lock/unlock workflow
  - Basic Education vs College column differences
  - existing grade-derived pass/fail/incomplete rendering
  - existing payment ordering and displayed fields
  - simulated treasury-clearance row when `overrideSettleBalance` is enabled
  - existing outer card layout, summary text, and portal workflow structure
- Applied `enableSearch={false}`, `enablePagination={false}`, and `enableColumnVisibility={false}` to match the previous always-visible static table behavior rather than introducing new grid controls.

### Files Intentionally Skipped

- `src/features/guardian/pages/GuardianPortalPage.tsx`
  - No data-grid migration needed.
- `src/features/payroll/pages/PayrollDashboardPage.tsx`
  - No data-grid migration needed.
- `src/features/payroll/pages/sub-pages/TaxesPage.tsx`
  - Static reference table intentionally kept raw.
- `src/features/student-portal/pages/StudentPortalPage.tsx`
  - Assessment preview fee tables in the enrollment flow were intentionally kept raw.
  - Print-template tables were intentionally kept raw.

### Raw / Static Tables Intentionally Kept

- `src/features/payroll/pages/sub-pages/TaxesPage.tsx`
- `src/features/student-portal/pages/StudentPortalPage.tsx` print assessment tables
- `src/features/student-portal/pages/StudentPortalPage.tsx` enrollment assessment preview fee tables
- Previously documented report/print/export/detail/editable/matrix tables outside this phase remain raw.

### Guardian Module Status

- Explicitly reviewed.
- No remaining data-grid style table requiring AppTable migration was found.
- Safe status styling improvement completed:
  - guardian enrollment status chip now uses `AppStatusBadge`
- Guardian lint blocker addressed:
  - announcement rendering now uses `Announcement.content` instead of the invalid `body` property.

### Payroll Module Status

- Explicitly reviewed.
- `PayrollDashboardPage.tsx` remains a chart/dashboard surface, not a table-grid migration candidate.
- `PayrollModulePage.tsx` is only a sub-page router wrapper.
- `TaxesPage.tsx` remains a safe raw/static bracket table.
- Existing unrelated payroll TypeScript blocker remains in `src/features/payroll/pages/PayrollDashboardPage.tsx` and was not changed because it does not block this migration.

### Student-Portal Module Status

- Explicitly reviewed.
- Safe AppTable migrations completed for the live report-card and receipt-history grids.
- Generated print output tables remain raw.
- Enrollment assessment preview tables remain raw and deferred because they are closer to generated assessment output than a normal reusable data grid.

### Status Styling Improvements Completed

- `src/features/guardian/pages/GuardianPortalPage.tsx`
  - Replaced the local enrollment-status badge class map with `AppStatusBadge`.
- No student-portal status-label meanings were changed.
- No central status mapping changes were required for this phase.

### Validation Results

- `rg -n "STSNDataTable|DataTableCard|datatables\.net|datatables.net-dt|datatables.net-react" src package.json package-lock.json`: no matches.
- Confirmed `AppTable` remains the active shared table foundation and is now used in the migrated student-portal table surfaces.
- Confirmed guardian, payroll, and student-portal modules were explicitly reviewed.
- Confirmed no Metronic, Bootstrap, jQuery, Material UI, Redux, or new UI framework dependency was added.
- `npm.cmd run lint`: still fails on existing unrelated TypeScript issues in:
  - `src/components/common/ApprovalInbox.tsx`
  - `src/features/accounting/pages/AccountingDashboardPage.tsx`
  - `src/features/payroll/pages/PayrollDashboardPage.tsx`
- `src/features/guardian/pages/GuardianPortalPage.tsx` no longer appears in the lint/typecheck failures after the `Announcement.content` fix.
- No new lint/typecheck errors were introduced by the Phase 2F AppTable migration.
- `npm.cmd run build`: failed inside the sandbox with the known Vite config access issue.
- `npm.cmd run build` outside the sandbox: passed.
- Production build warning remains the existing large JS chunk warning.

### Remaining Table-Like UI Follow-Ups

- `src/features/student-portal/pages/StudentPortalPage.tsx`
  - Revisit the enrollment fee-preview tables only if the team wants those generated assessment surfaces normalized into AppTable later.
- `src/features/core-setup/pages/CoreSetupModulePage.tsx`
  - Still looks like a safe follow-up AppTable standardization candidate outside the student/guardian/payroll scope.
- Existing deferred raw workflow tables from earlier phases remain unchanged:
  - report/print/export/detail/editable-line/matrix surfaces
  - registrar workflow tables
  - faculty portal workflow tables
  - payroll CSV preview table

### Recommendation For Next Phase

- Treat Phase 2F as a targeted alignment pass, not a blanket raw-table conversion.
- Next high-value follow-up options:
  - resolve the remaining unrelated TypeScript blockers so lint becomes a reliable gate
  - migrate the safe core setup raw grid in `src/features/core-setup/pages/CoreSetupModulePage.tsx`
  - decide separately whether student-portal fee preview tables should remain generated-output tables or be standardized into AppTable
  - keep print/export/report/matrix/editable workflow tables out of broad migration passes unless handled as dedicated module-specific work

## Phase 2G Payroll Alignment + TypeScript Fix Notes

Audit date: 2026-06-28

### Files Reviewed

- `src/components/common/AppStatusBadge.tsx`
- `src/components/common/AppTable.tsx`
- `src/config/status-style.config.ts`
- `src/components/common/ApprovalInbox.tsx`
- `src/features/accounting/pages/AccountingDashboardPage.tsx`
- `src/features/payroll/pages/PayrollDashboardPage.tsx`
- `src/features/payroll/pages/PayrollModulePage.tsx`
- `src/features/payroll/pages/sub-pages/PayrollManagementPage.tsx`
- `src/features/payroll/pages/sub-pages/SalaryPayoutsPage.tsx`
- `src/features/payroll/pages/sub-pages/TaxesPage.tsx`
- `src/features/payroll/pages/sub-pages/BenefitsPage.tsx`
- `src/features/hr/pages/sub-pages/PayrollManagementPage.tsx`
- `src/features/hr/pages/sub-pages/SalaryPayoutsPage.tsx`
- `src/features/hr/pages/sub-pages/TaxesPage.tsx`
- `src/features/hr/pages/sub-pages/BenefitsPage.tsx`

### Lint / Typecheck Errors Fixed

- No current errors remained in:
  - `src/components/common/ApprovalInbox.tsx`
  - `src/features/accounting/pages/AccountingDashboardPage.tsx`
  - `src/features/payroll/pages/PayrollDashboardPage.tsx`
- `npm.cmd run lint` now passes, and the lint script is `tsc --noEmit`, so the current typecheck baseline is clean.

### Payroll Pages Reviewed

- Payroll Dashboard
- Payroll Management
- Salary Payouts
- Taxes
- Benefits

### Payroll Tables / Grids Found

- `PayrollDashboardPage.tsx`
  - No true data-grid table surface. The page is analytics, charts, KPI cards, and list-style breakdowns.
- `PayrollManagementPage.tsx`
  - Already uses `AppTable` for:
    - `Payroll Exceptions`
    - `Payroll Runs`
    - `Latest Run Lines`
    - `Personal Bi-weekly Payroll Ledger`
  - Still contains one raw workflow table:
    - CSV import preview table inside the employee import modal
- `SalaryPayoutsPage.tsx`
  - Already uses `AppTable` for:
    - `Salary Payout Batches`
    - `Payout Batch Lines`
- `BenefitsPage.tsx`
  - Already uses `AppTable` for:
    - `Benefit Plans`
    - `Statutory Contribution Rules`
- `TaxesPage.tsx`
  - Uses a raw nested bracket reference table inside expandable tax table cards

### Payroll Tables / Grids Migrated

- No new payroll tables required migration to `AppTable` in this phase because the main payroll workflow grids were already aligned to the Phase 2A table foundation.

### Files Intentionally Skipped

- `src/features/hr/pages/sub-pages/TaxesPage.tsx`
- `src/features/hr/pages/sub-pages/PayrollManagementPage.tsx` CSV import preview table
- `src/features/payroll/pages/PayrollDashboardPage.tsx`

### Raw / Static Payroll Tables Intentionally Kept

- `src/features/hr/pages/sub-pages/TaxesPage.tsx`
  - Bracket reference table kept raw because it is a compact nested static/reference display inside expandable tax cards rather than a shared grid workflow.

### Deferred Payroll Workflow Tables

- `src/features/hr/pages/sub-pages/PayrollManagementPage.tsx`
  - CSV import preview table was intentionally deferred.
  - Reason deferred:
    - It is part of a payroll-specific import validation workflow.
    - It includes row-level error presentation, import gating, and modal confirmation behavior.
    - Migrating it safely should be handled as a separate payroll import workflow pass, not as a small visual alignment change.

### Payroll Behaviors Preserved

- Payroll calculations, deductions, tax setup behavior, payout logic, and benefit logic were unchanged.
- Existing payroll run approval and payout handoff behavior remains unchanged.
- Existing columns, filters, row actions, row click behavior, selected-row behavior, and detail panel behavior remain unchanged.
- Existing data sources and store wiring remain unchanged.
- Existing loading, empty-state, pagination, search, and sorting behavior remain unchanged on all already-migrated AppTable payroll grids.
- No routing, App shell, or business workflow refactors were introduced.

### Status Styling Improvements Completed

- `src/features/hr/pages/sub-pages/PayrollManagementPage.tsx`
  - Payroll run status badges now use `AppStatusBadge`.
  - Latest payroll line status badges now use `AppStatusBadge`.
- `src/features/hr/pages/sub-pages/SalaryPayoutsPage.tsx`
  - Payout batch status badges now use `AppStatusBadge`.
  - Payout line status badges now use `AppStatusBadge`.
- `src/config/status-style.config.ts`
  - Added centralized payroll-safe status mappings for:
    - `Computed`
    - `Queued`
    - `Released`
    - `Failed`
- No workflow labels or action gating logic were changed.

### Files Changed

- `src/config/status-style.config.ts`
- `src/features/hr/pages/sub-pages/PayrollManagementPage.tsx`
- `src/features/hr/pages/sub-pages/SalaryPayoutsPage.tsx`
- `docs/uiux/STSN_CONNECT_METRONIC_PHASE_2C_TABLE_MIGRATION_TRACKER.md`

### Validation Results

- `npm.cmd run lint`: passed.
- Typecheck status: passed via `npm.cmd run lint` because the project lint script is `tsc --noEmit`.
- `npm.cmd run build`: failed inside the sandbox with the known Vite config access issue.
- `npm.cmd run build` outside the sandbox: passed.
- Production build warning remains the existing large JS chunk warning.
- Confirmed no `STSNDataTable` was reintroduced.
- Confirmed no `DataTableCard` was reintroduced.
- Confirmed no `datatables.net*` dependency or source reference was reintroduced.
- Confirmed no Metronic dependency was added.
- Confirmed payroll calculation, tax, payout, and benefit logic were not changed.

### Remaining Lint / Typecheck Issues, If Any

- None in the current `npm.cmd run lint` output.

### Remaining Payroll Table Follow-Ups, If Any

- `src/features/hr/pages/sub-pages/PayrollManagementPage.tsx`
  - CSV import preview table remains the only payroll workflow table-like surface that may deserve a future dedicated AppTable migration.
- `src/features/hr/pages/sub-pages/TaxesPage.tsx`
  - Keep the nested tax bracket reference table raw unless the team explicitly wants static reference tables standardized too.

### Recommendation For Next Phase

- Treat the payroll table alignment portion of Phase 2G as complete.
- If the team wants another payroll-specific follow-up, the best isolated next target is the CSV import preview table in `PayrollManagementPage.tsx`, handled as a dedicated workflow-preservation pass with modal/import QA.
- Otherwise, keep broader future work focused on separate, clearly scoped UI standardization or build-size optimization rather than expanding this payroll phase.

## Phase 2H Core Setup / Setup Grid Alignment Notes

Audit date: 2026-06-28

### Files Reviewed

- `src/features/core-setup/pages/CoreSetupModulePage.tsx`
- `src/features/books/pages/BooksSetupPage.tsx`
- `src/features/accounts/pages/AccountsManagementPage.tsx`
- `src/features/admin/pages/AuditLogPage.tsx`
- `src/features/admin/pages/DelegationManagementPage.tsx`
- `src/config/status-style.config.ts`
- `src/config/books.config.ts`

### Files Migrated

- `src/features/core-setup/pages/CoreSetupModulePage.tsx`

### Setup / Config Grids Migrated

- Core Setup generic CRUD grid used by the setup categories in `CoreSetupModulePage.tsx`

### Files Intentionally Skipped

- `src/features/books/pages/BooksSetupPage.tsx`
- `src/features/accounts/pages/AccountsManagementPage.tsx`
- `src/features/admin/pages/AuditLogPage.tsx`
- `src/features/admin/pages/DelegationManagementPage.tsx`

### Raw / Static Tables Intentionally Kept

- `src/features/books/pages/BooksSetupPage.tsx`
  - Nested package book-list editor/detail table remains raw because it is an inline detail/editor table inside the package workflow rather than a standalone setup grid.

### Why Skipped Files Were Deferred

- `BooksSetupPage.tsx`
  - The main setup package grid already uses `AppTable`.
  - The remaining raw book-list table is embedded in the package detail/edit flow and is better treated as a nested editor pattern, not a broad setup-grid migration.
- `AccountsManagementPage.tsx`
  - The user-security grid already uses `AppTable`.
- `AuditLogPage.tsx`
  - Already uses `AppTable`.
- `DelegationManagementPage.tsx`
  - Uses workflow-oriented list/drilldown rows rather than a generic configuration grid and should be handled only in a dedicated module-specific pass if ever standardized.

### Setup Behaviors Preserved

- Core Setup preserved:
  - existing columns
  - external search input behavior
  - add/edit/delete actions
  - active/inactive toggle behavior
  - existing data source usage from `setupData`
  - existing empty-state messaging
  - 10-row pagination behavior
  - existing modal trigger and edit/create workflow
- No routing, App shell, or business logic changes were introduced.

### Status Styling Improvements Completed

- `src/features/core-setup/pages/CoreSetupModulePage.tsx`
  - Setup record active/inactive status now uses `AppStatusBadge`.
- No status labels or meanings were changed.

### Validation Results

- `npm.cmd run lint`: passed.
- Typecheck status: passed via `npm.cmd run lint` because the project lint script is `tsc --noEmit`.
- `npm.cmd run build`: failed inside the sandbox with the known Vite config access issue.
- `npm.cmd run build` outside the sandbox: passed.
- Confirmed `STSNDataTable` was not reintroduced.
- Confirmed `DataTableCard` was not reintroduced.
- Confirmed `datatables.net*` was not reintroduced.
- Confirmed no Metronic dependency was added.

### Remaining Table-Like UI Follow-Ups

- `src/features/books/pages/BooksSetupPage.tsx`
  - Nested package book-list editor/detail table remains intentionally raw.
- `src/features/admin/pages/DelegationManagementPage.tsx`
  - If desired later, treat delegation rows as a dedicated workflow standardization pass rather than a simple setup-grid conversion.

### Recommendation For Next Phase

- Treat the Core Setup setup-grid alignment as complete.
- If another setup/config pass is needed, focus next on only those remaining table-like surfaces that are true standalone grids, not nested editors or workflow drilldowns.
- Keep nested detail/editor tables and workflow lists out of broad AppTable sweeps unless the team wants dedicated patterns for those UI types.

## Phase 2G TypeScript / Lint Blocker Fix Notes

Audit date: 2026-06-28

### Files Reviewed

- `src/components/common/ApprovalInbox.tsx`
- `src/features/accounting/pages/AccountingDashboardPage.tsx`
- `src/features/payroll/pages/PayrollDashboardPage.tsx`

### Errors Fixed

- `src/components/common/ApprovalInbox.tsx`
  - Fixed `TS2322` by aligning the tab icon type with `EmptyState`'s `LucideIcon` requirement.
- `src/features/accounting/pages/AccountingDashboardPage.tsx`
  - Fixed `TS2339` by replacing the invalid `Payment.date` access with the existing `Payment.paymentDate` field.
- `src/features/payroll/pages/PayrollDashboardPage.tsx`
  - Fixed `TS2367` by replacing an impossible `"Inactive"` comparison against `Employee.status` with the intended `employmentStatus` check in the fallback headcount path.

### Files Changed

- `src/components/common/ApprovalInbox.tsx`
- `src/features/accounting/pages/AccountingDashboardPage.tsx`
- `src/features/payroll/pages/PayrollDashboardPage.tsx`
- `docs/uiux/STSN_CONNECT_METRONIC_PHASE_2C_TABLE_MIGRATION_TRACKER.md`

### Behavior Preserved

- Approval inbox tab behavior, empty states, status labels, and drawer flow remain unchanged.
- Accounting dashboard calculations, layout, revenue/expense chart structure, and existing payment aggregation behavior remain unchanged apart from using the correct payment date field.
- Payroll dashboard layout, KPI cards, salary breakdowns, payroll calculations, and status labels remain unchanged.
- No routing, business logic, data source, or table-migration scope was expanded.

### Validation Results

- `npm.cmd run lint`: passed.
- Typecheck status: passed via `npm.cmd run lint` because the project lint script is `tsc --noEmit`.
- `npm.cmd run build`: failed inside the sandbox with the known Vite config access issue.
- `npm.cmd run build` outside the sandbox: passed.
- Production build warning remains the existing large JS chunk warning.
- Confirmed no `STSNDataTable`, `DataTableCard`, or `datatables.net*` references were reintroduced.
- Confirmed removed legacy table files were not reintroduced:
  - `src/components/common/STSNDataTable.tsx` is still absent.
  - `src/components/common/DataTableCard.tsx` is still absent.
- Confirmed no Metronic dependency was added.
- Search for prohibited dependency names found only one existing source comment mentioning `Bootstrap` in `src/services/store.ts`; no dependency or runtime import was added.

### Remaining Lint / Typecheck Issues, If Any

- None found in the current `npm.cmd run lint` output.

### Recommendation For Next Phase

- Treat Phase 2G as complete and use `npm.cmd run lint` plus outside-sandbox `npm.cmd run build` as the clean validation baseline for upcoming UI work.
- If a follow-up cleanup phase is planned, focus on the remaining non-blocking build-size warning or on explicitly scoped UI standardization work rather than broader TypeScript repair.

## Phase 3B Reports Table Alignment Cross-Reference

- Phase 3B reviewed the dedicated report module plus report-adjacent raw tables and migrated only the shared live report grid in `src/features/reports/components/ReportTable.tsx` to `AppTable`.
- Print/export/preview/statement/workflow-detail tables remained intentionally raw or deferred, including `src/features/reports/components/ReportPreviewModal.tsx`, `src/services/reportExportService.ts`, `src/components/ModalPreviews.tsx`, registrar workflow preview tables, dashboard print/report tables, and accounting financial/detail tables.
- See `docs/uiux/STSN_CONNECT_METRONIC_PHASE_3_REPORTS_TABLE_ALIGNMENT_TRACKER.md` for the full classification, preserved behaviors, and validation results for the Phase 3B pass.

## Phase 4C.1 AppTable Toolbar Alignment Cross-Reference

- On 2026-06-29, the shared `AppTable` toolbar layout was standardized globally so built-in search, column visibility, and custom toolbar controls align to the right consistently without page-specific fixes.
- The change was implemented centrally in `src/components/common/AppTable.tsx` and applies automatically to existing migrated `AppTable` pages, including Guidance and Payroll surfaces that showed the most obvious alignment drift.
- Table behavior, data sources, routing, pagination, sorting, filters, row actions, and selection logic were preserved.
- See `docs/uiux/STSN_CONNECT_METRONIC_PHASE_4_SHARED_COMPONENTS_TRACKER.md` under `Phase 4C.1 Global AppTable Toolbar Alignment Notes` for the detailed behavior comparison and validation notes.

# STSN Connect Metronic Phase 3B Reports Table Alignment Tracker

Audit date: 2026-06-29

## Report Files Reviewed

- `src/features/reports/pages/RegistrarReportsPage.tsx`
- `src/features/reports/pages/GuidanceReportsPage.tsx`
- `src/features/reports/pages/ClinicReportsPage.tsx`
- `src/features/reports/pages/AdminReportsPage.tsx`
- `src/features/reports/components/ReportTable.tsx`
- `src/features/reports/components/ReportPreviewModal.tsx`
- `src/features/reports/components/ReportExportButtons.tsx`
- `src/features/reports/components/ReportFilterPanel.tsx`
- `src/features/reports/data/registrarReports.ts`
- `src/features/reports/data/guidanceReports.ts`
- `src/features/reports/data/clinicReports.ts`
- `src/features/reports/data/adminReports.ts`
- `src/services/reportExportService.ts`
- `src/components/ModalPreviews.tsx`
- `src/features/dashboard/pages/DashboardPage.tsx`
- `src/features/registrar/pages/RegistrarModulePage.tsx`
- `src/features/accounting/pages/AccountingModulePage.tsx`
- `src/features/accounting/pages/sub-pages/SalesInvoicesPage.tsx`
- `src/features/accounting/pages/sub-pages/PurchaseInvoicesPage.tsx`
- `src/features/accounting/pages/sub-pages/JournalEntriesPage.tsx`

## Report Tables Found

- `src/features/reports/components/ReportTable.tsx`
  - Live shared on-screen report grid for Registrar, Guidance, Clinic, and Admin reports.
- `src/features/reports/components/ReportPreviewModal.tsx:23`
  - Raw preview table inside the report preview modal.
- `src/services/reportExportService.ts:81`
  - HTML export/print table builder.
- `src/components/ModalPreviews.tsx:137`
  - COR print preview table.
- `src/components/ModalPreviews.tsx:437`
  - Report-card preview table.
- `src/components/ModalPreviews.tsx:518`
  - Assessment/report preview table.
- `src/features/dashboard/pages/DashboardPage.tsx:258`
  - Generated print table.
- `src/features/dashboard/pages/DashboardPage.tsx:426`
  - Raw dashboard analytics report-style table tied to print/detail output.
- `src/features/registrar/pages/RegistrarModulePage.tsx:1952`
  - Enrollment assessment fee breakdown table.
- `src/features/registrar/pages/RegistrarModulePage.tsx:2363`
  - Enrolled-subject preview/detail table.
- `src/features/registrar/pages/RegistrarModulePage.tsx:3011`
  - Import preview/validation table.
- `src/features/registrar/pages/RegistrarModulePage.tsx:3517`
  - Generated detail/preview table in registrar workflows.
- `src/features/accounting/pages/AccountingModulePage.tsx:970`
  - Ledger preview/detail table.
- `src/features/accounting/pages/AccountingModulePage.tsx:2189`
  - Fee breakdown table.
- `src/features/accounting/pages/AccountingModulePage.tsx:2241`
  - Payment schedule/detail table.
- `src/features/accounting/pages/sub-pages/SalesInvoicesPage.tsx:703`
  - Invoice detail/raw line table.
- `src/features/accounting/pages/sub-pages/PurchaseInvoicesPage.tsx:622`
  - Invoice detail/raw line table.
- `src/features/accounting/pages/sub-pages/JournalEntriesPage.tsx:770`
  - Journal line detail/raw table.

## Classification

### Safe To Migrate To AppTable Now

- `src/features/reports/components/ReportTable.tsx`
  - Shared live data-grid table only.
  - Not used for print/export generation.
  - Existing behavior was simple pagination plus filtered row display.

### Raw / Print / Export / Statement Tables Intentionally Kept

- `src/features/reports/components/ReportPreviewModal.tsx:23`
  - Kept raw because it is a print-preview-style layout.
- `src/services/reportExportService.ts:81`
  - Kept raw because it generates print/PDF/CSV/Excel-facing export output.
- `src/components/ModalPreviews.tsx:137`
  - Kept raw because it is printable COR output.
- `src/components/ModalPreviews.tsx:437`
  - Kept raw because it is printable report-card output.
- `src/components/ModalPreviews.tsx:518`
  - Kept raw because it is printable assessment/report output.
- `src/features/dashboard/pages/DashboardPage.tsx:258`
  - Kept raw because it is a generated print table.
- `src/features/dashboard/pages/DashboardPage.tsx:426`
  - Kept raw because it is paired with dashboard report/detail output.

### Deferred Workflow / Financial / QA-Sensitive Tables

- `src/features/registrar/pages/RegistrarModulePage.tsx:1952`
  - Deferred because it is tied to enrollment fee/assessment preview behavior.
- `src/features/registrar/pages/RegistrarModulePage.tsx:2363`
  - Deferred because it is a subject/detail preview inside registrar workflow output.
- `src/features/registrar/pages/RegistrarModulePage.tsx:3011`
  - Deferred because it is an import preview/validation surface needing workflow-specific QA.
- `src/features/registrar/pages/RegistrarModulePage.tsx:3517`
  - Deferred because it is generated workflow/detail output.
- `src/features/accounting/pages/AccountingModulePage.tsx:970`
  - Deferred because it is a ledger preview tied to financial detail behavior.
- `src/features/accounting/pages/AccountingModulePage.tsx:2189`
  - Deferred because it is a financial fee breakdown table with totals sensitivity.
- `src/features/accounting/pages/AccountingModulePage.tsx:2241`
  - Deferred because it is a payment-schedule detail table with calculation/totals risk.
- `src/features/accounting/pages/sub-pages/SalesInvoicesPage.tsx:703`
  - Deferred because it is invoice-line detail output tied to accounting workflow QA.
- `src/features/accounting/pages/sub-pages/PurchaseInvoicesPage.tsx:622`
  - Deferred because it is invoice-line detail output tied to accounting workflow QA.
- `src/features/accounting/pages/sub-pages/JournalEntriesPage.tsx:770`
  - Deferred because it is journal-line detail output tied to accounting calculations and QA.

## AppTable Migrations Completed

- Migrated `src/features/reports/components/ReportTable.tsx` from a raw custom paginated `<table>` to `AppTable`.
- Preserved fixed 10-row pagination behavior with `pageSizeOptions={[10]}`.
- Disabled `AppTable` search and column-visibility controls to preserve the existing external report-filter workflow.
- Preserved the existing filtered row source and column order from each report definition.

## Status Styling Improvements Completed

- `src/features/reports/components/ReportTable.tsx`
  - Safe status-like live report columns now use `AppStatusBadge` for:
    - `status`
    - `submissionStatus`
    - `verificationStatus`
    - `hardcopy`
- No report labels, mappings, or underlying status values were changed.

## Report Behaviors Preserved

- Existing report definitions, columns, filters, and row builders were not changed.
- Export/print/download behavior remained on `ReportExportButtons` plus `reportExportService`.
- Report preview modal behavior remained raw and unchanged.
- No routing, `App.tsx`, report calculations, totals, statuses, data sources, or mappings were changed.
- No `STSNDataTable`, `DataTableCard`, or DataTables.net code was reintroduced.

## Files Migrated

- `src/features/reports/components/ReportTable.tsx`

## Files Intentionally Skipped

- `src/features/reports/components/ReportPreviewModal.tsx`
- `src/services/reportExportService.ts`
- `src/components/ModalPreviews.tsx`
- `src/features/dashboard/pages/DashboardPage.tsx`
- `src/features/registrar/pages/RegistrarModulePage.tsx`
- `src/features/accounting/pages/AccountingModulePage.tsx`
- `src/features/accounting/pages/sub-pages/SalesInvoicesPage.tsx`
- `src/features/accounting/pages/sub-pages/PurchaseInvoicesPage.tsx`
- `src/features/accounting/pages/sub-pages/JournalEntriesPage.tsx`

## Validation Results

- `npm.cmd run lint`: passed
- Typecheck status: passed via `npm.cmd run lint` because the project lint script is `tsc --noEmit`
- `npm.cmd run build`: failed inside the sandbox with the known Vite config access restriction
- `npm.cmd run build` outside the sandbox: passed
- `rg -n "STSNDataTable|DataTableCard|datatables\\.net|datatables.net-dt|datatables.net-react" src package.json package-lock.json`: no matches
- Confirmed by code review that report calculations, totals, mappings, and export/preview implementations were not modified in this phase.

## Remaining Report Table Follow-Ups

- If the team wants deeper report standardization later, add an explicit documented `AppTable` pattern for print-preview/report-output surfaces before touching `ReportPreviewModal` or export builders.
- Registrar workflow preview tables should be handled in a registrar-specific QA pass.
- Accounting statement/detail tables should be handled only in a finance-specific QA pass because of totals and calculation sensitivity.

## Recommendation For Next Phase

- Treat Phase 3B as a narrow live-report-grid alignment pass.
- Move to the shared UI component work in Phase 4 with `AppTable` still serving as the active live data-grid foundation.
- Keep print/export/generated-report/statement tables as intentional raw exceptions until the product defines dedicated report-output patterns and QA coverage.

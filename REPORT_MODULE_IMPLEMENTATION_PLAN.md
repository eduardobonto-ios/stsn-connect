# Report Module Implementation Plan

## Goal

Create one shared reporting framework and expose role-specific report pages from it. This avoids building separate custom report systems for Registrar, Accounting, Cashier, Faculty, Guidance, Clinic, and Admin users.

Recommended architecture:

```text
Shared reporting engine
        |
        +-- Registrar Reports
        +-- Accounting Reports
        +-- Cashier Reports
        +-- Faculty Reports
        +-- Guidance Reports
        +-- Clinic Reports
        +-- Admin Reports
```

## Recommended Report Modules

### Registrar Reports

Status: Completed

Best reports to add:

- [x] Student Masterlist
- [x] Officially Enrolled Students
- [x] Enrollment Summary
- [x] Enrollment Count by Grade / Year Level
- [x] Enrollment Count by Section / Block
- [x] Enrollment Status Report
- [x] Transferee / Returnee Report
- [x] Dropped / Withdrawn Students
- [x] Requirements Submission Report
- [x] COR / Certificate of Registration

### Accounting Reports

Status: Completed

Existing Accounting reporting coverage:

- [x] Statement of Account
- [x] Student Ledger
- [x] Outstanding Balance Report
- [x] Assessment Summary
- [x] Discount / Scholarship Report
- [x] AR Aging
- [x] AP Aging
- [x] Trial Balance
- [x] Balance Sheet
- [x] Income Statement
- [x] Cash Flow Report

Completion note:

- Accounting report coverage is already in place through the Accounting module's existing dashboard, student ledger, billing and assessment, discounts, AR/AP aging, and financial statement pages.
- Accounting sidebar categorization has been updated to group the existing pages under Overview, Student Accounts, Accounting Setup, General Ledger, Accounts Receivable, Accounts Payable, and Financial Reports.

### Cashier Reports

Status: Completed

Implemented reports:

- [x] Daily Collection Report
- [x] OR Register / Receipt List
- [x] Payment History Report
- [x] Collection by Payment Method
- [x] Collection by Cashier
- [x] Cancelled / Voided Receipt Report
- [x] Student Payment Summary
- [x] End-of-Day Cashier Summary

Completion note:

- Cashier Reports are now available inside the existing Cashiering module as a Reports tab with report type selection, date filters, table preview, print, CSV, Excel, and PDF export actions.
- The Cancelled / Voided Receipt Report is available, but it will show no rows until payment records store cancelled or voided receipt status.

### Faculty / Teacher Reports

Status: Completed

Implemented reports:

- [x] Class List
- [x] Advisory Class List
- [x] Grade Sheet
- [x] Attendance Summary
- [x] Failed / Incomplete Grades
- [x] Subject Load Report

Completion note:

- Faculty / Teacher Reports are now available inside the existing Teacher Board as a Reports tab with report type selection, table preview, print, CSV, Excel, and PDF export actions.
- Reports use the current teacher's scoped class schedules, advisory section, student roster, attendance snapshot, and encoded grades.

### Guidance Reports

Recommended reports:

- Anecdotal Records Report
- Counseling Sessions Report
- Student Incident Report
- Parent Conference Report

### Clinic Reports

Recommended reports:

- Clinic Visit Report
- Student Health Profile Report
- Medicine Issuance Report
- Medical Incident Report

### Admin Reports

Recommended reports:

- User Access Report
- Login History
- Activity Logs
- Generated Reports History
- Data Export History

## Shared Reporting Components

All report modules should use the same reusable components for:

- Report filters
- Report table
- Print preview
- CSV export
- Excel export
- PDF export
- Access control

Suggested folder structure:

```text
src/features/reports/
  components/
    ReportFilterPanel.tsx
    ReportTable.tsx
    ReportExportButtons.tsx
    ReportPreviewModal.tsx

  pages/
    RegistrarReportsPage.tsx
    AccountingReportsPage.tsx
    CashierReportsPage.tsx
    FacultyReportsPage.tsx
    GuidanceReportsPage.tsx
    ClinicReportsPage.tsx
    AdminReportsPage.tsx
```

## Permission Updates

Update:

```text
src/config/permissions.config.ts
```

Add new report module permission keys:

```ts
| "REGISTRAR_REPORTS"
| "ACCOUNTING_REPORTS"
| "CASHIER_REPORTS"
| "FACULTY_REPORTS"
| "GUIDANCE_REPORTS"
| "CLINIC_REPORTS"
| "ADMIN_REPORTS";
```

Each report page should be guarded by the matching permission key.

## Navigation Updates

Update:

```text
src/config/navigation.config.ts
```

Add role-based report menu entries. Example:

```ts
{
  id: "REGISTRAR_REPORTS",
  label: "Registrar Reports",
  icon: FileText,
  desc: "Enrollment and student records reports",
}
```

Suggested labels and descriptions:

| ID | Label | Description |
| --- | --- | --- |
| `REGISTRAR_REPORTS` | Registrar Reports | Enrollment and student records reports |
| `ACCOUNTING_REPORTS` | Accounting Reports | Billing, ledgers, balances, and financial statements |
| `CASHIER_REPORTS` | Cashier Reports | Collections, receipts, payments, and cashier summaries |
| `FACULTY_REPORTS` | Faculty Reports | Class lists, grades, attendance, and subject loads |
| `GUIDANCE_REPORTS` | Guidance Reports | Counseling, incidents, anecdotal records, and conferences |
| `CLINIC_REPORTS` | Clinic Reports | Clinic visits, health profiles, medicine issuance, and incidents |
| `ADMIN_REPORTS` | Admin Reports | User access, login history, activity logs, and export history |

## App Route Updates

Update:

```text
src/App.tsx
```

Import the new report pages and add render conditions for each report module permission.

Suggested page imports:

```ts
import RegistrarReportsPage from "./features/reports/pages/RegistrarReportsPage";
import AccountingReportsPage from "./features/reports/pages/AccountingReportsPage";
import CashierReportsPage from "./features/reports/pages/CashierReportsPage";
import FacultyReportsPage from "./features/reports/pages/FacultyReportsPage";
import GuidanceReportsPage from "./features/reports/pages/GuidanceReportsPage";
import ClinicReportsPage from "./features/reports/pages/ClinicReportsPage";
import AdminReportsPage from "./features/reports/pages/AdminReportsPage";
```

## Report Export Service

The app currently has print preview behavior and some export buttons, but real PDF and Excel export should be centralized in a service.

Add:

```text
src/services/reportExportService.ts
```

This service should handle:

- Print
- CSV export
- Excel export
- PDF export
- File naming
- Generated report logs

Recommended future libraries:

- `xlsx` for Excel export
- `jspdf` for PDF generation
- `html2canvas` for rendering report previews into PDF-ready images

PDF and Excel support should be treated as first-class requirements, not placeholder buttons.

## Suggested Implementation Order

1. Add shared report types and report definitions.
2. Create shared report components.
3. Create `reportExportService.ts`.
4. Add the seven role-specific report pages.
5. Update permissions.
6. Update navigation/sidebar entries.
7. Update `App.tsx` render conditions.
8. Add generated report logging after export/print actions.
9. Test access control per role.
10. Test print, CSV, Excel, and PDF export behavior.

## Final Recommendation

Do not create completely separate custom report systems per role.

Instead, build one shared reporting framework, then expose different report pages based on role. This keeps filters, tables, preview behavior, exports, logging, and access control consistent across the entire app.

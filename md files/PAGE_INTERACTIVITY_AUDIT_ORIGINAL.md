# Page Interactivity Audit

Audit date: 2026-06-25

This checks the pages currently wired through `src/App.tsx` and `src/config/navigation.config.ts`. It focuses on whether each page already has an interactive approach, meaning users can filter, search, navigate, open modals, submit forms, approve/reject, edit records, export reports, paginate, or otherwise change the page state.

Status legend:

- `Interactive`: meaningful page-level interactions are already present.
- `Partial`: some interactions exist, but the page is mostly read-only, dashboard-only, or needs deeper workflow actions.
- `Read-only`: page is intentionally or currently display-only.
- `Wrapper`: page delegates to another interactive page/component.

## Summary

Most operational modules already have an interactive approach. The strongest areas are Registrar, Accounting operations, HR operations, Payroll operations, Cashier, Student Portal enrollment/profile, reports, grading, scheduling, online learning, and setup pages.

Main gaps:

- `GuardianPortalPage` is read-only by design and has no drill-down, acknowledgement, message, or request actions.
- `AccountingDashboardPage` and `HRDashboardPage` are analytics/dashboard views with no local filters, date ranges, or drill-through actions.
- `ActionCenterPage` has interactive behavior through `ApprovalInbox`, but the shell itself is mostly summary cards.
- Some dashboard-style pages should be treated as complete only if read-only analytics is the intended UX.

## Global Shell

| Area | Status | Current interaction approach | Notes |
| --- | --- | --- | --- |
| Sidebar and mobile drawer | Interactive | Module navigation, expandable groups, child subpage navigation, mobile drawer close/open. | State-driven routing via `activeModule` and module subpage state. |
| Role switcher | Interactive | Hover menu switches simulated account with `login(email, "")`. | Demo/sandbox behavior. |
| Global search | Interactive | Opens with button and keyboard shortcut `Ctrl+K` / `Meta+K`. | Implemented through `GlobalSearch`. |
| Notification bell | Interactive | Notification UI and urgent announcement banner. | Shared shell component. |
| Breadcrumbs | Partial | Reflect active module and selected subpage. | Display/navigation context only. |

## Top-Level Pages

| Page | Source | Status | Current interaction approach | Gap / recommendation |
| --- | --- | --- | --- | --- |
| Dashboard | `src/features/dashboard/pages/DashboardPage.tsx` | Interactive | State, buttons, KPI/action cards, modal/dialog patterns, shortcut to student list. | Good baseline. Consider drill-through consistency for all KPI cards if not already complete. |
| Action Center | `src/features/action-center/pages/ActionCenterPage.tsx` | Interactive | Uses `ApprovalInbox` for actionable queue navigation and approvals. | Summary cards are read-only; acceptable if queue handles action. |
| Student Directory | `src/features/student-directory/pages/StudentDirectoryPage.tsx` | Interactive | Search, datatable, quick-access record buttons, student portal modal. | Good. |
| Student Portal | `src/features/student-portal/pages/StudentPortalPage.tsx` | Interactive | Tab/subpage rendering, profile form save, enrollment stepper, enrollment actions, learning interactions. | Good. |
| Guardian Portal | `src/features/guardian/pages/GuardianPortalPage.tsx` | Read-only | Linked student cards, grade summary, fee statement, notices. | Add parent-facing actions if required: acknowledge notices, message registrar/adviser, request correction, download statement/report card. |
| Faculty Portal | `src/features/faculty/pages/FacultyPortalPage.tsx` | Interactive | Multiple states/buttons for teacher board workflows. | Good. |
| Faculty Admin | `src/features/faculty/pages/FacultyAdminPage.tsx` | Interactive | Buttons, modals/dialogs, management actions. | Good. |
| Online Learning | `src/features/online-learning/pages/OnlineLearningPage.tsx` | Interactive | Search/filter style state, module/video actions, many buttons. | Good. |
| Curriculum / Syllabus Pathways | `src/features/curriculum/pages/CurriculumManagementPage.tsx` | Interactive | Forms, buttons, modal/dialog workflow, curriculum management actions. | Good. |
| Class Scheduling | `src/features/scheduling/pages/SchedulingModulePage.tsx` | Interactive | Search/form controls, schedule state, buttons. | Good. |
| Class Sectioning | `src/features/class-sectioning/pages/ClassSectioningModulePage.tsx` | Interactive | Sectioning state, actions, dialogs, buttons. | Good. |
| Core Setup | `src/features/core-setup/pages/CoreSetupModulePage.tsx` | Interactive | Category state, setup forms/tables/actions. | Good. |
| Books and Library | `src/features/books/pages/BooksSetupPage.tsx` | Interactive | Search/filter inputs, setup actions, dialogs. | Good. |
| Clinic | `src/features/clinic/pages/ClinicModulePage.tsx` | Interactive | Forms, filters, action buttons. | Good. |
| Consultation | `src/features/consultation/pages/ConsultationModulePage.tsx` | Interactive | Appointment/consultation form controls and actions. | Good. |
| Guidance Office | `src/features/guidance/pages/GuidanceModulePage.tsx` | Interactive | Forms, filters, action buttons. | Good. |
| Accounts and Security | `src/features/accounts/pages/AccountsManagementPage.tsx` | Interactive | Search/filter controls and account/security actions. | Good. |
| Accounting Dashboard | `src/features/accounting/pages/AccountingDashboardPage.tsx` | Partial | Computed analytics, KPI cards, charts. | Add date range, school/unit filters, chart drill-through, export, or "view detail" actions if dashboard needs active exploration. |
| Payroll Dashboard | `src/features/payroll/pages/PayrollDashboardPage.tsx` | Interactive | Dashboard has state and action buttons. | Good. |

## Admission / Registrar Pages

| Page | Source | Status | Current interaction approach | Gap / recommendation |
| --- | --- | --- | --- | --- |
| Enrollment | `src/features/registrar/pages/RegistrarModulePage.tsx` | Interactive | Large workflow page with forms, buttons, imports, dialogs, enrollment processing. | Good. |
| Students | `src/features/student-directory/pages/StudentDirectoryPage.tsx` | Interactive | Searchable table and student detail modal. | Good. |
| Class Sectioning | `src/features/class-sectioning/pages/ClassSectioningModulePage.tsx` | Interactive | Assignment and section management actions. | Good. |
| Class Scheduling | `src/features/scheduling/pages/SchedulingModulePage.tsx` | Interactive | Schedule controls and state. | Good. |
| Faculty | `src/features/faculty/pages/FacultyAdminPage.tsx` | Interactive | Management dialogs/actions. | Good. |
| Syllabus Pathways | `src/features/curriculum/pages/CurriculumManagementPage.tsx` | Interactive | Curriculum forms/actions. | Good. |
| Grades Directory | `src/features/grading/pages/GradingModulePage.tsx` -> `GradesDirectoryPage.tsx` | Wrapper | Wrapper delegates to interactive grades directory. | Good. |
| Grade Encoding | `src/features/grading/pages/GradeEncodingPage.tsx` | Interactive | Grade encoding page has local controls. | Not directly routed from `App.tsx` in the current module switch; likely reached from grades directory. |
| Registrar Reports | `src/features/reports/pages/RegistrarReportsPage.tsx` | Interactive | Report selection cards, filters, preview, print, CSV, Excel, PDF, pagination. | Good. |

## Accounting Pages

| Page | Source | Status | Current interaction approach | Gap / recommendation |
| --- | --- | --- | --- | --- |
| Accounting module dashboard / legacy tabs | `src/features/accounting/pages/AccountingModulePage.tsx` | Interactive | Student ledger, discounts, billing, holds, approval modals, bulk actions, tabs. | Good. |
| Student Ledger | `AccountingModulePage.tsx` legacy tab | Interactive | Student selection, ledger details, assessment views/actions. | Good. |
| Discounts | `AccountingModulePage.tsx` legacy tab | Interactive | Requests, approve/reject flows, audit/view modals. | Good. |
| Billing and Assessment | `AccountingModulePage.tsx` legacy tab | Interactive | Approval queue, bulk approve/return, detail modals. | Good. |
| Financial Holds | `AccountingModulePage.tsx` legacy tab | Interactive | Datatable, status toggles, search/filter. | Good. |
| Chart of Accounts | `src/features/accounting/pages/sub-pages/ChartOfAccountsPage.tsx` | Interactive | Filters, form inputs, buttons, table actions. | Good. |
| Cost Centers | `src/features/accounting/pages/sub-pages/CostCentersPage.tsx` | Interactive | Filters, form inputs, buttons. | Good. |
| Supplier Management | `src/features/accounting/pages/sub-pages/SupplierManagementPage.tsx` | Interactive | Inputs, table, actions. | Good. |
| Item / Product Management | `src/features/accounting/pages/sub-pages/ItemProductManagementPage.tsx` | Interactive | Inputs, table, actions. | Good. |
| Journal Entries | `src/features/accounting/pages/sub-pages/JournalEntriesPage.tsx` | Interactive | Forms, postings, dialogs/actions. | Good. |
| Sales Invoice | `src/features/accounting/pages/sub-pages/SalesInvoicesPage.tsx` | Interactive | Invoice filters/forms/actions. | Good. |
| Purchase Invoice | `src/features/accounting/pages/sub-pages/PurchaseInvoicesPage.tsx` | Interactive | Invoice filters/forms/actions. | Good. |
| AR with Aging | `src/features/accounting/pages/sub-pages/ARAgingPage.tsx` | Interactive | Filters and aging table/actions. | Good. |
| AP with Aging | `src/features/accounting/pages/sub-pages/APAgingPage.tsx` | Interactive | Filters and aging table/actions. | Good. |
| Trial Balance | `src/features/accounting/pages/sub-pages/FinancialStatementsPage.tsx` | Partial | Report selector prop, filters, financial statement display. | Add export/print/drill-down if needed for finance reporting. |
| Balance Sheet | `FinancialStatementsPage.tsx` | Partial | Same shared report page. | Same recommendation. |
| Income Statement | `FinancialStatementsPage.tsx` | Partial | Same shared report page. | Same recommendation. |
| Cash Flow Report | `FinancialStatementsPage.tsx` | Partial | Same shared report page. | Same recommendation. |

## Cashiering Pages

| Page | Source | Status | Current interaction approach | Gap / recommendation |
| --- | --- | --- | --- | --- |
| Payment Queue | `src/features/cashier/pages/CashierModulePage.tsx` | Interactive | Queue cards, pagination, collect-payment modal, receipt preview/payment action. | Good. |
| Collection History | `CashierModulePage.tsx` | Interactive | Datatable, receipt/history actions, void request workflow. | Good. |
| Reports | `CashierModulePage.tsx` | Interactive | Report selection, date filters, preview/export patterns. | Good. |

## HR Pages

| Page | Source | Status | Current interaction approach | Gap / recommendation |
| --- | --- | --- | --- | --- |
| HR hub | `src/features/hr/pages/HRManagementPage.tsx` | Interactive | Search, workflow cards, quick actions, subpage navigation. | Good. |
| HR Dashboard | `src/features/hr/pages/sub-pages/HRDashboardPage.tsx` | Partial | KPI cards and computed summaries. | Add time/school filters and drill-through links if dashboard should be exploratory. |
| Employee Life Cycles | `src/features/hr/pages/sub-pages/EmployeeLifecyclePage.tsx` | Interactive | Filters/forms/actions. | Good. |
| Time Management | `src/features/hr/pages/sub-pages/TimeManagementPage.tsx` | Interactive | Time log filters/actions. | Good. |
| Shift Management | `src/features/hr/pages/sub-pages/ShiftManagementPage.tsx` | Interactive | Shift filters/forms/actions. | Good. |
| Attendance | `src/features/hr/pages/sub-pages/AttendancePage.tsx` | Interactive | Attendance filters/actions. | Good. |
| Leave Management | `src/features/hr/pages/sub-pages/LeaveManagementPage.tsx` | Interactive | Leave review/actions. | Good. |
| Recruitment | `src/features/hr/pages/sub-pages/RecruitmentPage.tsx` | Interactive | Applicant/job controls and actions. | Good. |
| Onboarding | `src/features/hr/pages/sub-pages/OnboardingPage.tsx` | Interactive | Checklist/action workflow. | Good. |

## Payroll Pages

`src/features/payroll/pages/PayrollModulePage.tsx` is a wrapper. The payroll subpage files re-export shared HR/payroll implementations from `src/features/hr/pages/sub-pages`.

| Page | Source | Status | Current interaction approach | Gap / recommendation |
| --- | --- | --- | --- | --- |
| Payroll Management | `src/features/hr/pages/sub-pages/PayrollManagementPage.tsx` | Interactive | Payroll run controls, calculations, approvals/actions. | Good. |
| Salary Payouts | `src/features/hr/pages/sub-pages/SalaryPayoutsPage.tsx` | Interactive | Status filters, row selection, detail panel, release payout action. | Good. |
| Taxes | `src/features/hr/pages/sub-pages/TaxesPage.tsx` | Interactive | Year filter and expandable tax table cards. | Add edit/import workflow if tax table maintenance should happen in-app. |
| Benefits | `src/features/hr/pages/sub-pages/BenefitsPage.tsx` | Interactive | Category filters, active/inactive toggles, datatable. | Add create/edit workflow if benefit maintenance should happen in-app. |

## Reports Pages

| Page | Source | Status | Current interaction approach | Gap / recommendation |
| --- | --- | --- | --- | --- |
| Registrar Reports | `src/features/reports/pages/RegistrarReportsPage.tsx` | Interactive | Report selection, filters, preview, print, CSV, Excel, PDF, pagination. | Good. |
| Guidance Reports | `src/features/reports/pages/GuidanceReportsPage.tsx` | Interactive | Shared report filters/export/preview/table flow. | Good. |
| Clinic Reports | `src/features/reports/pages/ClinicReportsPage.tsx` | Interactive | Shared report filters/export/preview/table flow. | Good. |
| Admin Reports | `src/features/reports/pages/AdminReportsPage.tsx` | Interactive | Shared report filters/export/preview/table flow. | Good. |

## Additional Page Components Not Wired In Current App Switch

These page components exist in `src/features/**/pages`, but are not currently listed in the active `App.tsx` module render switch.

| Page | Source | Status | Current interaction approach | Note |
| --- | --- | --- | --- | --- |
| Audit Log | `src/features/admin/pages/AuditLogPage.tsx` | Interactive | State, filters, buttons. | Not currently exposed in the main module switch. |
| Delegation Management | `src/features/admin/pages/DelegationManagementPage.tsx` | Interactive | State, forms/actions, dialogs. | Not currently exposed in the main module switch. |

## Recommended Next Work

1. Decide whether read-only dashboards are acceptable for Accounting Dashboard, HR Dashboard, and Guardian Portal.
2. If dashboards should be interactive, add common dashboard controls: date range, academic unit/school filter, drill-through CTA, and export.
3. If Guardian Portal should support parent self-service, add clear actions: acknowledge notice, download statement/report card, message office, or submit record correction request.
4. Expose or remove unused admin pages so the route inventory and implemented page components stay aligned.

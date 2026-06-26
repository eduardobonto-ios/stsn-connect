# Page Interactivity Audit & Implementation Blueprint

Audit date: 2026-06-25  
Updated implementation guide: 2026-06-25  
Progress last updated: 2026-06-25

## Implementation Progress

| Phase | Description | Status |
| --- | --- | --- |
| Phase 1 | Shared UI foundation (5 components) | ✅ Complete |
| Phase 2 | Action Center separation | ⬜ Pending — ActionCenterPage exists; full ApprovalInbox relocation not yet done |
| Phase 3 | Dashboard upgrades (Accounting, HR) | ⬜ Pending |
| Phase 4 | Guardian Portal self-service | ⬜ Pending |
| Phase 5 | Reports + admin cleanup | 🟡 Partial — WP-08 done; FinancialStatements, Taxes, Benefits pending |

### Phase 1 — Shared Components Created

| Component | Path | Notes |
| --- | --- | --- |
| `DashboardKpiCard` | `src/components/common/DashboardKpiCard.tsx` | Extends AppKpiCard with onClick drill-through, trend indicator, alert badge, loading state |
| `DashboardFilterBar` | `src/components/common/DashboardFilterBar.tsx` | Reusable filter row: selects, date range, search, reset, action slot |
| `DrilldownDrawer` | `src/components/common/DrilldownDrawer.tsx` | Right-side drawer: title, subtitle, filters summary, header action, scrollable body |
| `ActionSummaryWidget` | `src/components/common/ActionSummaryWidget.tsx` | Compact approval queue summary for dashboards; scope prop: global/accounting/hr/payroll/registrar |
| `ExportMenu` | `src/components/common/ExportMenu.tsx` | Dropdown export menu: PDF, print, CSV, Excel |

### WP-08 — Admin Pages Exposed (Complete)

- `AuditLogPage.tsx` and `DelegationManagementPage.tsx` are now accessible as tabs inside `AccountsManagementPage.tsx`.
- Navigation updated in `navigation.config.ts`: `delegation-management` and `audit-log` added as children of `ACCOUNTS_SECURITY`.
- App.tsx updated: `accountsSubPage` state added, wired in both desktop and mobile sidebar navigation, passed to `AccountsManagement`.
- Role access: inherits ACCOUNTS_SECURITY permissions (Super Admin, Admin only).

### Remaining Work (Phases 2–5)

- **Phase 2**: Move full `ApprovalInbox` into a standalone `ActionCenterPage`; replace large dashboard queue usages with `ActionSummaryWidget`.
- **Phase 3**: Upgrade Accounting dashboard tab (`AccountingModulePage.tsx`) with `DashboardFilterBar`, `DashboardKpiCard`, `ActionSummaryWidget`, `DrilldownDrawer`, `ExportMenu`. Same for `HRDashboardPage.tsx`.
- **Phase 4**: Redesign `GuardianPortalPage.tsx` — student selector, tabs, notice acknowledgement, downloads, request workflow.
- **Phase 5**: Upgrade `FinancialStatementsPage.tsx` with row drill-through, export, comparison. Decide Taxes/Benefits maintenance scope.

---

This document updates the original page interactivity audit into an implementation-ready guide. It keeps the original purpose of checking whether each page wired through `src/App.tsx` and `src/config/navigation.config.ts` has meaningful interaction, then adds the proper interactive design direction for the pages that were marked as `Partial`, `Read-only`, or not fully aligned with best UI/UX practice.

> Important codebase correction from the latest `stsn-connect` package: the current project does not contain `src/features/accounting/pages/AccountingDashboardPage.tsx`. The accounting dashboard is currently handled as the `dashboard` tab inside `src/features/accounting/pages/AccountingModulePage.tsx`. Apply the Accounting Dashboard work to that tab unless a separate dashboard page is intentionally created.

---

## Status Legend

- `Interactive`: meaningful page-level interactions are already present.
- `Partial`: some interactions exist, but the page is mostly read-only, dashboard-only, or needs deeper workflow actions.
- `Read-only`: page is intentionally or currently display-only.
- `Wrapper`: page delegates to another interactive page/component.
- `Needs redesign`: the page technically works but should be redesigned to follow better workflow separation and user experience.

---

## Executive Summary

Most operational modules already have a good interactive foundation. The strongest areas are Registrar, Accounting operations, HR operations, Payroll operations, Cashier, Student Portal enrollment/profile, reports, grading, scheduling, online learning, and setup pages.

The main improvements to implement are:

1. Upgrade `GuardianPortalPage` from read-only into a parent self-service portal.
2. Upgrade the Accounting dashboard tab in `AccountingModulePage.tsx` into a financial command center with filters, drill-downs, export, and actionable summaries.
3. Upgrade `HRDashboardPage` into a workforce command center with filters, drill-downs, and role-aware workflow shortcuts.
4. Move approval-heavy queue behavior away from dashboards and into a proper Action Center experience.
5. Add export, print, and drill-down behavior to financial statement reports.
6. Add maintenance workflows for Taxes and Benefits if these records are intended to be managed inside the ERP.
7. Expose or intentionally remove unused admin pages so the navigation inventory and implemented page components remain aligned.

The target design should not simply add more buttons. The goal is to make every major page support a clear workflow: **discover → filter → inspect → act → confirm → audit**.

---

## Global UX Rules for All Improvements

Use these rules for every page touched by this work.

### 1. Dashboards must summarize, not become queue dumping grounds

Dashboards should show insights and small actionable summaries, but they should not display a full approval queue as the main page content.

Preferred pattern:

- Dashboard shows KPI cards, charts, alerts, and top 3-5 urgent items.
- Each alert has a clear CTA such as `Open Action Center`, `Review Discounts`, `View Payroll Run`, or `View Billing Queue`.
- Full review/approval work happens in a dedicated workflow page or Action Center.

Apply this especially to:

- Main Dashboard in `src/features/dashboard/pages/DashboardPage.tsx`
- Accounting dashboard tab in `src/features/accounting/pages/AccountingModulePage.tsx`
- Payroll dashboard/module view in `src/features/payroll/pages/PayrollModulePage.tsx`
- Any location where `ApprovalInbox` is currently mounted directly as a large page section

### 2. Every interactive dashboard should have a standard filter bar

Add a reusable filter bar pattern where applicable.

Recommended controls:

- School year
- Semester / term / grading period where applicable
- Date range
- Academic unit: Basic Ed / College / All
- Grade level, section, program, or department where applicable
- Status filter
- Search field when the page contains records
- Reset filters button
- Export button when the filtered data can be reported

Suggested component:

```text
src/components/common/DashboardFilterBar.tsx
```

### 3. KPI cards should be clickable and explain what happens next

KPI cards should not only display a number. Each KPI should support:

- `onClick` drill-through
- Tooltip or helper text
- Trend indicator
- Status badge when action is required
- Route/subpage target or drawer target

Recommended states:

- Default
- Hover
- Focus
- Loading
- Empty
- Alert

### 4. Use drawers for inspection and modals for decisions

Use the proper pattern based on the user action.

Use a right-side drawer for:

- Student financial details
- Employee profile snapshots
- Notice details
- Report row details
- Audit trail preview

Use a modal/dialog for:

- Approve
- Reject
- Return for correction
- Submit request
- Acknowledge notice
- Confirm export
- Void/cancel request

### 5. Every submit action must have feedback and auditability

Every action should include:

- Loading state
- Success toast
- Error toast
- Validation message
- Confirmation where risk is high
- Audit trail entry or demo-state equivalent

For production Supabase-backed workflows, create a migration under:

```text
supabase/migrations
```

when the data being captured is not already represented by an existing table.

### 6. Keep the existing STSN visual identity

Do not introduce random page-specific themes. Reuse the existing design language:

- `font-display` for headers
- `font-sans` for body text
- `font-mono` for small uppercase labels and codes
- `stsn-brown`, `stsn-brown-dark`, `stsn-gold`, `stsn-cream`, `stsn-beige`
- Rounded cards, soft borders, light shadows, compact labels
- Existing common components where available: `EmptyState`, `STSNDataTable`, `ApprovalInbox`, `NotificationBell`, `BreadcrumbBar`, `SLABadge`, modal/dialog helpers

### 7. Make role boundaries explicit

Every improvement must respect module permissions from:

```text
src/config/permissions.config.ts
src/config/navigation.config.ts
```

Rules:

- Guardian users must only see students linked to their guardian account.
- Accounting users should not see HR-only workflows.
- HR users should not see accounting-only workflows.
- Payroll users should only see payroll-related approval/action items.
- Super Admin may see all modules and admin-only pages.
- Admin access should be limited to the approved admin scope only if Admin is separated from Super Admin in the final role design.

---

## Updated Gap Assessment

| Area | Current status | Target status | Required improvement |
| --- | --- | --- | --- |
| Guardian Portal | Read-only | Interactive parent self-service portal | Add notice acknowledgement, downloads, request/correction workflow, message/contact actions, student-specific drill-downs. |
| Accounting dashboard tab | Partial | Interactive financial command center | Add filters, clickable KPIs, drill-through drawer, export, and compact action summaries. |
| HR Dashboard | Partial | Interactive workforce command center | Add filters, clickable KPIs, employee/workflow drill-throughs, export, and compact action summaries. |
| ApprovalInbox placement | Needs redesign | Dedicated Action Center + compact dashboard summaries | Avoid attaching full approval queues directly to dashboards. |
| Financial Statements | Partial | Interactive report explorer | Add export, print, drill-down, row detail, comparison period, and audit-friendly report metadata. |
| Taxes | Interactive but maintenance-light | Full maintenance workflow if in-app maintenance is required | Add create/edit/import/versioning workflow only if tax tables are managed inside STSN Connect. |
| Benefits | Interactive but maintenance-light | Full maintenance workflow if in-app maintenance is required | Add create/edit/archive workflow only if benefit plans are managed inside STSN Connect. |
| Audit Log / Delegation Management | Implemented but not exposed | Properly exposed admin tools or removed | Wire under admin/security navigation or remove unused components. |

---

# Implementation Work Packages

## WP-01 — Guardian Portal Self-Service Redesign

### Target file

```text
src/features/guardian/pages/GuardianPortalPage.tsx
```

### Current issue

The page currently acts as a read-only view for linked students, grades, fee statement, and notices. This is safe, but it does not provide enough parent-facing self-service value.

### Target experience

Turn the Guardian Portal into a clean parent command center where guardians can view, download, acknowledge, and request help without having to call the school for every concern.

Recommended layout:

```text
Guardian Portal
├── Header: guardian name, linked student count, latest school year/term
├── Student selector cards
├── Quick action row
│   ├── Download Statement
│   ├── Download Report Card
│   ├── Message Office
│   └── Request Correction
├── Main tabs
│   ├── Overview
│   ├── Grades
│   ├── Finance
│   ├── Notices
│   └── Requests
└── Right drawer / modal workflows
```

### Required interactions

#### A. Linked student selector

Add selectable student cards when the guardian has more than one linked student.

Behavior:

- Default to the first linked student.
- Selecting a student refreshes grades, fee statement, notices, and request history.
- Student card should show name, grade/section/program, student number/LRN if available, and status.
- Add an empty state when no linked student exists.

#### B. Notices with acknowledgement

Upgrade notices from static cards to actionable items.

Each notice should have:

- Priority badge: normal / important / urgent
- Date posted
- Expiry date when available
- Target student or all linked students
- `View Details` action
- `Acknowledge` action for notices requiring parent acknowledgement

Recommended interaction:

- `View Details` opens a drawer.
- `Acknowledge` opens a small confirmation modal.
- After acknowledgement, show `Acknowledged by [Guardian Name]` and timestamp.

Suggested production table if not yet available:

```sql
create table if not exists public.guardian_notice_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  guardian_id uuid not null,
  student_id uuid,
  announcement_id uuid not null,
  acknowledged_at timestamptz not null default now(),
  acknowledgement_note text,
  created_at timestamptz not null default now(),
  unique (guardian_id, announcement_id, student_id)
);
```

Create this only if the project does not already have an equivalent table.

#### C. Downloadable statements and report cards

Add clear download actions:

- `Download Fee Statement`
- `Download Report Card`
- `Print Summary`

Behavior:

- Downloads should use the selected student context.
- File name should include student name, school year, and document type.
- If PDF generation is not yet implemented, add a preview/print view first and keep the export action disabled with a clear tooltip.

#### D. Parent request workflow

Add a `Requests` tab where guardians can submit and track requests.

Recommended request types:

- Student information correction
- Grade clarification
- Fee/ledger clarification
- Document request
- Appointment request
- General concern

Required fields:

- Selected student
- Request type
- Subject
- Description
- Optional attachment
- Preferred contact method

Statuses:

- Draft
- Submitted
- In Review
- Waiting for Parent
- Resolved
- Cancelled

Suggested production table if not yet available:

```sql
create table if not exists public.guardian_service_requests (
  id uuid primary key default gen_random_uuid(),
  guardian_id uuid not null,
  student_id uuid not null,
  request_type text not null,
  subject text not null,
  description text not null,
  preferred_contact_method text,
  status text not null default 'Submitted',
  assigned_role text,
  assigned_user_id uuid,
  resolution_note text,
  submitted_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Create this only if the project does not already have an equivalent workflow table.

#### E. Message office action

Add `Message Registrar`, `Message Adviser`, and `Message Accounting` actions only if the connected workflow exists or can be simulated safely.

Recommended behavior:

- Clicking message opens a modal.
- The modal pre-fills the selected student.
- The guardian chooses concern type and writes a message.
- The message becomes a service request or internal notification.

Avoid adding a fake chat UI unless there is a real messaging workflow behind it.

### UI quality requirements

- Use a tabbed layout instead of one long page.
- Keep parent language simple and non-technical.
- Show financial amounts clearly with currency formatting.
- Use friendly empty states: `No notices requiring action`, `No open requests`, `No grade records yet`.
- Avoid exposing internal IDs unless needed.
- Show a privacy note: guardians only see records linked to their account.

### Acceptance criteria

- Guardian can switch between linked students.
- Guardian can acknowledge a notice.
- Guardian can download or preview a fee statement/report card.
- Guardian can submit a request.
- Guardian can track request status.
- Guardian cannot access another guardian's student.
- Empty, loading, and error states are handled.
- Page remains responsive on mobile.

---

## WP-02 — Accounting Dashboard Financial Command Center

### Target file

```text
src/features/accounting/pages/AccountingModulePage.tsx
```

Apply this to the `dashboard` tab. Do not use `AccountingDashboardPage.tsx` unless a new separate page is intentionally created.

### Current issue

The dashboard has computed analytics, KPI cards, and charts, but it needs stronger exploration and action patterns. Also, full approval queues should not dominate the dashboard.

### Target experience

Create an Accounting Command Center that lets users answer these questions quickly:

- How much should we collect?
- What is overdue?
- What requires approval?
- Which students/accounts need follow-up?
- What changed during the selected period?
- Where do I go to act on the issue?

Recommended layout:

```text
Accounting Command Center
├── Filter bar
├── KPI cards with drill-through
├── Collection / receivables trend section
├── Aging risk section
├── Compact attention required panel
├── Top students/accounts needing action
└── Export / print / view details actions
```

### Required filters

Add a dashboard filter bar with:

- School year
- Term / semester / month
- Date range
- Academic unit: All / Basic Ed / College
- Grade level / program
- Payment status: All / Paid / Partial / Overdue / On Hold
- Search student
- Reset filters

### Required KPI cards

Recommended cards:

1. Total Receivables
2. Collected Amount
3. Outstanding Balance
4. Overdue Accounts
5. Pending Assessments
6. Pending Discounts
7. Financial Holds
8. Collection Rate

Each KPI card must be clickable.

Click behavior examples:

- `Total Receivables` → opens drawer/table filtered to all receivables.
- `Overdue Accounts` → opens drawer/table filtered to overdue students.
- `Pending Assessments` → navigates to Billing and Assessment approval workflow.
- `Pending Discounts` → navigates to Discounts approval workflow.
- `Financial Holds` → navigates to Holds tab.

### Approval queue redesign

Do not show the full `ApprovalInbox` as the main dashboard content.

Use this instead:

```text
Attention Required
├── Pending billing assessments: 8 [Review]
├── Discount requests needing L1 approval: 4 [Review]
├── Holds requiring release review: 2 [Review]
└── Open Action Center
```

Implementation options:

- Create a reusable `ActionSummaryWidget`.
- Keep full `ApprovalInbox` inside a dedicated Action Center page or workflow route.
- Dashboard should only show summarized action counts and top urgent items.

Suggested component:

```text
src/components/common/ActionSummaryWidget.tsx
```

### Required drill-through drawer

Create a reusable drawer for dashboard drill-throughs.

Suggested component:

```text
src/components/common/DrilldownDrawer.tsx
```

Drawer should support:

- Title
- Applied filters summary
- Data table
- Row actions
- Export current result
- Close

### Required export behavior

Dashboard-level export options:

- Export filtered dashboard summary to PDF or print view
- Export drill-through table to CSV/Excel
- Include metadata: school year, term, date range, generated by, generated at

### UI quality requirements

- Use high-density cards but avoid visual clutter.
- Keep financial figures aligned and formatted consistently.
- Use risk badges for overdue/hot accounts.
- Add helper text under each KPI.
- Show loading skeletons for KPIs and charts.
- Show empty state when filters return no data.

### Acceptance criteria

- Accounting user can filter the dashboard.
- KPI cards drill through to filtered details.
- Pending approval counts navigate to the correct accounting workflow.
- Full approval queue is not attached directly to the dashboard.
- Export works for summary and drill-through data.
- Dashboard respects school/unit filters.
- Page is responsive and usable on tablet/mobile.

---

## WP-03 — HR Dashboard Workforce Command Center

### Target file

```text
src/features/hr/pages/sub-pages/HRDashboardPage.tsx
```

### Current issue

The page shows KPI cards and computed summaries, but it lacks filters, drill-through actions, and deeper workflow shortcuts.

### Target experience

Turn the HR Dashboard into a Workforce Command Center that helps HR users identify workforce, attendance, leave, payroll, and onboarding items that need action.

Recommended layout:

```text
HR Workforce Command Center
├── Filter bar
├── KPI cards with drill-through
├── Workforce composition
├── Attendance / time alerts
├── Leave and onboarding action summary
├── Upcoming birthdays / contract end / probation end reminders
└── Export / details drawer
```

### Required filters

Add filters for:

- School / campus
- Department
- Employment status
- Employment type
- Date range
- Month
- Search employee
- Reset filters

### Required KPI cards

Recommended cards:

1. Total Employees
2. Active Employees
3. Pending Leave Requests
4. Pending Time Logs
5. Open Payroll Periods
6. Employees On Leave
7. Probation Ending Soon
8. Contracts Ending Soon

Each KPI should be clickable.

Click behavior examples:

- `Total Employees` → opens employee list drawer.
- `Pending Leave Requests` → navigates to Leave Management filtered to pending.
- `Pending Time Logs` → navigates to Time Management filtered to unapproved.
- `Open Payroll Periods` → navigates to Payroll Management.
- `Probation Ending Soon` → opens drawer of affected employees.

### Required action summary

Add a compact action summary instead of a full approval queue.

Example:

```text
Needs HR Review
├── Leave requests for approval: 6 [Open Leave Management]
├── Unapproved time logs: 11 [Open Time Management]
├── Onboarding checklists overdue: 3 [Open Onboarding]
└── Payroll periods open: 1 [Open Payroll]
```

### Required drill-through behavior

Use the same reusable `DrilldownDrawer` pattern from Accounting where possible.

Drawer should support:

- Employee list
- Status badges
- Department filter summary
- Quick action button
- Link to employee lifecycle page when available

### Required export behavior

Add export for:

- Workforce summary
- Filtered employee list
- Attendance/time exceptions
- Leave summary

Include report metadata.

### UI quality requirements

- Keep the page HR-friendly, not payroll-heavy.
- Use workforce terms that HR users understand.
- Distinguish workforce analytics from pending actions.
- Avoid too many charts. Use charts only when they answer a clear question.
- Provide empty states for departments or filters with no matching data.

### Acceptance criteria

- HR user can filter dashboard data.
- KPI cards open the correct drill-through or workflow.
- Pending items link to the correct HR subpage.
- Export works for filtered workforce data.
- Dashboard does not expose accounting-only information.
- Mobile layout remains readable.

---

## WP-04 — Dedicated Action Center / Approval Inbox Redesign

### Current files involved

```text
src/App.tsx
src/components/common/ApprovalInbox.tsx
src/config/navigation.config.ts
src/config/permissions.config.ts
```

### Current issue

`ApprovalInbox` is currently mounted directly in several module views. This works technically, but it can make dashboards feel like approval pages. For best UX, dashboards should summarize actions while the full queue should live in a dedicated Action Center.

### Recommended target design

Create a dedicated Action Center page.

Suggested new file:

```text
src/features/action-center/pages/ActionCenterPage.tsx
```

Suggested new module ID:

```ts
"ACTION_CENTER"
```

Add it to:

```text
src/config/permissions.config.ts
src/config/navigation.config.ts
src/App.tsx
```

Recommended role access:

- `SUPER_ADMIN`
- `ADMIN` if admin is allowed to approve operational items
- `PRINCIPAL` for academic approvals only
- `REGISTRAR` for enrollment/registrar approvals
- `ACCOUNTING` for billing/discount/hold approvals
- `HR` for leave/time/onboarding approvals
- `PAYROLL` for payroll approvals

Do not expose the Action Center to Student or Guardian roles.

### Recommended Action Center layout

```text
Action Center
├── Header summary
│   ├── Total pending
│   ├── Overdue/SLA risk
│   ├── Returned items
│   └── My approvals
├── Filter bar
│   ├── Category
│   ├── Priority
│   ├── Status
│   ├── School/unit
│   ├── Date range
│   └── Search
├── Queue tabs
│   ├── All
│   ├── Enrollment
│   ├── Accounting
│   ├── HR
│   ├── Payroll
│   └── Delegated to me
├── Approval list/table
└── Decision drawer/modal
```

### Required interactions

- Search approvals
- Filter by category/status/priority/date
- Sort by SLA / newest / oldest / amount / student / requester
- Open approval details drawer
- Approve
- Reject
- Return for correction
- Delegate / reassign if allowed
- Bulk action where safe
- Show decision history
- Show attachments/evidence
- Show SLA badge

### Dashboard integration after Action Center exists

Replace full `ApprovalInbox` dashboard usage with compact summary widgets.

Example replacements:

- Main Dashboard: `ActionSummaryWidget variant="global"`
- Accounting dashboard tab: `ActionSummaryWidget scope="accounting"`
- Payroll dashboard: `ActionSummaryWidget scope="payroll"`

Each widget should show only:

- Count by category
- Top urgent 3 items
- CTA to `Open Action Center`

### Acceptance criteria

- Full approval queue exists in one dedicated place.
- Dashboard pages no longer show large approval queue sections.
- Approval decisions still work after relocation.
- Role access controls are respected.
- Users can filter, review, act, and audit decisions.

---

## WP-05 — Financial Statements Report Explorer

### Target file

```text
src/features/accounting/pages/sub-pages/FinancialStatementsPage.tsx
```

### Current issue

Trial Balance, Balance Sheet, Income Statement, and Cash Flow Report are partial because they display financial statement data but need stronger reporting actions.

### Target experience

Create a report explorer, not only a static report view.

### Required interactions

- Report type selector
- School year / fiscal year selector
- Period selector
- Compare with previous period toggle
- Consolidated / Basic Ed / College filter
- Expand/collapse report sections
- Row drill-through to ledger entries
- Export PDF
- Export Excel
- Print view
- Save report snapshot if required

### Drill-through behavior

Clicking a report row should open a drawer showing:

- Account code
- Account name
- Opening balance
- Debits
- Credits
- Ending balance
- Related journal entries
- Related invoices/payments when available

### Acceptance criteria

- User can filter each financial statement.
- User can drill into rows.
- User can export and print.
- Export includes period and generated-by metadata.
- Empty states and loading states are handled.

---

## WP-06 — Taxes Maintenance Workflow

### Target file

```text
src/features/hr/pages/sub-pages/TaxesPage.tsx
```

### Current issue

The page is interactive with a year filter and expandable tax table cards, but it should only become a full maintenance page if STSN Connect is expected to maintain tax tables inside the ERP.

### Recommended workflow if in-app maintenance is required

Add:

- Create tax table
- Edit tax bracket
- Import tax table from CSV/Excel
- Version tax table by effective year
- Preview impact before activation
- Activate/deactivate table version
- Audit history

### Required safety rules

- Never overwrite active payroll tax rules without confirmation.
- Use effective dates.
- Keep previous versions available for audit.
- Require elevated HR/Payroll/Admin permission for editing.

### Acceptance criteria

- Payroll/HR can view tax tables.
- Authorized users can create/edit/import tax table versions.
- Active versions are clearly identified.
- Changes are auditable.

---

## WP-07 — Benefits Maintenance Workflow

### Target file

```text
src/features/hr/pages/sub-pages/BenefitsPage.tsx
```

### Current issue

The page has category filters, active/inactive toggles, and a datatable. Add full maintenance only if benefits are managed inside the ERP.

### Recommended workflow if in-app maintenance is required

Add:

- Create benefit plan
- Edit benefit plan
- Archive/deactivate plan
- Assign eligibility rules
- Employee enrollment preview
- Contribution setup
- Effective date/versioning
- Audit history

### Required fields

- Plan code
- Plan name
- Category
- Eligibility group
- Employer contribution
- Employee contribution
- Effective date
- Status

### Acceptance criteria

- Authorized users can maintain benefit plans.
- Inactive plans cannot be assigned to new employees.
- Existing employees retain historical benefit references.
- All changes are auditable.

---

## WP-08 — Expose or Remove Unused Admin Pages

### Current files

```text
src/features/admin/pages/AuditLogPage.tsx
src/features/admin/pages/DelegationManagementPage.tsx
```

### Current issue

These pages exist but are not currently exposed in the main `App.tsx` render switch or visible navigation.

### Recommended approach

Do not leave hidden production pages unless they are intentionally reserved for future work.

Choose one of these approaches.

### Option A — Expose under User Access & Authority

Recommended if the pages are already useful.

Wire them as subpages under:

```text
src/features/accounts/pages/AccountsManagementPage.tsx
src/config/navigation.config.ts
```

Suggested navigation group:

```text
User Access & Authority
├── User Security
├── Delegation Management
├── Audit Log
└── Admin Reports
```

Role access:

- Super Admin: full access
- Admin: only if Admin should manage users/security
- Other roles: no access unless explicitly required

### Option B — Add dedicated module IDs

Use this only if the pages need separate module-level permissions.

Suggested module IDs:

```ts
"AUDIT_LOG"
"DELEGATION_MANAGEMENT"
```

Then update:

```text
src/config/permissions.config.ts
src/config/navigation.config.ts
src/App.tsx
```

### Option C — Remove from active codebase

If these pages are not ready or should not be used, remove or archive them to avoid confusion.

### Acceptance criteria

- No implemented page remains unintentionally unreachable.
- Navigation matches actual available pages.
- Admin-only tools are not visible to non-admin roles.
- Super Admin can access audit/delegation tools if retained.

---

# Recommended Shared Components

Create or reuse these components to keep the implementation clean and uniform.

## `DashboardFilterBar`

Suggested path:

```text
src/components/common/DashboardFilterBar.tsx
```

Purpose:

- Reusable filter row for dashboards and report pages.
- Supports select fields, date range, search, reset, export slot.

## `DashboardKpiCard`

Suggested path:

```text
src/components/common/DashboardKpiCard.tsx
```

Purpose:

- Standard clickable KPI card.
- Supports icon, label, value, helper text, trend, alert state, and click handler.

## `DrilldownDrawer`

Suggested path:

```text
src/components/common/DrilldownDrawer.tsx
```

Purpose:

- Reusable side drawer for details behind KPI cards/charts/report rows.
- Supports title, subtitle, filters summary, children content, export action.

## `ActionSummaryWidget`

Suggested path:

```text
src/components/common/ActionSummaryWidget.tsx
```

Purpose:

- Compact dashboard-safe alternative to full `ApprovalInbox`.
- Shows counts, top urgent items, and CTA to open the Action Center.

## `RequestStatusTimeline`

Suggested path:

```text
src/components/common/RequestStatusTimeline.tsx
```

Purpose:

- Used by Guardian Requests, approvals, service requests, and audit-style workflows.

## `ExportMenu`

Suggested path:

```text
src/components/common/ExportMenu.tsx
```

Purpose:

- Standardizes PDF, print, CSV, and Excel export actions.

---

# Data and Migration Guidance

Use existing store/demo data where the project is still prototype-driven. For production behavior, do not store new persistent workflow data only in local state.

Create Supabase migrations under:

```text
supabase/migrations
```

only when the workflow needs data that does not already exist.

Likely new persistence needs:

| Workflow | Possible table |
| --- | --- |
| Guardian notice acknowledgement | `guardian_notice_acknowledgements` |
| Guardian service requests | `guardian_service_requests` |
| Guardian request comments/attachments | `guardian_service_request_comments`, `guardian_service_request_attachments` |
| Action Center delegation | use existing approval/delegation tables if available; otherwise create approval delegation table |
| Tax table versioning | use existing payroll/tax tables if available; otherwise create `tax_table_versions` and `tax_brackets` |
| Benefit versioning | use existing benefit tables if available; otherwise create `benefit_plan_versions` |

Before creating any migration:

1. Search existing schema/types/store for equivalent data.
2. Reuse existing tables if they already support the workflow.
3. Add foreign keys and indexes.
4. Add `created_at`, `updated_at`, and actor fields where needed.
5. Add RLS policies if Supabase auth/RLS is enabled.
6. Include seed/demo data only when required for local/demo testing.

---

# Implementation Order

Follow this order to avoid breaking existing pages.

## Phase 1 — Shared UI foundation

1. Create `DashboardKpiCard`.
2. Create `DashboardFilterBar`.
3. Create `DrilldownDrawer`.
4. Create `ActionSummaryWidget`.
5. Create or standardize `ExportMenu`.

## Phase 2 — Action Center separation

1. Create `ActionCenterPage.tsx`.
2. Add `ACTION_CENTER` module if using a separate module.
3. Update permissions/navigation.
4. Move full `ApprovalInbox` behavior into the Action Center.
5. Replace large dashboard queue usage with `ActionSummaryWidget`.

## Phase 3 — Dashboard upgrades

1. Upgrade Accounting dashboard tab in `AccountingModulePage.tsx`.
2. Upgrade `HRDashboardPage.tsx`.
3. Add drill-through drawers and export actions.
4. Validate role-specific data visibility.

## Phase 4 — Guardian Portal self-service

1. Add student selector.
2. Add tabs.
3. Add notice acknowledgement.
4. Add downloads/print views.
5. Add request workflow.
6. Add request status timeline.

## Phase 5 — Reports and admin cleanup

1. Upgrade `FinancialStatementsPage.tsx`.
2. Add Taxes maintenance only if required.
3. Add Benefits maintenance only if required.
4. Expose or remove `AuditLogPage.tsx` and `DelegationManagementPage.tsx`.

---

# Testing Checklist

## Functional tests

- Filters update KPI/chart/table data.
- Reset filters restores defaults.
- KPI click opens the correct drawer or navigates to the correct workflow.
- Export uses the active filter set.
- Guardian acknowledgement updates the notice state.
- Guardian request submission validates required fields.
- Approval actions still work after moving to Action Center.
- Admin pages are reachable only by allowed roles.

## Role tests

Test at least these roles:

- Super Admin
- Admin
- Registrar
- Accounting
- HR
- Payroll
- Guardian
- Student

Confirm:

- Guardian cannot view non-linked students.
- Student cannot access Guardian Portal.
- Accounting cannot access HR dashboard workflows.
- HR cannot access accounting-only approval actions.
- Super Admin can access admin/security pages.

## UI/UX tests

- Mobile layout works at small widths.
- Table overflow is handled.
- Drawers and modals close properly.
- Keyboard focus is trapped inside modals.
- Buttons have visible hover/focus states.
- Loading and empty states are present.
- Error states show helpful messages.

## Regression tests

- Existing Registrar workflows still work.
- Existing Accounting tabs still work.
- Existing HR subpages still work.
- Existing Payroll workflows still work.
- Existing reports still render.
- Navigation still respects role permissions.

---

# Updated Original Audit Tables

## Global Shell

| Area | Status | Target interaction approach | Notes |
| --- | --- | --- | --- |
| Sidebar and mobile drawer | Interactive | Keep module navigation, expandable groups, child subpage navigation, mobile drawer close/open. | Ensure new Action Center/Admin subpages are visible only to allowed roles. |
| Role switcher | Interactive | Keep sandbox role switching behavior. | Demo-only behavior should not be confused with production auth. |
| Global search | Interactive | Keep `Ctrl+K` / `Meta+K` behavior. | Include new Action Center/Admin pages in search if global search supports page results. |
| Notification bell | Interactive | Keep notification UI and urgent announcement banner. | Notice acknowledgements should not break announcement display. |
| Breadcrumbs | Partial | Upgrade where possible to support clickable parent breadcrumb/subpage context. | Especially helpful after adding Action Center and admin subpages. |

## Top-Level Priority Pages

| Page | Source | Current status | Target status | Implementation instruction |
| --- | --- | --- | --- | --- |
| Dashboard | `src/features/dashboard/pages/DashboardPage.tsx` | Interactive | Interactive summary dashboard | Keep dashboard focused on summary, shortcuts, and alerts. Do not mount full approval queues as primary content. |
| Approval / Action Center | New recommended: `src/features/action-center/pages/ActionCenterPage.tsx` | Not currently separate | Dedicated workflow center | Create a proper Action Center or equivalent location for full `ApprovalInbox` workflows. |
| Guardian Portal | `src/features/guardian/pages/GuardianPortalPage.tsx` | Read-only | Interactive parent self-service | Implement WP-01. |
| Accounting Dashboard tab | `src/features/accounting/pages/AccountingModulePage.tsx` | Partial | Interactive financial command center | Implement WP-02. |
| HR Dashboard | `src/features/hr/pages/sub-pages/HRDashboardPage.tsx` | Partial | Interactive workforce command center | Implement WP-03. |
| Financial Statements | `src/features/accounting/pages/sub-pages/FinancialStatementsPage.tsx` | Partial | Interactive report explorer | Implement WP-05. |
| Taxes | `src/features/hr/pages/sub-pages/TaxesPage.tsx` | Interactive but maintenance-light | Optional full maintenance workflow | Implement WP-06 only if tax table maintenance is required in-app. |
| Benefits | `src/features/hr/pages/sub-pages/BenefitsPage.tsx` | Interactive but maintenance-light | Optional full maintenance workflow | Implement WP-07 only if benefits maintenance is required in-app. |
| Audit Log | `src/features/admin/pages/AuditLogPage.tsx` | Hidden/unwired | Exposed admin page or removed | Implement WP-08. |
| Delegation Management | `src/features/admin/pages/DelegationManagementPage.tsx` | Hidden/unwired | Exposed admin page or removed | Implement WP-08. |

---

# Developer Prompt for Codex / Claude

Use this prompt when asking an AI coding assistant to implement the changes.

```text
You are working on the STSN Connect React/TypeScript project.

Goal:
Upgrade the partial/read-only interactive pages based on PAGE_INTERACTIVITY_AUDIT_UPDATED.md. Implement the best UX pattern without breaking existing role permissions, navigation, or module workflows.

Important codebase facts:
- Accounting dashboard is currently the `dashboard` tab inside `src/features/accounting/pages/AccountingModulePage.tsx`. Do not assume `AccountingDashboardPage.tsx` exists unless you intentionally create it.
- `ApprovalInbox` currently exists at `src/components/common/ApprovalInbox.tsx` and is mounted in `src/App.tsx` in dashboard-related areas. Replace large dashboard queue usage with a compact summary widget and move the full queue to a dedicated Action Center page if needed.
- Navigation and permissions are controlled by `src/config/navigation.config.ts` and `src/config/permissions.config.ts`.
- Preserve existing STSN design tokens/classes: stsn-brown, stsn-brown-dark, stsn-gold, stsn-cream, stsn-beige, font-display, font-sans, font-mono.

Implementation priorities:
1. Create reusable components: DashboardKpiCard, DashboardFilterBar, DrilldownDrawer, ActionSummaryWidget, ExportMenu if not already present.
2. Create a proper Action Center page for the full ApprovalInbox flow or equivalent dedicated workflow location.
3. Replace full approval queues on dashboards with compact action summaries.
4. Upgrade GuardianPortalPage with linked student selector, tabs, notice acknowledgement, download/print actions, and guardian request workflow.
5. Upgrade AccountingModulePage dashboard tab with filters, clickable KPI cards, drill-through drawer, export, and attention required summary.
6. Upgrade HRDashboardPage with filters, clickable KPI cards, drill-through drawer, export, and HR action summary.
7. Upgrade FinancialStatementsPage with filters, row drill-through, export, print, and comparison options.
8. Expose or remove AuditLogPage and DelegationManagementPage. Prefer exposing them under User Access & Authority for Super Admin/Admin only if they are production-ready.

Rules:
- Do not create fake backend persistence if a table/schema already exists. Search the existing schema/types/store first.
- If a new persistent workflow is required and no table exists, create a Supabase migration under `supabase/migrations`.
- Keep role-based access strict. Guardian must only see linked students.
- Keep the UI responsive and consistent with the current design system.
- Add loading, empty, error, validation, success, and confirmation states where applicable.
- Avoid rewriting unrelated modules.

Deliverables:
- Updated React/TypeScript components.
- Updated navigation/permissions only where required.
- New Supabase migration files only if persistent workflow data is missing.
- Clear test notes covering roles, filters, drill-throughs, exports, approvals, and guardian request workflows.
```

---

# Final Recommendation

The project already has many interactive modules, so the next best step is not to redesign everything. Focus on the few high-impact improvements:

1. Make Guardian Portal truly useful for parents.
2. Turn Accounting and HR dashboards into command centers with filters and drill-throughs.
3. Move full approval queues into a dedicated Action Center.
4. Add strong report exploration/export behavior.
5. Clean up hidden admin pages.

This approach keeps the project clean, role-aware, and scalable while improving the actual daily workflow for each user type.

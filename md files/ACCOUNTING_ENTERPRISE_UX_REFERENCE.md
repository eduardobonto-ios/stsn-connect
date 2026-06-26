# STSN Connect — Accounting Module Enterprise UI/UX Reference

**Module:** Treasury & Accounting Office  
**Project:** Theresian Connect / STSN Connect Academia Enterprise V2  
**Stack confirmed from ZIP:** React 19 + Vite + TypeScript + Zustand + Tailwind CSS + lucide-react  
**Current source location:** `src/features/accounting/pages/AccountingModulePage.tsx`  
**Purpose of this document:** Reference guide and Claude-ready implementation plan for improving the Accounting module into a more enterprise-grade school ERP workflow.

---

## 1. Executive Assessment

The current Accounting module is already strong for a prototype and visually aligned with the rest of STSN Connect. It has a professional brown/gold institutional theme, clean cards, clear tabs, and a role-focused Accounting experience.

**Current UI/UX readiness:** approximately **78–82% enterprise-ready**.

It should not be redesigned from scratch. The better direction is to preserve the current visual system and improve the depth of accounting workflows.

### Current Strengths

- The **Accounting Dashboard** has clear financial KPIs.
- The **Student Ledger** uses a practical left-list plus right-detail layout.
- The **Discount Management** section is well structured with setup, request review, government discounts, and sibling/owner discount grouping.
- The **approval workflow** already feels enterprise-like because it includes Level 1 / Level 2 review cards, attachments, statuses, and audit trail actions.
- The visual style is consistent with the Registrar and school ERP theme.

### Main Gap

The module currently feels like:

```text
Dashboard + Student Ledger + Discount Workflow
```

For an enterprise school management system, it should eventually feel like:

```text
Treasury + Billing + Collections + Ledger + Discounts + Holds + Reports + Reconciliation
```

---

## 2. Files Verified from the ZIP

The uploaded ZIP confirms this is not a Next.js project. It is a React/Vite prototype.

Relevant files inspected or referenced:

```text
src/App.tsx
src/main.tsx
src/index.css
src/types/index.ts
src/services/store.ts
src/mock-data/index.ts
src/config/navigation.config.ts
src/components/LoginOverlay.tsx
src/components/ModalPreviews.tsx
src/components/common/PageHeader.tsx
src/components/common/StatCard.tsx
src/features/accounting/pages/AccountingModulePage.tsx
src/features/accounts/pages/AccountsManagementPage.tsx
src/features/dashboard/pages/DashboardPage.tsx
src/features/registrar/pages/RegistrarModulePage.tsx
src/features/student-portal/pages/StudentPortalPage.tsx
src/features/curriculum/pages/CurriculumManagementPage.tsx
src/features/scheduling/pages/SchedulingModulePage.tsx
src/features/class-sectioning/pages/ClassSectioningModulePage.tsx
src/features/core-setup/pages/CoreSetupModulePage.tsx
```

Important folders to ignore when asking Claude to work on the project:

```text
node_modules/
dist/
.git/
__MACOSX/
Desktop/
duplicated nested project folders
generated build output
```

---

## 3. Current Accounting Module Structure

Current Accounting module file:

```text
src/features/accounting/pages/AccountingModulePage.tsx
```

Current major internal tabs:

```ts
type AccountingTab = "dashboard" | "ledger" | "discounts";
type DiscountsSubTab = "types" | "requests" | "government" | "sibling";
```

Current visible tabs:

```text
Accounting Dashboard
Student Ledger
Discount Management
```

Current Discount Management sub-tabs:

```text
Discount Types
All Requests
Government Discounts
Sibling / Owner
```

Current store data used by Accounting:

```text
students
assessments
payments
discountTypes
discountRequests
currentUser
```

Current store actions used by Accounting:

```text
addPayment
addAssessment
updateAssessment
addDiscountType
updateDiscountType
deleteDiscountType
toggleDiscountTypeActive
addDiscountRequest
approveDiscountRequest
rejectDiscountRequest
```

---

## 4. Current Accounting Dashboard Review

### Existing KPI Cards

The current dashboard already includes:

```text
Total Assessed
Total Collections
Outstanding Balances
Total Discounts Given
Accounts with Balance
Cleared Accounts
```

These are good and should be preserved.

### Recommended Additional KPI Cards

To make the dashboard more action-oriented, add or prepare cards for:

```text
Today’s Collection
Pending Payment Posting
Pending Discount Requests
Students on Financial Hold
Promissory Notes
Unposted / For Verification Payments
Void / Adjustment Requests
```

### Enterprise UX Goal

The Accounting dashboard should answer:

> What requires Accounting action today?

Not only:

> How much was assessed or collected?

---

## 5. Current Student Ledger Review

The existing ledger layout is good:

```text
Left side: searchable student list
Right side: selected student ledger details
Filters: school year, semester, transaction type
Actions: export PDF, export Excel
Ledger table: debit, credit, balance, type
Receipt preview support
```

### Recommended Student Ledger Improvements

The selected student header should show a stronger accounting summary:

```text
Student Name
Student Number
School Year
Academic Unit
Grade Level / Program
Section / Year Level
Total Assessment
Total Paid
Discount Applied
Current Balance
Financial Hold Status
Last Payment Date
Clearance Status
```

Recommended actions:

```text
Add Payment
Add Adjustment
Generate Statement of Account
Print Ledger
Issue / View Receipt
Apply Discount
Set Financial Hold
Clear Financial Hold
```

### Empty State Improvement

When no ledger transactions exist, show a helpful empty state:

```text
No transactions found for the selected filters.
Try changing the school year, semester, or transaction type.
```

---

## 6. Current Discount Management Review

The Discount Management UI is one of the strongest parts of the Accounting module.

### Existing Strengths

- Discount type maintenance exists.
- Discount request creation exists.
- Level 1 and Level 2 approval statuses exist.
- Attachments are shown.
- Audit trail is available.
- Government and sibling/owner discounts are separated.

### Recommended Discount Type Fields

Add or prepare these fields for enterprise policy control:

```text
Effective School Year
Academic Unit Applicability: Basic Ed / College / Both
Applies To: Tuition / Miscellaneous / Laboratory / Total Assessment
Discount Basis: Percentage / Fixed Amount
Stackable: Yes / No
Requires Document: Yes / No
Requires Approval: Auto / Required
Approval Levels Required
Maximum Amount
Maximum Beneficiaries
GL / Accounting Code placeholder
Active / Inactive
```

### Recommended Request Statuses

Current statuses are good but should eventually support:

```text
Pending L1 Review
Pending L2 Review
For Review
Approved
Rejected
Returned for Documents
Cancelled
Expired
```

### Recommended Discount Request Detail

Each request card should eventually show:

```text
Reference Number
Student Name
Student Number
Discount Type
Discount Percentage / Amount
Requested By
Requested Date
Supporting Documents
L1 Reviewer
L2 Reviewer
Decision Remarks
Audit Trail
```

---

## 7. Missing Enterprise Accounting Workflows

The current module should eventually expand beyond three tabs.

Recommended final Accounting module sections:

```text
Accounting Dashboard
Student Ledger
Assessment & Billing
Payments & Collections
Discounts & Scholarships
Financial Holds
Promissory Notes
Receipts & Adjustments
Reports & Reconciliation
Accounting Setup
```

For the current prototype, do not build everything at once. Add the structure gradually.

---

## 8. Assessment & Billing Recommendation

A real school ERP needs a dedicated Assessment & Billing workflow.

### Why This Should Be Separate

Assessment is not the same as ledger viewing. Accounting users need to generate, review, approve, and update assessments before payments are collected.

### Recommended Fields

```text
Student
School Year
Academic Unit
Grade Level / Program
Section / Year Level
Semester / Term
Fee Template
Tuition Fees
Miscellaneous Fees
Laboratory Fees
Other Fees
Discounts Applied
Payment Plan
Total Assessment
Amount Due
Balance
Assessment Status
```

### Recommended Actions

```text
Generate Assessment
Recompute Assessment
Apply Discount
Approve Assessment
Print Assessment
Generate Statement of Account
Void / Reverse Assessment
```

---

## 9. Payments & Collections Recommendation

A dedicated Payments & Collections page should eventually be added.

### Recommended Fields

```text
Student
Amount Paid
Payment Method
Reference Number
Official Receipt Number
Payment Date
Cashier / Posted By
Term / Installment
Remarks
Attachment / Proof of Payment
Verification Status
```

### Recommended Actions

```text
Post Payment
Verify Online Payment
Print Receipt
Reprint Receipt
Void Payment
Request Adjustment
Export Collection Report
```

### Payment Method Examples

```text
Cash
Bank Transfer
GCash
Credit Card
Check
Online Payment Gateway
```

---

## 10. Financial Holds Recommendation

Financial Holds should be a dedicated accounting workflow because it affects Registrar operations.

### Examples of Holds

```text
Enrollment blocked due to unpaid balance
COR generation blocked
Exam permit blocked
Transcript request blocked
Graduation clearance blocked
Transfer credentials blocked
```

### Recommended Fields

```text
Student
Hold Type
Reason
Balance Amount
Created By
Created Date
Status
Cleared By
Cleared Date
Clearance Remarks
```

### Recommended Actions

```text
Place Financial Hold
Clear Financial Hold
View Hold History
Notify Registrar
Notify Student / Parent
```

### Important System Rule

Financial Holds are different from User Access & Authority.

- **Financial Holds** = student clearance / enrollment restrictions.
- **User Access & Authority** = login accounts, roles, and permissions.

---

## 11. Basic Ed vs College Accounting Behavior

Accounting behavior should follow the same architecture rule used for Registrar:

```text
Role determines permissions.
School context / academic unit determines labels, fields, and workflow behavior.
```

Do not use role alone to decide Basic Ed vs College behavior.

### Basic Education / STSN Accounting Labels

Use:

```text
Grade Level
Section
Adviser
Learner / Student Number
Full Year / Quarterly / Monthly Plan
Tuition Package
Miscellaneous Fees
Sibling Discount
Family Discount
DepEd-related document references when needed
```

### College / CDSTA Accounting Labels

Use:

```text
Program
Course
Year Level
Semester
Curriculum
Units
Subject Load
Laboratory Fees
CHED / tertiary terminology when needed
Prelim / Midterm / Final payment terms when applicable
```

### Recommended Accounting Context Config

Create or reuse a centralized school context config:

```ts
export type AcademicUnit = "basic-ed" | "college";

export interface SchoolContextConfig {
  id: SchoolId;
  name: string;
  shortName: string;
  academicUnit: AcademicUnit;
  departmentLabel: "Basic Education" | "College";
  accountingLabels: {
    levelLabel: string;
    programLabel: string;
    termLabel: string;
    billingBasisLabel: string;
  };
}
```

Example:

```ts
STSN: {
  academicUnit: "basic-ed",
  departmentLabel: "Basic Education",
  accountingLabels: {
    levelLabel: "Grade Level",
    programLabel: "Track / Strand",
    termLabel: "School Year",
    billingBasisLabel: "Tuition Package"
  }
}

CDSTA: {
  academicUnit: "college",
  departmentLabel: "College",
  accountingLabels: {
    levelLabel: "Year Level",
    programLabel: "Program / Course",
    termLabel: "Semester",
    billingBasisLabel: "Units / Subject Load"
  }
}
```

---

## 12. Recommended Navigation Label Improvements

Current Accounting label is acceptable:

```text
Accounting
Ledger, discounts & reports
```

For enterprise clarity, consider:

```text
Treasury & Accounting
Ledger, billing & collections
```

or keep current sidebar label simple:

```text
Accounting
Ledger, discounts & reports
```

Inside the Accounting module, use more complete tab labels:

```text
Dashboard
Student Ledger
Assessment & Billing
Payments & Collections
Discounts & Scholarships
Financial Holds
Reports
Setup
```

For prototype safety, Phase 1 can keep only the current three main tabs and add the missing workflows as cards or disabled/placeholder tabs.

---

## 13. Recommended Implementation Phases

### Phase 1 — Accounting UX Plan Only

Create:

```text
ACCOUNTING_ENTERPRISE_UX_PLAN.md
```

Do not edit app code yet.

### Phase 2 — Foundation / Types / Config

Implement only:

```text
src/config/schools.config.ts
src/config/accounting.config.ts
src/types/index.ts updates if needed
```

Do not refactor the full Accounting page yet.

### Phase 3 — Dashboard + Ledger Improvements

Update only:

```text
src/features/accounting/pages/AccountingModulePage.tsx
```

Focus on:

```text
Action-oriented KPI cards
Student selected summary
Financial hold placeholder
SOA / receipt / adjustment action buttons
Basic Ed vs College labels
```

### Phase 4 — Discount Management Improvements

Update only the Discount Management area.

Focus on:

```text
Academic unit applicability
Effective school year
Requires document
Stackable
Approval level
Returned for Documents status placeholder
Improved audit trail consistency
```

### Phase 5 — Add Missing Workflow Tabs Gradually

Add placeholder or lightweight tabs for:

```text
Assessment & Billing
Payments & Collections
Financial Holds
Reports & Reconciliation
```

Do not overbuild until backend/data model is ready.

---

## 14. Claude-Ready Prompt — Phase 1 Only

Use this when credits are limited and you want Claude to inspect first.

```text
You are a Principal React Frontend Architect and Enterprise School ERP UX Engineer.

Project stack:
- React 19
- Vite
- TypeScript
- Zustand
- Tailwind CSS
- lucide-react
- Mock-data driven prototype

Important:
Work only in the real project source folder:

src/

Do NOT edit:
- node_modules/
- dist/
- .git/
- __MACOSX/
- Desktop/
- duplicated nested project folders
- generated build output

Relevant Accounting files:

src/features/accounting/pages/AccountingModulePage.tsx
src/types/index.ts
src/services/store.ts
src/mock-data/index.ts
src/config/navigation.config.ts
src/App.tsx
src/components/ModalPreviews.tsx
src/components/common/PageHeader.tsx
src/components/common/StatCard.tsx

Current Accounting module has:
- Accounting Dashboard
- Student Ledger
- Discount Management

Current Discount Management sub-tabs:
- Discount Types
- All Requests
- Government Discounts
- Sibling / Owner

Task:
Inspect the Accounting module only.
Do not modify application code yet.

Goal:
Create an enterprise UX implementation plan for improving the Accounting module while preserving the current brown/gold institutional theme, current activeModule rendering, current React/Vite/Zustand architecture, and current mock-data prototype approach.

Important architecture rule:
Role determines permissions.
School context / academic unit determines accounting labels, fields, and workflow behavior.

Basic Education / STSN should use:
- Grade Level
- Section
- Adviser
- Full Year / Quarterly / Monthly plan terminology
- Tuition package / miscellaneous fee terminology

College / CDSTA should use:
- Program / Course
- Year Level
- Semester
- Units / Subject Load
- Tuition per unit / laboratory fee terminology

Required output:
Create a markdown file:

ACCOUNTING_ENTERPRISE_UX_PLAN.md

Include:
1. Current Accounting architecture assessment
2. Current dashboard assessment
3. Current student ledger assessment
4. Current discount management assessment
5. Missing enterprise accounting workflows
6. Recommended Accounting module tabs
7. Recommended Basic Ed vs College behavior
8. Recommended data/type additions
9. Recommended store/mock-data additions
10. Recommended implementation phases
11. Risks and constraints
12. Manual test checklist

Stop after creating the plan.
Do not edit application code.
Do not run a full refactor.
```

---

## 15. Claude-Ready Prompt — Phase 2 Foundation

```text
Using ACCOUNTING_ENTERPRISE_UX_PLAN.md, implement only the Accounting foundation changes.

Scope:
1. Add or update centralized accounting config.
2. Add or reuse school context helpers if already created.
3. Add accounting label config for Basic Ed vs College.
4. Add lightweight types only if required.
5. Do not refactor the full Accounting UI yet.
6. Do not add backend calls.
7. Do not add libraries.
8. Preserve current module IDs and activeModule rendering.

Preferred files:
- src/config/accounting.config.ts
- src/config/schools.config.ts if not yet existing
- src/types/index.ts only if needed

Run:

npm run build

Fix TypeScript errors.

Final summary must include:
1. Files changed
2. Config added
3. Type changes
4. Basic Ed vs College accounting labels added
5. Build result
```

---

## 16. Claude-Ready Prompt — Phase 3 Dashboard + Ledger

```text
Using ACCOUNTING_ENTERPRISE_UX_PLAN.md and the foundation config already created, update only:

src/features/accounting/pages/AccountingModulePage.tsx

Focus only on:
1. Accounting Dashboard improvements
2. Student Ledger improvements

Preserve:
- Current visual theme
- Current tab structure if safer
- Current mock-data approach
- Current Zustand store usage
- Current receipt preview modal behavior

Dashboard improvements:
- Keep existing KPI cards
- Add or prepare cards for Today’s Collection, Pending Discount Requests, Students on Financial Hold, Promissory Notes, and Unposted Payments if data is available or mockable
- Keep the layout clean and not overcrowded

Student Ledger improvements:
- Improve selected student summary
- Show Total Assessed, Discount Applied, Total Paid, Balance, Clearance/Hold status
- Add action buttons: Add Payment, Add Adjustment, Generate SOA, Print Ledger, Issue/View Receipt, Apply Discount, Set/Clear Hold
- Use Basic Ed labels for STSN and College labels for CDSTA based on active school context, not role alone

Do not implement full backend logic.
Use mock data only.
Do not add dependencies.

Run:

npm run build

Fix TypeScript errors.

Final summary must include:
1. Files changed
2. Dashboard improvements
3. Ledger improvements
4. Basic Ed vs College behavior
5. Build result
6. Manual test checklist
```

---

## 17. Claude-Ready Prompt — Phase 4 Discount Management

```text
Using ACCOUNTING_ENTERPRISE_UX_PLAN.md and existing Accounting module code, update only the Discount Management section in:

src/features/accounting/pages/AccountingModulePage.tsx

Focus on:
1. Discount type policy clarity
2. Discount request review clarity
3. Audit trail consistency
4. Basic Ed vs College applicability labels

Enhance or prepare UI fields for:
- Effective School Year
- Applies To: Basic Ed / College / Both
- Requires Document
- Stackable
- Approval Level Required
- Discount Basis: Percentage / Fixed Amount
- Maximum Amount if appropriate

Do not overbuild.
Do not add backend calls.
Do not add libraries.
Keep the current approval modal and audit modal behavior.

Run:

npm run build

Fix TypeScript errors.

Final summary must include:
1. Files changed
2. Discount type improvements
3. Discount request improvements
4. Approval/audit improvements
5. Build result
6. Manual test checklist
```

---

## 18. Claude-Ready Prompt — Phase 5 Missing Workflow Tabs

```text
Using ACCOUNTING_ENTERPRISE_UX_PLAN.md, add lightweight prototype tabs or sections for missing enterprise Accounting workflows.

Update only:

src/features/accounting/pages/AccountingModulePage.tsx

Add lightweight tabs or placeholder cards for:
- Assessment & Billing
- Payments & Collections
- Financial Holds
- Reports & Reconciliation

Important:
Do not fully implement all workflows yet.
Use enterprise-ready empty states, mock cards, and action placeholders.
Keep the UI clean.
Preserve current dashboard, ledger, and discount workflows.
Do not add backend calls.
Do not add libraries.

Run:

npm run build

Fix TypeScript errors.

Final summary must include:
1. Files changed
2. New workflow tabs/sections added
3. What is implemented vs placeholder
4. Build result
5. Manual test checklist
```

---

## 19. Manual Test Checklist

### Accounting Role

```text
Login as ACCOUNTING user
Confirm Accounting module opens correctly
Confirm sidebar shows Accounting and Core Setup only if current permissions remain unchanged
Confirm dashboard KPI cards render correctly
Confirm collection by method renders
Confirm student receivables render
Confirm recent accounting activity renders
```

### Student Ledger

```text
Search for a student
Select a student from the left list
Confirm selected student summary renders
Confirm assessment summary renders
Change school year filter
Change semester filter
Change transaction type filter
Confirm ledger rows update
Open receipt preview if payment receipts exist
Confirm export buttons are visible
```

### Discount Management

```text
Open Discount Types
Search discount type
Filter by source
Add discount type
Edit discount type
Toggle active/inactive
Open All Requests
Filter by status
Open Government Discounts
Open Sibling / Owner
Approve Level 1 request
Approve Level 2 request
Reject request
Open Audit Trail
Confirm attachment chips render
```

### Basic Ed Context

```text
Set active school to STSN
Confirm Basic Ed labels appear where applicable
Confirm Grade Level / Section terminology appears
Confirm Full Year / Quarterly / Monthly billing terminology is used where applicable
```

### College Context

```text
Set active school to CDSTA
Confirm College labels appear where applicable
Confirm Program / Course / Year Level / Semester terminology appears
Confirm Units / Subject Load billing terminology is used where applicable
```

### Build

```text
npm run build
Confirm no TypeScript errors
Confirm no blank page
Confirm modals still open and close
```

---

## 20. Final Recommendation

Keep the current Accounting visual design. It already looks professional and consistent with the enterprise school ERP direction.

The next improvement should be workflow depth, not visual redesign.

Priority order:

```text
1. Strengthen Student Ledger selected-student summary
2. Add Assessment & Billing workflow
3. Add Payments & Collections workflow
4. Add Financial Holds workflow
5. Expand Discount Management policy fields
6. Add reports/reconciliation placeholders
7. Apply Basic Ed vs College accounting labels through centralized config
```

This approach is safer, more enterprise-aligned, and should consume fewer Claude credits than a full redesign.

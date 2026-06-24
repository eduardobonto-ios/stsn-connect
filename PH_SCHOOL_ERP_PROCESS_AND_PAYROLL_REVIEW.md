# STSN Connect Payroll and School ERP Process Review

Date reviewed: 2026-06-25  
Scope: Payroll Management, Salary Payouts, Taxes, Benefits, Enrollment, Registrar, Principal, Faculty, Sectioning, Scheduling, Cashiering, Accounting, and role workflows.

## Executive Summary

The Payroll sidebar pages are not missing. The blank white content is caused by routing/render wiring: `PAYROLL_MANAGEMENT` exists in permissions and navigation, but `App.tsx` does not render anything when `activeModule === "PAYROLL_MANAGEMENT"`. The four child pages also reuse payroll/HR sub-page components, but the sidebar currently routes payroll children through the Accounting sub-page state unless the parent module is exactly `HR_MANAGEMENT`.

The broader school process foundation is already present: student records, online enrollment bridge, Registrar review, document requirements, assessments, Accounting approval, Cashier collection, class sectioning, scheduling, grade encoding, faculty portal, reports, and academic-unit scoping. However, the process is not yet fully "standard school operations ready" because some workflow gates are partial, some approvals are implicit, and some role responsibilities are not fully separated.

Recommended approach: fix the Payroll render wiring first, then standardize each business process around auditable workflow states, role-based approvals, school-year/term scoping, and Philippine statutory/reference tables that can be updated without code changes.

## 1. Payroll Blank Screen Findings

### Confirmed Cause

`PAYROLL_MANAGEMENT` is defined as a module:

- `src/config/permissions.config.ts` includes `PAYROLL_MANAGEMENT`.
- `src/config/navigation.config.ts` adds the Payroll sidebar group with:
  - Payroll Management
  - Salary Payouts
  - Taxes
  - Benefits

But `src/App.tsx` has render branches for `ACCOUNTING`, `HR_MANAGEMENT`, `CASHIER`, etc., and no branch for `PAYROLL_MANAGEMENT`. When the user clicks the Payroll group, the app sets `activeModule` to `PAYROLL_MANAGEMENT`, then the main content area renders no page.

There is a second routing issue: nested child navigation only treats `HR_MANAGEMENT` as HR. For `PAYROLL_MANAGEMENT`, child clicks fall into the `else` path and update `accountingSubPage` instead of an HR/payroll sub-page state. So the selected payroll child changes sidebar state, but no payroll component receives it.

### Why All Four Pages Look White

All four pages are under the same parent module:

- `payroll-management`
- `salary-payouts`
- `taxes`
- `benefits`

Since the parent module itself is not rendered, none of the four sub-pages can appear.

### Recommended Fix, No Behavior Redesign

Create a dedicated payroll rendering path in `App.tsx`:

- Add `const [payrollSubPage, setPayrollSubPage] = useState("payroll-management");`
- In sidebar nested-child click handling, treat both `HR_MANAGEMENT` and `PAYROLL_MANAGEMENT` as HR/payroll-style nested modules, but keep their states separate.
- Add a main render branch:
  - `activeModule === "PAYROLL_MANAGEMENT" && allowedModules.includes("PAYROLL_MANAGEMENT")`
  - Render a small `PayrollModulePage` or reuse the existing HR payroll sub-pages.

Best long-term structure:

```text
src/features/payroll/pages/PayrollModulePage.tsx
src/features/payroll/pages/sub-pages/PayrollManagementPage.tsx
src/features/payroll/pages/sub-pages/SalaryPayoutsPage.tsx
src/features/payroll/pages/sub-pages/TaxesPage.tsx
src/features/payroll/pages/sub-pages/BenefitsPage.tsx
```

This avoids making Payroll depend on the HR module shell forever.

### Verification Performed

`npm.cmd run lint` passed with `tsc --noEmit`.

`npm.cmd run build` could not be completed inside the sandbox because Vite/esbuild hit an access-denied error while loading `vite.config.ts`. I requested escalation to rerun the build outside the sandbox, but it was not approved, so production build verification remains pending.

## 2. Payroll Module Maturity Review

### Current State

Payroll Management currently has a useful staff/payroll UI, employee import, payslip preview, and legacy `processGlobalPayroll()` flow. The store also already contains newer payroll primitives:

- payroll periods
- payroll runs
- payroll lines
- salary payout batches
- salary payout lines
- benefit plans
- tax tables and tax brackets

Salary Payouts, Taxes, and Benefits pages exist and are wired to these newer structures.

### Main Gaps

Payroll is split between legacy flat payroll rows and newer payroll run structures. The UI still leans heavily on the old global payroll flow, while payout/tax/benefit pages expect the newer model.

Philippine payroll standards should not be hardcoded inside page components. SSS, PhilHealth, Pag-IBIG, withholding tax, loan deductions, allowances, taxable/non-taxable benefits, 13th month, and final pay should come from effective-dated configuration tables.

The Benefits page contains static reference text. These rates should be treated as placeholders until validated against current official schedules.

### Recommended Payroll Process

Use this standard flow:

1. HR maintains employee masterfile, employment status, compensation profile, bank/payment details, tax profile, benefit enrollments, and school assignment.
2. HR or Payroll opens a payroll period for a school and pay frequency.
3. Timekeeping locks attendance, approved leaves, absences, tardiness, overtime, undertime, and leave without pay.
4. Payroll generates a payroll run from locked timekeeping, salary profile, benefits, statutory deductions, loans, tax rules, and adjustments.
5. Payroll reviews exception rows such as missing salary, no tax profile, negative net pay, incomplete attendance, or duplicate period.
6. Payroll marks the run as computed.
7. Authorized approver approves the payroll run.
8. System creates a payout batch only from approved payroll lines.
9. Cash/Bank release is recorded with release method, reference number, released by, released at, and audit trail.
10. Payslips become available only after approved or released status, depending on school policy.
11. Payroll period is locked to prevent accidental edits.

## 3. Enrollment and Registrar Process Review

### Already Present

The current system already has a strong enrollment foundation:

- Online enrollment bridge migration exists.
- Online applications can create or link student records.
- LRN lookup exists for continuing students.
- Registrar module can view student directory and enrollment source.
- Requirements are generated per student.
- Enrollment approval is blocked when requirements are still pending.
- Registrar can assign section during approval.
- Assessment records are generated.
- Accounting can approve, return, or reject assessments.
- Cashier only collects from approved assessments.
- Sectioning and scheduling modules exist.
- Grade encoding and grade directory exist.

### Important Gaps

Registrar approval currently depends on a specific enrollment id pattern in one path: `approveEnrollment("enr-" + selectedStudent.id, ...)`. That may fail if the real enrollment id is a UUID or a generated id from Supabase.

Student assessment lookup often uses the first assessment found for a student. A production school ERP should always scope assessment by school year, term/semester, enrollment id, and school.

Online application review statuses exist, but the Registrar UI should have a dedicated queue for:

- Pending Registrar Review
- For Completion
- Accepted
- Rejected
- Cancelled

The Registrar should be able to accept an online application, request completion, merge with an existing LRN record, or create a new student record with an audit trail.

## 4. Recommended Philippine School Enrollment Standard

Use this as the target process:

1. Applicant submits online form or Registrar encodes walk-in application.
2. System assigns reference number and classifies the application as new, continuing, old student, transferee, or returnee.
3. Registrar validates identity, LRN, PSA/birth details, previous school, grade/year level, strand/program, and required documents.
4. Registrar marks application as For Completion if documents or mandatory data are missing.
5. Registrar accepts the application for assessment only after minimum identity and academic placement checks pass.
6. Registrar confirms academic placement:
   - Basic Education: grade level, strand/track if SHS, section candidate.
   - College: course/program, year level, semester, regular/irregular status, subject load.
7. Accounting generates or reviews assessment from approved fee setup, book package, discounts, payment plan, and scholarship rules.
8. Accounting approves assessment for payment or returns it to Registrar.
9. Cashier collects payment only against approved assessment and issues OR/payment record.
10. Registrar finalizes enrollment after required documents and financial clearance are complete.
11. Sectioning assigns the student to an active section/block with capacity control.
12. Scheduling confirms subject schedules, rooms, teachers, and conflict checks.
13. Student portal shows COR/registration status, schedule, ledger, requirements, and enrollment status.

## 5. Role-by-Role Recommended Responsibilities

### Registrar

Owns student records and enrollment lifecycle.

Should be able to:

- Create and update student master records.
- Review online enrollment applications.
- Verify student documents.
- Approve or reject enrollment after requirements are complete.
- Assign or confirm section/block.
- Issue student records, enrollment reports, COR/registration forms.
- Manage transfer/returnee/old student workflows.

Should not be the final approver of fees after Accounting review.

### Principal / Academic Head

Owns academic oversight, not day-to-day cashiering or payroll.

Should be able to:

- View enrollment dashboards and reports.
- Review class/section distribution.
- Review faculty loading and schedules.
- Monitor grade completion and grade submission status.
- Approve academic exceptions such as overload, irregular load, grade correction, section override, or late enrollment when policy requires it.

Current permissions already give Principal access to dashboards, student directory, grading, curriculum, faculty admin, scheduling, and registrar reports. Recommended next step is explicit approval queues for academic exceptions.

### Faculty / Teacher

Owns class-level academic records.

Should be able to:

- View assigned teaching loads and schedules.
- View class lists for assigned sections/subjects.
- Encode grades only for assigned classes and open grading periods.
- Submit grades for review/finalization.
- View advisory class if assigned as adviser.
- Raise consultation or student concern records when needed.

Faculty should not edit Registrar master records, assessments, payments, or student section placement except through controlled requests.

### Cashier

Owns payment collection only.

Should be able to:

- See approved assessments awaiting payment.
- Accept payment, apply payment method, issue OR/reference number.
- View collection history.
- Generate daily collection reports.
- Void/reverse receipts only through controlled approval.

Cashier should not create tuition assessments or approve discounts.

### Accounting

Owns assessment, billing policy, ledgers, discounts, financial holds, and financial reports.

Should be able to:

- Maintain fee items and accounting setup.
- Review and approve assessments before Cashier collection.
- Approve, return, or reject discount/scholarship requests.
- Manage student ledgers and financial holds.
- Reconcile payments and receivables.
- Produce AR aging, income, balance sheet, cash flow, and audit reports.

Current Accounting has a good foundation, but approval queues should be consistently scoped by school year, school, and academic unit.

### HR / Payroll

Owns employee masterfile, timekeeping, leave, compensation, payroll, benefits, and tax setup.

Payroll-specific users should have access to payroll runs, salary payouts, taxes, and benefits, but not necessarily full HR records unless policy allows it.

## 6. Cross-Module Controls Needed

### Workflow Statuses

Every major record should have explicit statuses:

- Application: Draft, Submitted, For Completion, Accepted, Rejected, Cancelled
- Enrollment: Pending, For Assessment, Assessed, For Payment, Partially Paid, Enrolled, Rejected, Cancelled, Withdrawn
- Assessment: Draft, Submitted to Accounting, Returned to Registrar, Approved for Payment, Rejected, Superseded
- Payment: Posted, Voided, Reversed, Refunded
- Sectioning: Unassigned, Assigned, Waitlisted, Transferred
- Grades: Draft, Submitted, Reviewed, Finalized, Released, Locked
- Payroll Run: Draft, Computed, Reviewed, Approved, Released, Locked, Cancelled

### Audit Trail

Use audit trails for:

- Student masterfile changes
- Requirement verification
- Enrollment approval/rejection
- Assessment approval/return/rejection
- Payment posting/voiding
- Section assignment changes
- Grade submission/finalization/correction
- Payroll computation/approval/release

### School-Year and Term Scope

Production records should always be scoped by:

- school_id
- academic_unit
- school_year
- semester or term
- enrollment_id where applicable

Avoid "first record by student id" lookups for assessments, grades, sectioning, and payments.

## 7. Suggested Implementation Phases

### Phase 1: Restore Payroll Rendering

- Add a render branch for `PAYROLL_MANAGEMENT`.
- Add a dedicated `payrollSubPage` state.
- Route Payroll child clicks to `payrollSubPage`.
- Add a fallback empty state for unknown active modules to prevent future white screens.

### Phase 2: Payroll Workflow Alignment

- Move payroll pages into `src/features/payroll`.
- Make Payroll Management use payroll periods, runs, and lines instead of only legacy flat payroll rows.
- Prevent duplicate payroll per employee per period.
- Require approved payroll run before payout batch creation.

### Phase 3: Enrollment Hardening

- Replace generated enrollment id assumptions with actual latest enrollment id lookup.
- Add a Registrar online application review queue.
- Scope assessment and enrollment actions by school year, semester, and enrollment id.
- Add explicit "For Assessment" and "For Payment" statuses.

### Phase 4: Role Approval Queues

- Principal: academic exceptions and grade finalization oversight.
- Registrar: online application and enrollment completion queue.
- Accounting: assessment approval and discount approval queue.
- Cashier: approved payment queue and end-of-day collection report.
- Faculty: grade submission queue and advisory class monitoring.

### Phase 5: Philippine Statutory Payroll Configuration

- Create effective-dated tables for SSS, PhilHealth, Pag-IBIG, withholding tax, benefit rules, and deduction rules.
- Add admin screens for statutory table versioning.
- Do not hardcode contribution rates in React components.
- Keep source/effective-date fields so annual updates can be applied without code edits.

## Final Recommendation

The best path is not a large rewrite. The system already has many correct building blocks. First fix the Payroll route so the pages render. Then standardize workflows by making every cross-office handoff explicit, auditable, and scoped to the correct school year, term, school, and student enrollment record.

For a Philippine school setup, the strongest operating model is:

Registrar controls student identity and enrollment records.  
Accounting controls assessment and financial approval.  
Cashier controls payment collection and receipts.  
Principal controls academic oversight and exceptions.  
Faculty controls class records and grades for assigned loads.  
HR/Payroll controls employees, timekeeping, compensation, statutory deductions, payout, and payslips.

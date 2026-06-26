# Approval Levels and Workflows

Audit date: 2026-06-25

This documents the approval levels and workflow transitions currently implemented in the app. The source of truth for the queue is `ApprovalInbox`, pending counts are in `usePendingCounts`, and most workflow mutations are in `src/services/store.ts`.

## Approval Queue Routing

The Action Center aggregates pending work by role and school scope.

| Item | Queue code | Visible to | Pending condition | Opens module | Quick action |
| --- | --- | --- | --- | --- | --- |
| Assessment approval | `ASMT` | Accounting, Admin, Super Admin | `approvalStatus = Pending Accounting Approval` | Accounting > Billing | Approve / Return |
| Discount request | `DISC` | Accounting, Admin, Super Admin | `status = Pending` or `For Review` | Accounting > Discounts | View only in queue |
| Payment void request | `VOID` | Accounting, Admin, Super Admin | `status = Pending Void Approval` | Accounting | Approve Void / Reject Void |
| Enrollment | `ENR` | Registrar, Admin, Super Admin | `status = Pending` or `For Assessment` | Registrar | View only in queue |
| Online application | `APP` | Registrar, Admin, Super Admin | `status = Pending Registrar Review` | Registrar | View only in queue |
| Leave request | `LEAVE` | HR, Admin, Super Admin | `status = Submitted` or `For Approval` | HR > Leave Management | Approve / Reject |
| Payroll run | `PR` | Payroll, Admin, Super Admin | `status = For Review` | Payroll > Payroll Management | View only in queue |
| Grade period | `GRADE` | Principal, Admin, Super Admin | pending count uses `gradeApprovalStatus = Submitted`; queue lists non-finalized periods | Grading | View only in queue |

Queue items are sorted oldest first and show an overdue marker after 3 days.

## Approval Authority Levels

| Workflow | Levels | Approver role / authority | Notes |
| --- | --- | --- | --- |
| Discount Requests | 2 levels | Accounting/Admin/Super Admin in module UI | Level 1 approval moves request to `For Review`; Level 2 final approval moves to `Approved`. Any level rejection moves to `Rejected`. |
| Assessment Approval | 1 final approval gate | Super Admin, or Accounting user with no designation or `HEAD` designation | Accounting staff/officer users can view, but final approve/return/reject controls are disabled unless they meet authority. |
| Payment Void Request | 1 review gate | Accounting/Admin/Super Admin | Cashier initiates void request; Accounting decides. |
| Leave Request | 1 review gate | HR/Admin/Super Admin | HR can approve or reject submitted leave. |
| Grade Period Approval | 1 principal approval gate | Principal/Admin/Super Admin | Teacher submits finalized grade period; approver approves/finalizes or returns. |
| Payroll Run Approval | 1 payroll approval gate | Payroll/Admin/Super Admin page access | Computed payroll run must be approved before payout batch creation. |
| Online Application Review | 1 registrar review gate | Registrar/Admin/Super Admin | Registrar accepts for assessment, requests completion, or rejects. |
| Enrollment Approval | 1 registrar completion gate | Registrar/Admin/Super Admin | Registrar approves enrollment after section assignment and payment/assessment requirements are satisfied. |

## Workflow Details

### 1. Online Application Review

Source: `src/features/registrar/pages/RegistrarModulePage.tsx`

Purpose: review applicant submissions before assessment/enrollment processing.

Statuses:

| Status | Meaning | Next actions |
| --- | --- | --- |
| `Pending Registrar Review` | Application is waiting for registrar review. | Mark `For Completion`, `Accepted`, or `Rejected`. |
| `For Completion` | Applicant needs to complete/correct requirements. | Registrar may later move forward after completion. |
| `Accepted` | Application accepted for assessment. | Linked enrollment moves to `For Assessment`. |
| `Rejected` | Application declined. | Terminal review state in current UI. |
| `Cancelled` | Application cancelled. | Terminal review state in current UI. |

Flow:

1. Applicant/application enters `Pending Registrar Review`.
2. Registrar reviews the Online Review Queue.
3. Registrar can choose `For Completion`, `Accept`, or `Reject`.
4. Bulk actions are available: `Accept All Pending` and `Reject All Pending`.
5. Accepted applications update linked enrollment to `For Assessment`.

### 2. Enrollment Approval

Source: `src/features/registrar/pages/RegistrarModulePage.tsx`

Purpose: complete student enrollment after requirements, assessment, payment, and section assignment.

Statuses seen in workflow:

| Status | Meaning |
| --- | --- |
| `Pending` | Enrollment/student is awaiting processing. |
| `For Assessment` | Application/enrollment is accepted and must go through assessment/payment. |
| `Enrolled` | Registrar approved enrollment and assigned section. |
| `Rejected` | Enrollment marked incomplete/rejected. |

Flow:

1. Registrar selects a pending/for-assessment student.
2. Registrar verifies requirements and assessment/payment readiness.
3. Registrar assigns a section.
4. `approveEnrollment` marks enrollment/student as `Enrolled`.
5. `rejectEnrollment` marks the enrollment/student as `Rejected` or incomplete.

### 3. Assessment Approval

Sources:

- `src/features/registrar/pages/RegistrarModulePage.tsx`
- `src/features/accounting/pages/AccountingModulePage.tsx`
- `src/services/store.ts`

Purpose: Accounting approval gates Cashier payment collection.

Statuses:

| Status | Owner | Meaning | Cashier visibility |
| --- | --- | --- | --- |
| `Draft` / no approval status | Registrar | Assessment is still editable or not yet submitted. | Not visible. |
| `Pending Accounting Approval` | Accounting | Registrar submitted assessment for review. | Not visible. |
| `Approved for Payment` | Accounting | Assessment passed Accounting review. | Visible in Cashier Payment Queue if balance is greater than 0. |
| `Returned to Registrar` | Registrar | Accounting returned assessment for correction. | Not visible. |
| `Rejected` | Accounting | Accounting rejected the assessment. | Not visible. |

Flow:

1. Registrar prepares assessment fees, discounts, payment term, and optional books.
2. Registrar clicks `Submit for Accounting Approval`.
3. Assessment becomes `Pending Accounting Approval`; editing is locked.
4. Accounting Head or Super Admin reviews in Accounting > Billing.
5. Accounting can approve, return to Registrar with remarks, or reject.
6. Approval changes status to `Approved for Payment`.
7. Cashier can collect only approved assessments.

Authority rule:

- Final assessment actions require `SUPER_ADMIN`, or an Accounting user whose `designation` is unset or `HEAD`.
- Users outside that authority see a warning and disabled action buttons.

### 4. Discount Request Approval

Source: `src/features/accounting/pages/AccountingModulePage.tsx`

Purpose: two-level approval for discounts and scholarships.

Statuses and levels:

| State | Level 1 | Level 2 | Overall status |
| --- | --- | --- | --- |
| New request | `Pending` | `Pending` | `Pending` |
| L1 approved | `Approved` | `Pending` | `For Review` |
| L2 approved after L1 | `Approved` | `Approved` | `Approved` |
| Any rejection | `Rejected` at rejecting level | Pending/Rejected | `Rejected` |

Flow:

1. Discount request is created with `status = Pending`, `level1Status = Pending`, and `level2Status = Pending`.
2. Accounting performs `L1 Approve` or `L1 Reject`.
3. If Level 1 approves, the request moves to `For Review` and waits for Level 2.
4. Accounting performs `L2 Final Approve` or `L2 Reject`.
5. If both levels approve, request becomes `Approved`.
6. When fully approved, the store applies the discount to the student's assessment by updating discount percentage, discount amount, scholarship name, and balance.

Audit actions recorded:

- `REQUEST_SUBMITTED`
- `LEVEL_1_APPROVED`
- `LEVEL_1_REJECTED`
- `LEVEL_2_APPROVED`
- `LEVEL_2_REJECTED`

### 5. Cashier Payment and Void Approval

Sources:

- `src/features/cashier/pages/CashierModulePage.tsx`
- `src/components/common/ApprovalInbox.tsx`
- `src/services/store.ts`

Purpose: Cashier collects payments only after Accounting approval; voiding a receipt goes back to Accounting.

Payment collection flow:

1. Cashier sees only assessments with `approvalStatus = Approved for Payment` and positive balance.
2. Cashier collects payment and posts receipt.
3. Posted payments move to Collection History.

Void request statuses:

| Status | Meaning |
| --- | --- |
| `Pending Void Approval` | Cashier submitted a void request and Accounting must review it. |
| `Approved` | Accounting approved the void request. |
| `Rejected` | Accounting rejected the void request. |

Void flow:

1. Cashier initiates a void request from Collection History.
2. Request appears in the Approval Queue as `VOID`.
3. Accounting approves or rejects.
4. Notification is sent to Cashier, Accounting, Admin, and Super Admin.

Note: `cashier.config.ts` reserves `VOID_PAYMENT` as an approval-gated capability and explicitly blocks unconditional voiding.

### 6. Leave Request Approval

Sources:

- `src/features/hr/pages/sub-pages/LeaveManagementPage.tsx`
- `src/components/common/ApprovalInbox.tsx`
- `src/services/store.ts`

Purpose: HR reviews employee leave requests.

Statuses:

| Status | Meaning |
| --- | --- |
| `Submitted` | Employee/HR-created leave request is submitted. |
| `For Approval` | Leave request is awaiting HR approval. |
| `Approved` | HR approved the leave. |
| `Rejected` | HR rejected the leave. |
| `Cancelled` | Request was cancelled. |

Flow:

1. Leave request is submitted.
2. HR sees requests with `Submitted` or `For Approval`.
3. HR approves or rejects.
4. Approval writes `approvedBy`, `approvedAt`, and optional remarks.
5. Rejection writes approver, timestamp, and rejection remarks.

### 7. Grade Period Approval

Sources:

- `src/features/grading/pages/GradesDirectoryPage.tsx`
- `src/services/store.ts`

Purpose: teachers submit finalized grade periods for principal approval.

Statuses:

| Status | Meaning |
| --- | --- |
| `Draft` / unset | Grade period is not submitted for approval. |
| `Submitted` | Teacher submitted finalized grades for approval. |
| `Approved` | Principal/Admin/Super Admin approved and finalized the period. |
| `Returned` | Principal/Admin/Super Admin returned the period for revision. |

Flow:

1. Teacher finalizes/works on grade period.
2. Teacher clicks `Submit for Approval`.
3. Period becomes `Submitted`.
4. Principal/Admin/Super Admin sees approval queue in Grades Directory.
5. Approver clicks `Approve` to set `isFinalized = true` and `gradeApprovalStatus = Approved`.
6. Approver can `Return` with remarks, setting `gradeApprovalStatus = Returned`.
7. Teacher can re-submit returned periods.

Current mismatch to watch:

- `usePendingCounts` counts only `gradeApprovalStatus = Submitted`.
- `ApprovalInbox` currently lists non-finalized grade periods, not only submitted grade periods. This can show grade queue items broader than the pending badge count.

### 8. Payroll Run and Payout Workflow

Sources:

- `src/features/hr/pages/sub-pages/PayrollManagementPage.tsx`
- `src/features/hr/pages/sub-pages/SalaryPayoutsPage.tsx`
- `src/services/store.ts`

Purpose: payroll runs must be computed and approved before payout batches are created/released.

Payroll run statuses:

| Status | Meaning | Next action |
| --- | --- | --- |
| `Computed` | Payroll lines generated. | Approve run. |
| `Approved` | Payroll run approved. | Create payout batch. |
| `Released` | Payout released. | Terminal payout state. |
| `For Review` | Counted in Action Center as pending payroll review. | View in Payroll Management. |

Flow:

1. Payroll user generates a payroll run.
2. Run is created as `Computed`, with payroll lines also `Computed`.
3. Payroll user reviews exceptions. Blocking exceptions prevent approval.
4. Payroll user approves run, changing run and lines to `Approved`.
5. Payroll user creates payout batch; batch is queued and payout lines are pending.
6. Salary Payouts page releases the payout batch.
7. Release updates payout batch, payout lines, affected payroll run, and payroll lines to `Released`.

Important implementation note:

- The Action Center looks for payroll runs with `status = For Review`, but the current Payroll Management page creates runs as `Computed` and approves directly from `Computed` to `Approved`. If the intended workflow includes Action Center review, add or wire a `For Review` submission step.

## Workflow Gaps / Follow-Up Items

1. Align grade queue filtering so Action Center and badge counts both use `gradeApprovalStatus = Submitted`.
2. Decide whether payroll should have a true `For Review` state before approval, because the queue expects it but the page currently uses `Computed -> Approved`.
3. Add explicit role/designation checks for discount Level 1 vs Level 2 if different people must approve each level. The UI currently labels levels but both actions are available inside Accounting.
4. Add audit persistence for void approvals if long-term traceability is required; current in-memory/store notifications exist, but the visible audit trail is stronger for assessments and discount requests.
5. Consider documenting SLA targets per approval type; the queue only marks items older than 3 days as overdue.

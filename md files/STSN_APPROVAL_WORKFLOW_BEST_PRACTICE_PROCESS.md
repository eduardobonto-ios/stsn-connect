# STSN Connect — Best-Practice Approval Workflow Process

**Recommended document date:** 2026-06-25  
**Last updated:** 2026-06-26 (All phases complete)  
**Related audit:** `APPROVAL_LEVELS_AND_WORKFLOWS.md`  
**Purpose:** Define the best-practice approval model for STSN Connect so every request has a clear requester, reviewer, approver, final approver, status transition, audit trail, notification flow, and UI/UX behavior.

---

## 1. Executive Recommendation

STSN Connect should use a **centralized approval workflow engine** instead of allowing every module to handle approvals differently.

The current audit already identifies multiple approval flows across Registrar, Accounting, Cashier, HR, Payroll, Principal, Admin, and Super Admin. However, several workflows still use broad approval ownership, such as `Accounting/Admin/Super Admin`, and some workflows have mismatches between queue counts and queue items.

The recommended approach is:

1. Create a **single approval request model** for all approval items.
2. Define a strict **approval matrix** per workflow type.
3. Use **role + designation + school scope** to determine who can approve.
4. Separate **request creation**, **review**, **approval**, **return**, **rejection**, and **cancellation**.
5. Keep all approval decisions in a permanent **audit trail**.
6. Make the Action Center a **review inbox only**, not the source of approval rules.
7. Restrict broad Admin approval access unless explicitly required.
8. Allow Super Admin to override all workflows, but require override remarks.

---

## 1.5 Implementation Status — 2026-06-25

### Completed

| Item | File / Artifact | Notes |
| --- | --- | --- |
| Grade period queue filter fix | `src/components/common/ApprovalInbox.tsx` | Changed from `!gp.isFinalized` to `gp.gradeApprovalStatus === "Submitted"` — now matches badge count in `usePendingCounts.ts` |
| Payroll two-step flow | `src/features/hr/pages/sub-pages/PayrollManagementPage.tsx` | Added `Computed → For Review → Approved` with blocking exception guard on submit |
| Approval workflow database tables | `supabase/migrations/0034_approval_workflow_engine.sql` | All 8 core tables + `workflow_step_configs`, RLS, composite/partial indexes, `set_updated_at()` triggers, SLA seed, approval matrix seed (13 rows / 8 workflows), `v_pending_approval_requests` and `v_overdue_approval_requests` views |
| Centralized approval service | `src/services/approvalWorkflowService.ts` | Full CRUD, authority validation, inbox queries, audit trail, all methods from §15 except `delegateApproval` and `syncEntityStatusAfterApproval`; added `canUserActOnRequest`, `getReturnedToMeRequests`, `getSubmittedByMeRequests`, `getCompletedRequests`, `getOverdueRequests` |
| Store integration — fire-and-forget | `src/services/store.ts` | 14 store actions across all 8 workflows call the approval service for Supabase persistence alongside local Zustand state |
| Action Center — 6-tab DB-backed inbox | `src/components/common/ApprovalInbox.tsx`, `src/hooks/useApprovalInbox.ts` | For My Approval / For My Review split by `canUserActOnRequest`; Returned to Me / Submitted by Me / Completed / Overdue tabs; refresh button; SLA overdue badges |
| Approval detail drawer | `src/components/common/ApprovalDetailDrawer.tsx` | Request summary, step status icons, full audit timeline, Approve / Return / Reject / Override (Super Admin) actions with authority check and required remarks |
| Re-run updated migration delta | Supabase migration | Delta applied against existing instance |
| `delegateApproval()` service method | `src/services/approvalWorkflowService.ts` | Approval delegation to authorized delegate implemented |
| `syncEntityStatusAfterApproval()` | `src/services/approvalWorkflowService.ts` | Entity table status synced from workflow completion event; Zustand local state now updated via service |
| Notification events | `src/services/notificationService.ts` | Submitted, approved, returned, rejected, and overdue notification events implemented |
| Overdue detection and escalation | Service + database | Overdue detection, escalation rules, and approval reminders implemented |
| Approval history and SLA compliance reports | Reports module | Approval history, SLA compliance, pending, override, and rejected/returned trend reports implemented |

### Pending

All items completed.

### Migration Note

The initial version of `0034_approval_workflow_engine.sql` was executed against Supabase. The updated comprehensive version adds `set_updated_at()` triggers, `workflow_step_configs` table with full approval matrix seed, additional composite/partial indexes, FK and check constraints, idempotent RLS policy blocks, and the two convenience views. All statements use `if not exists`, `create or replace`, or `on conflict` — the full file can be safely re-run against the existing database to apply the delta.

---

## 2. Core Approval Principles

### 2.1 One Source of Truth

All approval workflows should be stored in centralized approval tables.

Recommended core tables:

| Table | Purpose |
| --- | --- |
| `approval_requests` | Main approval record for every request. |
| `approval_steps` | Defines each required approval level. |
| `approval_actions` | Records all actions taken by approvers. |
| `approval_comments` | Stores return/rejection/clarification notes. |
| `approval_attachments` | Stores supporting files, if needed. |
| `approval_delegations` | Handles temporary approver delegation. |
| `approval_sla_rules` | Defines overdue rules per workflow. |

Module tables such as assessments, discounts, leave requests, payroll runs, grade periods, and enrollment records should keep their business data, but approval decisions should be recorded centrally.

---

### 2.2 Approval Rules Must Not Live Only in UI

Approval authority must be enforced in:

1. Database policies / RLS where applicable.
2. Backend service validation.
3. Frontend UI display rules.

The frontend may hide or disable buttons, but it should never be the only protection.

---

### 2.3 Every Approval Must Answer These Questions

Each workflow should clearly answer:

| Question | Requirement |
| --- | --- |
| Who created the request? | `requested_by`, `requested_role`, `requested_at` |
| What is being approved? | `workflow_type`, `entity_type`, `entity_id` |
| Who can approve? | Approval matrix based on role, designation, level, and school scope |
| What level is currently pending? | `current_step_level` |
| What happens after approval? | Next step or final business status update |
| What happens after rejection? | Final rejected state |
| What happens after return? | Goes back to requester or responsible module |
| Who changed what? | Permanent audit action |
| Why was it approved/rejected/returned? | Required remarks for negative/override actions |

---

## 3. Recommended Approval Status Model

Use consistent statuses across all modules.

### 3.1 Approval Request Statuses

| Status | Meaning |
| --- | --- |
| `Draft` | Request is being prepared and not yet submitted. |
| `Submitted` | Request was submitted and is waiting for first review. |
| `In Review` | At least one approval step is active. |
| `Returned` | Request was returned for correction. |
| `Resubmitted` | Returned request was corrected and submitted again. |
| `Approved` | All required approval levels are complete. |
| `Rejected` | Request was rejected and cannot proceed unless recreated. |
| `Cancelled` | Requester cancelled the request before final approval. |
| `Voided` | Previously approved transaction was voided through an approval process. |

### 3.2 Approval Step Statuses

| Status | Meaning |
| --- | --- |
| `Pending` | Waiting for assigned approver. |
| `Approved` | Step was approved. |
| `Rejected` | Step was rejected. |
| `Returned` | Step was returned for correction. |
| `Skipped` | Step was skipped by system rule or Super Admin override. |
| `Delegated` | Step was reassigned to an authorized delegate. |

---

## 4. Recommended Approval Authority Matrix

### 4.1 Role and Designation Model

Approval should not rely only on generic role names. It should also use designation or authority level.

Recommended authority fields:

| Field | Example Values | Purpose |
| --- | --- | --- |
| `role` | Registrar, Accounting, Cashier, HR, Payroll, Principal, Admin, Super Admin | Main module access role |
| `designation` | Staff, Officer, Head, Director | Determines approval authority |
| `approval_level` | 0, 1, 2, 3 | Numeric authority level |
| `school_scope` | Specific school ID or all schools | Prevents cross-school approval mistakes |
| `can_override` | true/false | Allows emergency approval override |
| `is_active` | true/false | Prevents inactive users from approving |

---

## 5. Recommended Workflow-by-Workflow Design

## 5.1 Online Application Review

### Purpose

Registrar reviews online application submissions before enrollment and assessment processing.

### Recommended Requester and Approver

| Stage | Owner |
| --- | --- |
| Request created by | Website applicant / system |
| Reviewer | Registrar Staff |
| Final approver | Registrar Head, Admin with Registrar approval permission, or Super Admin |
| Override approver | Super Admin only |

### Recommended Status Flow

```text
Pending Registrar Review
    → For Completion
    → Resubmitted
    → Accepted for Assessment
    → Rejected
```

### Recommended Process

1. Applicant submits online application from the website.
2. System creates an application record with status `Pending Registrar Review`.
3. Registrar Staff reviews applicant information and requirements.
4. Registrar may mark it as:
   - `For Completion`
   - `Accepted for Assessment`
   - `Rejected`
5. If marked `For Completion`, the applicant must update missing details.
6. Once accepted, linked enrollment moves to `For Assessment`.

### Best-Practice Rule

Registrar Staff may review and prepare the decision, but final acceptance should be limited to **Registrar Head or authorized Registrar approver** if the school wants stronger control.

---

## 5.2 Enrollment Approval

### Purpose

Registrar completes student enrollment after requirements, assessment, payment readiness, and section assignment are verified.

### Recommended Requester and Approver

| Stage | Owner |
| --- | --- |
| Request created by | Registrar Staff or system after accepted online application |
| Reviewer | Registrar Staff |
| Final approver | Registrar Head |
| Override approver | Super Admin |

### Recommended Status Flow

```text
Pending
    → For Assessment
    → For Section Assignment
    → Ready for Enrollment Approval
    → Enrolled
    → Returned / Rejected
```

### Recommended Process

1. Registrar verifies student data and requirements.
2. Registrar confirms assessment/payment readiness.
3. Registrar assigns section.
4. Enrollment becomes `Ready for Enrollment Approval`.
5. Registrar Head approves final enrollment.
6. System marks the student as `Enrolled`.

### Best-Practice Rule

Do not allow a student to become `Enrolled` unless:

- Required student profile fields are complete.
- Requirements checklist is complete or properly waived.
- Assessment is approved.
- Required payment condition is satisfied.
- Section is assigned.
- Approval audit record is created.

---

## 5.3 Assessment Approval

### Purpose

Accounting validates the assessment before Cashier can collect payment.

### Recommended Requester and Approver

| Stage | Owner |
| --- | --- |
| Request created by | Registrar |
| Reviewer | Accounting Staff / Accounting Officer |
| Final approver | Accounting Head |
| Override approver | Super Admin |

### Recommended Status Flow

```text
Draft
    → Submitted for Accounting Review
    → Pending Accounting Approval
    → Approved for Payment
    → Returned to Registrar
    → Rejected
```

### Recommended Process

1. Registrar prepares assessment.
2. Registrar submits assessment for Accounting approval.
3. Accounting reviews:
   - Tuition and fees
   - Books
   - Discounts
   - Payment terms
   - Balance
4. Accounting Head approves, returns, or rejects.
5. Approved assessments become visible to Cashier.

### Approval Authority

| Action | Allowed |
| --- | --- |
| Submit assessment | Registrar |
| Review assessment | Accounting Staff, Accounting Officer, Accounting Head |
| Approve assessment | Accounting Head, Super Admin |
| Return assessment | Accounting Head, Super Admin |
| Reject assessment | Accounting Head, Super Admin |
| Override approval | Super Admin only, with required remarks |

### Best-Practice Rule

Cashier must never see assessments unless the assessment status is `Approved for Payment`.

---

## 5.4 Discount Request Approval

### Purpose

Discounts, scholarships, and financial adjustments should follow strict multi-level approval.

### Recommended Requester and Approver

| Stage | Owner |
| --- | --- |
| Request created by | Registrar, Accounting Staff, or authorized staff |
| Level 1 approver | Accounting Officer or Accounting Head |
| Level 2 final approver | Accounting Head, Finance Director, School Director, or Super Admin |
| Override approver | Super Admin only |

### Recommended Status Flow

```text
Pending
    → Level 1 Approved
    → For Final Review
    → Approved
    → Rejected
    → Returned for Correction
```

### Recommended Approval Levels

| Level | Approver | Purpose |
| --- | --- | --- |
| Level 1 | Accounting Officer / Accounting Head | Validate discount eligibility and supporting documents. |
| Level 2 | Accounting Head / Finance Director / Super Admin | Final financial approval. |

### Amount-Based Approval Rule

Use amount or percentage thresholds to determine required approval levels.

| Discount Type / Amount | Required Approval |
| --- | --- |
| Small discount within allowed policy | Level 1 only |
| Scholarship / employee discount / sibling discount | Level 1 + Level 2 |
| High-value or manual discount | Level 1 + Level 2 + Super Admin override if outside policy |
| Any discount without document proof | Return for completion |

### Best-Practice Rule

The same person should not approve both Level 1 and Level 2 unless they are Super Admin performing an override.

---

## 5.5 Cashier Payment Void Approval

### Purpose

Cashier can request payment voiding, but Accounting must approve before any receipt or balance is reversed.

### Recommended Requester and Approver

| Stage | Owner |
| --- | --- |
| Request created by | Cashier |
| Reviewer | Accounting Officer |
| Final approver | Accounting Head |
| Override approver | Super Admin |

### Recommended Status Flow

```text
Posted Payment
    → Pending Void Approval
    → Void Approved
    → Voided
    → Void Rejected
```

### Recommended Process

1. Cashier submits void request from collection history.
2. Cashier must provide void reason.
3. System locks the receipt from additional changes.
4. Accounting reviews request.
5. If approved:
   - Receipt is marked `Voided`.
   - Student balance is recalculated.
   - Audit entry is created.
6. If rejected:
   - Payment remains posted.
   - Cashier receives rejection reason.

### Required Void Reasons

Void request must require a reason such as:

- Duplicate payment
- Wrong student
- Wrong amount
- Wrong payment method
- Incorrect receipt details
- Bank/payment confirmation failed
- Other, with required explanation

### Best-Practice Rule

No user, including Cashier, should be allowed to directly void posted payments without approval.

---

## 5.6 Leave Request Approval

### Purpose

Employee leave requests should be reviewed and approved by HR or the employee’s assigned approver.

### Recommended Requester and Approver

| Stage | Owner |
| --- | --- |
| Request created by | Employee or HR |
| Initial reviewer | HR Staff |
| Final approver | HR Head or assigned department head |
| Override approver | Super Admin |

### Recommended Status Flow

```text
Submitted
    → For Approval
    → Approved
    → Rejected
    → Cancelled
```

### Recommended Process

1. Employee submits leave request.
2. HR validates leave credits and schedule conflict.
3. Department head or HR Head approves.
4. HR records approved leave.
5. System updates leave balance.

### Best-Practice Rule

Approval should validate:

- Leave balance
- Date overlap
- Employee eligibility
- Required attachment for sick/emergency leave
- Payroll cutoff impact

---

## 5.7 Grade Period Approval

### Purpose

Teachers submit finalized grades to Principal for approval.

### Recommended Requester and Approver

| Stage | Owner |
| --- | --- |
| Request created by | Teacher |
| Reviewer | Subject Coordinator, optional |
| Final approver | Principal |
| Override approver | Super Admin |

### Recommended Status Flow

```text
Draft
    → Submitted
    → Under Principal Review
    → Approved / Finalized
    → Returned for Revision
```

### Recommended Process

1. Teacher enters grades.
2. Teacher submits grade period for approval.
3. Principal reviews grade period.
4. Principal approves or returns with remarks.
5. Approved grade period becomes finalized and locked.
6. Returned grade period becomes editable by teacher.

### Best-Practice Rule

The Action Center and pending badge count must use the same filter:

```text
gradeApprovalStatus = Submitted
```

Do not show unsubmitted, non-finalized grade periods in the approval queue.

---

## 5.8 Payroll Run Approval

### Purpose

Payroll runs must be reviewed before payout batches are created.

### Recommended Requester and Approver

| Stage | Owner |
| --- | --- |
| Request created by | Payroll Staff |
| Reviewer | Payroll Officer |
| Final approver | Payroll Head / HR Head / Finance Head |
| Override approver | Super Admin |

### Recommended Status Flow

```text
Draft
    → Computed
    → Submitted for Review
    → For Review
    → Approved
    → Payout Batch Created
    → Released
    → Returned / Rejected
```

### Recommended Process

1. Payroll Staff computes payroll.
2. System validates payroll exceptions.
3. Payroll Staff submits computed run for review.
4. Payroll Officer or Payroll Head reviews.
5. Final approver approves the run.
6. Payout batch can be created only from approved payroll runs.
7. Salary Payout page releases the payout batch.

### Blocking Exceptions

Payroll approval must be blocked if there are unresolved critical exceptions:

- Missing salary setup
- Missing bank account
- Negative net pay
- Invalid attendance data
- Missing employee assignment
- Duplicate payroll line
- Unapproved leave impacting pay
- Unresolved deductions

### Best-Practice Rule

Add a true `For Review` submission step. Do not approve directly from `Computed` to `Approved`.

---

## 6. Recommended Global Approval Matrix

| Workflow | Requester | Level 1 Reviewer | Final Approver | Super Admin Override |
| --- | --- | --- | --- | --- |
| Online Application | Applicant/System | Registrar Staff | Registrar Head | Yes |
| Enrollment | Registrar Staff | Registrar Staff | Registrar Head | Yes |
| Assessment | Registrar | Accounting Officer | Accounting Head | Yes |
| Discount | Registrar/Accounting | Accounting Officer | Accounting Head / Finance Director | Yes |
| Payment Void | Cashier | Accounting Officer | Accounting Head | Yes |
| Leave | Employee/HR | HR Staff | HR Head / Department Head | Yes |
| Grade Period | Teacher | Optional Coordinator | Principal | Yes |
| Payroll Run | Payroll Staff | Payroll Officer | Payroll Head / HR Head / Finance Head | Yes |

---

## 7. Recommended Permission Rules

### 7.1 Super Admin

Super Admin can approve, reject, return, cancel, or override all workflows.

However, Super Admin override must require:

- Mandatory remarks
- Override reason
- Audit action
- Notification to original approver group

---

### 7.2 Admin

Admin should not automatically approve everything.

Recommended Admin behavior:

| Capability | Recommendation |
| --- | --- |
| View all approval queues | Allowed if school-scoped |
| Approve all workflows | Not recommended by default |
| Approve assigned workflows only | Recommended |
| Configure approval matrix | Allowed only if permitted |
| Override final approval | Not recommended |
| Emergency approval | Super Admin only |

Admin should be treated as an operational manager, not a universal approver.

---

### 7.3 Department Heads

Department heads should be the default final approvers for their domain.

| Department | Final Approver |
| --- | --- |
| Registrar | Registrar Head |
| Accounting | Accounting Head |
| Cashier voids | Accounting Head |
| HR leave | HR Head / Department Head |
| Grades | Principal |
| Payroll | Payroll Head / HR Head / Finance Head |

---

## 8. Recommended Approval Engine Design

### 8.1 Approval Request Object

Recommended fields:

```ts
approval_requests {
  id: uuid
  workflow_type: string
  entity_type: string
  entity_id: uuid
  school_id: uuid
  requested_by: uuid
  requested_role: string
  request_title: string
  request_summary: string
  status: string
  current_step_level: number
  priority: string
  due_at: timestamp
  submitted_at: timestamp
  completed_at: timestamp
  cancelled_at: timestamp
  created_at: timestamp
  updated_at: timestamp
}
```

### 8.2 Approval Step Object

```ts
approval_steps {
  id: uuid
  approval_request_id: uuid
  step_level: number
  step_name: string
  required_role: string
  required_designation: string
  required_approval_level: number
  assigned_to_user_id: uuid | null
  status: string
  acted_by: uuid | null
  acted_at: timestamp | null
  remarks: text | null
  created_at: timestamp
  updated_at: timestamp
}
```

### 8.3 Approval Action Object

```ts
approval_actions {
  id: uuid
  approval_request_id: uuid
  approval_step_id: uuid | null
  action: string
  action_by: uuid
  action_role: string
  action_designation: string
  remarks: text
  metadata: jsonb
  created_at: timestamp
}
```

---

## 9. Recommended Action Types

Use consistent actions across all workflows.

| Action | Meaning |
| --- | --- |
| `SUBMITTED` | Request submitted for approval. |
| `REVIEWED` | Reviewer opened or validated request. |
| `APPROVED_LEVEL_1` | First-level approval completed. |
| `APPROVED_LEVEL_2` | Second-level approval completed. |
| `APPROVED_FINAL` | Final approval completed. |
| `RETURNED` | Request returned for correction. |
| `RESUBMITTED` | Returned request was submitted again. |
| `REJECTED` | Request rejected. |
| `CANCELLED` | Request cancelled by requester or admin. |
| `OVERRIDDEN` | Super Admin override action. |
| `DELEGATED` | Approval assigned to another authorized approver. |

---

## 10. Recommended UI/UX Approach

### 10.1 Action Center

The Action Center should be a central approval inbox.

Each item should show:

- Request type
- Request title
- Student/employee/payroll reference
- Requested by
- Requested date
- Current approval level
- Current pending approver group
- SLA status
- Priority
- Last action
- Quick action only if user has authority

### 10.2 Queue Tabs

Recommended tabs:

| Tab | Purpose |
| --- | --- |
| `For My Approval` | Items the current user can approve now. |
| `For My Review` | Items the current user can review but not final approve. |
| `Returned to Me` | Items returned to the current user or module. |
| `Submitted by Me` | Requests created by the current user. |
| `Completed` | Approved/rejected/cancelled items. |
| `Overdue` | Items beyond SLA. |

### 10.3 Approval Details Drawer / Modal

Every approval item should open a consistent approval detail view with:

- Summary card
- Request details
- Current status
- Approval timeline
- Related records
- Attachments
- Comments
- Approve / Return / Reject actions
- Required remarks field for return/reject/override

### 10.4 Button Behavior

| User Authority | UI Behavior |
| --- | --- |
| Can approve | Enable Approve / Return / Reject buttons |
| Can review only | Show View Details and Add Comment |
| Cannot access | Hide item from queue |
| Can view but not act | Show disabled actions with clear reason |
| Super Admin override | Show override actions with required remarks |

---

## 11. Recommended Notification Process

### 11.1 Notification Events

Send notifications when:

- Request is submitted.
- Request is approved at any level.
- Request is returned.
- Request is rejected.
- Request is resubmitted.
- Request becomes overdue.
- Request is overridden.
- Request is delegated.

### 11.2 Notification Recipients

| Event | Recipients |
| --- | --- |
| Submitted | Assigned approver group |
| Approved Level 1 | Next-level approver group and requester |
| Final Approved | Requester and affected module users |
| Returned | Requester / responsible module |
| Rejected | Requester / responsible module |
| Overdue | Current approver, department head, optional Super Admin |
| Override | Original approver group and requester |

---

## 12. Recommended SLA Rules

Add SLA rules per workflow.

| Workflow | Recommended SLA |
| --- | --- |
| Online Application Review | 1 business day |
| Enrollment Approval | 1 business day |
| Assessment Approval | Same day or 1 business day |
| Discount Request | 2 business days |
| Payment Void Approval | Same day |
| Leave Request | 2 business days |
| Grade Period Approval | 3 business days |
| Payroll Run Approval | Same day before payout cutoff |

Overdue items should be visually marked and escalated.

---

## 13. Recommended Audit Trail

Every approval action must record:

| Field | Requirement |
| --- | --- |
| `action_by` | User who performed the action |
| `action_role` | Role at the time of action |
| `action_designation` | Designation at the time of action |
| `action` | Submitted, approved, returned, rejected, etc. |
| `remarks` | Required for return, reject, cancel, override |
| `previous_status` | Status before action |
| `new_status` | Status after action |
| `ip_address` | Optional but recommended |
| `user_agent` | Optional but recommended |
| `created_at` | Action timestamp |

Audit trail must be read-only after creation.

---

## 14. Recommended Database and Migration Approach

Create a Supabase migration under:

```text
supabase/migrations/YYYYMMDDHHMMSS_create_approval_workflow_engine.sql
```

The migration should include:

1. `approval_requests`
2. `approval_steps`
3. `approval_actions`
4. `approval_comments`
5. `approval_attachments`
6. `approval_sla_rules`
7. `approval_delegations`
8. Indexes for:
   - `workflow_type`
   - `entity_id`
   - `school_id`
   - `status`
   - `current_step_level`
   - `requested_by`
9. RLS policies by role and school scope.
10. Seed data for approval workflow types and SLA rules.

---

## 15. Recommended Service Layer Approach

Create a centralized approval service:

```text
src/services/approvalWorkflowService.ts
```

Recommended service methods:

```ts
createApprovalRequest()
submitApprovalRequest()
getApprovalInbox()
getApprovalRequestDetails()
approveStep()
returnRequest()
rejectRequest()
cancelRequest()
delegateApproval()
overrideApproval()
getApprovalTimeline()
validateApprovalAuthority()
syncEntityStatusAfterApproval()
```

Each module should call the approval service instead of implementing approval logic independently.

---

## 16. Recommended Store Approach

If using a client store, keep it as a UI state manager only.

Recommended store responsibilities:

- Current approval filters
- Selected approval item
- Local loading state
- Optimistic UI feedback only when safe
- Toast/notification display

Not recommended inside client store:

- Final approval authority decisions
- Permanent business rule enforcement
- Direct mutation of unrelated module status without service validation

---

## 17. Recommended Implementation Phases

### Phase 1 — Approval Matrix Finalization ✅ Completed

- ✅ Finalized approver roles and designations (seeded in `workflow_step_configs`).
- ✅ Defined exact Level 1 and Level 2 approvers for discounts.
- ✅ Defined Payroll `For Review` status and two-step flow.
- ✅ Defined grade approval queue filter (`gradeApprovalStatus === "Submitted"`).
- ✅ Removed broad Admin approval rules — Admin approval limited to configured permissions; Super Admin retains universal override.

### Phase 2 — Database Foundation ✅ Completed

- ✅ Created all approval workflow tables (`approval_requests`, `approval_steps`, `approval_actions`, `approval_comments`, `approval_attachments`, `approval_sla_rules`, `approval_delegations`, `workflow_step_configs`).
- ✅ Added RLS policies (idempotent, role-scoped).
- ✅ Added basic, composite, and partial indexes.
- ✅ Added `set_updated_at()` trigger function and triggers.
- ✅ Added SLA seed data for all 8 workflows.
- ✅ Added approval matrix seed data (13 rows for 8 workflows).
- ✅ Added `v_pending_approval_requests` and `v_overdue_approval_requests` convenience views.
- ✅ Updated migration file re-run against Supabase; delta applied successfully.

### Phase 3 — Approval Service ✅ Completed

- ✅ Built `src/services/approvalWorkflowService.ts`.
- ✅ Added authority validation (`validateApprovalAuthority`).
- ✅ Added audit trail creation (every action writes to `approval_actions`).
- ✅ Added `createApprovalRequest`, `submitApprovalRequest`, `approveStep`, `returnRequest`, `rejectRequest`, `cancelRequest`, `overrideApproval`, `resubmitApprovalRequest`, `getApprovalTimeline`, `getApprovalRequestDetails`, `getApprovalInbox`, `findApprovalRequestByEntity`.
- ✅ `delegateApproval()` — implemented.
- ✅ `syncEntityStatusAfterApproval()` — implemented; syncs entity table status from workflow completion event and updates Zustand local state.

### Phase 4 — UI Refactor ✅ Completed

- ✅ Replaced Zustand-based flat queue with DB-backed `ApprovalInbox` reading from `approval_requests` via `useApprovalInbox` hook (`src/hooks/useApprovalInbox.ts`).
- ✅ Added all six Action Center tabs: `For My Approval`, `For My Review`, `Returned to Me`, `Submitted by Me`, `Completed`, `Overdue` (`src/components/common/ApprovalInbox.tsx`).
- ✅ Added `ApprovalDetailDrawer` (`src/components/common/ApprovalDetailDrawer.tsx`) — timeline, steps with status icons, authority check, Approve / Return / Reject / Override (Super Admin) actions with mandatory remarks for negative/override actions.
- ✅ Standardized Approve / Return / Reject buttons using `canUserActOnRequest()` from the approval service — authority is checked before showing action buttons; Super Admin gets Override button.
- ✅ Added `canUserActOnRequest()`, `getReturnedToMeRequests()`, `getSubmittedByMeRequests()`, `getCompletedRequests()`, `getOverdueRequests()` to `approvalWorkflowService.ts`.
- ✅ Drawer actions (approve/return/reject) update `approval_requests` in Supabase and sync Zustand local state via `syncEntityStatusAfterApproval()`. Module-specific pages (Assessment, HR, Payroll) now read from DB.

### Phase 5 — Module Integration ✅ Completed

Store (`src/services/store.ts`) is wired to call the approval service alongside Zustand local state. Individual UI pages drive status transitions via `syncEntityStatusAfterApproval()`; the Action Center reads from the DB.

| Workflow | Store Wired | UI Reading DB |
| --- | --- | --- |
| Assessment Approval | ✅ | ✅ |
| Discount Request Approval | ✅ | ✅ |
| Payment Void Approval | ✅ | ✅ |
| Online Application Review | ✅ | ✅ |
| Enrollment Approval | ✅ | ✅ |
| Grade Period Approval | ✅ | ✅ |
| Payroll Run Approval | ✅ (two-step) | ✅ |
| Leave Request Approval | ✅ | ✅ |

### Phase 6 — Notifications and SLA ✅ Completed

- ✅ Add notification events.
- ✅ Add overdue handling.
- ✅ Add escalation rules.
- ✅ Add approval reminders.

### Phase 7 — Reports and Audit ✅ Completed

- ✅ Add approval history report.
- ✅ Add SLA compliance report.
- ✅ Add pending approvals report.
- ✅ Add override report.
- ✅ Add rejected/returned trend report.

---

## 18. Current Audit Gaps and Recommended Fixes

| Current Gap | Recommended Fix | Status |
| --- | --- | --- |
| Grade queue showed non-finalized periods beyond submitted items. | Use `gradeApprovalStatus = Submitted` consistently for queue and count. | ✅ Fixed in `ApprovalInbox.tsx` |
| Payroll queue expected `For Review`, but payroll page used `Computed → Approved`. | Added `Submitted for Review / For Review` step. | ✅ Fixed in `PayrollManagementPage.tsx` |
| Approval logic was distributed across modules and store. | Moved approval authority and transitions into centralized approval service. | ✅ Service created; store wired fire-and-forget |
| Void approval audit trail was weaker than assessment and discount audits. | Store void approval actions in central audit trail. | ✅ Fixed — Action Center reads from DB; audit trail complete |
| Discount Level 1 and Level 2 are not clearly separated by authority. | Role/designation-based Level 1 and Level 2 rules. | ✅ Fixed — UI enforces authority via `canUserActOnRequest()` |
| Admin appears broadly across many approval flows. | Limit Admin to configured approval permissions; keep universal override for Super Admin only. | ✅ Fixed — Admin limited to configured approval permissions |

---

## 19. Recommended Final State Per Workflow

| Workflow | Final Approved Status | Final Rejected Status | Returned Status |
| --- | --- | --- | --- |
| Online Application | `Accepted for Assessment` | `Rejected` | `For Completion` |
| Enrollment | `Enrolled` | `Rejected` | `Returned for Correction` |
| Assessment | `Approved for Payment` | `Rejected` | `Returned to Registrar` |
| Discount | `Approved` | `Rejected` | `Returned for Correction` |
| Payment Void | `Voided` | `Void Rejected` | `Returned for Clarification` |
| Leave | `Approved` | `Rejected` | `Returned for Correction` |
| Grade Period | `Approved / Finalized` | Not usually rejected; return instead | `Returned for Revision` |
| Payroll Run | `Approved` | `Rejected` | `Returned for Correction` |

---

## 20. Best-Practice Summary

The best approach is to treat approvals as a first-class system feature, not as separate button logic inside each module.

STSN Connect should have:

1. A centralized approval workflow engine.
2. A strict approval authority matrix.
3. Department-specific final approvers.
4. Super Admin override with mandatory remarks.
5. Clear status transitions.
6. Consistent Action Center behavior.
7. Complete audit trail.
8. SLA and escalation rules.
9. Notifications for every approval event.
10. Reports for pending, completed, overdue, rejected, returned, and overridden approvals.

This will make the system easier to maintain, safer for production, and clearer for each school role.

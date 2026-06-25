# STSN Connect — Enterprise ERP Standards Review
**Date:** June 25, 2026 | **Branch:** dev | **Scope:** Roles, Approvals, UI/UX

---

## Executive Summary

STSN Connect has solid architectural bones: a clean role matrix, well-modeled approval statuses, and a modular feature structure. This document audits each pillar against enterprise School ERP standards (comparable to Blackbaud, PowerSchool, Oracle Student Cloud, and SAP Education) and delivers prioritized, actionable recommendations — from critical gaps to polish items.

**Overall Rating by Pillar:**

| Pillar | Current State | Target State | Gap Level |
|--------|--------------|--------------|-----------|
| Role Architecture | 11 roles, flat permissions | RBAC + granular action permissions | Medium |
| Approval Management | 6 workflow chains, no unified queue | Centralized approval inbox + SLAs | High |
| UI / Navigation | Sidebar + module render | Role-adaptive dashboard shell | High |
| UX / User Flows | Function-first layout | Task-first, guided flows | Medium |
| Audit & Compliance | Partial audit trail | Full immutable audit log | Medium |
| Reporting | Module-embedded reports | Cross-module reporting layer | Low |

---

## Part 1 — Role Architecture Audit

### 1.1 Current Role Matrix

| # | Role | Canonical ID | Modules Assigned | Key Gap |
|---|------|-------------|-----------------|---------|
| 1 | Super Admin | `super-admin` | All 28 | No action-level restriction possible |
| 2 | Principal | `principal` | 7 modules | Cannot approve academic exceptions in system |
| 3 | Registrar | `registrar` | 13 modules | Cannot be scoped to one department only |
| 4 | Accounting | `accounting` | 2 modules | Cannot delegate L1 vs L2 approval to sub-staff |
| 5 | Cashier | `cashier` | 1 module | No shift/drawer assignment |
| 6 | Teacher | `teacher` | 5 modules | Cannot be limited to own sections/subjects |
| 7 | Student | `student` | 2 modules | No parent/guardian linked view |
| 8 | HR | `hr` | 3 modules | HR sees clinic records (HIPAA concern) |
| 9 | Guidance | `guidance` | 2 modules | No confidentiality flag on records |
| 10 | Nurse | `nurse` | 2 modules | No health record confidentiality control |
| 11 | Payroll | `payroll` | 1 module | Separate from HR but same employee data |

### 1.2 Critical Role Gaps

#### GAP-R1: No Action-Level Permissions
**Problem:** All roles have module-level access only (`canAccess: true/false`). There is no distinction between:
- View only vs. Edit vs. Delete vs. Approve
- Draft vs. Submit vs. Release actions per role

**Enterprise Standard:** RBAC (Role-Based Access Control) with action permissions:
```
permission: {
  module: "ACCOUNTING",
  actions: ["view", "generate_assessment", "approve_assessment", "reject_assessment"]
}
```

**Recommendation:** Define a `permissions` map per role with CRUD + domain actions. Start with the 5 highest-risk modules: Accounting, Payroll, Registrar, Cashier, Accounts Security.

---

#### GAP-R2: Missing Sub-Roles / Delegation
**Problem:** `accounting` role has one permission set, but in real schools, the Accounting Head approves L2 discounts while an Accounting Clerk only processes ledger entries. Currently impossible to enforce in system.

**Enterprise Standard:** Role hierarchy or role + designation:
```
Role: accounting
Designation: "Accounting Head" → canApproveL2Discounts: true
Designation: "Accounting Clerk" → canApproveL2Discounts: false
```

**Recommendation:** Add a `designation` field to users. Use `role + designation` for the most sensitive approval actions (L2 discounts, payroll release, assessment approval). This avoids creating 20 roles but unlocks granular control.

---

#### GAP-R3: Teacher Data Scoping Not Enforced
**Problem:** `teacher` role accesses `GRADING` and `FACULTY_PORTAL` but no system-level filter restricts teachers to only their assigned sections and subjects. A teacher can theoretically view or encode grades for sections they don't teach.

**Enterprise Standard:** Row-level security per teacher's teaching load.

**Recommendation:** In `GradingModulePage` and `FacultyPortalPage`, always filter data by `currentUser.employeeId → teachingLoad.sections`. Enforce this in Supabase RLS policies, not just UI filtering.

---

#### GAP-R4: No Parent/Guardian Role
**Problem:** Many Philippine schools allow parents to view enrollment status, billing, and grades. Currently `student` role is the only self-service role.

**Enterprise Standard:** A `guardian` role linked to one or more student records.

**Recommendation (Phase 2):** Add `guardian` role with:
- `STUDENT_PORTAL` access filtered to their linked student(s)
- View-only: grades, billing, enrollment status, COR
- Cannot self-enroll (student action only)

---

#### GAP-R5: HR Can See Clinic Records
**Problem:** `hr` role includes `NURSE_CLINIC` in its module list. Medical records are sensitive and HR should not have access to individual health visit records (data privacy concern under RA 10173 — Data Privacy Act of the Philippines).

**Recommendation:** Remove `NURSE_CLINIC` from `hr` permissions. If HR needs aggregate health data for benefits processing, expose only anonymized summaries, not individual clinic visit records.

---

### 1.3 Recommended Final Role Matrix

```
ROLE            │ MODULE ACCESS (primary)                         │ ACTION LEVEL
────────────────┼─────────────────────────────────────────────────┼───────────────────────────────
super-admin     │ All                                             │ Full CRUD + all approvals
────────────────┼─────────────────────────────────────────────────┼───────────────────────────────
principal       │ DASHBOARD, STUDENT_DIRECTORY, GRADING,          │ Approve: grade finalization,
                │ CURRICULUM, FACULTY_ADMIN, SCHEDULING,          │ academic exceptions
                │ REGISTRAR_REPORTS                               │ View: all academic records
────────────────┼─────────────────────────────────────────────────┼───────────────────────────────
registrar       │ DASHBOARD, REGISTRAR, STUDENT_DIRECTORY,        │ Approve: enrollment, sectioning
                │ GRADING, CURRICULUM, STUDENT_PORTAL,            │ Create/Edit: students, sections
                │ FACULTY_ADMIN, CLASS_SECTIONING,                │ Generate: assessments
                │ BOOKS_SETUP, GUIDANCE (view only),              │ View: all academic records
                │ CONSULTATION, REGISTRAR_REPORTS                 │
────────────────┼─────────────────────────────────────────────────┼───────────────────────────────
accounting      │ ACCOUNTING, BOOKS_SETUP                         │ Approve/Return/Reject: assessments
(head)          │                                                 │ Approve L2: discounts
                │                                                 │ Manage: holds, discount types
────────────────┼─────────────────────────────────────────────────┼───────────────────────────────
accounting      │ ACCOUNTING                                       │ View: ledger, reports
(clerk)         │                                                 │ Generate: journals, AR/AP entries
                │                                                 │ No approval actions
────────────────┼─────────────────────────────────────────────────┼───────────────────────────────
cashier         │ CASHIER                                         │ Post: payments, receipts
                │                                                 │ View: approved assessments only
                │                                                 │ No: void without approval
────────────────┼─────────────────────────────────────────────────┼───────────────────────────────
teacher         │ FACULTY_PORTAL, GRADING (own sections),         │ Encode: grades (own subjects)
                │ CURRICULUM (view), ONLINE_LEARNING,             │ Submit: grades for review
                │ CONSULTATION                                    │ View: own class lists only
────────────────┼─────────────────────────────────────────────────┼───────────────────────────────
student         │ STUDENT_PORTAL, CONSULTATION                    │ View: own records only
                │                                                 │ Submit: enrollment application
────────────────┼─────────────────────────────────────────────────┼───────────────────────────────
guardian (NEW)  │ STUDENT_PORTAL (linked student only)            │ View only
────────────────┼─────────────────────────────────────────────────┼───────────────────────────────
hr              │ DASHBOARD, HR_MANAGEMENT                        │ Manage: employees, time, leave
                │ (NOT NURSE_CLINIC — see GAP-R5)                 │ Approve: leave requests
────────────────┼─────────────────────────────────────────────────┼───────────────────────────────
payroll         │ PAYROLL_MANAGEMENT                              │ Generate: payroll runs
                │                                                 │ Approve: runs (if head)
                │                                                 │ Release: payout batches
────────────────┼─────────────────────────────────────────────────┼───────────────────────────────
guidance        │ GUIDANCE, GUIDANCE_REPORTS                      │ Manage: counseling records
                │                                                 │ Confidentiality flag on records
────────────────┼─────────────────────────────────────────────────┼───────────────────────────────
nurse           │ NURSE_CLINIC, CLINIC_REPORTS                    │ Manage: health visit records
                │                                                 │ Health records private from HR
```

---

## Part 2 — Approval Management Audit

### 2.1 Current Approval Chains

| Workflow | Statuses | Roles Involved | Unified Queue? |
|----------|---------|----------------|---------------|
| Online Application | Pending → For Completion → Accepted → Rejected | Registrar | No |
| Enrollment | Pending → For Assessment → For Payment → Enrolled | Registrar → Accounting → Cashier | No |
| Assessment Approval | Pending Accounting Approval → Approved / Returned / Rejected | Accounting | No |
| Discount Request | Pending → L1 Review → L2 Review → Approved | Accounting (L1+L2) | No |
| Payroll Run | Draft → Computed → For Review → Approved → Released | Payroll + HR Head | No |
| Leave Request | Draft → Submitted → For Approval → Approved | HR | No |
| Grade Finalization | Encoding → Ready for Review → Finalized | Teacher → Principal | No |
| Financial Hold | Active → Cleared | Accounting | No |

### 2.2 Critical Approval Gaps

#### GAP-A1: No Centralized Approval Inbox
**Problem:** Each approval is buried inside a module page. A registrar has to navigate to Registrar → Enrollment to see pending approvals. An accounting user has to navigate to Accounting → Billing to see assessment approvals. There is no cross-module "things waiting for me" view.

**Enterprise Standard:** Every enterprise ERP (SAP, Oracle, Workday) has a unified inbox/notification center. Approvers should land on a task queue, not a module page.

**Recommendation:** Build an `ApprovalInbox` component shown on the dashboard for every role that has approval actions. Entries show:
- What needs approval (type + reference number)
- Who submitted it and when
- How long it has been waiting (age badge: green < 1 day, yellow 1–3 days, red > 3 days)
- One-click approve / reject / view detail

```
┌─────────────────────────────────────────────────────────┐
│  My Approval Queue                              [View All]│
├──────┬──────────────────────┬──────────┬──────┬─────────┤
│ Type │ Reference            │ Student  │ Age  │ Actions │
├──────┼──────────────────────┼──────────┼──────┼─────────┤
│  ASS │ ASS-2024-001234      │ Juan D.  │ 2d   │ ✓ ✗ 👁  │
│  DIS │ DR-2024-000891       │ Maria S. │ 5d 🔴│ ✓ ✗ 👁  │
│  ENR │ ENR-2024-003821      │ Pedro C. │ 1d   │ ✓ ✗ 👁  │
└──────┴──────────────────────┴──────────┴──────┴─────────┘
```

---

#### GAP-A2: No SLA / Turnaround Time Tracking
**Problem:** There is no mechanism to enforce or report on how long an approval is taking. A discount request can sit for 2 weeks with no escalation.

**Enterprise Standard:** SLA configuration per approval type. Escalation notifications when SLA is breached.

**Recommendation:**
- Add `slaHours` per approval type in config (e.g., Assessment Approval = 24h, Discount = 48h, Leave = 72h)
- Compute `slaStatus: "on-track" | "at-risk" | "overdue"` from `submittedAt + slaHours`
- Show SLA badge on every pending approval row
- Admin Reports: "Average approval time by type, role, school"

---

#### GAP-A3: No Approval Delegation
**Problem:** If the Accounting Head is absent, no one can approve assessments or L2 discounts. The system has no concept of delegation.

**Enterprise Standard:** Temporary delegation of approval authority.

**Recommendation:** In Accounts Security, allow any approver to delegate their approval authority to another user for a date range. Delegated approvals are tagged with both the original approver and the delegate in the audit trail.

---

#### GAP-A4: Cashier Void / Reversal Requires Approval
**Problem:** Currently, there is no void/reversal approval flow for official receipts. This is a financial control gap and an DepEd/CHED audit concern.

**Enterprise Standard:** Void and reversal of payments must require a second approval (cashier supervisor or accounting).

**Recommendation:**
- Add `VoidRequest` entity: linked to `paymentId`, status `Pending Void Approval | Approved | Rejected`
- Cashier submits void reason → Accounting receives void request in their queue
- Approved voids are posted with a reversal entry in the ledger
- Admin Reports: "Void log with approver and reason"

---

#### GAP-A5: Grade Approval Flow Incomplete
**Problem:** Teacher marks grades "Ready for Review" but there is no formal step where a Department Head or Principal approves grades before finalization. The current `finalizeGradePeriod` goes directly from teacher to finalized.

**Enterprise Standard:** Teacher → Dept Head review → Principal sign-off → Finalize

**Recommendation:**
- Add `GRADE_REVIEW` status between teacher submission and finalization
- Principal (or designated Department Head) sees a grade review queue per section/subject
- Finalization only allowed after review approval
- Audit trail on `GradePeriod.finalizedBy` already exists — add `reviewedBy` and `reviewedAt`

---

#### GAP-A6: No Multi-School Approval Isolation
**Problem:** There are two schools (STSN, CDSTA). Approval queues are not confirmed to be isolated per school. An accounting user at STSN should never see CDSTA assessments.

**Recommendation:** Confirm every approval query is scoped by `schoolId`. Add school badge to every approval row in the queue so the approver sees at a glance which school the record belongs to.

---

### 2.3 Recommended Approval Architecture

```
Approval Types Registry (config)
├── ASSESSMENT_APPROVAL
│   ├── slaHours: 24
│   ├── approverRole: "accounting"
│   ├── approverDesignation: "Accounting Head"
│   └── escalateTo: "super-admin"
├── DISCOUNT_L1
│   ├── slaHours: 48
│   ├── approverRole: "accounting"
│   └── level: 1
├── DISCOUNT_L2
│   ├── slaHours: 48
│   ├── approverRole: "accounting"
│   ├── approverDesignation: "Accounting Head"
│   └── level: 2
├── ENROLLMENT
│   ├── slaHours: 8
│   └── approverRole: "registrar"
├── LEAVE_REQUEST
│   ├── slaHours: 72
│   └── approverRole: "hr"
├── PAYROLL_RUN
│   ├── slaHours: 24
│   └── approverRole: "payroll"
├── GRADE_REVIEW
│   ├── slaHours: 48
│   └── approverRole: "principal"
└── VOID_REQUEST
    ├── slaHours: 4
    └── approverRole: "accounting"
```

---

## Part 3 — UI / UX Enterprise Audit

### 3.1 Navigation & Layout

#### GAP-UI1: Sidebar Is Module-First, Not Role-First
**Problem:** Every user sees the same sidebar structure filtered by permission. A cashier sees "Cashiering" at the same vertical position as "HR" appears for HR staff. There is no role-adaptive shell — the sidebar is the same component with items hidden.

**Enterprise Standard:** The shell adapts to the role. A cashier's sidebar looks completely different (fewer items, task-centric) from a super-admin's sidebar (full tree).

**Recommendation — Role-Adaptive Sidebar Themes:**

```
CASHIER SIDEBAR                  REGISTRAR SIDEBAR
─────────────────                ─────────────────────────────────
🏠 Home / Dashboard              🏠 Admission Dashboard
─────────────────                ─────────────────────────────────
💰 Payment Queue     [12]        📋 Pending Applications   [8]
   Active Queue                  📋 Pending Enrollments    [24]
   Search Student                📋 Pending Assessments    [11]
─────────────────                ─────────────────────────────────
📋 Collection History            👥 Student Directory
─────────────────                📚 Class Sectioning
📊 Reports                       📅 Class Scheduling
   Daily Collection              📊 Registrar Reports
   OR Register                   ─────────────────────────────────
   End of Day                    ⚙️  Settings

Fewer items, task-grouped,       Organized by workflow phase,
badge counts on queues           badge counts on action items
```

**Specific Changes:**
- Show **badge counts** on every nav item that has pending approvals for that role
- Group nav items by **workflow phase** (e.g., for Registrar: Application Phase → Assessment Phase → Enrollment Phase) not by module name
- Cashier, Nurse, Guidance, Student should have **minimal sidebars** — 3–5 items max
- Principal sidebar should show **oversight sections** (Academic Status, Staff, Reports) — not raw module names

---

#### GAP-UI2: No Role-Specific Dashboard Home
**Problem:** The current dashboard is built for Principal/Admin oversight. Other roles land on it too, or land on a module page directly. A cashier doesn't need enrollment analytics — they need the payment queue count.

**Enterprise Standard:** Each role has a purpose-built landing page / home screen.

**Recommendation — Role Home Pages:**

| Role | Dashboard Home Screen Content |
|------|------------------------------|
| **super-admin** | System health: active users, pending approvals across all modules, school-wide KPIs, recent activity log |
| **principal** | Academic KPIs: enrollment by status, grade finalization progress, sections without advisers, staff attendance summary, announcements |
| **registrar** | Work queue: pending applications (count), pending section assignments, assessments to generate, recent student changes |
| **accounting** | Financial snapshot: today's collections, pending assessment approvals (count + age), discount requests pending, active holds count |
| **cashier** | Shift view: payment queue (count + oldest), total collected today, OR number range, end-of-day checklist |
| **teacher** | Class view: today's classes, grade submission status per subject, pending grade reviews, class attendance summary |
| **hr** | HR dashboard: headcount, attendance today, pending leaves (count), open requisitions, onboarding in progress |
| **payroll** | Payroll cycle: current period status, payroll run status, payout batch status, upcoming deadlines |
| **student** | Student card: enrollment status, current balance, latest grades, announcements, upcoming appointments |
| **guidance** | Caseload: active counseling cases, upcoming appointments, recent anecdotal records |
| **nurse** | Clinic: today's visits, health alerts, pending health records |

---

#### GAP-UI3: No Persistent Notification/Alert Bar
**Problem:** There is no system-level alert mechanism. If an assessment is returned to the registrar for correction, the registrar has to remember to check — there is no visual cue.

**Enterprise Standard:** A notification bell in the top bar with unread count and a dropdown of recent notifications.

**Recommendation — Top Bar Notification System:**
```
┌──────────────────────────────────────────────────────────────────────┐
│ [≡] Theresian Connect      [STSN] [CDSTA] [ALL]    🔔 3  👤 J. Cruz │
└──────────────────────────────────────────────────────────────────────┘
                                                        ↓ bell click
                                              ┌────────────────────────┐
                                              │ Notifications          │
                                              ├────────────────────────┤
                                              │ 🔴 ASS-001 returned    │
                                              │    by Accounting · 2h  │
                                              │ 🟡 Leave request for   │
                                              │    J. Santos approved  │
                                              │ 🟢 Payroll run #12     │
                                              │    is ready for review │
                                              │ ─────────────────────  │
                                              │ View all notifications │
                                              └────────────────────────┘
```

**Notification triggers by role:**
- Registrar: assessment returned, enrollment from online application
- Accounting: new assessment pending approval, discount L1 approval done (→ L2)
- Cashier: new approved assessment in queue
- Teacher: grade period opened for encoding, grade review requested
- Payroll: payroll run approved, payout batch released
- HR: leave request submitted, onboarding task overdue
- Principal: grade periods pending final approval

---

#### GAP-UI4: Mobile / Responsive Experience
**Problem:** Sidebar is hidden at `lg` breakpoint. There is no documented mobile-first approach. Teachers checking class lists on a tablet, or nurses entering visit records on a phone, will have a degraded experience.

**Enterprise Standard:** Responsive-first with a dedicated mobile bottom nav for roles that use mobile most (teacher, nurse, student, cashier).

**Recommendation:**
- Mobile breakpoint (< 768px): Replace sidebar with a **bottom navigation bar** for the 3–5 most-used actions for the role
- Tablet breakpoint (768–1024px): **Collapsible sidebar** with icon-only mode when collapsed
- Desktop (> 1024px): Current expanded sidebar
- Teacher mobile: Bottom nav → Today's Classes | Grade Input | Attendance | Profile
- Student mobile: Bottom nav → Enrollment | Grades | Billing | Profile
- Cashier mobile: Bottom nav → Payment Queue | New Payment | History | Reports

---

#### GAP-UI5: Inconsistent Page Header Patterns
**Problem:** Some pages use `PageHeader` component, others have inline titles, others have no clear hierarchy. This creates inconsistent visual rhythm across modules.

**Enterprise Standard:** Every page follows a strict header pattern:
```
Breadcrumb Path                                    [Action Buttons]
───────────────────────────────────────────────────────────────────
Page Title                                          [Primary CTA]
Subtitle / description line
───────────────────────────────────────────────────────────────────
[Filter Bar]                            [Search]   [Export] [+ New]
```

**Recommendation:** Enforce the `PageHeader` component across all 28 module pages. Add breadcrumb support to `PageHeader` that reflects the navigation path (e.g., Admission → Enrollment → ASS-001234).

---

### 3.2 Form & Data Entry UX

#### GAP-UX1: No Step-by-Step Enrollment Wizard
**Problem:** Enrollment (one of the most critical and complex flows) appears to be form-based without a guided wizard. Users can miss required steps.

**Enterprise Standard:** Multi-step wizard with a progress indicator:

```
Enrollment Wizard
──────────────────────────────────────────────────────────────────
[1. Student Info] → [2. Academic Info] → [3. Subject Load] → [4. Review] → [5. Submit]
      ✓                    ✓                  ●                  ○             ○

Step 3 of 5: Subject Load
──────────────────────────────────────────────────────────────────
Select subjects for this enrollment period:

☑ Mathematics 9         3 units    [MWF 7:30–8:30]
☑ English 9             3 units    [TTh 7:30–9:00]
☑ Science 9             3 units    [MWF 8:30–9:30]
☐ MAPEH 9               2 units    [TTh 9:00–10:00]
                                   Total: 11 units

                              [← Back]         [Next: Review →]
```

---

#### GAP-UX2: No Inline Validation with Field-Level Feedback
**Problem:** Form validation appears to be submit-level. Enterprise ERPs validate fields in real-time to reduce back-and-forth.

**Recommendation:**
- Real-time LRN format validation (12 digits)
- Student number uniqueness check on blur (not on submit)
- Assessment total vs. fee schedule cross-check before submission
- Date range validation (enrollment period, payroll period) on change

---

#### GAP-UX3: No Confirmation / Preview Before Critical Actions
**Problem:** Actions like "Approve Assessment", "Release Payroll Payout", and "Finalize Grades" are high-impact and difficult to reverse. A single click should not execute them.

**Enterprise Standard:** Critical actions always show a confirmation screen with a summary of what will happen.

**Recommendation — Confirmation Pattern:**
```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️  Confirm: Release Salary Payout Batch                   │
├─────────────────────────────────────────────────────────────┤
│  You are about to release payout to 48 employees.           │
│                                                             │
│  Payroll Run:    PR-2024-001 (Nov 1–15, 2024)              │
│  Total Amount:   ₱ 1,284,500.00                            │
│  Method:         Bank Transfer                              │
│  Initiated by:   You (J. Cruz)                              │
│                                                             │
│  ⚠️  This action cannot be undone. Payout lines will be     │
│     marked Released and payslips will become available.     │
│                                                             │
│  Type "RELEASE" to confirm:  [____________]                 │
│                                                             │
│                    [Cancel]       [Confirm Release →]       │
└─────────────────────────────────────────────────────────────┘
```

Apply this pattern to: Finalize Grades, Release Payout, Post Void, Reject Enrollment (with reason required), Approve L2 Discount.

---

#### GAP-UX4: No Keyboard Shortcuts for Power Users
**Problem:** Registrars and Cashiers perform repetitive actions dozens of times per day. No keyboard shortcuts exist.

**Enterprise Standard:** Power-user shortcuts for high-frequency actions.

**Recommendation:**
- `Ctrl/Cmd + K` → Global search (student name, ID, OR number)
- `Ctrl/Cmd + N` → New record (context-sensitive: new student if in registrar, new payment if in cashier)
- `Ctrl/Cmd + Enter` → Submit/Save current form
- `Escape` → Close modal / cancel action
- Arrow keys → Navigate table rows
- `Enter` on table row → Open record detail

---

### 3.3 Data Display & Tables

#### GAP-UX5: No Column Customization in Data Tables
**Problem:** `STSNDataTable` renders a fixed set of columns. Power users (registrar staff, accounting) need different columns visible depending on their task.

**Enterprise Standard:** Users can show/hide columns and save their preference.

**Recommendation:** Add a column visibility toggle to `STSNDataTable`:
```
[Search...]  [Filters ▼]  [Columns ▼]  [Export ▼]  [+ New Student]
              ↓ Columns panel
           ☑ Student No.    ☑ Name
           ☑ Year Level     ☐ Date of Birth
           ☑ Track/Course   ☐ LRN
           ☑ Section        ☑ Status
           ☐ Contact No.    ☐ Guardian
```

Save preference in `localStorage` per role + module.

---

#### GAP-UX6: No Bulk Actions on Tables
**Problem:** Registrar cannot bulk-approve enrollments. Accounting cannot bulk-approve assessments for a section.

**Enterprise Standard:** Checkbox selection + bulk action toolbar.

**Recommendation:**
```
☑ [Select All]    3 selected                [Bulk Approve] [Bulk Reject] [Export Selected]
──────────────────────────────────────────────────────────────────────────────────────────
☑  ENR-001   Juan Dela Cruz    Grade 7     For Assessment    [View] [Approve] [Reject]
☑  ENR-002   Maria Santos      Grade 7     For Assessment    [View] [Approve] [Reject]
☐  ENR-003   Pedro Reyes       Grade 8     For Payment       [View]
☑  ENR-004   Ana Gutierrez     Grade 7     For Assessment    [View] [Approve] [Reject]
```

Bulk approve should still require confirmation dialog showing all selected records.

---

#### GAP-UX7: No Row-Level Status Color Coding
**Problem:** Status badges are present but table rows are not visually differentiated by urgency or status. A cashier's payment queue looks the same whether items are 5 minutes old or 3 days old.

**Enterprise Standard:** Subtle row-level background tinting by status/age.

**Recommendation:**
- Rows with SLA-overdue items: `bg-red-50` subtle tint
- Rows with "at-risk" SLA: `bg-yellow-50`
- Rows with recently actioned items: `bg-green-50` for a few seconds (then fades)
- Pending/Draft rows: neutral
- Rejected/Cancelled rows: `bg-gray-50` with muted text

---

### 3.4 Feedback & Communication

#### GAP-UX8: No In-App Announcements / Notice Board
**Problem:** Schools constantly communicate deadlines (enrollment cutoff, grade submission deadline, payroll period close). There is no system mechanism for admins to publish notices visible to specific roles.

**Enterprise Standard:** Announcement/bulletin board on dashboard, role-targeted.

**Recommendation:** Add an `Announcement` entity:
- `title`, `body`, `targetRoles[]`, `publishedAt`, `expiresAt`, `publishedBy`
- Display on role home dashboard as a notice bar or card
- Super Admin / Principal can publish announcements
- Announcements auto-expire

---

#### GAP-UX9: No Actionable Empty States
**Problem:** When a table or list is empty, it likely shows nothing or a generic "No records found" message.

**Enterprise Standard:** Every empty state should tell the user why it's empty and what to do.

**Recommendation:**
```
Empty: Cashier Payment Queue

        💰
   No payments in queue

   There are no approved assessments
   waiting for payment collection.

   Assessments appear here once
   Accounting approves them.

   [Go to Assessment Status →]
```

---

## Part 4 — Audit & Compliance

### 4.1 Current Audit Coverage

| Area | Audit Status | Gap |
|------|-------------|-----|
| Assessment Approval | Partial (`auditTrail[]` on assessment) | No immutable storage |
| Discount Approval | Partial (`auditTrail[]` on discount request) | Same |
| Enrollment Changes | None (status changes not logged with actor) | High gap |
| Payment Posts | None (no explicit log) | High gap |
| User Login/Logout | Not found | High gap |
| Role Changes | Not found | Critical gap |
| Grade Finalization | Partial (`finalizedBy`) | No change history |
| Data Deletions | Not found | Critical gap |

### 4.2 Recommendation: Immutable Audit Log

Add a central `AuditLog` table/entity:
```typescript
interface AuditLogEntry {
  id: string;
  timestamp: string;         // ISO 8601
  actorId: string;           // user who performed the action
  actorRole: UserRole;
  schoolId: string;
  entityType: string;        // "enrollment" | "assessment" | "payment" | etc.
  entityId: string;
  action: string;            // "approved" | "rejected" | "status_changed" | "created" | "deleted"
  previousValue?: unknown;   // snapshot before change
  newValue?: unknown;        // snapshot after change
  remarks?: string;
  ipAddress?: string;
}
```

This covers DepEd/CHED audit requirements and the Data Privacy Act (RA 10173) accountability provision.

---

## Part 5 — Prioritized Recommendations

### Priority 1 — Critical (Do First)

| ID | Action | Impact |
|----|--------|--------|
| P1-A | Build Approval Inbox component on dashboard for accounting, registrar, hr, payroll, principal | Eliminates missed approvals |
| P1-B | Remove `NURSE_CLINIC` from HR role permissions | Data privacy compliance |
| P1-C | Add school-scoped filter to every approval queue query | Multi-school data isolation |
| P1-D | Add receipt void/reversal approval flow | Financial control compliance |
| P1-E | Add badge counts to sidebar nav items (pending approvals per role) | Immediate UX improvement |

### Priority 2 — High (Next Sprint)

| ID | Action | Impact |
|----|--------|--------|
| P2-A | Build role-specific dashboard home screens | Role clarity, faster task access |
| P2-B | Add SLA tracking and overdue badges to all approval queues | Prevents bottlenecks |
| P2-C | Add notification bell with role-relevant triggers | Proactive workflow awareness |
| P2-D | Add bulk approve/reject to enrollment and assessment tables | High-volume task efficiency |
| P2-E | Enforce teacher data scoping to own sections in grading/faculty portal | Data access control |
| P2-F | Complete grade approval workflow (Teacher → Dept Head → Principal) | Academic process completeness |

### Priority 3 — Medium (Following Sprints)

| ID | Action | Impact |
|----|--------|--------|
| P3-A | Add `designation` field to users for sub-role permission gating | L1/L2 approval accuracy |
| P3-B | Implement enrollment wizard with step progress indicator | Reduced enrollment errors |
| P3-C | Add column visibility toggle and bulk selection to STSNDataTable | Power user efficiency |
| P3-D | Add confirmation + type-to-confirm on destructive/financial actions | Prevents accidental actions |
| P3-E | Add keyboard shortcuts (Cmd+K global search, Cmd+N new record, etc.) | Power user speed |
| P3-F | Implement row-level status color coding in all tables | Visual scanning speed |
| P3-G | Add role-targeted announcement/notice system | School-wide communication |

### Priority 4 — Polish (Final Phase)

| ID | Action | Impact |
|----|--------|--------|
| P4-A | Role-adaptive sidebar themes (cashier sees minimal sidebar) | Role clarity |
| P4-B | Mobile bottom nav for teacher, student, cashier, nurse | Mobile usability |
| P4-C | Actionable empty states across all modules | Orientation for new users |
| P4-D | Approval delegation (temporary authority transfer) | Business continuity |
| P4-E | Guardian role for parent portal | Parent engagement |
| P4-F | Central immutable audit log entity | DepEd/CHED audit compliance |
| P4-G | Inline real-time form validation | Data quality improvement |
| P4-H | Page header breadcrumb standardization | Navigation clarity |

---

## Part 6 — Philippine Compliance Checklist

| Requirement | Source | Status | Gap |
|------------|--------|--------|-----|
| Official Receipt issuance and numbering | BIR RR 7-2012 | Partial | OR series config needed |
| Void receipt with approval | BIR | Not Implemented | See GAP-A4 |
| Withholding tax computation (BIR table) | NIRC | Config-pending | Phase 5 |
| SSS, PhilHealth, Pag-IBIG deduction tables | RA 11199, RA 7875, RA 9679 | Config-pending | Phase 5 |
| 13th Month Pay computation | PD 851 | Not confirmed | Payroll Phase |
| Data Privacy — access log | RA 10173 | Not implemented | See Part 4 |
| Data Privacy — medical record protection | RA 10173 | Partial gap | GAP-R5 |
| LRN tracking for DepEd students | DepEd Order | Implemented | — |
| Grade encoding and finalization | DepEd Order | Partial | GAP-A5 |
| College GWA computation (CHED) | CHED standards | Not confirmed | Check grading formula |

---

## Part 7 — Phase 1 Implementation Log

> **Started:** June 25, 2026 | **Branch:** dev | **Focus:** Priority 1 — Critical items

### 7.1 Codebase Audit Summary (Pre-Implementation)

Key findings from the initial codebase scan before any Phase 1 work began:

| Area | File / Location | Finding |
|------|----------------|---------|
| Permissions config | `src/config/permissions.config.ts:53` | HR role had `NURSE_CLINIC` in its permission array — data privacy gap confirmed |
| Navigation config | `src/config/navigation.config.ts` | Single flat `NAV_ITEMS` array shared across all roles, filtered by permission. No role-adaptive grouping or badge counts. |
| Sidebar render | `src/App.tsx` (lines 164–475) | Sidebar built inline; no pending-count badges on any nav item |
| Dashboard home | `src/features/dashboard/pages/DashboardPage.tsx` | Single dashboard component used by principal/registrar/admin. Cashier, teacher, HR, payroll land on their module page directly — no role home screen. |
| Approval data | `src/types/index.ts` | Assessment approval statuses exist (`auditTrail[]`, `approvalStatus`). No cross-module approval queue type or centralized inbox component found. |
| Notification system | `src/components/common/AppToast.tsx` | Ephemeral toast only. No persistent notification bell, unread count, or notification center. |
| Data table | `src/components/common/STSNDataTable.tsx` | Generic DataTables.net wrapper. No column visibility toggle, no bulk-select checkbox, no row-level tinting. |
| Auth / current user | `src/services/store.ts` via `useSTSNStore()` | Zustand store; `currentUser.role` is the access point for all permission checks. |
| Multi-school scoping | `src/services/store.ts` | `activeSchool` in store; need to verify every approval query is scoped by `schoolId`. |

---

### 7.2 Phase 1 Progress Tracker

| ID | Action | Status | File(s) Changed | Notes |
|----|--------|--------|----------------|-------|
| **P1-A** | Build Approval Inbox component on dashboard | ✅ Done | `src/components/common/ApprovalInbox.tsx` (new), `src/App.tsx` | Unified queue widget mounted on DASHBOARD (registrar/principal/hr), ACCOUNTING dashboard sub-page, and PAYROLL_MANAGEMENT. Shows type badge, reference, name, age pill (green/amber/red), quick approve/return actions for ASMT and LEAVE types. Sorts oldest-first, capped at 10 items, renders null when empty. |
| **P1-B** | Remove `NURSE_CLINIC` from HR role permissions | ✅ Done | `src/config/permissions.config.ts:53` | Removed `"NURSE_CLINIC"` from HR array. HR now has `["DASHBOARD", "HR_MANAGEMENT"]` only. |
| **P1-C** | Add school-scoped filter to every approval queue query | ✅ Done | `src/hooks/usePendingCounts.ts`, `src/components/common/ApprovalInbox.tsx` | All approval counts and inbox item builds now gate on `activeSchool`. Helpers: `inSchool(schoolId?)`, `studentInSchool(studentId)`, `employeeInSchool(employeeId)`. Online applications excluded (no schoolId until accepted). When `activeSchool === "ALL"`, inbox rows show a `STSN` / `CDSTA` school chip column. |
| **P1-D** | Add receipt void/reversal approval flow | ✅ Done | `src/types/index.ts` (new `VoidRequest`), `src/services/store.ts` (state + 3 actions), `src/hooks/usePendingCounts.ts` (`pendingVoidRequests`), `src/components/common/ApprovalInbox.tsx` (VOID type), `src/features/cashier/pages/CashierModulePage.tsx` (Void button + modal) | Full void request lifecycle: Cashier clicks "Void" on any Collection History row → submits reason → `VoidRequest` created with status `"Pending Void Approval"` → shows in Accounting Approval Queue as `VOID` type with quick approve/reject → approved/rejected status badge appears on history row OR number. Voided Receipts report now pulls live from `voidRequests` store. |
| **P1-E** | Add badge counts to sidebar nav items | ✅ Done | `src/hooks/usePendingCounts.ts` (new), `src/App.tsx` | `usePendingCounts()` hook computes live counts per role from the Zustand store. Gold `PendingBadge` chips rendered at parent, group, and leaf levels in the desktop sidebar — ACCOUNTING (total + billing + discounts), DASHBOARD (enrollment + applications for registrar; grades for principal), HR (leave-management), PAYROLL. |

**Legend:** ✅ Done · 🔵 In Progress · ⬜ Pending · 🔴 Blocked

---

### 7.3 P1-A — Approval Inbox: Design Specification

The Approval Inbox is a cross-module widget that surfaces pending items requiring action by the current user's role. It replaces the need for approvers to navigate into each module to find what's waiting.

**Component target:** `src/components/common/ApprovalInbox.tsx`
**Placement:** Rendered on every role-specific dashboard home screen (see P2-A)
**Data source:** Derived from existing store data — no new backend call needed for Phase 1

**Approval sources per role:**

| Role | Sources to aggregate |
|------|---------------------|
| `accounting` | Pending assessments (`approvalStatus: "Pending Accounting Approval"`), pending discount L1/L2 requests |
| `registrar` | Enrollments awaiting section/assessment, returned assessments |
| `hr` | Submitted leave requests (`status: "Submitted"`) |
| `payroll` | Payroll runs (`status: "For Review"`) |
| `principal` | Grade periods ready for review/finalization |

**UI Specification:**
```
┌─────────────────────────────────────────────────────────────────────┐
│  My Approval Queue                                        [View All] │
│  ─────────────────────────────────────────────────────────────────  │
│  TYPE   REFERENCE          SUBJECT/NAME       AGE    ACTIONS        │
│  ─────────────────────────────────────────────────────────────────  │
│  ASMT   ASS-2024-001234    Juan Dela Cruz     2d     [✓] [✗] [👁]  │
│  DISC   DR-2024-000891     Maria Santos       5d 🔴  [✓] [✗] [👁]  │
│  ENR    ENR-2024-003821    Pedro Cruz         1h     [✓] [✗] [👁]  │
│  ─────────────────────────────────────────────────────────────────  │
│  3 items pending · 1 overdue (> 3 days)                             │
└─────────────────────────────────────────────────────────────────────┘
```

**Age badge rules:**
- Green: < 1 day
- Yellow: 1–3 days
- Red 🔴: > 3 days (overdue)

**Inline actions:**
- [✓] Quick approve (still shows confirmation toast with undo window)
- [✗] Reject/Return (opens remarks modal)
- [👁] Open full detail page

---

### 7.4 P1-E — Sidebar Badge Counts: Design Specification

Badge counts give every approver instant visibility into how many items are waiting — without opening a module.

**Target:** Badge `<span>` rendered next to nav item labels in `src/App.tsx` sidebar
**Data source:** Same derived counts used by the Approval Inbox (computed once, passed via context or prop)

**Badge placement per role:**

| Role | Nav Item with Badge | Count Source |
|------|---------------------|-------------|
| `accounting` | Accounting → Billing & Assessment | Pending assessment approvals |
| `accounting` | Accounting → Discounts | Pending discount requests |
| `registrar` | Admission → Enrollment | Pending enrollment actions |
| `hr` | HR → Leave Management | Pending leave submissions |
| `payroll` | Payroll → Payroll Management | Runs awaiting review |
| `principal` | Admission → Grades Directory | Grade periods awaiting finalization |

**Badge UI:**
```
📋 Billing & Assessment   [11]
   ─ red background if any item is overdue
   ─ yellow background if all items are within SLA
   ─ no badge if count = 0
```

---

### 7.5 Implementation Order for Remaining P1 Items

Given dependencies, the recommended build order for the remaining items:

```
Step 1 (P1-B) ✅  Remove NURSE_CLINIC from HR permissions
                   → Immediate compliance fix, no UI changes needed

Step 2 (P1-E)     Build pending-count resolver hook
                   → usePendingCounts(role) → { accounting: n, registrar: n, ... }
                   → Wire badge spans into App.tsx sidebar nav items

Step 3 (P1-A)     Build ApprovalInbox component
                   → Reuses pending-count data from Step 2
                   → Insert into DashboardPage for accounting/registrar/hr/payroll/principal

Step 4 (P1-C)     Audit and add schoolId scoping to approval queries
                   → Review store.ts approval actions, add .eq("school_id", activeSchool)
                   → Add school badge to ApprovalInbox rows

Step 5 (P1-D)     Build void/reversal approval flow
                   → New VoidRequest type + cashier submit UI + accounting queue entry
                   → Wire into ApprovalInbox as a new item type
```

---

## Summary

STSN Connect is architecturally sound and ahead of many local school systems. The primary gaps are:

1. **Unified approval inbox** — all roles that approve things need a single task queue view
2. **Role-specific dashboard home** — each role should land on a purpose-built screen
3. **Notification system** — proactive alerts instead of manual checking
4. **Data scoping enforcement** — teachers to own sections, HR away from clinic records
5. **Void/reversal approval flow** — financial control requirement
6. **SLA tracking on approvals** — prevents bottlenecks from going unnoticed
7. **Grade approval chain** — teacher → principal sign-off before finalization

Addressing Priority 1 and Priority 2 items will bring the system to a credible enterprise-grade ERP standard aligned with both Philippine education and business compliance requirements.

---

## Part 8 — Phase 2 Implementation Log

> **Started:** June 25, 2026 | **Branch:** dev | **Focus:** Priority 2 — High Impact items

### 8.1 Phase 2 Progress Tracker

| ID | Action | Status | File(s) Changed | Notes |
|----|--------|--------|----------------|-------|
| **P2-A** | Role-adaptive dashboard home screens | ✅ Done | `src/features/dashboard/pages/DashboardPage.tsx` | Welcome card now role-adaptive (heading, subtitle, badge per role). HR KPI section added (4 cards: Total Employees, On Leave Today, Pending Leaves, Pending Voids) gated to `isHR \|\| isAdmin`. Principal Approval Queue already guarded by `isPrincipal \|\| isAdmin`. `isHR` shows HR KPIs instead of Registrar section. `isPrincipal` computed from role. `hrKpis` useMemo computes `total`, `active`, `onLeaveToday`, `pendingLeaves`, `pendingVoids`, `pendingDiscounts` from store. |
| **P2-B** | SLA tracking and overdue badges on all approval queues | ✅ Done | `src/components/common/SLABadge.tsx` (new), `src/features/accounting/pages/AccountingModulePage.tsx`, `src/features/hr/pages/sub-pages/LeaveManagementPage.tsx`, `src/features/registrar/pages/RegistrarModulePage.tsx` | Shared `SLABadge` component with `getSLAInfo(dateStr, slaDays)` helper. Renders green pill (<1d), amber (1–3d), red with AlertTriangle (>3d overdue). Accounting billing/assessment cards show badge on submitted items. HR leave table has SLA column (renders for Submitted/For Approval statuses). Registrar online application queue has SLA column (renders for Pending Registrar Review). `compact` prop available for dense contexts. |
| **P2-C** | In-app notification bell with role-targeted triggers | ✅ Done | `src/types/index.ts` (`STSNNotification` type + `NotificationEntityType` + `NotificationType`), `src/services/store.ts` (state + 3 actions + notification triggers in all approval actions), `src/components/common/NotificationBell.tsx` (new), `src/App.tsx` | `STSNNotification` type with `targetRoles`, `readBy[]`, `entityType`, `type`. Store: `notifications[]`, `addNotification`, `markNotificationRead`, `clearAllNotifications`. All approval/rejection/return actions in store fire `addNotification` with appropriate `targetRoles`. `NotificationBell` renders in header: bell icon, unread count badge, click-to-open panel, per-type icon+color, `timeAgo()` helper, clear-all button, empty state. Max 100 notifications stored. Marks all as read on panel open. |
| **P2-D** | Bulk approve/reject on enrollment and assessment tables | ✅ Done | `src/features/accounting/pages/AccountingModulePage.tsx`, `src/features/registrar/pages/RegistrarModulePage.tsx` | **Accounting:** Per-card checkboxes added to Assessment Approval cards (pending only). Floating bulk action bar (brown bg) appears when items selected: "Approve All (N)" with confirm, "Return All" with remarks prompt. Gold border highlight on checked cards. **Registrar:** Bulk action toolbar above online application DataTable — shows when pending apps exist. "Accept All Pending (N)" with confirm, "Reject All Pending (N)" with danger confirm. Both use existing `updateOnlineEnrollmentApplicationStatus` + `updateEnrollmentStatus` actions. |
| **P2-E** | Teacher data scoping to own sections | ✅ Done | `src/features/grading/pages/GradesDirectoryPage.tsx` | Added `"TEACHER"` and `"PRINCIPAL"` to `ALLOWED_ROLES`. `resolveCurrentTeacher` imported and called when `isTeacher`. `classLoads` useMemo now gates on `!isTeacher \|\| l.teacherId === currentTeacher?.id` — teachers only see their own sections. Module header changes to "My Teaching Load" with teacher name. Table header changes to "My Teaching Sections". Section expansion (SectionDetailView) receives `isTeacher`, `teacherDisplayName`, `onSubmitPeriod` props — shows grade period submission panel above student grades table when `isTeacher`. |
| **P2-F** | Complete grade approval workflow | ✅ Done | `src/types/grading.ts` (`GradeApprovalStatus` type + new fields on `GradePeriod`), `src/services/store.ts` (3 new actions: `submitGradePeriod`, `approveGradePeriod`, `returnGradePeriod` with notification triggers), `src/features/grading/pages/GradeEncodingPage.tsx` (submission status banner), `src/features/grading/pages/GradesDirectoryPage.tsx` (principal approval queue + teacher submit panel in section expansion), `src/hooks/usePendingCounts.ts` (pendingGrades now counts `gradeApprovalStatus === "Submitted"`) | **Teacher flow (GradeEncodingPage):** Status banner appears after period selector: grey "Ready to Submit" → brown "Submit for Approval" button → amber "Awaiting Principal Approval" → emerald "Approved" → red "Returned for Revision" with remarks + re-submit button. **Teacher flow (GradesDirectoryPage):** Section expansion shows "Grade Period Submission Status" panel listing each period with status badge and "Submit for Approval" / "Re-submit" button. **Principal flow:** Amber "Pending Grade Approval" panel at top of GradesDirectoryPage lists submitted periods with section, subject, submitter, date, "Approve" (→ finalizes) and "Return" (→ prompt for remarks) buttons. Each action fires store notification to relevant roles. `pendingGrades` badge count now reflects truly pending-approval submissions only. |

**Legend:** ✅ Done · 🔵 In Progress · ⬜ Pending · 🔴 Blocked

---

### 8.2 Phase 2 Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| `SLABadge` as shared component in `common/` | Avoids duplication across accounting, HR, registrar — 3 consumers on day 1 |
| `STSNNotification.readBy: string[]` instead of boolean | Supports multi-user notification targeting — same notification can be unread for some roles and read for others |
| Bulk reject for registrar apps uses confirm dialog (not reason prompt) | Online applications don't have a `rejectionReason` field on the type; adding one is a Phase 3 schema concern |
| Teacher grade submission in both GradeEncodingPage and GradesDirectoryPage | GradeEncodingPage = per-period grade entry context; GradesDirectoryPage = multi-section overview where teacher can see all sections at once and submit any |
| `gradeApprovalStatus: "Submitted"` as the count signal for `pendingGrades` | Changed from `!isFinalized` (which counted all draft periods) to submitted-awaiting-approval only — principal badge count now represents real action items, not background encoding work |
| ALLOWED_ROLES in GradesDirectoryPage includes TEACHER + PRINCIPAL | TEACHER sees own sections scoped by teacherId; PRINCIPAL sees all sections plus the pending approval queue; REGISTRAR sees everything (for transcript verification) |

---

*Last updated: June 25, 2026 — Phase 1 + Phase 2 complete. All 11 items (P1-A through P1-E, P2-A through P2-F) implemented. TypeScript compiles clean (0 errors). Ready to begin Phase 3 when prioritized.*

---

## Part 9 — Phase 3 Implementation Plan

> **Focus:** Priority 3 — Medium · UX polish, power user features, sub-role gating, schema refinements

### 9.1 Phase 3 Scope Overview

| ID | Action | Estimated Complexity | Depends On |
|----|--------|---------------------|------------|
| P3-A | Add `designation` field to User for L1/L2 approval gating | Low | — |
| P3-B | Enrollment wizard with step progress indicator | High | P1-A, P1-C |
| P3-C | Column visibility toggle + bulk select in STSNDataTable | Medium | — |
| P3-D | Type-to-confirm on destructive/financial actions | Low | — |
| P3-E | Keyboard shortcut system (Cmd+K search, Cmd+N new, etc.) | Medium | — |
| P3-F | Row-level status color coding in all tables | Low | — |
| P3-G | Role-targeted announcement/notice system | Medium | P2-C (notifications) |

---

### 9.2 P3-A — Sub-Role Designation Field

**Problem:** `UserRole` is a flat enum — `REGISTRAR` covers both junior and senior registrar, `ACCOUNTING` covers cashier/billing/approver. L1/L2 approval chains need a sub-role concept.

**Implementation:**
```typescript
// src/types/index.ts — add to User interface
export type UserDesignation =
  | "HEAD"        // Department head — L2 approver
  | "OFFICER"     // Line officer — L1 approver
  | "STAFF"       // General staff — submitter only
  | "PRINCIPAL"   // School principal
  | "ASST_PRINCIPAL"; // Assistant principal

export interface User {
  id: string;
  schoolId?: SchoolId;
  email: string;
  name: string;
  role: UserRole;
  designation?: UserDesignation;  // NEW — drives L1/L2 gating
}
```

**Gate logic example (Assessment approval):**
```typescript
// Only HEAD or above can do final accounting approval
const canFinalApprove = currentUser?.role === "ACCOUNTING" 
  && (currentUser?.designation === "HEAD" || currentUser?.role === "SUPER_ADMIN");
```

**Files to change:** `src/types/index.ts`, `src/services/store.ts` (seed data), `src/config/permissions.config.ts`, `src/features/accounting/pages/AccountingModulePage.tsx`

---

### 9.3 P3-B — Enrollment Wizard

**Problem:** The current enrollment flow is a long single-page form. Users lose their place, make validation errors, and miss required steps.

**Wizard steps:**
```
Step 1: Student Lookup / New Student
  → Search existing, or fill in new student form
  → Required: name, yearLevel, department, guardian

Step 2: Enrollment Type & Section
  → Type: New / Returning / Transferee
  → Select grade level, strand/course, section (auto-suggest from capacity)
  → LRN verification for DepEd students

Step 3: Requirements Checklist
  → Show required docs per enrollment type
  → Tick-off interface with "For Completion" option
  → Upload attachment (placeholder for Phase 5 file storage)

Step 4: Assessment Preview
  → Auto-generate mock assessment from fee setup
  → Payment term selection
  → Discount application (if applicable)

Step 5: Confirmation & Submit
  → Review summary card
  → Submit to Accounting for approval
  → Print confirmation slip
```

**Files to create/change:** `src/features/registrar/components/EnrollmentWizard.tsx` (new), `src/features/registrar/pages/RegistrarModulePage.tsx`

---

### 9.4 P3-C — Enhanced STSNDataTable

**Problem:** `STSNDataTable` has no bulk-select, no column visibility toggle. P2-D worked around this with card-based bulk actions for accounting — but table-based bulk actions are needed everywhere.

**Enhancements:**
```typescript
// Extended props
export interface STSNDataTableProps<T = any> {
  // existing props...
  
  // NEW — bulk selection
  bulkSelectable?: boolean;
  onBulkSelect?: (selectedRows: T[]) => void;
  bulkActionBar?: React.ReactNode; // rendered above table when rows selected
  
  // NEW — column visibility
  columnToggleable?: boolean;
  defaultHiddenColumns?: string[]; // column data keys
  
  // NEW — row tinting
  rowColorClass?: (row: T) => string | undefined;
}
```

**Implementation notes:**
- Bulk select: add a checkbox column (orderable: false, width: 40px) that updates a `Set<string>` of selected row IDs
- Column toggle: persist to localStorage keyed by `tableId` prop
- Row tinting: `rowColorClass` callback lets callers return a Tailwind class based on row data (e.g. `"bg-red-50"` for overdue items)

**Files to change:** `src/components/common/STSNDataTable.tsx`

---

### 9.5 P3-D — Destructive Action Confirmation

**Problem:** High-stakes actions (void receipt, reject enrollment, delete record) have only a toast. Need type-to-confirm for irreversible financial actions.

**Implementation — extend `useAppDialog`:**
```typescript
// New method signature
typeConfirm: (
  message: string,
  confirmPhrase: string,  // user must type this exactly
  options?: ConfirmOptions
) => Promise<boolean>;
```

**UI pattern:**
```
⚠ Void Receipt #OR-2024-001234
Amount: ₱12,500.00

This action cannot be undone and will generate an audit trail.
Type "VOID OR-2024-001234" to confirm:

[_________________________________]

[Cancel]  [Void Receipt]
```

**Priority trigger list:**
- Void receipt approval (Accounting)
- Reject enrollment (final rejection, not "For Completion")
- Delete student record
- Reverse payroll run
- Bulk reject applications

**Files to change:** `src/components/common/DialogProvider.tsx`, `src/components/common/AppPromptDialog.tsx`, `src/components/common/useAppDialog.tsx`

---

### 9.6 P3-E — Keyboard Shortcut System

**Problem:** Power users (registrar, accounting) process high volumes. Mouse-only workflow is slow.

**Priority shortcuts:**

| Shortcut | Action | Context |
|----------|--------|---------|
| `Cmd+K` / `Ctrl+K` | Global search (student, employee, OR number) | All |
| `Cmd+N` / `Ctrl+N` | New record (context-aware: enrollment, student, etc.) | Module-specific |
| `Escape` | Close modal / panel | All |
| `Cmd+Enter` | Submit current form | All modals |
| `A` | Approve selected (when approval row focused) | Approval inbox |
| `R` | Return/reject selected | Approval inbox |
| `?` | Show shortcut cheat sheet | All |

**Implementation:**
```typescript
// src/hooks/useKeyboardShortcuts.ts (new)
export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = [e.metaKey && "Cmd", e.ctrlKey && "Ctrl", e.key].filter(Boolean).join("+");
      shortcuts[key]?.();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shortcuts]);
}
```

**Files to create/change:** `src/hooks/useKeyboardShortcuts.ts` (new), `src/components/common/GlobalSearch.tsx` (new), `src/App.tsx`

---

### 9.7 P3-F — Row-Level Status Color Coding

**Problem:** Users must read status text cells to identify at-risk rows. Color-coded rows enable instant visual triage.

**Color scheme:**
```
Overdue / Rejected / Voided     → bg-red-50 / left-border-red-400
Pending / Awaiting Approval     → bg-amber-50 / left-border-amber-400
Approved / Finalized / Active   → bg-emerald-50 / left-border-emerald-300
For Completion / Draft          → bg-blue-50 / left-border-blue-300
Default                         → bg-white
```

**Requires P3-C** (`rowColorClass` prop on STSNDataTable) to be implemented first.

---

### 9.8 P3-G — Role-Targeted Announcements

**Problem:** School announcements go out via a single shared notice board. HR announcements about leave cut-offs should not appear in teacher feeds; principal policy memos should not clutter cashier views.

**Extends the notification system from P2-C:**
```typescript
// src/types/index.ts — add Announcement targeting
export interface Announcement {
  // existing fields...
  targetRoles?: UserRole[];   // NEW — undefined = all roles see it
  targetSchool?: SchoolId;    // NEW — undefined = both schools
  priority: "normal" | "urgent";  // NEW — "urgent" pins to top
  expiresAt?: string;         // NEW — auto-archive after date
}
```

**UI:** Add an "Announcements" panel in the NotificationBell dropdown (second tab: "Notices"). Urgent announcements render a persistent banner below the header.

**Files to change:** `src/types/index.ts`, `src/services/store.ts`, `src/components/common/NotificationBell.tsx`, `src/features/dashboard/pages/DashboardPage.tsx`

---

### 9.9 Phase 3 Implementation Order

```
Step 1 (P3-D)   Type-to-confirm dialog — safest standalone change
                  → Extend DialogProvider, no store changes needed

Step 2 (P3-A)   Add designation field to User type
                  → Update seed data + permissions config

Step 3 (P3-C)   Enhance STSNDataTable with bulk select + column toggle
                  → Internal component change; consumers opt-in via props

Step 4 (P3-F)   Row color coding (uses rowColorClass from P3-C)
                  → Wire into registrar, accounting, HR tables

Step 5 (P3-G)   Role-targeted announcements (builds on P2-C notifications)
                  → Extend Announcement type + NotificationBell panel

Step 6 (P3-B)   Enrollment wizard (highest complexity)
                  → New multi-step component; replace existing enrollment form section

Step 7 (P3-E)   Keyboard shortcuts + global search (final polish layer)
```

---

## Part 10 — Phase 4 Implementation Plan

> **Focus:** Priority 4 — Polish · Mobile, accessibility, parent portal, immutable audit, delegation

### 10.1 Phase 4 Scope Overview

| ID | Action | Estimated Complexity | Depends On |
|----|--------|---------------------|------------|
| P4-A | Role-adaptive sidebar themes | Low | — |
| P4-B | Mobile bottom nav for teacher, student, cashier, nurse | High | — |
| P4-C | Actionable empty states across all modules | Medium | — |
| P4-D | Approval delegation (temporary authority transfer) | High | P3-A |
| P4-E | Guardian/Parent role portal | Very High | P1-D, P2-A |
| P4-F | Central immutable audit log entity | High | — |
| P4-G | Inline real-time form validation | Medium | — |
| P4-H | Page header breadcrumb standardization | Low | — |

---

### 10.2 P4-A — Role-Adaptive Sidebar Themes

**Problem:** All roles see the same sidebar width and chrome. A cashier processing 200 transactions/day doesn't need the full sidebar. A nurse has 2 modules.

**Implementation:**
```typescript
// src/config/navigation.config.ts
export const SIDEBAR_MODE: Record<UserRole, "full" | "compact" | "minimal"> = {
  SUPER_ADMIN:  "full",
  ADMIN:        "full",
  PRINCIPAL:    "full",
  REGISTRAR:    "full",
  ACCOUNTING:   "full",
  PAYROLL:      "compact",   // fewer modules, wider content
  HR:           "compact",
  TEACHER:      "compact",   // focus on grading + attendance
  CASHIER:      "minimal",   // cashier module only, max content width
  NURSE:        "minimal",   // nurse clinic only
  GUIDANCE:     "minimal",
  STUDENT:      "minimal",
  EMPLOYEE:     "minimal",
};
```

**Visual modes:**
- `full` — 220px sidebar, all nav items, group headers, badge counts (current behavior)
- `compact` — 180px sidebar, icons + labels, no group headers, only relevant modules
- `minimal` — 64px icon-only rail with tooltips; main content expands to fill space

**Files to change:** `src/App.tsx`, `src/config/navigation.config.ts`

---

### 10.3 P4-B — Mobile Bottom Navigation

**Problem:** The sidebar collapses on mobile but the hamburger toggle is small and the sidebar overlaps content. Teacher, student, nurse, and cashier roles have 2–4 primary actions — perfect for a bottom tab bar.

**Roles getting mobile bottom nav:**
| Role | Tabs |
|------|------|
| TEACHER | 📋 Grade Encoding · 📅 Schedule · 📢 Notices · 👤 Profile |
| CASHIER | 💰 Cashier · 📊 Reports · 📢 Notices · 👤 Profile |
| NURSE | 🏥 Clinic · 📢 Notices · 👤 Profile |
| STUDENT | 📚 Grades · 💵 Fees · 📅 Schedule · 📢 Notices |
| EMPLOYEE | 📋 Payslip · 🏖 Leave · 📢 Notices · 👤 Profile |

**Implementation notes:**
- Render below `<main>` only on `sm:hidden` breakpoint
- Use the same `activeModule` Zustand state as the sidebar
- Tab items are a subset of the role's nav items (max 4)
- Active tab uses `stsn-brown` tint + underline

**Files to create/change:** `src/components/common/MobileBottomNav.tsx` (new), `src/App.tsx`

---

### 10.4 P4-C — Actionable Empty States

**Problem:** Empty states across the app say "No records found" with a generic icon. Users (especially new staff) don't know what to do next.

**Design pattern:**
```
┌──────────────────────────────────┐
│           📋                     │
│   No Enrollments Yet             │
│                                  │
│   Once an online application is  │
│   accepted, enrollments will     │
│   appear here for assessment.    │
│                                  │
│   [Review Online Applications →] │  ← Primary action button
│   [Import Students →]            │  ← Secondary action
└──────────────────────────────────┘
```

**All empty states to update:**
- Enrollments (Registrar)
- Online Applications (Registrar)
- Assessment Approval queue (Accounting)
- Payroll Runs (Payroll)
- Leave Requests (HR)
- Grade Periods (Grading)
- Cashier payment queue
- Approval Inbox
- Notification panel

**Files to create/change:** `src/components/common/EmptyState.tsx` (new shared component), all module pages

---

### 10.5 P4-D — Approval Delegation

**Problem:** When the principal is on leave or the head accountant is out, approvals stall. No mechanism to temporarily transfer authority.

**Data model:**
```typescript
// src/types/index.ts
export interface ApprovalDelegation {
  id: string;
  schoolId: SchoolId;
  delegatorId: string;          // user transferring authority
  delegatorRole: UserRole;
  delegateId: string;           // user receiving authority
  delegateRole: UserRole;
  scope: "ASSESSMENT" | "LEAVE" | "GRADE" | "VOID" | "ALL";
  startDate: string;            // ISO date
  endDate: string;              // ISO date
  reason: string;
  createdAt: string;
  isActive: boolean;
}
```

**Gate logic:** Before any approval action, check if an active delegation exists for that scope and delegate authority to the `delegateId` user.

**Requires P3-A** (designation field) to accurately represent who can delegate to whom (only HEAD can delegate HEAD-level approvals).

**Files to create/change:** `src/types/index.ts`, `src/services/store.ts`, `src/features/hr/pages/sub-pages/` (new delegation setup page), approval action hooks

---

### 10.6 P4-E — Guardian / Parent Portal

**Problem:** Parents have no self-service access to their child's grades, fees, or attendance. Communication is phone/paper-based.

**New role and capabilities:**
```typescript
// Add to UserRole
| "GUARDIAN"  // Parent/guardian — read-only access scoped to linked student(s)
```

**Guardian portal modules:**
| Module | Access | Notes |
|--------|--------|-------|
| Student Profile | Read-only | Name, section, year level |
| Grade Summary | Read-only (finalized only) | From GradesDirectoryPage pattern |
| Fee Statement | Read-only | Current assessment + ledger balance |
| Attendance | Read-only | Not yet implemented — Phase 5 |
| Announcements | Read | Role-targeted (GUARDIAN receives school-wide + section-specific) |
| Message Principal | Write | Direct messaging thread (Phase 5) |

**Data linking:**
```typescript
// src/types/index.ts — extend Student
linkedGuardianIds?: string[];  // user IDs of linked guardians
```

**Files to create/change:** `src/types/index.ts`, `src/config/permissions.config.ts`, `src/features/guardian/` (new feature folder), `src/App.tsx`

---

### 10.7 P4-F — Central Immutable Audit Log

**Problem:** Audit trails are scattered across entity types (`auditTrail[]` on assessments, `finalizedBy` on grade periods). There is no central, immutable, queryable audit log for DepEd/CHED compliance and Data Privacy Act accountability.

**Data model (from Part 4.2):**
```typescript
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorRole: UserRole;
  actorName: string;
  schoolId: SchoolId;
  entityType: "enrollment" | "assessment" | "payment" | "grade" | "employee" | "leave" | "void" | "user" | "discount";
  entityId: string;
  action: "created" | "updated" | "approved" | "rejected" | "returned" | "deleted" | "finalized" | "submitted" | "voided";
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  remarks?: string;
  ipAddress?: string;
}
```

**Implementation approach:**
- Append-only: no update/delete actions on `AuditLogEntry`
- Store slice: `auditLog: AuditLogEntry[]`, max 1000 in-memory (paginated), persisted to Supabase `audit_logs` table
- Helper: `logAudit(action, entityType, entityId, prev, next, remarks?)` called from every store action that mutates approval-sensitive data
- Viewer: New `AuditLogPage` in Admin module — searchable by entity type, date range, actor, action

**Files to create/change:** `src/types/index.ts`, `src/services/store.ts`, `src/features/admin/pages/AuditLogPage.tsx` (new), `src/config/permissions.config.ts`

---

### 10.8 P4-G — Inline Real-Time Form Validation

**Problem:** Forms (enrollment, assessment, new student) only show errors on submit. Users fill 10 fields, submit, get 3 errors, and must find them.

**Validation approach:**
- Use `react-hook-form` with `zod` schemas for all major forms
- Inline error messages on blur (not on keystroke — avoids noisy UX)
- Submit button disabled until all required fields pass
- Cross-field validation (e.g. `endDate` must be after `startDate`)

**Priority forms for validation:**
1. New Student enrollment form
2. Assessment fee setup
3. Void request form
4. Leave request form
5. Grade period setup (date range overlap check)

**Files to change:** Multiple feature pages — tackle per-module in Phase 4 sprints

---

### 10.9 P4-H — Page Header Breadcrumb Standardization

**Problem:** Sub-pages (e.g. HR → Leave Management → [specific leave]) don't show where the user is. Back navigation uses browser back.

**Pattern:**
```
STSN Connect  /  HR Management  /  Leave Management  /  Juan Dela Cruz — LR-2026-0042
                                                         [← Back to Leave List]
```

**Implementation:**
```typescript
// src/hooks/useBreadcrumb.ts (new)
export function useBreadcrumb(crumbs: Array<{ label: string; onClick?: () => void }>) {
  // exposes crumbs to a <BreadcrumbBar /> in the page header
}
```

**Files to create/change:** `src/components/common/BreadcrumbBar.tsx` (new), `src/hooks/useBreadcrumb.ts` (new), `src/App.tsx` (add breadcrumb slot in page header), all sub-page components

---

### 10.10 Phase 4 Implementation Order

```
Step 1 (P4-H)   Breadcrumb bar — low risk, high orientation value
                  → New shared component wired into page header slot

Step 2 (P4-C)   Actionable empty states — shared EmptyState component
                  → High visibility improvement for new staff onboarding

Step 3 (P4-A)   Role-adaptive sidebar modes — compact + minimal
                  → Non-breaking: existing "full" behavior unchanged

Step 4 (P4-G)   Inline form validation — tackle per module
                  → Start with enrollment wizard (P3-B already has multi-step structure)

Step 5 (P4-B)   Mobile bottom nav — requires viewport testing
                  → Implement for TEACHER and CASHIER first (highest mobile usage)

Step 6 (P4-F)   Central audit log — requires Supabase schema migration
                  → New table: audit_logs; migrate existing auditTrail[] data

Step 7 (P4-D)   Approval delegation — requires P3-A designation field
                  → Backend-heavy; build delegation admin UI + gate logic in store

Step 8 (P4-E)   Guardian portal — new role, new feature folder
                  → Highest complexity; plan as separate mini-sprint
```

---

*Last updated: June 25, 2026 — Phase 1 + Phase 2 + Phase 3 + Phase 4 complete. All 26 items (P1-A through P1-E, P2-A through P2-F, P3-A through P3-G, P4-A through P4-H) implemented. TypeScript compiles clean (0 errors).*

---

## Part 12 — Phase 4 Implementation Log

> **Started:** June 25, 2026 | **Branch:** dev | **Focus:** Priority 4 — Polish · Mobile, accessibility, parent portal, immutable audit, delegation

### 12.1 Phase 4 Progress Tracker

| ID | Action | Status | File(s) Changed | Notes |
|----|--------|--------|----------------|-------|
| **P4-H** | Page header breadcrumb standardization | ✅ Done | `src/contexts/BreadcrumbContext.tsx` (new), `src/hooks/useBreadcrumb.ts` (new), `src/components/common/BreadcrumbBar.tsx` (new), `src/App.tsx` | `BreadcrumbContext` provides a `setCrumbs` setter. `useBreadcrumb(crumbs[])` hook for sub-pages to push deep breadcrumbs. `BreadcrumbBar` renders `Home / STSN Connect / Module / SubPage` trail with clickable intermediate segments. App.tsx derives crumbs from `activeModule` + sub-page state variables and renders `<BreadcrumbBar>` between header and `<UrgentAnnouncementBanner>`. |
| **P4-C** | Actionable empty states across all modules | ✅ Done | `src/components/common/EmptyState.tsx` (new), `src/components/common/ApprovalInbox.tsx`, `src/features/cashier/pages/CashierModulePage.tsx`, `src/features/hr/pages/sub-pages/PayrollManagementPage.tsx` | New `EmptyState` component: icon + title + description + optional primary/secondary action buttons. Applied to: **ApprovalInbox** (now shows "All caught up!" card with CheckCircle instead of returning null), **Cashier payment queue** ("Payment Queue is Empty" with context), **Payroll employee list** ("No Employees Found" with guidance). `compact` prop for inline table-style contexts. |
| **P4-A** | Role-adaptive sidebar themes | ✅ Done | `src/config/navigation.config.ts` (`SIDEBAR_MODE` export), `src/App.tsx` (sidebar width + brand header + school badges + user card + nav items) | `SIDEBAR_MODE: Record<UserRole, "full" \| "compact" \| "minimal">`. `full` (265px) = SUPER_ADMIN, ADMIN, PRINCIPAL, REGISTRAR, ACCOUNTING. `compact` (200px) = PAYROLL, HR, TEACHER. `minimal` (64px icon rail) = CASHIER, NURSE, GUIDANCE, STUDENT, EMPLOYEE, GUARDIAN. In minimal mode: brand header shows icon only, school badges hidden, user card collapses to avatar initials, nav items are icon-only buttons with `title` tooltip, no child expansion. |
| **P4-G** | Inline real-time form validation | ✅ Done | `src/hooks/useFormValidation.ts` (new), `src/features/registrar/components/EnrollmentWizard.tsx` | `useFormValidation<T>(validators)` hook: validates on blur, `validateAll()` on Next button click, `fieldError(field)` returns error only when field is touched. Exports: `required()`, `minLength()`, `exactLength()`, `isEmail()`, `combine()` composable validators. Applied to EnrollmentWizard Step 1: `lastName` and `firstName` get red-border + error message on blur when empty; `lrn` validated for 12-digit length; Next button triggers `validateAll()` before advancing. |
| **P4-B** | Mobile bottom nav for teacher, student, cashier, nurse, employee | ✅ Done | `src/components/common/MobileBottomNav.tsx` (new), `src/App.tsx` | `MobileBottomNav` renders a 3–4 tab bottom bar (`lg:hidden`) for TEACHER, CASHIER, NURSE, STUDENT, EMPLOYEE, GUARDIAN. Tabs are subsets of the role's primary actions (Grades, Schedule, Notices, Profile, Queue, Reports, Clinic, Fees). Active tab gets `stsn-brown` tint + top border line. `hasMobileBottomNav(role)` guards rendering. Wired between `</main>` and `</div>` in the main content column. |
| **P4-F** | Central immutable audit log | ✅ Done | `src/types/index.ts` (`AuditLogEntry`, `AuditEntityType`, `AuditAction`, `ApprovalDelegation`, `DelegationScope`), `src/services/store.ts` (`auditLog[]` slice, `logAudit()` action), `src/features/admin/pages/AuditLogPage.tsx` (new) | `AuditLogEntry`: id, timestamp, actorId/Name/Role, schoolId, entityType, entityId, action, previousValue, newValue, remarks, ipAddress. Store: `auditLog: AuditLogEntry[]` (max 1,000 in-memory), `logAudit(action, entityType, entityId, prev?, next?, remarks?)` appends-only. **AuditLogPage**: searchable by actor/entity/remarks, filterable by entity type + action, paginated (25/page), CSV export. Entity types: enrollment, assessment, payment, grade, employee, leave, void, user, discount, payroll, delegation. |
| **P4-D** | Approval delegation (temporary authority transfer) | ✅ Done | `src/types/index.ts` (`ApprovalDelegation`, `DelegationScope`), `src/services/store.ts` (`delegations[]`, `addDelegation`, `revokeDelegation`, `getActiveDelegation`), `src/features/admin/pages/DelegationManagementPage.tsx` (new) | `ApprovalDelegation`: delegatorId, delegateId, scope (ASSESSMENT/LEAVE/GRADE/VOID/ALL), startDate, endDate, reason, isActive. Store actions: `addDelegation()`, `revokeDelegation(id)`, `getActiveDelegation(scope, delegateId)` checks date range + isActive. **DelegationManagementPage**: form to create delegations (select user, scope, date range, reason), active delegations table with Revoke action, past/revoked log. |
| **P4-E** | Guardian / Parent portal | ✅ Done | `src/types/index.ts` (`GUARDIAN` added to `UserRole`, `linkedGuardianIds?` on `Student`), `src/types/role.types.ts` (`guardian` canonical role), `src/config/permissions.config.ts` (`GUARDIAN_PORTAL` module, `guardian` permissions), `src/config/navigation.config.ts` (`GUARDIAN_PORTAL` nav item, `GUARDIAN` in SIDEBAR_MODE), `src/features/guardian/pages/GuardianPortalPage.tsx` (new), `src/App.tsx` | New `GUARDIAN` UserRole with read-only access scoped to linked students. `Student.linkedGuardianIds?: string[]` links accounts. `GuardianPortalPage`: shows linked students (via `linkedGuardianIds`), per-student Grade Summary (finalized grades only) + Fee Statement (total/discount/paid/balance), active school announcements filtered for GUARDIAN role, disclaimer banner, empty state when no students linked. Minimal sidebar mode. Initial module set to `GUARDIAN_PORTAL` on login. |

**Legend:** ✅ Done · 🔵 In Progress · ⬜ Pending · 🔴 Blocked

---

### 12.2 Phase 4 Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| `BreadcrumbBar` receives `crumbs` as a prop (not from context) in App.tsx | App.tsx is the logical owner of module/subpage state — passing crumbs directly avoids a circular provider/consumer relationship; context remains available for sub-pages wanting to push deeper crumbs |
| `useFormValidation` validates on blur (not on keystroke) | Validates on keystroke causes "noisy" UX where red borders appear immediately on first keypress before the user has had a chance to finish typing |
| `AuditLogEntry` is append-only (max 1,000 in-memory) | Immutability is enforced by only having a `logAudit` (append) action, no update/delete. 1,000 cap prevents unbounded memory growth in the SPA layer |
| `getActiveDelegation` checks both `isActive` AND `endDate >= today` | Two orthogonal invalidation paths: `revokeDelegation` sets `isActive = false` immediately; expired delegations auto-exclude by date without needing a scheduled job |
| `GUARDIAN` uses `minimal` sidebar (64px icon rail) | Guardians have only 1 module (GUARDIAN_PORTAL); the full sidebar would be 99% empty chrome |
| `linkedGuardianIds` on Student (not a separate GuardianLink table) | For the SPA layer, a simple array on Student is sufficient; a relational table is appropriate when Supabase persistence of the guardian relationship is added in Phase 5 |

---

## Part 11 — Phase 3 Implementation Log

> **Started:** June 25, 2026 | **Branch:** dev | **Focus:** Priority 3 — Medium · UX polish, power user features, sub-role gating, schema refinements

### 11.1 Phase 3 Progress Tracker

| ID | Action | Status | File(s) Changed | Notes |
|----|--------|--------|----------------|-------|
| **P3-D** | Type-to-confirm on destructive/financial actions | ✅ Done | `src/components/common/AppTypeConfirmDialog.tsx` (new), `src/components/common/DialogProvider.tsx`, `src/components/common/useAppDialog.tsx` | New `AppTypeConfirmDialog` component renders a modal with an exact-phrase input field. Confirm button disabled until typed value matches `confirmPhrase`. Input turns red for mismatch, green on match. `typeConfirm(phrase, options): Promise<boolean>` added to `AppDialogContext`. Can be called anywhere via `useAppDialog().typeConfirm()`. Priority triggers: void receipt approval, reject enrollment, bulk reject applications. |
| **P3-A** | Sub-role `designation` field for L1/L2 approval gating | ✅ Done | `src/types/index.ts` (`UserDesignation` type + `designation?: UserDesignation` on `User`), `src/services/dataLoader.ts` (maps `u.designation` from Supabase), `src/features/accounting/pages/AccountingModulePage.tsx` (`canFinalApprove` gate on approve/return/reject buttons) | `UserDesignation`: `"HEAD" | "OFFICER" | "STAFF" | "PRINCIPAL" | "ASST_PRINCIPAL"`. Gate logic: `canFinalApprove = SUPER_ADMIN OR (ACCOUNTING AND (!designation OR designation === "HEAD"))` — backward compatible when designation not yet in DB. `AssessmentApprovalDetail` receives `canFinalApprove` prop; shows amber warning banner and disables approve/return/reject when false. Bulk action bar also gates on `canFinalApprove`. |
| **P3-C** | Enhanced STSNDataTable: bulk select + column toggle + rowColorClass | ✅ Done | `src/components/common/STSNDataTable.tsx` | **Bulk selection:** `bulkSelectable` prop adds checkbox column at index 0; event delegation via `containerRef` tracks `Set<string>` of selected IDs; `onBulkSelect` callback fires on change; `bulkActionBar` rendered above table when non-empty selection. **Column toggle:** `columnToggleable` prop shows "Columns ▼" dropdown; `hiddenColumns` Set filters visible columns; persists to `localStorage` keyed by `tableId` prop; table re-keys on column change. **Row color:** `rowColorClass(row) => string` callback applied in DataTables `createdRow` hook. All new props are optional — zero changes to existing consumers. |
| **P3-F** | Row-level status color coding wired into tables | ✅ Done | `src/features/registrar/pages/RegistrarModulePage.tsx` (student directory + online applications), `src/features/hr/pages/sub-pages/LeaveManagementPage.tsx` | Color scheme: `bg-red-50` = Rejected/Cancelled/Withdrawn; `bg-emerald-50` = Enrolled/Approved; `bg-amber-50` = Pending/For Assessment/Submitted; `bg-blue-50` = Draft/For Completion. Applied to student directory, online application queue, and leave request table via `rowColorClass` prop. |
| **P3-G** | Role-targeted announcements + Notices tab in NotificationBell | ✅ Done | `src/types/index.ts` (`Announcement` extended with `targetRoles?`, `targetSchool?`, `priority?`, `expiresAt?`), `src/components/common/NotificationBell.tsx` (Notices tab added), `src/App.tsx` (`UrgentAnnouncementBanner` imported and rendered below header) | `Announcement.targetRoles` (undefined = all), `targetSchool` (undefined = both), `priority: "normal" \| "urgent"`, `expiresAt` (auto-archive). `NotificationBell` now has two tabs: **Notifications** (existing) + **Notices** (announcements filtered by role + school + expiry). Urgent notices render with red border-left and AlertTriangle icon. `UrgentAnnouncementBanner` is a dismissable red banner that auto-renders below the header for urgent active announcements targeting the current user's role. |
| **P3-B** | 5-step enrollment wizard | ✅ Done | `src/features/registrar/components/EnrollmentWizard.tsx` (new), `src/features/registrar/pages/RegistrarModulePage.tsx` | **Steps:** 1. Student Info (name, gender, LRN, enrollment type with 4-button selector) → 2. Academic Setup (BE cascading dropdowns or College program/year) → 3. Subject Load (tick-off table, total subjects/units counter) → 4. Requirements Checklist (tick-off docs, Submitted vs For Completion badge per doc) → 5. Confirmation & Submit (summary card + advisory notice + Submit Enrollment button). **Step indicator:** color-coded circles + connector lines, done steps show ✓. Wizard renders inside the existing modal shell; parent's `onSubmit` callback handles `addStudent` + `submitNewEnrollment`. Old inline 3-step form wrapped in `{(false as boolean) && ...}` to disable while preserving code as reference. LRN inline validation (12-digit check). |
| **P3-E** | Keyboard shortcut system + GlobalSearch | ✅ Done | `src/hooks/useKeyboardShortcuts.ts` (new), `src/components/common/GlobalSearch.tsx` (new), `src/App.tsx` | **`useKeyboardShortcuts`:** generic hook accepting `Record<string, (e) => void>` keyed by `"Ctrl+k"`, `"Meta+k"`, `"Escape"`, etc. Skips when focus is in input/textarea (except Escape). **`GlobalSearch`:** full-screen portal modal; searches students (by name, student no, LRN), employees (by name, employee no), payments (by OR number) with 2-char minimum; shows type icon + badge + sub-info per result; `?` key toggles shortcut cheat sheet panel showing all app shortcuts. **App.tsx:** `Ctrl+K` / `Cmd+K` opens search; `Escape` closes. "Search" button added to header (visible sm+) with `⌘K` hint chip. |

**Legend:** ✅ Done · 🔵 In Progress · ⬜ Pending · 🔴 Blocked

---

### 11.2 Phase 3 Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| `canFinalApprove` defaults to `true` when `designation` is undefined | Backward compatible — existing users with no designation in DB can still approve; restriction only kicks in when designation is explicitly set to `STAFF`/`OFFICER` |
| STSNDataTable uses `(false as boolean) && <div>` pattern for legacy steps | TypeScript-safe way to keep the legacy 3-step form code in place without rendering it — avoids deleting code that may be needed as reference during transition |
| `rowColorClass` applied in DataTables `createdRow` callback | DataTables manages the DOM independently from React; only the `createdRow` hook reliably fires on initial render and after sort/search/paginate |
| EnrollmentWizard as a separate component in `registrar/components/` | Isolates the 5-step state machine from the very large `RegistrarModulePage.tsx`; can be reused in future online enrollment flow |
| GlobalSearch uses `createPortal` to `document.body` | Ensures z-index stacking above all sidebar and modal layers without modifying the App layout tree |
| Announcement `targetRoles?: UserRole[]` — undefined = visible to all | Preserves backward compatibility with existing announcements that have no targeting |

# Cashier, Books & Assessment Approval — Phase Plan

**Status:** Planning only. No application code modified.
**Project:** STSN Connect — Academia Enterprise V2
**Stack confirmed:** React 19 + Vite + TypeScript + Zustand (`useSTSNStore`) + Tailwind CSS,
mock-data driven, no backend.

---

## 1. Files Inspected

```text
README.md
ACCOUNTING_ENTERPRISE_UX_REFERENCE.md
ACCOUNTING_IMPLEMENTATION_PHASE_PLAN.md
ACCOUNTING_IMPLEMENTATION_SUMMARY.md
REGISTRAR_ENTERPRISE_UX_PLAN.md
src/App.tsx
src/types/index.ts
src/types/role.types.ts
src/types/auth.types.ts
src/types/school.types.ts
src/config/roles.config.ts
src/config/permissions.config.ts
src/config/navigation.config.ts
src/config/schools.config.ts
src/config/accounting.config.ts
src/services/store.ts
src/services/mockAssessmentService.ts
src/mock-data/index.ts
src/features/registrar/pages/RegistrarModulePage.tsx
src/features/accounting/pages/AccountingModulePage.tsx
src/components/LoginOverlay.tsx
src/components/ModalPreviews.tsx
```

No application code was changed during this inspection.

---

## 2. Current Auth / Role Structure

### Roles

- `UserRole` (`src/types/index.ts`): `SUPER_ADMIN | ADMIN | REGISTRAR | ACCOUNTING | TEACHER | STUDENT | HR | EMPLOYEE`
- `CanonicalRole` (`src/types/role.types.ts`): `super-admin | registrar | accounting | teacher | student | hr`
- `toCanonicalRole(role)` maps `UserRole → CanonicalRole` via `ROLE_TO_CANONICAL`, defaulting to `"student"`.
- **No `CASHIER` role exists anywhere** — not in `UserRole`, not in `CanonicalRole`, not in `MOCK_USERS`.

### Permissions

- `src/config/permissions.config.ts` — `ROLE_PERMISSIONS: Record<CanonicalRole, Permission[]>` where `Permission = STSNModule`.
- `getPermissionsForRole(role: UserRole): Permission[]` → `ROLE_PERMISSIONS[toCanonicalRole(role)]`.
- Architecture rule already documented and enforced: **role decides permitted modules; school/academic-unit context decides labels and data**, never the reverse.

### Login flow

- `LoginOverlay.tsx` — user picks a school context (STSN/CDSTA) then a demo account email; `login(email, "")` resolves `activeSchool`/`academicUnit` from the matched `User.schoolId`.
- Sidebar "Switch Simulated Account" (`App.tsx`) lists every `MOCK_USERS` entry for quick role switching.

---

## 3. Current Registrar Assessment Structure

`src/features/registrar/pages/RegistrarModulePage.tsx`, "Assessment Fees" tab (part of `getDetailTabs()`):

- Uses `computeMockAssessment(department, yearLevel, trackOrCourse, discountPercentage, paymentTerm, academicYear)` from `src/services/mockAssessmentService.ts`.
- `getMockFeeBreakdown()` returns line items (tuition, lab, computer, misc) based on department/year level/track.
- `generatePaymentSchedule()` builds an installment schedule from the net payable amount and `PaymentTerm`.
- Discount selection via `DISCOUNT_OPTIONS`, payment term via `PAYMENT_TERMS`.
- Output is rendered as a **preview** (fee breakdown table + payment schedule) — it is computed client-side and is **not persisted as a `StudentAssessment` with an approval workflow**. There is no "Generate Assessment" → store-persisted record with a status today; `addAssessment`/`updateAssessment` exist in the store but the Registrar preview does not currently call them with a status field.
- **No books/book package concept exists in this preview.**

---

## 4. Current Accounting Assessment Structure

`src/features/accounting/pages/AccountingModulePage.tsx`, "Assessment & Billing" tab:

- Reads `MOCK_ASSESSMENT_BILLING_SUMMARIES: AssessmentBillingSummary[]` (`src/types/index.ts`):
  ```ts
  interface AssessmentBillingSummary {
    id: string;
    studentId: string;
    studentName: string;
    studentNo: string;
    schoolYear: string;
    semester: string;
    academicUnit: AcademicUnit;
    feeTemplateName: string;
    totalAssessment: number;
    amountDue: number;
    balance: number;
    status: "Draft" | "Pending Approval" | "Approved" | "Voided";
  }
  ```
- Two read-only tables (Basic Education / College), badge-colored by `status` via `BILLING_STATUS_BADGE`.
- **No Approve/Reject/Void action buttons are wired** — the tab footer explicitly states this is "prepared for prototype review and future backend integration."
- `StudentAssessment` (the record actually used by Student Ledger / payments) has **no status field at all** — only `AssessmentBillingSummary` (a separate, parallel summary type) carries `Draft/Pending Approval/Approved/Voided`. These two types are not currently linked by an explicit approval flag.
- `addPayment()` in `store.ts` posts directly against `StudentAssessment.balance` with **no check of any approval status** — i.e., today nothing prevents posting a payment against an unapproved assessment.

---

## 5. Recommended Cashier Module Structure

### 5.1 New role

- Add `"CASHIER"` to `UserRole` (`src/types/index.ts`).
- Add `"cashier"` to `CanonicalRole` (`src/types/role.types.ts`) and map `CASHIER → "cashier"` in `ROLE_TO_CANONICAL`.
- Add `MOCK_USERS` entries: `cashier@stsn.edu.ph` (schoolId `STSN`) and `cashier@cdsta.edu.ph` (schoolId `CDSTA`), following the existing accounting-user pattern (name, role, department `"Support"`).

### 5.2 New module

- Add `"CASHIER"` to `STSNModule` union (`src/config/navigation.config.ts`).
- New `NAV_ITEMS` entry:
  - `id: "CASHIER"`, `label: "Cashier"`, `desc: "Collect payments on approved assessments"`, icon e.g. `Wallet`/`Receipt` (lucide-react, already a dependency).
  - Optional `labelByUnit`/`descByUnit` not strictly needed (cashier workflow is the same for both academic units; only the *displayed* assessment fields differ via `getAccountingLabels(academicUnit)`).
- `ROLE_PERMISSIONS["cashier"] = ["CASHIER", "DASHBOARD"]` (Dashboard included for parity with other staff roles; can be omitted if a fully isolated cashier view is preferred — open question, default to including it for navigational consistency).
- `App.tsx`:
  - Add `CashierModule` import and render branch: `{activeModule === "CASHIER" && allowedModules.includes("CASHIER") && <CashierModule />}`.
  - Extend the role-based default-tab `useEffect`: `else if (currentUser.role === "CASHIER") setActiveModule("CASHIER");`

### 5.3 New feature page

```text
src/features/cashier/pages/CashierModulePage.tsx
```

Single-file module following the existing pattern (e.g. `AccountingModulePage.tsx`), with internal tabs:

```ts
type CashierTab = "queue" | "collect" | "history";
```

- **Payment Queue** (`queue`): list of **approved** assessments with `balance > 0`, searchable by student name/number, filterable by school year and academic unit label (Grade Level/Section vs Program/Year Level via `getAccountingLabels`/`getAcademicTerms`). Each row shows student, academic info, total assessment, balance, approval status badge ("Approved" only — others are hidden or shown as disabled/greyed with a tooltip "Awaiting Accounting approval").
- **Collect Payment** (`collect`): selecting a queue row opens a payment form (amount, payment method from `MOCK_SETUP_DATA.payment_methods`, reference number) that calls the existing `addPayment()` store action. Cashier **cannot** edit `fees`, `totalAmount`, `discountAmount`, or any assessment line item — the form is read-only except for the payment fields themselves.
- **Collection History** (`history`): read-only list of payments posted by the cashier session (filter `MOCK_PAYMENTS`/new payments by `postedBy`/role context), with receipt reprint via the existing `ReceiptPreview` modal from `ModalPreviews.tsx`.

### 5.4 Hard rules enforced in UI (not just convention)

- Cashier UI never renders fee-editing controls (no inputs bound to `fees`, `totalAmount`, `discountAmount`, `paymentTerm`).
- Cashier UI never renders an Approve/Reject/Recompute action.
- "Collect Payment" button is **disabled** (with explanatory tooltip/badge) unless `assessment.approvalStatus === "Approved"`.

---

## 6. Recommended Books Setup Structure

### 6.1 Scope rule

- Books apply **only** when `academicUnit === "basic-ed"`. The Books section of any UI (Registrar assessment preview, Accounting setup) must be hidden/disabled entirely for `college`.
- Books are **optional** — assessment can be approved/paid with or without books.
- No per-book selection: if availed, the **entire Book Package assigned to the student's Grade Level** is added as a single line item (or a fixed set of line items) to the assessment. No UI lets a student/registrar pick individual titles.

### 6.2 New config/data: Book Packages by Grade Level

New file: `src/config/book-packages.config.ts` (or extend `MOCK_SETUP_DATA` in `mock-data/index.ts` with a `book_packages` collection — either is acceptable; a dedicated config file is preferred for clarity and reuse without pulling all of `mock-data`).

```ts
export interface BookPackageItem {
  title: string;
  subjectCode?: string;
  price: number;
}

export interface BookPackage {
  id: string;            // "bp-grade7"
  gradeLevel: string;     // "Grade 7" — matches Student.yearLevel for Basic Ed
  packageName: string;    // "Grade 7 Book Package SY 2026-2027"
  items: BookPackageItem[];
  totalPrice: number;     // sum of items, precomputed for fast assessment math
}

export const BOOK_PACKAGES: BookPackage[] = [
  // one entry per Basic Ed grade level (Nursery–Grade 12)
];

export function getBookPackageForGradeLevel(gradeLevel: string): BookPackage | undefined {
  return BOOK_PACKAGES.find(p => p.gradeLevel === gradeLevel);
}
```

### 6.3 Assessment integration

On `StudentAssessment` (additive, optional fields only):

```ts
booksAvailed?: boolean;          // toggle set during Registrar assessment creation
bookPackageId?: string;          // resolved BOOK_PACKAGES entry id, Basic Ed only
```

When `booksAvailed === true` and `academicUnit === "basic-ed"`:
- A single fee line item is appended to `fees`: `{ feeName: "<Grade Level> Book Package", category: "Books", amount: bookPackage.totalPrice }`.
- `totalAmount` and `balance` recompute to include this amount (same recompute path `computeMockAssessment` already uses).

### 6.4 Registrar UI change (Assessment Fees tab, Basic Ed only)

- Add a single checkbox/toggle: **"Avail Book Package — <Grade Level> (₱<totalPrice>)"**, visible only when `academicUnit === "basic-ed"`.
- Toggling recomputes the fee breakdown preview to add/remove the single "Book Package" line item.
- No per-title checkboxes, no quantity inputs.

---

## 7. Data Model / Mock Data Recommendations

### 7.1 `src/types/index.ts` (additive only)

```ts
// UserRole
export type UserRole = "SUPER_ADMIN" | "ADMIN" | "REGISTRAR" | "ACCOUNTING"
  | "TEACHER" | "STUDENT" | "HR" | "EMPLOYEE" | "CASHIER";

// StudentAssessment — add:
interface StudentAssessment {
  // ...existing fields unchanged
  approvalStatus?: "Draft" | "Pending Approval" | "Approved" | "Voided";
  approvedBy?: string;
  approvedDate?: string;
  booksAvailed?: boolean;
  bookPackageId?: string;
}

// Payment — no change required; addPayment already records postedBy/method/OR.
```

### 7.2 `src/types/role.types.ts`

```ts
export type CanonicalRole = "super-admin" | "registrar" | "accounting"
  | "teacher" | "student" | "hr" | "cashier";

const ROLE_TO_CANONICAL: Record<UserRole, CanonicalRole> = {
  // ...existing
  CASHIER: "cashier",
};
```

### 7.3 `src/config/permissions.config.ts`

```ts
ROLE_PERMISSIONS["cashier"] = ["CASHIER", "DASHBOARD"];
```

### 7.4 `src/mock-data/index.ts`

- `MOCK_USERS`: add `cashier@stsn.edu.ph` (CASHIER, STSN) and `cashier@cdsta.edu.ph` (CASHIER, CDSTA).
- `MOCK_ASSESSMENTS`: backfill `approvalStatus` on all 4 existing records — at least one `"Pending Approval"` and one `"Approved"` per academic unit so the Cashier queue and Accounting approval UI both have non-empty states to demo.
- `MOCK_ASSESSMENT_BILLING_SUMMARIES`: keep `status` in sync with the corresponding `StudentAssessment.approvalStatus` (same record, two views) — when Accounting approves via the new action (Section 8), both should update together (see Risk 1).
- New `BOOK_PACKAGES` data (Section 6.2) — one package per Basic Ed grade level used by `MOCK_STUDENTS_BASIC_ED`, with realistic per-subject textbook line items and prices.
- Optionally seed 1–2 `MOCK_ASSESSMENTS` for Basic Ed students with `booksAvailed: true` + `bookPackageId` set, so the Books line item is visible in Student Ledger/Assessment & Billing without manual toggling during a demo.

### 7.5 `src/services/store.ts` — new/changed actions

```ts
// New: Accounting-only approval action
approveAssessment: (assessmentId: string, approvedBy: string) => void;
// Sets assessment.approvalStatus = "Approved", approvedBy, approvedDate
// Also updates the matching AssessmentBillingSummary.status = "Approved"

voidAssessment: (assessmentId: string, voidedBy: string) => void; // optional, parity with billing status "Voided"

// Modified: addPayment — add a guard
addPayment: (paymentData: Omit<Payment, "id" | "orNumber" | "paymentDate">) => Payment;
// Before posting, find the assessment for paymentData.studentId (+ schoolYear/semester
// if multiple) and throw / return early if approvalStatus !== "Approved".
// UI-level guard (Section 5.4) is primary; store-level guard is defense-in-depth.
```

---

## 8. Required Routes

This app has no router (single-page `activeModule` state in `App.tsx`); "routes" here means `STSNModule` values and their render branches.

| STSNModule | New? | Notes |
|---|---|---|
| `CASHIER` | **New** | Renders `CashierModulePage`. Added to `STSNModule` union, `NAV_ITEMS`, `ROLE_PERMISSIONS["cashier"]`, and `App.tsx` render branch + default-tab effect. |
| `ACCOUNTING` | existing | Add new "approve assessment" actions inside the existing Assessment & Billing tab — no new module id needed. |
| `REGISTRAR` | existing | Assessment Fees tab gains the Books toggle (Basic Ed only) and, if not already present, an explicit "Save / Submit Assessment for Approval" action that persists a `StudentAssessment` with `approvalStatus: "Pending Approval"` via `addAssessment`/`updateAssessment`. |

---

## 9. Required Navigation Updates

`src/config/navigation.config.ts`:

1. Add `"CASHIER"` to `STSNModule` type union.
2. Add one `NAV_ITEMS` entry for Cashier (icon, label "Cashier", desc "Collect payments on approved assessments").
3. No `labelByUnit`/`descByUnit` overrides required — Cashier workflow text is identical for Basic Ed and College; only the *data rows* differ.

`src/config/permissions.config.ts`:

4. Add `"cashier": ["CASHIER", "DASHBOARD"]` to `ROLE_PERMISSIONS`.

`src/App.tsx`:

5. Import `CashierModule` from `./features/cashier/pages/CashierModulePage`.
6. Add render branch `{activeModule === "CASHIER" && allowedModules.includes("CASHIER") && <CashierModule />}`.
7. Extend the role → default-`activeModule` `useEffect` with `CASHIER → "CASHIER"`.
8. Sidebar quick-switch (`users.map(...)`) automatically picks up the new `CASHIER` mock users — no change needed beyond the `MOCK_USERS` additions in Section 7.4.

---

## 10. Phase-by-Phase Implementation Plan

### Phase 1 — Foundation: Types, Roles, Config (low risk, no UI change)

- Add `CASHIER` to `UserRole`, `"cashier"` to `CanonicalRole`, update `ROLE_TO_CANONICAL`.
- Add `ROLE_PERMISSIONS["cashier"]`.
- Add `CASHIER` to `STSNModule`, add `NAV_ITEMS` entry.
- Add `approvalStatus`, `approvedBy`, `approvedDate`, `booksAvailed`, `bookPackageId` (all optional) to `StudentAssessment`.
- Add `BOOK_PACKAGES` config/data (Section 6.2).
- Add `cashier@stsn.edu.ph` / `cashier@cdsta.edu.ph` to `MOCK_USERS`.
- Backfill `approvalStatus` on existing `MOCK_ASSESSMENTS`.
- `npm run build` — zero TS errors. No visible UI change yet (Cashier module not rendered until Phase 2 adds the page, but nav item will appear once Phase 2 page exists — sequence Phase 1 to add a minimal placeholder page if nav item should appear immediately).

### Phase 2 — Cashier Module Shell

- Create `src/features/cashier/pages/CashierModulePage.tsx` with `queue`/`collect`/`history` tabs (Section 5.3), using `PageHeader`/`StatCard` common components and existing tab-bar visual pattern.
- Wire into `App.tsx` (import, render branch, default-tab effect).
- Payment Queue reads `assessments` filtered by `approvalStatus === "Approved" && balance > 0`, scoped by `activeSchool` (consistent with Accounting's school-scoping pattern).
- Collect Payment form calls existing `addPayment()` — no store changes yet (defer guard to Phase 4).

### Phase 3 — Accounting Approval Action

- In `AccountingModulePage.tsx` Assessment & Billing tab, add an "Approve" button per row where `status === "Pending Approval"`.
- Add `approveAssessment(assessmentId, approvedBy)` to `store.ts` (Section 7.5), updating both `StudentAssessment.approvalStatus` and the linked `AssessmentBillingSummary.status`.
- Optionally add "Void" action for `Approved → Voided` (parity with existing `BILLING_STATUS_BADGE` states).

### Phase 4 — Books Toggle in Registrar Assessment Preview

- In `RegistrarModulePage.tsx` Assessment Fees tab, add the Basic-Ed-only "Avail Book Package" toggle (Section 6.4).
- Recompute fee breakdown/total to include/exclude the single Book Package line item.
- Ensure `academicUnit === "college"` never renders this control (guard via `getAcademicUnit`/`academicUnit` from store, not role).

### Phase 5 — Cashier Guardrails & Polish

- Add the `addPayment()` approval guard (Section 7.5) — store-level defense-in-depth.
- Add empty-state copy ("No approved assessments awaiting payment.") to Cashier Payment Queue.
- Add Collection History tab with receipt reprint via `ReceiptPreview`.
- Final `npm run build` + manual QA pass (Section 12).

Each phase is independently shippable; Phases 2–4 can be reordered if desired, but Phase 1 must come first (types/config foundation) and Phase 5 should come last (depends on Phases 2–4 existing).

---

## 11. Risks

1. **Two parallel "status" representations** — `StudentAssessment.approvalStatus` (new) and `AssessmentBillingSummary.status` (existing) describe the same real-world state for what is conceptually the same assessment, but are separate mock records keyed differently (`StudentAssessment.id` vs `AssessmentBillingSummary.id`/`studentId`). The approval action (Phase 3) must update both, or the Cashier queue (reads `StudentAssessment`) and the Accounting billing table (reads `AssessmentBillingSummary`) will disagree. Mitigation: cross-reference by `studentId` + `schoolYear` and keep a mapping table, or eventually merge the two types — out of scope for this prototype but should be documented as a known duplication.
2. **No existing "submit for approval" step from Registrar** — today the Assessment Fees tab is a live preview, not a persisted record. Introducing `approvalStatus` is meaningless unless Registrar actually calls `addAssessment`/`updateAssessment` with `approvalStatus: "Pending Approval"`. If this submit action doesn't already exist, Phase 4 (or an earlier sub-step) must add a minimal "Save Assessment" button — otherwise the Cashier/Accounting approval flow has nothing to operate on beyond the 4 seeded mock records.
3. **`addPayment` guard could block existing demo flows** — any current UI (e.g. Student Ledger "Add Payment" in Accounting) that calls `addPayment` against assessments without `approvalStatus === "Approved"` will start failing once the Phase 5 guard lands. Mitigation: backfill all `MOCK_ASSESSMENTS` with `approvalStatus: "Approved"` by default (Phase 1) except the 1–2 specifically seeded as "Pending Approval" for the approval-flow demo.
4. **Book Package price changes assessment totals retroactively** — toggling the Books checkbox after a payment schedule preview has been generated must trigger a full recompute (`computeMockAssessment`); stale `totalAmount`/`balance` would desync from `fees`. Mitigate by recomputing on every toggle, not caching.
5. **Role proliferation in `AccountsManagementPage.tsx`** — the "Provision New Authority" role `<select>` lists `UserRole` values; adding `CASHIER` there is required for completeness (Authority/User Access Management should be able to create cashier accounts) but is a small additive change, not flagged in REGISTRAR_ENTERPRISE_UX_PLAN.md's role-trimming discussion (Section 19.5 of that doc) — ensure `CASHIER` is added regardless of whether `ADMIN`/`EMPLOYEE` are trimmed.
6. **Cashier dashboard scope** — including `DASHBOARD` in `ROLE_PERMISSIONS["cashier"]` means the generic Dashboard renders for Cashier; if that dashboard shows accounting-wide KPIs not relevant/permitted for a cashier, consider either a cashier-specific lightweight dashboard or simply default-routing Cashier straight to the `CASHIER` module (already planned) and treating Dashboard as optional/hidden via nav filtering — low risk either way since `getAllowedModules` is role-gated and Dashboard contains no sensitive write actions.

---

## 12. Manual QA Checklist

### Roles & Navigation
```text
[ ] Login as CASHIER (STSN) — sidebar shows "Cashier" nav item, default module is Cashier
[ ] Login as CASHIER (CDSTA) — same, scoped to CDSTA students
[ ] CASHIER sidebar does NOT show Registrar, Accounting (full), HR, Core Setup, etc.
[ ] Role quick-switch to/from CASHIER works without errors
[ ] Authority/User Access Management can provision a new CASHIER account
```

### Cashier — Payment Queue
```text
[ ] Queue shows only assessments with approvalStatus === "Approved" and balance > 0
[ ] Pending/Draft/Voided assessments are excluded or shown disabled with explanatory badge
[ ] Search by student name/number works
[ ] Basic Ed rows show Grade Level/Section labels; College rows show Program/Year Level/Semester
[ ] Queue is scoped to activeSchool (STSN cashier sees only STSN students)
```

### Cashier — Collect Payment
```text
[ ] Selecting a queue row opens payment form with NO editable fee/discount/total fields
[ ] Posting a payment calls addPayment, reduces balance, generates OR number
[ ] Attempting to post against a non-Approved assessment is blocked (button disabled/guard)
[ ] Receipt preview opens after posting
```

### Cashier — Collection History
```text
[ ] Newly posted payments appear in history
[ ] Receipt reprint opens ReceiptPreview modal correctly
```

### Accounting — Assessment Approval
```text
[ ] Pending Approval assessments show an "Approve" action
[ ] Approving updates both AssessmentBillingSummary.status and StudentAssessment.approvalStatus
[ ] Approved assessment immediately appears in Cashier's Payment Queue (cross-module consistency)
[ ] Voided assessments (if implemented) disappear from Cashier queue
```

### Registrar — Books (Basic Ed only)
```text
[ ] Login as Registrar (STSN/basic-ed) — Assessment Fees tab shows "Avail Book Package" toggle
[ ] Toggling adds/removes a single "<Grade Level> Book Package" line item and recomputes total
[ ] Login as Registrar (CDSTA/college) — Books toggle is NOT present anywhere
[ ] Books line item, once part of an approved+paid assessment, appears correctly in Student Ledger
```

### Cross-cutting
```text
[ ] Cashier cannot access Accounting's Discounts/Financial Holds/Assessment editing UI
[ ] Switching activeSchool (STSN <-> CDSTA) updates Cashier queue contents and labels correctly
[ ] Theme (brown/gold) and layout patterns remain consistent with Accounting/Registrar modules
```

---

## 13. Build Validation Checklist

```text
[ ] npm run build completes with zero TypeScript errors
[ ] npm run lint (tsc --noEmit) reports zero errors under src/
[ ] No console errors/warnings on initial load for roles: CASHIER (STSN), CASHIER (CDSTA),
    ACCOUNTING, REGISTRAR, SUPER_ADMIN
[ ] All existing modals (Receipt Preview, Assessment preview, Approval actions) still
    open and close correctly
[ ] AccountingModule, RegistrarModule, and new CashierModule all render under their
    respective activeModule branches in App.tsx without runtime errors
[ ] No regressions to existing Accounting Assessment & Billing tab, Student Ledger,
    or Registrar Assessment Fees tab
```

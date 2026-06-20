# Accounting Module — Implementation Phase Plan

**Status:** Analysis complete. No application code modified.
**Source file under review:** `src/features/accounting/pages/AccountingModulePage.tsx` (927 lines, 3 inline components: `AccountingDashboard`, `StudentLedger`, `DiscountManagement`, plus the `AccountingModule` shell).

---

## 1. Files Inspected

```text
ACCOUNTING_ENTERPRISE_UX_REFERENCE.md
src/App.tsx
src/types/index.ts
src/types/school.types.ts
src/services/store.ts
src/mock-data/index.ts (MOCK_STUDENTS, MOCK_ASSESSMENTS, MOCK_PAYMENTS,
                         MOCK_DISCOUNT_TYPES, MOCK_DISCOUNT_REQUESTS, MOCK_USERS)
src/config/navigation.config.ts
src/config/schools.config.ts
src/components/common/PageHeader.tsx
src/components/common/StatCard.tsx
src/features/accounting/pages/AccountingModulePage.tsx
```

---

## 2. Current Accounting Architecture Assessment

- **Single-file module.** `AccountingModulePage.tsx` contains three large local components (`AccountingDashboard`, `StudentLedger`, `DiscountManagement`) plus the tab shell `AccountingModule` (default export). No sub-folder decomposition yet (no `components/`, `tabs/`, `hooks/` under `features/accounting/`).
- **Tabs today:**
  ```ts
  type AccountingTab = "dashboard" | "ledger" | "discounts";
  type DiscountsSubTab = "types" | "requests" | "government" | "sibling";
  ```
- **Store usage:** reads `students`, `assessments`, `payments`, `discountTypes`, `discountRequests`, `currentUser`; calls `addPayment`, `addAssessment`, `updateAssessment`, `addDiscountType`, `updateDiscountType`, `deleteDiscountType`, `toggleDiscountTypeActive`, `addDiscountRequest`, `approveDiscountRequest`, `rejectDiscountRequest`. All exist in `store.ts` and are functional.
- **Shared components used:** `PreviewModal`, `ReceiptPreview` from `ModalPreviews`. `PageHeader` and `StatCard` (common components) are **not** used — the dashboard/header markup is hand-rolled inline (duplicated styling instead of reusing `StatCard`/`PageHeader`).
- **Constants are hardcoded locally** (`SCHOOL_YEARS`, `SEMESTERS`, `TX_TYPES`, `STATUS_COLORS`) inside the page file — not in a shared config.

---

## 3. Current Accounting UX Assessment

### Dashboard (`AccountingDashboard`)
- 6 KPI cards: Total Assessed, Total Collections, Outstanding Balances, Total Discounts Given, Accounts with Balance, Cleared Accounts. All computed correctly via `useMemo` over `assessments`/`payments`.
- 3-column grid: Collection by Method (progress bars), Student Receivables (balance > 0 list), Recent Accounting Activity (recent payments + pending discount banner).
- Discount & Scholarship Summary table at the bottom.
- **No action-oriented cards** (Today's Collection, Pending Discount Requests as a KPI tile, Financial Holds, Promissory Notes, Unposted Payments).
- **No school-context filtering** — KPIs are computed over the *entire* `assessments`/`payments` arrays regardless of `activeSchool`.

### Student Ledger (`StudentLedger`)
- Left: searchable student list (all students, unfiltered by school) with quick balance indicator.
- Right: filter bar (School Year / Semester / Transaction Type), balance summary cards (Total Assessed, Discount Applied, Total Paid, Outstanding Balance), transaction ledger table with running balance, payment receipts grid with `ReceiptPreview` modal.
- Student header shows only `studentNo • trackOrCourse • yearLevel` — no Academic Unit label, no Financial Hold / Clearance status, no Grade Level/Section vs Program/Year Level distinction.
- **Action buttons present:** Export PDF, Export Excel only. Missing: Add Payment, Add Adjustment, Generate SOA, Print Ledger, Apply Discount, Set/Clear Financial Hold.
- Empty state for ledger rows already exists ("No transactions found for the selected filters.") — already meets the reference recommendation.
- Semester filter (`filterSemester`) is **set but never used** in `ledgerRows` filtering logic — dead state.

### Discount Management (`DiscountManagement`)
- Sub-tabs: Discount Types, All Requests, Government Discounts, Sibling/Owner — all functional with working filters.
- Discount Type table: Code, Name, Source, Discount %, Requires Approval, Status, Actions (edit/delete/toggle). CRUD fully wired to store.
- Request cards: reference no., status badge, Level 1 / Level 2 review status, siblings, attachments, approve/reject buttons (modal), Audit Trail (modal).
- **Missing policy fields** on `DiscountType`: Effective School Year, Academic Unit Applicability, Applies To (Tuition/Misc/Lab/Total), Discount Basis (% vs fixed amount), Stackable, Max Amount, GL code.
- **Missing statuses**: "Returned for Documents", "Cancelled", "Expired" not in `DiscountRequest["status"]` union.

---

## 4. Current School Context Behavior

- `App.tsx` reads `activeSchool` and `academicUnit` from `useSTSNStore()` and passes `academicUnit` into `getAllowedModules` / `getNavItemsForRole` for sidebar/module gating — **role + academic unit already drive navigation correctly** elsewhere in the app.
- `schools.config.ts` already defines:
  - `SCHOOL_CONTEXTS` (STSN → `basic-ed`, CDSTA → `college`)
  - `getAcademicUnit(schoolId)`
  - `ACADEMIC_TERMS: Record<AcademicUnit, AcademicTerms>` with `unitNounSingular`, `trackNoun`, `groupNoun`, `groupLeaderNoun`, `studentIdLabel`, `enrollmentUnit`, etc. — **general academic terms exist, but no accounting-specific terms** (Tuition Package vs Units/Subject Load, Monthly Plan vs Semester billing, etc.)
- **`AccountingModulePage.tsx` currently imports/uses NONE of this.** It does not call `useSTSNStore` for `activeSchool`/`academicUnit`, does not call `getAcademicTerms`, and does not filter any data by `schoolId`.
- **Data-model gap:** `StudentAssessment`, `Payment`, `DiscountType`, and `DiscountRequest` (in `types/index.ts`) have **no `schoolId` field**. `Student` has `schoolId?: SchoolId` (optional). This means:
  - The Student Ledger student list currently shows **all students from both STSN and CDSTA together**, unfiltered.
  - Dashboard KPIs aggregate **both schools' financials** together with no way to scope to `activeSchool`.
  - This is the most significant architectural gap blocking "Role determines permissions / School context determines labels & data" for Accounting.

---

## 5. Recommended Accounting Tab Structure

Keep the current 3-tab shell as the foundation (low risk, preserves existing behavior) and use the existing tab bar pattern to add lightweight/placeholder tabs incrementally:

```text
Phase 3 target tabs (rename labels only, same 3 tabs):
  Dashboard | Student Ledger | Discounts & Scholarships

Phase 5 target tabs (append, don't replace):
  Dashboard | Student Ledger | Assessment & Billing (placeholder)
  | Discounts & Scholarships | Financial Holds (placeholder)
  | Reports (placeholder)
```

`AccountingTab` type becomes:
```ts
type AccountingTab = "dashboard" | "ledger" | "discounts" | "billing" | "holds" | "reports";
```
`billing`, `holds`, `reports` render lightweight placeholder/empty-state sections in Phase 5 — not full workflows.

---

## 6. Required Type/Config Changes

### `src/types/index.ts`
- `StudentAssessment`: add `schoolId?: SchoolId`, `academicUnit?: AcademicUnit` (or derive from student lookup — see Risk #1), add optional `financialHoldStatus?: "None" | "Hold" | "Cleared"` and `lastPaymentDate?: string`.
- `Payment`: add `schoolId?: SchoolId`.
- `DiscountType`: add `effectiveSchoolYear?: string`, `applicableAcademicUnit?: "basic-ed" | "college" | "both"`, `appliesTo?: "Tuition" | "Miscellaneous" | "Laboratory" | "Total Assessment"`, `discountBasis?: "Percentage" | "Fixed Amount"`, `discountFixedAmount?: number`, `isStackable?: boolean`, `requiresDocument?: boolean`, `maxAmount?: number`, `glCode?: string`.
- `DiscountRequest["status"]`: extend union to include `"Returned for Documents" | "Cancelled" | "Expired"`.

### `src/config/schools.config.ts`
- Extend `AcademicTerms` (in `school.types.ts`) with accounting-specific fields, e.g.:
  ```ts
  accountingLabels: {
    levelLabel: string;        // "Grade Level" | "Year Level"
    programLabel: string;      // "Track / Strand" | "Program / Course"
    termLabel: string;         // "School Year" | "Semester"
    billingBasisLabel: string; // "Tuition Package" | "Units / Subject Load"
    feeStructureLabel: string; // "Monthly Plan" | "Per-Unit Assessment"
  }
  ```
- Add `ACCOUNTING_TERMS: Record<AcademicUnit, AccountingLabels>` (or fold into existing `ACADEMIC_TERMS`) following the existing `getAcademicTerms()` pattern — `getAccountingTerms(unit)`.

### New file (optional, Phase 2): `src/config/accounting.config.ts`
- `SCHOOL_YEARS`, `SEMESTERS`, `TX_TYPES`, `STATUS_COLORS`, `DISCOUNT_REQUEST_STATUS_COLORS` moved out of the page file so they can be shared with future Assessment/Billing/Holds tabs.

---

## 7. Required Mock-Data Changes

- `MOCK_ASSESSMENTS` and `MOCK_PAYMENTS`: add `schoolId` to each record (derivable today via the student's `schoolId`, but should be denormalized onto the record for direct filtering, consistent with how `ClassSchedule`/`SchoolSection`/`LearningMaterial` already carry `schoolId`).
- `MOCK_DISCOUNT_TYPES`: add `applicableAcademicUnit: "basic-ed" | "college" | "both"` to each existing entry (most can default to `"both"`), plus `effectiveSchoolYear: "2026-2027"`, `discountBasis: "Percentage"`, `isStackable: false`, `requiresDocument` (true for Government/Sibling/Scholarship types that already require approval).
- `MOCK_DISCOUNT_REQUESTS`: no structural change required for Phase 1–4; status union extension is additive.
- Consider 1–2 new mock CDSTA-side assessments/payments/discount requests so College-context testing isn't empty (currently `MOCK_ASSESSMENTS`/`MOCK_PAYMENTS` appear STSN-only based on student IDs `stud-enrico`, `stud-clara`, `stud-miguel`, `stud-juan`).

---

## 8. Phase-by-Phase Implementation Plan

### Phase 2 — Foundation / Types / Config (low risk)
- Add `schoolId` to `StudentAssessment`/`Payment`, extend `DiscountType` and `DiscountRequest["status"]` in `types/index.ts`.
- Add `accountingLabels`/`getAccountingTerms()` to `schools.config.ts` (or `school.types.ts` + `schools.config.ts`).
- Optionally create `src/config/accounting.config.ts` for shared constants.
- Update `MOCK_ASSESSMENTS`, `MOCK_PAYMENTS`, `MOCK_DISCOUNT_TYPES` with new fields.
- `npm run build` must pass with zero TS errors. No UI change yet.

### Phase 3 — Dashboard + Ledger Improvements
- `AccountingModulePage.tsx`: pull `activeSchool`/`academicUnit` from `useSTSNStore()`, call `getAccountingTerms(academicUnit)`.
- Dashboard: filter `assessments`/`payments`/`students` by `activeSchool` (when not `"ALL"`); add KPI tiles for Today's Collection, Pending Discount Requests (reuse existing `discountRequests` pending count), Students on Financial Hold (placeholder count = 0 until hold data exists).
- Ledger: filter student list by `activeSchool`; enrich selected-student header with Academic Unit label, Grade Level/Section (Basic Ed) or Program/Year Level (College) via `getAccountingTerms`; add action buttons (Add Payment — wire to existing `addPayment`; others as visually-present but non-functional placeholders initially: Generate SOA, Print Ledger, Apply Discount, Set/Clear Hold).
- Fix the dead `filterSemester` state (either wire it into `ledgerRows` filtering or remove it).

### Phase 4 — Discount Management Improvements
- Surface new `DiscountType` fields (Applicable Academic Unit, Effective SY, Discount Basis, Stackable, Requires Document, Max Amount) in the type table and the add/edit form.
- Add "Applies To: Basic Ed / College / Both" badge next to `discountSource`.
- Extend status badge map (`STATUS_COLORS`) for `Returned for Documents`/`Cancelled`/`Expired`.
- Keep approval/audit modal behavior unchanged.

### Phase 5 — Missing Workflow Tabs (placeholders only)
- Append `billing`, `holds`, `reports` tabs to `AccountingTab` union and tab bar.
- Each renders an enterprise-style empty state card ("Coming soon — Assessment & Billing workflow") with 2–3 mock summary tiles where data is cheaply derivable (e.g., Reports tab can reuse dashboard KPI calculations).

---

## 9. Risk Areas

1. **`schoolId` backfill correctness** — `MOCK_ASSESSMENTS`/`MOCK_PAYMENTS` don't currently carry `schoolId`; must be cross-referenced from `MOCK_STUDENTS` by `studentId` to assign correctly. A mismatch would make a student's ledger disappear under the wrong `activeSchool`.
2. **`activeSchool === "ALL"`** — SUPER_ADMIN sessions default to `"ALL"`. Dashboard/Ledger filtering logic must treat `"ALL"` as "no filter" (show everything), not as "show nothing."
3. **Optional fields on existing types** — all new fields must be optional (`?`) to avoid breaking existing mock data / other features (e.g., `Payment.schoolId?`, `DiscountType.applicableAcademicUnit?`) per "no backend, mock-driven prototype" constraint.
4. **Dead state (`filterSemester`)** — silently fixing this could change visible ledger rows in ways that look like a regression if not communicated in the test checklist.
5. **`StatCard`/`PageHeader` reuse** — refactoring the hand-rolled dashboard header/KPI markup to use the shared `StatCard`/`PageHeader` components is desirable but touches a lot of JSX; should be done carefully in Phase 3, not bundled with data-filtering changes, to keep diffs reviewable.
6. **Discount approval → assessment side-effect** — `approveDiscountRequest` in `store.ts` mutates `assessments` based on `studentId` match only; if multiple assessments exist per student across school years, ensure the correct one is targeted (currently `find()` returns the first match — pre-existing issue, not introduced by this plan, but worth flagging).

---

## 10. Build Validation Checklist

```text
[ ] npm run build completes with zero TypeScript errors
[ ] No new ESLint errors introduced (if lint is configured)
[ ] AccountingModule still exports default correctly and renders under App.tsx's
    activeModule === "ACCOUNTING" branch without runtime errors
[ ] No console errors/warnings on initial load of Accounting module for each role:
    SUPER_ADMIN, ACCOUNTING (STSN), ACCOUNTING (CDSTA)
[ ] All existing modals (Receipt Preview, Discount Type form, New Request form,
    Approval modal, Audit Trail modal) still open and close correctly
```

---

## 11. Manual Test Checklist

### Dashboard
```text
[ ] Login as ACCOUNTING (STSN) — dashboard KPIs reflect only STSN data
[ ] Login as ACCOUNTING (CDSTA) — dashboard KPIs reflect only CDSTA data
[ ] Login as SUPER_ADMIN with activeSchool = ALL — KPIs show combined data
[ ] New KPI tiles (Today's Collection, Pending Discount Requests, etc.) render
    without breaking the existing 6-card grid layout
```

### Student Ledger
```text
[ ] Student list shows only students for the active school context
[ ] Selected student header shows correct Basic Ed labels (Grade Level, Section)
    for STSN students
[ ] Selected student header shows correct College labels (Program, Year Level)
    for CDSTA students
[ ] School Year / Semester / Transaction Type filters update ledger rows correctly
    (including fixed/removed dead semester filter)
[ ] Balance summary cards (Total Assessed, Discount Applied, Total Paid, Balance)
    compute correctly
[ ] Receipt preview modal still opens from Payment Receipts grid
[ ] New action buttons (Add Payment etc.) render without layout breakage
```

### Discount Management
```text
[ ] Discount Types table shows new policy columns without overflow issues
[ ] Add/Edit Discount Type form accepts new fields and persists via store actions
[ ] Applicable Academic Unit badge displays correctly per discount type
[ ] All Requests / Government / Sibling sub-tabs still filter correctly
[ ] Approve/Reject modals and Audit Trail modal still function
[ ] New status values (Returned for Documents, Cancelled, Expired) render with
    distinct badge colors if used
```

### School Context Switching
```text
[ ] Switching activeSchool (STSN <-> CDSTA) via role quick-switch updates
    Accounting module labels and filtered data without full page reload issues
[ ] Theme (brown/gold) and overall layout remain unchanged across school contexts
```

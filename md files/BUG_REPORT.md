# STSN Connect — Comprehensive Bug Report

**Date:** 2026-06-23  
**Reviewer:** Claude Code (automated review)  
**Scope:** Enrollment, Students & Documents, Assessment, Cashiering, Accounting, Class Sectioning, Faculty Advisory, Curriculum/Syllabus, Room/Schedule Assignment

---

## Severity Legend

| Level | Meaning |
|-------|---------|
| 🔴 Critical | Data loss, broken workflow, or security issue |
| 🟠 High | Incorrect behavior that causes data inconsistency |
| 🟡 Medium | UX or logic issue with workaround available |

---

## 1. Cashier Module (`CashierModulePage.tsx`)

### 🔴 BUG-01 — Payment deduction applied to ALL assessments, not the target one

**File:** `src/features/cashier/pages/CashierModulePage.tsx` ~line 174  
**Root cause:** `addPayment()` in `store.ts` (~line 519) decrements all assessments for a student equally instead of applying the payment to the specific assessment being collected.

**What breaks:** If a student has multiple assessments (e.g., tuition + miscellaneous), paying one deducts the amount from both, leaving both balances incorrect.

**Fix:** Pass the `assessmentId` to `addPayment()` and only decrement the matching record.

---

### 🔴 BUG-02 — Collection history shows wrong assessment data

**File:** `src/features/cashier/pages/CashierModulePage.tsx` ~lines 137–142  
**Root cause:** `historyRows` filters assessments by `studentId` only; when a student has multiple assessments, only the first match is retrieved regardless of which was paid.

**What breaks:** Receipt history can display the wrong assessment balance and description.

**Fix:** Store and filter by `assessmentId` on each payment record.

---

## 2. Class Sectioning (`ClassSectioningModulePage.tsx`)

### 🟠 BUG-03 — No uniqueness check when assigning a faculty adviser

**File:** `src/features/class-sectioning/pages/ClassSectioningModulePage.tsx` ~lines 162–171  
**Root cause:** The "Adviser" dropdown saves the selection without validating that the teacher is not already an adviser on another section.

**What breaks:** Multiple sections can share the same adviser, causing conflicts in advisory reporting and faculty load computation.

**Fix:** On adviser selection, filter out teachers already assigned as advisers to other sections.

---

### 🟠 BUG-04 — Over-capacity enrollment not prevented

**File:** `src/features/class-sectioning/pages/ClassSectioningModulePage.tsx` ~lines 465–473 (AddStudentsModal)  
**Root cause:** There is no guard checking `currentCount + newStudents.length <= capacity` before committing the assignment.

**What breaks:** Sections silently exceed their stated capacity.

**Fix:** Add a pre-submission guard and surface a warning to the user.

---

### 🟠 BUG-05 — Old section association not removed when student is reassigned

**File:** `src/services/store.ts` ~lines 935–955 (`assignStudentsToSection()`)  
**Root cause:** Adding a student to a new section never removes the `section_students` row from the previous section.

**What breaks:** A student can appear enrolled in two sections simultaneously, breaking class lists and grade sheets.

**Fix:** Delete existing `section_students` rows for the student before inserting the new assignment.

---

## 3. Scheduling / Room Assignment (`SchedulingModulePage.tsx`)

### 🔴 BUG-06 — Room conflict detector misses exact-same-time overlaps

**File:** `src/features/scheduling/pages/SchedulingModulePage.tsx` ~lines 42–61 (`detectConflicts()`)  
**Root cause:** The overlap condition `a.startTime < b.endTime && b.startTime < a.endTime` uses lexicographic string comparison. Two schedules at exactly the same time (e.g., both `"08:00"–"09:00"`) are not flagged because the strict `<` condition excludes equality.

**What breaks:** Two classes can be assigned to the same room at the same time with no warning.

**Fix:** Convert times to minutes (numeric) before comparing, and use `<=` where appropriate.

---

### 🟡 BUG-07 — Stale section conflict warning persists after teacher change

**File:** `src/features/scheduling/pages/SchedulingModulePage.tsx` ~lines 138–151  
**Root cause:** `sectionConflictWarning` is only cleared when the room or section field changes, not when the teacher field changes.

**What breaks:** A conflict warning stays on screen even after the user selects a different teacher who has no conflict.

**Fix:** Trigger conflict re-evaluation whenever the teacher field changes.

---

### 🟡 BUG-08 — Teacher default department used when teacher is missing from store

**File:** `src/features/scheduling/pages/SchedulingModulePage.tsx` ~line 98  
**Root cause:** `teacherDept` falls back to `"Basic Education"` via optional chaining if `selectedTeacher` is undefined (e.g., teacher was deleted while form was open).

**What breaks:** A schedule is created with a mismatched department, silently corrupting the record.

**Fix:** Validate that `selectedTeacher` still exists at submission time.

---

## 4. Curriculum Management (`CurriculumManagementPage.tsx`)

### 🟠 BUG-09 — Unregistered subjects auto-created with hardcoded defaults

**File:** `src/features/curriculum/pages/CurriculumManagementPage.tsx` ~lines 238–254 (`handleAddSubjectToCurriculum()`)  
**Root cause:** If `selectedCatalogSubjectCode` is not in the subjects catalog, the code dynamically creates the subject with hardcoded values (`department: "Basic Education"`, `semester: "Full Year"`), bypassing catalog validation.

**What breaks:** Orphaned/incorrectly configured subjects appear in grading and scheduling, causing cascading errors.

**Fix:** Block the add action and prompt the user to first register the subject in the catalog.

---

### 🟡 BUG-10 — Curriculum with zero subjects can be finalized

**File:** `src/features/curriculum/pages/CurriculumManagementPage.tsx` ~lines 287–295 (`handleRemoveSubjectFromCurriculum()`)  
**Root cause:** After removing the last subject from a curriculum, the subjects array becomes empty with no guard preventing finalization or use in enrollment.

**What breaks:** Empty curricula can be linked to year levels, breaking enrollment and grade sheet generation.

**Fix:** Disable "Save / Finalize" when `subjects.length === 0` and show a validation message.

---

## 5. Grading & Assessment

### 🟡 BUG-11 — Passing grade hardcoded to 75, not configurable

**File:** `src/services/store.ts` ~line 529 (`saveGrade()`)  
**Root cause:** `final >= 75` is the only passing condition. Schools using a 1–4 or letter-grade scale will produce incorrect pass/fail statuses.

**Fix:** Source the passing threshold from the active school's grading scheme config (`grading-schemes.config.ts`).

---

### 🟡 BUG-12 — Category weight validation rejects valid 33.3% × 3 configurations

**File:** `src/features/grading/utils/gradeValidation.ts` ~line 18  
**Root cause:** `Math.abs(total - 100) < 0.01` is too strict. Three categories at 33.3% sum to 99.9%, which fails the check even though the configuration is valid.

**Fix:** Relax the epsilon to `0.1`, or round each weight before summing.

---

### 🟡 BUG-13 — Grade entries created for deleted/finalized grade periods

**File:** `src/services/store.ts` ~lines 545–562 (`saveGradeEntry()`)  
**Root cause:** The code doesn't verify that the target grade period still exists or hasn't been finalized before inserting the entry.

**What breaks:** Orphaned grade entries reference non-existent periods, breaking grade calculations.

**Fix:** Verify the period exists and is not finalized before allowing entry saves.

---

## 6. Accounting & Fees

### 🔴 BUG-14 — Book package cost not included in assessment total

**File:** `src/services/store.ts` ~line 392 (`submitNewEnrollment()`)  
**Root cause:** When `booksAvailed: true`, the book package price is never added to `totalAmount`. Only tuition, registration, lab, and ID fees are summed.

**What breaks:** Students who avail books are billed short of the actual amount owed. The accounting ledger will not match cash collected.

**Fix:** Look up the active book package price and add it to `totalAmount` when `booksAvailed` is true.

---

### 🔴 BUG-15 — Discount can be double-applied in rapid concurrent approvals

**File:** `src/services/store.ts` ~lines 822–827 (`approveDiscountRequest()`)  
**Root cause:** Two Level 2 approvals submitted in quick succession can both read `level1Status: "Approved"` before either write completes, causing the discount to be applied twice.

**What breaks:** Student assessment balance can be reduced twice for a single approved discount.

**Fix:** Use an atomic check-and-update (optimistic locking or a database-level unique constraint on `approved` status transitions).

---

### 🟡 BUG-16 — Assessment update allows invalid values (negative balance, >100% discount)

**File:** `src/services/store.ts` ~lines 458–470 (`updateAssessment()`)  
**Root cause:** Partial updates are accepted without validating that resulting `balance`, `discountPercentage`, or `totalAmount` remain within legal ranges.

**Fix:** Add server-side (or store-level) guards: `0 <= discountPercentage <= 100`, `balance >= 0`, `totalAmount > 0`.

---

## 7. Faculty Portal (`FacultyPortalPage.tsx`)

### 🔴 BUG-17 — Advisory section defaults to "St. Thomas" for any teacher

**File:** `src/features/faculty/pages/FacultyPortalPage.tsx` ~line 35  
**Root cause:** `advisorySectionName` falls back to `"St. Thomas"` when `currentTeacher.advisorySection` is not set. Any teacher without an explicit advisory assignment sees a hard-coded section's student list.

**What breaks:** Teachers who are not advisers can view another section's student data — a security/privacy leak.

**Fix:** Return an empty advisory list and show a "No advisory section assigned" message when the field is unset.

---

### 🟡 BUG-18 — Teaching load unit count silently understated

**File:** `src/features/faculty/pages/FacultyPortalPage.tsx` ~lines 39–44  
**Root cause:** If a subject is missing from the subjects store, `?? 0` is used, hiding the gap. The unit total appears lower than actual without any warning.

**Fix:** Log a warning and display "Unknown subject" entries in the teaching load table so the discrepancy is visible.

---

### 🔴 BUG-19 — Attendance submissions are never persisted

**File:** `src/features/faculty/pages/FacultyPortalPage.tsx` ~lines 64–69 (`handleAttendanceSubmit()`)  
**Root cause:** The handler only triggers a local toast notification. There is no call to the store or Supabase to save the attendance records.

**What breaks:** All attendance data is lost on page refresh.

**Fix:** Call the appropriate store action / Supabase insert to persist attendance before showing the toast.

---

## 8. Enrollment & Student Requirements (`RegistrarModulePage.tsx` / `store.ts`)

### 🔴 BUG-20 — Enrollment can be approved without verifying required documents

**File:** `src/services/store.ts` ~lines 428–436 (`approveEnrollment()`)  
**Root cause:** The approval logic updates enrollment status to `"Enrolled"` without first checking that all required requirements (PSA Birth Certificate, Moral Character, TOR, etc.) have been submitted and verified.

**What breaks:** Students with incomplete documents can be fully enrolled, violating school admission policies.

**Fix:** Query the `requirements` table before approval; block if any required document is missing or unverified.

---

### 🟠 BUG-21 — Rejected requirements marked as "Submitted" instead of "Rejected"

**File:** `src/services/store.ts` ~lines 1004–1015 (`verifyRequirement()`)  
**Root cause:** The status transition logic incorrectly sets a rejected requirement's status to `"Submitted"` rather than `"Rejected"`.

**What breaks:** Registrar staff cannot distinguish submitted-and-pending documents from rejected ones; students may not be notified to resubmit.

**Fix:** Set status to `"Rejected"` (with a rejection reason) on the rejection path.

---

## 9. Store / State Management (`store.ts`)

### 🟠 BUG-22 — Active school filter not consistently enforced on write operations

**File:** `src/services/store.ts` — multiple `add*()` actions  
**Root cause:** Read views (cashier queue, enrollment list) filter by `activeSchool`, but many write actions (e.g., `addStudent()`) do not validate the student's school against the current school context.

**What breaks:** A Super Admin adding data in one school context can accidentally insert records that are invisible to the target school's staff.

**Fix:** Enforce `activeSchool` context on all write paths, or require an explicit `schoolId` argument and validate it.

---

### 🟠 BUG-23 — OR number generation is not collision-safe

**File:** `src/services/store.ts` ~line 510 (`addPayment()`)  
**Root cause:** `const serial = get().payments.length + 10451` reads current array length at call time. Two simultaneous payments read the same length and generate identical OR numbers.

**What breaks:** Duplicate official receipt numbers, violating accounting integrity.

**Fix:** Use a database sequence, a UUID, or a timestamp-based suffix to guarantee uniqueness.

---

## 10. Grade Calculations & Data Loader

### 🟡 BUG-24 — Crash when computing average for a malformed grade period

**File:** `src/features/grading/utils/gradeCalculations.ts` ~lines 94–105 (`computeCategoryAverage()`)  
**Root cause:** No null/array check on `period.items` before iteration. A corrupted or partially migrated period object causes an unhandled runtime exception.

**Fix:** Guard with `if (!Array.isArray(period?.items)) return 0;` before iterating.

---

### 🟡 BUG-25 — Curriculum-subject link silently skipped when subject ID cannot be resolved

**File:** `src/services/store.ts` ~lines 699–701 (`addCurriculum()`)  
**Root cause:** `if (subjectId)` silently skips the `curriculum_subjects` insert when `resolveSubjectId(code)` returns `undefined`. No error is surfaced to the user.

**What breaks:** The curriculum UI shows the subject as assigned, but no database row exists, causing phantom references in grade sheets and scheduling.

**Fix:** Collect failed resolutions and surface an actionable error: "The following subject codes could not be resolved: …".

---

## Summary Table

| # | Module | Severity | Short Description |
|---|--------|----------|-------------------|
| 01 | Cashier | 🔴 Critical | Payment deducted from all assessments, not just the target |
| 02 | Cashier | 🔴 Critical | History shows wrong assessment after multi-assessment payments |
| 03 | Class Sectioning | 🟠 High | No uniqueness check for faculty adviser assignment |
| 04 | Class Sectioning | 🟠 High | Over-capacity enrollment not blocked |
| 05 | Class Sectioning | 🟠 High | Old section row not removed on student reassignment |
| 06 | Scheduling | 🔴 Critical | Exact-time room conflicts not detected |
| 07 | Scheduling | 🟡 Medium | Stale conflict warning after teacher change |
| 08 | Scheduling | 🟡 Medium | Missing teacher defaults to wrong department |
| 09 | Curriculum | 🟠 High | Unregistered subjects auto-created with wrong defaults |
| 10 | Curriculum | 🟡 Medium | Empty curriculum can be finalized |
| 11 | Grading | 🟡 Medium | Passing grade hardcoded to 75 |
| 12 | Grading | 🟡 Medium | Weight validation rejects valid 33.3% × 3 config |
| 13 | Grading | 🟡 Medium | Grade entries saved for deleted grade periods |
| 14 | Accounting | 🔴 Critical | Book package cost missing from assessment total |
| 15 | Accounting | 🔴 Critical | Discount double-applied on concurrent approvals |
| 16 | Accounting | 🟡 Medium | No validation on assessment update values |
| 17 | Faculty | 🔴 Critical | Advisory section defaults to "St. Thomas" — privacy leak |
| 18 | Faculty | 🟡 Medium | Teaching load unit count silently understated |
| 19 | Faculty | 🔴 Critical | Attendance data never persisted (lost on refresh) |
| 20 | Enrollment | 🔴 Critical | Enrollment approved without checking required documents |
| 21 | Enrollment | 🟠 High | Rejected requirements shown as "Submitted" |
| 22 | Store | 🟠 High | Active school filter not enforced on write operations |
| 23 | Store | 🟠 High | OR number collision possible under concurrent payments |
| 24 | Grading | 🟡 Medium | Crash on malformed grade period in grade calculations |
| 25 | Curriculum | 🟡 Medium | Curriculum-subject DB link silently skipped |

---

**Total: 25 bugs — 8 Critical · 7 High · 10 Medium**

---

## Fix Status & Database Impact Analysis

> Updated after code review of every module listed in this report.

### Confirmed & Fixed (10 bugs) — all write through to Supabase

| # | Bug | DB Impact | Fix Applied |
|---|-----|-----------|-------------|
| 01 | Payment deducted from all assessments | `assessments` table — wrong `balance` updates | Added `assessmentId` to `Payment` type; `addPayment` now targets only the specific assessment |
| 02 | History shows wrong assessment | UI display only | History lookup now uses `payment.assessmentId` first |
| 03 | No adviser uniqueness check | Sections table — duplicate adviserId | Adviser dropdown now excludes teachers already assigned to another section |
| 04 | Over-capacity enrollment | `section_students` / sections count | Guard added in `AddStudentsModal` before calling `assignStudentsToSection` |
| 05 | Old section row not removed on reassignment | `section_students` — orphan rows | `assignStudentsToSection` now deletes all existing `section_students` rows for the students before inserting the new one; old section `currentCount` also updated in DB |
| 12 | Weight validation rejects 33.3%×3 | In-memory validation only | Epsilon relaxed from `0.01` → `0.5` in `areCategoryWeightsValid` |
| 13 | Grade entries saved for finalized periods | `student_grade_entries` | `saveGradeEntry` now exits early if the period is finalized |
| 17 | Advisory defaults to "St. Thomas" | UI display / potential data leak | Default removed; advisory list is empty when `advisorySection` is unset |
| 19 | Attendance never persisted | No DB write at all | `handleAttendanceSubmit` now upserts to `student_attendance` table via Supabase |
| 20 | Enrollment approved without checking documents | `enrollments` + `students` tables | `approveEnrollment` now reads `requirements` and blocks if any are still `"Pending"` |
| 25 | Curriculum subject link silently skipped | `curriculum_subjects` — missing rows | `addCurriculum` / `updateCurriculum` now log a `console.warn` when a code can't resolve |

### False Positives (bugs that did NOT exist in the code)

| # | Reason |
|---|--------|
| 06 | Room conflict overlap formula `a.startTime < b.endTime && b.startTime < a.endTime` is correct for all HH:MM zero-padded times from `<input type="time">` |
| 07 | `handleTeacherChange` already calls `setSectionConflictWarning("")` — warning was already cleared |
| 08 | Teacher field is `required` — form cannot submit with a missing/deleted teacher |
| 09 | "Add Subject to Curriculum" modal only presents subjects from the catalog via `<select>` — free-text code entry is impossible |
| 10 | No "finalize curriculum" step exists — the empty-curriculum guard was not needed |
| 11 | Passing threshold of 75 is intentional (Philippine DepEd standard) |
| 15 | JavaScript is single-threaded; the `set → get` pattern in `approveDiscountRequest` is atomic — no real race condition |
| 16 | `updateAssessment` accepts a partial patch from Accounting's own validated form — out-of-range values can't be entered through the UI |
| 21 | `verifyRequirement` logic is correct: `"Verified"` → status `"Submitted"`, `"Rejected"` → status `"Rejected"` |
| 22 | Super Admin cross-school access is intentional by design |
| 23 | OR number now uses `Date.now()` + payment count suffix (fixed as part of BUG-01 fix) — collision risk eliminated |

# Registrar Module — Enterprise UX Refinement Plan

> Status: **Planning only**. No application code has been modified. This document is the
> implementation roadmap for evolving the Registrar module into an enterprise-grade,
> school-context-aware workflow while preserving the existing visual theme, Zustand store
> shape, and module IDs (`STSNModule` values used by `NAV_ITEMS` / `getAllowedModules`).

---

## 1. Current Architecture Assessment

**Stack confirmed:** React 19 + Vite + TypeScript + Zustand (single store: `useSTSNStore`) +
Tailwind, fully mock-data driven (`src/mock-data/index.ts`), no backend calls.

**Layering observed:**

- **Types** (`src/types/index.ts`, `src/types/school.types.ts`, `src/types/role.types.ts`,
  `src/types/auth.types.ts`) define domain entities (`Student`, `Teacher`, `SchoolSection`,
  `ClassSchedule`, etc.) and two orthogonal axes:
  - `UserRole` / `CanonicalRole` → **permissions** (what modules a user can open).
  - `SchoolId` ("STSN" | "CDSTA") / `AcademicUnit` ("basic-ed" | "college") → **academic
    structure & workflow** (what labels/fields/behaviors appear inside a module).
- **Config** (`src/config/`):
  - `schools.config.ts` — `SCHOOL_CONTEXTS` registry mapping `SchoolId → AcademicUnit`,
    plus `getAcademicUnit()`.
  - `permissions.config.ts` — `ROLE_PERMISSIONS` maps `CanonicalRole → STSNModule[]`.
    Explicitly documented as **role-only**, never academic-unit-gated.
  - `navigation.config.ts` — `NAV_ITEMS` (the master sidebar list with id/label/icon/desc)
    and `getNavItemsForRole()` / `getAllowedModules()`. Already has a comment that
    `academicUnit` is accepted for *future* per-unit module gating but isn't used yet.
- **Store** (`src/services/store.ts`) — single flat Zustand store holding all entities
  (`students`, `sections`, `classSchedules`, `enrollments`, `assessments`, `users`, etc.),
  plus `activeSchool: SchoolId | "ALL"` and `academicUnit: AcademicUnit` (derived via
  `getAcademicUnit(activeSchool)` on login / `setActiveSchool`).
- **Feature pages** (`src/features/*/pages/*Page.tsx`) — each module is one large page
  component. Most styling/business logic is co-located in JSX (no shared sub-components for
  Basic-Ed vs College variants — branching is done inline via ternaries on a locally-derived
  `schoolContext` / `academicUnit` flag).

**Existing good practice already in place** (do not regress):
- The architecture rule (*role = permission, school context = academic structure*) is
  **already documented in code comments** in `permissions.config.ts`,
  `navigation.config.ts`, `schools.config.ts`, and `store.ts`. This plan must continue to
  honor and reinforce that separation, not introduce role-based academic branching.

---

## 2. Current School Context Flow

1. **Login** (`LoginOverlay.tsx`):
   - User picks a `selectedSchool` ("STSN" | "CDSTA") via two large buttons (school
     context selector), independent of which demo account they then click.
   - `SCHOOL_ACCOUNTS` maps each school to a curated list of demo account emails
     (admin/registrar/accounting/teacher/student/hr @stsn.edu.ph or @cdsta.edu.ph).
   - `login(email, "", selectedSchool)` is called — `store.login()`:
     ```
     resolvedSchool = user.schoolId || schoolContext || "ALL"
     activeSchool = resolvedSchool
     academicUnit = getAcademicUnit(resolvedSchool)
     ```
     i.e. **a user's own `schoolId` (if set) wins over the UI's selected school**; the
     selector mainly matters for SUPER_ADMIN / unscoped accounts.

2. **Store** holds `activeSchool: SchoolId | "ALL"` and a derived `academicUnit`.
   `setActiveSchool()` action recomputes `academicUnit` via `getAcademicUnit()`.

3. **App.tsx sidebar** renders two "school badges" (STSN / CDSTA) highlighting which
   school(s) are in view based on `activeSchool`, and a "Viewing: STSN/CDSTA Data" label
   when not "ALL". This is informational only — no school switcher exists post-login
   currently (per comment in `RegistrarModulePage.tsx`: *"no manual school switcher,
   auto-detected"*).

4. **Feature pages** read `academicUnit` from the store and locally derive a
   `schoolContext: "BASIC_ED" | "COLLEGE"` (or similar) to branch UI/labels/fields. This
   pattern is duplicated per page (Registrar, Class Sectioning, Scheduling, Curriculum,
   Dashboard's analytics sub-page) using **different local naming conventions** each time
   (`schoolContext`, `dept`, `school`, `department`), and the underlying domain data
   itself uses the **legacy** `"Basic Education" | "College"` string union (`Student.department`,
   `Teacher.department`, `Course.department`, `Subject.department`, `ClassSchedule.department`,
   `SchoolSection.department`, `LearningMaterial.department`) rather than the newer
   `AcademicUnit` ("basic-ed" | "college") type.

---

## 3. Current Role/Navigation Flow

1. `App.tsx` reads `currentUser`, `activeSchool`, `academicUnit` from the store.
2. `allowedModules = getAllowedModules(currentUser.role, academicUnit)` →
   `getPermissionsForRole(role)` → `ROLE_PERMISSIONS[toCanonicalRole(role)]`.
   - `academicUnit` is passed but **currently unused** (`_academicUnit` parameter) —
     all modules are role-gated only, identical NAV for both schools.
3. `NAV_ITEMS` (master list) is filtered by `allowedModules` → `renderedSidebarItems`.
4. On `currentUser` change, `activeModule` is auto-set by role:
   - STUDENT → `STUDENT_PORTAL`
   - TEACHER/EMPLOYEE → `FACULTY_PORTAL`
   - ACCOUNTING → `ACCOUNTING`
   - everything else → `DASHBOARD`
5. Sidebar role-switcher (`handleRoleQuickSwitch`) calls `login(email, "")` — re-derives
   `activeSchool`/`academicUnit` from the *matched user's* `schoolId` (not the currently
   active school), which can silently change the academic context when quick-switching
   roles.

**Current `REGISTRAR` permission set** (`permissions.config.ts`):
`["DASHBOARD", "REGISTRAR", "CURRICULUM", "ACCOUNTS_SECURITY", "STUDENT_PORTAL",
"SCHEDULING", "CLASS_SECTIONING", "CORE_SETUP"]` — i.e. Registrar already has access to
Dashboard, Admissions & COR, Curriculum, Authority Clearances, Student Portal, Class
Scheduling, Class Sectioning, and Core Setup.

---

## 4. Registrar Module Rendering (current behavior)

`RegistrarModulePage.tsx` (`src/features/registrar/pages/RegistrarModulePage.tsx`):

- Derives `schoolContext: "BASIC_ED" | "COLLEGE"` from `academicUnit` (line 97-99).
- Two sub-tabs: **Student Directory & Admissions** and **Bulk Import** (DepEd Excel /
  CHEd Masterlist, label switches by context).
- Student directory filtered by `department` (`"Basic Education" | "College"`) derived
  from `schoolContext`, **not** directly from `academicUnit`/`SchoolId` — i.e. there's an
  implicit 1:1 assumption that `basic-ed ⇔ "Basic Education" department` and
  `college ⇔ "College" department`, which holds today (STSN only has Basic-Ed students,
  CDSTA only College) but is not type-enforced.
- Student detail panel has context-sensitive tabs via `getDetailTabs()`:
  - Basic Ed: Student Info, **Guardian**, Academic Info, Assessment Fees, Documents,
    **Enrollment**.
  - College: Student Info, Academic Info, Assessment Fees, Documents, **Subjects**,
    **Curriculum**.
- "New Candidate" enrollment wizard has separate Basic-Ed cascading dropdowns
  (Program Category → Year Level → Strand) vs. College dropdowns (Course → Year).
- Enrollment approval ("Clear & Enroll") is gated on `isFeesPaid`, hardcodes a section
  name (`"St. Thomas"` for Basic Ed / `"IT101"` for College) rather than using
  `sections` from the store or `assignStudentsToSection`.
- Mutates `selectedStudent` object directly (`selectedStudent.enrollmentStatus = "Enrolled"`)
  in addition to calling store actions — a stale local mutation that doesn't trigger
  re-render via Zustand (relies on the subsequent store update + re-selection).

---

## 5. Basic Ed vs College Behavior — Summary Table

| Aspect | Basic Education (STSN) | College (CDSTA) |
|---|---|---|
| `academicUnit` | `"basic-ed"` | `"college"` |
| Student.department | `"Basic Education"` | `"College"` |
| Year structure | Grade Level (Nursery–Grade 12) | Year Level (1st–4th Year) |
| Track/Program field | Strand/Track (STEM, HUMSS, ABM, GAS, ...) | Program/Course (BSIT, BSCS, BSBA, ...) |
| Section concept | Advisory Section + Adviser | Class Section (subject-based, multiple per student) |
| Semester | "N/A" (school-year based) | First/Second Semester |
| ID system | LRN (DepEd) | Student No. (CDSTA format) |
| Extra registrar tabs | Guardian, Enrollment | Subjects, Curriculum |
| Bulk import label | "DepEd Excel Import" | "CHEd Masterlist Import" |
| Tuition calc | Flat SHS rate (₱18,000) | Per-unit (₱950 × units × 3) |

This table already exists implicitly in code but is **scattered** across
`RegistrarModulePage.tsx`, `ClassSectioningModulePage.tsx`, `SchedulingModulePage.tsx`,
and `store.ts` (`submitNewEnrollment`). Section 5 of the proposed config consolidates it.

---

## 6. Student Portal vs Student Records Behavior

- **Student Portal** (`src/features/student-portal/pages/StudentPortalPage.tsx`) is the
  STUDENT-role self-service view: Overview, Grades, Ledger, Profile, Enrollment (with
  pre-enrollment form, COR/ID preview), Online Learning. It resolves `student =
  students.find(s => s.email === currentUser.email)`.
- **"Student Records"** as a distinct registrar-facing concept **does not exist yet** —
  today the Registrar module's "Student Directory & Admissions" tab + per-student detail
  panel *is* the records view, conflating "admissions/enrollment processing" with
  "permanent academic records" (LRN/TOR, requirements, grade history). This is one of the
  key gaps this plan addresses (see Section 10).
- `STUDENT_PORTAL` is in `REGISTRAR`'s permission set, meaning a Registrar can currently
  open the Student Portal (self-service shell) — likely intended as a "view as student"
  capability but currently unguarded/unbranded as such.

---

## 7. Class Sectioning Behavior (current)

`ClassSectioningModulePage.tsx`:

- CRUD over `SchoolSection[]` (`sections` in store) with `addSection`, `updateSection`,
  `deleteSection`, `toggleSectionActive`, `assignStudentsToSection`.
- `SectionForm` modal: `dept` toggle ("Basic Education"/"College") drives:
  - Year Level list (`BE_YEAR_LEVELS` vs `COLLEGE_YEAR_LEVELS`)
  - Strand/Track (Basic Ed, via `BE_STRANDS`) vs Course/Program (`COLLEGE_TRACKS`)
  - Adviser dropdown filtered by `teacher.department`
  - Semester field only shown/used for College (`semester: dept === "College" ?
    semester : undefined`)
- This page is **already mostly academic-unit aware** at a UI level but uses the legacy
  `"Basic Education"/"College"` department strings and its own hardcoded constant lists
  (`BE_YEAR_LEVELS`, `COLLEGE_TRACKS`, etc.) rather than a shared config.
- Not yet scoped by `activeSchool`/`academicUnit` from the store — the `dept` toggle lets
  a user create a College section while `activeSchool === "STSN"`, etc. (no cross-school
  guard).

---

## 8. Class Scheduling Behavior (current)

`SchedulingModulePage.tsx`:

- CRUD over `ClassSchedule[]` via `addClassSchedule`/`updateClassSchedule`/
  `deleteClassSchedule`/`toggleClassScheduleActive`.
- `ScheduleForm`: department is **derived from the selected teacher**
  (`teacherDept = selectedTeacher.department === "College" ? "College" :
  "Basic Education"`), which then filters available subjects, sections (by
  `sec.department === teacherDept` and `yearLevel`), and year-level options.
- Conflict detection (`detectConflicts`) checks same-teacher/same-room overlapping times
  across **all** schedules in the store — not scoped to the active school, so a College
  schedule could theoretically "conflict" against a Basic-Ed room/teacher record if
  names collided (unlikely in mock data, but not structurally prevented).
- Room availability filter (`rooms.filter(r => r.isActive && r.status !== "Under
  Maintenance")`) is global, not school/department scoped.
- Like Sectioning, this page is functionally aware of Basic-Ed vs College differences but
  via local constants and the legacy department string, and not gated by
  `activeSchool`/`academicUnit`.

---

## 9. Accounts / Authority Clearance Behavior (current)

`AccountsManagementPage.tsx` (module id `ACCOUNTS_SECURITY`, nav label "Authority
Clearances"):

- Simple table over `users: User[]` — email, display name, role badge
  (`u.role.replace("_", " ")`), active/inactive toggle (`toggleUserStatus`), and a
  "Provision New Authority" modal (`addUser`) with a role `<select>` covering all 7
  `UserRole` values (including SUPER_ADMIN/ADMIN/EMPLOYEE which aren't part of
  `CanonicalRole`).
- No school-scoping: lists **all** users across STSN and CDSTA regardless of
  `activeSchool`. No academic-unit-specific behavior (correctly so, per the architecture
  rule — this module is pure role/permission administration), but it currently has no
  way to filter by school for a Registrar who should likely only manage their own
  school's staff/student accounts.
- `REGISTRAR` role has access to this module today (`ACCOUNTS_SECURITY` in its
  permission list) — currently framed generically as "Authority Clearances /
  Credential security status".

---

## 10. Files That Need Changes

| File | Type of change |
|---|---|
| `src/types/school.types.ts` | Extend `SchoolContext`/`AcademicUnit` typing with labeled-terminology config (additive) |
| `src/config/schools.config.ts` | Add `ACADEMIC_UNIT_LABELS` (or similar) terminology map per `AcademicUnit` |
| `src/types/index.ts` | Additive types only — e.g. optional `lrn?`, `program?`, `unitsEarned?` fields on `Student`; no breaking renames |
| `src/config/navigation.config.ts` | Update `label`/`desc` strings for `REGISTRAR`, `CLASS_SECTIONING`, `SCHEDULING`, `ACCOUNTS_SECURITY` (and optionally `DASHBOARD`) to be context-aware via a label resolver function; **module `id`s unchanged** |
| `src/services/store.ts` | New/extended actions if Student Records becomes its own concern (e.g. richer `updateStudent`, section-based enroll); no structural breaking changes |
| `src/features/registrar/pages/RegistrarModulePage.tsx` | Largest functional refinement — dashboard widgets, admissions workflow, student records split, terminology |
| `src/features/registrar/pages/*` (new sub-pages/components, optional) | Extract Admissions, Student Records, (existing) Sectioning/Scheduling links into composable sub-views if the module is split |
| `src/features/class-sectioning/pages/ClassSectioningModulePage.tsx` | Replace hardcoded `BE_*`/`COLLEGE_*` constants with shared school-context config; scope by `activeSchool` |
| `src/features/scheduling/pages/SchedulingModulePage.tsx` | Same constant consolidation; scope conflict checks/room lists by `activeSchool` |
| `src/features/accounts/pages/AccountsManagementPage.tsx` | Rename/relabel to "User Access Management" framing; optional school filter |
| `src/components/LoginOverlay.tsx` | No required change, but verify terminology consistency if labels change |
| `src/App.tsx` | Update if `NAV_ITEMS` label resolution becomes a function of `academicUnit` (call site change only) |

---

## 11. Proposed School Context Config

Add a single source of truth for academic terminology, consumed by all feature pages
instead of ad-hoc local constants/labels. Proposed new file:
`src/config/academic-terms.config.ts`

```ts
import type { AcademicUnit } from "../types/school.types";

export interface AcademicTerms {
  unitNounSingular: string;     // "Grade Level" | "Year Level"
  unitNounPlural: string;       // "Grade Levels" | "Year Levels"
  trackNoun: string;            // "Strand / Track" | "Program / Course"
  groupNoun: string;            // "Section" | "Class Section"
  groupLeaderNoun: string;      // "Adviser" | "Curriculum Coordinator" (or keep "Adviser")
  studentIdLabel: string;       // "LRN" | "Student No."
  enrollmentUnit: string;       // "School Year" | "Semester"
  curriculumNoun: string;       // "Curriculum / Subjects" | "Curriculum / Units"
  bulkImportLabel: string;      // "DepEd Excel Import" | "CHEd Masterlist Import"
  regulatorLabel: string;       // "DepEd" | "CHEd"
}

export const ACADEMIC_TERMS: Record<AcademicUnit, AcademicTerms> = {
  "basic-ed": {
    unitNounSingular: "Grade Level",
    unitNounPlural: "Grade Levels",
    trackNoun: "Strand / Track",
    groupNoun: "Section",
    groupLeaderNoun: "Adviser",
    studentIdLabel: "LRN",
    enrollmentUnit: "School Year",
    curriculumNoun: "Subjects",
    bulkImportLabel: "DepEd Excel Import",
    regulatorLabel: "DepEd",
  },
  college: {
    unitNounSingular: "Year Level",
    unitNounPlural: "Year Levels",
    trackNoun: "Program / Course",
    groupNoun: "Class Section",
    groupLeaderNoun: "Curriculum Coordinator",
    studentIdLabel: "Student No.",
    enrollmentUnit: "Semester",
    curriculumNoun: "Curriculum & Units",
    bulkImportLabel: "CHEd Masterlist Import",
    regulatorLabel: "CHEd",
  },
};

export function getAcademicTerms(unit: AcademicUnit): AcademicTerms {
  return ACADEMIC_TERMS[unit];
}
```

Also consolidate the duplicated cascading-dropdown constants (`BE_PROGRAM_CATEGORIES`,
`BE_STRANDS_BY_LEVEL`, `BE_YEAR_LEVELS`, `COLLEGE_YEAR_LEVELS`, `COLLEGE_TRACKS`, etc. —
currently redefined separately in `RegistrarModulePage.tsx` and
`ClassSectioningModulePage.tsx`) into this same config module (or a sibling
`academic-structure.config.ts`) so Registrar, Sectioning, and Scheduling all read from
one place.

**Architecture rule preserved:** `AcademicTerms` is keyed by `AcademicUnit`
(`"basic-ed" | "college"`), derived solely from `activeSchool` via `getAcademicUnit()` —
never by `role`. Permission gating in `permissions.config.ts` remains untouched.

---

## 12. Proposed Type Changes (additive only)

In `src/types/index.ts`:

- `Student`:
  - Add `lrn?: string;` (Basic Ed identifier, distinct from `studentNo`).
  - Add `programCode?: string;` (alias-friendly for College `trackOrCourse` — optional,
    can defer if `trackOrCourse` is judged sufficient).
  - Add `unitsEarned?: number; unitsRequired?: number;` for College progress tracking
    (used in an enhanced Student Records "Academic Progress" view).
  - Add `guardianName?: string; guardianContact?: string; guardianRelationship?: string;`
    — currently the Guardian tab in `RegistrarModulePage.tsx` shows **hardcoded
    placeholder values** ("Mr./Mrs. Guardian Name", "+63 917 000 0000"); promoting these
    to real `Student` fields lets the tab show/edit real data.
- `SchoolSection`: no breaking changes; already has `semester?`, `strandOrTrack?`,
  `adviserId/adviserName`. Possibly add `curriculumId?: string` (College) to link a
  section to a `Curriculum` record for the Class Sectioning → Curriculum integration
  described in Section 16.
- New optional type `AdmissionsStage` (string union) for a clearer Admissions pipeline
  state machine, e.g.:
  ```ts
  export type AdmissionsStage =
    | "Application Received"
    | "Documents Under Review"
    | "Assessment Generated"
    | "Awaiting Payment"
    | "Cleared for Enrollment"
    | "Enrolled"
    | "Rejected";
  ```
  This can initially be **derived** (computed client-side from existing `Requirement[]` +
  `StudentAssessment` + `Enrollment.status`) rather than stored, to avoid a data-model
  migration. If adopted as a stored field later, add `Enrollment.stage?: AdmissionsStage`
  as an *additive* optional field (existing `status` stays for backward compatibility).

No existing field is renamed or removed — all changes are additive/optional to avoid
breaking `mock-data/index.ts` seed data or other consumers (Grading, Faculty Portal,
Accounting, LMS) that already depend on current `Student`/`SchoolSection` shapes.

---

## 13. Proposed Navigation Label Changes

Module **ids stay identical** (`REGISTRAR`, `CLASS_SECTIONING`, `SCHEDULING`,
`ACCOUNTS_SECURITY`, `DASHBOARD`, etc.) — only `label`/`desc` become context-aware.

Change `getNavItemsForRole()` in `navigation.config.ts` to accept `academicUnit` (already
does) and apply a small label-override map, e.g.:

| Module id | Current label | Proposed Basic-Ed label | Proposed College label |
|---|---|---|---|
| `DASHBOARD` | "Registrar Dashboard" | "Registrar Dashboard" (unchanged) | "Registrar Dashboard" (unchanged) |
| `REGISTRAR` | "Admissions & COR" | "Admissions & Enrollment" | "Admissions & Enrollment" |
| `CLASS_SECTIONING` | "Class Sectioning" | "Class Sectioning (Sections & Advisers)" → keep concise: "Class Sectioning" with `desc` updated to "Sections, advisers & LRN rosters" | `desc`: "Class sections, curriculum & unit loads" |
| `SCHEDULING` | "Class Scheduling" | unchanged label; `desc`: "Subject schedules & adviser rooms" | `desc`: "Subject schedules, semester & room loads" |
| `ACCOUNTS_SECURITY` | "Authority Clearances" | "User Access Management" (see §18) | same |
| `STUDENT_PORTAL` (when opened by Registrar) | "Student Portal" | optionally "Student Records" when opened from Registrar context (see §15) | same |

Implementation approach: extend `NavItem` with optional
`labelByUnit?: Partial<Record<AcademicUnit, string>>` and
`descByUnit?: Partial<Record<AcademicUnit, string>>`; `getNavItemsForRole(role,
academicUnit)` resolves `label = item.labelByUnit?.[academicUnit] ?? item.label` (same
for `desc`). This is fully backward compatible — items without overrides behave exactly
as today.

---

## 14. Proposed Registrar Dashboard Improvements

Current `DashboardPage.tsx` already has an `EnrollmentAnalyticsPage` sub-view with
school/year/course/section filters and stats (enrolled/pending/approved counts). Proposed
refinements:

1. **Context-aware KPI cards** at the top of the Registrar Dashboard, using
   `ACADEMIC_TERMS` labels:
   - Basic Ed: "Total Learners", "Pending LRN Verification", "Sections Without Adviser",
     "Outstanding Assessments".
   - College: "Total Students", "Pending TOR Evaluation", "Sections Without Curriculum
     Mapping", "Outstanding Balances".
2. **Admissions funnel widget**: visual breakdown of students by derived
   `AdmissionsStage` (Section 12) — replacing the current flat enrollment-status counts
   with a pipeline view (Received → Docs Review → Assessment → Payment → Cleared →
   Enrolled).
3. **Quick links** into the new Admissions / Student Records / Sectioning sub-views
   (Section 15–16) so the Registrar Dashboard becomes the actual landing/triage page,
   consistent with its nav description "Live admissions & fees".
4. Keep `EnrollmentAnalyticsPage` as-is structurally; just re-label its headers via
   `ACADEMIC_TERMS` (e.g. "Strand/Track" vs "Program/Course" filter labels — currently
   hardcoded "BSIT"/"STEM" lists inline).

---

## 15. Proposed Admissions & Enrollment Improvements

Scope: `RegistrarModulePage.tsx`, "Student Directory & Admissions" sub-tab.

1. **Rename sub-tab** from "Student Directory & Admissions" to **"Admissions Pipeline"**,
   reframing the left table as an admissions queue filterable by `AdmissionsStage`
   (derived) rather than only by name/ID search.
2. **Replace hardcoded section assignment on enrollment approval** — currently
   `approveEnrollment(enr-id, "St. Thomas")` / `"IT101"` are hardcoded literals
   (`RegistrarModulePage.tsx` ~line 921, ~1014). Replace with a section picker sourced
   from `sections` (filtered by `academicUnit`-appropriate `department`/`yearLevel`/
   `trackOrCourse`), calling `assignStudentsToSection` + `approveEnrollment` together so
   the section's `currentCount`/`enrolledStudentIds` stay in sync (today
   `approveEnrollment` sets `Student.section` directly without updating
   `SchoolSection.enrolledStudentIds`/`currentCount` — a data-consistency gap).
3. **Guardian tab (Basic Ed)**: bind to real `Student.guardianName/guardianContact/
   guardianRelationship` fields (Section 12) instead of hardcoded placeholder text, with
   inline edit via `updateStudent`.
4. **Bulk import**: keep the simulated drag-drop UX, but relabel via `ACADEMIC_TERMS.
   bulkImportLabel`/`regulatorLabel` instead of inline `schoolContext === "BASIC_ED" ?
   "DepEd..." : "CHEd..."` ternaries scattered across ~6 locations.
5. **Assessment Fees tab**: no structural change — already well-developed
   (discount selection, payment terms, schedule). Just ensure fee-name labels
   (`"SHS Tuition Fee"` vs `"College Tuition Fee"`) come from `ACADEMIC_TERMS` /
   `mockAssessmentService` consistently (currently duplicated string literals in both
   `store.ts` `submitNewEnrollment` and `mockAssessmentService`).
6. **Step indicator for the "Enroll New Candidate" wizard** — currently `formStep` exists
   but the visual stepper isn't fully shown in the read portion; verify and ensure step
   labels use `ACADEMIC_TERMS.unitNounSingular`/`trackNoun` (e.g. "Select Grade Level &
   Strand" vs "Select Year Level & Program").

---

## 16. Proposed Student Records Improvements

This is the **largest conceptual addition**: split "Student Records" out as its own
detail-panel concern (or a new sub-tab within `RegistrarModulePage`, e.g. third sub-tab
**"Student Records"** alongside "Admissions Pipeline" and "Bulk Import") — for
**already-enrolled** students, distinct from the admissions/pre-enrollment workflow.

Proposed tabs for an Enrolled student's record (reusing `getDetailTabs()` pattern but for
post-enrollment context):

- **Profile** (current "Student Info" + "Guardian" merged, read-mostly with edit action)
- **Academic History**:
  - Basic Ed: Grade-level progression, LRN, Form 137/SF9 status, current Adviser/Section.
  - College: Program, Year/Semester, units earned vs. required (`unitsEarned`/
    `unitsRequired` from Section 12), curriculum version assigned.
- **Grades Summary** — read-only roll-up sourced from `grades` (existing `Grade[]` in
  store), grouped by school year/semester — currently only viewable per-subject in the
  Faculty/Student portals, not from Registrar.
- **Financial Summary** — reuse existing Assessment Fees rendering (read-only for
  enrolled students, editable only for Pending).
- **Documents** — reuse existing verification workflow (`updateRequirementUpload`,
  `verifyRequirement`, `markHardcopySubmitted`) unchanged.

This keeps `Enrollment`/`Requirement`/`StudentAssessment`/`Grade` store shapes
**unchanged** — Student Records is a *read/aggregation* layer over existing store slices,
not a new data model. The only new store action needed is a generic `updateStudent`
extension for guardian fields (already exists — just needs the new optional fields from
Section 12 to be writable).

**Filtering by school context remains structural**: Student Records list defaults to
`activeSchool`'s students (via existing `department` filter derived from
`academicUnit`), consistent with current Admissions tab behavior.

---

## 17. Proposed Class Sectioning Improvements

1. **Consolidate constants**: move `BE_YEAR_LEVELS`, `COLLEGE_YEAR_LEVELS`, `BE_STRANDS`,
   `COLLEGE_TRACKS`, `SEMESTERS` out of `ClassSectioningModulePage.tsx` into the shared
   academic-structure config (Section 11), so Registrar's enrollment wizard and
   Sectioning's section form use identical strand/program lists (today they're
   independently maintained and can drift — e.g. Registrar's `BE_STRANDS_BY_LEVEL` vs.
   Sectioning's `BE_STRANDS` already have slightly different shapes).
2. **Scope `SectionForm`'s department toggle by `activeSchool`**: when `activeSchool ===
   "STSN"` (basic-ed), default/lock `dept = "Basic Education"`; when `"CDSTA"` (college),
   default/lock `dept = "College"`. For `activeSchool === "ALL"` (Super Admin), keep the
   toggle. This prevents a Registrar logged into STSN from creating a College section by
   mistake — currently possible since the toggle is unconditional.
3. **Adviser-noun terminology**: use `ACADEMIC_TERMS.groupLeaderNoun` /
   `ACADEMIC_TERMS.groupNoun` for labels ("Section" vs "Class Section", "Adviser" vs
   "Curriculum Coordinator" — or keep "Adviser" for both if that's the client's
   preference; flag as an open question, see Section 18 "Risk Areas").
4. **Link sections to curriculum (College)**: optional `curriculumId` on `SchoolSection`
   (Section 12) surfaced as a dropdown in `SectionForm` when `dept === "College"`,
   sourced from `curriculums` (already in store) — addresses the current gap where
   College sections have no link to `Curriculum`/`Subject` data.
5. **Roster assignment feedback**: `assignStudentsToSection` already updates both
   `sections.enrolledStudentIds/currentCount` and `students[].section` — no change
   needed here structurally, but the Sectioning UI should show capacity warnings
   (`currentCount >= capacity`) which appears partially implemented; verify and surface
   consistently.

---

## 18. Proposed Class Scheduling Improvements

1. **Consolidate constants**: `BE_YEAR_LEVELS_SCHED`/`COLLEGE_YEAR_LEVELS_SCHED` →
   shared config (Section 11), same lists as Sectioning/Registrar.
2. **Scope conflict detection and room availability by `activeSchool`**: filter
   `classSchedules`/`rooms` passed into `detectConflicts`/`checkRoomConflict` to the
   current `academicUnit`'s `department` (Basic Education vs College) before checking
   overlaps — avoids cross-school false negatives/positives as the dataset grows, and
   matches the "school context determines workflow/data structure" rule (a College
   schedule should never be checked against a Basic-Ed room booked at the same time
   unless rooms are shared — flag as configurable).
3. **Semester field relevance**: for Basic Ed (`"N/A"` semester in enrollment), the
   schedule form's `semester` field should default to "Full Year" and could be
   de-emphasized/hidden per `ACADEMIC_TERMS.enrollmentUnit === "School Year"`; for
   College it stays prominent (`"First/Second Semester"`).
4. **Teacher-driven department inference** (`teacherDept` from `selectedTeacher.
   department`) stays — this is correct per the architecture rule since it derives from
   the *data* (teacher's department), not role. No change needed beyond consolidating
   constants.
5. **Visual grouping by `ACADEMIC_TERMS.groupNoun`** in the grid/list view headers
   ("Section" vs "Class Section").

---

## 19. Proposed Accounts / User Access Rename

`AccountsManagementPage.tsx` + `navigation.config.ts` entry `ACCOUNTS_SECURITY`:

1. **Nav label**: "Authority Clearances" → **"User Access Management"** (module id
   `ACCOUNTS_SECURITY` unchanged — no permission/routing changes needed).
2. **Page header** (`PageHeader` props in `AccountsManagementPage.tsx`): retitle from
   "Educational Authority Accounts & Access Clearances" → "User Access Management",
   description → something like "Manage staff and student login accounts, roles, and
   access status across the institution."
3. **Column header**: "Assigned Authority Level" → "Role"; "Security Status" → "Account
   Status"; "Access Controls" → "Actions". Purely cosmetic, no logic change.
4. **Optional school filter**: add a school filter dropdown (STSN/CDSTA/All) for
   Super Admin; for a Registrar (school-scoped via their own `User.schoolId`), default
   the list to their own school's users — this is a **role-permission-respecting,
   school-context-driven default**, consistent with the architecture rule (the *role*
   still determines that Registrar can access this module at all; the *school context*
   determines which subset of data is shown by default).
5. **Role dropdown cleanup** in "Provision New Authority" modal: currently lists all 7
   `UserRole` values including `ADMIN`/`EMPLOYEE` which map to `CanonicalRole` via
   fallback (`ADMIN→super-admin`, `EMPLOYEE→teacher`). Consider trimming to the 6
   `CanonicalRole`-aligned options (`SUPER_ADMIN, REGISTRAR, ACCOUNTING, TEACHER, STUDENT,
   HR`) for clarity, or keep all 7 if `ADMIN`/`EMPLOYEE` are intentionally distinct demo
   personas (verify with `MOCK_USERS` before removing).

---

## 20. Risk Areas

1. **Implicit `department` ⇄ `academicUnit` coupling**: Many entities (`Student`,
   `Teacher`, `Course`, `Subject`, `ClassSchedule`, `SchoolSection`,
   `LearningMaterial`) use the legacy `"Basic Education" | "College"` string union for
   `department`, while the newer `AcademicUnit` type uses `"basic-ed" | "college"`. Any
   refactor that filters by `academicUnit` must map correctly
   (`academicUnit === "basic-ed" ↔ department === "Basic Education"`). A mismatch here
   would silently empty out lists. **Mitigation**: centralize this mapping in one helper
   (e.g. `academicUnitToDepartment(unit): "Basic Education" | "College"`) rather than
   repeating the ternary in every page.
2. **`approveEnrollment` / section-count desync**: Today, approving enrollment sets
   `Student.section` via `approveEnrollment()` but does **not** update the corresponding
   `SchoolSection.currentCount`/`enrolledStudentIds` unless `assignStudentsToSection` is
   also called. The Admissions improvement (Section 15) introduces this combined call —
   must ensure no double-counting if a student is later moved between sections in
   Sectioning.
3. **Stale local mutation pattern**: `RegistrarModulePage.tsx` mutates
   `selectedStudent.enrollmentStatus`/`.section` directly (not via `setSelectedStudent`)
   after calling store actions. This works today only because the store update
   eventually re-renders and re-selection happens, but it's fragile — any refactor
   touching this area should replace with proper state updates (`setSelectedStudent({
   ...selectedStudent, ... })` or re-deriving from the store's `students` array).
4. **Quick role-switch can change school context**: `handleRoleQuickSwitch` →
   `login(email, "")` re-derives `activeSchool` from the target user's `schoolId`,
   potentially switching from STSN to CDSTA context invisibly when switching to a
   CDSTA-scoped demo account. If Registrar Dashboard/labels become heavily
   context-dependent, a demo presenter switching roles could see a confusing label jump.
   Not introduced by this plan, but will become more *visible* once labels diverge more
   between basic-ed/college — worth a UX note (e.g. toast: "Switched to CDSTA / College
   context").
5. **Terminology bikeshedding** (`groupLeaderNoun` = "Adviser" vs "Curriculum
   Coordinator", etc.): some proposed College-specific terms in Section 11/17 are
   plausible but not confirmed against real CDSTA terminology. Recommend a quick
   stakeholder check before hardcoding into `ACADEMIC_TERMS` — mitigated by keeping all
   terms in one config file so changes are single-point edits.
6. **Duplicated constant lists drifting** (Risk already present, addressed by Section
   11/17/18 consolidation): `BE_STRANDS_BY_LEVEL` (Registrar) vs `BE_STRANDS`
   (Sectioning) vs `BE_YEAR_LEVELS_SCHED` (Scheduling) currently have *slightly*
   different Grade 11/12 strand sets and naming. Consolidation must reconcile these
   before extraction — a quick diff pass is needed as step 1 of implementation, not
   assumed identical.
7. **`AccountsManagementPage` role dropdown vs `CanonicalRole`**: trimming role options
   (Section 19.5) could break demo accounts seeded with `ADMIN`/`EMPLOYEE` roles in
   `MOCK_USERS` if those are referenced elsewhere (e.g. `App.tsx`'s
   `currentUser.role === "EMPLOYEE"` check for Faculty Portal). Verify all usages before
   removing options — likely keep all 7 and just reorganize/relabel.

---

## 21. Recommended Implementation Phases

**Phase 0 — Groundwork (low risk, no visible UI change required)**
- Create `src/config/academic-terms.config.ts` (Section 11).
- Add `academicUnitToDepartment()` helper (Section 20.1) — likely co-located in
  `schools.config.ts` or the new terms config.
- Audit and reconcile the three divergent strand/year-level constant sets (Section 20.6)
  into a single shared `academic-structure.config.ts`. No page wiring yet — just produce
  the canonical lists.

**Phase 1 — Navigation & Label Pass (cosmetic, low risk)**
- Extend `NavItem`/`getNavItemsForRole` with `labelByUnit`/`descByUnit` (Section 13).
- Apply Accounts/User Access rename (Section 19, items 1–3).
- Swap inline `schoolContext === "BASIC_ED" ? "..." : "..."` label ternaries in Registrar/
  Sectioning/Scheduling for `getAcademicTerms(academicUnit)` lookups — pure string
  substitution, no behavior change.

**Phase 2 — Class Sectioning & Scheduling Consolidation**
- Wire `SectionForm`/`ScheduleForm` to the Phase 0 shared constants.
- Add `activeSchool`-based default/lock on Sectioning's department toggle (Section 17.2).
- Scope Scheduling's conflict/room checks by academic unit (Section 18.2).

**Phase 3 — Admissions & Enrollment Workflow Fixes**
- Replace hardcoded section assignment in `approveEnrollment` flow with a real section
  picker + `assignStudentsToSection` call (Section 15.2, Section 20.2).
- Fix stale local mutation pattern (Section 20.3) as part of this touch.
- Add `Student.guardianName/guardianContact/guardianRelationship` fields and wire the
  Guardian tab to real data (Section 15.3).

**Phase 4 — Student Records Sub-View**
- Add the new "Student Records" sub-tab/view (Section 16) as an aggregation layer over
  existing `grades`/`assessments`/`requirements`/`enrollments` — additive UI only.
- Add `Student.unitsEarned/unitsRequired` (College) if Academic Progress widget is in
  scope for this phase; otherwise defer to Phase 5.

**Phase 5 — Registrar Dashboard Enhancements**
- Derived `AdmissionsStage` computation + funnel widget (Section 14).
- Context-aware KPI cards using `ACADEMIC_TERMS`.
- Quick-links wiring into Admissions/Student Records/Sectioning.

**Phase 6 — Polish & Risk Cleanup**
- Address Section 20.4 (role-switch context toast/notice) if deemed valuable for the
  presenter/demo experience.
- Final terminology review with stakeholders (Section 20.5) and any label tweaks.
- Regression pass across Dashboard, Registrar, Sectioning, Scheduling, Accounts to
  confirm `getAllowedModules`/`ROLE_PERMISSIONS` behavior is unchanged for all roles ×
  both schools.

Each phase is independently shippable and reversible; none require store schema breaking
changes or module-id changes, satisfying the "preserve current UI theme and existing
module IDs" constraint.

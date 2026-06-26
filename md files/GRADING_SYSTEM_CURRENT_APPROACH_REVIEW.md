# Grading System — Current Approach Review

**Prepared by:** Senior Frontend Architect (Claude Code)
**Date:** 2026-06-09
**Scope:** Teacher Board, Student Grades Encoding, Grade Roster, Class/Subject Selectors, Related Shared Components

---

## Table of Contents

1. [Current Implementation Summary](#1-current-implementation-summary)
2. [Current Limitations](#2-current-limitations)
3. [Recommended Grading System Approach](#3-recommended-grading-system-approach)
4. [Recommended Frontend Architecture](#4-recommended-frontend-architecture)
5. [Recommended Mock Data Structure](#5-recommended-mock-data-structure)
6. [Recommended Grade Calculation Helper](#6-recommended-grade-calculation-helper)
7. [Suggested File Changes — Next Phase Implementation Plan](#7-suggested-file-changes--next-phase-implementation-plan)
8. [Risks and Assumptions](#8-risks-and-assumptions)

---

## 1. Current Implementation Summary

### 1.1 Files and Components Involved

| File | Component | Role |
|------|-----------|------|
| `src/features/faculty/pages/FacultyPortalPage.tsx` | `FacultyPortal` | Main Teacher Board — 4 tabs: dashboard, schedule, attendance, grading |
| `src/features/grading/pages/GradingModulePage.tsx` | `GradingModule` | Grade encoding table — rendered as Tab D inside FacultyPortal |
| `src/components/ModalPreviews.tsx` | `ReportCardPreview`, `PreviewModal` | Report card modal — Basic Ed (SF9 style) and College transcript |
| `src/types/index.ts` | `Grade`, `Student`, `Subject`, `Teacher` | Core TypeScript interfaces |
| `src/mock-data/index.ts` | `MOCK_GRADES`, `MOCK_STUDENTS`, `MOCK_SUBJECTS` | All demo data |
| `src/services/store.ts` | Zustand store, `saveGrade` action | Global state — reads/writes `grades[]` |
| `src/config/navigation.config.ts` | `ROLE_PERMISSIONS`, `NAV_ITEMS` | Module routing, role-based access |
| `src/App.tsx` | Module switcher | Renders `FacultyPortal` or `GradingModule` by active module |

### 1.2 How the Grading Page is Structured

The Teacher Board (`FacultyPortalPage.tsx`) is a single-page component with four tab panels controlled by an `activeTab` state string. The grading workspace (Tab D) is a passthrough wrapper that renders `<GradingModule />` — the actual grade encoding component.

`GradingModulePage.tsx` is a self-contained component that:
1. Pulls `students`, `subjects`, `grades`, and `saveGrade` from the Zustand store.
2. Renders a subject `<select>` and a section `<select>` as the class filter controls.
3. Filters students by the selected section string (`students.filter(s => s.section === selectedSection)`).
4. For each student in the section, finds their grade record (`grades.find(...)`) and renders a table row with Midterm, Final, Weighted Average, and Rating columns.
5. Allows one student to be in edit mode at a time via `editingStudentId` state. Edit mode shows two `<input type="number">` fields.
6. On save, calls `store.saveGrade(studentId, subjectCode, midterm, final)`.
7. Has a "Print Card" button per student that opens `ReportCardPreview` inside `PreviewModal`.

There is also a standalone `GRADING` module route in `App.tsx` (line 242) that renders `GradingModule` directly — separate from the `FACULTY_PORTAL` tab system. Teachers have access to both routes via `ROLE_PERMISSIONS`.

### 1.3 Where Data Comes From

All data is **mock/hard-coded data** loaded from `src/mock-data/index.ts` into Zustand on app boot.

- **Grades:** `MOCK_GRADES` — 6 records for 3 demo students only:
  - `stud-enrico`: 3 grade records (Basic Ed Grade 11)
  - `stud-clara`: 2 grade records (College BSIT)
  - `stud-juan`: 1 grade record (College BSBA)
- **Students:** `MOCK_STUDENTS` — large roster (~47 students) but only the 3 above have grade records.
- **Subjects:** `MOCK_SUBJECTS` — 80+ subjects loaded; all are shown in the subject dropdown regardless of teacher ownership.
- **Grade saves:** Stored only in Zustand memory. No persistence to localStorage or backend. Refreshing the browser resets all saves.

### 1.4 Current Grade Data Interface

```ts
// src/types/index.ts — line 184
interface Grade {
  id: string;
  studentId: string;
  subjectCode: string;
  teacherId: string;
  schoolYear: string;
  semester: string;
  midtermGrade: number;   // fixed period 1
  finalGrade: number;     // fixed period 2
  remarks?: "Passed" | "Failed" | "Incomplete";
}
```

### 1.5 Current `saveGrade` Store Action

```ts
// src/services/store.ts — line 405
saveGrade: (studentId, subjectCode, midterm, final) => {
  const passed = final >= 75 ? "Passed" : "Failed";  // Bug: uses only final grade
  const existing = get().grades.find(
    (g) => g.studentId === studentId && g.subjectCode === subjectCode
  );
  // upsert logic ...
}
```

### 1.6 Current Weighted Average Calculation

```ts
// src/features/grading/pages/GradingModulePage.tsx — line 124
const calculatedAvg = gradeScoreObj
  ? Math.round((gradeScoreObj.midtermGrade + gradeScoreObj.finalGrade) / 2)
  : null;
```

This is a simple arithmetic average — not a true weighted average. The word "weighted" in the column header is misleading.

---

## 2. Current Limitations

### 2.1 Fixed Two-Period Schema (Critical)

The `Grade` interface only supports `midtermGrade` and `finalGrade`. This makes it impossible to support:
- **Basic Education (DepEd K-12):** Q1, Q2, Q3, Q4 grading periods.
- **College (3-period system):** Prelim, Midterm, Final.

The `ReportCardPreview` component displays Q1–Q4 columns in the printed report card, but these values are **fabricated by randomly cycling through available grade entries** — they do not come from an actual four-period data model. The report card output is therefore inaccurate.

### 2.2 No Grade Items / Grade Components (Critical)

There is no concept of grade items (quizzes, projects, activities, exams, performance tasks, assignments). A teacher cannot break a grade into components. The current system only allows encoding a final numerical score per period — it is a gradebook summary, not a grade computation tool.

### 2.3 Hard-Coded Section Selector (Major)

The section dropdown in `GradingModulePage.tsx` is completely hard-coded:

```tsx
// GradingModulePage.tsx — line 76
<select value={selectedSection} ...>
  <option value="St. Thomas">Class: St. Thomas</option>
  <option value="IT101">Class: IT101</option>
  <option value="BA201">Class: BA201</option>
</select>
```

This has no relationship to the teacher's actual class assignments. A teacher can select any section and encode grades for students they do not teach.

### 2.4 No Teacher–Subject–Section Ownership (Major)

The subject dropdown shows all 80+ subjects from the entire institution, regardless of the currently logged-in teacher's teaching load. There is no filtering by teacher ID or assigned class schedules.

### 2.5 Incorrect Pass/Fail Logic (Major Bug)

`saveGrade` determines remarks as `final >= 75 ? "Passed" : "Failed"`, which only looks at the **final period grade** — not the computed weighted average. The on-screen rating uses the average of midterm + final, but the stored `remarks` field uses only `final`. These two values can disagree.

### 2.6 Edit Mode Pre-Fills to 80 When No Record (Medium)

```ts
// GradingModulePage.tsx — line 36
setMidtermInput(currentMid || 80);
setFinalInput(currentFin || 80);
```

When a student has no grade yet (`null`), the inputs are pre-filled with `80` as a default. A teacher may accidentally save `80/80` grades if they click Save without entering real values. There is no "empty / no record" state for the inputs.

### 2.7 No Grade Locking or Finalization (Medium)

Grades can be edited at any time with no audit trail. There is no `isFinalized` flag, no lock-after-submission mechanism, and no read-only view for finalized periods.

### 2.8 No Grade Weights / Category System (Medium)

There is no mechanism to configure that "quizzes count 20%, midterm exam 30%, final exam 50%" per subject or per class. The calculation is always a plain `(midterm + final) / 2`.

### 2.9 No Support for Different Educational Levels (Medium)

Basic Education and College use different grading conventions:
- **DepEd (Basic Ed):** 4 quarters per school year, no "semester" for most grade levels.
- **CHED (College):** 2 semesters, each with Prelim/Midterm/Final, sometimes a Summer term.

The current `Grade` schema has a `semester` field but no `period` field, forcing all grade periods into `midtermGrade` / `finalGrade` regardless of actual period type.

### 2.10 Minimal Mock Data (Minor)

Only 6 grade records exist for 3 students. Most of the ~47 students in the mock roster show "—" for all grade columns, giving the impression the system is empty.

### 2.11 No Invalid Score Highlighting (Minor)

The current validation (`< 50 || > 100`) only shows a browser `alert()`. There is no inline red highlight on the input field to indicate the problem, and no handling of non-integer scores.

### 2.12 Grade Display is In-Page Only (Minor)

The `GRADING` module in the sidebar and the `FACULTY_PORTAL` Tab D both render the same `GradingModule` component with no awareness of which context they are in. There is no difference in permissions, filters, or state between the two entry points.

---

## 3. Recommended Grading System Approach

### 3.1 Design Philosophy

Build a **mock-first, API-ready** grading system. All data operations go through a grading service layer (`gradingService.ts`) that initially reads from in-memory mock data but can be swapped for real API calls with no changes to the components.

### 3.2 Grade Period System

Define a `GradePeriod` union type per department:

```
Basic Education (DepEd):
  1st Quarter | 2nd Quarter | 3rd Quarter | 4th Quarter

College (CHED):
  Prelim | Midterm | Final
```

### 3.3 Grade Item System

Each period contains `GradeCategory` entries (e.g., Quizzes, Projects, Exams). Each category contains one or more `GradeItem` entries (e.g., Quiz 1, Quiz 2, Midterm Exam). Each `GradeItem` has a `maxScore` and each student has a `studentScore` entry.

### 3.4 Grade Computation Flow

```
studentScore / maxScore × 100        → normalized item score
average(normalized item scores)       → category percentage score
Σ(category percentage × weight / 100) → period weighted grade
average(period weighted grades)        → final term grade
```

---

## 4. Recommended Frontend Architecture

### 4.1 Component Tree

```
GradeEncodingPage                     (top-level page, replaces GradingModulePage)
├── GradeSubjectClassSelector         (teacher-scoped: class loads only)
├── GradePeriodSelector               (Q1–Q4 for Basic Ed, Prelim/Mid/Final for College)
├── GradeSummaryView                  (read-only overview: all periods side by side)
│   └── GradeSheetTable              (compact read-only table per period)
└── GradeInputView                    (active period editor)
    ├── GradeSheetTable               (scrollable, one row per student)
    │   └── GradeCellInput           (inline editable cell with validation)
    ├── AddGradeItemModal             (add Quiz 1, Project 2, etc.)
    └── ManageGradeWeightsModal       (set % weights per category)
```

### 4.2 Component Responsibilities

#### `GradeEncodingPage`
- Top-level page state: selected class load, selected period, view mode (summary vs input).
- Reads from `gradingService` (mock-first).
- No business logic — delegates to sub-components.

#### `GradeSubjectClassSelector`
- Replaces the two hard-coded `<select>` elements.
- Filters by currently logged-in teacher's `ClassSchedule` records.
- Yields a `{ subjectCode, sectionId, teacherId }` selection.

#### `GradePeriodSelector`
- Renders period tabs based on department type.
- Basic Ed: `1st Quarter`, `2nd Quarter`, `3rd Quarter`, `4th Quarter`.
- College: `Prelim`, `Midterm`, `Final`.
- Shows a lock icon next to finalized periods.

#### `GradeSummaryView`
- Read-only table: columns are grade periods, rows are students.
- Shows computed period grade and final grade per student.
- Entry point for printing report cards.

#### `GradeInputView`
- The active grade encoding workspace for one period.
- Renders a `GradeSheetTable` for the active period.
- Toolbar: "Add Grade Item", "Manage Weights", "Finalize Period".

#### `GradeSheetTable`
- Columns: Student | [GradeItem columns per category] | Category Avg | Period Grade.
- Renders `GradeCellInput` for each cell.
- Category columns are grouped with a colored header.

#### `GradeCellInput`
- Input field for a single student's score on a single grade item.
- Props: `value`, `maxScore`, `onChange`, `isReadOnly`.
- Shows red border if score > maxScore or is negative.
- Shows dash (—) for empty/null — never treats null as zero.

#### `AddGradeItemModal`
- Form: item name, category (Quizzes / Activities / Projects / Exams / Performance Tasks / Assignments / Custom), maxScore.
- Adds a new column to the active period's grade sheet.

#### `ManageGradeWeightsModal`
- Lists all categories present in the current period.
- Allows teacher to set percentage weight per category.
- Validates that all weights sum to 100%.

---

## 5. Recommended Mock Data Structure

### 5.1 TypeScript Interfaces

```ts
// ============================================================
// GRADING SYSTEM — TypeScript Interfaces
// To be added to src/types/index.ts or src/types/grading.ts
// ============================================================

// Grade period labels differ by department
export type BasicEdPeriod = "1st Quarter" | "2nd Quarter" | "3rd Quarter" | "4th Quarter";
export type CollegePeriod  = "Prelim" | "Midterm" | "Final";
export type GradePeriodLabel = BasicEdPeriod | CollegePeriod;

// Category names — extendable
export type GradeCategoryName =
  | "Quizzes"
  | "Activities"
  | "Projects"
  | "Assignments"
  | "Performance Tasks"
  | "Written Exams"
  | "Custom";

// A single gradable item (e.g. "Quiz 1", "Long Exam", "Project 2")
export interface GradeItem {
  id: string;
  label: string;               // "Quiz 1", "Midterm Exam", etc.
  category: GradeCategoryName;
  maxScore: number;            // e.g. 50, 100
  order: number;               // column order within category
}

// Weight configuration for a grading period
export interface GradeCategory {
  name: GradeCategoryName;
  weight: number;              // 0–100, must sum to 100 per period
}

// Configuration for one grading period (template, not per-student data)
export interface GradePeriod {
  id: string;
  label: GradePeriodLabel;
  subjectCode: string;
  sectionId: string;
  schoolYear: string;
  teacherId: string;
  categories: GradeCategory[];
  items: GradeItem[];
  isFinalized: boolean;
  finalizedAt?: string;
  finalizedBy?: string;
}

// A single student's score on a single grade item
export interface StudentGradeEntry {
  id: string;
  periodId: string;
  studentId: string;
  gradeItemId: string;
  score: number | null;        // null = No Record (not zero!)
  isExcused?: boolean;
}

// Computed grade values (derived — never stored directly)
export interface ComputedGrade {
  studentId: string;
  periodId: string;
  periodLabel: GradePeriodLabel;
  categoryAverages: Record<GradeCategoryName, number | null>;
  weightedAverage: number | null;  // the period grade
  isPassing: boolean | null;       // null if no grades yet
}

// Final term grade (average of all period weighted averages)
export interface ComputedTermGrade {
  studentId: string;
  subjectCode: string;
  sectionId: string;
  schoolYear: string;
  periodGrades: ComputedGrade[];
  termAverage: number | null;
  termRemarks: "Passed" | "Failed" | "Incomplete" | null;
}

// Teacher's class assignment (used to scope the selector)
export interface SubjectClassLoad {
  id: string;
  teacherId: string;
  subjectCode: string;
  subjectName: string;
  sectionId: string;
  sectionName: string;
  department: "Basic Education" | "College";
  schoolYear: string;
  semester: "First Semester" | "Second Semester" | "Full Year";
  studentIds: string[];
}

// Student roster for a class (for the grade sheet rows)
export interface StudentRoster {
  classLoadId: string;
  students: {
    id: string;
    studentNo: string;
    firstName: string;
    lastName: string;
    section: string;
  }[];
}
```

### 5.2 Recommended Mock Data Shape

```ts
// src/mock-data/gradingMockData.ts

// ---- Subject Class Loads (Teacher's teaching assignments) ----
export const MOCK_CLASS_LOADS: SubjectClassLoad[] = [
  {
    id: "load-beatriz-gen-math",
    teacherId: "teach-beatriz",
    subjectCode: "SHS-GEN-MATH",
    subjectName: "General Mathematics",
    sectionId: "sec-st-thomas",
    sectionName: "St. Thomas",
    department: "Basic Education",
    schoolYear: "2026-2027",
    semester: "First Semester",
    studentIds: ["stud-enrico", "stud-shs-02", "stud-shs-03", /* ... */]
  },
  // ... more loads for other teachers
];

// ---- Grade Periods ----
export const MOCK_GRADE_PERIODS: GradePeriod[] = [
  {
    id: "period-beatriz-genmath-q1",
    label: "1st Quarter",
    subjectCode: "SHS-GEN-MATH",
    sectionId: "sec-st-thomas",
    schoolYear: "2026-2027",
    teacherId: "teach-beatriz",
    categories: [
      { name: "Quizzes",      weight: 25 },
      { name: "Activities",   weight: 25 },
      { name: "Written Exams", weight: 50 },
    ],
    items: [
      { id: "item-q1-quiz1", label: "Quiz 1",    category: "Quizzes",      maxScore: 30, order: 1 },
      { id: "item-q1-quiz2", label: "Quiz 2",    category: "Quizzes",      maxScore: 30, order: 2 },
      { id: "item-q1-act1",  label: "Activity 1", category: "Activities",  maxScore: 50, order: 1 },
      { id: "item-q1-exam1", label: "Long Exam", category: "Written Exams", maxScore: 100, order: 1 },
    ],
    isFinalized: false,
  },
  // ... Q2, Q3, Q4 periods
];

// ---- Student Grade Entries ----
export const MOCK_STUDENT_GRADE_ENTRIES: StudentGradeEntry[] = [
  { id: "sge-1", periodId: "period-beatriz-genmath-q1", studentId: "stud-enrico", gradeItemId: "item-q1-quiz1", score: 27 },
  { id: "sge-2", periodId: "period-beatriz-genmath-q1", studentId: "stud-enrico", gradeItemId: "item-q1-quiz2", score: 25 },
  { id: "sge-3", periodId: "period-beatriz-genmath-q1", studentId: "stud-enrico", gradeItemId: "item-q1-act1",  score: 44 },
  { id: "sge-4", periodId: "period-beatriz-genmath-q1", studentId: "stud-enrico", gradeItemId: "item-q1-exam1", score: 88 },
  // score: null means "No Record" — teacher has not yet encoded this entry
];
```

---

## 6. Recommended Grade Calculation Helper

### 6.1 Calculation Rules

1. A student's score on a grade item is **normalized**: `(score / maxScore) * 100`.
2. All normalized scores within a category are **averaged**: `sum(normalized) / count(items)`.
3. Each category has a **weight** (percentage). The period grade is: `Σ(categoryAverage × weight) / 100`.
4. A student's **term grade** is the average of all period weighted grades.
5. A `score` of `null` means **No Record** — it is **excluded** from averages (denominator is reduced).
6. A `score` of `null` on all items means the period grade is `null` — display as "—".
7. **Passing threshold:** 75% (Philippines standard, configurable per school).
8. **Invalid score:** `score < 0` or `score > maxScore` — highlight cell in red, exclude from calculation.
9. **Finalized period:** all inputs are read-only; no saves allowed.

### 6.2 Calculation Helper Module

```ts
// src/features/grading/utils/gradeCalculator.ts

export function normalizeScore(score: number, maxScore: number): number {
  if (maxScore === 0) return 0;
  return (score / maxScore) * 100;
}

export function computeCategoryAverage(
  entries: StudentGradeEntry[],
  items: GradeItem[],
  category: GradeCategoryName
): number | null {
  const categoryItems = items.filter((i) => i.category === category);
  const scores: number[] = [];

  for (const item of categoryItems) {
    const entry = entries.find((e) => e.gradeItemId === item.id);
    if (entry?.score != null && entry.score >= 0 && entry.score <= item.maxScore) {
      scores.push(normalizeScore(entry.score, item.maxScore));
    }
    // null or invalid → skip (No Record, not zero)
  }

  if (scores.length === 0) return null;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

export function computePeriodGrade(
  entries: StudentGradeEntry[],
  period: GradePeriod
): number | null {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const category of period.categories) {
    const avg = computeCategoryAverage(entries, period.items, category.name);
    if (avg != null) {
      weightedSum += avg * (category.weight / 100);
      totalWeight += category.weight;
    }
  }

  if (totalWeight === 0) return null;
  // Scale to full weight so partial data doesn't artificially deflate the grade
  return (weightedSum / totalWeight) * 100;
}

export function computeTermGrade(periodGrades: (number | null)[]): number | null {
  const valid = periodGrades.filter((g): g is number => g != null);
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

export function isScoreInvalid(score: number | null, maxScore: number): boolean {
  if (score == null) return false;
  return score < 0 || score > maxScore;
}

export function getRemarks(termGrade: number | null): "Passed" | "Failed" | "Incomplete" | null {
  if (termGrade == null) return null;
  if (termGrade >= 75) return "Passed";
  return "Failed";
}
```

---

## 7. Suggested File Changes — Next Phase Implementation Plan

> **Important:** Do not implement yet. This is a planning sequence only.

### Phase 1 — Data Layer (No UI Changes)

| Step | File | Change | Notes |
|------|------|--------|-------|
| 1.1 | `src/types/grading.ts` (new) | Add all interfaces from Section 5.1 | Keep separate from main `types/index.ts` to avoid bloat |
| 1.2 | `src/mock-data/gradingMockData.ts` (new) | Add `MOCK_CLASS_LOADS`, `MOCK_GRADE_PERIODS`, `MOCK_STUDENT_GRADE_ENTRIES` | Cover at least 2 subjects × 2 periods with realistic data for 5+ students |
| 1.3 | `src/features/grading/utils/gradeCalculator.ts` (new) | Add all calc helpers from Section 6.2 | Pure functions, fully unit-testable |
| 1.4 | `src/services/gradingService.ts` (new) | Create a service layer wrapping mock data — methods: `getClassLoads`, `getPeriods`, `getStudentEntries`, `saveEntry`, `finalizePeriod` | All reads/writes go here so swapping to API is one-file change |

### Phase 2 — Component Scaffolding (New Components, No Route Change Yet)

| Step | File | Change | Notes |
|------|------|--------|-------|
| 2.1 | `src/features/grading/components/GradeSubjectClassSelector.tsx` (new) | Replaces hard-coded subject/section `<select>` pair; filters by teacher's class loads | Props: `teacherId`, `onSelect(classLoad)` |
| 2.2 | `src/features/grading/components/GradePeriodSelector.tsx` (new) | Tabs based on department type | Props: `department`, `periods`, `activePeriodId`, `onSelect` |
| 2.3 | `src/features/grading/components/GradeCellInput.tsx` (new) | Single grade input cell with inline validation | Props: `score`, `maxScore`, `isReadOnly`, `onChange` |
| 2.4 | `src/features/grading/components/GradeSheetTable.tsx` (new) | Dynamic column table for a single period | Props: `period`, `students`, `entries`, `onScoreChange`, `isReadOnly` |
| 2.5 | `src/features/grading/components/AddGradeItemModal.tsx` (new) | Modal form for adding a grade item column | Props: `isOpen`, `onClose`, `onAdd(item)` |
| 2.6 | `src/features/grading/components/ManageGradeWeightsModal.tsx` (new) | Modal for setting category weights | Props: `isOpen`, `categories`, `onSave(categories)` |
| 2.7 | `src/features/grading/components/GradeSummaryView.tsx` (new) | Multi-period read-only summary table | Props: `classLoad`, `periods`, `allEntries` |

### Phase 3 — Page Integration

| Step | File | Change | Notes |
|------|------|--------|-------|
| 3.1 | `src/features/grading/pages/GradeEncodingPage.tsx` (new) | Compose all Phase 2 components | Replaces `GradingModulePage.tsx`; wire to `gradingService` |
| 3.2 | `src/features/grading/pages/GradingModulePage.tsx` | Swap contents to `<GradeEncodingPage />` redirect | Keep file to avoid breaking the `GRADING` module route import in `App.tsx` |
| 3.3 | `src/features/faculty/pages/FacultyPortalPage.tsx` | Replace Tab D's `<GradingModule />` with `<GradeEncodingPage />` | No structural change to the portal; only swap the child |
| 3.4 | `src/services/store.ts` | Add `gradePeriods`, `classLoads`, `studentGradeEntries` slices; add actions `saveStudentEntry`, `addGradeItem`, `finalizePeriod` | Remove old `saveGrade` action once new system is stable |
| 3.5 | `src/types/index.ts` | Keep old `Grade` interface during transition; mark as `@deprecated` | Full removal in Phase 4 |

### Phase 4 — Cleanup and Report Card Update

| Step | File | Change | Notes |
|------|------|--------|-------|
| 4.1 | `src/components/ModalPreviews.tsx` | Update `ReportCardPreview` to accept `ComputedTermGrade[]` instead of `Grade[]` | Remove fake Q1–Q4 fabrication logic; use real period grades |
| 4.2 | `src/types/index.ts` | Remove deprecated `Grade` interface | After all consumers are migrated |
| 4.3 | `src/mock-data/index.ts` | Remove `MOCK_GRADES` array | After Zustand store is migrated |
| 4.4 | Write unit tests for `gradeCalculator.ts` | Validate normalization, null handling, weight calculation | Focus on edge cases: all null, one item, weights not summing to 100 |

---

## 8. Risks and Assumptions

### Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| The old `Grade` interface is referenced in multiple places (store, mock data, report card). Migrating while keeping the app functional requires a parallel-run period. | High | Keep both old and new interfaces; use a `@deprecated` flag; migrate consumers one at a time in Phase 3. |
| The `ReportCardPreview` component fakes Q1–Q4 data. Once real period data exists, the report card template must be redesigned. | High | Redesign `ReportCardPreview` in Phase 4 only — do not attempt this before the data model is stable. |
| `GradingModule` is mounted in two different contexts (`GRADING` module route and `FACULTY_PORTAL` Tab D). If both are not updated simultaneously, behavior will diverge. | Medium | In Phase 3, update both entry points at the same time in a single PR. |
| Category weights may not always sum to 100 if the teacher adds a category and forgets to rebalance. | Medium | `ManageGradeWeightsModal` should enforce a live "remaining weight" counter and block saving if sum ≠ 100. |
| A teacher may finalize a period and then need to correct a score (data entry error). | Medium | Finalization should require an admin role to unlock. Design the `isFinalized` flag to be reversible only with elevated permission. |
| The Zustand store holds all state in memory only — refreshing the browser erases all encoded grades. | Medium | Acceptable for mock-first phase; add `persist` middleware (localStorage) as an interim measure before the real API is ready. |
| The student roster for a class is currently derived from `students.filter(s => s.section === selectedSection)`. This approach breaks if a student changes sections mid-year. | Low | `SubjectClassLoad.studentIds[]` explicit enrollment list resolves this; use it as the authoritative roster. |

### Assumptions

1. The database schema will eventually mirror the TypeScript interfaces defined in Section 5.1. The interfaces are designed to map cleanly to relational tables (one row per `StudentGradeEntry`).
2. Grade computation is always done **client-side**. The backend will store only raw scores, not computed averages. This avoids sync issues between stored and computed values.
3. The 75% passing threshold applies to both Basic Education and College departments unless overridden in school settings.
4. A `GradeItem` is addable but not deletable once scores have been entered for it (to prevent orphaned entries). Deletion is only allowed if no scores exist for that item.
5. The Zustand store's `persist` middleware (not yet implemented) will use `localStorage` as a temporary persistence layer during the mock-first phase.
6. `SubjectClassLoad` (teacher's assigned classes) is managed by the admin through the Scheduling module — teachers do not self-assign.
7. Both STSN and CDSTA schools share the same grading logic. School-specific overrides (e.g., different passing marks) are out of scope for Phase 1–2.

---

*End of report. Do not implement any changes until this document has been reviewed and the recommended architecture has been approved.*

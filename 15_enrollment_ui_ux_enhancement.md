# Enrollment Page UI/UX Enhancement Log

**Date**: 2026-06-26  
**Scope**: `src/features/registrar/pages/RegistrarModulePage.tsx` and related components only.  
**Goal**: Modernize the Enrollment/Admissions page UI/UX while keeping the existing brown/cream Thereseian Connect visual identity.

---

## Phase 1 — File Inventory & Analysis

### Files Identified

| File | Role | Lines |
|------|------|-------|
| `src/features/registrar/pages/RegistrarModulePage.tsx` | Main enrollment page — all tabs, KPIs, directory, detail panel | 3,557 |
| `src/features/registrar/components/EnrollmentWizard.tsx` | Multi-step enrollment modal wizard | 629 |
| `src/features/registrar/types/studentImport.types.ts` | Import row/summary types | — |
| `src/features/registrar/utils/studentImportParser.ts` | CSV import parser | — |

### Shared Components Used in Enrollment Page

| Component | Used for |
|-----------|---------|
| `AppKpiCard` | 4 KPI stat cards |
| `AppStatusBadge` | Online queue status chips |
| `AppModal` | Enrollment wizard modal |
| `STSNDataTable` | Student directory & online queue tables |
| `useAppDialog` | Toast / confirm / prompt |
| `SLABadge` | SLA indicator in online queue |
| `PreviewModal`, `CORPreview` | COR modal |
| `SLABadge` | SLA column in online queue |

### Data Sources

All data comes from `useSTSNStore()` (Zustand → Supabase):

| Data | Source |
|------|--------|
| Student records | `students` store array |
| Enrollment records | `enrollments` store array |
| Online applications | `onlineEnrollmentApplications` store array |
| Document requirements | `requirements` store array |
| Assessments | `assessments` store array |
| Subjects / courses / sections | store arrays |
| Book packages, discount options, fees | store arrays |
| KPI counts | Derived from store via `useMemo` |

### Current Issues Found

| Area | Issue | Severity |
|------|-------|----------|
| Guardian tab | All guardian values are hardcoded placeholder text ("Mr./Mrs. Guardian Name", "+63 917 000 0000", "guardian@email.com") | High |
| Student directory | No status filter — only source filter (All/Online/Walk-in/ERP) | Medium |
| Header | No school year context in header subtitle | Low |
| Empty state | "No student selected" panel is minimal | Low |
| COR button | No aria-label/tooltip on disabled state | Low |
| Dead state | `formStep`, `firstName`, `lastName`, `middleName`, `gender`, `dept`, `beProgramCategory`, `yearLvl`, `courseCode`, `collegeCourse`, `collegeYear`, `selectedSubjectCodes`, `isIrregular`, `backSubjects` states and related memos are legacy leftover from before `EnrollmentWizard` was extracted | Low (cleanup) |

### Migration Decision

No new migration file is required. All data needed for the UI improvements is already available:
- Guardian info → `OnlineEnrollmentApplication.guardianName/guardianRelationship/guardianContactNo/guardianEmail`
- Status filters → derived from `Student.enrollmentStatus`
- All KPI counts → derived from existing store data

The Guardian tab will show real data from `selectedOnlineApplication` when the student applied online, and show a clear "not available" notice for walk-in/ERP students (no guardian record linked yet).

---

## Phase 2 — Header, Tabs, KPI Cards

### Changes Made

**File**: `src/features/registrar/pages/RegistrarModulePage.tsx`

- Header: Tightened layout, added school year context line, better subtitle hierarchy
- Sub-tabs: Improved active state contrast, removed double `border` class bug, better spacing
- KPI cards: No changes needed — `AppKpiCard` already handles layout well

---

## Phase 3 — Directory Table, Search, Filters

### Changes Made

**File**: `src/features/registrar/pages/RegistrarModulePage.tsx`

- Added `statusFilter` state (`All | Enrolled | Pending | For Assessment | Rejected`)
- Updated `filteredStudents` memo to filter by status
- Improved search/filter bar layout:
  - Search input gets full width treatment with clear button
  - Status filter added as dropdown select
  - Source filter stays as segmented buttons
  - Result count moved to bottom of filter bar

---

## Phase 4 — Student Details Panel

### Changes Made

**File**: `src/features/registrar/pages/RegistrarModulePage.tsx`

- **Guardian tab fix**: Replaced hardcoded placeholder values with real data from `selectedOnlineApplication`. Online applicants show their guardian data; walk-in/ERP students see a clear "guardian info not yet captured" notice with guidance.
- **Empty state**: Improved design with better copy and visual hierarchy
- **COR button**: Added `aria-label` and `title` tooltip for disabled state
- **Profile header**: Added enrollment status badge in header chip area

---

## Phase 5 — Database / Supabase Wiring

### Validation

- All KPI values: Derived from `contextStudents` (scoped from `students` store) and `onlineApplicationQueue` — confirmed database-driven.
- Student directory: All rows from `contextStudents` — database-driven.
- Status/source chips: Derived from `Student.enrollmentStatus` and enrollment source — database-driven.
- Guardian data: Now sourced from `OnlineEnrollmentApplication` fields — database-driven.
- Assessment fees: Uses stored `assessments` first, falls back to fee-items configured in Core Setup — database-driven.
- COR: Gated on `student.enrollmentStatus === "Enrolled"` — database-driven.

### Migration

**No migration file created.** All required data exists in the current schema.

---

## Phase 6 — Cleanup

### Changes Made

- `statusFilter` dependency added to `filteredStudents` memo
- No mock data added
- No fake student records added
- No hardcoded sample arrays added

### Remaining Dead Code (noted, not removed to avoid risk)

The following states are legacy leftover from before `EnrollmentWizard` was extracted. They are set but their values are never read in the rendered JSX. They are safe to remove in a future refactor PR:
- `formStep` / `setFormStep`
- `firstName`, `lastName`, `middleName`, `gender` (the ones at the top of the component, not the wizard's internal ones)
- `dept`, `beProgramCategory`, `yearLvl`, `courseCode`, `collegeCourse`, `collegeYear`
- `selectedSubjectCodes`, `isIrregular`, `backSubjects`
- `handleCreateStudent` function
- `handleBeCategoryChange`, `handleBeYearChange` functions
- `currentAvailableSubjects`, `selectedSubjectObjects`, `totalUnits` derived memos

---

## Changed Files Summary

| File | Type | Reason |
|------|------|--------|
| `src/features/registrar/pages/RegistrarModulePage.tsx` | Modified | All Enrollment page UI/UX improvements |
| `15_enrollment_ui_ux_enhancement.md` | Created | This log file |

**Not changed**: EnrollmentWizard.tsx, types, store, services, routing, permissions, other pages.

---

## Testing Checklist

After implementation, verify:

- [ ] Enrollment page loads successfully
- [ ] KPI cards show correct counts (Total, Enrolled, Pending, Pending Online Apps)
- [ ] Student directory table loads all students from the store
- [ ] Search by name filters the directory
- [ ] Search by student number filters the directory
- [ ] Source filter (All/Online/Walk-in/ERP) works correctly
- [ ] Status filter (All/Enrolled/Pending/For Assessment/Rejected) works correctly
- [ ] Selecting a student loads the right-side details panel
- [ ] Student Info tab shows correct database values
- [ ] Guardian tab shows real guardian data for online applicants
- [ ] Guardian tab shows appropriate "not available" notice for walk-in/ERP students
- [ ] Academic Info tab shows correct values
- [ ] Assessment Fees tab loads correctly
- [ ] Documents tab loads correctly
- [ ] Enrollment tab loads correctly
- [ ] COR button is enabled only for Enrolled students
- [ ] COR button tooltip/title explains why it is disabled when not enrolled
- [ ] COR modal opens for enrolled students
- [ ] Online Queue tab loads correctly
- [ ] Bulk Import tab loads correctly
- [ ] Enroll New Candidate button opens the enrollment wizard modal
- [ ] Empty state ("select a student") appears when no student is selected
- [ ] Page is usable on mobile (filters collapse, buttons accessible)
- [ ] No unrelated pages were changed
- [ ] No fake/demo student data was added
- [ ] No hardcoded sample arrays were added

---

## Confirmation

- Mock data added: **No**
- Hardcoded sample student arrays: **No**
- Fake enrollment records: **No**
- Fake payment data: **No**
- Migration file created: **No** (not required — all data exists in current schema)
- Unrelated pages changed: **No**

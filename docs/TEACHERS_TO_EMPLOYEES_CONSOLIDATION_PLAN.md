# Teachers To Employees Consolidation Plan

## Goal

Retire `public.teachers` as a separate person master table and make `public.employees` the canonical staff record for all non-student personnel, including teaching staff.

This document is a planning and execution reference only. It does not apply schema or code changes by itself.

## Executive Summary

Today the app maintains both `public.teachers` and `public.employees`, which creates duplicate identity data, weak links between HR and academic records, and several UI fallbacks that match people by email instead of by foreign key.

Recommended end state:

- `public.employees` remains the single staff master
- faculty-only fields move into a small extension table linked to `employees`
- academic ownership columns move from `teacher_id` to employee-based foreign keys
- application role names like `TEACHER` can remain even after the `teachers` table is removed
- the app stops doing email-based teacher-to-employee resolution

## Progress Snapshot

Current implementation status in this repo:

- completed: Phase 1 bridge migration via `20260705140000_teachers_employee_bridge.sql`
- completed: Phase 1.5 audit views via `20260705141000_teachers_employee_bridge_audit_views.sql`
- completed: Phase 2 faculty extension table via `20260705142000_employee_faculty_profiles.sql`
- completed (schema only — data backfill is incomplete, see below): Phase 3 dual-key schema migrations for academic, attendance, and consultation ownership
- completed: all Phase 1–3 migrations above have been applied to the live project database
- complete under current schema: Phase 4 application cutover across `dataLoader`, shared types, store write paths, and faculty/grading/scheduling/profile/consultation reads — a full code audit (2026-07-05) found dual-write and employee-primary matching already in place everywhere teacher-owned data is read or written; see the "Phase 4 completeness audit" note below for what was checked
- actively run, currently FAILING: Phase 5 UAT is now automated — read-only Playwright checks (`tests/e2e/teacher-employee-consolidation.spec.ts`) and a DB validation script (`npm run validate:consolidation`) both ran against the live project on 2026-07-05. Result: **`ready_for_phase_6 = false`** — 5 of 8 `teachers` rows have no bridged employee, and 52 dependent rows across `class_schedules`, `grade_periods`, `grades`, `learning_materials`, `sections`, and `subject_class_loads` are still missing `employee_id`. See `docs/TEACHERS_TO_EMPLOYEES_UAT_CHECKLIST.md` for the full breakdown.
- not started: Phase 6 legacy column / table retirement — blocked behind live UAT signoff per the hard gate in `docs/TEACHERS_TO_EMPLOYEES_RETIREMENT_RUNBOOK.md`, and now additionally blocked by the concrete Phase 5 failures above; no destructive SQL has been written or run

Completed app-side cutover work so far:

- shared types now carry employee-based ownership alongside legacy teacher-based ownership
- `src/services/dataLoader.ts` now loads employee ownership fields and prefers employee-backed display names where available
- store write paths now dual-write employee ownership for grades, class schedules, advisory assignment, learning materials, consultation, and attendance-related flows
- faculty and grading filters now begin honoring employee ownership where it exists, while preserving teacher fallback during the dual-read phase
- `FacultyAdminPage.tsx` now reads schedules by employee ownership when available and attendance logging now dual-writes `recorded_by_employee_id`
- `SchedulingModulePage.tsx` now treats employee ownership as the primary matching key for conflict detection, faculty filtering, and schedule assignment summaries
- `ClassSectioningModulePage.tsx` now preserves adviser employee ownership when editing bridged sections instead of collapsing back to teacher-only adviser metadata
- profile-facing identity lookups now prefer explicit teacher-to-employee linkage before legacy email fallback in `MyProfilePage.tsx` and `NewEmployeeProfilePage.tsx`
- `ConsultationModulePage.tsx` now scopes and labels appointments through employee ownership when available instead of relying only on `teacherId`
- `resolveCurrentTeacher` now normalizes and constrains legacy email fallback so faculty session resolution is less likely to drift across academic units
- Phase 5 validation views now summarize bridge gaps, dual-key backfill gaps, and retirement readiness through `v_teacher_consolidation_*` views
- a dedicated UAT execution checklist now exists in `docs/TEACHERS_TO_EMPLOYEES_UAT_CHECKLIST.md`
- `StaffProfileWorkspace.tsx` now stops dual-writing shared identity fields back into `teachers` when a canonical employee record already exists, while still preserving faculty-only specialization updates
- a Phase 6 retirement runbook now exists in `docs/TEACHERS_TO_EMPLOYEES_RETIREMENT_RUNBOOK.md`
- `dataLoader.ts` now derives teacher advisory assignment from section ownership, and `store.ts` no longer persists advisory sync back into `public.teachers`
- `src/types/database.types.ts` now includes the consolidation-era bridge, dual-key ownership, faculty profile, attendance, and consultation schema updates needed by the app layer
- faculty session pages now resolve the linked employee through a shared helper in `resolveTeacher.ts` instead of duplicating employee lookup fallbacks page-by-page
- Phase 6 retirement prep now includes a legacy-key footprint view via `20260705146000_teacher_consolidation_retirement_footprint_views.sql`
- Phase 6 retirement prep now also includes blocker and dashboard views via `20260705147000_teacher_consolidation_retirement_blockers.sql`
- `employee_faculty_profiles` is now surfaced in the app layer: `Employee` (`src/types/index.ts`) carries `isTeachingStaff` and `facultyRank`, and `dataLoader.ts` joins `employee_faculty_profiles` when loading employees instead of leaving the table schema-only
- the dashboard's "Total Teachers" KPI no longer counts raw `teachers.length`; it now counts employees flagged `isTeachingStaff` in their faculty profile plus any teacher rows not yet bridged to an employee, closing the "dashboard metrics still count faculty from teacher state" gap called out below
- faculty-portal accrued-leave display was confirmed to already resolve through the linked employee record (`resolveTeacher.ts` + `linkedEmployee.leaveBalance`) rather than matching by email, so no further change was needed there

### Phase 4 completeness audit (2026-07-05)

A targeted code audit looked for any remaining single-key (teacher-only) reads or writes across the tables and pages this plan calls out, and found none:

- `store.ts` dual-writes `employeeId` alongside `teacherId` for grades, class schedules, section adviser assignment, and learning materials via the shared `resolveTeacherEmployeeId` helper
- `FacultyAdminPage.tsx` and `FacultyPortalPage.tsx` both write `recorded_by` and `recorded_by_employee_id` together on `student_attendance` inserts
- `ConsultationModulePage.tsx` writes `teacherId` and `employeeId` together on `consultation_appointments` inserts
- `GradeEncodingPage.tsx` and `GradesDirectoryPage.tsx` both scope class-load ownership through the shared `teacherMatchesOwnership` helper, which checks `employeeId` first and only falls back to `teacherId` when one side lacks a bridged employee
- `NewEmployeeProfilePage.tsx` resolves the linked teacher by `employeeId`, then `userId`, then normalized email last — email is a last-resort fallback, not the primary path
- no other dashboard, report, or list page was found counting or filtering people by raw `teachers` state the way the old dashboard KPI did

What remains is explicitly out of Phase 4's scope: full teacher-session retirement (resolving sessions purely from `employees.user_id` with no `Teacher` row involved at all) is a Phase 6-era change, since `Teacher` still backs UI-only fields like `specialization` and is still a first-class row until `public.teachers` is actually dropped.

## Why This Change Is Needed

Current duplication exists across:

- name
- email
- school assignment
- department
- account linkage
- active/inactive status

This causes real product and maintenance problems:

- one person can exist in both `teachers` and `employees`
- there is no authoritative FK bridge between the two models today
- some faculty and profile screens resolve links by email
- many academic tables still point directly to `teachers.id`
- profile and advisory workflows are forced into dual-read or dual-write behavior

## Current Repo Reality

The codebase already confirms that `teachers` is still a first-class master table across both schema and frontend.

### Existing schema ownership links

From [0001_schema.sql](/C:/Users/VELOSO/Documents/GitHub/stsn-connect/supabase/migrations/0001_schema.sql:104):

- `public.sections.adviser_id -> public.teachers(id)`
- `public.class_schedules.teacher_id -> public.teachers(id)`
- `public.subject_class_loads.teacher_id -> public.teachers(id)`
- `public.grade_periods.teacher_id -> public.teachers(id)`
- `public.grades.teacher_id -> public.teachers(id)`
- `public.learning_materials.teacher_id -> public.teachers(id)`

From [0016_student_attendance.sql](/C:/Users/VELOSO/Documents/GitHub/stsn-connect/supabase/migrations/0016_student_attendance.sql:20):

- `public.student_attendance.recorded_by -> public.teachers(id)`

From [0017_clinic_guidance_consultation.sql](/C:/Users/VELOSO/Documents/GitHub/stsn-connect/supabase/migrations/0017_clinic_guidance_consultation.sql:113):

- `public.consultation_appointments.teacher_id -> public.teachers(id)`

### Existing frontend and store coupling

Current higher-risk hotspots:

- [src/utils/resolveTeacher.ts](/C:/Users/VELOSO/Documents/GitHub/stsn-connect/src/utils/resolveTeacher.ts:11) still contains the central legacy fallback path for teacher-session resolution, even though it is now normalized and academic-unit-aware
- [src/features/faculty/pages/FacultyPortalPage.tsx](/C:/Users/VELOSO/Documents/GitHub/stsn-connect/src/features/faculty/pages/FacultyPortalPage.tsx:137) still anchors the faculty session around `currentTeacher`, which remains part of the temporary dual-read model
- [src/features/grading/pages/GradeEncodingPage.tsx](/C:/Users/VELOSO/Documents/GitHub/stsn-connect/src/features/grading/pages/GradeEncodingPage.tsx:32) scopes grade encoding through `resolveCurrentTeacher`
- [src/features/grading/pages/GradesDirectoryPage.tsx](/C:/Users/VELOSO/Documents/GitHub/stsn-connect/src/features/grading/pages/GradesDirectoryPage.tsx:349) filters loads and grade operations through `currentTeacher`
- [src/features/consultation/pages/ConsultationModulePage.tsx](/C:/Users/VELOSO/Documents/GitHub/stsn-connect/src/features/consultation/pages/ConsultationModulePage.tsx:33) still keeps `teacherId` in the UI model during the dual-key transition, even though employee-backed scoping is now wired in
- remaining higher-risk app hotspots are now concentrated in final teacher-session retirement, any leftover generated-type drift outside consolidation scope, and Phase 5 validation rather than core faculty/grading/scheduling/sectioning/consultation reads

### Existing employee-side profile schema

The repo already contains [20260630133000_faculty_employee_profile_schema.sql](/C:/Users/VELOSO/Documents/GitHub/stsn-connect/supabase/migrations/20260630133000_faculty_employee_profile_schema.sql:1), which adds:

- `employee_profile_contacts`
- `employee_education_backgrounds`
- `employee_license_certifications`

Important note:

- these tables are employee profile support tables, not a faculty identity replacement
- the faculty extension proposed in this plan should complement them, not conflict with them

## Target Data Model

### Canonical staff model

Use `employees` as the single source of truth for:

- identity
- user linkage
- school linkage
- department
- employment status
- payroll and HR data

Keep:

- `students` as the student master
- `users` as the auth/account master

### Faculty extension table

Instead of keeping a full `teachers` master table, create a faculty-only extension table linked one-to-one with `employees`.

Recommended name:

- `employee_faculty_profiles`

Suggested shape:

```sql
create table public.employee_faculty_profiles (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null unique references public.employees(id) on delete cascade,
  specialization text,
  advisory_section text,
  faculty_rank text,
  is_teaching_staff boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Why `employees.id` should stay the main FK target:

- most operational ownership is about the staff member, not the faculty extension row
- it keeps joins and selectors simpler
- it aligns with LMS and HR patterns already present in the repo
- it avoids spreading a second new identity key through academic tables

## Recommended Field Mapping

### Move into `employees`

- `first_name`
- `last_name`
- `middle_name`
- `email`
- `school_id`
- `user_id`
- `department`
- `phone` or canonical contact field
- active/inactive status

### Move into `employee_faculty_profiles`

- `specialization`
- `advisory_section`
- `faculty_rank`
- faculty-only teaching flags

### Keep out of the faculty extension

- payroll-only or HR lifecycle fields that already belong on `employees` or related HR tables
- generic profile workspace data already modeled in employee profile support tables

## Directly Impacted Database Objects

### Teacher-owned foreign keys to replace

- `sections.adviser_id`
- `class_schedules.teacher_id`
- `subject_class_loads.teacher_id`
- `grade_periods.teacher_id`
- `grades.teacher_id`
- `learning_materials.teacher_id`
- `student_attendance.recorded_by`
- `consultation_appointments.teacher_id`

### Recommended replacement columns

- `sections.adviser_employee_id`
- `class_schedules.employee_id`
- `subject_class_loads.employee_id`
- `grade_periods.employee_id`
- `grades.employee_id`
- `learning_materials.employee_id`
- `student_attendance.recorded_by_employee_id`
- `consultation_appointments.employee_id`

Recommended rule:

- use `employee_id` unless the column name needs more context for readability
- keep role-language like "teacher" in UI labels, not in physical FK names

## Indirectly Impacted Application Areas

### Data loading and store logic

- [src/services/dataLoader.ts](/C:/Users/VELOSO/Documents/GitHub/stsn-connect/src/services/dataLoader.ts:192)
- [src/services/store.ts](/C:/Users/VELOSO/Documents/GitHub/stsn-connect/src/services/store.ts:345)
- [src/utils/resolveTeacher.ts](/C:/Users/VELOSO/Documents/GitHub/stsn-connect/src/utils/resolveTeacher.ts:1)
- [src/services/academicUnitScopeService.ts](/C:/Users/VELOSO/Documents/GitHub/stsn-connect/src/services/academicUnitScopeService.ts:1)

### Faculty-facing modules

- [src/features/faculty/pages/FacultyPortalPage.tsx](/C:/Users/VELOSO/Documents/GitHub/stsn-connect/src/features/faculty/pages/FacultyPortalPage.tsx:1)
- [src/features/faculty/pages/FacultyAdminPage.tsx](/C:/Users/VELOSO/Documents/GitHub/stsn-connect/src/features/faculty/pages/FacultyAdminPage.tsx:1)
- [src/features/grading/pages/GradeEncodingPage.tsx](/C:/Users/VELOSO/Documents/GitHub/stsn-connect/src/features/grading/pages/GradeEncodingPage.tsx:1)
- [src/features/grading/pages/GradesDirectoryPage.tsx](/C:/Users/VELOSO/Documents/GitHub/stsn-connect/src/features/grading/pages/GradesDirectoryPage.tsx:1)

### Scheduling and advisory

- [src/features/scheduling/pages/SchedulingModulePage.tsx](/C:/Users/VELOSO/Documents/GitHub/stsn-connect/src/features/scheduling/pages/SchedulingModulePage.tsx:1)
- [src/features/class-sectioning/pages/ClassSectioningModulePage.tsx](/C:/Users/VELOSO/Documents/GitHub/stsn-connect/src/features/class-sectioning/pages/ClassSectioningModulePage.tsx:1)

### Profiles and identity resolution

- [src/features/hr/pages/sub-pages/NewEmployeeProfilePage.tsx](/C:/Users/VELOSO/Documents/GitHub/stsn-connect/src/features/hr/pages/sub-pages/NewEmployeeProfilePage.tsx:1)
- [src/features/profiles/components/StaffProfileWorkspace.tsx](/C:/Users/VELOSO/Documents/GitHub/stsn-connect/src/features/profiles/components/StaffProfileWorkspace.tsx:1)
- [src/features/profiles/pages/MyProfilePage.tsx](/C:/Users/VELOSO/Documents/GitHub/stsn-connect/src/features/profiles/pages/MyProfilePage.tsx:1)

### Attendance, consultation, materials, and dashboards

- [src/features/consultation/pages/ConsultationModulePage.tsx](/C:/Users/VELOSO/Documents/GitHub/stsn-connect/src/features/consultation/pages/ConsultationModulePage.tsx:1)
- faculty attendance flows inside [FacultyPortalPage.tsx](/C:/Users/VELOSO/Documents/GitHub/stsn-connect/src/features/faculty/pages/FacultyPortalPage.tsx:299)
- learning material ownership reads in [dataLoader.ts](/C:/Users/VELOSO/Documents/GitHub/stsn-connect/src/services/dataLoader.ts:396)
- dashboard metrics — resolved: [DashboardPage.tsx](/C:/Users/VELOSO/Documents/GitHub/stsn-connect/src/features/dashboard/pages/DashboardPage.tsx:560) now derives faculty count from `employees.isTeachingStaff` with an unbridged-teacher fallback instead of raw `teachers.length`

## Seed, Types, and Generated Artifacts To Update

### Seed and migration data

- `supabase/migrations/0003_data.sql`
- `supabase/migrations/0016_student_attendance.sql`
- `supabase/migrations/0017_clinic_guidance_consultation.sql`
- `supabase/migrations/20260630131000_demo_uat_full_school_year_seed.sql`
- `supabase/migrations/combined_migration.sql`

### Generated and app-side typing

- `src/types/database.types.ts`
- `src/types/index.ts`
- `src/types/grading.ts`

Likely type changes:

- replace ownership fields from `teacherId` to `employeeId`
- preserve display-oriented labels separately where needed
- keep UI language like `teacherName` only when it is truly presentation data

## UI Alignment Rules

The user-facing experience should stay faculty-friendly even after the backend model changes.

### Keep in the UI

- `Teacher`
- `Faculty`
- `Adviser`
- `Teacher Board`

### Remove from implementation behavior

- email-based teacher-to-employee matching
- dual writes of shared identity fields into both `teachers` and `employees`
- assumptions that every faculty workflow must start from a `teachers` row

### Practical behavioral target

- session identity resolves from `employees.user_id`
- faculty-only details resolve from `employee_faculty_profiles`
- academic ownership resolves from employee-based FKs
- RBAC and page routing can still expose teacher-specific experiences

## Pre-Migration Data Audit

Before changing any foreign keys, run a teacher-to-employee reconciliation pass.

### Matching order

1. match by `user_id`
2. fallback match by normalized email
3. manually review unresolved or conflicting rows

### Review buckets

- teacher with no matching employee
- employee with no matching teacher
- one teacher matching multiple employees
- one employee matching multiple teachers
- mismatched school, department, or name data

### Success criteria for the audit

- every active teacher is either mapped to exactly one employee or explicitly excluded
- every unresolved case has a manual resolution note before backfill begins

## Phased Execution Plan

### Phase 1: Add a bridge from teachers to employees

Status:

- completed

Purpose:

- create a safe transition path without immediately breaking existing teacher-based FKs

Suggested steps:

1. add `teachers.employee_id uuid references employees(id)`
2. backfill by `user_id`
3. fallback backfill by normalized email
4. review conflicts and unmapped rows
5. add uniqueness only after data is clean

Notes:

- do not make `teachers.employee_id` `not null` until reconciliation is complete
- this bridge makes later dual-backfill migrations much safer

### Phase 2: Create the faculty extension table

Status:

- completed

Purpose:

- preserve faculty-only attributes while removing `teachers` as the person master

Suggested steps:

1. create `employee_faculty_profiles`
2. backfill one row per bridged teacher
3. copy `specialization`, `advisory_section`, and any approved faculty-only fields
4. add index or unique guarantees around `employee_id`

Notes:

- keep the faculty extension small and intentional
- do not duplicate general contact, education, or license records already modeled elsewhere

### Phase 3: Add new employee-based ownership columns

Status:

- schema complete; backfill is only partial — confirmed by `npm run validate:consolidation` on 2026-07-05: `class_schedules`, `grade_periods`, `grades`, `learning_materials`, `sections`, and `subject_class_loads` all still have rows with `employee_id is null`, because the backfill can only reach rows owned by teachers that are already bridged (3 of 8), and 5 teachers are not. Re-running the backfill query alone won't fix this — the underlying `unresolved_teacher_rows` gap has to close first.

Purpose:

- prepare all dependent academic tables for dual-read and backfill

Suggested steps:

1. add new employee-based columns alongside existing teacher-based columns
2. backfill through `teachers.employee_id`
3. add indexes and foreign keys on the new columns
4. validate row counts and null counts

Example pattern:

```sql
alter table public.class_schedules
  add column if not exists employee_id uuid references public.employees(id) on delete set null;

update public.class_schedules cs
set employee_id = t.employee_id
from public.teachers t
where cs.teacher_id = t.id
  and cs.employee_id is null;
```

Validation checks to run per table:

- old FK populated count vs new FK populated count
- rows where old teacher FK is set but new employee FK is still null
- rows where `teachers.employee_id` itself is null

### Phase 4: Cut over application reads and writes

Status:

- in progress

Purpose:

- make the app treat `employees` as canonical for staff identity

Suggested steps:

1. replace `resolveCurrentTeacher` with employee-based resolution plus faculty-profile lookup
2. stop reading relational `teachers(...)` selects in `dataLoader.ts`
3. migrate forms, filters, and store actions from `teacherId` to `employeeId`
4. remove advisory logic that writes to `teachers.advisorySection`
5. update profile pages to stop dual-writing shared identity data

Progress note:

- step 4 is now substantially completed in the app layer: advisory ownership is persisted on `sections`, then re-derived into teacher-facing UI state during data loading

Important behavioral fixes included in this phase:

- faculty portal should no longer derive leave data by matching employee email to teacher email
- grade encoding and grade period finalization should scope to employee ownership
- consultation faculty pickers should list teaching employees, not teacher rows
- shared staff profile editing should stop mirroring common identity edits into both `teachers` and `employees` once a bridged employee record exists
- advisory assignment should be stored on sections and re-hydrated into teacher-facing UI state without treating `teachers.advisorySection` as the persisted source of truth

### Phase 5: UAT and dual-read validation

Status:

- in progress

Purpose:

- prove that the new ownership model works before any destructive cleanup

Required checks:

- faculty portal still loads for teaching staff
- scheduling still assigns advisers correctly
- attendance records save with employee-based ownership
- grade encoding still scopes to the signed-in faculty user
- consultation workflows still filter and assign correctly
- dashboard counts distinguish total employees from total faculty
- profile pages no longer depend on teacher/email fallbacks

Implemented validation assets:

- [20260705145000_teacher_consolidation_validation_views.sql](/C:/Users/VELOSO/Documents/GitHub/stsn-connect/supabase/migrations/20260705145000_teacher_consolidation_validation_views.sql:1)
- [TEACHERS_TO_EMPLOYEES_UAT_CHECKLIST.md](/C:/Users/VELOSO/Documents/GitHub/stsn-connect/docs/TEACHERS_TO_EMPLOYEES_UAT_CHECKLIST.md:1)
- [scripts/validate-teacher-consolidation.mjs](/C:/Users/VELOSO/Documents/GitHub/stsn-connect/scripts/validate-teacher-consolidation.mjs:1) — runs the four checklist SQL checkpoints read-only (`npm run validate:consolidation`)
- [tests/e2e/teacher-employee-consolidation.spec.ts](/C:/Users/VELOSO/Documents/GitHub/stsn-connect/tests/e2e/teacher-employee-consolidation.spec.ts:1) — Playwright read-only checks for Faculty Portal, Grading, Scheduling, Sectioning, Consultation, Profiles, and the dashboard faculty count (`npm run test:e2e -- tests/e2e/teacher-employee-consolidation.spec.ts`); the broader e2e suite it lives in (`tests/e2e/`, `playwright.config.ts`) was brought over from the `dev` branch, where it previously lived unmerged
- mutation-based UAT specs (create schedule, submit attendance, create consultation, save grade) are not yet built — see the UAT checklist for what's still manual

### Phase 6: Retire teachers

Status:

- not started

Purpose:

- remove legacy schema only after the app no longer depends on it

Suggested steps:

1. drop old FKs to `teachers`
2. drop old `teacher_id` and `adviser_id` columns after validation
3. optionally create a temporary compatibility view if rollout safety requires it
4. drop `teachers` last

Notes:

- keep a reversible migration boundary until UAT signoff
- do not drop `teachers` while any selector, report, or RLS policy still depends on it

Retirement preparation asset:

- [TEACHERS_TO_EMPLOYEES_RETIREMENT_RUNBOOK.md](/C:/Users/VELOSO/Documents/GitHub/stsn-connect/docs/TEACHERS_TO_EMPLOYEES_RETIREMENT_RUNBOOK.md:1)
- [20260705146000_teacher_consolidation_retirement_footprint_views.sql](/C:/Users/VELOSO/Documents/GitHub/stsn-connect/supabase/migrations/20260705146000_teacher_consolidation_retirement_footprint_views.sql:1)
- [20260705147000_teacher_consolidation_retirement_blockers.sql](/C:/Users/VELOSO/Documents/GitHub/stsn-connect/supabase/migrations/20260705147000_teacher_consolidation_retirement_blockers.sql:1)

## Validation And Acceptance Checklist

### Data acceptance

- every teacher row is mapped to exactly one employee or intentionally archived
- every dependent teacher-owned row is backfilled to an employee-based key
- faculty-only fields are preserved after backfill
- no required workflow still depends on email-based matching

### Schema acceptance

- all teacher-owned tables have employee-based ownership columns
- required indexes and FKs exist on new columns
- seed and demo data align with the new model
- generated DB types have been refreshed for the consolidation tables and any remaining non-consolidation drift is tracked separately

### Application acceptance

- faculty sessions resolve from employee identity
- faculty-specific views still render faculty-friendly labels
- HR and profile pages read shared staff data from `employees`
- advisory, grading, attendance, and consultation workflows still function end to end

## Explicit Decisions Still Needed

These decisions should be finalized before SQL implementation begins:

- exact naming convention for new employee-based ownership columns
- whether `employees` needs dedicated fields like `phone`, `is_active`, or `staff_type`
- whether a temporary compatibility SQL view named `teachers` is worth the rollout complexity
- whether `faculty_rank` belongs in `employee_faculty_profiles` or should remain driven by setup metadata
- whether `TEACHER` remains an application role distinct from `EMPLOYEE` after table consolidation

## Recommended Decision Direction

Unless new constraints appear, the plan should proceed with these defaults:

- keep `TEACHER` as an application and RBAC concept
- remove `teachers` as a database person master
- use `employees.id` as the FK target for academic ownership
- use `employee_faculty_profiles` only for faculty-specific attributes
- prefer a short dual-read transition over a long-lived compatibility view

## Suggested Implementation Order

1. completed: run the data audit
2. completed: add `teachers.employee_id`
3. completed: create `employee_faculty_profiles`
4. partially complete — **only 3 of 8 teacher rows matched an employee** (by `user_id` or normalized email); the remaining 5 are `unresolved_no_employee_match` per `v_teacher_employee_bridge_summary` and need manual review (new employee record needed? name/email mismatch? intentionally non-HR teaching staff?) before backfill can reach them
5. completed: add employee-based FK columns to dependent academic tables
6. blocked on item 4 — backfill only reaches rows owned by already-bridged teachers; 52 dependent rows across `class_schedules`, `grade_periods`, `grades`, `learning_materials`, `sections`, and `subject_class_loads` remain unbackfilled as of 2026-07-05
7. complete under current schema: cut over frontend, store, and data loader logic — faculty-profile data (`isTeachingStaff`, `facultyRank`) and dashboard faculty counting are now wired, and the 2026-07-05 audit found dual-write/employee-primary matching everywhere else this plan tracks; only Phase 6-era full teacher-session retirement remains
8. complete: `src/types/database.types.ts` already includes the consolidation-era bridge, dual-key, faculty profile, attendance, and consultation types; no further regeneration is pending for consolidation scope (any unrelated type drift is tracked separately, outside this plan)
9. in progress, currently failing: UAT is now automated via `npm run test:e2e -- tests/e2e/teacher-employee-consolidation.spec.ts` (read-only browser checks, 6/7 passing) and `npm run validate:consolidation` (DB validation views, FAILING — `ready_for_phase_6 = false`). Mutation-based checklist items (create schedule, submit attendance, create consultation, save grade) still need dedicated specs, and the one Playwright failure traces directly to item 4's bridge gap on the default demo teacher account. See `docs/TEACHERS_TO_EMPLOYEES_UAT_CHECKLIST.md` for the full breakdown and a human signoff still needs to happen once this passes.
10. explicitly gated: retiring legacy teacher FKs and dropping `teachers` must not start until item 9 signs off per the hard gate in `docs/TEACHERS_TO_EMPLOYEES_RETIREMENT_RUNBOOK.md` — currently blocked by real, confirmed failures, not just process; no Phase 6 SQL has been drafted or run

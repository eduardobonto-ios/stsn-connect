# Academic Unit Data Separation Plan

## Goal

Ensure users only see records for their assigned school context:

- STSN users should see only Basic Education records.
- CDSTA users should see only College records.
- Super Admin users may see all records only when the active school context is `ALL`.

This rule should apply consistently across modules, reports, filters, exports, previews, and dashboard summaries.

## Core Rule

School context determines academic unit:

| School | Academic Unit | Department |
| --- | --- | --- |
| `STSN` | `basic-ed` | `Basic Education` |
| `CDSTA` | `college` | `College` |

Role determines permissions only. Role should not determine whether a workflow is Basic Education or College.

## Recommended Validation Pattern

Each module should resolve an effective school context:

```ts
const effectiveSchool = currentUser?.schoolId ?? (activeSchool !== "ALL" ? activeSchool : undefined);
```

Then derive the department from the active academic unit when the user is scoped to a school:

```ts
const effectiveDepartment = effectiveSchool ? academicUnitToDepartment(academicUnit) : undefined;
```

All module data should then be filtered before rendering tables, cards, dropdowns, exports, previews, and computed summaries.

## Registrar Reports Application

For Admission > Registrar Reports, the report context should be scoped before rows are built:

- Students should match `effectiveSchool` and `effectiveDepartment`.
- Enrollments should include only scoped student IDs.
- Requirements should include only scoped student IDs.
- Sections should match `effectiveSchool` and `effectiveDepartment`.

This prevents Basic Education and College records from mixing in:

- Student Masterlist
- Officially Enrolled Students
- Enrollment Summary
- Enrollment Count by Grade / Year Level
- Enrollment Count by Section / Block
- Enrollment Status Report
- Transferee / Returnee Report
- Dropped / Withdrawn Students
- Requirements Submission Report
- COR / Certificate of Registration

## App-Wide Recommendation

The same separation should be audited and applied to:

- Registrar
- Registrar Reports
- Accounting should remain consolidated across Basic Education and College.
- Cashier
- Faculty / Teacher Portal
- Student Portal
- Scheduling
- Class Sectioning
- Guidance
- Clinic
- HR
- Online Learning
- Dashboard summaries
- Export and print services

## Implementation Checklist

- [x] Add a shared helper for resolving effective school context.
- [x] Add a shared helper for filtering school-scoped records.
- [x] Apply scoped filtering to Registrar Reports.
- [x] Apply scoped filtering to Registrar module tables and forms.
- [x] Keep Accounting consolidated for Basic Education and College reports.
- [x] Apply scoped filtering to Cashier student/payment records.
- [x] Apply scoped filtering to Faculty, Student Portal, Scheduling, and Class Sectioning records.
- [x] Apply scoped filtering to Guidance, Clinic, and Online Learning records.
- [x] Apply scoped filtering to Dashboard summaries and enrollment analytics.
- [ ] Audit HR records for any remaining academic-unit-specific views.
- [ ] Confirm exports and print previews use scoped data only.
- [ ] Confirm Super Admin can intentionally view `ALL` only when active school is `ALL`.

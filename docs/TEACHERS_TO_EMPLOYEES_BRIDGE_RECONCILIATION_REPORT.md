# Teacher → Employee Bridge Reconciliation Report

Generated 2026-07-05, read-only, against the live project in `.env`. Source: `teachers`, `employees`,
`schools`, `v_teacher_employee_bridge_audit`, `v_unlinked_employees_for_teacher_consolidation`, plus
direct row-count queries against every teacher-owned table. **No data was modified to produce this
report.**

## Scope

The 5 `teachers` rows with `employee_id is null`, out of 8 total (`v_teacher_employee_bridge_summary`:
`matched_by_email` = 3, `unresolved_no_employee_match` = 5).

## Method

- **Email candidates**: `employees` rows where `lower(trim(email))` exactly equals the teacher's
  normalized email. Zero found for all 5 — confirmed independently via
  `v_unlinked_employees_for_teacher_consolidation.teacher_email_candidate_count`, which is `0` for
  every one of the 15 unlinked employees.
- **Name candidates**: `employees` rows scored by token overlap (Jaccard) on `first_name`/`last_name`,
  threshold ≥ 0.5. Zero found for all 5. (E.g. "Beatriz Cruz" vs. employee "Danilo Cruz" scores 0.33 —
  shared surname only, different person — correctly excluded.)
- **Ownership**: `count(*)` per table filtered by the teacher's id (`adviser_id` for `sections`,
  `recorded_by` for `student_attendance`, `teacher_id` elsewhere).

## Findings summary

**No existing `employees` row is a plausible match for any of the 5 unresolved teachers — by email or
by name.** This was cross-verified two ways: my own similarity query, and the pre-built
`v_unlinked_employees_for_teacher_consolidation` view (all 15 unlinked employees show
`teacher_email_candidate_count = 0` and `teacher_user_candidate_count = 0`). The 3 STSN employees who
hold teaching positions today — Danilo Cruz, Leonora Viray, Cesar Bonifacio (all "Instructor",
Basic Education) — are distinct people from the 4 unresolved STSN teachers; they don't share an email
or a recognizable name with any of them. This looks like independently-seeded demo data (teacher-side
and employee-side demo records were never cross-referenced) rather than a name/email typo problem.

One anomaly worth flagging separately: teacher row **Beatriz Cruz** (`aeef4d4f-...`) is the one linked
via `user_id` to the login account named **"Prof. Arthur Reyes"** — i.e. the demo `TEACHER` login's
display name doesn't match the teacher row it's actually bound to. A *separate*, unlinked teacher row
literally named **Arthur Reyes** also exists with no `user_id`. This suggests the demo `user_id` bridge
may be pointing at the wrong teacher row, independent of the employee-bridge problem. Recommend
resolving this identity question before deciding what to create/link.

## Per-teacher detail

### 1. Arthur Reyes

| Field | Value |
|---|---|
| Teacher ID | `6994b75f-1c3c-4c9b-9825-b3d92b6c3d2c` |
| Name | Arthur Panganiban Reyes |
| Email | `arthur.reyes@stsn.edu.ph` |
| `user_id` | *(none)* |
| School / Campus | STSN — St. Theresa's School of Novaliches |
| Active | `true` |
| Department / Specialization | College — Information Technology & Computer Networks |
| Email candidates | none |
| Name candidates | none |
| Ownership | `class_schedules` 3 · `grade_periods` 6 · `grades` 2 · `learning_materials` 5 · `sections` (adviser) 4 · `subject_class_loads` 2 · `student_attendance` 0 · `consultation_appointments` 0 |
| **Recommended action** | **Create employee** — active teacher with a real teaching/advisory footprint and no employee counterpart. |

### 2. Beatriz Cruz — ⚠ identity anomaly

| Field | Value |
|---|---|
| Teacher ID | `aeef4d4f-b741-45c4-98fd-d478ef6cb176` |
| Name | Beatriz Soriano Cruz |
| Email | `beatriz.cruz@stsn.edu.ph` |
| `user_id` | `36a0b95e-dff8-49ad-8593-e1fcd8640f8a` → the `users` row named **"Prof. Arthur Reyes"** (`teacher@stsn.edu.ph`, role `TEACHER`) — name mismatch, see anomaly note above |
| School / Campus | STSN — St. Theresa's School of Novaliches |
| Active | `true` |
| Department / Specialization | Basic Education — General Mathematics & Statistics |
| Email candidates | none |
| Name candidates | none |
| Ownership | `class_schedules` 0 · `grade_periods` 8 · `grades` 3 · `learning_materials` 6 · `sections` (adviser) 4 · `subject_class_loads` 2 · `student_attendance` 0 · `consultation_appointments` 0 |
| **Recommended action** | **Manual review first** — confirm whether the login account "Prof. Arthur Reyes" should really resolve to this teacher row (Beatriz Cruz) or to the standalone "Arthur Reyes" teacher row (#1) before creating/linking an employee, since whichever teacher row keeps this `user_id` is the one that will drive the demo TEACHER login's Faculty Portal session. Once resolved: **create employee**. |

### 3. Carlo Vergara

| Field | Value |
|---|---|
| Teacher ID | `7ab19363-5c82-47e4-990f-6b7b145974eb` |
| Name | Carlo Dizon Vergara |
| Email | `carlo.vergara@stsn.edu.ph` |
| `user_id` | *(none)* |
| School / Campus | STSN — St. Theresa's School of Novaliches |
| Active | `true` |
| Department / Specialization | College — Business Economics & Finance |
| Email candidates | none |
| Name candidates | none |
| Ownership | `class_schedules` 0 · `grade_periods` 0 · `grades` 1 · `learning_materials` 1 · `sections` (adviser) 0 · `subject_class_loads` 0 · `student_attendance` 0 · `consultation_appointments` 0 |
| **Recommended action** | **Create employee** — light footprint but active and owns real rows (a grade + a learning material). |

### 4. Elena Soriano

| Field | Value |
|---|---|
| Teacher ID | `08606a78-703a-4be7-87c2-17dbce226c7b` |
| Name | Elena Basa Soriano |
| Email | `elena.soriano@stsn.edu.ph` |
| `user_id` | *(none)* |
| School / Campus | STSN — St. Theresa's School of Novaliches |
| Active | `true` |
| Department / Specialization | Basic Education — English Language & Literature |
| Email candidates | none |
| Name candidates | none |
| Ownership | `class_schedules` 0 · `grade_periods` 0 · `grades` 0 · `learning_materials` 2 · `sections` (adviser) 0 · `subject_class_loads` 0 · `student_attendance` 0 · `consultation_appointments` 0 |
| **Recommended action** | **Create employee** — lightest footprint of the five (2 learning materials only); worth a quick confirmation that this is still an active teaching assignment, but nothing here suggests archiving. |

### 5. Fe Domingo

| Field | Value |
|---|---|
| Teacher ID | `6850db9f-06f1-4d58-bdde-510fb80b68bc` |
| Name | Fe Lacson Domingo |
| Email | `fe.domingo@cdsta.edu.ph` |
| `user_id` | *(none)* |
| School / Campus | CDSTA — Colegio de Sta. Teresa de Avila |
| Active | `true` |
| Department / Specialization | College — Hospitality Management |
| Email candidates | none |
| Name candidates | none |
| Ownership | `class_schedules` 0 · `grade_periods` 0 · `grades` 0 · `learning_materials` 3 · `sections` (adviser) 0 · `subject_class_loads` 0 · `student_attendance` 0 · `consultation_appointments` 0 |
| **Recommended action** | **Create employee** — only unresolved teacher at CDSTA; active with real learning-material ownership. |

## Recommendation tally

- Create employee: 4 (Arthur Reyes, Carlo Vergara, Elena Soriano, Fe Domingo)
- Manual review before deciding, then likely create employee: 1 (Beatriz Cruz — identity anomaly)
- Link to existing employee: 0 — no viable candidates found for any of the 5
- Archive/exclude: 0 — all 5 are `is_active = true` with non-zero row ownership; nothing here looks like stale/deprecated demo data

---

## Draft SQL for manual review — **none of this has been run**

All statements below are templates for you to fill in and run yourself (e.g. via the Supabase SQL
editor) after you decide what to do per teacher. Placeholders are `<angle-bracket>` values.

### 1. Link a teacher row to an existing employee row

Not applicable to any of the current 5 (no candidates exist), but this is the statement to use once a
match is found or a new employee is created (see §2):

```sql
-- Review before running. Sets the bridge FK only; does not touch any other column.
update public.teachers
set employee_id = '<employee-uuid>'
where id = '<teacher-uuid>';
```

### 2. Create a missing employee row, then link it

One block per teacher, using the recommended action above. `salary` is a required, non-null column on
`employees` with no natural demo value — it's left as `0` for HR to fill in for real; adjust before
running if this project is used for anything beyond UAT demos.

```sql
-- Arthur Reyes (teacher id 6994b75f-1c3c-4c9b-9825-b3d92b6c3d2c)
with new_employee as (
  insert into public.employees
    (first_name, last_name, middle_name, email, department, position, position_title,
     school_id, salary, status, leave_balance, employment_status)
  values
    ('Arthur', 'Reyes', 'Panganiban', 'arthur.reyes@stsn.edu.ph', 'College', 'Instructor',
     'Instructor — Information Technology & Computer Networks',
     '318fe65e-c2fc-4a7d-9cd8-78d3598fa925', 0, 'Full-Time', 0, 'Active')
  returning id
)
update public.teachers
set employee_id = (select id from new_employee)
where id = '6994b75f-1c3c-4c9b-9825-b3d92b6c3d2c';

-- Carlo Vergara (teacher id 7ab19363-5c82-47e4-990f-6b7b145974eb)
with new_employee as (
  insert into public.employees
    (first_name, last_name, middle_name, email, department, position, position_title,
     school_id, salary, status, leave_balance, employment_status)
  values
    ('Carlo', 'Vergara', 'Dizon', 'carlo.vergara@stsn.edu.ph', 'College', 'Instructor',
     'Instructor — Business Economics & Finance',
     '318fe65e-c2fc-4a7d-9cd8-78d3598fa925', 0, 'Full-Time', 0, 'Active')
  returning id
)
update public.teachers
set employee_id = (select id from new_employee)
where id = '7ab19363-5c82-47e4-990f-6b7b145974eb';

-- Elena Soriano (teacher id 08606a78-703a-4be7-87c2-17dbce226c7b)
with new_employee as (
  insert into public.employees
    (first_name, last_name, middle_name, email, department, position, position_title,
     school_id, salary, status, leave_balance, employment_status)
  values
    ('Elena', 'Soriano', 'Basa', 'elena.soriano@stsn.edu.ph', 'Basic Education', 'Instructor',
     'Instructor — English Language & Literature',
     '318fe65e-c2fc-4a7d-9cd8-78d3598fa925', 0, 'Full-Time', 0, 'Active')
  returning id
)
update public.teachers
set employee_id = (select id from new_employee)
where id = '08606a78-703a-4be7-87c2-17dbce226c7b';

-- Fe Domingo (teacher id 6850db9f-06f1-4d58-bdde-510fb80b68bc)
with new_employee as (
  insert into public.employees
    (first_name, last_name, middle_name, email, department, position, position_title,
     school_id, salary, status, leave_balance, employment_status)
  values
    ('Fe', 'Domingo', 'Lacson', 'fe.domingo@cdsta.edu.ph', 'College', 'Instructor',
     'Instructor — Hospitality Management',
     '5fdaef61-5be9-4471-9479-729d317d3573', 0, 'Full-Time', 0, 'Active')
  returning id
)
update public.teachers
set employee_id = (select id from new_employee)
where id = '6850db9f-06f1-4d58-bdde-510fb80b68bc';

-- Beatriz Cruz (teacher id aeef4d4f-b741-45c4-98fd-d478ef6cb176)
-- HOLD: resolve the user_id / "Prof. Arthur Reyes" identity anomaly first (see finding above)
-- before creating/linking an employee for this teacher row.
```

### 3. Mark a teacher row as inactive/excluded

The schema already supports this — `teachers.is_active boolean` — no migration needed. Not
recommended for any of the current 5 (see tally above), but here for when it's needed:

```sql
-- Review before running. Excludes the teacher from active-teacher counts/reads that filter on
-- is_active, without deleting the row or touching class_schedules/grades/etc.
update public.teachers
set is_active = false
where id = '<teacher-uuid>';
```

## Explicitly not done

- No `insert`, `update`, or `delete` was executed against `teachers` or `employees`.
- No employee rows were created.
- No `teachers.employee_id` was set.
- No column or table was dropped.
- Phase 6 was not started.

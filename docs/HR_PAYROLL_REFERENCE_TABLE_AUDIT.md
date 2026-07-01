# STSN Connect — HR & Payroll Reference Table Audit

_Audit date: 2026-06-30 · Scope: HR + Payroll reference/maintenance data · Status: audit + migration prepared (no business logic touched)_

---

## 1. Executive Summary

STSN Connect **does not use one-table-per-lookup** for reference data. It uses a single
generic, category-keyed reference table — **`public.setup_items`** — created in
[0001_schema.sql](../supabase/migrations/0001_schema.sql) §2 and seeded in
[0003_data.sql](../supabase/migrations/0003_data.sql) /
[0004_additional_data.sql](../supabase/migrations/0004_additional_data.sql). Each lookup
list is a `category` (e.g. `departments`, `employment_types`, `civil_statuses`) with rows
carrying `code`, `name`, `description`, `is_active`, `sort_order`, and a flexible
`metadata jsonb`. This already matches the column shape requested in the task brief.

In addition, HR/Payroll has **dedicated domain tables** that double as reference data where
the lookup carries behaviour (rates, credits, brackets): `leave_types`, `benefit_plans`,
`statutory_contribution_rules`, `tax_tables` / `tax_brackets`, `shift_templates`,
`holidays`, `payroll_periods`, `onboarding_templates` / `onboarding_tasks`.

**Findings:**

- **HR reference coverage is ~90% complete.** Most candidate lookups already exist either as
  a `setup_items` category or a dedicated table. A handful of statuses/levels are still only
  TypeScript constants or DB `CHECK` enums with no editable master row.
- **Payroll reference coverage is ~95% complete.** All rate-bearing tables exist and are
  seeded. Only a few status/frequency/method lists were missing as editable reference data.
- **No new tables are warranted.** Creating per-lookup tables would *duplicate* the existing
  `setup_items` convention, which the task explicitly forbids. The correct action is to
  **seed the missing `setup_items` categories**, which the prepared migration does.
- **No business logic, CHECK constraint, FK, or payroll/attendance/leave computation was
  changed.** The new rows are additive UI/master data that mirror existing enums.

**Deliverables:**

- Audit doc: `docs/HR_PAYROLL_REFERENCE_TABLE_AUDIT.md` (this file)
- Migration: [`supabase/migrations/20260630140000_hr_payroll_reference_setup_items_seed.sql`](../supabase/migrations/20260630140000_hr_payroll_reference_setup_items_seed.sql)

---

## 2. Existing Reference Tables Found

### 2a. `setup_items` categories already seeded (HR/Payroll-relevant)

| Category | Count | Covers candidate(s) |
| --- | --- | --- |
| `departments` | 6 | departments, branches*, work_locations* |
| `position_titles` | 18 | employee_positions, job_titles |
| `faculty_ranks` | 7 | employee_levels (academic) |
| `employment_types` | 4 | employment_types, employee_categories |
| `civil_statuses` | 5 | civil_statuses |
| `nationalities` | 6 | nationalities |
| `religions` | 6 | religions |
| `document_types` | 6 | document_types, requirement_types* |
| `payment_methods` | 6 | payment_methods (cashier/collections) |
| `days_of_week` | 6 | schedule day options |
| `campuses` | 2 | branches / campuses |

<sub>* partial — see field audit for nuance.</sub>

### 2b. Dedicated HR/Payroll domain + reference tables (DO NOT duplicate)

| Table | Migration | Reference role |
| --- | --- | --- |
| `leave_types` | [0020](../supabase/migrations/0020_hr_module_expansion.sql) / seed [0025](../supabase/migrations/0025_hr_module_seed_data.sql) | Leave type master (paid flag, credits) — 10 rows seeded |
| `shift_templates` | 0020 / seed 0025 | Shift/schedule type master — 6 rows seeded |
| `holidays` | 0020 / seed 0025 | Holiday calendar — PH 2026 seeded |
| `benefit_plans` | 0020 / seed 0025 | Earning/deduction/benefit/allowance/contribution master via `category` — 10 rows |
| `statutory_contribution_rules` | 0020 / seed 0025 + [0032](../supabase/migrations/0032_statutory_contribution_rule_seed.sql) | SSS/PhilHealth/Pag-IBIG brackets |
| `tax_tables` / `tax_brackets` | 0020 / seed 0025 + [0033](../supabase/migrations/0033_withholding_tax_table_seed.sql) | BIR withholding tax tables |
| `payroll_periods` | 0020 | Pay period master |
| `onboarding_templates` / `onboarding_tasks` | 0020 / seed 0025 | Onboarding checklist master — 3 templates |

---

## 3. Missing Reference Data (added by the prepared migration)

All added as **new `setup_items` categories** (not new tables). DB enums left intact.

| New category | Why missing / current source | Seed rows |
| --- | --- | --- |
| `employment_statuses` | `EMPLOYMENT_STATUSES` TS const + `employees.employment_status` free-text (no CHECK) | 11 |
| `genders` | `Male`/`Female` CHECK on `students.gender`; no master row | 2 |
| `education_levels` | `EDUCATION_LEVEL_OPTIONS` const + CHECK on education-background tables | 7 |
| `relationship_types` | `CONTACT_TYPE_OPTIONS` const + free-text `employee_dependents.relationship` | 7 |
| `attendance_statuses` | `ATTENDANCE_STATUSES` const + `employee_attendance.status` CHECK | 9 |
| `leave_statuses` | `leave_requests.status` CHECK only | 6 |
| `holiday_types` | `holidays.holiday_type` CHECK only | 4 |
| `payroll_frequencies` | implicit (semi-monthly) in code; `tax_tables.frequency` CHECK | 4 |
| `payroll_statuses` | `payroll_runs`/`payroll_lines.status` CHECK only | 6 |
| `payout_methods` | `salary_payout_batches.payout_method` CHECK (distinct from cashier `payment_methods`) | 5 |

---

## 4. HR Field Audit

| Module | Page/File | Field | Current Source | Recommended Source | Existing? | Action Needed |
| --- | --- | --- | --- | --- | --- | --- |
| HR | EmployeeLifecyclePage.tsx | Department filter | distinct from employee rows | `setup_items:departments` | ✅ | Use existing reference table |
| HR | EmployeeLifecyclePage.tsx | Employment status filter | `EMPLOYMENT_STATUSES` const | `setup_items:employment_statuses` | ➕ now seeded | Use new category |
| HR | RecruitmentPage.tsx | Department (datalist) | distinct from employee rows | `setup_items:departments` | ✅ | Use existing reference table |
| HR | RecruitmentPage.tsx | Employment type | `["Full-Time","Part-Time","Contractual"]` literal | `setup_items:employment_types` | ✅ | Use existing reference table |
| HR | RecruitmentPage.tsx | Interview type | `applicant_interviews.interview_type` CHECK | keep enum | CHECK | Keep as enum |
| HR | RecruitmentPage.tsx | Applicant status | `job_applicants.status` CHECK | keep enum | CHECK | Keep as enum |
| HR | StaffProfileWorkspace.tsx | Employment type | free-text `AppInput` | `setup_items:employment_types` | ✅ | Use existing reference table |
| HR | StaffProfileWorkspace.tsx | Education level | `EDUCATION_LEVEL_OPTIONS` const | `setup_items:education_levels` | ➕ now seeded | Use new category |
| HR | StaffProfileWorkspace.tsx | Contact/relationship type | `CONTACT_TYPE_OPTIONS` const | `setup_items:relationship_types` | ➕ now seeded | Use new category |
| HR | StaffProfileWorkspace.tsx | License status | `LICENSE_STATUS_OPTIONS` const | keep enum (small, status-flow) | CHECK | Keep as enum (optional category later) |
| HR | employees (schema) | `position` / `position_title` | free-text columns | `setup_items:position_titles` | ✅ | Use existing reference table |
| HR | employees (schema) | `status` | CHECK FT/PT/Contractual | `setup_items:employment_types` (display) | ✅/CHECK | Keep CHECK; bind dropdown to category |
| HR | employee_documents | `document_type` | free-text | `setup_items:document_types` | ✅ | Use existing reference table |
| HR | employee_dependents | `relationship` | free-text | `setup_items:relationship_types` | ➕ now seeded | Use new category |
| HR | AttendancePage.tsx | Attendance status | `ATTENDANCE_STATUSES` const + CHECK | `setup_items:attendance_statuses` (filters) | ➕ now seeded | Use new category for filters; keep CHECK |
| HR | LeaveManagementPage.tsx | Leave type | `leave_types` table | `leave_types` | ✅ | No action needed |
| HR | LeaveManagementPage.tsx | Leave status | `leave_requests.status` CHECK | `setup_items:leave_statuses` (filters) | ➕ now seeded | Use new category for filters; keep CHECK |
| HR | ShiftManagementPage.tsx | Shift template | `shift_templates` table | `shift_templates` | ✅ | No action needed |
| HR | OnboardingPage.tsx | Onboarding template/task | `onboarding_templates`/`_tasks` | same | ✅ | No action needed |
| HR | OnboardingPage.tsx | Task status | `employee_onboarding_tasks.status` CHECK | keep enum | CHECK | Keep as enum |
| HR | (profile, future) | Gender | `students.gender` CHECK; not on employees | `setup_items:genders` | ➕ now seeded | Use new category |
| HR | (profile) | Civil status | free-text `students.civil_status` | `setup_items:civil_statuses` | ✅ | Use existing reference table |
| HR | (profile) | Nationality / Religion | free-text | `setup_items:nationalities` / `religions` | ✅ | Use existing reference table |
| HR | (profile) | Blood type | not captured | — | ❌ | Confirm with business before adding |
| HR | (n/a) | Disciplinary action type | no field, no table | — | ❌ | Confirm with business (feature not built) |

---

## 5. Payroll Field Audit

| Module | Page/File | Field | Current Source | Recommended Source | Existing? | Action Needed |
| --- | --- | --- | --- | --- | --- | --- |
| Payroll | PayrollManagementPage.tsx | Pay period | `payroll_periods` table | same | ✅ | No action needed |
| Payroll | PayrollManagementPage.tsx | Payroll run status | `payroll_runs.status` CHECK | `setup_items:payroll_statuses` (filters) | ➕ now seeded | Use new category for filters; keep CHECK |
| Payroll | PayrollManagementPage.tsx | Frequency | implicit semi-monthly in `payrollCalculations.ts` | `setup_items:payroll_frequencies` | ➕ now seeded | Use new category (display/setup) |
| Payroll | payroll_lines (schema) | Earnings/deductions columns | fixed numeric columns | keep (computation) | n/a | Keep — do not refactor |
| Payroll | BenefitsPage.tsx | Benefit/allowance/deduction plan | `benefit_plans` (+ `category`) | `benefit_plans` | ✅ | No action — already reference table |
| Payroll | BenefitsPage.tsx | Benefit category | `benefit_plans.category` CHECK | keep enum | CHECK | Keep as enum |
| Payroll | TaxesPage.tsx | Tax table / brackets | `tax_tables` / `tax_brackets` | same | ✅ | No action needed |
| Payroll | TaxesPage.tsx | Employee tax code/status | free-text `employee_tax_profiles.tax_code` (`'ME'`) | possible `setup_items:tax_statuses` | ❌ | Confirm with business (TRAIN removed exemption codes) |
| Payroll | SalaryPayoutsPage.tsx | Payout method | `salary_payout_batches.payout_method` CHECK | `setup_items:payout_methods` | ➕ now seeded | Use new category; keep CHECK |
| Payroll | SalaryPayoutsPage.tsx | Payout/batch status | `salary_payout_batches.status` CHECK | keep enum (or reuse `payroll_statuses`) | CHECK | Keep as enum |
| Payroll | payroll_adjustments (schema) | Adjustment type | `Addition`/`Deduction` CHECK | keep enum | CHECK | Keep as enum |
| Payroll | statutory (schema) | SSS/PhilHealth/Pag-IBIG | `statutory_contribution_rules` | same | ✅ | No action needed |
| Payroll | (n/a) | Loan types / banks | no loan or bank-master feature | — | ❌ | Defer — confirm with business |

---

## 6. Recommended Supabase Migration Plan

**One migration, seed-only, idempotent:**
[`20260630140000_hr_payroll_reference_setup_items_seed.sql`](../supabase/migrations/20260630140000_hr_payroll_reference_setup_items_seed.sql)

- Adds the 10 missing `setup_items` categories from §3.
- Pattern: `insert into public.setup_items (...) values (...) on conflict (category, code) do nothing` — exactly mirrors the existing seed style and the `unique (category, code)` constraint.
- **No** `create table`, `alter table`, `drop`, `truncate`, FK, or CHECK changes.
- **No** RLS block needed — `setup_items` already has policies (0002_rls.sql).

**Why no new tables:** the brief's requested column shape (`code`, `name`, `description`,
`is_active`, `sort_order`, timestamps) is already provided by `setup_items`. Creating
parallel tables would violate "do not create duplicate reference tables."

---

## 7. Recommended Seed Data Plan

Seeded by the migration (generic, demo/UAT-safe):

- **HR:** employment_statuses (Applicant → Inactive, 11), genders (2), education_levels (7),
  relationship_types (7), attendance_statuses (9), leave_statuses (6), holiday_types (4).
- **Payroll:** payroll_frequencies (Monthly/Semi-Monthly/Weekly/Daily), payroll_statuses
  (Draft → Cancelled, 6), payout_methods (Bank/Cash/Check/GCash/Maya, 5).

Already seeded elsewhere (no re-seed): leave_types, benefit_plans, statutory rules, tax
tables, shift_templates, holidays, onboarding templates, departments, position_titles,
employment_types, civil_statuses, nationalities, religions, document_types, payment_methods.

---

## 8. Tables That Should NOT Be Created (already exist / would duplicate)

`employment_types`, `departments`, `employee_positions`/`job_titles` (→ `position_titles`),
`civil_statuses`, `nationalities`, `religions`, `document_types`, `payment_methods`,
`employee_levels` (→ `faculty_ranks`), `branches`/`campuses`/`work_locations` (→ `campuses`/`schools`),
`leave_types`, `shift_types`/`schedules` (→ `shift_templates`), `holidays`, `payroll_periods`,
`earning_types`/`deduction_types`/`benefit_types`/`allowance_types`/`contribution_types`/`pay_types`/`salary_types` (→ `benefit_plans` + `category`),
`tax_types` (→ `tax_tables`), `bank_accounts` (use `payout_methods` + free-text ref no.),
`onboarding_statuses`/`clearance_statuses`/`adjustment_types`/`overtime_types`/`night_differential_types`/`holiday_pay_types`/`payslip_statuses`/`payroll_run_statuses` (DB CHECK enums — keep).

---

## 9. Fields That Should Remain Free-Text / Static Enum

- **Free-text (intentional):** names, addresses, emails, contacts, remarks/notes, reasons,
  `resume_url`, `file_url`, `birthplace`, salary numerics, `run_no`/`requisition_no`/`payout_no`.
- **Keep as DB CHECK enum (tied to logic/workflow, low churn):** `employees.status`
  (FT/PT/Contractual), all `*.status` workflow columns (payroll, leave, onboarding,
  applicant, document, time-adjustment), `benefit_plans.category`,
  `payroll_adjustments.adjustment_type`, `interview_type`, `holidays.holiday_type`,
  `employee_attendance.status`. The newly seeded mirror categories are for **dropdown/filter
  display**, not for replacing these constraints.

---

## 10. Risk Notes

- **Low risk.** Migration is insert-only with `on conflict do nothing`; safe to re-run and
  reversible by deleting the seeded rows by `legacy_id`/`category`.
- **No FKs added.** Binding columns (e.g. `employees.department`) to `setup_items` via FK is
  **deferred** — existing data is free-text and may not match `code`/`name` exactly. If
  desired later, do a data-cleansing pass first, then add nullable FK by `name`. Documented
  here rather than applied.
- **Enum vs. reference drift:** the mirror categories (attendance/leave/payroll/holiday
  statuses & types) duplicate DB CHECK values. If a CHECK value changes in a future
  migration, update the matching `setup_items` rows too.
- **UI wiring is follow-up work (not in this migration):** the constants in
  `payrollCalculations.ts` / `StaffProfileWorkspace.tsx` / `RecruitmentPage.tsx` still drive
  the dropdowns. Repointing them to `setup_items` is a separate, optional refactor.

---

## 11. Final Recommendation

1. **Apply** `20260630140000_hr_payroll_reference_setup_items_seed.sql` — it only fills
   genuine gaps and follows the project convention.
2. **Do not** create per-lookup tables — `setup_items` is the standard.
3. **Treat UI repointing as separate work** — wire HR/Payroll dropdowns to the new
   categories incrementally; no rush, no logic change.
4. **Confirm with business** before adding: `blood_types`, `tax_statuses`/`tax_types`,
   `loan_types`/`banks`, `disciplinary_action_types`, `employee_categories`/`employee_levels`
   (beyond faculty ranks) — these have no current field/feature.

---

## 12. Checklist Before Implementation

- [ ] Confirm `setup_items` is the intended home for these lookups (vs. dedicated tables).
- [ ] Confirm the 4 "confirm-with-business" categories in §11.4 are out of scope for now.
- [ ] Run `npm run lint` (`tsc --noEmit`) — migration is SQL-only, should not affect TS build.
- [ ] Apply migration on a staging/UAT DB and verify `select category, count(*) from setup_items group by category` shows the 10 new categories.
- [ ] Verify no duplicate `(category, code)` errors (constraint + `on conflict do nothing` guarantee this).
- [ ] Spot-check HR/Payroll pages still load (no schema change, so no regression expected).
- [ ] Schedule follow-up ticket for optional UI repointing (constants → `setup_items`).

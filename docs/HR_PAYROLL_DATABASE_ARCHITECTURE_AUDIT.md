# STSN Connect HR/Payroll Database Architecture Audit

Audit date: 2026-06-30

## 1. Executive Summary

STSN Connect already has a substantial HR/Payroll schema. The current architecture is not missing a wholesale HR module; instead, it contains:

- A legacy core: `employees` and `payroll`
- A newer HR/Payroll workflow layer added in `0020_hr_module_expansion.sql`
- Additive employee profile tables added in `20260630133000_faculty_employee_profile_schema.sql`
- A generic reference-data pattern centered on `public.setup_items`
- A centralized approval engine added in `0034_approval_workflow_engine.sql`

The main architecture issue is not “missing everything.” It is that the app currently uses a mix of:

- correct new tables
- older legacy tables kept for compatibility
- free-text employee fields
- hardcoded UI dropdowns/constants
- partial approval-engine integration

The safest direction is:

1. Keep `employees` as the current employee master record.
2. Keep the newer HR/payroll workflow tables; do not replace them.
3. Treat `teachers` as the current faculty core record, but add stronger linkage to `employees` later instead of creating a duplicate `faculty_profiles` table now.
4. Continue using `setup_items` for editable reference/master data rather than creating one-table-per-lookup duplicates.
5. Align pages and services to existing tables before introducing new tables.

No new table is confirmed as required right now. No table should be dropped. No payroll formula/statutory logic should be changed as part of this audit.

## 2. Current Database Structure Found

### 2.1 Core employee/faculty structure

- `employees` from `0001_schema.sql`, extended by `0020_hr_module_expansion.sql`
- `teachers` remains the current faculty master table
- `employee_profile_contacts`
- `employee_education_backgrounds`
- `employee_license_certifications`
- `employee_documents`
- `employee_lifecycle_events`
- `employee_dependents`

### 2.2 HR operations structure

- `shift_templates`
- `employee_shift_assignments`
- `employee_time_logs`
- `employee_time_adjustments`
- `employee_attendance`
- `attendance_corrections`
- `holidays`
- `leave_types`
- `leave_credits`
- `leave_requests`
- `job_requisitions`
- `job_applicants`
- `applicant_interviews`
- `onboarding_templates`
- `onboarding_tasks`
- `employee_onboarding_tasks`

### 2.3 Payroll structure

- Legacy: `payroll`
- New workflow:
  - `payroll_periods`
  - `payroll_runs`
  - `payroll_lines`
  - `payroll_adjustments`
  - `salary_payout_batches`
  - `salary_payout_lines`
- Setup/config:
  - `benefit_plans`
  - `statutory_contribution_rules`
  - `tax_tables`
  - `tax_brackets`
  - `employee_tax_profiles`
  - `employee_benefits`
  - `payroll_benefit_lines`

### 2.4 Approval/accounting/cashiering integration around HR/Payroll

- Approval engine:
  - `approval_requests`
  - `approval_steps`
  - `approval_actions`
  - `approval_comments`
  - `approval_attachments`
  - `approval_sla_rules`
  - `approval_delegations`
  - `workflow_step_configs`
- Accounting base already exists:
  - `chart_of_accounts`
  - `cost_centers`
  - `journal_entries`
  - `journal_entry_lines`
- Cashiering/accounting student-payment tables exist, but payroll-specific accounting/voucher linkage is not yet modeled.

## 3. Existing HR Tables

### Stable and already useful

| Table | Purpose | Status |
| --- | --- | --- |
| `employees` | Current employee master record | Keep |
| `employee_lifecycle_events` | Lifecycle/status history | Keep |
| `employee_documents` | Employee requirement/document records | Keep |
| `shift_templates` | Shift master data | Keep |
| `employee_shift_assignments` | Employee-to-shift mapping | Keep |
| `employee_time_logs` | Raw time log entries | Keep |
| `employee_attendance` | Attendance summary rows | Keep |
| `leave_types` | Leave type master data | Keep |
| `leave_credits` | Yearly leave balances | Keep |
| `leave_requests` | Leave workflow rows | Keep |
| `job_requisitions` | Hiring requisitions | Keep |
| `job_applicants` | Applicant records | Keep |
| `applicant_interviews` | Interview tracking | Keep |
| `onboarding_templates` | Checklist templates | Keep |
| `onboarding_tasks` | Template tasks | Keep |
| `employee_onboarding_tasks` | Per-employee onboarding checklist | Keep |

### Existing but underused or not yet surfaced well

| Table | Current gap |
| --- | --- |
| `employee_dependents` | Overlaps with `employee_profile_contacts`; no active UI usage found |
| `employee_time_adjustments` | Table exists but no clear app usage found |
| `attendance_corrections` | Table exists but no clear app usage found |
| `employee_documents` | Loaded in `dataLoader`, but no employee document create/upload workflow found |
| `leave_credits` | Table exists, but main pages focus on requests; credits are not the center of the UI yet |

## 4. Existing Payroll Tables

### Stable and already useful

| Table | Purpose | Status |
| --- | --- | --- |
| `payroll_periods` | Payroll cut-off master | Keep |
| `payroll_runs` | Payroll run header | Keep |
| `payroll_lines` | Per-employee payroll result | Keep |
| `salary_payout_batches` | Batch release records | Keep |
| `salary_payout_lines` | Per-employee payout line | Keep |
| `benefit_plans` | Payroll earning/deduction/statutory setup | Keep |
| `statutory_contribution_rules` | Effective-dated statutory rules | Keep |
| `tax_tables` | Tax table header | Keep |
| `tax_brackets` | Tax brackets | Keep |

### Existing but overlapping or transitional

| Table | Finding |
| --- | --- |
| `payroll` | Legacy flat payroll ledger still used by UI and dashboards alongside new payroll workflow tables |
| `payroll_adjustments` | Exists, but no active page usage found |
| `employee_benefits` | Exists, but no active page usage found |
| `payroll_benefit_lines` | Exists, but no active page usage found |
| `employee_tax_profiles` | Exists, but no active UI usage found |

## 5. Existing Faculty/Employee Profile Tables

| Table | Finding |
| --- | --- |
| `teachers` | Current faculty master table |
| `employees` | Current employee/payroll master table |
| `employee_profile_contacts` | Good additive profile table |
| `employee_education_backgrounds` | Good additive profile table |
| `employee_license_certifications` | Good additive profile table |

Important relationship finding:

- There is no direct FK bridge between `teachers` and `employees`.
- The UI currently links faculty and employee records by matching email in [`src/features/hr/pages/sub-pages/NewEmployeeProfilePage.tsx`](/abs/path/C:/Users/VELOSO/Documents/GitHub/stsn-connect/src/features/hr/pages/sub-pages/NewEmployeeProfilePage.tsx:68).
- This is functional for demo/UAT, but not a strong architecture for long-term faculty/HR/payroll alignment.

## 6. Existing Reference/Setup Tables

### Primary reference pattern

STSN Connect uses `public.setup_items` as the main generic master/reference table. This is the established convention and should not be duplicated with many new lookup tables.

Already seeded HR/Payroll-relevant `setup_items` categories include:

- `departments`
- `position_titles`
- `employment_types`
- `faculty_ranks`
- `civil_statuses`
- `nationalities`
- `religions`
- `document_types`
- `payment_methods`
- `days_of_week`

### Dedicated reference/config tables that should stay dedicated

- `leave_types`
- `shift_templates`
- `holidays`
- `benefit_plans`
- `statutory_contribution_rules`
- `tax_tables`
- `tax_brackets`
- `onboarding_templates`
- `onboarding_tasks`

## 7. Existing Seed Data Found

Key seeds found:

- `0003_data.sql`: large `setup_items` seed, users, employees, teachers, accounting/cashiering base data
- `0004_additional_data.sql`: additional setup and fee-related support
- `0025_hr_module_seed_data.sql`:
  - `leave_types`
  - `shift_templates`
  - `benefit_plans`
  - `statutory_contribution_rules`
  - `tax_tables`
  - `tax_brackets`
  - `onboarding_templates`
  - `onboarding_tasks`
  - `holidays`
- `0026_hr_demo_data_optional.sql`:
  - employee lifecycle demo data
  - leave credits/requests
  - attendance
  - payroll periods/runs/lines
  - salary payouts
  - recruitment
  - tax profiles
  - onboarding tasks
- `0029_payroll_role_users.sql`: payroll role and payroll users
- `0032_statutory_contribution_rule_seed.sql`: starter statutory overlap seed
- `0033_withholding_tax_table_seed.sql`: 2026 starter tax table seed
- `20260630140000_hr_payroll_reference_setup_items_seed.sql`: additive reference-category seed for HR/Payroll dropdowns

## 8. Existing RLS Policies Found

Findings:

- Base table RLS starts in `0002_rls.sql`.
- New HR/Payroll table RLS is added in `0024_hr_module_rls.sql`.
- New employee profile tables add their own RLS in `20260630133000_faculty_employee_profile_schema.sql`.
- Approval workflow tables add RLS in `0034_approval_workflow_engine.sql`.

Current convention:

- Almost all RLS policies are permissive development policies.
- Most allow full CRUD for both `anon` and `authenticated` with `using (true)` and `with check (true)`.

Assessment:

- This is consistent with the current project convention.
- This is not production-grade least-privilege RLS.
- The immediate issue is not “missing RLS” but “overly broad dev-mode RLS.”

## 9. Existing Indexes Found

Well-covered areas:

- `employees.employee_no`
- `employee_*` FK-heavy workflow tables mostly have basic FK indexes
- `payroll_periods`, `payroll_runs`, `payroll_lines`
- `salary_payout_batches`, `salary_payout_lines`
- `statutory_contribution_rules`
- `tax_brackets`
- `job_requisitions`, `job_applicants`
- `onboarding_tasks`, `employee_onboarding_tasks`
- approval workflow tables have strong operational indexes

Confirmed gaps:

- `attendance_corrections` has no index on `attendance_id` or `employee_id`
- `payroll_adjustments` has no index on `payroll_line_id` or `employee_id`
- `payroll_benefit_lines` has no index on `payroll_line_id` or `benefit_plan_id`

These are safe candidates for a later additive index migration.

## 10. Existing Foreign Key Relationships

### Good existing relationships

- `employees.school_id -> schools.id`
- `employees.user_id -> users.id`
- `employees.supervisor_id -> employees.id`
- profile tables -> `employees.id`
- attendance/time/leave tables -> `employees.id`
- `leave_requests.leave_type_id -> leave_types.id`
- `payroll_runs.payroll_period_id -> payroll_periods.id`
- `payroll_lines.payroll_run_id -> payroll_runs.id`
- `payroll_lines.employee_id -> employees.id`
- payout tables -> payroll run/line/employee
- statutory/tax tables -> benefit plan / tax table parents
- recruitment/onboarding tables -> expected parents

### Missing or weak relationships

- No explicit `teachers` <-> `employees` link
- `employee.department`, `position`, `position_title`, `employment_status` remain free-text, not FK-backed
- `employee_documents.document_type` is free-text, not linked to `setup_items`
- no payroll-to-accounting journal mapping table
- no payroll-to-voucher/cash disbursement linkage table
- approval linkage is logical by `entity_id`; leave/payroll submission flows are not consistently creating approval rows

## 11. Existing Enum / Check Constraint Patterns

Current design intentionally uses many `text + check (...)` fields for workflows and stable coded states.

This is acceptable for:

- leave request statuses
- attendance statuses
- payroll run/line statuses
- payout statuses/methods
- benefit plan categories
- interview types/results
- onboarding task statuses

This should stay in place. The better improvement is to align UI dropdowns and filters to seeded reference rows where helpful, not remove the DB checks.

## 12. Duplicate / Overlapping Table Risks

### Confirmed overlaps

| Overlap | Risk | Recommendation |
| --- | --- | --- |
| `payroll` vs `payroll_periods`/`payroll_runs`/`payroll_lines` | Dual payroll sources in UI and data loader | Treat `payroll` as legacy/compatibility only; align pages to new workflow tables |
| `teachers` vs `employees` for faculty | One real person may exist in both tables with only email-based linkage | Add a formal bridge later; do not create duplicate faculty profile tables now |
| `employee_dependents` vs `employee_profile_contacts` | Two places for dependent/emergency-contact-like data | Standardize future UI on `employee_profile_contacts`; do not create another contact table |
| `holidays` table vs `setup_items` `holidays` category | Two holiday concepts | Keep `holidays` table as operational source; treat `setup_items` holiday rows as general reference/history only |
| `payment_methods` vs `payment_methods_cashier` vs payroll `payout_methods` | Similar concepts, different domains | Keep domain separation explicit in UI and docs |
| `faculty_ranks` vs `position_titles` | Related but not identical concepts | Keep both; use rank for faculty, title for job/employee record |

### Seed/config overlaps

- `0025_hr_module_seed_data.sql` and `0032_statutory_contribution_rule_seed.sql` overlap by intent.
- `0025_hr_module_seed_data.sql` and `0033_withholding_tax_table_seed.sql` both seed payroll tax config, but for different year/frequency combinations.

These are not destructive, but they are easy to misread during maintenance.

## 13. Existing Page-to-Table Usage Audit

| Module | Page/File | Current Tables Used | Expected Tables | Issue Found | Recommended Action | Priority |
| --- | --- | --- | --- | --- | --- | --- |
| Employee profile | `src/features/hr/pages/sub-pages/NewEmployeeProfilePage.tsx` | `employees`, `teachers` | `employees`, `teachers`, employee profile tables | teacher link is email-based only | keep page, add formal faculty-employee link later | Medium |
| Employee/faculty profile workspace | `src/features/profiles/components/StaffProfileWorkspace.tsx` | `employees`, `teachers`, `employee_profile_contacts`, `employee_education_backgrounds`, `employee_license_certifications`, `employee_documents` | same + reference tables for dropdowns | several inputs still free-text/static arrays | align fields to `setup_items` categories | Medium |
| HR setup / employee lifecycle | `src/features/hr/pages/sub-pages/EmployeeLifecyclePage.tsx` | `employees`, `employee_lifecycle_events` | same + `setup_items` categories | status filter uses TS constant; department filter derives from employee rows | use seeded references for filters | Medium |
| Attendance | `src/features/hr/pages/sub-pages/AttendancePage.tsx` | `employee_attendance`, `employees` | same + `setup_items.attendance_statuses` | status list is hardcoded TS constant | keep table usage, switch dropdown/filter source later | Low |
| Time & attendance | `src/features/hr/pages/sub-pages/TimeManagementPage.tsx` | `employee_time_logs`, `employees` | same | log source list is static array | acceptable now; optional reference later | Low |
| Leave management | `src/features/hr/pages/sub-pages/LeaveManagementPage.tsx` | `leave_requests`, `leave_types`, `employees` | same + approval engine | leave status filter is hardcoded; submission is not creating approval request rows | align filter to reference rows; integrate submission to approval engine | High |
| Shift management | `src/features/hr/pages/sub-pages/ShiftManagementPage.tsx` | `shift_templates`, `employee_shift_assignments`, `employees` | same | rest days are static list, but acceptable | no schema change; optional `setup_items.days_of_week` wiring later | Low |
| Recruitment | `src/features/hr/pages/sub-pages/RecruitmentPage.tsx` | `job_requisitions`, `job_applicants`, `applicant_interviews`, `employees` | same + references | department source derived from current employees; employment type is hardcoded | use reference data for dropdowns | Medium |
| Onboarding | `src/features/hr/pages/sub-pages/OnboardingPage.tsx` | `employees`, `employee_onboarding_tasks`, `onboarding_templates`, `onboarding_tasks` | same | generally aligned | no DB change needed | Low |
| Benefits | `src/features/hr/pages/sub-pages/BenefitsPage.tsx` | `benefit_plans`, `statutory_contribution_rules` | same | aligned | no change | Low |
| Taxes | `src/features/hr/pages/sub-pages/TaxesPage.tsx` | `tax_tables`, `tax_brackets` | same | aligned | no change | Low |
| Payroll management | `src/features/hr/pages/sub-pages/PayrollManagementPage.tsx` | `employees`, legacy `payroll`, `payroll_periods`, `payroll_runs`, `payroll_lines`, `salary_payout_*`, `benefit_plans`, `statutory_contribution_rules`, `tax_tables`, `setup_items.position_titles` | new payroll workflow tables | page mixes legacy and new payroll models; employee registration uses hardcoded departments/employment types | phase out legacy `payroll` usage in this page; bind dropdowns to existing references | High |
| Salary payouts | `src/features/hr/pages/sub-pages/SalaryPayoutsPage.tsx` | `salary_payout_lines`, `salary_payout_batches`, `payroll_lines`, `employees` | same | mostly aligned | no DB change needed | Low |
| Payroll dashboard | `src/features/payroll/pages/PayrollDashboardPage.tsx` | `employees`, `payroll_periods`, `payroll_runs`, `payroll_lines`, `salary_payout_*` | same | generally aligned; department allocation still depends on free-text employee department | keep page; normalize employee department source later | Low |
| HR dashboard | `src/features/hr/pages/sub-pages/HRDashboardPage.tsx` | `employees`, legacy `payroll`, `leave_requests`, `employee_time_logs`, `employee_attendance`, `shift_templates`, `employee_shift_assignments`, `benefit_plans`, `payroll_periods` | mostly new workflow tables | still counts legacy `payroll` alongside new payroll period metrics | move dashboard KPIs fully to new payroll workflow | Medium |

## 14. Field-Level Audit

| Module | Page/File | Field Name | Current Source | Recommended Source | Existing Table? | Action Needed |
| --- | --- | --- | --- | --- | --- | --- |
| Employee profile | `StaffProfileWorkspace.tsx` | Department | free-text input | `setup_items.departments` | Yes | Use existing reference table |
| Employee profile | `StaffProfileWorkspace.tsx` | Position / Position Title | free-text input | `setup_items.position_titles` | Yes | Use existing reference table |
| Employee profile | `StaffProfileWorkspace.tsx` | Employment Status | free-text input | `setup_items.employment_statuses` | Yes, via seed migration | Use existing reference table |
| Employee profile | `StaffProfileWorkspace.tsx` | Employment Type | free-text input | `setup_items.employment_types` | Yes | Use existing reference table |
| Employee profile | `StaffProfileWorkspace.tsx` | Education Level | static array | `setup_items.education_levels` | Yes, via seed migration | Use existing reference table |
| Employee profile | `StaffProfileWorkspace.tsx` | Contact Type | static array | `setup_items.relationship_types` | Yes, via seed migration | Use existing reference table |
| Employee profile | `StaffProfileWorkspace.tsx` | License Status | static array | DB enum/check is acceptable | N/A | Keep as static/check-backed for now |
| Employee profile | `StaffProfileWorkspace.tsx` | Name, address, specialization, notes | free-text input | free-text | N/A | Keep as free-text |
| Lifecycle | `EmployeeLifecyclePage.tsx` | Employment status filter | TypeScript constant | `setup_items.employment_statuses` | Yes | Use existing reference table |
| Lifecycle | `EmployeeLifecyclePage.tsx` | Department filter | distinct values from `employees` | `setup_items.departments` | Yes | Use existing reference table |
| Attendance | `AttendancePage.tsx` | Attendance status | TypeScript constant | `setup_items.attendance_statuses` for UI, DB check for storage | Yes | Use existing reference table |
| Attendance | `AttendancePage.tsx` | Remarks | free-text input | free-text | N/A | Keep as free-text |
| Leave | `LeaveManagementPage.tsx` | Leave type | `leave_types` table | `leave_types` | Yes | No action needed |
| Leave | `LeaveManagementPage.tsx` | Leave status filter | hardcoded dropdown | `setup_items.leave_statuses` | Yes, via seed migration | Use existing reference table |
| Leave | `LeaveManagementPage.tsx` | Reason | free-text input | free-text | N/A | Keep as free-text |
| Time logs | `TimeManagementPage.tsx` | Log source | static array | keep static/check-backed unless business wants admin-managed values | N/A | No action needed now |
| Shift | `ShiftManagementPage.tsx` | Rest days | static array | `setup_items.days_of_week` optional | Yes | Optional alignment only |
| Recruitment | `RecruitmentPage.tsx` | Department | datalist derived from employee rows | `setup_items.departments` | Yes | Use existing reference table |
| Recruitment | `RecruitmentPage.tsx` | Employment type | hardcoded dropdown | `setup_items.employment_types` | Yes | Use existing reference table |
| Recruitment | `RecruitmentPage.tsx` | Position title | free-text input | free-text or `position_titles` depending business process | Yes | Confirm with business user |
| Recruitment | `RecruitmentPage.tsx` | Reason / notes | free-text input | free-text | N/A | Keep as free-text |
| Payroll management | `PayrollManagementPage.tsx` | Position title | `setup_items.position_titles` | same | Yes | No action needed |
| Payroll management | `PayrollManagementPage.tsx` | Department | hardcoded dropdown | `setup_items.departments` | Yes | Use existing reference table |
| Payroll management | `PayrollManagementPage.tsx` | Contract status | hardcoded dropdown | `setup_items.employment_types` | Yes | Use existing reference table |
| Payroll management | `PayrollManagementPage.tsx` | Salary | employee field | employee salary or future salary-detail table | Yes | Keep current source now |
| Payroll management | `PayrollManagementPage.tsx` | Payslip preview data | legacy `payroll` rows | `payroll_runs` + `payroll_lines` | Yes | Align page to new payroll workflow |
| Salary payouts | `SalaryPayoutsPage.tsx` | Payout method/status | payout batch/line tables | same + optional `setup_items.payout_methods` for UI labels | Yes | No DB action needed |
| Taxes | `TaxesPage.tsx` | Tax tables and brackets | `tax_tables` / `tax_brackets` | same | Yes | No action needed |
| Benefits | `BenefitsPage.tsx` | Benefit plans/rules | `benefit_plans` / `statutory_contribution_rules` | same | Yes | No action needed |

## 15. Missing Tables, If Any

### Not confirmed as required now

No new HR/Payroll table is confirmed as required for the current pages to function.

### Candidate future tables or structures, but defer

| Candidate | Why defer |
| --- | --- |
| `employee_government_ids` | current system can still operate with document/tax fields; business rules not yet modeled |
| `employee_bank_accounts` | payout method exists, but there is no confirmed bank-account workflow yet |
| formal `faculty_employee_link` or bridge table | needed, but better than inventing a full duplicate `faculty_profiles` structure now |
| `employee_salary_details` / `employee_payroll_profiles` | useful later, but current payroll still computes from `employees.salary` |
| `payslips` / `payslip_items` | current app renders payslip-like output from payroll rows/lines; schema not yet mandatory |
| `payroll_accounting_mappings` | payroll-accounting posting is not yet implemented end-to-end |

## 16. Missing Seed Data, If Any

Confirmed/additive seed gaps are already addressed by the existing untracked migration:

- `supabase/migrations/20260630140000_hr_payroll_reference_setup_items_seed.sql`

That file adds missing editable reference categories such as:

- `employment_statuses`
- `education_levels`
- `relationship_types`
- `attendance_statuses`
- `leave_statuses`
- `holiday_types`
- `payroll_frequencies`
- `payroll_statuses`
- `payout_methods`

No additional seed-only migration was created in this audit.

## 17. Missing Indexes, If Any

Confirmed missing indexes:

- `attendance_corrections (attendance_id)`
- `attendance_corrections (employee_id)`
- `payroll_adjustments (payroll_line_id)`
- `payroll_adjustments (employee_id)`
- `payroll_benefit_lines (payroll_line_id)`
- `payroll_benefit_lines (benefit_plan_id)`

These are safe to add later with `create index if not exists`.

## 18. Missing or Inconsistent RLS Policies

No HR/Payroll table inspected is completely missing RLS.

The real issue is consistency and strictness:

- policy naming conventions vary between older and newer migrations
- all current policies are dev-permissive
- employee document storage policies are not present the way student document storage is

Recommendation:

- do not change RLS now unless auth/role rollout is being done in the same phase
- document current RLS as development-only

## 19. Architecture Questions Answered

1. **What is the current HR database structure?**
   `employees` is the current employee core, extended by lifecycle, attendance, leave, recruitment, onboarding, and additive employee-profile tables.

2. **What is the current Payroll database structure?**
   There is a legacy `payroll` table plus a newer workflow model: `payroll_periods`, `payroll_runs`, `payroll_lines`, `salary_payout_batches`, `salary_payout_lines`, with `benefit_plans`, `statutory_contribution_rules`, `tax_tables`, and `tax_brackets` as setup/config.

3. **Are the employee/faculty profile tables properly connected to HR and Payroll?**
   Employee profile tables are properly connected to `employees`. Faculty linkage is weak because `teachers` and `employees` are only connected by UI email matching, not by FK.

4. **Are the reference tables already complete?**
   Mostly yes. The model is largely complete when `setup_items` and the dedicated HR/payroll config tables are considered together. Some UI lookup categories were still missing but are already covered by the existing `20260630140000...` seed migration.

5. **Are there duplicate reference tables or overlapping concepts?**
   Yes, but mostly manageable overlaps: legacy `payroll` vs new payroll tables, `employee_dependents` vs `employee_profile_contacts`, `holidays` table vs `setup_items.holidays`, cashier/payment method categories vs payroll payout methods.

6. **Are any fields still using hardcoded dropdowns instead of reference tables?**
   Yes. Employment status, attendance status, leave status, recruitment employment type, payroll registration department/contract status, education level, contact type, and some department filters.

7. **Are any fields using free-text where a reference table is better?**
   Yes. Employee department, position/position title, employment status, employee document type, recruitment department, and some profile-form employment fields.

8. **Are any fields correctly using free-text and should remain as free-text?**
   Yes. Names, addresses, contact numbers, remarks, reasons, notes, specialization, document titles, and narrative comments.

9. **Are the current pages already using the correct tables?**
   Some are. Benefits, Taxes, Shift Management, Onboarding, Salary Payouts, and most of Payroll Dashboard are aligned. Payroll Management, HR Dashboard, Leave approval integration, and profile/reference-field usage are only partially aligned.

10. **Which pages need to be aligned with the existing database structure?**
    `PayrollManagementPage.tsx`, `HRDashboardPage.tsx`, `LeaveManagementPage.tsx`, `EmployeeLifecyclePage.tsx`, `RecruitmentPage.tsx`, `StaffProfileWorkspace.tsx`.

11. **Which pages are safe and do not need changes?**
    `BenefitsPage.tsx`, `TaxesPage.tsx`, `ShiftManagementPage.tsx`, `OnboardingPage.tsx`, `SalaryPayoutsPage.tsx`, and most of `PayrollDashboardPage.tsx`.

12. **Which database gaps should be fixed now?**
    Reference seed gaps already covered by `20260630140000_hr_payroll_reference_setup_items_seed.sql`. No new table creation is confirmed. Optional missing indexes are safe but can wait until after page alignment approval.

13. **Which database improvements should be deferred?**
    Faculty-employee bridging, employee bank/government-id normalization, payslip tables, payroll-accounting mappings, stricter RLS, and broader payroll accounting/voucher integration.

14. **Is the current architecture good enough for enrollment, hiring, payroll, accounting, cashiering, vouchers, discounts, and approvals?**
    Good enough for enrollment, discounts, accounting/cashiering demos, and general HR/payroll UAT. Not yet ideal for production-grade payroll accounting integration, faculty-employee identity linkage, or strict approval/RLS governance.

15. **What is the safest next implementation sequence?**
    First align pages to existing tables and seeded references, then strengthen approval integration, then add optional non-destructive indexes, then tackle deeper structural improvements only after business confirmation.

## 20. Recommended Database Architecture

### Keep as current core

- `employees`
- `teachers`
- `employee_profile_contacts`
- `employee_education_backgrounds`
- `employee_license_certifications`
- `employee_documents`
- `employee_lifecycle_events`
- `employee_attendance`
- `leave_requests`
- `leave_types`
- `shift_templates`
- `employee_shift_assignments`
- `payroll_periods`
- `payroll_runs`
- `payroll_lines`
- `salary_payout_batches`
- `salary_payout_lines`
- `benefit_plans`
- `statutory_contribution_rules`
- `tax_tables`
- `tax_brackets`

### Use existing generic references instead of new duplicate tables

- `setup_items.departments`
- `setup_items.position_titles`
- `setup_items.employment_types`
- `setup_items.civil_statuses`
- `setup_items.nationalities`
- `setup_items.religions`
- `setup_items.document_types`
- seeded HR/payroll categories from `20260630140000_hr_payroll_reference_setup_items_seed.sql`

### Recommended structural rule

- Do not create `faculty_profiles` right now.
- Do not create `employee_profiles` right now.
- Treat additive profile tables around `employees` as the current employee profile design.
- Add a formal faculty/employee bridge later if one person must participate in faculty, HR, and payroll flows.

## 21. Recommended Frontend/Backend Alignment Plan

### Fix now

1. Align `PayrollManagementPage.tsx` to the new payroll workflow tables and reduce dependence on legacy `payroll`.
2. Align `HRDashboardPage.tsx` payroll KPIs to `payroll_runs`/`payroll_lines` instead of legacy `payroll`.
3. Replace hardcoded HR/payroll dropdowns with existing `setup_items` categories where already seeded.
4. Integrate leave-request submission into the approval engine at creation/submission time, not only at approval/rejection time.
5. Integrate payroll-run submission/approval into the approval engine consistently.

### Defer

1. Bank/government-ID normalization
2. Payslip table decomposition
3. Payroll-accounting posting tables
4. Strict role-based RLS
5. faculty/employee bridge migration until identity rules are approved

## 22. Safe Implementation Sequence

1. Apply or review the existing reference seed migration `20260630140000_hr_payroll_reference_setup_items_seed.sql`.
2. Align UI dropdowns and filters to existing `setup_items` categories and dedicated master tables.
3. Update Payroll Management and HR Dashboard to consistently use the new payroll workflow tables.
4. Wire leave and payroll approval submission to `approval_requests`/`approval_steps`.
5. Add the small missing indexes if performance or query volume justifies it.
6. Only then evaluate deeper structural additions such as faculty-employee bridging or payroll-accounting mappings.

## 23. Migration Recommendation

No new migration was created by this audit.

Reason:

- No confirmed new table is required right now.
- Confirmed reference-data gaps are already covered by the existing untracked file `supabase/migrations/20260630140000_hr_payroll_reference_setup_items_seed.sql`.
- Confirmed index gaps are real, but safe to defer until page/service alignment is approved.

If a later migration is approved, the highest-confidence items are:

| Migration Item | Reason | Table | Type | Risk Level | Notes |
| --- | --- | --- | --- | --- | --- |
| Missing FK indexes | Improve query performance on existing workflow tables | `attendance_corrections` | Index | Low | additive only |
| Missing FK indexes | Improve query performance on existing workflow tables | `payroll_adjustments` | Index | Low | additive only |
| Missing FK indexes | Improve query performance on existing workflow tables | `payroll_benefit_lines` | Index | Low | additive only |

## 24. Files That Should Be Updated Later

- [src/features/hr/pages/sub-pages/PayrollManagementPage.tsx](/abs/path/C:/Users/VELOSO/Documents/GitHub/stsn-connect/src/features/hr/pages/sub-pages/PayrollManagementPage.tsx:1)
- [src/features/hr/pages/sub-pages/HRDashboardPage.tsx](/abs/path/C:/Users/VELOSO/Documents/GitHub/stsn-connect/src/features/hr/pages/sub-pages/HRDashboardPage.tsx:1)
- [src/features/hr/pages/sub-pages/LeaveManagementPage.tsx](/abs/path/C:/Users/VELOSO/Documents/GitHub/stsn-connect/src/features/hr/pages/sub-pages/LeaveManagementPage.tsx:1)
- [src/features/hr/pages/sub-pages/EmployeeLifecyclePage.tsx](/abs/path/C:/Users/VELOSO/Documents/GitHub/stsn-connect/src/features/hr/pages/sub-pages/EmployeeLifecyclePage.tsx:1)
- [src/features/hr/pages/sub-pages/RecruitmentPage.tsx](/abs/path/C:/Users/VELOSO/Documents/GitHub/stsn-connect/src/features/hr/pages/sub-pages/RecruitmentPage.tsx:1)
- [src/features/profiles/components/StaffProfileWorkspace.tsx](/abs/path/C:/Users/VELOSO/Documents/GitHub/stsn-connect/src/features/profiles/components/StaffProfileWorkspace.tsx:1)
- [src/services/store.ts](/abs/path/C:/Users/VELOSO/Documents/GitHub/stsn-connect/src/services/store.ts:469)
- [src/services/dataLoader.ts](/abs/path/C:/Users/VELOSO/Documents/GitHub/stsn-connect/src/services/dataLoader.ts:376)
- [src/features/hr/utils/payrollCalculations.ts](/abs/path/C:/Users/VELOSO/Documents/GitHub/stsn-connect/src/features/hr/utils/payrollCalculations.ts:139)

## 25. Files That Should Not Be Touched Right Now

- [supabase/migrations/0001_schema.sql](/abs/path/C:/Users/VELOSO/Documents/GitHub/stsn-connect/supabase/migrations/0001_schema.sql:1)
- [supabase/migrations/0020_hr_module_expansion.sql](/abs/path/C:/Users/VELOSO/Documents/GitHub/stsn-connect/supabase/migrations/0020_hr_module_expansion.sql:1)
- [supabase/migrations/0024_hr_module_rls.sql](/abs/path/C:/Users/VELOSO/Documents/GitHub/stsn-connect/supabase/migrations/0024_hr_module_rls.sql:1)
- [supabase/migrations/0025_hr_module_seed_data.sql](/abs/path/C:/Users/VELOSO/Documents/GitHub/stsn-connect/supabase/migrations/0025_hr_module_seed_data.sql:1)
- [supabase/migrations/0034_approval_workflow_engine.sql](/abs/path/C:/Users/VELOSO/Documents/GitHub/stsn-connect/supabase/migrations/0034_approval_workflow_engine.sql:1)
- [supabase/migrations/20260630133000_faculty_employee_profile_schema.sql](/abs/path/C:/Users/VELOSO/Documents/GitHub/stsn-connect/supabase/migrations/20260630133000_faculty_employee_profile_schema.sql:1)
- [supabase/migrations/20260630140000_hr_payroll_reference_setup_items_seed.sql](/abs/path/C:/Users/VELOSO/Documents/GitHub/stsn-connect/supabase/migrations/20260630140000_hr_payroll_reference_setup_items_seed.sql:1)

## 26. Risks and Assumptions

- This audit assumes the project is still in a dev/UAT-oriented stage because RLS remains fully permissive.
- The existing untracked reference audit and seed migration were treated as user-owned work and not modified.
- No DB runtime inspection was performed against a live Supabase instance; findings are from the repository migrations and app code.
- `teachers` may represent faculty identity sufficiently for now, but long-term payroll/faculty reporting will need a formal bridge if the same person must exist in both academic and HR contexts.

## 27. Final Checklist

- [x] Reviewed prioritized migrations
- [x] Reviewed related HR/payroll/accounting/approval migrations
- [x] Reviewed HR/payroll page usage
- [x] Reviewed data-loading and store usage
- [x] Identified overlapping/duplicate concepts
- [x] Identified hardcoded dropdowns and free-text fields
- [x] Identified current RLS and index posture
- [x] Produced architecture audit document
- [x] Avoided destructive schema changes
- [x] Did not create duplicate tables
- [x] Did not create a new migration without confirmed need

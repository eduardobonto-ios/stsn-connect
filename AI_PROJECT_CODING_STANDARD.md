# STSN Connect — AI Coding Practice, Path Standards, and Production Migration Rules

## Purpose

Use this file as the permanent coding standard for **STSN Connect / Theresian Connect** when asking Codex, Claude, or any AI coding agent to modify the project.

The goal is to make every AI command follow the same architecture, file paths, naming conventions, Supabase migration approach, and UI/UX standards. This prevents random file creation, duplicated modules, broken navigation, inconsistent database changes, and excessive unrelated edits.

---

## Recommended instruction to paste at the top of every Codex/Claude prompt

```text
Before making any changes, read and follow AI_PROJECT_CODING_STANDARD.md from the project root.
Use the existing STSN Connect architecture and file paths only.
Do not create random folders, random service patterns, or unrelated new components.
Do not modify anything outside the requested scope.
For database changes, create new Supabase migration files under supabase/migrations only. Do not edit old applied migrations unless explicitly instructed.
For production seed data, insert reference/setup data only. Do not insert fake employees, salaries, payroll runs, attendance logs, or payout records into production migrations.
After changes, run npm run lint and npm run build if available, then summarize changed files and validation result.
```

Use the shorter version below when credits are limited:

```text
Follow AI_PROJECT_CODING_STANDARD.md. Use existing paths/patterns only. Scope changes strictly to this request. Add DB changes only through new supabase/migrations files. Production seed data = reference/setup data only, no fake transactional records. Run npm run lint/build and summarize changed files.
```

---

## Current project architecture

STSN Connect is currently a React + TypeScript + Vite app using Supabase as the backend data source.

Important existing locations:

| Area | Standard path |
|---|---|
| App entry/routes | `src/App.tsx` |
| Feature pages | `src/features/<module>/pages/` |
| Shared UI components | `src/components/common/` |
| Navigation/menu config | `src/config/navigation.config.ts` |
| Role/module permissions | `src/config/permissions.config.ts` |
| Role labels/descriptions | `src/config/roles.config.ts` |
| School/academic-unit config | `src/config/schools.config.ts` |
| Main UI/domain types | `src/types/index.ts` |
| Supabase DB type map | `src/types/database.types.ts` |
| Supabase client | `src/lib/supabase.ts` |
| Supabase read/load mapper | `src/services/dataLoader.ts` |
| Supabase write helpers | `src/services/supabaseCrud.ts` |
| Zustand app store/actions | `src/services/store.ts` |
| Database migrations | `supabase/migrations/` |
| Project reference docs | Root `*.md` files |

Do not introduce a new architecture unless explicitly requested.

---

## File placement standards

### 1. Feature pages

All module screens must live under:

```text
src/features/<module>/pages/<ModuleName>Page.tsx
```

Examples:

```text
src/features/hr/pages/HRManagementPage.tsx
src/features/accounting/pages/AccountingModulePage.tsx
src/features/registrar/pages/RegistrarModulePage.tsx
src/features/cashier/pages/CashierModulePage.tsx
```

For HR expansion, keep the parent module as:

```text
src/features/hr/pages/HRManagementPage.tsx
```

If the page becomes too large, split internal HR sections into:

```text
src/features/hr/components/
src/features/hr/utils/
src/features/hr/types.ts
```

Only create these folders when the page is already too large or repeated logic exists.

Do not create a separate top-level feature folder for every HR sub-feature unless the user explicitly requests it.

Correct:

```text
src/features/hr/components/EmployeeDirectoryPanel.tsx
src/features/hr/components/PayrollRunsPanel.tsx
src/features/hr/components/LeaveManagementPanel.tsx
src/features/hr/utils/payrollCalculations.ts
```

Avoid:

```text
src/features/payroll/
src/features/attendance/
src/features/leave/
src/features/recruitment/
```

The HR menu may show sub-pages, but they should remain under the HR parent feature unless the module is intentionally separated.

---

### 2. Shared components

Use existing shared components first:

```text
src/components/common/STSNDataTable.tsx
src/components/common/AppConfirmDialog.tsx
src/components/common/AppPromptDialog.tsx
src/components/common/AppToast.tsx
src/components/common/DialogProvider.tsx
src/components/common/PageHeader.tsx
src/components/common/StatCard.tsx
src/components/common/useAppDialog.tsx
```

Rules:

- Use `STSNDataTable` for searchable/sortable/paginated data tables.
- Use `useAppDialog`, `AppConfirmDialog`, `AppPromptDialog`, and `AppToast` for prompts/toasts.
- Do not use native `alert`, `confirm`, or `prompt`.
- Do not create a second reusable datatable unless explicitly requested.
- Do not duplicate dialog/toast systems.

---

### 3. Config files

Use config files for static catalogs, role/module mapping, and navigation labels.

| Need | Update path |
|---|---|
| Add a module enum | `src/config/permissions.config.ts` |
| Grant module access to a role | `src/config/permissions.config.ts` |
| Add sidebar/menu item | `src/config/navigation.config.ts` |
| Add role label/description | `src/config/roles.config.ts` |
| Add academic-unit behavior | `src/config/schools.config.ts` or module-specific config |

Important rule:

**Role permissions and academic-unit behavior are separate.**

Role controls access. Academic unit controls workflow labels, grading scheme, sections, or school-specific behavior inside the module.

Do not hide a module only because the user is Basic Ed or College. Hide modules based on role permissions only.

---

## TypeScript and data model standards

### 1. UI/domain types

Update UI-facing types in:

```text
src/types/index.ts
```

Examples:

```ts
export interface Employee { ... }
export interface PayrollRow { ... }
```

For HR expansion, add new UI/domain types here or in `src/features/hr/types.ts` if the types are HR-only and numerous.

Recommended HR domain types:

```ts
EmployeeLifecycleRecord
EmployeeAttendanceRecord
EmployeeShiftAssignment
EmployeeLeaveRequest
PayrollPeriod
PayrollRun
PayrollRunLine
SalaryPayoutBatch
SalaryPayoutLine
EmployeeBenefitEnrollment
EmployeeTaxProfile
RecruitmentRequest
ApplicantCandidate
OnboardingTask
```

### 2. Supabase database types

When adding new tables, update:

```text
src/types/database.types.ts
```

Use Supabase snake_case column names in DB types:

```ts
export interface PayrollPeriodsRow {
  id: string;
  school_id: string | null;
  period_code: string;
  period_start: string;
  period_end: string;
  status: string;
  created_at: string;
  updated_at: string;
}
```

Then register the table inside:

```ts
export interface Database {
  public: {
    Tables: {
      payroll_periods: { Row: PayrollPeriodsRow; Insert: PayrollPeriodsInsert; Update: PayrollPeriodsUpdate };
    };
  };
}
```

### 3. camelCase vs snake_case

The UI uses camelCase. Supabase tables use snake_case.

Use existing helpers from:

```text
src/services/supabaseCrud.ts
```

Important helpers:

```ts
toCamel()
toSnake()
dbInsert()
dbUpdate()
dbDelete()
dbDeleteWhere()
dbSelectAll()
```

Do not manually mix snake_case fields into React state unless the component is directly handling Supabase rows.

---

## Store and data loading standards

### 1. Read/load pattern

All Supabase reads that initialize the app should be added to:

```text
src/services/dataLoader.ts
```

Standard pattern:

1. Select from Supabase.
2. Join `schools(code)` when school scoping is needed.
3. Convert DB rows into UI/domain types.
4. Return them as part of `LoadedData`.
5. Initialize them in `src/services/store.ts`.

Example pattern:

```ts
const { data: payrollPeriodRows } = await supabase
  .from("payroll_periods")
  .select("*, schools(code)");

const payrollPeriods: PayrollPeriod[] = (payrollPeriodRows ?? []).map((p: any) => ({
  id: p.id,
  schoolId: p.schools?.code,
  periodCode: p.period_code,
  periodStart: p.period_start,
  periodEnd: p.period_end,
  status: p.status,
}));
```

### 2. Write/action pattern

All client-side state mutations should be handled in:

```text
src/services/store.ts
```

Standard write flow:

1. Create/update local Zustand state first for responsive UX.
2. Persist to Supabase using `dbInsert`, `dbUpdate`, or `dbDelete`.
3. Use `newId()` for client-generated UUID records.
4. Use school mapping helpers when needed.
5. Do not write directly from many components if the action is shared business logic.

Existing HR actions are currently:

```ts
addEmployee()
updateEmployee()
addPayrollRow()
markPaidPayroll()
processGlobalPayroll()
bulkImportEmployees()
```

For production HR/payroll expansion, avoid keeping all payroll logic inside `processGlobalPayroll()`.

Preferred production flow:

```text
Payroll Periods → Payroll Runs → Payroll Run Lines → Salary Payout Batches → Payslips
```

---

## Supabase migration standards

### 1. Migration path

All database changes must be added under:

```text
supabase/migrations/
```

Never create SQL files in random folders for production DB changes.

### 2. File naming

Use sequential numbering after the latest migration.

Current latest known migration in this project:

```text
0019_relax_payment_setup_constraints.sql
```

For HR expansion, use:

```text
0020_hr_module_expansion.sql
0021_hr_module_rls.sql
0022_hr_module_seed_data.sql
0023_hr_demo_data_optional.sql
```

If those numbers already exist, continue with the next available number.

### 3. Do not edit old migrations

Production approach:

- Do not edit old applied migrations.
- Add a new migration for schema changes.
- Add a new migration for RLS policies.
- Add a new migration for reference seed data.
- Add optional demo data separately and make it safe to skip.

Only edit old migrations if the project is still local-only and the user explicitly says to rewrite migration history.

### 4. Migration structure

Use this structure:

```sql
-- ============================================================================
-- STSN Connect — <Module / Feature Name>
-- ============================================================================
-- Purpose:
-- - Explain what this migration adds.
-- - Mention affected modules and tables.
-- ============================================================================

-- 1. Tables
create table if not exists public.example_table (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  school_id uuid references public.schools(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Indexes
create index if not exists idx_example_table_school on public.example_table (school_id);

-- 3. Constraints / unique keys
alter table public.example_table
  add constraint example_table_code_unique unique (school_id, code);

-- 4. Comments if helpful
comment on table public.example_table is 'Purpose of table.';
```

### 5. Production seed data rules

Production seed data should be reference/setup data only.

Allowed in production seed migrations:

```text
leave types
shift templates
benefit plan definitions
statutory contribution categories
tax bracket definitions
payroll earning/deduction type catalog
onboarding task templates
HR module permissions/setup items
employment status catalog
regular department/position catalogs
```

Not allowed in production seed migrations:

```text
fake employee records
fake salaries
fake attendance logs
fake leave requests
fake payroll runs
fake payout batches
fake payslips
fake bank account details
fake tax profile records with personal data
```

If demo data is needed, create a separate optional file:

```text
0023_hr_demo_data_optional.sql
```

Add a comment at the top:

```sql
-- OPTIONAL DEMO DATA ONLY.
-- Do not run this migration in production unless explicitly approved.
```

### 6. Upsert seed style

Use idempotent seed scripts.

Preferred:

```sql
insert into public.setup_items
  (legacy_id, category, code, name, description, is_active, sort_order, metadata, created_by, created_at)
values
  ('hr-leave-type-vacation', 'hr_leave_types', 'VACATION', 'Vacation Leave', 'Paid vacation leave', true, 1, '{}'::jsonb, 'System', now())
on conflict (category, code) do update
set
  name = excluded.name,
  description = excluded.description,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order,
  metadata = excluded.metadata,
  updated_at = now();
```

Avoid plain inserts that will fail on the second run.

---

## RLS standards

Every new table must have RLS considered.

For production, do not blindly use permissive policies unless the current project phase explicitly requires it.

Minimum required steps:

```sql
alter table public.<table_name> enable row level security;
```

Then add policies in a separate migration such as:

```text
0021_hr_module_rls.sql
```

Recommended policy design by data sensitivity:

| Data | Suggested access |
|---|---|
| HR reference catalogs | Readable by authenticated users; write by HR/Admin only |
| Employee profile | HR/Admin full access; employee self-read if login mapping exists |
| Attendance/leave | HR/Admin full access; employee self-read; supervisor workflow if supported |
| Payroll/payslip | HR/Admin full access; employee self-read only own payslip |
| Tax/bank fields | Highly restricted; avoid exposing unless absolutely needed |

If current auth claims do not yet support strict policies, document the limitation clearly in the migration comments and keep follow-up work listed.

---

## HR module implementation standards

### 1. Parent module

Keep the existing parent module:

```text
HR_MANAGEMENT
```

Do not create separate top-level modules for every HR sub-feature unless specifically approved.

### 2. Recommended HR sub-sections

Inside `HRManagementPage.tsx`, organize the module into internal tabs/cards:

```text
Dashboard
Employee Directory
Employee Life Cycle
Time Management
Shift Management
Attendance
Leave Management
Payroll Management
Salary Payouts
Taxes
Benefits
Recruitment
Onboarding
Reports
```

### 3. Navigation config

Update HR sidebar children in:

```text
src/config/navigation.config.ts
```

Example:

```ts
{
  id: "HR_MANAGEMENT",
  label: "HR",
  icon: Users,
  desc: "Human resources management",
  children: [
    { id: "hr-dashboard", label: "Dashboard", icon: LayoutDashboard, desc: "HR overview", targetModule: "HR_MANAGEMENT" },
    { id: "hr-employees", label: "Employee Directory", icon: Users, desc: "Employee records", targetModule: "HR_MANAGEMENT" },
    { id: "hr-attendance", label: "Attendance", icon: CalendarDays, desc: "Daily time records", targetModule: "HR_MANAGEMENT" },
    { id: "hr-leaves", label: "Leave Management", icon: FileCheck, desc: "Leave requests and balances", targetModule: "HR_MANAGEMENT" },
    { id: "hr-payroll", label: "Payroll", icon: Banknote, desc: "Payroll periods and runs", targetModule: "HR_MANAGEMENT" },
  ],
}
```

### 4. Payroll production refactor

The existing HR payroll behavior is basic and should be refactored when implementing the full HR module.

Current pattern to improve:

```text
processGlobalPayroll()
- hardcoded period
- directly creates payroll rows for all employees
- direct mark as paid behavior
```

Preferred production workflow:

```text
1. Create payroll period
2. Open payroll run for selected period and school
3. Generate payroll run lines from employee compensation, attendance, leave, deductions, and benefits
4. Review exceptions
5. Approve payroll run
6. Create salary payout batch
7. Mark payout lines as released/failed/cancelled
8. Generate payslips
9. Lock payroll run from accidental edits
```

### 5. Payroll tables should separate master data from transactions

Recommended table groups:

```text
employee_profiles / employees extension
employee_lifecycle_records
employee_shift_assignments
employee_attendance_records
employee_leave_types
employee_leave_balances
employee_leave_requests
payroll_periods
payroll_runs
payroll_run_lines
payroll_earning_types
payroll_deduction_types
salary_payout_batches
salary_payout_lines
employee_benefit_enrollments
employee_tax_profiles
recruitment_requests
recruitment_candidates
onboarding_templates
onboarding_tasks
```

---

## UI/UX standards

### 1. Enterprise dashboard pattern

Avoid too many dashboard tiles. Prefer one clean row of primary KPIs, then use charts/tables for details.

Recommended per module:

```text
4 to 5 KPI cards maximum per row
1 primary work queue table
1 recent activity/alerts panel
1 report/export area if needed
```

### 2. Data tables

Use `STSNDataTable` for tabular data.

Standards:

- Use clear column labels.
- Add pagination for long tables.
- Avoid blinking/auto-refresh unless explicitly requested.
- Avoid native browser prompts.
- Place margins/padding inside cards so tables do not touch edges.

### 3. Dialogs and prompts

Use modern prompts only:

```text
src/components/common/useAppDialog.tsx
src/components/common/AppConfirmDialog.tsx
src/components/common/AppPromptDialog.tsx
src/components/common/AppToast.tsx
```

No native:

```ts
alert()
confirm()
prompt()
```

### 4. Styling

Follow existing project styling conventions:

- Tailwind-style utility classes where the project already uses them.
- Existing card/panel patterns from Accounting, Registrar, Cashier, and HR pages.
- Avoid importing new UI frameworks.
- Avoid large unrelated redesigns unless requested.

---

## Access control standards

### 1. Module access

Module access is controlled in:

```text
src/config/permissions.config.ts
```

For HR, current standard role access is:

```ts
hr: ["DASHBOARD", "HR_MANAGEMENT", "NURSE_CLINIC"]
```

Modify only if the user requests expanded or reduced HR access.

### 2. Navigation visibility

Menu visibility is resolved in:

```text
src/config/navigation.config.ts
```

Do not manually hardcode sidebar visibility in page components.

### 3. Sensitive HR/payroll data

Payroll, tax, benefits, and employee profile data are sensitive.

Rules:

- Only HR/Admin/Super Admin should manage payroll.
- Employee self-service access should be read-only and limited to the employee's own records.
- Do not expose tax/bank fields in broad tables.
- Do not add demo personal financial data to production seed migrations.

---

## Coding style standards

### 1. React

Use functional components and hooks.

Preferred:

```tsx
export default function HRManagementPage() {
  const { employees } = useSTSNStore();
  return <div>...</div>;
}
```

Avoid class components.

### 2. TypeScript

Rules:

- Prefer explicit interfaces for domain records.
- Avoid `any` unless mapping dynamic Supabase rows.
- Keep type names business-readable.
- Avoid duplicating the same type in multiple files.
- Keep UI types camelCase.
- Keep DB row types snake_case.

### 3. Business logic

Complex calculations should not stay inside JSX.

For payroll calculations, use:

```text
src/features/hr/utils/payrollCalculations.ts
```

Example functions:

```ts
calculateGrossPay()
calculateStatutoryDeductions()
calculateTaxableIncome()
calculateNetPay()
```

### 4. Error handling

Use app dialogs/toasts for user-facing errors.

Use console logging only for developer diagnostics or existing Supabase helper behavior.

### 5. Scope control

Every AI change must follow this rule:

```text
Do only the requested modification. Do not refactor unrelated modules. Do not redesign pages that were not mentioned.
```

---

## Validation checklist before considering a change complete

Ask Codex/Claude to verify the following:

```text
npm run lint
npm run build
```

Then provide:

```text
1. Files changed
2. Summary of changes
3. Migration files created
4. Any known limitation
5. Validation result
```

For Supabase migration work, also ask the AI to check:

```text
- Migration file numbering is correct
- Migration uses create table if not exists where appropriate
- Indexes are included for foreign keys and lookup fields
- Seed data is idempotent
- RLS is enabled or explicitly documented
- No fake transactional production data was inserted
```

---

## Standard Claude/Codex prompt template

Use this template for future implementation prompts:

```text
You are working on STSN Connect / Theresian Connect.

First, read and follow AI_PROJECT_CODING_STANDARD.md from the project root.

Task:
<describe the requested change here>

Scope rules:
- Do not modify anything outside this task.
- Use existing project architecture and paths only.
- Use existing shared components where possible.
- Do not create duplicate datatable/dialog/store systems.
- For database changes, create new migration files under supabase/migrations.
- Production seed data must be reference/setup data only.
- Do not insert fake employees, salaries, payroll, attendance, payout, tax, or bank data into production migrations.

Expected output:
- Implement the requested change.
- Run npm run lint and npm run build.
- Provide changed files, summary, migration names, and validation results.
```

---

## HR-specific Claude/Codex prompt template

```text
You are working on STSN Connect / Theresian Connect.

First, read and follow AI_PROJECT_CODING_STANDARD.md from the project root.

Task:
Implement the requested HR module update using the existing HR parent module `HR_MANAGEMENT`.

Required standards:
- Keep HR screens under `src/features/hr/`.
- Update HR menu children in `src/config/navigation.config.ts` only if navigation is required.
- Update role/module access in `src/config/permissions.config.ts` only if access rules are part of the task.
- Update UI/domain types in `src/types/index.ts` or `src/features/hr/types.ts`.
- Update Supabase DB types in `src/types/database.types.ts` for new tables.
- Update data loading in `src/services/dataLoader.ts`.
- Update shared state/actions in `src/services/store.ts`.
- Use `STSNDataTable` and app dialog/toast components.
- Refactor payroll toward Payroll Periods → Payroll Runs → Payroll Lines → Salary Payouts → Payslips when payroll is in scope.
- Add DB changes only through new `supabase/migrations` files.
- Production seed data should include only HR reference/setup data.

Do not insert fake employees, fake salaries, fake attendance, fake leave requests, fake payroll runs, fake payout lines, or fake payslips in production migrations.

After implementing, run npm run lint and npm run build, then summarize changed files and validation result.
```

---

## Recommended root files to keep

Keep these project reference docs in the project root so Codex/Claude can use them:

```text
AI_PROJECT_CODING_STANDARD.md
HR_MODULE_IMPLEMENTATION_GUIDE.md
ACCOUNTING_ENTERPRISE_UX_REFERENCE.md
ACCOUNTING_IMPLEMENTATION_PHASE_PLAN.md
CASHIER_BOOKS_ASSESSMENT_PHASE_PLAN.md
REGISTRAR_ENTERPRISE_UX_PLAN.md
STSN_DATATABLES_DIALOG_MODERNIZATION_PLAN.md
FEATURE_IMPLEMENTATION_AUDIT.md
```

When a new major module plan is created, save it as an `.md` file in the root as well.

---

## Final rule

When in doubt, follow the existing project pattern first. Add only what is needed, place it in the correct path, protect production data, and keep the change scope small.

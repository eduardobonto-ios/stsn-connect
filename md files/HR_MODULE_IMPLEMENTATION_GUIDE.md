# STSN Connect — HR Module Implementation Guide

## Purpose

This document defines how to expand the existing **HR / Payroll** area of STSN Connect into a complete **WELA HR-style module set** while still following the current project structure, role permissions, Supabase data layer, shared UI components, and enterprise School ERP workflow.

Requested HR modules:

1. Employee Life Cycles
2. Time Management
3. Shift Management
4. Attendance
5. Leave Management
6. Payroll Management
7. Salary Payouts
8. Taxes
9. Benefits
10. Recruitment
11. Onboarding

---

## Current Project Findings

Based on the current `stsn-connect.zip`, HR already exists but is still concentrated in one page:

```text
src/features/hr/pages/HRManagementPage.tsx
```

Current HR functionality already includes:

- Employee directory
- Employee registration modal
- CSV employee import
- Employee profile summary
- Basic payroll ledger
- Payslip preview
- `Process Global Payroll` action
- Mark payroll row as paid

Current supporting files already involved:

```text
src/config/navigation.config.ts
src/config/permissions.config.ts
src/config/roles.config.ts
src/services/store.ts
src/services/dataLoader.ts
src/types/index.ts
src/types/database.types.ts
supabase/migrations/0001_schema.sql
supabase/migrations/0002_rls.sql
supabase/migrations/0003_data.sql
src/components/common/STSNDataTable.tsx
src/components/common/useAppDialog.tsx
src/components/ModalPreviews.tsx
```

Current database tables already available:

```text
public.employees
public.payroll
```

Current HR access already exists:

```ts
hr: ["DASHBOARD", "HR_MANAGEMENT", "NURSE_CLINIC"]
```

So we do **not** need to create HR from zero. We should **expand the existing HR module** and refactor it into HR sub-pages.

---

## Main Recommendation

Use one parent module:

```text
HR_MANAGEMENT
```

Then add HR sub-pages inside the HR module instead of creating many new top-level modules.

Recommended HR page structure:

```text
src/features/hr/
  pages/
    HRManagementPage.tsx
    sub-pages/
      HRDashboardPage.tsx
      EmployeeLifecyclePage.tsx
      TimeManagementPage.tsx
      ShiftManagementPage.tsx
      AttendancePage.tsx
      LeaveManagementPage.tsx
      PayrollManagementPage.tsx
      SalaryPayoutsPage.tsx
      TaxesPage.tsx
      BenefitsPage.tsx
      RecruitmentPage.tsx
      OnboardingPage.tsx
      HRReportsPage.tsx
  components/
    EmployeeProfilePanel.tsx
    EmployeeFormModal.tsx
    PayrollRunModal.tsx
    PayslipDrawer.tsx
    AttendanceCorrectionModal.tsx
    LeaveRequestModal.tsx
    RecruitmentApplicantModal.tsx
    OnboardingChecklistModal.tsx
  utils/
    payrollCalculations.ts
    attendanceCalculations.ts
    leaveCalculations.ts
  config/
    hr.config.ts
```

This keeps the application cleaner and avoids bloating `App.tsx` and `permissions.config.ts` with too many HR-only modules.

---

## Navigation Plan

### Current Navigation

Current HR navigation only has:

```ts
{
  id: "HR_MANAGEMENT",
  label: "HR",
  icon: Users,
  desc: "Human resources management",
  children: [
    {
      id: "hr-staff-payroll",
      label: "HR Staff Payroll",
      icon: Users,
      desc: "Employee payslips database",
      targetModule: "HR_MANAGEMENT"
    }
  ]
}
```

### Recommended Navigation

Update HR children to:

```ts
{
  id: "HR_MANAGEMENT",
  label: "HR",
  icon: Users,
  desc: "Human resources management",
  children: [
    { id: "hr-dashboard", label: "Dashboard", icon: LayoutDashboard, desc: "HR KPIs & alerts" },
    { id: "employee-life-cycles", label: "Employee Life Cycles", icon: Users, desc: "Employee records & movements" },
    { id: "time-management", label: "Time Management", icon: Clock, desc: "Time logs & daily work hours" },
    { id: "shift-management", label: "Shift Management", icon: CalendarDays, desc: "Shift templates & assignments" },
    { id: "attendance", label: "Attendance", icon: ClipboardList, desc: "Employee attendance monitoring" },
    { id: "leave-management", label: "Leave Management", icon: FileCheck, desc: "Leave filing & approvals" },
    { id: "payroll-management", label: "Payroll Management", icon: Banknote, desc: "Payroll runs & payslips" },
    { id: "salary-payouts", label: "Salary Payouts", icon: Wallet, desc: "Payment batches & release status" },
    { id: "taxes", label: "Taxes", icon: Percent, desc: "Withholding tax setup & reports" },
    { id: "benefits", label: "Benefits", icon: Award, desc: "Employee benefits & contributions" },
    { id: "recruitment", label: "Recruitment", icon: Briefcase, desc: "Job openings & applicants" },
    { id: "onboarding", label: "Onboarding", icon: UserCheck, desc: "New hire checklist" }
  ]
}
```

### App State Change Needed

Currently, `App.tsx` already has sub-page state for Accounting, Core Setup, and Student Portal. Add the same pattern for HR:

```ts
const [hrSubPage, setHrSubPage] = useState("hr-dashboard");
```

Then pass it to HR:

```tsx
{activeModule === "HR_MANAGEMENT" &&
  allowedModules.includes("HR_MANAGEMENT") && (
    <HRManagement subPage={hrSubPage} onSubPageChange={setHrSubPage} />
  )}
```

Update sidebar child click handling so HR children set `hrSubPage` when the parent is `HR_MANAGEMENT`.

---

## Module-by-Module Application Guide

### 1. Employee Life Cycles

Purpose:
Manage the complete employee journey from hiring to separation.

Current coverage:
Partial. The current `employees` table stores basic employee information and contract status.

Recommended additions:

- Employee number
- User account link
- Employment status
- Hire date
- Regularization date
- Separation date
- Separation reason
- Supervisor / department head
- Employee movement history
- Document checklist

Recommended database additions:

```text
employee_lifecycle_events
employee_documents
employee_dependents
employee_emergency_contacts
```

Recommended statuses:

```text
Applicant
For Onboarding
Probationary
Active
Regular
On Leave
Suspended
Resigned
Terminated
Retired
Inactive
```

Important note:
Keep `status` or rename it conceptually as **contract status**. Do not use the existing `status` field for both contract type and employment life-cycle status. Add a separate field such as `employment_status`.

---

### 2. Time Management

Purpose:
Track daily work hours, late minutes, undertime, overtime, and corrections.

Current coverage:
Not implemented yet.

Recommended additions:

```text
employee_time_logs
employee_time_adjustments
```

Recommended features:

- Clock in / clock out
- Manual time correction request
- Late / undertime calculation
- Overtime request
- Daily time record view
- Time log approval workflow

Payroll dependency:
Payroll should eventually read approved time logs before computing pay.

---

### 3. Shift Management

Purpose:
Define expected working schedules for each employee.

Current coverage:
Not implemented yet.

Recommended additions:

```text
shift_templates
employee_shift_assignments
```

Recommended features:

- Morning shift
- Mid shift
- Night shift
- Part-time schedule
- Faculty teaching/non-teaching schedule linkage
- Effective date range
- Rest day assignment

Payroll dependency:
Attendance and payroll should compare actual time logs against assigned shifts.

---

### 4. Attendance

Purpose:
Monitor employee attendance by date and calculate present, absent, late, undertime, leave, holiday, and rest day statuses.

Current coverage:
There is a student attendance table, but employee attendance is not yet implemented.

Recommended additions:

```text
employee_attendance
attendance_corrections
holidays
```

Recommended statuses:

```text
Present
Late
Undertime
Absent
On Leave
Official Business
Holiday
Rest Day
Half Day
```

Important note:
Do not reuse student attendance for HR attendance. Employee attendance should be separate.

---

### 5. Leave Management

Purpose:
Allow employees to file, approve, and track leaves.

Current coverage:
Partial only. Current employee record has `leaveBalance`, but there is no leave request workflow.

Recommended additions:

```text
leave_types
leave_requests
leave_credits
leave_approvals
```

Recommended leave types:

```text
Vacation Leave
Sick Leave
Emergency Leave
Maternity Leave
Paternity Leave
Bereavement Leave
Study Leave
Leave Without Pay
Official Business
```

Recommended workflow:

```text
Draft → Submitted → For Approval → Approved / Rejected / Cancelled
```

Payroll dependency:
Approved paid leave should not reduce payroll. Leave without pay should reduce payroll.

---

### 6. Payroll Management

Purpose:
Generate payroll accurately from salary, attendance, leave, benefits, tax, and deductions.

Current coverage:
Implemented but basic. The current payroll has fixed calculation logic inside `processGlobalPayroll()`.

Current limitation:

```ts
const period = "June 01 - 15, 2026";
```

This should be replaced because payroll period must be dynamic and should prevent duplicate payroll for the same employee and period.

Recommended replacement structure:

```text
payroll_periods
payroll_runs
payroll_lines
payroll_adjustments
payroll_deductions
payroll_approvals
```

Recommended payroll run statuses:

```text
Draft
Computed
For Review
Approved
Released
Cancelled
```

Recommended payroll line fields:

```text
employee_id
payroll_period_id
basic_pay
late_deduction
undertime_deduction
absence_deduction
overtime_pay
allowances
gross_pay
sss_deduction
philhealth_deduction
pagibig_deduction
withholding_tax
other_deductions
net_pay
status
```

Necessary modification to existing HR Payroll:

- Rename current payroll page into **Payroll Management**.
- Replace `Process Global Payroll` with **Create Payroll Run**.
- Let HR select pay period, school, department, and employee scope.
- Add duplicate prevention per employee and payroll period.
- Compute payroll from approved attendance and leave records.
- Move formulas from `store.ts` into `src/features/hr/utils/payrollCalculations.ts`.
- Add payroll run approval before allowing salary payout.
- Keep existing payslip preview but feed it from `payroll_lines` instead of the old flat `payroll` table.

---

### 7. Salary Payouts

Purpose:
Track salary release after payroll approval.

Current coverage:
Partial only. Current payroll rows can be marked as `Paid` directly.

Recommended additions:

```text
salary_payout_batches
salary_payout_lines
```

Recommended payout statuses:

```text
Pending
Queued
Released
Failed
Cancelled
```

Recommended features:

- Payout batch per payroll run
- Bank/cash/check release mode
- Released by / released date
- Payment reference number
- Export payout list
- Lock payout if payroll run is not approved

Important current module change:
Replace direct click-to-pay with a controlled payout workflow:

```text
Payroll Approved → Create Payout Batch → Release → Mark as Released
```

---

### 8. Taxes

Purpose:
Maintain tax setup and generate withholding tax summaries.

Current coverage:
Partial only. Current payroll formula uses a fixed `8%` tax.

Recommended additions:

```text
tax_tables
employee_tax_profiles
payroll_tax_lines
```

Recommended features:

- Employee tax profile
- Withholding tax category
- Tax exemption/declaration setup
- Payroll-period tax calculation
- Monthly/quarterly/year-end tax report

Important note:
Do not hardcode tax calculation inside the page. Use a configuration table and utility function.

---

### 9. Benefits

Purpose:
Manage mandatory and optional employee benefits.

Current coverage:
Partial only. Current payroll has fixed SSS, PhilHealth, and Pag-IBIG deductions.

Recommended additions:

```text
benefit_plans
employee_benefits
statutory_contribution_rules
payroll_benefit_lines
```

Recommended benefit categories:

```text
SSS
PhilHealth
Pag-IBIG
HMO
Rice Subsidy
Transportation Allowance
Faculty Allowance
13th Month
Other Allowance
Other Deduction
```

Payroll dependency:
Payroll should read benefits and statutory contribution rules when computing net pay.

---

### 10. Recruitment

Purpose:
Manage open positions, candidates, screening, and hiring decision.

Current coverage:
Not implemented yet.

Recommended additions:

```text
job_requisitions
job_postings
job_applicants
applicant_interviews
applicant_assessments
```

Recommended workflow:

```text
Draft Requisition → Approved → Posted → Screening → Interview → Offered → Hired / Rejected
```

Integration with Employee Life Cycle:
When an applicant is marked as `Hired`, create an employee record with status `For Onboarding`.

---

### 11. Onboarding

Purpose:
Track new hire requirements and readiness before active employment.

Current coverage:
Not implemented yet.

Recommended additions:

```text
onboarding_templates
onboarding_tasks
employee_onboarding_tasks
```

Recommended onboarding checklist:

```text
Employment Contract
Personal Data Sheet
Government IDs
Payroll Bank Details
School Email Account
System Login Account
Department Assignment
Orientation Schedule
Policy Acknowledgement
```

Integration:
Onboarding should start automatically when recruitment marks an applicant as hired or when HR directly registers a new employee as `For Onboarding`.

---

## Production Migration and Seed Data Requirements

Because this HR expansion will be used as a production-style implementation, the database work should be handled through **versioned Supabase migrations** under:

```text
supabase/migrations/
```

The current project already has migrations up to:

```text
0019_relax_payment_setup_constraints.sql
```

So the recommended HR migration sequence should start from:

```text
supabase/migrations/0020_hr_module_expansion.sql
supabase/migrations/0021_hr_module_rls.sql
supabase/migrations/0022_hr_module_seed_data.sql
```

Recommended split:

| File | Purpose | Production Rule |
|---|---|---|
| `0020_hr_module_expansion.sql` | Create/alter HR tables, indexes, constraints, enums/checks where needed | Must be idempotent using `if not exists` / `add column if not exists` |
| `0021_hr_module_rls.sql` | Enable RLS and add policies following the existing project style | Should not expose HR data to unrelated roles |
| `0022_hr_module_seed_data.sql` | Insert reference/default HR data | Use production-safe seed/reference data, not random demo-only records |

Important production note:

Do **not** insert fake employees, fake salary records, or fake payroll payouts into production migrations unless the project intentionally keeps demo data in the database. For production approach, seed only safe reference/master data such as:

```text
leave_types
shift_templates
benefit_plans
statutory_contribution_rules
tax_tables / tax_brackets
onboarding_templates
onboarding_task_templates
```

If dummy/demo records are needed for screenshots or QA, use either:

```text
supabase/migrations/0023_hr_demo_data_optional.sql
```

or a clearly separated local/demo seed script that is **not applied to production**.

Recommended seed data examples:

```sql
-- Leave types
insert into public.leave_types (code, name, is_paid, default_credits, is_active)
values
  ('VL', 'Vacation Leave', true, 15, true),
  ('SL', 'Sick Leave', true, 15, true),
  ('EL', 'Emergency Leave', true, 5, true),
  ('ML', 'Maternity Leave', true, 105, true),
  ('PL', 'Paternity Leave', true, 7, true),
  ('BL', 'Bereavement Leave', true, 3, true),
  ('LWOP', 'Leave Without Pay', false, 0, true),
  ('OB', 'Official Business', true, 0, true)
on conflict (code) do update set
  name = excluded.name,
  is_paid = excluded.is_paid,
  default_credits = excluded.default_credits,
  is_active = excluded.is_active;

-- Generic shift templates
insert into public.shift_templates (school_id, code, name, start_time, end_time, break_minutes, is_active)
select null, x.code, x.name, x.start_time::time, x.end_time::time, x.break_minutes, true
from (values
  ('DAY', 'Day Shift', '08:00', '17:00', 60),
  ('MID', 'Mid Shift', '10:00', '19:00', 60),
  ('NIGHT', 'Night Shift', '21:00', '06:00', 60),
  ('PART', 'Part-Time Shift', '08:00', '12:00', 0)
) as x(code, name, start_time, end_time, break_minutes)
on conflict (school_id, code) do update set
  name = excluded.name,
  start_time = excluded.start_time,
  end_time = excluded.end_time,
  break_minutes = excluded.break_minutes,
  is_active = excluded.is_active;

-- Benefit plans / contribution categories
insert into public.benefit_plans (code, name, category, employee_share_type, employee_share_value, employer_share_type, employer_share_value, is_active)
values
  ('SSS', 'SSS Contribution', 'Statutory', 'Configured', 0, 'Configured', 0, true),
  ('PHIC', 'PhilHealth Contribution', 'Statutory', 'Configured', 0, 'Configured', 0, true),
  ('HDMF', 'Pag-IBIG Contribution', 'Statutory', 'Fixed', 100, 'Fixed', 100, true),
  ('HMO', 'HMO Benefit', 'Company Benefit', 'Fixed', 0, 'Configured', 0, true),
  ('RICE', 'Rice Subsidy', 'Allowance', 'Fixed', 0, 'Fixed', 0, true),
  ('TRANSPO', 'Transportation Allowance', 'Allowance', 'Fixed', 0, 'Fixed', 0, true)
on conflict (code) do update set
  name = excluded.name,
  category = excluded.category,
  employee_share_type = excluded.employee_share_type,
  employee_share_value = excluded.employee_share_value,
  employer_share_type = excluded.employer_share_type,
  employer_share_value = excluded.employer_share_value,
  is_active = excluded.is_active;
```

The HR implementation prompts below should explicitly tell Claude to create these files in `supabase/migrations` and not only update frontend mock data.

## Recommended Database Migration

Create a new migration file:

```text
supabase/migrations/0020_hr_module_expansion.sql
```

Suggested tables:

```sql
-- Employee profile extension
alter table public.employees
  add column if not exists employee_no text,
  add column if not exists user_id uuid references public.users(id) on delete set null,
  add column if not exists employment_status text not null default 'Active',
  add column if not exists hire_date date,
  add column if not exists regularization_date date,
  add column if not exists separation_date date,
  add column if not exists separation_reason text,
  add column if not exists supervisor_id uuid references public.employees(id) on delete set null;

-- Employee lifecycle history
create table if not exists public.employee_lifecycle_events (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  event_type text not null,
  from_status text,
  to_status text,
  effective_date date not null default current_date,
  remarks text,
  created_by text,
  created_at timestamptz not null default now()
);

-- Shift templates
create table if not exists public.shift_templates (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete set null,
  code text not null,
  name text not null,
  start_time time not null,
  end_time time not null,
  break_minutes int not null default 60,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (school_id, code)
);

-- Employee shift assignment
create table if not exists public.employee_shift_assignments (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  shift_template_id uuid not null references public.shift_templates(id) on delete cascade,
  effective_from date not null,
  effective_to date,
  rest_days text[] default '{}',
  created_at timestamptz not null default now()
);

-- Employee attendance
create table if not exists public.employee_attendance (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  attendance_date date not null,
  time_in timestamptz,
  time_out timestamptz,
  status text not null default 'Present',
  late_minutes int not null default 0,
  undertime_minutes int not null default 0,
  overtime_minutes int not null default 0,
  remarks text,
  created_at timestamptz not null default now(),
  unique (employee_id, attendance_date)
);

-- Leave management
create table if not exists public.leave_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  is_paid boolean not null default true,
  default_credits numeric not null default 0,
  is_active boolean not null default true
);

create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  leave_type_id uuid not null references public.leave_types(id) on delete restrict,
  start_date date not null,
  end_date date not null,
  total_days numeric not null default 1,
  reason text,
  status text not null default 'Submitted',
  approved_by uuid references public.employees(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

-- Payroll run structure
create table if not exists public.payroll_periods (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete set null,
  period_code text not null,
  start_date date not null,
  end_date date not null,
  payout_date date,
  status text not null default 'Open',
  unique (school_id, period_code)
);

create table if not exists public.payroll_runs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete set null,
  payroll_period_id uuid not null references public.payroll_periods(id) on delete cascade,
  run_no text not null,
  status text not null default 'Draft',
  computed_by text,
  approved_by text,
  computed_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (school_id, run_no)
);

create table if not exists public.payroll_lines (
  id uuid primary key default gen_random_uuid(),
  payroll_run_id uuid not null references public.payroll_runs(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  basic_pay numeric not null default 0,
  allowances numeric not null default 0,
  overtime_pay numeric not null default 0,
  late_deduction numeric not null default 0,
  undertime_deduction numeric not null default 0,
  absence_deduction numeric not null default 0,
  sss_deduction numeric not null default 0,
  philhealth_deduction numeric not null default 0,
  pagibig_deduction numeric not null default 0,
  withholding_tax numeric not null default 0,
  other_deductions numeric not null default 0,
  gross_pay numeric not null default 0,
  net_pay numeric not null default 0,
  status text not null default 'Computed',
  created_at timestamptz not null default now(),
  unique (payroll_run_id, employee_id)
);

-- Salary payout
create table if not exists public.salary_payout_batches (
  id uuid primary key default gen_random_uuid(),
  payroll_run_id uuid not null references public.payroll_runs(id) on delete cascade,
  payout_no text not null unique,
  payout_method text not null default 'Bank Transfer',
  status text not null default 'Pending',
  released_by text,
  released_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.salary_payout_lines (
  id uuid primary key default gen_random_uuid(),
  payout_batch_id uuid not null references public.salary_payout_batches(id) on delete cascade,
  payroll_line_id uuid not null references public.payroll_lines(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  amount numeric not null default 0,
  reference_no text,
  status text not null default 'Pending',
  released_at timestamptz
);
```

Add RLS policies by following the pattern in:

```text
supabase/migrations/0002_rls.sql
```

For now, match the current project pattern first, then tighten RLS later once role-based Supabase auth is finalized.

---

## TypeScript Type Plan

Current HR types are inside:

```text
src/types/index.ts
```

Recommended approach:

- Keep `Employee` and `PayrollRow` temporarily for backward compatibility.
- Add new HR-specific interfaces.
- Consider moving HR types into `src/types/hr.types.ts` later if the file grows too large.

Suggested new types:

```ts
export interface EmployeeLifecycleEvent { ... }
export interface ShiftTemplate { ... }
export interface EmployeeShiftAssignment { ... }
export interface EmployeeAttendance { ... }
export interface LeaveType { ... }
export interface LeaveRequest { ... }
export interface PayrollPeriod { ... }
export interface PayrollRun { ... }
export interface PayrollLine { ... }
export interface SalaryPayoutBatch { ... }
export interface SalaryPayoutLine { ... }
export interface BenefitPlan { ... }
export interface EmployeeBenefit { ... }
export interface JobRequisition { ... }
export interface JobApplicant { ... }
export interface OnboardingTask { ... }
```

---

## Store and Data Loader Plan

Update:

```text
src/services/store.ts
src/services/dataLoader.ts
```

Add state arrays:

```ts
employeeLifecycleEvents: EmployeeLifecycleEvent[];
shiftTemplates: ShiftTemplate[];
employeeShiftAssignments: EmployeeShiftAssignment[];
employeeAttendance: EmployeeAttendance[];
leaveTypes: LeaveType[];
leaveRequests: LeaveRequest[];
payrollPeriods: PayrollPeriod[];
payrollRuns: PayrollRun[];
payrollLines: PayrollLine[];
salaryPayoutBatches: SalaryPayoutBatch[];
salaryPayoutLines: SalaryPayoutLine[];
benefitPlans: BenefitPlan[];
employeeBenefits: EmployeeBenefit[];
jobRequisitions: JobRequisition[];
jobApplicants: JobApplicant[];
onboardingTasks: OnboardingTask[];
```

Add actions:

```ts
addEmployeeLifecycleEvent(...)
assignEmployeeShift(...)
recordEmployeeAttendance(...)
requestLeave(...)
approveLeaveRequest(...)
createPayrollPeriod(...)
createPayrollRun(...)
computePayrollRun(...)
approvePayrollRun(...)
createSalaryPayoutBatch(...)
releaseSalaryPayoutBatch(...)
addBenefitPlan(...)
assignEmployeeBenefit(...)
createJobRequisition(...)
markApplicantHired(...)
createOnboardingChecklist(...)
completeOnboardingTask(...)
```

Important:
Use existing helper methods:

```ts
newId()
dbInsert()
dbUpdate()
dbDelete()
withSchoolFk()
resolveSchoolId()
```

---

## Existing HR Payroll Module Modification Plan

The current payroll should not be deleted immediately. It should be refactored in stages.

### Stage 1 — UI cleanup and safer payroll processing

Modify `src/features/hr/pages/HRManagementPage.tsx`:

- Rename header from `Human Resources & Staff Payroll Registry` to `HR Management` or `Payroll Management` depending on selected sub-page.
- Replace `Process Global Payroll` with `Create Payroll Run`.
- Add pay period selector.
- Add school/department filter.
- Prevent creating payroll for employees who already have payroll for the selected period.
- Remove hardcoded period string from `processGlobalPayroll()`.
- Fix employee import preview table duplicate `Status` headers.

### Stage 2 — Extract payroll logic

Create:

```text
src/features/hr/utils/payrollCalculations.ts
```

Move salary formula logic out of `store.ts`.

Expected function:

```ts
calculatePayrollLine({ employee, attendanceSummary, leaveSummary, benefitRules, taxRules, period }): PayrollLineDraft
```

### Stage 3 — Add payroll run workflow

Replace flat payroll processing with:

```text
payroll_periods → payroll_runs → payroll_lines → salary_payout_batches
```

Workflow:

```text
Draft Payroll Run
→ Compute Lines
→ HR Review
→ Approve Payroll
→ Create Payout Batch
→ Release Salary
→ Payslip Available
```

### Stage 4 — Keep payslip preview

Keep current `PayslipPreview` in:

```text
src/components/ModalPreviews.tsx
```

But update the props later so it can display:

- payroll period
- gross pay
- attendance deductions
- leave without pay
- government contributions
- tax
- other deductions
- net pay
- payout reference

---

## Suggested HR Dashboard KPIs

Add a dashboard page showing:

- Total active employees
- Employees for onboarding
- Pending leave approvals
- Attendance issues today
- Payroll run status
- Pending salary payouts
- Upcoming contract end dates
- Open job requisitions

Recommended layout:

- One row of KPI cards only
- Use light gradient cards, consistent with recent Accounting dashboard direction
- Use tables with max 5 rows and dynamic pagination if more records exist

---

## Role and Permission Recommendation

Keep module-level permission simple:

```ts
hr: ["DASHBOARD", "HR_MANAGEMENT", "NURSE_CLINIC"]
```

Inside the HR module, use action-level UI control:

```text
HR Officer:
- View employee records
- Create leave requests
- Manage attendance
- Prepare payroll

HR Manager:
- Approve leave
- Approve payroll
- Manage benefits and tax setup

Accounting:
- View approved payroll summary only, if needed later
- No employee personal HR records by default

Super Admin:
- Full access
```

Do not expose salary, tax, and benefits to non-HR roles unless explicitly required.

---

## Suggested Implementation Phases

### Phase 1 — HR Shell and Navigation

Goal:
Refactor HR into sub-pages without changing business logic yet.

Tasks:

- Add HR sub-page state in `App.tsx`.
- Update HR navigation children.
- Convert `HRManagementPage.tsx` into a router/shell.
- Move current employee/payroll UI into `PayrollManagementPage.tsx` or `EmployeeLifecyclePage.tsx`.
- Keep existing functionality working.

### Phase 2 — Employee Life Cycle

Goal:
Improve employee profile and employment status tracking.

Tasks:

- Add employee lifecycle fields.
- Add lifecycle event table.
- Add Employee Life Cycle page.
- Add employee movement modal.
- Add employment status badges.

### Phase 3 — Shift, Time, Attendance, Leave

Goal:
Build the timekeeping foundation needed before payroll automation.

Tasks:

- Add shift templates.
- Add employee shift assignment.
- Add attendance logs.
- Add leave types and leave requests.
- Add approval workflow.
- Add attendance/leave summaries per employee and period.

### Phase 4 — Payroll, Payouts, Taxes, Benefits

Goal:
Replace the basic payroll with an enterprise payroll workflow.

Tasks:

- Add payroll periods.
- Add payroll runs and lines.
- Add contribution/tax/benefit rules.
- Add payroll computation utility.
- Add payroll approval.
- Add payout batch and release flow.
- Update payslip preview.

### Phase 5 — Recruitment and Onboarding

Goal:
Complete the HR front-office workflow.

Tasks:

- Add job requisitions.
- Add applicant tracking.
- Add interview stage tracking.
- Convert hired applicant into employee.
- Auto-create onboarding checklist.
- Track onboarding completion.

---

## Recommended Priority

Do not implement all modules at once.

Best order:

```text
1. HR Shell + navigation
2. Employee Life Cycle
3. Leave Management
4. Shift + Attendance
5. Payroll refactor
6. Salary Payouts
7. Taxes + Benefits
8. Recruitment
9. Onboarding
10. HR Reports
```

Reason:
Payroll depends on employee profile, attendance, leave, tax, and benefits. Building payroll first without those modules will lead to another refactor later.

---

## Credit-Efficient Claude Prompt — Database Migration Phase

Use this prompt before implementing real HR UI logic that depends on new tables.

```text
You are a Principal Supabase/PostgreSQL Architect for STSN Connect.

Use the existing project files only.

Goal:
Create production-style Supabase migrations for the HR module expansion.

Scope:
1. Inspect the existing migration pattern under supabase/migrations.
2. Create the next migration files after the latest existing migration number:
   - HR schema expansion migration
   - HR RLS/policy migration
   - HR production-safe seed/reference data migration
3. The schema migration must create or alter the necessary HR tables for:
   - Employee Life Cycles
   - Time Management
   - Shift Management
   - Attendance
   - Leave Management
   - Payroll Management
   - Salary Payouts
   - Taxes
   - Benefits
   - Recruitment
   - Onboarding
4. Include proper primary keys, foreign keys, unique constraints, indexes, created_at/updated_at columns where appropriate, and safe defaults.
5. Modify the existing employees/payroll structure only when necessary and in a backward-compatible way.
6. Seed only production-safe reference data such as leave types, shift templates, benefit plans, statutory contribution categories, tax tables, and onboarding templates.
7. Do not seed fake employee payroll payouts or fake salary transactions into production migration files.
8. If demo/dummy data is needed, place it in a separate optional demo seed migration and clearly mark it as not for production.
9. Keep SQL idempotent where possible using if not exists, add column if not exists, and on conflict do update/do nothing.
10. Do not modify non-HR modules.

Important:
- Do not rely only on frontend mock data.
- All new persistent HR entities must have Supabase tables.
- Follow the existing project naming and RLS style.
```

## Credit-Efficient Claude Prompt — Phase 1

Use this first prompt only for the initial refactor.

```text
You are a Principal React + TypeScript Frontend Architect for STSN Connect.

Use the existing project files only.

Goal:
Refactor the existing HR module into a sub-page based HR shell, without changing current HR business behavior yet.

Scope:
1. Update src/config/navigation.config.ts HR children to include:
   - Dashboard
   - Employee Life Cycles
   - Time Management
   - Shift Management
   - Attendance
   - Leave Management
   - Payroll Management
   - Salary Payouts
   - Taxes
   - Benefits
   - Recruitment
   - Onboarding
2. Add HR sub-page state in src/App.tsx similar to accountingSubPage / portalSubPage.
3. Pass subPage and onSubPageChange props into HRManagementPage.
4. Convert src/features/hr/pages/HRManagementPage.tsx into an HR shell that renders sub-pages based on subPage.
5. Move the existing current HR payroll/employee UI into PayrollManagementPage.tsx or EmployeeLifecyclePage.tsx without changing behavior.
6. Create placeholder pages for the other HR sub-pages using the existing STSN card/table UI style.
7. Do not modify Supabase schema yet.
8. Do not alter Accounting, Registrar, Cashier, Student Portal, Grading, Clinic, Guidance, or Core Setup.
9. Do not change role permissions except what is required for HR navigation display.
10. Keep the build passing.

Important:
- Do not remove existing HR employee registration, CSV import, payroll ledger, payslip preview, or mark-paid behavior.
- Do not implement real attendance, leave, recruitment, onboarding, taxes, or benefits yet.
- Do not use native alert/confirm. Use the existing dialog/toast patterns.
- Keep changes as small and localized as possible.
```

---

## Credit-Efficient Claude Prompt — Phase 2

```text
You are a Principal React + TypeScript Frontend Architect for STSN Connect.

Goal:
Implement Employee Life Cycle enhancements for the existing HR module only.

Scope:
1. Add/extend the HR Supabase migrations under supabase/migrations for employee lifecycle fields and employee_lifecycle_events, including production-safe seed/reference data only if needed.
2. Extend Employee type safely without breaking existing employee registration/payroll.
3. Update dataLoader.ts and store.ts for lifecycle events.
4. Implement EmployeeLifecyclePage.tsx using existing STSNDataTable and modern dialog/toast patterns.
5. Add employee status badges and a movement/action modal.
6. Keep current HR payroll behavior unchanged.
7. Do not modify other modules.
8. Keep the build passing.
```

---

## Credit-Efficient Claude Prompt — Phase 3

```text
You are a Principal React + TypeScript Frontend Architect for STSN Connect.

Goal:
Implement HR Shift, Time, Attendance, and Leave foundation only.

Scope:
1. Add/extend Supabase migration tables under supabase/migrations for shift_templates, employee_shift_assignments, employee_attendance, leave_types, and leave_requests.
2. Add TypeScript types, dataLoader mappings, and Zustand store actions.
3. Implement placeholder-to-functional pages:
   - ShiftManagementPage
   - TimeManagementPage
   - AttendancePage
   - LeaveManagementPage
4. Use STSNDataTable and existing app dialog/toast patterns.
5. Add production-safe seed/reference data in a migration for leave types and generic shift templates. Keep dummy/demo employee records in a separate optional demo seed file only.
6. Do not refactor payroll yet except adding read-only summaries that payroll can use later.
7. Do not modify other modules.
8. Keep the build passing.
```

---

## Credit-Efficient Claude Prompt — Phase 4

```text
You are a Principal React + TypeScript Frontend Architect and School ERP Payroll Workflow Engineer for STSN Connect.

Goal:
Refactor the existing HR Payroll module into payroll periods, payroll runs, payroll lines, salary payouts, taxes, and benefits.

Scope:
1. Add/extend Supabase migration tables under supabase/migrations for payroll_periods, payroll_runs, payroll_lines, salary_payout_batches, salary_payout_lines, benefit_plans, employee_benefits, tax_tables, tax_brackets, and statutory_contribution_rules.
2. Replace the hardcoded processGlobalPayroll period with a selected payroll period.
3. Move payroll formulas from store.ts into src/features/hr/utils/payrollCalculations.ts.
4. Payroll computation must use employee salary plus approved attendance/leave summaries where available.
5. Add duplicate prevention for the same employee and payroll period.
6. Add payroll statuses: Draft, Computed, For Review, Approved, Released, Cancelled.
7. Add payout workflow so rows are not directly marked paid from the payroll table.
8. Update PayslipPreview to show the new computed payroll line details.
9. Do not modify non-HR modules.
10. Keep the build passing.
```

---

## Final Notes

The current HR Payroll module is a good starting point, but it should be treated as **Phase 0 / prototype payroll**. For a complete enterprise School ERP HR module, payroll must be separated from employee registration and must depend on attendance, leave, benefits, and tax rules.

The safest implementation is progressive:

```text
HR shell first → employee lifecycle → time/leave foundation → payroll refactor → payout/tax/benefits → recruitment/onboarding
```

This avoids breaking the existing working HR Payroll page while still moving the system toward a complete HR module set.

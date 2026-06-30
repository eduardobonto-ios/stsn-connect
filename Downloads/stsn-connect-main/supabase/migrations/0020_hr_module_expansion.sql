-- ============================================================================
-- STSN CONNECT — HR Module Expansion (Schema)
-- Creates all new HR tables needed for the full WELA-style HR module set.
-- All statements are idempotent (if not exists / add column if not exists).
-- ============================================================================

-- ============================================================================
-- 1. EXTEND EXISTING EMPLOYEES TABLE
-- ============================================================================
alter table public.employees
  add column if not exists employee_no text,
  add column if not exists user_id uuid references public.users(id) on delete set null,
  add column if not exists employment_status text not null default 'Active',
  add column if not exists hire_date date,
  add column if not exists regularization_date date,
  add column if not exists separation_date date,
  add column if not exists separation_reason text,
  add column if not exists supervisor_id uuid references public.employees(id) on delete set null;

create unique index if not exists idx_employees_employee_no on public.employees (employee_no)
  where employee_no is not null;

-- ============================================================================
-- 2. EMPLOYEE LIFECYCLE EVENTS
-- ============================================================================
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
create index if not exists idx_emp_lifecycle_employee on public.employee_lifecycle_events (employee_id);

-- ============================================================================
-- 3. EMPLOYEE DOCUMENTS
-- ============================================================================
create table if not exists public.employee_documents (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  document_name text not null,
  document_type text,
  status text not null default 'Pending' check (status in ('Pending','Submitted','Verified','Rejected')),
  file_url text,
  remarks text,
  submitted_at timestamptz,
  verified_by text,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_emp_documents_employee on public.employee_documents (employee_id);

-- ============================================================================
-- 4. EMPLOYEE DEPENDENTS
-- ============================================================================
create table if not exists public.employee_dependents (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  full_name text not null,
  relationship text not null,
  birth_date date,
  is_beneficiary boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_emp_dependents_employee on public.employee_dependents (employee_id);

-- ============================================================================
-- 5. SHIFT TEMPLATES
-- ============================================================================
create table if not exists public.shift_templates (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete set null,
  code text not null,
  name text not null,
  start_time time not null,
  end_time time not null,
  break_minutes int not null default 60,
  is_overnight boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, code)
);

-- ============================================================================
-- 6. EMPLOYEE SHIFT ASSIGNMENTS
-- ============================================================================
create table if not exists public.employee_shift_assignments (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  shift_template_id uuid not null references public.shift_templates(id) on delete cascade,
  effective_from date not null,
  effective_to date,
  rest_days text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists idx_emp_shift_employee on public.employee_shift_assignments (employee_id);

-- ============================================================================
-- 7. EMPLOYEE TIME LOGS
-- ============================================================================
create table if not exists public.employee_time_logs (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  log_date date not null,
  time_in timestamptz,
  time_out timestamptz,
  source text not null default 'Manual' check (source in ('Biometric','Manual','System')),
  is_approved boolean not null default false,
  approved_by text,
  approved_at timestamptz,
  remarks text,
  created_at timestamptz not null default now(),
  unique (employee_id, log_date)
);
create index if not exists idx_emp_time_logs_employee on public.employee_time_logs (employee_id);
create index if not exists idx_emp_time_logs_date on public.employee_time_logs (log_date);

-- ============================================================================
-- 8. EMPLOYEE TIME ADJUSTMENTS
-- ============================================================================
create table if not exists public.employee_time_adjustments (
  id uuid primary key default gen_random_uuid(),
  time_log_id uuid references public.employee_time_logs(id) on delete set null,
  employee_id uuid not null references public.employees(id) on delete cascade,
  adjustment_date date not null,
  adjusted_time_in timestamptz,
  adjusted_time_out timestamptz,
  reason text not null,
  status text not null default 'Pending' check (status in ('Pending','Approved','Rejected')),
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_emp_time_adj_employee on public.employee_time_adjustments (employee_id);

-- ============================================================================
-- 9. EMPLOYEE ATTENDANCE
-- ============================================================================
create table if not exists public.employee_attendance (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  attendance_date date not null,
  time_in timestamptz,
  time_out timestamptz,
  status text not null default 'Present'
    check (status in ('Present','Late','Undertime','Absent','On Leave','Official Business','Holiday','Rest Day','Half Day')),
  late_minutes int not null default 0,
  undertime_minutes int not null default 0,
  overtime_minutes int not null default 0,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, attendance_date)
);
create index if not exists idx_emp_attendance_employee on public.employee_attendance (employee_id);
create index if not exists idx_emp_attendance_date on public.employee_attendance (attendance_date);

-- ============================================================================
-- 10. ATTENDANCE CORRECTIONS
-- ============================================================================
create table if not exists public.attendance_corrections (
  id uuid primary key default gen_random_uuid(),
  attendance_id uuid not null references public.employee_attendance(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  field_changed text not null,
  old_value text,
  new_value text,
  reason text not null,
  approved_by text,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 11. HOLIDAYS
-- ============================================================================
create table if not exists public.holidays (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete set null,
  holiday_date date not null,
  name text not null,
  holiday_type text not null default 'Regular' check (holiday_type in ('Regular','Special Non-Working','Special Working','Local')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (school_id, holiday_date)
);

-- ============================================================================
-- 12. LEAVE TYPES
-- ============================================================================
create table if not exists public.leave_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  is_paid boolean not null default true,
  default_credits numeric not null default 0,
  max_days_per_request int,
  requires_approval boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 13. LEAVE CREDITS
-- ============================================================================
create table if not exists public.leave_credits (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  leave_type_id uuid not null references public.leave_types(id) on delete cascade,
  year int not null,
  credited_days numeric not null default 0,
  used_days numeric not null default 0,
  balance_days numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, leave_type_id, year)
);
create index if not exists idx_leave_credits_employee on public.leave_credits (employee_id);

-- ============================================================================
-- 14. LEAVE REQUESTS
-- ============================================================================
create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  leave_type_id uuid not null references public.leave_types(id) on delete restrict,
  start_date date not null,
  end_date date not null,
  total_days numeric not null default 1,
  reason text,
  status text not null default 'Submitted'
    check (status in ('Draft','Submitted','For Approval','Approved','Rejected','Cancelled')),
  approved_by uuid references public.employees(id) on delete set null,
  approved_at timestamptz,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_leave_requests_employee on public.leave_requests (employee_id);
create index if not exists idx_leave_requests_status on public.leave_requests (status);

-- ============================================================================
-- 15. PAYROLL PERIODS
-- ============================================================================
create table if not exists public.payroll_periods (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete set null,
  period_code text not null,
  label text,
  start_date date not null,
  end_date date not null,
  payout_date date,
  status text not null default 'Open' check (status in ('Open','Locked','Closed')),
  created_at timestamptz not null default now(),
  unique (school_id, period_code)
);
create index if not exists idx_payroll_periods_school on public.payroll_periods (school_id);

-- ============================================================================
-- 16. PAYROLL RUNS
-- ============================================================================
create table if not exists public.payroll_runs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete set null,
  payroll_period_id uuid not null references public.payroll_periods(id) on delete cascade,
  run_no text not null,
  status text not null default 'Draft'
    check (status in ('Draft','Computed','For Review','Approved','Released','Cancelled')),
  computed_by text,
  approved_by text,
  computed_at timestamptz,
  approved_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, run_no)
);
create index if not exists idx_payroll_runs_period on public.payroll_runs (payroll_period_id);

-- ============================================================================
-- 17. PAYROLL LINES
-- ============================================================================
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
  other_allowances numeric not null default 0,
  gross_pay numeric not null default 0,
  net_pay numeric not null default 0,
  status text not null default 'Computed' check (status in ('Computed','For Review','Approved','Released','Cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (payroll_run_id, employee_id)
);
create index if not exists idx_payroll_lines_run on public.payroll_lines (payroll_run_id);
create index if not exists idx_payroll_lines_employee on public.payroll_lines (employee_id);

-- ============================================================================
-- 18. PAYROLL ADJUSTMENTS
-- ============================================================================
create table if not exists public.payroll_adjustments (
  id uuid primary key default gen_random_uuid(),
  payroll_line_id uuid not null references public.payroll_lines(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  adjustment_type text not null check (adjustment_type in ('Addition','Deduction')),
  description text not null,
  amount numeric not null default 0,
  created_by text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 19. SALARY PAYOUT BATCHES
-- ============================================================================
create table if not exists public.salary_payout_batches (
  id uuid primary key default gen_random_uuid(),
  payroll_run_id uuid not null references public.payroll_runs(id) on delete cascade,
  payout_no text not null unique,
  payout_method text not null default 'Bank Transfer'
    check (payout_method in ('Bank Transfer','Cash','Check')),
  status text not null default 'Pending'
    check (status in ('Pending','Queued','Released','Failed','Cancelled')),
  released_by text,
  released_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_payout_batches_run on public.salary_payout_batches (payroll_run_id);

-- ============================================================================
-- 20. SALARY PAYOUT LINES
-- ============================================================================
create table if not exists public.salary_payout_lines (
  id uuid primary key default gen_random_uuid(),
  payout_batch_id uuid not null references public.salary_payout_batches(id) on delete cascade,
  payroll_line_id uuid not null references public.payroll_lines(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  amount numeric not null default 0,
  reference_no text,
  status text not null default 'Pending'
    check (status in ('Pending','Released','Failed','Cancelled')),
  released_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_payout_lines_batch on public.salary_payout_lines (payout_batch_id);
create index if not exists idx_payout_lines_employee on public.salary_payout_lines (employee_id);

-- ============================================================================
-- 21. BENEFIT PLANS
-- ============================================================================
create table if not exists public.benefit_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  category text not null
    check (category in ('Statutory','Company Benefit','Allowance','Deduction')),
  employee_share_type text not null default 'Fixed'
    check (employee_share_type in ('Fixed','Percentage','Configured')),
  employee_share_value numeric not null default 0,
  employer_share_type text not null default 'Fixed'
    check (employer_share_type in ('Fixed','Percentage','Configured')),
  employer_share_value numeric not null default 0,
  is_taxable boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 22. STATUTORY CONTRIBUTION RULES
-- ============================================================================
create table if not exists public.statutory_contribution_rules (
  id uuid primary key default gen_random_uuid(),
  benefit_plan_id uuid not null references public.benefit_plans(id) on delete cascade,
  effective_year int not null,
  min_salary numeric not null default 0,
  max_salary numeric,
  employee_rate numeric not null default 0,
  employer_rate numeric not null default 0,
  employee_fixed numeric not null default 0,
  employer_fixed numeric not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  unique (benefit_plan_id, effective_year, min_salary)
);
create index if not exists idx_stat_contrib_plan on public.statutory_contribution_rules (benefit_plan_id);

-- ============================================================================
-- 23. EMPLOYEE BENEFITS (enrollment per employee)
-- ============================================================================
create table if not exists public.employee_benefits (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  benefit_plan_id uuid not null references public.benefit_plans(id) on delete cascade,
  effective_from date not null,
  effective_to date,
  override_employee_amount numeric,
  override_employer_amount numeric,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (employee_id, benefit_plan_id)
);
create index if not exists idx_emp_benefits_employee on public.employee_benefits (employee_id);

-- ============================================================================
-- 24. PAYROLL BENEFIT LINES
-- ============================================================================
create table if not exists public.payroll_benefit_lines (
  id uuid primary key default gen_random_uuid(),
  payroll_line_id uuid not null references public.payroll_lines(id) on delete cascade,
  benefit_plan_id uuid not null references public.benefit_plans(id) on delete cascade,
  employee_share numeric not null default 0,
  employer_share numeric not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 25. TAX TABLES
-- ============================================================================
create table if not exists public.tax_tables (
  id uuid primary key default gen_random_uuid(),
  effective_year int not null,
  name text not null,
  frequency text not null default 'Monthly' check (frequency in ('Monthly','Semi-Monthly','Annual')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (effective_year, frequency)
);

-- ============================================================================
-- 26. TAX BRACKETS
-- ============================================================================
create table if not exists public.tax_brackets (
  id uuid primary key default gen_random_uuid(),
  tax_table_id uuid not null references public.tax_tables(id) on delete cascade,
  income_from numeric not null,
  income_to numeric,
  base_tax numeric not null default 0,
  rate_above numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (tax_table_id, income_from)
);
create index if not exists idx_tax_brackets_table on public.tax_brackets (tax_table_id);

-- ============================================================================
-- 27. EMPLOYEE TAX PROFILES
-- ============================================================================
create table if not exists public.employee_tax_profiles (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade unique,
  tax_code text not null default 'ME',
  dependents_count int not null default 0,
  is_minimum_wage_earner boolean not null default false,
  is_tax_exempt boolean not null default false,
  tax_exemption_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 28. JOB REQUISITIONS
-- ============================================================================
create table if not exists public.job_requisitions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete set null,
  requisition_no text not null unique,
  position_title text not null,
  department text not null,
  employment_type text not null default 'Full-Time'
    check (employment_type in ('Full-Time','Part-Time','Contractual')),
  head_count int not null default 1,
  reason text,
  target_start_date date,
  status text not null default 'Draft'
    check (status in ('Draft','Approved','Posted','Screening','Interview','Offered','Closed','Cancelled')),
  requested_by text,
  approved_by text,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_job_reqs_school on public.job_requisitions (school_id);

-- ============================================================================
-- 29. JOB APPLICANTS
-- ============================================================================
create table if not exists public.job_applicants (
  id uuid primary key default gen_random_uuid(),
  job_requisition_id uuid references public.job_requisitions(id) on delete set null,
  first_name text not null,
  last_name text not null,
  middle_name text,
  email text,
  contact text,
  address text,
  resume_url text,
  applied_at date not null default current_date,
  status text not null default 'For Screening'
    check (status in ('For Screening','For Interview','For Assessment','Offered','Hired','Rejected','Withdrew')),
  hired_employee_id uuid references public.employees(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_job_applicants_req on public.job_applicants (job_requisition_id);

-- ============================================================================
-- 30. APPLICANT INTERVIEWS
-- ============================================================================
create table if not exists public.applicant_interviews (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references public.job_applicants(id) on delete cascade,
  scheduled_at timestamptz not null,
  interview_type text not null default 'Initial'
    check (interview_type in ('Initial','Technical','Final','HR','Panel')),
  interviewer text,
  result text check (result in ('Passed','Failed','No Show','Pending')),
  remarks text,
  created_at timestamptz not null default now()
);
create index if not exists idx_interviews_applicant on public.applicant_interviews (applicant_id);

-- ============================================================================
-- 31. ONBOARDING TEMPLATES
-- ============================================================================
create table if not exists public.onboarding_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 32. ONBOARDING TASKS (template tasks)
-- ============================================================================
create table if not exists public.onboarding_tasks (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.onboarding_templates(id) on delete cascade,
  task_name text not null,
  description text,
  responsible_party text,
  due_day_offset int not null default 1,
  is_required boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (template_id, task_name)
);
create index if not exists idx_onboarding_tasks_template on public.onboarding_tasks (template_id);

-- ============================================================================
-- 33. EMPLOYEE ONBOARDING TASKS (per-employee checklist)
-- ============================================================================
create table if not exists public.employee_onboarding_tasks (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  onboarding_task_id uuid not null references public.onboarding_tasks(id) on delete cascade,
  due_date date,
  status text not null default 'Pending'
    check (status in ('Pending','In Progress','Completed','Skipped','Overdue')),
  completed_at timestamptz,
  completed_by text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, onboarding_task_id)
);
create index if not exists idx_emp_onboarding_employee on public.employee_onboarding_tasks (employee_id);

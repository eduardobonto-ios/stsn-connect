-- ============================================================================
-- STSN CONNECT — HR Module RLS Policies
-- Permissive dev policies (anon + authenticated full CRUD).
-- Tighten role-based access once Supabase Auth is finalized.
-- Follows the same pattern as 0002_rls.sql.
-- ============================================================================

-- employee_lifecycle_events
alter table public.employee_lifecycle_events enable row level security;
create policy "employee_lifecycle_events_select" on public.employee_lifecycle_events for select to anon, authenticated using (true);
create policy "employee_lifecycle_events_insert" on public.employee_lifecycle_events for insert to anon, authenticated with check (true);
create policy "employee_lifecycle_events_update" on public.employee_lifecycle_events for update to anon, authenticated using (true) with check (true);
create policy "employee_lifecycle_events_delete" on public.employee_lifecycle_events for delete to anon, authenticated using (true);

-- employee_documents
alter table public.employee_documents enable row level security;
create policy "employee_documents_select" on public.employee_documents for select to anon, authenticated using (true);
create policy "employee_documents_insert" on public.employee_documents for insert to anon, authenticated with check (true);
create policy "employee_documents_update" on public.employee_documents for update to anon, authenticated using (true) with check (true);
create policy "employee_documents_delete" on public.employee_documents for delete to anon, authenticated using (true);

-- employee_dependents
alter table public.employee_dependents enable row level security;
create policy "employee_dependents_select" on public.employee_dependents for select to anon, authenticated using (true);
create policy "employee_dependents_insert" on public.employee_dependents for insert to anon, authenticated with check (true);
create policy "employee_dependents_update" on public.employee_dependents for update to anon, authenticated using (true) with check (true);
create policy "employee_dependents_delete" on public.employee_dependents for delete to anon, authenticated using (true);

-- shift_templates
alter table public.shift_templates enable row level security;
create policy "shift_templates_select" on public.shift_templates for select to anon, authenticated using (true);
create policy "shift_templates_insert" on public.shift_templates for insert to anon, authenticated with check (true);
create policy "shift_templates_update" on public.shift_templates for update to anon, authenticated using (true) with check (true);
create policy "shift_templates_delete" on public.shift_templates for delete to anon, authenticated using (true);

-- employee_shift_assignments
alter table public.employee_shift_assignments enable row level security;
create policy "employee_shift_assignments_select" on public.employee_shift_assignments for select to anon, authenticated using (true);
create policy "employee_shift_assignments_insert" on public.employee_shift_assignments for insert to anon, authenticated with check (true);
create policy "employee_shift_assignments_update" on public.employee_shift_assignments for update to anon, authenticated using (true) with check (true);
create policy "employee_shift_assignments_delete" on public.employee_shift_assignments for delete to anon, authenticated using (true);

-- employee_time_logs
alter table public.employee_time_logs enable row level security;
create policy "employee_time_logs_select" on public.employee_time_logs for select to anon, authenticated using (true);
create policy "employee_time_logs_insert" on public.employee_time_logs for insert to anon, authenticated with check (true);
create policy "employee_time_logs_update" on public.employee_time_logs for update to anon, authenticated using (true) with check (true);
create policy "employee_time_logs_delete" on public.employee_time_logs for delete to anon, authenticated using (true);

-- employee_time_adjustments
alter table public.employee_time_adjustments enable row level security;
create policy "employee_time_adjustments_select" on public.employee_time_adjustments for select to anon, authenticated using (true);
create policy "employee_time_adjustments_insert" on public.employee_time_adjustments for insert to anon, authenticated with check (true);
create policy "employee_time_adjustments_update" on public.employee_time_adjustments for update to anon, authenticated using (true) with check (true);
create policy "employee_time_adjustments_delete" on public.employee_time_adjustments for delete to anon, authenticated using (true);

-- employee_attendance
alter table public.employee_attendance enable row level security;
create policy "employee_attendance_select" on public.employee_attendance for select to anon, authenticated using (true);
create policy "employee_attendance_insert" on public.employee_attendance for insert to anon, authenticated with check (true);
create policy "employee_attendance_update" on public.employee_attendance for update to anon, authenticated using (true) with check (true);
create policy "employee_attendance_delete" on public.employee_attendance for delete to anon, authenticated using (true);

-- attendance_corrections
alter table public.attendance_corrections enable row level security;
create policy "attendance_corrections_select" on public.attendance_corrections for select to anon, authenticated using (true);
create policy "attendance_corrections_insert" on public.attendance_corrections for insert to anon, authenticated with check (true);
create policy "attendance_corrections_update" on public.attendance_corrections for update to anon, authenticated using (true) with check (true);
create policy "attendance_corrections_delete" on public.attendance_corrections for delete to anon, authenticated using (true);

-- holidays
alter table public.holidays enable row level security;
create policy "holidays_select" on public.holidays for select to anon, authenticated using (true);
create policy "holidays_insert" on public.holidays for insert to anon, authenticated with check (true);
create policy "holidays_update" on public.holidays for update to anon, authenticated using (true) with check (true);
create policy "holidays_delete" on public.holidays for delete to anon, authenticated using (true);

-- leave_types
alter table public.leave_types enable row level security;
create policy "leave_types_select" on public.leave_types for select to anon, authenticated using (true);
create policy "leave_types_insert" on public.leave_types for insert to anon, authenticated with check (true);
create policy "leave_types_update" on public.leave_types for update to anon, authenticated using (true) with check (true);
create policy "leave_types_delete" on public.leave_types for delete to anon, authenticated using (true);

-- leave_credits
alter table public.leave_credits enable row level security;
create policy "leave_credits_select" on public.leave_credits for select to anon, authenticated using (true);
create policy "leave_credits_insert" on public.leave_credits for insert to anon, authenticated with check (true);
create policy "leave_credits_update" on public.leave_credits for update to anon, authenticated using (true) with check (true);
create policy "leave_credits_delete" on public.leave_credits for delete to anon, authenticated using (true);

-- leave_requests
alter table public.leave_requests enable row level security;
create policy "leave_requests_select" on public.leave_requests for select to anon, authenticated using (true);
create policy "leave_requests_insert" on public.leave_requests for insert to anon, authenticated with check (true);
create policy "leave_requests_update" on public.leave_requests for update to anon, authenticated using (true) with check (true);
create policy "leave_requests_delete" on public.leave_requests for delete to anon, authenticated using (true);

-- payroll_periods
alter table public.payroll_periods enable row level security;
create policy "payroll_periods_select" on public.payroll_periods for select to anon, authenticated using (true);
create policy "payroll_periods_insert" on public.payroll_periods for insert to anon, authenticated with check (true);
create policy "payroll_periods_update" on public.payroll_periods for update to anon, authenticated using (true) with check (true);
create policy "payroll_periods_delete" on public.payroll_periods for delete to anon, authenticated using (true);

-- payroll_runs
alter table public.payroll_runs enable row level security;
create policy "payroll_runs_select" on public.payroll_runs for select to anon, authenticated using (true);
create policy "payroll_runs_insert" on public.payroll_runs for insert to anon, authenticated with check (true);
create policy "payroll_runs_update" on public.payroll_runs for update to anon, authenticated using (true) with check (true);
create policy "payroll_runs_delete" on public.payroll_runs for delete to anon, authenticated using (true);

-- payroll_lines
alter table public.payroll_lines enable row level security;
create policy "payroll_lines_select" on public.payroll_lines for select to anon, authenticated using (true);
create policy "payroll_lines_insert" on public.payroll_lines for insert to anon, authenticated with check (true);
create policy "payroll_lines_update" on public.payroll_lines for update to anon, authenticated using (true) with check (true);
create policy "payroll_lines_delete" on public.payroll_lines for delete to anon, authenticated using (true);

-- payroll_adjustments
alter table public.payroll_adjustments enable row level security;
create policy "payroll_adjustments_select" on public.payroll_adjustments for select to anon, authenticated using (true);
create policy "payroll_adjustments_insert" on public.payroll_adjustments for insert to anon, authenticated with check (true);
create policy "payroll_adjustments_update" on public.payroll_adjustments for update to anon, authenticated using (true) with check (true);
create policy "payroll_adjustments_delete" on public.payroll_adjustments for delete to anon, authenticated using (true);

-- salary_payout_batches
alter table public.salary_payout_batches enable row level security;
create policy "salary_payout_batches_select" on public.salary_payout_batches for select to anon, authenticated using (true);
create policy "salary_payout_batches_insert" on public.salary_payout_batches for insert to anon, authenticated with check (true);
create policy "salary_payout_batches_update" on public.salary_payout_batches for update to anon, authenticated using (true) with check (true);
create policy "salary_payout_batches_delete" on public.salary_payout_batches for delete to anon, authenticated using (true);

-- salary_payout_lines
alter table public.salary_payout_lines enable row level security;
create policy "salary_payout_lines_select" on public.salary_payout_lines for select to anon, authenticated using (true);
create policy "salary_payout_lines_insert" on public.salary_payout_lines for insert to anon, authenticated with check (true);
create policy "salary_payout_lines_update" on public.salary_payout_lines for update to anon, authenticated using (true) with check (true);
create policy "salary_payout_lines_delete" on public.salary_payout_lines for delete to anon, authenticated using (true);

-- benefit_plans
alter table public.benefit_plans enable row level security;
create policy "benefit_plans_select" on public.benefit_plans for select to anon, authenticated using (true);
create policy "benefit_plans_insert" on public.benefit_plans for insert to anon, authenticated with check (true);
create policy "benefit_plans_update" on public.benefit_plans for update to anon, authenticated using (true) with check (true);
create policy "benefit_plans_delete" on public.benefit_plans for delete to anon, authenticated using (true);

-- statutory_contribution_rules
alter table public.statutory_contribution_rules enable row level security;
create policy "statutory_contribution_rules_select" on public.statutory_contribution_rules for select to anon, authenticated using (true);
create policy "statutory_contribution_rules_insert" on public.statutory_contribution_rules for insert to anon, authenticated with check (true);
create policy "statutory_contribution_rules_update" on public.statutory_contribution_rules for update to anon, authenticated using (true) with check (true);
create policy "statutory_contribution_rules_delete" on public.statutory_contribution_rules for delete to anon, authenticated using (true);

-- employee_benefits
alter table public.employee_benefits enable row level security;
create policy "employee_benefits_select" on public.employee_benefits for select to anon, authenticated using (true);
create policy "employee_benefits_insert" on public.employee_benefits for insert to anon, authenticated with check (true);
create policy "employee_benefits_update" on public.employee_benefits for update to anon, authenticated using (true) with check (true);
create policy "employee_benefits_delete" on public.employee_benefits for delete to anon, authenticated using (true);

-- payroll_benefit_lines
alter table public.payroll_benefit_lines enable row level security;
create policy "payroll_benefit_lines_select" on public.payroll_benefit_lines for select to anon, authenticated using (true);
create policy "payroll_benefit_lines_insert" on public.payroll_benefit_lines for insert to anon, authenticated with check (true);
create policy "payroll_benefit_lines_update" on public.payroll_benefit_lines for update to anon, authenticated using (true) with check (true);
create policy "payroll_benefit_lines_delete" on public.payroll_benefit_lines for delete to anon, authenticated using (true);

-- tax_tables
alter table public.tax_tables enable row level security;
create policy "tax_tables_select" on public.tax_tables for select to anon, authenticated using (true);
create policy "tax_tables_insert" on public.tax_tables for insert to anon, authenticated with check (true);
create policy "tax_tables_update" on public.tax_tables for update to anon, authenticated using (true) with check (true);
create policy "tax_tables_delete" on public.tax_tables for delete to anon, authenticated using (true);

-- tax_brackets
alter table public.tax_brackets enable row level security;
create policy "tax_brackets_select" on public.tax_brackets for select to anon, authenticated using (true);
create policy "tax_brackets_insert" on public.tax_brackets for insert to anon, authenticated with check (true);
create policy "tax_brackets_update" on public.tax_brackets for update to anon, authenticated using (true) with check (true);
create policy "tax_brackets_delete" on public.tax_brackets for delete to anon, authenticated using (true);

-- employee_tax_profiles
alter table public.employee_tax_profiles enable row level security;
create policy "employee_tax_profiles_select" on public.employee_tax_profiles for select to anon, authenticated using (true);
create policy "employee_tax_profiles_insert" on public.employee_tax_profiles for insert to anon, authenticated with check (true);
create policy "employee_tax_profiles_update" on public.employee_tax_profiles for update to anon, authenticated using (true) with check (true);
create policy "employee_tax_profiles_delete" on public.employee_tax_profiles for delete to anon, authenticated using (true);

-- job_requisitions
alter table public.job_requisitions enable row level security;
create policy "job_requisitions_select" on public.job_requisitions for select to anon, authenticated using (true);
create policy "job_requisitions_insert" on public.job_requisitions for insert to anon, authenticated with check (true);
create policy "job_requisitions_update" on public.job_requisitions for update to anon, authenticated using (true) with check (true);
create policy "job_requisitions_delete" on public.job_requisitions for delete to anon, authenticated using (true);

-- job_applicants
alter table public.job_applicants enable row level security;
create policy "job_applicants_select" on public.job_applicants for select to anon, authenticated using (true);
create policy "job_applicants_insert" on public.job_applicants for insert to anon, authenticated with check (true);
create policy "job_applicants_update" on public.job_applicants for update to anon, authenticated using (true) with check (true);
create policy "job_applicants_delete" on public.job_applicants for delete to anon, authenticated using (true);

-- applicant_interviews
alter table public.applicant_interviews enable row level security;
create policy "applicant_interviews_select" on public.applicant_interviews for select to anon, authenticated using (true);
create policy "applicant_interviews_insert" on public.applicant_interviews for insert to anon, authenticated with check (true);
create policy "applicant_interviews_update" on public.applicant_interviews for update to anon, authenticated using (true) with check (true);
create policy "applicant_interviews_delete" on public.applicant_interviews for delete to anon, authenticated using (true);

-- onboarding_templates
alter table public.onboarding_templates enable row level security;
create policy "onboarding_templates_select" on public.onboarding_templates for select to anon, authenticated using (true);
create policy "onboarding_templates_insert" on public.onboarding_templates for insert to anon, authenticated with check (true);
create policy "onboarding_templates_update" on public.onboarding_templates for update to anon, authenticated using (true) with check (true);
create policy "onboarding_templates_delete" on public.onboarding_templates for delete to anon, authenticated using (true);

-- onboarding_tasks
alter table public.onboarding_tasks enable row level security;
create policy "onboarding_tasks_select" on public.onboarding_tasks for select to anon, authenticated using (true);
create policy "onboarding_tasks_insert" on public.onboarding_tasks for insert to anon, authenticated with check (true);
create policy "onboarding_tasks_update" on public.onboarding_tasks for update to anon, authenticated using (true) with check (true);
create policy "onboarding_tasks_delete" on public.onboarding_tasks for delete to anon, authenticated using (true);

-- employee_onboarding_tasks
alter table public.employee_onboarding_tasks enable row level security;
create policy "employee_onboarding_tasks_select" on public.employee_onboarding_tasks for select to anon, authenticated using (true);
create policy "employee_onboarding_tasks_insert" on public.employee_onboarding_tasks for insert to anon, authenticated with check (true);
create policy "employee_onboarding_tasks_update" on public.employee_onboarding_tasks for update to anon, authenticated using (true) with check (true);
create policy "employee_onboarding_tasks_delete" on public.employee_onboarding_tasks for delete to anon, authenticated using (true);

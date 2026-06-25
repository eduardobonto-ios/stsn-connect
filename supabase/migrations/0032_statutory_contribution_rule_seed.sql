-- ============================================================================
-- STSN Connect - Statutory Contribution Rule Seed
-- Keeps Philippine payroll contribution reference data in effective-dated rows.
-- Values are starter configuration and should be reviewed against official
-- schedules before production payroll release.
-- ============================================================================

insert into public.statutory_contribution_rules (
  benefit_plan_id,
  effective_year,
  min_salary,
  max_salary,
  employee_rate,
  employer_rate,
  employee_fixed,
  employer_fixed,
  notes
)
select bp.id, 2026, 0, null, 0.045, 0.095, 0, 0,
       'Starter SSS employee/employer percentage rule. Validate against official SSS schedule.'
from public.benefit_plans bp
where upper(bp.code) = 'SSS'
on conflict (benefit_plan_id, effective_year, min_salary) do nothing;

insert into public.statutory_contribution_rules (
  benefit_plan_id,
  effective_year,
  min_salary,
  max_salary,
  employee_rate,
  employer_rate,
  employee_fixed,
  employer_fixed,
  notes
)
select bp.id, 2026, 0, 100000, 0.025, 0.025, 0, 0,
       'Starter PhilHealth rule with monthly salary cap. Validate against official PhilHealth circulars.'
from public.benefit_plans bp
where upper(bp.code) in ('PHILHEALTH', 'PHIC')
on conflict (benefit_plan_id, effective_year, min_salary) do nothing;

insert into public.statutory_contribution_rules (
  benefit_plan_id,
  effective_year,
  min_salary,
  max_salary,
  employee_rate,
  employer_rate,
  employee_fixed,
  employer_fixed,
  notes
)
select bp.id, 2026, 0, null, 0, 0, 100, 100,
       'Starter Pag-IBIG fixed monthly rule. Validate against official Pag-IBIG schedule.'
from public.benefit_plans bp
where upper(bp.code) in ('PAGIBIG', 'PAG-IBIG', 'HDMF')
on conflict (benefit_plan_id, effective_year, min_salary) do nothing;

-- ============================================================================
-- STSN CONNECT — HR Module Production-Safe Seed / Reference Data
-- Only master/reference data is seeded here (no fake employee transactions).
-- All inserts use ON CONFLICT DO UPDATE so re-running is safe.
-- ============================================================================

-- ============================================================================
-- LEAVE TYPES
-- ============================================================================
insert into public.leave_types (code, name, is_paid, default_credits, max_days_per_request, requires_approval, is_active)
values
  ('VL',   'Vacation Leave',       true,  15,  5,   true, true),
  ('SL',   'Sick Leave',           true,  15,  30,  true, true),
  ('EL',   'Emergency Leave',      true,  5,   3,   true, true),
  ('ML',   'Maternity Leave',      true,  105, 105, true, true),
  ('PL',   'Paternity Leave',      true,  7,   7,   true, true),
  ('BL',   'Bereavement Leave',    true,  3,   5,   true, true),
  ('StuL', 'Study Leave',          true,  6,   6,   true, true),
  ('LWOP', 'Leave Without Pay',    false, 0,   30,  true, true),
  ('OB',   'Official Business',    true,  0,   30,  true, true),
  ('SPL',  'Solo Parent Leave',    true,  7,   7,   true, true)
on conflict (code) do update set
  name               = excluded.name,
  is_paid            = excluded.is_paid,
  default_credits    = excluded.default_credits,
  max_days_per_request = excluded.max_days_per_request,
  requires_approval  = excluded.requires_approval,
  is_active          = excluded.is_active;

-- ============================================================================
-- SHIFT TEMPLATES (global — school_id null = applies to all schools)
-- ============================================================================
insert into public.shift_templates (school_id, code, name, start_time, end_time, break_minutes, is_overnight, is_active)
select
  null,
  x.code,
  x.name,
  x.start_time::time,
  x.end_time::time,
  x.break_minutes,
  x.is_overnight,
  true
from (values
  ('DAY',    'Day Shift (8AM-5PM)',       '08:00', '17:00', 60,  false),
  ('MID',    'Mid Shift (10AM-7PM)',      '10:00', '19:00', 60,  false),
  ('AFT',    'Afternoon Shift (12PM-9PM)','12:00', '21:00', 60,  false),
  ('NIGHT',  'Night Shift (9PM-6AM)',     '21:00', '06:00', 60,  true),
  ('PART',   'Part-Time (8AM-12PM)',      '08:00', '12:00', 0,   false),
  ('FACULTY','Faculty Teaching Schedule', '07:00', '17:00', 90,  false)
) as x(code, name, start_time, end_time, break_minutes, is_overnight)
on conflict (school_id, code) do update set
  name          = excluded.name,
  start_time    = excluded.start_time,
  end_time      = excluded.end_time,
  break_minutes = excluded.break_minutes,
  is_overnight  = excluded.is_overnight,
  is_active     = excluded.is_active,
  updated_at    = now();

-- ============================================================================
-- BENEFIT PLANS
-- ============================================================================
insert into public.benefit_plans (code, name, category, employee_share_type, employee_share_value, employer_share_type, employer_share_value, is_taxable, is_active)
values
  ('SSS',     'SSS Contribution',           'Statutory',      'Configured', 0,   'Configured', 0,   false, true),
  ('PHIC',    'PhilHealth Contribution',    'Statutory',      'Configured', 0,   'Configured', 0,   false, true),
  ('HDMF',    'Pag-IBIG Contribution',      'Statutory',      'Fixed',      100, 'Fixed',      100, false, true),
  ('HMO',     'HMO Benefit',                'Company Benefit','Fixed',      0,   'Configured', 0,   false, true),
  ('RICE',    'Rice Subsidy',               'Allowance',      'Fixed',      0,   'Fixed',      2000,false, true),
  ('TRANSPO', 'Transportation Allowance',   'Allowance',      'Fixed',      0,   'Fixed',      1500,false, true),
  ('FACULTY', 'Faculty Teaching Allowance', 'Allowance',      'Fixed',      0,   'Configured', 0,   false, true),
  ('13MO',    '13th Month Pay',             'Company Benefit','Fixed',      0,   'Configured', 0,   false, true),
  ('OVERTIME','Overtime Pay',               'Allowance',      'Fixed',      0,   'Configured', 0,   false, true),
  ('HLOAN',   'Housing Loan Deduction',     'Deduction',      'Fixed',      0,   'Fixed',      0,   false, true)
on conflict (code) do update set
  name                  = excluded.name,
  category              = excluded.category,
  employee_share_type   = excluded.employee_share_type,
  employee_share_value  = excluded.employee_share_value,
  employer_share_type   = excluded.employer_share_type,
  employer_share_value  = excluded.employer_share_value,
  is_taxable            = excluded.is_taxable,
  is_active             = excluded.is_active,
  updated_at            = now();

-- ============================================================================
-- STATUTORY CONTRIBUTION RULES (SSS 2026, semi-monthly / monthly basis)
-- Rates based on current Philippine SSS schedule.
-- ============================================================================
insert into public.statutory_contribution_rules
  (benefit_plan_id, effective_year, min_salary, max_salary, employee_rate, employer_rate, employee_fixed, employer_fixed, notes)
select
  (select id from public.benefit_plans where code = 'SSS'),
  2026,
  x.min_salary,
  x.max_salary,
  x.ee_rate,
  x.er_rate,
  0,
  0,
  x.notes
from (values
  (0::numeric,       4999.99::numeric, 0.045::numeric, 0.095::numeric, 'Floor bracket'),
  (5000::numeric,    9999.99::numeric, 0.045::numeric, 0.095::numeric, 'Bracket 2'),
  (10000::numeric,   14999.99::numeric,0.045::numeric, 0.095::numeric, 'Bracket 3'),
  (15000::numeric,   19999.99::numeric,0.045::numeric, 0.095::numeric, 'Bracket 4'),
  (20000::numeric,   29999.99::numeric,0.045::numeric, 0.095::numeric, 'Bracket 5'),
  (30000::numeric,   null::numeric,    0.045::numeric, 0.095::numeric, 'Ceiling bracket')
) as x(min_salary, max_salary, ee_rate, er_rate, notes)
on conflict (benefit_plan_id, effective_year, min_salary) do update set
  max_salary    = excluded.max_salary,
  employee_rate = excluded.employee_rate,
  employer_rate = excluded.employer_rate,
  notes         = excluded.notes;

-- PhilHealth 2026 (5% total, split equally)
insert into public.statutory_contribution_rules
  (benefit_plan_id, effective_year, min_salary, max_salary, employee_rate, employer_rate, employee_fixed, employer_fixed, notes)
values
  ((select id from public.benefit_plans where code = 'PHIC'), 2026, 0, 10000,     0.025, 0.025, 0, 0, 'Floor — min contribution applies'),
  ((select id from public.benefit_plans where code = 'PHIC'), 2026, 10000.01, null, 0.025, 0.025, 0, 0, 'Standard rate on actual salary')
on conflict (benefit_plan_id, effective_year, min_salary) do update set
  max_salary    = excluded.max_salary,
  employee_rate = excluded.employee_rate,
  employer_rate = excluded.employer_rate,
  notes         = excluded.notes;

-- Pag-IBIG 2026 (fixed ₱100 employee / ₱100 employer)
insert into public.statutory_contribution_rules
  (benefit_plan_id, effective_year, min_salary, max_salary, employee_rate, employer_rate, employee_fixed, employer_fixed, notes)
values
  ((select id from public.benefit_plans where code = 'HDMF'), 2026, 0, null, 0, 0, 100, 100, 'Fixed monthly contribution')
on conflict (benefit_plan_id, effective_year, min_salary) do update set
  max_salary    = excluded.max_salary,
  employee_fixed = excluded.employee_fixed,
  employer_fixed = excluded.employer_fixed,
  notes          = excluded.notes;

-- ============================================================================
-- TAX TABLES — BIR Monthly Withholding Tax 2023+ (TRAIN Law)
-- ============================================================================
insert into public.tax_tables (effective_year, name, frequency, is_active)
values
  (2023, 'BIR Monthly Withholding Tax (TRAIN)', 'Monthly', true),
  (2023, 'BIR Semi-Monthly Withholding Tax (TRAIN)', 'Semi-Monthly', true)
on conflict (effective_year, frequency) do update set
  name      = excluded.name,
  is_active = excluded.is_active;

-- Monthly brackets
insert into public.tax_brackets (tax_table_id, income_from, income_to, base_tax, rate_above)
select
  (select id from public.tax_tables where effective_year = 2023 and frequency = 'Monthly'),
  x.from_amt,
  x.to_amt,
  x.base_tax,
  x.rate
from (values
  (0::numeric,       20833::numeric,   0::numeric,     0.00::numeric),
  (20833::numeric,   33332::numeric,   0::numeric,     0.20::numeric),
  (33333::numeric,   66666::numeric,   2500::numeric,  0.25::numeric),
  (66667::numeric,   166666::numeric,  10833::numeric, 0.30::numeric),
  (166667::numeric,  666666::numeric,  40833::numeric, 0.32::numeric),
  (666667::numeric,  null::numeric,    200833::numeric,0.35::numeric)
) as x(from_amt, to_amt, base_tax, rate)
on conflict (tax_table_id, income_from) do update set
  income_to  = excluded.income_to,
  base_tax   = excluded.base_tax,
  rate_above = excluded.rate_above;

-- Semi-monthly brackets (monthly values ÷ 2)
insert into public.tax_brackets (tax_table_id, income_from, income_to, base_tax, rate_above)
select
  (select id from public.tax_tables where effective_year = 2023 and frequency = 'Semi-Monthly'),
  x.from_amt,
  x.to_amt,
  x.base_tax,
  x.rate
from (values
  (0::numeric,       10417::numeric,   0::numeric,     0.00::numeric),
  (10417::numeric,   16666::numeric,   0::numeric,     0.20::numeric),
  (16667::numeric,   33333::numeric,   1250::numeric,  0.25::numeric),
  (33334::numeric,   83333::numeric,   5417::numeric,  0.30::numeric),
  (83334::numeric,   333333::numeric,  20417::numeric, 0.32::numeric),
  (333334::numeric,  null::numeric,    100417::numeric,0.35::numeric)
) as x(from_amt, to_amt, base_tax, rate)
on conflict (tax_table_id, income_from) do update set
  income_to  = excluded.income_to,
  base_tax   = excluded.base_tax,
  rate_above = excluded.rate_above;

-- ============================================================================
-- ONBOARDING TEMPLATES
-- ============================================================================
insert into public.onboarding_templates (name, description, is_active)
values
  ('Standard Employee Onboarding', 'Default checklist for all new regular and full-time employees', true),
  ('Part-Time / Contractual Onboarding', 'Simplified checklist for part-time and contractual staff', true),
  ('Faculty Onboarding', 'Onboarding checklist specific to teaching faculty', true)
on conflict (name) do update set
  description = excluded.description,
  is_active   = excluded.is_active;

-- Standard Employee Onboarding tasks
insert into public.onboarding_tasks (template_id, task_name, description, responsible_party, due_day_offset, is_required, sort_order)
select
  (select id from public.onboarding_templates where name = 'Standard Employee Onboarding'),
  x.task_name, x.description, x.responsible, x.due_day, x.is_req, x.sort
from (values
  ('Employment Contract Signing',  'Sign and return employment contract',            'HR',        1, true,  1),
  ('Personal Data Sheet',          'Submit accomplished PDS / BIR Form 1902',        'Employee',  1, true,  2),
  ('Government ID Submission',     'Submit copies of SSS, PhilHealth, Pag-IBIG IDs', 'Employee',  2, true,  3),
  ('TIN Registration / Update',    'Coordinate BIR TIN or update tax details',       'HR',        3, true,  4),
  ('Payroll Bank Account Setup',   'Open or link payroll bank account',              'Employee',  5, true,  5),
  ('School Email Account',         'Request and activate school email account',       'IT',        1, true,  6),
  ('System Login Credentials',     'Create STSN Connect user account',               'IT',        1, true,  7),
  ('Department Assignment Letter', 'Issue department assignment memorandum',         'HR',        3, true,  8),
  ('Orientation Schedule',         'Complete general orientation and school tour',    'HR',        3, true,  9),
  ('Policy Acknowledgement',       'Sign Data Privacy and Employee Handbook receipt','HR',        5, true,  10),
  ('Health Record Submission',     'Submit medical certificate and health records',  'Clinic',    7, true,  11),
  ('ID Photo and Badge',           'Submit 2x2 photo and receive school ID',         'Admin',     5, false, 12)
) as x(task_name, description, responsible, due_day, is_req, sort)
on conflict (template_id, task_name) do update set
  description      = excluded.description,
  responsible_party = excluded.responsible_party,
  due_day_offset   = excluded.due_day_offset,
  is_required      = excluded.is_required,
  sort_order       = excluded.sort_order;

-- Part-Time / Contractual Onboarding tasks
insert into public.onboarding_tasks (template_id, task_name, description, responsible_party, due_day_offset, is_required, sort_order)
select
  (select id from public.onboarding_templates where name = 'Part-Time / Contractual Onboarding'),
  x.task_name, x.description, x.responsible, x.due_day, x.is_req, x.sort
from (values
  ('Service Contract Signing',     'Sign and return service/job order contract',     'HR',        1, true,  1),
  ('Government ID Submission',     'Submit copies of SSS, PhilHealth, Pag-IBIG IDs','Employee',  2, true,  2),
  ('System Login Credentials',     'Create STSN Connect user account',               'IT',        1, true,  3),
  ('Policy Acknowledgement',       'Sign Data Privacy and Employee Handbook receipt','HR',        3, true,  4),
  ('School Email Account',         'Request and activate school email account',       'IT',        2, false, 5)
) as x(task_name, description, responsible, due_day, is_req, sort)
on conflict (template_id, task_name) do update set
  description       = excluded.description,
  responsible_party = excluded.responsible_party,
  due_day_offset    = excluded.due_day_offset,
  is_required       = excluded.is_required,
  sort_order        = excluded.sort_order;

-- Faculty Onboarding tasks
insert into public.onboarding_tasks (template_id, task_name, description, responsible_party, due_day_offset, is_required, sort_order)
select
  (select id from public.onboarding_templates where name = 'Faculty Onboarding'),
  x.task_name, x.description, x.responsible, x.due_day, x.is_req, x.sort
from (values
  ('Employment Contract Signing',  'Sign and return faculty employment contract',    'HR',        1, true,  1),
  ('Personal Data Sheet',          'Submit accomplished PDS',                        'Employee',  1, true,  2),
  ('PRC License Submission',       'Submit copy of valid PRC license',               'HR',        2, true,  3),
  ('Government ID Submission',     'Submit copies of SSS, PhilHealth, Pag-IBIG IDs','Employee',  2, true,  4),
  ('School Email Account',         'Request and activate school email account',       'IT',        1, true,  5),
  ('System Login Credentials',     'Create STSN Connect user account',               'IT',        1, true,  6),
  ('Teaching Load Assignment',     'Receive official teaching load / subjects',       'Registrar', 3, true,  7),
  ('Class Schedule Briefing',      'Review class schedules and room assignments',     'Registrar', 3, true,  8),
  ('Policy Acknowledgement',       'Sign Academic Freedom and Faculty Handbook',     'HR',        5, true,  9),
  ('ID Photo and Badge',           'Submit 2x2 photo and receive school ID',         'Admin',     5, true,  10)
) as x(task_name, description, responsible, due_day, is_req, sort)
on conflict (template_id, task_name) do update set
  description       = excluded.description,
  responsible_party = excluded.responsible_party,
  due_day_offset    = excluded.due_day_offset,
  is_required       = excluded.is_required,
  sort_order        = excluded.sort_order;

-- ============================================================================
-- NATIONAL HOLIDAYS (Philippine 2026 — school_id null = applies to all)
-- ============================================================================
insert into public.holidays (school_id, holiday_date, name, holiday_type, is_active)
values
  (null, '2026-01-01', 'New Year''s Day',                 'Regular',            true),
  (null, '2026-01-27', 'Chinese New Year',                'Special Non-Working', true),
  (null, '2026-02-25', 'EDSA People Power Anniversary',  'Special Non-Working', true),
  (null, '2026-04-02', 'Maundy Thursday',                 'Regular',            true),
  (null, '2026-04-03', 'Good Friday',                     'Regular',            true),
  (null, '2026-04-04', 'Black Saturday',                  'Special Non-Working', true),
  (null, '2026-04-09', 'Araw ng Kagitingan',              'Regular',            true),
  (null, '2026-05-01', 'Labor Day',                       'Regular',            true),
  (null, '2026-06-12', 'Independence Day',                'Regular',            true),
  (null, '2026-08-21', 'Ninoy Aquino Day',                'Special Non-Working', true),
  (null, '2026-08-31', 'National Heroes Day',             'Regular',            true),
  (null, '2026-11-01', 'All Saints'' Day',                'Special Non-Working', true),
  (null, '2026-11-02', 'All Souls'' Day',                 'Special Non-Working', true),
  (null, '2026-11-30', 'Bonifacio Day',                   'Regular',            true),
  (null, '2026-12-08', 'Feast of the Immaculate Conception','Special Non-Working',true),
  (null, '2026-12-24', 'Christmas Eve',                   'Special Non-Working', true),
  (null, '2026-12-25', 'Christmas Day',                   'Regular',            true),
  (null, '2026-12-30', 'Rizal Day',                       'Regular',            true),
  (null, '2026-12-31', 'New Year''s Eve',                 'Special Non-Working', true)
on conflict (school_id, holiday_date) do update set
  name         = excluded.name,
  holiday_type = excluded.holiday_type,
  is_active    = excluded.is_active;

-- ============================================================================
-- MIGRATION FIX:
-- Fixes Postgres type inference errors from VALUES() blocks where date columns
-- were inferred as text, e.g.:
--   column "effective_date" is of type date but expression is of type text
--
-- Apply as a new Supabase migration under:
--   supabase/migrations/<timestamp>_fix_hr_demo_dummy_data_date_casts.sql
-- ============================================================================

begin;

-- ============================================================================
-- STSN CONNECT — HR Module Demo / Dummy Data (OPTIONAL)
-- NOT FOR PRODUCTION. Apply only in development / QA environments.
-- Inserts realistic sample records for the 18 seeded employees.
-- ============================================================================

-- ============================================================================
-- UPDATE EMPLOYEES — add employee_no and employment fields
-- ============================================================================
update public.employees set
  employee_no       = 'EMP-STSN-001',
  employment_status = 'Active',
  hire_date         = '2015-06-01'
where legacy_id = 'emp-registrar';

update public.employees set
  employee_no       = 'EMP-STSN-002',
  employment_status = 'Active',
  hire_date         = '2012-03-15',
  regularization_date = '2012-09-15'
where legacy_id = 'emp-accounting';

update public.employees set
  employee_no       = 'EMP-STSN-003',
  employment_status = 'Active',
  hire_date         = '2016-08-01',
  regularization_date = '2017-02-01'
where legacy_id = 'emp-hr';

update public.employees set
  employee_no       = 'EMP-STSN-004',
  employment_status = 'Active',
  hire_date         = '2019-06-10',
  regularization_date = '2019-12-10'
where legacy_id = 'emp-assistant';

update public.employees set
  employee_no       = 'EMP-STSN-005',
  employment_status = 'Active',
  hire_date         = '2018-07-15'
where legacy_id = 'emp-stsn-05';

update public.employees set
  employee_no       = 'EMP-STSN-006',
  employment_status = 'Active',
  hire_date         = '2017-06-01'
where legacy_id = 'emp-stsn-06';

update public.employees set
  employee_no       = 'EMP-STSN-007',
  employment_status = 'Active',
  hire_date         = '2020-08-03'
where legacy_id = 'emp-stsn-07';

update public.employees set
  employee_no       = 'EMP-STSN-008',
  employment_status = 'Active',
  hire_date         = '2021-06-01'
where legacy_id = 'emp-stsn-08';

update public.employees set
  employee_no       = 'EMP-STSN-009',
  employment_status = 'Active',
  hire_date         = '2023-06-01'
where legacy_id = 'emp-stsn-09';

update public.employees set
  employee_no       = 'EMP-STSN-010',
  employment_status = 'Active',
  hire_date         = '2024-08-01'
where legacy_id = 'emp-stsn-10';

update public.employees set
  employee_no       = 'EMP-CDSTA-001',
  employment_status = 'Active',
  hire_date         = '2014-06-01',
  regularization_date = '2014-12-01'
where legacy_id = 'emp-cdsta-01';

update public.employees set
  employee_no       = 'EMP-CDSTA-002',
  employment_status = 'Active',
  hire_date         = '2011-06-01',
  regularization_date = '2011-12-01'
where legacy_id = 'emp-cdsta-02';

update public.employees set
  employee_no       = 'EMP-CDSTA-003',
  employment_status = 'Active',
  hire_date         = '2015-08-01',
  regularization_date = '2016-02-01'
where legacy_id = 'emp-cdsta-03';

update public.employees set
  employee_no       = 'EMP-CDSTA-004',
  employment_status = 'Active',
  hire_date         = '2016-06-01',
  regularization_date = '2016-12-01'
where legacy_id = 'emp-cdsta-04';

update public.employees set
  employee_no       = 'EMP-CDSTA-005',
  employment_status = 'Active',
  hire_date         = '2019-08-01'
where legacy_id = 'emp-cdsta-05';

update public.employees set
  employee_no       = 'EMP-CDSTA-006',
  employment_status = 'Active',
  hire_date         = '2020-08-01'
where legacy_id = 'emp-cdsta-06';

update public.employees set
  employee_no       = 'EMP-CDSTA-007',
  employment_status = 'Active',
  hire_date         = '2021-06-01'
where legacy_id = 'emp-cdsta-07';

update public.employees set
  employee_no       = 'EMP-CDSTA-008',
  employment_status = 'Active',
  hire_date         = '2018-01-15'
where legacy_id = 'emp-cdsta-08';

-- ============================================================================
-- EMPLOYEE LIFECYCLE EVENTS (Hired event for key employees)
-- ============================================================================
insert into public.employee_lifecycle_events
  (employee_id, event_type, from_status, to_status, effective_date, remarks, created_by)
select
  e.id,
  x.event_type,
  x.from_status,
  x.to_status,
  x.effective_date::date,
  x.remarks,
  'System'
from (values
  ('emp-registrar',  'Hired',          null,          'Probationary', '2015-06-01', 'Initial hire as Probationary'),
  ('emp-registrar',  'Regularization', 'Probationary','Regular',      '2015-12-01', 'Passed probationary period'),
  ('emp-accounting', 'Hired',          null,          'Regular',      '2012-03-15', 'Hired directly as regular employee'),
  ('emp-hr',         'Hired',          null,          'Probationary', '2016-08-01', 'Initial hire as Probationary'),
  ('emp-hr',         'Regularization', 'Probationary','Regular',      '2017-02-01', 'Regularized after 6 months'),
  ('emp-stsn-09',    'Hired',          null,          'Probationary', '2023-06-01', 'Hired as Part-Time Instructor'),
  ('emp-stsn-10',    'Hired',          null,          'Probationary', '2024-08-01', 'New contractual hire for AY 2024-2025')
) as x(legacy_id, event_type, from_status, to_status, effective_date, remarks)
join public.employees e on e.legacy_id = x.legacy_id;

-- ============================================================================
-- EMPLOYEE SHIFT ASSIGNMENTS
-- ============================================================================
insert into public.employee_shift_assignments
  (employee_id, shift_template_id, effective_from, rest_days)
select
  e.id,
  s.id,
  x.effective_from::date,
  x.rest_days
from (values
  ('emp-registrar',  'DAY',     '2026-01-01', array['Saturday','Sunday']),
  ('emp-accounting', 'DAY',     '2026-01-01', array['Saturday','Sunday']),
  ('emp-hr',         'DAY',     '2026-01-01', array['Saturday','Sunday']),
  ('emp-assistant',  'DAY',     '2026-01-01', array['Saturday','Sunday']),
  ('emp-stsn-05',    'DAY',     '2026-01-01', array['Saturday','Sunday']),
  ('emp-stsn-06',    'DAY',     '2026-01-01', array['Saturday','Sunday']),
  ('emp-stsn-07',    'DAY',     '2026-01-01', array['Saturday','Sunday']),
  ('emp-stsn-08',    'FACULTY', '2026-01-01', array['Sunday']),
  ('emp-stsn-09',    'PART',    '2026-01-01', array['Wednesday','Saturday','Sunday']),
  ('emp-stsn-10',    'FACULTY', '2026-06-01', array['Sunday'])
) as x(legacy_id, shift_code, effective_from, rest_days)
join public.employees e on e.legacy_id = x.legacy_id
join public.shift_templates s on s.code = x.shift_code and s.school_id is null;

-- ============================================================================
-- LEAVE CREDITS (2026 — for all STSN active employees)
-- ============================================================================
insert into public.leave_credits
  (employee_id, leave_type_id, year, credited_days, used_days, balance_days)
select
  e.id,
  lt.id,
  2026,
  lt.default_credits,
  x.used_days,
  lt.default_credits - x.used_days
from (values
  ('emp-registrar',  'VL', 2.0),
  ('emp-registrar',  'SL', 1.0),
  ('emp-accounting', 'VL', 0.0),
  ('emp-accounting', 'SL', 0.0),
  ('emp-hr',         'VL', 1.0),
  ('emp-hr',         'SL', 2.0),
  ('emp-assistant',  'VL', 0.0),
  ('emp-assistant',  'SL', 0.0),
  ('emp-stsn-05',    'VL', 1.0),
  ('emp-stsn-05',    'SL', 1.0),
  ('emp-stsn-06',    'VL', 0.0),
  ('emp-stsn-06',    'SL', 0.5),
  ('emp-stsn-07',    'VL', 0.0),
  ('emp-stsn-07',    'SL', 0.0),
  ('emp-stsn-08',    'VL', 0.0),
  ('emp-stsn-08',    'SL', 0.0)
) as x(legacy_id, lt_code, used_days)
join public.employees e on e.legacy_id = x.legacy_id
join public.leave_types lt on lt.code = x.lt_code
on conflict (employee_id, leave_type_id, year) do update set
  used_days    = excluded.used_days,
  balance_days = excluded.balance_days,
  updated_at   = now();

-- ============================================================================
-- LEAVE REQUESTS (sample approved + pending)
-- ============================================================================
insert into public.leave_requests
  (employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approved_at)
select
  e.id,
  lt.id,
  x.start_date::date,
  x.end_date::date,
  x.total_days,
  x.reason,
  x.status,
  case when x.status = 'Approved' then now() - interval '5 days' else null end
from (values
  ('emp-registrar',  'VL', '2026-06-16', '2026-06-17', 2, 'Family vacation',        'Approved'),
  ('emp-hr',         'SL', '2026-06-10', '2026-06-11', 2, 'Medical consultation',   'Approved'),
  ('emp-hr',         'VL', '2026-07-07', '2026-07-08', 2, 'Personal leave',         'Submitted'),
  ('emp-stsn-05',    'VL', '2026-06-23', '2026-06-23', 1, 'Personal errand',        'Approved'),
  ('emp-stsn-08',    'SL', '2026-06-20', '2026-06-20', 1, 'Fever and flu symptoms', 'Approved'),
  ('emp-stsn-09',    'SL', '2026-06-24', '2026-06-24', 1, 'Not feeling well',       'Submitted')
) as x(legacy_id, lt_code, start_date, end_date, total_days, reason, status)
join public.employees e on e.legacy_id = x.legacy_id
join public.leave_types lt on lt.code = x.lt_code;

-- ============================================================================
-- EMPLOYEE ATTENDANCE — June 2026, Week of June 16–20 (STSN main employees)
-- ============================================================================
insert into public.employee_attendance
  (employee_id, attendance_date, time_in, time_out, status, late_minutes, undertime_minutes, overtime_minutes)
select
  e.id,
  x.att_date::date,
  case when x.time_in is not null then (x.att_date::date::text || ' ' || x.time_in)::timestamptz else null end,
  case when x.time_out is not null then (x.att_date::date::text || ' ' || x.time_out)::timestamptz else null end,
  x.status,
  x.late_min,
  x.ut_min,
  x.ot_min
from (values
  -- Cynthia Ramos (registrar)
  ('emp-registrar', '2026-06-16', '08:02', '17:00', 'Present',   2,  0,  0),
  ('emp-registrar', '2026-06-17', '08:15', '17:00', 'Late',      15, 0,  0),
  ('emp-registrar', '2026-06-18', null,    null,    'On Leave',  0,  0,  0),
  ('emp-registrar', '2026-06-19', null,    null,    'On Leave',  0,  0,  0),
  ('emp-registrar', '2026-06-20', '07:58', '18:30', 'Present',   0,  0,  90),
  -- Eduardo Bonto (accounting)
  ('emp-accounting','2026-06-16', '07:55', '17:05', 'Present',   0,  0,  5),
  ('emp-accounting','2026-06-17', '08:00', '17:00', 'Present',   0,  0,  0),
  ('emp-accounting','2026-06-18', '08:00', '17:00', 'Present',   0,  0,  0),
  ('emp-accounting','2026-06-19', '08:05', '17:00', 'Present',   5,  0,  0),
  ('emp-accounting','2026-06-20', '08:00', '19:00', 'Present',   0,  0,  120),
  -- Gemma Santos (hr)
  ('emp-hr',        '2026-06-16', '08:00', '17:00', 'Present',   0,  0,  0),
  ('emp-hr',        '2026-06-17', '08:00', '17:00', 'Present',   0,  0,  0),
  ('emp-hr',        '2026-06-18', '08:20', '17:00', 'Late',      20, 0,  0),
  ('emp-hr',        '2026-06-19', '08:00', '17:00', 'Present',   0,  0,  0),
  ('emp-hr',        '2026-06-20', '08:00', '17:00', 'Present',   0,  0,  0),
  -- Ronaldo Mercado (assistant)
  ('emp-assistant', '2026-06-16', '08:00', '17:00', 'Present',   0,  0,  0),
  ('emp-assistant', '2026-06-17', '08:00', '17:00', 'Present',   0,  0,  0),
  ('emp-assistant', '2026-06-18', '08:00', '16:30', 'Undertime', 0,  30, 0),
  ('emp-assistant', '2026-06-19', '08:00', '17:00', 'Present',   0,  0,  0),
  ('emp-assistant', '2026-06-20', null,    null,    'Absent',    0,  0,  0),
  -- Mariflor Belen (guidance counselor)
  ('emp-stsn-05',   '2026-06-16', '08:00', '17:00', 'Present',   0,  0,  0),
  ('emp-stsn-05',   '2026-06-17', '08:00', '17:00', 'Present',   0,  0,  0),
  ('emp-stsn-05',   '2026-06-18', '08:00', '17:00', 'Present',   0,  0,  0),
  ('emp-stsn-05',   '2026-06-19', null,    null,    'On Leave',  0,  0,  0),
  ('emp-stsn-05',   '2026-06-20', '08:00', '17:00', 'Present',   0,  0,  0),
  -- Danilo Cruz (instructor)
  ('emp-stsn-08',   '2026-06-16', '07:30', '17:00', 'Present',   0,  0,  0),
  ('emp-stsn-08',   '2026-06-17', '07:30', '17:00', 'Present',   0,  0,  0),
  ('emp-stsn-08',   '2026-06-18', '07:30', '17:00', 'Present',   0,  0,  0),
  ('emp-stsn-08',   '2026-06-19', '07:30', '17:00', 'Present',   0,  0,  0),
  ('emp-stsn-08',   '2026-06-20', '07:30', '17:00', 'Present',   0,  0,  0)
) as x(legacy_id, att_date, time_in, time_out, status, late_min, ut_min, ot_min)
join public.employees e on e.legacy_id = x.legacy_id
on conflict (employee_id, attendance_date) do update set
  time_in           = excluded.time_in,
  time_out          = excluded.time_out,
  status            = excluded.status,
  late_minutes      = excluded.late_minutes,
  undertime_minutes = excluded.undertime_minutes,
  overtime_minutes  = excluded.overtime_minutes,
  updated_at        = now();

-- ============================================================================
-- PAYROLL PERIODS
-- ============================================================================
insert into public.payroll_periods
  (school_id, period_code, label, start_date, end_date, payout_date, status)
select
  s.id,
  x.period_code,
  x.label,
  x.start_date::date,
  x.end_date::date,
  x.payout_date::date,
  x.status
from (values
  ('STSN', 'STSN-2026-06-1', 'June 1-15, 2026',  '2026-06-01', '2026-06-15', '2026-06-15', 'Closed'),
  ('STSN', 'STSN-2026-06-2', 'June 16-30, 2026', '2026-06-16', '2026-06-30', '2026-06-30', 'Open')
) as x(school_code, period_code, label, start_date, end_date, payout_date, status)
join public.schools s on s.code = x.school_code
on conflict (school_id, period_code) do update set
  label       = excluded.label,
  start_date  = excluded.start_date,
  end_date    = excluded.end_date,
  payout_date = excluded.payout_date,
  status      = excluded.status;

-- ============================================================================
-- PAYROLL RUNS
-- ============================================================================
insert into public.payroll_runs
  (school_id, payroll_period_id, run_no, status, computed_by, approved_by, computed_at, approved_at)
select
  s.id,
  pp.id,
  x.run_no,
  x.status,
  x.computed_by,
  x.approved_by,
  x.computed_at::timestamptz,
  x.approved_at::timestamptz
from (values
  ('STSN', 'STSN-2026-06-1', 'RUN-2026-06-1-001', 'Released', 'Gemma Santos', 'Eduardo Bonto', '2026-06-14 10:00:00', '2026-06-14 15:00:00')
) as x(school_code, period_code, run_no, status, computed_by, approved_by, computed_at, approved_at)
join public.schools s on s.code = x.school_code
join public.payroll_periods pp on pp.school_id = s.id and pp.period_code = x.period_code
on conflict (school_id, run_no) do update set
  status      = excluded.status,
  computed_by = excluded.computed_by,
  approved_by = excluded.approved_by,
  computed_at = excluded.computed_at,
  approved_at = excluded.approved_at,
  updated_at  = now();

-- ============================================================================
-- PAYROLL LINES (June 1-15 run for core STSN employees)
-- ============================================================================
insert into public.payroll_lines
  (payroll_run_id, employee_id, basic_pay, allowances, sss_deduction, philhealth_deduction,
   pagibig_deduction, withholding_tax, gross_pay, net_pay, status)
select
  pr.id,
  e.id,
  x.basic_pay,
  x.allowances,
  x.sss,
  x.phic,
  x.hdmf,
  x.tax,
  x.basic_pay + x.allowances,
  (x.basic_pay + x.allowances) - (x.sss + x.phic + x.hdmf + x.tax),
  'Released'
from (values
  ('emp-registrar',  21000::numeric, 1750::numeric, 1200::numeric, 525::numeric,  100::numeric, 2100::numeric),
  ('emp-accounting', 29000::numeric, 2100::numeric, 1600::numeric, 725::numeric,  100::numeric, 5200::numeric),
  ('emp-hr',         22500::numeric, 1750::numeric, 1300::numeric, 563::numeric,  100::numeric, 3500::numeric),
  ('emp-assistant',  11000::numeric, 0::numeric,    550::numeric,  275::numeric,  100::numeric, 0::numeric),
  ('emp-stsn-05',    16000::numeric, 0::numeric,    900::numeric,  400::numeric,  100::numeric, 1200::numeric),
  ('emp-stsn-06',    14000::numeric, 0::numeric,    800::numeric,  350::numeric,  100::numeric, 800::numeric),
  ('emp-stsn-07',    13500::numeric, 0::numeric,    750::numeric,  338::numeric,  100::numeric, 700::numeric),
  ('emp-stsn-08',    15000::numeric, 2000::numeric, 850::numeric,  375::numeric,  100::numeric, 900::numeric)
) as x(legacy_id, basic_pay, allowances, sss, phic, hdmf, tax)
join public.employees e on e.legacy_id = x.legacy_id
join public.payroll_runs pr on pr.run_no = 'RUN-2026-06-1-001'
on conflict (payroll_run_id, employee_id) do update set
  basic_pay            = excluded.basic_pay,
  allowances           = excluded.allowances,
  sss_deduction        = excluded.sss_deduction,
  philhealth_deduction = excluded.philhealth_deduction,
  pagibig_deduction    = excluded.pagibig_deduction,
  withholding_tax      = excluded.withholding_tax,
  gross_pay            = excluded.gross_pay,
  net_pay              = excluded.net_pay,
  status               = excluded.status,
  updated_at           = now();

-- ============================================================================
-- SALARY PAYOUT BATCH (released for June 1-15 run)
-- ============================================================================
insert into public.salary_payout_batches
  (payroll_run_id, payout_no, payout_method, status, released_by, released_at)
select
  pr.id,
  'PAY-2026-06-001',
  'Bank Transfer',
  'Released',
  'Eduardo Bonto',
  '2026-06-15 13:00:00'::timestamptz
from public.payroll_runs pr
where pr.run_no = 'RUN-2026-06-1-001'
on conflict (payout_no) do update set
  status      = excluded.status,
  released_by = excluded.released_by,
  released_at = excluded.released_at,
  updated_at  = now();

-- Payout lines for each payroll line in the run
insert into public.salary_payout_lines
  (payout_batch_id, payroll_line_id, employee_id, amount, reference_no, status, released_at)
select
  spb.id,
  pl.id,
  pl.employee_id,
  pl.net_pay,
  'BT-2026-06-' || row_number() over (order by pl.created_at),
  'Released',
  '2026-06-15 13:00:00'::timestamptz
from public.salary_payout_batches spb
join public.payroll_runs pr on pr.id = spb.payroll_run_id and pr.run_no = 'RUN-2026-06-1-001'
join public.payroll_lines pl on pl.payroll_run_id = pr.id;

-- ============================================================================
-- JOB REQUISITIONS (2 open positions)
-- ============================================================================
insert into public.job_requisitions
  (school_id, requisition_no, position_title, department, employment_type, head_count, reason, target_start_date, status, requested_by)
select
  s.id,
  x.req_no,
  x.position_title,
  x.department,
  x.emp_type,
  x.head_count,
  x.reason,
  x.target_start_date::date,
  x.status,
  x.requested_by
from (values
  ('STSN', 'REQ-2026-001', 'Instructor I — Computer Science', 'Basic Education', 'Full-Time', 1, 'New AY 2026-2027 enrollment increase', '2026-08-01', 'Posted', 'Gemma Santos'),
  ('STSN', 'REQ-2026-002', 'Administrative Assistant II',     'Administration',   'Full-Time', 1, 'Replacement for vacated position',       '2026-07-15', 'Screening', 'Gemma Santos')
) as x(school_code, req_no, position_title, department, emp_type, head_count, reason, target_start_date, status, requested_by)
join public.schools s on s.code = x.school_code
on conflict (requisition_no) do update set
  status = excluded.status;

-- ============================================================================
-- JOB APPLICANTS (sample applicants for REQ-2026-002)
-- ============================================================================
insert into public.job_applicants
  (job_requisition_id, first_name, last_name, middle_name, email, contact, applied_at, status)
select
  jr.id,
  x.first_name,
  x.last_name,
  x.middle_name,
  x.email,
  x.contact,
  x.applied_at::timestamptz,
  x.status
from (values
  ('Annie',  'Tamayo',   'Cruz',     'annie.tamayo@email.com',   '+639171110001', '2026-06-10', 'For Interview'),
  ('Rodel',  'Dela Paz', 'Santos',   'rodel.delapaz@email.com',  '+639171110002', '2026-06-11', 'For Screening'),
  ('Liza',   'Morales',  'Reyes',    'liza.morales@email.com',   '+639171110003', '2026-06-12', 'For Screening')
) as x(first_name, last_name, middle_name, email, contact, applied_at, status)
join public.job_requisitions jr on jr.requisition_no = 'REQ-2026-002';

-- ============================================================================
-- EMPLOYEE TAX PROFILES (for STSN main employees)
-- ============================================================================
insert into public.employee_tax_profiles
  (employee_id, tax_code, dependents_count, is_minimum_wage_earner, is_tax_exempt)
select
  e.id,
  x.tax_code,
  x.dependents,
  x.is_mwe,
  x.is_exempt
from (values
  ('emp-registrar',  'ME', 2, false, false),
  ('emp-accounting', 'ME', 3, false, false),
  ('emp-hr',         'ME', 1, false, false),
  ('emp-assistant',  'S',  0, false, false),
  ('emp-stsn-05',    'ME', 2, false, false),
  ('emp-stsn-06',    'ME', 1, false, false),
  ('emp-stsn-07',    'S',  0, false, false),
  ('emp-stsn-08',    'ME', 2, false, false)
) as x(legacy_id, tax_code, dependents, is_mwe, is_exempt)
join public.employees e on e.legacy_id = x.legacy_id
on conflict (employee_id) do update set
  tax_code        = excluded.tax_code,
  dependents_count = excluded.dependents_count,
  updated_at      = now();

-- ============================================================================
-- EMPLOYEE ONBOARDING TASKS (for emp-stsn-10, recently hired contractual)
-- ============================================================================
insert into public.employee_onboarding_tasks
  (employee_id, onboarding_task_id, due_date, status, completed_at, completed_by)
select
  e.id,
  ot.id,
  '2026-08-01'::date + ot.due_day_offset,
  case
    when ot.task_name in ('Employment Contract Signing','System Login Credentials','School Email Account') then 'Completed'
    when ot.task_name = 'Teaching Load Assignment' then 'In Progress'
    else 'Pending'
  end,
  case when ot.task_name in ('Employment Contract Signing','System Login Credentials','School Email Account')
    then '2026-08-01'::timestamptz
    else null
  end,
  case when ot.task_name in ('Employment Contract Signing','System Login Credentials','School Email Account')
    then 'HR Admin'
    else null
  end
from public.employees e
join public.onboarding_templates tmpl on tmpl.name = 'Part-Time / Contractual Onboarding'
join public.onboarding_tasks ot on ot.template_id = tmpl.id
where e.legacy_id = 'emp-stsn-10'
on conflict (employee_id, onboarding_task_id) do update set
  status       = excluded.status,
  completed_at = excluded.completed_at,
  completed_by = excluded.completed_by,
  updated_at   = now();

commit;

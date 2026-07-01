-- ============================================================================
-- STSN CONNECT — HR & Payroll Reference Data (setup_items categories)
-- ----------------------------------------------------------------------------
-- This project stores generic dropdown / filter / reference lists as rows in
-- the existing public.setup_items table, keyed by `category` (see migration
-- 0001_schema.sql §2 and the seeds in 0003_data.sql / 0004_additional_data.sql).
--
-- The HR & Payroll audit (docs/HR_PAYROLL_REFERENCE_TABLE_AUDIT.md) found that
-- several lookups are still hardcoded in TypeScript constants or only enforced
-- by table CHECK constraints, with NO matching setup_items category. This
-- migration adds ONLY the missing reference categories so those values become
-- editable master data and reusable across HR/Payroll dropdowns and filters.
--
-- Safety / scope:
--   * Additive only. No tables created, dropped, altered, or truncated.
--   * No CHECK constraints changed and no foreign keys added — existing DB
--     enums and payroll/attendance/leave logic are left exactly as-is. These
--     rows are reference/UI master data that mirror those enums.
--   * Idempotent: ON CONFLICT (category, code) DO NOTHING, so re-running is safe
--     and never overwrites values an admin may have edited via Core Setup.
--   * No RLS changes — setup_items already has its policies (0002_rls.sql).
--
-- Categories that ALREADY EXIST in setup_items are intentionally NOT touched:
--   departments, position_titles, employment_types, civil_statuses,
--   nationalities, religions, document_types, payment_methods, faculty_ranks,
--   days_of_week, holidays.
-- ============================================================================

-- ============================================================================
-- 1. EMPLOYMENT (LIFECYCLE) STATUSES
--    Source today: EMPLOYMENT_STATUSES const in
--    src/features/hr/utils/payrollCalculations.ts + employees.employment_status
--    (free-text column, no CHECK). Used by the EmployeeLifecyclePage filter.
-- ============================================================================
insert into public.setup_items (legacy_id, category, code, name, description, is_active, sort_order, metadata, created_by, created_at) values
  ('empstat-1',  'employment_statuses', 'APPLICANT',    'Applicant',      'Candidate in recruitment pipeline',      true, 0,  '{}'::jsonb, 'System Migration', now()),
  ('empstat-2',  'employment_statuses', 'FORONBOARD',   'For Onboarding', 'Hired, completing onboarding checklist',  true, 1,  '{}'::jsonb, 'System Migration', now()),
  ('empstat-3',  'employment_statuses', 'PROBATION',    'Probationary',   'Within probationary period',              true, 2,  '{}'::jsonb, 'System Migration', now()),
  ('empstat-4',  'employment_statuses', 'ACTIVE',       'Active',         'Currently employed and working',          true, 3,  '{}'::jsonb, 'System Migration', now()),
  ('empstat-5',  'employment_statuses', 'REGULAR',      'Regular',        'Regularized / permanent employee',        true, 4,  '{}'::jsonb, 'System Migration', now()),
  ('empstat-6',  'employment_statuses', 'ONLEAVE',      'On Leave',       'Temporarily on approved leave',           true, 5,  '{}'::jsonb, 'System Migration', now()),
  ('empstat-7',  'employment_statuses', 'SUSPENDED',    'Suspended',      'Suspended pending disciplinary action',   true, 6,  '{}'::jsonb, 'System Migration', now()),
  ('empstat-8',  'employment_statuses', 'RESIGNED',     'Resigned',       'Voluntarily separated',                   true, 7,  '{}'::jsonb, 'System Migration', now()),
  ('empstat-9',  'employment_statuses', 'TERMINATED',   'Terminated',     'Involuntarily separated',                 true, 8,  '{}'::jsonb, 'System Migration', now()),
  ('empstat-10', 'employment_statuses', 'RETIRED',      'Retired',        'Retired from service',                    true, 9,  '{}'::jsonb, 'System Migration', now()),
  ('empstat-11', 'employment_statuses', 'INACTIVE',     'Inactive',       'Inactive / archived record',              true, 10, '{}'::jsonb, 'System Migration', now())
on conflict (category, code) do nothing;

-- ============================================================================
-- 2. GENDERS
--    Source today: 'Male'/'Female' CHECK on students.gender. No setup_items row.
-- ============================================================================
insert into public.setup_items (legacy_id, category, code, name, description, is_active, sort_order, metadata, created_by, created_at) values
  ('gender-1', 'genders', 'M', 'Male',   '', true, 0, '{}'::jsonb, 'System Migration', now()),
  ('gender-2', 'genders', 'F', 'Female', '', true, 1, '{}'::jsonb, 'System Migration', now())
on conflict (category, code) do nothing;

-- ============================================================================
-- 3. EDUCATION LEVELS
--    Source today: EDUCATION_LEVEL_OPTIONS const (StaffProfileWorkspace /
--    StudentPortalPage) + education_level CHECK on
--    employee_education_backgrounds / student_education_backgrounds.
-- ============================================================================
insert into public.setup_items (legacy_id, category, code, name, description, is_active, sort_order, metadata, created_by, created_at) values
  ('edlvl-1', 'education_levels', 'ELEM',  'Elementary',          '', true, 0, '{}'::jsonb, 'System Migration', now()),
  ('edlvl-2', 'education_levels', 'JHS',   'Junior High School',  '', true, 1, '{}'::jsonb, 'System Migration', now()),
  ('edlvl-3', 'education_levels', 'SHS',   'Senior High School',  '', true, 2, '{}'::jsonb, 'System Migration', now()),
  ('edlvl-4', 'education_levels', 'COLL',  'College',             '', true, 3, '{}'::jsonb, 'System Migration', now()),
  ('edlvl-5', 'education_levels', 'GRAD',  'Graduate Studies',    '', true, 4, '{}'::jsonb, 'System Migration', now()),
  ('edlvl-6', 'education_levels', 'VOC',   'Vocational',          '', true, 5, '{}'::jsonb, 'System Migration', now()),
  ('edlvl-7', 'education_levels', 'OTHER', 'Other',               '', true, 6, '{}'::jsonb, 'System Migration', now())
on conflict (category, code) do nothing;

-- ============================================================================
-- 4. RELATIONSHIP TYPES (dependents / emergency contacts)
--    Source today: CONTACT_TYPE_OPTIONS const + free-text relationship on
--    employee_dependents / employee_profile_contacts.contact_type CHECK.
-- ============================================================================
insert into public.setup_items (legacy_id, category, code, name, description, is_active, sort_order, metadata, created_by, created_at) values
  ('reltype-1', 'relationship_types', 'SPOUSE',  'Spouse',            '', true, 0, '{}'::jsonb, 'System Migration', now()),
  ('reltype-2', 'relationship_types', 'PARENT',  'Parent',            '', true, 1, '{}'::jsonb, 'System Migration', now()),
  ('reltype-3', 'relationship_types', 'CHILD',   'Child',             '', true, 2, '{}'::jsonb, 'System Migration', now()),
  ('reltype-4', 'relationship_types', 'SIBLING', 'Sibling',           '', true, 3, '{}'::jsonb, 'System Migration', now()),
  ('reltype-5', 'relationship_types', 'RELATIVE','Relative',          '', true, 4, '{}'::jsonb, 'System Migration', now()),
  ('reltype-6', 'relationship_types', 'EMERG',   'Emergency Contact', '', true, 5, '{}'::jsonb, 'System Migration', now()),
  ('reltype-7', 'relationship_types', 'OTHER',   'Other',             '', true, 6, '{}'::jsonb, 'System Migration', now())
on conflict (category, code) do nothing;

-- ============================================================================
-- 5. ATTENDANCE STATUSES  (UI/report mirror of employee_attendance.status CHECK)
--    Source today: ATTENDANCE_STATUSES const in payrollCalculations.ts.
--    DB CHECK constraint is left in place — this is reference data for filters.
-- ============================================================================
insert into public.setup_items (legacy_id, category, code, name, description, is_active, sort_order, metadata, created_by, created_at) values
  ('attst-1', 'attendance_statuses', 'PRESENT',  'Present',            '', true, 0, '{}'::jsonb, 'System Migration', now()),
  ('attst-2', 'attendance_statuses', 'LATE',     'Late',               '', true, 1, '{}'::jsonb, 'System Migration', now()),
  ('attst-3', 'attendance_statuses', 'UNDERTIME','Undertime',          '', true, 2, '{}'::jsonb, 'System Migration', now()),
  ('attst-4', 'attendance_statuses', 'ABSENT',   'Absent',             '', true, 3, '{}'::jsonb, 'System Migration', now()),
  ('attst-5', 'attendance_statuses', 'ONLEAVE',  'On Leave',           '', true, 4, '{}'::jsonb, 'System Migration', now()),
  ('attst-6', 'attendance_statuses', 'OB',       'Official Business',  '', true, 5, '{}'::jsonb, 'System Migration', now()),
  ('attst-7', 'attendance_statuses', 'HOLIDAY',  'Holiday',            '', true, 6, '{}'::jsonb, 'System Migration', now()),
  ('attst-8', 'attendance_statuses', 'RESTDAY',  'Rest Day',           '', true, 7, '{}'::jsonb, 'System Migration', now()),
  ('attst-9', 'attendance_statuses', 'HALFDAY',  'Half Day',           '', true, 8, '{}'::jsonb, 'System Migration', now())
on conflict (category, code) do nothing;

-- ============================================================================
-- 6. LEAVE STATUSES  (UI/report mirror of leave_requests.status CHECK)
-- ============================================================================
insert into public.setup_items (legacy_id, category, code, name, description, is_active, sort_order, metadata, created_by, created_at) values
  ('lvst-1', 'leave_statuses', 'DRAFT',     'Draft',        '', true, 0, '{}'::jsonb, 'System Migration', now()),
  ('lvst-2', 'leave_statuses', 'SUBMITTED', 'Submitted',    '', true, 1, '{}'::jsonb, 'System Migration', now()),
  ('lvst-3', 'leave_statuses', 'FORAPPR',   'For Approval', '', true, 2, '{}'::jsonb, 'System Migration', now()),
  ('lvst-4', 'leave_statuses', 'APPROVED',  'Approved',     '', true, 3, '{}'::jsonb, 'System Migration', now()),
  ('lvst-5', 'leave_statuses', 'REJECTED',  'Rejected',     '', true, 4, '{}'::jsonb, 'System Migration', now()),
  ('lvst-6', 'leave_statuses', 'CANCELLED', 'Cancelled',    '', true, 5, '{}'::jsonb, 'System Migration', now())
on conflict (category, code) do nothing;

-- ============================================================================
-- 7. HOLIDAY TYPES  (UI/report mirror of holidays.holiday_type CHECK)
-- ============================================================================
insert into public.setup_items (legacy_id, category, code, name, description, is_active, sort_order, metadata, created_by, created_at) values
  ('holt-1', 'holiday_types', 'REGULAR',   'Regular',             'Regular holiday (200% premium)',      true, 0, '{}'::jsonb, 'System Migration', now()),
  ('holt-2', 'holiday_types', 'SPECNW',    'Special Non-Working', 'Special non-working (130% premium)',  true, 1, '{}'::jsonb, 'System Migration', now()),
  ('holt-3', 'holiday_types', 'SPECW',     'Special Working',     'Special working (no premium)',        true, 2, '{}'::jsonb, 'System Migration', now()),
  ('holt-4', 'holiday_types', 'LOCAL',     'Local',               'Local / city-declared holiday',       true, 3, '{}'::jsonb, 'System Migration', now())
on conflict (category, code) do nothing;

-- ============================================================================
-- 8. PAYROLL FREQUENCIES
--    Source today: implicit (semi-monthly) in payrollCalculations.ts; also the
--    tax_tables.frequency CHECK. Reference list for payroll period setup.
-- ============================================================================
insert into public.setup_items (legacy_id, category, code, name, description, is_active, sort_order, metadata, created_by, created_at) values
  ('payfreq-1', 'payroll_frequencies', 'MONTHLY',  'Monthly',       'Once per month',          true, 0, '{}'::jsonb, 'System Migration', now()),
  ('payfreq-2', 'payroll_frequencies', 'SEMIMON',  'Semi-Monthly',  'Twice per month (15/30)', true, 1, '{}'::jsonb, 'System Migration', now()),
  ('payfreq-3', 'payroll_frequencies', 'WEEKLY',   'Weekly',        'Once per week',           true, 2, '{}'::jsonb, 'System Migration', now()),
  ('payfreq-4', 'payroll_frequencies', 'DAILY',    'Daily',         'Per working day',         true, 3, '{}'::jsonb, 'System Migration', now())
on conflict (category, code) do nothing;

-- ============================================================================
-- 9. PAYROLL STATUSES  (UI/report mirror of payroll_runs/payroll_lines CHECK)
-- ============================================================================
insert into public.setup_items (legacy_id, category, code, name, description, is_active, sort_order, metadata, created_by, created_at) values
  ('payst-1', 'payroll_statuses', 'DRAFT',     'Draft',      '', true, 0, '{}'::jsonb, 'System Migration', now()),
  ('payst-2', 'payroll_statuses', 'COMPUTED',  'Computed',   '', true, 1, '{}'::jsonb, 'System Migration', now()),
  ('payst-3', 'payroll_statuses', 'FORREVIEW', 'For Review', '', true, 2, '{}'::jsonb, 'System Migration', now()),
  ('payst-4', 'payroll_statuses', 'APPROVED',  'Approved',   '', true, 3, '{}'::jsonb, 'System Migration', now()),
  ('payst-5', 'payroll_statuses', 'RELEASED',  'Released',   '', true, 4, '{}'::jsonb, 'System Migration', now()),
  ('payst-6', 'payroll_statuses', 'CANCELLED', 'Cancelled',  '', true, 5, '{}'::jsonb, 'System Migration', now())
on conflict (category, code) do nothing;

-- ============================================================================
-- 10. PAYOUT METHODS  (payroll-specific; distinct from cashier payment_methods)
--     Source today: salary_payout_batches.payout_method CHECK
--     ('Bank Transfer','Cash','Check'). GCash/Maya added as generic options.
-- ============================================================================
insert into public.setup_items (legacy_id, category, code, name, description, is_active, sort_order, metadata, created_by, created_at) values
  ('payout-1', 'payout_methods', 'BANK',  'Bank Transfer', 'Payroll bank credit', true, 0, '{}'::jsonb, 'System Migration', now()),
  ('payout-2', 'payout_methods', 'CASH',  'Cash',          'Cash payout',          true, 1, '{}'::jsonb, 'System Migration', now()),
  ('payout-3', 'payout_methods', 'CHECK', 'Check',         'Company check',        true, 2, '{}'::jsonb, 'System Migration', now()),
  ('payout-4', 'payout_methods', 'GCASH', 'GCash',         'GCash e-wallet',       true, 3, '{}'::jsonb, 'System Migration', now()),
  ('payout-5', 'payout_methods', 'MAYA',  'Maya',          'Maya e-wallet',        true, 4, '{}'::jsonb, 'System Migration', now())
on conflict (category, code) do nothing;

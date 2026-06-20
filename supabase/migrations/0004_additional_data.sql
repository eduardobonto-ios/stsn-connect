-- ============================================================================
-- STSN CONNECT — Follow-up migration: closes remaining hardcoded-data gaps
-- found in a second audit (fee-calculation engine constants, HR position
-- titles, student guardian records). Purely additive: does NOT touch any
-- existing table, policy, or row from 0001-0003. Safe to run once on top of
-- the already-applied combined_migration.sql.
-- ============================================================================

-- ============================================================================
-- 1. TUITION_FEE_SCHEDULE — replaces mockAssessmentService.ts TUITION_MATRIX
-- ============================================================================
create table if not exists public.tuition_fee_schedule (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  year_level text not null unique,
  tuition numeric not null default 0,
  lab_fee numeric not null default 0,
  computer_fee numeric not null default 0,
  label text,
  sort_order int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 2. MISC_FEE_SCHEDULE — replaces mockAssessmentService.ts MISC_FEE_SCHEDULE
-- ============================================================================
create table if not exists public.misc_fee_schedule (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  fee_name text not null,
  amount numeric not null default 0,
  is_required boolean not null default true,
  note text,
  sort_order int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 3. LAB_FEE_ADJUSTMENTS — replaces SHS_LAB_ADJUSTMENT + COLLEGE_LAB_ADJUSTMENT
-- ============================================================================
create table if not exists public.lab_fee_adjustments (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  scope text not null check (scope in ('SHS', 'College')),
  program_code text not null,
  amount numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (scope, program_code)
);

-- ============================================================================
-- 4. ASSESSMENT_DISCOUNT_OPTIONS — replaces mockAssessmentService.ts
--    DISCOUNT_OPTIONS (the simplified registrar quick-quote list — distinct
--    from the full governance-grade `discount_types` table already migrated)
-- ============================================================================
create table if not exists public.assessment_discount_options (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  code text not null unique,
  label text not null,
  percentage numeric not null default 0,
  badge text,
  sort_order int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 5. ASSESSMENT_PAYMENT_TERM_OPTIONS — replaces mockAssessmentService.ts
--    PAYMENT_TERM_OPTIONS / PAYMENT_TERM_DESCRIPTIONS
-- ============================================================================
create table if not exists public.assessment_payment_term_options (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  term text not null unique,
  description text,
  sort_order int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 6. STUDENT_GUARDIANS — Admission & Enrollment "Guardian Information"
--    (was hardcoded inline in StudentPortalPage.tsx)
-- ============================================================================
create table if not exists public.student_guardians (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  student_id uuid not null references public.students(id) on delete cascade,
  guardian_name text not null,
  relationship text,
  contact_no text,
  email text,
  address text,
  is_primary boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_student_guardians_student on public.student_guardians (student_id);

-- ============================================================================
-- RLS — same permissive development policy pattern as the rest of the schema
-- ============================================================================
do $$
declare
  t text;
begin
  foreach t in array array[
    'tuition_fee_schedule', 'misc_fee_schedule', 'lab_fee_adjustments',
    'assessment_discount_options', 'assessment_payment_term_options', 'student_guardians'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for select to anon, authenticated using (true)', t || '_select_anon_auth', t);
    execute format('create policy %I on public.%I for insert to anon, authenticated with check (true)', t || '_insert_anon_auth', t);
    execute format('create policy %I on public.%I for update to anon, authenticated using (true) with check (true)', t || '_update_anon_auth', t);
    execute format('create policy %I on public.%I for delete to anon, authenticated using (true)', t || '_delete_anon_auth', t);
  end loop;
end $$;

-- ============================================================================
-- SEED DATA — verbatim from src/services/mockAssessmentService.ts and
-- src/features/hr/pages/HRManagementPage.tsx's hardcoded position dropdown
-- ============================================================================

insert into public.tuition_fee_schedule (legacy_id, year_level, tuition, lab_fee, computer_fee, label, sort_order) values
  ('tfs-1',  'Nursery',    10500, 800,  600,  'Preschool — Nursery', 0),
  ('tfs-2',  'Kinder 1',   11000, 900,  700,  'Preschool — Kinder 1', 1),
  ('tfs-3',  'Kinder 2',   11500, 900,  700,  'Preschool — Kinder 2', 2),
  ('tfs-4',  'Grade 1',    14000, 1200, 900,  'Primary — Grade 1', 3),
  ('tfs-5',  'Grade 2',    14000, 1200, 900,  'Primary — Grade 2', 4),
  ('tfs-6',  'Grade 3',    14500, 1200, 1000, 'Primary — Grade 3', 5),
  ('tfs-7',  'Grade 4',    15000, 1500, 1200, 'Intermediate — Grade 4', 6),
  ('tfs-8',  'Grade 5',    15000, 1500, 1200, 'Intermediate — Grade 5', 7),
  ('tfs-9',  'Grade 6',    15500, 1500, 1200, 'Intermediate — Grade 6', 8),
  ('tfs-10', 'Grade 7',    17000, 2000, 1500, 'Junior High — Grade 7', 9),
  ('tfs-11', 'Grade 8',    17000, 2000, 1500, 'Junior High — Grade 8', 10),
  ('tfs-12', 'Grade 9',    17500, 2000, 1500, 'Junior High — Grade 9', 11),
  ('tfs-13', 'Grade 10',   17500, 2000, 1500, 'Junior High — Grade 10', 12),
  ('tfs-14', 'Grade 11',   18500, 2500, 1500, 'Senior High — Grade 11', 13),
  ('tfs-15', 'Grade 12',   18500, 2500, 1500, 'Senior High — Grade 12', 14),
  ('tfs-16', '1st Year',   24000, 3500, 2000, 'College — 1st Year', 15),
  ('tfs-17', '2nd Year',   25000, 3500, 2000, 'College — 2nd Year', 16),
  ('tfs-18', '3rd Year',   25500, 3500, 2000, 'College — 3rd Year', 17),
  ('tfs-19', '4th Year',   26000, 3000, 2000, 'College — 4th Year', 18)
on conflict do nothing;

insert into public.misc_fee_schedule (legacy_id, fee_name, amount, is_required, note, sort_order) values
  ('mfs-1', 'Library Fee', 800, true, 'Annual library access & digital resources', 0),
  ('mfs-2', 'ID & Validation Fee', 300, true, 'School ID card production', 1),
  ('mfs-3', 'Medical / Clinic Fee', 500, true, 'School nurse & clinic fund', 2),
  ('mfs-4', 'Athletic Fund', 700, true, 'Sports & intramurals participation', 3),
  ('mfs-5', 'Registration Fee', 1000, true, 'SY enrollment processing', 4)
on conflict do nothing;

insert into public.lab_fee_adjustments (legacy_id, scope, program_code, amount) values
  ('lfa-shs-1', 'SHS', 'STEM', 3500),
  ('lfa-shs-2', 'SHS', 'HUMSS', 2000),
  ('lfa-shs-3', 'SHS', 'ABM', 2000),
  ('lfa-shs-4', 'SHS', 'GAS', 2000),
  ('lfa-col-1', 'College', 'BSIT', 3500),
  ('lfa-col-2', 'College', 'BSCS', 3500),
  ('lfa-col-3', 'College', 'BSECE', 4000),
  ('lfa-col-4', 'College', 'BSBA', 2000),
  ('lfa-col-5', 'College', 'BSED', 2000),
  ('lfa-col-6', 'College', 'BSTM', 2500),
  ('lfa-col-7', 'College', 'BSN', 4500)
on conflict do nothing;

insert into public.assessment_discount_options (legacy_id, code, label, percentage, badge, sort_order) values
  ('ado-1', 'none', 'None', 0, '', 0),
  ('ado-2', 'academic', 'Academic Scholarship', 25, '25%', 1),
  ('ado-3', 'sibling', 'Sibling Discount', 10, '10%', 2),
  ('ado-4', 'govt', 'Government Subsidy (DepEd/CHED)', 15, '15%', 3),
  ('ado-5', 'faculty', 'Faculty Dependent', 20, '20%', 4),
  ('ado-6', 'partial', 'Financial Assistance Grant', 30, '30%', 5),
  ('ado-7', 'president', 'Presidential Scholarship (Full)', 100, '100%', 6)
on conflict do nothing;

insert into public.assessment_payment_term_options (legacy_id, term, description, sort_order) values
  ('apto-1', 'Cash Basis', 'One-time full payment upon enrollment. No installment fee.', 0),
  ('apto-2', 'Quarterly', 'Downpayment + 3 quarterly installments every 3 months.', 1),
  ('apto-3', 'Semestral', 'Downpayment + midterm + final payment every ~5 months.', 2)
on conflict do nothing;

-- Student guardians (was hardcoded as "Mr. Veloso Sr." in StudentPortalPage.tsx)
insert into public.student_guardians (legacy_id, student_id, guardian_name, relationship, contact_no, is_primary)
select 'sg-1', id, 'Mr. Veloso Sr.', 'Father', '+639171112222', true
from public.students where legacy_id = 'stud-enrico'
on conflict do nothing;

-- HR position titles — new setup_items category (table already exists; this
-- only adds rows under a new category, nothing existing is modified)
insert into public.setup_items (legacy_id, category, code, name, is_active, sort_order) values
  ('postitle-1',  'position_titles', 'INST1', 'Instructor I', true, 0),
  ('postitle-2',  'position_titles', 'INST2', 'Instructor II', true, 1),
  ('postitle-3',  'position_titles', 'INST3', 'Instructor III', true, 2),
  ('postitle-4',  'position_titles', 'ASSTPROF1', 'Assistant Professor I', true, 3),
  ('postitle-5',  'position_titles', 'ASSTPROF2', 'Assistant Professor II', true, 4),
  ('postitle-6',  'position_titles', 'ASSOCPROF', 'Associate Professor', true, 5),
  ('postitle-7',  'position_titles', 'PROF', 'Professor', true, 6),
  ('postitle-8',  'position_titles', 'HRMGR', 'HR Manager', true, 7),
  ('postitle-9',  'position_titles', 'HROFF', 'HR Officer', true, 8),
  ('postitle-10', 'position_titles', 'CHIEFACCT', 'Chief Accountant', true, 9),
  ('postitle-11', 'position_titles', 'ACCT', 'Accountant', true, 10),
  ('postitle-12', 'position_titles', 'SRREG', 'Senior Registrar', true, 11),
  ('postitle-13', 'position_titles', 'REGOFF', 'Registrar Officer', true, 12),
  ('postitle-14', 'position_titles', 'GUID', 'Guidance Counselor', true, 13),
  ('postitle-15', 'position_titles', 'LIB', 'Librarian', true, 14),
  ('postitle-16', 'position_titles', 'NURSE', 'School Nurse', true, 15),
  ('postitle-17', 'position_titles', 'ADMINASST', 'Administrative Assistant', true, 16),
  ('postitle-18', 'position_titles', 'SECHEAD', 'Campus Security Head', true, 17)
on conflict (category, code) do nothing;

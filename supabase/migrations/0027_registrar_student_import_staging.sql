-- ============================================================================
-- STSN Connect - Registrar Student Import Staging and Profile Support
-- ============================================================================
-- Purpose:
-- - Add dedicated LRN support for official DepEd learner identifiers.
-- - Add Registrar-only student profile extension fields.
-- - Add import batch and import row staging tables for auditable masterlist imports.
-- - Keep spreadsheet rows staged and validated before official student records are changed.
--
-- Scope:
-- - Registrar student masterlist import only.
-- - No seed data.
-- - No payments, ledger transactions, or accounting records are created here.
-- ============================================================================

-- ============================================================================
-- 1. Dedicated LRN support on students
-- ============================================================================
alter table public.students
  add column if not exists lrn text;

create unique index if not exists uq_students_lrn_not_blank
  on public.students (lrn)
  where lrn is not null and trim(lrn) <> '';

create index if not exists idx_students_lrn
  on public.students (lrn);

comment on column public.students.lrn is
  'Official Learner Reference Number. Nullable for historical/incomplete records; unique when present and non-blank.';

-- ============================================================================
-- 2. Registrar profile extension
-- ============================================================================
create table if not exists public.student_registrar_profiles (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null unique references public.students(id) on delete cascade,
  lrn text,
  name_extension text,
  student_status text,
  academic_stage text,
  strand text,
  esc_qvr_no text,
  voucher_status text,
  admission_slip_status text,
  import_enrollment_marker text,
  preferred_mode_of_payment text,
  comments_inquiries text,
  confirmation_status text,
  discount_description text,
  discount_amount numeric,
  reservation_amount numeric,
  accounting_mode_of_payment text,
  accounting_or_date date,
  accounting_or_number text,
  assessed_by text,
  previous_school text,
  referral_source text,
  source_import_batch_id uuid,
  source_sheet_row int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_student_registrar_profiles_student
  on public.student_registrar_profiles (student_id);

create index if not exists idx_student_registrar_profiles_lrn
  on public.student_registrar_profiles (lrn);

create index if not exists idx_student_registrar_profiles_batch
  on public.student_registrar_profiles (source_import_batch_id);

comment on table public.student_registrar_profiles is
  'Registrar-specific student profile extension fields sourced from admissions/import workflows.';

comment on column public.student_registrar_profiles.academic_stage is
  'Optional Basic Education stage such as Preschool, Elementary, Junior High School, or Senior High School.';

-- ============================================================================
-- 3. Registrar import batch audit
-- ============================================================================
create table if not exists public.registrar_import_batches (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete set null,
  school_year text not null,
  academic_unit text not null default 'basic-ed'
    check (academic_unit in ('basic-ed','college')),
  import_type text not null default 'student_masterlist',
  source_file_name text not null,
  source_sheet_name text not null default 'DATABASE',
  header_row int not null default 2,
  data_start_row int not null default 3,
  status text not null default 'draft'
    check (status in ('draft','validated','committing','committed','failed','cancelled')),
  total_rows int not null default 0,
  valid_rows int not null default 0,
  warning_rows int not null default 0,
  error_rows int not null default 0,
  duplicate_rows int not null default 0,
  uploaded_by uuid references public.users(id) on delete set null,
  uploaded_at timestamptz not null default now(),
  committed_by uuid references public.users(id) on delete set null,
  committed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_registrar_import_batches_school
  on public.registrar_import_batches (school_id);

create index if not exists idx_registrar_import_batches_status
  on public.registrar_import_batches (status);

create index if not exists idx_registrar_import_batches_uploaded_at
  on public.registrar_import_batches (uploaded_at);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'student_registrar_profiles_source_import_batch_id_fkey'
      and conrelid = 'public.student_registrar_profiles'::regclass
  ) then
    alter table public.student_registrar_profiles
      add constraint student_registrar_profiles_source_import_batch_id_fkey
      foreign key (source_import_batch_id)
      references public.registrar_import_batches(id)
      on delete set null;
  end if;
end $$;

comment on table public.registrar_import_batches is
  'Auditable Registrar import batch header. Official student tables are updated only after validation and commit.';

-- ============================================================================
-- 4. Registrar import row staging
-- ============================================================================
create table if not exists public.registrar_import_rows (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.registrar_import_batches(id) on delete cascade,
  sheet_row_number int not null,
  row_hash text,
  raw_data jsonb not null default '{}'::jsonb,
  normalized_data jsonb not null default '{}'::jsonb,
  validation_errors jsonb not null default '[]'::jsonb,
  validation_warnings jsonb not null default '[]'::jsonb,
  import_status text not null default 'parsed'
    check (import_status in ('parsed','valid','warning','error','duplicate','skipped','committed')),
  matched_student_id uuid references public.students(id) on delete set null,
  committed_student_id uuid references public.students(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (batch_id, sheet_row_number)
);

create index if not exists idx_registrar_import_rows_batch
  on public.registrar_import_rows (batch_id);

create index if not exists idx_registrar_import_rows_status
  on public.registrar_import_rows (import_status);

create index if not exists idx_registrar_import_rows_lrn
  on public.registrar_import_rows ((normalized_data->>'lrn'));

create index if not exists idx_registrar_import_rows_year_level
  on public.registrar_import_rows ((normalized_data->>'yearLevel'));

create index if not exists idx_registrar_import_rows_track_or_course
  on public.registrar_import_rows ((normalized_data->>'trackOrCourse'));

create index if not exists idx_registrar_import_rows_matched_student
  on public.registrar_import_rows (matched_student_id);

create index if not exists idx_registrar_import_rows_committed_student
  on public.registrar_import_rows (committed_student_id);

comment on table public.registrar_import_rows is
  'Per-row staging for Registrar masterlist imports. Stores raw and normalized spreadsheet data plus validation results.';

comment on column public.registrar_import_rows.raw_data is
  'Original spreadsheet row payload preserved for audit and troubleshooting.';

comment on column public.registrar_import_rows.normalized_data is
  'Normalized import payload used for preview and transactional commit.';

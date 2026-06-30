-- STSN CONNECT — Full Supabase migration (schema + RLS + seed data)
-- Generated 2026-06-19T17:14:19Z. Run once in the Supabase SQL Editor.

-- ============================================================================
-- STSN CONNECT — Full schema migration (mock data -> Supabase)
-- Every table uses a UUID primary key plus a `legacy_id` text column that
-- preserves the original mock-data string id (e.g. "stud-enrico"). This lets
-- the seed-data script resolve foreign keys by legacy_id without us having to
-- hand-track generated UUIDs across thousands of rows.
-- ============================================================================

create extension if not exists pgcrypto;

-- ============================================================================
-- 1. SCHOOLS
-- ============================================================================
create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  code text not null unique,
  name text not null,
  short_name text,
  location text,
  academic_unit text not null check (academic_unit in ('basic-ed','college')),
  branding_label text,
  supported_roles text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 2. SETUP_ITEMS — generic reference/lookup data (Core Setup module + all
--    dropdown/filter option lists previously hardcoded across pages).
--    `category` groups items (e.g. 'school_years', 'departments', 'rooms').
--    `metadata` holds category-specific extra fields (mirrors the original
--    SetupItem's `[key: string]: any` dynamic-field design).
-- ============================================================================
create table if not exists public.setup_items (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  category text not null,
  code text not null,
  name text not null,
  description text,
  is_active boolean not null default true,
  sort_order int,
  metadata jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category, code)
);
create index if not exists idx_setup_items_category on public.setup_items (category);

-- ============================================================================
-- 3. USERS
-- ============================================================================
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  school_id uuid references public.schools(id) on delete set null on update cascade,
  email text not null unique,
  name text not null,
  role text not null,
  is_active boolean not null default true,
  avatar_url text,
  department text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 4. COURSES
-- ============================================================================
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  code text not null unique,
  name text not null,
  department text not null check (department in ('Basic Education','College')),
  duration_years int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 5. SUBJECTS
-- ============================================================================
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  code text not null unique,
  name text not null,
  units numeric not null default 0,
  department text not null check (department in ('Basic Education','College')),
  year_level text,
  semester text,
  track_or_course text,
  prerequisites text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 6. TEACHERS
-- ============================================================================
create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  school_id uuid references public.schools(id) on delete set null on update cascade,
  user_id uuid references public.users(id) on delete set null on update cascade,
  first_name text not null,
  last_name text not null,
  middle_name text,
  department text not null check (department in ('Basic Education','College')),
  email text not null unique,
  phone text,
  specialization text,
  advisory_section text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 7. STUDENTS
-- ============================================================================
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  school_id uuid references public.schools(id) on delete set null on update cascade,
  user_id uuid references public.users(id) on delete set null on update cascade,
  student_no text not null unique,
  first_name text not null,
  last_name text not null,
  middle_name text,
  gender text check (gender in ('Male','Female')),
  civil_status text,
  religion text,
  nationality text,
  birthday date,
  birthplace text,
  email text,
  contact_no text,
  address text,
  province text,
  municipality text,
  zip_code text,
  department text not null check (department in ('Basic Education','College')),
  year_level text,
  track_or_course text,
  section text,
  enrollment_status text not null default 'Pending' check (enrollment_status in ('Pending','Enrolled','Approved','Draft','Rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_students_department on public.students (department);
create index if not exists idx_students_school on public.students (school_id);

-- ============================================================================
-- 8. EMPLOYEES
-- ============================================================================
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  school_id uuid references public.schools(id) on delete set null on update cascade,
  first_name text not null,
  last_name text not null,
  middle_name text,
  email text not null unique,
  position text,
  position_title text,
  department text,
  salary numeric not null default 0,
  status text not null default 'Full-Time' check (status in ('Full-Time','Part-Time','Contractual')),
  leave_balance numeric not null default 0,
  contact text,
  address text,
  emergency_contact text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 9. CURRICULUMS  +  10. CURRICULUM_SUBJECTS (junction)
-- ============================================================================
create table if not exists public.curriculums (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  course_code_or_strand text not null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.curriculum_subjects (
  id uuid primary key default gen_random_uuid(),
  curriculum_id uuid not null references public.curriculums(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  year_level text not null,
  semester text not null,
  created_at timestamptz not null default now(),
  unique (curriculum_id, year_level, semester, subject_id)
);

-- ============================================================================
-- 11. SECTIONS  +  12. SECTION_STUDENTS (junction)
-- ============================================================================
create table if not exists public.sections (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  school_id uuid references public.schools(id) on delete set null on update cascade,
  code text not null,
  name text not null,
  department text not null check (department in ('Basic Education','College')),
  year_level text,
  strand_or_track text,
  adviser_id uuid references public.teachers(id) on delete set null on update cascade,
  capacity int not null default 0,
  current_count int not null default 0,
  academic_year text,
  semester text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.section_students (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.sections(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (section_id, student_id)
);

-- ============================================================================
-- 13. ROOMS
-- ============================================================================
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  school_id uuid references public.schools(id) on delete set null on update cascade,
  code text not null,
  name text not null,
  building text,
  floor text,
  capacity int not null default 0,
  type text not null default 'Classroom' check (type in ('Classroom','Laboratory','Gymnasium','Auditorium','Office','Other')),
  is_active boolean not null default true,
  status text not null default 'Available' check (status in ('Available','Under Maintenance','Reserved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 14. CLASS_SCHEDULES (Scheduling module — normalized FKs where the source
--     data referenced an id; section/room kept as text since the original
--     ClassSchedule entity stored them as display strings, not ids)
-- ============================================================================
create table if not exists public.class_schedules (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  subject_id uuid references public.subjects(id) on delete set null on update cascade,
  teacher_id uuid references public.teachers(id) on delete set null on update cascade,
  section text,
  room_name text,
  day text not null check (day in ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday')),
  start_time time,
  end_time time,
  school_year text,
  semester text,
  is_active boolean not null default true,
  department text not null check (department in ('Basic Education','College')),
  year_level text,
  course_or_track text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 15. SCHEDULES (legacy flat weekly schedule shown on Student Portal)
-- ============================================================================
create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  subject_code text,
  subject_name text,
  teacher_name text,
  section text,
  day text,
  time text,
  room text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 16. REQUIREMENTS
-- ============================================================================
create table if not exists public.requirements (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  student_id uuid not null references public.students(id) on delete cascade,
  name text not null,
  status text not null default 'Pending' check (status in ('Submitted','Pending','Rejected')),
  submitted_date date,
  remarks text,
  upload_status text check (upload_status in ('Uploaded','Not Uploaded')),
  upload_file_name text,
  upload_date date,
  verification_status text check (verification_status in ('Pending','Verified','Rejected')),
  verified_by text,
  verified_at timestamptz,
  hardcopy_submitted boolean not null default false,
  hardcopy_submitted_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 17. BOOK_PACKAGES  +  18. BOOK_PACKAGE_ITEMS
-- ============================================================================
create table if not exists public.book_packages (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  package_name text not null,
  grade_level text,
  school_id uuid references public.schools(id) on delete set null on update cascade,
  academic_unit text check (academic_unit in ('basic-ed','college')),
  school_year text,
  total_amount numeric not null default 0,
  is_required boolean not null default true,
  status text not null default 'Active' check (status in ('Active','Inactive')),
  last_updated date,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.book_package_items (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  book_package_id uuid not null references public.book_packages(id) on delete cascade,
  title text not null,
  subject_id uuid references public.subjects(id) on delete set null on update cascade,
  quantity int not null default 1,
  unit_price numeric not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 19. ASSESSMENTS  +  20. ASSESSMENT_FEES  +  21. ASSESSMENT_AUDIT_TRAIL
-- ============================================================================
create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  school_id uuid references public.schools(id) on delete set null on update cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  school_year text not null,
  semester text,
  total_amount numeric not null default 0,
  discount_percentage numeric not null default 0,
  discount_amount numeric not null default 0,
  scholarship_name text,
  payment_term text,
  balance numeric not null default 0,
  is_paid boolean not null default false,
  financial_hold_status text,
  last_payment_date date,
  books_availed boolean not null default false,
  book_package_id uuid references public.book_packages(id) on delete set null on update cascade,
  approval_status text default 'Pending Accounting Approval' check (approval_status in ('Pending Accounting Approval','Approved for Payment','Returned to Registrar','Rejected')),
  submitted_by text,
  submitted_date date,
  registrar_remarks text,
  accounting_remarks text,
  approved_by text,
  approved_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_assessments_student on public.assessments (student_id);

create table if not exists public.assessment_fees (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  fee_name text not null,
  category text not null check (category in ('Tuition','Miscellaneous','Laboratory','ID/Other','Books')),
  amount numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.assessment_audit_trail (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  action text not null,
  performed_by text,
  performed_at timestamptz not null default now(),
  details text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 22. ENROLLMENTS  +  23. ENROLLMENT_SUBJECTS (junction)
-- ============================================================================
create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  student_id uuid not null references public.students(id) on delete cascade,
  school_year text not null,
  semester text,
  enrollment_type text check (enrollment_type in ('New Student','Old Student','Transferee','Returnee')),
  status text not null default 'Pending' check (status in ('Pending','Enrolled','Approved','Rejected')),
  submitted_at timestamptz not null default now(),
  assessment_id uuid references public.assessments(id) on delete set null on update cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.enrollment_subjects (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (enrollment_id, subject_id)
);

-- ============================================================================
-- 24. PAYMENTS
-- ============================================================================
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  school_id uuid references public.schools(id) on delete set null on update cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  assessment_id uuid references public.assessments(id) on delete set null on update cascade,
  amount numeric not null default 0,
  payment_date timestamptz not null default now(),
  payment_method text check (payment_method in ('Cash','Bank Transfer','GCash','Credit Card')),
  or_number text unique,
  term text check (term in ('Downpayment','Midterm','Finals','Full Payment','Installment')),
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 25. DISCOUNT_TYPES
-- ============================================================================
create table if not exists public.discount_types (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  code text not null unique,
  name text not null,
  discount_percent numeric not null default 0,
  discount_source text check (discount_source in ('Government','Sibling','Owner','Scholarship','Employee','Other')),
  requires_approval boolean not null default false,
  max_beneficiaries int,
  description text,
  is_active boolean not null default true,
  effective_school_year text,
  applicable_academic_unit text check (applicable_academic_unit in ('basic-ed','college','both')),
  applies_to text check (applies_to in ('Tuition','Miscellaneous','Laboratory','Total Assessment')),
  discount_basis text check (discount_basis in ('Percentage','Fixed Amount')),
  discount_fixed_amount numeric,
  is_stackable boolean not null default false,
  requires_document boolean not null default false,
  max_amount numeric,
  gl_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 26. DISCOUNT_REQUESTS  +  27. DISCOUNT_REQUEST_AUDIT_TRAIL
-- ============================================================================
create table if not exists public.discount_requests (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  reference_no text not null unique,
  student_id uuid not null references public.students(id) on delete cascade,
  discount_type_id uuid references public.discount_types(id) on delete set null on update cascade,
  requested_by text,
  requested_at timestamptz not null default now(),
  status text not null default 'Pending' check (status in ('Pending','For Review','Approved','Rejected','Returned for Documents','Cancelled','Expired')),
  sibling_student_ids uuid[] not null default '{}',
  sibling_names text[] not null default '{}',
  level1_status text check (level1_status in ('Pending','Approved','Rejected')),
  level1_approved_by text,
  level1_approved_at timestamptz,
  level2_status text check (level2_status in ('Pending','Approved','Rejected')),
  level2_approved_by text,
  level2_approved_at timestamptz,
  remarks text,
  attachment_names text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.discount_request_audit_trail (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  discount_request_id uuid not null references public.discount_requests(id) on delete cascade,
  action text not null,
  performed_by text,
  performed_at timestamptz not null default now(),
  details text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 28. STUDENT_LEDGER_SUMMARIES
-- ============================================================================
create table if not exists public.student_ledger_summaries (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  school_year text not null,
  total_assessed numeric not null default 0,
  total_paid numeric not null default 0,
  discount_applied numeric not null default 0,
  balance numeric not null default 0,
  financial_hold_status text check (financial_hold_status in ('None','Hold','Cleared')),
  clearance_status text check (clearance_status in ('Cleared','Not Cleared')),
  last_payment_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, school_year)
);

-- ============================================================================
-- 29. LEDGER_TRANSACTIONS
-- ============================================================================
create table if not exists public.ledger_transactions (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  student_id uuid not null references public.students(id) on delete cascade,
  date date not null,
  description text,
  type text check (type in ('Assessment','Payment','Discount','Adjustment')),
  debit numeric not null default 0,
  credit numeric not null default 0,
  balance numeric not null default 0,
  reference text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 30. FINANCIAL_HOLDS
-- ============================================================================
create table if not exists public.financial_holds (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  student_id uuid not null references public.students(id) on delete cascade,
  hold_type text check (hold_type in ('Enrollment','COR','Exam Permit','Transcript','Graduation Clearance','Transfer Credentials')),
  hold_category text check (hold_category in ('Unpaid Balance','Missing Payment','Registrar Hold','Incomplete Documents','Returned Payment')),
  reason text,
  balance_amount numeric not null default 0,
  created_by text,
  status text not null default 'Active' check (status in ('Active','Cleared')),
  cleared_by text,
  cleared_at timestamptz,
  clearance_remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 31. ASSESSMENT_BILLING_SUMMARIES
-- ============================================================================
create table if not exists public.assessment_billing_summaries (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  student_id uuid not null references public.students(id) on delete cascade,
  school_year text,
  semester text,
  academic_unit text check (academic_unit in ('basic-ed','college')),
  fee_template_name text,
  total_assessment numeric not null default 0,
  amount_due numeric not null default 0,
  balance numeric not null default 0,
  status text check (status in ('Draft','Pending Approval','Approved','Voided')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 32. PAYMENT_COLLECTION_SUMMARIES
-- ============================================================================
create table if not exists public.payment_collection_summaries (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  student_id uuid not null references public.students(id) on delete cascade,
  amount numeric not null default 0,
  payment_method text check (payment_method in ('Cash','Bank Transfer','GCash','Credit Card')),
  reference_no text,
  payment_date timestamptz not null default now(),
  cashier text,
  term text,
  verification_status text check (verification_status in ('Verified','Pending Verification','Voided')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 33. PROMISSORY_NOTES
-- ============================================================================
create table if not exists public.promissory_notes (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  student_id uuid not null references public.students(id) on delete cascade,
  amount numeric not null default 0,
  due_date date,
  status text not null default 'Active' check (status in ('Active','Overdue','Settled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 34. SUBJECT_CLASS_LOADS  +  35. CLASS_LOAD_STUDENTS (junction)
-- ============================================================================
create table if not exists public.subject_class_loads (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null on update cascade,
  section_id uuid references public.sections(id) on delete set null on update cascade,
  department text not null check (department in ('Basic Education','College')),
  school_year text,
  semester text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.class_load_students (
  id uuid primary key default gen_random_uuid(),
  class_load_id uuid not null references public.subject_class_loads(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (class_load_id, student_id)
);

-- ============================================================================
-- 36. GRADE_PERIODS  +  37. GRADE_CATEGORIES  +  38. GRADE_ITEMS
-- ============================================================================
create table if not exists public.grade_periods (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  label text not null check (label in ('1st Quarter','2nd Quarter','3rd Quarter','4th Quarter','Prelim','Midterm','Final')),
  subject_id uuid references public.subjects(id) on delete set null on update cascade,
  section_id uuid references public.sections(id) on delete set null on update cascade,
  school_year text,
  teacher_id uuid references public.teachers(id) on delete set null on update cascade,
  is_finalized boolean not null default false,
  finalized_at timestamptz,
  finalized_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.grade_categories (
  id uuid primary key default gen_random_uuid(),
  grade_period_id uuid not null references public.grade_periods(id) on delete cascade,
  name text not null check (name in ('Quizzes','Activities','Projects','Assignments','Performance Tasks','Written Exams','Custom')),
  weight numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (grade_period_id, name)
);

create table if not exists public.grade_items (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  grade_period_id uuid not null references public.grade_periods(id) on delete cascade,
  label text not null,
  category text not null check (category in ('Quizzes','Activities','Projects','Assignments','Performance Tasks','Written Exams','Custom')),
  max_score numeric not null default 100,
  sort_order int not null default 1,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 39. STUDENT_GRADE_ENTRIES
-- ============================================================================
create table if not exists public.student_grade_entries (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  grade_period_id uuid not null references public.grade_periods(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  grade_item_id uuid not null references public.grade_items(id) on delete cascade,
  score numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (grade_item_id, student_id)
);

-- ============================================================================
-- 40. GRADES (report-card level midterm/final grade, distinct from the
--     grade_periods/grade_items encoding workbook above)
-- ============================================================================
create table if not exists public.grades (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  student_id uuid not null references public.students(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null on update cascade,
  teacher_id uuid references public.teachers(id) on delete set null on update cascade,
  school_year text,
  semester text,
  midterm_grade numeric,
  final_grade numeric,
  remarks text check (remarks in ('Passed','Failed','Incomplete')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 41. ANNOUNCEMENTS  /  42. SCHOOL_EVENTS
-- ============================================================================
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  title text not null,
  content text,
  date date not null default current_date,
  category text check (category in ('Academic','Event','Billing','General')),
  author text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.school_events (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  title text not null,
  description text,
  date date not null,
  department text check (department in ('Basic Education','College','All')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 43. LEARNING_MATERIALS
-- ============================================================================
create table if not exists public.learning_materials (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  school_id uuid references public.schools(id) on delete set null on update cascade,
  title text not null,
  description text,
  subject_id uuid references public.subjects(id) on delete set null on update cascade,
  section text,
  teacher_id uuid references public.teachers(id) on delete set null on update cascade,
  learning_type text not null check (learning_type in ('Video','Module','Document')),
  file_url text,
  file_name text,
  file_size text,
  video_url text,
  thumbnail_url text,
  publish_status text not null default 'Draft' check (publish_status in ('Published','Draft')),
  upload_date date not null default current_date,
  department text check (department in ('Basic Education','College')),
  year_level text,
  track_or_course text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 44. ACTIVITY_LOGS (teacher/registrar activity feeds shown on dashboards)
-- ============================================================================
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  actor_name text,
  action text not null,
  subject_label text,
  activity_type text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 45. ENROLLMENT_HISTORY_STATS (per-school-year enrollment counts, backs the
--     dashboard trend chart)
-- ============================================================================
create table if not exists public.enrollment_history_stats (
  id uuid primary key default gen_random_uuid(),
  school_year text not null,
  school_id uuid not null references public.schools(id) on delete cascade,
  student_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_year, school_id)
);

-- ============================================================================
-- 46. PAYROLL
-- ============================================================================
create table if not exists public.payroll (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  employee_id uuid references public.employees(id) on delete set null on update cascade,
  employee_name text,
  position text,
  basic_salary numeric not null default 0,
  allowances numeric not null default 0,
  sss_deduction numeric not null default 0,
  philhealth_deduction numeric not null default 0,
  pagibig_deduction numeric not null default 0,
  tax_deduction numeric not null default 0,
  net_pay numeric not null default 0,
  period text,
  status text not null default 'Pending' check (status in ('Paid','Pending')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Common lookup indexes
create index if not exists idx_enrollments_student on public.enrollments (student_id);
create index if not exists idx_payments_student on public.payments (student_id);
create index if not exists idx_grades_student on public.grades (student_id);
create index if not exists idx_discount_requests_student on public.discount_requests (student_id);
create index if not exists idx_financial_holds_student on public.financial_holds (student_id);
create index if not exists idx_learning_materials_subject on public.learning_materials (subject_id);

-- ============================================================================
-- RLS: enabled on every table with permissive development policies that
-- allow anon + authenticated to perform full CRUD. TIGHTEN BEFORE PRODUCTION.
-- Generated from supabase/migrations/0001_schema.sql table list.
-- ============================================================================

alter table public.schools enable row level security;
create policy "schools_select_anon_auth" on public.schools for select to anon, authenticated using (true);
create policy "schools_insert_anon_auth" on public.schools for insert to anon, authenticated with check (true);
create policy "schools_update_anon_auth" on public.schools for update to anon, authenticated using (true) with check (true);
create policy "schools_delete_anon_auth" on public.schools for delete to anon, authenticated using (true);

alter table public.setup_items enable row level security;
create policy "setup_items_select_anon_auth" on public.setup_items for select to anon, authenticated using (true);
create policy "setup_items_insert_anon_auth" on public.setup_items for insert to anon, authenticated with check (true);
create policy "setup_items_update_anon_auth" on public.setup_items for update to anon, authenticated using (true) with check (true);
create policy "setup_items_delete_anon_auth" on public.setup_items for delete to anon, authenticated using (true);

alter table public.users enable row level security;
create policy "users_select_anon_auth" on public.users for select to anon, authenticated using (true);
create policy "users_insert_anon_auth" on public.users for insert to anon, authenticated with check (true);
create policy "users_update_anon_auth" on public.users for update to anon, authenticated using (true) with check (true);
create policy "users_delete_anon_auth" on public.users for delete to anon, authenticated using (true);

alter table public.courses enable row level security;
create policy "courses_select_anon_auth" on public.courses for select to anon, authenticated using (true);
create policy "courses_insert_anon_auth" on public.courses for insert to anon, authenticated with check (true);
create policy "courses_update_anon_auth" on public.courses for update to anon, authenticated using (true) with check (true);
create policy "courses_delete_anon_auth" on public.courses for delete to anon, authenticated using (true);

alter table public.subjects enable row level security;
create policy "subjects_select_anon_auth" on public.subjects for select to anon, authenticated using (true);
create policy "subjects_insert_anon_auth" on public.subjects for insert to anon, authenticated with check (true);
create policy "subjects_update_anon_auth" on public.subjects for update to anon, authenticated using (true) with check (true);
create policy "subjects_delete_anon_auth" on public.subjects for delete to anon, authenticated using (true);

alter table public.teachers enable row level security;
create policy "teachers_select_anon_auth" on public.teachers for select to anon, authenticated using (true);
create policy "teachers_insert_anon_auth" on public.teachers for insert to anon, authenticated with check (true);
create policy "teachers_update_anon_auth" on public.teachers for update to anon, authenticated using (true) with check (true);
create policy "teachers_delete_anon_auth" on public.teachers for delete to anon, authenticated using (true);

alter table public.students enable row level security;
create policy "students_select_anon_auth" on public.students for select to anon, authenticated using (true);
create policy "students_insert_anon_auth" on public.students for insert to anon, authenticated with check (true);
create policy "students_update_anon_auth" on public.students for update to anon, authenticated using (true) with check (true);
create policy "students_delete_anon_auth" on public.students for delete to anon, authenticated using (true);

alter table public.employees enable row level security;
create policy "employees_select_anon_auth" on public.employees for select to anon, authenticated using (true);
create policy "employees_insert_anon_auth" on public.employees for insert to anon, authenticated with check (true);
create policy "employees_update_anon_auth" on public.employees for update to anon, authenticated using (true) with check (true);
create policy "employees_delete_anon_auth" on public.employees for delete to anon, authenticated using (true);

alter table public.curriculums enable row level security;
create policy "curriculums_select_anon_auth" on public.curriculums for select to anon, authenticated using (true);
create policy "curriculums_insert_anon_auth" on public.curriculums for insert to anon, authenticated with check (true);
create policy "curriculums_update_anon_auth" on public.curriculums for update to anon, authenticated using (true) with check (true);
create policy "curriculums_delete_anon_auth" on public.curriculums for delete to anon, authenticated using (true);

alter table public.curriculum_subjects enable row level security;
create policy "curriculum_subjects_select_anon_auth" on public.curriculum_subjects for select to anon, authenticated using (true);
create policy "curriculum_subjects_insert_anon_auth" on public.curriculum_subjects for insert to anon, authenticated with check (true);
create policy "curriculum_subjects_update_anon_auth" on public.curriculum_subjects for update to anon, authenticated using (true) with check (true);
create policy "curriculum_subjects_delete_anon_auth" on public.curriculum_subjects for delete to anon, authenticated using (true);

alter table public.sections enable row level security;
create policy "sections_select_anon_auth" on public.sections for select to anon, authenticated using (true);
create policy "sections_insert_anon_auth" on public.sections for insert to anon, authenticated with check (true);
create policy "sections_update_anon_auth" on public.sections for update to anon, authenticated using (true) with check (true);
create policy "sections_delete_anon_auth" on public.sections for delete to anon, authenticated using (true);

alter table public.section_students enable row level security;
create policy "section_students_select_anon_auth" on public.section_students for select to anon, authenticated using (true);
create policy "section_students_insert_anon_auth" on public.section_students for insert to anon, authenticated with check (true);
create policy "section_students_update_anon_auth" on public.section_students for update to anon, authenticated using (true) with check (true);
create policy "section_students_delete_anon_auth" on public.section_students for delete to anon, authenticated using (true);

alter table public.rooms enable row level security;
create policy "rooms_select_anon_auth" on public.rooms for select to anon, authenticated using (true);
create policy "rooms_insert_anon_auth" on public.rooms for insert to anon, authenticated with check (true);
create policy "rooms_update_anon_auth" on public.rooms for update to anon, authenticated using (true) with check (true);
create policy "rooms_delete_anon_auth" on public.rooms for delete to anon, authenticated using (true);

alter table public.class_schedules enable row level security;
create policy "class_schedules_select_anon_auth" on public.class_schedules for select to anon, authenticated using (true);
create policy "class_schedules_insert_anon_auth" on public.class_schedules for insert to anon, authenticated with check (true);
create policy "class_schedules_update_anon_auth" on public.class_schedules for update to anon, authenticated using (true) with check (true);
create policy "class_schedules_delete_anon_auth" on public.class_schedules for delete to anon, authenticated using (true);

alter table public.schedules enable row level security;
create policy "schedules_select_anon_auth" on public.schedules for select to anon, authenticated using (true);
create policy "schedules_insert_anon_auth" on public.schedules for insert to anon, authenticated with check (true);
create policy "schedules_update_anon_auth" on public.schedules for update to anon, authenticated using (true) with check (true);
create policy "schedules_delete_anon_auth" on public.schedules for delete to anon, authenticated using (true);

alter table public.requirements enable row level security;
create policy "requirements_select_anon_auth" on public.requirements for select to anon, authenticated using (true);
create policy "requirements_insert_anon_auth" on public.requirements for insert to anon, authenticated with check (true);
create policy "requirements_update_anon_auth" on public.requirements for update to anon, authenticated using (true) with check (true);
create policy "requirements_delete_anon_auth" on public.requirements for delete to anon, authenticated using (true);

alter table public.book_packages enable row level security;
create policy "book_packages_select_anon_auth" on public.book_packages for select to anon, authenticated using (true);
create policy "book_packages_insert_anon_auth" on public.book_packages for insert to anon, authenticated with check (true);
create policy "book_packages_update_anon_auth" on public.book_packages for update to anon, authenticated using (true) with check (true);
create policy "book_packages_delete_anon_auth" on public.book_packages for delete to anon, authenticated using (true);

alter table public.book_package_items enable row level security;
create policy "book_package_items_select_anon_auth" on public.book_package_items for select to anon, authenticated using (true);
create policy "book_package_items_insert_anon_auth" on public.book_package_items for insert to anon, authenticated with check (true);
create policy "book_package_items_update_anon_auth" on public.book_package_items for update to anon, authenticated using (true) with check (true);
create policy "book_package_items_delete_anon_auth" on public.book_package_items for delete to anon, authenticated using (true);

alter table public.assessments enable row level security;
create policy "assessments_select_anon_auth" on public.assessments for select to anon, authenticated using (true);
create policy "assessments_insert_anon_auth" on public.assessments for insert to anon, authenticated with check (true);
create policy "assessments_update_anon_auth" on public.assessments for update to anon, authenticated using (true) with check (true);
create policy "assessments_delete_anon_auth" on public.assessments for delete to anon, authenticated using (true);

alter table public.assessment_fees enable row level security;
create policy "assessment_fees_select_anon_auth" on public.assessment_fees for select to anon, authenticated using (true);
create policy "assessment_fees_insert_anon_auth" on public.assessment_fees for insert to anon, authenticated with check (true);
create policy "assessment_fees_update_anon_auth" on public.assessment_fees for update to anon, authenticated using (true) with check (true);
create policy "assessment_fees_delete_anon_auth" on public.assessment_fees for delete to anon, authenticated using (true);

alter table public.assessment_audit_trail enable row level security;
create policy "assessment_audit_trail_select_anon_auth" on public.assessment_audit_trail for select to anon, authenticated using (true);
create policy "assessment_audit_trail_insert_anon_auth" on public.assessment_audit_trail for insert to anon, authenticated with check (true);
create policy "assessment_audit_trail_update_anon_auth" on public.assessment_audit_trail for update to anon, authenticated using (true) with check (true);
create policy "assessment_audit_trail_delete_anon_auth" on public.assessment_audit_trail for delete to anon, authenticated using (true);

alter table public.enrollments enable row level security;
create policy "enrollments_select_anon_auth" on public.enrollments for select to anon, authenticated using (true);
create policy "enrollments_insert_anon_auth" on public.enrollments for insert to anon, authenticated with check (true);
create policy "enrollments_update_anon_auth" on public.enrollments for update to anon, authenticated using (true) with check (true);
create policy "enrollments_delete_anon_auth" on public.enrollments for delete to anon, authenticated using (true);

alter table public.enrollment_subjects enable row level security;
create policy "enrollment_subjects_select_anon_auth" on public.enrollment_subjects for select to anon, authenticated using (true);
create policy "enrollment_subjects_insert_anon_auth" on public.enrollment_subjects for insert to anon, authenticated with check (true);
create policy "enrollment_subjects_update_anon_auth" on public.enrollment_subjects for update to anon, authenticated using (true) with check (true);
create policy "enrollment_subjects_delete_anon_auth" on public.enrollment_subjects for delete to anon, authenticated using (true);

alter table public.payments enable row level security;
create policy "payments_select_anon_auth" on public.payments for select to anon, authenticated using (true);
create policy "payments_insert_anon_auth" on public.payments for insert to anon, authenticated with check (true);
create policy "payments_update_anon_auth" on public.payments for update to anon, authenticated using (true) with check (true);
create policy "payments_delete_anon_auth" on public.payments for delete to anon, authenticated using (true);

alter table public.discount_types enable row level security;
create policy "discount_types_select_anon_auth" on public.discount_types for select to anon, authenticated using (true);
create policy "discount_types_insert_anon_auth" on public.discount_types for insert to anon, authenticated with check (true);
create policy "discount_types_update_anon_auth" on public.discount_types for update to anon, authenticated using (true) with check (true);
create policy "discount_types_delete_anon_auth" on public.discount_types for delete to anon, authenticated using (true);

alter table public.discount_requests enable row level security;
create policy "discount_requests_select_anon_auth" on public.discount_requests for select to anon, authenticated using (true);
create policy "discount_requests_insert_anon_auth" on public.discount_requests for insert to anon, authenticated with check (true);
create policy "discount_requests_update_anon_auth" on public.discount_requests for update to anon, authenticated using (true) with check (true);
create policy "discount_requests_delete_anon_auth" on public.discount_requests for delete to anon, authenticated using (true);

alter table public.discount_request_audit_trail enable row level security;
create policy "discount_request_audit_trail_select_anon_auth" on public.discount_request_audit_trail for select to anon, authenticated using (true);
create policy "discount_request_audit_trail_insert_anon_auth" on public.discount_request_audit_trail for insert to anon, authenticated with check (true);
create policy "discount_request_audit_trail_update_anon_auth" on public.discount_request_audit_trail for update to anon, authenticated using (true) with check (true);
create policy "discount_request_audit_trail_delete_anon_auth" on public.discount_request_audit_trail for delete to anon, authenticated using (true);

alter table public.student_ledger_summaries enable row level security;
create policy "student_ledger_summaries_select_anon_auth" on public.student_ledger_summaries for select to anon, authenticated using (true);
create policy "student_ledger_summaries_insert_anon_auth" on public.student_ledger_summaries for insert to anon, authenticated with check (true);
create policy "student_ledger_summaries_update_anon_auth" on public.student_ledger_summaries for update to anon, authenticated using (true) with check (true);
create policy "student_ledger_summaries_delete_anon_auth" on public.student_ledger_summaries for delete to anon, authenticated using (true);

alter table public.ledger_transactions enable row level security;
create policy "ledger_transactions_select_anon_auth" on public.ledger_transactions for select to anon, authenticated using (true);
create policy "ledger_transactions_insert_anon_auth" on public.ledger_transactions for insert to anon, authenticated with check (true);
create policy "ledger_transactions_update_anon_auth" on public.ledger_transactions for update to anon, authenticated using (true) with check (true);
create policy "ledger_transactions_delete_anon_auth" on public.ledger_transactions for delete to anon, authenticated using (true);

alter table public.financial_holds enable row level security;
create policy "financial_holds_select_anon_auth" on public.financial_holds for select to anon, authenticated using (true);
create policy "financial_holds_insert_anon_auth" on public.financial_holds for insert to anon, authenticated with check (true);
create policy "financial_holds_update_anon_auth" on public.financial_holds for update to anon, authenticated using (true) with check (true);
create policy "financial_holds_delete_anon_auth" on public.financial_holds for delete to anon, authenticated using (true);

alter table public.assessment_billing_summaries enable row level security;
create policy "assessment_billing_summaries_select_anon_auth" on public.assessment_billing_summaries for select to anon, authenticated using (true);
create policy "assessment_billing_summaries_insert_anon_auth" on public.assessment_billing_summaries for insert to anon, authenticated with check (true);
create policy "assessment_billing_summaries_update_anon_auth" on public.assessment_billing_summaries for update to anon, authenticated using (true) with check (true);
create policy "assessment_billing_summaries_delete_anon_auth" on public.assessment_billing_summaries for delete to anon, authenticated using (true);

alter table public.payment_collection_summaries enable row level security;
create policy "payment_collection_summaries_select_anon_auth" on public.payment_collection_summaries for select to anon, authenticated using (true);
create policy "payment_collection_summaries_insert_anon_auth" on public.payment_collection_summaries for insert to anon, authenticated with check (true);
create policy "payment_collection_summaries_update_anon_auth" on public.payment_collection_summaries for update to anon, authenticated using (true) with check (true);
create policy "payment_collection_summaries_delete_anon_auth" on public.payment_collection_summaries for delete to anon, authenticated using (true);

alter table public.promissory_notes enable row level security;
create policy "promissory_notes_select_anon_auth" on public.promissory_notes for select to anon, authenticated using (true);
create policy "promissory_notes_insert_anon_auth" on public.promissory_notes for insert to anon, authenticated with check (true);
create policy "promissory_notes_update_anon_auth" on public.promissory_notes for update to anon, authenticated using (true) with check (true);
create policy "promissory_notes_delete_anon_auth" on public.promissory_notes for delete to anon, authenticated using (true);

alter table public.subject_class_loads enable row level security;
create policy "subject_class_loads_select_anon_auth" on public.subject_class_loads for select to anon, authenticated using (true);
create policy "subject_class_loads_insert_anon_auth" on public.subject_class_loads for insert to anon, authenticated with check (true);
create policy "subject_class_loads_update_anon_auth" on public.subject_class_loads for update to anon, authenticated using (true) with check (true);
create policy "subject_class_loads_delete_anon_auth" on public.subject_class_loads for delete to anon, authenticated using (true);

alter table public.class_load_students enable row level security;
create policy "class_load_students_select_anon_auth" on public.class_load_students for select to anon, authenticated using (true);
create policy "class_load_students_insert_anon_auth" on public.class_load_students for insert to anon, authenticated with check (true);
create policy "class_load_students_update_anon_auth" on public.class_load_students for update to anon, authenticated using (true) with check (true);
create policy "class_load_students_delete_anon_auth" on public.class_load_students for delete to anon, authenticated using (true);

alter table public.grade_periods enable row level security;
create policy "grade_periods_select_anon_auth" on public.grade_periods for select to anon, authenticated using (true);
create policy "grade_periods_insert_anon_auth" on public.grade_periods for insert to anon, authenticated with check (true);
create policy "grade_periods_update_anon_auth" on public.grade_periods for update to anon, authenticated using (true) with check (true);
create policy "grade_periods_delete_anon_auth" on public.grade_periods for delete to anon, authenticated using (true);

alter table public.grade_categories enable row level security;
create policy "grade_categories_select_anon_auth" on public.grade_categories for select to anon, authenticated using (true);
create policy "grade_categories_insert_anon_auth" on public.grade_categories for insert to anon, authenticated with check (true);
create policy "grade_categories_update_anon_auth" on public.grade_categories for update to anon, authenticated using (true) with check (true);
create policy "grade_categories_delete_anon_auth" on public.grade_categories for delete to anon, authenticated using (true);

alter table public.grade_items enable row level security;
create policy "grade_items_select_anon_auth" on public.grade_items for select to anon, authenticated using (true);
create policy "grade_items_insert_anon_auth" on public.grade_items for insert to anon, authenticated with check (true);
create policy "grade_items_update_anon_auth" on public.grade_items for update to anon, authenticated using (true) with check (true);
create policy "grade_items_delete_anon_auth" on public.grade_items for delete to anon, authenticated using (true);

alter table public.student_grade_entries enable row level security;
create policy "student_grade_entries_select_anon_auth" on public.student_grade_entries for select to anon, authenticated using (true);
create policy "student_grade_entries_insert_anon_auth" on public.student_grade_entries for insert to anon, authenticated with check (true);
create policy "student_grade_entries_update_anon_auth" on public.student_grade_entries for update to anon, authenticated using (true) with check (true);
create policy "student_grade_entries_delete_anon_auth" on public.student_grade_entries for delete to anon, authenticated using (true);

alter table public.grades enable row level security;
create policy "grades_select_anon_auth" on public.grades for select to anon, authenticated using (true);
create policy "grades_insert_anon_auth" on public.grades for insert to anon, authenticated with check (true);
create policy "grades_update_anon_auth" on public.grades for update to anon, authenticated using (true) with check (true);
create policy "grades_delete_anon_auth" on public.grades for delete to anon, authenticated using (true);

alter table public.announcements enable row level security;
create policy "announcements_select_anon_auth" on public.announcements for select to anon, authenticated using (true);
create policy "announcements_insert_anon_auth" on public.announcements for insert to anon, authenticated with check (true);
create policy "announcements_update_anon_auth" on public.announcements for update to anon, authenticated using (true) with check (true);
create policy "announcements_delete_anon_auth" on public.announcements for delete to anon, authenticated using (true);

alter table public.school_events enable row level security;
create policy "school_events_select_anon_auth" on public.school_events for select to anon, authenticated using (true);
create policy "school_events_insert_anon_auth" on public.school_events for insert to anon, authenticated with check (true);
create policy "school_events_update_anon_auth" on public.school_events for update to anon, authenticated using (true) with check (true);
create policy "school_events_delete_anon_auth" on public.school_events for delete to anon, authenticated using (true);

alter table public.learning_materials enable row level security;
create policy "learning_materials_select_anon_auth" on public.learning_materials for select to anon, authenticated using (true);
create policy "learning_materials_insert_anon_auth" on public.learning_materials for insert to anon, authenticated with check (true);
create policy "learning_materials_update_anon_auth" on public.learning_materials for update to anon, authenticated using (true) with check (true);
create policy "learning_materials_delete_anon_auth" on public.learning_materials for delete to anon, authenticated using (true);

alter table public.activity_logs enable row level security;
create policy "activity_logs_select_anon_auth" on public.activity_logs for select to anon, authenticated using (true);
create policy "activity_logs_insert_anon_auth" on public.activity_logs for insert to anon, authenticated with check (true);
create policy "activity_logs_update_anon_auth" on public.activity_logs for update to anon, authenticated using (true) with check (true);
create policy "activity_logs_delete_anon_auth" on public.activity_logs for delete to anon, authenticated using (true);

alter table public.enrollment_history_stats enable row level security;
create policy "enrollment_history_stats_select_anon_auth" on public.enrollment_history_stats for select to anon, authenticated using (true);
create policy "enrollment_history_stats_insert_anon_auth" on public.enrollment_history_stats for insert to anon, authenticated with check (true);
create policy "enrollment_history_stats_update_anon_auth" on public.enrollment_history_stats for update to anon, authenticated using (true) with check (true);
create policy "enrollment_history_stats_delete_anon_auth" on public.enrollment_history_stats for delete to anon, authenticated using (true);

alter table public.payroll enable row level security;
create policy "payroll_select_anon_auth" on public.payroll for select to anon, authenticated using (true);
create policy "payroll_insert_anon_auth" on public.payroll for insert to anon, authenticated with check (true);
create policy "payroll_update_anon_auth" on public.payroll for update to anon, authenticated using (true) with check (true);
create policy "payroll_delete_anon_auth" on public.payroll for delete to anon, authenticated using (true);



-- ============================================================================
-- SCHOOLS
-- ============================================================================
insert into public.schools (legacy_id, code, name, short_name, location, academic_unit, branding_label, supported_roles) values
  ('STSN', 'STSN', 'St. Theresa''s School of Novaliches', 'St. Theresa''s School', 'Novaliches, QC', 'basic-ed', 'Basic Education / K-12', ARRAY['super-admin','registrar','accounting','cashier','teacher','student','hr']::text[]),
  ('CDSTA', 'CDSTA', 'Colegio de Sta. Teresa de Avila', 'Colegio de Sta. Teresa', 'de Avila', 'college', 'College / Tertiary Academics', ARRAY['super-admin','registrar','accounting','cashier','teacher','student','hr']::text[])
on conflict do nothing;

-- ============================================================================
-- SETUP_ITEMS
-- ============================================================================
insert into public.setup_items (legacy_id, category, code, name, description, is_active, sort_order, metadata, created_by, created_at) values
  ('ac-1', 'academic_categories', 'PRESCH', 'Preschool Education', 'Early childhood learning', true, 0, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('ac-2', 'academic_categories', 'PRIM', 'Primary Education', 'Grades 1 to 3', true, 1, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('ac-3', 'academic_categories', 'INT', 'Intermediate Education', 'Grades 4 to 6', true, 2, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('ac-4', 'academic_categories', 'JHS', 'Junior High School', 'Grades 7 to 10', true, 3, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('ac-5', 'academic_categories', 'SHS', 'Senior High School', 'Grades 11 to 12', true, 4, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('ac-6', 'academic_categories', 'COL', 'College / Tertiary', 'Undergraduate degree programs', true, 5, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('al-1', 'academic_levels', 'PRESCH', 'Preschool', 'Preschool level', true, 0, '{"category":"Preschool Education"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('al-2', 'academic_levels', 'ELEM', 'Elementary', 'Primary & Intermediate', true, 1, '{"category":"Primary Education"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('al-3', 'academic_levels', 'JHS', 'Junior High School', 'Grades 7-10', true, 2, '{"category":"Junior High School"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('al-4', 'academic_levels', 'SHS', 'Senior High School', 'Grades 11-12', true, 3, '{"category":"Senior High School"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('al-5', 'academic_levels', 'COLL', 'College', 'Tertiary level', true, 4, '{"category":"College / Tertiary"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('yl-1', 'year_levels', 'NURS', 'Nursery', '', true, 0, '{"level":0,"academicLevel":"Preschool"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('yl-2', 'year_levels', 'K1', 'Kinder 1', '', true, 1, '{"level":1,"academicLevel":"Preschool"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('yl-3', 'year_levels', 'K2', 'Kinder 2', '', true, 2, '{"level":2,"academicLevel":"Preschool"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('yl-4', 'year_levels', 'G1', 'Grade 1', '', true, 3, '{"level":3,"academicLevel":"Elementary"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('yl-5', 'year_levels', 'G2', 'Grade 2', '', true, 4, '{"level":4,"academicLevel":"Elementary"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('yl-6', 'year_levels', 'G3', 'Grade 3', '', true, 5, '{"level":5,"academicLevel":"Elementary"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('yl-7', 'year_levels', 'G4', 'Grade 4', '', true, 6, '{"level":6,"academicLevel":"Elementary"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('yl-8', 'year_levels', 'G5', 'Grade 5', '', true, 7, '{"level":7,"academicLevel":"Elementary"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('yl-9', 'year_levels', 'G6', 'Grade 6', '', true, 8, '{"level":8,"academicLevel":"Elementary"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('yl-10', 'year_levels', 'G7', 'Grade 7', '', true, 9, '{"level":9,"academicLevel":"Junior High School"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('yl-11', 'year_levels', 'G8', 'Grade 8', '', true, 10, '{"level":10,"academicLevel":"Junior High School"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('yl-12', 'year_levels', 'G9', 'Grade 9', '', true, 11, '{"level":11,"academicLevel":"Junior High School"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('yl-13', 'year_levels', 'G10', 'Grade 10', '', true, 12, '{"level":12,"academicLevel":"Junior High School"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('yl-14', 'year_levels', 'G11', 'Grade 11', '', true, 13, '{"level":13,"academicLevel":"Senior High School"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('yl-15', 'year_levels', 'G12', 'Grade 12', '', true, 14, '{"level":14,"academicLevel":"Senior High School"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('yl-16', 'year_levels', 'Y1', '1st Year', '', true, 15, '{"level":15,"academicLevel":"College"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('yl-17', 'year_levels', 'Y2', '2nd Year', '', true, 16, '{"level":16,"academicLevel":"College"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('yl-18', 'year_levels', 'Y3', '3rd Year', '', true, 17, '{"level":17,"academicLevel":"College"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('yl-19', 'year_levels', 'Y4', '4th Year', '', true, 18, '{"level":18,"academicLevel":"College"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('sy-1', 'school_years', 'SY2024', '2024-2025', '', true, 0, '{"startDate":"2024-06-01","endDate":"2025-03-31","isCurrent":false}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('sy-2', 'school_years', 'SY2025', '2025-2026', '', true, 1, '{"startDate":"2025-06-01","endDate":"2026-03-31","isCurrent":false}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('sy-3', 'school_years', 'SY2026', '2026-2027', '', true, 2, '{"startDate":"2026-06-01","endDate":"2027-03-31","isCurrent":true}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('sem-1', 'semesters', 'SEM1', 'First Semester', 'August to December', true, 0, '{"semesterNumber":1}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('sem-2', 'semesters', 'SEM2', 'Second Semester', 'January to May', true, 1, '{"semesterNumber":2}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('sem-3', 'semesters', 'SUM', 'Summer', 'May to June', true, 2, '{"semesterNumber":3}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('sem-4', 'semesters', 'FY', 'Full Year', 'June to March — Basic Ed', true, 3, '{"semesterNumber":0}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('dept-1', 'departments', 'BASED', 'Basic Education', 'K-12 department', true, 0, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('dept-2', 'departments', 'COLL', 'College', 'Tertiary programs', true, 1, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('dept-3', 'departments', 'ACCT', 'Accounting', 'Finance and billing', true, 2, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('dept-4', 'departments', 'REGR', 'Registrar', 'Records management', true, 3, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('dept-5', 'departments', 'HR', 'Human Resources', 'Staff management', true, 4, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('dept-6', 'departments', 'ADMIN', 'Administration', 'Executive office', true, 5, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('hol-1', 'holidays', 'RH-NY', 'New Year''s Day', 'January 1', true, 0, '{"date":"2027-01-01","holidayType":"Regular"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('hol-2', 'holidays', 'RH-PNR', 'Pampanga National Day', 'April 9', true, 1, '{"date":"2027-04-09","holidayType":"Regular"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('hol-3', 'holidays', 'RH-LD', 'Labor Day', 'May 1', true, 2, '{"date":"2027-05-01","holidayType":"Regular"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('hol-4', 'holidays', 'RH-IND', 'Independence Day', 'June 12', true, 3, '{"date":"2027-06-12","holidayType":"Regular"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('hol-5', 'holidays', 'SH-NDSR', 'National Day of Sacrifice for Rizal', 'December 30', true, 4, '{"date":"2027-12-30","holidayType":"Special Non-Working"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('at-1', 'admission_types', 'NEW', 'New Student', 'First time enrollment', true, 0, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('at-2', 'admission_types', 'OLD', 'Old Student / Continuing', 'Returning from previous year', true, 1, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('at-3', 'admission_types', 'TRANS', 'Transferee', 'Coming from another school', true, 2, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('at-4', 'admission_types', 'RET', 'Returnee', 'Readmitted after absence', true, 3, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('at-5', 'admission_types', 'CROSS', 'Cross-Enrollee', 'Enrolled in another school', true, 4, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('er-1', 'enrollment_requirements', 'PSA', 'PSA Birth Certificate', 'Original and photocopy', true, 0, '{"isRequired":true}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('er-2', 'enrollment_requirements', 'GMC', 'Good Moral Certificate', 'From previous school', true, 1, '{"isRequired":true}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('er-3', 'enrollment_requirements', 'TOR', 'Transcript of Records', 'Official TOR from last school', true, 2, '{"isRequired":true}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('er-4', 'enrollment_requirements', 'F137', 'Form 137 / SF9', 'For basic education', true, 3, '{"isRequired":true}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('er-5', 'enrollment_requirements', '2X2', 'ID Picture (2x2)', 'Recent photo on white background', true, 4, '{"isRequired":true}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('er-6', 'enrollment_requirements', 'BRGY', 'Barangay Clearance', 'For new students', true, 5, '{"isRequired":false}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('ss-1', 'student_statuses', 'ENRL', 'Enrolled', 'Currently enrolled and active', true, 0, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('ss-2', 'student_statuses', 'PEND', 'Pending', 'Application under review', true, 1, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('ss-3', 'student_statuses', 'APPR', 'Approved', 'Enrollment approved, pending payment', true, 2, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('ss-4', 'student_statuses', 'REJ', 'Rejected', 'Application denied', true, 3, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('ss-5', 'student_statuses', 'LOA', 'Leave of Absence', 'Temporary leave', true, 4, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('ss-6', 'student_statuses', 'DROP', 'Dropped', 'Officially dropped enrollment', true, 5, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('ss-7', 'student_statuses', 'GRAD', 'Graduated', 'Completed program', true, 6, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('camp-1', 'campuses', 'STSN', 'St. Theresa''s School of Novaliches', 'Main campus', true, 0, '{"address":"Novaliches, Quezon City","contactNo":"+63 2 1234 5678"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('camp-2', 'campuses', 'CDSTA', 'Colegio de Sta. Teresa de Avila', 'College campus', true, 1, '{"address":"Novaliches, Quezon City","contactNo":"+63 2 8765 4321"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('bld-1', 'buildings', 'MAIN', 'Main Building', 'Primary academic building', true, 0, '{"campusId":"camp-1","numberOfFloors":4}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('bld-2', 'buildings', 'SCI', 'Science Building', 'Laboratories and science rooms', true, 1, '{"campusId":"camp-1","numberOfFloors":3}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('bld-3', 'buildings', 'GYM', 'Gymnasium', 'Sports and events venue', true, 2, '{"campusId":"camp-1","numberOfFloors":1}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('bld-4', 'buildings', 'COLL-MAIN', 'College Main Building', '', true, 3, '{"campusId":"camp-2","numberOfFloors":5}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('bld-5', 'buildings', 'LIB', 'Library Building', 'Academic resources', true, 4, '{"campusId":"camp-1","numberOfFloors":2}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('rt-1', 'room_types', 'REG', 'Regular Classroom', 'Standard learning room', true, 0, '{"maxCapacity":45}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('rt-2', 'room_types', 'LAB', 'Computer Laboratory', 'IT lab', true, 1, '{"maxCapacity":35}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('rt-3', 'room_types', 'SCI', 'Science Laboratory', 'Science experiments', true, 2, '{"maxCapacity":30}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('rt-4', 'room_types', 'LANG', 'Language Laboratory', 'Audio-visual language room', true, 3, '{"maxCapacity":30}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('rt-5', 'room_types', 'LEC', 'Lecture Hall', 'Large lecture venue', true, 4, '{"maxCapacity":120}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('rt-6', 'room_types', 'CONF', 'Conference Room', 'Meetings and deliberations', true, 5, '{"maxCapacity":20}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('rt-7', 'room_types', 'AUD', 'Auditorium', 'Events and ceremonies', true, 6, '{"maxCapacity":500}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('rm-1', 'rooms', '101', 'Room 101', '', true, 0, '{"buildingId":"bld-1","roomTypeId":"rt-1","capacity":45}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('rm-2', 'rooms', '102', 'Room 102', '', true, 1, '{"buildingId":"bld-1","roomTypeId":"rt-1","capacity":45}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('rm-3', 'rooms', '201', 'Room 201', '', true, 2, '{"buildingId":"bld-1","roomTypeId":"rt-1","capacity":45}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('rm-4', 'rooms', '202', 'Room 202', '', true, 3, '{"buildingId":"bld-1","roomTypeId":"rt-1","capacity":45}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('rm-5', 'rooms', 'SCI-L1', 'Science Lab 1', '', true, 4, '{"buildingId":"bld-2","roomTypeId":"rt-3","capacity":30}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('rm-6', 'rooms', 'IT-L1', 'IT Lab 1', '', true, 5, '{"buildingId":"bld-2","roomTypeId":"rt-2","capacity":35}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('rm-7', 'rooms', 'IT-L2', 'IT Lab 2', '', true, 6, '{"buildingId":"bld-2","roomTypeId":"rt-2","capacity":35}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('rm-8', 'rooms', 'GYM-MAIN', 'Main Gym', '', true, 7, '{"buildingId":"bld-3","roomTypeId":"rt-7","capacity":500}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('ts-1', 'time_slots', '7AM', '07:00 AM - 08:00 AM', '', true, 0, '{"startTime":"07:00","endTime":"08:00","durationMinutes":60}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('ts-2', 'time_slots', '8AM', '08:00 AM - 09:00 AM', '', true, 1, '{"startTime":"08:00","endTime":"09:00","durationMinutes":60}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('ts-3', 'time_slots', '9AM', '09:00 AM - 10:00 AM', '', true, 2, '{"startTime":"09:00","endTime":"10:00","durationMinutes":60}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('ts-4', 'time_slots', '10AM', '10:00 AM - 11:00 AM', '', true, 3, '{"startTime":"10:00","endTime":"11:00","durationMinutes":60}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('ts-5', 'time_slots', '11AM', '11:00 AM - 12:00 PM', '', true, 4, '{"startTime":"11:00","endTime":"12:00","durationMinutes":60}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('ts-6', 'time_slots', '1PM', '01:00 PM - 02:00 PM', '', true, 5, '{"startTime":"13:00","endTime":"14:00","durationMinutes":60}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('ts-7', 'time_slots', '2PM', '02:00 PM - 03:00 PM', '', true, 6, '{"startTime":"14:00","endTime":"15:00","durationMinutes":60}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('ts-8', 'time_slots', '3PM', '03:00 PM - 04:00 PM', '', true, 7, '{"startTime":"15:00","endTime":"16:00","durationMinutes":60}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('ts-9', 'time_slots', '4PM', '04:00 PM - 05:00 PM', '', true, 8, '{"startTime":"16:00","endTime":"17:00","durationMinutes":60}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('ts-10', 'time_slots', '7-9AM', '07:00 AM - 09:00 AM', '', true, 9, '{"startTime":"07:00","endTime":"09:00","durationMinutes":120}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('ts-11', 'time_slots', '9-11AM', '09:00 AM - 11:00 AM', '', true, 10, '{"startTime":"09:00","endTime":"11:00","durationMinutes":120}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('ts-12', 'time_slots', '1-3PM', '01:00 PM - 03:00 PM', '', true, 11, '{"startTime":"13:00","endTime":"15:00","durationMinutes":120}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('ts-13', 'time_slots', '3-5PM', '03:00 PM - 05:00 PM', '', true, 12, '{"startTime":"15:00","endTime":"17:00","durationMinutes":120}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('fr-1', 'faculty_ranks', 'INST-1', 'Instructor I', 'Entry level instructor', true, 0, '{"level":1}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('fr-2', 'faculty_ranks', 'INST-2', 'Instructor II', '', true, 1, '{"level":2}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('fr-3', 'faculty_ranks', 'INST-3', 'Instructor III', '', true, 2, '{"level":3}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('fr-4', 'faculty_ranks', 'ASST-PROF-1', 'Assistant Professor I', '', true, 3, '{"level":4}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('fr-5', 'faculty_ranks', 'ASST-PROF-2', 'Assistant Professor II', '', true, 4, '{"level":5}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('fr-6', 'faculty_ranks', 'ASSOC-PROF', 'Associate Professor', '', true, 5, '{"level":6}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('fr-7', 'faculty_ranks', 'PROF', 'Professor', 'Full professor rank', true, 6, '{"level":7}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('et-1', 'employment_types', 'FT', 'Full-Time', 'Permanent full-time employee', true, 0, '{"isFullTime":true}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('et-2', 'employment_types', 'PT', 'Part-Time', 'Part-time or fractional', true, 1, '{"isFullTime":false}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('et-3', 'employment_types', 'CONT', 'Contractual', 'Fixed-term contract', true, 2, '{"isFullTime":false}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('et-4', 'employment_types', 'COS', 'Contract of Service', 'Per project/semester', true, 3, '{"isFullTime":false}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('fc-1', 'fee_categories', 'TUI', 'Tuition', 'Academic instruction fee', true, 0, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('fc-2', 'fee_categories', 'MISC', 'Miscellaneous', 'Registration, activity, insurance', true, 1, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('fc-3', 'fee_categories', 'LAB', 'Laboratory', 'Science and IT lab fees', true, 2, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('fc-4', 'fee_categories', 'ID', 'ID / Facilities', 'School ID and facilities', true, 3, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('fc-5', 'fee_categories', 'PEN', 'Penalty', 'Late payment penalties', true, 4, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('fc-6', 'fee_categories', 'OTHER', 'Other Fees', 'Miscellaneous uncategorized fees', true, 5, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('fi-1', 'fee_items', 'SHS-TUI', 'SHS Tuition Fee', 'Standard SHS tuition', true, 0, '{"categoryId":"fc-1","amount":18000}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('fi-2', 'fee_items', 'COL-TUI', 'College Tuition per Unit', 'Per credit unit', true, 1, '{"categoryId":"fc-1","amount":950}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('fi-3', 'fee_items', 'REGFEE', 'Registration & Misc Fee', 'Annual registration', true, 2, '{"categoryId":"fc-2","amount":4500}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('fi-4', 'fee_items', 'LABFEE', 'Computer Lab Fee', 'IT laboratory access', true, 3, '{"categoryId":"fc-3","amount":3500}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('fi-5', 'fee_items', 'IDFEE', 'School ID / Facilities Fee', 'ID and campus access', true, 4, '{"categoryId":"fc-4","amount":1000}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('fi-6', 'fee_items', 'LATEPEN', 'Late Payment Penalty', 'Monthly late penalty', true, 5, '{"categoryId":"fc-5","amount":500}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('pt-1', 'payment_terms', 'CASH', 'Full Cash Payment', 'One-time full payment', true, 0, '{"numberOfInstallments":1,"downpaymentPercent":100}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('pt-2', 'payment_terms', 'SEMI', 'Installment - 2 Payments', 'Semestral payment', true, 1, '{"numberOfInstallments":2,"downpaymentPercent":60}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('pt-3', 'payment_terms', 'QTRLY', 'Installment - 4 Payments', 'Quarterly payment', true, 2, '{"numberOfInstallments":4,"downpaymentPercent":40}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('pm-1', 'payment_methods', 'CASH', 'Cash', 'Over-the-counter cash', true, 0, '{"type":"Cash"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('pm-2', 'payment_methods', 'GCASH', 'GCash', 'Mobile wallet - GCash', true, 1, '{"type":"Digital"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('pm-3', 'payment_methods', 'BDO', 'Bank Transfer (BDO)', 'BDO bank deposit/transfer', true, 2, '{"type":"Bank"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('pm-4', 'payment_methods', 'BPI', 'Bank Transfer (BPI)', 'BPI bank deposit/transfer', true, 3, '{"type":"Bank"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('pm-5', 'payment_methods', 'CC', 'Credit Card', 'Visa/Mastercard', true, 4, '{"type":"Card"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('pm-6', 'payment_methods', 'CHECK', 'Manager''s Check', 'Bank-certified check', true, 5, '{"type":"Bank"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('coa-1', 'chart_of_accounts', '1000', 'Cash on Hand', '', true, 0, '{"accountType":"Asset","accountNo":"1000"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('coa-2', 'chart_of_accounts', '1100', 'Cash in Bank - BDO', '', true, 1, '{"accountType":"Asset","accountNo":"1100"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('coa-3', 'chart_of_accounts', '1200', 'Cash in Bank - BPI', '', true, 2, '{"accountType":"Asset","accountNo":"1200"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('coa-4', 'chart_of_accounts', '1300', 'Accounts Receivable - Students', '', true, 3, '{"accountType":"Asset","accountNo":"1300"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('coa-5', 'chart_of_accounts', '4000', 'Tuition Revenue', '', true, 4, '{"accountType":"Revenue","accountNo":"4000"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('coa-6', 'chart_of_accounts', '4100', 'Miscellaneous Revenue', '', true, 5, '{"accountType":"Revenue","accountNo":"4100"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('coa-7', 'chart_of_accounts', '4200', 'Laboratory Fee Revenue', '', true, 6, '{"accountType":"Revenue","accountNo":"4200"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('coa-8', 'chart_of_accounts', '5000', 'Salaries and Wages', '', true, 7, '{"accountType":"Expense","accountNo":"5000"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('coa-9', 'chart_of_accounts', '5100', 'SSS Contribution', '', true, 8, '{"accountType":"Expense","accountNo":"5100"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('coa-10', 'chart_of_accounts', '5200', 'PhilHealth Contribution', '', true, 9, '{"accountType":"Expense","accountNo":"5200"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('ap-1', 'accounting_periods', 'AY2025-S1', 'AY 2025-2026 - First Semester', 'Aug 2025 to Dec 2025', true, 0, '{"startDate":"2025-08-01","endDate":"2025-12-31","isClosed":true}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('ap-2', 'accounting_periods', 'AY2025-S2', 'AY 2025-2026 - Second Semester', 'Jan 2026 to May 2026', true, 1, '{"startDate":"2026-01-01","endDate":"2026-05-31","isClosed":false}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('ap-3', 'accounting_periods', 'AY2026-S1', 'AY 2026-2027 - First Semester', 'Aug 2026 to Dec 2026', true, 2, '{"startDate":"2026-08-01","endDate":"2026-12-31","isClosed":false}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('ors-1', 'or_series', 'OR2026', 'OR-2026-XXXXX', 'Official receipts for AY 2026-2027', true, 0, '{"prefix":"OR-2026","currentSerial":10460,"year":2026}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('ors-2', 'or_series', 'OR2025', 'OR-2025-XXXXX', 'Official receipts for AY 2025-2026', true, 1, '{"prefix":"OR-2025","currentSerial":8832,"year":2025}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('rr-1', 'refund_reasons', 'OVERPY', 'Overpayment Refund', 'Amount paid exceeds assessment', true, 0, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('rr-2', 'refund_reasons', 'CANCEL', 'Enrollment Cancellation', 'Student cancelled before start', true, 1, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('rr-3', 'refund_reasons', 'DUP', 'Duplicate Payment', 'Payment recorded twice', true, 2, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('rr-4', 'refund_reasons', 'SCHOL', 'Scholarship Grant Applied', 'Refund due to retroactive scholarship', true, 3, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('vr-1', 'void_reasons', 'ERR', 'Data Entry Error', 'Incorrect receipt data', true, 0, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('vr-2', 'void_reasons', 'DUP', 'Duplicate Receipt', 'Receipt issued twice for same payment', true, 1, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('vr-3', 'void_reasons', 'CANCEL', 'Transaction Cancelled', 'Payment transaction reversed', true, 2, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('vr-4', 'void_reasons', 'WRONG-STU', 'Wrong Student', 'Receipt issued to incorrect student', true, 3, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('nat-1', 'nationalities', 'FIL', 'Filipino', 'Philippine nationality', true, 0, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('nat-2', 'nationalities', 'CHN', 'Chinese', '', true, 1, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('nat-3', 'nationalities', 'KOR', 'Korean', '', true, 2, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('nat-4', 'nationalities', 'JPN', 'Japanese', '', true, 3, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('nat-5', 'nationalities', 'USA', 'American', '', true, 4, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('nat-6', 'nationalities', 'OTHER', 'Other', 'Non-listed nationality', true, 5, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('cs-1', 'civil_statuses', 'SGL', 'Single', '', true, 0, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('cs-2', 'civil_statuses', 'MAR', 'Married', '', true, 1, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('cs-3', 'civil_statuses', 'WIDW', 'Widowed', '', true, 2, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('cs-4', 'civil_statuses', 'SEP', 'Legally Separated', '', true, 3, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('cs-5', 'civil_statuses', 'ANN', 'Annulled', '', true, 4, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('rel-1', 'religions', 'CAT', 'Roman Catholic', '', true, 0, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('rel-2', 'religions', 'PROT', 'Protestant', '', true, 1, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('rel-3', 'religions', 'IGL', 'Iglesia ni Cristo', '', true, 2, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('rel-4', 'religions', 'ADB', 'Adventist', '', true, 3, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('rel-5', 'religions', 'ISLAM', 'Islam', '', true, 4, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('rel-6', 'religions', 'OTHER', 'Other Religion', '', true, 5, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('st-1', 'student_types', 'REG', 'Regular Student', 'Full-time enrolled', true, 0, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('st-2', 'student_types', 'IRREG', 'Irregular Student', 'Not following standard curriculum', true, 1, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('st-3', 'student_types', 'CROSS', 'Cross-Enrollee', 'Enrolled from another school', true, 2, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('st-4', 'student_types', 'SPEC', 'Special Student', 'Non-degree or certificate program', true, 3, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('gs-1', 'grade_scales', 'A', '1.00', 'Excellent', true, 0, '{"minGrade":98,"maxGrade":100,"equivalent":"1.00","remarks":"Excellent"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('gs-2', 'grade_scales', 'B', '1.25', 'Very Good', true, 1, '{"minGrade":95,"maxGrade":97,"equivalent":"1.25","remarks":"Very Good"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('gs-3', 'grade_scales', 'C', '1.50', 'Good', true, 2, '{"minGrade":92,"maxGrade":94,"equivalent":"1.50","remarks":"Good"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('gs-4', 'grade_scales', 'D', '1.75', 'Good', true, 3, '{"minGrade":89,"maxGrade":91,"equivalent":"1.75","remarks":"Good"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('gs-5', 'grade_scales', 'E', '2.00', 'Satisfactory', true, 4, '{"minGrade":86,"maxGrade":88,"equivalent":"2.00","remarks":"Satisfactory"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('gs-6', 'grade_scales', 'F', '2.25', 'Satisfactory', true, 5, '{"minGrade":83,"maxGrade":85,"equivalent":"2.25","remarks":"Satisfactory"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('gs-7', 'grade_scales', 'G', '2.50', 'Fair', true, 6, '{"minGrade":80,"maxGrade":82,"equivalent":"2.50","remarks":"Fair"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('gs-8', 'grade_scales', 'H', '2.75', 'Fair', true, 7, '{"minGrade":77,"maxGrade":79,"equivalent":"2.75","remarks":"Fair"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('gs-9', 'grade_scales', 'I', '3.00', 'Passing', true, 8, '{"minGrade":75,"maxGrade":76,"equivalent":"3.00","remarks":"Passing"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('gs-10', 'grade_scales', 'F', '5.00', 'Failed', true, 9, '{"minGrade":0,"maxGrade":74,"equivalent":"5.00","remarks":"Failed"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('dt-1', 'document_types', 'TOR', 'Transcript of Records', 'Official TOR', true, 0, '{"isRequired":true}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('dt-2', 'document_types', 'COR', 'Certificate of Registration', 'Semestral COR', true, 1, '{"isRequired":false}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('dt-3', 'document_types', 'DIPL', 'Diploma', 'Graduation diploma', true, 2, '{"isRequired":false}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('dt-4', 'document_types', 'CERT', 'Certificate of Good Moral', 'Moral character cert', true, 3, '{"isRequired":true}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('dt-5', 'document_types', 'PSA', 'PSA Birth Certificate', 'Civil registry cert', true, 4, '{"isRequired":true}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('dt-6', 'document_types', 'DISP', 'Certificate of Dismissal', 'Transfer credential', true, 5, '{"isRequired":false}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('ct-1', 'collection_types', 'TUI', 'Tuition Collection', 'Regular tuition payments', true, 0, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('ct-2', 'collection_types', 'MISC', 'Miscellaneous Collection', 'Misc fee payments', true, 1, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('ct-3', 'collection_types', 'PEN', 'Penalty Collection', 'Late fee penalties', true, 2, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('ct-4', 'collection_types', 'REFUND', 'Refund', 'Student refund transactions', true, 3, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('ct-5', 'collection_types', 'ADJ', 'Adjustment', 'Assessment corrections', true, 4, '{}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('role-1', 'roles_setup', 'SUPER_ADMIN', 'Super Administrator', 'Full system access', true, 0, '{"level":10}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('role-2', 'roles_setup', 'ADMIN', 'Administrator', 'Module-level administration', true, 1, '{"level":9}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('role-3', 'roles_setup', 'REGISTRAR', 'Registrar', 'Enrollment and records', true, 2, '{"level":7}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('role-4', 'roles_setup', 'ACCOUNTING', 'Accounting Officer', 'Financial management', true, 3, '{"level":7}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('role-5', 'roles_setup', 'TEACHER', 'Teacher', 'Grade encoding and attendance', true, 4, '{"level":5}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('role-6', 'roles_setup', 'HR', 'HR Manager', 'Payroll and employee management', true, 5, '{"level":6}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('role-7', 'roles_setup', 'STUDENT', 'Student', 'Portal access only', true, 6, '{"level":1}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('perm-1', 'permissions_setup', 'STUD_VIEW', 'View Students', 'Access student directory', true, 0, '{"module":"Registrar"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('perm-2', 'permissions_setup', 'STUD_CREATE', 'Create Students', 'Add new student records', true, 1, '{"module":"Registrar"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('perm-3', 'permissions_setup', 'STUD_EDIT', 'Edit Students', 'Modify student records', true, 2, '{"module":"Registrar"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('perm-4', 'permissions_setup', 'ENRL_APPROVE', 'Approve Enrollment', 'Approve/reject enrollments', true, 3, '{"module":"Registrar"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('perm-5', 'permissions_setup', 'PAY_VIEW', 'View Payments', 'Access payment history', true, 4, '{"module":"Accounting"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('perm-6', 'permissions_setup', 'PAY_POST', 'Post Payments', 'Record new payments', true, 5, '{"module":"Accounting"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('perm-7', 'permissions_setup', 'DISC_APPROVE', 'Approve Discounts', 'Approve discount requests', true, 6, '{"module":"Accounting"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('perm-8', 'permissions_setup', 'GRADE_ENCODE', 'Encode Grades', 'Submit and edit grades', true, 7, '{"module":"Grading"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('perm-9', 'permissions_setup', 'HR_PAYROLL', 'Process Payroll', 'Generate and post payroll', true, 8, '{"module":"HR"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('perm-10', 'permissions_setup', 'SETUP_MANAGE', 'Manage Setup', 'Configure system setup', true, 9, '{"module":"Core Setup"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('ict-1', 'id_card_templates', 'STSN-STUD', 'STSN Student ID 2026', 'Current student ID template', true, 0, '{"campus":"St. Theresa''s School","cardColor":"#5C4533","logoPath":"/logos/stsn.png"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('ict-2', 'id_card_templates', 'CDSTA-STUD', 'Colegio Student ID 2026', 'College student ID template', true, 1, '{"campus":"Colegio de Sta. Teresa","cardColor":"#1d4ed8","logoPath":"/logos/cdsta.png"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('ict-3', 'id_card_templates', 'STAFF', 'Staff ID 2026', 'Employee and faculty ID', true, 2, '{"campus":"Both","cardColor":"#4A3728","logoPath":"/logos/stsn.png"}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('ew-1', 'enrollment_workflows', 'BASIC-ED', 'Basic Education Enrollment Flow', 'K-12 enrollment process', true, 0, '{"steps":["Application","Document Submission","Assessment","Payment","Approval"]}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('ew-2', 'enrollment_workflows', 'COLLEGE', 'College Enrollment Flow', 'Tertiary enrollment process', true, 1, '{"steps":["Pre-enrollment","Requirements","Subject Selection","Assessment","Payment","Enrollment"]}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('ew-3', 'enrollment_workflows', 'TRANSFER', 'Transferee Enrollment Flow', 'Transferee process', true, 2, '{"steps":["Application","Evaluation","Document Verification","Assessment","Approval"]}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('cw-1', 'clearance_workflows', 'SEM-CLEAR', 'Semestral Clearance', 'End of semester clearance', true, 0, '{"departments":["Library","Accounting","Registrar","Subject Teachers","Dean/Principal"]}'::jsonb, 'Admin Administrator', '2026-01-01'),
  ('cw-2', 'clearance_workflows', 'GRAD-CLEAR', 'Graduation Clearance', 'Pre-graduation clearance', true, 1, '{"departments":["All Academic","Accounting","Registrar","Guidance","Alumni"]}'::jsonb, 'Admin Administrator', '2026-01-01')
on conflict do nothing;
insert into public.setup_items (legacy_id, category, code, name, description, is_active, sort_order, metadata, created_by, created_at) values
  ('days_of_week-1', 'days_of_week', 'Monday', 'Monday', NULL, true, 0, '{}'::jsonb, NULL, now()),
  ('days_of_week-2', 'days_of_week', 'Tuesday', 'Tuesday', NULL, true, 1, '{}'::jsonb, NULL, now()),
  ('days_of_week-3', 'days_of_week', 'Wednesday', 'Wednesday', NULL, true, 2, '{}'::jsonb, NULL, now()),
  ('days_of_week-4', 'days_of_week', 'Thursday', 'Thursday', NULL, true, 3, '{}'::jsonb, NULL, now()),
  ('days_of_week-5', 'days_of_week', 'Friday', 'Friday', NULL, true, 4, '{}'::jsonb, NULL, now()),
  ('days_of_week-6', 'days_of_week', 'Saturday', 'Saturday', NULL, true, 5, '{}'::jsonb, NULL, now()),
  ('transaction_types-1', 'transaction_types', 'Payment', 'Payment', NULL, true, 0, '{}'::jsonb, NULL, now()),
  ('transaction_types-2', 'transaction_types', 'Assessment', 'Assessment', NULL, true, 1, '{}'::jsonb, NULL, now()),
  ('transaction_types-3', 'transaction_types', 'Discount', 'Discount', NULL, true, 2, '{}'::jsonb, NULL, now()),
  ('transaction_types-4', 'transaction_types', 'Adjustment', 'Adjustment', NULL, true, 3, '{}'::jsonb, NULL, now()),
  ('transaction_types-5', 'transaction_types', 'Penalty', 'Penalty', NULL, true, 4, '{}'::jsonb, NULL, now()),
  ('discount_sources-1', 'discount_sources', 'Government', 'Government', NULL, true, 0, '{}'::jsonb, NULL, now()),
  ('discount_sources-2', 'discount_sources', 'Sibling', 'Sibling', NULL, true, 1, '{}'::jsonb, NULL, now()),
  ('discount_sources-3', 'discount_sources', 'Owner', 'Owner', NULL, true, 2, '{}'::jsonb, NULL, now()),
  ('discount_sources-4', 'discount_sources', 'Scholarship', 'Scholarship', NULL, true, 3, '{}'::jsonb, NULL, now()),
  ('discount_sources-5', 'discount_sources', 'Employee', 'Employee', NULL, true, 4, '{}'::jsonb, NULL, now()),
  ('discount_sources-6', 'discount_sources', 'Other', 'Other', NULL, true, 5, '{}'::jsonb, NULL, now()),
  ('discount_request_statuses-1', 'discount_request_statuses', 'Pending', 'Pending', NULL, true, 0, '{}'::jsonb, NULL, now()),
  ('discount_request_statuses-2', 'discount_request_statuses', 'For Review', 'For Review', NULL, true, 1, '{}'::jsonb, NULL, now()),
  ('discount_request_statuses-3', 'discount_request_statuses', 'Approved', 'Approved', NULL, true, 2, '{}'::jsonb, NULL, now()),
  ('discount_request_statuses-4', 'discount_request_statuses', 'Rejected', 'Rejected', NULL, true, 3, '{}'::jsonb, NULL, now()),
  ('discount_request_statuses-5', 'discount_request_statuses', 'Returned for Documents', 'Returned for Documents', NULL, true, 4, '{}'::jsonb, NULL, now()),
  ('discount_request_statuses-6', 'discount_request_statuses', 'Cancelled', 'Cancelled', NULL, true, 5, '{}'::jsonb, NULL, now()),
  ('discount_request_statuses-7', 'discount_request_statuses', 'Expired', 'Expired', NULL, true, 6, '{}'::jsonb, NULL, now()),
  ('financial_hold_statuses-1', 'financial_hold_statuses', 'Active', 'Active', NULL, true, 0, '{}'::jsonb, NULL, now()),
  ('financial_hold_statuses-2', 'financial_hold_statuses', 'Cleared', 'Cleared', NULL, true, 1, '{}'::jsonb, NULL, now()),
  ('assessment_approval_statuses-1', 'assessment_approval_statuses', 'Pending Accounting Approval', 'Pending Accounting Approval', NULL, true, 0, '{}'::jsonb, NULL, now()),
  ('assessment_approval_statuses-2', 'assessment_approval_statuses', 'Approved for Payment', 'Approved for Payment', NULL, true, 1, '{}'::jsonb, NULL, now()),
  ('assessment_approval_statuses-3', 'assessment_approval_statuses', 'Returned to Registrar', 'Returned to Registrar', NULL, true, 2, '{}'::jsonb, NULL, now()),
  ('assessment_approval_statuses-4', 'assessment_approval_statuses', 'Rejected', 'Rejected', NULL, true, 3, '{}'::jsonb, NULL, now()),
  ('enrollment_types-1', 'enrollment_types', 'New Student', 'New Student', NULL, true, 0, '{}'::jsonb, NULL, now()),
  ('enrollment_types-2', 'enrollment_types', 'Old Student', 'Old Student', NULL, true, 1, '{}'::jsonb, NULL, now()),
  ('enrollment_types-3', 'enrollment_types', 'Transferee', 'Transferee', NULL, true, 2, '{}'::jsonb, NULL, now()),
  ('enrollment_types-4', 'enrollment_types', 'Returnee', 'Returnee', NULL, true, 3, '{}'::jsonb, NULL, now()),
  ('book_package_statuses-1', 'book_package_statuses', 'Active', 'Active', NULL, true, 0, '{}'::jsonb, NULL, now()),
  ('book_package_statuses-2', 'book_package_statuses', 'Inactive', 'Inactive', NULL, true, 1, '{}'::jsonb, NULL, now()),
  ('learning_material_types-1', 'learning_material_types', 'Video', 'Video', NULL, true, 0, '{}'::jsonb, NULL, now()),
  ('learning_material_types-2', 'learning_material_types', 'Module', 'Module', NULL, true, 1, '{}'::jsonb, NULL, now()),
  ('learning_material_types-3', 'learning_material_types', 'Document', 'Document', NULL, true, 2, '{}'::jsonb, NULL, now()),
  ('room_statuses-1', 'room_statuses', 'Available', 'Available', NULL, true, 0, '{}'::jsonb, NULL, now()),
  ('room_statuses-2', 'room_statuses', 'Under Maintenance', 'Under Maintenance', NULL, true, 1, '{}'::jsonb, NULL, now()),
  ('room_statuses-3', 'room_statuses', 'Reserved', 'Reserved', NULL, true, 2, '{}'::jsonb, NULL, now()),
  ('payment_remittance_terms-1', 'payment_remittance_terms', 'Downpayment', 'Downpayment', NULL, true, 0, '{}'::jsonb, NULL, now()),
  ('payment_remittance_terms-2', 'payment_remittance_terms', 'Midterm', 'Midterm', NULL, true, 1, '{}'::jsonb, NULL, now()),
  ('payment_remittance_terms-3', 'payment_remittance_terms', 'Finals', 'Finals', NULL, true, 2, '{}'::jsonb, NULL, now()),
  ('payment_remittance_terms-4', 'payment_remittance_terms', 'Full Payment', 'Full Payment', NULL, true, 3, '{}'::jsonb, NULL, now()),
  ('payment_remittance_terms-5', 'payment_remittance_terms', 'Installment', 'Installment', NULL, true, 4, '{}'::jsonb, NULL, now()),
  ('payment_methods_cashier-1', 'payment_methods_cashier', 'Cash', 'Cash', NULL, true, 0, '{}'::jsonb, NULL, now()),
  ('payment_methods_cashier-2', 'payment_methods_cashier', 'GCash', 'GCash', NULL, true, 1, '{}'::jsonb, NULL, now()),
  ('payment_methods_cashier-3', 'payment_methods_cashier', 'Bank Transfer', 'Bank Transfer', NULL, true, 2, '{}'::jsonb, NULL, now()),
  ('payment_methods_cashier-4', 'payment_methods_cashier', 'Credit Card', 'Credit Card', NULL, true, 3, '{}'::jsonb, NULL, now())
on conflict do nothing;

-- ============================================================================
-- USERS
-- ============================================================================
insert into public.users (legacy_id, school_id, email, name, role, is_active, avatar_url, department) values
  ('user-admin', NULL, 'admin@stsn.edu.ph', 'Admin Administrator', 'SUPER_ADMIN', true, '', 'Administration'),
  ('user-registrar', (select id from public.schools where legacy_id = 'STSN'), 'registrar@stsn.edu.ph', 'Cynthia Ramos, LPT', 'REGISTRAR', true, '', 'Support'),
  ('user-accounting', (select id from public.schools where legacy_id = 'STSN'), 'accounting@stsn.edu.ph', 'Eduardo Bonto, CPA', 'ACCOUNTING', true, '', 'Support'),
  ('user-cashier', (select id from public.schools where legacy_id = 'STSN'), 'cashier@stsn.edu.ph', 'Maria Santos', 'CASHIER', true, '', 'Support'),
  ('user-teacher', (select id from public.schools where legacy_id = 'STSN'), 'teacher@stsn.edu.ph', 'Prof. Arthur Reyes', 'TEACHER', true, '', 'College'),
  ('user-student', (select id from public.schools where legacy_id = 'STSN'), 'student@stsn.edu.ph', 'Enrico Veloso', 'STUDENT', true, '', 'Basic Education'),
  ('user-hr', (select id from public.schools where legacy_id = 'STSN'), 'hr@stsn.edu.ph', 'Gemma Santos', 'HR', true, '', 'Administration'),
  ('user-cdsta-admin', (select id from public.schools where legacy_id = 'CDSTA'), 'admin@cdsta.edu.ph', 'CDSTA Administrator', 'ADMIN', true, '', 'Administration'),
  ('user-cdsta-registrar', (select id from public.schools where legacy_id = 'CDSTA'), 'registrar@cdsta.edu.ph', 'Maria Luz Aquino, LPT', 'REGISTRAR', true, '', 'Support'),
  ('user-cdsta-accounting', (select id from public.schools where legacy_id = 'CDSTA'), 'accounting@cdsta.edu.ph', 'Jose Macaraig, CPA', 'ACCOUNTING', true, '', 'Support'),
  ('user-cdsta-cashier', (select id from public.schools where legacy_id = 'CDSTA'), 'cashier@cdsta.edu.ph', 'Liza Fernandez', 'CASHIER', true, '', 'Support'),
  ('user-cdsta-teacher', (select id from public.schools where legacy_id = 'CDSTA'), 'teacher@cdsta.edu.ph', 'Prof. Renato Villanueva', 'TEACHER', true, '', 'College'),
  ('user-cdsta-student', (select id from public.schools where legacy_id = 'CDSTA'), 'student@cdsta.edu.ph', 'Maria Clara Dela Cruz', 'STUDENT', true, '', 'College'),
  ('user-cdsta-hr', (select id from public.schools where legacy_id = 'CDSTA'), 'hr@cdsta.edu.ph', 'Teresa Navarro', 'HR', true, '', 'Administration')
on conflict do nothing;

-- ============================================================================
-- COURSES
-- ============================================================================
insert into public.courses (legacy_id, code, name, department, duration_years) values
  ('c-bsit', 'BSIT', 'BS Information Technology', 'College', 4),
  ('c-bscs', 'BSCS', 'BS Computer Science', 'College', 4),
  ('c-bsba', 'BSBA', 'BS Business Administration', 'College', 4),
  ('c-bsa', 'BSA', 'BS Accountancy', 'College', 4),
  ('c-bshm', 'BSHM', 'BS Hospitality Management', 'College', 4),
  ('c-bsed', 'BSED', 'BS Education', 'College', 4),
  ('c-preschool', 'Preschool', 'Preschool Program', 'Basic Education', 3),
  ('c-elementary', 'Elementary', 'Elementary Education (Grade 1-6)', 'Basic Education', 6),
  ('c-jhs', 'Junior High', 'Junior High School (Grade 7-10)', 'Basic Education', 4),
  ('c-stem', 'STEM', 'Senior High — Science, Technology, Engineering, and Mathematics', 'Basic Education', 2),
  ('c-humss', 'HUMSS', 'Senior High — Humanities and Social Sciences', 'Basic Education', 2),
  ('c-abm', 'ABM', 'Senior High — Accountancy, Business, and Management', 'Basic Education', 2),
  ('c-gas', 'GAS', 'Senior High — General Academic Strand', 'Basic Education', 2)
on conflict do nothing;

-- ============================================================================
-- SUBJECTS
-- ============================================================================
insert into public.subjects (legacy_id, code, name, units, department, year_level, semester, track_or_course, prerequisites) values
  ('s-pre-01', 'PRE-LANG', 'Language Development', 0, 'Basic Education', 'Nursery', 'Full Year', 'Preschool', '{}'),
  ('s-pre-02', 'PRE-NUM', 'Number Concepts', 0, 'Basic Education', 'Kinder 1', 'Full Year', 'Preschool', '{}'),
  ('s-pre-03', 'PRE-ART', 'Arts & Creativity', 0, 'Basic Education', 'Kinder 2', 'Full Year', 'Preschool', '{}'),
  ('s-el-01', 'EL-MATH', 'Mathematics', 0, 'Basic Education', 'Grade 1', 'Full Year', 'Elementary', '{}'),
  ('s-el-02', 'EL-ENG', 'English', 0, 'Basic Education', 'Grade 1', 'Full Year', 'Elementary', '{}'),
  ('s-el-03', 'EL-FIL', 'Filipino', 0, 'Basic Education', 'Grade 1', 'Full Year', 'Elementary', '{}'),
  ('s-el-04', 'EL-MTB', 'Mother Tongue Based', 0, 'Basic Education', 'Grade 1', 'Full Year', 'Elementary', '{}'),
  ('s-el-05', 'EL-MATH2', 'Mathematics 2', 0, 'Basic Education', 'Grade 2', 'Full Year', 'Elementary', '{}'),
  ('s-el-06', 'EL-ENG2', 'English 2', 0, 'Basic Education', 'Grade 2', 'Full Year', 'Elementary', '{}'),
  ('s-el-07', 'EL-SCI2', 'Science 2', 0, 'Basic Education', 'Grade 2', 'Full Year', 'Elementary', '{}'),
  ('s-el-08', 'EL-MATH4', 'Mathematics 4', 0, 'Basic Education', 'Grade 4', 'Full Year', 'Elementary', '{}'),
  ('s-el-09', 'EL-SCI4', 'Science 4', 0, 'Basic Education', 'Grade 4', 'Full Year', 'Elementary', '{}'),
  ('s-el-10', 'EL-AP4', 'Araling Panlipunan 4', 0, 'Basic Education', 'Grade 4', 'Full Year', 'Elementary', '{}'),
  ('s-el-11', 'EL-EPN4', 'EPP / TLE 4', 0, 'Basic Education', 'Grade 4', 'Full Year', 'Elementary', '{}'),
  ('s-el-12', 'EL-MATH5', 'Mathematics 5', 0, 'Basic Education', 'Grade 5', 'Full Year', 'Elementary', '{}'),
  ('s-el-13', 'EL-SCI5', 'Science 5', 0, 'Basic Education', 'Grade 5', 'Full Year', 'Elementary', '{}'),
  ('s-el-14', 'EL-MATH6', 'Mathematics 6', 0, 'Basic Education', 'Grade 6', 'Full Year', 'Elementary', '{}'),
  ('s-el-15', 'EL-SCI6', 'Science 6', 0, 'Basic Education', 'Grade 6', 'Full Year', 'Elementary', '{}'),
  ('s-jhs-01', 'JHS-MATH7', 'Mathematics 7', 0, 'Basic Education', 'Grade 7', 'Full Year', 'Junior High', '{}'),
  ('s-jhs-02', 'JHS-SCI7', 'Integrated Science 7', 0, 'Basic Education', 'Grade 7', 'Full Year', 'Junior High', '{}'),
  ('s-jhs-03', 'JHS-ENG7', 'English 7', 0, 'Basic Education', 'Grade 7', 'Full Year', 'Junior High', '{}'),
  ('s-jhs-04', 'JHS-FIL7', 'Filipino 7', 0, 'Basic Education', 'Grade 7', 'Full Year', 'Junior High', '{}'),
  ('s-jhs-05', 'JHS-AP7', 'Araling Panlipunan 7', 0, 'Basic Education', 'Grade 7', 'Full Year', 'Junior High', '{}'),
  ('s-jhs-06', 'JHS-TLE7', 'TLE 7', 0, 'Basic Education', 'Grade 7', 'Full Year', 'Junior High', '{}'),
  ('s-jhs-07', 'JHS-MATH8', 'Mathematics 8', 0, 'Basic Education', 'Grade 8', 'Full Year', 'Junior High', '{}'),
  ('s-jhs-08', 'JHS-SCI8', 'Earth Science 8', 0, 'Basic Education', 'Grade 8', 'Full Year', 'Junior High', '{}'),
  ('s-jhs-09', 'JHS-MATH9', 'Mathematics 9 (Algebra)', 0, 'Basic Education', 'Grade 9', 'Full Year', 'Junior High', '{}'),
  ('s-jhs-10', 'JHS-SCI9', 'Biology 9', 0, 'Basic Education', 'Grade 9', 'Full Year', 'Junior High', '{}'),
  ('s-jhs-11', 'JHS-MATH10', 'Mathematics 10', 0, 'Basic Education', 'Grade 10', 'Full Year', 'Junior High', '{}'),
  ('s-jhs-12', 'JHS-SCI10', 'Physics 10', 0, 'Basic Education', 'Grade 10', 'Full Year', 'Junior High', '{}'),
  ('s-16', 'SHS-ORAL-COM', 'Oral Communication', 0, 'Basic Education', 'Grade 11', 'First Semester', 'STEM', '{}'),
  ('s-17', 'SHS-READ-WRITE', 'Reading and Writing', 0, 'Basic Education', 'Grade 11', 'First Semester', 'STEM', '{}'),
  ('s-18', 'SHS-GEN-MATH', 'General Mathematics', 0, 'Basic Education', 'Grade 11', 'First Semester', 'STEM', '{}'),
  ('s-19', 'SHS-STAT-PROB', 'Statistics and Probability', 0, 'Basic Education', 'Grade 11', 'First Semester', 'STEM', '{}'),
  ('s-20', 'SHS-EARTH-LIFE', 'Earth and Life Science', 0, 'Basic Education', 'Grade 11', 'First Semester', 'STEM', '{}'),
  ('s-21', 'SHS-PHYS-SCI', 'Physical Science', 0, 'Basic Education', 'Grade 11', 'Second Semester', 'STEM', '{}'),
  ('s-22', 'SHS-PER-DEV', 'Personal Development', 0, 'Basic Education', 'Grade 11', 'Second Semester', 'STEM', '{}'),
  ('s-humss-01', 'SHS-HUMSS-PCOM', 'Philippine Politics and Governance', 0, 'Basic Education', 'Grade 11', 'First Semester', 'HUMSS', '{}'),
  ('s-humss-02', 'SHS-HUMSS-CW', 'Creative Writing', 0, 'Basic Education', 'Grade 11', 'First Semester', 'HUMSS', '{}'),
  ('s-humss-03', 'SHS-HUMSS-DISP', 'Disciplines & Ideas in Social Sciences', 0, 'Basic Education', 'Grade 11', 'First Semester', 'HUMSS', '{}'),
  ('s-abm-01', 'SHS-ABM-OBA', 'Organization and Management', 0, 'Basic Education', 'Grade 11', 'First Semester', 'ABM', '{}'),
  ('s-abm-02', 'SHS-ABM-PRIN', 'Fundamentals of ABM', 0, 'Basic Education', 'Grade 11', 'First Semester', 'ABM', '{}'),
  ('s-abm-03', 'SHS-ABM-BM', 'Business Mathematics', 0, 'Basic Education', 'Grade 12', 'First Semester', 'ABM', '{}'),
  ('s-abm-04', 'SHS-ABM-ECON', 'Applied Economics', 0, 'Basic Education', 'Grade 12', 'First Semester', 'ABM', '{}'),
  ('s-01', 'IT101', 'Introduction to Computing', 3, 'College', '1st Year', 'First Semester', 'BSIT', '{}'),
  ('s-02', 'IT102', 'Computer Programming 1', 3, 'College', '1st Year', 'First Semester', 'BSIT', '{}'),
  ('s-03', 'MATH101', 'College Algebra', 3, 'College', '1st Year', 'First Semester', 'BSIT', '{}'),
  ('s-04', 'NSTP1', 'National Service Training Program 1', 3, 'College', '1st Year', 'First Semester', 'BSIT', '{}'),
  ('s-05', 'IT103', 'Computer Programming 2', 3, 'College', '1st Year', 'Second Semester', 'BSIT', ARRAY['IT102']::text[]),
  ('s-06', 'IT104', 'Data Structures and Algorithms', 3, 'College', '1st Year', 'Second Semester', 'BSIT', ARRAY['IT102']::text[]),
  ('s-it-201', 'IT201', 'Web Development 1', 3, 'College', '2nd Year', 'First Semester', 'BSIT', '{}'),
  ('s-it-202', 'IT202', 'Database Management Systems', 3, 'College', '2nd Year', 'First Semester', 'BSIT', '{}'),
  ('s-it-301', 'IT301', 'System Analysis and Design', 3, 'College', '3rd Year', 'First Semester', 'BSIT', '{}'),
  ('s-it-302', 'IT302', 'Network Administration', 3, 'College', '3rd Year', 'First Semester', 'BSIT', '{}'),
  ('s-cs-01', 'CS101', 'Introduction to Computer Science', 3, 'College', '1st Year', 'First Semester', 'BSCS', '{}'),
  ('s-cs-02', 'CS102', 'Discrete Mathematics', 3, 'College', '1st Year', 'First Semester', 'BSCS', '{}'),
  ('s-cs-03', 'CS103', 'Programming Fundamentals', 3, 'College', '1st Year', 'First Semester', 'BSCS', '{}'),
  ('s-cs-04', 'CS201', 'Data Structures', 3, 'College', '2nd Year', 'First Semester', 'BSCS', '{}'),
  ('s-07', 'BA101', 'Principles of Management', 3, 'College', '1st Year', 'First Semester', 'BSBA', '{}'),
  ('s-08', 'BA102', 'Basic Microeconomics', 3, 'College', '1st Year', 'First Semester', 'BSBA', '{}'),
  ('s-09', 'MATH102', 'Business Mathematics', 3, 'College', '1st Year', 'First Semester', 'BSBA', '{}'),
  ('s-ba-201', 'BA201', 'Human Resource Management', 3, 'College', '2nd Year', 'First Semester', 'BSBA', '{}'),
  ('s-ba-202', 'BA202', 'Marketing Management', 3, 'College', '2nd Year', 'First Semester', 'BSBA', '{}'),
  ('s-bsa-01', 'ACCT101', 'Fundamentals of Accounting 1', 3, 'College', '1st Year', 'First Semester', 'BSA', '{}'),
  ('s-bsa-02', 'ACCT102', 'Fundamentals of Accounting 2', 3, 'College', '1st Year', 'Second Semester', 'BSA', '{}'),
  ('s-bsa-03', 'ACCT201', 'Financial Accounting', 3, 'College', '2nd Year', 'First Semester', 'BSA', '{}'),
  ('s-hm-01', 'HM101', 'Introduction to Hospitality Industry', 3, 'College', '1st Year', 'First Semester', 'BSHM', '{}'),
  ('s-hm-02', 'HM102', 'Food and Beverage Service', 3, 'College', '1st Year', 'First Semester', 'BSHM', '{}'),
  ('s-hm-03', 'HM103', 'Housekeeping Operations', 3, 'College', '1st Year', 'Second Semester', 'BSHM', '{}'),
  ('s-ed-01', 'ED101', 'Child and Adolescent Development', 3, 'College', '1st Year', 'First Semester', 'BSED', '{}'),
  ('s-ed-02', 'ED102', 'The Teaching Profession', 3, 'College', '1st Year', 'First Semester', 'BSED', '{}'),
  ('s-ed-401', 'ED401', 'Student Teaching / Practicum', 6, 'College', '4th Year', 'First Semester', 'BSED', '{}'),
  ('s-ed-402', 'ED402', 'Educational Psychology', 3, 'College', '4th Year', 'First Semester', 'BSED', '{}')
on conflict do nothing;

-- ============================================================================
-- TEACHERS
-- ============================================================================
insert into public.teachers (legacy_id, school_id, user_id, first_name, last_name, middle_name, department, email, phone, specialization, advisory_section, is_active) values
  ('teach-arthur', (select id from public.schools where legacy_id = 'STSN'), NULL, 'Arthur', 'Reyes', 'Panganiban', 'College', 'arthur.reyes@stsn.edu.ph', '+639151231122', 'Information Technology & Computer Networks', 'IT101', true),
  ('teach-beatriz', (select id from public.schools where legacy_id = 'STSN'), (select id from public.users where legacy_id = 'user-teacher'), 'Beatriz', 'Cruz', 'Soriano', 'Basic Education', 'beatriz.cruz@stsn.edu.ph', '+639163211155', 'General Mathematics & Statistics', 'St. Thomas', true),
  ('teach-carlo', (select id from public.schools where legacy_id = 'STSN'), NULL, 'Carlo', 'Vergara', 'Dizon', 'College', 'carlo.vergara@stsn.edu.ph', '+639174567890', 'Business Economics & Finance', 'BA201', true),
  ('teach-elena', (select id from public.schools where legacy_id = 'STSN'), NULL, 'Elena', 'Soriano', 'Basa', 'Basic Education', 'elena.soriano@stsn.edu.ph', '+639182345678', 'English Language & Literature', 'St. Paul', true),
  ('teach-renato', (select id from public.schools where legacy_id = 'CDSTA'), (select id from public.users where legacy_id = 'user-cdsta-teacher'), 'Renato', 'Villanueva', 'De Vera', 'College', 'teacher@cdsta.edu.ph', '+639205551001', 'Programming & Software Engineering', 'BSIT-1A', true),
  ('teach-lorena', (select id from public.schools where legacy_id = 'CDSTA'), NULL, 'Lorena', 'Castaneda', 'Sabado', 'College', 'lorena.castaneda@cdsta.edu.ph', '+639205551002', 'Accounting & Finance', 'BSA-2A', true),
  ('teach-jerome', (select id from public.schools where legacy_id = 'CDSTA'), NULL, 'Jerome', 'Navarro', 'Cayco', 'College', 'jerome.navarro@cdsta.edu.ph', '+639205551003', 'Business Administration & Management', 'BSBA-1A', true),
  ('teach-fe', (select id from public.schools where legacy_id = 'CDSTA'), NULL, 'Fe', 'Domingo', 'Lacson', 'College', 'fe.domingo@cdsta.edu.ph', '+639205551004', 'Hospitality Management', 'BSHM-1A', true)
on conflict do nothing;

-- ============================================================================
-- STUDENTS
-- ============================================================================
insert into public.students (legacy_id, school_id, user_id, student_no, first_name, last_name, middle_name, gender, civil_status, religion, nationality, birthday, birthplace, email, contact_no, address, province, municipality, zip_code, department, year_level, track_or_course, section, enrollment_status) values
  ('stud-nursery-01', NULL, NULL, 'STSN-2026-0101', 'Sofia', 'Reyes', 'Cruz', 'Female', 'Single', 'Catholic', 'Filipino', '2022-03-10', 'Quezon City', 'sofia.reyes@stsn.edu.ph', '+639170000001', '#15 Sampaguita St., Novaliches', 'Metro Manila', 'Quezon City', '1123', 'Basic Education', 'Nursery', 'Preschool', 'Little Angels', 'Enrolled'),
  ('stud-kinder1-01', NULL, NULL, 'STSN-2026-0102', 'Liam', 'Bautista', 'Torres', 'Male', 'Single', 'Catholic', 'Filipino', '2021-06-15', 'Novaliches', 'liam.bautista@stsn.edu.ph', '+639170000002', '#3 Maligaya Ave, Novaliches', 'Metro Manila', 'Quezon City', '1123', 'Basic Education', 'Kinder 1', 'Preschool', 'Sunshine', 'Enrolled'),
  ('stud-kinder2-01', NULL, NULL, 'STSN-2026-0103', 'Isabella', 'Santos', 'Garcia', 'Female', 'Single', 'Catholic', 'Filipino', '2020-09-22', 'Caloocan', 'isabella.santos@stsn.edu.ph', '+639170000003', '#7 Sampaguita St., Novaliches', 'Metro Manila', 'Quezon City', '1123', 'Basic Education', 'Kinder 2', 'Preschool', 'Rainbow', 'Enrolled'),
  ('stud-g1-01', NULL, NULL, 'STSN-2026-0111', 'Marco', 'Fernandez', 'Dela Cruz', 'Male', 'Single', 'Catholic', 'Filipino', '2019-04-05', 'Quezon City', 'marco.fernandez@stsn.edu.ph', '+639170000011', '#22 Rizal Ave, Novaliches', 'Metro Manila', 'Quezon City', '1123', 'Basic Education', 'Grade 1', 'Elementary', 'St. Joseph', 'Enrolled'),
  ('stud-g2-01', NULL, NULL, 'STSN-2026-0112', 'Camille', 'Villanueva', 'Tan', 'Female', 'Single', 'Catholic', 'Filipino', '2018-07-18', 'Marikina', 'camille.villanueva@stsn.edu.ph', '+639170000012', '#10 Dagohoy St., Novaliches', 'Metro Manila', 'Quezon City', '1123', 'Basic Education', 'Grade 2', 'Elementary', 'St. Francis', 'Enrolled'),
  ('stud-g3-01', NULL, NULL, 'STSN-2026-0113', 'Rafael', 'Mendoza', 'Flores', 'Male', 'Single', 'Catholic', 'Filipino', '2017-11-30', 'Bulacan', 'rafael.mendoza@stsn.edu.ph', '+639170000013', '#5 Mabini St., Novaliches', 'Metro Manila', 'Quezon City', '1123', 'Basic Education', 'Grade 3', 'Elementary', 'St. Anthony', 'Enrolled'),
  ('stud-g4-01', NULL, NULL, 'STSN-2026-0121', 'Andrea', 'Castillo', 'Ocampo', 'Female', 'Single', 'Catholic', 'Filipino', '2016-02-14', 'Quezon City', 'andrea.castillo@stsn.edu.ph', '+639170000021', '#18 Makabayan St., Novaliches', 'Metro Manila', 'Quezon City', '1123', 'Basic Education', 'Grade 4', 'Elementary', 'St. Michael', 'Enrolled'),
  ('stud-g5-01', NULL, NULL, 'STSN-2026-0122', 'Paolo', 'Aguilar', 'Santos', 'Male', 'Single', 'Catholic', 'Filipino', '2015-08-25', 'Novaliches', 'paolo.aguilar@stsn.edu.ph', '+639170000022', '#30 Lapu-Lapu St., Novaliches', 'Metro Manila', 'Quezon City', '1123', 'Basic Education', 'Grade 5', 'Elementary', 'St. Gabriel', 'Enrolled'),
  ('stud-g6-01', NULL, NULL, 'STSN-2026-0123', 'Bianca', 'Torres', 'Reyes', 'Female', 'Single', 'Catholic', 'Filipino', '2014-05-10', 'Bulacan', 'bianca.torres@stsn.edu.ph', '+639170000023', '#8 Del Pilar St., Novaliches', 'Metro Manila', 'Quezon City', '1123', 'Basic Education', 'Grade 6', 'Elementary', 'St. Raphael', 'Enrolled'),
  ('stud-g7-01', NULL, NULL, 'STSN-2026-0131', 'Nathan', 'Gomez', 'Dela Peña', 'Male', 'Single', 'Catholic', 'Filipino', '2013-01-20', 'Quezon City', 'nathan.gomez@stsn.edu.ph', '+639170000031', '#14 Bonifacio St., Novaliches', 'Metro Manila', 'Quezon City', '1123', 'Basic Education', 'Grade 7', 'Junior High', 'St. Theresa', 'Enrolled'),
  ('stud-g8-01', NULL, NULL, 'STSN-2026-0132', 'Patricia', 'Lopez', 'Valdez', 'Female', 'Single', 'Catholic', 'Filipino', '2012-06-08', 'Manila', 'patricia.lopez@stsn.edu.ph', '+639170000032', '#2 Aguinaldo St., Novaliches', 'Metro Manila', 'Quezon City', '1123', 'Basic Education', 'Grade 8', 'Junior High', 'St. Paul', 'Enrolled'),
  ('stud-g9-01', NULL, NULL, 'STSN-2026-0133', 'Jerome', 'Santos', 'Cruz', 'Male', 'Single', 'Catholic', 'Filipino', '2011-09-15', 'Caloocan', 'jerome.santos@stsn.edu.ph', '+639170000033', '#25 Luna St., Novaliches', 'Metro Manila', 'Quezon City', '1123', 'Basic Education', 'Grade 9', 'Junior High', 'St. Mark', 'Enrolled'),
  ('stud-g10-01', NULL, NULL, 'STSN-2026-0134', 'Daniela', 'Ramos', 'Santiago', 'Female', 'Single', 'Catholic', 'Filipino', '2010-12-03', 'Novaliches', 'daniela.ramos@stsn.edu.ph', '+639170000034', '#9 Kalayaan Ave, Novaliches', 'Metro Manila', 'Quezon City', '1123', 'Basic Education', 'Grade 10', 'Junior High', 'St. Luke', 'Enrolled'),
  ('stud-enrico', NULL, (select id from public.users where legacy_id = 'user-student'), 'STSN-2026-0001', 'Enrico', 'Veloso', 'Santos', 'Male', 'Single', 'Catholic', 'Filipino', '1990-02-02', 'Manila', 'student@stsn.edu.ph', '+639170191575', '#7 Kingfisher St. Zabarte Subdivision, Novaliches', 'Metro Manila', 'Quezon City', '1123', 'Basic Education', 'Grade 11', 'STEM', 'St. Thomas', 'Enrolled'),
  ('stud-katherine', NULL, NULL, 'STSN-2026-0004', 'Katherine', 'Alvarez', 'Gomez', 'Female', 'Single', 'Christian', 'Filipino', '2010-01-15', 'Quezon City', 'katherine.alvarez@gmail.com', '+639227654321', '123 Katipunan Avenue', 'Metro Manila', 'Quezon City', '1108', 'Basic Education', 'Grade 12', 'ABM', 'St. Catherine', 'Pending'),
  ('stud-miguel', NULL, NULL, 'STSN-2026-0005', 'Miguel', 'Santos', 'Castillo', 'Male', 'Single', 'Catholic', 'Filipino', '2007-06-18', 'Pasig City', 'miguel.santos@gmail.com', '+639198765432', '55 Oranbo Drive', 'Metro Manila', 'Pasig', '1600', 'Basic Education', 'Grade 11', 'HUMSS', 'St. Albert', 'Approved'),
  ('stud-g11-stem', NULL, NULL, 'STSN-2026-0119', 'Gabrielle', 'Torres', 'Lim', 'Female', 'Single', 'Catholic', 'Filipino', '2009-04-18', 'Quezon City', 'gabrielle.torres@stsn.edu.ph', '+639170000042', '#11 Maginhawa St., Novaliches', 'Metro Manila', 'Quezon City', '1123', 'Basic Education', 'Grade 11', 'STEM', 'St. Thomas', 'Enrolled'),
  ('stud-g12-02', NULL, NULL, 'STSN-2026-0141', 'Sophia', 'Mercado', 'Chan', 'Female', 'Single', 'Catholic', 'Filipino', '2008-03-27', 'Quezon City', 'sophia.mercado@stsn.edu.ph', '+639170000041', '#33 Heroes St., Novaliches', 'Metro Manila', 'Quezon City', '1123', 'Basic Education', 'Grade 12', 'STEM', 'St. Teresa', 'Enrolled'),
  ('stud-clara', NULL, NULL, 'CDSTA-2026-0002', 'Maria Clara', 'Dela Cruz', 'Ilustre', 'Female', 'Single', 'Catholic', 'Filipino', '2005-05-12', 'Calamba, Laguna', 'clara.delacruz@stsn.edu.ph', '+639182345678', 'Unit 4C High Street Condominium', 'Laguna', 'Calamba', '4027', 'College', '1st Year', 'BSIT', 'IT101', 'Enrolled'),
  ('stud-juan', NULL, NULL, 'CDSTA-2026-0003', 'Juan', 'Luna', 'Novicio', 'Male', 'Single', 'Aglipayan', 'Filipino', '2004-10-23', 'Badoc, Ilocos Norte', 'juan.luna@stsn.edu.ph', '+639151234567', '15 Kalayaan Ave', 'Ilocos Norte', 'Badoc', '2904', 'College', '2nd Year', 'BSBA', 'BA201', 'Enrolled'),
  ('stud-leandro', NULL, NULL, 'CDSTA-2026-0006', 'Leandro', 'Santiago', 'Mendoza', 'Male', 'Single', 'Catholic', 'Filipino', '2005-11-30', 'San Fernando, Pampanga', 'leandro.santiago@stsn.edu.ph', '+639351239876', 'Villa de Pampanga', 'Pampanga', 'San Fernando', '2000', 'College', '1st Year', 'BSCS', 'CS101', 'Pending'),
  ('stud-college-04', NULL, NULL, 'CDSTA-2026-0007', 'Angela', 'Reyes', 'Bautista', 'Female', 'Single', 'Catholic', 'Filipino', '2005-07-12', 'Cebu City', 'angela.reyes@cdsta.edu.ph', '+639221234567', '45 Gen. Luna St., Cebu City', 'Cebu', 'Cebu City', '6000', 'College', '2nd Year', 'BSA', 'AC201', 'Enrolled'),
  ('stud-college-05', NULL, NULL, 'CDSTA-2026-0008', 'Christian', 'Lim', 'Go', 'Male', 'Single', 'Catholic', 'Filipino', '2004-02-28', 'Binondo, Manila', 'christian.lim@cdsta.edu.ph', '+639281239876', '88 Ongpin St., Binondo, Manila', 'Metro Manila', 'Manila', '1006', 'College', '3rd Year', 'BSIT', 'IT301', 'Enrolled'),
  ('stud-college-06', NULL, NULL, 'CDSTA-2026-0009', 'Maricel', 'Buenaventura', 'Diaz', 'Female', 'Single', 'Catholic', 'Filipino', '2006-05-19', 'Davao City', 'maricel.buenaventura@cdsta.edu.ph', '+639391234123', '22 JP Laurel Ave, Davao City', 'Davao del Sur', 'Davao City', '8000', 'College', '1st Year', 'BSHM', 'HM101', 'Enrolled'),
  ('stud-college-07', NULL, NULL, 'CDSTA-2026-0010', 'Rodolfo', 'Macaraeg', 'Pascual', 'Male', 'Single', 'Catholic', 'Filipino', '2003-11-07', 'Taguig City', 'rodolfo.macaraeg@cdsta.edu.ph', '+639174561234', '100 Rizal St., Taguig City', 'Metro Manila', 'Taguig', '1630', 'College', '4th Year', 'BSED', 'ED401', 'Enrolled'),
  ('stud-bsit-1', NULL, NULL, 'CDSTA-2026-0301', 'Andrei', 'Santos', 'Bautista', 'Male', 'Single', 'Catholic', 'Filipino', '2005-09-09', 'Quezon City', 'andrei.santos@cdsta.edu.ph', '+639281239999', '12 Bonifacio St., Quezon City', 'Metro Manila', 'Quezon City', '1100', 'College', '1st Year', 'BSIT', 'IT101', 'Enrolled')
on conflict do nothing;
insert into public.students (legacy_id, student_no, first_name, last_name, department, year_level, track_or_course, section, enrollment_status) values
  ('demo-st-02', 'STSN-2026-0142', 'Ana', 'Bautista', 'Basic Education', 'Grade 11', 'STEM', 'St. Thomas', 'Enrolled'),
  ('demo-st-03', 'STSN-2026-0143', 'Carlo', 'Reyes', 'Basic Education', 'Grade 11', 'STEM', 'St. Thomas', 'Enrolled'),
  ('demo-st-04', 'STSN-2026-0144', 'Diana', 'Santos', 'Basic Education', 'Grade 11', 'STEM', 'St. Thomas', 'Enrolled'),
  ('demo-st-05', 'STSN-2026-0145', 'Eduardo', 'Torres', 'Basic Education', 'Grade 11', 'STEM', 'St. Thomas', 'Enrolled'),
  ('demo-it-02', 'CDSTA-2026-0021', 'Francis', 'Lim', 'College', '1st Year', 'BSIT', 'IT101', 'Enrolled'),
  ('demo-it-03', 'CDSTA-2026-0022', 'Grace', 'Cruz', 'College', '1st Year', 'BSIT', 'IT101', 'Enrolled'),
  ('demo-it-04', 'CDSTA-2026-0023', 'Harold', 'Tan', 'College', '1st Year', 'BSIT', 'IT101', 'Enrolled')
on conflict do nothing;

-- ============================================================================
-- EMPLOYEES
-- ============================================================================
insert into public.employees (legacy_id, school_id, first_name, last_name, middle_name, email, position, position_title, department, salary, status, leave_balance, contact, address, emergency_contact) values
  ('emp-registrar', (select id from public.schools where legacy_id = 'STSN'), 'Cynthia', 'Ramos', 'Bautista', 'registrar@stsn.edu.ph', 'Senior Registrar', 'Senior Registrar', 'Registrar', 42000, 'Full-Time', 15, '+639171000101', '#5 Rosario St., Novaliches, QC', 'Lino Ramos +639171000200'),
  ('emp-accounting', (select id from public.schools where legacy_id = 'STSN'), 'Eduardo', 'Bonto', 'Marasigan', 'accounting@stsn.edu.ph', 'Chief Accountant', 'Chief Accountant / CPA', 'Accounting', 58000, 'Full-Time', 18, '+639171000102', '#12 Avocado St., Fairview, QC', 'Lily Bonto +639171000201'),
  ('emp-hr', (select id from public.schools where legacy_id = 'STSN'), 'Gemma', 'Santos', 'Macaraig', 'hr@stsn.edu.ph', 'HR Manager', 'Human Resources Manager', 'HR', 45000, 'Full-Time', 14, '+639171000103', '#8 Sampaguita Ave., Novaliches, QC', 'Ramon Santos +639171000202'),
  ('emp-assistant', (select id from public.schools where legacy_id = 'STSN'), 'Ronaldo', 'Mercado', 'Guevara', 'ronald.mercado@stsn.edu.ph', 'Administrative Assistant', 'Administrative Assistant I', 'Administration', 22000, 'Full-Time', 12, '+639171000104', '#3 Maligaya Rd., Novaliches, QC', 'Luz Mercado +639171000203'),
  ('emp-stsn-05', (select id from public.schools where legacy_id = 'STSN'), 'Mariflor', 'Belen', 'Dela Torre', 'mariflor.belen@stsn.edu.ph', 'Guidance Counselor', 'Guidance Counselor', 'Administration', 32000, 'Full-Time', 15, '+639171000105', '#21 Kaibigan St., Novaliches, QC', 'Carlos Belen +639171000204'),
  ('emp-stsn-06', (select id from public.schools where legacy_id = 'STSN'), 'Roberto', 'Espino', 'Tanedo', 'roberto.espino@stsn.edu.ph', 'Librarian', 'Head Librarian', 'Administration', 28000, 'Full-Time', 15, '+639171000106', '#7 Limasawa St., Novaliches, QC', 'Fe Espino +639171000205'),
  ('emp-stsn-07', (select id from public.schools where legacy_id = 'STSN'), 'Natividad', 'Pareja', 'Cabrera', 'natividad.pareja@stsn.edu.ph', 'School Nurse', 'Registered Nurse', 'Administration', 27000, 'Full-Time', 15, '+639171000107', '#15 Bahaghari St., Novaliches, QC', 'Pedro Pareja +639171000206'),
  ('emp-stsn-08', (select id from public.schools where legacy_id = 'STSN'), 'Danilo', 'Cruz', 'Poblete', 'danilo.cruz@stsn.edu.ph', 'Instructor', 'Instructor I — Math Dept.', 'Basic Education', 30000, 'Full-Time', 15, '+639171000108', '#4 Kalayaan Blvd., Novaliches, QC', 'Elena Cruz +639171000207'),
  ('emp-stsn-09', (select id from public.schools where legacy_id = 'STSN'), 'Leonora', 'Viray', 'Sison', 'leonora.viray@stsn.edu.ph', 'Instructor', 'Instructor II — English Dept.', 'Basic Education', 31000, 'Part-Time', 7, '+639171000109', '#6 Maharlika St., Novaliches, QC', 'Domingo Viray +639171000208'),
  ('emp-stsn-10', (select id from public.schools where legacy_id = 'STSN'), 'Cesar', 'Bonifacio', 'Salanga', 'cesar.bonifacio@stsn.edu.ph', 'Instructor', 'Instructor I — Science Dept.', 'Basic Education', 30000, 'Contractual', 5, '+639171000110', '#19 Katipunan St., Novaliches, QC', 'Nenita Bonifacio +639171000209'),
  ('emp-cdsta-01', (select id from public.schools where legacy_id = 'CDSTA'), 'Maria Luz', 'Aquino', 'Bañez', 'registrar@cdsta.edu.ph', 'Senior Registrar', 'Senior Registrar', 'Registrar', 44000, 'Full-Time', 15, '+639205552001', '#10 Sto. Tomas St., Novaliches, QC', 'Jose Aquino +639205552100'),
  ('emp-cdsta-02', (select id from public.schools where legacy_id = 'CDSTA'), 'Jose', 'Macaraig', 'Reyes', 'accounting@cdsta.edu.ph', 'Chief Accountant', 'Chief Accountant / CPA', 'Accounting', 60000, 'Full-Time', 18, '+639205552002', '#22 Sta. Cruz St., Novaliches, QC', 'Alma Macaraig +639205552101'),
  ('emp-cdsta-03', (select id from public.schools where legacy_id = 'CDSTA'), 'Teresa', 'Navarro', 'Ramos', 'hr@cdsta.edu.ph', 'HR Manager', 'Human Resources Manager', 'HR', 46000, 'Full-Time', 14, '+639205552003', '#5 Brgy. Pasong Putik, Novaliches, QC', 'Luis Navarro +639205552102'),
  ('emp-cdsta-04', (select id from public.schools where legacy_id = 'CDSTA'), 'Renato', 'Villanueva', 'De Vera', 'teacher@cdsta.edu.ph', 'Associate Professor', 'Associate Professor — IT', 'College', 52000, 'Full-Time', 15, '+639205552004', '#8 Commonwealth Ave., Ext.', 'Anita Villanueva +639205552103'),
  ('emp-cdsta-05', (select id from public.schools where legacy_id = 'CDSTA'), 'Lorena', 'Castaneda', 'Sabado', 'lorena.castaneda@cdsta.edu.ph', 'Instructor', 'Instructor II — Accounting', 'Accounting', 38000, 'Full-Time', 15, '+639205552005', '#17 BF Homes, Quezon City', 'Mario Castaneda +639205552104'),
  ('emp-cdsta-06', (select id from public.schools where legacy_id = 'CDSTA'), 'Jerome', 'Navarro', 'Cayco', 'jerome.navarro@cdsta.edu.ph', 'Instructor', 'Instructor III — Business', 'College', 36000, 'Full-Time', 15, '+639205552006', '#3 Congressional Ave., QC', 'Carla Navarro +639205552105'),
  ('emp-cdsta-07', (select id from public.schools where legacy_id = 'CDSTA'), 'Elisa', 'Medina', 'Flores', 'elisa.medina@cdsta.edu.ph', 'Administrative Assistant', 'Admin. Assistant II', 'Administration', 24000, 'Full-Time', 12, '+639205552007', '#9 Villa Carmel Subd., QC', 'Pedro Medina +639205552106'),
  ('emp-cdsta-08', (select id from public.schools where legacy_id = 'CDSTA'), 'Armando', 'Lajom', 'Santos', 'armando.lajom@cdsta.edu.ph', 'Campus Security Head', 'Security Head / Senior Guard', 'Administration', 20000, 'Full-Time', 10, '+639205552008', '#45 Muñoz, Novaliches, QC', 'Rosa Lajom +639205552107')
on conflict do nothing;

-- ============================================================================
-- CURRICULUMS
-- ============================================================================
insert into public.curriculums (legacy_id, course_code_or_strand, name) values
  ('curr-stem', 'STEM', 'Enhanced K-12 STEM Curriculum (2026 Edition)'),
  ('curr-humss', 'HUMSS', 'Enhanced K-12 HUMSS Curriculum (2026 Edition)'),
  ('curr-abm', 'ABM', 'Enhanced K-12 ABM Curriculum (2026 Edition)'),
  ('curr-bsit', 'BSIT', 'BS Information Technology Curriculum v3'),
  ('curr-bscs', 'BSCS', 'BS Computer Science Curriculum'),
  ('curr-bsba', 'BSBA', 'BS Business Administration Curriculum'),
  ('curr-bsa', 'BSA', 'BS Accountancy Curriculum'),
  ('curr-bshm', 'BSHM', 'BS Hospitality Management Curriculum'),
  ('curr-bsed', 'BSED', 'BS Education Curriculum')
on conflict do nothing;

-- ============================================================================
-- CURRICULUM_SUBJECTS
-- ============================================================================
insert into public.curriculum_subjects (curriculum_id, subject_id, year_level, semester) values
  ((select id from public.curriculums where legacy_id = 'curr-stem'), (select id from public.subjects where code = 'SHS-ORAL-COM'), 'Grade 11', 'First Semester'),
  ((select id from public.curriculums where legacy_id = 'curr-stem'), (select id from public.subjects where code = 'SHS-READ-WRITE'), 'Grade 11', 'First Semester'),
  ((select id from public.curriculums where legacy_id = 'curr-stem'), (select id from public.subjects where code = 'SHS-GEN-MATH'), 'Grade 11', 'First Semester'),
  ((select id from public.curriculums where legacy_id = 'curr-stem'), (select id from public.subjects where code = 'SHS-STAT-PROB'), 'Grade 11', 'First Semester'),
  ((select id from public.curriculums where legacy_id = 'curr-stem'), (select id from public.subjects where code = 'SHS-EARTH-LIFE'), 'Grade 11', 'First Semester'),
  ((select id from public.curriculums where legacy_id = 'curr-stem'), (select id from public.subjects where code = 'SHS-PHYS-SCI'), 'Grade 11', 'Second Semester'),
  ((select id from public.curriculums where legacy_id = 'curr-stem'), (select id from public.subjects where code = 'SHS-PER-DEV'), 'Grade 11', 'Second Semester'),

  ((select id from public.curriculums where legacy_id = 'curr-humss'), (select id from public.subjects where code = 'SHS-HUMSS-PCOM'), 'Grade 11', 'First Semester'),
  ((select id from public.curriculums where legacy_id = 'curr-humss'), (select id from public.subjects where code = 'SHS-HUMSS-CW'), 'Grade 11', 'First Semester'),
  ((select id from public.curriculums where legacy_id = 'curr-humss'), (select id from public.subjects where code = 'SHS-HUMSS-DISP'), 'Grade 11', 'First Semester'),

  ((select id from public.curriculums where legacy_id = 'curr-abm'), (select id from public.subjects where code = 'SHS-ABM-OBA'), 'Grade 11', 'First Semester'),
  ((select id from public.curriculums where legacy_id = 'curr-abm'), (select id from public.subjects where code = 'SHS-ABM-PRIN'), 'Grade 11', 'First Semester'),
  ((select id from public.curriculums where legacy_id = 'curr-abm'), (select id from public.subjects where code = 'SHS-ABM-BM'), 'Grade 12', 'First Semester'),
  ((select id from public.curriculums where legacy_id = 'curr-abm'), (select id from public.subjects where code = 'SHS-ABM-ECON'), 'Grade 12', 'First Semester'),

  ((select id from public.curriculums where legacy_id = 'curr-bsit'), (select id from public.subjects where code = 'IT101'), '1st Year', 'First Semester'),
  ((select id from public.curriculums where legacy_id = 'curr-bsit'), (select id from public.subjects where code = 'IT102'), '1st Year', 'First Semester'),
  ((select id from public.curriculums where legacy_id = 'curr-bsit'), (select id from public.subjects where code = 'MATH101'), '1st Year', 'First Semester'),
  ((select id from public.curriculums where legacy_id = 'curr-bsit'), (select id from public.subjects where code = 'NSTP1'), '1st Year', 'First Semester'),
  ((select id from public.curriculums where legacy_id = 'curr-bsit'), (select id from public.subjects where code = 'IT103'), '1st Year', 'Second Semester'),
  ((select id from public.curriculums where legacy_id = 'curr-bsit'), (select id from public.subjects where code = 'IT104'), '1st Year', 'Second Semester'),
  ((select id from public.curriculums where legacy_id = 'curr-bsit'), (select id from public.subjects where code = 'IT201'), '2nd Year', 'First Semester'),
  ((select id from public.curriculums where legacy_id = 'curr-bsit'), (select id from public.subjects where code = 'IT202'), '2nd Year', 'First Semester'),
  ((select id from public.curriculums where legacy_id = 'curr-bsit'), (select id from public.subjects where code = 'IT301'), '3rd Year', 'First Semester'),
  ((select id from public.curriculums where legacy_id = 'curr-bsit'), (select id from public.subjects where code = 'IT302'), '3rd Year', 'First Semester'),

  ((select id from public.curriculums where legacy_id = 'curr-bscs'), (select id from public.subjects where code = 'CS101'), '1st Year', 'First Semester'),
  ((select id from public.curriculums where legacy_id = 'curr-bscs'), (select id from public.subjects where code = 'CS102'), '1st Year', 'First Semester'),
  ((select id from public.curriculums where legacy_id = 'curr-bscs'), (select id from public.subjects where code = 'CS103'), '1st Year', 'First Semester'),
  ((select id from public.curriculums where legacy_id = 'curr-bscs'), (select id from public.subjects where code = 'CS201'), '2nd Year', 'First Semester'),

  ((select id from public.curriculums where legacy_id = 'curr-bsba'), (select id from public.subjects where code = 'BA101'), '1st Year', 'First Semester'),
  ((select id from public.curriculums where legacy_id = 'curr-bsba'), (select id from public.subjects where code = 'BA102'), '1st Year', 'First Semester'),
  ((select id from public.curriculums where legacy_id = 'curr-bsba'), (select id from public.subjects where code = 'MATH102'), '1st Year', 'First Semester'),
  ((select id from public.curriculums where legacy_id = 'curr-bsba'), (select id from public.subjects where code = 'BA201'), '2nd Year', 'First Semester'),
  ((select id from public.curriculums where legacy_id = 'curr-bsba'), (select id from public.subjects where code = 'BA202'), '2nd Year', 'First Semester'),

  ((select id from public.curriculums where legacy_id = 'curr-bsa'), (select id from public.subjects where code = 'ACCT101'), '1st Year', 'First Semester'),
  ((select id from public.curriculums where legacy_id = 'curr-bsa'), (select id from public.subjects where code = 'ACCT102'), '1st Year', 'Second Semester'),
  ((select id from public.curriculums where legacy_id = 'curr-bsa'), (select id from public.subjects where code = 'ACCT201'), '2nd Year', 'First Semester'),

  ((select id from public.curriculums where legacy_id = 'curr-bshm'), (select id from public.subjects where code = 'HM101'), '1st Year', 'First Semester'),
  ((select id from public.curriculums where legacy_id = 'curr-bshm'), (select id from public.subjects where code = 'HM102'), '1st Year', 'First Semester'),
  ((select id from public.curriculums where legacy_id = 'curr-bshm'), (select id from public.subjects where code = 'HM103'), '1st Year', 'Second Semester'),

  ((select id from public.curriculums where legacy_id = 'curr-bsed'), (select id from public.subjects where code = 'ED101'), '1st Year', 'First Semester'),
  ((select id from public.curriculums where legacy_id = 'curr-bsed'), (select id from public.subjects where code = 'ED102'), '1st Year', 'First Semester'),
  ((select id from public.curriculums where legacy_id = 'curr-bsed'), (select id from public.subjects where code = 'ED401'), '4th Year', 'First Semester'),
  ((select id from public.curriculums where legacy_id = 'curr-bsed'), (select id from public.subjects where code = 'ED402'), '4th Year', 'First Semester')
on conflict do nothing;

-- ============================================================================
-- SECTIONS
-- ============================================================================
insert into public.sections (legacy_id, school_id, code, name, department, year_level, strand_or_track, adviser_id, capacity, current_count, academic_year, semester, is_active) values
  ('sec-g7-avila', (select id from public.schools where legacy_id = 'STSN'), 'G7-AVILA', 'St. Avila', 'Basic Education', 'Grade 7', 'Junior High', (select id from public.teachers where legacy_id = 'teach-beatriz'), 40, 35, '2026-2027', NULL, true),
  ('sec-g8-thomas', (select id from public.schools where legacy_id = 'STSN'), 'G8-THOMAS', 'St. Thomas', 'Basic Education', 'Grade 8', 'Junior High', (select id from public.teachers where legacy_id = 'teach-arthur'), 40, 38, '2026-2027', NULL, true),
  ('sec-g9-cath', (select id from public.schools where legacy_id = 'STSN'), 'G9-CATH', 'St. Catherine', 'Basic Education', 'Grade 9', 'Junior High', (select id from public.teachers where legacy_id = 'teach-beatriz'), 40, 30, '2026-2027', NULL, true),
  ('sec-g10-albert', (select id from public.schools where legacy_id = 'STSN'), 'G10-ALBERT', 'St. Albert', 'Basic Education', 'Grade 10', 'Junior High', (select id from public.teachers where legacy_id = 'teach-arthur'), 40, 32, '2026-2027', NULL, true),
  ('sec-g11-stem-a', (select id from public.schools where legacy_id = 'STSN'), 'G11-STEM-A', 'STEM 11-A', 'Basic Education', 'Grade 11', 'STEM', (select id from public.teachers where legacy_id = 'teach-arthur'), 45, 42, '2026-2027', NULL, true),
  ('sec-g11-humss-a', (select id from public.schools where legacy_id = 'STSN'), 'G11-HUMSS-A', 'HUMSS 11-A', 'Basic Education', 'Grade 11', 'HUMSS', (select id from public.teachers where legacy_id = 'teach-beatriz'), 45, 40, '2026-2027', NULL, true),
  ('sec-g12-abm-a', (select id from public.schools where legacy_id = 'STSN'), 'G12-ABM-A', 'ABM 12-A', 'Basic Education', 'Grade 12', 'ABM', (select id from public.teachers where legacy_id = 'teach-beatriz'), 45, 38, '2026-2027', NULL, true),
  ('sec-g12-stem-a', (select id from public.schools where legacy_id = 'STSN'), 'G12-STEM-A', 'STEM 12-A', 'Basic Education', 'Grade 12', 'STEM', (select id from public.teachers where legacy_id = 'teach-arthur'), 45, 44, '2026-2027', NULL, true),
  ('sec-bsit-1a', (select id from public.schools where legacy_id = 'CDSTA'), 'BSIT-1A', 'BSIT 1-A', 'College', '1st Year', 'BSIT', (select id from public.teachers where legacy_id = 'teach-renato'), 35, 33, '2026-2027', 'First Semester', true),
  ('sec-bsit-2a', (select id from public.schools where legacy_id = 'CDSTA'), 'BSIT-2A', 'BSIT 2-A', 'College', '2nd Year', 'BSIT', (select id from public.teachers where legacy_id = 'teach-renato'), 35, 28, '2026-2027', 'First Semester', true),
  ('sec-bsba-1a', (select id from public.schools where legacy_id = 'CDSTA'), 'BSBA-1A', 'BSBA 1-A', 'College', '1st Year', 'BSBA', (select id from public.teachers where legacy_id = 'teach-lorena'), 35, 30, '2026-2027', 'First Semester', true),
  ('sec-bsed-1a', (select id from public.schools where legacy_id = 'CDSTA'), 'BSED-1A', 'BSED 1-A', 'College', '1st Year', 'BSED', (select id from public.teachers where legacy_id = 'teach-jerome'), 35, 25, '2026-2027', 'First Semester', true)
on conflict do nothing;

-- ============================================================================
-- SECTION_STUDENTS
-- ============================================================================

-- ============================================================================
-- ROOMS
-- ============================================================================
insert into public.rooms (legacy_id, school_id, code, name, building, floor, capacity, type, is_active, status) values
  ('room-101', (select id from public.schools where legacy_id = 'STSN'), 'R101', 'Room 101', 'Main Building', '1st Floor', 45, 'Classroom', true, 'Available'),
  ('room-102', (select id from public.schools where legacy_id = 'STSN'), 'R102', 'Room 102', 'Main Building', '1st Floor', 45, 'Classroom', true, 'Available'),
  ('room-201', (select id from public.schools where legacy_id = 'STSN'), 'R201', 'Room 201', 'Main Building', '2nd Floor', 45, 'Classroom', true, 'Available'),
  ('room-202', (select id from public.schools where legacy_id = 'STSN'), 'R202', 'Room 202', 'Main Building', '2nd Floor', 45, 'Classroom', true, 'Available'),
  ('room-lab1', (select id from public.schools where legacy_id = 'STSN'), 'LAB1', 'Science Lab 1', 'Science Wing', '1st Floor', 30, 'Laboratory', true, 'Available'),
  ('room-itlab1', (select id from public.schools where legacy_id = 'STSN'), 'ITLAB1', 'IT Lab 1', 'Technology Wing', '1st Floor', 35, 'Laboratory', true, 'Available'),
  ('room-gym', (select id from public.schools where legacy_id = 'STSN'), 'GYM', 'Gymnasium', 'Sports Complex', 'Ground Floor', 200, 'Gymnasium', true, 'Available'),
  ('room-aud', (select id from public.schools where legacy_id = 'STSN'), 'AUD', 'Auditorium', 'Main Building', 'Ground Floor', 300, 'Auditorium', true, 'Available'),
  ('room-cdsta-101', (select id from public.schools where legacy_id = 'CDSTA'), 'C-R101', 'College Room 101', 'College Building', '1st Floor', 40, 'Classroom', true, 'Available'),
  ('room-cdsta-102', (select id from public.schools where legacy_id = 'CDSTA'), 'C-R102', 'College Room 102', 'College Building', '1st Floor', 40, 'Classroom', true, 'Available'),
  ('room-cdsta-itlab', (select id from public.schools where legacy_id = 'CDSTA'), 'C-ITLAB', 'College IT Lab', 'IT Building', '2nd Floor', 35, 'Laboratory', true, 'Available'),
  ('room-cdsta-301', (select id from public.schools where legacy_id = 'CDSTA'), 'C-R301', 'College Room 301', 'College Building', '3rd Floor', 40, 'Classroom', true, 'Under Maintenance')
on conflict do nothing;

-- ============================================================================
-- CLASS_SCHEDULES
-- ============================================================================
insert into public.class_schedules (legacy_id, subject_id, teacher_id, section, room_name, day, start_time, end_time, school_year, semester, is_active, department, year_level, course_or_track, notes) values
  ('csched-1', (select id from public.subjects where legacy_id = 'IT-101'), (select id from public.teachers where legacy_id = 'teach-arthur'), 'BSIT-1A', 'IT Lab 1', 'Monday', '08:00', '10:00', '2026-2027', 'First Semester', true, 'College', '1st Year', 'BSIT', NULL),
  ('csched-2', (select id from public.subjects where legacy_id = 'IT-101'), (select id from public.teachers where legacy_id = 'teach-arthur'), 'BSIT-1A', 'IT Lab 1', 'Wednesday', '08:00', '10:00', '2026-2027', 'First Semester', true, 'College', '1st Year', 'BSIT', NULL),
  ('csched-3', (select id from public.subjects where legacy_id = 'CS-201'), (select id from public.teachers where legacy_id = 'teach-arthur'), 'BSCS-2A', 'IT Lab 2', 'Tuesday', '10:00', '12:00', '2026-2027', 'First Semester', true, 'College', '2nd Year', 'BSCS', NULL),
  ('csched-4', (select id from public.subjects where legacy_id = 'MATH-11'), (select id from public.teachers where legacy_id = 'teach-mariz'), 'SHS-STEM-11A', 'Room 201', 'Monday', '07:00', '09:00', '2026-2027', 'First Semester', true, 'Basic Education', 'Grade 11', 'STEM', NULL),
  ('csched-5', (select id from public.subjects where legacy_id = 'MATH-11'), (select id from public.teachers where legacy_id = 'teach-mariz'), 'SHS-STEM-11A', 'Room 201', 'Wednesday', '07:00', '09:00', '2026-2027', 'First Semester', true, 'Basic Education', 'Grade 11', 'STEM', NULL),
  ('csched-6', (select id from public.subjects where legacy_id = 'STEM-12A'), (select id from public.teachers where legacy_id = 'teach-mariz'), 'SHS-STEM-12A', 'Room 202', 'Friday', '13:00', '16:00', '2026-2027', 'First Semester', true, 'Basic Education', 'Grade 12', 'STEM', NULL),
  ('csched-7', (select id from public.subjects where legacy_id = 'ENG-101'), (select id from public.teachers where legacy_id = 'teach-aurora'), 'BSBA-1A', 'Room 101', 'Tuesday', '13:00', '15:00', '2026-2027', 'First Semester', true, 'College', '1st Year', 'BSBA', NULL),
  ('csched-8', (select id from public.subjects where legacy_id = 'ENG-101'), (select id from public.teachers where legacy_id = 'teach-aurora'), 'BSBA-1A', 'Room 101', 'Thursday', '13:00', '15:00', '2026-2027', 'First Semester', true, 'College', '1st Year', 'BSBA', NULL)
on conflict do nothing;

-- ============================================================================
-- SCHEDULES
-- ============================================================================
insert into public.schedules (legacy_id, subject_code, subject_name, teacher_name, section, day, time, room) values
  ('sch-1', 'SHS-ORAL-COM', 'Oral Communication', 'Mrs. Beatriz Cruz', 'St. Thomas', 'Mon/Wed', '08:00 AM - 09:30 AM', 'SHS-Room 201'),
  ('sch-2', 'SHS-READ-WRITE', 'Reading and Writing', 'Mrs. Beatriz Cruz', 'St. Thomas', 'Mon/Wed', '09:45 AM - 11:15 AM', 'SHS-Room 201'),
  ('sch-3', 'SHS-GEN-MATH', 'General Mathematics', 'Mr. Arthur Reyes', 'St. Thomas', 'Tue/Thu', '08:30 AM - 10:00 AM', 'Math Lab B'),
  ('sch-4', 'SHS-STAT-PROB', 'Statistics and Probability', 'Mrs. Beatriz Cruz', 'St. Thomas', 'Tue/Thu', '10:15 AM - 11:45 AM', 'SHS-Room 201'),
  ('sch-5', 'SHS-EARTH-LIFE', 'Earth and Life Science', 'Dr. Ronald San Juan', 'St. Thomas', 'Friday', '08:00 AM - 11:00 AM', 'Science Lab 1'),
  ('sch-6', 'IT101', 'Introduction to Computing', 'Arthur Reyes', 'IT101', 'Mon/Wed/Fri', '01:00 PM - 02:00 PM', 'ComLab 3'),
  ('sch-7', 'IT102', 'Computer Programming 1', 'Arthur Reyes', 'IT101', 'Tue/Thu', '01:30 PM - 03:00 PM', 'ComLab 4')
on conflict do nothing;

-- ============================================================================
-- REQUIREMENTS
-- ============================================================================
insert into public.requirements (legacy_id, student_id, name, status, submitted_date, remarks, upload_status, upload_file_name, upload_date, verification_status, verified_by, verified_at, hardcopy_submitted, hardcopy_submitted_date) values
  ('req-1', (select id from public.students where legacy_id = 'stud-enrico'), 'PSA Birth Certificate', 'Submitted', '2026-05-10', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL),
  ('req-2', (select id from public.students where legacy_id = 'stud-enrico'), 'Good Moral Certificate', 'Submitted', '2026-05-11', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL),
  ('req-3', (select id from public.students where legacy_id = 'stud-enrico'), 'ID Picture (2x2)', 'Submitted', '2026-05-10', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL),
  ('req-4', (select id from public.students where legacy_id = 'stud-enrico'), 'Form 137 / SF9', 'Submitted', '2026-05-15', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL),
  ('req-9', (select id from public.students where legacy_id = 'stud-katherine'), 'PSA Birth Certificate', 'Submitted', '2026-05-20', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL),
  ('req-10', (select id from public.students where legacy_id = 'stud-katherine'), 'Good Moral Certificate', 'Pending', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL),
  ('req-11', (select id from public.students where legacy_id = 'stud-katherine'), 'ID Picture (2x2)', 'Submitted', '2026-05-20', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL),
  ('req-12', (select id from public.students where legacy_id = 'stud-katherine'), 'Form 137 / SF9', 'Pending', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL),
  ('req-5', (select id from public.students where legacy_id = 'stud-clara'), 'PSA Birth Certificate', 'Submitted', '2026-05-11', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL),
  ('req-6', (select id from public.students where legacy_id = 'stud-clara'), 'Good Moral Certificate', 'Submitted', '2026-05-11', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL),
  ('req-7', (select id from public.students where legacy_id = 'stud-clara'), 'Transcript of Records (TOR)', 'Submitted', '2026-05-12', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL),
  ('req-8', (select id from public.students where legacy_id = 'stud-clara'), 'ID Picture (2x2)', 'Submitted', '2026-05-11', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL),
  ('req-13', (select id from public.students where legacy_id = 'stud-leandro'), 'PSA Birth Certificate', 'Submitted', '2026-05-22', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL),
  ('req-14', (select id from public.students where legacy_id = 'stud-leandro'), 'Good Moral Certificate', 'Pending', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL),
  ('req-15', (select id from public.students where legacy_id = 'stud-leandro'), 'Transcript of Records (TOR)', 'Pending', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL),
  ('req-16', (select id from public.students where legacy_id = 'stud-leandro'), 'ID Picture (2x2)', 'Submitted', '2026-05-22', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL)
on conflict do nothing;

-- ============================================================================
-- BOOK_PACKAGES
-- ============================================================================
insert into public.book_packages (legacy_id, package_name, grade_level, school_id, academic_unit, school_year, total_amount, is_required, status, last_updated, updated_by) values
  ('bp-nursery', 'Nursery Book Package', 'Nursery', (select id from public.schools where legacy_id = 'STSN'), 'basic-ed', '2026-2027', 1280, true, 'Active', '2026-05-15', 'Cynthia Ramos, LPT'),
  ('bp-kinder1', 'Kinder 1 Book Package', 'Kinder 1', (select id from public.schools where legacy_id = 'STSN'), 'basic-ed', '2026-2027', 1410, true, 'Active', '2026-05-15', 'Cynthia Ramos, LPT'),
  ('bp-grade1', 'Grade 1 Book Package', 'Grade 1', (select id from public.schools where legacy_id = 'STSN'), 'basic-ed', '2026-2027', 2050, true, 'Active', '2026-05-15', 'Cynthia Ramos, LPT'),
  ('bp-grade4', 'Grade 4 Book Package', 'Grade 4', (select id from public.schools where legacy_id = 'STSN'), 'basic-ed', '2026-2027', 2910, true, 'Active', '2026-05-15', 'Cynthia Ramos, LPT'),
  ('bp-grade8', 'Grade 8 Book Package', 'Grade 8', (select id from public.schools where legacy_id = 'STSN'), 'basic-ed', '2026-2027', 3560, true, 'Active', '2026-05-20', 'Cynthia Ramos, LPT'),
  ('bp-grade10', 'Grade 10 Book Package', 'Grade 10', (select id from public.schools where legacy_id = 'STSN'), 'basic-ed', '2026-2027', 3770, true, 'Active', '2026-05-20', 'Cynthia Ramos, LPT'),
  ('bp-grade11', 'Grade 11 Book Package', 'Grade 11', (select id from public.schools where legacy_id = 'STSN'), 'basic-ed', '2026-2027', 3170, true, 'Active', '2026-05-22', 'Cynthia Ramos, LPT'),
  ('bp-grade12', 'Grade 12 Book Package', 'Grade 12', (select id from public.schools where legacy_id = 'STSN'), 'basic-ed', '2026-2027', 3190, true, 'Active', '2026-05-22', 'Cynthia Ramos, LPT')
on conflict do nothing;

-- ============================================================================
-- BOOK_PACKAGE_ITEMS
-- ============================================================================
insert into public.book_package_items (legacy_id, book_package_id, title, subject_id, quantity, unit_price) values
  ('bpi-nur-1', (select id from public.book_packages where legacy_id = 'bp-nursery'), 'My First Alphabet Book', NULL, 1, 350),
  ('bpi-nur-2', (select id from public.book_packages where legacy_id = 'bp-nursery'), 'Numbers and Shapes for Tots', NULL, 1, 350),
  ('bpi-nur-3', (select id from public.book_packages where legacy_id = 'bp-nursery'), 'Coloring and Tracing Workbook', NULL, 1, 300),
  ('bpi-nur-4', (select id from public.book_packages where legacy_id = 'bp-nursery'), 'Good Manners Storybook', NULL, 1, 280),
  ('bpi-k1-1', (select id from public.book_packages where legacy_id = 'bp-kinder1'), 'Letter Tracing and Phonics 1', NULL, 1, 380),
  ('bpi-k1-2', (select id from public.book_packages where legacy_id = 'bp-kinder1'), 'Counting Fun 1', NULL, 1, 380),
  ('bpi-k1-3', (select id from public.book_packages where legacy_id = 'bp-kinder1'), 'Filipino Bata Ko 1', NULL, 1, 350),
  ('bpi-k1-4', (select id from public.book_packages where legacy_id = 'bp-kinder1'), 'Values Education Storybook 1', NULL, 1, 300),
  ('bpi-g1-1', (select id from public.book_packages where legacy_id = 'bp-grade1'), 'English Reading Adventures 1', (select id from public.subjects where legacy_id = 'EL-ENG'), 1, 450),
  ('bpi-g1-2', (select id from public.book_packages where legacy_id = 'bp-grade1'), 'Mathematics for Young Learners 1', (select id from public.subjects where legacy_id = 'EL-MATH'), 1, 480),
  ('bpi-g1-3', (select id from public.book_packages where legacy_id = 'bp-grade1'), 'Filipino Tayo 1', (select id from public.subjects where legacy_id = 'EL-FIL'), 1, 420),
  ('bpi-g1-4', (select id from public.book_packages where legacy_id = 'bp-grade1'), 'Mother Tongue Based Workbook 1', (select id from public.subjects where legacy_id = 'EL-MTB'), 1, 380),
  ('bpi-g1-5', (select id from public.book_packages where legacy_id = 'bp-grade1'), 'Good Manners and Right Conduct 1', NULL, 1, 320),
  ('bpi-g4-1', (select id from public.book_packages where legacy_id = 'bp-grade4'), 'English Expressways 4', NULL, 1, 520),
  ('bpi-g4-2', (select id from public.book_packages where legacy_id = 'bp-grade4'), 'Mathematics in Action 4', NULL, 1, 540),
  ('bpi-g4-3', (select id from public.book_packages where legacy_id = 'bp-grade4'), 'Filipino sa Bagong Henerasyon 4', NULL, 1, 460),
  ('bpi-g4-4', (select id from public.book_packages where legacy_id = 'bp-grade4'), 'Araling Panlipunan 4', NULL, 1, 470),
  ('bpi-g4-5', (select id from public.book_packages where legacy_id = 'bp-grade4'), 'Science Explorers 4', NULL, 1, 530),
  ('bpi-g4-6', (select id from public.book_packages where legacy_id = 'bp-grade4'), 'MAPEH Integrated 4', NULL, 1, 390),
  ('bpi-g8-1', (select id from public.book_packages where legacy_id = 'bp-grade8'), 'English for Junior High 8', NULL, 1, 580),
  ('bpi-g8-2', (select id from public.book_packages where legacy_id = 'bp-grade8'), 'Mathematics 8: Patterns and Practicalities', NULL, 1, 620),
  ('bpi-g8-3', (select id from public.book_packages where legacy_id = 'bp-grade8'), 'Filipino: Pagbasa at Pagsulat 8', NULL, 1, 490),
  ('bpi-g8-4', (select id from public.book_packages where legacy_id = 'bp-grade8'), 'Araling Panlipunan: Ekonomiks 8', NULL, 1, 510),
  ('bpi-g8-5', (select id from public.book_packages where legacy_id = 'bp-grade8'), 'Science 8: Matter, Living Things & Energy', (select id from public.subjects where legacy_id = 'JHS-SCI10'), 1, 600),
  ('bpi-g8-6', (select id from public.book_packages where legacy_id = 'bp-grade8'), 'Edukasyon sa Pagpapakatao 8', NULL, 1, 360),
  ('bpi-g8-7', (select id from public.book_packages where legacy_id = 'bp-grade8'), 'MAPEH 8', NULL, 1, 400),
  ('bpi-g10-1', (select id from public.book_packages where legacy_id = 'bp-grade10'), 'English 10: World Literature', NULL, 1, 600),
  ('bpi-g10-2', (select id from public.book_packages where legacy_id = 'bp-grade10'), 'Mathematics 10', (select id from public.subjects where legacy_id = 'JHS-MATH10'), 1, 650),
  ('bpi-g10-3', (select id from public.book_packages where legacy_id = 'bp-grade10'), 'Filipino 10: Panitikang Asyano', NULL, 1, 500),
  ('bpi-g10-4', (select id from public.book_packages where legacy_id = 'bp-grade10'), 'Araling Panlipunan: Kontemporaryong Isyu 10', NULL, 1, 520),
  ('bpi-g10-5', (select id from public.book_packages where legacy_id = 'bp-grade10'), 'Physics 10', (select id from public.subjects where legacy_id = 'JHS-SCI10'), 1, 640),
  ('bpi-g10-6', (select id from public.book_packages where legacy_id = 'bp-grade10'), 'TLE 10: Career Pathways', NULL, 1, 450),
  ('bpi-g10-7', (select id from public.book_packages where legacy_id = 'bp-grade10'), 'MAPEH 10', NULL, 1, 410),
  ('bpi-g11-1', (select id from public.book_packages where legacy_id = 'bp-grade11'), 'Oral Communication in Context', NULL, 1, 550),
  ('bpi-g11-2', (select id from public.book_packages where legacy_id = 'bp-grade11'), 'General Mathematics', NULL, 1, 580),
  ('bpi-g11-3', (select id from public.book_packages where legacy_id = 'bp-grade11'), 'Earth and Life Science', NULL, 1, 600),
  ('bpi-g11-4', (select id from public.book_packages where legacy_id = 'bp-grade11'), '21st Century Literature from the Philippines and the World', NULL, 1, 540),
  ('bpi-g11-5', (select id from public.book_packages where legacy_id = 'bp-grade11'), 'Komunikasyon at Pananaliksik sa Wika at Kulturang Pilipino', NULL, 1, 520),
  ('bpi-g11-6', (select id from public.book_packages where legacy_id = 'bp-grade11'), 'Physical Education and Health 11', NULL, 1, 380),
  ('bpi-g12-1', (select id from public.book_packages where legacy_id = 'bp-grade12'), 'Reading and Writing Skills', NULL, 1, 550),
  ('bpi-g12-2', (select id from public.book_packages where legacy_id = 'bp-grade12'), 'Statistics and Probability', NULL, 1, 580),
  ('bpi-g12-3', (select id from public.book_packages where legacy_id = 'bp-grade12'), 'Physical Science', NULL, 1, 600),
  ('bpi-g12-4', (select id from public.book_packages where legacy_id = 'bp-grade12'), 'Contemporary Philippine Arts from the Regions', NULL, 1, 520),
  ('bpi-g12-5', (select id from public.book_packages where legacy_id = 'bp-grade12'), 'Practical Research 2', NULL, 1, 560),
  ('bpi-g12-6', (select id from public.book_packages where legacy_id = 'bp-grade12'), 'Physical Education and Health 12', NULL, 1, 380)
on conflict do nothing;

-- ============================================================================
-- ASSESSMENTS
-- ============================================================================
insert into public.assessments (legacy_id, school_id, student_id, school_year, semester, total_amount, discount_percentage, discount_amount, scholarship_name, payment_term, balance, is_paid, financial_hold_status, last_payment_date, books_availed, book_package_id, approval_status, submitted_by, submitted_date, registrar_remarks, accounting_remarks, approved_by, approved_date) values
  ('as-enrico', (select id from public.schools where legacy_id = 'STSN'), (select id from public.students where legacy_id = 'stud-enrico'), '2026-2027', 'First Semester', 27200, 10, 2720, 'Family Discount (10%)', 'Installment - 4 Payments', 14480, false, NULL, NULL, false, NULL, 'Pending Accounting Approval', 'Cynthia Ramos, LPT', '2026-06-10', 'Standard SHS STEM assessment with Family Discount (10%) and 4-installment plan. Ready for Accounting review.', NULL, NULL, NULL),
  ('as-clara', (select id from public.schools where legacy_id = 'CDSTA'), (select id from public.students where legacy_id = 'stud-clara'), '2026-2027', 'First Semester', 22100, 0, 0, NULL, 'Cash Basis', 0, false, NULL, NULL, false, NULL, 'Approved for Payment', 'Cynthia Ramos, LPT', '2026-05-24', NULL, 'Fee breakdown verified against BSIT 1st Year fee template. Approved for payment.', 'Eduardo Bonto, CPA', '2026-05-25'),
  ('as-miguel', (select id from public.schools where legacy_id = 'STSN'), (select id from public.students where legacy_id = 'stud-miguel'), '2026-2027', 'First Semester', 26000, 100, 26000, 'STSN Presidential Scholarship (Full Academic)', 'Cash Basis', 0, false, NULL, NULL, false, NULL, 'Approved for Payment', 'Cynthia Ramos, LPT', '2026-05-20', NULL, 'Full academic scholarship verified with Registrar''s office. Approved.', 'Eduardo Bonto, CPA', '2026-05-21'),
  ('as-juan', (select id from public.schools where legacy_id = 'CDSTA'), (select id from public.students where legacy_id = 'stud-juan'), '2026-2027', 'First Semester', 10200, 0, 0, NULL, 'Installment - 2 Payments', 5100, false, NULL, NULL, false, NULL, 'Pending Accounting Approval', 'Cynthia Ramos, LPT', '2026-06-11', 'BSBA 2nd Year assessment, 2-installment payment plan. No discounts applied.', NULL, NULL, NULL),
  ('as-cashier-basic-001', (select id from public.schools where legacy_id = 'STSN'), (select id from public.students where legacy_id = 'stud-g11-stem'), '2026-2027', 'First Semester', 30370, 0, 0, NULL, 'Installment - 4 Payments', 20000, false, NULL, NULL, true, (select id from public.book_packages where legacy_id = 'bp-grade11'), 'Approved for Payment', 'Cynthia Ramos, LPT', '2026-06-05', 'SHS STEM assessment with Grade 11 Book Package included, 4-installment plan.', 'Fee breakdown and book package verified. Approved for payment — 1st installment received, balance due on 2nd installment.', 'Eduardo Bonto, CPA', '2026-06-06'),
  ('as-cashier-basic-002', (select id from public.schools where legacy_id = 'STSN'), (select id from public.students where legacy_id = 'stud-katherine'), '2026-2027', 'First Semester', 29890, 0, 0, NULL, 'Quarterly', 22390, false, NULL, NULL, true, (select id from public.book_packages where legacy_id = 'bp-grade12'), 'Approved for Payment', 'Cynthia Ramos, LPT', '2026-06-03', 'SHS ABM assessment with Grade 12 Book Package included, quarterly payment plan.', 'Fee breakdown and book package verified. Approved for payment — Q1 downpayment received.', 'Eduardo Bonto, CPA', '2026-06-04'),
  ('as-cashier-basic-003', (select id from public.schools where legacy_id = 'STSN'), (select id from public.students where legacy_id = 'stud-g10-01'), '2026-2027', 'First Semester', 27770, 0, 0, NULL, 'Quarterly', 13885, false, NULL, NULL, true, (select id from public.book_packages where legacy_id = 'bp-grade10'), 'Approved for Payment', 'Cynthia Ramos, LPT', '2026-06-02', 'Grade 10 Junior High assessment with Grade 10 Book Package included, quarterly payment plan.', 'Fee breakdown and book package verified. Approved for payment — Q1 quarterly payment received.', 'Eduardo Bonto, CPA', '2026-06-03'),
  ('as-cashier-basic-004', (select id from public.schools where legacy_id = 'STSN'), (select id from public.students where legacy_id = 'stud-g8-01'), '2026-2027', 'First Semester', 25560, 0, 0, NULL, 'Installment - 2 Payments', 12780, false, NULL, NULL, true, (select id from public.book_packages where legacy_id = 'bp-grade8'), 'Approved for Payment', 'Cynthia Ramos, LPT', '2026-06-01', 'Grade 8 Junior High assessment with Grade 8 Book Package included, 2-installment plan.', 'Fee breakdown and book package verified. Approved for payment — 1st installment received.', 'Eduardo Bonto, CPA', '2026-06-02'),
  ('as-cashier-basic-005', (select id from public.schools where legacy_id = 'STSN'), (select id from public.students where legacy_id = 'stud-g7-01'), '2026-2027', 'First Semester', 20500, 0, 0, NULL, 'Quarterly', 20500, false, NULL, NULL, false, NULL, 'Pending Accounting Approval', 'Cynthia Ramos, LPT', '2026-06-12', 'Grade 7 Junior High assessment, quarterly payment plan. Ready for Accounting review.', NULL, NULL, NULL),
  ('as-cashier-basic-006', (select id from public.schools where legacy_id = 'STSN'), (select id from public.students where legacy_id = 'stud-g9-01'), '2026-2027', 'First Semester', 21500, 0, 0, NULL, 'Quarterly', 21500, false, NULL, NULL, false, NULL, 'Pending Accounting Approval', 'Cynthia Ramos, LPT', '2026-06-12', 'Grade 9 Junior High assessment, quarterly payment plan. Ready for Accounting review.', NULL, NULL, NULL),
  ('as-cashier-college-001', (select id from public.schools where legacy_id = 'CDSTA'), (select id from public.students where legacy_id = 'stud-leandro'), '2026-2027', 'First Semester', 28500, 0, 0, NULL, 'Installment - 2 Payments', 14250, false, NULL, NULL, false, NULL, 'Approved for Payment', 'Cynthia Ramos, LPT', '2026-06-05', 'BSCS 1st Year assessment, 2-installment payment plan.', 'Fee breakdown verified against BSCS 1st Year fee template. Approved — 1st installment received.', 'Eduardo Bonto, CPA', '2026-06-06'),
  ('as-cashier-college-002', (select id from public.schools where legacy_id = 'CDSTA'), (select id from public.students where legacy_id = 'stud-college-04'), '2026-2027', 'First Semester', 28150, 0, 0, NULL, 'Semestral', 18150, false, NULL, NULL, false, NULL, 'Approved for Payment', 'Cynthia Ramos, LPT', '2026-06-04', 'BSA 2nd Year assessment, semestral payment plan.', 'Fee breakdown verified against BSA 2nd Year fee template. Approved — downpayment received.', 'Eduardo Bonto, CPA', '2026-06-05'),
  ('as-cashier-college-003', (select id from public.schools where legacy_id = 'CDSTA'), (select id from public.students where legacy_id = 'stud-bsit-1'), '2026-2027', 'First Semester', 27800, 0, 0, NULL, 'Installment - 2 Payments', 13900, false, NULL, NULL, false, NULL, 'Approved for Payment', 'Cynthia Ramos, LPT', '2026-06-03', 'BSIT 1st Year assessment, 2-installment payment plan.', 'Fee breakdown verified against BSIT 1st Year fee template. Approved — 1st installment received.', 'Eduardo Bonto, CPA', '2026-06-04'),
  ('as-cashier-basic-007', (select id from public.schools where legacy_id = 'STSN'), (select id from public.students where legacy_id = 'stud-g1-01'), '2026-2027', 'First Semester', 20300, 0, 0, NULL, 'Installment - 2 Payments', 10150, false, NULL, NULL, false, NULL, 'Approved for Payment', 'Cynthia Ramos, LPT', '2026-06-05', 'Grade 1 Elementary assessment, 2-installment payment plan.', 'Fee breakdown verified. Approved for payment — 1st installment received.', 'Eduardo Bonto, CPA', '2026-06-06'),
  ('as-cashier-basic-008', (select id from public.schools where legacy_id = 'STSN'), (select id from public.students where legacy_id = 'stud-g2-01'), '2026-2027', 'First Semester', 20800, 0, 0, NULL, 'Quarterly', 15600, false, NULL, NULL, false, NULL, 'Approved for Payment', 'Cynthia Ramos, LPT', '2026-06-05', 'Grade 2 Elementary assessment, quarterly payment plan.', 'Fee breakdown verified. Approved for payment — Q1 downpayment received.', 'Eduardo Bonto, CPA', '2026-06-06'),
  ('as-cashier-basic-009', (select id from public.schools where legacy_id = 'STSN'), (select id from public.students where legacy_id = 'stud-g3-01'), '2026-2027', 'First Semester', 21400, 0, 0, NULL, 'Installment - 4 Payments', 16050, false, NULL, NULL, false, NULL, 'Approved for Payment', 'Cynthia Ramos, LPT', '2026-06-05', 'Grade 3 Elementary assessment, 4-installment payment plan.', 'Fee breakdown verified. Approved for payment — 1st installment received.', 'Eduardo Bonto, CPA', '2026-06-06'),
  ('as-cashier-basic-010', (select id from public.schools where legacy_id = 'STSN'), (select id from public.students where legacy_id = 'stud-g4-01'), '2026-2027', 'First Semester', 22200, 0, 0, NULL, 'Installment - 2 Payments', 11100, false, NULL, NULL, false, NULL, 'Approved for Payment', 'Cynthia Ramos, LPT', '2026-06-05', 'Grade 4 Elementary assessment, 2-installment payment plan.', 'Fee breakdown verified. Approved for payment — 1st installment received.', 'Eduardo Bonto, CPA', '2026-06-06'),
  ('as-cashier-basic-011', (select id from public.schools where legacy_id = 'STSN'), (select id from public.students where legacy_id = 'stud-g5-01'), '2026-2027', 'First Semester', 22700, 0, 0, NULL, 'Quarterly', 17025, false, NULL, NULL, false, NULL, 'Approved for Payment', 'Cynthia Ramos, LPT', '2026-06-05', 'Grade 5 Elementary assessment, quarterly payment plan.', 'Fee breakdown verified. Approved for payment — Q1 downpayment received.', 'Eduardo Bonto, CPA', '2026-06-06'),
  ('as-cashier-basic-012', (select id from public.schools where legacy_id = 'STSN'), (select id from public.students where legacy_id = 'stud-g6-01'), '2026-2027', 'First Semester', 23300, 0, 0, NULL, 'Quarterly', 23300, false, NULL, NULL, false, NULL, 'Pending Accounting Approval', 'Cynthia Ramos, LPT', '2026-06-12', 'Grade 6 Elementary assessment, quarterly payment plan. Ready for Accounting review.', NULL, NULL, NULL),
  ('as-cashier-basic-013', (select id from public.schools where legacy_id = 'STSN'), (select id from public.students where legacy_id = 'stud-g12-02'), '2026-2027', 'First Semester', 27200, 0, 0, NULL, 'Installment - 4 Payments', 27200, false, NULL, NULL, false, NULL, 'Pending Accounting Approval', 'Cynthia Ramos, LPT', '2026-06-12', 'Grade 12 STEM assessment, 4-installment payment plan. Ready for Accounting review.', NULL, NULL, NULL),
  ('as-cashier-basic-014', (select id from public.schools where legacy_id = 'STSN'), (select id from public.students where legacy_id = 'stud-nursery-01'), '2026-2027', 'First Semester', 18500, 0, 0, NULL, 'Quarterly', 18500, false, NULL, NULL, false, NULL, 'Pending Accounting Approval', 'Cynthia Ramos, LPT', '2026-06-12', 'Nursery Preschool assessment, quarterly payment plan. Ready for Accounting review.', NULL, NULL, NULL),
  ('as-cashier-basic-015', (select id from public.schools where legacy_id = 'STSN'), (select id from public.students where legacy_id = 'stud-kinder1-01'), '2026-2027', 'First Semester', 19000, 0, 0, NULL, 'Quarterly', 19000, false, NULL, NULL, false, NULL, 'Pending Accounting Approval', 'Cynthia Ramos, LPT', '2026-06-12', 'Kinder 1 Preschool assessment, quarterly payment plan. Ready for Accounting review.', NULL, NULL, NULL),
  ('as-cashier-basic-016', (select id from public.schools where legacy_id = 'STSN'), (select id from public.students where legacy_id = 'stud-kinder2-01'), '2026-2027', 'First Semester', 19500, 0, 0, NULL, 'Quarterly', 19500, false, NULL, NULL, false, NULL, 'Pending Accounting Approval', 'Cynthia Ramos, LPT', '2026-06-12', 'Kinder 2 Preschool assessment, quarterly payment plan. Ready for Accounting review.', NULL, NULL, NULL)
on conflict do nothing;

-- ============================================================================
-- ASSESSMENT_FEES
-- ============================================================================
insert into public.assessment_fees (assessment_id, fee_name, category, amount) values
  ((select id from public.assessments where legacy_id = 'as-enrico'), 'Tuition Fee (Flat SHS)', 'Tuition', 18000),
  ((select id from public.assessments where legacy_id = 'as-enrico'), 'Registration & Misc Fee', 'Miscellaneous', 4500),
  ((select id from public.assessments where legacy_id = 'as-enrico'), 'Computer Laboratory Fee', 'Laboratory', 3500),
  ((select id from public.assessments where legacy_id = 'as-enrico'), 'Student Council / ID Validation', 'ID/Other', 1200),
  ((select id from public.assessments where legacy_id = 'as-clara'), 'Tuition Fee (12 Units × ₱950/Unit)', 'Tuition', 11400),
  ((select id from public.assessments where legacy_id = 'as-clara'), 'Registration & Library Fee', 'Miscellaneous', 5200),
  ((select id from public.assessments where legacy_id = 'as-clara'), 'Laboratory Fee (Coding Labs)', 'Laboratory', 4000),
  ((select id from public.assessments where legacy_id = 'as-clara'), 'University ID Card Fee', 'ID/Other', 1500),
  ((select id from public.assessments where legacy_id = 'as-miguel'), 'Tuition Fee (Flat SHS)', 'Tuition', 18000),
  ((select id from public.assessments where legacy_id = 'as-miguel'), 'Registration & Misc Fee', 'Miscellaneous', 4500),
  ((select id from public.assessments where legacy_id = 'as-miguel'), 'Computer Laboratory Fee', 'Laboratory', 3500),
  ((select id from public.assessments where legacy_id = 'as-juan'), 'Tuition Fee (6 Units × ₱950/Unit)', 'Tuition', 5700),
  ((select id from public.assessments where legacy_id = 'as-juan'), 'Registration & Misc Fee', 'Miscellaneous', 4500),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-001'), 'Tuition Fee (Flat SHS)', 'Tuition', 18000),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-001'), 'Registration & Misc Fee', 'Miscellaneous', 4500),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-001'), 'Computer Laboratory Fee', 'Laboratory', 3500),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-001'), 'Student Council / ID Validation', 'ID/Other', 1200),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-001'), 'Books Package - Grade 11', 'Books', 3170),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-002'), 'Tuition Fee (Flat SHS)', 'Tuition', 18000),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-002'), 'Registration & Misc Fee', 'Miscellaneous', 4500),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-002'), 'Business Lab / Practicum Fee', 'Laboratory', 3000),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-002'), 'Student Council / ID Validation', 'ID/Other', 1200),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-002'), 'Books Package - Grade 12', 'Books', 3190),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-003'), 'Tuition Fee (Junior High)', 'Tuition', 16000),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-003'), 'Registration & Misc Fee', 'Miscellaneous', 4000),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-003'), 'Science Laboratory Fee', 'Laboratory', 3000),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-003'), 'Student Council / ID Validation', 'ID/Other', 1000),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-003'), 'Books Package - Grade 10', 'Books', 3770),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-004'), 'Tuition Fee (Junior High)', 'Tuition', 15000),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-004'), 'Registration & Misc Fee', 'Miscellaneous', 3500),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-004'), 'Science Laboratory Fee', 'Laboratory', 2500),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-004'), 'Student Council / ID Validation', 'ID/Other', 1000),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-004'), 'Books Package - Grade 8', 'Books', 3560),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-005'), 'Tuition Fee (Junior High)', 'Tuition', 14000),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-005'), 'Registration & Misc Fee', 'Miscellaneous', 3500),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-005'), 'Science Laboratory Fee', 'Laboratory', 2000),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-005'), 'Student Council / ID Validation', 'ID/Other', 1000),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-006'), 'Tuition Fee (Junior High)', 'Tuition', 14500),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-006'), 'Registration & Misc Fee', 'Miscellaneous', 3500),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-006'), 'Science Laboratory Fee', 'Laboratory', 2500),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-006'), 'Student Council / ID Validation', 'ID/Other', 1000),
  ((select id from public.assessments where legacy_id = 'as-cashier-college-001'), 'Tuition Fee (18 Units × ₱1,000/Unit)', 'Tuition', 18000),
  ((select id from public.assessments where legacy_id = 'as-cashier-college-001'), 'Registration & Misc Fee', 'Miscellaneous', 5000),
  ((select id from public.assessments where legacy_id = 'as-cashier-college-001'), 'Computer Laboratory Fee', 'Laboratory', 4500),
  ((select id from public.assessments where legacy_id = 'as-cashier-college-001'), 'University ID Card Fee', 'ID/Other', 1000),
  ((select id from public.assessments where legacy_id = 'as-cashier-college-002'), 'Tuition Fee (21 Units × ₱950/Unit)', 'Tuition', 19950),
  ((select id from public.assessments where legacy_id = 'as-cashier-college-002'), 'Registration & Misc Fee', 'Miscellaneous', 5200),
  ((select id from public.assessments where legacy_id = 'as-cashier-college-002'), 'Accounting Laboratory Fee', 'Laboratory', 2000),
  ((select id from public.assessments where legacy_id = 'as-cashier-college-002'), 'University ID Card Fee', 'ID/Other', 1000),
  ((select id from public.assessments where legacy_id = 'as-cashier-college-003'), 'Tuition Fee (18 Units × ₱950/Unit)', 'Tuition', 17100),
  ((select id from public.assessments where legacy_id = 'as-cashier-college-003'), 'Registration & Library Fee', 'Miscellaneous', 5200),
  ((select id from public.assessments where legacy_id = 'as-cashier-college-003'), 'Laboratory Fee (Coding Labs)', 'Laboratory', 4000),
  ((select id from public.assessments where legacy_id = 'as-cashier-college-003'), 'University ID Card Fee', 'ID/Other', 1500),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-007'), 'Tuition Fee (Elementary)', 'Tuition', 16000),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-007'), 'Registration & Misc Fee', 'Miscellaneous', 3500),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-007'), 'Student Council / ID Validation', 'ID/Other', 800),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-008'), 'Tuition Fee (Elementary)', 'Tuition', 16500),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-008'), 'Registration & Misc Fee', 'Miscellaneous', 3500),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-008'), 'Student Council / ID Validation', 'ID/Other', 800),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-009'), 'Tuition Fee (Elementary)', 'Tuition', 17000),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-009'), 'Registration & Misc Fee', 'Miscellaneous', 3600),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-009'), 'Student Council / ID Validation', 'ID/Other', 800),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-010'), 'Tuition Fee (Elementary)', 'Tuition', 17500),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-010'), 'Registration & Misc Fee', 'Miscellaneous', 3700),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-010'), 'Science Laboratory Fee', 'Laboratory', 1000),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-011'), 'Tuition Fee (Elementary)', 'Tuition', 18000),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-011'), 'Registration & Misc Fee', 'Miscellaneous', 3700),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-011'), 'Science Laboratory Fee', 'Laboratory', 1000),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-012'), 'Tuition Fee (Elementary)', 'Tuition', 18500),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-012'), 'Registration & Misc Fee', 'Miscellaneous', 3800),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-012'), 'Science Laboratory Fee', 'Laboratory', 1000),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-013'), 'Tuition Fee (Flat SHS)', 'Tuition', 18000),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-013'), 'Registration & Misc Fee', 'Miscellaneous', 4500),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-013'), 'Computer Laboratory Fee', 'Laboratory', 3500),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-013'), 'Student Council / ID Validation', 'ID/Other', 1200),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-014'), 'Tuition Fee (Preschool)', 'Tuition', 14000),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-014'), 'Registration & Misc Fee', 'Miscellaneous', 3000),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-014'), 'Learning Materials Fee', 'ID/Other', 1500),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-015'), 'Tuition Fee (Preschool)', 'Tuition', 14500),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-015'), 'Registration & Misc Fee', 'Miscellaneous', 3000),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-015'), 'Learning Materials Fee', 'ID/Other', 1500),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-016'), 'Tuition Fee (Preschool)', 'Tuition', 15000),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-016'), 'Registration & Misc Fee', 'Miscellaneous', 3000),
  ((select id from public.assessments where legacy_id = 'as-cashier-basic-016'), 'Learning Materials Fee', 'ID/Other', 1500)
on conflict do nothing;

-- ============================================================================
-- ASSESSMENT_AUDIT_TRAIL
-- ============================================================================
insert into public.assessment_audit_trail (legacy_id, assessment_id, action, performed_by, performed_at, details) values
  ('aud-as-enrico-1', (select id from public.assessments where legacy_id = 'as-enrico'), 'SUBMITTED_FOR_APPROVAL', 'Cynthia Ramos, LPT', '2026-06-10 09:15', 'Assessment submitted to Accounting for approval.'),
  ('aud-as-clara-1', (select id from public.assessments where legacy_id = 'as-clara'), 'SUBMITTED_FOR_APPROVAL', 'Cynthia Ramos, LPT', '2026-05-24 10:00', 'Assessment submitted to Accounting for approval.'),
  ('aud-as-clara-2', (select id from public.assessments where legacy_id = 'as-clara'), 'APPROVED_FOR_PAYMENT', 'Eduardo Bonto, CPA', '2026-05-25 08:30', 'Approved — fee breakdown verified.'),
  ('aud-as-miguel-1', (select id from public.assessments where legacy_id = 'as-miguel'), 'SUBMITTED_FOR_APPROVAL', 'Cynthia Ramos, LPT', '2026-05-20 09:00', 'Assessment submitted to Accounting for approval.'),
  ('aud-as-miguel-2', (select id from public.assessments where legacy_id = 'as-miguel'), 'APPROVED_FOR_PAYMENT', 'Eduardo Bonto, CPA', '2026-05-21 11:00', 'Approved — Presidential Scholarship (100%) verified.'),
  ('aud-as-juan-1', (select id from public.assessments where legacy_id = 'as-juan'), 'SUBMITTED_FOR_APPROVAL', 'Cynthia Ramos, LPT', '2026-06-11 14:00', 'Assessment submitted to Accounting for approval.'),
  ('aud-as-cashier-basic-001-1', (select id from public.assessments where legacy_id = 'as-cashier-basic-001'), 'SUBMITTED_FOR_APPROVAL', 'Cynthia Ramos, LPT', '2026-06-05 09:00', 'Assessment submitted to Accounting for approval.'),
  ('aud-as-cashier-basic-001-2', (select id from public.assessments where legacy_id = 'as-cashier-basic-001'), 'APPROVED_FOR_PAYMENT', 'Eduardo Bonto, CPA', '2026-06-06 10:15', 'Approved — fee breakdown and books package verified.'),
  ('aud-as-cashier-basic-002-1', (select id from public.assessments where legacy_id = 'as-cashier-basic-002'), 'SUBMITTED_FOR_APPROVAL', 'Cynthia Ramos, LPT', '2026-06-03 09:30', 'Assessment submitted to Accounting for approval.'),
  ('aud-as-cashier-basic-002-2', (select id from public.assessments where legacy_id = 'as-cashier-basic-002'), 'APPROVED_FOR_PAYMENT', 'Eduardo Bonto, CPA', '2026-06-04 11:00', 'Approved — fee breakdown and books package verified.'),
  ('aud-as-cashier-basic-003-1', (select id from public.assessments where legacy_id = 'as-cashier-basic-003'), 'SUBMITTED_FOR_APPROVAL', 'Cynthia Ramos, LPT', '2026-06-02 08:45', 'Assessment submitted to Accounting for approval.'),
  ('aud-as-cashier-basic-003-2', (select id from public.assessments where legacy_id = 'as-cashier-basic-003'), 'APPROVED_FOR_PAYMENT', 'Eduardo Bonto, CPA', '2026-06-03 10:00', 'Approved — fee breakdown and books package verified.'),
  ('aud-as-cashier-basic-004-1', (select id from public.assessments where legacy_id = 'as-cashier-basic-004'), 'SUBMITTED_FOR_APPROVAL', 'Cynthia Ramos, LPT', '2026-06-01 09:00', 'Assessment submitted to Accounting for approval.'),
  ('aud-as-cashier-basic-004-2', (select id from public.assessments where legacy_id = 'as-cashier-basic-004'), 'APPROVED_FOR_PAYMENT', 'Eduardo Bonto, CPA', '2026-06-02 09:30', 'Approved — fee breakdown and books package verified.'),
  ('aud-as-cashier-basic-005-1', (select id from public.assessments where legacy_id = 'as-cashier-basic-005'), 'SUBMITTED_FOR_APPROVAL', 'Cynthia Ramos, LPT', '2026-06-12 09:00', 'Assessment submitted to Accounting for approval.'),
  ('aud-as-cashier-basic-006-1', (select id from public.assessments where legacy_id = 'as-cashier-basic-006'), 'SUBMITTED_FOR_APPROVAL', 'Cynthia Ramos, LPT', '2026-06-12 09:15', 'Assessment submitted to Accounting for approval.'),
  ('aud-as-cashier-college-001-1', (select id from public.assessments where legacy_id = 'as-cashier-college-001'), 'SUBMITTED_FOR_APPROVAL', 'Cynthia Ramos, LPT', '2026-06-05 10:00', 'Assessment submitted to Accounting for approval.'),
  ('aud-as-cashier-college-001-2', (select id from public.assessments where legacy_id = 'as-cashier-college-001'), 'APPROVED_FOR_PAYMENT', 'Eduardo Bonto, CPA', '2026-06-06 09:00', 'Approved — fee breakdown verified.'),
  ('aud-as-cashier-college-002-1', (select id from public.assessments where legacy_id = 'as-cashier-college-002'), 'SUBMITTED_FOR_APPROVAL', 'Cynthia Ramos, LPT', '2026-06-04 10:30', 'Assessment submitted to Accounting for approval.'),
  ('aud-as-cashier-college-002-2', (select id from public.assessments where legacy_id = 'as-cashier-college-002'), 'APPROVED_FOR_PAYMENT', 'Eduardo Bonto, CPA', '2026-06-05 09:30', 'Approved — fee breakdown verified.'),
  ('aud-as-cashier-college-003-1', (select id from public.assessments where legacy_id = 'as-cashier-college-003'), 'SUBMITTED_FOR_APPROVAL', 'Cynthia Ramos, LPT', '2026-06-03 09:00', 'Assessment submitted to Accounting for approval.'),
  ('aud-as-cashier-college-003-2', (select id from public.assessments where legacy_id = 'as-cashier-college-003'), 'APPROVED_FOR_PAYMENT', 'Eduardo Bonto, CPA', '2026-06-04 09:15', 'Approved — fee breakdown verified.'),
  ('aud-as-cashier-basic-007-1', (select id from public.assessments where legacy_id = 'as-cashier-basic-007'), 'SUBMITTED_FOR_APPROVAL', 'Cynthia Ramos, LPT', '2026-06-05 09:00', 'Assessment submitted to Accounting for approval.'),
  ('aud-as-cashier-basic-007-2', (select id from public.assessments where legacy_id = 'as-cashier-basic-007'), 'APPROVED_FOR_PAYMENT', 'Eduardo Bonto, CPA', '2026-06-06 10:00', 'Approved — fee breakdown verified.'),
  ('aud-as-cashier-basic-008-1', (select id from public.assessments where legacy_id = 'as-cashier-basic-008'), 'SUBMITTED_FOR_APPROVAL', 'Cynthia Ramos, LPT', '2026-06-05 09:15', 'Assessment submitted to Accounting for approval.'),
  ('aud-as-cashier-basic-008-2', (select id from public.assessments where legacy_id = 'as-cashier-basic-008'), 'APPROVED_FOR_PAYMENT', 'Eduardo Bonto, CPA', '2026-06-06 10:15', 'Approved — fee breakdown verified.'),
  ('aud-as-cashier-basic-009-1', (select id from public.assessments where legacy_id = 'as-cashier-basic-009'), 'SUBMITTED_FOR_APPROVAL', 'Cynthia Ramos, LPT', '2026-06-05 09:30', 'Assessment submitted to Accounting for approval.'),
  ('aud-as-cashier-basic-009-2', (select id from public.assessments where legacy_id = 'as-cashier-basic-009'), 'APPROVED_FOR_PAYMENT', 'Eduardo Bonto, CPA', '2026-06-06 10:30', 'Approved — fee breakdown verified.'),
  ('aud-as-cashier-basic-010-1', (select id from public.assessments where legacy_id = 'as-cashier-basic-010'), 'SUBMITTED_FOR_APPROVAL', 'Cynthia Ramos, LPT', '2026-06-05 09:45', 'Assessment submitted to Accounting for approval.'),
  ('aud-as-cashier-basic-010-2', (select id from public.assessments where legacy_id = 'as-cashier-basic-010'), 'APPROVED_FOR_PAYMENT', 'Eduardo Bonto, CPA', '2026-06-06 10:45', 'Approved — fee breakdown verified.'),
  ('aud-as-cashier-basic-011-1', (select id from public.assessments where legacy_id = 'as-cashier-basic-011'), 'SUBMITTED_FOR_APPROVAL', 'Cynthia Ramos, LPT', '2026-06-05 10:00', 'Assessment submitted to Accounting for approval.'),
  ('aud-as-cashier-basic-011-2', (select id from public.assessments where legacy_id = 'as-cashier-basic-011'), 'APPROVED_FOR_PAYMENT', 'Eduardo Bonto, CPA', '2026-06-06 11:00', 'Approved — fee breakdown verified.'),
  ('aud-as-cashier-basic-012-1', (select id from public.assessments where legacy_id = 'as-cashier-basic-012'), 'SUBMITTED_FOR_APPROVAL', 'Cynthia Ramos, LPT', '2026-06-12 09:30', 'Assessment submitted to Accounting for approval.'),
  ('aud-as-cashier-basic-013-1', (select id from public.assessments where legacy_id = 'as-cashier-basic-013'), 'SUBMITTED_FOR_APPROVAL', 'Cynthia Ramos, LPT', '2026-06-12 09:45', 'Assessment submitted to Accounting for approval.'),
  ('aud-as-cashier-basic-014-1', (select id from public.assessments where legacy_id = 'as-cashier-basic-014'), 'SUBMITTED_FOR_APPROVAL', 'Cynthia Ramos, LPT', '2026-06-12 10:00', 'Assessment submitted to Accounting for approval.'),
  ('aud-as-cashier-basic-015-1', (select id from public.assessments where legacy_id = 'as-cashier-basic-015'), 'SUBMITTED_FOR_APPROVAL', 'Cynthia Ramos, LPT', '2026-06-12 10:15', 'Assessment submitted to Accounting for approval.'),
  ('aud-as-cashier-basic-016-1', (select id from public.assessments where legacy_id = 'as-cashier-basic-016'), 'SUBMITTED_FOR_APPROVAL', 'Cynthia Ramos, LPT', '2026-06-12 10:30', 'Assessment submitted to Accounting for approval.')
on conflict do nothing;

-- ============================================================================
-- ENROLLMENTS
-- ============================================================================
insert into public.enrollments (legacy_id, student_id, school_year, semester, enrollment_type, status, submitted_at, assessment_id) values
  ('enr-01', (select id from public.students where legacy_id = 'stud-enrico'), '2026-2027', 'N/A', 'Old Student', 'Enrolled', '2026-05-25 09:30', (select id from public.assessments where legacy_id = 'as-enrico')),
  ('enr-02', (select id from public.students where legacy_id = 'stud-clara'), '2026-2027', 'First Semester', 'New Student', 'Enrolled', '2026-05-26 11:22', (select id from public.assessments where legacy_id = 'as-clara')),
  ('enr-03', (select id from public.students where legacy_id = 'stud-katherine'), '2026-2027', 'N/A', 'New Student', 'Pending', '2026-05-28 14:15', NULL),
  ('enr-04', (select id from public.students where legacy_id = 'stud-miguel'), '2026-2027', 'N/A', 'Returnee', 'Approved', '2026-05-27 10:05', (select id from public.assessments where legacy_id = 'as-miguel')),
  ('enr-05', (select id from public.students where legacy_id = 'stud-juan'), '2026-2027', 'First Semester', 'Old Student', 'Enrolled', '2026-05-26 09:00', (select id from public.assessments where legacy_id = 'as-juan'))
on conflict do nothing;

-- ============================================================================
-- ENROLLMENT_SUBJECTS
-- ============================================================================
insert into public.enrollment_subjects (enrollment_id, subject_id) values
((select id from public.enrollments where legacy_id = 'enr-01'), (select id from public.subjects where code = 'SHS-ORAL-COM')),
((select id from public.enrollments where legacy_id = 'enr-01'), (select id from public.subjects where code = 'SHS-READ-WRITE')),
((select id from public.enrollments where legacy_id = 'enr-01'), (select id from public.subjects where code = 'SHS-GEN-MATH')),
((select id from public.enrollments where legacy_id = 'enr-01'), (select id from public.subjects where code = 'SHS-STAT-PROB')),
((select id from public.enrollments where legacy_id = 'enr-01'), (select id from public.subjects where code = 'SHS-EARTH-LIFE')),

((select id from public.enrollments where legacy_id = 'enr-02'), (select id from public.subjects where code = 'IT101')),
((select id from public.enrollments where legacy_id = 'enr-02'), (select id from public.subjects where code = 'IT102')),
((select id from public.enrollments where legacy_id = 'enr-02'), (select id from public.subjects where code = 'MATH101')),
((select id from public.enrollments where legacy_id = 'enr-02'), (select id from public.subjects where code = 'NSTP1')),

((select id from public.enrollments where legacy_id = 'enr-03'), (select id from public.subjects where code = 'SHS-ABM-OBA')),
((select id from public.enrollments where legacy_id = 'enr-03'), (select id from public.subjects where code = 'SHS-ABM-PRIN')),

((select id from public.enrollments where legacy_id = 'enr-04'), (select id from public.subjects where code = 'SHS-HUMSS-PCOM')),
((select id from public.enrollments where legacy_id = 'enr-04'), (select id from public.subjects where code = 'SHS-HUMSS-CW')),
((select id from public.enrollments where legacy_id = 'enr-04'), (select id from public.subjects where code = 'SHS-HUMSS-DISP')),

((select id from public.enrollments where legacy_id = 'enr-05'), (select id from public.subjects where code = 'BA201')),
((select id from public.enrollments where legacy_id = 'enr-05'), (select id from public.subjects where code = 'BA202'))

on conflict do nothing;

-- ============================================================================
-- PAYMENTS
-- ============================================================================
insert into public.payments (legacy_id, school_id, student_id, amount, payment_date, payment_method, or_number, term, remarks) values
  ('pay-1', (select id from public.schools where legacy_id = 'STSN'), (select id from public.students where legacy_id = 'stud-enrico'), 10000, '2026-05-25 10:00', 'GCash', 'OR-2026-89421', 'Downpayment', 'Initial enrollment downpayment'),
  ('pay-2', (select id from public.schools where legacy_id = 'CDSTA'), (select id from public.students where legacy_id = 'stud-clara'), 22100, '2026-05-26 11:45', 'Bank Transfer', 'OR-2026-89422', 'Full Payment', 'Full Tuition & Misc Fees Payment'),
  ('pay-3', (select id from public.schools where legacy_id = 'CDSTA'), (select id from public.students where legacy_id = 'stud-juan'), 5100, '2026-05-27 09:30', 'GCash', 'OR-2026-89423', 'Downpayment', 'First semester downpayment'),
  ('pay-cashier-001', (select id from public.schools where legacy_id = 'STSN'), (select id from public.students where legacy_id = 'stud-g11-stem'), 10370, '2026-06-06 13:20', 'Cash', 'OR-2026-90001', 'Downpayment', '1st installment payment for Grade 11 STEM assessment, paid in cash at cashier window'),
  ('pay-cashier-002', (select id from public.schools where legacy_id = 'STSN'), (select id from public.students where legacy_id = 'stud-g10-01'), 13885, '2026-06-03 10:05', 'GCash', 'OR-2026-90002', 'Installment', 'Q1 quarterly payment via GCash — Ref# GC2026100234'),
  ('pay-cashier-003', (select id from public.schools where legacy_id = 'CDSTA'), (select id from public.students where legacy_id = 'stud-leandro'), 14250, '2026-06-06 14:40', 'Bank Transfer', 'OR-2026-90003', 'Installment', '1st installment payment via BDO bank transfer — Ref# BT20260601887'),
  ('pay-cashier-004', (select id from public.schools where legacy_id = 'CDSTA'), (select id from public.students where legacy_id = 'stud-bsit-1'), 13900, '2026-06-04 11:15', 'Credit Card', 'OR-2026-90004', 'Downpayment', '1st semester partial payment via credit card — Approval Code 778812')
on conflict do nothing;

-- ============================================================================
-- DISCOUNT_TYPES
-- ============================================================================
insert into public.discount_types (legacy_id, code, name, discount_percent, discount_source, requires_approval, max_beneficiaries, description, is_active, effective_school_year, applicable_academic_unit, applies_to, discount_basis, discount_fixed_amount, is_stackable, requires_document, max_amount, gl_code) values
  ('dt-gov-1', 'GOV-PWD', 'PWD Discount', 20, 'Government', false, NULL, 'Persons with Disability - RA 10524', true, '2026-2027', 'both', 'Total Assessment', 'Percentage', NULL, false, true, NULL, NULL),
  ('dt-gov-2', 'GOV-SP', 'Solo Parent Discount', 10, 'Government', false, NULL, 'Children of solo parents - RA 8972', true, '2026-2027', 'both', 'Total Assessment', 'Percentage', NULL, false, true, NULL, NULL),
  ('dt-gov-3', 'GOV-4PS', '4Ps / Pantawid Pamilya', 100, 'Government', false, NULL, 'Beneficiaries of DSWD Pantawid Pamilyang Pilipino Program', true, '2026-2027', 'basic-ed', 'Total Assessment', 'Percentage', NULL, false, true, NULL, NULL),
  ('dt-sib-1', 'SIB-2', '2nd Sibling Discount', 5, 'Sibling', true, 1, '5% discount for second sibling enrolled in the same school year', true, '2026-2027', 'both', 'Tuition', 'Percentage', NULL, true, true, NULL, NULL),
  ('dt-sib-2', 'SIB-3', '3rd+ Sibling Discount', 10, 'Sibling', true, 999, '10% discount for 3rd and subsequent siblings', true, '2026-2027', 'both', 'Tuition', 'Percentage', NULL, true, true, NULL, NULL),
  ('dt-own-1', 'OWN-EMP', 'Employee / Owner Dependent Discount', 100, 'Owner', true, 3, 'Full tuition waiver for qualified employee dependents', true, '2026-2027', 'both', 'Total Assessment', 'Percentage', NULL, false, true, NULL, NULL),
  ('dt-schol-1', 'PRES-SCHOL', 'Presidential Scholarship', 100, 'Scholarship', true, 5, 'Full academic scholarship for top-performing students', true, '2026-2027', 'both', 'Total Assessment', 'Percentage', NULL, false, true, NULL, NULL),
  ('dt-schol-2', 'ACAD-SCHOL', 'Academic Excellence Award', 50, 'Scholarship', true, 10, '50% scholarship for Dean''s Listers', true, '2026-2027', 'college', 'Tuition', 'Percentage', NULL, false, true, NULL, NULL),
  ('dt-emp-1', 'FAM-DISC', 'Family Discount', 10, 'Employee', false, NULL, 'General family discount for staff members', true, '2026-2027', 'both', 'Tuition', 'Percentage', NULL, false, false, NULL, NULL)
on conflict do nothing;

-- ============================================================================
-- DISCOUNT_REQUESTS
-- ============================================================================
insert into public.discount_requests (legacy_id, reference_no, student_id, discount_type_id, requested_by, requested_at, status, sibling_names, level1_status, level1_approved_by, level1_approved_at, level2_status, level2_approved_by, level2_approved_at, remarks, attachment_names) values
  ('dreq-1', 'DISC-2026-1001', (select id from public.students where legacy_id = 'stud-enrico'), (select id from public.discount_types where legacy_id = 'dt-sib-1'), 'Eduardo Bonto, CPA', '2026-05-10 09:30', 'Approved', ARRAY['Bianca Torres']::text[], 'Approved', 'Cynthia Ramos, LPT', '2026-05-11 10:00', 'Approved', 'Admin Administrator', '2026-05-12 14:30', 'Verified sibling enrollment. Discount applied for AY 2026-2027.', ARRAY['enrollment_proof_sibling.pdf']::text[]),
  ('dreq-2', 'DISC-2026-1002', (select id from public.students where legacy_id = 'stud-g11-stem'), (select id from public.discount_types where legacy_id = 'dt-gov-1'), 'Eduardo Bonto, CPA', '2026-05-14 11:00', 'Pending', '{}', 'Pending', NULL, NULL, 'Pending', NULL, NULL, '', ARRAY['pwd_id_scan.jpg']::text[]),
  ('dreq-3', 'DISC-2026-1003', (select id from public.students where legacy_id = 'stud-bsit-1'), (select id from public.discount_types where legacy_id = 'dt-sib-2'), 'Eduardo Bonto, CPA', '2026-05-20 14:00', 'For Review', ARRAY['Gabrielle Torres','Jerome Santos']::text[], 'Approved', 'Cynthia Ramos, LPT', '2026-05-21 09:00', 'Pending', NULL, NULL, 'L1 approved. Pending L2 final review.', '{}')
on conflict do nothing;

-- ============================================================================
-- DISCOUNT_REQUEST_AUDIT_TRAIL
-- ============================================================================
insert into public.discount_request_audit_trail (legacy_id, discount_request_id, action, performed_by, performed_at, details) values
  ('ae-1', (select id from public.discount_requests where legacy_id = 'dreq-1'), 'REQUEST_SUBMITTED', 'Eduardo Bonto, CPA', '2026-05-10 09:30', 'Discount request submitted for 2nd Sibling Discount'),
  ('ae-2', (select id from public.discount_requests where legacy_id = 'dreq-1'), 'LEVEL_1_APPROVED', 'Cynthia Ramos, LPT', '2026-05-11 10:00', 'Approved - Sibling enrollment verified in system'),
  ('ae-3', (select id from public.discount_requests where legacy_id = 'dreq-1'), 'LEVEL_2_APPROVED', 'Admin Administrator', '2026-05-12 14:30', 'Final approval granted. 5% discount applied.'),
  ('ae-4', (select id from public.discount_requests where legacy_id = 'dreq-2'), 'REQUEST_SUBMITTED', 'Eduardo Bonto, CPA', '2026-05-14 11:00', 'PWD Discount request submitted. Awaiting L1 approval.'),
  ('ae-5', (select id from public.discount_requests where legacy_id = 'dreq-3'), 'REQUEST_SUBMITTED', 'Eduardo Bonto, CPA', '2026-05-20 14:00', '3rd sibling discount request submitted'),
  ('ae-6', (select id from public.discount_requests where legacy_id = 'dreq-3'), 'LEVEL_1_APPROVED', 'Cynthia Ramos, LPT', '2026-05-21 09:00', 'Sibling IDs verified. Forwarded to L2.')
on conflict do nothing;

-- ============================================================================
-- STUDENT_LEDGER_SUMMARIES
-- ============================================================================
insert into public.student_ledger_summaries (student_id, school_year, total_assessed, total_paid, discount_applied, balance, financial_hold_status, clearance_status, last_payment_date) values
  ((select id from public.students where legacy_id = 'stud-enrico'), '2026-2027', 27200, 10000, 2720, 14480, 'None', 'Not Cleared', '2026-05-25'),
  ((select id from public.students where legacy_id = 'stud-clara'), '2026-2027', 22100, 22100, 0, 0, 'None', 'Cleared', '2026-05-26'),
  ((select id from public.students where legacy_id = 'stud-miguel'), '2026-2027', 26000, 0, 26000, 0, 'None', 'Cleared', NULL),
  ((select id from public.students where legacy_id = 'stud-juan'), '2026-2027', 10200, 5100, 0, 5100, 'Hold', 'Not Cleared', '2026-05-27')
on conflict do nothing;

-- ============================================================================
-- LEDGER_TRANSACTIONS
-- ============================================================================
insert into public.ledger_transactions (legacy_id, student_id, date, description, type, debit, credit, balance, reference) values
  ('ltx-1', (select id from public.students where legacy_id = 'stud-enrico'), '2026-05-20', 'First Semester Assessment', 'Assessment', 27200, 0, 27200, 'as-enrico'),
  ('ltx-2', (select id from public.students where legacy_id = 'stud-enrico'), '2026-05-21', 'Family Discount (10%)', 'Discount', 0, 2720, 24480, 'dt-emp-1'),
  ('ltx-3', (select id from public.students where legacy_id = 'stud-enrico'), '2026-05-25', 'Downpayment via GCash', 'Payment', 0, 10000, 14480, 'pay-1'),
  ('ltx-4', (select id from public.students where legacy_id = 'stud-clara'), '2026-05-20', 'First Semester Assessment', 'Assessment', 22100, 0, 22100, 'as-clara'),
  ('ltx-5', (select id from public.students where legacy_id = 'stud-clara'), '2026-05-26', 'Full Payment via Bank Transfer', 'Payment', 0, 22100, 0, 'pay-2'),
  ('ltx-6', (select id from public.students where legacy_id = 'stud-juan'), '2026-05-20', 'First Semester Assessment', 'Assessment', 10200, 0, 10200, 'as-juan'),
  ('ltx-7', (select id from public.students where legacy_id = 'stud-juan'), '2026-05-27', 'Downpayment via GCash', 'Payment', 0, 5100, 5100, 'pay-3')
on conflict do nothing;

-- ============================================================================
-- FINANCIAL_HOLDS
-- ============================================================================
insert into public.financial_holds (legacy_id, student_id, hold_type, hold_category, reason, balance_amount, created_by, status, cleared_by, cleared_at, clearance_remarks, created_at) values
  ('fh-1', (select id from public.students where legacy_id = 'stud-juan'), 'Enrollment', 'Unpaid Balance', 'Outstanding balance from First Semester assessment', 5100, 'Eduardo Bonto, CPA', 'Active', NULL, NULL, NULL, '2026-05-28 09:00'),
  ('fh-2', (select id from public.students where legacy_id = 'stud-enrico'), 'COR', 'Missing Payment', 'Pending downpayment balance for Q1', 14480, 'Eduardo Bonto, CPA', 'Cleared', 'Eduardo Bonto, CPA', '2026-05-29 10:00', 'Partial payment plan approved by Accounting Office', '2026-05-26 08:30'),
  ('fh-3', (select id from public.students where legacy_id = 'stud-miguel'), 'Transcript', 'Incomplete Documents', 'Incomplete registrar documents on file', 0, 'Registrar Office', 'Active', NULL, NULL, NULL, '2026-06-02 10:15'),
  ('fh-4', (select id from public.students where legacy_id = 'stud-clara'), 'Exam Permit', 'Returned Payment', 'Returned check payment for tuition', 22100, 'Eduardo Bonto, CPA', 'Active', NULL, NULL, NULL, '2026-06-05 14:20'),
  ('fh-5', (select id from public.students where legacy_id = 'stud-leandro'), 'Graduation Clearance', 'Registrar Hold', 'Pending registrar clearance for outstanding library fines', 1500, 'Registrar Office', 'Active', NULL, NULL, NULL, '2026-06-08 09:00')
on conflict do nothing;

-- ============================================================================
-- ASSESSMENT_BILLING_SUMMARIES
-- ============================================================================
insert into public.assessment_billing_summaries (legacy_id, student_id, school_year, semester, academic_unit, fee_template_name, total_assessment, amount_due, balance, status) values
  ('abs-1', (select id from public.students where legacy_id = 'stud-enrico'), '2026-2027', 'First Semester', 'basic-ed', 'SHS STEM - Installment 4 Payments', 27200, 14480, 14480, 'Approved'),
  ('abs-2', (select id from public.students where legacy_id = 'stud-clara'), '2026-2027', 'First Semester', 'college', 'BSIT 1st Year - Cash Basis', 22100, 0, 0, 'Approved'),
  ('abs-3', (select id from public.students where legacy_id = 'stud-juan'), '2026-2027', 'First Semester', 'college', 'BSBA 2nd Year - Installment 2 Payments', 10200, 5100, 5100, 'Pending Approval')
on conflict do nothing;

-- ============================================================================
-- PAYMENT_COLLECTION_SUMMARIES
-- ============================================================================
insert into public.payment_collection_summaries (legacy_id, student_id, amount, payment_method, reference_no, payment_date, cashier, term, verification_status) values
  ('pcs-1', (select id from public.students where legacy_id = 'stud-enrico'), 10000, 'GCash', 'GC-89421', '2026-05-25 10:00', 'Eduardo Bonto, CPA', 'Downpayment', 'Verified'),
  ('pcs-2', (select id from public.students where legacy_id = 'stud-clara'), 22100, 'Bank Transfer', 'BDO-44219', '2026-05-26 11:45', 'Eduardo Bonto, CPA', 'Full Payment', 'Verified'),
  ('pcs-3', (select id from public.students where legacy_id = 'stud-juan'), 5100, 'GCash', 'GC-89423', '2026-05-27 09:30', 'Eduardo Bonto, CPA', 'Downpayment', 'Pending Verification')
on conflict do nothing;

-- ============================================================================
-- PROMISSORY_NOTES
-- ============================================================================
insert into public.promissory_notes (legacy_id, student_id, amount, due_date, status) values
  ('pn-1', (select id from public.students where legacy_id = 'stud-enrico'), 7240, '2026-06-30', 'Active'),
  ('pn-2', (select id from public.students where legacy_id = 'stud-juan'), 5100, '2026-06-10', 'Overdue')
on conflict do nothing;

-- ============================================================================
-- SUBJECT_CLASS_LOADS
-- ============================================================================
insert into public.subject_class_loads (legacy_id, teacher_id, subject_id, section_id, department, school_year, semester) values
  ('load-beatriz-gen-math', (select id from public.teachers where legacy_id = 'teach-beatriz'), (select id from public.subjects where legacy_id = 'SHS-GEN-MATH'), (select id from public.sections where legacy_id = 'sec-st-thomas'), 'Basic Education', '2026-2027', 'First Semester'),
  ('load-beatriz-oral-com', (select id from public.teachers where legacy_id = 'teach-beatriz'), (select id from public.subjects where legacy_id = 'SHS-ORAL-COM'), (select id from public.sections where legacy_id = 'sec-st-thomas'), 'Basic Education', '2026-2027', 'First Semester'),
  ('load-arthur-it101', (select id from public.teachers where legacy_id = 'teach-arthur'), (select id from public.subjects where legacy_id = 'IT101'), (select id from public.sections where legacy_id = 'sec-it101'), 'College', '2026-2027', 'First Semester'),
  ('load-arthur-it102', (select id from public.teachers where legacy_id = 'teach-arthur'), (select id from public.subjects where legacy_id = 'IT102'), (select id from public.sections where legacy_id = 'sec-it101'), 'College', '2026-2027', 'First Semester'),
  ('load-renato-it101', (select id from public.teachers where legacy_id = 'teach-renato'), (select id from public.subjects where legacy_id = 'IT101'), (select id from public.sections where legacy_id = 'sec-it101'), 'College', '2026-2027', 'First Semester')
on conflict do nothing;

-- ============================================================================
-- CLASS_LOAD_STUDENTS
-- ============================================================================
insert into public.class_load_students (class_load_id, student_id) values
  ((select id from public.subject_class_loads where legacy_id = 'load-beatriz-gen-math'), (select id from public.students where legacy_id = 'stud-enrico')),
  ((select id from public.subject_class_loads where legacy_id = 'load-beatriz-gen-math'), (select id from public.students where legacy_id = 'demo-st-02')),
  ((select id from public.subject_class_loads where legacy_id = 'load-beatriz-gen-math'), (select id from public.students where legacy_id = 'demo-st-03')),
  ((select id from public.subject_class_loads where legacy_id = 'load-beatriz-gen-math'), (select id from public.students where legacy_id = 'demo-st-04')),
  ((select id from public.subject_class_loads where legacy_id = 'load-beatriz-gen-math'), (select id from public.students where legacy_id = 'demo-st-05')),
  ((select id from public.subject_class_loads where legacy_id = 'load-beatriz-oral-com'), (select id from public.students where legacy_id = 'stud-enrico')),
  ((select id from public.subject_class_loads where legacy_id = 'load-beatriz-oral-com'), (select id from public.students where legacy_id = 'demo-st-02')),
  ((select id from public.subject_class_loads where legacy_id = 'load-beatriz-oral-com'), (select id from public.students where legacy_id = 'demo-st-03')),
  ((select id from public.subject_class_loads where legacy_id = 'load-beatriz-oral-com'), (select id from public.students where legacy_id = 'demo-st-04')),
  ((select id from public.subject_class_loads where legacy_id = 'load-beatriz-oral-com'), (select id from public.students where legacy_id = 'demo-st-05')),
  ((select id from public.subject_class_loads where legacy_id = 'load-arthur-it101'), (select id from public.students where legacy_id = 'stud-clara')),
  ((select id from public.subject_class_loads where legacy_id = 'load-arthur-it101'), (select id from public.students where legacy_id = 'demo-it-02')),
  ((select id from public.subject_class_loads where legacy_id = 'load-arthur-it101'), (select id from public.students where legacy_id = 'demo-it-03')),
  ((select id from public.subject_class_loads where legacy_id = 'load-arthur-it101'), (select id from public.students where legacy_id = 'demo-it-04')),
  ((select id from public.subject_class_loads where legacy_id = 'load-arthur-it102'), (select id from public.students where legacy_id = 'stud-clara')),
  ((select id from public.subject_class_loads where legacy_id = 'load-arthur-it102'), (select id from public.students where legacy_id = 'demo-it-02')),
  ((select id from public.subject_class_loads where legacy_id = 'load-arthur-it102'), (select id from public.students where legacy_id = 'demo-it-03')),
  ((select id from public.subject_class_loads where legacy_id = 'load-arthur-it102'), (select id from public.students where legacy_id = 'demo-it-04')),
  ((select id from public.subject_class_loads where legacy_id = 'load-renato-it101'), (select id from public.students where legacy_id = 'stud-clara')),
  ((select id from public.subject_class_loads where legacy_id = 'load-renato-it101'), (select id from public.students where legacy_id = 'demo-it-02')),
  ((select id from public.subject_class_loads where legacy_id = 'load-renato-it101'), (select id from public.students where legacy_id = 'demo-it-03')),
  ((select id from public.subject_class_loads where legacy_id = 'load-renato-it101'), (select id from public.students where legacy_id = 'demo-it-04'))
on conflict do nothing;

-- ============================================================================
-- GRADE_PERIODS
-- ============================================================================
insert into public.grade_periods (legacy_id, label, subject_id, section_id, school_year, teacher_id, is_finalized, finalized_at, finalized_by) values
  ('gp-genmath-q1', '1st Quarter', (select id from public.subjects where legacy_id = 'SHS-GEN-MATH'), (select id from public.sections where legacy_id = 'sec-st-thomas'), '2026-2027', (select id from public.teachers where legacy_id = 'teach-beatriz'), false, NULL, NULL),
  ('gp-genmath-q2', '2nd Quarter', (select id from public.subjects where legacy_id = 'SHS-GEN-MATH'), (select id from public.sections where legacy_id = 'sec-st-thomas'), '2026-2027', (select id from public.teachers where legacy_id = 'teach-beatriz'), false, NULL, NULL),
  ('gp-genmath-q3', '3rd Quarter', (select id from public.subjects where legacy_id = 'SHS-GEN-MATH'), (select id from public.sections where legacy_id = 'sec-st-thomas'), '2026-2027', (select id from public.teachers where legacy_id = 'teach-beatriz'), false, NULL, NULL),
  ('gp-genmath-q4', '4th Quarter', (select id from public.subjects where legacy_id = 'SHS-GEN-MATH'), (select id from public.sections where legacy_id = 'sec-st-thomas'), '2026-2027', (select id from public.teachers where legacy_id = 'teach-beatriz'), false, NULL, NULL),
  ('gp-oralcom-q1', '1st Quarter', (select id from public.subjects where legacy_id = 'SHS-ORAL-COM'), (select id from public.sections where legacy_id = 'sec-st-thomas'), '2026-2027', (select id from public.teachers where legacy_id = 'teach-beatriz'), false, NULL, NULL),
  ('gp-oralcom-q2', '2nd Quarter', (select id from public.subjects where legacy_id = 'SHS-ORAL-COM'), (select id from public.sections where legacy_id = 'sec-st-thomas'), '2026-2027', (select id from public.teachers where legacy_id = 'teach-beatriz'), false, NULL, NULL),
  ('gp-oralcom-q3', '3rd Quarter', (select id from public.subjects where legacy_id = 'SHS-ORAL-COM'), (select id from public.sections where legacy_id = 'sec-st-thomas'), '2026-2027', (select id from public.teachers where legacy_id = 'teach-beatriz'), false, NULL, NULL),
  ('gp-oralcom-q4', '4th Quarter', (select id from public.subjects where legacy_id = 'SHS-ORAL-COM'), (select id from public.sections where legacy_id = 'sec-st-thomas'), '2026-2027', (select id from public.teachers where legacy_id = 'teach-beatriz'), false, NULL, NULL),
  ('gp-it101-prelim', 'Prelim', (select id from public.subjects where legacy_id = 'IT101'), (select id from public.sections where legacy_id = 'sec-it101'), '2026-2027', (select id from public.teachers where legacy_id = 'teach-arthur'), false, NULL, NULL),
  ('gp-it101-midterm', 'Midterm', (select id from public.subjects where legacy_id = 'IT101'), (select id from public.sections where legacy_id = 'sec-it101'), '2026-2027', (select id from public.teachers where legacy_id = 'teach-arthur'), false, NULL, NULL),
  ('gp-it101-final', 'Final', (select id from public.subjects where legacy_id = 'IT101'), (select id from public.sections where legacy_id = 'sec-it101'), '2026-2027', (select id from public.teachers where legacy_id = 'teach-arthur'), false, NULL, NULL),
  ('gp-it102-prelim', 'Prelim', (select id from public.subjects where legacy_id = 'IT102'), (select id from public.sections where legacy_id = 'sec-it101'), '2026-2027', (select id from public.teachers where legacy_id = 'teach-arthur'), false, NULL, NULL),
  ('gp-it102-midterm', 'Midterm', (select id from public.subjects where legacy_id = 'IT102'), (select id from public.sections where legacy_id = 'sec-it101'), '2026-2027', (select id from public.teachers where legacy_id = 'teach-arthur'), false, NULL, NULL),
  ('gp-it102-final', 'Final', (select id from public.subjects where legacy_id = 'IT102'), (select id from public.sections where legacy_id = 'sec-it101'), '2026-2027', (select id from public.teachers where legacy_id = 'teach-arthur'), false, NULL, NULL)
on conflict do nothing;

-- ============================================================================
-- GRADE_CATEGORIES
-- ============================================================================
insert into public.grade_categories (grade_period_id, name, weight) values
  ((select id from public.grade_periods where legacy_id = 'gp-genmath-q1'), 'Quizzes', 25),
  ((select id from public.grade_periods where legacy_id = 'gp-genmath-q1'), 'Activities', 25),
  ((select id from public.grade_periods where legacy_id = 'gp-genmath-q1'), 'Written Exams', 50),
  ((select id from public.grade_periods where legacy_id = 'gp-genmath-q2'), 'Quizzes', 25),
  ((select id from public.grade_periods where legacy_id = 'gp-genmath-q2'), 'Activities', 25),
  ((select id from public.grade_periods where legacy_id = 'gp-genmath-q2'), 'Written Exams', 50),
  ((select id from public.grade_periods where legacy_id = 'gp-oralcom-q1'), 'Performance Tasks', 40),
  ((select id from public.grade_periods where legacy_id = 'gp-oralcom-q1'), 'Activities', 30),
  ((select id from public.grade_periods where legacy_id = 'gp-oralcom-q1'), 'Written Exams', 30),
  ((select id from public.grade_periods where legacy_id = 'gp-it101-prelim'), 'Quizzes', 30),
  ((select id from public.grade_periods where legacy_id = 'gp-it101-prelim'), 'Activities', 30),
  ((select id from public.grade_periods where legacy_id = 'gp-it101-prelim'), 'Written Exams', 40),
  ((select id from public.grade_periods where legacy_id = 'gp-it101-midterm'), 'Quizzes', 30),
  ((select id from public.grade_periods where legacy_id = 'gp-it101-midterm'), 'Activities', 30),
  ((select id from public.grade_periods where legacy_id = 'gp-it101-midterm'), 'Written Exams', 40),
  ((select id from public.grade_periods where legacy_id = 'gp-it102-prelim'), 'Quizzes', 30),
  ((select id from public.grade_periods where legacy_id = 'gp-it102-prelim'), 'Projects', 30),
  ((select id from public.grade_periods where legacy_id = 'gp-it102-prelim'), 'Written Exams', 40)
on conflict do nothing;

-- ============================================================================
-- GRADE_ITEMS
-- ============================================================================
insert into public.grade_items (legacy_id, grade_period_id, label, category, max_score, sort_order, due_date) values
  ('item-gm-q1-quiz1', (select id from public.grade_periods where legacy_id = 'gp-genmath-q1'), 'Quiz 1', 'Quizzes', 30, 1, NULL),
  ('item-gm-q1-quiz2', (select id from public.grade_periods where legacy_id = 'gp-genmath-q1'), 'Quiz 2', 'Quizzes', 30, 2, NULL),
  ('item-gm-q1-act1', (select id from public.grade_periods where legacy_id = 'gp-genmath-q1'), 'Activity 1', 'Activities', 50, 1, NULL),
  ('item-gm-q1-exam1', (select id from public.grade_periods where legacy_id = 'gp-genmath-q1'), 'Long Exam', 'Written Exams', 100, 1, NULL),
  ('item-oc-q1-pt1', (select id from public.grade_periods where legacy_id = 'gp-oralcom-q1'), 'Speech Delivery', 'Performance Tasks', 100, 1, NULL),
  ('item-oc-q1-act1', (select id from public.grade_periods where legacy_id = 'gp-oralcom-q1'), 'Group Activity 1', 'Activities', 50, 1, NULL),
  ('item-oc-q1-exam', (select id from public.grade_periods where legacy_id = 'gp-oralcom-q1'), 'Written Exam', 'Written Exams', 100, 1, NULL),
  ('item-it101-quiz1', (select id from public.grade_periods where legacy_id = 'gp-it101-prelim'), 'Quiz 1', 'Quizzes', 50, 1, NULL),
  ('item-it101-quiz2', (select id from public.grade_periods where legacy_id = 'gp-it101-prelim'), 'Quiz 2', 'Quizzes', 50, 2, NULL),
  ('item-it101-lab1', (select id from public.grade_periods where legacy_id = 'gp-it101-prelim'), 'Lab Exercise', 'Activities', 100, 1, NULL),
  ('item-it101-exam', (select id from public.grade_periods where legacy_id = 'gp-it101-prelim'), 'Prelim Exam', 'Written Exams', 100, 1, NULL),
  ('item-it102-quiz1', (select id from public.grade_periods where legacy_id = 'gp-it102-prelim'), 'Quiz 1', 'Quizzes', 50, 1, NULL),
  ('item-it102-proj1', (select id from public.grade_periods where legacy_id = 'gp-it102-prelim'), 'Project 1', 'Projects', 100, 1, NULL),
  ('item-it102-exam', (select id from public.grade_periods where legacy_id = 'gp-it102-prelim'), 'Prelim Exam', 'Written Exams', 100, 1, NULL)
on conflict do nothing;

-- ============================================================================
-- STUDENT_GRADE_ENTRIES
-- ============================================================================
insert into public.student_grade_entries (legacy_id, grade_period_id, student_id, grade_item_id, score) values
  ('sge-01', (select id from public.grade_periods where legacy_id = 'gp-genmath-q1'), (select id from public.students where legacy_id = 'stud-enrico'), (select id from public.grade_items where legacy_id = 'item-gm-q1-quiz1'), 25),
  ('sge-02', (select id from public.grade_periods where legacy_id = 'gp-genmath-q1'), (select id from public.students where legacy_id = 'stud-enrico'), (select id from public.grade_items where legacy_id = 'item-gm-q1-quiz2'), 22),
  ('sge-03', (select id from public.grade_periods where legacy_id = 'gp-genmath-q1'), (select id from public.students where legacy_id = 'stud-enrico'), (select id from public.grade_items where legacy_id = 'item-gm-q1-act1'), 45),
  ('sge-04', (select id from public.grade_periods where legacy_id = 'gp-genmath-q1'), (select id from public.students where legacy_id = 'stud-enrico'), (select id from public.grade_items where legacy_id = 'item-gm-q1-exam1'), 88),
  ('sge-05', (select id from public.grade_periods where legacy_id = 'gp-genmath-q1'), (select id from public.students where legacy_id = 'demo-st-02'), (select id from public.grade_items where legacy_id = 'item-gm-q1-quiz1'), 28),
  ('sge-06', (select id from public.grade_periods where legacy_id = 'gp-genmath-q1'), (select id from public.students where legacy_id = 'demo-st-02'), (select id from public.grade_items where legacy_id = 'item-gm-q1-quiz2'), 26),
  ('sge-07', (select id from public.grade_periods where legacy_id = 'gp-genmath-q1'), (select id from public.students where legacy_id = 'demo-st-02'), (select id from public.grade_items where legacy_id = 'item-gm-q1-act1'), 48),
  ('sge-08', (select id from public.grade_periods where legacy_id = 'gp-genmath-q1'), (select id from public.students where legacy_id = 'demo-st-02'), (select id from public.grade_items where legacy_id = 'item-gm-q1-exam1'), 95),
  ('sge-09', (select id from public.grade_periods where legacy_id = 'gp-genmath-q1'), (select id from public.students where legacy_id = 'demo-st-03'), (select id from public.grade_items where legacy_id = 'item-gm-q1-quiz1'), 18),
  ('sge-10', (select id from public.grade_periods where legacy_id = 'gp-genmath-q1'), (select id from public.students where legacy_id = 'demo-st-03'), (select id from public.grade_items where legacy_id = 'item-gm-q1-quiz2'), 15),
  ('sge-11', (select id from public.grade_periods where legacy_id = 'gp-genmath-q1'), (select id from public.students where legacy_id = 'demo-st-03'), (select id from public.grade_items where legacy_id = 'item-gm-q1-act1'), 35),
  ('sge-12', (select id from public.grade_periods where legacy_id = 'gp-genmath-q1'), (select id from public.students where legacy_id = 'demo-st-03'), (select id from public.grade_items where legacy_id = 'item-gm-q1-exam1'), 68),
  ('sge-13', (select id from public.grade_periods where legacy_id = 'gp-genmath-q1'), (select id from public.students where legacy_id = 'demo-st-04'), (select id from public.grade_items where legacy_id = 'item-gm-q1-quiz1'), NULL),
  ('sge-14', (select id from public.grade_periods where legacy_id = 'gp-genmath-q1'), (select id from public.students where legacy_id = 'demo-st-04'), (select id from public.grade_items where legacy_id = 'item-gm-q1-quiz2'), NULL),
  ('sge-15', (select id from public.grade_periods where legacy_id = 'gp-genmath-q1'), (select id from public.students where legacy_id = 'demo-st-04'), (select id from public.grade_items where legacy_id = 'item-gm-q1-act1'), 40),
  ('sge-16', (select id from public.grade_periods where legacy_id = 'gp-genmath-q1'), (select id from public.students where legacy_id = 'demo-st-04'), (select id from public.grade_items where legacy_id = 'item-gm-q1-exam1'), 78),
  ('sge-17', (select id from public.grade_periods where legacy_id = 'gp-genmath-q1'), (select id from public.students where legacy_id = 'demo-st-05'), (select id from public.grade_items where legacy_id = 'item-gm-q1-quiz1'), 24),
  ('sge-18', (select id from public.grade_periods where legacy_id = 'gp-genmath-q1'), (select id from public.students where legacy_id = 'demo-st-05'), (select id from public.grade_items where legacy_id = 'item-gm-q1-quiz2'), NULL),
  ('sge-19', (select id from public.grade_periods where legacy_id = 'gp-genmath-q1'), (select id from public.students where legacy_id = 'demo-st-05'), (select id from public.grade_items where legacy_id = 'item-gm-q1-act1'), 42),
  ('sge-20', (select id from public.grade_periods where legacy_id = 'gp-genmath-q1'), (select id from public.students where legacy_id = 'demo-st-05'), (select id from public.grade_items where legacy_id = 'item-gm-q1-exam1'), NULL),
  ('sge-21', (select id from public.grade_periods where legacy_id = 'gp-oralcom-q1'), (select id from public.students where legacy_id = 'stud-enrico'), (select id from public.grade_items where legacy_id = 'item-oc-q1-pt1'), 88),
  ('sge-22', (select id from public.grade_periods where legacy_id = 'gp-oralcom-q1'), (select id from public.students where legacy_id = 'stud-enrico'), (select id from public.grade_items where legacy_id = 'item-oc-q1-act1'), 44),
  ('sge-23', (select id from public.grade_periods where legacy_id = 'gp-oralcom-q1'), (select id from public.students where legacy_id = 'stud-enrico'), (select id from public.grade_items where legacy_id = 'item-oc-q1-exam'), 90),
  ('sge-24', (select id from public.grade_periods where legacy_id = 'gp-oralcom-q1'), (select id from public.students where legacy_id = 'demo-st-02'), (select id from public.grade_items where legacy_id = 'item-oc-q1-pt1'), 95),
  ('sge-25', (select id from public.grade_periods where legacy_id = 'gp-oralcom-q1'), (select id from public.students where legacy_id = 'demo-st-02'), (select id from public.grade_items where legacy_id = 'item-oc-q1-act1'), 48),
  ('sge-26', (select id from public.grade_periods where legacy_id = 'gp-oralcom-q1'), (select id from public.students where legacy_id = 'demo-st-02'), (select id from public.grade_items where legacy_id = 'item-oc-q1-exam'), 93),
  ('sge-27', (select id from public.grade_periods where legacy_id = 'gp-oralcom-q1'), (select id from public.students where legacy_id = 'demo-st-03'), (select id from public.grade_items where legacy_id = 'item-oc-q1-pt1'), 72),
  ('sge-28', (select id from public.grade_periods where legacy_id = 'gp-oralcom-q1'), (select id from public.students where legacy_id = 'demo-st-03'), (select id from public.grade_items where legacy_id = 'item-oc-q1-act1'), 30),
  ('sge-29', (select id from public.grade_periods where legacy_id = 'gp-oralcom-q1'), (select id from public.students where legacy_id = 'demo-st-03'), (select id from public.grade_items where legacy_id = 'item-oc-q1-exam'), 65),
  ('sge-30', (select id from public.grade_periods where legacy_id = 'gp-it101-prelim'), (select id from public.students where legacy_id = 'stud-clara'), (select id from public.grade_items where legacy_id = 'item-it101-quiz1'), 44),
  ('sge-31', (select id from public.grade_periods where legacy_id = 'gp-it101-prelim'), (select id from public.students where legacy_id = 'stud-clara'), (select id from public.grade_items where legacy_id = 'item-it101-quiz2'), 48),
  ('sge-32', (select id from public.grade_periods where legacy_id = 'gp-it101-prelim'), (select id from public.students where legacy_id = 'stud-clara'), (select id from public.grade_items where legacy_id = 'item-it101-lab1'), 93),
  ('sge-33', (select id from public.grade_periods where legacy_id = 'gp-it101-prelim'), (select id from public.students where legacy_id = 'stud-clara'), (select id from public.grade_items where legacy_id = 'item-it101-exam'), 90),
  ('sge-34', (select id from public.grade_periods where legacy_id = 'gp-it101-prelim'), (select id from public.students where legacy_id = 'demo-it-02'), (select id from public.grade_items where legacy_id = 'item-it101-quiz1'), 38),
  ('sge-35', (select id from public.grade_periods where legacy_id = 'gp-it101-prelim'), (select id from public.students where legacy_id = 'demo-it-02'), (select id from public.grade_items where legacy_id = 'item-it101-quiz2'), 35),
  ('sge-36', (select id from public.grade_periods where legacy_id = 'gp-it101-prelim'), (select id from public.students where legacy_id = 'demo-it-02'), (select id from public.grade_items where legacy_id = 'item-it101-lab1'), 75),
  ('sge-37', (select id from public.grade_periods where legacy_id = 'gp-it101-prelim'), (select id from public.students where legacy_id = 'demo-it-02'), (select id from public.grade_items where legacy_id = 'item-it101-exam'), 78),
  ('sge-38', (select id from public.grade_periods where legacy_id = 'gp-it101-prelim'), (select id from public.students where legacy_id = 'demo-it-03'), (select id from public.grade_items where legacy_id = 'item-it101-quiz1'), 50),
  ('sge-39', (select id from public.grade_periods where legacy_id = 'gp-it101-prelim'), (select id from public.students where legacy_id = 'demo-it-03'), (select id from public.grade_items where legacy_id = 'item-it101-quiz2'), 46),
  ('sge-40', (select id from public.grade_periods where legacy_id = 'gp-it101-prelim'), (select id from public.students where legacy_id = 'demo-it-03'), (select id from public.grade_items where legacy_id = 'item-it101-lab1'), 98),
  ('sge-41', (select id from public.grade_periods where legacy_id = 'gp-it101-prelim'), (select id from public.students where legacy_id = 'demo-it-03'), (select id from public.grade_items where legacy_id = 'item-it101-exam'), 96),
  ('sge-42', (select id from public.grade_periods where legacy_id = 'gp-it101-prelim'), (select id from public.students where legacy_id = 'demo-it-04'), (select id from public.grade_items where legacy_id = 'item-it101-quiz1'), NULL),
  ('sge-43', (select id from public.grade_periods where legacy_id = 'gp-it101-prelim'), (select id from public.students where legacy_id = 'demo-it-04'), (select id from public.grade_items where legacy_id = 'item-it101-quiz2'), NULL),
  ('sge-44', (select id from public.grade_periods where legacy_id = 'gp-it101-prelim'), (select id from public.students where legacy_id = 'demo-it-04'), (select id from public.grade_items where legacy_id = 'item-it101-lab1'), 60),
  ('sge-45', (select id from public.grade_periods where legacy_id = 'gp-it101-prelim'), (select id from public.students where legacy_id = 'demo-it-04'), (select id from public.grade_items where legacy_id = 'item-it101-exam'), 70)
on conflict do nothing;

-- ============================================================================
-- GRADES
-- ============================================================================
insert into public.grades (legacy_id, student_id, subject_id, teacher_id, school_year, semester, midterm_grade, final_grade, remarks) values
  ('gr-1', (select id from public.students where legacy_id = 'stud-enrico'), (select id from public.subjects where legacy_id = 'SHS-ORAL-COM'), (select id from public.teachers where legacy_id = 'teach-beatriz'), '2026-2027', 'First Semester', 88, 91, 'Passed'),
  ('gr-2', (select id from public.students where legacy_id = 'stud-enrico'), (select id from public.subjects where legacy_id = 'SHS-GEN-MATH'), (select id from public.teachers where legacy_id = 'teach-beatriz'), '2026-2027', 'First Semester', 84, 89, 'Passed'),
  ('gr-3', (select id from public.students where legacy_id = 'stud-enrico'), (select id from public.subjects where legacy_id = 'SHS-EARTH-LIFE'), (select id from public.teachers where legacy_id = 'teach-beatriz'), '2026-2027', 'First Semester', 92, 94, 'Passed'),
  ('gr-4', (select id from public.students where legacy_id = 'stud-clara'), (select id from public.subjects where legacy_id = 'IT101'), (select id from public.teachers where legacy_id = 'teach-arthur'), '2026-2027', 'First Semester', 90, 93, 'Passed'),
  ('gr-5', (select id from public.students where legacy_id = 'stud-clara'), (select id from public.subjects where legacy_id = 'IT102'), (select id from public.teachers where legacy_id = 'teach-arthur'), '2026-2027', 'First Semester', 87, 91, 'Passed'),
  ('gr-6', (select id from public.students where legacy_id = 'stud-juan'), (select id from public.subjects where legacy_id = 'BA201'), (select id from public.teachers where legacy_id = 'teach-carlo'), '2026-2027', 'First Semester', 82, 85, 'Passed')
on conflict do nothing;

-- ============================================================================
-- ANNOUNCEMENTS
-- ============================================================================
insert into public.announcements (legacy_id, title, content, date, category, author) values
  ('ann-1', 'Start of First Semester School Year 2026-2027', 'We are pleased to welcome all new and continuing students to St. Theresa School (STSN Connect). Standard classes for both Basic Education and College Departments will officially kick off on June 8, 2026. Please complete your physical requirements submission by June 12.', '2026-05-20', 'Academic', 'Registrar''s Office'),
  ('ann-2', 'Guidelines on Dynamic Installment Payments', 'The Accounting Office is pleased to introduce flexible payment terms for SY 2026-2027. Students can now pay via Cash, Semestral (2 Payments), or Quarterly (4 Payments) installment schemes directly available in their STSN Connect portal. Payment channels like GCash, Maya, and BDO Bank Transfer are 100% active.', '2026-05-24', 'Billing', 'Accounting Office'),
  ('ann-3', 'STSN Senior High Sports Intramurals 2026', 'Signups for STSN Golden Lions sports teams (Basketball, Volleyball, Badminton, and Chess) are officially active from June 2 to June 10. Forms are available at the student sports council bureau.', '2026-05-28', 'Event', 'Student Council'),
  ('ann-4', 'Enrollment Period for SY 2027-2028 Now Open', 'The enrollment window for School Year 2027-2028 is officially open from June 1 to June 30, 2027. All continuing students are encouraged to complete the online pre-enrollment form through the STSN Connect Student Portal.', '2026-06-01', 'Academic', 'Registrar''s Office')
on conflict do nothing;

-- ============================================================================
-- SCHOOL_EVENTS
-- ============================================================================
insert into public.school_events (legacy_id, title, description, date, department) values
  ('ev-1', 'General Orientation for Freshmen & New Students', 'Mandatory campus and portal guide held at the Theresa Hall Gym.', '2026-06-03', 'All'),
  ('ev-2', 'College IT Fair And Programming Exhibition', 'BSIT and tech showcase on artificial intelligence & software systems.', '2026-06-18', 'College'),
  ('ev-3', 'SHS Acquaintance Night 2026', 'Social networking and dance gathering for Senior High School strands.', '2026-06-25', 'Basic Education')
on conflict do nothing;

-- ============================================================================
-- LEARNING_MATERIALS
-- ============================================================================
insert into public.learning_materials (legacy_id, school_id, title, description, subject_id, section, teacher_id, learning_type, file_url, file_name, file_size, video_url, thumbnail_url, publish_status, upload_date, department, year_level, track_or_course, tags) values
  ('lm-stsn-v01', (select id from public.schools where legacy_id = 'STSN'), 'Algebra Basics: Linear Equations Explained', 'Comprehensive introduction to solving linear equations with step-by-step examples and practice problems for Grade 9 students.', (select id from public.subjects where legacy_id = 'JHS-MATH9'), 'St. Mark', (select id from public.teachers where legacy_id = 'teach-beatriz'), 'Video', NULL, NULL, NULL, 'https://www.youtube.com/embed/NybHckSEQBI', 'https://img.youtube.com/vi/NybHckSEQBI/hqdefault.jpg', 'Published', '2026-05-10', 'Basic Education', 'Grade 9', 'Junior High', ARRAY['algebra','math','grade9']::text[]),
  ('lm-stsn-v02', (select id from public.schools where legacy_id = 'STSN'), 'Earth Science: Structure of the Earth', 'Visual guide to the Earth''s interior layers, plate tectonics, and geological processes. Includes diagrams and animations.', (select id from public.subjects where legacy_id = 'JHS-SCI8'), 'St. Paul', (select id from public.teachers where legacy_id = 'teach-beatriz'), 'Video', NULL, NULL, NULL, 'https://www.youtube.com/embed/eIBe6qB0HdI', 'https://img.youtube.com/vi/eIBe6qB0HdI/hqdefault.jpg', 'Published', '2026-05-12', 'Basic Education', 'Grade 8', 'Junior High', ARRAY['earth science','geology']::text[]),
  ('lm-stsn-v03', (select id from public.schools where legacy_id = 'STSN'), 'Oral Communication: Public Speaking Techniques', 'Learn effective public speaking, voice projection, and non-verbal communication skills required for SHS Oral Communication.', (select id from public.subjects where legacy_id = 'SHS-ORAL-COM'), 'St. Thomas', (select id from public.teachers where legacy_id = 'teach-elena'), 'Video', NULL, NULL, NULL, 'https://www.youtube.com/embed/tShavGuo0_E', 'https://img.youtube.com/vi/tShavGuo0_E/hqdefault.jpg', 'Published', '2026-05-14', 'Basic Education', 'Grade 11', 'STEM', ARRAY['communication','speech','grade11']::text[]),
  ('lm-stsn-v04', (select id from public.schools where legacy_id = 'STSN'), 'General Mathematics: Functions and Relations', 'Master functions, domain, range, and function operations. Perfect review for Grade 11 STEM students.', (select id from public.subjects where legacy_id = 'SHS-GEN-MATH'), 'St. Thomas', (select id from public.teachers where legacy_id = 'teach-beatriz'), 'Video', NULL, NULL, NULL, 'https://www.youtube.com/embed/52tpYl2tTqk', 'https://img.youtube.com/vi/52tpYl2tTqk/hqdefault.jpg', 'Published', '2026-05-16', 'Basic Education', 'Grade 11', 'STEM', ARRAY['functions','math','stem']::text[]),
  ('lm-stsn-v05', (select id from public.schools where legacy_id = 'STSN'), 'Statistics and Probability: Measures of Central Tendency', 'Deep dive into mean, median, mode, and their applications in real-world data analysis for SHS STEM.', (select id from public.subjects where legacy_id = 'SHS-STAT-PROB'), 'St. Thomas', (select id from public.teachers where legacy_id = 'teach-beatriz'), 'Video', NULL, NULL, NULL, 'https://www.youtube.com/embed/kn83BA7cRNM', 'https://img.youtube.com/vi/kn83BA7cRNM/hqdefault.jpg', 'Published', '2026-05-18', 'Basic Education', 'Grade 11', 'STEM', ARRAY['statistics','probability','stem']::text[]),
  ('lm-stsn-v06', (select id from public.schools where legacy_id = 'STSN'), 'Biology 9: Cell Division — Mitosis & Meiosis', 'Animated walkthrough of cell division processes, with clear diagrams of mitosis and meiosis phases for Grade 9.', (select id from public.subjects where legacy_id = 'JHS-SCI9'), 'St. Mark', (select id from public.teachers where legacy_id = 'teach-beatriz'), 'Video', NULL, NULL, NULL, 'https://www.youtube.com/embed/L0k-enzoeOM', 'https://img.youtube.com/vi/L0k-enzoeOM/hqdefault.jpg', 'Published', '2026-05-20', 'Basic Education', 'Grade 9', 'Junior High', ARRAY['biology','cell division','science']::text[]),
  ('lm-stsn-m01', (select id from public.schools where legacy_id = 'STSN'), 'English Grammar: Parts of Speech Complete Guide', 'Comprehensive written module covering nouns, pronouns, verbs, adjectives, adverbs, prepositions, conjunctions, and interjections.', (select id from public.subjects where legacy_id = 'JHS-ENG7'), 'St. Theresa', (select id from public.teachers where legacy_id = 'teach-elena'), 'Module', '#module-pdf-grammar', 'English_Grammar_Parts_of_Speech.pdf', '2.4 MB', NULL, '', 'Published', '2026-05-08', 'Basic Education', 'Grade 7', 'Junior High', ARRAY['english','grammar','grade7']::text[]),
  ('lm-stsn-m02', (select id from public.schools where legacy_id = 'STSN'), 'Entrepreneurship: Business Plan Workshop Workbook', 'Step-by-step workbook for creating a business plan including market research, financial projections, and SWOT analysis.', (select id from public.subjects where legacy_id = 'SHS-ABM-PRIN'), 'St. Catherine', (select id from public.teachers where legacy_id = 'teach-carlo'), 'Document', '#doc-biz-plan', 'Business_Plan_Workshop.docx', '1.8 MB', NULL, '', 'Published', '2026-05-22', 'Basic Education', 'Grade 11', 'ABM', ARRAY['entrepreneurship','abm','business']::text[]),
  ('lm-stsn-m03', (select id from public.schools where legacy_id = 'STSN'), 'ICT Fundamentals: Introduction to Computers & Operating Systems', 'Module covering computer hardware, software, operating systems, and basic troubleshooting for Grade 11 students.', (select id from public.subjects where legacy_id = 'SHS-GEN-MATH'), 'St. Thomas', (select id from public.teachers where legacy_id = 'teach-arthur'), 'Module', '#module-ict-fundamentals', 'ICT_Fundamentals_Module1.pdf', '3.1 MB', NULL, '', 'Published', '2026-05-25', 'Basic Education', 'Grade 11', 'STEM', ARRAY['ict','computers','technology']::text[]),
  ('lm-stsn-cv01', (select id from public.schools where legacy_id = 'STSN'), 'Programming Logic: Introduction to Algorithms', 'Foundational concepts of algorithms, flowcharts, pseudocode, and problem-solving approaches for BSIT 1st year students.', (select id from public.subjects where legacy_id = 'IT101'), 'IT101', (select id from public.teachers where legacy_id = 'teach-arthur'), 'Video', NULL, NULL, NULL, 'https://www.youtube.com/embed/rL8X2mlNHPM', 'https://img.youtube.com/vi/rL8X2mlNHPM/hqdefault.jpg', 'Published', '2026-05-06', 'College', '1st Year', 'BSIT', ARRAY['programming','algorithms','bsit']::text[]),
  ('lm-stsn-cv02', (select id from public.schools where legacy_id = 'STSN'), 'Computer Programming 1: Variables and Data Types', 'Learn Python variables, data types, type casting, and basic input/output operations with live coding demonstrations.', (select id from public.subjects where legacy_id = 'IT102'), 'IT101', (select id from public.teachers where legacy_id = 'teach-arthur'), 'Video', NULL, NULL, NULL, 'https://www.youtube.com/embed/rfscVS0vtbw', 'https://img.youtube.com/vi/rfscVS0vtbw/hqdefault.jpg', 'Published', '2026-05-09', 'College', '1st Year', 'BSIT', ARRAY['python','programming','variables']::text[]),
  ('lm-stsn-cv03', (select id from public.schools where legacy_id = 'STSN'), 'Database Management: SQL SELECT Statements', 'Complete SQL SELECT tutorial covering WHERE clauses, ORDER BY, GROUP BY, JOINs, and subqueries for BSIT 2nd year.', (select id from public.subjects where legacy_id = 'IT202'), 'IT201', (select id from public.teachers where legacy_id = 'teach-arthur'), 'Video', NULL, NULL, NULL, 'https://www.youtube.com/embed/7S_tz1z_5bA', 'https://img.youtube.com/vi/7S_tz1z_5bA/hqdefault.jpg', 'Published', '2026-05-11', 'College', '2nd Year', 'BSIT', ARRAY['sql','database','bsit']::text[]),
  ('lm-stsn-cm01', (select id from public.schools where legacy_id = 'STSN'), 'Web Development 1: HTML & CSS Fundamentals', 'Comprehensive module covering HTML5 structure, semantic tags, CSS selectors, box model, flexbox, and responsive design.', (select id from public.subjects where legacy_id = 'IT201'), 'IT201', (select id from public.teachers where legacy_id = 'teach-arthur'), 'Module', '#module-web-dev', 'WebDev1_HTML_CSS_Module.pdf', '4.2 MB', NULL, '', 'Published', '2026-05-15', 'College', '2nd Year', 'BSIT', ARRAY['html','css','web development']::text[]),
  ('lm-cdsta-v01', (select id from public.schools where legacy_id = 'CDSTA'), 'Programming Logic & Design: Introduction', 'Foundational course on programming logic, flowcharts, pseudocode, and structured programming for BSIT freshmen.', (select id from public.subjects where legacy_id = 'IT101'), 'BSIT-1A', (select id from public.teachers where legacy_id = 'teach-renato'), 'Video', NULL, NULL, NULL, 'https://www.youtube.com/embed/zOjov-2OZ0E', 'https://img.youtube.com/vi/zOjov-2OZ0E/hqdefault.jpg', 'Published', '2026-05-07', 'College', '1st Year', 'BSIT', ARRAY['programming','logic','bsit']::text[]),
  ('lm-cdsta-v02', (select id from public.schools where legacy_id = 'CDSTA'), 'Fundamentals of Accounting 1: The Accounting Cycle', 'Full walkthrough of the accounting cycle from source documents to trial balance, with journal and ledger examples.', (select id from public.subjects where legacy_id = 'ACCT101'), 'BSA-1A', (select id from public.teachers where legacy_id = 'teach-lorena'), 'Video', NULL, NULL, NULL, 'https://www.youtube.com/embed/WNcXFoypWN0', 'https://img.youtube.com/vi/WNcXFoypWN0/hqdefault.jpg', 'Published', '2026-05-08', 'College', '1st Year', 'BSA', ARRAY['accounting','cycle','bsa']::text[]),
  ('lm-cdsta-v03', (select id from public.schools where legacy_id = 'CDSTA'), 'Principles of Management: Planning & Organizing', 'Management functions explained with real-world business case studies. Covers planning, organizing, leading, and controlling.', (select id from public.subjects where legacy_id = 'BA101'), 'BSBA-1A', (select id from public.teachers where legacy_id = 'teach-jerome'), 'Video', NULL, NULL, NULL, 'https://www.youtube.com/embed/KBpoBocJg_U', 'https://img.youtube.com/vi/KBpoBocJg_U/hqdefault.jpg', 'Published', '2026-05-10', 'College', '1st Year', 'BSBA', ARRAY['management','business','bsba']::text[]),
  ('lm-cdsta-v04', (select id from public.schools where legacy_id = 'CDSTA'), 'Hospitality Industry: Introduction to Hotel Operations', 'Overview of hotel departments, front desk operations, housekeeping standards, and food & beverage service for BSHM 1st year.', (select id from public.subjects where legacy_id = 'HM101'), 'BSHM-1A', (select id from public.teachers where legacy_id = 'teach-fe'), 'Video', NULL, NULL, NULL, 'https://www.youtube.com/embed/q0A24RDKLXA', 'https://img.youtube.com/vi/q0A24RDKLXA/hqdefault.jpg', 'Published', '2026-05-12', 'College', '1st Year', 'BSHM', ARRAY['hospitality','hotel','bshm']::text[]),
  ('lm-cdsta-v05', (select id from public.schools where legacy_id = 'CDSTA'), 'Data Structures: Arrays and Linked Lists', 'Visual explanation of arrays, singly linked lists, doubly linked lists, and circular linked lists with code implementations.', (select id from public.subjects where legacy_id = 'CS201'), 'BSCS-2A', (select id from public.teachers where legacy_id = 'teach-renato'), 'Video', NULL, NULL, NULL, 'https://www.youtube.com/embed/B31LgI4Y4DQ', 'https://img.youtube.com/vi/B31LgI4Y4DQ/hqdefault.jpg', 'Published', '2026-05-14', 'College', '2nd Year', 'BSCS', ARRAY['data structures','arrays','bscs']::text[]),
  ('lm-cdsta-v06', (select id from public.schools where legacy_id = 'CDSTA'), 'Biology Introduction: Cell Structure and Function', 'Learn about prokaryotic and eukaryotic cells, organelles, cell membrane, and cellular processes for Biology 101.', (select id from public.subjects where legacy_id = 'ED101'), 'BSED-1A', (select id from public.teachers where legacy_id = 'teach-fe'), 'Video', NULL, NULL, NULL, 'https://www.youtube.com/embed/URUJD5NEXC8', 'https://img.youtube.com/vi/URUJD5NEXC8/hqdefault.jpg', 'Published', '2026-05-16', 'College', '1st Year', 'BSED', ARRAY['biology','cells','bsed']::text[]),
  ('lm-cdsta-m01', (select id from public.schools where legacy_id = 'CDSTA'), 'Financial Accounting: Balance Sheet & Income Statement', 'Detailed module on preparing financial statements, analyzing balance sheets, and income statement components for BSA 2nd year.', (select id from public.subjects where legacy_id = 'ACCT201'), 'BSA-2A', (select id from public.teachers where legacy_id = 'teach-lorena'), 'Module', '#module-financial-accounting', 'Financial_Accounting_Module2.pdf', '3.6 MB', NULL, '', 'Published', '2026-05-20', 'College', '2nd Year', 'BSA', ARRAY['financial accounting','balance sheet','bsa']::text[]),
  ('lm-cdsta-m02', (select id from public.schools where legacy_id = 'CDSTA'), 'Human Resource Management: Recruitment & Selection', 'Complete guide to HR planning, job analysis, recruitment strategies, selection process, and onboarding procedures.', (select id from public.subjects where legacy_id = 'BA201'), 'BSBA-2A', (select id from public.teachers where legacy_id = 'teach-jerome'), 'Document', '#doc-hrm', 'HRM_Recruitment_Selection_Guide.docx', '2.1 MB', NULL, '', 'Published', '2026-05-22', 'College', '2nd Year', 'BSBA', ARRAY['hrm','recruitment','bsba']::text[]),
  ('lm-cdsta-m03', (select id from public.schools where legacy_id = 'CDSTA'), 'Food and Beverage Service: Table Setting Standards', 'Illustrated guide to formal and informal table settings, service styles (American, French, Russian), and dining etiquette.', (select id from public.subjects where legacy_id = 'HM102'), 'BSHM-1A', (select id from public.teachers where legacy_id = 'teach-fe'), 'Module', '#module-fnb', 'FnB_Table_Setting_Standards.pdf', '5.2 MB', NULL, '', 'Published', '2026-05-24', 'College', '1st Year', 'BSHM', ARRAY['hospitality','food beverage','table setting']::text[]),
  ('lm-stsn-draft01', (select id from public.schools where legacy_id = 'STSN'), 'Physical Science: Newton''s Laws of Motion [DRAFT]', 'Video lesson on Newton''s three laws with practical demonstrations and problem-solving exercises. Pending review.', (select id from public.subjects where legacy_id = 'SHS-PHYS-SCI'), 'St. Thomas', (select id from public.teachers where legacy_id = 'teach-beatriz'), 'Video', NULL, NULL, NULL, 'https://www.youtube.com/embed/kKKM8Y-u7ds', 'https://img.youtube.com/vi/kKKM8Y-u7ds/hqdefault.jpg', 'Draft', '2026-06-01', 'Basic Education', 'Grade 11', 'STEM', ARRAY['physics','newton','stem']::text[]),
  ('lm-cdsta-draft01', (select id from public.schools where legacy_id = 'CDSTA'), 'Network Administration: IP Addressing & Subnetting [DRAFT]', 'Comprehensive video covering IPv4/IPv6 addressing, subnet masks, CIDR notation, and network design principles.', (select id from public.subjects where legacy_id = 'IT302'), 'BSIT-3A', (select id from public.teachers where legacy_id = 'teach-renato'), 'Video', NULL, NULL, NULL, 'https://www.youtube.com/embed/s_gy5jSLkVA', 'https://img.youtube.com/vi/s_gy5jSLkVA/hqdefault.jpg', 'Draft', '2026-06-02', 'College', '3rd Year', 'BSIT', ARRAY['networking','ip','bsit']::text[])
on conflict do nothing;

-- ============================================================================
-- ACTIVITY_LOGS
-- ============================================================================
insert into public.activity_logs (legacy_id, actor_name, action, subject_label, activity_type) values
  ('act-1', 'Prof. Beatriz Cruz', 'Released Course Syllabus & Reading Checklist', 'SHS Gen Math • STEM Grade 11', 'syllabus'),
  ('act-2', 'Prof. Beatriz Cruz', 'Midterm grades finalized & locked', 'Senior High Applied Calculus • St. Thomas Section', 'grade'),
  ('act-3', 'Prof. Beatriz Cruz', 'Secured clearance for classroom attendance books', 'Office of the Senior Academic Registrar Desk', 'clearance'),
  ('act-4', 'Prof. Beatriz Cruz', 'Advisory Class Meeting Minutes recorded', 'St. Thomas Advisory Council', 'advisory')
on conflict do nothing;

-- ============================================================================
-- ENROLLMENT_HISTORY_STATS
-- ============================================================================
insert into public.enrollment_history_stats (school_year, school_id, student_count) values
  ('2023-2024', (select id from public.schools where legacy_id = 'STSN'), 280),
  ('2023-2024', (select id from public.schools where legacy_id = 'CDSTA'), 140),
  ('2024-2025', (select id from public.schools where legacy_id = 'STSN'), 320),
  ('2024-2025', (select id from public.schools where legacy_id = 'CDSTA'), 192),
  ('2025-2026', (select id from public.schools where legacy_id = 'STSN'), 410),
  ('2025-2026', (select id from public.schools where legacy_id = 'CDSTA'), 270),
  ('2026-2027', (select id from public.schools where legacy_id = 'STSN'), 520),
  ('2026-2027', (select id from public.schools where legacy_id = 'CDSTA'), 320)
on conflict do nothing;

-- ============================================================================
-- PAYROLL
-- ============================================================================
insert into public.payroll (legacy_id, employee_id, employee_name, position, basic_salary, allowances, sss_deduction, philhealth_deduction, pagibig_deduction, tax_deduction, net_pay, period, status) values
  ('payr-01', (select id from public.employees where legacy_id = 'emp-registrar'), 'Cynthia Ramos', 'Senior Registrar', 42000, 3500, 1200, 650, 150, 3100, 40400, 'May 16 - 31, 2026', 'Paid'),
  ('payr-02', (select id from public.employees where legacy_id = 'emp-accounting'), 'Eduardo Bonto', 'Chief Accountant', 58000, 4200, 1600, 800, 150, 5200, 54450, 'May 16 - 31, 2026', 'Paid'),
  ('payr-03', (select id from public.employees where legacy_id = 'emp-hr'), 'Gemma Santos', 'HR Manager', 45000, 3500, 1300, 700, 150, 3500, 42850, 'May 16 - 31, 2026', 'Paid')
on conflict do nothing;


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

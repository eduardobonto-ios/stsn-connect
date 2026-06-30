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

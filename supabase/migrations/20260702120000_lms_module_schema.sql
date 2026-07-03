-- ============================================================================
-- STSN CONNECT — Learning Management System schema (LMS module)
-- Migration: 20260702120000_lms_module_schema.sql
-- ----------------------------------------------------------------------------
-- Adds a course-based Learning Management System, per
-- docs/STSN_Connect_LMS_Module_Prompt.md. This is the Phase 1–4 "vertical
-- slice": course catalog, lessons/resources, enrollment, lesson progress, and
-- activity logs. Assessment/exam/certificate tables ship in a follow-up.
--
--   Reference / maintenance : lms_course_categories
--   Catalog                  : lms_courses, lms_course_lessons, lms_course_resources
--   Enrollment / progress    : lms_course_enrollments, lms_lesson_progress
--   Activity                  : lms_activity_logs
--
-- Design notes / safety (mirrors 20260701140000_library_system_schema.sql):
--   * NEW domain. Replaces the retired ONLINE_LEARNING module at the app layer;
--     no existing table is altered. The only writes to existing tables are
--     additive RBAC seed rows. Old ONLINE_LEARNING permission rows are left as
--     harmless orphans (this migration performs no destructive deletes).
--   * Additive & idempotent: `create table if not exists`,
--     `create index if not exists`, `drop trigger/policy if exists`, and
--     `on conflict do nothing`, so it is safe to re-run.
--   * Multi-school: every domain table carries school_id -> public.schools(id).
--   * RLS follows the project's demo posture: permissive anon + authenticated
--     CRUD, because the app uses the anon key with no signed-in session. Access
--     enforcement lives at the app layer (usePermissions). TIGHTEN BEFORE PROD.
--   * Integration mapping (no duplicated identity tables):
--       lms_courses.instructor_id      -> public.employees(id)  (on delete set null)
--       lms_course_enrollments.student_id -> public.students(id) (on delete cascade)
--       created_by                     -> text actor name (matches Library module)
--     Snapshots (instructor_name, student_name/no) preserve history if a source
--     record changes.
-- ============================================================================

-- ── helper: updated_at trigger ───────────────────────────────────────────────
create or replace function public.lms_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- 1. REFERENCE / MAINTENANCE
-- ============================================================================

-- 1.1 Course categories -----------------------------------------------------
create table if not exists public.lms_course_categories (
  id          uuid        primary key default gen_random_uuid(),
  school_id   uuid        references public.schools(id) on delete set null on update cascade,
  code        text        not null,
  name        text        not null,
  description text,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  text
);

create unique index if not exists ux_lms_course_categories_school_code
  on public.lms_course_categories (school_id, code);

-- ============================================================================
-- 2. CATALOG (courses, lessons, resources)
-- ============================================================================

-- 2.1 Courses ---------------------------------------------------------------
create table if not exists public.lms_courses (
  id               uuid        primary key default gen_random_uuid(),
  school_id        uuid        references public.schools(id) on delete set null on update cascade,
  category_id      uuid        references public.lms_course_categories(id) on delete set null,
  title            text        not null,
  description      text,
  thumbnail_url    text,
  difficulty       text        not null default 'Beginner'
                               check (difficulty in ('Beginner', 'Intermediate', 'Advanced')),
  duration_minutes integer     not null default 0,
  instructor_id    uuid        references public.employees(id) on delete set null,
  instructor_name  text,
  status           text        not null default 'Draft'
                               check (status in ('Draft', 'Published', 'Archived')),
  published_at     timestamptz,
  is_active        boolean     not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       text,
  updated_by       text
);

create index if not exists ix_lms_courses_school     on public.lms_courses (school_id);
create index if not exists ix_lms_courses_category   on public.lms_courses (category_id);
create index if not exists ix_lms_courses_instructor on public.lms_courses (instructor_id);
create index if not exists ix_lms_courses_status     on public.lms_courses (status);

-- 2.2 Course lessons --------------------------------------------------------
create table if not exists public.lms_course_lessons (
  id               uuid        primary key default gen_random_uuid(),
  school_id        uuid        references public.schools(id) on delete set null on update cascade,
  course_id        uuid        not null references public.lms_courses(id) on delete cascade,
  title            text        not null,
  description      text,
  content_type     text        not null default 'Video'
                               check (content_type in ('Video', 'Text', 'Document', 'Link', 'Quiz')),
  content_url      text,
  content_html     text,
  lesson_order     integer     not null default 0,
  duration_minutes integer     not null default 0,
  is_required      boolean     not null default true,
  status           text        not null default 'Published'
                               check (status in ('Draft', 'Published', 'Archived')),
  is_active        boolean     not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       text
);

create index if not exists ix_lms_course_lessons_course on public.lms_course_lessons (course_id);
create index if not exists ix_lms_course_lessons_order  on public.lms_course_lessons (course_id, lesson_order);

-- 2.3 Course resources (downloads / links) ----------------------------------
create table if not exists public.lms_course_resources (
  id            uuid        primary key default gen_random_uuid(),
  school_id     uuid        references public.schools(id) on delete set null on update cascade,
  course_id     uuid        not null references public.lms_courses(id) on delete cascade,
  lesson_id     uuid        references public.lms_course_lessons(id) on delete cascade,
  title         text        not null,
  resource_type text        not null default 'Document'
                            check (resource_type in ('Document', 'Link', 'Video', 'Other')),
  file_url      text,
  external_url  text,
  is_active     boolean     not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    text
);

create index if not exists ix_lms_course_resources_course on public.lms_course_resources (course_id);
create index if not exists ix_lms_course_resources_lesson on public.lms_course_resources (lesson_id);

-- ============================================================================
-- 3. ENROLLMENT & PROGRESS
-- ============================================================================

-- 3.1 Course enrollments ----------------------------------------------------
create table if not exists public.lms_course_enrollments (
  id                  uuid        primary key default gen_random_uuid(),
  school_id           uuid        references public.schools(id) on delete set null on update cascade,
  course_id           uuid        not null references public.lms_courses(id) on delete cascade,
  student_id          uuid        not null references public.students(id) on delete cascade,
  student_name        text,
  student_no          text,
  enrollment_status   text        not null default 'Active'
                                  check (enrollment_status in ('Active', 'Completed', 'Dropped')),
  progress_percentage numeric     not null default 0,
  started_at          timestamptz not null default now(),
  completed_at        timestamptz,
  is_active           boolean     not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  created_by          text
);

create unique index if not exists ux_lms_course_enrollments_course_student
  on public.lms_course_enrollments (course_id, student_id);
create index if not exists ix_lms_course_enrollments_student on public.lms_course_enrollments (student_id);
create index if not exists ix_lms_course_enrollments_status  on public.lms_course_enrollments (enrollment_status);

-- 3.2 Lesson progress -------------------------------------------------------
create table if not exists public.lms_lesson_progress (
  id                  uuid        primary key default gen_random_uuid(),
  school_id           uuid        references public.schools(id) on delete set null on update cascade,
  course_id           uuid        not null references public.lms_courses(id) on delete cascade,
  lesson_id           uuid        not null references public.lms_course_lessons(id) on delete cascade,
  student_id          uuid        not null references public.students(id) on delete cascade,
  status              text        not null default 'NotStarted'
                                  check (status in ('NotStarted', 'InProgress', 'Completed')),
  progress_percentage numeric     not null default 0,
  completed_at        timestamptz,
  last_accessed_at    timestamptz not null default now(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create unique index if not exists ux_lms_lesson_progress_lesson_student
  on public.lms_lesson_progress (lesson_id, student_id);
create index if not exists ix_lms_lesson_progress_course  on public.lms_lesson_progress (course_id);
create index if not exists ix_lms_lesson_progress_student on public.lms_lesson_progress (student_id);

-- ============================================================================
-- 4. ACTIVITY LOG
-- ============================================================================
create table if not exists public.lms_activity_logs (
  id            uuid        primary key default gen_random_uuid(),
  school_id     uuid        references public.schools(id) on delete set null on update cascade,
  user_id       uuid,       -- polymorphic (students.id | employees.id | users.id); no FK
  user_name     text,
  course_id     uuid        references public.lms_courses(id) on delete set null,
  lesson_id     uuid        references public.lms_course_lessons(id) on delete set null,
  activity_type text        not null,
  description   text,
  created_at    timestamptz not null default now()
);

create index if not exists ix_lms_activity_logs_user   on public.lms_activity_logs (user_id);
create index if not exists ix_lms_activity_logs_course on public.lms_activity_logs (course_id);
create index if not exists ix_lms_activity_logs_created on public.lms_activity_logs (created_at desc);

-- ============================================================================
-- 5. updated_at triggers (tables that carry updated_at)
-- ============================================================================
do $$
declare
  t text;
  lms_tables text[] := array[
    'lms_course_categories', 'lms_courses', 'lms_course_lessons',
    'lms_course_resources', 'lms_course_enrollments', 'lms_lesson_progress'
  ];
begin
  foreach t in array lms_tables loop
    execute format('drop trigger if exists %I on public.%I;', 'trg_' || t || '_touch', t);
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.lms_touch_updated_at();',
      'trg_' || t || '_touch', t
    );
  end loop;
end $$;

-- ============================================================================
-- 6. Row Level Security (demo posture: permissive anon + authenticated CRUD)
--    TIGHTEN BEFORE PRODUCTION together with the rest of the schema.
-- ============================================================================
do $$
declare
  t text;
  lms_tables text[] := array[
    'lms_course_categories', 'lms_courses', 'lms_course_lessons',
    'lms_course_resources', 'lms_course_enrollments', 'lms_lesson_progress',
    'lms_activity_logs'
  ];
begin
  foreach t in array lms_tables loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I on public.%I;', t || '_all_anon_auth', t);
    execute format(
      'create policy %I on public.%I for all to anon, authenticated using (true) with check (true);',
      t || '_all_anon_auth', t
    );
  end loop;
end $$;

-- ============================================================================
-- 7. SEED — reference data (non-optional). Seeded per demo school (STSN, CDSTA).
-- ============================================================================
do $$
declare
  v_school_code text;
  v_school_id   uuid;
begin
  foreach v_school_code in array array['STSN', 'CDSTA'] loop
    select id into v_school_id from public.schools where code = v_school_code limit 1;
    continue when v_school_id is null;

    insert into public.lms_course_categories (school_id, code, name, description) values
      (v_school_id, 'MATH', 'Mathematics',     'Numeracy, algebra, geometry, and statistics'),
      (v_school_id, 'SCI',  'Science',         'Natural, physical, and life sciences'),
      (v_school_id, 'ENG',  'English',         'Language, literature, and composition'),
      (v_school_id, 'TECH', 'Technology',      'Computer literacy, ICT, and digital skills'),
      (v_school_id, 'SPCH', 'Public Speaking', 'Communication and presentation skills'),
      (v_school_id, 'FIL',  'Filipiniana',     'Filipino language and Philippine studies')
    on conflict (school_id, code) do nothing;
  end loop;
end $$;

-- ============================================================================
-- 8. SEED — optional demo catalog + lessons + enrollments (STSN only).
--    Guarded so it does NOT pollute production. Mirrors the library "optional
--    demo" pattern: guarded on the demo school existing; skip if already seeded.
-- ============================================================================
do $$
declare
  v_school_id  uuid;
  v_cat_math   uuid;
  v_cat_sci    uuid;
  v_cat_spch   uuid;
  v_cat_tech   uuid;
  v_instr_id   uuid;
  v_instr_name text;
  v_course     uuid;
  v_student    record;
  r_course     record;
  r_lesson     record;
  v_seeded     int := 0;
begin
  select id into v_school_id from public.schools where code = 'STSN' limit 1;
  if v_school_id is null then
    return;
  end if;

  -- Skip the whole demo block if it has already been seeded.
  if exists (select 1 from public.lms_courses where school_id = v_school_id) then
    return;
  end if;

  select id into v_cat_math from public.lms_course_categories where school_id = v_school_id and code = 'MATH' limit 1;
  select id into v_cat_sci  from public.lms_course_categories where school_id = v_school_id and code = 'SCI'  limit 1;
  select id into v_cat_spch from public.lms_course_categories where school_id = v_school_id and code = 'SPCH' limit 1;
  select id into v_cat_tech from public.lms_course_categories where school_id = v_school_id and code = 'TECH' limit 1;

  -- Pick any employee as the demo instructor (nullable if none exist).
  select id, coalesce(first_name, '') || ' ' || coalesce(last_name, '')
    into v_instr_id, v_instr_name
    from public.employees
    where school_id = v_school_id
    limit 1;
  v_instr_name := nullif(btrim(coalesce(v_instr_name, '')), '');

  -- Courses -----------------------------------------------------------------
  insert into public.lms_courses
    (school_id, category_id, title, description, difficulty, duration_minutes,
     instructor_id, instructor_name, status, published_at, created_by)
  values
    (v_school_id, v_cat_math, 'Algebra Basics: Linear Equations',
     'Master solving and graphing linear equations, slopes, and intercepts.',
     'Beginner', 180, v_instr_id, v_instr_name, 'Published', now(), 'System'),
    (v_school_id, v_cat_sci, 'Earth Science: Geologic Structures',
     'Explore plate tectonics, rock formations, and geologic time.',
     'Intermediate', 240, v_instr_id, v_instr_name, 'Published', now(), 'System'),
    (v_school_id, v_cat_spch, 'Public Speaking Techniques',
     'Build confidence, structure, and delivery for effective presentations.',
     'Beginner', 150, v_instr_id, v_instr_name, 'Published', now(), 'System'),
    (v_school_id, v_cat_tech, 'Introduction to Digital Literacy',
     'Fundamentals of computers, the internet, and responsible digital citizenship.',
     'Beginner', 120, v_instr_id, v_instr_name, 'Published', now(), 'System');

  -- Lessons: 3 per demo course --------------------------------------------
  for r_course in
    select id, title from public.lms_courses where school_id = v_school_id order by created_at
  loop
    insert into public.lms_course_lessons
      (school_id, course_id, title, description, content_type, content_url, lesson_order, duration_minutes, is_required, status, created_by)
    values
      (v_school_id, r_course.id, 'Lesson 1 — Introduction',
       'Overview and objectives for ' || r_course.title || '.',
       'Video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 1, 20, true, 'Published', 'System'),
      (v_school_id, r_course.id, 'Lesson 2 — Core Concepts',
       'The main ideas and worked examples.',
       'Text', null, 2, 30, true, 'Published', 'System'),
      (v_school_id, r_course.id, 'Lesson 3 — Practice & Wrap-up',
       'Apply what you learned and review the key takeaways.',
       'Document', null, 3, 25, true, 'Published', 'System');

    -- One reference resource per course
    insert into public.lms_course_resources
      (school_id, course_id, title, resource_type, external_url, created_by)
    values
      (v_school_id, r_course.id, r_course.title || ' — Study Guide (PDF)', 'Document', null, 'System');
  end loop;

  -- Enrollments: enroll up to 3 STSN students into the first two courses ---
  for r_course in
    select id from public.lms_courses where school_id = v_school_id order by created_at limit 2
  loop
    v_seeded := 0;
    for v_student in
      select id, coalesce(first_name, '') || ' ' || coalesce(last_name, '') as full_name, student_no
        from public.students
        where school_id = v_school_id
        order by created_at
        limit 3
    loop
      insert into public.lms_course_enrollments
        (school_id, course_id, student_id, student_name, student_no, enrollment_status, progress_percentage, created_by)
      values
        (v_school_id, r_course.id, v_student.id, nullif(btrim(v_student.full_name), ''), v_student.student_no, 'Active', 0, 'System')
      on conflict (course_id, student_id) do nothing;

      -- Mark the first lesson complete for the first student to show progress.
      if v_seeded = 0 then
        for r_lesson in
          select id from public.lms_course_lessons where course_id = r_course.id and lesson_order = 1 limit 1
        loop
          insert into public.lms_lesson_progress
            (school_id, course_id, lesson_id, student_id, status, progress_percentage, completed_at)
          values
            (v_school_id, r_course.id, r_lesson.id, v_student.id, 'Completed', 100, now())
          on conflict (lesson_id, student_id) do nothing;

          update public.lms_course_enrollments
            set progress_percentage = 33
            where course_id = r_course.id and student_id = v_student.id;

          insert into public.lms_activity_logs
            (school_id, user_id, user_name, course_id, lesson_id, activity_type, description)
          values
            (v_school_id, v_student.id, nullif(btrim(v_student.full_name), ''), r_course.id, r_lesson.id,
             'LESSON_COMPLETED', 'Completed a lesson');
        end loop;
      end if;

      v_seeded := v_seeded + 1;
    end loop;
  end loop;
end $$;

-- ============================================================================
-- 9. SEED — RBAC permissions (LMS) + role grants.
--    Mirrors 20260701140000_library_system_schema.sql section 9.
-- ============================================================================

-- 9a. Module-level access ---------------------------------------------------
insert into public.security_permissions (module_key, page_key, action_key, label, sort_order) values
  ('LMS', null, 'view', 'View Learning Management', 30)
on conflict (module_key, coalesce(page_key, ''), action_key) do nothing;

-- 9b. Page-level action permissions -----------------------------------------
insert into public.security_permissions (module_key, page_key, action_key, label, sort_order) values
  ('LMS', 'dashboard', 'view',   'LMS Dashboard — View', 900),
  ('LMS', 'courses',   'view',   'Course Catalog — View', 910),
  ('LMS', 'courses',   'create', 'Course Catalog — Create Course', 911),
  ('LMS', 'courses',   'edit',   'Course Catalog — Edit Course', 912),
  ('LMS', 'courses',   'delete', 'Course Catalog — Delete Course', 913),
  ('LMS', 'courses',   'enroll', 'Course Catalog — Enroll', 914),
  ('LMS', 'progress',  'view',   'Student Progress — View', 920)
on conflict (module_key, coalesce(page_key, ''), action_key) do nothing;

-- 9c. Role grants -----------------------------------------------------------
-- SUPER_ADMIN → every LMS permission.
insert into public.security_role_permissions (role_id, permission_id, is_allowed)
select r.id, p.id, true
from public.security_roles r
cross join public.security_permissions p
where r.code = 'SUPER_ADMIN'
  and p.module_key = 'LMS'
on conflict (role_id, permission_id) do nothing;

-- TEACHER, PRINCIPAL, REGISTRAR → all LMS permissions (course management + view).
insert into public.security_role_permissions (role_id, permission_id, is_allowed)
select r.id, p.id, true
from public.security_roles r
join public.security_permissions p on p.module_key = 'LMS'
where r.code in ('TEACHER', 'PRINCIPAL', 'REGISTRAR')
on conflict (role_id, permission_id) do nothing;

-- STUDENT → view + enroll (dashboard, courses view/enroll, progress).
insert into public.security_role_permissions (role_id, permission_id, is_allowed)
select r.id, p.id, true
from public.security_roles r
join public.security_permissions p on p.module_key = 'LMS'
where r.code = 'STUDENT'
  and (p.page_key is null
       or (p.page_key = 'dashboard' and p.action_key = 'view')
       or (p.page_key = 'courses'   and p.action_key in ('view', 'enroll'))
       or (p.page_key = 'progress'  and p.action_key = 'view'))
on conflict (role_id, permission_id) do nothing;

-- ============================================================================
-- 10. Comments
-- ============================================================================
comment on table public.lms_course_categories is 'LMS course categories (per school).';
comment on table public.lms_courses is 'LMS course catalog. instructor_id -> employees(id); instructor_name snapshotted.';
comment on table public.lms_course_lessons is 'Lessons within a course, ordered by lesson_order.';
comment on table public.lms_course_resources is 'Downloadable / reference materials per course or lesson.';
comment on table public.lms_course_enrollments is 'Student course enrollment. student_id -> students(id); name/no snapshotted.';
comment on table public.lms_lesson_progress is 'Per-student, per-lesson progress. Drives course progress_percentage.';
comment on table public.lms_activity_logs is 'LMS activity history. user_id is polymorphic (students|employees|users); no FK.';

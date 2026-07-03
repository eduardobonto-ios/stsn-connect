-- ============================================================================
-- STSN CONNECT — LMS Assessments / Exams / Certificates schema (LMS module)
-- Migration: 20260702130000_lms_assessments_schema.sql
-- ----------------------------------------------------------------------------
-- Phase 5–6 follow-up to 20260702120000_lms_module_schema.sql. Adds the
-- assessment/exam engine and certificates, per docs/STSN_Connect_LMS_Module_Prompt.md.
--
--   Authoring / bank   : lms_assessments, lms_assessment_questions, lms_question_options
--   Taking / grading   : lms_assessment_attempts, lms_assessment_answers, lms_assessment_results
--   Recognition        : lms_certificates, lms_student_certificates
--
-- Design notes / safety (mirrors 20260702120000_lms_module_schema.sql):
--   * Additive & idempotent: `create table if not exists`, `create index if not
--     exists`, `drop trigger/policy if exists`, `on conflict do nothing`, and
--     demo seed guarded on "already seeded" — safe to re-run.
--   * Column names are the snake_case sources for the camelCase mirrors in
--     src/features/lms/types.ts (produced by toCamel()/toSnake() in
--     services/supabaseCrud.ts). Keep the two in sync.
--   * Multi-school: domain tables carry school_id -> public.schools(id).
--   * RLS follows the project's demo posture: permissive anon + authenticated
--     CRUD. Access enforcement lives at the app layer (usePermissions).
--     TIGHTEN BEFORE PROD.
--   * Integration mapping (no duplicated identity tables):
--       lms_assessment_attempts.student_id  -> public.students(id) (on delete cascade)
--       lms_assessment_results.student_id   -> public.students(id) (on delete cascade)
--       lms_student_certificates.student_id -> public.students(id) (on delete cascade)
--       *.course_id                         -> public.lms_courses(id)
--     graded_by / created_by / updated_by are text actor names (Library pattern).
--   * The updated_at trigger helper public.lms_touch_updated_at() is created by
--     the 20260702120000 migration; re-declared here (create or replace) so this
--     file is self-contained if applied independently.
-- ============================================================================

-- ── helper: updated_at trigger (idempotent; also defined in the 0702120000 file) ─
create or replace function public.lms_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- 1. AUTHORING — assessments, questions, options
-- ============================================================================

-- 1.1 Assessments (quizzes, exams, assignments, activities, projects) --------
create table if not exists public.lms_assessments (
  id                  uuid        primary key default gen_random_uuid(),
  school_id           uuid        references public.schools(id) on delete set null on update cascade,
  course_id           uuid        references public.lms_courses(id) on delete set null,
  title               text        not null,
  description         text,
  assessment_type     text        not null default 'Quiz'
                                  check (assessment_type in ('Assignment', 'Quiz', 'Exam', 'Activity', 'Project')),
  time_limit_minutes  integer     not null default 0,
  passing_score       numeric     not null default 60,
  total_points        numeric     not null default 0,
  due_date            timestamptz,
  status              text        not null default 'Draft'
                                  check (status in ('Draft', 'Published', 'Archived')),
  allow_retake        boolean     not null default false,
  max_attempts        integer     not null default 1,
  randomize_questions boolean     not null default false,
  is_active           boolean     not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  created_by          text,
  updated_by          text
);

create index if not exists ix_lms_assessments_school on public.lms_assessments (school_id);
create index if not exists ix_lms_assessments_course on public.lms_assessments (course_id);
create index if not exists ix_lms_assessments_status on public.lms_assessments (status);
create index if not exists ix_lms_assessments_type   on public.lms_assessments (assessment_type);

-- 1.2 Assessment questions --------------------------------------------------
create table if not exists public.lms_assessment_questions (
  id             uuid        primary key default gen_random_uuid(),
  school_id      uuid        references public.schools(id) on delete set null on update cascade,
  assessment_id  uuid        not null references public.lms_assessments(id) on delete cascade,
  question_text  text        not null,
  question_type  text        not null default 'MultipleChoice'
                             check (question_type in ('MultipleChoice', 'TrueFalse', 'ShortAnswer', 'Essay', 'Identification')),
  points         numeric     not null default 1,
  question_order integer     not null default 0,
  correct_answer text,
  explanation    text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists ix_lms_assessment_questions_assessment on public.lms_assessment_questions (assessment_id);
create index if not exists ix_lms_assessment_questions_order      on public.lms_assessment_questions (assessment_id, question_order);

-- 1.3 Question options (multiple choice / true-false) -----------------------
create table if not exists public.lms_question_options (
  id           uuid        primary key default gen_random_uuid(),
  question_id  uuid        not null references public.lms_assessment_questions(id) on delete cascade,
  option_text  text        not null,
  is_correct   boolean     not null default false,
  option_order integer     not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists ix_lms_question_options_question on public.lms_question_options (question_id);

-- ============================================================================
-- 2. TAKING & GRADING — attempts, answers, results
-- ============================================================================

-- 2.1 Attempts --------------------------------------------------------------
create table if not exists public.lms_assessment_attempts (
  id                 uuid        primary key default gen_random_uuid(),
  school_id          uuid        references public.schools(id) on delete set null on update cascade,
  assessment_id      uuid        not null references public.lms_assessments(id) on delete cascade,
  student_id         uuid        not null references public.students(id) on delete cascade,
  attempt_number     integer     not null default 1,
  started_at         timestamptz,
  submitted_at       timestamptz,
  status             text        not null default 'InProgress'
                                 check (status in ('InProgress', 'Submitted', 'Graded')),
  score              numeric     not null default 0,
  percentage         numeric     not null default 0,
  time_spent_seconds integer     not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create unique index if not exists ux_lms_assessment_attempts_asm_student_num
  on public.lms_assessment_attempts (assessment_id, student_id, attempt_number);
create index if not exists ix_lms_assessment_attempts_assessment on public.lms_assessment_attempts (assessment_id);
create index if not exists ix_lms_assessment_attempts_student    on public.lms_assessment_attempts (student_id);
create index if not exists ix_lms_assessment_attempts_status     on public.lms_assessment_attempts (status);

-- 2.2 Answers ---------------------------------------------------------------
create table if not exists public.lms_assessment_answers (
  id                 uuid        primary key default gen_random_uuid(),
  attempt_id         uuid        not null references public.lms_assessment_attempts(id) on delete cascade,
  question_id        uuid        not null references public.lms_assessment_questions(id) on delete cascade,
  selected_option_id uuid        references public.lms_question_options(id) on delete set null,
  answer_text        text,
  is_correct         boolean,
  points_awarded     numeric     not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create unique index if not exists ux_lms_assessment_answers_attempt_question
  on public.lms_assessment_answers (attempt_id, question_id);
create index if not exists ix_lms_assessment_answers_attempt  on public.lms_assessment_answers (attempt_id);
create index if not exists ix_lms_assessment_answers_question on public.lms_assessment_answers (question_id);

-- 2.3 Results (final summary per attempt) -----------------------------------
create table if not exists public.lms_assessment_results (
  id            uuid        primary key default gen_random_uuid(),
  school_id     uuid        references public.schools(id) on delete set null on update cascade,
  assessment_id uuid        not null references public.lms_assessments(id) on delete cascade,
  attempt_id    uuid        not null references public.lms_assessment_attempts(id) on delete cascade,
  student_id    uuid        not null references public.students(id) on delete cascade,
  score         numeric     not null default 0,
  percentage    numeric     not null default 0,
  passed        boolean     not null default false,
  feedback      text,
  graded_by     text,
  graded_at     timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create unique index if not exists ux_lms_assessment_results_attempt
  on public.lms_assessment_results (attempt_id);
create index if not exists ix_lms_assessment_results_assessment on public.lms_assessment_results (assessment_id);
create index if not exists ix_lms_assessment_results_student    on public.lms_assessment_results (student_id);

-- ============================================================================
-- 3. RECOGNITION — certificates
-- ============================================================================

-- 3.1 Certificate templates (per course) ------------------------------------
create table if not exists public.lms_certificates (
  id           uuid        primary key default gen_random_uuid(),
  school_id    uuid        references public.schools(id) on delete set null on update cascade,
  course_id    uuid        references public.lms_courses(id) on delete cascade,
  title        text        not null,
  description  text,
  template_url text,
  is_active    boolean     not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists ix_lms_certificates_course on public.lms_certificates (course_id);

-- 3.2 Certificates earned by students ---------------------------------------
create table if not exists public.lms_student_certificates (
  id              uuid        primary key default gen_random_uuid(),
  school_id       uuid        references public.schools(id) on delete set null on update cascade,
  certificate_id  uuid        references public.lms_certificates(id) on delete set null,
  student_id      uuid        not null references public.students(id) on delete cascade,
  course_id       uuid        references public.lms_courses(id) on delete set null,
  title           text,
  issued_at       timestamptz not null default now(),
  certificate_url text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create unique index if not exists ux_lms_student_certificates_student_course
  on public.lms_student_certificates (student_id, course_id);
create index if not exists ix_lms_student_certificates_student on public.lms_student_certificates (student_id);
create index if not exists ix_lms_student_certificates_course  on public.lms_student_certificates (course_id);

-- ============================================================================
-- 4. updated_at triggers (tables that carry updated_at)
-- ============================================================================
do $$
declare
  t text;
  lms_tables text[] := array[
    'lms_assessments', 'lms_assessment_questions', 'lms_question_options',
    'lms_assessment_attempts', 'lms_assessment_answers', 'lms_assessment_results',
    'lms_certificates', 'lms_student_certificates'
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
-- 5. Row Level Security (demo posture: permissive anon + authenticated CRUD)
--    TIGHTEN BEFORE PRODUCTION.
-- ============================================================================
do $$
declare
  t text;
  lms_tables text[] := array[
    'lms_assessments', 'lms_assessment_questions', 'lms_question_options',
    'lms_assessment_attempts', 'lms_assessment_answers', 'lms_assessment_results',
    'lms_certificates', 'lms_student_certificates'
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
-- 6. SEED — RBAC page-level permissions for assessment sub-pages + role grants.
--    The module-level 'LMS' view + course pages were seeded by 0702120000; this
--    adds the assessment/exam/authoring pages and (re)applies role grants so the
--    new permissions are picked up.
-- ============================================================================

-- 6a. Page-level action permissions -----------------------------------------
insert into public.security_permissions (module_key, page_key, action_key, label, sort_order) values
  ('LMS', 'assessments',      'view',   'Assessments Hub — View', 930),
  ('LMS', 'assessments',      'submit', 'Assessments Hub — Submit Attempt', 931),
  ('LMS', 'exams',            'view',   'Exam Center — View', 940),
  ('LMS', 'exams',            'submit', 'Exam Center — Take Exam', 941),
  ('LMS', 'question-builder', 'view',   'Question Builder — View', 950),
  ('LMS', 'question-builder', 'create', 'Question Builder — Create Assessment', 951),
  ('LMS', 'question-builder', 'edit',   'Question Builder — Edit / Grade', 952),
  ('LMS', 'question-builder', 'delete', 'Question Builder — Delete', 953),
  ('LMS', 'teacher-board',    'view',   'Teacher Board — View', 960)
on conflict (module_key, coalesce(page_key, ''), action_key) do nothing;

-- 6b. Role grants -----------------------------------------------------------
-- SUPER_ADMIN, TEACHER, PRINCIPAL, REGISTRAR → every LMS permission (authoring + view).
insert into public.security_role_permissions (role_id, permission_id, is_allowed)
select r.id, p.id, true
from public.security_roles r
join public.security_permissions p on p.module_key = 'LMS'
where r.code in ('SUPER_ADMIN', 'TEACHER', 'PRINCIPAL', 'REGISTRAR')
on conflict (role_id, permission_id) do nothing;

-- STUDENT → view + submit only (take assessments/exams; no authoring).
insert into public.security_role_permissions (role_id, permission_id, is_allowed)
select r.id, p.id, true
from public.security_roles r
join public.security_permissions p on p.module_key = 'LMS'
where r.code = 'STUDENT'
  and p.page_key in ('assessments', 'exams')
  and p.action_key in ('view', 'submit')
on conflict (role_id, permission_id) do nothing;

-- ============================================================================
-- 7. SEED — optional demo assessments + questions + certificate templates.
--    STSN only, guarded so it does NOT pollute production and skips if already
--    seeded. Attaches to the demo courses created by 0702120000.
-- ============================================================================
do $$
declare
  v_school_id uuid;
  v_course    uuid;
  v_quiz      uuid;
  v_exam      uuid;
  v_q         uuid;
begin
  select id into v_school_id from public.schools where code = 'STSN' limit 1;
  if v_school_id is null then
    return;
  end if;

  -- Skip if assessments already seeded for this school.
  if exists (select 1 from public.lms_assessments where school_id = v_school_id) then
    return;
  end if;

  -- Attach demo assessments to the first demo course (Algebra Basics).
  select id into v_course
    from public.lms_courses
    where school_id = v_school_id
    order by created_at
    limit 1;

  -- ── Quiz: Linear Equations (objective, auto-graded) ──────────────────────
  insert into public.lms_assessments
    (school_id, course_id, title, description, assessment_type, time_limit_minutes,
     passing_score, total_points, status, allow_retake, max_attempts, randomize_questions, created_by)
  values
    (v_school_id, v_course, 'Quiz: Linear Equations',
     'A short objective quiz on solving linear equations.',
     'Quiz', 15, 60, 3, 'Published', true, 3, false, 'System')
  returning id into v_quiz;

  -- Q1 — Multiple choice
  insert into public.lms_assessment_questions
    (school_id, assessment_id, question_text, question_type, points, question_order, explanation)
  values
    (v_school_id, v_quiz, 'Solve for x: 2x + 3 = 11', 'MultipleChoice', 1, 1,
     'Subtract 3 then divide by 2: x = 4.')
  returning id into v_q;
  insert into public.lms_question_options (question_id, option_text, is_correct, option_order) values
    (v_q, 'x = 2', false, 1),
    (v_q, 'x = 4', true,  2),
    (v_q, 'x = 5', false, 3),
    (v_q, 'x = 7', false, 4);

  -- Q2 — True / False
  insert into public.lms_assessment_questions
    (school_id, assessment_id, question_text, question_type, points, question_order, explanation)
  values
    (v_school_id, v_quiz, 'The slope of the line y = 3x + 1 is 3.', 'TrueFalse', 1, 2,
     'In y = mx + b, m (the slope) is 3.')
  returning id into v_q;
  insert into public.lms_question_options (question_id, option_text, is_correct, option_order) values
    (v_q, 'True',  true,  1),
    (v_q, 'False', false, 2);

  -- Q3 — Identification (auto-graded by normalized text match)
  insert into public.lms_assessment_questions
    (school_id, assessment_id, question_text, question_type, points, question_order, correct_answer, explanation)
  values
    (v_school_id, v_quiz, 'What is the y-intercept of y = 2x - 5? (number only)',
     'Identification', 1, 3, '-5', 'The y-intercept is b in y = mx + b, here -5.');

  -- ── Exam: Algebra Fundamentals (mixed, includes a subjective item) ───────
  insert into public.lms_assessments
    (school_id, course_id, title, description, assessment_type, time_limit_minutes,
     passing_score, total_points, status, allow_retake, max_attempts, randomize_questions, created_by)
  values
    (v_school_id, v_course, 'Midterm: Algebra Fundamentals',
     'Covers linear equations, slopes, and intercepts. Includes a written item.',
     'Exam', 60, 60, 3, 'Published', false, 1, true, 'System')
  returning id into v_exam;

  -- Q1 — Multiple choice
  insert into public.lms_assessment_questions
    (school_id, assessment_id, question_text, question_type, points, question_order, explanation)
  values
    (v_school_id, v_exam, 'Which point lies on the line y = x + 2?', 'MultipleChoice', 1, 1,
     '(1, 3): 3 = 1 + 2.')
  returning id into v_q;
  insert into public.lms_question_options (question_id, option_text, is_correct, option_order) values
    (v_q, '(0, 0)', false, 1),
    (v_q, '(1, 3)', true,  2),
    (v_q, '(2, 2)', false, 3),
    (v_q, '(3, 1)', false, 4);

  -- Q2 — Identification
  insert into public.lms_assessment_questions
    (school_id, assessment_id, question_text, question_type, points, question_order, correct_answer)
  values
    (v_school_id, v_exam, 'Solve for x: x - 7 = 0', 'Identification', 1, 2, '7');

  -- Q3 — Essay (flags the attempt for manual grading)
  insert into public.lms_assessment_questions
    (school_id, assessment_id, question_text, question_type, points, question_order)
  values
    (v_school_id, v_exam, 'Explain, in your own words, what the slope of a line represents.',
     'Essay', 1, 3);

  -- ── Certificate templates for the published demo courses ─────────────────
  insert into public.lms_certificates (school_id, course_id, title, description, created_by)
  select v_school_id, c.id,
         'Certificate of Completion — ' || c.title,
         'Awarded on successful completion of ' || c.title || '.',
         'System'
  from public.lms_courses c
  where c.school_id = v_school_id and c.status = 'Published';
end $$;

-- ============================================================================
-- 8. Comments
-- ============================================================================
comment on table public.lms_assessments is 'LMS assessments (quiz/exam/assignment/activity/project). course_id -> lms_courses(id).';
comment on table public.lms_assessment_questions is 'Questions per assessment. correct_answer used for Identification/ShortAnswer auto-grading.';
comment on table public.lms_question_options is 'Options for MultipleChoice/TrueFalse questions; is_correct drives auto-grading.';
comment on table public.lms_assessment_attempts is 'Per-student attempts. student_id -> students(id). Unique per (assessment, student, attempt_number).';
comment on table public.lms_assessment_answers is 'Per-question answers within an attempt. Objective items auto-graded on submit.';
comment on table public.lms_assessment_results is 'Final result summary per attempt (unique per attempt). Subjective items graded via the builder queue.';
comment on table public.lms_certificates is 'Certificate templates per course.';
comment on table public.lms_student_certificates is 'Certificates earned by students; auto-issued on pass when a course template exists.';

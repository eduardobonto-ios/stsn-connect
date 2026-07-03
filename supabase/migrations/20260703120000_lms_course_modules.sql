-- ============================================================================
-- STSN CONNECT — LMS course modules (lesson grouping)
-- Migration: 20260703120000_lms_course_modules.sql
-- ----------------------------------------------------------------------------
-- Adds the `lms_course_modules` table (listed in the LMS spec's Core LMS Tables
-- but not yet built) so a course's lessons can be grouped into ordered modules,
-- matching the reference Lesson Player ("Module 1 / Module 2") and enabling
-- sequential module unlocking in the UI.
--
-- Design notes / safety (mirrors 20260702120000_lms_module_schema.sql):
--   * Additive & idempotent: `create table if not exists`, `add column if not
--     exists`, `create index if not exists`, `on conflict do nothing`, and a
--     guarded backfill (skips courses that already have modules). Safe to re-run.
--   * lessons.module_id is nullable — lessons without a module render in a
--     default "Course Lessons" group, so nothing breaks for existing data.
--   * RLS follows the project's demo posture: permissive anon + authenticated.
--     TIGHTEN BEFORE PROD.
-- ============================================================================

-- ── 1. Table ────────────────────────────────────────────────────────────────
create table if not exists public.lms_course_modules (
  id           uuid        primary key default gen_random_uuid(),
  school_id    uuid        references public.schools(id) on delete set null on update cascade,
  course_id    uuid        not null references public.lms_courses(id) on delete cascade,
  title        text        not null,
  description  text,
  module_order integer     not null default 0,
  is_active    boolean     not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  created_by   text
);

create index if not exists ix_lms_course_modules_course on public.lms_course_modules (course_id);
create index if not exists ix_lms_course_modules_order  on public.lms_course_modules (course_id, module_order);

-- ── 2. Link lessons to a module (nullable) ──────────────────────────────────
alter table public.lms_course_lessons
  add column if not exists module_id uuid references public.lms_course_modules(id) on delete set null;

create index if not exists ix_lms_course_lessons_module on public.lms_course_lessons (module_id);

-- ── 3. updated_at trigger ───────────────────────────────────────────────────
drop trigger if exists trg_lms_course_modules_touch on public.lms_course_modules;
create trigger trg_lms_course_modules_touch
  before update on public.lms_course_modules
  for each row execute function public.lms_touch_updated_at();

-- ── 4. Row Level Security (demo posture) ────────────────────────────────────
alter table public.lms_course_modules enable row level security;
drop policy if exists lms_course_modules_all_anon_auth on public.lms_course_modules;
create policy lms_course_modules_all_anon_auth
  on public.lms_course_modules for all to anon, authenticated using (true) with check (true);

-- ── 5. SEED — group existing lessons into modules ───────────────────────────
-- For each course that has lessons but no modules yet: create two modules and
-- assign the highest-ordered lesson to "Advanced Concepts", the rest to
-- "Foundations". Guarded, so it neither double-seeds nor touches production
-- courses that already define their own modules.
do $$
declare
  r_course record;
  v_mod1   uuid;
  v_mod2   uuid;
begin
  for r_course in
    select c.id, c.school_id
    from public.lms_courses c
    where exists (select 1 from public.lms_course_lessons l where l.course_id = c.id)
      and not exists (select 1 from public.lms_course_modules m where m.course_id = c.id)
  loop
    insert into public.lms_course_modules (school_id, course_id, title, description, module_order, created_by)
      values (r_course.school_id, r_course.id, 'Module 1 — Foundations',
              'Core concepts and fundamentals to get you started.', 1, 'System')
      returning id into v_mod1;

    insert into public.lms_course_modules (school_id, course_id, title, description, module_order, created_by)
      values (r_course.school_id, r_course.id, 'Module 2 — Advanced Concepts',
              'Applied practice and deeper study.', 2, 'System')
      returning id into v_mod2;

    -- Highest lesson_order → Module 2; everything else → Module 1.
    update public.lms_course_lessons
      set module_id = v_mod2
      where course_id = r_course.id
        and lesson_order = (
          select max(lesson_order) from public.lms_course_lessons where course_id = r_course.id
        );

    update public.lms_course_lessons
      set module_id = v_mod1
      where course_id = r_course.id and module_id is null;
  end loop;
end $$;

-- ── 6. Comments ─────────────────────────────────────────────────────────────
comment on table public.lms_course_modules is 'Ordered groupings of lessons within a course (module_order). lms_course_lessons.module_id -> this table.';
comment on column public.lms_course_lessons.module_id is 'Optional module grouping. NULL lessons render in a default "Course Lessons" group.';

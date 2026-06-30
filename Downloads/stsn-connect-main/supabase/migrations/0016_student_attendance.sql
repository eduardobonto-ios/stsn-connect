-- ============================================================================
-- STSN Connect — Student Attendance
-- ============================================================================
-- FacultyPortalPage.tsx (Attendance tab) upserts to this table when a teacher
-- submits daily advisory-class attendance. The table was missing from all prior
-- migrations, causing the upsert to fail silently.
--
-- The UNIQUE (student_id, date) constraint matches the
-- `.upsert(records, { onConflict: "student_id,date" })` call in the page.
-- ============================================================================

create table if not exists public.student_attendance (
  id            uuid        primary key default gen_random_uuid(),
  legacy_id     text        unique,
  student_id    uuid        not null references public.students(id) on delete cascade,
  section       text,
  date          date        not null,
  status        text        not null default 'Present'
                            check (status in ('Present', 'Late', 'Absent')),
  recorded_by   uuid        references public.teachers(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (student_id, date)
);

create index if not exists idx_student_attendance_student  on public.student_attendance (student_id);
create index if not exists idx_student_attendance_date     on public.student_attendance (date);
create index if not exists idx_student_attendance_section  on public.student_attendance (section);

-- ── RLS (same permissive dev policy as all other tables) ─────────────────────
alter table public.student_attendance enable row level security;

create policy "student_attendance_select_anon_auth"
  on public.student_attendance for select to anon, authenticated using (true);

create policy "student_attendance_insert_anon_auth"
  on public.student_attendance for insert to anon, authenticated with check (true);

create policy "student_attendance_update_anon_auth"
  on public.student_attendance for update to anon, authenticated using (true) with check (true);

create policy "student_attendance_delete_anon_auth"
  on public.student_attendance for delete to anon, authenticated using (true);

-- ── Seed data — demo attendance for the advisory section (SY 2025-2026) ─────
-- Uses student legacy IDs from 0003_data.sql. Three consecutive school days
-- (Thu 2026-05-28, Fri 2026-05-29, Mon 2026-05-30) provide realistic data for
-- the Faculty Portal's Attendance tab without requiring a live submission.
-- Teacher: recorded_by = teacher with legacy_id 'teacher-santos' (from seed data).

do $$
declare
  v_teacher_id uuid;
  v_enrico_id  uuid;
  v_clara_id   uuid;
  v_miguel_id  uuid;
begin
  select id into v_teacher_id from public.teachers  where legacy_id = 'teacher-santos' limit 1;
  select id into v_enrico_id  from public.students  where legacy_id = 'stud-enrico'   limit 1;
  select id into v_clara_id   from public.students  where legacy_id = 'stud-clara'    limit 1;
  select id into v_miguel_id  from public.students  where legacy_id = 'stud-miguel'   limit 1;

  -- Only insert if students exist (guards against partial seed environments)
  if v_enrico_id is not null then
    insert into public.student_attendance (legacy_id, student_id, section, date, status, recorded_by) values
      ('att-enrico-0528', v_enrico_id, 'St. Thomas',  '2026-05-28', 'Present', v_teacher_id),
      ('att-enrico-0529', v_enrico_id, 'St. Thomas',  '2026-05-29', 'Late',    v_teacher_id),
      ('att-enrico-0530', v_enrico_id, 'St. Thomas',  '2026-05-30', 'Present', v_teacher_id)
    on conflict do nothing;
  end if;

  if v_clara_id is not null then
    insert into public.student_attendance (legacy_id, student_id, section, date, status, recorded_by) values
      ('att-clara-0528',  v_clara_id,  'St. Thomas',  '2026-05-28', 'Present', v_teacher_id),
      ('att-clara-0529',  v_clara_id,  'St. Thomas',  '2026-05-29', 'Present', v_teacher_id),
      ('att-clara-0530',  v_clara_id,  'St. Thomas',  '2026-05-30', 'Absent',  v_teacher_id)
    on conflict do nothing;
  end if;

  if v_miguel_id is not null then
    insert into public.student_attendance (legacy_id, student_id, section, date, status, recorded_by) values
      ('att-miguel-0528', v_miguel_id, 'St. Thomas',  '2026-05-28', 'Absent',  v_teacher_id),
      ('att-miguel-0529', v_miguel_id, 'St. Thomas',  '2026-05-29', 'Present', v_teacher_id),
      ('att-miguel-0530', v_miguel_id, 'St. Thomas',  '2026-05-30', 'Present', v_teacher_id)
    on conflict do nothing;
  end if;
end $$;

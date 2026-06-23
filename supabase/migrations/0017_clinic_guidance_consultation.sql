-- ============================================================================
-- STSN Connect — Nurse/Clinic, Guidance/Anecdotal, Consultation
-- ============================================================================
-- Creates tables for three new STSNModules identified as "Not Found" in the
-- Feature Implementation Audit:
--   NURSE_CLINIC  → clinic_visits, student_health_profiles
--   GUIDANCE      → anecdotal_records, guidance_sessions
--   CONSULTATION  → consultation_appointments
-- ============================================================================

-- ── 1. CLINIC VISITS ─────────────────────────────────────────────────────────
create table if not exists public.clinic_visits (
  id           uuid        primary key default gen_random_uuid(),
  legacy_id    text        unique,
  student_id   uuid        not null references public.students(id) on delete cascade,
  school_id    uuid        references public.schools(id) on delete set null,
  visit_date   date        not null default current_date,
  visit_time   time,
  chief_complaint text     not null,
  vital_signs  jsonb,        -- { temperature, blood_pressure, pulse_rate, etc. }
  action_taken text,
  disposition  text        not null default 'Released'
                            check (disposition in ('Released', 'Sent Home', 'Referred to Hospital', 'Observation', 'For Follow-up')),
  recorded_by  text,         -- staff name (denormalized for simplicity)
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_clinic_visits_student  on public.clinic_visits (student_id);
create index if not exists idx_clinic_visits_date     on public.clinic_visits (visit_date);

-- ── 2. STUDENT HEALTH PROFILES ───────────────────────────────────────────────
create table if not exists public.student_health_profiles (
  id                  uuid        primary key default gen_random_uuid(),
  legacy_id           text        unique,
  student_id          uuid        not null unique references public.students(id) on delete cascade,
  blood_type          text,
  allergies           text[],
  chronic_conditions  text[],
  emergency_contact   text,
  emergency_phone     text,
  physician_name      text,
  physician_phone     text,
  philhealth_no       text,
  notes               text,
  updated_by          text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_health_profiles_student on public.student_health_profiles (student_id);

-- ── 3. ANECDOTAL RECORDS ─────────────────────────────────────────────────────
create table if not exists public.anecdotal_records (
  id             uuid        primary key default gen_random_uuid(),
  legacy_id      text        unique,
  student_id     uuid        not null references public.students(id) on delete cascade,
  school_id      uuid        references public.schools(id) on delete set null,
  record_date    date        not null default current_date,
  incident_type  text        not null default 'Behavior'
                             check (incident_type in (
                               'Behavior', 'Academic', 'Attendance', 'Social',
                               'Commendation', 'Disciplinary', 'Other'
                             )),
  description    text        not null,
  action_taken   text,
  reported_by    text,       -- teacher/staff name
  follow_up_date date,
  follow_up_done boolean     not null default false,
  is_confidential boolean    not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_anecdotal_student on public.anecdotal_records (student_id);
create index if not exists idx_anecdotal_date    on public.anecdotal_records (record_date);

-- ── 4. GUIDANCE SESSIONS ─────────────────────────────────────────────────────
create table if not exists public.guidance_sessions (
  id              uuid        primary key default gen_random_uuid(),
  legacy_id       text        unique,
  student_id      uuid        not null references public.students(id) on delete cascade,
  school_id       uuid        references public.schools(id) on delete set null,
  session_date    date        not null default current_date,
  session_type    text        not null default 'Individual'
                              check (session_type in ('Individual', 'Group', 'Family', 'Crisis', 'Follow-up')),
  concern_area    text        not null default 'Academic'
                              check (concern_area in (
                                'Academic', 'Behavioral', 'Career', 'Personal/Social',
                                'Family', 'Peer Relationship', 'Crisis', 'Other'
                              )),
  summary         text        not null,
  recommendations text,
  next_session    date,
  counselor_name  text,
  is_confidential boolean     not null default true,
  status          text        not null default 'Completed'
                              check (status in ('Scheduled', 'Completed', 'Cancelled', 'No-show')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_guidance_sessions_student on public.guidance_sessions (student_id);
create index if not exists idx_guidance_sessions_date    on public.guidance_sessions (session_date);

-- ── 5. CONSULTATION APPOINTMENTS ─────────────────────────────────────────────
create table if not exists public.consultation_appointments (
  id              uuid        primary key default gen_random_uuid(),
  legacy_id       text        unique,
  school_id       uuid        references public.schools(id) on delete set null,
  student_id      uuid        references public.students(id) on delete cascade,
  teacher_id      uuid        references public.teachers(id) on delete set null,
  requested_by    text        not null,   -- student/parent/admin name
  requestor_role  text        not null default 'Parent'
                              check (requestor_role in ('Student', 'Parent', 'Teacher', 'Admin')),
  purpose         text        not null,
  appointment_date date,
  appointment_time time,
  venue           text,
  status          text        not null default 'Pending'
                              check (status in ('Pending', 'Confirmed', 'Completed', 'Cancelled', 'Rescheduled')),
  remarks         text,
  teacher_notes   text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_consult_student on public.consultation_appointments (student_id);
create index if not exists idx_consult_teacher on public.consultation_appointments (teacher_id);
create index if not exists idx_consult_date    on public.consultation_appointments (appointment_date);

-- ── RLS — same permissive dev policy for all five new tables ─────────────────
do $$
declare
  t text;
begin
  foreach t in array array[
    'clinic_visits', 'student_health_profiles',
    'anecdotal_records', 'guidance_sessions',
    'consultation_appointments'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (true)',
      t || '_select', t
    );
    execute format(
      'create policy %I on public.%I for insert to anon, authenticated with check (true)',
      t || '_insert', t
    );
    execute format(
      'create policy %I on public.%I for update to anon, authenticated using (true) with check (true)',
      t || '_update', t
    );
    execute format(
      'create policy %I on public.%I for delete to anon, authenticated using (true)',
      t || '_delete', t
    );
  end loop;
end $$;

-- ── Seed data ────────────────────────────────────────────────────────────────

do $$
declare
  v_stsn_id    uuid;
  v_cdsta_id   uuid;
  v_enrico_id  uuid;
  v_clara_id   uuid;
  v_miguel_id  uuid;
  v_teacher_id uuid;
begin
  select id into v_stsn_id   from public.schools  where code = 'STSN'          limit 1;
  select id into v_cdsta_id  from public.schools  where code = 'CDSTA'         limit 1;
  select id into v_enrico_id from public.students where legacy_id = 'stud-enrico' limit 1;
  select id into v_clara_id  from public.students where legacy_id = 'stud-clara'  limit 1;
  select id into v_miguel_id from public.students where legacy_id = 'stud-miguel' limit 1;
  select id into v_teacher_id from public.teachers where legacy_id = 'teacher-santos' limit 1;

  -- ── Clinic Visits ──────────────────────────────────────────────────────────
  if v_enrico_id is not null then
    insert into public.clinic_visits (legacy_id, student_id, school_id, visit_date, visit_time, chief_complaint, vital_signs, action_taken, disposition, recorded_by) values
      ('cv-001', v_enrico_id, v_stsn_id, '2026-05-10', '09:15:00', 'Headache and dizziness',
       '{"temperature": "37.2°C", "pulse_rate": "78 bpm", "blood_pressure": "110/70"}',
       'Rest advised; paracetamol 500mg administered.', 'Released', 'Nurse Reyes'),
      ('cv-002', v_enrico_id, v_stsn_id, '2026-05-22', '13:40:00', 'Stomach pain after lunch',
       '{"temperature": "36.8°C", "pulse_rate": "82 bpm"}',
       'Antacid given; advised to eat lighter meals.', 'Released', 'Nurse Reyes')
    on conflict do nothing;
  end if;

  if v_clara_id is not null then
    insert into public.clinic_visits (legacy_id, student_id, school_id, visit_date, visit_time, chief_complaint, vital_signs, action_taken, disposition, recorded_by) values
      ('cv-003', v_clara_id, v_stsn_id, '2026-05-15', '10:30:00', 'Allergic reaction — skin rash',
       '{"temperature": "37.0°C", "pulse_rate": "80 bpm"}',
       'Antihistamine applied; parents notified.', 'Sent Home', 'Nurse Reyes')
    on conflict do nothing;
  end if;

  -- ── Student Health Profiles ────────────────────────────────────────────────
  if v_enrico_id is not null then
    insert into public.student_health_profiles (legacy_id, student_id, blood_type, allergies, chronic_conditions, emergency_contact, emergency_phone, updated_by) values
      ('hp-001', v_enrico_id, 'O+', array['Dust', 'Pollen'], array[]::text[], 'Mr. Veloso Sr.', '+639171112222', 'Nurse Reyes')
    on conflict do nothing;
  end if;

  if v_clara_id is not null then
    insert into public.student_health_profiles (legacy_id, student_id, blood_type, allergies, chronic_conditions, emergency_contact, emergency_phone, updated_by) values
      ('hp-002', v_clara_id, 'A+', array['Shrimp', 'Nuts'], array[]::text[], 'Mrs. dela Cruz', '+639181234567', 'Nurse Reyes')
    on conflict do nothing;
  end if;

  -- ── Anecdotal Records ─────────────────────────────────────────────────────
  if v_enrico_id is not null then
    insert into public.anecdotal_records (legacy_id, student_id, school_id, record_date, incident_type, description, action_taken, reported_by, follow_up_date, follow_up_done) values
      ('ar-001', v_enrico_id, v_stsn_id, '2026-04-14', 'Behavior',
       'Student was observed disrupting class by talking loudly during lecture.',
       'Verbal warning issued. Student acknowledged the behavior.',
       'Ms. Santos', '2026-04-21', true),
      ('ar-002', v_enrico_id, v_stsn_id, '2026-05-05', 'Commendation',
       'Student demonstrated exceptional leadership during the Science Fair, assisting peers and presenting project clearly.',
       'Certificate of Commendation to be awarded at the next flag ceremony.',
       'Mr. Reyes', null, false)
    on conflict do nothing;
  end if;

  if v_miguel_id is not null then
    insert into public.anecdotal_records (legacy_id, student_id, school_id, record_date, incident_type, description, action_taken, reported_by, follow_up_date, follow_up_done) values
      ('ar-003', v_miguel_id, v_stsn_id, '2026-05-18', 'Attendance',
       'Student was absent 3 consecutive days without prior notice or medical certificate.',
       'Parents were contacted. Student to submit medical certificate upon return.',
       'Ms. Santos', '2026-05-25', false)
    on conflict do nothing;
  end if;

  -- ── Guidance Sessions ─────────────────────────────────────────────────────
  if v_enrico_id is not null then
    insert into public.guidance_sessions (legacy_id, student_id, school_id, session_date, session_type, concern_area, summary, recommendations, next_session, counselor_name, status) values
      ('gs-001', v_enrico_id, v_stsn_id, '2026-04-21', 'Individual', 'Behavioral',
       'Follow-up session on classroom behavior incident from April 14. Student expressed difficulty concentrating due to home situation.',
       'Referral to family counseling; teacher coordination for seating arrangement change.',
       '2026-05-12', 'Mrs. Valdez, Guidance Counselor', 'Completed'),
      ('gs-002', v_enrico_id, v_stsn_id, '2026-05-12', 'Individual', 'Academic',
       'Student concerned about upcoming board exams and grade standing.',
       'Study plan provided; peer-tutoring program enrollment recommended.',
       null, 'Mrs. Valdez, Guidance Counselor', 'Completed')
    on conflict do nothing;
  end if;

  if v_clara_id is not null then
    insert into public.guidance_sessions (legacy_id, student_id, school_id, session_date, session_type, concern_area, summary, recommendations, next_session, counselor_name, status) values
      ('gs-003', v_clara_id, v_stsn_id, '2026-06-02', 'Individual', 'Career',
       'Student is undecided between pursuing Law or Education after Senior High.',
       'Career aptitude assessment administered; follow-up to discuss results.',
       '2026-06-16', 'Mrs. Valdez, Guidance Counselor', 'Scheduled')
    on conflict do nothing;
  end if;

  -- ── Consultation Appointments ──────────────────────────────────────────────
  if v_enrico_id is not null and v_teacher_id is not null then
    insert into public.consultation_appointments (legacy_id, school_id, student_id, teacher_id, requested_by, requestor_role, purpose, appointment_date, appointment_time, venue, status, teacher_notes) values
      ('ca-001', v_stsn_id, v_enrico_id, v_teacher_id,
       'Mr. Veloso Sr.', 'Parent',
       'Academic performance and study habits consultation.',
       '2026-05-20', '14:00:00', 'Guidance Room 2 / Grade 11 Adviser Office',
       'Completed',
       'Parent was cooperative. Agreed on weekly progress check-in via class messenger group.'),
      ('ca-002', v_stsn_id, v_enrico_id, v_teacher_id,
       'Mr. Veloso Sr.', 'Parent',
       'Follow-up on 2nd Quarter grading concerns and attendance improvement.',
       '2026-06-10', '13:30:00', 'Guidance Room 2',
       'Confirmed', null)
    on conflict do nothing;
  end if;

  if v_clara_id is not null then
    insert into public.consultation_appointments (legacy_id, school_id, student_id, teacher_id, requested_by, requestor_role, purpose, appointment_date, appointment_time, venue, status) values
      ('ca-003', v_stsn_id, v_clara_id, v_teacher_id,
       'Clara dela Cruz', 'Student',
       'Request to discuss career path options with subject adviser before strand selection.',
       '2026-06-18', '11:00:00', 'Adviser Room — Science Wing',
       'Pending')
    on conflict do nothing;
  end if;
end $$;

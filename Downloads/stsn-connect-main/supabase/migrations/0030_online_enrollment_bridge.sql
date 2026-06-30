-- ============================================================================
-- STSN Connect - Online Enrollment Bridge
-- Supports public website enrollment submissions and Registrar review workflow.
-- ============================================================================

alter table public.students
  add column if not exists lrn text,
  add column if not exists created_via text not null default 'erp',
  add column if not exists source_metadata jsonb not null default '{}'::jsonb;

create unique index if not exists idx_students_lrn_unique
  on public.students (lrn)
  where lrn is not null and btrim(lrn) <> '';

create index if not exists idx_students_lrn_lookup
  on public.students (lrn);

create table if not exists public.online_enrollment_applications (
  id uuid primary key default gen_random_uuid(),
  reference_no text not null unique default ('OE-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  student_id uuid references public.students(id) on delete set null on update cascade,
  enrollment_id uuid,
  school_id uuid references public.schools(id) on delete set null on update cascade,
  enrollment_type text not null check (enrollment_type in ('New Student','Continuing Student','Old Student','Transferee','Returnee')),
  lrn text,
  school_year text not null,
  semester text,
  grade_level_applying_for text,
  strand_or_track text,
  previous_school text,
  previous_school_address text,
  first_name text,
  last_name text,
  middle_name text,
  birth_date text,
  gender text,
  email text,
  contact_no text,
  complete_address text,
  barangay text,
  city_municipality text,
  province text,
  zip_code text,
  guardian_name text,
  guardian_relationship text,
  guardian_contact_no text,
  guardian_email text,
  guardian_address text,
  status text not null default 'Pending Registrar Review'
    check (status in ('Pending Registrar Review','For Completion','Accepted','Rejected','Cancelled')),
  completion_status text not null default 'Incomplete'
    check (completion_status in ('Complete','Incomplete')),
  missing_fields text[] not null default '{}',
  payload jsonb not null default '{}'::jsonb,
  submitted_from text not null default 'stsn-website',
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.online_enrollment_applications
  add column if not exists semester text,
  add column if not exists birth_date text,
  add column if not exists gender text,
  add column if not exists complete_address text,
  add column if not exists barangay text,
  add column if not exists city_municipality text,
  add column if not exists province text,
  add column if not exists zip_code text,
  add column if not exists guardian_relationship text,
  add column if not exists guardian_email text,
  add column if not exists guardian_address text,
  add column if not exists payload jsonb not null default '{}'::jsonb;

create index if not exists idx_online_enrollment_applications_student
  on public.online_enrollment_applications (student_id);

create index if not exists idx_online_enrollment_applications_status
  on public.online_enrollment_applications (status);

create index if not exists idx_online_enrollment_applications_lrn
  on public.online_enrollment_applications (lrn);

create index if not exists idx_online_enrollment_applications_submitted_at
  on public.online_enrollment_applications (submitted_at desc);

alter table public.enrollments
  add column if not exists enrollment_source text not null default 'ERP'
    check (enrollment_source in ('ERP','Online','Walk-in','Import')),
  add column if not exists is_online_enrollment boolean not null default false,
  add column if not exists online_application_id uuid references public.online_enrollment_applications(id) on delete set null on update cascade,
  add column if not exists completion_status text not null default 'Complete'
    check (completion_status in ('Complete','Incomplete')),
  add column if not exists missing_fields text[] not null default '{}',
  add column if not exists source_metadata jsonb not null default '{}'::jsonb;

create index if not exists idx_enrollments_source
  on public.enrollments (enrollment_source, is_online_enrollment);

create index if not exists idx_enrollments_online_application
  on public.enrollments (online_application_id);

create sequence if not exists public.online_student_no_seq start with 1;

create or replace function public.generate_online_student_no(p_school_year text default '2026-2027')
returns text
language plpgsql
as $$
declare
  v_year text := split_part(coalesce(nullif(p_school_year, ''), '2026-2027'), '-', 1);
  v_next bigint;
begin
  v_next := nextval('public.online_student_no_seq');
  return 'ONLINE-' || v_year || '-' || lpad(v_next::text, 6, '0');
end;
$$;

create or replace function public.lookup_online_student_by_lrn(p_lrn text)
returns table (
  student_id uuid,
  lrn text,
  student_no text,
  first_name text,
  last_name text,
  middle_name text,
  year_level text,
  track_or_course text,
  enrollment_status text
)
language sql
security definer
set search_path = public
as $$
  select
    s.id,
    s.lrn,
    s.student_no,
    s.first_name,
    s.last_name,
    s.middle_name,
    s.year_level,
    s.track_or_course,
    s.enrollment_status
  from public.students s
  where s.lrn = btrim(p_lrn)
    and coalesce(s.enrollment_status, '') <> 'Rejected'
  limit 1;
$$;

grant execute on function public.lookup_online_student_by_lrn(text) to anon, authenticated;

create or replace function public.submit_online_enrollment(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id uuid;
  v_application_id uuid;
  v_enrollment_id uuid;
  v_reference_no text;
  v_enrollment_type text := coalesce(nullif(p_payload->>'enrollmentType', ''), 'New Student');
  v_erp_enrollment_type text;
  v_lrn text := nullif(btrim(coalesce(p_payload->>'lrn', '')), '');
  v_first_name text := nullif(btrim(coalesce(p_payload->>'firstName', '')), '');
  v_last_name text := nullif(btrim(coalesce(p_payload->>'lastName', '')), '');
  v_middle_name text := nullif(btrim(coalesce(p_payload->>'middleName', '')), '');
  v_birth_date text := nullif(btrim(coalesce(p_payload->>'birthDate', '')), '');
  v_gender text := nullif(btrim(coalesce(p_payload->>'gender', '')), '');
  v_school_year text := coalesce(nullif(p_payload->>'schoolYear', ''), '2026-2027');
  v_semester text := coalesce(nullif(p_payload->>'semester', ''), 'N/A');
  v_grade_level text := nullif(btrim(coalesce(p_payload->>'gradeLevelApplyingFor', '')), '');
  v_strand_or_track text := nullif(btrim(coalesce(p_payload->>'strandOrTrack', '')), '');
  v_contact_no text := nullif(btrim(coalesce(p_payload->>'contactNo', '')), '');
  v_email text := nullif(btrim(coalesce(p_payload->>'email', '')), '');
  v_complete_address text := nullif(btrim(coalesce(p_payload->>'completeAddress', '')), '');
  v_barangay text := nullif(btrim(coalesce(p_payload->>'barangay', '')), '');
  v_city_municipality text := nullif(btrim(coalesce(p_payload->>'cityMunicipality', '')), '');
  v_province text := nullif(btrim(coalesce(p_payload->>'province', '')), '');
  v_zip_code text := nullif(btrim(coalesce(p_payload->>'zipCode', '')), '');
  v_previous_school text := nullif(btrim(coalesce(p_payload->>'previousSchool', '')), '');
  v_previous_school_address text := nullif(btrim(coalesce(p_payload->>'previousSchoolAddress', '')), '');
  v_guardian_name text := nullif(btrim(coalesce(p_payload->>'guardianName', '')), '');
  v_guardian_relationship text := nullif(btrim(coalesce(p_payload->>'guardianRelationship', '')), '');
  v_guardian_contact_no text := nullif(btrim(coalesce(p_payload->>'guardianContactNo', '')), '');
  v_guardian_email text := nullif(btrim(coalesce(p_payload->>'guardianEmail', '')), '');
  v_guardian_address text := nullif(btrim(coalesce(p_payload->>'guardianAddress', '')), '');
  v_missing text[] := '{}';
  v_completion text := 'Complete';
begin
  if v_enrollment_type = 'Continuing Student' then
    v_erp_enrollment_type := 'Old Student';
  elsif v_enrollment_type in ('New Student','Old Student','Transferee','Returnee') then
    v_erp_enrollment_type := v_enrollment_type;
  else
    raise exception 'Invalid enrollment type: %', v_enrollment_type;
  end if;

  if v_enrollment_type = 'Continuing Student' and v_lrn is null then
    raise exception 'LRN is required for continuing students.';
  end if;

  if v_enrollment_type = 'Continuing Student' and v_lrn is null then v_missing := array_append(v_missing, 'LRN'); end if;
  if v_first_name is null then v_missing := array_append(v_missing, 'First Name'); end if;
  if v_last_name is null then v_missing := array_append(v_missing, 'Last Name'); end if;
  if v_birth_date is null then v_missing := array_append(v_missing, 'Birthdate'); end if;
  if v_gender is null then v_missing := array_append(v_missing, 'Gender'); end if;
  if v_contact_no is null then v_missing := array_append(v_missing, 'Contact Number'); end if;
  if v_complete_address is null then v_missing := array_append(v_missing, 'Complete Address'); end if;
  if v_barangay is null then v_missing := array_append(v_missing, 'Barangay'); end if;
  if v_city_municipality is null then v_missing := array_append(v_missing, 'City/Municipality'); end if;
  if v_province is null then v_missing := array_append(v_missing, 'Province'); end if;
  if v_school_year is null then v_missing := array_append(v_missing, 'School Year'); end if;
  if v_grade_level is null then v_missing := array_append(v_missing, 'Grade/Level Applying For'); end if;
  if v_guardian_name is null then v_missing := array_append(v_missing, 'Guardian Name'); end if;
  if v_guardian_relationship is null then v_missing := array_append(v_missing, 'Guardian Relationship'); end if;
  if v_guardian_contact_no is null then v_missing := array_append(v_missing, 'Guardian Contact Number'); end if;

  if coalesce(array_length(v_missing, 1), 0) > 0 then
    v_completion := 'Incomplete';
  end if;

  if v_enrollment_type = 'Continuing Student' then
    select s.id into v_student_id from public.students s where s.lrn = v_lrn limit 1;
    if v_student_id is null then
      raise exception 'No ERP student record found for the provided LRN.';
    end if;

    update public.students
    set email = coalesce(v_email, email),
        contact_no = coalesce(v_contact_no, contact_no),
        source_metadata = coalesce(source_metadata, '{}'::jsonb) ||
          jsonb_build_object(
            'last_online_enrollment_from', coalesce(p_payload->>'submittedFrom', 'stsn-website'),
            'last_online_enrollment_at', now()
          ),
        updated_at = now()
    where id = v_student_id;
  else
    insert into public.students (
      student_no, lrn, first_name, last_name, middle_name, gender, birthday,
      department, year_level, track_or_course, email, contact_no, address,
      province, municipality, zip_code, enrollment_status, created_via,
      source_metadata
    ) values (
      public.generate_online_student_no(v_school_year), v_lrn,
      coalesce(v_first_name, 'For Completion'), coalesce(v_last_name, 'For Completion'),
      v_middle_name, v_gender, v_birth_date, 'Basic Education', v_grade_level,
      v_strand_or_track, v_email, v_contact_no, v_complete_address,
      v_province, v_city_municipality, v_zip_code, 'Pending', 'online',
      jsonb_build_object(
        'submitted_from', coalesce(p_payload->>'submittedFrom', 'stsn-website'),
        'barangay', v_barangay,
        'birthDate', v_birth_date,
        'payload', p_payload
      )
    )
    returning id into v_student_id;
  end if;

  insert into public.online_enrollment_applications (
    student_id, enrollment_type, lrn, school_year, semester,
    grade_level_applying_for, strand_or_track, previous_school,
    previous_school_address, first_name, last_name, middle_name, birth_date,
    gender, email, contact_no, complete_address, barangay, city_municipality,
    province, zip_code, guardian_name, guardian_relationship,
    guardian_contact_no, guardian_email, guardian_address, completion_status,
    missing_fields, payload, submitted_from
  ) values (
    v_student_id, v_enrollment_type, v_lrn, v_school_year, v_semester,
    v_grade_level, v_strand_or_track, v_previous_school,
    v_previous_school_address, v_first_name, v_last_name, v_middle_name,
    v_birth_date, v_gender, v_email, v_contact_no, v_complete_address,
    v_barangay, v_city_municipality, v_province, v_zip_code, v_guardian_name,
    v_guardian_relationship, v_guardian_contact_no, v_guardian_email,
    v_guardian_address, v_completion, v_missing, p_payload,
    coalesce(p_payload->>'submittedFrom', 'stsn-website')
  )
  returning id, reference_no into v_application_id, v_reference_no;

  insert into public.enrollments (
    student_id, school_year, semester, enrollment_type, status, submitted_at,
    enrollment_source, is_online_enrollment, online_application_id,
    completion_status, missing_fields, source_metadata
  ) values (
    v_student_id, v_school_year, v_semester, v_erp_enrollment_type, 'Pending',
    now(), 'Online', true, v_application_id, v_completion, v_missing,
    jsonb_build_object(
      'submitted_from', coalesce(p_payload->>'submittedFrom', 'stsn-website'),
      'online_application_payload', p_payload
    )
  )
  returning id into v_enrollment_id;

  update public.online_enrollment_applications
  set enrollment_id = v_enrollment_id,
      updated_at = now()
  where id = v_application_id;

  if v_guardian_name is not null then
    insert into public.student_guardians (
      student_id, guardian_name, relationship, contact_no, email, address, is_primary
    ) values (
      v_student_id, v_guardian_name, v_guardian_relationship,
      v_guardian_contact_no, v_guardian_email, v_guardian_address, true
    );
  end if;

  return jsonb_build_object(
    'applicationId', v_application_id,
    'enrollmentId', v_enrollment_id,
    'studentId', v_student_id,
    'referenceNo', v_reference_no,
    'completionStatus', v_completion,
    'missingFields', v_missing
  );
end;
$$;

grant execute on function public.submit_online_enrollment(jsonb) to anon, authenticated;

alter table public.online_enrollment_applications enable row level security;

drop policy if exists "online_enrollment_applications_insert_anon" on public.online_enrollment_applications;
create policy "online_enrollment_applications_insert_anon"
  on public.online_enrollment_applications
  for insert
  to anon, authenticated
  with check (submitted_from = 'stsn-website');

drop policy if exists "online_enrollment_applications_select_auth" on public.online_enrollment_applications;
create policy "online_enrollment_applications_select_auth"
  on public.online_enrollment_applications
  for select
  to authenticated
  using (true);

drop policy if exists "online_enrollment_applications_update_auth" on public.online_enrollment_applications;
create policy "online_enrollment_applications_update_auth"
  on public.online_enrollment_applications
  for update
  to authenticated
  using (true)
  with check (true);

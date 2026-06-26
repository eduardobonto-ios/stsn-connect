# STSN Connect / ERP — Online Enrollment Bridge Guide

Repository: `stsn-connect`  
Integration source: `stsn-website` online enrollment page  
Main inspected files:

- `supabase/migrations/0001_schema.sql`
- `supabase/migrations/0002_rls.sql`
- `src/lib/supabase.ts`
- `src/services/dataLoader.ts`
- `src/services/store.ts`
- `src/features/registrar/pages/RegistrarModulePage.tsx`
- `src/types/index.ts`
- `src/types/database.types.ts`

---

## Goal

Accept online enrollment submissions from the public `stsn-website` repository and make them flow through the existing ERP Registrar enrollment workflow.

The ERP must support:

1. Safe LRN lookup for Continuing Students.
2. Public website submission into ERP Supabase without exposing full student data.
3. Source tracking so Registrar can identify `Online` vs `Walk-in/ERP` enrollments.
4. Pending online enrollment records for Registrar review.
5. Backend validation of incomplete online submissions.
6. Registrar visibility of missing fields, submitted website payload, and online application reference number.
7. Existing assessment/enrollment workflow after Registrar review.

---

## Important architecture decision

The actual missing student/enrollment information should be collected on the `stsn-website` online enrollment UI.

The ERP should not expect the applicant/parent to manually input `missing_fields`.

Correct responsibility split:

| Area | Responsibility |
| --- | --- |
| `stsn-website` | Collect required student, address, academic, contact, and guardian fields from parent/student |
| `stsn-connect` / ERP | Validate submitted payload, create/link student, create Pending enrollment, track source and missing fields |
| `missing_fields` | Computed backend validation/tracking field only |
| Registrar UI | Shows incomplete records and missing fields for review/completion |

Important:

- The website should validate required fields before submit.
- The ERP should still recompute `missing_fields` as backend safety validation.
- `missing_fields` should not be a user-entered website form field.
- Online submissions must not be auto-approved.
- Online submissions must still follow the existing Registrar approval and assessment flow.

---

## Current ERP schema finding

The ERP already has:

- `public.students`
- `public.enrollments`
- `public.requirements`
- `public.assessments`
- `public.student_guardians`

The inspected schema does not clearly show:

- a dedicated `students.lrn` column;
- a dedicated online source flag on `enrollments`.

Because the source belongs to a specific enrollment transaction, the main source flag should be added to `public.enrollments`.

A student can enroll through different channels across different school years, so source tracking should not rely on `students` alone.

Recommended additions:

- `students.lrn`
- `students.created_via`
- `students.source_metadata`
- `enrollments.enrollment_source`
- `enrollments.is_online_enrollment`
- `enrollments.online_application_id`
- `enrollments.completion_status`
- `enrollments.missing_fields`
- `enrollments.source_metadata`
- `online_enrollment_applications` staging/audit table

---

## Required migration

Create a new migration file:

```text
supabase/migrations/0020_online_enrollment_bridge.sql
```

Use this as the implementation baseline. Adjust only if the existing live database already has equivalent columns.

Important update from the website requirements:

The website enrollment UI is expected to collect additional ERP-required fields such as:

- birthdate
- gender
- contact number
- email
- complete address
- barangay
- city/municipality
- province
- ZIP code
- school year
- grade/level applying for
- strand/track if applicable
- previous school
- previous school address
- guardian name
- guardian relationship
- guardian contact number
- guardian email
- guardian address

Because the current ERP schema may not have dedicated columns for every field, the bridge should:

1. Store commonly needed review fields in `online_enrollment_applications`.
2. Store the complete submitted website payload in `online_enrollment_applications.payload`.
3. Map only safe/existing student fields directly into `students`.
4. Use `missing_fields` as computed validation output.

---

## Migration baseline

```sql
-- ============================================================================
-- STSN Connect - Online Enrollment Bridge
-- Supports public website enrollment submissions and Registrar review workflow.
-- ============================================================================

-- 1. Student lookup/source support.
alter table public.students
  add column if not exists lrn text,
  add column if not exists created_via text not null default 'erp',
  add column if not exists source_metadata jsonb not null default '{}'::jsonb;

create unique index if not exists idx_students_lrn_unique
  on public.students (lrn)
  where lrn is not null and btrim(lrn) <> '';

create index if not exists idx_students_lrn_lookup
  on public.students (lrn);

-- 2. Online application staging/audit table.
create table if not exists public.online_enrollment_applications (
  id uuid primary key default gen_random_uuid(),
  reference_no text not null unique default ('OE-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),

  student_id uuid references public.students(id) on delete set null on update cascade,
  enrollment_id uuid,
  school_id uuid references public.schools(id) on delete set null on update cascade,

  -- Enrollment classification
  enrollment_type text not null check (enrollment_type in ('New Student','Continuing Student','Old Student','Transferee','Returnee')),
  lrn text,
  school_year text not null,
  semester text,
  grade_level_applying_for text,
  strand_or_track text,

  -- Previous school details
  previous_school text,
  previous_school_address text,

  -- Student identity/details from website
  first_name text,
  last_name text,
  middle_name text,
  birth_date text,
  gender text,

  -- Contact details from website
  email text,
  contact_no text,

  -- Address details from website
  complete_address text,
  barangay text,
  city_municipality text,
  province text,
  zip_code text,

  -- Guardian/parent details from website
  guardian_name text,
  guardian_relationship text,
  guardian_contact_no text,
  guardian_email text,
  guardian_address text,

  -- Workflow/review fields
  status text not null default 'Pending Registrar Review'
    check (status in ('Pending Registrar Review','For Completion','Accepted','Rejected','Cancelled')),
  completion_status text not null default 'Incomplete'
    check (completion_status in ('Complete','Incomplete')),
  missing_fields text[] not null default '{}',

  -- Always preserve the full website payload for audit/review.
  payload jsonb not null default '{}'::jsonb,

  submitted_from text not null default 'stsn-website',
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- If an older draft version of the bridge table already exists, add the expanded website fields safely.
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
  add column if not exists guardian_address text;

create index if not exists idx_online_enrollment_applications_student
  on public.online_enrollment_applications (student_id);

create index if not exists idx_online_enrollment_applications_status
  on public.online_enrollment_applications (status);

create index if not exists idx_online_enrollment_applications_lrn
  on public.online_enrollment_applications (lrn);

create index if not exists idx_online_enrollment_applications_submitted_at
  on public.online_enrollment_applications (submitted_at desc);

-- 3. Enrollment source tracking.
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

-- 4. Temporary online student number generator for public submissions.
-- Registrar may later replace this with the final official student number if needed.
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

-- 5. Public-safe LRN lookup RPC.
-- Returns only the fields needed by the website to auto-fill the enrollment form.
-- Do not expose the full students table to the public website.
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
    s.id as student_id,
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

-- 6. Public-safe online enrollment submit RPC.
-- This keeps the website from directly writing several ERP tables.
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

  -- Continuing Student requires LRN and must link to an existing ERP student.
  if v_enrollment_type = 'Continuing Student' and v_lrn is null then
    raise exception 'LRN is required for continuing students.';
  end if;

  -- Backend safety validation.
  -- Website should already block missing required fields, but ERP still recomputes these.
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
    select s.id into v_student_id
    from public.students s
    where s.lrn = v_lrn
    limit 1;

    if v_student_id is null then
      raise exception 'No ERP student record found for the provided LRN.';
    end if;

    -- Update only safe contact/source fields.
    -- Do not overwrite existing ERP values with blanks.
    update public.students
    set
      email = coalesce(v_email, email),
      contact_no = coalesce(v_contact_no, contact_no),
      source_metadata = coalesce(source_metadata, '{}'::jsonb) ||
        jsonb_build_object(
          'last_online_enrollment_from', coalesce(p_payload->>'submittedFrom', 'stsn-website'),
          'last_online_enrollment_at', now()
        ),
      updated_at = now()
    where id = v_student_id;
  else
    -- New online student gets a temporary online student number.
    -- Registrar can later replace/confirm official student number if needed.
    insert into public.students (
      student_no,
      lrn,
      first_name,
      last_name,
      middle_name,
      gender,
      department,
      year_level,
      track_or_course,
      email,
      contact_no,
      enrollment_status,
      created_via,
      source_metadata
    ) values (
      public.generate_online_student_no(v_school_year),
      v_lrn,
      coalesce(v_first_name, 'For Completion'),
      coalesce(v_last_name, 'For Completion'),
      v_middle_name,
      v_gender,
      'Basic Education',
      v_grade_level,
      v_strand_or_track,
      v_email,
      v_contact_no,
      'Pending',
      'online',
      jsonb_build_object(
        'submitted_from', coalesce(p_payload->>'submittedFrom', 'stsn-website'),
        'birthDate', v_birth_date,
        'completeAddress', v_complete_address,
        'barangay', v_barangay,
        'cityMunicipality', v_city_municipality,
        'province', v_province,
        'zipCode', v_zip_code
      )
    )
    returning id into v_student_id;
  end if;

  insert into public.online_enrollment_applications (
    student_id,
    enrollment_type,
    lrn,
    school_year,
    semester,
    grade_level_applying_for,
    strand_or_track,
    previous_school,
    previous_school_address,
    first_name,
    last_name,
    middle_name,
    birth_date,
    gender,
    email,
    contact_no,
    complete_address,
    barangay,
    city_municipality,
    province,
    zip_code,
    guardian_name,
    guardian_relationship,
    guardian_contact_no,
    guardian_email,
    guardian_address,
    completion_status,
    missing_fields,
    payload,
    submitted_from
  ) values (
    v_student_id,
    v_enrollment_type,
    v_lrn,
    v_school_year,
    v_semester,
    v_grade_level,
    v_strand_or_track,
    v_previous_school,
    v_previous_school_address,
    v_first_name,
    v_last_name,
    v_middle_name,
    v_birth_date,
    v_gender,
    v_email,
    v_contact_no,
    v_complete_address,
    v_barangay,
    v_city_municipality,
    v_province,
    v_zip_code,
    v_guardian_name,
    v_guardian_relationship,
    v_guardian_contact_no,
    v_guardian_email,
    v_guardian_address,
    v_completion,
    v_missing,
    p_payload,
    coalesce(p_payload->>'submittedFrom', 'stsn-website')
  )
  returning id, reference_no into v_application_id, v_reference_no;

  insert into public.enrollments (
    student_id,
    school_year,
    semester,
    enrollment_type,
    status,
    submitted_at,
    enrollment_source,
    is_online_enrollment,
    online_application_id,
    completion_status,
    missing_fields,
    source_metadata
  ) values (
    v_student_id,
    v_school_year,
    v_semester,
    v_erp_enrollment_type,
    'Pending',
    now(),
    'Online',
    true,
    v_application_id,
    v_completion,
    v_missing,
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
      student_id,
      guardian_name,
      contact_no,
      is_primary
    ) values (
      v_student_id,
      v_guardian_name,
      v_guardian_contact_no,
      true
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

-- 7. RLS for the new table.
-- Public users should submit through RPC, while ERP authenticated users can review.
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
```

---

## Important migration notes

1. Keep `online_enrollment_applications.payload` even if many fields are also stored in columns.
   - This preserves the complete website submission.
   - This helps future Registrar review and debugging.

2. Do not add every website field directly to `students` unless the ERP already has those columns or the Registrar module requires them there.
   - Store extra website-only details in the staging table and `payload` first.
   - Map them into core ERP tables later through Registrar review if needed.

3. Do not allow the public website to write directly into multiple ERP tables.
   - Use `submit_online_enrollment(p_payload jsonb)`.

4. Do not expose full student records publicly.
   - Use `lookup_online_student_by_lrn(p_lrn text)` only.

---

## ERP code updates

### 1. Update `src/types/index.ts`

Add optional fields only. Do not break existing pages.

```ts
export interface Student {
  // existing fields...
  lrn?: string;
  createdVia?: "erp" | "online" | "import";
  sourceMetadata?: Record<string, unknown>;
}

export interface Enrollment {
  // existing fields...
  enrollmentSource?: "ERP" | "Online" | "Walk-in" | "Import";
  isOnlineEnrollment?: boolean;
  onlineApplicationId?: string;
  completionStatus?: "Complete" | "Incomplete";
  missingFields?: string[];
  sourceMetadata?: Record<string, unknown>;
}

export interface OnlineEnrollmentApplication {
  id: string;
  referenceNo: string;
  studentId?: string;
  enrollmentId?: string;

  enrollmentType: string;
  lrn?: string;
  schoolYear: string;
  semester?: string;
  gradeLevelApplyingFor?: string;
  strandOrTrack?: string;

  previousSchool?: string;
  previousSchoolAddress?: string;

  firstName?: string;
  lastName?: string;
  middleName?: string;
  birthDate?: string;
  gender?: string;

  email?: string;
  contactNo?: string;

  completeAddress?: string;
  barangay?: string;
  cityMunicipality?: string;
  province?: string;
  zipCode?: string;

  guardianName?: string;
  guardianRelationship?: string;
  guardianContactNo?: string;
  guardianEmail?: string;
  guardianAddress?: string;

  status: "Pending Registrar Review" | "For Completion" | "Accepted" | "Rejected" | "Cancelled";
  completionStatus: "Complete" | "Incomplete";
  missingFields: string[];
  submittedFrom: string;
  submittedAt: string;
  payload?: Record<string, unknown>;
}
```

---

### 2. Update `src/types/database.types.ts`

Add the new database fields for documentation/type reference.

For `StudentsRow`, add:

- `lrn`
- `created_via`
- `source_metadata`

For `EnrollmentsRow`, add:

- `enrollment_source`
- `is_online_enrollment`
- `online_application_id`
- `completion_status`
- `missing_fields`
- `source_metadata`

Add new database types:

- `OnlineEnrollmentApplicationsRow`
- `OnlineEnrollmentApplicationsInsert`
- `OnlineEnrollmentApplicationsUpdate`

Include the expanded online application fields:

- `semester`
- `birth_date`
- `gender`
- `complete_address`
- `barangay`
- `city_municipality`
- `province`
- `zip_code`
- `guardian_relationship`
- `guardian_email`
- `guardian_address`
- `payload`

If the project supports Supabase type generation, regenerate instead of manually editing.

---

### 3. Update `src/services/dataLoader.ts`

Map the new fields.

Students mapping:

```ts
lrn: s.lrn,
createdVia: s.created_via,
sourceMetadata: s.source_metadata ?? {},
```

Enrollments mapping:

```ts
enrollmentSource: e.enrollment_source,
isOnlineEnrollment: e.is_online_enrollment,
onlineApplicationId: e.online_application_id,
completionStatus: e.completion_status,
missingFields: e.missing_fields ?? [],
sourceMetadata: e.source_metadata ?? {},
```

Online enrollment application mapping:

```ts
{
  id: a.id,
  referenceNo: a.reference_no,
  studentId: a.student_id,
  enrollmentId: a.enrollment_id,
  enrollmentType: a.enrollment_type,
  lrn: a.lrn,
  schoolYear: a.school_year,
  semester: a.semester,
  gradeLevelApplyingFor: a.grade_level_applying_for,
  strandOrTrack: a.strand_or_track,
  previousSchool: a.previous_school,
  previousSchoolAddress: a.previous_school_address,
  firstName: a.first_name,
  lastName: a.last_name,
  middleName: a.middle_name,
  birthDate: a.birth_date,
  gender: a.gender,
  email: a.email,
  contactNo: a.contact_no,
  completeAddress: a.complete_address,
  barangay: a.barangay,
  cityMunicipality: a.city_municipality,
  province: a.province,
  zipCode: a.zip_code,
  guardianName: a.guardian_name,
  guardianRelationship: a.guardian_relationship,
  guardianContactNo: a.guardian_contact_no,
  guardianEmail: a.guardian_email,
  guardianAddress: a.guardian_address,
  status: a.status,
  completionStatus: a.completion_status,
  missingFields: a.missing_fields ?? [],
  submittedFrom: a.submitted_from,
  submittedAt: a.submitted_at,
  payload: a.payload ?? {},
}
```

Load `online_enrollment_applications` if the Registrar page needs a dedicated online enrollment queue or detail panel.

---

### 4. Update `src/services/store.ts`

When ERP users create enrollments internally, keep defaults:

```ts
enrollmentSource: "ERP",
isOnlineEnrollment: false,
completionStatus: "Complete",
missingFields: [],
```

When persisting a new enrollment, pass the new fields only if present so existing behavior does not break.

Do not change unrelated accounting, cashiering, grading, dashboard, or cashier workflow behavior.

---

### 5. Update `src/features/registrar/pages/RegistrarModulePage.tsx`

Add minimal UI behavior only.

Required UI changes:

1. Show a source badge on student/enrollment rows:
   - `Online` if `isOnlineEnrollment === true` or `enrollmentSource === "Online"`.
   - `ERP` or `Walk-in` otherwise.

2. Add filter option:
   - `All`
   - `Online`
   - `Walk-in/ERP`

3. For online incomplete records, show an `Incomplete` badge.

4. In the student/enrollment detail panel, show:
   - online application reference number;
   - submitted date;
   - completion status;
   - missing fields list;
   - previous school;
   - previous school address;
   - birthdate;
   - gender;
   - complete address;
   - barangay;
   - city/municipality;
   - province;
   - guardian name;
   - guardian relationship;
   - guardian contact;
   - guardian email, if available.

5. Keep the existing approval rule:
   - Enrollment approval must still be blocked if required documents are pending.

6. Do not auto-approve online submissions.

7. Do not redesign unrelated Registrar dashboard cards or reports.

---

## Expected ERP process

### New Student from website

1. Website submits the online enrollment payload.
2. ERP creates a `students` row with:
   - `created_via = 'online'`
   - `enrollment_status = 'Pending'`
   - temporary `student_no` generated as `ONLINE-YYYY-######`
3. ERP creates an `online_enrollment_applications` row.
4. ERP creates an `enrollments` row with:
   - `enrollment_source = 'Online'`
   - `is_online_enrollment = true`
   - `status = 'Pending'`
5. ERP computes `completion_status` and `missing_fields`.
6. Registrar reviews missing fields/documents.
7. Registrar completes student data and follows the existing assessment/enrollment workflow.

---

### Continuing Student from website

1. Website calls LRN lookup.
2. Existing ERP student is found by `students.lrn`.
3. Website auto-fills safe student fields.
4. Parent/student completes current enrollment/contact/guardian information.
5. Website submits enrollment payload.
6. ERP creates an `online_enrollment_applications` row.
7. ERP creates a new `enrollments` row linked to the existing student.
8. Registrar sees `Online` source and reviews completion/documents.

---

## Credit-efficient Claude prompt for `stsn-connect`

Use this prompt in the `stsn-connect` repository only:

```text
Task: Add/update the ERP-side online enrollment bridge for the public STSN website. Only implement the online enrollment bridge. Do not redesign unrelated modules and do not modify cashiering/accounting/grading behavior.

Read this file first:
- STSN_CONNECT_ONLINE_ENROLLMENT_INTEGRATION.md

Required changes:
1. Create or update the Supabase migration under supabase/migrations named 0020_online_enrollment_bridge.sql.
2. Add students.lrn and students.created_via/source_metadata if missing.
3. Add enrollment source tracking fields to enrollments:
   - enrollment_source
   - is_online_enrollment
   - online_application_id
   - completion_status
   - missing_fields
   - source_metadata
4. Create online_enrollment_applications as the staging/audit table for website submissions.
5. Include the expanded website-submitted fields in online_enrollment_applications:
   - semester
   - birth_date
   - gender
   - complete_address
   - barangay
   - city_municipality
   - province
   - zip_code
   - guardian_relationship
   - guardian_email
   - guardian_address
   - payload
6. Add safe RPCs:
   - lookup_online_student_by_lrn(p_lrn text)
   - submit_online_enrollment(p_payload jsonb)
7. The lookup RPC must only return minimal fields needed by the website form, not full student records.
8. The submit RPC must create/link student, create online_enrollment_applications, and create a Pending enrollment with enrollment_source='Online'.
9. Continuing Student from website must require LRN and link to existing students.lrn.
10. New Student must create a pending Basic Education student record with created_via='online'.
11. The ERP must recompute missing_fields from the submitted payload as backend validation/tracking only.
12. Do not create a website/user input called missing_fields. The actual missing information should be collected by stsn-website form fields.
13. Store the complete submitted payload in online_enrollment_applications.payload for Registrar review/audit.
14. Update src/types/index.ts and src/types/database.types.ts with additive optional fields only.
15. Update src/services/dataLoader.ts to map the new student/enrollment/online application fields.
16. Update src/services/store.ts so ERP-created enrollments default to enrollmentSource='ERP', isOnlineEnrollment=false, completionStatus='Complete'.
17. Update src/features/registrar/pages/RegistrarModulePage.tsx minimally to show Online source badge/filter and missing-fields information for online records.
18. In Registrar details, show expanded website submitted fields such as address, birthdate, gender, previous school, and guardian details.
19. Do not use or create a singular public.student table. Use the existing public.students table.
20. Do not hardcode Supabase credentials.
21. Do not auto-approve online submissions.
22. Do not change unrelated accounting, cashiering, grading, reports, or dashboard behavior.

Validation:
- npm run build or npm run lint must pass.
- Migration must run successfully.
- Existing Registrar enrollment flow must still work.
- Online records must appear as Pending and must not be auto-approved.
- Approval must still be blocked if required documents are pending.
- New Student website submit appears in ERP Registrar queue as Online + Pending.
- Continuing Student website submit links to an existing student by LRN.
```

---

## Manual verification checklist

Database:

- Migration runs successfully.
- `students.lrn` exists and has a partial unique index.
- `enrollments.enrollment_source` exists.
- `online_enrollment_applications` exists.
- Expanded online application fields exist:
  - `birth_date`
  - `gender`
  - `complete_address`
  - `barangay`
  - `city_municipality`
  - `province`
  - `zip_code`
  - `guardian_relationship`
  - `guardian_email`
  - `guardian_address`
  - `payload`
- `lookup_online_student_by_lrn` returns only minimal fields.
- `submit_online_enrollment` returns:
  - `referenceNo`
  - `applicationId`
  - `enrollmentId`
  - `studentId`
  - `completionStatus`
  - `missingFields`

ERP:

- `npm run lint` passes.
- `npm run build` passes.
- Registrar table shows online enrollment source.
- Online incomplete records show missing fields.
- Registrar can view online application reference number.
- Registrar can view expanded website-submitted details.
- Continuing student submission links to an existing student by LRN.
- New student submission creates a pending student/enrollment.
- Existing manual Registrar enrollment still creates normal ERP-source records.
- Online records are not auto-approved.
- Approval remains blocked when required documents are pending.

Website-to-ERP integration:

- New Student website submit appears in ERP Registrar queue.
- Continuing Student LRN lookup pre-fills the website form.
- Continuing Student website submit creates a new pending enrollment for the existing ERP student.
- Duplicate submit is prevented by the website busy state.

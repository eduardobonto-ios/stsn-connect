-- ============================================================================
-- STSN Connect - Online Enrollment Review Gate
-- ----------------------------------------------------------------------------
-- Website submissions now create Registrar-review applications first. Student,
-- enrollment, assessment, and official STSN number issuance happen inside
-- reviewed server workflows.
-- ============================================================================

alter table public.online_enrollment_applications
  add column if not exists review_notes text;

create or replace function public.normalize_basic_ed_year_level(p_level text)
returns text
language sql
stable
set search_path = public
as $$
  select case
    when p_level is null or btrim(p_level) = '' then null
    when lower(btrim(p_level)) in ('kinder i', 'kinder 1', 'kindergarten 1') then 'Kinder 1'
    when lower(btrim(p_level)) in ('kinder ii', 'kinder 2', 'kindergarten 2') then 'Kinder 2'
    else btrim(p_level)
  end
$$;

create or replace function public.next_basic_ed_year_level(p_current_level text)
returns text
language sql
stable
set search_path = public
as $$
  with normalized as (
    select public.normalize_basic_ed_year_level(p_current_level) as level_name
  ),
  current_level as (
    select si.sort_order
    from public.setup_items si
    join normalized n on lower(si.name) = lower(n.level_name)
    where si.category = 'year_levels'
      and si.is_active
      and coalesce(si.metadata->>'academicLevel', '') <> 'College'
    limit 1
  )
  select next_level.name
  from current_level c
  join public.setup_items next_level
    on next_level.category = 'year_levels'
   and next_level.is_active
   and coalesce(next_level.metadata->>'academicLevel', '') <> 'College'
   and next_level.sort_order > c.sort_order
  order by next_level.sort_order
  limit 1
$$;

drop function if exists public.lookup_online_student_by_identifier(text);
create function public.lookup_online_student_by_identifier(p_identifier text)
returns table (
  student_id uuid,
  lrn text,
  student_no text,
  first_name text,
  last_name text,
  middle_name text,
  year_level text,
  current_year_level text,
  next_year_level text,
  track_or_course text,
  enrollment_status text,
  requires_registrar_review boolean,
  review_note text
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
    coalesce(public.next_basic_ed_year_level(s.year_level), s.year_level) as year_level,
    s.year_level as current_year_level,
    public.next_basic_ed_year_level(s.year_level) as next_year_level,
    s.track_or_course,
    s.enrollment_status,
    public.next_basic_ed_year_level(s.year_level) is null as requires_registrar_review,
    case
      when public.next_basic_ed_year_level(s.year_level) is null
        then 'Registrar review required: no automatic next Basic Education level was found.'
      else null
    end as review_note
  from public.students s
  where (
      s.lrn = btrim(p_identifier)
      or lower(s.student_no) = lower(btrim(p_identifier))
    )
    and coalesce(s.enrollment_status, '') <> 'Rejected'
  order by s.updated_at desc nulls last
  limit 1
$$;

grant execute on function public.lookup_online_student_by_identifier(text) to anon, authenticated;

create or replace function public.generate_application_student_no(p_reference_no text)
returns text
language sql
volatile
set search_path = public
as $$
  select 'APP-' || upper(substr(regexp_replace(coalesce(p_reference_no, gen_random_uuid()::text), '[^a-zA-Z0-9]', '', 'g'), 1, 14))
$$;

create or replace function public.submit_online_enrollment(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id uuid;
  v_application_id uuid;
  v_reference_no text;
  v_school_id uuid;
  v_enrollment_type text := coalesce(nullif(p_payload->>'enrollmentType', ''), 'New Student');
  v_lrn text := nullif(btrim(coalesce(p_payload->>'lrn', '')), '');
  v_student_no text := nullif(btrim(coalesce(p_payload->>'studentNo', '')), '');
  v_first_name text := nullif(btrim(coalesce(p_payload->>'firstName', '')), '');
  v_last_name text := nullif(btrim(coalesce(p_payload->>'lastName', '')), '');
  v_middle_name text := nullif(btrim(coalesce(p_payload->>'middleName', '')), '');
  v_birth_date text := nullif(btrim(coalesce(p_payload->>'birthDate', '')), '');
  v_gender text := nullif(btrim(coalesce(p_payload->>'gender', '')), '');
  v_school_year text := replace(coalesce(nullif(p_payload->>'schoolYear', ''), '2026-2027'), '–', '-');
  v_semester text := coalesce(nullif(p_payload->>'semester', ''), 'N/A');
  v_grade_level text := public.normalize_basic_ed_year_level(nullif(btrim(coalesce(p_payload->>'gradeLevelApplyingFor', '')), ''));
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
  v_review_note text;
begin
  select id into v_school_id from public.schools where code = 'STSN' or legacy_id = 'STSN' limit 1;
  if v_school_id is null then raise exception 'STSN school is not configured.'; end if;

  if v_enrollment_type not in ('New Student','Continuing Student','Old Student','Transferee','Returnee') then
    raise exception 'Invalid enrollment type: %', v_enrollment_type;
  end if;

  if v_enrollment_type = 'Continuing Student' then
    v_student_id := nullif(p_payload->>'studentId', '')::uuid;
    if v_student_id is null then
      select s.id into v_student_id
      from public.students s
      where (v_lrn is not null and s.lrn = v_lrn)
         or (v_student_no is not null and lower(s.student_no) = lower(v_student_no))
      limit 1;
    end if;
    if v_student_id is null then
      raise exception 'No ERP student record found for the provided LRN or Student Number.';
    end if;
  end if;

  if v_enrollment_type = 'Continuing Student' and v_lrn is null and v_student_no is null then
    v_missing := array_append(v_missing, 'LRN or Student Number');
  end if;
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

  if v_enrollment_type = 'Continuing Student'
     and (p_payload->>'requiresRegistrarReview')::boolean is true then
    v_review_note := coalesce(
      nullif(p_payload->>'reviewNote', ''),
      'Registrar review required for continuing student placement.'
    );
  end if;

  insert into public.online_enrollment_applications (
    student_id, school_id, enrollment_type, lrn, school_year, semester,
    grade_level_applying_for, strand_or_track, previous_school,
    previous_school_address, first_name, last_name, middle_name, birth_date,
    gender, email, contact_no, complete_address, barangay, city_municipality,
    province, zip_code, guardian_name, guardian_relationship,
    guardian_contact_no, guardian_email, guardian_address, completion_status,
    missing_fields, payload, submitted_from, review_notes
  ) values (
    v_student_id, v_school_id, v_enrollment_type, v_lrn, v_school_year, v_semester,
    v_grade_level, v_strand_or_track, v_previous_school,
    v_previous_school_address, v_first_name, v_last_name, v_middle_name,
    v_birth_date, v_gender, v_email, v_contact_no, v_complete_address,
    v_barangay, v_city_municipality, v_province, v_zip_code, v_guardian_name,
    v_guardian_relationship, v_guardian_contact_no, v_guardian_email,
    v_guardian_address, v_completion, v_missing, p_payload,
    coalesce(p_payload->>'submittedFrom', 'stsn-website'), v_review_note
  )
  returning id, reference_no into v_application_id, v_reference_no;

  return jsonb_build_object(
    'applicationId', v_application_id,
    'referenceNo', v_reference_no,
    'studentId', v_student_id,
    'completionStatus', v_completion,
    'missingFields', v_missing
  );
end;
$$;

grant execute on function public.submit_online_enrollment(jsonb) to anon, authenticated;

create or replace function public.accept_online_enrollment_application(
  p_application_id uuid,
  p_actor text default 'Registrar'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_app public.online_enrollment_applications%rowtype;
  v_student public.students%rowtype;
  v_student_id uuid;
  v_enrollment public.enrollments%rowtype;
  v_assessment public.assessments%rowtype;
  v_enrollment_type text;
  v_tuition numeric := 18000;
  v_misc numeric := 4500;
  v_lab numeric := 3500;
  v_id_fee numeric := 1000;
  v_total numeric;
begin
  select * into v_app
  from public.online_enrollment_applications
  where id = p_application_id
  for update;
  if not found then raise exception 'Online enrollment application % was not found', p_application_id; end if;

  perform public.app_require_finance_writes_enabled();
  perform public.app_require_permission('REGISTRAR', 'enrollment', 'approve', v_app.school_id);

  if v_app.status = 'Rejected' or v_app.status = 'Cancelled' then
    raise exception 'Application % cannot be accepted from status %', v_app.reference_no, v_app.status;
  end if;

  if v_app.status = 'Accepted' and v_app.enrollment_id is not null then
    select * into v_enrollment
    from public.enrollments
    where id = v_app.enrollment_id;

    if v_app.student_id is not null then
      select * into v_student
      from public.students
      where id = v_app.student_id;
    end if;

    if v_enrollment.id is not null then
      select * into v_assessment
      from public.assessments
      where id = v_enrollment.assessment_id
         or enrollment_id = v_enrollment.id
      order by created_at desc
      limit 1;
    end if;

    return jsonb_build_object(
      'application', to_jsonb(v_app),
      'student', case when v_student.id is null then null else to_jsonb(v_student) end,
      'enrollment', case when v_enrollment.id is null then null else to_jsonb(v_enrollment) end,
      'assessment', case when v_assessment.id is null then null else to_jsonb(v_assessment) end
    );
  end if;

  v_enrollment_type := case
    when v_app.enrollment_type = 'Continuing Student' then 'Old Student'
    else v_app.enrollment_type
  end;

  if v_app.student_id is not null then
    select * into v_student from public.students where id = v_app.student_id for update;
  end if;

  if v_student.id is null then
    insert into public.students (
      school_id, student_no, lrn, first_name, last_name, middle_name, gender,
      birthday, civil_status, religion, nationality, email, contact_no,
      address, province, municipality, zip_code, department, year_level,
      track_or_course, section, enrollment_status, created_via, source_metadata
    ) values (
      v_app.school_id, public.generate_application_student_no(v_app.reference_no), v_app.lrn,
      coalesce(v_app.first_name, 'For Completion'),
      coalesce(v_app.last_name, 'For Completion'),
      v_app.middle_name, v_app.gender, nullif(v_app.birth_date, '')::date,
      'Single', 'Catholic', 'Filipino', v_app.email, v_app.contact_no,
      v_app.complete_address, v_app.province, v_app.city_municipality,
      v_app.zip_code, 'Basic Education',
      public.normalize_basic_ed_year_level(v_app.grade_level_applying_for),
      coalesce(nullif(v_app.strand_or_track, ''), 'Elementary'), '',
      'For Assessment', 'online',
      jsonb_build_object(
        'submitted_from', v_app.submitted_from,
        'online_application_id', v_app.id,
        'online_reference_no', v_app.reference_no,
        'provisional_student_no', true,
        'official_student_no_pending_initial_payment', true
      )
    )
    returning * into v_student;

    v_student_id := v_student.id;
  else
    v_student_id := v_student.id;
    update public.students
    set school_id = coalesce(school_id, v_app.school_id),
        lrn = coalesce(nullif(v_app.lrn, ''), lrn),
        email = coalesce(nullif(v_app.email, ''), email),
        contact_no = coalesce(nullif(v_app.contact_no, ''), contact_no),
        address = coalesce(nullif(v_app.complete_address, ''), address),
        province = coalesce(nullif(v_app.province, ''), province),
        municipality = coalesce(nullif(v_app.city_municipality, ''), municipality),
        zip_code = coalesce(nullif(v_app.zip_code, ''), zip_code),
        year_level = coalesce(public.normalize_basic_ed_year_level(v_app.grade_level_applying_for), year_level),
        track_or_course = coalesce(nullif(v_app.strand_or_track, ''), track_or_course),
        enrollment_status = 'For Assessment',
        source_metadata = coalesce(source_metadata, '{}'::jsonb) ||
          jsonb_build_object(
            'last_online_application_id', v_app.id,
            'last_online_reference_no', v_app.reference_no,
            'last_online_acceptance_at', now()
          ),
        updated_at = now()
    where id = v_student_id
    returning * into v_student;
  end if;

  if v_app.enrollment_id is not null then
    update public.enrollments
    set student_id = v_student_id,
        status = 'For Assessment',
        online_application_id = v_app.id,
        updated_at = now()
    where id = v_app.enrollment_id
    returning * into v_enrollment;
  else
    insert into public.enrollments (
      student_id, school_year, semester, enrollment_type, status, submitted_at,
      enrollment_source, is_online_enrollment, online_application_id,
      completion_status, missing_fields, source_metadata
    ) values (
      v_student_id, v_app.school_year, coalesce(v_app.semester, 'N/A'),
      v_enrollment_type, 'For Assessment', now(), 'Online', true, v_app.id,
      v_app.completion_status, v_app.missing_fields,
      jsonb_build_object(
        'submitted_from', v_app.submitted_from,
        'online_application_payload', v_app.payload,
        'online_reference_no', v_app.reference_no
      )
    )
    returning * into v_enrollment;
  end if;

  v_total := v_tuition + v_misc + v_lab + v_id_fee;
  insert into public.assessments (
    school_id, student_id, school_year, semester, enrollment_id,
    total_amount, discount_percentage, discount_amount, payment_term, balance,
    is_paid, books_availed, approval_status, submitted_by, submitted_date,
    registrar_remarks
  ) values (
    v_app.school_id, v_student_id, v_app.school_year, coalesce(v_app.semester, 'N/A'),
    v_enrollment.id, v_total, 0, 0, 'Installment - 4 Payments', v_total,
    false, false, 'Pending Accounting Approval', coalesce(public.app_current_user_name(), p_actor),
    current_date, 'Generated from online enrollment application ' || v_app.reference_no
  )
  returning * into v_assessment;

  insert into public.assessment_fees(assessment_id, fee_name, category, amount, quantity, unit_amount)
  values
    (v_assessment.id, 'Basic Education Tuition Fee', 'Tuition', v_tuition, 1, v_tuition),
    (v_assessment.id, 'Registration & Misc Fee', 'Miscellaneous', v_misc, 1, v_misc),
    (v_assessment.id, 'Computer Laboratory Fee', 'Laboratory', v_lab, 1, v_lab),
    (v_assessment.id, 'School ID / Facilities Fee', 'ID/Other', v_id_fee, 1, v_id_fee);

  update public.enrollments
  set assessment_id = v_assessment.id,
      updated_at = now()
  where id = v_enrollment.id
  returning * into v_enrollment;

  update public.online_enrollment_applications
  set student_id = v_student_id,
      enrollment_id = v_enrollment.id,
      status = 'Accepted',
      updated_at = now()
  where id = v_app.id
  returning * into v_app;

  if v_app.guardian_name is not null then
    insert into public.student_guardians (
      student_id, guardian_name, relationship, contact_no, email, address, is_primary
    )
    select v_student_id, v_app.guardian_name, v_app.guardian_relationship,
      v_app.guardian_contact_no, v_app.guardian_email, v_app.guardian_address, true
    where not exists (
      select 1
      from public.student_guardians g
      where g.student_id = v_student_id
        and lower(coalesce(g.guardian_name, '')) = lower(coalesce(v_app.guardian_name, ''))
    );
  end if;

  return jsonb_build_object(
    'application', to_jsonb(v_app),
    'student', to_jsonb(v_student),
    'enrollment', to_jsonb(v_enrollment),
    'assessment', to_jsonb(v_assessment)
  );
end;
$$;

grant execute on function public.accept_online_enrollment_application(uuid, text) to authenticated;

create or replace function public.issue_official_student_no_if_eligible(p_student_id uuid)
returns public.students
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student public.students%rowtype;
  v_school_year text;
  v_required numeric(15,2);
  v_paid numeric(15,2);
begin
  select * into v_student from public.students where id = p_student_id for update;
  if not found then return null; end if;

  if v_student.student_no !~ '^(APP|WEB|ONLINE)-' then
    return v_student;
  end if;

  select f.academic_year,
         coalesce((
           select s.amount
           from public.student_installment_standing s
           where s.invoice_id = f.invoice_id
           order by s.sequence_no
           limit 1
         ), 0.01),
         coalesce(f.allocated_amount, 0)
  into v_school_year, v_required, v_paid
  from public.student_invoice_financials f
  where f.student_id = p_student_id
    and f.status = 'Posted'
  order by f.invoice_id desc
  limit 1;

  if coalesce(v_paid, 0) < coalesce(v_required, 0.01) then
    return v_student;
  end if;

  update public.students
  set student_no = public.generate_student_no(left(coalesce(v_school_year, '2026-2027'), 4)),
      source_metadata = coalesce(source_metadata, '{}'::jsonb) ||
        jsonb_build_object(
          'official_student_no_issued_at', now(),
          'previous_provisional_student_no', v_student.student_no
        ),
      updated_at = now()
  where id = p_student_id
  returning * into v_student;

  return v_student;
end;
$$;

grant execute on function public.issue_official_student_no_if_eligible(uuid) to authenticated;

create or replace function public.post_student_receipt(
  p_school_id uuid,
  p_student_id uuid,
  p_amount numeric,
  p_payment_method text,
  p_receipt_no text,
  p_allocations jsonb default '[]'::jsonb,
  p_direct_collections jsonb default '[]'::jsonb,
  p_allow_unapplied_credit boolean default false,
  p_remarks text default null,
  p_posted_by text default 'System',
  p_idempotency_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_receipt public.student_receipts%rowtype;
  v_method public.student_payment_methods%rowtype;
  v_alloc_total numeric(15,2);
  v_direct_total numeric(15,2);
  v_unapplied numeric(15,2);
  v_journal uuid;
  v_line integer := 1;
  v_student public.students%rowtype;
  r record;
begin
  perform public.app_require_finance_writes_enabled();
  if jsonb_array_length(coalesce(p_direct_collections, '[]'::jsonb)) > 0 then
    perform public.app_require_permission(
      'CASHIER', 'other-payments', 'create', p_school_id
    );
  else
    perform public.app_require_permission('CASHIER', 'queue', 'create', p_school_id);
  end if;
  p_posted_by := coalesce(public.app_current_user_name(), p_posted_by);
  if p_amount is null or p_amount <= 0 then raise exception 'Receipt amount must be positive'; end if;
  if p_school_id is null or p_student_id is null then raise exception 'Receipt school and student are required'; end if;
  if nullif(btrim(coalesce(p_receipt_no, '')), '') is null then raise exception 'Official receipt number is required'; end if;
  if jsonb_typeof(p_allocations) <> 'array'
     or jsonb_typeof(p_direct_collections) <> 'array' then
    raise exception 'Receipt allocations and direct collections must be arrays';
  end if;

  if p_idempotency_key is not null then
    select * into v_receipt from public.student_receipts
    where idempotency_key = p_idempotency_key;
    if found then
      v_student := public.issue_official_student_no_if_eligible(v_receipt.student_id);
      return jsonb_build_object(
        'receipt', to_jsonb(v_receipt),
        'student', case when v_student.id is null then null else to_jsonb(v_student) end,
        'allocations', coalesce((
          select jsonb_agg(to_jsonb(a)) from public.student_receipt_allocations a
          where a.receipt_id = v_receipt.id
        ), '[]'::jsonb),
        'direct_collections', coalesce((
          select jsonb_agg(to_jsonb(d)) from public.student_direct_collection_lines d
          where d.receipt_id = v_receipt.id
        ), '[]'::jsonb)
      );
    end if;
  end if;

  select * into v_method from public.student_payment_methods
  where is_active
    and (lower(code) = lower(p_payment_method) or lower(name) = lower(p_payment_method));
  if not found then raise exception 'Payment method % is not configured', p_payment_method; end if;

  select coalesce(sum((x ->> 'amount')::numeric), 0)
  into v_alloc_total from jsonb_array_elements(p_allocations) x;
  select coalesce(sum((x ->> 'amount')::numeric), 0)
  into v_direct_total from jsonb_array_elements(p_direct_collections) x;
  v_unapplied := p_amount - v_alloc_total - v_direct_total;
  if v_alloc_total < 0 or v_direct_total < 0 or v_unapplied < 0 then
    raise exception 'Receipt applications exceed receipt amount';
  end if;
  if v_unapplied > 0 and not p_allow_unapplied_credit then
    raise exception 'Unapplied credit must be explicitly authorized';
  end if;

  for r in
    select f.*, (x ->> 'amount')::numeric(15,2) as requested_amount
    from jsonb_array_elements(p_allocations) x
    join public.student_invoice_financials f
      on f.invoice_id = (x ->> 'invoice_id')::uuid
  loop
    if r.student_id <> p_student_id or r.school_id <> p_school_id then
      raise exception 'Invoice % belongs to another student or school', r.invoice_id;
    end if;
    if r.status <> 'Posted' or r.requested_amount <= 0
       or r.requested_amount > r.balance then
      raise exception 'Invalid allocation for invoice %', r.invoice_id;
    end if;
  end loop;
  if (select count(*) from jsonb_array_elements(p_allocations))
     <> (select count(*) from jsonb_array_elements(p_allocations) x
         join public.student_invoice_financials f
           on f.invoice_id = (x ->> 'invoice_id')::uuid) then
    raise exception 'One or more receipt invoices were not found';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(p_allocations) x
    join public.student_invoice_financials f
      on f.invoice_id = (x ->> 'invoice_id')::uuid
    group by f.invoice_id, f.balance
    having sum((x ->> 'amount')::numeric) > f.balance
  ) then
    raise exception 'Combined allocations exceed an invoice balance';
  end if;

  insert into public.student_receipts(
    school_id, student_id, receipt_no, payment_method_id, amount,
    remarks, posted_by, idempotency_key, allow_unapplied_credit,
    unapplied_authorized_by
  ) values (
    p_school_id, p_student_id, btrim(p_receipt_no), v_method.id, p_amount,
    p_remarks, p_posted_by, p_idempotency_key, p_allow_unapplied_credit,
    case when p_allow_unapplied_credit then p_posted_by end
  ) returning * into v_receipt;

  insert into public.student_receipt_allocations(
    receipt_id, invoice_id, amount, source, idempotency_key, allocated_by
  )
  select v_receipt.id, (x ->> 'invoice_id')::uuid, (x ->> 'amount')::numeric,
    'Receipt', case when p_idempotency_key is null then null
      else p_idempotency_key || ':allocation:' || ordinality end,
    p_posted_by
  from jsonb_array_elements(p_allocations) with ordinality as a(x, ordinality);

  insert into public.student_direct_collection_lines(
    receipt_id, collection_category_id, amount, description
  )
  select v_receipt.id, c.id, (x ->> 'amount')::numeric, x ->> 'description'
  from jsonb_array_elements(p_direct_collections) x
  join public.student_collection_categories c
    on c.is_active and (
      lower(c.code) = lower(x ->> 'category')
      or lower(c.name) = lower(x ->> 'category')
    );
  if (select count(*) from jsonb_array_elements(p_direct_collections))
     <> (select count(*) from public.student_direct_collection_lines
         where receipt_id = v_receipt.id) then
    raise exception 'One or more direct collection categories were not found';
  end if;

  v_journal := public.student_finance_new_journal(
    current_date, p_school_id, v_receipt.receipt_no,
    'Student receipt ' || v_receipt.receipt_no, p_posted_by
  );
  insert into public.journal_entry_lines(
    journal_entry_id, line_no, account_code, debit_amount, credit_amount, description
  ) values (
    v_journal, v_line, v_method.cash_account_code, p_amount, 0, 'Cash received'
  );
  v_line := v_line + 1;
  if v_alloc_total > 0 then
    insert into public.journal_entry_lines(
      journal_entry_id, line_no, account_code, debit_amount, credit_amount, description
    ) values (v_journal, v_line, '1130', 0, v_alloc_total, 'Applied to student invoices');
    v_line := v_line + 1;
  end if;
  for r in
    select c.revenue_account_code, sum(d.amount)::numeric(15,2) as amount
    from public.student_direct_collection_lines d
    join public.student_collection_categories c on c.id = d.collection_category_id
    where d.receipt_id = v_receipt.id group by c.revenue_account_code
  loop
    insert into public.journal_entry_lines(
      journal_entry_id, line_no, account_code, debit_amount, credit_amount, description
    ) values (
      v_journal, v_line, r.revenue_account_code, 0, r.amount, 'Direct collection'
    );
    v_line := v_line + 1;
  end loop;
  if v_unapplied > 0 then
    insert into public.journal_entry_lines(
      journal_entry_id, line_no, account_code, debit_amount, credit_amount, description
    ) values (
      v_journal, v_line, '2150', 0, v_unapplied, 'Unapplied student credit'
    );
  end if;
  insert into public.student_receipt_journal_links(
    event_type, journal_entry_id, receipt_id
  ) values ('Receipt', v_journal, v_receipt.id);

  v_student := public.issue_official_student_no_if_eligible(p_student_id);

  return jsonb_build_object(
    'receipt', to_jsonb(v_receipt),
    'student', case when v_student.id is null then null else to_jsonb(v_student) end,
    'allocations', coalesce((
      select jsonb_agg(to_jsonb(a)) from public.student_receipt_allocations a
      where a.receipt_id = v_receipt.id
    ), '[]'::jsonb),
    'direct_collections', coalesce((
      select jsonb_agg(to_jsonb(d)) from public.student_direct_collection_lines d
      where d.receipt_id = v_receipt.id
    ), '[]'::jsonb),
    'unapplied_amount', v_unapplied
  );
end
$$;

create or replace function public.post_student_payment(
  p_student_id uuid,
  p_assessment_id uuid,
  p_school_id uuid,
  p_amount numeric,
  p_payment_method text,
  p_or_number text,
  p_term text,
  p_remarks text,
  p_transaction_type text default 'AR',
  p_payment_category text default null,
  p_posted_by text default 'System',
  p_idempotency_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invoice public.student_finance_invoices%rowtype;
  v_result jsonb;
  v_receipt jsonb;
  v_payment jsonb;
  v_fin public.student_invoice_financials%rowtype;
  v_enrollment public.enrollments%rowtype;
  v_student public.students%rowtype;
begin
  if p_transaction_type = 'AR' then
    select * into v_invoice from public.student_finance_invoices
    where assessment_id = p_assessment_id;
    if not found then raise exception 'Assessment has no finance invoice'; end if;
    v_result := public.post_student_receipt(
      p_school_id, p_student_id, p_amount, p_payment_method, p_or_number,
      jsonb_build_array(jsonb_build_object(
        'invoice_id', v_invoice.id, 'amount', p_amount
      )),
      '[]'::jsonb, false, p_remarks, p_posted_by, p_idempotency_key
    );
    select * into v_fin from public.student_invoice_financials
    where invoice_id = v_invoice.id;

    update public.enrollments
    set status = case when v_fin.balance = 0 then 'Enrolled' else 'Partially Paid' end,
        updated_at = now()
    where id = (select enrollment_id from public.assessments where id = p_assessment_id)
       or assessment_id = p_assessment_id
    returning * into v_enrollment;

    update public.students
    set enrollment_status = case when v_fin.balance = 0 then 'Enrolled' else 'Partially Paid' end,
        updated_at = now()
    where id = p_student_id
    returning * into v_student;

    v_student := public.issue_official_student_no_if_eligible(p_student_id);
  elsif p_transaction_type = 'OR' then
    v_result := public.post_student_receipt(
      p_school_id, p_student_id, p_amount, p_payment_method, p_or_number,
      '[]'::jsonb,
      jsonb_build_array(jsonb_build_object(
        'category', p_payment_category, 'amount', p_amount,
        'description', p_remarks
      )),
      false, p_remarks, p_posted_by, p_idempotency_key
    );
    v_student := public.issue_official_student_no_if_eligible(p_student_id);
  else
    raise exception 'Unsupported transaction type %', p_transaction_type;
  end if;

  v_receipt := v_result -> 'receipt';
  v_payment := jsonb_build_object(
    'id', v_receipt ->> 'id',
    'school_id', v_receipt ->> 'school_id',
    'student_id', v_receipt ->> 'student_id',
    'assessment_id', case when p_transaction_type = 'AR' then p_assessment_id end,
    'amount', (v_receipt ->> 'amount')::numeric,
    'payment_date', v_receipt ->> 'receipt_date',
    'payment_method', p_payment_method,
    'payment_method_id', v_receipt ->> 'payment_method_id',
    'or_number', v_receipt ->> 'receipt_no',
    'term', p_term,
    'remarks', p_remarks,
    'transaction_type', p_transaction_type,
    'payment_category', p_payment_category,
    'currency_code', v_receipt ->> 'currency_code',
    'status', v_receipt ->> 'status',
    'posted_by', v_receipt ->> 'posted_by',
    'posted_at', v_receipt ->> 'posted_at'
  );

  return v_result || jsonb_build_object(
    'payment', v_payment,
    'student', case when v_student.id is null then null else to_jsonb(v_student) end,
    'enrollment', case when v_enrollment.id is null then null else to_jsonb(v_enrollment) end,
    'assessment', case when v_invoice.id is null then null else
      (select to_jsonb(a) || jsonb_build_object(
        'total_amount', v_fin.gross_charges + v_fin.debit_adjustments,
        'discount_amount', v_fin.discount_amount,
        'balance', v_fin.balance,
        'is_paid', v_fin.is_paid
      ) from public.assessments a where a.id = v_invoice.assessment_id)
    end,
    'invoice_financials', case when v_invoice.id is null then null else to_jsonb(v_fin) end
  );
end
$$;

grant execute on function public.post_student_receipt(
  uuid, uuid, numeric, text, text, jsonb, jsonb, boolean, text, text, text
) to authenticated;

grant execute on function public.post_student_payment(
  uuid, uuid, uuid, numeric, text, text, text, text, text, text, text, text
) to authenticated;

-- Historical repair for website rows created before application-first intake.
with stsn_school as (
  select id from public.schools where code = 'STSN' or legacy_id = 'STSN' limit 1
),
website_students as (
  select s.*, e.id as existing_enrollment_id
  from public.students s
  left join lateral (
    select e.id
    from public.enrollments e
    where e.student_id = s.id
      and coalesce(e.is_online_enrollment, false)
    order by e.submitted_at desc
    limit 1
  ) e on true
  where s.created_via in ('website', 'online')
     or s.student_no like 'WEB-%'
     or s.student_no like 'ONLINE-%'
)
insert into public.online_enrollment_applications (
  student_id, enrollment_id, school_id, enrollment_type, lrn, school_year,
  semester, grade_level_applying_for, strand_or_track, first_name, last_name,
  middle_name, birth_date, gender, email, contact_no, complete_address,
  province, city_municipality, zip_code, status, completion_status,
  missing_fields, payload, submitted_from, submitted_at, review_notes
)
select
  ws.id, ws.existing_enrollment_id, coalesce(ws.school_id, stsn_school.id),
  coalesce(ws.source_metadata->>'enrollment_type', 'New Student'),
  ws.lrn,
  coalesce(ws.source_metadata->>'school_year', '2026-2027'),
  'N/A',
  ws.year_level,
  ws.track_or_course,
  ws.first_name,
  ws.last_name,
  ws.middle_name,
  ws.birthday::text,
  ws.gender,
  ws.email,
  ws.contact_no,
  ws.address,
  ws.province,
  ws.municipality,
  ws.zip_code,
  'Pending Registrar Review',
  'Complete',
  '{}',
  coalesce(ws.source_metadata, '{}'::jsonb),
  coalesce(ws.source_metadata->>'submitted_from', 'stsn-website'),
  coalesce((ws.source_metadata->>'submitted_at')::timestamptz, ws.created_at),
  'Backfilled from pre-review website submission.'
from website_students ws
cross join stsn_school
where not exists (
  select 1 from public.online_enrollment_applications app
  where app.student_id = ws.id
);

update public.students s
set school_id = coalesce(s.school_id, stsn_school.id),
    student_no = case
      when s.student_no like 'WEB-%' then 'APP-' || upper(substr(replace(s.id::text, '-', ''), 1, 14))
      when s.student_no like 'ONLINE-%' then 'APP-' || upper(substr(replace(s.id::text, '-', ''), 1, 14))
      else s.student_no
    end,
    created_via = case when s.created_via = 'website' then 'online' else s.created_via end,
    source_metadata = coalesce(s.source_metadata, '{}'::jsonb) ||
      jsonb_build_object(
        'historical_online_enrollment_repaired_at', now(),
        'provisional_student_no', s.student_no ~ '^(WEB|ONLINE)-'
      ),
    updated_at = now()
from (select id from public.schools where code = 'STSN' or legacy_id = 'STSN' limit 1) stsn_school
where s.created_via in ('website', 'online')
   or s.student_no like 'WEB-%'
   or s.student_no like 'ONLINE-%';

update public.enrollments e
set online_application_id = app.id,
    enrollment_source = 'Online',
    is_online_enrollment = true,
    updated_at = now()
from public.online_enrollment_applications app
where app.enrollment_id = e.id
  and e.online_application_id is null;

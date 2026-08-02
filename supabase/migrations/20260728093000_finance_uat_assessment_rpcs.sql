-- ============================================================================
-- STSN Connect — transactional assessment boundary for temporary finance UAT
--
-- The restored demo login uses public.users and every browser request reaches
-- PostgREST as `anon`. Keep direct assessment-fee writes closed and expose the
-- two workflow-level SECURITY DEFINER functions below instead.
--
-- SECURITY: execution by anon is temporary and suitable only for the demo/UAT
-- project. The caller identity is not trustworthy until real server-side auth
-- is introduced.
-- ============================================================================

begin;

do $$
begin
  perform pg_advisory_xact_lock(hashtext('stsn:finance-uat-assessment-rpcs'));
  if to_regprocedure('public.replace_draft_assessment_fees(uuid,jsonb)') is null
     or to_regprocedure('public.app_require_finance_writes_enabled()') is null then
    raise exception using
      message = 'finance UAT assessment RPCs require the production finance migration',
      hint = 'Apply 20260720120000_student_finance_production_posting.sql first.';
  end if;
end
$$;

create or replace function public.save_draft_student_assessment(
  p_assessment jsonb,
  p_fees jsonb default null,
  p_actor text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_existing public.assessments%rowtype;
  v_saved public.assessments%rowtype;
  v_school_id uuid;
  v_student_id uuid;
  v_discount_percentage numeric(8,4);
  v_discount_amount numeric(15,2);
begin
  perform public.app_require_finance_writes_enabled();

  if p_assessment is null or jsonb_typeof(p_assessment) <> 'object' then
    raise exception 'Assessment must be a JSON object';
  end if;

  begin
    v_id := nullif(p_assessment ->> 'id', '')::uuid;
  exception when invalid_text_representation then
    raise exception 'Assessment id must be a UUID';
  end;
  if v_id is null then raise exception 'Assessment id is required'; end if;

  select * into v_existing from public.assessments where id = v_id for update;

  if found then
    if v_existing.approval_status = 'Approved for Payment' then
      raise exception 'Approved assessments are immutable';
    end if;

    update public.assessments
    set payment_term = case when p_assessment ? 'payment_term' then nullif(p_assessment ->> 'payment_term', '') else payment_term end,
        discount_percentage = case when p_assessment ? 'discount_percentage' then coalesce((p_assessment ->> 'discount_percentage')::numeric, 0) else discount_percentage end,
        discount_amount = case when p_assessment ? 'discount_amount' then coalesce((p_assessment ->> 'discount_amount')::numeric, 0) else discount_amount end,
        scholarship_name = case when p_assessment ? 'scholarship_name' then nullif(p_assessment ->> 'scholarship_name', '') else scholarship_name end,
        books_availed = case when p_assessment ? 'books_availed' then coalesce((p_assessment ->> 'books_availed')::boolean, false) else books_availed end,
        book_package_id = case when p_assessment ? 'book_package_id' then nullif(p_assessment ->> 'book_package_id', '')::uuid else book_package_id end,
        approval_status = case
          when p_assessment ? 'approval_status' then p_assessment ->> 'approval_status'
          else approval_status
        end,
        submitted_by = case when p_assessment ? 'submitted_by' then nullif(p_assessment ->> 'submitted_by', '') else submitted_by end,
        submitted_date = case when p_assessment ? 'submitted_date' then nullif(p_assessment ->> 'submitted_date', '')::date else submitted_date end,
        registrar_remarks = case when p_assessment ? 'registrar_remarks' then nullif(p_assessment ->> 'registrar_remarks', '') else registrar_remarks end,
        updated_at = now()
    where id = v_id
    returning * into v_saved;
  else
    begin
      v_school_id := nullif(p_assessment ->> 'school_id', '')::uuid;
      v_student_id := nullif(p_assessment ->> 'student_id', '')::uuid;
    exception when invalid_text_representation then
      raise exception 'Assessment school_id and student_id must be UUIDs';
    end;
    if v_school_id is null or v_student_id is null or nullif(p_assessment ->> 'school_year', '') is null then
      raise exception 'New assessments require school_id, student_id, and school_year';
    end if;
    if not exists (
      select 1 from public.students s
      where s.id = v_student_id and s.school_id = v_school_id
    ) then
      raise exception 'Student does not belong to the assessment school';
    end if;

    insert into public.assessments(
      id, enrollment_id, school_id, student_id, school_year, semester,
      total_amount, discount_percentage, discount_amount, scholarship_name,
      payment_term, balance, is_paid, books_availed, book_package_id,
      approval_status, submitted_by, submitted_date, registrar_remarks
    ) values (
      v_id,
      nullif(p_assessment ->> 'enrollment_id', '')::uuid,
      v_school_id,
      v_student_id,
      p_assessment ->> 'school_year',
      nullif(p_assessment ->> 'semester', ''),
      0,
      coalesce((p_assessment ->> 'discount_percentage')::numeric, 0),
      coalesce((p_assessment ->> 'discount_amount')::numeric, 0),
      nullif(p_assessment ->> 'scholarship_name', ''),
      nullif(p_assessment ->> 'payment_term', ''),
      0,
      false,
      coalesce((p_assessment ->> 'books_availed')::boolean, false),
      nullif(p_assessment ->> 'book_package_id', '')::uuid,
      coalesce(nullif(p_assessment ->> 'approval_status', ''), 'Pending Accounting Approval'),
      coalesce(nullif(p_assessment ->> 'submitted_by', ''), nullif(p_actor, '')),
      coalesce(nullif(p_assessment ->> 'submitted_date', '')::date, current_date),
      nullif(p_assessment ->> 'registrar_remarks', '')
    ) returning * into v_saved;
  end if;

  if v_saved.approval_status not in ('Pending Accounting Approval', 'Returned to Registrar', 'Rejected') then
    raise exception 'Draft assessment status % cannot be saved through this function', v_saved.approval_status;
  end if;

  v_discount_percentage := coalesce(v_saved.discount_percentage, 0);
  v_discount_amount := coalesce(v_saved.discount_amount, 0);
  if v_discount_percentage < 0 or v_discount_percentage > 100 or v_discount_amount < 0 then
    raise exception 'Assessment discounts must be non-negative and percentage cannot exceed 100';
  end if;

  if p_fees is not null then
    if jsonb_typeof(p_fees) <> 'array' or jsonb_array_length(p_fees) = 0 then
      raise exception 'Assessment fees must be a non-empty JSON array';
    end if;
    if exists (
      select 1 from jsonb_array_elements(p_fees) fee
      where nullif(btrim(fee ->> 'fee_name'), '') is null
         or coalesce((fee ->> 'amount')::numeric, 0) <= 0
         or fee ->> 'category' not in ('Tuition', 'Miscellaneous', 'Laboratory', 'ID/Other', 'Books')
    ) then
      raise exception 'Every assessment fee requires a name, supported category, and positive amount';
    end if;
    perform public.replace_draft_assessment_fees(v_id, p_fees);
  end if;

  update public.assessments
  set balance = greatest(0, total_amount - discount_amount),
      is_paid = (total_amount - discount_amount <= 0),
      updated_at = now()
  where id = v_id
  returning * into v_saved;

  insert into public.assessment_audit_trail(assessment_id, action, performed_by, details)
  values (
    v_id,
    case when v_existing.id is null then 'DRAFT_CREATED' else 'DRAFT_UPDATED' end,
    coalesce(nullif(p_actor, ''), 'System'),
    case when v_existing.id is null then 'Draft assessment created through finance UAT RPC.' else 'Draft assessment updated through finance UAT RPC.' end
  );

  return to_jsonb(v_saved) || jsonb_build_object(
    'fees', coalesce((
      select jsonb_agg(jsonb_build_object(
        'fee_name', f.fee_name,
        'category', f.category,
        'amount', f.amount
      ) order by f.created_at, f.id)
      from public.assessment_fees f where f.assessment_id = v_id
    ), '[]'::jsonb)
  );
end
$$;

create or replace function public.submit_walk_in_enrollment(
  p_enrollment jsonb,
  p_subject_ids uuid[],
  p_assessment jsonb,
  p_fees jsonb,
  p_actor text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_enrollment_id uuid;
  v_student_id uuid;
  v_assessment_id uuid;
  v_enrollment public.enrollments%rowtype;
  v_assessment jsonb;
  v_missing_subjects integer;
begin
  perform public.app_require_finance_writes_enabled();
  if p_enrollment is null or jsonb_typeof(p_enrollment) <> 'object' then
    raise exception 'Enrollment must be a JSON object';
  end if;
  if p_assessment is null or jsonb_typeof(p_assessment) <> 'object' then
    raise exception 'Assessment must be a JSON object';
  end if;

  begin
    v_enrollment_id := nullif(p_enrollment ->> 'id', '')::uuid;
    v_student_id := nullif(p_enrollment ->> 'student_id', '')::uuid;
    v_assessment_id := nullif(p_assessment ->> 'id', '')::uuid;
  exception when invalid_text_representation then
    raise exception 'Enrollment, student, and assessment ids must be UUIDs';
  end;
  if v_enrollment_id is null or v_student_id is null or v_assessment_id is null then
    raise exception 'Enrollment, student, and assessment ids are required';
  end if;
  if nullif(p_enrollment ->> 'school_year', '') is null then
    raise exception 'School year is required';
  end if;
  if coalesce(cardinality(p_subject_ids), 0) = 0 then
    raise exception 'At least one subject is required';
  end if;
  if p_assessment ->> 'student_id' is distinct from v_student_id::text
     or p_assessment ->> 'school_year' is distinct from p_enrollment ->> 'school_year' then
    raise exception 'Enrollment and assessment student/school year must match';
  end if;
  if p_assessment ->> 'enrollment_id' is distinct from v_enrollment_id::text then
    raise exception 'Assessment must reference the submitted enrollment';
  end if;
  if not exists (select 1 from public.students where id = v_student_id) then
    raise exception 'Student % was not found', v_student_id;
  end if;
  if exists (select 1 from public.enrollments where id = v_enrollment_id)
     or exists (select 1 from public.assessments where id = v_assessment_id) then
    raise exception 'Enrollment or assessment id has already been used';
  end if;

  select count(*) into v_missing_subjects
  from (select distinct unnest(p_subject_ids) id) requested
  left join public.subjects s on s.id = requested.id
  where s.id is null;
  if v_missing_subjects > 0 then raise exception 'One or more selected subjects do not exist'; end if;

  insert into public.enrollments(
    id, student_id, school_year, semester, enrollment_type, status,
    submitted_at, enrollment_source, is_online_enrollment,
    online_application_id, completion_status, missing_fields, source_metadata
  ) values (
    v_enrollment_id,
    v_student_id,
    p_enrollment ->> 'school_year',
    nullif(p_enrollment ->> 'semester', ''),
    nullif(p_enrollment ->> 'enrollment_type', ''),
    'For Assessment',
    coalesce(nullif(p_enrollment ->> 'submitted_at', '')::timestamptz, now()),
    coalesce(nullif(p_enrollment ->> 'enrollment_source', ''), 'ERP'),
    coalesce((p_enrollment ->> 'is_online_enrollment')::boolean, false),
    nullif(p_enrollment ->> 'online_application_id', '')::uuid,
    coalesce(nullif(p_enrollment ->> 'completion_status', ''), 'Complete'),
    coalesce(array(select jsonb_array_elements_text(coalesce(p_enrollment -> 'missing_fields', '[]'::jsonb))), '{}'::text[]),
    coalesce(p_enrollment -> 'source_metadata', '{}'::jsonb)
  ) returning * into v_enrollment;

  insert into public.enrollment_subjects(enrollment_id, subject_id)
  select v_enrollment_id, id from (select distinct unnest(p_subject_ids) id) requested;

  v_assessment := public.save_draft_student_assessment(p_assessment, p_fees, p_actor);

  update public.enrollments
  set assessment_id = v_assessment_id, updated_at = now()
  where id = v_enrollment_id
  returning * into v_enrollment;

  update public.students
  set enrollment_status = 'For Assessment', updated_at = now()
  where id = v_student_id;

  return jsonb_build_object(
    'enrollment', to_jsonb(v_enrollment),
    'assessment', v_assessment
  );
end
$$;

-- The browser must use workflow-level functions. Fee replacement stays an
-- internal building block and is not directly executable by anon.
revoke execute on function public.replace_draft_assessment_fees(uuid, jsonb) from anon;
revoke execute on function public.save_draft_student_assessment(jsonb, jsonb, text) from public;
revoke execute on function public.submit_walk_in_enrollment(jsonb, uuid[], jsonb, jsonb, text) from public;
grant execute on function public.save_draft_student_assessment(jsonb, jsonb, text) to anon, authenticated;
grant execute on function public.submit_walk_in_enrollment(jsonb, uuid[], jsonb, jsonb, text) to anon, authenticated;

commit;

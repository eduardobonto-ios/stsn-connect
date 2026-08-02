begin;
create extension if not exists pgtap with schema extensions;
select plan(65);

select has_table('public', 'student_finance_invoices', 'invoice facts exist');
select has_table('public', 'student_receipts', 'receipt headers exist');
select has_table('public', 'student_receipt_allocations', 'receipt allocations exist');
select has_table('public', 'student_allocation_reversals', 'allocation reversals exist');
select has_table('public', 'student_invoice_installments', 'installment facts exist');
select has_table('public', 'student_receipt_journal_links', 'canonical receipt journal links exist');
select has_table('public', 'payments_legacy', 'legacy payments are retained as an archive');
select has_column('public', 'users', 'auth_user_id', 'application users link to auth users');
select has_function(
  'public', 'save_draft_student_assessment', array['jsonb', 'jsonb', 'text'],
  'draft assessment workflow RPC exists'
);
select has_function(
  'public', 'submit_walk_in_enrollment', array['jsonb', 'uuid[]', 'jsonb', 'jsonb', 'text'],
  'transactional walk-in workflow RPC exists'
);

select is(
  (select count(*) from public.student_finance_invoices),
  (select count(*) from public.assessments),
  'one invoice exists per assessment'
);
select is(
  (select count(*) from public.student_receipts),
  (select count(*) from public.payments_legacy),
  'one receipt exists per legacy payment'
);
select is(
  (select count(*) from public.student_receipt_financials
   where abs(amount - allocated_amount - direct_collection_amount - unapplied_amount) > 0.01),
  0::bigint,
  'receipt components reconcile'
);
select is(
  (select count(*) from public.student_receipts r
   where not exists (
     select 1 from public.student_receipt_journal_links l
     where l.receipt_id = r.id and l.event_type = 'Receipt'
   )),
  0::bigint,
  'every receipt has a canonical posting-journal link'
);
select is(
  (select count(*) from pg_publication_tables
   where pubname = 'supabase_realtime'
     and schemaname = 'public'
     and tablename = any(array[
       'payments_legacy', 'payment_void_requests_legacy',
       'ledger_transactions_legacy', 'student_ledger_summaries_legacy',
       'assessment_billing_summaries_legacy',
       'payment_collection_summaries_legacy'
     ])),
  0::bigint,
  'legacy finance archives are excluded from realtime'
);
select is(
  (select count(*) from public.student_finance_journal_links l
   join public.journal_entries j on j.id = l.journal_entry_id
   left join public.journal_entry_lines x on x.journal_entry_id = j.id
   group by l.id, j.status
   having j.status <> 'Posted'
      or coalesce(sum(x.debit_amount), 0) <> coalesce(sum(x.credit_amount), 0)
   limit 1),
  null::bigint,
  'every linked journal is posted and balanced'
);
select is(
  has_table_privilege('anon', 'public.student_receipts', 'select'),
  true,
  'temporary UAT posture allows anonymous receipt reads'
);
select is(
  has_table_privilege('anon', 'public.discount_requests', 'select'),
  true,
  'temporary UAT posture allows anonymous discount-request reads'
);
select is(
  has_function_privilege(
    'anon',
    'public.post_student_receipt(uuid,uuid,numeric,text,text,jsonb,jsonb,boolean,text,text,text)',
    'execute'
  ),
  true,
  'temporary UAT posture allows anonymous receipt posting through its RPC'
);
select is(
  has_table_privilege('anon', 'public.assessment_fees', 'insert'),
  false,
  'anonymous users cannot write assessment fees directly'
);
select is(
  has_function_privilege(
    'anon',
    'public.replace_draft_assessment_fees(uuid,jsonb)',
    'execute'
  ),
  false,
  'anonymous users cannot call the lower-level fee replacement RPC'
);
select is(
  has_function_privilege(
    'anon',
    'public.submit_walk_in_enrollment(jsonb,uuid[],jsonb,jsonb,text)',
    'execute'
  ),
  true,
  'anonymous UAT clients can call the transactional walk-in RPC'
);

create temporary table finance_uat_rpc_fixture as
select
  gen_random_uuid() as enrollment_id,
  gen_random_uuid() as assessment_id,
  gen_random_uuid() as invalid_assessment_id,
  s.id as student_id,
  s.school_id,
  (select id from public.subjects order by id limit 1) as subject_id
from public.students s
where s.school_id is not null
order by s.id
limit 1;

select lives_ok(
  $$
    select public.submit_walk_in_enrollment(
      jsonb_build_object(
        'id', f.enrollment_id,
        'student_id', f.student_id,
        'school_year', '2098-2099',
        'semester', 'First Semester',
        'enrollment_type', 'Old Student',
        'enrollment_source', 'ERP',
        'completion_status', 'Complete'
      ),
      array[f.subject_id],
      jsonb_build_object(
        'id', f.assessment_id,
        'enrollment_id', f.enrollment_id,
        'school_id', f.school_id,
        'student_id', f.student_id,
        'school_year', '2098-2099',
        'semester', 'First Semester',
        'payment_term', 'Cash Basis'
      ),
      jsonb_build_array(
        jsonb_build_object('fee_name', 'UAT Tuition', 'category', 'Tuition', 'amount', 100),
        jsonb_build_object('fee_name', 'UAT Misc', 'category', 'Miscellaneous', 'amount', 50)
      ),
      'pgTAP Finance UAT'
    )
    from finance_uat_rpc_fixture f
  $$,
  'walk-in workflow persists atomically'
);
select is(
  (select count(*) from public.enrollments e join finance_uat_rpc_fixture f on f.enrollment_id = e.id),
  1::bigint,
  'walk-in workflow creates one enrollment'
);
select is(
  (select count(*) from public.assessments a join finance_uat_rpc_fixture f on f.assessment_id = a.id),
  1::bigint,
  'walk-in workflow creates one linked assessment'
);
select is(
  (select count(*) from public.assessment_fees fee join finance_uat_rpc_fixture f on f.assessment_id = fee.assessment_id),
  2::bigint,
  'walk-in workflow creates the complete fee set'
);
select is(
  (select a.total_amount from public.assessments a join finance_uat_rpc_fixture f on f.assessment_id = a.id),
  150::numeric,
  'walk-in workflow derives the assessment total from fees'
);
select throws_ok(
  $$
    select public.save_draft_student_assessment(
      jsonb_build_object(
        'id', f.invalid_assessment_id,
        'school_id', f.school_id,
        'student_id', f.student_id,
        'school_year', '2099-2100',
        'payment_term', 'Cash Basis'
      ),
      jsonb_build_array(
        jsonb_build_object('fee_name', 'Invalid fee', 'category', 'Tuition', 'amount', -1)
      ),
      'pgTAP Finance UAT'
    )
    from finance_uat_rpc_fixture f
  $$,
  'P0001',
  'Every assessment fee requires a name, supported category, and positive amount',
  'invalid fees roll back instead of creating a partial assessment'
);
select is(
  (select count(*) from public.assessments a join finance_uat_rpc_fixture f on f.invalid_assessment_id = a.id),
  0::bigint,
  'invalid fee validation leaves no partial assessment'
);

update public.assessments a
set approval_status = 'Approved for Payment'
from finance_uat_rpc_fixture f
where a.id = f.assessment_id;

select throws_ok(
  $$
    select public.save_draft_student_assessment(
      jsonb_build_object('id', f.assessment_id, 'payment_term', 'Quarterly'),
      null,
      'pgTAP Finance UAT'
    )
    from finance_uat_rpc_fixture f
  $$,
  'P0001',
  'Approved assessments are immutable',
  'approved assessments cannot be edited through the draft RPC'
);

select has_table('public','academic_years','canonical academic-year dimension exists');
select has_table('public','academic_year_levels','canonical year-level dimension exists');
select has_table('public','student_fee_categories','normalized fee categories exist');
select has_table('public','student_fee_items','normalized fee items exist');
select has_table('public','student_fee_schedules','versioned fee schedules exist');
select has_table('public','student_fee_schedule_rates','normalized schedule rates exist');
select has_index('public','student_fee_schedules','ux_student_fee_schedule_published','one Published schedule per scope is enforced');
select has_table('public','discount_type_fee_categories','discount category scopes exist');
select has_table('public','discount_request_students','discount requests use student junction records');
select has_table('public','student_aid_programs','sponsorship programs are separate from discounts');
select has_view('public','student_fee_schedule_reconciliation','fee reconciliation view exists');
select has_column('public','assessment_fees','fee_schedule_id','assessment snapshot records schedule source');
select has_column('public','assessment_fees','fee_schedule_rate_id','assessment snapshot records rate source');
select has_column('public','assessment_fees','fee_item_id','assessment snapshot records fee-item source');
select has_column('public','assessment_fees','fee_category_id','assessment snapshot records category source');
select has_function('public','resolve_student_assessment_fees',array['uuid','text','text','uuid'],'canonical fee resolver exists');
select has_function('public','create_student_fee_schedule_draft',array['uuid','uuid','text','text'],'draft version RPC exists');
select has_function('public','delete_student_fee_schedule_rate',array['uuid','text'],'blank matrix cells are removed through a controlled RPC');
select has_function('public','publish_student_fee_schedule',array['uuid','text'],'controlled schedule publication exists');
select has_function('public','guard_student_fee_schedule_rate_mutation',array[]::text[],'published-rate immutability guard exists');
select has_trigger('public','student_fee_schedule_rates','trg_student_fee_schedule_rates_draft_only','schedule-rate immutability trigger exists');
select has_function('public','submit_walk_in_enrollment_v2',array['jsonb','uuid[]','jsonb','uuid','text'],'walk-in v2 rejects client-authored fee payloads');
select has_function('public','submit_student_discount_request_v2',array['uuid','uuid','uuid[]','text','text[]'],'discount v2 accepts student IDs');
select is(
  (select count(*) from public.student_fee_schedules fs
   join public.schools s on s.id=fs.school_id
   join public.academic_years y on y.id=fs.academic_year_id
   where s.code='STSN' and y.name='2025-2026' and fs.status='Draft'),
  1::bigint,'workbook is imported as one STSN 2025-2026 Draft'
);
select is(
  (select count(*) from public.discount_types where code in ('SIB-2','SIB-3','SIB-4') and is_active),
  3::bigint,'second through fourth sibling policies are active'
);
select is(
  (select count(*) from public.discount_types where code='SIB-5' and not is_active and discount_percent=20),
  1::bigint,'ambiguous fifth-child policy is retained but inactive'
);
select is(
  (select count(*) from public.student_fee_schedule_rates where amount <= 0),
  0::bigint,'blank workbook cells do not become zero-value fee rows'
);
select lives_ok(
  $$ select * from public.resolve_student_assessment_fees(
    (select id from public.schools where code='STSN'),'2026-2027','Grade 1',null
  ) $$,
  'published STSN current-year fee resolution succeeds'
);
select is(
  (select count(*) from public.resolve_student_assessment_fees(
    (select id from public.schools where code='STSN'),'2026-2027','Grade 1',null
  ) where category='Tuition'),
  1::bigint,'fee resolution returns one applicable tuition line per level'
);

create temporary table fee_history_guard_fixture (
  fixture_type text primary key,
  schedule_id uuid not null
);

with source_scope as (
  select fs.school_id, fs.academic_year_id, fs.academic_unit
  from public.student_fee_schedules fs
  where fs.status = 'Published'
  order by fs.id
  limit 1
), inserted as (
  insert into public.student_fee_schedules(
    school_id, academic_year_id, academic_unit, version, status, source_reference
  )
  select scope.school_id, scope.academic_year_id, scope.academic_unit,
    coalesce((select max(version) from public.student_fee_schedules existing
      where existing.school_id = scope.school_id
        and existing.academic_year_id = scope.academic_year_id
        and existing.academic_unit = scope.academic_unit), 0) + 100,
    'Draft', 'pgTAP draft immutability fixture'
  from source_scope scope
  returning id
)
insert into fee_history_guard_fixture(fixture_type, schedule_id)
select 'draft', id from inserted;

with source_scope as (
  select fs.school_id, fs.academic_year_id, fs.academic_unit
  from public.student_fee_schedules fs
  where fs.status = 'Published'
  order by fs.id
  limit 1
), inserted as (
  insert into public.student_fee_schedules(
    school_id, academic_year_id, academic_unit, version, status, source_reference
  )
  select scope.school_id, scope.academic_year_id, scope.academic_unit,
    coalesce((select max(version) from public.student_fee_schedules existing
      where existing.school_id = scope.school_id
        and existing.academic_year_id = scope.academic_year_id
        and existing.academic_unit = scope.academic_unit), 0) + 100,
    'Draft', 'pgTAP archived immutability fixture'
  from source_scope scope
  returning id
)
insert into fee_history_guard_fixture(fixture_type, schedule_id)
select 'archived', id from inserted;

insert into public.student_fee_schedule_rates(schedule_id, fee_item_id, year_level_id, amount)
select fixture.schedule_id, source_rate.fee_item_id, source_rate.year_level_id, 100
from fee_history_guard_fixture fixture
cross join lateral (
  select rate.fee_item_id, rate.year_level_id
  from public.student_fee_schedule_rates rate
  join public.student_fee_schedules schedule on schedule.id = rate.schedule_id
  where schedule.status = 'Published'
  order by rate.id
  limit 1
) source_rate;

update public.student_fee_schedules
set status = 'Archived', published_at = now(), published_by = 'pgTAP'
where id = (select schedule_id from fee_history_guard_fixture where fixture_type = 'archived');

select lives_ok(
  $$ update public.student_fee_schedule_rates
     set amount = amount + 1
     where schedule_id = (select schedule_id from fee_history_guard_fixture where fixture_type = 'draft') $$,
  'Draft schedule rates remain editable'
);
select lives_ok(
  $$ delete from public.student_fee_schedule_rates
     where schedule_id = (select schedule_id from fee_history_guard_fixture where fixture_type = 'draft') $$,
  'Draft schedule rates remain deletable'
);
select throws_ok(
  $$ insert into public.student_fee_schedule_rates(schedule_id, fee_item_id, year_level_id, amount)
     select schedule.id, rate.fee_item_id, rate.year_level_id, 1
     from public.student_fee_schedules schedule
     join public.student_fee_schedule_rates rate on rate.schedule_id = schedule.id
     where schedule.status = 'Published'
     order by rate.id limit 1 $$,
  'P0001',
  'Published and Archived fee schedule rates are immutable; create a Draft version instead',
  'Published schedules reject new rate rows'
);
select throws_ok(
  $$ update public.student_fee_schedule_rates
     set amount = amount + 1
     where id = (select rate.id from public.student_fee_schedule_rates rate
       join public.student_fee_schedules schedule on schedule.id = rate.schedule_id
       where schedule.status = 'Published' order by rate.id limit 1) $$,
  'P0001',
  'Published and Archived fee schedule rates are immutable; create a Draft version instead',
  'Published schedule rates reject updates'
);
select throws_ok(
  $$ update public.student_fee_schedule_rates
     set amount = amount + 1
     where schedule_id = (select schedule_id from fee_history_guard_fixture where fixture_type = 'archived') $$,
  'P0001',
  'Published and Archived fee schedule rates are immutable; create a Draft version instead',
  'Previously Published schedule rates reject updates'
);
select throws_ok(
  $$ delete from public.student_fee_schedule_rates
     where schedule_id = (select schedule_id from fee_history_guard_fixture where fixture_type = 'archived') $$,
  'P0001',
  'Published and Archived fee schedule rates are immutable; create a Draft version instead',
  'Previously Published schedule rates reject deletion'
);

select * from finish();
rollback;

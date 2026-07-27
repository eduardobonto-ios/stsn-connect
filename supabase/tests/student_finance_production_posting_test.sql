begin;
create extension if not exists pgtap with schema extensions;
select plan(17);

select has_table('public', 'student_finance_invoices', 'invoice facts exist');
select has_table('public', 'student_receipts', 'receipt headers exist');
select has_table('public', 'student_receipt_allocations', 'receipt allocations exist');
select has_table('public', 'student_allocation_reversals', 'allocation reversals exist');
select has_table('public', 'student_invoice_installments', 'installment facts exist');
select has_table('public', 'student_receipt_journal_links', 'canonical receipt journal links exist');
select has_table('public', 'payments_legacy', 'legacy payments are retained as an archive');
select has_column('public', 'users', 'auth_user_id', 'application users link to auth users');

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
  false,
  'anonymous users cannot read receipts'
);
select is(
  has_table_privilege('anon', 'public.discount_requests', 'select'),
  false,
  'anonymous users cannot read discount requests'
);
select is(
  has_function_privilege(
    'anon',
    'public.post_student_receipt(uuid,uuid,numeric,text,text,jsonb,jsonb,boolean,text,text,text)',
    'execute'
  ),
  false,
  'anonymous users cannot execute receipt posting'
);

select * from finish();
rollback;

-- Run immediately after the normalized migration while maintenance is enabled.
-- Any failed invariant aborts this verification transaction.
begin;

do $$
declare v_issues jsonb;
begin
  with issues as (
    select 'INVOICE_COUNT_MISMATCH' issue
    where (select count(*) from public.student_finance_invoices)
       <> (select count(*) from public.assessments)
    union all
    select 'RECEIPT_COUNT_MISMATCH'
    where (select count(*) from public.student_receipts)
       <> (select count(*) from public.payments_legacy)
    union all
    select 'INVOICE_BALANCE_MISMATCH'
    where exists (
      select 1
      from public.student_finance_invoices i
      join public.student_invoice_financials f on f.invoice_id = i.id
      join public.assessments a on a.id = i.assessment_id
      where abs(f.balance - a.balance) > 0.01
    )
    union all
    select 'RECEIPT_COMPONENT_MISMATCH'
    where exists (
      select 1 from public.student_receipt_financials
      where status = 'Posted'
        and abs(amount - allocated_amount - direct_collection_amount - unapplied_amount) > 0.01
    )
    union all
    select 'VOIDED_RECEIPT_HAS_ACTIVE_VALUE'
    where exists (
      select 1 from public.student_receipt_financials
      where status = 'Voided'
        and (abs(allocated_amount) > 0.01 or abs(unapplied_amount) > 0.01)
    )
    union all
    select 'INSTALLMENT_TOTAL_MISMATCH'
    where exists (
      select 1
      from public.student_invoice_payment_plans p
      join public.student_invoice_financials f on f.invoice_id = p.invoice_id
      where p.status = 'Active'
        and abs(coalesce((select sum(i.amount)
          from public.student_invoice_installments i where i.payment_plan_id = p.id), 0)
          - (f.gross_charges + f.debit_adjustments - f.credit_adjustments)) > 0.01
    )
    union all
    select 'UNBALANCED_FINANCE_JOURNAL'
    where exists (
      select 1
      from public.student_finance_journal_links l
      join public.journal_entries j on j.id = l.journal_entry_id
      left join public.journal_entry_lines x on x.journal_entry_id = j.id
      group by l.id, j.status
      having j.status <> 'Posted'
        or coalesce(sum(x.debit_amount), 0) <> coalesce(sum(x.credit_amount), 0)
    )
    union all
    select 'UNBALANCED_RECEIPT_JOURNAL'
    where exists (
      select 1
      from public.student_receipt_journal_links l
      join public.journal_entries j on j.id = l.journal_entry_id
      left join public.journal_entry_lines x on x.journal_entry_id = j.id
      group by l.id, j.status
      having j.status <> 'Posted'
        or coalesce(sum(x.debit_amount), 0) <> coalesce(sum(x.credit_amount), 0)
    )
    union all
    select 'RECEIPT_WITHOUT_POSTING_JOURNAL'
    where exists (
      select 1 from public.student_receipts r
      where not exists (
        select 1 from public.student_receipt_journal_links l
        where l.receipt_id = r.id and l.event_type = 'Receipt'
      )
    )
    union all
    select 'ACTIVE_USER_WITHOUT_AUTH_LINK'
    where exists (select 1 from public.users where is_active and auth_user_id is null)
    union all
    select 'FINANCE_WRITES_PREMATURELY_ENABLED'
    where exists (
      select 1 from public.system_runtime_controls
      where control_key = 'student_finance_writes' and enabled
    )
    union all
    select 'LEGACY_ARCHIVE_MISSING'
    where exists (
      select 1
      from unnest(array[
        'public.ledger_transactions_legacy',
        'public.student_ledger_summaries_legacy',
        'public.assessment_billing_summaries_legacy',
        'public.payment_collection_summaries_legacy',
        'public.payments_legacy',
        'public.payment_void_requests_legacy'
      ]) as x(object_name)
      where to_regclass(object_name) is null
    )
    union all
    select 'LEGACY_FINANCE_STILL_PUBLISHED'
    where exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = any(array[
          'ledger_transactions_legacy',
          'student_ledger_summaries_legacy',
          'assessment_billing_summaries_legacy',
          'payment_collection_summaries_legacy',
          'payments_legacy',
          'payment_void_requests_legacy'
        ])
    )
    union all
    select 'ANON_CAN_ACCESS_CANONICAL_FINANCE'
    where exists (
      select 1
      from unnest(array[
        'student_finance_invoices',
        'student_finance_invoice_lines',
        'student_invoice_payment_plans',
        'student_invoice_installments',
        'student_receipts',
        'student_receipt_allocations',
        'student_direct_collection_lines',
        'student_allocation_reversals',
        'student_allocation_reallocation_requests',
        'student_receipt_void_requests',
        'student_finance_adjustments',
        'discount_requests'
      ]) as x(table_name)
      where has_table_privilege(
        'anon', format('public.%I', table_name),
        'SELECT,INSERT,UPDATE,DELETE'
      )
    )
    union all
    select 'PUBLIC_OR_ANON_CAN_EXECUTE_FINANCE_RPC'
    where exists (
      select 1
      from information_schema.routine_privileges p
      where p.specific_schema = 'public'
        and p.grantee in ('PUBLIC', 'anon')
        and p.privilege_type = 'EXECUTE'
        and p.routine_name = any(array[
          'approve_student_assessment',
          'post_student_payment',
          'post_student_receipt',
          'apply_student_unapplied_credit',
          'submit_student_allocation_reallocation',
          'review_student_allocation_reallocation',
          'submit_student_receipt_void_request',
          'review_student_receipt_void_request',
          'submit_student_discount_request',
          'approve_student_discount_request',
          'reject_student_discount_request'
        ])
    )
  )
  select jsonb_agg(issue) into v_issues from issues;

  if v_issues is not null then
    raise exception using
      message = 'Student-finance postflight failed',
      detail = v_issues::text,
      hint = 'Keep maintenance enabled and restore the verified snapshot if this is production.';
  end if;
end
$$;

select 'PASS: all normalized finance reconciliation gates passed' as result;
rollback;

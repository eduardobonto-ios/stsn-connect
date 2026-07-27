-- ============================================================================
-- STSN Connect — emergency rollback for normalized student finance
-- Target: 20260720120000_student_finance_production_posting.sql
-- ============================================================================
-- Use only after the finance migration COMMITTED but postflight/smoke testing
-- failed. A migration execution error already rolls back automatically.
--
-- This rollback is intentionally fail-closed. It refuses to discard canonical
-- activity created after cutover. In that situation restore the verified
-- database snapshot instead.
--
-- The production Auth/RBAC bridge is retained. Finance writes remain disabled.
-- ============================================================================

begin;

select pg_advisory_xact_lock(hashtext('stsn:student-finance-production-posting'));

do $$
declare
  v_missing text[] := '{}';
  v_name text;
  v_writes_enabled boolean;
  v_count bigint;
begin
  if to_regclass('public.system_runtime_controls') is null then
    raise exception 'Runtime controls are missing; restore the verified snapshot';
  end if;

  select enabled into v_writes_enabled
  from public.system_runtime_controls
  where control_key = 'student_finance_writes';
  if coalesce(v_writes_enabled, true) then
    raise exception using
      message = 'Finance writes must be disabled before rollback',
      hint = 'Enable maintenance mode and stop every finance writer first.';
  end if;

  foreach v_name in array array[
    'public.ledger_transactions_legacy',
    'public.student_ledger_summaries_legacy',
    'public.assessment_billing_summaries_legacy',
    'public.payment_collection_summaries_legacy',
    'public.payments_legacy',
    'public.payment_void_requests_legacy',
    'public.student_finance_invoices',
    'public.student_receipts'
  ] loop
    if to_regclass(v_name) is null then
      v_missing := array_append(v_missing, v_name);
    end if;
  end loop;
  if cardinality(v_missing) > 0 then
    raise exception using
      message = 'Finance rollback prerequisites are missing',
      detail = array_to_string(v_missing, ', '),
      hint = 'If the migration itself failed, its transaction already rolled back.';
  end if;

  -- Every canonical fact must still be a deterministic migration copy. Any
  -- operational posting makes a relational rollback lossy and is rejected.
  select count(*) into v_count
  from public.student_receipts
  where legacy_payment_id is null
     or idempotency_key not like 'legacy-payment:%';
  if v_count > 0 then
    raise exception '% post-cutover receipts exist; restore the snapshot instead', v_count;
  end if;

  select count(*) into v_count
  from public.student_receipt_allocations
  where idempotency_key is null
     or idempotency_key not like 'legacy-payment-allocation:%';
  if v_count > 0 then
    raise exception '% post-cutover receipt allocations exist; restore the snapshot instead', v_count;
  end if;

  select count(*) into v_count
  from public.student_direct_collection_lines d
  join public.student_receipts r on r.id = d.receipt_id
  left join public.payments_legacy p
    on p.id = r.legacy_payment_id and p.transaction_type = 'OR'
  where p.id is null;
  if v_count > 0 then
    raise exception '% post-cutover direct collections exist; restore the snapshot instead', v_count;
  end if;

  select count(*) into v_count
  from (
    select receipt_id
    from public.student_direct_collection_lines
    group by receipt_id
    having count(*) <> 1
  ) x;
  if v_count > 0 then
    raise exception '% receipts have non-legacy direct collection shapes; restore the snapshot instead', v_count;
  end if;

  select count(*) into v_count
  from public.student_allocation_reversals
  where idempotency_key is null
     or idempotency_key not like 'legacy-receipt-void:%';
  if v_count > 0 then
    raise exception '% post-cutover allocation reversals exist; restore the snapshot instead', v_count;
  end if;

  select
    (select count(*) from public.student_allocation_reallocation_requests)
    + (select count(*) from public.student_receipt_void_requests)
  into v_count;
  if v_count > 0 then
    raise exception '% post-cutover approval requests exist; restore the snapshot instead', v_count;
  end if;

  select count(*) into v_count
  from public.student_finance_adjustments
  where idempotency_key is null
     or idempotency_key not like 'legacy-assessment-discount:%';
  if v_count > 0 then
    raise exception '% post-cutover finance adjustments exist; restore the snapshot instead', v_count;
  end if;

  if (select count(*) from public.student_finance_invoices)
     <> (select count(*) from public.assessments) then
    raise exception 'Canonical invoice count changed after cutover; restore the snapshot instead';
  end if;
end
$$;

-- Remove canonical/compatibility read models before restoring the archived
-- physical tables. Normalized fact tables are dropped only after the no-write
-- assertions above prove they contain migration copies alone.
drop view if exists public.student_finance_reconciliation cascade;
drop view if exists public.student_finance_unlinked_records cascade;
drop view if exists public.student_finance_reconciliation_v2 cascade;
drop view if exists public.student_installment_standing cascade;
drop view if exists public.student_unapplied_credits cascade;
drop view if exists public.student_receipt_financials cascade;
drop view if exists public.student_invoice_financials cascade;
drop view if exists public.student_ledger_summaries cascade;
drop view if exists public.assessment_billing_summaries cascade;
drop view if exists public.payment_collection_summaries cascade;
drop view if exists public.ledger_transactions cascade;
drop view if exists public.assessment_financials cascade;
drop view if exists public.payments cascade;
drop view if exists public.payment_void_requests cascade;

drop table if exists public.student_receipt_journal_links cascade;
drop table if exists public.student_receipt_void_requests cascade;
drop table if exists public.student_allocation_reallocation_requests cascade;
drop table if exists public.student_allocation_reversals cascade;
drop table if exists public.student_direct_collection_lines cascade;
drop table if exists public.student_receipt_allocations cascade;
drop table if exists public.student_receipts cascade;
drop table if exists public.student_invoice_installments cascade;
drop table if exists public.student_invoice_payment_plans cascade;
drop table if exists public.student_finance_invoice_lines cascade;
drop table if exists public.student_finance_invoices cascade;
drop table if exists public.student_payment_term_template_installments cascade;
drop table if exists public.student_payment_term_templates cascade;
drop table if exists public.student_finance_journal_links cascade;
drop table if exists public.student_finance_adjustments cascade;
drop table if exists public.student_payment_methods cascade;
drop table if exists public.student_collection_categories cascade;

drop trigger if exists trg_student_finance_guard_assessment_write
  on public.assessments;
drop trigger if exists trg_student_finance_protect_approved_assessment
  on public.assessments;
drop trigger if exists trg_student_finance_normalize_fee
  on public.assessment_fees;
drop trigger if exists trg_student_finance_protect_approved_fees
  on public.assessment_fees;
drop trigger if exists trg_student_finance_protect_linked_journal
  on public.journal_entries;
drop trigger if exists trg_student_finance_protect_linked_journal_line
  on public.journal_entry_lines;

alter table public.assessment_fees
  alter column unit_amount drop not null,
  alter column revenue_account_code drop not null;
alter table public.assessment_fees
  drop constraint if exists assessment_fees_quantity_positive,
  drop constraint if exists assessment_fees_unit_amount_nonnegative,
  drop constraint if exists assessment_fees_amount_consistent;

alter table public.payments_legacy
  alter column payment_method_id drop not null;
alter table public.payments_legacy
  drop constraint if exists payments_transaction_shape_check,
  drop constraint if exists payments_amount_positive_check;
drop index if exists public.ux_payments_school_or_number;
drop index if exists public.ux_payments_idempotency_key;

drop trigger if exists trg_ledger_transactions_legacy_read_only
  on public.ledger_transactions_legacy;
drop trigger if exists trg_student_ledger_summaries_legacy_read_only
  on public.student_ledger_summaries_legacy;
drop trigger if exists trg_assessment_billing_summaries_legacy_read_only
  on public.assessment_billing_summaries_legacy;
drop trigger if exists trg_payment_collection_summaries_legacy_read_only
  on public.payment_collection_summaries_legacy;
drop trigger if exists trg_payments_legacy_read_only
  on public.payments_legacy;
drop trigger if exists trg_payment_void_requests_legacy_read_only
  on public.payment_void_requests_legacy;

alter table public.ledger_transactions_legacy rename to ledger_transactions;
alter table public.student_ledger_summaries_legacy rename to student_ledger_summaries;
alter table public.assessment_billing_summaries_legacy rename to assessment_billing_summaries;
alter table public.payment_collection_summaries_legacy rename to payment_collection_summaries;
alter table public.payments_legacy rename to payments;
alter table public.payment_void_requests_legacy rename to payment_void_requests;

-- Restore the original table-policy shape. The Auth bridge remains installed,
-- so production sessions should continue using authenticated access.
do $$
declare
  v_table text;
  v_policy record;
begin
  foreach v_table in array array[
    'ledger_transactions',
    'student_ledger_summaries',
    'assessment_billing_summaries',
    'payment_collection_summaries',
    'payments',
    'payment_void_requests'
  ] loop
    for v_policy in
      select policyname from pg_policies
      where schemaname = 'public' and tablename = v_table
    loop
      execute format('drop policy if exists %I on public.%I', v_policy.policyname, v_table);
    end loop;
    execute format('alter table public.%I enable row level security', v_table);
    execute format(
      'create policy %I on public.%I for select to authenticated using (true)',
      v_table || '_rollback_read', v_table
    );
    execute format('grant select on public.%I to authenticated', v_table);
    execute format('revoke insert, update, delete on public.%I from anon, authenticated', v_table);
  end loop;
end
$$;

-- Re-publish restored legacy tables only if the project uses the standard
-- explicit Supabase Realtime publication.
do $$
declare v_table text;
begin
  if exists (
    select 1 from pg_publication
    where pubname = 'supabase_realtime' and not puballtables
  ) then
    foreach v_table in array array[
      'ledger_transactions',
      'student_ledger_summaries',
      'assessment_billing_summaries',
      'payment_collection_summaries',
      'payments',
      'payment_void_requests'
    ] loop
      if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public' and tablename = v_table
      ) then
        execute format(
          'alter publication supabase_realtime add table public.%I', v_table
        );
      end if;
    end loop;
  end if;
end
$$;

update public.system_runtime_controls
set enabled = false,
    changed_at = now(),
    remarks = 'Finance migration rolled back; writes remain closed pending review'
where control_key = 'student_finance_writes';

commit;

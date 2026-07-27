-- ============================================================================
-- STSN Connect — rollback for app-controlled finance authorization
-- Target: 20260723140000_app_controlled_finance_authz.sql
-- ============================================================================
-- Reverses the app-controlled authorization change: restores the enforcing
-- app_require_permission, removes anon access to the finance RPCs and tables,
-- and re-disables finance writes. Use to return to the Supabase-Auth-enforced
-- posture defined by 20260720110000 / 20260720120000.
-- ============================================================================

begin;

do $$
begin
  perform pg_advisory_xact_lock(hashtext('stsn:app-controlled-finance-authz'));
end
$$;

-- 4. Re-disable finance writes first (fail-closed).
update public.system_runtime_controls
set enabled = false,
    changed_at = now(),
    remarks = 'App-controlled authz rolled back; finance writes disabled.'
where control_key = 'student_finance_writes';

-- 1. Restore the enforcing app_require_permission (from 20260720110000).
create or replace function public.app_require_permission(
  p_module_key text,
  p_page_key text,
  p_action_key text,
  p_school_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_setting('app.student_finance_migration', true) = 'on' then return; end if;
  if not public.app_has_permission(
    p_module_key, p_page_key, p_action_key, p_school_id
  ) then
    raise exception using
      errcode = '42501',
      message = format(
        'Permission denied: %s/%s/%s',
        p_module_key, coalesce(p_page_key, '*'), p_action_key
      );
  end if;
end
$$;

-- 2. Revoke finance RPC execution from anon.
do $$
declare
  v_fn text;
  v_fns text[] := array[
    'public.approve_student_assessment(uuid, text, text)',
    'public.review_student_assessment(uuid, text, text)',
    'public.append_student_assessment_audit(uuid, text, text)',
    'public.replace_draft_assessment_fees(uuid, jsonb)',
    'public.post_student_adjustment(uuid, numeric, text, text, text, text)',
    'public.post_student_payment(uuid, uuid, uuid, numeric, text, text, text, text, text, text, text, text)',
    'public.post_student_receipt(uuid, uuid, numeric, text, text, jsonb, jsonb, boolean, text, text, text)',
    'public.apply_student_unapplied_credit(uuid, jsonb, text, text)',
    'public.submit_payment_void_request(uuid, text, text)',
    'public.review_payment_void_request(uuid, boolean, text, text)',
    'public.submit_student_allocation_reallocation(uuid, uuid, numeric, text, text)',
    'public.review_student_allocation_reallocation(uuid, boolean, text, text)',
    'public.submit_student_receipt_void_request(uuid, text, text)',
    'public.review_student_receipt_void_request(uuid, boolean, text, text)',
    'public.submit_student_discount_request(uuid, uuid, text[], text, text[])',
    'public.approve_student_discount_request(uuid, integer, text, text)',
    'public.reject_student_discount_request(uuid, integer, text, text)',
    'public.set_student_assessment_hold(uuid, text, text)',
    'public.set_financial_hold_record_status(uuid, text, text, text)'
  ];
begin
  foreach v_fn in array v_fns loop
    if to_regprocedure(v_fn) is not null then
      execute format('revoke execute on function %s from anon', v_fn);
    end if;
  end loop;
end
$$;

-- 3. Drop the anon read policies and revoke anon SELECT on finance tables.
do $$
declare
  v_tbl text;
  v_tables text[] := array[
    'assessments',
    'assessment_fees',
    'assessment_audit_trail',
    'financial_holds',
    'discount_requests',
    'discount_request_audit_trail',
    'discount_types',
    'payment_void_requests',
    'student_payment_methods',
    'student_collection_categories',
    'student_finance_adjustments',
    'student_finance_journal_links',
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
    'student_receipt_journal_links',
    'student_payment_term_templates',
    'student_payment_term_template_installments'
  ];
begin
  foreach v_tbl in array v_tables loop
    if to_regclass('public.' || v_tbl) is not null then
      execute format('drop policy if exists %I on public.%I', v_tbl || '_app_anon_read', v_tbl);
      execute format('revoke select on public.%I from anon', v_tbl);
    end if;
  end loop;
end
$$;

do $$
declare
  v_view text;
  v_views text[] := array[
    'student_invoice_financials',
    'student_receipt_financials',
    'student_unapplied_credits',
    'student_installment_standing',
    'student_finance_reconciliation_v2',
    'assessment_financials',
    'ledger_transactions',
    'student_ledger_summaries',
    'assessment_billing_summaries',
    'payment_collection_summaries',
    'student_finance_reconciliation',
    'student_finance_unlinked_records'
  ];
begin
  foreach v_view in array v_views loop
    if to_regclass('public.' || v_view) is not null then
      execute format('revoke select on public.%I from anon', v_view);
    end if;
  end loop;
end
$$;

commit;

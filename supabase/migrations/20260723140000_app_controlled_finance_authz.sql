-- ============================================================================
-- STSN Connect — app-controlled finance authorization
--
-- Purpose: authorization for finance/approval is validated in the application
-- layer (its RBAC gates), NOT in Supabase Auth. The app calls Supabase from the
-- browser with the public anon key and establishes no Auth session, so this
-- migration stops Supabase from gating finance actions on auth.uid() while
-- keeping the SECURITY DEFINER posting RPCs (journal entries, status
-- transitions, immutability triggers) fully intact.
--
-- Must be applied AFTER:
--   20260720110000_production_auth_bridge.sql
--   20260720120000_student_finance_production_posting.sql
--
-- ⚠️ SECURITY NOTE: with the DB permission check neutralized and the finance
-- RPCs granted to `anon`, the public anon key is sufficient to call
-- approve/reject/post-payment directly, bypassing the UI. The database performs
-- no authorization here — the application UI is the only gate. This is the
-- accepted consequence of "authorization lives in the app". When a real
-- server/service-role backend is introduced, reintroduce DB-side enforcement
-- (or route writes through that backend with the service_role key).
-- ============================================================================

begin;

do $$
begin
  perform pg_advisory_xact_lock(hashtext('stsn:app-controlled-finance-authz'));
end
$$;

-- Guard: the auth bridge and finance posting migrations must already be present.
do $$
begin
  if to_regprocedure('public.app_require_permission(text,text,text,uuid)') is null
     or to_regprocedure('public.approve_student_assessment(uuid,text,text)') is null then
    raise exception using
      message = 'app-controlled finance authz requires the auth bridge and finance posting migrations',
      hint = 'Apply 20260720110000 and 20260720120000 first.';
  end if;
end
$$;

-- ----------------------------------------------------------------------------
-- 1. Neutralize the in-RPC permission gate (single choke point).
--    app_require_permission is used ONLY by the finance RPCs, so making it a
--    no-op disables DB-side authz across all of them without touching each RPC.
--    app_has_permission is intentionally left untouched (it also backs
--    non-finance user-security), so authorization elsewhere is unaffected.
-- ----------------------------------------------------------------------------
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
  -- App-controlled authorization: enforcement lives in the application layer.
  return;
end
$$;

-- ----------------------------------------------------------------------------
-- 2. Open finance RPC execution to the anon role (browser uses the anon key).
-- ----------------------------------------------------------------------------
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
      execute format('grant execute on function %s to anon', v_fn);
    end if;
  end loop;
end
$$;

-- ----------------------------------------------------------------------------
-- 3. Restore anon read access to the finance tables (used by dataLoader SELECTs).
--    Writes are unaffected: direct INSERT/UPDATE/DELETE stay revoked and all
--    persistence flows through the SECURITY DEFINER RPCs, which bypass RLS.
--    A permissive `to anon` read policy is ADDED alongside the existing
--    `to authenticated` policies (RLS permissive policies combine with OR), so
--    the future authenticated model remains intact and this is easily reversed.
-- ----------------------------------------------------------------------------
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
      execute format('grant select on public.%I to anon', v_tbl);
      execute format('drop policy if exists %I on public.%I', v_tbl || '_app_anon_read', v_tbl);
      execute format(
        'create policy %I on public.%I for select to anon using (true)',
        v_tbl || '_app_anon_read', v_tbl
      );
    end if;
  end loop;
end
$$;

-- Finance reporting views the data loader reads (revoked from anon by the
-- posting migration). Views run with the querying role's privileges, so anon
-- needs an explicit SELECT grant.
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
      execute format('grant select on public.%I to anon', v_view);
    end if;
  end loop;
end
$$;

-- ----------------------------------------------------------------------------
-- 4. Enable finance writes (otherwise every action throws "maintenance mode"
--    before any posting runs). The runtime toggle stays in place as an
--    operational maintenance switch; it is simply open by default now.
-- ----------------------------------------------------------------------------
update public.system_runtime_controls
set enabled = true,
    changed_at = now(),
    remarks = 'App-controlled authorization; student-finance writes enabled.'
where control_key = 'student_finance_writes';

commit;

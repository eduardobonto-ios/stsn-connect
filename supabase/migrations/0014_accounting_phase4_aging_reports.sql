-- ============================================================================
-- STSN Connect - Accounting Module: Phase 4 — AR & AP Aging Reports
-- ============================================================================
-- No new tables are created in this phase.
--
-- Phase 4 introduces two read-only aging report pages:
--
--   Feature 9  — AR Summary with Aging (ARAgingPage.tsx)
--     Reads: public.sales_invoices        (created in 0011_accounting_sales_invoices.sql)
--            public.sales_invoice_lines   (created in 0011_accounting_sales_invoices.sql)
--
--   Feature 10 — AP Summary with Aging (APAgingPage.tsx)
--     Reads: public.purchase_invoices       (created in 0012_accounting_purchase_invoices.sql)
--            public.purchase_invoice_lines  (created in 0012_accounting_purchase_invoices.sql)
--
-- Aging buckets (Current / 1-30 / 31-60 / 61-90 / 91-120 / 120+ days) are
-- computed in the frontend by comparing each invoice's due_date against the
-- current date. No materialized columns or views are required.
--
-- RLS policies for all four tables were applied in 0011 and 0012 respectively.
-- No additional policy changes are needed for Phase 4.
--
-- The reports intentionally show outstanding posted invoices only. The demo
-- invoices seeded in 0011 and 0012 must therefore be Posted, otherwise the
-- report pages correctly load but show empty tables.
-- ============================================================================

-- Verify the source tables exist before Phase 4 pages query them.
do $$
begin
  if not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'sales_invoices') then
    raise exception 'Phase 4 dependency missing: public.sales_invoices (run 0011_accounting_sales_invoices.sql first)';
  end if;
  if not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'purchase_invoices') then
    raise exception 'Phase 4 dependency missing: public.purchase_invoices (run 0012_accounting_purchase_invoices.sql first)';
  end if;
end;
$$;

update public.sales_invoices
set
  status = 'Posted',
  notes = coalesce(notes, 'Posted for AR aging demo.'),
  updated_at = now()
where legacy_id in ('si-1001', 'si-1002')
  and status = 'Draft';

update public.purchase_invoices
set
  status = 'Posted',
  notes = coalesce(notes, 'Posted for AP aging demo.'),
  updated_at = now()
where legacy_id in ('pi-1001', 'pi-1002')
  and status = 'Draft';

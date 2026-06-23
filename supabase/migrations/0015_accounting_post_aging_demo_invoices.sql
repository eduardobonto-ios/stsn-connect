-- ============================================================================
-- STSN Connect - Accounting Module: Aging Demo Data Visibility
-- ============================================================================
-- AR/AP aging pages show outstanding Posted invoices only. Earlier demo invoice
-- seeds were Draft, so existing databases can have valid dummy rows that are
-- filtered out by the reports.
-- ============================================================================

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

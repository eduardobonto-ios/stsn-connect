-- ============================================================================
-- STSN Connect - Payment setup-driven values
-- Allows Cashiering and Accounting payment dropdowns to use Core Setup values
-- instead of the original fixed method/term CHECK lists.
-- ============================================================================

alter table public.payments
  drop constraint if exists payments_payment_method_check,
  drop constraint if exists payments_term_check;

alter table public.payment_collection_summaries
  drop constraint if exists payment_collection_summaries_payment_method_check;


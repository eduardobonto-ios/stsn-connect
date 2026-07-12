-- ============================================================================
-- STSN CONNECT — Cashier: Other Payments (OR) + Cash Vouchers
-- Migration: 20260712090000_cashier_other_payments_and_cash_vouchers.sql
-- ----------------------------------------------------------------------------
-- Adds:
--   * payments.transaction_type / payments.payment_category — lets the
--     Cashier module post a standalone "OR" collection that is not tied to
--     any assessment (existing "AR" flow is untouched and stays the default).
--   * public.cash_vouchers — outbound cash release requests (student refunds,
--     staff/vendor reimbursements, petty cash), gated by an Accounting
--     approve/reject step before the cashier can release the cash.
--   * security_permissions rows for two new Cashier sub-pages
--     ("other-payments", "vouchers") + role grants.
--   * setup_items seed rows for the "other_payment_categories" and
--     "cash_voucher_categories" reference lists.
--
-- Safety: additive & idempotent (if not exists / on conflict do nothing),
-- mirrors the permissive anon+authenticated RLS posture already used for
-- `payments` and every other app table (0002_rls.sql) — access enforcement
-- lives at the app layer via security_permissions / usePermissions.
-- ============================================================================

-- ============================================================================
-- 1. payments — add AR/OR transaction type + category
-- ============================================================================
alter table public.payments
  add column if not exists transaction_type text not null default 'AR' check (transaction_type in ('AR', 'OR')),
  add column if not exists payment_category text;

-- ============================================================================
-- 2. cash_vouchers — outbound cash release requests
-- ============================================================================
create table if not exists public.cash_vouchers (
  id                uuid primary key default gen_random_uuid(),
  school_id         uuid references public.schools(id) on delete set null on update cascade,
  voucher_no        text not null unique,
  payee_type        text not null check (payee_type in ('Student', 'External')),
  payee_student_id  uuid references public.students(id) on delete set null on update cascade,
  payee_name        text not null,
  category          text not null,
  amount            numeric not null check (amount > 0),
  purpose           text not null,
  requested_by      text not null,
  requested_at      timestamptz not null default now(),
  status            text not null default 'Pending Approval'
                       check (status in ('Pending Approval', 'Approved', 'Rejected', 'Released')),
  approved_by       text,
  approved_at       timestamptz,
  review_remarks    text,
  released_by       text,
  released_at       timestamptz,
  reference_no      text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_cash_vouchers_school on public.cash_vouchers (school_id);
create index if not exists idx_cash_vouchers_status on public.cash_vouchers (status);
create index if not exists idx_cash_vouchers_payee_student on public.cash_vouchers (payee_student_id);

drop trigger if exists trg_cash_vouchers_touch on public.cash_vouchers;
create trigger trg_cash_vouchers_touch before update on public.cash_vouchers
  for each row execute function public.security_touch_updated_at();

alter table public.cash_vouchers enable row level security;
drop policy if exists "cash_vouchers_select_anon_auth" on public.cash_vouchers;
create policy "cash_vouchers_select_anon_auth" on public.cash_vouchers for select to anon, authenticated using (true);
drop policy if exists "cash_vouchers_insert_anon_auth" on public.cash_vouchers;
create policy "cash_vouchers_insert_anon_auth" on public.cash_vouchers for insert to anon, authenticated with check (true);
drop policy if exists "cash_vouchers_update_anon_auth" on public.cash_vouchers;
create policy "cash_vouchers_update_anon_auth" on public.cash_vouchers for update to anon, authenticated using (true) with check (true);
drop policy if exists "cash_vouchers_delete_anon_auth" on public.cash_vouchers;
create policy "cash_vouchers_delete_anon_auth" on public.cash_vouchers for delete to anon, authenticated using (true);

-- ============================================================================
-- 3. security_permissions — new Cashier sub-pages
-- ============================================================================
insert into public.security_permissions (module_key, page_key, action_key, label, sort_order) values
  ('CASHIER', 'other-payments', 'view',   'Other Payments (OR) — View', 330),
  ('CASHIER', 'other-payments', 'create', 'Other Payments (OR) — Collect', 331),
  ('CASHIER', 'other-payments', 'print',  'Other Payments (OR) — Print Receipt', 332),
  ('CASHIER', 'vouchers',       'view',    'Cash Vouchers — View', 340),
  ('CASHIER', 'vouchers',       'create',  'Cash Vouchers — Request', 341),
  ('CASHIER', 'vouchers',       'approve', 'Cash Vouchers — Approve', 342),
  ('CASHIER', 'vouchers',       'reject',  'Cash Vouchers — Reject', 343),
  ('CASHIER', 'vouchers',       'post',    'Cash Vouchers — Release Cash', 344),
  ('CASHIER', 'vouchers',       'print',   'Cash Vouchers — Print Voucher', 345)
on conflict (module_key, coalesce(page_key, ''), action_key) do nothing;

-- ============================================================================
-- 4. security_role_permissions — default grants
--    CASHIER: full working access to both new pages except approve/reject.
--    ACCOUNTING: view + approve/reject on vouchers (oversight/approval),
--    view on other-payments. Refinable later via the Page Assignment UI.
-- ============================================================================
insert into public.security_role_permissions (role_id, permission_id, is_allowed)
select r.id, p.id, true
from public.security_roles r
join public.security_permissions p on p.module_key = 'CASHIER' and p.page_key in ('other-payments', 'vouchers')
where r.code = 'CASHIER' and p.action_key <> 'approve' and p.action_key <> 'reject'
on conflict (role_id, permission_id) do nothing;

insert into public.security_role_permissions (role_id, permission_id, is_allowed)
select r.id, p.id, true
from public.security_roles r
join public.security_permissions p
  on p.module_key = 'CASHIER'
 and (
   (p.page_key = 'vouchers' and p.action_key in ('view', 'approve', 'reject'))
   or (p.page_key = 'other-payments' and p.action_key = 'view')
 )
where r.code = 'ACCOUNTING'
on conflict (role_id, permission_id) do nothing;

-- SUPER_ADMIN → all newly-added permissions too. The original RBAC migration
-- (20260701120000, §10a) granted SUPER_ADMIN every permission that existed at
-- that time via a cross join; it does not retroactively cover rows inserted
-- by later migrations, so each migration that adds permissions must re-grant
-- SUPER_ADMIN explicitly to keep "SUPER_ADMIN = full access" true.
insert into public.security_role_permissions (role_id, permission_id, is_allowed)
select r.id, p.id, true
from public.security_roles r
join public.security_permissions p on p.module_key = 'CASHIER' and p.page_key in ('other-payments', 'vouchers')
where r.code = 'SUPER_ADMIN'
on conflict (role_id, permission_id) do nothing;

-- ============================================================================
-- 5. setup_items — reference lists for the new categories
-- ============================================================================
insert into public.setup_items (legacy_id, category, code, name, description, is_active, sort_order, metadata, created_by, created_at) values
  ('opc-1', 'other_payment_categories', 'TRANSCRIPT',  'Transcript Fee',    'Official transcript of records request', true, 0, '{}'::jsonb, 'Admin Administrator', now()),
  ('opc-2', 'other_payment_categories', 'ID_REPLACE',  'ID Replacement',    'Replacement of lost/damaged school ID',  true, 1, '{}'::jsonb, 'Admin Administrator', now()),
  ('opc-3', 'other_payment_categories', 'CERTIFICATION','Certification',    'Certificate of enrollment/graduation/etc.', true, 2, '{}'::jsonb, 'Admin Administrator', now()),
  ('opc-4', 'other_payment_categories', 'LIBRARY_FINE','Library Fine',      'Overdue/lost library material fine',     true, 3, '{}'::jsonb, 'Admin Administrator', now()),
  ('opc-5', 'other_payment_categories', 'MISC',        'Miscellaneous',     'Other walk-in/miscellaneous collection', true, 4, '{}'::jsonb, 'Admin Administrator', now()),
  ('cvc-1', 'cash_voucher_categories',  'REFUND',      'Refund / Overpayment', 'Refund of student overpayment',       true, 0, '{}'::jsonb, 'Admin Administrator', now()),
  ('cvc-2', 'cash_voucher_categories',  'REIMBURSE',   'Reimbursement',     'Staff/vendor reimbursement',             true, 1, '{}'::jsonb, 'Admin Administrator', now()),
  ('cvc-3', 'cash_voucher_categories',  'PETTY_CASH',  'Petty Cash Release','Operational petty cash disbursement',    true, 2, '{}'::jsonb, 'Admin Administrator', now())
on conflict do nothing;

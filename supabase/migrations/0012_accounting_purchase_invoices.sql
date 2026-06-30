-- ============================================================================
-- STSN Connect - Accounting Module: Purchase Invoice
-- Phase 3 payable invoices posted to AP and Expense accounts.
-- ============================================================================

create table if not exists public.purchase_invoices (
  id                  uuid          primary key default gen_random_uuid(),
  legacy_id           text          unique,
  invoice_no          text          not null unique,
  supplier_invoice_no text,
  invoice_date        date          not null,
  due_date            date          not null,
  supplier_id         uuid          references public.suppliers (id) on delete set null,
  supplier_code       text,
  supplier_name       text          not null,
  ap_gl_account_code  text          not null references public.chart_of_accounts (code) on update cascade on delete restrict,
  subtotal            numeric(15,2) not null default 0,
  total_amount        numeric(15,2) not null default 0,
  status              text          not null default 'Draft' check (status in ('Draft','Posted','Paid','Void')),
  journal_entry_id    uuid          references public.journal_entries (id) on delete set null,
  notes               text,
  school_id           uuid          references public.schools (id) on delete set null,
  created_at          timestamptz   not null default now(),
  updated_at          timestamptz   not null default now()
);

create table if not exists public.purchase_invoice_lines (
  id                      uuid          primary key default gen_random_uuid(),
  legacy_id               text          unique,
  purchase_invoice_id     uuid          not null references public.purchase_invoices (id) on delete cascade,
  line_no                 smallint      not null check (line_no > 0),
  item_id                 uuid          references public.items (id) on delete set null,
  item_code               text,
  description             text          not null,
  quantity                numeric(12,2) not null default 1 check (quantity > 0),
  unit_cost               numeric(12,2) not null default 0 check (unit_cost >= 0),
  expense_gl_account_code text          not null references public.chart_of_accounts (code) on update cascade on delete restrict,
  line_total              numeric(15,2) not null default 0,
  created_at              timestamptz   not null default now(),
  updated_at              timestamptz   not null default now(),
  unique (purchase_invoice_id, line_no)
);

create index if not exists idx_purchase_invoices_no          on public.purchase_invoices (invoice_no);
create index if not exists idx_purchase_invoices_date        on public.purchase_invoices (invoice_date);
create index if not exists idx_purchase_invoices_due_date    on public.purchase_invoices (due_date);
create index if not exists idx_purchase_invoices_status      on public.purchase_invoices (status);
create index if not exists idx_purchase_invoices_supplier_id on public.purchase_invoices (supplier_id);
create index if not exists idx_purchase_invoice_lines_inv_id on public.purchase_invoice_lines (purchase_invoice_id);
create index if not exists idx_purchase_invoice_lines_item   on public.purchase_invoice_lines (item_id);

alter table public.purchase_invoices enable row level security;
create policy "purchase_invoices_select_anon_auth" on public.purchase_invoices for select to anon, authenticated using (true);
create policy "purchase_invoices_insert_anon_auth" on public.purchase_invoices for insert to anon, authenticated with check (true);
create policy "purchase_invoices_update_anon_auth" on public.purchase_invoices for update to anon, authenticated using (true) with check (true);
create policy "purchase_invoices_delete_anon_auth" on public.purchase_invoices for delete to anon, authenticated using (true);

alter table public.purchase_invoice_lines enable row level security;
create policy "purchase_invoice_lines_select_anon_auth" on public.purchase_invoice_lines for select to anon, authenticated using (true);
create policy "purchase_invoice_lines_insert_anon_auth" on public.purchase_invoice_lines for insert to anon, authenticated with check (true);
create policy "purchase_invoice_lines_update_anon_auth" on public.purchase_invoice_lines for update to anon, authenticated using (true) with check (true);
create policy "purchase_invoice_lines_delete_anon_auth" on public.purchase_invoice_lines for delete to anon, authenticated using (true);

insert into public.purchase_invoices (
  legacy_id, invoice_no, supplier_invoice_no, invoice_date, due_date,
  supplier_id, supplier_code, supplier_name, ap_gl_account_code,
  subtotal, total_amount, status, notes
) values
  ('pi-1001', 'PI-2026-1001', 'ABS-INV-7781', '2026-06-06', '2026-07-06',
    (select id from public.suppliers where legacy_id = 'sup-1000'),
    'SUP-1000', 'ABC Educational Supplies', '2110', 3600, 3600, 'Posted',
    'Classroom supplies and book package purchase posted for AP aging demo.'),
  ('pi-1002', 'PI-2026-1002', 'MER-062026', '2026-06-10', '2026-06-25',
    (select id from public.suppliers where legacy_id = 'sup-1020'),
    'SUP-1020', 'Meralco', '2110', 12000, 12000, 'Posted',
    'Monthly electricity billing for campus operations posted for AP aging demo.')
on conflict do nothing;

insert into public.purchase_invoice_lines (
  legacy_id, purchase_invoice_id, line_no, item_id, item_code, description,
  quantity, unit_cost, expense_gl_account_code, line_total
) values
  ('pil-1001-1',
    (select id from public.purchase_invoices where legacy_id = 'pi-1001'),
    1,
    (select id from public.items where legacy_id = 'item-1000'),
    'ITM-1000', 'Basic Education Book Package', 1, 3600, '5230', 3600),
  ('pil-1002-1',
    (select id from public.purchase_invoices where legacy_id = 'pi-1002'),
    1,
    null,
    'UTIL-ELEC', 'Electricity utility billing', 1, 12000, '5210', 12000)
on conflict do nothing;

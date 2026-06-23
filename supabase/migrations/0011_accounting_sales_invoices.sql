-- ============================================================================
-- STSN Connect - Accounting Module: Sales Invoice
-- Phase 3 receivable invoices posted to AR and Revenue accounts.
-- ============================================================================

create table if not exists public.sales_invoices (
  id                  uuid          primary key default gen_random_uuid(),
  legacy_id           text          unique,
  invoice_no          text          not null unique,
  invoice_date        date          not null,
  due_date            date          not null,
  customer_type       text          not null default 'Student',
  customer_id         uuid          references public.students (id) on delete set null,
  customer_name       text          not null,
  customer_no         text,
  ar_gl_account_code  text          not null references public.chart_of_accounts (code) on update cascade on delete restrict,
  subtotal            numeric(15,2) not null default 0,
  discount_amount     numeric(15,2) not null default 0,
  total_amount        numeric(15,2) not null default 0,
  status              text          not null default 'Draft' check (status in ('Draft','Posted','Paid','Void')),
  journal_entry_id    uuid          references public.journal_entries (id) on delete set null,
  notes               text,
  school_id           uuid          references public.schools (id) on delete set null,
  created_at          timestamptz   not null default now(),
  updated_at          timestamptz   not null default now()
);

create table if not exists public.sales_invoice_lines (
  id                      uuid          primary key default gen_random_uuid(),
  legacy_id               text          unique,
  sales_invoice_id        uuid          not null references public.sales_invoices (id) on delete cascade,
  line_no                 smallint      not null check (line_no > 0),
  item_id                 uuid          references public.items (id) on delete set null,
  item_code               text,
  description             text          not null,
  quantity                numeric(12,2) not null default 1 check (quantity > 0),
  unit_price              numeric(12,2) not null default 0 check (unit_price >= 0),
  revenue_gl_account_code text          not null references public.chart_of_accounts (code) on update cascade on delete restrict,
  line_total              numeric(15,2) not null default 0,
  created_at              timestamptz   not null default now(),
  updated_at              timestamptz   not null default now(),
  unique (sales_invoice_id, line_no)
);

create index if not exists idx_sales_invoices_no          on public.sales_invoices (invoice_no);
create index if not exists idx_sales_invoices_date        on public.sales_invoices (invoice_date);
create index if not exists idx_sales_invoices_due_date    on public.sales_invoices (due_date);
create index if not exists idx_sales_invoices_status      on public.sales_invoices (status);
create index if not exists idx_sales_invoices_customer_id on public.sales_invoices (customer_id);
create index if not exists idx_sales_invoice_lines_inv_id on public.sales_invoice_lines (sales_invoice_id);
create index if not exists idx_sales_invoice_lines_item   on public.sales_invoice_lines (item_id);

alter table public.sales_invoices enable row level security;
create policy "sales_invoices_select_anon_auth" on public.sales_invoices for select to anon, authenticated using (true);
create policy "sales_invoices_insert_anon_auth" on public.sales_invoices for insert to anon, authenticated with check (true);
create policy "sales_invoices_update_anon_auth" on public.sales_invoices for update to anon, authenticated using (true) with check (true);
create policy "sales_invoices_delete_anon_auth" on public.sales_invoices for delete to anon, authenticated using (true);

alter table public.sales_invoice_lines enable row level security;
create policy "sales_invoice_lines_select_anon_auth" on public.sales_invoice_lines for select to anon, authenticated using (true);
create policy "sales_invoice_lines_insert_anon_auth" on public.sales_invoice_lines for insert to anon, authenticated with check (true);
create policy "sales_invoice_lines_update_anon_auth" on public.sales_invoice_lines for update to anon, authenticated using (true) with check (true);
create policy "sales_invoice_lines_delete_anon_auth" on public.sales_invoice_lines for delete to anon, authenticated using (true);

insert into public.sales_invoices (
  legacy_id, invoice_no, invoice_date, due_date, customer_id, customer_name, customer_no,
  ar_gl_account_code, subtotal, discount_amount, total_amount, status, notes
) values
  ('si-1001', 'SI-2026-1001', '2026-06-03', '2026-07-03',
    (select id from public.students where legacy_id = 'stud-enrico'),
    'Santos, Enrico', 'STSN-2026-0001', '1130', 4500, 0, 4500, 'Draft',
    'Book package invoice prepared for posting.'),
  ('si-1002', 'SI-2026-1002', '2026-06-05', '2026-07-05',
    (select id from public.students where legacy_id = 'stud-clara'),
    'Reyes, Clara', 'STSN-2026-0002', '1130', 3500, 0, 3500, 'Draft',
    'Laboratory fee receivable.')
on conflict do nothing;

insert into public.sales_invoice_lines (
  legacy_id, sales_invoice_id, line_no, item_id, item_code, description,
  quantity, unit_price, revenue_gl_account_code, line_total
) values
  ('sil-1001-1',
    (select id from public.sales_invoices where legacy_id = 'si-1001'),
    1,
    (select id from public.items where legacy_id = 'item-1000'),
    'ITM-1000', 'Basic Education Book Package', 1, 4500, '4300', 4500),
  ('sil-1002-1',
    (select id from public.sales_invoices where legacy_id = 'si-1002'),
    1,
    (select id from public.items where legacy_id = 'item-2000'),
    'SRV-2000', 'Laboratory Usage Fee', 1, 3500, '4200', 3500)
on conflict do nothing;

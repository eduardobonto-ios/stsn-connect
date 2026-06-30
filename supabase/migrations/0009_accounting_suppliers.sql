-- ============================================================================
-- STSN Connect — Accounting Module: Supplier Management
-- Phase 3 prerequisite for Purchase Invoice and AP Aging.
-- ============================================================================

create table if not exists public.suppliers (
  id                      uuid        primary key default gen_random_uuid(),
  legacy_id               text        unique,
  supplier_code           text        not null unique,
  name                    text        not null,
  tin                     text,
  contact_person          text,
  email                   text,
  phone                   text,
  address                 text,
  payment_terms           text        not null default 'Due on Receipt',
  default_gl_account_code text        references public.chart_of_accounts (code) on update cascade on delete set null,
  status                  text        not null default 'Active' check (status in ('Active','Inactive','Blocked')),
  notes                   text,
  school_id               uuid        references public.schools (id) on delete set null,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists idx_suppliers_code      on public.suppliers (supplier_code);
create index if not exists idx_suppliers_name      on public.suppliers (name);
create index if not exists idx_suppliers_status    on public.suppliers (status);
create index if not exists idx_suppliers_school_id on public.suppliers (school_id);

alter table public.suppliers enable row level security;
create policy "suppliers_select_anon_auth" on public.suppliers for select to anon, authenticated using (true);
create policy "suppliers_insert_anon_auth" on public.suppliers for insert to anon, authenticated with check (true);
create policy "suppliers_update_anon_auth" on public.suppliers for update to anon, authenticated using (true) with check (true);
create policy "suppliers_delete_anon_auth" on public.suppliers for delete to anon, authenticated using (true);

insert into public.suppliers (
  legacy_id, supplier_code, name, tin, contact_person, email, phone,
  address, payment_terms, default_gl_account_code, status, notes
) values
  ('sup-1000', 'SUP-1000', 'ABC Educational Supplies', '123-456-789-000', 'Liza Mercado', 'sales@abcedusupplies.example', '+63 2 8123 4567', 'Quezon City, Metro Manila', 'Net 30', '5230', 'Active', 'Primary classroom and office supplies vendor.'),
  ('sup-1010', 'SUP-1010', 'Northstar Books Distribution', '222-333-444-000', 'Mark Reyes', 'orders@northstarbooks.example', '+63 917 555 0142', 'Valenzuela City, Metro Manila', 'Net 15', '4300', 'Active', 'Book package fulfillment and learning materials.'),
  ('sup-1020', 'SUP-1020', 'Meralco', '000-000-000-001', 'Business Center', 'businesscenter@meralco.example', '+63 2 16211', 'Metro Manila', 'Due on Receipt', '5210', 'Active', 'Electric utility supplier.'),
  ('sup-1030', 'SUP-1030', 'Facilities Repair Services Co.', '555-666-777-000', 'Ana Cruz', 'billing@facilityrepair.example', '+63 917 777 1200', 'Caloocan City, Metro Manila', 'Net 30', '5240', 'Active', 'Maintenance contractor for campus repairs.')
on conflict do nothing;

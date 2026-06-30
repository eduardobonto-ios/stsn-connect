-- ============================================================================
-- STSN Connect - Accounting Module: Item / Product Management
-- Phase 3 catalog used by Sales Invoice and Purchase Invoice workflows.
-- ============================================================================

create table if not exists public.items (
  id                        uuid        primary key default gen_random_uuid(),
  legacy_id                 text        unique,
  item_code                 text        not null unique,
  name                      text        not null,
  type                      text        not null default 'Product' check (type in ('Product','Service')),
  description               text,
  unit                      text        not null default 'Each',
  sales_price               numeric(12,2) not null default 0,
  purchase_cost             numeric(12,2) not null default 0,
  revenue_gl_account_code   text        references public.chart_of_accounts (code) on update cascade on delete set null,
  expense_gl_account_code   text        references public.chart_of_accounts (code) on update cascade on delete set null,
  inventory_gl_account_code text        references public.chart_of_accounts (code) on update cascade on delete set null,
  status                    text        not null default 'Active' check (status in ('Active','Inactive')),
  school_id                 uuid        references public.schools (id) on delete set null,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index if not exists idx_items_code      on public.items (item_code);
create index if not exists idx_items_name      on public.items (name);
create index if not exists idx_items_type      on public.items (type);
create index if not exists idx_items_status    on public.items (status);
create index if not exists idx_items_school_id on public.items (school_id);

alter table public.items enable row level security;
create policy "items_select_anon_auth" on public.items for select to anon, authenticated using (true);
create policy "items_insert_anon_auth" on public.items for insert to anon, authenticated with check (true);
create policy "items_update_anon_auth" on public.items for update to anon, authenticated using (true) with check (true);
create policy "items_delete_anon_auth" on public.items for delete to anon, authenticated using (true);

insert into public.items (
  legacy_id, item_code, name, type, description, unit, sales_price, purchase_cost,
  revenue_gl_account_code, expense_gl_account_code, inventory_gl_account_code, status
) values
  ('item-1000', 'ITM-1000', 'Basic Education Book Package', 'Product', 'Standard book package sold to Basic Education students.', 'Package', 4500, 3600, '4300', '5230', null, 'Active'),
  ('item-1010', 'ITM-1010', 'School Uniform Set', 'Product', 'Uniform bundle for student billing and purchase tracking.', 'Set', 1800, 1200, '4300', '5230', null, 'Active'),
  ('item-2000', 'SRV-2000', 'Laboratory Usage Fee', 'Service', 'Lab usage and consumables billed to students.', 'Fee', 3500, 0, '4200', '5220', null, 'Active'),
  ('item-2010', 'SRV-2010', 'ID Replacement Service', 'Service', 'Replacement ID card service fee.', 'Each', 250, 80, '4300', '5230', null, 'Active')
on conflict do nothing;

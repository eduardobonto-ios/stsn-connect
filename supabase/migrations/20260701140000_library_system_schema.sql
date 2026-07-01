-- ============================================================================
-- STSN CONNECT — Library System schema (LIBRARY_SYSTEM module)
-- Migration: 20260701140000_library_system_schema.sql
-- ----------------------------------------------------------------------------
-- Adds a school lending Library System, following the audit/plan in
-- docs/library/LIBRARY_SYSTEM_AUDIT_AND_IMPLEMENTATION_PLAN.md.
--
--   Reference / maintenance : library_book_categories, library_book_subjects,
--                             library_shelves, library_fine_rules
--   Catalog & inventory     : library_books, library_book_copies
--   Borrowing / returns      : library_borrow_transactions,
--                             library_borrow_transaction_items
--   Fines                    : library_fines
--
-- Design notes / safety:
--   * NEW domain. This is a lending library — distinct from the existing
--     BOOKS_SETUP "Book Packages" fee/tuition feature. No existing table is
--     altered; the only writes to existing tables are additive RBAC seed rows.
--   * Additive & idempotent. Uses `create table if not exists`,
--     `create index if not exists`, `drop trigger/policy if exists`, and
--     `on conflict do nothing`, so it is safe to re-run.
--   * Multi-school: every domain table carries school_id -> public.schools(id).
--   * RLS follows the project's demo posture: permissive anon + authenticated
--     CRUD, because the app uses the anon key with no signed-in session. Access
--     enforcement lives at the app layer (usePermissions). TIGHTEN BEFORE PROD.
--   * borrower_ref_id is POLYMORPHIC (students.id | employees.id, keyed by
--     borrower_type) and therefore has NO hard FK; borrower_name / borrower_no
--     are snapshotted so history survives source-record changes.
-- ============================================================================

-- ── helper: updated_at trigger ───────────────────────────────────────────────
create or replace function public.library_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- 1. REFERENCE / MAINTENANCE TABLES
-- ============================================================================

-- 1.1 Book categories -------------------------------------------------------
create table if not exists public.library_book_categories (
  id          uuid        primary key default gen_random_uuid(),
  school_id   uuid        references public.schools(id) on delete set null on update cascade,
  code        text        not null,
  name        text        not null,
  description text,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  text
);

create unique index if not exists ux_library_book_categories_school_code
  on public.library_book_categories (school_id, code);

-- 1.2 Subject tags ----------------------------------------------------------
create table if not exists public.library_book_subjects (
  id          uuid        primary key default gen_random_uuid(),
  school_id   uuid        references public.schools(id) on delete set null on update cascade,
  name        text        not null,
  description text,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  text
);

create unique index if not exists ux_library_book_subjects_school_name
  on public.library_book_subjects (school_id, name);

-- 1.3 Shelves / physical location ------------------------------------------
create table if not exists public.library_shelves (
  id          uuid        primary key default gen_random_uuid(),
  school_id   uuid        references public.schools(id) on delete set null on update cascade,
  code        text        not null,
  name        text        not null,
  location    text,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  text
);

create unique index if not exists ux_library_shelves_school_code
  on public.library_shelves (school_id, code);

-- 1.4 Fine rules ------------------------------------------------------------
create table if not exists public.library_fine_rules (
  id             uuid        primary key default gen_random_uuid(),
  school_id      uuid        references public.schools(id) on delete set null on update cascade,
  name           text        not null,
  fine_per_day   numeric     not null default 0,
  grace_days     integer     not null default 0,
  max_fine       numeric,
  lost_fee_mode  text        not null default 'replacement_cost'
                             check (lost_fee_mode in ('fixed', 'replacement_cost', 'multiplier')),
  lost_fee_value numeric,
  effective_from date        not null default current_date,
  is_active      boolean     not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  created_by     text
);

create index if not exists ix_library_fine_rules_school on public.library_fine_rules (school_id);

-- ============================================================================
-- 2. CATALOG & INVENTORY
-- ============================================================================

-- 2.1 Books (title-level catalog) ------------------------------------------
create table if not exists public.library_books (
  id                       uuid        primary key default gen_random_uuid(),
  school_id                uuid        references public.schools(id) on delete set null on update cascade,
  isbn                     text,
  title                    text        not null,
  author                   text,
  publisher                text,
  publication_year         integer,
  category_id              uuid        references public.library_book_categories(id) on delete set null,
  subject_id               uuid        references public.library_book_subjects(id) on delete set null,
  grade_level_applicability text[],
  edition                  text,
  language                 text,
  description              text,
  status                   text        not null default 'Active'
                                       check (status in ('Active', 'Inactive', 'Archived')),
  is_active                boolean     not null default true,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  created_by               text
);

create index if not exists ix_library_books_school    on public.library_books (school_id);
create index if not exists ix_library_books_category  on public.library_books (category_id);
create index if not exists ix_library_books_isbn      on public.library_books (isbn);

-- 2.2 Book copies (physical inventory) -------------------------------------
create table if not exists public.library_book_copies (
  id               uuid        primary key default gen_random_uuid(),
  school_id        uuid        references public.schools(id) on delete set null on update cascade,
  book_id          uuid        not null references public.library_books(id) on delete cascade,
  accession_no     text        not null unique,
  shelf_id         uuid        references public.library_shelves(id) on delete set null,
  acquisition_date date,
  acquisition_cost numeric,
  condition        text        not null default 'Good'
                               check (condition in ('New', 'Good', 'Fair', 'Poor')),
  copy_status      text        not null default 'AVAILABLE'
                               check (copy_status in ('AVAILABLE', 'BORROWED', 'RESERVED', 'LOST', 'DAMAGED', 'ARCHIVED')),
  remarks          text,
  is_active        boolean     not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       text
);

create index if not exists ix_library_book_copies_book   on public.library_book_copies (book_id);
create index if not exists ix_library_book_copies_status on public.library_book_copies (copy_status);

-- ============================================================================
-- 3. BORROWING / RETURNS (header + items)
-- ============================================================================

-- 3.1 Borrow transactions (checkout header) --------------------------------
create table if not exists public.library_borrow_transactions (
  id             uuid        primary key default gen_random_uuid(),
  school_id      uuid        references public.schools(id) on delete set null on update cascade,
  transaction_no text        not null unique,
  borrower_type  text        not null
                             check (borrower_type in ('STUDENT', 'EMPLOYEE', 'FACULTY')),
  borrower_ref_id uuid,      -- polymorphic: students.id | employees.id (no FK)
  borrower_name  text,
  borrower_no    text,
  checkout_date  date        not null default current_date,
  due_date       date        not null,
  status         text        not null default 'BORROWED'
                             check (status in ('BORROWED', 'RETURNED', 'OVERDUE', 'LOST', 'DAMAGED', 'CANCELLED')),
  issued_by      text,
  remarks        text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  created_by     text
);

create index if not exists ix_library_borrow_transactions_borrower on public.library_borrow_transactions (borrower_ref_id);
create index if not exists ix_library_borrow_transactions_status   on public.library_borrow_transactions (status);
create index if not exists ix_library_borrow_transactions_due      on public.library_borrow_transactions (due_date);

-- 3.2 Borrow transaction items (one row per copy) --------------------------
create table if not exists public.library_borrow_transaction_items (
  id                 uuid        primary key default gen_random_uuid(),
  transaction_id     uuid        not null references public.library_borrow_transactions(id) on delete cascade,
  copy_id            uuid        not null references public.library_book_copies(id),
  book_id            uuid        references public.library_books(id),
  due_date           date,
  return_date        date,
  returned_condition text        check (returned_condition in ('New', 'Good', 'Fair', 'Poor')),
  item_status        text        not null default 'BORROWED'
                                 check (item_status in ('BORROWED', 'RETURNED', 'OVERDUE', 'LOST', 'DAMAGED')),
  overdue_days       integer     not null default 0,
  remarks            text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists ix_library_borrow_items_transaction on public.library_borrow_transaction_items (transaction_id);
create index if not exists ix_library_borrow_items_copy        on public.library_borrow_transaction_items (copy_id);
create index if not exists ix_library_borrow_items_status      on public.library_borrow_transaction_items (item_status);

-- ============================================================================
-- 4. FINES
-- ============================================================================
create table if not exists public.library_fines (
  id                  uuid        primary key default gen_random_uuid(),
  school_id           uuid        references public.schools(id) on delete set null on update cascade,
  transaction_item_id uuid        references public.library_borrow_transaction_items(id) on delete set null,
  transaction_id      uuid        references public.library_borrow_transactions(id) on delete set null,
  borrower_type       text        check (borrower_type in ('STUDENT', 'EMPLOYEE', 'FACULTY')),
  borrower_ref_id     uuid,       -- polymorphic (no FK)
  borrower_name       text,
  fine_type           text        not null
                                  check (fine_type in ('OVERDUE', 'LOST', 'DAMAGED')),
  amount              numeric     not null default 0,
  status              text        not null default 'PENDING'
                                  check (status in ('PENDING', 'PAID', 'WAIVED', 'CANCELLED')),
  assessed_date       date        not null default current_date,
  settled_date        date,
  waived_reason       text,
  payment_id          uuid        references public.payments(id) on delete set null,
  or_number           text,
  settlement_remarks  text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  created_by          text
);

create index if not exists ix_library_fines_borrower on public.library_fines (borrower_ref_id);
create index if not exists ix_library_fines_status   on public.library_fines (status);
create index if not exists ix_library_fines_item     on public.library_fines (transaction_item_id);

-- ============================================================================
-- 5. updated_at triggers (all library tables)
-- ============================================================================
do $$
declare
  t text;
  lib_tables text[] := array[
    'library_book_categories', 'library_book_subjects', 'library_shelves',
    'library_fine_rules', 'library_books', 'library_book_copies',
    'library_borrow_transactions', 'library_borrow_transaction_items', 'library_fines'
  ];
begin
  foreach t in array lib_tables loop
    execute format('drop trigger if exists %I on public.%I;', 'trg_' || t || '_touch', t);
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.library_touch_updated_at();',
      'trg_' || t || '_touch', t
    );
  end loop;
end $$;

-- ============================================================================
-- 6. Row Level Security (demo posture: permissive anon + authenticated CRUD)
--    TIGHTEN BEFORE PRODUCTION together with the rest of the schema.
-- ============================================================================
do $$
declare
  t text;
  lib_tables text[] := array[
    'library_book_categories', 'library_book_subjects', 'library_shelves',
    'library_fine_rules', 'library_books', 'library_book_copies',
    'library_borrow_transactions', 'library_borrow_transaction_items', 'library_fines'
  ];
begin
  foreach t in array lib_tables loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I on public.%I;', t || '_all_anon_auth', t);
    execute format(
      'create policy %I on public.%I for all to anon, authenticated using (true) with check (true);',
      t || '_all_anon_auth', t
    );
  end loop;
end $$;

-- ============================================================================
-- 7. SEED — reference data (non-optional). Seeded per demo school (STSN, CDSTA).
-- ============================================================================
do $$
declare
  v_school_code text;
  v_school_id   uuid;
begin
  foreach v_school_code in array array['STSN', 'CDSTA'] loop
    select id into v_school_id from public.schools where code = v_school_code limit 1;
    continue when v_school_id is null;

    -- Categories -------------------------------------------------------------
    insert into public.library_book_categories (school_id, code, name) values
      (v_school_id, 'FIC',  'Fiction'),
      (v_school_id, 'NON',  'Non-Fiction'),
      (v_school_id, 'REF',  'Reference'),
      (v_school_id, 'TXT',  'Textbook'),
      (v_school_id, 'PER',  'Periodical'),
      (v_school_id, 'CHI',  'Children''s'),
      (v_school_id, 'FIL',  'Filipiniana')
    on conflict (school_id, code) do nothing;

    -- Subjects ---------------------------------------------------------------
    insert into public.library_book_subjects (school_id, name) values
      (v_school_id, 'Mathematics'),
      (v_school_id, 'Science'),
      (v_school_id, 'English'),
      (v_school_id, 'Filipino'),
      (v_school_id, 'Araling Panlipunan'),
      (v_school_id, 'MAPEH'),
      (v_school_id, 'Values Education'),
      (v_school_id, 'Computer/ICT')
    on conflict (school_id, name) do nothing;

    -- Shelves ----------------------------------------------------------------
    insert into public.library_shelves (school_id, code, name, location) values
      (v_school_id, 'A1', 'Shelf A1', 'Main Reading Area'),
      (v_school_id, 'A2', 'Shelf A2', 'Main Reading Area'),
      (v_school_id, 'A3', 'Shelf A3', 'Main Reading Area'),
      (v_school_id, 'B1', 'Shelf B1', 'Fiction Aisle'),
      (v_school_id, 'B2', 'Shelf B2', 'Fiction Aisle'),
      (v_school_id, 'B3', 'Shelf B3', 'Fiction Aisle'),
      (v_school_id, 'REF-01', 'Reference 01', 'Reference Section'),
      (v_school_id, 'PER-01', 'Periodical 01', 'Periodicals Corner')
    on conflict (school_id, code) do nothing;

    -- Default fine rule ------------------------------------------------------
    insert into public.library_fine_rules
      (school_id, name, fine_per_day, grace_days, max_fine, lost_fee_mode)
    select v_school_id, 'Default Overdue Rule', 5.00, 0, 500.00, 'replacement_cost'
    where not exists (
      select 1 from public.library_fine_rules
      where school_id = v_school_id and name = 'Default Overdue Rule'
    );
  end loop;
end $$;

-- ============================================================================
-- 8. SEED — optional demo catalog + copies (STSN only).
--    Gated so it does NOT pollute production. Mirrors the
--    0026_hr_demo_data_optional.sql "optional demo" pattern: guarded on the
--    demo school existing; catalog rows keyed by ISBN for idempotency.
-- ============================================================================
do $$
declare
  v_school_id uuid;
  v_cat_fic   uuid;
  v_cat_txt   uuid;
  v_cat_ref   uuid;
  v_sub_sci   uuid;
  v_sub_math  uuid;
  v_sub_eng   uuid;
  v_shelf_a1  uuid;
  v_shelf_b1  uuid;
  v_shelf_ref uuid;
  v_book      uuid;
  v_copy_seq  int := 0;
  r_book      record;
begin
  select id into v_school_id from public.schools where code = 'STSN' limit 1;
  if v_school_id is null then
    return;
  end if;

  select id into v_cat_fic  from public.library_book_categories where school_id = v_school_id and code = 'FIC' limit 1;
  select id into v_cat_txt  from public.library_book_categories where school_id = v_school_id and code = 'TXT' limit 1;
  select id into v_cat_ref  from public.library_book_categories where school_id = v_school_id and code = 'REF' limit 1;
  select id into v_sub_sci  from public.library_book_subjects where school_id = v_school_id and name = 'Science' limit 1;
  select id into v_sub_math from public.library_book_subjects where school_id = v_school_id and name = 'Mathematics' limit 1;
  select id into v_sub_eng  from public.library_book_subjects where school_id = v_school_id and name = 'English' limit 1;
  select id into v_shelf_a1  from public.library_shelves where school_id = v_school_id and code = 'A1' limit 1;
  select id into v_shelf_b1  from public.library_shelves where school_id = v_school_id and code = 'B1' limit 1;
  select id into v_shelf_ref from public.library_shelves where school_id = v_school_id and code = 'REF-01' limit 1;

  -- Guard: isbn is not a unique column, so `on conflict` cannot dedupe demo
  -- titles. Skip the whole demo-catalog block if it has already been seeded.
  if exists (
    select 1 from public.library_books
    where school_id = v_school_id and isbn like '978-971-0001-%'
  ) then
    return;
  end if;

  -- Titles ------------------------------------------------------------------
  insert into public.library_books
    (school_id, isbn, title, author, publisher, publication_year, category_id, subject_id, language, status)
  values
    (v_school_id, '978-971-0001-01', 'Noli Me Tangere',              'Jose Rizal',            'STSN Press',      2015, v_cat_fic, v_sub_eng,  'Filipino', 'Active'),
    (v_school_id, '978-971-0001-02', 'El Filibusterismo',            'Jose Rizal',            'STSN Press',      2015, v_cat_fic, v_sub_eng,  'Filipino', 'Active'),
    (v_school_id, '978-971-0001-03', 'General Mathematics',          'DepEd',                 'Vibal',           2019, v_cat_txt, v_sub_math, 'English',  'Active'),
    (v_school_id, '978-971-0001-04', 'Earth and Life Science',       'DepEd',                 'Rex Bookstore',   2018, v_cat_txt, v_sub_sci,  'English',  'Active'),
    (v_school_id, '978-971-0001-05', 'Oxford English Dictionary',    'Oxford University',     'Oxford Press',    2020, v_cat_ref, v_sub_eng,  'English',  'Active'),
    (v_school_id, '978-971-0001-06', 'Florante at Laura',            'Francisco Balagtas',    'Adarna House',    2016, v_cat_fic, v_sub_eng,  'Filipino', 'Active'),
    (v_school_id, '978-971-0001-07', 'Physics for Senior High',      'DepEd',                 'Vibal',           2019, v_cat_txt, v_sub_sci,  'English',  'Active'),
    (v_school_id, '978-971-0001-08', 'World History',                'DepEd',                 'Rex Bookstore',   2017, v_cat_txt, v_sub_eng,  'English',  'Active')
  on conflict do nothing;

  -- Copies: 2 per demo title (accession keyed uniquely; idempotent) --------
  for r_book in
    select id, isbn from public.library_books
    where school_id = v_school_id and isbn like '978-971-0001-%'
    order by isbn
  loop
    v_copy_seq := v_copy_seq + 1;
    insert into public.library_book_copies
      (school_id, book_id, accession_no, shelf_id, acquisition_date, acquisition_cost, condition, copy_status)
    values
      (v_school_id, r_book.id, 'STSN-ACC-' || lpad((v_copy_seq * 2 - 1)::text, 5, '0'),
       v_shelf_a1, current_date - 200, 350.00, 'Good', 'AVAILABLE'),
      (v_school_id, r_book.id, 'STSN-ACC-' || lpad((v_copy_seq * 2)::text, 5, '0'),
       v_shelf_b1, current_date - 200, 350.00, 'Good', 'AVAILABLE')
    on conflict (accession_no) do nothing;
  end loop;
end $$;

-- ============================================================================
-- 9. SEED — RBAC permissions (LIBRARY_SYSTEM) + role grants.
--    Mirrors the shape in 20260701120000_security_rbac_schema.sql.
-- ============================================================================

-- 9a. Module-level access ---------------------------------------------------
insert into public.security_permissions (module_key, page_key, action_key, label, sort_order) values
  ('LIBRARY_SYSTEM', null, 'view', 'View Library System', 29)
on conflict (module_key, coalesce(page_key, ''), action_key) do nothing;

-- 9b. Page-level action permissions ----------------------------------------
insert into public.security_permissions (module_key, page_key, action_key, label, sort_order) values
  ('LIBRARY_SYSTEM', 'dashboard',    'view',    'Library Dashboard — View', 800),
  ('LIBRARY_SYSTEM', 'catalog',      'view',    'Book Catalog — View', 810),
  ('LIBRARY_SYSTEM', 'catalog',      'create',  'Book Catalog — Add Title', 811),
  ('LIBRARY_SYSTEM', 'catalog',      'edit',    'Book Catalog — Edit Title', 812),
  ('LIBRARY_SYSTEM', 'catalog',      'delete',  'Book Catalog — Delete Title', 813),
  ('LIBRARY_SYSTEM', 'catalog',      'export',  'Book Catalog — Export', 814),
  ('LIBRARY_SYSTEM', 'inventory',    'view',    'Book Inventory — View', 820),
  ('LIBRARY_SYSTEM', 'inventory',    'create',  'Book Inventory — Add Copy', 821),
  ('LIBRARY_SYSTEM', 'inventory',    'edit',    'Book Inventory — Edit Copy', 822),
  ('LIBRARY_SYSTEM', 'inventory',    'delete',  'Book Inventory — Delete Copy', 823),
  ('LIBRARY_SYSTEM', 'borrowing',    'view',    'Borrowing — View', 830),
  ('LIBRARY_SYSTEM', 'borrowing',    'create',  'Borrowing — Checkout', 831),
  ('LIBRARY_SYSTEM', 'returns',      'view',    'Returns — View', 840),
  ('LIBRARY_SYSTEM', 'returns',      'manage',  'Returns — Process Return', 841),
  ('LIBRARY_SYSTEM', 'overdue',      'view',    'Overdue — View', 850),
  ('LIBRARY_SYSTEM', 'overdue',      'export',  'Overdue — Export', 851),
  ('LIBRARY_SYSTEM', 'lost-damaged', 'view',    'Lost / Damaged — View', 860),
  ('LIBRARY_SYSTEM', 'lost-damaged', 'manage',  'Lost / Damaged — Mark Lost/Damaged', 861),
  ('LIBRARY_SYSTEM', 'fines',        'view',    'Fines — View', 870),
  ('LIBRARY_SYSTEM', 'fines',        'create',  'Fines — Assess', 871),
  ('LIBRARY_SYSTEM', 'fines',        'manage',  'Fines — Settle / Void', 872),
  ('LIBRARY_SYSTEM', 'fines',        'approve', 'Fines — Waive', 873),
  ('LIBRARY_SYSTEM', 'reports',      'view',    'Library Reports — View', 880),
  ('LIBRARY_SYSTEM', 'reports',      'export',  'Library Reports — Export', 881),
  ('LIBRARY_SYSTEM', 'maintenance',  'view',    'Library Maintenance — View', 890),
  ('LIBRARY_SYSTEM', 'maintenance',  'create',  'Library Maintenance — Create', 891),
  ('LIBRARY_SYSTEM', 'maintenance',  'edit',    'Library Maintenance — Edit', 892),
  ('LIBRARY_SYSTEM', 'maintenance',  'delete',  'Library Maintenance — Delete', 893)
on conflict (module_key, coalesce(page_key, ''), action_key) do nothing;

-- 9c. Role grants -----------------------------------------------------------
-- SUPER_ADMIN → every LIBRARY_SYSTEM permission (explicit; the cross-join in
-- the RBAC migration already ran, so new rows must be granted here).
insert into public.security_role_permissions (role_id, permission_id, is_allowed)
select r.id, p.id, true
from public.security_roles r
cross join public.security_permissions p
where r.code = 'SUPER_ADMIN'
  and p.module_key = 'LIBRARY_SYSTEM'
on conflict (role_id, permission_id) do nothing;

-- ADMIN + REGISTRAR → all LIBRARY_SYSTEM permissions.
insert into public.security_role_permissions (role_id, permission_id, is_allowed)
select r.id, p.id, true
from public.security_roles r
join public.security_permissions p on p.module_key = 'LIBRARY_SYSTEM'
where r.code in ('ADMIN', 'REGISTRAR')
on conflict (role_id, permission_id) do nothing;

-- ============================================================================
-- 10. Comments
-- ============================================================================
comment on table public.library_book_categories is 'Library catalog categories (per school).';
comment on table public.library_book_subjects is 'Library subject tags (per school).';
comment on table public.library_shelves is 'Physical shelf / location catalog (per school).';
comment on table public.library_fine_rules is 'Overdue / lost fine configuration (per school).';
comment on table public.library_books is 'Title-level library catalog. Distinct from BOOKS_SETUP fee packages.';
comment on table public.library_book_copies is 'Physical book copies / inventory (accession-level).';
comment on table public.library_borrow_transactions is 'Checkout header: one borrower, one checkout event. borrower_ref_id is polymorphic (students.id | employees.id) keyed by borrower_type — no FK.';
comment on table public.library_borrow_transaction_items is 'One row per borrowed copy within a checkout.';
comment on table public.library_fines is 'Overdue / lost / damaged fines; optional cashier settlement via payment_id.';
comment on column public.library_borrow_transactions.borrower_ref_id is 'Polymorphic reference (students.id | employees.id); no FK. Resolve by borrower_type.';

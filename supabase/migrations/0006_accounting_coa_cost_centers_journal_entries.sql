-- ============================================================================
-- STSN Connect — Accounting Module: Phase 1 & Phase 2 schema
-- Phase 1: Chart of Accounts, Cost Centers
-- Phase 2: Journal Entries (header + lines)
-- ============================================================================

-- ============================================================================
-- 1. CHART OF ACCOUNTS
--    Self-referencing hierarchy via parent_code.
--    is_header marks group/header rows that cannot receive postings directly.
-- ============================================================================
create table if not exists public.chart_of_accounts (
  id             uuid        primary key default gen_random_uuid(),
  legacy_id      text        unique,
  code           text        not null unique,
  name           text        not null,
  type           text        not null check (type in ('Asset','Liability','Equity','Revenue','Expense')),
  normal_balance text        not null check (normal_balance in ('Debit','Credit')),
  parent_code    text        references public.chart_of_accounts (code) on update cascade on delete restrict,
  description    text,
  is_header      boolean     not null default false,
  status         text        not null default 'Active' check (status in ('Active','Inactive')),
  school_id      uuid        references public.schools (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_coa_parent_code on public.chart_of_accounts (parent_code);
create index if not exists idx_coa_type        on public.chart_of_accounts (type);
create index if not exists idx_coa_school_id   on public.chart_of_accounts (school_id);

-- ============================================================================
-- 2. COST CENTERS
--    Departmental/unit segments attached to journal entries.
--    gl_account_code links to the default GL account for this cost center.
-- ============================================================================
create table if not exists public.cost_centers (
  id              uuid        primary key default gen_random_uuid(),
  legacy_id       text        unique,
  code            text        not null unique,
  name            text        not null,
  type            text        not null check (type in ('Department','Program','Project','Administrative')),
  description     text,
  gl_account_code text        references public.chart_of_accounts (code) on update cascade on delete set null,
  status          text        not null default 'Active' check (status in ('Active','Inactive')),
  school_id       uuid        references public.schools (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_cc_type      on public.cost_centers (type);
create index if not exists idx_cc_school_id on public.cost_centers (school_id);

-- ============================================================================
-- 3. JOURNAL ENTRIES (header)
--    One record per accounting entry (debit/credit batch).
--    status flow: Draft → Posted → Void
--    source_type / source_id trace auto-generated entries back to their origin
--    (e.g. a payment, assessment, or sales invoice).
-- ============================================================================
create table if not exists public.journal_entries (
  id             uuid        primary key default gen_random_uuid(),
  legacy_id      text        unique,
  entry_no       text        not null unique,         -- e.g. JE-2025-2026-00001
  entry_date     date        not null,
  fiscal_year    text        not null,                -- e.g. '2025-2026'
  fiscal_period  text        not null,                -- e.g. 'June 2026'
  description    text,
  reference_no   text,                               -- OR no., receipt no., etc.
  source_type    text,                               -- 'Manual' | 'Payment' | 'Assessment' | 'Invoice'
  source_id      text,                               -- id of the originating record
  status         text        not null default 'Draft' check (status in ('Draft','Posted','Void')),
  school_id      uuid        references public.schools (id) on delete set null,
  cost_center_id uuid        references public.cost_centers (id) on delete set null,
  created_by     text        not null,
  posted_by      text,
  posted_at      timestamptz,
  voided_by      text,
  voided_at      timestamptz,
  void_reason    text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_je_entry_date  on public.journal_entries (entry_date);
create index if not exists idx_je_fiscal_year on public.journal_entries (fiscal_year);
create index if not exists idx_je_status      on public.journal_entries (status);
create index if not exists idx_je_school_id   on public.journal_entries (school_id);
create index if not exists idx_je_source      on public.journal_entries (source_type, source_id);

-- ============================================================================
-- 4. JOURNAL ENTRY LINES (detail)
--    One row per debit or credit leg.
--    Each line must have exactly one non-zero side (debit XOR credit).
--    SUM(debit_amount) = SUM(credit_amount) per journal_entry_id is enforced
--    at the application layer before posting.
-- ============================================================================
create table if not exists public.journal_entry_lines (
  id               uuid          primary key default gen_random_uuid(),
  legacy_id        text          unique,
  journal_entry_id uuid          not null references public.journal_entries (id) on delete cascade,
  line_no          smallint      not null check (line_no > 0),
  account_code     text          not null references public.chart_of_accounts (code) on update cascade on delete restrict,
  cost_center_id   uuid          references public.cost_centers (id) on delete set null,
  debit_amount     numeric(15,2) not null default 0 check (debit_amount  >= 0),
  credit_amount    numeric(15,2) not null default 0 check (credit_amount >= 0),
  description      text,
  created_at       timestamptz   not null default now(),
  updated_at       timestamptz   not null default now(),
  unique (journal_entry_id, line_no),
  -- exactly one side must be non-zero per line
  constraint chk_jel_debit_xor_credit check (
    (debit_amount > 0 and credit_amount = 0) or
    (credit_amount > 0 and debit_amount = 0)
  )
);

create index if not exists idx_jel_journal_entry_id on public.journal_entry_lines (journal_entry_id);
create index if not exists idx_jel_account_code     on public.journal_entry_lines (account_code);
create index if not exists idx_jel_cost_center_id   on public.journal_entry_lines (cost_center_id);

-- ============================================================================
-- SEED DATA — Chart of Accounts
-- ============================================================================
insert into public.chart_of_accounts (legacy_id, code, name, type, normal_balance, parent_code, description, is_header, status) values
  -- Assets
  ('coa-1000', '1000', 'Assets',                                       'Asset',     'Debit',  null,   'All school assets',                              true,  'Active'),
  ('coa-1100', '1100', 'Current Assets',                               'Asset',     'Debit',  '1000', 'Assets expected within 12 months',               true,  'Active'),
  ('coa-1110', '1110', 'Cash on Hand',                                 'Asset',     'Debit',  '1100', 'Physical cash in the cashier vault',             false, 'Active'),
  ('coa-1120', '1120', 'Cash in Bank — BDO',                           'Asset',     'Debit',  '1100', 'BDO checking account',                           false, 'Active'),
  ('coa-1130', '1130', 'Accounts Receivable — Tuition',                'Asset',     'Debit',  '1100', 'Student tuition receivables',                    false, 'Active'),
  ('coa-1140', '1140', 'Advances to Suppliers',                        'Asset',     'Debit',  '1100', 'Prepaid amounts to vendors',                     false, 'Active'),
  ('coa-1200', '1200', 'Non-Current Assets',                           'Asset',     'Debit',  '1000', 'Long-term assets',                               true,  'Active'),
  ('coa-1210', '1210', 'Furniture & Fixtures',                         'Asset',     'Debit',  '1200', 'School furniture and equipment',                 false, 'Active'),
  ('coa-1220', '1220', 'Computers & IT Equipment',                     'Asset',     'Debit',  '1200', 'Computers, printers, projectors',               false, 'Active'),
  ('coa-1230', '1230', 'Buildings & Improvements',                     'Asset',     'Debit',  '1200', 'School building value',                          false, 'Active'),
  -- Liabilities
  ('coa-2000', '2000', 'Liabilities',                                  'Liability', 'Credit', null,   'All school liabilities',                         true,  'Active'),
  ('coa-2100', '2100', 'Current Liabilities',                          'Liability', 'Credit', '2000', 'Obligations due within 12 months',              true,  'Active'),
  ('coa-2110', '2110', 'Accounts Payable',                             'Liability', 'Credit', '2100', 'Amounts owed to suppliers',                      false, 'Active'),
  ('coa-2120', '2120', 'SSS / PhilHealth / Pag-IBIG Payable',          'Liability', 'Credit', '2100', 'Government remittances due',                    false, 'Active'),
  ('coa-2130', '2130', 'Income Tax Payable',                           'Liability', 'Credit', '2100', 'BIR income tax due',                             false, 'Active'),
  ('coa-2140', '2140', 'Deferred Tuition Revenue',                     'Liability', 'Credit', '2100', 'Collected tuition for future periods',           false, 'Active'),
  -- Equity
  ('coa-3000', '3000', 'Equity',                                       'Equity',    'Credit', null,   'Owner''s equity / retained surplus',             true,  'Active'),
  ('coa-3100', '3100', 'Retained Surplus',                             'Equity',    'Credit', '3000', 'Accumulated net income',                         false, 'Active'),
  ('coa-3200', '3200', 'Current Year Surplus / Deficit',               'Equity',    'Credit', '3000', 'Net income for the current year',               false, 'Active'),
  -- Revenue
  ('coa-4000', '4000', 'Revenue',                                      'Revenue',   'Credit', null,   'All income accounts',                            true,  'Active'),
  ('coa-4100', '4100', 'Tuition Fees',                                 'Revenue',   'Credit', '4000', 'Tuition income from enrolled students',          false, 'Active'),
  ('coa-4110', '4110', 'Tuition Fees — Basic Ed',                      'Revenue',   'Credit', '4100', 'K-12 tuition fees',                             false, 'Active'),
  ('coa-4120', '4120', 'Tuition Fees — College',                       'Revenue',   'Credit', '4100', 'College / tertiary tuition fees',               false, 'Active'),
  ('coa-4200', '4200', 'Miscellaneous Fees',                           'Revenue',   'Credit', '4000', 'Lab, ID, and other school fees',                false, 'Active'),
  ('coa-4300', '4300', 'Book Package Revenue',                         'Revenue',   'Credit', '4000', 'Revenue from book package sales',               false, 'Active'),
  -- Expenses
  ('coa-5000', '5000', 'Expenses',                                     'Expense',   'Debit',  null,   'All expense accounts',                           true,  'Active'),
  ('coa-5100', '5100', 'Personnel Costs',                              'Expense',   'Debit',  '5000', 'Salaries, wages, and benefits',                  true,  'Active'),
  ('coa-5110', '5110', 'Teachers'' Salaries',                          'Expense',   'Debit',  '5100', 'Teaching staff compensation',                    false, 'Active'),
  ('coa-5120', '5120', 'Admin Staff Salaries',                         'Expense',   'Debit',  '5100', 'Non-teaching staff compensation',               false, 'Active'),
  ('coa-5130', '5130', 'SSS / PhilHealth / Pag-IBIG — Employer Share', 'Expense',   'Debit',  '5100', 'Employer share of mandatory contributions',     false, 'Active'),
  ('coa-5200', '5200', 'Operating Expenses',                           'Expense',   'Debit',  '5000', 'Day-to-day operating costs',                     true,  'Active'),
  ('coa-5210', '5210', 'Utilities — Electricity',                      'Expense',   'Debit',  '5200', 'MERALCO and other electric bills',              false, 'Active'),
  ('coa-5220', '5220', 'Utilities — Water',                            'Expense',   'Debit',  '5200', 'Water utilities',                               false, 'Active'),
  ('coa-5230', '5230', 'Supplies & Materials',                         'Expense',   'Debit',  '5200', 'Office and classroom supplies',                  false, 'Active'),
  ('coa-5240', '5240', 'Repairs & Maintenance',                        'Expense',   'Debit',  '5200', 'Facility and equipment repairs',                false, 'Active'),
  ('coa-5250', '5250', 'Depreciation',                                 'Expense',   'Debit',  '5200', 'Asset depreciation charges',                    false, 'Active')
on conflict do nothing;

-- ============================================================================
-- SEED DATA — Cost Centers
-- ============================================================================
insert into public.cost_centers (legacy_id, code, name, type, description, gl_account_code, status) values
  ('cc-1000', 'CC-1000', 'Basic Education',          'Department',     'K-12 academic operations and programs',                      '4110', 'Active'),
  ('cc-1100', 'CC-1100', 'Grade School',             'Department',     'Grades 1–6 program costs',                                   null,   'Active'),
  ('cc-1200', 'CC-1200', 'Junior High School',       'Department',     'Grades 7–10 program costs',                                  null,   'Active'),
  ('cc-1300', 'CC-1300', 'Senior High School',       'Department',     'Grades 11–12 (STEM / ABM / HUMSS tracks)',                   null,   'Active'),
  ('cc-2000', 'CC-2000', 'College / Tertiary',       'Department',     'CDSTA tertiary programs (BSIT, BSBA, etc.)',                 '4120', 'Active'),
  ('cc-3000', 'CC-3000', 'Administrative',           'Administrative', 'Finance, HR, Registrar, and support offices',               '5200', 'Active'),
  ('cc-3100', 'CC-3100', 'Finance & Accounting',     'Administrative', 'Treasury, accounting, and cashier functions',                null,   'Active'),
  ('cc-3200', 'CC-3200', 'Human Resources',          'Administrative', 'Personnel management and payroll',                           '5100', 'Active'),
  ('cc-4000', 'CC-4000', 'Facilities & Maintenance', 'Administrative', 'Building, utilities, and equipment maintenance',             '5240', 'Active'),
  ('cc-5000', 'CC-5000', 'School Improvement Fund',  'Project',        'Capital improvement and special development projects',       null,   'Active'),
  ('cc-5100', 'CC-5100', 'Library Development',      'Project',        'Book acquisition, e-resources, and library infrastructure',  null,   'Active'),
  ('cc-6000', 'CC-6000', 'Scholarship Programs',     'Program',        'Discount, scholarship, and financial assistance programs',   null,   'Active'),
  ('cc-6100', 'CC-6100', 'Athletics & Sports',       'Program',        'Intramurals, sports teams, and physical education programs', null,   'Inactive')
on conflict do nothing;

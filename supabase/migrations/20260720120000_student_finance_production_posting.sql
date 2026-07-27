-- ============================================================================
-- STSN Connect — normalized student-finance posting boundary
-- Migration: 20260720120000_student_finance_production_posting.sql
-- ============================================================================
-- This migration intentionally replaces the earlier, unapplied version.
--
-- Legacy source facts converted and archived:
--   assessments + assessment_fees
--   payments + payment_void_requests (renamed to read-only *_legacy tables)
--
-- Canonical finance facts:
--   student_finance_invoices + immutable invoice lines and payment plans
--   student_receipts + allocations + direct collections
--   allocation reversals + reallocation/void requests
--   student_finance_adjustments + immutable journal links
--
-- Derived read models:
--   assessment_financials
--   ledger_transactions
--   student_ledger_summaries
--   assessment_billing_summaries
--   payment_collection_summaries
--
-- Balances, installment standing, unapplied credit, and summaries are
-- calculated from canonical posted facts. They are not trigger-maintained
-- copies. Existing summary tables remain read-only *_legacy archives.
-- ============================================================================

begin;

select pg_advisory_xact_lock(hashtext('stsn:student-finance-production-posting'));

-- Fail immediately if the production Auth/RBAC bridge and maintenance gate
-- were not completed first. Dynamic checks preserve a clear diagnostic even
-- when the prerequisite column/table does not exist yet. Active users may be
-- linked after this schema/data cutover, but finance writes must remain closed
-- until every active application user has a Supabase Auth identity.
do $$
declare
  v_count bigint;
  v_writes_enabled boolean;
begin
  if to_regprocedure('public.app_current_user_id()') is null
     or to_regprocedure(
       'public.app_require_permission(text,text,text,uuid)'
     ) is null
     or to_regprocedure('public.app_require_finance_writes_enabled()') is null
     or to_regclass('public.system_runtime_controls') is null
     or not exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'users'
         and column_name = 'auth_user_id'
     ) then
    raise exception using
      message = 'Production Auth/RBAC bridge prerequisite is missing',
      hint = 'Apply 20260720110000_production_auth_bridge.sql and provision active users first.';
  end if;

  execute 'select count(*) from public.users where is_active and auth_user_id is null'
    into v_count;
  if v_count > 0 then
    raise notice
      '% active application users are not linked to Supabase Auth; finance writes must stay disabled until provisioning is complete.',
      v_count;
    update public.system_runtime_controls
    set enabled = false,
        changed_at = now(),
        remarks = format(
          'Finance migration may run, but writes remain closed: %s active application users still need Supabase Auth linking.',
          v_count
        )
    where control_key = 'student_finance_writes';
  end if;

  execute $sql$
    select enabled from public.system_runtime_controls
    where control_key = 'student_finance_writes'
  $sql$ into v_writes_enabled;
  if coalesce(v_writes_enabled, true) then
    raise exception using
      message = 'Student-finance maintenance gate is missing or still enabled',
      hint = 'Disable student_finance_writes before executing this migration.';
  end if;
end
$$;

select set_config('app.student_finance_migration', 'on', true);

lock table
  public.assessments,
  public.assessment_fees,
  public.payments,
  public.journal_entries,
  public.journal_entry_lines
in share row exclusive mode;

-- --------------------------------------------------------------------------
-- 1. Reference data and canonical finance facts
-- --------------------------------------------------------------------------

-- Some deployed databases were initialized from the setup-style COA before the
-- richer accounting migration shape existed. Normalize the COA columns needed
-- by finance posting without rewriting existing account rows.
alter table public.chart_of_accounts
  add column if not exists legacy_id text,
  add column if not exists type text,
  add column if not exists normal_balance text,
  add column if not exists parent_code text,
  add column if not exists description text,
  add column if not exists is_header boolean default false,
  add column if not exists is_active boolean default true,
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists status text default 'Active',
  add column if not exists school_id uuid references public.schools(id) on delete set null,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

update public.chart_of_accounts
set type = coalesce(
      nullif(type, ''),
      nullif(metadata ->> 'accountType', ''),
      case
        when code like '1%' then 'Asset'
        when code like '2%' then 'Liability'
        when code like '3%' then 'Equity'
        when code like '4%' then 'Revenue'
        when code like '5%' then 'Expense'
        else 'Asset'
      end
    ),
    normal_balance = coalesce(
      nullif(normal_balance, ''),
      case
        when coalesce(nullif(type, ''), metadata ->> 'accountType') in ('Asset', 'Expense')
          then 'Debit'
        else 'Credit'
      end
    ),
    is_header = coalesce(is_header, false),
    status = coalesce(nullif(status, ''), case when coalesce(is_active, true) then 'Active' else 'Inactive' end),
    updated_at = coalesce(updated_at, now())
where type is null
   or normal_balance is null
   or is_header is null
   or status is null
   or updated_at is null;

create unique index if not exists ux_chart_of_accounts_legacy_id
  on public.chart_of_accounts(legacy_id)
  where legacy_id is not null;

insert into public.chart_of_accounts
  (legacy_id, code, name, type, normal_balance, parent_code, description, is_header, status)
values
  ('coa-5260', '5260', 'Student Discounts & Scholarships', 'Expense', 'Debit',
   '5200', 'Approved student discounts, grants, and scholarships', false, 'Active')
on conflict do nothing;

create table if not exists public.student_payment_methods (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null unique,
  cash_account_code text not null
    references public.chart_of_accounts(code) on update cascade on delete restrict,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (length(btrim(code)) > 0),
  check (length(btrim(name)) > 0)
);

create table if not exists public.student_collection_categories (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null unique,
  revenue_account_code text not null
    references public.chart_of_accounts(code) on update cascade on delete restrict,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (length(btrim(code)) > 0),
  check (length(btrim(name)) > 0)
);

insert into public.student_payment_methods (code, name, cash_account_code)
values
  ('CASH', 'Cash', '1110'),
  ('BANK_TRANSFER', 'Bank Transfer', '1120'),
  ('GCASH', 'GCash', '1120'),
  ('CREDIT_CARD', 'Credit Card', '1120'),
  ('LEGACY_UNSPECIFIED', 'Legacy Unspecified', '1120')
on conflict (code) do update set
  name = excluded.name,
  cash_account_code = excluded.cash_account_code,
  is_active = true,
  updated_at = now();

insert into public.student_payment_methods(code, name, cash_account_code, is_active)
select
  upper(regexp_replace(i.code, '[^a-zA-Z0-9]+', '_', 'g')),
  i.name,
  case
    when lower(coalesce(i.metadata ->> 'type', i.name)) = 'cash' then '1110'
    else '1120'
  end,
  i.is_active
from public.setup_items i
where i.category in ('payment_methods', 'payment_methods_cashier')
on conflict do nothing;

insert into public.student_collection_categories (code, name, revenue_account_code)
values
  ('TRANSCRIPT', 'Transcript Fee', '4200'),
  ('ID_REPLACE', 'ID Replacement', '4200'),
  ('CERTIFICATION', 'Certification', '4200'),
  ('LIBRARY_FINE', 'Library Fine', '4200'),
  ('MISC', 'Miscellaneous', '4200')
on conflict (code) do update set
  name = excluded.name,
  revenue_account_code = excluded.revenue_account_code,
  is_active = true,
  updated_at = now();

insert into public.student_collection_categories(
  code, name, revenue_account_code, is_active
)
select
  upper(regexp_replace(i.code, '[^a-zA-Z0-9]+', '_', 'g')),
  i.name,
  coalesce(nullif(i.metadata ->> 'revenueAccountCode', ''), '4200'),
  i.is_active
from public.setup_items i
where i.category = 'other_payment_categories'
on conflict do nothing;

alter table public.assessments
  add column if not exists enrollment_id uuid
    references public.enrollments(id) on delete restrict,
  add column if not exists approved_at timestamptz;

-- The original columns remain for one compatibility release, but are no
-- longer authoritative after this migration:
-- total_amount, discount_percentage, discount_amount, balance, is_paid,
-- last_payment_date, financial_hold_status, journal_entry_id.

alter table public.assessment_fees
  add column if not exists quantity numeric(12,2) not null default 1,
  add column if not exists unit_amount numeric(15,2),
  add column if not exists revenue_account_code text
    references public.chart_of_accounts(code) on update cascade on delete restrict;

update public.assessment_fees
set unit_amount = amount
where unit_amount is null;

update public.assessment_fees f
set revenue_account_code = case
  when f.category = 'Tuition' and s.department = 'College' then '4120'
  when f.category = 'Tuition' then '4110'
  else '4200'
end
from public.assessments a
join public.students s on s.id = a.student_id
where a.id = f.assessment_id
  and f.revenue_account_code is null;

alter table public.assessment_fees
  alter column unit_amount set not null,
  alter column revenue_account_code set not null;

alter table public.assessment_fees
  drop constraint if exists assessment_fees_quantity_positive,
  drop constraint if exists assessment_fees_unit_amount_nonnegative,
  drop constraint if exists assessment_fees_amount_consistent;

alter table public.assessment_fees
  add constraint assessment_fees_quantity_positive check (quantity > 0) not valid,
  add constraint assessment_fees_unit_amount_nonnegative check (unit_amount >= 0) not valid,
  add constraint assessment_fees_amount_consistent
    check (amount = round(quantity * unit_amount, 2)) not valid;

create table if not exists public.student_finance_adjustments (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null
    references public.assessments(id) on delete restrict,
  discount_request_id uuid
    references public.discount_requests(id) on delete restrict,
  adjustment_type text not null
    check (adjustment_type in ('Debit', 'Credit', 'Discount')),
  amount numeric(15,2) not null check (amount > 0),
  description text not null check (length(btrim(description)) >= 3),
  status text not null default 'Posted'
    check (status in ('Posted', 'Voided')),
  reversal_of_id uuid
    references public.student_finance_adjustments(id) on delete restrict,
  idempotency_key text,
  posted_by text not null,
  posted_at timestamptz not null default now(),
  voided_by text,
  voided_at timestamptz,
  void_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status = 'Posted' and voided_at is null)
    or
    (status = 'Voided' and voided_at is not null and voided_by is not null)
  )
);

create unique index if not exists ux_student_finance_adjustments_idempotency
  on public.student_finance_adjustments(idempotency_key)
  where idempotency_key is not null;

create unique index if not exists ux_student_finance_adjustments_discount_request
  on public.student_finance_adjustments(discount_request_id)
  where discount_request_id is not null;

create index if not exists idx_student_finance_adjustments_assessment
  on public.student_finance_adjustments(assessment_id, status, posted_at);

alter table public.payments
  add column if not exists payment_method_id uuid
    references public.student_payment_methods(id) on delete restrict,
  add column if not exists collection_category_id uuid
    references public.student_collection_categories(id) on delete restrict,
  add column if not exists currency_code varchar(3) not null default 'PHP',
  add column if not exists status text not null default 'Posted',
  add column if not exists posted_by text,
  add column if not exists posted_at timestamptz not null default now(),
  add column if not exists voided_by text,
  add column if not exists voided_at timestamptz,
  add column if not exists void_reason text,
  add column if not exists idempotency_key text;

alter table public.payments
  drop constraint if exists payments_status_check,
  drop constraint if exists payments_amount_positive_check,
  drop constraint if exists payments_transaction_shape_check;

alter table public.payments
  add constraint payments_status_check check (status in ('Posted', 'Voided'));
alter table public.payments
  add constraint payments_amount_positive_check check (amount > 0) not valid;

create unique index if not exists ux_payments_idempotency_key
  on public.payments(idempotency_key)
  where idempotency_key is not null;

alter table public.payments
  drop constraint if exists payments_or_number_key;
drop index if exists public.payments_or_number_key;

create index if not exists idx_payments_assessment_status
  on public.payments(assessment_id, status, payment_date);

insert into public.student_payment_methods(code, name, cash_account_code)
select distinct
  'LEGACY_' || upper(substr(md5(lower(btrim(p.payment_method))), 1, 12)),
  btrim(p.payment_method),
  case when lower(btrim(p.payment_method)) = 'cash' then '1110' else '1120' end
from public.payments p
where nullif(btrim(p.payment_method), '') is not null
on conflict do nothing;

update public.payments p
set payment_method_id = m.id
from public.student_payment_methods m
where p.payment_method_id is null
  and lower(m.name) = lower(p.payment_method);

update public.payments p
set payment_method_id = m.id,
    payment_method = coalesce(nullif(btrim(p.payment_method), ''), m.name)
from public.student_payment_methods m
where p.payment_method_id is null
  and m.code = 'LEGACY_UNSPECIFIED';

insert into public.student_collection_categories(code, name, revenue_account_code)
select distinct
  upper(regexp_replace(coalesce(nullif(btrim(p.payment_category), ''), 'MISC'), '[^a-zA-Z0-9]+', '_', 'g')),
  coalesce(nullif(btrim(p.payment_category), ''), 'Miscellaneous'),
  '4200'
from public.payments p
where p.transaction_type = 'OR'
on conflict do nothing;

update public.payments p
set collection_category_id = c.id
from public.student_collection_categories c
where p.transaction_type = 'OR'
  and p.collection_category_id is null
  and lower(c.name) = lower(coalesce(nullif(btrim(p.payment_category), ''), 'Miscellaneous'));

-- --------------------------------------------------------------------------
-- 2. Persisted void workflow and normalized GL linkage
-- --------------------------------------------------------------------------

create table if not exists public.payment_void_requests (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete restrict,
  school_id uuid references public.schools(id) on delete restrict,
  requested_by text not null,
  requested_at timestamptz not null default now(),
  reason text not null check (length(btrim(reason)) >= 5),
  status text not null default 'Pending Void Approval'
    check (status in ('Pending Void Approval', 'Approved', 'Rejected')),
  reviewed_by text,
  reviewed_at timestamptz,
  review_remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status = 'Pending Void Approval' and reviewed_at is null)
    or
    (status in ('Approved', 'Rejected') and reviewed_at is not null and reviewed_by is not null)
  )
);

create unique index if not exists ux_payment_void_requests_open
  on public.payment_void_requests(payment_id)
  where status = 'Pending Void Approval';

create index if not exists idx_payment_void_requests_status
  on public.payment_void_requests(status, requested_at desc);

create table if not exists public.student_finance_journal_links (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (
    event_type in ('Assessment', 'Payment', 'PaymentVoid', 'Adjustment', 'AdjustmentVoid')
  ),
  journal_entry_id uuid not null unique
    references public.journal_entries(id) on delete restrict,
  assessment_id uuid references public.assessments(id) on delete restrict,
  payment_id uuid references public.payments(id) on delete restrict,
  adjustment_id uuid references public.student_finance_adjustments(id) on delete restrict,
  created_at timestamptz not null default now(),
  check (num_nonnulls(assessment_id, payment_id, adjustment_id) = 1)
);

create unique index if not exists ux_student_finance_journal_assessment
  on public.student_finance_journal_links(assessment_id, event_type)
  where assessment_id is not null;

create unique index if not exists ux_student_finance_journal_payment
  on public.student_finance_journal_links(payment_id, event_type)
  where payment_id is not null;

create unique index if not exists ux_student_finance_journal_adjustment
  on public.student_finance_journal_links(adjustment_id, event_type)
  where adjustment_id is not null;

-- --------------------------------------------------------------------------
-- 3. Deterministic legacy linkage
-- --------------------------------------------------------------------------

update public.assessments a
set enrollment_id = (
  select (array_agg(e.id order by e.created_at, e.id::text))[1]
  from public.enrollments e
  where e.student_id = a.student_id
    and e.school_year = a.school_year
    and e.semester is not distinct from a.semester
  having count(*) = 1
)
where a.enrollment_id is null;

update public.enrollments e
set assessment_id = a.id,
    updated_at = now()
from public.assessments a
where a.enrollment_id = e.id
  and e.assessment_id is null;

create unique index if not exists ux_assessments_enrollment_id
  on public.assessments(enrollment_id)
  where enrollment_id is not null;

create unique index if not exists ux_enrollments_assessment_id
  on public.enrollments(assessment_id)
  where assessment_id is not null;

with candidates as (
  select
    p.id as payment_id,
    a.id as assessment_id,
    1 as precedence
  from public.payments p
  join public.enrollments e on e.student_id = p.student_id
  join public.assessments a on a.id = e.assessment_id
  where p.transaction_type = 'AR'
    and p.assessment_id is null
    and a.student_id = p.student_id
    and a.school_id is not distinct from p.school_id

  union all

  select
    p.id,
    a.id,
    2
  from public.payments p
  join public.assessments a
    on a.student_id = p.student_id
   and a.school_id is not distinct from p.school_id
  where p.transaction_type = 'AR'
    and p.assessment_id is null
),
preferred as (
  select c.payment_id, (array_agg(c.assessment_id order by c.assessment_id::text))[1] as assessment_id
  from candidates c
  join (
    select payment_id, min(precedence) as precedence
    from candidates
    group by payment_id
  ) p using (payment_id, precedence)
  group by c.payment_id
  having count(distinct c.assessment_id) = 1
)
update public.payments p
set assessment_id = preferred.assessment_id
from preferred
where p.id = preferred.payment_id;

update public.payments
set status = coalesce(status, 'Posted'),
    posted_at = coalesce(posted_at, payment_date, now()),
    posted_by = coalesce(posted_by, 'Legacy migration');

-- Repair deterministic legacy denormalizations before the fail-closed
-- preflight. The canonical migration still refuses ambiguous links, duplicate
-- ORs, malformed fee lines, and unsupported terms, but unreleased cached
-- school/balance fields are normalized from their authoritative relationships.
update public.assessments a
set school_id = s.school_id,
    updated_at = now()
from public.students s
where a.school_id is null
  and a.student_id = s.id
  and s.school_id is not null;

update public.assessments a
set school_id = bp.school_id,
    updated_at = now()
from public.book_packages bp
where a.school_id is null
  and a.book_package_id = bp.id
  and bp.school_id is not null;

update public.assessments a
set school_id = o.school_id,
    updated_at = now()
from public.enrollments e
join public.online_enrollment_applications o
  on o.id = e.online_application_id
where a.school_id is null
  and (a.enrollment_id = e.id or e.assessment_id = a.id)
  and o.school_id is not null;

with payment_school_candidates as (
  select
    p.assessment_id,
    (array_agg(p.school_id))[1] as school_id
  from public.payments p
  where p.assessment_id is not null
    and p.school_id is not null
  group by p.assessment_id
  having count(distinct p.school_id) = 1
)
update public.assessments a
set school_id = c.school_id,
    updated_at = now()
from payment_school_candidates c
where a.school_id is null
  and a.id = c.assessment_id;

with single_school as (
  select (array_agg(id order by id::text))[1] as school_id
  from public.schools
  having count(*) = 1
)
update public.assessments a
set school_id = s.school_id,
    updated_at = now()
from single_school s
where a.school_id is null
  and s.school_id is not null;

update public.assessments a
set school_id = s.id,
    updated_at = now()
from public.schools s
where a.school_id is null
  and s.code = 'STSN';

update public.students s
set school_id = a.school_id,
    updated_at = now()
from public.assessments a
where s.school_id is null
  and s.id = a.student_id
  and a.school_id is not null;

update public.payments p
set student_id = a.student_id,
    school_id = a.school_id,
    updated_at = now()
from public.assessments a
where p.transaction_type = 'AR'
  and p.assessment_id = a.id
  and (
    p.student_id is distinct from a.student_id
    or p.school_id is distinct from a.school_id
  )
  and a.school_id is not null;

update public.payments p
set school_id = s.school_id,
    updated_at = now()
from public.students s
where p.school_id is null
  and p.student_id = s.id
  and s.school_id is not null;

with assessment_totals as (
  select
    a.id,
    coalesce(f.charges, 0)::numeric(15,2) as charges,
    coalesce(a.discount_amount, 0)::numeric(15,2) as discounts,
    coalesce(p.paid, 0)::numeric(15,2) as paid,
    p.last_payment_date
  from public.assessments a
  left join lateral (
    select coalesce(sum(f.amount), 0)::numeric(15,2) as charges
    from public.assessment_fees f
    where f.assessment_id = a.id
  ) f on true
  left join lateral (
    select
      coalesce(sum(p.amount) filter (
        where p.status = 'Posted' and p.transaction_type = 'AR'
      ), 0)::numeric(15,2) as paid,
      max(p.payment_date::date) filter (
        where p.status = 'Posted' and p.transaction_type = 'AR'
      ) as last_payment_date
    from public.payments p
    where p.assessment_id = a.id
  ) p on true
)
update public.assessments a
set total_amount = t.charges,
    balance = greatest(t.charges - t.discounts - t.paid, 0)::numeric(15,2),
    is_paid = (t.charges - t.discounts - t.paid <= 0),
    last_payment_date = coalesce(t.last_payment_date, a.last_payment_date),
    updated_at = now()
from assessment_totals t
where a.id = t.id
  and (
    a.total_amount is distinct from t.charges
    or a.balance is distinct from greatest(t.charges - t.discounts - t.paid, 0)::numeric(15,2)
    or a.is_paid is distinct from (t.charges - t.discounts - t.paid <= 0)
    or (t.last_payment_date is not null and a.last_payment_date is distinct from t.last_payment_date)
  );

-- Preserve legacy assessment discounts and scholarships as canonical facts.
-- The idempotency key makes the replacement migration safe to retry.
insert into public.student_finance_adjustments(
  assessment_id, adjustment_type, amount, description, status,
  idempotency_key, posted_by, posted_at
)
select
  a.id,
  'Discount',
  a.discount_amount,
  coalesce(nullif(btrim(a.scholarship_name), ''), 'Legacy assessment discount'),
  'Posted',
  'legacy-assessment-discount:' || a.id::text,
  coalesce(a.approved_by, a.submitted_by, 'Legacy migration'),
  coalesce(a.approved_date::timestamptz, a.submitted_date::timestamptz, a.created_at)
from public.assessments a
where coalesce(a.discount_amount, 0) > 0
on conflict (idempotency_key) where idempotency_key is not null do nothing;

-- Fail closed before canonical views replace legacy summaries.  Financial
-- migrations must never guess an allocation or silently accept a changed
-- balance.
do $$
declare
  v_issues jsonb;
begin
  select jsonb_agg(to_jsonb(q))
  into v_issues
  from (
    select 'AR_PAYMENT_WITHOUT_EXACT_ASSESSMENT'::text as issue,
           p.id as record_id,
           coalesce(p.or_number, p.id::text) as reference
    from public.payments p
    where p.transaction_type = 'AR' and p.assessment_id is null

    union all

    select 'PAYMENT_OWNERSHIP_MISMATCH', p.id,
           coalesce(p.or_number, p.id::text)
    from public.payments p
    join public.assessments a on a.id = p.assessment_id
    where p.transaction_type = 'AR'
      and (
        p.student_id <> a.student_id
        or p.school_id is distinct from a.school_id
      )

    union all

    select 'NONPOSITIVE_PAYMENT', p.id,
           coalesce(p.or_number, p.id::text)
    from public.payments p
    where p.amount <= 0

    union all

    select 'MISSING_OFFICIAL_RECEIPT', p.id, p.id::text
    from public.payments p
    where nullif(btrim(coalesce(p.or_number, '')), '') is null

    union all

    select 'MISSING_PAYMENT_SCHOOL', p.id,
           coalesce(p.or_number, p.id::text)
    from public.payments p
    where p.school_id is null

    union all

    select 'MISSING_ASSESSMENT_SCHOOL', a.id,
           a.school_year || ' / ' || coalesce(a.semester, 'N/A')
    from public.assessments a
    where a.school_id is null

    union all

    select 'MISSING_PAYMENT_METHOD', p.id, coalesce(p.or_number, p.id::text)
    from public.payments p
    where p.payment_method_id is null
       or nullif(btrim(coalesce(p.payment_method, '')), '') is null

    union all

    select 'MISSING_DIRECT_COLLECTION_CATEGORY', p.id,
           coalesce(p.or_number, p.id::text)
    from public.payments p
    where p.transaction_type = 'OR'
      and (
        p.collection_category_id is null
        or nullif(btrim(coalesce(p.payment_category, '')), '') is null
      )

    union all

    select 'DUPLICATE_SCHOOL_OR_NUMBER',
           (array_agg(p.id order by p.id::text))[1], min(p.or_number)
    from public.payments p
    where p.or_number is not null
    group by p.school_id, lower(p.or_number)
    having count(*) > 1

    union all

    select 'ASSESSMENT_WITHOUT_FEE_LINES', a.id,
           a.school_year || ' / ' || coalesce(a.semester, 'N/A')
    from public.assessments a
    where not exists (
      select 1 from public.assessment_fees f where f.assessment_id = a.id
    )

    union all

    select 'INVALID_ASSESSMENT_FEE_AMOUNT', f.id, f.fee_name
    from public.assessment_fees f
    where f.quantity <= 0
       or f.unit_amount < 0
       or f.amount <> round(f.quantity * f.unit_amount, 2)
       or f.amount <> round(f.amount, 2)

    union all

    select 'UNSUPPORTED_PAYMENT_TERM', a.id, coalesce(a.payment_term, '(null)')
    from public.assessments a
    where coalesce(a.payment_term, 'Cash Basis') not in (
      'Cash Basis', 'Quarterly', 'Semestral',
      'Installment - 2 Payments', 'Installment - 4 Payments'
    )

    union all

    select 'INVALID_ACADEMIC_YEAR', a.id, coalesce(a.school_year, '(null)')
    from public.assessments a
    where a.school_year !~ '^[0-9]{4}-[0-9]{4}$'
       or case when a.school_year ~ '^[0-9]{4}-[0-9]{4}$'
         then substring(a.school_year from 1 for 4)::integer + 1
            <> substring(a.school_year from 6 for 4)::integer
         else false
       end

    union all

    select 'UNEXPLAINED_ASSESSMENT_BALANCE', a.id,
           a.school_year || ' / ' || coalesce(a.semester, 'N/A')
    from public.assessments a
    left join lateral (
      select coalesce(sum(f.amount), 0)::numeric(15,2) as charges
      from public.assessment_fees f where f.assessment_id = a.id
    ) f on true
    left join lateral (
      select coalesce(sum(p.amount) filter (
        where p.status = 'Posted' and p.transaction_type = 'AR'
      ), 0)::numeric(15,2) as paid
      from public.payments p where p.assessment_id = a.id
    ) p on true
    where round(coalesce(a.balance, 0), 2)
      <> round(greatest(f.charges - coalesce(a.discount_amount, 0) - p.paid, 0), 2)
  ) q;

  if v_issues is not null then
    raise exception using
      message = 'Student-finance preflight failed; no migration changes were committed',
      detail = v_issues::text,
      hint = 'Correct every listed legacy record and rerun the migration.';
  end if;
end
$$;

create unique index if not exists ux_payments_school_or_number
  on public.payments(school_id, lower(or_number))
  where or_number is not null;

-- Install the shape check before cutover, then validate it only after the
-- deterministic legacy preflight has accepted every imported payment.
alter table public.payments
  add constraint payments_transaction_shape_check check (
    (transaction_type = 'AR' and assessment_id is not null and collection_category_id is null)
    or
    (transaction_type = 'OR' and assessment_id is null and collection_category_id is not null)
  ) not valid;

alter table public.payments
  validate constraint payments_amount_positive_check;
alter table public.payments
  validate constraint payments_transaction_shape_check;
alter table public.payments
  alter column payment_method_id set not null;
alter table public.assessment_fees
  validate constraint assessment_fees_quantity_positive;
alter table public.assessment_fees
  validate constraint assessment_fees_unit_amount_nonnegative;
alter table public.assessment_fees
  validate constraint assessment_fees_amount_consistent;

-- --------------------------------------------------------------------------
-- 4. Canonical financial views
-- --------------------------------------------------------------------------

create or replace view public.assessment_financials
with (security_invoker = true)
as
with charges as (
  select
    assessment_id,
    coalesce(sum(amount), 0)::numeric(15,2) as gross_charges
  from public.assessment_fees
  group by assessment_id
),
adjustments as (
  select
    assessment_id,
    coalesce(sum(amount) filter (
      where status = 'Posted' and adjustment_type = 'Debit'
    ), 0)::numeric(15,2) as debit_adjustments,
    coalesce(sum(amount) filter (
      where status = 'Posted' and adjustment_type in ('Credit', 'Discount')
    ), 0)::numeric(15,2) as credit_adjustments,
    coalesce(sum(amount) filter (
      where status = 'Posted' and adjustment_type = 'Discount'
    ), 0)::numeric(15,2) as discounts
  from public.student_finance_adjustments
  group by assessment_id
),
collections as (
  select
    assessment_id,
    coalesce(sum(amount) filter (
      where status = 'Posted' and transaction_type = 'AR'
    ), 0)::numeric(15,2) as posted_payments,
    max(payment_date::date) filter (
      where status = 'Posted' and transaction_type = 'AR'
    ) as last_payment_date
  from public.payments
  where assessment_id is not null
  group by assessment_id
)
select
  a.id as assessment_id,
  a.student_id,
  a.school_id,
  a.school_year,
  a.semester,
  coalesce(c.gross_charges, 0)::numeric(15,2) as gross_charges,
  coalesce(x.debit_adjustments, 0)::numeric(15,2) as debit_adjustments,
  coalesce(x.credit_adjustments, 0)::numeric(15,2) as credit_adjustments,
  coalesce(x.discounts, 0)::numeric(15,2) as discount_amount,
  coalesce(p.posted_payments, 0)::numeric(15,2) as posted_payments,
  (
    coalesce(c.gross_charges, 0)
    + coalesce(x.debit_adjustments, 0)
    - coalesce(x.credit_adjustments, 0)
    - coalesce(p.posted_payments, 0)
  )::numeric(15,2) as balance,
  (
    coalesce(c.gross_charges, 0)
    + coalesce(x.debit_adjustments, 0)
    - coalesce(x.credit_adjustments, 0)
    - coalesce(p.posted_payments, 0)
  ) = 0 as is_paid,
  p.last_payment_date
from public.assessments a
left join charges c on c.assessment_id = a.id
left join adjustments x on x.assessment_id = a.id
left join collections p on p.assessment_id = a.id;

-- Preserve the original physical read models for audit/rollback, then replace
-- them with views under their established application-facing names.
do $$
declare
  v_name text;
begin
  foreach v_name in array array[
    'ledger_transactions', 'student_ledger_summaries',
    'assessment_billing_summaries', 'payment_collection_summaries'
  ] loop
    if to_regclass('public.' || v_name || '_legacy') is not null then
      raise exception 'Legacy cutover target public.%_legacy already exists', v_name;
    end if;
    if not exists (
      select 1 from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = v_name and c.relkind = 'r'
    ) then
      raise exception 'Expected physical table public.% was not found', v_name;
    end if;
  end loop;

  alter table public.ledger_transactions rename to ledger_transactions_legacy;
  alter table public.student_ledger_summaries rename to student_ledger_summaries_legacy;
  alter table public.assessment_billing_summaries rename to assessment_billing_summaries_legacy;
  alter table public.payment_collection_summaries rename to payment_collection_summaries_legacy;
end
$$;

create or replace function public.student_finance_legacy_read_only()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception '% is a read-only migration archive', tg_table_name;
end
$$;

create trigger trg_ledger_transactions_legacy_read_only
before insert or update or delete on public.ledger_transactions_legacy
for each row execute function public.student_finance_legacy_read_only();
create trigger trg_student_ledger_summaries_legacy_read_only
before insert or update or delete on public.student_ledger_summaries_legacy
for each row execute function public.student_finance_legacy_read_only();
create trigger trg_assessment_billing_summaries_legacy_read_only
before insert or update or delete on public.assessment_billing_summaries_legacy
for each row execute function public.student_finance_legacy_read_only();
create trigger trg_payment_collection_summaries_legacy_read_only
before insert or update or delete on public.payment_collection_summaries_legacy
for each row execute function public.student_finance_legacy_read_only();

do $$
declare
  v_table text;
  v_policy text;
begin
  foreach v_table in array array[
    'ledger_transactions', 'student_ledger_summaries',
    'assessment_billing_summaries', 'payment_collection_summaries'
  ] loop
    foreach v_policy in array array['select', 'insert', 'update', 'delete'] loop
      execute format(
        'drop policy if exists %I on public.%I',
        v_table || '_' || v_policy || '_anon_auth',
        v_table || '_legacy'
      );
    end loop;
    execute format('alter table public.%I enable row level security', v_table || '_legacy');
    execute format(
      'create policy %I on public.%I for select to authenticated using (exists (select 1 from public.students s where s.id = student_id and public.app_can_read_student_finance(s.id, s.school_id)))',
      v_table || '_legacy_read', v_table || '_legacy'
    );
    execute format('revoke all on public.%I from anon', v_table || '_legacy');
    execute format(
      'revoke insert, update, delete on public.%I from authenticated',
      v_table || '_legacy'
    );
  end loop;
end
$$;

create or replace view public.ledger_transactions
with (security_invoker = true)
as
with events as (
  select
    a.id,
    a.student_id,
    coalesce(a.approved_at, a.approved_date::timestamptz, a.created_at) as occurred_at,
    'Approved student assessment'::text as description,
    'Assessment'::text as type,
    af.gross_charges::numeric(15,2) as debit,
    0::numeric(15,2) as credit,
    a.id::text as reference,
    a.school_year,
    'Assessment'::text as source_type,
    a.id as source_id,
    null::uuid as reversed_transaction_id
  from public.assessments a
  join public.assessment_financials af on af.assessment_id = a.id
  where a.approval_status = 'Approved for Payment'

  union all

  select
    x.id,
    a.student_id,
    x.posted_at,
    x.description,
    case when x.adjustment_type = 'Discount' then 'Discount' else 'Adjustment' end,
    case when x.adjustment_type = 'Debit' then x.amount else 0 end,
    case when x.adjustment_type in ('Credit', 'Discount') then x.amount else 0 end,
    x.id::text,
    a.school_year,
    'StudentAdjustment',
    x.id,
    x.reversal_of_id
  from public.student_finance_adjustments x
  join public.assessments a on a.id = x.assessment_id
  where x.status = 'Posted'

  union all

  select
    p.id,
    p.student_id,
    p.payment_date,
    'Payment ' || coalesce(p.or_number, p.id::text),
    'Payment',
    0::numeric(15,2),
    p.amount::numeric(15,2),
    coalesce(p.or_number, p.id::text),
    a.school_year,
    'Payment',
    p.id,
    null::uuid
  from public.payments p
  join public.assessments a on a.id = p.assessment_id
  where p.transaction_type = 'AR'

  union all

  select
    (
      substr(md5('payment-void:' || p.id::text), 1, 8) || '-' ||
      substr(md5('payment-void:' || p.id::text), 9, 4) || '-' ||
      substr(md5('payment-void:' || p.id::text), 13, 4) || '-' ||
      substr(md5('payment-void:' || p.id::text), 17, 4) || '-' ||
      substr(md5('payment-void:' || p.id::text), 21, 12)
    )::uuid,
    p.student_id,
    p.voided_at,
    'Void reversal for ' || coalesce(p.or_number, p.id::text),
    'Adjustment',
    p.amount::numeric(15,2),
    0::numeric(15,2),
    coalesce(p.or_number, p.id::text),
    a.school_year,
    'PaymentVoid',
    p.id,
    p.id
  from public.payments p
  join public.assessments a on a.id = p.assessment_id
  where p.transaction_type = 'AR'
    and p.status = 'Voided'
),
running as (
  select
    e.*,
    sum(e.debit - e.credit) over (
      partition by e.student_id, e.school_year
      order by e.occurred_at, e.id
      rows between unbounded preceding and current row
    )::numeric(15,2) as running_balance
  from events e
)
select
  id,
  null::text as legacy_id,
  student_id,
  occurred_at::date as date,
  description,
  type,
  debit,
  credit,
  running_balance as balance,
  reference,
  school_year,
  source_type,
  source_id,
  reversed_transaction_id,
  occurred_at as created_at
from running;

create or replace view public.student_ledger_summaries
with (security_invoker = true)
as
with assessment_totals as (
  select
    a.student_id,
    a.school_year,
    sum(af.gross_charges + af.debit_adjustments)::numeric(15,2) as total_assessed,
    sum(af.discount_amount)::numeric(15,2) as discount_applied,
    sum(af.posted_payments)::numeric(15,2) as total_paid,
    sum(af.balance)::numeric(15,2) as balance,
    max(af.last_payment_date) as last_payment_date
  from public.assessments a
  join public.assessment_financials af on af.assessment_id = a.id
  where a.approval_status <> 'Rejected'
  group by a.student_id, a.school_year
)
select
  (
    substr(md5('ledger-summary:' || t.student_id::text || ':' || t.school_year), 1, 8) || '-' ||
    substr(md5('ledger-summary:' || t.student_id::text || ':' || t.school_year), 9, 4) || '-' ||
    substr(md5('ledger-summary:' || t.student_id::text || ':' || t.school_year), 13, 4) || '-' ||
    substr(md5('ledger-summary:' || t.student_id::text || ':' || t.school_year), 17, 4) || '-' ||
    substr(md5('ledger-summary:' || t.student_id::text || ':' || t.school_year), 21, 12)
  )::uuid as id,
  t.student_id,
  t.school_year,
  t.total_assessed,
  t.total_paid,
  t.discount_applied,
  t.balance,
  case
    when t.balance > 0
      or exists (
        select 1 from public.assessments a
        where a.student_id = t.student_id
          and a.school_year = t.school_year
          and a.financial_hold_status = 'Hold'
      )
      or exists (
      select 1 from public.financial_holds h
      where h.student_id = t.student_id and h.status = 'Active'
    ) then 'Hold'
    else 'Cleared'
  end::text as financial_hold_status,
  case
    when t.balance > 0
      or exists (
        select 1 from public.assessments a
        where a.student_id = t.student_id
          and a.school_year = t.school_year
          and a.financial_hold_status = 'Hold'
      )
      or exists (
      select 1 from public.financial_holds h
      where h.student_id = t.student_id and h.status = 'Active'
    ) then 'Not Cleared'
    else 'Cleared'
  end::text as clearance_status,
  t.last_payment_date,
  now() as created_at,
  now() as updated_at
from assessment_totals t;

create or replace view public.assessment_billing_summaries
with (security_invoker = true)
as
select
  a.id,
  a.legacy_id,
  a.id as assessment_id,
  a.student_id,
  a.school_year,
  a.semester,
  case when s.department = 'College' then 'college' else 'basic-ed' end::text as academic_unit,
  coalesce(a.payment_term, 'Standard Assessment')::text as fee_template_name,
  (af.gross_charges + af.debit_adjustments)::numeric(15,2) as total_assessment,
  af.balance as amount_due,
  af.balance,
  case a.approval_status
    when 'Approved for Payment' then 'Approved'
    when 'Rejected' then 'Voided'
    when 'Pending Accounting Approval' then 'Pending Approval'
    else 'Draft'
  end::text as status,
  a.created_at,
  a.updated_at
from public.assessments a
join public.students s on s.id = a.student_id
join public.assessment_financials af on af.assessment_id = a.id;

create or replace view public.payment_collection_summaries
with (security_invoker = true)
as
select
  p.id,
  p.legacy_id,
  p.id as payment_id,
  p.student_id,
  p.amount,
  coalesce(m.name, p.payment_method)::text as payment_method,
  p.or_number as reference_no,
  p.payment_date,
  p.posted_by as cashier,
  p.term,
  case when p.status = 'Voided' then 'Voided' else 'Verified' end::text
    as verification_status,
  p.created_at,
  p.updated_at
from public.payments p
left join public.student_payment_methods m on m.id = p.payment_method_id;

-- --------------------------------------------------------------------------
-- 5. Journal helpers
-- --------------------------------------------------------------------------

create sequence if not exists public.student_finance_journal_entry_seq;

create or replace function public.student_finance_fiscal_year(p_date date)
returns text
language sql
immutable
as $$
  select case
    when extract(month from p_date) >= 6
      then extract(year from p_date)::int::text || '-' ||
           (extract(year from p_date)::int + 1)::text
    else (extract(year from p_date)::int - 1)::text || '-' ||
         extract(year from p_date)::int::text
  end
$$;

create or replace function public.student_finance_new_journal(
  p_entry_date date,
  p_school_id uuid,
  p_reference_no text,
  p_description text,
  p_actor text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid := gen_random_uuid();
  v_entry_no text;
begin
  v_entry_no := 'AUTO-' || to_char(p_entry_date, 'YYYY') || '-' ||
    lpad(nextval('public.student_finance_journal_entry_seq')::text, 8, '0');

  insert into public.journal_entries (
    id, entry_no, entry_date, fiscal_year, fiscal_period, description,
    reference_no, status, school_id, created_by, posted_by, posted_at
  ) values (
    v_id, v_entry_no, p_entry_date,
    public.student_finance_fiscal_year(p_entry_date),
    to_char(p_entry_date, 'FMMonth YYYY'),
    p_description, p_reference_no, 'Posted', p_school_id,
    coalesce(nullif(btrim(p_actor), ''), 'System'),
    coalesce(nullif(btrim(p_actor), ''), 'System'), now()
  );

  return v_id;
end
$$;

create or replace function public.student_finance_post_two_line_journal(
  p_event_type text,
  p_assessment_id uuid,
  p_payment_id uuid,
  p_adjustment_id uuid,
  p_entry_date date,
  p_school_id uuid,
  p_reference_no text,
  p_description text,
  p_actor text,
  p_debit_account text,
  p_credit_account text,
  p_amount numeric
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing uuid;
  v_journal_id uuid;
begin
  if p_amount <= 0 then raise exception 'Journal amount must be greater than zero'; end if;

  select journal_entry_id into v_existing
  from public.student_finance_journal_links
  where event_type = p_event_type
    and assessment_id is not distinct from p_assessment_id
    and payment_id is not distinct from p_payment_id
    and adjustment_id is not distinct from p_adjustment_id;
  if v_existing is not null then return v_existing; end if;

  v_journal_id := public.student_finance_new_journal(
    p_entry_date, p_school_id, p_reference_no, p_description, p_actor
  );

  insert into public.journal_entry_lines(
    journal_entry_id, line_no, account_code, debit_amount, credit_amount, description
  ) values
    (v_journal_id, 1, p_debit_account, p_amount, 0, p_description),
    (v_journal_id, 2, p_credit_account, 0, p_amount, p_description);

  insert into public.student_finance_journal_links(
    event_type, journal_entry_id, assessment_id, payment_id, adjustment_id
  ) values (
    p_event_type, v_journal_id, p_assessment_id, p_payment_id, p_adjustment_id
  );

  return v_journal_id;
end
$$;

-- --------------------------------------------------------------------------
-- 6. RPC-only posting API
-- --------------------------------------------------------------------------

create or replace function public.approve_student_assessment(
  p_assessment_id uuid,
  p_approved_by text,
  p_remarks text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_a public.assessments%rowtype;
  v_journal_id uuid;
  v_line int := 1;
  v_total numeric(15,2);
  v_already_approved boolean;
  r record;
begin
  select * into v_a
  from public.assessments
  where id = p_assessment_id
  for update;
  if not found then raise exception 'Assessment % was not found', p_assessment_id; end if;
  perform public.app_require_finance_writes_enabled();
  perform public.app_require_permission(
    'REGISTRAR', 'enrollment', 'edit', v_a.school_id
  );

  v_already_approved := v_a.approval_status = 'Approved for Payment';
  if v_already_approved and exists (
    select 1
    from public.student_finance_journal_links
    where assessment_id = v_a.id and event_type = 'Assessment'
  ) then
    return jsonb_build_object(
      'assessment', to_jsonb(v_a) || coalesce((
        select jsonb_build_object(
          'total_amount', gross_charges + debit_adjustments,
          'discount_amount', discount_amount,
          'balance', balance,
          'is_paid', is_paid,
          'last_payment_date', last_payment_date
        ) from public.assessment_financials where assessment_id = v_a.id
      ), '{}'::jsonb)
    );
  end if;

  select coalesce(sum(amount), 0)::numeric(15,2)
  into v_total
  from public.assessment_fees
  where assessment_id = p_assessment_id;
  if v_total <= 0 then raise exception 'Assessment has no positive charge lines'; end if;

  if not v_already_approved then
    perform set_config('app.student_finance_approval_rpc', 'on', true);
    update public.assessments
    set approval_status = 'Approved for Payment',
        approved_by = p_approved_by,
        approved_date = current_date,
        approved_at = now(),
        accounting_remarks = p_remarks,
        updated_at = now()
    where id = p_assessment_id
    returning * into v_a;
  elsif v_a.approved_at is null then
    update public.assessments
    set approved_at = coalesce(approved_date::timestamptz, created_at),
        updated_at = now()
    where id = p_assessment_id
    returning * into v_a;
  end if;

  v_journal_id := public.student_finance_new_journal(
    current_date, v_a.school_id, v_a.id::text,
    'Approved student assessment ' || v_a.id::text, p_approved_by
  );

  insert into public.journal_entry_lines(
    journal_entry_id, line_no, account_code, debit_amount, credit_amount, description
  ) values (
    v_journal_id, v_line, '1130', v_total, 0, 'Student receivable'
  );
  v_line := v_line + 1;

  for r in
    select revenue_account_code, sum(amount)::numeric(15,2) as amount
    from public.assessment_fees
    where assessment_id = p_assessment_id
    group by revenue_account_code
    order by revenue_account_code
  loop
    insert into public.journal_entry_lines(
      journal_entry_id, line_no, account_code, debit_amount, credit_amount, description
    ) values (
      v_journal_id, v_line, r.revenue_account_code, 0, r.amount,
      'Assessment revenue'
    );
    v_line := v_line + 1;
  end loop;

  insert into public.student_finance_journal_links(
    event_type, journal_entry_id, assessment_id
  ) values ('Assessment', v_journal_id, p_assessment_id);

  update public.enrollments
  set status = 'For Payment', assessment_id = v_a.id, updated_at = now()
  where id = v_a.enrollment_id
     or assessment_id = v_a.id;

  update public.students
  set enrollment_status = 'For Payment', updated_at = now()
  where id = v_a.student_id;

  if not v_already_approved then
    insert into public.assessment_audit_trail(
      assessment_id, action, performed_by, performed_at, details
    ) values (
      v_a.id, 'APPROVED_FOR_PAYMENT', p_approved_by, now(),
      coalesce(p_remarks, 'Assessment approved for payment.')
    );
  end if;

  return jsonb_build_object(
    'assessment', to_jsonb(v_a) || (
      select jsonb_build_object(
        'total_amount', gross_charges + debit_adjustments,
        'discount_amount', discount_amount,
        'balance', balance,
        'is_paid', is_paid,
        'last_payment_date', last_payment_date
      ) from public.assessment_financials where assessment_id = v_a.id
    )
  );
end
$$;

create or replace function public.post_student_payment(
  p_student_id uuid,
  p_assessment_id uuid,
  p_school_id uuid,
  p_amount numeric,
  p_payment_method text,
  p_or_number text,
  p_term text,
  p_remarks text,
  p_transaction_type text default 'AR',
  p_payment_category text default null,
  p_posted_by text default 'System',
  p_idempotency_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments%rowtype;
  v_a public.assessments%rowtype;
  v_fin public.assessment_financials%rowtype;
  v_method public.student_payment_methods%rowtype;
  v_category public.student_collection_categories%rowtype;
  v_credit_account text;
  v_journal_id uuid;
  v_enrollment public.enrollments%rowtype;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Payment amount must be greater than zero';
  end if;
  if p_school_id is null then
    raise exception 'Payment school_id is required';
  end if;
  if nullif(btrim(coalesce(p_or_number, '')), '') is null then
    raise exception 'Official receipt number is required';
  end if;

  if p_idempotency_key is not null then
    select * into v_payment
    from public.payments
    where idempotency_key = p_idempotency_key;
  end if;

  if v_payment.id is null then
    select * into v_method
    from public.student_payment_methods
    where is_active
      and (lower(code) = lower(p_payment_method) or lower(name) = lower(p_payment_method));
    if not found then raise exception 'Payment method % is not configured', p_payment_method; end if;

    if p_transaction_type = 'AR' then
      if p_assessment_id is null then raise exception 'AR payment requires assessment_id'; end if;

      select * into v_a
      from public.assessments
      where id = p_assessment_id
      for update;
      if not found then raise exception 'Assessment % was not found', p_assessment_id; end if;
      if v_a.student_id <> p_student_id then raise exception 'Assessment belongs to another student'; end if;
      if v_a.approval_status <> 'Approved for Payment' then
        raise exception 'Assessment is not approved for payment';
      end if;

      select * into v_fin
      from public.assessment_financials
      where assessment_id = p_assessment_id;
      if v_fin.balance <= 0 then raise exception 'Assessment has no collectible balance'; end if;
      if p_amount > v_fin.balance then
        raise exception 'Payment amount % exceeds assessment balance %', p_amount, v_fin.balance;
      end if;
      v_credit_account := '1130';
    elsif p_transaction_type = 'OR' then
      if p_assessment_id is not null then raise exception 'OR collection cannot reference an assessment'; end if;
      select * into v_category
      from public.student_collection_categories
      where is_active
        and (lower(code) = lower(p_payment_category) or lower(name) = lower(p_payment_category));
      if not found then raise exception 'Collection category % is not configured', p_payment_category; end if;
      v_credit_account := v_category.revenue_account_code;
    else
      raise exception 'Unsupported transaction type %', p_transaction_type;
    end if;

    insert into public.payments(
      school_id, student_id, assessment_id, amount, payment_date,
      payment_method, payment_method_id, or_number, term, remarks,
      transaction_type, payment_category, collection_category_id,
      currency_code, status, posted_by, posted_at, idempotency_key
    ) values (
      p_school_id, p_student_id, p_assessment_id, p_amount, now(),
      v_method.name, v_method.id, btrim(p_or_number), p_term, p_remarks,
      p_transaction_type, case when v_category.id is null then null else v_category.name end,
      v_category.id, 'PHP', 'Posted', p_posted_by, now(), p_idempotency_key
    )
    returning * into v_payment;

    v_journal_id := public.student_finance_post_two_line_journal(
      'Payment', null, v_payment.id, null, v_payment.payment_date::date,
      v_payment.school_id, v_payment.or_number,
      case when v_payment.transaction_type = 'AR'
        then 'Student account payment ' || v_payment.or_number
        else 'Standalone collection ' || v_payment.or_number
      end,
      p_posted_by, v_method.cash_account_code, v_credit_account, v_payment.amount
    );
  end if;

  if v_payment.assessment_id is not null then
    select * into v_a from public.assessments where id = v_payment.assessment_id;
    select * into v_fin from public.assessment_financials
      where assessment_id = v_payment.assessment_id;

    update public.enrollments
    set status = case when v_fin.balance = 0 then 'Enrolled' else 'Partially Paid' end,
        updated_at = now()
    where id = v_a.enrollment_id or assessment_id = v_a.id
    returning * into v_enrollment;

    update public.students
    set enrollment_status = case when v_fin.balance = 0 then 'Enrolled' else 'Partially Paid' end,
        updated_at = now()
    where id = v_payment.student_id;
  end if;

  return jsonb_build_object(
    'payment', to_jsonb(v_payment),
    'assessment', case when v_a.id is null then null else
      to_jsonb(v_a) || jsonb_build_object(
        'total_amount', v_fin.gross_charges + v_fin.debit_adjustments,
        'discount_amount', v_fin.discount_amount,
        'balance', v_fin.balance,
        'is_paid', v_fin.is_paid,
        'last_payment_date', v_fin.last_payment_date
      )
    end,
    'enrollment', case when v_enrollment.id is null then null else to_jsonb(v_enrollment) end,
    'ledger_transaction', (
      select to_jsonb(l) from public.ledger_transactions l
      where l.source_type = 'Payment' and l.source_id = v_payment.id
      order by l.created_at desc limit 1
    ),
    'ledger_summary', (
      select to_jsonb(s) from public.student_ledger_summaries s
      where s.student_id = v_payment.student_id
        and (v_a.id is null or s.school_year = v_a.school_year)
      order by s.school_year desc limit 1
    ),
    'billing_summary', (
      select to_jsonb(b) from public.assessment_billing_summaries b
      where b.assessment_id = v_payment.assessment_id
    ),
    'collection_summary', (
      select to_jsonb(c) from public.payment_collection_summaries c
      where c.payment_id = v_payment.id
    )
  );
end
$$;

create or replace function public.replace_draft_assessment_fees(
  p_assessment_id uuid,
  p_fees jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_a public.assessments%rowtype;
  v_total numeric(15,2);
begin
  if p_fees is null or jsonb_typeof(p_fees) <> 'array' then
    raise exception 'Assessment fees must be a JSON array';
  end if;

  select * into v_a
  from public.assessments
  where id = p_assessment_id
  for update;
  if not found then raise exception 'Assessment % was not found', p_assessment_id; end if;
  if v_a.approval_status = 'Approved for Payment' then
    raise exception 'Approved assessment fees are immutable';
  end if;

  delete from public.assessment_fees
  where assessment_id = p_assessment_id;

  insert into public.assessment_fees(
    assessment_id, fee_name, category, amount, quantity, unit_amount,
    revenue_account_code
  )
  select
    p_assessment_id,
    btrim(fee ->> 'fee_name'),
    fee ->> 'category',
    (fee ->> 'amount')::numeric(15,2),
    coalesce((fee ->> 'quantity')::numeric, 1),
    coalesce(
      (fee ->> 'unit_amount')::numeric,
      (fee ->> 'amount')::numeric / nullif(coalesce((fee ->> 'quantity')::numeric, 1), 0)
    ),
    nullif(fee ->> 'revenue_account_code', '')
  from jsonb_array_elements(p_fees) fee;

  select coalesce(sum(amount), 0)::numeric(15,2)
  into v_total
  from public.assessment_fees
  where assessment_id = p_assessment_id;

  update public.assessments
  set total_amount = v_total,
      balance = v_total,
      is_paid = (v_total = 0),
      updated_at = now()
  where id = p_assessment_id
  returning * into v_a;

  return to_jsonb(v_a) || coalesce((
    select jsonb_build_object(
      'total_amount', gross_charges + debit_adjustments,
      'discount_amount', discount_amount,
      'balance', balance,
      'is_paid', is_paid,
      'last_payment_date', last_payment_date
    )
    from public.assessment_financials
    where assessment_id = p_assessment_id
  ), '{}'::jsonb);
end
$$;

create or replace function public.post_student_adjustment(
  p_assessment_id uuid,
  p_amount numeric,
  p_direction text,
  p_description text,
  p_posted_by text,
  p_entry_type text default 'Adjustment'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_a public.assessments%rowtype;
  v_before public.assessment_financials%rowtype;
  v_after public.assessment_financials%rowtype;
  v_x public.student_finance_adjustments%rowtype;
  v_type text;
  v_debit_account text;
  v_credit_account text;
begin
  if p_amount is null or p_amount <= 0 then raise exception 'Adjustment amount must be positive'; end if;
  if p_direction not in ('debit', 'credit') then raise exception 'Direction must be debit or credit'; end if;
  if p_entry_type not in ('Adjustment', 'Discount') then raise exception 'Unsupported entry type'; end if;

  select * into v_a from public.assessments where id = p_assessment_id for update;
  if not found then raise exception 'Assessment % was not found', p_assessment_id; end if;
  perform public.app_require_finance_writes_enabled();
  perform public.app_require_permission(
    'ACCOUNTING', 'ledger', 'post', v_a.school_id
  );
  p_posted_by := coalesce(public.app_current_user_name(), p_posted_by);
  if v_a.approval_status <> 'Approved for Payment' then
    raise exception 'Only approved assessments may receive posted adjustments';
  end if;

  select * into v_before from public.assessment_financials
  where assessment_id = p_assessment_id;
  if p_direction = 'credit' and p_amount > v_before.balance then
    raise exception 'Credit amount % exceeds assessment balance %', p_amount, v_before.balance;
  end if;

  v_type := case
    when p_direction = 'debit' then 'Debit'
    when p_entry_type = 'Discount' then 'Discount'
    else 'Credit'
  end;

  insert into public.student_finance_adjustments(
    assessment_id, invoice_id, adjustment_type, amount, description, posted_by
  ) values (
    p_assessment_id,
    (select id from public.student_finance_invoices
      where assessment_id = p_assessment_id),
    v_type, p_amount, p_description, p_posted_by
  )
  returning * into v_x;

  if v_type = 'Debit' then
    v_debit_account := '1130';
    v_credit_account := '4200';
  else
    v_debit_account := '5260';
    v_credit_account := '1130';
  end if;

  perform public.student_finance_post_two_line_journal(
    'Adjustment', null, null, v_x.id, current_date, v_a.school_id,
    v_x.id::text, p_description, p_posted_by,
    v_debit_account, v_credit_account, p_amount
  );
  if v_x.invoice_id is not null then
    perform public.student_finance_restate_invoice_plan(
      v_x.invoice_id, p_posted_by
    );
  end if;

  select * into v_after from public.assessment_financials
  where assessment_id = p_assessment_id;

  return jsonb_build_object(
    'assessment', to_jsonb(v_a) || jsonb_build_object(
      'total_amount', v_after.gross_charges + v_after.debit_adjustments,
      'discount_amount', v_after.discount_amount,
      'balance', v_after.balance,
      'is_paid', v_after.is_paid,
      'last_payment_date', v_after.last_payment_date
    ),
    'ledger_transaction', (
      select to_jsonb(l) from public.ledger_transactions l
      where l.source_type = 'StudentAdjustment' and l.source_id = v_x.id
    )
  );
end
$$;

create or replace function public.submit_student_discount_request(
  p_student_id uuid,
  p_discount_type_id uuid,
  p_sibling_names text[] default '{}',
  p_remarks text default null,
  p_attachment_names text[] default '{}'
)
returns public.discount_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.discount_requests%rowtype;
  v_school_id uuid;
  v_actor text;
begin
  perform public.app_require_finance_writes_enabled();
  select school_id into v_school_id from public.students where id = p_student_id;
  if not found then raise exception 'Student % was not found', p_student_id; end if;
  if not exists (
    select 1 from public.discount_types where id = p_discount_type_id and is_active
  ) then raise exception 'Active discount type % was not found', p_discount_type_id; end if;
  perform public.app_require_permission(
    'ACCOUNTING', 'discounts', 'create', v_school_id
  );
  v_actor := public.app_current_user_name();

  insert into public.discount_requests(
    reference_no, student_id, discount_type_id, requested_by, status,
    sibling_names, level1_status, level2_status, remarks, attachment_names
  ) values (
    'DISC-' || extract(year from current_date)::integer::text || '-'
      || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
    p_student_id, p_discount_type_id, v_actor, 'Pending',
    coalesce(p_sibling_names, '{}'), 'Pending', 'Pending', p_remarks,
    coalesce(p_attachment_names, '{}')
  ) returning * into v_request;

  insert into public.discount_request_audit_trail(
    discount_request_id, action, performed_by, performed_at, details
  ) values (
    v_request.id, 'REQUEST_SUBMITTED', v_actor, now(),
    coalesce(p_remarks, 'Discount request submitted')
  );
  return v_request;
end
$$;

create or replace function public.reject_student_discount_request(
  p_request_id uuid,
  p_level integer,
  p_rejected_by text,
  p_remarks text default null
)
returns public.discount_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.discount_requests%rowtype;
  v_school_id uuid;
  v_actor text;
begin
  perform public.app_require_finance_writes_enabled();
  if p_level not in (1, 2) then raise exception 'Rejection level must be 1 or 2'; end if;
  select r.* into v_request
  from public.discount_requests r
  join public.students s on s.id = r.student_id
  where r.id = p_request_id
  for update of r;
  if not found then raise exception 'Discount request % was not found', p_request_id; end if;
  select school_id into v_school_id
  from public.students where id = v_request.student_id;
  perform public.app_require_permission(
    'ACCOUNTING', 'discounts', 'reject', v_school_id
  );
  if v_request.status in ('Approved', 'Rejected', 'Cancelled', 'Expired') then
    raise exception 'Discount request is not rejectable in status %', v_request.status;
  end if;
  v_actor := public.app_current_user_name();

  update public.discount_requests set
    level1_status = case when p_level = 1 then 'Rejected' else level1_status end,
    level1_approved_by = case when p_level = 1 then v_actor else level1_approved_by end,
    level1_approved_at = case when p_level = 1 then now() else level1_approved_at end,
    level2_status = case when p_level = 2 then 'Rejected' else level2_status end,
    level2_approved_by = case when p_level = 2 then v_actor else level2_approved_by end,
    level2_approved_at = case when p_level = 2 then now() else level2_approved_at end,
    status = 'Rejected', remarks = coalesce(p_remarks, remarks), updated_at = now()
  where id = p_request_id returning * into v_request;

  insert into public.discount_request_audit_trail(
    discount_request_id, action, performed_by, performed_at, details
  ) values (
    v_request.id, 'LEVEL_' || p_level::text || '_REJECTED', v_actor, now(),
    coalesce(p_remarks, 'Rejected at level ' || p_level::text)
  );
  return v_request;
end
$$;

create or replace function public.approve_student_discount_request(
  p_request_id uuid,
  p_level integer,
  p_approved_by text,
  p_remarks text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.discount_requests%rowtype;
  v_discount public.discount_types%rowtype;
  v_assessment public.assessments%rowtype;
  v_fin public.assessment_financials%rowtype;
  v_adjustment public.student_finance_adjustments%rowtype;
  v_level1 text;
  v_level2 text;
  v_status text;
  v_amount numeric(15,2);
  v_assessment_count integer;
  v_assessment_id uuid;
begin
  perform public.app_require_finance_writes_enabled();
  if p_level not in (1, 2) then
    raise exception 'Approval level must be 1 or 2';
  end if;

  select * into v_request
  from public.discount_requests
  where id = p_request_id
  for update;
  if not found then raise exception 'Discount request % was not found', p_request_id; end if;
  perform public.app_require_permission(
    'ACCOUNTING', 'discounts', 'approve',
    (select school_id from public.students where id = v_request.student_id)
  );
  p_approved_by := coalesce(public.app_current_user_name(), p_approved_by);
  if v_request.status in ('Rejected', 'Cancelled', 'Expired') then
    raise exception 'Discount request is not approvable in status %', v_request.status;
  end if;

  v_level1 := case when p_level = 1 then 'Approved' else v_request.level1_status end;
  v_level2 := case when p_level = 2 then 'Approved' else v_request.level2_status end;
  v_status := case
    when v_level1 = 'Approved' and v_level2 = 'Approved' then 'Approved'
    else 'For Review'
  end;

  if v_status = 'Approved' then
    select count(*), (array_agg(a.id order by a.created_at desc, a.id desc))[1]
    into v_assessment_count, v_assessment_id
    from public.assessments a
    join public.assessment_financials af on af.assessment_id = a.id
    where a.student_id = v_request.student_id
      and a.approval_status = 'Approved for Payment'
      and af.balance > 0;

    if v_assessment_count <> 1 then
      raise exception 'Exactly one approved collectible assessment is required; found %',
        v_assessment_count;
    end if;

    select * into v_assessment
    from public.assessments
    where id = v_assessment_id
    for update;
    select * into v_fin
    from public.assessment_financials
    where assessment_id = v_assessment.id;

    select * into v_discount
    from public.discount_types
    where id = v_request.discount_type_id;
    if not found then raise exception 'Discount type is not configured'; end if;

    v_amount := case
      when v_discount.discount_basis = 'Fixed Amount'
        then coalesce(v_discount.discount_fixed_amount, 0)
      else round(v_fin.gross_charges * v_discount.discount_percent / 100, 2)
    end;
    if v_discount.max_amount is not null then
      v_amount := least(v_amount, v_discount.max_amount);
    end if;
    if v_amount <= 0 then raise exception 'Calculated discount amount must be positive'; end if;
    if v_amount > v_fin.balance then
      raise exception 'Discount amount % exceeds assessment balance %', v_amount, v_fin.balance;
    end if;

    select * into v_adjustment
    from public.student_finance_adjustments
    where discount_request_id = v_request.id;

    if v_adjustment.id is null then
      insert into public.student_finance_adjustments(
        assessment_id, invoice_id, discount_request_id, adjustment_type, amount,
        description, status, idempotency_key, posted_by
      ) values (
        v_assessment.id,
        (select id from public.student_finance_invoices
          where assessment_id = v_assessment.id),
        v_request.id, 'Discount', v_amount,
        coalesce(v_discount.name, 'Approved student discount'),
        'Posted', 'discount-request:' || v_request.id::text, p_approved_by
      )
      returning * into v_adjustment;

      perform public.student_finance_post_two_line_journal(
        'Adjustment', null, null, v_adjustment.id, current_date,
        v_assessment.school_id, v_request.reference_no,
        v_adjustment.description, p_approved_by,
        '5260', '1130', v_adjustment.amount
      );
      if v_adjustment.invoice_id is not null then
        perform public.student_finance_restate_invoice_plan(
          v_adjustment.invoice_id, p_approved_by
        );
      end if;
    end if;
  end if;

  update public.discount_requests
  set level1_status = v_level1,
      level1_approved_by = case when p_level = 1 then p_approved_by else level1_approved_by end,
      level1_approved_at = case when p_level = 1 then now() else level1_approved_at end,
      level2_status = v_level2,
      level2_approved_by = case when p_level = 2 then p_approved_by else level2_approved_by end,
      level2_approved_at = case when p_level = 2 then now() else level2_approved_at end,
      status = v_status,
      updated_at = now()
  where id = p_request_id
  returning * into v_request;

  insert into public.discount_request_audit_trail(
    discount_request_id, action, performed_by, performed_at, details
  ) values (
    v_request.id, 'LEVEL_' || p_level::text || '_APPROVED',
    p_approved_by, now(), coalesce(p_remarks, 'Approved at level ' || p_level::text)
  );

  if v_assessment.id is not null then
    select * into v_fin from public.assessment_financials
    where assessment_id = v_assessment.id;
  end if;

  return jsonb_build_object(
    'discount_request', to_jsonb(v_request),
    'adjustment', case when v_adjustment.id is null then null else to_jsonb(v_adjustment) end,
    'assessment', case when v_assessment.id is null then null else
      to_jsonb(v_assessment) || jsonb_build_object(
        'total_amount', v_fin.gross_charges + v_fin.debit_adjustments,
        'discount_amount', v_fin.discount_amount,
        'balance', v_fin.balance,
        'is_paid', v_fin.is_paid,
        'last_payment_date', v_fin.last_payment_date
      )
    end
  );
end
$$;

create or replace function public.submit_payment_void_request(
  p_payment_id uuid,
  p_requested_by text,
  p_reason text
)
returns public.payment_void_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments%rowtype;
  v_request public.payment_void_requests%rowtype;
begin
  select * into v_payment from public.payments where id = p_payment_id;
  if not found then raise exception 'Payment % was not found', p_payment_id; end if;
  if v_payment.status = 'Voided' then raise exception 'Payment is already voided'; end if;

  insert into public.payment_void_requests(payment_id, school_id, requested_by, reason)
  values (p_payment_id, v_payment.school_id, p_requested_by, p_reason)
  returning * into v_request;
  return v_request;
end
$$;

create or replace function public.review_payment_void_request(
  p_request_id uuid,
  p_approved boolean,
  p_reviewed_by text,
  p_remarks text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.payment_void_requests%rowtype;
  v_payment public.payments%rowtype;
  v_method public.student_payment_methods%rowtype;
  v_category public.student_collection_categories%rowtype;
  v_a public.assessments%rowtype;
  v_fin public.assessment_financials%rowtype;
  v_debit_account text;
begin
  select * into v_request
  from public.payment_void_requests
  where id = p_request_id
  for update;
  if not found then raise exception 'Void request % was not found', p_request_id; end if;
  if v_request.status <> 'Pending Void Approval' then
    raise exception 'Void request is already finalized';
  end if;

  select * into v_payment
  from public.payments
  where id = v_request.payment_id
  for update;

  update public.payment_void_requests
  set status = case when p_approved then 'Approved' else 'Rejected' end,
      reviewed_by = p_reviewed_by,
      reviewed_at = now(),
      review_remarks = p_remarks,
      updated_at = now()
  where id = p_request_id
  returning * into v_request;

  if p_approved then
    if v_payment.status = 'Voided' then raise exception 'Payment is already voided'; end if;

    update public.payments
    set status = 'Voided',
        voided_by = p_reviewed_by,
        voided_at = now(),
        void_reason = v_request.reason,
        updated_at = now()
    where id = v_payment.id
    returning * into v_payment;

    select * into v_method
    from public.student_payment_methods
    where id = v_payment.payment_method_id;

    if v_payment.transaction_type = 'AR' then
      v_debit_account := '1130';
    else
      select * into v_category
      from public.student_collection_categories
      where id = v_payment.collection_category_id;
      v_debit_account := v_category.revenue_account_code;
    end if;

    perform public.student_finance_post_two_line_journal(
      'PaymentVoid', null, v_payment.id, null, current_date,
      v_payment.school_id, v_payment.or_number,
      'Void reversal for ' || coalesce(v_payment.or_number, v_payment.id::text),
      p_reviewed_by, v_debit_account, v_method.cash_account_code, v_payment.amount
    );

    if v_payment.assessment_id is not null then
      select * into v_a from public.assessments where id = v_payment.assessment_id;
      select * into v_fin from public.assessment_financials
      where assessment_id = v_payment.assessment_id;

      update public.enrollments
      set status = case
        when v_fin.posted_payments > 0 then 'Partially Paid'
        else 'For Payment'
      end,
      updated_at = now()
      where id = v_a.enrollment_id or assessment_id = v_a.id;

      update public.students
      set enrollment_status = case
        when v_fin.posted_payments > 0 then 'Partially Paid'
        else 'For Payment'
      end,
      updated_at = now()
      where id = v_payment.student_id;
    end if;
  end if;

  return jsonb_build_object(
    'void_request', to_jsonb(v_request),
    'payment', to_jsonb(v_payment)
  );
end
$$;

create or replace function public.set_student_assessment_hold(
  p_assessment_id uuid,
  p_status text,
  p_actor text
)
returns public.assessments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_a public.assessments%rowtype;
begin
  perform public.app_require_finance_writes_enabled();
  select * into v_a from public.assessments
  where id = p_assessment_id for update;
  if not found then raise exception 'Assessment % was not found', p_assessment_id; end if;
  perform public.app_require_permission(
    'ACCOUNTING', 'holds', 'manage', v_a.school_id
  );
  p_actor := coalesce(public.app_current_user_name(), p_actor);
  if p_status not in ('None', 'Hold', 'Cleared') then
    raise exception 'Unsupported hold status %', p_status;
  end if;
  update public.assessments
  set financial_hold_status = p_status, updated_at = now()
  where id = p_assessment_id
  returning * into v_a;
  return v_a;
end
$$;

create or replace function public.set_financial_hold_record_status(
  p_hold_id uuid,
  p_status text,
  p_actor text,
  p_remarks text default null
)
returns public.financial_holds
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hold public.financial_holds%rowtype;
  v_school_id uuid;
begin
  perform public.app_require_finance_writes_enabled();
  select h.* into v_hold
  from public.financial_holds h
  join public.students s on s.id = h.student_id
  where h.id = p_hold_id
  for update of h;
  if not found then raise exception 'Financial hold % was not found', p_hold_id; end if;
  select school_id into v_school_id
  from public.students where id = v_hold.student_id;
  perform public.app_require_permission(
    'ACCOUNTING', 'holds', 'manage', v_school_id
  );
  p_actor := coalesce(public.app_current_user_name(), p_actor);
  if p_status not in ('Active', 'Cleared') then
    raise exception 'Unsupported hold status %', p_status;
  end if;
  update public.financial_holds
  set status = p_status,
      cleared_by = case when p_status = 'Cleared' then p_actor else null end,
      cleared_at = case when p_status = 'Cleared' then now() else null end,
      clearance_remarks = case when p_status = 'Cleared' then p_remarks else null end,
      updated_at = now()
  where id = p_hold_id
  returning * into v_hold;
  return v_hold;
end
$$;

-- Link any already-source-tagged journals first, then create only the missing
-- canonical postings. This avoids duplicate GL entries during legacy backfill.
do $$
declare v_issues jsonb;
begin
  with candidates as (
    select j.*, case
      when j.source_type in ('Assessment', 'StudentAssessment') then 'Assessment'
      when j.source_type in ('Payment', 'StudentPayment') then 'Payment'
      when j.source_type in ('PaymentVoid', 'StudentPaymentVoid') then 'PaymentVoid'
      when j.source_type in ('Adjustment', 'StudentAdjustment') then 'Adjustment'
      when j.source_type in ('AdjustmentVoid', 'StudentAdjustmentVoid') then 'AdjustmentVoid'
    end as finance_event
    from public.journal_entries j
    where j.source_type in (
      'Assessment', 'StudentAssessment', 'Payment', 'StudentPayment',
      'PaymentVoid', 'StudentPaymentVoid', 'Adjustment', 'StudentAdjustment',
      'AdjustmentVoid', 'StudentAdjustmentVoid'
    )
      and nullif(btrim(j.source_id), '') is not null
  ),
  totals as (
    select j.id,
      coalesce(sum(l.debit_amount), 0)::numeric(15,2) as debits,
      coalesce(sum(l.credit_amount), 0)::numeric(15,2) as credits,
      count(l.id) as line_count
    from candidates j
    left join public.journal_entry_lines l on l.journal_entry_id = j.id
    group by j.id
  ),
  issues as (
    select 'AMBIGUOUS_EXISTING_FINANCE_JOURNAL'::text as issue,
      (array_agg(j.id order by j.id::text))[1] as record_id,
      j.finance_event || ':' || j.source_id as reference
    from candidates j
    group by j.finance_event, j.source_id
    having count(*) > 1

    union all

    select 'INVALID_EXISTING_FINANCE_JOURNAL', j.id,
      j.finance_event || ':' || j.source_id
    from candidates j
    join totals t on t.id = j.id
    left join public.assessments a
      on j.finance_event = 'Assessment' and a.id::text = j.source_id
    left join public.payments p
      on j.finance_event in ('Payment', 'PaymentVoid') and p.id::text = j.source_id
    left join public.student_finance_adjustments x
      on j.finance_event in ('Adjustment', 'AdjustmentVoid') and x.id::text = j.source_id
    left join public.assessments xa on xa.id = x.assessment_id
    where j.status <> 'Posted'
       or t.line_count < 2
       or t.debits <> t.credits
       or j.school_id::text is distinct from coalesce(a.school_id, p.school_id, xa.school_id)::text

    union all

    select 'INVALID_ASSESSMENT_JOURNAL_ACCOUNTS', j.id, j.source_id
    from candidates j
    join public.assessments a on a.id::text = j.source_id
    where j.finance_event = 'Assessment'
      and coalesce((
        select sum(l.debit_amount)
        from public.journal_entry_lines l
        where l.journal_entry_id = j.id and l.account_code = '1130'
      ), 0) <> coalesce((
        select sum(f.amount) from public.assessment_fees f
        where f.assessment_id = a.id
      ), 0)

    union all

    select 'INVALID_PAYMENT_JOURNAL_ACCOUNTS', j.id, j.source_id
    from candidates j
    join public.payments p on p.id::text = j.source_id
    join public.student_payment_methods m on m.id = p.payment_method_id
    left join public.student_collection_categories c on c.id = p.collection_category_id
    where j.finance_event = 'Payment'
      and (
        coalesce((select sum(l.debit_amount) from public.journal_entry_lines l
          where l.journal_entry_id = j.id and l.account_code = m.cash_account_code), 0) <> p.amount
        or coalesce((select sum(l.credit_amount) from public.journal_entry_lines l
          where l.journal_entry_id = j.id
            and l.account_code = case when p.transaction_type = 'AR' then '1130'
              else c.revenue_account_code end), 0) <> p.amount
      )

    union all

    select 'INVALID_PAYMENT_VOID_JOURNAL_ACCOUNTS', j.id, j.source_id
    from candidates j
    join public.payments p on p.id::text = j.source_id
    join public.student_payment_methods m on m.id = p.payment_method_id
    left join public.student_collection_categories c on c.id = p.collection_category_id
    where j.finance_event = 'PaymentVoid'
      and (
        coalesce((select sum(l.credit_amount) from public.journal_entry_lines l
          where l.journal_entry_id = j.id and l.account_code = m.cash_account_code), 0) <> p.amount
        or coalesce((select sum(l.debit_amount) from public.journal_entry_lines l
          where l.journal_entry_id = j.id
            and l.account_code = case when p.transaction_type = 'AR' then '1130'
              else c.revenue_account_code end), 0) <> p.amount
      )

    union all

    select 'INVALID_ADJUSTMENT_JOURNAL_ACCOUNTS', j.id, j.source_id
    from candidates j
    join public.student_finance_adjustments x on x.id::text = j.source_id
    where j.finance_event in ('Adjustment', 'AdjustmentVoid')
      and (
        coalesce((select sum(l.debit_amount) from public.journal_entry_lines l
          where l.journal_entry_id = j.id
            and l.account_code = case
              when j.finance_event = 'Adjustment' and x.adjustment_type = 'Debit' then '1130'
              when j.finance_event = 'Adjustment' then '5260'
              when x.adjustment_type = 'Debit' then '4200'
              else '1130' end), 0) <> x.amount
        or coalesce((select sum(l.credit_amount) from public.journal_entry_lines l
          where l.journal_entry_id = j.id
            and l.account_code = case
              when j.finance_event = 'Adjustment' and x.adjustment_type = 'Debit' then '4200'
              when j.finance_event = 'Adjustment' then '1130'
              when x.adjustment_type = 'Debit' then '1130'
              else '5260' end), 0) <> x.amount
      )
  )
  select jsonb_agg(to_jsonb(issues)) into v_issues from issues;

  if v_issues is not null then
    raise exception using
      message = 'Existing finance-journal preflight failed',
      detail = v_issues::text,
      hint = 'Resolve duplicate, unbalanced, cross-school, or incorrectly mapped journals before rerunning.';
  end if;
end
$$;

insert into public.student_finance_journal_links(
  event_type, journal_entry_id, assessment_id
)
select 'Assessment', j.id, a.id
from public.journal_entries j
join public.assessments a on j.source_id = a.id::text
where j.source_type in ('Assessment', 'StudentAssessment')
  and nullif(btrim(j.source_id), '') is not null
;

insert into public.student_finance_journal_links(
  event_type, journal_entry_id, payment_id
)
select
  case when j.source_type in ('PaymentVoid', 'StudentPaymentVoid')
    then 'PaymentVoid' else 'Payment' end,
  j.id,
  p.id
from public.journal_entries j
join public.payments p on j.source_id = p.id::text
where j.source_type in ('Payment', 'StudentPayment', 'PaymentVoid', 'StudentPaymentVoid')
  and nullif(btrim(j.source_id), '') is not null
;

insert into public.student_finance_journal_links(
  event_type, journal_entry_id, adjustment_id
)
select
  case when j.source_type in ('AdjustmentVoid', 'StudentAdjustmentVoid')
    then 'AdjustmentVoid' else 'Adjustment' end,
  j.id,
  x.id
from public.journal_entries j
join public.student_finance_adjustments x on j.source_id = x.id::text
where j.source_type in (
  'Adjustment', 'StudentAdjustment', 'AdjustmentVoid', 'StudentAdjustmentVoid'
)
  and nullif(btrim(j.source_id), '') is not null;

do $$
declare
  r record;
begin
  for r in
    select id, coalesce(approved_by, submitted_by, 'Legacy migration') as actor
    from public.assessments a
    where approval_status = 'Approved for Payment'
      and exists (
        select 1 from public.assessment_fees f
        where f.assessment_id = a.id
        group by f.assessment_id
        having sum(f.amount) > 0
      )
      and not exists (
        select 1 from public.student_finance_journal_links l
        where l.assessment_id = a.id and l.event_type = 'Assessment'
      )
  loop
    perform public.approve_student_assessment(r.id, r.actor, 'Normalized finance backfill');
  end loop;
end
$$;

do $$
declare
  r record;
  v_method public.student_payment_methods%rowtype;
  v_category public.student_collection_categories%rowtype;
  v_credit_account text;
begin
  for r in
    select p.*
    from public.payments p
    where p.amount > 0
      and not exists (
      select 1 from public.student_finance_journal_links l
      where l.payment_id = p.id and l.event_type = 'Payment'
    )
  loop
    select * into v_method
    from public.student_payment_methods
    where id = r.payment_method_id;

    if r.transaction_type = 'AR' then
      v_credit_account := '1130';
    else
      select * into v_category
      from public.student_collection_categories
      where id = r.collection_category_id;
      v_credit_account := v_category.revenue_account_code;
    end if;

    perform public.student_finance_post_two_line_journal(
      'Payment', null, r.id, null, r.payment_date::date, r.school_id,
      r.or_number, 'Student payment ' || coalesce(r.or_number, r.id::text),
      coalesce(r.posted_by, 'Legacy migration'),
      v_method.cash_account_code, v_credit_account, r.amount
    );

    if r.status = 'Voided' and not exists (
      select 1 from public.student_finance_journal_links l
      where l.payment_id = r.id and l.event_type = 'PaymentVoid'
    ) then
      perform public.student_finance_post_two_line_journal(
        'PaymentVoid', null, r.id, null,
        coalesce(r.voided_at::date, r.payment_date::date), r.school_id,
        r.or_number, 'Void reversal for ' || coalesce(r.or_number, r.id::text),
        coalesce(r.voided_by, 'Legacy migration'),
        v_credit_account, v_method.cash_account_code, r.amount
      );
    end if;
  end loop;
end
$$;

-- --------------------------------------------------------------------------
-- 7. Immutability, reconciliation, security, and realtime
-- --------------------------------------------------------------------------

create or replace function public.student_finance_protect_approved_assessment()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.approval_status is distinct from 'Approved for Payment'
     and new.approval_status = 'Approved for Payment'
     and coalesce(current_setting('app.student_finance_approval_rpc', true), 'off') <> 'on'
  then
    raise exception 'Assessment approval must use approve_student_assessment()';
  end if;

  if old.approval_status = 'Approved for Payment' and (
    new.student_id is distinct from old.student_id
    or new.enrollment_id is distinct from old.enrollment_id
    or new.school_id is distinct from old.school_id
    or new.school_year is distinct from old.school_year
    or new.semester is distinct from old.semester
    or new.approval_status is distinct from old.approval_status
    or new.total_amount is distinct from old.total_amount
    or new.discount_amount is distinct from old.discount_amount
    or new.balance is distinct from old.balance
  ) then
    raise exception 'Approved assessments are immutable; post an adjustment or void workflow';
  end if;
  return new;
end
$$;

drop trigger if exists trg_student_finance_protect_approved_assessment
  on public.assessments;
create trigger trg_student_finance_protect_approved_assessment
before update on public.assessments
for each row execute function public.student_finance_protect_approved_assessment();

create or replace function public.student_finance_normalize_fee_line()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_department text;
begin
  new.quantity := coalesce(new.quantity, 1);
  new.unit_amount := coalesce(new.unit_amount, round(new.amount / new.quantity, 2));
  new.amount := round(new.quantity * new.unit_amount, 2);

  if new.revenue_account_code is null then
    select s.department into v_department
    from public.assessments a
    join public.students s on s.id = a.student_id
    where a.id = new.assessment_id;

    new.revenue_account_code := case
      when new.category = 'Tuition' and v_department = 'College' then '4120'
      when new.category = 'Tuition' then '4110'
      else '4200'
    end;
  end if;

  return new;
end
$$;

drop trigger if exists trg_student_finance_normalize_fee
  on public.assessment_fees;
create trigger trg_student_finance_normalize_fee
before insert or update on public.assessment_fees
for each row execute function public.student_finance_normalize_fee_line();

create or replace function public.student_finance_protect_approved_fees()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_assessment_id uuid;
begin
  v_assessment_id := case
    when tg_op = 'DELETE' then old.assessment_id
    else new.assessment_id
  end;
  if exists (
    select 1 from public.assessments
    where id = v_assessment_id and approval_status = 'Approved for Payment'
  ) then
    raise exception 'Approved assessment fee lines are immutable; post an adjustment instead';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end
$$;

drop trigger if exists trg_student_finance_protect_approved_fees
  on public.assessment_fees;
create trigger trg_student_finance_protect_approved_fees
before insert or update or delete on public.assessment_fees
for each row execute function public.student_finance_protect_approved_fees();

create or replace function public.student_finance_protect_linked_journal()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if exists (
    select 1
    from public.student_finance_journal_links
    where journal_entry_id = old.id
  ) then
    raise exception 'Student-finance journals are immutable; post a reversal instead';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end
$$;

drop trigger if exists trg_student_finance_protect_linked_journal
  on public.journal_entries;
create trigger trg_student_finance_protect_linked_journal
before update or delete on public.journal_entries
for each row execute function public.student_finance_protect_linked_journal();

create or replace function public.student_finance_protect_linked_journal_line()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_journal_id uuid;
begin
  v_journal_id := case
    when tg_op = 'INSERT' then new.journal_entry_id
    else old.journal_entry_id
  end;
  if exists (
    select 1
    from public.student_finance_journal_links
    where journal_entry_id = v_journal_id
  ) then
    raise exception 'Student-finance journal lines are immutable; post a reversal instead';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end
$$;

drop trigger if exists trg_student_finance_protect_linked_journal_line
  on public.journal_entry_lines;
create trigger trg_student_finance_protect_linked_journal_line
before insert or update or delete on public.journal_entry_lines
for each row execute function public.student_finance_protect_linked_journal_line();

create or replace view public.student_finance_reconciliation
with (security_invoker = true)
as
select
  a.id as assessment_id,
  a.student_id,
  a.school_year,
  a.semester,
  af.gross_charges,
  af.debit_adjustments,
  af.credit_adjustments,
  af.posted_payments,
  af.balance as calculated_balance,
  a.balance as legacy_stored_balance,
  (af.balance >= 0) as nonnegative_balance,
  (a.balance = af.balance) as legacy_balance_matches,
  exists (
    select 1
    from public.student_finance_journal_links l
    join public.journal_entries j on j.id = l.journal_entry_id
    where l.assessment_id = a.id
      and l.event_type = 'Assessment'
      and j.status = 'Posted'
  ) as assessment_journal_exists
from public.assessments a
join public.assessment_financials af on af.assessment_id = a.id;

create or replace view public.student_finance_unlinked_records
with (security_invoker = true)
as
select
  'AR_PAYMENT_WITHOUT_ASSESSMENT'::text as issue,
  p.id as record_id,
  p.student_id,
  p.payment_date::text as record_date,
  coalesce(p.or_number, p.id::text) as reference
from public.payments p
where p.transaction_type = 'AR' and p.assessment_id is null
union all
select
  'ASSESSMENT_WITHOUT_ENROLLMENT',
  a.id,
  a.student_id,
  a.created_at::text,
  a.school_year || ' / ' || coalesce(a.semester, 'N/A')
from public.assessments a
where a.enrollment_id is null
union all
select
  'APPROVED_ASSESSMENT_WITHOUT_CHARGES',
  a.id,
  a.student_id,
  a.created_at::text,
  a.school_year || ' / ' || coalesce(a.semester, 'N/A')
from public.assessments a
where a.approval_status = 'Approved for Payment'
  and not exists (
    select 1 from public.assessment_fees f
    where f.assessment_id = a.id and f.amount > 0
  )
union all
select
  'NONPOSITIVE_PAYMENT',
  p.id,
  p.student_id,
  p.payment_date::text,
  coalesce(p.or_number, p.id::text)
from public.payments p
where p.amount <= 0;

alter table public.student_payment_methods enable row level security;
alter table public.student_collection_categories enable row level security;
alter table public.student_finance_adjustments enable row level security;
alter table public.payment_void_requests enable row level security;
alter table public.student_finance_journal_links enable row level security;

drop policy if exists "student_payment_methods_read" on public.student_payment_methods;
create policy "student_payment_methods_read"
  on public.student_payment_methods for select to authenticated using (true);

drop policy if exists "student_collection_categories_read" on public.student_collection_categories;
create policy "student_collection_categories_read"
  on public.student_collection_categories for select to authenticated using (true);

drop policy if exists "student_finance_adjustments_read" on public.student_finance_adjustments;
create policy "student_finance_adjustments_read"
  on public.student_finance_adjustments for select to authenticated
  using (exists (
    select 1 from public.assessments a
    where a.id = assessment_id
      and public.app_can_read_student_finance(a.student_id, a.school_id)
  ));

drop policy if exists "payment_void_requests_read" on public.payment_void_requests;
create policy "payment_void_requests_read"
  on public.payment_void_requests for select to authenticated
  using (exists (
    select 1 from public.payments p
    where p.id = payment_id
      and public.app_can_read_student_finance(p.student_id, p.school_id)
  ));

drop policy if exists "student_finance_journal_links_read" on public.student_finance_journal_links;
create policy "student_finance_journal_links_read"
  on public.student_finance_journal_links for select to authenticated
  using (
    exists (
      select 1 from public.assessments a
      where a.id = assessment_id
        and public.app_has_permission('ACCOUNTING', null, 'view', a.school_id)
    )
    or exists (
      select 1
      from public.student_finance_adjustments x
      join public.assessments a on a.id = x.assessment_id
      where x.id = adjustment_id
        and public.app_has_permission('ACCOUNTING', null, 'view', a.school_id)
    )
    or exists (
      select 1 from public.payments p
      where p.id = payment_id
        and public.app_has_permission('ACCOUNTING', null, 'view', p.school_id)
    )
  );

revoke insert, update, delete on public.payments from anon, authenticated;
revoke insert, update, delete on public.student_finance_adjustments from anon, authenticated;
revoke insert, update, delete on public.payment_void_requests from anon, authenticated;
revoke insert, update, delete on public.student_finance_journal_links from anon, authenticated;

grant select on
  public.assessment_financials,
  public.ledger_transactions,
  public.student_ledger_summaries,
  public.assessment_billing_summaries,
  public.payment_collection_summaries,
  public.student_finance_reconciliation,
  public.student_finance_unlinked_records
to authenticated;

revoke execute on function public.student_finance_new_journal(
  date, uuid, text, text, text
) from public;
revoke execute on function public.student_finance_post_two_line_journal(
  text, uuid, uuid, uuid, date, uuid, text, text, text, text, text, numeric
) from public;
revoke execute on function public.approve_student_assessment(uuid, text, text)
  from public;
revoke execute on function public.post_student_payment(
  uuid, uuid, uuid, numeric, text, text, text, text, text, text, text, text
) from public;
revoke execute on function public.replace_draft_assessment_fees(uuid, jsonb)
  from public;
revoke execute on function public.post_student_adjustment(uuid, numeric, text, text, text, text)
  from public;
revoke execute on function public.approve_student_discount_request(uuid, integer, text, text)
  from public;
revoke execute on function public.submit_payment_void_request(uuid, text, text)
  from public;
revoke execute on function public.review_payment_void_request(uuid, boolean, text, text)
  from public;
revoke execute on function public.set_student_assessment_hold(uuid, text, text)
  from public;
revoke execute on function public.set_financial_hold_record_status(uuid, text, text, text)
  from public;

grant execute on function public.approve_student_assessment(uuid, text, text)
  to authenticated;
grant execute on function public.post_student_payment(
  uuid, uuid, uuid, numeric, text, text, text, text, text, text, text, text
) to authenticated;
grant execute on function public.replace_draft_assessment_fees(uuid, jsonb)
  to authenticated;
grant execute on function public.post_student_adjustment(uuid, numeric, text, text, text, text)
  to authenticated;
grant execute on function public.approve_student_discount_request(uuid, integer, text, text)
  to authenticated;
grant execute on function public.submit_payment_void_request(uuid, text, text)
  to authenticated;
grant execute on function public.review_payment_void_request(uuid, boolean, text, text)
  to authenticated;
grant execute on function public.set_student_assessment_hold(uuid, text, text)
  to authenticated;
grant execute on function public.set_financial_hold_record_status(uuid, text, text, text)
  to authenticated;

do $$
declare
  v_table text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach v_table in array array[
      'assessments',
      'assessment_fees',
      'payments',
      'student_finance_adjustments',
      'payment_void_requests',
      'financial_holds'
    ]
    loop
      if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = v_table
      ) then
        execute format('alter publication supabase_realtime add table public.%I', v_table);
      end if;
    end loop;
  end if;
end
$$;

comment on view public.assessment_financials is
  'Canonical calculated balance per assessment from charges, adjustments, and posted payments.';
comment on function public.post_student_payment is
  'Atomic and idempotent posting boundary for one-assessment AR payments and standalone OR collections.';
comment on table public.student_finance_adjustments is
  'Append-only debit, credit, and discount facts for approved assessments.';
comment on table public.student_finance_journal_links is
  'Foreign-key-backed linkage between student finance events and posted GL journals.';

-- ==========================================================================
-- 8. Invoice, receipt, allocation, and snapshotted payment-plan subledger
-- ==========================================================================

insert into public.chart_of_accounts
  (legacy_id, code, name, type, normal_balance, parent_code, description, is_header, status)
values
  ('coa-2150', '2150', 'Student Deposits / Unapplied Receipts', 'Liability',
   'Credit', '2100', 'Student cash received but not yet applied to an invoice',
   false, 'Active')
on conflict do nothing;

create table if not exists public.student_payment_term_templates (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  academic_year text not null,
  code text not null,
  name text not null,
  version integer not null default 1 check (version > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, academic_year, code, version)
);

create table if not exists public.student_payment_term_template_installments (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null
    references public.student_payment_term_templates(id) on delete cascade,
  sequence_no integer not null check (sequence_no > 0),
  label text not null,
  percentage numeric(7,4) not null check (percentage > 0 and percentage <= 100),
  due_date date not null,
  unique (template_id, sequence_no)
);

create unique index if not exists ux_student_payment_term_template_active
  on public.student_payment_term_templates(school_id, academic_year, code)
  where is_active;

insert into public.student_payment_term_templates(
  school_id, academic_year, code, name, version
)
with school_years as (
  select s.id as school_id, '2026-2027'::text as academic_year
  from public.schools s
  union
  select distinct a.school_id, a.school_year
  from public.assessments a
  where a.school_id is not null and a.school_year is not null
)
select y.school_id, y.academic_year, x.code, x.name, 1
from school_years y
cross join (values
  ('CASH', 'Cash Basis'),
  ('QUARTERLY', 'Quarterly'),
  ('SEMESTRAL', 'Semestral'),
  ('INSTALLMENT_2', 'Installment - 2 Payments'),
  ('INSTALLMENT_4', 'Installment - 4 Payments')
) x(code, name)
on conflict do nothing;

do $$
declare v_invalid_years jsonb;
begin
  select jsonb_agg(distinct a.school_year) into v_invalid_years
  from public.assessments a
  where a.school_year is null
     or a.school_year !~ '^[0-9]{4}-[0-9]{4}$'
     or case when a.school_year ~ '^[0-9]{4}-[0-9]{4}$'
       then substring(a.school_year from 1 for 4)::integer + 1
          <> substring(a.school_year from 6 for 4)::integer
       else false
     end;
  if v_invalid_years is not null then
    raise exception using
      message = 'Payment-plan schedule generation requires YYYY-YYYY academic years',
      detail = v_invalid_years::text,
      hint = 'Normalize the listed assessment school_year values and rerun the migration.';
  end if;
end
$$;

insert into public.student_payment_term_template_installments(
  template_id, sequence_no, label, percentage, due_date
)
select t.id, x.sequence_no, x.label, x.percentage,
  make_date(
    substring(t.academic_year from '^([0-9]{4})')::integer + x.year_offset,
    x.due_month,
    x.due_day
  )
from public.student_payment_term_templates t
join lateral (
  select *
  from (values
    ('CASH', 1, 'Full Payment', 100.0000::numeric, 0, 6, 15),
    ('QUARTERLY', 1, 'Downpayment', 30.0000, 0, 6, 15),
    ('QUARTERLY', 2, '1st Quarter', 23.3333, 0, 9, 15),
    ('QUARTERLY', 3, '2nd Quarter', 23.3333, 0, 12, 15),
    ('QUARTERLY', 4, '3rd Quarter', 23.3334, 1, 3, 15),
    ('SEMESTRAL', 1, 'Downpayment', 30.0000, 0, 6, 15),
    ('SEMESTRAL', 2, 'Midterm', 35.0000, 0, 10, 15),
    ('SEMESTRAL', 3, 'Final', 35.0000, 1, 2, 15),
    ('INSTALLMENT_2', 1, '1st Installment', 50.0000, 0, 6, 15),
    ('INSTALLMENT_2', 2, '2nd Installment', 50.0000, 0, 10, 15),
    ('INSTALLMENT_4', 1, 'Downpayment', 25.0000, 0, 6, 15),
    ('INSTALLMENT_4', 2, '1st Installment', 25.0000, 0, 9, 15),
    ('INSTALLMENT_4', 3, '2nd Installment', 25.0000, 0, 12, 15),
    ('INSTALLMENT_4', 4, 'Final Payment', 25.0000, 1, 3, 15)
  ) v(code, sequence_no, label, percentage, year_offset, due_month, due_day)
  where v.code = t.code
) x on true
where t.academic_year ~ '^[0-9]{4}-[0-9]{4}$'
  and substring(t.academic_year from 1 for 4)::integer + 1
    = substring(t.academic_year from 6 for 4)::integer
  and t.version = 1
on conflict do nothing;

do $$
begin
  if exists (
    select 1
    from public.student_payment_term_templates t
    left join public.student_payment_term_template_installments i
      on i.template_id = t.id
    where t.is_active
    group by t.id
    having round(coalesce(sum(i.percentage), 0), 4) <> 100
  ) then
    raise exception 'Every active payment-term template must total exactly 100 percent';
  end if;
end
$$;

create or replace function public.student_finance_validate_term_template()
returns trigger
language plpgsql
set search_path = public
as $$
declare v_template_id uuid;
begin
  if tg_table_name = 'student_payment_term_templates' then
    v_template_id := case when tg_op = 'DELETE' then old.id else new.id end;
  else
    v_template_id := case
      when tg_op = 'DELETE' then old.template_id else new.template_id
    end;
  end if;
  if exists (
    select 1
    from public.student_payment_term_templates t
    where t.id = v_template_id and t.is_active
      and 100 <> round(coalesce((
        select sum(i.percentage)
        from public.student_payment_term_template_installments i
        where i.template_id = t.id
      ), 0), 4)
  ) then
    raise exception 'Active payment-term template % must total exactly 100 percent',
      v_template_id;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end
$$;

drop trigger if exists trg_validate_payment_term_template
  on public.student_payment_term_templates;
create constraint trigger trg_validate_payment_term_template
after insert or update on public.student_payment_term_templates
deferrable initially deferred
for each row execute function public.student_finance_validate_term_template();

drop trigger if exists trg_validate_payment_term_installments
  on public.student_payment_term_template_installments;
create constraint trigger trg_validate_payment_term_installments
after insert or update or delete on public.student_payment_term_template_installments
deferrable initially deferred
for each row execute function public.student_finance_validate_term_template();

create table if not exists public.student_finance_invoices (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null unique references public.assessments(id) on delete restrict,
  enrollment_id uuid references public.enrollments(id) on delete restrict,
  school_id uuid not null references public.schools(id) on delete restrict,
  student_id uuid not null references public.students(id) on delete restrict,
  invoice_no text not null,
  academic_year text not null,
  semester text,
  currency_code varchar(3) not null default 'PHP',
  status text not null check (status in ('Draft', 'Posted', 'Voided')),
  issued_at timestamptz,
  issued_by text,
  voided_at timestamptz,
  voided_by text,
  void_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, invoice_no)
);

create table if not exists public.student_finance_invoice_lines (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.student_finance_invoices(id) on delete restrict,
  assessment_fee_id uuid references public.assessment_fees(id) on delete restrict,
  line_no integer not null check (line_no > 0),
  description text not null,
  category text not null,
  quantity numeric(12,2) not null check (quantity > 0),
  unit_amount numeric(15,2) not null check (unit_amount >= 0),
  amount numeric(15,2) not null check (
    amount = round(quantity * unit_amount, 2)
  ),
  revenue_account_code text not null
    references public.chart_of_accounts(code) on update cascade on delete restrict,
  created_at timestamptz not null default now(),
  unique (invoice_id, line_no),
  unique (assessment_fee_id)
);

create table if not exists public.student_invoice_payment_plans (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null
    references public.student_finance_invoices(id) on delete restrict,
  template_id uuid not null
    references public.student_payment_term_templates(id) on delete restrict,
  template_version integer not null,
  status text not null default 'Active' check (status in ('Active', 'Superseded')),
  created_at timestamptz not null default now()
);

create unique index if not exists ux_student_invoice_active_payment_plan
  on public.student_invoice_payment_plans(invoice_id)
  where status = 'Active';

create table if not exists public.student_invoice_installments (
  id uuid primary key default gen_random_uuid(),
  payment_plan_id uuid not null
    references public.student_invoice_payment_plans(id) on delete restrict,
  sequence_no integer not null check (sequence_no > 0),
  label text not null,
  due_date date not null,
  amount numeric(15,2) not null check (amount >= 0),
  created_at timestamptz not null default now(),
  unique (payment_plan_id, sequence_no)
);

alter table public.student_finance_adjustments
  add column if not exists invoice_id uuid
    references public.student_finance_invoices(id) on delete restrict;

create table if not exists public.student_receipts (
  id uuid primary key default gen_random_uuid(),
  legacy_payment_id uuid unique references public.payments(id) on delete restrict,
  school_id uuid not null references public.schools(id) on delete restrict,
  student_id uuid not null references public.students(id) on delete restrict,
  receipt_no text not null,
  receipt_date timestamptz not null default now(),
  payment_method_id uuid not null
    references public.student_payment_methods(id) on delete restrict,
  amount numeric(15,2) not null check (amount > 0),
  currency_code varchar(3) not null default 'PHP',
  status text not null default 'Posted' check (status in ('Posted', 'Voided')),
  remarks text,
  posted_by text not null,
  posted_at timestamptz not null default now(),
  idempotency_key text,
  allow_unapplied_credit boolean not null default false,
  unapplied_authorized_by text,
  voided_by text,
  voided_at timestamptz,
  void_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, receipt_no),
  check (
    (allow_unapplied_credit and unapplied_authorized_by is not null)
    or (not allow_unapplied_credit and unapplied_authorized_by is null)
  )
);

create unique index if not exists ux_student_receipts_idempotency
  on public.student_receipts(idempotency_key)
  where idempotency_key is not null;
create unique index if not exists ux_student_receipts_school_receipt_no_ci
  on public.student_receipts(school_id, lower(receipt_no));

create table if not exists public.student_receipt_allocations (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references public.student_receipts(id) on delete restrict,
  invoice_id uuid not null references public.student_finance_invoices(id) on delete restrict,
  amount numeric(15,2) not null check (amount > 0),
  source text not null default 'Receipt'
    check (source in ('Receipt', 'UnappliedCredit', 'Reallocation')),
  idempotency_key text,
  allocated_by text not null,
  allocated_at timestamptz not null default now()
);

create unique index if not exists ux_student_receipt_allocations_idempotency
  on public.student_receipt_allocations(idempotency_key)
  where idempotency_key is not null;

create table if not exists public.student_direct_collection_lines (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references public.student_receipts(id) on delete restrict,
  collection_category_id uuid not null
    references public.student_collection_categories(id) on delete restrict,
  amount numeric(15,2) not null check (amount > 0),
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.student_allocation_reversals (
  id uuid primary key default gen_random_uuid(),
  allocation_id uuid not null
    references public.student_receipt_allocations(id) on delete restrict,
  amount numeric(15,2) not null check (amount > 0),
  reason text not null check (length(btrim(reason)) >= 5),
  reversed_by text not null,
  reversed_at timestamptz not null default now(),
  replacement_allocation_id uuid
    references public.student_receipt_allocations(id) on delete restrict,
  idempotency_key text
);

create unique index if not exists ux_student_allocation_reversals_idempotency
  on public.student_allocation_reversals(idempotency_key)
  where idempotency_key is not null;

create table if not exists public.student_allocation_reallocation_requests (
  id uuid primary key default gen_random_uuid(),
  allocation_id uuid not null
    references public.student_receipt_allocations(id) on delete restrict,
  destination_invoice_id uuid not null
    references public.student_finance_invoices(id) on delete restrict,
  amount numeric(15,2) not null check (amount > 0),
  reason text not null check (length(btrim(reason)) >= 5),
  status text not null default 'Pending'
    check (status in ('Pending', 'Approved', 'Rejected')),
  requested_by text not null,
  requested_at timestamptz not null default now(),
  reviewed_by text,
  reviewed_at timestamptz,
  review_remarks text,
  created_at timestamptz not null default now()
);

create unique index if not exists ux_student_reallocation_pending
  on public.student_allocation_reallocation_requests(allocation_id)
  where status = 'Pending';

create table if not exists public.student_receipt_void_requests (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references public.student_receipts(id) on delete restrict,
  reason text not null check (length(btrim(reason)) >= 5),
  status text not null default 'Pending'
    check (status in ('Pending', 'Approved', 'Rejected')),
  requested_by text not null,
  requested_at timestamptz not null default now(),
  reviewed_by text,
  reviewed_at timestamptz,
  review_remarks text
);

create unique index if not exists ux_student_receipt_void_pending
  on public.student_receipt_void_requests(receipt_id)
  where status = 'Pending';

create table if not exists public.student_receipt_journal_links (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (
    event_type in ('Receipt', 'ReceiptVoid', 'CreditApplication', 'Reallocation')
  ),
  journal_entry_id uuid not null unique
    references public.journal_entries(id) on delete restrict,
  receipt_id uuid references public.student_receipts(id) on delete restrict,
  allocation_id uuid references public.student_receipt_allocations(id) on delete restrict,
  reversal_id uuid references public.student_allocation_reversals(id) on delete restrict,
  created_at timestamptz not null default now(),
  check (num_nonnulls(receipt_id, allocation_id, reversal_id) = 1)
);

-- One invoice per assessment, followed by immutable line snapshots.
insert into public.student_finance_invoices(
  assessment_id, enrollment_id, school_id, student_id, invoice_no,
  academic_year, semester, status, issued_at, issued_by
)
select
  a.id, a.enrollment_id, a.school_id, a.student_id,
  'INV-' || coalesce(a.legacy_id, substr(a.id::text, 1, 12)),
  a.school_year, a.semester,
  case when a.approval_status = 'Approved for Payment' then 'Posted' else 'Draft' end,
  case when a.approval_status = 'Approved for Payment'
    then coalesce(a.approved_at, a.approved_date::timestamptz, a.created_at)
  end,
  case when a.approval_status = 'Approved for Payment'
    then coalesce(a.approved_by, a.submitted_by, 'Legacy migration')
  end
from public.assessments a
where a.school_id is not null
on conflict (assessment_id) do nothing;

insert into public.student_finance_invoice_lines(
  invoice_id, assessment_fee_id, line_no, description, category,
  quantity, unit_amount, amount, revenue_account_code
)
select
  i.id, f.id,
  row_number() over (partition by i.id order by f.created_at, f.id),
  f.fee_name, f.category, f.quantity, f.unit_amount, f.amount,
  f.revenue_account_code
from public.student_finance_invoices i
join public.assessment_fees f on f.assessment_id = i.assessment_id
on conflict (assessment_fee_id) do nothing;

update public.student_finance_adjustments a
set invoice_id = i.id
from public.student_finance_invoices i
where i.assessment_id = a.assessment_id
  and a.invoice_id is null;

-- Snapshot the configured template and installment amounts.  The last
-- installment receives the rounding remainder so the schedule always equals
-- the invoice's net amount.
insert into public.student_invoice_payment_plans(
  invoice_id, template_id, template_version
)
select i.id, t.id, t.version
from public.student_finance_invoices i
join public.assessments a on a.id = i.assessment_id
join public.student_payment_term_templates t
  on t.school_id = i.school_id
 and t.academic_year = i.academic_year
 and t.is_active
 and t.name = coalesce(a.payment_term, 'Cash Basis')
where not exists (
  select 1 from public.student_invoice_payment_plans p where p.invoice_id = i.id
)
and t.version = (
  select max(t2.version)
  from public.student_payment_term_templates t2
  where t2.school_id = t.school_id
    and t2.academic_year = t.academic_year
    and t2.code = t.code and t2.is_active
);

insert into public.student_invoice_installments(
  payment_plan_id, sequence_no, label, due_date, amount
)
select
  p.id, ti.sequence_no, ti.label, ti.due_date,
  case when ti.sequence_no = max(ti.sequence_no) over (partition by p.id)
    then net.net_amount - coalesce(sum(
      round(net.net_amount * ti.percentage / 100, 2)
    ) over (
      partition by p.id order by ti.sequence_no
      rows between unbounded preceding and 1 preceding
    ), 0)
    else round(net.net_amount * ti.percentage / 100, 2)
  end
from public.student_invoice_payment_plans p
join public.student_payment_term_template_installments ti
  on ti.template_id = p.template_id
join lateral (
  select greatest(
    coalesce(sum(l.amount), 0)
    - coalesce((
      select sum(a.amount) filter (
        where a.status = 'Posted'
          and a.adjustment_type in ('Credit', 'Discount')
      )
      from public.student_finance_adjustments a
      where a.invoice_id = p.invoice_id
    ), 0), 0
  )::numeric(15,2) as net_amount
  from public.student_finance_invoice_lines l
  where l.invoice_id = p.invoice_id
) net on true
on conflict do nothing;

-- Convert legacy payments without changing their identifiers.
insert into public.student_receipts(
  id, legacy_payment_id, school_id, student_id, receipt_no, receipt_date,
  payment_method_id, amount, currency_code, status, remarks, posted_by,
  posted_at, idempotency_key, allow_unapplied_credit, unapplied_authorized_by,
  voided_by, voided_at, void_reason
)
select
  p.id, p.id, p.school_id, p.student_id, p.or_number, p.payment_date,
  p.payment_method_id, p.amount, p.currency_code, p.status, p.remarks,
  coalesce(p.posted_by, 'Legacy migration'), p.posted_at,
  coalesce(p.idempotency_key, 'legacy-payment:' || p.id::text),
  p.transaction_type = 'AR',
  case when p.transaction_type = 'AR'
    then coalesce(p.posted_by, 'Legacy migration') end,
  p.voided_by, p.voided_at, p.void_reason
from public.payments p
where p.school_id is not null
on conflict (id) do nothing;

insert into public.student_receipt_allocations(
  receipt_id, invoice_id, amount, source, idempotency_key, allocated_by, allocated_at
)
select
  x.receipt_id, x.invoice_id, x.allocation_amount, 'Receipt',
  'legacy-payment-allocation:' || x.payment_id::text,
  x.allocated_by, x.allocated_at
from (
  select
    p.id as payment_id,
    r.id as receipt_id,
    i.id as invoice_id,
    coalesce(p.posted_by, 'Legacy migration') as allocated_by,
    p.posted_at as allocated_at,
    case
      when p.status = 'Voided' then least(p.amount, net.net_amount)
      else greatest(
        least(
          coalesce(sum(p.amount) filter (
            where p.status = 'Posted'
          ) over (
            partition by p.assessment_id
            order by p.payment_date, p.id::text
            rows between unbounded preceding and current row
          ), 0),
          net.net_amount
        )
        - least(
          coalesce(sum(p.amount) filter (
            where p.status = 'Posted'
          ) over (
            partition by p.assessment_id
            order by p.payment_date, p.id::text
            rows between unbounded preceding and 1 preceding
          ), 0),
          net.net_amount
        ),
        0
      )
    end::numeric(15,2) as allocation_amount
  from public.payments p
  join public.student_receipts r on r.legacy_payment_id = p.id
  join public.student_finance_invoices i on i.assessment_id = p.assessment_id
  join lateral (
    select greatest(
      coalesce(sum(l.amount), 0)
      - coalesce((
        select sum(a.amount) filter (
          where a.status = 'Posted'
            and a.adjustment_type in ('Credit', 'Discount')
        )
        from public.student_finance_adjustments a
        where a.invoice_id = i.id
      ), 0),
      0
    )::numeric(15,2) as net_amount
    from public.student_finance_invoice_lines l
    where l.invoice_id = i.id
  ) net on true
  where p.transaction_type = 'AR'
) x
where x.allocation_amount > 0
on conflict (idempotency_key) where idempotency_key is not null do nothing;

insert into public.student_allocation_reversals(
  allocation_id, amount, reason, reversed_by, reversed_at, idempotency_key
)
select
  a.id, a.amount, coalesce(r.void_reason, 'Legacy receipt void'),
  coalesce(r.voided_by, 'Legacy migration'),
  coalesce(r.voided_at, r.receipt_date),
  'legacy-receipt-void:' || r.id::text || ':' || a.id::text
from public.student_receipts r
join public.student_receipt_allocations a on a.receipt_id = r.id
where r.status = 'Voided'
on conflict (idempotency_key) where idempotency_key is not null do nothing;

insert into public.student_direct_collection_lines(
  receipt_id, collection_category_id, amount, description
)
select r.id, p.collection_category_id, p.amount, p.remarks
from public.payments p
join public.student_receipts r on r.legacy_payment_id = p.id
where p.transaction_type = 'OR'
  and not exists (
    select 1 from public.student_direct_collection_lines d where d.receipt_id = r.id
  );

-- Reuse the already-preflighted legacy payment journals and expose them
-- through the canonical receipt linkage. This creates no GL entry and keeps
-- the temporary legacy link only as conversion provenance.
insert into public.student_receipt_journal_links(
  event_type, journal_entry_id, receipt_id
)
select 'Receipt', l.journal_entry_id, r.id
from public.student_finance_journal_links l
join public.student_receipts r on r.legacy_payment_id = l.payment_id
where l.event_type = 'Payment'
on conflict (journal_entry_id) do nothing;

insert into public.student_receipt_journal_links(
  event_type, journal_entry_id, receipt_id
)
select 'ReceiptVoid', l.journal_entry_id, r.id
from public.student_finance_journal_links l
join public.student_receipts r on r.legacy_payment_id = l.payment_id
where l.event_type = 'PaymentVoid'
on conflict (journal_entry_id) do nothing;

create or replace view public.student_invoice_financials
with (security_invoker = true)
as
with charges as (
  select invoice_id, sum(amount)::numeric(15,2) as gross_charges
  from public.student_finance_invoice_lines group by invoice_id
),
adjustments as (
  select invoice_id,
    coalesce(sum(amount) filter (
      where status = 'Posted' and adjustment_type = 'Debit'
    ), 0)::numeric(15,2) as debits,
    coalesce(sum(amount) filter (
      where status = 'Posted' and adjustment_type in ('Credit', 'Discount')
    ), 0)::numeric(15,2) as credits,
    coalesce(sum(amount) filter (
      where status = 'Posted' and adjustment_type = 'Discount'
    ), 0)::numeric(15,2) as discounts
  from public.student_finance_adjustments
  where invoice_id is not null group by invoice_id
),
active_allocations as (
  select a.invoice_id,
    sum(a.amount - coalesce((
      select sum(r.amount) from public.student_allocation_reversals r
      where r.allocation_id = a.id
    ), 0))::numeric(15,2) as allocated
  from public.student_receipt_allocations a
  join public.student_receipts r on r.id = a.receipt_id and r.status = 'Posted'
  group by a.invoice_id
)
select
  i.id as invoice_id, i.assessment_id, i.enrollment_id, i.school_id,
  i.student_id, i.invoice_no, i.academic_year, i.semester, i.status,
  coalesce(c.gross_charges, 0)::numeric(15,2) as gross_charges,
  coalesce(x.debits, 0)::numeric(15,2) as debit_adjustments,
  coalesce(x.credits, 0)::numeric(15,2) as credit_adjustments,
  coalesce(x.discounts, 0)::numeric(15,2) as discount_amount,
  coalesce(a.allocated, 0)::numeric(15,2) as allocated_amount,
  (coalesce(c.gross_charges, 0) + coalesce(x.debits, 0)
    - coalesce(x.credits, 0) - coalesce(a.allocated, 0))::numeric(15,2)
    as balance,
  (coalesce(c.gross_charges, 0) + coalesce(x.debits, 0)
    - coalesce(x.credits, 0) - coalesce(a.allocated, 0)) = 0 as is_paid
from public.student_finance_invoices i
left join charges c on c.invoice_id = i.id
left join adjustments x on x.invoice_id = i.id
left join active_allocations a on a.invoice_id = i.id;

create or replace view public.student_receipt_financials
with (security_invoker = true)
as
select
  r.*,
  coalesce(a.allocated_amount, 0)::numeric(15,2) as allocated_amount,
  coalesce(d.direct_amount, 0)::numeric(15,2) as direct_collection_amount,
  case when r.status = 'Voided' then 0::numeric
    else greatest(r.amount - coalesce(a.allocated_amount, 0)
      - coalesce(d.direct_amount, 0), 0)
  end::numeric(15,2) as unapplied_amount
from public.student_receipts r
left join lateral (
  select sum(x.amount - coalesce((
    select sum(v.amount) from public.student_allocation_reversals v
    where v.allocation_id = x.id
  ), 0)) as allocated_amount
  from public.student_receipt_allocations x where x.receipt_id = r.id
) a on true
left join lateral (
  select sum(x.amount) as direct_amount
  from public.student_direct_collection_lines x where x.receipt_id = r.id
) d on true;

create or replace view public.student_unapplied_credits
with (security_invoker = true)
as
select id as receipt_id, school_id, student_id, receipt_no, receipt_date,
  unapplied_amount as amount, currency_code
from public.student_receipt_financials
where status = 'Posted' and unapplied_amount > 0;

create or replace view public.student_installment_standing
with (security_invoker = true)
as
with schedule as (
  select ii.*, p.invoice_id,
    coalesce(sum(ii.amount) over (
      partition by p.invoice_id order by ii.due_date, ii.sequence_no
      rows between unbounded preceding and 1 preceding
    ), 0) as prior_due
  from public.student_invoice_installments ii
  join public.student_invoice_payment_plans p on p.id = ii.payment_plan_id
  where p.status = 'Active'
)
select
  s.id, s.invoice_id, s.sequence_no, s.label, s.due_date, s.amount,
  least(s.amount, greatest(f.allocated_amount - s.prior_due, 0))::numeric(15,2)
    as paid_amount,
  (s.amount - least(s.amount,
    greatest(f.allocated_amount - s.prior_due, 0)))::numeric(15,2)
    as remaining_amount,
  case
    when f.allocated_amount >= s.prior_due + s.amount then 'Paid'
    when f.allocated_amount > s.prior_due then 'Partially Paid'
    when s.due_date < current_date then 'Overdue'
    else 'Pending'
  end::text as status
from schedule s
join public.student_invoice_financials f on f.invoice_id = s.invoice_id;

create or replace view public.student_finance_reconciliation_v2
with (security_invoker = true)
as
select
  f.invoice_id, f.assessment_id, f.student_id, f.invoice_no,
  f.gross_charges, f.discount_amount, f.allocated_amount,
  f.balance as canonical_balance, a.balance as legacy_balance,
  (f.balance = a.balance) as balance_matches,
  (f.balance >= 0) as nonnegative_balance,
  coalesce((
    select sum(i.amount) from public.student_invoice_installments i
    join public.student_invoice_payment_plans p on p.id = i.payment_plan_id
    where p.invoice_id = f.invoice_id and p.status = 'Active'
  ), 0) = greatest(
    f.gross_charges + f.debit_adjustments - f.credit_adjustments, 0
  ) as installment_total_matches
from public.student_invoice_financials f
join public.assessments a on a.id = f.assessment_id;

create or replace function public.student_finance_sync_invoice(
  p_assessment_id uuid,
  p_actor text
)
returns public.student_finance_invoices
language plpgsql
security definer
set search_path = public
as $$
declare
  v_a public.assessments%rowtype;
  v_i public.student_finance_invoices%rowtype;
  v_template public.student_payment_term_templates%rowtype;
  v_net numeric(15,2);
  v_running numeric(15,2) := 0;
  v_amount numeric(15,2);
  v_last integer;
  v_plan_id uuid;
  v_existing_posted boolean := false;
  r record;
begin
  select * into v_a from public.assessments
  where id = p_assessment_id for update;
  if not found then raise exception 'Assessment % was not found', p_assessment_id; end if;
  if v_a.school_id is null then raise exception 'Assessment school is required'; end if;

  perform set_config('app.student_invoice_issue_rpc', 'on', true);
  select status = 'Posted' into v_existing_posted
  from public.student_finance_invoices where assessment_id = v_a.id;

  insert into public.student_finance_invoices(
    assessment_id, enrollment_id, school_id, student_id, invoice_no,
    academic_year, semester, status, issued_at, issued_by
  ) values (
    v_a.id, v_a.enrollment_id, v_a.school_id, v_a.student_id,
    'INV-' || coalesce(v_a.legacy_id, substr(v_a.id::text, 1, 12)),
    v_a.school_year, v_a.semester,
    case when v_a.approval_status = 'Approved for Payment' then 'Posted' else 'Draft' end,
    case when v_a.approval_status = 'Approved for Payment' then now() end,
    case when v_a.approval_status = 'Approved for Payment' then p_actor end
  )
  on conflict (assessment_id) do update set
    enrollment_id = excluded.enrollment_id,
    status = excluded.status,
    issued_at = coalesce(public.student_finance_invoices.issued_at, excluded.issued_at),
    issued_by = coalesce(public.student_finance_invoices.issued_by, excluded.issued_by),
    updated_at = now()
  returning * into v_i;

  if coalesce(v_existing_posted, false) and exists (
    select 1 from public.student_finance_invoice_lines where invoice_id = v_i.id
  ) then
    perform set_config('app.student_invoice_issue_rpc', 'off', true);
    return v_i;
  end if;

  delete from public.student_invoice_installments
  where payment_plan_id in (
    select id from public.student_invoice_payment_plans where invoice_id = v_i.id
  );
  delete from public.student_invoice_payment_plans where invoice_id = v_i.id;
  delete from public.student_finance_invoice_lines where invoice_id = v_i.id;

  insert into public.student_finance_invoice_lines(
    invoice_id, assessment_fee_id, line_no, description, category,
    quantity, unit_amount, amount, revenue_account_code
  )
  select v_i.id, f.id,
    row_number() over (order by f.created_at, f.id),
    f.fee_name, f.category, f.quantity, f.unit_amount, f.amount,
    f.revenue_account_code
  from public.assessment_fees f where f.assessment_id = v_a.id;

  if not exists (
    select 1 from public.student_finance_invoice_lines where invoice_id = v_i.id
  ) then raise exception 'Assessment has no invoiceable fee lines'; end if;

  insert into public.student_finance_adjustments(
    assessment_id, invoice_id, adjustment_type, amount, description, status,
    idempotency_key, posted_by
  )
  select v_a.id, v_i.id, 'Discount', v_a.discount_amount,
    coalesce(nullif(v_a.scholarship_name, ''), 'Approved assessment discount'),
    'Posted', 'legacy-assessment-discount:' || v_a.id::text, p_actor
  where coalesce(v_a.discount_amount, 0) > 0
  on conflict (idempotency_key) where idempotency_key is not null do update
    set invoice_id = excluded.invoice_id;

  select * into v_template
  from public.student_payment_term_templates
  where school_id = v_i.school_id
    and academic_year = v_i.academic_year and is_active
    and name = coalesce(v_a.payment_term, 'Cash Basis')
  order by version desc limit 1;
  if not found then
    raise exception 'No active payment-term template for %, %, %',
      v_i.school_id, v_i.academic_year, v_a.payment_term;
  end if;

  insert into public.student_invoice_payment_plans(
    invoice_id, template_id, template_version
  ) values (v_i.id, v_template.id, v_template.version)
  returning id into v_plan_id;

  select greatest(
    coalesce(sum(l.amount), 0) - coalesce((
      select sum(a.amount) filter (
        where a.status = 'Posted'
          and a.adjustment_type in ('Credit', 'Discount')
      )
      from public.student_finance_adjustments a where a.invoice_id = v_i.id
    ), 0), 0
  ) into v_net
  from public.student_finance_invoice_lines l where l.invoice_id = v_i.id;

  select max(sequence_no) into v_last
  from public.student_payment_term_template_installments
  where template_id = v_template.id;

  for r in
    select * from public.student_payment_term_template_installments
    where template_id = v_template.id order by sequence_no
  loop
    v_amount := case when r.sequence_no = v_last
      then v_net - v_running
      else round(v_net * r.percentage / 100, 2)
    end;
    insert into public.student_invoice_installments(
      payment_plan_id, sequence_no, label, due_date, amount
    ) values (
      v_plan_id, r.sequence_no, r.label, r.due_date, v_amount
    );
    v_running := v_running + v_amount;
  end loop;

  perform set_config('app.student_invoice_issue_rpc', 'off', true);
  return v_i;
end
$$;

create or replace function public.student_finance_restate_invoice_plan(
  p_invoice_id uuid,
  p_actor text
)
returns public.student_invoice_payment_plans
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old public.student_invoice_payment_plans%rowtype;
  v_new public.student_invoice_payment_plans%rowtype;
  v_net numeric(15,2);
  v_running numeric(15,2) := 0;
  v_amount numeric(15,2);
  v_last integer;
  r record;
begin
  select * into v_old from public.student_invoice_payment_plans
  where invoice_id = p_invoice_id and status = 'Active' for update;
  if not found then raise exception 'Invoice has no active payment plan'; end if;
  if not exists (
    select 1 from public.student_finance_invoices
    where id = p_invoice_id and status = 'Posted'
  ) then raise exception 'Only posted invoices may have plan amendments'; end if;

  perform set_config('app.student_invoice_issue_rpc', 'on', true);
  update public.student_invoice_payment_plans
  set status = 'Superseded' where id = v_old.id;
  insert into public.student_invoice_payment_plans(
    invoice_id, template_id, template_version, status
  ) values (
    p_invoice_id, v_old.template_id, v_old.template_version, 'Active'
  ) returning * into v_new;

  select greatest(
    gross_charges + debit_adjustments - credit_adjustments, 0
  ) into v_net
  from public.student_invoice_financials where invoice_id = p_invoice_id;
  select max(sequence_no) into v_last
  from public.student_payment_term_template_installments
  where template_id = v_old.template_id;

  for r in
    select * from public.student_payment_term_template_installments
    where template_id = v_old.template_id order by sequence_no
  loop
    v_amount := case when r.sequence_no = v_last
      then v_net - v_running
      else round(v_net * r.percentage / 100, 2)
    end;
    insert into public.student_invoice_installments(
      payment_plan_id, sequence_no, label, due_date, amount
    ) values (v_new.id, r.sequence_no, r.label, r.due_date, v_amount);
    v_running := v_running + v_amount;
  end loop;
  perform set_config('app.student_invoice_issue_rpc', 'off', true);
  return v_new;
end
$$;

alter function public.approve_student_assessment(uuid, text, text)
  rename to approve_student_assessment_legacy_posting;

create or replace function public.approve_student_assessment(
  p_assessment_id uuid,
  p_approved_by text,
  p_remarks text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
  v_invoice public.student_finance_invoices%rowtype;
  v_adjustment public.student_finance_adjustments%rowtype;
  v_journal uuid;
begin
  perform public.app_require_finance_writes_enabled();
  perform public.app_require_permission(
    'ACCOUNTING', 'billing', 'approve',
    (select school_id from public.assessments where id = p_assessment_id)
  );
  p_approved_by := coalesce(public.app_current_user_name(), p_approved_by);
  v_result := public.approve_student_assessment_legacy_posting(
    p_assessment_id, p_approved_by, p_remarks
  );
  v_invoice := public.student_finance_sync_invoice(p_assessment_id, p_approved_by);

  for v_adjustment in
    select a.* from public.student_finance_adjustments a
    where a.invoice_id = v_invoice.id and a.status = 'Posted'
      and not exists (
        select 1 from public.student_finance_journal_links l
        where l.adjustment_id = a.id and l.event_type = 'Adjustment'
      )
  loop
    v_journal := public.student_finance_post_two_line_journal(
      'Adjustment', null, null, v_adjustment.id, current_date,
      v_invoice.school_id, v_invoice.invoice_no,
      v_adjustment.description, p_approved_by,
      case when v_adjustment.adjustment_type = 'Debit' then '1130' else '5260' end,
      case when v_adjustment.adjustment_type = 'Debit' then
        coalesce((
          select revenue_account_code
          from public.student_finance_invoice_lines
          where invoice_id = v_invoice.id order by line_no limit 1
        ), '4200')
      else '1130' end,
      v_adjustment.amount
    );
  end loop;

  return v_result || jsonb_build_object(
    'invoice', to_jsonb(v_invoice),
    'invoice_financials', (
      select to_jsonb(f) from public.student_invoice_financials f
      where f.invoice_id = v_invoice.id
    ),
    'installments', coalesce((
      select jsonb_agg(to_jsonb(s) order by s.sequence_no)
      from public.student_installment_standing s
      where s.invoice_id = v_invoice.id
    ), '[]'::jsonb)
  );
end
$$;

create or replace function public.post_student_receipt(
  p_school_id uuid,
  p_student_id uuid,
  p_amount numeric,
  p_payment_method text,
  p_receipt_no text,
  p_allocations jsonb default '[]'::jsonb,
  p_direct_collections jsonb default '[]'::jsonb,
  p_allow_unapplied_credit boolean default false,
  p_remarks text default null,
  p_posted_by text default 'System',
  p_idempotency_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_receipt public.student_receipts%rowtype;
  v_method public.student_payment_methods%rowtype;
  v_alloc_total numeric(15,2);
  v_direct_total numeric(15,2);
  v_unapplied numeric(15,2);
  v_journal uuid;
  v_line integer := 1;
  r record;
begin
  perform public.app_require_finance_writes_enabled();
  if jsonb_array_length(coalesce(p_direct_collections, '[]'::jsonb)) > 0 then
    perform public.app_require_permission(
      'CASHIER', 'other-payments', 'create', p_school_id
    );
  else
    perform public.app_require_permission('CASHIER', 'queue', 'create', p_school_id);
  end if;
  p_posted_by := coalesce(public.app_current_user_name(), p_posted_by);
  if p_amount is null or p_amount <= 0 then raise exception 'Receipt amount must be positive'; end if;
  if p_school_id is null or p_student_id is null then raise exception 'Receipt school and student are required'; end if;
  if nullif(btrim(coalesce(p_receipt_no, '')), '') is null then raise exception 'Official receipt number is required'; end if;
  if jsonb_typeof(p_allocations) <> 'array'
     or jsonb_typeof(p_direct_collections) <> 'array' then
    raise exception 'Receipt allocations and direct collections must be arrays';
  end if;

  if p_idempotency_key is not null then
    select * into v_receipt from public.student_receipts
    where idempotency_key = p_idempotency_key;
    if found then
      return jsonb_build_object(
        'receipt', to_jsonb(v_receipt),
        'allocations', coalesce((
          select jsonb_agg(to_jsonb(a)) from public.student_receipt_allocations a
          where a.receipt_id = v_receipt.id
        ), '[]'::jsonb),
        'direct_collections', coalesce((
          select jsonb_agg(to_jsonb(d)) from public.student_direct_collection_lines d
          where d.receipt_id = v_receipt.id
        ), '[]'::jsonb)
      );
    end if;
  end if;

  select * into v_method from public.student_payment_methods
  where is_active
    and (lower(code) = lower(p_payment_method) or lower(name) = lower(p_payment_method));
  if not found then raise exception 'Payment method % is not configured', p_payment_method; end if;

  select coalesce(sum((x ->> 'amount')::numeric), 0)
  into v_alloc_total from jsonb_array_elements(p_allocations) x;
  select coalesce(sum((x ->> 'amount')::numeric), 0)
  into v_direct_total from jsonb_array_elements(p_direct_collections) x;
  v_unapplied := p_amount - v_alloc_total - v_direct_total;
  if v_alloc_total < 0 or v_direct_total < 0 or v_unapplied < 0 then
    raise exception 'Receipt applications exceed receipt amount';
  end if;
  if v_unapplied > 0 and not p_allow_unapplied_credit then
    raise exception 'Unapplied credit must be explicitly authorized';
  end if;

  for r in
    select f.*, (x ->> 'amount')::numeric(15,2) as requested_amount
    from jsonb_array_elements(p_allocations) x
    join public.student_invoice_financials f
      on f.invoice_id = (x ->> 'invoice_id')::uuid
  loop
    if r.student_id <> p_student_id or r.school_id <> p_school_id then
      raise exception 'Invoice % belongs to another student or school', r.invoice_id;
    end if;
    if r.status <> 'Posted' or r.requested_amount <= 0
       or r.requested_amount > r.balance then
      raise exception 'Invalid allocation for invoice %', r.invoice_id;
    end if;
  end loop;
  if (select count(*) from jsonb_array_elements(p_allocations))
     <> (select count(*) from jsonb_array_elements(p_allocations) x
         join public.student_invoice_financials f
           on f.invoice_id = (x ->> 'invoice_id')::uuid) then
    raise exception 'One or more receipt invoices were not found';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(p_allocations) x
    join public.student_invoice_financials f
      on f.invoice_id = (x ->> 'invoice_id')::uuid
    group by f.invoice_id, f.balance
    having sum((x ->> 'amount')::numeric) > f.balance
  ) then
    raise exception 'Combined allocations exceed an invoice balance';
  end if;

  insert into public.student_receipts(
    school_id, student_id, receipt_no, payment_method_id, amount,
    remarks, posted_by, idempotency_key, allow_unapplied_credit,
    unapplied_authorized_by
  ) values (
    p_school_id, p_student_id, btrim(p_receipt_no), v_method.id, p_amount,
    p_remarks, p_posted_by, p_idempotency_key, p_allow_unapplied_credit,
    case when p_allow_unapplied_credit then p_posted_by end
  ) returning * into v_receipt;

  insert into public.student_receipt_allocations(
    receipt_id, invoice_id, amount, source, idempotency_key, allocated_by
  )
  select v_receipt.id, (x ->> 'invoice_id')::uuid, (x ->> 'amount')::numeric,
    'Receipt', case when p_idempotency_key is null then null
      else p_idempotency_key || ':allocation:' || ordinality end,
    p_posted_by
  from jsonb_array_elements(p_allocations) with ordinality as a(x, ordinality);

  insert into public.student_direct_collection_lines(
    receipt_id, collection_category_id, amount, description
  )
  select v_receipt.id, c.id, (x ->> 'amount')::numeric, x ->> 'description'
  from jsonb_array_elements(p_direct_collections) x
  join public.student_collection_categories c
    on c.is_active and (
      lower(c.code) = lower(x ->> 'category')
      or lower(c.name) = lower(x ->> 'category')
    );
  if (select count(*) from jsonb_array_elements(p_direct_collections))
     <> (select count(*) from public.student_direct_collection_lines
         where receipt_id = v_receipt.id) then
    raise exception 'One or more direct collection categories were not found';
  end if;

  v_journal := public.student_finance_new_journal(
    current_date, p_school_id, v_receipt.receipt_no,
    'Student receipt ' || v_receipt.receipt_no, p_posted_by
  );
  insert into public.journal_entry_lines(
    journal_entry_id, line_no, account_code, debit_amount, credit_amount, description
  ) values (
    v_journal, v_line, v_method.cash_account_code, p_amount, 0, 'Cash received'
  );
  v_line := v_line + 1;
  if v_alloc_total > 0 then
    insert into public.journal_entry_lines(
      journal_entry_id, line_no, account_code, debit_amount, credit_amount, description
    ) values (v_journal, v_line, '1130', 0, v_alloc_total, 'Applied to student invoices');
    v_line := v_line + 1;
  end if;
  for r in
    select c.revenue_account_code, sum(d.amount)::numeric(15,2) as amount
    from public.student_direct_collection_lines d
    join public.student_collection_categories c on c.id = d.collection_category_id
    where d.receipt_id = v_receipt.id group by c.revenue_account_code
  loop
    insert into public.journal_entry_lines(
      journal_entry_id, line_no, account_code, debit_amount, credit_amount, description
    ) values (
      v_journal, v_line, r.revenue_account_code, 0, r.amount, 'Direct collection'
    );
    v_line := v_line + 1;
  end loop;
  if v_unapplied > 0 then
    insert into public.journal_entry_lines(
      journal_entry_id, line_no, account_code, debit_amount, credit_amount, description
    ) values (
      v_journal, v_line, '2150', 0, v_unapplied, 'Unapplied student credit'
    );
  end if;
  insert into public.student_receipt_journal_links(
    event_type, journal_entry_id, receipt_id
  ) values ('Receipt', v_journal, v_receipt.id);

  return jsonb_build_object(
    'receipt', to_jsonb(v_receipt),
    'allocations', coalesce((
      select jsonb_agg(to_jsonb(a)) from public.student_receipt_allocations a
      where a.receipt_id = v_receipt.id
    ), '[]'::jsonb),
    'direct_collections', coalesce((
      select jsonb_agg(to_jsonb(d)) from public.student_direct_collection_lines d
      where d.receipt_id = v_receipt.id
    ), '[]'::jsonb),
    'unapplied_amount', v_unapplied
  );
end
$$;

create or replace function public.apply_student_unapplied_credit(
  p_receipt_id uuid,
  p_allocations jsonb,
  p_actor text,
  p_idempotency_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_receipt public.student_receipts%rowtype;
  v_total numeric(15,2);
  v_available numeric(15,2);
  v_journal uuid;
  r record;
begin
  select * into v_receipt from public.student_receipts
  where id = p_receipt_id for update;
  if not found or v_receipt.status <> 'Posted' then raise exception 'Posted receipt was not found'; end if;
  perform public.app_require_finance_writes_enabled();
  perform public.app_require_permission(
    'ACCOUNTING', 'unapplied-credits', 'post', v_receipt.school_id
  );
  p_actor := coalesce(public.app_current_user_name(), p_actor);
  if jsonb_typeof(p_allocations) <> 'array' then raise exception 'Allocations must be an array'; end if;
  if p_idempotency_key is not null and exists (
    select 1 from public.student_receipt_journal_links l
    join public.journal_entries j on j.id = l.journal_entry_id
    where l.event_type = 'CreditApplication'
      and l.receipt_id = p_receipt_id
      and j.reference_no = p_idempotency_key
  ) then
    return jsonb_build_object(
      'receipt', (select to_jsonb(x) from public.student_receipt_financials x
        where x.id = p_receipt_id),
      'allocations', (select coalesce(jsonb_agg(to_jsonb(a)), '[]'::jsonb)
        from public.student_receipt_allocations a
        where a.receipt_id = p_receipt_id)
    );
  end if;
  select coalesce(sum((x ->> 'amount')::numeric), 0)
  into v_total from jsonb_array_elements(p_allocations) x;
  select unapplied_amount into v_available
  from public.student_receipt_financials where id = p_receipt_id;
  if v_total <= 0 or v_total > v_available then
    raise exception 'Credit application exceeds available unapplied amount';
  end if;

  for r in
    select f.*, (x ->> 'amount')::numeric as requested_amount
    from jsonb_array_elements(p_allocations) x
    join public.student_invoice_financials f
      on f.invoice_id = (x ->> 'invoice_id')::uuid
  loop
    if r.student_id <> v_receipt.student_id or r.school_id <> v_receipt.school_id
       or r.status <> 'Posted' or r.requested_amount <= 0
       or r.requested_amount > r.balance then
      raise exception 'Invalid credit application for invoice %', r.invoice_id;
    end if;
  end loop;
  if (select count(*) from jsonb_array_elements(p_allocations))
     <> (select count(*) from jsonb_array_elements(p_allocations) x
         join public.student_invoice_financials f
           on f.invoice_id = (x ->> 'invoice_id')::uuid) then
    raise exception 'One or more credit-application invoices were not found';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(p_allocations) x
    join public.student_invoice_financials f
      on f.invoice_id = (x ->> 'invoice_id')::uuid
    group by f.invoice_id, f.balance
    having sum((x ->> 'amount')::numeric) > f.balance
  ) then
    raise exception 'Combined credit applications exceed an invoice balance';
  end if;

  insert into public.student_receipt_allocations(
    receipt_id, invoice_id, amount, source, idempotency_key, allocated_by
  )
  select p_receipt_id, (x ->> 'invoice_id')::uuid, (x ->> 'amount')::numeric,
    'UnappliedCredit',
    case when p_idempotency_key is null then null
      else p_idempotency_key || ':' || ordinality end,
    p_actor
  from jsonb_array_elements(p_allocations) with ordinality a(x, ordinality);

  v_journal := public.student_finance_new_journal(
    current_date, v_receipt.school_id,
    coalesce(p_idempotency_key, v_receipt.receipt_no),
    'Apply unapplied student credit', p_actor
  );
  insert into public.journal_entry_lines(
    journal_entry_id, line_no, account_code, debit_amount, credit_amount, description
  ) values
    (v_journal, 1, '2150', v_total, 0, 'Release unapplied credit'),
    (v_journal, 2, '1130', 0, v_total, 'Apply credit to receivables');
  insert into public.student_receipt_journal_links(
    event_type, journal_entry_id, receipt_id
  ) values ('CreditApplication', v_journal, p_receipt_id);

  return jsonb_build_object(
    'receipt', (select to_jsonb(x) from public.student_receipt_financials x
      where x.id = p_receipt_id),
    'allocations', (select jsonb_agg(to_jsonb(a))
      from public.student_receipt_allocations a where a.receipt_id = p_receipt_id)
  );
end
$$;

create or replace function public.submit_student_allocation_reallocation(
  p_allocation_id uuid,
  p_destination_invoice_id uuid,
  p_amount numeric,
  p_reason text,
  p_requested_by text
)
returns public.student_allocation_reallocation_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_source public.student_receipt_allocations%rowtype;
  v_receipt public.student_receipts%rowtype;
  v_available numeric(15,2);
  v_request public.student_allocation_reallocation_requests%rowtype;
begin
  perform public.app_require_finance_writes_enabled();
  select * into v_source from public.student_receipt_allocations
  where id = p_allocation_id for update;
  if not found then raise exception 'Allocation was not found'; end if;
  select * into v_receipt from public.student_receipts
  where id = v_source.receipt_id and status = 'Posted' for update;
  if not found then raise exception 'Source receipt is not posted'; end if;
  perform public.app_require_permission(
    'CASHIER', 'reallocations', 'create', v_receipt.school_id
  );
  p_requested_by := coalesce(public.app_current_user_name(), p_requested_by);
  select v_source.amount - coalesce(sum(r.amount), 0) into v_available
  from public.student_allocation_reversals r where r.allocation_id = v_source.id;
  if p_amount <= 0 or p_amount > v_available then raise exception 'Invalid reallocation amount'; end if;
  if p_destination_invoice_id = v_source.invoice_id then
    raise exception 'Destination invoice must differ from source invoice';
  end if;
  if not exists (
    select 1
    from public.student_receipts r
    join public.student_finance_invoices i
      on i.id = p_destination_invoice_id
     and i.student_id = r.student_id and i.school_id = r.school_id
     and i.status = 'Posted'
    where r.id = v_source.receipt_id
  ) then raise exception 'Destination invoice belongs to another student or school'; end if;

  insert into public.student_allocation_reallocation_requests(
    allocation_id, destination_invoice_id, amount, reason, requested_by
  ) values (
    p_allocation_id, p_destination_invoice_id, p_amount, p_reason, p_requested_by
  ) returning * into v_request;
  return v_request;
end
$$;

create or replace function public.review_student_allocation_reallocation(
  p_request_id uuid,
  p_approved boolean,
  p_reviewed_by text,
  p_remarks text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.student_allocation_reallocation_requests%rowtype;
  v_source public.student_receipt_allocations%rowtype;
  v_receipt public.student_receipts%rowtype;
  v_replacement public.student_receipt_allocations%rowtype;
  v_reversal public.student_allocation_reversals%rowtype;
  v_journal uuid;
begin
  perform public.app_require_finance_writes_enabled();
  select * into v_request from public.student_allocation_reallocation_requests
  where id = p_request_id for update;
  if not found or v_request.status <> 'Pending' then
    raise exception 'Pending reallocation request was not found';
  end if;
  select * into v_source from public.student_receipt_allocations
  where id = v_request.allocation_id for update;
  select * into v_receipt from public.student_receipts
  where id = v_source.receipt_id for update;
  if not found then raise exception 'Source receipt was not found'; end if;
  perform public.app_require_permission(
    'ACCOUNTING', 'reallocations', 'approve', v_receipt.school_id
  );
  p_reviewed_by := coalesce(public.app_current_user_name(), p_reviewed_by);
  if p_approved and v_receipt.status <> 'Posted' then
    raise exception 'Source receipt is not posted';
  end if;
  update public.student_allocation_reallocation_requests set
    status = case when p_approved then 'Approved' else 'Rejected' end,
    reviewed_by = p_reviewed_by, reviewed_at = now(), review_remarks = p_remarks
  where id = p_request_id returning * into v_request;
  if not p_approved then return jsonb_build_object('request', to_jsonb(v_request)); end if;

  if v_request.amount > v_source.amount - coalesce((
    select sum(x.amount) from public.student_allocation_reversals x
    where x.allocation_id = v_source.id
  ), 0) then
    raise exception 'Source allocation no longer has enough reversible amount';
  end if;
  if v_request.amount > coalesce((
    select balance from public.student_invoice_financials
    where invoice_id = v_request.destination_invoice_id
      and student_id = v_receipt.student_id
      and school_id = v_receipt.school_id
      and status = 'Posted'
  ), 0) then
    raise exception 'Destination invoice no longer has enough balance';
  end if;

  insert into public.student_receipt_allocations(
    receipt_id, invoice_id, amount, source, idempotency_key, allocated_by
  ) values (
    v_source.receipt_id, v_request.destination_invoice_id, v_request.amount,
    'Reallocation', 'reallocation:' || v_request.id::text, p_reviewed_by
  ) returning * into v_replacement;
  insert into public.student_allocation_reversals(
    allocation_id, amount, reason, reversed_by, replacement_allocation_id,
    idempotency_key
  ) values (
    v_source.id, v_request.amount, v_request.reason, p_reviewed_by,
    v_replacement.id, 'reallocation-reversal:' || v_request.id::text
  ) returning * into v_reversal;

  v_journal := public.student_finance_new_journal(
    current_date, v_receipt.school_id, v_receipt.receipt_no,
    'Reallocate student receipt', p_reviewed_by
  );
  insert into public.journal_entry_lines(
    journal_entry_id, line_no, account_code, debit_amount, credit_amount, description
  ) values
    (v_journal, 1, '1130', v_request.amount, 0, 'Reverse source invoice allocation'),
    (v_journal, 2, '1130', 0, v_request.amount, 'Apply destination invoice allocation');
  insert into public.student_receipt_journal_links(
    event_type, journal_entry_id, reversal_id
  ) values ('Reallocation', v_journal, v_reversal.id);

  return jsonb_build_object(
    'request', to_jsonb(v_request), 'reversal', to_jsonb(v_reversal),
    'replacement_allocation', to_jsonb(v_replacement)
  );
end
$$;

create or replace function public.submit_student_receipt_void_request(
  p_receipt_id uuid,
  p_requested_by text,
  p_reason text
)
returns public.student_receipt_void_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.student_receipt_void_requests%rowtype;
  v_receipt public.student_receipts%rowtype;
begin
  perform public.app_require_finance_writes_enabled();
  select * into v_receipt from public.student_receipts
  where id = p_receipt_id and status = 'Posted' for update;
  if not found then raise exception 'Posted receipt was not found'; end if;
  perform public.app_require_permission(
    'CASHIER', 'queue', 'void', v_receipt.school_id
  );
  p_requested_by := coalesce(public.app_current_user_name(), p_requested_by);
  insert into public.student_receipt_void_requests(
    receipt_id, reason, requested_by
  ) values (p_receipt_id, p_reason, p_requested_by)
  returning * into v_request;
  return v_request;
end
$$;

create or replace function public.review_student_receipt_void_request(
  p_request_id uuid,
  p_approved boolean,
  p_reviewed_by text,
  p_remarks text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.student_receipt_void_requests%rowtype;
  v_receipt public.student_receipts%rowtype;
  v_method public.student_payment_methods%rowtype;
  v_fin public.student_receipt_financials%rowtype;
  v_journal uuid;
  v_line integer := 1;
  r record;
begin
  perform public.app_require_finance_writes_enabled();
  select * into v_request from public.student_receipt_void_requests
  where id = p_request_id for update;
  if not found or v_request.status <> 'Pending' then raise exception 'Pending void request was not found'; end if;
  select * into v_receipt from public.student_receipts
  where id = v_request.receipt_id for update;
  if not found then raise exception 'Receipt was not found'; end if;
  perform public.app_require_permission(
    'ACCOUNTING', 'receipt-voids', 'approve', v_receipt.school_id
  );
  p_reviewed_by := coalesce(public.app_current_user_name(), p_reviewed_by);
  if p_approved and v_receipt.status <> 'Posted' then
    raise exception 'Receipt is already voided';
  end if;
  update public.student_receipt_void_requests set
    status = case when p_approved then 'Approved' else 'Rejected' end,
    reviewed_by = p_reviewed_by, reviewed_at = now(), review_remarks = p_remarks
  where id = p_request_id returning * into v_request;
  if not p_approved then return jsonb_build_object('void_request', to_jsonb(v_request)); end if;

  select * into v_fin from public.student_receipt_financials where id = v_receipt.id;
  select * into v_method from public.student_payment_methods where id = v_receipt.payment_method_id;

  perform set_config('app.student_receipt_void_rpc', 'on', true);
  update public.student_receipts set status = 'Voided',
    voided_by = p_reviewed_by, voided_at = now(),
    void_reason = v_request.reason, updated_at = now()
  where id = v_receipt.id returning * into v_receipt;

  insert into public.student_allocation_reversals(
    allocation_id, amount, reason, reversed_by, idempotency_key
  )
  select a.id, a.amount - coalesce((
      select sum(x.amount) from public.student_allocation_reversals x
      where x.allocation_id = a.id
    ), 0),
    'Receipt void: ' || v_request.reason, p_reviewed_by,
    'receipt-void:' || v_request.id::text || ':' || a.id::text
  from public.student_receipt_allocations a
  where a.receipt_id = v_receipt.id
    and a.amount > coalesce((
      select sum(x.amount) from public.student_allocation_reversals x
      where x.allocation_id = a.id
    ), 0)
  on conflict (idempotency_key) where idempotency_key is not null do nothing;

  v_journal := public.student_finance_new_journal(
    current_date, v_receipt.school_id, v_receipt.receipt_no,
    'Void student receipt ' || v_receipt.receipt_no, p_reviewed_by
  );
  if v_fin.allocated_amount > 0 then
    insert into public.journal_entry_lines(
      journal_entry_id, line_no, account_code, debit_amount, credit_amount, description
    ) values (v_journal, v_line, '1130', v_fin.allocated_amount, 0, 'Reverse invoice allocations');
    v_line := v_line + 1;
  end if;
  for r in
    select c.revenue_account_code, sum(d.amount)::numeric(15,2) as amount
    from public.student_direct_collection_lines d
    join public.student_collection_categories c on c.id = d.collection_category_id
    where d.receipt_id = v_receipt.id group by c.revenue_account_code
  loop
    insert into public.journal_entry_lines(
      journal_entry_id, line_no, account_code, debit_amount, credit_amount, description
    ) values (v_journal, v_line, r.revenue_account_code, r.amount, 0, 'Reverse direct collection');
    v_line := v_line + 1;
  end loop;
  if v_fin.unapplied_amount > 0 then
    insert into public.journal_entry_lines(
      journal_entry_id, line_no, account_code, debit_amount, credit_amount, description
    ) values (v_journal, v_line, '2150', v_fin.unapplied_amount, 0, 'Reverse unapplied credit');
    v_line := v_line + 1;
  end if;
  insert into public.journal_entry_lines(
    journal_entry_id, line_no, account_code, debit_amount, credit_amount, description
  ) values (v_journal, v_line, v_method.cash_account_code, 0, v_receipt.amount, 'Reverse cash receipt');
  insert into public.student_receipt_journal_links(
    event_type, journal_entry_id, receipt_id
  ) values ('ReceiptVoid', v_journal, v_receipt.id);

  return jsonb_build_object(
    'void_request', to_jsonb(v_request), 'receipt', to_jsonb(v_receipt)
  );
end
$$;

alter function public.post_student_payment(
  uuid, uuid, uuid, numeric, text, text, text, text, text, text, text, text
) rename to post_student_payment_legacy_posting;

create or replace function public.post_student_payment(
  p_student_id uuid,
  p_assessment_id uuid,
  p_school_id uuid,
  p_amount numeric,
  p_payment_method text,
  p_or_number text,
  p_term text,
  p_remarks text,
  p_transaction_type text default 'AR',
  p_payment_category text default null,
  p_posted_by text default 'System',
  p_idempotency_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invoice public.student_finance_invoices%rowtype;
  v_result jsonb;
  v_receipt jsonb;
  v_payment jsonb;
  v_fin public.student_invoice_financials%rowtype;
begin
  if p_transaction_type = 'AR' then
    select * into v_invoice from public.student_finance_invoices
    where assessment_id = p_assessment_id;
    if not found then raise exception 'Assessment has no finance invoice'; end if;
    v_result := public.post_student_receipt(
      p_school_id, p_student_id, p_amount, p_payment_method, p_or_number,
      jsonb_build_array(jsonb_build_object(
        'invoice_id', v_invoice.id, 'amount', p_amount
      )),
      '[]'::jsonb, false, p_remarks, p_posted_by, p_idempotency_key
    );
    select * into v_fin from public.student_invoice_financials
    where invoice_id = v_invoice.id;
  elsif p_transaction_type = 'OR' then
    v_result := public.post_student_receipt(
      p_school_id, p_student_id, p_amount, p_payment_method, p_or_number,
      '[]'::jsonb,
      jsonb_build_array(jsonb_build_object(
        'category', p_payment_category, 'amount', p_amount,
        'description', p_remarks
      )),
      false, p_remarks, p_posted_by, p_idempotency_key
    );
  else
    raise exception 'Unsupported transaction type %', p_transaction_type;
  end if;

  v_receipt := v_result -> 'receipt';
  v_payment := jsonb_build_object(
    'id', v_receipt ->> 'id',
    'school_id', v_receipt ->> 'school_id',
    'student_id', v_receipt ->> 'student_id',
    'assessment_id', case when p_transaction_type = 'AR' then p_assessment_id end,
    'amount', (v_receipt ->> 'amount')::numeric,
    'payment_date', v_receipt ->> 'receipt_date',
    'payment_method', p_payment_method,
    'payment_method_id', v_receipt ->> 'payment_method_id',
    'or_number', v_receipt ->> 'receipt_no',
    'term', p_term,
    'remarks', p_remarks,
    'transaction_type', p_transaction_type,
    'payment_category', p_payment_category,
    'currency_code', v_receipt ->> 'currency_code',
    'status', v_receipt ->> 'status',
    'posted_by', v_receipt ->> 'posted_by',
    'posted_at', v_receipt ->> 'posted_at'
  );

  return v_result || jsonb_build_object(
    'payment', v_payment,
    'assessment', case when v_invoice.id is null then null else
      (select to_jsonb(a) || jsonb_build_object(
        'total_amount', v_fin.gross_charges + v_fin.debit_adjustments,
        'discount_amount', v_fin.discount_amount,
        'balance', v_fin.balance,
        'is_paid', v_fin.is_paid
      ) from public.assessments a where a.id = v_invoice.assessment_id)
    end,
    'invoice_financials', case when v_invoice.id is null then null else to_jsonb(v_fin) end
  );
end
$$;

alter function public.submit_payment_void_request(uuid, text, text)
  rename to submit_payment_void_request_legacy;
alter function public.review_payment_void_request(uuid, boolean, text, text)
  rename to review_payment_void_request_legacy;

create or replace function public.submit_payment_void_request(
  p_payment_id uuid,
  p_requested_by text,
  p_reason text
)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select to_jsonb(x) || jsonb_build_object(
    'status', 'Pending Void Approval',
    'payment_id', x.receipt_id
  )
  from public.submit_student_receipt_void_request(
    p_payment_id, p_requested_by, p_reason
  ) x
$$;

create or replace function public.review_payment_void_request(
  p_request_id uuid,
  p_approved boolean,
  p_reviewed_by text,
  p_remarks text default null
)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select public.review_student_receipt_void_request(
    p_request_id, p_approved, p_reviewed_by, p_remarks
  )
$$;

create or replace function public.review_student_assessment(
  p_assessment_id uuid,
  p_decision text,
  p_remarks text default null
)
returns public.assessments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_assessment public.assessments%rowtype;
  v_actor text;
begin
  select * into v_assessment
  from public.assessments
  where id = p_assessment_id
  for update;
  if not found then raise exception 'Assessment % was not found', p_assessment_id; end if;

  perform public.app_require_finance_writes_enabled();
  perform public.app_require_permission(
    'ACCOUNTING', 'billing', 'approve', v_assessment.school_id
  );
  if p_decision not in ('Returned to Registrar', 'Rejected') then
    raise exception 'Unsupported assessment review decision %', p_decision;
  end if;
  if v_assessment.approval_status = 'Approved for Payment' then
    raise exception 'A posted assessment cannot be returned or rejected';
  end if;

  v_actor := public.app_current_user_name();
  update public.assessments
  set approval_status = p_decision,
      accounting_remarks = p_remarks,
      updated_at = now()
  where id = p_assessment_id
  returning * into v_assessment;

  insert into public.assessment_audit_trail(
    assessment_id, action, performed_by, performed_at, details
  ) values (
    p_assessment_id,
    case when p_decision = 'Rejected' then 'REJECTED'
      else 'RETURNED_TO_REGISTRAR' end,
    v_actor, now(), p_remarks
  );
  return v_assessment;
end
$$;

create or replace function public.append_student_assessment_audit(
  p_assessment_id uuid,
  p_action text,
  p_details text default null
)
returns public.assessment_audit_trail
language plpgsql
security definer
set search_path = public
as $$
declare
  v_assessment public.assessments%rowtype;
  v_audit public.assessment_audit_trail%rowtype;
begin
  select * into v_assessment
  from public.assessments
  where id = p_assessment_id;
  if not found then raise exception 'Assessment % was not found', p_assessment_id; end if;

  perform public.app_require_finance_writes_enabled();
  perform public.app_require_permission(
    'REGISTRAR', 'enrollment', 'edit', v_assessment.school_id
  );
  if v_assessment.approval_status = 'Approved for Payment' then
    raise exception 'Posted assessment audit history is immutable';
  end if;
  if p_action !~ '^[A-Z][A-Z0-9_]{2,63}$' then
    raise exception 'Invalid assessment audit action';
  end if;

  insert into public.assessment_audit_trail(
    assessment_id, action, performed_by, performed_at, details
  ) values (
    p_assessment_id, p_action, public.app_current_user_name(), now(), p_details
  ) returning * into v_audit;
  return v_audit;
end
$$;

-- Compatibility read models now derive from invoices and receipt allocations.
create or replace view public.assessment_financials
with (security_invoker = true)
as
select
  f.assessment_id, f.student_id, f.school_id,
  f.academic_year as school_year, f.semester,
  f.gross_charges, f.debit_adjustments, f.credit_adjustments,
  f.discount_amount, f.allocated_amount as posted_payments, f.balance,
  f.is_paid,
  (
    select max(r.receipt_date::date)
    from public.student_receipt_allocations a
    join public.student_receipts r on r.id = a.receipt_id
    where a.invoice_id = f.invoice_id and r.status = 'Posted'
  ) as last_payment_date
from public.student_invoice_financials f;

create or replace view public.ledger_transactions
with (security_invoker = true)
as
with events as (
  select
    i.id, i.student_id, coalesce(i.issued_at, i.created_at) as occurred_at,
    'Posted student invoice ' || i.invoice_no as description,
    'Assessment'::text as type,
    f.gross_charges::numeric(15,2) as debit, 0::numeric(15,2) as credit,
    i.invoice_no as reference, i.academic_year as school_year,
    'Invoice'::text as source_type, i.id as source_id,
    null::uuid as reversed_transaction_id
  from public.student_finance_invoices i
  join public.student_invoice_financials f on f.invoice_id = i.id
  where i.status = 'Posted'

  union all

  select
    a.id, i.student_id, a.posted_at, a.description,
    case when a.adjustment_type = 'Discount' then 'Discount' else 'Adjustment' end,
    case when a.adjustment_type = 'Debit' then a.amount else 0 end,
    case when a.adjustment_type in ('Credit', 'Discount') then a.amount else 0 end,
    a.id::text, i.academic_year, 'InvoiceAdjustment', a.id, a.reversal_of_id
  from public.student_finance_adjustments a
  join public.student_finance_invoices i on i.id = a.invoice_id
  where a.status = 'Posted'

  union all

  select
    a.id, i.student_id, a.allocated_at,
    'Receipt ' || r.receipt_no || ' allocation',
    'Payment', 0::numeric(15,2), a.amount,
    r.receipt_no, i.academic_year, 'ReceiptAllocation', a.id, null::uuid
  from public.student_receipt_allocations a
  join public.student_receipts r on r.id = a.receipt_id
  join public.student_finance_invoices i on i.id = a.invoice_id

  union all

  select
    v.id, i.student_id, v.reversed_at,
    'Allocation reversal for receipt ' || r.receipt_no,
    'Adjustment', v.amount, 0::numeric(15,2),
    r.receipt_no, i.academic_year, 'AllocationReversal', v.id, a.id
  from public.student_allocation_reversals v
  join public.student_receipt_allocations a on a.id = v.allocation_id
  join public.student_receipts r on r.id = a.receipt_id
  join public.student_finance_invoices i on i.id = a.invoice_id
),
running as (
  select e.*,
    sum(e.debit - e.credit) over (
      partition by e.student_id, e.school_year
      order by e.occurred_at, e.id
      rows between unbounded preceding and current row
    )::numeric(15,2) as running_balance
  from events e
)
select
  id, null::text as legacy_id, student_id, occurred_at::date as date,
  description, type, debit, credit, running_balance as balance, reference,
  school_year, source_type, source_id, reversed_transaction_id,
  occurred_at as created_at
from running;

create or replace view public.payment_collection_summaries
with (security_invoker = true)
as
select
  r.id, null::text as legacy_id, r.id as payment_id, r.student_id, r.amount::numeric as amount,
  m.name::text as payment_method, r.receipt_no as reference_no,
  r.receipt_date as payment_date, r.posted_by as cashier,
  case
    when f.direct_collection_amount > 0 then 'Direct Collection'
    when f.unapplied_amount > 0 then 'Unapplied Credit'
    else 'Invoice Allocation'
  end::text as term,
  case when r.status = 'Voided' then 'Voided' else 'Verified' end::text
    as verification_status,
  r.created_at, r.updated_at
from public.student_receipts r
join public.student_payment_methods m on m.id = r.payment_method_id
join public.student_receipt_financials f on f.id = r.id;

create or replace function public.student_finance_protect_posted_invoice()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.status = 'Posted' then
    raise exception 'Posted finance invoices are immutable; use adjustments or reversals';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end
$$;

drop trigger if exists trg_protect_posted_finance_invoice
  on public.student_finance_invoices;
create trigger trg_protect_posted_finance_invoice
before update or delete on public.student_finance_invoices
for each row execute function public.student_finance_protect_posted_invoice();

create or replace function public.student_finance_protect_invoice_child()
returns trigger
language plpgsql
set search_path = public
as $$
declare v_invoice_id uuid;
begin
  if tg_table_name = 'student_finance_invoice_lines' then
    v_invoice_id := case when tg_op = 'DELETE' then old.invoice_id else new.invoice_id end;
  else
    select invoice_id into v_invoice_id
    from public.student_invoice_payment_plans
    where id = case when tg_op = 'DELETE' then old.payment_plan_id else new.payment_plan_id end;
  end if;
  if exists (
    select 1 from public.student_finance_invoices
    where id = v_invoice_id and status = 'Posted'
  ) and current_setting('app.student_invoice_issue_rpc', true) <> 'on'
  then raise exception 'Posted invoice lines and schedules are immutable'; end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end
$$;

drop trigger if exists trg_protect_posted_invoice_lines
  on public.student_finance_invoice_lines;
create trigger trg_protect_posted_invoice_lines
before insert or update or delete on public.student_finance_invoice_lines
for each row execute function public.student_finance_protect_invoice_child();

drop trigger if exists trg_protect_posted_invoice_installments
  on public.student_invoice_installments;
create trigger trg_protect_posted_invoice_installments
before insert or update or delete on public.student_invoice_installments
for each row execute function public.student_finance_protect_invoice_child();

create or replace function public.student_finance_protect_payment_plan()
returns trigger
language plpgsql
set search_path = public
as $$
declare v_invoice_id uuid;
begin
  v_invoice_id := case when tg_op = 'DELETE' then old.invoice_id else new.invoice_id end;
  if exists (
    select 1 from public.student_finance_invoices
    where id = v_invoice_id and status = 'Posted'
  ) and current_setting('app.student_invoice_issue_rpc', true) <> 'on'
  then raise exception 'Posted invoice payment plans are immutable; create a versioned restatement'; end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end
$$;

drop trigger if exists trg_protect_posted_invoice_payment_plan
  on public.student_invoice_payment_plans;
create trigger trg_protect_posted_invoice_payment_plan
before update or delete on public.student_invoice_payment_plans
for each row execute function public.student_finance_protect_payment_plan();

create or replace function public.student_finance_protect_posted_adjustment()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.status = 'Posted' then
    raise exception 'Posted finance adjustments are immutable; post a reversing adjustment';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end
$$;

drop trigger if exists trg_protect_posted_finance_adjustment
  on public.student_finance_adjustments;
create trigger trg_protect_posted_finance_adjustment
before update or delete on public.student_finance_adjustments
for each row execute function public.student_finance_protect_posted_adjustment();

create or replace function public.student_finance_protect_receipt()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then raise exception 'Student receipts cannot be deleted'; end if;
  if old.status = 'Voided' then raise exception 'Voided student receipts are immutable'; end if;
  if current_setting('app.student_receipt_void_rpc', true) <> 'on' then
    raise exception 'Posted student receipts are immutable; use the void workflow';
  end if;
  return new;
end
$$;

drop trigger if exists trg_protect_student_receipt on public.student_receipts;
create trigger trg_protect_student_receipt
before update or delete on public.student_receipts
for each row execute function public.student_finance_protect_receipt();

create or replace function public.student_finance_append_only()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception '% is append-only; post a reversal instead', tg_table_name;
end
$$;

drop trigger if exists trg_receipt_allocations_append_only
  on public.student_receipt_allocations;
create trigger trg_receipt_allocations_append_only
before update or delete on public.student_receipt_allocations
for each row execute function public.student_finance_append_only();

drop trigger if exists trg_direct_collections_append_only
  on public.student_direct_collection_lines;
create trigger trg_direct_collections_append_only
before update or delete on public.student_direct_collection_lines
for each row execute function public.student_finance_append_only();

drop trigger if exists trg_allocation_reversals_append_only
  on public.student_allocation_reversals;
create trigger trg_allocation_reversals_append_only
before update or delete on public.student_allocation_reversals
for each row execute function public.student_finance_append_only();

drop trigger if exists trg_student_finance_journal_links_append_only
  on public.student_finance_journal_links;
create trigger trg_student_finance_journal_links_append_only
before update or delete on public.student_finance_journal_links
for each row execute function public.student_finance_append_only();

drop trigger if exists trg_student_receipt_journal_links_append_only
  on public.student_receipt_journal_links;
create trigger trg_student_receipt_journal_links_append_only
before update or delete on public.student_receipt_journal_links
for each row execute function public.student_finance_append_only();

-- Extend the pre-existing GL immutability boundary to every normalized
-- receipt event.  Journal lines are inserted before their link in each RPC,
-- then become immutable as soon as the posting is complete.
create or replace function public.student_finance_protect_linked_journal()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if exists (
    select 1 from public.student_finance_journal_links
    where journal_entry_id = old.id
  ) or exists (
    select 1 from public.student_receipt_journal_links
    where journal_entry_id = old.id
  ) then
    raise exception 'Student-finance journals are immutable; post a reversal instead';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end
$$;

create or replace function public.student_finance_protect_linked_journal_line()
returns trigger
language plpgsql
set search_path = public
as $$
declare v_journal_id uuid;
begin
  v_journal_id := case
    when tg_op = 'INSERT' then new.journal_entry_id
    else old.journal_entry_id
  end;
  if exists (
    select 1 from public.student_finance_journal_links
    where journal_entry_id = v_journal_id
  ) or exists (
    select 1 from public.student_receipt_journal_links
    where journal_entry_id = v_journal_id
  ) then
    raise exception 'Student-finance journal lines are immutable; post a reversal instead';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end
$$;

-- Final conversion assertions.  A mismatch aborts and rolls back the complete
-- file, including all DDL and backfill journals.
do $$
declare v_issues jsonb;
begin
  select jsonb_agg(to_jsonb(q)) into v_issues
  from (
    select 'INVOICE_BALANCE_MISMATCH'::text as issue,
      assessment_id as record_id, invoice_no as reference
    from public.student_finance_reconciliation_v2
    where not balance_matches
    union all
    select 'INSTALLMENT_TOTAL_MISMATCH', assessment_id, invoice_no
    from public.student_finance_reconciliation_v2
    where not installment_total_matches
    union all
    select 'NEGATIVE_INVOICE_BALANCE', assessment_id, invoice_no
    from public.student_finance_reconciliation_v2
    where not nonnegative_balance
    union all
    select 'RECEIPT_COMPONENT_MISMATCH', id, receipt_no
    from public.student_receipt_financials
    where status = 'Posted'
      and (
        allocated_amount + direct_collection_amount + unapplied_amount <> amount
        or (unapplied_amount > 0 and not allow_unapplied_credit)
      )
    union all
    select 'ASSESSMENT_INVOICE_COUNT_MISMATCH', null::uuid,
      (select count(*)::text from public.assessments)
        || ' assessments / '
        || (select count(*)::text from public.student_finance_invoices)
        || ' invoices'
    where (select count(*) from public.assessments)
       <> (select count(*) from public.student_finance_invoices)
    union all
    select 'PAYMENT_RECEIPT_COUNT_MISMATCH', null::uuid,
      (select count(*)::text from public.payments)
        || ' payments / '
        || (select count(*)::text from public.student_receipts)
        || ' receipts'
    where (select count(*) from public.payments)
       <> (select count(*) from public.student_receipts)
    union all
    select 'APPROVED_INVOICE_WITHOUT_ASSESSMENT_JOURNAL', i.id, i.invoice_no
    from public.student_finance_invoices i
    join public.assessments a on a.id = i.assessment_id
    where a.approval_status = 'Approved for Payment'
      and not exists (
        select 1 from public.student_finance_journal_links l
        where l.assessment_id = a.id and l.event_type = 'Assessment'
      )
    union all
    select 'RECEIPT_WITHOUT_POSTING_JOURNAL', r.id, r.receipt_no
    from public.student_receipts r
    where not exists (
      select 1 from public.student_receipt_journal_links l
      where l.receipt_id = r.id and l.event_type = 'Receipt'
    )
    union all
    select 'VOIDED_RECEIPT_WITHOUT_VOID_JOURNAL', r.id, r.receipt_no
    from public.student_receipts r
    where r.status = 'Voided'
      and not exists (
        select 1 from public.student_receipt_journal_links l
        where l.receipt_id = r.id and l.event_type = 'ReceiptVoid'
      )
    union all
    select 'UNBALANCED_LINKED_FINANCE_JOURNAL', j.id, j.entry_no
    from public.journal_entries j
    where (
      exists (select 1 from public.student_finance_journal_links l
        where l.journal_entry_id = j.id)
      or exists (select 1 from public.student_receipt_journal_links l
        where l.journal_entry_id = j.id)
    )
    and (
      j.status <> 'Posted'
      or coalesce((select sum(l.debit_amount) from public.journal_entry_lines l
        where l.journal_entry_id = j.id), 0)
        <> coalesce((select sum(l.credit_amount) from public.journal_entry_lines l
        where l.journal_entry_id = j.id), 0)
    )
  ) q;
  if v_issues is not null then
    raise exception using
      message = 'Normalized invoice/receipt reconciliation failed',
      detail = v_issues::text,
      hint = 'No migration changes were committed. Correct the source data and rerun.';
  end if;
end
$$;

alter table public.student_payment_term_templates enable row level security;
alter table public.student_payment_term_template_installments enable row level security;
alter table public.student_finance_invoices enable row level security;
alter table public.student_finance_invoice_lines enable row level security;
alter table public.student_invoice_payment_plans enable row level security;
alter table public.student_invoice_installments enable row level security;
alter table public.student_receipts enable row level security;
alter table public.student_receipt_allocations enable row level security;
alter table public.student_direct_collection_lines enable row level security;
alter table public.student_allocation_reversals enable row level security;
alter table public.student_allocation_reallocation_requests enable row level security;
alter table public.student_receipt_void_requests enable row level security;
alter table public.student_receipt_journal_links enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'student_payment_term_templates',
    'student_payment_term_template_installments',
    'student_finance_invoices',
    'student_finance_invoice_lines',
    'student_invoice_payment_plans',
    'student_invoice_installments',
    'student_receipts',
    'student_receipt_allocations',
    'student_direct_collection_lines',
    'student_allocation_reversals',
    'student_allocation_reallocation_requests',
    'student_receipt_void_requests',
    'student_receipt_journal_links'
  ] loop
    execute format('drop policy if exists %I on public.%I', t || '_read', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (true)',
      t || '_read', t
    );
    execute format(
      'revoke insert, update, delete on public.%I from anon, authenticated', t
    );
  end loop;
end
$$;

drop policy if exists student_finance_invoices_read
  on public.student_finance_invoices;
create policy student_finance_invoices_read
  on public.student_finance_invoices for select to authenticated
  using (public.app_can_read_student_finance(student_id, school_id));

drop policy if exists student_finance_invoice_lines_read
  on public.student_finance_invoice_lines;
create policy student_finance_invoice_lines_read
  on public.student_finance_invoice_lines for select to authenticated
  using (exists (
    select 1 from public.student_finance_invoices i
    where i.id = invoice_id
      and public.app_can_read_student_finance(i.student_id, i.school_id)
  ));

drop policy if exists student_invoice_payment_plans_read
  on public.student_invoice_payment_plans;
create policy student_invoice_payment_plans_read
  on public.student_invoice_payment_plans for select to authenticated
  using (exists (
    select 1 from public.student_finance_invoices i
    where i.id = invoice_id
      and public.app_can_read_student_finance(i.student_id, i.school_id)
  ));

drop policy if exists student_invoice_installments_read
  on public.student_invoice_installments;
create policy student_invoice_installments_read
  on public.student_invoice_installments for select to authenticated
  using (exists (
    select 1
    from public.student_invoice_payment_plans p
    join public.student_finance_invoices i on i.id = p.invoice_id
    where p.id = payment_plan_id
      and public.app_can_read_student_finance(i.student_id, i.school_id)
  ));

drop policy if exists student_receipts_read on public.student_receipts;
create policy student_receipts_read
  on public.student_receipts for select to authenticated
  using (public.app_can_read_student_finance(student_id, school_id));

drop policy if exists student_receipt_allocations_read
  on public.student_receipt_allocations;
create policy student_receipt_allocations_read
  on public.student_receipt_allocations for select to authenticated
  using (exists (
    select 1 from public.student_receipts r
    where r.id = receipt_id
      and public.app_can_read_student_finance(r.student_id, r.school_id)
  ));

drop policy if exists student_direct_collection_lines_read
  on public.student_direct_collection_lines;
create policy student_direct_collection_lines_read
  on public.student_direct_collection_lines for select to authenticated
  using (exists (
    select 1 from public.student_receipts r
    where r.id = receipt_id
      and public.app_can_read_student_finance(r.student_id, r.school_id)
  ));

drop policy if exists student_allocation_reversals_read
  on public.student_allocation_reversals;
create policy student_allocation_reversals_read
  on public.student_allocation_reversals for select to authenticated
  using (exists (
    select 1
    from public.student_receipt_allocations a
    join public.student_receipts r on r.id = a.receipt_id
    where a.id = allocation_id
      and public.app_can_read_student_finance(r.student_id, r.school_id)
  ));

drop policy if exists student_allocation_reallocation_requests_read
  on public.student_allocation_reallocation_requests;
create policy student_allocation_reallocation_requests_read
  on public.student_allocation_reallocation_requests for select to authenticated
  using (exists (
    select 1
    from public.student_receipt_allocations a
    join public.student_receipts r on r.id = a.receipt_id
    where a.id = allocation_id
      and public.app_can_read_student_finance(r.student_id, r.school_id)
  ));

drop policy if exists student_receipt_void_requests_read
  on public.student_receipt_void_requests;
create policy student_receipt_void_requests_read
  on public.student_receipt_void_requests for select to authenticated
  using (exists (
    select 1 from public.student_receipts r
    where r.id = receipt_id
      and public.app_can_read_student_finance(r.student_id, r.school_id)
  ));

drop policy if exists student_receipt_journal_links_read
  on public.student_receipt_journal_links;
create policy student_receipt_journal_links_read
  on public.student_receipt_journal_links for select to authenticated
  using (
    exists (
      select 1 from public.student_receipts r
      where r.id = receipt_id
        and public.app_has_permission('ACCOUNTING', null, 'view', r.school_id)
    )
    or exists (
      select 1
      from public.student_receipt_allocations a
      join public.student_receipts r on r.id = a.receipt_id
      where a.id = allocation_id
        and public.app_has_permission('ACCOUNTING', null, 'view', r.school_id)
    )
    or exists (
      select 1
      from public.student_allocation_reversals x
      join public.student_receipt_allocations a on a.id = x.allocation_id
      join public.student_receipts r on r.id = a.receipt_id
      where x.id = reversal_id
        and public.app_has_permission('ACCOUNTING', null, 'view', r.school_id)
    )
  );

-- Replace the original demo-wide assessment policies. Registrar may maintain
-- only draft/returned assessments; Accounting approval and all posted finance
-- mutations remain RPC-only.
alter table public.assessments enable row level security;
create or replace function public.student_finance_guard_assessment_write()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  perform public.app_require_finance_writes_enabled();
  if tg_op = 'DELETE' then return old; end if;
  return new;
end
$$;
drop trigger if exists trg_student_finance_guard_assessment_write
  on public.assessments;
create trigger trg_student_finance_guard_assessment_write
before insert or update or delete on public.assessments
for each row execute function public.student_finance_guard_assessment_write();

drop policy if exists assessments_select_anon_auth on public.assessments;
drop policy if exists assessments_insert_anon_auth on public.assessments;
drop policy if exists assessments_update_anon_auth on public.assessments;
drop policy if exists assessments_delete_anon_auth on public.assessments;
create policy assessments_scoped_read
  on public.assessments for select to authenticated
  using (public.app_can_read_student_finance(student_id, school_id));
create policy assessments_registrar_insert
  on public.assessments for insert to authenticated
  with check (
    approval_status <> 'Approved for Payment'
    and public.app_has_permission('REGISTRAR', 'enrollment', 'edit', school_id)
  );
create policy assessments_registrar_update
  on public.assessments for update to authenticated
  using (
    approval_status in (
      'Pending Accounting Approval', 'Returned to Registrar', 'Rejected'
    )
    and public.app_has_permission('REGISTRAR', 'enrollment', 'edit', school_id)
  )
  with check (
    approval_status <> 'Approved for Payment'
    and public.app_has_permission('REGISTRAR', 'enrollment', 'edit', school_id)
  );
create policy assessments_registrar_delete
  on public.assessments for delete to authenticated
  using (
    approval_status in ('Pending Accounting Approval', 'Returned to Registrar')
    and public.app_has_permission('REGISTRAR', 'enrollment', 'edit', school_id)
  );

alter table public.assessment_fees enable row level security;
drop policy if exists assessment_fees_select_anon_auth on public.assessment_fees;
drop policy if exists assessment_fees_insert_anon_auth on public.assessment_fees;
drop policy if exists assessment_fees_update_anon_auth on public.assessment_fees;
drop policy if exists assessment_fees_delete_anon_auth on public.assessment_fees;
create policy assessment_fees_scoped_read
  on public.assessment_fees for select to authenticated
  using (exists (
    select 1 from public.assessments a
    where a.id = assessment_id
      and public.app_can_read_student_finance(a.student_id, a.school_id)
  ));
-- Fee writes are intentionally available only through
-- replace_draft_assessment_fees(), which validates status and permission.
revoke insert, update, delete on public.assessment_fees from anon, authenticated;

alter table public.assessment_audit_trail enable row level security;
drop policy if exists assessment_audit_trail_select_anon_auth
  on public.assessment_audit_trail;
drop policy if exists assessment_audit_trail_insert_anon_auth
  on public.assessment_audit_trail;
drop policy if exists assessment_audit_trail_update_anon_auth
  on public.assessment_audit_trail;
drop policy if exists assessment_audit_trail_delete_anon_auth
  on public.assessment_audit_trail;
create policy assessment_audit_trail_scoped_read
  on public.assessment_audit_trail for select to authenticated
  using (exists (
    select 1 from public.assessments a
    where a.id = assessment_id
      and public.app_can_read_student_finance(a.student_id, a.school_id)
  ));
-- Audit inserts are server-derived through append_student_assessment_audit().
revoke insert, update, delete on public.assessment_audit_trail from anon, authenticated;

alter table public.financial_holds enable row level security;
drop policy if exists financial_holds_select_anon_auth on public.financial_holds;
drop policy if exists financial_holds_insert_anon_auth on public.financial_holds;
drop policy if exists financial_holds_update_anon_auth on public.financial_holds;
drop policy if exists financial_holds_delete_anon_auth on public.financial_holds;
create policy financial_holds_scoped_read
  on public.financial_holds for select to authenticated
  using (exists (
    select 1 from public.students s
    where s.id = student_id
      and public.app_can_read_student_finance(s.id, s.school_id)
  ));
revoke insert, update, delete on public.financial_holds from anon, authenticated;

alter table public.discount_requests enable row level security;
drop policy if exists discount_requests_select_anon_auth on public.discount_requests;
drop policy if exists discount_requests_insert_anon_auth on public.discount_requests;
drop policy if exists discount_requests_update_anon_auth on public.discount_requests;
drop policy if exists discount_requests_delete_anon_auth on public.discount_requests;
create policy discount_requests_scoped_read
  on public.discount_requests for select to authenticated
  using (exists (
    select 1 from public.students s
    where s.id = student_id
      and public.app_can_read_student_finance(s.id, s.school_id)
  ));
revoke insert, update, delete on public.discount_requests from anon, authenticated;

alter table public.discount_request_audit_trail enable row level security;
drop policy if exists discount_request_audit_trail_select_anon_auth
  on public.discount_request_audit_trail;
drop policy if exists discount_request_audit_trail_insert_anon_auth
  on public.discount_request_audit_trail;
drop policy if exists discount_request_audit_trail_update_anon_auth
  on public.discount_request_audit_trail;
drop policy if exists discount_request_audit_trail_delete_anon_auth
  on public.discount_request_audit_trail;
create policy discount_request_audit_trail_scoped_read
  on public.discount_request_audit_trail for select to authenticated
  using (exists (
    select 1
    from public.discount_requests r
    join public.students s on s.id = r.student_id
    where r.id = discount_request_id
      and public.app_can_read_student_finance(s.id, s.school_id)
  ));
revoke insert, update, delete on public.discount_request_audit_trail
  from anon, authenticated;

alter table public.discount_types enable row level security;
drop policy if exists discount_types_select_anon_auth on public.discount_types;
drop policy if exists discount_types_insert_anon_auth on public.discount_types;
drop policy if exists discount_types_update_anon_auth on public.discount_types;
drop policy if exists discount_types_delete_anon_auth on public.discount_types;
create policy discount_types_authenticated_read
  on public.discount_types for select to authenticated using (true);
create policy discount_types_accounting_insert
  on public.discount_types for insert to authenticated
  with check (public.app_has_permission('ACCOUNTING', 'discounts', 'create', null));
create policy discount_types_accounting_update
  on public.discount_types for update to authenticated
  using (public.app_has_permission('ACCOUNTING', 'discounts', 'create', null))
  with check (public.app_has_permission('ACCOUNTING', 'discounts', 'create', null));
create policy discount_types_accounting_delete
  on public.discount_types for delete to authenticated
  using (public.app_has_permission('ACCOUNTING', 'discounts', 'create', null));
revoke all on public.discount_types from anon;

revoke all on
  public.assessments,
  public.assessment_fees,
  public.assessment_audit_trail,
  public.financial_holds,
  public.discount_requests,
  public.discount_request_audit_trail,
  public.discount_types,
  public.student_payment_methods,
  public.student_collection_categories,
  public.student_finance_adjustments,
  public.student_finance_journal_links
from anon;

grant select on
  public.student_invoice_financials,
  public.student_receipt_financials,
  public.student_unapplied_credits,
  public.student_installment_standing,
  public.student_finance_reconciliation_v2
to authenticated;
revoke all on
  public.student_invoice_financials,
  public.student_receipt_financials,
  public.student_unapplied_credits,
  public.student_installment_standing,
  public.student_finance_reconciliation_v2
from anon;

revoke all on
  public.assessment_financials,
  public.ledger_transactions,
  public.student_ledger_summaries,
  public.assessment_billing_summaries,
  public.payment_collection_summaries,
  public.student_finance_reconciliation,
  public.student_finance_unlinked_records
from anon;

revoke execute on function public.student_finance_sync_invoice(uuid, text)
  from public;
revoke execute on function public.student_finance_restate_invoice_plan(uuid, text)
  from public;
revoke execute on function public.approve_student_assessment_legacy_posting(
  uuid, text, text
) from public, anon, authenticated;
revoke execute on function public.post_student_payment_legacy_posting(
  uuid, uuid, uuid, numeric, text, text, text, text, text, text, text, text
) from public, anon, authenticated;
revoke execute on function public.submit_payment_void_request_legacy(
  uuid, text, text
) from public, anon, authenticated;
revoke execute on function public.review_payment_void_request_legacy(
  uuid, boolean, text, text
) from public, anon, authenticated;
revoke execute on function public.post_student_receipt(
  uuid, uuid, numeric, text, text, jsonb, jsonb, boolean, text, text, text
) from public;
revoke execute on function public.apply_student_unapplied_credit(
  uuid, jsonb, text, text
) from public;
revoke execute on function public.submit_student_allocation_reallocation(
  uuid, uuid, numeric, text, text
) from public;
revoke execute on function public.review_student_allocation_reallocation(
  uuid, boolean, text, text
) from public;
revoke execute on function public.submit_student_receipt_void_request(
  uuid, text, text
) from public;
revoke execute on function public.review_student_receipt_void_request(
  uuid, boolean, text, text
) from public;
revoke execute on function public.approve_student_assessment(uuid, text, text)
  from public, anon;
revoke execute on function public.post_student_payment(
  uuid, uuid, uuid, numeric, text, text, text, text, text, text, text, text
) from public, anon;
revoke execute on function public.submit_payment_void_request(uuid, text, text)
  from public, anon;
revoke execute on function public.review_payment_void_request(
  uuid, boolean, text, text
) from public, anon;
revoke execute on function public.replace_draft_assessment_fees(uuid, jsonb)
  from public, anon;
revoke execute on function public.post_student_adjustment(
  uuid, numeric, text, text, text, text
) from public, anon;
revoke execute on function public.approve_student_discount_request(
  uuid, integer, text, text
) from public, anon;
revoke execute on function public.submit_student_discount_request(
  uuid, uuid, text[], text, text[]
) from public, anon;
revoke execute on function public.reject_student_discount_request(
  uuid, integer, text, text
) from public, anon;
revoke execute on function public.set_student_assessment_hold(uuid, text, text)
  from public, anon;
revoke execute on function public.set_financial_hold_record_status(
  uuid, text, text, text
) from public, anon;
revoke execute on function public.review_student_assessment(uuid, text, text)
  from public, anon;
revoke execute on function public.append_student_assessment_audit(uuid, text, text)
  from public, anon;

grant execute on function public.approve_student_assessment(uuid, text, text)
  to authenticated;
grant execute on function public.post_student_payment(
  uuid, uuid, uuid, numeric, text, text, text, text, text, text, text, text
) to authenticated;
grant execute on function public.submit_payment_void_request(uuid, text, text)
  to authenticated;
grant execute on function public.review_payment_void_request(
  uuid, boolean, text, text
) to authenticated;
grant execute on function public.post_student_receipt(
  uuid, uuid, numeric, text, text, jsonb, jsonb, boolean, text, text, text
) to authenticated;
grant execute on function public.apply_student_unapplied_credit(
  uuid, jsonb, text, text
) to authenticated;
grant execute on function public.submit_student_allocation_reallocation(
  uuid, uuid, numeric, text, text
) to authenticated;
grant execute on function public.review_student_allocation_reallocation(
  uuid, boolean, text, text
) to authenticated;
grant execute on function public.submit_student_receipt_void_request(
  uuid, text, text
) to authenticated;
grant execute on function public.review_student_receipt_void_request(
  uuid, boolean, text, text
) to authenticated;
grant execute on function public.replace_draft_assessment_fees(uuid, jsonb)
  to authenticated;
grant execute on function public.post_student_adjustment(
  uuid, numeric, text, text, text, text
) to authenticated;
grant execute on function public.approve_student_discount_request(
  uuid, integer, text, text
) to authenticated;
grant execute on function public.submit_student_discount_request(
  uuid, uuid, text[], text, text[]
) to authenticated;
grant execute on function public.reject_student_discount_request(
  uuid, integer, text, text
) to authenticated;
grant execute on function public.set_student_assessment_hold(uuid, text, text)
  to authenticated;
grant execute on function public.set_financial_hold_record_status(
  uuid, text, text, text
) to authenticated;
grant execute on function public.review_student_assessment(uuid, text, text)
  to authenticated;
grant execute on function public.append_student_assessment_audit(uuid, text, text)
  to authenticated;

do $$
declare t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array[
      'student_payment_term_templates',
      'student_payment_term_template_installments',
      'discount_types',
      'discount_requests',
      'discount_request_audit_trail',
      'student_finance_invoices',
      'student_finance_invoice_lines',
      'student_invoice_payment_plans',
      'student_invoice_installments',
      'student_receipts',
      'student_receipt_allocations',
      'student_direct_collection_lines',
      'student_allocation_reversals',
      'student_allocation_reallocation_requests',
      'student_receipt_void_requests',
      'student_receipt_journal_links'
    ] loop
      if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public' and tablename = t
      ) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end
$$;

-- Retire the legacy mutable facts after every conversion assertion has
-- passed.  The compatibility views keep read-only consumers working during
-- the application cutover; all new writes go through normalized RPCs.
do $$
begin
  if to_regclass('public.payments_legacy') is not null
     or to_regclass('public.payment_void_requests_legacy') is not null then
    raise exception
      'Legacy cutover targets already exist; verify migration history before retrying';
  end if;
  if not exists (
    select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'payments' and c.relkind = 'r'
  ) or not exists (
    select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'payment_void_requests'
      and c.relkind = 'r'
  ) then
    raise exception
      'Expected physical payments/payment_void_requests tables were not found';
  end if;
end
$$;

alter table public.payments rename to payments_legacy;
alter table public.payment_void_requests rename to payment_void_requests_legacy;

-- PostgreSQL preserves publication membership when a table is renamed.
-- Remove every immutable archive from Realtime so clients can subscribe only
-- to canonical finance facts and never receive legacy compatibility events.
do $$
declare t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array[
      'ledger_transactions_legacy',
      'student_ledger_summaries_legacy',
      'assessment_billing_summaries_legacy',
      'payment_collection_summaries_legacy',
      'payments_legacy',
      'payment_void_requests_legacy'
    ] loop
      if exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public' and tablename = t
      ) then
        execute format('alter publication supabase_realtime drop table public.%I', t);
      end if;
    end loop;
  end if;
end
$$;

create or replace function public.student_finance_legacy_read_only()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception '% is a read-only migration archive', tg_table_name;
end
$$;

create trigger trg_payments_legacy_read_only
before insert or update or delete on public.payments_legacy
for each row execute function public.student_finance_legacy_read_only();

create trigger trg_payment_void_requests_legacy_read_only
before insert or update or delete on public.payment_void_requests_legacy
for each row execute function public.student_finance_legacy_read_only();

create view public.payments
with (security_invoker = true)
as select * from public.payments_legacy;

create view public.payment_void_requests
with (security_invoker = true)
as select * from public.payment_void_requests_legacy;

drop policy if exists payments_read on public.payments_legacy;
drop policy if exists payments_select_anon_auth on public.payments_legacy;
drop policy if exists payments_insert_anon_auth on public.payments_legacy;
drop policy if exists payments_update_anon_auth on public.payments_legacy;
drop policy if exists payments_delete_anon_auth on public.payments_legacy;
create policy payments_legacy_read
  on public.payments_legacy for select to authenticated
  using (public.app_can_read_student_finance(student_id, school_id));

drop policy if exists payment_void_requests_read
  on public.payment_void_requests_legacy;
create policy payment_void_requests_legacy_read
  on public.payment_void_requests_legacy for select to authenticated
  using (exists (
    select 1 from public.payments_legacy p
    where p.id = payment_id
      and public.app_can_read_student_finance(p.student_id, p.school_id)
  ));

revoke insert, update, delete on
  public.payments_legacy,
  public.payment_void_requests_legacy,
  public.payments,
  public.payment_void_requests
from anon, authenticated;

grant select on
  public.payments_legacy,
  public.payment_void_requests_legacy,
  public.payments,
  public.payment_void_requests
to authenticated;
revoke all on
  public.payments_legacy,
  public.payment_void_requests_legacy,
  public.payments,
  public.payment_void_requests
from anon;

comment on table public.student_finance_invoices is
  'Immutable accounting invoice snapshot created from an approved Registrar assessment.';
comment on table public.student_receipts is
  'Cash receipt header; invoice applications and direct collections are normalized child facts.';
comment on view public.student_unapplied_credits is
  'Posted receipt balances explicitly retained as student-deposit liability.';
comment on view public.payments is
  'Temporary read-only compatibility view over payments_legacy; use student_receipts for canonical finance.';

select set_config('app.student_finance_migration', 'off', true);
commit;

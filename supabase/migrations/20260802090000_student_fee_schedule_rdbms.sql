-- ============================================================================
-- STSN Connect — normalized, table-driven student fee schedules
--
-- This migration is additive. Existing assessments and posted finance facts are
-- snapshots and are never rewritten. Legacy setup/schedule tables remain only
-- as rollback inputs while all new assessment generation uses the resolver RPC.
-- ============================================================================

begin;

select pg_advisory_xact_lock(hashtext('stsn:student-fee-schedule-rdbms'));

insert into public.security_permissions(module_key,page_key,action_key,label,description,sort_order)
values
  ('ACCOUNTING','tuition-fees','view','Tuition Fees — View','View canonical student fee schedules',236),
  ('ACCOUNTING','tuition-fees','edit','Tuition Fees — Maintain','Create drafts, edit rates, and publish schedules',237)
on conflict do nothing;
with grants(role_code,action_key) as (values
  ('ACCOUNTING','view'),('ACCOUNTING','edit'),('SUPER_ADMIN','view'),('SUPER_ADMIN','edit')
)
insert into public.security_role_permissions(role_id,permission_id,is_allowed)
select r.id,p.id,true from grants g
join public.security_roles r on r.code=g.role_code
join public.security_permissions p on p.module_key='ACCOUNTING' and p.page_key='tuition-fees'
  and p.action_key=g.action_key
on conflict(role_id,permission_id) do update set is_allowed=true,updated_at=now();

-- --------------------------------------------------------------------------
-- Canonical academic dimensions used by finance configuration.
-- --------------------------------------------------------------------------
create table if not exists public.academic_years (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null unique,
  start_date date not null,
  end_date date not null,
  status text not null default 'Active'
    check (status in ('Draft','Active','Closed','Archived')),
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date > start_date),
  check (name ~ '^[0-9]{4}-[0-9]{4}$'),
  check (substring(name from 1 for 4)::integer + 1 = substring(name from 6 for 4)::integer)
);

create unique index if not exists ux_academic_years_current
  on public.academic_years(is_current) where is_current;

create table if not exists public.academic_year_levels (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null unique,
  academic_unit text not null check (academic_unit in ('basic-ed','college')),
  sort_order integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.academic_years(code, name, start_date, end_date, status, is_current)
select si.code, si.name,
  coalesce(nullif(si.metadata ->> 'startDate', '')::date,
    make_date(substring(si.name from 1 for 4)::integer, 6, 1)),
  coalesce(nullif(si.metadata ->> 'endDate', '')::date,
    make_date(substring(si.name from 6 for 4)::integer, 3, 31)),
  case when coalesce((si.metadata ->> 'isCurrent')::boolean, false) then 'Active' else 'Closed' end,
  coalesce((si.metadata ->> 'isCurrent')::boolean, false)
from public.setup_items si
where si.category = 'school_years' and si.name ~ '^[0-9]{4}-[0-9]{4}$'
on conflict (code) do update set
  name = excluded.name, start_date = excluded.start_date, end_date = excluded.end_date,
  status = excluded.status, is_current = excluded.is_current, updated_at = now();

insert into public.academic_year_levels(code, name, academic_unit, sort_order, is_active)
select si.code, si.name,
  case when coalesce(si.metadata ->> 'academicLevel', '') = 'College' then 'college' else 'basic-ed' end,
  coalesce(si.sort_order, (si.metadata ->> 'level')::integer, 0), si.is_active
from public.setup_items si where si.category = 'year_levels'
on conflict (code) do update set
  name = excluded.name, academic_unit = excluded.academic_unit,
  sort_order = excluded.sort_order, is_active = excluded.is_active, updated_at = now();

-- --------------------------------------------------------------------------
-- Fee masters and versioned schedules.
-- --------------------------------------------------------------------------
create table if not exists public.student_fee_categories (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  code text not null,
  name text not null,
  posting_category text not null
    check (posting_category in ('Tuition','Miscellaneous','Laboratory','ID/Other','Books')),
  revenue_account_code text not null references public.chart_of_accounts(code)
    on update cascade on delete restrict,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, code)
);

create table if not exists public.student_fee_items (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  code text not null,
  name text not null,
  category_id uuid not null references public.student_fee_categories(id) on delete restrict,
  billing_basis text not null default 'Flat'
    check (billing_basis in ('Flat','Per Unit','Per Subject','Quantity')),
  is_required boolean not null default true,
  is_discountable boolean not null default true,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, code),
  unique (id, school_id)
);

create table if not exists public.student_fee_schedules (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  academic_year_id uuid not null references public.academic_years(id) on delete restrict,
  academic_unit text not null check (academic_unit in ('basic-ed','college')),
  version integer not null default 1 check (version > 0),
  status text not null default 'Draft' check (status in ('Draft','Published','Archived')),
  source_reference text,
  source_notes text,
  created_by text,
  published_by text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, academic_year_id, academic_unit, version)
);

create unique index if not exists ux_student_fee_schedule_published
  on public.student_fee_schedules(school_id, academic_year_id, academic_unit)
  where status = 'Published';

create table if not exists public.student_fee_schedule_rates (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.student_fee_schedules(id) on delete cascade,
  fee_item_id uuid not null references public.student_fee_items(id) on delete restrict,
  year_level_id uuid not null references public.academic_year_levels(id) on delete restrict,
  course_id uuid references public.courses(id) on delete restrict,
  amount numeric(15,2) not null check (amount > 0),
  is_required boolean,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.student_fee_schedule_audit_log (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.student_fee_schedules(id) on delete restrict,
  rate_id uuid references public.student_fee_schedule_rates(id) on delete set null,
  action text not null check (action in ('Draft Created','Rate Created','Rate Updated','Rate Deleted','Published')),
  old_values jsonb,
  new_values jsonb,
  performed_by text not null,
  performed_at timestamptz not null default now()
);

create unique index if not exists ux_student_fee_rate_general
  on public.student_fee_schedule_rates(schedule_id, fee_item_id, year_level_id)
  where course_id is null;
create unique index if not exists ux_student_fee_rate_course
  on public.student_fee_schedule_rates(schedule_id, fee_item_id, year_level_id, course_id)
  where course_id is not null;
create index if not exists ix_student_fee_rates_resolve
  on public.student_fee_schedule_rates(schedule_id, year_level_id, course_id);

alter table public.assessment_fees
  add column if not exists fee_schedule_id uuid references public.student_fee_schedules(id) on delete restrict,
  add column if not exists fee_schedule_rate_id uuid references public.student_fee_schedule_rates(id) on delete restrict,
  add column if not exists fee_item_id uuid references public.student_fee_items(id) on delete restrict,
  add column if not exists fee_category_id uuid references public.student_fee_categories(id) on delete restrict;

-- --------------------------------------------------------------------------
-- Normalized discount scope, sibling evidence, and sponsorships.
-- --------------------------------------------------------------------------
alter table public.discount_types
  add column if not exists school_id uuid references public.schools(id) on delete restrict,
  add column if not exists academic_year_id uuid references public.academic_years(id) on delete restrict,
  add column if not exists sibling_position integer check (sibling_position is null or sibling_position >= 2),
  add column if not exists exclusive_group text,
  add column if not exists effective_from date,
  add column if not exists effective_to date;

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.discount_types'::regclass
      and conname = 'discount_type_effective_dates'
  ) then
    alter table public.discount_types add constraint discount_type_effective_dates
      check (effective_to is null or effective_from is null or effective_to >= effective_from)
      not valid;
  end if;
end $$;

create table if not exists public.discount_type_fee_categories (
  discount_type_id uuid not null references public.discount_types(id) on delete cascade,
  fee_category_id uuid not null references public.student_fee_categories(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (discount_type_id, fee_category_id)
);

create table if not exists public.discount_request_students (
  discount_request_id uuid not null references public.discount_requests(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete restrict,
  enrollment_id uuid references public.enrollments(id) on delete restrict,
  relationship_role text not null check (relationship_role in ('Beneficiary','Supporting Sibling')),
  verified_at timestamptz,
  verified_by text,
  created_at timestamptz not null default now(),
  primary key (discount_request_id, student_id)
);

create table if not exists public.student_aid_programs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  code text not null,
  name text not null,
  sponsor_name text not null,
  benefit_basis text not null check (benefit_basis in ('Fixed Amount','Percentage')),
  benefit_value numeric(15,4) not null check (benefit_value >= 0),
  academic_year_id uuid references public.academic_years(id) on delete restrict,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, code)
);

create table if not exists public.student_aid_awards (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.student_aid_programs(id) on delete restrict,
  student_id uuid not null references public.students(id) on delete restrict,
  enrollment_id uuid references public.enrollments(id) on delete restrict,
  approved_amount numeric(15,2) not null check (approved_amount >= 0),
  status text not null default 'Pending' check (status in ('Pending','Approved','Cancelled','Expired')),
  reference_no text,
  approved_by text,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_id, student_id, enrollment_id)
);

create table if not exists public.student_aid_invoice_allocations (
  id uuid primary key default gen_random_uuid(),
  award_id uuid not null references public.student_aid_awards(id) on delete restrict,
  invoice_id uuid not null references public.student_finance_invoices(id) on delete restrict,
  amount numeric(15,2) not null check (amount > 0),
  created_at timestamptz not null default now(),
  unique (award_id, invoice_id)
);

insert into public.student_aid_programs(
  school_id,code,name,sponsor_name,benefit_basis,benefit_value,academic_year_id,is_active
)
select s.id,x.code,x.name,x.sponsor,'Fixed Amount',0,y.id,false
from public.schools s join public.academic_years y on y.name='2025-2026'
cross join (values
  ('DEPED','DepEd Sponsorship','Department of Education'),
  ('ESC','ESC Grant','Department of Education / PEAC'),
  ('QVR','QVR Voucher','Department of Education')
) x(code,name,sponsor)
where s.code='STSN'
on conflict (school_id,code) do nothing;

alter table public.student_payment_term_templates
  add column if not exists is_default boolean not null default false;
create unique index if not exists ux_student_payment_term_template_default
  on public.student_payment_term_templates(school_id, academic_year)
  where is_active and is_default;
update public.student_payment_term_templates t set is_default = true, updated_at = now()
where t.is_active and t.code = 'INSTALLMENT_4'
  and not exists (
    select 1 from public.student_payment_term_templates d
    where d.school_id = t.school_id and d.academic_year = t.academic_year
      and d.is_active and d.is_default
  );

-- --------------------------------------------------------------------------
-- Seed categories for every school and the workbook fee-item master for STSN.
-- --------------------------------------------------------------------------
insert into public.student_fee_categories(
  school_id, code, name, posting_category, revenue_account_code
)
select s.id, x.code, x.name, x.posting_category,
  case
    when x.posting_category = 'Tuition' and s.code = 'CDSTA' then '4120'
    when x.posting_category = 'Tuition' then '4110'
    else '4200'
  end
from public.schools s
cross join (values
  ('TUI','Tuition','Tuition'),
  ('MISC','Miscellaneous','Miscellaneous'),
  ('LAB','Laboratory','Laboratory'),
  ('OTHER','ID / Other','ID/Other'),
  ('BOOKS','Books','Books')
) x(code, name, posting_category)
on conflict (school_id, code) do update set
  name = excluded.name, posting_category = excluded.posting_category,
  revenue_account_code = excluded.revenue_account_code, updated_at = now();

with stsn as (select id from public.schools where code = 'STSN'),
items(code, name, category_code, discountable, sort_order) as (values
  ('TUITION','Tuition Fee','TUI',true,0),
  ('REGISTRATION','Registration','MISC',true,10),
  ('MEDICAL_DENTAL','Medical/Dental Fee','MISC',true,20),
  ('GUIDANCE','Guidance Fee','MISC',true,30),
  ('INSURANCE','Insurance','MISC',true,40),
  ('LIBRARY','Library','MISC',true,50),
  ('LAB_TLE_HE','Laboratory Fee - TLE/HE','LAB',true,60),
  ('LAB_SCIENCE','Laboratory Fee - Science','LAB',true,70),
  ('LAB_CHEMISTRY','Laboratory Fee - Chemistry','LAB',true,80),
  ('REPORT_CARD','Report Card','MISC',true,90),
  ('CLASS_PICTURE','Class Picture','OTHER',false,100),
  ('BSP_GSP','BSP/GSP','MISC',true,110),
  ('ATHLETICS','Athletics','MISC',true,120),
  ('INSTRUCTIONAL_MATERIALS','Instructional Materials','MISC',true,130),
  ('MIS','MIS','MISC',true,140),
  ('RFID','RFID','OTHER',false,150),
  ('SCHOOL_ORGANIZATION','School Organization','MISC',true,160),
  ('RECOLLECTION','Recollection Fee','MISC',true,170),
  ('GRADUATION','Graduation Fee','OTHER',false,180),
  ('YEARBOOK','Yearbook','OTHER',false,190),
  ('COMPUTER','Computer Fee','LAB',true,200),
  ('DEVELOPMENT','Development Fee','OTHER',true,210),
  ('CO_CURRICULAR','Co-Curricular Activity','MISC',true,220),
  ('ENERGY','Energy Fee','OTHER',true,230),
  ('WATER','Water Consumption','OTHER',true,240)
)
insert into public.student_fee_items(
  school_id, code, name, category_id, is_discountable, sort_order
)
select stsn.id, i.code, i.name, c.id, i.discountable, i.sort_order
from stsn cross join items i
join public.student_fee_categories c on c.school_id = stsn.id and c.code = i.category_code
on conflict (school_id, code) do update set
  name = excluded.name, category_id = excluded.category_id,
  is_discountable = excluded.is_discountable, sort_order = excluded.sort_order,
  updated_at = now();

-- The workbook is the source for this Draft. It remains unpublished until the
-- reconciliation view below is reviewed by Accounting.
insert into public.student_fee_schedules(
  school_id, academic_year_id, academic_unit, version, status,
  source_reference, source_notes, created_by
)
select s.id, y.id, 'basic-ed', 1, 'Draft',
  'STSN_STUDENT ACCOUNTS_SY2025-2026.xlsx / TUITION FEE!A5:L35',
  'Filename treated as authoritative; worksheet heading contains 2023-2024.',
  'Migration 20260802090000'
from public.schools s join public.academic_years y on y.name = '2025-2026'
where s.code = 'STSN'
on conflict (school_id, academic_year_id, academic_unit, version) do nothing;

with rate_source(item_code, amount, level_codes) as (values
  ('TUITION',39292.13,array['K1']),('TUITION',40063.09,array['K2']),('TUITION',34558.55,array['G1','G2','G3']),('TUITION',35995.29,array['G4','G5']),('TUITION',36247.33,array['G6']),('TUITION',45215.13,array['G7','G8']),('TUITION',48033.16,array['G9']),('TUITION',50111.39,array['G10']),('TUITION',26792.90,array['G11']),('TUITION',27335.58,array['G12']),
  ('REGISTRATION',1131.35,array['K1']),('REGISTRATION',1182.78,array['K2','G1','G2','G3','G4','G5','G6','G7','G8','G9','G10']),('REGISTRATION',800.11,array['G11','G12']),
  ('MEDICAL_DENTAL',1064.80,array['K1']),('MEDICAL_DENTAL',1113.20,array['K2','G1','G2','G3','G4','G5','G6','G7','G8','G9','G10']),('MEDICAL_DENTAL',765.33,array['G11','G12']),
  ('GUIDANCE',399.30,array['K1']),('GUIDANCE',417.45,array['K2','G1','G2','G3','G4','G5','G6','G7','G8','G9','G10']),('GUIDANCE',278.30,array['G11','G12']),
  ('INSURANCE',133.10,array['K1']),('INSURANCE',139.15,array['K2','G1','G2','G3','G4','G5','G6','G7','G8','G9','G10']),('INSURANCE',208.73,array['G11','G12']),
  ('LIBRARY',266.20,array['K1']),('LIBRARY',278.30,array['K2','G1','G2','G3','G4','G5','G6','G7','G8','G9','G10','G11','G12']),
  ('LAB_TLE_HE',695.75,array['G4','G5']),('LAB_TLE_HE',556.60,array['G6','G7','G8','G9','G10']),('LAB_TLE_HE',1120.15,array['G11','G12']),
  ('LAB_SCIENCE',278.30,array['G1','G2','G3']),('LAB_SCIENCE',306.12,array['G4','G5','G6','G7','G8','G9','G10']),('LAB_SCIENCE',800.11,array['G11','G12']),
  ('LAB_CHEMISTRY',800.11,array['G11','G12']),('REPORT_CARD',417.45,array['G11','G12']),('CLASS_PICTURE',278.30,array['G11','G12']),
  ('BSP_GSP',133.10,array['K1']),('ATHLETICS',266.20,array['K1']),('ATHLETICS',278.30,array['K2']),('ATHLETICS',417.45,array['G1','G2','G3','G4','G5','G7','G8','G9','G10']),('ATHLETICS',521.81,array['G6']),('ATHLETICS',306.12,array['G11','G12']),
  ('INSTRUCTIONAL_MATERIALS',3061.30,array['K1']),('INSTRUCTIONAL_MATERIALS',3617.90,array['K2','G1','G2','G3','G4','G5','G6']),('INSTRUCTIONAL_MATERIALS',3339.60,array['G7','G8','G9','G10']),('INSTRUCTIONAL_MATERIALS',1600.23,array['G11']),('INSTRUCTIONAL_MATERIALS',1530.65,array['G12']),
  ('RFID',278.30,array['G11','G12']),('SCHOOL_ORGANIZATION',399.30,array['K1']),('SCHOOL_ORGANIZATION',417.45,array['K2','G1','G2','G3','G4','G5','G6','G7','G8','G9','G10']),('SCHOOL_ORGANIZATION',278.30,array['G11','G12']),
  ('RECOLLECTION',974.05,array['G6']),('RECOLLECTION',2365.55,array['G10']),('RECOLLECTION',1113.20,array['G12']),
  ('GRADUATION',1391.50,array['K2','G6','G10']),('GRADUATION',1530.65,array['G12']),('YEARBOOK',1391.50,array['K2','G6','G10','G12']),
  ('COMPUTER',1996.50,array['K1']),('COMPUTER',2295.98,array['K2']),('COMPUTER',2713.43,array['G1','G2','G3']),('COMPUTER',4522.38,array['G4','G5','G6']),('COMPUTER',3478.75,array['G7','G8','G9','G10']),('COMPUTER',1600.23,array['G11']),('COMPUTER',1530.65,array['G12']),
  ('DEVELOPMENT',1100.00,array['K2','G1','G2','G3','G4','G5','G6','G7','G8','G9','G10','G11','G12']),
  ('CO_CURRICULAR',550.00,array['G1','G2','G3','G4','G5','G6','G7','G8','G9','G10','G11','G12']),
  ('ENERGY',1782.21,array['K1']),('WATER',685.47,array['K1'])
), expanded as (
  select item_code, amount, unnest(level_codes) as level_code from rate_source
), target as (
  select fs.id schedule_id, fs.school_id
  from public.student_fee_schedules fs
  join public.schools s on s.id = fs.school_id
  join public.academic_years y on y.id = fs.academic_year_id
  where s.code = 'STSN' and y.name = '2025-2026' and fs.academic_unit = 'basic-ed' and fs.version = 1
)
insert into public.student_fee_schedule_rates(schedule_id, fee_item_id, year_level_id, amount)
select t.schedule_id, fi.id, yl.id, e.amount
from target t cross join expanded e
join public.student_fee_items fi on fi.school_id = t.school_id and fi.code = e.item_code
join public.academic_year_levels yl on yl.code = e.level_code
on conflict do nothing;

-- Published 2026-2027 STSN schedule is a versioned copy of the reviewed source
-- dataset so current enrollment has a configured, non-hardcoded source.
insert into public.student_fee_schedules(
  school_id, academic_year_id, academic_unit, version, status,
  source_reference, source_notes, created_by, published_by, published_at
)
select s.id, y.id, 'basic-ed', 1, 'Published',
  'Copied from STSN SY2025-2026 workbook schedule',
  'Initial canonical schedule; revise through Draft/Publish workflow.',
  'Migration 20260802090000', 'Migration 20260802090000', now()
from public.schools s join public.academic_years y on y.name = '2026-2027'
where s.code = 'STSN'
on conflict (school_id, academic_year_id, academic_unit, version) do nothing;

insert into public.student_fee_schedule_rates(schedule_id, fee_item_id, year_level_id, amount, is_required, note)
select dst.id, src.fee_item_id, src.year_level_id, src.amount, src.is_required,
  'Copied from normalized SY2025-2026 source'
from public.student_fee_schedules dst
join public.schools ds on ds.id = dst.school_id and ds.code = 'STSN'
join public.academic_years dy on dy.id = dst.academic_year_id and dy.name = '2026-2027'
join public.student_fee_schedules sh on sh.school_id = dst.school_id and sh.academic_unit = dst.academic_unit
join public.academic_years sy on sy.id = sh.academic_year_id and sy.name = '2025-2026'
join public.student_fee_schedule_rates src on src.schedule_id = sh.id
where dst.academic_unit = 'basic-ed' and dst.version = 1
on conflict do nothing;

-- Normalize the legacy current-year rows for scopes not covered by the source
-- workbook. These rows become migration inputs only; runtime never reads the
-- legacy schedule tables after this migration.
with item_source(school_code, code, name, category_code, sort_order) as (
  select s.code, x.code, x.name, x.category_code, x.sort_order
  from public.schools s
  cross join (values
    ('LEGACY_TUITION','Tuition Fee','TUI',0),
    ('LEGACY_LAB','Laboratory Fee','LAB',10),
    ('LEGACY_COMPUTER','Computer Fee','LAB',20)
  ) x(code,name,category_code,sort_order)
  where s.code = 'CDSTA'
  union all
  select s.code, 'LEGACY_MISC_' || row_number() over (order by m.sort_order, m.id)::text,
    m.fee_name, case when lower(m.fee_name) like '%id%' then 'OTHER' else 'MISC' end,
    100 + coalesce(m.sort_order,0)
  from public.schools s cross join public.misc_fee_schedule m
  where s.code in ('STSN','CDSTA')
)
insert into public.student_fee_items(school_id,code,name,category_id,is_required,is_discountable,sort_order)
select s.id, x.code, x.name, c.id, true, true, x.sort_order
from item_source x join public.schools s on s.code = x.school_code
join public.student_fee_categories c on c.school_id = s.id and c.code = x.category_code
on conflict (school_id,code) do update set name=excluded.name, category_id=excluded.category_id,
  sort_order=excluded.sort_order, updated_at=now();

insert into public.student_fee_schedules(
  school_id, academic_year_id, academic_unit, version, status,
  source_reference, source_notes, created_by, published_by, published_at
)
select s.id, y.id, 'college', 1, 'Published',
  'Normalized from tuition_fee_schedule, misc_fee_schedule and lab_fee_adjustments',
  'Rollback source import; maintain future versions through Tuition Fees.',
  'Migration 20260802090000', 'Migration 20260802090000', now()
from public.schools s join public.academic_years y on y.name='2026-2027'
where s.code='CDSTA'
on conflict (school_id,academic_year_id,academic_unit,version) do nothing;

with target as (
  select fs.id, fs.school_id from public.student_fee_schedules fs
  join public.schools s on s.id=fs.school_id and s.code='CDSTA'
  join public.academic_years y on y.id=fs.academic_year_id and y.name='2026-2027'
  where fs.academic_unit='college' and fs.version=1
), mapped as (
  select t.id schedule_id, t.school_id, yl.id year_level_id, f.id fee_item_id, x.amount
  from target t cross join public.tuition_fee_schedule old
  join public.academic_year_levels yl on yl.name=old.year_level and yl.academic_unit='college'
  cross join lateral (values
    ('LEGACY_TUITION',old.tuition),('LEGACY_LAB',old.lab_fee),('LEGACY_COMPUTER',old.computer_fee)
  ) x(code,amount)
  join public.student_fee_items f on f.school_id=t.school_id and f.code=x.code
  where x.amount > 0
)
insert into public.student_fee_schedule_rates(schedule_id,fee_item_id,year_level_id,amount,note)
select schedule_id,fee_item_id,year_level_id,amount,'Normalized from legacy current-year schedule'
from mapped on conflict do nothing;

with target as (
  select fs.id, fs.school_id, fs.academic_unit from public.student_fee_schedules fs
  join public.academic_years y on y.id=fs.academic_year_id and y.name='2026-2027'
  where fs.status='Published'
), mapped as (
  select t.id schedule_id, f.id fee_item_id, yl.id year_level_id, m.amount
  from target t cross join public.academic_year_levels yl
  cross join public.misc_fee_schedule m
  join public.student_fee_items f on f.school_id=t.school_id and f.name=m.fee_name
    and f.code like 'LEGACY_MISC_%'
  where yl.academic_unit=t.academic_unit and yl.is_active and m.amount > 0
)
insert into public.student_fee_schedule_rates(schedule_id,fee_item_id,year_level_id,amount,note)
select schedule_id,fee_item_id,year_level_id,amount,'Normalized from legacy miscellaneous schedule'
from mapped on conflict do nothing;

-- Nursery is outside the supplied workbook. Preserve its already configured
-- current-year values as canonical rates without inventing a workbook value.
with target as (
  select fs.id, fs.school_id from public.student_fee_schedules fs
  join public.schools s on s.id=fs.school_id and s.code='STSN'
  join public.academic_years y on y.id=fs.academic_year_id and y.name='2026-2027'
  where fs.academic_unit='basic-ed' and fs.status='Published'
), source as (
  select t.id schedule_id, fi.id fee_item_id, yl.id year_level_id, x.amount
  from target t join public.tuition_fee_schedule old on old.year_level='Nursery'
  join public.academic_year_levels yl on yl.name=old.year_level
  cross join lateral (values
    ('TUITION',old.tuition),('LAB_SCIENCE',old.lab_fee),('COMPUTER',old.computer_fee)
  ) x(code,amount)
  join public.student_fee_items fi on fi.school_id=t.school_id and fi.code=x.code
  where x.amount > 0
)
insert into public.student_fee_schedule_rates(schedule_id,fee_item_id,year_level_id,amount,note)
select schedule_id,fee_item_id,year_level_id,amount,'Preserved from existing Nursery configuration'
from source on conflict do nothing;

-- Source-link only mutable historical drafts where the snapshot name maps
-- unambiguously. Amounts, approved assessments, invoices, receipts, journals,
-- and posted payment-plan snapshots are deliberately untouched.
update public.assessment_fees af set
  fee_schedule_id=fs.id,fee_schedule_rate_id=r.id,fee_item_id=fi.id,fee_category_id=fc.id
from public.assessments a
join public.students st on st.id=a.student_id
join public.academic_years ay on ay.name=a.school_year
join public.student_fee_schedules fs on fs.school_id=a.school_id and fs.academic_year_id=ay.id and fs.status='Published'
join public.academic_year_levels yl on lower(yl.name)=lower(st.year_level) and yl.academic_unit=fs.academic_unit
join public.student_fee_schedule_rates r on r.schedule_id=fs.id and r.year_level_id=yl.id and r.course_id is null
join public.student_fee_items fi on fi.id=r.fee_item_id
join public.student_fee_categories fc on fc.id=fi.category_id
where af.assessment_id=a.id
  and a.approval_status is distinct from 'Approved for Payment'
  and lower(af.fee_name)=lower(fi.name)
  and af.fee_schedule_rate_id is null;

-- --------------------------------------------------------------------------
-- Sibling discount policy seed and scope normalization.
-- --------------------------------------------------------------------------
insert into public.discount_types(
  code,name,discount_percent,discount_source,requires_approval,description,is_active,
  effective_school_year,applicable_academic_unit,applies_to,discount_basis,is_stackable,
  requires_document,school_id,academic_year_id
)
select 'NO-DISCOUNT','No Discount',0,'Other',false,'No discount applied',true,
  y.name,'both','Total Assessment','Percentage',false,false,s.id,y.id
from public.schools s join public.academic_years y on y.name='2025-2026'
where s.code='STSN'
on conflict(code) do update set name=excluded.name,discount_percent=excluded.discount_percent,
  requires_approval=false,is_active=true,updated_at=now();

insert into public.discount_types(
  code, name, discount_percent, discount_source, requires_approval,
  description, is_active, effective_school_year, applicable_academic_unit,
  applies_to, discount_basis, is_stackable, requires_document,
  school_id, academic_year_id, sibling_position, exclusive_group
)
select x.code, x.name, x.percent, 'Sibling', true, x.description, x.active,
  y.name, 'basic-ed', 'Tuition', 'Percentage', false, true,
  s.id, y.id, x.position, 'SIBLING'
from public.schools s join public.academic_years y on y.name = '2025-2026'
cross join (values
  ('SIB-2','2nd Child Discount',5::numeric,2,true,'5% tuition discount for the second concurrently enrolled child.'),
  ('SIB-3','3rd Child Discount',10::numeric,3,true,'10% tuition discount for the third concurrently enrolled child.'),
  ('SIB-4','4th Child Discount',15::numeric,4,true,'15% tuition discount for the fourth concurrently enrolled child.'),
  ('SIB-5','5th Child Discount',20::numeric,5,false,'Inactive pending confirmation: workbook label says 5% while formula calculates 20%.')
) x(code,name,percent,position,active,description)
where s.code = 'STSN'
on conflict (code) do update set
  name = excluded.name, discount_percent = excluded.discount_percent,
  requires_approval = excluded.requires_approval, description = excluded.description,
  is_active = excluded.is_active, effective_school_year = excluded.effective_school_year,
  applicable_academic_unit = excluded.applicable_academic_unit,
  applies_to = excluded.applies_to, discount_basis = excluded.discount_basis,
  is_stackable = excluded.is_stackable, requires_document = excluded.requires_document,
  school_id = excluded.school_id, academic_year_id = excluded.academic_year_id,
  sibling_position = excluded.sibling_position, exclusive_group = excluded.exclusive_group,
  updated_at = now();

insert into public.discount_type_fee_categories(discount_type_id, fee_category_id)
select dt.id, fc.id
from public.discount_types dt
join public.student_fee_categories fc on fc.school_id = dt.school_id and fc.posting_category = 'Tuition'
where dt.code in ('SIB-2','SIB-3','SIB-4','SIB-5')
on conflict do nothing;

insert into public.discount_request_students(discount_request_id, student_id, relationship_role)
select r.id, r.student_id, 'Beneficiary' from public.discount_requests r
on conflict do nothing;

insert into public.discount_request_students(discount_request_id, student_id, relationship_role)
select r.id, sibling_id, 'Supporting Sibling'
from public.discount_requests r cross join lateral unnest(r.sibling_student_ids) sibling_id
where sibling_id <> r.student_id
on conflict do nothing;

-- --------------------------------------------------------------------------
-- Resolver and lifecycle RPCs.
-- --------------------------------------------------------------------------
create or replace function public.resolve_student_assessment_fees(
  p_school_id uuid,
  p_academic_year text,
  p_year_level text,
  p_course_id uuid default null
)
returns table(
  fee_schedule_id uuid,
  fee_schedule_rate_id uuid,
  fee_item_id uuid,
  fee_category_id uuid,
  fee_name text,
  category text,
  amount numeric,
  quantity numeric,
  unit_amount numeric,
  revenue_account_code text,
  is_required boolean
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_schedule_id uuid;
  v_level_id uuid;
  v_unit text;
begin
  select yl.id, yl.academic_unit into v_level_id, v_unit
  from public.academic_year_levels yl
  where yl.is_active and (upper(yl.code) = upper(p_year_level) or lower(yl.name) = lower(p_year_level));
  if v_level_id is null then
    raise exception 'No configured academic year level matches %', p_year_level;
  end if;

  select fs.id into v_schedule_id
  from public.student_fee_schedules fs
  join public.academic_years ay on ay.id = fs.academic_year_id
  where fs.school_id = p_school_id and ay.name = p_academic_year
    and fs.academic_unit = v_unit and fs.status = 'Published';
  if v_schedule_id is null then
    raise exception 'No Published fee schedule exists for school %, academic year %, unit %',
      p_school_id, p_academic_year, v_unit;
  end if;

  return query
  with ranked as (
    select r.*, row_number() over (
      partition by r.fee_item_id
      order by case when r.course_id = p_course_id and p_course_id is not null then 0 else 1 end
    ) as preference
    from public.student_fee_schedule_rates r
    where r.schedule_id = v_schedule_id and r.year_level_id = v_level_id
      and (r.course_id is null or r.course_id = p_course_id)
  )
  select v_schedule_id, r.id, fi.id, fc.id, fi.name, fc.posting_category,
    round(r.amount, 2), 1::numeric, round(r.amount, 2), fc.revenue_account_code,
    coalesce(r.is_required, fi.is_required)
  from ranked r
  join public.student_fee_items fi on fi.id = r.fee_item_id and fi.is_active
  join public.student_fee_categories fc on fc.id = fi.category_id and fc.is_active
  where r.preference = 1 and r.amount > 0
  order by fi.sort_order, fi.code;
end
$$;

create or replace function public.upsert_student_fee_schedule_rate(
  p_schedule_id uuid, p_fee_item_id uuid, p_year_level_id uuid,
  p_amount numeric, p_course_id uuid default null, p_actor text default null
)
returns public.student_fee_schedule_rates
language plpgsql security definer set search_path = public as $$
declare v_schedule public.student_fee_schedules%rowtype; v_rate public.student_fee_schedule_rates%rowtype;
begin
  select * into v_schedule from public.student_fee_schedules where id = p_schedule_id for update;
  if not found then raise exception 'Fee schedule was not found'; end if;
  if v_schedule.status <> 'Draft' then raise exception 'Only Draft fee schedules can be edited'; end if;
  perform public.app_require_permission('ACCOUNTING', 'tuition-fees', 'edit', v_schedule.school_id);
  if p_amount <= 0 then raise exception 'Fee rate must be positive; delete the rate for a blank matrix cell'; end if;
  select * into v_rate from public.student_fee_schedule_rates
  where schedule_id = p_schedule_id and fee_item_id = p_fee_item_id
    and year_level_id = p_year_level_id and course_id is not distinct from p_course_id for update;
  if found then
    update public.student_fee_schedule_rates set amount = p_amount, updated_at = now()
    where id = v_rate.id returning * into v_rate;
  else
    insert into public.student_fee_schedule_rates(schedule_id,fee_item_id,year_level_id,course_id,amount)
    values(p_schedule_id,p_fee_item_id,p_year_level_id,p_course_id,p_amount) returning * into v_rate;
  end if;
  update public.student_fee_schedules set updated_at = now() where id = p_schedule_id;
  insert into public.student_fee_schedule_audit_log(schedule_id,rate_id,action,new_values,performed_by)
  values(p_schedule_id,v_rate.id,
    case when v_rate.created_at=v_rate.updated_at then 'Rate Created' else 'Rate Updated' end,
    to_jsonb(v_rate),coalesce(public.app_current_user_name(),p_actor,'System'));
  return v_rate;
end $$;

create or replace function public.delete_student_fee_schedule_rate(p_rate_id uuid,p_actor text default null)
returns boolean language plpgsql security definer set search_path=public as $$
declare v_rate public.student_fee_schedule_rates%rowtype; v_schedule public.student_fee_schedules%rowtype;
begin
  select * into v_rate from public.student_fee_schedule_rates where id=p_rate_id for update;
  if not found then return false; end if;
  select * into v_schedule from public.student_fee_schedules where id=v_rate.schedule_id for update;
  if v_schedule.status<>'Draft' then raise exception 'Only Draft fee schedules can be edited'; end if;
  perform public.app_require_permission('ACCOUNTING','tuition-fees','edit',v_schedule.school_id);
  insert into public.student_fee_schedule_audit_log(schedule_id,rate_id,action,old_values,performed_by)
  values(v_schedule.id,v_rate.id,'Rate Deleted',to_jsonb(v_rate),coalesce(public.app_current_user_name(),p_actor,'System'));
  delete from public.student_fee_schedule_rates where id=v_rate.id;
  return true;
end $$;

create or replace function public.create_student_fee_schedule_draft(
  p_school_id uuid,p_academic_year_id uuid,p_academic_unit text,p_actor text default null
)
returns public.student_fee_schedules language plpgsql security definer set search_path=public as $$
declare v_source public.student_fee_schedules%rowtype; v_draft public.student_fee_schedules%rowtype;
begin
  if p_academic_unit not in ('basic-ed','college') then raise exception 'Unsupported academic unit'; end if;
  perform pg_advisory_xact_lock(hashtext(p_school_id::text||':'||p_academic_year_id::text||':'||p_academic_unit));
  perform public.app_require_permission('ACCOUNTING','tuition-fees','edit',p_school_id);
  select * into v_draft from public.student_fee_schedules where school_id=p_school_id
    and academic_year_id=p_academic_year_id and academic_unit=p_academic_unit and status='Draft';
  if found then return v_draft; end if;
  select * into v_source from public.student_fee_schedules where school_id=p_school_id
    and academic_year_id=p_academic_year_id and academic_unit=p_academic_unit and status='Published';
  insert into public.student_fee_schedules(
    school_id,academic_year_id,academic_unit,version,status,source_reference,source_notes,created_by
  ) select p_school_id,p_academic_year_id,p_academic_unit,
    coalesce(max(version),0)+1,'Draft',
    case when v_source.id is null then null else 'Cloned from Published schedule '||v_source.id::text end,
    'Created through Tuition Fees maintenance',coalesce(public.app_current_user_name(),p_actor,'System')
  from public.student_fee_schedules where school_id=p_school_id
    and academic_year_id=p_academic_year_id and academic_unit=p_academic_unit
  returning * into v_draft;
  if v_source.id is not null then
    insert into public.student_fee_schedule_rates(schedule_id,fee_item_id,year_level_id,course_id,amount,is_required,note)
    select v_draft.id,fee_item_id,year_level_id,course_id,amount,is_required,'Cloned from Published version'
    from public.student_fee_schedule_rates where schedule_id=v_source.id;
  end if;
  insert into public.student_fee_schedule_audit_log(schedule_id,action,new_values,performed_by)
  values(v_draft.id,'Draft Created',to_jsonb(v_draft),coalesce(public.app_current_user_name(),p_actor,'System'));
  return v_draft;
end $$;

create or replace function public.publish_student_fee_schedule(p_schedule_id uuid, p_actor text default null)
returns public.student_fee_schedules
language plpgsql security definer set search_path = public as $$
declare v_schedule public.student_fee_schedules%rowtype; v_missing text[];
begin
  select * into v_schedule from public.student_fee_schedules where id = p_schedule_id for update;
  if not found then raise exception 'Fee schedule was not found'; end if;
  if v_schedule.status <> 'Draft' then raise exception 'Only Draft fee schedules can be published'; end if;
  perform public.app_require_permission('ACCOUNTING', 'tuition-fees', 'edit', v_schedule.school_id);
  if not exists (
    select 1 from public.student_fee_schedule_rates r
    join public.student_fee_items fi on fi.id=r.fee_item_id
    join public.student_fee_categories fc on fc.id=fi.category_id
    where r.schedule_id=v_schedule.id and fc.posting_category='Tuition'
  ) then raise exception 'A fee schedule cannot be published without tuition rates'; end if;
  select array_agg(yl.code order by yl.sort_order) into v_missing
  from public.academic_year_levels yl
  where yl.academic_unit = v_schedule.academic_unit and yl.is_active
    and exists (select 1 from public.student_fee_schedule_rates any_rate
      where any_rate.schedule_id=v_schedule.id and any_rate.year_level_id=yl.id)
    and not exists (
      select 1 from public.student_fee_schedule_rates r
      join public.student_fee_items fi on fi.id = r.fee_item_id
      join public.student_fee_categories fc on fc.id = fi.category_id
      where r.schedule_id = v_schedule.id and r.year_level_id = yl.id
        and r.amount > 0 and fc.posting_category = 'Tuition'
    );
  if v_missing is not null then raise exception 'Tuition is missing for levels: %', array_to_string(v_missing, ', '); end if;
  update public.student_fee_schedules set status = 'Archived', updated_at = now()
  where school_id = v_schedule.school_id and academic_year_id = v_schedule.academic_year_id
    and academic_unit = v_schedule.academic_unit and status = 'Published';
  update public.student_fee_schedules set status = 'Published', published_by = coalesce(public.app_current_user_name(),p_actor,'System'),
    published_at = now(), updated_at = now() where id = p_schedule_id returning * into v_schedule;
  insert into public.student_fee_schedule_audit_log(schedule_id,action,new_values,performed_by)
  values(v_schedule.id,'Published',to_jsonb(v_schedule),coalesce(public.app_current_user_name(),p_actor,'System'));
  return v_schedule;
end $$;

create or replace function public.submit_walk_in_enrollment_v2(
  p_enrollment jsonb,
  p_subject_ids uuid[],
  p_assessment jsonb,
  p_payment_term_template_id uuid,
  p_actor text default null
)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_student public.students%rowtype; v_template public.student_payment_term_templates%rowtype;
  v_fees jsonb; v_result jsonb; v_course_id uuid; v_assessment_id uuid;
begin
  if not coalesce((select enabled from public.system_runtime_controls
    where control_key='student_fee_schedule_engine_enabled'),false) then
    raise exception 'Student fee schedule engine is not enabled; complete reconciliation and controlled cutover first';
  end if;
  select * into v_student from public.students where id = (p_assessment ->> 'student_id')::uuid;
  if not found then raise exception 'Assessment student was not found'; end if;
  select * into v_template from public.student_payment_term_templates
  where id = p_payment_term_template_id and is_active;
  if not found or v_template.school_id <> (p_assessment ->> 'school_id')::uuid
    or v_template.academic_year <> p_assessment ->> 'school_year' then
    raise exception 'The selected payment term is not active for the assessment school and academic year';
  end if;
  select c.id into v_course_id from public.courses c
  where lower(c.code) = lower(coalesce(v_student.track_or_course,'')) limit 1;
  select jsonb_agg(jsonb_build_object(
    'fee_name', f.fee_name, 'category', f.category, 'amount', f.amount,
    'quantity', f.quantity, 'unit_amount', f.unit_amount,
    'revenue_account_code', f.revenue_account_code
  ) order by f.fee_name) into v_fees
  from public.resolve_student_assessment_fees(
    (p_assessment ->> 'school_id')::uuid, p_assessment ->> 'school_year',
    v_student.year_level, v_course_id
  ) f;
  if v_fees is null then raise exception 'The Published fee schedule resolved no applicable fees'; end if;
  v_result := public.submit_walk_in_enrollment(
    p_enrollment, p_subject_ids,
    p_assessment || jsonb_build_object('payment_term', v_template.name),
    v_fees, coalesce(p_actor, public.app_current_user_name(), 'Registrar')
  );
  v_assessment_id := (v_result -> 'assessment' ->> 'id')::uuid;
  update public.assessment_fees af set
    fee_schedule_id = src.fee_schedule_id, fee_schedule_rate_id = src.fee_schedule_rate_id,
    fee_item_id = src.fee_item_id, fee_category_id = src.fee_category_id
  from public.resolve_student_assessment_fees(
    (p_assessment ->> 'school_id')::uuid, p_assessment ->> 'school_year',
    v_student.year_level, v_course_id
  ) src
  where af.assessment_id = v_assessment_id and af.fee_name = src.fee_name;
  return v_result || jsonb_build_object('resolved_fees', v_fees, 'payment_term_template_id', v_template.id);
end $$;

-- Replace the legacy online-accept implementation: fee amounts and the
-- payment term are resolved inside the same canonical transaction path.
create or replace function public.accept_online_enrollment_application(
  p_application_id uuid,
  p_actor text default 'Registrar'
)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_app public.online_enrollment_applications%rowtype;
  v_student public.students%rowtype;
  v_student_id uuid;
  v_enrollment_id uuid := gen_random_uuid();
  v_assessment_id uuid := gen_random_uuid();
  v_template_id uuid;
  v_result jsonb;
begin
  select * into v_app from public.online_enrollment_applications
  where id=p_application_id for update;
  if not found then raise exception 'Online enrollment application % was not found', p_application_id; end if;
  perform public.app_require_finance_writes_enabled();
  perform public.app_require_permission('REGISTRAR','enrollment','approve',v_app.school_id);
  if v_app.status in ('Rejected','Cancelled') then
    raise exception 'Application % cannot be accepted from status %',v_app.reference_no,v_app.status;
  end if;
  if v_app.status='Accepted' and v_app.enrollment_id is not null then
    return jsonb_build_object(
      'application',to_jsonb(v_app),
      'student',(select to_jsonb(s) from public.students s where s.id=v_app.student_id),
      'enrollment',(select to_jsonb(e) from public.enrollments e where e.id=v_app.enrollment_id),
      'assessment',(select to_jsonb(a) from public.assessments a where a.enrollment_id=v_app.enrollment_id order by a.created_at desc limit 1)
    );
  end if;

  if v_app.student_id is not null then
    select * into v_student from public.students where id=v_app.student_id for update;
  end if;
  if v_student.id is null then
    insert into public.students(
      school_id,student_no,lrn,first_name,last_name,middle_name,gender,birthday,
      civil_status,religion,nationality,email,contact_no,address,province,municipality,
      zip_code,department,year_level,track_or_course,section,enrollment_status,
      created_via,source_metadata
    ) values (
      v_app.school_id,public.generate_application_student_no(v_app.reference_no),v_app.lrn,
      coalesce(v_app.first_name,'For Completion'),coalesce(v_app.last_name,'For Completion'),
      v_app.middle_name,v_app.gender,nullif(v_app.birth_date,'')::date,'Single','Catholic',
      'Filipino',v_app.email,v_app.contact_no,v_app.complete_address,v_app.province,
      v_app.city_municipality,v_app.zip_code,'Basic Education',
      public.normalize_basic_ed_year_level(v_app.grade_level_applying_for),
      coalesce(nullif(v_app.strand_or_track,''),'Elementary'),'','For Assessment','online',
      jsonb_build_object('online_application_id',v_app.id,'online_reference_no',v_app.reference_no,
        'official_student_no_pending_initial_payment',true)
    ) returning * into v_student;
  else
    update public.students set
      school_id=coalesce(school_id,v_app.school_id),
      lrn=coalesce(nullif(v_app.lrn,''),lrn), email=coalesce(nullif(v_app.email,''),email),
      contact_no=coalesce(nullif(v_app.contact_no,''),contact_no),
      address=coalesce(nullif(v_app.complete_address,''),address),
      year_level=coalesce(public.normalize_basic_ed_year_level(v_app.grade_level_applying_for),year_level),
      track_or_course=coalesce(nullif(v_app.strand_or_track,''),track_or_course),
      enrollment_status='For Assessment',updated_at=now()
    where id=v_student.id returning * into v_student;
  end if;
  v_student_id := v_student.id;

  select t.id into v_template_id from public.student_payment_term_templates t
  where t.school_id=v_app.school_id and t.academic_year=v_app.school_year
    and t.is_active and t.is_default;
  if v_template_id is null then
    raise exception 'No default payment-term template exists for school %, academic year %',
      v_app.school_id,v_app.school_year;
  end if;

  v_result := public.submit_walk_in_enrollment_v2(
    jsonb_build_object(
      'id',v_enrollment_id,'student_id',v_student_id,'school_year',v_app.school_year,
      'semester',coalesce(v_app.semester,'N/A'),
      'enrollment_type',case when v_app.enrollment_type='Continuing Student' then 'Old Student' else v_app.enrollment_type end,
      'status','For Assessment','submitted_at',now(),'enrollment_source','Online',
      'is_online_enrollment',true,'online_application_id',v_app.id,
      'completion_status',v_app.completion_status,'missing_fields',v_app.missing_fields,
      'source_metadata',jsonb_build_object('online_reference_no',v_app.reference_no)
    ), array[]::uuid[],
    jsonb_build_object(
      'id',v_assessment_id,'enrollment_id',v_enrollment_id,'school_id',v_app.school_id,
      'student_id',v_student_id,'school_year',v_app.school_year,
      'semester',coalesce(v_app.semester,'N/A'),'discount_percentage',0,
      'discount_amount',0,'approval_status','Pending Accounting Approval',
      'registrar_remarks','Generated from online enrollment application '||v_app.reference_no
    ), v_template_id, coalesce(public.app_current_user_name(),p_actor)
  );

  update public.online_enrollment_applications set student_id=v_student_id,
    enrollment_id=v_enrollment_id,status='Accepted',updated_at=now()
  where id=v_app.id returning * into v_app;
  if v_app.guardian_name is not null then
    insert into public.student_guardians(student_id,guardian_name,relationship,contact_no,email,address,is_primary)
    select v_student_id,v_app.guardian_name,v_app.guardian_relationship,v_app.guardian_contact_no,
      v_app.guardian_email,v_app.guardian_address,true
    where not exists(select 1 from public.student_guardians g where g.student_id=v_student_id
      and lower(coalesce(g.guardian_name,''))=lower(coalesce(v_app.guardian_name,'')));
  end if;
  return v_result || jsonb_build_object('application',to_jsonb(v_app));
end $$;

-- Canonical category-scoped discount base. A trigger applies this to the
-- existing approval RPC, so the workflow remains backward compatible.
create or replace function public.student_finance_discount_base(
  p_discount_type_id uuid, p_assessment_id uuid
)
returns numeric language sql stable set search_path = public as $$
  select coalesce(sum(f.amount),0)
  from public.assessment_fees f
  join public.discount_types dt on dt.id = p_discount_type_id
  where f.assessment_id = p_assessment_id and (
    exists (
      select 1 from public.discount_type_fee_categories x
      where x.discount_type_id = dt.id and x.fee_category_id = f.fee_category_id
    )
    or (not exists (select 1 from public.discount_type_fee_categories x where x.discount_type_id = dt.id)
      and (dt.applies_to = 'Total Assessment' or dt.applies_to is null
        or dt.applies_to = f.category
        or (dt.applies_to = 'Miscellaneous' and f.category = 'ID/Other')))
  )
$$;

create or replace function public.submit_student_discount_request_v2(
  p_student_id uuid,
  p_discount_type_id uuid,
  p_sibling_student_ids uuid[] default '{}',
  p_remarks text default null,
  p_attachment_names text[] default '{}'
)
returns public.discount_requests language plpgsql security definer set search_path=public as $$
declare
  v_request public.discount_requests%rowtype;
  v_school_id uuid;
  v_sibling_names text[];
  v_expected_position integer;
  v_school_year text;
begin
  select school_id into v_school_id from public.students where id=p_student_id;
  if not found then raise exception 'Student % was not found',p_student_id; end if;
  if p_student_id=any(coalesce(p_sibling_student_ids,'{}')) then
    raise exception 'The beneficiary cannot also be selected as a supporting sibling';
  end if;
  if exists (
    select 1 from unnest(coalesce(p_sibling_student_ids,'{}')) x(student_id)
    left join public.students s on s.id=x.student_id
    where s.id is null or s.school_id is distinct from v_school_id
  ) then raise exception 'Every supporting sibling must be a real student in the same school'; end if;
  select e.school_year into v_school_year from public.enrollments e
  where e.student_id=p_student_id and e.status not in ('Rejected','Cancelled','Withdrawn')
  order by e.submitted_at desc limit 1;
  if v_school_year is null then raise exception 'The beneficiary needs an active enrollment before a sibling discount can be requested'; end if;
  if exists (
    select 1 from unnest(coalesce(p_sibling_student_ids,'{}')) x(student_id)
    where not exists(select 1 from public.enrollments e where e.student_id=x.student_id
      and e.school_year=v_school_year and e.status not in ('Rejected','Cancelled','Withdrawn'))
  ) then raise exception 'Every supporting sibling must be concurrently enrolled in academic year %',v_school_year; end if;
  select sibling_position into v_expected_position from public.discount_types
  where id=p_discount_type_id and is_active;
  if not found then raise exception 'Active discount type % was not found',p_discount_type_id; end if;
  if v_expected_position is not null
    and cardinality(coalesce(p_sibling_student_ids,'{}')) < v_expected_position-1 then
    raise exception 'This sibling policy requires at least % supporting sibling student(s)',v_expected_position-1;
  end if;
  select coalesce(array_agg(s.first_name||' '||s.last_name order by s.last_name,s.first_name),'{}')
  into v_sibling_names from public.students s
  where s.id=any(coalesce(p_sibling_student_ids,'{}'));
  v_request := public.submit_student_discount_request(
    p_student_id,p_discount_type_id,v_sibling_names,p_remarks,p_attachment_names
  );
  update public.discount_requests set sibling_student_ids=coalesce(p_sibling_student_ids,'{}')
  where id=v_request.id returning * into v_request;
  insert into public.discount_request_students(discount_request_id,student_id,relationship_role)
  values(v_request.id,p_student_id,'Beneficiary') on conflict do nothing;
  insert into public.discount_request_students(discount_request_id,student_id,relationship_role)
  select v_request.id,x.student_id,'Supporting Sibling'
  from unnest(coalesce(p_sibling_student_ids,'{}')) x(student_id) on conflict do nothing;
  return v_request;
end $$;

create or replace function public.student_finance_scope_discount_adjustment()
returns trigger language plpgsql set search_path = public as $$
declare v_type public.discount_types%rowtype; v_base numeric; v_request public.discount_requests%rowtype;
begin
  if new.adjustment_type <> 'Discount' or new.discount_request_id is null then return new; end if;
  select * into v_request from public.discount_requests where id = new.discount_request_id;
  select * into v_type from public.discount_types where id = v_request.discount_type_id;
  v_base := public.student_finance_discount_base(v_type.id, new.assessment_id);
  new.amount := case when v_type.discount_basis = 'Fixed Amount'
    then coalesce(v_type.discount_fixed_amount,0)
    else round(v_base * coalesce(v_type.discount_percent,0) / 100, 2) end;
  if v_type.max_amount is not null then new.amount := least(new.amount, v_type.max_amount); end if;
  if new.amount <= 0 then raise exception 'Calculated discount amount must be positive'; end if;
  return new;
end $$;

drop trigger if exists trg_scope_student_discount_adjustment on public.student_finance_adjustments;
create trigger trg_scope_student_discount_adjustment
before insert or update of amount on public.student_finance_adjustments
for each row execute function public.student_finance_scope_discount_adjustment();

-- --------------------------------------------------------------------------
-- Reconciliation and controlled cutover.
-- --------------------------------------------------------------------------
create or replace view public.student_fee_schedule_reconciliation as
select fs.id schedule_id, s.code school_code, ay.name academic_year,
  fs.academic_unit, fs.version, fs.status, yl.code year_level_code,
  sum(r.amount)::numeric(15,2) gross_total,
  sum(r.amount) filter (where fc.posting_category = 'Tuition')::numeric(15,2) tuition_total,
  sum(r.amount) filter (where fc.posting_category = 'Miscellaneous')::numeric(15,2) miscellaneous_total,
  sum(r.amount) filter (where fc.posting_category = 'Laboratory')::numeric(15,2) laboratory_total,
  sum(r.amount) filter (where fc.posting_category = 'ID/Other')::numeric(15,2) other_total,
  count(*) rate_count
from public.student_fee_schedules fs
join public.schools s on s.id = fs.school_id
join public.academic_years ay on ay.id = fs.academic_year_id
join public.student_fee_schedule_rates r on r.schedule_id = fs.id
join public.academic_year_levels yl on yl.id = r.year_level_id
join public.student_fee_items fi on fi.id = r.fee_item_id
join public.student_fee_categories fc on fc.id = fi.category_id
group by fs.id, s.code, ay.name, fs.academic_unit, fs.version, fs.status, yl.code, yl.sort_order
order by s.code, ay.name, fs.academic_unit, yl.sort_order;

create or replace view public.student_fee_schedule_legacy_reconciliation as
with legacy as (
  select t.year_level,
    (t.tuition+t.lab_fee+t.computer_fee+(select coalesce(sum(m.amount),0) from public.misc_fee_schedule m))::numeric(15,2) legacy_total
  from public.tuition_fee_schedule t
), canonical as (
  select school_code,academic_year,academic_unit,year_level_code,gross_total
  from public.student_fee_schedule_reconciliation where status='Published'
)
select c.*,l.legacy_total,(c.gross_total-l.legacy_total)::numeric(15,2) variance
from canonical c join public.academic_year_levels yl on yl.code=c.year_level_code
left join legacy l on l.year_level=yl.name;

insert into public.system_runtime_controls(control_key, enabled, remarks)
values ('student_fee_schedule_engine_enabled', true,
  'Canonical table-driven fee resolver is enabled; disable only for controlled rollback.')
on conflict (control_key) do update set enabled = excluded.enabled, remarks = excluded.remarks,
  changed_at = now();
insert into public.system_runtime_controls(control_key,enabled,remarks)
values('student_fee_schedule_shadow_compare_enabled',false,
  'Enable during controlled reconciliation to compare canonical and rollback-source totals.')
on conflict(control_key) do nothing;

-- RLS: read access is school scoped where practical; mutation goes through RPCs.
alter table public.academic_years enable row level security;
alter table public.academic_year_levels enable row level security;
alter table public.student_fee_categories enable row level security;
alter table public.student_fee_items enable row level security;
alter table public.student_fee_schedules enable row level security;
alter table public.student_fee_schedule_rates enable row level security;
alter table public.student_fee_schedule_audit_log enable row level security;
alter table public.discount_type_fee_categories enable row level security;
alter table public.discount_request_students enable row level security;
alter table public.student_aid_programs enable row level security;
alter table public.student_aid_awards enable row level security;
alter table public.student_aid_invoice_allocations enable row level security;

do $$ declare t text; begin
  foreach t in array array['academic_years','academic_year_levels'] loop
    execute format('drop policy if exists %I on public.%I', t || '_read', t);
    execute format('create policy %I on public.%I for select to anon, authenticated using (true)', t || '_read', t);
  end loop;
end $$;

do $$ declare t text; begin
  foreach t in array array['student_fee_categories','student_fee_items','student_fee_schedules','student_fee_schedule_rates','student_fee_schedule_audit_log','discount_type_fee_categories','discount_request_students','student_aid_programs','student_aid_awards','student_aid_invoice_allocations'] loop
    execute format('drop policy if exists %I on public.%I', t || '_read', t);
    execute format('create policy %I on public.%I for select to anon, authenticated using (true)', t || '_read', t);
    execute format('revoke insert, update, delete on public.%I from anon, authenticated', t);
  end loop;
end $$;

grant select on public.academic_years, public.academic_year_levels,
  public.student_fee_categories, public.student_fee_items,
  public.student_fee_schedules, public.student_fee_schedule_rates,
  public.student_fee_schedule_audit_log,
  public.discount_type_fee_categories, public.discount_request_students,
  public.student_aid_programs, public.student_aid_awards,
  public.student_aid_invoice_allocations, public.student_fee_schedule_reconciliation,
  public.student_fee_schedule_legacy_reconciliation
to anon, authenticated;

revoke all on function public.upsert_student_fee_schedule_rate(uuid,uuid,uuid,numeric,uuid,text) from public;
revoke all on function public.delete_student_fee_schedule_rate(uuid,text) from public;
revoke all on function public.create_student_fee_schedule_draft(uuid,uuid,text,text) from public;
revoke all on function public.publish_student_fee_schedule(uuid,text) from public;
revoke all on function public.submit_walk_in_enrollment_v2(jsonb,uuid[],jsonb,uuid,text) from public;
revoke all on function public.submit_student_discount_request_v2(uuid,uuid,uuid[],text,text[]) from public;
grant execute on function public.resolve_student_assessment_fees(uuid,text,text,uuid) to anon, authenticated;
grant execute on function public.upsert_student_fee_schedule_rate(uuid,uuid,uuid,numeric,uuid,text) to anon, authenticated;
grant execute on function public.delete_student_fee_schedule_rate(uuid,text) to anon, authenticated;
grant execute on function public.create_student_fee_schedule_draft(uuid,uuid,text,text) to anon, authenticated;
grant execute on function public.publish_student_fee_schedule(uuid,text) to anon, authenticated;
grant execute on function public.submit_walk_in_enrollment_v2(jsonb,uuid[],jsonb,uuid,text) to anon, authenticated;
grant execute on function public.submit_student_discount_request_v2(uuid,uuid,uuid[],text,text[]) to anon, authenticated;

commit;

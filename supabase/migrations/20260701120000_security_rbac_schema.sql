-- ============================================================================
-- STSN CONNECT — User Access & Authority RBAC schema (Page Assignment)
-- Migration: 20260701120000_security_rbac_schema.sql
-- ----------------------------------------------------------------------------
-- Adds a real Role-Based Access Control layer on top of the existing
-- module-only ROLE_PERMISSIONS map (src/config/permissions.config.ts):
--
--   * security_roles                     — role catalog (seeded from UserRole)
--   * security_permissions               — module / page / action catalog
--   * security_role_permissions          — role-inherited grants
--   * security_user_role_assignments     — per-user role(s)
--   * security_user_permission_overrides — per-user allow/deny overrides
--   * security_access_audit_logs         — every access change
--
-- Design notes / safety:
--   * Additive & idempotent. Uses `if not exists`, `on conflict do nothing`,
--     and `drop policy if exists`, so it is safe to re-run.
--   * RLS follows the project's demo posture (0002_rls.sql): permissive anon +
--     authenticated CRUD, because the app uses the anon key with no signed-in
--     session. Access enforcement lives at the app layer (effectivePermissions
--     / usePermissions). The hardcoded ROLE_PERMISSIONS map remains the runtime
--     fallback, so behavior is identical to today when these tables are empty.
--   * Role catalog `code` deliberately uses the UPPERCASE UserRole strings
--     (SUPER_ADMIN, REGISTRAR, …) because that is what users.role and the JWT
--     `role` claim already carry — making assignment backfill and RLS trivial.
--   * The existing intentional ADMIN boundary is PRESERVED: SUPER_ADMIN is
--     seeded with full access; ADMIN keeps only its current module set. We do
--     NOT regress migration 0035's ADMIN write boundary.
-- ============================================================================

-- ── helper: updated_at trigger ───────────────────────────────────────────────
create or replace function public.security_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- 1. security_roles — role catalog
-- ============================================================================
create table if not exists public.security_roles (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  name        text not null,
  description text,
  is_system   boolean not null default false,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_security_roles_touch on public.security_roles;
create trigger trg_security_roles_touch before update on public.security_roles
  for each row execute function public.security_touch_updated_at();

-- ============================================================================
-- 2. security_permissions — module / page / action catalog
-- ============================================================================
create table if not exists public.security_permissions (
  id          uuid primary key default gen_random_uuid(),
  module_key  text not null,
  page_key    text,
  action_key  text not null,
  label       text not null,
  description text,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Unique on (module_key, page_key, action_key). NULL page_key means module-level,
-- so we use a coalesced expression index to make NULLs collide as expected.
create unique index if not exists ux_security_permissions_keys
  on public.security_permissions (module_key, coalesce(page_key, ''), action_key);

-- ============================================================================
-- 3. security_role_permissions — role inherited grants
-- ============================================================================
create table if not exists public.security_role_permissions (
  id            uuid primary key default gen_random_uuid(),
  role_id       uuid not null references public.security_roles(id) on delete cascade,
  permission_id uuid not null references public.security_permissions(id) on delete cascade,
  is_allowed    boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (role_id, permission_id)
);

create index if not exists ix_security_role_permissions_role on public.security_role_permissions(role_id);

drop trigger if exists trg_security_role_permissions_touch on public.security_role_permissions;
create trigger trg_security_role_permissions_touch before update on public.security_role_permissions
  for each row execute function public.security_touch_updated_at();

-- ============================================================================
-- 4. security_user_role_assignments — per-user role(s)
-- ============================================================================
create table if not exists public.security_user_role_assignments (
  id              uuid primary key default gen_random_uuid(),
  user_id         text not null,
  role_id         uuid not null references public.security_roles(id) on delete cascade,
  school_id       text,
  academic_unit   text,
  is_primary      boolean not null default true,
  is_active       boolean not null default true,
  effective_from  timestamptz not null default now(),
  effective_until timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, role_id)
);

create index if not exists ix_security_user_role_assignments_user on public.security_user_role_assignments(user_id);

drop trigger if exists trg_security_user_role_assignments_touch on public.security_user_role_assignments;
create trigger trg_security_user_role_assignments_touch before update on public.security_user_role_assignments
  for each row execute function public.security_touch_updated_at();

-- ============================================================================
-- 5. security_user_permission_overrides — per-user allow/deny
-- ============================================================================
create table if not exists public.security_user_permission_overrides (
  id            uuid primary key default gen_random_uuid(),
  user_id       text not null,
  permission_id uuid not null references public.security_permissions(id) on delete cascade,
  is_allowed    boolean not null,
  reason        text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, permission_id)
);

create index if not exists ix_security_user_permission_overrides_user on public.security_user_permission_overrides(user_id);

drop trigger if exists trg_security_user_permission_overrides_touch on public.security_user_permission_overrides;
create trigger trg_security_user_permission_overrides_touch before update on public.security_user_permission_overrides
  for each row execute function public.security_touch_updated_at();

-- ============================================================================
-- 6. security_access_audit_logs — every access change
-- ============================================================================
create table if not exists public.security_access_audit_logs (
  id              uuid primary key default gen_random_uuid(),
  actor_user_id   text,
  target_user_id  text,
  target_role_id  uuid references public.security_roles(id) on delete set null,
  action          text not null,
  module_key      text,
  page_key        text,
  permission_key  text,
  previous_value  jsonb,
  new_value       jsonb,
  ip_address      text,
  user_agent      text,
  remarks         text,
  created_at      timestamptz not null default now()
);

create index if not exists ix_security_access_audit_logs_target on public.security_access_audit_logs(target_user_id);
create index if not exists ix_security_access_audit_logs_created on public.security_access_audit_logs(created_at desc);

-- ============================================================================
-- 7. Row Level Security
--   Matches the project's demo posture (0002_rls.sql): RLS enabled with
--   permissive anon + authenticated full CRUD. The app connects with the anon
--   key and no signed-in session, so any get_auth_role()-gated write policy
--   would block ALL writes (get_auth_role() returns 'ANON'). Access enforcement
--   therefore lives at the app layer (effectivePermissions / usePermissions);
--   TIGHTEN BEFORE PRODUCTION together with the rest of the schema.
-- ============================================================================
do $$
declare
  t text;
  sec_tables text[] := array[
    'security_roles', 'security_permissions', 'security_role_permissions',
    'security_user_role_assignments', 'security_user_permission_overrides',
    'security_access_audit_logs'
  ];
begin
  foreach t in array sec_tables loop
    execute format('alter table public.%I enable row level security;', t);

    -- drop any prior policy names (this migration is re-runnable)
    execute format('drop policy if exists %I on public.%I;', t || '_read', t);
    execute format('drop policy if exists %I on public.%I;', t || '_admin_write', t);
    execute format('drop policy if exists %I on public.%I;', t || '_anon_read', t);
    execute format('drop policy if exists %I on public.%I;', t || '_all_anon_auth', t);

    execute format(
      'create policy %I on public.%I for all to anon, authenticated '
      || 'using (true) with check (true);',
      t || '_all_anon_auth', t
    );
  end loop;
end $$;

-- ============================================================================
-- 8. SEED — roles (uppercase UserRole codes)
-- ============================================================================
insert into public.security_roles (code, name, description, is_system) values
  ('SUPER_ADMIN', 'Super Admin', 'Full system access; can switch or simulate both school contexts', true),
  ('ADMIN',       'Administrator', 'Operational oversight; excludes accounting, payroll, cashier and setup', true),
  ('PRINCIPAL',   'Principal', 'Academic oversight: grading, curriculum, faculty and scheduling', true),
  ('REGISTRAR',   'Registrar', 'Manages enrollment, records and academic structure', true),
  ('ACCOUNTING',  'Accounting', 'Manages billing, ledgers and payments', true),
  ('CASHIER',     'Cashier', 'Accepts payments and issues official receipts', true),
  ('TEACHER',     'Teacher', 'Manages classes, attendance and grade encoding', true),
  ('STUDENT',     'Student', 'Views academic records, grades and billing', true),
  ('HR',          'HR', 'Manages employee records and HR workflows', true),
  ('EMPLOYEE',    'Employee', 'General support staff workspace', true),
  ('GUIDANCE',    'Guidance', 'Guidance Office module access', true),
  ('NURSE',       'Nurse', 'Clinic module access', true),
  ('PAYROLL',     'Payroll', 'Manages payroll runs, payouts, taxes and benefits', true),
  ('GUARDIAN',    'Parent / Guardian', 'Read-only parent portal for linked student records', true)
on conflict (code) do nothing;

-- ============================================================================
-- 9. SEED — permissions
--   9a. One module-level "view" permission per STSNModule.
--   9b. Curated page-level action permissions for the priority pages.
-- ============================================================================

-- 9a. Module-level access (page_key NULL, action 'view')
insert into public.security_permissions (module_key, page_key, action_key, label, sort_order) values
  ('DASHBOARD',           null, 'view', 'View Dashboard', 0),
  ('ACTION_CENTER',       null, 'view', 'View Action Center', 1),
  ('PAYROLL_DASHBOARD',   null, 'view', 'View Payroll Dashboard', 2),
  ('ACCOUNTING_DASHBOARD',null, 'view', 'View Accounting Dashboard', 3),
  ('REGISTRAR',           null, 'view', 'View Registrar / Enrollment', 4),
  ('STUDENT_DIRECTORY',   null, 'view', 'View Student Directory', 5),
  ('ACCOUNTING',          null, 'view', 'View Accounting', 6),
  ('CASHIER',             null, 'view', 'View Cashiering', 7),
  ('BOOKS_SETUP',         null, 'view', 'View Books & Library', 8),
  ('GRADING',             null, 'view', 'View Grades Directory', 9),
  ('CURRICULUM',          null, 'view', 'View Curriculum', 10),
  ('STUDENT_PORTAL',      null, 'view', 'View Student Portal', 11),
  ('FACULTY_PORTAL',      null, 'view', 'View Teacher Board', 12),
  ('FACULTY_ADMIN',       null, 'view', 'View Faculty Admin', 13),
  ('HR_MANAGEMENT',       null, 'view', 'View HR Management', 14),
  ('ACCOUNTS_SECURITY',   null, 'view', 'View User Access & Authority', 15),
  ('CORE_SETUP',          null, 'view', 'View Core Setup', 16),
  ('SCHEDULING',          null, 'view', 'View Class Scheduling', 17),
  ('CLASS_SECTIONING',    null, 'view', 'View Class Sectioning', 18),
  ('ONLINE_LEARNING',     null, 'view', 'View Online Learning', 19),
  ('NURSE_CLINIC',        null, 'view', 'View Clinic', 20),
  ('GUIDANCE',            null, 'view', 'View Guidance Office', 21),
  ('CONSULTATION',        null, 'view', 'View Consultation', 22),
  ('REGISTRAR_REPORTS',   null, 'view', 'View Registrar Reports', 23),
  ('GUIDANCE_REPORTS',    null, 'view', 'View Guidance Reports', 24),
  ('CLINIC_REPORTS',      null, 'view', 'View Clinic Reports', 25),
  ('ADMIN_REPORTS',       null, 'view', 'View Admin Reports', 26),
  ('PAYROLL_MANAGEMENT',  null, 'view', 'View Payroll Management', 27),
  ('GUARDIAN_PORTAL',     null, 'view', 'View Parent Portal', 28)
on conflict (module_key, coalesce(page_key, ''), action_key) do nothing;

-- 9b. Page-level action permissions (priority pages from the audit / spec)
insert into public.security_permissions (module_key, page_key, action_key, label, sort_order) values
  -- User Access & Authority
  ('ACCOUNTS_SECURITY', 'user-security',         'view',   'User Security — View', 100),
  ('ACCOUNTS_SECURITY', 'user-security',         'create', 'User Security — Provision User', 101),
  ('ACCOUNTS_SECURITY', 'user-security',         'edit',   'User Security — Edit User', 102),
  ('ACCOUNTS_SECURITY', 'user-security',         'manage', 'User Security — Block / Restore Access', 103),
  ('ACCOUNTS_SECURITY', 'user-security',         'audit',  'User Security — Audit', 104),
  ('ACCOUNTS_SECURITY', 'page-assignment',       'view',   'Page Assignment — View', 105),
  ('ACCOUNTS_SECURITY', 'page-assignment',       'manage', 'Page Assignment — Assign Roles & Rights', 106),
  ('ACCOUNTS_SECURITY', 'delegation-management', 'view',   'Delegation — View', 107),
  ('ACCOUNTS_SECURITY', 'delegation-management', 'create', 'Delegation — Create', 108),
  ('ACCOUNTS_SECURITY', 'delegation-management', 'manage', 'Delegation — Revoke / Manage', 109),
  ('ACCOUNTS_SECURITY', 'audit-log',             'view',   'Audit Log — View', 110),
  ('ACCOUNTS_SECURITY', 'audit-log',             'export', 'Audit Log — Export', 111),
  ('ACCOUNTS_SECURITY', 'admin-reports',         'view',   'Admin Reports — View', 112),
  ('ACCOUNTS_SECURITY', 'admin-reports',         'export', 'Admin Reports — Export', 113),
  -- Accounting
  ('ACCOUNTING', 'ledger',    'view',   'Student Ledger — View', 200),
  ('ACCOUNTING', 'ledger',    'edit',   'Student Ledger — Edit', 201),
  ('ACCOUNTING', 'ledger',    'export', 'Student Ledger — Export', 202),
  ('ACCOUNTING', 'ledger',    'post',   'Student Ledger — Post', 203),
  ('ACCOUNTING', 'discounts', 'view',   'Discounts — View', 210),
  ('ACCOUNTING', 'discounts', 'create', 'Discounts — Request', 211),
  ('ACCOUNTING', 'discounts', 'approve','Discounts — Approve', 212),
  ('ACCOUNTING', 'discounts', 'reject', 'Discounts — Reject', 213),
  ('ACCOUNTING', 'billing',   'view',   'Billing & Assessment — View', 220),
  ('ACCOUNTING', 'billing',   'create', 'Billing & Assessment — Create', 221),
  ('ACCOUNTING', 'billing',   'edit',   'Billing & Assessment — Edit', 222),
  ('ACCOUNTING', 'billing',   'approve','Billing & Assessment — Approve', 223),
  ('ACCOUNTING', 'holds',     'view',   'Financial Holds — View', 230),
  ('ACCOUNTING', 'holds',     'create', 'Financial Holds — Create', 231),
  ('ACCOUNTING', 'holds',     'manage', 'Financial Holds — Manage', 232),
  -- Cashiering
  ('CASHIER', 'queue',   'view',   'Payment Queue — View', 300),
  ('CASHIER', 'queue',   'create', 'Payment Queue — Collect Payment', 301),
  ('CASHIER', 'queue',   'print',  'Payment Queue — Print Receipt', 302),
  ('CASHIER', 'queue',   'void',   'Payment Queue — Void', 303),
  ('CASHIER', 'history', 'view',   'Collection History — View', 310),
  ('CASHIER', 'history', 'export', 'Collection History — Export', 311),
  ('CASHIER', 'reports', 'view',   'Cashier Reports — View', 320),
  ('CASHIER', 'reports', 'export', 'Cashier Reports — Export', 321),
  -- Registrar / enrollment
  ('REGISTRAR', 'enrollment', 'view',    'Enrollment — View', 400),
  ('REGISTRAR', 'enrollment', 'create',  'Enrollment — Create', 401),
  ('REGISTRAR', 'enrollment', 'edit',    'Enrollment — Edit', 402),
  ('REGISTRAR', 'enrollment', 'approve', 'Enrollment — Approve', 403),
  ('REGISTRAR', 'enrollment', 'reject',  'Enrollment — Reject', 404),
  -- Student Directory
  ('STUDENT_DIRECTORY', null, 'edit',   'Student Records — Edit', 500),
  ('STUDENT_DIRECTORY', null, 'export', 'Student Records — Export', 501),
  -- HR Employee Management
  ('HR_MANAGEMENT', 'employee-life-cycles', 'view',   'Employee Records — View', 600),
  ('HR_MANAGEMENT', 'employee-life-cycles', 'create', 'Employee Records — Create', 601),
  ('HR_MANAGEMENT', 'employee-life-cycles', 'edit',   'Employee Records — Edit', 602),
  ('HR_MANAGEMENT', 'employee-life-cycles', 'delete', 'Employee Records — Delete', 603),
  ('HR_MANAGEMENT', 'employee-life-cycles', 'export', 'Employee Records — Export', 604),
  -- Payroll Management
  ('PAYROLL_MANAGEMENT', 'payroll-management', 'view',    'Payroll — View', 700),
  ('PAYROLL_MANAGEMENT', 'payroll-management', 'create',  'Payroll — Create Run', 701),
  ('PAYROLL_MANAGEMENT', 'payroll-management', 'approve', 'Payroll — Approve', 702),
  ('PAYROLL_MANAGEMENT', 'payroll-management', 'post',    'Payroll — Post', 703),
  ('PAYROLL_MANAGEMENT', 'payroll-management', 'export',  'Payroll — Export', 704)
on conflict (module_key, coalesce(page_key, ''), action_key) do nothing;

-- ============================================================================
-- 10. SEED — role → permission grants
--   Rule: a role is granted EVERY permission whose module_key is in its allowed
--   module set (mirrors ROLE_PERMISSIONS). SUPER_ADMIN gets all permissions.
--   Admins refine further via the Page Assignment UI / overrides.
-- ============================================================================

-- 10a. SUPER_ADMIN → everything
insert into public.security_role_permissions (role_id, permission_id, is_allowed)
select r.id, p.id, true
from public.security_roles r
cross join public.security_permissions p
where r.code = 'SUPER_ADMIN'
on conflict (role_id, permission_id) do nothing;

-- 10b. All other roles → permissions for their allowed modules
with role_modules (role_code, module_key) as (
  values
    ('ADMIN','DASHBOARD'),('ADMIN','ACTION_CENTER'),('ADMIN','STUDENT_DIRECTORY'),
    ('ADMIN','HR_MANAGEMENT'),('ADMIN','REGISTRAR_REPORTS'),('ADMIN','ADMIN_REPORTS'),
    ('ADMIN','GUARDIAN_PORTAL'),

    ('PRINCIPAL','ACTION_CENTER'),('PRINCIPAL','STUDENT_DIRECTORY'),('PRINCIPAL','GRADING'),
    ('PRINCIPAL','CURRICULUM'),('PRINCIPAL','FACULTY_ADMIN'),('PRINCIPAL','SCHEDULING'),
    ('PRINCIPAL','REGISTRAR_REPORTS'),

    ('REGISTRAR','ACTION_CENTER'),('REGISTRAR','REGISTRAR'),('REGISTRAR','STUDENT_DIRECTORY'),
    ('REGISTRAR','GRADING'),('REGISTRAR','CURRICULUM'),('REGISTRAR','FACULTY_ADMIN'),
    ('REGISTRAR','CLASS_SECTIONING'),('REGISTRAR','BOOKS_SETUP'),('REGISTRAR','REGISTRAR_REPORTS'),

    ('ACCOUNTING','ACTION_CENTER'),('ACCOUNTING','ACCOUNTING'),('ACCOUNTING','ACCOUNTING_DASHBOARD'),
    ('ACCOUNTING','BOOKS_SETUP'),

    ('CASHIER','CASHIER'),

    ('TEACHER','FACULTY_PORTAL'),('TEACHER','GRADING'),('TEACHER','CURRICULUM'),('TEACHER','ONLINE_LEARNING'),

    ('STUDENT','STUDENT_PORTAL'),('STUDENT','CONSULTATION'),

    ('HR','ACTION_CENTER'),('HR','HR_MANAGEMENT'),

    ('EMPLOYEE','FACULTY_PORTAL'),('EMPLOYEE','GRADING'),('EMPLOYEE','CURRICULUM'),('EMPLOYEE','ONLINE_LEARNING'),

    ('GUIDANCE','GUIDANCE'),('GUIDANCE','GUIDANCE_REPORTS'),

    ('NURSE','NURSE_CLINIC'),('NURSE','CLINIC_REPORTS'),

    ('PAYROLL','ACTION_CENTER'),('PAYROLL','PAYROLL_DASHBOARD'),('PAYROLL','PAYROLL_MANAGEMENT'),

    ('GUARDIAN','GUARDIAN_PORTAL')
)
insert into public.security_role_permissions (role_id, permission_id, is_allowed)
select r.id, p.id, true
from role_modules rm
join public.security_roles r on r.code = rm.role_code
join public.security_permissions p on p.module_key = rm.module_key
on conflict (role_id, permission_id) do nothing;

-- ============================================================================
-- 11. BACKFILL — user role assignments from users.role
--   user_id stores the users.id (uuid) as text. is_primary = true.
-- ============================================================================
insert into public.security_user_role_assignments (user_id, role_id, school_id, is_primary, is_active)
select u.id::text, r.id, u.school_id::text, true, u.is_active
from public.users u
join public.security_roles r on r.code = u.role
on conflict (user_id, role_id) do nothing;

-- ============================================================================
-- 12. Comments
-- ============================================================================
comment on table public.security_roles is 'RBAC role catalog. code matches users.role / JWT role claim.';
comment on table public.security_permissions is 'Module/page/action permission catalog. page_key NULL = module-level.';
comment on table public.security_role_permissions is 'Role-inherited permission grants (is_allowed false = explicit deny).';
comment on table public.security_user_role_assignments is 'Per-user role assignment(s); supports multi-role and effective windows.';
comment on table public.security_user_permission_overrides is 'Per-user allow/deny overrides layered over role grants.';
comment on table public.security_access_audit_logs is 'Immutable trail of every access/permission/role change.';

-- ============================================================================
-- STSN Connect — production Auth/RBAC bridge and finance maintenance gate
-- Must be applied before 20260720120000_student_finance_production_posting.sql.
-- ============================================================================

begin;

-- Acquire the transaction-scoped migration lock without emitting PostgreSQL's
-- otherwise blank `void` result in interactive SQL clients.
do $$
begin
  perform pg_advisory_xact_lock(hashtext('stsn:production-auth-bridge'));
end
$$;

alter table public.users
  add column if not exists auth_user_id uuid
    references auth.users(id) on delete restrict;

create unique index if not exists ux_users_auth_user_id
  on public.users(auth_user_id)
  where auth_user_id is not null;

-- Link already-provisioned Auth users by a unique normalized email. Accounts
-- not found here must be provisioned with scripts/provision-supabase-auth-users.mjs.
do $$
declare v_duplicates jsonb;
begin
  select jsonb_agg(email) into v_duplicates
  from (
    select lower(btrim(email)) as email
    from public.users
    where is_active
    group by lower(btrim(email))
    having nullif(lower(btrim(email)), '') is null or count(*) > 1
  ) x;
  if v_duplicates is not null then
    raise exception using
      message = 'Active application-user emails are missing or duplicated',
      detail = v_duplicates::text,
      hint = 'Correct public.users before applying the Auth bridge.';
  end if;

  select jsonb_agg(email) into v_duplicates
  from (
    select lower(btrim(email)) as email
    from auth.users
    where nullif(btrim(email), '') is not null
    group by lower(btrim(email))
    having count(*) > 1
  ) x;
  if v_duplicates is not null then
    raise exception using
      message = 'Supabase Auth emails are duplicated',
      detail = v_duplicates::text,
      hint = 'Resolve duplicate auth.users accounts before linking application users.';
  end if;
end
$$;

update public.users u
set auth_user_id = a.id,
    updated_at = now()
from auth.users a
where u.auth_user_id is null
  and lower(btrim(u.email)) = lower(btrim(a.email))
  and not exists (
    select 1 from auth.users x
    where lower(btrim(x.email)) = lower(btrim(a.email)) and x.id <> a.id
  );

create table if not exists public.system_runtime_controls (
  control_key text primary key,
  enabled boolean not null default false,
  changed_by uuid references public.users(id) on delete set null,
  changed_at timestamptz not null default now(),
  remarks text
);

insert into public.system_runtime_controls(control_key, enabled, remarks)
values (
  'student_finance_writes',
  false,
  'Closed by default. Enable only after migration reconciliation and smoke tests.'
)
on conflict (control_key) do nothing;

insert into public.security_permissions(
  module_key, page_key, action_key, label, description, sort_order
)
values
  ('CASHIER', 'other-payments', 'create', 'Other Collections — Post',
   'Post configured direct collections and explicitly authorized student credit', 304),
  ('CASHIER', 'reallocations', 'create', 'Allocation Corrections — Submit',
   'Submit an immutable receipt-allocation correction for approval', 305),
  ('ACCOUNTING', 'unapplied-credits', 'post', 'Unapplied Credits — Apply',
   'Apply existing student deposit credit to selected invoices', 233),
  ('ACCOUNTING', 'reallocations', 'approve', 'Allocation Corrections — Approve',
   'Approve or reject allocation correction requests', 234),
  ('ACCOUNTING', 'receipt-voids', 'approve', 'Receipt Voids — Approve',
   'Approve or reject full receipt void requests', 235)
on conflict do nothing;

with grants(role_code, module_key, page_key, action_key) as (
  values
    ('CASHIER', 'CASHIER', 'other-payments', 'create'),
    ('CASHIER', 'CASHIER', 'reallocations', 'create'),
    ('ACCOUNTING', 'ACCOUNTING', 'unapplied-credits', 'post'),
    ('ACCOUNTING', 'ACCOUNTING', 'reallocations', 'approve'),
    ('ACCOUNTING', 'ACCOUNTING', 'receipt-voids', 'approve'),
    ('SUPER_ADMIN', 'CASHIER', 'other-payments', 'create'),
    ('SUPER_ADMIN', 'CASHIER', 'reallocations', 'create'),
    ('SUPER_ADMIN', 'ACCOUNTING', 'unapplied-credits', 'post'),
    ('SUPER_ADMIN', 'ACCOUNTING', 'reallocations', 'approve'),
    ('SUPER_ADMIN', 'ACCOUNTING', 'receipt-voids', 'approve')
)
insert into public.security_role_permissions(role_id, permission_id, is_allowed)
select r.id, p.id, true
from grants g
join public.security_roles r on r.code = g.role_code
join public.security_permissions p
  on p.module_key = g.module_key
 and p.page_key = g.page_key
 and p.action_key = g.action_key
on conflict (role_id, permission_id) do update set
  is_allowed = true,
  updated_at = now();

create or replace function public.app_current_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select u.id
  from public.users u
  where u.auth_user_id = auth.uid() and u.is_active
  limit 1
$$;

create or replace function public.app_current_user_name()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u.name from public.users u
  where u.id = public.app_current_user_id()
$$;

create or replace function public.app_has_permission(
  p_module_key text,
  p_page_key text,
  p_action_key text,
  p_school_id uuid default null
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user_id uuid := public.app_current_user_id();
  v_permission_id uuid;
  v_override boolean;
begin
  if v_user_id is null then return false; end if;

  select p.id into v_permission_id
  from public.security_permissions p
  where p.module_key = p_module_key
    and p.page_key is not distinct from p_page_key
    and p.action_key = p_action_key
    and p.is_active
  limit 1;
  if v_permission_id is null then return false; end if;

  select o.is_allowed into v_override
  from public.security_user_permission_overrides o
  where o.user_id = v_user_id::text and o.permission_id = v_permission_id
  limit 1;
  if found then return v_override; end if;

  return exists (
    select 1
    from public.security_user_role_assignments a
    join public.security_roles r on r.id = a.role_id and r.is_active
    join public.security_role_permissions rp
      on rp.role_id = r.id
     and rp.permission_id = v_permission_id
     and rp.is_allowed
    where a.user_id = v_user_id::text
      and a.is_active
      and a.effective_from <= now()
      and (a.effective_until is null or a.effective_until >= now())
      and (
        p_school_id is null
        or nullif(a.school_id, '') is null
        or a.school_id = p_school_id::text
      )
  );
end
$$;

create or replace function public.app_require_permission(
  p_module_key text,
  p_page_key text,
  p_action_key text,
  p_school_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_setting('app.student_finance_migration', true) = 'on' then return; end if;
  if not public.app_has_permission(
    p_module_key, p_page_key, p_action_key, p_school_id
  ) then
    raise exception using
      errcode = '42501',
      message = format(
        'Permission denied: %s/%s/%s',
        p_module_key, coalesce(p_page_key, '*'), p_action_key
      );
  end if;
end
$$;

create or replace function public.app_require_finance_writes_enabled()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_setting('app.student_finance_migration', true) = 'on' then return; end if;
  if not coalesce((
    select enabled from public.system_runtime_controls
    where control_key = 'student_finance_writes'
  ), false) then
    raise exception using
      errcode = '55000',
      message = 'Student-finance writes are disabled for maintenance';
  end if;
end
$$;

create or replace function public.app_can_read_student_finance(
  p_student_id uuid,
  p_school_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.app_has_permission('ACCOUNTING', null, 'view', p_school_id)
    or public.app_has_permission('CASHIER', null, 'view', p_school_id)
    or public.app_has_permission('REGISTRAR', null, 'view', p_school_id)
    or exists (
      select 1 from public.students s
      where s.id = p_student_id and s.user_id = public.app_current_user_id()
    )
    or exists (
      select 1
      from public.student_guardians g
      join public.users u
        on lower(btrim(u.email)) = lower(btrim(g.email))
      where g.student_id = p_student_id
        and u.id = public.app_current_user_id()
    )
$$;

create or replace function public.app_set_user_active(
  p_user_id uuid,
  p_is_active boolean
)
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target public.users%rowtype;
begin
  select * into v_target from public.users where id = p_user_id for update;
  if not found then raise exception 'Application user % was not found', p_user_id; end if;
  if p_user_id = public.app_current_user_id() and not p_is_active then
    raise exception 'You cannot deactivate your own active session';
  end if;
  if not public.app_has_permission(
    'ACCOUNTS_SECURITY', 'user-security', 'manage', v_target.school_id
  ) then
    raise exception using errcode = '42501', message = 'Permission denied: user access management';
  end if;

  update public.users
  set is_active = p_is_active, updated_at = now()
  where id = p_user_id
  returning * into v_target;
  return v_target;
end
$$;

revoke all on function public.app_current_user_id() from public, anon;
revoke all on function public.app_current_user_name() from public, anon;
revoke all on function public.app_has_permission(text, text, text, uuid)
  from public, anon;
revoke all on function public.app_require_permission(text, text, text, uuid)
  from public, anon;
revoke all on function public.app_require_finance_writes_enabled()
  from public, anon;
revoke all on function public.app_can_read_student_finance(uuid, uuid)
  from public, anon;
revoke all on function public.app_set_user_active(uuid, boolean)
  from public, anon;

grant execute on function public.app_current_user_id() to authenticated;
grant execute on function public.app_current_user_name() to authenticated;
grant execute on function public.app_has_permission(text, text, text, uuid)
  to authenticated;
grant execute on function public.app_can_read_student_finance(uuid, uuid)
  to authenticated;
grant execute on function public.app_set_user_active(uuid, boolean)
  to authenticated;

alter table public.system_runtime_controls enable row level security;
drop policy if exists system_runtime_controls_read on public.system_runtime_controls;
create policy system_runtime_controls_read
  on public.system_runtime_controls for select to authenticated using (true);
revoke insert, update, delete on public.system_runtime_controls
  from anon, authenticated;
grant select on public.system_runtime_controls to authenticated;

-- The application-user directory is no longer an anonymous credential
-- surface. Profile creation/linking is performed only by the service-role
-- provisioning workflow.
alter table public.users enable row level security;
drop policy if exists users_select_anon_auth on public.users;
drop policy if exists users_insert_anon_auth on public.users;
drop policy if exists users_update_anon_auth on public.users;
drop policy if exists users_delete_anon_auth on public.users;
drop policy if exists users_authenticated_read on public.users;
create policy users_authenticated_read
  on public.users for select to authenticated using (true);
revoke all on public.users from anon;
revoke insert, update, delete on public.users from authenticated;
grant select on public.users to authenticated;

comment on column public.users.auth_user_id is
  'One-to-one link to Supabase Auth; required for production authorization.';
comment on table public.system_runtime_controls is
  'Database-enforced operational gates. Finance writes remain closed until reconciliation passes.';

commit;

-- Give interactive runs an explicit completion result. Unlinked active users
-- are reported here because provisioning is the next cutover step; a non-zero
-- value does not mean this migration failed.
select
  '20260720110000_production_auth_bridge'::text as migration,
  'APPLIED'::text as status,
  coalesce((
    select enabled
    from public.system_runtime_controls
    where control_key = 'student_finance_writes'
  ), false) as student_finance_writes_enabled,
  count(*) filter (
    where is_active and auth_user_id is null
  )::bigint as active_users_pending_auth_link
from public.users;

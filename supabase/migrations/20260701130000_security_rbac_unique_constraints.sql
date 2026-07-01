-- ============================================================================
-- STSN CONNECT — RBAC upsert unique constraints (Page Assignment fix)
-- Migration: 20260701130000_security_rbac_unique_constraints.sql
-- ----------------------------------------------------------------------------
-- Guarantees the natural-key UNIQUE constraints the Page Assignment / User
-- Access save flow relies on for clean upserts.
--
-- Why this is needed:
--   20260701120000_security_rbac_schema.sql declares these constraints INLINE
--   inside `create table if not exists`. If any of those tables already existed
--   (from an earlier partial run or manual setup), the inline constraint is
--   NEVER added retroactively — `create table if not exists` is a no-op for an
--   existing table. Without the constraint, PostgREST upserts that specify
--   `on_conflict = (role_id, permission_id)` etc. fail at runtime with
--   42P10 ("no unique or exclusion constraint matching the ON CONFLICT
--   specification"), so role/permission saves silently do not persist.
--
-- The role_permission save path itself was additionally hardened at the app
-- layer (securityPermissionService.setRolePermission now does an explicit
-- lookup + update/insert), so it no longer depends on this constraint. This
-- migration restores the constraint for the sibling upserts that still use
-- ON CONFLICT (assignUserRole, setUserOverride) and enforces uniqueness at the
-- database level as originally intended.
--
-- Safety: additive, idempotent, re-runnable. Each block de-duplicates any
-- existing rows (keeping the most recently updated) before adding the
-- constraint, and skips the ADD when an equivalent unique constraint already
-- exists (checked order-independently against the target columns).
-- ============================================================================

-- ── security_role_permissions: unique (role_id, permission_id) ───────────────
do $$
begin
  if to_regclass('public.security_role_permissions') is not null then
    -- collapse any pre-existing duplicates, keeping the newest row
    delete from public.security_role_permissions a
    using public.security_role_permissions b
    where a.role_id = b.role_id
      and a.permission_id = b.permission_id
      and (a.updated_at, a.id) < (b.updated_at, b.id);

    if not exists (
      select 1 from pg_constraint c
      where c.conrelid = 'public.security_role_permissions'::regclass
        and c.contype = 'u'
        and (select array(select unnest(c.conkey) order by 1)) = (
          select array(
            select a.attnum from pg_attribute a
            where a.attrelid = 'public.security_role_permissions'::regclass
              and a.attname in ('role_id', 'permission_id')
            order by 1
          )
        )
    ) then
      alter table public.security_role_permissions
        add constraint uq_security_role_permissions_role_perm unique (role_id, permission_id);
    end if;
  end if;
end $$;

-- ── security_user_role_assignments: unique (user_id, role_id) ────────────────
do $$
begin
  if to_regclass('public.security_user_role_assignments') is not null then
    delete from public.security_user_role_assignments a
    using public.security_user_role_assignments b
    where a.user_id = b.user_id
      and a.role_id = b.role_id
      and (a.updated_at, a.id) < (b.updated_at, b.id);

    if not exists (
      select 1 from pg_constraint c
      where c.conrelid = 'public.security_user_role_assignments'::regclass
        and c.contype = 'u'
        and (select array(select unnest(c.conkey) order by 1)) = (
          select array(
            select a.attnum from pg_attribute a
            where a.attrelid = 'public.security_user_role_assignments'::regclass
              and a.attname in ('user_id', 'role_id')
            order by 1
          )
        )
    ) then
      alter table public.security_user_role_assignments
        add constraint uq_security_user_role_assignments_user_role unique (user_id, role_id);
    end if;
  end if;
end $$;

-- ── security_user_permission_overrides: unique (user_id, permission_id) ───────
do $$
begin
  if to_regclass('public.security_user_permission_overrides') is not null then
    delete from public.security_user_permission_overrides a
    using public.security_user_permission_overrides b
    where a.user_id = b.user_id
      and a.permission_id = b.permission_id
      and (a.updated_at, a.id) < (b.updated_at, b.id);

    if not exists (
      select 1 from pg_constraint c
      where c.conrelid = 'public.security_user_permission_overrides'::regclass
        and c.contype = 'u'
        and (select array(select unnest(c.conkey) order by 1)) = (
          select array(
            select a.attnum from pg_attribute a
            where a.attrelid = 'public.security_user_permission_overrides'::regclass
              and a.attname in ('user_id', 'permission_id')
            order by 1
          )
        )
    ) then
      alter table public.security_user_permission_overrides
        add constraint uq_security_user_permission_overrides_user_perm unique (user_id, permission_id);
    end if;
  end if;
end $$;

-- ============================================================================
-- Permissive RLS policies (anon + authenticated full CRUD)
-- ----------------------------------------------------------------------------
-- Root cause of "manual SQL grants the row but the Page Assignment UI does not":
-- the SQL editor runs privileged and BYPASSES RLS, while the app writes with the
-- anon key THROUGH RLS. If any security_* table has RLS enabled but no permissive
-- policy (e.g. the table was created manually / partially without section 7 of
-- 20260701120000), anon writes silently fail — an UPDATE matches 0 rows with no
-- error and an INSERT is rejected — so the save never persists even though the
-- unique constraint and the upsert are correct.
--
-- This restores the project's documented demo posture (0002_rls.sql /
-- 20260701120000 §7): RLS enabled with permissive anon + authenticated CRUD.
-- Access enforcement stays at the app layer (usePermissions / effectivePermissions).
-- TIGHTEN BEFORE PRODUCTION together with the rest of the schema.
-- Idempotent and re-runnable; skips any table that does not exist.
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
    if to_regclass('public.' || t) is null then
      continue;
    end if;

    execute format('alter table public.%I enable row level security;', t);

    -- drop any prior policy names so this block is re-runnable
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

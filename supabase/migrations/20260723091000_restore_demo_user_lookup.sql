-- ============================================================================
-- STSN Connect — restore legacy demo user lookup
--
-- The unreleased project still uses the original client-side demo login:
--   public.users.email + password123
--
-- Keep the production Auth bridge columns/functions in place for finance RPCs,
-- but restore anonymous read access to public.users so the legacy login screen
-- can populate and select active accounts like it did before.
-- ============================================================================

begin;

grant usage on schema public to anon, authenticated;

alter table public.users enable row level security;

drop policy if exists users_authenticated_read on public.users;
drop policy if exists users_select_anon_auth on public.users;

create policy users_select_anon_auth
  on public.users for select to anon, authenticated using (true);

revoke insert, update, delete on public.users from anon, authenticated;
grant select on public.users to anon, authenticated;

comment on policy users_select_anon_auth on public.users is
  'Temporary unreleased/demo compatibility: old login needs public.users email lookup. Writes remain blocked.';

commit;

select
  '20260723091000_restore_demo_user_lookup'::text as migration,
  has_table_privilege('anon', 'public.users', 'select') as anon_can_select_users,
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'users'
      and policyname = 'users_select_anon_auth'
  ) as users_select_policy_exists;

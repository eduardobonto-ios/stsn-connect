-- ============================================================================
-- STSN Connect — Production Auth Bridge UI User Validation
-- Run after 20260720110000_production_auth_bridge.sql and user provisioning.
--
-- Expected result: every row has passed = true.
-- This script is read-only and safe to run in Supabase SQL Editor.
-- ============================================================================

begin transaction read only;

with issues as (
  select
    'ACTIVE_USER_WITHOUT_AUTH_LINK'::text as issue,
    count(*)::bigint as issue_count
  from public.users
  where is_active and auth_user_id is null

  union all

  select
    'AUTH_EMAIL_LINK_MISMATCH',
    count(*)::bigint
  from public.users u
  join auth.users a on a.id = u.auth_user_id
  where lower(btrim(u.email)) <> lower(btrim(a.email))

  union all

  select
    'DUPLICATE_ACTIVE_USER_EMAIL',
    count(*)::bigint
  from (
    select lower(btrim(email))
    from public.users
    where is_active and nullif(btrim(email), '') is not null
    group by lower(btrim(email))
    having count(*) > 1
  ) x

  union all

  select
    'ACTIVE_USER_MISSING_EMAIL',
    count(*)::bigint
  from public.users
  where is_active and nullif(btrim(email), '') is null

  union all

  select
    'DUPLICATE_AUTH_EMAIL',
    count(*)::bigint
  from (
    select lower(btrim(email))
    from auth.users
    where nullif(btrim(email), '') is not null
    group by lower(btrim(email))
    having count(*) > 1
  ) x

  union all

  select
    'ACTIVE_USER_WITHOUT_AUTH_ACCOUNT',
    count(*)::bigint
  from public.users u
  where u.is_active
    and not exists (
      select 1
      from auth.users a
      where lower(btrim(a.email)) = lower(btrim(u.email))
    )
)
select
  issue,
  issue_count,
  (issue_count = 0) as passed
from issues
order by issue;

rollback;

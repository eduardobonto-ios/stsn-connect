-- ============================================================================
-- STSN CONNECT — De-duplicate stale security_* grant rows
-- Migration: 20260705130000_security_grants_dedupe.sql
-- ----------------------------------------------------------------------------
-- Prior to 20260701130000 (unique constraint fix), missing unique constraints
-- on security_role_permissions / security_user_role_assignments /
-- security_user_permission_overrides let some rows get inserted more than
-- once for the same natural key. computeEffectivePermissions() (and the
-- equivalent role/override resolution) does not dedupe by recency — a stale
-- is_allowed = false duplicate is treated as an explicit deny even when a
-- newer is_allowed = true row exists for the same key, permanently
-- suppressing that grant no matter how many times an admin re-enables it via
-- Page Assignment.
--
-- This migration removes those stale duplicates, keeping only the
-- most-recently-updated row per natural key (the admin's latest explicit
-- decision, not a hardcoded value). Additive/safe: a no-op wherever no
-- duplicates exist; never deletes the sole remaining row for a key.
-- ============================================================================

-- security_role_permissions: natural key (role_id, permission_id)
delete from public.security_role_permissions t
using (
  select id,
         row_number() over (
           partition by role_id, permission_id
           order by updated_at desc, id desc
         ) as rn
  from public.security_role_permissions
) ranked
where t.id = ranked.id
  and ranked.rn > 1;

-- security_user_role_assignments: natural key (user_id, role_id)
delete from public.security_user_role_assignments t
using (
  select id,
         row_number() over (
           partition by user_id, role_id
           order by updated_at desc, id desc
         ) as rn
  from public.security_user_role_assignments
) ranked
where t.id = ranked.id
  and ranked.rn > 1;

-- security_user_permission_overrides: natural key (user_id, permission_id)
delete from public.security_user_permission_overrides t
using (
  select id,
         row_number() over (
           partition by user_id, permission_id
           order by updated_at desc, id desc
         ) as rn
  from public.security_user_permission_overrides
) ranked
where t.id = ranked.id
  and ranked.rn > 1;

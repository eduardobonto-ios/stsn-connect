-- ============================================================================
-- STSN Connect — anon read access for the finance runtime kill-switch
--
-- Purpose: same anon-app-authz posture as 20260723140000 and 20260728090000.
--
-- 20260720110000_production_auth_bridge.sql created public.system_runtime_controls
-- and granted SELECT to `authenticated` ONLY (line 340: `grant select ... to
-- authenticated`). 20260723140000_app_controlled_finance_authz.sql updates the
-- row's `enabled` value to true, but never adds an anon grant — its table list
-- (lines 115-141) does not include system_runtime_controls.
--
-- The browser never establishes a Supabase Auth session (no
-- supabase.auth.signInWithPassword anywhere in src/), so every request runs as
-- `anon`. dataLoader.ts:1072-1077 reads this table with `.maybeSingle()` and
-- silently treats a permission-denied/empty result as `financeWritesEnabled =
-- false` (store.ts:748 defaults false too). Net effect: regardless of the
-- `enabled` column's actual value, the deployed app can NEVER see finance
-- writes as enabled, and every finance mutation (assessment submit/approve,
-- discount request, payment posting, enrollment closure) throws the
-- "maintenance mode" error client-side before any RPC call is even attempted.
--
-- This silently defeats the entire purpose of 20260723140000 section 4
-- ("Enable finance writes") for the anon-key browser posture the rest of that
-- migration is designed around. Confirmed by UAT run 2026-07-28_0525
-- (docs/uat/runs/2026-07-28_0525-full-enrollment-e2e), finding F-00.
--
-- ⚠️ SECURITY NOTE: identical caveat to 20260723140000 — read-only exposure of
-- a maintenance toggle carries negligible risk; the app UI remains the only
-- write gate.
--
-- Must be applied AFTER 20260720110000_production_auth_bridge.sql.
-- ============================================================================

begin;

do $$
begin
  perform pg_advisory_xact_lock(hashtext('stsn:finance-runtime-controls-anon-read'));
end
$$;

do $$
begin
  if to_regclass('public.system_runtime_controls') is null then
    raise exception using
      message = 'finance runtime controls anon read requires the auth bridge migration',
      hint = 'Apply 20260720110000_production_auth_bridge.sql first.';
  end if;
end
$$;

grant select on public.system_runtime_controls to anon;

drop policy if exists "system_runtime_controls_read_anon" on public.system_runtime_controls;
create policy "system_runtime_controls_read_anon"
  on public.system_runtime_controls
  for select
  to anon
  using (true);

commit;

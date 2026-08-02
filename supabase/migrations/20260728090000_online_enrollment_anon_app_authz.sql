-- ============================================================================
-- STSN Connect — app-controlled online-enrollment authorization
--
-- Purpose: same rationale as 20260723140000_app_controlled_finance_authz.sql —
-- the app calls Supabase from the browser with the public anon key and never
-- establishes a Supabase Auth session (no supabase.auth.signInWithPassword
-- anywhere in src/), so every request runs as Postgres role `anon`.
--
-- 20260726090000_online_enrollment_review_gate.sql introduced the Registrar
-- "Online Queue" review step, but scoped both of its dependencies to
-- `authenticated`:
--   - function public.accept_online_enrollment_application(uuid, text)
--   - RLS policies online_enrollment_applications_select_auth / _update_auth
--     (added earlier by 0030_online_enrollment_bridge.sql)
--
-- Result: for the browser-as-anon posture the rest of this app already runs
-- under, the Registrar's Online Queue tab renders no rows (RLS filters every
-- row for anon) and, even if a row were visible, clicking "Accept" throws
-- "permission denied for function accept_online_enrollment_application"
-- (caught and surfaced as a warning toast in RegistrarModulePage.tsx).
--
-- This migration extends the SAME anon-app-authz posture to the online
-- enrollment review objects. Confirmed by UAT run 2026-07-28_0525
-- (docs/uat/runs/2026-07-28_0525-full-enrollment-e2e), finding F-01.
--
-- ⚠️ SECURITY NOTE: identical caveat to 20260723140000 — the database
-- performs no authorization here for these objects either; the application
-- UI (Registrar role gate) is the only gate. When a real server/service-role
-- backend is introduced, reintroduce DB-side enforcement.
--
-- Must be applied AFTER:
--   0030_online_enrollment_bridge.sql
--   20260726090000_online_enrollment_review_gate.sql
-- ============================================================================

begin;

do $$
begin
  perform pg_advisory_xact_lock(hashtext('stsn:online-enrollment-anon-app-authz'));
end
$$;

-- Guard: the review-gate migration must already be present.
do $$
begin
  if to_regprocedure('public.accept_online_enrollment_application(uuid,text)') is null then
    raise exception using
      message = 'online-enrollment anon app authz requires the review-gate migration',
      hint = 'Apply 20260726090000_online_enrollment_review_gate.sql first.';
  end if;
end
$$;

-- ----------------------------------------------------------------------------
-- 1. Open the accept RPC (and the official-student-no issuance RPC it depends
--    on for consistency) to the anon role.
-- ----------------------------------------------------------------------------
do $$
declare
  v_fn text;
  v_fns text[] := array[
    'public.accept_online_enrollment_application(uuid, text)',
    'public.issue_official_student_no_if_eligible(uuid)'
  ];
begin
  foreach v_fn in array v_fns loop
    if to_regprocedure(v_fn) is not null then
      execute format('grant execute on function %s to anon', v_fn);
    end if;
  end loop;
end
$$;

-- ----------------------------------------------------------------------------
-- 2. Restore anon read/update access to online_enrollment_applications, the
--    same way 20260723140000 restored anon read access to the finance tables:
--    add a permissive `to anon` policy alongside the existing `to authenticated`
--    ones (RLS permissive policies combine with OR), so the future
--    authenticated model stays intact and this is easily reversed.
-- ----------------------------------------------------------------------------
grant select, update on public.online_enrollment_applications to anon;

drop policy if exists "online_enrollment_applications_select_anon" on public.online_enrollment_applications;
create policy "online_enrollment_applications_select_anon"
  on public.online_enrollment_applications
  for select
  to anon
  using (true);

drop policy if exists "online_enrollment_applications_update_anon" on public.online_enrollment_applications;
create policy "online_enrollment_applications_update_anon"
  on public.online_enrollment_applications
  for update
  to anon
  using (true)
  with check (true);

commit;

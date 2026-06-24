-- ============================================================================
-- STSN Connect - Registrar Student Import RLS Policies
-- ============================================================================
-- Purpose:
-- - Enable RLS for Registrar import/profile tables.
-- - Follow the current project development policy style from 0002_rls.sql and
--   0024_hr_module_rls.sql: anon + authenticated full CRUD.
--
-- Production note:
-- - Tighten these policies before production by limiting write access to
--   Registrar/Admin/Super Admin roles once Supabase Auth claims are finalized.
-- ============================================================================

alter table public.student_registrar_profiles enable row level security;

drop policy if exists "student_registrar_profiles_select" on public.student_registrar_profiles;
create policy "student_registrar_profiles_select"
  on public.student_registrar_profiles for select
  to anon, authenticated
  using (true);

drop policy if exists "student_registrar_profiles_insert" on public.student_registrar_profiles;
create policy "student_registrar_profiles_insert"
  on public.student_registrar_profiles for insert
  to anon, authenticated
  with check (true);

drop policy if exists "student_registrar_profiles_update" on public.student_registrar_profiles;
create policy "student_registrar_profiles_update"
  on public.student_registrar_profiles for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "student_registrar_profiles_delete" on public.student_registrar_profiles;
create policy "student_registrar_profiles_delete"
  on public.student_registrar_profiles for delete
  to anon, authenticated
  using (true);

alter table public.registrar_import_batches enable row level security;

drop policy if exists "registrar_import_batches_select" on public.registrar_import_batches;
create policy "registrar_import_batches_select"
  on public.registrar_import_batches for select
  to anon, authenticated
  using (true);

drop policy if exists "registrar_import_batches_insert" on public.registrar_import_batches;
create policy "registrar_import_batches_insert"
  on public.registrar_import_batches for insert
  to anon, authenticated
  with check (true);

drop policy if exists "registrar_import_batches_update" on public.registrar_import_batches;
create policy "registrar_import_batches_update"
  on public.registrar_import_batches for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "registrar_import_batches_delete" on public.registrar_import_batches;
create policy "registrar_import_batches_delete"
  on public.registrar_import_batches for delete
  to anon, authenticated
  using (true);

alter table public.registrar_import_rows enable row level security;

drop policy if exists "registrar_import_rows_select" on public.registrar_import_rows;
create policy "registrar_import_rows_select"
  on public.registrar_import_rows for select
  to anon, authenticated
  using (true);

drop policy if exists "registrar_import_rows_insert" on public.registrar_import_rows;
create policy "registrar_import_rows_insert"
  on public.registrar_import_rows for insert
  to anon, authenticated
  with check (true);

drop policy if exists "registrar_import_rows_update" on public.registrar_import_rows;
create policy "registrar_import_rows_update"
  on public.registrar_import_rows for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "registrar_import_rows_delete" on public.registrar_import_rows;
create policy "registrar_import_rows_delete"
  on public.registrar_import_rows for delete
  to anon, authenticated
  using (true);

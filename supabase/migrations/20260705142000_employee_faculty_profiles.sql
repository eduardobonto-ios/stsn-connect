-- ============================================================================
-- STSN CONNECT - Phase 2 employee faculty profiles
-- ----------------------------------------------------------------------------
-- Introduces a faculty-only extension table linked one-to-one with
-- public.employees and backfills it from bridged public.teachers rows.
--
-- This migration is intentionally scoped:
-- - only teachers with a resolved employee_id are backfilled
-- - no academic foreign keys are moved yet
-- - public.teachers remains the source of truth for legacy academic flows
--   until later phases cut over reads and writes
-- ============================================================================

create table if not exists public.employee_faculty_profiles (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  teacher_id uuid unique references public.teachers(id) on delete set null on update cascade,
  specialization text,
  advisory_section text,
  faculty_rank text,
  is_teaching_staff boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id)
);

create index if not exists idx_employee_faculty_profiles_employee
  on public.employee_faculty_profiles (employee_id, is_teaching_staff, created_at);

create index if not exists idx_employee_faculty_profiles_teacher
  on public.employee_faculty_profiles (teacher_id)
  where teacher_id is not null;

insert into public.employee_faculty_profiles (
  employee_id,
  teacher_id,
  specialization,
  advisory_section,
  is_teaching_staff
)
select
  t.employee_id,
  t.id,
  t.specialization,
  t.advisory_section,
  true
from public.teachers t
where t.employee_id is not null
on conflict (employee_id) do update set
  teacher_id = excluded.teacher_id,
  specialization = excluded.specialization,
  advisory_section = excluded.advisory_section,
  is_teaching_staff = excluded.is_teaching_staff,
  updated_at = now();

comment on table public.employee_faculty_profiles is
  'Faculty-only extension of public.employees for the teachers-to-employees consolidation. Preserves teaching metadata while academic tables are migrated away from public.teachers.';

comment on column public.employee_faculty_profiles.teacher_id is
  'Temporary legacy link back to public.teachers during the consolidation rollout. Remove after academic teacher-owned foreign keys are fully retired.';

alter table public.employee_faculty_profiles enable row level security;

drop policy if exists "employee_faculty_profiles_select_anon_auth" on public.employee_faculty_profiles;
create policy "employee_faculty_profiles_select_anon_auth"
  on public.employee_faculty_profiles for select
  to anon, authenticated
  using (true);

drop policy if exists "employee_faculty_profiles_insert_anon_auth" on public.employee_faculty_profiles;
create policy "employee_faculty_profiles_insert_anon_auth"
  on public.employee_faculty_profiles for insert
  to anon, authenticated
  with check (true);

drop policy if exists "employee_faculty_profiles_update_anon_auth" on public.employee_faculty_profiles;
create policy "employee_faculty_profiles_update_anon_auth"
  on public.employee_faculty_profiles for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "employee_faculty_profiles_delete_anon_auth" on public.employee_faculty_profiles;
create policy "employee_faculty_profiles_delete_anon_auth"
  on public.employee_faculty_profiles for delete
  to anon, authenticated
  using (true);

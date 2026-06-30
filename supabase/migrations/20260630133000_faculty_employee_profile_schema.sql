-- ============================================================================
-- Faculty / Employee reusable profile workspace support
-- - employee emergency/dependent contacts with richer notification metadata
-- - employee education background multi-entry records
-- - employee license / certification multi-entry records
-- Purely additive: no grading, attendance, payroll, or workflow logic changes.
-- ============================================================================

create table if not exists public.employee_profile_contacts (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  contact_type text not null
    check (contact_type in ('Spouse','Parent','Sibling','Relative','Emergency Contact','Other')),
  full_name text not null,
  relationship text,
  contact_no text,
  email text,
  address text,
  occupation text,
  is_primary_contact boolean not null default false,
  is_emergency_contact boolean not null default false,
  can_receive_notifications boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_employee_profile_contacts_employee
  on public.employee_profile_contacts (employee_id, sort_order, created_at);

alter table public.employee_profile_contacts enable row level security;

drop policy if exists "employee_profile_contacts_select_anon_auth" on public.employee_profile_contacts;
create policy "employee_profile_contacts_select_anon_auth"
  on public.employee_profile_contacts for select
  to anon, authenticated
  using (true);

drop policy if exists "employee_profile_contacts_insert_anon_auth" on public.employee_profile_contacts;
create policy "employee_profile_contacts_insert_anon_auth"
  on public.employee_profile_contacts for insert
  to anon, authenticated
  with check (true);

drop policy if exists "employee_profile_contacts_update_anon_auth" on public.employee_profile_contacts;
create policy "employee_profile_contacts_update_anon_auth"
  on public.employee_profile_contacts for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "employee_profile_contacts_delete_anon_auth" on public.employee_profile_contacts;
create policy "employee_profile_contacts_delete_anon_auth"
  on public.employee_profile_contacts for delete
  to anon, authenticated
  using (true);

create table if not exists public.employee_education_backgrounds (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  education_level text not null
    check (education_level in ('Elementary','Junior High School','Senior High School','College','Graduate Studies','Vocational','Other')),
  school_name text not null,
  school_address text,
  year_attended text,
  year_graduated text,
  degree_or_course text,
  major_or_specialization text,
  honors_or_awards text,
  prc_education_note text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_employee_education_backgrounds_employee
  on public.employee_education_backgrounds (employee_id, sort_order, created_at);

alter table public.employee_education_backgrounds enable row level security;

drop policy if exists "employee_education_backgrounds_select_anon_auth" on public.employee_education_backgrounds;
create policy "employee_education_backgrounds_select_anon_auth"
  on public.employee_education_backgrounds for select
  to anon, authenticated
  using (true);

drop policy if exists "employee_education_backgrounds_insert_anon_auth" on public.employee_education_backgrounds;
create policy "employee_education_backgrounds_insert_anon_auth"
  on public.employee_education_backgrounds for insert
  to anon, authenticated
  with check (true);

drop policy if exists "employee_education_backgrounds_update_anon_auth" on public.employee_education_backgrounds;
create policy "employee_education_backgrounds_update_anon_auth"
  on public.employee_education_backgrounds for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "employee_education_backgrounds_delete_anon_auth" on public.employee_education_backgrounds;
create policy "employee_education_backgrounds_delete_anon_auth"
  on public.employee_education_backgrounds for delete
  to anon, authenticated
  using (true);

create table if not exists public.employee_license_certifications (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  title text not null,
  license_number text,
  issuing_authority text,
  issued_at date,
  expires_at date,
  status text not null default 'Active'
    check (status in ('Active','Expired','Pending Renewal','Inactive')),
  notes text,
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_employee_license_certifications_employee
  on public.employee_license_certifications (employee_id, sort_order, created_at);

alter table public.employee_license_certifications enable row level security;

drop policy if exists "employee_license_certifications_select_anon_auth" on public.employee_license_certifications;
create policy "employee_license_certifications_select_anon_auth"
  on public.employee_license_certifications for select
  to anon, authenticated
  using (true);

drop policy if exists "employee_license_certifications_insert_anon_auth" on public.employee_license_certifications;
create policy "employee_license_certifications_insert_anon_auth"
  on public.employee_license_certifications for insert
  to anon, authenticated
  with check (true);

drop policy if exists "employee_license_certifications_update_anon_auth" on public.employee_license_certifications;
create policy "employee_license_certifications_update_anon_auth"
  on public.employee_license_certifications for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "employee_license_certifications_delete_anon_auth" on public.employee_license_certifications;
create policy "employee_license_certifications_delete_anon_auth"
  on public.employee_license_certifications for delete
  to anon, authenticated
  using (true);

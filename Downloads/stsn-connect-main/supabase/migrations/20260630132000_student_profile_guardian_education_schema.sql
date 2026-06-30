-- ============================================================================
-- Student Profile workspace support
-- - extends student_guardians for multi-entry profile management
-- - adds repeatable student_education_backgrounds records
-- Purely additive: no routing, role, or permission changes.
-- ============================================================================

alter table public.student_guardians
  add column if not exists guardian_type text,
  add column if not exists occupation text,
  add column if not exists is_emergency_contact boolean not null default false,
  add column if not exists can_receive_portal_notifications boolean not null default true;

update public.student_guardians
set guardian_type = case
  when guardian_type is not null then guardian_type
  when lower(coalesce(relationship, '')) = 'mother' then 'Mother'
  when lower(coalesce(relationship, '')) = 'father' then 'Father'
  when lower(coalesce(relationship, '')) in ('legal guardian', 'guardian') then 'Legal Guardian'
  when lower(coalesce(relationship, '')) = 'relative' then 'Relative'
  when lower(coalesce(relationship, '')) = 'emergency contact' then 'Emergency Contact'
  else 'Other'
end
where guardian_type is null;

create table if not exists public.student_education_backgrounds (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  education_level text not null,
  school_name text not null,
  school_address text,
  year_attended text,
  year_graduated text,
  degree_or_strand_or_course text,
  honors_or_awards text,
  last_grade_level_completed text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_education_backgrounds_level_check
    check (education_level in ('Elementary', 'Junior High School', 'Senior High School', 'College', 'Vocational', 'Other'))
);

create index if not exists idx_student_education_backgrounds_student
  on public.student_education_backgrounds (student_id, sort_order, created_at);

alter table public.student_education_backgrounds enable row level security;

drop policy if exists "student_education_backgrounds_select_anon_auth" on public.student_education_backgrounds;
create policy "student_education_backgrounds_select_anon_auth"
  on public.student_education_backgrounds for select
  to anon, authenticated
  using (true);

drop policy if exists "student_education_backgrounds_insert_anon_auth" on public.student_education_backgrounds;
create policy "student_education_backgrounds_insert_anon_auth"
  on public.student_education_backgrounds for insert
  to anon, authenticated
  with check (true);

drop policy if exists "student_education_backgrounds_update_anon_auth" on public.student_education_backgrounds;
create policy "student_education_backgrounds_update_anon_auth"
  on public.student_education_backgrounds for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "student_education_backgrounds_delete_anon_auth" on public.student_education_backgrounds;
create policy "student_education_backgrounds_delete_anon_auth"
  on public.student_education_backgrounds for delete
  to anon, authenticated
  using (true);

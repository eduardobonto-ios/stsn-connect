-- ============================================================================
-- STSN Connect - Guidance and Nurse role/user seed data
-- Adds module-scoped Guidance and Nurse roles plus demo users for both schools.
-- ============================================================================

update public.schools
set supported_roles = supported_roles
  || case when 'guidance' = any(supported_roles) then ARRAY[]::text[] else ARRAY['guidance']::text[] end
  || case when 'nurse' = any(supported_roles) then ARRAY[]::text[] else ARRAY['nurse']::text[] end
where legacy_id in ('STSN', 'CDSTA');

insert into public.setup_items
  (legacy_id, category, code, name, description, is_active, sort_order, metadata, created_by, created_at)
values
  ('role-guidance', 'roles_setup', 'GUIDANCE', 'Guidance Officer', 'Guidance Office module access only', true, 7, '{"level":5}'::jsonb, 'Admin Administrator', now()),
  ('role-nurse', 'roles_setup', 'NURSE', 'School Nurse', 'Clinic module access only', true, 8, '{"level":5}'::jsonb, 'Admin Administrator', now()),
  ('perm-guidance-module', 'permissions_setup', 'GUIDANCE_ACCESS', 'Access Guidance Office', 'Open and manage the Guidance Office module', true, 10, '{"module":"Guidance Office"}'::jsonb, 'Admin Administrator', now()),
  ('perm-clinic-module', 'permissions_setup', 'CLINIC_ACCESS', 'Access Clinic Module', 'Open and manage the Clinic module', true, 11, '{"module":"Clinic"}'::jsonb, 'Admin Administrator', now())
on conflict (category, code) do update
set
  name = excluded.name,
  description = excluded.description,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.users
  (legacy_id, school_id, email, name, role, is_active, avatar_url, department)
values
  ('user-guidance', (select id from public.schools where legacy_id = 'STSN'), 'guidance@stsn.edu.ph', 'Grace Villanueva, RGC', 'GUIDANCE', true, '', 'Support'),
  ('user-nurse', (select id from public.schools where legacy_id = 'STSN'), 'nurse@stsn.edu.ph', 'Nelia Santos, RN', 'NURSE', true, '', 'Support'),
  ('user-cdsta-guidance', (select id from public.schools where legacy_id = 'CDSTA'), 'guidance@cdsta.edu.ph', 'Angela Mercado, RGC', 'GUIDANCE', true, '', 'Support'),
  ('user-cdsta-nurse', (select id from public.schools where legacy_id = 'CDSTA'), 'nurse@cdsta.edu.ph', 'Rosa Navarro, RN', 'NURSE', true, '', 'Support')
on conflict (email) do update
set
  name = excluded.name,
  role = excluded.role,
  is_active = excluded.is_active,
  avatar_url = excluded.avatar_url,
  department = excluded.department,
  updated_at = now();

-- ============================================================================
-- STSN Connect - Payroll role/user seed data
-- Separates the Payroll module from HR. Adds a payroll-scoped role and
-- demo payroll users for both schools.
-- ============================================================================

update public.schools
set supported_roles = supported_roles
  || case when 'payroll' = any(supported_roles) then ARRAY[]::text[] else ARRAY['payroll']::text[] end
where legacy_id in ('STSN', 'CDSTA');

insert into public.setup_items
  (legacy_id, category, code, name, description, is_active, sort_order, metadata, created_by, created_at)
values
  ('role-payroll', 'roles_setup', 'PAYROLL', 'Payroll Officer', 'Payroll module access only', true, 9, '{"level":5}'::jsonb, 'Admin Administrator', now()),
  ('perm-payroll-module', 'permissions_setup', 'PAYROLL_ACCESS', 'Access Payroll Module', 'Open and manage the Payroll module', true, 12, '{"module":"Payroll"}'::jsonb, 'Admin Administrator', now())
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
  ('user-payroll', (select id from public.schools where legacy_id = 'STSN'), 'payroll@stsn.edu.ph', 'Maria Reyes', 'PAYROLL', true, '', 'Administration'),
  ('user-cdsta-payroll', (select id from public.schools where legacy_id = 'CDSTA'), 'payroll@cdsta.edu.ph', 'Lourdes Bautista', 'PAYROLL', true, '', 'Administration')
on conflict (email) do update
set
  name = excluded.name,
  role = excluded.role,
  is_active = excluded.is_active,
  avatar_url = excluded.avatar_url,
  department = excluded.department,
  updated_at = now();

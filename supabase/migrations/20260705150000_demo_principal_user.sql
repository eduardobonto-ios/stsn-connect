-- ============================================================================
-- STSN Connect - Demo Principal account
-- Adds one demo Principal employee + login for STSN, following the
-- employees -> users -> employees.user_id linking pattern already used for
-- teachers (see 20260705148000_demo_teacher_employee_bridge_cleanup.sql).
-- The PRINCIPAL role already exists in security_roles and
-- src/types/role.types.ts (canonical "principal"); this migration only adds
-- the demo employee/user rows, no schema or role/permission changes.
-- ============================================================================

-- 1. Employee record first (user_id linked in step 3 below).
insert into public.employees
  (legacy_id, school_id, first_name, last_name, middle_name, email, position,
   position_title, department, salary, status, leave_balance, contact, address,
   emergency_contact, employment_status)
values
  ('emp-principal',
   (select id from public.schools where legacy_id = 'STSN'),
   'Ramon', 'Aquino', 'Diaz',
   'principal@stsn.edu.ph',
   'School Principal', 'School Principal, Ed.D.', 'Administration',
   75000, 'Full-Time', 15,
   '+639171000104', '#20 Ilang-Ilang St., Novaliches, QC',
   'Teresa Aquino +639171000203',
   'Active')
on conflict (legacy_id) do update
set
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  middle_name = excluded.middle_name,
  position = excluded.position,
  position_title = excluded.position_title,
  department = excluded.department,
  salary = excluded.salary,
  status = excluded.status,
  leave_balance = excluded.leave_balance,
  contact = excluded.contact,
  address = excluded.address,
  emergency_contact = excluded.emergency_contact,
  employment_status = excluded.employment_status,
  updated_at = now();

-- 2. Login (users) record, role PRINCIPAL -> canonical "principal".
insert into public.users
  (legacy_id, school_id, email, name, role, is_active, avatar_url, department)
values
  ('user-principal',
   (select id from public.schools where legacy_id = 'STSN'),
   'principal@stsn.edu.ph',
   'Dr. Ramon Aquino, Ed.D.',
   'PRINCIPAL',
   true,
   '',
   'Administration')
on conflict (email) do update
set
  name = excluded.name,
  role = excluded.role,
  is_active = excluded.is_active,
  avatar_url = excluded.avatar_url,
  department = excluded.department,
  updated_at = now();

-- 3. Link the employee record to its login.
update public.employees
set user_id = (select id from public.users where legacy_id = 'user-principal')
where legacy_id = 'emp-principal';

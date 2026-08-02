-- Keep Accounting out of the Cashiering module during finance UAT. Earlier
-- voucher-oversight grants and live user overrides can otherwise expose the
-- entire Cashier workspace through the database-driven permission catalog.

begin;

do $$
begin
  perform pg_advisory_xact_lock(hashtext('stsn:accounting-cashier-separation'));
end
$$;

-- Restore the known demo Accounting identities. The STSN account was found
-- with users.role = CASHIER and simultaneous primary ACCOUNTING/CASHIER role
-- assignments, which made the UAT "Accounting" session a real Cashier.
update public.users
set role = 'ACCOUNTING', updated_at = now()
where lower(email) in ('accounting@stsn.edu.ph', 'accounting@cdsta.edu.ph');

update public.security_user_role_assignments assignment
set is_active = false,
    is_primary = false,
    updated_at = now()
from public.users u,
     public.security_roles r
where assignment.user_id = u.id::text
  and assignment.role_id = r.id
  and lower(u.email) in ('accounting@stsn.edu.ph', 'accounting@cdsta.edu.ph')
  and r.code = 'CASHIER';

insert into public.security_user_role_assignments(
  user_id, role_id, school_id, is_primary, is_active
)
select u.id::text, r.id, u.school_id::text, true, true
from public.users u
cross join public.security_roles r
where lower(u.email) in ('accounting@stsn.edu.ph', 'accounting@cdsta.edu.ph')
  and r.code = 'ACCOUNTING'
on conflict (user_id, role_id) do update
set school_id = excluded.school_id,
    is_primary = true,
    is_active = true,
    effective_from = now(),
    effective_until = null,
    updated_at = now();

update public.security_role_permissions rp
set is_allowed = false,
    updated_at = now()
from public.security_roles r,
     public.security_permissions p
where rp.role_id = r.id
  and rp.permission_id = p.id
  and r.code = 'ACCOUNTING'
  and p.module_key = 'CASHIER';

insert into public.security_user_permission_overrides(
  user_id, permission_id, is_allowed, reason
)
select distinct
  accounting_assignment.user_id,
  permission.id,
  false,
  'Temporary finance UAT separation of duties: Accounting cannot access Cashiering.'
from public.security_user_role_assignments accounting_assignment
join public.security_roles accounting_role
  on accounting_role.id = accounting_assignment.role_id
cross join public.security_permissions permission
where accounting_role.code = 'ACCOUNTING'
  and accounting_assignment.is_active
  and (accounting_assignment.effective_from is null or accounting_assignment.effective_from <= now())
  and (accounting_assignment.effective_until is null or accounting_assignment.effective_until >= now())
  and permission.module_key = 'CASHIER'
  and not exists (
    select 1
    from public.security_user_role_assignments elevated_assignment
    join public.security_roles elevated_role on elevated_role.id = elevated_assignment.role_id
    where elevated_assignment.user_id = accounting_assignment.user_id
      and elevated_assignment.is_active
      and (elevated_assignment.effective_from is null or elevated_assignment.effective_from <= now())
      and (elevated_assignment.effective_until is null or elevated_assignment.effective_until >= now())
      and elevated_role.code in ('CASHIER', 'SUPER_ADMIN')
  )
on conflict (user_id, permission_id) do update
set is_allowed = false,
    reason = excluded.reason,
    updated_at = now();

commit;

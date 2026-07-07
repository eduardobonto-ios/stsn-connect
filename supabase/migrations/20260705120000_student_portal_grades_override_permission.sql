-- ============================================================================
-- STSN CONNECT — Grade Financial Hold Override permission
-- Migration: 20260705120000_student_portal_grades_override_permission.sql
-- ----------------------------------------------------------------------------
-- Adds the missing action-level permission that gates the Student Portal
-- "grades" tab bypass/override control (previously ungated — visible to
-- students). Additive & idempotent, following the pattern established in
-- 20260701120000_security_rbac_schema.sql.
--
-- Grants go to internal roles only (REGISTRAR, ACCOUNTING, CASHIER, ADMIN).
-- SUPER_ADMIN already receives every permission via its wildcard cross-join
-- in the base RBAC migration. STUDENT intentionally receives NO grant here —
-- default-deny, consistent with how every other permission in this catalog
-- behaves when no security_role_permissions row exists for a role.
-- ============================================================================

-- ── Permission definition ────────────────────────────────────────────────────
insert into public.security_permissions (module_key, page_key, action_key, label, description, sort_order) values
  ('STUDENT_PORTAL', 'grades', 'manage', 'Override Grade Financial Hold',
   'Allows authorized internal users to release or bypass grade viewing restrictions for students with outstanding balances.',
   800)
on conflict (module_key, coalesce(page_key, ''), action_key) do nothing;

-- ── Role grants (internal roles only; STUDENT excluded by design) ──────────
with target_roles (role_code) as (
  values ('REGISTRAR'), ('ACCOUNTING'), ('CASHIER'), ('ADMIN')
)
insert into public.security_role_permissions (role_id, permission_id, is_allowed)
select r.id, p.id, true
from target_roles tr
join public.security_roles r on r.code = tr.role_code
join public.security_permissions p
  on p.module_key = 'STUDENT_PORTAL' and p.page_key = 'grades' and p.action_key = 'manage'
on conflict (role_id, permission_id) do nothing;

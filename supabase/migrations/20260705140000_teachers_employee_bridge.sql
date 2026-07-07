-- ============================================================================
-- STSN CONNECT - Phase 1 teachers -> employees bridge
-- ----------------------------------------------------------------------------
-- Adds a nullable bridge column from public.teachers to public.employees so the
-- consolidation can proceed incrementally without breaking existing academic
-- teacher-based foreign keys.
--
-- Backfill strategy in this migration:
-- 1. Match by user_id when that match is unique on the employee side.
-- 2. Fallback to normalized email when that match is unique on the employee
--    side and the teacher row is still unmapped.
--
-- This migration is intentionally conservative:
-- - it does not force a match when multiple employee candidates exist
-- - it does not add a uniqueness constraint yet
-- - it leaves unresolved rows null for manual review in later phases
-- ============================================================================

alter table public.teachers
  add column if not exists employee_id uuid
  references public.employees(id)
  on delete set null
  on update cascade;

create index if not exists idx_teachers_employee_id
  on public.teachers (employee_id)
  where employee_id is not null;

create index if not exists idx_teachers_user_id
  on public.teachers (user_id)
  where user_id is not null;

create index if not exists idx_employees_user_id
  on public.employees (user_id)
  where user_id is not null;

-- Stage 1: authoritative bridge by shared user account.
with unique_employee_user_matches as (
  select
    e.user_id,
    (array_agg(e.id))[1] as employee_id
  from public.employees e
  where e.user_id is not null
  group by e.user_id
  having count(*) = 1
)
update public.teachers t
set employee_id = um.employee_id
from unique_employee_user_matches um
where t.user_id = um.user_id
  and t.user_id is not null
  and t.employee_id is null;

-- Stage 2: fallback bridge by normalized email only when the employee-side
-- email candidate is unique. This keeps the migration additive and avoids
-- guessing across duplicate or stale HR rows.
with unique_employee_email_matches as (
  select
    lower(btrim(e.email)) as normalized_email,
    (array_agg(e.id))[1] as employee_id
  from public.employees e
  where e.email is not null
    and btrim(e.email) <> ''
  group by lower(btrim(e.email))
  having count(*) = 1
)
update public.teachers t
set employee_id = em.employee_id
from unique_employee_email_matches em
where lower(btrim(t.email)) = em.normalized_email
  and t.email is not null
  and btrim(t.email) <> ''
  and t.employee_id is null;

comment on column public.teachers.employee_id is
  'Phase 1 consolidation bridge to public.employees.id. Nullable during audit/backfill; do not enforce uniqueness until teacher-to-employee reconciliation is complete.';
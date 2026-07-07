-- ============================================================================
-- STSN CONNECT - Phase 3 attendance and consultation employee ownership
-- ----------------------------------------------------------------------------
-- Finishes the database-side teacher -> employee dual-key transition for the
-- remaining teacher-owned operational tables.
--
-- Scope in this migration:
-- - student_attendance.recorded_by_employee_id
-- - consultation_appointments.employee_id
--
-- Backfill strategy:
-- - copy ownership through public.teachers.employee_id
-- - preserve legacy teacher-owned columns for dual-read / validation
-- - leave unresolved rows null rather than force unsafe matches
-- ============================================================================

alter table public.student_attendance
  add column if not exists recorded_by_employee_id uuid references public.employees(id) on delete set null on update cascade;

alter table public.consultation_appointments
  add column if not exists employee_id uuid references public.employees(id) on delete set null on update cascade;

create index if not exists idx_student_attendance_recorded_by_employee_id
  on public.student_attendance (recorded_by_employee_id)
  where recorded_by_employee_id is not null;

create index if not exists idx_consult_employee
  on public.consultation_appointments (employee_id)
  where employee_id is not null;

update public.student_attendance sa
set recorded_by_employee_id = t.employee_id
from public.teachers t
where sa.recorded_by = t.id
  and sa.recorded_by is not null
  and t.employee_id is not null
  and sa.recorded_by_employee_id is null;

update public.consultation_appointments ca
set employee_id = t.employee_id
from public.teachers t
where ca.teacher_id = t.id
  and ca.teacher_id is not null
  and t.employee_id is not null
  and ca.employee_id is null;

comment on column public.student_attendance.recorded_by_employee_id is
  'Phase 3 employee-based replacement for student_attendance.recorded_by. Legacy teacher-based recorded_by remains temporarily for dual-read validation.';

comment on column public.consultation_appointments.employee_id is
  'Phase 3 employee-based replacement for consultation_appointments.teacher_id. Legacy teacher_id remains temporarily for dual-read validation.';

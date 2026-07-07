-- ============================================================================
-- STSN CONNECT - Phase 3 academic employee ownership columns
-- ----------------------------------------------------------------------------
-- Adds employee-based ownership columns alongside legacy teacher-based columns
-- for the highest-impact academic tables.
--
-- Scope in this migration:
-- - sections.adviser_employee_id
-- - class_schedules.employee_id
-- - subject_class_loads.employee_id
-- - grade_periods.employee_id
-- - grades.employee_id
-- - learning_materials.employee_id
--
-- Backfill strategy:
-- - copy ownership through public.teachers.employee_id
-- - leave rows null when a teacher row is still unresolved
-- - keep legacy teacher-based columns in place for dual-read / validation
-- ============================================================================

alter table public.sections
  add column if not exists adviser_employee_id uuid references public.employees(id) on delete set null on update cascade;

alter table public.class_schedules
  add column if not exists employee_id uuid references public.employees(id) on delete set null on update cascade;

alter table public.subject_class_loads
  add column if not exists employee_id uuid references public.employees(id) on delete set null on update cascade;

alter table public.grade_periods
  add column if not exists employee_id uuid references public.employees(id) on delete set null on update cascade;

alter table public.grades
  add column if not exists employee_id uuid references public.employees(id) on delete set null on update cascade;

alter table public.learning_materials
  add column if not exists employee_id uuid references public.employees(id) on delete set null on update cascade;

create index if not exists idx_sections_adviser_employee_id
  on public.sections (adviser_employee_id)
  where adviser_employee_id is not null;

create index if not exists idx_class_schedules_employee_id
  on public.class_schedules (employee_id)
  where employee_id is not null;

create index if not exists idx_subject_class_loads_employee_id
  on public.subject_class_loads (employee_id)
  where employee_id is not null;

create index if not exists idx_grade_periods_employee_id
  on public.grade_periods (employee_id)
  where employee_id is not null;

create index if not exists idx_grades_employee_id
  on public.grades (employee_id)
  where employee_id is not null;

create index if not exists idx_learning_materials_employee_id
  on public.learning_materials (employee_id)
  where employee_id is not null;

update public.sections s
set adviser_employee_id = t.employee_id
from public.teachers t
where s.adviser_id = t.id
  and s.adviser_id is not null
  and t.employee_id is not null
  and s.adviser_employee_id is null;

update public.class_schedules cs
set employee_id = t.employee_id
from public.teachers t
where cs.teacher_id = t.id
  and cs.teacher_id is not null
  and t.employee_id is not null
  and cs.employee_id is null;

update public.subject_class_loads scl
set employee_id = t.employee_id
from public.teachers t
where scl.teacher_id = t.id
  and t.employee_id is not null
  and scl.employee_id is null;

update public.grade_periods gp
set employee_id = t.employee_id
from public.teachers t
where gp.teacher_id = t.id
  and gp.teacher_id is not null
  and t.employee_id is not null
  and gp.employee_id is null;

update public.grades g
set employee_id = t.employee_id
from public.teachers t
where g.teacher_id = t.id
  and g.teacher_id is not null
  and t.employee_id is not null
  and g.employee_id is null;

update public.learning_materials lm
set employee_id = t.employee_id
from public.teachers t
where lm.teacher_id = t.id
  and lm.teacher_id is not null
  and t.employee_id is not null
  and lm.employee_id is null;

comment on column public.sections.adviser_employee_id is
  'Phase 3 employee-based replacement for sections.adviser_id. Legacy teacher-based adviser_id remains temporarily for dual-read validation.';

comment on column public.class_schedules.employee_id is
  'Phase 3 employee-based replacement for class_schedules.teacher_id. Legacy teacher_id remains temporarily for dual-read validation.';

comment on column public.subject_class_loads.employee_id is
  'Phase 3 employee-based replacement for subject_class_loads.teacher_id. Legacy teacher_id remains temporarily for dual-read validation.';

comment on column public.grade_periods.employee_id is
  'Phase 3 employee-based replacement for grade_periods.teacher_id. Legacy teacher_id remains temporarily for dual-read validation.';

comment on column public.grades.employee_id is
  'Phase 3 employee-based replacement for grades.teacher_id. Legacy teacher_id remains temporarily for dual-read validation.';

comment on column public.learning_materials.employee_id is
  'Phase 3 employee-based replacement for learning_materials.teacher_id. Legacy teacher_id remains temporarily for dual-read validation.';

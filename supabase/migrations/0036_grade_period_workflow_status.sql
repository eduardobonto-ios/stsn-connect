-- 0036_grade_period_workflow_status.sql
-- Persist teacher grade-period submission/review state so Teacher and Principal
-- workflows do not depend on local-only Zustand fields.

alter table public.grade_periods
  add column if not exists submitted_for_approval boolean not null default false,
  add column if not exists submitted_at timestamptz,
  add column if not exists submitted_by text,
  add column if not exists grade_approval_status text not null default 'Draft',
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by text,
  add column if not exists returned_at timestamptz,
  add column if not exists returned_by text,
  add column if not exists return_remarks text;

alter table public.grade_periods
  drop constraint if exists grade_periods_grade_approval_status_check;

alter table public.grade_periods
  add constraint grade_periods_grade_approval_status_check
  check (grade_approval_status in ('Draft', 'Submitted', 'Approved', 'Returned'));

comment on column public.grade_periods.submitted_for_approval is
  'True while a finalized grade period is awaiting Principal review.';
comment on column public.grade_periods.grade_approval_status is
  'Persisted Teacher/Principal grade workflow status used by grade encoding and grade directory pages.';
comment on column public.grade_periods.return_remarks is
  'Principal remarks when a grade period is returned to the teacher for revision.';

create index if not exists idx_grade_periods_teacher_status
  on public.grade_periods (teacher_id, grade_approval_status);

create index if not exists idx_grade_periods_section_status
  on public.grade_periods (section_id, grade_approval_status);

create index if not exists idx_grade_periods_submitted_at
  on public.grade_periods (submitted_at);

create index if not exists idx_grade_periods_school_year_status
  on public.grade_periods (school_year, grade_approval_status);

-- Keep historical rows consistent when they were finalized before workflow
-- status persistence existed.
update public.grade_periods
set grade_approval_status = 'Approved'
where is_finalized = true
  and coalesce(grade_approval_status, 'Draft') = 'Draft';

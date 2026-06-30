-- ============================================================================
-- STSN Connect — Centralized Approval Workflow Engine
-- Migration: 0034_approval_workflow_engine.sql
-- Reference: STSN_APPROVAL_WORKFLOW_BEST_PRACTICE_PROCESS.md
--
-- All statements are idempotent (if not exists / create or replace / on conflict).
-- Safe to run again after partial execution.
-- ============================================================================

-- ── updated_at trigger function ───────────────────────────────────────────────
-- Standard function shared by all approval tables that carry an updated_at column.

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── approval_requests ────────────────────────────────────────────────────────

create table if not exists public.approval_requests (
  id                    uuid primary key default gen_random_uuid(),
  workflow_type         text not null,
  entity_type           text not null,
  entity_id             text not null,
  school_id             text,
  requested_by          uuid references public.users(id) on delete set null,
  requested_role        text,
  request_title         text not null,
  request_summary       text,
  status                text not null default 'Draft',
  current_step_level    integer not null default 1,
  priority              text not null default 'Normal',
  due_at                timestamptz,
  submitted_at          timestamptz,
  completed_at          timestamptz,
  cancelled_at          timestamptz,
  overdue_notified_at   timestamptz,   -- tracks when overdue escalation was last sent
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  constraint approval_requests_status_check check (
    status in ('Draft','Submitted','In Review','Returned','Resubmitted','Approved','Rejected','Cancelled','Voided')
  ),
  constraint approval_requests_priority_check check (
    priority in ('Low','Normal','High','Urgent')
  ),
  constraint approval_requests_workflow_type_check check (
    workflow_type in ('online_application','enrollment','assessment','discount','payment_void','leave_request','grade_period','payroll_run')
  )
);

comment on table  public.approval_requests               is 'Central record for every approval event. Module tables store business data; this table stores the approval lifecycle.';
comment on column public.approval_requests.workflow_type is 'online_application | enrollment | assessment | discount | payment_void | leave_request | grade_period | payroll_run';
comment on column public.approval_requests.entity_id     is 'Source record id — text to accommodate both uuid and legacy string ids.';
comment on column public.approval_requests.status        is 'Draft | Submitted | In Review | Returned | Resubmitted | Approved | Rejected | Cancelled | Voided';
comment on column public.approval_requests.priority      is 'Low | Normal | High | Urgent';
comment on column public.approval_requests.overdue_notified_at is 'Timestamp of the last overdue escalation notification sent for this request.';

drop trigger if exists trg_approval_requests_updated_at on public.approval_requests;
create trigger trg_approval_requests_updated_at
  before update on public.approval_requests
  for each row execute function public.set_updated_at();

-- ── approval_steps ───────────────────────────────────────────────────────────

create table if not exists public.approval_steps (
  id                        uuid primary key default gen_random_uuid(),
  approval_request_id       uuid not null references public.approval_requests(id) on delete cascade,
  step_level                integer not null,
  step_name                 text not null,
  required_role             text,
  required_designation      text,
  required_approval_level   integer default 1,
  assigned_to_user_id       uuid references public.users(id) on delete set null,
  status                    text not null default 'Pending',
  acted_by                  uuid references public.users(id) on delete set null,
  acted_at                  timestamptz,
  remarks                   text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  unique (approval_request_id, step_level),

  constraint approval_steps_status_check check (
    status in ('Pending','Approved','Rejected','Returned','Skipped','Delegated')
  )
);

comment on table  public.approval_steps                      is 'One row per required approval level per request. Supports multi-level workflows (e.g. discount L1 + L2).';
comment on column public.approval_steps.required_role        is 'e.g. ACCOUNTING | PRINCIPAL | HR | PAYROLL | REGISTRAR';
comment on column public.approval_steps.required_designation is 'HEAD | OFFICER | STAFF | PRINCIPAL | ASST_PRINCIPAL — narrows authority within the role.';
comment on column public.approval_steps.status               is 'Pending | Approved | Rejected | Returned | Skipped | Delegated';

drop trigger if exists trg_approval_steps_updated_at on public.approval_steps;
create trigger trg_approval_steps_updated_at
  before update on public.approval_steps
  for each row execute function public.set_updated_at();

-- ── approval_actions ─────────────────────────────────────────────────────────
-- Append-only audit trail. No update/delete ever permitted.

create table if not exists public.approval_actions (
  id                    uuid primary key default gen_random_uuid(),
  approval_request_id   uuid not null references public.approval_requests(id) on delete cascade,
  approval_step_id      uuid references public.approval_steps(id) on delete set null,
  action                text not null,
  action_by             uuid not null references public.users(id) on delete restrict,
  action_role           text not null,
  action_designation    text,
  previous_status       text,
  new_status            text,
  remarks               text,
  metadata              jsonb,
  ip_address            text,
  user_agent            text,
  created_at            timestamptz not null default now(),

  constraint approval_actions_action_check check (
    action in (
      'SUBMITTED','REVIEWED',
      'APPROVED_LEVEL_1','APPROVED_LEVEL_2','APPROVED_FINAL',
      'RETURNED','RESUBMITTED',
      'REJECTED','CANCELLED','OVERRIDDEN','DELEGATED'
    )
  )
);

comment on table  public.approval_actions        is 'Permanent audit trail. Every action creates one row. Never updated or deleted.';
comment on column public.approval_actions.action is 'SUBMITTED | REVIEWED | APPROVED_LEVEL_1 | APPROVED_LEVEL_2 | APPROVED_FINAL | RETURNED | RESUBMITTED | REJECTED | CANCELLED | OVERRIDDEN | DELEGATED';

-- ── approval_comments ────────────────────────────────────────────────────────

create table if not exists public.approval_comments (
  id                    uuid primary key default gen_random_uuid(),
  approval_request_id   uuid not null references public.approval_requests(id) on delete cascade,
  comment_by            uuid not null references public.users(id) on delete restrict,
  comment_role          text,
  comment_text          text not null,
  is_internal           boolean not null default false,
  created_at            timestamptz not null default now()
);

comment on column public.approval_comments.is_internal is 'true = visible only to approvers; false = visible to requester as well.';

-- ── approval_attachments ─────────────────────────────────────────────────────

create table if not exists public.approval_attachments (
  id                    uuid primary key default gen_random_uuid(),
  approval_request_id   uuid not null references public.approval_requests(id) on delete cascade,
  file_name             text not null,
  file_url              text not null,
  file_type             text,
  file_size_bytes       bigint,
  uploaded_by           uuid not null references public.users(id) on delete restrict,
  uploaded_at           timestamptz not null default now()
);

-- ── approval_sla_rules ───────────────────────────────────────────────────────

create table if not exists public.approval_sla_rules (
  id                    uuid primary key default gen_random_uuid(),
  workflow_type         text not null unique,
  display_name          text not null,
  sla_hours             integer not null check (sla_hours > 0),
  escalate_after_hours  integer check (escalate_after_hours > 0),
  is_active             boolean not null default true,
  created_at            timestamptz not null default now(),

  constraint approval_sla_rules_workflow_type_check check (
    workflow_type in ('online_application','enrollment','assessment','discount','payment_void','leave_request','grade_period','payroll_run')
  )
);

comment on table  public.approval_sla_rules                      is 'SLA configuration per workflow. sla_hours drives the overdue threshold in the Action Center.';
comment on column public.approval_sla_rules.sla_hours            is 'Business hours before the request is marked overdue.';
comment on column public.approval_sla_rules.escalate_after_hours is 'Business hours after sla_hours before an escalation notification is sent.';

-- ── approval_delegations ─────────────────────────────────────────────────────

create table if not exists public.approval_delegations (
  id                    uuid primary key default gen_random_uuid(),
  delegator_id          uuid not null references public.users(id) on delete restrict,
  delegate_id           uuid not null references public.users(id) on delete restrict,
  scope                 text not null default 'ALL',
  school_id             text,
  valid_from            date not null,
  valid_until           date not null,
  reason                text not null,
  is_active             boolean not null default true,
  created_by            uuid references public.users(id) on delete set null,
  created_at            timestamptz not null default now(),
  revoked_at            timestamptz,
  revoked_by            uuid references public.users(id) on delete set null,
  updated_at            timestamptz not null default now(),

  check (valid_until >= valid_from),
  check (delegator_id <> delegate_id),
  constraint approval_delegations_scope_check check (
    scope in ('ALL','online_application','enrollment','assessment','discount','payment_void','leave_request','grade_period','payroll_run')
  )
);

comment on table  public.approval_delegations             is 'Temporary approval authority delegation (e.g. approver on leave).';
comment on column public.approval_delegations.scope       is 'ALL = all workflows. Otherwise, the specific workflow_type being delegated.';
comment on column public.approval_delegations.reason      is 'Required business justification for the delegation.';

drop trigger if exists trg_approval_delegations_updated_at on public.approval_delegations;
create trigger trg_approval_delegations_updated_at
  before update on public.approval_delegations
  for each row execute function public.set_updated_at();

-- ── workflow_step_configs ─────────────────────────────────────────────────────
-- Database-stored approval matrix — mirrors APPROVAL_MATRIX in approvalWorkflowService.ts.
-- Allows admin-level reconfiguration without code changes.

create table if not exists public.workflow_step_configs (
  id                        uuid primary key default gen_random_uuid(),
  workflow_type             text not null,
  step_level                integer not null,
  step_name                 text not null,
  required_role             text,
  required_designation      text,
  required_approval_level   integer not null default 1,
  is_final_step             boolean not null default false,
  is_active                 boolean not null default true,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  unique (workflow_type, step_level),

  constraint workflow_step_configs_workflow_type_check check (
    workflow_type in ('online_application','enrollment','assessment','discount','payment_void','leave_request','grade_period','payroll_run')
  )
);

comment on table  public.workflow_step_configs              is 'Configurable approval matrix. One row per step per workflow. Mirrors APPROVAL_MATRIX in approvalWorkflowService.ts.';
comment on column public.workflow_step_configs.is_final_step is 'true = approving this step completes the entire request.';

drop trigger if exists trg_workflow_step_configs_updated_at on public.workflow_step_configs;
create trigger trg_workflow_step_configs_updated_at
  before update on public.workflow_step_configs
  for each row execute function public.set_updated_at();

-- ── Indexes ──────────────────────────────────────────────────────────────────

-- Core lookup indexes
create index if not exists idx_approval_requests_workflow_type    on public.approval_requests (workflow_type);
create index if not exists idx_approval_requests_entity_id        on public.approval_requests (entity_id);
create index if not exists idx_approval_requests_school_id        on public.approval_requests (school_id);
create index if not exists idx_approval_requests_status           on public.approval_requests (status);
create index if not exists idx_approval_requests_current_step     on public.approval_requests (current_step_level);
create index if not exists idx_approval_requests_requested_by     on public.approval_requests (requested_by);
create index if not exists idx_approval_requests_due_at           on public.approval_requests (due_at);
create index if not exists idx_approval_requests_overdue_notified on public.approval_requests (overdue_notified_at);

-- Composite indexes — critical for service queries
create index if not exists idx_approval_requests_entity_workflow
  on public.approval_requests (entity_id, workflow_type);

create index if not exists idx_approval_requests_workflow_status
  on public.approval_requests (workflow_type, status);

create index if not exists idx_approval_requests_status_due
  on public.approval_requests (status, due_at)
  where status in ('Submitted','In Review','Resubmitted');

create index if not exists idx_approval_steps_request_id          on public.approval_steps (approval_request_id);
create index if not exists idx_approval_steps_status              on public.approval_steps (status);
create index if not exists idx_approval_steps_acted_by            on public.approval_steps (acted_by);

create index if not exists idx_approval_actions_request_id        on public.approval_actions (approval_request_id);
create index if not exists idx_approval_actions_action_by         on public.approval_actions (action_by);
create index if not exists idx_approval_actions_created_at        on public.approval_actions (created_at);
create index if not exists idx_approval_actions_action            on public.approval_actions (action);

create index if not exists idx_approval_comments_request_id       on public.approval_comments (approval_request_id);
create index if not exists idx_approval_attachments_request_id    on public.approval_attachments (approval_request_id);

create index if not exists idx_approval_delegations_delegate_id   on public.approval_delegations (delegate_id);
create index if not exists idx_approval_delegations_delegator_id  on public.approval_delegations (delegator_id);
create index if not exists idx_approval_delegations_active        on public.approval_delegations (is_active, valid_from, valid_until);

create index if not exists idx_workflow_step_configs_type         on public.workflow_step_configs (workflow_type);

-- ── Row Level Security ───────────────────────────────────────────────────────
-- Permissive development policies — tighten per-role before production.

alter table public.approval_requests    enable row level security;
alter table public.approval_steps       enable row level security;
alter table public.approval_actions     enable row level security;
alter table public.approval_comments    enable row level security;
alter table public.approval_attachments enable row level security;
alter table public.approval_sla_rules   enable row level security;
alter table public.approval_delegations enable row level security;
alter table public.workflow_step_configs enable row level security;

-- approval_requests
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'approval_requests' and policyname = 'approval_requests_select') then
    create policy "approval_requests_select" on public.approval_requests for select to anon, authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'approval_requests' and policyname = 'approval_requests_insert') then
    create policy "approval_requests_insert" on public.approval_requests for insert to anon, authenticated with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'approval_requests' and policyname = 'approval_requests_update') then
    create policy "approval_requests_update" on public.approval_requests for update to anon, authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'approval_requests' and policyname = 'approval_requests_delete') then
    create policy "approval_requests_delete" on public.approval_requests for delete to anon, authenticated using (true);
  end if;
end $$;

-- approval_steps
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'approval_steps' and policyname = 'approval_steps_select') then
    create policy "approval_steps_select" on public.approval_steps for select to anon, authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'approval_steps' and policyname = 'approval_steps_insert') then
    create policy "approval_steps_insert" on public.approval_steps for insert to anon, authenticated with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'approval_steps' and policyname = 'approval_steps_update') then
    create policy "approval_steps_update" on public.approval_steps for update to anon, authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'approval_steps' and policyname = 'approval_steps_delete') then
    create policy "approval_steps_delete" on public.approval_steps for delete to anon, authenticated using (true);
  end if;
end $$;

-- approval_actions — append-only: no update/delete policies
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'approval_actions' and policyname = 'approval_actions_select') then
    create policy "approval_actions_select" on public.approval_actions for select to anon, authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'approval_actions' and policyname = 'approval_actions_insert') then
    create policy "approval_actions_insert" on public.approval_actions for insert to anon, authenticated with check (true);
  end if;
end $$;

-- approval_comments
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'approval_comments' and policyname = 'approval_comments_select') then
    create policy "approval_comments_select" on public.approval_comments for select to anon, authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'approval_comments' and policyname = 'approval_comments_insert') then
    create policy "approval_comments_insert" on public.approval_comments for insert to anon, authenticated with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'approval_comments' and policyname = 'approval_comments_update') then
    create policy "approval_comments_update" on public.approval_comments for update to anon, authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'approval_comments' and policyname = 'approval_comments_delete') then
    create policy "approval_comments_delete" on public.approval_comments for delete to anon, authenticated using (true);
  end if;
end $$;

-- approval_attachments
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'approval_attachments' and policyname = 'approval_attachments_select') then
    create policy "approval_attachments_select" on public.approval_attachments for select to anon, authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'approval_attachments' and policyname = 'approval_attachments_insert') then
    create policy "approval_attachments_insert" on public.approval_attachments for insert to anon, authenticated with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'approval_attachments' and policyname = 'approval_attachments_delete') then
    create policy "approval_attachments_delete" on public.approval_attachments for delete to anon, authenticated using (true);
  end if;
end $$;

-- approval_sla_rules
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'approval_sla_rules' and policyname = 'approval_sla_rules_select') then
    create policy "approval_sla_rules_select" on public.approval_sla_rules for select to anon, authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'approval_sla_rules' and policyname = 'approval_sla_rules_insert') then
    create policy "approval_sla_rules_insert" on public.approval_sla_rules for insert to anon, authenticated with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'approval_sla_rules' and policyname = 'approval_sla_rules_update') then
    create policy "approval_sla_rules_update" on public.approval_sla_rules for update to anon, authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'approval_sla_rules' and policyname = 'approval_sla_rules_delete') then
    create policy "approval_sla_rules_delete" on public.approval_sla_rules for delete to anon, authenticated using (true);
  end if;
end $$;

-- approval_delegations
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'approval_delegations' and policyname = 'approval_delegations_select') then
    create policy "approval_delegations_select" on public.approval_delegations for select to anon, authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'approval_delegations' and policyname = 'approval_delegations_insert') then
    create policy "approval_delegations_insert" on public.approval_delegations for insert to anon, authenticated with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'approval_delegations' and policyname = 'approval_delegations_update') then
    create policy "approval_delegations_update" on public.approval_delegations for update to anon, authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'approval_delegations' and policyname = 'approval_delegations_delete') then
    create policy "approval_delegations_delete" on public.approval_delegations for delete to anon, authenticated using (true);
  end if;
end $$;

-- workflow_step_configs
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'workflow_step_configs' and policyname = 'workflow_step_configs_select') then
    create policy "workflow_step_configs_select" on public.workflow_step_configs for select to anon, authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'workflow_step_configs' and policyname = 'workflow_step_configs_insert') then
    create policy "workflow_step_configs_insert" on public.workflow_step_configs for insert to anon, authenticated with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'workflow_step_configs' and policyname = 'workflow_step_configs_update') then
    create policy "workflow_step_configs_update" on public.workflow_step_configs for update to anon, authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'workflow_step_configs' and policyname = 'workflow_step_configs_delete') then
    create policy "workflow_step_configs_delete" on public.workflow_step_configs for delete to anon, authenticated using (true);
  end if;
end $$;

-- ── SLA Seed Data ────────────────────────────────────────────────────────────
-- Per STSN_APPROVAL_WORKFLOW_BEST_PRACTICE_PROCESS.md § 12

insert into public.approval_sla_rules (workflow_type, display_name, sla_hours, escalate_after_hours, is_active)
values
  ('online_application', 'Online Application Review',  8,  6, true),
  ('enrollment',         'Enrollment Approval',         8,  6, true),
  ('assessment',         'Assessment Approval',         8,  6, true),
  ('discount',           'Discount Request',            16, 12, true),
  ('payment_void',       'Payment Void Approval',       4,  2, true),
  ('leave_request',      'Leave Request',               16, 12, true),
  ('grade_period',       'Grade Period Approval',       24, 18, true),
  ('payroll_run',        'Payroll Run Approval',        4,  2, true)
on conflict (workflow_type) do update
  set display_name          = excluded.display_name,
      sla_hours             = excluded.sla_hours,
      escalate_after_hours  = excluded.escalate_after_hours,
      is_active             = excluded.is_active;

-- ── Approval Matrix Seed Data ─────────────────────────────────────────────────
-- Per STSN_APPROVAL_WORKFLOW_BEST_PRACTICE_PROCESS.md §5 and §6
-- Mirrors APPROVAL_MATRIX in src/services/approvalWorkflowService.ts.
-- is_final_step = true means approving this step completes the entire request.

insert into public.workflow_step_configs
  (workflow_type, step_level, step_name, required_role, required_designation, required_approval_level, is_final_step, is_active)
values
  -- Online Application: Registrar review (single-step)
  ('online_application', 1, 'Registrar Review',                 'REGISTRAR',  null,      1, true,  true),

  -- Enrollment: Registrar Head final approval (single-step)
  ('enrollment',         1, 'Registrar Enrollment Approval',    'REGISTRAR',  'HEAD',    1, true,  true),

  -- Assessment: 2-level — Accounting review → Accounting Head approval
  ('assessment',         1, 'Accounting Review',                'ACCOUNTING', null,      1, false, true),
  ('assessment',         2, 'Accounting Head Approval',         'ACCOUNTING', 'HEAD',    2, true,  true),

  -- Discount: 2-level — Accounting Officer L1 → Accounting Head L2
  ('discount',           1, 'Accounting Officer Review (L1)',   'ACCOUNTING', 'OFFICER', 1, false, true),
  ('discount',           2, 'Accounting Head Final Approval (L2)', 'ACCOUNTING', 'HEAD', 2, true,  true),

  -- Payment Void: 2-level — Accounting Officer review → Accounting Head approval
  ('payment_void',       1, 'Accounting Officer Review',        'ACCOUNTING', null,      1, false, true),
  ('payment_void',       2, 'Accounting Head Approval',         'ACCOUNTING', 'HEAD',    2, true,  true),

  -- Leave Request: 2-level — HR review → HR Head approval
  ('leave_request',      1, 'HR Review',                        'HR',         null,      1, false, true),
  ('leave_request',      2, 'HR Head Approval',                 'HR',         'HEAD',    2, true,  true),

  -- Grade Period: Principal final approval (single-step)
  ('grade_period',       1, 'Principal Approval',               'PRINCIPAL',  null,      1, true,  true),

  -- Payroll Run: 2-level — Payroll Officer review → Payroll Head approval
  ('payroll_run',        1, 'Payroll Officer Review',           'PAYROLL',    null,      1, false, true),
  ('payroll_run',        2, 'Payroll Head Approval',            'PAYROLL',    'HEAD',    2, true,  true)

on conflict (workflow_type, step_level) do update
  set step_name                 = excluded.step_name,
      required_role             = excluded.required_role,
      required_designation      = excluded.required_designation,
      required_approval_level   = excluded.required_approval_level,
      is_final_step             = excluded.is_final_step,
      is_active                 = excluded.is_active,
      updated_at                = now();

-- ── Useful views ─────────────────────────────────────────────────────────────

create or replace view public.v_pending_approval_requests as
select
  r.id,
  r.workflow_type,
  r.entity_type,
  r.entity_id,
  r.school_id,
  r.request_title,
  r.status,
  r.priority,
  r.current_step_level,
  r.due_at,
  r.submitted_at,
  r.overdue_notified_at,
  case
    when r.due_at < now() then true
    else false
  end                            as is_overdue,
  extract(epoch from (now() - r.submitted_at)) / 3600 as age_hours,
  s.step_name                   as current_step_name,
  s.required_role               as current_required_role,
  s.required_designation        as current_required_designation,
  s.assigned_to_user_id         as current_assigned_to
from public.approval_requests r
left join public.approval_steps s
  on  s.approval_request_id = r.id
  and s.step_level = r.current_step_level
where r.status in ('Submitted', 'In Review', 'Resubmitted');

comment on view public.v_pending_approval_requests is
  'Convenience view for the Action Center inbox — active pending requests with current step details and overdue flag.';

create or replace view public.v_overdue_approval_requests as
select *
from public.v_pending_approval_requests
where is_overdue = true
order by age_hours desc;

comment on view public.v_overdue_approval_requests is
  'All active approval requests that have passed their SLA due_at timestamp.';

begin;

-- Rate rows are financial configuration snapshots once their schedule leaves
-- Draft. This trigger protects the invariant even for privileged direct SQL;
-- normal application mutations remain routed through the controlled RPCs.
create or replace function public.guard_student_fee_schedule_rate_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_schedule_id uuid;
  v_schedule_status text;
begin
  v_schedule_id := case when tg_op = 'DELETE' then old.schedule_id else new.schedule_id end;

  select status
  into v_schedule_status
  from public.student_fee_schedules
  where id = v_schedule_id;

  if not found then
    raise exception 'Fee schedule % was not found', v_schedule_id;
  end if;

  if v_schedule_status <> 'Draft' then
    raise exception 'Published and Archived fee schedule rates are immutable; create a Draft version instead';
  end if;

  if tg_op = 'UPDATE' and new.schedule_id is distinct from old.schedule_id then
    select status
    into v_schedule_status
    from public.student_fee_schedules
    where id = old.schedule_id;

    if not found or v_schedule_status <> 'Draft' then
      raise exception 'Published and Archived fee schedule rates are immutable; create a Draft version instead';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end
$$;

drop trigger if exists trg_student_fee_schedule_rates_draft_only
  on public.student_fee_schedule_rates;
create trigger trg_student_fee_schedule_rates_draft_only
before insert or update or delete on public.student_fee_schedule_rates
for each row execute function public.guard_student_fee_schedule_rate_mutation();

revoke all on function public.guard_student_fee_schedule_rate_mutation() from public;

commit;

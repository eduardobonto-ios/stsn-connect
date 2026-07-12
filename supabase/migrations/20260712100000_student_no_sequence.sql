-- ============================================================================
-- STSN CONNECT — Server-side student_no generation
-- Migration: 20260712100000_student_no_sequence.sql
-- ----------------------------------------------------------------------------
-- Problem: the app was generating student_no client-side as
-- `students.length + 1` (see src/services/store.ts addStudent). That count
-- reflects whatever the browser currently has loaded, not the authoritative
-- max in the table, so concurrent enrollments (or gaps from prior deletions)
-- can produce a duplicate student_no. Since student_no is `unique`, the
-- insert then fails — silently, because the app's write path is
-- fire-and-forget (see supabaseCrud.ts dbInsert), so the new student appears
-- in the UI until the next reload, then vanishes.
--
-- Fix: generate student_no atomically in Postgres via a sequence + a
-- BEFORE INSERT trigger, mirroring the existing generate_online_student_no
-- pattern from 0030_online_enrollment_bridge.sql. The sequence is seeded
-- past the highest numeric suffix already present so it can't collide with
-- legacy/seeded rows.
-- ============================================================================

do $$
declare
  v_max bigint;
begin
  select coalesce(max(substring(student_no from '(\d+)$')::bigint), 0)
  into v_max
  from public.students
  where student_no ~ '^STSN-\d{4}-\d+$';

  execute format('create sequence if not exists public.student_no_seq start with %s', v_max + 1);
end $$;

create or replace function public.generate_student_no(p_school_year text default '2026')
returns text
language plpgsql
as $$
declare
  v_next bigint;
begin
  v_next := nextval('public.student_no_seq');
  return 'STSN-' || p_school_year || '-' || lpad(v_next::text, 4, '0');
end;
$$;

create or replace function public.assign_student_no()
returns trigger
language plpgsql
as $$
begin
  if new.student_no is null or btrim(new.student_no) = '' then
    new.student_no := public.generate_student_no();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_students_assign_student_no on public.students;
create trigger trg_students_assign_student_no
  before insert on public.students
  for each row execute function public.assign_student_no();

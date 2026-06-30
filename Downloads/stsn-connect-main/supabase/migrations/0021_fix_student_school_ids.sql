-- ============================================================================
-- STSN CONNECT — Fix student school_id assignments
-- Students were seeded without school_id (NULL). Assign them based on
-- department: Basic Education → STSN, College → CDSTA.
-- ============================================================================

update public.students
set school_id = (select id from public.schools where legacy_id = 'STSN')
where department = 'Basic Education'
  and school_id is null;

update public.students
set school_id = (select id from public.schools where legacy_id = 'CDSTA')
where department = 'College'
  and school_id is null;

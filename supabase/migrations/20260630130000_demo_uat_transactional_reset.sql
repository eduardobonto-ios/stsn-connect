-- DEMO/UAT ONLY. DO NOT RUN AGAINST PRODUCTION DATA.
-- ============================================================================
-- STSN Connect - Phase 12 Demo/UAT Transactional Reset
--
-- Purpose
--   Resets only Phase 12 demo/UAT records so the dedicated full-school-year
--   seed can be reapplied cleanly without disturbing reference/setup data or
--   earlier baseline demo data from prior migrations.
--
-- Why ordered DELETEs instead of blanket TRUNCATE
--   Shared transactional tables in this project already contain baseline demo
--   content used by earlier phases. A table-wide TRUNCATE ... CASCADE would
--   remove non-Phase-12 demo records as well, which is riskier than necessary.
--   This reset therefore removes only rows owned by the Phase 12 UAT seed,
--   identified by stable legacy ids, emails, student numbers, OR numbers, and
--   application reference numbers.
-- ============================================================================

begin;

-- Student legacy ids owned by Phase 12:
--   stud-uat-portal
--   stud-uat-sibling
--   stud-uat-applicant
--
-- User emails owned by Phase 12:
--   student.uat@stsn.edu.ph
--   guardian.solo@stsn.edu.ph
--   guardian.family@stsn.edu.ph
--
-- Existing Phase 11 demo guardian intentionally recreated by the Phase 12 seed:
--   parent.demo@stsn.edu.ph

delete from public.discount_request_audit_trail
where discount_request_id in (
  select id
  from public.discount_requests
  where legacy_id like 'uat-%'
);

delete from public.discount_requests
where legacy_id like 'uat-%';

delete from public.student_grade_entries
where grade_period_id in (
  select id
  from public.grade_periods
  where legacy_id like 'uat-%'
)
or student_id in (
  select id
  from public.students
  where legacy_id in ('stud-uat-portal', 'stud-uat-sibling', 'stud-uat-applicant')
);

delete from public.grade_categories
where grade_period_id in (
  select id
  from public.grade_periods
  where legacy_id like 'uat-%'
);

delete from public.grade_items
where legacy_id like 'uat-%'
or grade_period_id in (
  select id
  from public.grade_periods
  where legacy_id like 'uat-%'
);

delete from public.grade_periods
where legacy_id like 'uat-%';

delete from public.class_load_students
where class_load_id in (
  select id
  from public.subject_class_loads
  where legacy_id like 'uat-%'
)
or student_id in (
  select id
  from public.students
  where legacy_id in ('stud-uat-portal', 'stud-uat-sibling', 'stud-uat-applicant')
);

delete from public.subject_class_loads
where legacy_id like 'uat-%';

delete from public.assessment_fees
where assessment_id in (
  select id
  from public.assessments
  where legacy_id like 'uat-%'
);

delete from public.assessment_audit_trail
where assessment_id in (
  select id
  from public.assessments
  where legacy_id like 'uat-%'
);

delete from public.enrollment_subjects
where enrollment_id in (
  select id
  from public.enrollments
  where legacy_id like 'uat-%'
);

delete from public.payments
where legacy_id like 'uat-%'
   or or_number like 'OR-UAT-%';

delete from public.ledger_transactions
where legacy_id like 'uat-%';

delete from public.financial_holds
where legacy_id like 'uat-%';

delete from public.assessment_billing_summaries
where legacy_id like 'uat-%';

delete from public.payment_collection_summaries
where legacy_id like 'uat-%';

delete from public.promissory_notes
where legacy_id like 'uat-%';

delete from public.student_ledger_summaries
where student_id in (
  select id
  from public.students
  where legacy_id in ('stud-uat-portal', 'stud-uat-sibling', 'stud-uat-applicant')
);

delete from public.requirements
where legacy_id like 'uat-%';

delete from public.student_attendance
where legacy_id like 'uat-%'
   or student_id in (
     select id
     from public.students
     where legacy_id in ('stud-uat-portal', 'stud-uat-sibling', 'stud-uat-applicant')
   );

delete from public.clinic_visits
where legacy_id like 'uat-%'
   or student_id in (
     select id
     from public.students
     where legacy_id in ('stud-uat-portal', 'stud-uat-sibling', 'stud-uat-applicant')
   );

delete from public.student_health_profiles
where legacy_id like 'uat-%'
   or student_id in (
     select id
     from public.students
     where legacy_id in ('stud-uat-portal', 'stud-uat-sibling', 'stud-uat-applicant')
   );

delete from public.guidance_sessions
where legacy_id like 'uat-%'
   or student_id in (
     select id
     from public.students
     where legacy_id in ('stud-uat-portal', 'stud-uat-sibling', 'stud-uat-applicant')
   );

delete from public.consultation_appointments
where legacy_id like 'uat-%'
   or student_id in (
     select id
     from public.students
     where legacy_id in ('stud-uat-portal', 'stud-uat-sibling', 'stud-uat-applicant')
   );

delete from public.grades
where legacy_id like 'uat-%'
   or student_id in (
     select id
     from public.students
     where legacy_id in ('stud-uat-portal', 'stud-uat-sibling', 'stud-uat-applicant')
   );

delete from public.section_students
where student_id in (
  select id
  from public.students
  where legacy_id in ('stud-uat-portal', 'stud-uat-sibling', 'stud-uat-applicant')
);

delete from public.student_registrar_profiles
where student_id in (
  select id
  from public.students
  where legacy_id in ('stud-uat-portal', 'stud-uat-sibling', 'stud-uat-applicant')
);

delete from public.student_guardians
where legacy_id like 'uat-%'
   or legacy_id in ('sg-demo-parent-enrico', 'sg-demo-parent-clara')
   or email in (
     'parent.demo@stsn.edu.ph',
     'guardian.solo@stsn.edu.ph',
     'guardian.family@stsn.edu.ph'
   )
   or student_id in (
     select id
     from public.students
     where legacy_id in ('stud-uat-portal', 'stud-uat-sibling', 'stud-uat-applicant')
   );

delete from public.assessments
where legacy_id like 'uat-%';

delete from public.enrollments
where legacy_id like 'uat-%';

delete from public.online_enrollment_applications
where reference_no like 'OE-UAT-%';

delete from public.class_schedules
where legacy_id like 'uat-%';

delete from public.announcements
where legacy_id like 'uat-%';

delete from public.activity_logs
where legacy_id like 'uat-%';

delete from public.students
where legacy_id in ('stud-uat-portal', 'stud-uat-sibling', 'stud-uat-applicant')
   or student_no in ('STSN-UAT-2026-0001', 'STSN-UAT-2026-0002', 'STSN-UAT-2026-0003');

delete from public.users
where legacy_id in (
    'user-demo-guardian',
    'user-uat-student',
    'user-uat-guardian-solo',
    'user-uat-guardian-family'
  )
   or email in (
    'parent.demo@stsn.edu.ph',
    'student.uat@stsn.edu.ph',
    'guardian.solo@stsn.edu.ph',
    'guardian.family@stsn.edu.ph'
  );

commit;

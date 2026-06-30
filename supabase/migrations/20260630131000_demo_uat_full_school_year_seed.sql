-- ============================================================================
-- STSN Connect - Phase 12 Demo/UAT Full School Year Seed
--
-- Purpose
--   Seeds a clean, rerunnable set of dedicated demo/UAT records for:
--   - online enrollment review
--   - registrar admission processing
--   - student master/profile visibility
--   - section / subject assignment
--   - billing, partial payment, full payment, and ledger history
--   - teacher grading context
--   - student portal login
--   - guardian portal login with one-child and multi-child scenarios
--
-- Scope
--   Uses existing setup/reference records already migrated earlier:
--   schools, sections, subjects, teachers, discount types, fee schedules, and
--   role permissions. No UI, routing, calculations, or business logic change.
--
-- Important limitations
--   1. App login uses public.users plus the client-side demo password
--      "password123". Supabase auth.users rows are not required here.
--   2. announcements.targetRoles is a frontend/store field only; the current
--      public.announcements table and shared loader do not persist or hydrate
--      role targeting yet. Seeded announcements therefore remain generic text
--      content that can still support manual portal visibility checks.
--   3. Guardian Portal attendance display remains deferred because the shared
--      store does not currently load student_attendance into that page.
-- ============================================================================

begin;

insert into public.users (legacy_id, school_id, email, name, role, is_active, avatar_url, department) values
  (
    'user-demo-guardian',
    (select id from public.schools where legacy_id = 'STSN'),
    'parent.demo@stsn.edu.ph',
    'Roberto Veloso (Demo Parent)',
    'GUARDIAN',
    true,
    '',
    'Parent / Guardian'
  ),
  (
    'user-uat-student',
    (select id from public.schools where legacy_id = 'STSN'),
    'student.uat@stsn.edu.ph',
    'Ariana Veloso (UAT Student)',
    'STUDENT',
    true,
    '',
    'Basic Education'
  ),
  (
    'user-uat-guardian-solo',
    (select id from public.schools where legacy_id = 'STSN'),
    'guardian.solo@stsn.edu.ph',
    'Teresa Veloso (Solo Guardian UAT)',
    'GUARDIAN',
    true,
    '',
    'Parent / Guardian'
  ),
  (
    'user-uat-guardian-family',
    (select id from public.schools where legacy_id = 'STSN'),
    'guardian.family@stsn.edu.ph',
    'Miguel Veloso Sr. (Family Guardian UAT)',
    'GUARDIAN',
    true,
    '',
    'Parent / Guardian'
  )
on conflict do nothing;

insert into public.students (
  legacy_id,
  school_id,
  user_id,
  student_no,
  lrn,
  first_name,
  last_name,
  middle_name,
  gender,
  civil_status,
  religion,
  nationality,
  birthday,
  birthplace,
  email,
  contact_no,
  address,
  province,
  municipality,
  zip_code,
  department,
  year_level,
  track_or_course,
  section,
  enrollment_status,
  created_via,
  source_metadata
) values
  (
    'stud-uat-portal',
    (select id from public.schools where legacy_id = 'STSN'),
    (select id from public.users where legacy_id = 'user-uat-student'),
    'STSN-UAT-2026-0001',
    '118877665544',
    'Ariana',
    'Veloso',
    'Martinez',
    'Female',
    'Single',
    'Catholic',
    'Filipino',
    '2009-08-14',
    'Quezon City',
    'student.uat@stsn.edu.ph',
    '+639170200001',
    '#14 Rosal St., Novaliches, Quezon City',
    'Metro Manila',
    'Quezon City',
    '1123',
    'Basic Education',
    'Grade 11',
    'STEM',
    'St. Thomas',
    'Partially Paid',
    'online',
    '{"phase":"phase12-uat","seed":"full-school-year","portalLogin":true}'::jsonb
  ),
  (
    'stud-uat-sibling',
    (select id from public.schools where legacy_id = 'STSN'),
    null,
    'STSN-UAT-2026-0002',
    '118877665545',
    'Marco',
    'Veloso',
    'Martinez',
    'Male',
    'Single',
    'Catholic',
    'Filipino',
    '2010-02-05',
    'Quezon City',
    'sibling.uat@stsn.edu.ph',
    '+639170200002',
    '#14 Rosal St., Novaliches, Quezon City',
    'Metro Manila',
    'Quezon City',
    '1123',
    'Basic Education',
    'Grade 11',
    'STEM',
    'St. Thomas',
    'Enrolled',
    'erp',
    '{"phase":"phase12-uat","seed":"full-school-year","scenario":"fully-paid-sibling"}'::jsonb
  ),
  (
    'stud-uat-applicant',
    (select id from public.schools where legacy_id = 'STSN'),
    null,
    'STSN-UAT-2026-0003',
    '118877665546',
    'Jasmine',
    'Serrano',
    'Lopez',
    'Female',
    'Single',
    'Catholic',
    'Filipino',
    '2010-11-19',
    'Caloocan City',
    'applicant.uat@stsn.edu.ph',
    '+639170200003',
    '#88 Dahlia St., Novaliches, Quezon City',
    'Metro Manila',
    'Quezon City',
    '1123',
    'Basic Education',
    'Grade 11',
    'STEM',
    'For Sectioning',
    'Pending',
    'online',
    '{"phase":"phase12-uat","seed":"full-school-year","scenario":"pending-registrar-review"}'::jsonb
  )
on conflict do nothing;

insert into public.student_registrar_profiles (
  student_id,
  lrn,
  student_status,
  academic_stage,
  strand,
  preferred_mode_of_payment,
  confirmation_status,
  previous_school,
  referral_source,
  comments_inquiries
) values
  (
    (select id from public.students where legacy_id = 'stud-uat-portal'),
    '118877665544',
    'Enrolled',
    'Senior High School',
    'STEM',
    'Quarterly',
    'Confirmed',
    'STSN Junior High School',
    'Parent referral',
    'Primary Phase 12 portal / billing / grading UAT student.'
  ),
  (
    (select id from public.students where legacy_id = 'stud-uat-sibling'),
    '118877665545',
    'Enrolled',
    'Senior High School',
    'STEM',
    'Cash Basis',
    'Confirmed',
    'STSN Junior High School',
    'Sibling referral',
    'Fully paid sibling for family-portal switching and paid-account checks.'
  ),
  (
    (select id from public.students where legacy_id = 'stud-uat-applicant'),
    '118877665546',
    'Applicant',
    'Senior High School',
    'STEM',
    'Quarterly',
    'Pending Review',
    'Novaliches Science High School',
    'Website inquiry',
    'Pending online application retained for registrar review smoke tests.'
  )
on conflict (student_id) do nothing;

insert into public.online_enrollment_applications (
  reference_no,
  student_id,
  enrollment_type,
  lrn,
  school_year,
  semester,
  grade_level_applying_for,
  strand_or_track,
  previous_school,
  previous_school_address,
  first_name,
  last_name,
  middle_name,
  birth_date,
  gender,
  email,
  contact_no,
  complete_address,
  barangay,
  city_municipality,
  province,
  zip_code,
  guardian_name,
  guardian_relationship,
  guardian_contact_no,
  guardian_email,
  guardian_address,
  status,
  completion_status,
  missing_fields,
  payload,
  submitted_from,
  submitted_at
) values
  (
    'OE-UAT-ACCEPTED-001',
    (select id from public.students where legacy_id = 'stud-uat-portal'),
    'New Student',
    '118877665544',
    '2026-2027',
    'First Semester',
    'Grade 11',
    'STEM',
    'STSN Junior High School',
    'Novaliches, Quezon City',
    'Ariana',
    'Veloso',
    'Martinez',
    '2009-08-14',
    'Female',
    'student.uat@stsn.edu.ph',
    '+639170200001',
    '#14 Rosal St., Novaliches, Quezon City',
    'Greater Lagro',
    'Quezon City',
    'Metro Manila',
    '1123',
    'Teresa Veloso',
    'Mother',
    '+639170299991',
    'guardian.solo@stsn.edu.ph',
    '#14 Rosal St., Novaliches, Quezon City',
    'Accepted',
    'Complete',
    '{}'::text[],
    '{"phase":"phase12-uat","scenario":"accepted-and-enrolled"}'::jsonb,
    'stsn-website',
    '2026-05-20 09:15:00+08'
  ),
  (
    'OE-UAT-PENDING-001',
    (select id from public.students where legacy_id = 'stud-uat-applicant'),
    'New Student',
    '118877665546',
    '2026-2027',
    'First Semester',
    'Grade 11',
    'STEM',
    'Novaliches Science High School',
    'Novaliches, Quezon City',
    'Jasmine',
    'Serrano',
    'Lopez',
    '2010-11-19',
    'Female',
    'applicant.uat@stsn.edu.ph',
    '+639170200003',
    '#88 Dahlia St., Novaliches, Quezon City',
    'San Bartolome',
    'Quezon City',
    'Metro Manila',
    '1123',
    'Lourdes Serrano',
    'Mother',
    '+639170299992',
    'parent.applicant.uat@stsn.edu.ph',
    '#88 Dahlia St., Novaliches, Quezon City',
    'Pending Registrar Review',
    'Complete',
    '{}'::text[],
    '{"phase":"phase12-uat","scenario":"pending-registrar-review"}'::jsonb,
    'stsn-website',
    '2026-06-03 08:45:00+08'
  )
on conflict (reference_no) do nothing;

insert into public.enrollments (
  legacy_id,
  student_id,
  school_year,
  semester,
  enrollment_type,
  status,
  submitted_at,
  enrollment_source,
  is_online_enrollment,
  online_application_id,
  completion_status,
  missing_fields,
  source_metadata
) values
  (
    'uat-enr-portal',
    (select id from public.students where legacy_id = 'stud-uat-portal'),
    '2026-2027',
    'First Semester',
    'New Student',
    'Partially Paid',
    '2026-05-20 09:20:00+08',
    'Online',
    true,
    (select id from public.online_enrollment_applications where reference_no = 'OE-UAT-ACCEPTED-001'),
    'Complete',
    '{}'::text[],
    '{"phase":"phase12-uat","scenario":"portal-student"}'::jsonb
  ),
  (
    'uat-enr-sibling',
    (select id from public.students where legacy_id = 'stud-uat-sibling'),
    '2026-2027',
    'First Semester',
    'Old Student',
    'Enrolled',
    '2026-05-22 10:10:00+08',
    'Walk-in',
    false,
    null,
    'Complete',
    '{}'::text[],
    '{"phase":"phase12-uat","scenario":"paid-sibling"}'::jsonb
  ),
  (
    'uat-enr-applicant',
    (select id from public.students where legacy_id = 'stud-uat-applicant'),
    '2026-2027',
    'First Semester',
    'New Student',
    'Pending',
    '2026-06-03 08:50:00+08',
    'Online',
    true,
    (select id from public.online_enrollment_applications where reference_no = 'OE-UAT-PENDING-001'),
    'Complete',
    '{}'::text[],
    '{"phase":"phase12-uat","scenario":"pending-applicant"}'::jsonb
  )
on conflict do nothing;

update public.online_enrollment_applications
set enrollment_id = (select id from public.enrollments where legacy_id = 'uat-enr-portal')
where reference_no = 'OE-UAT-ACCEPTED-001'
  and enrollment_id is null;

update public.online_enrollment_applications
set enrollment_id = (select id from public.enrollments where legacy_id = 'uat-enr-applicant')
where reference_no = 'OE-UAT-PENDING-001'
  and enrollment_id is null;

insert into public.enrollment_subjects (enrollment_id, subject_id) values
  ((select id from public.enrollments where legacy_id = 'uat-enr-portal'), (select id from public.subjects where legacy_id = 's-16')),
  ((select id from public.enrollments where legacy_id = 'uat-enr-portal'), (select id from public.subjects where legacy_id = 's-18')),
  ((select id from public.enrollments where legacy_id = 'uat-enr-portal'), (select id from public.subjects where legacy_id = 's-19')),
  ((select id from public.enrollments where legacy_id = 'uat-enr-sibling'), (select id from public.subjects where legacy_id = 's-16')),
  ((select id from public.enrollments where legacy_id = 'uat-enr-sibling'), (select id from public.subjects where legacy_id = 's-18')),
  ((select id from public.enrollments where legacy_id = 'uat-enr-sibling'), (select id from public.subjects where legacy_id = 's-19'))
on conflict do nothing;

insert into public.section_students (section_id, student_id) values
  ((select id from public.sections where legacy_id = 'sec-g11-stem-a'), (select id from public.students where legacy_id = 'stud-uat-portal')),
  ((select id from public.sections where legacy_id = 'sec-g11-stem-a'), (select id from public.students where legacy_id = 'stud-uat-sibling'))
on conflict do nothing;

insert into public.student_guardians
  (legacy_id, student_id, guardian_name, relationship, contact_no, email, address, is_primary)
select
  'sg-demo-parent-enrico',
  s.id,
  'Roberto Veloso (Demo Parent)',
  'Father',
  '+639170099991',
  'parent.demo@stsn.edu.ph',
  '#7 Kingfisher St. Zabarte Subdivision, Novaliches, Quezon City',
  true
from public.students s
where s.legacy_id = 'stud-enrico'
on conflict do nothing;

insert into public.student_guardians
  (legacy_id, student_id, guardian_name, relationship, contact_no, email, address, is_primary)
select
  'sg-demo-parent-clara',
  s.id,
  'Roberto Veloso (Demo Parent)',
  'Father',
  '+639170099991',
  'parent.demo@stsn.edu.ph',
  '#7 Kingfisher St. Zabarte Subdivision, Novaliches, Quezon City',
  false
from public.students s
where s.legacy_id = 'stud-clara'
on conflict do nothing;

insert into public.student_guardians
  (legacy_id, student_id, guardian_name, relationship, contact_no, email, address, is_primary)
select
  'uat-sg-solo-portal',
  s.id,
  'Teresa Veloso (Solo Guardian UAT)',
  'Mother',
  '+639170299991',
  'guardian.solo@stsn.edu.ph',
  '#14 Rosal St., Novaliches, Quezon City',
  true
from public.students s
where s.legacy_id = 'stud-uat-portal'
on conflict do nothing;

insert into public.student_guardians
  (legacy_id, student_id, guardian_name, relationship, contact_no, email, address, is_primary)
select
  'uat-sg-family-portal',
  s.id,
  'Miguel Veloso Sr. (Family Guardian UAT)',
  'Father',
  '+639170299993',
  'guardian.family@stsn.edu.ph',
  '#14 Rosal St., Novaliches, Quezon City',
  true
from public.students s
where s.legacy_id = 'stud-uat-portal'
on conflict do nothing;

insert into public.student_guardians
  (legacy_id, student_id, guardian_name, relationship, contact_no, email, address, is_primary)
select
  'uat-sg-family-sibling',
  s.id,
  'Miguel Veloso Sr. (Family Guardian UAT)',
  'Father',
  '+639170299993',
  'guardian.family@stsn.edu.ph',
  '#14 Rosal St., Novaliches, Quezon City',
  true
from public.students s
where s.legacy_id = 'stud-uat-sibling'
on conflict do nothing;

insert into public.requirements (
  legacy_id,
  student_id,
  name,
  status,
  submitted_date,
  remarks,
  upload_status,
  upload_file_name,
  upload_file_path,
  upload_date,
  verification_status,
  verified_by,
  verified_at,
  hardcopy_submitted,
  hardcopy_submitted_date
) values
  (
    'uat-req-portal-psa',
    (select id from public.students where legacy_id = 'stud-uat-portal'),
    'PSA Birth Certificate',
    'Submitted',
    '2026-05-20',
    'Uploaded during online enrollment.',
    'Uploaded',
    'ariana-veloso-psa.pdf',
    'student-documents/uat/ariana-veloso-psa.pdf',
    '2026-05-20',
    'Verified',
    'Cynthia Ramos, LPT',
    '2026-05-21 09:00:00+08',
    true,
    '2026-05-22'
  ),
  (
    'uat-req-portal-goodmoral',
    (select id from public.students where legacy_id = 'stud-uat-portal'),
    'Good Moral Certificate',
    'Submitted',
    '2026-05-21',
    'Pending registrar hardcopy filing.',
    'Uploaded',
    'ariana-veloso-good-moral.pdf',
    'student-documents/uat/ariana-veloso-good-moral.pdf',
    '2026-05-21',
    'Pending',
    null,
    null,
    false,
    null
  ),
  (
    'uat-req-applicant-psa',
    (select id from public.students where legacy_id = 'stud-uat-applicant'),
    'PSA Birth Certificate',
    'Pending',
    null,
    'Applicant has not yet completed the upload.',
    'Not Uploaded',
    null,
    null,
    null,
    'Pending',
    null,
    null,
    false,
    null
  ),
  (
    'uat-req-applicant-reportcard',
    (select id from public.students where legacy_id = 'stud-uat-applicant'),
    'Form 137 / SF9',
    'Pending',
    null,
    'Required before registrar acceptance.',
    'Not Uploaded',
    null,
    null,
    null,
    'Pending',
    null,
    null,
    false,
    null
  )
on conflict do nothing;

insert into public.assessments (
  legacy_id,
  school_id,
  student_id,
  school_year,
  semester,
  total_amount,
  discount_percentage,
  discount_amount,
  scholarship_name,
  payment_term,
  balance,
  is_paid,
  financial_hold_status,
  last_payment_date,
  books_availed,
  book_package_id,
  approval_status,
  submitted_by,
  submitted_date,
  registrar_remarks,
  accounting_remarks,
  approved_by,
  approved_date
) values
  (
    'uat-asmt-portal',
    (select id from public.schools where legacy_id = 'STSN'),
    (select id from public.students where legacy_id = 'stud-uat-portal'),
    '2026-2027',
    'First Semester',
    23150,
    10,
    2315,
    'Sibling Discount',
    'Quarterly',
    12150,
    false,
    'Hold',
    '2026-06-14',
    true,
    (select id from public.book_packages where legacy_id = 'bp-grade11'),
    'Approved for Payment',
    'Cynthia Ramos, LPT',
    '2026-05-22',
    'All admission requirements checked except Good Moral hardcopy filing.',
    'Quarterly terms approved for demo/UAT.',
    'Eduardo Bonto, CPA',
    '2026-05-23'
  ),
  (
    'uat-asmt-sibling',
    (select id from public.schools where legacy_id = 'STSN'),
    (select id from public.students where legacy_id = 'stud-uat-sibling'),
    '2026-2027',
    'First Semester',
    20835,
    0,
    0,
    null,
    'Cash Basis',
    0,
    true,
    'None',
    '2026-05-24',
    true,
    (select id from public.book_packages where legacy_id = 'bp-grade11'),
    'Approved for Payment',
    'Cynthia Ramos, LPT',
    '2026-05-23',
    'Continuing student billing posted.',
    'Full cash payment received.',
    'Eduardo Bonto, CPA',
    '2026-05-23'
  )
on conflict do nothing;

insert into public.assessment_fees (assessment_id, fee_name, category, amount) values
  ((select id from public.assessments where legacy_id = 'uat-asmt-portal'), 'Tuition Fee', 'Tuition', 18500),
  ((select id from public.assessments where legacy_id = 'uat-asmt-portal'), 'Miscellaneous Fees', 'Miscellaneous', 3480),
  ((select id from public.assessments where legacy_id = 'uat-asmt-portal'), 'Books', 'Books', 1170),
  ((select id from public.assessments where legacy_id = 'uat-asmt-portal'), 'Science / Computer Laboratory', 'Laboratory', 2315),
  ((select id from public.assessments where legacy_id = 'uat-asmt-sibling'), 'Tuition Fee', 'Tuition', 18500),
  ((select id from public.assessments where legacy_id = 'uat-asmt-sibling'), 'Miscellaneous Fees', 'Miscellaneous', 2335)
on conflict do nothing;

insert into public.assessment_audit_trail (legacy_id, assessment_id, action, performed_by, performed_at, details) values
  (
    'uat-asmt-audit-portal-submit',
    (select id from public.assessments where legacy_id = 'uat-asmt-portal'),
    'Submitted for Accounting Approval',
    'Cynthia Ramos, LPT',
    '2026-05-22 11:10:00+08',
    'Portal UAT assessment endorsed by Registrar.'
  ),
  (
    'uat-asmt-audit-portal-approve',
    (select id from public.assessments where legacy_id = 'uat-asmt-portal'),
    'Approved for Payment',
    'Eduardo Bonto, CPA',
    '2026-05-23 09:00:00+08',
    'Quarterly payment arrangement approved for Phase 12 UAT.'
  ),
  (
    'uat-asmt-audit-sibling-approve',
    (select id from public.assessments where legacy_id = 'uat-asmt-sibling'),
    'Approved for Payment',
    'Eduardo Bonto, CPA',
    '2026-05-23 09:10:00+08',
    'Sibling assessment approved and settled in full.'
  )
on conflict do nothing;

insert into public.payments (
  legacy_id,
  school_id,
  student_id,
  assessment_id,
  amount,
  payment_date,
  payment_method,
  or_number,
  term,
  remarks
) values
  (
    'uat-pay-portal-1',
    (select id from public.schools where legacy_id = 'STSN'),
    (select id from public.students where legacy_id = 'stud-uat-portal'),
    (select id from public.assessments where legacy_id = 'uat-asmt-portal'),
    6000,
    '2026-05-24 10:20:00+08',
    'Cash',
    'OR-UAT-0001',
    'Downpayment',
    'Initial cashier payment after approved assessment.'
  ),
  (
    'uat-pay-portal-2',
    (select id from public.schools where legacy_id = 'STSN'),
    (select id from public.students where legacy_id = 'stud-uat-portal'),
    (select id from public.assessments where legacy_id = 'uat-asmt-portal'),
    5000,
    '2026-06-14 14:35:00+08',
    'GCash',
    'OR-UAT-0002',
    'Installment',
    'Second installment posted for outstanding-balance scenario.'
  ),
  (
    'uat-pay-sibling-1',
    (select id from public.schools where legacy_id = 'STSN'),
    (select id from public.students where legacy_id = 'stud-uat-sibling'),
    (select id from public.assessments where legacy_id = 'uat-asmt-sibling'),
    20835,
    '2026-05-24 15:05:00+08',
    'Cash',
    'OR-UAT-0003',
    'Full Payment',
    'Fully paid sibling scenario for cashiering and guardian finance snapshot.'
  )
on conflict do nothing;

insert into public.student_ledger_summaries (
  student_id,
  school_year,
  total_assessed,
  total_paid,
  discount_applied,
  balance,
  financial_hold_status,
  clearance_status,
  last_payment_date
) values
  (
    (select id from public.students where legacy_id = 'stud-uat-portal'),
    '2026-2027',
    23150,
    11000,
    2315,
    12150,
    'Hold',
    'Not Cleared',
    '2026-06-14'
  ),
  (
    (select id from public.students where legacy_id = 'stud-uat-sibling'),
    '2026-2027',
    20835,
    20835,
    0,
    0,
    'None',
    'Cleared',
    '2026-05-24'
  )
on conflict (student_id, school_year) do nothing;

insert into public.ledger_transactions
  (legacy_id, student_id, date, description, type, debit, credit, balance, reference)
values
  (
    'uat-ledger-portal-1',
    (select id from public.students where legacy_id = 'stud-uat-portal'),
    '2026-05-23',
    'First Semester assessment posted',
    'Assessment',
    23150,
    0,
    23150,
    'ASMT-UAT-PORTAL'
  ),
  (
    'uat-ledger-portal-2',
    (select id from public.students where legacy_id = 'stud-uat-portal'),
    '2026-05-24',
    'Downpayment received',
    'Payment',
    0,
    6000,
    17150,
    'OR-UAT-0001'
  ),
  (
    'uat-ledger-portal-3',
    (select id from public.students where legacy_id = 'stud-uat-portal'),
    '2026-06-14',
    'Second installment received',
    'Payment',
    0,
    5000,
    12150,
    'OR-UAT-0002'
  ),
  (
    'uat-ledger-sibling-1',
    (select id from public.students where legacy_id = 'stud-uat-sibling'),
    '2026-05-23',
    'First Semester assessment posted',
    'Assessment',
    20835,
    0,
    20835,
    'ASMT-UAT-SIBLING'
  ),
  (
    'uat-ledger-sibling-2',
    (select id from public.students where legacy_id = 'stud-uat-sibling'),
    '2026-05-24',
    'Full cash settlement',
    'Payment',
    0,
    20835,
    0,
    'OR-UAT-0003'
  )
on conflict do nothing;

insert into public.financial_holds
  (legacy_id, student_id, hold_type, hold_category, reason, balance_amount, created_by, status, created_at)
values
  (
    'uat-hold-portal',
    (select id from public.students where legacy_id = 'stud-uat-portal'),
    'COR',
    'Unpaid Balance',
    'COR release is held until the quarterly balance is reduced below the agreed threshold.',
    12150,
    'Accounting Office',
    'Active',
    '2026-06-15 09:00:00+08'
  )
on conflict do nothing;

insert into public.assessment_billing_summaries
  (legacy_id, student_id, school_year, semester, academic_unit, fee_template_name, total_assessment, amount_due, balance, status)
values
  (
    'uat-bill-portal',
    (select id from public.students where legacy_id = 'stud-uat-portal'),
    '2026-2027',
    'First Semester',
    'basic-ed',
    'Grade 11 STEM Quarterly UAT Template',
    23150,
    12150,
    12150,
    'Approved'
  ),
  (
    'uat-bill-sibling',
    (select id from public.students where legacy_id = 'stud-uat-sibling'),
    '2026-2027',
    'First Semester',
    'basic-ed',
    'Grade 11 STEM Cash Basis UAT Template',
    20835,
    0,
    0,
    'Approved'
  )
on conflict do nothing;

insert into public.payment_collection_summaries
  (legacy_id, student_id, amount, payment_method, reference_no, payment_date, cashier, term, verification_status)
values
  (
    'uat-pcs-portal-1',
    (select id from public.students where legacy_id = 'stud-uat-portal'),
    6000,
    'Cash',
    'OR-UAT-0001',
    '2026-05-24 10:20:00+08',
    'Maria Santos',
    'Downpayment',
    'Verified'
  ),
  (
    'uat-pcs-portal-2',
    (select id from public.students where legacy_id = 'stud-uat-portal'),
    5000,
    'GCash',
    'OR-UAT-0002',
    '2026-06-14 14:35:00+08',
    'Maria Santos',
    'Installment',
    'Verified'
  ),
  (
    'uat-pcs-sibling-1',
    (select id from public.students where legacy_id = 'stud-uat-sibling'),
    20835,
    'Cash',
    'OR-UAT-0003',
    '2026-05-24 15:05:00+08',
    'Maria Santos',
    'Full Payment',
    'Verified'
  )
on conflict do nothing;

insert into public.promissory_notes
  (legacy_id, student_id, amount, due_date, status)
values
  (
    'uat-pnote-portal',
    (select id from public.students where legacy_id = 'stud-uat-portal'),
    12150,
    '2026-08-15',
    'Active'
  )
on conflict do nothing;

insert into public.discount_requests (
  legacy_id,
  reference_no,
  student_id,
  discount_type_id,
  requested_by,
  requested_at,
  status,
  sibling_student_ids,
  sibling_names,
  level1_status,
  level1_approved_by,
  level1_approved_at,
  level2_status,
  level2_approved_by,
  level2_approved_at,
  remarks,
  attachment_names
) values
  (
    'uat-disc-portal',
    'DISC-UAT-001',
    (select id from public.students where legacy_id = 'stud-uat-portal'),
    (select id from public.discount_types where legacy_id = 'dt-sib-2'),
    'Teresa Veloso',
    '2026-05-21 15:00:00+08',
    'Approved',
    array[(select id from public.students where legacy_id = 'stud-uat-sibling')],
    array['Marco Veloso'],
    'Approved',
    'Cynthia Ramos, LPT',
    '2026-05-22 08:00:00+08',
    'Approved',
    'Eduardo Bonto, CPA',
    '2026-05-22 13:00:00+08',
    'Approved sibling discount for Phase 12 UAT family scenario.',
    array['sibling-certification.pdf']
  )
on conflict do nothing;

insert into public.discount_request_audit_trail
  (legacy_id, discount_request_id, action, performed_by, performed_at, details)
values
  (
    'uat-disc-audit-1',
    (select id from public.discount_requests where legacy_id = 'uat-disc-portal'),
    'Submitted',
    'Teresa Veloso',
    '2026-05-21 15:00:00+08',
    'Sibling discount request filed with supporting attachment.'
  ),
  (
    'uat-disc-audit-2',
    (select id from public.discount_requests where legacy_id = 'uat-disc-portal'),
    'Approved',
    'Eduardo Bonto, CPA',
    '2026-05-22 13:00:00+08',
    'Approved through registrar/accounting review path.'
  )
on conflict do nothing;

insert into public.class_schedules (
  legacy_id,
  subject_id,
  teacher_id,
  section,
  room_name,
  day,
  start_time,
  end_time,
  school_year,
  semester,
  is_active,
  department,
  year_level,
  course_or_track,
  notes
) values
  (
    'uat-csched-portal-oralcom-mon',
    (select id from public.subjects where legacy_id = 's-16'),
    (select id from public.teachers where legacy_id = 'teach-elena'),
    'St. Thomas',
    'Room 201',
    'Monday',
    '08:00',
    '09:30',
    '2026-2027',
    'First Semester',
    true,
    'Basic Education',
    'Grade 11',
    'STEM',
    'Phase 12 parent/student portal schedule context.'
  ),
  (
    'uat-csched-portal-genmath-tue',
    (select id from public.subjects where legacy_id = 's-18'),
    (select id from public.teachers where legacy_id = 'teach-beatriz'),
    'St. Thomas',
    'Math Lab B',
    'Tuesday',
    '08:30',
    '10:00',
    '2026-2027',
    'First Semester',
    true,
    'Basic Education',
    'Grade 11',
    'STEM',
    'Phase 12 parent/student portal schedule context.'
  ),
  (
    'uat-csched-portal-statprob-thu',
    (select id from public.subjects where legacy_id = 's-19'),
    (select id from public.teachers where legacy_id = 'teach-beatriz'),
    'St. Thomas',
    'Room 201',
    'Thursday',
    '10:15',
    '11:45',
    '2026-2027',
    'First Semester',
    true,
    'Basic Education',
    'Grade 11',
    'STEM',
    'Phase 12 parent/student portal schedule context.'
  )
on conflict do nothing;

insert into public.subject_class_loads
  (legacy_id, teacher_id, subject_id, section_id, department, school_year, semester)
values
  (
    'uat-load-genmath',
    (select id from public.teachers where legacy_id = 'teach-beatriz'),
    (select id from public.subjects where legacy_id = 's-18'),
    (select id from public.sections where legacy_id = 'sec-g11-stem-a'),
    'Basic Education',
    '2026-2027',
    'First Semester'
  ),
  (
    'uat-load-oralcom',
    (select id from public.teachers where legacy_id = 'teach-elena'),
    (select id from public.subjects where legacy_id = 's-16'),
    (select id from public.sections where legacy_id = 'sec-g11-stem-a'),
    'Basic Education',
    '2026-2027',
    'First Semester'
  )
on conflict do nothing;

insert into public.class_load_students (class_load_id, student_id) values
  ((select id from public.subject_class_loads where legacy_id = 'uat-load-genmath'), (select id from public.students where legacy_id = 'stud-uat-portal')),
  ((select id from public.subject_class_loads where legacy_id = 'uat-load-genmath'), (select id from public.students where legacy_id = 'stud-uat-sibling')),
  ((select id from public.subject_class_loads where legacy_id = 'uat-load-oralcom'), (select id from public.students where legacy_id = 'stud-uat-portal')),
  ((select id from public.subject_class_loads where legacy_id = 'uat-load-oralcom'), (select id from public.students where legacy_id = 'stud-uat-sibling'))
on conflict do nothing;

insert into public.grade_periods
  (legacy_id, label, subject_id, section_id, school_year, teacher_id, is_finalized, finalized_at, finalized_by)
values
  (
    'uat-gp-genmath-q1',
    '1st Quarter',
    (select id from public.subjects where legacy_id = 's-18'),
    (select id from public.sections where legacy_id = 'sec-g11-stem-a'),
    '2026-2027',
    (select id from public.teachers where legacy_id = 'teach-beatriz'),
    true,
    '2026-07-30 16:30:00+08',
    'Beatriz Cruz'
  ),
  (
    'uat-gp-oralcom-q1',
    '1st Quarter',
    (select id from public.subjects where legacy_id = 's-16'),
    (select id from public.sections where legacy_id = 'sec-g11-stem-a'),
    '2026-2027',
    (select id from public.teachers where legacy_id = 'teach-elena'),
    true,
    '2026-07-30 16:45:00+08',
    'Elena Soriano'
  )
on conflict do nothing;

insert into public.grade_categories (grade_period_id, name, weight) values
  ((select id from public.grade_periods where legacy_id = 'uat-gp-genmath-q1'), 'Quizzes', 40),
  ((select id from public.grade_periods where legacy_id = 'uat-gp-genmath-q1'), 'Performance Tasks', 60),
  ((select id from public.grade_periods where legacy_id = 'uat-gp-oralcom-q1'), 'Activities', 50),
  ((select id from public.grade_periods where legacy_id = 'uat-gp-oralcom-q1'), 'Projects', 50)
on conflict do nothing;

insert into public.grade_items
  (legacy_id, grade_period_id, label, category, max_score, sort_order, due_date)
values
  (
    'uat-gi-genmath-quiz1',
    (select id from public.grade_periods where legacy_id = 'uat-gp-genmath-q1'),
    'Functions Quiz 1',
    'Quizzes',
    50,
    1,
    '2026-07-08'
  ),
  (
    'uat-gi-genmath-pt1',
    (select id from public.grade_periods where legacy_id = 'uat-gp-genmath-q1'),
    'Problem Solving Performance Task',
    'Performance Tasks',
    100,
    2,
    '2026-07-15'
  ),
  (
    'uat-gi-oralcom-act1',
    (select id from public.grade_periods where legacy_id = 'uat-gp-oralcom-q1'),
    'Speech Activity 1',
    'Activities',
    50,
    1,
    '2026-07-09'
  ),
  (
    'uat-gi-oralcom-proj1',
    (select id from public.grade_periods where legacy_id = 'uat-gp-oralcom-q1'),
    'Prepared Speech Project',
    'Projects',
    100,
    2,
    '2026-07-18'
  )
on conflict do nothing;

insert into public.student_grade_entries
  (legacy_id, grade_period_id, student_id, grade_item_id, score)
values
  (
    'uat-sge-genmath-portal-q1',
    (select id from public.grade_periods where legacy_id = 'uat-gp-genmath-q1'),
    (select id from public.students where legacy_id = 'stud-uat-portal'),
    (select id from public.grade_items where legacy_id = 'uat-gi-genmath-quiz1'),
    46
  ),
  (
    'uat-sge-genmath-portal-pt1',
    (select id from public.grade_periods where legacy_id = 'uat-gp-genmath-q1'),
    (select id from public.students where legacy_id = 'stud-uat-portal'),
    (select id from public.grade_items where legacy_id = 'uat-gi-genmath-pt1'),
    93
  ),
  (
    'uat-sge-oralcom-portal-act1',
    (select id from public.grade_periods where legacy_id = 'uat-gp-oralcom-q1'),
    (select id from public.students where legacy_id = 'stud-uat-portal'),
    (select id from public.grade_items where legacy_id = 'uat-gi-oralcom-act1'),
    45
  ),
  (
    'uat-sge-oralcom-portal-proj1',
    (select id from public.grade_periods where legacy_id = 'uat-gp-oralcom-q1'),
    (select id from public.students where legacy_id = 'stud-uat-portal'),
    (select id from public.grade_items where legacy_id = 'uat-gi-oralcom-proj1'),
    95
  )
on conflict do nothing;

insert into public.grades
  (legacy_id, student_id, subject_id, teacher_id, school_year, semester, midterm_grade, final_grade, remarks)
values
  (
    'uat-grade-portal-oralcom',
    (select id from public.students where legacy_id = 'stud-uat-portal'),
    (select id from public.subjects where legacy_id = 's-16'),
    (select id from public.teachers where legacy_id = 'teach-elena'),
    '2026-2027',
    'First Semester',
    89,
    91,
    'Passed'
  ),
  (
    'uat-grade-portal-genmath',
    (select id from public.students where legacy_id = 'stud-uat-portal'),
    (select id from public.subjects where legacy_id = 's-18'),
    (select id from public.teachers where legacy_id = 'teach-beatriz'),
    '2026-2027',
    'First Semester',
    87,
    90,
    'Passed'
  ),
  (
    'uat-grade-portal-statprob',
    (select id from public.students where legacy_id = 'stud-uat-portal'),
    (select id from public.subjects where legacy_id = 's-19'),
    (select id from public.teachers where legacy_id = 'teach-beatriz'),
    '2026-2027',
    'First Semester',
    88,
    92,
    'Passed'
  ),
  (
    'uat-grade-sibling-oralcom',
    (select id from public.students where legacy_id = 'stud-uat-sibling'),
    (select id from public.subjects where legacy_id = 's-16'),
    (select id from public.teachers where legacy_id = 'teach-elena'),
    '2026-2027',
    'First Semester',
    85,
    87,
    'Passed'
  ),
  (
    'uat-grade-sibling-genmath',
    (select id from public.students where legacy_id = 'stud-uat-sibling'),
    (select id from public.subjects where legacy_id = 's-18'),
    (select id from public.teachers where legacy_id = 'teach-beatriz'),
    '2026-2027',
    'First Semester',
    84,
    86,
    'Passed'
  )
on conflict do nothing;

insert into public.student_attendance
  (legacy_id, student_id, section, date, status, recorded_by)
values
  (
    'uat-att-portal-0811',
    (select id from public.students where legacy_id = 'stud-uat-portal'),
    'St. Thomas',
    '2026-08-11',
    'Present',
    (select id from public.teachers where legacy_id = 'teach-beatriz')
  ),
  (
    'uat-att-portal-0812',
    (select id from public.students where legacy_id = 'stud-uat-portal'),
    'St. Thomas',
    '2026-08-12',
    'Late',
    (select id from public.teachers where legacy_id = 'teach-beatriz')
  ),
  (
    'uat-att-portal-0813',
    (select id from public.students where legacy_id = 'stud-uat-portal'),
    'St. Thomas',
    '2026-08-13',
    'Absent',
    (select id from public.teachers where legacy_id = 'teach-beatriz')
  )
on conflict do nothing;

insert into public.student_health_profiles
  (legacy_id, student_id, blood_type, allergies, chronic_conditions, emergency_contact, emergency_phone, updated_by)
values
  (
    'uat-health-portal',
    (select id from public.students where legacy_id = 'stud-uat-portal'),
    'O+',
    array['Dust'],
    array[]::text[],
    'Teresa Veloso',
    '+639170299991',
    'Nurse Reyes'
  )
on conflict do nothing;

insert into public.clinic_visits
  (legacy_id, student_id, school_id, visit_date, visit_time, chief_complaint, vital_signs, action_taken, disposition, recorded_by, notes)
values
  (
    'uat-clinic-portal-1',
    (select id from public.students where legacy_id = 'stud-uat-portal'),
    (select id from public.schools where legacy_id = 'STSN'),
    '2026-08-14',
    '09:15:00',
    'Mild headache before first period',
    '{"temperature":"36.9 C","pulse_rate":"80 bpm"}'::jsonb,
    'Observed for 20 minutes and hydrated.',
    'Released',
    'Nurse Reyes',
    'Returned to class after rest.'
  )
on conflict do nothing;

insert into public.guidance_sessions
  (legacy_id, student_id, school_id, session_date, session_type, concern_area, summary, recommendations, next_session, counselor_name, is_confidential, status)
values
  (
    'uat-guidance-portal-1',
    (select id from public.students where legacy_id = 'stud-uat-portal'),
    (select id from public.schools where legacy_id = 'STSN'),
    '2026-08-20',
    'Individual',
    'Academic',
    'Quarterly check-in regarding time management and math performance.',
    'Maintain adviser consultation every two weeks until balance and grades stabilize.',
    '2026-09-03',
    'Grace Villanueva, RGC',
    true,
    'Completed'
  )
on conflict do nothing;

insert into public.consultation_appointments
  (legacy_id, school_id, student_id, teacher_id, requested_by, requestor_role, purpose, appointment_date, appointment_time, venue, status, teacher_notes)
values
  (
    'uat-consult-portal-1',
    (select id from public.schools where legacy_id = 'STSN'),
    (select id from public.students where legacy_id = 'stud-uat-portal'),
    (select id from public.teachers where legacy_id = 'teach-beatriz'),
    'Teresa Veloso',
    'Parent',
    'Follow-up on quarterly balance, attendance, and General Mathematics progress.',
    '2026-08-25',
    '13:30:00',
    'Guidance Room 2',
    'Confirmed',
    'Please bring latest OR copy and note of attendance concerns.'
  )
on conflict do nothing;

insert into public.announcements
  (legacy_id, title, content, date, category, author)
values
  (
    'uat-ann-school',
    'Phase 12 UAT School Opening Advisory',
    'School-wide UAT advisory: verify dashboards, records, portals, and reports against the refreshed Phase 12 demo dataset before sharing screenshots or exports.',
    '2026-07-01',
    'General',
    'Admin QA'
  ),
  (
    'uat-ann-urgent',
    'URGENT: Finance Follow-Up for Quarterly Accounts',
    'Urgent demo notice for cashiering and guardian finance checks: accounts with quarterly balances should remain visible until all posted receipts are reflected.',
    '2026-07-05',
    'Billing',
    'Accounting Office'
  ),
  (
    'uat-ann-parent',
    'Parent Conference Week Reminder',
    'Parent-facing reminder used for Guardian Portal UAT. Confirm linked children, consultation notices, and finance summaries before the conference window.',
    '2026-07-10',
    'Academic',
    'Registrar Office'
  ),
  (
    'uat-ann-student',
    'Student Portal Grade Review Window',
    'Student-facing reminder used for portal UAT. Review first-quarter grades, uploaded requirements, and current assessment status before adviser consultation.',
    '2026-07-12',
    'Academic',
    'Faculty Office'
  )
on conflict do nothing;

insert into public.activity_logs
  (legacy_id, actor_name, action, subject_label, activity_type)
values
  (
    'uat-act-1',
    'Cynthia Ramos, LPT',
    'Accepted online application and endorsed assessment processing',
    'Ariana Veloso - Grade 11 STEM',
    'enrollment'
  ),
  (
    'uat-act-2',
    'Maria Santos',
    'Posted second quarterly installment receipt',
    'OR-UAT-0002',
    'cashiering'
  ),
  (
    'uat-act-3',
    'Beatriz Cruz',
    'Finalized first-quarter General Mathematics scores',
    'St. Thomas - Grade 11 STEM',
    'grade'
  )
on conflict do nothing;

commit;

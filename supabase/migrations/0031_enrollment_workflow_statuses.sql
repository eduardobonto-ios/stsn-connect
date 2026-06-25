-- ============================================================================
-- STSN Connect - Enrollment Workflow Status Expansion
-- Adds explicit registrar/accounting/cashier handoff statuses.
-- ============================================================================

alter table public.students
  drop constraint if exists students_enrollment_status_check;

alter table public.students
  add constraint students_enrollment_status_check
  check (
    enrollment_status in (
      'Pending',
      'For Assessment',
      'Assessed',
      'For Payment',
      'Partially Paid',
      'Enrolled',
      'Approved',
      'Draft',
      'Rejected',
      'Cancelled',
      'Withdrawn'
    )
  );

alter table public.enrollments
  drop constraint if exists enrollments_status_check;

alter table public.enrollments
  add constraint enrollments_status_check
  check (
    status in (
      'Pending',
      'For Assessment',
      'Assessed',
      'For Payment',
      'Partially Paid',
      'Enrolled',
      'Approved',
      'Rejected',
      'Cancelled',
      'Withdrawn'
    )
  );

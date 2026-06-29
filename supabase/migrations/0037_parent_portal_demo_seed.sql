-- ============================================================================
-- 0037_parent_portal_demo_seed.sql
--
-- Phase 11D — Parent Portal Demo Seed Data
--
-- PURPOSE
--   The Parent Portal (src/features/guardian/pages/GuardianPortalPage.tsx) links a
--   logged-in parent/guardian to student records ONLY by matching the signed-in
--   user's email against public.student_guardians.email (see dataLoader.ts ->
--   studentGuardians, and the email-match logic in GuardianPortalPage). The
--   `student.linkedGuardianIds` path is NOT populated by the data loader, so the
--   email link is the single source of truth for non-admin parent linkage.
--
--   This migration seeds ONE demo parent/guardian account plus the linkage rows
--   that connect that parent to two existing demo students who already have full
--   assessment, payment, grade, requirement, enrollment, and announcement data:
--       - stud-enrico  (STSN, Basic Education, Grade 11 STEM)
--       - stud-clara   (CDSTA, College, BSIT 1st Year)
--
--   No new students, grades, payments, assessments, requirements, or
--   announcements are created — the portal already reads those from existing
--   records once the parent is linked.
--
-- SAFETY
--   * Purely ADDITIVE. No update / delete / truncate of any existing row.
--   * Idempotent: every insert uses `on conflict do nothing` against stable
--     legacy_id unique keys, so re-running is harmless.
--   * Records are clearly marked as demo/QA via legacy_id, name, and email.
--   * Does NOT touch any real production user record (existing users untouched).
--   * No schema changes, no RLS changes, no business logic.
--
-- AUTH NOTE
--   The app login flow (src/components/LoginOverlay.tsx + store.login) authenticates
--   by looking up public.users by email with a client-side demo password
--   ("password123"). It does NOT use Supabase auth.users. Therefore seeding
--   public.users below is sufficient to log in as the demo parent — no auth.users
--   row or manual Supabase Auth user creation is required.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Demo parent/guardian account (role GUARDIAN -> canonical "guardian" ->
--    GUARDIAN_PORTAL navigation; see src/types/role.types.ts).
--    public.users.role is a free-text column (no CHECK constraint), so the
--    GUARDIAN value is accepted without any schema change.
-- ----------------------------------------------------------------------------
insert into public.users (legacy_id, school_id, email, name, role, is_active, avatar_url, department) values
  ('user-demo-guardian',
   (select id from public.schools where legacy_id = 'STSN'),
   'parent.demo@stsn.edu.ph',
   'Roberto Veloso (Demo Parent)',
   'GUARDIAN',
   true,
   '',
   'Parent / Guardian')
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- 2. Parent-to-student linkage rows.
--    The Parent Portal matches normalizeEmail(currentUser.email) against
--    normalizeEmail(student_guardians.email), so the `email` column MUST equal
--    the demo guardian account email above.
--    Existing student_guardians rows (e.g. legacy_id 'sg-1') are left untouched.
-- ----------------------------------------------------------------------------
insert into public.student_guardians
  (legacy_id, student_id, guardian_name, relationship, contact_no, email, address, is_primary)
select
  'sg-demo-parent-enrico',
  s.id,
  'Roberto Veloso (Demo Parent)',
  'Father',
  '+639170000001',
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
  '+639170000001',
  'parent.demo@stsn.edu.ph',
  '#7 Kingfisher St. Zabarte Subdivision, Novaliches, Quezon City',
  false
from public.students s
where s.legacy_id = 'stud-clara'
on conflict do nothing;

-- ============================================================================
-- HOW TO TEST
--   1. Apply this migration (supabase db push / reset, or run the SQL).
--   2. In the app login screen, type email: parent.demo@stsn.edu.ph
--      password: password123  (any password works in demo; the client checks
--      for "password123"). The account is not in the Quick Demo Accounts list
--      by design, so type it manually.
--   3. The Parent Portal loads with two linked children (Enrico Veloso and
--      Maria Clara Dela Cruz). The child switcher, grades, finance, and document
--      tabs are populated from the already-seeded records for those students.
--
-- ADMIN PREVIEW (informational — no change needed here)
--   For role ADMIN the portal renders an "Admin QA / Support View" that lists ALL
--   students regardless of guardian linkage (isAdminQaView in GuardianPortalPage).
--   Admin therefore does NOT require a matching guardian id; forcing parent
--   linkage onto an admin is intentionally avoided. Any further admin-as-parent
--   preview work is deferred to Phase 11E.
-- ============================================================================

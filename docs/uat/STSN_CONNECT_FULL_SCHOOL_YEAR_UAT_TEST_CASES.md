# STSN Connect Full School Year UAT Test Cases

Audit date: 2026-06-30

## 1. Test Preparation

- Environment: local/demo/UAT database only. Never use production data.
- Required migrations: run the Phase 12 transactional reset migration first, then the Phase 12 full-school-year seed migration.
- Demo password for all logins in this repo: `password123`.
- App login source: `public.users` only. Supabase `auth.users` is not required for these demo accounts.
- Seeded role accounts already available or recreated by migrations:
  - `admin@stsn.edu.ph` (`SUPER_ADMIN`)
  - `registrar@stsn.edu.ph` (`REGISTRAR`)
  - `accounting@stsn.edu.ph` (`ACCOUNTING`)
  - `cashier@stsn.edu.ph` (`CASHIER`)
  - `teacher@stsn.edu.ph` (`TEACHER`)
  - `hr@stsn.edu.ph` (`HR`)
  - `payroll@stsn.edu.ph` (`PAYROLL`)
  - `guidance@stsn.edu.ph` (`GUIDANCE`)
  - `nurse@stsn.edu.ph` (`NURSE`)
  - `student@stsn.edu.ph` (`STUDENT`, legacy baseline)
  - `student.uat@stsn.edu.ph` (`STUDENT`, Phase 12 UAT)
  - `parent.demo@stsn.edu.ph` (`GUARDIAN`, existing two-child demo)
  - `guardian.solo@stsn.edu.ph` (`GUARDIAN`, one-child UAT)
  - `guardian.family@stsn.edu.ph` (`GUARDIAN`, two-child UAT)
- Core Phase 12 seeded students:
  - `stud-uat-portal` / `student.uat@stsn.edu.ph`: enrolled Grade 11 STEM, partially paid, portal-ready.
  - `stud-uat-sibling`: enrolled Grade 11 STEM sibling, fully paid.
  - `stud-uat-applicant`: pending registrar-review applicant for admission workflow smoke tests.
- Browser recommendation: Chrome latest on desktop first, then mobile-width responsive verification.
- Device recommendation: at minimum test 1440px desktop and 390px mobile viewport.

## 2. Migration Execution Order

1. Run `supabase/migrations/20260630130000_demo_uat_transactional_reset.sql`.
2. Run `supabase/migrations/20260630131000_demo_uat_full_school_year_seed.sql`.
3. Start the app.
4. Confirm the login screen accepts `password123`.
5. Log in role by role using the accounts listed below.

## 3. Role-Based Login Test

### `SUPER_ADMIN`

- Login: `admin@stsn.edu.ph`
- Expected visible modules: broad admin/staff coverage including Dashboard, Action Center, Registrar, Student Directory, Accounting, Cashier, HR, Payroll, Reports, and Parent Portal.
- Expected hidden behavior: no parent-only restriction.
- Landing smoke test: dashboard loads without broken cards; Parent Portal opens from sidebar.

### `ADMIN`

- Login: `admin@cdsta.edu.ph`
- Expected visible modules: Dashboard, Action Center, Student Directory, HR, Reports, Parent Portal.
- Expected hidden modules: setup, cashier, accounting, payroll management, and staff-only authoring modules excluded by role permissions.
- Landing smoke test: Parent Portal nav is present and opens read-only QA view.

### `REGISTRAR`

- Login: `registrar@stsn.edu.ph`
- Expected visible modules: Registrar, Student Directory, Grading, Curriculum, Faculty Admin, Class Sectioning, Books Setup, Registrar Reports.
- Expected hidden modules: Cashier, Guardian-only navigation, HR-only tools.
- Smoke test: pending online application `OE-UAT-PENDING-001` is visible in relevant enrollment/admission queues if surfaced by the module.

### `ACCOUNTING`

- Login: `accounting@stsn.edu.ph`
- Expected visible modules: Action Center, Accounting, Books Setup.
- Expected hidden modules: Registrar-only admission screens, Guardian-only portal shell.
- Smoke test: UAT assessments, ledger balances, and billing summaries appear without calculation changes.

### `CASHIER`

- Login: `cashier@stsn.edu.ph`
- Expected visible modules: Cashier only.
- Expected hidden modules: Registrar, HR, Guardian, setup modules.
- Smoke test: `OR-UAT-0001`, `OR-UAT-0002`, and `OR-UAT-0003` are visible in receipt/payment history if the page surfaces them.

### `TEACHER`

- Login: `teacher@stsn.edu.ph`
- Expected visible modules: Faculty Portal, Grading, Curriculum, Online Learning.
- Expected hidden modules: Cashier, HR, Guardian, setup modules.
- Smoke test: grading and attendance context for Grade 11 STEM can be opened without errors.

### `HR`

- Login: `hr@stsn.edu.ph`
- Expected visible modules: Action Center, HR Management.
- Expected hidden modules: Registrar, Accounting, Guardian.
- Smoke test: employee records load and unrelated enrollment seed does not break HR dashboards.

### `PAYROLL`

- Login: `payroll@stsn.edu.ph`
- Expected visible modules: Action Center, Payroll Dashboard, Payroll Management.
- Expected hidden modules: Registrar, Cashier, Guardian.
- Smoke test: payroll pages still load and were not modified by the Phase 12 seed.

### `NURSE`

- Login: `nurse@stsn.edu.ph`
- Expected visible modules: Clinic, Clinic Reports.
- Expected hidden modules: Registrar, Cashier, Guardian.
- Smoke test: `uat-clinic-portal-1` and `uat-health-portal` appear in clinic-facing views if surfaced by the page.

### `GUIDANCE`

- Login: `guidance@stsn.edu.ph`
- Expected visible modules: Guidance, Guidance Reports.
- Expected hidden modules: Cashier, Guardian, payroll.
- Smoke test: `uat-guidance-portal-1` appears in guidance-facing views if surfaced by the page.

### `STUDENT`

- Login: `student.uat@stsn.edu.ph`
- Expected visible modules: Student Portal, Consultation.
- Expected hidden modules: all staff/admin modules and Parent Portal.
- Smoke test: Student Portal resolves to Ariana Veloso by email match and shows requirements, grades, and finance data.

### `GUARDIAN`

- Login one-child: `guardian.solo@stsn.edu.ph`
- Login multi-child UAT: `guardian.family@stsn.edu.ph`
- Login legacy multi-child demo: `parent.demo@stsn.edu.ph`
- Expected visible modules: Parent Portal only.
- Expected hidden modules: all staff/admin modules.
- Smoke test: linked-child visibility is based on `student_guardians.email` match and should load immediately after login.

## 4. Enrollment End-to-End Test

1. Log in as `REGISTRAR`.
2. Locate the seeded pending online application `OE-UAT-PENDING-001`.
3. Confirm applicant details are complete enough for review and note current status `Pending Registrar Review`.
4. Verify the related student master row `stud-uat-applicant` is still `Pending`.
5. Review required documents for the applicant and confirm `uat-req-applicant-psa` and `uat-req-applicant-reportcard` are still pending.
6. Accept or advance the applicant through the normal UI workflow if the module supports it.
7. Assign the applicant to the intended grade level/year level and section through the existing Registrar flow.
8. Confirm the student appears in Student Directory after approval/assignment.
9. Verify an enrollment record exists and reflects the correct source/status after your manual action.
10. Open `stud-uat-portal` and verify the already-enrolled UAT student shows the completed path reference state for comparison.
11. Confirm the linked guardian accounts can see the student only after a matching `student_guardians.email` record exists.

## 5. Billing and Payment Test

1. Log in as `ACCOUNTING`.
2. Open the assessment for `stud-uat-portal`.
3. Verify the assessment is already `Approved for Payment` and uses the existing calculations unchanged.
4. Confirm the fee lines match the seeded data and the sibling discount is reflected without manual formula changes.
5. Verify outstanding balance is still visible for `stud-uat-portal`.
6. Log in as `CASHIER`.
7. Confirm the seeded receipts `OR-UAT-0001` and `OR-UAT-0002` are visible for the partial-payment student.
8. Confirm `OR-UAT-0003` is visible for the fully paid sibling scenario.
9. Post one additional manual payment only if you want to test balance reduction behavior; do not alter formulas.
10. Re-open the assessment/ledger and verify outstanding balance updates through existing app logic.
11. Log in as `guardian.family@stsn.edu.ph` and confirm one child shows an outstanding balance while the sibling shows paid/cleared status.
12. Log in as `student.uat@stsn.edu.ph` and confirm finance visibility if the Student Portal exposes it.

## 6. Academic and Grade Test

1. Log in as `TEACHER`.
2. Open Grade 11 STEM context for the Phase 12 UAT student.
3. Verify the seeded class loads `uat-load-genmath` and `uat-load-oralcom` are available if surfaced in the UI.
4. Confirm `uat-gp-genmath-q1` and `uat-gp-oralcom-q1` exist and are finalized.
5. Review seeded grade items and entries for Ariana Veloso.
6. Enter or edit one grade through the normal UI only if needed for manual workflow validation.
7. Finalize/save using the existing grading flow.
8. Log in as `student.uat@stsn.edu.ph` and verify final grades are visible in Student Portal.
9. Log in as `guardian.solo@stsn.edu.ph` and verify academic snapshot cards and grade tables reflect the student data.
10. Confirm no grading formula or pass/fail logic was changed by the seed.

## 7. Attendance Test

1. Log in as `TEACHER`.
2. Open the Faculty attendance workflow for Grade 11 STEM / `St. Thomas`.
3. Confirm seeded records exist for `2026-08-11`, `2026-08-12`, and `2026-08-13` with `Present`, `Late`, and `Absent`.
4. Submit one new attendance date through the existing attendance UI if manual write-path testing is required.
5. Verify no attendance errors occur in the browser console or Supabase writes.
6. Deferred for Guardian/Student portal display: Parent Portal still does not load `student_attendance` through the shared store, so parent-facing attendance visibility remains out of scope for this phase.

## 8. Announcements Test

1. Log in as `SUPER_ADMIN` or the role that manages announcements in your current flow.
2. Verify these seeded announcements exist: `uat-ann-school`, `uat-ann-urgent`, `uat-ann-parent`, `uat-ann-student`.
3. Confirm generic announcement cards render in dashboard/student/guardian contexts where applicable.
4. Note current limitation: DB-backed role targeting is not persisted by `public.announcements` + shared loader yet, so these are content-labeled rather than truly role-filtered server records.
5. If you delete all applicable announcements, verify empty-state presentation remains sane and no broken cards appear.

## 9. Parent Portal Test

1. Log in as `guardian.solo@stsn.edu.ph`.
2. Confirm only Parent Portal appears in the sidebar.
3. Verify the portal opens Ariana Veloso automatically and shows no child switcher issues for a one-child account.
4. Confirm academic snapshot, finance snapshot, tasks, announcements, and documents render from live seeded data.
5. Log out and log in as `guardian.family@stsn.edu.ph`.
6. Verify multiple linked children are available and the child selector switches between Ariana Veloso and Marco Veloso.
7. Confirm one child shows partial/outstanding finance while the sibling shows a paid scenario.
8. Log out and log in as `parent.demo@stsn.edu.ph`.
9. Verify the legacy Phase 11 demo account still links Enrico and Maria Clara through `student_guardians.email`.
10. Confirm no staff-only controls are visible for any guardian account.

## 10. Student Portal Test

1. Log in as `student.uat@stsn.edu.ph`.
2. Confirm the portal resolves to Ariana Veloso by matching student email.
3. Verify overview/profile information is correct.
4. Verify grades display the seeded first-semester results.
5. Verify requirements/documents show one verified and one pending item.
6. Verify finance/ledger data surfaces the partial-payment state if supported by the portal view.
7. Confirm the student does not see admin/staff-only pages or Parent Portal navigation.

## 11. Admin Support Test

1. Log in as `admin@cdsta.edu.ph` or `admin@stsn.edu.ph` if you are using the super-admin account for broader coverage.
2. Confirm Parent Portal is visible in the sidebar.
3. Open Parent Portal and confirm it behaves as a read-only support/QA surface.
4. Confirm Admin can browse student records without exposing hidden staff actions inside the Parent Portal shell.
5. Confirm no unintended parent data leakage appears outside the intended QA view.

## 12. Reports Test

1. Open enrollment/admission reports and confirm UAT application and enrollment data do not break the report surface.
2. Open cashiering/accounting reports and confirm the seeded receipts and balance states appear if those pages read the same tables.
3. Open clinic/guidance reports and confirm the UAT visit/session records are visible if those reports read live data.
4. Open grade/report-card style outputs and confirm seeded grades render without print/export regressions.
5. Confirm print/export behavior is unchanged.

## 13. Regression Checklist

- No old UAT data conflicts remain after reset + seed.
- Sidebar navigation works for all tested roles.
- Active module states still work.
- Dashboard loads.
- Action Center loads.
- Admission/enrollment flows still load.
- Accounting pages still load.
- Cashiering pages still load.
- Student Directory still loads.
- Parent Portal still loads.
- Student Portal still loads.
- Teacher/faculty pages still load.
- Reports still load.
- No broken empty-state cards appear unexpectedly.
- No unexplained hardcoded numbers were added to frontend components.
- No frontend fake data was introduced for this phase.

## 14. Expected Demo Flow

1. Start with `SUPER_ADMIN` dashboard and confirm overall app health.
2. Show the pending online application `OE-UAT-PENDING-001` as Registrar.
3. Open Student Directory and compare applicant vs enrolled UAT student states.
4. Show Accounting assessment for `stud-uat-portal`.
5. Show Cashier receipts and partial/full payment contrast.
6. Show Teacher grading/attendance context.
7. Log in as `student.uat@stsn.edu.ph` and review portal data.
8. Log in as `guardian.family@stsn.edu.ph` and switch between children.
9. Close with reports and Admin Parent Portal support view.

## 15. Known Deferred Items

- Guardian/Student attendance display is deferred because the shared store does not currently hydrate `student_attendance` into those portal pages.
- Database-backed role-targeted announcements are deferred because `public.announcements` does not currently persist/hydrate `targetRoles`, and the shared loader does not hydrate those optional fields from SQL.
- This Phase 12 seed does not create Supabase `auth.users` records because the app does not use them for login.
- Storage bucket/file-object validation is limited to requirement metadata rows; no real document blobs are seeded.
- Payment gateway behavior is not covered because only offline/demo cashiering records exist in the current schema and UI flow.

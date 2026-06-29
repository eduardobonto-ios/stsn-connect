# STSN Connect Phase 8 Data Source and Supabase Audit Tracker

Audit date: 2026-06-30

Status: Completed audit and documentation pass. No UI redesign, routing change, or workflow redesign was performed.

## Scope

Modules reviewed:

- Dashboard
- Action Center
- Admission / Registrar
- Student Directory
- Accounting
- Cashiering
- Payroll
- HR
- Faculty
- Grades Directory
- Curriculum
- Scheduling
- Class Sectioning
- Clinic
- Guidance
- Consultation
- Student Portal
- Guardian Portal
- Online Learning
- User Access / Accounts
- Core Setup
- Books Setup
- Reports

## Files Reviewed

Core data and persistence:

- `src/lib/supabase.ts`
- `src/services/dataLoader.ts`
- `src/services/store.ts`
- `src/services/supabaseCrud.ts`
- `src/services/approvalWorkflowService.ts`
- `src/hooks/useApprovalInbox.ts`
- `src/hooks/usePendingCounts.ts`
- `src/services/mockAssessmentService.ts`

Representative feature pages and report pages:

- `src/features/dashboard/pages/DashboardPage.tsx`
- `src/features/action-center/pages/ActionCenterPage.tsx`
- `src/components/common/ApprovalInbox.tsx`
- `src/features/registrar/pages/RegistrarModulePage.tsx`
- `src/features/student-directory/pages/StudentDirectoryPage.tsx`
- `src/features/accounting/pages/AccountingModulePage.tsx`
- `src/features/accounting/pages/AccountingDashboardPage.tsx`
- `src/features/cashier/pages/CashierModulePage.tsx`
- `src/features/payroll/pages/PayrollDashboardPage.tsx`
- `src/features/hr/pages/HRManagementPage.tsx`
- `src/features/hr/pages/sub-pages/PayrollManagementPage.tsx`
- `src/features/faculty/pages/FacultyPortalPage.tsx`
- `src/features/grading/pages/GradesDirectoryPage.tsx`
- `src/features/curriculum/pages/CurriculumManagementPage.tsx`
- `src/features/scheduling/pages/SchedulingModulePage.tsx`
- `src/features/class-sectioning/pages/ClassSectioningModulePage.tsx`
- `src/features/clinic/pages/ClinicModulePage.tsx`
- `src/features/guidance/pages/GuidanceModulePage.tsx`
- `src/features/consultation/pages/ConsultationModulePage.tsx`
- `src/features/student-portal/pages/StudentPortalPage.tsx`
- `src/features/guardian/pages/GuardianPortalPage.tsx`
- `src/features/online-learning/pages/OnlineLearningPage.tsx`
- `src/features/accounts/pages/AccountsManagementPage.tsx`
- `src/features/core-setup/pages/CoreSetupModulePage.tsx`
- `src/features/books/pages/BooksSetupPage.tsx`
- `src/features/reports/pages/RegistrarReportsPage.tsx`
- `src/features/reports/pages/ClinicReportsPage.tsx`
- `src/features/reports/pages/GuidanceReportsPage.tsx`
- `src/features/reports/pages/AdminReportsPage.tsx`

Relevant schema/migration review:

- `supabase/migrations/0001_schema.sql`
- `supabase/migrations/0003_data.sql`
- `supabase/migrations/0004_additional_data.sql`
- `supabase/migrations/0017_clinic_guidance_consultation.sql`
- `supabase/migrations/0018_guidance_nurse_roles_users.sql`
- `supabase/migrations/0030_online_enrollment_bridge.sql`

## Architecture Summary

- The application is primarily Supabase-backed through `src/services/dataLoader.ts`, which hydrates the shared Zustand store from Supabase tables.
- Most scoped modules read from `useSTSNStore()` and `getAcademicScopedData(...)`, so their page data is database-backed even when a page itself does not call `supabase.from(...)` directly.
- Some modules bypass the shared loader and read dedicated tables directly with `dbSelectAll(...)`; this is still database-backed.
- Several pages still contain prototype/demo/local UI helpers layered on top of real data. These were audited and classified below rather than removed blindly.

## Supabase-Backed Areas

Confirmed as already database-backed through the store loader or direct table reads:

- Dashboard base counts, announcements, events, enrollment history stats, assessments, payments, sections, teachers, employees, leave requests, void requests, discount requests, grade periods.
- Action Center approval inbox via `approval_requests`, `approval_steps`, `approval_actions`, and related approval workflow tables.
- Admission / Registrar core records: students, enrollments, online enrollment applications, requirements, subjects, courses, sections, assessments, setup items, book packages, student guardians.
- Student Directory via scoped `students`.
- Accounting core datasets: assessments, payments, discount types, discount requests, ledger summaries, ledger transactions, financial holds, assessment billing summaries, payment collection summaries, promissory notes.
- Cashiering queue/history/report data via students, assessments, payments, void requests, setup items, and book packages.
- Payroll and HR operational datasets: employees, leave requests, payroll periods, payroll runs, payroll lines, salary payout batches, salary payout lines, benefits, statutory contribution rules, tax tables, tax brackets, recruitment, onboarding, attendance, time logs, shifts, lifecycle records.
- Faculty and grading datasets: teachers, class schedules, activity logs, grade periods, grade categories, grade items, student grade entries, grades, subject class loads.
- Curriculum, scheduling, class sectioning, online learning, core setup, books setup, and user accounts via store-backed tables.
- Clinic via `clinic_visits` and `student_health_profiles`.
- Guidance via `anecdotal_records` and `guidance_sessions`.
- Consultation via `consultation_appointments`.
- Reports pages where report rows are derived from the same store-backed or direct-table-backed datasets above.

## Acceptable Static Config / UI-Only Reference Data

These are static definitions or UI defaults and are acceptable as-is for Phase 8:

- Status badge/config maps, tab lists, icon maps, chart palette constants, and table column definitions across modules.
- Core Setup category metadata in `src/features/core-setup/pages/CoreSetupModulePage.tsx`.
- Books Setup academic unit options and grade-level reference values in `src/features/books/pages/BooksSetupPage.tsx` and `src/config/books.config`.
- Cashiering payment method and remittance-term fallbacks in `src/features/cashier/pages/CashierModulePage.tsx` because they only backfill setup lists when configuration rows are absent.
- Supplier payment term defaults in `src/features/accounting/pages/sub-pages/SupplierManagementPage.tsx` because they behave as a reference fallback merged with configured/setup terms.
- Registrar academic grouping helpers such as `DEFAULT_BE_PROGRAM_CATEGORIES` and Senior High strand fallback labels; these are UI/reference helpers, not transactional records.
- Month labels, day labels, and chart/theme constants in dashboard/payroll analytics components.

## Mock / Local / Hardcoded Data Found

Already reworked to use real Supabase-backed inputs despite legacy naming:

- `src/services/mockAssessmentService.ts`
  Uses Supabase-backed `tuition_fee_schedule`, `misc_fee_schedule`, and `lab_fee_adjustments` slices passed from the store. The file name is legacy, but the fee inputs are no longer hardcoded.

Acceptable local UI-only state:

- `src/features/accounting/pages/AccountingModulePage.tsx`
  Session-only local action state for ledger adjustments and financial-hold toggles is explicitly marked as prototype/session behavior and does not inject fake rows into the underlying store.
- `src/features/guardian/pages/GuardianPortalPage.tsx`
  `consultRequested` is a local success-state flag only; it does not persist a consultation row.
- `src/features/student-portal/pages/StudentPortalPage.tsx`
  Profile success banners and local form state are UI-only and acceptable.

Problematic or audit-worthy mock/local behavior still present:

- `src/features/student-portal/pages/StudentPortalPage.tsx`
  `auditLogs` is seeded with hardcoded local sample entries.
- `src/features/student-portal/pages/StudentPortalPage.tsx`
  Grade-row quarter values fall back to fake values (`85`, `87`, plus derived `q3`/`q4`) when real grade detail is missing.
- `src/features/student-portal/pages/StudentPortalPage.tsx`
  `overrideSettleBalance` can locally mark balances as resolved and append a synthetic payment-history row.
- `src/features/student-portal/pages/StudentPortalPage.tsx`
  Assessment preview still displays explicit demo messaging and computes a provisional fee schedule from standard schedules instead of a persisted finalized assessment in some paths.
- `src/features/registrar/pages/RegistrarModulePage.tsx`
  Uses a computed fallback assessment preview (`mockFallbackAssessment` / `effectiveAssessment`) for estimation when working from setup schedules rather than a finalized persisted assessment record.
- `src/features/dashboard/pages/DashboardPage.tsx`
  Several executive KPI subtitles are static marketing text such as `+6% than last month` and `-3% than last month`.
- `src/features/dashboard/pages/DashboardPage.tsx`
  Finance trend chart uses hardcoded multiplier arrays applied to average payments (`dailyIncome`, `dailyExpenses`) instead of true daily ledger aggregates.
- `src/features/dashboard/pages/DashboardPage.tsx`
  Annual enrollment chart falls back to a synthetic `2026-2027` row when `enrollmentHistoryStats` is empty.
- `src/features/dashboard/pages/DashboardPage.tsx`
  Enrollment promo card text is fixed to `Open Enrollment for A.Y. 2026-2027`.
- `src/features/accounting/pages/AccountingModulePage.tsx`
  “Today” collection uses “most recent payment date in the dataset” as a prototype surrogate rather than real current-date posting logic.
- `src/features/guardian/pages/GuardianPortalPage.tsx`
  Consultation request CTA is local-only and does not create a real `consultation_appointments` row.

## Module Classification

Already Supabase/database-backed:

- Action Center
- Admission / Registrar core records
- Student Directory
- Accounting base datasets
- Cashiering
- Payroll
- HR
- Faculty
- Grades Directory
- Curriculum
- Scheduling
- Class Sectioning
- Clinic
- Guidance
- Consultation
- Online Learning
- User Access / Accounts
- Core Setup
- Books Setup
- Reports

Supabase-backed with notable local/demo overlays still present:

- Dashboard
- Student Portal
- Guardian Portal
- Selected Accounting dashboard/action affordances
- Registrar assessment-preview flow

## Migration Needs Identified

Clear schema gap identified:

- Guardian Portal currently filters students by `student.linkedGuardianIds`, but the audited Supabase load path does not hydrate that field and the reviewed schema/migrations define `student_guardians` records without a user-account linkage column.
- Result: the Guardian Portal is not fully wired to a durable database relationship between guardian users and student records, even though guardian contact data exists.

Assessment of migration need:

- A guardian-user-to-student relationship is needed to make the Guardian Portal truly database-backed.
- The exact canonical design is not fully established in the current code/schema. Viable directions include:
  - adding a nullable `user_id` foreign key on `student_guardians`
  - introducing a dedicated guardian-student linking table
  - persisting `linked_guardian_ids` on `students` and hydrating it in `dataLoader`

Phase 8 decision:

- No migration was created in this pass because the correct canonical relationship model is a product/data-design decision, not a blind mock-removal task.
- This should be resolved in the next backend-focused phase before claiming Guardian Portal as fully Supabase-wired.

## Migrations Created

- None.

## Behavior Preserved

- No UI redesign was performed.
- No routing changes were made.
- No business logic for approvals, payments, enrollment, grading, payroll, accounting, or permissions was changed.
- No fake/mock data was added.
- No Supabase migrations were added in this pass.

## Validation Results

- `npm.cmd run lint`
  Passed on 2026-06-30 via `tsc --noEmit`.
- `npm.cmd run build`
  Passed on 2026-06-30 after rerunning outside the sandbox because the initial sandboxed Vite/esbuild attempt failed on filesystem access, not on application code.
- Build output:
  - production build completed successfully
  - Vite reported a large-chunk warning for the main JS bundle, but this is a performance warning, not a Phase 8 functional regression

Validation confirmation:

- App build completed successfully.
- No UI redesign was done in this phase.
- No routing was changed in this phase.
- No business logic was changed in this phase.
- No fake/mock data was added in this phase.
- No migration was created outside `supabase/migrations`.

## Recommendation For Phase 9

- Replace provisional/demo-only Student Portal overlays with persisted data sources:
  - real audit/activity log source
  - real installment/payment-status rows
  - no local “resolve mock balance” toggle in production paths
- Replace Dashboard synthetic trend math with true daily/monthly aggregates sourced from Supabase tables or SQL views.
- Resolve Guardian Portal linkage with a canonical guardian-user relationship in Supabase, then hydrate that relationship in `dataLoader`.
- Review Accounting prototype-only action state and decide which actions should persist to dedicated tables versus remain explicitly non-persistent admin tools.

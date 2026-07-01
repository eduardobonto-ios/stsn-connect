# STSN Connect Full Database Architecture Audit

## 1. Executive Summary

This audit reviewed the full `supabase/migrations` folder, treated `combined_migration.sql` as a duplicate rollup artifact instead of a source of truth, and cross-checked the current frontend/backend pages in `src/`.

Current conclusion:

- The project already has a broad multi-module Supabase schema covering core, academics, enrollment, assessment, cashiering, accounting, books, grades, clinic/guidance, faculty/employee profile extensions, HR, payroll, parent portal demo linkage, registrar import staging, and the centralized approval workflow.
- The main risk is not missing base tables. The main risk is uneven page alignment: some pages are well aligned to existing tables, while others still use mock logic, local-only workflow state, hardcoded dropdowns, or summary/legacy tables instead of the newer normalized structure.
- Several overlap areas already exist and should not be recreated: `payroll` vs `payroll_runs/payroll_lines`, `schedules` vs `class_schedules`, `grades` vs `grade_periods/*`, `assessment_discount_options` vs `discount_types`, and summary tables vs transactional tables.
- Newer schema areas exist but are only partially wired into the app surface: approvals, registrar import staging, registrar profile extension, payroll benefit/tax profile tables, and some clinic/guidance/consultation data paths.
- No confirmed destructive schema gap was found that requires an immediate migration in this audit run.

**Decision:** `No new migration is recommended at this time.`

## 2. Migration Files Inspected

Reviewed from `supabase/migrations`:

- `0001_schema.sql`
- `0002_rls.sql`
- `0003_data.sql`
- `0004_additional_data.sql`
- `0005_basic_ed_tuition_fee_items.sql`
- `0006_accounting_coa_cost_centers_journal_entries.sql`
- `0007_accounting_rls.sql`
- `0008_accounting_journal_entries_seed.sql`
- `0009_accounting_suppliers.sql`
- `0010_accounting_items.sql`
- `0011_accounting_sales_invoices.sql`
- `0012_accounting_purchase_invoices.sql`
- `0013_student_document_storage.sql`
- `0014_accounting_phase4_aging_reports.sql`
- `0015_accounting_post_aging_demo_invoices.sql`
- `0016_student_attendance.sql`
- `0017_clinic_guidance_consultation.sql`
- `0018_guidance_nurse_roles_users.sql`
- `0019_relax_payment_setup_constraints.sql`
- `0020_hr_module_expansion.sql`
- `0021_fix_student_school_ids.sql`
- `0024_hr_module_rls.sql`
- `0025_hr_module_seed_data.sql`
- `0026_hr_demo_data_optional.sql`
- `0027_registrar_student_import_staging.sql`
- `0028_registrar_student_import_rls.sql`
- `0029_payroll_role_users.sql`
- `0030_online_enrollment_bridge.sql`
- `0031_enrollment_workflow_statuses.sql`
- `0032_statutory_contribution_rule_seed.sql`
- `0033_withholding_tax_table_seed.sql`
- `0034_approval_workflow_engine.sql`
- `0035_admin_role_rls.sql`
- `0036_grade_period_workflow_status.sql`
- `0037_parent_portal_demo_seed.sql`
- `20260630130000_demo_uat_transactional_reset.sql`
- `20260630131000_demo_uat_full_school_year_seed.sql`
- `20260630132000_student_profile_guardian_education_schema.sql`
- `20260630133000_faculty_employee_profile_schema.sql`
- `20260630140000_hr_payroll_reference_setup_items_seed.sql`
- `combined_migration.sql`

Notes:

- `combined_migration.sql` duplicates earlier schema/seed content and should not be used as evidence that a table is missing or should be recreated.
- The `20260630130000_*` and `20260630131000_*` migrations appear demo/UAT oriented rather than foundational schema drivers.

## 3. Current Database Architecture By Module

### Core / System

- Core master tables exist: `schools`, `users`, `setup_items`, `activity_logs`.
- Broad development-mode RLS exists across the original base schema and newer modules.
- Admin-specific RLS boundaries were added later in `0035_admin_role_rls.sql`.
- Role and permission metadata is partly in `users.role` and partly in `setup_items` categories such as `roles_setup` and `permissions_setup`.

### Academic Setup

- Normalized academic setup is present for courses, subjects, curriculums, curriculum-subject mapping, sections, section-student mapping, rooms, class schedules, subject class loads, and class load students.
- There is still a legacy flat schedule table (`schedules`) alongside the normalized schedule model (`class_schedules`).

### Student Profile

- Base student identity is in `students`.
- Profile extensions exist for `student_guardians`, `student_education_backgrounds`, `student_health_profiles`, `student_registrar_profiles`, and `requirements`.
- Student document storage was extended with `requirements.upload_file_path` plus a private bucket.

### Enrollment

- Core enrollment tables exist: `enrollments`, `enrollment_subjects`.
- Online/public submission bridge exists in `online_enrollment_applications`.
- Workflow statuses were expanded in `0031`.
- Historical counts exist in `enrollment_history_stats`.

### Assessment / Billing / Cashiering

- Core assessment, fee lines, audit trail, payments, ledger summaries, ledger transactions, financial holds, promissory notes, and billing/payment summaries all exist.
- Assessment quick-quote reference tables exist separately from governance-grade discount tables.

### Discounts / Vouchers / Approvals

- `discount_types`, `discount_requests`, `discount_request_audit_trail` exist.
- Central approval engine exists with request, steps, actions, comments, attachments, delegations, SLA rules, and workflow step configs.
- No dedicated voucher table was found in the reviewed migrations.

### Accounting

- Core accounting tables exist for chart of accounts, cost centers, journal entries and lines, suppliers, items, sales invoices and lines, purchase invoices and lines.
- Aging-report and demo invoice migrations are present.

### Books / Fees / Items

- Books and fee engine support exists: `book_packages`, `book_package_items`, `tuition_fee_schedule`, `misc_fee_schedule`, `lab_fee_adjustments`, `assessment_discount_options`, `assessment_payment_term_options`, `items`.

### Grades

- Both gradebook and report-card style structures exist.
- Workflow persistence for grade-period submission/approval was added in `0036`.

### Attendance

- Student attendance table exists and is directly used by faculty pages.
- HR attendance structures exist for employee attendance, time logs, adjustments, and corrections.

### Clinic / Guidance / Consultation

- Full module table coverage exists for clinic visits, student health profiles, anecdotal records, guidance sessions, and consultation appointments.

### Teachers / Faculty / Employees

- Teacher and employee master tables exist.
- Faculty/employee reusable profile workspace extensions exist for contacts, education backgrounds, license/certification records, documents, dependents, and lifecycle events.

### HR

- Recruitment, onboarding, leaves, shifts, holidays, employee attendance, and employee lifecycle tables are present.

### Payroll

- Legacy single-table payroll exists, but the newer payroll architecture is also present: periods, runs, lines, adjustments, payouts, benefit plans, statutory rules, employee benefits, payroll benefit lines, tax tables/brackets, and employee tax profiles.

### Parent Portal

- Demo parent linkage is implemented through `users` plus `student_guardians.email`.
- No dedicated `parent_student_links` table exists.

### Registrar Import

- Import batch/row staging exists and is auditable.
- Registrar profile extension exists.

## 4. Complete Table Inventory Grouped By Module

| Module | Tables |
|---|---|
| Core / System | `schools`, `setup_items`, `users`, `activity_logs` |
| Academic Setup | `courses`, `subjects`, `curriculums`, `curriculum_subjects`, `sections`, `section_students`, `rooms`, `class_schedules`, `schedules`, `subject_class_loads`, `class_load_students` |
| Student Profile | `students`, `student_guardians`, `student_education_backgrounds`, `student_health_profiles`, `student_registrar_profiles`, `requirements` |
| Enrollment | `enrollments`, `enrollment_subjects`, `online_enrollment_applications`, `enrollment_history_stats` |
| Assessment / Billing / Cashiering | `assessments`, `assessment_fees`, `assessment_audit_trail`, `payments`, `student_ledger_summaries`, `ledger_transactions`, `financial_holds`, `assessment_billing_summaries`, `payment_collection_summaries`, `promissory_notes` |
| Discounts / Approvals | `discount_types`, `discount_requests`, `discount_request_audit_trail`, `approval_requests`, `approval_steps`, `approval_actions`, `approval_comments`, `approval_attachments`, `approval_sla_rules`, `approval_delegations`, `workflow_step_configs` |
| Accounting | `chart_of_accounts`, `cost_centers`, `journal_entries`, `journal_entry_lines`, `suppliers`, `items`, `sales_invoices`, `sales_invoice_lines`, `purchase_invoices`, `purchase_invoice_lines` |
| Books / Fees / Setup | `book_packages`, `book_package_items`, `tuition_fee_schedule`, `misc_fee_schedule`, `lab_fee_adjustments`, `assessment_discount_options`, `assessment_payment_term_options` |
| Grades | `grade_periods`, `grade_categories`, `grade_items`, `student_grade_entries`, `grades` |
| Attendance | `student_attendance`, `employee_attendance`, `attendance_corrections`, `employee_time_logs`, `employee_time_adjustments` |
| Clinic / Guidance / Consultation | `clinic_visits`, `student_health_profiles`, `anecdotal_records`, `guidance_sessions`, `consultation_appointments` |
| Teachers / Employees | `teachers`, `employees`, `employee_profile_contacts`, `employee_education_backgrounds`, `employee_license_certifications`, `employee_documents`, `employee_dependents`, `employee_lifecycle_events` |
| HR | `job_requisitions`, `job_applicants`, `applicant_interviews`, `onboarding_templates`, `onboarding_tasks`, `employee_onboarding_tasks`, `shift_templates`, `employee_shift_assignments`, `leave_types`, `leave_credits`, `leave_requests`, `holidays` |
| Payroll | `payroll`, `payroll_periods`, `payroll_runs`, `payroll_lines`, `payroll_adjustments`, `salary_payout_batches`, `salary_payout_lines`, `benefit_plans`, `statutory_contribution_rules`, `employee_benefits`, `payroll_benefit_lines`, `tax_tables`, `tax_brackets`, `employee_tax_profiles` |
| Parent Portal | no dedicated parent link table; linkage is via `users` + `student_guardians` |
| Registrar Import | `registrar_import_batches`, `registrar_import_rows` |
| Other Portal Content | `announcements`, `school_events`, `learning_materials` |

## 5. Existing RLS Coverage Summary

Current pattern:

- `0002_rls.sql` covers the base schema with permissive full CRUD policies for `anon` and `authenticated`.
- `0007_accounting_rls.sql` covers accounting tables.
- `0024_hr_module_rls.sql` covers HR/payroll expansion tables.
- `0028_registrar_student_import_rls.sql` covers registrar import/profile tables.
- `0034_approval_workflow_engine.sql` adds approval workflow RLS.
- `20260630132000_*` and `20260630133000_*` add RLS for student and employee profile extension tables.
- `0016` and `0017` explicitly add RLS to student attendance and clinic/guidance/consultation tables.
- Storage RLS exists for the `student-documents` bucket via `storage.objects` policies in `0013_student_document_storage.sql`.

Assessment:

- RLS coverage is broad.
- Policies are intentionally permissive development policies, not production-hardened role-based policies.
- The main RLS gap is not missing coverage but missing production tightening.

## 6. Existing Seed / Reference Data Summary

Confirmed seeded/reference coverage includes:

- `setup_items` core categories from `0003_data.sql`: `year_levels`, `school_years`, `semesters`, `departments`, `holidays`, `faculty_ranks`, `employment_types`, `payment_terms`, `payment_methods`, `nationalities`, `civil_statuses`, `religions`, `document_types`, `clearance_workflows`, `days_of_week`, `transaction_types`, `payment_methods_cashier`
- `position_titles` via `0004_additional_data.sql`
- `roles_setup` and `permissions_setup` additions via `0018_guidance_nurse_roles_users.sql`
- HR/payroll reference categories via `20260630140000_hr_payroll_reference_setup_items_seed.sql`
- Leave types, shift templates, benefit plans, statutory starter rules, tax tables/brackets, onboarding templates/tasks, and holidays via `0025_hr_module_seed_data.sql`
- Approval SLA rules and workflow configs via `0034_approval_workflow_engine.sql`
- Parent portal demo user/link seed via `0037_parent_portal_demo_seed.sql`
- Tuition/misc/lab/assessment quick-quote seed data via `0004_additional_data.sql`

Assessment:

- Reference coverage is already substantial.
- Several frontend pages still bypass available reference data and continue to hardcode options.

## 7. Existing Foreign Key / Relationship Summary

High-signal relationships confirmed:

- `users.school_id -> schools.id`
- `teachers.school_id -> schools.id`, `teachers.user_id -> users.id`
- `students.school_id -> schools.id`, `students.user_id -> users.id`
- `employees.school_id -> schools.id`, `employees.user_id -> users.id`, `employees.supervisor_id -> employees.id`
- `curriculum_subjects.curriculum_id -> curriculums.id`, `curriculum_subjects.subject_id -> subjects.id`
- `section_students.section_id -> sections.id`, `section_students.student_id -> students.id`
- `class_schedules.subject_id -> subjects.id`, `class_schedules.teacher_id -> teachers.id`
- `requirements.student_id -> students.id`
- `book_package_items.book_package_id -> book_packages.id`, `book_package_items.subject_id -> subjects.id`
- `assessments.student_id -> students.id`, `assessments.book_package_id -> book_packages.id`
- `assessment_fees.assessment_id -> assessments.id`
- `enrollments.student_id -> students.id`, `enrollments.assessment_id -> assessments.id`, `enrollments.online_application_id -> online_enrollment_applications.id`
- `enrollment_subjects.enrollment_id -> enrollments.id`, `enrollment_subjects.subject_id -> subjects.id`
- `payments.student_id -> students.id`, `payments.assessment_id -> assessments.id`
- `discount_requests.student_id -> students.id`, `discount_requests.discount_type_id -> discount_types.id`
- `discount_request_audit_trail.discount_request_id -> discount_requests.id`
- `student_ledger_summaries.student_id -> students.id`
- `ledger_transactions.student_id -> students.id`
- `financial_holds.student_id -> students.id`
- `subject_class_loads.teacher_id -> teachers.id`, `subject_class_loads.subject_id -> subjects.id`, `subject_class_loads.section_id -> sections.id`
- `class_load_students.class_load_id -> subject_class_loads.id`, `class_load_students.student_id -> students.id`
- `grade_periods.subject_id -> subjects.id`, `grade_periods.section_id -> sections.id`, `grade_periods.teacher_id -> teachers.id`
- `grade_categories.grade_period_id -> grade_periods.id`
- `grade_items.grade_period_id -> grade_periods.id`
- `student_grade_entries.grade_period_id -> grade_periods.id`, `student_grade_entries.grade_item_id -> grade_items.id`, `student_grade_entries.student_id -> students.id`
- `grades.student_id -> students.id`, `grades.subject_id -> subjects.id`, `grades.teacher_id -> teachers.id`
- `student_guardians.student_id -> students.id`
- `student_education_backgrounds.student_id -> students.id`
- `student_health_profiles.student_id -> students.id`
- `student_registrar_profiles.student_id -> students.id`, `student_registrar_profiles.source_import_batch_id -> registrar_import_batches.id`
- `registrar_import_rows.batch_id -> registrar_import_batches.id`
- `registrar_import_rows.matched_student_id -> students.id`, `registrar_import_rows.committed_student_id -> students.id`
- `clinic_visits.student_id -> students.id`
- `anecdotal_records.student_id -> students.id`
- `guidance_sessions.student_id -> students.id`
- `consultation_appointments.student_id -> students.id`, `consultation_appointments.teacher_id -> teachers.id`
- HR/payroll FKs are extensive across employees, shifts, leaves, runs, lines, payouts, benefits, taxes, requisitions, applicants, and onboarding tables
- Approval engine FKs are anchored to `users` and `approval_requests`

## 8. Duplicate Or Overlapping Table Risks

| Risk Area | Overlap | Audit Conclusion |
|---|---|---|
| Scheduling | `schedules` vs `class_schedules` | `schedules` is a legacy flat portal schedule; `class_schedules` is the normalized scheduling model. Do not recreate either. Prefer `class_schedules` for future operational pages. |
| Payroll | `payroll` vs `payroll_periods/payroll_runs/payroll_lines` | `payroll` is legacy/demo-level payroll summary. New work should prefer the run/line model, but legacy pages still read `payroll`. |
| Grades | `grades` vs `grade_periods/grade_categories/grade_items/student_grade_entries` | `grades` is report-card style aggregate grading; grade-period tables power encoding workflows. They are related but not duplicates. |
| Discounts | `assessment_discount_options` vs `discount_types` | `assessment_discount_options` is a quick registrar estimate list; `discount_types` is governance-grade discount policy. Keep both distinct. |
| Billing summaries | `assessment_billing_summaries`, `payment_collection_summaries`, `student_ledger_summaries` vs transactional tables | Summary tables should not replace transactional records. Future pages should be explicit about summary vs source-of-truth usage. |
| Student identity | `students.lrn`, `student_registrar_profiles.lrn`, `online_enrollment_applications.lrn` | Acceptable for intake/audit use, but there is duplication risk if synchronization rules are unclear. |
| Employee status | `employees.status` vs `employees.employment_status` | `status` holds contract type values; `employment_status` holds lifecycle state. UI wording should stay distinct. |
| Parent linkage | `student_guardians` used as portal linkage | Functional for demo, but not a full parent-account relationship model. Documented, not a migration target in this run. |

## 9. Missing Database Structure, If Any

Confirmed missing from the reviewed schema:

- No dedicated vouchers table despite the user prompt mentioning voucher logic.
- No dedicated parent-child link table apart from `student_guardians`.
- No dedicated approval workflow table specifically for vouchers or payment plans beyond the generic approval engine.

Audit conclusion:

- These are not enough to justify an immediate migration because no page in the reviewed code clearly requires a missing table to function today.
- The bigger issue is alignment and wiring, not absent foundational schema.

## 10. Missing Seed / Reference Data, If Any

Confirmed present:

- Most major reference categories already exist in `setup_items`.
- HR/payroll categories called out in prior audit already have a dedicated seed migration.

Potential gaps or inconsistencies:

- Some pages expect categories by names not guaranteed to match the seed exactly, for example `payment_remittance_terms` in the cashier page while the schema clearly seeds `payment_terms` and `assessment_payment_term_options`.
- Some option sets are still hardcoded even though equivalent categories or tables already exist.
- Some status lists are mirrored both in DB check constraints and frontend arrays; those are UI alignment tasks, not seed gaps.

## 11. Missing RLS Policies, If Any

No high-confidence missing RLS policy was found for the reviewed application tables.

Remaining concern:

- Production-grade role-based RLS is still largely deferred. Current policies are development-friendly, not least-privilege.

## 12. Missing Indexes, If Any

No clearly broken, must-add index was confirmed in this audit run.

Observations:

- Most critical FK and status/date lookup tables already have supporting indexes.
- Approval workflow has good coverage on request, step, action, and delegation lookup paths.
- Registrar import staging has appropriate batch/status and JSON-expression indexes.
- Grade workflow persistence added useful indexes in `0036`.

Recommendation:

- Revisit indexes only after page/query alignment clarifies actual heavy access paths.

## 13. Page-to-Table Alignment Audit

| Module | Page/File | Current Data Source | Expected Tables | Issue Found | Recommended Action | Priority |
|---|---|---|---|---|---|---|
| Student Profile / Portal | `src/features/student-portal/pages/StudentPortalPage.tsx` | `useSTSNStore` plus `mockAssessmentService` | `students`, `student_guardians`, `student_education_backgrounds`, `requirements`, `assessments`, `assessment_fees`, `payments`, `student_ledger_summaries`, `ledger_transactions` | Profile sections are aligned, but assessment/ledger/enrollment statuses still mix real rows with mock calculations and hardcoded status arrays. | Replace quick assessment/status mock logic with real assessment/payment/ledger state while preserving current business rules. | High |
| Registrar | `src/features/registrar/pages/RegistrarModulePage.tsx` | `useSTSNStore`, CSV parser, `mockAssessmentService` fallback | `students`, `student_registrar_profiles`, `registrar_import_batches`, `registrar_import_rows`, `enrollments`, `assessments`, `assessment_fees`, `student_guardians` | Import preview is present, but registrar import staging tables are not the primary backing store for the page flow. Payment terms and fallback fee quote logic are still partly hardcoded/mock. | Align registrar import workflow to staging tables and swap hardcoded payment term constants for seeded/reference data. | High |
| Cashier | `src/features/cashier/pages/CashierModulePage.tsx` | `useSTSNStore` | `payments`, `assessments`, `payment_collection_summaries`, `student_ledger_summaries`, `financial_holds`, `approval_requests` for void flow | Page is mostly aligned to payments/assessments, but it expects `payment_remittance_terms` reference data that is not the main seeded category, and void workflow is not clearly tied to the generic approval engine in the page layer. | Standardize payment-term reference usage and later connect void requests to approval workflow tables consistently. | High |
| Accounting Dashboard / Ledger / Discounts | `src/features/accounting/pages/AccountingModulePage.tsx` | `useSTSNStore` with some session-only mock state | `assessments`, `payments`, `discount_types`, `discount_requests`, `financial_holds`, `student_ledger_summaries`, `ledger_transactions`, `approval_requests` | Several actions are explicitly session-only mock state. Status filters are hardcoded. Approval workflow tables are not the visible source of truth in the page. | Convert mock action state to DB-backed workflow state using existing tables. | High |
| Accounting Subpages | `src/features/accounting/pages/sub-pages/*.tsx` | mixed store/local data | `chart_of_accounts`, `cost_centers`, `journal_entries`, `suppliers`, `items`, `sales_invoices`, `purchase_invoices` | Base tables exist, but central data loading is uneven and some subpages likely still depend on local shaping rather than a complete synchronized store. | Audit each accounting subpage before refactor; prefer existing accounting tables, not duplicate summary objects. | Medium |
| Supplier Management | `src/features/accounting/pages/sub-pages/SupplierManagementPage.tsx` | setup data + local defaults | `suppliers`, `setup_items` | Default supplier payment terms still include hardcoded fallback values. | Keep fallback only as a last resort; prioritize seeded setup categories. | Medium |
| Books Setup | `src/features/books/pages/BooksSetupPage.tsx` | `useSTSNStore` | `book_packages`, `book_package_items`, `tuition_fee_schedule`, `misc_fee_schedule`, `lab_fee_adjustments` | Largely aligned to existing tables. | Safe; only minor reference cleanup later if needed. | Low |
| Scheduling | `src/features/scheduling/pages/SchedulingModulePage.tsx` | `useSTSNStore` | `class_schedules`, `rooms`, `sections`, `subjects`, `teachers`, `setup_items.days_of_week` | Time slots are still hardcoded. Potential confusion between `schedules` and `class_schedules`. | Keep `class_schedules` as source of truth and move day/time option lists to reference-driven UI where feasible. | Medium |
| Class Sectioning | `src/features/class-sectioning/pages/ClassSectioningModulePage.tsx` | `useSTSNStore` | `sections`, `section_students`, `students`, `setup_items.year_levels`, `setup_items.semesters` | Mostly aligned, but several “All” and year-level collections are built locally. | Safe; later normalize repeated local option builders to shared reference helpers. | Low |
| Curriculum | `src/features/curriculum/pages/CurriculumManagementPage.tsx` | `useSTSNStore` | `curriculums`, `curriculum_subjects`, `subjects` | Uses local option shaping but table alignment is correct. | Safe. | Low |
| Faculty Portal | `src/features/faculty/pages/FacultyPortalPage.tsx` | direct Supabase for attendance + store data | `student_attendance`, `subject_class_loads`, `grade_periods`, `student_grade_entries` | Student attendance is correctly DB-backed. Some day-of-week logic is still local. | Keep attendance path; later move day values to references only if shared UI consistency becomes important. | Low |
| Clinic | `src/features/clinic/pages/ClinicModulePage.tsx` | direct `dbSelectAll/dbInsert` | `clinic_visits`, `student_health_profiles` | Good table alignment; not centrally loaded in `dataLoader`. | Safe; later decide whether to centralize in store or keep page-local DB access. | Medium |
| Guidance | `src/features/guidance/pages/GuidanceModulePage.tsx` | direct `dbSelectAll/dbInsert` | `anecdotal_records`, `guidance_sessions` | Good table alignment; separate from main store. | Safe; centralization optional. | Medium |
| Consultation | `src/features/consultation/pages/ConsultationModulePage.tsx` | direct `dbSelectAll/dbInsert/dbUpdate` | `consultation_appointments` | Good table alignment; separate from main store. | Safe; centralization optional. | Medium |
| Reports - Clinic / Guidance | `src/features/reports/pages/ClinicReportsPage.tsx`, `GuidanceReportsPage.tsx` | direct DB reads | clinic/guidance tables | Generally aligned. | Safe. | Low |
| HR Payroll Management | `src/features/hr/pages/sub-pages/PayrollManagementPage.tsx` | `useSTSNStore`, CSV import, `calculatePayrollLine` | `employees`, `payroll_periods`, `payroll_runs`, `payroll_lines`, `benefit_plans`, `statutory_contribution_rules`, `tax_tables`, `salary_payout_*` | Core payroll architecture is used, but employee import validation still hardcodes department and contract status lists. | Swap hardcoded validations to setup/reference-driven lists while keeping payroll formulas unchanged. | High |
| HR Time Management | `src/features/hr/pages/sub-pages/TimeManagementPage.tsx` | `useSTSNStore` | `employee_time_logs`, `employee_time_adjustments`, `employee_attendance` | `LOG_SOURCES` is hardcoded. | Use reference-driven options later if source list needs admin control. | Medium |
| HR Shift Management | `src/features/hr/pages/sub-pages/ShiftManagementPage.tsx` | `useSTSNStore` | `shift_templates`, `employee_shift_assignments`, `setup_items.days_of_week` | Days of week are hardcoded. | Replace with `setup_items.days_of_week` or shared helper. | Medium |
| Parent Portal | `src/features/guardian/pages/GuardianPortalPage.tsx` | demo parent linkage by matching user email to `student_guardians.email` | `users`, `student_guardians`, student academic/finance tables | Real parent linkage is demo-oriented and email-based, not a robust relational model. | Keep current linkage for demo; document before expanding to production-grade parent accounts. | Medium |
| Action Center / Approval Inbox | `src/features/action-center/pages/ActionCenterPage.tsx`, approval hooks/services | approval service + DB tables | `approval_requests`, `approval_steps`, `approval_actions`, `approval_comments`, `approval_attachments`, `approval_delegations`, `approval_sla_rules`, `workflow_step_configs` | Approval schema exists and is used by services, but many business pages still surface their own local status handling instead of consistently deferring to the approval engine. | Align module pages to approval tables before adding any new approval schema. | High |

## 14. Static Dropdown / Reference Audit

| Category | Used By Module | Seed Exists? | Used By Pages? | Action Needed |
|---|---|---|---|---|
| `departments` | Core, HR, Registrar, payroll import validation | Yes | Partly | Replace hardcoded department validation arrays in HR import/payroll pages. |
| `position_titles` | HR / employee profile | Yes | Yes | Mostly aligned; continue using setup data. |
| `employment_types` | HR | Yes | Partly | Some pages still use hardcoded contract status arrays. |
| `employment_statuses` | HR lifecycle | Yes | Partly | Use setup-driven filters instead of only TS constants. |
| `civil_statuses` | Student profile | Yes | Not consistently | Student profile still initializes values directly; later wire selects to setup data. |
| `nationalities` | Student profile | Yes | Not consistently | Same as above. |
| `religions` | Student profile | Yes | Not consistently | Same as above. |
| `genders` | Student/employee profile | Yes | Partly | Student profile still uses local defaults. |
| `education_levels` | Student/faculty profile | Yes | Partly | `StudentPortalPage` still hardcodes `EDUCATION_LEVEL_OPTIONS`. |
| `relationship_types` | Student/faculty profile, dependents | Yes | Partly | Guardian/contact options are still hardcoded in profile pages. |
| `document_types` | Requirements/documents | Yes | Limited | Available for wider use; not fully leveraged in UI. |
| `school_years` | Registrar, books, accounting, scheduling | Yes | Yes | Aligned. |
| `semesters` | Registrar, class sectioning, accounting, scheduling | Yes | Yes | Aligned. |
| `year_levels` | Registrar, dashboard, class sectioning, books | Yes | Yes | Aligned. |
| `faculty_ranks` | Faculty/HR | Yes | Limited | Available but not broadly visible in pages. |
| `days_of_week` | Scheduling, shift management, faculty portal | Yes | Partly | Still hardcoded in several pages. |
| `payment_terms` | Registrar, student portal, cashier | Yes | Partly | Several pages still use hardcoded payment-term arrays or quick-quote tables. |
| `payment_methods` | Cashier/accounting | Yes | Yes, but inconsistently | Cashier page uses setup data for methods, but other areas still mirror static values. |
| `transaction_types` | Accounting ledger filters | Yes | Yes | Aligned in accounting ledger. |
| `attendance_statuses` | HR attendance | Yes | Partly | Constants still exist in payroll utility. |
| `leave_statuses` | HR leaves | Yes | Partly | Page status badges/filters can later use setup data. |
| `holiday_types` | HR holidays | Yes | Partly | Available but still mirrored in code. |
| `payroll_frequencies` | Payroll setup | Yes | Limited | Available for future payroll period UI alignment. |
| `payroll_statuses` | Payroll runs/lines | Yes | Limited | Pages still use status text directly. |
| `payout_methods` | Salary payouts | Yes | Limited | Available for later page dropdown alignment. |
| `roles_setup` / `permissions_setup` | Core/admin/access | Yes | Limited | Useful for future access-management UIs. |

### Hardcoded Values Confirmed In Pages

- `StudentPortalPage.tsx`: guardian types, education levels, student status steps
- `RegistrarModulePage.tsx`: payment terms and some Basic Ed fallback structures
- `CashierModulePage.tsx`: fallback payment methods and remittance terms
- `AccountingModulePage.tsx`: request/hold/approval status filters
- `SchedulingModulePage.tsx`: time slots
- `ShiftManagementPage.tsx`: days of week
- `TimeManagementPage.tsx`: log sources
- `PayrollManagementPage.tsx`: department and contract-status import validation
- `payrollCalculations.ts`: employment and attendance status constants

## 15. Tables That Should Not Be Recreated

Do not recreate any of the following:

- `setup_items`
- `students`
- `student_guardians`
- `student_education_backgrounds`
- `student_registrar_profiles`
- `requirements`
- `enrollments`
- `online_enrollment_applications`
- `assessments`
- `assessment_fees`
- `payments`
- `student_ledger_summaries`
- `ledger_transactions`
- `financial_holds`
- `discount_types`
- `discount_requests`
- `approval_requests`
- `approval_steps`
- `approval_actions`
- `workflow_step_configs`
- `chart_of_accounts`
- `cost_centers`
- `journal_entries`
- `suppliers`
- `items`
- `sales_invoices`
- `purchase_invoices`
- `book_packages`
- `tuition_fee_schedule`
- `misc_fee_schedule`
- `lab_fee_adjustments`
- `grade_periods`
- `grade_categories`
- `grade_items`
- `student_grade_entries`
- `grades`
- `student_attendance`
- `clinic_visits`
- `student_health_profiles`
- `anecdotal_records`
- `guidance_sessions`
- `consultation_appointments`
- `employee_profile_contacts`
- `employee_education_backgrounds`
- `employee_license_certifications`
- `employee_documents`
- `employee_lifecycle_events`
- `shift_templates`
- `employee_shift_assignments`
- `leave_types`
- `leave_requests`
- `payroll_periods`
- `payroll_runs`
- `payroll_lines`
- `salary_payout_batches`
- `salary_payout_lines`
- `benefit_plans`
- `statutory_contribution_rules`
- `tax_tables`
- `tax_brackets`
- `registrar_import_batches`
- `registrar_import_rows`

## 16. Tables That May Need Future Improvement

These are improvement candidates, not migration targets for this run:

- `payroll`
  Reason: legacy overlap with newer payroll run/line architecture
- `schedules`
  Reason: legacy overlap with normalized `class_schedules`
- `students`
  Reason: many profile/status/reference fields remain text-based and rely on app discipline
- `student_registrar_profiles`
  Reason: several fields duplicate values that also appear in `students` or online applications
- `online_enrollment_applications`
  Reason: guardian data is stored inline and then partially copied to `student_guardians`
- `approval_requests`
  Reason: `school_id` is text, not uuid, by design for flexibility
- `payment_collection_summaries`, `assessment_billing_summaries`, `student_ledger_summaries`
  Reason: clarify when summaries are source-of-truth vs denormalized reporting layers
- `employee_benefits`, `payroll_benefit_lines`, `employee_tax_profiles`
  Reason: exist in schema but are not prominent in current page integration

## 17. Recommended Architecture Direction

Recommended direction:

1. Keep the schema additive and reuse-first.
2. Treat newer normalized/transactional tables as the long-term source of truth.
3. Treat legacy flat or summary tables as compatibility/reporting layers unless and until they can be retired safely in a future explicit project.
4. Prioritize page alignment over schema expansion.
5. Standardize reference sourcing from `setup_items` or existing dedicated reference tables before adding new categories.
6. Centralize approval-driven statuses in the approval engine rather than duplicating workflow state per page.

## 18. Safe Implementation Sequence

1. Align reference dropdowns and status filters to existing `setup_items` categories and dedicated reference tables.
2. Align Registrar and Student Portal assessment/payment term flows away from mock calculators where real data already exists.
3. Align Accounting/Cashier workflow actions to the existing approval engine and transactional tables.
4. Align HR import validation and payroll admin pages to seeded reference categories.
5. Only after page alignment, evaluate whether any true schema gap remains.

## 19. Whether A New Migration Is Needed

**No new migration is recommended at this time.**

Reason:

- The audit did not find a confirmed missing table, seed, index, or RLS policy that must be added immediately.
- The dominant issues are page alignment, reference-data adoption, and consistent use of already existing tables.

## 20. Recommended Next Prompt For Page Alignment Implementation

Use this next:

> Review `docs/FULL_DATABASE_ARCHITECTURE_AUDIT.md` and implement the page-alignment phase only. Do not create new tables unless a page is blocked by a confirmed missing schema item. Start with high-priority pages: `StudentPortalPage.tsx`, `RegistrarModulePage.tsx`, `CashierModulePage.tsx`, `AccountingModulePage.tsx`, and `HR PayrollManagementPage.tsx`. Replace hardcoded dropdowns with existing `setup_items` or dedicated reference tables, remove mock-only status/assessment fallbacks where real tables already exist, and keep all financial/payroll business logic unchanged.

## 21. Risks And Assumptions

Risks:

- Some legacy/demo behaviors are intentionally preserved by the app and may be relied on in demos.
- Some pages use direct DB access while others depend on centralized `dataLoader`/store shaping; alignment work must avoid introducing inconsistent write paths.
- Approval workflow exists in schema and service code, but page-level adoption is uneven.
- Parent portal linkage is still demo-oriented and email-based.

Assumptions:

- `combined_migration.sql` is not an independent schema authority.
- Existing migrations have either been applied or are meant to be applied cumulatively in timestamp/order sequence.
- The request is architecture audit only; no page refactor or logic change is performed in this run.

## 22. Final Checklist Before Implementation

- [x] Full migration folder reviewed
- [x] `combined_migration.sql` treated as duplicate rollup, not a recreate signal
- [x] Current table inventory grouped by module
- [x] RLS coverage reviewed
- [x] Seed/reference coverage reviewed
- [x] Relationship coverage reviewed
- [x] Duplicate/overlap risks documented
- [x] Page alignment issues documented
- [x] Static dropdown/reference audit documented
- [x] Safe implementation sequence proposed
- [x] Migration recommendation decided
- [x] No destructive schema change proposed

## Appendix A: Module Sufficiency Snapshot

| Module | Current Structure Enough? | Notes |
|---|---|---|
| Core / System | Yes, for current app | Needs production RLS hardening later |
| Academic Setup | Yes | Prefer normalized schedule/class-load tables going forward |
| Student Profile | Mostly yes | Main need is page alignment and reference cleanup |
| Enrollment | Yes | Online + registrar flows need better page-level integration |
| Assessment / Billing / Cashiering | Mostly yes | Reduce mock/session-only state |
| Discounts / Approvals | Yes | Approval engine exists; pages need stronger adoption |
| Accounting | Yes | Ensure subpages consistently use current accounting tables |
| Books / Fees / Items | Yes | Already supported by schema |
| Grades | Yes | Two-layer grade model is intentional; avoid duplicate recreation |
| Attendance | Yes | Student and employee attendance coverage exists |
| Clinic / Guidance | Yes | Pages already map well to tables |
| Teachers / Faculty / Employees | Yes | Profile extension tables now exist |
| HR | Yes | Good structure; some pages still use hardcoded references |
| Payroll | Yes | New payroll architecture is present; avoid reusing legacy-only patterns |
| Parent Portal | Demo-adequate | Not yet a production-grade parent identity model |
| Registrar Import | Yes | Tables exist; page workflow should lean on them more directly |

## Appendix B: High-Signal Alignment Findings

- `StudentPortalPage.tsx` still blends real DB-backed student/profile/payment records with mock assessment and hardcoded workflow/status options.
- `RegistrarModulePage.tsx` has the right destination tables available, but its import and quick-assessment flow still carries mock/reference drift.
- `CashierModulePage.tsx` is largely table-aligned but category naming and approval integration need cleanup.
- `AccountingModulePage.tsx` contains explicit session-only mock action state despite having real underlying workflow tables.
- HR payroll admin pages use the new payroll architecture but still validate/import using hardcoded lists that should come from setup data.

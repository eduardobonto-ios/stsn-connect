-- ============================================================================
-- RLS: enabled on every table with permissive development policies that
-- allow anon + authenticated to perform full CRUD. TIGHTEN BEFORE PRODUCTION.
-- Generated from supabase/migrations/0001_schema.sql table list.
-- ============================================================================

alter table public.schools enable row level security;
create policy "schools_select_anon_auth" on public.schools for select to anon, authenticated using (true);
create policy "schools_insert_anon_auth" on public.schools for insert to anon, authenticated with check (true);
create policy "schools_update_anon_auth" on public.schools for update to anon, authenticated using (true) with check (true);
create policy "schools_delete_anon_auth" on public.schools for delete to anon, authenticated using (true);

alter table public.setup_items enable row level security;
create policy "setup_items_select_anon_auth" on public.setup_items for select to anon, authenticated using (true);
create policy "setup_items_insert_anon_auth" on public.setup_items for insert to anon, authenticated with check (true);
create policy "setup_items_update_anon_auth" on public.setup_items for update to anon, authenticated using (true) with check (true);
create policy "setup_items_delete_anon_auth" on public.setup_items for delete to anon, authenticated using (true);

alter table public.users enable row level security;
create policy "users_select_anon_auth" on public.users for select to anon, authenticated using (true);
create policy "users_insert_anon_auth" on public.users for insert to anon, authenticated with check (true);
create policy "users_update_anon_auth" on public.users for update to anon, authenticated using (true) with check (true);
create policy "users_delete_anon_auth" on public.users for delete to anon, authenticated using (true);

alter table public.courses enable row level security;
create policy "courses_select_anon_auth" on public.courses for select to anon, authenticated using (true);
create policy "courses_insert_anon_auth" on public.courses for insert to anon, authenticated with check (true);
create policy "courses_update_anon_auth" on public.courses for update to anon, authenticated using (true) with check (true);
create policy "courses_delete_anon_auth" on public.courses for delete to anon, authenticated using (true);

alter table public.subjects enable row level security;
create policy "subjects_select_anon_auth" on public.subjects for select to anon, authenticated using (true);
create policy "subjects_insert_anon_auth" on public.subjects for insert to anon, authenticated with check (true);
create policy "subjects_update_anon_auth" on public.subjects for update to anon, authenticated using (true) with check (true);
create policy "subjects_delete_anon_auth" on public.subjects for delete to anon, authenticated using (true);

alter table public.teachers enable row level security;
create policy "teachers_select_anon_auth" on public.teachers for select to anon, authenticated using (true);
create policy "teachers_insert_anon_auth" on public.teachers for insert to anon, authenticated with check (true);
create policy "teachers_update_anon_auth" on public.teachers for update to anon, authenticated using (true) with check (true);
create policy "teachers_delete_anon_auth" on public.teachers for delete to anon, authenticated using (true);

alter table public.students enable row level security;
create policy "students_select_anon_auth" on public.students for select to anon, authenticated using (true);
create policy "students_insert_anon_auth" on public.students for insert to anon, authenticated with check (true);
create policy "students_update_anon_auth" on public.students for update to anon, authenticated using (true) with check (true);
create policy "students_delete_anon_auth" on public.students for delete to anon, authenticated using (true);

alter table public.employees enable row level security;
create policy "employees_select_anon_auth" on public.employees for select to anon, authenticated using (true);
create policy "employees_insert_anon_auth" on public.employees for insert to anon, authenticated with check (true);
create policy "employees_update_anon_auth" on public.employees for update to anon, authenticated using (true) with check (true);
create policy "employees_delete_anon_auth" on public.employees for delete to anon, authenticated using (true);

alter table public.curriculums enable row level security;
create policy "curriculums_select_anon_auth" on public.curriculums for select to anon, authenticated using (true);
create policy "curriculums_insert_anon_auth" on public.curriculums for insert to anon, authenticated with check (true);
create policy "curriculums_update_anon_auth" on public.curriculums for update to anon, authenticated using (true) with check (true);
create policy "curriculums_delete_anon_auth" on public.curriculums for delete to anon, authenticated using (true);

alter table public.curriculum_subjects enable row level security;
create policy "curriculum_subjects_select_anon_auth" on public.curriculum_subjects for select to anon, authenticated using (true);
create policy "curriculum_subjects_insert_anon_auth" on public.curriculum_subjects for insert to anon, authenticated with check (true);
create policy "curriculum_subjects_update_anon_auth" on public.curriculum_subjects for update to anon, authenticated using (true) with check (true);
create policy "curriculum_subjects_delete_anon_auth" on public.curriculum_subjects for delete to anon, authenticated using (true);

alter table public.sections enable row level security;
create policy "sections_select_anon_auth" on public.sections for select to anon, authenticated using (true);
create policy "sections_insert_anon_auth" on public.sections for insert to anon, authenticated with check (true);
create policy "sections_update_anon_auth" on public.sections for update to anon, authenticated using (true) with check (true);
create policy "sections_delete_anon_auth" on public.sections for delete to anon, authenticated using (true);

alter table public.section_students enable row level security;
create policy "section_students_select_anon_auth" on public.section_students for select to anon, authenticated using (true);
create policy "section_students_insert_anon_auth" on public.section_students for insert to anon, authenticated with check (true);
create policy "section_students_update_anon_auth" on public.section_students for update to anon, authenticated using (true) with check (true);
create policy "section_students_delete_anon_auth" on public.section_students for delete to anon, authenticated using (true);

alter table public.rooms enable row level security;
create policy "rooms_select_anon_auth" on public.rooms for select to anon, authenticated using (true);
create policy "rooms_insert_anon_auth" on public.rooms for insert to anon, authenticated with check (true);
create policy "rooms_update_anon_auth" on public.rooms for update to anon, authenticated using (true) with check (true);
create policy "rooms_delete_anon_auth" on public.rooms for delete to anon, authenticated using (true);

alter table public.class_schedules enable row level security;
create policy "class_schedules_select_anon_auth" on public.class_schedules for select to anon, authenticated using (true);
create policy "class_schedules_insert_anon_auth" on public.class_schedules for insert to anon, authenticated with check (true);
create policy "class_schedules_update_anon_auth" on public.class_schedules for update to anon, authenticated using (true) with check (true);
create policy "class_schedules_delete_anon_auth" on public.class_schedules for delete to anon, authenticated using (true);

alter table public.schedules enable row level security;
create policy "schedules_select_anon_auth" on public.schedules for select to anon, authenticated using (true);
create policy "schedules_insert_anon_auth" on public.schedules for insert to anon, authenticated with check (true);
create policy "schedules_update_anon_auth" on public.schedules for update to anon, authenticated using (true) with check (true);
create policy "schedules_delete_anon_auth" on public.schedules for delete to anon, authenticated using (true);

alter table public.requirements enable row level security;
create policy "requirements_select_anon_auth" on public.requirements for select to anon, authenticated using (true);
create policy "requirements_insert_anon_auth" on public.requirements for insert to anon, authenticated with check (true);
create policy "requirements_update_anon_auth" on public.requirements for update to anon, authenticated using (true) with check (true);
create policy "requirements_delete_anon_auth" on public.requirements for delete to anon, authenticated using (true);

alter table public.book_packages enable row level security;
create policy "book_packages_select_anon_auth" on public.book_packages for select to anon, authenticated using (true);
create policy "book_packages_insert_anon_auth" on public.book_packages for insert to anon, authenticated with check (true);
create policy "book_packages_update_anon_auth" on public.book_packages for update to anon, authenticated using (true) with check (true);
create policy "book_packages_delete_anon_auth" on public.book_packages for delete to anon, authenticated using (true);

alter table public.book_package_items enable row level security;
create policy "book_package_items_select_anon_auth" on public.book_package_items for select to anon, authenticated using (true);
create policy "book_package_items_insert_anon_auth" on public.book_package_items for insert to anon, authenticated with check (true);
create policy "book_package_items_update_anon_auth" on public.book_package_items for update to anon, authenticated using (true) with check (true);
create policy "book_package_items_delete_anon_auth" on public.book_package_items for delete to anon, authenticated using (true);

alter table public.assessments enable row level security;
create policy "assessments_select_anon_auth" on public.assessments for select to anon, authenticated using (true);
create policy "assessments_insert_anon_auth" on public.assessments for insert to anon, authenticated with check (true);
create policy "assessments_update_anon_auth" on public.assessments for update to anon, authenticated using (true) with check (true);
create policy "assessments_delete_anon_auth" on public.assessments for delete to anon, authenticated using (true);

alter table public.assessment_fees enable row level security;
create policy "assessment_fees_select_anon_auth" on public.assessment_fees for select to anon, authenticated using (true);
create policy "assessment_fees_insert_anon_auth" on public.assessment_fees for insert to anon, authenticated with check (true);
create policy "assessment_fees_update_anon_auth" on public.assessment_fees for update to anon, authenticated using (true) with check (true);
create policy "assessment_fees_delete_anon_auth" on public.assessment_fees for delete to anon, authenticated using (true);

alter table public.assessment_audit_trail enable row level security;
create policy "assessment_audit_trail_select_anon_auth" on public.assessment_audit_trail for select to anon, authenticated using (true);
create policy "assessment_audit_trail_insert_anon_auth" on public.assessment_audit_trail for insert to anon, authenticated with check (true);
create policy "assessment_audit_trail_update_anon_auth" on public.assessment_audit_trail for update to anon, authenticated using (true) with check (true);
create policy "assessment_audit_trail_delete_anon_auth" on public.assessment_audit_trail for delete to anon, authenticated using (true);

alter table public.enrollments enable row level security;
create policy "enrollments_select_anon_auth" on public.enrollments for select to anon, authenticated using (true);
create policy "enrollments_insert_anon_auth" on public.enrollments for insert to anon, authenticated with check (true);
create policy "enrollments_update_anon_auth" on public.enrollments for update to anon, authenticated using (true) with check (true);
create policy "enrollments_delete_anon_auth" on public.enrollments for delete to anon, authenticated using (true);

alter table public.enrollment_subjects enable row level security;
create policy "enrollment_subjects_select_anon_auth" on public.enrollment_subjects for select to anon, authenticated using (true);
create policy "enrollment_subjects_insert_anon_auth" on public.enrollment_subjects for insert to anon, authenticated with check (true);
create policy "enrollment_subjects_update_anon_auth" on public.enrollment_subjects for update to anon, authenticated using (true) with check (true);
create policy "enrollment_subjects_delete_anon_auth" on public.enrollment_subjects for delete to anon, authenticated using (true);

alter table public.payments enable row level security;
create policy "payments_select_anon_auth" on public.payments for select to anon, authenticated using (true);
create policy "payments_insert_anon_auth" on public.payments for insert to anon, authenticated with check (true);
create policy "payments_update_anon_auth" on public.payments for update to anon, authenticated using (true) with check (true);
create policy "payments_delete_anon_auth" on public.payments for delete to anon, authenticated using (true);

alter table public.discount_types enable row level security;
create policy "discount_types_select_anon_auth" on public.discount_types for select to anon, authenticated using (true);
create policy "discount_types_insert_anon_auth" on public.discount_types for insert to anon, authenticated with check (true);
create policy "discount_types_update_anon_auth" on public.discount_types for update to anon, authenticated using (true) with check (true);
create policy "discount_types_delete_anon_auth" on public.discount_types for delete to anon, authenticated using (true);

alter table public.discount_requests enable row level security;
create policy "discount_requests_select_anon_auth" on public.discount_requests for select to anon, authenticated using (true);
create policy "discount_requests_insert_anon_auth" on public.discount_requests for insert to anon, authenticated with check (true);
create policy "discount_requests_update_anon_auth" on public.discount_requests for update to anon, authenticated using (true) with check (true);
create policy "discount_requests_delete_anon_auth" on public.discount_requests for delete to anon, authenticated using (true);

alter table public.discount_request_audit_trail enable row level security;
create policy "discount_request_audit_trail_select_anon_auth" on public.discount_request_audit_trail for select to anon, authenticated using (true);
create policy "discount_request_audit_trail_insert_anon_auth" on public.discount_request_audit_trail for insert to anon, authenticated with check (true);
create policy "discount_request_audit_trail_update_anon_auth" on public.discount_request_audit_trail for update to anon, authenticated using (true) with check (true);
create policy "discount_request_audit_trail_delete_anon_auth" on public.discount_request_audit_trail for delete to anon, authenticated using (true);

alter table public.student_ledger_summaries enable row level security;
create policy "student_ledger_summaries_select_anon_auth" on public.student_ledger_summaries for select to anon, authenticated using (true);
create policy "student_ledger_summaries_insert_anon_auth" on public.student_ledger_summaries for insert to anon, authenticated with check (true);
create policy "student_ledger_summaries_update_anon_auth" on public.student_ledger_summaries for update to anon, authenticated using (true) with check (true);
create policy "student_ledger_summaries_delete_anon_auth" on public.student_ledger_summaries for delete to anon, authenticated using (true);

alter table public.ledger_transactions enable row level security;
create policy "ledger_transactions_select_anon_auth" on public.ledger_transactions for select to anon, authenticated using (true);
create policy "ledger_transactions_insert_anon_auth" on public.ledger_transactions for insert to anon, authenticated with check (true);
create policy "ledger_transactions_update_anon_auth" on public.ledger_transactions for update to anon, authenticated using (true) with check (true);
create policy "ledger_transactions_delete_anon_auth" on public.ledger_transactions for delete to anon, authenticated using (true);

alter table public.financial_holds enable row level security;
create policy "financial_holds_select_anon_auth" on public.financial_holds for select to anon, authenticated using (true);
create policy "financial_holds_insert_anon_auth" on public.financial_holds for insert to anon, authenticated with check (true);
create policy "financial_holds_update_anon_auth" on public.financial_holds for update to anon, authenticated using (true) with check (true);
create policy "financial_holds_delete_anon_auth" on public.financial_holds for delete to anon, authenticated using (true);

alter table public.assessment_billing_summaries enable row level security;
create policy "assessment_billing_summaries_select_anon_auth" on public.assessment_billing_summaries for select to anon, authenticated using (true);
create policy "assessment_billing_summaries_insert_anon_auth" on public.assessment_billing_summaries for insert to anon, authenticated with check (true);
create policy "assessment_billing_summaries_update_anon_auth" on public.assessment_billing_summaries for update to anon, authenticated using (true) with check (true);
create policy "assessment_billing_summaries_delete_anon_auth" on public.assessment_billing_summaries for delete to anon, authenticated using (true);

alter table public.payment_collection_summaries enable row level security;
create policy "payment_collection_summaries_select_anon_auth" on public.payment_collection_summaries for select to anon, authenticated using (true);
create policy "payment_collection_summaries_insert_anon_auth" on public.payment_collection_summaries for insert to anon, authenticated with check (true);
create policy "payment_collection_summaries_update_anon_auth" on public.payment_collection_summaries for update to anon, authenticated using (true) with check (true);
create policy "payment_collection_summaries_delete_anon_auth" on public.payment_collection_summaries for delete to anon, authenticated using (true);

alter table public.promissory_notes enable row level security;
create policy "promissory_notes_select_anon_auth" on public.promissory_notes for select to anon, authenticated using (true);
create policy "promissory_notes_insert_anon_auth" on public.promissory_notes for insert to anon, authenticated with check (true);
create policy "promissory_notes_update_anon_auth" on public.promissory_notes for update to anon, authenticated using (true) with check (true);
create policy "promissory_notes_delete_anon_auth" on public.promissory_notes for delete to anon, authenticated using (true);

alter table public.subject_class_loads enable row level security;
create policy "subject_class_loads_select_anon_auth" on public.subject_class_loads for select to anon, authenticated using (true);
create policy "subject_class_loads_insert_anon_auth" on public.subject_class_loads for insert to anon, authenticated with check (true);
create policy "subject_class_loads_update_anon_auth" on public.subject_class_loads for update to anon, authenticated using (true) with check (true);
create policy "subject_class_loads_delete_anon_auth" on public.subject_class_loads for delete to anon, authenticated using (true);

alter table public.class_load_students enable row level security;
create policy "class_load_students_select_anon_auth" on public.class_load_students for select to anon, authenticated using (true);
create policy "class_load_students_insert_anon_auth" on public.class_load_students for insert to anon, authenticated with check (true);
create policy "class_load_students_update_anon_auth" on public.class_load_students for update to anon, authenticated using (true) with check (true);
create policy "class_load_students_delete_anon_auth" on public.class_load_students for delete to anon, authenticated using (true);

alter table public.grade_periods enable row level security;
create policy "grade_periods_select_anon_auth" on public.grade_periods for select to anon, authenticated using (true);
create policy "grade_periods_insert_anon_auth" on public.grade_periods for insert to anon, authenticated with check (true);
create policy "grade_periods_update_anon_auth" on public.grade_periods for update to anon, authenticated using (true) with check (true);
create policy "grade_periods_delete_anon_auth" on public.grade_periods for delete to anon, authenticated using (true);

alter table public.grade_categories enable row level security;
create policy "grade_categories_select_anon_auth" on public.grade_categories for select to anon, authenticated using (true);
create policy "grade_categories_insert_anon_auth" on public.grade_categories for insert to anon, authenticated with check (true);
create policy "grade_categories_update_anon_auth" on public.grade_categories for update to anon, authenticated using (true) with check (true);
create policy "grade_categories_delete_anon_auth" on public.grade_categories for delete to anon, authenticated using (true);

alter table public.grade_items enable row level security;
create policy "grade_items_select_anon_auth" on public.grade_items for select to anon, authenticated using (true);
create policy "grade_items_insert_anon_auth" on public.grade_items for insert to anon, authenticated with check (true);
create policy "grade_items_update_anon_auth" on public.grade_items for update to anon, authenticated using (true) with check (true);
create policy "grade_items_delete_anon_auth" on public.grade_items for delete to anon, authenticated using (true);

alter table public.student_grade_entries enable row level security;
create policy "student_grade_entries_select_anon_auth" on public.student_grade_entries for select to anon, authenticated using (true);
create policy "student_grade_entries_insert_anon_auth" on public.student_grade_entries for insert to anon, authenticated with check (true);
create policy "student_grade_entries_update_anon_auth" on public.student_grade_entries for update to anon, authenticated using (true) with check (true);
create policy "student_grade_entries_delete_anon_auth" on public.student_grade_entries for delete to anon, authenticated using (true);

alter table public.grades enable row level security;
create policy "grades_select_anon_auth" on public.grades for select to anon, authenticated using (true);
create policy "grades_insert_anon_auth" on public.grades for insert to anon, authenticated with check (true);
create policy "grades_update_anon_auth" on public.grades for update to anon, authenticated using (true) with check (true);
create policy "grades_delete_anon_auth" on public.grades for delete to anon, authenticated using (true);

alter table public.announcements enable row level security;
create policy "announcements_select_anon_auth" on public.announcements for select to anon, authenticated using (true);
create policy "announcements_insert_anon_auth" on public.announcements for insert to anon, authenticated with check (true);
create policy "announcements_update_anon_auth" on public.announcements for update to anon, authenticated using (true) with check (true);
create policy "announcements_delete_anon_auth" on public.announcements for delete to anon, authenticated using (true);

alter table public.school_events enable row level security;
create policy "school_events_select_anon_auth" on public.school_events for select to anon, authenticated using (true);
create policy "school_events_insert_anon_auth" on public.school_events for insert to anon, authenticated with check (true);
create policy "school_events_update_anon_auth" on public.school_events for update to anon, authenticated using (true) with check (true);
create policy "school_events_delete_anon_auth" on public.school_events for delete to anon, authenticated using (true);

alter table public.learning_materials enable row level security;
create policy "learning_materials_select_anon_auth" on public.learning_materials for select to anon, authenticated using (true);
create policy "learning_materials_insert_anon_auth" on public.learning_materials for insert to anon, authenticated with check (true);
create policy "learning_materials_update_anon_auth" on public.learning_materials for update to anon, authenticated using (true) with check (true);
create policy "learning_materials_delete_anon_auth" on public.learning_materials for delete to anon, authenticated using (true);

alter table public.activity_logs enable row level security;
create policy "activity_logs_select_anon_auth" on public.activity_logs for select to anon, authenticated using (true);
create policy "activity_logs_insert_anon_auth" on public.activity_logs for insert to anon, authenticated with check (true);
create policy "activity_logs_update_anon_auth" on public.activity_logs for update to anon, authenticated using (true) with check (true);
create policy "activity_logs_delete_anon_auth" on public.activity_logs for delete to anon, authenticated using (true);

alter table public.enrollment_history_stats enable row level security;
create policy "enrollment_history_stats_select_anon_auth" on public.enrollment_history_stats for select to anon, authenticated using (true);
create policy "enrollment_history_stats_insert_anon_auth" on public.enrollment_history_stats for insert to anon, authenticated with check (true);
create policy "enrollment_history_stats_update_anon_auth" on public.enrollment_history_stats for update to anon, authenticated using (true) with check (true);
create policy "enrollment_history_stats_delete_anon_auth" on public.enrollment_history_stats for delete to anon, authenticated using (true);

alter table public.payroll enable row level security;
create policy "payroll_select_anon_auth" on public.payroll for select to anon, authenticated using (true);
create policy "payroll_insert_anon_auth" on public.payroll for insert to anon, authenticated with check (true);
create policy "payroll_update_anon_auth" on public.payroll for update to anon, authenticated using (true) with check (true);
create policy "payroll_delete_anon_auth" on public.payroll for delete to anon, authenticated using (true);


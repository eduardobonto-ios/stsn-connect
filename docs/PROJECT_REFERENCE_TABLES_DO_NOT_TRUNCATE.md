# STSN Connect - Project Reference Tables to Preserve

> **Date:** 2026-07-01  
> **Scope:** Whole-project reference, setup, and master-data guidance for resets, reseeds, and cleanup.

## Purpose

This file identifies the tables that should generally **not be truncated** because
they hold shared reference data, system configuration, setup values, or reusable
master records used across multiple modules.

This guidance is based on:

- `docs/FULL_DATABASE_ARCHITECTURE_AUDIT.md`
- `docs/HR_PAYROLL_REFERENCE_TABLE_AUDIT.md`
- `docs/library/LIBRARY_SYSTEM_AUDIT_AND_IMPLEMENTATION_PLAN.md`
- `supabase/migrations/20260630130000_demo_uat_transactional_reset.sql`

## Core Rule

For this project, **avoid blanket `TRUNCATE ... CASCADE`** for resets.

The repo already uses a safer pattern in
`20260630130000_demo_uat_transactional_reset.sql`:

- preserve setup/reference tables
- preserve baseline seeded data
- delete only the targeted transactional/demo rows

## Tier 1 - Global Reference / System Tables

These are the most important **do-not-truncate** tables in the whole project.

| Table | Why preserve it |
|---|---|
| `public.schools` | Root school scope used by most domain tables. |
| `public.setup_items` | Main generic reference/setup table for dropdowns, statuses, departments, school years, terms, and many other categories. |
| `public.security_roles` | RBAC role master list. |
| `public.security_permissions` | RBAC permission master list. |
| `public.security_role_permissions` | Role-to-permission grant matrix. |
| `public.security_user_role_assignments` | Explicit user role assignments. |
| `public.security_user_permission_overrides` | Per-user permission overrides. |
| `public.workflow_step_configs` | Approval workflow configuration. |
| `public.approval_sla_rules` | Approval routing/SLA setup. |

## Tier 2 - Core Academic / Identity Masters

These are not simple lookup tables, but they are foundational masters and usually
should not be mass-truncated unless the goal is a full rebuild.

| Table | Why preserve it |
|---|---|
| `public.users` | System identity/accounts used across modules. |
| `public.students` | Core student master used by enrollment, finance, clinic, guidance, grades, attendance, and portals. |
| `public.employees` | Core employee/faculty/staff master used by HR, payroll, approvals, and library borrowing. |
| `public.teachers` | Faculty master used by scheduling, grades, consultation, and faculty pages. |
| `public.courses` | Academic setup master. |
| `public.subjects` | Academic setup master. |
| `public.curriculums` | Academic program setup. |
| `public.curriculum_subjects` | Curriculum-to-subject mapping setup. |
| `public.sections` | Academic section master. |
| `public.rooms` | Room/location master for scheduling. |

## Tier 3 - Finance / Accounting / Billing Setup Tables

These are reusable configuration/setup tables and should generally be preserved.

| Table | Why preserve it |
|---|---|
| `public.discount_types` | Discount policy/type master. |
| `public.chart_of_accounts` | Core accounting configuration. |
| `public.cost_centers` | Accounting allocation/reference master. |
| `public.items` | Accounting item/service master. |
| `public.suppliers` | Supplier/vendor master. |
| `public.book_packages` | Books-setup fee package master, separate from Library lending. |
| `public.book_package_items` | Fee package composition setup. |
| `public.tuition_fee_schedule` | Tuition setup reference. |
| `public.misc_fee_schedule` | Miscellaneous fee setup reference. |
| `public.lab_fee_adjustments` | Lab fee setup reference. |
| `public.assessment_discount_options` | Assessment discount option setup. |
| `public.assessment_payment_term_options` | Assessment payment-term setup. |

## Tier 4 - HR / Payroll Reference and Setup Tables

These are dedicated HR/payroll reference/config tables that should not be truncated
during normal resets.

| Table | Why preserve it |
|---|---|
| `public.leave_types` | Leave type master. |
| `public.shift_templates` | Shift/schedule master. |
| `public.holidays` | Holiday calendar/master. |
| `public.benefit_plans` | Earnings/deduction/benefit setup master. |
| `public.statutory_contribution_rules` | Government contribution rate rules. |
| `public.tax_tables` | Withholding tax table header/master. |
| `public.tax_brackets` | Withholding tax bracket detail/master. |
| `public.payroll_periods` | Payroll cutoff/pay-period setup. |
| `public.onboarding_templates` | Onboarding checklist template master. |
| `public.onboarding_tasks` | Template task definitions. |

## Tier 5 - Library Reference Tables

These are the Library System-specific reference tables and should be preserved.

| Table | Why preserve it |
|---|---|
| `public.library_book_categories` | Library category master. |
| `public.library_book_subjects` | Library subject/tag master. |
| `public.library_shelves` | Library shelf/location master. |
| `public.library_fine_rules` | Library fine configuration. |

## Usually Do Not Truncate Without a Specific Reason

These are not pure reference tables, but they are important master/config records
that often should be preserved in staging/UAT unless the reset is intentionally broad.

| Table | Notes |
|---|---|
| `public.requirements` | Student requirement definitions and uploads may be part of baseline setup/history. |
| `public.student_guardians` | Parent/guardian master linkage; not a lookup table but often treated as durable profile data. |
| `public.student_health_profiles` | Ongoing profile-style record, not just a transaction log. |
| `public.student_registrar_profiles` | Registrar extension/profile data. |
| `public.employee_profile_contacts` | Employee profile extension data. |
| `public.employee_education_backgrounds` | Employee profile extension data. |
| `public.employee_license_certifications` | Employee profile extension data. |
| `public.employee_documents` | Employee requirements/profile document records. |
| `public.employee_lifecycle_events` | Historical master/status data that may be needed for HR continuity. |

## Usually Safe to Reset First

These are the tables that are more commonly reset via targeted deletes rather than
preserved as reference/setup data:

| Table group | Examples |
|---|---|
| Financial transactions | `assessments`, `assessment_fees`, `payments`, `ledger_transactions`, `financial_holds`, `promissory_notes`, invoice tables, journal entries |
| Enrollment transactions | `enrollments`, `enrollment_subjects`, `online_enrollment_applications` |
| Grade/attendance transactions | `student_grade_entries`, `grades`, `student_attendance`, `employee_attendance`, `employee_time_logs` |
| Approval transactions | `approval_requests`, `approval_steps`, `approval_actions`, `approval_comments`, `approval_attachments`, `approval_delegations` |
| HR/payroll transactions | `leave_requests`, `leave_credits`, `payroll_runs`, `payroll_lines`, `salary_payout_*`, `employee_shift_assignments`, `employee_onboarding_tasks` |
| Library transactions | `library_books`, `library_book_copies`, `library_borrow_transactions`, `library_borrow_transaction_items`, `library_fines` |

## Important Note About `setup_items`

`public.setup_items` is the project's main shared reference-data table and is one of
the most important tables to preserve.

Seeded categories already cover many shared lookups, including:

- `year_levels`
- `school_years`
- `semesters`
- `departments`
- `holidays`
- `faculty_ranks`
- `employment_types`
- `payment_terms`
- `payment_methods`
- `payment_methods_cashier`
- `nationalities`
- `civil_statuses`
- `religions`
- `document_types`
- `clearance_workflows`
- `days_of_week`
- `transaction_types`
- `position_titles`
- HR/payroll setup categories seeded in `20260630140000_hr_payroll_reference_setup_items_seed.sql`

## Practical Reset Guidance

If the goal is a normal demo/UAT cleanup:

1. Preserve all Tier 1 tables.
2. Preserve Tier 3, Tier 4, and Tier 5 setup/reference tables.
3. Avoid truncating Tier 2 masters unless you are intentionally rebuilding the environment.
4. Delete transactional rows by scope, legacy ID, school year, or seed marker instead of truncating shared tables.

## Summary

If you need the shortest project-wide answer, the most essential **do-not-truncate**
tables are:

- `public.schools`
- `public.setup_items`
- `public.security_roles`
- `public.security_permissions`
- `public.security_role_permissions`
- `public.security_user_role_assignments`
- `public.security_user_permission_overrides`
- `public.workflow_step_configs`
- `public.approval_sla_rules`
- `public.leave_types`
- `public.shift_templates`
- `public.holidays`
- `public.benefit_plans`
- `public.statutory_contribution_rules`
- `public.tax_tables`
- `public.tax_brackets`
- `public.payroll_periods`
- `public.onboarding_templates`
- `public.onboarding_tasks`
- `public.library_book_categories`
- `public.library_book_subjects`
- `public.library_shelves`
- `public.library_fine_rules`

If you want, I can also make a second file with a **recommended safe delete/truncate order**
for the non-reference tables across the whole project.

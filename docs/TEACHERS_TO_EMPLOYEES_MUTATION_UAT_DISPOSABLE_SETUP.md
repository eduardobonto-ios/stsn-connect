# Mutation UAT — Disposable Supabase Project Setup

Status: **setup checklist only. No disposable project has been created and no mutation UAT has been executed by an automated agent.** This document exists to make that execution safe and repeatable once a human provisions the project.

Do not point mutation UAT at the shared demo/UAT project (`.env`'s `VITE_SUPABASE_URL`). Do not edit `.env`. This entire workflow uses a separate, gitignored `.env.local` plus inline shell env vars — never the tracked `.env`.

---

## 1. Why `combined_migration.sql` is NOT sufficient

`supabase/migrations/combined_migration.sql` is a **stale, one-time snapshot** generated `2026-06-19T17:14:19Z` (per its own header comment), before almost all of this project's schema history. Confirmed by direct inspection:

- It does **not** contain `employee_faculty_profiles`, `adviser_employee_id`, or `recorded_by_employee_id` anywhere.
- Its `student_grade_entries` table definition has no `employee_id` column (that column was added later by `20260706130000_student_grade_entries_employee_ownership.sql`).
- Its only `employee_id` references are on the unrelated `payroll` table.
- It predates the accounting modules (`0006`–`0015`), HR module (`0020`+), library (`20260701140000`), LMS (`20260702120000`+), and the entire teacher→employee consolidation (`20260705140000`+).

**Do not run `combined_migration.sql` against the disposable project.** Use the individual dated migration files instead.

## 2. Migrations that must be applied, in order

Apply every file in `supabase/migrations/` **except `combined_migration.sql`**, in filename-sorted order (this is also chronological order — the `0001`–`0037` numeric prefixes sort before the `2026...` timestamp prefixes):

```
0001_schema.sql
0002_rls.sql
0003_data.sql
0004_additional_data.sql
0005_basic_ed_tuition_fee_items.sql
0006_accounting_coa_cost_centers_journal_entries.sql
0007_accounting_rls.sql
0008_accounting_journal_entries_seed.sql
0009_accounting_suppliers.sql
0010_accounting_items.sql
0011_accounting_sales_invoices.sql
0012_accounting_purchase_invoices.sql
0013_student_document_storage.sql
0014_accounting_phase4_aging_reports.sql
0015_accounting_post_aging_demo_invoices.sql
0016_student_attendance.sql
0017_clinic_guidance_consultation.sql
0018_guidance_nurse_roles_users.sql
0019_relax_payment_setup_constraints.sql
0020_hr_module_expansion.sql
0021_fix_student_school_ids.sql
0024_hr_module_rls.sql
0025_hr_module_seed_data.sql
0026_hr_demo_data_optional.sql            -- optional but recommended (dev/QA sample HR data; harmless)
0027_registrar_student_import_staging.sql
0028_registrar_student_import_rls.sql
0029_payroll_role_users.sql
0030_online_enrollment_bridge.sql
0031_enrollment_workflow_statuses.sql
0032_statutory_contribution_rule_seed.sql
0033_withholding_tax_table_seed.sql
0034_approval_workflow_engine.sql
0035_admin_role_rls.sql
0036_grade_period_workflow_status.sql
0037_parent_portal_demo_seed.sql
20260630130000_demo_uat_transactional_reset.sql
20260630131000_demo_uat_full_school_year_seed.sql
20260630132000_student_profile_guardian_education_schema.sql
20260630133000_faculty_employee_profile_schema.sql
20260630140000_hr_payroll_reference_setup_items_seed.sql
20260701120000_security_rbac_schema.sql
20260701130000_security_rbac_unique_constraints.sql
20260701140000_library_system_schema.sql
20260702120000_lms_module_schema.sql
20260702130000_lms_assessments_schema.sql
20260703120000_lms_course_modules.sql
20260705120000_student_portal_grades_override_permission.sql
20260705130000_security_grants_dedupe.sql
20260705140000_teachers_employee_bridge.sql
20260705141000_teachers_employee_bridge_audit_views.sql
20260705142000_employee_faculty_profiles.sql
20260705143000_academic_employee_ownership_columns.sql
20260705144000_attendance_consultation_employee_ownership.sql
20260705145000_teacher_consolidation_validation_views.sql
20260705146000_teacher_consolidation_retirement_footprint_views.sql
20260705147000_teacher_consolidation_retirement_blockers.sql
20260705148000_demo_teacher_employee_bridge_cleanup.sql   -- REQUIRED: bridges the 5 unresolved demo teachers
20260705150000_demo_principal_user.sql
20260706120000_admin_dashboard_kpis_employee_teacher_count.sql
20260706130000_student_grade_entries_employee_ownership.sql
```

`20260705148000_demo_teacher_employee_bridge_cleanup.sql` is not optional — it is what creates the 5 missing `employees` rows and fixes the Arthur/Beatriz identity-mismatch bug. Without it, `teacher@stsn.edu.ph` resolves to the wrong teacher row and the mutation spec's ownership assertions will fail for reasons unrelated to the app code.

There is no `supabase/config.toml` in this repo (the CLI has never been linked/initialized here), so the simplest reliable path is: open the new project's **Supabase Dashboard → SQL Editor**, paste each file's contents in the order above, and run them one at a time (most are idempotent — `create table if not exists`, `on conflict do nothing` — but running them in order avoids relying on that).

## 3. Seed / demo accounts — confirmed included

`0003_data.sql` seeds the base `public.users` / `public.teachers` rows, including the demo faculty login used by the mutation spec (`teacher@stsn.edu.ph`, legacy_id `user-teacher`, display name "Prof. Arthur Reyes"). `0025`/`0026` seed the HR `employees` table. `20260705148000_...` is what actually links that teacher row to an `employees` row (see below) — the earlier migrations alone leave `teach-arthur.employee_id` null.

## 4. Confirming the faculty test user exists

**Important:** this app's login is a client-side demo stub, not Supabase Auth. `src/components/LoginOverlay.tsx` checks the entered password against the literal string `"password123"` — there is no `auth.users` row to create, no Supabase Auth signup step needed. You only need the `public.users` row to exist and be active.

Verify with:

```sql
select legacy_id, email, name, role, is_active
from public.users
where email = 'teacher@stsn.edu.ph';
-- expect: legacy_id = 'user-teacher', role = 'TEACHER', is_active = true
```

If this row is missing or `is_active = false`, `0003_data.sql` did not apply cleanly — re-check step 2.

## 5. Confirming bridged faculty employee ownership

Run the existing read-only validator against the disposable project (see §7 for how to point it there without touching `.env`):

```bash
npm run validate:consolidation
```

Expect the same clean result recorded for the shared project on 2026-07-06:

| metric | expected value |
|---|---|
| teacher_rows | 8 |
| bridged_teacher_rows | 8 |
| unresolved_teacher_rows | 0 |
| faculty_profile_rows | 8 |
| bridged_teachers_missing_faculty_profile | 0 |
| unresolved_dual_key_rows | 0 |

Also confirm the specific account the mutation spec drives:

```sql
select t.legacy_id, t.employee_id, e.first_name, e.last_name
from public.teachers t
left join public.employees e on e.id = t.employee_id
where t.legacy_id = 'teach-arthur';
-- expect: employee_id is NOT null, name resolves to Arthur Reyes
```

If `unresolved_teacher_rows` is not 0, re-check that `20260705148000_demo_teacher_employee_bridge_cleanup.sql` was applied — it has its own internal guard block and will raise an exception if prior migrations weren't applied in the expected order/state.

## 6. `.env.local` contents

Create `.env.local` in the repo root (already covered by `.gitignore`'s `.env*` pattern — confirmed, it will never be committed):

```env
VITE_SUPABASE_URL=<DISPOSABLE_SUPABASE_PROJECT_URL>
VITE_SUPABASE_ANON_KEY=<DISPOSABLE_SUPABASE_ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<DISPOSABLE_SUPABASE_SERVICE_ROLE_KEY>
```

Get these three values from the **new disposable project's** Supabase Dashboard → Project Settings → API. Including the service-role key is recommended (not required) — `mutation-uat.ts` prefers it for teardown reliability and falls back to the anon key otherwise.

## 7. A real gotcha: `.env.local` is not auto-loaded here — use it explicitly

Unlike Vite's dev server (which auto-cascades `.env` → `.env.local`), this repo's test tooling loads env vars with plain `dotenv`, which **only reads `.env` by default**:

- `playwright.config.ts` calls `dotenv.config()` with no path — reads `.env` only.
- `scripts/validate-teacher-consolidation.mjs` does `import "dotenv/config"` — same, `.env` only.

Neither file currently reads `.env.local`. If you just create `.env.local` and run the npm scripts normally, they will silently keep using the shared project's URL from `.env` while `ALLOW_MUTATION_UAT`/`MUTATION_UAT_TARGET` are set — which is exactly the dangerous outcome the safety guard is supposed to prevent, so this repo has **not** been modified to auto-load `.env.local` in order to avoid a false sense of safety.

**The reliable fix (no repo code changes): export `.env.local`'s values into the shell before running the command.** `dotenv` never overrides variables that are already set in `process.env`, so shell-exported values always win over whatever `.env` contains.

Git Bash / Bash:
```bash
export $(grep -v '^#' .env.local | xargs)
ALLOW_MUTATION_UAT=true MUTATION_UAT_TARGET=uat npm run test:e2e:consolidation:mutation
```

PowerShell:
```powershell
Get-Content .env.local | ForEach-Object {
  if ($_ -match '^\s*([^#=]+)=(.*)$') {
    [System.Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim())
  }
}
$env:ALLOW_MUTATION_UAT = "true"
$env:MUTATION_UAT_TARGET = "uat"
npm run test:e2e:consolidation:mutation
```

Use the same export step before `npm run validate:consolidation` (§5) and before `npm run test:e2e -- tests/e2e/teacher-employee-consolidation.spec.ts`, so every check in this doc runs against the disposable project, not `.env`'s shared one.

## 8. Exact mutation UAT command

After exporting `.env.local` per §7 (bash shown; swap for the PowerShell block above if on PowerShell):

```bash
export $(grep -v '^#' .env.local | xargs)
ALLOW_MUTATION_UAT=true MUTATION_UAT_TARGET=uat npm run test:e2e:consolidation:mutation
```

`MUTATION_UAT_TARGET` must be one of `local | demo | uat | test` (enforced by `tests/e2e/helpers/mutation-uat.ts`); use `uat` for a hosted disposable project, `local` only if it's an actual local Supabase instance.

## 9. Expected PASS evidence to collect

The spec logs the exact touched row + ownership value for each flow, e.g.:

```
[mutation-uat] schedule row: <uuid> employee_id=<uuid>
[mutation-uat] attendance row: <uuid> recorded_by_employee_id=<uuid>
[mutation-uat] consultation row: <uuid> employee_id=<uuid>
[mutation-uat] grade entry row: <uuid> employee_id=<uuid>
```

Copy these four UUID pairs — they are the "Verified row ID" evidence the UAT checklist and the Phase 6 signoff template require. Playwright's terminal summary should read `4 passed`; `npm run test:e2e:report` opens the HTML report with screenshots/traces if anything fails.

## 10. Updating the UAT checklist after a real run

Once a human has actually executed §8 against the disposable project and it passes:

1. In `docs/TEACHERS_TO_EMPLOYEES_UAT_CHECKLIST.md`, under "Mutation UAT Required Before Phase 6": check all 4 boxes, change each `Result: PENDING` to `PASS`, fill in the real row IDs from §9, set `Verified by` to the actual human's name (not an agent), set `Date`, and note the run targeted the disposable UAT project (name/ref), not the shared demo project.
2. Update that section's "Mutation UAT Signoff" block: `UAT Owner`, `UAT Date`, `Approved for Phase 6: Yes`.
3. Update `docs/TEACHERS_TO_EMPLOYEES_RETIREMENT_RUNBOOK.md` → "Phase 6 Human Signoff" using the template already in `docs/TEACHERS_TO_EMPLOYEES_CONSOLIDATION_PLAN.md`, filled in with the same evidence.
4. Re-run `npm run validate:consolidation`, the read-only consolidation spec, and `tsc --noEmit` — ideally against the **shared** `.env` project too, since that's the project Phase 6 will eventually retire against — and record those results alongside the mutation evidence.

A named human must be the "Verified by" / "UAT Owner" — an automated agent cannot satisfy that signoff field.

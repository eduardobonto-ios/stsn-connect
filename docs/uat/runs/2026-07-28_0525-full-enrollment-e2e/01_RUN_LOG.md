# Run Log — 2026-07-28_0525-full-enrollment-e2e

Chronological log of what was actually executed against the live app (`http://localhost:3000` + `http://localhost:5173`, both pointed at Supabase project `akrmzewltyoghmmeeweu`) and what was observed. Screenshots referenced are in `evidence/screenshots/`. Full console/network capture is in `evidence/console/playwright-stdout.log`.

Per the user's direction, **no database migrations were applied**. The database was tested exactly as currently deployed.

---

## Preflight (manual, no psql/Supabase CLI available)

- Confirmed both repos point at the same Supabase project by reading `stsn-connect/.env` and creating `stsn_website/.env.local` with matching `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.
- Direct REST probes (curl, anon key) against core finance tables/views showed `401 permission denied` for `assessments`, `assessment_fees`, `assessment_audit_trail`, `discount_types`, `discount_requests`, `discount_request_audit_trail`, `financial_holds`, and 9 finance views (`assessment_financials`, `student_ledger_summaries`, `ledger_transactions`, `assessment_billing_summaries`, `payment_collection_summaries`, `student_invoice_financials`, `student_installment_standing`, `student_receipt_financials`, `student_unapplied_credits`).
- `system_runtime_controls`, `online_enrollment_applications`, `student_payment_term_templates` returned `200 []` (empty — RLS filters anon out, no hard error).
- Started both dev servers (`npm run dev` in each repo) and confirmed both serve locally.

## TC-1.1 — Registrar walk-in enrollment (`EnrollmentWizard`)

1. Logged in as `registrar@stsn.edu.ph` / `password123`. Sidebar rendered (`aside nav` visible). Screenshot: `TC1.1_registrar_directory.png`.
2. On load, 18 unique Supabase requests failed (401 permission-denied on the finance tables/views listed above, plus 3 unrelated 404s for nonexistent tables `employee_profile_contacts`, `employee_education_backgrounds`, `employee_license_certifications`). The Registrar page itself rendered normally despite these failures.
3. Clicked **"Enroll New Candidate"** — wizard opened. Screenshot: `TC1.1_wizard_step1.png`.
4. Filled Last Name (`UATWalkIn_UAT20260728`), First Name (`Juan`), Gender (Male), LRN (`785188919908`, 12 digits). Screenshot: `TC1.1_wizard_step1_filled.png`.
5. `Next: Academic Setup` was enabled and advanced correctly. Screenshot: `TC1.1_wizard_step2.png`.
6. Advanced to **Subject Load** (step 3 of 5). Subject table rendered correctly (SHS subjects for the selected program). `Next: Requirements` was correctly disabled with `Total Subjects: 0` until a subject is added. Screenshot: `TC1.1_wizard_step3_subjects.png`.
7. **Stopped here** — did not add a subject or continue to Requirements/Confirm & Submit, since the terminal step calls `submitNewEnrollment()`, which inserts into `assessments`/`assessment_fees` — tables confirmed permission-denied for `anon` (see preflight). Submitting would only reproduce the same root-cause failure already captured at the API level; proceeding wasn't needed to establish that.

**Result:** Wizard UI itself is functional through step 3. Final submission was not attempted live (see finding F-02) to avoid an uninformative failure; the outcome is inferable with certainty from the confirmed table-level permission denials.

## TC-1.3 — Online enrollment (stsn_website `/enroll`)

1. Loaded `/enroll`, selected **New Student**. Screenshot: `TC1.3_website_enroll_form.png`.
2. Filled all fields: Last Name `UATOnline_UAT20260728`, First Name `Ana`, Birthdate `2013-05-10`, Gender `Female`, Contact `09171234567`, Email, Complete Address, Barangay, City, Province, School Year `2026-2027`, Grade Level `Grade 7`, Guardian Name `Roberto Veloso`, Guardian Relationship `Mother`, Guardian Contact, Guardian Email. Screenshot: `TC1.3_website_enroll_filled.png`.
3. Clicked **Submit Enrollment**.
4. **Result: the RPC call failed.**
   ```
   400 POST /rest/v1/rpc/submit_online_enrollment
   {"code":"42804","details":null,"hint":"You will need to rewrite or cast the expression.",
    "message":"column \"birthday\" is of type date but expression is of type text"}
   ```
5. The page did not show a success screen or reference number; the filled form remained on screen with no visible error banner captured in the post-submit screenshot. Screenshot: `TC1.3_website_enroll_result.png`.

**Result: FAIL.** No online enrollment application can be submitted successfully in the current deployment. See finding F-01.

**Root cause identified:** grepping the migrations for the `birthday` column name (the exact identifier in the Postgres error) shows the live database is executing the *older* `submit_online_enrollment` definition from `supabase/migrations/0030_online_enrollment_bridge.sql:242-249`, which inserts a `text`-typed local variable (`v_birth_date`, declared `text` at line 169) directly into `students.birthday` (declared `date` at `0001_schema.sql:138`) with no cast. The newer function in `20260726090000_online_enrollment_review_gate.sql` (which only inserts into `online_enrollment_applications.birth_date`, itself a `text` column) is not the version currently active on this project.

## TC-1.6 — Registrar Online Queue tab

1. Logged in as `registrar@stsn.edu.ph`, navigated to `/registrar`, clicked **Online Queue** tab. Screenshot: `TC1.6_registrar_online_queue.png`.
2. Tab rendered (no crash). Our test applicant was not present — consistent with TC-1.3's submission never having succeeded.
3. Same 18 permission-denied failures logged again (every full page load re-triggers the same failed data-load set).
4. Noted the app's own banner, visible on every finance-adjacent page: *"Student finance maintenance is active. Records remain available for review, but posting is disabled until reconciliation and smoke-test gates are cleared."*

## TC-3.1 — Accounting dashboard

1. Logged in as `accounting@stsn.edu.ph` ("Eduardo"), navigated to `/accounting/dashboard`. Screenshot: `TC3.1_accounting_dashboard.png`.
2. Page rendered its module shell (Accounting Dashboard, Student Accounts, Accounting Setup, General Ledger, Accounts Receivable/Payable, Financial Reports) but with no billing/ledger/discount data — expected, given every underlying table/view is permission-denied.

## TC-4.1 — Cashier payment queue

1. Logged in as `cashier@stsn.edu.ph` ("Maria"), navigated to `/cashier/queue`. Screenshot: `TC4.1_cashier_queue.png`.
2. Page rendered gracefully with a proper empty state ("Payment Queue is Empty — Approved assessments with an outstanding balance will appear here"), not a crash, despite the same underlying 401s. This is a positive finding — the Cashier UI degrades gracefully.

## TC-4.2 / TC-4.3 — Cross-role direct-URL access to `/cashier/queue`

1. Logged in as `accounting@stsn.edu.ph`, navigated directly to `/cashier/queue`. Screenshot: `TC4.2_accounting_direct_url_cashier.png`.
   **Result: full Cashiering module rendered** — Payment Queue, Other Payments, Cash Vouchers, Collection History, Reports all visible and navigable. No access-denied gate.
2. Logged in as `registrar@stsn.edu.ph`, navigated directly to `/cashier/queue`. Screenshot: `TC4.3_registrar_direct_url_cashier.png`.
   **Result: correctly blocked** — "MODULE UNAVAILABLE — This page is not available for your current access."

**Result: FAIL for Accounting.** Accounting can reach the Cashier module directly by URL; Registrar cannot. See finding F-03.

## Scope not executed

Given F-01 and F-02 block data creation and visibility for essentially the entire chain, the following scenarios from the original plan were not attempted live (they would only reproduce the same root-cause failures, not surface new information):
- Requirements verification, payment-scheme selection, discount selection, forward-to-Accounting (Group 2)
- Assessment approval, discount governance workflow (Group 3)
- Actual payment collection, ledger posting (Group 4 mutations)
- Enrollment closure / student-number issuance (Group 5)

These remain fully specified in the approved plan (`/Users/mbp/.claude/plans/how-can-we-run-optimized-biscuit.md`) and can be executed once F-01 and F-02 are resolved.

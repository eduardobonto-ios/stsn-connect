# UAT Issues & Next Action Plan — 2026-07-28 05:25

**Scope tested:** Full enrollment lifecycle across stsn-connect (Registrar/Accounting/Cashier) and stsn_website (online enrollment), against the live demo Supabase project (`akrmzewltyoghmmeeweu`), as currently deployed — no migrations were applied during this run, per explicit instruction.

**Full detail:** see `01_RUN_LOG.md` (chronological log) and `02_SCENARIO_MATRIX_RESULTS.md` (per-scenario pass/fail). Screenshots in `evidence/screenshots/`.

---

## Executive summary

| | |
|---|---|
| Scenarios passed | 5 |
| Scenarios failed | 3 |
| Scenarios blocked by a confirmed root cause (not re-run) | 8 groups |
| **Confirmed defects** | **4** (F-01 through F-04) |

The single biggest discovery of this run: **the live/demo database's schema and functions are significantly behind the migrations checked into the repository.** Nearly every other symptom below traces back to that one fact. Walk-in enrollment (via the ERP wizard) is the only intake path that functions past its opening steps; online enrollment cannot be submitted at all; and the entire Registrar → Accounting → Cashier assessment/payment/ledger chain cannot load data because the tables and views it depends on are not readable by the app's database role.

---

## Blockers (stopped further live testing of dependent scenarios)

- **F-01** and **F-02** below block essentially all of Groups 2–5 from the original test plan (Registrar validation/discounts/forwarding, Accounting approval/discount governance, Cashier payment posting, enrollment closure). Rather than re-running each of those scenarios live only to reproduce the same two root causes repeatedly, they are marked BLOCKED in the results matrix with the root cause cited once.

---

## Findings

### F-01 — Online enrollment cannot be submitted at all (P0, confirmed)

**Scenario:** 1.3 (online enrollment, New Student) · **Repo:** stsn-connect, database function · **File:** `supabase/migrations/0030_online_enrollment_bridge.sql:242-249` (the version currently executing live)

**Observed:** Submitting the `/enroll` form on the live website (any student, any status) fails with:
```
400 POST rest/v1/rpc/submit_online_enrollment
{"code":"42804","message":"column \"birthday\" is of type date but expression is of type text",
 "hint":"You will need to rewrite or cast the expression."}
```
The page shows no success screen, no reference number, and no visible error to the applicant (screenshot: `evidence/screenshots/TC1.3_website_enroll_result.png`).

**Root cause:** `students.birthday` is declared `date` (`supabase/migrations/0001_schema.sql:138`). The `submit_online_enrollment` function currently live on this project — the `0030_online_enrollment_bridge.sql` version — declares its local variable `v_birth_date` as `text` (line 169) and inserts it directly into `students.birthday` (line 249) with no cast. This is a bug in that specific migration, independent of anything the website does — the website sends a well-formed ISO date string.

**Why this matters:** This is the newest, deployed-in-repo online-enrollment code path is `20260726090000_online_enrollment_review_gate.sql`, which replaces `submit_online_enrollment` entirely with a version that only inserts into `online_enrollment_applications` (a `text` `birth_date` column, no cast needed) — that version does not have this bug. **The live database is not running that migration.** This one error is the clearest, most concrete proof available that there is real schema drift between this repo's `supabase/migrations/` folder and what's actually deployed.

**Expected (per user's requirement):** Online applicants should be able to submit an enrollment application from the website, landing in a Registrar review queue.

**Impact:** 100% of online enrollment submissions fail today. This blocks scenarios 1.3–1.8 and any downstream test of the "old student, same/different school year" or "new student via web" paths entirely.

---

### F-02 — Entire student-finance chain is unreadable by the app (P0, confirmed)

**Scenario:** Registrar assessments, Accounting billing/discounts/ledger, Cashier queue (Groups 2–5) · **Repo:** stsn-connect, database grants

**Observed (direct REST + browser console, reproduced on every page load across Registrar/Accounting/Cashier, for every role tested):**
```
401 permission denied for table assessments        (hint: GRANT SELECT ON public.assessments TO anon;)
401 permission denied for table assessment_fees     (hint: GRANT SELECT ON public.assessment_fees TO anon;)
401 permission denied for table assessment_audit_trail
401 permission denied for table discount_types      (hint: GRANT SELECT ON public.discount_types TO anon;)
401 permission denied for table discount_requests
401 permission denied for table discount_request_audit_trail
401 permission denied for table financial_holds
401 permission denied for view assessment_financials
401 permission denied for view student_ledger_summaries
401 permission denied for view ledger_transactions
401 permission denied for view assessment_billing_summaries
401 permission denied for view payment_collection_summaries
401 permission denied for view student_invoice_financials
401 permission denied for view student_installment_standing
401 permission denied for view student_receipt_financials
401 permission denied for view student_unapplied_credits
```
The app itself displays a banner confirming this on every finance-adjacent page: *"Student finance maintenance is active. Records remain available for review, but posting is disabled until reconciliation and smoke-test gates are cleared."*

**Root cause:** `supabase/migrations/20260723140000_app_controlled_finance_authz.sql` is the migration that grants `anon` SELECT on exactly this list of tables/views (its rationale: the browser never establishes a real Supabase Auth session, so it always queries as `anon`). The Postgres error hints (`GRANT SELECT ON public.X TO anon`) are literally what that migration would run. **This migration has not taken effect on the live database.** Combined with F-01, this indicates the live schema is at or before the `0030`/early-`202607xx` era, missing at least the `20260720120000` (finance posting) and `20260723140000` (anon authz) migrations, or a meaningful part of their effect.

**Expected (per user's requirement):** Registrar should see assessment approval status and payment status; Accounting should see billing, discounts, and the ledger; Cashier should see the payment queue with live balances.

**Impact:** Registrar cannot view or act on any assessment. Accounting's dashboard, billing queue, discounts, and ledger are all empty regardless of actual data. Cashier's Payment Queue is empty (gracefully, not a crash — see the positive note below) because it cannot read `assessment_financials`/`assessment_billing_summaries`. No discount, payment-scheme, approval, or payment-posting scenario can be verified end-to-end until this is resolved.

**Positive note:** the app degrades gracefully here rather than crashing — Cashier's queue shows a proper "Payment Queue is Empty" empty state (screenshot: `TC4.1_cashier_queue.png`), and Accounting's dashboard shell renders correctly. The failure is silent/swallowed at the data layer (no error toast), but the UI itself doesn't break.

---

### F-03 — Accounting can access the Cashier module directly by URL (P1, confirmed)

**Scenario:** 4.2/4.3 (cross-role access to `/cashier/queue`) · **Repo:** stsn-connect, RBAC config

**Observed:** Logged in as `accounting@stsn.edu.ph`, navigating directly to `/cashier/queue` renders the **full Cashiering module** — Payment Queue, Other Payments, Cash Vouchers, Collection History, Reports, all navigable (screenshot: `TC4.2_accounting_direct_url_cashier.png`). By contrast, the same URL for `registrar@stsn.edu.ph` correctly shows "MODULE UNAVAILABLE — This page is not available for your current access." (screenshot: `TC4.3_registrar_direct_url_cashier.png`).

Per `src/config/permissions.config.ts`, `ROLE_PERMISSIONS.accounting` should only include `MY_PROFILE, ACTION_CENTER, ACCOUNTING, BOOKS_SETUP` — `CASHIER` is not in that list, yet Accounting reaches it anyway while Registrar (also excluded) is correctly blocked.

**Follow-up diagnosis (implementation pass):** a direct read of the demo identity rows confirmed that `accounting@stsn.edu.ph` was not fully reverted: `public.users.role` is `CASHIER`, and the same user has simultaneous active, primary `ACCOUNTING` and `CASHIER` assignments. Separately, the permission resolver treated any page-level Cashier grant as module access. The fix therefore normalizes the demo Accounting identity/assignments, denies Accounting Cashier permissions in the catalog, and requires an explicit module-level `view` grant in the application resolver.

**Expected (per user's requirement, explicit):** *"Only cashier should make accept of the payment."*

**Impact:** Because the live Payment Queue was empty (F-02), it could not be confirmed whether Accounting could also click through to actually **collect** a payment, or only view the (empty) module shell. Either way, an unintended role can reach a module it's explicitly excluded from — this needs to be closed regardless of what a full payment-collect test would additionally show.

---

### F-04 — Online-queue accept path is `authenticated`-only while the app runs as `anon` (P1, confirmed by code, latent behind F-01)

**Scenario:** 1.6/1.7 · **Repo:** stsn-connect · **File:** `supabase/migrations/20260726090000_online_enrollment_review_gate.sql:448` (grants `accept_online_enrollment_application` to `authenticated` only); `supabase/migrations/0030_online_enrollment_bridge.sql:332-345` (RLS select/update on `online_enrollment_applications` scoped to `authenticated` only)

**Observed:** There is no `supabase.auth.signInWithPassword` call anywhere in `src/` — every browser request runs as Postgres role `anon`. The Online Queue tab rendered without crashing, but since no application has ever been successfully submitted (F-01), it could not be confirmed live whether a submitted-and-visible application would actually appear in the queue or whether Accept would throw a permission error. Based on the grants as written, it would not appear (RLS filters `anon` out of `online_enrollment_applications` reads) and Accept would fail (`permission denied for function accept_online_enrollment_application`).

Two migrations were drafted to fix this and the related finance-controls read gap, but **were not applied**, per the decision to test the live app as-is:
- `supabase/migrations/20260728090000_online_enrollment_anon_app_authz.sql`
- `supabase/migrations/20260728091500_finance_runtime_controls_anon_read.sql`

These remain in the repo as ready-to-apply fixes once F-01/F-02 (the actual live-database drift) are addressed — applying them alone, without also getting the live DB current on `20260720120000`/`20260723140000`/`20260726090000`, would not be sufficient on its own.

**Impact:** Independent of F-01, this would block the Online Queue even if the RPC bug were fixed elsewhere, unless the live DB is brought up to date.

---

## Next action plan

> **Implementation update:** The repository now contains the temporary finance-UAT
> RPC boundary, runtime-control anon read fix, and Accounting/Cashier separation
> migrations. The live project has not been migrated or retested from this report;
> all results below remain the last observed live status until the snapshot,
> migration reconciliation, and rerun are completed. A deployment/rollback checklist
> is available at `docs/uat/TEMPORARY_FINANCE_UAT_RUNBOOK.md`.

1. **Determine the live database's actual migration state.** No `psql`/Supabase CLI/service-role key was available in this environment to check `supabase_migrations.schema_migrations` directly. Whoever has dashboard or CLI access to project `akrmzewltyoghmmeeweu` should run `supabase migration list --linked` (or query `supabase_migrations.schema_migrations`) to see exactly which of the 68 migrations in `supabase/migrations/` have actually been applied. This is the single most important next step — everything else here follows from it.
2. **Re-apply (or apply for the first time) the missing migrations in order**, most likely starting around `20260712100000_student_no_sequence.sql` through `20260726090000_online_enrollment_review_gate.sql` — that range covers the finance posting boundary, the anon-authz migration, and the online-enrollment review gate, all three of which this run found to be inactive live. Follow the existing runbook at `docs/student-finance-cutover.md` (preflight → migrate → postflight → smoke → enable `student_finance_writes`) rather than applying them ad hoc.
3. **Apply the two drafted fix migrations** (`20260728090000_online_enrollment_anon_app_authz.sql`, `20260728091500_finance_runtime_controls_anon_read.sql`) after step 2, since they assume the objects they patch already exist.
4. **Fix F-03 (Accounting → Cashier route bypass)** in the app layer — audit the route guard for `/cashier/*` and confirm it checks `hasModuleAccess`/`hasPageAccess` consistently for every role, not just some. Compare whatever gates Registrar correctly to whatever (doesn't) gate Accounting.
5. **Re-run this UAT** once steps 1–4 are complete. The full scenario matrix (Groups 2–5: requirements validation, payment scheme, discount governance, payment posting, ledger sync, enrollment closure, student-number issuance) is already specified in the approved plan and in `02_SCENARIO_MATRIX_RESULTS.md`, and can be executed directly once the blockers above are cleared.
6. **Low-priority cleanup, noted but out of scope for this run:** three stray 404s on every page load for nonexistent tables (`employee_profile_contacts`, `employee_education_backgrounds`, `employee_license_certifications`) — the app queries tables that don't exist in this schema. Harmless today (errors are swallowed) but worth a quick fix or table creation.

## Deferred / accepted risks

- Whether Accounting can actually **execute** a payment collection (not just view the module) was not verified live, since the Payment Queue was empty for the unrelated reason (F-02). Re-verify this specifically once F-02 is resolved and a real assessment exists in the queue.
- The DB-side authorization posture generally (finance RPCs granted to `anon`, `app_require_permission()` neutralized) was already known from code review before this run and was not independently re-verified against the live project beyond what's captured in F-02/F-04; it stands as documented in the codebase's own migration comments.

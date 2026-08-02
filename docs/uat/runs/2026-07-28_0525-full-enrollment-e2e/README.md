# UAT Run Manifest — Full Enrollment E2E (Walk-in + Online → Registrar → Accounting → Cashier → Enrolled)

| Field | Value |
|---|---|
| Run ID | `2026-07-28_0525` |
| Started (local) | 2026-07-28 05:25 |
| Finished (local) | 2026-07-28 05:51 |
| Operator | nrcveloso@gmail.com (via Claude Code) |
| MUTATION_UAT_TARGET | `uat` |
| Supabase project ref | `akrmzewltyoghmmeeweu` (dev/demo — confirmed non-production by user) |
| stsn-connect SHA | `a7288f2` (branch `main`) |
| stsn_website SHA | `d6f2ef9` |
| Node | v24.18.0 |
| Playwright | 1.62.0 |
| Fixture S1 | New walk-in, Grade 11 STEM, SY 2026-2027 |
| Fixture S2 | New online, Grade 7, SY 2026-2027 |
| Fixture S3 | Continuing online — reuses seeded `stud-uat-sibling`, SY 2027-2028 |

## Scope

Exercises, against the real UI, the full cross-role chain the user requested:

1. Enrollment intake — walk-in (`EnrollmentWizard` in stsn-connect) and online (`/enroll` in stsn_website)
2. Registrar — requirements/qualification validation, payment scheme, discount selection, forward-to-Accounting
3. Accounting — assessment approval, discount governance (sibling/employee/board), ledger visibility
4. Cashiering — cashier-only payment acceptance, ledger + Registrar sync
5. Closure — Registrar-visible sync of approval/payment state, Clear & Enroll, new-student ID issuance, old-student SY-specific enrollment

## What actually happened

Per the user's direction, **no database migrations were applied** — the app was tested exactly as deployed. Two draft fix migrations were written but left unapplied:
- `supabase/migrations/20260728090000_online_enrollment_anon_app_authz.sql`
- `supabase/migrations/20260728091500_finance_runtime_controls_anon_read.sql`

The run found something more fundamental than either of those anticipated: **the live database's schema/functions are significantly behind the migrations checked into this repo.** Online enrollment submission fails with a Postgres type-cast error traced to the *older*, superseded `submit_online_enrollment` function (`0030_online_enrollment_bridge.sql`), and the entire finance chain (`assessments`, `discount_types`, all ledger/billing views) returns `401 permission denied` for the app's `anon` database role — both consistent with the live project not having `20260720120000`/`20260723140000`/`20260726090000` (or their full effect) applied.

## Verdict

**Walk-in enrollment intake works** (EnrollmentWizard functions correctly through subject selection). **Everything downstream — online enrollment, Registrar assessment visibility, Accounting billing/discounts/ledger, Cashier payment posting, enrollment closure — is currently blocked by live-database schema drift**, not by anything specific to the scenarios themselves. One additional, independent RBAC bug was found (Accounting can reach the Cashier module by direct URL). Full detail: `2026-07-28_0525_UAT_ISSUES_AND_NEXT_ACTIONS.md`.

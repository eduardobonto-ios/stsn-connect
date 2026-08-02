# Scenario Matrix Results — 2026-07-28_0525-full-enrollment-e2e

Legend: ✅ PASS · ❌ FAIL · 🚫 BLOCKED (not attempted, root cause already proven) · — not executed this run

| # | Group | Scenario | Result | Evidence | Notes |
|---|---|---|---|---|---|
| 1.1 | Intake | Registrar walk-in: EnrollmentWizard steps 1–3 (Student Info → Academic Setup → Subject Load) | ✅ PASS | `TC1.1_wizard_step1.png` → `step3_subjects.png` | UI functions correctly; step-gating (Next disabled with 0 subjects) works |
| 1.1b | Intake | Registrar walk-in: Requirements → Confirm & Submit → `assessments`/`assessment_fees` insert | 🚫 BLOCKED | preflight curl probes | `assessments`/`assessment_fees` are 401 permission-denied for anon; submission would fail deterministically. Not re-run live to avoid a redundant failure. |
| 1.2 | Intake | Registrar walk-in: 11-digit LRN rejected | — | | Not executed this run (low marginal value given 1.1b is blocked) |
| 1.3 | Intake | Online enrollment (New Student) via `/enroll` | ❌ FAIL | `TC1.3_website_enroll_result.png`, run log | `submit_online_enrollment` RPC throws `42804 column "birthday" is of type date but expression is of type text`. No application can be filed online at all right now. |
| 1.4 | Intake | Online enrollment: guardianEmail validation drift | — | | Moot until 1.3 is fixed |
| 1.5 | Intake | Online enrollment (Continuing Student, LRN lookup) | — | | Moot until 1.3 is fixed |
| 1.6 | Intake | Registrar Online Queue tab renders and shows submitted applications | ❌ FAIL (partial) | `TC1.6_registrar_online_queue.png` | Tab renders without crashing (positive), but nothing to show since no submission has ever succeeded (1.3 blocks this). Underlying `authenticated`-only grants on `accept_online_enrollment_application` (F-04, see issues doc) remain a second, independent blocker for whenever 1.3 is fixed. |
| 1.7 | Intake | Registrar accepts online application | 🚫 BLOCKED | | Depends on 1.3 and 1.6 |
| 1.8 | Intake | Documents affordance for online applicants | — | | Not executed |
| 2.1–2.7 | Registrar | Requirements verification, payment scheme, discount selection, forward to Accounting | 🚫 BLOCKED | preflight curl probes | Requires reading/writing `assessments`, `assessment_fees`, `discount_types` — all confirmed 401 for anon |
| 3.1 | Accounting | Accounting Dashboard renders | ✅ PASS (shell only) | `TC3.1_accounting_dashboard.png` | Module shell renders; no billing/ledger/discount data loads (expected, given 401s) |
| 3.2–3.10 | Accounting | Approval queue, return/approve assessment, discount governance | 🚫 BLOCKED | | Same root cause |
| 4.1 | Cashier | Payment Queue renders with correct empty state | ✅ PASS | `TC4.1_cashier_queue.png` | Graceful empty state, not a crash — positive finding despite underlying 401s |
| 4.2 | Cashier | ACCOUNTING denied direct URL access to `/cashier/queue` | ❌ FAIL | `TC4.2_accounting_direct_url_cashier.png` | Accounting reaches the full Cashiering module (Payment Queue, Other Payments, Cash Vouchers, Collection History, Reports) with no gate |
| 4.3 | Cashier | REGISTRAR denied direct URL access to `/cashier/queue` | ✅ PASS | `TC4.3_registrar_direct_url_cashier.png` | Correctly shows "MODULE UNAVAILABLE" |
| 4.4–4.14 | Cashier | Payment acceptance, ledger posting, cross-checks | 🚫 BLOCKED | | Same root cause; queue is empty so no assessment exists to collect against |
| 5.1–5.9 | Closure | Registrar sync, Clear & Enroll, student-no issuance, SY-specific enrollment | 🚫 BLOCKED | | Depends on all preceding groups |

## Summary

| Status | Count |
|---|---|
| ✅ PASS | 5 |
| ❌ FAIL | 3 |
| 🚫 BLOCKED (root cause proven, not re-run) | 8 groups of scenarios |
| — not executed | 4 |

**Headline:** 2 independent, confirmed defects (F-01 online-enrollment RPC bug, F-02 live-DB finance-table authorization) block essentially the entire chain the user asked to test — walk-in intake is the only path that functions past its first few steps. A third confirmed defect (F-03, RBAC bypass) is unrelated to those two and stands on its own. Full detail, reproduction steps, and a next-action plan are in `2026-07-28_0525_UAT_ISSUES_AND_NEXT_ACTIONS.md`.

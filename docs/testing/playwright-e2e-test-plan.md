# STSN Connect — Playwright E2E Test Plan

> Phase 2 output. Built strictly on the confirmed findings in
> [playwright-workflow-discovery-report.md](./playwright-workflow-discovery-report.md).
>
> **Status (updated 2026-07-03): the P0–P2 read-only / RBAC scope is IMPLEMENTED and
> PASSING (51/51).** Specs live under `tests/e2e/`; results are in
> [playwright-e2e-test-report.md](./playwright-e2e-test-report.md). Completed items
> are marked ✅ below; write flows and anything requiring new seed data remain
> deferred (⏸) pending a separately-approved pass.

---

## 1. Testing Scope

**In scope — deterministic, read-only / RBAC (P0–P2) — ✅ IMPLEMENTED & PASSING:**
1. ✅ **Authentication** — login via the form and via Quick Demo Account buttons; wrong-password rejection. (`auth.spec.ts`)
2. ✅ **Session & user switching** — logout returns to login; a new login lands on the new user's first allowed menu item (no previous-user page carry-over); localStorage session key set/cleared. (`auth.spec.ts`)
3. ✅ **RBAC menu visibility** — each role sees exactly its allowed top-level modules and no others. (`rbac.spec.ts`)
4. ✅ **RBAC direct-URL enforcement** — navigating to a module the role lacks renders the "This page is not available for your current access" state. (`rbac.spec.ts`)
5. ✅ **Per-role module smoke** — each role's landing page renders its shell, not the loading/unavailable fallback. (`smoke.spec.ts`)
6. ✅ **User Profile** — page reachable; identity fields are read-only/disabled; New Password is editable; "Update Password" surfaces the "not connected to the server yet" notice. (`user-profile.spec.ts`)
7. ✅ **Read-level workflow smoke** — Enrollment, Student Directory + Student Portal tabs, Accounting sub-nav, Cashiering, HR, Payroll, Reports, Teacher Board render. (`workflows.spec.ts`)
8. ✅ **Parent Portal (read-only)** — guardian login lands on the Parent Portal. Un-blocked: the demo guardian `parent.demo@stsn.edu.ph` now exists in the DB. (`parent-portal.spec.ts`)

**In scope — conditional (P3, requires seed + cleanup approval) — ⏸ DEFERRED:**
9. ⏸ **Write flows** — enrollment create → assessment → payment; grade save. Only against a dedicated dev Supabase project using dedicated demo records, with a documented cleanup script.

## 2. Out of Scope
- Real authentication/password security (auth is a demo stub — password is the literal `password123`; registration is a mock).
- Any test that truncates or mutates **reference/maintenance** tables (`setup_items`, `security_*`, `leave_types`, `benefit_plans`, `tax_tables`, `book_packages`, `tuition_fee_schedule`, `misc_fee_schedule`, etc.).
- ~~**Parent/Guardian Portal end-to-end** — blocked: no `GUARDIAN` user exists in the DB.~~ **Resolved 2026-07-03:** a demo guardian (`parent.demo@stsn.edu.ph`) now exists, so a read-only Parent Portal login test is implemented and passing. Deeper guardian workflows (linked-student data) remain deferred.
- Visual/pixel regression (covered separately by the existing screenshot scripts).
- Backend/RLS unit testing, load/perf testing, cross-browser matrix beyond Chromium (Phase 3 default is Chromium only).
- Password-persistence and avatar-upload assertions (no backend API exists — UI-only).

## 3. Test Environment
- **Package manager:** npm (`package-lock.json` present).
- **App under test:** `npm run dev` → Vite dev server at **http://localhost:3000** (`--host=0.0.0.0`).
- **Target for E2E:** **local dev server** against a **dev/demo Supabase project**. Rationale: the app has **no mock data fallback** — `src/lib/supabase.ts` throws on import if `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are missing, so a live (non-production) Supabase is mandatory. Preview build (`npm run preview`) is an acceptable alternative; a deployed/staging URL can be targeted later via `PLAYWRIGHT_BASE_URL`.
- **Base URL:** `process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'` (note: **3000**, not Vite's default 5173).
- **Browser:** Chromium (default project).
- **Web server:** Playwright `webServer` may run `npm run dev` and `reuseExistingServer: true` locally. ⚠️ Because a clean context can boot **already authenticated as SUPER_ADMIN** (empty-session auto-seed), every test must establish a known auth state first (clear `localStorage`, then detect login screen).

## 4. Required Test Accounts
Password for all: **`password123`**. Emails must exist and be active in the `users` table (all confirmed present, including GUARDIAN as of 2026-07-03).

| Role | Email | Env Var |
|---|---|---|
| SUPER_ADMIN | `admin@stsn.edu.ph` | `E2E_SUPER_ADMIN_EMAIL` |
| ADMIN | `admin@cdsta.edu.ph` | `E2E_ADMIN_EMAIL` |
| REGISTRAR | `registrar@stsn.edu.ph` | `E2E_REGISTRAR_EMAIL` |
| ACCOUNTING | `accounting@stsn.edu.ph` | `E2E_ACCOUNTING_EMAIL` |
| CASHIER | `cashier@stsn.edu.ph` | `E2E_CASHIER_EMAIL` |
| TEACHER | `teacher@stsn.edu.ph` | `E2E_TEACHER_EMAIL` |
| STUDENT | `student@stsn.edu.ph` | `E2E_STUDENT_EMAIL` |
| HR | `hr@stsn.edu.ph` | `E2E_HR_EMAIL` |
| GUIDANCE | `guidance@stsn.edu.ph` | `E2E_GUIDANCE_EMAIL` |
| NURSE | `nurse@stsn.edu.ph` | `E2E_NURSE_EMAIL` |
| PAYROLL | `payroll@stsn.edu.ph` | `E2E_PAYROLL_EMAIL` |
| GUARDIAN | `parent.demo@stsn.edu.ph` ✅ (now seeded) | `E2E_PARENT_EMAIL` (blank → skip) |

A single shared password env var (`E2E_PASSWORD=password123`) keeps the literal out of specs. No real secrets are committed; `.env` for tests holds only demo values.

## 5. Required Test Data
| Workflow | Data needed | Status | Action |
|---|---|---|---|
| Login / RBAC / smoke | One active user per role | ✅ (incl. GUARDIAN) | ✅ Done — read-only |
| Profile | Signed-in user's linked record | ✅ | ✅ Done |
| Enrollment (read) | Existing students/enrollments | ✅ | ✅ Done |
| Enrollment (write) | A disposable demo student + open school year | ⏸ | Create in-test; clean up after |
| Assessment/Payment (write) | Enrollment from the write test | ⏸ | Chain from enrollment; clean up |
| Parent Portal (read login) | GUARDIAN user | ✅ `parent.demo@stsn.edu.ph` | ✅ Done |
| Parent Portal (deep) | guardian↔student link | ⏸ | Deferred |

## 6. Safe Cleanup Strategy
- **Default posture:** P0–P2 tests are **read-only** — no cleanup needed.
- **Write tests (P3):** each test creates records tagged with a unique run marker (e.g. name/email prefix `E2E-`), and a Playwright `afterEach`/`afterAll` deletes **only those** records via the Supabase anon client (or a dedicated cleanup script `tests/e2e/scripts/cleanup.ts`).
- **Hard rules:** never `truncate`; never delete reference/maintenance rows; never touch production. Cleanup targets only `E2E-`-tagged rows in transactional tables (`students`, `enrollments`, `enrollment_subjects`, `assessments`, `assessment_fees`, `payments`).
- Cleanup script + affected-table list to be proposed and **approved separately** before any write test is enabled.

## 7. Proposed Folder Structure

**As implemented (2026-07-03).** The per-module read-only smoke specs proposed
below were consolidated into `smoke.spec.ts` (per-role landing) + `workflows.spec.ts`
(read-only navigation of enrollment/student/accounting/cashiering/hr/payroll/reports/
faculty) to avoid duplication. The remaining per-module spec files (`enrollment.spec.ts`,
`accounting.spec.ts`, etc.) are reserved for the deferred write-flow pass.

```text
playwright.config.ts             # ✅ created
tests/e2e/
  auth.spec.ts                   # ✅ auth + session + user-switch (7)
  rbac.spec.ts                   # ✅ menu visibility + direct-URL enforcement (20)
  user-profile.spec.ts           # ✅ read-only fields + password notice (3)
  smoke.spec.ts                  # ✅ per-role landing sweep (11)
  workflows.spec.ts              # ✅ read-only workflow navigation (9)
  parent-portal.spec.ts          # ✅ guardian login (1) — runs (account seeded)
  # enrollment/student-profile/accounting/cashiering/hr/payroll/reports/faculty
  # → deferred to the write-flow pass
  helpers/
    auth.ts                      # ✅ login(role)/loginByEmail/loginByQuickButton/logout/ensureLoggedOut
    navigation.ts                # ✅ sidebarButton / sidebarHas / goto
    assertions.ts                # ✅ expectAccessDenied / expectNotAccessDenied / expectModuleRendered
    test-data.ts                 # ✅ role→email map, sidebar expectations, RBAC matrix, workflow routes
```

## 8. Recommended Test Cases
Status legend: ✅ implemented & passing · 🔀 covered by a consolidated spec · ⏸ deferred (write-flow pass).

| Status | Priority | Spec File | Test Case | Role | Expected Result |
|---|---|---|---|---|---|
| ✅ | P0 | auth | Login via form with valid email + `password123` | SUPER_ADMIN | Sidebar renders; lands on Dashboard |
| ✅ | P0 | auth | Wrong password rejected | SUPER_ADMIN | "Invalid credentials" shown; stays on login |
| ✅ | P0 | auth | Quick Demo Account button logs in | STUDENT | Lands on `/student-portal` |
| ✅ | P0 | auth | Login persists session in localStorage | REGISTRAR | Session key written |
| ✅ | P0 | auth | Logout returns to login + clears session | SUPER_ADMIN | Email input visible; session key cleared |
| ✅ | P0 | auth | First menu item selected by default | SUPER_ADMIN | Active nav item = Dashboard |
| ✅ | P0 | auth | User switch — no page carry-over | SUPER_ADMIN→STUDENT | Lands on `/student-portal`, not `/core-setup` |
| ✅ | P0 | rbac | Menu visibility matches role | each role (11) | Only allowed modules present in `aside` |
| ✅ | P0 | rbac | Direct-URL to disallowed module blocked | 4 role/route pairs | "not available for your current access" state |
| ✅ | P0 | rbac | Direct-URL to allowed module renders | 4 role/route pairs | Module renders (not denied) |
| ✅ | P0 | rbac | Super Admin sidebar broader than Cashier | SA vs CASHIER | More nav items for Super Admin |
| ✅ | P1 | smoke | Each role lands on a rendered module | each role (11) | Shell renders (not loading/unavailable) |
| ✅ | P1 | user-profile | Profile reachable | STUDENT | `/profile` heading "My Profile" |
| ✅ | P1 | user-profile | Identity fields read-only/disabled | STUDENT | Disabled inputs; New Password editable |
| ✅ | P1 | user-profile | Update Password shows "not connected" notice | TEACHER | Toast: not connected to server yet |
| ✅ | P1 | workflows | Enrollment page renders | REGISTRAR | Registrar module renders |
| ✅ | P1 | workflows | Student Directory renders | REGISTRAR | Directory renders |
| ✅ | P1 | workflows | Student Portal tabs render | STUDENT | overview/grades/ledger/profile render |
| ✅ | P1 | workflows | Accounting sub-nav renders | ACCOUNTING | dashboard/ledger/GL/trial-balance render |
| ✅ | P1 | workflows | Cashiering pages render | CASHIER | queue/history/reports render |
| ✅ | P2 | workflows | HR pages render | HR | dashboard/leave/attendance render |
| ✅ | P2 | workflows | Payroll pages render | PAYROLL | dashboard/management render |
| ✅ | P2 | workflows | Reports render | SUPER_ADMIN | registrar + admin reports render |
| ✅ | P2 | workflows | Teacher Board renders | TEACHER | overview/grades encoding render |
| ✅ | — | parent-portal | Guardian lands on Parent Portal | GUARDIAN | `/guardian-portal` renders |
| ⏸ | P3 | parent-portal | Linked students display | GUARDIAN | Deferred (needs guardian↔student link) |
| ⏸ | P3 | enrollment | Create enrollment → assessment generated | REGISTRAR | Deferred (write flow + cleanup) |
| ⏸ | P3 | cashiering | Post payment against approved assessment | CASHIER | Deferred (write flow + cleanup) |
| ⏸ | — | auth | School context (STSN/CDSTA) selection assertion | ADMIN | Not yet asserted (login uses each account's own school) |

**Actual result:** 51 tests implemented, **51 passing** (see the test report). Two additional
RBAC cases beyond the original list were added (direct-URL *allowed* renders; Super-Admin-vs-Cashier
breadth), and the read-only workflow cases were consolidated into `workflows.spec.ts`.

## 9. Commands to Run
```bash
# Playwright test runner already installed (@playwright/test@1.61).
# Install browser binaries (one-time):
npx playwright install chromium

# Start the app (separate terminal) OR let Playwright's webServer launch it:
npm run dev            # http://localhost:3000

# Run the suite:
npx playwright test
npx playwright test tests/e2e/auth.spec.ts        # single spec
npx playwright test --project=chromium --headed   # debug

# Report:
npx playwright show-report
```

## 10. Risks and Blockers
1. **Live Supabase required at boot** — need valid dev `VITE_SUPABASE_*` env; no offline mode. *(Held true; ran against local `.env`.)*
2. ✅ **Auto-login seeding** — RESOLVED as the top implementation issue: the async `initialize()` auto-seeds SUPER_ADMIN, and logging in during that window silently fails then masquerades as success. Helpers now wait for `initialize()` to settle before logout/login and confirm the login overlay detaches. *(This was the root cause of the initial 17 failures.)*
3. ~~**RBAC override via `security_*` catalog**~~ — Not observed: with real logins, each role's rendered sidebar matched the expected per-role modules. The earlier "everyone sees everything" symptom was the auto-seed masquerade (#2), not a catalog override.
4. ⏸ **Write tests mutate shared cloud data** — still gated behind dedicated project + cleanup approval (deferred).
5. **Deleted `OnlineLearningPage` vs. lingering "Online Learning" student nav child** — not exercised by read-only specs; revisit if a student LMS nav test is added.
6. **Optimistic writes** — relevant only to the deferred write-flow pass.
7. ✅ **GUARDIAN account** — RESOLVED: `parent.demo@stsn.edu.ph` now exists; Parent Portal read login test runs and passes.

## 11. Approval — RESOLVED (confirmed 2026-07-03)
All Phase 3 gates were answered and the read-only pass is complete:
- [x] Target environment = **local dev server (`http://localhost:3000`) + dev Supabase** — confirmed.
- [x] First implementation pass = **P0–P2 read-only / RBAC** specs only; write flows deferred — confirmed.
- [x] Test DB = **existing local `.env`**, confirmed non-production; no data mutated.
- [x] Created `playwright.config.ts`, `tests/e2e/**`, and `.env.example` E2E variables — done; no production credentials committed.
- [x] **Write flows** deferred to a later, separately-approved pass (with a cleanup script). **Parent Portal** read login was un-blocked (account seeded) and included.

**Outcome:** 51/51 tests passing. See [playwright-e2e-test-report.md](./playwright-e2e-test-report.md).

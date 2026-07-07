# STSN Connect — Playwright E2E Test Report

> Phase 3–5 result for the approved **P0–P2 read-only / RBAC** scope. No Supabase
> data was created or mutated. Tests ran against the local dev server and the dev
> Supabase configured in the project `.env`.

## 1. Test Run Summary
- **Date/time:** 2026-07-03 (local)
- **Environment:** Local dev server (`npm run dev`) + dev Supabase from `.env`
- **Base URL:** http://localhost:3000
- **Browser:** Chromium (Desktop Chrome, 1440×900)
- **Total tests:** 51
- **Passed:** 51
- **Failed:** 0
- **Skipped:** 0
- **Duration:** ~5.0 min (6 workers)

## 2. Files Created or Modified
| File | Purpose |
|---|---|
| `playwright.config.ts` | Chromium project, base URL from env, HTML report, screenshot/video/trace on failure, `webServer` runs `npm run dev` |
| `tests/e2e/helpers/test-data.ts` | Role→account map (env-overridable), sidebar expectations, RBAC URL matrix, workflow routes |
| `tests/e2e/helpers/auth.ts` | `ensureLoggedOut` / `login` / `loginByEmail` / `loginByQuickButton` / `logout` |
| `tests/e2e/helpers/navigation.ts` | Sidebar locators + `goto` |
| `tests/e2e/helpers/assertions.ts` | `expectAccessDenied` / `expectNotAccessDenied` / `expectModuleRendered` |
| `tests/e2e/auth.spec.ts` | Login/logout/session/user-switch (7) |
| `tests/e2e/rbac.spec.ts` | Sidebar visibility + direct-URL enforcement (20) |
| `tests/e2e/user-profile.spec.ts` | Profile read-only + password notice (3) |
| `tests/e2e/smoke.spec.ts` | Per-role landing smoke (11) |
| `tests/e2e/workflows.spec.ts` | Read-only workflow smoke (9) |
| `tests/e2e/parent-portal.spec.ts` | Guardian portal (1) |
| `package.json` | Added `test:e2e`, `test:e2e:ui`, `test:e2e:report` scripts |
| `.env.example` | Documented `PLAYWRIGHT_BASE_URL` + `E2E_*` variables |
| `.gitignore` | Ignore `test-results/`, `playwright-report/`, caches |
| `tsconfig.json` | Excluded `tests/` from the app typecheck (keeps `npm run lint` clean) |

## 3. Commands Used
```bash
npx playwright install chromium     # one-time browser download
npx playwright test --list          # verify 51 tests parse
npx playwright test                 # full run (auto-starts npm run dev)
npx playwright show-report          # open the HTML report
npm run lint                        # app typecheck still passes (exit 0)
```

## 4. Test Accounts Used
Password: the app's demo stub (never a real secret). Accounts read from `users` in the dev DB.

| Role | Email | Notes |
|---|---|---|
| SUPER_ADMIN | `admin@stsn.edu.ph` | Admin Administrator |
| ADMIN | `admin@cdsta.edu.ph` | CDSTA Administrator |
| REGISTRAR | `registrar@stsn.edu.ph` | |
| ACCOUNTING | `accounting@stsn.edu.ph` | |
| CASHIER | `cashier@stsn.edu.ph` | |
| TEACHER | `teacher@stsn.edu.ph` | |
| STUDENT | `student@stsn.edu.ph` | |
| HR | `hr@stsn.edu.ph` | |
| GUIDANCE | `guidance@stsn.edu.ph` | |
| NURSE | `nurse@stsn.edu.ph` | |
| PAYROLL | `payroll@stsn.edu.ph` | |
| GUARDIAN | `parent.demo@stsn.edu.ph` | **Now exists** — corrects discovery report §10 |

## 5. Test Cases Added
| Spec File | Test Case | Status |
|---|---|---|
| auth | Login via form → lands in app (`/dashboard` for Super Admin) | ✅ |
| auth | Wrong password rejected, stays on login | ✅ |
| auth | Quick Demo Account button logs student in → `/student-portal` | ✅ |
| auth | Login persists session in localStorage | ✅ |
| auth | Logout returns to login + clears session | ✅ |
| auth | First menu item selected by default after login | ✅ |
| auth | User switch — no previous-user page carry-over | ✅ |
| rbac | Sidebar visibility per role (11 roles) | ✅ |
| rbac | Super Admin sidebar broader than Cashier | ✅ |
| rbac | Direct-URL blocked for disallowed module (4 role/route pairs) | ✅ |
| rbac | Direct-URL allowed module renders (4 pairs) | ✅ |
| user-profile | Reachable by non-admin role | ✅ |
| user-profile | Identity fields read-only/disabled; New Password editable | ✅ |
| user-profile | Update Password shows "not connected" notice | ✅ |
| smoke | Per-role landing renders (11 roles) | ✅ |
| workflows | Read-only module navigation renders (9 role/area groups) | ✅ |
| parent-portal | Guardian lands on Parent Portal | ✅ |

## 6. Passed Tests
All 51 tests passed. Highlights of what is now covered and verified:
- **Auth stub** behaves correctly (valid email + `password123`; wrong password rejected).
- **Session lifecycle** — localStorage session written on login, cleared on logout.
- **User-switching guarantee** — a new login lands on the new user's first allowed menu item and never inherits the previous user's route (Super Admin `/core-setup` → Student `/student-portal`).
- **RBAC differentiation is real** — each role sees only its permitted modules; disallowed modules are blocked on direct URL with the access-denied state; allowed modules render. (This disproved an earlier suspicion of a permission override — see §9.)
- **My Profile** — identity fields are display-only; only the New Password field + 2FA are interactive; password update surfaces the "not connected to the server yet" notice.
- **Every role** lands on a rendered module, and the primary read-only workflow pages (enrollment, student directory/portal, accounting sub-nav, cashiering, HR, payroll, reports, teacher board) render.

## 7. Failed Tests
None in the final run.

| Test | Failure Reason | Evidence | Fix Applied |
|---|---|---|---|
| (initial run) 17 RBAC/auth tests | Test-harness race, not an app bug | traces/screenshots in `test-results/` | See §9 — auth helper now waits for `initialize()` to settle |

## 8. Skipped Tests
None. The Parent Portal test auto-skips only when `E2E_PARENT_EMAIL` is blank; the demo guardian account exists, so it ran.

## 9. Bugs Found
| Area | Bug | Severity | Evidence | Recommended Fix |
|---|---|---|---|---|
| Test harness (not app) | `ensureLoggedOut` raced the app's async `initialize()`: the login overlay renders while data is still loading, so a form submit ran before `users` loaded → `store.login()` returned false → `initialize()` then **auto-seeded SUPER_ADMIN**, which masqueraded as a successful login (wrong user, null session). | High (test correctness) | 17 initial failures; diagnostics showed `menu=AA`, `session=null` | **Fixed** — helper now waits for the authenticated shell (auto-seed complete, `users` loaded) before logout/login, and waits for the login overlay to *detach* to confirm a real login. All 51 green after the fix. |
| App behavior (observation) | On a fresh, no-session context the app **auto-seeds SUPER_ADMIN** and boots already authenticated. Convenient for demos, but it means "logged out" is never the true initial state. | Low (by design) | `initialize()` in `services/store.ts` | No change requested. Documented so future tests always normalize auth state first. |
| Doc correction | Discovery report §10 stated no GUARDIAN user exists; a demo guardian (`parent.demo@stsn.edu.ph`) has since been seeded. | Info | `users` query | Parent Portal test enabled; report noted here. |

## 10. Missing Workflow Pieces
### 10.1 Confirmed Missing in Code
- No write-flow E2E yet (out of approved scope): enrollment create, assessment approval, payment posting, grade save, payroll actions.

### 10.2 UI Exists but Not Wired
- My Profile password update + avatar upload + 2FA are UI-only (no backend API) — intentionally asserted as such, not as functional persistence.

### 10.3 Data Exists but No UI
- Not evaluated in this read-only pass.

### 10.4 Needs Business Confirmation
- Deep field-level validation on enrollment (write path) — deferred with the write-flow pass.
- Whether the security catalog is intended to mirror the static role map exactly (this run shows they currently agree for the seeded accounts).

## 11. Demo Readiness Assessment
**Ready for demo (read-only paths).** Authentication, session/user-switching, role-based access control, per-role landing, the profile page, and all primary read-only module screens load and behave correctly across all 11 staff/student roles plus the guardian. No blocking defects were found in the tested surface.

Caveat: this pass deliberately did not exercise data-writing flows (enrollment→assessment→payment, grade save, payroll runs). Those remain unverified and should be covered in a separately-approved pass against a dedicated dev project with a cleanup script.

## 12. Recommended Next Fixes / Steps (prioritized)
1. **Approve a write-flow pass** — enrollment → assessment → payment happy path, using `E2E-` tagged demo records + an `afterAll` cleanup script; run against a disposable dev project.
2. **Add a `test.beforeEach` global auth reset** if the suite grows, to centralize the "wait out initialize, then logout" normalization.
3. **Refresh the discovery report §10** to reflect the seeded guardian account.
4. **Consider a `data-testid` on the RBAC empty state** and on key module headers to make future assertions less text-dependent (only if it can be added without changing UI/behavior).
5. **CI wiring** — run `npm run lint` + `npx playwright test` on PRs, pointing `PLAYWRIGHT_BASE_URL` / `VITE_SUPABASE_*` at a dev project via secrets.

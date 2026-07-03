# STSN Connect — Playwright E2E Workflow Discovery Report

> **Scope:** Read-only inspection of the current repository. No app code, schema, migrations, or tests were changed. This report describes the *actual* wired behavior as of branch `dev`.

---

## 0. Architecture at a glance

| Concern | Implementation |
|---|---|
| Framework | React 19 + Vite 6, TypeScript |
| Routing | `react-router-dom` v7, **single-shell SPA** — one `<App>` renders sidebar + `AppModuleRenderer` |
| State | **Zustand** single store (`src/services/store.ts`, ~2,500 lines) |
| Backend | **Supabase** (`@supabase/supabase-js`). `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` required at boot or the app throws. |
| Data load | `loadAllData()` eagerly fetches ~80 tables into the store on `initialize()` |
| RBAC | Dual layer: hardcoded `ROLE_PERMISSIONS` (fallback) **+** DB security catalog (`security_*` tables → `effectivePermissions`) |
| Auth | **Mock / demo auth** — no Supabase Auth, no real password verification (see §2) |
| Test tooling | `@playwright/test` + `playwright` installed, **but no config, no `tests/`, no specs exist yet** |

There is **no per-route `<ProtectedRoute>` guard**. Access control happens two ways:
1. **Sidebar filtering** — `getNavItemsForRole` + `hasPageAccess` prune what's visible.
2. **Render gating** — `AppModuleRenderer` renders a module only if `allowedModules.includes(activeModule)`, else a "Module unavailable" card.
3. **Redirect sync** — an effect in `App.tsx` rewrites the URL to the user's first allowed route on login and preserves known deep links.

---

## 1. Current discovered workflow (login → final transaction/report)

### The primary financial "happy path" (Enrollment → Cash Receipt)

```
LOGIN (mock, pick demo account)
  │
  ▼
[REGISTRAR] Enrollment  ── submitNewEnrollment()
  │  creates: Enrollment(status="For Assessment") + StudentAssessment + default Requirements
  │  student.enrollmentStatus = "For Assessment"
  ▼
[REGISTRAR] Document verification (verifyRequirement / uploadRequirementFile → Supabase Storage bucket "student-documents")
  │  approveEnrollment() is BLOCKED while any requirement.status === "Pending"
  ▼
[ACCOUNTING] Student Accounts → Billing & Assessment
  │  approveAssessment() → assessment.approvalStatus="Approved for Payment"
  │  cascades: linked Enrollment → "For Payment", student → "For Payment"
  │  fires notification targetRoles: CASHIER, REGISTRAR, SUPER_ADMIN, ADMIN
  ▼
[CASHIER] Payment Queue  ── addPayment()
  │  posts Payment (OR number), decrements assessment.balance, marks isPaid
  ▼
[CASHIER] Collection History / Reports  ── reportExportService (final report/OR register)
```

Parallel approval spines exist for **Grades**, **Discounts**, **Leave**, **Payroll runs**, and **Payment voids** (see §4). All of them write to the central `approval_requests / approval_steps / approval_actions` tables via `approvalWorkflowService`, in a fire-and-forget pattern layered on top of the synchronous local state update.

---

## 2. Login / Auth flow (⚠ critical for E2E)

**File:** [src/components/LoginOverlay.tsx](src/components/LoginOverlay.tsx), [src/services/store.ts:728](src/services/store.ts#L728)

- **No Supabase Auth session.** `login(email, "", school)` looks up a user in the already-loaded `users` array by email and checks `isActive`. 
- **Password is a client-side literal:** `handleLoginSubmit` rejects anything except `"password123"`. The actual `login()` store action ignores the password entirely.
- **Session persistence:** user id + active school saved to `localStorage["stsn-connect-auth-session"]`; restored on `initialize()`.
- **Default seeded user:** if no stored session, the store auto-seeds the first `SUPER_ADMIN` — meaning the app can boot *already logged in* as super-admin.
- **Quick Demo Accounts** panel provides one-click login per role, per school (STSN / CDSTA). These are the most reliable E2E entry points.
- **Register tab is fake** — "Register & Initialize Account" simply quick-logs in as `student@stsn.edu.ph`. No account is created.

**Demo accounts present in the login UI:**
`admin@`, `registrar@`, `accounting@`, `teacher@`, `student@`, `hr@` — each for both `stsn.edu.ph` and `cdsta.edu.ph`. (Password `password123` for the manual form; quick buttons need no password.)

> ⚠ **There is NO demo quick-login for CASHIER, PAYROLL, PRINCIPAL, GUIDANCE, NURSE, EMPLOYEE, or GUARDIAN** in the login overlay, even though those roles exist and have modules. E2E for those roles must either type the email manually (if such a user is seeded in the DB) or the test data must be extended.

---

## 3. Roles, modules & navigation

### 3.1 Roles (14)
`SUPER_ADMIN, ADMIN, PRINCIPAL, REGISTRAR, ACCOUNTING, PAYROLL, HR, TEACHER, CASHIER, NURSE, GUIDANCE, STUDENT, EMPLOYEE, GUARDIAN`

### 3.2 Role → Module map (hardcoded fallback, `ROLE_PERMISSIONS`)

| Role (canonical) | Default landing | Modules granted |
|---|---|---|
| super-admin | `/dashboard` (via first-allowed) | **All** modules |
| admin | dashboard | MY_PROFILE, DASHBOARD, ACTION_CENTER, STUDENT_DIRECTORY, LIBRARY_SYSTEM, HR_MANAGEMENT, REGISTRAR_REPORTS, ADMIN_REPORTS, GUARDIAN_PORTAL *(QA view)* |
| principal | `/student-directory` | MY_PROFILE, ACTION_CENTER, STUDENT_DIRECTORY, GRADING, CURRICULUM, FACULTY_ADMIN, SCHEDULING, LMS, REGISTRAR_REPORTS |
| registrar | `/registrar` | MY_PROFILE, ACTION_CENTER, REGISTRAR, STUDENT_DIRECTORY, GRADING, CURRICULUM, FACULTY_ADMIN, CLASS_SECTIONING, BOOKS_SETUP, LIBRARY_SYSTEM, LMS, REGISTRAR_REPORTS |
| accounting | `/accounting/dashboard` | MY_PROFILE, ACTION_CENTER, ACCOUNTING, BOOKS_SETUP |
| cashier | `/cashier/queue` | MY_PROFILE, CASHIER |
| teacher | `/faculty/portal/overview-advisory` | MY_PROFILE, FACULTY_PORTAL, GRADING, CURRICULUM, LMS |
| student | `/student-portal/overview` | MY_PROFILE, STUDENT_PORTAL, LMS, CONSULTATION |
| hr | `/hr/hr-dashboard` | MY_PROFILE, ACTION_CENTER, HR_MANAGEMENT |
| guidance | `/guidance` | MY_PROFILE, GUIDANCE, GUIDANCE_REPORTS |
| nurse | `/clinic` | MY_PROFILE, NURSE_CLINIC, CLINIC_REPORTS |
| payroll | `/payroll/dashboard` | MY_PROFILE, ACTION_CENTER, PAYROLL_DASHBOARD, PAYROLL_MANAGEMENT |
| guardian | `/guardian-portal` | MY_PROFILE, GUARDIAN_PORTAL |
| employee | (falls to FACULTY_PORTAL default) | *not in `ROLE_PERMISSIONS` → falls back to `["DASHBOARD"]`* ⚠ |

> ⚠ **`EMPLOYEE` has no entry in `ROLE_PERMISSIONS`** (`toCanonicalRole` presumably lacks it), so `getPermissionsForRole` returns `["DASHBOARD"]` fallback while `getDefaultRouteForRole` sends EMPLOYEE to `/faculty/portal/...`. Potential dead-end / access mismatch for that role.

> **Important nuance:** When the DB security catalog is loaded and *not* in fallback mode, the effective module set from the DB **overrides** this table (`moduleOverride` in `App.tsx`). So real behavior depends on seeded `security_*` rows. Tests must account for whichever source is authoritative in the target environment.

### 3.3 Page-by-page navigation map (route → module)

| Path | Module | Notes |
|---|---|---|
| `/` | — | neutral; redirects to first-allowed on login |
| `/profile` | MY_PROFILE | shared, always accessible when logged in |
| `/dashboard` | DASHBOARD | admin command center |
| `/action-center` | ACTION_CENTER | approvals/pending queue |
| `/registrar` | REGISTRAR | enrollment workspace |
| `/registrar/reports` | REGISTRAR_REPORTS | |
| `/student-directory` | STUDENT_DIRECTORY | → deep links to student portal |
| `/student-portal/:sub?studentId=` | STUDENT_PORTAL | subs: overview, grades, ledger, profile, elearning*, enrollment* (*student-only) |
| `/accounting/:sub` | ACCOUNTING | subs: dashboard, ledger, discounts, billing, holds, setup, GL, AR, AP, reports |
| `/accounting-dashboard` | ACCOUNTING_DASHBOARD | |
| `/cashier/:sub` | CASHIER | queue, history, reports |
| `/grading` | GRADING | grades directory |
| `/curriculum` | CURRICULUM | syllabus pathways |
| `/faculty/admin` | FACULTY_ADMIN | teacher management |
| `/faculty/portal/:sub` | FACULTY_PORTAL | overview-advisory, class-schedule-subjects, attendance-monitoring, student-grades-encoding, reports, faculty-profile |
| `/hr/:sub` | HR_MANAGEMENT | hr-dashboard, employee-life-cycles, new-employee-profile, time & attendance (nested), talent (nested) |
| `/payroll/dashboard` | PAYROLL_DASHBOARD | |
| `/payroll/:sub` | PAYROLL_MANAGEMENT | payroll-management, salary-payouts, taxes, benefits |
| `/accounts/:sub` | ACCOUNTS_SECURITY | user-security, delegation-management, audit-log (+ admin-reports target) |
| `/core-setup/:sub` | CORE_SETUP | academic_categories, … |
| `/scheduling` | SCHEDULING | |
| `/class-sectioning` | CLASS_SECTIONING | |
| `/lms/:sub?courseId=` | LMS | dashboard, courses, progress, assessments, exams, question-builder, teacher-board |
| `/books-setup` | BOOKS_SETUP | |
| `/library/:sub` | LIBRARY_SYSTEM | dashboard, catalog, inventory, borrowing, returns, overdue, lost-damaged, fines, maintenance |
| `/clinic` , `/clinic/reports` | NURSE_CLINIC / CLINIC_REPORTS | |
| `/guidance` , `/guidance/reports` | GUIDANCE / GUIDANCE_REPORTS | |
| `/consultation` | CONSULTATION | |
| `/admin/reports` | ADMIN_REPORTS | |
| `/guardian-portal` | GUARDIAN_PORTAL | parent portal |
| *(unknown path)* | DASHBOARD | `isKnownPath:false` → canonical `/dashboard` |

---

## 4. Critical business workflows

### 4.1 Enrollment ✅ (fully wired, store + Supabase)
- **Entry:** REGISTRAR module → `EnrollmentWizard`. Assessment fees computed via `computeMockAssessment` (see §7).
- **Store:** `submitNewEnrollment` inserts `enrollments`, `enrollment_subjects`, `assessments`, `assessment_fees`; seeds default `requirements`.
- **Approval gate:** `approveEnrollment(enrollmentId, section)` **blocks** if any requirement still `Pending`; on success sets enrollment/student → `Enrolled` and assigns section.
- **Online applications:** `online_enrollment_applications` table + `updateOnlineEnrollmentApplicationStatus` (For Completion / Incomplete handling).

### 4.2 Student profile update ✅
- STUDENT_PORTAL `profile` sub-page + STUDENT_DIRECTORY. `updateStudent` (optimistic + `dbUpdate("students")`). Guardian/education sub-records: `student_guardians`, `student_education_backgrounds` with full CRUD in store.

### 4.3 Parent / student linking ⚠ (partial)
- **File:** [src/features/guardian/pages/GuardianPortalPage.tsx](src/features/guardian/pages/GuardianPortalPage.tsx)
- Guardian sees children via **two** link mechanisms: `student.linkedGuardianIds` includes current user id, **OR** a `student_guardians` row whose `email` matches the guardian's login email (case-insensitive).
- **No dedicated UI to create the parent↔student link** was found (linking is expected to be pre-seeded / done via registrar student edit). `ADMIN` gets a read-only QA view of all students regardless of linkage.
- Portal is **entirely read-only** (grades, finance, documents, schedule). "Request a Consultation" just toggles local UI state — no persistence.

### 4.4 Faculty / employee management ✅
- FACULTY_ADMIN (`updateTeacher`), HR_MANAGEMENT employee lifecycle (`addEmployee`, `updateEmployee`, `employee_lifecycle_events`, bulk Excel import). Reusable "New Employee Profile" and "Faculty Profile" workspaces.

### 4.5 HR workflow ✅ (deep)
- Dashboard, Employee Lifecycles, Time & Attendance (time logs, shifts, attendance, **Leave filing + 1-level approval**), Talent Acquisition (recruitment requisitions, applicants, interviews, onboarding tasks). All store-backed to Supabase.

### 4.6 Payroll workflow ✅
- PAYROLL_DASHBOARD + PAYROLL_MANAGEMENT. Periods → Runs (`updatePayrollRunStatus`) → Payroll Lines → Salary Payout Batches (`releaseSalaryPayoutBatch`). Benefits, statutory rules, tax tables/brackets. `pendingPayrollRuns` drives the Action Center badge.

### 4.7 Accounting workflow ✅
- Student ledgers, billing/assessment approval (`approveAssessment` / `returnAssessmentToRegistrar` / `rejectAssessment`), discounts (2-level: `approveDiscountRequest(level 1|2)`), financial holds, GL/AR/AP, financial statements. Full double-entry scaffolding present in nav.

### 4.8 Cashiering / payment ✅
- **File:** [src/features/cashier/pages/CashierModulePage.tsx](src/features/cashier/pages/CashierModulePage.tsx). Payment Queue → `addPayment` posts OR + updates balance; Collection History; **Void requests** (`submitVoidRequest` → `approveVoidRequest`/`rejectVoidRequest`). Cashier reports via `reportExportService`.

### 4.9 Approvals ✅ (centralized)
- ACTION_CENTER aggregates per-role pending work; `usePendingCounts` feeds sidebar badges. Central approval engine: `approvalWorkflowService` writing `approval_requests/steps/actions`. Delegations: `ACCOUNTS_SECURITY → delegation-management` (`addDelegation`, `getActiveDelegation`). Central audit log (`audit_log` + `logAudit`).

### 4.10 Reports ✅
- Dedicated report pages: Registrar, Guidance, Clinic, Admin; plus Cashier & Accounting in-module reports. All via `reportExportService` (PDF via `pdf-lib`/`pdfjs-dist`).

---

## 5. Missing / incomplete workflow pieces

1. **No real authentication** — password never verified server-side; no Supabase Auth session/JWT. RLS (referenced in comments, e.g. migration 0035) cannot be exercised because all reads use the anon key with a client-picked identity.
2. **Register flow is a stub** — creates nothing; silently logs in a fixed student.
3. **No parent↔student linking UI** — linkage must be pre-seeded; guardian onboarding path is incomplete.
4. **Guardian "Request Consultation"** — non-persistent (local `useState` only).
5. **Missing demo logins** for CASHIER / PAYROLL / PRINCIPAL / GUIDANCE / NURSE / EMPLOYEE / GUARDIAN — blocks one-click E2E for those roles.
6. **`EMPLOYEE` role** — not present in `ROLE_PERMISSIONS`; module access falls back to `["DASHBOARD"]` while its default route points to FACULTY_PORTAL → likely "Module unavailable".
7. **LMS schema not yet applied** — two migrations are **untracked/new** (`20260702120000_lms_module_schema.sql`, `20260702130000_lms_assessments_schema.sql`). If not run against the target DB, every `lms_*` query fails and the LMS shows its error state.
8. **`OnlineLearningPage.tsx` deleted** (git status: `D`) — the old ONLINE_LEARNING module was replaced by LMS; confirm no dangling references.
9. **Student self-service `enrollment` / `elearning`** portal tabs are `showForRoles: ["STUDENT"]` — verify these sub-pages are implemented, not placeholders.

---

## 6. Pages NOT yet wired to database

Almost everything **is** DB-wired through the store. Known exceptions / caveats:

- **Guardian consultation request** — UI-only, no write.
- **Login/Register** — auth is client-only; register writes nothing.
- **Dashboard trend/among some KPI widgets** — driven by aggregate tables (`enrollment_history_stats`, summaries); if those tables are empty the widgets render zero/empty rather than failing.
- Anything gated behind the **unapplied LMS migrations** is effectively unwired until the SQL is run.

---

## 7. Pages still using mock / local / computed data

- **`src/services/mockAssessmentService.ts`** — `computeMockAssessment`, `generatePaymentSchedule` used by the **Enrollment Wizard** and **Cashier** for fee computation. (Note: the *schedule constants* were migrated to DB tables `tuition_fee_schedule`, `misc_fee_schedule`, etc., but the compute helpers remain client-side.)
- **Login demo accounts** — hardcoded account lists per school in `LoginOverlay`.
- **Consultation module** — appointment types are local TS types; data loads from a DB table via `dbSelectAll` (so DB-backed, not mock).
- No feature was found using purely inline `MOCK_`/`DEMO_` arrays for its primary table data (grep returned none in LMS; store hydration is DB-first).

---

## 8. Recommended Playwright E2E test coverage

> There is **no Playwright config yet**. First deliverable is `playwright.config.ts` (baseURL `http://localhost:3000`, `webServer: npm run dev`) + a `tests/` dir. Add an `npm run test:e2e` script.

**Priority 1 — smoke & auth**
- App boots without throwing (env vars present), login overlay renders.
- Quick-login each available demo role → lands on that role's default route → sidebar shows expected top-level modules.
- Logout clears session and returns to `/`; reload restores session from localStorage.
- RBAC negative: navigate directly to a disallowed path (e.g. student → `/payroll/dashboard`) → "Module unavailable" card.

**Priority 2 — the financial happy path (cross-role)**
- Registrar: create enrollment via `EnrollmentWizard` → assert assessment created, status "For Assessment".
- Registrar: verify/approve requirements; assert `approveEnrollment` is blocked while a doc is Pending.
- Accounting: approve assessment → assert cascade to "For Payment" + notification.
- Cashier: post payment in Payment Queue → assert OR number, balance decremented, appears in Collection History.
- Cashier: run a report (e.g. OR Register) → assert export.

**Priority 3 — approval spines**
- Grades: teacher encode → submit → principal approve/return.
- Discounts: request → level-1 approve → level-2 approve.
- Leave: file → approve/reject. Payroll: run → approve → payout release. Void: request → approve.
- Action Center badge counts update after each.

**Priority 4 — module CRUD depth**
- LMS (only if migrations applied): create course → add lesson → publish → student enrolls → complete lesson → progress %; author assessment → student attempt → auto-grade → certificate issue.
- Library, Core Setup, HR employee lifecycle, Curriculum/Subject/Section CRUD.

**Priority 5 — read-only portals**
- Student Portal (grades/ledger/COR). Guardian Portal (linked child data; empty-state when unlinked; ADMIN QA view).

**Cross-cutting**
- Multi-school switch (STSN ↔ CDSTA) scopes data correctly.
- Global search (Ctrl/⌘+K). Breadcrumbs. Mobile bottom nav for portal roles.

---

## 9. Suggested test accounts / roles needed

Seed these (all `isActive: true`, password convention `password123` for the manual form) so every role has a deterministic login:

| Role | Suggested email (STSN) | Currently one-click? |
|---|---|---|
| SUPER_ADMIN | `superadmin@stsn.edu.ph` | ❌ (only auto-seeded) |
| ADMIN | `admin@stsn.edu.ph` | ✅ |
| REGISTRAR | `registrar@stsn.edu.ph` | ✅ |
| ACCOUNTING | `accounting@stsn.edu.ph` | ✅ |
| TEACHER | `teacher@stsn.edu.ph` | ✅ |
| STUDENT | `student@stsn.edu.ph` | ✅ |
| HR | `hr@stsn.edu.ph` | ✅ |
| **CASHIER** | `cashier@stsn.edu.ph` | ❌ **add** |
| **PAYROLL** | `payroll@stsn.edu.ph` | ❌ **add** |
| **PRINCIPAL** | `principal@stsn.edu.ph` | ❌ **add** |
| **GUIDANCE** | `guidance@stsn.edu.ph` | ❌ **add** |
| **NURSE** | `nurse@stsn.edu.ph` | ❌ **add** |
| **GUARDIAN** | `parent@stsn.edu.ph` (linked to ≥1 student via `student_guardians.email`) | ❌ **add + link** |
| **EMPLOYEE** | `employee@stsn.edu.ph` | ❌ **add + fix role permissions** |

Also duplicate for `@cdsta.edu.ph` to test the college academic unit. Recommend building a Playwright **storageState / auth fixture** per role (write the localStorage `stsn-connect-auth-session` key directly) to skip the login UI in most specs.

---

## 10. Risks before running automated E2E tests

1. **Shared live Supabase DB** — the app writes optimistically then persists (`dbInsert`/`dbUpdate` fire-and-forget). E2E runs will **mutate real data** (enrollments, payments, payroll). **Use a dedicated test/seed database or transactional reset**, not production.
2. **Fire-and-forget persistence = race conditions** — UI updates before the DB write resolves; a test that reloads immediately may not see persisted rows, and failed writes are only `console.error`'d (no user-visible failure). Tests need explicit waits/retries on reload-based assertions.
3. **Auto-seeded SUPER_ADMIN** — a fresh browser may boot already authenticated as super-admin, contaminating "logged-out" assertions. Clear localStorage in `beforeEach`.
4. **RBAC source ambiguity** — visible modules depend on whether the DB `security_*` catalog is populated (override) or empty (hardcoded fallback). Pin the catalog state in the test DB or assertions will flake between environments.
5. **Unapplied LMS migrations** — running LMS specs against a DB without the two new migrations yields hard errors; apply them first or skip LMS suites conditionally.
6. **No password enforcement** — cannot test real auth failures meaningfully; only "inactive/unknown email" and the client-side `password123` check.
7. **Non-deterministic seed data** — `computeMockAssessment` fee math, `student_no` generation (`students.length + 1`), and OR numbers depend on current row counts; assert on structure/relationships, not exact values.
8. **Multi-school scoping** — `activeSchool` persists in localStorage; a leftover "CDSTA" context can hide STSN data and break specs. Reset it in fixtures.
9. **Storage bucket dependency** — requirement upload/verify hits Supabase Storage (`student-documents`); needs the bucket to exist and anon policy configured, or those steps fail.
10. **Env gating** — the app throws at import if `VITE_SUPABASE_URL`/`ANON_KEY` are missing; CI must provide them or the whole suite fails at boot.

---

### Appendix — key files referenced
- Shell / routing / RBAC redirect: [src/App.tsx](src/App.tsx)
- Route resolution: [src/config/app-routes.config.ts](src/config/app-routes.config.ts)
- Nav tree: [src/config/navigation.config.ts](src/config/navigation.config.ts)
- Role→module map: [src/config/permissions.config.ts](src/config/permissions.config.ts)
- Module render gating: [src/components/layout/AppModuleRenderer.tsx](src/components/layout/AppModuleRenderer.tsx)
- Auth + all workflows: [src/services/store.ts](src/services/store.ts)
- DB hydration: [src/services/dataLoader.ts](src/services/dataLoader.ts)
- Supabase client: [src/lib/supabase.ts](src/lib/supabase.ts)
- Permission checks: [src/hooks/usePermissions.ts](src/hooks/usePermissions.ts)
- LMS data layer: [src/features/lms/data/useLmsData.ts](src/features/lms/data/useLmsData.ts)
</content>
</invoke>

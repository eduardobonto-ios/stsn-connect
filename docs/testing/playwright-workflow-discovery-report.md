# STSN Connect — Playwright Workflow Discovery Report

> Phase 1 output. Discovery only — no tests were written, no packages installed, no
> schema/migrations changed. Findings below are drawn from the actual code in this
> repository (routes, RBAC config, the Zustand store, the Supabase data loader, and the
> existing Playwright screenshot scripts).

---

## 1. Environment Summary
- **Frontend framework:** React 19 + TypeScript, built with Vite 6. Routing via `react-router-dom` 7. Global state via `zustand`. Styling via Tailwind CSS 4. Icons via `lucide-react`.
- **Package manager:** npm (scripts in [package.json](../../package.json)).
- **Dev command:** `npm run dev` → `vite --port=3000 --host=0.0.0.0` → serves at **http://localhost:3000**.
- **Build command:** `npm run build` (`vite build`). Preview: `npm run preview`.
- **Lint/type command:** `npm run lint` → `tsc --noEmit`. (No ESLint, no unit-test runner.)
- **Test command:** ❌ none defined in `package.json`.
- **Playwright installed:** ✅ **Yes** — `@playwright/test@^1.61.1` and `playwright@^1.61.1` are in `devDependencies`. However there is **no `playwright.config.ts`** and **no `tests/` directory**. Two standalone ESM scripts already drive Chromium via the raw `playwright` API: [capture-screenshots.mjs](../../capture-screenshots.mjs) and `capture-missing.mjs`. These are excellent reference material for login/logout/nav automation (selectors below are taken from them and verified against current components).

---

## 2. Current Auth Flow
- **Login page:** [src/components/LoginOverlay.tsx](../../src/components/LoginOverlay.tsx). Rendered by [App.tsx](../../src/App.tsx) whenever `currentUser` is null (`if (!currentUser) return <LoginOverlay />`).
- **Auth model (IMPORTANT — mock credentials over real data):**
  - The password is a **hardcoded literal `"password123"`**. Any other password is rejected client-side (`handleLoginSubmit`). No real password is stored or checked.
  - The email must match an **existing, active user row loaded from Supabase** (`store.login()` looks up `users` by email, requires `isActive`). So *user identity/records are real Supabase data*, but *authentication itself is a demo stub*.
  - A **school context** (STSN / CDSTA) is selected on the login screen and passed into `login()`.
  - "**Quick Demo Accounts**" buttons log in instantly per selected school.
  - Registration tab is a **mock** — it just quick-logs-in as `student@stsn.edu.ph` (no record is created).
- **Logout behavior:** Header → user avatar button (`aria-label="Open user menu"`) → **"Exit Connect Session"** (in [UserProfileDropdown.tsx](../../src/components/common/UserProfileDropdown.tsx)). Also available in the mobile drawer as **"Exit Session"**. Clears the stored session and sets `currentUser=null`, returning to `LoginOverlay`.
- **Default landing page after login:** Computed dynamically in [App.tsx](../../src/App.tsx) — `getFirstAllowedRoute(renderedSidebarItems)` picks the **first menu item the user can actually open** (RBAC-filtered), falling back to `getDefaultRouteForRole(role)` (see [app-routes.config.ts](../../src/config/app-routes.config.ts)). Examples: STUDENT → `/student-portal/overview`, TEACHER/EMPLOYEE → `/faculty/portal/overview-advisory`, CASHIER → `/cashier/queue`, HR → `/hr/hr-dashboard`, SUPER_ADMIN → Dashboard.
- **User switching behavior:** On logout the URL is reset to `/` (an effect drops any previous-user route). On the next login the app lands on the **new** user's first-allowed route — the previous user's page is never inherited. This is explicitly engineered (see comments around `firstAllowedRoute` in App.tsx). **This is a prime RBAC/session regression to cover with tests.**
- **Session/local storage behavior:** Session persisted in `localStorage` under key **`stsn-connect-auth-session`** (`{ userId, activeSchool }`). On boot, `initialize()` restores the user if the stored id maps to an active user; otherwise it clears the key and seeds the first `SUPER_ADMIN` (dev convenience). ⚠️ Because of the SUPER_ADMIN auto-seed, a fresh browser context may boot **already logged in** — tests must handle "already authenticated" vs "login screen" (the capture script does exactly this).

---

## 3. Role-Based Access Summary
Source of truth: `ROLE_PERMISSIONS` in [permissions.config.ts](../../src/config/permissions.config.ts). The security catalog (`security_*` tables) can override this per-user when loaded (non-fallback); otherwise the static map applies. 14 canonical roles.

| Role | Available Modules (menus) | Restricted (not granted) | Notes |
|---|---|---|---|
| **SUPER_ADMIN** | Everything (all 30 modules) | — | Auto-seeded on empty session |
| **ADMIN** | Dashboard, Action Center, Student Directory, Library, HR, Registrar Reports, Admin Reports, Parent Portal | Accounting, Cashier, Payroll mgmt, Core Setup, Accounts Security, all setup modules | Operational oversight only (comment + RLS boundary) |
| **PRINCIPAL** | Action Center, Student Directory, Grading, Curriculum, Faculty Admin, Scheduling, LMS, Registrar Reports | Accounting, HR, Payroll, Cashier | Lands on Student Directory |
| **REGISTRAR** | Admission/Enrollment, Student Directory, Grading, Curriculum, Faculty Admin, Class Sectioning, Books, Library, LMS, Registrar Reports | Accounting, HR, Payroll, Cashier | Lands on `/registrar` |
| **ACCOUNTING** | Accounting, Books | Registrar, HR, Payroll, Cashier | Lands on Accounting dashboard |
| **CASHIER** | Cashiering only | Everything else | Lands on `/cashier/queue` |
| **TEACHER** | Teacher Board (Faculty Portal), Grading, Curriculum, LMS | HR, Accounting, admin | Lands on faculty overview |
| **STUDENT** | Student Portal, LMS, Consultation | All staff modules | Lands on `/student-portal/overview` |
| **HR** | Action Center, HR Management | Payroll mgmt, Accounting | Lands on HR dashboard |
| **GUIDANCE** | Guidance Office, Guidance Reports | — | Lands on `/guidance` |
| **NURSE** | Clinic, Clinic Reports | — | Lands on `/clinic` |
| **PAYROLL** | Action Center, Payroll Dashboard, Payroll Management | HR, Accounting | Lands on payroll dashboard |
| **GUARDIAN** | Parent Portal only | Everything else | ⚠️ **No GUARDIAN user exists in the DB** (see capture script note) |
| **EMPLOYEE** | (falls through to Faculty Portal default route) | — | Treated like faculty for landing |

Every module in `AppModuleRenderer` is also guarded at render time by `allowedModules.includes(...)`, so direct-URL access to a disallowed module shows a **"This page is not available for your current access"** empty state rather than the module. This is directly testable via URL navigation.

---

## 4. Current Menu and Route Map
Routes are path-based (`resolveAppRoute` in [app-routes.config.ts](../../src/config/app-routes.config.ts)); modules are lazy-loaded in [AppModuleRenderer.tsx](../../src/components/layout/AppModuleRenderer.tsx). All data-backed modules read from the central Supabase-loaded store.

| Menu Item | Route | Component/Page | Permission (module) | Data Source |
|---|---|---|---|---|
| Dashboard | `/dashboard` | DashboardPage | DASHBOARD | Supabase (store) |
| Action Center | `/action-center` | ActionCenterPage | ACTION_CENTER | Supabase (store) |
| My Profile | `/profile` | MyProfilePage | MY_PROFILE (all roles) | Supabase (store) |
| Admission → Enrollment | `/registrar` | RegistrarModulePage | REGISTRAR | Supabase |
| Admission → Students | `/student-directory` | StudentDirectoryPage | STUDENT_DIRECTORY | Supabase |
| Admission → Class Sectioning | `/class-sectioning` | ClassSectioningModulePage | CLASS_SECTIONING | Supabase |
| Admission → Class Scheduling | `/scheduling` | SchedulingModulePage | SCHEDULING | Supabase |
| Admission → Faculty | `/faculty/admin` | FacultyAdminPage | FACULTY_ADMIN | Supabase |
| Admission → Syllabus Pathways | `/curriculum` | CurriculumManagementPage | CURRICULUM | Supabase |
| Admission → Grades Directory | `/grading` | GradingModulePage | GRADING | Supabase |
| Admission → Registrar Reports | `/registrar/reports` | RegistrarReportsPage | REGISTRAR_REPORTS | Supabase |
| Accounting → Dashboard | `/accounting-dashboard` | AccountingDashboardPage | ACCOUNTING_DASHBOARD | Supabase |
| Accounting → (ledger/discounts/billing/holds/setup/GL/AR/AP/reports) | `/accounting/<subPage>` | AccountingModulePage | ACCOUNTING | Supabase |
| Cashiering | `/cashier/<queue\|history\|reports>` | CashierModulePage | CASHIER | Supabase |
| Books & Library → Book Packages | `/books-setup` | BooksSetupPage | BOOKS_SETUP | Supabase |
| Books & Library → Library System | `/library/<subPage>` | LibraryModulePage | LIBRARY_SYSTEM | Supabase |
| Teacher Board | `/faculty/portal/<subPage>` | FacultyPortalPage | FACULTY_PORTAL | Supabase |
| Student Portal | `/student-portal/<subPage>` | StudentPortalPage | STUDENT_PORTAL | Supabase |
| Learning Management (LMS) | `/lms/<subPage>` | LmsModulePage | LMS | Supabase (**new module**, see §6) |
| HR | `/hr/<subPage>` | HRManagementPage | HR_MANAGEMENT | Supabase |
| Payroll → Dashboard | `/payroll/dashboard` | PayrollDashboardPage | PAYROLL_DASHBOARD | Supabase |
| Payroll → Management/Payouts/Taxes/Benefits | `/payroll/<subPage>` | PayrollModulePage | PAYROLL_MANAGEMENT | Supabase |
| Clinic → Nurse | `/clinic` | ClinicModulePage | NURSE_CLINIC | Supabase |
| Clinic → Reports | `/clinic/reports` | ClinicReportsPage | CLINIC_REPORTS | Supabase |
| Guidance Office | `/guidance` | GuidanceModulePage | GUIDANCE | Supabase |
| Guidance Reports | `/guidance/reports` | GuidanceReportsPage | GUIDANCE_REPORTS | Supabase |
| Consultation | `/consultation` | ConsultationModulePage | CONSULTATION | Supabase |
| User Access → User Security / Delegation / Audit Log | `/accounts/<subPage>` | AccountsManagementPage | ACCOUNTS_SECURITY | Supabase |
| User Access → Admin Reports | `/admin/reports` | AdminReportsPage | ADMIN_REPORTS | Supabase |
| Core Setup | `/core-setup/<subPage>` | CoreSetupModulePage | CORE_SETUP | Supabase |
| Parent Portal | `/guardian-portal` | GuardianPortalPage | GUARDIAN_PORTAL | Supabase |

---

## 5. Confirmed Existing Workflows
Only workflows actually wired in code are listed.

### 5.1 Login Workflow — ✅ Confirmed
Email + `password123` + school context → `store.login()` → land on first allowed route. Quick Demo Account buttons. Session persists in localStorage.

### 5.2 User Profile Workflow — ✅ Present
`/profile` (MyProfilePage) is granted to **every** role (`MY_PROFILE` in all permission sets) and rendered unconditionally in `AppModuleRenderer` (`isSharedAuthenticatedPage`). Reachable via user dropdown → "Your Profile". *(Field-level behavior — e.g. password-only-editable, deactivate block visibility — not yet inspected in this phase; flagged in §6.4.)*

### 5.3 Enrollment Workflow — ✅ Confirmed (data-backed)
`store.submitNewEnrollment()` creates an enrollment (`status: "For Assessment"`), auto-generates requirements + an assessment with computed fees, and persists to Supabase (`enrollments`, `enrollment_subjects`, `assessments`, `assessment_fees`). `approveEnrollment()` is **blocked while any required document is still Pending**. Status transitions: For Assessment → For Payment (on assessment approval) → Enrolled / Rejected.

### 5.4 Student Profile / Directory Workflow — ✅ Present
Student Directory (`/student-directory`) lists students; Student Portal (`/student-portal/<subPage>`: overview, grades, ledger, profile, elearning, enrollment) renders per-student. `updateStudent()` persists to Supabase.

### 5.5 Parent/Guardian Portal Workflow — ⚠️ UI present, no test account
`GuardianPortalPage` exists and `GUARDIAN_PORTAL` is a real module, but **no GUARDIAN user exists in Supabase**, so the login path can't reach it today (§10.4 / §6.4).

### 5.6 Faculty/Employee Workflow — ✅ Present
Teacher Board (Faculty Portal) sub-pages: overview & advisory, class schedule & subjects, attendance monitoring, grades encoding, reports, faculty profile. Faculty Admin (`/faculty/admin`) for management. New Employee Profile under HR.

### 5.7 HR Workflow — ✅ Extensive (data-backed)
HR Management with sub-pages: dashboard, employee life cycles, new employee profile, Time & Attendance (time mgmt, shifts, attendance, leave), Talent Acquisition (recruitment, onboarding). Store has full CRUD + approval actions (leave approve/reject, lifecycle events, shift assignment, time-log approval).

### 5.8 Payroll Workflow — ✅ Present (data-backed)
Payroll dashboard + management, salary payouts, taxes, benefits. Store supports payroll periods/runs/lines, payout batches (compute → approve → release), statutory + tax tables.

### 5.9 Accounting Workflow — ✅ Extensive
Accounting Dashboard, Student Accounts (ledger, discounts, billing, holds), Setup (chart of accounts, cost centers, suppliers, items, discount types), General Ledger (journal entries), AR (sales invoice, aging), AP (purchase invoice, aging), Financial Reports (trial balance, balance sheet, income statement, cash flow). Assessment approval workflow (approve/return/reject) writes to `approval_requests/steps/actions` + notifications.

### 5.10 Cashiering Workflow — ✅ Present
`/cashier/queue|history|reports`. `store.addPayment()` records payments; void-request approval workflow present.

### 5.11 Approval Workflow — ✅ Confirmed (central engine)
`approvalWorkflowService` + Action Center inbox. Assessment / discount / leave / payroll / void approvals flow through a shared engine and drive the pending-count badges in the sidebar (`usePendingCounts`).

### 5.12 Reports Workflow — ✅ Present
Registrar Reports, Admin Reports, Guidance Reports, Clinic Reports pages exist per module. *(Export/download button availability not yet inspected — §6.4.)*

---

## 6. Missing or Incomplete Workflow Pieces

### 6.1 Confirmed Missing in Code
- **No Playwright test harness** — no `playwright.config.ts`, no `tests/` folder, no `test` npm script. Only ad-hoc screenshot scripts.
- **`OnlineLearningPage` was deleted** (`D src/features/online-learning/pages/OnlineLearningPage.tsx` in git status) and replaced by the new **LMS** module. But the Student Portal sidebar still has an **"Online Learning"** child (`elearning`, `showForRoles: ["STUDENT"]`). Need to confirm where that child now routes — potential dead/renamed link. The old capture script still clicks "Online Learning", which may now fail.

### 6.2 Present UI but Not Wired to Data
- To be confirmed per-page in Phase 2 (not exhaustively inspected in Phase 1). Candidates: some accounting sub-reports and setup catalogs may render static/placeholder tables. Flag, don't assume.

### 6.3 Present Data but No UI Flow
- The store loads **many** Supabase tables (onboarding templates/tasks, statutory rules, tax brackets, etc.). Whether every loaded dataset has a corresponding interactive UI is unverified — treat as read-only display until confirmed.

### 6.4 Needs Business Confirmation
- **GUARDIAN test account** — needs a real `users` row with `role=GUARDIAN` (and linked student) to exercise the Parent Portal.
- **My Profile field rules** — is password the only editable field? Is a deactivate-account block hidden for non-admins? (Prompt asks specifically; needs inspection/confirmation.)
- **LMS ↔ Student Portal "Online Learning"** relationship — which is canonical for students?
- **Reports export/download** — which reports actually produce a file vs. on-screen only?

---

## 7. Pages Using Mock or Demo Data
| Page / Area | File | Mock Source | Recommendation |
|---|---|---|---|
| **Login authentication** | [LoginOverlay.tsx](../../src/components/LoginOverlay.tsx) | Hardcoded password `"password123"`; registration is a stub | Keep as-is for demo; tests use `password123`. Never treat as real auth. |
| Grading demo roster | dataLoader `demoStudents` | Students seeded without email are treated as demo grade-roster students | Fine for grading tests; label clearly. |
| Fee-calc constants | store / dataLoader | Now sourced from Supabase (`tuition_fee_schedule`, `misc_fee_schedule`, etc.) — previously mock | No longer hardcoded; verify seed rows exist. |
| Per-feature placeholders | (various feature pages) | Unverified in Phase 1 | Inspect in Phase 2 before writing write-tests. |

> **Overall:** The app is **Supabase-backed for all business data**; only the *authentication gate* and *registration* are mock. There is no offline/mock fallback for data — if Supabase env vars are missing, `src/lib/supabase.ts` **throws on import and the app will not boot**.

## 8. Pages Connected to Supabase
All modules read through the central store, hydrated once by `loadAllData()` ([dataLoader.ts](../../src/services/dataLoader.ts)), which queries **60+ tables**. Writes go through `dbInsert/dbUpdate/dbDelete` ([supabaseCrud.ts](../../src/services/supabaseCrud.ts)) with optimistic local state updates.

| Area | Representative Tables | Read | Create | Update | Delete | Notes |
|---|---|---|---|---|---|---|
| Users/Auth | `users`, `schools`, `security_*` | ✅ | ➖ | toggle status | ➖ | Login validates against `users` |
| Students/Enrollment | `students`, `enrollments`, `enrollment_subjects`, `requirements`, `online_enrollment_applications` | ✅ | ✅ | ✅ | ➖ | Full enrollment flow |
| Assessment/Accounting | `assessments`, `assessment_fees`, `assessment_audit_trail`, `discount_types`, `discount_requests`, `ledger_transactions`, `financial_holds` | ✅ | ✅ | ✅ | partial | Approval workflow tables too |
| Cashiering | `payments`, `payment_collection_summaries` | ✅ | ✅ | ➖ | ➖ | Void approval workflow |
| Grading | `grades`, `grade_periods`, `grade_items`, `grade_categories`, `student_grade_entries` | ✅ | ✅ | ✅ | ➖ | Submit/approve/return cycle |
| Faculty/Sections | `teachers`, `sections`, `section_students`, `class_schedules`, `rooms` | ✅ | ✅ | ✅ | ✅ | |
| HR | `employees`, `leave_requests`, `employee_time_logs`, `shift_templates`, `employee_lifecycle_events`, recruitment/onboarding tables | ✅ | ✅ | ✅ | partial | |
| Payroll | `payroll_periods`, `payroll_runs`, `payroll_lines`, `salary_payout_*`, `tax_tables`, `benefit_plans` | ✅ | ✅ | ✅ | ➖ | Compute→approve→release |
| Library/Books | `book_packages`, `book_package_items` | ✅ | ✅ | ✅ | ➖ | New library system added |
| Core Setup | `setup_items` (generic) | ✅ | ✅ | ✅ | ✅ | Reference/maintenance data — **do not truncate** |
| Approvals/Audit | `approval_requests`, `approval_steps`, `approval_actions`, `activity_logs` | ✅ | ✅ | ✅ | ➖ | Central engine |

---

## 9. Recommended Playwright Test Coverage
| Priority | Test Area | Why It Matters | Ready for Testing? |
|---|---|---|---|
| P0 | Login (each role via Quick Demo + form) | Entry point to everything | ✅ Ready |
| P0 | Logout + user-switch (no page carry-over; first menu item selected) | Explicitly engineered session behavior; high regression risk | ✅ Ready |
| P0 | RBAC menu visibility per role | Core security guarantee | ✅ Ready (config is deterministic) |
| P0 | RBAC direct-URL block (disallowed module → "not available" state) | Server/client access boundary | ✅ Ready |
| P1 | Dashboard / landing loads per role | Smoke coverage of every module entry | ✅ Ready |
| P1 | Enrollment page loads + required-field validation | Primary business flow | ✅ Ready (read); ⚠️ writes need seed strategy |
| P1 | Student Directory + Student Portal tabs render | Frequently used | ✅ Ready |
| P1 | Accounting / Cashiering pages load + sub-nav | Money flow | ✅ Ready (read) |
| P2 | HR / Payroll pages load | Large surface | ✅ Ready (read) |
| P2 | Reports render + filters | Demo value | ✅ Ready (read) |
| P2 | My Profile field rules | Prompt-specified | ⚠️ Needs field inspection |
| P3 | Parent Portal | | ❌ Blocked — no GUARDIAN account |
| P3 | Create/write flows (enrollment, payment, grade save) | Deep E2E | ⚠️ Needs dedicated demo records + cleanup plan |

---

## 10. Required Test Accounts
All use password **`password123`**. Emails confirmed in LoginOverlay + capture script (must exist & be active in the `users` table).

| Role | Purpose | Existing Account Found? | Notes |
|---|---|---|---|
| SUPER_ADMIN | Full-access smoke + RBAC baseline | ✅ `admin@stsn.edu.ph` | Auto-seeded on empty session |
| ADMIN | Operational-oversight RBAC | ✅ `admin@cdsta.edu.ph` | ADMIN, not super |
| REGISTRAR | Enrollment flow | ✅ `registrar@stsn.edu.ph` | |
| ACCOUNTING | Accounting flow | ✅ `accounting@stsn.edu.ph` | |
| CASHIER | Payment queue | ✅ `cashier@stsn.edu.ph` | |
| TEACHER | Faculty portal + grading | ✅ `teacher@stsn.edu.ph` | |
| STUDENT | Student portal | ✅ `student@stsn.edu.ph` | |
| HR | HR module | ✅ `hr@stsn.edu.ph` | |
| GUIDANCE | Guidance office | ✅ `guidance@stsn.edu.ph` | |
| NURSE | Clinic | ✅ `nurse@stsn.edu.ph` | |
| PAYROLL | Payroll | ✅ `payroll@stsn.edu.ph` | |
| GUARDIAN | Parent portal | ❌ **Not found in DB** | Needs a seeded user + student link |
| (CDSTA variants) | Multi-school | ✅ `<role>@cdsta.edu.ph` | Same password |

---

## 11. Required Seed Data
| Workflow | Required Data | Existing? | Recommended Action |
|---|---|---|---|
| Login (all roles) | One active user per role | ✅ except GUARDIAN | Add GUARDIAN user (separate, approved script) |
| Enrollment create | An un-enrolled student + open school year | Likely ✅ (demo students) | Use a dedicated demo student; don't mutate reference tables |
| Assessment approval | Enrollment "For Assessment" | Generated by enrollment flow | Chain from enrollment test |
| Payment | Approved assessment | Generated by approval | Chain; use demo student only |
| Grade save | Class load + grade period | Present in DB | Read-only unless a demo period exists |
| Parent Portal | GUARDIAN user + guardian↔student link | ❌ | Blocked until seeded |

> **Do not truncate** reference/maintenance tables: `setup_items`, roles/permissions (`security_*`), `leave_types`, `benefit_plans`, `tax_tables`, `book_packages`, `tuition_fee_schedule`, `misc_fee_schedule`, etc. Any write-test cleanup must target only records it created.

---

## 12. Risks Before E2E Testing
1. **Real Supabase dependency at boot** — no mock fallback. Tests need valid `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` in `.env`, or the app won't start. The E2E `.env` should point at a **dev/demo Supabase project**, never production.
2. **Auto-login seeding** — a clean context may boot already authenticated as SUPER_ADMIN. Login tests must first ensure a logged-out state (clear `localStorage` / detect login screen), mirroring the capture script.
3. **Write tests mutate shared cloud data** — because data is live Supabase, create/update tests pollute the DB and can affect other testers. Prefer read/RBAC assertions first; gate write tests behind a documented cleanup script.
4. **Deleted OnlineLearningPage vs. lingering "Online Learning" nav child** — may cause a nav test to fail; confirm routing before asserting.
5. **RBAC override via `security_*` catalog** — effective permissions may differ from the static `ROLE_PERMISSIONS` map if the catalog is populated. Tests should assert against *actual rendered menus*, not the static config alone.
6. **Async persistence is fire-and-forget** — UI updates optimistically before Supabase confirms. Write-assertions should wait on visible UI results, not assume immediate DB durability.

---

## 13. Recommended Next Step
The app is **ready for Phase 2 (Playwright test-plan authoring)** with the following scoping:
- **Green-light now:** authentication, logout/user-switching, RBAC menu visibility, RBAC direct-URL blocking, and per-role "module loads" smoke tests. These are deterministic and read-only.
- **Amber (plan carefully):** create/update flows (enrollment → assessment → payment, grade save) — require a demo-record + cleanup strategy and a dedicated dev Supabase project.
- **Blocked:** Parent/Guardian Portal until a GUARDIAN user is seeded.

Reliable primitives already proven by the existing capture scripts and verified against current components:
- **Login:** fill `input[type="email"]` + `input[type="password"]` (`password123`) → click `button[type="submit"]`; wait for `aside nav`.
- **Logout:** header button `aria-label="Open user menu"` → button "Exit Connect Session".
- **Sidebar nav:** buttons inside `aside` filtered by visible text (`getByRole('button')`).

Proceed to author `/docs/testing/playwright-e2e-test-plan.md` (Phase 2). Do not write specs until the plan is approved.

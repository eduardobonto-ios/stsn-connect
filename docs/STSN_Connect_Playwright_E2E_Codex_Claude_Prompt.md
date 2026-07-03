# STSN Connect — Playwright E2E Testing Prompt for Codex / Claude

## Purpose

Use this prompt to ask Codex or Claude to inspect the current STSN Connect application, identify the real workflow from start to finish, create Playwright end-to-end tests, run the tests, and submit a clear testing report.

This prompt is intentionally split into phases so the agent does not guess or invent workflows that do not exist.

---

# STSN Connect — Playwright E2E Workflow Discovery and Test Implementation

You are working inside the current `stsn-connect` repository.

The goal is to perform real end-to-end testing using Playwright, but you must first inspect and understand the current application workflow before creating or running tests.

## Important Rules

1. Do not immediately write Playwright tests before inspecting the current app.
2. Do not invent workflows that are not present in the current codebase.
3. Do not assume business rules unless they are clearly visible in the app, routes, permissions, database calls, or existing documentation.
4. Do not modify business logic unless a confirmed bug blocks testing.
5. Do not create duplicate database tables or migrations.
6. Do not change the current Metronic-inspired theme, layout, sidebar, header, cards, tables, buttons, badges, tabs, forms, or shared styling patterns.
7. Do not remove existing functionality.
8. Do not bypass RBAC unless the test specifically requires admin setup.
9. If mock/demo data is being used, clearly identify it.
10. If real Supabase-connected data is required, identify the missing test seed data before writing destructive tests.
11. Any new seed or cleanup script must be proposed separately and must not truncate reference/maintenance tables unless explicitly approved.
12. All findings must be documented in Markdown.

---

# Phase 1 — Workflow Discovery Only

## Objective

Inspect the current application and document the actual workflow from login to the final available business transactions or reports.

Do not create tests yet.
Do not edit files yet.
Do not install packages yet.
Do not change database schema.
Do not create migrations yet.

## Inspect the Following

1. Package setup
   - Check whether Playwright is already installed.
   - Check current test framework setup.
   - Check available npm scripts.
   - Check frontend dev server command.
   - Check build/lint/test commands.

2. App structure
   - Routes
   - Route guards
   - Layout shell
   - Sidebar/menu structure
   - Header/user dropdown
   - Page permissions
   - Role-based access control
   - Auth/login/logout flow
   - Default landing page after login
   - Current behavior after user switching/logout/login

3. Core workflows
   - Login
   - Dashboard
   - User profile
   - Role/rights/page assignment
   - Enrollment
   - Student profile
   - Parent/student linking
   - Parent portal, if available
   - Faculty/employee profile
   - HR workflow
   - Payroll workflow
   - Accounting workflow
   - Cashiering/payment workflow
   - Voucher/discount workflow, if available
   - Approval workflow
   - Reports
   - Audit/activity logs

4. Data sources
   - Supabase-connected pages
   - Mock/local/demo-data pages
   - Hardcoded records
   - Reference tables
   - Missing or incomplete relationships
   - Required test seed data

5. UI behavior
   - Forms
   - Modals/dialogs
   - Tabs
   - Tables/datatable behavior
   - Search/filter behavior
   - Toasts/alerts
   - Empty states
   - Validation messages
   - Disabled fields
   - Password-only editable fields in user profile, if applicable

## Required Phase 1 Output

Create a Markdown report at:

```text
/docs/testing/playwright-workflow-discovery-report.md
```

The report must include:

```md
# STSN Connect — Playwright Workflow Discovery Report

## 1. Environment Summary
- Frontend framework:
- Package manager:
- Dev command:
- Build command:
- Test command:
- Playwright installed: Yes/No

## 2. Current Auth Flow
- Login page:
- Logout behavior:
- Default landing page after login:
- User switching behavior:
- Session/local storage behavior:

## 3. Role-Based Access Summary
| Role | Available Menus | Restricted Menus | Notes |
|---|---|---|---|

## 4. Current Menu and Route Map
| Menu Item | Route | Component/Page | Permission Required | Data Source |
|---|---|---|---|---|

## 5. Confirmed Existing Workflows
Document only workflows that are actually present in the app.

### 5.1 Login Workflow
### 5.2 User Profile Workflow
### 5.3 Enrollment Workflow
### 5.4 Student Profile Workflow
### 5.5 Parent Portal Workflow
### 5.6 Faculty/Employee Workflow
### 5.7 HR Workflow
### 5.8 Payroll Workflow
### 5.9 Accounting Workflow
### 5.10 Cashiering Workflow
### 5.11 Approval Workflow
### 5.12 Reports Workflow

## 6. Missing or Incomplete Workflow Pieces
Separate findings into these groups:

### 6.1 Confirmed Missing in Code
### 6.2 Present UI but Not Wired to Data
### 6.3 Present Data but No UI Flow
### 6.4 Needs Business Confirmation

## 7. Pages Using Mock or Demo Data
| Page | File | Mock Source | Recommendation |
|---|---|---|---|

## 8. Pages Connected to Supabase
| Page | Table/s Used | Read | Create | Update | Delete | Notes |
|---|---|---|---|---|---|---|

## 9. Recommended Playwright Test Coverage
| Priority | Test Area | Why It Matters | Ready for Testing? |
|---|---|---|---|

## 10. Required Test Accounts
| Role | Purpose | Existing Account Found? | Notes |
|---|---|---|---|

## 11. Required Seed Data
| Workflow | Required Data | Existing? | Recommended Action |
|---|---|---|---|

## 12. Risks Before E2E Testing

## 13. Recommended Next Step
State whether the app is ready for Phase 2 Playwright implementation.
```

After creating the report, stop and summarize the findings.

---

# Phase 2 — Playwright Setup and Test Plan

Only proceed to this phase after Phase 1 is completed.

## Objective

Create a Playwright implementation plan based only on the confirmed workflow discovery report.

Do not write full tests yet unless the current project is ready.

## Tasks

1. Check whether Playwright is installed.
2. If Playwright is not installed, propose the exact install command.
3. Identify the correct base URL.
4. Identify whether tests should run against:
   - local dev server
   - preview build
   - deployed/staging environment
5. Identify required test users and roles.
6. Identify required seed data.
7. Identify safe cleanup strategy.
8. Identify test folder structure.
9. Identify helper files needed.
10. Identify recommended selectors strategy.

## Required Phase 2 Output

Create or update:

```text
/docs/testing/playwright-e2e-test-plan.md
```

The test plan must include:

```md
# STSN Connect — Playwright E2E Test Plan

## 1. Testing Scope

## 2. Out of Scope

## 3. Test Environment

## 4. Required Test Accounts

## 5. Required Test Data

## 6. Safe Cleanup Strategy

## 7. Proposed Folder Structure

Example:

```text
tests/e2e/
  auth.spec.ts
  rbac.spec.ts
  user-profile.spec.ts
  enrollment.spec.ts
  student-profile.spec.ts
  parent-portal.spec.ts
  faculty-profile.spec.ts
  hr.spec.ts
  payroll.spec.ts
  accounting.spec.ts
  cashiering.spec.ts
  reports.spec.ts
  helpers/
    auth.ts
    navigation.ts
    assertions.ts
    test-data.ts
```

## 8. Recommended Test Cases
| Priority | Spec File | Test Case | Role | Data Required | Expected Result |
|---|---|---|---|---|---|

## 9. Commands to Run

## 10. Risks and Blockers

## 11. Approval Needed Before Implementation
```

Stop after creating the test plan unless implementation is explicitly requested.

---

# Phase 3 — Playwright Test Implementation

Only proceed to this phase after the workflow report and test plan are completed.

## Objective

Create actual Playwright tests for the confirmed workflows.

## Implementation Rules

1. Create tests only for confirmed workflows.
2. For incomplete workflows, create `test.skip()` with a clear reason instead of inventing behavior.
3. Prefer stable selectors such as:
   - `getByRole`
   - `getByLabel`
   - `getByText`
   - `data-testid`, only if already available or added carefully without changing UI behavior
4. Do not rely on fragile CSS selectors unless there is no better option.
5. Use reusable helpers for login, logout, navigation, and common assertions.
6. Store environment-specific values in `.env` or Playwright config, not hardcoded test files.
7. Do not commit secrets or real passwords.
8. Use test accounts intended for development/demo only.
9. Enable screenshot, video, and trace capture on failure.
10. Generate an HTML report.

## Required Test Coverage

Create tests where the app supports them:

### Authentication and Session
- Login as Super Admin
- Logout successfully
- Login as another user
- Verify previous user page state does not carry over
- Verify first menu item is selected by default after new login

### RBAC and Permissions
- Verify role-based menu visibility
- Verify restricted pages are not accessible by unauthorized roles
- Verify Admin/Super Admin can access role/rights/page assignment
- Verify regular roles cannot change restricted role assignments, if applicable

### User Profile
- Verify user profile page is accessible to all users
- Verify profile fields are disabled except password fields, if applicable
- Verify deactivate account block is not visible, if applicable
- Verify password update validation, if available

### Enrollment
- Verify enrollment page loads
- Verify required fields validation
- Verify student/enrollment creation flow, if available
- Verify enrollment status updates, if available

### Student Profile
- Verify student profile list/search loads
- Verify student profile detail page loads
- Verify tabs/cards render correctly
- Verify update/save behavior, if available

### Parent Portal
- Verify parent role login, if available
- Verify linked students display, if available
- Verify parent dashboard cards, if available
- Verify missing relationship shows proper empty state

### Faculty/Employee
- Verify employee list/search loads
- Verify employee profile loads
- Verify employee dropdown/search autocomplete, if available
- Verify activity logs location/rendering, if available

### HR
- Verify HR pages load
- Verify forms/tables render
- Verify save/update behavior, if available

### Payroll
- Verify payroll pages load
- Verify payroll setup/reference data loads
- Verify payroll run/payout workflow, if available

### Accounting
- Verify accounting pages load
- Verify voucher/ledger/journal pages, if available
- Verify accounting posting workflow, if available

### Cashiering and Payments
- Verify cashiering page loads
- Verify payment form loads
- Verify discounts/vouchers, if available
- Verify payment posting, if available

### Reports
- Verify reports page loads
- Verify report filters work
- Verify export/download buttons, if available

## Suggested Files

Create files similar to:

```text
playwright.config.ts
tests/e2e/auth.spec.ts
tests/e2e/rbac.spec.ts
tests/e2e/user-profile.spec.ts
tests/e2e/enrollment.spec.ts
tests/e2e/student-profile.spec.ts
tests/e2e/parent-portal.spec.ts
tests/e2e/faculty-profile.spec.ts
tests/e2e/hr.spec.ts
tests/e2e/payroll.spec.ts
tests/e2e/accounting.spec.ts
tests/e2e/cashiering.spec.ts
tests/e2e/reports.spec.ts
tests/e2e/helpers/auth.ts
tests/e2e/helpers/navigation.ts
tests/e2e/helpers/assertions.ts
tests/e2e/helpers/test-data.ts
docs/testing/playwright-e2e-test-report.md
```

## Playwright Configuration Requirements

Configure Playwright to support:

1. Chromium testing by default.
2. HTML report.
3. Screenshot on failure.
4. Video on failure or retry.
5. Trace on retry or failure.
6. Base URL from environment variable.
7. Optional web server command if safe.

Example behavior:

```ts
use: {
  baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
  trace: 'retain-on-failure'
}
```

Do not hardcode production credentials.

---

# Phase 4 — Run Tests and Fix Test Blockers

## Objective

Run the Playwright tests and produce a final report.

## Tasks

1. Run the appropriate install command if needed.
2. Run the app or confirm the app is already running.
3. Run Playwright tests.
4. Review failed tests.
5. Use Playwright trace/screenshots to identify failures.
6. Fix only:
   - broken test selectors
   - test setup issues
   - confirmed app bugs that block the tested workflow
7. Do not introduce large refactors.
8. Do not change business rules without documenting the reason.
9. Re-run tests after fixes.
10. Generate final report.

## Required Commands to Try

Use the correct package manager based on the repository.

Common examples:

```bash
npm install -D @playwright/test
npx playwright install
npm run dev
npx playwright test
npx playwright show-report
```

If the project uses another package manager, use the repository’s actual package manager.

---

# Phase 5 — Final Test Report

Create or update:

```text
/docs/testing/playwright-e2e-test-report.md
```

The report must include:

```md
# STSN Connect — Playwright E2E Test Report

## 1. Test Run Summary
- Date/time:
- Environment:
- Base URL:
- Browser:
- Total tests:
- Passed:
- Failed:
- Skipped:

## 2. Files Created or Modified
| File | Purpose |
|---|---|

## 3. Commands Used

```bash
# list exact commands here
```

## 4. Test Accounts Used
| Role | Username/Email | Purpose | Notes |
|---|---|---|---|

Do not expose real passwords.

## 5. Test Cases Added
| Spec File | Test Case | Status | Notes |
|---|---|---|---|

## 6. Passed Tests

## 7. Failed Tests
| Test | Failure Reason | Screenshot/Trace | Recommended Fix |
|---|---|---|---|

## 8. Skipped Tests
| Test | Reason |
|---|---|

## 9. Bugs Found
| Area | Bug | Severity | Evidence | Recommended Fix |
|---|---|---|---|---|

## 10. Missing Workflow Pieces
Separate into:

### 10.1 Confirmed Missing in Code
### 10.2 UI Exists but Not Wired
### 10.3 Data Exists but No UI
### 10.4 Needs Business Confirmation

## 11. Demo Readiness Assessment
State one of:

- Ready for demo
- Ready with minor issues
- Not ready due to blockers

Explain why.

## 12. Recommended Next Fixes
Prioritize fixes in order.
```

---

# Extra Safety Requirements

## Database Safety

Before creating tests that write data:

1. Identify which tables will be affected.
2. Use dedicated test/demo records only.
3. Avoid deleting or truncating production-like data.
4. Do not truncate reference tables such as:
   - year levels
   - departments
   - roles
   - permissions
   - accounting references
   - payroll references
   - books
   - maintenance tables
5. If cleanup is needed, propose a separate script and document exactly what it affects.

## Authentication Safety

1. Do not commit real passwords.
2. Use `.env` for test credentials.
3. If credentials are unavailable, create placeholder variables and document what is needed.

Example:

```env
PLAYWRIGHT_BASE_URL=http://localhost:5173
E2E_SUPER_ADMIN_EMAIL=
E2E_SUPER_ADMIN_PASSWORD=
E2E_ADMIN_EMAIL=
E2E_ADMIN_PASSWORD=
E2E_TEACHER_EMAIL=
E2E_TEACHER_PASSWORD=
E2E_PARENT_EMAIL=
E2E_PARENT_PASSWORD=
```

## Test Quality Requirements

1. Tests must assert actual expected behavior, not just page loads.
2. Tests must verify visible UI results after actions.
3. Tests must validate RBAC where applicable.
4. Tests must verify errors and empty states where applicable.
5. Tests must use stable selectors.
6. Tests must be readable and maintainable.
7. Tests must be grouped by workflow.
8. Tests must include clear skip reasons for incomplete workflows.

---

# Expected Final Deliverables

At the end, provide:

1. `/docs/testing/playwright-workflow-discovery-report.md`
2. `/docs/testing/playwright-e2e-test-plan.md`
3. Playwright config file, if implementation was approved
4. Playwright E2E test files, if implementation was approved
5. `/docs/testing/playwright-e2e-test-report.md`
6. List of commands used
7. Summary of passed, failed, and skipped tests
8. List of missing workflow pieces
9. Recommended next implementation or bug-fix prompt

---

# Final Reminder

Do not guess the start-to-finish workflow.

First discover and document what currently exists.
Then create tests only for confirmed workflows.
For anything missing, incomplete, unclear, or not wired to data, report it instead of inventing it.

# STSN Connect / Theresian Connect
# DataTables.net and Modern Dialog Modernization Plan

## Purpose

This document serves as the reference plan for modernizing the table and prompt/dialog experience in **STSN Connect / Theresian Connect**.

The goal is to improve enterprise-grade usability by:

1. Evaluating the feasibility of converting existing native HTML tables to **DataTables.net**.
2. Replacing all browser-native prompts such as `alert`, `confirm`, and `prompt` with modern STSN-themed dialogs/toasts.
3. Applying the changes in safe, build-friendly phases.
4. Avoiding unnecessary conversion of printable, document-style, or complex editable tables.

---

## Current Project Context

Based on the uploaded project zip, the current frontend project uses:

- React 19
- Vite
- TypeScript
- Tailwind/custom CSS
- Zustand/store-based mock data
- Native HTML `<table>` components
- Browser-native dialogs in multiple modules
- No existing DataTables.net dependency

---

## Initial Findings

| Area | Current Finding |
|---|---:|
| Existing DataTables dependency | None |
| Native table usages found | 47 |
| Files with table usage | 17 |
| Native dialog usages found | 22 |
| Native dialog types | `alert`, `confirm`, `prompt`, `window.alert`, `window.confirm`, `window.prompt` |

---

## Feasibility Decision

Converting tables to DataTables.net is feasible, but it should **not** be applied blindly to every table.

DataTables.net is best used for record/list tables that need:

- Search
- Sorting
- Pagination
- Dense data navigation
- Administrative filtering
- Enterprise-style list management

It should not be forced into tables that are used for:

- Printable documents
- Certificate previews
- COR previews
- Receipt previews
- Static summaries
- Grade encoding matrices
- Complex editable spreadsheet-style layouts

---

## Recommended DataTables.net Packages

Recommended packages:

```bash
npm install datatables.net-react datatables.net-dt
```

Recommended global CSS import:

```ts
import 'datatables.net-dt/css/dataTables.dataTables.css';
```

The project should use the official React integration approach instead of manually manipulating the DOM.

---

## Recommended New Shared Components

Create a reusable enterprise foundation instead of implementing DataTables and dialogs repeatedly in each page.

Recommended files:

```txt
src/components/common/STSNDataTable.tsx
src/components/common/DialogProvider.tsx
src/components/common/useAppDialog.tsx
src/components/common/AppConfirmDialog.tsx
src/components/common/AppPromptDialog.tsx
src/components/common/AppToast.tsx
```

---

## STSNDataTable Requirements

The reusable `STSNDataTable` should support:

- Columns and row data
- Search
- Sorting
- Pagination
- Responsive layout
- Empty state
- Loading state if needed
- Action columns
- Badges/status chips
- STSN brown/gold institutional theme
- Safe React rendering
- No unnecessary business logic changes

The wrapper should keep feature pages clean and prevent every module from implementing DataTables differently.

---

## Modern Dialog Requirements

All native browser prompts should be replaced.

### Replace These

```ts
alert(...)
confirm(...)
prompt(...)
window.alert(...)
window.confirm(...)
window.prompt(...)
```

### With These

| Native Usage | Replacement |
|---|---|
| `alert()` | Toast or info dialog |
| `confirm()` | `AppConfirmDialog` |
| `prompt()` | `AppPromptDialog` |

### Dialog Variants

The dialog/toast system should support:

- Success
- Warning
- Danger/Error
- Info
- Confirmation
- Prompt input

### UX Requirement

Dialogs should match the STSN brown/gold institutional theme and should not use browser-native modal styling.

---

## Recommended Conversion Scope

### Convert to DataTables.net

These modules are good candidates because they contain administrative record/list tables:

```txt
src/features/registrar/pages/RegistrarModulePage.tsx
src/features/accounting/pages/AccountingModulePage.tsx
src/features/cashier/pages/CashierModulePage.tsx
src/features/books/pages/BooksSetupPage.tsx
src/features/accounts/pages/AccountsManagementPage.tsx
src/features/hr/pages/HRManagementPage.tsx
src/features/class-sectioning/pages/ClassSectioningModulePage.tsx
src/features/scheduling/pages/SchedulingModulePage.tsx
```

### Optional / Review First

These may be converted only if the tables are simple searchable record lists:

```txt
src/features/core-setup/pages/CoreSetupModulePage.tsx
src/features/curriculum/pages/CurriculumManagementPage.tsx
src/features/faculty/pages/FacultyPortalPage.tsx
src/features/student-portal/pages/StudentPortalPage.tsx
```

### Do Not Convert Initially

These should be skipped unless there is a specific UX reason later:

```txt
src/components/ModalPreviews.tsx
src/features/grading/components/GradeSheetTable.tsx
```

Also skip:

- COR preview tables
- Receipt preview tables
- Printable document tables
- Certificate preview tables
- Grade encoding matrix tables
- Small static summary tables

---

## Recommended Implementation Phases

## Phase 1 — Foundation Only

### Goal

Add the reusable DataTables wrapper and modern dialog/toast foundation without converting feature pages yet.

### Tasks

1. Install DataTables dependencies:

```bash
npm install datatables.net-react datatables.net-dt
```

2. Create:

```txt
src/components/common/STSNDataTable.tsx
src/components/common/DialogProvider.tsx
src/components/common/useAppDialog.tsx
src/components/common/AppConfirmDialog.tsx
src/components/common/AppPromptDialog.tsx
src/components/common/AppToast.tsx
```

3. Wrap the app with `DialogProvider` if needed.

4. Import the required DataTables CSS globally.

5. Run:

```bash
npm run build
```

### Stop Condition

Stop after the foundation is created and the build passes.

---

## Phase 2 — Replace Native Browser Prompts

### Goal

Replace all browser-native dialogs with modern reusable STSN-themed dialogs/toasts.

### Target Files

```txt
src/App.tsx
src/features/registrar/pages/RegistrarModulePage.tsx
src/features/accounting/pages/AccountingModulePage.tsx
src/features/class-sectioning/pages/ClassSectioningModulePage.tsx
src/features/core-setup/pages/CoreSetupModulePage.tsx
src/features/curriculum/pages/CurriculumManagementPage.tsx
src/features/hr/pages/HRManagementPage.tsx
src/features/scheduling/pages/SchedulingModulePage.tsx
src/features/accounts/pages/AccountsManagementPage.tsx
```

### Rules

- Replace `alert(...)` with toast or info dialog.
- Replace `confirm(...)` with async confirmation dialog.
- Replace `prompt(...)` with async prompt dialog.
- Preserve the existing message text.
- Do not change business logic.
- Do not redesign unrelated UI.
- Search the project after replacement to confirm there are no remaining native dialogs.

### Build Command

```bash
npm run build
```

---

## Phase 3 — Convert High-Value Record Tables

### Goal

Convert only high-value administrative record/list tables to `STSNDataTable`.

### Target Files

```txt
src/features/registrar/pages/RegistrarModulePage.tsx
src/features/accounting/pages/AccountingModulePage.tsx
src/features/cashier/pages/CashierModulePage.tsx
src/features/books/pages/BooksSetupPage.tsx
src/features/accounts/pages/AccountsManagementPage.tsx
src/features/hr/pages/HRManagementPage.tsx
src/features/class-sectioning/pages/ClassSectioningModulePage.tsx
src/features/scheduling/pages/SchedulingModulePage.tsx
```

### Rules

- Preserve all existing row actions.
- Preserve badges and status chips.
- Preserve role-based visibility.
- Preserve mock data behavior.
- Preserve the brown/gold STSN theme.
- Do not introduce backend/server-side processing.
- Do not change business rules.
- Do not convert printable preview tables.
- Do not convert the grade sheet table yet.

### Build Command

```bash
npm run build
```

---

## Phase 4 — Optional Remaining Tables Review

### Goal

Review remaining tables and convert only if DataTables clearly improves the user experience.

### Review Criteria

Convert only if the table:

- Has many rows
- Needs search
- Needs sorting
- Needs pagination
- Represents administrative records

Do not convert if the table is:

- Static
- Printable
- Document-style
- A receipt/COR/certificate preview
- A grade encoding matrix

---

## Claude-Ready Prompt — Phase 1

```md
You are a Principal React Frontend Architect and Enterprise School ERP UX Engineer.

Project:
STSN Connect / Theresian Connect

Goal:
Assess and implement a phased modernization of all native record tables and browser-native prompts.

Important:
- Use the existing project structure.
- Preserve the brown/gold STSN institutional theme.
- Do not redesign the entire app.
- Do not add backend/API integration.
- Do not change business logic.
- Do not convert printable document/receipt/COR tables to DataTables.
- Do not convert the grade encoding matrix unless clearly safe.
- Keep changes incremental and build-safe.
- Run npm run build after each phase.

Current project uses:
- React 19
- Vite
- TypeScript
- Tailwind/custom CSS
- Zustand
- No current DataTables dependency

Known findings:
- There are many native <table> usages across modules.
- There are native alert/confirm/prompt usages that should be replaced.
- Browser-native dialogs should be replaced with modern STSN-themed modal/toast components.

Inspect these files:
- package.json
- src/App.tsx
- src/index.css
- src/components/ModalPreviews.tsx
- src/features/registrar/pages/RegistrarModulePage.tsx
- src/features/accounting/pages/AccountingModulePage.tsx
- src/features/cashier/pages/CashierModulePage.tsx
- src/features/books/pages/BooksSetupPage.tsx
- src/features/accounts/pages/AccountsManagementPage.tsx
- src/features/class-sectioning/pages/ClassSectioningModulePage.tsx
- src/features/core-setup/pages/CoreSetupModulePage.tsx
- src/features/curriculum/pages/CurriculumManagementPage.tsx
- src/features/hr/pages/HRManagementPage.tsx
- src/features/scheduling/pages/SchedulingModulePage.tsx
- src/features/faculty/pages/FacultyPortalPage.tsx
- src/features/student-portal/pages/StudentPortalPage.tsx
- src/features/grading/components/GradeSheetTable.tsx

Phase 1 — Foundation

1. Add DataTables dependencies:
   - datatables.net-react
   - datatables.net-dt

2. Create a reusable STSN-themed DataTable wrapper:
   - src/components/common/STSNDataTable.tsx

Requirements for STSNDataTable:
- Accept columns and rows/data.
- Support search, pagination, sorting.
- Support empty state.
- Preserve STSN brown/gold styling as much as possible.
- Be responsive.
- Must not break React rendering.
- Avoid direct DOM manipulation outside DataTables usage.
- Use DataTables official React integration style.

3. Create modern prompt replacement components:
   - src/components/common/DialogProvider.tsx
   - src/components/common/useAppDialog.tsx
   - src/components/common/AppConfirmDialog.tsx
   - src/components/common/AppPromptDialog.tsx
   - src/components/common/AppToast.tsx

Dialog behavior:
- replace alert with toast or info dialog
- replace confirm with AppConfirmDialog
- replace prompt with AppPromptDialog
- support success, warning, danger, info variants
- preserve STSN theme
- no native browser dialogs should be used after replacement

4. Wrap the app with DialogProvider if needed.

5. Run:
   npm run build

Stop after Phase 1 and provide:
- files changed
- new reusable components created
- build result
- any risks before converting feature tables
```

---

## Claude-Ready Prompt — Phase 2

```md
Using the existing STSNDataTable and modern dialog components created in Phase 1, replace all browser-native alert/confirm/prompt usage.

Scope:
- src/App.tsx
- src/features/registrar/pages/RegistrarModulePage.tsx
- src/features/accounting/pages/AccountingModulePage.tsx
- src/features/class-sectioning/pages/ClassSectioningModulePage.tsx
- src/features/core-setup/pages/CoreSetupModulePage.tsx
- src/features/curriculum/pages/CurriculumManagementPage.tsx
- src/features/hr/pages/HRManagementPage.tsx
- src/features/scheduling/pages/SchedulingModulePage.tsx
- src/features/accounts/pages/AccountsManagementPage.tsx

Rules:
- Replace alert(...) with toast or info dialog.
- Replace confirm(...) with async confirmation dialog.
- Replace prompt(...) with async prompt dialog.
- Do not change business logic.
- Do not change unrelated UI.
- Preserve existing messages.
- Remove all direct usages of:
  alert(
  confirm(
  prompt(
  window.alert(
  window.confirm(
  window.prompt(

After changes:
- Search the project and confirm there are no remaining native browser dialogs.
- Run npm run build.
- Provide summary of replaced dialogs by file.
```

---

## Claude-Ready Prompt — Phase 3

```md
Using the STSNDataTable wrapper, convert only high-value record/list tables to DataTables.

Convert tables in:
- src/features/registrar/pages/RegistrarModulePage.tsx
- src/features/accounting/pages/AccountingModulePage.tsx
- src/features/cashier/pages/CashierModulePage.tsx
- src/features/books/pages/BooksSetupPage.tsx
- src/features/accounts/pages/AccountsManagementPage.tsx
- src/features/hr/pages/HRManagementPage.tsx
- src/features/class-sectioning/pages/ClassSectioningModulePage.tsx
- src/features/scheduling/pages/SchedulingModulePage.tsx

Do not convert:
- src/components/ModalPreviews.tsx
- COR preview tables
- receipt preview tables
- printable document tables
- grade sheet / grade encoding matrix
- small static summary tables that do not need search/sort/pagination

Rules:
- Preserve all existing row actions.
- Preserve badges, status chips, buttons, and role-based visibility.
- Preserve mock data behavior.
- Preserve current STSN brown/gold enterprise theme.
- Use DataTables only where search/sort/pagination improves UX.
- Do not introduce backend/server-side processing.
- Do not change business rules.

After changes:
- Run npm run build.
- Provide converted table list by file.
- Provide skipped table list with reason.
```

---

## Final Recommendation

Proceed with the modernization, but in the following order:

1. Build the reusable DataTables and modern dialog foundation.
2. Replace all native `alert`, `confirm`, and `prompt` usages.
3. Convert only high-value administrative record/list tables.
4. Skip printable document tables and grade encoding matrices for now.

This approach gives the project a more enterprise-grade user experience while reducing the risk of breaking complex layouts or document-style screens.

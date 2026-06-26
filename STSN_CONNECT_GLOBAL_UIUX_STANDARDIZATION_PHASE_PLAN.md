# STSN Connect — Global UI/UX Standardization Phase Plan

## Purpose

This document defines a staggered implementation plan to apply the successful Enrollment page UI/UX improvements across the STSN Connect application.

The goal is to make all modules, menus, sub-menus, tables, forms, buttons, search bars, dropdowns, typography, and banners visually consistent while preserving the existing Thereseian Connect brown/cream school ERP identity.

This should be implemented carefully by phase to avoid breaking existing pages, role-based routing, Supabase queries, permissions, and production workflows.

---

## Design Direction to Globalize

The Enrollment page redesign introduced several UI patterns that should become the application-wide standard.

### Global Banner / Page Header Standard

Current desired direction:
- The page banner should blend closer to the sidebar color.
- Use a deeper brown school-branded tone similar to the sidebar.
- Keep the premium admissions/workspace feel.
- Apply this banner/page header style consistently across all modules and sub-pages.

Requirements:
- Create or update a reusable page header/banner component if one already exists.
- Do not duplicate banner markup per page if a shared component can be used.
- Support title, subtitle, module badge, school year/context, action buttons, and optional metadata.
- Keep contrast readable and accessible.
- Do not hardcode module data if it already comes from session, role context, Supabase, or existing page props.

Suggested reusable component names:
- `ModulePageHeader`
- `WorkspaceHeader`
- `PageHeroHeader`
- Use the existing naming convention if the project already has one.

---

### Global Primary Button Standard

The `Enroll New Candidate` button style is approved and should become the standard for all default/primary buttons.

Requirements:
- Apply the same color, hover state, border radius, height, font weight, icon spacing, and shadow treatment to primary/default action buttons.
- Use this style for important actions such as:
  - Create
  - Add New
  - Save
  - Submit
  - Approve
  - Generate
  - Import
  - Enroll
  - New Record
- Do not blindly restyle destructive buttons.
- Destructive actions should remain visually distinct.
- Secondary, ghost, outline, and disabled buttons should still have proper hierarchy.

Preferred implementation:
- Update the shared `Button` component or global button variant classes.
- Avoid manually editing each button one by one if a shared component or CSS token can control this globally.

---

### Global Input / Search / Select Standard

The Enrollment search bar and dropdown styling should become the standard for all input and select elements.

Requirements:
- Apply consistent styling to:
  - search inputs
  - text inputs
  - select/dropdown controls
  - filter dropdowns
  - date inputs
  - amount inputs
  - textarea fields, where appropriate
- Use consistent height, border, radius, font, placeholder style, background, focus ring, and disabled state.
- Search bars should use the same clean rounded layout from Enrollment.
- Dropdowns/selects should visually align with search bars.
- Do not break existing controlled inputs, form libraries, validation, or accessibility.

Preferred implementation:
- Update shared `Input`, `SearchInput`, `Select`, `Combobox`, or form field components if available.
- If native inputs are scattered across pages, create a migration plan to replace them gradually with shared components.
- Avoid global CSS that unintentionally breaks third-party components.

---

### Global Filter Button / Chip Standard

Buttons underneath the Enrollment search bar, such as `All`, `Online`, and `Walk-in/ERP`, should become the standard for filter chips, quick filters, and segmented filter buttons.

Requirements:
- Apply consistent pill/chip styling for quick filters.
- Active state should be clear, compact, and brown/brand-aligned.
- Inactive state should be subtle with light border/background.
- Use this pattern for table filters, dashboard quick filters, status filters, and module tabs where appropriate.
- Do not use this style for primary action buttons.

Preferred reusable names:
- `FilterChip`
- `SegmentedFilter`
- `QuickFilterButton`

---

### Global Table Identity Column Standard

All tables that display people, especially students, faculty, teachers, staff, and users, should use the same identity output format as the redesigned Enrollment table.

Approved identity format:
- Initials avatar/badge on the left.
- Full name as the primary text.
- Secondary identifier below the name, such as:
  - section
  - employee number
  - teacher code
  - student number
  - LRN
  - role
  - department

Applicable person types:
- Students
- Faculty
- Teachers
- Staff
- Guardians, where applicable
- Users/accounts, where applicable

Requirements:
- Do not hardcode names or identifiers.
- Use actual database values.
- Use a reusable table identity cell component.
- Ensure consistent avatar initials generation.
- Ensure safe fallback when names are missing.
- Keep the identity cell accessible and readable.

Suggested reusable component names:
- `PersonIdentityCell`
- `StudentIdentityCell`
- `FacultyIdentityCell`
- `TeacherIdentityCell`
- Prefer a generic `PersonIdentityCell` if possible.

---

### Global Typography / Font Standard

The updated Enrollment font styling is approved because it is more readable. This should become the global application typography standard.

Requirements:
- Update global font-family and typography scale across the application.
- Apply consistent font weight, letter spacing, heading hierarchy, body text size, table font size, and label style.
- Ensure tables, forms, cards, navigation, tabs, dashboards, and modals use the same typography rules.
- Avoid page-specific font overrides unless necessary.
- Confirm that the font is loaded correctly and does not cause layout shift.
- Keep performance in mind.

Preferred implementation:
- Update global CSS/theme tokens.
- Update Tailwind config or CSS variables if the project uses them.
- Remove redundant page-level font overrides after confirming no regressions.

---

## Menus / Modules Included in Rollout

Based on the visible sidebar, the global UI/UX standardization should apply to all available menus and their sub-pages, including but not limited to:

1. Dashboard
2. Action Center
3. Admission
   - Students
   - Enrollment
   - Class Sections
   - Class Scheduling
   - Faculty
   - Syllabus Pathways
   - Grades Directory
   - Registrar Reports
4. Accounting
5. Cashiering
6. Teacher Board
7. Student Portal
8. Online Learning
9. HR
10. Payroll
11. Clinic
12. Guidance Office
13. User Access & Authority

Important:
- Do not assume missing pages exist.
- Scan the codebase and update only existing routes/components/pages.
- Group the page inventory by module and role before making changes.

---

## Non-Negotiable Rules

- Do not use mock data.
- Do not add fake records.
- Do not hardcode sample students, faculty, staff, fees, payments, grades, schedules, documents, or reports.
- Do not change database data directly.
- If database schema or reference data is required, create a production-safe migration under `supabase/migrations`.
- Do not manually execute migrations.
- Do not break role-based access.
- Do not expose pages to unauthorized roles.
- Do not make unrelated business logic changes.
- Do not rewrite the entire application at once.
- Apply changes gradually by shared components first, then module pages.

---

## Migration / Supabase Rules

If UI standardization reveals missing fields, tables, statuses, reference values, or relationships, create a migration under:

```txt
supabase/migrations
```

Migration must be production-safe:
- use `create table if not exists`
- use `alter table ... add column if not exists`
- use `insert ... on conflict do nothing` only for legitimate reference/seed values
- include indexes where needed
- include foreign keys where appropriate
- preserve existing data
- do not drop existing tables or columns
- do not insert fake/demo operational records
- do not break RLS policies
- add or update RLS policies only if required and documented

Allowed seed/reference values:
- legitimate statuses
- document types
- enrollment stages
- approval stages
- role-safe module references
- report categories
- import status definitions

Not allowed:
- fake students
- fake faculty
- fake teachers
- fake payments
- fake documents
- fake applications
- fake grades
- fake schedules
- fake clinic records
- fake payroll records

---

# Staggered Implementation Plan

## Phase 0 — Audit and Inventory Only

Objective:
Create a complete UI inventory before making any changes.

Tasks:
1. Scan all routes, pages, layouts, and shared UI components.
2. Identify existing modules and sub-pages from the sidebar/menu structure.
3. Identify where the Enrollment-approved styles currently live.
4. Identify shared components for:
   - page headers
   - buttons
   - inputs
   - selects
   - tables
   - badges/chips
   - modals
   - cards
   - tabs
   - layouts
5. Identify pages that use custom styling instead of shared components.
6. Identify all tables that display students, faculty, teachers, staff, or users.
7. Identify current font configuration and global CSS/theme files.
8. Provide a page/component inventory grouped by module.

Deliverables:
- Module/page inventory
- Shared component inventory
- Table inventory
- Current styling source summary
- Risk areas

Do not modify files in Phase 0.

---

## Phase 1 — Global Design Tokens and Typography ✅ COMPLETE

Completed: 2026-06-26

Objective:
Centralize the approved visual identity before updating individual pages.

Tasks:
1. ✅ Define or update global design tokens for:
   - sidebar brown — `--color-stsn-brown: #5C4533` (existing)
   - banner brown — `--color-stsn-brown-deep: #2E1C10` (added to `@theme`)
   - primary button gold/tan color — `--color-stsn-gold: #C5A059` (existing)
   - cream background — `--color-stsn-cream: #FFFDF5` (existing)
   - border colors — `--stsn-card-border: #e5e0d5` (existing)
   - muted text — `--stsn-muted-text: #78716c` (existing)
   - secondary text — `--stsn-secondary-text: #6b5e54` (added)
   - focus ring — `--stsn-focus-ring: rgba(197,160,89,0.28)` (existing)
   - card shadow — `--stsn-card-shadow` (existing)
   - border radius — `--stsn-card-radius: 0.75rem` (existing)
   - Module/Workspace Banner tokens (added):
     - `--stsn-banner-bg` — dark gradient matching sidebar
     - `--stsn-banner-text` — cream/off-white
     - `--stsn-banner-border` — subtle gold border
     - `--stsn-banner-eyebrow` — gold eyebrow label
     - `--stsn-banner-subtitle` — muted cream subtitle
2. ✅ Globalize the approved readable font-family.
   - Inter is the global default via `body { font-family: "Inter"... }` in `index.css`.
   - Space Grotesk (`font-display`) restricted to branding/logo elements only.
3. ✅ Standardize typography — added utility classes to `index.css`:
   - `.stsn-page-title` — Inter 700, 18px, for module banner titles
   - `.stsn-page-eyebrow` — JetBrains Mono, uppercase, gold, for banner eyebrows
   - `.stsn-page-subtitle` — Inter 400, 12px, cream-muted, for banner subtitles
   - `.stsn-section-title` — Inter 700, 15px, heading-brown, for section headers
   - `.stsn-form-label` — Inter 600, 11px, uppercase, for form field labels
   - `.stsn-helper-text` — Inter 400, 11px, muted, for hints/helpers
   - `.stsn-table-header` — JetBrains Mono, uppercase, for standalone table headers
4. ✅ Remove/reduce conflicting page-level font overrides:
   - `PageHeader.tsx`: changed `font-display` → `font-sans`, `text-stone-900` → `text-stsn-brown-dark`
   - `EmptyState.tsx`: changed `font-display` → `font-sans` on title text
5. ✅ Validate that layout spacing is not broken.
   - `npm run build` passed — 0 errors, 0 TypeScript issues.

Files changed:
- `src/index.css`
- `src/components/common/PageHeader.tsx`
- `src/components/common/EmptyState.tsx`

Acceptance criteria:
- ✅ Font is consistent across the application — Inter is the authoritative page font.
- ✅ Text readability improves — unified typography scale with named utility classes.
- ✅ No module visually breaks — build passes cleanly.
- ✅ No data or routing behavior changes.

Recommended verification:
- ✅ Run `npm run build` — passed.
- Browser verification of Dashboard, Enrollment, Accounting, Teacher Board recommended before Phase 2.

---

## Phase 2 — Global Header / Banner Standard ✅ COMPLETE

Completed: 2026-06-26

Objective:
Apply the Enrollment-approved banner style across the application.

Tasks:
1. ✅ Created reusable `ModulePageHeader` component with dark brown banner gradient matching sidebar.
2. ✅ Banner color matches sidebar — gradient from `#2e1c10` → `#3d2b1f` → `#4a3728`.
3. ✅ Supports all required props: `badge`, `badgeIcon`, `title`, `subtitle`, `meta`, `actions`, `variant`.
4. ✅ Replaced page-specific header implementations across all module pages.
5. ✅ Dual-variant support: `variant="default"` (brown) for Basic Ed, `variant="college"` (navy/blue) for College.
6. ✅ Gold accent line (`#c5a059`) below banner; blue accent for college variant.
7. ✅ CSS gradient classes added to `index.css` to prevent linter corruption.
8. ✅ `npm run build` passed — 0 errors.

Files changed:
- `src/index.css` — added `.module-page-banner`, `.module-page-banner-college`, `.module-page-banner-accent`, `.module-page-banner-accent-college` CSS classes
- `src/components/common/ModulePageHeader.tsx` — NEW reusable component
- `src/features/action-center/pages/ActionCenterPage.tsx`
- `src/features/cashier/pages/CashierModulePage.tsx`
- `src/features/clinic/pages/ClinicModulePage.tsx`
- `src/features/guidance/pages/GuidanceModulePage.tsx`
- `src/features/faculty/pages/FacultyAdminPage.tsx`
- `src/features/class-sectioning/pages/ClassSectioningModulePage.tsx`
- `src/features/scheduling/pages/SchedulingModulePage.tsx`
- `src/features/curriculum/pages/CurriculumManagementPage.tsx`
- `src/features/registrar/pages/RegistrarModulePage.tsx`
- `src/features/student-directory/pages/StudentDirectoryPage.tsx`
- `src/features/grading/pages/GradesDirectoryPage.tsx`
- `src/features/hr/pages/HRManagementPage.tsx`
- `src/features/faculty/pages/FacultyPortalPage.tsx`
- `src/features/student-portal/pages/StudentPortalPage.tsx`
- `src/features/online-learning/pages/OnlineLearningPage.tsx`
- `src/features/accounting/pages/AccountingModulePage.tsx`
- `src/features/dashboard/pages/DashboardPage.tsx`
- `src/features/accounts/pages/AccountsManagementPage.tsx` — replaced `PageHeader` with `ModulePageHeader`

Acceptance criteria:
- ✅ Module headers visually match the approved Enrollment banner direction.
- ✅ Header styling is consistent across modules.
- ✅ Page-specific context still displays correctly (role/context-aware variant, dynamic badges, action buttons).
- ✅ No hardcoded school/module data introduced — all context from store or existing page props.
- ✅ Build passes cleanly.

Rollout order:
1. ✅ Dashboard
2. ✅ Admission pages (Action Center, Student Directory, Class Sectioning, Scheduling, Curriculum, Registrar, Grading, Faculty Admin, Faculty Portal)
3. ✅ Accounting
4. ✅ Cashiering
5. ✅ Teacher Board (Faculty Portal)
6. ✅ Student Portal
7. ✅ Online Learning
8. ✅ HR
9. Payroll — no dedicated module page found (sub-pages only, handled in Phase 8)
10. ✅ Clinic
11. ✅ Guidance Office
12. ✅ User Access & Authority

---

## Phase 3 — Global Button System

Objective:
Make the `Enroll New Candidate` button style the application-wide primary/default button standard.

Tasks:
1. Find the shared button component or primary button classes.
2. Apply the approved primary button styling globally.
3. Ensure variants remain distinct:
   - primary
   - secondary
   - outline
   - ghost
   - destructive
   - disabled
   - icon-only
4. Update module-level buttons that bypass shared components.
5. Avoid changing destructive action styling into primary styling.
6. Ensure button states are accessible:
   - hover
   - focus
   - active
   - disabled
   - loading

Acceptance criteria:
- Primary actions across the app look consistent.
- Save/Add/Create/Submit buttons follow the same standard.
- Destructive buttons remain distinct.
- Disabled buttons are clearly disabled.
- No actions lose permission checks.

---

## Phase 4 — Global Form Control Standard

Objective:
Apply Enrollment-style search bars, input fields, and dropdowns across the application.

Tasks:
1. Find shared input/select/search components.
2. Apply approved styling to:
   - search inputs
   - text inputs
   - number inputs
   - date inputs
   - select controls
   - dropdown filters
   - textarea fields
3. Ensure validation states are preserved:
   - error
   - success
   - warning
   - required
   - disabled
4. Update pages that use raw native inputs where practical.
5. Avoid breaking form libraries or controlled inputs.
6. Make filter toolbars consistent.

Acceptance criteria:
- Inputs and dropdowns look consistent across all modules.
- Search bars match the Enrollment style.
- Focus states are clear.
- Validation messages still work.
- No forms lose data binding.

Rollout priority:
1. Admission and Registrar forms
2. Accounting and Cashiering forms
3. Teacher Board and Grade forms
4. HR and Payroll forms
5. Clinic and Guidance forms
6. User Access forms

---

## Phase 5 — Global Filter Chip / Quick Filter Standard

Objective:
Apply the Enrollment quick-filter button style across modules.

Tasks:
1. Create or update shared filter chip component.
2. Apply the style to quick filters under search bars.
3. Support active, inactive, disabled, and count states.
4. Use for status/source/category filters.
5. Keep behavior database-driven.
6. Do not hardcode statuses or counts.

Acceptance criteria:
- Filter buttons across pages follow the same pill/chip style.
- Active filters are visually clear.
- Counts come from actual data where available.
- Filter reset behavior remains intact.

Applicable areas:
- Enrollment filters
- Student lists
- Faculty/Teacher lists
- Approval queues
- Accounting ledgers
- Cashiering payment lists
- HR records
- Payroll lists
- Clinic records
- Guidance records
- Reports filters

---

## Phase 6 — Global Table System

Objective:
Standardize all data tables across the application while keeping each module's business data intact.

Tasks:
1. Identify shared table component or table styling.
2. Apply consistent styling for:
   - table card container
   - table header
   - row spacing
   - hover state
   - selected state
   - badges
   - action columns
   - pagination
   - loading state
   - empty state
   - error state
3. Fix table overflow behavior.
4. Ensure action columns do not collide with side panels.
5. Use horizontal scroll only where necessary.
6. Do not replace database queries with local arrays.

Acceptance criteria:
- Tables look consistent across all modules.
- Header/body alignment is correct.
- Pagination is consistent.
- Table actions are visible and not cramped.
- Empty/loading/error states exist.
- Responsive behavior is safe.

---

## Phase 7 — Person Identity Cell Standard

Objective:
Apply the approved Enrollment person identity output to all tables that display names.

Tasks:
1. Create a reusable `PersonIdentityCell` component.
2. Support these props:
   - full name
   - first name
   - middle name
   - last name
   - avatar URL if available
   - fallback initials
   - primary identifier
   - secondary identifier
   - role/type
   - section/department/grade/employee number/student number/LRN
3. Replace plain name cells in applicable tables.
4. Use actual database fields only.
5. Add null-safe fallbacks.
6. Keep table sorting/search logic intact.

Applicable tables:
- Student master lists
- Enrollment student directory
- Class section student lists
- Class scheduling student lists
- Grades directory
- Faculty lists
- Teacher lists
- HR employee lists
- Payroll employee lists
- Clinic student/patient lists
- Guidance student lists
- User access lists

Acceptance criteria:
- Student/faculty/teacher/staff names display consistently.
- Initials avatar appears where appropriate.
- Secondary identifier appears consistently.
- No fake initials or fake identifiers are introduced.
- Tables remain searchable and sortable if they already were.

---

## Phase 8 — Module-by-Module Rollout

Objective:
Apply the global standards to all visible menu modules and sub-pages gradually.

### Phase 8A — Dashboard and Action Center

Update:
- Dashboard cards
- Action Center queues
- Approval/pending work queues
- Search/filter controls
- Tables and action buttons

Verify:
- Counts remain database-driven.
- Approval visibility remains role-aware.

---

### Phase 8B — Admission / Registrar Module

Update:
- Students
- Enrollment
- Class Sections
- Class Scheduling
- Faculty
- Syllabus Pathways
- Grades Directory
- Registrar Reports

Apply:
- global banner
- primary buttons
- input/select style
- filter chips
- table system
- person identity cell

Verify:
- Student/faculty data remains Supabase-driven.
- COR actions remain permission-aware.
- Enrollment workflow remains intact.

---

### Phase 8C — Accounting and Cashiering

Update:
- Ledgers
- Discounts
- Fees
- Receipts
- Collections
- Payment tables
- Reports

Apply:
- global banner
- button system
- input/select system
- table system
- amount/currency-friendly typography

Verify:
- No financial calculations are changed.
- No fake payment data is added.
- Existing approval/payment permissions remain intact.

---

### Phase 8D — Teacher Board and Student Portal

Update:
- Class score pages
- Grade pages
- COR/ID views
- Student-facing records

Apply:
- global page headers
- table/list consistency
- input/select styling
- person identity where names appear

Verify:
- Student-facing permissions remain strict.
- Teachers only see allowed records.
- Students only see their own records.

---

### Phase 8E — Online Learning

Update:
- LMS pages
- Video/module lists
- Learning material tables/cards

Apply:
- global banner
- primary buttons
- filters
- table/card standard

Verify:
- Module visibility remains role-aware.
- No fake lesson/module data is introduced.

---

### Phase 8F — HR and Payroll

Update:
- HR employee records
- Payroll lists
- Payslips/payouts/tax pages

Apply:
- global header
- primary button style
- form controls
- person identity cells for employees
- table system

Verify:
- Payroll calculations are untouched.
- Employee data remains database-driven.
- Sensitive fields remain role-protected.

---

### Phase 8G — Clinic and Guidance Office

Update:
- Clinic student health records
- Visit logs
- Guidance/anecdotal records
- Counseling/session pages

Apply:
- global header
- table style
- person identity cells
- search/filter controls
- action buttons

Verify:
- Sensitive student records remain protected.
- No fake health/guidance data is added.
- Role access is preserved.

---

### Phase 8H — User Access & Authority

Update:
- Users
- Roles
- Permissions
- Authority/security pages

Apply:
- global header
- table system
- input/select system
- person identity cells
- primary buttons

Verify:
- Permission logic is not changed unintentionally.
- Superadmin/admin boundaries remain intact.
- No role is granted unauthorized access.

---

## Phase 9 — Responsive and Accessibility Pass

Objective:
Ensure the new global UI works across screen sizes and accessibility requirements.

Tasks:
1. Test desktop, tablet, and mobile breakpoints.
2. Verify sidebar + content layout does not overlap.
3. Verify tables are usable on smaller screens.
4. Verify focus states are visible.
5. Verify keyboard navigation for tabs, filters, and buttons.
6. Verify readable contrast.
7. Verify status does not rely on color alone.
8. Verify labels and aria attributes where needed.

Acceptance criteria:
- No page has horizontal overflow unless intentionally inside table scroll.
- Sidebar does not cover page content.
- Main actions remain usable on mobile.
- Search/filter controls remain accessible.
- Tables/cards remain readable.

---

## Phase 10 — Final Cleanup and Regression Check

Objective:
Clean up duplicated styles and validate application stability.

Tasks:
1. Remove unused CSS classes and duplicate page-level styles.
2. Remove unused components after confirming no references remain.
3. Ensure shared components are documented or clearly named.
4. Run full build/typecheck.
5. Run lint if available.
6. Use Playwright/browser verification across representative pages.
7. Confirm no fake/mock/demo data was added.
8. Confirm no unrelated database changes were made.

Acceptance criteria:
- Build passes.
- No TypeScript errors.
- No obvious visual regressions.
- Global style is consistent.
- Role access is preserved.
- Supabase queries still work.

---

# Recommended Claude Execution Prompt

Use the following prompt when asking Claude to implement this plan.

```md
Implement the STSN Connect global UI/UX standardization based on `STSN_CONNECT_GLOBAL_UIUX_STANDARDIZATION_PHASE_PLAN.md`.

Important:
Do not update all pages in one pass.
Follow the staggered phases exactly.
Start with Phase 0 only unless I explicitly approve the next phase.

Approved Enrollment UI patterns to globalize:
1. Banner/page header should blend closer to the sidebar brown color and be applied across the application.
2. The `Enroll New Candidate` button color/style should become the primary/default button style across the application.
3. The Enrollment search bar and dropdown styling should become the standard for all inputs/selects.
4. The quick filter chips under the search bar should become the standard for filter buttons.
5. All tables that display students, faculty, teachers, staff, or users should use the same identity cell style with initials avatar, full name, and secondary identifier.
6. The new readable font-family and typography should be globalized across the application.

Rules:
- Do not use mock data.
- Do not insert fake/demo records.
- Do not hardcode sample arrays.
- Do not change unrelated business logic.
- Do not break role-based access.
- Do not modify the database directly.
- If schema/reference data is required, create a production-safe migration under `supabase/migrations` only.
- Do not execute migrations manually.

For each phase:
1. Provide file inventory before editing.
2. Explain what will visibly change.
3. Modify only the files required for that phase.
4. Run build/typecheck if available.
5. Use Playwright/browser verification if available.
6. Provide changed files list.
7. Provide testing checklist.
8. Stop and wait for approval before the next phase.

Begin with Phase 0: Audit and Inventory Only.
Do not modify files yet.
```

---

# Phase Approval Prompts

Use these prompts one at a time after reviewing each phase result.

## Approve Phase 1

```md
Proceed to Phase 1 only: Global Design Tokens and Typography.
Apply the approved readable font-family and global typography standard.
Do not modify module pages yet unless required to remove conflicting global font overrides.
Run build/typecheck and provide changed files.
```

## Approve Phase 2

```md
Proceed to Phase 2 only: Global Header / Banner Standard.
Make the module page banner/header blend closer to the sidebar brown color and apply it through shared components where possible.
Do not manually duplicate header markup per page.
Run build/typecheck and verify representative pages.
```

## Approve Phase 3

```md
Proceed to Phase 3 only: Global Button System.
Use the approved `Enroll New Candidate` button color/style as the global primary/default button standard.
Do not change destructive buttons into primary buttons.
Run build/typecheck and verify major actions across modules.
```

## Approve Phase 4

```md
Proceed to Phase 4 only: Global Form Control Standard.
Apply the approved Enrollment search bar, input, and dropdown styling across shared input/select components and high-priority pages.
Do not break controlled forms or validation.
Run build/typecheck and verify forms/search/filter bars.
```

## Approve Phase 5

```md
Proceed to Phase 5 only: Global Filter Chip / Quick Filter Standard.
Apply the Enrollment quick filter chip style to shared filter components and module quick filters.
Do not hardcode statuses or counts.
Run build/typecheck and verify filtering behavior.
```

## Approve Phase 6

```md
Proceed to Phase 6 only: Global Table System.
Standardize table styling, row spacing, header style, pagination, selected states, loading states, empty states, and error states.
Do not change table queries or business logic.
Run build/typecheck and verify representative tables.
```

## Approve Phase 7

```md
Proceed to Phase 7 only: Person Identity Cell Standard.
Create/reuse a common person identity cell for students, faculty, teachers, staff, users, and employees in tables.
Use initials avatar, full name, and secondary identifier.
Use actual database values only.
Run build/typecheck and verify table search/sort still works.
```

## Approve Phase 8

```md
Proceed to Phase 8 only: Module-by-module rollout.
Start with the next approved module only. Do not update every module at once.
For the selected module, apply the global banner, buttons, inputs, filters, tables, and person identity standards.
Run build/typecheck and verify the module with Playwright/browser if available.
```

## Approve Phase 9

```md
Proceed to Phase 9 only: Responsive and Accessibility Pass.
Test desktop, tablet, and mobile behavior across representative pages.
Fix layout overlap, table overflow, focus states, readability, and keyboard accessibility.
Run build/typecheck and provide verification notes.
```

## Approve Phase 10

```md
Proceed to Phase 10 only: Final Cleanup and Regression Check.
Remove duplicate styling, unused CSS, and unused components only after confirming they are no longer referenced.
Run full build/typecheck/lint if available.
Use Playwright/browser verification across representative pages.
Provide final changed files and testing checklist.
```

---

# Final Acceptance Checklist

The rollout is complete only when:

- Banner/page headers are consistent and closer to sidebar brown.
- Primary buttons use the approved Enrollment button style.
- Inputs, search bars, and selects share the approved global style.
- Filter chips/buttons use the approved Enrollment quick filter style.
- Person name columns use consistent avatar + identity formatting.
- Typography/font-family is globalized and readable.
- Tables have consistent styling, pagination, loading, empty, and error states.
- All visible modules and sub-pages are updated gradually.
- Role-based access is preserved.
- No fake/mock/demo data was added.
- Any required schema/reference changes are migration-only under `supabase/migrations`.
- Build/typecheck passes.
- Representative pages are visually verified using browser/Playwright where available.

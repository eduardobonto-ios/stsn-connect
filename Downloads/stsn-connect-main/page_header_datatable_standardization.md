# Page Header, DataTable, and Grades Directory Standardization Requirements

## Objective

Standardize the affected page headers, table spacing, DataTable column-header readability, and Grades Directory tile/table presentation while staying aligned with the UI/UX standards that were already applied in `STSN_CONNECT_GLOBAL_UIUX_STANDARDIZATION_PHASE_PLAN.md`.

This work should update existing pages only. Do not create mock pages, fake records, hardcoded counts, or unrelated UI changes. Any displayed data, counts, tables, summaries, dropdowns, and statuses must continue to use the existing project data sources.

---

## Progress Tracker

| Phase | Task | Status |
|---|---|---|
| 2 | Registrar Module — `ModulePageHeader` | ✅ Done |
| 2 | Accounting Module — `ModulePageHeader` | ✅ Done |
| 2 | Clinic Module — `ModulePageHeader` | ✅ Done |
| 2 | Guidance Module — `ModulePageHeader` | ✅ Done |
| 2 | Registrar Reports page — `ModulePageHeader` | ⬜ Pending |
| 2 | Clinic Reports page — `ModulePageHeader` | ⬜ Pending |
| 2 | Guidance Reports page — `ModulePageHeader` | ⬜ Pending |
| 2 | Consultation module — `ModulePageHeader` (currently uses inline `<h2>`) | ⬜ Pending |
| 2 | Payroll pages/sub-pages — `ModulePageHeader` (currently uses `AnalyticsDashboardShell`) | ⬜ Pending |
| 3 | Global DataTable header font weight / letter-spacing / uppercase | ✅ Done (in `index.css`) |
| 3 | DataTable header font smoothing (`-webkit-font-smoothing: antialiased`) | ⬜ Pending |
| 4 | `standard-table-container` class — Accounting table margins | ⬜ Pending |
| 5 | Grades Directory — `ModulePageHeader` | ✅ Done |
| 5 | Grades Directory — Color-coded KPI stat tiles | ✅ Done |
| 5 | Grades Directory master table — convert to `STSNDataTable` | ⬜ Pending |
| 5 | Grades Directory section column — "Section Name (N students)" format | ⬜ Pending |
| 6 | Final QA | ⬜ Pending |

---

## Important Existing UI Standard to Follow

Use `STSN_CONNECT_GLOBAL_UIUX_STANDARDIZATION_PHASE_PLAN.md` as the reference **only** for the already-approved global standards below:

1. `ModulePageHeader` usage and layout pattern.
2. Page header/banner color, especially the dark brown sidebar-aligned header style.
3. Primary/default button color and style based on the approved Enrollment button.

Do **not** use this task to rework unrelated global UI/UX areas from that file. The previous global standardization was already applied, so this task should only align the listed pages/modules with the existing configured standards.

### Existing Page Header Standard

Follow the already configured `ModulePageHeader` implementation and styling.

Expected behavior:

- Use the existing `ModulePageHeader` component instead of creating a new header component.
- Use the existing banner/header color configuration from the project.
- Keep the deeper brown/sidebar-aligned page header style already configured.
- Preserve title, subtitle, module badge, actions, metadata, and existing page context.
- Do not introduce a new banner color, new header gradient, or separate header design.

### Existing Primary Button Standard

Follow the already configured primary/default button style.

Expected behavior:

- Use the existing approved primary button color/style from the global standardization.
- Preserve existing page actions such as export, add, filter, refresh, print, generate, save, and submit.
- Do not restyle destructive actions as primary buttons.
- Do not create a new button color system.
- Use existing shared button components/classes where available.

---

## Scope of Work

### 1. Align Page Headers with `ModulePageHeader`

Review and update the following pages/modules so their page headers use the existing project-standard `ModulePageHeader` component/pattern:

- Registrar Reports — `src/features/reports/pages/RegistrarReportsPage.tsx` ⬜
- Clinic Reports — `src/features/reports/pages/ClinicReportsPage.tsx` ⬜
- Guidance Reports — `src/features/reports/pages/GuidanceReportsPage.tsx` ⬜
- Consultation module — `src/features/consultation/pages/ConsultationModulePage.tsx` ⬜ (currently uses inline `<h2>`)
- All Payroll pages and sub-pages — `src/features/payroll/pages/` ⬜ (currently uses `AnalyticsDashboardShell`)
- Registrar Module — ✅ already uses `ModulePageHeader`
- Accounting Module — ✅ already uses `ModulePageHeader`
- Clinic Module — ✅ already uses `ModulePageHeader`
- Guidance Module — ✅ already uses `ModulePageHeader`

### Requirements

- Replace custom or inconsistent page title/header layouts with the existing `ModulePageHeader`.
- Follow only the already configured header color/style from `STSN_CONNECT_GLOBAL_UIUX_STANDARDIZATION_PHASE_PLAN.md`.
- Preserve existing page titles, descriptions, breadcrumbs, actions, filters, buttons, and report controls where applicable.
- Ensure header spacing, alignment, typography, and button placement are consistent with other pages already using `ModulePageHeader`.
- Do not remove existing working actions such as export, add, filter, refresh, print, generate, or report buttons.
- If a page has no subtitle/description yet, add a short and useful one based on the module purpose.
- Use consistent wording for report pages, for example:
  - `Registrar Reports`
  - `Accounting Reports`
  - `Payroll Reports`
  - `Clinic Reports`
  - `Guidance Reports`

### Header Alignment Rules

- Do not create another reusable header component.
- Do not introduce a separate page-header CSS system.
- Do not change unrelated page layouts.
- Do not modify role-based access, route guards, menu visibility, or page permissions.
- Do not use hardcoded user/school/module data if those values already come from session, store, role context, Supabase, or existing page props.

---

## 2. Apply Standard Left and Right Margins on Tables/DataTables

Apply the project-standard left and right spacing for tables and DataTables in:

- All Accounting pages
- All Accounting sub-pages

**Status: ⬜ Pending** — `standard-table-container` class does not yet exist in the codebase. Needs to be created in `src/index.css` and applied to Accounting table wrappers.

### Requirements

- Tables should not touch the edge of the page/card/container.
- Apply consistent horizontal padding or margin around table containers.
- Use the existing standard table wrapper, table component, or DataTable wrapper if the project already has one.
- If no reusable wrapper exists for this exact spacing need, create or update one shared table container class/component so the spacing can be reused.
- Ensure the spacing works on desktop, tablet, and mobile layouts.
- Avoid one-off page-specific CSS unless absolutely necessary.
- Do not change Accounting calculations, queries, filters, summaries, exports, or approval logic.

### Suggested Standard

Use the project's existing table wrapper or a reusable wrapper similar to:

```tsx
<div className="standard-table-container">
  {/* DataTable or table component */}
</div>
```

Suggested styling behavior:

```css
.standard-table-container {
  width: 100%;
  padding-left: 1rem;
  padding-right: 1rem;
  overflow-x: auto;
}

@media (min-width: 768px) {
  .standard-table-container {
    padding-left: 1.25rem;
    padding-right: 1.25rem;
  }
}
```

Use existing project spacing tokens/classes if available instead of hardcoded CSS.

---

## 3. Improve DataTable Column Header Font Clarity Across the Project

The current DataTable column headers appear blurry and difficult to read. Update the global/shared DataTable header style so all DataTable headers across the project become clearer and more readable.

**Status: Partially done.** The existing `stsn-datatable` header style in `src/index.css` (line ~730) already applies `font-weight: 700`, `text-transform: uppercase`, `letter-spacing: 0.08em`, `white-space: nowrap`, and `JetBrains Mono` font. **Still pending:** `-webkit-font-smoothing: antialiased` and `-moz-osx-font-smoothing: grayscale` for improved on-screen rendering.

### Requirements

- Apply this globally through the shared DataTable component, shared table CSS, or design system layer.
- Avoid updating each page manually if a shared component/style exists.
- Improve font clarity, weight, contrast, letter spacing, and spacing.
- Column headers should be readable but not visually heavy.
- Keep the style consistent with the current application theme.
- Preserve the existing configured DataTable/header color direction unless it directly causes readability issues.
- Do not introduce a new unrelated table color theme.

### Remaining Change Needed in `src/index.css`

Add font smoothing to the existing `.stsn-datatable table.dataTable thead th` rule:

```css
.stsn-datatable table.dataTable thead th {
  /* existing properties... */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

### Validation

Confirm that the updated DataTable column header style applies to:

- Registrar tables
- Accounting tables
- Payroll tables
- Clinic tables
- Guidance tables
- Grades tables
- Shared reusable DataTable instances

---

## 4. Apply Appropriate Color Coding on Grades Directory Tiles

Update the Grades Directory page summary tiles/cards to use meaningful and consistent color coding.

**Status: ✅ Done.** `GradesDirectoryPage.tsx` already renders four color-coded KPI stat tiles:
- Class Loads → stsn-brown / blue (unit-themed)
- Sections → stone
- Periods Finalized → emerald
- Pending Periods → amber

### Target Page

- Grades Directory page

### Requirements

- Apply appropriate color coding to the tiles based on their purpose or status.
- Use soft background colors with readable text and icons.
- Avoid overly bright or low-contrast colors.
- Follow existing project color tokens if available.
- Colors should help users understand categories quickly.
- Do not change the data source or calculations behind the tile values.

### Suggested Color Usage

| Tile Type | Suggested Color Intent |
|---|---|
| Total students / total records | Neutral or blue |
| Completed / encoded grades | Green |
| Pending / incomplete grades | Amber or yellow |
| Failed / at-risk / issue count | Red or rose |
| Sections / classes | Purple or indigo |
| For review / approval | Orange |

Use existing theme variables/classes where possible. If new tile utility classes are needed, keep them generic and reusable.

---

## 5. Convert Grades Directory Table to DataTable

Convert the current Grades Directory table into the project-standard DataTable implementation.

**Status: ⬜ Pending.** The master section table in `GradesDirectoryPage.tsx` (line ~687) is still a plain `<table>` with inline `<thead>` and `<tbody>`. It needs to be converted to `STSNDataTable`. The nested per-section student grade table already uses `STSNDataTable` correctly.

### Target Page

- Grades Directory page — `src/features/grading/pages/GradesDirectoryPage.tsx`

### Requirements

- Replace the existing plain table with the standard DataTable component/pattern used in the project.
- Keep all existing real data wiring.
- Do not use mock data or hardcoded local arrays.
- Preserve existing filters, search, actions, navigation, and row-level controls.
- Apply the standard left and right table margins.
- Use the same reusable table wrapper or spacing style used for Accounting tables.
- Ensure the table is responsive and horizontally scrollable when needed.
- Keep existing permissions and role-based visibility intact.

### Required Column Update

The section column should display:

```text
Section Name (Student Count)
```

Example:

```text
Grade 7 - St. Matthew (38 students)
```

**Current state:** The section name and student count are shown as separate stacked lines in the same cell. The requirement is to combine them into the standard format above.

### Implementation Notes

- If the current data already includes the section name and student count, use the existing fields.
- If the section count is not yet available in the existing query/API, update the proper data source/service/query to return the count.
- Do not hardcode counts.
- If a new database view, function, or table support is required, create a Supabase migration under:

```text
supabase/migrations
```

- The migration must be manually executable and should not break existing production data.

---

## Suggested Implementation Sequence

### Phase 1 — Inventory and Impact Check ✅ Complete

1. ✅ Locate the existing `ModulePageHeader` component and identify its accepted props.
2. ✅ Locate the existing configured primary/default button component/classes.
3. ✅ List all affected files.
4. ✅ Identify the shared DataTable component and `stsn-datatable` styling layer in `index.css`.
5. ✅ Confirmed Accounting and Grades Directory do not yet have a reusable table wrapper.
6. ✅ Grades Directory derives student count from `classLoads[].studentIds`.
7. ✅ Confirmed global header/button classes from previous standardization.

### Phase 2 — Page Header Alignment

1. ✅ Registrar Module uses `ModulePageHeader`.
2. ✅ Accounting Module uses `ModulePageHeader`.
3. ✅ Clinic Module uses `ModulePageHeader`.
4. ✅ Guidance Module uses `ModulePageHeader`.
5. ⬜ Update Registrar Reports (`RegistrarReportsPage.tsx`) to use `ModulePageHeader`.
6. ⬜ Update Clinic Reports (`ClinicReportsPage.tsx`) to use `ModulePageHeader`.
7. ⬜ Update Guidance Reports (`GuidanceReportsPage.tsx`) to use `ModulePageHeader`.
8. ⬜ Update Consultation module (`ConsultationModulePage.tsx`) — replace inline `<h2>` with `ModulePageHeader`.
9. ⬜ Update all Payroll pages/sub-pages — replace `AnalyticsDashboardShell` header with `ModulePageHeader`.
10. ⬜ Preserve page-level actions and filters on all updated pages.
11. ⬜ Use only the already configured header color/style from the global standardization file.
12. ⬜ Verify spacing, breadcrumbs, and button alignment across all updated pages.

### Phase 3 — Shared DataTable Styling

1. ✅ Global DataTable header font weight, contrast, letter spacing, uppercase, and mono font already in place (`index.css` line ~730).
2. ⬜ Add `-webkit-font-smoothing: antialiased` and `-moz-osx-font-smoothing: grayscale` to `.stsn-datatable table.dataTable thead th`.
3. ⬜ Confirm the updated style affects all DataTable instances.
4. ⬜ Avoid duplicate page-level table header overrides.

### Phase 4 — Accounting Table Margins

1. ⬜ Add `.standard-table-container` CSS class to `src/index.css`.
2. ⬜ Apply `standard-table-container` wrapper to all Accounting pages and sub-pages.
3. ⬜ Confirm tables have proper left and right spacing.
4. ⬜ Test responsiveness and horizontal scroll behavior.
5. ⬜ Remove inconsistent one-off table spacing if safe.
6. ⬜ Confirm no Accounting data logic, formulas, permissions, or exports changed.

### Phase 5 — Grades Directory Enhancements

1. ✅ `ModulePageHeader` applied.
2. ✅ Color-coded KPI stat tiles applied.
3. ⬜ Convert the master section table (plain `<table>`) to `STSNDataTable`.
4. ⬜ Apply the standard `standard-table-container` margins.
5. ⬜ Update the section column to display `Section Name (Student Count)` — currently shows them as two stacked lines; merge into combined text.
6. ⬜ Verify student count comes from existing `classLoads[].studentIds` (no hardcoding needed).
7. ⬜ Add a Supabase migration under `supabase/migrations` only if new database support is required.

### Phase 6 — Final QA

1. ⬜ Verify page headers are consistent across all affected modules.
2. ⬜ Verify header colors and primary buttons follow the already configured global standard.
3. ⬜ Verify Accounting tables have standard left and right margins.
4. ⬜ Verify DataTable column headers are clear and readable across the project.
5. ⬜ Verify Grades Directory tiles use meaningful color coding.
6. ⬜ Verify Grades Directory table uses the standard DataTable.
7. ⬜ Verify section values display with student count.
8. ⬜ Confirm no mock data or hardcoded local arrays were added.
9. ⬜ Confirm no unrelated pages were changed.
10. ⬜ Confirm no unauthorized role/menu access changed.

---

## Acceptance Criteria

The task is complete when:

- [x] Registrar Module uses the existing `ModulePageHeader` standard.
- [x] Accounting Module uses the existing `ModulePageHeader` standard.
- [x] Clinic Module uses the existing `ModulePageHeader` standard.
- [x] Guidance Module uses the existing `ModulePageHeader` standard.
- [ ] Registrar Reports uses the existing `ModulePageHeader` standard.
- [ ] Clinic Reports uses the existing `ModulePageHeader` standard.
- [ ] Guidance Reports uses the existing `ModulePageHeader` standard.
- [ ] Consultation module uses the existing `ModulePageHeader` standard.
- [ ] All Payroll pages and sub-pages use the existing `ModulePageHeader` standard.
- [ ] Page header color/style follows the already configured global UI standard and does not introduce a new header design.
- [ ] Primary/default buttons on affected headers/actions follow the already configured approved primary button style.
- [ ] All Accounting tables/DataTables have consistent left and right margins.
- [ ] DataTable column headers are clearer and less blurry across the project (antialiasing added).
- [x] Grades Directory tiles have appropriate color coding.
- [ ] Grades Directory master table is converted to the standard DataTable.
- [ ] Grades Directory DataTable follows standard table margins.
- [ ] Grades Directory section column displays section name plus student count.
- [ ] No mock data, fake records, hardcoded counts, or unrelated visual redesigns were introduced.
- [ ] Any required database changes are placed under `supabase/migrations`.

---

## Developer Notes

- Follow existing project component patterns before creating new components.
- Reuse the existing `ModulePageHeader`; do not create a competing header component.
- Reuse the existing primary/default button classes/components; do not create a competing button system.
- Prefer shared styles/components over page-specific CSS.
- Do not rename routes or change access rules unless required by the existing page structure.
- Do not remove existing filters, actions, or reports.
- Keep the implementation production-ready and database-backed.
- If a database change is needed, create a migration file only. Do not directly modify production data outside migration scripts.

---

## Suggested Commit Message

```text
Align report headers and standardize DataTable readability
```

## Suggested Commit Details

```text
- Aligned report and module headers with the existing ModulePageHeader standard
- Reused configured global header and primary button styling
- Applied standard table margins to Accounting pages
- Improved global DataTable column header readability
- Added color-coded Grades Directory tiles
- Converted Grades Directory table to the standard DataTable
- Updated section display to include student count
```

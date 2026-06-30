# STSN Connect Metronic-Inspired UI/UX Tracker

## Phase 2A AppTable Foundation

Audit date: 2026-06-28

## Phase 2A Goal

Create a React 19-compatible `AppTable` foundation using TanStack Table for future page migrations, while keeping existing `STSNDataTable`, `DataTableCard`, DataTables.net pages, routing, and module behavior unchanged.

## Files Inspected

- `package.json`
- `package-lock.json`
- `src/components/common/STSNDataTable.tsx`
- `src/components/common/DataTableCard.tsx`
- `src/index.css`
- `src/features/**` table usages via repository search
- `src/components/**` raw `<table>` usages via repository search

## Existing Table Implementation Summary

- `STSNDataTable` remains the active shared DataTables.net wrapper.
- `STSNDataTable` uses `datatables.net-react`, `datatables.net-dt`, DataTables slots, persisted column visibility, search, sorting, pagination, row click handling, selected row state, bulk selection, and row color callbacks.
- `DataTableCard` remains the active card/header wrapper around many table pages.
- Several feature modules use `STSNDataTable` directly; many accounting, HR, registrar, directory, curriculum, and setup pages wrap it in `DataTableCard`.
- Raw `<table>` implementations still exist in previews, report views, dashboards, registrar workflows, faculty views, student portal views, grade components, and accounting detail sections.
- `src/index.css` includes DataTables-specific styling and `stsn-plain-table` styling. These were not removed or replaced.

## Package Changes Made

- Added `@tanstack/react-table`.
- Updated `package.json`.
- Updated `package-lock.json`.
- No Metronic dependency was added.
- No Bootstrap, Material UI, Redux, or direct jQuery dependency was added. jQuery is still present transitively through the existing DataTables.net dependency.

## Files Created

- `src/components/common/AppTable.tsx`
- `src/components/common/table/formatters.tsx`
- `src/components/common/table/index.ts`
- `docs/uiux/STSN_CONNECT_METRONIC_PHASE_2A_APPTABLE_TRACKER.md`

## AppTable Supported Features

- [x] Typed TanStack column definitions via `AppTableColumn<TData>`.
- [x] Client-side sorting.
- [x] Global search.
- [x] Column visibility menu.
- [x] Pagination with page-size selector.
- [x] Empty state.
- [x] Loading state.
- [x] Row actions render support.
- [x] Optional table title.
- [x] Optional table description.
- [x] Optional toolbar area.
- [x] Responsive horizontal overflow.
- [x] Accessible table structure where practical: `table`, `thead`, `tbody`, `th scope="col"`, labeled search, labeled pagination buttons.
- [x] Phase 1 ERP tokens used for surface, border, text, accent, and brand styling.

## Helper Utilities Created

- `formatEmptyValue(value, fallback)`
- `formatPersonName(person)`
- `formatDateValue(value)`
- `formatCurrencyValue(value, currency, locale)`
- `renderStatusBadge(status)` using `AppStatusBadge`
- `renderTableActions(actions)`

## Usage Example

```tsx
import AppTable, { type AppTableColumn } from "../../components/common/AppTable";
import { formatDateValue, renderStatusBadge } from "../../components/common/table";

interface Row {
  id: string;
  name: string;
  status: string;
  createdAt: string;
}

const columns: AppTableColumn<Row>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "status", header: "Status", cell: ({ getValue }) => renderStatusBadge(String(getValue())) },
  { accessorKey: "createdAt", header: "Created", cell: ({ getValue }) => formatDateValue(String(getValue())) },
];

<AppTable
  data={rows}
  columns={columns}
  title="Records"
  description="Search, sort, and review records"
  rowActions={(row) => <button type="button">Open {row.original.name}</button>}
/>;
```

## Validation Results

- `npm.cmd run lint`: failed on existing TypeScript issues outside Phase 2A files:
  - `src/components/common/ApprovalInbox.tsx`
  - `src/features/accounting/pages/AccountingDashboardPage.tsx`
  - `src/features/guardian/pages/GuardianPortalPage.tsx`
  - `src/features/guidance/pages/GuidanceModulePage.tsx`
  - `src/features/payroll/pages/PayrollDashboardPage.tsx`
  - `src/features/scheduling/pages/SchedulingModulePage.tsx`
- `npm.cmd run build`: initially failed in the sandbox with the known `vite.config.ts` access issue.
- `npm.cmd run build` outside the sandbox: passed.
- Existing DataTables pages still compile in the production build.
- `AppTable` compiles in the production build.
- Dependency check confirmed `@tanstack/react-table` is installed and no Metronic, Bootstrap, Material UI, or Redux dependency was added.

## Known Limitations

- `AppTable` is not yet wired into any feature page.
- `AppTable` currently handles client-side data only.
- Persisted column visibility is not included yet.
- Row selection and bulk actions are not included yet.
- Column-level filters are supported internally by TanStack state but no shared filter UI has been added yet.
- Existing DataTables.net styling remains in global CSS until migrations are complete.
- Existing lint/typecheck blockers should be resolved before Phase 2B uses lint as a clean regression gate.

## Recommended First Pages For Phase 2B Migration

- `src/features/admin/pages/AuditLogPage.tsx`: compact `DataTableCard` + `STSNDataTable` usage and low workflow risk.
- `src/features/student-directory/pages/StudentDirectoryPage.tsx`: high-value directory table with search and row click behavior.
- `src/features/books/pages/BooksSetupPage.tsx`: setup-style table with straightforward status/action migration.

## Rollback Notes

- Remove `src/components/common/AppTable.tsx`.
- Remove `src/components/common/table/formatters.tsx`.
- Remove `src/components/common/table/index.ts`.
- Remove `@tanstack/react-table` from `package.json`.
- Restore `package-lock.json` to the previous lockfile state.
- No existing feature page imports `AppTable` yet, so rollback should not affect current runtime table behavior.

## Phase 2B Checklist

- [ ] Resolve existing TypeScript/lint blockers.
- [x] Choose one low-risk page for first migration.
- [x] Compare `STSNDataTable` behavior against `AppTable` behavior on the selected page.
- [ ] Add persisted column visibility if the migrated page needs it.
- [ ] Add row selection/bulk action support only when a selected migration requires it.
- [x] Migrate one page, validate, then repeat gradually.

## Phase 2B Pilot Migration Notes

Audit date: 2026-06-28

### Pilot Page Migrated

- `src/features/admin/pages/AuditLogPage.tsx`

### Files Changed

- `src/features/admin/pages/AuditLogPage.tsx`
- `docs/uiux/STSN_CONNECT_METRONIC_PHASE_2A_APPTABLE_TRACKER.md`
- `docs/uiux/STSN_CONNECT_METRONIC_PHASE_0_5_AUDIT_TRACKER.md`

### Previous Table Implementation

- `AuditLogPage.tsx` used `DataTableCard` as the table shell.
- The row table used `STSNDataTable<AuditLogEntry>`.
- Data source was `auditLog` from `useSTSNStore()`.
- Page-level filtering was handled by local React state:
  - text search over actor name, entity ID, and remarks
  - entity type select filter
  - action select filter
- Columns were Timestamp, Actor, Role, Entity Type, Action, and Remarks.
- Action values rendered through the local `ActionBadge`.
- Remarks sorting was disabled with `orderable: false`.
- Row click opened `DrilldownDrawer` with audit entry detail.
- CSV export used the currently filtered rows.
- Pagination used DataTables client-side pagination with `pageLength={25}` and `lengthChange: false` from `STSNDataTable`.
- Empty state message was `No audit entries match your filters.`
- No explicit async loading state existed on this page.

### New AppTable Implementation Notes

- Replaced only the audit log table usage with `AppTable<AuditLogEntry>`.
- Converted the DataTables column config to typed TanStack column definitions through `AppTableColumn<AuditLogEntry>`.
- Kept the page-level search, entity filter, action filter, entry count, and export button in the `AppTable` toolbar.
- Disabled `AppTable` internal global search for this page so export/count behavior remains tied to the same filtered data set visible in the table.
- Disabled `AppTable` column visibility for this page because the previous `AuditLogPage.tsx` did not enable the `STSNDataTable` column toggle UI.
- Set `initialPageSize={25}` and `pageSizeOptions={[25]}` to preserve the previous fixed page length.
- Passed `loading={false}` because the current store-backed page has no loading flag.
- Passed `getRowId={(row) => row.id}` for stable TanStack row identity.
- Used Phase 1 ERP theme tokens for toolbar controls, borders, text, focus rings, and hover states.

### Preserved Behavior

- Store data source remains `auditLog` from `useSTSNStore()`.
- Text search still filters actor name, entity ID, and remarks.
- Entity type and action filters are preserved.
- CSV export still exports the currently filtered data set.
- Columns and their order are preserved.
- Timestamp, role, entity type, remarks, and action badge rendering are preserved.
- Remarks column remains unsortable.
- Row click still opens the same `DrilldownDrawer` detail view.
- Empty state is preserved with an added helper description from `AppTable`.
- Pagination remains client-side and starts at 25 rows per page.
- No row actions were present before; none were added.
- No routing, `App.tsx`, DataTables dependencies, or Metronic dependencies were changed.

### Behavior Differences

- The table shell is now `AppTable` instead of `DataTableCard` plus `STSNDataTable`, so the header/table/pagination chrome follows the Phase 2A ERP-tokenized `AppTable` visual style.
- Pagination controls now use `AppTable` first/previous/next/last buttons and display the current page count.
- `AppTable` currently renders a Rows selector even when this page passes a single `[25]` option. The effective behavior is still fixed at 25 rows.
- Search is intentionally page-controlled rather than `AppTable` global search for this pilot so the entry count and CSV export remain consistent with the visible filtered rows.

### Build, Typecheck, And Lint Result

- `npm.cmd run lint`: failed on existing TypeScript issues outside the Phase 2B files:
  - `src/components/common/ApprovalInbox.tsx`
  - `src/features/accounting/pages/AccountingDashboardPage.tsx`
  - `src/features/guardian/pages/GuardianPortalPage.tsx`
  - `src/features/guidance/pages/GuidanceModulePage.tsx`
  - `src/features/payroll/pages/PayrollDashboardPage.tsx`
  - `src/features/scheduling/pages/SchedulingModulePage.tsx`
- No `AuditLogPage.tsx` TypeScript error appeared in the lint output.
- `npm.cmd run build`: first failed in the sandbox with the known Vite config access issue.
- `npm.cmd run build` outside the sandbox: passed.
- Production build warning: existing large main JS chunk warning from Vite/Rollup.

### Validation Notes

- Confirmed only one feature page imports `AppTable`: `src/features/admin/pages/AuditLogPage.tsx`.
- Confirmed `STSNDataTable` still exists at `src/components/common/STSNDataTable.tsx`.
- Confirmed `DataTableCard` still exists at `src/components/common/DataTableCard.tsx`.
- Confirmed many existing DataTables pages still import/use `STSNDataTable` and/or `DataTableCard`.
- Confirmed `package.json` still includes `datatables.net-dt` and `datatables.net-react`.
- Confirmed no Metronic, Bootstrap, Material UI, Redux, or direct jQuery dependency was added.
- Confirmed production build compiles existing DataTables pages alongside the migrated audit log page.

### Issues Found

- Existing repository TypeScript blockers prevent lint/typecheck from being a clean migration gate.
- `AppTable` does not yet expose controlled search state or filtered rows to the parent. For this pilot, page-level filtering was retained to preserve CSV export and filtered count behavior.
- `AppTable` does not yet support hiding the page-size selector when only one page size is provided.
- `AppTable` column visibility is not persisted yet; not needed for this pilot because the old page did not expose column toggling.

### Recommendation For Phase 2C Migrations

- `src/features/books/pages/BooksSetupPage.tsx`: setup-style page with a straightforward `DataTableCard` plus `STSNDataTable<BookPackage>` table and low workflow risk.
- `src/features/student-directory/pages/StudentDirectoryPage.tsx`: valuable next validation target for search plus row-click detail behavior, but slightly higher risk because it is a directory workflow.
- `src/features/accounts/pages/AccountsManagementPage.tsx`: compact admin table with role/status display and row selection potential; useful after confirming status badge migration patterns.

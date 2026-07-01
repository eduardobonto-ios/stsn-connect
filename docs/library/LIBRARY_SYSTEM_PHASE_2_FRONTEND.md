# STSN Connect — Library System: Phase 2 (Frontend + RBAC Wiring) — DONE

> **Phase:** 2 of 3 — **Frontend feature + config wiring.** Depends on Phase 1 migration.
> **Date:** 2026-07-01
> **Layout reference:** the "EduLib" library-admin mockup (KPI strip, section nav, data tables, quick-action rail) — rebuilt with the existing STSN / Metronic design system (shared `App*` components + STSN tokens). **No new UI framework introduced.**
> **Verification:** `npm run lint` (`tsc --noEmit`) → exit 0; `npm run build` → success (`LibraryModulePage` lazy chunk emitted).

---

## 1. Entry point decision (important)

You asked to **keep the sidebar** and **reuse the existing "Books & Library"** entry. On inspection, `BOOKS_SETUP` ("Books & Library") had **no sidebar entry at all** — it was route-only (`/books-setup`). So to make the module reachable via "Books & Library" as requested, I added **one standard top-level group** using the same pattern every other module group uses (no restyle, no structural change to the sidebar):

```
Books & Library  (icon: Library)
├─ Book Packages   → BOOKS_SETUP      (existing fee-assessment page, unchanged)
└─ Library System  → LIBRARY_SYSTEM   (new lending module)
```

Visibility is permission-filtered per child, so Accounting sees only *Book Packages*, Admin sees only *Library System*, Registrar/Super-Admin see both. If you'd rather have **zero** nav change (route-only access), remove the `BOOKS_SETUP` group object from `NAV_ITEMS` in `src/config/navigation.config.ts` — everything else still works via `/library/*`.

The library's **own** navigation (Dashboard, Catalog, Inventory, …) lives as an in-page tab bar inside the module content — this is the "EduLib left rail" from the mockup, matched to how `CashierModulePage` renders its tabs.

---

## 2. Files changed (additive)

**Config / wiring (5 files):**
- `src/config/permissions.config.ts` — `LIBRARY_SYSTEM` added to `STSNModule`, `MODULE_LABELS` ("Library System"), and `ROLE_PERMISSIONS` (super-admin, admin, registrar).
- `src/config/navigation.config.ts` — "Books & Library" group (see §1); imported `Library` icon.
- `src/config/app-routes.config.ts` — `getPathForModule` → `/library/{subPage}`; `resolveAppRoute` handles `segments[0] === "library"`.
- `src/components/layout/AppModuleRenderer.tsx` — lazy import, `RENDERED_MODULE_IDS`, `librarySubPage`/`onLibrarySubPageChange` props, conditional render.
- `src/App.tsx` — `librarySubPage` derivation, renderer props, breadcrumb labels for the module + sub-pages.

**New feature (`src/features/library/`):**
- `types.ts` — domain models (camelCase mirrors of the `library_*` columns) + `LIBRARY_SUB_PAGES`.
- `data/useLibraryData.ts` — Supabase load (`dbSelectAll` for all 9 tables), active-school scoping, borrower options (students + employees), and mutations/workflows: catalog & copy CRUD, maintenance CRUD, **checkout**, **processReturn** (computes overdue days + auto-raises fine), **markLostDamaged**, and fine **settle/waive/cancel**. Local-first state with background `dbInsert`/`dbUpdate`/`dbDelete`.
- `components/shared.tsx` — `formatMoney`, `LibraryStatusBadge` (maps domain statuses onto the shared status-style pills), `SectionPanel`.
- `components/sections/section-props.ts` — shared section prop types.
- `pages/LibraryModulePage.tsx` — shell: dark `ModulePageHeader`, 6-KPI strip, in-page tab nav, loading/error/empty states, delegates to sections.
- `components/sections/` — **Dashboard, Catalog, Inventory, Borrowing, Returns, Overdue, LostDamaged, Fines, Reports, Maintenance**.

---

## 3. Data flow

Library tables are **not** in the global Zustand store; the module self-fetches through `services/supabaseCrud.ts` in `useLibraryData` (isolated, low blast-radius). Borrowers reuse the store's `students`/`employees`. Reports export via the existing `services/reportExportService.ts`. All action buttons are gated by `usePermissions().canPage("LIBRARY_SYSTEM", <page>, <action>)`, matching the Phase 1 RBAC seed.

**School scoping:** records are filtered to the active school's uuid (resolved from the store `schools` array); `activeSchool === "ALL"` shows everything. New records stamp the active school's uuid.

**Polymorphic borrower:** checkout snapshots `borrowerName`/`borrowerNo` and stores `borrowerType` + `borrowerRefId` (no FK), exactly as the schema intends.

---

## 4. Per-page coverage

| Page | Implemented |
|---|---|
| Dashboard | KPIs (via shell) + recent borrowing activity, inventory-status bars, quick-action rail, outstanding-fines widget. |
| Book Catalog | Searchable table; add/edit/delete title modal (ISBN, author, category, subject, grade levels, status). |
| Inventory | Copies table; add/edit/delete with **accession uniqueness** guard, shelf/condition/status/cost. |
| Borrowing | Borrower search (student/employee), available-copy multi-select, due date (default +7) → creates transaction + items, flips copies to BORROWED. |
| Returns | Open-loans table; return modal computes overdue days + fine preview, flags damage; flips copy back / raises fine; closes transaction when fully returned. |
| Overdue | Derived past-due list with days + estimated fine; Print/CSV/Excel/PDF export. |
| Lost / Damaged | Mark copy lost/damaged with editable penalty → raises PENDING fine, updates copy + open loan item. |
| Fines | Pending/collected summary; settle (OR no.), waive (reason, `approve`), cancel (`manage`). |
| Reports | Borrowed / Overdue / Inventory / Lost-Damaged / Borrower-History with export. |
| Maintenance | Categories / Subjects / Shelves / Fine Rules CRUD (sub-tabbed). |

---

## 5. Try it

1. Apply the Phase 1 migration (`20260701140000_library_system_schema.sql`) so the tables + demo catalog + RBAC seed exist.
2. `npm run dev`, sign in as Super Admin / Registrar / Admin.
3. Sidebar → **Books & Library → Library System** (or open `/library`).
4. Exercise: Catalog add → Inventory add copy → Borrowing checkout → Returns (back-date the due date via an overdue copy to see a fine) → Fines settle/waive.

> Note: with Phase 1 not yet applied, the module loads with empty tables (no crash) — it just shows empty states until the schema + seed are in place.

---

## 6. Not in Phase 2 (→ Phase 3)

Cashier/`payments` settlement coupling & `financial_holds`, scheduled overdue automation, and student/guardian read-only "my borrowed books". `library_fines.payment_id` already exists (nullable) for the future cashier link.

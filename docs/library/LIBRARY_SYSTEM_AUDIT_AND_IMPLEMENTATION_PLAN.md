# STSN Connect — Library System: Audit & Implementation Plan

> **Phase:** Audit / Planning only. **No code, tables, or files were modified** beyond creating this document.
> **Date:** 2026-07-01
> **Scope:** Add a school Library System module to STSN Connect, following the existing architecture, Metronic-inspired UI, shared components, Supabase-only data, and the existing RBAC / Page Assignment model.

---

## 1. Executive Summary

- **There is NO existing Library System.** The current `books` feature (`BOOKS_SETUP` module) is **fee/tuition "Book Packages"** — bundles of books assessed by grade level for billing. It is **not** a lending library and must **not** be reused for library operations.
- **No library, catalog, copy, borrowing, accession, or library-fine tables exist.** Safe to introduce a new `library_*` schema without collisions.
- **Reusable reference tables already exist and must NOT be duplicated:** `students`, `employees`, `schools`, `payments`, `assessments`, `ledger_transactions`, `financial_holds`.
- **Recommended module key: `LIBRARY_SYSTEM` (new, separate from `BOOKS_SETUP`).** The two are different business domains (fee assessment vs. lending).
- The RBAC layer (`security_permissions` / `security_role_permissions` / Page Assignment) is table-driven and additive — new permissions are added purely through a migration + one line in the `STSNModule` union.
- Recommended rollout: **Phase 1 migration → Phase 2 frontend + RBAC wiring → Phase 3 reports & cashier integration.**

---

## 2. Current Project Findings

### 2.1 Architecture snapshot

| Concern | Location / Pattern |
|---|---|
| Feature pages | `src/features/<module>/pages/*.tsx` |
| Module enum | `STSNModule` union in `src/config/permissions.config.ts` |
| Role → module map | `ROLE_PERMISSIONS` in `permissions.config.ts` |
| Sidebar | `NAV_ITEMS` in `src/config/navigation.config.ts` |
| Routing | `src/config/app-routes.config.ts` (module → path, path → module) |
| Module render switchboard | `src/components/layout/AppModuleRenderer.tsx` (`RENDERED_MODULE_IDS` + `lazy()` import + conditional render) |
| Permission checks (runtime) | `src/hooks/usePermissions.ts` → `can(module, action)`, `canPage(module, page, action)` |
| Permission service | `src/services/securityPermissionService.ts` |
| Data access | `src/services/supabaseCrud.ts` (`dbInsert`, `dbUpdate`, `dbSelectAll`, snake/camel mapping), `dataLoader.ts`, `store.ts` |
| Shared UI | `src/components/common/App*.tsx` |

### 2.2 Shared UI components available (reuse — do NOT add a new framework)

`AppTable` (+ `AppTableColumn`), `AppCard`, `AppKpiCard` / `DashboardKpiCard` / `StatCard`, `AppButton`, `AppStatusBadge`, `AppModal`, `AppFormField`, `AppInput`, `AppSelect`, `AppAutocompleteSelect`, `AppTextarea`, `AppToggle`, `AppSearchInput`, `AppFilterChip`, `AppTabs`, `AppEmptyState`, `AppErrorState`, `AppLoadingState`, `AppToast`, `AppConfirmDialog` / `useAppDialog`, `ModulePageHeader` / `PageHeader`, `ExportMenu`, `PersonIdentityCell`. Styling is Tailwind with STSN tokens (`stsn-beige`, `stsn-gold`, etc.).

### 2.3 Database conventions (to mirror in the new migration)

Observed across `0001_schema.sql`, HR (`0020`), clinic (`0017`), and RBAC (`20260701120000`):

- **PK:** `id uuid primary key default gen_random_uuid()`
- **Legacy bridge:** `legacy_id text unique` (present on core tables; optional for net-new)
- **Multi-school:** `school_id uuid references public.schools(id) on delete set null on update cascade` — **the project IS multi-school; include `school_id`.**
- **Timestamps:** `created_at` / `updated_at timestamptz not null default now()`
- **Audit author:** `created_by text` (nullable) is used on several tables; `updated_by text` where applicable. Note: **`created_by` is `text`, not a uuid FK.**
- **Soft state:** `is_active boolean not null default true` on reference/catalog tables (as in the security tables).
- **updated_at trigger:** RBAC uses `public.security_touch_updated_at()`. Provide a library equivalent (or reuse a shared touch function) for `updated_at` auto-bump.
- **RLS posture (demo):** enable RLS, then a single permissive `for all to anon, authenticated using (true) with check (true)` policy per table — the app uses the anon key with no signed-in session; access enforcement lives at the app layer. Marked "TIGHTEN BEFORE PRODUCTION." **Match this posture** for consistency.
- **Idempotency:** `create table if not exists`, `on conflict do nothing`, `drop policy if exists`, `create index if not exists`.
- **Migration filename convention:** `YYYYMMDDHHMMSS_snake_description.sql` (e.g. next: `2026070114xxxx_library_system_schema.sql`).

---

## 3. Audit Answers (point-by-point)

**Do we already have a Library or Books module?**
Partially — a `books` feature exists but it is **Book Packages for fee assessment**, not a library. No lending library exists.

**Existing tables for…**

| Concept | Exists? | Table(s) | Reuse for library? |
|---|---|---|---|
| Books (catalog) | ❌ | — | New `library_books` |
| Book categories | ❌ | — | New `library_book_categories` |
| Book inventory / copies | ❌ | — | New `library_book_copies` |
| Book packages (fees) | ✅ | `book_packages`, `book_package_items` | **No** — different domain (billing) |
| Borrowers | ❌ (as such) | `students`, `employees` | **Reuse** as borrower sources |
| Student records | ✅ | `students` (uuid PK, `school_id`, `student_no`) | **Reuse** |
| Employees / faculty | ✅ | `employees` (uuid PK, `school_id`), `teachers` | **Reuse** |
| Fines / penalties | ❌ (no library fine) | — | New `library_fines` |
| Cashiering / payments | ✅ | `payments` (`or_number`, `amount`, `student_id`), `ledger_transactions`, `financial_holds` | **Integrate** (see §11) |
| Accounting | ✅ | `assessments`, `journal_entries`, COA | Optional integration |

**Existing frontend pages for books/library?** Only `src/features/books/pages/BooksSetupPage.tsx` (fee packages). No library pages.

**Existing sidebar entries for Library?** No. `BOOKS_SETUP` routes to `/books-setup` and is labeled "Books & Library" but only serves fee packages. No library nav entry.

**Existing RBAC permissions for `BOOKS_SETUP`, `LIBRARY`, `LIBRARY_SYSTEM`, `BOOK_CATALOG`?**
Only `BOOKS_SETUP` exists (module-level `view`, seeded in `20260701120000_security_rbac_schema.sql`, label "Books & Library"). **No `LIBRARY`, `LIBRARY_SYSTEM`, or `BOOK_CATALOG` permissions exist.**

**Reuse `BOOKS_SETUP` or new module key?**
**New module key `LIBRARY_SYSTEM`.** Rationale: `BOOKS_SETUP` is owned by Accounting/Registrar for fee assessment; the Library is an operational lending domain with distinct pages, roles (librarian), and permissions. Overloading `BOOKS_SETUP` would conflate billing and lending and break the "Books & Library" fee semantics.

---

## 4. Recommended Module Key & Roles

- **Module key:** `LIBRARY_SYSTEM` — add to the `STSNModule` union in `permissions.config.ts` and to `MODULE_LABELS` as `"Library System"`.
- **`BOOKS_SETUP`** stays as-is (rename its label to just "Books Setup" is optional but recommended to reduce confusion; **not required** and out of scope for Phase 1).
- **Role access (`ROLE_PERMISSIONS`):** grant `LIBRARY_SYSTEM` to `super-admin`, `admin`, `registrar`. Optionally a future dedicated `LIBRARIAN` role — **do not add a new role now**; assign to existing roles + Page Assignment overrides. Students/guardians get **read-only** "my borrowed books" later (out of Phase 1/2 core).

> There is currently no `LIBRARIAN` role in `security_roles`. Recommendation: **defer** creating one; use per-user overrides via Page Assignment. If a dedicated role is desired, add it in a later migration alongside `security_user_role_assignments` backfill.

---

## 5. Recommended Routes

Follow the existing single-path and `/{module}/{subPage}` patterns in `app-routes.config.ts`.

| Page | Path |
|---|---|
| Dashboard | `/library` (default → `dashboard`) |
| Book Catalog | `/library/catalog` |
| Book Copies / Inventory | `/library/inventory` |
| Borrowing / Checkout | `/library/borrowing` |
| Returns | `/library/returns` |
| Overdue | `/library/overdue` |
| Lost / Damaged | `/library/lost-damaged` |
| Reports | `/library/reports` |
| Maintenance / Reference | `/library/maintenance` |

Wire in `app-routes.config.ts` (module→path and path→module, `segments[0] === "library"`) and add `"LIBRARY_SYSTEM"` to `RENDERED_MODULE_IDS` + a `lazy()` import + conditional block in `AppModuleRenderer.tsx`.

---

## 6. Recommended Sidebar / Menu Placement

Add a **top-level** `NAV_ITEMS` entry (icon `Library` or `BookMarked` from lucide, already imported set includes `Library`, `BookMarked`, `BookOpen`):

```
{ id: "LIBRARY_SYSTEM", label: "Library", icon: Library, desc: "Catalog, borrowing, returns & fines",
  children: [
    { id: "library-dashboard",   label: "Dashboard",        targetModule: "LIBRARY_SYSTEM" },
    { id: "library-catalog",     label: "Book Catalog",     targetModule: "LIBRARY_SYSTEM" },
    { id: "library-inventory",   label: "Book Inventory",   targetModule: "LIBRARY_SYSTEM" },
    { id: "library-borrowing",   label: "Borrowing",        targetModule: "LIBRARY_SYSTEM" },
    { id: "library-returns",     label: "Returns",          targetModule: "LIBRARY_SYSTEM" },
    { id: "library-overdue",     label: "Overdue",          targetModule: "LIBRARY_SYSTEM" },
    { id: "library-lost-damaged",label: "Lost / Damaged",   targetModule: "LIBRARY_SYSTEM" },
    { id: "library-reports",     label: "Reports",          targetModule: "LIBRARY_SYSTEM" },
    { id: "library-maintenance", label: "Maintenance",      targetModule: "LIBRARY_SYSTEM" },
  ] }
```

Sidebar visibility is already permission-filtered by module, so this appears only for roles/users granted `LIBRARY_SYSTEM`.

---

## 7. Recommended Database Tables

All new, prefixed `library_`. Verified: **none currently exist.** Include `school_id`, `created_at`, `updated_at`, `created_by text`, and `is_active` where noted.

### 7.1 Reference / maintenance tables

| Table | Purpose | Key columns |
|---|---|---|
| `library_book_categories` | Catalog categories | `id`, `school_id`, `code` unique-per-school, `name`, `description`, `is_active` |
| `library_book_subjects` | Subject tags | `id`, `school_id`, `name`, `is_active` |
| `library_shelves` | Physical shelf/location | `id`, `school_id`, `code`, `name`, `location`, `is_active` |
| `library_fine_rules` | Overdue/lost fine config | `id`, `school_id`, `name`, `fine_per_day numeric`, `grace_days int`, `max_fine numeric`, `lost_fee_mode` (`fixed`/`replacement_cost`/`multiplier`), `lost_fee_value numeric`, `is_active`, `effective_from` |

> `borrower_types` and `book_conditions` are **modeled as `CHECK` constraints / enums**, not tables (few, stable values). This avoids over-normalizing. A `library_borrower_types` / `library_book_conditions` table is optional if the school wants them editable — **recommend CHECK constraints for Phase 1.**

### 7.2 Catalog & inventory

**`library_books`** (title-level catalog)
`id`, `school_id`, `isbn text`, `title text not null`, `author text`, `publisher text`, `publication_year int`, `category_id → library_book_categories`, `subject_id → library_book_subjects (null)`, `grade_level_applicability text[]` or text, `edition text`, `language text`, `description text`, `status text check (status in ('Active','Inactive','Archived')) default 'Active'`, `is_active`, `created_at/updated_at/created_by`.

**`library_book_copies`** (physical inventory)
`id`, `school_id`, `book_id → library_books on delete cascade`, `accession_no text unique` (barcode), `shelf_id → library_shelves (null)`, `acquisition_date date`, `acquisition_cost numeric`, `condition text check in ('New','Good','Fair','Poor')`, `copy_status text check in ('AVAILABLE','BORROWED','RESERVED','LOST','DAMAGED','ARCHIVED') default 'AVAILABLE'`, `remarks text`, `is_active`, timestamps/author.

### 7.3 Borrowing / returns (header + items)

**`library_borrow_transactions`** (checkout header — one borrower, one checkout event)
`id`, `school_id`, `transaction_no text unique`, `borrower_type text check in ('STUDENT','EMPLOYEE','FACULTY')`, `borrower_ref_id uuid` (points to `students.id` or `employees.id`; **polymorphic, no hard FK**), `borrower_name text` (denormalized snapshot), `borrower_no text` (student_no / employee no snapshot), `checkout_date date not null default current_date`, `due_date date not null`, `status text check in ('BORROWED','RETURNED','OVERDUE','LOST','DAMAGED','CANCELLED') default 'BORROWED'`, `issued_by text`, `remarks text`, timestamps/author.

**`library_borrow_transaction_items`** (one row per copy in the checkout)
`id`, `transaction_id → library_borrow_transactions on delete cascade`, `copy_id → library_book_copies`, `book_id → library_books` (denormalized for reporting), `due_date date`, `return_date date (null)`, `returned_condition text (null)`, `item_status text check in ('BORROWED','RETURNED','OVERDUE','LOST','DAMAGED') default 'BORROWED'`, `overdue_days int default 0`, `remarks text`, timestamps.

### 7.4 Fines

**`library_fines`**
`id`, `school_id`, `transaction_item_id → library_borrow_transaction_items (null)`, `transaction_id → library_borrow_transactions (null)`, `borrower_type`, `borrower_ref_id uuid`, `borrower_name text`, `fine_type text check in ('OVERDUE','LOST','DAMAGED')`, `amount numeric not null default 0`, `status text check in ('PENDING','PAID','WAIVED','CANCELLED') default 'PENDING'`, `assessed_date date default current_date`, `settled_date date (null)`, `waived_reason text (null)`, **cashier link:** `payment_id uuid references public.payments(id) (null)`, `or_number text (null)`, `settlement_remarks text`, timestamps/author.

### 7.5 Entity relationship (text)

```
schools 1───* library_book_categories/subjects/shelves/fine_rules/books/copies/transactions/fines
library_books 1───* library_book_copies
library_book_copies *───1 library_shelves
library_borrow_transactions 1───* library_borrow_transaction_items *───1 library_book_copies
library_borrow_transaction_items 1───0..1 library_fines
library_fines 0..1───1 payments        (cashier settlement, optional)
borrower_ref_id ⇢ students.id | employees.id  (polymorphic by borrower_type; no FK)
```

### 7.6 Indexes (minimum)

- `library_book_copies (book_id)`, `(copy_status)`, unique `(accession_no)`
- `library_books (school_id)`, `(category_id)`, `(isbn)`
- `library_borrow_transactions (borrower_ref_id)`, `(status)`, `(due_date)`, unique `(transaction_no)`
- `library_borrow_transaction_items (transaction_id)`, `(copy_id)`, `(item_status)`
- `library_fines (borrower_ref_id)`, `(status)`, `(transaction_item_id)`

---

## 8. Recommended Migration File Plan

**One migration** for schema + reference seed + RBAC seed (or split RBAC into a second file if preferred). Filename: `supabase/migrations/2026070114xxxx_library_system_schema.sql`.

Must contain, in order:
1. `library_touch_updated_at()` trigger fn (or reuse a shared one).
2. `create table if not exists` for all §7 tables + column `CHECK` constraints.
3. Foreign keys (hard FKs for owned rows; **no FK on `borrower_ref_id`** — polymorphic).
4. `create index if not exists` per §7.6.
5. `updated_at` triggers per table.
6. RLS enable + permissive `all_anon_auth` policy per table (match demo posture).
7. Reference seed data (§9) with `on conflict do nothing`.
8. RBAC permission seed rows (§10) into `security_permissions` + role grants into `security_role_permissions`.
9. Table/column comments.

**Guardrails:** additive & idempotent only; no `DROP TABLE`; no changes to existing tables except **adding** RBAC seed rows; no duplicate tables.

---

## 9. Recommended Seed Data

- **Categories:** Fiction, Non-Fiction, Reference, Textbook, Periodical, Children's, Filipiniana.
- **Subjects:** Mathematics, Science, English, Filipino, Araling Panlipunan, MAPEH, Values Education, Computer/ICT.
- **Shelves:** A1–A3, B1–B3, Reference-01, Periodical-01 (per demo school).
- **Fine rule:** `Default Overdue Rule` — `fine_per_day = 5.00`, `grace_days = 0`, `max_fine = 500.00`, `lost_fee_mode = 'replacement_cost'`.
- **Demo catalog/copies:** a small optional set (5–10 titles, ~15 copies) guarded so it does not pollute production — mirror the `0026_hr_demo_data_optional.sql` "optional demo" pattern. Keep **reference** seed non-optional, **catalog** seed optional.
- Seed `school_id` using the existing demo school IDs (look up by `schools.code`, do not hardcode uuids — use a `select id from schools where code = …` subquery as other migrations do).

---

## 10. Recommended RBAC Permission Seed

Insert into `security_permissions` (module_key, page_key, action_key, label, sort_order), then grant to roles in `security_role_permissions`. Follows the exact shape already used in `20260701120000_security_rbac_schema.sql`.

**Module-level:**
- `LIBRARY_SYSTEM / (null) / view` — "View Library System"

**Page-level actions:**

| page_key | actions |
|---|---|
| `dashboard` | `view` |
| `catalog` | `view`, `create`, `edit`, `delete`, `export` |
| `inventory` | `view`, `create`, `edit`, `delete` |
| `borrowing` | `view`, `create` (checkout) |
| `returns` | `view`, `manage` (process return) |
| `overdue` | `view`, `export` |
| `lost-damaged` | `view`, `manage` (mark lost/damaged) |
| `fines` | `view`, `create`, `manage` (settle/void), `approve` (waive) |
| `reports` | `view`, `export` |
| `maintenance` | `view`, `create`, `edit`, `delete` |

> Uses only the existing `SecurityAction` values (`view/create/edit/delete/export/print/approve/reject/void/post/import/manage/audit`). "Process return" → `manage`; "Waive fine" → `approve` (or `void`). **Do not invent new action verbs.**

**Role grants:** grant all `LIBRARY_SYSTEM` permissions to `SUPER_ADMIN` (already auto-granted via the cross-join rule if it re-runs — but this migration runs after, so **explicitly grant** to SUPER_ADMIN, ADMIN, REGISTRAR). Add `('SUPER_ADMIN' gets all), ('REGISTRAR','LIBRARY_SYSTEM'), ('ADMIN','LIBRARY_SYSTEM')` in the role_modules seed pattern.

Also add `LIBRARY_SYSTEM` to `ROLE_PERMISSIONS` in `permissions.config.ts` (frontend fallback) for the same roles — this is a **Phase 2 code change**, not migration.

---

## 11. Cashiering / Accounting Integration

**Recommendation (phased):**

- **Phase 1 (schema):** `library_fines` carries nullable `payment_id → payments(id)`, `or_number text`, and `status` (`PENDING/PAID/WAIVED/CANCELLED`). No behavioral coupling yet.
- **Phase 3 (integration):** when a fine is settled at the cashier, either (a) record a `payments` row (using the existing `or_number`/`amount` shape, `student_id` for student borrowers) and stamp `library_fines.payment_id` + `status='PAID'`; or (b) for employees (no `payments.student_id`), keep manual settlement with `or_number` + `settlement_remarks`.
- Optionally raise a `financial_holds` entry for students with unpaid library fines (reuse existing `financial_holds` table) — **defer to Phase 3.**
- Journal-entry / COA posting is **out of scope** — library fines are minor; treat as cashier collection only unless the school requests GL posting.

**Do not** modify `payments`/`financial_holds` schema in Phase 1. Integration is additive from the library side.

---

## 12. Recommended UI Pages / Components

All pages under `src/features/library/pages/`, lazy-loaded via `AppModuleRenderer`, data via `supabaseCrud`/`dataLoader` (Supabase only, no mock finals). RBAC-gate action buttons with `usePermissions().can/canPage`.

| Page | Key components | Notes |
|---|---|---|
| **Dashboard** | `DashboardKpiCard`/`AppKpiCard`, `AppCard`, `AppTable` | KPIs: total titles, total copies, available, borrowed, overdue, lost/damaged; recent transactions table. |
| **Book Catalog** | `AppTable`, `AppSearchInput`, `AppFilterChip`, `AppModal`, `AppFormField` | Searchable/filterable list; add/edit modal (ISBN, title, author, publisher, year, category, subject, grade levels, status). |
| **Book Inventory / Copies** | `AppTable`, `AppStatusBadge`, `AppModal` | Copies per title; accession/barcode, shelf, condition, copy_status, acquisition cost/date. |
| **Borrowing / Checkout** | `AppAutocompleteSelect` (borrower + copy), `AppFormField`, `AppButton` | Pick borrower (student/employee), available copy, due date, issued by. |
| **Returns** | `AppTable`, `AppModal`, `AppStatusBadge` | Return date, returned condition, computed overdue days + fine estimate, received by. |
| **Overdue** | `AppTable`, `AppFilterChip`, `ExportMenu` | Borrower, book, due date, overdue days, fine estimate. |
| **Lost / Damaged** | `AppTable`, `AppModal`, `AppConfirmDialog` | Mark copy lost/damaged, penalty amount, settlement status. |
| **Reports** | `AppTabs`, `AppTable`, `ExportMenu` | Borrowed, overdue, inventory, lost/damaged, borrower history. |
| **Maintenance** | `AppTabs`, `AppTable`, `AppModal` | Categories, subjects, shelves, fine rules. |

Every page must implement: `AppLoadingState` (loading), `AppErrorState` (error), `AppEmptyState` (empty), `AppToast` (feedback), responsive Tailwind layout, and RBAC-aware buttons.

---

## 13. Borrow / Return Workflow

**Borrow (checkout):**
1. Select borrower (`borrower_type` + resolve `borrower_ref_id`, snapshot name/no).
2. Select one or more **AVAILABLE** copies (`library_book_copies.copy_status='AVAILABLE'`).
3. Set `due_date` (default = checkout + loan period, e.g. 7 days; configurable later).
4. Insert `library_borrow_transactions` (status `BORROWED`) + `library_borrow_transaction_items` (status `BORROWED`).
5. Flip each copy `copy_status → 'BORROWED'`.
6. Guard: require `can('LIBRARY_SYSTEM','create')` / `canPage('LIBRARY_SYSTEM','borrowing','create')`.

**Return:**
1. Open transaction/item; set `return_date`, `returned_condition`.
2. Compute `overdue_days = max(0, return_date − due_date − grace_days)`.
3. If overdue → create `library_fines` (`OVERDUE`, `amount = min(overdue_days × fine_per_day, max_fine)`, `PENDING`).
4. Item `item_status → RETURNED`; copy `copy_status → 'AVAILABLE'` (or `DAMAGED` if damaged on return → raise DAMAGED fine).
5. When all items returned → transaction `status → RETURNED`.
6. Guard: `canPage('LIBRARY_SYSTEM','returns','manage')`.

**Overdue sweep:** a query (or optional scheduled job later) sets items/transactions to `OVERDUE` where `due_date < today` and not returned. Dashboard/overdue page derive live via query — no cron required for Phase 2.

---

## 14. Fine / Penalty Workflow

1. **Assess:** created automatically on overdue return, or manually on Lost/Damaged (`fine_type` `LOST`/`DAMAGED`, `amount` from `library_fine_rules.lost_fee_*` or copy `acquisition_cost`).
2. **Settle (PAID):** cashier records payment; stamp `payment_id`/`or_number`, `status='PAID'`, `settled_date`. (See §11.)
3. **Waive:** `status='WAIVED'` + `waived_reason`; requires `canPage('LIBRARY_SYSTEM','fines','approve')`.
4. **Cancel:** `status='CANCELLED'` (e.g. found book) requires `manage`.
5. Every state change should append a row to `security_access_audit_logs` **only** if it's an access change; for library-domain audit, rely on `updated_by`/`updated_at` (or a future `library_activity_logs`) — **not** the security audit log.

---

## 15. Reports

- **Borrowed Books** — active loans by borrower/date range.
- **Overdue Books** — overdue items, days, estimated fines.
- **Book Inventory** — copies by status/shelf/category; valuation from `acquisition_cost`.
- **Lost / Damaged** — lost/damaged copies + penalty/settlement status.
- **Borrower History** — per-borrower loan/return/fine history.

All exportable via existing `ExportMenu` / `reportExportService.ts`.

---

## 16. What Can Be Implemented Now Safely

| Phase | Work | Risk |
|---|---|---|
| **1** | New `library_*` tables + reference seed + RBAC seed (one migration). Purely additive. | **Very low** — no existing table altered. |
| **2** | Frontend feature + nav + routing + `STSNModule`/`ROLE_PERMISSIONS` + `AppModuleRenderer` wiring, using Supabase data. | **Low** — isolated new module; only shared config files touched additively. |
| **3** | Cashier/`financial_holds` integration, overdue automation, student/guardian read-only "my books". | **Medium** — touches cashier flow; do after 1–2 verified. |

---

## 17. Manual Test Checklist (post-implementation)

- [ ] Migration applies cleanly and is re-runnable (idempotent).
- [ ] All `library_*` tables exist with FKs, indexes, CHECK constraints.
- [ ] Reference seed present; optional demo catalog gated.
- [ ] `security_permissions` has `LIBRARY_SYSTEM` module + page rows; SUPER_ADMIN/ADMIN/REGISTRAR granted.
- [ ] Sidebar shows **Library** only for permitted roles; hidden otherwise.
- [ ] Routes `/library/*` resolve; deep links work; unknown → fallback.
- [ ] Dashboard KPIs compute from Supabase (no mock finals).
- [ ] Catalog CRUD works; ISBN/title validation; empty/loading/error states.
- [ ] Inventory: accession uniqueness enforced; copy status transitions.
- [ ] Checkout flips copy to BORROWED; only AVAILABLE copies selectable.
- [ ] Return computes overdue days + creates fine; copy back to AVAILABLE.
- [ ] Overdue list matches due dates; fine estimates correct.
- [ ] Lost/Damaged marks copy + raises fine.
- [ ] Fine waive/settle gated by `approve`/`manage`; states persist.
- [ ] Reports render + export.
- [ ] Action buttons hidden/disabled per `usePermissions`.
- [ ] `npm run lint` and `npm run build` pass.
- [ ] Existing modules (Accounting, Registrar, Cashier, Books Setup) unaffected.

---

## 18. Risks & Rollback Notes

**Risks**
- **Confusion with `BOOKS_SETUP` (fee packages).** Mitigation: separate `LIBRARY_SYSTEM` key + clear labels ("Library" vs "Books Setup").
- **Polymorphic `borrower_ref_id` (no FK).** Mitigation: enforce `borrower_type` CHECK + validate in app; snapshot borrower name/no so history survives if source record changes.
- **Demo RLS is permissive.** Mitigation: match existing posture now; note "TIGHTEN BEFORE PRODUCTION" — real policies added when the app moves to signed-in sessions.
- **Cashier coupling.** Mitigation: keep Phase 1 schema loose (nullable `payment_id`); integrate in Phase 3 only after cashier flow reviewed.
- **Frontend config edits (`permissions.config.ts`, `navigation.config.ts`, `app-routes.config.ts`, `AppModuleRenderer.tsx`).** Additive only; must not reorder/remove existing entries.

**Rollback**
- **Migration:** since additive, rollback = a paired down-migration `drop table if exists library_* cascade;` + `delete from security_permissions where module_key='LIBRARY_SYSTEM';` + `delete from security_role_permissions` for those permission ids. No existing data affected.
- **Frontend:** revert the feature folder + the additive lines in the 4 config/renderer files. No shared component changes to undo.

---

## 19. Next Phases (as requested)

1. **Phase 1 — Migration only:** create `library_*` schema + seed + RBAC (produces `docs/library/LIBRARY_SYSTEM_PHASE_1_MIGRATION.md`).
2. **Phase 2 — Frontend + RBAC wiring:** pages, sidebar, routes, `STSNModule`/`ROLE_PERMISSIONS`, `AppModuleRenderer`; `npm run lint && npm run build` (produces `docs/library/LIBRARY_SYSTEM_PHASE_2_FRONTEND.md`).
3. **Phase 3 — Integrations & reports polish:** cashier/holds integration, overdue automation, borrower self-service.

*End of audit & plan — no code or database changes were made in this phase.*

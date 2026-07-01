# STSN Connect — Library System: Phase 1 (Migration) — DONE

> **Phase:** 1 of 3 — **Database migration only.** No frontend/config code changed.
> **Date:** 2026-07-01
> **Migration file:** `supabase/migrations/20260701140000_library_system_schema.sql`
> **Follows:** `LIBRARY_SYSTEM_AUDIT_AND_IMPLEMENTATION_PLAN.md` (§7–§11)

---

## 1. What this migration does

Purely **additive** and **idempotent** (safe to re-run). It creates a self-contained
lending Library System — distinct from the existing `BOOKS_SETUP` fee "Book Packages"
feature. **No existing table is altered**; the only writes to existing tables are
additive RBAC seed rows in `security_permissions` / `security_role_permissions`.

### 1.1 New tables (9)

| Table | Purpose |
|---|---|
| `library_book_categories` | Catalog categories (per school; unique `code`) |
| `library_book_subjects` | Subject tags (per school; unique `name`) |
| `library_shelves` | Physical shelf / location (per school; unique `code`) |
| `library_fine_rules` | Overdue / lost fine config |
| `library_books` | Title-level catalog |
| `library_book_copies` | Physical copies / inventory (unique `accession_no`) |
| `library_borrow_transactions` | Checkout header (unique `transaction_no`) |
| `library_borrow_transaction_items` | One row per borrowed copy |
| `library_fines` | Overdue / lost / damaged fines (optional cashier link) |

### 1.2 Conventions matched (verified against `0001_schema.sql`, `0017`, RBAC `20260701120000`)

- `id uuid primary key default gen_random_uuid()`
- `school_id uuid references public.schools(id) on delete set null on update cascade`
- `created_at` / `updated_at timestamptz not null default now()`, `created_by text`
- `is_active boolean not null default true` on reference/catalog tables
- `CHECK` constraints for small stable enums (borrower_type, statuses, condition, etc.)
- `library_touch_updated_at()` trigger fn + per-table `updated_at` trigger
- RLS enabled with a single permissive `*_all_anon_auth` `for all to anon, authenticated`
  policy per table (demo posture — **TIGHTEN BEFORE PRODUCTION**)
- Idempotency via `create table/index if not exists`, `drop trigger/policy if exists`,
  `on conflict do nothing`

### 1.3 Key design decisions

- **`borrower_ref_id` is polymorphic** (`students.id` | `employees.id`, keyed by
  `borrower_type`) → **no hard FK**. `borrower_name` / `borrower_no` snapshotted so
  loan history survives source-record changes.
- **`payment_id uuid references public.payments(id)`** on `library_fines` is nullable —
  schema-only cashier hook; no behavioral coupling until Phase 3.
- `borrower_types` / `book_conditions` are `CHECK` constraints, not tables (few, stable).

### 1.4 Seed data

- **Reference (non-optional), per demo school (STSN + CDSTA):** 7 categories,
  8 subjects, 8 shelves, 1 `Default Overdue Rule`
  (`fine_per_day = 5.00`, `grace_days = 0`, `max_fine = 500.00`, `lost_fee_mode = replacement_cost`).
- **Optional demo catalog (STSN only):** 8 titles + 2 copies each (16 copies).
  Guarded by an `if exists (… isbn like '978-971-0001-%')` early-return so it never
  double-seeds and does not pollute production (isbn is not unique, so `on conflict`
  alone cannot dedupe titles).
- All school IDs resolved via `select id from public.schools where code = …` — no
  hardcoded UUIDs.

### 1.5 RBAC seed

- **Module-level:** `LIBRARY_SYSTEM / (null) / view` (sort 29).
- **Page actions** (sort 800–893): `dashboard` (view); `catalog`
  (view/create/edit/delete/export); `inventory` (view/create/edit/delete);
  `borrowing` (view/create); `returns` (view/manage); `overdue` (view/export);
  `lost-damaged` (view/manage); `fines` (view/create/manage/approve); `reports`
  (view/export); `maintenance` (view/create/edit/delete). Only existing
  `SecurityAction` verbs used.
- **Grants:** `SUPER_ADMIN` (explicit cross-join over `LIBRARY_SYSTEM` perms),
  `ADMIN`, `REGISTRAR` → all `LIBRARY_SYSTEM` permissions.

---

## 2. How to apply

No local `psql` / Supabase CLI in this environment — apply as the project already
does (Supabase SQL editor / your migration runner). The file is re-runnable.

---

## 3. Post-apply verification (SQL spot checks)

```sql
-- 9 tables exist
select table_name from information_schema.tables
where table_schema = 'public' and table_name like 'library_%' order by 1;

-- reference seed present (x2 schools)
select 'categories' k, count(*) from public.library_book_categories
union all select 'subjects', count(*) from public.library_book_subjects
union all select 'shelves', count(*) from public.library_shelves
union all select 'fine_rules', count(*) from public.library_fine_rules;

-- optional demo catalog (STSN): 8 titles / 16 copies
select count(*) titles from public.library_books where isbn like '978-971-0001-%';
select count(*) copies from public.library_book_copies where accession_no like 'STSN-ACC-%';

-- RBAC: module + 28 page rows, granted to 3 roles
select page_key, action_key from public.security_permissions
where module_key = 'LIBRARY_SYSTEM' order by sort_order;
select r.code, count(*) from public.security_role_permissions rp
join public.security_roles r on r.id = rp.role_id
join public.security_permissions p on p.id = rp.permission_id
where p.module_key = 'LIBRARY_SYSTEM' group by r.code;
```

---

## 4. Rollback (all additive — no existing data affected)

```sql
drop table if exists
  public.library_fines,
  public.library_borrow_transaction_items,
  public.library_borrow_transactions,
  public.library_book_copies,
  public.library_books,
  public.library_fine_rules,
  public.library_shelves,
  public.library_book_subjects,
  public.library_book_categories cascade;

delete from public.security_role_permissions rp
using public.security_permissions p
where rp.permission_id = p.id and p.module_key = 'LIBRARY_SYSTEM';
delete from public.security_permissions where module_key = 'LIBRARY_SYSTEM';
drop function if exists public.library_touch_updated_at();
```

---

## 5. Next — Phase 2 (frontend + RBAC wiring)

Additive edits to 4 config/renderer files + a new `src/features/library/` feature:

1. `src/config/permissions.config.ts` — add `LIBRARY_SYSTEM` to `STSNModule` union,
   `MODULE_LABELS` (`"Library System"`), and `ROLE_PERMISSIONS`
   (super-admin/admin/registrar).
2. `src/config/navigation.config.ts` — top-level `LIBRARY_SYSTEM` nav group (§6 of the plan).
3. `src/config/app-routes.config.ts` — module↔path (`/library`, `segments[0] === "library"`).
4. `src/components/layout/AppModuleRenderer.tsx` — add to `RENDERED_MODULE_IDS`
   + `lazy()` import + conditional block.
5. `src/features/library/pages/*` — Dashboard, Catalog, Inventory, Borrowing,
   Returns, Overdue, Lost/Damaged, Reports, Maintenance (Supabase data via
   `supabaseCrud`/`dataLoader`; RBAC-gated buttons).

Then `npm run lint` (`tsc --noEmit`) + `npm run build`.
```
```

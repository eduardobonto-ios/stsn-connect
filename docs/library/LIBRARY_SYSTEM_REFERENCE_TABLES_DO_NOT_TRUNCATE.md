# STSN Connect - Library System Reference Tables to Preserve

> **Date:** 2026-07-01  
> **Scope:** Library System reference/master data review for safe reset, reseed, or cleanup work.

## Purpose

This file identifies the **essential reference tables that should not be truncated**
when resetting demo data, reseeding, or cleaning Library System records.

The basis is the migration
`supabase/migrations/20260701140000_library_system_schema.sql`, which separates:

- **Reference / maintenance tables** -> reusable master data
- **Catalog / transactional tables** -> operational library records

## Do Not Truncate - Essential Library Reference Tables

These are the core reusable Library System master-data tables:

| Table | Why it should be preserved |
|---|---|
| `public.library_book_categories` | Category master list used by catalog records and seeded per school. |
| `public.library_book_subjects` | Subject/tag master list used by catalog classification and filtering. |
| `public.library_shelves` | Physical shelf/location master data used by inventory copies. |
| `public.library_fine_rules` | Fine computation/configuration rules used by overdue/lost/damaged flows. |

## Also Preserve - Shared Existing Reference Tables

These are not owned by the Library migration, but the Library System depends on them
and they also should **not** be truncated as part of any library reset:

| Table | Why it should be preserved |
|---|---|
| `public.schools` | Every library table is school-scoped through `school_id`. |
| `public.students` | Borrower source for student transactions. |
| `public.employees` | Borrower source for employee/faculty transactions. |
| `public.security_permissions` | Contains seeded `LIBRARY_SYSTEM` permission rows. |
| `public.security_role_permissions` | Contains seeded role grants for `LIBRARY_SYSTEM`. |
| `public.security_roles` | Required by the RBAC grant seed. |
| `public.payments` | Optional settlement link target for `library_fines.payment_id`. |

## Usually Safe to Reset or Rebuild

These are **not** reference tables. They are operational or demo-driven records and
should be evaluated separately if you need to clear activity data:

| Table | Notes |
|---|---|
| `public.library_books` | Catalog/title records; depends on reference tables above. |
| `public.library_book_copies` | Physical inventory records; depends on books and shelves. |
| `public.library_borrow_transactions` | Borrowing header transactions. |
| `public.library_borrow_transaction_items` | Borrowing line items. |
| `public.library_fines` | Assessed fine transactions. |

## Practical Rule

If the goal is to clear **activity**, preserve the reference tables and only review the
transactional tables.

If the goal is to re-run or maintain the migration safely, keep all four Library
reference tables intact:

1. `library_book_categories`
2. `library_book_subjects`
3. `library_shelves`
4. `library_fine_rules`

## Summary

For the Library System, the essential **do-not-truncate** reference tables are:

- `public.library_book_categories`
- `public.library_book_subjects`
- `public.library_shelves`
- `public.library_fine_rules`

If you want, this doc can also be extended into a broader **safe truncate order**
guide for the whole library module.

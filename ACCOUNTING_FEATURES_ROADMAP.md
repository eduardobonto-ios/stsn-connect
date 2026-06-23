# Accounting Module — Feature Roadmap

Tracks the implementation of the 14 accounting features to be added as an expandable sidebar submenu under **Accounting**.

---

## Build Order

Features are sequenced by dependency. Foundation features must come first.

### Phase 1 — Foundation
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | **Chart of Accounts** | ✅ Done | GL account structure (code, name, type, normal balance). Tree view + DataTables flat search. CRUD wired. |
| 2 | **Cost Centers** | ✅ Done | Departmental/unit segments (Department, Program, Project, Administrative) with GL account link. CRUD wired. DataTables with search/filter. |

### Phase 2 — Core Double-Entry
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 3 | **Journal Entries** | ✅ Done | Debit/credit postings referencing Chart of Accounts and Cost Centers. Draft/Post/Void workflow. DataTables list + line-item editor modal. |
| 4 | **General Ledger** | 🟡 Partial | Per-student ledger exists. Needs full GL view by account code with journal entry source. |

### Phase 3 — Sub-ledgers & Operations
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 5 | **Supplier Management** | ✅ Done | Vendor master with DataTables list and standard add/edit modal. Prerequisite for Purchase Invoice and AP Aging. |
| 6 | **Item / Product Management** | ✅ Done | Product/service catalog with GL mapping. DataTables list and standard add/edit modal. |
| 7 | **Sales Invoice** | ✅ Done | Receivable invoices posted to AR and Revenue accounts. DataTables list and standard add/edit modal. |
| 8 | **Purchase Invoice** | ✅ Done | Payable invoices posted to AP and Expense accounts. DataTables list and standard add/edit modal. |

### Phase 4 — Aging Reports
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 9 | **Accounts Receivable with Aging** | 🟡 Partial | Receivables Watchlist exists. Needs 30/60/90/120+ day aging buckets and invoice drill-down. |
| 10 | **Accounts Payable with Aging** | 🔲 Todo | AP counterpart — aging by vendor and due date. Requires Purchase Invoice. |

### Phase 5 — Financial Statements
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 11 | **Trial Balance Report** | 🔲 Todo | Debit/credit totals by GL account, proving books balance. Derived from Journal Entries. |
| 12 | **Balance Sheet Report** | 🔲 Todo | Assets = Liabilities + Equity snapshot. Derived from Trial Balance. |
| 13 | **Income Statement Report** | 🔲 Todo | Revenue − Expenses = Net Income for a period. Derived from Trial Balance. |
| 14 | **Cash Flow Report** | 🔲 Todo | Operating/Investing/Financing cash flows. Derived from GL and statements. |

---

## Status Legend
- 🔲 Todo — not started
- 🟡 Partial — exists but incomplete
- ✅ Done — fully implemented

---

## UI Structure

All features live under an **expandable Accounting submenu** in the sidebar:

```
▶ Accounting                       (click to expand)
  ├── Dashboard                    (existing)
  ├── Ledger                       (existing)
  ├── Discounts                    (existing)
  ├── Billing & Assessment         (existing)
  ├── Financial Holds              (existing)
  ├── ── New Features ──
  ├── Chart of Accounts            Phase 1
  ├── Cost Centers                 Phase 1
  ├── Journal Entries              Phase 2
  ├── General Ledger (Full)        Phase 2
  ├── Supplier Management          Phase 3
  ├── Item / Product Management    Phase 3
  ├── Sales Invoice                Phase 3
  ├── Purchase Invoice             Phase 3
  ├── AR Summary with Aging        Phase 4
  ├── AP Summary with Aging        Phase 4
  └── Reports ▸
       ├── Trial Balance
       ├── Balance Sheet
       ├── Income Statement
       └── Cash Flow
```

---

## Implementation Notes

- **Navigation change**: Add `children` support to `NavItem` in [src/config/navigation.config.ts](src/config/navigation.config.ts). Sidebar renders a collapsible group when `children` is present.
- **Routing**: Each sub-page is a component rendered inside the existing `ACCOUNTING` module slot in [src/App.tsx](src/App.tsx), driven by a `subPage` state.
- **Types**: New entities (Account, CostCenter, JournalEntry, Supplier, Item, Invoice, etc.) to be added to [src/types/index.ts](src/types/index.ts).
- **Store**: New slices for each entity to be added to [src/services/store.ts](src/services/store.ts).

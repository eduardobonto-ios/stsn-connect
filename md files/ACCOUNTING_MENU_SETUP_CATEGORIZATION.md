# Accounting Menu Setup Categorization

This note reviews the current **Accounting** sidebar submenu and the existing **Core Setup > Accounting Setup** configuration group. It is intended as a navigation and information-architecture guide only.

## Current Accounting Sidebar

The Accounting module currently exposes these submenu items from `src/config/navigation.config.ts`:

| Current item | Current purpose | Recommended category |
|---|---|---|
| Dashboard | KPIs and receivables watchlist | Overview |
| Student Ledger | Per-student debit/credit ledger | Student Accounts |
| Discounts | Discount types and approval requests | Student Accounts / Setup overlap |
| Billing & Assessment | Assessment approval and summary | Student Accounts |
| Financial Holds | Student financial hold management | Student Accounts |
| Chart of Accounts | GL account codes and hierarchy | Accounting Setup |
| Cost Centers | Departmental cost segmentation | Accounting Setup |
| Journal Entries | Double-entry bookkeeping postings | General Ledger Operations |
| Supplier Management | Vendor and supplier master list | Accounting Setup |
| Item / Product Mgmt | Product and service catalog | Accounting Setup |
| Sales Invoice | Customer sales invoices / AR | AR Operations |
| Purchase Invoice | Vendor purchase invoices / AP | AP Operations |
| AR with Aging | Receivables aging report | Reports |
| AP with Aging | Payables aging report | Reports |
| Trial Balance | Debit/credit totals by GL account | Reports |
| Balance Sheet | Assets, liabilities, equity snapshot | Reports |
| Income Statement | Revenue, expenses, net income | Reports |
| Cash Flow Report | Operating, investing, financing flows | Reports |

## Recommended Accounting Submenu Structure

The Accounting menu can be easier to scan if setup/configuration pages are grouped under an **Accounting Setup** child section, while transactional work and reports remain visible in their own groups.

```text
Accounting
  Dashboard

  Student Accounts
    Student Ledger
    Billing & Assessment
    Discounts
    Financial Holds

  Accounting Setup
    Chart of Accounts
    Cost Centers
    Supplier Management
    Item / Product Mgmt
    Fee Categories
    Fee Items
    Payment Terms
    Payment Methods
    Accounting Periods
    Official Receipt Series
    Collection Types
    Refund Reasons
    Void Reasons

  General Ledger
    Journal Entries

  Accounts Receivable
    Sales Invoice
    AR with Aging

  Accounts Payable
    Purchase Invoice
    AP with Aging

  Financial Reports
    Trial Balance
    Balance Sheet
    Income Statement
    Cash Flow Report
```

## Items That Belong Under Accounting Setup

These are configuration or master-data screens because they define reusable records used by accounting transactions:

| Item | Why it is setup/config |
|---|---|
| Chart of Accounts | Defines the GL account structure used by journals, invoices, reports, and mappings. |
| Cost Centers | Defines departmental or program segments for reporting and journal attribution. |
| Supplier Management | Vendor master data used by purchase invoices and AP aging. |
| Item / Product Mgmt | Product/service catalog and GL mappings used by sales and purchase invoices. |
| Fee Categories | Core fee grouping such as tuition, miscellaneous, laboratory, and similar billing buckets. |
| Fee Items | Specific assessable fee lines, amounts, and year-level mappings. |
| Payment Terms | Defines cash/installment structures and downpayment rules. |
| Payment Methods | Defines accepted collection channels such as cash, digital, bank, and card. |
| Accounting Periods | Defines fiscal/academic periods and period close status. |
| Official Receipt Series | Controls OR prefix, current serial, and year numbering. |
| Collection Types | Defines collection classifications such as tuition, miscellaneous, penalty, or refund. |
| Refund Reasons | Standard reference list for refund processing. |
| Void Reasons | Standard reference list for voiding receipts. |

## Core Setup Accounting Items Found

`src/features/core-setup/pages/CoreSetupModulePage.tsx` already has an **Accounting Setup** group with these categories:

| Core Setup category | Recommended ownership |
|---|---|
| Fee Categories | Move or deep-link under Accounting Setup. |
| Fee Items | Move or deep-link under Accounting Setup. |
| Payment Terms | Move or deep-link under Accounting Setup. |
| Payment Methods | Move or deep-link under Accounting Setup. |
| Chart of Accounts | Align with the dedicated Accounting page; avoid duplicate maintenance surfaces. |
| Accounting Periods | Move or deep-link under Accounting Setup. |
| Official Receipt Series | Move or deep-link under Accounting Setup, also relevant to Cashiering. |
| Collection Types | Move or deep-link under Accounting Setup, also relevant to Cashiering. |
| Refund Reasons | Move or deep-link under Accounting Setup, also relevant to Cashiering. |
| Void Reasons | Move or deep-link under Accounting Setup, also relevant to Cashiering. |

## Duplicate / Overlap Notes

- **Chart of Accounts** exists both as a dedicated Accounting page and as a Core Setup category. Prefer one source of truth. The dedicated Accounting page appears better suited for hierarchy, GL-specific fields, and accounting workflows.
- **Discounts** is partly operational and partly setup. The discount approval queue belongs under Student Accounts, while discount type maintenance would fit under Accounting Setup if split later.
- **Official Receipt Series**, **Collection Types**, **Refund Reasons**, and **Void Reasons** are accounting configuration, but they also support Cashiering. They can live under Accounting Setup while Cashiering consumes them.
- **Supplier Management** and **Item / Product Mgmt** are master-data pages, even though they currently sit beside transactional pages. They should be grouped with setup/configuration.

## Suggested Implementation Approach

1. Add grouped children support inside the Accounting navigation model, or add visual section headers if nested children are not yet supported.
2. Keep existing route ids where possible to avoid breaking `AccountingSubPageRouter`.
3. For Core Setup accounting categories, either:
   - expose them as Accounting Setup children that route into Core Setup with a selected category, or
   - move their maintenance UI into Accounting and leave Core Setup as a cross-module admin index.
4. Do not maintain Chart of Accounts in two separate CRUD surfaces. Pick the dedicated Accounting page as the primary GL setup page.

## Recommended Priority

| Priority | Change |
|---|---|
| 1 | Group current Accounting setup/master-data items: Chart of Accounts, Cost Centers, Supplier Management, Item / Product Mgmt. |
| 2 | Group report pages under Financial Reports. |
| 3 | Group AR/AP transaction pages separately from AR/AP aging reports. |
| 4 | Decide whether Core Setup accounting categories should be moved into Accounting Setup or linked from it. |
| 5 | Split Discounts into operational approvals and discount type setup only if the product needs a clearer workflow boundary. |

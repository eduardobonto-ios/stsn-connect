# Core Setup Wiring Tracker

Tracks which Core Setup items currently drive module behavior versus items that are maintained in Core Setup only.

## Wired

| Core Setup item | Current usage |
| --- | --- |
| Book Setup | Managed through the Library section in Core Setup; consumed by Registrar, Accounting approval review, and Cashiering receipt/payment views. |
| Chart of Accounts | Accounting uses the dedicated `chart_of_accounts` table/page across journal entries, suppliers, items, invoices, and financial statements. Note: this is separate from generic `setup_items.chart_of_accounts`. |
| Fee Categories | Used by Registrar assessment computation. |
| Fee Items | Used by Registrar assessment computation. |
| Payment Methods | Used by Cashiering payment collection dropdown. |
| Payment Remittance Terms | Used by Cashiering term/purpose dropdown. |
| Payment Terms | Used by Accounting Supplier Management payment terms dropdown, with existing AP terms preserved as fallback choices. |
| Rooms / Classrooms | Scheduling uses the dedicated `rooms` store/table for room dropdowns. Note: this is separate from generic `setup_items.rooms`. |
| School Years | Used by Scheduling, Accounting, and Book Setup filters/defaults. |
| Semesters / Terms | Used by Scheduling, Class Sectioning, and Accounting. |
| Student Ledger Actions | Accounting owns ledger review, adjustments, discounts, holds, SOA, ledger print, and receipt viewing. Cashiering owns payment collection/posting against Accounting-approved assessments. |
| Year Levels | Used by Dashboard, Curriculum, Registrar, Scheduling, and Class Sectioning. |

## Partially Wired Or Mismatched

| Core Setup item | Status |
| --- | --- |
| Chart of Accounts | Core Setup has a generic setup item, but Accounting uses the dedicated `chart_of_accounts` table. |
| Rooms / Classrooms | Core Setup has a generic setup item, but Scheduling uses the dedicated `rooms` table/store. |

## Not Yet Wired Outside Core Setup

| Core Setup item |
| --- |
| Academic Categories |
| Academic Levels |
| Accounting Periods |
| Admission Types |
| Buildings |
| Campuses |
| Civil Statuses |
| Clearance Workflow |
| Collection Types |
| Departments |
| Document Types |
| Employment Types |
| Enrollment Approval Workflow |
| Enrollment Requirements |
| Faculty Ranks |
| Holiday Maintenance |
| ID Card Templates |
| Nationalities |
| Official Receipt Series |
| Permissions |
| Refund Reasons |
| Religions |
| Roles |
| Room Types |
| Student Status |
| Student Types |
| Time Slots |
| Void Reasons |

# STSN Connect — Cashiering Module UI/UX Implementation Instructions for Codex / Claude

## Objective

Redesign the existing Cashiering module into a compact, responsive master-detail workspace while preserving its current data sources, routes, permissions, posting rules, approval workflow, receipt behavior, reports, and Thereseian Connect visual identity.

The requested tabs are:

1. Payment Queue
2. Other Payments
3. Cash Vouchers
4. Collection History
5. Reports

Do not add an Overview tab in this change. It was only an optional suggestion in the design discussion and is not an existing cashier route.

## Scope Lock

- Change only the Cashiering module and cashier-specific supporting components/tests needed for this redesign.
- Do not make unrelated global UI changes.
- Do not alter Accounting, Registrar, Books, HR, Payroll, portals, navigation, authentication, or unrelated reports.
- Do not change the existing cashier route slugs: `queue`, `other-payments`, `vouchers`, `history`, and `reports`.
- Preserve `onSubPageChange`, direct URL navigation, browser navigation, academic-unit scope, school scope, and access-denied behavior.
- Preserve every existing `canPage` and `hasPageAccess` check. Hidden or unavailable actions must remain unavailable.
- Do not add mock records, fake queue timestamps, fake cashier assignments, fake audit events, or hardcoded students/payments/vouchers.
- Do not create a database migration for this UI redesign. If a requested display value is not represented by the current types or store, omit it or label it as unavailable; never synthesize it.
- Do not replace Supabase-backed or store-backed behavior with local-only demo data.
- Do not remove existing report definitions or export formats.
- Do not implement direct payment deletion or reversal. Cashiers may only submit the existing void request for approval.

## Confirmed Current Implementation

Before editing, inspect these files and reuse their actual behavior:

- `src/features/cashier/pages/CashierModulePage.tsx`
- `src/services/store.ts`
- `src/services/dataLoader.ts`
- `src/types/index.ts`
- `src/config/cashier.config.ts`
- `src/config/permissions.config.ts`
- `src/config/app-routes.config.ts`
- `src/components/ModalPreviews.tsx`
- `src/components/common/DrilldownDrawer.tsx`
- `src/components/common/AppTabs.tsx`
- `src/components/common/AppActionToolbar.tsx`
- `src/components/common/AppSearchInput.tsx`
- `src/components/common/AppSelect.tsx`
- `src/components/common/AppInput.tsx`
- `src/components/common/AppStatusBadge.tsx`
- `src/components/common/AppTable.tsx`
- `src/components/common/PersonIdentityCell.tsx`

Important existing rules:

- Only assessments with `approvalStatus === "Approved for Payment"` and a positive balance belong in the collectible queue.
- Queue payments must keep their explicit `assessmentId`.
- `AR` other payments reduce an assessment balance using the current store rule; `OR` payments are standalone and do not reduce an assessment.
- Official receipt numbers must remain unique. Queue collections still require a BIR OR number; Other Payments retains its current optional-OR/internal-reference behavior unless business requirements are separately changed.
- Cash voucher statuses remain the canonical values `Pending Approval`, `Approved`, `Rejected`, and `Released`.
- Voucher approval/rejection/release and payment void permissions remain unchanged.
- Receipt and voucher previews continue to use the existing preview components.
- The current reports and export service must remain functional.

## Target Component Structure

Refactor the current oversized page into focused cashier components without moving business logic into generic global components unnecessarily. A suitable structure is:

```text
src/features/cashier/
  components/
    CashieringTabs.tsx
    CashieringToolbar.tsx
    CashieringSummaryStrip.tsx
    PaymentQueueView.tsx
    QueueListItem.tsx
    SelectedStudentPanel.tsx
    PaymentDrawer.tsx
    PaymentSuccessView.tsx
    OtherPaymentsView.tsx
    OtherPaymentDrawer.tsx
    CashVouchersView.tsx
    CashVoucherDrawer.tsx
    CollectionHistoryView.tsx
    TransactionDetailDrawer.tsx
    CashierReportsView.tsx
    CashierDrawerShell.tsx
  pages/
    CashierModulePage.tsx
```

This exact split is not mandatory, but `CashierModulePage.tsx` should become an orchestration shell rather than continue containing all tab markup and every modal. Keep types/helpers close to the cashier feature when they are not reusable elsewhere.

Reuse the existing shared controls and tokens before creating a new component. Extend `DrilldownDrawer` only if needed to support a cashier-specific width and a sticky footer, and ensure the change remains backward compatible for its existing consumers.

## Shared Cashiering Shell

### Header and summary

- Keep `ModulePageHeader` and the current Cashiering Office identity.
- Place the tab bar immediately after the header, followed by a compact four-metric summary strip so no KPI is clipped.
- Use these metrics from real scoped data:
  - Waiting in queue: number of approved assessments with positive balance.
  - Total balance due: sum of the currently scoped collectible queue balances.
  - Transactions today: count of scoped payments dated today.
  - Amount collected today: sum of scoped payments dated today.
- Do not show a metric based on data that does not exist, such as average wait time.
- Use the existing KPI/card visual language, but make the strip compact enough for cashier workflow.

### Tabs

- Use the existing `AppTabs` pattern or an equivalent accessible tab list.
- Preserve the current tab order and route values.
- Show the real queue count on Payment Queue and the real pending-approval count on Cash Vouchers.
- Render only tabs allowed by `pageAccessByTab`.
- The tabs must scroll horizontally at narrow widths instead of wrapping into a broken layout.
- Switching tabs must update the route through `onSubPageChange` and clear tab-specific transient selections/drawers where appropriate.

### Toolbar

- Move search and filters below the tabs into a consistent toolbar rather than placing search inside the tab row.
- Search placeholder and matching behavior must suit the active tab:
  - Queue: student name or student number.
  - Other Payments: student name, student number, OR number, or category.
  - Vouchers: voucher number, payee, category, or reference.
  - History: OR number, payer/student, reference/remarks, or transaction category.
  - Reports: retain the report selector and date range controls.
- Add only filters that can be computed from current data. Useful supported filters include academic level/year, payment term, payment method, transaction type, voucher status, date range, and cashier parsed from existing remarks.
- `Refresh Queue` may re-evaluate current scoped store data, but must not pretend to make a network request if no refresh API exists.
- Do not add a nonfunctional `Next Student`, `Email`, or `Download Receipt` button.

## Payment Queue

### Desktop layout

- Replace the tall full-width assessment cards with a compact master-detail layout.
- Use approximately 60–65% width for the queue and 35–40% for the selected-student preview.
- Queue and preview should fit in the available viewport; the preview becomes sticky only where the application shell permits it without covering the header or tabs.
- Selecting a queue row updates the right-side preview. Selection alone must not post a payment.
- Auto-select the first visible collectible item when appropriate, but handle an empty result safely.
- When filters remove the selected item, select the first remaining item or clear the selection.

### Queue rows

Keep each row compact and show only real values:

- Student identity and student number.
- Academic line (grade/course, section when available).
- School year.
- Payment term.
- Balance due.
- Current assessment approval status.
- Book-package indicator when a real package exists.

Do not show waiting duration, assigned cashier, lock owner, or processing status because these are not represented by the current model. Use a clear selected state: brand-colored left border, subtle background, visible focus state, and `aria-selected` where appropriate.

Keep non-collectible assessments in a compact, clearly separated read-only “Awaiting Accounting Approval” section. They must never expose a collection action.

### Selected-student preview

Show:

- Student name and number.
- Academic context and school year.
- Net assessment (`totalAmount - discountAmount`).
- Amount already paid, derived as `max(0, net assessment - current balance)`.
- Discount.
- Current balance due.
- Collapsed fee breakdown from `assessment.fees`.
- Collapsed book-package details only when `booksAvailed` and a real package can be resolved.
- A permission-gated primary action labelled `Collect {formatted balance}`.

### Payment drawer

- Replace the centered Collect Payment `AppModal` with a full-height right-side drawer.
- Desktop width should be approximately 520–620px, laptop width no more than half the viewport, and tablet/mobile width should become full-screen.
- Keep the queue visible on desktop while the drawer is open. On small screens, the drawer may cover the page.
- Use a scrollable body and sticky footer so the actions are always visible.
- Drawer sections:
  1. Student summary.
  2. Read-only account summary.
  3. Collapsible fee/book/previous-payment details using real records only.
  4. Payment form.
  5. Validation/confirmation area.

Payment form order:

1. Payment term/purpose.
2. Amount to collect.
3. Payment method.
4. Amount received for Cash only.
5. Calculated change for Cash only.
6. Reference number for non-cash methods or when supplied.
7. Official receipt number.
8. Notes, if retained separately in component state and safely appended to the current remarks format.

Rules:

- `amountReceived` and `change` are transient UI values only; do not claim they are persisted or show them later in History.
- Disable submit when cash received is lower than the amount to collect.
- Require a reference number for non-cash methods only if that rule is already enforced by configured behavior; otherwise make it optional and visibly contextual.
- Prevent zero/negative payments.
- Prevent collection amounts above the outstanding balance unless an explicit confirmation is shown. The posted amount must still follow the existing store behavior.
- For partial payments, clearly show the remaining balance before confirmation.
- Preserve OR uniqueness validation and `canCollectPayment` checks.
- Prevent double submission with an `isSubmitting` guard and disabled primary button.
- Footer actions: Cancel and `Collect {formatted amount}`. Do not introduce “Save as Pending” because no pending-payment record exists.
- Escape closes the drawer only when a submission is not in progress; warn before discarding a dirty form.

### Success state

After a successful post, replace the drawer form with a success state showing only known values:

- Official receipt number.
- Amount paid.
- Remaining balance.
- Print/preview receipt.
- Process next student.
- Close.

“Process next student” should select the next item in the current filtered queue after store state updates. Do not add Email Receipt until a real email service exists.

### Keyboard support

Add cashier-scoped shortcuts without conflicting with editable controls:

- `/` focuses queue search when focus is not already in an input/textarea/select.
- Arrow keys or Enter may select the focused queue item using accessible list behavior.
- `Ctrl/Cmd + Enter` submits only when the payment drawer is open, valid, and the cashier has permission.
- `Escape` closes the active cashier drawer/dialog according to the dirty-form rule.

## Other Payments

Use a payer-and-item workflow, but stay within the current data model.

### Main view

- Left/main area: searchable configured categories from `setupData.other_payment_categories`, plus a dense recent Other Payments table.
- Right preview or drawer trigger: the current collection being assembled.
- Keep the current `AR` versus `OR` distinction visible and explain its real effect:
  - `AR`: applies to the student’s current assessment according to the existing store behavior.
  - `OR`: standalone collection and does not affect an assessment balance.
- Current schema requires a student payer. Do not add employee, guardian, guest, or external payer choices without a separately approved schema/business change.
- Allow selection of one configured category and a collection amount, matching the current `Payment` model. Do not fake a durable multi-line cart or quantities in `remarks`.

### Other-payment drawer

Replace the centered Other Payments modal with the same drawer shell used by queue collection, adapted to this workflow:

1. AR/OR selector.
2. Student search and selected identity.
3. Category or remittance term, based on AR/OR.
4. Amount.
5. Payment method.
6. Cash amount received and transient change.
7. OR number using the existing required/optional rule.
8. Remarks.
9. Sticky footer with Cancel and `Collect {formatted amount}`.

Keep the existing validations, permission check, transaction fields, balance-link behavior, receipt preview, and duplicate-OR protection. Add double-submit protection and dirty-form close confirmation.

### Recent table

Show date/time, OR number, student identity, AR/OR type, category/term, method, amount, and row action menu. Row actions should expose only currently supported actions such as view/print receipt.

## Cash Vouchers

This tab is validation-oriented, not a student assessment layout.

### Main table

Use a dense responsive table with:

- Voucher number.
- Payee.
- Category/purpose.
- Amount.
- Requested date.
- Status.
- Requester/approver/releaser when those values exist.
- A compact action menu or permission-gated primary row action.

Supported filters: search, status, category, and date range. Use existing canonical status values. It is acceptable to display friendlier labels (`Pending Approval` as “For Approval” and `Approved` as “Ready for Release”) only if the underlying stored value and workflow checks remain unchanged.

### Voucher drawer

Replace create/review/release centered modals with a right-side voucher drawer or reuse the drawer for the selected voucher and invoke a small confirmation dialog only for irreversible decisions.

The drawer should show only available data:

- Voucher number.
- Payee type/name/student number when applicable.
- Category and purpose.
- Amount.
- Requester and requested date.
- Approval/rejection details.
- Release details/reference when available.
- Status timeline derived only from real timestamps/status fields.
- Existing voucher preview action.

Permission-gated actions:

- Create request: `canCreateVoucher`.
- Approve: `canApproveVoucher`.
- Reject: `canRejectVoucher`, with required remarks.
- Release: `canReleaseVoucher`, only from canonical `Approved` status.

Release confirmation may require the cashier to affirm that ID/signature checks were completed, but do not store or later display those affirmations because the current schema has no durable verification fields. Clearly treat them as confirmation controls, not audit records. Supporting-document lists, voiding, drafts, holds, and extra statuses must not be fabricated.

Preserve the current approval-workflow calls, notifications, database writes, and status transitions exactly.

## Collection History

### Summary and filters

- Use a compact history-only summary based on the filtered/current scoped payment records: total collected, cash total, non-cash total, and transaction count.
- Provide quick date filters: Today, This Week, This Month, and Custom Range.
- Provide supported filters for payment method, cashier, transaction type (AR/OR), and category/term.
- Search across OR number, student name/number, payment category, term, and remarks/reference.

### Table

Use a dense table, not cards. Columns should include:

- Date/time.
- OR number.
- Payer/student identity.
- Type/category.
- Payment method.
- Amount.
- Void-request status when a related request exists.
- Row action menu.

Clicking a row opens the detail drawer. Preserve pagination and empty states.

### Transaction detail drawer

Show only data supported by the current models:

- Receipt/OR number.
- Date/time.
- Cashier name parsed using the existing remarks convention.
- Student identity and academic context.
- Transaction type and category/term.
- Payment method.
- Amount paid.
- Linked assessment and current remaining balance when available.
- Remarks/reference.
- Related void request and its real request/review events.

Actions:

- Preview/reprint receipt.
- Submit void request when `canVoidPayment` allows it and no request already exists.
- View the real void approval status.

Do not show amount received/change because they are not persisted. Do not add Email, Download, or direct Reverse/Void actions without backend support. Keep the existing typed confirmation and reason requirements for void requests.

## Reports

- Keep all existing cashier report options, columns, date filters, print, CSV, Excel, and PDF exports.
- Move the existing report UI into a focused cashier report view if the page is decomposed.
- Apply the same shell, toolbar, input, table, empty-state, and responsive styles as the other tabs.
- Do not change report calculation semantics as part of the UI redesign.
- Verify that all exports still use the exact currently filtered report rows.

## Responsive Behavior

- Desktop: queue/list or table plus sticky preview; transaction actions open in a 520–620px drawer.
- Laptop: preserve the split view but allow a narrower preview; drawer may use up to 50% of the viewport.
- Tablet: lists/tables take full width; drawer covers the viewport or opens as a full-width panel.
- Mobile: queue rows become compact stacked rows; selecting/collecting uses a full-screen drawer workflow; tables may scroll horizontally with key identity/amount/actions kept understandable.
- No horizontal page overflow, clipped KPIs, hidden sticky actions, or nested scroll traps.
- Respect safe viewport height using `100dvh` where appropriate.

## Visual and Accessibility Rules

- Keep the current brown/cream/gold application identity and shared CSS variables.
- Use cream/gold sparingly for selection and emphasis, not around every container.
- Keep green for success/released/approved outcomes, amber for pending/action-needed states, and red for destructive/rejected/error states.
- Use the established 8/12/16/24px spacing rhythm and moderate 8–12px radii.
- Monetary values should be prominent in summaries and drawers, not oversized in every row.
- Use the shared inputs, selects, buttons, tabs, status badges, person identity cells, tables, dialogs, and empty/loading/error states.
- Every icon-only action needs an accessible label.
- Drawers must trap focus, restore focus on close, close via Escape under the dirty-form rule, and expose dialog semantics.
- Tabs, lists, menus, disclosure sections, error messages, and validation must be keyboard and screen-reader usable.
- Do not rely on color alone for status or selection.

## State and Safety Requirements

- Keep independent state per tab: search, filters, selection, drawer mode, and form values.
- Reset form errors when the related field changes.
- Revalidate records against current scoped store data immediately before posting.
- Disable actions while posting or transitioning state.
- Avoid stale selected records after school, academic unit, route, filter, or store updates.
- Preserve all current duplicate OR/voucher-number validation.
- Never allow a UI-only status to bypass a canonical workflow check.
- Do not parse new business-critical values from free-text remarks. Existing cashier-name/reference parsing may continue for backward compatibility.

## Implementation Order

1. Inventory and capture current Cashiering behavior, permissions, routes, and report outputs.
2. Add focused cashier-specific types/helpers and the shared drawer shell.
3. Refactor the header, tabs, summary strip, and contextual toolbar.
4. Implement Payment Queue master-detail selection and the payment drawer.
5. Implement the Payment success state and next-student flow.
6. Convert Other Payments to the adapted drawer workflow and dense recent table.
7. Convert Cash Vouchers to the table plus validation/review/release drawer.
8. Convert Collection History to the filterable table plus detail drawer.
9. Move Reports into the shared cashier shell without changing calculations.
10. Add responsive, keyboard, focus, dirty-form, and double-submit behavior.
11. Add tests, run verification, and manually review each permission profile and breakpoint.

## Required Tests

Add focused Cashiering coverage, preferably in `tests/e2e/cashier.spec.ts`, using existing authentication and navigation helpers. Do not hardcode brittle generated IDs.

Cover at minimum:

1. Cashier sees only permitted cashier tabs/actions.
2. Direct route navigation selects the matching tab.
3. Queue shows only approved assessments with positive balances.
4. Search/filter changes the queue and safely updates selection.
5. Selecting a queue row updates the preview without posting.
6. Collect action opens the drawer with the correct assessment and amount.
7. Required OR, duplicate OR, invalid amount, partial payment, overpayment confirmation, and cash-received validation.
8. A valid payment posts once, updates the balance, shows success, and can open receipt preview.
9. Double activation cannot create duplicate payments.
10. Awaiting-approval assessments remain read-only.
11. Other Payments preserves AR versus OR balance behavior and permission checks.
12. Voucher create/approve/reject/release actions appear only with the matching permissions and valid status.
13. History filters/search and detail drawer show the correct real payment/void data.
14. Void request requires a reason/confirmation and does not directly delete/reverse payment.
15. Existing cashier reports and all export actions remain available.
16. Keyboard and drawer focus behavior works.
17. Desktop, tablet, and mobile layouts do not clip the footer or create page overflow.

Also run:

```text
npm run lint
npm run build
npm run test:e2e -- tests/e2e/cashier.spec.ts
```

If existing test data is insufficient for a destructive posting test, use the repository's existing safe mutation-test conventions. Do not add production records or truncate tables.

## Acceptance Criteria

The work is complete only when:

- All five existing cashier tabs still route and render correctly.
- The Payment Queue is compact master-detail rather than large full-width cards.
- Collect Payment and Other Payment use responsive full-height drawers with sticky actions.
- Cash Vouchers uses a validation-oriented table and drawer.
- Collection History uses a dense filterable table and real transaction-detail drawer.
- Reports remain functionally unchanged and export correctly.
- No fake or unsupported fields/actions are displayed as real.
- Permissions, academic/school scoping, assessment eligibility, AR/OR behavior, OR uniqueness, voucher transitions, void approval rules, previews, and notifications remain intact.
- Submissions are guarded against duplicates and unsafe invalid amounts.
- Responsive and keyboard behavior meets the rules above.
- Type checking, production build, and focused tests pass.
- No unrelated files or modules were modified.

## Final Handoff

At completion, report:

- Files changed.
- Which centered modals were replaced by drawers.
- Any shared components extended and why.
- Tests added and exact commands/results.
- Any requested concept intentionally omitted because the current schema/service does not support it.
- Confirmation that no unrelated module, route, permission, or business rule was changed.

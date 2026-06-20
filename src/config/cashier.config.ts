/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Cashier capability catalog (Phase 1 — permission preparation only).
 * These are action-level capabilities *within* the CASHIER module
 * (see permissions.config.ts for module-level access).
 *
 * Not yet consumed by any UI — the Cashier module page is a future phase.
 * Listed here so the capability set is defined ahead of implementation and
 * can be imported once the Cashier module is built.
 */
export type CashierCapability =
  | "VIEW_APPROVED_ASSESSMENTS"
  | "SEARCH_STUDENTS_WITH_BALANCE"
  | "ACCEPT_PAYMENT"
  | "SELECT_PAYMENT_METHOD"
  | "GENERATE_RECEIPT_PREVIEW"
  | "VIEW_PAYMENT_HISTORY"
  | "REPRINT_RECEIPT"
  | "VOID_PAYMENT";

/** Capabilities granted to the Cashier role. */
export const CASHIER_CAPABILITIES: CashierCapability[] = [
  "VIEW_APPROVED_ASSESSMENTS",
  "SEARCH_STUDENTS_WITH_BALANCE",
  "ACCEPT_PAYMENT",
  "SELECT_PAYMENT_METHOD",
  "GENERATE_RECEIPT_PREVIEW",
  "VIEW_PAYMENT_HISTORY",
  "REPRINT_RECEIPT",
  "VOID_PAYMENT",
];

/**
 * Capabilities explicitly withheld from the Cashier role — these remain
 * Accounting/Registrar-only actions. Documented here for reference so the
 * Cashier module never grows them by accident.
 */
export const CASHIER_RESTRICTED_ACTIONS = [
  "EDIT_ASSESSMENT",
  "ADD_DISCOUNT",
  "APPROVE_ASSESSMENT",
  "MODIFY_FEE_SETUP",
  "MODIFY_BOOK_SETUP",
  "OVERRIDE_ACCOUNTING_APPROVAL",
] as const;

/**
 * Reprinting a receipt is allowed unconditionally.
 * Voiding a payment is gated separately: it requires the payment to carry an
 * `approvalStatus: "Pending Approval"` placeholder (i.e. the void itself must
 * be routed back to Accounting for approval). No such placeholder exists on
 * `Payment` yet — `VOID_PAYMENT` is reserved for that future workflow and must
 * not be wired to an unconditional void action.
 */
export function canCashier(capability: CashierCapability): boolean {
  return CASHIER_CAPABILITIES.includes(capability);
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Cashier capability catalog.
 * These are action-level capabilities within the CASHIER module
 * (see permissions.config.ts for module-level access).
 *
 * Cashier may submit void requests, but final void/reversal remains an
 * Accounting/authorized-approver workflow until a durable business record and
 * transactional reversal service are implemented.
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
 * Capabilities explicitly withheld from the Cashier role. These remain
 * Accounting/Registrar-only actions and are documented here so the Cashier
 * module does not grow them by accident.
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
 * Voiding is request-only for Cashiers: the UI may submit a void request into
 * the approval workflow, but final void/reversal must stay with Accounting or
 * an authorized approver. The normalized receipt-void RPC performs the complete
 * allocation, direct-collection, unapplied-credit, and GL reversal atomically;
 * this capability must never be wired to deletion or a direct status update.
 */
export function canCashier(capability: CashierCapability): boolean {
  return CASHIER_CAPABILITIES.includes(capability);
}

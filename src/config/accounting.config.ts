/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AcademicUnit } from "../types/school.types";
import type { AccountingTab, DiscountRequest, FinancialHold, StudentAssessment } from "../types";

/**
 * Centralized Accounting module config (Phase 2 foundation).
 * Tabs, KPI templates, action labels, status badge styles, and
 * Basic Ed vs College accounting label sets used by the Accounting module.
 */

export interface AccountingTabConfig {
  id: AccountingTab;
  label: string;
  desc: string;
}

/** Current 3 tabs are live; billing/holds/reports are reserved for future phases. */
export const ACCOUNTING_TABS: AccountingTabConfig[] = [
  { id: "dashboard", label: "Dashboard", desc: "Financial KPIs & activity" },
  { id: "ledger", label: "Student Ledger", desc: "Per-student transactions & balances" },
  { id: "discounts", label: "Discounts & Scholarships", desc: "Discount types, requests & approvals" },
  { id: "billing", label: "Assessment & Billing", desc: "Generate & review student assessments" },
  { id: "holds", label: "Financial Holds", desc: "Enrollment & clearance restrictions" },
  { id: "reports", label: "Reports & Reconciliation", desc: "Collections, discounts & reconciliation" },
];

/** Action-oriented KPI tile templates for the Accounting dashboard (Phase 3+). */
export const ACCOUNTING_DASHBOARD_KPI_TEMPLATES: { id: string; label: string }[] = [
  { id: "todays-collection", label: "Today's Collection" },
  { id: "pending-payment-posting", label: "Pending Payment Posting" },
  { id: "pending-discount-requests", label: "Pending Discount Requests" },
  { id: "financial-holds", label: "Students on Financial Hold" },
  { id: "promissory-notes", label: "Promissory Notes" },
  { id: "unposted-payments", label: "Unposted / For Verification Payments" },
];

/** Labels for Student Ledger action buttons (Phase 3+). */
export const LEDGER_ACTION_LABELS = {
  addPayment: "Add Payment",
  addAdjustment: "Add Adjustment",
  generateSOA: "Generate Statement of Account",
  printLedger: "Print Ledger",
  issueReceipt: "Issue / View Receipt",
  applyDiscount: "Apply Discount",
  setHold: "Set Financial Hold",
  clearHold: "Clear Financial Hold",
} as const;

export interface StatusBadgeStyle {
  label: string;
  badgeClass: string;
}

/** Badge styles for DiscountRequest["status"], including extended statuses. */
export const DISCOUNT_STATUS_CONFIG: Record<DiscountRequest["status"], StatusBadgeStyle> = {
  "Pending": { label: "Pending", badgeClass: "text-amber-700 bg-amber-50 border-amber-200" },
  "For Review": { label: "For Review", badgeClass: "text-blue-700 bg-blue-50 border-blue-200" },
  "Approved": { label: "Approved", badgeClass: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  "Rejected": { label: "Rejected", badgeClass: "text-red-700 bg-red-50 border-red-200" },
  "Returned for Documents": { label: "Returned for Documents", badgeClass: "text-orange-700 bg-orange-50 border-orange-200" },
  "Cancelled": { label: "Cancelled", badgeClass: "text-stone-500 bg-stone-50 border-stone-200" },
  "Expired": { label: "Expired", badgeClass: "text-stone-500 bg-stone-100 border-stone-300" },
};

/** Badge styles for FinancialHold["status"]. */
export const FINANCIAL_HOLD_STATUS_CONFIG: Record<FinancialHold["status"], StatusBadgeStyle> = {
  "Active": { label: "Active Hold", badgeClass: "text-red-700 bg-red-50 border-red-200" },
  "Cleared": { label: "Cleared", badgeClass: "text-emerald-700 bg-emerald-50 border-emerald-200" },
};

/** Maps a FinancialHold's internal `holdType` to its user-facing "Blocked Process" label. */
export const BLOCKED_PROCESS_LABELS: Record<FinancialHold["holdType"], string> = {
  "Enrollment": "Enrollment",
  "COR": "COR Generation",
  "Exam Permit": "Exam Permit",
  "Transcript": "Transcript Request",
  "Graduation Clearance": "Clearance",
  "Transfer Credentials": "Clearance",
};

/** Default Hold Type / category shown when a record predates the `holdCategory` field. */
export const DEFAULT_HOLD_CATEGORY: NonNullable<FinancialHold["holdCategory"]> = "Unpaid Balance";

/**
 * Badge styles for StudentAssessment["approvalStatus"] — the Accounting
 * approval workflow that gates Cashier payment collection.
 */
export const ASSESSMENT_APPROVAL_STATUS_CONFIG: Record<NonNullable<StudentAssessment["approvalStatus"]>, StatusBadgeStyle> = {
  "Pending Accounting Approval": { label: "Pending Accounting Approval", badgeClass: "text-amber-700 bg-amber-50 border-amber-200" },
  "Approved for Payment": { label: "Approved for Payment", badgeClass: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  "Returned to Registrar": { label: "Returned to Registrar", badgeClass: "text-orange-700 bg-orange-50 border-orange-200" },
  "Rejected": { label: "Rejected", badgeClass: "text-red-700 bg-red-50 border-red-200" },
};

/** Status assumed for assessments that predate the approval workflow / have no `approvalStatus`. */
export const DEFAULT_ASSESSMENT_APPROVAL_STATUS: NonNullable<StudentAssessment["approvalStatus"]> = "Pending Accounting Approval";

/** Basic Ed vs College accounting label sets (driven by AcademicUnit, not role). */
export interface AccountingLabelSet {
  /** "Grade Level" | "Year Level" */
  levelLabel: string;
  /** "Section" | "Course" */
  groupLabel: string;
  /** "Tuition Package" | "Program" */
  programLabel: string;
  /** "Monthly Plan" | "Semester" */
  termLabel: string;
  /** "Tuition Package" | "Units" */
  billingBasisLabel: string;
  /** "Miscellaneous Fees" | "Subject Load" */
  feeStructureLabel: string;
}

export const ACCOUNTING_LABELS: Record<AcademicUnit, AccountingLabelSet> = {
  "basic-ed": {
    levelLabel: "Grade Level",
    groupLabel: "Section",
    programLabel: "Tuition Package",
    termLabel: "Monthly Plan",
    billingBasisLabel: "Tuition Package",
    feeStructureLabel: "Miscellaneous Fees",
  },
  "college": {
    levelLabel: "Year Level",
    groupLabel: "Course",
    programLabel: "Program",
    termLabel: "Semester",
    billingBasisLabel: "Units",
    feeStructureLabel: "Subject Load",
  },
};

/** Resolves the Accounting label set for a given AcademicUnit. */
export function getAccountingLabels(unit: AcademicUnit): AccountingLabelSet {
  return ACCOUNTING_LABELS[unit];
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AcademicUnit } from "../types/school.types";
import type { AccountingTab, DiscountRequest, FinancialHold, StudentAssessment } from "../types";
import { getStatusBadgeStyle, type StatusBadgeStyle } from "./status-style.config";

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
  addAdjustment: "Add Adjustment",
  generateSOA: "Generate Statement of Account",
  printLedger: "Print Ledger",
  viewReceipt: "View Receipt",
  applyDiscount: "Apply Discount",
  setHold: "Set Financial Hold",
  clearHold: "Clear Financial Hold",
} as const;

/** Badge styles for DiscountRequest["status"], including extended statuses. */
export const DISCOUNT_STATUS_CONFIG: Record<DiscountRequest["status"], StatusBadgeStyle> = {
  "Pending": getStatusBadgeStyle("Pending"),
  "For Review": getStatusBadgeStyle("For Review"),
  "Approved": getStatusBadgeStyle("Approved"),
  "Rejected": getStatusBadgeStyle("Rejected"),
  "Returned for Documents": getStatusBadgeStyle("Returned for Documents"),
  "Cancelled": getStatusBadgeStyle("Cancelled"),
  "Expired": getStatusBadgeStyle("Expired"),
};

/** Badge styles for FinancialHold["status"]. */
export const FINANCIAL_HOLD_STATUS_CONFIG: Record<FinancialHold["status"], StatusBadgeStyle> = {
  "Active": { label: "Active Hold", badgeClass: "text-red-700 bg-red-50 border-red-200" },
  "Cleared": getStatusBadgeStyle("Cleared"),
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
  "Pending Accounting Approval": getStatusBadgeStyle("Pending Accounting Approval"),
  "Approved for Payment": getStatusBadgeStyle("Approved for Payment"),
  "Returned to Registrar": getStatusBadgeStyle("Returned to Registrar"),
  "Rejected": getStatusBadgeStyle("Rejected"),
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

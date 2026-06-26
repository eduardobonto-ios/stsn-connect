/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AppTone } from "../components/common/ui-variants";

export interface StatusStyle {
  label: string;
  tone: AppTone;
  badgeClass: string;
}

const STATUS_STYLES: Record<string, StatusStyle> = {
  // ── Generic workflow ──────────────────────────────────────────────────────
  pending: { label: "Pending", tone: "warning", badgeClass: "bg-amber-50 text-amber-700 border-amber-200" },
  "pending approval": { label: "Pending Approval", tone: "warning", badgeClass: "bg-amber-50 text-amber-700 border-amber-200" },
  "pending accounting approval": { label: "Pending Accounting Approval", tone: "warning", badgeClass: "bg-amber-50 text-amber-700 border-amber-200" },
  "for review": { label: "For Review", tone: "info", badgeClass: "bg-blue-50 text-blue-700 border-blue-200" },
  approved: { label: "Approved", tone: "success", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "approved for payment": { label: "Approved for Payment", tone: "success", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "Rejected", tone: "danger", badgeClass: "bg-red-50 text-red-700 border-red-200" },
  returned: { label: "Returned", tone: "warning", badgeClass: "bg-orange-50 text-orange-700 border-orange-200" },
  "returned to registrar": { label: "Returned to Registrar", tone: "warning", badgeClass: "bg-orange-50 text-orange-700 border-orange-200" },
  paid: { label: "Paid", tone: "success", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  unpaid: { label: "Unpaid", tone: "danger", badgeClass: "bg-red-50 text-red-700 border-red-200" },
  partial: { label: "Partial", tone: "warning", badgeClass: "bg-amber-50 text-amber-700 border-amber-200" },
  posted: { label: "Posted", tone: "success", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  draft: { label: "Draft", tone: "neutral", badgeClass: "bg-stone-100 text-stone-600 border-stone-200" },
  void: { label: "Void", tone: "danger", badgeClass: "bg-red-50 text-red-700 border-red-200" },
  voided: { label: "Voided", tone: "danger", badgeClass: "bg-red-50 text-red-700 border-red-200" },
  active: { label: "Active", tone: "success", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  inactive: { label: "Inactive", tone: "neutral", badgeClass: "bg-stone-100 text-stone-600 border-stone-200" },
  completed: { label: "Completed", tone: "success", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelled: { label: "Cancelled", tone: "neutral", badgeClass: "bg-stone-100 text-stone-600 border-stone-200" },
  // ── Enrollment-specific statuses ─────────────────────────────────────────
  enrolled: { label: "Enrolled", tone: "success", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "for assessment": { label: "For Assessment", tone: "info", badgeClass: "bg-blue-50 text-blue-700 border-blue-200" },
  assessed: { label: "Assessed", tone: "info", badgeClass: "bg-sky-50 text-sky-700 border-sky-200" },
  "for payment": { label: "For Payment", tone: "warning", badgeClass: "bg-amber-50 text-amber-700 border-amber-200" },
  "partially paid": { label: "Partially Paid", tone: "warning", badgeClass: "bg-orange-50 text-orange-700 border-orange-200" },
  withdrawn: { label: "Withdrawn", tone: "danger", badgeClass: "bg-red-50 text-red-600 border-red-200" },
};

export function getStatusStyle(status: string): StatusStyle {
  const key = status.trim().toLowerCase();
  return STATUS_STYLES[key] ?? {
    label: status,
    tone: "neutral",
    badgeClass: "bg-stone-100 text-stone-600 border-stone-200",
  };
}

export { STATUS_STYLES };

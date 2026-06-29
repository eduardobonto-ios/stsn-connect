/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AppTone } from "../components/common/ui-variants";

export type StatusFamily = "workflow" | "academic" | "finance" | "neutral";

export interface StatusStyle {
  label: string;
  tone: AppTone;
  family: StatusFamily;
  token: string;
  badgeClass: string;
}

export interface StatusBadgeStyle {
  label: string;
  badgeClass: string;
}

const STATUS_CLASS = {
  neutral: "stsn-status-neutral",
  workflowDraft: "stsn-status-workflow-draft",
  workflowPending: "stsn-status-workflow-pending",
  workflowReview: "stsn-status-workflow-review",
  workflowApproved: "stsn-status-workflow-approved",
  workflowRejected: "stsn-status-workflow-rejected",
  workflowCancelled: "stsn-status-workflow-cancelled",
  academicActive: "stsn-status-academic-active",
  academicEnrolled: "stsn-status-academic-enrolled",
  academicGraduated: "stsn-status-academic-graduated",
  academicDropped: "stsn-status-academic-dropped",
  academicLeave: "stsn-status-academic-leave",
  academicSuspended: "stsn-status-academic-suspended",
  financeCredit: "stsn-status-finance-credit",
  financeDebit: "stsn-status-finance-debit",
  financeBalance: "stsn-status-finance-balance",
  financeOverdue: "stsn-status-finance-overdue",
  financePaid: "stsn-status-finance-paid",
  financePartial: "stsn-status-finance-partial",
  financeWaived: "stsn-status-finance-waived",
} as const;

function style(
  label: string,
  tone: AppTone,
  family: StatusFamily,
  token: string,
  badgeClass: string,
): StatusStyle {
  return { label, tone, family, token, badgeClass };
}

const STATUS_STYLES: Record<string, StatusStyle> = {
  // Generic workflow
  draft: style("Draft", "neutral", "workflow", "draft", STATUS_CLASS.workflowDraft),
  pending: style("Pending", "warning", "workflow", "pending", STATUS_CLASS.workflowPending),
  "pending approval": style("Pending Approval", "warning", "workflow", "pending", STATUS_CLASS.workflowPending),
  "pending accounting approval": style("Pending Accounting Approval", "warning", "workflow", "pending", STATUS_CLASS.workflowPending),
  submitted: style("Submitted", "warning", "workflow", "pending", STATUS_CLASS.workflowPending),
  "for review": style("For Review", "info", "workflow", "review", STATUS_CLASS.workflowReview),
  "in review": style("In Review", "info", "workflow", "review", STATUS_CLASS.workflowReview),
  review: style("Review", "info", "workflow", "review", STATUS_CLASS.workflowReview),
  returned: style("Returned", "warning", "workflow", "review", STATUS_CLASS.workflowReview),
  "returned to registrar": style("Returned to Registrar", "warning", "workflow", "review", STATUS_CLASS.workflowReview),
  "returned for documents": style("Returned for Documents", "warning", "workflow", "review", STATUS_CLASS.workflowReview),
  computed: style("Computed", "info", "workflow", "review", STATUS_CLASS.workflowReview),
  queued: style("Queued", "info", "workflow", "review", STATUS_CLASS.workflowReview),
  approved: style("Approved", "success", "workflow", "approved", STATUS_CLASS.workflowApproved),
  completed: style("Completed", "success", "workflow", "approved", STATUS_CLASS.workflowApproved),
  posted: style("Posted", "success", "workflow", "approved", STATUS_CLASS.workflowApproved),
  released: style("Released", "success", "workflow", "approved", STATUS_CLASS.workflowApproved),
  cleared: style("Cleared", "success", "workflow", "approved", STATUS_CLASS.workflowApproved),
  rejected: style("Rejected", "danger", "workflow", "rejected", STATUS_CLASS.workflowRejected),
  failed: style("Failed", "danger", "workflow", "rejected", STATUS_CLASS.workflowRejected),
  void: style("Void", "danger", "workflow", "rejected", STATUS_CLASS.workflowRejected),
  voided: style("Voided", "danger", "workflow", "rejected", STATUS_CLASS.workflowRejected),
  cancelled: style("Cancelled", "neutral", "workflow", "cancelled", STATUS_CLASS.workflowCancelled),
  canceled: style("Canceled", "neutral", "workflow", "cancelled", STATUS_CLASS.workflowCancelled),
  expired: style("Expired", "neutral", "workflow", "cancelled", STATUS_CLASS.workflowCancelled),
  inactive: style("Inactive", "neutral", "workflow", "cancelled", STATUS_CLASS.workflowCancelled),

  // Academic status
  active: style("Active", "success", "academic", "active", STATUS_CLASS.academicActive),
  enrolled: style("Enrolled", "success", "academic", "enrolled", STATUS_CLASS.academicEnrolled),
  graduated: style("Graduated", "purple", "academic", "graduated", STATUS_CLASS.academicGraduated),
  dropped: style("Dropped", "danger", "academic", "dropped", STATUS_CLASS.academicDropped),
  withdrawn: style("Withdrawn", "danger", "academic", "dropped", STATUS_CLASS.academicDropped),
  leave: style("Leave", "warning", "academic", "leave", STATUS_CLASS.academicLeave),
  "on leave": style("On Leave", "warning", "academic", "leave", STATUS_CLASS.academicLeave),
  suspended: style("Suspended", "danger", "academic", "suspended", STATUS_CLASS.academicSuspended),
  "for assessment": style("For Assessment", "info", "workflow", "review", STATUS_CLASS.workflowReview),
  assessed: style("Assessed", "info", "workflow", "review", STATUS_CLASS.workflowReview),

  // Finance status
  credit: style("Credit", "success", "finance", "credit", STATUS_CLASS.financeCredit),
  debit: style("Debit", "info", "finance", "debit", STATUS_CLASS.financeDebit),
  balance: style("Balance", "neutral", "finance", "balance", STATUS_CLASS.financeBalance),
  overdue: style("Overdue", "danger", "finance", "overdue", STATUS_CLASS.financeOverdue),
  unpaid: style("Unpaid", "danger", "finance", "overdue", STATUS_CLASS.financeOverdue),
  paid: style("Paid", "success", "finance", "paid", STATUS_CLASS.financePaid),
  "approved for payment": style("Approved for Payment", "success", "workflow", "approved", STATUS_CLASS.workflowApproved),
  partial: style("Partial", "warning", "finance", "partial", STATUS_CLASS.financePartial),
  "partially paid": style("Partially Paid", "warning", "finance", "partial", STATUS_CLASS.financePartial),
  waived: style("Waived", "purple", "finance", "waived", STATUS_CLASS.financeWaived),
};

export const DEFAULT_STATUS_STYLE: StatusStyle = style(
  "Unknown",
  "neutral",
  "neutral",
  "default",
  STATUS_CLASS.neutral,
);

export function getStatusStyle(status: string): StatusStyle {
  const key = status.trim().toLowerCase();
  return STATUS_STYLES[key] ?? {
    ...DEFAULT_STATUS_STYLE,
    label: status,
  };
}

export function getStatusBadgeStyle(status: string, label?: string): StatusBadgeStyle {
  const style = getStatusStyle(status);
  return {
    label: label ?? style.label,
    badgeClass: style.badgeClass,
  };
}

export { STATUS_CLASS, STATUS_STYLES };

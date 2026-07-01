/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import AppStatusBadge from "../../../components/common/AppStatusBadge";

export function formatMoney(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  return `₱${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Maps a library domain status to an existing status-style token (for color) and
// a friendly label, so the shared AppStatusBadge renders consistent Metronic pills.
const STATUS_MAP: Record<string, { token: string; label: string }> = {
  AVAILABLE: { token: "active", label: "Available" },
  BORROWED: { token: "debit", label: "Borrowed" },
  RESERVED: { token: "pending", label: "Reserved" },
  LOST: { token: "rejected", label: "Lost" },
  DAMAGED: { token: "partial", label: "Damaged" },
  ARCHIVED: { token: "inactive", label: "Archived" },
  RETURNED: { token: "completed", label: "Returned" },
  OVERDUE: { token: "overdue", label: "Overdue" },
  CANCELLED: { token: "cancelled", label: "Cancelled" },
  PENDING: { token: "pending", label: "Pending" },
  PAID: { token: "paid", label: "Paid" },
  WAIVED: { token: "waived", label: "Waived" },
  // book / copy condition + book status
  Active: { token: "active", label: "Active" },
  Inactive: { token: "inactive", label: "Inactive" },
  New: { token: "active", label: "New" },
  Good: { token: "active", label: "Good" },
  Fair: { token: "pending", label: "Fair" },
  Poor: { token: "overdue", label: "Poor" },
  // fine types
  OVERDUE_FINE: { token: "overdue", label: "Overdue" },
};

export function LibraryStatusBadge({ status, label }: { status: string; label?: string }) {
  const mapped = STATUS_MAP[status];
  return <AppStatusBadge status={mapped?.token ?? status}>{label ?? mapped?.label ?? status}</AppStatusBadge>;
}

/** Standard white panel with a titled header used across library sections. */
export function SectionPanel({
  title,
  icon: Icon,
  meta,
  actions,
  children,
  className = "",
}: {
  title: string;
  icon?: React.ElementType;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-xl border border-stsn-beige shadow-sm overflow-hidden ${className}`}>
      <div className="px-4 py-3 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {Icon && <Icon className="w-4 h-4 text-stsn-gold flex-shrink-0" />}
          <h3 className="text-sm font-display font-bold text-stone-900 truncate">{title}</h3>
          {meta && <span className="text-[10px] text-stone-400 font-mono ml-1">{meta}</span>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

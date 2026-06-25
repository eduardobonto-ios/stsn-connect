/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { AlertTriangle } from "lucide-react";

interface SLABadgeProps {
  dateStr?: string | null;
  /** SLA threshold in days before the item is considered overdue (default 3) */
  slaDays?: number;
  /** Show just the age text without the pill background */
  compact?: boolean;
}

export function getSLAInfo(dateStr?: string | null, slaDays = 3) {
  if (!dateStr) return { label: "—", isOverdue: false, pillClass: "text-stone-300" };
  const ms = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > slaDays) return {
    label: `${days}d`,
    isOverdue: true,
    pillClass: "bg-red-50 text-red-600 border border-red-200 font-bold",
  };
  if (days >= 1) return {
    label: `${days}d`,
    isOverdue: false,
    pillClass: "bg-amber-50 text-amber-600 border border-amber-200",
  };
  if (hours >= 1) return {
    label: `${hours}h`,
    isOverdue: false,
    pillClass: "bg-emerald-50 text-emerald-600 border border-emerald-200",
  };
  return {
    label: "< 1h",
    isOverdue: false,
    pillClass: "bg-emerald-50 text-emerald-600 border border-emerald-200",
  };
}

export default function SLABadge({ dateStr, slaDays = 3, compact = false }: SLABadgeProps) {
  const { label, isOverdue, pillClass } = getSLAInfo(dateStr, slaDays);
  if (!dateStr) return <span className="text-[9px] text-stone-300">—</span>;

  if (compact) {
    return (
      <span className={`text-[9px] font-semibold font-mono ${isOverdue ? "text-red-600 font-bold" : "text-stone-400"}`}>
        {label}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full ${pillClass}`}>
      {isOverdue && <AlertTriangle className="w-2.5 h-2.5" />}
      {label}
    </span>
  );
}

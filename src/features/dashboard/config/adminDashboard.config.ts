/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface KpiTone {
  bg: string;
  border: string;
  text: string;
  chip: string;
  icon: string;
}

export const ADMIN_KPI_TONES: Record<string, KpiTone> = {
  learners: {
    bg: "bg-blue-50",
    border: "border-blue-100",
    text: "text-blue-700",
    chip: "bg-blue-100",
    icon: "text-blue-500",
  },
  collections: {
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    text: "text-emerald-700",
    chip: "bg-emerald-100",
    icon: "text-emerald-500",
  },
  verifiedRate: {
    bg: "bg-violet-50",
    border: "border-violet-100",
    text: "text-violet-700",
    chip: "bg-violet-100",
    icon: "text-violet-500",
  },
  pendingActions: {
    bg: "bg-amber-50",
    border: "border-amber-100",
    text: "text-amber-700",
    chip: "bg-amber-100",
    icon: "text-amber-500",
  },
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import type { KpiTone } from "../../../features/dashboard/config/adminDashboard.config";

interface AnalyticsKpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  tone?: KpiTone;
  trend?: string;
  trendUp?: boolean;
}

const DEFAULT_TONE: KpiTone = {
  bg: "bg-stone-50",
  border: "border-stone-200",
  text: "text-stone-800",
  chip: "bg-stone-100",
  icon: "text-stone-500",
};

export default function AnalyticsKpiCard({
  label,
  value,
  sub,
  icon,
  tone = DEFAULT_TONE,
  trend,
  trendUp,
}: AnalyticsKpiCardProps) {
  return (
    <div className={`rounded-2xl border ${tone.bg} ${tone.border} p-5 flex flex-col gap-3 shadow-sm`}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-semibold text-stone-500 leading-tight">{label}</span>
        <div className={`w-9 h-9 rounded-xl ${tone.chip} flex items-center justify-center flex-shrink-0`}>
          <span className={tone.icon}>{icon}</span>
        </div>
      </div>
      <div>
        <span className={`text-2xl font-display font-bold ${tone.text} leading-none`}>{value}</span>
        {trend && (
          <span className={`text-[9px] font-mono flex items-center gap-0.5 mt-1 ${trendUp ? "text-emerald-600" : "text-stone-400"}`}>
            {trendUp ? "↑" : "↓"} {trend}
          </span>
        )}
        {sub && !trend && (
          <span className="text-[9px] font-mono text-stone-400 block mt-1">{sub}</span>
        )}
      </div>
    </div>
  );
}

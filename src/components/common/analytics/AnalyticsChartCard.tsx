/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

interface AnalyticsChartCardProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export default function AnalyticsChartCard({
  title,
  subtitle,
  badge,
  action,
  children,
}: AnalyticsChartCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 flex flex-col h-full">
      <div className="flex justify-between items-start mb-4 gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-stone-800 leading-tight">{title}</h3>
          {subtitle && (
            <p className="text-[10px] text-stone-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {badge}
          {action}
        </div>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

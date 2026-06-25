/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

export interface SummaryItem {
  label: string;
  value: string | number;
  sub?: string;
  tone?: string;
}

interface AnalyticsSummaryStripProps {
  items: SummaryItem[];
}

export default function AnalyticsSummaryStrip({ items }: AnalyticsSummaryStripProps) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {items.map((item, i) => (
          <div key={i} className={`flex flex-col gap-1 ${i > 0 ? "lg:pl-4 lg:border-l lg:border-stone-100" : ""}`}>
            <span className="text-[9px] font-mono uppercase tracking-widest text-stone-400">{item.label}</span>
            <span className={`text-2xl font-display font-bold leading-none ${item.tone ?? "text-stone-800"}`}>{item.value}</span>
            {item.sub && <span className="text-[9px] text-stone-400 font-mono">{item.sub}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

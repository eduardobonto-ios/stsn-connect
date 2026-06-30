/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

interface AnalyticsDashboardShellProps {
  title: string;
  subtitle?: string;
  badge?: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
}

export default function AnalyticsDashboardShell({
  title,
  subtitle,
  badge,
  meta,
  children,
}: AnalyticsDashboardShellProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-stsn-brown-dark via-stsn-gold to-stsn-brown-dark" />
        <div className="px-6 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            {badge && (
              <span className="text-[9px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full font-bold border bg-stsn-gold/15 border-stsn-gold/30 text-stsn-brown">
                {badge}
              </span>
            )}
            <h2 className="text-xl font-display font-semibold mt-2 text-stone-900">{title}</h2>
            {subtitle && (
              <p className="text-stone-400 text-[11px] mt-1">{subtitle}</p>
            )}
          </div>
          {meta && <div className="flex gap-2 flex-shrink-0">{meta}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

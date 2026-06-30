/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

export interface ModulePageHeaderProps {
  /** Short eyebrow label — e.g. "Work Queue", "K-12 Basic Education" */
  badge?: string;
  /** Optional icon rendered inside the badge pill */
  badgeIcon?: React.ElementType;
  /** Main page/module title */
  title: string;
  /** Optional subtitle below the title */
  subtitle?: string;
  /** Optional inline metadata string shown next to the badge — e.g. "S.Y. 2026–2027" */
  meta?: string;
  /** Action button(s) rendered on the right side of the banner */
  actions?: React.ReactNode;
  /** Color variant: "default" = shared academic navy, "college" = brighter navy accent */
  variant?: "default" | "college";
}

export default function ModulePageHeader({
  badge,
  badgeIcon: BadgeIcon,
  title,
  subtitle,
  meta,
  actions,
  variant = "default",
}: ModulePageHeaderProps) {
  const isCollege = variant === "college";

  const badgeClasses = isCollege
    ? "bg-sky-300/12 border-sky-300/30 text-sky-100"
    : "bg-[rgba(242,201,76,0.14)] border-[rgba(242,201,76,0.34)] text-[#F2C94C]";

  return (
    <div className="rounded-2xl overflow-hidden shadow-md border border-[rgba(7,28,52,0.18)]">
      <div className={`px-6 py-5 sm:px-7 ${isCollege ? "module-page-banner-college" : "module-page-banner"}`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-5 sm:gap-6">
          <div className="min-w-0">
            {(badge || meta) && (
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {badge && (
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${badgeClasses}`}>
                    {BadgeIcon && <BadgeIcon className="w-3 h-3" />}
                    {badge}
                  </span>
                )}
                {meta && (
                  <span className="text-white/50 text-[10px] font-mono uppercase tracking-widest">
                    {meta}
                  </span>
                )}
              </div>
            )}
            <h2 className="text-2xl font-bold text-[var(--stsn-banner-text)] tracking-tight leading-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-[var(--stsn-banner-subtitle)] text-xs mt-2.5 leading-relaxed max-w-3xl">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex flex-col sm:items-end gap-2 flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      </div>
      <div className={isCollege ? "module-page-banner-accent-college" : "module-page-banner-accent"} />
    </div>
  );
}

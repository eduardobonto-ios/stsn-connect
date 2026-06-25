/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

interface AppSectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: React.ElementType;
  actions?: React.ReactNode;
}

export default function AppSectionHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  actions,
}: AppSectionHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[9px] font-mono uppercase tracking-widest text-stsn-gold font-bold">
            {eyebrow}
          </p>
        )}
        <h2 className="text-lg font-bold text-stsn-brown-dark flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-stsn-brown flex-shrink-0" />}
          <span className="truncate">{title}</span>
        </h2>
        {description && <p className="text-xs text-stone-500 mt-1">{description}</p>}
      </div>
      {actions && <div className="flex-shrink-0">{actions}</div>}
    </div>
  );
}

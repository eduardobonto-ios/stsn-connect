/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { APP_TONE_STYLES, type AppTone } from "./ui-variants";

interface AppKpiCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  tone?: AppTone;
  hint?: string;
  className?: string;
}

export default function AppKpiCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
  hint,
  className = "",
}: AppKpiCardProps) {
  const style = APP_TONE_STYLES[tone];

  return (
    <div className={`rounded-xl border p-4 shadow-sm ${style.card} ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase font-mono tracking-wider opacity-75 leading-tight">
            {label}
          </p>
          <p className={`text-xl font-black mt-1 leading-none ${style.text}`}>
            {value}
          </p>
          {hint && <p className="text-[10px] font-semibold opacity-75 mt-1">{hint}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${style.icon}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

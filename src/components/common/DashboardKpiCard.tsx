/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { TrendingUp, TrendingDown, Minus, AlertCircle, Loader2 } from "lucide-react";
import { APP_TONE_STYLES, type AppTone } from "./ui-variants";

export interface DashboardKpiCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  tone?: AppTone;
  hint?: string;
  trend?: "up" | "down" | "flat";
  trendLabel?: string;
  alert?: boolean;
  alertLabel?: string;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function DashboardKpiCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
  hint,
  trend,
  trendLabel,
  alert,
  alertLabel,
  loading,
  onClick,
  className = "",
}: DashboardKpiCardProps) {
  const style = APP_TONE_STYLES[tone];

  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor =
    trend === "up"
      ? "text-emerald-600"
      : trend === "down"
      ? "text-red-500"
      : "text-stone-400";

  const baseClass = `rounded-xl border p-4 shadow-sm transition-all ${style.card} ${className}`;
  const interactiveClass = onClick
    ? "cursor-pointer hover:shadow-md hover:scale-[1.01] active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-stsn-brown focus-visible:outline-none"
    : "";

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
      className={`${baseClass} ${interactiveClass}`}
    >
      {loading ? (
        <div className="flex items-center justify-center h-14">
          <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
        </div>
      ) : (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase font-mono tracking-wider opacity-75 leading-tight">
              {label}
            </p>
            <p className={`text-xl font-black mt-1 leading-none ${style.text}`}>
              {value}
            </p>
            {hint && (
              <p className="text-[10px] font-semibold opacity-75 mt-1">{hint}</p>
            )}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {trend && (
                <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${trendColor}`}>
                  <TrendIcon className="w-3 h-3" />
                  {trendLabel}
                </span>
              )}
              {alert && (
                <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                  <AlertCircle className="w-3 h-3" />
                  {alertLabel ?? "Action needed"}
                </span>
              )}
            </div>
          </div>
          <div
            className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${style.icon}`}
          >
            <Icon className="w-5 h-5" />
          </div>
        </div>
      )}
    </div>
  );
}

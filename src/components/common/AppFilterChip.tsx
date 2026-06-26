/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

interface AppFilterChipProps {
  label: string;
  active?: boolean;
  count?: number;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "default" | "college";
  shape?: "rounded" | "pill";
  icon?: React.ReactNode;
  size?: "sm" | "md";
}

/**
 * AppFilterChip — standardized filter button / quick filter chip.
 * Use for status filters, source filters, type filters, and category filters
 * under search bars and above tables.
 *
 * - Default (brown) for Basic Education context
 * - College (blue) for College context
 */
export default function AppFilterChip({
  label,
  active = false,
  count,
  onClick,
  disabled = false,
  variant = "default",
  shape = "rounded",
  icon,
  size = "md",
}: AppFilterChipProps) {
  const isCollege = variant === "college";
  const radiusClass = shape === "pill" ? "rounded-full" : "rounded-lg";

  const activeClass = isCollege
    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
    : "bg-stsn-brown text-white border-stsn-brown shadow-sm";

  const inactiveClass = isCollege
    ? "bg-white text-stone-500 border-stone-200 hover:border-blue-400/50 hover:bg-blue-50/50"
    : "bg-white text-stone-600 border-stone-200 hover:border-stsn-brown/40 hover:bg-stsn-cream/60";

  const sizeClass = size === "sm"
    ? "px-2.5 py-1 text-[10px]"
    : "px-3 py-1.5 text-xs";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 ${sizeClass} ${radiusClass} font-semibold transition-all border cursor-pointer ${
        active ? activeClass : inactiveClass
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={`ml-0.5 px-1.5 py-0.5 ${radiusClass} text-[9px] font-bold leading-none ${
            active
              ? "bg-white/20 text-white"
              : "bg-stone-100 text-stone-500"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

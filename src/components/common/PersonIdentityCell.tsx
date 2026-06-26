/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

interface PersonIdentityCellProps {
  firstName: string;
  lastName: string;
  middleName?: string;
  /** Text shown below the name — section, dept, employee number, email, etc. */
  secondary?: string;
  /** Render secondary text in monospace (default) or normal weight */
  secondaryStyle?: "mono" | "normal";
  /** Color scheme for the initials avatar */
  variant?: "basic-ed" | "college" | "neutral";
  onClick?: () => void;
  className?: string;
}

const avatarClass: Record<NonNullable<PersonIdentityCellProps["variant"]>, string> = {
  "basic-ed": "bg-stsn-cream text-stsn-brown border border-stsn-beige",
  "college":  "bg-blue-50 text-blue-700 border border-blue-100",
  "neutral":  "bg-stone-100 text-stone-500 border border-stone-200",
};

export default function PersonIdentityCell({
  firstName,
  lastName,
  secondary,
  secondaryStyle = "mono",
  variant = "basic-ed",
  onClick,
  className = "",
}: PersonIdentityCellProps) {
  const safeFirst = firstName ?? "";
  const safeLast  = lastName  ?? "";
  const initials  = `${safeFirst.charAt(0)}${safeLast.charAt(0)}`.toUpperCase() || "?";

  const content = (
    <div className={`flex items-center gap-2.5 py-0.5 ${onClick ? "cursor-pointer" : ""} ${className}`}>
      <div
        className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-[11px] font-black ${avatarClass[variant]}`}
      >
        {initials}
      </div>
      <div className="min-w-0">
        <div className="font-semibold text-stone-900 text-xs leading-tight truncate">
          {safeLast ? `${safeLast}, ${safeFirst}` : safeFirst || "—"}
        </div>
        {secondary !== undefined && secondary !== null && (
          <span
            className={`text-[10px] text-stone-400 block leading-tight truncate ${
              secondaryStyle === "mono" ? "font-mono" : "font-normal"
            }`}
          >
            {secondary || "—"}
          </span>
        )}
      </div>
    </div>
  );

  if (onClick) {
    return <div onClick={onClick}>{content}</div>;
  }
  return content;
}

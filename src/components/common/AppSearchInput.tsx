/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Search, X } from "lucide-react";

export interface AppSearchInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Called when the clear (×) button is clicked. Shows the button only when value is non-empty. */
  onClear?: () => void;
  /** "college" switches focus ring to blue; "default" (brown) is used for Basic Ed */
  variant?: "default" | "college";
  /** Extra wrapper classes */
  wrapperClassName?: string;
}

export default function AppSearchInput({
  onClear,
  variant = "default",
  wrapperClassName = "",
  className = "",
  value,
  ...props
}: AppSearchInputProps) {
  const focusClasses =
    variant === "college"
      ? "focus:ring-blue-500/20 focus:border-blue-500"
      : "focus:ring-stsn-brown/20 focus:border-stsn-brown";

  const hasValue = value !== undefined && value !== "";

  return (
    <div className={`relative flex-1 ${wrapperClassName}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
      <input
        {...props}
        value={value}
        className={[
          "w-full h-10 bg-stone-50 border border-stone-200 rounded-xl pl-10 text-sm outline-none",
          "focus:ring-2 focus:outline-none transition",
          "placeholder:text-stone-400 text-stone-800",
          onClear ? "pr-9" : "pr-3",
          focusClasses,
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      />
      {onClear && hasValue && (
        <button
          type="button"
          onClick={onClear}
          tabIndex={-1}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer transition"
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

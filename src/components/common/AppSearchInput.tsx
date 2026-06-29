/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Search, X } from "lucide-react";
import {
  CONTROL_BASE_CLASSES,
  CONTROL_ICON_LEFT_PADDING,
  CONTROL_ICON_RIGHT_PADDING,
  CONTROL_SIZE_CLASSES,
  CONTROL_STATE_CLASSES,
} from "./controlStyles";

export interface AppSearchInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Called when the clear (×) button is clicked. Shows the button only when value is non-empty. */
  onClear?: () => void;
  /** "college" switches focus ring to blue; "default" (brown) is used for Basic Ed */
  variant?: "default" | "college";
  /** Extra wrapper classes */
  wrapperClassName?: string;
  uiSize?: "sm" | "md";
}

export default function AppSearchInput({
  onClear,
  variant = "default",
  wrapperClassName = "",
  uiSize = "md",
  className = "",
  value,
  ...props
}: AppSearchInputProps) {
  const toneClasses =
    variant === "college"
      ? "focus:border-blue-500 focus:ring-blue-500/15"
      : CONTROL_STATE_CLASSES.default;

  const hasValue = value !== undefined && value !== "";
  const leftPadding = CONTROL_ICON_LEFT_PADDING[uiSize];
  const rightPadding = onClear ? CONTROL_ICON_RIGHT_PADDING[uiSize] : "pr-3.5";
  const iconSize = uiSize === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  const clearIconSize = uiSize === "sm" ? "w-3 h-3" : "w-3.5 h-3.5";

  return (
    <div className={`relative flex-1 ${wrapperClassName}`}>
      <Search className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 ${iconSize}`} />
      <input
        {...props}
        value={value}
        className={[
          CONTROL_BASE_CLASSES,
          CONTROL_SIZE_CLASSES[uiSize],
          leftPadding,
          rightPadding,
          toneClasses,
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
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-stone-400 transition hover:bg-stone-200/60 hover:text-stone-700 cursor-pointer"
          aria-label="Clear search"
        >
          <X className={clearIconSize} />
        </button>
      )}
    </div>
  );
}

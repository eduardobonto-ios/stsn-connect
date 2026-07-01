/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared switch/toggle control for the STSN Connect migration (navy/gold theme).
 * Accessible (role="switch"), keyboard operable, and used across the rights
 * matrix and any place needing an on/off control.
 */

import React from "react";

export type AppToggleSize = "sm" | "md";

interface AppToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  loading?: boolean;
  size?: AppToggleSize;
  /** Accessible label — required when no visible <label> wraps the control. */
  "aria-label"?: string;
  className?: string;
}

const TRACK: Record<AppToggleSize, string> = {
  sm: "w-8 h-[18px]",
  md: "w-10 h-6",
};

const KNOB: Record<AppToggleSize, string> = {
  sm: "w-3.5 h-3.5 top-[2px] left-[2px]",
  md: "w-5 h-5 top-[2px] left-[2px]",
};

const KNOB_SHIFT: Record<AppToggleSize, string> = {
  sm: "translate-x-[14px]",
  md: "translate-x-[16px]",
};

export default function AppToggle({
  checked,
  onChange,
  disabled = false,
  loading = false,
  size = "md",
  className = "",
  ...aria
}: AppToggleProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={aria["aria-label"]}
      disabled={isDisabled}
      onClick={() => !isDisabled && onChange(!checked)}
      className={[
        "relative flex-shrink-0 rounded-full border transition-colors duration-200 ease-out cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--erp-brand)]/15",
        TRACK[size],
        checked
          ? "bg-[linear-gradient(135deg,#F2C94C_0%,#E7B82F_55%,#D6A21E_100%)] border-transparent shadow-[0_4px_10px_rgba(231,184,47,0.35)]"
          : "bg-stone-200 border-stone-300",
        isDisabled ? "opacity-50 cursor-not-allowed" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span
        className={[
          "absolute rounded-full bg-white shadow-sm transition-transform duration-200 ease-out",
          "flex items-center justify-center",
          KNOB[size],
          checked ? KNOB_SHIFT[size] : "translate-x-0",
        ].join(" ")}
      >
        {loading && (
          <span className="block w-2 h-2 rounded-full border border-stone-300 border-t-stsn-brown animate-spin" />
        )}
      </span>
    </button>
  );
}

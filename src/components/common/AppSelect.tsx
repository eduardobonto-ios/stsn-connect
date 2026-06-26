/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

export interface AppSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export default function AppSelect({
  error = false,
  className = "",
  children,
  ...props
}: AppSelectProps) {
  return (
    <select
      {...props}
      className={[
        "w-full bg-stone-50 border rounded-lg py-2 px-3 text-xs font-semibold outline-none transition cursor-pointer",
        "text-stone-800",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        error
          ? "border-red-400 focus:ring-1 focus:ring-red-300/50 focus:border-red-400"
          : "border-stone-200 focus:ring-1 focus:ring-stsn-gold/50 focus:border-stsn-gold/60",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </select>
  );
}

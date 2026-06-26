/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

export interface AppInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export default function AppInput({ error = false, className = "", ...props }: AppInputProps) {
  return (
    <input
      {...props}
      className={[
        "w-full bg-stone-50 border rounded-lg py-2 px-3 text-xs font-semibold outline-none transition",
        "placeholder:text-stone-400 text-stone-800",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        error
          ? "border-red-400 focus:ring-1 focus:ring-red-300/50 focus:border-red-400"
          : "border-stone-200 focus:ring-1 focus:ring-stsn-gold/50 focus:border-stsn-gold/60",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}

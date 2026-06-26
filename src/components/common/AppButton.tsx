/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

export type AppButtonVariant =
  | "primary"
  | "primary-college"
  | "secondary"
  | "ghost"
  | "outline"
  | "outline-dark"
  | "destructive"
  | "danger-outline";

export type AppButtonSize = "xs" | "sm" | "md" | "lg";

export interface AppButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  loading?: boolean;
  leftIcon?: React.ElementType;
  rightIcon?: React.ElementType;
  children?: React.ReactNode;
}

const VARIANT: Record<AppButtonVariant, string> = {
  primary:
    "bg-[#C5A059] hover:bg-[#d4af68] text-[#1C1512] shadow-lg font-bold",
  "primary-college":
    "bg-blue-400 hover:bg-blue-300 text-blue-950 shadow-lg font-bold",
  secondary:
    "bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 font-semibold",
  ghost:
    "bg-transparent hover:bg-stone-100 text-stone-600 font-semibold",
  outline:
    "bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold",
  "outline-dark":
    "bg-white/10 hover:bg-white/20 border border-white/25 text-white font-bold",
  destructive:
    "bg-red-600 hover:bg-red-700 text-white shadow-sm font-bold",
  "danger-outline":
    "bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 font-semibold",
};

const SIZE: Record<AppButtonSize, string> = {
  xs: "text-[10px] px-3 py-1.5 rounded-lg gap-1",
  sm: "text-xs px-4 py-2 rounded-xl gap-1.5",
  md: "text-sm px-5 py-2.5 rounded-xl gap-2",
  lg: "text-sm px-6 py-3 rounded-xl gap-2",
};

const ICON_SIZE: Record<AppButtonSize, string> = {
  xs: "w-3 h-3",
  sm: "w-3.5 h-3.5",
  md: "w-4 h-4",
  lg: "w-4 h-4",
};

export default function AppButton({
  variant = "primary",
  size = "md",
  loading = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  children,
  className = "",
  disabled,
  ...props
}: AppButtonProps) {
  const isDisabled = disabled || loading;
  const iconClass = `${ICON_SIZE[size]} flex-shrink-0`;

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${VARIANT[variant]} ${SIZE[size]} ${className}`}
    >
      {loading ? (
        <svg className={`animate-spin ${iconClass}`} fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : LeftIcon ? (
        <LeftIcon className={iconClass} />
      ) : null}
      {children}
      {!loading && RightIcon && <RightIcon className={iconClass} />}
    </button>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Loader2 } from "lucide-react";

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
  fullWidth?: boolean;
  iconOnly?: boolean;
}

const VARIANT: Record<AppButtonVariant, string> = {
  primary:
    "border border-transparent bg-[linear-gradient(135deg,#F2C94C_0%,#E7B82F_45%,#D6A21E_100%)] text-[#071C34] shadow-[0_10px_24px_rgba(231,184,47,0.26)] hover:-translate-y-px hover:brightness-[1.03]",
  "primary-college":
    "border border-transparent bg-[linear-gradient(135deg,#0A2748_0%,#123A63_55%,#184A79_100%)] text-white shadow-[0_10px_24px_rgba(7,28,52,0.24)] hover:-translate-y-px hover:brightness-[1.06]",
  secondary:
    "border border-[var(--erp-border)] bg-[var(--erp-surface-muted)] text-[var(--erp-text)] hover:bg-white hover:border-[var(--erp-accent)]/55",
  ghost:
    "border border-transparent bg-transparent text-[var(--erp-text-muted)] hover:bg-[var(--erp-surface-muted)] hover:text-[var(--erp-text)]",
  outline:
    "border border-[var(--erp-border)] bg-white text-[var(--erp-text)] hover:bg-[var(--erp-surface-muted)] hover:border-[var(--erp-accent)]/55",
  "outline-dark":
    "border border-white/18 bg-white/10 text-white hover:bg-white/16",
  destructive:
    "border border-transparent bg-red-600 text-white shadow-[0_10px_24px_rgba(220,38,38,0.18)] hover:-translate-y-px hover:bg-red-700",
  "danger-outline":
    "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
};

const SIZE: Record<AppButtonSize, string> = {
  xs: "min-h-8 rounded-lg px-3 py-1.5 text-[10px] gap-1",
  sm: "min-h-9 rounded-xl px-4 py-2 text-xs gap-1.5",
  md: "min-h-11 rounded-xl px-[18px] py-2.5 text-sm gap-2",
  lg: "min-h-12 rounded-2xl px-6 py-3 text-sm gap-2",
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
  fullWidth = false,
  iconOnly = false,
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
      className={[
        "inline-flex items-center justify-center font-semibold tracking-[0.01em] transition duration-150 ease-out cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--erp-brand)]/12",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:transform-none",
        fullWidth ? "w-full" : "",
        iconOnly ? "aspect-square px-0" : "",
        VARIANT[variant],
        SIZE[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {loading ? (
        <Loader2 className={`animate-spin ${iconClass}`} />
      ) : LeftIcon ? (
        <LeftIcon className={iconClass} />
      ) : null}
      {children}
      {!loading && RightIcon && <RightIcon className={iconClass} />}
    </button>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AppTone = "neutral" | "info" | "success" | "warning" | "danger" | "brand" | "purple";

export const APP_TONE_STYLES: Record<
  AppTone,
  {
    card: string;
    icon: string;
    text: string;
    accent: string;
    button: string;
  }
> = {
  neutral: {
    card: "bg-white border-[var(--erp-border)] text-[var(--erp-text)]",
    icon: "bg-slate-100 text-slate-600 border-slate-200",
    text: "text-[var(--erp-text)]",
    accent: "text-[var(--erp-text-muted)]",
    button: "bg-[var(--erp-brand)] hover:bg-[#123A63]",
  },
  info: {
    card: "bg-blue-50 border-blue-200 text-blue-900",
    icon: "bg-blue-100 text-blue-700 border-blue-200",
    text: "text-blue-900",
    accent: "text-blue-700",
    button: "bg-blue-600 hover:bg-blue-700",
  },
  success: {
    card: "bg-emerald-50 border-emerald-200 text-emerald-900",
    icon: "bg-emerald-100 text-emerald-700 border-emerald-200",
    text: "text-emerald-900",
    accent: "text-emerald-700",
    button: "bg-emerald-600 hover:bg-emerald-700",
  },
  warning: {
    card: "bg-amber-50 border-amber-200 text-amber-900",
    icon: "bg-amber-100 text-amber-700 border-amber-200",
    text: "text-amber-900",
    accent: "text-amber-700",
    button: "bg-amber-600 hover:bg-amber-700",
  },
  danger: {
    card: "bg-red-50 border-red-200 text-red-900",
    icon: "bg-red-100 text-red-700 border-red-200",
    text: "text-red-900",
    accent: "text-red-700",
    button: "bg-red-600 hover:bg-red-700",
  },
  brand: {
    card: "bg-[linear-gradient(180deg,#ffffff_0%,#fffdf6_100%)] border-[var(--erp-border)] text-[var(--erp-text)]",
    icon: "bg-[rgba(231,184,47,0.14)] text-[var(--erp-brand)] border-[rgba(231,184,47,0.28)]",
    text: "text-[var(--erp-text)]",
    accent: "text-[var(--erp-brand)]",
    button: "btn-primary-gradient",
  },
  purple: {
    card: "bg-violet-50 border-violet-200 text-violet-900",
    icon: "bg-violet-100 text-violet-700 border-violet-200",
    text: "text-violet-900",
    accent: "text-violet-700",
    button: "bg-violet-600 hover:bg-violet-700",
  },
};

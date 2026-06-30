/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const CONTROL_BASE_CLASSES = [
  "w-full rounded-xl border text-sm text-[var(--erp-text)] outline-none transition",
  "bg-[var(--erp-surface-muted)] placeholder:text-stone-400",
  "disabled:cursor-not-allowed disabled:opacity-60",
  "focus:bg-white focus:ring-4",
].join(" ");

export const CONTROL_SIZE_CLASSES = {
  md: "min-h-11 px-3.5 py-2.5",
  sm: "min-h-9 px-3 py-2 text-xs",
} as const;

export const CONTROL_STATE_CLASSES = {
  default:
    "border-[var(--erp-border)] focus:border-[var(--erp-brand)] focus:ring-[var(--erp-brand)]/10",
  error:
    "border-red-300 bg-red-50/70 focus:border-red-400 focus:ring-red-200/60",
} as const;

export const CONTROL_ICON_LEFT_PADDING = {
  md: "pl-10",
  sm: "pl-9",
} as const;

export const CONTROL_ICON_RIGHT_PADDING = {
  md: "pr-10",
  sm: "pr-9",
} as const;

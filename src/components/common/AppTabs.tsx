/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

export interface AppTabItem<TValue extends string> {
  value: TValue;
  label: string;
  badge?: string | number;
  disabled?: boolean;
}

interface AppTabsProps<TValue extends string> {
  items: AppTabItem<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
  variant?: "underline" | "pill";
  rightSlot?: React.ReactNode;
  className?: string;
  tabsClassName?: string;
}

export default function AppTabs<TValue extends string>({
  items,
  value,
  onChange,
  variant = "pill",
  rightSlot,
  className = "",
  tabsClassName = "",
}: AppTabsProps<TValue>) {
  const isUnderline = variant === "underline";

  return (
    <div
      className={`flex items-center gap-3 overflow-hidden rounded-2xl border border-[var(--erp-border)] bg-[linear-gradient(180deg,#ffffff_0%,#fffdf6_100%)] shadow-sm ${className}`}
    >
      <div
        className={`flex min-w-0 flex-1 ${
          isUnderline ? "items-stretch border-b border-[var(--erp-border)]" : "gap-1 p-1.5"
        } ${tabsClassName}`}
      >
        {items.map((item) => {
          const isActive = item.value === value;
          return (
            <button
              key={item.value}
              type="button"
              disabled={item.disabled}
              onClick={() => onChange(item.value)}
              className={[
                "inline-flex items-center justify-center gap-2 whitespace-nowrap text-xs font-semibold transition cursor-pointer",
                "disabled:cursor-not-allowed disabled:opacity-50",
                isUnderline
                  ? `flex-1 px-4 py-3 ${
                      isActive
                        ? "border-b-2 border-[var(--erp-accent)] bg-[linear-gradient(180deg,rgba(231,184,47,0.16)_0%,rgba(255,255,255,0)_100%)] text-[var(--erp-brand)]"
                        : "text-[var(--erp-text-muted)] hover:bg-[var(--erp-surface-muted)] hover:text-[var(--erp-text)]"
                    }`
                  : `rounded-xl px-4 py-2 ${
                      isActive
                        ? "bg-white text-[var(--erp-brand)] shadow-sm ring-1 ring-[rgba(231,184,47,0.34)]"
                        : "text-[var(--erp-text-muted)] hover:bg-[var(--erp-surface-muted)] hover:text-[var(--erp-text)]"
                    }`,
              ].join(" ")}
            >
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge !== null && item.badge !== "" && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    isActive
                      ? "bg-[var(--erp-accent)]/20 text-[var(--erp-brand)]"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {rightSlot && <div className="flex flex-shrink-0 items-center gap-2 px-3 py-2">{rightSlot}</div>}
    </div>
  );
}

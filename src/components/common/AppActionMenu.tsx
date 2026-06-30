/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import AppButton from "./AppButton";

export interface AppActionMenuItem {
  id: string;
  label: string;
  icon?: React.ElementType;
  onSelect: () => void;
  disabled?: boolean;
  tone?: "default" | "danger";
}

interface AppActionMenuProps {
  label: string;
  icon?: React.ElementType;
  items: AppActionMenuItem[];
  disabled?: boolean;
  className?: string;
  menuClassName?: string;
  align?: "left" | "right";
}

export default function AppActionMenu({
  label,
  icon,
  items,
  disabled = false,
  className = "",
  menuClassName = "",
  align = "right",
}: AppActionMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const alignmentClass = align === "left" ? "left-0" : "right-0";

  return (
    <div ref={ref} className={`relative ${className}`}>
      <AppButton
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        leftIcon={icon}
        rightIcon={ChevronDown}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {label}
      </AppButton>

      {open && (
        <div
          role="menu"
          className={`absolute ${alignmentClass} top-full z-50 mt-2 min-w-[190px] overflow-hidden rounded-2xl border border-[var(--erp-border)] bg-white p-1.5 shadow-[0_18px_40px_rgba(45,36,30,0.12)] animate-fade-in ${menuClassName}`}
        >
          {items.map((item) => {
            const Icon = item.icon;
            const toneClass =
              item.tone === "danger"
                ? "text-red-700 hover:bg-red-50"
                : "text-[var(--erp-text)] hover:bg-[var(--erp-surface-muted)]";

            return (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-medium transition ${toneClass} disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {Icon && <Icon className="h-3.5 w-3.5 flex-shrink-0" />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

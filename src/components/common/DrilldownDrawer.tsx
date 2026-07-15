/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

export interface DrilldownDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  /** Optional applied-filters summary shown below the title */
  filtersSummary?: string;
  /** Optional action slot rendered in the header right (e.g. export button) */
  headerAction?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  width?: "sm" | "md" | "lg" | "cashier";
  panelAs?: "div" | "form";
  onSubmit?: React.FormEventHandler<HTMLFormElement>;
  closeOnEscape?: boolean;
  bodyClassName?: string;
}

const WIDTH_CLASS: Record<NonNullable<DrilldownDrawerProps["width"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
  cashier: "max-w-[600px] lg:max-w-[min(600px,50vw)]",
};

export default function DrilldownDrawer({
  open,
  onClose,
  title,
  subtitle,
  filtersSummary,
  headerAction,
  children,
  footer,
  width = "md",
  panelAs = "div",
  onSubmit,
  closeOnEscape = true,
  bodyClassName = "",
}: DrilldownDrawerProps) {
  const panelRef = useRef<HTMLDivElement | HTMLFormElement | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusable = panel?.querySelector<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    );
    window.requestAnimationFrame(() => (focusable ?? panel)?.focus());
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && closeOnEscape) onClose();
      if (e.key !== "Tab" || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ));
      if (items.length === 0) { e.preventDefault(); panel.focus(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      returnFocusRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer panel */}
      {React.createElement(panelAs, {
        ref: panelRef,
        ...(panelAs === "form" ? { onSubmit } : {}),
        role: "dialog",
        "aria-modal": true,
        "aria-label": title,
        tabIndex: -1,
        className: `relative w-full ${WIDTH_CLASS[width]} bg-white shadow-2xl flex flex-col h-full animate-slide-in overflow-hidden`,
      },
        <>
        {/* Header */}
        <div className="modal-header-gradient text-white px-5 py-4 flex items-start justify-between gap-3 flex-shrink-0">
          <div className="min-w-0">
            <h2 className="font-display font-bold text-base leading-tight">{title}</h2>
            {subtitle && (
              <p className="text-[11px] text-white/70 mt-0.5">{subtitle}</p>
            )}
            {filtersSummary && (
              <p className="text-[10px] text-stsn-gold font-mono mt-1 leading-snug">
                {filtersSummary}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {headerAction}
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition"
              aria-label="Close drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className={`flex-1 overflow-y-auto p-5 bg-stsn-cream ${bodyClassName}`}>
          {children}
        </div>
        {footer && <div className="flex-shrink-0 border-t border-stone-200 bg-white px-5 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">{footer}</div>}
        </>,
      )}
    </div>
  );
}

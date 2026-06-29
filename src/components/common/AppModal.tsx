/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type PanelElement = "div" | "form";

interface AppModalProps {
  open: boolean;
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  icon?: React.ElementType;
  onClose: () => void;
  maxWidthClass?: string;
  headerClassName?: string;
  bodyClassName?: string;
  panelAs?: PanelElement;
  onSubmit?: React.FormEventHandler<HTMLFormElement>;
  closeLabel?: string;
}

export default function AppModal({
  open,
  title,
  eyebrow,
  children,
  footer,
  icon: Icon,
  onClose,
  maxWidthClass = "max-w-lg",
  headerClassName = "modal-header-gradient text-white",
  bodyClassName = "p-5",
  panelAs = "div",
  onSubmit,
  closeLabel = "Close modal",
}: AppModalProps) {
  if (!open) return null;

  const header = (
    <div className={`flex items-center justify-between gap-3 border-b border-black/5 px-5 py-4 ${headerClassName}`}>
      <div className="min-w-0 flex items-center gap-2.5">
        {Icon && <Icon className="w-5 h-5 text-[var(--erp-accent)] flex-shrink-0" />}
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] opacity-80">
              {eyebrow}
            </p>
          )}
          <h3 className="truncate text-[15px] font-bold tracking-tight">{title}</h3>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label={closeLabel}
        className="flex-shrink-0 rounded-xl border border-transparent p-2 text-current opacity-80 transition cursor-pointer hover:border-white/10 hover:bg-white/10 hover:opacity-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/15"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );

  const content = (
    <>
      {header}
      <div className={bodyClassName}>{children}</div>
      {footer && <div className="border-t border-[var(--erp-border)] bg-[var(--erp-surface-muted)] px-5 py-3.5">{footer}</div>}
    </>
  );

  const panelClass = `w-full overflow-hidden rounded-[1.1rem] border border-[var(--erp-border)] bg-white shadow-[0_28px_80px_rgba(45,36,30,0.24)] ${maxWidthClass}`;

  return createPortal(
    <div className="app-modal-backdrop z-[110] animate-fade-in">
      {panelAs === "form" ? (
        <form onSubmit={onSubmit} className={panelClass}>
          {content}
        </form>
      ) : (
        <div className={panelClass}>
          {content}
        </div>
      )}
    </div>,
    document.body,
  );
}

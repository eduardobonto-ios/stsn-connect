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
    <div className={`px-5 py-4 flex items-center justify-between gap-3 ${headerClassName}`}>
      <div className="min-w-0 flex items-center gap-2.5">
        {Icon && <Icon className="w-5 h-5 text-stsn-gold flex-shrink-0" />}
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-[9px] font-mono uppercase tracking-widest opacity-75">
              {eyebrow}
            </p>
          )}
          <h3 className="text-sm font-bold truncate">{title}</h3>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label={closeLabel}
        className="rounded-lg p-1.5 text-current opacity-80 hover:opacity-100 hover:bg-white/10 transition cursor-pointer flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );

  const content = (
    <>
      {header}
      <div className={bodyClassName}>{children}</div>
      {footer && <div className="px-5 py-3.5 bg-stsn-cream border-t border-stsn-beige">{footer}</div>}
    </>
  );

  const panelClass = `bg-white rounded-xl shadow-2xl w-full ${maxWidthClass} overflow-hidden border border-stone-200`;

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

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { createPortal } from "react-dom";
import { CheckCircle, AlertTriangle, XCircle, Info, X } from "lucide-react";

export type DialogVariant = "success" | "warning" | "danger" | "info";

export interface ToastItem {
  id: string;
  title?: string;
  message: string;
  variant: DialogVariant;
  duration: number;
}

export const VARIANT_STYLES: Record<
  DialogVariant,
  {
    icon: React.ElementType;
    iconColor: string;
    titleColor: string;
    bg: string;
    border: string;
    button: string;
  }
> = {
  success: {
    icon: CheckCircle,
    iconColor: "text-green-600",
    titleColor: "text-green-800",
    bg: "bg-green-50",
    border: "border-green-200",
    button: "bg-green-600 hover:bg-green-700",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-amber-600",
    titleColor: "text-amber-800",
    bg: "bg-amber-50",
    border: "border-amber-200",
    button: "bg-amber-500 hover:bg-amber-600",
  },
  danger: {
    icon: XCircle,
    iconColor: "text-red-600",
    titleColor: "text-red-800",
    bg: "bg-red-50",
    border: "border-red-200",
    button: "bg-red-600 hover:bg-red-700",
  },
  info: {
    icon: Info,
    iconColor: "text-stsn-brown",
    titleColor: "text-stsn-brown-dark",
    bg: "bg-stsn-cream",
    border: "border-stsn-beige",
    button: "btn-primary-gradient",
  },
};

interface AppToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function AppToastContainer({ toasts, onDismiss }: AppToastContainerProps) {
  if (toasts.length === 0) return null;

  return createPortal(
    <div className="fixed bottom-4 right-4 z-[120] flex flex-col gap-2 w-full max-w-sm px-4 sm:px-0 pointer-events-none">
      {toasts.map((t) => {
        const style = VARIANT_STYLES[t.variant];
        const Icon = style.icon;
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border p-3.5 pr-2 shadow-[0_18px_40px_rgba(45,36,30,0.14)] animate-fade-in ${style.bg} ${style.border}`}
          >
            <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${style.iconColor}`} />
            <div className="flex-1 min-w-0">
              {t.title && (
                <p className={`text-xs font-bold ${style.titleColor}`}>{t.title}</p>
              )}
              <p className="text-xs text-stone-700 mt-0.5 leading-snug break-words">
                {t.message}
              </p>
            </div>
            <button
              onClick={() => onDismiss(t.id)}
              className="flex-shrink-0 rounded-xl border border-transparent p-1.5 text-stone-400 transition hover:border-black/5 hover:bg-black/5 hover:text-stone-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>,
    document.body,
  );
}

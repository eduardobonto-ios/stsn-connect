/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { createPortal } from "react-dom";
import { VARIANT_STYLES, type DialogVariant } from "./AppToast";

export interface ConfirmDialogState {
  open: boolean;
  title?: string;
  message: string;
  variant?: DialogVariant;
  confirmText?: string;
  cancelText?: string;
}

interface AppConfirmDialogProps extends ConfirmDialogState {
  onConfirm: () => void;
  onCancel: () => void;
}

export default function AppConfirmDialog({
  open,
  title,
  message,
  variant = "info",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}: AppConfirmDialogProps) {
  if (!open) return null;

  const style = VARIANT_STYLES[variant];
  const Icon = style.icon;

  return createPortal(
    <div className="app-modal-backdrop z-[110] animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-stone-200">
        <div className="modal-header-gradient text-white p-4 flex items-center gap-2.5">
          <Icon className="w-5 h-5 text-stsn-gold flex-shrink-0" />
          <h3 className="font-display font-semibold text-sm">
            {title || "Confirm Action"}
          </h3>
        </div>
        <div className="p-5">
          <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">
            {message}
          </p>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3.5 bg-stsn-cream border-t border-stsn-beige">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-bold rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-100 transition cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-bold rounded-lg text-white transition cursor-pointer ${style.button}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

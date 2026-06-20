/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { VARIANT_STYLES, type DialogVariant } from "./AppToast";

export interface PromptDialogState {
  open: boolean;
  title?: string;
  message?: string;
  defaultValue?: string;
  placeholder?: string;
  variant?: DialogVariant;
  confirmText?: string;
  cancelText?: string;
}

interface AppPromptDialogProps extends PromptDialogState {
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export default function AppPromptDialog({
  open,
  title,
  message,
  defaultValue = "",
  placeholder,
  variant = "info",
  confirmText = "Submit",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}: AppPromptDialogProps) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (open) setValue(defaultValue);
  }, [open, defaultValue]);

  if (!open) return null;

  const style = VARIANT_STYLES[variant];
  const Icon = style.icon;

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onConfirm(value);
        }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-stone-200"
      >
        <div className="modal-header-gradient text-white p-4 flex items-center gap-2.5">
          <Icon className="w-5 h-5 text-stsn-gold flex-shrink-0" />
          <h3 className="font-display font-semibold text-sm">
            {title || "Provide Input"}
          </h3>
        </div>
        <div className="p-5 space-y-2">
          {message && (
            <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">
              {message}
            </p>
          )}
          <input
            autoFocus
            type="text"
            value={value}
            placeholder={placeholder}
            onChange={(e) => setValue(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stsn-gold/50 focus:border-stsn-gold text-stone-800"
          />
        </div>
        <div className="flex justify-end gap-2 px-5 py-3.5 bg-stsn-cream border-t border-stsn-beige">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-bold rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-100 transition cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="submit"
            className={`px-4 py-2 text-xs font-bold rounded-lg text-white transition cursor-pointer ${style.button}`}
          >
            {confirmText}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { VARIANT_STYLES, type DialogVariant } from "./AppToast";
import AppModal from "./AppModal";

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

  return (
    <AppModal
      open={open}
      title={title || "Confirm Action"}
      icon={Icon}
      onClose={onCancel}
      maxWidthClass="max-w-sm"
      footer={
        <div className="flex justify-end gap-2">
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
      }
    >
      <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">
        {message}
      </p>
    </AppModal>
  );
}

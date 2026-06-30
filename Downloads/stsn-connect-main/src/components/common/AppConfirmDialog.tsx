/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { VARIANT_STYLES, type DialogVariant } from "./AppToast";
import AppButton from "./AppButton";
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
          <AppButton type="button" variant="secondary" size="sm" onClick={onCancel}>
            {cancelText}
          </AppButton>
          <AppButton
            type="button"
            variant={variant === "danger" ? "destructive" : variant === "warning" ? "primary" : "primary"}
            size="sm"
            onClick={onConfirm}
            className={variant === "warning" ? "bg-amber-500 text-white hover:bg-amber-600" : ""}
          >
            {confirmText}
          </AppButton>
        </div>
      }
    >
      <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">
        {message}
      </p>
    </AppModal>
  );
}

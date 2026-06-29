/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { VARIANT_STYLES, type DialogVariant } from "./AppToast";
import AppButton from "./AppButton";
import AppInput from "./AppInput";
import AppModal from "./AppModal";

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

  return (
    <AppModal
      open={open}
      title={title || "Provide Input"}
      icon={Icon}
      onClose={onCancel}
      maxWidthClass="max-w-sm"
      panelAs="form"
      onSubmit={(e) => {
        e.preventDefault();
        onConfirm(value);
      }}
      bodyClassName="p-5 space-y-2"
      footer={
        <div className="flex justify-end gap-2">
          <AppButton type="button" variant="secondary" size="sm" onClick={onCancel}>
            {cancelText}
          </AppButton>
          <AppButton
            type="submit"
            variant={variant === "danger" ? "destructive" : "primary"}
            size="sm"
            className={variant === "warning" ? "bg-amber-500 text-white hover:bg-amber-600" : ""}
          >
            {confirmText}
          </AppButton>
        </div>
      }
    >
      {message && (
        <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">
          {message}
        </p>
      )}
      <AppInput
        autoFocus
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        uiSize="md"
      />
    </AppModal>
  );
}

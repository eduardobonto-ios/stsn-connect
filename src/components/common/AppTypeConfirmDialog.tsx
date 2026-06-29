/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import AppButton from "./AppButton";
import AppInput from "./AppInput";
import AppModal from "./AppModal";

export interface TypeConfirmDialogState {
  open: boolean;
  title?: string;
  message?: string;
  confirmPhrase: string;
  confirmText?: string;
  cancelText?: string;
}

interface AppTypeConfirmDialogProps extends TypeConfirmDialogState {
  onConfirm: () => void;
  onCancel: () => void;
}

export default function AppTypeConfirmDialog({
  open,
  title,
  message,
  confirmPhrase,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}: AppTypeConfirmDialogProps) {
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (open) setTyped("");
  }, [open]);

  if (!open) return null;

  const matches = typed === confirmPhrase;

  return (
    <AppModal
      open={open}
      title={title || "Confirm Irreversible Action"}
      icon={AlertTriangle}
      onClose={onCancel}
      maxWidthClass="max-w-sm"
      headerClassName="bg-red-700 text-white"
      bodyClassName="p-5 space-y-3"
      footer={
        <div className="flex justify-end gap-2">
          <AppButton type="button" variant="secondary" size="sm" onClick={onCancel}>
            {cancelText}
          </AppButton>
          <AppButton
            type="button"
            onClick={onConfirm}
            disabled={!matches}
            variant="destructive"
            size="sm"
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
      <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
        <p className="text-[11px] text-red-700 font-semibold mb-1">
          This action cannot be undone.
        </p>
        <p className="text-[11px] text-stone-600">
          Type <span className="font-mono font-bold text-red-700 select-all">"{confirmPhrase}"</span> to confirm:
        </p>
      </div>
      <AppInput
        autoFocus
        type="text"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        placeholder={confirmPhrase}
        className={`font-mono ${
          typed.length > 0 && !matches
            ? "border-red-300 focus:ring-red-200 bg-red-50"
            : matches
            ? "border-emerald-400 focus:ring-emerald-100 bg-emerald-50"
            : ""
        }`}
        uiSize="md"
      />
    </AppModal>
  );
}

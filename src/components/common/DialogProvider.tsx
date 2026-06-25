/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useCallback, useRef, useState } from "react";
import AppConfirmDialog, { type ConfirmDialogState } from "./AppConfirmDialog";
import AppPromptDialog, { type PromptDialogState } from "./AppPromptDialog";
import AppTypeConfirmDialog, { type TypeConfirmDialogState } from "./AppTypeConfirmDialog";
import { AppToastContainer, type DialogVariant, type ToastItem } from "./AppToast";

export interface ToastOptions {
  title?: string;
  variant?: DialogVariant;
  duration?: number;
}

export interface ConfirmOptions {
  title?: string;
  variant?: DialogVariant;
  confirmText?: string;
  cancelText?: string;
}

export interface PromptOptions {
  title?: string;
  defaultValue?: string;
  placeholder?: string;
  variant?: DialogVariant;
  confirmText?: string;
  cancelText?: string;
}

export interface TypeConfirmOptions {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

export interface AppDialogContextValue {
  toast: (message: string, options?: ToastOptions) => void;
  alert: (message: string, options?: ToastOptions) => void;
  confirm: (message: string, options?: ConfirmOptions) => Promise<boolean>;
  prompt: (message: string, options?: PromptOptions) => Promise<string | null>;
  typeConfirm: (confirmPhrase: string, options?: TypeConfirmOptions) => Promise<boolean>;
}

export const AppDialogContext = createContext<AppDialogContextValue | null>(null);

const DEFAULT_TOAST_DURATION = 4000;

export default function DialogProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmDialogState | null>(null);
  const [promptState, setPromptState] = useState<PromptDialogState | null>(null);
  const [typeConfirmState, setTypeConfirmState] = useState<TypeConfirmDialogState | null>(null);

  const confirmResolver = useRef<((value: boolean) => void) | null>(null);
  const promptResolver = useRef<((value: string | null) => void) | null>(null);
  const typeConfirmResolver = useRef<((value: boolean) => void) | null>(null);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, options?: ToastOptions) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const duration = options?.duration ?? DEFAULT_TOAST_DURATION;
    setToasts((prev) => [
      ...prev,
      {
        id,
        message,
        title: options?.title,
        variant: options?.variant ?? "info",
        duration,
      },
    ]);
    setTimeout(() => dismissToast(id), duration);
  }, [dismissToast]);

  const alert = useCallback((message: string, options?: ToastOptions) => {
    toast(message, { variant: "info", ...options });
  }, [toast]);

  const confirm = useCallback((message: string, options?: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      confirmResolver.current = resolve;
      setConfirmState({ open: true, message, ...options });
    });
  }, []);

  const prompt = useCallback((message: string, options?: PromptOptions): Promise<string | null> => {
    return new Promise((resolve) => {
      promptResolver.current = resolve;
      setPromptState({ open: true, message, ...options });
    });
  }, []);

  const typeConfirm = useCallback((confirmPhrase: string, options?: TypeConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      typeConfirmResolver.current = resolve;
      setTypeConfirmState({ open: true, confirmPhrase, ...options });
    });
  }, []);

  const handleConfirmResolve = useCallback((value: boolean) => {
    confirmResolver.current?.(value);
    confirmResolver.current = null;
    setConfirmState(null);
  }, []);

  const handlePromptResolve = useCallback((value: string | null) => {
    promptResolver.current?.(value);
    promptResolver.current = null;
    setPromptState(null);
  }, []);

  const handleTypeConfirmResolve = useCallback((value: boolean) => {
    typeConfirmResolver.current?.(value);
    typeConfirmResolver.current = null;
    setTypeConfirmState(null);
  }, []);

  return (
    <AppDialogContext.Provider value={{ toast, alert, confirm, prompt, typeConfirm }}>
      {children}
      <AppToastContainer toasts={toasts} onDismiss={dismissToast} />
      {confirmState && (
        <AppConfirmDialog
          {...confirmState}
          onConfirm={() => handleConfirmResolve(true)}
          onCancel={() => handleConfirmResolve(false)}
        />
      )}
      {promptState && (
        <AppPromptDialog
          {...promptState}
          onConfirm={(value) => handlePromptResolve(value)}
          onCancel={() => handlePromptResolve(null)}
        />
      )}
      {typeConfirmState && (
        <AppTypeConfirmDialog
          {...typeConfirmState}
          onConfirm={() => handleTypeConfirmResolve(true)}
          onCancel={() => handleTypeConfirmResolve(false)}
        />
      )}
    </AppDialogContext.Provider>
  );
}

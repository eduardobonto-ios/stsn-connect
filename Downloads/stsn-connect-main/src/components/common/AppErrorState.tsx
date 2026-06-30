/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { AlertTriangle } from "lucide-react";
import AppButton from "./AppButton";

interface AppErrorStateProps {
  title?: string;
  description: string;
  onRetry?: () => void;
  retryLabel?: string;
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  compact?: boolean;
  className?: string;
}

export default function AppErrorState({
  title = "Something went wrong",
  description,
  onRetry,
  retryLabel = "Try again",
  secondaryAction,
  compact = false,
  className = "",
}: AppErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50/70 text-center ${
        compact ? "px-4 py-8" : "px-6 py-14"
      } ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-200 bg-white/80 shadow-sm">
        <AlertTriangle className={`text-red-600 ${compact ? "h-5 w-5" : "h-6 w-6"}`} />
      </div>
      <p className={`mt-4 font-bold text-red-900 ${compact ? "text-sm" : "text-base"}`}>{title}</p>
      <p className={`mt-1 max-w-sm leading-relaxed text-red-800/80 ${compact ? "text-xs" : "text-sm"}`}>
        {description}
      </p>
      {(onRetry || secondaryAction) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {onRetry && (
            <AppButton variant="destructive" size={compact ? "sm" : "md"} onClick={onRetry}>
              {retryLabel}
            </AppButton>
          )}
          {secondaryAction && (
            <AppButton
              variant="danger-outline"
              size={compact ? "sm" : "md"}
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </AppButton>
          )}
        </div>
      )}
    </div>
  );
}

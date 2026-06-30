/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import type { LucideIcon } from "lucide-react";
import AppButton from "./AppButton";
import type { AppTone } from "./ui-variants";
import { APP_TONE_STYLES } from "./ui-variants";

interface AppEmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
}

export interface AppEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  primaryAction?: AppEmptyStateAction;
  secondaryAction?: AppEmptyStateAction;
  compact?: boolean;
  tone?: AppTone;
  className?: string;
}

export default function AppEmptyState({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  compact = false,
  tone = "brand",
  className = "",
}: AppEmptyStateProps) {
  const toneStyle = APP_TONE_STYLES[tone];

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border text-center ${
        compact ? "px-4 py-8" : "px-6 py-14"
      } ${toneStyle.card} ${className}`}
    >
      <div
        className={`flex items-center justify-center rounded-2xl border shadow-sm ${
          compact ? "mb-4 h-12 w-12" : "mb-5 h-16 w-16"
        } ${toneStyle.icon}`}
      >
        <Icon className={compact ? "h-5 w-5" : "h-7 w-7"} />
      </div>
      <p className={`font-bold leading-tight ${compact ? "text-sm" : "text-base"} ${toneStyle.text}`}>{title}</p>
      <p
        className={`mt-1.5 max-w-sm leading-relaxed text-[var(--erp-text-muted)] ${
          compact ? "text-xs" : "text-sm"
        }`}
      >
        {description}
      </p>
      {(primaryAction || secondaryAction) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {primaryAction && (
            <AppButton
              variant={primaryAction.variant === "secondary" ? "secondary" : "primary"}
              size={compact ? "sm" : "md"}
              onClick={primaryAction.onClick}
            >
              {primaryAction.label}
            </AppButton>
          )}
          {secondaryAction && (
            <AppButton
              variant={secondaryAction.variant === "primary" ? "primary" : "secondary"}
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

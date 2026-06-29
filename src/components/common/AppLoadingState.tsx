/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Loader2 } from "lucide-react";

interface AppLoadingStateProps {
  title?: string;
  description?: string;
  compact?: boolean;
  className?: string;
}

export default function AppLoadingState({
  title = "Loading...",
  description = "Please wait while we prepare this view.",
  compact = false,
  className = "",
}: AppLoadingStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-[var(--erp-border)] bg-[var(--erp-surface)] text-center ${
        compact ? "px-4 py-8" : "px-6 py-14"
      } ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--erp-border)] bg-[var(--erp-surface-muted)]">
        <Loader2 className={`animate-spin text-[var(--erp-accent)] ${compact ? "h-5 w-5" : "h-6 w-6"}`} />
      </div>
      <p className={`mt-4 font-semibold text-[var(--erp-text)] ${compact ? "text-sm" : "text-base"}`}>{title}</p>
      <p className={`mt-1 max-w-sm leading-relaxed text-[var(--erp-text-muted)] ${compact ? "text-xs" : "text-sm"}`}>
        {description}
      </p>
    </div>
  );
}

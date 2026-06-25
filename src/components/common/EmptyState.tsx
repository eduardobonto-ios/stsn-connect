/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import type { LucideIcon } from "lucide-react";

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  compact?: boolean;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? "py-8 px-4" : "py-16 px-6"
      }`}
    >
      <div
        className={`rounded-2xl bg-gradient-to-br from-stsn-cream to-stone-100 border border-stone-200/60 flex items-center justify-center mb-4 shadow-inner ${
          compact ? "w-12 h-12" : "w-16 h-16"
        }`}
      >
        <Icon className={`text-stone-400 ${compact ? "w-5 h-5" : "w-7 h-7"}`} />
      </div>
      <p
        className={`font-display font-bold text-stone-600 leading-tight ${
          compact ? "text-sm" : "text-base"
        }`}
      >
        {title}
      </p>
      <p
        className={`text-stone-400 mt-1.5 max-w-xs leading-relaxed ${
          compact ? "text-xs" : "text-sm"
        }`}
      >
        {description}
      </p>
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
          {primaryAction && (
            <button
              onClick={primaryAction.onClick}
              className="btn-primary-gradient text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md hover:opacity-90 transition cursor-pointer"
            >
              {primaryAction.label} →
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="text-xs font-semibold px-4 py-2 rounded-xl border border-stone-200 bg-white text-stone-600 hover:bg-stsn-cream hover:border-stsn-beige transition cursor-pointer shadow-sm"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

import React from "react";
import AppButton from "../AppButton";

interface ProfileRepeatableEntryCardProps {
  eyebrow?: string;
  title: string;
  onRemove?: () => void;
  removeLabel?: string;
  children: React.ReactNode;
}

export default function ProfileRepeatableEntryCard({
  eyebrow,
  title,
  onRemove,
  removeLabel = "Remove",
  children,
}: ProfileRepeatableEntryCardProps) {
  return (
    <div className="rounded-2xl border border-[var(--erp-border)] bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          {eyebrow ? <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">{eyebrow}</p> : null}
          <p className="text-sm font-semibold text-[var(--erp-text)]">{title}</p>
        </div>
        {onRemove ? (
          <AppButton type="button" variant="danger-outline" size="xs" onClick={onRemove}>
            {removeLabel}
          </AppButton>
        ) : null}
      </div>
      {children}
    </div>
  );
}

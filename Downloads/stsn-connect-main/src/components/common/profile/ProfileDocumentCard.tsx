import React from "react";

interface ProfileDocumentCardProps {
  title: string;
  metadata?: Array<{ label: string; value: string }>;
  remarks?: string;
  badges?: React.ReactNode;
  actions?: React.ReactNode;
}

export default function ProfileDocumentCard({
  title,
  metadata = [],
  remarks,
  badges,
  actions,
}: ProfileDocumentCardProps) {
  return (
    <div className="rounded-2xl border border-[var(--erp-border)] bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[var(--erp-text)]">{title}</p>
          {metadata.map((item) => (
            <p key={`${item.label}:${item.value}`} className="text-xs text-[var(--erp-text-muted)]">
              {item.label}: {item.value}
            </p>
          ))}
          {remarks ? <p className="text-xs text-red-600">Remarks: {remarks}</p> : null}
        </div>
        {badges ? <div className="flex flex-wrap gap-2">{badges}</div> : null}
      </div>
      {actions ? <div className="mt-4 flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

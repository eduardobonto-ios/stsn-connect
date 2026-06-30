import React from "react";

interface ProfileSectionCardProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export default function ProfileSectionCard({
  title,
  description,
  action,
  children,
  className = "",
}: ProfileSectionCardProps) {
  return (
    <section className={`space-y-4 rounded-2xl border border-[var(--erp-border)] bg-white p-4 shadow-sm ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-[var(--erp-text)]">{title}</h4>
          {description ? <p className="text-xs text-[var(--erp-text-muted)]">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

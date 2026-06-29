import React from "react";

interface PageHeaderProps {
  icon: React.ElementType;
  title: string;
  description: string;
  children?: React.ReactNode;
}

export default function PageHeader({ icon: Icon, title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[var(--erp-border)] bg-[linear-gradient(180deg,#ffffff_0%,#fffdf6_100%)] p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-xl font-sans font-semibold tracking-tight text-[var(--erp-text)]">
          <Icon className="h-5 w-5 text-[var(--erp-brand)]" />
          {title}
        </h2>
        <p className="mt-1.5 max-w-3xl text-xs leading-relaxed text-[var(--erp-text-muted)]">{description}</p>
      </div>
      {children}
    </div>
  );
}

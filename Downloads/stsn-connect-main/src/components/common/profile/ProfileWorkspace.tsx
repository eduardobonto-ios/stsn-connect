import React from "react";
import type { AppTabItem } from "../AppTabs";
import AppCard from "../AppCard";
import ProfileTabs from "./ProfileTabs";

interface ProfileWorkspaceProps<TValue extends string> {
  eyebrow: string;
  title: string;
  statusBadges?: React.ReactNode;
  actions?: React.ReactNode;
  successMessage?: string;
  tabs: AppTabItem<TValue>[];
  activeTab: TValue;
  onTabChange: (value: TValue) => void;
  children: React.ReactNode;
}

export default function ProfileWorkspace<TValue extends string>({
  eyebrow,
  title,
  statusBadges,
  actions,
  successMessage,
  tabs,
  activeTab,
  onTabChange,
  children,
}: ProfileWorkspaceProps<TValue>) {
  return (
    <AppCard tone="brand" className="space-y-5">
      <div className="flex flex-col gap-4 border-b border-[var(--erp-border)] pb-5 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--erp-text-muted)]">{eyebrow}</p>
            <h3 className="mt-1 text-xl font-semibold text-[var(--erp-text)]">{title}</h3>
          </div>
          {statusBadges ? <div className="flex flex-wrap gap-2">{statusBadges}</div> : null}
        </div>
        {actions ? <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-start lg:w-auto lg:flex-nowrap lg:justify-end lg:self-start">{actions}</div> : null}
      </div>

      {successMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {successMessage}
        </div>
      ) : null}

      <ProfileTabs items={tabs} value={activeTab} onChange={onTabChange} />

      {children}
    </AppCard>
  );
}

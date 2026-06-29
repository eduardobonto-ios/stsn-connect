/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { AlertTriangle, CheckCircle, ClipboardList, Clock, Info } from "lucide-react";
import ApprovalInbox, { type NavigateTarget } from "../../../components/common/ApprovalInbox";
import AppCard from "../../../components/common/AppCard";
import AppEmptyState from "../../../components/common/AppEmptyState";
import AppKpiCard from "../../../components/common/AppKpiCard";
import { usePendingCounts } from "../../../hooks/usePendingCounts";
import ModulePageHeader from "../../../components/common/ModulePageHeader";

interface ActionCenterPageProps {
  onNavigate: (target: NavigateTarget) => void;
}

export default function ActionCenterPage({ onNavigate }: ActionCenterPageProps) {
  const counts = usePendingCounts();

  const summaryCards = [
    {
      label: "Total Pending",
      value: counts.totalForRole,
      hint: "Items requiring role action",
      icon: ClipboardList,
      tone: counts.totalForRole > 0 ? "text-amber-700 bg-amber-50 border-amber-200" : "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    {
      label: "Accounting Review",
      value: counts.pendingAssessments + counts.pendingDiscounts + counts.pendingVoidRequests,
      hint: "Assessments, discounts, voids",
      icon: AlertTriangle,
      tone: "text-sky-700 bg-sky-50 border-sky-200",
    },
    {
      label: "Registrar / Grades",
      value: counts.pendingEnrollments + counts.pendingApplications + counts.pendingGrades,
      hint: "Enrollment and grade submissions",
      icon: Clock,
      tone: "text-violet-700 bg-violet-50 border-violet-200",
    },
    {
      label: "HR / Payroll",
      value: counts.pendingLeaves + counts.pendingPayrollRuns,
      hint: "Leave and payroll reviews",
      icon: CheckCircle,
      tone: "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
  ];
  const operationalMetrics = [
    {
      label: "Approvals",
      value: counts.totalForRole,
      detail: "Items currently waiting for your action.",
      emphasis: "text-white",
    },
    {
      label: "Overdue Risk",
      value: counts.pendingVoidRequests + counts.pendingPayrollRuns,
      detail: "Payroll and void items that deserve a closer review.",
      emphasis: "text-[var(--color-stsn-gold-light)]",
    },
    {
      label: "Academic Queue",
      value: counts.pendingEnrollments + counts.pendingApplications + counts.pendingGrades,
      detail: "Registrar and academic workflow items still in motion.",
      emphasis: "text-white",
    },
  ];
  const hasOperationalWork = operationalMetrics.some((metric) => metric.value > 0);

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <ModulePageHeader
        badge="Work Queue"
        title="Action Center"
        subtitle="Centralized approval queue for items that need review. Dashboards stay focused on analytics, while operational decisions live here."
        meta={counts.totalForRole > 0 ? `${counts.totalForRole} pending item${counts.totalForRole > 1 ? "s" : ""}` : undefined}
      />

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          return (
            <AppKpiCard
              key={card.label}
              label={card.label}
              value={card.value}
              hint={card.hint}
              icon={card.icon}
              className={card.tone}
            />
          );
        })}
      </section>

      <AppCard className="bg-[linear-gradient(135deg,rgba(7,28,52,0.98)_0%,rgba(10,39,72,0.96)_55%,rgba(18,58,99,0.92)_100%)] text-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1.5">
            <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-[rgba(242,201,76,0.82)]">
              Operational Focus
            </p>
            <h2 className="text-lg font-bold tracking-tight text-white">
              Keep approvals moving without leaving the work queue.
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-white/72">
              Counts, filters, tabs, and drawer actions remain unchanged. This pass only strengthens the visual hierarchy so reviewers can scan priority work faster.
            </p>
          </div>
          <div className="lg:min-w-[420px]">
            {hasOperationalWork ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {operationalMetrics.map((metric) => (
                  <div key={metric.label} className="rounded-2xl border border-white/12 bg-white/8 px-4 py-3">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-white/55">{metric.label}</p>
                    <p className={`mt-1 text-2xl font-black ${metric.emphasis}`}>{metric.value}</p>
                    <p className="mt-1 text-[10px] leading-relaxed text-white/60">{metric.detail}</p>
                  </div>
                ))}
              </div>
            ) : (
              <AppEmptyState
                icon={Info}
                title="No approval backlog right now"
                description="The queue is clear for your role. New approvals will appear here automatically when work enters the pipeline."
                compact
                tone="neutral"
                className="border-white/12 bg-white/8"
              />
            )}
          </div>
        </div>
      </AppCard>

      <ApprovalInbox onNavigate={onNavigate} />
    </div>
  );
}

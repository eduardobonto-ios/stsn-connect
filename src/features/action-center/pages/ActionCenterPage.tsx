/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { AlertTriangle, CheckCircle, ClipboardList, Clock, GraduationCap, Info } from "lucide-react";
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
      label: "Approval Queue",
      value: counts.totalForRole,
      detail: "Items currently waiting for your action.",
      icon: ClipboardList,
      tone: "info" as const,
    },
    {
      label: "Overdue Risk",
      value: counts.pendingVoidRequests + counts.pendingPayrollRuns,
      detail: "Payroll and void items that deserve a closer review.",
      icon: AlertTriangle,
      tone: "warning" as const,
    },
    {
      label: "Academic Queue",
      value: counts.pendingEnrollments + counts.pendingApplications + counts.pendingGrades,
      detail: "Registrar and academic workflow items still in motion.",
      icon: GraduationCap,
      tone: "purple" as const,
    },
  ];
  const activeOperationalMetrics = operationalMetrics.filter((metric) => metric.value > 0);
  const hasOperationalWork = operationalMetrics.some((metric) => metric.value > 0);
  const operationalGridColumns =
    activeOperationalMetrics.length >= 3
      ? "grid-cols-1 sm:grid-cols-3"
      : activeOperationalMetrics.length === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : "grid-cols-1";

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

      <AppCard className="overflow-hidden bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(255,253,246,0.98)_48%,rgba(248,242,228,0.96)_100%)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1.5">
            <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-[var(--erp-text-muted)]">
              Operational Focus
            </p>
            <h2 className="text-lg font-bold tracking-tight text-[var(--erp-text)]">
              Keep approvals moving without leaving the work queue.
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-[var(--erp-text-muted)]">
              Counts, filters, tabs, and drawer actions remain unchanged. This pass only strengthens the visual hierarchy so reviewers can scan priority work faster.
            </p>
          </div>
          <div className="lg:min-w-[420px]">
            {hasOperationalWork ? (
              <div className={`grid gap-3 ${operationalGridColumns}`}>
                {activeOperationalMetrics.map((metric) => (
                  <AppKpiCard
                    key={metric.label}
                    label={metric.label}
                    value={metric.value}
                    hint={metric.detail}
                    icon={metric.icon}
                    tone={metric.tone}
                  />
                ))}
              </div>
            ) : (
              <AppEmptyState
                icon={Info}
                title="No approval backlog right now"
                description="The queue is clear for your role. New approvals will appear here automatically when work enters the pipeline."
                compact
                tone="neutral"
              />
            )}
          </div>
        </div>
      </AppCard>

      <ApprovalInbox onNavigate={onNavigate} />
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { AlertTriangle, CheckCircle, ClipboardList, Clock } from "lucide-react";
import ApprovalInbox, { type NavigateTarget } from "../../../components/common/ApprovalInbox";
import { usePendingCounts } from "../../../hooks/usePendingCounts";

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

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <section className="bg-white border border-stsn-beige rounded-2xl shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <p className="text-[9px] font-mono uppercase tracking-widest text-stsn-gold font-bold">
              Work Queue
            </p>
            <h2 className="text-2xl font-display font-black text-stsn-brown-dark mt-1">
              Action Center
            </h2>
            <p className="text-sm text-stone-500 mt-1 max-w-2xl">
              Centralized approval queue for items that need review. Dashboards stay focused on analytics, while operational decisions live here.
            </p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
            <span className="text-[9px] font-mono uppercase tracking-widest text-stone-400 block">
              Queue Status
            </span>
            <span className="text-sm font-bold text-stone-800">
              {counts.totalForRole > 0 ? `${counts.totalForRole} pending item${counts.totalForRole > 1 ? "s" : ""}` : "All caught up"}
            </span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`rounded-xl border p-4 shadow-sm ${card.tone}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider opacity-75">
                    {card.label}
                  </p>
                  <p className="text-2xl font-display font-black mt-1">
                    {card.value}
                  </p>
                  <p className="text-[10px] font-semibold opacity-75 mt-1">
                    {card.hint}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/70 border border-white/70 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <ApprovalInbox onNavigate={onNavigate} />
    </div>
  );
}

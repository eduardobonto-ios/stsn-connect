/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Centralized approval inbox with six DB-backed tabs.
 * Reads from approval_requests (Supabase) via useApprovalInbox hook.
 */

import React, { useState } from "react";
import {
  Inbox,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Send,
  Archive,
  Clock,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import ApprovalDetailDrawer from "./ApprovalDetailDrawer";
import AppButton from "./AppButton";
import AppCard from "./AppCard";
import AppLoadingState from "./AppLoadingState";
import AppStatusBadge from "./AppStatusBadge";
import AppTabs, { type AppTabItem } from "./AppTabs";
import EmptyState from "./EmptyState";
import { useApprovalInbox } from "../../hooks/useApprovalInbox";
import type { ApprovalRequestRow } from "../../services/approvalWorkflowService";
import type { STSNModule } from "../../config/navigation.config";
import type { SchoolId } from "../../types";
import { useSTSNStore } from "../../services/store";

export interface NavigateTarget {
  module: STSNModule;
  subPage?: string;
}

interface ApprovalInboxProps {
  onNavigate: (target: NavigateTarget) => void;
}

type TabKey =
  | "forMyApproval"
  | "forMyReview"
  | "returnedToMe"
  | "submittedByMe"
  | "completed"
  | "overdue";

interface TabDef {
  key: TabKey;
  label: string;
  icon: LucideIcon;
  emptyTitle: string;
  emptyDesc: string;
}

const TABS: TabDef[] = [
  {
    key: "forMyApproval",
    label: "For My Approval",
    icon: CheckCircle,
    emptyTitle: "No pending approvals",
    emptyDesc: "Items submitted to your approval queue will appear here.",
  },
  {
    key: "forMyReview",
    label: "For My Review",
    icon: Inbox,
    emptyTitle: "Nothing to review",
    emptyDesc: "Items visible to your role but pending a higher approval level will appear here.",
  },
  {
    key: "returnedToMe",
    label: "Returned",
    icon: RotateCcw,
    emptyTitle: "No returned items",
    emptyDesc: "Items returned for correction will appear here.",
  },
  {
    key: "submittedByMe",
    label: "Submitted by Me",
    icon: Send,
    emptyTitle: "No submissions yet",
    emptyDesc: "Approval requests you have created will appear here.",
  },
  {
    key: "completed",
    label: "Completed",
    icon: Archive,
    emptyTitle: "No completed items",
    emptyDesc: "Approved, rejected, and cancelled requests will appear here.",
  },
  {
    key: "overdue",
    label: "Overdue",
    icon: AlertTriangle,
    emptyTitle: "No overdue items",
    emptyDesc: "Requests past their SLA deadline will appear here.",
  },
];

const WORKFLOW_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  assessment: { label: "ASMT", bg: "bg-sky-100", text: "text-sky-700" },
  discount: { label: "DISC", bg: "bg-violet-100", text: "text-violet-700" },
  enrollment: { label: "ENR", bg: "bg-amber-100", text: "text-amber-700" },
  online_application: { label: "APP", bg: "bg-orange-100", text: "text-orange-700" },
  leave_request: { label: "LEAVE", bg: "bg-teal-100", text: "text-teal-700" },
  payroll_run: { label: "P/R", bg: "bg-emerald-100", text: "text-emerald-700" },
  grade_period: { label: "GRADE", bg: "bg-rose-100", text: "text-rose-700" },
  payment_void: { label: "VOID", bg: "bg-red-100", text: "text-red-700" },
};

const SCHOOL_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  STSN: { label: "STSN", bg: "bg-stsn-gold/10", text: "text-stsn-brown" },
  CDSTA: { label: "CDSTA", bg: "bg-blue-50", text: "text-blue-700" },
};

function getAge(dateStr?: string): { label: string; pillClass: string; isOverdue: boolean } {
  if (!dateStr) return { label: "-", pillClass: "text-stone-300", isOverdue: false };
  const ms = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 3) return { label: `${days}d`, pillClass: "text-red-600 bg-red-50 font-bold ring-1 ring-red-200", isOverdue: true };
  if (days >= 1) return { label: `${days}d`, pillClass: "text-amber-600 bg-amber-50", isOverdue: false };
  if (hours >= 1) return { label: `${hours}h`, pillClass: "text-emerald-600 bg-emerald-50", isOverdue: false };
  return { label: "< 1h", pillClass: "text-emerald-600 bg-emerald-50", isOverdue: false };
}

interface RowProps {
  item: ApprovalRequestRow;
  showSchoolBadge: boolean;
  showStatus: boolean;
  onOpen: (id: string) => void;
}

function ApprovalRow({ item, showSchoolBadge, showStatus, onOpen }: RowProps) {
  const wfCfg = WORKFLOW_CONFIG[item.workflow_type] ?? {
    label: item.workflow_type.toUpperCase().slice(0, 5),
    bg: "bg-stone-100",
    text: "text-stone-600",
  };
  const age = getAge(item.submitted_at ?? item.created_at);
  const schoolCfg = item.school_id ? SCHOOL_BADGE[item.school_id as SchoolId] : null;
  const isDueOverdue =
    item.due_at &&
    !["Approved", "Rejected", "Cancelled", "Voided"].includes(item.status) &&
    new Date(item.due_at) < new Date();

  return (
    <div
      className={`group flex cursor-pointer items-center gap-3 rounded-2xl border border-transparent px-4 py-3 transition-all ${
        isDueOverdue
          ? "border-red-100 bg-red-50/45 hover:bg-red-50/70"
          : age.isOverdue
            ? "border-red-100/60 bg-red-50/30 hover:bg-red-50/55"
            : "hover:border-[var(--erp-border)] hover:bg-[var(--erp-surface-muted)]/70"
      }`}
      onClick={() => onOpen(item.id)}
    >
      <span className={`w-12 flex-shrink-0 rounded-md px-1.5 py-0.5 text-center text-[9px] font-bold tracking-wide ${wfCfg.bg} ${wfCfg.text}`}>
        {wfCfg.label}
      </span>

      <span className="flex-1 truncate text-[12px] font-semibold text-stsn-brown-dark">
        {item.request_title}
      </span>

      {showStatus && <AppStatusBadge status={item.status} className="flex-shrink-0" />}

      {showSchoolBadge && (
        <span
          className={`w-14 flex-shrink-0 rounded-md px-1.5 py-0.5 text-center text-[8.5px] font-bold ${
            schoolCfg ? `${schoolCfg.bg} ${schoolCfg.text}` : "text-stone-300"
          }`}
        >
          {schoolCfg ? schoolCfg.label : "-"}
        </span>
      )}

      <span className={`w-12 flex-shrink-0 rounded-full px-2 py-0.5 text-right text-[9.5px] font-semibold ${age.pillClass}`}>
        {age.label}
      </span>

      <button
        onClick={(event) => {
          event.stopPropagation();
          onOpen(item.id);
        }}
        title="View details"
        className="flex-shrink-0 rounded-lg p-1.5 text-stone-300 transition-colors hover:bg-stsn-gold/10 hover:text-stsn-brown group-hover:text-stone-400"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function ApprovalInbox({ onNavigate: _onNavigate }: ApprovalInboxProps) {
  const { activeSchool } = useSTSNStore();
  const inbox = useApprovalInbox();

  const [activeTab, setActiveTab] = useState<TabKey>("forMyApproval");
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const showSchoolBadge = activeSchool === "ALL";

  const tabItems: Record<TabKey, ApprovalRequestRow[]> = {
    forMyApproval: inbox.forMyApproval,
    forMyReview: inbox.forMyReview,
    returnedToMe: inbox.returnedToMe,
    submittedByMe: inbox.submittedByMe,
    completed: inbox.completed,
    overdue: inbox.overdue,
  };

  const currentItems = tabItems[activeTab];
  const showStatus = activeTab !== "forMyApproval" && activeTab !== "forMyReview";
  const overdueCount = inbox.overdue.length;
  const activeDef = TABS.find((tab) => tab.key === activeTab)!;
  const tabConfig: AppTabItem<TabKey>[] = TABS.map((tab) => ({
    value: tab.key,
    label: tab.label,
    badge: tabItems[tab.key].length || undefined,
  }));

  return (
    <>
      <AppCard className="mb-6 overflow-hidden" padded={false}>
        <div className="flex flex-col gap-3 border-b border-[var(--erp-border)]/70 bg-gradient-to-r from-white to-stone-50/60 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border border-stsn-gold/20 bg-stsn-gold/10">
              <Inbox className="h-4 w-4 text-stsn-gold" />
            </div>
            <div>
              <h3 className="text-sm font-bold leading-none text-stsn-brown-dark">Approval Queue</h3>
              <p className="mt-0.5 text-[10.5px] leading-none text-stone-400">
                Centralized approval queue for approvals, reviews, returns, and SLA follow-up.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            {overdueCount > 0 && (
              <span className="flex items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-600">
                <AlertTriangle className="h-3 w-3" />
                {overdueCount} overdue
              </span>
            )}
            <AppButton
              onClick={inbox.refresh}
              disabled={inbox.loading}
              title="Refresh queue"
              variant="secondary"
              size="sm"
              loading={inbox.loading}
              leftIcon={RefreshCw}
            >
              Refresh
            </AppButton>
          </div>
        </div>

        <div className="px-4 pt-4">
          <AppTabs
            items={tabConfig}
            value={activeTab}
            onChange={(value) => setActiveTab(value as TabKey)}
            variant="pill"
            className="rounded-none border-none bg-transparent shadow-none"
            tabsClassName="overflow-x-auto pb-1"
          />
        </div>

        {inbox.loading && (
          <div className="px-5 py-6">
            <AppLoadingState
              compact
              title={`Loading ${activeDef.label}`}
              description="Fetching the latest approval queue from the current role scope."
            />
          </div>
        )}

        {!inbox.loading && currentItems.length === 0 && (
          <EmptyState
            icon={activeDef.icon}
            title={activeDef.emptyTitle}
            description={activeDef.emptyDesc}
            compact
          />
        )}

        {!inbox.loading && currentItems.length > 0 && (
          <>
            <div className="flex items-center gap-3 border-b border-[var(--erp-border)]/70 bg-[var(--erp-surface-muted)]/70 px-5 py-2">
              <span className="w-12 flex-shrink-0 text-[8.5px] font-bold uppercase tracking-widest text-stone-400">Type</span>
              <span className="flex-1 text-[8.5px] font-bold uppercase tracking-widest text-stone-400">Request</span>
              {showStatus && <span className="flex-shrink-0 text-[8.5px] font-bold uppercase tracking-widest text-stone-400">Status</span>}
              {showSchoolBadge && <span className="w-14 flex-shrink-0 text-[8.5px] font-bold uppercase tracking-widest text-stone-400">School</span>}
              <span className="w-12 flex-shrink-0 text-right text-[8.5px] font-bold uppercase tracking-widest text-stone-400">Age</span>
              <span className="w-7 flex-shrink-0" />
            </div>

            <div className="space-y-1 p-3">
              {currentItems.map((item) => (
                <ApprovalRow
                  key={item.id}
                  item={item}
                  showSchoolBadge={showSchoolBadge}
                  showStatus={showStatus}
                  onOpen={(id) => setSelectedRequestId(id)}
                />
              ))}
            </div>
          </>
        )}

        {!inbox.loading && currentItems.length > 0 && (
          <div className="flex items-center justify-between border-t border-[var(--erp-border)]/70 bg-[var(--erp-surface-muted)]/40 px-5 py-2.5">
            <p className="text-[9.5px] font-mono text-stone-400">
              {overdueCount > 0
                ? `${overdueCount} item${overdueCount > 1 ? "s" : ""} past SLA`
                : "All items within SLA"}
            </p>
            <div className="flex items-center gap-1 text-[9.5px] text-stone-400">
              <Clock className="h-3 w-3" />
              <span>Sorted by due date</span>
            </div>
          </div>
        )}
      </AppCard>

      <ApprovalDetailDrawer
        requestId={selectedRequestId}
        onClose={() => setSelectedRequestId(null)}
        onActionComplete={inbox.refresh}
      />
    </>
  );
}

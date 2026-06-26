/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Centralized approval inbox with six DB-backed tabs.
 * Reads from approval_requests (Supabase) via useApprovalInbox hook.
 * Reference: STSN_APPROVAL_WORKFLOW_BEST_PRACTICE_PROCESS.md §10.2 — Phase 4
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
import EmptyState from "./EmptyState";
import ApprovalDetailDrawer from "./ApprovalDetailDrawer";
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

// ── Tab definition ────────────────────────────────────────────────────────────

type TabKey = "forMyApproval" | "forMyReview" | "returnedToMe" | "submittedByMe" | "completed" | "overdue";

interface TabDef {
  key: TabKey;
  label: string;
  icon: React.ElementType;
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

// ── Workflow type display config ──────────────────────────────────────────────

const WORKFLOW_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  assessment:         { label: "ASMT",  bg: "bg-sky-100",     text: "text-sky-700"     },
  discount:           { label: "DISC",  bg: "bg-violet-100",  text: "text-violet-700"  },
  enrollment:         { label: "ENR",   bg: "bg-amber-100",   text: "text-amber-700"   },
  online_application: { label: "APP",   bg: "bg-orange-100",  text: "text-orange-700"  },
  leave_request:      { label: "LEAVE", bg: "bg-teal-100",    text: "text-teal-700"    },
  payroll_run:        { label: "P/R",   bg: "bg-emerald-100", text: "text-emerald-700" },
  grade_period:       { label: "GRADE", bg: "bg-rose-100",    text: "text-rose-700"    },
  payment_void:       { label: "VOID",  bg: "bg-red-100",     text: "text-red-700"     },
};

const STATUS_PILL: Record<string, string> = {
  Draft:       "text-stone-500 bg-stone-100",
  Submitted:   "text-amber-700 bg-amber-100",
  "In Review": "text-sky-700 bg-sky-100",
  Returned:    "text-orange-700 bg-orange-100",
  Resubmitted: "text-indigo-700 bg-indigo-100",
  Approved:    "text-emerald-700 bg-emerald-100",
  Rejected:    "text-red-700 bg-red-100",
  Cancelled:   "text-stone-500 bg-stone-100",
  Voided:      "text-red-700 bg-red-100",
};

const SCHOOL_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  STSN:  { label: "STSN",  bg: "bg-stsn-gold/10", text: "text-stsn-brown"  },
  CDSTA: { label: "CDSTA", bg: "bg-blue-50",       text: "text-blue-700"   },
};

// ── Age helper ────────────────────────────────────────────────────────────────

function getAge(dateStr?: string): { label: string; pillClass: string; isOverdue: boolean } {
  if (!dateStr) return { label: "—", pillClass: "text-stone-300", isOverdue: false };
  const ms = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 3)   return { label: `${days}d`,  pillClass: "text-red-600 bg-red-50 font-bold ring-1 ring-red-200", isOverdue: true  };
  if (days >= 1)  return { label: `${days}d`,  pillClass: "text-amber-600 bg-amber-50",                           isOverdue: false };
  if (hours >= 1) return { label: `${hours}h`, pillClass: "text-emerald-600 bg-emerald-50",                       isOverdue: false };
  return               { label: "< 1h",       pillClass: "text-emerald-600 bg-emerald-50",                        isOverdue: false };
}

// ── Row component ─────────────────────────────────────────────────────────────

interface RowProps {
  item: ApprovalRequestRow;
  showSchoolBadge: boolean;
  showStatus: boolean;
  onOpen: (id: string) => void;
}

function ApprovalRow({ item, showSchoolBadge, showStatus, onOpen }: RowProps) {
  const wfCfg = WORKFLOW_CONFIG[item.workflow_type] ?? { label: item.workflow_type.toUpperCase().slice(0, 5), bg: "bg-stone-100", text: "text-stone-600" };
  const age = getAge(item.submitted_at ?? item.created_at);
  const schoolCfg = item.school_id ? SCHOOL_BADGE[item.school_id as SchoolId] : null;
  const statusPill = STATUS_PILL[item.status] ?? "text-stone-500 bg-stone-100";
  const isDueOverdue = item.due_at && !["Approved", "Rejected", "Cancelled", "Voided"].includes(item.status) && new Date(item.due_at) < new Date();

  return (
    <div
      className={`px-5 py-3 flex items-center gap-3 hover:bg-stone-50/80 transition-colors group cursor-pointer ${
        isDueOverdue ? "bg-red-50/20 hover:bg-red-50/40" : age.isOverdue ? "bg-red-50/20 hover:bg-red-50/40" : ""
      }`}
      onClick={() => onOpen(item.id)}
    >
      {/* Workflow type badge */}
      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 w-12 text-center tracking-wide ${wfCfg.bg} ${wfCfg.text}`}>
        {wfCfg.label}
      </span>

      {/* Title */}
      <span className="text-[12px] font-semibold text-stsn-brown-dark flex-1 truncate">
        {item.request_title}
      </span>

      {/* Status pill (shown on non-pending tabs) */}
      {showStatus && (
        <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${statusPill}`}>
          {item.status.toUpperCase()}
        </span>
      )}

      {/* School badge (ALL view only) */}
      {showSchoolBadge && (
        <span className={`w-14 flex-shrink-0 text-center text-[8.5px] font-bold px-1.5 py-0.5 rounded-md ${
          schoolCfg ? `${schoolCfg.bg} ${schoolCfg.text}` : "text-stone-300"
        }`}>
          {schoolCfg ? schoolCfg.label : "—"}
        </span>
      )}

      {/* Age */}
      <span className={`text-[9.5px] font-semibold px-2 py-0.5 rounded-full w-12 flex-shrink-0 text-right ${age.pillClass}`}>
        {age.label}
      </span>

      {/* Open drawer button */}
      <button
        onClick={(e) => { e.stopPropagation(); onOpen(item.id); }}
        title="View details"
        className="p-1.5 rounded-lg hover:bg-stsn-gold/10 text-stone-300 hover:text-stsn-brown transition-colors flex-shrink-0 group-hover:text-stone-400"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ApprovalInbox({ onNavigate: _onNavigate }: ApprovalInboxProps) {
  const { activeSchool } = useSTSNStore();
  const inbox = useApprovalInbox();

  const [activeTab, setActiveTab] = useState<TabKey>("forMyApproval");
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const showSchoolBadge = activeSchool === "ALL";

  // Tab → items map
  const tabItems: Record<TabKey, ApprovalRequestRow[]> = {
    forMyApproval: inbox.forMyApproval,
    forMyReview:   inbox.forMyReview,
    returnedToMe:  inbox.returnedToMe,
    submittedByMe: inbox.submittedByMe,
    completed:     inbox.completed,
    overdue:       inbox.overdue,
  };

  const currentItems = tabItems[activeTab];

  // Tabs that show a status pill on the row (non-pending views)
  const showStatus = activeTab !== "forMyApproval" && activeTab !== "forMyReview";

  // Overdue count badge (global, not per-tab)
  const overdueCount = inbox.overdue.length;

  const activeDef = TABS.find((t) => t.key === activeTab)!;

  return (
    <>
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm overflow-hidden mb-6">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="px-5 py-4 flex items-center justify-between bg-gradient-to-r from-white to-stone-50/60 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-stsn-gold/10 border border-stsn-gold/20 flex items-center justify-center flex-shrink-0">
              <Inbox className="w-4 h-4 text-stsn-gold" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stsn-brown-dark leading-none">Action Center</h3>
              <p className="text-[10.5px] text-stone-400 mt-0.5 leading-none">Centralized approval queue — powered by Supabase</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {overdueCount > 0 && (
              <span className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-100">
                <AlertTriangle className="w-3 h-3" />
                {overdueCount} overdue
              </span>
            )}
            <button
              onClick={inbox.refresh}
              disabled={inbox.loading}
              title="Refresh queue"
              className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${inbox.loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* ── Tab bar ────────────────────────────────────────────── */}
        <div className="flex items-end gap-0 border-b border-stone-100 overflow-x-auto no-scrollbar">
          {TABS.map((tab) => {
            const count = tabItems[tab.key].length;
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            const isOverdueTab = tab.key === "overdue";
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-3 text-[10.5px] font-semibold border-b-2 flex-shrink-0 transition-colors ${
                  isActive
                    ? "border-stsn-gold text-stsn-brown-dark"
                    : "border-transparent text-stone-400 hover:text-stone-600 hover:border-stone-200"
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{tab.label}</span>
                {count > 0 && (
                  <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded-full ${
                    isOverdueTab
                      ? "bg-red-100 text-red-600"
                      : isActive
                        ? "bg-stsn-gold/20 text-stsn-brown"
                        : "bg-stone-100 text-stone-500"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Loading skeleton ────────────────────────────────────── */}
        {inbox.loading && (
          <div className="px-5 py-6 space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex items-center gap-3 animate-pulse">
                <div className="w-12 h-5 bg-stone-100 rounded-md flex-shrink-0" />
                <div className="flex-1 h-4 bg-stone-100 rounded" />
                <div className="w-10 h-4 bg-stone-100 rounded flex-shrink-0" />
                <div className="w-8 h-4 bg-stone-100 rounded flex-shrink-0" />
              </div>
            ))}
          </div>
        )}

        {/* ── Empty state ─────────────────────────────────────────── */}
        {!inbox.loading && currentItems.length === 0 && (
          <EmptyState
            icon={activeDef.icon as React.ComponentType<{ className?: string }>}
            title={activeDef.emptyTitle}
            description={activeDef.emptyDesc}
            compact
          />
        )}

        {/* ── Column headers ──────────────────────────────────────── */}
        {!inbox.loading && currentItems.length > 0 && (
          <>
            <div className="px-5 py-2 flex items-center gap-3 bg-stone-50/80 border-b border-stone-100">
              <span className="text-[8.5px] font-mono font-bold uppercase tracking-widest text-stone-400 w-12 flex-shrink-0">Type</span>
              <span className="text-[8.5px] font-mono font-bold uppercase tracking-widest text-stone-400 flex-1">Request</span>
              {showStatus && (
                <span className="text-[8.5px] font-mono font-bold uppercase tracking-widest text-stone-400 flex-shrink-0">Status</span>
              )}
              {showSchoolBadge && (
                <span className="text-[8.5px] font-mono font-bold uppercase tracking-widest text-stone-400 w-14 flex-shrink-0">School</span>
              )}
              <span className="text-[8.5px] font-mono font-bold uppercase tracking-widest text-stone-400 w-12 flex-shrink-0 text-right">Age</span>
              <span className="text-[8.5px] font-mono font-bold uppercase tracking-widest text-stone-400 w-7 flex-shrink-0" />
            </div>

            {/* ── Item rows ─────────────────────────────────────────── */}
            <div className="divide-y divide-stone-50">
              {currentItems.map((item) => (
                <React.Fragment key={item.id}>
                  <ApprovalRow
                    item={item}
                    showSchoolBadge={showSchoolBadge}
                    showStatus={showStatus}
                    onOpen={(id) => setSelectedRequestId(id)}
                  />
                </React.Fragment>
              ))}
            </div>
          </>
        )}

        {/* ── Footer ─────────────────────────────────────────────── */}
        {!inbox.loading && currentItems.length > 0 && (
          <div className="px-5 py-2.5 border-t border-stone-100 bg-stone-50/40 flex items-center justify-between">
            <p className="text-[9.5px] text-stone-400 font-mono">
              {overdueCount > 0
                ? `${overdueCount} item${overdueCount > 1 ? "s" : ""} past SLA`
                : "All items within SLA"}
            </p>
            <div className="flex items-center gap-1 text-[9.5px] text-stone-400">
              <Clock className="w-3 h-3" />
              <span>Sorted by due date</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Detail drawer (portal-style, rendered outside the card) ── */}
      <ApprovalDetailDrawer
        requestId={selectedRequestId}
        onClose={() => setSelectedRequestId(null)}
        onActionComplete={inbox.refresh}
      />
    </>
  );
}

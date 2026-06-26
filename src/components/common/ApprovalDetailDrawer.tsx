/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Approval detail side-drawer.
 * Shows request summary, step statuses, full timeline, and action buttons.
 * Reference: STSN_APPROVAL_WORKFLOW_BEST_PRACTICE_PROCESS.md §10.3 and §10.4
 */

import React, { useState, useEffect } from "react";
import {
  X,
  CheckCircle,
  XCircle,
  RotateCcw,
  Clock,
  ChevronRight,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { useSTSNStore } from "../../services/store";
import {
  getApprovalRequestDetails,
  approveStep,
  returnRequest,
  rejectRequest,
  overrideApproval,
  canUserActOnRequest,
  type ApprovalRequestRow,
  type ApprovalStepRow,
  type ApprovalActionRow,
} from "../../services/approvalWorkflowService";

interface ApprovalDetailDrawerProps {
  requestId: string | null;
  onClose: () => void;
  onActionComplete: () => void;
}

const WORKFLOW_LABELS: Record<string, string> = {
  assessment:          "Assessment",
  discount:            "Discount Request",
  payment_void:        "Payment Void",
  online_application:  "Online Application",
  enrollment:          "Enrollment",
  leave_request:       "Leave Request",
  grade_period:        "Grade Period",
  payroll_run:         "Payroll Run",
};

const ACTION_LABELS: Record<string, string> = {
  SUBMITTED:         "Submitted",
  REVIEWED:          "Reviewed",
  APPROVED_LEVEL_1:  "Approved — Level 1",
  APPROVED_LEVEL_2:  "Approved — Level 2",
  APPROVED_FINAL:    "Final Approval",
  RETURNED:          "Returned for Correction",
  RESUBMITTED:       "Resubmitted",
  REJECTED:          "Rejected",
  CANCELLED:         "Cancelled",
  OVERRIDDEN:        "Override (Super Admin)",
  DELEGATED:         "Delegated",
};

const STATUS_PILL: Record<string, string> = {
  Draft:         "text-stone-600 bg-stone-100",
  Submitted:     "text-amber-700 bg-amber-100",
  "In Review":   "text-sky-700 bg-sky-100",
  Returned:      "text-orange-700 bg-orange-100",
  Resubmitted:   "text-indigo-700 bg-indigo-100",
  Approved:      "text-emerald-700 bg-emerald-100",
  Rejected:      "text-red-700 bg-red-100",
  Cancelled:     "text-stone-500 bg-stone-100",
  Voided:        "text-red-700 bg-red-100",
};

const STEP_ICON_CLASSES = {
  Approved:  "bg-emerald-50 border border-emerald-200",
  Returned:  "bg-orange-50 border border-orange-200",
  Rejected:  "bg-red-50 border border-red-200",
  Pending:   "bg-amber-50 border border-amber-200",
  Skipped:   "bg-stone-100 border border-stone-200",
  Delegated: "bg-violet-50 border border-violet-200",
};

const STEP_PILL: Record<string, string> = {
  Approved:  "bg-emerald-100 text-emerald-700",
  Returned:  "bg-orange-100 text-orange-700",
  Rejected:  "bg-red-100 text-red-700",
  Pending:   "bg-amber-50 text-amber-700 border border-amber-200",
  Skipped:   "bg-stone-100 text-stone-500",
  Delegated: "bg-violet-100 text-violet-700",
};

const TERMINAL_STATUSES = new Set(["Approved", "Rejected", "Cancelled", "Voided"]);

type ActionMode = "view" | "return" | "reject" | "override";

export default function ApprovalDetailDrawer({
  requestId,
  onClose,
  onActionComplete,
}: ApprovalDetailDrawerProps) {
  const { currentUser } = useSTSNStore();

  const [request, setRequest] = useState<ApprovalRequestRow | null>(null);
  const [steps, setSteps] = useState<ApprovalStepRow[]>([]);
  const [timeline, setTimeline] = useState<ApprovalActionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [mode, setMode] = useState<ActionMode>("view");

  useEffect(() => {
    if (!requestId) {
      setRequest(null);
      setSteps([]);
      setTimeline([]);
      setMode("view");
      setRemarks("");
      return;
    }
    setLoading(true);
    getApprovalRequestDetails(requestId)
      .then(({ request: req, steps: st, timeline: tl }) => {
        setRequest(req);
        setSteps(st);
        setTimeline(tl);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [requestId]);

  if (!requestId) return null;

  const isActive = request && !TERMINAL_STATUSES.has(request.status);
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";
  const authority = request && currentUser
    ? canUserActOnRequest(request, currentUser)
    : { canAct: false as const };

  const canAct = authority.canAct;
  const showActions = !loading && request && isActive && (canAct || isSuperAdmin);

  const handleApprove = async () => {
    if (!request || !currentUser) return;
    setActing(true);
    try {
      await approveStep(request.id, currentUser, remarks.trim() || undefined);
      onActionComplete();
      onClose();
    } catch (err) {
      console.error("[ApprovalDetailDrawer] approveStep failed:", err);
    } finally {
      setActing(false);
    }
  };

  const handleReturn = async () => {
    if (!request || !currentUser || !remarks.trim()) return;
    setActing(true);
    try {
      await returnRequest(request.id, currentUser, remarks.trim());
      onActionComplete();
      onClose();
    } catch (err) {
      console.error("[ApprovalDetailDrawer] returnRequest failed:", err);
    } finally {
      setActing(false);
    }
  };

  const handleReject = async () => {
    if (!request || !currentUser || !remarks.trim()) return;
    setActing(true);
    try {
      await rejectRequest(request.id, currentUser, remarks.trim());
      onActionComplete();
      onClose();
    } catch (err) {
      console.error("[ApprovalDetailDrawer] rejectRequest failed:", err);
    } finally {
      setActing(false);
    }
  };

  const handleOverride = async () => {
    if (!request || !currentUser || !remarks.trim()) return;
    setActing(true);
    try {
      await overrideApproval(request.id, currentUser, remarks.trim());
      onActionComplete();
      onClose();
    } catch (err) {
      console.error("[ApprovalDetailDrawer] overrideApproval failed:", err);
    } finally {
      setActing(false);
    }
  };

  const modeConfirmAction = mode === "return" ? handleReturn : mode === "reject" ? handleReject : handleOverride;

  const modeLabel = mode === "return" ? "Return Remarks *" : mode === "reject" ? "Rejection Reason *" : "Override Justification *";
  const modePlaceholder =
    mode === "return"  ? "Describe what needs to be corrected..." :
    mode === "reject"  ? "Provide rejection reason..." :
                         "Mandatory Super Admin override justification...";
  const modeConfirmText = acting ? "Processing…" : mode === "return" ? "Confirm Return" : mode === "reject" ? "Confirm Reject" : "Confirm Override";
  const modeConfirmClass =
    mode === "return"
      ? "bg-amber-500 hover:bg-amber-600 text-white"
      : "bg-red-500 hover:bg-red-600 text-white";

  const isDueOverdue = request?.due_at && isActive && new Date(request.due_at) < new Date();

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        className="fixed top-0 right-0 h-full w-[460px] max-w-full bg-white shadow-2xl z-50 flex flex-col font-sans"
      >
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {request && (
              <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${STATUS_PILL[request.status] ?? "text-stone-500 bg-stone-100"}`}>
                {request.status.toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <p className="text-[9px] font-mono uppercase tracking-widest text-stone-400 leading-none">
                {request ? (WORKFLOW_LABELS[request.workflow_type] ?? request.workflow_type) : "Loading…"}
              </p>
              <p className="text-sm font-bold text-stsn-brown-dark truncate mt-0.5">
                {request?.request_title ?? "—"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-stone-100 transition-colors flex-shrink-0 ml-3"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-stone-400" />
          </button>
        </div>

        {/* ── Body ────────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-stsn-gold/30 border-t-stsn-gold rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto divide-y divide-stone-100">

            {/* Request summary grid */}
            {request && (
              <div className="px-5 py-4 bg-stone-50/50">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400">Priority</p>
                    <p className="text-xs font-semibold text-stsn-brown-dark mt-0.5">{request.priority}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400">Step</p>
                    <p className="text-xs font-semibold text-stsn-brown-dark mt-0.5">Level {request.current_step_level}</p>
                  </div>
                  {request.submitted_at && (
                    <div>
                      <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400">Submitted</p>
                      <p className="text-xs font-semibold text-stsn-brown-dark mt-0.5">
                        {new Date(request.submitted_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  )}
                  {request.due_at && (
                    <div>
                      <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400">SLA Due</p>
                      <p className={`text-xs font-semibold mt-0.5 ${isDueOverdue ? "text-red-600" : "text-stsn-brown-dark"}`}>
                        {new Date(request.due_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                        {isDueOverdue && (
                          <span className="ml-1 text-[8.5px] font-bold text-red-500">OVERDUE</span>
                        )}
                      </p>
                    </div>
                  )}
                  {request.school_id && (
                    <div>
                      <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400">School</p>
                      <p className="text-xs font-semibold text-stsn-brown-dark mt-0.5">{request.school_id}</p>
                    </div>
                  )}
                  {request.request_summary && (
                    <div className="col-span-2">
                      <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400">Summary</p>
                      <p className="text-xs text-stone-600 mt-0.5">{request.request_summary}</p>
                    </div>
                  )}
                </div>

                {/* Authority notice */}
                {isActive && !canAct && !isSuperAdmin && (
                  <div className="mt-3 flex items-start gap-2 bg-sky-50 border border-sky-200 rounded-xl px-3 py-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-sky-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] text-sky-700">
                      {authority.reason ?? "You can view this request but do not have authority to act on the current step."}
                    </p>
                  </div>
                )}
                {isActive && !canAct && isSuperAdmin && (
                  <div className="mt-3 flex items-start gap-2 bg-violet-50 border border-violet-200 rounded-xl px-3 py-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-violet-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] text-violet-700">
                      You are acting as Super Admin. Use Override to bypass normal approval authority — mandatory remarks required.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Approval steps */}
            {steps.length > 0 && (
              <div className="px-5 py-4">
                <p className="text-[9px] font-mono uppercase tracking-widest text-stone-400 mb-3">Approval Steps</p>
                <div className="space-y-2.5">
                  {steps.map((step) => {
                    const iconCls = STEP_ICON_CLASSES[step.status as keyof typeof STEP_ICON_CLASSES] ?? STEP_ICON_CLASSES.Pending;
                    const pillCls = STEP_PILL[step.status] ?? "bg-stone-100 text-stone-500";
                    return (
                      <div key={step.id} className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${iconCls}`}>
                          {step.status === "Approved"  && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                          {step.status === "Returned"  && <RotateCcw   className="w-3 h-3 text-orange-500" />}
                          {step.status === "Rejected"  && <XCircle     className="w-3 h-3 text-red-500" />}
                          {step.status === "Pending"   && <Clock       className="w-3 h-3 text-amber-500" />}
                          {step.status === "Skipped"   && <ChevronRight className="w-3 h-3 text-stone-400" />}
                          {step.status === "Delegated" && <ChevronRight className="w-3 h-3 text-violet-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-stsn-brown-dark">{step.step_name}</p>
                          <p className="text-[10px] text-stone-400 mt-0.5">
                            {[step.required_role, step.required_designation].filter(Boolean).join(" · ")}
                          </p>
                          {step.remarks && (
                            <p className="text-[10px] text-stone-500 mt-1 italic">"{step.remarks}"</p>
                          )}
                          {step.acted_at && (
                            <p className="text-[9px] text-stone-400 mt-0.5">
                              {new Date(step.acted_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          )}
                        </div>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5 ${pillCls}`}>
                          {step.status.toUpperCase()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Timeline */}
            {timeline.length > 0 && (
              <div className="px-5 py-4">
                <p className="text-[9px] font-mono uppercase tracking-widest text-stone-400 mb-3">History</p>
                <div className="space-y-3">
                  {timeline.map((action, i) => (
                    <div key={action.id} className="flex items-start gap-3">
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-stone-300 mt-1.5" />
                        {i < timeline.length - 1 && (
                          <div className="w-px flex-1 bg-stone-100 mt-1 min-h-[12px]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pb-1">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-[10.5px] font-bold text-stsn-brown-dark">
                            {ACTION_LABELS[action.action] ?? action.action}
                          </span>
                          <span className="text-[9px] text-stone-400">
                            {action.action_role}{action.action_designation ? ` · ${action.action_designation}` : ""}
                          </span>
                        </div>
                        {action.remarks && (
                          <p className="text-[10px] text-stone-500 mt-0.5 italic">"{action.remarks}"</p>
                        )}
                        <p className="text-[9px] text-stone-400 mt-0.5">
                          {new Date(action.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {timeline.length === 0 && steps.length === 0 && !loading && request && (
              <div className="px-5 py-8 text-center">
                <p className="text-xs text-stone-400">No timeline data available for this request.</p>
              </div>
            )}
          </div>
        )}

        {/* ── Action footer ────────────────────────────────────────── */}
        {showActions && (
          <div className="border-t border-stone-100 px-5 py-4 flex-shrink-0 space-y-3 bg-white">
            {mode !== "view" ? (
              <>
                <div>
                  <label className="text-[9px] font-mono uppercase tracking-wider text-stone-400 block mb-1">
                    {modeLabel}
                  </label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows={3}
                    placeholder={modePlaceholder}
                    className="w-full border border-stone-200 rounded-xl px-3 py-2 text-xs text-stsn-brown-dark resize-none focus:outline-none focus:ring-2 focus:ring-stsn-gold/40"
                    autoFocus
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setMode("view"); setRemarks(""); }}
                    className="flex-1 py-2 text-xs font-semibold border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors text-stone-600"
                    disabled={acting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={modeConfirmAction}
                    disabled={!remarks.trim() || acting}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors disabled:opacity-40 ${modeConfirmClass}`}
                  >
                    {modeConfirmText}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex gap-2 flex-wrap">
                {canAct && (
                  <button
                    onClick={handleApprove}
                    disabled={acting}
                    className="flex-1 min-w-[80px] py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors disabled:opacity-40"
                  >
                    {acting ? "…" : "Approve"}
                  </button>
                )}
                <button
                  onClick={() => setMode("return")}
                  disabled={acting}
                  className="flex-1 min-w-[80px] py-2 text-xs font-semibold border border-amber-300 text-amber-700 hover:bg-amber-50 rounded-xl transition-colors disabled:opacity-40"
                >
                  Return
                </button>
                <button
                  onClick={() => setMode("reject")}
                  disabled={acting}
                  className="flex-1 min-w-[80px] py-2 text-xs font-semibold border border-red-300 text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-40"
                >
                  Reject
                </button>
                {isSuperAdmin && (
                  <button
                    onClick={() => setMode("override")}
                    disabled={acting}
                    className="flex-1 min-w-[80px] py-2 text-xs font-semibold border border-violet-300 text-violet-700 hover:bg-violet-50 rounded-xl transition-colors disabled:opacity-40"
                  >
                    Override
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

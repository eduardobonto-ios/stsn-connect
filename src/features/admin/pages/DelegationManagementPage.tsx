/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { ArrowRightLeft, Plus, X, CheckCircle, Clock, Calendar, Info } from "lucide-react";
import { useSTSNStore } from "../../../services/store";
import { useAppDialog } from "../../../components/common/useAppDialog";
import AppFormField from "../../../components/common/AppFormField";
import DrilldownDrawer from "../../../components/common/DrilldownDrawer";
import type { DelegationScope, ApprovalDelegation } from "../../../types";

const SCOPE_OPTIONS: DelegationScope[] = ["ASSESSMENT", "LEAVE", "GRADE", "VOID", "ALL"];

const SCOPE_LABEL: Record<DelegationScope, string> = {
  ASSESSMENT: "Assessment Approvals",
  LEAVE:      "Leave Approvals",
  GRADE:      "Grade Finalization",
  VOID:       "Void Request Approvals",
  ALL:        "All Approval Scopes",
};

const selectClass =
  "w-full text-xs font-semibold border border-stone-200 rounded-lg px-3 py-2 bg-stone-50 outline-none focus:ring-1 focus:ring-stsn-gold/50 focus:border-stsn-gold/60 text-stone-800 transition cursor-pointer";
const inputClass =
  "w-full text-xs font-semibold border border-stone-200 rounded-lg px-3 py-2 bg-stone-50 outline-none focus:ring-1 focus:ring-stsn-gold/50 focus:border-stsn-gold/60 placeholder:text-stone-400 text-stone-800 transition";

export default function DelegationManagementPage() {
  const { delegations, users, currentUser, addDelegation, revokeDelegation } = useSTSNStore();
  const { confirm, toast } = useAppDialog();

  const [showForm, setShowForm]       = useState(false);
  const [delegateId, setDelegateId]   = useState("");
  const [scope, setScope]             = useState<DelegationScope>("ASSESSMENT");
  const [startDate, setStartDate]     = useState("");
  const [endDate, setEndDate]         = useState("");
  const [reason, setReason]           = useState("");

  const [selectedDelegation, setSelectedDelegation] = useState<ApprovalDelegation | null>(null);

  const today = new Date().toISOString().split("T")[0];

  const eligibleDelegates = useMemo(
    () => users.filter((u) => u.id !== currentUser?.id && u.isActive),
    [users, currentUser],
  );

  const activeDelegations = delegations.filter(
    (d) => d.isActive && d.endDate >= today,
  );

  const pastDelegations = delegations.filter(
    (d) => !d.isActive || d.endDate < today,
  );

  const handleAdd = () => {
    if (!delegateId || !startDate || !endDate || !reason.trim()) {
      toast("Please fill in all fields.", { variant: "warning" });
      return;
    }
    if (endDate < startDate) {
      toast("End date must be on or after start date.", { variant: "warning" });
      return;
    }
    if (!currentUser) return;
    addDelegation({
      schoolId:      currentUser.schoolId,
      delegatorId:   currentUser.id,
      delegatorRole: currentUser.role,
      delegateId,
      delegateRole:  users.find((u) => u.id === delegateId)?.role ?? currentUser.role,
      scope,
      startDate,
      endDate,
      reason: reason.trim(),
      isActive: true,
    });
    toast("Delegation created.", { variant: "success" });
    setShowForm(false);
    setDelegateId(""); setReason("");
    setStartDate(""); setEndDate("");
  };

  const handleRevoke = async (id: string, label: string) => {
    const ok = await confirm(
      `Revoke delegation for ${label}?\n\nThis will immediately remove their delegated approval authority.`,
    );
    if (!ok) return;
    revokeDelegation(id);
    toast("Delegation revoked.", { variant: "warning" });
    if (selectedDelegation?.id === id) setSelectedDelegation(null);
  };

  const selectedDelegator = selectedDelegation
    ? users.find((u) => u.id === selectedDelegation.delegatorId)
    : null;
  const selectedDelegate = selectedDelegation
    ? users.find((u) => u.id === selectedDelegation.delegateId)
    : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
            <ArrowRightLeft className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h2 className="text-sm font-display font-bold text-stsn-brown-dark">Approval Delegation</h2>
            <p className="text-[10px] text-stone-400 mt-0.5">Temporarily transfer approval authority — click a row to inspect details</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 btn-primary-gradient text-white rounded-xl shadow-sm cursor-pointer transition"
        >
          <Plus className="w-3.5 h-3.5" /> New Delegation
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-stsn-beige shadow-sm p-5 space-y-4 animate-fade-in">
          <h3 className="text-xs font-bold text-stsn-brown-dark uppercase">New Delegation</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AppFormField label="Delegate To *">
              <select
                value={delegateId}
                onChange={(e) => setDelegateId(e.target.value)}
                className={selectClass}
              >
                <option value="">Select user…</option>
                {eligibleDelegates.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </AppFormField>

            <AppFormField label="Approval Scope *">
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as DelegationScope)}
                className={selectClass}
              >
                {SCOPE_OPTIONS.map((s) => (
                  <option key={s} value={s}>{SCOPE_LABEL[s]}</option>
                ))}
              </select>
            </AppFormField>

            <AppFormField label="Start Date *">
              <input
                type="date"
                value={startDate}
                min={today}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClass}
              />
            </AppFormField>

            <AppFormField label="End Date *">
              <input
                type="date"
                value={endDate}
                min={startDate || today}
                onChange={(e) => setEndDate(e.target.value)}
                className={inputClass}
              />
            </AppFormField>

            <div className="col-span-full">
              <AppFormField
                label="Reason / Justification *"
                hint="Briefly explain why authority is being delegated."
              >
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Annual leave — principal unavailable June 25–30"
                  className={inputClass}
                />
              </AppFormField>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setShowForm(false)}
              className="text-xs font-semibold px-4 py-1.5 rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 cursor-pointer transition"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              className="text-xs font-bold px-4 py-1.5 rounded-lg btn-primary-gradient text-white shadow-sm cursor-pointer transition"
            >
              Create Delegation
            </button>
          </div>
        </div>
      )}

      {/* Active delegations */}
      <div className="bg-white rounded-xl border border-stsn-beige shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-100 bg-stone-50/60 flex items-center gap-2">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-xs font-bold text-stone-700">Active Delegations</span>
          <span className="ml-auto text-[10px] font-mono text-stone-400">{activeDelegations.length}</span>
        </div>
        {activeDelegations.length === 0 ? (
          <p className="text-xs text-stone-400 italic text-center py-8">No active delegations.</p>
        ) : (
          <div className="divide-y divide-stone-50">
            {activeDelegations.map((d) => {
              const delegator = users.find((u) => u.id === d.delegatorId);
              const delegate  = users.find((u) => u.id === d.delegateId);
              return (
                <div
                  key={d.id}
                  onClick={() => setSelectedDelegation(d)}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-stone-50/70 cursor-pointer transition group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-stone-800 truncate">
                      {delegator?.name ?? "Unknown"} → {delegate?.name ?? "Unknown"}
                    </p>
                    <p className="text-[10px] text-stone-500 mt-0.5">
                      {SCOPE_LABEL[d.scope]} · {d.startDate} to {d.endDate}
                    </p>
                    <p className="text-[10px] text-stone-400 truncate">{d.reason}</p>
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 flex-shrink-0">
                    Active
                  </span>
                  <Info className="w-3.5 h-3.5 text-stone-300 group-hover:text-stsn-gold transition flex-shrink-0" />
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRevoke(d.id, delegate?.name ?? "delegate"); }}
                    className="p-1 hover:bg-red-50 rounded-lg text-stone-400 hover:text-red-500 transition cursor-pointer flex-shrink-0"
                    title="Revoke delegation"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past delegations */}
      {pastDelegations.length > 0 && (
        <div className="bg-white rounded-xl border border-stone-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-stone-100 bg-stone-50/60 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-stone-400" />
            <span className="text-xs font-bold text-stone-400">Past / Revoked Delegations</span>
          </div>
          <div className="divide-y divide-stone-50">
            {pastDelegations.slice(0, 10).map((d) => {
              const delegator = users.find((u) => u.id === d.delegatorId);
              const delegate  = users.find((u) => u.id === d.delegateId);
              return (
                <div
                  key={d.id}
                  onClick={() => setSelectedDelegation(d)}
                  className="flex items-center gap-4 px-4 py-2.5 opacity-60 hover:opacity-80 cursor-pointer transition"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-stone-600 truncate">
                      {delegator?.name ?? "Unknown"} → {delegate?.name ?? "Unknown"}
                    </p>
                    <p className="text-[10px] text-stone-400">
                      {SCOPE_LABEL[d.scope]} · {d.startDate} to {d.endDate}
                    </p>
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-500 border border-stone-200 flex-shrink-0">
                    {d.isActive ? "Expired" : "Revoked"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Delegation detail drilldown drawer */}
      <DrilldownDrawer
        open={!!selectedDelegation}
        onClose={() => setSelectedDelegation(null)}
        title="Delegation Detail"
        subtitle={
          selectedDelegation
            ? `${selectedDelegator?.name ?? "Unknown"} → ${selectedDelegate?.name ?? "Unknown"}`
            : ""
        }
        width="sm"
      >
        {selectedDelegation && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-3">
              <dl className="space-y-3 text-xs">
                <div>
                  <dt className="text-[10px] font-mono font-bold uppercase text-stone-400 mb-0.5">Delegator (From)</dt>
                  <dd className="font-semibold text-stone-800">
                    {selectedDelegator?.name ?? "Unknown"}
                    <span className="ml-1.5 text-[9px] font-mono text-stone-400">
                      ({selectedDelegation.delegatorRole})
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-mono font-bold uppercase text-stone-400 mb-0.5">Delegate (To)</dt>
                  <dd className="font-semibold text-stone-800">
                    {selectedDelegate?.name ?? "Unknown"}
                    <span className="ml-1.5 text-[9px] font-mono text-stone-400">
                      ({selectedDelegation.delegateRole})
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-mono font-bold uppercase text-stone-400 mb-0.5">Scope</dt>
                  <dd className="font-semibold text-stone-700">{SCOPE_LABEL[selectedDelegation.scope]}</dd>
                </div>
                <div className="flex gap-4">
                  <div>
                    <dt className="text-[10px] font-mono font-bold uppercase text-stone-400 mb-0.5">Start</dt>
                    <dd className="font-mono text-stone-600 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />{selectedDelegation.startDate}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-mono font-bold uppercase text-stone-400 mb-0.5">End</dt>
                    <dd className="font-mono text-stone-600 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />{selectedDelegation.endDate}
                    </dd>
                  </div>
                </div>
                <div>
                  <dt className="text-[10px] font-mono font-bold uppercase text-stone-400 mb-0.5">Status</dt>
                  <dd>
                    {selectedDelegation.isActive && selectedDelegation.endDate >= today ? (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">Active</span>
                    ) : selectedDelegation.isActive ? (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-500 border border-stone-200">Expired</span>
                    ) : (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-100">Revoked</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-mono font-bold uppercase text-stone-400 mb-1">Reason</dt>
                  <dd className="text-xs text-stone-700 leading-relaxed bg-stone-50 rounded-lg p-2.5 border border-stone-100">
                    {selectedDelegation.reason}
                  </dd>
                </div>
              </dl>
            </div>

            {selectedDelegation.isActive && selectedDelegation.endDate >= today && (
              <button
                onClick={() => handleRevoke(selectedDelegation.id, selectedDelegate?.name ?? "delegate")}
                className="w-full flex items-center justify-center gap-2 text-xs font-bold py-2.5 px-4 rounded-xl border bg-red-50 hover:bg-red-100 border-red-200 text-red-700 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" /> Revoke Delegation
              </button>
            )}
          </div>
        )}
      </DrilldownDrawer>
    </div>
  );
}

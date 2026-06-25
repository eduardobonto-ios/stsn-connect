/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { ArrowRightLeft, Plus, X, CheckCircle, Clock } from "lucide-react";
import { useSTSNStore } from "../../../services/store";
import { useAppDialog } from "../../../components/common/useAppDialog";
import type { DelegationScope } from "../../../types";

const SCOPE_OPTIONS: DelegationScope[] = ["ASSESSMENT", "LEAVE", "GRADE", "VOID", "ALL"];

const SCOPE_LABEL: Record<DelegationScope, string> = {
  ASSESSMENT: "Assessment Approvals",
  LEAVE:      "Leave Approvals",
  GRADE:      "Grade Finalization",
  VOID:       "Void Request Approvals",
  ALL:        "All Approval Scopes",
};

export default function DelegationManagementPage() {
  const { delegations, users, currentUser, addDelegation, revokeDelegation } = useSTSNStore();
  const { confirm, toast } = useAppDialog();

  const [showForm, setShowForm] = useState(false);
  const [delegateId, setDelegateId] = useState("");
  const [scope, setScope] = useState<DelegationScope>("ASSESSMENT");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const eligibleDelegates = useMemo(
    () => users.filter((u) => u.id !== currentUser?.id && u.isActive),
    [users, currentUser],
  );

  const activeDelegations = delegations.filter((d) => {
    return d.isActive && d.endDate >= today;
  });

  const pastDelegations = delegations.filter((d) => !d.isActive || d.endDate < today);

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
      schoolId: currentUser.schoolId,
      delegatorId: currentUser.id,
      delegatorRole: currentUser.role,
      delegateId,
      delegateRole: users.find((u) => u.id === delegateId)?.role ?? currentUser.role,
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
    const ok = await confirm(`Revoke delegation for ${label}? This will immediately remove their delegated authority.`);
    if (!ok) return;
    revokeDelegation(id);
    toast("Delegation revoked.", { variant: "warning" });
  };

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
            <p className="text-[10px] text-stone-400 mt-0.5">Temporarily transfer approval authority during absences</p>
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
            <div>
              <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">Delegate To *</label>
              <select
                value={delegateId} onChange={(e) => setDelegateId(e.target.value)}
                className="w-full text-xs border border-stone-200 rounded-lg px-2.5 py-2 bg-stone-50 outline-none focus:ring-1 focus:ring-stsn-gold"
              >
                <option value="">Select user…</option>
                {eligibleDelegates.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">Approval Scope *</label>
              <select
                value={scope} onChange={(e) => setScope(e.target.value as DelegationScope)}
                className="w-full text-xs border border-stone-200 rounded-lg px-2.5 py-2 bg-stone-50 outline-none focus:ring-1 focus:ring-stsn-gold"
              >
                {SCOPE_OPTIONS.map((s) => <option key={s} value={s}>{SCOPE_LABEL[s]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">Start Date *</label>
              <input type="date" value={startDate} min={today} onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs border border-stone-200 rounded-lg px-2.5 py-2 bg-stone-50 outline-none focus:ring-1 focus:ring-stsn-gold" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">End Date *</label>
              <input type="date" value={endDate} min={startDate || today} onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs border border-stone-200 rounded-lg px-2.5 py-2 bg-stone-50 outline-none focus:ring-1 focus:ring-stsn-gold" />
            </div>
            <div className="col-span-full">
              <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">Reason / Justification *</label>
              <input type="text" value={reason} onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Annual leave — principal unavailable June 25-30"
                className="w-full text-xs border border-stone-200 rounded-lg px-2.5 py-2 bg-stone-50 outline-none focus:ring-1 focus:ring-stsn-gold" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => setShowForm(false)}
              className="text-xs font-semibold px-4 py-1.5 rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 cursor-pointer transition">
              Cancel
            </button>
            <button onClick={handleAdd}
              className="text-xs font-bold px-4 py-1.5 rounded-lg btn-primary-gradient text-white shadow-sm cursor-pointer transition">
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
              const delegate = users.find((u) => u.id === d.delegateId);
              return (
                <div key={d.id} className="flex items-center gap-4 px-4 py-3">
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
                  <button
                    onClick={() => handleRevoke(d.id, delegate?.name ?? "delegate")}
                    className="p-1 hover:bg-red-50 rounded-lg text-stone-400 hover:text-red-500 transition cursor-pointer"
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
              const delegate = users.find((u) => u.id === d.delegateId);
              return (
                <div key={d.id} className="flex items-center gap-4 px-4 py-2.5 opacity-60">
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
    </div>
  );
}

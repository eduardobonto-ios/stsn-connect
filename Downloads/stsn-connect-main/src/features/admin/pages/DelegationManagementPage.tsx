/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import { ArrowRightLeft, Calendar, CheckCircle, Clock, Info, Plus, X } from "lucide-react";
import AppButton from "../../../components/common/AppButton";
import AppCard from "../../../components/common/AppCard";
import AppEmptyState from "../../../components/common/AppEmptyState";
import AppFormField from "../../../components/common/AppFormField";
import AppInput from "../../../components/common/AppInput";
import AppSelect from "../../../components/common/AppSelect";
import AppStatusBadge from "../../../components/common/AppStatusBadge";
import DrilldownDrawer from "../../../components/common/DrilldownDrawer";
import { useAppDialog } from "../../../components/common/useAppDialog";
import { useSTSNStore } from "../../../services/store";
import type { ApprovalDelegation, DelegationScope } from "../../../types";

const SCOPE_OPTIONS: DelegationScope[] = ["ASSESSMENT", "LEAVE", "GRADE", "VOID", "ALL"];

const SCOPE_LABEL: Record<DelegationScope, string> = {
  ASSESSMENT: "Assessment Approvals",
  LEAVE: "Leave Approvals",
  GRADE: "Grade Finalization",
  VOID: "Void Request Approvals",
  ALL: "All Approval Scopes",
};

const statusLabel = (delegation: ApprovalDelegation, today: string) => {
  if (delegation.isActive && delegation.endDate >= today) return "Active";
  if (delegation.isActive) return "Expired";
  return "Revoked";
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
  const [selectedDelegation, setSelectedDelegation] = useState<ApprovalDelegation | null>(null);

  const today = new Date().toISOString().split("T")[0];

  const eligibleDelegates = useMemo(
    () => users.filter((user) => user.id !== currentUser?.id && user.isActive),
    [users, currentUser],
  );

  const activeDelegations = useMemo(
    () => delegations.filter((delegation) => delegation.isActive && delegation.endDate >= today),
    [delegations, today],
  );

  const pastDelegations = useMemo(
    () => delegations.filter((delegation) => !delegation.isActive || delegation.endDate < today),
    [delegations, today],
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
      schoolId: currentUser.schoolId,
      delegatorId: currentUser.id,
      delegatorRole: currentUser.role,
      delegateId,
      delegateRole: users.find((user) => user.id === delegateId)?.role ?? currentUser.role,
      scope,
      startDate,
      endDate,
      reason: reason.trim(),
      isActive: true,
    });

    toast("Delegation created.", { variant: "success" });
    setShowForm(false);
    setDelegateId("");
    setReason("");
    setStartDate("");
    setEndDate("");
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
    ? users.find((user) => user.id === selectedDelegation.delegatorId)
    : null;
  const selectedDelegate = selectedDelegation
    ? users.find((user) => user.id === selectedDelegation.delegateId)
    : null;

  return (
    <div className="space-y-4">
      <AppCard tone="brand" className="border border-[var(--erp-border)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--erp-border)] bg-white shadow-sm">
                <ArrowRightLeft className="h-5 w-5 text-[var(--erp-brand)]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-[var(--erp-text)]">
                  Approval Delegation
                </h3>
                <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[var(--erp-text-muted)]">
                  Temporarily transfer approval authority while preserving the existing delegation,
                  audit, and revocation workflow.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[var(--erp-border)] bg-white px-4 py-3 shadow-sm">
                <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
                  Active Now
                </p>
                <p className="mt-1 text-2xl font-semibold text-[var(--erp-text)]">
                  {activeDelegations.length}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--erp-border)] bg-white px-4 py-3 shadow-sm">
                <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
                  Eligible Delegates
                </p>
                <p className="mt-1 text-2xl font-semibold text-[var(--erp-text)]">
                  {eligibleDelegates.length}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--erp-border)] bg-white px-4 py-3 shadow-sm">
                <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
                  Past Records
                </p>
                <p className="mt-1 text-2xl font-semibold text-[var(--erp-text)]">
                  {pastDelegations.length}
                </p>
              </div>
            </div>
          </div>
          <AppButton
            type="button"
            onClick={() => setShowForm((value) => !value)}
            leftIcon={Plus}
            className="self-start"
          >
            {showForm ? "Hide Form" : "New Delegation"}
          </AppButton>
        </div>
      </AppCard>

      {showForm && (
        <AppCard className="border border-[var(--erp-border)]">
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
                Delegation Setup
              </p>
              <h4 className="mt-1 text-base font-semibold text-[var(--erp-text)]">
                Create a Temporary Approval Transfer
              </h4>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <AppFormField label="Delegate To *">
                <AppSelect
                  value={delegateId}
                  onChange={(event) => setDelegateId(event.target.value)}
                  uiSize="sm"
                >
                  <option value="">Select user...</option>
                  {eligibleDelegates.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.role})
                    </option>
                  ))}
                </AppSelect>
              </AppFormField>

              <AppFormField label="Approval Scope *">
                <AppSelect
                  value={scope}
                  onChange={(event) => setScope(event.target.value as DelegationScope)}
                  uiSize="sm"
                >
                  {SCOPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {SCOPE_LABEL[option]}
                    </option>
                  ))}
                </AppSelect>
              </AppFormField>

              <AppFormField label="Start Date *">
                <AppInput
                  type="date"
                  value={startDate}
                  min={today}
                  onChange={(event) => setStartDate(event.target.value)}
                  uiSize="sm"
                />
              </AppFormField>

              <AppFormField label="End Date *">
                <AppInput
                  type="date"
                  value={endDate}
                  min={startDate || today}
                  onChange={(event) => setEndDate(event.target.value)}
                  uiSize="sm"
                />
              </AppFormField>

              <div className="sm:col-span-2">
                <AppFormField
                  label="Reason / Justification *"
                  hint="Briefly explain why authority is being delegated."
                >
                  <AppInput
                    type="text"
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="e.g. Annual leave - principal unavailable June 25-30"
                    uiSize="sm"
                  />
                </AppFormField>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <AppButton type="button" variant="secondary" size="sm" onClick={() => setShowForm(false)}>
                Cancel
              </AppButton>
              <AppButton type="button" size="sm" onClick={handleAdd}>
                Create Delegation
              </AppButton>
            </div>
          </div>
        </AppCard>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.4fr,1fr]">
        <AppCard className="border border-[var(--erp-border)]" padded={false}>
          <div className="flex items-center justify-between border-b border-[var(--erp-border)] px-5 py-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <div>
                <h4 className="text-sm font-semibold text-[var(--erp-text)]">Active Delegations</h4>
                <p className="text-[11px] text-[var(--erp-text-muted)]">
                  Click a delegation to inspect details or revoke it.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
              {activeDelegations.length} active
            </span>
          </div>
          <div className="divide-y divide-[var(--erp-border)]">
            {activeDelegations.length === 0 ? (
              <AppEmptyState
                icon={ArrowRightLeft}
                title="No active delegations"
                description="Create a temporary delegation to transfer approval authority while a leader is away."
                compact
                className="m-5"
              />
            ) : (
              activeDelegations.map((delegation) => {
                const delegator = users.find((user) => user.id === delegation.delegatorId);
                const delegate = users.find((user) => user.id === delegation.delegateId);
                return (
                  <button
                    key={delegation.id}
                    type="button"
                    onClick={() => setSelectedDelegation(delegation)}
                    className="flex w-full items-start gap-3 px-5 py-4 text-left transition hover:bg-[var(--erp-surface-muted)]"
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-[var(--erp-border)] bg-[var(--erp-surface-muted)]">
                      <ArrowRightLeft className="h-4 w-4 text-[var(--erp-brand)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-[var(--erp-text)]">
                          {delegator?.name ?? "Unknown"} to {delegate?.name ?? "Unknown"}
                        </p>
                        <AppStatusBadge status="Active" />
                      </div>
                      <p className="mt-1 text-xs text-[var(--erp-text-muted)]">
                        {SCOPE_LABEL[delegation.scope]} • {delegation.startDate} to {delegation.endDate}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-[var(--erp-text-muted)]">
                        {delegation.reason}
                      </p>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      <Info className="h-4 w-4 text-[var(--erp-text-muted)]" />
                      <AppButton
                        type="button"
                        size="xs"
                        variant="danger-outline"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleRevoke(delegation.id, delegate?.name ?? "delegate");
                        }}
                      >
                        Revoke
                      </AppButton>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </AppCard>

        <AppCard className="border border-[var(--erp-border)]" padded={false}>
          <div className="flex items-center gap-2 border-b border-[var(--erp-border)] px-5 py-4">
            <Clock className="h-4 w-4 text-[var(--erp-text-muted)]" />
            <div>
              <h4 className="text-sm font-semibold text-[var(--erp-text)]">Past and Revoked</h4>
              <p className="text-[11px] text-[var(--erp-text-muted)]">
                Historical delegation records remain read-only.
              </p>
            </div>
          </div>
          <div className="divide-y divide-[var(--erp-border)]">
            {pastDelegations.length === 0 ? (
              <AppEmptyState
                icon={Clock}
                title="No historical delegations"
                description="Expired or revoked delegations will appear here automatically."
                compact
                tone="neutral"
                className="m-5"
              />
            ) : (
              pastDelegations.slice(0, 10).map((delegation) => {
                const delegator = users.find((user) => user.id === delegation.delegatorId);
                const delegate = users.find((user) => user.id === delegation.delegateId);
                return (
                  <button
                    key={delegation.id}
                    type="button"
                    onClick={() => setSelectedDelegation(delegation)}
                    className="flex w-full items-start gap-3 px-5 py-3.5 text-left transition hover:bg-[var(--erp-surface-muted)]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--erp-text)]">
                        {delegator?.name ?? "Unknown"} to {delegate?.name ?? "Unknown"}
                      </p>
                      <p className="mt-1 text-xs text-[var(--erp-text-muted)]">
                        {SCOPE_LABEL[delegation.scope]} • {delegation.startDate} to {delegation.endDate}
                      </p>
                    </div>
                    <AppStatusBadge status={statusLabel(delegation, today)} />
                  </button>
                );
              })
            )}
          </div>
        </AppCard>
      </div>

      <DrilldownDrawer
        open={!!selectedDelegation}
        onClose={() => setSelectedDelegation(null)}
        title="Delegation Detail"
        subtitle={
          selectedDelegation
            ? `${selectedDelegator?.name ?? "Unknown"} to ${selectedDelegate?.name ?? "Unknown"}`
            : ""
        }
        width="sm"
      >
        {selectedDelegation && (
          <div className="space-y-4">
            <AppCard className="border border-[var(--erp-border)]">
              <dl className="space-y-3 text-xs">
                <div>
                  <dt className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
                    Delegator
                  </dt>
                  <dd className="mt-1 font-semibold text-[var(--erp-text)]">
                    {selectedDelegator?.name ?? "Unknown"}
                    <span className="ml-1.5 text-[10px] font-mono text-[var(--erp-text-muted)]">
                      ({selectedDelegation.delegatorRole})
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
                    Delegate
                  </dt>
                  <dd className="mt-1 font-semibold text-[var(--erp-text)]">
                    {selectedDelegate?.name ?? "Unknown"}
                    <span className="ml-1.5 text-[10px] font-mono text-[var(--erp-text-muted)]">
                      ({selectedDelegation.delegateRole})
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
                    Scope
                  </dt>
                  <dd className="mt-1 text-[var(--erp-text)]">{SCOPE_LABEL[selectedDelegation.scope]}</dd>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <dt className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
                      Start
                    </dt>
                    <dd className="mt-1 flex items-center gap-1 text-[var(--erp-text)]">
                      <Calendar className="h-3.5 w-3.5 text-[var(--erp-text-muted)]" />
                      {selectedDelegation.startDate}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
                      End
                    </dt>
                    <dd className="mt-1 flex items-center gap-1 text-[var(--erp-text)]">
                      <Calendar className="h-3.5 w-3.5 text-[var(--erp-text-muted)]" />
                      {selectedDelegation.endDate}
                    </dd>
                  </div>
                </div>
                <div>
                  <dt className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
                    Status
                  </dt>
                  <dd className="mt-1">
                    <AppStatusBadge status={statusLabel(selectedDelegation, today)} />
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
                    Reason
                  </dt>
                  <dd className="mt-1 rounded-2xl border border-[var(--erp-border)] bg-[var(--erp-surface-muted)] px-3 py-2.5 leading-relaxed text-[var(--erp-text)]">
                    {selectedDelegation.reason}
                  </dd>
                </div>
              </dl>
            </AppCard>

            {selectedDelegation.isActive && selectedDelegation.endDate >= today && (
              <AppButton
                type="button"
                fullWidth
                variant="danger-outline"
                size="sm"
                onClick={() =>
                  handleRevoke(selectedDelegation.id, selectedDelegate?.name ?? "delegate")
                }
                leftIcon={X}
              >
                Revoke Delegation
              </AppButton>
            )}
          </div>
        )}
      </DrilldownDrawer>
    </div>
  );
}

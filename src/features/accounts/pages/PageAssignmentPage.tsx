/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Page Assignment / Access Rights editor.
 * Lives as a tab inside User Access & Authority (AccountsManagementPage).
 *
 *   • Role Rights  — toggle module/page/action grants per role.
 *   • User Access  — assign/revoke roles and set per-user allow/deny overrides.
 *
 * Rights are edited as a STAGED draft: toggles mutate local state and surface an
 * "unsaved changes" indicator; the admin commits with a per-module Save or a
 * global Save All. Each committed change persists to the security_* tables AND a
 * security_access_audit_logs row, then refreshes the in-memory catalog so the
 * change takes effect on the next session reload (and immediately for the admin).
 *
 * Role assignment (User Access tab) stays instant — it's a discrete action, not a
 * matrix edit — so it is not part of the staged draft.
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Layers,
  Minus,
  RotateCcw,
  Save,
  ShieldCheck,
  UserCog,
  X,
} from "lucide-react";
import AppCard from "../../../components/common/AppCard";
import AppButton from "../../../components/common/AppButton";
import AppSelect from "../../../components/common/AppSelect";
import AppStatusBadge from "../../../components/common/AppStatusBadge";
import AppTabs from "../../../components/common/AppTabs";
import AppToggle from "../../../components/common/AppToggle";
import AppFormField from "../../../components/common/AppFormField";
import { useAppDialog } from "../../../components/common/useAppDialog";
import { useSTSNStore } from "../../../services/store";
import { usePermissions } from "../../../hooks/usePermissions";
import { MODULE_LABELS } from "../../../config/permissions.config";
import type { STSNModule } from "../../../config/permissions.config";
import {
  assignUserRole,
  revokeUserRole,
  setRolePermission,
  setUserOverride,
} from "../../../services/securityPermissionService";
import {
  SECURITY_ACTION_LABELS,
  type SecurityPermission,
  type SecurityRole,
} from "../../../types/security-permissions.types";

type AssignmentMode = "role-rights" | "user-access";
type OverrideState = "inherit" | "allow" | "deny";

/** Groups permissions by module, preserving sort order. */
function groupByModule(permissions: SecurityPermission[]) {
  const groups = new Map<STSNModule, SecurityPermission[]>();
  for (const p of [...permissions].sort((a, b) => a.sortOrder - b.sortOrder)) {
    const list = groups.get(p.moduleKey) ?? [];
    list.push(p);
    groups.set(p.moduleKey, list);
  }
  return [...groups.entries()];
}

const permRowLabel = (p: SecurityPermission): string => {
  const action = SECURITY_ACTION_LABELS[p.actionKey] ?? p.actionKey;
  if (!p.pageKey) return `Module Access · ${action}`;
  return `${p.pageKey} · ${action}`;
};

const overrideToBool = (state: OverrideState): boolean | null =>
  state === "allow" ? true : state === "deny" ? false : null;

export default function PageAssignmentPage() {
  const securityCatalog = useSTSNStore((s) => s.securityCatalog);
  const reloadSecurityPermissions = useSTSNStore((s) => s.reloadSecurityPermissions);
  const users = useSTSNStore((s) => s.users);
  const currentUser = useSTSNStore((s) => s.currentUser);
  const { getUserEffectivePermissions, can } = usePermissions();
  const { toast, confirm } = useAppDialog();

  const canManage =
    can("ACCOUNTS_SECURITY", "manage") ||
    currentUser?.role === "SUPER_ADMIN" ||
    currentUser?.role === "ADMIN";

  const [mode, setMode] = useState<AssignmentMode>("role-rights");
  const [roleId, setRoleId] = useState<string>(securityCatalog.roles[0]?.id ?? "");
  const [userId, setUserId] = useState<string>(users[0]?.id ?? "");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const selectedUser = users.find((u) => u.id === userId);

  const grouped = useMemo(() => groupByModule(securityCatalog.permissions), [securityCatalog.permissions]);
  const selectedUserEffective = useMemo(
    () => (selectedUser ? getUserEffectivePermissions(selectedUser.id, selectedUser.role) : null),
    [getUserEffectivePermissions, selectedUser],
  );

  const ctx = { actorUserId: currentUser?.id };

  useEffect(() => {
    if (!roleId && securityCatalog.roles[0]?.id) setRoleId(securityCatalog.roles[0].id);
  }, [roleId, securityCatalog.roles]);

  useEffect(() => {
    if (!userId && users[0]?.id) setUserId(users[0].id);
  }, [userId, users]);

  const toggleCollapsed = (moduleKey: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(moduleKey) ? next.delete(moduleKey) : next.add(moduleKey);
      return next;
    });
  const expandAll = () => setCollapsed(new Set());
  const collapseAll = () => setCollapsed(new Set(grouped.map(([m]) => m)));

  // ── Role Rights: committed set + staged draft ──────────────────────────────
  const selectedRole = securityCatalog.roles.find((r) => r.id === roleId);
  const roleCommitted = useMemo(() => {
    const set = new Set<string>();
    for (const rp of securityCatalog.rolePermissions) {
      if (rp.roleId === roleId && rp.isAllowed) set.add(rp.permissionId);
    }
    return set;
  }, [securityCatalog.rolePermissions, roleId]);

  const [roleDraft, setRoleDraft] = useState<Set<string>>(new Set());
  // Re-seed the draft from the committed set whenever the selected role changes.
  // (Depends only on roleId so in-flight edits aren't wiped by unrelated reloads.)
  useEffect(() => {
    setRoleDraft(new Set(roleCommitted));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleId]);

  const roleDirtyIds = useMemo(() => {
    const dirty = new Set<string>();
    for (const p of securityCatalog.permissions) {
      if (roleDraft.has(p.id) !== roleCommitted.has(p.id)) dirty.add(p.id);
    }
    return dirty;
  }, [securityCatalog.permissions, roleDraft, roleCommitted]);

  const toggleRoleDraft = (permId: string) =>
    setRoleDraft((prev) => {
      const next = new Set(prev);
      next.has(permId) ? next.delete(permId) : next.add(permId);
      return next;
    });

  const setModuleGrant = (perms: SecurityPermission[], grant: boolean) =>
    setRoleDraft((prev) => {
      const next = new Set(prev);
      for (const p of perms) grant ? next.add(p.id) : next.delete(p.id);
      return next;
    });

  const commitRolePerms = async (perms: SecurityPermission[]) => {
    if (!canManage || !selectedRole) return;
    const changes = perms.filter((p) => roleDirtyIds.has(p.id));
    if (changes.length === 0) return;
    setSaving(true);
    try {
      for (const perm of changes) {
        await setRolePermission(selectedRole.id, perm, roleDraft.has(perm.id), ctx);
      }
      await reloadSecurityPermissions();
      toast(`Saved ${changes.length} right${changes.length !== 1 ? "s" : ""} for ${selectedRole.name}`, {
        variant: "success",
      });
    } catch (e) {
      console.error("[PageAssignmentPage] commitRolePerms failed:", e);
      // Reload so the committed set reflects whatever actually persisted; the
      // draft keeps the attempted edits so they still show as unsaved.
      await reloadSecurityPermissions();
      toast("Couldn't save some access rights. Please try again.", { variant: "danger" });
    } finally {
      setSaving(false);
    }
  };

  const discardRole = () => setRoleDraft(new Set(roleCommitted));

  // ── User Access: role assignment (instant) ─────────────────────────────────
  const userAssignedRoleIds = useMemo(() => {
    const set = new Set<string>();
    for (const a of securityCatalog.userRoleAssignments) {
      if (a.userId === userId && a.isActive) set.add(a.roleId);
    }
    return set;
  }, [securityCatalog.userRoleAssignments, userId]);

  const toggleUserRole = async (role: SecurityRole) => {
    if (!canManage || !selectedUser) return;
    const key = `userrole:${role.id}`;
    setBusyKey(key);
    const assigned = userAssignedRoleIds.has(role.id);
    if (assigned) await revokeUserRole(selectedUser.id, role, ctx);
    else await assignUserRole(selectedUser.id, role, { schoolId: selectedUser.schoolId ?? null }, ctx);
    await reloadSecurityPermissions();
    setBusyKey(null);
    toast(`${assigned ? "Revoked" : "Assigned"} ${role.name} for ${selectedUser.name ?? selectedUser.email}`, {
      variant: assigned ? "warning" : "success",
    });
  };

  // ── User Access: overrides (staged) ────────────────────────────────────────
  const overrideCommitted = useMemo(() => {
    const map = new Map<string, OverrideState>();
    for (const ov of securityCatalog.userOverrides) {
      if (ov.userId === userId) map.set(ov.permissionId, ov.isAllowed ? "allow" : "deny");
    }
    return map;
  }, [securityCatalog.userOverrides, userId]);

  const [overrideDraft, setOverrideDraft] = useState<Map<string, OverrideState>>(new Map());
  useEffect(() => {
    setOverrideDraft(new Map(overrideCommitted));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const draftOverrideState = (permId: string): OverrideState => overrideDraft.get(permId) ?? "inherit";
  const committedOverrideState = (permId: string): OverrideState => overrideCommitted.get(permId) ?? "inherit";

  const overrideDirtyIds = useMemo(() => {
    const dirty = new Set<string>();
    for (const p of securityCatalog.permissions) {
      if (draftOverrideState(p.id) !== committedOverrideState(p.id)) dirty.add(p.id);
    }
    return dirty;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [securityCatalog.permissions, overrideDraft, overrideCommitted]);

  const setOverrideState = (permId: string, state: OverrideState) =>
    setOverrideDraft((prev) => {
      const next = new Map(prev);
      next.set(permId, state);
      return next;
    });

  const commitOverrides = async (perms: SecurityPermission[]) => {
    if (!canManage || !selectedUser) return;
    const changes = perms.filter((p) => overrideDirtyIds.has(p.id));
    if (changes.length === 0) return;
    setSaving(true);
    for (const perm of changes) {
      await setUserOverride(selectedUser.id, perm, overrideToBool(draftOverrideState(perm.id)), undefined, ctx);
    }
    await reloadSecurityPermissions();
    setSaving(false);
    toast(`Saved ${changes.length} override${changes.length !== 1 ? "s" : ""} for ${selectedUser.name ?? selectedUser.email}`, {
      variant: "success",
    });
  };

  const discardOverrides = () => setOverrideDraft(new Map(overrideCommitted));

  const confirmLeaveDirty = async (dirtyCount: number): Promise<boolean> => {
    if (dirtyCount === 0) return true;
    return confirm(
      `You have ${dirtyCount} unsaved change${dirtyCount !== 1 ? "s" : ""}.\n\nSwitching will discard them. Continue?`,
    );
  };

  const handleModeChange = async (nextMode: AssignmentMode) => {
    if (nextMode === mode) return;
    const dirty = mode === "role-rights" ? roleDirtyIds.size : overrideDirtyIds.size;
    if (!(await confirmLeaveDirty(dirty))) return;
    if (mode === "role-rights") discardRole();
    else discardOverrides();
    setMode(nextMode);
  };

  const handleRoleChange = async (nextRoleId: string) => {
    if (nextRoleId === roleId) return;
    if (!(await confirmLeaveDirty(roleDirtyIds.size))) return;
    setRoleId(nextRoleId);
  };

  const handleUserChange = async (nextUserId: string) => {
    if (nextUserId === userId) return;
    if (!(await confirmLeaveDirty(overrideDirtyIds.size))) return;
    setUserId(nextUserId);
  };

  if (securityCatalog.roles.length === 0 || securityCatalog.permissions.length === 0) {
    return (
      <AppCard className="border border-[var(--erp-border)]">
        <div className="flex items-start gap-3 p-2">
          <ShieldCheck className="w-5 h-5 text-stsn-brown flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-stone-800">Access Rights catalog not loaded</p>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">
              The RBAC tables (<span className="font-mono">security_roles</span>,{" "}
              <span className="font-mono">security_permissions</span>) returned no rows. Run migration{" "}
              <span className="font-mono">20260701120000_security_rbac_schema.sql</span>. Until then the app
              uses the built-in role permission map, so access still works normally.
            </p>
          </div>
        </div>
      </AppCard>
    );
  }

  return (
    <div className="space-y-5">
      <AppTabs<AssignmentMode>
        items={[
          { value: "role-rights", label: "Role Rights", badge: roleDirtyIds.size || undefined },
          { value: "user-access", label: "User Access & Overrides", badge: overrideDirtyIds.size || undefined },
        ]}
        value={mode}
        onChange={handleModeChange}
        variant="pill"
      />

      {!canManage && (
        <AppCard className="border border-amber-200 bg-amber-50/60">
          <p className="text-xs text-amber-800">
            You have read-only access to the access-rights matrix. Toggles are disabled.
          </p>
        </AppCard>
      )}

      {/* ───────────── ROLE RIGHTS ───────────── */}
      {mode === "role-rights" && (
        <div className="space-y-4">
          {/* Selector + staged save bar */}
          <AppCard className="border border-[var(--erp-border)]">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="min-w-[260px]">
                  <AppFormField label="Role">
                    <AppSelect value={roleId} onChange={(e) => handleRoleChange(e.target.value)}>
                      {securityCatalog.roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.code} — {r.name}
                        </option>
                      ))}
                    </AppSelect>
                  </AppFormField>
                </div>
                <div className="flex items-center gap-2 pb-1">
                  <AppStatusBadge status="Active" className="text-[9px]">
                    {roleDraft.size} active
                  </AppStatusBadge>
                  {roleDirtyIds.size > 0 && (
                    <AppStatusBadge status="Pending" className="text-[9px]">
                      {roleDirtyIds.size} unsaved
                    </AppStatusBadge>
                  )}
                  {selectedRole?.isSystem && (
                    <AppStatusBadge status="Info" className="text-[9px]">
                      System Role
                    </AppStatusBadge>
                  )}
                </div>
              </div>
              {canManage && (
                <div className="flex items-center gap-2 pb-1">
                  <AppButton
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={roleDirtyIds.size ? discardRole : expandAll}
                    leftIcon={roleDirtyIds.size ? RotateCcw : undefined}
                    disabled={saving}
                  >
                    {roleDirtyIds.size ? "Discard" : "Expand all"}
                  </AppButton>
                  {!roleDirtyIds.size && (
                    <AppButton type="button" variant="ghost" size="xs" onClick={collapseAll}>
                      Collapse all
                    </AppButton>
                  )}
                  <AppButton
                    type="button"
                    size="sm"
                    leftIcon={Save}
                    loading={saving}
                    disabled={roleDirtyIds.size === 0}
                    onClick={() => commitRolePerms(securityCatalog.permissions)}
                  >
                    Save All Changes
                  </AppButton>
                </div>
              )}
            </div>
            {selectedRole?.description && (
              <p className="text-[11px] text-stone-500 mt-2">{selectedRole.description}</p>
            )}
          </AppCard>

          {grouped.map(([moduleKey, perms]) => {
            const grantedInModule = perms.filter((p) => roleDraft.has(p.id)).length;
            const moduleDirty = perms.filter((p) => roleDirtyIds.has(p.id)).length;
            const isCollapsed = collapsed.has(moduleKey);
            const allOn = grantedInModule === perms.length;
            return (
              <AppCard key={moduleKey} className="border border-[var(--erp-border)]">
                <div className="flex items-center justify-between gap-3 pb-2 border-b border-stone-100">
                  <button
                    type="button"
                    onClick={() => toggleCollapsed(moduleKey)}
                    className="flex items-center gap-2 min-w-0 text-left cursor-pointer group"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stsn-brown flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-stone-400 group-hover:text-stsn-brown flex-shrink-0" />
                    )}
                    <Layers className="w-3.5 h-3.5 text-stsn-brown flex-shrink-0" />
                    <h3 className="text-xs font-bold text-stone-800 truncate">
                      {MODULE_LABELS[moduleKey] ?? moduleKey}
                    </h3>
                    <span className="text-[9px] font-mono text-stone-400 hidden sm:inline">{moduleKey}</span>
                  </button>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {moduleDirty > 0 && (
                      <AppStatusBadge status="Pending" className="text-[9px]">
                        {moduleDirty} unsaved
                      </AppStatusBadge>
                    )}
                    <span className="text-[10px] font-mono text-stone-400">
                      {grantedInModule}/{perms.length}
                    </span>
                    {canManage && (
                      <AppButton
                        type="button"
                        size="xs"
                        variant="secondary"
                        leftIcon={Save}
                        loading={saving}
                        disabled={moduleDirty === 0}
                        onClick={() => commitRolePerms(perms)}
                      >
                        Save
                      </AppButton>
                    )}
                  </div>
                </div>

                {!isCollapsed && (
                  <>
                    {canManage && (
                      <div className="flex items-center gap-3 py-2 mb-1">
                        <button
                          type="button"
                          onClick={() => setModuleGrant(perms, !allOn)}
                          className="text-[10px] font-semibold text-stsn-brown hover:underline cursor-pointer"
                        >
                          {allOn ? "Disable all in module" : "Enable all in module"}
                        </button>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {perms.map((perm) => {
                        const granted = roleDraft.has(perm.id);
                        const dirty = roleDirtyIds.has(perm.id);
                        return (
                          <label
                            key={perm.id}
                            className={`flex items-center justify-between gap-3 px-3 py-2 rounded-xl border transition-all ${
                              granted
                                ? "border-emerald-200 bg-emerald-50/70"
                                : "border-stone-200 bg-white"
                            } ${dirty ? "ring-1 ring-stsn-gold/60" : ""} ${
                              canManage ? "cursor-pointer hover:brightness-[0.99]" : "opacity-70"
                            }`}
                          >
                            <span className="min-w-0">
                              <span className="block text-[11px] font-semibold text-stone-800 truncate">
                                {permRowLabel(perm)}
                              </span>
                              <span className="block text-[9px] text-stone-400 truncate">{perm.label}</span>
                            </span>
                            <AppToggle
                              checked={granted}
                              disabled={!canManage}
                              onChange={() => toggleRoleDraft(perm.id)}
                              aria-label={`${granted ? "Revoke" : "Grant"} ${perm.label}`}
                            />
                          </label>
                        );
                      })}
                    </div>
                  </>
                )}
              </AppCard>
            );
          })}
        </div>
      )}

      {/* ───────────── USER ACCESS ───────────── */}
      {mode === "user-access" && (
        <div className="space-y-4">
          <AppCard className="border border-[var(--erp-border)]">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-[280px] max-w-md flex-1">
                <AppFormField label="User">
                  <AppSelect value={userId} onChange={(e) => handleUserChange(e.target.value)}>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {(u.name ?? u.email) + " — " + u.role}
                      </option>
                    ))}
                  </AppSelect>
                </AppFormField>
              </div>
              {canManage && (
                <div className="flex items-center gap-2 pb-1">
                  {overrideDirtyIds.size > 0 && (
                    <>
                      <AppStatusBadge status="Pending" className="text-[9px]">
                        {overrideDirtyIds.size} unsaved
                      </AppStatusBadge>
                      <AppButton
                        type="button"
                        variant="ghost"
                        size="xs"
                        leftIcon={RotateCcw}
                        onClick={discardOverrides}
                        disabled={saving}
                      >
                        Discard
                      </AppButton>
                    </>
                  )}
                  <AppButton
                    type="button"
                    size="sm"
                    leftIcon={Save}
                    loading={saving}
                    disabled={overrideDirtyIds.size === 0}
                    onClick={() => commitOverrides(securityCatalog.permissions)}
                  >
                    Save All Overrides
                  </AppButton>
                </div>
              )}
            </div>
          </AppCard>

          {/* Role assignment (instant) */}
          <AppCard className="border border-[var(--erp-border)]">
            <div className="flex items-center gap-2 pb-2 mb-3 border-b border-stone-100">
              <UserCog className="w-3.5 h-3.5 text-stsn-brown" />
              <h3 className="text-xs font-bold text-stone-800">Assigned Roles</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {securityCatalog.roles.map((role) => {
                const assigned = userAssignedRoleIds.has(role.id);
                const key = `userrole:${role.id}`;
                return (
                  <button
                    key={role.id}
                    type="button"
                    disabled={!canManage || busyKey === key}
                    onClick={() => toggleUserRole(role)}
                    className={`px-3 py-1.5 rounded-full border text-[11px] font-semibold transition-all ${
                      assigned
                        ? "border-stsn-gold/50 bg-stsn-gold/15 text-stsn-brown"
                        : "border-stone-200 bg-white text-stone-500 hover:bg-stone-50"
                    } ${!canManage ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    {assigned ? "✓ " : "+ "}
                    {role.code}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-stone-400 mt-2">
              Role assignments apply immediately and are cumulative. A user keeps access from every active role
              plus any explicit allow/deny override below.
            </p>
          </AppCard>

          {selectedUserEffective && (
            <AppCard className="border border-[var(--erp-border)]">
              <div className="flex items-center justify-between gap-3 pb-2 mb-3 border-b border-stone-100">
                <h3 className="text-xs font-bold text-stone-800">Effective Access Snapshot</h3>
                <span className="text-[10px] font-mono text-stone-400">
                  {selectedUserEffective.modules.size} module{selectedUserEffective.modules.size !== 1 ? "s" : ""} · saved
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.from(selectedUserEffective.modules).sort().map((moduleKey) => (
                  <span
                    key={moduleKey}
                    className="px-2.5 py-1 rounded-full border border-stone-200 bg-stone-50 text-[10px] font-mono text-stone-600"
                  >
                    {MODULE_LABELS[moduleKey] ?? moduleKey}
                  </span>
                ))}
              </div>
            </AppCard>
          )}

          {/* Per-user overrides (staged) */}
          <p className="text-[11px] text-stone-500 px-1">
            Overrides layer on top of role grants. Set each right to{" "}
            <span className="font-semibold">Inherit</span>, <span className="font-semibold text-emerald-600">Allow</span>{" "}
            or <span className="font-semibold text-rose-600">Deny</span>, then Save.
          </p>
          {grouped.map(([moduleKey, perms]) => {
            const moduleDirty = perms.filter((p) => overrideDirtyIds.has(p.id)).length;
            const isCollapsed = collapsed.has(moduleKey);
            return (
              <AppCard key={moduleKey} className="border border-[var(--erp-border)]">
                <div className="flex items-center justify-between gap-3 pb-2 border-b border-stone-100">
                  <button
                    type="button"
                    onClick={() => toggleCollapsed(moduleKey)}
                    className="flex items-center gap-2 min-w-0 text-left cursor-pointer group"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stsn-brown flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-stone-400 group-hover:text-stsn-brown flex-shrink-0" />
                    )}
                    <Layers className="w-3.5 h-3.5 text-stsn-brown flex-shrink-0" />
                    <h3 className="text-xs font-bold text-stone-800 truncate">
                      {MODULE_LABELS[moduleKey] ?? moduleKey}
                    </h3>
                  </button>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {moduleDirty > 0 && (
                      <AppStatusBadge status="Pending" className="text-[9px]">
                        {moduleDirty} unsaved
                      </AppStatusBadge>
                    )}
                    {canManage && (
                      <AppButton
                        type="button"
                        size="xs"
                        variant="secondary"
                        leftIcon={Save}
                        loading={saving}
                        disabled={moduleDirty === 0}
                        onClick={() => commitOverrides(perms)}
                      >
                        Save
                      </AppButton>
                    )}
                  </div>
                </div>

                {!isCollapsed && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-2">
                    {perms.map((perm) => {
                      const state = draftOverrideState(perm.id);
                      const dirty = overrideDirtyIds.has(perm.id);
                      return (
                        <div
                          key={perm.id}
                          className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border transition-all ${
                            state === "allow"
                              ? "border-emerald-200 bg-emerald-50/70"
                              : state === "deny"
                                ? "border-rose-200 bg-rose-50/70"
                                : "border-stone-200 bg-white"
                          } ${dirty ? "ring-1 ring-stsn-gold/60" : ""}`}
                        >
                          <span className="min-w-0">
                            <span className="block text-[11px] font-semibold text-stone-800 truncate">
                              {permRowLabel(perm)}
                            </span>
                            <span className="block text-[9px] text-stone-400 truncate">{perm.label}</span>
                          </span>
                          <OverrideSegments
                            state={state}
                            disabled={!canManage}
                            onChange={(next) => setOverrideState(perm.id, next)}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </AppCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Compact tri-state segmented control: Inherit · Allow · Deny. */
function OverrideSegments({
  state,
  disabled,
  onChange,
}: {
  state: OverrideState;
  disabled: boolean;
  onChange: (next: OverrideState) => void;
}) {
  const segments: { value: OverrideState; icon: React.ElementType; title: string; active: string }[] = [
    { value: "inherit", icon: Minus, title: "Inherit", active: "bg-stone-200 text-stone-600" },
    { value: "allow", icon: Check, title: "Allow", active: "bg-emerald-500 text-white" },
    { value: "deny", icon: X, title: "Deny", active: "bg-rose-500 text-white" },
  ];
  return (
    <div className="flex-shrink-0 inline-flex rounded-lg border border-stone-200 bg-white overflow-hidden">
      {segments.map(({ value, icon: Icon, title, active }) => {
        const isActive = state === value;
        return (
          <button
            key={value}
            type="button"
            title={title}
            disabled={disabled}
            aria-pressed={isActive}
            onClick={() => onChange(value)}
            className={`w-7 h-7 flex items-center justify-center transition-colors ${
              isActive ? active : "text-stone-400 hover:bg-stone-50"
            } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        );
      })}
    </div>
  );
}

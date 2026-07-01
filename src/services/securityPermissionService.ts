/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Centralized RBAC permission service for User Access & Authority.
 *
 * Responsibilities:
 *   1. Load the security_* catalog from Supabase (once, on app init).
 *   2. Resolve a user's *effective* permissions = role grants ⊕ user overrides.
 *   3. Provide pure check helpers (hasModuleAccess / hasPageAccess / can / canPage).
 *   4. Write helpers for the Page Assignment UI, each persisting an audit row.
 *
 * Fallback guarantee: when the catalog is empty/unavailable the resolver falls
 * back to the hardcoded ROLE_PERMISSIONS map, so the app behaves exactly as it
 * did before this layer existed.
 */

import { supabase } from "../lib/supabase";
import { dbSelectAll, dbInsert, dbUpdate, newId } from "./supabaseCrud";
import { getPermissionsForRole } from "../config/permissions.config";
import type { STSNModule } from "../config/permissions.config";
import type { UserRole } from "../types";
import {
  permissionKey,
  EMPTY_SECURITY_CATALOG,
  type EffectivePermissions,
  type SecurityAction,
  type SecurityCatalog,
  type SecurityPermission,
  type SecurityRole,
} from "../types/security-permissions.types";

const now = () => new Date().toISOString();

/** Loads the full RBAC catalog. Each table degrades to [] on failure. */
export async function loadSecurityCatalog(): Promise<SecurityCatalog> {
  try {
    const [roles, permissions, rolePermissions, userRoleAssignments, userOverrides] =
      await Promise.all([
        dbSelectAll<SecurityRole>("security_roles"),
        dbSelectAll<SecurityPermission>("security_permissions"),
        dbSelectAll<SecurityCatalog["rolePermissions"][number]>("security_role_permissions"),
        dbSelectAll<SecurityCatalog["userRoleAssignments"][number]>("security_user_role_assignments"),
        dbSelectAll<SecurityCatalog["userOverrides"][number]>("security_user_permission_overrides"),
      ]);
    return { roles, permissions, rolePermissions, userRoleAssignments, userOverrides };
  } catch (e) {
    console.error("[securityPermissionService] loadSecurityCatalog failed:", e);
    return EMPTY_SECURITY_CATALOG;
  }
}

const assignmentIsCurrent = (a: SecurityCatalog["userRoleAssignments"][number]): boolean => {
  if (!a.isActive) return false;
  const t = Date.now();
  if (a.effectiveFrom && new Date(a.effectiveFrom).getTime() > t) return false;
  if (a.effectiveUntil && new Date(a.effectiveUntil).getTime() < t) return false;
  return true;
};

export function getPrimaryRoleCode(
  catalog: SecurityCatalog,
  userId: string,
  fallbackRole: UserRole,
): UserRole {
  if (catalog.roles.length === 0) return fallbackRole;
  const roleById = new Map(catalog.roles.map((r) => [r.id, r]));
  const activeAssignments = catalog.userRoleAssignments.filter(
    (assignment) => assignment.userId === userId && assignmentIsCurrent(assignment),
  );
  const primaryAssignment =
    activeAssignments.find((assignment) => assignment.isPrimary) ??
    activeAssignments[0];
  return roleById.get(primaryAssignment?.roleId ?? "")?.code ?? fallbackRole;
}

/** Builds the fallback effective set from the hardcoded ROLE_PERMISSIONS map. */
function fallbackEffective(userId: string, role: UserRole): EffectivePermissions {
  const modules = getPermissionsForRole(role);
  const allowed = new Set<string>();
  for (const m of modules) allowed.add(permissionKey(m, null, "view"));
  return {
    userId,
    roleCodes: [role],
    allowed,
    modules: new Set<STSNModule>(modules),
    fallback: true,
  };
}

/**
 * Resolves a user's effective permissions from the catalog.
 * @param fallbackRole the user's `users.role` — used to seed roleCodes when the
 *   user has no DB assignment, and to fall back entirely when the catalog is empty.
 */
export function computeEffectivePermissions(
  catalog: SecurityCatalog,
  userId: string,
  fallbackRole: UserRole,
): EffectivePermissions {
  // No catalog at all → legacy behavior.
  if (catalog.permissions.length === 0 || catalog.roles.length === 0) {
    return fallbackEffective(userId, fallbackRole);
  }

  const permById = new Map(catalog.permissions.map((p) => [p.id, p]));
  const roleById = new Map(catalog.roles.map((r) => [r.id, r]));

  // Roles held by the user (current assignments only). Fall back to users.role.
  const assignedRoleIds = catalog.userRoleAssignments
    .filter((a) => a.userId === userId && assignmentIsCurrent(a))
    .map((a) => a.roleId);

  let roleCodes: UserRole[] = assignedRoleIds
    .map((id) => roleById.get(id)?.code)
    .filter((c): c is UserRole => Boolean(c));

  let effectiveRoleIds = assignedRoleIds;
  if (roleCodes.length === 0) {
    // No DB assignment — synthesize from users.role so the user isn't locked out.
    const role = catalog.roles.find((r) => r.code === fallbackRole);
    if (!role) return fallbackEffective(userId, fallbackRole);
    roleCodes = [fallbackRole];
    effectiveRoleIds = [role.id];
  }

  const roleIdSet = new Set(effectiveRoleIds);
  const allowed = new Set<string>();
  const denied = new Set<string>();

  const keyFor = (p: SecurityPermission) => permissionKey(p.moduleKey, p.pageKey, p.actionKey);

  // 1. Role-inherited grants.
  for (const rp of catalog.rolePermissions) {
    if (!roleIdSet.has(rp.roleId)) continue;
    const p = permById.get(rp.permissionId);
    if (!p || !p.isActive) continue;
    const k = keyFor(p);
    if (rp.isAllowed) allowed.add(k);
    else denied.add(k);
  }

  // 2. User overrides win over role grants.
  for (const ov of catalog.userOverrides) {
    if (ov.userId !== userId) continue;
    const p = permById.get(ov.permissionId);
    if (!p) continue;
    const k = keyFor(p);
    if (ov.isAllowed) {
      allowed.add(k);
      denied.delete(k);
    } else {
      allowed.delete(k);
      denied.add(k);
    }
  }

  for (const k of denied) allowed.delete(k);

  // Derive the set of modules the user can touch at all.
  const modules = new Set<STSNModule>();
  for (const p of catalog.permissions) {
    if (allowed.has(keyFor(p))) modules.add(p.moduleKey);
  }

  return { userId, roleCodes, allowed, modules, fallback: false };
}

// ── Pure check helpers (operate on a resolved EffectivePermissions) ──────────

export function hasModuleAccess(eff: EffectivePermissions, moduleKey: STSNModule): boolean {
  return eff.modules.has(moduleKey);
}

export function hasPageAccess(
  eff: EffectivePermissions,
  moduleKey: STSNModule,
  pageKey: string,
): boolean {
  if (eff.fallback) return eff.modules.has(moduleKey);
  // Page access = the page has a "view" grant, or any action grant on that page.
  if (eff.allowed.has(permissionKey(moduleKey, pageKey, "view"))) return true;
  const prefix = `${moduleKey}:${pageKey}:`;
  for (const k of eff.allowed) if (k.startsWith(prefix)) return true;
  return false;
}

/** True when the RBAC catalog explicitly manages at least one permission row for the page. */
export function pageHasManagedPermissions(
  catalog: SecurityCatalog,
  moduleKey: STSNModule,
  pageKey: string,
): boolean {
  return catalog.permissions.some((p) => p.moduleKey === moduleKey && p.pageKey === pageKey);
}

/** Module-level action right (page_key null). */
export function can(
  eff: EffectivePermissions,
  moduleKey: STSNModule,
  actionKey: SecurityAction,
): boolean {
  if (eff.fallback) return eff.modules.has(moduleKey);
  return eff.allowed.has(permissionKey(moduleKey, null, actionKey));
}

/** Page-level action right. */
export function canPage(
  eff: EffectivePermissions,
  moduleKey: STSNModule,
  pageKey: string,
  actionKey: SecurityAction,
): boolean {
  if (eff.fallback) return eff.modules.has(moduleKey);
  return eff.allowed.has(permissionKey(moduleKey, pageKey, actionKey));
}

/** Resolves the permission keys granted to a role code (no overrides). */
export function getRolePermissions(catalog: SecurityCatalog, roleCode: UserRole): Set<string> {
  const role = catalog.roles.find((r) => r.code === roleCode);
  const out = new Set<string>();
  if (!role) return out;
  const permById = new Map(catalog.permissions.map((p) => [p.id, p]));
  for (const rp of catalog.rolePermissions) {
    if (rp.roleId !== role.id || !rp.isAllowed) continue;
    const p = permById.get(rp.permissionId);
    if (p) out.add(permissionKey(p.moduleKey, p.pageKey, p.actionKey));
  }
  return out;
}

// ── Write helpers (Page Assignment UI). All persist an audit row. ────────────

export interface AuditContext {
  actorUserId?: string;
}

async function writeAudit(entry: {
  actorUserId?: string;
  targetUserId?: string | null;
  targetRoleId?: string | null;
  action: string;
  moduleKey?: string | null;
  pageKey?: string | null;
  permissionKey?: string | null;
  previousValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  remarks?: string | null;
}): Promise<void> {
  await dbInsert("security_access_audit_logs", {
    id: newId(),
    actorUserId: entry.actorUserId ?? null,
    targetUserId: entry.targetUserId ?? null,
    targetRoleId: entry.targetRoleId ?? null,
    action: entry.action,
    moduleKey: entry.moduleKey ?? null,
    pageKey: entry.pageKey ?? null,
    permissionKey: entry.permissionKey ?? null,
    previousValue: entry.previousValue ?? null,
    newValue: entry.newValue ?? null,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    remarks: entry.remarks ?? null,
    createdAt: now(),
  });
}

/**
 * Upserts a role→permission grant and audits the change.
 *
 * Resolves the existing grant by its natural key (role_id, permission_id) and
 * UPDATEs it in place, only INSERTing when absent. This is deliberately NOT a
 * PostgREST `upsert(..., { onConflict })`, because that requires a live unique
 * constraint on (role_id, permission_id) — which is missing whenever the table
 * pre-existed the RBAC migration (an inline `create table if not exists`
 * constraint is never added retroactively). Doing the lookup ourselves makes the
 * save work regardless of that constraint, keeps the primary key stable across
 * toggles, and guarantees we never create a duplicate grant row.
 *
 * Handles module-level permissions (page_key = null) identically — the grant is
 * keyed by permission_id, so a null page_key never affects persistence.
 *
 * Throws on any DB error so the caller can surface a real failure instead of a
 * misleading "Saved" confirmation.
 */
export async function setRolePermission(
  roleId: string,
  permission: SecurityPermission,
  isAllowed: boolean,
  ctx: AuditContext = {},
): Promise<void> {
  const { data: existing, error: findError } = await supabase
    .from("security_role_permissions")
    .select("id")
    .eq("role_id", roleId)
    .eq("permission_id", permission.id)
    .limit(1);
  if (findError) {
    console.error("[securityPermissionService] setRolePermission lookup failed:", findError);
    throw findError;
  }

  const existingId = existing?.[0]?.id as string | undefined;
  const { error } = existingId
    ? await supabase
        .from("security_role_permissions")
        .update({ is_allowed: isAllowed, updated_at: now() })
        .eq("id", existingId)
    : await supabase
        .from("security_role_permissions")
        .insert({ id: newId(), role_id: roleId, permission_id: permission.id, is_allowed: isAllowed, updated_at: now() });
  if (error) {
    console.error("[securityPermissionService] setRolePermission failed:", error);
    throw error;
  }
  await writeAudit({
    actorUserId: ctx.actorUserId,
    targetRoleId: roleId,
    action: isAllowed ? "ROLE_PERMISSION_GRANTED" : "ROLE_PERMISSION_REVOKED",
    moduleKey: permission.moduleKey,
    pageKey: permission.pageKey,
    permissionKey: permissionKey(permission.moduleKey, permission.pageKey, permission.actionKey),
    newValue: { isAllowed },
  });
}

/** Assigns (or re-activates) a role for a user and audits it. */
export async function assignUserRole(
  userId: string,
  role: SecurityRole,
  options: { isPrimary?: boolean; schoolId?: string | null } = {},
  ctx: AuditContext = {},
): Promise<void> {
  const isPrimary = options.isPrimary ?? true;
  const { error } = await supabase
    .from("security_user_role_assignments")
    .upsert(
      {
        id: newId(),
        user_id: userId,
        role_id: role.id,
        school_id: options.schoolId ?? null,
        is_primary: isPrimary,
        is_active: true,
        effective_from: now(),
        updated_at: now(),
      },
      { onConflict: "user_id,role_id" },
    );
  if (error) console.error("[securityPermissionService] assignUserRole failed:", error);
  if (isPrimary) {
    await dbUpdate("users", userId, { role: role.code });
  }
  await writeAudit({
    actorUserId: ctx.actorUserId,
    targetUserId: userId,
    targetRoleId: role.id,
    action: "USER_ROLE_ASSIGNED",
    newValue: { roleCode: role.code, isPrimary },
  });
}

/** Deactivates a user's role assignment and audits it. */
export async function revokeUserRole(
  userId: string,
  role: SecurityRole,
  ctx: AuditContext = {},
): Promise<void> {
  const { error } = await supabase
    .from("security_user_role_assignments")
    .update({ is_active: false, effective_until: now(), updated_at: now() })
    .eq("user_id", userId)
    .eq("role_id", role.id);
  if (error) console.error("[securityPermissionService] revokeUserRole failed:", error);

  const { data: activeAssignments, error: activeAssignmentsError } = await supabase
    .from("security_user_role_assignments")
    .select("is_primary, security_roles!inner(code)")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (activeAssignmentsError) {
    console.error("[securityPermissionService] load active assignments after revoke failed:", activeAssignmentsError);
  } else {
    const resolveCode = (assignment: any): UserRole | undefined => {
      const raw = assignment?.security_roles;
      if (Array.isArray(raw)) return raw[0]?.code;
      return raw?.code;
    };
    const nextPrimary =
      resolveCode(activeAssignments.find((assignment) => assignment.is_primary)) ??
      resolveCode(activeAssignments[0]);
    if (nextPrimary) {
      await dbUpdate("users", userId, { role: nextPrimary });
    }
  }

  await writeAudit({
    actorUserId: ctx.actorUserId,
    targetUserId: userId,
    targetRoleId: role.id,
    action: "USER_ROLE_REVOKED",
    newValue: { roleCode: role.code },
  });
}

/** Sets (or clears) a per-user permission override and audits it. */
export async function setUserOverride(
  userId: string,
  permission: SecurityPermission,
  isAllowed: boolean | null,
  reason: string | undefined,
  ctx: AuditContext = {},
): Promise<void> {
  if (isAllowed === null) {
    const { error } = await supabase
      .from("security_user_permission_overrides")
      .delete()
      .eq("user_id", userId)
      .eq("permission_id", permission.id);
    if (error) console.error("[securityPermissionService] clear override failed:", error);
  } else {
    const { error } = await supabase
      .from("security_user_permission_overrides")
      .upsert(
        { id: newId(), user_id: userId, permission_id: permission.id, is_allowed: isAllowed, reason: reason ?? null, updated_at: now() },
        { onConflict: "user_id,permission_id" },
      );
    if (error) console.error("[securityPermissionService] setUserOverride failed:", error);
  }
  await writeAudit({
    actorUserId: ctx.actorUserId,
    targetUserId: userId,
    action: isAllowed === null ? "USER_OVERRIDE_CLEARED" : isAllowed ? "USER_OVERRIDE_ALLOW" : "USER_OVERRIDE_DENY",
    moduleKey: permission.moduleKey,
    pageKey: permission.pageKey,
    permissionKey: permissionKey(permission.moduleKey, permission.pageKey, permission.actionKey),
    newValue: { isAllowed, reason: reason ?? null },
  });
}

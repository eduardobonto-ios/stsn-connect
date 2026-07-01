/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Types for the User Access & Authority RBAC layer (Page Assignment).
 * Mirrors the security_* tables created in
 * supabase/migrations/20260701120000_security_rbac_schema.sql.
 */

import type { STSNModule } from "../config/permissions.config";
import type { UserRole } from "./index";

/** Granular action rights. Not every module/page supports every action. */
export type SecurityAction =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "export"
  | "print"
  | "approve"
  | "reject"
  | "void"
  | "post"
  | "import"
  | "manage"
  | "audit";

export const SECURITY_ACTIONS: SecurityAction[] = [
  "view", "create", "edit", "delete", "export", "print",
  "approve", "reject", "void", "post", "import", "manage", "audit",
];

export const SECURITY_ACTION_LABELS: Record<SecurityAction, string> = {
  view: "View",
  create: "Create",
  edit: "Edit",
  delete: "Delete",
  export: "Export",
  print: "Print",
  approve: "Approve",
  reject: "Reject",
  void: "Void",
  post: "Post",
  import: "Import",
  manage: "Manage",
  audit: "Audit",
};

/** security_roles row. `code` matches UserRole / the JWT role claim. */
export interface SecurityRole {
  id: string;
  code: UserRole;
  name: string;
  description?: string | null;
  isSystem: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** security_permissions row. `pageKey` null = module-level access. */
export interface SecurityPermission {
  id: string;
  moduleKey: STSNModule;
  pageKey: string | null;
  actionKey: SecurityAction;
  label: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
}

/** security_role_permissions row. */
export interface SecurityRolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  isAllowed: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** security_user_role_assignments row. */
export interface SecurityUserRoleAssignment {
  id: string;
  userId: string;
  roleId: string;
  schoolId?: string | null;
  academicUnit?: string | null;
  isPrimary: boolean;
  isActive: boolean;
  effectiveFrom?: string;
  effectiveUntil?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/** security_user_permission_overrides row. */
export interface SecurityUserPermissionOverride {
  id: string;
  userId: string;
  permissionId: string;
  isAllowed: boolean;
  reason?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/** security_access_audit_logs row. */
export interface SecurityAccessAuditLog {
  id: string;
  actorUserId?: string | null;
  targetUserId?: string | null;
  targetRoleId?: string | null;
  action: string;
  moduleKey?: string | null;
  pageKey?: string | null;
  permissionKey?: string | null;
  previousValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  remarks?: string | null;
  createdAt?: string;
}

/**
 * A resolved permission key string used for fast effective-set lookups.
 * Format: `MODULE_KEY` | `MODULE_KEY:page_key` | `MODULE_KEY:page_key:action`.
 * We always also store the action-qualified form so `can()`/`canPage()` work.
 */
export type PermissionKey = string;

/** Canonical permission-key builder shared by service + hook. */
export function permissionKey(
  moduleKey: string,
  pageKey?: string | null,
  actionKey?: string | null,
): PermissionKey {
  const parts = [moduleKey];
  if (pageKey) parts.push(pageKey);
  if (actionKey) parts.push(actionKey);
  return parts.join(":");
}

/**
 * The fully-resolved permission picture for one user: which roles they hold and
 * the flattened set of permission keys they are effectively allowed.
 */
export interface EffectivePermissions {
  userId: string;
  roleCodes: UserRole[];
  /** Allowed permission keys (action-qualified, e.g. "CASHIER:queue:void"). */
  allowed: Set<PermissionKey>;
  /** Module keys the user can access at all (any allowed permission in module). */
  modules: Set<STSNModule>;
  /**
   * True when resolved from the hardcoded ROLE_PERMISSIONS fallback (DB catalog
   * empty/unavailable). In fallback mode action checks degrade to module access
   * so behavior is identical to the pre-RBAC app.
   */
  fallback: boolean;
}

/** Snapshot of every security table, loaded once on app init. */
export interface SecurityCatalog {
  roles: SecurityRole[];
  permissions: SecurityPermission[];
  rolePermissions: SecurityRolePermission[];
  userRoleAssignments: SecurityUserRoleAssignment[];
  userOverrides: SecurityUserPermissionOverride[];
}

export const EMPTY_SECURITY_CATALOG: SecurityCatalog = {
  roles: [],
  permissions: [],
  rolePermissions: [],
  userRoleAssignments: [],
  userOverrides: [],
};

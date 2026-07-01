/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * React hook exposing the current user's effective permissions plus the check
 * helpers required across navigation, page access and action-level buttons.
 *
 * Usage:
 *   const { can, canPage, hasModuleAccess } = usePermissions();
 *   if (!can("CASHIER", "void")) return null;            // module-level action
 *   if (!canPage("ACCOUNTING", "ledger", "post")) ...;   // page-level action
 */

import { useMemo } from "react";
import { useSTSNStore } from "../services/store";
import {
  can as svcCan,
  canPage as svcCanPage,
  hasModuleAccess as svcHasModuleAccess,
  hasPageAccess as svcHasPageAccess,
  pageHasManagedPermissions,
  computeEffectivePermissions,
  getRolePermissions as svcGetRolePermissions,
} from "../services/securityPermissionService";
import type { STSNModule } from "../config/permissions.config";
import type { UserRole } from "../types";
import type { EffectivePermissions, SecurityAction } from "../types/security-permissions.types";

export interface UsePermissions {
  /** Resolved effective permissions for the signed-in user (null if logged out). */
  effective: EffectivePermissions | null;
  /** True while resolved from the hardcoded ROLE_PERMISSIONS fallback. */
  usingFallback: boolean;
  hasModuleAccess: (moduleKey: STSNModule) => boolean;
  hasPageAccess: (moduleKey: STSNModule, pageKey: string) => boolean;
  /** Module-level action right (page_key null). */
  can: (moduleKey: STSNModule, actionKey: SecurityAction) => boolean;
  /** Page-level action right. */
  canPage: (moduleKey: STSNModule, pageKey: string, actionKey: SecurityAction) => boolean;
  /** Effective permissions for an arbitrary user (admin tooling). */
  getUserEffectivePermissions: (userId: string, role: UserRole) => EffectivePermissions;
  /** Permission keys granted to a role code. */
  getRolePermissions: (roleCode: UserRole) => Set<string>;
}

export function usePermissions(): UsePermissions {
  const currentUser = useSTSNStore((s) => s.currentUser);
  const catalog = useSTSNStore((s) => s.securityCatalog);
  const effective = useSTSNStore((s) => s.effectivePermissions);

  return useMemo<UsePermissions>(() => {
    const resolved =
      effective ??
      (currentUser
        ? computeEffectivePermissions(catalog, currentUser.id, currentUser.role)
        : null);

    return {
      effective: resolved,
      usingFallback: resolved?.fallback ?? true,
      hasModuleAccess: (moduleKey) => (resolved ? svcHasModuleAccess(resolved, moduleKey) : false),
      hasPageAccess: (moduleKey, pageKey) => {
        if (!resolved) return false;
        if (!pageHasManagedPermissions(catalog, moduleKey, pageKey)) {
          return svcHasModuleAccess(resolved, moduleKey);
        }
        return svcHasPageAccess(resolved, moduleKey, pageKey);
      },
      can: (moduleKey, actionKey) => (resolved ? svcCan(resolved, moduleKey, actionKey) : false),
      canPage: (moduleKey, pageKey, actionKey) => (resolved ? svcCanPage(resolved, moduleKey, pageKey, actionKey) : false),
      getUserEffectivePermissions: (userId, role) => computeEffectivePermissions(catalog, userId, role),
      getRolePermissions: (roleCode) => svcGetRolePermissions(catalog, roleCode),
    };
  }, [catalog, effective, currentUser]);
}

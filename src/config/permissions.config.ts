/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { UserRole } from "../types";
import type { CanonicalRole } from "../types/role.types";
import { toCanonicalRole } from "../types/role.types";

export type STSNModule =
  | "DASHBOARD"
  | "REGISTRAR"
  | "ACCOUNTING"
  | "CASHIER"
  | "BOOKS_SETUP"
  | "GRADING"
  | "CURRICULUM"
  | "STUDENT_PORTAL"
  | "FACULTY_PORTAL"
  | "HR_MANAGEMENT"
  | "ACCOUNTS_SECURITY"
  | "CORE_SETUP"
  | "SCHEDULING"
  | "CLASS_SECTIONING"
  | "ONLINE_LEARNING";

/** A permission is module-level access. Permission checks are role-only — never academic-unit-only. */
export type Permission = STSNModule;

/**
 * Module access granted to each canonical role.
 * This is PERMISSION (role-based) — keep separate from academic-unit behavior
 * (grading schemes, enrollment structure, profile labels, etc).
 */
export const ROLE_PERMISSIONS: Record<CanonicalRole, Permission[]> = {
  "super-admin": ["DASHBOARD", "REGISTRAR", "ACCOUNTING", "CASHIER", "BOOKS_SETUP", "GRADING", "CURRICULUM", "STUDENT_PORTAL", "FACULTY_PORTAL", "HR_MANAGEMENT", "ACCOUNTS_SECURITY", "CORE_SETUP", "SCHEDULING", "CLASS_SECTIONING", "ONLINE_LEARNING"],
  registrar: ["DASHBOARD", "REGISTRAR", "CURRICULUM", "STUDENT_PORTAL", "SCHEDULING", "CLASS_SECTIONING", "BOOKS_SETUP"],
  accounting: ["ACCOUNTING", "BOOKS_SETUP"],
  cashier: ["CASHIER"],
  teacher: ["FACULTY_PORTAL", "GRADING", "CURRICULUM", "ONLINE_LEARNING"],
  student: ["STUDENT_PORTAL"],
  hr: ["DASHBOARD", "HR_MANAGEMENT"],
};

/**
 * Resolves the module permissions for a user's role.
 * Permission checks are intentionally role-only — academic unit must never
 * gate module *access*, only the academic structure/workflow shown inside a module.
 */
export function getPermissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[toCanonicalRole(role)] ?? ["DASHBOARD"];
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { UserRole } from "../types";
import type { CanonicalRole } from "../types/role.types";
import { toCanonicalRole } from "../types/role.types";

export type STSNModule =
  | "DASHBOARD"
  | "ACTION_CENTER"
  | "PAYROLL_DASHBOARD"
  | "ACCOUNTING_DASHBOARD"
  | "REGISTRAR"
  | "STUDENT_DIRECTORY"
  | "ACCOUNTING"
  | "CASHIER"
  | "BOOKS_SETUP"
  | "GRADING"
  | "CURRICULUM"
  | "STUDENT_PORTAL"
  | "FACULTY_PORTAL"
  | "FACULTY_ADMIN"
  | "HR_MANAGEMENT"
  | "ACCOUNTS_SECURITY"
  | "CORE_SETUP"
  | "SCHEDULING"
  | "CLASS_SECTIONING"
  | "ONLINE_LEARNING"
  | "NURSE_CLINIC"
  | "GUIDANCE"
  | "CONSULTATION"
  | "REGISTRAR_REPORTS"
  | "GUIDANCE_REPORTS"
  | "CLINIC_REPORTS"
  | "ADMIN_REPORTS"
  | "PAYROLL_MANAGEMENT"
  | "GUARDIAN_PORTAL";

/** A permission is module-level access. Permission checks are role-only — never academic-unit-only. */
export type Permission = STSNModule;

/**
 * Module access granted to each canonical role.
 * This is PERMISSION (role-based) — keep separate from academic-unit behavior
 * (grading schemes, enrollment structure, profile labels, etc).
 */
export const ROLE_PERMISSIONS: Record<CanonicalRole, Permission[]> = {
  "super-admin": ["DASHBOARD", "ACTION_CENTER", "PAYROLL_DASHBOARD", "ACCOUNTING_DASHBOARD", "REGISTRAR", "STUDENT_DIRECTORY", "ACCOUNTING", "CASHIER", "BOOKS_SETUP", "GRADING", "CURRICULUM", "STUDENT_PORTAL", "FACULTY_PORTAL", "FACULTY_ADMIN", "HR_MANAGEMENT", "PAYROLL_MANAGEMENT", "ACCOUNTS_SECURITY", "CORE_SETUP", "SCHEDULING", "CLASS_SECTIONING", "ONLINE_LEARNING", "NURSE_CLINIC", "GUIDANCE", "CONSULTATION", "REGISTRAR_REPORTS", "GUIDANCE_REPORTS", "CLINIC_REPORTS", "ADMIN_REPORTS", "GUARDIAN_PORTAL"],
  // ADMIN: operational oversight only. Explicitly excludes ACCOUNTS_SECURITY,
  // CORE_SETUP, PAYROLL_MANAGEMENT, ACCOUNTING, CASHIER, and all setup modules.
  // RLS must enforce the same boundary server-side (see migration 0035).
  "admin": ["DASHBOARD", "ACTION_CENTER", "STUDENT_DIRECTORY", "HR_MANAGEMENT", "REGISTRAR_REPORTS", "ADMIN_REPORTS", "GUARDIAN_PORTAL"],
  principal: ["ACTION_CENTER", "STUDENT_DIRECTORY", "GRADING", "CURRICULUM", "FACULTY_ADMIN", "SCHEDULING", "REGISTRAR_REPORTS"],
  registrar: ["ACTION_CENTER", "REGISTRAR", "STUDENT_DIRECTORY", "GRADING", "CURRICULUM", "FACULTY_ADMIN", "CLASS_SECTIONING", "BOOKS_SETUP", "REGISTRAR_REPORTS"],
  accounting: ["ACTION_CENTER", "ACCOUNTING", "BOOKS_SETUP"],
  cashier: ["CASHIER"],
  teacher: ["FACULTY_PORTAL", "GRADING", "CURRICULUM", "ONLINE_LEARNING"],
  student: ["STUDENT_PORTAL", "CONSULTATION"],
  hr: ["ACTION_CENTER", "HR_MANAGEMENT"],
  guidance: ["GUIDANCE", "GUIDANCE_REPORTS"],
  nurse: ["NURSE_CLINIC", "CLINIC_REPORTS"],
  payroll: ["ACTION_CENTER", "PAYROLL_DASHBOARD", "PAYROLL_MANAGEMENT"],
  guardian: ["GUARDIAN_PORTAL"],
};

/**
 * Resolves the module permissions for a user's role.
 * Permission checks are intentionally role-only — academic unit must never
 * gate module *access*, only the academic structure/workflow shown inside a module.
 */
export function getPermissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[toCanonicalRole(role)] ?? ["DASHBOARD"];
}

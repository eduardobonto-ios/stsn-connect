/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { UserRole } from "../types";
import type { CanonicalRole } from "../types/role.types";
import { toCanonicalRole } from "../types/role.types";

export type STSNModule =
  | "MY_PROFILE"
  | "DASHBOARD"
  | "ACTION_CENTER"
  | "PAYROLL_DASHBOARD"
  | "ACCOUNTING_DASHBOARD"
  | "REGISTRAR"
  | "STUDENT_DIRECTORY"
  | "ACCOUNTING"
  | "CASHIER"
  | "BOOKS_SETUP"
  | "LIBRARY_SYSTEM"
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
  "super-admin": ["MY_PROFILE", "DASHBOARD", "ACTION_CENTER", "PAYROLL_DASHBOARD", "ACCOUNTING_DASHBOARD", "REGISTRAR", "STUDENT_DIRECTORY", "ACCOUNTING", "CASHIER", "BOOKS_SETUP", "LIBRARY_SYSTEM", "GRADING", "CURRICULUM", "STUDENT_PORTAL", "FACULTY_PORTAL", "FACULTY_ADMIN", "HR_MANAGEMENT", "PAYROLL_MANAGEMENT", "ACCOUNTS_SECURITY", "CORE_SETUP", "SCHEDULING", "CLASS_SECTIONING", "ONLINE_LEARNING", "NURSE_CLINIC", "GUIDANCE", "CONSULTATION", "REGISTRAR_REPORTS", "GUIDANCE_REPORTS", "CLINIC_REPORTS", "ADMIN_REPORTS", "GUARDIAN_PORTAL"],
  // ADMIN: operational oversight only. Explicitly excludes ACCOUNTS_SECURITY,
  // CORE_SETUP, PAYROLL_MANAGEMENT, ACCOUNTING, CASHIER, and all setup modules.
  // RLS must enforce the same boundary server-side (see migration 0035).
  "admin": ["MY_PROFILE", "DASHBOARD", "ACTION_CENTER", "STUDENT_DIRECTORY", "LIBRARY_SYSTEM", "HR_MANAGEMENT", "REGISTRAR_REPORTS", "ADMIN_REPORTS", "GUARDIAN_PORTAL"],
  principal: ["MY_PROFILE", "ACTION_CENTER", "STUDENT_DIRECTORY", "GRADING", "CURRICULUM", "FACULTY_ADMIN", "SCHEDULING", "REGISTRAR_REPORTS"],
  registrar: ["MY_PROFILE", "ACTION_CENTER", "REGISTRAR", "STUDENT_DIRECTORY", "GRADING", "CURRICULUM", "FACULTY_ADMIN", "CLASS_SECTIONING", "BOOKS_SETUP", "LIBRARY_SYSTEM", "REGISTRAR_REPORTS"],
  accounting: ["MY_PROFILE", "ACTION_CENTER", "ACCOUNTING", "BOOKS_SETUP"],
  cashier: ["MY_PROFILE", "CASHIER"],
  teacher: ["MY_PROFILE", "FACULTY_PORTAL", "GRADING", "CURRICULUM", "ONLINE_LEARNING"],
  student: ["MY_PROFILE", "STUDENT_PORTAL", "CONSULTATION"],
  hr: ["MY_PROFILE", "ACTION_CENTER", "HR_MANAGEMENT"],
  guidance: ["MY_PROFILE", "GUIDANCE", "GUIDANCE_REPORTS"],
  nurse: ["MY_PROFILE", "NURSE_CLINIC", "CLINIC_REPORTS"],
  payroll: ["MY_PROFILE", "ACTION_CENTER", "PAYROLL_DASHBOARD", "PAYROLL_MANAGEMENT"],
  guardian: ["MY_PROFILE", "GUARDIAN_PORTAL"],
};

/**
 * Resolves the module permissions for a user's role.
 * Permission checks are intentionally role-only — academic unit must never
 * gate module *access*, only the academic structure/workflow shown inside a module.
 */
export function getPermissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[toCanonicalRole(role)] ?? ["DASHBOARD"];
}

/**
 * Friendly display labels for each STSNModule. Used by the Page Assignment UI to
 * group `security_permissions` rows (which only carry per-permission labels).
 */
export const MODULE_LABELS: Record<STSNModule, string> = {
  MY_PROFILE: "My Profile",
  DASHBOARD: "Dashboard",
  ACTION_CENTER: "Action Center",
  PAYROLL_DASHBOARD: "Payroll Dashboard",
  ACCOUNTING_DASHBOARD: "Accounting Dashboard",
  REGISTRAR: "Admission / Enrollment",
  STUDENT_DIRECTORY: "Student Directory",
  ACCOUNTING: "Accounting",
  CASHIER: "Cashiering",
  BOOKS_SETUP: "Books & Library",
  LIBRARY_SYSTEM: "Library System",
  GRADING: "Grades Directory",
  CURRICULUM: "Curriculum",
  STUDENT_PORTAL: "Student Portal",
  FACULTY_PORTAL: "Teacher Board",
  FACULTY_ADMIN: "Faculty Admin",
  HR_MANAGEMENT: "HR Management",
  ACCOUNTS_SECURITY: "User Access & Authority",
  CORE_SETUP: "Core Setup",
  SCHEDULING: "Class Scheduling",
  CLASS_SECTIONING: "Class Sectioning",
  ONLINE_LEARNING: "Online Learning",
  NURSE_CLINIC: "Clinic",
  GUIDANCE: "Guidance Office",
  CONSULTATION: "Consultation",
  REGISTRAR_REPORTS: "Registrar Reports",
  GUIDANCE_REPORTS: "Guidance Reports",
  CLINIC_REPORTS: "Clinic Reports",
  ADMIN_REPORTS: "Admin Reports",
  PAYROLL_MANAGEMENT: "Payroll Management",
  GUARDIAN_PORTAL: "Parent Portal",
};

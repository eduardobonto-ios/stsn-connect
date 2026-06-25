/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { UserRole } from "./index";

/**
 * Canonical, school-context-independent role identifiers.
 * Role determines PERMISSIONS only — never academic structure or workflow.
 */
export type CanonicalRole =
  | "super-admin"
  | "principal"
  | "registrar"
  | "accounting"
  | "teacher"
  | "student"
  | "hr"
  | "cashier"
  | "guidance"
  | "nurse"
  | "payroll"
  | "guardian";

/** Maps the legacy/account-level UserRole values onto canonical roles. */
export const ROLE_TO_CANONICAL: Record<UserRole, CanonicalRole> = {
  SUPER_ADMIN: "super-admin",
  ADMIN: "super-admin",
  PRINCIPAL: "principal",
  REGISTRAR: "registrar",
  ACCOUNTING: "accounting",
  TEACHER: "teacher",
  STUDENT: "student",
  HR: "hr",
  EMPLOYEE: "teacher",
  CASHIER: "cashier",
  GUIDANCE: "guidance",
  NURSE: "nurse",
  PAYROLL: "payroll",
  GUARDIAN: "guardian",
};

export function toCanonicalRole(role: UserRole): CanonicalRole {
  return ROLE_TO_CANONICAL[role] ?? "student";
}

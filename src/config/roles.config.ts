/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CanonicalRole } from "../types/role.types";

export interface RoleDefinition {
  id: CanonicalRole;
  label: string;
  description: string;
}

/**
 * Canonical role catalog. Role determines PERMISSIONS only.
 * Academic structure & workflow behavior is determined separately by the
 * selected school context / academic unit (see schools.config.ts and
 * grading-schemes.config.ts).
 */
export const ROLES: RoleDefinition[] = [
  { id: "super-admin", label: "Super Admin", description: "Full system access; can switch or simulate both school contexts" },
  { id: "registrar", label: "Registrar", description: "Manages enrollment, records and academic structure" },
  { id: "accounting", label: "Accounting", description: "Manages billing, ledgers and payments" },
  { id: "cashier", label: "Cashier", description: "Accepts payments and issues official receipts for approved assessments" },
  { id: "teacher", label: "Teacher", description: "Manages classes, attendance and grade encoding" },
  { id: "student", label: "Student", description: "Views academic records, grades and billing" },
  { id: "hr", label: "HR", description: "Manages employee records and payroll" },
  { id: "guidance", label: "Guidance", description: "Accesses the Guidance Office module only" },
  { id: "nurse", label: "Nurse", description: "Accesses the Clinic module only" },
  { id: "payroll", label: "Payroll", description: "Manages payroll runs, salary payouts, taxes and benefits" },
];

export { toCanonicalRole, ROLE_TO_CANONICAL } from "../types/role.types";
export type { CanonicalRole };

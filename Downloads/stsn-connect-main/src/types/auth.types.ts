/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { User } from "./index";
import type { SchoolId, AcademicUnit, SchoolContext } from "./school.types";
import type { CanonicalRole } from "./role.types";
import type { Permission } from "../config/permissions.config";

/**
 * Assigns a user a role within a specific school context.
 * Role -> permissions. SchoolId/academicUnit -> academic behavior.
 * The two must be resolved independently.
 */
export interface RoleAssignment {
  userId: string;
  schoolId: SchoolId;
  academicUnit: AcademicUnit;
  role: CanonicalRole;
  permissions: Permission[];
}

/** The resolved session state used to drive the authenticated UI. */
export interface SessionContext {
  currentUser: User | null;
  selectedSchool: SchoolContext | null;
  activeRoleAssignment: RoleAssignment | null;
  permissions: Permission[];
  academicUnit: AcademicUnit;
}

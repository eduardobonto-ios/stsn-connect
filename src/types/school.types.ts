/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CanonicalRole } from "./role.types";

export type SchoolId = "STSN" | "CDSTA";

/**
 * Academic unit determines ACADEMIC STRUCTURE & WORKFLOW BEHAVIOR
 * (grading periods, enrollment structure, profile fields, etc).
 * It is derived from the selected school context — never from role.
 */
export type AcademicUnit = "basic-ed" | "college";

export interface SchoolContext {
  id: SchoolId;
  name: string;
  shortName: string;
  location: string;
  academicUnit: AcademicUnit;
  supportedRoles: CanonicalRole[];
  brandingLabel: string;
}

/**
 * Terminology/labeling differences between academic units, used to keep
 * Basic-Ed vs College wording consistent across feature pages without
 * scattering inline ternaries. Derived solely from AcademicUnit — never role.
 */
export interface AcademicTerms {
  unitNounSingular: string;
  unitNounPlural: string;
  trackNoun: string;
  groupNoun: string;
  groupLeaderNoun: string;
  studentIdLabel: string;
  enrollmentUnit: string;
  curriculumNoun: string;
  bulkImportLabel: string;
  regulatorLabel: string;
}

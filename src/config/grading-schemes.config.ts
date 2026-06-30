/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASIC_ED_PERIODS, COLLEGE_PERIODS, type GradePeriodLabel } from "../types/grading";
import type { AcademicUnit } from "../types/school.types";

/**
 * Grading scheme is resolved by ACADEMIC UNIT (or a class's academic unit) —
 * never by role.
 *   basic-ed -> Quarter-based grading
 *   college  -> Prelim / Midterm / Final
 */
export const GRADING_SCHEMES: Record<AcademicUnit, GradePeriodLabel[]> = {
  "basic-ed": BASIC_ED_PERIODS,
  college: COLLEGE_PERIODS,
};

export function getGradingPeriods(academicUnit: AcademicUnit): GradePeriodLabel[] {
  return GRADING_SCHEMES[academicUnit];
}

/** Legacy mock data labels departments as "Basic Education" | "College". */
export function departmentToAcademicUnit(department: "Basic Education" | "College"): AcademicUnit {
  return department === "College" ? "college" : "basic-ed";
}

export function academicUnitToDepartment(unit: AcademicUnit): "Basic Education" | "College" {
  return unit === "college" ? "College" : "Basic Education";
}

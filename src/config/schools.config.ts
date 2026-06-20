/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SchoolContext, SchoolId, AcademicUnit, AcademicTerms } from "../types/school.types";

/**
 * Central registry of school contexts.
 * Selecting a school context determines the AcademicUnit, which in turn
 * drives academic structure & workflow behavior (grading periods, enrollment
 * structure, profile fields, etc). It must NEVER be derived from role.
 */
export const SCHOOL_CONTEXTS: SchoolContext[] = [
  {
    id: "STSN",
    name: "St. Theresa's School of Novaliches",
    shortName: "St. Theresa's School",
    location: "Novaliches, QC",
    academicUnit: "basic-ed",
    supportedRoles: ["super-admin", "registrar", "accounting", "cashier", "teacher", "student", "hr"],
    brandingLabel: "Basic Education / K-12",
  },
  {
    id: "CDSTA",
    name: "Colegio de Sta. Teresa de Avila",
    shortName: "Colegio de Sta. Teresa",
    location: "de Avila",
    academicUnit: "college",
    supportedRoles: ["super-admin", "registrar", "accounting", "cashier", "teacher", "student", "hr"],
    brandingLabel: "College / Tertiary Academics",
  },
];

export function getSchoolContext(schoolId: SchoolId | "ALL" | undefined): SchoolContext | undefined {
  return SCHOOL_CONTEXTS.find((s) => s.id === schoolId);
}

/**
 * Resolves the AcademicUnit for a given school context.
 * Falls back to the first registered school (basic-ed) when no specific
 * school is selected (e.g. "ALL" for an unscoped Super Admin session).
 */
export function getAcademicUnit(schoolId: SchoolId | "ALL" | undefined): AcademicUnit {
  return getSchoolContext(schoolId)?.academicUnit ?? SCHOOL_CONTEXTS[0].academicUnit;
}

/**
 * Terminology map keyed by AcademicUnit, used to keep Basic-Ed vs College
 * labels consistent across feature pages. See AcademicTerms for field meanings.
 */
export const ACADEMIC_TERMS: Record<AcademicUnit, AcademicTerms> = {
  "basic-ed": {
    unitNounSingular: "Grade Level",
    unitNounPlural: "Grade Levels",
    trackNoun: "Strand / Track",
    groupNoun: "Section",
    groupLeaderNoun: "Adviser",
    studentIdLabel: "LRN",
    enrollmentUnit: "School Year",
    curriculumNoun: "Subjects",
    bulkImportLabel: "DepEd Excel Import",
    regulatorLabel: "DepEd",
  },
  college: {
    unitNounSingular: "Year Level",
    unitNounPlural: "Year Levels",
    trackNoun: "Program / Course",
    groupNoun: "Class Section",
    groupLeaderNoun: "Curriculum Coordinator",
    studentIdLabel: "Student No.",
    enrollmentUnit: "Semester",
    curriculumNoun: "Curriculum & Units",
    bulkImportLabel: "CHEd Masterlist Import",
    regulatorLabel: "CHEd",
  },
};

/** Resolves the terminology set for a given AcademicUnit. */
export function getAcademicTerms(unit: AcademicUnit): AcademicTerms {
  return ACADEMIC_TERMS[unit];
}

/**
 * Maps the structural AcademicUnit ("basic-ed" | "college") to the legacy
 * department string union ("Basic Education" | "College") used on
 * Student/Teacher/Course/Subject/ClassSchedule/SchoolSection/LearningMaterial.
 * Centralizes this mapping so it isn't repeated as an inline ternary per page.
 */
export function academicUnitToDepartment(unit: AcademicUnit): "Basic Education" | "College" {
  return unit === "basic-ed" ? "Basic Education" : "College";
}

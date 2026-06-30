/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { BookPackage, SchoolId } from "../types";
import { BOOK_PACKAGE_GRADE_LEVELS } from "../config/books.config";

export interface BookPackageResolution {
  package?: BookPackage;
  notice?: string;
}

/**
 * Resolves the book package automatically assigned to a Basic Education
 * Grade/Year Level. Registrars and students never choose a package directly —
 * this is the single source of truth for "what package applies here".
 *
 * Grade levels outside BOOK_PACKAGE_GRADE_LEVELS (e.g. College year levels
 * like "1st Year") return an empty result with no package and no notice,
 * since book packages do not apply to College.
 */
export function getBookPackageByGradeLevel(
  packages: BookPackage[],
  gradeLevel: string | undefined,
  schoolYear: string,
  schoolId: SchoolId
): BookPackageResolution {
  if (!gradeLevel || !BOOK_PACKAGE_GRADE_LEVELS.includes(gradeLevel)) {
    return {};
  }

  const pkg = packages.find(
    (p) =>
      p.gradeLevel === gradeLevel &&
      p.schoolId === schoolId &&
      p.schoolYear === schoolYear &&
      p.status === "Active"
  );

  if (pkg) return { package: pkg };

  return { notice: `No book package is configured for ${gradeLevel}.` };
}

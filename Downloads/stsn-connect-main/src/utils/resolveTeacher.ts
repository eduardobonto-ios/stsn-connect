/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Teacher, User } from "../types";
import type { AcademicUnit } from "../types/school.types";
import { departmentToAcademicUnit } from "../config/grading-schemes.config";

/**
 * Resolves the Teacher record for the active session.
 *
 * Resolution order:
 *  1. Direct link via Teacher.userId === currentUser.id (authoritative).
 *  2. Legacy fallback: email match between Teacher and User records.
 *  3. Any teacher whose department matches the active session's academic
 *     unit — prevents silently defaulting to a College profile when the
 *     session is Basic Ed (and vice versa).
 *  4. First teacher record, as a last resort.
 */
export function resolveCurrentTeacher(
  teachers: Teacher[],
  currentUser: User | null,
  academicUnit: AcademicUnit
): Teacher {
  if (currentUser) {
    const byUserId = teachers.find((t) => t.userId === currentUser.id);
    if (byUserId) return byUserId;

    const byEmail = teachers.find((t) => t.email === currentUser.email);
    if (byEmail) return byEmail;
  }

  const byAcademicUnit = teachers.find(
    (t) => departmentToAcademicUnit(t.department) === academicUnit
  );

  return byAcademicUnit ?? teachers[0];
}

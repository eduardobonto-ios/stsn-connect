/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Employee, Teacher, User } from "../types";
import type { AcademicUnit } from "../types/school.types";
import { departmentToAcademicUnit } from "../config/grading-schemes.config";

function normalizeEmail(value?: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

/**
 * Resolves the Teacher record for the active session.
 *
 * NOTE: the `teachers` list is now synthesized from employees +
 * employee_faculty_profiles (see services/dataLoader.ts). The app no longer
 * reads public.teachers at runtime, so every branch below already operates on
 * employee-backed identity. `Teacher.employeeId` is the canonical anchor;
 * `Teacher.id` is a transitional legacy id kept only while dual-read is active.
 *
 * Resolution order:
 *  1. Primary: employees.user_id === currentUser.id, bridged to its faculty
 *     record (teacher.employeeId === employee.id). Durable identity anchor —
 *     see docs/TEACHERS_TO_EMPLOYEES_CONSOLIDATION_PLAN.md.
 *  2. Employee-backed direct link: Teacher.userId === currentUser.id (the
 *     synthesized teacher carries the employee's user_id). Covers callers that
 *     don't pass `employees`.
 *  3. Transitional fallback (removable before Phase 6): email match between the
 *     faculty record and the User. Still required for bridged employees that
 *     have no user_id yet (their teacher/user link survives only via email).
 *  4. Any faculty whose department matches the active session's academic unit —
 *     prevents silently defaulting to a College profile in a Basic Ed session
 *     (and vice versa).
 *  5. First faculty record, as a last resort.
 */
export function resolveCurrentTeacher(
  teachers: Teacher[],
  currentUser: User | null,
  academicUnit: AcademicUnit,
  employees: Employee[] = []
): Teacher {
  if (currentUser) {
    const employee = employees.find((e) => e.userId === currentUser.id);
    if (employee) {
      const byEmployeeId = teachers.find((t) => t.employeeId === employee.id);
      if (byEmployeeId) return byEmployeeId;
    }

    const byUserId = teachers.find((t) => t.userId === currentUser.id);
    if (byUserId) return byUserId;

    const byEmail = teachers.find(
      (t) =>
        normalizeEmail(t.email) === normalizeEmail(currentUser.email) &&
        departmentToAcademicUnit(t.department) === academicUnit
    );
    if (byEmail) return byEmail;

    const byEmailAnyUnit = teachers.find(
      (t) => normalizeEmail(t.email) === normalizeEmail(currentUser.email)
    );
    if (byEmailAnyUnit) return byEmailAnyUnit;
  }

  const byAcademicUnit = teachers.find(
    (t) => departmentToAcademicUnit(t.department) === academicUnit
  );

  return byAcademicUnit ?? teachers[0];
}

export function teacherMatchesOwnership(
  teacher: Teacher,
  record: { teacherId?: string | null; employeeId?: string | null }
): boolean {
  if (teacher.employeeId && record.employeeId) {
    return record.employeeId === teacher.employeeId;
  }

  return record.teacherId === teacher.id;
}

export function resolveEmployeeForTeacher(
  teacher: Teacher,
  employees: Employee[]
): Employee | null {
  return (
    employees.find((employee) => employee.id === teacher.employeeId) ??
    employees.find((employee) => employee.userId === teacher.userId) ??
    employees.find(
      (employee) => normalizeEmail(employee.email) === normalizeEmail(teacher.email)
    ) ??
    null
  );
}

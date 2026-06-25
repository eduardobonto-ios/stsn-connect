/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from "react";
import { useSTSNStore } from "../services/store";
import type { SchoolId } from "../types";

export interface PendingCounts {
  pendingAssessments: number;
  pendingDiscounts: number;
  pendingEnrollments: number;
  pendingApplications: number;
  pendingLeaves: number;
  pendingPayrollRuns: number;
  pendingGrades: number;
  pendingVoidRequests: number;
  totalForRole: number;
}

const ZERO: PendingCounts = {
  pendingAssessments: 0, pendingDiscounts: 0, pendingEnrollments: 0,
  pendingApplications: 0, pendingLeaves: 0, pendingPayrollRuns: 0,
  pendingGrades: 0, pendingVoidRequests: 0, totalForRole: 0,
};

export function usePendingCounts(): PendingCounts {
  const {
    currentUser,
    activeSchool,
    assessments,
    discountRequests,
    enrollments,
    onlineEnrollmentApplications,
    leaveRequests,
    payrollRuns,
    gradePeriods,
    voidRequests,
    students,
    employees,
  } = useSTSNStore();

  return useMemo((): PendingCounts => {
    if (!currentUser) return ZERO;

    const role = currentUser.role;
    const school = activeSchool;

    const inSchool = (schoolId?: SchoolId | string) =>
      school === "ALL" || !schoolId || schoolId === school;

    const studentInSchool = (studentId: string) =>
      inSchool(students.find((s) => s.id === studentId)?.schoolId);

    const employeeInSchool = (employeeId: string) =>
      inSchool(employees.find((e) => e.id === employeeId)?.schoolId);

    const pendingAssessments =
      role === "ACCOUNTING" || role === "SUPER_ADMIN" || role === "ADMIN"
        ? assessments.filter(
            (a) => a.approvalStatus === "Pending Accounting Approval" && inSchool(a.schoolId)
          ).length
        : 0;

    const pendingDiscounts =
      role === "ACCOUNTING" || role === "SUPER_ADMIN" || role === "ADMIN"
        ? discountRequests.filter(
            (d) =>
              (d.status === "Pending" || d.status === "For Review") &&
              studentInSchool(d.studentId)
          ).length
        : 0;

    const pendingVoidRequests =
      role === "ACCOUNTING" || role === "SUPER_ADMIN" || role === "ADMIN"
        ? voidRequests.filter(
            (v) => v.status === "Pending Void Approval" && inSchool(v.schoolId)
          ).length
        : 0;

    const pendingEnrollments =
      role === "REGISTRAR" || role === "SUPER_ADMIN" || role === "ADMIN"
        ? enrollments.filter(
            (e) =>
              (e.status === "Pending" || e.status === "For Assessment") &&
              studentInSchool(e.studentId)
          ).length
        : 0;

    // Online applications don't carry a schoolId until accepted — show all pending to registrar
    const pendingApplications =
      role === "REGISTRAR" || role === "SUPER_ADMIN" || role === "ADMIN"
        ? onlineEnrollmentApplications.filter(
            (a) => a.status === "Pending Registrar Review"
          ).length
        : 0;

    const pendingLeaves =
      role === "HR" || role === "SUPER_ADMIN" || role === "ADMIN"
        ? leaveRequests.filter(
            (r) =>
              (r.status === "Submitted" || r.status === "For Approval") &&
              employeeInSchool(r.employeeId)
          ).length
        : 0;

    const pendingPayrollRuns =
      role === "PAYROLL" || role === "SUPER_ADMIN" || role === "ADMIN"
        ? payrollRuns.filter(
            (r) => r.status === "For Review" && inSchool(r.schoolId)
          ).length
        : 0;

    const pendingGrades =
      role === "PRINCIPAL" || role === "SUPER_ADMIN" || role === "ADMIN"
        ? gradePeriods.filter((gp) => gp.gradeApprovalStatus === "Submitted").length
        : 0;

    const totalForRole =
      pendingAssessments + pendingDiscounts + pendingVoidRequests +
      pendingEnrollments + pendingApplications + pendingLeaves +
      pendingPayrollRuns + pendingGrades;

    return {
      pendingAssessments, pendingDiscounts, pendingEnrollments,
      pendingApplications, pendingLeaves, pendingPayrollRuns,
      pendingGrades, pendingVoidRequests, totalForRole,
    };
  }, [
    currentUser, activeSchool,
    assessments, discountRequests, enrollments, onlineEnrollmentApplications,
    leaveRequests, payrollRuns, gradePeriods, voidRequests,
    students, employees,
  ]);
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { UserRole } from "../types";
import type { STSNModule } from "./navigation.config";

export interface AppRouteState {
  module: STSNModule;
  subPage?: string;
  studentId?: string;
  isKnownPath: boolean;
  canonicalPath: string;
}

function withQuery(path: string, studentId?: string): string {
  if (!studentId) return path;
  const params = new URLSearchParams({ studentId });
  return `${path}?${params.toString()}`;
}

export function getDefaultRouteForRole(role: UserRole): string {
  switch (role) {
    case "STUDENT":
      return getPathForModule("STUDENT_PORTAL", { subPage: "overview" });
    case "TEACHER":
    case "EMPLOYEE":
      return getPathForModule("FACULTY_PORTAL", { subPage: "overview-advisory" });
    case "REGISTRAR":
      return getPathForModule("REGISTRAR");
    case "PRINCIPAL":
      return getPathForModule("STUDENT_DIRECTORY");
    case "HR":
      return getPathForModule("HR_MANAGEMENT", { subPage: "hr-dashboard" });
    case "ACCOUNTING":
      return getPathForModule("ACCOUNTING", { subPage: "dashboard" });
    case "CASHIER":
      return getPathForModule("CASHIER", { subPage: "queue" });
    case "PAYROLL":
      return getPathForModule("PAYROLL_DASHBOARD");
    case "GUIDANCE":
      return getPathForModule("GUIDANCE");
    case "NURSE":
      return getPathForModule("NURSE_CLINIC");
    case "GUARDIAN":
      return getPathForModule("GUARDIAN_PORTAL");
    default:
      return getPathForModule("DASHBOARD");
  }
}

export function getPathForModule(
  module: STSNModule,
  options?: { subPage?: string; studentId?: string },
): string {
  const subPage = options?.subPage;

  switch (module) {
    case "MY_PROFILE":
      return "/profile";
    case "DASHBOARD":
      return "/dashboard";
    case "ACTION_CENTER":
      return "/action-center";
    case "REGISTRAR":
      return "/registrar";
    case "REGISTRAR_REPORTS":
      return "/registrar/reports";
    case "ACCOUNTING":
      return `/accounting/${subPage ?? "dashboard"}`;
    case "ACCOUNTING_DASHBOARD":
      return "/accounting-dashboard";
    case "GRADING":
      return "/grading";
    case "CURRICULUM":
      return "/curriculum";
    case "STUDENT_DIRECTORY":
      return "/student-directory";
    case "STUDENT_PORTAL":
      return withQuery(`/student-portal/${subPage ?? "overview"}`, options?.studentId);
    case "FACULTY_ADMIN":
      return "/faculty/admin";
    case "FACULTY_PORTAL":
      return `/faculty/portal/${subPage ?? "overview-advisory"}`;
    case "HR_MANAGEMENT":
      return `/hr/${subPage ?? "hr-dashboard"}`;
    case "PAYROLL_DASHBOARD":
      return "/payroll/dashboard";
    case "PAYROLL_MANAGEMENT":
      return `/payroll/${subPage ?? "payroll-management"}`;
    case "ACCOUNTS_SECURITY":
      return `/accounts/${subPage ?? "user-security"}`;
    case "CORE_SETUP":
      return `/core-setup/${subPage ?? "academic_categories"}`;
    case "SCHEDULING":
      return "/scheduling";
    case "CLASS_SECTIONING":
      return "/class-sectioning";
    case "ONLINE_LEARNING":
      return "/online-learning";
    case "BOOKS_SETUP":
      return "/books-setup";
    case "CASHIER":
      return `/cashier/${subPage ?? "queue"}`;
    case "NURSE_CLINIC":
      return "/clinic";
    case "GUIDANCE":
      return "/guidance";
    case "GUIDANCE_REPORTS":
      return "/guidance/reports";
    case "CLINIC_REPORTS":
      return "/clinic/reports";
    case "ADMIN_REPORTS":
      return "/admin/reports";
    case "CONSULTATION":
      return "/consultation";
    case "GUARDIAN_PORTAL":
      return "/guardian-portal";
    default:
      return "/dashboard";
  }
}

export function resolveAppRoute(pathname: string, search = ""): AppRouteState | null {
  const normalizedPath = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
  const params = new URLSearchParams(search);
  const studentId = params.get("studentId") ?? undefined;
  const segments = normalizedPath.split("/").filter(Boolean);

  if (normalizedPath === "/") return null;

  if (normalizedPath === "/profile") {
    return { module: "MY_PROFILE", isKnownPath: true, canonicalPath: "/profile" };
  }
  if (normalizedPath === "/dashboard") {
    return { module: "DASHBOARD", isKnownPath: true, canonicalPath: "/dashboard" };
  }
  if (normalizedPath === "/action-center") {
    return { module: "ACTION_CENTER", isKnownPath: true, canonicalPath: "/action-center" };
  }
  if (normalizedPath === "/registrar") {
    return { module: "REGISTRAR", isKnownPath: true, canonicalPath: "/registrar" };
  }
  if (normalizedPath === "/registrar/reports") {
    return { module: "REGISTRAR_REPORTS", isKnownPath: true, canonicalPath: "/registrar/reports" };
  }
  if (normalizedPath === "/accounting-dashboard") {
    return { module: "ACCOUNTING_DASHBOARD", isKnownPath: true, canonicalPath: "/accounting-dashboard" };
  }
  if (segments[0] === "accounting") {
    const subPage = segments[1] ?? "dashboard";
    return {
      module: "ACCOUNTING",
      subPage,
      isKnownPath: true,
      canonicalPath: getPathForModule("ACCOUNTING", { subPage }),
    };
  }
  if (normalizedPath === "/grading") {
    return { module: "GRADING", isKnownPath: true, canonicalPath: "/grading" };
  }
  if (normalizedPath === "/curriculum") {
    return { module: "CURRICULUM", isKnownPath: true, canonicalPath: "/curriculum" };
  }
  if (normalizedPath === "/student-directory") {
    return { module: "STUDENT_DIRECTORY", isKnownPath: true, canonicalPath: "/student-directory" };
  }
  if (segments[0] === "student-portal") {
    const subPage = segments[1] ?? "overview";
    return {
      module: "STUDENT_PORTAL",
      subPage,
      studentId,
      isKnownPath: true,
      canonicalPath: getPathForModule("STUDENT_PORTAL", { subPage, studentId }),
    };
  }
  if (normalizedPath === "/faculty/admin") {
    return { module: "FACULTY_ADMIN", isKnownPath: true, canonicalPath: "/faculty/admin" };
  }
  if (segments[0] === "faculty" && segments[1] === "portal") {
    const subPage = segments[2] ?? "overview-advisory";
    return {
      module: "FACULTY_PORTAL",
      subPage,
      isKnownPath: true,
      canonicalPath: getPathForModule("FACULTY_PORTAL", { subPage }),
    };
  }
  if (segments[0] === "hr") {
    const subPage = segments[1] ?? "hr-dashboard";
    return {
      module: "HR_MANAGEMENT",
      subPage,
      isKnownPath: true,
      canonicalPath: getPathForModule("HR_MANAGEMENT", { subPage }),
    };
  }
  if (normalizedPath === "/payroll/dashboard") {
    return { module: "PAYROLL_DASHBOARD", isKnownPath: true, canonicalPath: "/payroll/dashboard" };
  }
  if (segments[0] === "payroll") {
    const subPage = segments[1] ?? "payroll-management";
    return {
      module: "PAYROLL_MANAGEMENT",
      subPage,
      isKnownPath: true,
      canonicalPath: getPathForModule("PAYROLL_MANAGEMENT", { subPage }),
    };
  }
  if (segments[0] === "accounts") {
    const subPage = segments[1] ?? "user-security";
    return {
      module: "ACCOUNTS_SECURITY",
      subPage,
      isKnownPath: true,
      canonicalPath: getPathForModule("ACCOUNTS_SECURITY", { subPage }),
    };
  }
  if (segments[0] === "core-setup") {
    const subPage = segments[1] ?? "academic_categories";
    return {
      module: "CORE_SETUP",
      subPage,
      isKnownPath: true,
      canonicalPath: getPathForModule("CORE_SETUP", { subPage }),
    };
  }
  if (normalizedPath === "/scheduling") {
    return { module: "SCHEDULING", isKnownPath: true, canonicalPath: "/scheduling" };
  }
  if (normalizedPath === "/class-sectioning") {
    return { module: "CLASS_SECTIONING", isKnownPath: true, canonicalPath: "/class-sectioning" };
  }
  if (normalizedPath === "/online-learning") {
    return { module: "ONLINE_LEARNING", isKnownPath: true, canonicalPath: "/online-learning" };
  }
  if (normalizedPath === "/books-setup") {
    return { module: "BOOKS_SETUP", isKnownPath: true, canonicalPath: "/books-setup" };
  }
  if (segments[0] === "cashier") {
    const subPage = segments[1] ?? "queue";
    return {
      module: "CASHIER",
      subPage,
      isKnownPath: true,
      canonicalPath: getPathForModule("CASHIER", { subPage }),
    };
  }
  if (normalizedPath === "/clinic") {
    return { module: "NURSE_CLINIC", isKnownPath: true, canonicalPath: "/clinic" };
  }
  if (normalizedPath === "/guidance") {
    return { module: "GUIDANCE", isKnownPath: true, canonicalPath: "/guidance" };
  }
  if (normalizedPath === "/guidance/reports") {
    return { module: "GUIDANCE_REPORTS", isKnownPath: true, canonicalPath: "/guidance/reports" };
  }
  if (normalizedPath === "/clinic/reports") {
    return { module: "CLINIC_REPORTS", isKnownPath: true, canonicalPath: "/clinic/reports" };
  }
  if (normalizedPath === "/admin/reports") {
    return { module: "ADMIN_REPORTS", isKnownPath: true, canonicalPath: "/admin/reports" };
  }
  if (normalizedPath === "/consultation") {
    return { module: "CONSULTATION", isKnownPath: true, canonicalPath: "/consultation" };
  }
  if (normalizedPath === "/guardian-portal") {
    return { module: "GUARDIAN_PORTAL", isKnownPath: true, canonicalPath: "/guardian-portal" };
  }

  return {
    module: "DASHBOARD",
    isKnownPath: false,
    canonicalPath: "/dashboard",
  };
}

/**
 * Central test data for the STSN Connect E2E suite.
 *
 * Emails identify provisioned Supabase Auth test accounts. Passwords are
 * supplied only through environment/CI secrets.
 */

export type Role =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "REGISTRAR"
  | "ACCOUNTING"
  | "CASHIER"
  | "TEACHER"
  | "STUDENT"
  | "HR"
  | "GUIDANCE"
  | "NURSE"
  | "PAYROLL";

export const E2E_PASSWORD = process.env.E2E_PASSWORD ?? "";

export const ACCOUNTS: Record<Role, string> = {
  SUPER_ADMIN: process.env.E2E_SUPER_ADMIN_EMAIL ?? "admin@stsn.edu.ph",
  ADMIN: process.env.E2E_ADMIN_EMAIL ?? "admin@cdsta.edu.ph",
  REGISTRAR: process.env.E2E_REGISTRAR_EMAIL ?? "registrar@stsn.edu.ph",
  ACCOUNTING: process.env.E2E_ACCOUNTING_EMAIL ?? "accounting@stsn.edu.ph",
  CASHIER: process.env.E2E_CASHIER_EMAIL ?? "cashier@stsn.edu.ph",
  TEACHER: process.env.E2E_TEACHER_EMAIL ?? "teacher@stsn.edu.ph",
  STUDENT: process.env.E2E_STUDENT_EMAIL ?? "student@stsn.edu.ph",
  HR: process.env.E2E_HR_EMAIL ?? "hr@stsn.edu.ph",
  GUIDANCE: process.env.E2E_GUIDANCE_EMAIL ?? "guidance@stsn.edu.ph",
  NURSE: process.env.E2E_NURSE_EMAIL ?? "nurse@stsn.edu.ph",
  PAYROLL: process.env.E2E_PAYROLL_EMAIL ?? "payroll@stsn.edu.ph",
};

/**
 * GUARDIAN / Parent Portal account. A demo guardian (`parent.demo@stsn.edu.ph`,
 * "Roberto Veloso") now exists in the dev DB, so the Parent Portal test runs by
 * default. Override via E2E_PARENT_EMAIL; set it blank to skip.
 */
export const PARENT_EMAIL =
  process.env.E2E_PARENT_EMAIL !== undefined ? process.env.E2E_PARENT_EMAIL : "parent.demo@stsn.edu.ph";

export const ALL_ROLES = Object.keys(ACCOUNTS) as Role[];

/**
 * Expected top-level modules per role, expressed as label regexes. `present` =
 * must be visible as an Enterprise Command Center tile; `absent` = must NOT be
 * visible.
 *
 * Derived from ROLE_PERMISSIONS + getNavItemsForRole. Assertions read the
 * RENDERED tile grid (not the static config) so they still hold if the
 * security catalog overrides permissions — a mismatch is a real finding, not
 * flake. Regexes target unambiguous label/description text, shared verbatim
 * between the sidebar buttons and the grid tiles they're derived from.
 */
export const SIDEBAR_EXPECT: Record<Role, { present: RegExp[]; absent: RegExp[] }> = {
  SUPER_ADMIN: {
    present: [/Dashboard/i, /Accounting/i, /Cashiering/i, /Human resources/i, /Payroll/i, /Core Setup/i],
    absent: [],
  },
  ADMIN: {
    present: [/Dashboard/i, /Human resources/i, /Parent Portal/i],
    absent: [/Cashiering/i, /Core Setup/i, /Ledger, discounts/i],
  },
  REGISTRAR: {
    present: [/Admission/i, /Learning Management/i],
    absent: [/Human resources/i, /Cashiering/i, /Core Setup/i, /Payroll, payouts/i],
  },
  ACCOUNTING: {
    present: [/Accounting/i],
    absent: [/Human resources/i, /Cashiering/i, /Payroll, payouts/i, /Core Setup/i],
  },
  CASHIER: {
    present: [/Cashiering/i],
    absent: [/Dashboard/i, /Accounting/i, /Human resources/i, /Core Setup/i, /Payroll/i],
  },
  TEACHER: {
    present: [/Teacher Board/i, /Learning Management/i],
    absent: [/Human resources/i, /Cashiering/i, /Core Setup/i, /Payroll, payouts/i],
  },
  STUDENT: {
    present: [/Student Portal/i, /Learning Management/i, /Consultation/i],
    absent: [/Dashboard/i, /Human resources/i, /Cashiering/i, /Core Setup/i],
  },
  HR: {
    present: [/Human resources/i, /Action Center/i],
    absent: [/Accounting/i, /Cashiering/i, /Core Setup/i, /Payroll, payouts/i],
  },
  GUIDANCE: {
    present: [/Guidance Office/i],
    absent: [/Dashboard/i, /Human resources/i, /Cashiering/i, /Accounting/i],
  },
  NURSE: {
    present: [/Clinic/i],
    absent: [/Dashboard/i, /Human resources/i, /Cashiering/i, /Accounting/i],
  },
  PAYROLL: {
    present: [/Payroll/i, /Action Center/i],
    absent: [/Human resources/i, /Accounting/i, /Cashiering/i],
  },
};

/**
 * Direct-URL RBAC matrix. Each entry: a role, a route that role LACKS (must be
 * blocked with the access-denied state) and a route the role HAS (must render).
 */
export const RBAC_URL_MATRIX: Array<{
  role: Role;
  deniedRoute: string;
  allowedRoute: string;
}> = [
  { role: "CASHIER", deniedRoute: "/hr/hr-dashboard", allowedRoute: "/cashier/queue" },
  { role: "STUDENT", deniedRoute: "/accounting/dashboard", allowedRoute: "/student-portal/overview" },
  { role: "HR", deniedRoute: "/cashier/queue", allowedRoute: "/hr/hr-dashboard" },
  { role: "ACCOUNTING", deniedRoute: "/cashier/queue", allowedRoute: "/accounting/dashboard" },
];

/** Read-only workflow smoke routes per role (navigation only, no writes). */
export const WORKFLOW_ROUTES: Array<{ role: Role; label: string; routes: string[] }> = [
  { role: "REGISTRAR", label: "Enrollment / Admission", routes: ["/registrar"] },
  { role: "REGISTRAR", label: "Student Directory", routes: ["/student-directory"] },
  {
    role: "STUDENT",
    label: "Student Portal tabs",
    routes: ["/student-portal/overview", "/student-portal/grades", "/student-portal/ledger", "/student-portal/profile"],
  },
  {
    role: "ACCOUNTING",
    label: "Accounting sub-nav",
    routes: ["/accounting/dashboard", "/accounting/ledger", "/accounting/journal-entries", "/accounting/trial-balance"],
  },
  { role: "CASHIER", label: "Cashiering", routes: ["/cashier/queue", "/cashier/history", "/cashier/reports"] },
  { role: "HR", label: "HR pages", routes: ["/hr/hr-dashboard", "/hr/leave-management", "/hr/attendance"] },
  { role: "PAYROLL", label: "Payroll pages", routes: ["/payroll/dashboard", "/payroll/payroll-management"] },
  {
    role: "TEACHER",
    label: "Teacher Board",
    routes: ["/faculty/portal/overview-advisory", "/faculty/portal/student-grades-encoding"],
  },
  { role: "SUPER_ADMIN", label: "Reports", routes: ["/registrar/reports", "/admin/reports"] },
];

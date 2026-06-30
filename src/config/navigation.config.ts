import {
  LayoutDashboard, Compass, Coins, GraduationCap, Users, BookOpen,
  Shield, BarChart3, Building2, CalendarDays, Layers, Settings, UserCheck, Wallet,
  List, FileText, Truck, Package, Receipt, TrendingUp, TrendingDown, Scale, PieChart, Activity,
  Percent, Lock, ClipboardList, BookMarked, Banknote, Stethoscope, NotebookPen, PhoneCall,
  UsersRound, Clock, FileCheck, Award, Briefcase, History
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { UserRole } from "../types";
import type { AcademicUnit } from "../types/school.types";
import { ROLE_PERMISSIONS, getPermissionsForRole } from "./permissions.config";
import type { STSNModule, Permission } from "./permissions.config";

export type { STSNModule, Permission };
export { ROLE_PERMISSIONS, getPermissionsForRole };

export type SidebarMode = "full" | "compact" | "minimal";

export const SIDEBAR_MODE: Record<UserRole, SidebarMode> = {
  SUPER_ADMIN:  "full",
  ADMIN:        "full",
  PRINCIPAL:    "full",
  REGISTRAR:    "full",
  ACCOUNTING:   "full",
  PAYROLL:      "full",
  HR:           "full",
  TEACHER:      "full",
  CASHIER:      "full",
  NURSE:        "full",
  GUIDANCE:     "full",
  STUDENT:      "full",
  EMPLOYEE:     "full",
  GUARDIAN:     "full",
};

export interface NavSubItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  desc?: string;
  isSection?: boolean;
  /** Nested child items, used for module-local submenu categories. */
  children?: NavSubItem[];
  /** If set, clicking this child navigates to this module (category group pattern). */
  targetModule?: STSNModule;
  /** If set, only show this child for users with one of these roles. */
  showForRoles?: UserRole[];
}

export interface NavItem {
  id: STSNModule;
  label: string;
  icon: LucideIcon;
  desc: string;
  /** Optional per-academic-unit label override, resolved by getNavItemsForRole(). Falls back to `label`. */
  labelByUnit?: Partial<Record<AcademicUnit, string>>;
  /** Optional per-academic-unit description override, resolved by getNavItemsForRole(). Falls back to `desc`. */
  descByUnit?: Partial<Record<AcademicUnit, string>>;
  /** If present, renders as an expandable group in the sidebar. */
  children?: NavSubItem[];
}

export const NAV_ITEMS: NavItem[] = [
  { id: "DASHBOARD", label: "Dashboard", icon: LayoutDashboard, desc: "Admin command center" },
  { id: "ACTION_CENTER", label: "Action Center", icon: ClipboardList, desc: "Approvals and pending work queue" },
  {
    id: "REGISTRAR", label: "Admission", icon: Compass, desc: "Registrar & academic management",
    children: [
      { id: "students",          label: "Students",          icon: UsersRound,      desc: "All students & quick record access", targetModule: "STUDENT_DIRECTORY" },
      { id: "enrollment",        label: "Enrollment",        icon: Compass,         desc: "Student registrations",             targetModule: "REGISTRAR" },
      { id: "class-sectioning",  label: "Class Sectioning",  icon: Layers,          desc: "Sections, advisers & LRN rosters", targetModule: "CLASS_SECTIONING" },
      { id: "class-scheduling",  label: "Class Scheduling",  icon: CalendarDays,    desc: "Subject schedules & adviser rooms", targetModule: "SCHEDULING" },
      { id: "faculty-admin",     label: "Faculty",           icon: UsersRound,      desc: "Teacher & faculty management",      targetModule: "FACULTY_ADMIN" },
      { id: "syllabus-pathways", label: "Syllabus Pathways", icon: Building2,       desc: "Academic subjects flow",            targetModule: "CURRICULUM" },
      { id: "grades-directory", label: "Grades Directory",  icon: GraduationCap,   desc: "Student grade records by section",  targetModule: "GRADING" },
      { id: "registrar-reports", label: "Registrar Reports", icon: FileText,        desc: "Enrollment and student records reports", targetModule: "REGISTRAR_REPORTS" },
    ],
  },
  {
    id: "ACCOUNTING", label: "Accounting", icon: Coins, desc: "Ledger, discounts & reports",
    children: [
      { id: "accounting-dashboard", label: "Accounting Dashboard", icon: LayoutDashboard, desc: "KPIs & receivables watchlist", targetModule: "ACCOUNTING_DASHBOARD" },
      {
        id: "accounting-student-accounts", label: "Student Accounts", icon: UsersRound, desc: "Ledgers, billing, discounts, and holds",
        children: [
          { id: "ledger",            label: "Student Ledger",          icon: BookOpen,      desc: "Per-student debit/credit ledger" },
          { id: "discounts",         label: "Discounts",               icon: Percent,       desc: "Discount types & approval requests" },
          { id: "billing",           label: "Billing & Assessment",    icon: ClipboardList, desc: "Assessment approval & summary" },
          { id: "holds",             label: "Financial Holds",         icon: Lock,          desc: "Student financial hold management" },
        ],
      },
      {
        id: "accounting-setup", label: "Accounting Setup", icon: Settings, desc: "GL, cost center, vendor, and item setup",
        children: [
          { id: "chart-of-accounts", label: "Chart of Accounts",      icon: List,      desc: "GL account codes & hierarchy" },
          { id: "cost-centers",      label: "Cost Centers",            icon: Building2, desc: "Departmental cost segmentation" },
          { id: "suppliers",         label: "Supplier Management",     icon: Truck,     desc: "Vendor & supplier master list" },
          { id: "items",             label: "Item / Product Mgmt",     icon: Package,   desc: "Product & service catalog" },
          { id: "discount-types",    label: "Discount Types",           icon: Percent,   desc: "Define discount types and eligibility rules" },
        ],
      },
      {
        id: "accounting-general-ledger", label: "General Ledger", icon: BookMarked, desc: "Double-entry bookkeeping operations",
        children: [
          { id: "journal-entries",   label: "Journal Entries",         icon: BookMarked, desc: "Double-entry bookkeeping postings" },
        ],
      },
      {
        id: "accounting-ar", label: "Accounts Receivable", icon: TrendingUp, desc: "Customer invoices and receivables aging",
        children: [
          { id: "sales-invoices",    label: "Sales Invoice",           icon: Receipt,    desc: "Customer sales invoices (AR)" },
          { id: "ar-aging",          label: "AR with Aging",           icon: TrendingUp, desc: "Receivables aged 30/60/90/120+ days" },
        ],
      },
      {
        id: "accounting-ap", label: "Accounts Payable", icon: TrendingDown, desc: "Vendor invoices and payables aging",
        children: [
          { id: "purchase-invoices", label: "Purchase Invoice",        icon: FileText,     desc: "Vendor purchase invoices (AP)" },
          { id: "ap-aging",          label: "AP with Aging",           icon: TrendingDown, desc: "Payables aged by vendor & due date" },
        ],
      },
      {
        id: "accounting-reports", label: "Financial Reports", icon: BarChart3, desc: "Accounting statements and financial reports",
        children: [
      { id: "trial-balance",     label: "Trial Balance",           icon: Scale,           desc: "Debit/credit totals by GL account" },
      { id: "balance-sheet",     label: "Balance Sheet",           icon: PieChart,        desc: "Assets = Liabilities + Equity snapshot" },
      { id: "income-statement",  label: "Income Statement",        icon: Activity,        desc: "Revenue − Expenses = Net Income" },
      { id: "cash-flow",         label: "Cash Flow Report",        icon: Banknote,        desc: "Operating / investing / financing flows" },
        ],
      },
    ],
  },
  {
    id: "CASHIER", label: "Cashiering", icon: Wallet, desc: "Payments, receipts & collections",
    children: [
      { id: "queue",   label: "Payment Queue",      icon: Receipt,   desc: "Approved assessments awaiting payment" },
      { id: "history", label: "Collection History", icon: History,   desc: "Posted payments & official receipts" },
      { id: "reports", label: "Reports",            icon: BarChart3, desc: "Cashiering reports & summaries" },
    ],
  },
  {
    id: "FACULTY_PORTAL", label: "Teacher Board", icon: BookOpen, desc: "Schedules, attendance, grades, reports, and faculty profile",
    children: [
      { id: "overview-advisory",       label: "Overview & Advisory",        icon: LayoutDashboard, desc: "Teacher cockpit and advisory roster" },
      { id: "class-schedule-subjects", label: "Class Schedule & Subjects",  icon: CalendarDays,    desc: "Teaching load and subject assignments" },
      { id: "attendance-monitoring",   label: "Attendance Monitoring",      icon: ClipboardList,   desc: "Daily attendance logging workspace" },
      { id: "student-grades-encoding", label: "Student Grades Encoding",    icon: GraduationCap,   desc: "Grade entry and submission queue" },
      { id: "reports",                 label: "Reports",                    icon: FileText,        desc: "Faculty class, advisory, and load reports" },
      { id: "faculty-profile",         label: "Faculty Profile",            icon: UserCheck,       desc: "Reusable teacher and employee profile workspace" },
    ],
  },
  {
    id: "STUDENT_PORTAL", label: "Student Portal", icon: UserCheck, desc: "View grades, COR & ID",
    children: [
      { id: "overview",   label: "Records Overview",     icon: CalendarDays,  desc: "Dashboard & enrollment status" },
      { id: "grades",     label: "Academic Report Card", icon: BookOpen,      desc: "Grades & marks" },
      { id: "ledger",     label: "Financial Ledger",     icon: Receipt,       desc: "Fees & payment records" },
      { id: "profile",    label: "Student Profile",      icon: FileText,      desc: "Profile & health info" },
      { id: "elearning",  label: "Online Learning",      icon: BarChart3,     desc: "LMS videos & modules",  showForRoles: ["STUDENT"] },
      { id: "enrollment", label: "Enrollment",           icon: ClipboardList, desc: "Self-service enrollment", showForRoles: ["STUDENT"] },
    ],
  },
  { id: "ONLINE_LEARNING",  label: "Online Learning",         icon: BarChart3,     desc: "LMS • Videos & modules" },
  {
    id: "HR_MANAGEMENT", label: "HR", icon: Users, desc: "Human resources management",
    children: [
      { id: "hr-dashboard",         label: "Dashboard",            icon: LayoutDashboard, desc: "HR KPIs & workforce alerts" },
      { id: "employee-life-cycles", label: "Employee Life Cycles", icon: Users,           desc: "Employee records & movements" },
      { id: "new-employee-profile", label: "New Employee Profile", icon: UserCheck,       desc: "Reusable employee profile workspace" },
      {
        id: "hr-time-attendance", label: "Time & Attendance", icon: Clock, desc: "Time logs, shifts & leave",
        children: [
          { id: "time-management",  label: "Time Management",  icon: Clock,         desc: "Time logs & daily work hours" },
          { id: "shift-management", label: "Shift Management", icon: CalendarDays,  desc: "Shift templates & assignments" },
          { id: "attendance",       label: "Attendance",       icon: ClipboardList, desc: "Employee attendance monitoring" },
          { id: "leave-management", label: "Leave Management", icon: FileCheck,     desc: "Leave filing & approvals" },
        ],
      },
      {
        id: "hr-talent", label: "Talent Acquisition", icon: Briefcase, desc: "Recruitment & onboarding",
        children: [
          { id: "recruitment", label: "Recruitment", icon: Briefcase, desc: "Job openings & applicants" },
          { id: "onboarding",  label: "Onboarding",  icon: UserCheck, desc: "New hire checklist" },
        ],
      },
    ],
  },
  {
    id: "PAYROLL_MANAGEMENT", label: "Payroll", icon: Banknote, desc: "Payroll, payouts, taxes & benefits",
    children: [
      { id: "payroll-dashboard", label: "Payroll Dashboard", icon: LayoutDashboard, desc: "Payroll KPIs & analytics", targetModule: "PAYROLL_DASHBOARD" },
      { id: "payroll-management", label: "Payroll Management", icon: Banknote, desc: "Payroll runs & payslips" },
      { id: "salary-payouts",     label: "Salary Payouts",     icon: Wallet,   desc: "Payment batches & release status" },
      { id: "taxes",              label: "Taxes",              icon: Percent,  desc: "Withholding tax setup & reports" },
      { id: "benefits",           label: "Benefits",           icon: Award,    desc: "Employee benefits & contributions" },
    ],
  },
  {
    id: "NURSE_CLINIC", label: "Clinic", icon: Stethoscope, desc: "Student health & clinic services",
    children: [
      { id: "nurse",          label: "Nurse",          icon: Stethoscope, desc: "Student health visits & profiles",        targetModule: "NURSE_CLINIC" },
      { id: "consultation",   label: "Consultation",   icon: PhoneCall,   desc: "Appointment booking & adviser meetings",  targetModule: "CONSULTATION" },
      { id: "clinic-reports", label: "Clinic Reports", icon: FileText,    desc: "Visit logs, health profiles, and incidents", targetModule: "CLINIC_REPORTS" },
    ],
  },
  {
    id: "GUIDANCE", label: "Guidance Office", icon: NotebookPen, desc: "Anecdotal records & counseling sessions",
    children: [
      { id: "guidance-office",  label: "Guidance Office",  icon: NotebookPen, desc: "Anecdotal records & counseling sessions", targetModule: "GUIDANCE" },
      { id: "guidance-reports", label: "Guidance Reports", icon: FileText,    desc: "Counseling, incidents, and conference reports", targetModule: "GUIDANCE_REPORTS" },
    ],
  },
  {
    id: "ACCOUNTS_SECURITY", label: "User Access & Authority", icon: Shield, desc: "Credential security & admin reports",
    children: [
      { id: "user-security",         label: "User Security",       icon: Shield,         desc: "Credential security status",                    targetModule: "ACCOUNTS_SECURITY" },
      { id: "delegation-management", label: "Delegation Mgmt",     icon: History,        desc: "Approval delegation and authority transfer" },
      { id: "audit-log",             label: "Audit Log",           icon: ClipboardList,  desc: "Full system action and approval audit trail" },
      { id: "admin-reports",         label: "Admin Reports",       icon: FileText,       desc: "User access, logs, and audit reports",          targetModule: "ADMIN_REPORTS" },
    ],
  },
  { id: "CORE_SETUP", label: "Core Setup", icon: Settings, desc: "System configuration & maintenance" },
  { id: "GUARDIAN_PORTAL", label: "Parent Portal", icon: UsersRound, desc: "View your child's grades, fees & notices" },
];

/**
 * Resolves the navigation items visible to a user.
 * Filtering is by ROLE (permissions) first; academicUnit is accepted so that
 * future academic-unit-specific modules can be gated here without scattering
 * that logic across page components. No module is currently academic-unit
 * restricted — both basic-ed and college contexts share the same module set.
 */
export function getAllowedModules(role: UserRole, _academicUnit?: AcademicUnit): STSNModule[] {
  return getPermissionsForRole(role);
}

/**
 * Resolves the navigation items visible to a user, with label/desc overrides
 * applied for the given AcademicUnit (module ids/order are unchanged).
 *
 * Category groups (children with targetModule) are shown when the user has
 * access to the parent module OR at least one child's targetModule. Children
 * are individually filtered by the user's allowed modules.
 */
export function getNavItemsForRole(role: UserRole, academicUnit?: AcademicUnit): NavItem[] {
  const allowed = getAllowedModules(role, academicUnit);

  return NAV_ITEMS
    .filter((item) => {
      if (item.children?.some((c) => c.targetModule)) {
        return (
          allowed.includes(item.id) ||
          item.children.some((c) => c.targetModule && allowed.includes(c.targetModule))
        );
      }
      return allowed.includes(item.id);
    })
    .map((item) => {
      const resolved: NavItem = {
        ...item,
        label: (academicUnit && item.labelByUnit?.[academicUnit]) ?? item.label,
        desc: (academicUnit && item.descByUnit?.[academicUnit]) ?? item.desc,
      };
      if (resolved.children) {
        const needsFilter = resolved.children.some((c) => c.targetModule || c.showForRoles);
        if (needsFilter) {
          return {
            ...resolved,
            children: resolved.children.filter((c) => {
              if (c.showForRoles && !c.showForRoles.includes(role)) return false;
              return !c.targetModule || allowed.includes(c.targetModule);
            }),
          };
        }
      }
      return resolved;
    });
}

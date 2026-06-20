import {
  LayoutDashboard, Compass, Coins, GraduationCap, Users, BookOpen,
  Shield, BarChart3, Building2, CalendarDays, Layers, Settings, UserCheck, Wallet, Library
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { UserRole } from "../types";
import type { AcademicUnit } from "../types/school.types";
import { ROLE_PERMISSIONS, getPermissionsForRole } from "./permissions.config";
import type { STSNModule, Permission } from "./permissions.config";

export type { STSNModule, Permission };
export { ROLE_PERMISSIONS, getPermissionsForRole };

export interface NavItem {
  id: STSNModule;
  label: string;
  icon: LucideIcon;
  desc: string;
  /** Optional per-academic-unit label override, resolved by getNavItemsForRole(). Falls back to `label`. */
  labelByUnit?: Partial<Record<AcademicUnit, string>>;
  /** Optional per-academic-unit description override, resolved by getNavItemsForRole(). Falls back to `desc`. */
  descByUnit?: Partial<Record<AcademicUnit, string>>;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "DASHBOARD",        label: "Registrar Dashboard", icon: LayoutDashboard, desc: "Live admissions & fees" },
  { id: "REGISTRAR",        label: "Admissions & Enrollment", icon: Compass,     desc: "Student registrations" },
  { id: "ACCOUNTING",       label: "Accounting",          icon: Coins,           desc: "Ledger, discounts & reports" },
  { id: "CASHIER",          label: "Cashiering",          icon: Wallet,          desc: "Payments, receipts & collections" },
  {
    id: "BOOKS_SETUP", label: "Books Setup", icon: Library, desc: "Configure book packages by grade level",
    descByUnit: {
      "basic-ed": "Configure book packages by grade level",
      college: "Book packages do not apply to College",
    },
  },
  { id: "GRADING",          label: "Grades Directory",    icon: GraduationCap,   desc: "Midterm/Final score encodes" },
  { id: "STUDENT_PORTAL",   label: "Student Portal",      icon: UserCheck,       desc: "View grades, COR & ID" },
  { id: "FACULTY_PORTAL",   label: "Teacher Board",       icon: BookOpen,        desc: "Schedules & class scores" },
  { id: "ONLINE_LEARNING",  label: "Online Learning",     icon: BarChart3,       desc: "LMS • Videos & modules" },
  { id: "HR_MANAGEMENT",    label: "HR Staff Payroll",    icon: Users,           desc: "Employee payslips database" },
  { id: "CURRICULUM",       label: "Syllabus Pathways",   icon: Building2,       desc: "Academic subjects flow" },
  {
    id: "SCHEDULING", label: "Class Scheduling", icon: CalendarDays, desc: "Schedules & room assignments",
    descByUnit: {
      "basic-ed": "Subject schedules & adviser rooms",
      college: "Subject schedules, semester & room loads",
    },
  },
  {
    id: "CLASS_SECTIONING", label: "Class Sectioning", icon: Layers, desc: "Section management & student assignment",
    descByUnit: {
      "basic-ed": "Sections, advisers & LRN rosters",
      college: "Class sections, curriculum & unit loads",
    },
  },
  { id: "ACCOUNTS_SECURITY",label: "User Access & Authority", icon: Shield,       desc: "Credential security status" },
  { id: "CORE_SETUP",       label: "Core Setup",          icon: Settings,        desc: "System configuration & maintenance" },
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
 */
export function getNavItemsForRole(role: UserRole, academicUnit?: AcademicUnit): NavItem[] {
  const allowed = getAllowedModules(role, academicUnit);
  return NAV_ITEMS.filter((item) => allowed.includes(item.id)).map((item) => ({
    ...item,
    label: (academicUnit && item.labelByUnit?.[academicUnit]) ?? item.label,
    desc: (academicUnit && item.descByUnit?.[academicUnit]) ?? item.desc,
  }));
}

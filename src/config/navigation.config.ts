import {
  LayoutDashboard, Compass, Coins, GraduationCap, Users, BookOpen,
  Shield, BarChart3, Building2, CalendarDays, Layers, Settings, UserCheck, Wallet, Library,
  List, FileText, Truck, Package, Receipt, TrendingUp, TrendingDown, Scale, PieChart, Activity,
  Percent, Lock, ClipboardList, BookMarked, Banknote, Stethoscope, NotebookPen, PhoneCall
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { UserRole } from "../types";
import type { AcademicUnit } from "../types/school.types";
import { ROLE_PERMISSIONS, getPermissionsForRole } from "./permissions.config";
import type { STSNModule, Permission } from "./permissions.config";

export type { STSNModule, Permission };
export { ROLE_PERMISSIONS, getPermissionsForRole };

export interface NavSubItem {
  id: string;
  label: string;
  icon: LucideIcon;
  desc: string;
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
  {
    id: "DASHBOARD", label: "Admission", icon: LayoutDashboard, desc: "Registrar & academic management",
    children: [
      { id: "dashboard",         label: "Dashboard",         icon: LayoutDashboard, desc: "Live admissions & fees",             targetModule: "DASHBOARD" },
      { id: "enrollment",        label: "Enrollment",        icon: Compass,         desc: "Student registrations",             targetModule: "REGISTRAR" },
      { id: "class-scheduling",  label: "Class Scheduling",  icon: CalendarDays,    desc: "Subject schedules & adviser rooms", targetModule: "SCHEDULING" },
      { id: "class-sectioning",  label: "Class Sectioning",  icon: Layers,          desc: "Sections, advisers & LRN rosters", targetModule: "CLASS_SECTIONING" },
      { id: "syllabus-pathways", label: "Syllabus Pathways", icon: Building2,       desc: "Academic subjects flow",            targetModule: "CURRICULUM" },
      { id: "teacher-board",     label: "Teacher Board",     icon: BookOpen,        desc: "Schedules & class scores",          targetModule: "FACULTY_PORTAL" },
    ],
  },
  {
    id: "ACCOUNTING", label: "Accounting", icon: Coins, desc: "Ledger, discounts & reports",
    children: [
      { id: "dashboard",         label: "Dashboard",               icon: LayoutDashboard, desc: "KPIs & receivables watchlist" },
      { id: "ledger",            label: "Student Ledger",          icon: BookOpen,        desc: "Per-student debit/credit ledger" },
      { id: "discounts",         label: "Discounts",               icon: Percent,         desc: "Discount types & approval requests" },
      { id: "billing",           label: "Billing & Assessment",    icon: ClipboardList,   desc: "Assessment approval & summary" },
      { id: "holds",             label: "Financial Holds",         icon: Lock,            desc: "Student financial hold management" },
      { id: "chart-of-accounts", label: "Chart of Accounts",      icon: List,            desc: "GL account codes & hierarchy" },
      { id: "cost-centers",      label: "Cost Centers",            icon: Building2,       desc: "Departmental cost segmentation" },
      { id: "journal-entries",   label: "Journal Entries",         icon: BookMarked,      desc: "Double-entry bookkeeping postings" },
      { id: "suppliers",         label: "Supplier Management",     icon: Truck,           desc: "Vendor & supplier master list" },
      { id: "items",             label: "Item / Product Mgmt",     icon: Package,         desc: "Product & service catalog" },
      { id: "sales-invoices",    label: "Sales Invoice",           icon: Receipt,         desc: "Customer sales invoices (AR)" },
      { id: "purchase-invoices", label: "Purchase Invoice",        icon: FileText,        desc: "Vendor purchase invoices (AP)" },
      { id: "ar-aging",          label: "AR with Aging",           icon: TrendingUp,      desc: "Receivables aged 30/60/90/120+ days" },
      { id: "ap-aging",          label: "AP with Aging",           icon: TrendingDown,    desc: "Payables aged by vendor & due date" },
      { id: "trial-balance",     label: "Trial Balance",           icon: Scale,           desc: "Debit/credit totals by GL account" },
      { id: "balance-sheet",     label: "Balance Sheet",           icon: PieChart,        desc: "Assets = Liabilities + Equity snapshot" },
      { id: "income-statement",  label: "Income Statement",        icon: Activity,        desc: "Revenue − Expenses = Net Income" },
      { id: "cash-flow",         label: "Cash Flow Report",        icon: Banknote,        desc: "Operating / investing / financing flows" },
    ],
  },
  { id: "CASHIER",          label: "Cashiering",              icon: Wallet,      desc: "Payments, receipts & collections" },
  { id: "GRADING",          label: "Grades Directory",        icon: GraduationCap, desc: "Midterm/Final score encodes" },
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
      { id: "hr-staff-payroll", label: "HR Staff Payroll", icon: Users, desc: "Employee payslips database", targetModule: "HR_MANAGEMENT" },
    ],
  },
  {
    id: "NURSE_CLINIC", label: "Clinic", icon: Stethoscope, desc: "Student health & clinic services",
    children: [
      { id: "nurse",        label: "Nurse",        icon: Stethoscope, desc: "Student health visits & profiles",       targetModule: "NURSE_CLINIC" },
      { id: "consultation", label: "Consultation", icon: PhoneCall,   desc: "Appointment booking & adviser meetings", targetModule: "CONSULTATION" },
    ],
  },
  { id: "GUIDANCE",          label: "Guidance Office",         icon: NotebookPen, desc: "Anecdotal records & counseling sessions" },
  { id: "ACCOUNTS_SECURITY", label: "User Access & Authority", icon: Shield,   desc: "Credential security status" },
  {
    id: "CORE_SETUP", label: "Core Setup", icon: Settings, desc: "System configuration & maintenance",
    children: [
      { id: "academic_categories",       label: "Academic Categories",        icon: Layers,        desc: "Program categories",              targetModule: "CORE_SETUP" },
      { id: "academic_levels",           label: "Academic Levels",            icon: GraduationCap, desc: "Education levels",                targetModule: "CORE_SETUP" },
      { id: "year_levels",               label: "Year Levels",                icon: Layers,        desc: "Grade and year levels",           targetModule: "CORE_SETUP" },
      { id: "school_years",              label: "School Years",               icon: CalendarDays,  desc: "Academic year periods",           targetModule: "CORE_SETUP" },
      { id: "semesters",                 label: "Semesters / Terms",          icon: CalendarDays,  desc: "Semester and term definitions",    targetModule: "CORE_SETUP" },
      { id: "departments",               label: "Departments",                icon: Building2,     desc: "Academic and admin departments",  targetModule: "CORE_SETUP" },
      { id: "holidays",                  label: "Holiday Maintenance",        icon: CalendarDays,  desc: "Official holiday setup",          targetModule: "CORE_SETUP" },
      { id: "admission_types",           label: "Admission Types",            icon: Users,         desc: "New, transferee and returnee",    targetModule: "CORE_SETUP" },
      { id: "enrollment_requirements",   label: "Enrollment Requirements",    icon: FileText,      desc: "Required enrollment documents",   targetModule: "CORE_SETUP" },
      { id: "student_statuses",          label: "Student Status",             icon: Users,         desc: "Enrollment status options",       targetModule: "CORE_SETUP" },
      { id: "student_types",             label: "Student Types",              icon: Users,         desc: "Regular and special types",       targetModule: "CORE_SETUP" },
      { id: "campuses",                  label: "Campuses",                   icon: Building2,     desc: "School campus locations",         targetModule: "CORE_SETUP" },
      { id: "buildings",                 label: "Buildings",                  icon: Building2,     desc: "Campus building setup",           targetModule: "CORE_SETUP" },
      { id: "room_types",                label: "Room Types",                 icon: Layers,        desc: "Classroom and facility types",     targetModule: "CORE_SETUP" },
      { id: "rooms",                     label: "Rooms / Classrooms",         icon: Building2,     desc: "Room maintenance",                targetModule: "CORE_SETUP" },
      { id: "time_slots",                label: "Time Slots",                 icon: CalendarDays,  desc: "Class period definitions",        targetModule: "CORE_SETUP" },
      { id: "faculty_ranks",             label: "Faculty Ranks",              icon: GraduationCap, desc: "Faculty rank levels",             targetModule: "CORE_SETUP" },
      { id: "employment_types",          label: "Employment Types",           icon: Users,         desc: "Employee type setup",             targetModule: "CORE_SETUP" },
      { id: "fee_categories",            label: "Fee Categories",             icon: Coins,         desc: "Tuition and fee groups",          targetModule: "CORE_SETUP" },
      { id: "fee_items",                 label: "Fee Items",                  icon: Coins,         desc: "Fee line items and amounts",      targetModule: "CORE_SETUP" },
      { id: "payment_terms",             label: "Payment Terms",              icon: Wallet,        desc: "Cash and installment terms",      targetModule: "CORE_SETUP" },
      { id: "payment_methods",           label: "Payment Methods",            icon: Wallet,        desc: "Collection payment channels",     targetModule: "CORE_SETUP" },
      { id: "chart_of_accounts",         label: "Chart of Accounts",          icon: BarChart3,     desc: "Financial account codes",         targetModule: "CORE_SETUP" },
      { id: "accounting_periods",        label: "Accounting Periods",         icon: CalendarDays,  desc: "Fiscal period definitions",       targetModule: "CORE_SETUP" },
      { id: "or_series",                 label: "Official Receipt Series",    icon: Receipt,       desc: "OR numbering configuration",      targetModule: "CORE_SETUP" },
      { id: "collection_types",          label: "Collection Types",           icon: Coins,         desc: "Collection classifications",      targetModule: "CORE_SETUP" },
      { id: "refund_reasons",            label: "Refund Reasons",             icon: FileText,      desc: "Student refund reasons",          targetModule: "CORE_SETUP" },
      { id: "void_reasons",              label: "Void Reasons",               icon: FileText,      desc: "Receipt void reasons",            targetModule: "CORE_SETUP" },
      { id: "nationalities",             label: "Nationalities",              icon: Users,         desc: "Student nationality references",  targetModule: "CORE_SETUP" },
      { id: "civil_statuses",            label: "Civil Statuses",             icon: Users,         desc: "Civil status references",         targetModule: "CORE_SETUP" },
      { id: "religions",                 label: "Religions",                  icon: BookOpen,      desc: "Religion references",             targetModule: "CORE_SETUP" },
      { id: "grade_scales",              label: "Grade Scale",                icon: Scale,         desc: "Grade equivalents and remarks",   targetModule: "CORE_SETUP" },
      { id: "document_types",            label: "Document Types",             icon: FileText,      desc: "Document maintenance",            targetModule: "CORE_SETUP" },
      { id: "roles_setup",               label: "Roles",                      icon: Shield,        desc: "System role definitions",         targetModule: "CORE_SETUP" },
      { id: "permissions_setup",         label: "Permissions",                icon: Shield,        desc: "Module permission definitions",   targetModule: "CORE_SETUP" },
      { id: "id_card_templates",         label: "ID Card Templates",          icon: UserCheck,     desc: "ID card design templates",        targetModule: "CORE_SETUP" },
      { id: "enrollment_workflows",      label: "Enrollment Workflow",        icon: ClipboardList, desc: "Enrollment approval steps",        targetModule: "CORE_SETUP" },
      { id: "clearance_workflows",       label: "Clearance Workflow",         icon: ClipboardList, desc: "Clearance step configuration",     targetModule: "CORE_SETUP" },
      { id: "library", label: "Library", icon: Library, desc: "Configure book packages by grade level", targetModule: "BOOKS_SETUP" },
    ],
  },
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

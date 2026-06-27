/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useSTSNStore } from "./services/store";
import {
  GraduationCap,
  Building2,
  Clock,
  Menu,
  ChevronDown,
  ChevronRight,
  School,
  Search,
} from "lucide-react";

// Config
import {
  STSNModule,
  getAllowedModules,
  getNavItemsForRole,
  SIDEBAR_MODE,
} from "./config/navigation.config";

// Components
import LoginOverlay from "./components/LoginOverlay";
import NotificationBell, { UrgentAnnouncementBanner } from "./components/common/NotificationBell";
import UserProfileDropdown from "./components/common/UserProfileDropdown";
import GlobalSearch from "./components/common/GlobalSearch";
import BreadcrumbBar, { type BreadcrumbCrumb } from "./components/common/BreadcrumbBar";
import MobileBottomNav, { hasMobileBottomNav } from "./components/common/MobileBottomNav";
import type { NavigateTarget } from "./components/common/ApprovalInbox";

// Hooks
import { usePendingCounts } from "./hooks/usePendingCounts";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";

// Feature Pages
import Dashboard from "./features/dashboard/pages/DashboardPage";
import ActionCenterPage from "./features/action-center/pages/ActionCenterPage";
import PayrollDashboardPage from "./features/payroll/pages/PayrollDashboardPage";
import AccountingDashboardPage from "./features/accounting/pages/AccountingDashboardPage";
import RegistrarModule from "./features/registrar/pages/RegistrarModulePage";
import AccountingModule from "./features/accounting/pages/AccountingModulePage";
import GradingModule from "./features/grading/pages/GradingModulePage";
import HRManagement from "./features/hr/pages/HRManagementPage";
import PayrollModulePage from "./features/payroll/pages/PayrollModulePage";
import CurriculumManagement from "./features/curriculum/pages/CurriculumManagementPage";
import AccountsManagement from "./features/accounts/pages/AccountsManagementPage";
import StudentPortal from "./features/student-portal/pages/StudentPortalPage";
import FacultyPortal from "./features/faculty/pages/FacultyPortalPage";
import FacultyAdminPage from "./features/faculty/pages/FacultyAdminPage";
import CoreSetupModule from "./features/core-setup/pages/CoreSetupModulePage";
import SchedulingModule from "./features/scheduling/pages/SchedulingModulePage";
import OnlineLearning from "./features/online-learning/pages/OnlineLearningPage";
import ClassSectioningModule from "./features/class-sectioning/pages/ClassSectioningModulePage";
import BooksSetupPage from "./features/books/pages/BooksSetupPage";
import CashierModule from "./features/cashier/pages/CashierModulePage";
import ClinicModule from "./features/clinic/pages/ClinicModulePage";
import GuidanceModule from "./features/guidance/pages/GuidanceModulePage";
import ConsultationModule from "./features/consultation/pages/ConsultationModulePage";
import RegistrarReportsPage from "./features/reports/pages/RegistrarReportsPage";
import GuidanceReportsPage from "./features/reports/pages/GuidanceReportsPage";
import ClinicReportsPage from "./features/reports/pages/ClinicReportsPage";
import AdminReportsPage from "./features/reports/pages/AdminReportsPage";
import StudentDirectoryPage from "./features/student-directory/pages/StudentDirectoryPage";
import GuardianPortalPage from "./features/guardian/pages/GuardianPortalPage";

const APP_SIDEBAR_WIDTH_CLASS = "w-[265px] min-w-[265px] max-w-[265px]";

function PendingBadge({ count, small = false }: { count: number; small?: boolean }) {
  if (count <= 0) return null;
  return (
    <span
      className={`flex-shrink-0 font-mono font-bold rounded-full bg-stsn-gold text-stsn-brown text-center leading-none ${
        small ? "text-[8px] px-1 py-px min-w-[15px]" : "text-[9px] px-1.5 py-0.5 min-w-[18px]"
      }`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default function App() {
  const { currentUser, logout, activeSchool, academicUnit, isLoading, initialize } =
    useSTSNStore();
  const counts = usePendingCounts();
  const [activeModule, setActiveModule] = useState<STSNModule>("DASHBOARD");
  const [accountingSubPage, setAccountingSubPage] = useState("dashboard");
  const [coreSetupSubPage, setCoreSetupSubPage] = useState("academic_categories");
  const [portalSubPage, setPortalSubPage] = useState("overview");
  const [hrSubPage, setHrSubPage] = useState("hr-dashboard");
  const [payrollSubPage, setPayrollSubPage] = useState("payroll-management");
  const [cashierSubPage, setCashierSubPage] = useState("queue");
  const [accountsSubPage, setAccountsSubPage] = useState<"user-security" | "delegation-management" | "audit-log">("user-security");
  const [portalStudentId, setPortalStudentId] = useState<string | undefined>(undefined);
  const [expandedModule, setExpandedModule] = useState<STSNModule | null>("DASHBOARD");
  const [expandedAccountingGroups, setExpandedAccountingGroups] = useState<string[]>([]);
  const [expandedHRGroups, setExpandedHRGroups] = useState<string[]>([]);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === "STUDENT") setActiveModule("STUDENT_PORTAL");
    else if (currentUser.role === "TEACHER" || currentUser.role === "EMPLOYEE")
      setActiveModule("FACULTY_PORTAL");
    else if (currentUser.role === "REGISTRAR") setActiveModule("REGISTRAR");
    else if (currentUser.role === "PRINCIPAL") setActiveModule("STUDENT_DIRECTORY");
    else if (currentUser.role === "HR") setActiveModule("HR_MANAGEMENT");
    else if (currentUser.role === "ACCOUNTING") setActiveModule("ACCOUNTING");
    else if (currentUser.role === "CASHIER") setActiveModule("CASHIER");
    else if (currentUser.role === "PAYROLL") setActiveModule("PAYROLL_DASHBOARD");
    else if (currentUser.role === "GUIDANCE") setActiveModule("GUIDANCE");
    else if (currentUser.role === "NURSE") setActiveModule("NURSE_CLINIC");
    else if (currentUser.role === "GUARDIAN") setActiveModule("GUARDIAN_PORTAL");
    else setActiveModule("DASHBOARD");
  }, [currentUser]);

  // Derive breadcrumb from active module / sub-page state
  const breadcrumbs = (() => {
    const crumbs: BreadcrumbCrumb[] = [];
    const moduleLabel: Partial<Record<string, string>> = {
      DASHBOARD: "Dashboard",
      ACTION_CENTER: "Action Center",
      REGISTRAR: "Enrollment",
      REGISTRAR_REPORTS: "Registrar Reports",
      ACCOUNTING: "Accounting",
      GRADING: "Grades Directory",
      CURRICULUM: "Curriculum",
      STUDENT_DIRECTORY: "Student Directory",
      STUDENT_PORTAL: "Student Portal",
      FACULTY_ADMIN: "Faculty Admin",
      FACULTY_PORTAL: "Faculty Portal",
      HR_MANAGEMENT: "HR Management",
      PAYROLL_DASHBOARD: "Payroll Dashboard",
      PAYROLL_MANAGEMENT: "Payroll Management",
      ACCOUNTS_SECURITY: "Accounts & Security",
      CORE_SETUP: "Core Setup",
      SCHEDULING: "Class Scheduling",
      CLASS_SECTIONING: "Class Sectioning",
      ONLINE_LEARNING: "Online Learning",
      BOOKS_SETUP: "Books & Library",
      CASHIER: "Cashier",
      NURSE_CLINIC: "Nurse Clinic",
      GUIDANCE: "Guidance",
      GUIDANCE_REPORTS: "Guidance Reports",
      CLINIC_REPORTS: "Clinic Reports",
      ADMIN_REPORTS: "Admin Reports",
      CONSULTATION: "Consultation",
    };
    const subPageLabel: Partial<Record<string, string>> = {
      dashboard: "Dashboard",
      "accounting-student-accounts": "Student Accounts",
      billing: "Assessment Billing",
      discounts: "Discounts",
      payments: "Payments",
      "hr-dashboard": "HR Dashboard",
      "leave-management": "Leave Management",
      "hr-time-attendance": "Time & Attendance",
      "employee-management": "Employee Management",
      "payroll-management": "Payroll Runs",
      "payroll-settings": "Payroll Settings",
      queue: "Payment Queue",
      "cashier-reports": "Cashier Reports",
      "user-security": "User Security",
      "delegation-management": "Delegation Management",
      "audit-log": "Audit Log",
    };
    const modLabel = moduleLabel[activeModule];
    if (modLabel) crumbs.push({ label: modLabel });
    const subPage =
      activeModule === "ACCOUNTING" ? accountingSubPage
      : activeModule === "HR_MANAGEMENT" ? hrSubPage
      : activeModule === "PAYROLL_MANAGEMENT" ? payrollSubPage
      : activeModule === "CASHIER" ? cashierSubPage
      : activeModule === "ACCOUNTS_SECURITY" ? accountsSubPage
      : null;
    if (subPage && subPage !== "dashboard" && subPageLabel[subPage]) {
      crumbs.push({ label: subPageLabel[subPage]! });
    }
    return crumbs;
  })();

  // Keyboard shortcuts — only when logged in
  useKeyboardShortcuts({
    "Ctrl+k": () => setGlobalSearchOpen(true),
    "Meta+k": () => setGlobalSearchOpen(true),
    "Escape": () => setGlobalSearchOpen(false),
  });

  if (!currentUser) return <LoginOverlay />;

  const allowedModules = getAllowedModules(currentUser.role, academicUnit);
  const sidebarMode = SIDEBAR_MODE[currentUser.role];

  const renderedSidebarItems = getNavItemsForRole(
    currentUser.role,
    academicUnit,
  );

  const getBadgeCount = (moduleId: STSNModule, childId?: string): number => {
    if (!currentUser) return 0;
    const role = currentUser.role;
    if (moduleId === "ACTION_CENTER") return counts.totalForRole;
    switch (role) {
      case "ACCOUNTING":
        if (moduleId !== "ACCOUNTING") return 0;
        if (!childId) return counts.pendingAssessments + counts.pendingDiscounts;
        if (childId === "accounting-student-accounts") return counts.pendingAssessments + counts.pendingDiscounts;
        if (childId === "billing") return counts.pendingAssessments;
        if (childId === "discounts") return counts.pendingDiscounts;
        return 0;
      case "REGISTRAR":
        if (moduleId !== "REGISTRAR") return 0;
        if (!childId || childId === "enrollment") return counts.pendingEnrollments + counts.pendingApplications;
        return 0;
      case "HR":
        if (moduleId !== "HR_MANAGEMENT") return 0;
        if (!childId || childId === "hr-time-attendance" || childId === "leave-management") return counts.pendingLeaves;
        return 0;
      case "PAYROLL":
        if (moduleId !== "PAYROLL_MANAGEMENT") return 0;
        if (!childId || childId === "payroll-management") return counts.pendingPayrollRuns;
        return 0;
      case "PRINCIPAL":
        if (moduleId !== "REGISTRAR") return 0;
        if (!childId || childId === "grades-directory") return counts.pendingGrades;
        return 0;
      case "SUPER_ADMIN":
      case "ADMIN":
        if (moduleId === "ACCOUNTING") {
          if (!childId) return counts.pendingAssessments + counts.pendingDiscounts;
          if (childId === "accounting-student-accounts") return counts.pendingAssessments + counts.pendingDiscounts;
          if (childId === "billing") return counts.pendingAssessments;
          if (childId === "discounts") return counts.pendingDiscounts;
        }
        if (moduleId === "REGISTRAR") {
          if (!childId) return counts.pendingEnrollments + counts.pendingApplications + counts.pendingGrades;
          if (childId === "enrollment") return counts.pendingEnrollments + counts.pendingApplications;
          if (childId === "grades-directory") return counts.pendingGrades;
        }
        if (moduleId === "HR_MANAGEMENT") {
          if (!childId || childId === "hr-time-attendance" || childId === "leave-management") return counts.pendingLeaves;
        }
        if (moduleId === "PAYROLL_MANAGEMENT") {
          if (!childId || childId === "payroll-management") return counts.pendingPayrollRuns;
        }
        return 0;
      default:
        return 0;
    }
  };

  const renderedModuleIds: STSNModule[] = [
    "DASHBOARD",
    "ACTION_CENTER",
    "REGISTRAR",
    "REGISTRAR_REPORTS",
    "ACCOUNTING",
    "GRADING",
    "CURRICULUM",
    "STUDENT_DIRECTORY",
    "STUDENT_PORTAL",
    "FACULTY_ADMIN",
    "FACULTY_PORTAL",
    "HR_MANAGEMENT",
    "PAYROLL_DASHBOARD",
    "ACCOUNTING_DASHBOARD",
    "PAYROLL_MANAGEMENT",
    "ACCOUNTS_SECURITY",
    "CORE_SETUP",
    "SCHEDULING",
    "CLASS_SECTIONING",
    "ONLINE_LEARNING",
    "BOOKS_SETUP",
    "CASHIER",
    "NURSE_CLINIC",
    "GUIDANCE",
    "GUIDANCE_REPORTS",
    "CLINIC_REPORTS",
    "ADMIN_REPORTS",
    "CONSULTATION",
    "GUARDIAN_PORTAL",
  ];

  const handleActionCenterNavigate = (target: NavigateTarget) => {
    setActiveModule(target.module);
    if (!target.subPage) return;

    if (target.module === "ACCOUNTING") {
      setAccountingSubPage(target.subPage);
    } else if (target.module === "HR_MANAGEMENT") {
      setHrSubPage(target.subPage);
    } else if (target.module === "PAYROLL_MANAGEMENT") {
      setPayrollSubPage(target.subPage);
    } else if (target.module === "CASHIER") {
      setCashierSubPage(target.subPage);
    } else if (target.module === "STUDENT_PORTAL") {
      setPortalSubPage(target.subPage);
    } else if (target.module === "ACCOUNTS_SECURITY") {
      setAccountsSubPage(target.subPage as "user-security" | "delegation-management" | "audit-log");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stsn-cream text-stsn-text font-sans">
        <div className="flex flex-col items-center gap-3">
          <GraduationCap className="w-10 h-10 text-stsn-gold animate-pulse" />
          <p className="text-sm text-stone-500">Loading STSN Connect…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-stsn-cream text-stsn-text font-sans antialiased overflow-hidden h-screen">
      {/* ============ SIDEBAR ============ */}
      <aside className={`hidden lg:flex flex-col h-full flex-shrink-0 relative sidebar-gradient ${APP_SIDEBAR_WIDTH_CLASS}`}>
        {/* Top gold accent line */}
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-stsn-brown-dark via-stsn-gold to-stsn-brown-dark opacity-90" />

        {/* Brand Header */}
        <div className={`border-b border-white/8 mt-[3px] flex items-center gap-3 ${sidebarMode === "minimal" ? "p-3 justify-center" : "p-5"}`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-stsn-gold/30 to-stsn-brown border border-stsn-gold/40 flex items-center justify-center shadow-lg flex-shrink-0" title="STSN Connect">
            <Building2 className="w-5 h-5 text-stsn-gold" />
          </div>
          {sidebarMode !== "minimal" && (
            <div>
              <h1 className="font-display font-extrabold text-stsn-gold leading-none tracking-tight text-md">
                Theresian <span className="text-stsn-gold-light">Connect</span>
              </h1>
              <span className="text-[9px] text-stone-400 font-mono tracking-widest uppercase mt-0.5 block">
                Academia Enterprise v2
              </span>
            </div>
          )}
        </div>

        {/* School badges — hidden in minimal mode */}
        {sidebarMode !== "minimal" && (
          <div className="px-4 py-2.5 space-y-1.5 border-b border-white/5">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all ${
                activeSchool === "STSN" || activeSchool === "ALL"
                  ? "bg-white/10 border-stsn-gold/30"
                  : "bg-white/5 border-white/8"
              }`}
            >
              <School className="w-3 h-3 text-stsn-gold flex-shrink-0" />
              <span className="text-[8.5px] font-mono text-stone-300 truncate flex-1">
                St. Theresa's School of Novaliches
              </span>
              {(activeSchool === "STSN" || activeSchool === "ALL") && (
                <span className="w-1.5 h-1.5 rounded-full bg-stsn-gold animate-pulse flex-shrink-0" />
              )}
            </div>
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all ${
                activeSchool === "CDSTA" || activeSchool === "ALL"
                  ? "bg-blue-500/15 border-blue-400/30"
                  : "bg-white/5 border-white/8"
              }`}
            >
              <GraduationCap className="w-3 h-3 text-blue-400 flex-shrink-0" />
              <span className="text-[8.5px] font-mono text-blue-300 truncate flex-1">
                Colegio de Sta. Teresa de Avila
              </span>
              {(activeSchool === "CDSTA" || activeSchool === "ALL") && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse flex-shrink-0" />
              )}
            </div>
            {activeSchool !== "ALL" && (
              <div className="px-2.5 py-1 text-center">
                <span className="text-[8px] font-mono text-stsn-gold/60 uppercase tracking-widest">
                  Viewing: {activeSchool === "STSN" ? "STSN Data" : "CDSTA Data"}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className={`flex-1 space-y-0.5 py-3 overflow-y-auto ${sidebarMode === "minimal" ? "px-1" : "px-3"}`}>
          {renderedSidebarItems.map((item) => {
            const isSelected = activeModule === item.id;
            const isExpanded = expandedModule === item.id;
            const Icon = item.icon;

            // Minimal mode: icon-only rail, no children expansion
            if (sidebarMode === "minimal") {
              const isActive = activeModule === item.id ||
                (item.children?.some((c) => c.targetModule === activeModule) ?? false);
              return (
                <button
                  key={item.id}
                  title={item.label}
                  onClick={() => {
                    const firstChildModule = item.children?.find((c) => c.targetModule)?.targetModule;
                    setActiveModule(firstChildModule ?? item.id);
                    setExpandedModule(null);
                    setIsMobileOpen(false);
                  }}
                  className={`w-full flex items-center justify-center py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "sidebar-item-active text-stsn-cream shadow-md"
                      : "hover:bg-white/8 text-stone-400 opacity-80 hover:opacity-100"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-stsn-gold" : ""}`} />
                </button>
              );
            }

            if (item.children) {
              const isCategoryGroup = item.children.some((c) => c.targetModule);
              const isSelectedGroup = isCategoryGroup
                ? activeModule === item.id || item.children.some((c) => c.targetModule === activeModule)
                : isSelected;
              const isExpandedGroup = expandedModule === item.id;

              return (
                <div key={item.id}>
                  {/* Parent row — toggles expansion; category groups do not navigate on click */}
                  <button
                    onClick={() => {
                      if (!isCategoryGroup) setActiveModule(item.id);
                      setExpandedModule(isExpandedGroup ? null : item.id);
                      setIsMobileOpen(false);
                    }}
                    className={`w-full text-left py-2.5 px-3 rounded-xl flex items-start gap-3 transition-all duration-200 cursor-pointer group ${
                      isSelectedGroup
                        ? "sidebar-item-active text-stsn-cream font-bold shadow-md"
                        : "hover:bg-white/8 text-stone-300 font-medium opacity-80 hover:opacity-100"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isSelectedGroup ? "text-stsn-gold" : "text-stone-400 group-hover:text-stone-200"}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] leading-none">{item.label}</p>
                      <p className={`text-[9.5px] font-normal truncate mt-0.5 leading-none ${isSelectedGroup ? "text-stsn-gold-light/70" : "text-stone-500"}`}>
                        {item.desc}
                      </p>
                    </div>
                    {getBadgeCount(item.id) > 0 && (
                      <PendingBadge count={getBadgeCount(item.id)} />
                    )}
                    {isExpandedGroup
                      ? <ChevronDown className="w-3 h-3 flex-shrink-0 mt-1 text-stsn-gold/70" />
                      : <ChevronRight className="w-3 h-3 flex-shrink-0 mt-1 text-stone-500 group-hover:text-stone-300" />
                    }
                  </button>

                  {/* Children */}
                  {isExpandedGroup && (
                    <div className="mt-0.5 ml-2 pl-3 border-l border-white/10 space-y-0.5">
                      {item.children.map((child) => {
                        if (child.isSection) {
                          return (
                            <div
                              key={child.id}
                              className="px-2.5 pt-3 pb-1 text-[8px] font-mono uppercase tracking-widest text-stsn-gold/60"
                            >
                              {child.label}
                            </div>
                          );
                        }
                        if (child.children?.length) {
                          const isHRModule = item.id === "HR_MANAGEMENT";
                          const activeSubPage = isHRModule ? hrSubPage : accountingSubPage;
                          const expandedGroups = isHRModule ? expandedHRGroups : expandedAccountingGroups;
                          const isGroupActive = child.children.some((subChild) => subChild.id === activeSubPage);
                          const isGroupExpanded = expandedGroups.includes(child.id) || isGroupActive;
                          const GroupIcon = child.icon;
                          return (
                            <div key={child.id}>
                              <button
                                onClick={() => {
                                  if (isHRModule) {
                                    setExpandedHRGroups((groups: string[]) =>
                                      groups.includes(child.id)
                                        ? groups.filter((id: string) => id !== child.id)
                                        : [...groups, child.id],
                                    );
                                  } else {
                                    setExpandedAccountingGroups((groups: string[]) =>
                                      groups.includes(child.id)
                                        ? groups.filter((id: string) => id !== child.id)
                                        : [...groups, child.id],
                                    );
                                  }
                                }}
                                className={`w-full text-left py-2 px-2.5 rounded-lg flex items-start gap-2.5 transition-all duration-150 cursor-pointer group ${
                                  isGroupActive
                                    ? "bg-stsn-gold/15 text-stsn-cream font-semibold"
                                    : "hover:bg-white/6 text-stone-400 font-medium opacity-80 hover:opacity-100"
                                }`}
                              >
                                {GroupIcon && <GroupIcon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${isGroupActive ? "text-stsn-gold" : "text-stone-500 group-hover:text-stone-300"}`} />}
                                <div className="min-w-0 flex-1">
                                  <p className="text-[11px] leading-none">{child.label}</p>
                                  <p className={`text-[9px] font-normal truncate mt-0.5 leading-none ${isGroupActive ? "text-stsn-gold-light/60" : "text-stone-600"}`}>
                                    {child.desc ?? ""}
                                  </p>
                                </div>
                                {getBadgeCount(item.id, child.id) > 0 && (
                                  <PendingBadge count={getBadgeCount(item.id, child.id)} small />
                                )}
                                {isGroupExpanded
                                  ? <ChevronDown className="w-3 h-3 flex-shrink-0 mt-0.5 text-stsn-gold/70" />
                                  : <ChevronRight className="w-3 h-3 flex-shrink-0 mt-0.5 text-stone-500 group-hover:text-stone-300" />}
                              </button>

                              {isGroupExpanded && (
                                <div className="ml-4 mt-0.5 pl-2 border-l border-white/10 space-y-0.5">
                                  {child.children.map((subChild) => {
                                    const isSubChildActive = activeSubPage === subChild.id;
                                    const SubChildIcon = subChild.icon;
                                    return (
                                      <button
                                        key={subChild.id}
                                        onClick={() => {
                                          setActiveModule(item.id);
                                          if (isHRModule) setHrSubPage(subChild.id);
                                          else setAccountingSubPage(subChild.id);
                                          setIsMobileOpen(false);
                                        }}
                                        className={`w-full text-left py-1.5 px-2 rounded-lg flex items-start gap-2 transition-all duration-150 cursor-pointer group ${
                                          isSubChildActive
                                            ? "bg-stsn-gold/20 text-stsn-cream font-semibold"
                                            : "hover:bg-white/6 text-stone-400 font-medium opacity-80 hover:opacity-100"
                                        }`}
                                      >
                                        {SubChildIcon && <SubChildIcon className={`w-3 h-3 mt-0.5 flex-shrink-0 ${isSubChildActive ? "text-stsn-gold" : "text-stone-500 group-hover:text-stone-300"}`} />}
                                        <div className="min-w-0 flex-1">
                                          <p className="text-[10.5px] leading-none">{subChild.label}</p>
                                          <p className={`text-[8.5px] font-normal truncate mt-0.5 leading-none ${isSubChildActive ? "text-stsn-gold-light/60" : "text-stone-600"}`}>
                                            {subChild.desc ?? ""}
                                          </p>
                                        </div>
                                        {getBadgeCount(item.id, subChild.id) > 0 && (
                                          <PendingBadge count={getBadgeCount(item.id, subChild.id)} small />
                                        )}
                                        {isSubChildActive && <div className="w-1 h-1 rounded-full bg-stsn-gold flex-shrink-0 mt-1.5" />}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        }
                        const isChildActive = child.targetModule
                          ? activeModule === child.targetModule && (child.targetModule !== "CORE_SETUP" || coreSetupSubPage === child.id)
                          : isSelected && (item.id === "STUDENT_PORTAL" ? portalSubPage === child.id : item.id === "HR_MANAGEMENT" ? hrSubPage === child.id : item.id === "PAYROLL_MANAGEMENT" ? payrollSubPage === child.id : item.id === "CASHIER" ? cashierSubPage === child.id : item.id === "ACCOUNTS_SECURITY" ? accountsSubPage === child.id : accountingSubPage === child.id);
                        const ChildIcon = child.icon;
                        return (
                          <button
                            key={child.id}
                            onClick={() => {
                              if (child.targetModule) {
                                setActiveModule(child.targetModule);
                                if (child.targetModule === "CORE_SETUP") {
                                  setCoreSetupSubPage(child.id);
                                }
                              } else {
                                setActiveModule(item.id);
                                if (item.id === "STUDENT_PORTAL") {
                                  setPortalSubPage(child.id);
                                } else if (item.id === "HR_MANAGEMENT") {
                                  setHrSubPage(child.id);
                                } else if (item.id === "PAYROLL_MANAGEMENT") {
                                  setPayrollSubPage(child.id);
                                } else if (item.id === "CASHIER") {
                                  setCashierSubPage(child.id);
                                } else if (item.id === "ACCOUNTS_SECURITY") {
                                  setAccountsSubPage(child.id as "user-security" | "delegation-management" | "audit-log");
                                } else {
                                  setAccountingSubPage(child.id);
                                }
                              }
                              setIsMobileOpen(false);
                            }}
                            className={`w-full text-left py-2 px-2.5 rounded-lg flex items-start gap-2.5 transition-all duration-150 cursor-pointer group ${
                              isChildActive
                                ? "bg-stsn-gold/20 text-stsn-cream font-semibold"
                                : "hover:bg-white/6 text-stone-400 font-medium opacity-80 hover:opacity-100"
                            }`}
                          >
                            {ChildIcon && <ChildIcon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${isChildActive ? "text-stsn-gold" : "text-stone-500 group-hover:text-stone-300"}`} />}
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] leading-none">{child.label}</p>
                              <p className={`text-[9px] font-normal truncate mt-0.5 leading-none ${isChildActive ? "text-stsn-gold-light/60" : "text-stone-600"}`}>
                                {child.desc ?? ""}
                              </p>
                            </div>
                            {getBadgeCount(item.id, child.id) > 0 && (
                              <PendingBadge count={getBadgeCount(item.id, child.id)} small />
                            )}
                            {isChildActive && <div className="w-1 h-1 rounded-full bg-stsn-gold flex-shrink-0 mt-1.5" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveModule(item.id);
                  setExpandedModule(null);
                  setIsMobileOpen(false);
                }}
                className={`w-full text-left py-2.5 px-3 rounded-xl flex items-start gap-3 transition-all duration-200 cursor-pointer group ${
                  isSelected
                    ? "sidebar-item-active text-stsn-cream font-bold shadow-md"
                    : "hover:bg-white/8 text-stone-300 font-medium opacity-80 hover:opacity-100"
                }`}
              >
                <Icon
                  className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isSelected ? "text-stsn-gold" : "text-stone-400 group-hover:text-stone-200"}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] leading-none">{item.label}</p>
                  <p
                    className={`text-[9.5px] font-normal truncate mt-0.5 leading-none ${isSelected ? "text-stsn-gold-light/70" : "text-stone-500"}`}
                  >
                    {item.desc}
                  </p>
                </div>
                {isSelected && (
                  <div className="w-1.5 h-1.5 rounded-full bg-stsn-gold flex-shrink-0 mt-1.5 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

      </aside>

      {/* ============ MAIN AREA ============ */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* TOP HEADER */}
        <header className="header-gradient px-6 py-3 flex justify-between items-center z-20 flex-shrink-0 border-b border-stsn-gold/10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="lg:hidden p-1.5 hover:bg-stone-100 rounded-lg text-stone-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <span className="text-[9px] text-stone-400 uppercase font-mono tracking-widest block font-bold">
                STSN Connect
              </span>
              <h2 className="text-xs font-display font-black text-stsn-brown uppercase">
                Unified Philippine K-12 & Tertiary Academics
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Global Search trigger */}
            <button
              onClick={() => setGlobalSearchOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-stone-50 to-white border border-stone-200/70 rounded-xl text-stone-500 hover:border-stsn-gold/40 hover:bg-stsn-cream/60 transition-all shadow-sm cursor-pointer text-xs font-semibold"
              title="Global Search (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-stone-400">Search</span>
              <kbd className="hidden md:inline text-[9px] font-mono px-1.5 py-px rounded bg-stone-100 border border-stone-200 text-stone-400 leading-none">⌘K</kbd>
            </button>

            {/* Clock */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-stone-50 to-white border border-stone-200/60 rounded-xl text-stone-600 shadow-sm">
              <Clock className="w-4 h-4 text-stsn-gold" />
              <span className="text-xs font-mono font-bold">
                {currentTime || "12:00:00"}
              </span>
            </div>

            {/* Notification Bell */}
            <NotificationBell />

            {/* User profile */}
            <UserProfileDropdown />
          </div>
        </header>
        <BreadcrumbBar crumbs={breadcrumbs} />
        <UrgentAnnouncementBanner />

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-gradient-to-br from-stsn-cream via-[#FAF6EE] to-[#F5F0E8]">
          {activeModule === "DASHBOARD" &&
            allowedModules.includes("DASHBOARD") && (
              <Dashboard onViewStudentList={() => setActiveModule("REGISTRAR")} />
            )}
          {activeModule === "ACTION_CENTER" &&
            allowedModules.includes("ACTION_CENTER") && (
              <ActionCenterPage onNavigate={handleActionCenterNavigate} />
            )}
          {activeModule === "REGISTRAR" &&
            allowedModules.includes("REGISTRAR") && <RegistrarModule />}
          {activeModule === "REGISTRAR_REPORTS" &&
            allowedModules.includes("REGISTRAR_REPORTS") && <RegistrarReportsPage />}
          {activeModule === "ACCOUNTING" &&
            allowedModules.includes("ACCOUNTING") && (
              <AccountingModule subPage={accountingSubPage} onSubPageChange={setAccountingSubPage} />
            )}
          {activeModule === "GRADING" && allowedModules.includes("GRADING") && (
            <GradingModule />
          )}
          {activeModule === "CURRICULUM" &&
            allowedModules.includes("CURRICULUM") && <CurriculumManagement />}
          {activeModule === "STUDENT_DIRECTORY" &&
            allowedModules.includes("STUDENT_DIRECTORY") && (
              <StudentDirectoryPage
                onNavigate={(subPage, studentId) => {
                  setPortalSubPage(subPage);
                  setPortalStudentId(studentId);
                  setActiveModule("STUDENT_PORTAL");
                }}
              />
            )}
          {activeModule === "STUDENT_PORTAL" &&
            allowedModules.includes("STUDENT_PORTAL") && <StudentPortal subPage={portalSubPage} initialStudentId={portalStudentId} />}
          {activeModule === "FACULTY_ADMIN" &&
            allowedModules.includes("FACULTY_ADMIN") && (
              <FacultyAdminPage />
            )}
          {activeModule === "FACULTY_PORTAL" &&
            allowedModules.includes("FACULTY_PORTAL") && (
              <FacultyPortal />
            )}
          {activeModule === "HR_MANAGEMENT" &&
            allowedModules.includes("HR_MANAGEMENT") && (
              <HRManagement subPage={hrSubPage} onSubPageChange={setHrSubPage} />
            )}
          {activeModule === "PAYROLL_DASHBOARD" &&
            allowedModules.includes("PAYROLL_DASHBOARD") && (
              <PayrollDashboardPage />
            )}
          {activeModule === "ACCOUNTING_DASHBOARD" &&
            allowedModules.includes("ACCOUNTING_DASHBOARD") && (
              <AccountingDashboardPage />
            )}
          {activeModule === "PAYROLL_MANAGEMENT" &&
            allowedModules.includes("PAYROLL_MANAGEMENT") && (
              <PayrollModulePage subPage={payrollSubPage} />
            )}
          {activeModule === "ACCOUNTS_SECURITY" &&
            allowedModules.includes("ACCOUNTS_SECURITY") && (
              <AccountsManagement subPage={accountsSubPage} onSubPageChange={setAccountsSubPage} />
            )}
          {activeModule === "CORE_SETUP" &&
            allowedModules.includes("CORE_SETUP") && <CoreSetupModule initialCategoryKey={coreSetupSubPage} />}
          {activeModule === "SCHEDULING" &&
            allowedModules.includes("SCHEDULING") && <SchedulingModule />}
          {activeModule === "CLASS_SECTIONING" &&
            allowedModules.includes("CLASS_SECTIONING") && (
              <ClassSectioningModule />
            )}
          {activeModule === "ONLINE_LEARNING" &&
            allowedModules.includes("ONLINE_LEARNING") && <OnlineLearning />}
          {activeModule === "BOOKS_SETUP" &&
            allowedModules.includes("BOOKS_SETUP") && <BooksSetupPage />}
          {activeModule === "CASHIER" &&
            allowedModules.includes("CASHIER") && <CashierModule subPage={cashierSubPage} onSubPageChange={setCashierSubPage} />}
          {activeModule === "NURSE_CLINIC" &&
            allowedModules.includes("NURSE_CLINIC") && <ClinicModule />}
          {activeModule === "GUIDANCE" &&
            allowedModules.includes("GUIDANCE") && <GuidanceModule />}
          {activeModule === "GUIDANCE_REPORTS" &&
            allowedModules.includes("GUIDANCE_REPORTS") && <GuidanceReportsPage />}
          {activeModule === "CLINIC_REPORTS" &&
            allowedModules.includes("CLINIC_REPORTS") && <ClinicReportsPage />}
          {activeModule === "ADMIN_REPORTS" &&
            allowedModules.includes("ADMIN_REPORTS") && <AdminReportsPage />}
          {activeModule === "CONSULTATION" &&
            allowedModules.includes("CONSULTATION") && <ConsultationModule />}
          {activeModule === "GUARDIAN_PORTAL" &&
            allowedModules.includes("GUARDIAN_PORTAL") && <GuardianPortalPage />}
          {(!allowedModules.includes(activeModule) || !renderedModuleIds.includes(activeModule)) && (
            <div className="rounded-xl border border-stone-200 bg-white/80 p-6 shadow-sm">
              <p className="text-xs font-mono uppercase tracking-widest text-stsn-gold mb-2">
                Module unavailable
              </p>
              <h2 className="text-lg font-display font-bold text-stsn-brown-dark">
                This page is not available for your current access.
              </h2>
              <p className="text-sm text-stone-600 mt-2">
                Select another module from the sidebar or ask an administrator to review your permissions.
              </p>
            </div>
          )}
        </main>
        {hasMobileBottomNav(currentUser.role) && (
          <MobileBottomNav
            role={currentUser.role}
            activeModule={activeModule}
            activeSubPage={
              activeModule === "STUDENT_PORTAL" ? portalSubPage
              : activeModule === "CASHIER" ? cashierSubPage
              : activeModule === "PAYROLL_MANAGEMENT" ? payrollSubPage
              : activeModule === "HR_MANAGEMENT" ? hrSubPage
              : null
            }
            onNavigate={(module, subPage) => {
              setActiveModule(module);
              if (subPage) {
                if (module === "CASHIER") setCashierSubPage(subPage);
                else if (module === "HR_MANAGEMENT") setHrSubPage(subPage);
                else if (module === "STUDENT_PORTAL") setPortalSubPage(subPage);
                else if (module === "PAYROLL_MANAGEMENT") setPayrollSubPage(subPage);
              }
              setIsMobileOpen(false);
            }}
          />
        )}
      </div>

      {/* MOBILE DRAWER */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex animate-fade-in font-sans">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative w-72 sidebar-gradient text-stsn-cream flex flex-col p-5 animate-slide-in">
            <div className="flex justify-between items-center pb-4 border-b border-white/8 mb-4">
              <h2 className="font-display font-extrabold text-stsn-gold">
                STSN Connect
              </h2>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="text-white text-xs font-bold underline cursor-pointer"
              >
                Close
              </button>
            </div>
            <nav className="space-y-1 flex-1 overflow-y-auto pb-4">
              {renderedSidebarItems.map((item) => {
                const isCategoryGroup = item.children?.some((c) => c.targetModule) ?? false;
                const isSelected = isCategoryGroup
                  ? activeModule === item.id || (item.children?.some((c) => c.targetModule === activeModule) ?? false)
                  : activeModule === item.id;
                const isExpanded = expandedModule === item.id ||
                  (isCategoryGroup && (item.children?.some((c) => c.targetModule === activeModule) ?? false));
                if (item.children) {
                  return (
                    <div key={item.id}>
                      <button
                        onClick={() => {
                          if (!isCategoryGroup) setActiveModule(item.id);
                          setExpandedModule(isExpanded ? null : item.id);
                        }}
                        className={`w-full text-left px-3 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-between ${
                          isSelected ? "sidebar-item-active text-stsn-cream" : "text-stone-300 hover:bg-white/8"
                        }`}
                      >
                        <span>{item.label}</span>
                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      </button>
                      {isExpanded && (
                        <div className="ml-3 pl-2 border-l border-white/10 mt-0.5 space-y-0.5">
                          {item.children.map((child) => {
                            if (child.isSection) {
                              return (
                                <div
                                  key={child.id}
                                  className="px-2.5 pt-3 pb-1 text-[8px] font-mono uppercase tracking-widest text-stsn-gold/60"
                                >
                                  {child.label}
                                </div>
                              );
                            }
                            if (child.children?.length) {
                              const isAccountingGroupActive = item.id === "ACCOUNTING" && child.children.some((subChild) => subChild.id === accountingSubPage);
                              const isAccountingGroupExpanded = expandedAccountingGroups.includes(child.id) || isAccountingGroupActive;
                              return (
                                <div key={child.id}>
                                  <button
                                    onClick={() => {
                                      setExpandedAccountingGroups((groups) =>
                                        groups.includes(child.id)
                                          ? groups.filter((id) => id !== child.id)
                                          : [...groups, child.id],
                                      );
                                    }}
                                    className={`w-full text-left px-2.5 py-2 text-[11px] rounded-lg transition-all flex items-center justify-between ${
                                      isAccountingGroupActive
                                        ? "bg-stsn-gold/15 text-stsn-cream font-semibold"
                                        : "text-stone-400 hover:bg-white/6"
                                    }`}
                                  >
                                    <span>{child.label}</span>
                                    {isAccountingGroupExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                  </button>
                                  {isAccountingGroupExpanded && (
                                    <div className="ml-3 pl-2 border-l border-white/10 mt-0.5 space-y-0.5">
                                      {child.children.map((subChild) => {
                                        const isSubChildActive = item.id === "ACCOUNTING" && accountingSubPage === subChild.id;
                                        return (
                                          <button
                                            key={subChild.id}
                                            onClick={() => {
                                              setActiveModule(item.id);
                                              setAccountingSubPage(subChild.id);
                                              setIsMobileOpen(false);
                                            }}
                                            className={`w-full text-left px-2.5 py-1.5 text-[10.5px] rounded-lg transition-all ${
                                              isSubChildActive
                                                ? "bg-stsn-gold/20 text-stsn-cream font-semibold"
                                                : "text-stone-400 hover:bg-white/6"
                                            }`}
                                          >
                                            {subChild.label}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            }
                            const isChildActive = child.targetModule
                              ? activeModule === child.targetModule && (child.targetModule !== "CORE_SETUP" || coreSetupSubPage === child.id)
                              : isSelected && (item.id === "STUDENT_PORTAL" ? portalSubPage === child.id : item.id === "HR_MANAGEMENT" ? hrSubPage === child.id : item.id === "PAYROLL_MANAGEMENT" ? payrollSubPage === child.id : item.id === "CASHIER" ? cashierSubPage === child.id : item.id === "ACCOUNTS_SECURITY" ? accountsSubPage === child.id : accountingSubPage === child.id);
                            return (
                              <button
                                key={child.id}
                                onClick={() => {
                                  if (child.targetModule) {
                                    setActiveModule(child.targetModule);
                                    if (child.targetModule === "CORE_SETUP") {
                                      setCoreSetupSubPage(child.id);
                                    }
                                  } else {
                                    setActiveModule(item.id);
                                    if (item.id === "STUDENT_PORTAL") {
                                      setPortalSubPage(child.id);
                                    } else if (item.id === "HR_MANAGEMENT") {
                                      setHrSubPage(child.id);
                                    } else if (item.id === "PAYROLL_MANAGEMENT") {
                                      setPayrollSubPage(child.id);
                                    } else if (item.id === "CASHIER") {
                                      setCashierSubPage(child.id);
                                    } else if (item.id === "ACCOUNTS_SECURITY") {
                                      setAccountsSubPage(child.id as "user-security" | "delegation-management" | "audit-log");
                                    } else {
                                      setAccountingSubPage(child.id);
                                    }
                                  }
                                  setIsMobileOpen(false);
                                }}
                                className={`w-full text-left px-2.5 py-2 text-[11px] rounded-lg transition-all ${
                                  isChildActive
                                    ? "bg-stsn-gold/20 text-stsn-cream font-semibold"
                                    : "text-stone-400 hover:bg-white/6"
                                }`}
                              >
                                {child.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveModule(item.id);
                      setIsMobileOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 text-xs font-bold rounded-xl transition-all ${
                      isSelected ? "sidebar-item-active text-stsn-cream" : "text-stone-300 hover:bg-white/8"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
            <button
              onClick={() => logout()}
              className="w-full bg-white/5 hover:bg-black/20 text-xs py-2.5 rounded-xl text-stone-300 font-bold border border-white/8"
            >
              Exit Session
            </button>
          </div>
        </div>
      )}
      <GlobalSearch open={globalSearchOpen} onClose={() => setGlobalSearchOpen(false)} />
    </div>
  );
}

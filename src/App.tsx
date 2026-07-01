/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  type NavSubItem,
  type NavItem,
} from "./config/navigation.config";
import {
  getDefaultRouteForRole,
  getFirstAllowedRoute,
  getPathForModule,
  resolveAppRoute,
} from "./config/app-routes.config";

// Components
import LoginOverlay from "./components/LoginOverlay";
import NotificationBell, {
  UrgentAnnouncementBanner,
} from "./components/common/NotificationBell";
import UserProfileDropdown from "./components/common/UserProfileDropdown";
import BreadcrumbBar, {
  type BreadcrumbCrumb,
} from "./components/common/BreadcrumbBar";
import MobileBottomNav, {
  hasMobileBottomNav,
} from "./components/common/MobileBottomNav";
import type { NavigateTarget } from "./components/common/ApprovalInbox";
import AppModuleRenderer from "./components/layout/AppModuleRenderer";

// Hooks
import { usePendingCounts } from "./hooks/usePendingCounts";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { usePermissions } from "./hooks/usePermissions";

const APP_SIDEBAR_WIDTH_CLASS = "w-[280px] min-w-[280px] max-w-[280px]";
const GlobalSearch = lazy(() => import("./components/common/GlobalSearch"));

function PendingBadge({
  count,
  small = false,
}: {
  count: number;
  small?: boolean;
}) {
  if (count <= 0) return null;
  return (
    <span
      className={`flex-shrink-0 font-mono font-bold rounded-full bg-stsn-gold text-stsn-brown-deep text-center leading-none ${
        small
          ? "text-[8px] px-1 py-px min-w-[15px]"
          : "text-[9px] px-1.5 py-0.5 min-w-[18px]"
      }`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default function App() {
  const {
    currentUser,
    logout,
    activeSchool,
    academicUnit,
    isLoading,
    initialize,
    effectivePermissions,
  } = useSTSNStore();
  const location = useLocation();
  const navigate = useNavigate();
  const counts = usePendingCounts();
  const { hasPageAccess } = usePermissions();
  const currentRole = currentUser?.role ?? "SUPER_ADMIN";
  const [expandedModule, setExpandedModule] = useState<STSNModule | null>(
    "DASHBOARD",
  );
  const [expandedAccountingGroups, setExpandedAccountingGroups] = useState<
    string[]
  >([]);
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

  const currentRoute = useMemo(
    () => resolveAppRoute(location.pathname, location.search),
    [location.pathname, location.search],
  );

  const activeModule: STSNModule = currentRoute?.module ?? "DASHBOARD";
  const accountingSubPage =
    activeModule === "ACCOUNTING"
      ? (currentRoute?.subPage ?? "dashboard")
      : "dashboard";
  const coreSetupSubPage =
    activeModule === "CORE_SETUP"
      ? (currentRoute?.subPage ?? "academic_categories")
      : "academic_categories";
  const portalSubPage =
    activeModule === "STUDENT_PORTAL"
      ? (currentRoute?.subPage ?? "overview")
      : "overview";
  const facultySubPage =
    activeModule === "FACULTY_PORTAL"
      ? (currentRoute?.subPage ?? "overview-advisory")
      : "overview-advisory";
  const hrSubPage =
    activeModule === "HR_MANAGEMENT"
      ? (currentRoute?.subPage ?? "hr-dashboard")
      : "hr-dashboard";
  const payrollSubPage =
    activeModule === "PAYROLL_MANAGEMENT"
      ? (currentRoute?.subPage ?? "payroll-management")
      : "payroll-management";
  const cashierSubPage =
    activeModule === "CASHIER" ? (currentRoute?.subPage ?? "queue") : "queue";
  const accountsSubPage =
    activeModule === "ACCOUNTS_SECURITY"
      ? ((currentRoute?.subPage as
          | "user-security"
          | "page-assignment"
          | "delegation-management"
          | "audit-log"
          | undefined) ?? "user-security")
      : "user-security";
  const portalStudentId =
    activeModule === "STUDENT_PORTAL" ? currentRoute?.studentId : undefined;

  // Derive breadcrumb from active module / sub-page state
  const breadcrumbs = (() => {
    const crumbs: BreadcrumbCrumb[] = [];
    const moduleLabel: Partial<Record<string, string>> = {
      MY_PROFILE: "My Profile",
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
      FACULTY_PORTAL: "Teacher Board",
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
      "overview-advisory": "Overview & Advisory",
      "class-schedule-subjects": "Class Schedule & Subjects",
      "attendance-monitoring": "Attendance Monitoring",
      "student-grades-encoding": "Student Grades Encoding",
      "faculty-profile": "Faculty Profile",
      "new-employee-profile": "New Employee Profile",
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
      activeModule === "ACCOUNTING"
        ? accountingSubPage
        : activeModule === "FACULTY_PORTAL"
          ? facultySubPage
        : activeModule === "HR_MANAGEMENT"
          ? hrSubPage
          : activeModule === "PAYROLL_MANAGEMENT"
            ? payrollSubPage
            : activeModule === "CASHIER"
              ? cashierSubPage
              : activeModule === "ACCOUNTS_SECURITY"
                ? accountsSubPage
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
    Escape: () => setGlobalSearchOpen(false),
  });

  // When the RBAC catalog is loaded (not fallback), drive nav + module access
  // from the user's effective module set; otherwise keep the legacy role map.
  const moduleOverride =
    effectivePermissions && !effectivePermissions.fallback
      ? (Array.from(effectivePermissions.modules) as STSNModule[])
      : undefined;

  const allowedModules = getAllowedModules(
    currentRole,
    academicUnit,
    moduleOverride,
  );
  const sidebarMode = SIDEBAR_MODE[currentRole];

  const renderedSidebarItems = useMemo(() => {
    const pruneEmptySections = (children: NavSubItem[]): NavSubItem[] => {
      const output: NavSubItem[] = [];
      for (let index = 0; index < children.length; index += 1) {
        const child = children[index];
        if (!child.isSection) {
          output.push(child);
          continue;
        }
        const hasFollowingContent = children
          .slice(index + 1)
          .some((candidate) => !candidate.isSection);
        if (hasFollowingContent) output.push(child);
      }
      return output;
    };

    const filterChildren = (
      moduleKey: STSNModule,
      children: NavSubItem[],
    ): NavSubItem[] => {
      const filtered = children.flatMap((child) => {
        if (child.isSection) return [child];
        if (child.targetModule) return [child];
        if (child.children?.length) {
          const nested = filterChildren(moduleKey, child.children);
          return nested.length > 0 ? [{ ...child, children: pruneEmptySections(nested) }] : [];
        }
        return hasPageAccess(moduleKey, child.id) ? [child] : [];
      });
      return pruneEmptySections(filtered);
    };

    return getNavItemsForRole(currentRole, academicUnit, moduleOverride).map(
      (item): NavItem => {
        if (!item.children?.length) return item;
        const filteredChildren = filterChildren(item.id, item.children);
        if (filteredChildren.length === 0) {
          return { ...item, children: undefined };
        }
        return { ...item, children: filteredChildren };
      },
    );
  }, [academicUnit, currentRole, hasPageAccess, moduleOverride]);

  // First menu item the current user can actually open, derived from the
  // RBAC-filtered sidebar. Used as the post-login landing route so a new user
  // never inherits the previous user's page. Null when no module is accessible.
  const firstAllowedRoute = useMemo(
    () => getFirstAllowedRoute(renderedSidebarItems),
    [renderedSidebarItems],
  );

  // When logged out, drop any previous-user route so the next login starts
  // from a neutral path ("/") instead of the stale page still in the URL.
  useEffect(() => {
    if (currentUser || isLoading) return;
    if (location.pathname !== "/") {
      navigate("/", { replace: true });
    }
  }, [currentUser, isLoading, location.pathname, navigate]);

  // Keep the URL in sync with the signed-in user's access. On login (URL reset
  // to "/" by logout, so currentRoute is null) this lands the user on their
  // first allowed menu item — never the previous user's page. Known, still-valid
  // deep links are preserved so hard refresh and direct-URL RBAC keep working.
  useEffect(() => {
    if (!currentUser || isLoading) return;

    const defaultTarget =
      firstAllowedRoute ?? getDefaultRouteForRole(currentUser.role);
    const targetPath =
      currentRoute === null
        ? defaultTarget
        : currentRoute.isKnownPath
          ? currentRoute.canonicalPath
          : defaultTarget;

    const currentFullPath = `${location.pathname}${location.search}`;
    if (currentFullPath !== targetPath) {
      navigate(targetPath, { replace: true });
    }
  }, [
    currentUser,
    currentRoute,
    firstAllowedRoute,
    isLoading,
    location.pathname,
    location.search,
    navigate,
  ]);

  if (!currentUser) return <LoginOverlay />;

  const navigateToModule = (
    module: STSNModule,
    subPage?: string,
    studentId?: string,
  ) => {
    navigate(getPathForModule(module, { subPage, studentId }));
  };

  const navigateForModuleItem = (module: STSNModule, childId: string) => {
    if (module === "STUDENT_PORTAL") {
      navigateToModule(module, childId);
    } else if (module === "FACULTY_PORTAL") {
      navigateToModule(module, childId);
    } else if (module === "HR_MANAGEMENT") {
      navigateToModule(module, childId);
    } else if (module === "PAYROLL_MANAGEMENT") {
      navigateToModule(module, childId);
    } else if (module === "CASHIER") {
      navigateToModule(module, childId);
    } else if (module === "ACCOUNTS_SECURITY") {
      navigateToModule(module, childId);
    } else {
      navigateToModule(module, childId);
    }
  };

  const getBadgeCount = (moduleId: STSNModule, childId?: string): number => {
    if (!currentUser) return 0;
    const role = currentUser.role;
    if (moduleId === "ACTION_CENTER") return counts.totalForRole;
    switch (role) {
      case "ACCOUNTING":
        if (moduleId !== "ACCOUNTING") return 0;
        if (!childId)
          return counts.pendingAssessments + counts.pendingDiscounts;
        if (childId === "accounting-student-accounts")
          return counts.pendingAssessments + counts.pendingDiscounts;
        if (childId === "billing") return counts.pendingAssessments;
        if (childId === "discounts") return counts.pendingDiscounts;
        return 0;
      case "REGISTRAR":
        if (moduleId !== "REGISTRAR") return 0;
        if (!childId || childId === "enrollment")
          return counts.pendingEnrollments + counts.pendingApplications;
        return 0;
      case "HR":
        if (moduleId !== "HR_MANAGEMENT") return 0;
        if (
          !childId ||
          childId === "hr-time-attendance" ||
          childId === "leave-management"
        )
          return counts.pendingLeaves;
        return 0;
      case "PAYROLL":
        if (moduleId !== "PAYROLL_MANAGEMENT") return 0;
        if (!childId || childId === "payroll-management")
          return counts.pendingPayrollRuns;
        return 0;
      case "PRINCIPAL":
        if (moduleId !== "REGISTRAR") return 0;
        if (!childId || childId === "grades-directory")
          return counts.pendingGrades;
        return 0;
      case "SUPER_ADMIN":
      case "ADMIN":
        if (moduleId === "ACCOUNTING") {
          if (!childId)
            return counts.pendingAssessments + counts.pendingDiscounts;
          if (childId === "accounting-student-accounts")
            return counts.pendingAssessments + counts.pendingDiscounts;
          if (childId === "billing") return counts.pendingAssessments;
          if (childId === "discounts") return counts.pendingDiscounts;
        }
        if (moduleId === "REGISTRAR") {
          if (!childId)
            return (
              counts.pendingEnrollments +
              counts.pendingApplications +
              counts.pendingGrades
            );
          if (childId === "enrollment")
            return counts.pendingEnrollments + counts.pendingApplications;
          if (childId === "grades-directory") return counts.pendingGrades;
        }
        if (moduleId === "HR_MANAGEMENT") {
          if (
            !childId ||
            childId === "hr-time-attendance" ||
            childId === "leave-management"
          )
            return counts.pendingLeaves;
        }
        if (moduleId === "PAYROLL_MANAGEMENT") {
          if (!childId || childId === "payroll-management")
            return counts.pendingPayrollRuns;
        }
        return 0;
      default:
        return 0;
    }
  };

  const handleActionCenterNavigate = (target: NavigateTarget) => {
    navigateToModule(target.module, target.subPage);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stsn-cream text-stsn-text font-sans">
        <div className="flex flex-col items-center gap-3">
          <GraduationCap className="w-10 h-10 text-stsn-gold animate-pulse" />
          <p className="text-sm text-stone-500">Loading Theresian Connect…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell min-h-screen flex text-stsn-text font-sans antialiased overflow-hidden h-screen">
      {/* ============ SIDEBAR ============ */}
      <aside
        className={`app-shell-sidebar hidden lg:flex flex-col h-full flex-shrink-0 relative ${APP_SIDEBAR_WIDTH_CLASS}`}
      >
        {/* Top gold accent line */}
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-stsn-brown-dark via-stsn-gold to-stsn-brown-dark opacity-90" />

        {/* Brand Header */}
        <div
          className={`app-shell-sidebar-header border-b border-white/8 mt-[3px] flex items-center gap-3 ${sidebarMode === "minimal" ? "p-3 justify-center" : "px-5 py-5"}`}
        >
          <div
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-stsn-gold/30 to-stsn-brown border border-stsn-gold/40 flex items-center justify-center shadow-lg flex-shrink-0"
            title="Theresian Connect"
          >
            <Building2 className="w-5 h-5 text-stsn-gold" />
          </div>
          {sidebarMode !== "minimal" && (
            <div>
              <h1 className="font-display font-extrabold text-stsn-gold leading-none tracking-tight text-md">
                Theresian <span className="text-stsn-gold-light">Connect</span>
              </h1>
              <span className="text-[9px] text-slate-300 font-mono tracking-widest uppercase mt-0.5 block">
                Academia Enterprise v2
              </span>
            </div>
          )}
        </div>

        {/* School badges — hidden in minimal mode */}
        {sidebarMode !== "minimal" && (
          <div className="px-4 py-3 space-y-2 border-b border-white/5">
            <div
              className={`app-shell-school-card flex items-center gap-1.5 px-2.5 py-2 rounded-xl border transition-all ${
                activeSchool === "STSN" || activeSchool === "ALL"
                  ? "app-shell-school-card-active bg-white/10 border-stsn-gold/30"
                  : "bg-white/5 border-white/8"
              }`}
            >
              <School className="w-3 h-3 text-stsn-gold flex-shrink-0" />
              <span className="text-[8.5px] font-mono text-slate-100 truncate flex-1">
                St. Theresa's School of Novaliches
              </span>
              {(activeSchool === "STSN" || activeSchool === "ALL") && (
                <span className="w-1.5 h-1.5 rounded-full bg-stsn-gold animate-pulse flex-shrink-0" />
              )}
            </div>
            <div
              className={`app-shell-school-card flex items-center gap-1.5 px-2.5 py-2 rounded-xl border transition-all ${
                activeSchool === "CDSTA" || activeSchool === "ALL"
                  ? "app-shell-school-card-active bg-sky-400/12 border-sky-300/28"
                  : "bg-white/5 border-white/8"
              }`}
            >
              <GraduationCap className="w-3 h-3 text-sky-300 flex-shrink-0" />
              <span className="text-[8.5px] font-mono text-sky-100 truncate flex-1">
                Colegio de Sta. Teresa de Avila
              </span>
              {(activeSchool === "CDSTA" || activeSchool === "ALL") && (
                <span className="w-1.5 h-1.5 rounded-full bg-sky-300 animate-pulse flex-shrink-0" />
              )}
            </div>
            {activeSchool !== "ALL" && (
              <div className="px-2.5 py-1 text-center">
                <span className="text-[8px] font-mono text-stsn-gold/60 uppercase tracking-widest">
                  Viewing:{" "}
                  {activeSchool === "STSN" ? "STSN Data" : "CDSTA Data"}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav
          className={`app-shell-nav flex-1 space-y-1 py-4 overflow-y-auto ${sidebarMode === "minimal" ? "px-2" : "px-3"}`}
        >
          {renderedSidebarItems.map((item) => {
            const isSelected = activeModule === item.id;
            const isExpanded = expandedModule === item.id;
            const Icon = item.icon;

            // Minimal mode: icon-only rail, no children expansion
            if (sidebarMode === "minimal") {
              const isActive =
                activeModule === item.id ||
                (item.children?.some((c) => c.targetModule === activeModule) ??
                  false);
              return (
                <button
                  key={item.id}
                  title={item.label}
                  onClick={() => {
                    const firstChildModule = item.children?.find(
                      (c) => c.targetModule,
                    )?.targetModule;
                    navigateToModule(firstChildModule ?? item.id);
                    setExpandedModule(null);
                    setIsMobileOpen(false);
                  }}
                  className={`app-shell-nav-item w-full flex items-center justify-center py-3 rounded-2xl transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "sidebar-item-active app-shell-nav-item-active text-stsn-cream shadow-md"
                      : "text-stone-400 opacity-80 hover:opacity-100"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${isActive ? "text-stsn-gold" : ""}`}
                  />
                </button>
              );
            }

            if (item.children) {
              const isCategoryGroup = item.children.some((c) => c.targetModule);
              const isSelectedGroup = isCategoryGroup
                ? activeModule === item.id ||
                  item.children.some((c) => c.targetModule === activeModule)
                : isSelected;
              const isExpandedGroup = expandedModule === item.id;

              return (
                <div key={item.id}>
                  {/* Parent row — toggles expansion; category groups do not navigate on click */}
                  <button
                    onClick={() => {
                      if (!isCategoryGroup) navigateToModule(item.id);
                      setExpandedModule(isExpandedGroup ? null : item.id);
                      setIsMobileOpen(false);
                    }}
                    className={`app-shell-nav-item w-full text-left py-3 px-3.5 rounded-2xl flex items-start gap-3 transition-all duration-200 cursor-pointer group ${
                      isSelectedGroup
                        ? "sidebar-item-active app-shell-nav-item-active text-stsn-cream font-bold shadow-md"
                        : "text-stone-300 font-medium opacity-80 hover:opacity-100"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isSelectedGroup ? "text-stsn-gold" : "text-stone-400 group-hover:text-stone-200"}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] leading-none">{item.label}</p>
                      <p
                        className={`text-[9.5px] font-normal truncate mt-0.5 leading-none ${isSelectedGroup ? "text-stsn-gold-light/70" : "text-stone-500"}`}
                      >
                        {item.desc}
                      </p>
                    </div>
                    {getBadgeCount(item.id) > 0 && (
                      <PendingBadge count={getBadgeCount(item.id)} />
                    )}
                    {isExpandedGroup ? (
                      <ChevronDown className="w-3 h-3 flex-shrink-0 mt-1 text-stsn-gold/70" />
                    ) : (
                      <ChevronRight className="w-3 h-3 flex-shrink-0 mt-1 text-stone-500 group-hover:text-stone-300" />
                    )}
                  </button>

                  {/* Children */}
                  {isExpandedGroup && (
                    <div className="app-shell-nav-nested mt-1 ml-2 pl-3.5 border-l border-white/10 space-y-1">
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
                          const activeSubPage = isHRModule
                            ? hrSubPage
                            : accountingSubPage;
                          const expandedGroups = isHRModule
                            ? expandedHRGroups
                            : expandedAccountingGroups;
                          const isGroupActive = child.children.some(
                            (subChild) => subChild.id === activeSubPage,
                          );
                          const isGroupExpanded =
                            expandedGroups.includes(child.id) || isGroupActive;
                          const GroupIcon = child.icon;
                          return (
                            <div key={child.id}>
                              <button
                                onClick={() => {
                                  if (isHRModule) {
                                    setExpandedHRGroups((groups: string[]) =>
                                      groups.includes(child.id)
                                        ? groups.filter(
                                            (id: string) => id !== child.id,
                                          )
                                        : [...groups, child.id],
                                    );
                                  } else {
                                    setExpandedAccountingGroups(
                                      (groups: string[]) =>
                                        groups.includes(child.id)
                                          ? groups.filter(
                                              (id: string) => id !== child.id,
                                            )
                                          : [...groups, child.id],
                                    );
                                  }
                                }}
                                className={`app-shell-nav-child w-full text-left py-2.5 px-3 rounded-xl flex items-start gap-2.5 transition-all duration-150 cursor-pointer group ${
                                  isGroupActive
                                    ? "app-shell-nav-child-active bg-stsn-gold/15 text-stsn-cream font-semibold"
                                    : "text-stone-400 font-medium opacity-80 hover:opacity-100"
                                }`}
                              >
                                {GroupIcon && (
                                  <GroupIcon
                                    className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${isGroupActive ? "text-stsn-gold" : "text-stone-500 group-hover:text-stone-300"}`}
                                  />
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="text-[11px] leading-none">
                                    {child.label}
                                  </p>
                                  <p
                                    className={`text-[9px] font-normal truncate mt-0.5 leading-none ${isGroupActive ? "text-stsn-gold-light/60" : "text-stone-600"}`}
                                  >
                                    {child.desc ?? ""}
                                  </p>
                                </div>
                                {getBadgeCount(item.id, child.id) > 0 && (
                                  <PendingBadge
                                    count={getBadgeCount(item.id, child.id)}
                                    small
                                  />
                                )}
                                {isGroupExpanded ? (
                                  <ChevronDown className="w-3 h-3 flex-shrink-0 mt-0.5 text-stsn-gold/70" />
                                ) : (
                                  <ChevronRight className="w-3 h-3 flex-shrink-0 mt-0.5 text-stone-500 group-hover:text-stone-300" />
                                )}
                              </button>

                              {isGroupExpanded && (
                                <div className="app-shell-nav-nested ml-4 mt-1 pl-2.5 border-l border-white/10 space-y-1">
                                  {child.children.map((subChild) => {
                                    const isSubChildActive =
                                      activeSubPage === subChild.id;
                                    const SubChildIcon = subChild.icon;
                                    return (
                                      <button
                                        key={subChild.id}
                                        onClick={() => {
                                          navigateToModule(
                                            item.id,
                                            subChild.id,
                                          );
                                          setIsMobileOpen(false);
                                        }}
                                        className={`app-shell-nav-child w-full text-left py-2 px-2.5 rounded-xl flex items-start gap-2 transition-all duration-150 cursor-pointer group ${
                                          isSubChildActive
                                            ? "app-shell-nav-child-active bg-stsn-gold/20 text-stsn-cream font-semibold"
                                            : "text-stone-400 font-medium opacity-80 hover:opacity-100"
                                        }`}
                                      >
                                        {SubChildIcon && (
                                          <SubChildIcon
                                            className={`w-3 h-3 mt-0.5 flex-shrink-0 ${isSubChildActive ? "text-stsn-gold" : "text-stone-500 group-hover:text-stone-300"}`}
                                          />
                                        )}
                                        <div className="min-w-0 flex-1">
                                          <p className="text-[10.5px] leading-none">
                                            {subChild.label}
                                          </p>
                                          <p
                                            className={`text-[8.5px] font-normal truncate mt-0.5 leading-none ${isSubChildActive ? "text-stsn-gold-light/60" : "text-stone-600"}`}
                                          >
                                            {subChild.desc ?? ""}
                                          </p>
                                        </div>
                                        {getBadgeCount(item.id, subChild.id) >
                                          0 && (
                                          <PendingBadge
                                            count={getBadgeCount(
                                              item.id,
                                              subChild.id,
                                            )}
                                            small
                                          />
                                        )}
                                        {isSubChildActive && (
                                          <div className="w-1 h-1 rounded-full bg-stsn-gold flex-shrink-0 mt-1.5" />
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        }
                        const isChildActive = child.targetModule
                          ? activeModule === child.targetModule &&
                            (child.targetModule !== "CORE_SETUP" ||
                              coreSetupSubPage === child.id)
                          : isSelected &&
                            (item.id === "STUDENT_PORTAL"
                              ? portalSubPage === child.id
                              : item.id === "FACULTY_PORTAL"
                                ? facultySubPage === child.id
                              : item.id === "HR_MANAGEMENT"
                                ? hrSubPage === child.id
                                : item.id === "PAYROLL_MANAGEMENT"
                                  ? payrollSubPage === child.id
                                  : item.id === "CASHIER"
                                    ? cashierSubPage === child.id
                                    : item.id === "ACCOUNTS_SECURITY"
                                      ? accountsSubPage === child.id
                                      : accountingSubPage === child.id);
                        const ChildIcon = child.icon;
                        return (
                          <button
                            key={child.id}
                            onClick={() => {
                              if (child.targetModule) {
                                navigateToModule(
                                  child.targetModule,
                                  child.targetModule === "CORE_SETUP"
                                    ? child.id
                                    : undefined,
                                );
                              } else {
                                navigateForModuleItem(item.id, child.id);
                              }
                              setIsMobileOpen(false);
                            }}
                            className={`app-shell-nav-child w-full text-left py-2.5 px-3 rounded-xl flex items-start gap-2.5 transition-all duration-150 cursor-pointer group ${
                              isChildActive
                                ? "app-shell-nav-child-active bg-stsn-gold/20 text-stsn-cream font-semibold"
                                : "text-stone-400 font-medium opacity-80 hover:opacity-100"
                            }`}
                          >
                            {ChildIcon && (
                              <ChildIcon
                                className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${isChildActive ? "text-stsn-gold" : "text-stone-500 group-hover:text-stone-300"}`}
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] leading-none">
                                {child.label}
                              </p>
                              <p
                                className={`text-[9px] font-normal truncate mt-0.5 leading-none ${isChildActive ? "text-stsn-gold-light/60" : "text-stone-600"}`}
                              >
                                {child.desc ?? ""}
                              </p>
                            </div>
                            {getBadgeCount(item.id, child.id) > 0 && (
                              <PendingBadge
                                count={getBadgeCount(item.id, child.id)}
                                small
                              />
                            )}
                            {isChildActive && (
                              <div className="w-1 h-1 rounded-full bg-stsn-gold flex-shrink-0 mt-1.5" />
                            )}
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
                  navigateToModule(item.id);
                  setExpandedModule(null);
                  setIsMobileOpen(false);
                }}
                className={`app-shell-nav-item w-full text-left py-3 px-3.5 rounded-2xl flex items-start gap-3 transition-all duration-200 cursor-pointer group ${
                  isSelected
                    ? "sidebar-item-active app-shell-nav-item-active text-stsn-cream font-bold shadow-md"
                    : "text-stone-300 font-medium opacity-80 hover:opacity-100"
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
      <div className="app-shell-main-column flex-1 flex flex-col h-full overflow-hidden">
        {/* TOP HEADER */}
        <header className="app-shell-topbar header-gradient z-20 flex-shrink-0 border-b border-stsn-gold/10">
          <div className="app-shell-topbar-inner">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="app-shell-utility-button lg:hidden p-2 rounded-xl text-stone-800"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <span className="text-[9px] text-slate-500 uppercase font-mono tracking-[0.24em] block font-bold">
                  Theresian Connect
                </span>
                <h2 className="truncate text-[11px] sm:text-xs font-display font-black text-stsn-brown uppercase">
                  Unified Philippine K-12 & Tertiary Academics
                </h2>
              </div>
            </div>
          </div>

          <div className="app-shell-topbar-actions">
            {/* Global Search trigger */}
            <button
              onClick={() => setGlobalSearchOpen(true)}
              className="app-shell-utility-button hidden sm:flex items-center gap-2 px-3 py-2 rounded-2xl text-slate-600 cursor-pointer text-xs font-semibold"
              title="Global Search (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-slate-600">Search</span>
              <kbd className="hidden md:inline text-[9px] font-mono px-1.5 py-px rounded bg-stone-100 border border-stone-200 text-stone-400 leading-none">
                ⌘K
              </kbd>
            </button>

            {/* Clock */}
            <div className="app-shell-utility-panel flex items-center gap-2 px-3 py-2 rounded-2xl text-stone-600 shadow-sm">
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
        <div className="app-shell-alert-slot">
          <UrgentAnnouncementBanner />
        </div>

        {/* MAIN CONTENT */}
        <main className="app-shell-main flex-1 overflow-y-auto">
          <div className="app-shell-main-inner">
            <AppModuleRenderer
              activeModule={activeModule}
              allowedModules={allowedModules}
              accountingSubPage={accountingSubPage}
              coreSetupSubPage={coreSetupSubPage}
              portalSubPage={portalSubPage}
              facultySubPage={facultySubPage}
              hrSubPage={hrSubPage}
              payrollSubPage={payrollSubPage}
              cashierSubPage={cashierSubPage}
              accountsSubPage={accountsSubPage}
              portalStudentId={portalStudentId}
              onDashboardNavigate={() => navigateToModule("REGISTRAR")}
              onActionCenterNavigate={handleActionCenterNavigate}
              onStudentDirectoryNavigate={(subPage, studentId) =>
                navigateToModule("STUDENT_PORTAL", subPage, studentId)
              }
              onAccountingSubPageChange={(subPage) =>
                navigateToModule("ACCOUNTING", subPage)
              }
              onFacultySubPageChange={(subPage) =>
                navigateToModule("FACULTY_PORTAL", subPage)
              }
              onHrSubPageChange={(subPage) =>
                navigateToModule("HR_MANAGEMENT", subPage)
              }
              onCashierSubPageChange={(subPage) =>
                navigateToModule("CASHIER", subPage)
              }
              onAccountsSubPageChange={(subPage) =>
                navigateToModule("ACCOUNTS_SECURITY", subPage)
              }
            />
          </div>
        </main>
        {hasMobileBottomNav(currentUser.role) && (
          <MobileBottomNav
            role={currentUser.role}
            activeModule={activeModule}
            activeSubPage={
              activeModule === "STUDENT_PORTAL"
                ? portalSubPage
                : activeModule === "FACULTY_PORTAL"
                  ? facultySubPage
                : activeModule === "CASHIER"
                  ? cashierSubPage
                  : activeModule === "PAYROLL_MANAGEMENT"
                    ? payrollSubPage
                    : activeModule === "HR_MANAGEMENT"
                      ? hrSubPage
                      : null
            }
            onNavigate={(module, subPage) => {
              navigateToModule(module, subPage);
              setIsMobileOpen(false);
            }}
          />
        )}
      </div>

      {/* MOBILE DRAWER */}
      {isMobileOpen && (
        <div className="app-shell-mobile-overlay lg:hidden fixed inset-0 z-50 flex animate-fade-in font-sans">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="app-shell-mobile-drawer relative w-80 max-w-[calc(100vw-2rem)] text-stsn-cream flex flex-col p-5 animate-slide-in">
            <div className="app-shell-mobile-header flex justify-between items-center pb-4 border-b border-white/8 mb-4">
              <div>
                <span className="text-[9px] text-stsn-gold/70 uppercase font-mono tracking-[0.24em] block font-bold">
                  Theresian Connect
                </span>
                <h2 className="font-display font-extrabold text-stsn-gold">
                  Navigation
                </h2>
              </div>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-white/12 bg-white/8 hover:bg-white/12 cursor-pointer"
              >
                Close
              </button>
            </div>
            <nav className="space-y-1.5 flex-1 overflow-y-auto pb-4">
              {renderedSidebarItems.map((item) => {
                const isCategoryGroup =
                  item.children?.some((c) => c.targetModule) ?? false;
                const isSelected = isCategoryGroup
                  ? activeModule === item.id ||
                    (item.children?.some(
                      (c) => c.targetModule === activeModule,
                    ) ??
                      false)
                  : activeModule === item.id;
                const isExpanded =
                  expandedModule === item.id ||
                  (isCategoryGroup &&
                    (item.children?.some(
                      (c) => c.targetModule === activeModule,
                    ) ??
                      false));
                if (item.children) {
                  return (
                    <div key={item.id}>
                      <button
                        onClick={() => {
                          if (!isCategoryGroup) navigateToModule(item.id);
                          setExpandedModule(isExpanded ? null : item.id);
                        }}
                        className={`app-shell-nav-item w-full text-left px-3.5 py-3 text-xs font-bold rounded-2xl transition-all flex items-center justify-between ${
                          isSelected
                            ? "sidebar-item-active app-shell-nav-item-active text-stsn-cream"
                            : "text-stone-300"
                        }`}
                      >
                        <span>{item.label}</span>
                        {isExpanded ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronRight className="w-3 h-3" />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="app-shell-nav-nested ml-3 pl-2.5 border-l border-white/10 mt-1 space-y-1">
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
                              const isAccountingGroupActive =
                                item.id === "ACCOUNTING" &&
                                child.children.some(
                                  (subChild) =>
                                    subChild.id === accountingSubPage,
                                );
                              const isAccountingGroupExpanded =
                                expandedAccountingGroups.includes(child.id) ||
                                isAccountingGroupActive;
                              return (
                                <div key={child.id}>
                                  <button
                                    onClick={() => {
                                      setExpandedAccountingGroups((groups) =>
                                        groups.includes(child.id)
                                          ? groups.filter(
                                              (id) => id !== child.id,
                                            )
                                          : [...groups, child.id],
                                      );
                                    }}
                                    className={`app-shell-nav-child w-full text-left px-3 py-2.5 text-[11px] rounded-xl transition-all flex items-center justify-between ${
                                      isAccountingGroupActive
                                        ? "app-shell-nav-child-active bg-stsn-gold/15 text-stsn-cream font-semibold"
                                        : "text-stone-400"
                                    }`}
                                  >
                                    <span>{child.label}</span>
                                    {isAccountingGroupExpanded ? (
                                      <ChevronDown className="w-3 h-3" />
                                    ) : (
                                      <ChevronRight className="w-3 h-3" />
                                    )}
                                  </button>
                                  {isAccountingGroupExpanded && (
                                    <div className="app-shell-nav-nested ml-3 pl-2 border-l border-white/10 mt-1 space-y-1">
                                      {child.children.map((subChild) => {
                                        const isSubChildActive =
                                          item.id === "ACCOUNTING" &&
                                          accountingSubPage === subChild.id;
                                        return (
                                          <button
                                            key={subChild.id}
                                            onClick={() => {
                                              navigateToModule(
                                                item.id,
                                                subChild.id,
                                              );
                                              setIsMobileOpen(false);
                                            }}
                                            className={`app-shell-nav-child w-full text-left px-2.5 py-2 text-[10.5px] rounded-xl transition-all ${
                                              isSubChildActive
                                                ? "app-shell-nav-child-active bg-stsn-gold/20 text-stsn-cream font-semibold"
                                                : "text-stone-400"
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
                              ? activeModule === child.targetModule &&
                                (child.targetModule !== "CORE_SETUP" ||
                                  coreSetupSubPage === child.id)
                              : isSelected &&
                                (item.id === "STUDENT_PORTAL"
                                  ? portalSubPage === child.id
                                  : item.id === "FACULTY_PORTAL"
                                    ? facultySubPage === child.id
                                  : item.id === "HR_MANAGEMENT"
                                    ? hrSubPage === child.id
                                    : item.id === "PAYROLL_MANAGEMENT"
                                      ? payrollSubPage === child.id
                                      : item.id === "CASHIER"
                                        ? cashierSubPage === child.id
                                        : item.id === "ACCOUNTS_SECURITY"
                                          ? accountsSubPage === child.id
                                          : accountingSubPage === child.id);
                            return (
                              <button
                                key={child.id}
                                onClick={() => {
                                  if (child.targetModule) {
                                    navigateToModule(
                                      child.targetModule,
                                      child.targetModule === "CORE_SETUP"
                                        ? child.id
                                        : undefined,
                                    );
                                  } else {
                                    navigateForModuleItem(item.id, child.id);
                                  }
                                  setIsMobileOpen(false);
                                }}
                                className={`app-shell-nav-child w-full text-left px-3 py-2.5 text-[11px] rounded-xl transition-all ${
                                  isChildActive
                                    ? "app-shell-nav-child-active bg-stsn-gold/20 text-stsn-cream font-semibold"
                                    : "text-stone-400"
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
                      navigateToModule(item.id);
                      setIsMobileOpen(false);
                    }}
                    className={`app-shell-nav-item w-full text-left px-3.5 py-3 text-xs font-bold rounded-2xl transition-all ${
                      isSelected
                        ? "sidebar-item-active app-shell-nav-item-active text-stsn-cream"
                        : "text-stone-300"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
            <button
              onClick={() => logout()}
              className="w-full bg-white/5 hover:bg-black/20 text-xs py-3 rounded-2xl text-stone-300 font-bold border border-white/8"
            >
              Exit Session
            </button>
          </div>
        </div>
      )}
      {globalSearchOpen && (
        <Suspense fallback={null}>
          <GlobalSearch
            open={globalSearchOpen}
            onClose={() => setGlobalSearchOpen(false)}
          />
        </Suspense>
      )}
    </div>
  );
}

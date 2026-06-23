/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useSTSNStore } from "./services/store";
import {
  GraduationCap,
  LogOut,
  Sparkles,
  Building2,
  Clock,
  Menu,
  ChevronDown,
  ChevronRight,
  School,
} from "lucide-react";

// Config
import {
  STSNModule,
  getAllowedModules,
  getNavItemsForRole,
} from "./config/navigation.config";

// Components
import LoginOverlay from "./components/LoginOverlay";
import { useAppDialog } from "./components/common/useAppDialog";

// Feature Pages
import Dashboard from "./features/dashboard/pages/DashboardPage";
import RegistrarModule from "./features/registrar/pages/RegistrarModulePage";
import AccountingModule from "./features/accounting/pages/AccountingModulePage";
import GradingModule from "./features/grading/pages/GradingModulePage";
import HRManagement from "./features/hr/pages/HRManagementPage";
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
import StudentDirectoryPage from "./features/student-directory/pages/StudentDirectoryPage";

export default function App() {
  const { currentUser, login, logout, users, activeSchool, academicUnit, isLoading, initialize } =
    useSTSNStore();
  const { toast } = useAppDialog();
  const [activeModule, setActiveModule] = useState<STSNModule>("DASHBOARD");
  const [accountingSubPage, setAccountingSubPage] = useState("dashboard");
  const [coreSetupSubPage, setCoreSetupSubPage] = useState("academic_categories");
  const [portalSubPage, setPortalSubPage] = useState("overview");
  const [portalStudentId, setPortalStudentId] = useState<string | undefined>(undefined);
  const [expandedModule, setExpandedModule] = useState<STSNModule | null>("DASHBOARD");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

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
    else if (currentUser.role === "ACCOUNTING") setActiveModule("ACCOUNTING");
    else if (currentUser.role === "CASHIER") setActiveModule("CASHIER");
    else if (currentUser.role === "GUIDANCE") setActiveModule("GUIDANCE");
    else if (currentUser.role === "NURSE") setActiveModule("NURSE_CLINIC");
    else setActiveModule("DASHBOARD");
  }, [currentUser]);

  if (!currentUser) return <LoginOverlay />;

  const allowedModules = getAllowedModules(currentUser.role, academicUnit);

  const renderedSidebarItems = getNavItemsForRole(
    currentUser.role,
    academicUnit,
  );

  const handleRoleQuickSwitch = (email: string) => {
    login(email, "");
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
      <aside className="hidden lg:flex flex-col w-[265px] h-full flex-shrink-0 relative sidebar-gradient">
        {/* Top gold accent line */}
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-stsn-brown-dark via-stsn-gold to-stsn-brown-dark opacity-90" />

        {/* Brand Header */}
        <div className="p-5 flex items-center gap-3 border-b border-white/8 mt-[3px]">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-stsn-gold/30 to-stsn-brown border border-stsn-gold/40 flex items-center justify-center shadow-lg">
            <Building2 className="w-5 h-5 text-stsn-gold" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-stsn-gold leading-none tracking-tight text-md">
              Theresian <span className="text-stsn-gold-light">Connect</span>
            </h1>
            <span className="text-[9px] text-stone-400 font-mono tracking-widest uppercase mt-0.5 block">
              Academia Enterprise v2
            </span>
          </div>
        </div>

        {/* School badges */}
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

        {/* Authenticated Staff Card */}
        <div className="px-4 pt-3 pb-2">
          <div className="bg-black/20 backdrop-blur border border-white/8 rounded-xl p-3.5">
            <span className="text-[8px] uppercase font-mono tracking-widest text-stsn-gold/80 block mb-1">
              Signed Authority
            </span>
            <p className="text-xs font-bold text-white truncate leading-tight">
              {currentUser.name}
            </p>
            <p className="text-[9px] font-mono text-stone-400 mt-1 uppercase tracking-wide flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-stsn-gold animate-pulse flex-shrink-0" />
              {currentUser.role.replace("_", " ")} Clearance
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 py-3 overflow-y-auto px-3">
          {renderedSidebarItems.map((item) => {
            const isSelected = activeModule === item.id;
            const isExpanded = expandedModule === item.id;
            const Icon = item.icon;

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
                        const isChildActive = child.targetModule
                          ? activeModule === child.targetModule && (child.targetModule !== "CORE_SETUP" || coreSetupSubPage === child.id)
                          : isSelected && (item.id === "STUDENT_PORTAL" ? portalSubPage === child.id : accountingSubPage === child.id);
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

        {/* Logout */}
        <div className="p-4 border-t border-white/8">
          <button
            onClick={() => {
              logout();
              toast("Logged out of STSN Connect session.");
            }}
            className="w-full bg-white/5 hover:bg-black/30 text-stone-300 hover:text-white rounded-xl py-2.5 text-xs font-semibold flex items-center justify-center gap-2 border border-white/8 cursor-pointer transition-all"
          >
            <LogOut className="w-4 h-4" />
            Exit Connect Session
          </button>
        </div>
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
            {/* Presenter Tools */}
            <div className="hidden md:flex items-center gap-1.5 bg-gradient-to-r from-stsn-cream to-white px-3 py-1.5 rounded-xl border border-stsn-beige shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-stsn-gold animate-spin" />
              <div className="text-left leading-none">
                <span className="text-[8.5px] uppercase font-mono text-stone-400 block font-bold">
                  Presenter Sandbox
                </span>
                <span className="text-[10.5px] font-bold text-stsn-brown">
                  ERP Demo Simulator:
                </span>
              </div>
            </div>

            {/* Role selector */}
            <div className="relative group">
              <div className="flex items-center gap-1 btn-primary-gradient text-white text-xs font-bold leading-none px-3 py-2 rounded-xl cursor-pointer shadow-md">
                <span>Role: {currentUser.role.replace("_", " ")}</span>
                <ChevronDown className="w-4 h-4" />
              </div>
              <div className="absolute right-0 mt-2 bg-white rounded-xl shadow-xl border border-stone-200/85 w-54 py-2 hidden group-hover:block animate-fade-in text-slate-800">
                <div className="px-3 pb-2 mb-1.5 border-b border-stone-100">
                  <span className="text-[9px] uppercase font-mono text-stone-400 tracking-wider">
                    Switch Simulated Account
                  </span>
                </div>
                {users.map((u) => (
                  <button
                    key={u.role}
                    onClick={() => handleRoleQuickSwitch(u.email)}
                    className="w-full text-left font-sans font-semibold text-xs py-1.5 px-3 hover:bg-stsn-cream hover:text-stsn-brown-dark transition-all flex items-center gap-2"
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${currentUser.role === u.role ? "bg-stsn-gold" : "bg-stone-300"}`}
                    />
                    <span>{u.role.replace("_", " ")}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Clock */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-stone-50 to-white border border-stone-200/60 rounded-xl text-stone-600 shadow-sm">
              <Clock className="w-4 h-4 text-stsn-gold" />
              <span className="text-xs font-mono font-bold">
                {currentTime || "12:00:00"}
              </span>
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-gradient-to-br from-stsn-cream via-[#FAF6EE] to-[#F5F0E8]">
          {activeModule === "DASHBOARD" &&
            allowedModules.includes("DASHBOARD") && (
              <Dashboard onViewStudentList={() => setActiveModule("REGISTRAR")} />
            )}
          {activeModule === "REGISTRAR" &&
            allowedModules.includes("REGISTRAR") && <RegistrarModule />}
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
            allowedModules.includes("HR_MANAGEMENT") && <HRManagement />}
          {activeModule === "ACCOUNTS_SECURITY" &&
            allowedModules.includes("ACCOUNTS_SECURITY") && (
              <AccountsManagement />
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
            allowedModules.includes("CASHIER") && <CashierModule />}
          {activeModule === "NURSE_CLINIC" &&
            allowedModules.includes("NURSE_CLINIC") && <ClinicModule />}
          {activeModule === "GUIDANCE" &&
            allowedModules.includes("GUIDANCE") && <GuidanceModule />}
          {activeModule === "CONSULTATION" &&
            allowedModules.includes("CONSULTATION") && <ConsultationModule />}
        </main>
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
                            const isChildActive = child.targetModule
                              ? activeModule === child.targetModule && (child.targetModule !== "CORE_SETUP" || coreSetupSubPage === child.id)
                              : isSelected && accountingSubPage === child.id;
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
                                    setAccountingSubPage(child.id);
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
    </div>
  );
}

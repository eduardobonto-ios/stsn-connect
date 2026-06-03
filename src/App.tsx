/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useSTSNStore } from "./services/store";
import {
  Compass,
  LayoutDashboard,
  Coins,
  GraduationCap,
  Users,
  BookOpen,
  Shield,
  LogOut,
  Sparkles,
  Building2,
  RefreshCw,
  Bell,
  Clock,
  Menu,
  ChevronDown,
  UserCheck,
  School,
  Settings,
  CalendarDays,
  BarChart3
} from "lucide-react";

// Module Imports
import LoginOverlay from "./components/LoginOverlay";
import Dashboard from "./pages/Dashboard";
import RegistrarModule from "./pages/RegistrarModule";
import AccountingModule from "./pages/AccountingModule";
import GradingModule from "./pages/GradingModule";
import HRManagement from "./pages/HRManagement";
import CurriculumManagement from "./pages/CurriculumManagement";
import AccountsManagement from "./pages/AccountsManagement";
import StudentPortal from "./pages/StudentPortal";
import FacultyPortal from "./pages/FacultyPortal";
import CoreSetupModule from "./pages/CoreSetupModule";
import SchedulingModule from "./pages/SchedulingModule";
import OnlineLearning from "./pages/OnlineLearning";

type STSNModule =
  | "DASHBOARD"
  | "REGISTRAR"
  | "ACCOUNTING"
  | "GRADING"
  | "CURRICULUM"
  | "STUDENT_PORTAL"
  | "FACULTY_PORTAL"
  | "HR_MANAGEMENT"
  | "ACCOUNTS_SECURITY"
  | "CORE_SETUP"
  | "SCHEDULING"
  | "ONLINE_LEARNING";

export default function App() {
  const { currentUser, login, logout, users, activeSchool } = useSTSNStore();
  const [activeModule, setActiveModule] = useState<STSNModule>("DASHBOARD");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === "STUDENT") setActiveModule("STUDENT_PORTAL");
    else if (currentUser.role === "TEACHER" || currentUser.role === "EMPLOYEE") setActiveModule("FACULTY_PORTAL");
    else if (currentUser.role === "ACCOUNTING") setActiveModule("ACCOUNTING");
    else setActiveModule("DASHBOARD");
  }, [currentUser]);

  if (!currentUser) return <LoginOverlay />;

  const rolePermissions: Record<string, STSNModule[]> = {
    SUPER_ADMIN: ["DASHBOARD", "REGISTRAR", "ACCOUNTING", "GRADING", "CURRICULUM", "STUDENT_PORTAL", "FACULTY_PORTAL", "HR_MANAGEMENT", "ACCOUNTS_SECURITY", "CORE_SETUP", "SCHEDULING", "ONLINE_LEARNING"],
    ADMIN: ["DASHBOARD", "REGISTRAR", "ACCOUNTING", "GRADING", "CURRICULUM", "STUDENT_PORTAL", "FACULTY_PORTAL", "HR_MANAGEMENT", "ACCOUNTS_SECURITY", "CORE_SETUP", "SCHEDULING", "ONLINE_LEARNING"],
    REGISTRAR: ["DASHBOARD", "REGISTRAR", "CURRICULUM", "ACCOUNTS_SECURITY", "STUDENT_PORTAL", "SCHEDULING", "CORE_SETUP"],
    ACCOUNTING: ["ACCOUNTING", "CORE_SETUP"],
    TEACHER: ["FACULTY_PORTAL", "GRADING", "CURRICULUM", "ONLINE_LEARNING"],
    STUDENT: ["STUDENT_PORTAL"],
    HR: ["DASHBOARD", "HR_MANAGEMENT", "ACCOUNTS_SECURITY"],
    EMPLOYEE: ["FACULTY_PORTAL", "GRADING"]
  };

  const allowedModules = rolePermissions[currentUser.role] || ["DASHBOARD"];

  const sidebarItems = [
    { id: "DASHBOARD", label: "System Dashboard", icon: LayoutDashboard, desc: "Live admissions & fees" },
    { id: "REGISTRAR", label: "Admissions & COR", icon: Compass, desc: "Student registrations" },
    { id: "ACCOUNTING", label: "Accounting", icon: Coins, desc: "Ledger, discounts & reports" },
    { id: "GRADING", label: "Grades Directory", icon: GraduationCap, desc: "Midterm/Final score encodes" },
    { id: "STUDENT_PORTAL", label: "Student Portal", icon: UserCheck, desc: "View grades, COR & ID" },
    { id: "FACULTY_PORTAL", label: "Teacher Board", icon: BookOpen, desc: "Schedules & class scores" },
    { id: "ONLINE_LEARNING", label: "Online Learning", icon: BarChart3, desc: "LMS • Videos & modules" },
    { id: "HR_MANAGEMENT", label: "HR Staff Payroll", icon: Users, desc: "Employee payslips database" },
    { id: "CURRICULUM", label: "Syllabus Pathways", icon: Building2, desc: "Academic subjects flow" },
    { id: "SCHEDULING", label: "Class Scheduling", icon: CalendarDays, desc: "Schedules & room assignments" },
    { id: "ACCOUNTS_SECURITY", label: "Authority Clearances", icon: Shield, desc: "Credential security status" },
    { id: "CORE_SETUP", label: "Core Setup", icon: Settings, desc: "System configuration & maintenance" },
  ] as const;

  const renderedSidebarItems = sidebarItems.filter((item) => allowedModules.includes(item.id));

  const handleRoleQuickSwitch = (email: string) => { login(email, ""); };

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
            <span className="text-[9px] text-stone-400 font-mono tracking-widest uppercase mt-0.5 block">Academia Enterprise v2</span>
          </div>
        </div>

        {/* School badges */}
        <div className="px-4 py-2.5 space-y-1.5 border-b border-white/5">
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all ${
            activeSchool === "STSN" || activeSchool === "ALL"
              ? "bg-white/10 border-stsn-gold/30"
              : "bg-white/5 border-white/8"
          }`}>
            <School className="w-3 h-3 text-stsn-gold flex-shrink-0" />
            <span className="text-[8.5px] font-mono text-stone-300 truncate flex-1">St. Theresa's School of Novaliches</span>
            {(activeSchool === "STSN" || activeSchool === "ALL") && (
              <span className="w-1.5 h-1.5 rounded-full bg-stsn-gold animate-pulse flex-shrink-0" />
            )}
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all ${
            activeSchool === "CDSTA" || activeSchool === "ALL"
              ? "bg-blue-500/15 border-blue-400/30"
              : "bg-white/5 border-white/8"
          }`}>
            <GraduationCap className="w-3 h-3 text-blue-400 flex-shrink-0" />
            <span className="text-[8.5px] font-mono text-blue-300 truncate flex-1">Colegio de Sta. Teresa de Avila</span>
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
            <span className="text-[8px] uppercase font-mono tracking-widest text-stsn-gold/80 block mb-1">Signed Authority</span>
            <p className="text-xs font-bold text-white truncate leading-tight">{currentUser.name}</p>
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
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveModule(item.id); setIsMobileOpen(false); }}
                className={`w-full text-left py-2.5 px-3 rounded-xl flex items-start gap-3 transition-all duration-200 cursor-pointer group ${
                  isSelected
                    ? "sidebar-item-active text-stsn-cream font-bold shadow-md"
                    : "hover:bg-white/8 text-stone-300 font-medium opacity-80 hover:opacity-100"
                }`}
              >
                <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isSelected ? "text-stsn-gold" : "text-stone-400 group-hover:text-stone-200"}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] leading-none">{item.label}</p>
                  <p className={`text-[9.5px] font-normal truncate mt-0.5 leading-none ${isSelected ? "text-stsn-gold-light/70" : "text-stone-500"}`}>
                    {item.desc}
                  </p>
                </div>
                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-stsn-gold flex-shrink-0 mt-1.5 animate-pulse" />}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/8">
          <button
            onClick={() => { logout(); alert("Logged out of STSN Connect session."); }}
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
              <span className="text-[9px] text-stone-400 uppercase font-mono tracking-widest block font-bold">STSN Connect System</span>
              <h2 className="text-xs font-display font-black text-stsn-brown uppercase">Unified Philippine K-12 & Tertiary Academics</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Presenter Tools */}
            <div className="hidden md:flex items-center gap-1.5 bg-gradient-to-r from-stsn-cream to-white px-3 py-1.5 rounded-xl border border-stsn-beige shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-stsn-gold animate-spin" />
              <div className="text-left leading-none">
                <span className="text-[8.5px] uppercase font-mono text-stone-400 block font-bold">Presenter Sandbox</span>
                <span className="text-[10.5px] font-bold text-stsn-brown">ERP Demo Simulator:</span>
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
                  <span className="text-[9px] uppercase font-mono text-stone-400 tracking-wider">Switch Simulated Account</span>
                </div>
                {users.map((u) => (
                  <button
                    key={u.role}
                    onClick={() => handleRoleQuickSwitch(u.email)}
                    className="w-full text-left font-sans font-semibold text-xs py-1.5 px-3 hover:bg-stsn-cream hover:text-stsn-brown-dark transition-all flex items-center gap-2"
                  >
                    <span className={`w-2 h-2 rounded-full ${currentUser.role === u.role ? "bg-stsn-gold" : "bg-stone-300"}`} />
                    <span>{u.role.replace("_", " ")}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Clock */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-stone-50 to-white border border-stone-200/60 rounded-xl text-stone-600 shadow-sm">
              <Clock className="w-4 h-4 text-stsn-gold" />
              <span className="text-xs font-mono font-bold">{currentTime || "12:00:00"}</span>
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-gradient-to-br from-stsn-cream via-[#FAF6EE] to-[#F5F0E8]">
          {activeModule === "DASHBOARD" && allowedModules.includes("DASHBOARD") && <Dashboard />}
          {activeModule === "REGISTRAR" && allowedModules.includes("REGISTRAR") && <RegistrarModule />}
          {activeModule === "ACCOUNTING" && allowedModules.includes("ACCOUNTING") && <AccountingModule />}
          {activeModule === "GRADING" && allowedModules.includes("GRADING") && <GradingModule />}
          {activeModule === "CURRICULUM" && allowedModules.includes("CURRICULUM") && <CurriculumManagement />}
          {activeModule === "STUDENT_PORTAL" && allowedModules.includes("STUDENT_PORTAL") && <StudentPortal />}
          {activeModule === "FACULTY_PORTAL" && allowedModules.includes("FACULTY_PORTAL") && <FacultyPortal />}
          {activeModule === "HR_MANAGEMENT" && allowedModules.includes("HR_MANAGEMENT") && <HRManagement />}
          {activeModule === "ACCOUNTS_SECURITY" && allowedModules.includes("ACCOUNTS_SECURITY") && <AccountsManagement />}
          {activeModule === "CORE_SETUP" && allowedModules.includes("CORE_SETUP") && <CoreSetupModule />}
          {activeModule === "SCHEDULING" && allowedModules.includes("SCHEDULING") && <SchedulingModule />}
          {activeModule === "ONLINE_LEARNING" && allowedModules.includes("ONLINE_LEARNING") && <OnlineLearning />}
        </main>
      </div>

      {/* MOBILE DRAWER */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex animate-fade-in font-sans">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
          <div className="relative w-72 sidebar-gradient text-stsn-cream flex flex-col p-5 animate-slide-in">
            <div className="flex justify-between items-center pb-4 border-b border-white/8 mb-4">
              <h2 className="font-display font-extrabold text-stsn-gold">STSN Connect</h2>
              <button onClick={() => setIsMobileOpen(false)} className="text-white text-xs font-bold underline cursor-pointer">Close</button>
            </div>
            <nav className="space-y-1.5 flex-1 overflow-y-auto pb-4">
              {renderedSidebarItems.map((item) => {
                const isSelected = activeModule === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setActiveModule(item.id); setIsMobileOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 text-xs font-bold rounded-xl transition-all ${
                      isSelected ? "sidebar-item-active text-stsn-cream" : "text-stone-300 hover:bg-white/8"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
            <button onClick={() => logout()} className="w-full bg-white/5 hover:bg-black/20 text-xs py-2.5 rounded-xl text-stone-300 font-bold border border-white/8">
              Exit Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

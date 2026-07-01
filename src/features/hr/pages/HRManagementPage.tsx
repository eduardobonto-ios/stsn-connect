/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Award,
  Banknote,
  Briefcase,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileCheck,
  LayoutDashboard,
  Percent,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";
import AppCard from "../../../components/common/AppCard";
import AppSearchInput from "../../../components/common/AppSearchInput";
import ModulePageHeader from "../../../components/common/ModulePageHeader";
import { useSTSNStore } from "../../../services/store";
import { usePermissions } from "../../../hooks/usePermissions";
import HRDashboardPage from "./sub-pages/HRDashboardPage";
import EmployeeLifecyclePage from "./sub-pages/EmployeeLifecyclePage";
import TimeManagementPage from "./sub-pages/TimeManagementPage";
import ShiftManagementPage from "./sub-pages/ShiftManagementPage";
import AttendancePage from "./sub-pages/AttendancePage";
import LeaveManagementPage from "./sub-pages/LeaveManagementPage";
import PayrollManagementPage from "./sub-pages/PayrollManagementPage";
import SalaryPayoutsPage from "./sub-pages/SalaryPayoutsPage";
import TaxesPage from "./sub-pages/TaxesPage";
import BenefitsPage from "./sub-pages/BenefitsPage";
import RecruitmentPage from "./sub-pages/RecruitmentPage";
import OnboardingPage from "./sub-pages/OnboardingPage";
import NewEmployeeProfilePage from "./sub-pages/NewEmployeeProfilePage";

interface Props {
  subPage: string;
  onSubPageChange: (subPage: string) => void;
}

type HRModuleGroup = "Command" | "Workforce" | "Time" | "Payroll" | "Talent";

interface HRModuleConfig {
  id: string;
  label: string;
  group: HRModuleGroup;
  icon: React.ElementType;
  desc: string;
  metric: string | number;
  metricLabel: string;
  tone: {
    icon: string;
    active: string;
    accent: string;
  };
}

const GROUPS: HRModuleGroup[] = ["Command", "Workforce", "Time", "Payroll", "Talent"];
const GROUP_TONES: Record<HRModuleGroup, HRModuleConfig["tone"]> = {
  Command: {
    icon: "border-stsn-beige bg-stsn-cream text-stsn-brown",
    active: "border-stsn-brown ring-stsn-brown/10",
    accent: "bg-stsn-brown",
  },
  Workforce: {
    icon: "border-blue-100 bg-blue-50 text-blue-700",
    active: "border-blue-300 ring-blue-100",
    accent: "bg-blue-600",
  },
  Time: {
    icon: "border-amber-100 bg-amber-50 text-amber-700",
    active: "border-amber-300 ring-amber-100",
    accent: "bg-amber-500",
  },
  Payroll: {
    icon: "border-emerald-100 bg-emerald-50 text-emerald-700",
    active: "border-emerald-300 ring-emerald-100",
    accent: "bg-emerald-600",
  },
  Talent: {
    icon: "border-indigo-100 bg-indigo-50 text-indigo-700",
    active: "border-indigo-300 ring-indigo-100",
    accent: "bg-indigo-600",
  },
};

export default function HRManagement({ subPage, onSubPageChange }: Props) {
  const {
    employees,
    leaveRequests,
    employeeTimeLogs,
    employeeAttendance,
    payroll,
    payrollPeriods,
    benefitPlans,
    shiftTemplates,
    employeeShiftAssignments,
    currentUser,
    activeSchool,
  } = useSTSNStore();
  const [activeGroup, setActiveGroup] = useState<HRModuleGroup | "All">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const activeSectionRef = useRef<HTMLDivElement>(null);
  const { hasPageAccess } = usePermissions();

  const effectiveSchool = currentUser?.schoolId ?? (activeSchool !== "ALL" ? activeSchool : undefined);

  const scopedEmployees = useMemo(
    () => employees.filter((employee) => !effectiveSchool || !employee.schoolId || employee.schoolId === effectiveSchool),
    [employees, effectiveSchool],
  );

  const activeEmployees = scopedEmployees.filter(
    (employee) => !["Resigned", "Terminated", "Retired", "Inactive"].includes(employee.employmentStatus ?? "Active"),
  ).length;
  const pendingLeave = leaveRequests.filter((request) => request.status === "Submitted" || request.status === "For Approval").length;
  const pendingTimeLogs = employeeTimeLogs.filter((log) => !log.isApproved).length;
  const openPayrollPeriods = payrollPeriods.filter((period) => period.status === "Open").length;
  const pendingPayroll = payroll.filter((item) => item.status === "Pending").length;
  const activeBenefits = benefitPlans.filter((benefit) => benefit.isActive).length;
  const attendanceExceptions = employeeAttendance.filter((record) =>
    ["Late", "Undertime", "Absent", "Half Day"].includes(record.status),
  ).length;
  const activeShiftTemplates = shiftTemplates.filter((shift) => shift.isActive).length;

  const readinessScore = Math.max(
    0,
    Math.min(
      100,
      96 -
        pendingLeave * 4 -
        pendingTimeLogs * 3 -
        pendingPayroll * 3 -
        attendanceExceptions * 1,
    ),
  );

  const modules: HRModuleConfig[] = useMemo(
    () => [
      {
        id: "hr-dashboard",
        label: "HR Dashboard",
        group: "Command",
        icon: LayoutDashboard,
        desc: "Executive workforce health, alerts, and operating signals.",
        metric: `${readinessScore}%`,
        metricLabel: "readiness",
        tone: GROUP_TONES.Command,
      },
      {
        id: "employee-life-cycles",
        label: "Employee Life Cycles",
        group: "Workforce",
        icon: Users,
        desc: "Manage employee records, movements, and employment status.",
        metric: activeEmployees,
        metricLabel: "active staff",
        tone: GROUP_TONES.Workforce,
      },
      {
        id: "new-employee-profile",
        label: "New Employee Profile",
        group: "Workforce",
        icon: UserCheck,
        desc: "Complete profile, requirements, and onboarding-ready records for new hires.",
        metric: scopedEmployees.filter((employee) => employee.employmentStatus === "For Onboarding").length,
        metricLabel: "for onboarding",
        tone: GROUP_TONES.Workforce,
      },
      {
        id: "time-management",
        label: "Time Management",
        group: "Time",
        icon: Clock,
        desc: "Review work logs, approvals, corrections, and exceptions.",
        metric: pendingTimeLogs,
        metricLabel: "pending logs",
        tone: GROUP_TONES.Time,
      },
      {
        id: "shift-management",
        label: "Shift Management",
        group: "Time",
        icon: CalendarDays,
        desc: "Maintain shift templates and employee assignments.",
        metric: activeShiftTemplates,
        metricLabel: "active shifts",
        tone: GROUP_TONES.Time,
      },
      {
        id: "attendance",
        label: "Attendance",
        group: "Time",
        icon: CalendarCheck,
        desc: "Monitor daily presence, late marks, undertime, and absences.",
        metric: attendanceExceptions,
        metricLabel: "exceptions",
        tone: GROUP_TONES.Time,
      },
      {
        id: "leave-management",
        label: "Leave Management",
        group: "Time",
        icon: FileCheck,
        desc: "Approve leave requests and protect staffing coverage.",
        metric: pendingLeave,
        metricLabel: "for approval",
        tone: GROUP_TONES.Time,
      },
      {
        id: "payroll-management",
        label: "Payroll Management",
        group: "Payroll",
        icon: Banknote,
        desc: "Prepare payroll runs, validations, and payslip processing.",
        metric: openPayrollPeriods,
        metricLabel: "open periods",
        tone: GROUP_TONES.Payroll,
      },
      {
        id: "salary-payouts",
        label: "Salary Payouts",
        group: "Payroll",
        icon: Wallet,
        desc: "Track payout batches, releases, and payment readiness.",
        metric: pendingPayroll,
        metricLabel: "pending payroll",
        tone: GROUP_TONES.Payroll,
      },
      {
        id: "taxes",
        label: "Taxes",
        group: "Payroll",
        icon: Percent,
        desc: "Manage withholding setup, compliance, and reports.",
        metric: "BIR",
        metricLabel: "compliance",
        tone: GROUP_TONES.Payroll,
      },
      {
        id: "benefits",
        label: "Benefits",
        group: "Payroll",
        icon: Award,
        desc: "Maintain benefit plans, employee coverage, and deductions.",
        metric: activeBenefits,
        metricLabel: "active plans",
        tone: GROUP_TONES.Payroll,
      },
      {
        id: "recruitment",
        label: "Recruitment",
        group: "Talent",
        icon: Briefcase,
        desc: "Manage openings, applicant pipeline, and hiring decisions.",
        metric: "ATS",
        metricLabel: "pipeline",
        tone: GROUP_TONES.Talent,
      },
      {
        id: "onboarding",
        label: "Onboarding",
        group: "Talent",
        icon: UserCheck,
        desc: "Guide new hires through documents, tasks, and readiness.",
        metric: "Day 1",
        metricLabel: "new hire ready",
        tone: GROUP_TONES.Talent,
      },
    ],
    [
      activeBenefits,
      activeEmployees,
      activeShiftTemplates,
      attendanceExceptions,
      openPayrollPeriods,
      pendingLeave,
      pendingPayroll,
      pendingTimeLogs,
      readinessScore,
    ],
  );

  const activeModule = modules.find((module) => module.id === subPage) ?? modules[0];
  const visibleModules = modules.filter((module) => hasPageAccess("HR_MANAGEMENT", module.id));
  const activeModuleAccessible = hasPageAccess("HR_MANAGEMENT", subPage);

  const focusActiveSection = () => {
    const frameId = window.requestAnimationFrame(() => {
      const target = activeSectionRef.current;
      const scrollContainer = target?.closest("main");

      if (!target || !scrollContainer) return;

      target.focus({ preventScroll: true });

      const targetTop =
        scrollContainer.scrollTop +
        target.getBoundingClientRect().top -
        scrollContainer.getBoundingClientRect().top;

      scrollContainer.scrollTo({
        top: Math.max(0, targetTop - 8),
        behavior: "smooth",
      });
    });

    return frameId;
  };

  useEffect(() => {
    const frameId = focusActiveSection();
    return () => window.cancelAnimationFrame(frameId);
  }, [subPage]);

  const filteredVisibleModules = visibleModules.filter((module) => {
    const matchesGroup = activeGroup === "All" || module.group === activeGroup;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      module.label.toLowerCase().includes(query) ||
      module.desc.toLowerCase().includes(query) ||
      module.group.toLowerCase().includes(query);
    return matchesGroup && matchesSearch;
  });

  const priorityActions = [
      { label: "Approve leave", count: pendingLeave, page: "leave-management", icon: FileCheck },
      { label: "Review time logs", count: pendingTimeLogs, page: "time-management", icon: Clock },
      { label: "Prepare payroll", count: pendingPayroll + openPayrollPeriods, page: "payroll-management", icon: Banknote },
      { label: "Check attendance", count: attendanceExceptions, page: "attendance", icon: ShieldCheck },
  ];

  const navigateTo = (page: string) => {
    onSubPageChange(page);
    window.setTimeout(focusActiveSection, 50);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <ModulePageHeader
        badge="Human Resource Department"
        badgeIcon={Sparkles}
        title="HR Command Center"
        subtitle="Workforce, time, payroll, and talent decisions from one interactive workspace."
        meta={`${activeEmployees} staff · ${pendingLeave + pendingTimeLogs} pending approvals`}
      />

      <AppCard className="overflow-hidden" padded={false} tone="brand">
        <div className="p-5 sm:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {[
              { label: "Readiness", value: `${readinessScore}%`, icon: TrendingUp },
              { label: "Active Staff", value: activeEmployees, icon: Users },
              { label: "Approvals", value: pendingLeave + pendingTimeLogs, icon: CheckCircle2 },
              { label: "Coverage", value: employeeShiftAssignments.length, icon: CalendarCheck },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-lg border border-stsn-beige bg-stsn-cream p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500">{label}</span>
                  <Icon className="h-3.5 w-3.5 text-stsn-brown" />
                </div>
                <p className="mt-1 font-display text-xl font-bold text-stone-900">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="rounded-2xl border border-[var(--erp-border)] bg-[var(--erp-surface-muted)] p-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <AppSearchInput
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search HR workflows, payroll, leave, attendance..."
                  wrapperClassName="flex-1"
                  uiSize="sm"
                />
                <div className="flex flex-wrap gap-1.5">
                  {(["All", ...GROUPS] as const).map((group) => (
                    <button
                      key={group}
                      type="button"
                      onClick={() => setActiveGroup(group)}
                      className={`rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide transition ${
                        activeGroup === group
                          ? "border-stsn-brown bg-stsn-brown text-white shadow-sm"
                          : "border-stsn-beige bg-white text-stone-500 hover:border-stsn-brown hover:text-stsn-brown"
                      }`}
                    >
                      {group}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {filteredVisibleModules.map((module) => {
                  const Icon = module.icon;
                  const isActive = module.id === activeModule.id;
                  return (
                    <button
                      key={module.id}
                      type="button"
                      onClick={() => navigateTo(module.id)}
                      className={`group relative overflow-hidden rounded-lg border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                        isActive ? `${module.tone.active} ring-2` : "border-stone-200 hover:border-stone-300"
                      }`}
                    >
                      <div className={`absolute inset-x-0 top-0 h-1 ${module.tone.accent}`} />
                      <div className="flex items-start justify-between gap-3">
                        <div className={`rounded-lg border p-2 shadow-sm transition ${module.tone.icon}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="text-right">
                          <p className="font-display text-lg font-bold leading-none text-stone-900">{module.metric}</p>
                          <p className="mt-1 text-[9px] font-mono uppercase tracking-wider text-stone-400">{module.metricLabel}</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-sm font-bold text-stone-800">{module.label}</p>
                        <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-stone-500">{module.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--erp-border)] bg-[var(--erp-surface)] p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-stone-100 pb-3">
                <div>
                  <p className="text-sm font-display font-bold text-stone-900">Priority Queue</p>
                  <p className="text-[10px] text-stone-400">Actionable HR work ranked by urgency</p>
                </div>
                <span className="rounded-full bg-stsn-cream px-2.5 py-1 text-[10px] font-bold text-stsn-brown">
                  {priorityActions.reduce((total, action) => total + action.count, 0)} open
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {priorityActions.map(({ label, count, page, icon: Icon }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => navigateTo(page)}
                    className="flex w-full items-center justify-between rounded-lg border border-stone-100 bg-stone-50 px-3 py-2.5 text-left transition hover:border-stsn-brown hover:bg-stsn-cream"
                  >
                    <span className="flex items-center gap-2 text-xs font-semibold text-stone-700">
                      <Icon className="h-4 w-4 text-stsn-brown" />
                      {label}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${count > 0 ? "bg-stsn-brown text-white" : "bg-stsn-cream text-stsn-brown"}`}>
                      {count > 0 ? count : "Clear"}
                    </span>
                  </button>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-[var(--erp-border)] bg-[var(--erp-surface-muted)] p-3">
                <p className="text-xs font-bold text-stsn-brown">Best-practice HR operating rhythm</p>
                <p className="mt-1 text-[11px] leading-5 text-stone-600">
                  Resolve time and leave exceptions before payroll, then review coverage and onboarding so staffing decisions stay accurate.
                </p>
              </div>
            </div>
          </div>
        </div>
      </AppCard>

      {!activeModuleAccessible && (
        <AppCard className="border border-amber-200 bg-amber-50/60">
          <p className="text-xs text-amber-800">
            This HR page is disabled for the current access profile.
          </p>
        </AppCard>
      )}

      {activeModuleAccessible && (
      <div
        ref={activeSectionRef}
        tabIndex={-1}
        aria-label={`Current HR workspace: ${activeModule.label}`}
        className="scroll-mt-24 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-stsn-brown/25"
      >
        {subPage === "hr-dashboard" && <HRDashboardPage />}
        {subPage === "employee-life-cycles" && <EmployeeLifecyclePage />}
        {subPage === "new-employee-profile" && <NewEmployeeProfilePage />}
        {subPage === "time-management" && <TimeManagementPage />}
        {subPage === "shift-management" && <ShiftManagementPage />}
        {subPage === "attendance" && <AttendancePage />}
        {subPage === "leave-management" && <LeaveManagementPage />}
        {subPage === "payroll-management" && <PayrollManagementPage />}
        {subPage === "salary-payouts" && <SalaryPayoutsPage />}
        {subPage === "taxes" && <TaxesPage />}
        {subPage === "benefits" && <BenefitsPage />}
        {subPage === "recruitment" && <RecruitmentPage />}
        {subPage === "onboarding" && <OnboardingPage />}
      </div>
      )}
    </div>
  );
}

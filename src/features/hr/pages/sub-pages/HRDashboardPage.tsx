/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Users, Banknote, FileCheck, CalendarDays, Clock, Award, CalendarCheck, AlertTriangle, CheckCircle2, TrendingDown } from "lucide-react";
import { useSTSNStore } from "../../../../services/store";
import AppCard from "../../../../components/common/AppCard";

export default function HRDashboardPage() {
  const {
    employees, payroll, leaveRequests, employeeTimeLogs, employeeAttendance,
    shiftTemplates, employeeShiftAssignments, benefitPlans, payrollPeriods,
    currentUser, activeSchool,
  } = useSTSNStore();

  const userSchool = currentUser?.schoolId;
  const effectiveSchool = userSchool ?? (activeSchool !== "ALL" ? activeSchool : undefined);

  const filteredEmployees = employees.filter((e) =>
    !effectiveSchool || !e.schoolId || e.schoolId === effectiveSchool
  );

  const totalEmployees = filteredEmployees.length;
  const activeEmployees = filteredEmployees.filter((e) => !["Resigned", "Terminated", "Retired", "Inactive"].includes(e.employmentStatus ?? "Active")).length;
  const pendingLeave = leaveRequests.filter((r) => r.status === "Submitted" || r.status === "For Approval").length;
  const pendingTimeLogs = employeeTimeLogs.filter((l) => !l.isApproved).length;
  const pendingPayroll = payroll.filter((p) => p.status === "Pending").length;
  const openPayrollPeriods = payrollPeriods.filter((p) => p.status === "Open").length;
  const activeShifts = shiftTemplates.filter((t) => t.isActive).length;
  const activeBenefits = benefitPlans.filter((b) => b.isActive).length;

  const kpis = [
    { label: "Total Employees", value: totalEmployees, sub: `${activeEmployees} active`, icon: Users, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
    { label: "Pending Leave", value: pendingLeave, sub: "requests for approval", icon: FileCheck, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", alert: pendingLeave > 0 },
    { label: "Pending Time Logs", value: pendingTimeLogs, sub: "awaiting approval", icon: Clock, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100", alert: pendingTimeLogs > 0 },
    { label: "Open Payroll Periods", value: openPayrollPeriods, sub: pendingPayroll > 0 ? `${pendingPayroll} payroll pending` : "all closed", icon: Banknote, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
  ];

  // Workforce alerts — recent attendance exceptions (last 7 records)
  const attendanceExceptions = employeeAttendance
    .filter((a) => ["Late", "Undertime", "Absent", "Half Day"].includes(a.status))
    .sort((a, b) => b.attendanceDate.localeCompare(a.attendanceDate))
    .slice(0, 7);

  // Pending leave requests with employee lookup
  const pendingLeaveRequests = leaveRequests
    .filter((r) => r.status === "Submitted" || r.status === "For Approval")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  const EXCEPTION_STYLES: Record<string, { badge: string; dot: string }> = {
    Late:      { badge: "bg-amber-50 text-amber-700 border-amber-200",    dot: "bg-amber-400" },
    Absent:    { badge: "bg-red-50 text-red-700 border-red-200",          dot: "bg-red-500" },
    Undertime: { badge: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-400" },
    "Half Day":{ badge: "bg-blue-50 text-blue-700 border-blue-200",       dot: "bg-blue-400" },
  };

  const contractGroups = ["Full-Time", "Part-Time", "Contractual"];

  const statusGroups = [
    { label: "Active / Regular", statuses: ["Active", "Regular"], color: "bg-emerald-500" },
    { label: "Probationary", statuses: ["Probationary"], color: "bg-blue-400" },
    { label: "On Leave", statuses: ["On Leave", "Suspended"], color: "bg-amber-400" },
    { label: "Separated", statuses: ["Resigned", "Terminated", "Retired", "Inactive"], color: "bg-red-400" },
  ];

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <AppCard className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" tone="brand">
        <div>
          <h2 className="text-xl font-display font-semibold text-stone-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-stsn-brown" />
            HR Dashboard
          </h2>
          <p className="text-stone-500 text-xs mt-1">
            Human resources overview — workforce, attendance, leave, and payroll at a glance.
          </p>
        </div>
      </AppCard>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className={`bg-white border ${kpi.alert ? "border-amber-200" : kpi.border} rounded-xl p-5 flex items-start gap-4 shadow-sm`}>
              <div className={`${kpi.bg} rounded-lg p-2.5 flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-mono tracking-wider text-stone-400 leading-tight">{kpi.label}</p>
                <p className="text-2xl font-display font-bold text-stone-800 mt-0.5">{kpi.value}</p>
                <p className="text-[10px] text-stone-400 mt-0.5">{kpi.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Workforce Alerts */}
      {(attendanceExceptions.length > 0 || pendingLeaveRequests.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Attendance Exceptions */}
          <AppCard className="overflow-hidden border-red-100" padded={false}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-red-50 bg-red-50/40">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <h3 className="text-xs font-display font-bold text-red-800 uppercase tracking-wide">Attendance Exceptions</h3>
              </div>
              {attendanceExceptions.length > 0 && (
                <span className="text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full">
                  {attendanceExceptions.length} flagged
                </span>
              )}
            </div>
            <div className="divide-y divide-stone-50">
              {attendanceExceptions.length === 0 ? (
                <div className="flex items-center gap-2 px-5 py-4 text-xs text-emerald-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  No attendance exceptions — all clear.
                </div>
              ) : (
                attendanceExceptions.map((rec) => {
                  const emp = employees.find((e) => e.id === rec.employeeId);
                  const style = EXCEPTION_STYLES[rec.status] ?? EXCEPTION_STYLES["Late"];
                  return (
                    <div key={rec.id} className="flex items-center justify-between px-5 py-2.5 hover:bg-stone-50 transition">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${style.dot}`} />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-stone-800 truncate">
                            {emp ? `${emp.firstName} ${emp.lastName}` : rec.employeeId}
                          </p>
                          <p className="text-[10px] text-stone-400 font-mono">{rec.attendanceDate}</p>
                        </div>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ml-2 ${style.badge}`}>
                        {rec.status}{rec.lateMinutes > 0 ? ` · ${rec.lateMinutes}m` : ""}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </AppCard>

          {/* Pending Leave Requests */}
          <AppCard className="overflow-hidden border-amber-100" padded={false}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-amber-50 bg-amber-50/40">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-display font-bold text-amber-800 uppercase tracking-wide">Leave Requests Pending</h3>
              </div>
              {pendingLeaveRequests.length > 0 && (
                <span className="text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                  {pendingLeave} total
                </span>
              )}
            </div>
            <div className="divide-y divide-stone-50">
              {pendingLeaveRequests.length === 0 ? (
                <div className="flex items-center gap-2 px-5 py-4 text-xs text-emerald-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  No pending leave requests.
                </div>
              ) : (
                pendingLeaveRequests.map((req) => {
                  const emp = employees.find((e) => e.id === req.employeeId);
                  const statusStyle = req.status === "For Approval"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-blue-50 text-blue-700 border-blue-200";
                  return (
                    <div key={req.id} className="flex items-center justify-between px-5 py-2.5 hover:bg-stone-50 transition">
                      <div className="min-w-0 flex-1 pr-3">
                        <p className="text-xs font-semibold text-stone-800 truncate">
                          {emp ? `${emp.firstName} ${emp.lastName}` : req.employeeId}
                        </p>
                        <p className="text-[10px] text-stone-400">
                          {req.startDate} → {req.endDate} · {req.totalDays}d
                        </p>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${statusStyle}`}>
                        {req.status}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </AppCard>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employee Distribution by Contract */}
        <AppCard tone="brand">
          <h3 className="text-sm font-display font-bold text-stone-800 mb-4">Employee Distribution</h3>
          <div className="space-y-3">
            {contractGroups.map((group) => {
              const count = filteredEmployees.filter((e) => e.status === group).length;
              const pct = filteredEmployees.length > 0 ? Math.round((count / filteredEmployees.length) * 100) : 0;
              return (
                <div key={group}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-stone-600 font-medium">{group}</span>
                    <span className="text-stone-400 font-mono">{count} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-stone-100 rounded-full">
                    <div className="h-1.5 bg-stsn-brown rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            <div className="pt-2 border-t border-stone-50">
              {statusGroups.map((sg) => {
                const count = filteredEmployees.filter((e) => sg.statuses.includes(e.employmentStatus ?? "Active")).length;
                return count > 0 ? (
                  <div key={sg.label} className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${sg.color}`} />
                      <span className="text-stone-500">{sg.label}</span>
                    </div>
                    <span className="font-mono text-stone-600 font-semibold">{count}</span>
                  </div>
                ) : null;
              })}
            </div>
          </div>
          {filteredEmployees.length === 0 && (
            <p className="text-xs text-stone-400 text-center py-4">No employee records found.</p>
          )}
        </AppCard>

        {/* HR Module Summary */}
        <AppCard tone="brand">
          <h3 className="text-sm font-display font-bold text-stone-800 mb-4">Module Summary</h3>
          <div className="space-y-1">
            {[
              { label: "Shift Templates", value: activeShifts, icon: CalendarDays, sub: `${shiftTemplates.length} total`, color: "text-blue-500", bg: "bg-blue-50" },
              { label: "Shift Assignments", value: employeeShiftAssignments.length, icon: CalendarCheck, sub: "active assignments", color: "text-indigo-500", bg: "bg-indigo-50" },
              { label: "Time Logs (This Month)", value: employeeTimeLogs.length, icon: Clock, sub: `${pendingTimeLogs} pending approval`, color: "text-amber-500", bg: "bg-amber-50" },
              { label: "Attendance Records", value: employeeAttendance.length, icon: CalendarDays, sub: "all time", color: "text-emerald-500", bg: "bg-emerald-50" },
              { label: "Leave Requests", value: leaveRequests.length, icon: FileCheck, sub: `${pendingLeave} pending`, color: "text-rose-500", bg: "bg-rose-50" },
              { label: "Active Benefit Plans", value: activeBenefits, icon: Award, sub: `${benefitPlans.length} configured`, color: "text-purple-500", bg: "bg-purple-50" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-stone-50 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <div className={`${item.bg} rounded-md p-1.5`}>
                      <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-stone-700">{item.label}</p>
                      <p className="text-[10px] text-stone-400">{item.sub}</p>
                    </div>
                  </div>
                  <span className="text-sm font-display font-bold text-stone-800">{item.value}</span>
                </div>
              );
            })}
          </div>
        </AppCard>
      </div>
    </div>
  );
}

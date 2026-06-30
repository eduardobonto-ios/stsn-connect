/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react";
import { AlertTriangle, ChevronRight, Inbox } from "lucide-react";
import { useSTSNStore } from "../../services/store";
import type { STSNModule } from "../../config/navigation.config";

export type ActionScope = "global" | "accounting" | "hr" | "payroll" | "registrar";

interface ActionSummaryWidgetProps {
  scope?: ActionScope;
  onNavigate: (module: STSNModule, subPage?: string) => void;
}

interface SummaryLine {
  label: string;
  count: number;
  module: STSNModule;
  subPage?: string;
}

export default function ActionSummaryWidget({
  scope = "global",
  onNavigate,
}: ActionSummaryWidgetProps) {
  const {
    currentUser,
    activeSchool,
    assessments,
    discountRequests,
    enrollments,
    onlineEnrollmentApplications,
    leaveRequests,
    payrollRuns,
    voidRequests,
    students,
    employees,
  } = useSTSNStore();

  const lines = useMemo((): SummaryLine[] => {
    if (!currentUser) return [];
    const inSchool = (schoolId?: string) =>
      activeSchool === "ALL" || !schoolId || schoolId === activeSchool;
    const studentInSchool = (sid: string) =>
      inSchool(students.find((s) => s.id === sid)?.schoolId);
    const employeeInSchool = (eid: string) =>
      inSchool(employees.find((e) => e.id === eid)?.schoolId);

    const result: SummaryLine[] = [];

    const showAccounting =
      scope === "global" || scope === "accounting";
    const showRegistrar =
      scope === "global" || scope === "registrar";
    const showHR =
      scope === "global" || scope === "hr";
    const showPayroll =
      scope === "global" || scope === "payroll";

    if (showAccounting) {
      const pendingAsmt = assessments.filter(
        (a) =>
          a.approvalStatus === "Pending Accounting Approval" &&
          inSchool(a.schoolId),
      ).length;
      if (pendingAsmt > 0) {
        result.push({
          label: "Billing assessments pending",
          count: pendingAsmt,
          module: "ACCOUNTING",
          subPage: "billing",
        });
      }

      const pendingDisc = discountRequests.filter(
        (d) =>
          d.status === "Pending" &&
          studentInSchool(d.studentId),
      ).length;
      if (pendingDisc > 0) {
        result.push({
          label: "Discount requests needing approval",
          count: pendingDisc,
          module: "ACCOUNTING",
          subPage: "discounts",
        });
      }

      const pendingVoid = voidRequests.filter(
        (v) => v.status === "Pending Void Approval",
      ).length;
      if (pendingVoid > 0) {
        result.push({
          label: "Void requests pending",
          count: pendingVoid,
          module: "ACTION_CENTER",
        });
      }
    }

    if (showRegistrar) {
      const pendingEnr = enrollments.filter(
        (e) => e.status === "Pending" && studentInSchool(e.studentId),
      ).length;
      if (pendingEnr > 0) {
        result.push({
          label: "Enrollment applications pending",
          count: pendingEnr,
          module: "REGISTRAR",
        });
      }

      const pendingOnline = onlineEnrollmentApplications.filter(
        (a) => a.status === "Pending Registrar Review",
      ).length;
      if (pendingOnline > 0) {
        result.push({
          label: "Online enrollment applications",
          count: pendingOnline,
          module: "ACTION_CENTER",
        });
      }
    }

    if (showHR) {
      const pendingLeave = leaveRequests.filter(
        (l) =>
          (l.status === "Submitted" || l.status === "For Approval") &&
          employeeInSchool(l.employeeId),
      ).length;
      if (pendingLeave > 0) {
        result.push({
          label: "Leave requests for approval",
          count: pendingLeave,
          module: "HR_MANAGEMENT",
          subPage: "leave-management",
        });
      }
    }

    if (showPayroll) {
      const openPayroll = payrollRuns.filter(
        (p) => p.status === "Draft" || p.status === "For Review",
      ).length;
      if (openPayroll > 0) {
        result.push({
          label: "Payroll runs open",
          count: openPayroll,
          module: "PAYROLL_MANAGEMENT",
          subPage: "payroll-management",
        });
      }
    }

    return result;
  }, [
    currentUser,
    activeSchool,
    assessments,
    discountRequests,
    enrollments,
    onlineEnrollmentApplications,
    leaveRequests,
    payrollRuns,
    voidRequests,
    students,
    employees,
    scope,
  ]);

  const totalCount = lines.reduce((sum, l) => sum + l.count, 0);
  const urgentLines = lines.slice(0, 4);

  if (lines.length === 0) {
    return (
      <div className="bg-white border border-stone-200 rounded-xl p-4 flex items-center gap-3">
        <Inbox className="w-4 h-4 text-stone-300" />
        <span className="text-xs text-stone-400 font-semibold">
          No pending actions
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-stone-100 bg-amber-50">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold text-amber-800">
            Attention Required
          </span>
          <span className="bg-amber-500 text-white text-[10px] font-black rounded-full px-1.5 py-0.5 leading-none">
            {totalCount}
          </span>
        </div>
        <button
          onClick={() => onNavigate("ACTION_CENTER")}
          className="text-[10px] font-bold text-stsn-brown hover:underline flex items-center gap-0.5"
        >
          Open Action Center
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Lines */}
      <ul className="divide-y divide-stone-100">
        {urgentLines.map((line, i) => (
          <li key={i}>
            <button
              onClick={() => onNavigate(line.module, line.subPage)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-stone-50 transition group"
            >
              <span className="text-xs font-semibold text-stone-700 group-hover:text-stsn-brown">
                {line.label}
              </span>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-[11px] font-black text-stsn-brown bg-stsn-cream border border-stsn-beige rounded px-1.5 py-0.5">
                  {line.count}
                </span>
                <ChevronRight className="w-3 h-3 text-stone-400 group-hover:text-stsn-brown" />
              </div>
            </button>
          </li>
        ))}
      </ul>

      {lines.length > 4 && (
        <div className="px-4 py-2 border-t border-stone-100">
          <button
            onClick={() => onNavigate("ACTION_CENTER")}
            className="text-[10px] font-semibold text-stone-400 hover:text-stsn-brown"
          >
            +{lines.length - 4} more in Action Center
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react";
import { CheckCircle, XCircle, ChevronRight, Inbox, AlertTriangle } from "lucide-react";
import EmptyState from "./EmptyState";
import { useSTSNStore } from "../../services/store";
import { useAppDialog } from "./useAppDialog";
import type { STSNModule } from "../../config/navigation.config";
import type { SchoolId } from "../../types";

export interface NavigateTarget {
  module: STSNModule;
  subPage?: string;
}

interface ApprovalInboxProps {
  onNavigate: (target: NavigateTarget) => void;
}

type ItemType = "ASMT" | "DISC" | "ENR" | "APP" | "LEAVE" | "PR" | "GRADE" | "VOID";

interface PendingItemData {
  id: string;
  type: ItemType;
  reference: string;
  subjectName: string;
  submittedAt: string;
  navigateTo: NavigateTarget;
  canQuickApprove: boolean;
  canQuickReturn: boolean;
  returnLabel: string;
  schoolId?: SchoolId;
}

const TYPE_CONFIG: Record<ItemType, { label: string; bg: string; text: string }> = {
  ASMT:  { label: "ASMT",  bg: "bg-sky-100",     text: "text-sky-700"     },
  DISC:  { label: "DISC",  bg: "bg-violet-100",  text: "text-violet-700"  },
  ENR:   { label: "ENR",   bg: "bg-amber-100",   text: "text-amber-700"   },
  APP:   { label: "APP",   bg: "bg-orange-100",  text: "text-orange-700"  },
  LEAVE: { label: "LEAVE", bg: "bg-teal-100",    text: "text-teal-700"    },
  PR:    { label: "P/R",   bg: "bg-emerald-100", text: "text-emerald-700" },
  GRADE: { label: "GRADE", bg: "bg-rose-100",    text: "text-rose-700"    },
  VOID:  { label: "VOID",  bg: "bg-red-100",     text: "text-red-700"     },
};

const SCHOOL_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  STSN:  { label: "STSN",  bg: "bg-stsn-gold/10",  text: "text-stsn-brown"  },
  CDSTA: { label: "CDSTA", bg: "bg-blue-50",        text: "text-blue-700"    },
};

function getAge(dateStr: string): { label: string; pillClass: string; isOverdue: boolean } {
  if (!dateStr) return { label: "—", pillClass: "text-stone-300", isOverdue: false };
  const ms = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 3)  return { label: `${days}d`, pillClass: "text-red-600 bg-red-50 font-bold ring-1 ring-red-200",   isOverdue: true  };
  if (days >= 1) return { label: `${days}d`, pillClass: "text-amber-600 bg-amber-50",                              isOverdue: false };
  if (hours >= 1) return { label: `${hours}h`, pillClass: "text-emerald-600 bg-emerald-50",                       isOverdue: false };
  return             { label: "< 1h",  pillClass: "text-emerald-600 bg-emerald-50",                                isOverdue: false };
}

export default function ApprovalInbox({ onNavigate }: ApprovalInboxProps) {
  const {
    currentUser,
    activeSchool,
    assessments,
    discountRequests,
    enrollments,
    onlineEnrollmentApplications,
    leaveRequests,
    payrollRuns,
    gradePeriods,
    voidRequests,
    students,
    employees,
    payrollPeriods,
    sections,
    approveAssessment,
    returnAssessmentToRegistrar,
    approveLeaveRequest,
    rejectLeaveRequest,
    approveVoidRequest,
    rejectVoidRequest,
  } = useSTSNStore();

  const { confirm, prompt, toast } = useAppDialog();

  const showSchoolBadge = activeSchool === "ALL";

  const items = useMemo((): PendingItemData[] => {
    if (!currentUser) return [];
    const role = currentUser.role;
    const school = activeSchool;
    const result: PendingItemData[] = [];

    const inSchool = (schoolId?: SchoolId | string) =>
      school === "ALL" || !schoolId || schoolId === school;

    const studentInSchool = (studentId: string) =>
      inSchool(students.find((s) => s.id === studentId)?.schoolId);

    const studentSchoolId = (studentId: string) =>
      students.find((s) => s.id === studentId)?.schoolId;

    const employeeInSchool = (employeeId: string) =>
      inSchool(employees.find((e) => e.id === employeeId)?.schoolId);

    const employeeSchoolId = (employeeId: string) =>
      employees.find((e) => e.id === employeeId)?.schoolId;

    // ── Assessments (Accounting) ──────────────────────────────────────
    if (role === "ACCOUNTING" || role === "SUPER_ADMIN" || role === "ADMIN") {
      assessments
        .filter((a) => a.approvalStatus === "Pending Accounting Approval" && inSchool(a.schoolId))
        .forEach((a) => {
          const student = students.find((s) => s.id === a.studentId);
          result.push({
            id: a.id,
            type: "ASMT",
            reference: `ASS-${a.id.slice(-8).toUpperCase()}`,
            subjectName: student ? `${student.firstName} ${student.lastName}` : a.studentId,
            submittedAt: a.submittedDate ?? "",
            navigateTo: { module: "ACCOUNTING", subPage: "billing" },
            canQuickApprove: true,
            canQuickReturn: true,
            returnLabel: "Return to Registrar",
            schoolId: a.schoolId as SchoolId | undefined,
          });
        });
    }

    // ── Discount Requests (Accounting) ────────────────────────────────
    if (role === "ACCOUNTING" || role === "SUPER_ADMIN" || role === "ADMIN") {
      discountRequests
        .filter(
          (d) =>
            (d.status === "Pending" || d.status === "For Review") &&
            studentInSchool(d.studentId)
        )
        .forEach((d) => {
          result.push({
            id: d.id,
            type: "DISC",
            reference: d.referenceNo,
            subjectName: d.studentName,
            submittedAt: d.requestedAt,
            navigateTo: { module: "ACCOUNTING", subPage: "discounts" },
            canQuickApprove: false,
            canQuickReturn: false,
            returnLabel: "Reject",
            schoolId: studentSchoolId(d.studentId) as SchoolId | undefined,
          });
        });
    }

    // ── Void Requests (Accounting) ────────────────────────────────────
    if (role === "ACCOUNTING" || role === "SUPER_ADMIN" || role === "ADMIN") {
      voidRequests
        .filter((v) => v.status === "Pending Void Approval" && inSchool(v.schoolId))
        .forEach((v) => {
          result.push({
            id: v.id,
            type: "VOID",
            reference: `OR-${v.orNumber}`,
            subjectName: v.studentName,
            submittedAt: v.requestedAt,
            navigateTo: { module: "ACCOUNTING", subPage: "cashier" },
            canQuickApprove: true,
            canQuickReturn: true,
            returnLabel: "Reject Void",
            schoolId: v.schoolId as SchoolId | undefined,
          });
        });
    }

    // ── Enrollments (Registrar) ───────────────────────────────────────
    if (role === "REGISTRAR" || role === "SUPER_ADMIN" || role === "ADMIN") {
      enrollments
        .filter(
          (e) =>
            (e.status === "Pending" || e.status === "For Assessment") &&
            studentInSchool(e.studentId)
        )
        .slice(0, 8)
        .forEach((e) => {
          const student = students.find((s) => s.id === e.studentId);
          result.push({
            id: e.id,
            type: "ENR",
            reference: `ENR-${e.id.slice(-8).toUpperCase()}`,
            subjectName: student ? `${student.firstName} ${student.lastName}` : e.studentId,
            submittedAt: e.submittedAt,
            navigateTo: { module: "REGISTRAR" },
            canQuickApprove: false,
            canQuickReturn: false,
            returnLabel: "Reject",
            schoolId: studentSchoolId(e.studentId) as SchoolId | undefined,
          });
        });

      // Online applications have no schoolId yet — always show to registrar
      onlineEnrollmentApplications
        .filter((a) => a.status === "Pending Registrar Review")
        .slice(0, 5)
        .forEach((a) => {
          result.push({
            id: a.id,
            type: "APP",
            reference: a.referenceNo,
            subjectName:
              a.firstName && a.lastName
                ? `${a.firstName} ${a.lastName}`
                : "Online Applicant",
            submittedAt: a.submittedAt,
            navigateTo: { module: "REGISTRAR" },
            canQuickApprove: false,
            canQuickReturn: false,
            returnLabel: "Reject",
            schoolId: undefined,
          });
        });
    }

    // ── Leave Requests (HR) ───────────────────────────────────────────
    if (role === "HR" || role === "SUPER_ADMIN" || role === "ADMIN") {
      leaveRequests
        .filter(
          (r) =>
            (r.status === "Submitted" || r.status === "For Approval") &&
            employeeInSchool(r.employeeId)
        )
        .forEach((r) => {
          const emp = employees.find((e) => e.id === r.employeeId);
          result.push({
            id: r.id,
            type: "LEAVE",
            reference: `LR-${r.id.slice(-8).toUpperCase()}`,
            subjectName: emp ? `${emp.firstName} ${emp.lastName}` : r.employeeId,
            submittedAt: r.createdAt,
            navigateTo: { module: "HR_MANAGEMENT", subPage: "leave-management" },
            canQuickApprove: true,
            canQuickReturn: true,
            returnLabel: "Reject",
            schoolId: employeeSchoolId(r.employeeId) as SchoolId | undefined,
          });
        });
    }

    // ── Payroll Runs (Payroll) ────────────────────────────────────────
    if (role === "PAYROLL" || role === "SUPER_ADMIN" || role === "ADMIN") {
      payrollRuns
        .filter((r) => r.status === "For Review" && inSchool(r.schoolId))
        .forEach((r) => {
          const period = payrollPeriods.find((p) => p.id === r.payrollPeriodId);
          result.push({
            id: r.id,
            type: "PR",
            reference: r.runNo,
            subjectName: period ? (period.label ?? period.periodCode) : r.payrollPeriodId,
            submittedAt: r.computedAt ?? r.createdAt,
            navigateTo: { module: "PAYROLL_MANAGEMENT", subPage: "payroll-management" },
            canQuickApprove: false,
            canQuickReturn: false,
            returnLabel: "",
            schoolId: r.schoolId as SchoolId | undefined,
          });
        });
    }

    // ── Grade Periods (Principal) ─────────────────────────────────────
    if (role === "PRINCIPAL" || role === "SUPER_ADMIN" || role === "ADMIN") {
      gradePeriods
        .filter((gp) => !gp.isFinalized)
        .slice(0, 6)
        .forEach((gp) => {
          const section = sections.find((s) => s.id === gp.sectionId);
          result.push({
            id: gp.id,
            type: "GRADE",
            reference: gp.label,
            subjectName: `${gp.subjectCode}${section ? " · " + section.name : ""}`,
            submittedAt: "",
            navigateTo: { module: "GRADING" },
            canQuickApprove: false,
            canQuickReturn: false,
            returnLabel: "",
            schoolId: undefined,
          });
        });
    }

    // Sort: oldest submitted first (highest urgency at top)
    result.sort((a, b) => {
      if (!a.submittedAt) return 1;
      if (!b.submittedAt) return -1;
      return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
    });

    return result.slice(0, 10);
  }, [
    currentUser, activeSchool,
    assessments, discountRequests, enrollments, onlineEnrollmentApplications,
    leaveRequests, payrollRuns, gradePeriods, voidRequests,
    students, employees, payrollPeriods, sections,
  ]);

  const overdueCount = items.filter((item) => {
    if (!item.submittedAt) return false;
    const days = Math.floor((Date.now() - new Date(item.submittedAt).getTime()) / (1000 * 60 * 60 * 24));
    return days > 3;
  }).length;

  const handleQuickApprove = async (item: PendingItemData) => {
    if (!currentUser) return;

    if (item.type === "ASMT") {
      const ok = await confirm(`Approve assessment for ${item.subjectName}?`, {
        title: "Confirm Assessment Approval",
        confirmText: "Approve",
        variant: "success",
      });
      if (ok) {
        approveAssessment(item.id, currentUser.name);
        toast("Assessment approved for payment.", { variant: "success" });
      }
    } else if (item.type === "LEAVE") {
      const ok = await confirm(`Approve leave request for ${item.subjectName}?`, {
        title: "Confirm Leave Approval",
        confirmText: "Approve",
        variant: "success",
      });
      if (ok) {
        approveLeaveRequest(item.id, currentUser.name);
        toast("Leave request approved.", { variant: "success" });
      }
    } else if (item.type === "VOID") {
      const ok = await confirm(
        `Approve void of receipt ${item.reference} for ${item.subjectName}? This will mark the OR as voided.`,
        { title: "Approve Void Request", confirmText: "Approve Void", variant: "danger" }
      );
      if (ok) {
        approveVoidRequest(item.id, currentUser.name);
        toast("Void request approved. OR has been voided.", { variant: "success" });
      }
    }
  };

  const handleQuickReturn = async (item: PendingItemData) => {
    if (!currentUser) return;

    if (item.type === "ASMT") {
      const remarks = await prompt("Enter remarks for returning to Registrar:", {
        title: "Return Assessment",
        placeholder: "e.g. Please recompute the lab fees...",
        confirmText: "Return to Registrar",
      });
      if (remarks !== null) {
        returnAssessmentToRegistrar(item.id, currentUser.name, remarks || "No remarks provided.");
        toast("Assessment returned to Registrar.", { variant: "warning" });
      }
    } else if (item.type === "LEAVE") {
      const reason = await prompt("Enter reason for rejection:", {
        title: "Reject Leave Request",
        placeholder: "e.g. Insufficient leave balance...",
        confirmText: "Reject",
        variant: "danger",
      });
      if (reason !== null && reason.trim()) {
        rejectLeaveRequest(item.id, currentUser.name, reason);
        toast("Leave request rejected.", { variant: "danger" });
      }
    } else if (item.type === "VOID") {
      const reason = await prompt("Enter reason for rejecting void request:", {
        title: "Reject Void Request",
        placeholder: "e.g. OR number already processed by BIR...",
        confirmText: "Reject Void",
        variant: "danger",
      });
      if (reason !== null && reason.trim()) {
        rejectVoidRequest(item.id, currentUser.name, reason);
        toast("Void request rejected.", { variant: "danger" });
      }
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm overflow-hidden mb-6">
        <div className="px-5 py-4 flex items-center gap-3 bg-gradient-to-r from-white to-stone-50/60 border-b border-stone-100">
          <div className="w-8 h-8 rounded-xl bg-stsn-gold/10 border border-stsn-gold/20 flex items-center justify-center flex-shrink-0">
            <Inbox className="w-4 h-4 text-stsn-gold" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stsn-brown-dark leading-none">Approval Queue</h3>
            <p className="text-[10.5px] text-stone-400 mt-0.5 leading-none">Items requiring your action</p>
          </div>
        </div>
        <EmptyState
          icon={CheckCircle}
          title="All caught up!"
          description="No pending approvals at this time. Items that require your sign-off will appear here."
          compact
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm overflow-hidden mb-6">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between bg-gradient-to-r from-white to-stone-50/60 border-b border-stone-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-stsn-gold/10 border border-stsn-gold/20 flex items-center justify-center flex-shrink-0">
            <Inbox className="w-4 h-4 text-stsn-gold" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stsn-brown-dark leading-none">Approval Queue</h3>
            <p className="text-[10.5px] text-stone-400 mt-0.5 leading-none">Items requiring your action</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {overdueCount > 0 && (
            <span className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-100">
              <AlertTriangle className="w-3 h-3" />
              {overdueCount} overdue
            </span>
          )}
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-stone-100 text-stone-500 border border-stone-200/60">
            {items.length} pending
          </span>
        </div>
      </div>

      {/* Column headers */}
      <div className="px-5 py-2 flex items-center gap-3 bg-stone-50/80 border-b border-stone-100">
        <span className="text-[8.5px] font-mono font-bold uppercase tracking-widest text-stone-400 w-12 flex-shrink-0">Type</span>
        <span className="text-[8.5px] font-mono font-bold uppercase tracking-widest text-stone-400 w-32 flex-shrink-0">Reference</span>
        <span className="text-[8.5px] font-mono font-bold uppercase tracking-widest text-stone-400 flex-1">Subject / Name</span>
        {showSchoolBadge && (
          <span className="text-[8.5px] font-mono font-bold uppercase tracking-widest text-stone-400 w-14 flex-shrink-0">School</span>
        )}
        <span className="text-[8.5px] font-mono font-bold uppercase tracking-widest text-stone-400 w-12 flex-shrink-0 text-right">Age</span>
        <span className="text-[8.5px] font-mono font-bold uppercase tracking-widest text-stone-400 w-20 flex-shrink-0 text-right">Actions</span>
      </div>

      {/* Items */}
      <div className="divide-y divide-stone-50">
        {items.map((item) => {
          const typeCfg = TYPE_CONFIG[item.type];
          const age = getAge(item.submittedAt);
          const schoolCfg = item.schoolId ? SCHOOL_BADGE[item.schoolId] : null;

          return (
            <div
              key={item.id}
              className={`px-5 py-3 flex items-center gap-3 hover:bg-stone-50/80 transition-colors group ${
                age.isOverdue ? "bg-red-50/20 hover:bg-red-50/40" : ""
              }`}
            >
              {/* Type badge */}
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 w-12 text-center tracking-wide ${typeCfg.bg} ${typeCfg.text}`}
              >
                {typeCfg.label}
              </span>

              {/* Reference */}
              <span className="font-mono text-[10px] text-stone-400 w-32 flex-shrink-0 truncate">
                {item.reference}
              </span>

              {/* Subject name */}
              <span className="text-[12px] font-semibold text-stsn-brown-dark flex-1 truncate">
                {item.subjectName}
              </span>

              {/* School badge (ALL view only) */}
              {showSchoolBadge && (
                <span
                  className={`w-14 flex-shrink-0 text-center text-[8.5px] font-bold px-1.5 py-0.5 rounded-md ${
                    schoolCfg
                      ? `${schoolCfg.bg} ${schoolCfg.text}`
                      : "text-stone-300"
                  }`}
                >
                  {schoolCfg ? schoolCfg.label : "—"}
                </span>
              )}

              {/* Age pill */}
              <span
                className={`text-[9.5px] font-semibold px-2 py-0.5 rounded-full w-12 flex-shrink-0 text-right ${
                  item.submittedAt ? age.pillClass : "text-stone-300"
                }`}
              >
                {item.submittedAt ? age.label : "—"}
              </span>

              {/* Actions */}
              <div className="flex items-center justify-end gap-0.5 w-20 flex-shrink-0">
                {item.canQuickApprove && (
                  <button
                    onClick={() => handleQuickApprove(item)}
                    title="Quick approve"
                    className="p-1.5 rounded-lg hover:bg-emerald-100 text-stone-300 hover:text-emerald-600 transition-colors cursor-pointer group-hover:text-stone-400"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                  </button>
                )}
                {item.canQuickReturn && (
                  <button
                    onClick={() => handleQuickReturn(item)}
                    title={item.returnLabel}
                    className="p-1.5 rounded-lg hover:bg-red-100 text-stone-300 hover:text-red-500 transition-colors cursor-pointer group-hover:text-stone-400"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => onNavigate(item.navigateTo)}
                  title="View in module"
                  className="p-1.5 rounded-lg hover:bg-stsn-gold/10 text-stone-300 hover:text-stsn-brown transition-colors cursor-pointer group-hover:text-stone-400"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-5 py-2.5 border-t border-stone-100 bg-stone-50/40 flex items-center justify-between">
        <p className="text-[9.5px] text-stone-400 font-mono">
          {overdueCount > 0
            ? `${overdueCount} item${overdueCount > 1 ? "s" : ""} exceed 3-day SLA`
            : "All items within SLA"}
        </p>
        <p className="text-[9.5px] text-stone-400">Sorted by urgency — oldest first</p>
      </div>
    </div>
  );
}

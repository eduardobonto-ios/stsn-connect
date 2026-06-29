import React from "react";
import { FileText, GraduationCap, ShieldAlert } from "lucide-react";
import AppCard from "../../../components/common/AppCard";
import AppStatusBadge from "../../../components/common/AppStatusBadge";
import type { Student, StudentAssessment } from "../../../types";

interface ChildSummaryCardProps {
  student: Student;
  latestAssessment?: StudentAssessment;
  pendingRequirementCount: number;
  activeHoldCount: number;
}

export default function ChildSummaryCard({
  student,
  latestAssessment,
  pendingRequirementCount,
  activeHoldCount,
}: ChildSummaryCardProps) {
  return (
    <AppCard className="overflow-hidden p-0" tone="brand">
      <div className="border-b border-stone-100 bg-gradient-to-r from-stsn-cream to-white px-5 py-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-stsn-gold/30 bg-stsn-gold/15">
            <span className="text-sm font-bold text-stsn-brown">
              {student.firstName[0]}
              {student.lastName[0]}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold text-stsn-brown-dark">
              {student.lastName}, {student.firstName} {student.middleName}
            </p>
            <p className="mt-1 text-[11px] text-stone-500">
              LRN: {student.lrn || "—"} • {student.studentNo}
            </p>
            <p className="mt-1 text-[11px] text-stone-500">
              {student.yearLevel} • {student.trackOrCourse || "No program"} • Section {student.section || "—"}
            </p>
          </div>
          <AppStatusBadge status={student.enrollmentStatus} className="mt-1 flex-shrink-0" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-px bg-stone-100 sm:grid-cols-3">
        <div className="bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-3.5 w-3.5 text-stsn-brown" />
            <span className="text-[10px] font-mono uppercase text-stone-400">Academic Context</span>
          </div>
          <p className="mt-2 text-xs font-semibold text-stone-700">
            {student.department}
          </p>
          <p className="mt-1 text-[10px] text-stone-500">
            Current year level and section are shown from the live student profile.
          </p>
        </div>

        <div className="bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-[10px] font-mono uppercase text-stone-400">Billing Snapshot</span>
          </div>
          <p className="mt-2 text-xs font-semibold text-stone-700">
            {latestAssessment ? `Balance: PHP ${latestAssessment.balance.toLocaleString()}` : "No assessment on record"}
          </p>
          <p className="mt-1 text-[10px] text-stone-500">
            Pending requirements: {pendingRequirementCount}
          </p>
        </div>

        <div className="bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
            <span className="text-[10px] font-mono uppercase text-stone-400">Parent Follow-Up</span>
          </div>
          <p className="mt-2 text-xs font-semibold text-stone-700">
            {activeHoldCount > 0 ? `${activeHoldCount} active financial hold${activeHoldCount > 1 ? "s" : ""}` : "No active financial hold"}
          </p>
          <p className="mt-1 text-[10px] text-stone-500">
            This portal stays read-only and parent-appropriate.
          </p>
        </div>
      </div>
    </AppCard>
  );
}

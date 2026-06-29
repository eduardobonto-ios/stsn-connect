/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import {
  GraduationCap, DollarSign, BookOpen, Bell, User, FileText,
  ChevronRight, MessageSquare, AlertCircle, CheckCircle,
} from "lucide-react";
import { useSTSNStore } from "../../../services/store";
import ModulePageHeader from "../../../components/common/ModulePageHeader";
import AppButton from "../../../components/common/AppButton";
import AppCard from "../../../components/common/AppCard";
import AppStatusBadge from "../../../components/common/AppStatusBadge";
import AppEmptyState from "../../../components/common/AppEmptyState";

export default function GuardianPortalPage() {
  const { currentUser, students, assessments, grades, announcements } = useSTSNStore();

  const linkedStudents = useMemo(
    () => students.filter((s) => s.linkedGuardianIds?.includes(currentUser?.id ?? "")),
    [students, currentUser],
  );

  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => linkedStudents[0]?.id ?? "");
  const [consultRequested, setConsultRequested] = useState(false);

  const activeAnnouncements = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return announcements.filter((a) => {
      if (a.expiresAt && a.expiresAt < today) return false;
      if (a.targetRoles && !a.targetRoles.includes("GUARDIAN")) return false;
      return true;
    });
  }, [announcements]);

  if (linkedStudents.length === 0) {
    return (
      <AppEmptyState
        icon={GraduationCap}
        title="No Students Linked"
        description="Your account has no linked student records yet. Please contact the Registrar's office to have your child's account linked to your guardian profile."
      />
    );
  }

  const selectedStudent = linkedStudents.find((s) => s.id === selectedStudentId) ?? linkedStudents[0];
  const studentAssessments = assessments.filter((a) => a.studentId === selectedStudent.id);
  const latestAssessment = studentAssessments[studentAssessments.length - 1];
  const studentGrades = grades.filter((g) => g.studentId === selectedStudent.id);
  const passedCount = studentGrades.filter((g) => g.finalGrade && g.finalGrade >= 75).length;
  const failedCount = studentGrades.filter((g) => g.finalGrade && g.finalGrade < 75).length;

  return (
    <div className="space-y-5">
      <ModulePageHeader
        badge="Guardian Portal"
        badgeIcon={User}
        title="Guardian Portal"
        subtitle={`Welcome, ${currentUser?.name}. Read-only view of your linked student records, finances, and finalized academic results.`}
      />

      {/* Announcements */}
      {activeAnnouncements.length > 0 && (
        <AppCard className="border border-amber-200 bg-amber-50 p-4" tone="brand">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-xs font-bold text-amber-700">School Notices ({activeAnnouncements.length})</span>
          </div>
          <div className="space-y-2">
            {activeAnnouncements.slice(0, 3).map((a) => (
              <div key={a.id} className={`rounded-lg px-3 py-2 border ${a.priority === "urgent" ? "bg-red-50 border-red-200" : "bg-white border-amber-100"}`}>
                <div className="flex items-start gap-2">
                  {a.priority === "urgent" && <AlertCircle className="w-3 h-3 text-red-500 flex-shrink-0 mt-0.5" />}
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-stone-700">{a.title}</p>
                    <p className="text-[10px] text-stone-500 mt-0.5">{a.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AppCard>
      )}

      {/* Student Switcher — shown only when more than one student is linked */}
      {linkedStudents.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {linkedStudents.map((s) => (
            <button
              key={s.id}
              onClick={() => { setSelectedStudentId(s.id); setConsultRequested(false); }}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition whitespace-nowrap ${
                selectedStudentId === s.id
                  ? "bg-stsn-brown text-white border-stsn-brown shadow-sm"
                  : "bg-white text-stone-600 border-stone-200 hover:border-stsn-brown hover:text-stsn-brown"
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${selectedStudentId === s.id ? "bg-white/20 text-white" : "bg-stsn-cream text-stsn-brown"}`}>
                {s.firstName[0]}{s.lastName[0]}
              </span>
              {s.firstName} {s.lastName}
            </button>
          ))}
        </div>
      )}

      {/* Selected Student Card */}
      <AppCard className="overflow-hidden p-0" tone="brand">
        {/* Student header */}
        <div className="px-5 py-4 bg-gradient-to-r from-stsn-cream to-white border-b border-stone-100 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-stsn-gold/15 border border-stsn-gold/30 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-stsn-brown">{selectedStudent.firstName[0]}{selectedStudent.lastName[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-stsn-brown-dark truncate">
              {selectedStudent.lastName}, {selectedStudent.firstName} {selectedStudent.middleName}
            </p>
            <p className="text-[10px] text-stone-500 mt-0.5">
              {selectedStudent.studentNo} · {selectedStudent.yearLevel} {selectedStudent.trackOrCourse} · Section {selectedStudent.section}
            </p>
          </div>
          <AppStatusBadge
            status={selectedStudent.enrollmentStatus}
            className="flex-shrink-0 text-[9px]"
          />
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-3 divide-x divide-stone-100 border-b border-stone-100">
          <div className="px-4 py-3 text-center">
            <p className="text-lg font-black text-stone-900">{studentGrades.length}</p>
            <p className="text-[9px] font-mono uppercase text-stone-400 mt-0.5">Subjects</p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-lg font-black text-emerald-600">{passedCount}</p>
            <p className="text-[9px] font-mono uppercase text-stone-400 mt-0.5">Passed</p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-lg font-black text-red-500">{failedCount}</p>
            <p className="text-[9px] font-mono uppercase text-stone-400 mt-0.5">Failed</p>
          </div>
        </div>

        {/* Grade Summary & Fee Statement */}
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-stone-100">
          {/* Grade Summary */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap className="w-3.5 h-3.5 text-stsn-brown" />
              <span className="text-xs font-bold text-stone-700">Grade Summary</span>
            </div>
            {studentGrades.length === 0 ? (
              <p className="text-[10px] text-stone-400 italic">No finalized grades on record yet.</p>
            ) : (
              <div className="space-y-1.5">
                {studentGrades.slice(0, 6).map((g) => (
                  <div key={g.id} className="flex items-center justify-between text-[11px]">
                    <span className="text-stone-600 truncate flex-1 mr-2">{g.subjectCode}</span>
                    <span className={`font-bold flex-shrink-0 ${
                      g.finalGrade && g.finalGrade >= 75 ? "text-emerald-600" : g.finalGrade ? "text-red-500" : "text-stone-400"
                    }`}>
                      {g.finalGrade ?? "—"}
                    </span>
                  </div>
                ))}
                {studentGrades.length > 6 && (
                  <p className="text-[9px] text-stone-400">+{studentGrades.length - 6} more subjects</p>
                )}
              </div>
            )}
          </div>

          {/* Fee Statement */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-bold text-stone-700">Fee Statement</span>
            </div>
            {!latestAssessment ? (
              <p className="text-[10px] text-stone-400 italic">No assessment on record yet.</p>
            ) : (
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-stone-500">Total Assessment</span>
                  <span className="font-bold text-stone-700">₱{latestAssessment.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Discount</span>
                  <span className="text-emerald-600">– ₱{latestAssessment.discountAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Paid</span>
                  <span className="text-blue-600">– ₱{(latestAssessment.totalAmount - latestAssessment.discountAmount - latestAssessment.balance).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-stone-100 pt-1.5 mt-1.5">
                  <span className="font-bold text-stone-700">Balance</span>
                  <span className={`font-bold ${latestAssessment.balance > 0 ? "text-red-600" : "text-emerald-600"}`}>
                    ₱{latestAssessment.balance.toLocaleString()}
                  </span>
                </div>
                {latestAssessment.balance > 0 && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded-lg">
                    <p className="text-[9px] text-red-600 font-semibold">Outstanding balance. Please coordinate with the Cashier's Office.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="px-5 py-2.5 bg-stone-50/60 border-t border-stone-100 flex items-center gap-2">
          <FileText className="w-3 h-3 text-stone-400" />
          <span className="text-[10px] text-stone-400 font-mono">
            {selectedStudent.department} · {selectedStudent.schoolId ?? "STSN"}
          </span>
          <span className="ml-auto text-[10px] text-stone-400">LRN: {selectedStudent.lrn || "—"}</span>
        </div>
      </AppCard>

      {/* Request Consultation */}
      <AppCard className="p-4" tone="brand">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-800">Request a Consultation</p>
              <p className="text-[10px] text-stone-400 mt-0.5">Schedule a meeting with your child's adviser or guidance counselor.</p>
            </div>
          </div>
          {consultRequested ? (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-[10px] font-bold text-emerald-700">Request Sent</span>
            </div>
          ) : (
            <AppButton
              onClick={() => setConsultRequested(true)}
              variant="primary-college"
              size="sm"
              className="flex-shrink-0"
            >
              Request
            </AppButton>
          )}
        </div>
        {consultRequested && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="text-[10px] text-emerald-700 font-semibold">
              Your consultation request for <strong>{selectedStudent.firstName} {selectedStudent.lastName}</strong> has been submitted. The school will contact you within 1–2 school days to confirm the schedule.
            </p>
          </div>
        )}
      </AppCard>

      {/* Disclaimer */}
      <AppCard className="flex gap-2 border border-blue-100 bg-blue-50 px-4 py-3" tone="muted">
        <BookOpen className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-[10px] text-blue-700 leading-relaxed">
          This is a read-only view. Grade records shown are finalized entries only.
          For concerns about your child's records, please contact the Registrar's Office or Class Adviser.
        </p>
      </AppCard>
    </div>
  );
}

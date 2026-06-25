/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react";
import { GraduationCap, DollarSign, BookOpen, Bell, User, FileText } from "lucide-react";
import { useSTSNStore } from "../../../services/store";
import EmptyState from "../../../components/common/EmptyState";

export default function GuardianPortalPage() {
  const { currentUser, students, assessments, grades, announcements } = useSTSNStore();

  const linkedStudents = useMemo(
    () => students.filter((s) => s.linkedGuardianIds?.includes(currentUser?.id ?? "")),
    [students, currentUser],
  );

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
      <EmptyState
        icon={GraduationCap}
        title="No Students Linked"
        description="Your account has no linked student records yet. Please contact the Registrar's office to have your child's account linked to your guardian profile."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-stsn-gold/10 border border-stsn-gold/20 flex items-center justify-center">
          <User className="w-4 h-4 text-stsn-gold" />
        </div>
        <div>
          <h2 className="text-sm font-display font-bold text-stsn-brown-dark">Guardian Portal</h2>
          <p className="text-[10px] text-stone-400 mt-0.5">Welcome, {currentUser?.name}. Read-only view of your linked student(s).</p>
        </div>
      </div>

      {/* Announcements */}
      {activeAnnouncements.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-xs font-bold text-amber-700">School Notices ({activeAnnouncements.length})</span>
          </div>
          <div className="space-y-2">
            {activeAnnouncements.slice(0, 3).map((a) => (
              <div key={a.id} className={`rounded-lg px-3 py-2 border ${a.priority === "urgent" ? "bg-red-50 border-red-200" : "bg-white border-amber-100"}`}>
                <p className="text-[11px] font-bold text-stone-700">{a.title}</p>
                <p className="text-[10px] text-stone-500 mt-0.5">{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Student cards */}
      {linkedStudents.map((student) => {
        const studentAssessments = assessments.filter((a) => a.studentId === student.id);
        const latestAssessment = studentAssessments[studentAssessments.length - 1];
        const studentGrades = grades.filter((g) => g.studentId === student.id);

        return (
          <div key={student.id} className="bg-white rounded-2xl border border-stsn-beige shadow-sm overflow-hidden">
            {/* Student header */}
            <div className="px-5 py-4 bg-gradient-to-r from-stsn-cream to-white border-b border-stone-100 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-stsn-gold/15 border border-stsn-gold/30 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-stsn-brown">{student.firstName[0]}{student.lastName[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-stsn-brown-dark truncate">
                  {student.lastName}, {student.firstName} {student.middleName}
                </p>
                <p className="text-[10px] text-stone-500 mt-0.5">
                  {student.studentNo} · {student.yearLevel} {student.trackOrCourse} · Section {student.section}
                </p>
              </div>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${
                student.enrollmentStatus === "Enrolled"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                  : student.enrollmentStatus === "Pending" || student.enrollmentStatus === "For Assessment"
                  ? "bg-amber-50 text-amber-700 border-amber-100"
                  : "bg-stone-100 text-stone-600 border-stone-200"
              }`}>
                {student.enrollmentStatus}
              </span>
            </div>

            {/* Tabs row — Grade Summary & Fee Statement */}
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
                    {studentGrades.slice(0, 5).map((g) => (
                      <div key={g.id} className="flex items-center justify-between text-[11px]">
                        <span className="text-stone-600 truncate flex-1">{g.subjectCode}</span>
                        <span className={`font-bold ml-2 flex-shrink-0 ${
                          g.finalGrade && g.finalGrade >= 75 ? "text-emerald-600" : "text-red-500"
                        }`}>
                          {g.finalGrade ?? "—"}
                        </span>
                      </div>
                    ))}
                    {studentGrades.length > 5 && (
                      <p className="text-[9px] text-stone-400">+{studentGrades.length - 5} more subjects</p>
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
                  </div>
                )}
              </div>
            </div>

            {/* Footer info */}
            <div className="px-5 py-2.5 bg-stone-50/60 border-t border-stone-100 flex items-center gap-2">
              <FileText className="w-3 h-3 text-stone-400" />
              <span className="text-[10px] text-stone-400 font-mono">
                {student.department} · {student.schoolId ?? "STSN"}
              </span>
              <span className="ml-auto text-[10px] text-stone-400">LRN: {student.lrn || "—"}</span>
            </div>
          </div>
        );
      })}

      {/* Disclaimer */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex gap-2">
        <BookOpen className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-[10px] text-blue-700 leading-relaxed">
          This is a read-only view. Grade records shown are finalized entries only.
          For concerns about your child's records, please contact the Registrar's Office or Class Adviser.
        </p>
      </div>
    </div>
  );
}

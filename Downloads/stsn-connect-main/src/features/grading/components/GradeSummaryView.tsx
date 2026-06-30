/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { FileCheck } from "lucide-react";
import {
  GradePeriod,
  GradeRosterStudent,
  StudentGradeEntry,
  SubjectClassLoad,
} from "../../../types/grading";
import {
  computePeriodGrade,
  computeTermAverage,
  getRatingBadgeClass,
  getRating,
} from "../utils/gradeCalculations";
import { PreviewModal, ReportCardPreview } from "../../../components/ModalPreviews";
import { useSTSNStore } from "../../../services/store";

interface GradeSummaryViewProps {
  classLoad: SubjectClassLoad;
  students: GradeRosterStudent[];
  periods: GradePeriod[];
  entries: StudentGradeEntry[];
}

export default function GradeSummaryView({
  classLoad,
  students,
  periods,
  entries,
}: GradeSummaryViewProps) {
  const { grades, subjects, students: storeStudents } = useSTSNStore();

  const [reportCardStudentId, setReportCardStudentId] = useState<string | null>(null);

  // Only show periods that belong to this class load
  const activePeriods = periods.filter(
    (p) => p.subjectCode === classLoad.subjectCode && p.sectionId === classLoad.sectionId
  );

  // For Print Card, look up the full Student record from the Zustand store
  const reportCardStudent = reportCardStudentId
    ? storeStudents.find((s) => s.id === reportCardStudentId) ?? null
    : null;

  const reportCardGrades = reportCardStudentId
    ? grades.filter((g) => g.studentId === reportCardStudentId)
    : [];

  const reportCardSubjects = reportCardStudent
    ? subjects.filter((s) => s.department === reportCardStudent.department)
    : [];

  if (students.length === 0) {
    return (
      <div className="py-8 text-center text-stone-400 text-xs italic">
        No students found for this class.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-stone-100">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-100 font-bold text-stone-500 text-[10px] uppercase">
              <th className="p-3 whitespace-nowrap">Student ID</th>
              <th className="p-3 whitespace-nowrap">Roster Student Name</th>
              {activePeriods.map((p) => (
                <th key={p.id} className="p-3 text-center whitespace-nowrap">
                  {p.label}
                  {p.isFinalized && (
                    <span className="ml-1 text-[8px] font-mono bg-stone-200 text-stone-500 px-1 py-0.5 rounded">
                      FINAL
                    </span>
                  )}
                </th>
              ))}
              <th className="p-3 text-center whitespace-nowrap font-mono text-[9px]">
                Term Avg
              </th>
              <th className="p-3 text-center whitespace-nowrap">Rating</th>
              <th className="p-3 text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 font-medium">
            {students.map((student) => {
              const periodGrades = activePeriods.map((p) => {
                const studentEntries = entries.filter((e) => e.studentId === student.id);
                return computePeriodGrade(p, studentEntries, student.id);
              });

              const periodAvgs = periodGrades.map((pg) => pg.weightedAverage);
              const termAvg = computeTermAverage(periodAvgs);
              const badgeClass = getRatingBadgeClass(termAvg);
              const rating = getRating(termAvg);

              return (
                <tr key={student.id} className="hover:bg-stone-50/50">
                  <td className="p-3 font-mono font-semibold text-stone-400">
                    {student.studentNo}
                  </td>
                  <td className="p-3 text-stone-900 font-bold">
                    {student.lastName}, {student.firstName}
                  </td>

                  {/* Period grade cells */}
                  {periodGrades.map((pg, i) => (
                    <td key={activePeriods[i].id} className="p-3 text-center">
                      {pg.weightedAverage != null ? (
                        <span
                          className={[
                            "font-mono font-extrabold text-[11px]",
                            pg.isPassing ? "text-stsn-brown" : "text-red-600",
                          ].join(" ")}
                        >
                          {pg.weightedAverage}%
                        </span>
                      ) : (
                        <span className="text-stone-300 text-[10px] italic">—</span>
                      )}
                    </td>
                  ))}

                  {/* Term average */}
                  <td className="p-3 text-center">
                    <span
                      className={[
                        "font-mono font-extrabold",
                        termAvg == null
                          ? "text-stone-300 text-[10px]"
                          : termAvg >= 75
                            ? "text-stsn-brown"
                            : "text-red-600",
                      ].join(" ")}
                    >
                      {termAvg != null ? `${termAvg}%` : "—"}
                    </span>
                  </td>

                  {/* Rating badge */}
                  <td className="p-3 text-center">
                    {termAvg != null ? (
                      <span
                        className={[
                          "inline-block text-[9.5px] font-bold px-2 py-0.5 rounded-full border",
                          badgeClass,
                        ].join(" ")}
                      >
                        {rating}
                      </span>
                    ) : (
                      <span className="text-[10px] text-stone-400 italic">No Record</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setReportCardStudentId(student.id)}
                      className="bg-stsn-brown hover:bg-stsn-brown-dark text-stsn-cream text-[10px] font-bold px-2.5 py-1 rounded cursor-pointer transition flex items-center gap-1 ml-auto"
                    >
                      <FileCheck className="w-3 h-3" />
                      Print Card
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Report Card Modal (uses existing Zustand grade data) */}
      {reportCardStudentId && reportCardStudent && (
        <PreviewModal
          isOpen={true}
          onClose={() => setReportCardStudentId(null)}
          title="Print official student report card"
        >
          <ReportCardPreview
            student={reportCardStudent}
            grades={reportCardGrades}
            subjects={reportCardSubjects}
          />
        </PreviewModal>
      )}
    </>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  GradePeriod,
  GradeRosterStudent,
  StudentGradeEntry,
  GradeCategoryName,
} from "../../../types/grading";
import {
  computePeriodGrade,
  getRating,
  getRatingBadgeClass,
  normalizeScore,
} from "../utils/gradeCalculations";
import { isScoreInvalid } from "../utils/gradeValidation";
import GradeCellInput from "./GradeCellInput";

// ─── Category color palette (rotates across categories) ─────────────────────
const CATEGORY_COLORS: Record<GradeCategoryName, string> = {
  "Quizzes":            "bg-blue-50 text-blue-700 border-blue-200",
  "Activities":         "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Projects":           "bg-violet-50 text-violet-700 border-violet-200",
  "Assignments":        "bg-amber-50 text-amber-700 border-amber-200",
  "Performance Tasks":  "bg-rose-50 text-rose-700 border-rose-200",
  "Written Exams":      "bg-orange-50 text-orange-700 border-orange-200",
  "Custom":             "bg-stone-50 text-stone-600 border-stone-200",
};

const CATEGORY_CELL_BG: Record<GradeCategoryName, string> = {
  "Quizzes":            "bg-blue-50/30",
  "Activities":         "bg-emerald-50/30",
  "Projects":           "bg-violet-50/30",
  "Assignments":        "bg-amber-50/30",
  "Performance Tasks":  "bg-rose-50/30",
  "Written Exams":      "bg-orange-50/30",
  "Custom":             "bg-stone-50/50",
};

interface GradeSheetTableProps {
  period: GradePeriod;
  students: GradeRosterStudent[];
  entries: StudentGradeEntry[];
  onScoreChange: (studentId: string, gradeItemId: string, score: number | null) => void;
  isReadOnly: boolean;
}

export default function GradeSheetTable({
  period,
  students,
  entries,
  onScoreChange,
  isReadOnly,
}: GradeSheetTableProps) {
  // Ordered unique categories that have items in this period
  const presentCategories: GradeCategoryName[] = [];
  for (const cat of Object.keys(CATEGORY_COLORS) as GradeCategoryName[]) {
    if (period.items.some((i) => i.category === cat)) {
      presentCategories.push(cat);
    }
  }

  // Items sorted by category then order
  const sortedItems = [...period.items].sort((a, b) => {
    const catA = presentCategories.indexOf(a.category);
    const catB = presentCategories.indexOf(b.category);
    if (catA !== catB) return catA - catB;
    return a.order - b.order;
  });

  if (students.length === 0) {
    return (
      <div className="py-8 text-center text-stone-400 text-xs italic">
        No students found for this class.
      </div>
    );
  }

  if (period.items.length === 0) {
    return (
      <div className="py-10 text-center space-y-1">
        <p className="text-stone-500 text-xs font-semibold">No grade items yet.</p>
        <p className="text-stone-400 text-[11px]">
          Click "Add Grade Item" to create the first column for this period.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-stone-100">
      <table className="min-w-max w-full text-left text-xs border-collapse">
        {/* ── Two-row header ─────────────────────────────────────────────── */}
        <thead>
          {/* Row 1: Student Info + Category groups + Computed group */}
          <tr className="bg-stone-50 border-b border-stone-200">
            {/* Student Info (spans 2 rows) */}
            <th
              rowSpan={2}
              className="sticky left-0 z-20 bg-stone-50 p-3 font-bold text-[10px] uppercase text-stone-500 tracking-wide whitespace-nowrap border-r border-stone-200 min-w-[100px]"
            >
              Student ID
            </th>
            <th
              rowSpan={2}
              className="sticky left-[100px] z-20 bg-stone-50 p-3 font-bold text-[10px] uppercase text-stone-500 tracking-wide whitespace-nowrap border-r border-stone-200 min-w-[170px]"
            >
              Student Name
            </th>

            {/* Category group headers */}
            {presentCategories.map((cat) => {
              const catItems = sortedItems.filter((i) => i.category === cat);
              const catConfig = period.categories.find((c) => c.name === cat);
              return (
                <th
                  key={cat}
                  colSpan={catItems.length}
                  className={[
                    "px-2 py-1.5 text-center text-[10px] font-bold uppercase tracking-wide border-r border-white/60",
                    CATEGORY_COLORS[cat],
                  ].join(" ")}
                >
                  {cat}
                  {catConfig ? (
                    <span className="ml-1 text-[9px] font-mono opacity-70">
                      ({catConfig.weight}%)
                    </span>
                  ) : null}
                </th>
              );
            })}

            {/* Computed group */}
            <th
              colSpan={3}
              className="px-2 py-1.5 text-center text-[10px] font-bold uppercase tracking-wide bg-stsn-cream text-stsn-brown-dark border-l border-stsn-beige"
            >
              Computed
            </th>
          </tr>

          {/* Row 2: Item name headers + Computed column headers */}
          <tr className="bg-stone-50 border-b border-stone-200">
            {sortedItems.map((item) => (
              <th
                key={item.id}
                className={[
                  "px-2 py-2 text-center text-[10px] font-bold text-stone-600 whitespace-nowrap border-r border-stone-100",
                  CATEGORY_CELL_BG[item.category],
                ].join(" ")}
              >
                <span className="block">{item.label}</span>
                <span className="text-[9px] font-mono text-stone-400 font-normal">
                  /{item.maxScore}
                </span>
              </th>
            ))}
            <th className="px-2 py-2 text-center text-[10px] font-bold text-stsn-brown whitespace-nowrap bg-stsn-cream/60 border-l border-stsn-beige">
              Weighted Avg
            </th>
            <th className="px-2 py-2 text-center text-[10px] font-bold text-stsn-brown whitespace-nowrap bg-stsn-cream/60">
              Rating
            </th>
            <th className="px-2 py-2 text-center text-[10px] font-bold text-stsn-brown whitespace-nowrap bg-stsn-cream/60">
              Remarks
            </th>
          </tr>
        </thead>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <tbody className="divide-y divide-stone-100">
          {students.map((student, rowIdx) => {
            const studentEntries = entries.filter((e) => e.studentId === student.id);
            const computed = computePeriodGrade(period, studentEntries, student.id);
            const rating = getRating(computed.weightedAverage);
            const badgeClass = getRatingBadgeClass(computed.weightedAverage);

            return (
              <tr
                key={student.id}
                className={rowIdx % 2 === 0 ? "bg-white" : "bg-stone-50/40"}
              >
                {/* Sticky: Student ID */}
                <td className="sticky left-0 z-10 bg-inherit p-3 font-mono text-[10px] font-semibold text-stone-400 whitespace-nowrap border-r border-stone-100 min-w-[100px]">
                  {student.studentNo}
                </td>

                {/* Sticky: Student Name */}
                <td className="sticky left-[100px] z-10 bg-inherit p-3 font-bold text-stone-900 whitespace-nowrap border-r border-stone-100 min-w-[170px]">
                  {student.lastName}, {student.firstName}
                </td>

                {/* Grade item cells */}
                {sortedItems.map((item) => {
                  const entry = studentEntries.find((e) => e.gradeItemId === item.id);
                  const score = entry?.score ?? null;
                  const invalid = isScoreInvalid(score, item.maxScore);
                  const normalized = normalizeScore(score, item.maxScore);

                  return (
                    <td
                      key={item.id}
                      className={[
                        "px-2 py-2 text-center border-r border-stone-100",
                        CATEGORY_CELL_BG[item.category],
                        invalid ? "ring-1 ring-red-300 ring-inset" : "",
                      ].join(" ")}
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <GradeCellInput
                          score={score}
                          maxScore={item.maxScore}
                          isReadOnly={isReadOnly}
                          onChange={(newScore) =>
                            onScoreChange(student.id, item.id, newScore)
                          }
                        />
                        {score != null && !invalid && (
                          <span className="text-[9px] font-mono text-stone-400">
                            {Math.round((normalized ?? 0) * 10) / 10}%
                          </span>
                        )}
                        {invalid && (
                          <span className="text-[9px] text-red-500 font-semibold">
                            exceeds max
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}

                {/* Computed: Weighted Average */}
                <td className="px-2 py-2 text-center bg-stsn-cream/30 border-l border-stsn-beige">
                  <span
                    className={[
                      "font-mono font-extrabold text-[12px]",
                      computed.weightedAverage == null
                        ? "text-stone-300"
                        : computed.isPassing
                          ? "text-stsn-brown"
                          : "text-red-600",
                    ].join(" ")}
                  >
                    {computed.weightedAverage != null
                      ? `${computed.weightedAverage}%`
                      : "—"}
                  </span>
                </td>

                {/* Computed: Rating */}
                <td className="px-2 py-2 text-center bg-stsn-cream/30">
                  {computed.weightedAverage != null ? (
                    <span
                      className={[
                        "inline-block text-[9px] font-bold px-2 py-0.5 rounded-full border",
                        badgeClass,
                      ].join(" ")}
                    >
                      {rating}
                    </span>
                  ) : (
                    <span className="text-stone-300 text-[10px]">—</span>
                  )}
                </td>

                {/* Computed: Remarks */}
                <td className="px-2 py-2 text-center bg-stsn-cream/30">
                  {computed.weightedAverage != null ? (
                    <span
                      className={[
                        "text-[10px] font-bold",
                        computed.isPassing ? "text-emerald-700" : "text-red-600",
                      ].join(" ")}
                    >
                      {computed.isPassing ? "Passed" : "Failed"}
                    </span>
                  ) : (
                    <span className="text-stone-300 text-[10px] italic">No Record</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

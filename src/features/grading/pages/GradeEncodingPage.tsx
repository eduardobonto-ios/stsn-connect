/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
import { GraduationCap, LayoutList, PenLine } from "lucide-react";
import { useSTSNStore } from "../../../services/store";
import {
  GradeItem,
  GradeCategory,
  GradeRosterStudent,
} from "../../../types/grading";
import { departmentToAcademicUnit, getGradingPeriods } from "../../../config/grading-schemes.config";
import { resolveCurrentTeacher } from "../../../utils/resolveTeacher";
import GradeSummaryView from "../components/GradeSummaryView";
import GradeInputView from "../components/GradeInputView";

type ViewMode = "summary" | "input";

export default function GradeEncodingPage() {
  const {
    students: storeStudents, teachers, currentUser, academicUnit,
    classLoads: allClassLoads, gradePeriods: periods, studentGradeEntries: entries, demoStudents,
    saveGradeEntry, addGradeItem, updateGradeCategories, finalizeGradePeriod,
  } = useSTSNStore();

  // ── Identify the current teacher ─────────────────────────────────────────
  const currentTeacher = resolveCurrentTeacher(teachers, currentUser, academicUnit);

  // ── Load state ───────────────────────────────────────────────────────────
  // Only loads matching the active session's academic unit are considered —
  // prevents a stale class/section from a previously selected school lingering.
  const classLoads = useMemo(
    () =>
      allClassLoads.filter(
        (l) =>
          l.teacherId === currentTeacher.id &&
          departmentToAcademicUnit(l.department) === academicUnit
      ),
    [allClassLoads, currentTeacher.id, academicUnit]
  );

  const [activeLoadId, setActiveLoadId] = useState<string>(
    classLoads[0]?.id ?? ""
  );
  const [viewMode, setViewMode] = useState<ViewMode>("summary");

  // If the active class load is no longer valid for the active academic unit
  // (e.g. school context changed), reset to the first valid load.
  useEffect(() => {
    if (!classLoads.find((l) => l.id === activeLoadId)) {
      setActiveLoadId(classLoads[0]?.id ?? "");
    }
  }, [classLoads, activeLoadId]);

  // ── Active class load ─────────────────────────────────────────────────────
  const activeLoad = classLoads.find((l) => l.id === activeLoadId) ?? classLoads[0];

  // ── Student roster (store students + demo students) ───────────────────────
  const allStudents: GradeRosterStudent[] = useMemo(() => {
    const storeConverted: GradeRosterStudent[] = storeStudents.map((s) => ({
      id: s.id,
      studentNo: s.studentNo,
      firstName: s.firstName,
      lastName: s.lastName,
      section: s.section,
      yearLevel: s.yearLevel,
      trackOrCourse: s.trackOrCourse,
      department: s.department,
    }));
    return [...storeConverted, ...demoStudents];
  }, [storeStudents, demoStudents]);

  const classStudents: GradeRosterStudent[] = useMemo(() => {
    if (!activeLoad) return [];
    return activeLoad.studentIds
      .map((id) => allStudents.find((s) => s.id === id))
      .filter((s): s is GradeRosterStudent => s != null);
  }, [activeLoad, allStudents]);

  // ── Periods for the active class load ────────────────────────────────────
  const loadPeriods = useMemo(() => {
    if (!activeLoad) return [];
    return periods.filter(
      (p) =>
        p.subjectCode === activeLoad.subjectCode &&
        p.sectionId === activeLoad.sectionId
    );
  }, [periods, activeLoad]);

  // ── Active period (default to first period label) ─────────────────────────
  const defaultPeriodLabel = activeLoad
    ? getGradingPeriods(departmentToAcademicUnit(activeLoad.department))[0]
    : undefined;

  const [activePeriodId, setActivePeriodId] = useState<string>(
    () => loadPeriods.find((p) => p.label === defaultPeriodLabel)?.id ?? loadPeriods[0]?.id ?? ""
  );

  // Whenever the active class load changes (manual selection, teacher
  // resolution, or academic-unit context switch), re-sync the active period
  // — defaulting to the first period of the load's grading scheme.
  useEffect(() => {
    if (!activeLoad) {
      setActivePeriodId("");
      return;
    }
    if (loadPeriods.some((p) => p.id === activePeriodId)) return;
    const label = getGradingPeriods(departmentToAcademicUnit(activeLoad.department))[0];
    setActivePeriodId(loadPeriods.find((p) => p.label === label)?.id ?? loadPeriods[0]?.id ?? "");
  }, [activeLoad, loadPeriods, activePeriodId]);

  // When load changes, switch the active class load.
  const handleLoadChange = (loadId: string) => {
    setActiveLoadId(loadId);
  };

  // ── Score change handler ──────────────────────────────────────────────────
  const handleScoreChange = (
    studentId: string,
    gradeItemId: string,
    score: number | null
  ) => {
    saveGradeEntry(studentId, gradeItemId, score);
  };

  // ── Add grade item handler ────────────────────────────────────────────────
  const handleAddGradeItem = (
    periodId: string,
    item: GradeItem,
    categoryWeight: number
  ) => {
    addGradeItem(periodId, item, categoryWeight);
  };

  // ── Update category weights handler ──────────────────────────────────────
  const handleUpdateCategoryWeights = (periodId: string, cats: GradeCategory[]) => {
    updateGradeCategories(periodId, cats);
  };

  // ── Finalize period handler ───────────────────────────────────────────────
  const handleFinalizePeriod = (periodId: string) => {
    finalizeGradePeriod(periodId, `${currentTeacher.firstName} ${currentTeacher.lastName}`);
  };

  if (classLoads.length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl border border-stsn-beige text-center text-stone-400 text-xs italic">
        No class assignments found. Contact admin to assign your teaching load.
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in font-sans">
      {/* ── Header card with subject/class selector ─────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-white border border-stsn-beige rounded-xl shadow-sm gap-4">
        <div>
          <h2 className="text-lg font-display font-semibold text-stone-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-stsn-brown" />
            Grade Encoding — {activeLoad?.subjectName}
          </h2>
          <p className="text-stone-400 text-[11px] mt-0.5">
            Section:{" "}
            <strong className="text-stsn-brown">{activeLoad?.sectionName}</strong> ·
            SY {activeLoad?.schoolYear} · {activeLoad?.semester}
          </p>
        </div>

        {/* Subject / class load selector */}
        <select
          value={activeLoadId}
          onChange={(e) => handleLoadChange(e.target.value)}
          className="bg-stone-50 border border-stone-200 text-xs rounded-lg px-3 py-1.5 font-bold focus:outline-none focus:ring-1 focus:ring-stsn-brown w-full sm:w-auto"
        >
          {classLoads.map((load) => (
            <option key={load.id} value={load.id}>
              {load.subjectCode} — {load.sectionName}
            </option>
          ))}
        </select>
      </div>

      {/* ── View-mode tab switcher ─────────────────────────────────────── */}
      <div className="flex gap-2 border-b border-stsn-beige/70 pb-px">
        {(
          [
            { mode: "summary" as ViewMode, icon: LayoutList, label: "Grade Summary" },
            { mode: "input"   as ViewMode, icon: PenLine,    label: "Grade Input"   },
          ] as const
        ).map(({ mode, icon: Icon, label }) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={[
              "flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-lg transition cursor-pointer",
              viewMode === mode
                ? "bg-stsn-brown text-white border-t-2 border-stsn-gold"
                : "text-stone-500 hover:text-stsn-brown-dark",
            ].join(" ")}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Main content card ─────────────────────────────────────────── */}
      <div className="bg-white p-5 rounded-xl border border-stsn-beige shadow-sm space-y-4">
        {/* Roster header */}
        <div className="flex justify-between items-center pb-2 border-b border-stone-100">
          <div>
            <span className="text-[10px] font-mono text-stone-400 block uppercase font-bold">
              {viewMode === "summary" ? "Class Roster" : "Grade Encoding Sheet"}
            </span>
            <h3 className="text-sm font-bold text-stone-900">
              {activeLoad?.subjectName} — {activeLoad?.sectionName}
            </h3>
          </div>
          <span className="text-[10px] font-mono bg-stsn-cream text-stsn-brown-dark rounded-full px-3 py-1 border border-stsn-beige font-bold">
            {classStudents.length} students
          </span>
        </div>

        {/* View content */}
        {viewMode === "summary" ? (
          <GradeSummaryView
            classLoad={activeLoad}
            students={classStudents}
            periods={periods}
            entries={entries}
          />
        ) : (
          <GradeInputView
            classLoad={activeLoad}
            students={classStudents}
            periods={loadPeriods}
            entries={entries}
            activePeriodId={activePeriodId}
            onPeriodSelect={setActivePeriodId}
            onScoreChange={handleScoreChange}
            onAddGradeItem={handleAddGradeItem}
            onUpdateCategoryWeights={handleUpdateCategoryWeights}
            onSaveDraft={() => {}}
            onFinalizePeriod={handleFinalizePeriod}
          />
        )}
      </div>
    </div>
  );
}

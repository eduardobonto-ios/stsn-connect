/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
import { GraduationCap, LayoutList, PenLine, Send, CheckCircle, RotateCcw, Clock } from "lucide-react";
import { useSTSNStore } from "../../../services/store";
import { useAppDialog } from "../../../components/common/useAppDialog";
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
    classLoads: allClassLoads, gradePeriods: periods, studentGradeEntries: entries,
    saveGradeEntry, addGradeItem, updateGradeCategories, finalizeGradePeriod, submitGradePeriod,
  } = useSTSNStore();

  const { confirm, toast } = useAppDialog();

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

  // ── Student roster from persisted student records only ─────────────────────
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
    return storeConverted;
  }, [storeStudents]);

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

  // ── Active period object (for approval status banner) ─────────────────────
  const activePeriod = useMemo(
    () => loadPeriods.find(p => p.id === activePeriodId),
    [loadPeriods, activePeriodId]
  );

  // ── Submit-for-approval handler ───────────────────────────────────────────
  const handleSubmitForApproval = async () => {
    if (!activePeriod) return;
    const ok = await confirm(
      `Submit ${activePeriod.label} — ${activePeriod.subjectCode} for principal approval? Grades will be locked for review.`
    );
    if (!ok) return;
    submitGradePeriod(activePeriod.id, `${currentTeacher.firstName} ${currentTeacher.lastName}`);
    toast("Grade period submitted for principal approval.");
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
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-stsn-cream text-stsn-brown border border-stsn-beige flex-shrink-0">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-mono uppercase tracking-widest text-stone-400 font-bold">Grade Encoding</p>
            <h2 className="text-xl font-black text-stsn-brown truncate">
              {activeLoad?.subjectName ?? "No subject selected"}
            </h2>
            <p className="text-stone-500 text-[11px] mt-0.5">
              Section:{" "}
              <strong className="text-stsn-brown">{activeLoad?.sectionName}</strong> ·
              SY {activeLoad?.schoolYear} · {activeLoad?.semester}
            </p>
          </div>
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

      {/* ── Grade approval status banner ─────────────────────────────── */}
      {activePeriod && (() => {
        const status = activePeriod.gradeApprovalStatus;
        if (status === "Approved") {
          return (
            <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-emerald-800">Period Approved</p>
                <p className="text-[10px] text-emerald-700">
                  {activePeriod.label} — {activePeriod.subjectCode} was approved and finalized by {activePeriod.approvedBy ?? "Principal"} on {activePeriod.approvedAt?.split(" ")[0] ?? ""}.
                </p>
              </div>
            </div>
          );
        }
        if (status === "Submitted") {
          return (
            <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
              <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-amber-800">Awaiting Principal Approval</p>
                <p className="text-[10px] text-amber-700">
                  {activePeriod.label} — {activePeriod.subjectCode} submitted on {activePeriod.submittedAt?.split(" ")[0] ?? ""}. Grades are locked for review.
                </p>
              </div>
            </div>
          );
        }
        if (status === "Returned") {
          return (
            <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
              <RotateCcw className="w-4 h-4 text-red-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-red-800">Returned for Revision</p>
                <p className="text-[10px] text-red-700">
                  Remarks: {activePeriod.returnRemarks ?? "No remarks provided."}
                </p>
              </div>
              {activePeriod.isFinalized && (
                <button
                  onClick={handleSubmitForApproval}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold bg-stsn-brown text-white rounded-lg hover:opacity-90 transition cursor-pointer flex-shrink-0"
                >
                  <Send className="w-3 h-3" /> Re-submit
                </button>
              )}
            </div>
          );
        }
        if (activePeriod.isFinalized) {
          return (
            <div className="flex items-center gap-3 px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl">
              <Send className="w-4 h-4 text-stone-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-stone-700">Ready to Submit</p>
                <p className="text-[10px] text-stone-500">
                  {activePeriod.label} — {activePeriod.subjectCode} is finalized. Submit for principal approval to complete the grading cycle.
                </p>
              </div>
              <button
                onClick={handleSubmitForApproval}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold bg-stsn-brown text-white rounded-lg hover:opacity-90 transition cursor-pointer flex-shrink-0"
              >
                <Send className="w-3 h-3" /> Submit for Approval
              </button>
            </div>
          );
        }
        return null;
      })()}

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

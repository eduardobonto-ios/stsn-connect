/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback } from "react";
import {
  GraduationCap,
  Users,
  CheckCircle,
  BarChart2,
  TrendingUp,
  AlertTriangle,
  Clock,
  ShieldOff,
  ChevronDown,
  ChevronRight,
  BookOpen,
  UserCheck,
} from "lucide-react";
import { useSTSNStore } from "../../../services/store";
import type { UserRole } from "../../../types";
import type {
  GradeRosterStudent,
  GradePeriodLabel,
  SubjectClassLoad,
  GradePeriod,
  StudentGradeEntry,
} from "../../../types/grading";
import { BASIC_ED_PERIODS, COLLEGE_PERIODS } from "../../../types/grading";
import { departmentToAcademicUnit } from "../../../config/grading-schemes.config";
import { getAcademicTerms } from "../../../config/schools.config";
import {
  computePeriodGrade,
  computeTermAverage,
  getRating,
  getRatingBadgeClass,
} from "../utils/gradeCalculations";
import STSNDataTable, { type STSNColumn } from "../../../components/common/STSNDataTable";

// ── Constants ───────────────────────────────────────────────────────────────

// Principal = SUPER_ADMIN / ADMIN; grading master access also granted to REGISTRAR
const ALLOWED_ROLES: UserRole[] = ["SUPER_ADMIN", "ADMIN", "REGISTRAR"];

// ── Types ───────────────────────────────────────────────────────────────────

type StudentGradeRow = {
  id: string;
  studentNo: string;
  fullName: string;
  termAverage: number | null;
  rating: string;
  isPassing: boolean | null;
  [key: string]: unknown;
};

// ── Helper ───────────────────────────────────────────────────────────────────

function buildStudentRows(
  loadsForSection: SubjectClassLoad[],
  scopedPeriods: GradePeriod[],
  allStudents: GradeRosterStudent[],
  entries: StudentGradeEntry[],
  selectedPeriodLabel: GradePeriodLabel | ""
): StudentGradeRow[] {
  const studentIds = Array.from(new Set(loadsForSection.flatMap(l => l.studentIds)));
  const students = studentIds
    .map(id => allStudents.find(s => s.id === id))
    .filter((s): s is GradeRosterStudent => s != null);

  return students.map(student => {
    const studentEntries = entries.filter(e => e.studentId === student.id);
    const subjectGrades: Record<string, number | null> = {};

    for (const load of loadsForSection) {
      const relevantPeriods = scopedPeriods.filter(
        p =>
          p.subjectCode === load.subjectCode &&
          p.sectionId === load.sectionId &&
          (selectedPeriodLabel ? p.label === selectedPeriodLabel : true) &&
          p.isFinalized
      );
      const periodGrades = relevantPeriods.map(
        p => computePeriodGrade(p, studentEntries, student.id).weightedAverage
      );
      subjectGrades[`s_${load.id}`] = computeTermAverage(periodGrades);
    }

    const allGrades = Object.values(subjectGrades);
    const termAverage = computeTermAverage(allGrades);

    return {
      id: student.id,
      studentNo: student.studentNo,
      fullName: `${student.lastName}, ${student.firstName}`,
      termAverage,
      rating: getRating(termAverage),
      isPassing: termAverage != null ? termAverage >= 75 : null,
      ...subjectGrades,
    };
  });
}

// ── Nested student grade table ───────────────────────────────────────────────

interface SectionDetailViewProps {
  loadsForSection: SubjectClassLoad[];
  scopedPeriods: GradePeriod[];
  allStudents: GradeRosterStudent[];
  entries: StudentGradeEntry[];
  selectedPeriodLabel: GradePeriodLabel | "";
  isBasicEd: boolean;
  cacheKey: string;
}

function SectionDetailView({
  loadsForSection,
  scopedPeriods,
  allStudents,
  entries,
  selectedPeriodLabel,
  isBasicEd,
  cacheKey,
}: SectionDetailViewProps) {
  const rows = useMemo(
    () => buildStudentRows(loadsForSection, scopedPeriods, allStudents, entries, selectedPeriodLabel),
    [loadsForSection, scopedPeriods, allStudents, entries, selectedPeriodLabel]
  );

  const columns = useMemo((): STSNColumn<StudentGradeRow>[] => [
    { title: "Student No.", data: "studentNo", width: "110px" },
    { title: "Student Name", data: "fullName" },
    ...loadsForSection.map(load => ({
      title: load.subjectCode,
      data: `s_${load.id}` as string,
      className: "text-center",
      orderable: true,
      render: (value: unknown) => {
        const v = value as number | null;
        return v != null ? (
          <span
            className={`font-mono font-bold text-[11px] ${v >= 75 ? (isBasicEd ? "text-stsn-brown" : "text-blue-700") : "text-red-600"}`}
          >
            {v}%
          </span>
        ) : (
          <span className="text-stone-300 text-[10px] italic">—</span>
        );
      },
    })),
    {
      title: "Average",
      data: "termAverage",
      className: "text-center",
      render: (value: unknown) => {
        const v = value as number | null;
        return v != null ? (
          <span className={`font-mono font-bold text-xs ${v >= 75 ? (isBasicEd ? "text-stsn-brown" : "text-blue-700") : "text-red-600"}`}>
            {v}%
          </span>
        ) : (
          <span className="text-stone-300 text-[10px] italic">—</span>
        );
      },
    },
    {
      title: "Rating",
      data: "rating",
      className: "text-center",
      searchable: false,
      orderable: false,
      render: (_: unknown, row: StudentGradeRow) =>
        row.termAverage != null ? (
          <span
            className={`inline-block text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${getRatingBadgeClass(row.termAverage as number)}`}
          >
            {row.rating}
          </span>
        ) : (
          <span className="text-[10px] text-stone-400 italic">No Record</span>
        ),
    },
  ], [loadsForSection, isBasicEd]);

  const passing = rows.filter(r => r.isPassing === true).length;
  const failing = rows.filter(r => r.isPassing === false).length;

  return (
    <tr>
      <td colSpan={8} className="p-0 border-0">
        <div className={`border-t border-b ${isBasicEd ? "border-stsn-beige bg-stone-50/70" : "border-blue-100 bg-blue-50/40"} px-5 pt-4 pb-5`}>
          {/* Mini stat strip */}
          <div className="flex items-center gap-4 mb-3">
            <span className="text-[10px] font-mono uppercase font-bold text-stone-400 tracking-wide">
              {selectedPeriodLabel || "All Finalized Periods"} · Student Grades
            </span>
            <div className="flex items-center gap-3 ml-auto">
              {[
                { label: "Students", value: rows.length, color: "text-stone-600" },
                { label: "Passing", value: passing, color: "text-emerald-600" },
                { label: "Failing", value: failing, color: "text-red-600" },
              ].map(s => (
                <span key={s.label} className="text-[10px] font-mono">
                  <span className={`font-bold ${s.color}`}>{s.value}</span>
                  <span className="text-stone-400"> {s.label}</span>
                </span>
              ))}
            </div>
          </div>

          <STSNDataTable<StudentGradeRow>
            key={cacheKey}
            columns={columns}
            rows={rows}
            emptyMessage="No graded students found for this selection."
            pageLength={50}
            searchable={false}
          />
        </div>
      </td>
    </tr>
  );
}

// ── Main page component ──────────────────────────────────────────────────────

export default function GradesDirectoryPage() {
  const {
    students: storeStudents,
    classLoads: allClassLoads,
    gradePeriods: periods,
    studentGradeEntries: entries,
    demoStudents,
    academicUnit,
    currentUser,
    activeSchool,
    sections: storeSections,
  } = useSTSNStore();

  const isBasicEd = academicUnit === "basic-ed";
  const terms = useMemo(() => getAcademicTerms(academicUnit), [academicUnit]);
  const periodLabels = isBasicEd ? BASIC_ED_PERIODS : COLLEGE_PERIODS;

  // Role access guard — principal (SUPER_ADMIN/ADMIN) and REGISTRAR only
  const hasAccess = !currentUser || ALLOWED_ROLES.includes(currentUser.role);

  const schoolLabel =
    activeSchool === "STSN"
      ? "St. Theresa's School of Novaliches"
      : activeSchool === "CDSTA"
        ? "Colegio de Sta. Teresa de Avila"
        : "All Institutions";

  // Class loads scoped to the current academic unit (department = scope boundary)
  const classLoads = useMemo(
    () => allClassLoads.filter(l => departmentToAcademicUnit(l.department) === academicUnit),
    [allClassLoads, academicUnit]
  );

  // Scope grade periods through class loads to prevent cross-unit period mixing.
  // Without this, College Prelim/Midterm/Final periods can appear under Basic Ed
  // sections when both share overlapping subjectCode or sectionId values.
  const scopedPeriods = useMemo(() => {
    const validPairs = new Set(classLoads.map(l => `${l.subjectCode}::${l.sectionId}`));
    return periods.filter(p => validPairs.has(`${p.subjectCode}::${p.sectionId}`));
  }, [classLoads, periods]);

  // Unique section names derived from scoped class loads
  const sectionNames = useMemo(
    () => Array.from(new Set(classLoads.map(l => l.sectionName))).sort(),
    [classLoads]
  );

  // Overview stats
  const overviewStats = useMemo(() => ({
    totalLoads: classLoads.length,
    totalSections: sectionNames.length,
    finalizedPeriods: scopedPeriods.filter(p => p.isFinalized).length,
    totalPeriods: scopedPeriods.length,
  }), [classLoads, scopedPeriods, sectionNames]);

  // All students (store + demo roster)
  const allStudents = useMemo<GradeRosterStudent[]>(() => {
    const converted: GradeRosterStudent[] = storeStudents.map(s => ({
      id: s.id,
      studentNo: s.studentNo,
      firstName: s.firstName,
      lastName: s.lastName,
      section: s.section,
      yearLevel: s.yearLevel,
      trackOrCourse: s.trackOrCourse,
      department: s.department,
    }));
    return [...converted, ...demoStudents];
  }, [storeStudents, demoStudents]);

  // Period label filter — empty means "all finalized periods"
  const [selectedPeriodLabel, setSelectedPeriodLabel] = useState<GradePeriodLabel | "">("");

  // Expanded section set
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = useCallback((name: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(name)) { next.delete(name); } else { next.add(name); }
      return next;
    });
  }, []);

  // Section summary data for the master table rows
  const sectionSummaries = useMemo(() => {
    return sectionNames.map(sectionName => {
      const loadsForSection = classLoads.filter(l => l.sectionName === sectionName);
      const sectionRecord = storeSections.find(s => s.name === sectionName);
      const adviserName = sectionRecord?.adviserName ?? "—";

      // Periods relevant to this section, optionally filtered by selected period label
      const relevantPeriods = scopedPeriods.filter(p => {
        const inSection = loadsForSection.some(
          l => l.subjectCode === p.subjectCode && l.sectionId === p.sectionId
        );
        return inSection && (selectedPeriodLabel ? p.label === selectedPeriodLabel : true);
      });

      const finalizedCount = relevantPeriods.filter(p => p.isFinalized).length;
      const allFinalized = relevantPeriods.length > 0 && finalizedCount === relevantPeriods.length;
      const partiallyFinalized = finalizedCount > 0 && !allFinalized;

      // Pass rate — computed from finalized periods only
      const studentIds = Array.from(new Set(loadsForSection.flatMap(l => l.studentIds)));
      const students = studentIds
        .map(id => allStudents.find(s => s.id === id))
        .filter((s): s is GradeRosterStudent => s != null);

      const allGrades: number[] = [];
      let passingCount = 0;
      for (const student of students) {
        const studentEntries = entries.filter(e => e.studentId === student.id);
        for (const p of relevantPeriods.filter(p => p.isFinalized)) {
          const g = computePeriodGrade(p, studentEntries, student.id).weightedAverage;
          if (g != null) { allGrades.push(g); if (g >= 75) passingCount++; }
        }
      }

      const avgGrade = allGrades.length > 0
        ? Math.round((allGrades.reduce((a, b) => a + b, 0) / allGrades.length) * 10) / 10
        : null;
      const passingRate = allGrades.length > 0
        ? Math.round((passingCount / allGrades.length) * 100)
        : null;

      return {
        sectionName,
        adviserName,
        totalStudents: students.length,
        totalSubjects: loadsForSection.length,
        finalizedCount,
        totalPeriodsForSection: relevantPeriods.length,
        allFinalized,
        partiallyFinalized,
        avgGrade,
        passingRate,
        loadsForSection,
      };
    });
  }, [sectionNames, classLoads, storeSections, scopedPeriods, selectedPeriodLabel, allStudents, entries]);

  // ── Access guard ─────────────────────────────────────────────────────────

  if (!hasAccess) {
    return (
      <div className="bg-white p-12 rounded-xl border border-stsn-beige text-center space-y-2">
        <ShieldOff className="w-10 h-10 text-stone-200 mx-auto" />
        <h3 className="text-sm font-bold text-stone-700">Access Restricted</h3>
        <p className="text-stone-400 text-xs">
          The Master Grading Directory is available to principals and registrars only.
        </p>
      </div>
    );
  }

  // ── Empty state ──────────────────────────────────────────────────────────

  if (classLoads.length === 0) {
    return (
      <div className="bg-white p-12 rounded-xl border border-stsn-beige text-center space-y-2">
        <GraduationCap className="w-10 h-10 text-stone-200 mx-auto" />
        <h3 className="text-sm font-bold text-stone-700">No Class Loads Found</h3>
        <p className="text-stone-400 text-xs">
          No class loads have been configured for the current academic session and school context.
        </p>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 animate-fade-in font-sans">

      {/* ── Module Header ── */}
      <div
        className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 rounded-xl shadow-sm gap-4 ${
          isBasicEd ? "bg-white border border-stsn-beige" : "bg-blue-50 border border-blue-200"
        }`}
      >
        <div>
          <div
            className={`text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded-full border inline-block mb-1.5 ${
              isBasicEd ? "badge-basic-ed" : "badge-college"
            }`}
          >
            {isBasicEd ? "K-12 Basic Education" : "Tertiary / College Division"}
          </div>
          <h2 className="text-xl font-display font-semibold text-stone-900 tracking-tight flex items-center gap-2">
            <GraduationCap className={`w-5 h-5 ${isBasicEd ? "text-stsn-brown" : "text-blue-600"}`} />
            Master Grading Directory
          </h2>
          <p className="text-stone-500 text-xs mt-1">
            {schoolLabel} · {overviewStats.totalSections} {terms.groupNoun.toLowerCase()}s · {overviewStats.totalLoads} class loads
          </p>
        </div>
        <div className="hidden sm:flex flex-col items-end gap-1">
          <span
            className={`text-[10px] font-mono font-bold px-3 py-1.5 rounded-lg border ${
              isBasicEd
                ? "bg-stsn-cream text-stsn-brown-dark border-stsn-beige"
                : "bg-blue-100 text-blue-700 border-blue-200"
            }`}
          >
            {isBasicEd ? "Quarter-Based Grading (K-12)" : "Prelim / Midterm / Final"}
          </span>
          <p className="text-[10px] text-stone-400 font-mono">
            {overviewStats.finalizedPeriods}/{overviewStats.totalPeriods} periods finalized
          </p>
        </div>
      </div>

      {/* ── Overview Quick Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Class Loads",
            value: overviewStats.totalLoads,
            icon: BookOpen,
            color: isBasicEd ? "text-stsn-brown" : "text-blue-600",
            bg: isBasicEd ? "bg-stsn-cream" : "bg-blue-50",
          },
          {
            label: `${terms.groupNoun}s`,
            value: overviewStats.totalSections,
            icon: Users,
            color: "text-stone-700",
            bg: "bg-stone-50",
          },
          {
            label: "Periods Finalized",
            value: overviewStats.finalizedPeriods,
            icon: CheckCircle,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Pending Periods",
            value: Math.max(0, overviewStats.totalPeriods - overviewStats.finalizedPeriods),
            icon: Clock,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white border border-stsn-beige rounded-xl p-4 flex items-start gap-3"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${stat.bg}`}>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-stone-400 tracking-wide leading-tight">
                  {stat.label}
                </p>
                <p className={`text-2xl font-display font-bold mt-0.5 ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Master Table ── */}
      <div className="bg-white rounded-xl border border-stsn-beige shadow-sm overflow-hidden">

        {/* Table header bar */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b ${isBasicEd ? "border-stsn-beige" : "border-blue-100"}`}>
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-stone-400 block">
              Principal Overview
            </span>
            <h3 className="text-sm font-bold text-stone-900 mt-0.5">
              Grade Records by {terms.groupNoun}
            </h3>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Click a row to expand and view student grades · averages from finalized periods only
            </p>
          </div>

          {/* Period filter pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono text-stone-400 uppercase font-bold mr-1">Period:</span>
            <button
              onClick={() => setSelectedPeriodLabel("")}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition cursor-pointer ${
                selectedPeriodLabel === ""
                  ? isBasicEd
                    ? "bg-stsn-brown text-white border-stsn-brown"
                    : "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-stone-500 border-stone-200 hover:border-stone-400"
              }`}
            >
              All
            </button>
            {periodLabels.map(label => (
              <button
                key={label}
                onClick={() => setSelectedPeriodLabel(label)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition cursor-pointer ${
                  selectedPeriodLabel === label
                    ? isBasicEd
                      ? "bg-stsn-brown text-white border-stsn-brown"
                      : "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-stone-500 border-stone-200 hover:border-stone-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className={`text-white text-[10px] uppercase font-bold ${isBasicEd ? "bg-stsn-brown" : "bg-blue-700"}`}>
                <th className="pl-5 pr-3 py-3 text-left w-6" />
                <th className="px-3 py-3 text-left">{terms.groupNoun}</th>
                <th className="px-3 py-3 text-left">Class Adviser</th>
                <th className="px-3 py-3 text-center">
                  {selectedPeriodLabel || "Period"}
                </th>
                <th className="px-3 py-3 text-center">Subjects</th>
                <th className="px-3 py-3 text-center">Status</th>
                <th className="px-3 py-3 text-center">Pass Rate</th>
                <th className="px-3 py-3 text-center">Avg. Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {sectionSummaries.map((row, idx) => {
                const isExpanded = expandedSections.has(row.sectionName);

                let statusBadge: React.ReactNode;
                if (row.allFinalized) {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                      <CheckCircle className="w-2.5 h-2.5" /> Finalized
                    </span>
                  );
                } else if (row.partiallyFinalized) {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                      <Clock className="w-2.5 h-2.5" /> Partial
                    </span>
                  );
                } else {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border bg-stone-50 text-stone-400 border-stone-200">
                      <Clock className="w-2.5 h-2.5" /> Not Yet
                    </span>
                  );
                }

                return (
                  <React.Fragment key={row.sectionName}>
                    <tr
                      onClick={() => toggleSection(row.sectionName)}
                      className={`cursor-pointer transition-colors select-none ${
                        isExpanded
                          ? isBasicEd ? "bg-stsn-cream/60" : "bg-blue-50/60"
                          : idx % 2 === 0 ? "bg-white hover:bg-stone-50" : "bg-stone-50/50 hover:bg-stone-100/60"
                      }`}
                    >
                      {/* Expand toggle */}
                      <td className="pl-5 pr-3 py-3 text-stone-400">
                        {isExpanded ? (
                          <ChevronDown className={`w-3.5 h-3.5 ${isBasicEd ? "text-stsn-brown" : "text-blue-600"}`} />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </td>

                      {/* Section name */}
                      <td className="px-3 py-3">
                        <div className={`font-bold text-xs ${isBasicEd ? "text-stsn-brown" : "text-blue-700"}`}>
                          {row.sectionName}
                        </div>
                        <div className="text-[10px] text-stone-400 mt-0.5">
                          {row.totalStudents} student{row.totalStudents !== 1 ? "s" : ""}
                        </div>
                      </td>

                      {/* Class adviser */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-3 h-3 text-stone-300 flex-shrink-0" />
                          <span className="text-stone-600 font-medium">{row.adviserName}</span>
                        </div>
                      </td>

                      {/* Period being shown */}
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`text-[9.5px] font-bold font-mono px-2 py-0.5 rounded border ${
                            isBasicEd
                              ? "bg-stsn-cream text-stsn-brown-dark border-stsn-beige"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          {selectedPeriodLabel || "All"}
                        </span>
                      </td>

                      {/* Subjects */}
                      <td className="px-3 py-3 text-center">
                        <span className="font-mono text-stone-600">
                          <span className={`font-bold ${row.finalizedCount > 0 ? "text-emerald-600" : "text-stone-400"}`}>
                            {row.finalizedCount}
                          </span>
                          <span className="text-stone-300">/{row.totalPeriodsForSection}</span>
                        </span>
                        <div className="text-[9px] text-stone-400">finalized</div>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3 text-center">{statusBadge}</td>

                      {/* Pass rate */}
                      <td className="px-3 py-3 text-center">
                        {row.passingRate != null ? (
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-16 bg-stone-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full ${
                                  row.passingRate >= 80
                                    ? "bg-emerald-500"
                                    : row.passingRate >= 60
                                      ? "bg-amber-500"
                                      : "bg-red-500"
                                }`}
                                style={{ width: `${row.passingRate}%` }}
                              />
                            </div>
                            <span
                              className={`font-mono font-bold text-[11px] ${
                                row.passingRate >= 80
                                  ? "text-emerald-600"
                                  : row.passingRate >= 60
                                    ? "text-amber-600"
                                    : "text-red-600"
                              }`}
                            >
                              {row.passingRate}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-stone-300 text-[10px] italic">—</span>
                        )}
                      </td>

                      {/* Avg. grade */}
                      <td className="px-3 py-3 text-center">
                        {row.avgGrade != null ? (
                          <div>
                            <span
                              className={`font-mono font-bold text-xs ${
                                row.avgGrade >= 75
                                  ? isBasicEd ? "text-stsn-brown" : "text-blue-700"
                                  : "text-red-600"
                              }`}
                            >
                              {row.avgGrade}%
                            </span>
                            <div
                              className={`text-[9px] font-bold mt-0.5 ${
                                getRatingBadgeClass(row.avgGrade)
                                  .split(" ")
                                  .find(c => c.startsWith("text-")) ?? "text-stone-400"
                              }`}
                            >
                              {getRating(row.avgGrade)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-stone-300 text-[10px] italic">—</span>
                        )}
                      </td>
                    </tr>

                    {/* Expanded nested student grade table */}
                    {isExpanded && (
                      <SectionDetailView
                        loadsForSection={row.loadsForSection}
                        scopedPeriods={scopedPeriods}
                        allStudents={allStudents}
                        entries={entries}
                        selectedPeriodLabel={selectedPeriodLabel}
                        isBasicEd={isBasicEd}
                        cacheKey={`${row.sectionName}-${selectedPeriodLabel}`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        <div className={`px-5 py-3 border-t text-[10px] text-stone-400 font-mono flex items-center justify-between ${isBasicEd ? "border-stsn-beige bg-stsn-cream/30" : "border-blue-100 bg-blue-50/30"}`}>
          <span>
            {sectionSummaries.length} {terms.groupNoun.toLowerCase()}{sectionSummaries.length !== 1 ? "s" : ""} ·{" "}
            {sectionSummaries.filter(s => s.allFinalized).length} fully finalized
          </span>
          <span>
            {selectedPeriodLabel
              ? `Showing: ${selectedPeriodLabel}`
              : "Showing: All Finalized Periods"}
          </span>
        </div>
      </div>
    </div>
  );
}

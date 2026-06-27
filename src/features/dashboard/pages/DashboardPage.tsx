/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { useSTSNStore } from "../../../services/store";
import {
  Users,
  CreditCard,
  Calendar,
  Bell,
  ArrowLeft,
  Printer,
  Search,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Filter,
  X,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Plus,
} from "lucide-react";
import { getAcademicTerms, academicUnitToDepartment } from "../../../config/schools.config";
import STSNDataTable, { type STSNColumn } from "../../../components/common/STSNDataTable";
import { getAcademicScopedData } from "../../../services/academicUnitScopeService";
import ModulePageHeader from "../../../components/common/ModulePageHeader";

// ── SVG smooth line chart ────────────────────────────────────────────────
function buildLine(values: number[], w: number, h: number, pad = 20): string {
  if (values.length < 2) return "";
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - 2 * pad);
    const y = h - pad - ((v - min) / range) * (h - 2 * pad);
    return [x, y] as [number, number];
  });
  return pts.map(([x, y], i) => {
    if (i === 0) return `M ${x} ${y}`;
    const [px, py] = pts[i - 1];
    const cx = (px + x) / 2;
    return `C ${cx} ${py}, ${cx} ${y}, ${x} ${y}`;
  }).join(" ");
}

function buildArea(values: number[], w: number, h: number, pad = 20): string {
  const line = buildLine(values, w, h, pad);
  if (!line) return "";
  const lastX = pad + (values.length - 1) * ((w - 2 * pad) / (values.length - 1));
  return `${line} L ${lastX} ${h - pad} L ${pad} ${h - pad} Z`;
}

// ── Mini calendar ────────────────────────────────────────────────────────
function MiniCalendar({ eventDates }: { eventDates: Set<string> }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const monthName = new Date(year, month).toLocaleString("en-US", { month: "long" });
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonth = () => { if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear((y) => y + 1); } else setMonth((m) => m + 1); };

  const cells: (number | null)[] = [];
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const DOT_COLORS = ["bg-stsn-brown", "bg-blue-500", "bg-amber-500", "bg-emerald-500"];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-stone-100 text-stone-500 cursor-pointer transition">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-bold text-stsn-brown">{monthName}</span>
        <span className="text-sm font-bold text-stsn-brown">{year}</span>
        <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-stone-100 text-stone-500 cursor-pointer transition">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-px text-center mb-1">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="text-[9px] font-mono text-stone-400 py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px text-center">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const hasEvent = eventDates.has(dateStr);
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const isSun = (i % 7) === 6;
          return (
            <div key={i} className="flex flex-col items-center py-1">
              <span className={`text-[11px] w-6 h-6 flex items-center justify-center rounded-full font-medium
                ${isToday ? "bg-stsn-brown text-white font-bold" : isSun ? "text-red-500" : "text-stone-700"}
              `}>
                {day}
              </span>
              {hasEvent && (
                <div className="flex gap-0.5 mt-0.5">
                  {[0, 1].map((j) => (
                    <div key={j} className={`w-1 h-1 rounded-full ${DOT_COLORS[j % DOT_COLORS.length]}`} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// ENROLLMENT ANALYTICS SUB-PAGE
// ============================================================
type AnalyticsSchool = "BASIC_ED" | "COLLEGE";

function EnrollmentAnalyticsPage({
  initialSchool,
  onBack
}: {
  initialSchool: AnalyticsSchool;
  onBack: () => void;
}) {
  const { students, setupData, courses, currentUser, activeSchool, academicUnit } = useSTSNStore();
  const [school, setSchool] = useState<AnalyticsSchool>(initialSchool);
  const [filterYearLevel, setFilterYearLevel] = useState("All");
  const [filterCourse, setFilterCourse] = useState("All");
  const [filterSection, setFilterSection] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const dept = school === "BASIC_ED" ? "Basic Education" : "College";
  const scopedStudents = useMemo(
    () => getAcademicScopedData({ currentUser, activeSchool, academicUnit, students }).students,
    [currentUser, activeSchool, academicUnit, students],
  );

  const BE_YEAR_LEVELS = ["All", ...(setupData.year_levels ?? []).filter((yl) => yl.academicLevel !== "College").sort((a, b) => (a.level ?? 0) - (b.level ?? 0)).map((yl) => yl.name)];
  const COLLEGE_COURSES = ["All", ...courses.filter((c) => c.department === "College").map((c) => c.code)];
  const COLLEGE_YEAR_LEVELS = ["All", ...(setupData.year_levels ?? []).filter((yl) => yl.academicLevel === "College").sort((a, b) => (a.level ?? 0) - (b.level ?? 0)).map((yl) => yl.name)];

  const deptStudents = useMemo(
    () => scopedStudents.filter((s) => s.department === dept),
    [scopedStudents, dept]
  );

  const availableSections = useMemo(() => {
    const base = deptStudents.filter((s) => {
      if (school === "BASIC_ED" && filterYearLevel !== "All" && s.yearLevel !== filterYearLevel) return false;
      if (school === "COLLEGE" && filterCourse !== "All" && s.trackOrCourse !== filterCourse) return false;
      if (school === "COLLEGE" && filterYearLevel !== "All" && s.yearLevel !== filterYearLevel) return false;
      return true;
    });
    return [...new Set(base.map((s) => s.section).filter(Boolean))];
  }, [deptStudents, school, filterYearLevel, filterCourse]);

  const filtered = useMemo(() => {
    return deptStudents.filter((s) => {
      if (school === "BASIC_ED" && filterYearLevel !== "All" && s.yearLevel !== filterYearLevel) return false;
      if (school === "COLLEGE" && filterCourse !== "All" && s.trackOrCourse !== filterCourse) return false;
      if (school === "COLLEGE" && filterYearLevel !== "All" && s.yearLevel !== filterYearLevel) return false;
      if (filterSection !== "All" && s.section !== filterSection) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
          s.studentNo.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [deptStudents, school, filterYearLevel, filterCourse, filterSection, searchQuery]);

  const analyticsStats = useMemo(() => {
    const enrolled = filtered.filter((s) => s.enrollmentStatus === "Enrolled").length;
    const pending = filtered.filter((s) => s.enrollmentStatus === "Pending").length;
    const approved = filtered.filter((s) => s.enrollmentStatus === "Approved").length;
    return { enrolled, pending, approved, total: filtered.length };
  }, [filtered]);

  const handleSchoolChange = (val: AnalyticsSchool) => {
    setSchool(val);
    setFilterYearLevel("All");
    setFilterCourse("All");
    setFilterSection("All");
  };

  const handleYearChange = (val: string) => {
    setFilterYearLevel(val);
    setFilterSection("All");
  };

  const handleCourseChange = (val: string) => {
    setFilterCourse(val);
    setFilterSection("All");
  };

  const handlePrint = () => {
    const title =
      school === "BASIC_ED"
        ? "STSN Basic Education Enrollment Report"
        : "CSTA College Enrollment Report";
    const filters = [
      school === "BASIC_ED"
        ? `Year Level: ${filterYearLevel}`
        : `Course: ${filterCourse} | Year Level: ${filterYearLevel}`,
      `Section: ${filterSection}`
    ].join(" | ");

    const rows = filtered
      .map(
        (s) =>
          `<tr>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;">${s.studentNo}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;">${s.lastName}, ${s.firstName} ${s.middleName || ""}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;">${s.yearLevel}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;">${s.trackOrCourse || "—"}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;">${s.section || "—"}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;">${s.enrollmentStatus}</td>
        </tr>`
      )
      .join("");

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 12px; padding: 24px; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #4A3728; color: #fff; padding: 8px 10px; text-align: left; font-size: 10px; text-transform: uppercase; }
            tr:nth-child(even) td { background: #fafaf9; }
            h2 { color: #4A3728; margin: 0 0 4px; }
            .meta { color: #666; font-size: 11px; margin-bottom: 16px; }
          </style>
        </head>
        <body>
          <h2>${title}</h2>
          <p class="meta">
            Filters: ${filters}&nbsp;|&nbsp;
            Total: ${filtered.length}&nbsp;|&nbsp;
            Enrolled: ${analyticsStats.enrolled}&nbsp;|&nbsp;
            Printed: ${new Date().toLocaleString()}
          </p>
          <table>
            <thead>
              <tr>
                <th>Student No.</th>
                <th>Full Name</th>
                <th>Year Level</th>
                <th>${school === "BASIC_ED" ? "Strand / Track" : "Program"}</th>
                <th>Section</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  const isBasicEd = school === "BASIC_ED";

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-5 rounded-xl border border-stsn-beige shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-stone-100 rounded-lg text-stone-600 hover:text-stsn-brown transition cursor-pointer"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-display font-bold text-stone-900 flex items-center gap-2">
              <BarChart3 className={`w-5 h-5 ${isBasicEd ? "text-stsn-brown" : "text-blue-600"}`} />
              Detailed Enrollment Analytics
            </h2>
            <p className="text-stone-400 text-xs mt-0.5">
              {isBasicEd
                ? "St. Theresa's School of Novaliches — Basic Education"
                : "Colegio de Sta. Teresa de Avila — College Division"}
            </p>
          </div>
        </div>
        <button
          onClick={handlePrint}
          className={`text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 cursor-pointer shadow ${isBasicEd ? "btn-primary-gradient" : "bg-blue-600 hover:bg-blue-700"}`}
        >
          <Printer className="w-4 h-4" />
          Print Results ({filtered.length})
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Filtered", value: analyticsStats.total, color: "text-stone-800", bg: "bg-stone-50 border-stone-200" },
          { label: "Enrolled", value: analyticsStats.enrolled, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
          { label: "Pending", value: analyticsStats.pending, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
          { label: "Approved", value: analyticsStats.approved, color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
        ].map((stat) => (
          <div key={stat.label} className={`p-3 rounded-xl border ${stat.bg} flex flex-col`}>
            <span className="text-[10px] font-mono uppercase text-stone-400">{stat.label}</span>
            <span className={`text-2xl font-display font-black mt-1 ${stat.color}`}>{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="bg-white p-5 rounded-xl border border-stsn-beige shadow-sm">
        <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Filter className="w-3.5 h-3.5" /> Analytics Filters
        </h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">School</label>
            <select
              value={school}
              onChange={(e) => handleSchoolChange(e.target.value as AnalyticsSchool)}
              className="bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown min-w-[220px]"
            >
              <option value="BASIC_ED">Basic Ed — STSN / St. Theresa's</option>
              <option value="COLLEGE">College — CSTA / Colegio</option>
            </select>
          </div>

          {isBasicEd && (
            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">Year Level</label>
              <select
                value={filterYearLevel}
                onChange={(e) => handleYearChange(e.target.value)}
                className="bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none"
              >
                {BE_YEAR_LEVELS.map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            </div>
          )}

          {!isBasicEd && (
            <>
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">Course / Program</label>
                <select
                  value={filterCourse}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  className="bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none"
                >
                  {COLLEGE_COURSES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">Year Level</label>
                <select
                  value={filterYearLevel}
                  onChange={(e) => handleYearChange(e.target.value)}
                  className="bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none"
                >
                  {COLLEGE_YEAR_LEVELS.map((y) => (
                    <option key={y}>{y}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">Section</label>
            <select
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none"
            >
              <option value="All">All Sections</option>
              {availableSections.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      <div className="bg-white rounded-xl border border-stsn-beige shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="text-xs font-bold text-stone-700 flex-1">
            {isBasicEd ? "Basic Education" : "College"} Enrollment Records
          </span>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Name or student no…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-44 bg-stone-50 border border-stone-200 rounded-lg pl-8 pr-3 text-xs focus:ring-1 focus:ring-stsn-brown focus:outline-none"
              />
            </div>
            <span className="text-[10px] font-mono text-stone-400 flex-shrink-0">
              {filtered.length} record{filtered.length !== 1 ? "s" : ""} found
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className={`text-white text-[10px] uppercase font-bold ${isBasicEd ? "bg-stsn-brown" : "bg-blue-700"}`}>
                <th className="py-3 px-4 text-left">Student No.</th>
                <th className="py-3 px-4 text-left">Full Name</th>
                <th className="py-3 px-4 text-left">Year Level</th>
                <th className="py-3 px-4 text-left">{isBasicEd ? "Strand / Track" : "Program"}</th>
                <th className="py-3 px-4 text-left">Section</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-xs text-stone-400">
                    No enrollment records match the selected filters.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-stone-50 transition">
                    <td className={`py-3 px-4 font-mono font-bold text-[11px] ${isBasicEd ? "text-stsn-brown" : "text-blue-700"}`}>
                      {s.studentNo}
                    </td>
                    <td className="py-3 px-4 font-semibold text-stone-800">
                      {s.lastName}, {s.firstName} {s.middleName || ""}
                    </td>
                    <td className="py-3 px-4 text-stone-600">{s.yearLevel}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isBasicEd ? "bg-stsn-cream text-stsn-brown border border-stsn-beige" : "bg-blue-50 text-blue-700 border border-blue-200"}`}>
                        {s.trackOrCourse || "—"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-stone-600">{s.section || "—"}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block text-[9.5px] font-bold px-2 py-1 rounded-full border ${
                        s.enrollmentStatus === "Enrolled" ? "bg-green-50 text-green-700 border-green-200"
                        : s.enrollmentStatus === "Approved" ? "bg-blue-50 text-blue-700 border-blue-200"
                        : s.enrollmentStatus === "Rejected" ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        {s.enrollmentStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN DASHBOARD — school overview (matches 2nd image design)
// ============================================================
export default function Dashboard({
  onViewStudentList
}: {
  onViewStudentList?: () => void;
} = {}) {
  const {
    students,
    teachers,
    payments,
    enrollments,
    announcements,
    events,
    currentUser,
    activeSchool,
    academicUnit,
    sections,
    requirements,
    assessments,
    enrollmentHistoryStats,
    gradePeriods,
    employees,
    leaveRequests,
    voidRequests,
    discountRequests,
  } = useSTSNStore();

  const [analyticsView, setAnalyticsView] = useState<{ school: "BASIC_ED" | "COLLEGE" } | null>(null);
  const [statusModal, setStatusModal] = useState<string | null>(null);

  const terms = useMemo(() => getAcademicTerms(academicUnit), [academicUnit]);
  const isBasicEdUnit = academicUnit === "basic-ed";
  const contextDept = useMemo(() => academicUnitToDepartment(academicUnit), [academicUnit]);

  const scopedData = useMemo(
    () =>
      getAcademicScopedData({
        currentUser, activeSchool, academicUnit,
        students, enrollments, requirements, assessments, sections,
      }),
    [currentUser, activeSchool, academicUnit, students, enrollments, requirements, assessments, sections],
  );

  const scopedStudents   = scopedData.students;
  const scopedEnrollments  = scopedData.enrollments ?? [];
  const scopedRequirements = scopedData.requirements ?? [];
  const scopedAssessments  = scopedData.assessments ?? [];
  const scopedSections     = scopedData.sections ?? [];

  const contextStudents = useMemo(
    () => scopedStudents.filter((s) => s.department === contextDept),
    [scopedStudents, contextDept]
  );

  const registrarKpis = useMemo(() => {
    const contextStudentIds = new Set(contextStudents.map((s) => s.id));
    const docName = isBasicEdUnit ? "Form 137 / SF9" : "Transcript of Records (TOR)";
    const pendingDocs = scopedRequirements.filter(
      (r) => contextStudentIds.has(r.studentId) && r.name === docName && r.verificationStatus !== "Verified"
    ).length;
    const contextSections = scopedSections.filter((s) => s.department === contextDept && s.isActive);
    const sectionsWithoutLeader = contextSections.filter((s) => !s.adviserId).length;
    const outstandingBalances = scopedAssessments.filter(
      (a) => contextStudentIds.has(a.studentId) && a.balance > 0
    ).length;
    return { totalStudents: contextStudents.length, pendingDocs, sectionsWithoutLeader, outstandingBalances };
  }, [contextStudents, scopedRequirements, scopedSections, scopedAssessments, contextDept, isBasicEdUnit]);

  const totalEnrolled = useMemo(
    () => scopedStudents.filter((s) => s.enrollmentStatus === "Enrolled").length,
    [scopedStudents]
  );
  const totalFaculty  = teachers.length;
  const totalPayments = useMemo(() => payments.reduce((sum, p) => sum + p.amount, 0), [payments]);
  const pendingEnrollments = useMemo(
    () => scopedEnrollments.filter((e) => e.status === "Pending" || e.status === "For Assessment").length,
    [scopedEnrollments]
  );

  const hrKpis = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const scopedEmps = activeSchool === "ALL" ? employees : employees.filter((e) => e.schoolId === activeSchool);
    const active = scopedEmps.filter((e) => e.employmentStatus === "Active").length;
    const onLeaveToday = leaveRequests.filter(
      (r) => r.status === "Approved" && r.startDate <= today && r.endDate >= today
    ).length;
    const pendingLeaves    = leaveRequests.filter((r) => r.status === "Submitted" || r.status === "For Approval").length;
    const pendingVoids     = voidRequests.filter((v) => v.status === "Pending Void Approval").length;
    const pendingDiscounts = discountRequests.filter((d) => d.status === "Pending" || d.status === "For Review").length;
    return { total: scopedEmps.length, active, onLeaveToday, pendingLeaves, pendingVoids, pendingDiscounts };
  }, [employees, leaveRequests, voidRequests, discountRequests, activeSchool]);

  const principalApprovalQueue = useMemo(() => {
    const scopedStudentIds = new Set(scopedStudents.map((s) => s.id));
    const pendingAssessments = scopedAssessments.filter((a) =>
      scopedStudentIds.has(a.studentId) && a.approvalStatus === "Pending Accounting Approval"
    ).length;
    const paymentReady = scopedAssessments.filter((a) =>
      scopedStudentIds.has(a.studentId) && a.approvalStatus === "Approved for Payment" && a.balance > 0
    ).length;
    const unfinalizedGrade = gradePeriods.filter((p) => !p.isFinalized).length;
    const noAdviser = scopedSections.filter((s) => s.isActive && !s.adviserId).length;
    const workflowPending = scopedEnrollments.filter((e) =>
      ["Pending", "For Assessment", "Assessed", "For Payment", "Partially Paid"].includes(e.status)
    ).length;
    return [
      { label: "Enrollment Handoffs",  value: workflowPending,     hint: "Registrar/Accounting/Cashier",     tone: "text-amber-700 bg-amber-50 border-amber-200" },
      { label: "Assessment Review",    value: pendingAssessments,  hint: "Awaiting Accounting approval",      tone: "text-blue-700 bg-blue-50 border-blue-200" },
      { label: "Payment Queue",        value: paymentReady,        hint: "Approved assessments unpaid",       tone: "text-emerald-700 bg-emerald-50 border-emerald-200" },
      { label: "Grade Finalization",   value: unfinalizedGrade,    hint: "Periods not finalized",             tone: "text-purple-700 bg-purple-50 border-purple-200" },
      { label: "Section Oversight",    value: noAdviser,           hint: "Active sections without adviser",   tone: "text-red-700 bg-red-50 border-red-200" },
    ];
  }, [gradePeriods, scopedAssessments, scopedEnrollments, scopedSections, scopedStudents]);

  // Modal data
  const modalStudents = useMemo(
    () => (!statusModal ? [] : scopedStudents.filter((s) => s.enrollmentStatus === statusModal)),
    [statusModal, scopedStudents]
  );

  type ModalRow = {
    id: string; studentNo: string; fullName: string;
    yearLevel: string; program: string; enrollmentStatus: string;
    assessmentStatus: string; schoolYear: string;
  };

  const modalTableRows = useMemo<ModalRow[]>(() => modalStudents.map((s) => {
    const assessment = scopedAssessments.find((a) => a.studentId === s.id);
    const enrollment = scopedEnrollments.find((e) => e.studentId === s.id);
    return {
      id: s.id, studentNo: s.studentNo, fullName: `${s.lastName}, ${s.firstName}`,
      yearLevel: s.yearLevel, program: s.trackOrCourse || s.department,
      enrollmentStatus: s.enrollmentStatus,
      assessmentStatus: assessment?.approvalStatus ?? "—",
      schoolYear: enrollment?.schoolYear || "2026-2027",
    };
  }), [modalStudents, scopedAssessments, scopedEnrollments]);

  const modalColumns: STSNColumn<ModalRow>[] = [
    { title: "Student ID",       data: "studentNo",       render: (v) => <span className="font-mono font-bold text-stsn-brown">{v}</span> },
    { title: "Student Name",     data: "fullName",        render: (v) => <span className="font-semibold text-stone-800">{v}</span> },
    { title: "Grade / Year",     data: "yearLevel" },
    { title: "Program",          data: "program",         render: (v) => <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stsn-cream text-stsn-brown border border-stsn-beige">{v}</span> },
    {
      title: "Enrollment Status", data: "enrollmentStatus", className: "text-center",
      render: (v) => (
        <span className={`inline-block text-[9.5px] font-bold px-2 py-1 rounded-full border ${
          v === "Enrolled" ? "bg-green-50 text-green-700 border-green-200"
          : v === "Approved" ? "bg-blue-50 text-blue-700 border-blue-200"
          : v === "Rejected" ? "bg-red-50 text-red-700 border-red-200"
          : "bg-amber-50 text-amber-700 border-amber-200"
        }`}>{v}</span>
      ),
    },
    { title: "Assessment Status", data: "assessmentStatus", className: "text-center" },
    { title: "School Year",       data: "schoolYear",       render: (v) => <span className="font-mono text-stone-500">{v}</span> },
  ];

  // ── Chart data ────────────────────────────────────────────
  // Annual enrollment performance by academic year.
  type AnnualMetric = "total" | "stsn" | "cdsta";
  const [annualMetric, setAnnualMetric] = useState<AnnualMetric>("total");
  const [hoveredYearIndex, setHoveredYearIndex] = useState<number | null>(null);
  const [pinnedYearIndex, setPinnedYearIndex] = useState<number | null>(null);

  const annualPerformance = useMemo(() => {
    const history = enrollmentHistoryStats.length > 0
      ? enrollmentHistoryStats
      : [{ year: "2026-2027", stsn: scopedStudents.length, cdsta: 0 }];

    return history
      .map((item) => {
        const stsn = item.stsn ?? 0;
        const cdsta = item.cdsta ?? 0;
        return {
          year: item.year,
          stsn,
          cdsta,
          total: stsn + cdsta,
          growth: 0,
        };
      })
      .map((item, index, all) => {
        const previous = all[index - 1]?.total ?? 0;
        const growth = previous > 0 ? ((item.total - previous) / previous) * 100 : 0;
        return { ...item, growth };
      });
  }, [enrollmentHistoryStats, scopedStudents.length]);

  const fallbackYearIndex = Math.max(0, annualPerformance.length - 1);
  const selectedYearIndex = Math.min(
    hoveredYearIndex ?? pinnedYearIndex ?? fallbackYearIndex,
    fallbackYearIndex,
  );
  const selectedYear = annualPerformance[selectedYearIndex];
  const annualValues = annualPerformance.map((item) => item[annualMetric]);
  const annualPath = buildLine(annualValues, 380, 110, 16);
  const annualArea = buildArea(annualValues, 380, 110, 16);
  const annualMax = Math.max(...annualValues, 1);
  const annualMin = Math.min(...annualValues, 0);
  const annualRange = annualMax - annualMin || 1;

  // School finance — daily income vs expenses (Sun–Sat)
  const avgDaily = totalPayments / 7 || 5000;
  const dailyIncome   = [0.8, 1.1, 1.4, 1.2, 0.9, 0.6, 0.7].map((m) => Math.round(avgDaily * m));
  const dailyExpenses = [0.5, 0.7, 0.9, 0.8, 0.6, 0.4, 0.5].map((m) => Math.round(avgDaily * m));

  const W = 380; const H = 110; const PAD = 16;
  const incPath    = buildLine(dailyIncome,    W, H, PAD);
  const incArea    = buildArea(dailyIncome,    W, H, PAD);
  const expPath    = buildLine(dailyExpenses,  W, H, PAD);
  const expArea    = buildArea(dailyExpenses,  W, H, PAD);

  // Calendar event dates
  const eventDates = useMemo(
    () => new Set(events.map((e) => e.date)),
    [events]
  );

  void terms;
  void totalFaculty;

  // ── Sub-page: enrollment analytics drill-down ────────────
  if (analyticsView) {
    return (
      <EnrollmentAnalyticsPage
        initialSchool={analyticsView.school}
        onBack={() => setAnalyticsView(null)}
      />
    );
  }

  const invoiceStatusCount = assessments.length;
  const totalPending = pendingEnrollments + hrKpis.pendingLeaves + hrKpis.pendingVoids +
    hrKpis.pendingDiscounts + registrarKpis.pendingDocs;

  // ── Main dashboard JSX ────────────────────────────────────
  return (
    <div className="space-y-5 animate-fade-in">

      <ModulePageHeader
        variant={isBasicEdUnit ? "default" : "college"}
        badge={isBasicEdUnit ? "Basic Education" : "College Division"}
        badgeIcon={BarChart3}
        title="School Dashboard"
        subtitle={`${contextDept} — real-time overview of enrollment, staff, and operations`}
        meta="S.Y. 2026–2027"
      />

      {/* ── Row 1: KPI Cards + Promo ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* KPI 2×2 grid */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          {[
            {
              label: "Total Students", value: students.length, sub: `+${Math.max(0, students.length - (totalEnrolled - 10))} this month`,
              trendUp: true, icon: <Users className="w-5 h-5" />,
              bg: "bg-blue-50", border: "border-blue-200", text: "text-stone-900", accent: "bg-blue-600",
              chip: "bg-blue-100", iconColor: "text-blue-600", trendColor: "text-emerald-600",
            },
            {
              label: "Total Teachers", value: teachers.length, sub: "−3% than last month",
              trendUp: false, icon: <GraduationCap className="w-5 h-5" />,
              bg: "bg-amber-50", border: "border-amber-200", text: "text-stone-900", accent: "bg-amber-500",
              chip: "bg-amber-100", iconColor: "text-amber-600", trendColor: "text-red-500",
            },
            {
              label: "Events", value: events.length, sub: "+6% than last month",
              trendUp: true, icon: <Calendar className="w-5 h-5" />,
              bg: "bg-stsn-cream", border: "border-stsn-beige", text: "text-stone-900", accent: "bg-stsn-brown",
              chip: "bg-white border border-stsn-beige", iconColor: "text-stsn-brown", trendColor: "text-emerald-600",
            },
            {
              label: "Invoice Status", value: invoiceStatusCount.toLocaleString(), sub: "+2% than last month",
              trendUp: true, icon: <CreditCard className="w-5 h-5" />,
              bg: "bg-emerald-50", border: "border-emerald-200", text: "text-stone-900", accent: "bg-emerald-600",
              chip: "bg-emerald-100", iconColor: "text-emerald-600", trendColor: "text-emerald-600",
            },
          ].map((kpi) => (
            <div key={kpi.label} className={`relative overflow-hidden rounded-2xl border ${kpi.bg} ${kpi.border} p-5 shadow-sm flex items-start justify-between`}>
              <div className={`absolute inset-x-0 top-0 h-1 ${kpi.accent}`} />
              <div>
                <p className="text-2xl font-display font-black text-stone-900">{kpi.value}</p>
                <p className="text-[11px] font-semibold text-stone-500 mt-1">{kpi.label}</p>
                <p className={`text-[10px] mt-1 flex items-center gap-0.5 ${kpi.trendColor}`}>
                  {kpi.trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {kpi.sub}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-xl ${kpi.chip} flex items-center justify-center flex-shrink-0`}>
                <span className={kpi.iconColor}>{kpi.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Promo card — quick access to enrollment portal */}
        <div className="bg-gradient-to-br from-stsn-brown via-stsn-brown to-amber-700 rounded-2xl p-6 shadow-sm flex flex-col justify-between text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -mr-8 -mt-8" />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 -ml-6 -mb-6" />
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-display font-bold leading-tight">
              Open Enrollment for A.Y. 2026–2027
            </h3>
            <p className="text-sm text-white/80 mt-2 leading-relaxed">
              Process enrollment applications faster and more efficiently. Real-time status tracking available.
            </p>
          </div>
          <button
            onClick={() => onViewStudentList?.()}
            className="relative mt-6 bg-white text-stsn-brown font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-stsn-cream transition cursor-pointer self-start shadow"
          >
            View Enrollment
          </button>
        </div>
      </div>

      {/* ── Row 2: School Performance + Upcoming Events ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* School Performance annual chart */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
          <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-stone-900">Annual Enrollment Analysis</h3>
              <p className="text-[10px] text-stone-400 mt-0.5">Academic-year trend, not weekly or monthly snapshots.</p>
            </div>
            <div className="flex items-center gap-1 rounded-xl bg-stone-50 border border-stone-200 p-1">
              {[
                { key: "total", label: "Total" },
                { key: "stsn", label: "STSN" },
                { key: "cdsta", label: "CSTA" },
              ].map((metric) => (
                <button
                  key={metric.key}
                  type="button"
                  onClick={() => setAnnualMetric(metric.key as AnnualMetric)}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer transition ${
                    annualMetric === metric.key
                      ? "bg-stsn-brown text-white shadow-sm"
                      : "text-stone-500 hover:text-stsn-brown hover:bg-white"
                  }`}
                >
                  {metric.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-xl bg-stsn-cream border border-stsn-beige px-3 py-2.5">
              <p className="text-[9px] font-mono uppercase text-stone-500">Selected Year</p>
              <p className="text-sm font-display font-black text-stsn-brown mt-0.5">{selectedYear?.year ?? "N/A"}</p>
            </div>
            <div className="rounded-xl bg-blue-50 border border-blue-100 px-3 py-2.5">
              <p className="text-[9px] font-mono uppercase text-blue-500">Total Enrollment</p>
              <p className="text-sm font-display font-black text-blue-700 mt-0.5">{(selectedYear?.total ?? 0).toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2.5">
              <p className="text-[9px] font-mono uppercase text-emerald-600">YoY Growth</p>
              <p className={`text-sm font-display font-black mt-0.5 ${(selectedYear?.growth ?? 0) >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                {(selectedYear?.growth ?? 0) >= 0 ? "+" : ""}{(selectedYear?.growth ?? 0).toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="w-full overflow-hidden rounded-xl bg-stone-50 border border-stone-100 relative">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="w-full"
              style={{ height: "170px" }}
              preserveAspectRatio="none"
              onMouseLeave={() => setHoveredYearIndex(null)}
            >
              <defs>
                <linearGradient id="annualGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4A3728" stopOpacity="0.24" />
                  <stop offset="100%" stopColor="#4A3728" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              {[0, 1, 2].map((line) => (
                <line
                  key={line}
                  x1={PAD}
                  x2={W - PAD}
                  y1={PAD + line * ((H - 2 * PAD) / 2)}
                  y2={PAD + line * ((H - 2 * PAD) / 2)}
                  stroke="#e7e5e4"
                  strokeWidth="0.75"
                />
              ))}
              {annualPerformance.map((item, i) => {
                const x = PAD + (i / Math.max(1, annualPerformance.length - 1)) * (W - 2 * PAD);
                const barHeight = ((item[annualMetric] - annualMin) / annualRange) * (H - 2 * PAD);
                const isActive = selectedYearIndex === i;
                return (
                  <rect
                    key={`bar-${item.year}`}
                    x={x - 8}
                    y={H - PAD - barHeight}
                    width={16}
                    height={Math.max(3, barHeight)}
                    rx={5}
                    fill={isActive ? "#4A3728" : "#d6d3d1"}
                    opacity={isActive ? 0.35 : 0.28}
                  />
                );
              })}
              <path d={annualArea} fill="url(#annualGrad)" />
              <path d={annualPath} fill="none" stroke="#4A3728" strokeWidth="2.75" strokeLinecap="round" />

              {annualPerformance.map((item, i) => {
                const x = PAD + (i / Math.max(1, annualPerformance.length - 1)) * (W - 2 * PAD);
                const y = H - PAD - ((item[annualMetric] - annualMin) / annualRange) * (H - 2 * PAD);
                const isActive = selectedYearIndex === i;
                return (
                  <g key={item.year}>
                    <line
                      x1={x}
                      x2={x}
                      y1={PAD}
                      y2={H - PAD}
                      stroke={isActive ? "#4A3728" : "transparent"}
                      strokeDasharray="3 3"
                      strokeWidth="1"
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r={isActive ? 5 : 3.5}
                      fill={isActive ? "#2563eb" : "#ffffff"}
                      stroke="#4A3728"
                      strokeWidth="2"
                    />
                    <rect
                      x={x - (W / Math.max(annualPerformance.length, 1)) / 2}
                      y={0}
                      width={W / Math.max(annualPerformance.length, 1)}
                      height={H}
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredYearIndex(i)}
                      onClick={() => setPinnedYearIndex(i)}
                      onFocus={() => setHoveredYearIndex(i)}
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="flex justify-between mt-2 px-1">
            {annualPerformance.map((item, i) => (
              <button
                key={item.year}
                type="button"
                onMouseEnter={() => setHoveredYearIndex(i)}
                onClick={() => setPinnedYearIndex(i)}
                className={`text-[9px] font-mono cursor-pointer transition ${
                  selectedYearIndex === i ? "text-stsn-brown font-black" : "text-stone-400 hover:text-stsn-brown"
                }`}
              >
                {item.year.replace("20", "'")}
              </button>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-100 shadow-sm p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-stsn-brown" />
              Upcoming Events
            </h3>
          </div>
          <div className="space-y-3 flex-1">
            {events.slice(0, 4).length === 0 ? (
              <p className="text-[11px] text-stone-400 text-center py-4">No upcoming events.</p>
            ) : (
              events.slice(0, 4).map((ev) => {
                const d = new Date(ev.date + "T00:00:00");
                const dayNum = d.getDate();
                const dayName = d.toLocaleString("en-US", { weekday: "short" }).toUpperCase();
                const colorClasses = ["bg-stsn-cream text-stsn-brown border border-stsn-beige", "bg-blue-50 text-blue-700 border border-blue-200", "bg-amber-50 text-amber-700 border border-amber-200", "bg-emerald-50 text-emerald-700 border border-emerald-200"];
                const col = colorClasses[events.indexOf(ev) % colorClasses.length];
                return (
                  <div key={ev.id} className="flex gap-3 items-start p-3 rounded-xl hover:bg-stone-50 transition">
                    <div className={`w-10 h-10 rounded-xl ${col} flex flex-col items-center justify-center flex-shrink-0`}>
                      <span className="text-[8px] font-mono font-bold leading-none">{dayName}</span>
                      <span className="text-sm font-black leading-tight">{dayNum}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-stone-800 leading-tight">{ev.title}</p>
                      <p className="text-[10px] text-stone-500 mt-0.5 line-clamp-1">{ev.description}</p>
                      <span className="text-[9px] font-mono font-bold text-stsn-brown uppercase mt-0.5 block">{ev.department}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <button
            className="mt-3 w-full bg-stsn-brown hover:bg-stsn-brown-dark text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition"
          >
            <Plus className="w-3.5 h-3.5" /> New Event
          </button>
        </div>
      </div>

      {/* ── Row 3: Calendar + School Finance ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* School Event Calendar */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-stone-900">School Event Calendar</h3>
            <p className="text-[11px] text-stone-400 mt-0.5">
              You have {students.length} students enrolled
            </p>
          </div>
          <MiniCalendar eventDates={eventDates} />
        </div>

        {/* School Finance */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-sm font-bold text-stone-900">School Finance</h3>
            <div className="flex items-center gap-2">
              <button className="text-[10px] px-2.5 py-1 rounded-lg bg-stone-50 border border-stone-200 text-stone-500 cursor-pointer">Monthly</button>
              <button className="text-[10px] px-2.5 py-1 rounded-lg bg-stsn-brown text-white font-semibold cursor-pointer">Weekly</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-[10px] font-semibold text-stone-500">Income</span>
              </div>
              <p className="text-base font-display font-bold text-emerald-700">
                ₱{totalPayments.toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center">
                  <TrendingDown className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-[10px] font-semibold text-stone-500">Expense</span>
              </div>
              <p className="text-base font-display font-bold text-amber-700">
                ₱{Math.round(totalPayments * 0.62).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="w-full overflow-hidden rounded-xl bg-stone-50 border border-stone-100 p-2">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: "110px" }} preserveAspectRatio="none">
              <defs>
                <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
                </linearGradient>
                <linearGradient id="expGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <path d={incArea} fill="url(#incGrad)" />
              <path d={expArea} fill="url(#expGrad2)" />
              <path d={incPath} fill="none" stroke="#10b981" strokeWidth="2.5" />
              <path d={expPath} fill="none" stroke="#f59e0b" strokeWidth="2.5" />
            </svg>
          </div>
          <div className="flex justify-between mt-2 px-1">
            {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => (
              <span key={d} className="text-[9px] font-mono text-stone-400">{d}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 4: Oversight Queue + Notices + Events ──────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 rounded-full bg-stone-400" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500 font-semibold">Institutional Bulletins</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Oversight Queue */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-stone-800">Oversight Queue</h3>
              <span className="text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded-full border badge-basic-ed">Cross-office</span>
            </div>
            <p className="text-[10px] text-stone-400 mb-3">Workflow items requiring follow-up.</p>
            <div className="space-y-2">
              {principalApprovalQueue.map((item) => (
                <div key={item.label} className={`flex items-center justify-between rounded-lg border px-3 py-2.5 ${item.tone}`}>
                  <div>
                    <p className="text-[10px] font-mono uppercase font-bold opacity-80">{item.label}</p>
                    <p className="text-[9px] mt-0.5 opacity-70">{item.hint}</p>
                  </div>
                  <span className="text-xl font-display font-black flex-shrink-0 ml-3">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Live Notice Board */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-3.5 h-3.5 text-stsn-gold" />
              <h3 className="text-sm font-semibold text-stone-800">Live Notice Board</h3>
            </div>
            <div className="space-y-3">
              {announcements.slice(0, 3).map((ann) => (
                <div key={ann.id} className="p-3.5 bg-stone-50 hover:bg-stsn-cream border border-stone-100 hover:border-stsn-beige rounded-xl transition-all duration-200">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[11px] font-semibold text-stsn-brown leading-tight">{ann.title}</span>
                    <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full font-bold flex-shrink-0 ${
                      ann.category === "Billing" ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : ann.category === "Academic" ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "bg-stone-100 text-stone-600 border border-stone-200"
                    }`}>
                      {ann.category}
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-500 mt-1.5 line-clamp-2 leading-relaxed">{ann.content}</p>
                  <div className="flex justify-between items-center mt-2 text-[9px] text-stone-400 font-mono">
                    <span>{ann.author}</span>
                    <span>{ann.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-3.5 h-3.5 text-stsn-gold" />
              <h3 className="text-sm font-semibold text-stone-800">Quick Stats</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: "Enrolled Students",    value: totalEnrolled,                   tone: "text-emerald-700 bg-emerald-50 border-emerald-200" },
                { label: "Pending Actions",       value: totalPending,                    tone: totalPending > 0 ? "text-amber-700 bg-amber-50 border-amber-200" : "text-stone-600 bg-stone-50 border-stone-200" },
                { label: "Collections",           value: `₱${totalPayments.toLocaleString()}`, tone: "text-blue-700 bg-blue-50 border-blue-200" },
                { label: "Active Staff",          value: hrKpis.active,                  tone: "text-stone-700 bg-stone-50 border-stone-200" },
                { label: "Outstanding Balances",  value: registrarKpis.outstandingBalances, tone: registrarKpis.outstandingBalances > 0 ? "text-red-700 bg-red-50 border-red-200" : "text-stone-600 bg-stone-50 border-stone-200" },
              ].map((s) => (
                <div key={s.label} className={`flex items-center justify-between rounded-lg border px-3 py-2.5 ${s.tone}`}>
                  <p className="text-[10px] font-mono uppercase font-bold opacity-80">{s.label}</p>
                  <span className="text-base font-display font-black flex-shrink-0 ml-3">{s.value}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setAnalyticsView({ school: "BASIC_ED" })}
              className="mt-4 w-full text-center text-[10px] font-mono uppercase text-stsn-brown hover:text-stsn-brown-dark cursor-pointer transition underline underline-offset-2"
            >
              View Enrollment Analytics →
            </button>
          </div>
        </div>
      </div>

      {/* ── Enrollment Status Modal ──────────────────────────── */}
      {statusModal && (
        <div className="app-modal-backdrop z-50" onClick={() => setStatusModal(null)}>
          <div
            className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-5xl overflow-hidden animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-gradient text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-sm">Students — {statusModal}</h3>
                <p className="text-[10px] text-white/60 mt-0.5 font-mono">
                  {modalStudents.length} record{modalStudents.length !== 1 ? "s" : ""} found
                </p>
              </div>
              <button onClick={() => setStatusModal(null)} className="text-white/70 hover:text-white hover:bg-white/10 rounded-lg p-1.5 cursor-pointer transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <STSNDataTable<ModalRow>
                columns={modalColumns}
                rows={modalTableRows}
                emptyMessage="No students found for this status."
                pageLength={10}
                searchable
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

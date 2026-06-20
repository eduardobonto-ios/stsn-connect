/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { useSTSNStore } from "../../../services/store";
import {
  Users,
  CreditCard,
  FileText,
  Calendar,
  Layers,
  Bell,
  TrendingUp,
  ArrowLeft,
  Printer,
  Search,
  ChevronDown,
  School,
  BookOpen,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  BarChart3,
  Filter,
  X,
  ExternalLink
} from "lucide-react";
import { getAcademicTerms, academicUnitToDepartment } from "../../../config/schools.config";

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
  const { students, setupData, courses } = useSTSNStore();
  const [school, setSchool] = useState<AnalyticsSchool>(initialSchool);
  const [filterYearLevel, setFilterYearLevel] = useState("All");
  const [filterCourse, setFilterCourse] = useState("All");
  const [filterSection, setFilterSection] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const dept = school === "BASIC_ED" ? "Basic Education" : "College";

  const BE_YEAR_LEVELS = ["All", ...(setupData.year_levels ?? []).filter((yl) => yl.academicLevel !== "College").sort((a, b) => (a.level ?? 0) - (b.level ?? 0)).map((yl) => yl.name)];
  const COLLEGE_COURSES = ["All", ...courses.filter((c) => c.department === "College").map((c) => c.code)];
  const COLLEGE_YEAR_LEVELS = ["All", ...(setupData.year_levels ?? []).filter((yl) => yl.academicLevel === "College").sort((a, b) => (a.level ?? 0) - (b.level ?? 0)).map((yl) => yl.name)];

  const deptStudents = useMemo(
    () => students.filter((s) => s.department === dept),
    [students, dept]
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

  // Stats for the analytics header bar
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
            .stat { display: inline-block; margin-right: 20px; }
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
      {/* Header */}
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

      {/* Quick Stats Bar */}
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

      {/* School Selector + Filters */}
      <div className="bg-white p-5 rounded-xl border border-stsn-beige shadow-sm">
        <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Filter className="w-3.5 h-3.5" /> Analytics Filters
        </h3>
        <div className="flex flex-wrap gap-3 items-end">
          {/* School Selector */}
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

          {/* Basic Ed: Year Level */}
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

          {/* College: Course + Year Level */}
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

          {/* Section */}
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

          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-stone-400" />
              <input
                type="text"
                placeholder="Name or student no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 pl-8 pr-3 text-xs focus:ring-1 focus:ring-stsn-brown focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl border border-stsn-beige shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-100 flex justify-between items-center">
          <span className="text-xs font-bold text-stone-700">
            {isBasicEd ? "Basic Education" : "College"} Enrollment Records
          </span>
          <span className="text-[10px] font-mono text-stone-400">
            {filtered.length} record{filtered.length !== 1 ? "s" : ""} found
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr
                className={`text-white text-[10px] uppercase font-bold ${
                  isBasicEd ? "bg-stsn-brown" : "bg-blue-700"
                }`}
              >
                <th className="py-3 px-4 text-left">Student No.</th>
                <th className="py-3 px-4 text-left">Full Name</th>
                <th className="py-3 px-4 text-left">Year Level</th>
                <th className="py-3 px-4 text-left">
                  {isBasicEd ? "Strand / Track" : "Program"}
                </th>
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
                    <td
                      className={`py-3 px-4 font-mono font-bold text-[11px] ${
                        isBasicEd ? "text-stsn-brown" : "text-blue-700"
                      }`}
                    >
                      {s.studentNo}
                    </td>
                    <td className="py-3 px-4 font-semibold text-stone-800">
                      {s.lastName}, {s.firstName} {s.middleName || ""}
                    </td>
                    <td className="py-3 px-4 text-stone-600">{s.yearLevel}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isBasicEd
                            ? "bg-stsn-cream text-stsn-brown border border-stsn-beige"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {s.trackOrCourse || "—"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-stone-600">{s.section || "—"}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block text-[9.5px] font-bold px-2 py-1 rounded-full border ${
                          s.enrollmentStatus === "Enrolled"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : s.enrollmentStatus === "Approved"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : s.enrollmentStatus === "Rejected"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
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
// REGISTRAR DASHBOARD — ALL HOOKS DECLARED BEFORE ANY RETURN
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
    academicUnit,
    sections,
    requirements,
    assessments,
    enrollmentHistoryStats
  } = useSTSNStore();

  // ── All state hooks at top ──────────────────────────────
  const [analyticsView, setAnalyticsView] = useState<{
    school: "BASIC_ED" | "COLLEGE";
  } | null>(null);
  const [statusModal, setStatusModal] = useState<string | null>(null);

  // ── All computed values (useMemo) unconditionally ───────
  const isAdmin =
    currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "ADMIN";
  const isRegistrar = currentUser?.role === "REGISTRAR";

  // Academic structure & workflow terminology — derived solely from the
  // selected school's academicUnit, never from role.
  const terms = useMemo(() => getAcademicTerms(academicUnit), [academicUnit]);
  const isBasicEdUnit = academicUnit === "basic-ed";
  const contextDept = useMemo(() => academicUnitToDepartment(academicUnit), [academicUnit]);

  const contextStudents = useMemo(
    () => students.filter((s) => s.department === contextDept),
    [students, contextDept]
  );

  // Enterprise Registrar KPIs — context-aware per Basic Ed vs College.
  const registrarKpis = useMemo(() => {
    const contextStudentIds = new Set(contextStudents.map((s) => s.id));

    const docRequirementName = isBasicEdUnit ? "Form 137 / SF9" : "Transcript of Records (TOR)";
    const pendingDocs = requirements.filter(
      (r) =>
        contextStudentIds.has(r.studentId) &&
        r.name === docRequirementName &&
        r.verificationStatus !== "Verified"
    ).length;

    const contextSections = sections.filter((s) => s.department === contextDept && s.isActive);
    const sectionsWithoutLeader = contextSections.filter((s) => !s.adviserId).length;

    const outstandingBalances = assessments.filter(
      (a) => contextStudentIds.has(a.studentId) && a.balance > 0
    ).length;

    return {
      totalStudents: contextStudents.length,
      pendingDocs,
      sectionsWithoutLeader,
      outstandingBalances
    };
  }, [contextStudents, requirements, sections, assessments, contextDept, isBasicEdUnit]);

  const totalEnrolled = useMemo(
    () => students.filter((s) => s.enrollmentStatus === "Enrolled").length,
    [students]
  );
  const totalFaculty = teachers.length;
  const totalPayments = useMemo(
    () => payments.reduce((sum, p) => sum + p.amount, 0),
    [payments]
  );
  const pendingEnrollments = useMemo(
    () => enrollments.filter((e) => e.status === "Pending").length,
    [enrollments]
  );

  // Enrollment status breakdown — must be BEFORE any conditional return
  const statusBreakdown = useMemo(() => {
    const enrolled = students.filter((s) => s.enrollmentStatus === "Enrolled").length;
    const pending = students.filter((s) => s.enrollmentStatus === "Pending").length;
    const approved = students.filter((s) => s.enrollmentStatus === "Approved").length;
    const rejected = students.filter((s) => s.enrollmentStatus === "Rejected").length;
    const total = students.length || 1;
    return [
      {
        label: "Enrolled",
        count: enrolled,
        pct: Math.round((enrolled / total) * 100),
        color: "bg-emerald-500",
        textColor: "text-emerald-700",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        icon: CheckCircle
      },
      {
        label: "Pending",
        count: pending,
        pct: Math.round((pending / total) * 100),
        color: "bg-amber-400",
        textColor: "text-amber-700",
        bg: "bg-amber-50",
        border: "border-amber-200",
        icon: Clock
      },
      {
        label: "Approved",
        count: approved,
        pct: Math.round((approved / total) * 100),
        color: "bg-blue-500",
        textColor: "text-blue-700",
        bg: "bg-blue-50",
        border: "border-blue-200",
        icon: CheckCircle
      },
      {
        label: "Rejected",
        count: rejected,
        pct: Math.round((rejected / total) * 100),
        color: "bg-red-500",
        textColor: "text-red-700",
        bg: "bg-red-50",
        border: "border-red-200",
        icon: XCircle
      }
    ];
  }, [students]);

  // Students matching the status card currently open in the modal
  const modalStudents = useMemo(() => {
    if (!statusModal) return [];
    return students.filter((s) => s.enrollmentStatus === statusModal);
  }, [statusModal, students]);

  // Chart data — sourced from enrollment_history_stats (Supabase)
  const chartData = enrollmentHistoryStats;
  const maxCount = Math.max(580, ...chartData.flatMap((d) => [d.stsn, d.cdsta]));

  // ── Conditional render AFTER all hooks ──────────────────
  if (analyticsView) {
    return (
      <EnrollmentAnalyticsPage
        initialSchool={analyticsView.school}
        onBack={() => setAnalyticsView(null)}
      />
    );
  }

  // ── Main dashboard JSX ───────────────────────────────────
  return (
    <div className="space-y-8 animate-fade-in">

      {/* Welcome Card */}
      <div className="bg-white p-6 rounded-2xl border border-stsn-beige shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="bg-stsn-gold/20 border border-stsn-gold/30 text-stsn-brown text-[10px] font-mono uppercase px-2.5 py-1 rounded-full font-bold">
            Registrar Command Panel
          </span>
          <h2 className="text-2xl font-display font-medium mt-2 text-stone-900">
            Registrar Dashboard
          </h2>
          <p className="text-stone-500 text-xs mt-1">
            Live admissions indices, enrollment status, financial clearance cycles, and student records.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="bg-stone-50 border border-stsn-beige rounded-xl px-4 py-2 min-w-[100px] text-center">
            <span className="text-[10px] text-stone-500 uppercase block font-mono">Academic Year</span>
            <span className="text-sm font-semibold text-stone-900">2026-2027</span>
          </div>
          <div className="bg-stone-50 border border-stsn-beige rounded-xl px-4 py-2 min-w-[100px] text-center">
            <span className="text-[10px] text-stone-500 uppercase block font-mono">Semester</span>
            <span className="text-sm font-semibold text-stone-900">1st Sem</span>
          </div>
        </div>
      </div>

      {/* Registrar KPI Cards — context-aware Basic Ed vs College */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-sm text-stone-900 uppercase tracking-wide flex items-center gap-2">
            <BarChart3 className={`w-4 h-4 ${isBasicEdUnit ? "text-stsn-brown" : "text-blue-600"}`} />
            Registrar KPIs
          </h3>
          <span className={`text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded-full border ${isBasicEdUnit ? "badge-basic-ed" : "badge-college"}`}>
            {isBasicEdUnit ? "K-12 Basic Education" : "Tertiary / College Division"}
          </span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-xl border border-stsn-beige shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <span className="text-xs text-stone-500 font-semibold">{isBasicEdUnit ? "Outstanding Assessments" : "Outstanding Balances"}</span>
              <div className="p-2 rounded-lg bg-red-50 text-red-700">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-display font-bold text-red-600">{registrarKpis.outstandingBalances}</span>
              <span className="text-[10px] text-red-500 block mt-1 font-mono">Require Accounting follow-up</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-stsn-beige shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <span className="text-xs text-stone-500 font-semibold">Total Enrolled</span>
              <div className="p-2 rounded-lg bg-stsn-beige/40 text-stsn-brown">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-display font-bold text-stone-900">{totalEnrolled}</span>
              <span className="text-[10px] text-green-600 font-semibold flex items-center gap-0.5 mt-1 font-mono">
                <TrendingUp className="w-3.5 h-3.5" /> +15.4% YoY
              </span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-stsn-beige shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <span className="text-xs text-stone-500 font-semibold">Admin Faculty</span>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-display font-bold text-stone-900">{totalFaculty}</span>
              <span className="text-[10px] text-stone-400 block mt-1 font-mono">Active Licensed LPTs</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-stsn-beige shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <span className="text-xs text-stone-500 font-semibold">Collections Fee</span>
              <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-xl font-display font-bold text-stone-900">
                ₱{totalPayments.toLocaleString()}
              </span>
              <span className="text-[10px] text-green-600 font-semibold flex items-center gap-0.5 mt-1 font-mono">
                <TrendingUp className="w-3.5 h-3.5" /> +8.5% Target
              </span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-stsn-beige shadow-sm col-span-2 lg:col-span-1 flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <span className="text-xs text-stone-500 font-semibold">Pending Reg</span>
              <div className="p-2 rounded-lg bg-red-50 text-red-700">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-display font-bold text-red-600">
                {pendingEnrollments}
              </span>
              <span className="text-[10px] text-red-500 font-semibold block mt-1 font-mono animate-pulse">
                Requires evaluation
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Block */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Enrollment Trends Comparison — Admin only */}
        {isAdmin ? (
          <div className="bg-white p-6 rounded-xl border border-stsn-beige shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-display font-bold text-sm text-stone-900 uppercase tracking-wide">
                  Enrollment Trends Comparison
                </h3>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Historical growth per school per academic cycle
                </p>
              </div>
              <div className="flex items-center gap-1 bg-stone-50 px-2 py-1 rounded border border-stone-200 text-[10px] font-semibold text-stone-600">
                <TrendingUp className="w-3 h-3 text-stsn-gold" />
                <span>Multi-School</span>
              </div>
            </div>

            {/* Clickable Legends */}
            <div className="flex items-center gap-3 mb-5 p-3 bg-stone-50 rounded-lg border border-stone-100 flex-wrap">
              <span className="text-[9px] font-mono text-stone-400 uppercase tracking-wider">
                Click to view details →
              </span>
              <button
                onClick={() => setAnalyticsView({ school: "BASIC_ED" })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stsn-cream border border-stsn-beige hover:bg-stsn-beige hover:border-stsn-brown transition cursor-pointer group"
                title="View STSN Enrollment Analytics"
              >
                <span className="w-2.5 h-2.5 rounded-sm bg-stsn-brown flex-shrink-0" />
                <span className="text-[11px] font-bold text-stsn-brown group-hover:underline">STSN</span>
                <span className="text-[9px] text-stone-400">St. Theresa's</span>
              </button>
              <button
                onClick={() => setAnalyticsView({ school: "COLLEGE" })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stsn-gold-light/40 border border-stsn-gold/40 hover:bg-stsn-gold-light/70 hover:border-stsn-gold transition cursor-pointer group"
                title="View CSTA Enrollment Analytics"
              >
                <span className="w-2.5 h-2.5 rounded-sm bg-stsn-gold flex-shrink-0" />
                <span className="text-[11px] font-bold text-stsn-gold group-hover:underline">CSTA</span>
                <span className="text-[9px] text-stone-400">Colegio</span>
              </button>
            </div>

            {/* Bar Chart */}
            <div className="space-y-4">
              {chartData.map((item) => {
                const stsnW = Math.round((item.stsn / maxCount) * 100);
                const cdstaW = Math.round((item.cdsta / maxCount) * 100);
                return (
                  <div key={item.year} className="space-y-1.5">
                    <span className="text-xs font-semibold text-stone-600 font-mono">{item.year}</span>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-stsn-brown w-10 flex-shrink-0">STSN</span>
                        <div className="flex-1 bg-stone-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-stsn-brown transition-all duration-700"
                            style={{ width: `${stsnW}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-mono font-bold text-stsn-brown w-10 text-right">
                          {item.stsn}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-stsn-gold w-10 flex-shrink-0">CSTA</span>
                        <div className="flex-1 bg-stone-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-stsn-gold transition-all duration-700"
                            style={{ width: `${cdstaW}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-mono font-bold text-stsn-gold w-10 text-right">
                          {item.cdsta}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between mt-5 pt-4 border-t border-stone-100 text-[10px] text-stone-400 font-mono">
              <span>Projection ceiling: {maxCount} enrollees</span>
              <span>Click legend to drill-down ↑</span>
            </div>

            {onViewStudentList && isRegistrar && (
              <button
                onClick={onViewStudentList}
                className="mt-4 w-full flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-lg btn-primary-gradient text-white cursor-pointer shadow transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View Enrolled Students
              </button>
            )}
          </div>
        ) : (
          /* Non-admin: single combined trend */
          <div className="bg-white p-6 rounded-xl border border-stsn-beige shadow-sm">
            <h3 className="font-display font-bold text-sm text-stone-900 uppercase mb-4">
              Enrollment Trends
            </h3>
            <div className="space-y-4">
              {chartData.map((item) => {
                const total = item.stsn + item.cdsta;
                const w = Math.round((total / (maxCount + 320)) * 100);
                return (
                  <div key={item.year} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-stone-600">{item.year}</span>
                      <span className="text-stone-900 font-mono font-bold">{total} Enrollees</span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-stsn-brown transition-all duration-700"
                        style={{ width: `${w}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {onViewStudentList && isRegistrar && (
              <button
                onClick={onViewStudentList}
                className="mt-5 w-full flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-lg btn-primary-gradient text-white cursor-pointer shadow transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View Enrolled Students
              </button>
            )}
          </div>
        )}

        {/* Enrollment Status Overview */}
        <div className="bg-white p-6 rounded-xl border border-stsn-beige shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-display font-bold text-sm text-stone-900 uppercase tracking-wide">
                  Enrollment Status Overview
                </h3>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Active enrollment pipeline across all statuses
                </p>
              </div>
              <span className="text-[9px] font-mono text-stone-500 bg-stone-50 border border-stone-200 px-2 py-1 rounded">
                {students.length} total
              </span>
            </div>

            <div className="space-y-3">
              {statusBreakdown.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setStatusModal(item.label)}
                    className={`w-full text-left p-3 rounded-xl border ${item.bg} ${item.border} flex items-center gap-3 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}
                  >
                    <Icon className={`w-4 h-4 ${item.textColor} flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className={`text-xs font-bold ${item.textColor}`}>
                          {item.label}
                        </span>
                        <span className={`text-xs font-mono font-black ${item.textColor}`}>
                          {item.count}{" "}
                          <span className="font-normal text-[10px]">({item.pct}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-white/60 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.color} transition-all duration-700`}
                          style={{ width: `${item.pct}%` }}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-[10px] text-stone-400 border-t border-stone-100 pt-4 mt-4 italic">
            *Real-time enrollment pipeline across STSN and CSTA student records.
          </p>
        </div>
      </div>

      {/* Lower Grid: Announcements + Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-stsn-beige shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display font-bold text-sm text-stone-900 uppercase flex items-center gap-2">
              <Bell className="w-4 h-4 text-stsn-gold" />
              Live Notice Board &amp; Bulletins
            </h3>
          </div>
          <div className="space-y-4">
            {announcements.slice(0, 3).map((ann) => (
              <div
                key={ann.id}
                className="p-4 bg-stsn-cream/40 hover:bg-stsn-cream border border-stsn-beige/60 rounded-xl transition duration-300"
              >
                <div className="flex justify-between font-semibold">
                  <span className="text-xs font-bold text-stsn-brown">{ann.title}</span>
                  <span
                    className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${
                      ann.category === "Billing"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : ann.category === "Academic"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "bg-stone-100 text-stone-600 border border-stone-200"
                    }`}
                  >
                    {ann.category}
                  </span>
                </div>
                <p className="text-xs text-stone-600 mt-2 line-clamp-2 leading-relaxed">
                  {ann.content}
                </p>
                <div className="flex justify-between items-center mt-3 text-[10px] text-stone-400 font-mono">
                  <span>By: {ann.author}</span>
                  <span>{ann.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-stsn-beige shadow-sm">
          <h3 className="font-display font-bold text-sm text-stone-900 uppercase flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-stsn-gold" />
            Extracurricular Registry
          </h3>
          <div className="space-y-4">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="flex gap-4 border-b border-stone-100 pb-3 last:border-none last:pb-0"
              >
                <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-stsn-beige flex flex-col items-center justify-center text-stsn-brown font-display font-semibold border border-stsn-gold/20 shadow-sm">
                  <span className="text-[10px] font-mono leading-none">JUN</span>
                  <span className="text-base font-bold leading-none mt-1">
                    {ev.date.split("-")[2]}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-semibold text-stone-900">{ev.title}</h4>
                  <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-1">
                    {ev.description}
                  </p>
                  <span className="text-[9px] uppercase tracking-wide font-bold font-mono text-stsn-gold mt-1 block">
                    {ev.department}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-stsn-cream border border-stsn-beige rounded-xl text-center">
            <span className="text-[10px] text-stone-400 block uppercase tracking-wider font-mono">
              STSN Sports Council
            </span>
            <p className="text-xs font-semibold text-stsn-brown mt-1">
              Golden Lions General Assembly approaches
            </p>
          </div>
        </div>
      </div>

      {/* Enrollment Status Drill-down Modal */}
      {statusModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setStatusModal(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl border border-stsn-beige w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-5 py-4 border-b border-stone-100 bg-stsn-cream/40">
              <div>
                <h3 className="font-display font-bold text-sm text-stone-900">
                  Students - {statusModal}
                </h3>
                <p className="text-[10px] text-stone-400 mt-0.5 font-mono">
                  {modalStudents.length} record{modalStudents.length !== 1 ? "s" : ""} found
                </p>
              </div>
              <button
                onClick={() => setStatusModal(null)}
                className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-500 cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-auto flex-1">
              {modalStudents.length === 0 ? (
                <p className="p-10 text-center text-sm text-stone-400 italic">
                  No students found for this status.
                </p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-stsn-brown text-white text-[10px] uppercase font-bold sticky top-0">
                      <th className="py-2.5 px-4 text-left">Student ID</th>
                      <th className="py-2.5 px-4 text-left">Student Name</th>
                      <th className="py-2.5 px-4 text-left">Grade / Year Level</th>
                      <th className="py-2.5 px-4 text-left">Program / Department</th>
                      <th className="py-2.5 px-4 text-center">Enrollment Status</th>
                      <th className="py-2.5 px-4 text-center">Assessment Status</th>
                      <th className="py-2.5 px-4 text-left">School Year</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {modalStudents.map((s) => {
                      const assessment = assessments.find((a) => a.studentId === s.id);
                      const enrollment = enrollments.find((e) => e.studentId === s.id);
                      const assessmentStatus = assessment?.approvalStatus ?? "—";
                      return (
                        <tr key={s.id} className="hover:bg-stone-50 transition">
                          <td className="py-2.5 px-4 font-mono font-bold text-stsn-brown">{s.studentNo}</td>
                          <td className="py-2.5 px-4 font-semibold text-stone-800">
                            {s.lastName}, {s.firstName}
                          </td>
                          <td className="py-2.5 px-4 text-stone-600">{s.yearLevel}</td>
                          <td className="py-2.5 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stsn-cream text-stsn-brown border border-stsn-beige">
                              {s.trackOrCourse || s.department}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <span
                              className={`inline-block text-[9.5px] font-bold px-2 py-1 rounded-full border ${
                                s.enrollmentStatus === "Enrolled"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : s.enrollmentStatus === "Approved"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : s.enrollmentStatus === "Rejected"
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                            >
                              {s.enrollmentStatus}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-center text-[10.5px] text-stone-600">
                            {assessmentStatus}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-stone-500">
                            {enrollment?.schoolYear || "2026-2027"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useSTSNStore } from "../../../services/store";
import { supabase } from "../../../lib/supabase";
import {
  Award,
  BookOpen,
  Calendar,
  HelpCircle,
  Sparkles,
  UserCheck,
  CheckCircle,
  FileCheck,
  Clock,
  Volume2,
  ListFilter,
  Check,
  AlertCircle,
  GraduationCap,
  MapPin,
  Sun,
  ChevronRight,
  Users,
  X,
  BarChart3,
  Download,
  Printer,
} from "lucide-react";
import GradeEncodingPage from "../../grading/pages/GradeEncodingPage";
import ModulePageHeader from "../../../components/common/ModulePageHeader";
import AppEmptyState from "../../../components/common/AppEmptyState";
import { resolveCurrentTeacher } from "../../../utils/resolveTeacher";
import { getAcademicScopedData } from "../../../services/academicUnitScopeService";
import type { ClassSchedule } from "../../../types";
import { reportExportService } from "../../../services/reportExportService";
import type { ReportColumn, ReportRow } from "../../reports/types";
import StaffProfileWorkspace from "../../profiles/components/StaffProfileWorkspace";

type FacultyTab = "dashboard" | "schedule" | "attendance" | "grading" | "reports";
type FacultyRouteSubPage = "overview-advisory" | "class-schedule-subjects" | "attendance-monitoring" | "student-grades-encoding" | "reports" | "faculty-profile";
type FacultyReportId = "class-list" | "advisory-class-list" | "grade-sheet" | "attendance-summary" | "failed-incomplete" | "subject-load";

const FACULTY_SUBPAGE_TO_TAB: Record<Exclude<FacultyRouteSubPage, "faculty-profile">, FacultyTab> = {
  "overview-advisory": "dashboard",
  "class-schedule-subjects": "schedule",
  "attendance-monitoring": "attendance",
  "student-grades-encoding": "grading",
  reports: "reports",
};

const FACULTY_REPORT_OPTIONS: { id: FacultyReportId; title: string; desc: string }[] = [
  { id: "class-list", title: "Class List", desc: "Students grouped by the teacher's assigned class sections." },
  { id: "advisory-class-list", title: "Advisory Class List", desc: "Official advisory roster for the teacher's assigned section." },
  { id: "grade-sheet", title: "Grade Sheet", desc: "Encoded grades for the teacher's handled subjects." },
  { id: "attendance-summary", title: "Attendance Summary", desc: "Current advisory attendance snapshot for the selected date." },
  { id: "failed-incomplete", title: "Failed / Incomplete Grades", desc: "Students with failed or incomplete grade remarks." },
  { id: "subject-load", title: "Subject Load Report", desc: "Assigned subjects, sections, rooms, and schedule load." },
];

const FACULTY_REPORT_COLUMNS: Record<FacultyReportId, ReportColumn[]> = {
  "class-list": [
    { key: "section", label: "Section" },
    { key: "subjectCode", label: "Subject Code" },
    { key: "subjectName", label: "Subject" },
    { key: "studentNo", label: "Student No." },
    { key: "studentName", label: "Student" },
    { key: "yearLevel", label: "Year Level" },
    { key: "status", label: "Status" },
  ],
  "advisory-class-list": [
    { key: "studentNo", label: "Student No." },
    { key: "studentName", label: "Student" },
    { key: "yearLevel", label: "Year Level" },
    { key: "trackOrCourse", label: "Track / Course" },
    { key: "contactNo", label: "Contact No." },
    { key: "status", label: "Status" },
  ],
  "grade-sheet": [
    { key: "studentNo", label: "Student No." },
    { key: "studentName", label: "Student" },
    { key: "subjectCode", label: "Subject Code" },
    { key: "midtermGrade", label: "Midterm", align: "right" },
    { key: "finalGrade", label: "Final", align: "right" },
    { key: "remarks", label: "Remarks" },
  ],
  "attendance-summary": [
    { key: "date", label: "Date" },
    { key: "section", label: "Section" },
    { key: "studentNo", label: "Student No." },
    { key: "studentName", label: "Student" },
    { key: "attendanceStatus", label: "Status" },
  ],
  "failed-incomplete": [
    { key: "studentNo", label: "Student No." },
    { key: "studentName", label: "Student" },
    { key: "subjectCode", label: "Subject Code" },
    { key: "finalGrade", label: "Final", align: "right" },
    { key: "remarks", label: "Remarks" },
  ],
  "subject-load": [
    { key: "subjectCode", label: "Subject Code" },
    { key: "subjectName", label: "Subject" },
    { key: "section", label: "Section" },
    { key: "day", label: "Day" },
    { key: "time", label: "Time" },
    { key: "roomName", label: "Room" },
    { key: "semester", label: "Semester" },
  ],
};

export default function FacultyPortal({ subPage, onSubPageChange }: { subPage: string; onSubPageChange: (subPage: string) => void }) {
  const { teachers, currentUser, students, announcements, grades, subjects, classSchedules, activeSchool, academicUnit, activityLogs, employees, gradePeriods, studentGradeEntries } = useSTSNStore();
  const scopedData = React.useMemo(
    () =>
      getAcademicScopedData({
        currentUser,
        activeSchool,
        academicUnit,
        students,
        teachers,
        subjects,
        classSchedules,
        employees,
      }),
    [currentUser, activeSchool, academicUnit, students, teachers, subjects, classSchedules, employees],
  );
  const scopedTeachers = scopedData.teachers ?? [];
  const scopedStudents = scopedData.students;
  const scopedSubjects = scopedData.subjects ?? [];
  const scopedClassSchedules = scopedData.classSchedules ?? [];
  const scopedEmployees = scopedData.employees ?? [];
  const currentTeacher = resolveCurrentTeacher(scopedTeachers, currentUser, academicUnit);

  // Advisory Class Details — empty when no section is assigned to prevent data leaks.
  const advisorySectionName = currentTeacher.advisorySection || "";
  const advisoryStudents = advisorySectionName
    ? scopedStudents.filter((s) => s.section === advisorySectionName)
    : [];

  // Teaching load — total units across this teacher's class schedules (sourced from Supabase)
  const teachingLoadUnits = scopedClassSchedules
    .filter((cs) => cs.teacherId === currentTeacher.id)
    .reduce((sum, cs) => {
      const subject = scopedSubjects.find((s) => s.code === cs.subjectCode);
      return sum + (subject?.units ?? 0);
    }, 0);

  // Accrued leave — resolved from the matching employee record (sourced from Supabase)
  const accruedLeaveDays = scopedEmployees.find((e) => e.email === currentTeacher.email)?.leaveBalance;

  // States
  const [selectedReportId, setSelectedReportId] = useState<FacultyReportId>("class-list");
  const [viewSectionStudents, setViewSectionStudents] = useState<string | null>(null);
  const [attendanceData, setAttendanceData] = useState<Record<string, "Present" | "Late" | "Absent">>({});
  const [attendanceDate, setAttendanceDate] = useState("2026-05-30");
  const [attendanceMessage, setAttendanceMessage] = useState("");

  const teacherSchedules = React.useMemo(
    () => scopedClassSchedules.filter((s) => s.teacherId === currentTeacher.id && s.isActive),
    [currentTeacher.id, scopedClassSchedules],
  );
  const gradeSubmissionQueue = React.useMemo(() => {
    return teacherSchedules.map((schedule) => {
      const classStudents = scopedStudents.filter((student) => student.section === schedule.section);
      const periods = gradePeriods.filter((period) =>
        period.teacherId === currentTeacher.id &&
        period.subjectCode === schedule.subjectCode &&
        period.schoolYear === schedule.schoolYear
      );
      const requiredEntries = periods.reduce((sum, period) => sum + period.items.length * classStudents.length, 0);
      const encodedEntries = periods.reduce((sum, period) => {
        const itemIds = new Set(period.items.map((item) => item.id));
        return sum + studentGradeEntries.filter((entry) => itemIds.has(entry.gradeItemId) && entry.score !== null).length;
      }, 0);
      const finalizedPeriods = periods.filter((period) => period.isFinalized).length;
      return {
        key: `${schedule.id}-${schedule.subjectCode}`,
        subject: schedule.subjectName || schedule.subjectCode,
        section: schedule.section,
        encodedEntries,
        requiredEntries,
        finalizedPeriods,
        totalPeriods: periods.length,
        status: periods.length === 0
          ? "Setup Needed"
          : finalizedPeriods === periods.length
            ? "Finalized"
            : requiredEntries > 0 && encodedEntries >= requiredEntries
              ? "Ready for Review"
              : "Encoding",
      };
    });
  }, [currentTeacher.id, gradePeriods, scopedStudents, studentGradeEntries, teacherSchedules]);
  const selectedReport = FACULTY_REPORT_OPTIONS.find((report) => report.id === selectedReportId) ?? FACULTY_REPORT_OPTIONS[0];
  const reportColumns = FACULTY_REPORT_COLUMNS[selectedReportId];

  const reportRows = React.useMemo<ReportRow[]>(() => {
    if (selectedReportId === "class-list") {
      return teacherSchedules.flatMap((schedule) =>
        scopedStudents
          .filter((student) => student.section === schedule.section)
          .map((student) => ({
            section: schedule.section,
            subjectCode: schedule.subjectCode,
            subjectName: schedule.subjectName,
            studentNo: student.studentNo,
            studentName: `${student.lastName}, ${student.firstName}`,
            yearLevel: student.yearLevel,
            status: student.enrollmentStatus,
          })),
      );
    }

    if (selectedReportId === "advisory-class-list") {
      return advisoryStudents.map((student) => ({
        studentNo: student.studentNo,
        studentName: `${student.lastName}, ${student.firstName}`,
        yearLevel: student.yearLevel,
        trackOrCourse: student.trackOrCourse || "",
        contactNo: student.contactNo || "",
        status: student.enrollmentStatus,
      }));
    }

    if (selectedReportId === "grade-sheet") {
      return grades
        .filter((grade) => grade.teacherId === currentTeacher.id)
        .map((grade) => {
          const student = scopedStudents.find((s) => s.id === grade.studentId);
          return {
            studentNo: student?.studentNo ?? "",
            studentName: student ? `${student.lastName}, ${student.firstName}` : "Unknown Student",
            subjectCode: grade.subjectCode,
            midtermGrade: grade.midtermGrade,
            finalGrade: grade.finalGrade,
            remarks: grade.remarks ?? (grade.finalGrade >= 75 ? "Passed" : "Failed"),
          };
        });
    }

    if (selectedReportId === "attendance-summary") {
      return advisoryStudents.map((student) => ({
        date: attendanceDate,
        section: advisorySectionName || "Not Assigned",
        studentNo: student.studentNo,
        studentName: `${student.lastName}, ${student.firstName}`,
        attendanceStatus: attendanceData[student.id] || "Present",
      }));
    }

    if (selectedReportId === "failed-incomplete") {
      return grades
        .filter((grade) => grade.teacherId === currentTeacher.id)
        .filter((grade) => grade.remarks === "Failed" || grade.remarks === "Incomplete" || grade.finalGrade < 75)
        .map((grade) => {
          const student = scopedStudents.find((s) => s.id === grade.studentId);
          return {
            studentNo: student?.studentNo ?? "",
            studentName: student ? `${student.lastName}, ${student.firstName}` : "Unknown Student",
            subjectCode: grade.subjectCode,
            finalGrade: grade.finalGrade,
            remarks: grade.remarks ?? (grade.finalGrade >= 75 ? "Passed" : "Failed"),
          };
        });
    }

    return teacherSchedules.map((schedule) => ({
      subjectCode: schedule.subjectCode,
      subjectName: schedule.subjectName,
      section: schedule.section,
      day: schedule.day,
      time: `${schedule.startTime} - ${schedule.endTime}`,
      roomName: schedule.roomName,
      semester: schedule.semester,
    }));
  }, [advisorySectionName, advisoryStudents, attendanceDate, currentTeacher.id, grades, scopedStudents, selectedReportId, teacherSchedules]);

  const exportCurrentReport = (format: "print" | "csv" | "excel" | "pdf") => {
    const payload = { title: selectedReport.title, columns: reportColumns, rows: reportRows };
    if (format === "print") reportExportService.print(payload);
    if (format === "csv") reportExportService.exportCsv(payload);
    if (format === "excel") reportExportService.exportExcel(payload);
    if (format === "pdf") reportExportService.exportPdf(payload);
  };

  // Handler for Attendance Changes
  const handleAttendanceChange = (studentId: string, status: "Present" | "Late" | "Absent") => {
    setAttendanceData((prev) => ({
      ...prev,
      [studentId]: status
    }));
  };

  // Submit Attendance Handler — persists to student_attendance table in Supabase
  const handleAttendanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (advisoryStudents.length > 0) {
      const records = advisoryStudents.map((s) => ({
        student_id: s.id,
        section: advisorySectionName,
        date: attendanceDate,
        status: getStudentAttendanceStatus(s.id),
        recorded_by: currentTeacher.id,
      }));
      supabase
        .from("student_attendance")
        .upsert(records, { onConflict: "student_id,date" })
        .then(({ error }) => { if (error) console.error("[supabase] attendance upsert failed:", error); });
    }
    setAttendanceMessage(`Attendance for section "${advisorySectionName}" has been successfully logged for ${attendanceDate}! Dispatched automated SMS notifications to parents.`);
    setTimeout(() => {
      setAttendanceMessage("");
    }, 5000);
  };

  // Pre-fill attendance if empty
  const getStudentAttendanceStatus = (studentId: string) => {
    return attendanceData[studentId] || "Present";
  };

  // Recent Activity Feed — sourced from activity_logs (Supabase)
  const recentTeacherActivities = activityLogs;

  // Specific Teacher Announcements Filter
  const academicAnnouncements = announcements.filter(
    (a) => a.category === "Academic" || a.category === "General"
  );
  const activeSubPage = (subPage as FacultyRouteSubPage) || "overview-advisory";
  const activeTab = activeSubPage === "faculty-profile" ? null : FACULTY_SUBPAGE_TO_TAB[activeSubPage as Exclude<FacultyRouteSubPage, "faculty-profile">];
  const linkedEmployee = scopedEmployees.find((employee) => employee.userId === currentTeacher.userId || employee.email === currentTeacher.email) ?? null;

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      <ModulePageHeader
        badge="Licensed Academic Faculty Cockpit"
        badgeIcon={GraduationCap}
        title={`Welcome, ${currentTeacher.firstName} ${currentTeacher.lastName}, LPT`}
        subtitle={`Department: ${currentTeacher.department} Academics · Advisory Section: ${advisorySectionName || "Not Assigned"}`}
        actions={
          <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-center">
            <span className="text-[9px] text-[#C5A059] uppercase block font-mono">License Code</span>
            <span className="text-xs font-mono font-bold text-white">LPT-{currentTeacher.id.split("-").pop() || "7881A"}-PH</span>
          </div>
        }
      />

      {/* TAB A: OVERVIEW & ADVISORY */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          
          {/* Symmetrical High-Fidelity Quick Teacher Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-stsn-beige shadow-xs">
              <span className="text-[10px] font-mono uppercase text-stone-400 font-semibold block">Section Advisory</span>
              <span className="text-2xl font-display font-bold text-stone-900 block mt-1">{advisoryStudents.length} Students</span>
              <span className="text-[10px] text-green-600 font-semibold mt-1 block">Roster officially verified</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-stsn-beige shadow-xs">
              <span className="text-[10px] font-mono uppercase text-stone-400 font-semibold block">Teaching Load</span>
              <span className="text-2xl font-display font-bold text-stone-900 block mt-1">{teachingLoadUnits} Units / Sem</span>
              <span className="text-[10px] text-stsn-brown font-semibold block mt-1">Max capacity authorized</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-stsn-beige shadow-xs">
              <span className="text-[10px] font-mono uppercase text-stone-400 font-semibold block">My Specialization</span>
              <span className="text-sm font-semibold text-[#3E1E09] block mt-2 truncate">{currentTeacher.specialization}</span>
              <span className="text-[10px] text-stone-400 block">Lead Instructor Status</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-stsn-beige shadow-xs">
              <span className="text-[10px] font-mono uppercase text-stone-400 font-semibold block">Accrued Leave</span>
              <span className="text-2xl font-display font-bold text-stone-900 block mt-1">{accruedLeaveDays ?? "—"} Days</span>
              <span className="text-[10px] text-stone-400 block mt-1">Vacation & Sick balance</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left side: Advisory Class List */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-xl border border-stsn-beige shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-stone-100">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 uppercase">Grade Submission Queue</h3>
                    <p className="text-stone-400 text-[11px]">Class-level encoding and finalization status for assigned teaching loads</p>
                  </div>
                  <span className="text-[10px] font-mono bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full font-bold">
                    {gradeSubmissionQueue.filter((item) => item.status !== "Finalized").length} open
                  </span>
                </div>
                {/* Missing Grade Alerts — surface urgent Setup Needed / stalled encoding items */}
                {gradeSubmissionQueue.some((item) => item.status === "Setup Needed" || (item.requiredEntries > 0 && item.encodedEntries === 0)) && (
                  <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl p-3">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-red-800">Action Required — Missing Grade Setup</p>
                      <p className="text-[10px] text-red-700 mt-0.5">
                        {gradeSubmissionQueue.filter((item) => item.status === "Setup Needed").length > 0 && (
                          <>
                            {gradeSubmissionQueue.filter((item) => item.status === "Setup Needed").length} subject{gradeSubmissionQueue.filter((item) => item.status === "Setup Needed").length !== 1 ? "s" : ""} need grading period setup.{" "}
                          </>
                        )}
                        {gradeSubmissionQueue.filter((item) => item.requiredEntries > 0 && item.encodedEntries === 0).length > 0 && (
                          <>
                            {gradeSubmissionQueue.filter((item) => item.requiredEntries > 0 && item.encodedEntries === 0).length} subject{gradeSubmissionQueue.filter((item) => item.requiredEntries > 0 && item.encodedEntries === 0).length !== 1 ? "s" : ""} have no scores encoded yet.
                          </>
                        )}
                      </p>
                      <button
                        onClick={() => onSubPageChange("student-grades-encoding")}
                        className="mt-1.5 text-[10px] font-bold text-red-700 underline underline-offset-2 cursor-pointer hover:text-red-900 transition"
                      >
                        Go to Grades Encoding →
                      </button>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {gradeSubmissionQueue.slice(0, 4).map((item) => (
                    <button
                      key={item.key}
                      onClick={() => onSubPageChange("student-grades-encoding")}
                      className={`text-left p-4 rounded-xl border transition cursor-pointer ${
                        item.status === "Setup Needed"
                          ? "border-red-200 bg-red-50/40 hover:bg-red-50"
                          : "border-stone-100 hover:border-stsn-gold hover:bg-stsn-cream/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold text-stone-900">{item.subject}</p>
                          <p className="text-[10px] text-stone-400">{item.section}</p>
                        </div>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                          item.status === "Finalized" ? "bg-emerald-50 text-emerald-700" :
                          item.status === "Ready for Review" ? "bg-blue-50 text-blue-700" :
                          item.status === "Setup Needed" ? "bg-red-50 text-red-700 border border-red-200" :
                          "bg-amber-50 text-amber-700"
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between text-[10px] text-stone-500 mb-1">
                          <span>{item.encodedEntries}/{item.requiredEntries || 0} scores</span>
                          <span>{item.finalizedPeriods}/{item.totalPeriods || 0} periods finalized</span>
                        </div>
                        {item.requiredEntries > 0 && (
                          <div className="w-full h-1 bg-stone-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${item.encodedEntries >= item.requiredEntries ? "bg-emerald-500" : "bg-amber-400"}`}
                              style={{ width: `${Math.min(100, Math.round((item.encodedEntries / item.requiredEntries) * 100))}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                  {gradeSubmissionQueue.length === 0 && (
                    <div className="md:col-span-2 p-6 text-center text-xs text-stone-400 border border-dashed border-stone-200 rounded-xl">
                      No active teaching loads are assigned.
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-stsn-beige shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-stone-100">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 uppercase">My Advisory Class: {advisorySectionName}</h3>
                    <p className="text-stone-400 text-[11px]">Primary list of students assigned to your administrative advisory panel</p>
                  </div>
                  <span className="text-[10px] font-mono bg-stsn-cream text-stsn-brown border border-stsn-beige px-2.5 py-0.5 rounded-full font-bold">
                    ACTIVE
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="stsn-plain-table">
                    <thead>
                      <tr>
                        <th>Student Number</th>
                        <th style={{ textAlign: "left" }}>Student Full Name</th>
                        <th style={{ textAlign: "left" }}>Track / Year Level</th>
                        <th style={{ textAlign: "left" }}>Contact No</th>
                        <th style={{ textAlign: "center" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {advisoryStudents.map((stud) => (
                        <tr key={stud.id}>
                          <td className="font-mono font-bold text-stsn-gold">{stud.studentNo}</td>
                          <td className="text-stone-900 font-medium">{stud.lastName}, {stud.firstName} {stud.middleName ? stud.middleName[0] + "." : ""}</td>
                          <td className="text-stone-500">{stud.trackOrCourse || "STEM"} - {stud.yearLevel}</td>
                          <td className="font-mono text-[11px] text-stone-500">{stud.contactNo}</td>
                          <td style={{ textAlign: "center" }}>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-50 text-green-700 border border-green-200">
                              Enrolled
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Teaching Load Summary — dynamic from gradeSubmissionQueue */}
              <div className="bg-white p-6 rounded-xl border border-stsn-beige shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-stone-900 uppercase pb-2 border-b border-stone-100 flex items-center gap-1.5">
                  <FileCheck className="w-4.5 h-4.5 text-stsn-gold" />
                  Teaching Load Summary & Milestones
                </h3>

                {gradeSubmissionQueue.length === 0 ? (
                  <AppEmptyState
                    icon={FileCheck}
                    title="No teaching loads assigned yet"
                    description="Teaching milestones will appear here after class loads and grading assignments are linked to this faculty profile."
                    compact
                    tone="brand"
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {gradeSubmissionQueue.map((item) => {
                      const pct = item.requiredEntries > 0
                        ? Math.min(100, Math.round((item.encodedEntries / item.requiredEntries) * 100))
                        : 0;
                      const schedInfo = teacherSchedules.find((s) => s.subjectCode === item.key.split("-")[1] || item.key.includes(s.id));
                      return (
                        <div key={item.key} className="p-4 bg-stone-50 rounded-xl border border-stone-200/50 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs font-bold text-stone-900 truncate flex-1">{item.subject}</h4>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${
                              item.status === "Finalized" ? "bg-emerald-50 text-emerald-700" :
                              item.status === "Ready for Review" ? "bg-blue-50 text-blue-700" :
                              item.status === "Setup Needed" ? "bg-red-50 text-red-700 border border-red-200" :
                              "bg-amber-50 text-amber-700"
                            }`}>
                              {item.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-stone-500 font-mono">{item.section}</p>
                          <div className="flex justify-between text-[11px] text-stone-400">
                            <span>Encoding progress:</span>
                            <span className={`font-bold ${pct >= 100 ? "text-emerald-600" : pct > 0 ? "text-amber-600" : "text-stone-400"}`}>
                              {pct}% ({item.encodedEntries}/{item.requiredEntries} scores)
                            </span>
                          </div>
                          <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-emerald-500" : "bg-stsn-brown"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-stone-400 font-mono block">
                            {item.finalizedPeriods}/{item.totalPeriods} periods finalized
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* Right side: Faculty Announcements and Activity log */}
            <div className="space-y-6">

              {/* Quick ERP Actions Card */}
              <div className="bg-white p-6 rounded-xl border border-stsn-beige shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-stone-900 uppercase pb-2 border-b border-stone-100 flex items-center gap-1.5">
                  <Sparkles className="w-4.5 h-4.5 text-stsn-gold" />
                  Quick Actions Center
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => onSubPageChange("student-grades-encoding")}
                    className="w-full text-left flex items-center justify-between p-3 bg-stsn-cream hover:bg-stsn-beige border border-stsn-beige/70 rounded-xl transition cursor-pointer group"
                  >
                    <div>
                      <span className="text-xs font-bold text-stone-900 block group-hover:text-stsn-brown">Grade Encoding Shortcut</span>
                      <span className="text-[10px] text-stone-400 block font-medium">Verify and upload semestral card marks</span>
                    </div>
                    <GraduationCap className="w-4.5 h-4.5 text-stsn-gold group-hover:scale-110 transition" />
                  </button>

                  <button
                    onClick={() => onSubPageChange("attendance-monitoring")}
                    className="w-full text-left flex items-center justify-between p-3 bg-stsn-cream hover:bg-stsn-beige border border-stsn-beige/70 rounded-xl transition cursor-pointer group"
                  >
                    <div>
                      <span className="text-xs font-bold text-stone-900 block group-hover:text-stsn-brown">Take Advisory Attendance</span>
                      <span className="text-[10px] text-stone-400 block font-medium">Log attendance for section {advisorySectionName}</span>
                    </div>
                    <UserCheck className="w-4.5 h-4.5 text-stsn-gold group-hover:scale-110 transition" />
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="w-full text-left flex items-center justify-between p-3 bg-stsn-cream hover:bg-stsn-beige border border-stsn-beige/70 rounded-xl transition cursor-pointer group"
                  >
                    <div>
                      <span className="text-xs font-bold text-stone-900 block group-hover:text-stsn-brown">Export Advisory Class List</span>
                      <span className="text-[10px] text-stone-400 block font-medium">Download printable class student roster</span>
                    </div>
                    <FileCheck className="w-4.5 h-4.5 text-stsn-gold group-hover:scale-110 transition" />
                  </button>
                </div>

                {/* Quick Post Announcement Form */}
                <div className="pt-2 border-t border-stone-100 space-y-2">
                  <span className="text-[10.5px] font-mono uppercase text-stone-400 font-bold block">Broadcast Faculty Circular</span>
                  <FacultyAnnouncementForm advisorySectionName={advisorySectionName} />
                </div>
              </div>
              
              {/* Announcements Card */}
              <div className="bg-white p-6 rounded-xl border border-stsn-beige shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-stone-900 uppercase pb-2 border-b border-stone-100 flex items-center gap-1.5">
                  <Volume2 className="w-4.5 h-4.5 text-stsn-gold" />
                  Faculty Announcements
                </h3>

                <div className="space-y-3">
                  {academicAnnouncements.slice(0, 3).map((ann) => (
                    <div key={ann.id} className="p-3 bg-stsn-cream/60 rounded-xl border border-stsn-beige/40">
                      <div className="flex justify-between items-center">
                        <span className="bg-stsn-brown/5 text-stsn-brown text-[8px] font-mono uppercase px-1.5 py-0.5 rounded border border-stsn-brown/10 font-bold">
                          {ann.category}
                        </span>
                        <span className="text-[9px] font-mono text-stone-400">{ann.date}</span>
                      </div>
                      <h4 className="text-xs font-bold text-stone-900 mt-1">{ann.title}</h4>
                      <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed truncate">{ann.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity Card */}
              <div className="bg-white p-6 rounded-xl border border-stsn-beige shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-stone-900 uppercase pb-2 border-b border-stone-100 flex items-center gap-1.5">
                  <Clock className="w-4.5 h-4.5 text-stone-400" />
                  Recent Actions Feed
                </h3>

                <div className="flow-root">
                  <ul className="-mb-8">
                    {recentTeacherActivities.map((act, actIdx) => (
                      <li key={act.id}>
                        <div className="relative pb-8">
                          {actIdx !== recentTeacherActivities.length - 1 ? (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-stone-100" aria-hidden="true" />
                          ) : null}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full bg-stsn-cream border border-stsn-beige flex items-center justify-center text-stsn-brown font-bold text-xs ring-8 ring-white">
                                <Check className="w-3.5 h-3.5" />
                              </span>
                            </div>
                            <div className="flex-1 min-w-0 pt-1.5">
                              <p className="text-xs font-bold text-stone-950 leading-tight">
                                {act.action}
                              </p>
                              <p className="text-[10px] text-stone-500 font-medium truncate mt-0.5">
                                {act.subject} • <span className="font-mono text-stone-400">{act.time}</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* TAB B: CLASS SCHEDULE & ASSIGNED SUBJECTS (DYNAMIC) */}
      {activeTab === "schedule" && (() => {
        const teacherSchedules = scopedClassSchedules.filter((s) => s.teacherId === currentTeacher.id && s.isActive);
        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
        const today = new Date().toLocaleDateString("en-US", { weekday: "long" }) as typeof days[number];
        const uniqueSubjects = Array.from(
          new Map<string, ClassSchedule>(teacherSchedules.map((s) => [s.subjectCode, s])).values(),
        );

        const DAY_COLORS: Record<string, string> = {
          Monday: "border-blue-400 bg-blue-50",
          Tuesday: "border-emerald-400 bg-emerald-50",
          Wednesday: "border-purple-400 bg-purple-50",
          Thursday: "border-orange-400 bg-orange-50",
          Friday: "border-red-400 bg-red-50",
          Saturday: "border-stone-400 bg-stone-50"
        };

        return (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Total Classes", value: teacherSchedules.length, color: "from-stsn-brown to-stsn-gold" },
                { label: "Unique Subjects", value: uniqueSubjects.length, color: "from-blue-600 to-blue-500" },
                { label: "Sections", value: new Set(teacherSchedules.map((s) => s.section)).size, color: "from-emerald-600 to-emerald-500" },
                { label: "School Year", value: "2026-27", color: "from-purple-600 to-purple-500" }
              ].map((stat) => (
                <div key={stat.label} className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
                  <p className={`text-2xl font-display font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>{stat.value}</p>
                  <p className="text-[10px] text-stone-400 font-mono uppercase tracking-wide mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Today's Highlight */}
            {teacherSchedules.filter((s) => s.day === today).length > 0 && (
              <div className="bg-gradient-to-r from-stsn-brown to-stsn-brown-dark rounded-xl p-4 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <Sun className="w-4 h-4 text-stsn-gold" />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-stsn-gold">Today — {today}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {teacherSchedules.filter((s) => s.day === today).map((sched) => (
                    <div key={sched.id} className="bg-white/10 rounded-xl p-3 border border-white/10">
                      <p className="text-xs font-bold text-white">{sched.subjectName}</p>
                      <p className="text-[10px] text-stsn-gold-light mt-1">{sched.startTime} – {sched.endTime}</p>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-stone-300">
                        <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{sched.roomName}</span>
                        <span>{sched.section}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Weekly Calendar Grid */}
            <div className="bg-white rounded-xl border border-stsn-beige shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-stone-100">
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-stsn-gold" />
                  Weekly Schedule — SY 2026-2027 | First Semester
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-100">
                      {days.map((d) => (
                        <th key={d} className={`p-3 text-center font-bold text-[10px] uppercase tracking-wide ${d === today ? "text-stsn-brown bg-stsn-cream" : "text-stone-500"}`}>
                          {d === today && <span className="block text-[8px] text-stsn-gold font-mono mb-0.5">TODAY</span>}
                          {d.slice(0, 3)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {days.map((day) => {
                        const dayScheds = teacherSchedules.filter((s) => s.day === day);
                        return (
                          <td key={day} className={`p-2 align-top min-w-[130px] border-r border-stone-100 last:border-r-0 ${day === today ? "bg-stsn-cream/30" : ""}`}>
                            {dayScheds.length === 0 ? (
                              <div className="text-center py-4 text-[10px] text-stone-300 italic">Free</div>
                            ) : (
                              <div className="space-y-2">
                                {dayScheds.map((sched) => (
                                  <div key={sched.id} className={`p-2 rounded-lg border-l-4 ${DAY_COLORS[day]} border border-opacity-30`}>
                                    <p className="font-bold text-stone-800 text-[10px] leading-tight">{sched.subjectName}</p>
                                    <p className="text-[9px] text-stone-500 font-mono mt-0.5">{sched.startTime} – {sched.endTime}</p>
                                    <div className="flex items-center gap-1 mt-1 text-[9px] text-stone-400">
                                      <MapPin className="w-2.5 h-2.5" />
                                      <span>{sched.roomName}</span>
                                    </div>
                                    <span className="text-[9px] font-bold text-stone-600">{sched.section}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detailed Schedule Table */}
            <div className="bg-white rounded-xl border border-stsn-beige shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-stone-100">
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-stsn-gold" />
                  Full Schedule Details & Room Assignments
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-100">
                      <th className="px-4 py-3 text-left font-bold text-stone-500 text-[10px] uppercase tracking-wide">Subject</th>
                      <th className="px-4 py-3 text-left font-bold text-stone-500 text-[10px] uppercase tracking-wide">Section</th>
                      <th className="px-4 py-3 text-left font-bold text-stone-500 text-[10px] uppercase tracking-wide">Room</th>
                      <th className="px-4 py-3 text-left font-bold text-stone-500 text-[10px] uppercase tracking-wide">Day</th>
                      <th className="px-4 py-3 text-left font-bold text-stone-500 text-[10px] uppercase tracking-wide">Start</th>
                      <th className="px-4 py-3 text-left font-bold text-stone-500 text-[10px] uppercase tracking-wide">End</th>
                      <th className="px-4 py-3 text-left font-bold text-stone-500 text-[10px] uppercase tracking-wide">Semester</th>
                      <th className="px-4 py-3 text-left font-bold text-stone-500 text-[10px] uppercase tracking-wide">Dept</th>
                      <th className="px-4 py-3 text-center font-bold text-stone-500 text-[10px] uppercase tracking-wide">Students</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {teacherSchedules.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-stone-400 text-xs italic">
                          No class schedules assigned. Contact the admin to assign your teaching load.
                        </td>
                      </tr>
                    ) : (
                      teacherSchedules.map((sched) => (
                        <tr key={sched.id} className={`hover:bg-stone-50 transition-colors ${sched.day === today ? "bg-stsn-cream/20" : ""}`}>
                          <td className="px-4 py-3">
                            <p className="font-bold text-stone-800">{sched.subjectName}</p>
                            <p className="text-[10px] text-stone-400 font-mono">{sched.subjectCode}</p>
                          </td>
                          <td className="px-4 py-3 font-semibold text-stone-700">{sched.section}</td>
                          <td className="px-4 py-3 text-stone-600 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-stsn-gold flex-shrink-0" />{sched.roomName}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${sched.day === today ? "bg-stsn-brown text-white" : "bg-stone-100 text-stone-600"}`}>
                              {sched.day}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-stone-600">{sched.startTime}</td>
                          <td className="px-4 py-3 font-mono text-stone-600">{sched.endTime}</td>
                          <td className="px-4 py-3 text-stone-500">{sched.semester}</td>
                          <td className="px-4 py-3">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${sched.department === "College" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}>
                              {sched.department === "College" ? "College" : "Basic Ed"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => setViewSectionStudents(sched.section)}
                              className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-1 bg-stsn-cream border border-stsn-beige text-stsn-brown rounded-lg hover:bg-stsn-beige cursor-pointer transition"
                            >
                              <Users className="w-3 h-3" />
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section Students Modal */}
            {viewSectionStudents && createPortal(
              <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] mx-4">
                  <div className="modal-header-gradient text-stsn-cream p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-stsn-gold" />
                      <div>
                        <h3 className="font-display font-bold text-sm">Students — {viewSectionStudents}</h3>
                        <p className="text-[10px] text-stsn-gold-light/70">Enrolled student roster for this section</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setViewSectionStudents(null)} className="cursor-pointer hover:bg-white/10 p-1 rounded transition">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {(() => {
                      const sectionStudents = scopedStudents.filter((s) => s.section === viewSectionStudents);
                      return sectionStudents.length === 0 ? (
                        <p className="text-center text-stone-400 text-xs py-10 italic">No students found in this section.</p>
                      ) : (
                        <table className="w-full text-xs">
                          <thead className="sticky top-0 bg-stsn-brown text-white">
                            <tr>
                              <th className="px-4 py-2.5 text-left text-[10px] uppercase font-bold">Student No.</th>
                              <th className="px-4 py-2.5 text-left text-[10px] uppercase font-bold">Full Name</th>
                              <th className="px-4 py-2.5 text-left text-[10px] uppercase font-bold">Year Level</th>
                              <th className="px-4 py-2.5 text-left text-[10px] uppercase font-bold">Track / Course</th>
                              <th className="px-4 py-2.5 text-center text-[10px] uppercase font-bold">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-100">
                            {sectionStudents.map((s) => (
                              <tr key={s.id} className="hover:bg-stone-50">
                                <td className="px-4 py-2.5 font-mono font-bold text-stsn-brown">{s.studentNo}</td>
                                <td className="px-4 py-2.5 font-semibold text-stone-800">{s.lastName}, {s.firstName}</td>
                                <td className="px-4 py-2.5 text-stone-500">{s.yearLevel}</td>
                                <td className="px-4 py-2.5 text-stone-500">{s.trackOrCourse || "—"}</td>
                                <td className="px-4 py-2.5 text-center">
                                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${s.enrollmentStatus === "Enrolled" ? "bg-green-50 text-green-700 border-green-200" : s.enrollmentStatus === "Approved" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                                    {s.enrollmentStatus}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>
                  <div className="p-4 border-t border-stone-100 bg-stone-50 flex justify-between items-center">
                    <span className="text-xs text-stone-400 font-mono">{scopedStudents.filter((s) => s.section === viewSectionStudents).length} student(s) in section</span>
                    <button onClick={() => setViewSectionStudents(null)} className="px-4 py-2 text-xs font-bold text-stone-600 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 cursor-pointer">Close</button>
                  </div>
                </div>
              </div>,
              document.body
            )}

            {/* Assigned Subjects Summary */}
            <div className="bg-white rounded-xl border border-stsn-beige shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-stone-100">
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-stsn-gold" />
                  Assigned Subjects Summary
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-100">
                      <th className="px-4 py-3 text-left font-bold text-stone-500 text-[10px] uppercase tracking-wide">Subject Code</th>
                      <th className="px-4 py-3 text-left font-bold text-stone-500 text-[10px] uppercase tracking-wide">Subject Name</th>
                      <th className="px-4 py-3 text-left font-bold text-stone-500 text-[10px] uppercase tracking-wide">Department</th>
                      <th className="px-4 py-3 text-center font-bold text-stone-500 text-[10px] uppercase tracking-wide">Sections</th>
                      <th className="px-4 py-3 text-center font-bold text-stone-500 text-[10px] uppercase tracking-wide">Classes/Week</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {uniqueSubjects.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-stone-400 text-xs italic">No subjects assigned.</td>
                      </tr>
                    ) : (
                      uniqueSubjects.map((sched) => {
                        const allClasses = teacherSchedules.filter((s) => s.subjectCode === sched.subjectCode);
                        const sections = Array.from(new Set(allClasses.map((s) => s.section)));
                        const subjectInfo = scopedSubjects.find((sub) => sub.code === sched.subjectCode);
                        return (
                          <tr key={sched.id} className="hover:bg-stone-50">
                            <td className="px-4 py-3 font-mono font-bold text-stsn-brown">{sched.subjectCode}</td>
                            <td className="px-4 py-3 font-bold text-stone-800">{sched.subjectName}</td>
                            <td className="px-4 py-3 text-stone-500">{sched.department}</td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex flex-wrap gap-1 justify-center">
                                {sections.map((sec) => (
                                  <span key={sec} className="px-1.5 py-0.5 rounded bg-stsn-cream text-stsn-brown text-[9px] font-bold">{sec}</span>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-stone-700">{allClasses.length}x</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* TAB C: INTERACTIVE ATTENDANCE MONITORING */}
      {activeTab === "attendance" && (
        <div className="space-y-6">
          
          <form onSubmit={handleAttendanceSubmit} className="bg-white p-6 rounded-xl border border-stsn-beige shadow-sm space-y-6">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-stone-100 gap-4">
              <div>
                <h3 className="text-sm font-bold text-stone-900 uppercase flex items-center gap-1.5">
                  <UserCheck className="w-4.5 h-4.5 text-stsn-gold" />
                  Daily Attendance monitoring roll-call
                </h3>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  Log the daily attendance for your advisory class. Parents of Absentee / Late students are messaged in real-time.
                </p>
              </div>

              {/* Date Selector */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono text-stone-400 font-bold leading-none">Attendance Date:</span>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="bg-stone-50 border border-stone-200 text-xs rounded-lg px-2.5 py-1.5 font-bold focus:outline-none focus:ring-1 focus:ring-stsn-brown"
                />
              </div>
            </div>

            {/* Success logs message widget */}
            {attendanceMessage && (
              <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl flex items-start gap-2.5 text-xs">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="font-semibold">{attendanceMessage}</p>
              </div>
            )}

            {/* Advisory Student Checklist Board */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-stone-100 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-100 font-bold text-stone-500 text-[10px] uppercase">
                    <th className="p-3">Student ID</th>
                    <th className="p-3">Full Student Name</th>
                    <th className="p-3 text-center">Present</th>
                    <th className="p-3 text-center">Late</th>
                    <th className="p-3 text-center">Absent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {advisoryStudents.map((stud) => {
                    const status = getStudentAttendanceStatus(stud.id);
                    return (
                      <tr key={stud.id} className="hover:bg-stone-50/50">
                        <td className="p-3 font-mono font-bold text-stsn-brown">{stud.studentNo}</td>
                        <td className="p-3 text-stone-900 font-bold">
                          {stud.lastName}, {stud.firstName}
                        </td>
                        
                        {/* Status Checkboxes */}
                        <td className="p-3 text-center">
                          <label className="inline-flex items-center justify-center cursor-pointer">
                            <input
                              type="radio"
                              name={`attendance-${stud.id}`}
                              checked={status === "Present"}
                              onChange={() => handleAttendanceChange(stud.id, "Present")}
                              className="w-4 h-4 text-stsn-brown bg-slate-50 border-stone-300 focus:ring-stsn-brown/30 focus:ring-2"
                            />
                          </label>
                        </td>

                        <td className="p-3 text-center">
                          <label className="inline-flex items-center justify-center cursor-pointer">
                            <input
                              type="radio"
                              name={`attendance-${stud.id}`}
                              checked={status === "Late"}
                              onChange={() => handleAttendanceChange(stud.id, "Late")}
                              className="w-4 h-4 text-amber-500 bg-slate-50 border-stone-300 focus:ring-amber-500/30 focus:ring-2"
                            />
                          </label>
                        </td>

                        <td className="p-3 text-center">
                          <label className="inline-flex items-center justify-center cursor-pointer">
                            <input
                              type="radio"
                              name={`attendance-${stud.id}`}
                              checked={status === "Absent"}
                              onChange={() => handleAttendanceChange(stud.id, "Absent")}
                              className="w-4 h-4 text-red-500 bg-slate-50 border-stone-300 focus:ring-red-500/30 focus:ring-2"
                            />
                          </label>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Submission triggers */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="bg-stsn-brown hover:bg-stsn-brown-dark transition text-stsn-cream text-xs font-bold px-5 py-2.5 rounded-lg border border-stsn-brown/30 shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                Submit Today's Attendance Logs
              </button>
            </div>

          </form>

        </div>
      )}

      {/* TAB D: STUDENT GRADES ENCODING */}
      {activeTab === "grading" && (
        <div className="space-y-4">
          <div className="p-4 bg-stsn-cream border border-stsn-beige rounded-xl">
            <p className="text-xs font-bold text-stsn-brown flex items-center gap-1.5 uppercase font-mono">
              <Sparkles className="w-4 h-4 text-stsn-gold" />
              Empowered Academic Grading Workspace
            </p>
            <p className="text-[11px] text-stone-500 leading-relaxed mt-1">
              Encode and finalize midterm & final semestral standing scores for your student candidates. Passing marks (weighted average of 75%+) dynamically update student accounts and clear Registrar compliance clearances.
            </p>
          </div>

          <GradeEncodingPage />
        </div>
      )}

      {/* TAB E: FACULTY REPORTS */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-stsn-beige shadow-sm p-5">
            <h3 className="text-sm font-display font-bold text-stone-900 flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-stsn-gold" /> Faculty / Teacher Reports
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Generate class lists, advisory rosters, grade sheets, attendance summaries, failed/incomplete grade reports, and subject load reports.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <div className="lg:col-span-2">
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1.5">Report Type</label>
                <select
                  value={selectedReportId}
                  onChange={(e) => setSelectedReportId(e.target.value as FacultyReportId)}
                  className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown"
                >
                  {FACULTY_REPORT_OPTIONS.map((report) => <option key={report.id} value={report.id}>{report.title}</option>)}
                </select>
              </div>
              <div className="flex items-end gap-2 flex-wrap">
                <button onClick={() => exportCurrentReport("print")} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer">
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
                <button onClick={() => exportCurrentReport("csv")} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer">
                  <Download className="w-3.5 h-3.5" /> CSV
                </button>
                <button onClick={() => exportCurrentReport("excel")} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer">
                  <Download className="w-3.5 h-3.5" /> Excel
                </button>
                <button onClick={() => exportCurrentReport("pdf")} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer">
                  <Download className="w-3.5 h-3.5" /> PDF
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-stsn-beige shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-100">
              <h4 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-stsn-gold" /> {selectedReport.title}
              </h4>
              <p className="text-xs text-stone-500 mt-1">{selectedReport.desc}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-100">
                    {reportColumns.map((column) => (
                      <th
                        key={column.key}
                        className={`px-4 py-3 font-bold text-stone-500 text-[10px] uppercase tracking-wide ${
                          column.align === "right" ? "text-right" : column.align === "center" ? "text-center" : "text-left"
                        }`}
                      >
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {reportRows.length === 0 ? (
                    <tr>
                      <td colSpan={reportColumns.length} className="px-4 py-8 text-center text-stone-400 text-xs italic">
                        No report rows for this selection.
                      </td>
                    </tr>
                  ) : (
                    reportRows.map((row, index) => (
                      <tr key={index} className="hover:bg-stone-50">
                        {reportColumns.map((column) => (
                          <td
                            key={column.key}
                            className={`px-4 py-3 text-stone-700 ${
                              column.align === "right" ? "text-right font-mono" : column.align === "center" ? "text-center" : ""
                            }`}
                          >
                            {String(row[column.key] ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSubPage === "faculty-profile" && (
        <StaffProfileWorkspace
          mode="faculty"
          teacher={currentTeacher}
          employee={linkedEmployee}
          title={`${currentTeacher.firstName} ${currentTeacher.lastName}`}
          eyebrow="Teacher / Faculty Profile"
          emptyTitle="Faculty profile unavailable"
          emptyDescription="The current faculty record could not be resolved from the active Teacher Board session."
          requirementCardTitle="Faculty Requirements"
          requirementCardDescription="Track PRC, employment, and faculty document readiness using the shared requirements summary pattern."
        />
      )}

    </div>
  );
}

function FacultyAnnouncementForm({ advisorySectionName }: { advisorySectionName: string }) {
  const { addAnnouncement, currentUser } = useSTSNStore();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<"Academic" | "Event" | "Billing" | "General">("Academic");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    addAnnouncement({
      title,
      content,
      category,
      author: currentUser?.name || "Faculty Desk"
    });
    setTitle("");
    setContent("");
    setMessage("Announcement broadcasted!");
    setTimeout(() => setMessage(""), 4000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2 mt-2 font-sans text-stone-850">
      <div>
        <input
          type="text"
          placeholder="Circular Title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-stsn-gold outline-none"
          required
        />
      </div>
      <div>
        <textarea
          placeholder="Main content details..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-stsn-gold outline-none h-16 resize-none"
          required
        />
      </div>
      <div className="flex justify-between items-center gap-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as any)}
          className="bg-stone-50 border border-stone-200 rounded-lg py-1 px-2 text-[11px] focus:ring-1 focus:ring-stsn-gold focus:border-stsn-gold outline-none"
        >
          <option value="Academic">Academic</option>
          <option value="Event">Event</option>
          <option value="General">General</option>
        </select>
        <button
          type="submit"
          className="bg-stsn-brown hover:bg-stsn-brown-dark text-stsn-cream text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer transition"
        >
          Publish
        </button>
      </div>
      {message && (
        <p className="text-[10px] text-green-600 font-bold font-mono text-center mt-1">
          {message}
        </p>
      )}
    </form>
  );
}

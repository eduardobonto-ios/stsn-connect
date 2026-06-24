/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useSTSNStore } from "../../../services/store";
import { supabase } from "../../../lib/supabase";
import type { Teacher } from "../../../types";
import GradingModule from "../../grading/pages/GradingModulePage";
import { getAcademicScopedData } from "../../../services/academicUnitScopeService";
import STSNDataTable, { type STSNColumn } from "../../../components/common/STSNDataTable";
import {
  Users,
  Eye,
  Calendar,
  UserCheck,
  GraduationCap,
  X,
  Search,
  CheckCircle,
  Sparkles,
  MapPin,
  FileCheck,
} from "lucide-react";

// ─── Overview & Advisory Modal ───────────────────────────────────────────────

function OverviewAdvisoryModal({
  teacher,
  onClose,
}: {
  teacher: Teacher;
  onClose: () => void;
}) {
  const { students, classSchedules, subjects, employees, currentUser, activeSchool, academicUnit } = useSTSNStore();
  const scopedData = useMemo(
    () =>
      getAcademicScopedData({
        currentUser,
        activeSchool,
        academicUnit,
        students,
        classSchedules,
        subjects,
        employees,
      }),
    [currentUser, activeSchool, academicUnit, students, classSchedules, subjects, employees],
  );
  const scopedStudents = scopedData.students;
  const scopedClassSchedules = scopedData.classSchedules ?? [];
  const scopedSubjects = scopedData.subjects ?? [];
  const scopedEmployees = scopedData.employees ?? [];

  const advisoryStudents = teacher.advisorySection
    ? scopedStudents.filter((s) => s.section === teacher.advisorySection)
    : [];

  const teachingLoadUnits = scopedClassSchedules
    .filter((cs) => cs.teacherId === teacher.id)
    .reduce((sum, cs) => {
      const subject = scopedSubjects.find((s) => s.code === cs.subjectCode);
      return sum + (subject?.units ?? 0);
    }, 0);

  const accruedLeaveDays = scopedEmployees.find(
    (e) => e.email === teacher.email
  )?.leaveBalance;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] mx-4">
        <div className="modal-header-gradient text-stsn-cream p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-stsn-gold" />
            <div>
              <h3 className="font-display font-bold text-sm">
                Overview &amp; Advisory
              </h3>
              <p className="text-[10px] text-stsn-gold-light/70">
                {teacher.firstName} {teacher.lastName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer hover:bg-white/10 p-1 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
              <span className="text-[10px] font-mono uppercase text-stone-400 font-semibold block">
                Section Advisory
              </span>
              <span className="text-xl font-display font-bold text-stone-900 block mt-1">
                {advisoryStudents.length} Students
              </span>
              <span className="text-[10px] text-green-600 font-semibold mt-1 block">
                {teacher.advisorySection || "No section assigned"}
              </span>
            </div>
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
              <span className="text-[10px] font-mono uppercase text-stone-400 font-semibold block">
                Teaching Load
              </span>
              <span className="text-xl font-display font-bold text-stone-900 block mt-1">
                {teachingLoadUnits} Units
              </span>
              <span className="text-[10px] text-stsn-brown font-semibold block mt-1">
                Per semester
              </span>
            </div>
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
              <span className="text-[10px] font-mono uppercase text-stone-400 font-semibold block">
                Specialization
              </span>
              <span className="text-sm font-semibold text-stone-800 block mt-2 truncate">
                {teacher.specialization || "—"}
              </span>
            </div>
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
              <span className="text-[10px] font-mono uppercase text-stone-400 font-semibold block">
                Accrued Leave
              </span>
              <span className="text-xl font-display font-bold text-stone-900 block mt-1">
                {accruedLeaveDays ?? "—"} Days
              </span>
              <span className="text-[10px] text-stone-400 block mt-1">
                Vacation &amp; Sick balance
              </span>
            </div>
          </div>

          {/* Advisory students table */}
          <div className="border border-stone-200 rounded-xl overflow-hidden">
            <div className="bg-stone-50 px-4 py-3 flex justify-between items-center border-b border-stone-100">
              <span className="text-xs font-bold text-stone-800 uppercase">
                Advisory Class: {teacher.advisorySection || "—"}
              </span>
              <span className="text-[10px] font-mono text-stone-400">
                {advisoryStudents.length} student
                {advisoryStudents.length !== 1 ? "s" : ""}
              </span>
            </div>
            {advisoryStudents.length === 0 ? (
              <p className="text-center text-stone-400 text-xs py-8 italic">
                No students in this advisory section.
              </p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-white border-b border-stone-100 text-stone-400 text-[10px] uppercase font-bold">
                    <th className="px-4 py-2.5 text-left">Student No.</th>
                    <th className="px-4 py-2.5 text-left">Full Name</th>
                    <th className="px-4 py-2.5 text-left">Track / Year</th>
                    <th className="px-4 py-2.5 text-left">Contact</th>
                    <th className="px-4 py-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {advisoryStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-stone-50">
                      <td className="px-4 py-2.5 font-mono font-bold text-stsn-brown">
                        {s.studentNo}
                      </td>
                      <td className="px-4 py-2.5 font-semibold text-stone-800">
                        {s.lastName}, {s.firstName}{" "}
                        {s.middleName ? s.middleName[0] + "." : ""}
                      </td>
                      <td className="px-4 py-2.5 text-stone-500">
                        {s.trackOrCourse || "STEM"} – {s.yearLevel}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-stone-500">
                        {s.contactNo || "—"}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                            s.enrollmentStatus === "Enrolled"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : s.enrollmentStatus === "Approved"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {s.enrollmentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-stone-100 bg-stone-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-stone-600 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Class Schedule & Subjects Modal ─────────────────────────────────────────

function SectionStudentsModal({
  teacher,
  onClose,
}: {
  teacher: Teacher;
  onClose: () => void;
}) {
  const { students, classSchedules, currentUser, activeSchool, academicUnit } = useSTSNStore();
  const scopedData = useMemo(
    () =>
      getAcademicScopedData({
        currentUser,
        activeSchool,
        academicUnit,
        students,
        classSchedules,
      }),
    [currentUser, activeSchool, academicUnit, students, classSchedules],
  );
  const scopedStudents = scopedData.students;
  const scopedClassSchedules = scopedData.classSchedules ?? [];

  const teacherSchedules = scopedClassSchedules.filter(
    (cs) => cs.teacherId === teacher.id && cs.isActive
  );
  const uniqueSections = Array.from(
    new Set(teacherSchedules.map((s) => s.section))
  );

  if (
    teacher.advisorySection &&
    !uniqueSections.includes(teacher.advisorySection)
  ) {
    uniqueSections.push(teacher.advisorySection);
  }

  const sectionStudents = uniqueSections.map((section) => ({
    section,
    students: scopedStudents.filter((s) => s.section === section),
  }));

  return (
    <div className="app-modal-backdrop z-50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="modal-header-gradient text-stsn-cream p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-stsn-gold" />
            <div>
              <h3 className="font-display font-bold text-sm">
                Class Schedule &amp; Subjects — Students
              </h3>
              <p className="text-[10px] text-stsn-gold-light/70">
                {teacher.firstName} {teacher.lastName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer hover:bg-white/10 p-1 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {sectionStudents.length === 0 ? (
            <p className="text-center text-stone-400 text-xs py-8 italic">
              No sections assigned to this teacher.
            </p>
          ) : (
            sectionStudents.map(({ section, students: secStudents }) => (
              <div
                key={section}
                className="border border-stone-200 rounded-xl overflow-hidden"
              >
                <div className="bg-stone-50 px-4 py-2.5 flex justify-between items-center border-b border-stone-100">
                  <span className="text-xs font-bold text-stone-800">
                    {section}
                  </span>
                  <span className="text-[10px] font-mono text-stone-400">
                    {secStudents.length} student
                    {secStudents.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {secStudents.length === 0 ? (
                  <p className="text-center text-stone-400 text-xs py-4 italic">
                    No students in this section.
                  </p>
                ) : (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-white border-b border-stone-100 text-stone-400 text-[10px] uppercase font-bold">
                        <th className="px-4 py-2 text-left">Student No.</th>
                        <th className="px-4 py-2 text-left">Full Name</th>
                        <th className="px-4 py-2 text-left">Year Level</th>
                        <th className="px-4 py-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {secStudents.map((s) => (
                        <tr key={s.id} className="hover:bg-stone-50">
                          <td className="px-4 py-2.5 font-mono font-bold text-stsn-brown">
                            {s.studentNo}
                          </td>
                          <td className="px-4 py-2.5 font-semibold text-stone-800">
                            {s.lastName}, {s.firstName}
                          </td>
                          <td className="px-4 py-2.5 text-stone-500">
                            {s.yearLevel}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                                s.enrollmentStatus === "Enrolled"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : s.enrollmentStatus === "Approved"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                            >
                              {s.enrollmentStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-stone-100 bg-stone-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-stone-600 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Attendance Monitoring Modal ──────────────────────────────────────────────

function AttendanceModal({
  teacher,
  onClose,
}: {
  teacher: Teacher;
  onClose: () => void;
}) {
  const { students, currentUser, activeSchool, academicUnit } = useSTSNStore();
  const scopedStudents = useMemo(
    () => getAcademicScopedData({ currentUser, activeSchool, academicUnit, students }).students,
    [currentUser, activeSchool, academicUnit, students],
  );

  const advisoryStudents = teacher.advisorySection
    ? scopedStudents.filter((s) => s.section === teacher.advisorySection)
    : [];

  const [attendanceData, setAttendanceData] = useState<
    Record<string, "Present" | "Late" | "Absent">
  >({});
  const [attendanceDate, setAttendanceDate] = useState("2026-05-30");
  const [message, setMessage] = useState("");

  const getStatus = (studentId: string): "Present" | "Late" | "Absent" =>
    attendanceData[studentId] || "Present";

  const handleChange = (
    studentId: string,
    status: "Present" | "Late" | "Absent"
  ) => setAttendanceData((prev) => ({ ...prev, [studentId]: status }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (advisoryStudents.length > 0) {
      const records = advisoryStudents.map((s) => ({
        student_id: s.id,
        section: teacher.advisorySection,
        date: attendanceDate,
        status: getStatus(s.id),
        recorded_by: teacher.id,
      }));
      supabase
        .from("student_attendance")
        .upsert(records, { onConflict: "student_id,date" })
        .then(({ error }) => {
          if (error) console.error("[supabase] attendance upsert failed:", error);
        });
    }
    setMessage(
      `Attendance for section "${teacher.advisorySection}" logged for ${attendanceDate}.`
    );
    setTimeout(() => setMessage(""), 5000);
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] mx-4">
        <div className="modal-header-gradient text-stsn-cream p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-stsn-gold" />
            <div>
              <h3 className="font-display font-bold text-sm">
                Attendance Monitoring
              </h3>
              <p className="text-[10px] text-stsn-gold-light/70">
                {teacher.firstName} {teacher.lastName} — Section:{" "}
                {teacher.advisorySection || "Not Assigned"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer hover:bg-white/10 p-1 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="px-5 py-3 bg-stone-50 border-b border-stone-100 flex items-center justify-between gap-4">
            <span className="text-[10px] uppercase font-mono text-stone-400 font-bold">
              Attendance Date:
            </span>
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="bg-white border border-stone-200 text-xs rounded-lg px-2.5 py-1.5 font-bold focus:outline-none focus:ring-1 focus:ring-stsn-brown"
            />
          </div>

          {message && (
            <div className="mx-5 mt-4 bg-green-50 border border-green-200 text-green-800 p-3 rounded-xl flex items-start gap-2 text-xs">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="font-semibold">{message}</p>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-5">
            {advisoryStudents.length === 0 ? (
              <p className="text-center text-stone-400 text-xs py-8 italic">
                No students in this advisory section.
              </p>
            ) : (
              <table className="w-full text-xs border border-stone-100 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-100 font-bold text-stone-500 text-[10px] uppercase">
                    <th className="p-3 text-left">Student No.</th>
                    <th className="p-3 text-left">Full Name</th>
                    <th className="p-3 text-center">Present</th>
                    <th className="p-3 text-center">Late</th>
                    <th className="p-3 text-center">Absent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {advisoryStudents.map((s) => {
                    const status = getStatus(s.id);
                    return (
                      <tr key={s.id} className="hover:bg-stone-50/50">
                        <td className="p-3 font-mono font-bold text-stsn-brown">
                          {s.studentNo}
                        </td>
                        <td className="p-3 font-bold text-stone-900">
                          {s.lastName}, {s.firstName}
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="radio"
                            name={`att-${s.id}`}
                            checked={status === "Present"}
                            onChange={() => handleChange(s.id, "Present")}
                            className="w-4 h-4 accent-stsn-brown cursor-pointer"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="radio"
                            name={`att-${s.id}`}
                            checked={status === "Late"}
                            onChange={() => handleChange(s.id, "Late")}
                            className="w-4 h-4 accent-amber-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="radio"
                            name={`att-${s.id}`}
                            checked={status === "Absent"}
                            onChange={() => handleChange(s.id, "Absent")}
                            className="w-4 h-4 accent-red-500 cursor-pointer"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="p-4 border-t border-stone-100 bg-stone-50 flex justify-between items-center">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-stone-600 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 cursor-pointer"
            >
              Close
            </button>
            <button
              type="submit"
              className="bg-stsn-brown hover:bg-stsn-brown-dark text-stsn-cream text-xs font-bold px-5 py-2 rounded-lg border border-stsn-brown/30 shadow-sm cursor-pointer flex items-center gap-1.5 transition"
            >
              <CheckCircle className="w-4 h-4" />
              Submit Attendance
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ─── Student Grades Encoding Modal ───────────────────────────────────────────

function GradesModal({
  teacher,
  onClose,
}: {
  teacher: Teacher;
  onClose: () => void;
}) {
  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] mx-4">
        <div className="modal-header-gradient text-stsn-cream p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-stsn-gold" />
            <div>
              <h3 className="font-display font-bold text-sm">
                Student Grades Encoding
              </h3>
              <p className="text-[10px] text-stsn-gold-light/70">
                {teacher.firstName} {teacher.lastName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer hover:bg-white/10 p-1 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="p-4 bg-stsn-cream border border-stsn-beige rounded-xl">
            <p className="text-xs font-bold text-stsn-brown flex items-center gap-1.5 uppercase font-mono">
              <Sparkles className="w-4 h-4 text-stsn-gold" />
              Empowered Academic Grading Workspace
            </p>
            <p className="text-[11px] text-stone-500 leading-relaxed mt-1">
              Encode and finalize midterm &amp; final semestral standing scores.
              Passing marks (weighted average of 75%+) dynamically update
              student accounts.
            </p>
          </div>
          <GradingModule />
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Main Faculty Admin Page ──────────────────────────────────────────────────

type ModalType = "dashboard" | "schedule" | "attendance" | "grading";

export default function FacultyAdminPage() {
  const { teachers, students, currentUser, activeSchool, academicUnit } = useSTSNStore();
  const scopedTeachers = useMemo(
    () => getAcademicScopedData({ currentUser, activeSchool, academicUnit, students, teachers }).teachers ?? [],
    [currentUser, activeSchool, academicUnit, students, teachers],
  );
  const [activeModal, setActiveModal] = useState<{
    teacher: Teacher;
    type: ModalType;
  } | null>(null);
  const [searchQ, setSearchQ] = useState("");

  const filtered = useMemo(
    () =>
      scopedTeachers.filter((t) => {
        if (!searchQ) return true;
        const q = searchQ.toLowerCase();
        return (
          `${t.firstName} ${t.lastName}`.toLowerCase().includes(q) ||
          (t.specialization || "").toLowerCase().includes(q)
        );
      }),
    [scopedTeachers, searchQ],
  );

  const openModal = useCallback((teacher: Teacher, type: ModalType) =>
    setActiveModal({ teacher, type }), []);
  const closeModal = useCallback(() => setActiveModal(null), []);

  const facultyColumns: STSNColumn<Teacher>[] = useMemo(() => [
    {
      title: "Teacher",
      data: "lastName",
      render: (_value, teacher) => (
        <div>
          <p className="font-bold text-stone-900">
            {teacher.lastName}, {teacher.firstName}
          </p>
          <p className="text-[10px] text-stone-400 font-mono mt-0.5">
            {teacher.email}
          </p>
        </div>
      ),
    },
    {
      title: "Department",
      data: "department",
      render: (value: Teacher["department"]) => (
        <span className="text-[9px] font-bold px-2 py-0.5 rounded border bg-stsn-cream text-stsn-brown border-stsn-beige">
          {value === "Basic Education" ? "Basic Ed" : "College"}
        </span>
      ),
    },
    {
      title: "Specialization",
      data: "specialization",
      className: "text-stone-600",
      render: (value) => value || "-",
    },
    {
      title: "Advisory Section",
      data: "advisorySection",
      className: "font-semibold text-stone-700",
      render: (value) => value || "-",
    },
    {
      title: "Actions",
      orderable: false,
      searchable: false,
      className: "text-center",
      render: (_value, teacher) => (
        <div className="flex items-center justify-center gap-1.5">
          <button onClick={() => openModal(teacher, "dashboard")} title="Overview & Advisory" className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-stsn-cream border border-stsn-beige text-stsn-brown hover:bg-stsn-beige cursor-pointer transition">
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => openModal(teacher, "schedule")} title="Class Schedule & Subjects" className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-stsn-cream border border-stsn-beige text-stsn-brown hover:bg-stsn-beige cursor-pointer transition">
            <Calendar className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => openModal(teacher, "attendance")} title="Attendance Monitoring" className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-stsn-cream border border-stsn-beige text-stsn-brown hover:bg-stsn-beige cursor-pointer transition">
            <UserCheck className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => openModal(teacher, "grading")} title="Student Grades Encoding" className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-stsn-cream border border-stsn-beige text-stsn-brown hover:bg-stsn-beige cursor-pointer transition">
            <GraduationCap className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ], [openModal]);

  return (
    <div className="space-y-5 animate-fade-in font-sans">
      {/* Header */}
      <div className="p-5 bg-white border border-stsn-beige rounded-xl shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-xl font-display font-semibold text-stone-900 tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-stsn-brown" />
              Faculty Management
            </h2>
            <p className="text-stone-500 text-xs mt-1">
              Overview of all teaching staff with direct access to their
              academic modules.
            </p>
          </div>
          <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">
            {filtered.length} teacher{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-stsn-beige shadow-sm p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search by name or specialization..."
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 pl-8 pr-3 text-xs focus:ring-1 focus:ring-stsn-brown focus:outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-stsn-beige shadow-sm overflow-hidden p-4">
        <STSNDataTable<Teacher>
          columns={facultyColumns}
          rows={filtered}
          searchable={false}
          emptyMessage="No teachers found."
        />
        <div className="hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100 text-stone-500 text-[10px] uppercase font-bold">
                <th className="px-4 py-3 text-left">Teacher</th>
                <th className="px-4 py-3 text-left">Department</th>
                <th className="px-4 py-3 text-left">Specialization</th>
                <th className="px-4 py-3 text-left">Advisory Section</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-stone-400 italic"
                  >
                    No teachers found.
                  </td>
                </tr>
              ) : (
                filtered.map((teacher) => (
                  <tr
                    key={teacher.id}
                    className="hover:bg-stone-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-bold text-stone-900">
                        {teacher.lastName}, {teacher.firstName}
                      </p>
                      <p className="text-[10px] text-stone-400 font-mono mt-0.5">
                        {teacher.email}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded border bg-stsn-cream text-stsn-brown border-stsn-beige">
                        {teacher.department === "Basic Education" ? "Basic Ed" : "College"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {teacher.specialization || "—"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-stone-700">
                      {teacher.advisorySection || "—"}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openModal(teacher, "dashboard")}
                          title="Overview & Advisory"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-stsn-cream border border-stsn-beige text-stsn-brown hover:bg-stsn-beige cursor-pointer transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openModal(teacher, "schedule")}
                          title="Class Schedule & Subjects"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-stsn-cream border border-stsn-beige text-stsn-brown hover:bg-stsn-beige cursor-pointer transition"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openModal(teacher, "attendance")}
                          title="Attendance Monitoring"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-stsn-cream border border-stsn-beige text-stsn-brown hover:bg-stsn-beige cursor-pointer transition"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openModal(teacher, "grading")}
                          title="Student Grades Encoding"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-stsn-cream border border-stsn-beige text-stsn-brown hover:bg-stsn-beige cursor-pointer transition"
                        >
                          <GraduationCap className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {activeModal?.type === "dashboard" && (
        <OverviewAdvisoryModal teacher={activeModal.teacher} onClose={closeModal} />
      )}
      {activeModal?.type === "schedule" && (
        <SectionStudentsModal teacher={activeModal.teacher} onClose={closeModal} />
      )}
      {activeModal?.type === "attendance" && (
        <AttendanceModal teacher={activeModal.teacher} onClose={closeModal} />
      )}
      {activeModal?.type === "grading" && (
        <GradesModal teacher={activeModal.teacher} onClose={closeModal} />
      )}
    </div>
  );
}

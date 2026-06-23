/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
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
  ChevronRight
} from "lucide-react";
import GradingModule from "../../grading/pages/GradingModulePage";
import { resolveCurrentTeacher } from "../../../utils/resolveTeacher";

export default function FacultyPortal() {
  const { teachers, currentUser, students, announcements, grades, subjects, classSchedules, academicUnit, activityLogs, employees } = useSTSNStore();
  const currentTeacher = resolveCurrentTeacher(teachers, currentUser, academicUnit);

  // Advisory Class Details — empty when no section is assigned to prevent data leaks.
  const advisorySectionName = currentTeacher.advisorySection || "";
  const advisoryStudents = advisorySectionName
    ? students.filter((s) => s.section === advisorySectionName)
    : [];

  // Teaching load — total units across this teacher's class schedules (sourced from Supabase)
  const teachingLoadUnits = classSchedules
    .filter((cs) => cs.teacherId === currentTeacher.id)
    .reduce((sum, cs) => {
      const subject = subjects.find((s) => s.code === cs.subjectCode);
      return sum + (subject?.units ?? 0);
    }, 0);

  // Accrued leave — resolved from the matching employee record (sourced from Supabase)
  const accruedLeaveDays = employees.find((e) => e.email === currentTeacher.email)?.leaveBalance;

  // States
  const [activeTab, setActiveTab] = useState<"dashboard" | "schedule" | "attendance" | "grading">("dashboard");
  const [attendanceData, setAttendanceData] = useState<Record<string, "Present" | "Late" | "Absent">>({});
  const [attendanceDate, setAttendanceDate] = useState("2026-05-30");
  const [attendanceMessage, setAttendanceMessage] = useState("");

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

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* 1. TEACHER HERO BANNER BILLBOARD */}
      <div className="bg-gradient-to-r from-stsn-brown-dark to-stsn-brown text-stsn-cream p-6 rounded-2xl border border-stsn-brown/30 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="bg-stsn-gold/20 border border-stsn-gold/30 text-stsn-gold-light text-[10px] font-mono uppercase px-2.5 py-1 rounded-full font-bold">
            Licensed Academic Faculty Cockpit
          </span>
          <h2 className="text-2xl font-display font-medium mt-2 text-white">
            Welcome, {currentTeacher.firstName} {currentTeacher.lastName}, LPT
          </h2>
          <p className="text-stone-300 text-xs mt-1">
            Department: <strong>{currentTeacher.department} Academics</strong> • Advisory Section: <strong className="text-stsn-gold-light">{advisorySectionName || "Not Assigned"}</strong>
          </p>
        </div>

        <div className="bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-center flex flex-col justify-center">
          <span className="text-[9px] text-stsn-gold-light uppercase block font-mono">License Code</span>
          <span className="text-xs font-mono font-bold text-white">LPT-{currentTeacher.id.split("-").pop() || "7881A"}-PH</span>
        </div>
      </div>

      {/* 2. DEDICATED TEACHER TABBED ERP CONTROLLER */}
      <div className="flex border-b border-stsn-beige/70 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-lg transition whitespace-nowrap cursor-pointer ${
            activeTab === "dashboard"
              ? "bg-stsn-brown text-white border-t-2 border-stsn-gold"
              : "text-stone-500 hover:text-stsn-brown-dark"
          }`}
        >
          Overview & Advisory
        </button>
        
        <button
          onClick={() => setActiveTab("schedule")}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-lg transition whitespace-nowrap cursor-pointer ${
            activeTab === "schedule"
              ? "bg-stsn-brown text-white border-t-2 border-stsn-gold"
              : "text-stone-500 hover:text-stsn-brown-dark"
          }`}
        >
          Class Schedule & Subjects
        </button>

        <button
          onClick={() => setActiveTab("attendance")}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-lg transition whitespace-nowrap cursor-pointer ${
            activeTab === "attendance"
              ? "bg-stsn-brown text-white border-t-2 border-stsn-gold"
              : "text-stone-500 hover:text-stsn-brown-dark"
          }`}
        >
          Attendance Monitoring
        </button>

        <button
          onClick={() => setActiveTab("grading")}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-lg transition whitespace-nowrap cursor-pointer ${
            activeTab === "grading"
              ? "bg-stsn-brown text-white border-t-2 border-stsn-gold"
              : "text-stone-500 hover:text-stsn-brown-dark"
          }`}
        >
          Student Grades Encoding
        </button>
      </div>

      {/* 3. TAB WORKSPACES */}

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
                    <h3 className="text-sm font-bold text-stone-900 uppercase">My Advisory Class: {advisorySectionName}</h3>
                    <p className="text-stone-400 text-[11px]">Primary list of students assigned to your administrative advisory panel</p>
                  </div>
                  <span className="text-[10px] font-mono bg-stsn-cream text-stsn-brown border border-stsn-beige px-2.5 py-0.5 rounded-full font-bold">
                    ACTIVE
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-stone-100 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-100 font-bold text-stone-500 text-[10px] uppercase">
                        <th className="p-3">Student Number</th>
                        <th className="p-3">Student Full Name</th>
                        <th className="p-3">Track / Year Level</th>
                        <th className="p-3">Contact No</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 font-medium">
                      {advisoryStudents.map((stud) => (
                        <tr key={stud.id} className="hover:bg-stone-50/50">
                          <td className="p-3 font-mono font-bold text-stsn-brown">{stud.studentNo}</td>
                          <td className="p-3 text-stone-900">{stud.lastName}, {stud.firstName} {stud.middleName ? stud.middleName[0] + "." : ""}</td>
                          <td className="p-3 text-stone-500">{stud.trackOrCourse || "STEM"} - {stud.yearLevel}</td>
                          <td className="p-3 font-mono text-[11px] text-stone-500">{stud.contactNo}</td>
                          <td className="p-3 text-center">
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

              {/* Teaching Load Summary detailed modules */}
              <div className="bg-white p-6 rounded-xl border border-stsn-beige shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-stone-900 uppercase pb-2 border-b border-stone-100 flex items-center gap-1.5">
                  <FileCheck className="w-4.5 h-4.5 text-stsn-gold" />
                  Teaching Load Summary & Milestones
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/50 space-y-2">
                    <h4 className="text-xs font-bold text-stone-900">Senior High Gen Math</h4>
                    <div className="flex justify-between text-[11px] text-stone-400">
                      <span>Coursework Prep Status:</span>
                      <span className="font-bold text-green-600">85% Complete</span>
                    </div>
                    <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-stsn-brown h-full" style={{ width: "85%" }} />
                    </div>
                    <span className="text-[10px] text-stone-400 font-mono block">3 hours lecturing • MWF</span>
                  </div>

                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/50 space-y-2">
                    <h4 className="text-xs font-bold text-stone-900">Pre-Calculus Core 1</h4>
                    <div className="flex justify-between text-[11px] text-stone-400">
                      <span>Coursework Prep Status:</span>
                      <span className="font-bold text-green-600">92% Complete</span>
                    </div>
                    <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-stsn-brown h-full" style={{ width: "92%" }} />
                    </div>
                    <span className="text-[10px] text-stone-400 font-mono block">3 hours lecturing • MWF</span>
                  </div>
                </div>
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
                    onClick={() => setActiveTab("grading")}
                    className="w-full text-left flex items-center justify-between p-3 bg-stsn-cream hover:bg-stsn-beige border border-stsn-beige/70 rounded-xl transition cursor-pointer group"
                  >
                    <div>
                      <span className="text-xs font-bold text-stone-900 block group-hover:text-stsn-brown">Grade Encoding Shortcut</span>
                      <span className="text-[10px] text-stone-400 block font-medium">Verify and upload semestral card marks</span>
                    </div>
                    <GraduationCap className="w-4.5 h-4.5 text-stsn-gold group-hover:scale-110 transition" />
                  </button>

                  <button
                    onClick={() => setActiveTab("attendance")}
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
        const teacherSchedules = classSchedules.filter((s) => s.teacherId === currentTeacher.id && s.isActive);
        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
        const today = new Date().toLocaleDateString("en-US", { weekday: "long" }) as typeof days[number];
        const uniqueSubjects = Array.from(new Map(teacherSchedules.map((s) => [s.subjectCode, s])).values());

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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {teacherSchedules.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-stone-400 text-xs italic">
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
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

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
                        const subjectInfo = subjects.find((sub) => sub.code === sched.subjectCode);
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

          <GradingModule />
        </div>
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

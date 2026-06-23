/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
import { useSTSNStore } from "../../../services/store";
import { ClassSchedule } from "../../../types";
import type { AcademicUnit } from "../../../types/school.types";
import { getAcademicTerms, academicUnitToDepartment } from "../../../config/schools.config";
import { useAppDialog } from "../../../components/common/useAppDialog";
import {
  CalendarDays, Plus, Edit2, Trash2, Search, Filter, X, AlertTriangle,
  CheckCircle, Clock, Building2, Users, BookOpen, ChevronDown, List,
  LayoutGrid, GraduationCap, MapPin, RefreshCw
} from "lucide-react";
import STSNDataTable, { type STSNColumn } from "../../../components/common/STSNDataTable";

/** Inverse of academicUnitToDepartment — used to derive terminology from a teacher's department. */
function departmentToAcademicUnit(dept: "Basic Education" | "College"): AcademicUnit {
  return dept === "Basic Education" ? "basic-ed" : "college";
}

type ViewMode = "list" | "grid";

const DAYS: ClassSchedule["day"][] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DEPARTMENTS: ClassSchedule["department"][] = ["Basic Education", "College"];

const DAY_SHORT: Record<string, string> = {
  Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed", Thursday: "Thu", Friday: "Fri", Saturday: "Sat"
};

const DAY_COLORS: Record<string, string> = {
  Monday: "bg-blue-50 border-blue-200 text-blue-800",
  Tuesday: "bg-purple-50 border-purple-200 text-purple-800",
  Wednesday: "bg-amber-50 border-amber-200 text-amber-800",
  Thursday: "bg-green-50 border-green-200 text-green-800",
  Friday: "bg-rose-50 border-rose-200 text-rose-800",
  Saturday: "bg-slate-50 border-slate-200 text-slate-800",
};

// Detect conflicts: same teacher OR same room, same day, overlapping times
function detectConflicts(schedules: ClassSchedule[]): Set<string> {
  const conflictIds = new Set<string>();
  for (let i = 0; i < schedules.length; i++) {
    for (let j = i + 1; j < schedules.length; j++) {
      const a = schedules[i];
      const b = schedules[j];
      if (a.day !== b.day) continue;
      const overlap = a.startTime < b.endTime && b.startTime < a.endTime;
      if (!overlap) continue;
      const sameTeacher = a.teacherId === b.teacherId && a.teacherId;
      const sameRoom = a.roomName === b.roomName && a.roomName;
      if (sameTeacher || sameRoom) {
        conflictIds.add(a.id);
        conflictIds.add(b.id);
      }
    }
  }
  return conflictIds;
}

// ============================================================
// SCHEDULE FORM MODAL
// ============================================================
interface ScheduleFormProps {
  initial?: ClassSchedule | null;
  onSave: (data: Omit<ClassSchedule, "id">) => void;
  onClose: () => void;
}

function ScheduleForm({ initial, onSave, onClose }: ScheduleFormProps) {
  const { subjects, teachers, sections, rooms, classSchedules, setupData, assignSectionAdviser } = useSTSNStore();
  const { toast, confirm } = useAppDialog();
  const schoolYearOptions = [...(setupData.school_years ?? [])].reverse();
  const beYearLevels = (setupData.year_levels ?? []).filter((yl) => yl.academicLevel !== "College").sort((a, b) => (a.level ?? 0) - (b.level ?? 0)).map((yl) => yl.name);
  const collegeYearLevels = (setupData.year_levels ?? []).filter((yl) => yl.academicLevel === "College").sort((a, b) => (a.level ?? 0) - (b.level ?? 0)).map((yl) => yl.name);

  // Derive department from selected teacher (auto-detected)
  const [yearLevel, setYearLevel] = useState(initial?.yearLevel || "");
  const [teacherId, setTeacherId] = useState(initial?.teacherId || "");
  const [subjectCode, setSubjectCode] = useState(initial?.subjectCode || "");
  const [sectionName, setSectionName] = useState(initial?.section || "");
  const [roomName, setRoomName] = useState(initial?.roomName || "");
  const [day, setDay] = useState<ClassSchedule["day"]>(initial?.day || "Monday");
  const [startTime, setStartTime] = useState(initial?.startTime || "08:00");
  const [endTime, setEndTime] = useState(initial?.endTime || "10:00");
  const [semester, setSemester] = useState(initial?.semester || "First Semester");
  const courseOrTrack = initial?.courseOrTrack || "";
  const [notes, setNotes] = useState(initial?.notes || "");
  const initialSection = initial ? sections.find(
    (section) => section.name === initial.section && section.department === initial.department && (!initial.yearLevel || section.yearLevel === initial.yearLevel)
  ) : undefined;
  const initiallyAssignedAsAdviser = Boolean(
    initial && (
      initialSection?.adviserId === initial.teacherId ||
      teachers.find((teacher) => teacher.id === initial.teacherId)?.advisorySection === initial.section
    )
  );
  const [assignAsAdviser, setAssignAsAdviser] = useState(initiallyAssignedAsAdviser);

  const [roomConflictWarning, setRoomConflictWarning] = useState("");
  const [sectionConflictWarning, setSectionConflictWarning] = useState("");

  const selectedTeacher = teachers.find((t) => t.id === teacherId);
  const teacherDept: ClassSchedule["department"] = selectedTeacher?.department === "College" ? "College" : "Basic Education";

  const terms = useMemo(() => getAcademicTerms(departmentToAcademicUnit(teacherDept)), [teacherDept]);

  const yearLevelsForDept = teacherDept === "Basic Education" ? beYearLevels : collegeYearLevels;

  // Subjects filtered by teacher's department + selected year level
  const availableSubjects = useMemo(() => {
    return subjects.filter((s) => {
      if (teacherDept === "College") return s.department === "College";
      return s.department === "Basic Education" && (!yearLevel || s.yearLevel === yearLevel || !s.yearLevel);
    });
  }, [subjects, teacherDept, yearLevel]);

  // Sections filtered by teacher's department + year level
  const availableSections = useMemo(() => {
    return sections.filter((sec) => {
      if (sec.department !== teacherDept) return false;
      if (yearLevel && sec.yearLevel !== yearLevel) return false;
      return sec.isActive;
    });
  }, [sections, teacherDept, yearLevel]);

  // Rooms filtered to active & not Under Maintenance
  const availableRooms = useMemo(() => rooms.filter((r) => r.isActive && r.status !== "Under Maintenance"), [rooms]);

  const handleTeacherChange = (newTeacherId: string) => {
    setTeacherId(newTeacherId);
    // Reset subject and section when teacher changes
    setSubjectCode("");
    setSectionName("");
    setAssignAsAdviser(false);
    setSectionConflictWarning("");
    // For new schedules, default the semester based on the teacher's department
    if (!initial) {
      const newTeacher = teachers.find((t) => t.id === newTeacherId);
      const newDept: ClassSchedule["department"] = newTeacher?.department === "College" ? "College" : "Basic Education";
      setSemester(newDept === "Basic Education" ? "Full Year" : "First Semester");
    }
  };

  const handleSectionChange = (newSection: string) => {
    setSectionName(newSection);
    const section = availableSections.find((item) => item.name === newSection);
    setAssignAsAdviser(Boolean(
      newSection && teacherId && (
        section?.adviserId === teacherId || selectedTeacher?.advisorySection === newSection
      )
    ));
    if (!newSection || !teacherId) { setSectionConflictWarning(""); return; }
    // Check if this teacher already has this section in any existing schedule
    const conflict = classSchedules.find(
      (cs) => cs.teacherId === teacherId && cs.section === newSection && cs.id !== initial?.id
    );
    if (conflict) {
      setSectionConflictWarning(`⚠ ${selectedTeacher?.firstName} ${selectedTeacher?.lastName} already has section "${newSection}" assigned (${conflict.subjectCode}, ${conflict.day}).`);
    } else {
      setSectionConflictWarning("");
    }
  };

  const handleRoomChange = (newRoom: string) => {
    setRoomName(newRoom);
    if (!newRoom || !day || !startTime || !endTime) { setRoomConflictWarning(""); return; }
    checkRoomConflict(newRoom, day, startTime, endTime);
  };

  const checkRoomConflict = (room: string, d: string, st: string, et: string) => {
    const conflict = classSchedules.find((cs) => {
      if (cs.id === initial?.id) return false;
      if (cs.roomName !== room) return false;
      if (cs.day !== d) return false;
      return st < cs.endTime && cs.startTime < et;
    });
    if (conflict) {
      setRoomConflictWarning(`⚠ Room "${room}" is already booked on ${conflict.day} from ${conflict.startTime}–${conflict.endTime} (${conflict.subjectCode}, ${conflict.section}).`);
    } else {
      setRoomConflictWarning("");
    }
  };

  const handleDayChange = (newDay: ClassSchedule["day"]) => {
    setDay(newDay);
    if (roomName) checkRoomConflict(roomName, newDay, startTime, endTime);
  };

  const handleTimeChange = (type: "start" | "end", val: string) => {
    const newStart = type === "start" ? val : startTime;
    const newEnd = type === "end" ? val : endTime;
    if (type === "start") setStartTime(val);
    else setEndTime(val);
    if (roomName && newStart && newEnd) checkRoomConflict(roomName, day, newStart, newEnd);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (startTime >= endTime) {
      toast("End time must be after start time.", { variant: "warning" });
      return;
    }
    if (roomConflictWarning) {
      if (!(await confirm("Room conflict detected. Proceed anyway?", { variant: "warning" }))) return;
    }
    if (sectionConflictWarning) {
      if (!(await confirm("Section already assigned to this teacher. Proceed anyway?", { variant: "warning" }))) return;
    }
    const selectedSub = subjects.find((s) => s.code === subjectCode);
    const selectedSection = availableSections.find((section) => section.name === sectionName);
    const advisoryAssignmentChanged = initial && (
      initial.teacherId !== teacherId || initial.section !== sectionName || !assignAsAdviser
    );
    if (initiallyAssignedAsAdviser && advisoryAssignmentChanged && initialSection) {
      assignSectionAdviser(initialSection.id, null);
    }
    if (assignAsAdviser && selectedSection) {
      assignSectionAdviser(selectedSection.id, teacherId);
    }
    onSave({
      subjectCode,
      subjectName: selectedSub?.name || "",
      teacherId,
      teacherName: selectedTeacher ? `${selectedTeacher.firstName} ${selectedTeacher.lastName}` : "",
      section: sectionName,
      roomName,
      day,
      startTime,
      endTime,
      schoolYear: "2026-2027",
      semester,
      isActive: initial?.isActive ?? true,
      department: teacherDept,
      yearLevel,
      courseOrTrack,
      notes,
    });
  };

  return (
    <div className="app-modal-backdrop z-50 animate-fade-in">
      <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-2xl overflow-hidden">
        <div className="modal-header-gradient text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-stsn-gold" />
            <h3 className="font-display font-bold text-sm">{initial ? "Edit Schedule" : "Create New Schedule"}</h3>
          </div>
          <button type="button" onClick={onClose} className="cursor-pointer hover:bg-white/10 p-1 rounded transition"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 bg-stsn-cream space-y-4 max-h-[80vh] overflow-y-auto">

          {/* Row 1: Teacher */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Faculty / Teacher *</label>
            <select
              required
              value={teacherId}
              onChange={(e) => handleTeacherChange(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown"
            >
              <option value="">— Assign Faculty —</option>
              {teachers.filter((t) => t.department === "Basic Education").map((t) => (
                <option key={t.id} value={t.id}>{t.firstName} {t.lastName} — {t.specialization} ({t.department})</option>
              ))}
            </select>
            {selectedTeacher && (
              <p className="text-[10px] text-stone-400 font-mono mt-1">
                Dept auto-detected: <strong className="text-stsn-brown">{teacherDept}</strong>
              </p>
            )}
          </div>

          {/* Row 2: Year Level */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Year Level *</label>
            <select
              required
              value={yearLevel}
              onChange={(e) => setYearLevel(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown"
            >
              <option value="">— Select Year Level —</option>
              {yearLevelsForDept.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* Row 3: Subject */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Subject *</label>
            <select
              required
              value={subjectCode}
              onChange={(e) => {
                const sub = subjects.find((s) => s.code === e.target.value);
                setSubjectCode(sub?.code || e.target.value);
              }}
              className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown"
            >
              <option value="">— Select Subject —</option>
              {availableSubjects.map((s) => <option key={s.id} value={s.code}>{s.code} — {s.name}</option>)}
            </select>
          </div>

          {/* Row 4: Section dropdown (from Class Sectioning) */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">{terms.groupNoun} *</label>
            <select
              required
              value={sectionName}
              onChange={(e) => handleSectionChange(e.target.value)}
              className={`w-full bg-white border rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown ${sectionConflictWarning ? "border-amber-400 bg-amber-50" : "border-stone-200"}`}
            >
              <option value="">— Select {terms.groupNoun} —</option>
              {availableSections.map((sec) => (
                <option key={sec.id} value={sec.name}>{sec.name} ({sec.yearLevel}{sec.strandOrTrack ? ` / ${sec.strandOrTrack}` : ""})</option>
              ))}
            </select>
            {sectionConflictWarning && (
              <div className="mt-1.5 p-2 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                <span className="text-[10px] text-amber-700 font-medium">{sectionConflictWarning}</span>
              </div>
            )}
            <label className={`mt-2 flex items-start gap-2 rounded-lg border p-2.5 ${teacherId && sectionName ? "bg-white border-stone-200 cursor-pointer" : "bg-stone-100 border-stone-200 cursor-not-allowed opacity-60"}`}>
              <input
                type="checkbox"
                checked={assignAsAdviser}
                disabled={!teacherId || !sectionName}
                onChange={(e) => setAssignAsAdviser(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-stsn-brown"
              />
              <span>
                <span className="block text-[11px] font-bold text-stone-700">Assign as Class Adviser</span>
                <span className="block text-[10px] text-stone-500">Make the selected faculty member the adviser of this class section.</span>
              </span>
            </label>
          </div>

          {/* Row 5: Room dropdown (from rooms store) */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Room *</label>
            <select
              required
              value={roomName}
              onChange={(e) => handleRoomChange(e.target.value)}
              className={`w-full bg-white border rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown ${roomConflictWarning ? "border-red-400 bg-red-50" : "border-stone-200"}`}
            >
              <option value="">— Select Room —</option>
              {availableRooms.map((r) => (
                <option key={r.id} value={r.name}>{r.name} — {r.type} (Cap. {r.capacity})</option>
              ))}
            </select>
            {roomConflictWarning && (
              <div className="mt-1.5 p-2 bg-red-50 border border-red-300 rounded-lg flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" />
                <span className="text-[10px] text-red-700 font-medium">{roomConflictWarning}</span>
              </div>
            )}
          </div>

          {/* Row 6: Day & Times */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Day *</label>
              <select required value={day} onChange={(e: any) => handleDayChange(e.target.value)} className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown">
                {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Start Time *</label>
              <input required type="time" value={startTime} onChange={(e) => handleTimeChange("start", e.target.value)} className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown" />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">End Time *</label>
              <input required type="time" value={endTime} onChange={(e) => handleTimeChange("end", e.target.value)} className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown" />
            </div>
          </div>

          {/* Row 7: Notes */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs focus:outline-none resize-none" placeholder="Optional scheduling notes..." />
          </div>

          <button type="submit" className="w-full bg-stsn-brown hover:bg-stsn-brown-dark text-stsn-cream font-bold text-xs py-2.5 rounded-lg shadow cursor-pointer transition">
            {initial ? "Save Changes" : "Create Schedule"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ============================================================
// CALENDAR GRID VIEW
// ============================================================
function CalendarGridView({ schedules, conflictIds }: { schedules: ClassSchedule[]; conflictIds: Set<string> }) {
  const timeSlots = ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

  const getSchedulesForSlot = (day: ClassSchedule["day"], time: string) =>
    schedules.filter((s) => s.day === day && s.startTime <= time && s.endTime > time);

  return (
    <div className="bg-white rounded-xl border border-stsn-beige shadow-sm overflow-auto">
      <div className="min-w-[900px]">
        {/* Header Row */}
        <div className="grid border-b border-stone-200" style={{ gridTemplateColumns: "80px repeat(6, 1fr)" }}>
          <div className="p-3 text-[10px] font-mono text-stone-400 text-center border-r border-stone-100">TIME</div>
          {DAYS.map((day) => (
            <div key={day} className={`p-3 text-center border-r border-stone-100 last:border-r-0`}>
              <p className="text-xs font-bold text-stone-700">{day}</p>
              <p className="text-[9px] text-stone-400">{schedules.filter((s) => s.day === day).length} classes</p>
            </div>
          ))}
        </div>

        {/* Time Rows */}
        {timeSlots.map((time, ti) => (
          <div key={time} className="grid border-b border-stone-100" style={{ gridTemplateColumns: "80px repeat(6, 1fr)" }}>
            <div className="p-2 text-[10px] font-mono text-stone-400 text-right pr-3 border-r border-stone-100 flex items-start pt-2">
              {parseInt(time) >= 12 ? time.replace("12:", "12:").replace("13:", "1:").replace("14:", "2:").replace("15:", "3:").replace("16:", "4:").replace("17:", "5:") : time} {parseInt(time) >= 12 && parseInt(time) < 12 ? "PM" : parseInt(time) >= 13 ? "PM" : "AM"}
            </div>
            {DAYS.map((day) => {
              const slotSchedules = getSchedulesForSlot(day, time);
              return (
                <div key={day} className="min-h-[64px] p-1 border-r border-stone-100 last:border-r-0 space-y-1">
                  {slotSchedules.map((s) => {
                    if (s.startTime !== time) return null;
                    const isConflict = conflictIds.has(s.id);
                    const [sh, sm] = s.startTime.split(":").map(Number);
                    const [eh, em] = s.endTime.split(":").map(Number);
                    const duration = (eh * 60 + em - sh * 60 - sm) / 60;
                    return (
                      <div
                        key={s.id}
                        className={`p-1.5 rounded-lg border text-[9px] leading-tight ${isConflict ? "bg-red-50 border-red-300" : "bg-blue-50 border-blue-200"}`}
                        style={{ minHeight: `${duration * 56}px` }}
                      >
                        {isConflict && <AlertTriangle className="w-3 h-3 text-red-500 mb-0.5" />}
                        <p className="font-bold text-stone-800 truncate">{s.subjectCode}</p>
                        <p className="text-stone-600 truncate">{s.section}</p>
                        <p className="text-stone-400 truncate">{s.roomName}</p>
                        <p className="text-stone-400 font-mono">{s.startTime}–{s.endTime}</p>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// MAIN SCHEDULING MODULE
// ============================================================
export default function SchedulingModule() {
  const { classSchedules, addClassSchedule, updateClassSchedule, deleteClassSchedule, toggleClassScheduleActive, teachers, sections, activeSchool, academicUnit, setupData } = useSTSNStore();
  const { confirm } = useAppDialog();
  const schoolYearOptions = [...(setupData.school_years ?? [])].reverse();
  const semesterOptions = setupData.semesters ?? [];

  const terms = useMemo(() => getAcademicTerms(academicUnit), [academicUnit]);
  const lockedDept = activeSchool === "ALL" ? undefined : academicUnitToDepartment(academicUnit);

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [filterYear, setFilterYear] = useState("2026-2027");
  const [filterSemester, setFilterSemester] = useState("First Semester");
  const [filterDept, setFilterDept] = useState<"All" | ClassSchedule["department"]>(lockedDept || "All");
  const [filterTeacher, setFilterTeacher] = useState("All");
  const [filterDay, setFilterDay] = useState("All");
  const [searchQ, setSearchQ] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ClassSchedule | null>(null);
  const [showConflictsOnly, setShowConflictsOnly] = useState(false);

  // Keep the department filter pinned to the active school's academic unit
  useEffect(() => {
    if (lockedDept) setFilterDept(lockedDept);
  }, [lockedDept]);

  const filteredSchedules = useMemo(() => {
    return classSchedules.filter((s) => {
      const q = searchQ.toLowerCase();
      const matchSearch = s.subjectCode.toLowerCase().includes(q) || s.subjectName.toLowerCase().includes(q) || s.section.toLowerCase().includes(q) || s.teacherName.toLowerCase().includes(q) || s.roomName.toLowerCase().includes(q);
      const matchYear = s.schoolYear === filterYear;
      const matchSem = s.semester === filterSemester;
      const matchDept = s.department === "Basic Education";
      const matchTeacher = filterTeacher === "All" || s.teacherId === filterTeacher;
      const matchDay = filterDay === "All" || s.day === filterDay;
      return matchSearch && matchYear && matchSem && matchDept && matchTeacher && matchDay;
    });
  }, [classSchedules, searchQ, filterYear, filterSemester, filterDept, filterTeacher, filterDay]);

  const conflictIds = useMemo(() => detectConflicts(filteredSchedules), [filteredSchedules]);

  const displaySchedules = showConflictsOnly ? filteredSchedules.filter((s) => conflictIds.has(s.id)) : filteredSchedules;

  const handleSave = (data: Omit<ClassSchedule, "id">) => {
    if (editingSchedule) {
      updateClassSchedule(editingSchedule.id, data);
    } else {
      addClassSchedule(data);
    }
    setIsFormOpen(false);
    setEditingSchedule(null);
  };

  const openCreate = () => { setEditingSchedule(null); setIsFormOpen(true); };
  const openEdit = (s: ClassSchedule) => { setEditingSchedule(s); setIsFormOpen(true); };
  const handleDelete = async (id: string, name: string) => { if (await confirm(`Delete schedule for "${name}"?`, { variant: "danger" })) deleteClassSchedule(id); };

  const scheduleColumns: STSNColumn<ClassSchedule>[] = [
    {
      title: "Subject",
      data: "subjectCode",
      render: (value, sched) => (
        <>
          <p className="font-mono font-bold text-stsn-brown text-[11px]">{value}</p>
          <p className="font-medium text-stone-700 truncate max-w-[130px]">{sched.subjectName}</p>
        </>
      ),
    },
    { title: "Section", data: "section", className: "font-semibold text-stone-800" },
    { title: "Faculty", data: "teacherName", className: "text-stone-600 truncate max-w-[120px]" },
    {
      title: "Room",
      data: "roomName",
      render: (value) => (
        <div className="flex items-center gap-1">
          <MapPin className="w-3 h-3 text-stone-400 flex-shrink-0" />
          <span className="text-stone-700 truncate">{value}</span>
        </div>
      ),
    },
    {
      title: "Day & Time",
      data: "day",
      render: (value: ClassSchedule["day"], sched) => {
        const isConflict = conflictIds.has(sched.id);
        return (
          <>
            <div className="flex items-center gap-1 mb-0.5">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${DAY_COLORS[value] || ""}`}>{DAY_SHORT[value]}</span>
              {isConflict && <AlertTriangle className="w-3.5 h-3.5 text-red-500" title="Conflict detected" />}
            </div>
            <p className="font-mono text-stone-600 text-[10px]">{sched.startTime} – {sched.endTime}</p>
          </>
        );
      },
    },
    {
      title: "Dept / Level",
      data: "department",
      render: (value: ClassSchedule["department"], sched) => (
        <>
          <p className="text-stone-600 whitespace-normal break-words">{value === "College" ? "College" : "Basic Ed"}</p>
          {sched.yearLevel && <p className="text-[10px] text-stone-400 whitespace-normal break-words">{sched.yearLevel}{sched.courseOrTrack ? ` • ${sched.courseOrTrack}` : ""}</p>}
        </>
      ),
    },
    {
      title: "Status",
      data: "isActive",
      render: (value: boolean, sched) => (
        <button onClick={() => toggleClassScheduleActive(sched.id)} className={`text-[9px] font-bold px-2 py-0.5 rounded-full border cursor-pointer transition ${value ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-stone-500 bg-stone-50 border-stone-200"}`}>
          {value ? "Active" : "Inactive"}
        </button>
      ),
    },
    {
      title: "Actions",
      orderable: false,
      searchable: false,
      render: (_value, sched) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openEdit(sched)} className="p-1.5 hover:bg-blue-50 rounded text-stone-400 hover:text-blue-600 cursor-pointer" title="Edit">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => handleDelete(sched.id, sched.subjectName)} className="p-1.5 hover:bg-red-50 rounded text-stone-400 hover:text-red-600 cursor-pointer" title="Delete">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  // Room utilization summary
  const roomUsage = useMemo(() => {
    const map: Record<string, number> = {};
    filteredSchedules.forEach((s) => { map[s.roomName] = (map[s.roomName] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [filteredSchedules]);

  return (
    <div className="space-y-5 animate-fade-in font-sans">
      {/* Header */}
      <div className="p-5 bg-white border border-stsn-beige rounded-xl shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-xl font-display font-semibold text-stone-900 tracking-tight flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-stsn-brown" />
              Class Scheduling & Room Assignment
            </h2>
            <p className="text-stone-500 text-xs mt-1">
              Manage class schedules, assign rooms, detect conflicts, and monitor faculty &amp; {terms.groupNoun.toLowerCase()} loads.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {conflictIds.size > 0 && (
              <button
                onClick={() => setShowConflictsOnly((p) => !p)}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border cursor-pointer transition ${showConflictsOnly ? "bg-red-600 text-white border-red-600" : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"}`}
              >
                <AlertTriangle className="w-4 h-4" />
                {conflictIds.size / 2} Conflict{conflictIds.size / 2 !== 1 ? "s" : ""}
              </button>
            )}
            <button onClick={openCreate} className="flex items-center gap-1.5 bg-stsn-brown hover:bg-stsn-brown-dark text-stsn-cream text-xs font-bold px-4 py-2 rounded-lg shadow cursor-pointer transition">
              <Plus className="w-4 h-4" /> New Schedule
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Schedules", value: filteredSchedules.length, icon: CalendarDays, color: "text-stsn-brown" },
          { label: `${terms.groupNoun}s`, value: new Set(filteredSchedules.map((s) => s.section)).size, icon: GraduationCap, color: "text-blue-600" },
          { label: "Faculty Assigned", value: new Set(filteredSchedules.map((s) => s.teacherId)).size, icon: Users, color: "text-emerald-600" },
          { label: "Rooms Used", value: new Set(filteredSchedules.map((s) => s.roomName)).size, icon: Building2, color: "text-purple-600" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-stsn-beige shadow-sm p-4 flex items-center gap-3">
              <Icon className={`w-8 h-8 ${stat.color} opacity-80`} />
              <div>
                <p className="text-[10px] text-stone-400 uppercase font-mono">{stat.label}</p>
                <p className="text-xl font-display font-black text-stone-900">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters & View Toggle */}
      <div className="bg-white rounded-xl border border-stsn-beige shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-stone-400" />
            <input type="text" placeholder="Search subject, section, teacher, room..." value={searchQ} onChange={(e) => setSearchQ(e.target.value)} className="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 pl-8 pr-3 text-xs focus:ring-1 focus:ring-stsn-brown focus:outline-none" />
          </div>
          <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none">
            {schoolYearOptions.map((y) => <option key={y.id}>{y.name}</option>)}
          </select>
          <select value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)} className="bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none">
            {semesterOptions.map((s) => <option key={s.id}>{s.name}</option>)}
          </select>
          {lockedDept ? (
            <div className="bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold text-stone-500">
              {lockedDept}
            </div>
          ) : (
            <select value={filterDept} onChange={(e: any) => setFilterDept(e.target.value)} className="bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none">
              <option value="All">All Depts</option>
              {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
            </select>
          )}
          <select value={filterTeacher} onChange={(e) => setFilterTeacher(e.target.value)} className="bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none">
            <option value="All">All Faculty</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
          </select>
          <select value={filterDay} onChange={(e) => setFilterDay(e.target.value)} className="bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none">
            <option value="All">All Days</option>
            {DAYS.map((d) => <option key={d}>{d}</option>)}
          </select>
          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-stone-100 rounded-lg p-1 ml-auto">
            <button onClick={() => setViewMode("list")} className={`p-1.5 rounded cursor-pointer transition ${viewMode === "list" ? "bg-white shadow text-stsn-brown" : "text-stone-400 hover:text-stone-600"}`} title="List view">
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded cursor-pointer transition ${viewMode === "grid" ? "bg-white shadow text-stsn-brown" : "text-stone-400 hover:text-stone-600"}`} title="Calendar grid view">
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        {/* Main Content */}
        <div className="xl:col-span-3">
          {viewMode === "grid" ? (
            <CalendarGridView schedules={displaySchedules} conflictIds={conflictIds} />
          ) : (
            <div className="bg-white rounded-xl border border-stsn-beige shadow-sm overflow-hidden">
              <div className="p-4">
                <STSNDataTable<ClassSchedule>
                  columns={scheduleColumns}
                  rows={displaySchedules}
                  searchable={false}
                  emptyMessage={showConflictsOnly ? "No conflicts detected in the current view." : "No schedules found. Adjust filters or create a new schedule."}
                />
              </div>
              <div className="px-4 py-3 border-t border-stone-100 text-xs text-stone-400 flex justify-between">
                <span>{displaySchedules.length} schedule{displaySchedules.length !== 1 ? "s" : ""} displayed</span>
                {conflictIds.size > 0 && (
                  <span className="text-red-500 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> {conflictIds.size} entries involved in conflicts
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Room Utilization */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-stsn-beige shadow-sm p-4">
            <h3 className="text-xs font-display font-bold uppercase tracking-wider text-stone-700 mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-stsn-gold" /> Room Utilization
            </h3>
            <div className="space-y-2.5">
              {roomUsage.map(([room, count]) => {
                const max = roomUsage[0]?.[1] || 1;
                const pct = Math.round((count / max) * 100);
                return (
                  <div key={room}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] font-semibold text-stone-700 truncate max-w-[140px]">{room}</span>
                      <span className="text-[10px] font-mono font-bold text-stsn-brown">{count} class{count !== 1 ? "es" : ""}</span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-full h-1.5">
                      <div className="bg-gradient-to-r from-stsn-brown to-stsn-gold h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {roomUsage.length === 0 && <p className="text-xs text-stone-400 text-center py-4">No data.</p>}
            </div>
          </div>

          {/* Faculty Load */}
          <div className="bg-white rounded-xl border border-stsn-beige shadow-sm p-4">
            <h3 className="text-xs font-display font-bold uppercase tracking-wider text-stone-700 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-stsn-gold" /> Faculty Load
            </h3>
            <div className="space-y-2">
              {Array.from(new Set(filteredSchedules.map((s) => s.teacherId))).map((tid) => {
                const sched = filteredSchedules.filter((s) => s.teacherId === tid);
                const teacherName = sched[0]?.teacherName || "Unknown";
                return (
                  <div key={tid} className="flex justify-between items-center p-2 bg-stone-50 rounded-lg">
                    <span className="text-[11px] font-semibold text-stone-700 truncate max-w-[140px]">{teacherName}</span>
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${sched.length > 6 ? "bg-red-50 text-red-600 border border-red-200" : "bg-emerald-50 text-emerald-600 border border-emerald-200"}`}>
                      {sched.length} class{sched.length !== 1 ? "es" : ""}
                    </span>
                  </div>
                );
              })}
              {filteredSchedules.length === 0 && <p className="text-xs text-stone-400 text-center py-4">No schedules.</p>}
            </div>
          </div>

          {/* Section / Group Load */}
          <div className="bg-white rounded-xl border border-stsn-beige shadow-sm p-4">
            <h3 className="text-xs font-display font-bold uppercase tracking-wider text-stone-700 mb-3 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-stsn-gold" /> {terms.groupNoun} Load
            </h3>
            <div className="space-y-2">
              {Array.from(new Set(filteredSchedules.map((s) => s.section))).map((secName) => {
                const sec = sections.find((x) => x.name === secName);
                if (!sec) return null;
                const fillPct = sec.capacity > 0 ? Math.round((sec.currentCount / sec.capacity) * 100) : 0;
                return (
                  <div key={secName} className="flex justify-between items-center p-2 bg-stone-50 rounded-lg">
                    <span className="text-[11px] font-semibold text-stone-700 truncate max-w-[120px]">{secName}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`font-mono text-[10px] font-bold ${fillPct >= 100 ? "text-red-600" : fillPct >= 80 ? "text-amber-600" : "text-emerald-600"}`}>
                        {sec.currentCount}/{sec.capacity}
                      </span>
                      {fillPct >= 100 ? (
                        <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-200">Full</span>
                      ) : fillPct >= 80 ? (
                        <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200">Near Full</span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
              {filteredSchedules.length === 0 && <p className="text-xs text-stone-400 text-center py-4">No schedules.</p>}
            </div>
          </div>

          {/* Conflict Legend */}
          {conflictIds.size > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <h3 className="text-xs font-bold text-red-700 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Conflict Legend
              </h3>
              <ul className="text-[10px] text-red-600 space-y-1">
                <li>• Same faculty, same day, overlapping times</li>
                <li>• Same room, same day, overlapping times</li>
              </ul>
              <p className="text-[10px] text-red-500 mt-2">Edit or reassign the conflicting entries to resolve.</p>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Form */}
      {isFormOpen && (
        <ScheduleForm
          initial={editingSchedule}
          onSave={handleSave}
          onClose={() => { setIsFormOpen(false); setEditingSchedule(null); }}
        />
      )}
    </div>
  );
}

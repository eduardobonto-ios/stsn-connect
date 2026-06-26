/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useSTSNStore } from "../../../services/store";
import { SchoolSection, Student, Teacher } from "../../../types";
import type { AcademicUnit } from "../../../types/school.types";
import { getAcademicTerms, academicUnitToDepartment } from "../../../config/schools.config";
import { getAcademicScopedData } from "../../../services/academicUnitScopeService";
import { useAppDialog } from "../../../components/common/useAppDialog";
import {
  Layers, Plus, Edit2, Trash2, Search, X, CheckCircle, Users,
  GraduationCap, BookOpen, ChevronDown, UserCheck, Save, AlertCircle,
  School, ToggleLeft, ToggleRight, Grid3x3, Printer, Eye
} from "lucide-react";
import STSNDataTable, { type STSNColumn } from "../../../components/common/STSNDataTable";
import AppKpiCard from "../../../components/common/AppKpiCard";
import ModulePageHeader from "../../../components/common/ModulePageHeader";

/** Inverse of academicUnitToDepartment — used by the section form's department toggle. */
function departmentToAcademicUnit(dept: "Basic Education" | "College"): AcademicUnit {
  return dept === "Basic Education" ? "basic-ed" : "college";
}

function normalizeRosterKey(value?: string) {
  return (value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function compactRosterKey(value?: string) {
  return normalizeRosterKey(value).replace(/[^a-z0-9]/g, "");
}

function isRosterEligible(student: Student) {
  return student.enrollmentStatus === "Enrolled" || student.enrollmentStatus === "Approved";
}

function uniqueRoster(students: Student[]) {
  const seen = new Set<string>();
  return students.filter((student) => {
    if (seen.has(student.id)) return false;
    seen.add(student.id);
    return true;
  });
}

function getSectionRoster(section: SchoolSection, students: Student[]) {
  const assignedIds = new Set(section.enrolledStudentIds || []);
  const sectionKeys = [section.name, section.code].filter(Boolean);
  const normalizedSectionKeys = new Set(sectionKeys.map(normalizeRosterKey));
  const compactSectionKeys = new Set(sectionKeys.map(compactRosterKey));

  const directlyAssigned = students.filter((student) => assignedIds.has(student.id));
  const directlyMatched = students.filter((student) => {
    if (assignedIds.has(student.id)) return false;
    if (student.department !== section.department) return false;
    if (!isRosterEligible(student)) return false;

    const studentSection = normalizeRosterKey(student.section);
    const compactStudentSection = compactRosterKey(student.section);
    return normalizedSectionKeys.has(studentSection) || compactSectionKeys.has(compactStudentSection);
  });

  const directRoster = uniqueRoster([...directlyAssigned, ...directlyMatched]);
  if (directRoster.length > 0) return directRoster;

  return uniqueRoster(students.filter((student) => {
    if (student.department !== section.department) return false;
    if (!isRosterEligible(student)) return false;
    if (student.yearLevel !== section.yearLevel) return false;
    if (section.strandOrTrack && normalizeRosterKey(student.trackOrCourse) !== normalizeRosterKey(section.strandOrTrack)) return false;
    return true;
  }));
}

// ============================================================
// SECTION FORM MODAL
// ============================================================
interface SectionFormProps {
  initial?: SchoolSection | null;
  onSave: (data: Omit<SchoolSection, "id" | "createdAt">) => void;
  onClose: () => void;
  teachers: Teacher[];
  /** When set (active school is STSN or CDSTA, not "ALL"), the department toggle is locked to this value. */
  lockedDept?: "Basic Education" | "College";
}


function SectionForm({ initial, onSave, onClose, teachers, lockedDept }: SectionFormProps) {
  const { toast } = useAppDialog();
  const { setupData, courses } = useSTSNStore();
  const [dept] = useState<"Basic Education" | "College">(initial?.department || lockedDept || "Basic Education");
  const [name, setName] = useState(initial?.name || "");
  const [yearLevel, setYearLevel] = useState(initial?.yearLevel || "");
  const [strand, setStrand] = useState(initial?.strandOrTrack || "");
  const adviserId = initial?.adviserId || "";
  const [capacity, setCapacity] = useState(initial?.capacity || 40);
  const [semester, setSemester] = useState(initial?.semester || "First Semester");
  const activeSchoolYear =
    (setupData.school_years ?? []).find((sy) => sy.isCurrent)?.name ||
    (setupData.school_years ?? [])[0]?.name ||
    "";
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  const beYearLevels = (setupData.year_levels ?? []).filter((yl) => yl.academicLevel !== "College").sort((a, b) => (a.level ?? 0) - (b.level ?? 0)).map((yl) => String(yl.name ?? ""));
  const collegeYearLevels = (setupData.year_levels ?? []).filter((yl) => yl.academicLevel === "College").sort((a, b) => (a.level ?? 0) - (b.level ?? 0)).map((yl) => String(yl.name ?? ""));
  const semesterOptions = (setupData.semesters ?? []).map((s) => s.name);

  const terms = useMemo(() => getAcademicTerms(departmentToAcademicUnit(dept)), [dept]);

  const selectedYearLevelData = (setupData.year_levels ?? []).find((yl) => yl.name === yearLevel);
  const academicLevelStr = (selectedYearLevelData?.academicLevel || "").toLowerCase().trim();
  const levelNum = Number(selectedYearLevelData?.level) || 0;
  const gradeNumber = Number(yearLevel.match(/^Grade\s+(\d+)$/i)?.[1] ?? 0);
  const isSeniorHigh =
    academicLevelStr.includes("senior") ||
    academicLevelStr === "shs" ||
    gradeNumber === 11 ||
    gradeNumber === 12 ||
    levelNum === 11 ||
    levelNum === 12;
  const availableStrands = courses.filter(
    (c) => c.department === dept && (dept === "College" || (isSeniorHigh && c.durationYears === 2))
  );
  const adviserObj = teachers.find((t) => t.id === adviserId);

  const generatedCode = useMemo((): string => {
    const digits = yearLevel.replace(/\D/g, "");
    const gradePrefix = digits ? `G${digits.padStart(2, "0")}` : yearLevel.replace(/\s+/g, "").toUpperCase().substring(0, 4);
    const cleanName = name.toUpperCase().replace(/[^A-Z0-9\s]/g, "").trim().replace(/\s+/g, "-");
    return cleanName ? `${gradePrefix}-${cleanName}` : gradePrefix;
  }, [yearLevel, name]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast("Section name is required.", { variant: "warning" });
      return;
    }
    onSave({
      code: generatedCode,
      name: name.trim(),
      department: dept,
      yearLevel,
      strandOrTrack: strand || undefined,
      adviserId: adviserId || undefined,
      adviserName: adviserObj ? `${adviserObj.firstName} ${adviserObj.lastName}` : undefined,
      capacity: Number(capacity),
      currentCount: initial?.currentCount || 0,
      academicYear: activeSchoolYear,
      semester: dept === "College" ? semester : undefined,
      isActive,
      enrolledStudentIds: initial?.enrolledStudentIds || [],
    });
  };

  return (
    <div className="app-modal-backdrop z-50 animate-fade-in">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="modal-header-gradient text-stsn-cream p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-stsn-gold" />
            <h3 className="font-display font-bold text-sm">{initial ? "Edit Section" : "New Section"}</h3>
          </div>
          <button type="button" onClick={onClose} className="cursor-pointer hover:bg-white/10 p-1 rounded transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 bg-stsn-cream space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Code & Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Section Code</label>
              <div className="w-full bg-stone-100 border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold font-mono text-stone-500">
                {generatedCode || "—"}
              </div>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Section Name *</label>
              <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. STEM 11-A" className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown" />
            </div>
          </div>

          {/* Year Level & Strand */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Year Level *</label>
              <select required value={yearLevel} onChange={(e) => { setYearLevel(e.target.value); setStrand(""); }} className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown">
                <option value="">— Select Year Level —</option>
                {(dept === "College" ? collegeYearLevels : beYearLevels).map((y) => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">{terms.trackNoun}</label>
              {availableStrands.length > 0 ? (
                <select value={strand} onChange={(e) => setStrand(e.target.value)} className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none">
                  <option value="">— Select Strand —</option>
                  {availableStrands.map((c) => <option key={c.id} value={c.code}>{c.code} — {c.name}</option>)}
                </select>
              ) : (
                <div className="w-full bg-stone-100 border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold text-stone-400">None</div>
              )}
            </div>
          </div>

          {/* Capacity & Academic Year */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Capacity *</label>
              <input type="number" min={1} max={100} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown" />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Academic Year</label>
              <div className="w-full bg-stone-100 border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold font-mono text-stone-500">
                {activeSchoolYear || "—"}
              </div>
            </div>
          </div>

          {/* Semester (College only) */}
          {dept === "College" && (
            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Semester</label>
              <select value={semester} onChange={(e) => setSemester(e.target.value)} className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none">
                {semesterOptions.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          )}

          {/* Active Status */}
          <div className="flex items-center justify-between p-3 bg-white border border-stone-200 rounded-lg">
            <span className="text-xs font-bold text-stone-700">Active Status</span>
            <button type="button" onClick={() => setIsActive(!isActive)} className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-lg border cursor-pointer transition ${isActive ? "bg-green-50 border-green-200 text-green-700" : "bg-stone-50 border-stone-200 text-stone-500"}`}>
              {isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              {isActive ? "Active" : "Inactive"}
            </button>
          </div>

          <button type="submit" className="w-full btn-primary-gradient text-white font-bold text-xs py-2.5 rounded-lg cursor-pointer transition">
            {initial ? "Save Changes" : "Create Section"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ============================================================
// ADD STUDENTS MODAL
// ============================================================
interface AddStudentsModalProps {
  sectionId: string;
  sectionName: string;
  sectionYearLevel: string;
  sectionDept: string;
  alreadyEnrolled: string[];
  students: Student[];
  onClose: () => void;
}

function AddStudentsModal({ sectionId, sectionName, sectionYearLevel, sectionDept, alreadyEnrolled, students, onClose }: AddStudentsModalProps) {
  const { sections, assignStudentsToSection, setupData } = useSTSNStore();
  const { toast } = useAppDialog();
  const sectionCapacity = sections.find((s) => s.id === sectionId)?.capacity ?? Infinity;
  const [filterYear, setFilterYear] = useState(sectionYearLevel !== "All" ? sectionYearLevel : "All");
  const [searchQ, setSearchQ] = useState("");
  const [selectedStudentRows, setSelectedStudentRows] = useState<Student[]>([]);

  const beYearLevels = (setupData.year_levels ?? []).filter((yl) => yl.academicLevel !== "College").sort((a, b) => (a.level ?? 0) - (b.level ?? 0)).map((yl) => yl.name);
  const collegeYearLevels = (setupData.year_levels ?? []).filter((yl) => yl.academicLevel === "College").sort((a, b) => (a.level ?? 0) - (b.level ?? 0)).map((yl) => yl.name);
  const BE_YEAR_LEVELS_ALL = ["All", ...beYearLevels];
  const COLLEGE_YEAR_ALL = ["All", ...collegeYearLevels];

  const eligible = useMemo(() => {
    const dept = sectionDept === "Basic Education" ? "Basic Education" : "College";
    return students.filter((s) => {
      if (s.department !== dept) return false;
      if (alreadyEnrolled.includes(s.id)) return false;
      if (filterYear !== "All" && s.yearLevel !== filterYear) return false;
      if (searchQ) {
        const q = searchQ.toLowerCase();
        return `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || s.studentNo.toLowerCase().includes(q);
      }
      return true;
    });
  }, [students, sectionDept, alreadyEnrolled, filterYear, searchQ]);

  const handleSave = () => {
    if (selectedStudentRows.length === 0) { toast("No students selected.", { variant: "warning" }); return; }
    if (alreadyEnrolled.length + selectedStudentRows.length > sectionCapacity) {
      toast(`Cannot assign ${selectedStudentRows.length} student(s): section capacity (${sectionCapacity}) would be exceeded. Currently ${alreadyEnrolled.length} enrolled.`, { variant: "warning" });
      return;
    }
    assignStudentsToSection(sectionId, selectedStudentRows.map((s) => s.id));
    toast(`${selectedStudentRows.length} student(s) successfully assigned to ${sectionName}.`);
    onClose();
  };

  const studentColumns: STSNColumn<Student>[] = [
    {
      title: "Student No.",
      data: "studentNo",
      render: (v) => <span className="font-mono font-bold text-stsn-brown text-[11px]">{v}</span>,
    },
    {
      title: "Full Name",
      data: "lastName",
      render: (_v, row) => <span className="font-semibold text-stone-800">{row.lastName}, {row.firstName}</span>,
    },
    {
      title: "Year Level",
      data: "yearLevel",
      render: (v) => <span className="text-stone-600">{v}</span>,
    },
    {
      title: "Strand / Course",
      data: "trackOrCourse",
      render: (v) => (
        <span className="bg-stsn-cream border border-stsn-beige text-stsn-brown text-[10px] font-bold px-2 py-0.5 rounded">
          {v || "—"}
        </span>
      ),
    },
    {
      title: "Status",
      data: "enrollmentStatus",
      className: "text-center",
      searchable: false,
      render: (v: string) => (
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
          v === "Enrolled" ? "bg-green-50 text-green-700 border-green-200" :
          v === "Approved" ? "bg-blue-50 text-blue-700 border-blue-200" :
          "bg-amber-50 text-amber-700 border-amber-200"
        }`}>{v}</span>
      ),
    },
  ];

  return (
    <div className="app-modal-backdrop z-50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="modal-header-gradient text-stsn-cream p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-stsn-gold" />
            <div>
              <h3 className="font-display font-bold text-sm">Add Students to Section</h3>
              <p className="text-[10px] text-stsn-gold-light/70">{sectionName}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="cursor-pointer hover:bg-white/10 p-1 rounded transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 bg-stone-50 border-b border-stone-100 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-40">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-stone-400" />
            <input type="text" placeholder="Search by name or student no..." value={searchQ} onChange={(e) => setSearchQ(e.target.value)} className="w-full bg-white border border-stone-200 rounded-lg py-2 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-stsn-brown" />
          </div>
          <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none">
            {(sectionDept === "Basic Education" ? BE_YEAR_LEVELS_ALL : COLLEGE_YEAR_ALL).map((y) => <option key={y}>{y}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto p-2">
          <STSNDataTable<Student>
            columns={studentColumns}
            rows={eligible}
            emptyMessage="No eligible students found."
            bulkSelectable
            onBulkSelect={setSelectedStudentRows}
            pageLength={10}
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-100 bg-stone-50 flex justify-between items-center">
          <span className="text-xs text-stone-500">{selectedStudentRows.length} student{selectedStudentRows.length !== 1 ? "s" : ""} selected</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-stone-600 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 cursor-pointer">Cancel</button>
            <button
              onClick={handleSave}
              disabled={selectedStudentRows.length === 0}
              className="px-4 py-2 text-xs font-bold text-white btn-primary-gradient rounded-lg shadow cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              Assign {selectedStudentRows.length > 0 ? `(${selectedStudentRows.length})` : ""} Students
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN CLASS SECTIONING MODULE
// ============================================================
export default function ClassSectioningModule() {
  const { sections, teachers, students, currentUser, activeSchool, academicUnit, addSection, updateSection, deleteSection, toggleSectionActive } = useSTSNStore();
  const { confirm } = useAppDialog();
  const scopedData = useMemo(
    () => getAcademicScopedData({ currentUser, activeSchool, academicUnit, students, teachers, sections }),
    [currentUser, activeSchool, academicUnit, students, teachers, sections],
  );
  const scopedStudents = scopedData.students;
  const scopedTeachers = scopedData.teachers ?? [];
  const scopedSections = scopedData.sections ?? [];

  // Single source of truth for Basic-Ed vs College terminology.
  const terms = useMemo(() => getAcademicTerms(academicUnit), [academicUnit]);
  // When a specific school is active (not Super Admin's "ALL"), lock new
  // sections to that school's department so a Registrar can't accidentally
  // create a section for the other academic unit.
  const lockedDept = scopedData.scope.department;

  const [searchQ, setSearchQ] = useState("");
  const [filterDept, setFilterDept] = useState<"All" | "Basic Education" | "College">(lockedDept || "All");
  const [filterYear, setFilterYear] = useState("All");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<SchoolSection | null>(null);
  const [addStudentsModal, setAddStudentsModal] = useState<SchoolSection | null>(null);
  const [viewStudentsSection, setViewStudentsSection] = useState<SchoolSection | null>(null);

  const yearLevelOptions = useMemo(() => {
    const all = [...new Set(scopedSections.map((s) => s.yearLevel))].sort();
    return ["All", ...all];
  }, [scopedSections]);

  React.useEffect(() => {
    if (lockedDept) setFilterDept(lockedDept);
  }, [lockedDept]);

  const filtered = useMemo(() => {
    return scopedSections.filter((s) => {
      const q = searchQ.toLowerCase();
      const matchSearch = s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || (s.adviserName || "").toLowerCase().includes(q);
      const matchDept = filterDept === "All" || s.department === filterDept;
      const matchYear = filterYear === "All" || s.yearLevel === filterYear;
      return matchSearch && matchDept && matchYear;
    });
  }, [scopedSections, searchQ, filterDept, filterYear]);

  const handleSave = (data: Omit<SchoolSection, "id" | "createdAt">) => {
    const scopedSection = scopedData.scope.schoolId ? { ...data, schoolId: scopedData.scope.schoolId } : data;
    if (editingSection) {
      updateSection(editingSection.id, scopedSection);
    } else {
      addSection(scopedSection);
    }
    setIsFormOpen(false);
    setEditingSection(null);
  };

  const handleDelete = async (sec: SchoolSection) => {
    if (!(await confirm(`Delete section "${sec.name}"? This cannot be undone.`, { variant: "danger" }))) return;
    deleteSection(sec.id);
  };

  const openEdit = (sec: SchoolSection) => { setEditingSection(sec); setIsFormOpen(true); };
  const openCreate = () => { setEditingSection(null); setIsFormOpen(true); };

  const sectionColumns: STSNColumn<SchoolSection>[] = [
    { title: "Code", data: "code", className: "font-mono font-bold text-stsn-brown text-[11px]" },
    { title: "Section Name", data: "name", className: "font-semibold text-stone-800" },
    {
      title: "Dept",
      data: "department",
      render: (value: SchoolSection["department"]) => (
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${value === "Basic Education" ? "bg-stsn-cream text-stsn-brown border-stsn-beige" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
          {value === "Basic Education" ? "Basic Ed" : "College"}
        </span>
      ),
    },
    { title: "Year Level", data: "yearLevel", className: "text-stone-600" },
    {
      title: "Strand / Course",
      data: "strandOrTrack",
      className: "text-stone-600",
      render: (value) => value || "—",
    },
    {
      title: "Adviser",
      data: "adviserName",
      className: "text-stone-600 max-w-[120px] truncate",
      render: (value, row) => <span title={row.adviserName}>{value || "—"}</span>,
    },
    {
      title: "Enrolled / Cap",
      data: "currentCount",
      render: (_value, sec) => {
        const rosterCount = getSectionRoster(sec, scopedStudents).length;
        const fillPct = Math.round((rosterCount / sec.capacity) * 100);
        return (
          <div className="flex items-center gap-2">
            <span className={`font-mono font-bold text-[11px] ${fillPct >= 100 ? "text-red-600" : fillPct >= 80 ? "text-amber-600" : "text-emerald-600"}`}>
              {rosterCount}/{sec.capacity}
            </span>
            <div className="w-14 bg-stone-100 rounded-full h-1.5 overflow-hidden">
              <div className={`h-full rounded-full ${fillPct >= 100 ? "bg-red-500" : fillPct >= 80 ? "bg-amber-400" : "bg-emerald-500"}`} style={{ width: `${Math.min(fillPct, 100)}%` }} />
            </div>
            {fillPct >= 100 ? (
              <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-200">Full</span>
            ) : fillPct >= 80 ? (
              <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200">Near Full</span>
            ) : null}
          </div>
        );
      },
    },
    {
      title: "Status",
      data: "isActive",
      render: (value: boolean, sec) => (
        <button onClick={() => toggleSectionActive(sec.id)} className={`text-[9px] font-bold px-2 py-0.5 rounded-full border cursor-pointer transition ${value ? "bg-green-50 text-green-700 border-green-200" : "bg-stone-50 text-stone-500 border-stone-200"}`}>
          {value ? "Active" : "Inactive"}
        </button>
      ),
    },
    {
      title: "Actions",
      orderable: false,
      searchable: false,
      render: (_value, sec) => (
        <div className="flex items-center gap-1">
          <button onClick={() => setAddStudentsModal(sec)} className="p-1.5 hover:bg-emerald-50 rounded text-stone-400 hover:text-emerald-600 cursor-pointer" title="Add Students">
            <UserCheck className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setViewStudentsSection(sec)} className="p-1.5 hover:bg-purple-50 rounded text-stone-400 hover:text-purple-600 cursor-pointer" title="View Students">
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => openEdit(sec)} className="p-1.5 hover:bg-blue-50 rounded text-stone-400 hover:text-blue-600 cursor-pointer" title="Edit">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => handleDelete(sec)} className="p-1.5 hover:bg-red-50 rounded text-stone-400 hover:text-red-600 cursor-pointer" title="Delete">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  // Stats
  const totalActive = filtered.filter((s) => s.isActive).length;
  const totalCapacity = filtered.reduce((sum, s) => sum + s.capacity, 0);
  const totalEnrolled = filtered.reduce((sum, s) => sum + getSectionRoster(s, scopedStudents).length, 0);
  const unitSectionCount = filtered.filter((s) => !lockedDept || s.department === lockedDept).length;

  return (
    <div className="space-y-5 animate-fade-in font-sans">

      <ModulePageHeader
        badge="Class Management"
        badgeIcon={Grid3x3}
        title="Class Sectioning"
        subtitle={`Master ${terms.groupNoun} Repository — CRUD management for all school ${terms.groupNoun.toLowerCase()}s, ${terms.groupLeaderNoun.toLowerCase()}s, and student assignments.`}
        actions={
          <button onClick={openCreate} className="inline-flex items-center gap-2 bg-[#C5A059] hover:bg-[#d4af68] text-[#1C1512] text-sm font-bold px-5 py-2.5 rounded-xl shadow-lg transition cursor-pointer">
            <Plus className="w-4 h-4" /> New {terms.groupNoun}
          </button>
        }
      />

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <AppKpiCard label="Active Sections" value={totalActive} icon={Layers} tone="warning" hint="Currently active" />
        <AppKpiCard label={lockedDept ? `${lockedDept} Sections` : "Scoped Sections"} value={unitSectionCount} icon={Grid3x3} tone="success" hint="In current scope" />
        <AppKpiCard label="Total Enrolled" value={totalEnrolled} icon={Users} tone="info" hint="Across all sections" />
        <AppKpiCard label="Total Capacity" value={totalCapacity} icon={GraduationCap} tone="neutral" hint="Combined seat limit" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-stsn-beige shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-stone-400" />
          <input type="text" placeholder="Search by section name, code, adviser..." value={searchQ} onChange={(e) => setSearchQ(e.target.value)} className="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 pl-8 pr-3 text-xs focus:ring-1 focus:ring-stsn-brown focus:outline-none" />
        </div>
        {lockedDept ? (
          <div className="bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold text-stone-500">
            {lockedDept}
          </div>
        ) : (
          <select value={filterDept} onChange={(e: any) => setFilterDept(e.target.value)} className="bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none">
            <option value="All">All Departments</option>
            <option value="Basic Education">Basic Education</option>
            <option value="College">College</option>
          </select>
        )}
        <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none">
          {yearLevelOptions.map((y) => <option key={y}>{y}</option>)}
        </select>
        <span className="text-[10px] text-stone-400 font-mono">{filtered.length} section{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Sections Table */}
      <div className="bg-white rounded-xl border border-stsn-beige shadow-sm overflow-hidden p-4">
        <STSNDataTable<SchoolSection>
          columns={sectionColumns}
          rows={filtered}
          searchable={false}
          emptyMessage="No sections found. Create a new section to get started."
        />
        <div className="px-4 py-3 border-t border-stone-100 text-xs text-stone-400 font-mono">
          {filtered.length} section{filtered.length !== 1 ? "s" : ""} displayed • Total Enrolled: {totalEnrolled} / {totalCapacity} capacity
        </div>
      </div>

      {/* Section Form Modal */}
      {isFormOpen && (
        <SectionForm
          initial={editingSection}
          onSave={handleSave}
          onClose={() => { setIsFormOpen(false); setEditingSection(null); }}
          teachers={scopedTeachers}
          lockedDept={editingSection ? undefined : lockedDept}
        />
      )}

      {/* Add Students Modal */}
      {addStudentsModal && (
        <AddStudentsModal
          sectionId={addStudentsModal.id}
          sectionName={addStudentsModal.name}
          sectionYearLevel={addStudentsModal.yearLevel}
          sectionDept={addStudentsModal.department}
          alreadyEnrolled={getSectionRoster(addStudentsModal, scopedStudents).map((student) => student.id)}
          students={scopedStudents}
          onClose={() => setAddStudentsModal(null)}
        />
      )}

      {/* View Students Modal */}
      {viewStudentsSection && createPortal(
        (() => {
          const enrolledStudents = getSectionRoster(viewStudentsSection, scopedStudents);

          const handlePrint = () => {
            const sec = viewStudentsSection;
            const printWindow = window.open("", "_blank", "width=900,height=700");
            if (!printWindow) return;
            const crestUrl = `${window.location.origin}/stsn-crest.png`;
            const rows = enrolledStudents.map((s, i) => `
              <tr>
                <td style="padding:6px 10px;border-bottom:1px solid #e7e5e4;text-align:center;">${i + 1}</td>
                <td style="padding:6px 10px;border-bottom:1px solid #e7e5e4;font-family:monospace;font-weight:700;">${s.studentNo}</td>
                <td style="padding:6px 10px;border-bottom:1px solid #e7e5e4;font-weight:600;">${s.lastName}, ${s.firstName}${s.middleName ? " " + s.middleName.charAt(0) + "." : ""}</td>
                <td style="padding:6px 10px;border-bottom:1px solid #e7e5e4;">${s.yearLevel}</td>
                <td style="padding:6px 10px;border-bottom:1px solid #e7e5e4;">${s.trackOrCourse || "—"}</td>
                <td style="padding:6px 10px;border-bottom:1px solid #e7e5e4;text-align:center;">${s.enrollmentStatus}</td>
              </tr>`).join("");
            printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Section: ${sec.name}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 12px; margin: 32px; color: #1c1917; }
    .school-header { display: flex; align-items: center; justify-content: center; gap: 14px; padding-bottom: 14px; margin-bottom: 18px; border-bottom: 2px solid #5b3a26; text-align: center; }
    .school-header img { width: 58px; height: 58px; object-fit: contain; }
    .school-name { font-size: 18px; font-weight: 800; margin: 0 0 4px; text-transform: uppercase; letter-spacing: .03em; }
    .school-address { font-size: 11px; color: #57534e; margin: 0; line-height: 1.35; }
    h1 { font-size: 16px; margin: 0 0 2px; }
    .subtitle { font-size: 11px; color: #78716c; margin-bottom: 16px; }
    .meta { display: flex; gap: 32px; margin-bottom: 20px; font-size: 11px; }
    .meta span { display: flex; flex-direction: column; }
    .meta strong { font-size: 10px; text-transform: uppercase; color: #a8a29e; margin-bottom: 2px; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #292524; color: #fff; }
    th { padding: 8px 10px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: .05em; }
    th:first-child, td:first-child { text-align: center; width: 36px; }
    tbody tr:nth-child(even) { background: #fafaf9; }
    .footer { margin-top: 24px; font-size: 10px; color: #a8a29e; display: flex; justify-content: space-between; }
    @media print { body { margin: 16px; } }
  </style>
</head>
<body>
  <div class="school-header">
    <img src="${crestUrl}" alt="St. Theresa's School of Novaliches crest" />
    <div>
      <p class="school-name">St. Theresa's School of Novaliches</p>
      <p class="school-address">#7 Kingfisher Street Zabarte Subdivision, Novaliches,<br />Quezon City 1124, Philippines</p>
    </div>
  </div>
  <h1>Section: ${sec.name}</h1>
  <div class="subtitle">${sec.code} &bull; ${sec.yearLevel} &bull; ${sec.department === "Basic Education" ? "Basic Education" : "College"}${sec.strandOrTrack ? " &bull; " + sec.strandOrTrack : ""}</div>
  <div class="meta">
    <span><strong>Adviser</strong>${sec.adviserName || "—"}</span>
    <span><strong>Academic Year</strong>${sec.academicYear}</span>
    ${sec.semester ? `<span><strong>Semester</strong>${sec.semester}</span>` : ""}
    <span><strong>Enrolled / Capacity</strong>${enrolledStudents.length} / ${sec.capacity}</span>
  </div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Student No.</th>
        <th>Full Name</th>
        <th>Year Level</th>
        <th>Strand / Course</th>
        <th style="text-align:center;">Status</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">
    <span>STSN Connect &mdash; Class Sectioning</span>
    <span>Printed: ${new Date().toLocaleString()}</span>
  </div>
  <script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`);
            printWindow.document.close();
          };

          return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] mx-4">
                <div className="modal-header-gradient text-stsn-cream p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-stsn-gold" />
                    <div>
                      <h3 className="font-display font-bold text-sm">Students — {viewStudentsSection.name}</h3>
                      <p className="text-[10px] text-stsn-gold-light/70">{viewStudentsSection.yearLevel} • {viewStudentsSection.department === "Basic Education" ? "Basic Ed" : "College"}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setViewStudentsSection(null)} className="cursor-pointer hover:bg-white/10 p-1 rounded transition">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {enrolledStudents.length === 0 ? (
                    <p className="text-center text-stone-400 text-xs py-10 italic">No students assigned to this section.</p>
                  ) : (
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-stsn-brown text-white">
                        <tr>
                          <th className="px-4 py-2.5 text-center text-[10px] uppercase font-bold w-10">#</th>
                          <th className="px-4 py-2.5 text-left text-[10px] uppercase font-bold">Student No.</th>
                          <th className="px-4 py-2.5 text-left text-[10px] uppercase font-bold">Full Name</th>
                          <th className="px-4 py-2.5 text-left text-[10px] uppercase font-bold">Year Level</th>
                          <th className="px-4 py-2.5 text-left text-[10px] uppercase font-bold">Track / Course</th>
                          <th className="px-4 py-2.5 text-center text-[10px] uppercase font-bold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {enrolledStudents.map((s, i) => (
                          <tr key={s.id} className="hover:bg-stone-50">
                            <td className="px-4 py-2.5 text-center text-stone-400 font-mono">{i + 1}</td>
                            <td className="px-4 py-2.5 font-mono font-bold text-stsn-brown">{s.studentNo}</td>
                            <td className="px-4 py-2.5 font-semibold text-stone-800">{s.lastName}, {s.firstName}</td>
                            <td className="px-4 py-2.5 text-stone-500">{s.yearLevel}</td>
                            <td className="px-4 py-2.5 text-stone-500">{s.trackOrCourse || "—"}</td>
                            <td className="px-4 py-2.5 text-center">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                                s.enrollmentStatus === "Enrolled" ? "bg-green-50 text-green-700 border-green-200" :
                                s.enrollmentStatus === "Approved" ? "bg-blue-50 text-blue-700 border-blue-200" :
                                "bg-amber-50 text-amber-700 border-amber-200"
                              }`}>
                                {s.enrollmentStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                <div className="p-4 border-t border-stone-100 bg-stone-50 flex justify-between items-center">
                  <span className="text-xs text-stone-400 font-mono">
                    {enrolledStudents.length} student(s) in section
                  </span>
                  <div className="flex gap-2">
                    {enrolledStudents.length > 0 && (
                      <button
                        onClick={handlePrint}
                        className="px-4 py-2 text-xs font-bold text-white btn-primary-gradient rounded-lg shadow cursor-pointer flex items-center gap-1.5"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print Class List
                      </button>
                    )}
                    <button onClick={() => setViewStudentsSection(null)} className="px-4 py-2 text-xs font-bold text-stone-600 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 cursor-pointer">Close</button>
                  </div>
                </div>
              </div>
            </div>
          );
        })(),
        document.body
      )}
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { useSTSNStore } from "../../../services/store";
import { SchoolSection, Teacher } from "../../../types";
import type { AcademicUnit } from "../../../types/school.types";
import { getAcademicTerms, academicUnitToDepartment } from "../../../config/schools.config";
import { useAppDialog } from "../../../components/common/useAppDialog";
import {
  Layers, Plus, Edit2, Trash2, Search, X, CheckCircle, Users,
  GraduationCap, BookOpen, ChevronDown, UserCheck, Save, AlertCircle,
  School, ToggleLeft, ToggleRight, Grid3x3
} from "lucide-react";
import STSNDataTable, { type STSNColumn } from "../../../components/common/STSNDataTable";

/** Inverse of academicUnitToDepartment — used by the section form's department toggle. */
function departmentToAcademicUnit(dept: "Basic Education" | "College"): AcademicUnit {
  return dept === "Basic Education" ? "basic-ed" : "college";
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
  const [dept, setDept] = useState<"Basic Education" | "College">(initial?.department || lockedDept || "Basic Education");
  const [code, setCode] = useState(initial?.code || "");
  const [name, setName] = useState(initial?.name || "");
  const [yearLevel, setYearLevel] = useState(initial?.yearLevel || "Grade 11");
  const [strand, setStrand] = useState(initial?.strandOrTrack || "");
  const [adviserId, setAdviserId] = useState(initial?.adviserId || "");
  const [capacity, setCapacity] = useState(initial?.capacity || 40);
  const [academicYear, setAcademicYear] = useState(initial?.academicYear || "2026-2027");
  const [semester, setSemester] = useState(initial?.semester || "First Semester");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  const beYearLevels = (setupData.year_levels ?? []).filter((yl) => yl.academicLevel !== "College").sort((a, b) => (a.level ?? 0) - (b.level ?? 0)).map((yl) => yl.name);
  const collegeYearLevels = (setupData.year_levels ?? []).filter((yl) => yl.academicLevel === "College").sort((a, b) => (a.level ?? 0) - (b.level ?? 0)).map((yl) => yl.name);
  const shsStrands = courses.filter((c) => c.department === "Basic Education" && c.durationYears === 2).map((c) => c.code);
  const collegeTracks = courses.filter((c) => c.department === "College").map((c) => c.code);
  const semesterOptions = (setupData.semesters ?? []).map((s) => s.name);

  const terms = useMemo(() => getAcademicTerms(departmentToAcademicUnit(dept)), [dept]);
  const availableStrands = (yearLevel === "Grade 11" || yearLevel === "Grade 12") ? shsStrands : [];
  const filteredTeachers = teachers.filter((t) => dept === "Basic Education" ? t.department === "Basic Education" : t.department === "College");
  const adviserObj = teachers.find((t) => t.id === adviserId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      toast("Section code and name are required.", { variant: "warning" });
      return;
    }
    onSave({
      code: code.trim().toUpperCase(),
      name: name.trim(),
      department: dept,
      yearLevel,
      strandOrTrack: strand || undefined,
      adviserId: adviserId || undefined,
      adviserName: adviserObj ? `${adviserObj.firstName} ${adviserObj.lastName}` : undefined,
      capacity: Number(capacity),
      currentCount: initial?.currentCount || 0,
      academicYear,
      semester: dept === "College" ? semester : undefined,
      isActive,
      enrolledStudentIds: initial?.enrolledStudentIds || [],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
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
          {/* Department */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Department *</label>
            {lockedDept ? (
              <div className="flex items-center justify-between p-2.5 bg-white border border-stone-200 rounded-lg">
                <span className="text-xs font-bold text-stone-700">{lockedDept}</span>
                <span className="text-[9px] font-mono uppercase text-stone-400">Locked to active school context</span>
              </div>
            ) : (
              <div className="flex gap-2">
                {(["Basic Education", "College"] as const).map((d) => (
                  <button
                    key={d} type="button"
                    onClick={() => { setDept(d); setYearLevel(d === "Basic Education" ? "Grade 11" : "1st Year"); setStrand(""); }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition cursor-pointer ${dept === d ? "btn-primary-gradient text-white border-stsn-brown" : "bg-white text-stone-600 border-stone-200 hover:border-stone-300"}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Code & Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Section Code *</label>
              <input required value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. G11-STEM-A" className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown" />
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
              <select value={yearLevel} onChange={(e) => { setYearLevel(e.target.value); setStrand(""); }} className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown">
                {(dept === "Basic Education" ? beYearLevels : collegeYearLevels).map((y) => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">{terms.trackNoun}</label>
              {dept === "Basic Education" ? (
                availableStrands.length > 0 ? (
                  <select value={strand} onChange={(e) => setStrand(e.target.value)} className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none">
                    <option value="">— General —</option>
                    {availableStrands.map((s) => <option key={s}>{s}</option>)}
                  </select>
                ) : (
                  <input value={strand} onChange={(e) => setStrand(e.target.value)} placeholder="e.g. Junior High" className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none" />
                )
              ) : (
                <select value={strand} onChange={(e) => setStrand(e.target.value)} className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none">
                  <option value="">— Select Course —</option>
                  {collegeTracks.map((c) => <option key={c}>{c}</option>)}
                </select>
              )}
            </div>
          </div>

          {/* Adviser */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">{terms.groupLeaderNoun}</label>
            <select value={adviserId} onChange={(e) => setAdviserId(e.target.value)} className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none">
              <option value="">— No {terms.groupLeaderNoun} Assigned —</option>
              {filteredTeachers.map((t) => (
                <option key={t.id} value={t.id}>{t.firstName} {t.lastName} — {t.specialization}</option>
              ))}
            </select>
          </div>

          {/* Capacity & Academic Year */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Capacity *</label>
              <input type="number" min={1} max={100} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown" />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Academic Year *</label>
              <select value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none">
                {["2026-2027", "2025-2026", "2024-2025"].map((y) => <option key={y}>{y}</option>)}
              </select>
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
  onClose: () => void;
}

function AddStudentsModal({ sectionId, sectionName, sectionYearLevel, sectionDept, alreadyEnrolled, onClose }: AddStudentsModalProps) {
  const { students, assignStudentsToSection, setupData } = useSTSNStore();
  const { toast } = useAppDialog();
  const [filterYear, setFilterYear] = useState(sectionYearLevel !== "All" ? sectionYearLevel : "All");
  const [searchQ, setSearchQ] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

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

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === eligible.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(eligible.map((s) => s.id)));
    }
  };

  const handleSave = () => {
    if (selected.size === 0) { toast("No students selected.", { variant: "warning" }); return; }
    assignStudentsToSection(sectionId, Array.from(selected));
    toast(`${selected.size} student(s) successfully assigned to ${sectionName}.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
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
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <span className="font-bold text-stsn-brown">{selected.size}</span> selected
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-stsn-brown text-white">
              <tr>
                <th className="py-2.5 px-3 text-left">
                  <input type="checkbox" checked={eligible.length > 0 && selected.size === eligible.length} onChange={toggleAll} className="accent-stsn-gold cursor-pointer" />
                </th>
                <th className="py-2.5 px-3 text-left text-[10px] uppercase font-bold">Student No.</th>
                <th className="py-2.5 px-3 text-left text-[10px] uppercase font-bold">Full Name</th>
                <th className="py-2.5 px-3 text-left text-[10px] uppercase font-bold">Year Level</th>
                <th className="py-2.5 px-3 text-left text-[10px] uppercase font-bold">Strand / Course</th>
                <th className="py-2.5 px-3 text-center text-[10px] uppercase font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {eligible.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-stone-400 italic">No eligible students found.</td>
                </tr>
              ) : eligible.map((s) => {
                const isSelected = selected.has(s.id);
                return (
                  <tr
                    key={s.id}
                    onClick={() => toggleSelect(s.id)}
                    className={`cursor-pointer transition ${isSelected ? "bg-stsn-cream/60" : "hover:bg-stone-50"}`}
                  >
                    <td className="py-2.5 px-3">
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(s.id)} onClick={(e) => e.stopPropagation()} className="accent-stsn-brown cursor-pointer" />
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-stsn-brown text-[11px]">{s.studentNo}</td>
                    <td className="py-2.5 px-3 font-semibold text-stone-800">{s.lastName}, {s.firstName}</td>
                    <td className="py-2.5 px-3 text-stone-600">{s.yearLevel}</td>
                    <td className="py-2.5 px-3">
                      <span className="bg-stsn-cream border border-stsn-beige text-stsn-brown text-[10px] font-bold px-2 py-0.5 rounded">
                        {s.trackOrCourse || "—"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        s.enrollmentStatus === "Enrolled" ? "bg-green-50 text-green-700 border-green-200" :
                        s.enrollmentStatus === "Approved" ? "bg-blue-50 text-blue-700 border-blue-200" :
                        "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        {s.enrollmentStatus}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-100 bg-stone-50 flex justify-between items-center">
          <span className="text-xs text-stone-500">{selected.size} student{selected.size !== 1 ? "s" : ""} selected</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-stone-600 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 cursor-pointer">Cancel</button>
            <button
              onClick={handleSave}
              disabled={selected.size === 0}
              className="px-4 py-2 text-xs font-bold text-white btn-primary-gradient rounded-lg shadow cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              Assign {selected.size > 0 ? `(${selected.size})` : ""} Students
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
  const { sections, teachers, students, activeSchool, academicUnit, addSection, updateSection, deleteSection, toggleSectionActive } = useSTSNStore();
  const { confirm } = useAppDialog();

  // Single source of truth for Basic-Ed vs College terminology.
  const terms = useMemo(() => getAcademicTerms(academicUnit), [academicUnit]);
  // When a specific school is active (not Super Admin's "ALL"), lock new
  // sections to that school's department so a Registrar can't accidentally
  // create a section for the other academic unit.
  const lockedDept = activeSchool === "ALL" ? undefined : academicUnitToDepartment(academicUnit);

  const [searchQ, setSearchQ] = useState("");
  const [filterDept, setFilterDept] = useState<"All" | "Basic Education" | "College">("All");
  const [filterYear, setFilterYear] = useState("All");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<SchoolSection | null>(null);
  const [addStudentsModal, setAddStudentsModal] = useState<SchoolSection | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const yearLevelOptions = useMemo(() => {
    const all = [...new Set(sections.map((s) => s.yearLevel))].sort();
    return ["All", ...all];
  }, [sections]);

  const filtered = useMemo(() => {
    return sections.filter((s) => {
      const q = searchQ.toLowerCase();
      const matchSearch = s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || (s.adviserName || "").toLowerCase().includes(q);
      const matchDept = filterDept === "All" || s.department === filterDept;
      const matchYear = filterYear === "All" || s.yearLevel === filterYear;
      return matchSearch && matchDept && matchYear;
    });
  }, [sections, searchQ, filterDept, filterYear]);

  const handleSave = (data: Omit<SchoolSection, "id" | "createdAt">) => {
    if (editingSection) {
      updateSection(editingSection.id, data);
    } else {
      addSection(data);
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
        const fillPct = Math.round((sec.currentCount / sec.capacity) * 100);
        return (
          <div className="flex items-center gap-2">
            <span className={`font-mono font-bold text-[11px] ${fillPct >= 100 ? "text-red-600" : fillPct >= 80 ? "text-amber-600" : "text-emerald-600"}`}>
              {sec.currentCount}/{sec.capacity}
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
      title: "Students",
      orderable: false,
      searchable: false,
      render: (_value, sec) => {
        const isExpanded = expandedSection === sec.id;
        const enrolledStudents = (sec.enrolledStudentIds || []).map((id) => students.find((s) => s.id === id)).filter(Boolean) as typeof students;
        return (
          <div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setAddStudentsModal(sec)}
                className="flex items-center gap-1 text-[9px] font-bold px-2 py-1 bg-stsn-cream border border-stsn-beige text-stsn-brown rounded-lg hover:bg-stsn-beige cursor-pointer transition"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
              {enrolledStudents.length > 0 && (
                <button
                  onClick={() => setExpandedSection(isExpanded ? null : sec.id)}
                  className="text-[9px] font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  {isExpanded ? "Hide" : `View (${enrolledStudents.length})`}
                </button>
              )}
            </div>
            {isExpanded && enrolledStudents.length > 0 && (
              <div className="mt-2 space-y-1 max-h-40 overflow-y-auto pr-1">
                <p className="text-[9px] font-bold text-stone-400 uppercase">Students in {sec.name}</p>
                {enrolledStudents.map((s) => s && (
                  <div key={s.id} className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-lg px-2 py-1">
                    <UserCheck className="w-3 h-3 text-stsn-gold flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-stone-800 truncate">{s.lastName}, {s.firstName}</p>
                      <p className="text-[9px] font-mono text-stone-400 truncate">{s.studentNo}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Actions",
      orderable: false,
      searchable: false,
      render: (_value, sec) => (
        <div className="flex items-center gap-1">
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
  const totalActive = sections.filter((s) => s.isActive).length;
  const totalCapacity = sections.reduce((sum, s) => sum + s.capacity, 0);
  const totalEnrolled = sections.reduce((sum, s) => sum + s.currentCount, 0);
  const beCount = sections.filter((s) => s.department === "Basic Education").length;
  const collegeCount = sections.filter((s) => s.department === "College").length;

  return (
    <div className="space-y-5 animate-fade-in font-sans">

      {/* Header */}
      <div className="p-5 bg-white border border-stsn-beige rounded-xl shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-xl font-display font-semibold text-stone-900 tracking-tight flex items-center gap-2">
              <Grid3x3 className="w-5 h-5 text-stsn-brown" />
              Class Sectioning
            </h2>
            <p className="text-stone-500 text-xs mt-1">
              Master {terms.groupNoun} Repository — CRUD management for all school {terms.groupNoun.toLowerCase()}s, {terms.groupLeaderNoun.toLowerCase()}s, and student assignments.
            </p>
          </div>
          <button onClick={openCreate} className="btn-primary-gradient text-white text-xs font-bold px-4 py-2 rounded-lg shadow cursor-pointer flex items-center gap-2 transition">
            <Plus className="w-4 h-4" /> New {terms.groupNoun}
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Active Sections", value: totalActive, color: "text-stsn-brown" },
          { label: "Basic Ed Sections", value: beCount, color: "text-emerald-600" },
          { label: "College Sections", value: collegeCount, color: "text-blue-600" },
          { label: "Total Capacity", value: totalCapacity, color: "text-purple-600" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-stsn-beige shadow-sm p-4 text-center">
            <p className={`text-2xl font-display font-black ${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] text-stone-400 uppercase font-mono mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-stsn-beige shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-stone-400" />
          <input type="text" placeholder="Search by section name, code, adviser..." value={searchQ} onChange={(e) => setSearchQ(e.target.value)} className="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 pl-8 pr-3 text-xs focus:ring-1 focus:ring-stsn-brown focus:outline-none" />
        </div>
        <select value={filterDept} onChange={(e: any) => setFilterDept(e.target.value)} className="bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none">
          <option value="All">All Departments</option>
          <option value="Basic Education">Basic Education</option>
          <option value="College">College</option>
        </select>
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
          teachers={teachers}
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
          alreadyEnrolled={addStudentsModal.enrolledStudentIds || []}
          onClose={() => setAddStudentsModal(null)}
        />
      )}
    </div>
  );
}

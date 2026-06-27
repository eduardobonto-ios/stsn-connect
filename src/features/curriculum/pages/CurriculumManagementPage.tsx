/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { useSTSNStore } from "../../../services/store";
import { useAppDialog } from "../../../components/common/useAppDialog";
import type { Course, Subject } from "../../../types";
import {
  BookOpen,
  Plus,
  Trash2,
  Edit,
  Settings,
  BookMarked,
  Layers,
  GraduationCap,
} from "lucide-react";
import DataTableCard from "../../../components/common/DataTableCard";
import ModulePageHeader from "../../../components/common/ModulePageHeader";
import AppKpiCard from "../../../components/common/AppKpiCard";
import AppModal from "../../../components/common/AppModal";
import EmptyState from "../../../components/common/EmptyState";
import STSNDataTable, { type STSNColumn } from "../../../components/common/STSNDataTable";

export default function CurriculumManagement() {
  const {
    courses,
    subjects,
    curriculums,
    addCourse,
    updateCourse,
    deleteCourse,
    addSubject,
    updateSubject,
    deleteSubject,
    addCurriculum,
    updateCurriculum,
    deleteCurriculum,
    setupData,
  } = useSTSNStore();
  const { toast, confirm } = useAppDialog();

  const [activeTab, setActiveTab] = useState<"courses" | "curriculum" | "subjects">("curriculum");
  const [selectedCurriculumId, setSelectedCurriculumId] = useState<string>("curr-elementary");
  const activeCurriculum = curriculums.find((c) => c.id === selectedCurriculumId) || curriculums[0];

  const [courseSearch, setCourseSearch] = useState("");
  const [subjectSearch, setSubjectSearch] = useState("");

  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseForm, setCourseForm] = useState({
    code: "",
    name: "",
    department: "College" as "College" | "Basic Education",
    durationYears: 4,
  });

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectForm, setSubjectForm] = useState({
    code: "",
    name: "",
    units: 3,
    department: "College" as "College" | "Basic Education",
    yearLevel: "1st Year",
    semester: "First Semester" as "First Semester" | "Second Semester" | "Full Year",
    trackOrCourse: "BSIT",
  });

  const [isCurriculumModalOpen, setIsCurriculumModalOpen] = useState(false);
  const [currForm, setCurrForm] = useState({
    courseCode: "BSIT",
    schoolYear: "2026-2027",
    description: "",
    customName: "",
  });

  const [isAddSubjectToCurrModalOpen, setIsAddSubjectToCurrModalOpen] = useState(false);
  const [selectedCatalogSubjectCode, setSelectedCatalogSubjectCode] = useState("");
  const [currAddSubjectForm, setCurrAddSubjectForm] = useState({
    unitsSelected: 3,
    gradeLevelSelected: "Grade 4",
  });

  const [isEditCurrModalOpen, setIsEditCurrModalOpen] = useState(false);
  const [editCurrForm, setEditCurrForm] = useState({ name: "" });

  const [showConfigMenu, setShowConfigMenu] = useState(false);

  const gradeLevelOptions = useMemo(
    () =>
      [...(setupData.year_levels ?? [])]
        .sort((a, b) => (b.level ?? 0) - (a.level ?? 0))
        .map((yl) => yl.name),
    [setupData.year_levels],
  );

  const kpiStats = useMemo(
    () => ({
      curricula: curriculums.length,
      courses: courses.length,
      subjects: subjects.length,
    }),
    [curriculums, courses, subjects],
  );

  const getCurriculumSubjectList = () => {
    if (!activeCurriculum) return [];
    const list: Array<{ code: string; name: string; units: number; yearLevel: string }> = [];
    activeCurriculum.subjects.forEach((group) => {
      group.subjectCodes.forEach((code) => {
        const found = subjects.find((s) => s.code === code);
        list.push({
          code,
          name: found ? found.name : "Unregistered Subject",
          units: found ? found.units : 0,
          yearLevel: group.yearLevel,
        });
      });
    });
    return list;
  };

  const currentCurriculumSubjects = getCurriculumSubjectList();

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleOpenCourseModal = (course: Course | null = null) => {
    if (course) {
      setEditingCourse(course);
      setCourseForm({ code: course.code, name: course.name, department: course.department, durationYears: course.durationYears });
    } else {
      setEditingCourse(null);
      setCourseForm({ code: "", name: "", department: "College", durationYears: 4 });
    }
    setIsCourseModalOpen(true);
  };

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseForm.code || !courseForm.name) return;
    if (editingCourse) { updateCourse(editingCourse.id, courseForm); } else { addCourse(courseForm); }
    setIsCourseModalOpen(false);
  };

  const handleDeleteCourse = async (id: string) => {
    if (await confirm("Are you sure you want to delete this course program? Any subjects associated with it might be unlinked.", { variant: "danger" })) {
      deleteCourse(id);
    }
  };

  const handleOpenSubjectModal = (sub: Subject | null = null) => {
    if (sub) {
      setEditingSubject(sub);
      setSubjectForm({ code: sub.code, name: sub.name, units: sub.units, department: sub.department, yearLevel: sub.yearLevel, semester: sub.semester, trackOrCourse: sub.trackOrCourse || "BSIT" });
    } else {
      setEditingSubject(null);
      setSubjectForm({ code: "", name: "", units: 3, department: "College", yearLevel: "1st Year", semester: "First Semester", trackOrCourse: "BSIT" });
    }
    setIsSubjectModalOpen(true);
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectForm.code || !subjectForm.name) return;
    if (editingSubject) { updateSubject(editingSubject.id, subjectForm); } else { addSubject(subjectForm); }
    setIsSubjectModalOpen(false);
  };

  const handleDeleteSubject = async (id: string) => {
    if (await confirm("Are you sure you want to remove this subject from the catalog?", { variant: "danger" })) {
      deleteSubject(id);
    }
  };

  const handleCreateCurriculum = (e: React.FormEvent) => {
    e.preventDefault();
    const courseObj = courses.find((c) => c.code === currForm.courseCode);
    const generatedName = currForm.customName || `${courseObj ? courseObj.name : currForm.courseCode} Curriculum SY ${currForm.schoolYear}`;
    addCurriculum({ courseCodeOrStrand: currForm.courseCode, name: generatedName, subjects: [] });
    setIsCurriculumModalOpen(false);
    toast(`${generatedName} created successfully.`, { variant: "success" });
  };

  const handleAddSubjectToCurriculum = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCurriculum || !selectedCatalogSubjectCode) return;
    const targetSubject = subjects.find((s) => s.code === selectedCatalogSubjectCode);
    if (!targetSubject) {
      addSubject({
        code: selectedCatalogSubjectCode,
        name: selectedCatalogSubjectCode.replace(/-/g, " "),
        units: currAddSubjectForm.unitsSelected,
        department: "Basic Education",
        yearLevel: currAddSubjectForm.gradeLevelSelected,
        semester: "Full Year",
        trackOrCourse: activeCurriculum.courseCodeOrStrand,
      });
    }
    const updatedSubjects = [...activeCurriculum.subjects];
    const groupIndex = updatedSubjects.findIndex((g) => g.yearLevel === currAddSubjectForm.gradeLevelSelected);
    if (groupIndex > -1) {
      if (!updatedSubjects[groupIndex].subjectCodes.includes(selectedCatalogSubjectCode)) {
        updatedSubjects[groupIndex].subjectCodes.push(selectedCatalogSubjectCode);
      }
    } else {
      updatedSubjects.push({ yearLevel: currAddSubjectForm.gradeLevelSelected, semester: "Full Year", subjectCodes: [selectedCatalogSubjectCode] });
    }
    updateCurriculum(activeCurriculum.id, { subjects: updatedSubjects });
    setIsAddSubjectToCurrModalOpen(false);
  };

  const handleRemoveSubjectFromCurriculum = (subjectCode: string, yearLevel: string) => {
    if (!activeCurriculum) return;
    const updatedSubjects = activeCurriculum.subjects
      .map((group) => {
        if (group.yearLevel === yearLevel) {
          return { ...group, subjectCodes: group.subjectCodes.filter((code) => code !== subjectCode) };
        }
        return group;
      })
      .filter((group) => group.subjectCodes.length > 0);
    updateCurriculum(activeCurriculum.id, { subjects: updatedSubjects });
  };

  const handleRenameActiveCurriculum = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCurriculum || !editCurrForm.name) return;
    updateCurriculum(activeCurriculum.id, { name: editCurrForm.name });
    setIsEditCurrModalOpen(false);
    setShowConfigMenu(false);
  };

  const handleDeleteActiveCurriculum = async () => {
    if (!activeCurriculum) return;
    if (await confirm(`Are you absolutely sure you want to delete "${activeCurriculum.name}"?`, { variant: "danger" })) {
      deleteCurriculum(activeCurriculum.id);
      setShowConfigMenu(false);
      const remaining = curriculums.filter((c) => c.id !== activeCurriculum.id);
      if (remaining.length > 0) setSelectedCurriculumId(remaining[0].id);
    }
  };

  // ── Table Column Definitions ───────────────────────────────────────────────

  const courseColumns: STSNColumn<Course>[] = [
    {
      title: "Course Code",
      data: "code",
      className: "font-mono font-bold text-stsn-brown",
      render: (value) => value,
    },
    {
      title: "Descriptive Title",
      data: "name",
      className: "text-stone-800 font-semibold",
      render: (value) => value,
    },
    {
      title: "Division",
      data: "department",
      className: "text-center",
      render: (value) => (
        <span className={`inline-block text-[10px] px-2 py-0.5 rounded font-bold ${
          value === "College" ? "bg-blue-50 text-blue-700" : "bg-orange-50 text-orange-700"
        }`}>
          {value as string}
        </span>
      ),
    },
    {
      title: "Duration",
      data: "durationYears",
      className: "text-center font-mono",
      render: (value) => `${value} Years`,
    },
    {
      title: "Settings",
      orderable: false,
      searchable: false,
      className: "text-right",
      render: (_value, course) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleOpenCourseModal(course)}
            className="text-stone-500 hover:text-stone-900 hover:bg-stone-50 px-2 py-1.5 border border-stsn-beige rounded-lg transition inline-flex items-center cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleDeleteCourse(course.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1.5 border border-red-200 rounded-lg transition inline-flex items-center cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const subjectColumns: STSNColumn<Subject>[] = [
    {
      title: "Subject Code",
      data: "code",
      className: "font-mono font-bold text-stsn-brown",
      render: (value) => value,
    },
    {
      title: "Subject Title",
      data: "name",
      className: "text-stone-800 font-semibold",
      render: (value) => value,
    },
    {
      title: "Units",
      data: "units",
      className: "text-center font-mono font-bold",
      render: (value) => `${value} Units`,
    },
    {
      title: "Semester",
      data: "semester",
      className: "text-center text-stone-600",
      render: (value) => value,
    },
    {
      title: "Division",
      data: "department",
      className: "text-center",
      render: (value) => (
        <span className={`inline-block text-[10px] px-2 py-0.5 rounded font-bold ${
          value === "College" ? "bg-purple-50 text-purple-700" : "bg-emerald-50 text-emerald-700"
        }`}>
          {value as string}
        </span>
      ),
    },
    {
      title: "Settings",
      orderable: false,
      searchable: false,
      className: "text-right",
      render: (_value, sub) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleOpenSubjectModal(sub)}
            className="text-stone-500 hover:text-stone-900 hover:bg-stone-50 px-2 py-1.5 border border-stsn-beige rounded-lg transition inline-flex items-center cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleDeleteSubject(sub.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1.5 border border-red-200 rounded-lg transition inline-flex items-center cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const filteredCoursesList = useMemo(
    () => courses.filter(
      (c) =>
        c.name.toLowerCase().includes(courseSearch.toLowerCase()) ||
        c.code.toLowerCase().includes(courseSearch.toLowerCase()),
    ),
    [courses, courseSearch],
  );

  const filteredSubjectsList = useMemo(
    () => subjects.filter(
      (s) =>
        s.name.toLowerCase().includes(subjectSearch.toLowerCase()) ||
        s.code.toLowerCase().includes(subjectSearch.toLowerCase()),
    ),
    [subjects, subjectSearch],
  );

  const openAddSubjectModal = () => {
    setSelectedCatalogSubjectCode(subjects[0]?.code || "");
    setCurrAddSubjectForm({ unitsSelected: 3, gradeLevelSelected: "Grade 4" });
    setIsAddSubjectToCurrModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">

      <ModulePageHeader
        badge="Academic Records"
        badgeIcon={BookMarked}
        title="Curriculum & Syllabus Registry"
        subtitle="Configure courses, subjects, and curricula. Changes propagate to student enrollees on the fly."
        actions={
          <div className="flex bg-white/10 p-1 rounded-xl border border-white/20">
            {(["courses", "curriculum", "subjects"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === tab ? "bg-[#C5A059] text-[#1C1512] shadow-sm" : "text-white/70 hover:text-white"
                }`}
              >
                {tab === "courses" ? "Courses" : tab === "curriculum" ? "Curriculum" : "Subjects"}
              </button>
            ))}
          </div>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AppKpiCard
          label="Registered Curricula"
          value={kpiStats.curricula}
          icon={BookMarked}
          tone="brand"
          hint="Total program curricula"
        />
        <AppKpiCard
          label="Course Programs"
          value={kpiStats.courses}
          icon={GraduationCap}
          tone="neutral"
          hint="Unique course codes"
        />
        <AppKpiCard
          label="Subject Catalog"
          value={kpiStats.subjects}
          icon={BookOpen}
          tone="info"
          hint="All catalogued subjects"
        />
      </div>

      {/* Curriculum Tab */}
      {activeTab === "curriculum" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">

          {/* Left: Curricula list */}
          <div className="lg:col-span-3 bg-white p-5 rounded-2xl border border-stsn-beige shadow-sm space-y-4">
            <button
              onClick={() => {
                setCurrForm({ courseCode: courses[0]?.code || "BSIT", schoolYear: "2026-2027", description: "", customName: "" });
                setIsCurriculumModalOpen(true);
              }}
              className="w-full bg-[#C5A059] text-white py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm hover:bg-[#C5A059]/90 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Curriculum
            </button>
            <div className="space-y-2">
              <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest pl-1 block">Curricula</span>
              <div className="space-y-1 max-h-[450px] overflow-y-auto">
                {curriculums.length === 0 ? (
                  <p className="text-[11px] text-stone-400 italic text-center py-6">No curricula yet. Create one above.</p>
                ) : (
                  curriculums.map((c) => {
                    const isSelected = selectedCurriculumId === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => { setSelectedCurriculumId(c.id); setShowConfigMenu(false); }}
                        className={`w-full text-left p-3.5 rounded-xl border text-xs font-semibold tracking-tight transition-all duration-150 cursor-pointer ${
                          isSelected
                            ? "bg-[#F5F2ED] border-stsn-beige text-[#4A3728] font-bold"
                            : "bg-white border-transparent text-stone-600 hover:bg-stone-50"
                        }`}
                      >
                        {c.name}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right: Active curriculum detail */}
          <div className="lg:col-span-9 bg-white rounded-2xl border border-stsn-beige shadow-sm flex flex-col overflow-hidden">
            <div className="p-6 border-b border-stsn-beige flex justify-between items-center bg-[#F9F8F5]">
              {activeCurriculum ? (
                <div>
                  <span className="text-[9px] uppercase tracking-widest text-[#A39184] font-bold block">Active Curriculum Target</span>
                  <h3 className="text-sm font-bold text-[#4A3728] uppercase tracking-wide mt-1">{activeCurriculum.name}</h3>
                </div>
              ) : (
                <span className="text-xs text-stone-400">Select or create a curriculum</span>
              )}
              {activeCurriculum && (
                <div className="relative">
                  <button
                    onClick={() => setShowConfigMenu(!showConfigMenu)}
                    className="p-2 text-stone-500 hover:text-[#4A3728] border border-stsn-beige bg-white rounded-xl shadow-sm transition cursor-pointer"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  {showConfigMenu && (
                    <div className="absolute right-0 mt-2 bg-white border border-stsn-beige rounded-xl shadow-xl py-1.5 w-48 z-10 text-xs">
                      <button
                        onClick={() => { setEditCurrForm({ name: activeCurriculum.name }); setIsEditCurrModalOpen(true); }}
                        className="w-full text-left py-2 px-3 text-stone-700 hover:bg-[#F5F2ED] font-semibold transition cursor-pointer"
                      >
                        Rename Curriculum
                      </button>
                      <button
                        onClick={handleDeleteActiveCurriculum}
                        className="w-full text-left py-2 px-3 text-red-600 hover:bg-red-50 font-bold transition border-t border-stone-100 cursor-pointer"
                      >
                        Delete Curriculum
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-[#4A3728] font-bold text-sm tracking-tight flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-stsn-gold" />
                  Subjects List
                </h4>
                {activeCurriculum && (
                  <button
                    onClick={openAddSubjectModal}
                    className="bg-[#4A3728] hover:bg-[#634935] text-[#FFFDF5] text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition shadow-sm flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add Subject
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-x-auto">
                {currentCurriculumSubjects.length === 0 ? (
                  <EmptyState
                    icon={Layers}
                    title="No Subjects Assigned"
                    description="There are no subjects assigned to this curriculum yet. Click '+ Add Subject' to build the academic track structure."
                    compact
                    primaryAction={
                      activeCurriculum
                        ? { label: "+ Add Subject", onClick: openAddSubjectModal }
                        : undefined
                    }
                  />
                ) : (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#F9F8F5] border-b border-stsn-beige text-[10px] text-[#A39184] uppercase tracking-wider font-bold">
                        <th className="px-6 py-3">Code</th>
                        <th className="px-6 py-3">Subject</th>
                        <th className="px-6 py-3 text-center">Units</th>
                        <th className="px-6 py-3 text-center">Year Level</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F5F2ED] text-stone-700 font-semibold">
                      {currentCurriculumSubjects.map((sub, idx) => (
                        <tr key={`${sub.code}-${sub.yearLevel}-${idx}`} className="hover:bg-[#FFFDF5]/70">
                          <td className="px-6 py-4 font-mono font-bold text-[#4A3728]">{sub.code}</td>
                          <td className="px-6 py-4 text-[#2D241E]">{sub.name}</td>
                          <td className="px-6 py-4 text-center font-mono">{sub.units}</td>
                          <td className="px-6 py-4 text-center">{sub.yearLevel}</td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleRemoveSubjectFromCurriculum(sub.code, sub.yearLevel)}
                              className="text-red-600 hover:text-red-700 p-1 rounded-md hover:bg-red-50 inline-flex items-center transition cursor-pointer"
                              title="Remove subject from this curriculum"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Courses Tab */}
      {activeTab === "courses" && (
        <DataTableCard
          title="Course Programs"
          icon={GraduationCap}
          searchValue={courseSearch}
          onSearchChange={setCourseSearch}
          searchPlaceholder="Search registered courses…"
          actions={
            <button
              onClick={() => handleOpenCourseModal(null)}
              className="bg-[#C5A059] hover:bg-[#C5A059]/90 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm inline-flex items-center gap-1 cursor-pointer transition flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add Course Program
            </button>
          }
        >
          <STSNDataTable<Course>
            columns={courseColumns}
            rows={filteredCoursesList}
            searchable={false}
            emptyMessage="No courses found. Add a course program to get started."
          />
        </DataTableCard>
      )}

      {/* Subjects Tab */}
      {activeTab === "subjects" && (
        <DataTableCard
          title="Subject Catalog"
          icon={BookOpen}
          searchValue={subjectSearch}
          onSearchChange={setSubjectSearch}
          searchPlaceholder="Search registered subjects catalog…"
          actions={
            <button
              onClick={() => handleOpenSubjectModal(null)}
              className="bg-[#C5A059] hover:bg-[#C5A059]/90 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm inline-flex items-center gap-1 cursor-pointer transition flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              New Subject Catalog
            </button>
          }
        >
          <STSNDataTable<Subject>
            columns={subjectColumns}
            rows={filteredSubjectsList}
            searchable={false}
            emptyMessage="No subjects found in the catalog."
          />
        </DataTableCard>
      )}

      {/* ── Modals ─────────────────────────────────────────────────────────── */}

      {/* New Curriculum */}
      <AppModal
        open={isCurriculumModalOpen}
        title="New Curriculum"
        eyebrow="Create Program"
        icon={BookMarked}
        onClose={() => setIsCurriculumModalOpen(false)}
        panelAs="form"
        onSubmit={handleCreateCurriculum}
        footer={
          <div className="flex gap-3">
            <button type="submit" className="flex-1 bg-stsn-brown hover:bg-stsn-brown-dark text-white py-2.5 rounded-xl font-bold text-xs transition cursor-pointer">
              Create Curriculum
            </button>
            <button type="button" onClick={() => setIsCurriculumModalOpen(false)} className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer">
              Cancel
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-xs font-semibold">
          <p className="text-[10px] text-stone-400 leading-relaxed">
            Select a course and school year. The curriculum name will be generated automatically unless overridden.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Course</label>
              <select
                value={currForm.courseCode}
                onChange={(e) => setCurrForm({ ...currForm, courseCode: e.target.value })}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5"
              >
                {courses.map((co) => (
                  <option key={co.id} value={co.code}>{co.code} — {co.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">School Year</label>
              <select
                value={currForm.schoolYear}
                onChange={(e) => setCurrForm({ ...currForm, schoolYear: e.target.value })}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5"
              >
                <option value="2026-2027">2026-2027</option>
                <option value="2027-2028">2027-2028</option>
                <option value="2028-2029">2028-2029</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Description</label>
            <input
              type="text"
              placeholder="Optional brief outline..."
              value={currForm.description}
              onChange={(e) => setCurrForm({ ...currForm, description: e.target.value })}
              className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Custom Name Override</label>
            <input
              type="text"
              placeholder="e.g. Preschool Curriculum SY 2026-2027"
              value={currForm.customName}
              onChange={(e) => setCurrForm({ ...currForm, customName: e.target.value })}
              className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5"
            />
          </div>
        </div>
      </AppModal>

      {/* Rename Curriculum */}
      <AppModal
        open={isEditCurrModalOpen}
        title="Rename Curriculum"
        onClose={() => setIsEditCurrModalOpen(false)}
        panelAs="form"
        onSubmit={handleRenameActiveCurriculum}
        maxWidthClass="max-w-sm"
        footer={
          <div className="flex gap-2">
            <button type="submit" className="flex-1 bg-stsn-brown hover:bg-stsn-brown-dark text-white py-2 rounded-lg font-bold text-xs cursor-pointer transition">
              Save Changes
            </button>
            <button type="button" onClick={() => setIsEditCurrModalOpen(false)} className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 py-2 rounded-lg font-bold text-xs cursor-pointer transition">
              Cancel
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-xs font-semibold">
          <div>
            <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Curriculum Name</label>
            <input
              type="text"
              value={editCurrForm.name}
              onChange={(e) => setEditCurrForm({ name: e.target.value })}
              className="w-full p-2.5 border border-stone-200 rounded-xl"
              required
            />
          </div>
        </div>
      </AppModal>

      {/* Add Subject to Curriculum */}
      <AppModal
        open={isAddSubjectToCurrModalOpen}
        title="Add Subject to Curriculum"
        eyebrow="Curriculum Builder"
        icon={BookOpen}
        onClose={() => setIsAddSubjectToCurrModalOpen(false)}
        panelAs="form"
        onSubmit={handleAddSubjectToCurriculum}
        footer={
          <div className="flex gap-3">
            <button type="submit" className="flex-1 bg-stsn-brown hover:bg-stsn-brown-dark text-white py-2.5 rounded-xl font-bold text-xs transition cursor-pointer">
              Add Subject
            </button>
            <button type="button" onClick={() => setIsAddSubjectToCurrModalOpen(false)} className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer">
              Cancel
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-xs font-semibold">
          <p className="text-[10px] text-stone-400">Please complete the subject information below.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Subject</label>
              <select
                value={selectedCatalogSubjectCode}
                onChange={(e) => setSelectedCatalogSubjectCode(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5"
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.code}>{sub.code} — {sub.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Units</label>
              <input
                type="number"
                min="0"
                max="6"
                value={currAddSubjectForm.unitsSelected}
                onChange={(e) => setCurrAddSubjectForm({ ...currAddSubjectForm, unitsSelected: parseInt(e.target.value) || 0 })}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 font-mono"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">Grade Level</label>
            <select
              value={currAddSubjectForm.gradeLevelSelected}
              onChange={(e) => setCurrAddSubjectForm({ ...currAddSubjectForm, gradeLevelSelected: e.target.value })}
              className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 font-semibold"
            >
              <option value="">Select Grade Level</option>
              {gradeLevelOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>
      </AppModal>

      {/* Course Program Modal */}
      <AppModal
        open={isCourseModalOpen}
        title={editingCourse ? "Edit Course Program" : "Add Course Program"}
        icon={GraduationCap}
        onClose={() => setIsCourseModalOpen(false)}
        panelAs="form"
        onSubmit={handleSaveCourse}
        maxWidthClass="max-w-md"
        footer={
          <div className="flex gap-2">
            <button type="submit" className="flex-1 bg-stsn-brown hover:bg-stsn-brown-dark text-white py-2 rounded-lg font-bold text-xs transition cursor-pointer">
              Save Program
            </button>
            <button type="button" onClick={() => setIsCourseModalOpen(false)} className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 py-2 rounded-lg font-bold text-xs transition cursor-pointer">
              Cancel
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-xs font-semibold">
          <div>
            <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Course Code</label>
            <input
              type="text"
              placeholder="e.g. BSIT, STEM, BSHM"
              value={courseForm.code}
              onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value.toUpperCase() })}
              className="w-full p-2.5 border border-stone-200 rounded-xl uppercase font-mono font-bold"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Course Description Title</label>
            <input
              type="text"
              placeholder="e.g. Bachelor of Science in Information Technology"
              value={courseForm.name}
              onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
              className="w-full p-2.5 border border-stone-200 rounded-xl"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Department</label>
              <select
                value={courseForm.department}
                onChange={(e) => setCourseForm({ ...courseForm, department: e.target.value as "College" | "Basic Education" })}
                className="w-full p-2.5 border border-stone-200 rounded-xl"
              >
                <option value="College">College</option>
                <option value="Basic Education">Basic Education (K-12)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Duration (Years)</label>
              <input
                type="number"
                min="1"
                max="6"
                value={courseForm.durationYears}
                onChange={(e) => setCourseForm({ ...courseForm, durationYears: parseInt(e.target.value) || 2 })}
                className="w-full p-2.5 border border-stone-200 rounded-xl font-mono"
                required
              />
            </div>
          </div>
        </div>
      </AppModal>

      {/* Subject Catalog Modal */}
      <AppModal
        open={isSubjectModalOpen}
        title={editingSubject ? "Edit Subject Registry" : "Add Subject to Catalog"}
        icon={BookOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        panelAs="form"
        onSubmit={handleSaveSubject}
        maxWidthClass="max-w-md"
        footer={
          <div className="flex gap-2">
            <button type="submit" className="flex-1 bg-stsn-brown text-white py-2 rounded-lg font-bold text-xs transition cursor-pointer hover:bg-stsn-brown-dark">
              Save Subject
            </button>
            <button type="button" onClick={() => setIsSubjectModalOpen(false)} className="flex-1 bg-stone-100 text-stone-700 py-2 rounded-lg font-bold text-xs transition cursor-pointer hover:bg-stone-200">
              Cancel
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-xs font-semibold">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Subject Code</label>
              <input
                type="text"
                placeholder="e.g. IT101, BED-MATH"
                value={subjectForm.code}
                onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })}
                className="w-full p-2.5 border border-stone-200 rounded-xl font-mono uppercase font-bold"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Units Credits</label>
              <input
                type="number"
                min="0"
                max="6"
                value={subjectForm.units}
                onChange={(e) => setSubjectForm({ ...subjectForm, units: parseInt(e.target.value) || 0 })}
                className="w-full p-2.5 border border-stone-200 rounded-xl font-mono font-bold"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Subject Descriptive Title</label>
            <input
              type="text"
              placeholder="e.g. Computer Programming 1"
              value={subjectForm.name}
              onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
              className="w-full p-2.5 border border-stone-200 rounded-xl"
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Department</label>
              <select
                value={subjectForm.department}
                onChange={(e) => setSubjectForm({ ...subjectForm, department: e.target.value as "College" | "Basic Education" })}
                className="w-full p-2 border border-stone-200 rounded-lg"
              >
                <option value="College">College</option>
                <option value="Basic Education">K12 Basic Ed</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Semester</label>
              <select
                value={subjectForm.semester}
                onChange={(e) => setSubjectForm({ ...subjectForm, semester: e.target.value as "First Semester" | "Second Semester" | "Full Year" })}
                className="w-full p-2 border border-stone-200 rounded-lg text-[11px]"
              >
                <option value="First Semester">First Sem</option>
                <option value="Second Semester">Second Sem</option>
                <option value="Full Year">Full Year</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Year Level</label>
              <select
                value={subjectForm.yearLevel}
                onChange={(e) => setSubjectForm({ ...subjectForm, yearLevel: e.target.value })}
                className="w-full p-2 border border-stone-200 rounded-lg text-[11px]"
              >
                {gradeLevelOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </AppModal>

    </div>
  );
}

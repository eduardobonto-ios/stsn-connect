/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useSTSNStore } from "../../../services/store";
import { useAppDialog } from "../../../components/common/useAppDialog";
import { Course, Subject, Curriculum } from "../../../types";
import { 
  BookOpen, 
  Award, 
  Plus, 
  Trash2, 
  Edit, 
  Settings, 
  Search, 
  Building, 
  Check, 
  X, 
  Sparkles, 
  BookMarked,
  Layers,
  GraduationCap
} from "lucide-react";

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
    setupData
  } = useSTSNStore();
  const { toast, confirm } = useAppDialog();

  // Nested Tab State
  const [activeTab, setActiveTab] = useState<"courses" | "curriculum" | "subjects">("curriculum");

  // Selected Curriculum for the Curriculum tab (matches layout in screenshot 1 and 2)
  const [selectedCurriculumId, setSelectedCurriculumId] = useState<string>("curr-elementary");
  const activeCurriculum = curriculums.find((c) => c.id === selectedCurriculumId) || curriculums[0];

  // Serach Queries
  const [courseSearch, setCourseSearch] = useState("");
  const [subjectSearch, setSubjectSearch] = useState("");

  // Modals Toggles & Dynamic Form Data
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseForm, setCourseForm] = useState({
    code: "",
    name: "",
    department: "College" as "College" | "Basic Education",
    durationYears: 4
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
    trackOrCourse: "BSIT"
  });

  const [isCurriculumModalOpen, setIsCurriculumModalOpen] = useState(false);
  const [currForm, setCurrForm] = useState({
    courseCode: "BSIT",
    schoolYear: "2026-2027",
    description: "",
    customName: ""
  });

  const [isAddSubjectToCurrModalOpen, setIsAddSubjectToCurrModalOpen] = useState(false);
  const [selectedCatalogSubjectCode, setSelectedCatalogSubjectCode] = useState("");
  const [currAddSubjectForm, setCurrAddSubjectForm] = useState({
    unitsSelected: 3,
    gradeLevelSelected: "Grade 4"
  });

  const [isEditCurrModalOpen, setIsEditCurrModalOpen] = useState(false);
  const [editCurrForm, setEditCurrForm] = useState({
    name: ""
  });

  const [showConfigMenu, setShowConfigMenu] = useState(false);

  // GRADE LEVEL OPTIONS FOR SUBJECTS & CURRICULA — sourced from setup_items.year_levels (Supabase), descending
  const gradeLevelOptions = [...(setupData.year_levels ?? [])]
    .sort((a, b) => (b.level ?? 0) - (a.level ?? 0))
    .map((yl) => yl.name);

  // Helper to extract subjects assigned to the current active curriculum
  const getCurriculumSubjectList = () => {
    if (!activeCurriculum) return [];
    
    const list: Array<{ code: string; name: string; units: number; yearLevel: string }> = [];
    
    activeCurriculum.subjects.forEach((group) => {
      group.subjectCodes.forEach((code) => {
        const foundGlobally = subjects.find((s) => s.code === code);
        list.push({
          code,
          name: foundGlobally ? foundGlobally.name : "Unregistered Subject",
          units: foundGlobally ? foundGlobally.units : 0,
          yearLevel: group.yearLevel
        });
      });
    });
    
    return list;
  };

  const currentCurriculumSubjects = getCurriculumSubjectList();

  // --- ACTIONS ---

  // COURSES HANDLERS
  const handleOpenCourseModal = (course: Course | null = null) => {
    if (course) {
      setEditingCourse(course);
      setCourseForm({
        code: course.code,
        name: course.name,
        department: course.department,
        durationYears: course.durationYears
      });
    } else {
      setEditingCourse(null);
      setCourseForm({
        code: "",
        name: "",
        department: "College",
        durationYears: 4
      });
    }
    setIsCourseModalOpen(true);
  };

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseForm.code || !courseForm.name) return;

    if (editingCourse) {
      updateCourse(editingCourse.id, courseForm);
    } else {
      addCourse(courseForm);
    }
    setIsCourseModalOpen(false);
  };

  const handleDeleteCourse = async (id: string) => {
    if (await confirm("Are you sure you want to delete this course program? Any subjects associated with it might be unlinked.", { variant: "danger" })) {
      deleteCourse(id);
    }
  };

  // SUBJECTS HANDLERS
  const handleOpenSubjectModal = (sub: Subject | null = null) => {
    if (sub) {
      setEditingSubject(sub);
      setSubjectForm({
        code: sub.code,
        name: sub.name,
        units: sub.units,
        department: sub.department,
        yearLevel: sub.yearLevel,
        semester: sub.semester,
        trackOrCourse: sub.trackOrCourse || "BSIT"
      });
    } else {
      setEditingSubject(null);
      setSubjectForm({
        code: "",
        name: "",
        units: 3,
        department: "College",
        yearLevel: "1st Year",
        semester: "First Semester",
        trackOrCourse: "BSIT"
      });
    }
    setIsSubjectModalOpen(true);
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectForm.code || !subjectForm.name) return;

    if (editingSubject) {
      updateSubject(editingSubject.id, subjectForm);
    } else {
      addSubject(subjectForm);
    }
    setIsSubjectModalOpen(false);
  };

  const handleDeleteSubject = async (id: string) => {
    if (await confirm("Are you sure you want to remove this subject from the catalog?", { variant: "danger" })) {
      deleteSubject(id);
    }
  };

  // CURRICULUM SETUP HANDLERS
  const handleCreateCurriculum = (e: React.FormEvent) => {
    e.preventDefault();
    const courseObj = courses.find((c) => c.code === currForm.courseCode);
    
    // Automatically generate curriculum name if not specified
    const generatedName = currForm.customName || 
      `${courseObj ? courseObj.name : currForm.courseCode} Curriculum SY ${currForm.schoolYear}`;

    const newCurriculum = {
      courseCodeOrStrand: currForm.courseCode,
      name: generatedName,
      subjects: []
    };

    addCurriculum(newCurriculum);
    setIsCurriculumModalOpen(false);
    
    // Prompt toast/indicator
    toast(`Success: ${generatedName} created!`, { variant: "success" });
  };

  const handleAddSubjectToCurriculum = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCurriculum || !selectedCatalogSubjectCode) return;

    // Check if the subject has a matching record in catalog, if not create one
    let targetSubject = subjects.find(s => s.code === selectedCatalogSubjectCode);
    if (!targetSubject) {
      // Create dynamically so it matches catalog list
      addSubject({
        code: selectedCatalogSubjectCode,
        name: selectedCatalogSubjectCode.replace(/-/g, " "),
        units: currAddSubjectForm.unitsSelected,
        department: "Basic Education",
        yearLevel: currAddSubjectForm.gradeLevelSelected,
        semester: "Full Year",
        trackOrCourse: activeCurriculum.courseCodeOrStrand
      });
    }

    // Clone and edit curriculum structure
    const updatedSubjects = [...activeCurriculum.subjects];
    const groupIndex = updatedSubjects.findIndex(
      (g) => g.yearLevel === currAddSubjectForm.gradeLevelSelected
    );

    if (groupIndex > -1) {
      // Append if not already existing
      if (!updatedSubjects[groupIndex].subjectCodes.includes(selectedCatalogSubjectCode)) {
        updatedSubjects[groupIndex].subjectCodes.push(selectedCatalogSubjectCode);
      }
    } else {
      // Create new year group block
      updatedSubjects.push({
        yearLevel: currAddSubjectForm.gradeLevelSelected,
        semester: "Full Year",
        subjectCodes: [selectedCatalogSubjectCode]
      });
    }

    updateCurriculum(activeCurriculum.id, {
      subjects: updatedSubjects
    });

    setIsAddSubjectToCurrModalOpen(false);
  };

  const handleRemoveSubjectFromCurriculum = (subjectCode: string, yearLevel: string) => {
    if (!activeCurriculum) return;
    
    const updatedSubjects = activeCurriculum.subjects.map((group) => {
      if (group.yearLevel === yearLevel) {
        return {
          ...group,
          subjectCodes: group.subjectCodes.filter((code) => code !== subjectCode)
        };
      }
      return group;
    }).filter(group => group.subjectCodes.length > 0); // drop empty groups

    updateCurriculum(activeCurriculum.id, {
      subjects: updatedSubjects
    });
  };

  const handleRenameActiveCurriculum = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCurriculum || !editCurrForm.name) return;

    updateCurriculum(activeCurriculum.id, {
      name: editCurrForm.name
    });
    setIsEditCurrModalOpen(false);
    setShowConfigMenu(false);
  };

  const handleDeleteActiveCurriculum = async () => {
    if (!activeCurriculum) return;
    if (await confirm(`Are you absolutely sure you want to delete "${activeCurriculum.name}"?`, { variant: "danger" })) {
      deleteCurriculum(activeCurriculum.id);
      setShowConfigMenu(false);
      // Select another one available
      const remaining = curriculums.filter(c => c.id !== activeCurriculum.id);
      if (remaining.length > 0) {
        setSelectedCurriculumId(remaining[0].id);
      }
    }
  };


  // Filtering listings
  const filteredCoursesList = courses.filter(
    (c) =>
      c.name.toLowerCase().includes(courseSearch.toLowerCase()) ||
      c.code.toLowerCase().includes(courseSearch.toLowerCase())
  );

  const filteredSubjectsList = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(subjectSearch.toLowerCase()) ||
      s.code.toLowerCase().includes(subjectSearch.toLowerCase())
  );


  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* 1. Header Information Banner (Matches Sleek Theme Aesthetic) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-white border border-stsn-beige rounded-2xl shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-display font-bold text-stsn-brown flex items-center gap-2">
            <BookMarked className="w-5.5 h-5.5 text-stsn-gold" />
            Curriculum & Syllabus Setup Registry
          </h2>
          <p className="text-stone-500 text-xs mt-1">
            Configure Academic Courses, Semestral Subjects lists and Class Curricula parameters. Changes propagate to student enrollees on the fly.
          </p>
        </div>

        {/* Dynamic Nav Selection */}
        <div className="flex bg-[#F5F2ED] p-1.5 rounded-xl border border-stsn-beige">
          <button
            onClick={() => setActiveTab("courses")}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === "courses" ? "bg-stsn-brown text-white shadow-sm" : "text-stone-500 hover:text-stone-800"
            }`}
          >
            Courses Setup
          </button>
          <button
            onClick={() => setActiveTab("curriculum")}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === "curriculum" ? "bg-stsn-brown text-white shadow-sm" : "text-stone-500 hover:text-stone-800"
            }`}
          >
            Curriculum Registry
          </button>
          <button
            onClick={() => setActiveTab("subjects")}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === "subjects" ? "bg-stsn-brown text-white shadow-sm" : "text-stone-500 hover:text-stone-800"
            }`}
          >
            Subjects Registry
          </button>
        </div>
      </div>

      {/* 2. CURRICULUM TAB (Displays exactly as screenshots 1 & 2) */}
      {activeTab === "curriculum" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
            
            {/* Left Column Curriculums pane */}
            <div className="lg:col-span-3 bg-white p-5 rounded-2xl border border-stsn-beige shadow-sm space-y-4">
              <button
                onClick={() => {
                  setCurrForm({
                    courseCode: courses[0]?.code || "BSIT",
                    schoolYear: "2026-2027",
                    description: "",
                    customName: ""
                  });
                  setIsCurriculumModalOpen(true);
                }}
                className="w-full bg-[#C5A059] text-white py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm hover:bg-[#C5A059]/90 transition-all"
              >
                <Plus className="w-4 h-4" />
                New Curriculum
              </button>

              <div className="space-y-2">
                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest pl-1 block">Curricula</span>
                <div className="space-y-1 max-h-[450px] overflow-y-auto">
                  {curriculums.map((c) => {
                    const isSelected = selectedCurriculumId === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedCurriculumId(c.id);
                          setShowConfigMenu(false);
                        }}
                        className={`w-full text-left p-3.5 rounded-xl border text-xs font-semibold tracking-tight transition-all duration-150 ${
                          isSelected
                            ? "bg-[#F5F2ED] border-stsn-beige text-[#4A3728] font-bold"
                            : "bg-white border-transparent text-stone-600 hover:bg-stone-50"
                        }`}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Active selected Curriculum details and Table */}
            <div className="lg:col-span-9 bg-white rounded-2xl border border-stsn-beige shadow-sm flex flex-col overflow-hidden">
              
              {/* Header Box with custom cog config */}
              <div className="p-6 border-b border-stsn-beige flex justify-between items-center bg-[#F9F8F5]">
                {activeCurriculum ? (
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-[#A39184] font-bold block">Active Curriculum Target</span>
                    <h3 className="text-sm font-bold text-[#4A3728] uppercase tracking-wide mt-1">
                      {activeCurriculum.name}
                    </h3>
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
                          onClick={() => {
                            setEditCurrForm({ name: activeCurriculum.name });
                            setIsEditCurrModalOpen(true);
                          }}
                          className="w-full text-left py-2 px-3 text-stone-700 hover:bg-[#F5F2ED] font-semibold transition"
                        >
                          Rename CurriculumName
                        </button>
                        <button
                          onClick={handleDeleteActiveCurriculum}
                          className="w-full text-left py-2 px-3 text-red-650 hover:bg-red-50 font-bold transition border-t border-stone-100"
                        >
                          Delete Curriculum
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Main table content representing subjects assigned to curriculum */}
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-[#4A3728] font-bold text-sm tracking-tight flex items-center gap-1.5">
                    <BookOpen className="w-4.5 h-4.5 text-stsn-gold" />
                    Subjects List
                  </h4>

                  {activeCurriculum && (
                    <button
                      onClick={() => {
                        // Standard preselection catalog
                        setSelectedCatalogSubjectCode(subjects[0]?.code || "");
                        setCurrAddSubjectForm({
                          unitsSelected: 3,
                          gradeLevelSelected: "Grade 4"
                        });
                        setIsAddSubjectToCurrModalOpen(true);
                      }}
                      className="bg-[#4A3728] hover:bg-[#634935] text-[#FFFDF5] text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition shadow-sm flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Add Subject
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-x-auto">
                  {currentCurriculumSubjects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center text-stone-400">
                      <Layers className="w-10 h-10 text-stone-300 mb-2" />
                      <p className="text-xs font-semibold italic">There are no subjects assigned to this curriculum registry.</p>
                      <p className="text-[10px] text-stone-400 mt-1">Click "+ Add Subject" to customize academic tracks structure.</p>
                    </div>
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
                                className="text-red-650 hover:text-red-700 p-1 rounded-md hover:bg-red-50 inline-flex items-center transition"
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
        </div>
      )}

      {/* 3. COURSES SUB-PAGE TAB */}
      {activeTab === "courses" && (
        <div className="bg-white p-6 rounded-2xl border border-stsn-beige shadow-sm space-y-4">
          
          {/* Header & Controller */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative w-full max-w-sm">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search registered courses..."
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                className="w-full bg-[#F5F2ED] text-xs py-2.5 pl-9 pr-4 rounded-xl border border-transparent focus:border-stsn-gold focus:bg-white outline-none font-medium transition"
              />
            </div>

            <button
              onClick={() => handleOpenCourseModal(null)}
              className="bg-[#C5A059] hover:bg-[#C5A059]/90 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm inline-flex items-center gap-1 cursor-pointer transition ml-auto"
            >
              <Plus className="w-4.5 h-4.5" />
              Add Course Program
            </button>
          </div>

          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F9F8F5] text-[10px] text-[#A39184] uppercase tracking-wider font-bold border-b border-stsn-beige">
                  <th className="px-6 py-3">Course Code</th>
                  <th className="px-6 py-3">Descriptive Title</th>
                  <th className="px-6 py-3 text-center">Division Department</th>
                  <th className="px-6 py-3 text-center">Duration</th>
                  <th className="px-6 py-3 text-right">Settings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F2ED] font-semibold text-stone-850">
                {filteredCoursesList.map((c) => (
                  <tr key={c.id} className="hover:bg-stsn-cream/30">
                    <td className="px-6 py-4 font-mono font-bold text-stsn-brown">{c.code}</td>
                    <td className="px-6 py-4 text-stone-800">{c.name}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block text-[10px] px-2 py-0.5 rounded ${
                        c.department === "College" ? "bg-blue-50 text-blue-700 font-bold" : "bg-orange-50 text-orange-700 font-bold"
                      }`}>
                        {c.department}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-mono">{c.durationYears} Years</td>
                    <td className="px-6 py-4 text-right space-x-1.5">
                      <button
                        onClick={() => handleOpenCourseModal(c)}
                        className="text-stone-500 hover:text-stone-900 hover:bg-stone-50 px-2 py-1.5 border border-stsn-beige rounded-lg transition inline-flex items-center"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(c.id)}
                        className="text-red-650 hover:text-red-700 hover:bg-red-50 px-2 py-1.5 border border-red-200 rounded-lg transition inline-flex items-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. SUBJECTS SUB-PAGE CATALOG */}
      {activeTab === "subjects" && (
        <div className="bg-white p-6 rounded-2xl border border-stsn-beige shadow-sm space-y-4">
          
          {/* Controls bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative w-full max-w-sm">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search registered subjects Catalog..."
                value={subjectSearch}
                onChange={(e) => setSubjectSearch(e.target.value)}
                className="w-full bg-[#F5F2ED] text-xs py-2.5 pl-9 pr-4 rounded-xl border border-transparent focus:border-stsn-gold focus:bg-white outline-none font-medium transition"
              />
            </div>

            <button
              onClick={() => handleOpenSubjectModal(null)}
              className="bg-[#C5A059] hover:bg-[#C5A059]/90 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm inline-flex items-center gap-1 cursor-pointer transition ml-auto"
            >
              <Plus className="w-4.5 h-4.5" />
              New Subject Catalog
            </button>
          </div>

          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F9F8F5] text-[10px] text-[#A39184] uppercase tracking-wider font-bold border-b border-stsn-beige">
                  <th className="px-6 py-3">Subject Code</th>
                  <th className="px-6 py-3">Subject Title</th>
                  <th className="px-6 py-3 text-center">Units Credits</th>
                  <th className="px-6 py-3 text-center">Default Semester</th>
                  <th className="px-6 py-3 text-center">Division</th>
                  <th className="px-6 py-3 text-right">Settings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F2ED] font-semibold text-stone-850">
                {filteredSubjectsList.map((sub) => (
                  <tr key={sub.id} className="hover:bg-stsn-cream/30">
                    <td className="px-6 py-4 font-mono font-bold text-stsn-brown">{sub.code}</td>
                    <td className="px-6 py-4 text-stone-800">{sub.name}</td>
                    <td className="px-6 py-4 text-center font-mono font-bold">{sub.units} Units</td>
                    <td className="px-6 py-4 text-center font-mono">{sub.semester}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block text-[10px] px-2 rounded ${
                        sub.department === "College" ? "bg-purple-50 text-purple-700" : "bg-emerald-50 text-emerald-700"
                      }`}>
                        {sub.department}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-1.5">
                      <button
                        onClick={() => handleOpenSubjectModal(sub)}
                        className="text-stone-500 hover:text-stone-900 hover:bg-stone-50 px-2 py-1.5 border border-stsn-beige rounded-lg transition inline-flex items-center"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSubject(sub.id)}
                        className="text-red-650 hover:text-red-700 hover:bg-red-50 px-2 py-1.5 border border-red-200 rounded-lg transition inline-flex items-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* --- ALL POPUP MODALS CORNER (SYMMETRICAL SLATE DESIGN) --- */}

      {/* 1. NEW CURRICULUM MODAL (MATCHING SCREENSHOTS 2 & 3) */}
      {isCurriculumModalOpen && (
        <div className="app-modal-backdrop z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-lg p-7 animate-fade-in text-stone-800">
            
            <div className="flex flex-col items-center mb-6">
              <h3 className="text-lg font-bold font-display text-[#4A3728] tracking-tight">New Curriculum</h3>
              <div className="mt-2.5 p-3 rounded-full bg-stsn-cream text-stsn-gold border border-stsn-beige">
                <Edit className="w-5 h-5 text-[#C5A059]" />
              </div>
              <p className="text-[10px] text-stone-400 mt-2 text-center max-w-[340px] leading-relaxed">
                Select course and school year. The curriculum name will be generated automatically.
              </p>
            </div>

            <form onSubmit={handleCreateCurriculum} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Course</label>
                  <select
                    value={currForm.courseCode}
                    onChange={(e) => setCurrForm({ ...currForm, courseCode: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5"
                  >
                    {courses.map((co) => (
                      <option key={co.id} value={co.code}>
                        {co.code} - {co.name}
                      </option>
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
                  onChange={(e) => setCurrForm({...currForm, description: e.target.value})}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Custom Name Override</label>
                <input
                  type="text"
                  placeholder="e.g. Preschool Curriculum SY 2026-2027"
                  value={currForm.customName}
                  onChange={(e) => setCurrForm({...currForm, customName: e.target.value})}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-stone-100">
                <button
                  type="submit"
                  className="flex-1 bg-[#4D2F1B] hover:bg-[#603D26] text-white py-2.5 rounded-xl font-bold transition"
                >
                  Create Curriculum
                </button>
                <button
                  type="button"
                  onClick={() => setIsCurriculumModalOpen(false)}
                  className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 py-2.5 rounded-xl font-bold transition"
                >
                  Cancel
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* 2. RENAME ACTIVE CURRICULUM MODAL */}
      {isEditCurrModalOpen && (
        <div className="app-modal-backdrop z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-sm p-6 animate-fade-in text-stone-800">
            <h3 className="text-sm font-bold font-display text-[#4A3728] pb-1 border-b mb-3">Rename Curriculum</h3>
            
            <form onSubmit={handleRenameActiveCurriculum} className="space-y-4 text-xs font-semibold">
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

              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-[#4A3728] text-white py-2 rounded-lg font-bold">
                  Save Changes
                </button>
                <button type="button" onClick={() => setIsEditCurrModalOpen(false)} className="flex-1 bg-stone-100 py-2 rounded-lg font-bold">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. ADD SUBJECT TO SELECTED CURRICULUM MODAL (MATCHING SCREENSHOT 1 EXACTLY!) */}
      {isAddSubjectToCurrModalOpen && (
        <div className="app-modal-backdrop z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-lg p-7 animate-fade-in text-stone-800">
            
            <div className="flex flex-col items-center mb-5">
              <h3 className="text-lg font-bold font-display text-[#4A3728] tracking-tight">Add Subject</h3>
              <div className="mt-2.5 p-3 rounded-full bg-[#FCF8EE] text-stsn-gold border border-stsn-beige">
                <Edit className="w-5 h-5 text-[#C5A059]" />
              </div>
              <p className="text-[10px] text-stone-400 mt-2 text-center font-semibold">
                Please complete the subject information below.
              </p>
            </div>

            <form onSubmit={handleAddSubjectToCurriculum} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Subject</label>
                  <select
                    value={selectedCatalogSubjectCode}
                    onChange={(e) => setSelectedCatalogSubjectCode(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5"
                  >
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.code}>
                        {sub.code} - {sub.name}
                      </option>
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
                    onChange={(e) => setCurrAddSubjectForm({...currAddSubjectForm, unitsSelected: parseInt(e.target.value) || 0})}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">Grade Level</label>
                <select
                  value={currAddSubjectForm.gradeLevelSelected}
                  onChange={(e) => setCurrAddSubjectForm({...currAddSubjectForm, gradeLevelSelected: e.target.value})}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 font-semibold"
                >
                  <option value="">Select Grade Level</option>
                  {gradeLevelOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-stone-100">
                <button
                  type="submit"
                  className="flex-1 bg-[#4D2F1B] hover:bg-[#603D26] text-white py-2.5 rounded-xl font-bold transition cursor-pointer"
                >
                  Add Subject
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddSubjectToCurrModalOpen(false)}
                  className="flex-1 bg-[#FEFCF9] hover:bg-stone-100 border border-stsn-beige text-stone-700 py-2.5 rounded-xl font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* 4. CRUD NEW/EDIT COURSE PROGRAM PROGRAM MODAL */}
      {isCourseModalOpen && (
        <div className="app-modal-backdrop z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-md p-6 animate-fade-in text-stone-800">
            <h3 className="text-sm font-bold font-display text-stsn-brown pb-2 border-b border-stone-100">
              {editingCourse ? "Edit Course Program" : "Add Course Program"}
            </h3>

            <form onSubmit={handleSaveCourse} className="space-y-4 text-xs font-semibold mt-4">
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

              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-stsn-brown hover:bg-stsn-brown-dark text-white py-2 rounded-lg font-bold transition">
                  Save Program
                </button>
                <button type="button" onClick={() => setIsCourseModalOpen(false)} className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 py-2 rounded-lg font-bold transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. CRUD NEW/EDIT SUBJECT REGISTER MODAL */}
      {isSubjectModalOpen && (
        <div className="app-modal-backdrop z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-md p-6 animate-fade-in text-stone-800">
            <h3 className="text-sm font-bold font-display text-stsn-brown pb-2 border-b border-stone-100">
              {editingSubject ? "Edit Subject Registry" : "Add Subject to Catalog"}
            </h3>

            <form onSubmit={handleSaveSubject} className="space-y-4 text-xs font-semibold mt-4">
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
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-stsn-brown text-white py-2 rounded-lg font-bold">
                  Save Subject
                </button>
                <button type="button" onClick={() => setIsSubjectModalOpen(false)} className="flex-1 bg-stone-100 text-stone-700 py-2 rounded-lg font-bold">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

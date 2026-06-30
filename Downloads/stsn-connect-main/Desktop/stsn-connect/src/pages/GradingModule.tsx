/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from "react";
import { useSTSNStore } from "../services/store";
import { Student, Subject, Grade } from "../types";
import { BookOpen, FileCheck, Save, Sparkles, UserCheck, GraduationCap, Search, Award } from "lucide-react";
import { PreviewModal, ReportCardPreview } from "../components/ModalPreviews";

export default function GradingModule() {
  const {
    students,
    subjects,
    grades,
    saveGrade
  } = useSTSNStore();

  const [selectedSubjectCode, setSelectedSubjectCode] = useState("SHS-GEN-MATH");
  const [selectedSection, setSelectedSection] = useState("St. Thomas");
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [midtermInput, setMidtermInput] = useState<number>(0);
  const [finalInput, setFinalInput] = useState<number>(0);
  
  // Progress card previews
  const [isReportCardOpen, setIsReportCardOpen] = useState(false);
  const [reportCardStudent, setReportCardStudent] = useState<Student | null>(null);

  // Filter students based on current advisory section / class list
  const classStudents = students.filter((s) => s.section === selectedSection);
  const currentSubjectObj = subjects.find((s) => s.code === selectedSubjectCode);

  const handleEditGradeClick = (studentId: string, currentMid: number | null, currentFin: number | null) => {
    setEditingStudentId(studentId);
    setMidtermInput(currentMid || 80);
    setFinalInput(currentFin || 80);
  };

  const handleSaveGradeDetails = (studentId: string) => {
    if (midtermInput < 50 || midtermInput > 100 || finalInput < 50 || finalInput > 100) {
      alert("Invalid: Philippines grading metrics usually range from 50 to 100.");
      return;
    }
    saveGrade(studentId, selectedSubjectCode, midtermInput, finalInput);
    setEditingStudentId(null);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* Module Title card */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-white border border-stsn-beige rounded-xl shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-display font-semibold text-stone-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-stsn-brown" />
            Faculty Grade Encoding & Report Card Registries
          </h2>
          <p className="text-stone-500 text-xs mt-1">
            Encode students midterm & final semestral standing scores, calculate academic GPAs, and print unified student transcript progress layouts.
          </p>
        </div>
        
        {/* Dropdowns */}
        <div className="flex gap-2 w-full sm:w-auto">
          <select
            value={selectedSubjectCode}
            onChange={(e) => setSelectedSubjectCode(e.target.value)}
            className="bg-stone-50 border border-stone-200 text-xs rounded-lg px-3 py-1.5 font-bold focus:outline-none focus:ring-1 focus:ring-stsn-brown"
          >
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.code}>{sub.code} ({sub.name})</option>
            ))}
          </select>

          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="bg-stone-50 border border-stone-200 text-xs rounded-lg px-3 py-1.5 font-bold focus:outline-none focus:ring-1 focus:ring-stsn-brown"
          >
            <option value="St. Thomas">Class: St. Thomas</option>
            <option value="IT101">Class: IT101</option>
            <option value="BA201">Class: BA201</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        
        {/* Main grading table */}
        <div className="bg-white p-6 rounded-xl border border-stsn-beige shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-stone-100">
            <div>
              <span className="text-[10px] font-mono text-stone-400 block uppercase font-bold">Class roster</span>
              <h3 className="text-sm font-bold text-stone-900">{currentSubjectObj?.name} Class Load</h3>
            </div>
            <span className="text-[10px] font-mono bg-stsn-cream text-stsn-brown-dark rounded-full px-3 py-1 border border-stsn-beige font-bold">
              Weight: {currentSubjectObj?.units || "K-12"} Academic Units
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-stone-100 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-100 font-bold text-stone-500 text-[10px] uppercase">
                  <th className="p-3">StudentID</th>
                  <th className="p-3">Roster Student Name</th>
                  <th className="p-3 text-center">Midterm (50-100)</th>
                  <th className="p-3 text-center">Final (50-100)</th>
                  <th className="p-3 text-center font-mono text-[9px]">Weighted Average</th>
                  <th className="p-3 text-center">Rating</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium">
                {classStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-stone-400 italic">No students assigned to section: {selectedSection}.</td>
                  </tr>
                ) : (
                  classStudents.map((stud) => {
                    const gradeScoreObj = grades.find((g) => g.studentId === stud.id && g.subjectCode === selectedSubjectCode);
                    const isEditing = editingStudentId === stud.id;
                    const calculatedAvg = gradeScoreObj ? Math.round((gradeScoreObj.midtermGrade + gradeScoreObj.finalGrade) / 2) : null;
                    
                    return (
                      <tr key={stud.id} className="hover:bg-stone-50/50">
                        <td className="p-3 font-mono font-semibold text-stone-400">{stud.studentNo}</td>
                        <td className="p-3 text-stone-900 font-bold">
                          {stud.lastName}, {stud.firstName}
                        </td>
                        
                        <td className="p-3 text-center">
                          {isEditing ? (
                            <input
                              type="number"
                              min={50}
                              max={100}
                              value={midtermInput}
                              onChange={(e) => setMidtermInput(Number(e.target.value))}
                              className="w-16 bg-stone-100 border border-stone-300 rounded text-center font-mono py-0.5"
                            />
                          ) : (
                            <span className="font-mono font-bold text-stone-700">{gradeScoreObj?.midtermGrade ?? "—"}</span>
                          )}
                        </td>

                        <td className="p-3 text-center">
                          {isEditing ? (
                            <input
                              type="number"
                              min={50}
                              max={100}
                              value={finalInput}
                              onChange={(e) => setFinalInput(Number(e.target.value))}
                              className="w-16 bg-stone-100 border border-stone-300 rounded text-center font-mono py-0.5"
                            />
                          ) : (
                            <span className="font-mono font-bold text-stone-700">{gradeScoreObj?.finalGrade ?? "—"}</span>
                          )}
                        </td>

                        <td className="p-3 text-center">
                          <span className="font-mono font-extrabold text-stsn-brown">
                            {calculatedAvg ? `${calculatedAvg}%` : "—"}
                          </span>
                        </td>

                        <td className="p-3 text-center">
                          {calculatedAvg ? (
                            <span className={`inline-block text-[9.5px] font-bold px-2 py-0.5 rounded ${
                              calculatedAvg >= 75 ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                            }`}>
                              {calculatedAvg >= 75 ? "Passed" : "Failed"}
                            </span>
                          ) : (
                            <span className="text-[10px] text-stone-400 italic">No Record</span>
                          )}
                        </td>

                        <td className="p-3 text-right space-x-1.5 flex justify-end">
                          {isEditing ? (
                            <button
                              onClick={() => handleSaveGradeDetails(stud.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2.5 py-1 rounded cursor-pointer transition flex items-center gap-0.5"
                            >
                              <Save className="w-3 h-3" />
                              Save
                            </button>
                          ) : (
                            <button
                              onClick={() => handleEditGradeClick(stud.id, gradeScoreObj?.midtermGrade || null, gradeScoreObj?.finalGrade || null)}
                              className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] font-bold px-2.5 py-1 rounded cursor-pointer transition"
                            >
                              Encode Grades
                            </button>
                          )}
                          
                          <button
                            onClick={() => {
                              setReportCardStudent(stud);
                              setIsReportCardOpen(true);
                            }}
                            className="bg-stsn-brown hover:bg-stsn-brown-dark text-stsn-cream text-[10px] font-bold px-2.5 py-1 rounded cursor-pointer transition"
                          >
                            Print Card
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* DETAILED STUDENT PROGRESS REPORT MODAL */}
      {isReportCardOpen && reportCardStudent && (
        <PreviewModal
          isOpen={isReportCardOpen}
          onClose={() => setIsReportCardOpen(false)}
          title="Print official student report card card"
        >
          <ReportCardPreview
            student={reportCardStudent}
            // filter complete grades matching this student
            grades={grades.filter((g) => g.studentId === reportCardStudent.id)}
            subjects={subjects.filter((sub) => sub.department === reportCardStudent.department)}
          />
        </PreviewModal>
      )}

    </div>
  );
}

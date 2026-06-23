/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { useSTSNStore } from "../../../services/store";
import { getAcademicTerms } from "../../../config/schools.config";
import { getAcademicScopedData } from "../../../services/academicUnitScopeService";
import type { Student } from "../../../types";
import STSNDataTable, { type STSNColumn } from "../../../components/common/STSNDataTable";
import { UsersRound, LayoutDashboard, BookOpen, Receipt, FileText, Search, X } from "lucide-react";
import StudentPortal from "../../student-portal/pages/StudentPortalPage";

interface StudentDirectoryPageProps {
  onNavigate: (subPage: "overview" | "grades" | "ledger" | "profile", studentId: string) => void;
}

const ACTION_BUTTONS: {
  subPage: "overview" | "grades" | "ledger" | "profile";
  label: string;
  icon: React.ElementType;
  title: string;
}[] = [
  { subPage: "overview",  label: "Records Overview",     icon: LayoutDashboard, title: "Records Overview" },
  { subPage: "grades",    label: "Academic Report Card", icon: BookOpen,        title: "Academic Report Card" },
  { subPage: "ledger",    label: "Financial Ledger",     icon: Receipt,         title: "Financial Ledger" },
  { subPage: "profile",   label: "Student Profile",      icon: FileText,        title: "Student Profile" },
];

export default function StudentDirectoryPage({ onNavigate: _onNavigate }: StudentDirectoryPageProps) {
  const { students, currentUser, activeSchool, academicUnit } = useSTSNStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [modal, setModal] = useState<{ studentId: string; subPage: "overview" | "grades" | "ledger" | "profile" } | null>(null);

  const terms = useMemo(() => getAcademicTerms(academicUnit), [academicUnit]);
  const isBasicEd = academicUnit !== "college";
  const schoolBadgeClass = isBasicEd ? "badge-basic-ed" : "badge-college";

  const contextStudents = useMemo(() => {
    return getAcademicScopedData({ currentUser, activeSchool, academicUnit, students }).students;
  }, [students, currentUser, activeSchool, academicUnit]);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return contextStudents;
    return contextStudents.filter((s) => {
      const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
      return fullName.includes(q) || s.studentNo.toLowerCase().includes(q);
    });
  }, [contextStudents, searchQuery]);

  const columns: STSNColumn<Student>[] = useMemo(
    () => [
      {
        title: terms.studentIdLabel,
        data: "studentNo",
        className: `font-mono font-bold text-xs ${isBasicEd ? "text-stsn-brown" : "text-blue-700"}`,
        render: (value) => value,
      },
      {
        title: "Full Name",
        data: "lastName",
        render: (_value, stud) => (
          <div>
            <div className="font-semibold text-stone-900">
              {stud.lastName}, {stud.firstName}
            </div>
            <span className="text-[10px] text-stone-400 block">
              {stud.section ? `Section: ${stud.section}` : "No section"}
            </span>
          </div>
        ),
      },
      {
        title: terms.unitNounSingular,
        data: "yearLevel",
        className: "text-stone-600 font-medium",
      },
      {
        title: terms.trackNoun,
        data: "trackOrCourse",
        render: (_value, stud) => (
          <span className={`rounded px-2 py-0.5 text-[10.5px] font-bold ${schoolBadgeClass}`}>
            {stud.trackOrCourse || "N/A"}
          </span>
        ),
      },
      {
        title: "Status",
        data: "enrollmentStatus",
        className: "text-center",
        searchable: false,
        render: (_value, stud) => (
          <span
            className={`inline-block text-[9.5px] font-bold leading-none px-2 py-1 rounded-full ${
              stud.enrollmentStatus === "Enrolled"
                ? "bg-green-50 text-green-700 border border-green-200"
                : stud.enrollmentStatus === "Approved"
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : stud.enrollmentStatus === "Rejected"
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}
          >
            {stud.enrollmentStatus}
          </span>
        ),
      },
      {
        title: "Quick Access",
        orderable: false,
        searchable: false,
        className: "text-right",
        render: (_value, stud) => (
          <div className="flex items-center justify-end gap-1">
            {ACTION_BUTTONS.map(({ subPage, icon: Icon, title }) => (
              <button
                key={subPage}
                onClick={(e) => {
                  e.stopPropagation();
                  setModal({ studentId: stud.id, subPage });
                }}
                title={title}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer group ${
                  isBasicEd
                    ? "bg-stsn-cream border-stsn-beige hover:bg-stsn-brown hover:border-stsn-brown hover:text-white text-stsn-brown"
                    : "bg-blue-50 border-blue-200 hover:bg-blue-600 hover:border-blue-600 hover:text-white text-blue-600"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
        ),
      },
    ],
    [terms, isBasicEd, schoolBadgeClass, setModal],
  );

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 rounded-xl shadow-sm gap-4 ${isBasicEd ? "bg-white border border-stsn-beige" : "bg-blue-50 border border-blue-200"}`}>
        <div>
          <div className={`text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded-full border inline-block mb-1.5 ${schoolBadgeClass}`}>
            {isBasicEd ? "K-12 Basic Education" : "Tertiary / College Division"}
          </div>
          <h2 className="text-xl font-display font-semibold text-stone-900 tracking-tight flex items-center gap-2">
            <UsersRound className={`w-5 h-5 ${isBasicEd ? "text-stsn-brown" : "text-blue-600"}`} />
            Student Directory
          </h2>
          <p className="text-stone-500 text-xs mt-1">
            {contextStudents.length} students across all enrollment statuses
          </p>
        </div>
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[10px] text-stone-500 font-mono">
          {ACTION_BUTTONS.map(({ subPage, icon: Icon, label }) => (
            <span key={subPage} className="flex items-center gap-1">
              <Icon className="w-3 h-3 text-stone-400" />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white p-6 rounded-xl border border-stsn-beige shadow-sm space-y-4">
        <div className="flex justify-between items-center bg-stone-50 p-2.5 rounded-lg border border-stone-200">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 text-stone-400 w-4 h-4" />
            <input
              type="text"
              placeholder={`Search ${isBasicEd ? "learners" : "students"} by name or ID…`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-md py-1.5 pl-8 pr-3 text-xs focus:ring-1 focus:ring-stsn-brown focus:outline-none font-medium"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[9px] font-mono px-2 py-0.5 rounded border font-bold ${schoolBadgeClass}`}>
              {isBasicEd ? "Basic Ed" : "College"}
            </span>
            <span className="text-[10px] text-stone-400 font-mono">
              Found: {filteredStudents.length}
            </span>
          </div>
        </div>

        <STSNDataTable<Student>
          columns={columns}
          rows={filteredStudents}
          emptyMessage="No students found."
          searchable={false}
        />
      </div>

      {modal && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm overflow-y-auto flex items-start justify-center py-8 px-4 animate-fade-in"
          onClick={() => setModal(null)}
        >
          <div
            className="bg-stone-100 rounded-2xl shadow-2xl w-full max-w-6xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-3 bg-white rounded-t-2xl border-b border-stone-200">
              <div className="flex items-center gap-2">
                {(() => {
                  const btn = ACTION_BUTTONS.find((b) => b.subPage === modal.subPage);
                  if (!btn) return null;
                  const Icon = btn.icon;
                  return (
                    <>
                      <Icon className={`w-4 h-4 ${isBasicEd ? "text-stsn-brown" : "text-blue-600"}`} />
                      <span className="text-sm font-bold text-stone-900">{btn.label}</span>
                    </>
                  );
                })()}
              </div>
              <button
                onClick={() => setModal(null)}
                className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-500 cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              <StudentPortal subPage={modal.subPage} initialStudentId={modal.studentId} compact />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

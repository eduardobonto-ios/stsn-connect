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
import AppModal from "../../../components/common/AppModal";
import AppStatusBadge from "../../../components/common/AppStatusBadge";
import { UsersRound, LayoutDashboard, BookOpen, Receipt, FileText, Search, UserCheck, Clock, X } from "lucide-react";
import StudentPortal from "../../student-portal/pages/StudentPortalPage";
import ModulePageHeader from "../../../components/common/ModulePageHeader";
import PersonIdentityCell from "../../../components/common/PersonIdentityCell";

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

  const kpiStats = useMemo(() => {
    const enrolled = contextStudents.filter((s: Student) => s.enrollmentStatus === "Enrolled").length;
    const approved = contextStudents.filter((s: Student) => s.enrollmentStatus === "Approved").length;
    const pending = contextStudents.length - enrolled - approved;
    return { total: contextStudents.length, enrolled, approved, pending: Math.max(0, pending) };
  }, [contextStudents]);

  const columns: STSNColumn<Student>[] = useMemo(
    () => [
      {
        title: terms.studentIdLabel,
        data: "studentNo",
        className: `font-mono font-bold text-xs ${isBasicEd ? "text-stsn-brown" : "text-blue-700"}`,
        render: (value) => value,
      },
      {
        title: "Student",
        data: "lastName",
        render: (_value, stud) => (
          <PersonIdentityCell
            firstName={stud.firstName}
            lastName={stud.lastName}
            secondary={stud.section || "No section"}
            variant={isBasicEd ? "basic-ed" : "college"}
          />
        ),
      },
      {
        title: terms.unitNounSingular,
        data: "yearLevel",
        className: "text-stone-600 font-medium text-xs",
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
        render: (_value, stud) => <AppStatusBadge status={stud.enrollmentStatus} />,
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
    <div className="space-y-5 animate-fade-in font-sans">
      <ModulePageHeader
        variant={isBasicEd ? "default" : "college"}
        badge={isBasicEd ? "K-12 Basic Education" : "Tertiary / College Division"}
        badgeIcon={UsersRound}
        title="Student Directory"
        subtitle={`${contextStudents.length} students across all enrollment statuses`}
        meta="S.Y. 2026–2027"
      />

      {/* KPI Pipeline — divided metric bar */}
      <div className="bg-white border border-stsn-beige rounded-xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-stone-100">
          {[
            { label: "Total Students", value: kpiStats.total, icon: UsersRound, numColor: "text-stone-900", iconColor: "text-stone-300", bgClass: "", dotColor: "bg-stone-400", hint: "All enrollment statuses" },
            { label: "Enrolled", value: kpiStats.enrolled, icon: BookOpen, numColor: "text-emerald-700", iconColor: "text-emerald-200", bgClass: "bg-emerald-50/60", dotColor: "bg-emerald-500", hint: "Currently enrolled" },
            { label: "Approved", value: kpiStats.approved, icon: UserCheck, numColor: "text-blue-700", iconColor: "text-blue-200", bgClass: "bg-blue-50/60", dotColor: "bg-blue-500", hint: "Awaiting enrollment" },
            { label: "Pending / Other", value: kpiStats.pending, icon: Clock, numColor: "text-amber-700", iconColor: "text-amber-200", bgClass: "bg-amber-50/60", dotColor: "bg-amber-500", hint: "Requires action" },
          ].map((kpi) => (
            <div key={kpi.label} className={`px-5 py-5 ${kpi.bgClass}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${kpi.dotColor}`} />
                    <span className="text-[9px] font-mono font-bold text-stone-400 uppercase tracking-wider truncate">{kpi.label}</span>
                  </div>
                  <p className={`text-3xl font-black leading-none ${kpi.numColor}`}>{kpi.value}</p>
                  <p className="text-[10px] text-stone-400 mt-2">{kpi.hint}</p>
                </div>
                <kpi.icon className={`w-6 h-6 flex-shrink-0 mt-0.5 ${kpi.iconColor}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl border border-stsn-beige shadow-sm overflow-hidden">
        {/* Search toolbar */}
        <div className="px-4 py-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4 pointer-events-none" />
              <input
                type="text"
                placeholder={`Search ${isBasicEd ? "learners" : "students"} by name or ID…`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full h-10 bg-stone-50 border border-stone-200 rounded-xl py-0 pl-10 pr-10 text-sm focus:ring-2 focus:outline-none ${isBasicEd ? "focus:ring-stsn-brown/20 focus:border-stsn-brown" : "focus:ring-blue-500/20 focus:border-blue-500"}`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${schoolBadgeClass}`}>
              {isBasicEd ? "Basic Ed" : "College"}
            </span>
            <span className="text-[11px] font-mono text-stone-400 whitespace-nowrap">
              Found: {filteredStudents.length}
            </span>
          </div>
        </div>

        <STSNDataTable<Student>
          columns={columns}
          rows={filteredStudents}
          emptyMessage="No students found."
          searchable={false}
          className="px-3 pb-3"
        />
      </div>

      {modal && (
        <AppModal
          open
          title={ACTION_BUTTONS.find((b) => b.subPage === modal.subPage)?.label ?? "Student Record"}
          icon={ACTION_BUTTONS.find((b) => b.subPage === modal.subPage)?.icon}
          onClose={() => setModal(null)}
          maxWidthClass="max-w-6xl"
          headerClassName="bg-white text-stone-900 border-b border-stone-200"
          bodyClassName="p-6 bg-stone-100"
        >
          <StudentPortal subPage={modal.subPage} initialStudentId={modal.studentId} compact />
        </AppModal>
      )}
    </div>
  );
}

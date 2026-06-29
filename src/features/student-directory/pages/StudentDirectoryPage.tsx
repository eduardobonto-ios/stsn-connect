/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { useSTSNStore } from "../../../services/store";
import { getAcademicTerms } from "../../../config/schools.config";
import { getAcademicScopedData } from "../../../services/academicUnitScopeService";
import type { Student } from "../../../types";
import AppButton from "../../../components/common/AppButton";
import AppCard from "../../../components/common/AppCard";
import AppModal from "../../../components/common/AppModal";
import AppSearchInput from "../../../components/common/AppSearchInput";
import AppStatusBadge from "../../../components/common/AppStatusBadge";
import AppTable, { type AppTableColumn } from "../../../components/common/AppTable";
import {
  UsersRound,
  LayoutDashboard,
  BookOpen,
  Receipt,
  FileText,
  UserCheck,
  Clock,
} from "lucide-react";
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
  { subPage: "overview", label: "Records Overview", icon: LayoutDashboard, title: "Records Overview" },
  { subPage: "grades", label: "Academic Report Card", icon: BookOpen, title: "Academic Report Card" },
  { subPage: "ledger", label: "Financial Ledger", icon: Receipt, title: "Financial Ledger" },
  { subPage: "profile", label: "Student Profile", icon: FileText, title: "Student Profile" },
];

export default function StudentDirectoryPage({ onNavigate: _onNavigate }: StudentDirectoryPageProps) {
  const { students, currentUser, activeSchool, academicUnit } = useSTSNStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [modal, setModal] = useState<{
    studentId: string;
    subPage: "overview" | "grades" | "ledger" | "profile";
  } | null>(null);

  const terms = useMemo(() => getAcademicTerms(academicUnit), [academicUnit]);
  const isBasicEd = academicUnit !== "college";
  const schoolBadgeClass = isBasicEd ? "badge-basic-ed" : "badge-college";

  const contextStudents = useMemo(() => {
    return getAcademicScopedData({ currentUser, activeSchool, academicUnit, students }).students;
  }, [students, currentUser, activeSchool, academicUnit]);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return contextStudents;
    return contextStudents.filter((student) => {
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
      return fullName.includes(q) || student.studentNo.toLowerCase().includes(q);
    });
  }, [contextStudents, searchQuery]);

  const kpiStats = useMemo(() => {
    const enrolled = contextStudents.filter((student: Student) => student.enrollmentStatus === "Enrolled").length;
    const approved = contextStudents.filter((student: Student) => student.enrollmentStatus === "Approved").length;
    const pending = contextStudents.length - enrolled - approved;
    return { total: contextStudents.length, enrolled, approved, pending: Math.max(0, pending) };
  }, [contextStudents]);

  const columns: AppTableColumn<Student>[] = useMemo(
    () => [
      {
        accessorKey: "studentNo",
        header: terms.studentIdLabel,
        cell: ({ getValue }) => (
          <span className={`font-mono text-xs font-bold ${isBasicEd ? "text-stsn-brown" : "text-blue-700"}`}>
            {String(getValue())}
          </span>
        ),
      },
      {
        accessorKey: "lastName",
        header: "Student",
        cell: ({ row }) => {
          const student = row.original;
          return (
            <PersonIdentityCell
              firstName={student.firstName}
              lastName={student.lastName}
              secondary={student.section || "No section"}
              variant={isBasicEd ? "basic-ed" : "college"}
            />
          );
        },
      },
      {
        accessorKey: "yearLevel",
        header: terms.unitNounSingular,
        cell: ({ getValue }) => <span className="text-xs font-medium text-stone-600">{String(getValue())}</span>,
      },
      {
        accessorKey: "trackOrCourse",
        header: terms.trackNoun,
        cell: ({ row }) => {
          const student = row.original;
          return (
            <span className={`rounded px-2 py-0.5 text-[10.5px] font-bold ${schoolBadgeClass}`}>
              {student.trackOrCourse || "N/A"}
            </span>
          );
        },
      },
      {
        accessorKey: "enrollmentStatus",
        header: "Status",
        enableGlobalFilter: false,
        cell: ({ row }) => <AppStatusBadge status={row.original.enrollmentStatus} />,
      },
      {
        id: "quickAccess",
        header: "Quick Access",
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => {
          const student = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              {ACTION_BUTTONS.map(({ subPage, icon: Icon, title }) => (
                <AppButton
                  key={subPage}
                  onClick={(event) => {
                    event.stopPropagation();
                    setModal({ studentId: student.id, subPage });
                  }}
                  title={title}
                  iconOnly
                  size="sm"
                  variant={isBasicEd ? "secondary" : "outline"}
                  className={isBasicEd ? "text-stsn-brown" : "text-blue-700 hover:border-blue-300"}
                >
                  <Icon className="h-3.5 w-3.5" />
                </AppButton>
              ))}
            </div>
          );
        },
      },
    ],
    [terms, isBasicEd, schoolBadgeClass],
  );

  return (
    <div className="space-y-5 animate-fade-in font-sans">
      <ModulePageHeader
        variant={isBasicEd ? "default" : "college"}
        badge={isBasicEd ? "K-12 Basic Education" : "Tertiary / College Division"}
        badgeIcon={UsersRound}
        title="Student Directory"
        subtitle={`${contextStudents.length} students across all enrollment statuses`}
        meta="S.Y. 2026-2027"
      />

      <AppCard className="overflow-hidden bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(255,253,246,0.98)_48%,rgba(248,242,228,0.96)_100%)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1.5">
            <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-[var(--erp-text-muted)]">
              Directory Overview
            </p>
            <h2 className="text-lg font-bold tracking-tight text-[var(--erp-text)]">
              Search and open student records from one registry surface.
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-[var(--erp-text-muted)]">
              Selection, modal access, and table behavior remain unchanged. This pass focuses only on hierarchy, spacing, and shared-shell consistency.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[420px]">
            <div className="rounded-2xl border border-[var(--erp-border)] bg-white/88 px-4 py-3">
              <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--erp-text-muted)]">Directory Total</p>
              <p className="mt-1 text-2xl font-black text-[var(--erp-brand)]">{kpiStats.total}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-[10px] font-mono uppercase tracking-wider text-emerald-700">Enrolled</p>
              <p className="mt-1 text-2xl font-black text-emerald-800">{kpiStats.enrolled}</p>
            </div>
            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3">
              <p className="text-[10px] font-mono uppercase tracking-wider text-blue-700">Approved</p>
              <p className="mt-1 text-2xl font-black text-blue-800">{kpiStats.approved}</p>
            </div>
          </div>
        </div>
      </AppCard>

      <AppCard className="overflow-hidden" padded={false}>
        <div className="grid grid-cols-2 divide-y divide-stone-100 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          {[
            { label: "Total Students", value: kpiStats.total, icon: UsersRound, numColor: "text-stone-900", iconColor: "text-stone-300", bgClass: "", dotColor: "bg-stone-400", hint: "All enrollment statuses" },
            { label: "Enrolled", value: kpiStats.enrolled, icon: BookOpen, numColor: "text-emerald-700", iconColor: "text-emerald-200", bgClass: "bg-emerald-50/60", dotColor: "bg-emerald-500", hint: "Currently enrolled" },
            { label: "Approved", value: kpiStats.approved, icon: UserCheck, numColor: "text-blue-700", iconColor: "text-blue-200", bgClass: "bg-blue-50/60", dotColor: "bg-blue-500", hint: "Awaiting enrollment" },
            { label: "Pending / Other", value: kpiStats.pending, icon: Clock, numColor: "text-amber-700", iconColor: "text-amber-200", bgClass: "bg-amber-50/60", dotColor: "bg-amber-500", hint: "Requires action" },
          ].map((kpi) => (
            <div key={kpi.label} className={`px-5 py-5 ${kpi.bgClass}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="mb-2 flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${kpi.dotColor}`} />
                    <span className="truncate text-[9px] font-bold uppercase tracking-wider text-stone-400">{kpi.label}</span>
                  </div>
                  <p className={`text-3xl font-black leading-none ${kpi.numColor}`}>{kpi.value}</p>
                  <p className="mt-2 text-[10px] text-stone-400">{kpi.hint}</p>
                </div>
                <kpi.icon className={`mt-0.5 h-6 w-6 flex-shrink-0 ${kpi.iconColor}`} />
              </div>
            </div>
          ))}
        </div>
      </AppCard>

      <AppTable<Student>
        data={filteredStudents}
        columns={columns}
        title={isBasicEd ? "Learner Registry" : "Student Registry"}
        enableSearch={false}
        enableColumnVisibility={false}
        initialPageSize={10}
        pageSizeOptions={[10]}
        loading={false}
        emptyMessage="No students found."
        emptyDescription="Adjust the search query to find students."
        getRowId={(row) => row.id}
        searchPlaceholder={`Search ${isBasicEd ? "learners" : "students"} by name or ID...`}
        toolbar={
          <>
            <AppSearchInput
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onClear={() => setSearchQuery("")}
              placeholder={`Search ${isBasicEd ? "learners" : "students"} by name or ID...`}
              variant={isBasicEd ? "default" : "college"}
              uiSize="sm"
              wrapperClassName="w-64"
              aria-label="Search students"
            />
            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${schoolBadgeClass}`}>
              {isBasicEd ? "Basic Ed" : "College"}
            </span>
            <span className="whitespace-nowrap text-[11px] font-mono text-stone-400">
              {filteredStudents.length} found
            </span>
          </>
        }
      />

      {modal && (
        <AppModal
          open
          title={ACTION_BUTTONS.find((button) => button.subPage === modal.subPage)?.label ?? "Student Record"}
          icon={ACTION_BUTTONS.find((button) => button.subPage === modal.subPage)?.icon}
          onClose={() => setModal(null)}
          maxWidthClass="max-w-6xl"
          headerClassName="border-b border-stone-200 bg-white text-stone-900"
          bodyClassName="bg-stone-100 p-6"
        >
          <StudentPortal subPage={modal.subPage} initialStudentId={modal.studentId} compact />
        </AppModal>
      )}
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  GraduationCap, LayoutDashboard, BookOpen, TrendingUp, ClipboardList,
  FileQuestion, PenSquare, Presentation,
  AlertCircle, Loader2, CheckCircle, XCircle,
} from "lucide-react";
import ModulePageHeader from "../../../components/common/ModulePageHeader";
import { usePermissions } from "../../../hooks/usePermissions";
import { useSTSNStore } from "../../../services/store";
import { useLmsData } from "../data/useLmsData";
import { LMS_SUB_PAGES, type LmsSubPage } from "../types";

import LmsDashboard from "../components/sections/LmsDashboard";
import StudentDashboard from "../components/sections/StudentDashboard";
import CourseCatalog from "../components/sections/CourseCatalog";
import StudentProgress from "../components/sections/StudentProgress";
import AssessmentsHub from "../components/sections/AssessmentsHub";
import ExamCenter from "../components/sections/ExamCenter";
import QuestionBuilder from "../components/sections/QuestionBuilder";
import TeacherBoard from "../components/sections/TeacherBoard";

const TABS: { id: LmsSubPage; label: string; icon: React.ElementType }[] = [
  { id: "dashboard",        label: "Dashboard",       icon: LayoutDashboard },
  { id: "courses",          label: "Course Catalog",  icon: BookOpen },
  { id: "progress",         label: "My Progress",     icon: TrendingUp },
  { id: "assessments",      label: "Assessments",     icon: ClipboardList },
  { id: "exams",            label: "Exam Center",     icon: FileQuestion },
  { id: "question-builder", label: "Question Builder", icon: PenSquare },
  { id: "teacher-board",    label: "Teacher Board",   icon: Presentation },
];

const isSubPage = (v: string): v is LmsSubPage =>
  (LMS_SUB_PAGES as readonly string[]).includes(v);

export default function LmsModulePage({
  subPage,
  courseId,
  onSubPageChange,
  onCourseChange,
}: {
  subPage?: string;
  courseId?: string;
  onSubPageChange?: (page: string) => void;
  onCourseChange?: (courseId?: string) => void;
}) {
  const { canPage, hasPageAccess } = usePermissions();
  const currentUserRole = useSTSNStore((s) => s.currentUser?.role);
  const isStudent = currentUserRole === "STUDENT";
  const lms = useLmsData();

  const initial: LmsSubPage = subPage && isSubPage(subPage) ? subPage : "dashboard";
  const [activeTab, setActiveTab] = useState<LmsSubPage>(initial);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (subPage && isSubPage(subPage) && subPage !== activeTab) setActiveTab(subPage);
  }, [subPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const goTo = (tab: LmsSubPage) => {
    setActiveTab(tab);
    onSubPageChange?.(tab);
  };

  const openCourse = (id: string) => {
    setActiveTab("courses");
    onSubPageChange?.("courses");
    onCourseChange?.(id);
  };

  const visibleTabs = useMemo(
    () => TABS.filter((t) => hasPageAccess("LMS", t.id)),
    [hasPageAccess],
  );

  const renderSection = () => {
    if (!hasPageAccess("LMS", activeTab)) {
      return (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <p className="text-xs text-amber-800">This LMS page is disabled for the current access profile.</p>
        </div>
      );
    }
    switch (activeTab) {
      case "dashboard":
        return isStudent ? (
          <StudentDashboard lms={lms} onNavigate={goTo} onOpenCourse={openCourse} onToast={showToast} />
        ) : (
          <LmsDashboard lms={lms} onNavigate={goTo} onOpenCourse={openCourse} />
        );
      case "courses":
        return (
          <CourseCatalog
            lms={lms}
            canPage={(page, action) => canPage("LMS", page, action)}
            initialCourseId={courseId}
            onCourseChange={onCourseChange}
            onToast={showToast}
          />
        );
      case "progress":
        return <StudentProgress lms={lms} onOpenCourse={openCourse} />;
      case "assessments":
        return <AssessmentsHub lms={lms} onToast={showToast} />;
      case "exams":
        return <ExamCenter lms={lms} onToast={showToast} />;
      case "question-builder":
        return (
          <QuestionBuilder
            lms={lms}
            canPage={(page, action) => canPage("LMS", page, action)}
            onToast={showToast}
          />
        );
      case "teacher-board":
        return <TeacherBoard lms={lms} onNavigate={goTo} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-5 animate-fade-in font-sans">
      {toast && (
        <div className={`fixed top-5 right-5 z-[60] flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold animate-fade-in ${
          toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.type === "success" ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <ModulePageHeader
        badge="Learning Management"
        badgeIcon={GraduationCap}
        title="Learning Management System"
        subtitle="Browse courses, follow lessons, track your learning progress, and manage course content."
      />

      {/* Tab bar */}
      <div className="bg-white rounded-xl border border-stsn-beige shadow-sm overflow-hidden">
        <div className="flex items-stretch overflow-x-auto">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => goTo(tab.id)}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  active ? "tab-active-gradient" : "text-stone-500 hover:bg-stone-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Body */}
      {lms.loading ? (
        <div className="rounded-2xl border border-stsn-beige bg-white/80 p-8 shadow-sm flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-stsn-gold animate-spin" />
          <p className="text-sm text-stone-500">Loading learning content…</p>
        </div>
      ) : lms.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-red-800">Could not load the LMS</h3>
            <p className="text-xs text-red-700 mt-1">{lms.error}</p>
            <button
              onClick={() => void lms.reload()}
              className="mt-3 text-xs font-bold px-3 py-1.5 rounded-lg border border-red-300 text-red-700 hover:bg-red-100 cursor-pointer transition"
            >
              Retry
            </button>
          </div>
        </div>
      ) : (
        <div className="animate-fade-in">{renderSection()}</div>
      )}
    </div>
  );
}

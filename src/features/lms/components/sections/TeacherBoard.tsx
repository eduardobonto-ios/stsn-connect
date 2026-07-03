/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react";
import {
  BookOpen, Users, FileEdit, CheckCircle2, GraduationCap, ClipboardList,
  Plus, Compass, PenSquare, Activity, UserPlus,
} from "lucide-react";
import AppCard from "../../../../components/common/AppCard";
import AppKpiCard from "../../../../components/common/AppKpiCard";
import AppButton from "../../../../components/common/AppButton";
import AppStatusBadge from "../../../../components/common/AppStatusBadge";
import type { LmsData } from "../../data/useLmsData";
import type { LmsSubPage } from "../../types";
import { formatDateTime, formatDate } from "../shared";

export default function TeacherBoard({
  lms,
  onNavigate,
}: {
  lms: LmsData;
  onNavigate: (tab: LmsSubPage) => void;
}) {
  const totals = useMemo(() => {
    const courses = lms.courses;
    return {
      totalCourses: courses.length,
      published: courses.filter((c) => c.status === "Published").length,
      drafts: courses.filter((c) => c.status === "Draft").length,
      learners: new Set(lms.enrollments.map((e) => e.studentId)).size,
      assessments: lms.assessments.length,
      pendingGrading: lms.attempts.filter((t) => t.status === "Submitted").length,
    };
  }, [lms.courses, lms.enrollments, lms.assessments, lms.attempts]);

  const recentSubmissions = useMemo(
    () =>
      [...lms.attempts]
        .filter((t) => t.status !== "InProgress")
        .sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""))
        .slice(0, 6),
    [lms.attempts],
  );

  const courseRows = useMemo(() => {
    return lms.courses.map((c) => ({
      course: c,
      enrolled: lms.enrollments.filter((e) => e.courseId === c.id).length,
      lessons: lms.lessonsByCourse(c.id).length,
    }));
  }, [lms.courses, lms.enrollments, lms]);

  const recentEnrollments = useMemo(
    () =>
      [...lms.enrollments]
        .sort((a, b) => (b.createdAt ?? b.startedAt ?? "").localeCompare(a.createdAt ?? a.startedAt ?? ""))
        .slice(0, 6),
    [lms.enrollments],
  );

  const liveActivity = useMemo(
    () =>
      [...lms.activity]
        .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
        .slice(0, 8),
    [lms.activity],
  );

  return (
    <div className="space-y-5">
      {/* KPI summary */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <AppKpiCard label="Total Courses" value={totals.totalCourses} icon={BookOpen} tone="brand" />
        <AppKpiCard label="Published" value={totals.published} icon={CheckCircle2} tone="success" />
        <AppKpiCard label="Drafts" value={totals.drafts} icon={FileEdit} tone="warning" />
        <AppKpiCard label="Learners" value={totals.learners} icon={Users} tone="info" />
        <AppKpiCard label="Assessments" value={totals.assessments} icon={ClipboardList} tone="neutral" />
        <AppKpiCard label="To Grade" value={totals.pendingGrading} icon={GraduationCap} tone={totals.pendingGrading > 0 ? "danger" : "neutral"} />
      </div>

      {/* Quick tools */}
      <AppCard tone="brand" className="p-5">
        <h3 className="text-sm font-bold text-stone-800 mb-3">Quick Tools</h3>
        <div className="flex flex-wrap gap-2">
          <AppButton variant="primary" size="sm" leftIcon={Compass} onClick={() => onNavigate("courses")}>Manage Courses</AppButton>
          <AppButton variant="secondary" size="sm" leftIcon={PenSquare} onClick={() => onNavigate("question-builder")}>Question Builder</AppButton>
          <AppButton variant="secondary" size="sm" leftIcon={Plus} onClick={() => onNavigate("courses")}>Create Course</AppButton>
        </div>
      </AppCard>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        {/* Course list */}
        <AppCard tone="brand" className="p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-800">Courses</h3>
            <button onClick={() => onNavigate("courses")} className="text-[11px] font-bold text-stsn-brown hover:text-stsn-gold cursor-pointer">Open catalog</button>
          </div>
          <div className="overflow-x-auto">
            <table className="stsn-plain-table">
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Course</th>
                  <th>Lessons</th>
                  <th>Enrolled</th>
                  <th style={{ textAlign: "left" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {courseRows.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-stone-400 text-xs">No courses yet.</td></tr>
                ) : (
                  courseRows.map(({ course, enrolled, lessons }) => (
                    <tr key={course.id}>
                      <td className="font-semibold text-stone-800 max-w-[220px] truncate">{course.title}</td>
                      <td className="text-center text-stone-500">{lessons}</td>
                      <td className="text-center text-stone-500">{enrolled}</td>
                      <td><AppStatusBadge status={course.status} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </AppCard>

        {/* Recent submissions */}
        <AppCard tone="brand" className="p-5 h-fit">
          <h3 className="text-sm font-bold text-stone-800 mb-3">Recent Submissions</h3>
          {recentSubmissions.length === 0 ? (
            <p className="text-xs text-stone-400">No submissions yet.</p>
          ) : (
            <div className="space-y-2">
              {recentSubmissions.map((t) => {
                const a = lms.assessmentById(t.assessmentId);
                return (
                  <div key={t.id} className="flex items-center justify-between gap-2 rounded-xl border border-stone-100 p-2.5">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-stone-800 truncate">{a?.title ?? "Assessment"}</p>
                      <p className="text-[10px] font-mono text-stone-400">{formatDateTime(t.submittedAt)}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-sm font-display font-black text-stsn-brown">{t.percentage}%</span>
                      {t.status === "Submitted" && <AppStatusBadge status="Pending" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </AppCard>
      </div>

      {/* Student enrollments + live activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AppCard tone="brand" className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <UserPlus className="w-4 h-4 text-stsn-gold" />
            <h3 className="text-sm font-bold text-stone-800">Student Enrollments</h3>
          </div>
          {recentEnrollments.length === 0 ? (
            <p className="text-xs text-stone-400">No enrollments yet.</p>
          ) : (
            <div className="space-y-2">
              {recentEnrollments.map((e) => {
                const course = lms.courseById(e.courseId);
                return (
                  <div key={e.id} className="flex items-center justify-between gap-3 rounded-xl border border-stone-100 px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-stone-800 truncate">{e.studentName ?? "Student"}</p>
                      <p className="text-[10px] font-mono text-stone-400 truncate">{course?.title ?? "Course"} • {formatDate(e.startedAt)}</p>
                    </div>
                    <AppStatusBadge status={e.enrollmentStatus} />
                  </div>
                );
              })}
            </div>
          )}
        </AppCard>

        <AppCard tone="brand" className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-stsn-gold" />
            <h3 className="text-sm font-bold text-stone-800">Live Activity</h3>
          </div>
          {liveActivity.length === 0 ? (
            <p className="text-xs text-stone-400">No activity recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {liveActivity.map((a) => (
                <div key={a.id} className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-stsn-cream flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Activity className="w-3.5 h-3.5 text-stsn-gold" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-stone-700 leading-snug">{a.description ?? a.activityType}</p>
                    <p className="text-[10px] font-mono text-stone-400">{a.userName ? `${a.userName} • ` : ""}{formatDateTime(a.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AppCard>
      </div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Detailed learning tracker: syllabus completion per course, the full earned-
 * certificate gallery, and the activity timeline. The at-a-glance academic
 * portfolio (identity, GPA, grades, ranks) lives on the student dashboard.
 */

import React, { useMemo } from "react";
import { BookOpen, GraduationCap, Activity, TrendingUp, Award, Download } from "lucide-react";
import AppCard from "../../../../components/common/AppCard";
import AppKpiCard from "../../../../components/common/AppKpiCard";
import AppEmptyState from "../../../../components/common/AppEmptyState";
import AppStatusBadge from "../../../../components/common/AppStatusBadge";
import type { LmsData } from "../../data/useLmsData";
import { ProgressBar, formatDate } from "../shared";

export default function StudentProgress({
  lms,
  onOpenCourse,
}: {
  lms: LmsData;
  onOpenCourse: (courseId: string) => void;
}) {
  const sid = lms.currentStudent?.id;

  const myEnrollments = useMemo(
    () => lms.enrollments.filter((e) => e.studentId === sid),
    [lms.enrollments, sid],
  );

  const myCertificates = useMemo(
    () =>
      lms.studentCertificates
        .filter((c) => c.studentId === sid)
        .sort((a, b) => (b.issuedAt ?? "").localeCompare(a.issuedAt ?? "")),
    [lms.studentCertificates, sid],
  );

  const myActivity = useMemo(
    () =>
      lms.activity
        .filter((a) => a.userId === sid)
        .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
        .slice(0, 10),
    [lms.activity, sid],
  );

  const ongoing = myEnrollments.filter((e) => e.enrollmentStatus === "Active");
  const completed = myEnrollments.filter((e) => e.enrollmentStatus === "Completed");
  const overall = lms.kpis.avgProgress;

  if (!sid) {
    return (
      <AppEmptyState
        icon={GraduationCap}
        title="No student record linked"
        description="This account is not linked to a student, so there is no learning progress to display."
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AppKpiCard label="Overall Progress" value={`${overall}%`} icon={TrendingUp} tone="brand" hint="Across enrolled courses" />
        <AppKpiCard label="Enrolled" value={myEnrollments.length} icon={BookOpen} tone="info" hint="Total courses" />
        <AppKpiCard label="Ongoing" value={ongoing.length} icon={Activity} tone="warning" hint="In progress" />
        <AppKpiCard label="Completed" value={completed.length} icon={GraduationCap} tone="success" hint="Finished courses" />
      </div>

      {/* Syllabus completion per course */}
      <AppCard tone="brand" className="p-5">
        <h3 className="text-sm font-bold text-stone-800 mb-3">Syllabus Completion</h3>
        {myEnrollments.length === 0 ? (
          <AppEmptyState
            icon={BookOpen}
            compact
            title="Not enrolled yet"
            description="Enroll in a course from the catalog to start tracking your progress."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {myEnrollments.map((e) => {
              const course = lms.courseById(e.courseId);
              const lessonCount = course ? lms.lessonsByCourse(course.id).length : 0;
              return (
                <button
                  key={e.id}
                  onClick={() => onOpenCourse(e.courseId)}
                  className="text-left rounded-xl border border-stone-100 bg-stone-50/50 p-4 hover:border-stsn-gold/40 hover:bg-white transition cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-bold text-stone-800 line-clamp-1">{course?.title ?? "Course"}</p>
                    <AppStatusBadge status={e.enrollmentStatus} />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-stone-500 mb-1">
                    <span>Started {formatDate(e.startedAt)} • {lessonCount} lessons</span>
                    <span>{Math.round(e.progressPercentage)}%</span>
                  </div>
                  <ProgressBar value={e.progressPercentage} />
                </button>
              );
            })}
          </div>
        )}
      </AppCard>

      {/* Earned certificates gallery (full) */}
      <AppCard tone="brand" className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Award className="w-4 h-4 text-stsn-gold" />
          <h3 className="text-sm font-bold text-stone-800">Earned Certificates</h3>
          <span className="text-[10px] font-mono text-stone-400">{myCertificates.length} earned</span>
        </div>
        {myCertificates.length === 0 ? (
          <AppEmptyState
            icon={Award}
            compact
            title="No certificates yet"
            description="Complete a course and pass its assessment to earn a certificate."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {myCertificates.map((cert) => {
              const course = lms.courseById(cert.courseId);
              return (
                <div
                  key={cert.id}
                  className="relative rounded-xl border border-stsn-gold/30 bg-gradient-to-br from-stsn-cream to-white p-4 overflow-hidden"
                >
                  <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full bg-stsn-gold/10" />
                  <div className="relative flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-stsn-gold/15 flex items-center justify-center flex-shrink-0">
                      <Award className="w-5 h-5 text-stsn-gold" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-stsn-brown-dark line-clamp-2">{cert.title ?? course?.title ?? "Certificate"}</p>
                      <p className="text-[10px] font-mono text-stone-400 mt-1">Issued {formatDate(cert.issuedAt)}</p>
                    </div>
                  </div>
                  {cert.certificateUrl && (
                    <a
                      href={cert.certificateUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="relative mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-stsn-brown hover:text-stsn-gold transition"
                    >
                      <Download className="w-3 h-3" /> Download
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </AppCard>

      {/* Recent activity */}
      <AppCard tone="brand" className="p-5">
        <h3 className="text-sm font-bold text-stone-800 mb-3">Recent Activity</h3>
        {myActivity.length === 0 ? (
          <p className="text-xs text-stone-400">No recent learning activity.</p>
        ) : (
          <div className="space-y-2">
            {myActivity.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-xl border border-stone-100 px-3 py-2">
                <div className="w-8 h-8 rounded-lg bg-stsn-cream flex items-center justify-center flex-shrink-0">
                  <Activity className="w-4 h-4 text-stsn-gold" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-stone-700 truncate">{a.description ?? a.activityType}</p>
                  <p className="text-[10px] font-mono text-stone-400">{formatDate(a.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </AppCard>
    </div>
  );
}

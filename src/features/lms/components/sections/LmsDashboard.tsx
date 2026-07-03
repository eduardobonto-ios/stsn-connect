/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react";
import {
  BookOpen,
  GraduationCap,
  TrendingUp,
  Award,
  Play,
  Compass,
  Activity,
  ArrowRight,
  CalendarClock,
  BarChart3,
  Clock,
} from "lucide-react";
import AppCard from "../../../../components/common/AppCard";
import AppKpiCard from "../../../../components/common/AppKpiCard";
import AppButton from "../../../../components/common/AppButton";
import type { LmsData } from "../../data/useLmsData";
import type { LmsSubPage } from "../../types";
import { ProgressBar, ProgressRing, MiniBarChart, formatDate, ASSESSMENT_TYPE_BADGE } from "../shared";

/** Whole days from now until `iso` (negative = overdue). */
function daysUntil(iso?: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const ms = d.getTime() - Date.now();
  return Math.ceil(ms / 86_400_000);
}

export default function LmsDashboard({
  lms,
  onNavigate,
  onOpenCourse,
}: {
  lms: LmsData;
  onNavigate: (tab: LmsSubPage) => void;
  onOpenCourse: (courseId: string) => void;
}) {
  const sid = lms.currentStudent?.id;
  const studentName = lms.currentStudent
    ? `${lms.currentStudent.firstName}`
    : "there";

  const myEnrollments = useMemo(
    () => lms.enrollments.filter((e) => e.studentId === sid),
    [lms.enrollments, sid],
  );
  const continueLearning = useMemo(
    () =>
      myEnrollments
        .filter((e) => e.enrollmentStatus === "Active")
        .sort((a, b) => (b.startedAt ?? "").localeCompare(a.startedAt ?? ""))
        .slice(0, 4),
    [myEnrollments],
  );
  const recommended = useMemo(() => {
    const enrolledIds = new Set(myEnrollments.map((e) => e.courseId));
    return lms.courses
      .filter((c) => c.status === "Published" && !enrolledIds.has(c.id))
      .slice(0, 4);
  }, [lms.courses, myEnrollments]);

  const recentActivity = useMemo(
    () =>
      [...lms.activity]
        .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
        .slice(0, 6),
    [lms.activity],
  );

  // Upcoming deadlines — published assessments with a due date, soonest first.
  const upcomingDeadlines = useMemo(
    () =>
      lms.assessments
        .filter((a) => a.status === "Published" && a.dueDate)
        .map((a) => ({ assessment: a, days: daysUntil(a.dueDate) }))
        .sort((a, b) => (a.assessment.dueDate ?? "").localeCompare(b.assessment.dueDate ?? ""))
        .slice(0, 5),
    [lms.assessments],
  );

  // Institutional progress — average enrollment progress grouped by category.
  const institutionalProgress = useMemo(() => {
    const byCat = new Map<string, { sum: number; count: number }>();
    for (const e of lms.enrollments) {
      const course = lms.courseById(e.courseId);
      const cat = lms.categoryById(course?.categoryId)?.name ?? "General";
      const cur = byCat.get(cat) ?? { sum: 0, count: 0 };
      cur.sum += e.progressPercentage ?? 0;
      cur.count += 1;
      byCat.set(cat, cur);
    }
    return Array.from(byCat.entries())
      .map(([label, { sum, count }]) => ({ label, value: count ? sum / count : 0 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [lms.enrollments, lms.courseById, lms.categoryById]);

  return (
    <div className="space-y-5">
      {/* Welcome banner with engagement ring */}
      <AppCard tone="brand" className="p-5 bg-gradient-to-br from-stsn-brown/[0.06] to-stsn-gold/[0.04]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-mono uppercase tracking-widest text-stsn-gold">Learning Management</p>
            <h2 className="text-xl font-display font-black text-stsn-brown-dark mt-1">Welcome back, {studentName}!</h2>
            <p className="text-xs text-stone-600 mt-1">Pick up where you left off or explore new courses.</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <AppButton variant="primary" size="sm" leftIcon={Compass} onClick={() => onNavigate("courses")}>Browse Courses</AppButton>
              <AppButton variant="secondary" size="sm" leftIcon={TrendingUp} onClick={() => onNavigate("progress")}>My Progress</AppButton>
            </div>
          </div>
          <div className="flex items-center gap-3 pr-1">
            <ProgressRing value={lms.kpis.avgProgress} size={104} label="Engagement" />
            <div className="text-right">
              <p className="text-[9px] font-mono uppercase tracking-widest text-stone-400">Current Status</p>
              <p className="text-sm font-black text-stsn-brown-dark mt-0.5">
                {lms.kpis.avgProgress >= 75 ? "On Track" : lms.kpis.avgProgress >= 40 ? "Keep Going" : "Getting Started"}
              </p>
              <p className="text-[10px] text-stone-500 mt-0.5">{lms.kpis.myActiveCount} active • {lms.kpis.myCompletedCount} done</p>
            </div>
          </div>
        </div>
      </AppCard>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AppKpiCard label="Active Courses" value={lms.kpis.myActiveCount} icon={BookOpen} tone="info" hint="Currently enrolled" />
        <AppKpiCard label="Completion Rate" value={`${lms.kpis.completionRate}%`} icon={GraduationCap} tone="success" hint="Courses finished" />
        <AppKpiCard label="Avg. Progress" value={`${lms.kpis.avgProgress}%`} icon={TrendingUp} tone="brand" hint="Across your courses" />
        <AppKpiCard label="Available Courses" value={lms.kpis.publishedCourses} icon={Award} tone="warning" hint="Published in catalog" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
        {/* Left column */}
        <div className="space-y-4">
          {/* Active enrollments */}
          <AppCard tone="brand" className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-stone-800">Active Enrollments</h3>
              <button onClick={() => onNavigate("courses")} className="text-[11px] font-bold text-stsn-brown hover:text-stsn-gold flex items-center gap-1 cursor-pointer">
                Browse Catalog <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            {continueLearning.length === 0 ? (
              <p className="text-xs text-stone-400">You have no active courses. Enroll from the catalog to get started.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {continueLearning.map((e) => {
                  const course = lms.courseById(e.courseId);
                  const lessons = course ? lms.lessonsByCourse(course.id) : [];
                  return (
                    <button
                      key={e.id}
                      onClick={() => onOpenCourse(e.courseId)}
                      className="text-left rounded-xl border border-stone-100 bg-stone-50/50 p-3 hover:border-stsn-gold/40 hover:bg-white transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-stsn-brown/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {course?.thumbnailUrl ? (
                            <img src={course.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Play className="w-5 h-5 text-stsn-brown/60" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-stone-800 truncate">{course?.title ?? "Course"}</p>
                          <p className="text-[10px] font-mono text-stone-400">{lessons.length} lessons • {course?.difficulty ?? "—"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <ProgressBar value={e.progressPercentage} className="flex-1" />
                        <span className="text-[10px] font-mono text-stone-500">{Math.round(e.progressPercentage)}%</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </AppCard>

          {/* Institutional progress chart */}
          <AppCard tone="brand" className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-stsn-gold" />
              <h3 className="text-sm font-bold text-stone-800">Institutional Progress</h3>
              <span className="text-[10px] font-mono text-stone-400">Semester-to-date, by subject</span>
            </div>
            {institutionalProgress.length === 0 ? (
              <p className="text-xs text-stone-400">No enrollment data yet.</p>
            ) : (
              <MiniBarChart data={institutionalProgress} />
            )}
          </AppCard>

          {/* Recommended */}
          <AppCard tone="brand" className="p-5">
            <h3 className="text-sm font-bold text-stone-800 mb-3">Recommended for You</h3>
            {recommended.length === 0 ? (
              <p className="text-xs text-stone-400">No new courses to recommend right now.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recommended.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onOpenCourse(c.id)}
                    className="text-left rounded-xl border border-stone-100 bg-stone-50/50 p-3 hover:border-stsn-gold/40 hover:bg-white transition cursor-pointer"
                  >
                    <p className="text-[9px] font-mono uppercase tracking-widest text-stsn-gold mb-1">
                      {lms.categoryById(c.categoryId)?.name ?? "Course"}
                    </p>
                    <p className="text-sm font-bold text-stone-800 line-clamp-2">{c.title}</p>
                    <p className="text-[10px] text-stone-500 mt-1">{c.difficulty}</p>
                  </button>
                ))}
              </div>
            )}
          </AppCard>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Upcoming deadlines */}
          <AppCard tone="brand" className="p-5 h-fit">
            <div className="flex items-center gap-2 mb-3">
              <CalendarClock className="w-4 h-4 text-stsn-gold" />
              <h3 className="text-sm font-bold text-stone-800">Upcoming Deadlines</h3>
            </div>
            {upcomingDeadlines.length === 0 ? (
              <p className="text-xs text-stone-400">No upcoming deadlines. You're all caught up.</p>
            ) : (
              <div className="space-y-2">
                {upcomingDeadlines.map(({ assessment: a, days }) => {
                  const overdue = days != null && days < 0;
                  const soon = days != null && days >= 0 && days <= 3;
                  return (
                    <button
                      key={a.id}
                      onClick={() => onNavigate("assessments")}
                      className="w-full text-left flex items-center gap-3 rounded-xl border border-stone-100 bg-stone-50/50 px-3 py-2.5 hover:border-stsn-gold/40 hover:bg-white transition cursor-pointer"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border ${ASSESSMENT_TYPE_BADGE[a.assessmentType]}`}>{a.assessmentType}</span>
                          <p className="text-xs font-bold text-stone-800 truncate">{a.title}</p>
                        </div>
                        <p className="text-[10px] font-mono text-stone-400 mt-0.5">{formatDate(a.dueDate)}</p>
                      </div>
                      <span className={`text-[10px] font-bold flex items-center gap-1 flex-shrink-0 ${overdue ? "text-rose-600" : soon ? "text-amber-600" : "text-stone-500"}`}>
                        <Clock className="w-3 h-3" />
                        {days == null ? "—" : overdue ? `${Math.abs(days)}d late` : days === 0 ? "Today" : `${days}d`}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </AppCard>

          {/* Recent activity */}
          <AppCard tone="brand" className="p-5 h-fit">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-stsn-gold" />
              <h3 className="text-sm font-bold text-stone-800">Recent Activity</h3>
            </div>
            {recentActivity.length === 0 ? (
              <p className="text-xs text-stone-400">No recent activity.</p>
            ) : (
              <div className="space-y-2">
                {recentActivity.map((a) => (
                  <div key={a.id} className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-stsn-cream flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Activity className="w-3.5 h-3.5 text-stsn-gold" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-stone-700 leading-snug">{a.description ?? a.activityType}</p>
                      <p className="text-[10px] font-mono text-stone-400">{a.userName ? `${a.userName} • ` : ""}{formatDate(a.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AppCard>
        </div>
      </div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Student-only LMS dashboard — an academic performance portfolio: identity
 * header, GPA trajectory, program completion, course performance (with class
 * rank), and earned certificates. All metrics derive from live LMS data
 * (results, enrollments, lesson progress, certificates); no dedicated tables.
 */

import React, { useMemo } from "react";
import {
  Download, GraduationCap, TrendingUp, Award, Plus, BookOpen,
  CalendarDays, IdCard, ShieldCheck, ExternalLink, Share2, ArrowRight,
} from "lucide-react";
import AppCard from "../../../../components/common/AppCard";
import AppButton from "../../../../components/common/AppButton";
import AppEmptyState from "../../../../components/common/AppEmptyState";
import type { LmsData } from "../../data/useLmsData";
import type { LmsSubPage } from "../../types";
import { ProgressBar, ProgressRing, LineChart, formatDate } from "../shared";

/** Convert a 0–100 percentage to a 4.0-scale GPA. */
const pctToGpa = (pct: number) => Math.round((pct / 100) * 4 * 100) / 100;

/** Map a 0–100 percentage to a simple letter grade. */
function letterGrade(pct: number | null): string {
  if (pct == null) return "—";
  if (pct >= 90) return "A";
  if (pct >= 85) return "B+";
  if (pct >= 80) return "B";
  if (pct >= 75) return "C+";
  if (pct >= 70) return "C";
  if (pct >= 60) return "D";
  return "F";
}

export default function StudentDashboard({
  lms,
  onNavigate,
  onOpenCourse,
  onToast,
}: {
  lms: LmsData;
  onNavigate: (tab: LmsSubPage) => void;
  onOpenCourse: (courseId: string) => void;
  onToast: (msg: string, type?: "success" | "error") => void;
}) {
  const student = lms.currentStudent;
  const sid = student?.id;

  const myEnrollments = useMemo(
    () => lms.enrollments.filter((e) => e.studentId === sid),
    [lms.enrollments, sid],
  );

  const myResults = useMemo(
    () =>
      lms.results
        .filter((r) => r.studentId === sid)
        .sort((a, b) => (a.gradedAt ?? "").localeCompare(b.gradedAt ?? "")),
    [lms.results, sid],
  );

  const myCertificates = useMemo(
    () =>
      lms.studentCertificates
        .filter((c) => c.studentId === sid)
        .sort((a, b) => (b.issuedAt ?? "").localeCompare(a.issuedAt ?? "")),
    [lms.studentCertificates, sid],
  );

  // ── GPA (cumulative + trajectory) ──────────────────────────────────────────
  const cumulativeGpa = useMemo(() => {
    if (myResults.length === 0) return null;
    const avg = myResults.reduce((s, r) => s + r.percentage, 0) / myResults.length;
    return pctToGpa(avg);
  }, [myResults]);

  const gpaTrajectory = useMemo(
    () =>
      myResults.slice(-8).map((r) => ({
        label: new Date(r.gradedAt ?? Date.now()).toLocaleDateString("en-US", { month: "short" }),
        value: pctToGpa(r.percentage),
      })),
    [myResults],
  );

  // ── program completion (lessons across enrolled courses) ───────────────────
  const completion = useMemo(() => {
    const courseIds = new Set(myEnrollments.map((e) => e.courseId));
    const totalLessons = lms.lessons.filter((l) => courseIds.has(l.courseId)).length;
    const doneLessons = lms.lessonProgress.filter(
      (p) => p.studentId === sid && courseIds.has(p.courseId) && p.status === "Completed",
    ).length;
    const pct = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;
    return { pct, doneLessons, totalLessons };
  }, [myEnrollments, lms.lessons, lms.lessonProgress, sid]);

  // ── per-course grade + class rank ──────────────────────────────────────────
  const courseGrade = useMemo(() => {
    return (courseId: string): number | null => {
      const ids = new Set(lms.assessments.filter((a) => a.courseId === courseId).map((a) => a.id));
      const rs = myResults.filter((r) => ids.has(r.assessmentId));
      if (rs.length === 0) return null;
      return Math.round(rs.reduce((s, r) => s + r.percentage, 0) / rs.length);
    };
  }, [lms.assessments, myResults]);

  const courseRank = useMemo(() => {
    return (courseId: string): { rank: number; total: number } => {
      const roster = lms.enrollments
        .filter((e) => e.courseId === courseId)
        .sort((a, b) => (b.progressPercentage ?? 0) - (a.progressPercentage ?? 0));
      const idx = roster.findIndex((e) => e.studentId === sid);
      return { rank: idx >= 0 ? idx + 1 : roster.length, total: roster.length };
    };
  }, [lms.enrollments, sid]);

  // ── identity ───────────────────────────────────────────────────────────────
  const enrolledSince = useMemo(() => {
    const earliest = myEnrollments
      .map((e) => e.startedAt)
      .filter(Boolean)
      .sort()[0];
    return earliest ?? null;
  }, [myEnrollments]);

  const academicStatus = cumulativeGpa == null
    ? "New Learner"
    : cumulativeGpa >= 3.5
      ? "Honors"
      : cumulativeGpa >= 3.0
        ? "Good Standing"
        : "Regular";

  if (!student) {
    return (
      <AppEmptyState
        icon={GraduationCap}
        title="No student record linked"
        description="This account is not linked to a student, so there is no academic portfolio to display."
      />
    );
  }

  const initials = `${student.firstName?.[0] ?? ""}${student.lastName?.[0] ?? ""}`.toUpperCase();
  const topCertificates = myCertificates.slice(0, 3);

  return (
    <div className="space-y-5">
      {/* Identity header */}
      <AppCard tone="brand" className="p-5 border-l-4 border-l-stsn-brown">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-stsn-brown/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-display font-black text-stsn-brown">{initials || "?"}</span>
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-display font-black text-stsn-brown-dark leading-tight truncate">
                {student.firstName} {student.lastName}
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-[11px] text-stone-500">
                <span className="flex items-center gap-1"><IdCard className="w-3.5 h-3.5 text-stsn-gold" /> {student.studentNo}</span>
                <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-stsn-gold" /> Academic Status: <span className="font-bold text-stone-700">{academicStatus}</span></span>
                <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5 text-stsn-gold" /> Enrolled: {formatDate(enrolledSince)}</span>
              </div>
            </div>
          </div>
          <AppButton variant="primary" size="sm" leftIcon={Download} onClick={() => onToast("Your academic transcript is being prepared.")}>
            Transcript
          </AppButton>
        </div>
      </AppCard>

      {/* Academic performance + program completion */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <AppCard tone="brand" className="p-5">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <h3 className="text-sm font-bold text-stone-800">Academic Performance</h3>
              <p className="text-[10px] font-mono uppercase tracking-widest text-stone-400 mt-0.5">GPA Trajectory • Semester Overview</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-display font-black text-stsn-brown-dark leading-none">{cumulativeGpa != null ? cumulativeGpa.toFixed(2) : "—"}</p>
              <p className="text-[10px] font-mono uppercase tracking-widest text-stone-400 mt-1">Cumulative GPA</p>
            </div>
          </div>
          {gpaTrajectory.length === 0 ? (
            <div className="h-[180px] flex items-center justify-center">
              <p className="text-xs text-stone-400">Complete an assessment to start building your GPA trajectory.</p>
            </div>
          ) : (
            <LineChart data={gpaTrajectory} max={4} />
          )}
        </AppCard>

        <AppCard tone="brand" className="p-5 flex flex-col items-center text-center h-fit">
          <p className="text-[10px] font-mono uppercase tracking-widest text-stone-400 mb-3">Program Completion</p>
          <ProgressRing
            value={completion.pct}
            size={148}
            strokeWidth={12}
            centerText={
              <>
                <span className="text-2xl font-black text-stsn-brown-dark">{completion.pct}%</span>
                <span className="text-[9px] font-mono text-stone-400 mt-0.5">{completion.doneLessons}/{completion.totalLessons} lessons</span>
              </>
            }
          />
          <p className="text-xs text-stone-500 mt-4">
            {completion.pct >= 75
              ? "On track to graduate with high distinctions."
              : completion.pct >= 40
                ? "Steady progress — keep completing your lessons."
                : "Just getting started on your program."}
          </p>
        </AppCard>
      </div>

      {/* Course performance + certificates */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        {/* Course performance */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-stone-800">Course Performance</h3>
            <button onClick={() => onNavigate("progress")} className="text-[11px] font-bold text-stsn-brown hover:text-stsn-gold flex items-center gap-1 cursor-pointer">
              View Progress <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {myEnrollments.map((e) => {
              const course = lms.courseById(e.courseId);
              const grade = courseGrade(e.courseId);
              const { rank, total } = courseRank(e.courseId);
              return (
                <button
                  key={e.id}
                  onClick={() => onOpenCourse(e.courseId)}
                  className="text-left rounded-xl border border-stone-200/70 bg-white p-4 hover:border-stsn-gold/40 hover:shadow-md transition cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-9 h-9 rounded-xl bg-stsn-brown/10 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-4.5 h-4.5 text-stsn-brown/60" />
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-display font-black leading-none ${grade == null ? "text-stone-300" : "text-stsn-brown-dark"}`}>{grade == null ? "—" : `${grade}%`}</p>
                      <p className="text-[9px] font-mono uppercase tracking-widest text-stone-400 mt-0.5">Grade {letterGrade(grade)}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-stone-800 mt-3 line-clamp-1">{course?.title ?? "Course"}</p>
                  <p className="text-[10px] font-mono text-stone-400 mt-0.5">Rank: {rank} / {total} {total === 1 ? "student" : "students"}</p>
                  <div className="mt-2.5">
                    <div className="flex items-center justify-between text-[9px] font-mono text-stone-500 mb-1">
                      <span>Syllabus Progress</span>
                      <span>{Math.round(e.progressPercentage)}%</span>
                    </div>
                    <ProgressBar value={e.progressPercentage} />
                  </div>
                </button>
              );
            })}

            {/* Enroll in elective tile */}
            <button
              onClick={() => onNavigate("courses")}
              className="rounded-xl border-2 border-dashed border-stone-200 bg-stone-50/40 p-4 flex flex-col items-center justify-center gap-2 text-stone-400 hover:border-stsn-gold/50 hover:text-stsn-brown transition cursor-pointer min-h-[130px]"
            >
              <div className="w-9 h-9 rounded-full bg-white border border-stone-200 flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold">Enroll in elective course</span>
            </button>
          </div>
        </div>

        {/* Earned certificates */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-stone-800 flex items-center gap-2">
              <Award className="w-4 h-4 text-stsn-gold" /> Earned Certificates
            </h3>
            {myCertificates.length > 0 && (
              <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-stsn-brown/10 text-stsn-brown">{myCertificates.length} total</span>
            )}
          </div>
          {myCertificates.length === 0 ? (
            <AppCard tone="brand" className="p-5">
              <AppEmptyState
                icon={Award}
                compact
                title="No certificates yet"
                description="Pass a course assessment to earn your first certificate."
              />
            </AppCard>
          ) : (
            <div className="space-y-2.5">
              {topCertificates.map((cert) => {
                const course = lms.courseById(cert.courseId);
                return (
                  <AppCard key={cert.id} tone="brand" className="p-3.5">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-stsn-gold/15 flex items-center justify-center flex-shrink-0">
                        <Award className="w-4.5 h-4.5 text-stsn-gold" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-stsn-brown-dark line-clamp-1">{cert.title ?? course?.title ?? "Certificate"}</p>
                        <p className="text-[10px] font-mono text-stone-400 mt-0.5">Issued {formatDate(cert.issuedAt)}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          {cert.certificateUrl ? (
                            <a href={cert.certificateUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] font-bold text-stsn-brown hover:text-stsn-gold transition">
                              <ExternalLink className="w-3 h-3" /> View Credential
                            </a>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-stone-400">
                              <ExternalLink className="w-3 h-3" /> View Credential
                            </span>
                          )}
                          <a
                            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(cert.certificateUrl ?? "https://stsn.edu")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-stone-400 hover:text-stsn-brown transition"
                          >
                            <Share2 className="w-3 h-3" /> Share
                          </a>
                        </div>
                      </div>
                    </div>
                  </AppCard>
                );
              })}
              {myCertificates.length > topCertificates.length && (
                <AppButton variant="secondary" size="sm" fullWidth leftIcon={TrendingUp} onClick={() => onNavigate("progress")}>
                  Show All {myCertificates.length} Certificates
                </AppButton>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

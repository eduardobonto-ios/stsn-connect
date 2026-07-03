/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react";
import { CalendarClock, Play, Lightbulb, ListChecks, Trophy, Percent } from "lucide-react";
import AppCard from "../../../../components/common/AppCard";
import AppButton from "../../../../components/common/AppButton";
import AppKpiCard from "../../../../components/common/AppKpiCard";
import type { LmsData } from "../../data/useLmsData";
import { ASSESSMENT_TYPE_BADGE, formatDateTime } from "../shared";
import { useAssessmentRunner, AssessmentRunnerView } from "./assessmentRunner";

const EXAM_TIPS = [
  "Read every question carefully before answering.",
  "Flag tricky items and revisit them before submitting.",
  "Watch the timer — answer what you know first.",
  "Review your answers before the final submission.",
];

export default function ExamCenter({
  lms,
  onToast,
}: {
  lms: LmsData;
  onToast: (msg: string, type?: "success" | "error") => void;
}) {
  const runner = useAssessmentRunner(lms, onToast);

  const published = useMemo(
    () => lms.assessments.filter((a) => a.status === "Published"),
    [lms.assessments],
  );
  const exams = useMemo(
    () => published.filter((a) => a.assessmentType === "Exam" || a.assessmentType === "Quiz"),
    [published],
  );

  const upcoming = useMemo(
    () =>
      exams
        .filter((a) => {
          const attempted = lms.attemptsFor(a.id).length > 0;
          const notOverdue = !a.dueDate || new Date(a.dueDate).getTime() >= Date.now();
          return !attempted && notOverdue;
        })
        .sort((x, y) => (x.dueDate ?? "").localeCompare(y.dueDate ?? "")),
    [exams, lms],
  );

  const myResults = useMemo(
    () =>
      lms.results
        .filter((r) => r.studentId === lms.currentStudent?.id)
        .sort((a, b) => (b.gradedAt ?? "").localeCompare(a.gradedAt ?? ""))
        .slice(0, 6),
    [lms.results, lms.currentStudent?.id],
  );

  const completedCount = useMemo(
    () => lms.attempts.filter((t) => t.studentId === lms.currentStudent?.id && t.status !== "InProgress").length,
    [lms.attempts, lms.currentStudent?.id],
  );

  const avgScore = useMemo(() => {
    const rs = lms.results.filter((r) => r.studentId === lms.currentStudent?.id);
    return rs.length ? Math.round(rs.reduce((s, r) => s + r.percentage, 0) / rs.length) : 0;
  }, [lms.results, lms.currentStudent?.id]);

  if (runner.state.mode !== "list") {
    return <AssessmentRunnerView runner={runner} lms={lms} onToast={onToast} />;
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AppKpiCard label="Avg. Score" value={`${avgScore}%`} icon={Percent} tone="brand" hint="Across your results" />
        <AppKpiCard label="Available" value={exams.length} icon={ListChecks} tone="info" hint="Quizzes & exams" />
        <AppKpiCard label="Upcoming" value={upcoming.length} icon={CalendarClock} tone="warning" hint="Not yet taken" />
        <AppKpiCard label="Completed" value={completedCount} icon={Trophy} tone="success" hint="Your attempts" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div className="space-y-4">
          {/* Upcoming */}
          <AppCard tone="brand" className="p-5">
            <h3 className="text-sm font-bold text-stone-800 mb-3">Upcoming Examinations</h3>
            {upcoming.length === 0 ? (
              <p className="text-xs text-stone-400">No upcoming exams. You're all caught up.</p>
            ) : (
              <div className="space-y-2">
                {upcoming.map((a) => (
                  <div key={a.id} className="flex items-center justify-between gap-3 rounded-xl border border-stone-100 bg-stone-50/50 p-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${ASSESSMENT_TYPE_BADGE[a.assessmentType]}`}>{a.assessmentType}</span>
                        <p className="text-sm font-bold text-stone-800 truncate">{a.title}</p>
                      </div>
                      <p className="text-[10px] font-mono text-stone-500 mt-0.5">
                        {a.dueDate ? `Due ${formatDateTime(a.dueDate)}` : "No due date"} • {a.totalPoints} pts{a.timeLimitMinutes > 0 ? ` • ${a.timeLimitMinutes} min` : ""}
                      </p>
                    </div>
                    <AppButton variant="primary" size="sm" leftIcon={Play} onClick={() => runner.startExam(a)}>Start</AppButton>
                  </div>
                ))}
              </div>
            )}
          </AppCard>

          {/* Recent results */}
          <AppCard tone="brand" className="p-5">
            <h3 className="text-sm font-bold text-stone-800 mb-3">Recent Results</h3>
            {myResults.length === 0 ? (
              <p className="text-xs text-stone-400">No results yet. Take an exam to see your scores here.</p>
            ) : (
              <div className="space-y-2">
                {myResults.map((r) => {
                  const a = lms.assessmentById(r.assessmentId);
                  return (
                    <button
                      key={r.id}
                      onClick={() => runner.viewResult(r.assessmentId, r.attemptId)}
                      className="w-full text-left flex items-center justify-between gap-3 rounded-xl border border-stone-100 p-3 hover:border-stsn-gold/40 hover:bg-white transition cursor-pointer"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-stone-800 truncate">{a?.title ?? "Assessment"}</p>
                        <p className={`text-[10px] font-bold ${r.passed ? "text-emerald-600" : "text-rose-600"}`}>
                          {r.gradedBy == null ? "Pending review" : r.passed ? "Passed" : "Did not pass"}
                        </p>
                      </div>
                      <span className="text-lg font-display font-black text-stsn-brown flex-shrink-0">{r.percentage}%</span>
                    </button>
                  );
                })}
              </div>
            )}
          </AppCard>
        </div>

        {/* Exam tips */}
        <AppCard tone="brand" className="p-5 h-fit">
          <h3 className="text-sm font-bold text-stone-800 mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-stsn-gold" /> Exam Tips
          </h3>
          <ul className="space-y-2">
            {EXAM_TIPS.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-stone-600">
                <span className="w-5 h-5 rounded-full bg-stsn-cream text-stsn-brown font-bold text-[10px] flex items-center justify-center flex-shrink-0">{i + 1}</span>
                {tip}
              </li>
            ))}
          </ul>
        </AppCard>
      </div>
    </div>
  );
}

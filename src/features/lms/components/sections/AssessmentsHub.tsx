/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import { ClipboardList, Play, Eye, RotateCcw, CalendarClock, ListTodo, CheckCircle2, Award, Percent } from "lucide-react";
import AppCard from "../../../../components/common/AppCard";
import AppKpiCard from "../../../../components/common/AppKpiCard";
import AppButton from "../../../../components/common/AppButton";
import AppEmptyState from "../../../../components/common/AppEmptyState";
import AppSearchInput from "../../../../components/common/AppSearchInput";
import AppStatusBadge from "../../../../components/common/AppStatusBadge";
import type { LmsData } from "../../data/useLmsData";
import type { LmsAssessment } from "../../types";
import { ASSESSMENT_TYPE_BADGE, formatDateTime } from "../shared";
import { useAssessmentRunner, AssessmentRunnerView } from "./assessmentRunner";

type HubTab = "all" | "upcoming" | "completed" | "missed" | "graded";

const HUB_TABS: { id: HubTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "upcoming", label: "Upcoming" },
  { id: "completed", label: "Completed" },
  { id: "missed", label: "Missed" },
  { id: "graded", label: "Graded" },
];

/** Per-student state used for the hub tabs. */
type StudentState = "Available" | "Upcoming" | "Submitted" | "Graded" | "Missed";

export default function AssessmentsHub({
  lms,
  onToast,
}: {
  lms: LmsData;
  onToast: (msg: string, type?: "success" | "error") => void;
}) {
  const runner = useAssessmentRunner(lms, onToast);
  const [tab, setTab] = useState<HubTab>("all");
  const [search, setSearch] = useState("");

  const published = useMemo(
    () => lms.assessments.filter((a) => a.status === "Published"),
    [lms.assessments],
  );

  const stateFor = (a: LmsAssessment): StudentState => {
    const attempts = lms.attemptsFor(a.id);
    const result = lms.latestResultFor(a.id);
    if (result && result.gradedBy != null) return "Graded";
    if (attempts.some((t) => t.status === "Submitted" || t.status === "Graded")) return "Submitted";
    const overdue = a.dueDate && new Date(a.dueDate).getTime() < Date.now();
    if (overdue && attempts.length === 0) return "Missed";
    if (a.dueDate) return "Upcoming";
    return "Available";
  };

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return published
      .map((a) => ({ a, state: stateFor(a) }))
      .filter(({ a }) => !q || a.title.toLowerCase().includes(q))
      .filter(({ state }) => {
        switch (tab) {
          case "upcoming": return state === "Upcoming" || state === "Available";
          case "completed": return state === "Submitted" || state === "Graded";
          case "missed": return state === "Missed";
          case "graded": return state === "Graded";
          default: return true;
        }
      })
      .sort((x, y) => (x.a.dueDate ?? "").localeCompare(y.a.dueDate ?? ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [published, tab, search, lms.attempts, lms.results]);

  const summary = useMemo(() => {
    const states = published.map((a) => stateFor(a));
    const toDo = states.filter((s) => s === "Available" || s === "Upcoming").length;
    const submitted = states.filter((s) => s === "Submitted" || s === "Graded").length;
    const graded = states.filter((s) => s === "Graded").length;
    const myResults = lms.results.filter((r) => r.studentId === lms.currentStudent?.id);
    const avg = myResults.length
      ? Math.round(myResults.reduce((s, r) => s + r.percentage, 0) / myResults.length)
      : 0;
    return { toDo, submitted, graded, avg };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [published, lms.attempts, lms.results, lms.currentStudent?.id]);

  if (runner.state.mode !== "list") {
    return <AssessmentRunnerView runner={runner} lms={lms} onToast={onToast} />;
  }

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AppKpiCard label="To Do" value={summary.toDo} icon={ListTodo} tone="warning" hint="Available & upcoming" />
        <AppKpiCard label="Submitted" value={summary.submitted} icon={CheckCircle2} tone="info" hint="Completed by you" />
        <AppKpiCard label="Graded" value={summary.graded} icon={Award} tone="success" hint="Results released" />
        <AppKpiCard label="Avg. Score" value={`${summary.avg}%`} icon={Percent} tone="brand" hint="Across your results" />
      </div>

      {/* Tabs + search */}
      <AppCard tone="brand" className="flex flex-wrap items-center gap-3 p-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          {HUB_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                tab === t.id ? "bg-stsn-brown text-white" : "bg-white text-stone-500 border border-stone-200 hover:border-stsn-brown/40"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <AppSearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search assessments…"
          wrapperClassName="min-w-[200px] flex-1"
        />
      </AppCard>

      {rows.length === 0 ? (
        <AppEmptyState icon={ClipboardList} title="No assessments" description="Nothing to show in this view yet." />
      ) : (
        <div className="space-y-3">
          {rows.map(({ a, state }) => {
            const course = lms.courseById(a.courseId);
            const result = lms.latestResultFor(a.id);
            const latestAttempt = lms.attemptsFor(a.id)[0];
            const canTake = state === "Available" || state === "Upcoming";
            return (
              <AppCard key={a.id} tone="brand" className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${ASSESSMENT_TYPE_BADGE[a.assessmentType]}`}>
                        {a.assessmentType}
                      </span>
                      <AppStatusBadge status={state} />
                    </div>
                    <h3 className="text-sm font-bold text-stone-800 truncate">{a.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-stone-500">
                      {course && <span>{course.title}</span>}
                      {a.dueDate && <span className="flex items-center gap-1"><CalendarClock className="w-3 h-3" />Due {formatDateTime(a.dueDate)}</span>}
                      <span>{a.totalPoints} pts</span>
                      {a.timeLimitMinutes > 0 && <span>{a.timeLimitMinutes} min</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {result && (
                      <span className="text-sm font-display font-black text-stsn-brown">{result.percentage}%</span>
                    )}
                    {(state === "Submitted" || state === "Graded") && latestAttempt ? (
                      <AppButton variant="secondary" size="sm" leftIcon={Eye} onClick={() => runner.viewResult(a.id, latestAttempt.id)}>
                        View Results
                      </AppButton>
                    ) : canTake ? (
                      <AppButton variant="primary" size="sm" leftIcon={Play} onClick={() => runner.startExam(a)}>
                        Start
                      </AppButton>
                    ) : state === "Missed" ? (
                      <span className="text-[11px] font-bold text-rose-600">Missed</span>
                    ) : null}
                    {(state === "Submitted" || state === "Graded") && a.allowRetake && latestAttempt && (
                      <AppButton variant="ghost" size="sm" leftIcon={RotateCcw} onClick={() => runner.startExam(a)}>
                        Retake
                      </AppButton>
                    )}
                  </div>
                </div>
              </AppCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

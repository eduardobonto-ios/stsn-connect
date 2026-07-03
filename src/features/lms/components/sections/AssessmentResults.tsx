/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react";
import {
  ArrowLeft, CheckCircle2, XCircle, Clock, RotateCcw, Award, MinusCircle, BarChart3,
} from "lucide-react";
import AppCard from "../../../../components/common/AppCard";
import AppButton from "../../../../components/common/AppButton";
import AppKpiCard from "../../../../components/common/AppKpiCard";
import type { LmsData } from "../../data/useLmsData";
import type { LmsAssessment, LmsAttempt } from "../../types";
import { formatClock, ProgressBar, QUESTION_TYPE_LABEL } from "../shared";

export default function AssessmentResults({
  assessment,
  attempt,
  lms,
  onBack,
  onRetake,
}: {
  assessment: LmsAssessment;
  attempt: LmsAttempt;
  lms: LmsData;
  onBack: () => void;
  onRetake?: () => void;
}) {
  const result = lms.resultForAttempt(attempt.id);
  const questions = useMemo(() => lms.questionsByAssessment(assessment.id), [lms, assessment.id]);
  const answers = useMemo(() => lms.answersByAttempt(attempt.id), [lms, attempt.id]);

  const percentage = result?.percentage ?? attempt.percentage;
  const passed = result?.passed ?? percentage >= assessment.passingScore;
  const correctCount = answers.filter((a) => a.isCorrect === true).length;
  const incorrectCount = answers.filter((a) => a.isCorrect === false).length;
  const priorAttempts = lms.attemptsFor(assessment.id).length;
  const canRetake = assessment.allowRetake && priorAttempts < assessment.maxAttempts;

  // Performance breakdown — mastery per question type.
  const breakdown = useMemo(() => {
    const byType = new Map<string, { earned: number; total: number }>();
    for (const q of questions) {
      const ans = answers.find((a) => a.questionId === q.id);
      const label = QUESTION_TYPE_LABEL[q.questionType];
      const cur = byType.get(label) ?? { earned: 0, total: 0 };
      cur.earned += ans?.pointsAwarded ?? 0;
      cur.total += q.points;
      byType.set(label, cur);
    }
    return Array.from(byType.entries())
      .map(([label, { earned, total }]) => ({ label, pct: total ? Math.round((earned / total) * 100) : 0, earned, total }))
      .sort((a, b) => b.pct - a.pct);
  }, [questions, answers]);

  const course = assessment.courseId ? lms.courseById(assessment.courseId) : undefined;

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stsn-brown transition cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Score banner */}
      <AppCard tone="brand" className={`p-6 text-center ${passed ? "bg-emerald-50/60" : "bg-rose-50/60"}`}>
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${passed ? "bg-emerald-100" : "bg-rose-100"}`}>
          {passed ? <Award className="w-8 h-8 text-emerald-600" /> : <XCircle className="w-8 h-8 text-rose-600" />}
        </div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-stone-400">{assessment.title}</p>
        <h2 className={`text-4xl font-display font-black mt-1 ${passed ? "text-emerald-600" : "text-rose-600"}`}>{percentage}%</h2>
        <p className={`text-sm font-bold mt-1 ${passed ? "text-emerald-700" : "text-rose-700"}`}>
          {result && result.gradedBy == null ? "Pending Review" : passed ? "Passed" : "Did Not Pass"}
        </p>
        <p className="text-[11px] text-stone-500 mt-1">Passing score: {assessment.passingScore}%</p>
      </AppCard>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AppKpiCard label="Score" value={`${result?.score ?? attempt.score}/${assessment.totalPoints}`} icon={Award} tone="brand" />
        <AppKpiCard label="Correct" value={correctCount} icon={CheckCircle2} tone="success" />
        <AppKpiCard label="Incorrect" value={incorrectCount} icon={XCircle} tone="danger" />
        <AppKpiCard label="Time Spent" value={formatClock(attempt.timeSpentSeconds)} icon={Clock} tone="neutral" />
      </div>

      {/* Performance breakdown + certification readiness */}
      {(breakdown.length > 0 || passed) && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-3">
          {breakdown.length > 0 && (
            <AppCard tone="brand" className="p-5">
              <h3 className="text-sm font-bold text-stone-800 mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-stsn-gold" /> Performance Breakdown
              </h3>
              <div className="space-y-3">
                {breakdown.map((b) => (
                  <div key={b.label}>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-semibold text-stone-600">{b.label}</span>
                      <span className="font-mono text-stone-500">{b.earned}/{b.total} pts • {b.pct}%</span>
                    </div>
                    <ProgressBar value={b.pct} />
                  </div>
                ))}
              </div>
            </AppCard>
          )}

          {passed && (result?.gradedBy != null) && (
            <AppCard tone="brand" className="p-5 bg-gradient-to-br from-stsn-cream to-white border border-stsn-gold/30 h-fit">
              <div className="w-11 h-11 rounded-xl bg-stsn-gold/15 flex items-center justify-center mb-3">
                <Award className="w-6 h-6 text-stsn-gold" />
              </div>
              <h3 className="text-sm font-bold text-stsn-brown-dark">Certification Ready</h3>
              <p className="text-xs text-stone-600 mt-1">
                {course
                  ? `You've met the passing requirement for “${course.title}”. A certificate is issued automatically once the course is complete.`
                  : "You've met the passing requirement for this assessment."}
              </p>
            </AppCard>
          )}
        </div>
      )}

      {/* Instructor feedback */}
      {result?.feedback && (
        <AppCard tone="brand" className="p-4">
          <h3 className="text-xs font-bold uppercase tracking-wide text-stone-500 mb-1">Instructor Feedback</h3>
          <p className="text-sm text-stone-700">{result.feedback}</p>
        </AppCard>
      )}

      {/* Per-question review */}
      <AppCard tone="brand" className="p-5">
        <h3 className="text-sm font-bold text-stone-800 mb-3">Answer Review</h3>
        <div className="space-y-3">
          {questions.map((q, i) => {
            const ans = answers.find((a) => a.questionId === q.id);
            const opts = lms.optionsByQuestion(q.id);
            const selected = opts.find((o) => o.id === ans?.selectedOptionId);
            const correctOpt = opts.find((o) => o.isCorrect);
            const isSubjective = q.questionType === "Essay" || q.questionType === "ShortAnswer";
            const state = ans?.isCorrect === true ? "correct" : ans?.isCorrect === false ? "incorrect" : "pending";
            return (
              <div key={q.id} className="rounded-xl border border-stone-100 p-4">
                <div className="flex items-start gap-2">
                  {state === "correct" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  ) : state === "incorrect" ? (
                    <XCircle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <MinusCircle className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-stone-800">{i + 1}. {q.questionText}</p>
                    <div className="mt-2 space-y-1 text-xs">
                      {opts.length > 0 ? (
                        <>
                          <p className="text-stone-600">Your answer: <span className={state === "correct" ? "text-emerald-700 font-semibold" : "text-rose-700 font-semibold"}>{selected?.optionText ?? "—"}</span></p>
                          {state === "incorrect" && correctOpt && (
                            <p className="text-stone-600">Correct answer: <span className="text-emerald-700 font-semibold">{correctOpt.optionText}</span></p>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-stone-600">Your answer: <span className="text-stone-800">{ans?.answerText || "—"}</span></p>
                          {!isSubjective && q.correctAnswer && (
                            <p className="text-stone-600">Expected: <span className="text-emerald-700 font-semibold">{q.correctAnswer}</span></p>
                          )}
                          {isSubjective && <p className="text-[11px] text-stone-400 italic">Open-ended — reviewed by instructor.</p>}
                        </>
                      )}
                      {q.explanation && (
                        <p className="text-[11px] text-stone-500 bg-stone-50 rounded-lg px-2.5 py-1.5 mt-1">💡 {q.explanation}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-stone-400 flex-shrink-0">{ans?.pointsAwarded ?? 0}/{q.points} pt</span>
                </div>
              </div>
            );
          })}
        </div>
      </AppCard>

      <div className="flex items-center justify-end gap-2">
        <AppButton variant="secondary" size="sm" onClick={onBack}>Back to Assessments</AppButton>
        {canRetake && onRetake && (
          <AppButton variant="primary" size="sm" leftIcon={RotateCcw} onClick={onRetake}>Retake</AppButton>
        )}
      </div>
    </div>
  );
}

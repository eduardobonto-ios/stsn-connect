/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Clock, Flag, ChevronLeft, ChevronRight, Send, X, AlertTriangle, CheckCircle2,
} from "lucide-react";
import AppCard from "../../../../components/common/AppCard";
import AppButton from "../../../../components/common/AppButton";
import type { LmsData } from "../../data/useLmsData";
import type { LmsAssessment, LmsAttempt } from "../../types";
import { formatClock, ProgressBar } from "../shared";

type AnswerValue = { selectedOptionId?: string | null; answerText?: string | null };

export default function TakeExam({
  assessment,
  attempt,
  lms,
  onSubmitted,
  onExit,
}: {
  assessment: LmsAssessment;
  attempt: LmsAttempt;
  lms: LmsData;
  onSubmitted: (attemptId: string) => void;
  onExit: () => void;
}) {
  const questions = useMemo(
    () => lms.questionsByAssessment(assessment.id),
    [lms, assessment.id],
  );

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const totalSeconds = assessment.timeLimitMinutes * 60;
  const [remaining, setRemaining] = useState(totalSeconds > 0 ? totalSeconds : 0);
  const timedRef = useRef(totalSeconds > 0);

  const q = questions[current];
  const answeredCount = Object.values(answers).filter(
    (a) => a.selectedOptionId || (a.answerText && a.answerText.trim()),
  ).length;

  // Prevent accidental page leave while the exam is active.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (submitted) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [submitted]);

  const doSubmit = () => {
    // Persist any pending answers before grading.
    Object.entries(answers).forEach(([questionId, val]) =>
      lms.saveAnswer(attempt.id, questionId, val),
    );
    lms.submitAttempt(attempt.id);
    setSubmitted(true);
    setConfirmOpen(false);
    onSubmitted(attempt.id);
  };

  // Countdown + auto-submit on expiry.
  useEffect(() => {
    if (!timedRef.current || submitted) return;
    if (remaining <= 0) {
      doSubmit();
      return;
    }
    const id = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => clearInterval(id);
  }, [remaining, submitted]); // eslint-disable-line react-hooks/exhaustive-deps

  const setAnswer = (val: AnswerValue) => {
    if (!q) return;
    setAnswers((prev) => ({ ...prev, [q.id]: val }));
    lms.saveAnswer(attempt.id, q.id, val);
  };

  const toggleFlag = () => {
    if (!q) return;
    setFlagged((prev) => {
      const next = new Set(prev);
      next.has(q.id) ? next.delete(q.id) : next.add(q.id);
      return next;
    });
  };

  if (questions.length === 0) {
    return (
      <AppCard tone="brand" className="p-8 text-center">
        <p className="text-sm text-stone-600">This assessment has no questions yet.</p>
        <AppButton variant="secondary" size="sm" className="mt-3" onClick={onExit}>Back</AppButton>
      </AppCard>
    );
  }

  const lowTime = timedRef.current && remaining <= 60;

  return (
    <div className="space-y-4">
      {/* Exam header bar */}
      <AppCard tone="brand" className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-mono uppercase tracking-widest text-stsn-gold">{assessment.assessmentType} in progress</p>
            <h2 className="text-base font-display font-black text-stsn-brown-dark truncate">{assessment.title}</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-stone-500">
              {answeredCount}/{questions.length} answered
            </span>
            {timedRef.current && (
              <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono font-bold text-sm ${
                lowTime ? "bg-red-100 text-red-700 animate-pulse" : "bg-stone-100 text-stone-700"
              }`}>
                <Clock className="w-4 h-4" /> {formatClock(remaining)}
              </span>
            )}
          </div>
        </div>
        <div className="mt-3">
          <ProgressBar value={questions.length ? (answeredCount / questions.length) * 100 : 0} />
        </div>
      </AppCard>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-4">
        {/* Question area */}
        <AppCard tone="brand" className="p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-stone-400">Question {current + 1} of {questions.length}</p>
              <h3 className="text-sm font-bold text-stone-800 mt-1">{q.questionText}</h3>
            </div>
            <button
              onClick={toggleFlag}
              className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition cursor-pointer flex-shrink-0 ${
                flagged.has(q.id) ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-white text-stone-500 border-stone-200 hover:border-amber-300"
              }`}
            >
              <Flag className="w-3.5 h-3.5" /> {flagged.has(q.id) ? "Flagged" : "Flag"}
            </button>
          </div>

          {/* Answer input by type */}
          {(q.questionType === "MultipleChoice" || q.questionType === "TrueFalse") && (
            <div className="space-y-2">
              {lms.optionsByQuestion(q.id).map((opt) => {
                const checked = answers[q.id]?.selectedOptionId === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setAnswer({ selectedOptionId: opt.id })}
                    className={`w-full text-left flex items-center gap-3 rounded-xl border px-4 py-3 transition cursor-pointer ${
                      checked ? "border-stsn-gold bg-stsn-gold/10" : "border-stone-200 hover:border-stsn-brown/30 bg-white"
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${checked ? "border-stsn-gold bg-stsn-gold" : "border-stone-300"}`} />
                    <span className="text-sm text-stone-700">{opt.optionText}</span>
                  </button>
                );
              })}
            </div>
          )}
          {(q.questionType === "ShortAnswer" || q.questionType === "Identification") && (
            <input
              value={answers[q.id]?.answerText ?? ""}
              onChange={(e) => setAnswer({ answerText: e.target.value })}
              className="w-full border border-stone-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-brown/20"
              placeholder="Type your answer…"
            />
          )}
          {q.questionType === "Essay" && (
            <textarea
              value={answers[q.id]?.answerText ?? ""}
              onChange={(e) => setAnswer({ answerText: e.target.value })}
              rows={6}
              className="w-full border border-stone-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-brown/20 resize-none"
              placeholder="Write your response…"
            />
          )}

          <div className="mt-5 flex items-center justify-between">
            <AppButton variant="ghost" size="sm" leftIcon={ChevronLeft} disabled={current <= 0} onClick={() => setCurrent((c) => c - 1)}>
              Previous
            </AppButton>
            {current < questions.length - 1 ? (
              <AppButton variant="secondary" size="sm" rightIcon={ChevronRight} onClick={() => setCurrent((c) => c + 1)}>
                Next
              </AppButton>
            ) : (
              <AppButton variant="primary" size="sm" leftIcon={Send} onClick={() => setConfirmOpen(true)}>
                Submit Exam
              </AppButton>
            )}
          </div>
        </AppCard>

        {/* Navigator */}
        <AppCard tone="brand" className="p-4 h-fit">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-stone-500">Question Navigator</h3>
            {flagged.size > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600">
                <Flag className="w-3 h-3" /> {flagged.size}
              </span>
            )}
          </div>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((question, i) => {
              const isAnswered = !!(answers[question.id]?.selectedOptionId || answers[question.id]?.answerText?.trim());
              const isFlagged = flagged.has(question.id);
              const isCurrent = i === current;
              return (
                <button
                  key={question.id}
                  onClick={() => setCurrent(i)}
                  className={`relative h-9 rounded-lg text-xs font-bold transition cursor-pointer ${
                    isCurrent
                      ? "bg-stsn-brown text-white"
                      : isAnswered
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                  }`}
                >
                  {i + 1}
                  {isFlagged && <Flag className="w-2.5 h-2.5 text-amber-500 absolute top-0.5 right-0.5" />}
                </button>
              );
            })}
          </div>
          <div className="mt-4 space-y-1.5 text-[10px] text-stone-500">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200" /> Answered</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-stone-100 border border-stone-200" /> Unanswered</div>
            <div className="flex items-center gap-2"><Flag className="w-3 h-3 text-amber-500" /> Flagged for review</div>
          </div>
          <AppButton variant="primary" size="sm" fullWidth className="mt-4" leftIcon={Send} onClick={() => setConfirmOpen(true)}>
            Submit Exam
          </AppButton>
          <AppButton variant="ghost" size="sm" fullWidth className="mt-2" onClick={onExit}>
            Save & Exit
          </AppButton>
        </AppCard>
      </div>

      {/* Confirm submission modal */}
      {confirmOpen && (
        <div className="app-modal-backdrop z-[70] animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm mx-4 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="text-base font-bold text-stone-800 mb-1">Submit your exam?</h3>
            <p className="text-xs text-stone-500 mb-1">
              You answered {answeredCount} of {questions.length} questions.
            </p>
            {answeredCount < questions.length && (
              <p className="text-xs text-amber-600 mb-3 flex items-center justify-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {questions.length - answeredCount} unanswered
              </p>
            )}
            <div className="flex gap-2 mt-4">
              <AppButton variant="secondary" size="sm" className="flex-1" leftIcon={X} onClick={() => setConfirmOpen(false)}>
                Keep Working
              </AppButton>
              <AppButton variant="primary" size="sm" className="flex-1" leftIcon={CheckCircle2} onClick={doSubmit}>
                Submit
              </AppButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

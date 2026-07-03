/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import { X, CheckCircle } from "lucide-react";
import AppButton from "../../../../components/common/AppButton";
import type { LmsData } from "../../data/useLmsData";
import { QUESTION_TYPE_LABEL } from "../shared";

const inputCls =
  "w-full border border-stone-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-brown/20";

export default function GradeDrawer({
  lms,
  attemptId,
  onClose,
  onToast,
}: {
  lms: LmsData;
  attemptId: string;
  onClose: () => void;
  onToast: (msg: string, type?: "success" | "error") => void;
}) {
  const attempt = lms.attempts.find((t) => t.id === attemptId);
  const assessment = attempt ? lms.assessmentById(attempt.assessmentId) : undefined;
  const questions = useMemo(
    () => (assessment ? lms.questionsByAssessment(assessment.id) : []),
    [assessment, lms],
  );
  const answers = useMemo(() => lms.answersByAttempt(attemptId), [lms, attemptId]);
  const result = lms.resultForAttempt(attemptId);

  const [score, setScore] = useState(String(result?.score ?? attempt?.score ?? 0));
  const [feedback, setFeedback] = useState(result?.feedback ?? "");

  if (!attempt || !assessment) return null;

  const total = assessment.totalPoints || 0;
  const pct = total > 0 ? Math.round((Number(score) / total) * 100) : 0;
  const passed = pct >= assessment.passingScore;

  const handleSave = () => {
    lms.gradeResult(attemptId, { score: Number(score) || 0, feedback: feedback.trim() || undefined });
    onToast("Grade saved.");
    onClose();
  };

  return (
    <div className="app-modal-backdrop z-[65] animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-stone-100 flex items-center justify-between z-10">
          <div>
            <h3 className="text-base font-bold text-stone-800">Review & Grade</h3>
            <p className="text-[10px] font-mono text-stone-400">{assessment.title}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {questions.map((q, i) => {
            const ans = answers.find((a) => a.questionId === q.id);
            const isSubjective = q.questionType === "Essay" || q.questionType === "ShortAnswer";
            const opts = lms.optionsByQuestion(q.id);
            const selected = opts.find((o) => o.id === ans?.selectedOptionId);
            return (
              <div key={q.id} className="rounded-xl border border-stone-100 p-4">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-stsn-gold">{QUESTION_TYPE_LABEL[q.questionType]}</span>
                  <span className="text-[10px] font-mono text-stone-400">{q.points} pt</span>
                </div>
                <p className="text-sm font-semibold text-stone-800 mt-1">{i + 1}. {q.questionText}</p>
                <p className={`text-xs mt-1.5 ${isSubjective ? "text-stone-700" : ans?.isCorrect ? "text-emerald-700" : "text-rose-700"}`}>
                  Answer: {opts.length > 0 ? (selected?.optionText ?? "—") : (ans?.answerText || "—")}
                  {!isSubjective && (ans?.isCorrect ? "  ✓" : "  ✗")}
                </p>
              </div>
            );
          })}

          <div className="grid grid-cols-2 gap-3 items-end pt-2 border-t border-stone-100">
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">Score (of {total})</label>
              <input type="number" min={0} max={total} value={score} onChange={(e) => setScore(e.target.value)} className={inputCls} />
            </div>
            <div className="text-right">
              <p className="text-2xl font-display font-black text-stsn-brown">{pct}%</p>
              <p className={`text-xs font-bold ${passed ? "text-emerald-600" : "text-rose-600"}`}>{passed ? "Passed" : "Did not pass"}</p>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">Feedback</label>
            <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={3} className={`${inputCls} resize-none`} placeholder="Feedback for the student…" />
          </div>

          <div className="pt-2 flex gap-2">
            <AppButton variant="secondary" size="md" className="flex-1" onClick={onClose}>Cancel</AppButton>
            <AppButton variant="primary" size="md" className="flex-1" leftIcon={CheckCircle} onClick={handleSave}>Save Grade</AppButton>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { X, CheckCircle, Plus, Trash2 } from "lucide-react";
import AppButton from "../../../../components/common/AppButton";
import type { LmsData } from "../../data/useLmsData";
import type { LmsQuestionType } from "../../types";
import { QUESTION_TYPE_LABEL } from "../shared";

const inputCls =
  "w-full border border-stone-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-brown/20";
const labelCls = "block text-xs font-semibold text-stone-600 mb-1";

const TYPES: LmsQuestionType[] = ["MultipleChoice", "TrueFalse", "ShortAnswer", "Essay", "Identification"];

type OptionDraft = { optionText: string; isCorrect: boolean };

export default function QuestionEditor({
  lms,
  assessmentId,
  onClose,
  onToast,
}: {
  lms: LmsData;
  assessmentId: string;
  onClose: () => void;
  onToast: (msg: string, type?: "success" | "error") => void;
}) {
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState<LmsQuestionType>("MultipleChoice");
  const [points, setPoints] = useState("1");
  const [explanation, setExplanation] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [options, setOptions] = useState<OptionDraft[]>([
    { optionText: "", isCorrect: true },
    { optionText: "", isCorrect: false },
  ]);

  const usesOptions = questionType === "MultipleChoice" || questionType === "TrueFalse";
  const usesCorrectText = questionType === "Identification" || questionType === "ShortAnswer";

  const setSingleCorrect = (idx: number) =>
    setOptions((prev) => prev.map((o, i) => ({ ...o, isCorrect: i === idx })));

  const handleType = (t: LmsQuestionType) => {
    setQuestionType(t);
    if (t === "TrueFalse") {
      setOptions([
        { optionText: "True", isCorrect: true },
        { optionText: "False", isCorrect: false },
      ]);
    } else if (t === "MultipleChoice") {
      setOptions([
        { optionText: "", isCorrect: true },
        { optionText: "", isCorrect: false },
      ]);
    }
  };

  const handleSave = () => {
    if (!questionText.trim()) {
      onToast("Question text is required.", "error");
      return;
    }
    if (usesOptions) {
      const filled = options.filter((o) => o.optionText.trim());
      if (filled.length < 2) {
        onToast("Add at least two options.", "error");
        return;
      }
      if (!filled.some((o) => o.isCorrect)) {
        onToast("Mark one option as correct.", "error");
        return;
      }
      lms.addQuestion(
        {
          assessmentId,
          questionText: questionText.trim(),
          questionType,
          points: Number(points) || 1,
          explanation: explanation.trim() || null,
          correctAnswer: null,
        },
        filled,
      );
    } else {
      lms.addQuestion({
        assessmentId,
        questionText: questionText.trim(),
        questionType,
        points: Number(points) || 1,
        explanation: explanation.trim() || null,
        correctAnswer: usesCorrectText ? correctAnswer.trim() || null : null,
      });
    }
    onToast("Question added.");
    onClose();
  };

  return (
    <div className="app-modal-backdrop z-[65] animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-stone-100 flex items-center justify-between z-10">
          <h3 className="text-base font-bold text-stone-800">Add Question</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className={labelCls}>Question Type</label>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleType(t)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    questionType === t ? "bg-stsn-brown text-white border-stsn-brown" : "bg-stone-50 text-stone-600 border-stone-200 hover:border-stsn-brown/40"
                  }`}
                >
                  {QUESTION_TYPE_LABEL[t]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>Question <span className="text-red-400">*</span></label>
            <textarea value={questionText} onChange={(e) => setQuestionText(e.target.value)} rows={2} className={`${inputCls} resize-none`} placeholder="Enter the question…" />
          </div>

          {usesOptions && (
            <div>
              <label className={labelCls}>Options (select the correct one)</label>
              <div className="space-y-2">
                {options.map((o, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSingleCorrect(i)}
                      className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${o.isCorrect ? "border-emerald-500 bg-emerald-500" : "border-stone-300"}`}
                      title="Mark correct"
                    />
                    <input
                      value={o.optionText}
                      onChange={(e) => setOptions((prev) => prev.map((x, xi) => (xi === i ? { ...x, optionText: e.target.value } : x)))}
                      className={inputCls}
                      placeholder={`Option ${i + 1}`}
                      disabled={questionType === "TrueFalse"}
                    />
                    {questionType === "MultipleChoice" && options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setOptions((prev) => prev.filter((_, xi) => xi !== i))}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 cursor-pointer flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {questionType === "MultipleChoice" && (
                <AppButton
                  variant="ghost"
                  size="sm"
                  leftIcon={Plus}
                  className="mt-2"
                  onClick={() => setOptions((prev) => [...prev, { optionText: "", isCorrect: false }])}
                >
                  Add Option
                </AppButton>
              )}
            </div>
          )}

          {usesCorrectText && (
            <div>
              <label className={labelCls}>Correct Answer</label>
              <input value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} className={inputCls} placeholder="Expected answer (case-insensitive)" />
            </div>
          )}

          {questionType === "Essay" && (
            <p className="text-[11px] text-stone-500 bg-stone-50 rounded-lg px-3 py-2">
              Essay responses are reviewed and graded manually by the instructor.
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Points</label>
              <input type="number" min={0} value={points} onChange={(e) => setPoints(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Explanation (shown after grading)</label>
            <textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} rows={2} className={`${inputCls} resize-none`} />
          </div>

          <div className="pt-2 flex gap-2">
            <AppButton variant="secondary" size="md" className="flex-1" onClick={onClose}>Cancel</AppButton>
            <AppButton variant="primary" size="md" className="flex-1" leftIcon={CheckCircle} onClick={handleSave}>Add Question</AppButton>
          </div>
        </div>
      </div>
    </div>
  );
}

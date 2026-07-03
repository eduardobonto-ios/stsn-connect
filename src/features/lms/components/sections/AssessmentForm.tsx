/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { X, CheckCircle } from "lucide-react";
import AppButton from "../../../../components/common/AppButton";
import type { LmsData } from "../../data/useLmsData";
import type { LmsAssessment, LmsAssessmentType } from "../../types";

const inputCls =
  "w-full border border-stone-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-brown/20";
const labelCls = "block text-xs font-semibold text-stone-600 mb-1";

const TYPES: LmsAssessmentType[] = ["Assignment", "Quiz", "Exam", "Activity", "Project"];

export default function AssessmentForm({
  lms,
  assessment,
  onClose,
  onToast,
}: {
  lms: LmsData;
  assessment: LmsAssessment | null;
  onClose: () => void;
  onToast: (msg: string, type?: "success" | "error") => void;
}) {
  const isEdit = !!assessment;
  const [title, setTitle] = useState(assessment?.title ?? "");
  const [description, setDescription] = useState(assessment?.description ?? "");
  const [courseId, setCourseId] = useState(assessment?.courseId ?? "");
  const [assessmentType, setAssessmentType] = useState<LmsAssessmentType>(assessment?.assessmentType ?? "Quiz");
  const [timeLimit, setTimeLimit] = useState(String(assessment?.timeLimitMinutes ?? 0));
  const [passingScore, setPassingScore] = useState(String(assessment?.passingScore ?? 60));
  const [dueDate, setDueDate] = useState(assessment?.dueDate ? assessment.dueDate.slice(0, 16) : "");
  const [maxAttempts, setMaxAttempts] = useState(String(assessment?.maxAttempts ?? 1));
  const [allowRetake, setAllowRetake] = useState(assessment?.allowRetake ?? false);
  const [randomize, setRandomize] = useState(assessment?.randomizeQuestions ?? false);

  const handleSave = () => {
    if (!title.trim()) {
      onToast("Assessment title is required.", "error");
      return;
    }
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      courseId: courseId || null,
      assessmentType,
      timeLimitMinutes: Number(timeLimit) || 0,
      passingScore: Number(passingScore) || 0,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      maxAttempts: Number(maxAttempts) || 1,
      allowRetake,
      randomizeQuestions: randomize,
    };
    if (isEdit && assessment) {
      lms.updateAssessment(assessment.id, payload);
      onToast("Assessment updated.");
    } else {
      lms.addAssessment(payload);
      onToast("Assessment created. Add questions next.");
    }
    onClose();
  };

  return (
    <div className="app-modal-backdrop z-[65] animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-stone-100 flex items-center justify-between z-10">
          <h3 className="text-base font-bold text-stone-800">{isEdit ? "Edit Assessment" : "New Assessment"}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className={labelCls}>Title <span className="text-red-400">*</span></label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="e.g. Midterm Advanced Algebra" />
          </div>
          <div>
            <label className={labelCls}>Description / Instructions</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={`${inputCls} resize-none`} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Course</label>
              <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className={`${inputCls} cursor-pointer`}>
                <option value="">— None —</option>
                {lms.courses.map((c) => (<option key={c.id} value={c.id}>{c.title}</option>))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Type</label>
              <select value={assessmentType} onChange={(e) => setAssessmentType(e.target.value as LmsAssessmentType)} className={`${inputCls} cursor-pointer`}>
                {TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Time Limit (minutes, 0 = none)</label>
              <input type="number" min={0} value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Passing Score (%)</label>
              <input type="number" min={0} max={100} value={passingScore} onChange={(e) => setPassingScore(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Due Date</label>
              <input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Max Attempts</label>
              <input type="number" min={1} value={maxAttempts} onChange={(e) => setMaxAttempts(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-xs font-semibold text-stone-600 cursor-pointer">
              <input type="checkbox" checked={allowRetake} onChange={(e) => setAllowRetake(e.target.checked)} className="rounded border-stone-300" />
              Allow retakes
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-stone-600 cursor-pointer">
              <input type="checkbox" checked={randomize} onChange={(e) => setRandomize(e.target.checked)} className="rounded border-stone-300" />
              Randomize questions
            </label>
          </div>
          <div className="pt-2 flex gap-2">
            <AppButton variant="secondary" size="md" className="flex-1" onClick={onClose}>Cancel</AppButton>
            <AppButton variant="primary" size="md" className="flex-1" leftIcon={CheckCircle} onClick={handleSave}>
              {isEdit ? "Save Changes" : "Create Assessment"}
            </AppButton>
          </div>
        </div>
      </div>
    </div>
  );
}

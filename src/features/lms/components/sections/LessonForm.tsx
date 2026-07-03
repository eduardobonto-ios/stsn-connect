/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { X, CheckCircle } from "lucide-react";
import AppButton from "../../../../components/common/AppButton";
import type { LmsData } from "../../data/useLmsData";
import type { LmsLessonContentType } from "../../types";

const inputCls =
  "w-full border border-stone-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-brown/20";
const labelCls = "block text-xs font-semibold text-stone-600 mb-1";

const CONTENT_TYPES: LmsLessonContentType[] = ["Video", "Text", "Document", "Link", "Quiz"];

export default function LessonForm({
  lms,
  courseId,
  onClose,
  onToast,
}: {
  lms: LmsData;
  courseId: string;
  onClose: () => void;
  onToast: (msg: string, type?: "success" | "error") => void;
}) {
  const courseModules = lms.modulesByCourse(courseId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [contentType, setContentType] = useState<LmsLessonContentType>("Video");
  const [contentUrl, setContentUrl] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("15");
  const [isRequired, setIsRequired] = useState(true);

  const handleSave = () => {
    if (!title.trim()) {
      onToast("Lesson title is required.", "error");
      return;
    }
    lms.addLesson({
      courseId,
      moduleId: moduleId || null,
      title: title.trim(),
      description: description.trim() || null,
      contentType,
      contentUrl: contentUrl.trim() || null,
      contentHtml: contentType === "Text" ? contentHtml.trim() || null : null,
      durationMinutes: Number(durationMinutes) || 0,
      isRequired,
    });
    onToast("Lesson added.");
    onClose();
  };

  return (
    <div className="app-modal-backdrop z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-stone-100 flex items-center justify-between z-10">
          <h3 className="text-base font-bold text-stone-800">Add Lesson</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className={labelCls}>Lesson Title <span className="text-red-400">*</span></label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="e.g. Introduction to Slopes" />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={`${inputCls} resize-none`} />
          </div>
          {courseModules.length > 0 && (
            <div>
              <label className={labelCls}>Module</label>
              <select value={moduleId} onChange={(e) => setModuleId(e.target.value)} className={`${inputCls} cursor-pointer`}>
                <option value="">No module (Additional Lessons)</option>
                {courseModules.map((m) => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className={labelCls}>Content Type</label>
            <div className="flex flex-wrap gap-2">
              {CONTENT_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setContentType(t)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    contentType === t ? "bg-stsn-brown text-white border-stsn-brown" : "bg-stone-50 text-stone-600 border-stone-200 hover:border-stsn-brown/40"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          {contentType === "Text" ? (
            <div>
              <label className={labelCls}>Lesson Content (HTML/text)</label>
              <textarea value={contentHtml} onChange={(e) => setContentHtml(e.target.value)} rows={4} className={`${inputCls} resize-none`} placeholder="Lesson body…" />
            </div>
          ) : (
            <div>
              <label className={labelCls}>{contentType === "Video" ? "Video Embed URL" : "Content URL"}</label>
              <input value={contentUrl} onChange={(e) => setContentUrl(e.target.value)} className={inputCls} placeholder={contentType === "Video" ? "https://www.youtube.com/embed/…" : "https://…"} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 items-end">
            <div>
              <label className={labelCls}>Duration (minutes)</label>
              <input type="number" min={0} value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} className={inputCls} />
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-stone-600 py-2.5 cursor-pointer">
              <input type="checkbox" checked={isRequired} onChange={(e) => setIsRequired(e.target.checked)} className="rounded border-stone-300" />
              Required for completion
            </label>
          </div>
          <div className="pt-2 flex gap-2">
            <AppButton variant="secondary" size="md" className="flex-1" onClick={onClose}>Cancel</AppButton>
            <AppButton variant="primary" size="md" className="flex-1" leftIcon={CheckCircle} onClick={handleSave}>Add Lesson</AppButton>
          </div>
        </div>
      </div>
    </div>
  );
}

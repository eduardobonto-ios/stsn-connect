/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { X, CheckCircle } from "lucide-react";
import AppButton from "../../../../components/common/AppButton";
import type { LmsData } from "../../data/useLmsData";
import type { LmsCourse, LmsDifficulty, LmsCourseStatus } from "../../types";

const inputCls =
  "w-full border border-stone-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-brown/20";
const labelCls = "block text-xs font-semibold text-stone-600 mb-1";

export default function CourseForm({
  lms,
  course,
  onClose,
  onToast,
}: {
  lms: LmsData;
  course: LmsCourse | null;
  onClose: () => void;
  onToast: (msg: string, type?: "success" | "error") => void;
}) {
  const [title, setTitle] = useState(course?.title ?? "");
  const [description, setDescription] = useState(course?.description ?? "");
  const [categoryId, setCategoryId] = useState(course?.categoryId ?? lms.categories[0]?.id ?? "");
  const [difficulty, setDifficulty] = useState<LmsDifficulty>(course?.difficulty ?? "Beginner");
  const [durationMinutes, setDurationMinutes] = useState(String(course?.durationMinutes ?? 0));
  const [instructorName, setInstructorName] = useState(course?.instructorName ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(course?.thumbnailUrl ?? "");
  const [status, setStatus] = useState<LmsCourseStatus>(course?.status ?? "Draft");

  const isEdit = !!course;

  const handleSave = () => {
    if (!title.trim()) {
      onToast("Course title is required.", "error");
      return;
    }
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      categoryId: categoryId || null,
      difficulty,
      durationMinutes: Number(durationMinutes) || 0,
      instructorName: instructorName.trim() || null,
      thumbnailUrl: thumbnailUrl.trim() || null,
      status,
      publishedAt: status === "Published" ? (course?.publishedAt ?? new Date().toISOString()) : null,
    };
    if (isEdit && course) {
      lms.updateCourse(course.id, payload);
      onToast("Course updated.");
    } else {
      lms.addCourse(payload);
      onToast("Course created.");
    }
    onClose();
  };

  return (
    <div className="app-modal-backdrop z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-stone-100 flex items-center justify-between z-10">
          <h3 className="text-base font-bold text-stone-800">{isEdit ? "Edit Course" : "New Course"}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className={labelCls}>Course Title <span className="text-red-400">*</span></label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="e.g. Algebra Basics: Linear Equations" />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={`${inputCls} resize-none`} placeholder="Short course description…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Category</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={`${inputCls} cursor-pointer`}>
                <option value="">Uncategorized</option>
                {lms.categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Difficulty</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as LmsDifficulty)} className={`${inputCls} cursor-pointer`}>
                {(["Beginner", "Intermediate", "Advanced"] as LmsDifficulty[]).map((d) => (<option key={d} value={d}>{d}</option>))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Duration (minutes)</label>
              <input type="number" min={0} value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Instructor</label>
              <input value={instructorName} onChange={(e) => setInstructorName(e.target.value)} className={inputCls} placeholder="Instructor name" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Thumbnail URL (optional)</label>
            <input value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} className={inputCls} placeholder="https://…" />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <div className="flex gap-2">
              {(["Draft", "Published", "Archived"] as LmsCourseStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    status === s ? "bg-stsn-brown text-white border-stsn-brown" : "bg-stone-50 text-stone-600 border-stone-200 hover:border-stsn-brown/40"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="pt-2 flex gap-2">
            <AppButton variant="secondary" size="md" className="flex-1" onClick={onClose}>Cancel</AppButton>
            <AppButton variant="primary" size="md" className="flex-1" leftIcon={CheckCircle} onClick={handleSave}>
              {isEdit ? "Save Changes" : "Create Course"}
            </AppButton>
          </div>
        </div>
      </div>
    </div>
  );
}

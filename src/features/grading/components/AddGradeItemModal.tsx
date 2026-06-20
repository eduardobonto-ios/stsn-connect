/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { X, PlusCircle } from "lucide-react";
import {
  GradePeriod,
  GradeItem,
  GradeCategoryName,
  ALL_CATEGORY_NAMES,
} from "../../../types/grading";
import { categoryExists, remainingWeight } from "../utils/gradeValidation";

interface AddGradeItemModalProps {
  isOpen: boolean;
  period: GradePeriod;
  onClose: () => void;
  onAdd: (item: GradeItem, categoryWeight: number) => void;
}

const EMPTY_FORM = {
  label: "",
  category: "Quizzes" as GradeCategoryName,
  maxScore: 100,
  weight: 25,
  dueDate: "",
};

export default function AddGradeItemModal({
  isOpen,
  period,
  onClose,
  onAdd,
}: AddGradeItemModalProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const isNewCategory = !categoryExists(period.categories, form.category);
  const remaining = remainingWeight(period.categories);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.label.trim()) {
      setError("Item name is required.");
      return;
    }
    if (form.maxScore <= 0) {
      setError("Max score must be greater than 0.");
      return;
    }
    if (isNewCategory && (form.weight <= 0 || form.weight > 100)) {
      setError("Category weight must be between 1 and 100.");
      return;
    }

    const newItem: GradeItem = {
      id: `item-${Date.now()}`,
      label: form.label.trim(),
      category: form.category,
      maxScore: form.maxScore,
      order:
        period.items.filter((i) => i.category === form.category).length + 1,
      dueDate: form.dueDate || undefined,
    };

    onAdd(newItem, isNewCategory ? form.weight : 0);
    setForm(EMPTY_FORM);
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl border border-stsn-beige w-full max-w-md mx-4 animate-fade-in">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-stsn-gold" />
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
              Add Grade Item
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 cursor-pointer transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Period (read-only display) */}
          <div>
            <label className="block text-[10px] font-mono uppercase text-stone-400 font-bold mb-1">
              Grading Period
            </label>
            <div className="bg-stsn-cream border border-stsn-beige rounded-lg px-3 py-2 text-xs font-bold text-stsn-brown">
              {period.label}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-[10px] font-mono uppercase text-stone-400 font-bold mb-1">
              Category
            </label>
            <select
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value as GradeCategoryName })
              }
              className="w-full bg-stone-50 border border-stone-200 text-xs rounded-lg px-3 py-2 font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown"
            >
              {ALL_CATEGORY_NAMES.map((c) => (
                <option key={c} value={c}>
                  {c}
                  {categoryExists(period.categories, c) ? "" : " (new)"}
                </option>
              ))}
            </select>
          </div>

          {/* Item Name */}
          <div>
            <label className="block text-[10px] font-mono uppercase text-stone-400 font-bold mb-1">
              Item Name
            </label>
            <input
              type="text"
              placeholder="e.g. Quiz 1, Long Exam, Project 2"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              className="w-full bg-stone-50 border border-stone-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-stsn-brown"
              required
            />
          </div>

          {/* Max Score + Weight row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono uppercase text-stone-400 font-bold mb-1">
                Max Score
              </label>
              <input
                type="number"
                min={1}
                max={1000}
                value={form.maxScore}
                onChange={(e) =>
                  setForm({ ...form, maxScore: Number(e.target.value) })
                }
                className="w-full bg-stone-50 border border-stone-200 text-xs rounded-lg px-3 py-2 font-mono focus:outline-none focus:ring-1 focus:ring-stsn-brown"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase text-stone-400 font-bold mb-1">
                {isNewCategory ? "Category Weight %" : "Category Weight %"}
              </label>
              <input
                type="number"
                min={1}
                max={100}
                step={0.5}
                value={form.weight}
                disabled={!isNewCategory}
                onChange={(e) =>
                  setForm({ ...form, weight: Number(e.target.value) })
                }
                className={[
                  "w-full border text-xs rounded-lg px-3 py-2 font-mono focus:outline-none focus:ring-1 focus:ring-stsn-brown",
                  isNewCategory
                    ? "bg-stone-50 border-stone-200"
                    : "bg-stone-100 border-stone-100 text-stone-400 cursor-not-allowed",
                ].join(" ")}
              />
              {!isNewCategory && (
                <p className="text-[9px] text-stone-400 mt-0.5">
                  Edit via Manage Weights
                </p>
              )}
              {isNewCategory && (
                <p className="text-[9px] text-stone-400 mt-0.5">
                  Remaining budget: {remaining}%
                </p>
              )}
            </div>
          </div>

          {/* Optional due date */}
          <div>
            <label className="block text-[10px] font-mono uppercase text-stone-400 font-bold mb-1">
              Due Date <span className="font-normal">(optional)</span>
            </label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="w-full bg-stone-50 border border-stone-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-stsn-brown"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-600 text-[11px] font-semibold bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 text-xs font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 px-4 py-2 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 text-xs font-bold text-stsn-cream bg-stsn-brown hover:bg-stsn-brown-dark px-4 py-2 rounded-lg transition cursor-pointer"
            >
              Add Grade Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

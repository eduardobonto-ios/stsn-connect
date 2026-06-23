/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { X, Scale } from "lucide-react";
import { GradeCategory, GradePeriod } from "../../../types/grading";
import { weightValidationMessage, areCategoryWeightsValid } from "../utils/gradeValidation";

interface ManageGradeWeightsModalProps {
  isOpen: boolean;
  period: GradePeriod;
  onClose: () => void;
  onSave: (updatedCategories: GradeCategory[]) => void;
}

export default function ManageGradeWeightsModal({
  isOpen,
  period,
  onClose,
  onSave,
}: ManageGradeWeightsModalProps) {
  const [categories, setCategories] = useState<GradeCategory[]>([]);

  useEffect(() => {
    setCategories(period.categories.map((c) => ({ ...c })));
  }, [period, isOpen]);

  if (!isOpen) return null;

  const validationMsg = weightValidationMessage(categories);
  const isValid = areCategoryWeightsValid(categories);
  const total = categories.reduce((s, c) => s + c.weight, 0);

  const updateWeight = (name: string, rawValue: string) => {
    const val = parseFloat(rawValue);
    setCategories((prev) =>
      prev.map((c) =>
        c.name === name ? { ...c, weight: Number.isNaN(val) ? 0 : val } : c
      )
    );
  };

  const handleSave = () => {
    if (!isValid) return;
    onSave(categories);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-md mx-4 overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="modal-header-gradient text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-stsn-gold" />
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide">
                Manage Category Weights
              </h3>
              <p className="text-[10px] text-white/60 font-mono mt-0.5">
                {period.label} — all weights must sum to 100%
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white hover:bg-white/10 rounded-lg p-1 cursor-pointer transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-3">
          {categories.length === 0 ? (
            <p className="text-xs text-stone-400 italic text-center py-4">
              No categories yet. Add a grade item first.
            </p>
          ) : (
            categories.map((cat) => {
              const itemCount = period.items.filter((i) => i.category === cat.name).length;
              return (
                <div key={cat.name} className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-stone-800">{cat.name}</p>
                    <p className="text-[10px] text-stone-400">
                      {itemCount} item{itemCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={cat.weight}
                      onChange={(e) => updateWeight(cat.name, e.target.value)}
                      className="w-16 text-center text-xs font-mono font-bold border border-stone-200 rounded-lg px-2 py-1 bg-stone-50 focus:outline-none focus:ring-1 focus:ring-stsn-brown"
                    />
                    <span className="text-xs text-stone-500 font-semibold">%</span>
                  </div>
                </div>
              );
            })
          )}

          {/* Total indicator */}
          {categories.length > 0 && (
            <div
              className={[
                "flex justify-between items-center pt-3 mt-3 border-t text-xs font-bold",
                isValid ? "border-emerald-200 text-emerald-700" : "border-red-200 text-red-600",
              ].join(" ")}
            >
              <span>Total Weight</span>
              <span
                className={[
                  "px-2.5 py-0.5 rounded-full border text-[11px]",
                  isValid
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-red-50 border-red-200 text-red-600",
                ].join(" ")}
              >
                {Math.round(total * 10) / 10}%
              </span>
            </div>
          )}

          {/* Validation message */}
          {validationMsg && (
            <p className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 font-semibold">
              {validationMsg}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-6 pb-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 text-xs font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 px-4 py-2 rounded-lg transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isValid || categories.length === 0}
            className={[
              "flex-1 text-xs font-bold px-4 py-2 rounded-lg transition cursor-pointer",
              isValid && categories.length > 0
                ? "bg-stsn-brown text-stsn-cream hover:bg-stsn-brown-dark"
                : "bg-stone-200 text-stone-400 cursor-not-allowed",
            ].join(" ")}
          >
            Save Weights
          </button>
        </div>
      </div>
    </div>
  );
}

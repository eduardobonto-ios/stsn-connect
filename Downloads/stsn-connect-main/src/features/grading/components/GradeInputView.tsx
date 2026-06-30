/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { PlusCircle, Scale, Save, Lock, CheckCircle, AlertCircle } from "lucide-react";
import {
  GradePeriod,
  GradeRosterStudent,
  StudentGradeEntry,
  SubjectClassLoad,
  GradeItem,
  GradeCategory,
} from "../../../types/grading";
import { validatePeriodForFinalization, areCategoryWeightsValid } from "../utils/gradeValidation";
import { totalCategoryWeight } from "../utils/gradeCalculations";
import GradePeriodSelector from "./GradePeriodSelector";
import GradeSheetTable from "./GradeSheetTable";
import AddGradeItemModal from "./AddGradeItemModal";
import ManageGradeWeightsModal from "./ManageGradeWeightsModal";

interface GradeInputViewProps {
  classLoad: SubjectClassLoad;
  students: GradeRosterStudent[];
  periods: GradePeriod[];
  entries: StudentGradeEntry[];
  activePeriodId: string;
  onPeriodSelect: (periodId: string) => void;
  onScoreChange: (studentId: string, gradeItemId: string, score: number | null) => void;
  onAddGradeItem: (periodId: string, item: GradeItem, categoryWeight: number) => void;
  onUpdateCategoryWeights: (periodId: string, categories: GradeCategory[]) => void;
  onSaveDraft: () => void;
  onFinalizePeriod: (periodId: string) => void;
}

export default function GradeInputView({
  classLoad,
  students,
  periods,
  entries,
  activePeriodId,
  onPeriodSelect,
  onScoreChange,
  onAddGradeItem,
  onUpdateCategoryWeights,
  onSaveDraft,
  onFinalizePeriod,
}: GradeInputViewProps) {
  const [isAddItemOpen, setAddItemOpen] = useState(false);
  const [isManageWeightsOpen, setManageWeightsOpen] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [finalizeError, setFinalizeError] = useState<string[]>([]);

  const activePeriod = periods.find((p) => p.id === activePeriodId);

  if (!activePeriod) {
    return (
      <div className="py-10 text-center text-stone-400 text-xs italic">
        Select a grading period above.
      </div>
    );
  }

  const isFinalized = activePeriod.isFinalized;
  const weightValid = areCategoryWeightsValid(activePeriod.categories);
  const totalWeight = totalCategoryWeight(activePeriod);

  const handleSaveDraft = () => {
    onSaveDraft();
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 3000);
  };

  const handleFinalize = () => {
    const result = validatePeriodForFinalization(activePeriod);
    if (!result.valid) {
      setFinalizeError(result.errors);
      return;
    }
    setFinalizeError([]);
    onFinalizePeriod(activePeriod.id);
  };

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <span className="text-[10px] font-mono uppercase text-stone-400 font-bold block">
            Grading Period
          </span>
          <GradePeriodSelector
            department={classLoad.department}
            periods={periods.filter(
              (p) =>
                p.subjectCode === classLoad.subjectCode &&
                p.sectionId === classLoad.sectionId
            )}
            activePeriodId={activePeriodId}
            onSelect={onPeriodSelect}
          />
        </div>

        {/* Weight indicator */}
        {activePeriod.categories.length > 0 && (
          <div
            className={[
              "flex items-center gap-1.5 text-[10px] font-mono font-bold px-3 py-1.5 rounded-lg border",
              weightValid
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-700 border-amber-200",
            ].join(" ")}
          >
            <Scale className="w-3 h-3" />
            Weights: {Math.round(totalWeight * 10) / 10}%
            {!weightValid && " ⚠ must equal 100%"}
          </div>
        )}
      </div>

      {/* Finalized banner */}
      {isFinalized && (
        <div className="flex items-center gap-2 bg-stone-100 border border-stone-200 rounded-xl px-4 py-3 text-xs font-semibold text-stone-600">
          <Lock className="w-4 h-4 text-stone-500 flex-shrink-0" />
          This period has been finalized. Grades are read-only.
          {activePeriod.finalizedAt && (
            <span className="ml-1 font-mono text-[10px] text-stone-400">
              ({activePeriod.finalizedAt})
            </span>
          )}
        </div>
      )}

      {/* Toolbar */}
      {!isFinalized && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setAddItemOpen(true)}
            className="flex items-center gap-1.5 bg-stsn-brown text-stsn-cream text-[11px] font-bold px-3 py-1.5 rounded-lg hover:bg-stsn-brown-dark transition cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Add Grade Item
          </button>

          <button
            onClick={() => setManageWeightsOpen(true)}
            disabled={activePeriod.categories.length === 0}
            className={[
              "flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg border transition cursor-pointer",
              activePeriod.categories.length > 0
                ? "bg-white text-stone-700 border-stone-200 hover:border-stsn-brown hover:text-stsn-brown"
                : "bg-stone-50 text-stone-300 border-stone-100 cursor-not-allowed",
            ].join(" ")}
          >
            <Scale className="w-3.5 h-3.5" />
            Manage Weights
          </button>

          <div className="flex-1" />

          {/* Save Draft */}
          <button
            onClick={handleSaveDraft}
            className="flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            Save Draft
          </button>

          {/* Finalize */}
          <button
            onClick={handleFinalize}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            Finalize Grades
          </button>
        </div>
      )}

      {/* Draft saved toast */}
      {draftSaved && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-2.5 text-xs font-semibold">
          <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
          Draft saved successfully.
        </div>
      )}

      {/* Finalize errors */}
      {finalizeError.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 space-y-1">
          <div className="flex items-center gap-1.5 text-red-700 text-xs font-bold">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            Cannot finalize — resolve the following:
          </div>
          {finalizeError.map((err) => (
            <p key={err} className="text-[11px] text-red-600 pl-5">
              • {err}
            </p>
          ))}
        </div>
      )}

      {/* Grade Sheet */}
      <GradeSheetTable
        period={activePeriod}
        students={students}
        entries={entries.filter((e) =>
          activePeriod.items.some((i) => i.id === e.gradeItemId)
        )}
        onScoreChange={onScoreChange}
        isReadOnly={isFinalized}
      />

      {/* Modals */}
      <AddGradeItemModal
        isOpen={isAddItemOpen}
        period={activePeriod}
        onClose={() => setAddItemOpen(false)}
        onAdd={(item, categoryWeight) =>
          onAddGradeItem(activePeriod.id, item, categoryWeight)
        }
      />

      <ManageGradeWeightsModal
        isOpen={isManageWeightsOpen}
        period={activePeriod}
        onClose={() => setManageWeightsOpen(false)}
        onSave={(cats) => onUpdateCategoryWeights(activePeriod.id, cats)}
      />
    </div>
  );
}

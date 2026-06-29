import React from "react";
import { Award, BookOpen, CheckCircle2, FileWarning } from "lucide-react";
import AppCard from "../../../components/common/AppCard";
import AppEmptyState from "../../../components/common/AppEmptyState";

interface AcademicSnapshotCardProps {
  gpaLabel: string;
  passedCount: number;
  incompleteCount: number;
  finalizedCount: number;
}

export default function AcademicSnapshotCard({
  gpaLabel,
  passedCount,
  incompleteCount,
  finalizedCount,
}: AcademicSnapshotCardProps) {
  return (
    <AppCard tone="brand">
      <div className="flex items-center gap-2">
        <Award className="h-4 w-4 text-stsn-gold" />
        <h3 className="text-sm font-bold text-stone-900">Academic Snapshot</h3>
      </div>

      {finalizedCount === 0 ? (
        <AppEmptyState
          icon={BookOpen}
          title="No finalized grades yet"
          description="Academic summary cards will populate once finalized subject grades are available for this child."
          compact
          tone="brand"
          className="px-0 py-8"
        />
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-stsn-beige bg-stsn-cream px-4 py-3">
            <p className="text-[10px] font-mono uppercase text-stone-400">Average Final Grade</p>
            <p className="mt-1 text-2xl font-black text-stsn-brown">{gpaLabel}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <p className="text-[10px] font-mono uppercase text-emerald-700">Passed Subjects</p>
            </div>
            <p className="mt-1 text-2xl font-black text-emerald-700">{passedCount}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <FileWarning className="h-4 w-4 text-amber-600" />
              <p className="text-[10px] font-mono uppercase text-amber-700">Incomplete / Pending</p>
            </div>
            <p className="mt-1 text-2xl font-black text-amber-700">{incompleteCount}</p>
          </div>
        </div>
      )}
    </AppCard>
  );
}

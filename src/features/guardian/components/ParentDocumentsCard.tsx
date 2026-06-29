import React from "react";
import { FileCheck } from "lucide-react";
import AppCard from "../../../components/common/AppCard";
import AppEmptyState from "../../../components/common/AppEmptyState";

interface ParentDocumentsCardProps {
  totalDocuments: number;
  completedDocuments: number;
  pendingDocuments: number;
  rejectedDocuments: number;
}

export default function ParentDocumentsCard({
  totalDocuments,
  completedDocuments,
  pendingDocuments,
  rejectedDocuments,
}: ParentDocumentsCardProps) {
  return (
    <AppCard tone="brand">
      <div className="flex items-center gap-2">
        <FileCheck className="h-4 w-4 text-emerald-600" />
        <h3 className="text-sm font-bold text-stone-900">Documents</h3>
      </div>

      {totalDocuments === 0 ? (
        <AppEmptyState
          icon={FileCheck}
          title="No document records yet"
          description="Requirement and submission records will appear here when available for this child."
          compact
          tone="brand"
          className="px-0 py-8"
        />
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-[10px] font-mono uppercase text-emerald-700">Completed</p>
            <p className="mt-1 text-2xl font-black text-emerald-700">{completedDocuments}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-[10px] font-mono uppercase text-amber-700">Pending</p>
            <p className="mt-1 text-2xl font-black text-amber-700">{pendingDocuments}</p>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-[10px] font-mono uppercase text-red-700">Rejected</p>
            <p className="mt-1 text-2xl font-black text-red-700">{rejectedDocuments}</p>
          </div>
        </div>
      )}
    </AppCard>
  );
}

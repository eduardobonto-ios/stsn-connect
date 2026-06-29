import React from "react";
import { AlertCircle, CheckCircle2, Clock3 } from "lucide-react";
import AppCard from "../../../components/common/AppCard";
import AppEmptyState from "../../../components/common/AppEmptyState";
import type { ParentTaskItem } from "../types";

interface ParentTasksCardProps {
  tasks: ParentTaskItem[];
}

const TONE_CLASSES: Record<ParentTaskItem["tone"], string> = {
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-red-200 bg-red-50 text-red-700",
  info: "border-blue-200 bg-blue-50 text-blue-700",
};

export default function ParentTasksCard({ tasks }: ParentTasksCardProps) {
  return (
    <AppCard tone="brand">
      <div className="flex items-center gap-2">
        <Clock3 className="h-4 w-4 text-stsn-gold" />
        <h3 className="text-sm font-bold text-stone-900">Required Actions</h3>
      </div>

      {tasks.length === 0 ? (
        <AppEmptyState
          icon={CheckCircle2}
          title="No parent follow-ups right now"
          description="Outstanding tasks will be highlighted here only when live student records require attention."
          compact
          tone="success"
          className="px-0 py-8"
        />
      ) : (
        <div className="mt-4 space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className={`rounded-xl border px-4 py-3 ${TONE_CLASSES[task.tone]}`}>
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold">{task.title}</p>
                  <p className="mt-1 text-[10px] leading-relaxed opacity-80">{task.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppCard>
  );
}

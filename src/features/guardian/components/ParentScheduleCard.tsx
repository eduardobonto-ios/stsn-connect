import React from "react";
import { CalendarDays } from "lucide-react";
import AppCard from "../../../components/common/AppCard";
import AppEmptyState from "../../../components/common/AppEmptyState";
import type { ParentScheduleRow } from "../types";

interface ParentScheduleCardProps {
  schedule: ParentScheduleRow[];
}

export default function ParentScheduleCard({ schedule }: ParentScheduleCardProps) {
  return (
    <AppCard tone="brand">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-blue-600" />
        <h3 className="text-sm font-bold text-stone-900">Class Schedule</h3>
      </div>

      {schedule.length === 0 ? (
        <AppEmptyState
          icon={CalendarDays}
          title="No published class schedule"
          description="Schedule details will appear once class schedule records are available for this child."
          compact
          tone="brand"
          className="px-0 py-8"
        />
      ) : (
        <div className="mt-4 space-y-3">
          {schedule.slice(0, 5).map((item) => (
            <div key={item.id} className="rounded-xl border border-stone-200 bg-white px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-stone-800">{item.subjectName}</p>
                  <p className="mt-1 text-[10px] text-stone-500">
                    {item.subjectCode} • {item.teacherName || "Teacher TBA"}
                  </p>
                </div>
                <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[9px] font-bold uppercase text-blue-700">
                  {item.day}
                </span>
              </div>
              <p className="mt-2 text-[10px] font-mono text-stone-500">
                {item.time} • Room {item.room || "TBA"}
              </p>
            </div>
          ))}
        </div>
      )}
    </AppCard>
  );
}

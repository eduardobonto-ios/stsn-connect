import React from "react";
import { AlertCircle, Bell } from "lucide-react";
import AppCard from "../../../components/common/AppCard";
import AppEmptyState from "../../../components/common/AppEmptyState";
import type { Announcement } from "../../../types";

interface ParentAnnouncementsCardProps {
  announcements: Announcement[];
}

export default function ParentAnnouncementsCard({ announcements }: ParentAnnouncementsCardProps) {
  return (
    <AppCard tone="brand">
      <div className="flex items-center gap-2">
        <Bell className="h-4 w-4 text-amber-600" />
        <h3 className="text-sm font-bold text-stone-900">Parent Announcements</h3>
      </div>

      {announcements.length === 0 ? (
        <AppEmptyState
          icon={Bell}
          title="No active notices"
          description="Role-appropriate announcements for this child will appear here when available."
          compact
          tone="brand"
          className="px-0 py-8"
        />
      ) : (
        <div className="mt-4 space-y-3">
          {announcements.slice(0, 4).map((announcement) => (
            <div
              key={announcement.id}
              className={`rounded-xl border px-4 py-3 ${
                announcement.priority === "urgent"
                  ? "border-red-200 bg-red-50"
                  : "border-stone-200 bg-white"
              }`}
            >
              <div className="flex items-start gap-2">
                {announcement.priority === "urgent" ? (
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-red-500" />
                ) : (
                  <Bell className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-stsn-gold" />
                )}
                <div className="min-w-0">
                  <p className="text-xs font-bold text-stone-800">{announcement.title}</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-stone-500">
                    {announcement.content}
                  </p>
                  <p className="mt-2 text-[9px] font-mono uppercase text-stone-400">
                    {announcement.category} • {announcement.date}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppCard>
  );
}

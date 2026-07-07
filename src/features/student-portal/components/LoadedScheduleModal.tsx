/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react";
import { Calendar, CalendarX } from "lucide-react";
import AppModal from "../../../components/common/AppModal";
import AppEmptyState from "../../../components/common/AppEmptyState";
import type { ClassSchedule, Subject } from "../../../types";

interface ScheduleRow {
  id: string;
  code: string;
  name: string;
  section: string;
  days: string;
  time: string;
  room: string;
  teacher: string;
  scheduled: boolean;
}

interface LoadedScheduleModalProps {
  open: boolean;
  onClose: () => void;
  loadedSubjects: Subject[];
  classSchedules: ClassSchedule[];
  isBasicEd: boolean;
  schoolName?: string;
}

export default function LoadedScheduleModal({
  open,
  onClose,
  loadedSubjects,
  classSchedules,
  isBasicEd,
  schoolName,
}: LoadedScheduleModalProps) {
  const rows = useMemo<ScheduleRow[]>(
    () =>
      loadedSubjects.map((sub) => {
        const sched = classSchedules.find((cs) => cs.subjectCode === sub.code && cs.isActive);
        return {
          id: sub.id,
          code: sub.code,
          name: sub.name,
          section: sched?.section ?? "—",
          days: sched?.day ?? "—",
          time: sched ? `${sched.startTime} - ${sched.endTime}` : "—",
          room: sched?.roomName ?? "TBA",
          teacher: sched?.teacherName ?? "—",
          scheduled: Boolean(sched),
        };
      }),
    [loadedSubjects, classSchedules]
  );

  const totalUnits = useMemo(() => loadedSubjects.reduce((a, s) => a + s.units, 0), [loadedSubjects]);

  return (
    <AppModal
      open={open}
      onClose={onClose}
      icon={Calendar}
      eyebrow="Enrolled Subjects"
      title="Loaded Schedule"
      maxWidthClass="max-w-3xl"
      bodyClassName="p-5 max-h-[75vh] overflow-y-auto"
    >
      {rows.length === 0 ? (
        <AppEmptyState
          icon={CalendarX}
          title="No loaded schedule found for this student."
          description="Enrolled subjects and their class schedules will appear here once the student is enrolled and loaded."
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[11px] font-mono uppercase tracking-wider text-stone-500 font-bold">
              {rows.length} {rows.length === 1 ? "Subject" : "Subjects"}
              {!isBasicEd && ` · ${totalUnits} Units`}
            </span>
            {schoolName && (
              <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">{schoolName}</span>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-stone-200/70">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="bg-stone-50 text-stone-400 font-mono uppercase text-[9.5px]">
                  <th className="px-3 py-2 font-bold">Subject</th>
                  <th className="px-3 py-2 font-bold">Section</th>
                  <th className="px-3 py-2 font-bold">Days</th>
                  <th className="px-3 py-2 font-bold">Time</th>
                  <th className="px-3 py-2 font-bold">Room</th>
                  <th className="px-3 py-2 font-bold">Teacher</th>
                  <th className="px-3 py-2 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {rows.map((row) => (
                  <tr key={row.id} className="text-stone-700">
                    <td className="px-3 py-2">
                      <span className="font-mono font-bold text-stsn-brown block">{row.code}</span>
                      <span className="text-stone-900 font-medium">{row.name}</span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.section}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.days}</td>
                    <td className="px-3 py-2 whitespace-nowrap font-mono">{row.time}</td>
                    <td className="px-3 py-2 whitespace-nowrap font-mono">{row.room}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.teacher}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                          row.scheduled
                            ? "bg-green-50 border-green-200 text-green-700"
                            : "bg-amber-50 border-amber-200 text-amber-700"
                        }`}
                      >
                        {row.scheduled ? "Scheduled" : "Schedule TBA"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppModal>
  );
}

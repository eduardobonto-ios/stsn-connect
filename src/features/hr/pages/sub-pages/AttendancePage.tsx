/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { ClipboardList, Plus, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useSTSNStore } from "../../../../services/store";
import { useAppDialog } from "../../../../components/common/useAppDialog";
import AppButton from "../../../../components/common/AppButton";
import AppCard from "../../../../components/common/AppCard";
import AppTable, { type AppTableColumn } from "../../../../components/common/AppTable";
import { EmployeeAttendance } from "../../../../types";
import { ATTENDANCE_STATUSES } from "../../utils/payrollCalculations";

const STATUS_COLORS: Record<string, string> = {
  Present: "bg-emerald-100 text-emerald-700",
  Late: "bg-amber-100 text-amber-700",
  Undertime: "bg-yellow-100 text-yellow-700",
  Absent: "bg-red-100 text-red-700",
  "On Leave": "bg-blue-100 text-blue-700",
  "Official Business": "bg-indigo-100 text-indigo-700",
  Holiday: "bg-purple-100 text-purple-700",
  "Rest Day": "bg-stone-100 text-stone-500",
  "Half Day": "bg-orange-100 text-orange-700",
};

interface RecordAttendanceModalProps {
  onClose: () => void;
  onSave: (data: {
    employeeId: string; attendanceDate: string; timeIn?: string; timeOut?: string;
    status: EmployeeAttendance["status"]; lateMinutes: number; undertimeMinutes: number; overtimeMinutes: number; remarks?: string;
  }) => void;
}

function RecordAttendanceModal({ onClose, onSave }: RecordAttendanceModalProps) {
  const { employees } = useSTSNStore();
  const [employeeId, setEmployeeId] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [timeIn, setTimeIn] = useState("08:00");
  const [timeOut, setTimeOut] = useState("17:00");
  const [status, setStatus] = useState<EmployeeAttendance["status"]>("Present");
  const [lateMinutes, setLateMinutes] = useState(0);
  const [undertimeMinutes, setUndertimeMinutes] = useState(0);
  const [overtimeMinutes, setOvertimeMinutes] = useState(0);
  const [remarks, setRemarks] = useState("");

  const showTimes = ["Present", "Late", "Undertime", "Half Day", "Official Business"].includes(status);

  return createPortal(
    <div className="app-modal-backdrop z-50 animate-fade-in text-stone-800">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-stone-200">
        <div className="modal-header-gradient text-white p-4 flex items-center justify-between">
          <h3 className="font-display font-semibold text-base">Record Attendance</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg cursor-pointer"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-xs font-semibold text-stone-600 block mb-1">Employee <span className="text-red-500">*</span></label>
            <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-gold/30">
              <option value="">— Select Employee —</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-stone-600 block mb-1">Date</label>
              <input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-gold/30" />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-600 block mb-1">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-gold/30">
                {ATTENDANCE_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          {showTimes && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-stone-600 block mb-1">Time In</label>
                <input type="time" value={timeIn} onChange={(e) => setTimeIn(e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-gold/30" />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-600 block mb-1">Time Out</label>
                <input type="time" value={timeOut} onChange={(e) => setTimeOut(e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-gold/30" />
              </div>
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Late (min)", val: lateMinutes, set: setLateMinutes },
              { label: "Undertime (min)", val: undertimeMinutes, set: setUndertimeMinutes },
              { label: "Overtime (min)", val: overtimeMinutes, set: setOvertimeMinutes },
            ].map(({ label, val, set }) => (
              <div key={label}>
                <label className="text-xs font-semibold text-stone-600 block mb-1">{label}</label>
                <input type="number" min={0} value={val} onChange={(e) => set(Number(e.target.value))} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-gold/30" />
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-600 block mb-1">Remarks</label>
            <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-gold/30 resize-none" placeholder="Optional..." />
          </div>
        </div>
        <div className="px-5 pb-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-xs rounded-lg border border-stone-200 hover:bg-stone-50 cursor-pointer">Cancel</button>
          <button
            disabled={!employeeId}
            onClick={() => {
              onSave({ employeeId, attendanceDate, timeIn: showTimes ? timeIn : undefined, timeOut: showTimes ? timeOut : undefined, status, lateMinutes, undertimeMinutes, overtimeMinutes, remarks: remarks || undefined });
              onClose();
            }}
            className="px-4 py-2 text-xs rounded-lg btn-primary-gradient text-white font-semibold cursor-pointer disabled:opacity-50"
          >
            Save Record
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function AttendancePage() {
  const { employeeAttendance, employees, addEmployeeAttendance } = useSTSNStore();
  const { toast } = useAppDialog();

  const [showModal, setShowModal] = useState(false);
  const [filterEmployee, setFilterEmployee] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const employeeMap = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);

  const filtered = useMemo(() => {
    let records = [...employeeAttendance];
    if (month) records = records.filter((r) => r.attendanceDate.startsWith(month));
    if (filterEmployee !== "All") records = records.filter((r) => r.employeeId === filterEmployee);
    if (filterStatus !== "All") records = records.filter((r) => r.status === filterStatus);
    return records.sort((a, b) => b.attendanceDate.localeCompare(a.attendanceDate));
  }, [employeeAttendance, month, filterEmployee, filterStatus]);

  const summary = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((r) => { counts[r.status] = (counts[r.status] ?? 0) + 1; });
    return counts;
  }, [filtered]);

  const legacyColumns: any[] = [
    {
      title: "Employee",
      render: (_, row) => {
        const e = employeeMap.get(row.employeeId);
        return e ? <span className="text-xs font-semibold text-stone-800">{e.firstName} {e.lastName}</span> : <span className="text-xs text-stone-400">—</span>;
      },
    },
    { title: "Date", data: "attendanceDate", render: (v) => <span className="font-mono text-xs">{v}</span>, width: "100px" },
    {
      title: "Status",
      data: "status",
      render: (v) => <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[v] ?? "bg-gray-100 text-gray-600"}`}>{v}</span>,
      width: "120px",
    },
    { title: "Time In", data: "timeIn", render: (v) => <span className="font-mono text-xs">{v ?? "—"}</span>, width: "75px" },
    { title: "Time Out", data: "timeOut", render: (v) => <span className="font-mono text-xs">{v ?? "—"}</span>, width: "75px" },
    { title: "Late", data: "lateMinutes", render: (v) => <span className={`text-xs ${v > 0 ? "text-amber-600 font-semibold" : "text-stone-400"}`}>{v > 0 ? `${v} min` : "—"}</span>, width: "70px" },
    { title: "Undertime", data: "undertimeMinutes", render: (v) => <span className={`text-xs ${v > 0 ? "text-orange-600 font-semibold" : "text-stone-400"}`}>{v > 0 ? `${v} min` : "—"}</span>, width: "80px" },
    { title: "OT", data: "overtimeMinutes", render: (v) => <span className={`text-xs ${v > 0 ? "text-emerald-600 font-semibold" : "text-stone-400"}`}>{v > 0 ? `${v} min` : "—"}</span>, width: "60px" },
    { title: "Remarks", data: "remarks", render: (v) => <span className="text-xs text-stone-400">{v ?? "—"}</span> },
  ];

  void legacyColumns;

  const columns: AppTableColumn<EmployeeAttendance>[] = [
    {
      accessorKey: "employeeId",
      header: "Employee",
      cell: ({ row }) => {
        const e = employeeMap.get(row.original.employeeId);
        return e ? <span className="text-xs font-semibold text-stone-800">{e.firstName} {e.lastName}</span> : <span className="text-xs text-stone-400">—</span>;
      },
    },
    { accessorKey: "attendanceDate", header: "Date", cell: ({ getValue }) => <span className="font-mono text-xs">{String(getValue())}</span> },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => {
        const value = String(getValue());
        return <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[value] ?? "bg-gray-100 text-gray-600"}`}>{value}</span>;
      },
    },
    { accessorKey: "timeIn", header: "Time In", cell: ({ getValue }) => <span className="font-mono text-xs">{getValue<string | undefined>() ?? "—"}</span> },
    { accessorKey: "timeOut", header: "Time Out", cell: ({ getValue }) => <span className="font-mono text-xs">{getValue<string | undefined>() ?? "—"}</span> },
    {
      accessorKey: "lateMinutes",
      header: "Late",
      cell: ({ getValue }) => {
        const value = getValue<number>();
        return <span className={`text-xs ${value > 0 ? "text-amber-600 font-semibold" : "text-stone-400"}`}>{value > 0 ? `${value} min` : "—"}</span>;
      },
    },
    {
      accessorKey: "undertimeMinutes",
      header: "Undertime",
      cell: ({ getValue }) => {
        const value = getValue<number>();
        return <span className={`text-xs ${value > 0 ? "text-orange-600 font-semibold" : "text-stone-400"}`}>{value > 0 ? `${value} min` : "—"}</span>;
      },
    },
    {
      accessorKey: "overtimeMinutes",
      header: "OT",
      cell: ({ getValue }) => {
        const value = getValue<number>();
        return <span className={`text-xs ${value > 0 ? "text-emerald-600 font-semibold" : "text-stone-400"}`}>{value > 0 ? `${value} min` : "—"}</span>;
      },
    },
    { accessorKey: "remarks", header: "Remarks", cell: ({ getValue }) => <span className="text-xs text-stone-400">{getValue<string | undefined>() ?? "—"}</span> },
  ];

  const handleSave = (data: Parameters<RecordAttendanceModalProps["onSave"]>[0]) => {
    addEmployeeAttendance(data);
    toast("Attendance record saved.");
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <AppCard className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" tone="brand">
        <div>
          <h2 className="text-xl font-display font-semibold text-stone-900 tracking-tight flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-stsn-brown" />
            Attendance
          </h2>
          <p className="text-stone-500 text-xs mt-1">Daily attendance records per employee.</p>
        </div>
        <AppButton onClick={() => setShowModal(true)} size="sm" leftIcon={Plus}>
          Record Attendance
        </AppButton>
      </AppCard>

      {Object.keys(summary).length > 0 && (
        <AppCard className="flex flex-wrap gap-2 px-4 py-3" padded={false} tone="brand">
          {Object.entries(summary).map(([s, count]) => (
            <button
              key={s}
              onClick={() => setFilterStatus(filterStatus === s ? "All" : s)}
              className={`text-[10px] px-2.5 py-1 rounded-full font-semibold border cursor-pointer transition-all ${STATUS_COLORS[s] ?? "bg-gray-100 text-gray-600"} ${filterStatus === s ? "ring-2 ring-offset-1 ring-stsn-gold" : ""}`}
            >
              {s}: {count}
            </button>
          ))}
        </AppCard>
      )}

      <AppTable<EmployeeAttendance>
        data={filtered}
        columns={columns}
        title="Attendance Records"
        searchPlaceholder="Search attendance records..."
        emptyMessage="No attendance records found for the selected period."
        emptyDescription="Adjust the month, employee, status, or search filters."
        loading={false}
        enableColumnVisibility={false}
        initialPageSize={20}
        pageSizeOptions={[20]}
        getRowId={(row) => row.id}
        toolbar={
          <>
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-stsn-gold bg-stone-50" />
            <select value={filterEmployee} onChange={(e) => setFilterEmployee(e.target.value)} className="border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-stsn-gold cursor-pointer bg-stone-50">
              <option value="All">All Employees</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-stsn-gold cursor-pointer bg-stone-50">
              <option value="All">All Statuses</option>
              {ATTENDANCE_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <span className="text-[11px] font-mono text-stone-400 whitespace-nowrap">{filtered.length} records</span>
          </>
        }
      />

      {showModal && <RecordAttendanceModal onClose={() => setShowModal(false)} onSave={handleSave} />}
    </div>
  );
}

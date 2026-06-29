/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { Clock, Plus, CheckCircle, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useSTSNStore } from "../../../../services/store";
import { useAppDialog } from "../../../../components/common/useAppDialog";
import AppButton from "../../../../components/common/AppButton";
import AppCard from "../../../../components/common/AppCard";
import AppTable, { type AppTableColumn } from "../../../../components/common/AppTable";
import { EmployeeTimeLog } from "../../../../types";

const LOG_SOURCES = ["Manual", "Biometric", "System"] as const;

interface LogTimeModalProps {
  onClose: () => void;
  onSave: (data: { employeeId: string; logDate: string; timeIn?: string; timeOut?: string; source: "Biometric" | "Manual" | "System"; remarks?: string }) => void;
}

function LogTimeModal({ onClose, onSave }: LogTimeModalProps) {
  const { employees } = useSTSNStore();
  const [employeeId, setEmployeeId] = useState("");
  const [logDate, setLogDate] = useState(new Date().toISOString().split("T")[0]);
  const [timeIn, setTimeIn] = useState("08:00");
  const [timeOut, setTimeOut] = useState("17:00");
  const [hasTimeOut, setHasTimeOut] = useState(true);
  const [source, setSource] = useState<"Biometric" | "Manual" | "System">("Manual");
  const [remarks, setRemarks] = useState("");

  return createPortal(
    <div className="app-modal-backdrop z-50 animate-fade-in text-stone-800">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-stone-200">
        <div className="modal-header-gradient text-white p-4 flex items-center justify-between">
          <h3 className="font-display font-semibold text-base">Log Time Entry</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg cursor-pointer"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-xs font-semibold text-stone-600 block mb-1">Employee <span className="text-red-500">*</span></label>
            <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-gold/30">
              <option value="">— Select Employee —</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName} · {e.position}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-stone-600 block mb-1">Date</label>
              <input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-gold/30" />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-600 block mb-1">Source</label>
              <select value={source} onChange={(e) => setSource(e.target.value as any)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-gold/30">
                {LOG_SOURCES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-stone-600 block mb-1">Time In</label>
              <input type="time" value={timeIn} onChange={(e) => setTimeIn(e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-gold/30" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-stone-600">Time Out</label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={hasTimeOut} onChange={(e) => setHasTimeOut(e.target.checked)} className="w-3 h-3 accent-stsn-gold" />
                  <span className="text-[10px] text-stone-400">Include</span>
                </label>
              </div>
              <input type="time" value={timeOut} onChange={(e) => setTimeOut(e.target.value)} disabled={!hasTimeOut} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-gold/30 disabled:opacity-50 disabled:bg-stone-50" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-600 block mb-1">Remarks</label>
            <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-gold/30 resize-none" placeholder="Optional note..." />
          </div>
        </div>
        <div className="px-5 pb-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-xs rounded-lg border border-stone-200 hover:bg-stone-50 cursor-pointer">Cancel</button>
          <button
            disabled={!employeeId}
            onClick={() => {
              onSave({ employeeId, logDate, timeIn, timeOut: hasTimeOut ? timeOut : undefined, source, remarks: remarks || undefined });
              onClose();
            }}
            className="px-4 py-2 text-xs rounded-lg btn-primary-gradient text-white font-semibold cursor-pointer disabled:opacity-50"
          >
            Save Entry
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

const SOURCE_COLORS: Record<string, string> = {
  Manual: "bg-blue-100 text-blue-700",
  Biometric: "bg-emerald-100 text-emerald-700",
  System: "bg-stone-100 text-stone-600",
};

export default function TimeManagementPage() {
  const { employeeTimeLogs, employees, addEmployeeTimeLog, approveEmployeeTimeLog, currentUser } = useSTSNStore();
  const { toast } = useAppDialog();

  const [showLogModal, setShowLogModal] = useState(false);
  const [filterEmployee, setFilterEmployee] = useState("All");
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);

  const employeeMap = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);

  const filtered = useMemo(() => {
    let logs = [...employeeTimeLogs];
    if (filterEmployee !== "All") logs = logs.filter((l) => l.employeeId === filterEmployee);
    if (dateFrom) logs = logs.filter((l) => l.logDate >= dateFrom);
    if (dateTo) logs = logs.filter((l) => l.logDate <= dateTo);
    return logs.sort((a, b) => b.logDate.localeCompare(a.logDate));
  }, [employeeTimeLogs, filterEmployee, dateFrom, dateTo]);

  const pendingCount = useMemo(() => filtered.filter((l) => !l.isApproved).length, [filtered]);

  const handleApprove = (logId: string) => {
    approveEmployeeTimeLog(logId, currentUser?.name ?? "HR");
    toast("Time log approved.");
  };

  const handleApproveAll = () => {
    const pending = filtered.filter((l) => !l.isApproved);
    pending.forEach((l) => approveEmployeeTimeLog(l.id, currentUser?.name ?? "HR"));
    toast(`${pending.length} time log(s) approved.`);
  };

  const legacyColumns: any[] = [
    {
      title: "Employee",
      render: (_, row) => {
        const e = employeeMap.get(row.employeeId);
        return e ? (
          <div>
            <p className="text-xs font-semibold text-stone-800">{e.firstName} {e.lastName}</p>
            <p className="text-[10px] text-stone-400">{e.position}</p>
          </div>
        ) : <span className="text-xs text-stone-400">—</span>;
      },
    },
    { title: "Date", data: "logDate", render: (v) => <span className="font-mono text-xs">{v}</span>, width: "100px" },
    { title: "Time In", data: "timeIn", render: (v) => <span className="font-mono text-xs">{v ?? "—"}</span>, width: "80px" },
    { title: "Time Out", data: "timeOut", render: (v) => <span className="font-mono text-xs">{v ?? "—"}</span>, width: "80px" },
    {
      title: "Source",
      data: "source",
      render: (v) => <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${SOURCE_COLORS[v] ?? "bg-gray-100 text-gray-600"}`}>{v}</span>,
      width: "90px",
    },
    { title: "Remarks", data: "remarks", render: (v) => <span className="text-xs text-stone-500">{v ?? "—"}</span> },
    {
      title: "Status",
      data: "isApproved",
      render: (v, row) => v ? (
        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">Approved</span>
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); handleApprove(row.id); }}
          className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold hover:bg-amber-200 cursor-pointer transition-all"
        >
          Pending → Approve
        </button>
      ),
      width: "130px",
    },
  ];

  void legacyColumns;

  const columns: AppTableColumn<EmployeeTimeLog>[] = [
    {
      accessorKey: "employeeId",
      header: "Employee",
      cell: ({ row }) => {
        const e = employeeMap.get(row.original.employeeId);
        return e ? (
          <div>
            <p className="text-xs font-semibold text-stone-800">{e.firstName} {e.lastName}</p>
            <p className="text-[10px] text-stone-400">{e.position}</p>
          </div>
        ) : <span className="text-xs text-stone-400">—</span>;
      },
    },
    { accessorKey: "logDate", header: "Date", cell: ({ getValue }) => <span className="font-mono text-xs">{String(getValue())}</span> },
    { accessorKey: "timeIn", header: "Time In", cell: ({ getValue }) => <span className="font-mono text-xs">{getValue<string | undefined>() ?? "—"}</span> },
    { accessorKey: "timeOut", header: "Time Out", cell: ({ getValue }) => <span className="font-mono text-xs">{getValue<string | undefined>() ?? "—"}</span> },
    {
      accessorKey: "source",
      header: "Source",
      cell: ({ getValue }) => {
        const value = String(getValue());
        return <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${SOURCE_COLORS[value] ?? "bg-gray-100 text-gray-600"}`}>{value}</span>;
      },
    },
    { accessorKey: "remarks", header: "Remarks", cell: ({ getValue }) => <span className="text-xs text-stone-500">{getValue<string | undefined>() ?? "—"}</span> },
    {
      accessorKey: "isApproved",
      header: "Status",
      cell: ({ getValue, row }) => getValue<boolean>() ? (
        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">Approved</span>
      ) : (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleApprove(row.original.id); }}
          className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold hover:bg-amber-200 cursor-pointer transition-all"
        >
          Pending → Approve
        </button>
      ),
    },
  ];

  const handleLogTime = (data: { employeeId: string; logDate: string; timeIn?: string; timeOut?: string; source: "Biometric" | "Manual" | "System"; remarks?: string }) => {
    addEmployeeTimeLog({ ...data, isApproved: false });
    toast("Time entry logged successfully.");
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <AppCard className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" tone="brand">
        <div>
          <h2 className="text-xl font-display font-semibold text-stone-900 tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-stsn-brown" />
            Time Management
          </h2>
          <p className="text-stone-500 text-xs mt-1">Employee time-in/out logs and approval workflow.</p>
        </div>
        <div className="flex gap-2">
          {pendingCount > 0 && (
            <AppButton onClick={handleApproveAll} variant="secondary" size="sm" leftIcon={CheckCircle}>
              Approve All ({pendingCount})
            </AppButton>
          )}
          <AppButton onClick={() => setShowLogModal(true)} size="sm" leftIcon={Plus}>
            Log Time
          </AppButton>
        </div>
      </AppCard>

      {/* Filters */}
      <AppCard className="flex flex-wrap gap-3 items-center px-4 py-3" padded={false} tone="brand">
        <select value={filterEmployee} onChange={(e) => setFilterEmployee(e.target.value)} className="border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-stsn-gold/30">
          <option value="All">All Employees</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <label className="text-xs text-stone-500">From</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-stsn-gold/30" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-stone-500">To</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-stsn-gold/30" />
        </div>
        <div className="flex items-center gap-2 ml-auto text-xs text-stone-500">
          <span className="font-semibold text-stone-700">{filtered.length}</span> entries
          {pendingCount > 0 && <span className="text-amber-600 font-semibold">· {pendingCount} pending</span>}
        </div>
      </AppCard>

      <AppTable<EmployeeTimeLog>
          data={filtered}
          columns={columns}
          title="Employee Time Logs"
          emptyMessage="No time logs found for the selected period."
          emptyDescription="Adjust the employee or date filters to find time logs."
          loading={false}
          enableColumnVisibility={false}
          initialPageSize={20}
          pageSizeOptions={[20]}
          getRowId={(row) => row.id}
      />

      {showLogModal && <LogTimeModal onClose={() => setShowLogModal(false)} onSave={handleLogTime} />}
    </div>
  );
}

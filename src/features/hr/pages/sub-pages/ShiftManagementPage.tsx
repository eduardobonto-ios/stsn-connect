/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { CalendarDays, Plus, X, ToggleLeft, ToggleRight } from "lucide-react";
import { createPortal } from "react-dom";
import { useSTSNStore } from "../../../../services/store";
import { useAppDialog } from "../../../../components/common/useAppDialog";
import AppTable, { type AppTableColumn } from "../../../../components/common/AppTable";
import { ShiftTemplate, EmployeeShiftAssignment } from "../../../../types";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function computeHours(start: string, end: string, breakMins: number, overnight: boolean): string {
  if (!start || !end) return "—";
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let startMins = sh * 60 + sm;
  let endMins = eh * 60 + em;
  if (overnight && endMins <= startMins) endMins += 24 * 60;
  const total = endMins - startMins - breakMins;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h}h ${m > 0 ? `${m}m` : ""}`.trim();
}

interface AddShiftModalProps {
  onClose: () => void;
  onSave: (data: { code: string; name: string; startTime: string; endTime: string; breakMinutes: number; isOvernight: boolean }) => void;
}

function AddShiftModal({ onClose, onSave }: AddShiftModalProps) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");
  const [breakMinutes, setBreakMinutes] = useState(60);
  const [isOvernight, setIsOvernight] = useState(false);

  const canSave = code.trim() && name.trim();

  return createPortal(
    <div className="app-modal-backdrop z-50 animate-fade-in text-stone-800">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-stone-200">
        <div className="modal-header-gradient text-white p-4 flex items-center justify-between">
          <h3 className="font-display font-semibold text-base">Add Shift Template</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg cursor-pointer"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-stone-600 block mb-1">Code <span className="text-red-500">*</span></label>
              <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="DAY" className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-gold/30" />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-600 block mb-1">Name <span className="text-red-500">*</span></label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Day Shift" className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-gold/30" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-stone-600 block mb-1">Start Time</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-gold/30" />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-600 block mb-1">End Time</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-gold/30" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-stone-600 block mb-1">Break (minutes)</label>
              <input type="number" min={0} max={480} value={breakMinutes} onChange={(e) => setBreakMinutes(Number(e.target.value))} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-gold/30" />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isOvernight} onChange={(e) => setIsOvernight(e.target.checked)} className="w-4 h-4 accent-stsn-gold" />
                <span className="text-xs font-semibold text-stone-600">Overnight Shift</span>
              </label>
            </div>
          </div>
          <div className="bg-stsn-cream rounded-lg p-3 text-xs text-stone-600">
            Total work hours: <span className="font-semibold">{computeHours(startTime, endTime, breakMinutes, isOvernight)}</span>
          </div>
        </div>
        <div className="px-5 pb-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-xs rounded-lg border border-stone-200 hover:bg-stone-50 cursor-pointer">Cancel</button>
          <button
            disabled={!canSave}
            onClick={() => { onSave({ code, name, startTime, endTime, breakMinutes, isOvernight }); onClose(); }}
            className="px-4 py-2 text-xs rounded-lg btn-primary-gradient text-white font-semibold cursor-pointer disabled:opacity-50"
          >
            Add Shift
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

interface AssignShiftModalProps {
  onClose: () => void;
  onSave: (employeeId: string, shiftTemplateId: string, effectiveFrom: string, restDays: string[]) => void;
}

function AssignShiftModal({ onClose, onSave }: AssignShiftModalProps) {
  const { employees, shiftTemplates } = useSTSNStore();
  const [employeeId, setEmployeeId] = useState("");
  const [shiftTemplateId, setShiftTemplateId] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split("T")[0]);
  const [restDays, setRestDays] = useState<string[]>(["Saturday", "Sunday"]);

  const toggleRestDay = (day: string) => {
    setRestDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
  };

  const activeShifts = shiftTemplates.filter((t) => t.isActive);

  return createPortal(
    <div className="app-modal-backdrop z-50 animate-fade-in text-stone-800">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-stone-200">
        <div className="modal-header-gradient text-white p-4 flex items-center justify-between">
          <h3 className="font-display font-semibold text-base">Assign Shift to Employee</h3>
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
          <div>
            <label className="text-xs font-semibold text-stone-600 block mb-1">Shift Template <span className="text-red-500">*</span></label>
            <select value={shiftTemplateId} onChange={(e) => setShiftTemplateId(e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-gold/30">
              <option value="">— Select Shift —</option>
              {activeShifts.map((s) => <option key={s.id} value={s.id}>{s.code} — {s.name} ({s.startTime}–{s.endTime})</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-600 block mb-1">Effective From</label>
            <input type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-gold/30" />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-600 block mb-1">Rest Days</label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleRestDay(day)}
                  className={`px-2.5 py-1 text-[10px] rounded-full border font-semibold cursor-pointer transition-all ${restDays.includes(day) ? "bg-stsn-brown text-white border-stsn-brown" : "border-stone-200 text-stone-500 hover:border-stsn-gold"}`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="px-5 pb-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-xs rounded-lg border border-stone-200 hover:bg-stone-50 cursor-pointer">Cancel</button>
          <button
            disabled={!employeeId || !shiftTemplateId}
            onClick={() => { onSave(employeeId, shiftTemplateId, effectiveFrom, restDays); onClose(); }}
            className="px-4 py-2 text-xs rounded-lg btn-primary-gradient text-white font-semibold cursor-pointer disabled:opacity-50"
          >
            Assign Shift
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function ShiftManagementPage() {
  const { shiftTemplates, employeeShiftAssignments, employees, addShiftTemplate, toggleShiftTemplateActive, assignEmployeeShift, currentUser } = useSTSNStore();
  const { toast } = useAppDialog();
  const [tab, setTab] = useState<"templates" | "assignments">("templates");
  const [showAddShift, setShowAddShift] = useState(false);
  const [showAssign, setShowAssign] = useState(false);

  const employeeMap = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);
  const templateMap = useMemo(() => new Map(shiftTemplates.map((t) => [t.id, t])), [shiftTemplates]);

  const legacyShiftColumns: any[] = [
    { title: "Code", data: "code", render: (v) => <span className="font-mono text-xs font-bold text-stsn-brown">{v}</span>, width: "80px" },
    { title: "Name", data: "name", render: (v) => <span className="text-xs font-semibold">{v}</span> },
    { title: "Start", data: "startTime", render: (v) => <span className="font-mono text-xs">{v}</span>, width: "70px" },
    { title: "End", data: "endTime", render: (v) => <span className="font-mono text-xs">{v}</span>, width: "70px" },
    {
      title: "Hours",
      render: (_, row) => <span className="text-xs text-stone-600">{computeHours(row.startTime, row.endTime, row.breakMinutes, row.isOvernight)}</span>,
      width: "70px",
    },
    { title: "Break", data: "breakMinutes", render: (v) => <span className="text-xs text-stone-500">{v} min</span>, width: "70px" },
    {
      title: "Overnight",
      data: "isOvernight",
      render: (v) => v ? <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">Yes</span> : <span className="text-[10px] text-stone-400">No</span>,
      width: "80px",
    },
    {
      title: "Status",
      data: "isActive",
      render: (v, row) => (
        <button
          onClick={(e) => { e.stopPropagation(); toggleShiftTemplateActive(row.id); }}
          className="flex items-center gap-1 cursor-pointer"
        >
          {v
            ? <><ToggleRight className="w-5 h-5 text-emerald-500" /><span className="text-[10px] text-emerald-600 font-semibold">Active</span></>
            : <><ToggleLeft className="w-5 h-5 text-stone-300" /><span className="text-[10px] text-stone-400">Inactive</span></>}
        </button>
      ),
      width: "90px",
    },
  ];

  const legacyAssignmentColumns: any[] = [
    {
      title: "Employee",
      render: (_, row) => {
        const emp = employeeMap.get(row.employeeId);
        return emp ? (
          <div>
            <p className="text-xs font-semibold text-stone-800">{emp.firstName} {emp.lastName}</p>
            <p className="text-[10px] text-stone-400">{emp.position}</p>
          </div>
        ) : <span className="text-xs text-stone-400">—</span>;
      },
    },
    {
      title: "Shift",
      render: (_, row) => {
        const t = templateMap.get(row.shiftTemplateId);
        return t ? <span className="text-xs font-semibold">{t.name} <span className="text-stone-400 font-normal">({t.startTime}–{t.endTime})</span></span> : <span className="text-xs text-stone-400">—</span>;
      },
    },
    { title: "From", data: "effectiveFrom", render: (v) => <span className="font-mono text-xs">{v}</span>, width: "100px" },
    { title: "To", data: "effectiveTo", render: (v) => <span className="font-mono text-xs">{v ?? "Ongoing"}</span>, width: "100px" },
    {
      title: "Rest Days",
      data: "restDays",
      render: (v: string[]) => <span className="text-xs text-stone-500">{v?.length ? v.map((d) => d.slice(0, 3)).join(", ") : "None"}</span>,
    },
  ];

  void legacyShiftColumns;
  void legacyAssignmentColumns;

  const shiftColumns: AppTableColumn<ShiftTemplate>[] = [
    { accessorKey: "code", header: "Code", cell: ({ getValue }) => <span className="font-mono text-xs font-bold text-stsn-brown">{String(getValue())}</span> },
    { accessorKey: "name", header: "Name", cell: ({ getValue }) => <span className="text-xs font-semibold">{String(getValue())}</span> },
    { accessorKey: "startTime", header: "Start", cell: ({ getValue }) => <span className="font-mono text-xs">{String(getValue())}</span> },
    { accessorKey: "endTime", header: "End", cell: ({ getValue }) => <span className="font-mono text-xs">{String(getValue())}</span> },
    {
      id: "hours",
      header: "Hours",
      cell: ({ row }) => <span className="text-xs text-stone-600">{computeHours(row.original.startTime, row.original.endTime, row.original.breakMinutes, row.original.isOvernight)}</span>,
    },
    { accessorKey: "breakMinutes", header: "Break", cell: ({ getValue }) => <span className="text-xs text-stone-500">{String(getValue())} min</span> },
    {
      accessorKey: "isOvernight",
      header: "Overnight",
      cell: ({ getValue }) => getValue<boolean>() ? <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">Yes</span> : <span className="text-[10px] text-stone-400">No</span>,
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ getValue, row }) => (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); toggleShiftTemplateActive(row.original.id); }}
          className="flex items-center gap-1 cursor-pointer"
        >
          {getValue<boolean>()
            ? <><ToggleRight className="w-5 h-5 text-emerald-500" /><span className="text-[10px] text-emerald-600 font-semibold">Active</span></>
            : <><ToggleLeft className="w-5 h-5 text-stone-300" /><span className="text-[10px] text-stone-400">Inactive</span></>}
        </button>
      ),
    },
  ];

  const assignmentColumns: AppTableColumn<EmployeeShiftAssignment>[] = [
    {
      accessorKey: "employeeId",
      header: "Employee",
      cell: ({ row }) => {
        const emp = employeeMap.get(row.original.employeeId);
        return emp ? (
          <div>
            <p className="text-xs font-semibold text-stone-800">{emp.firstName} {emp.lastName}</p>
            <p className="text-[10px] text-stone-400">{emp.position}</p>
          </div>
        ) : <span className="text-xs text-stone-400">—</span>;
      },
    },
    {
      accessorKey: "shiftTemplateId",
      header: "Shift",
      cell: ({ row }) => {
        const t = templateMap.get(row.original.shiftTemplateId);
        return t ? <span className="text-xs font-semibold">{t.name} <span className="text-stone-400 font-normal">({t.startTime}–{t.endTime})</span></span> : <span className="text-xs text-stone-400">—</span>;
      },
    },
    { accessorKey: "effectiveFrom", header: "From", cell: ({ getValue }) => <span className="font-mono text-xs">{String(getValue())}</span> },
    { accessorKey: "effectiveTo", header: "To", cell: ({ getValue }) => <span className="font-mono text-xs">{getValue<string | undefined>() ?? "Ongoing"}</span> },
    {
      accessorKey: "restDays",
      header: "Rest Days",
      cell: ({ getValue }) => {
        const value = getValue<string[]>();
        return <span className="text-xs text-stone-500">{value?.length ? value.map((d) => d.slice(0, 3)).join(", ") : "None"}</span>;
      },
    },
  ];

  const handleAddShift = (data: { code: string; name: string; startTime: string; endTime: string; breakMinutes: number; isOvernight: boolean }) => {
    addShiftTemplate({ ...data, isActive: true });
    toast(`Shift "${data.name}" added successfully.`);
  };

  const handleAssignShift = (employeeId: string, shiftTemplateId: string, effectiveFrom: string, restDays: string[]) => {
    assignEmployeeShift({ employeeId, shiftTemplateId, effectiveFrom, restDays });
    const emp = employeeMap.get(employeeId);
    toast(`Shift assigned to ${emp ? `${emp.firstName} ${emp.lastName}` : "employee"}.`);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-white border border-stsn-beige rounded-xl shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-display font-semibold text-stone-900 tracking-tight flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-stsn-brown" />
            Shift Management
          </h2>
          <p className="text-stone-500 text-xs mt-1">Define shift templates and assign schedules to employees.</p>
        </div>
        <div className="flex gap-2">
          {tab === "templates" && (
            <button onClick={() => setShowAddShift(true)} className="btn-primary-gradient text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer">
              <Plus className="w-4 h-4" /> Add Shift
            </button>
          )}
          {tab === "assignments" && (
            <button onClick={() => setShowAssign(true)} className="btn-primary-gradient text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer">
              <Plus className="w-4 h-4" /> Assign Shift
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-stone-100 p-1 rounded-xl w-fit">
        {(["templates", "assignments"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${tab === t ? "bg-white text-stsn-brown shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
          >
            {t === "templates" ? `Shift Templates (${shiftTemplates.length})` : `Employee Assignments (${employeeShiftAssignments.length})`}
          </button>
        ))}
      </div>

      <div>
        {tab === "templates" && (
          <AppTable<ShiftTemplate>
            data={shiftTemplates}
            columns={shiftColumns}
            title="Shift Templates"
            emptyMessage="No shift templates found. Add one to get started."
            emptyDescription="Create a shift template before assigning employee schedules."
            loading={false}
            enableColumnVisibility={false}
            initialPageSize={15}
            pageSizeOptions={[15]}
            getRowId={(row) => row.id}
          />
        )}
        {tab === "assignments" && (
          <AppTable<EmployeeShiftAssignment>
            data={employeeShiftAssignments}
            columns={assignmentColumns}
            title="Employee Shift Assignments"
            emptyMessage="No shift assignments yet. Assign a shift to an employee to get started."
            emptyDescription="Assign a shift to begin tracking employee schedules."
            loading={false}
            enableColumnVisibility={false}
            initialPageSize={15}
            pageSizeOptions={[15]}
            getRowId={(row) => row.id}
          />
        )}
      </div>

      {showAddShift && <AddShiftModal onClose={() => setShowAddShift(false)} onSave={handleAddShift} />}
      {showAssign && <AssignShiftModal onClose={() => setShowAssign(false)} onSave={handleAssignShift} />}
    </div>
  );
}

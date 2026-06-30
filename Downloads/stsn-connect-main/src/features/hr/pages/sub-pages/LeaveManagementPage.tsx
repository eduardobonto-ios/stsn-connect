/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { FileCheck, Plus, X, CheckCircle, XCircle } from "lucide-react";
import { createPortal } from "react-dom";
import { useSTSNStore } from "../../../../services/store";
import { useAppDialog } from "../../../../components/common/useAppDialog";
import AppButton from "../../../../components/common/AppButton";
import AppCard from "../../../../components/common/AppCard";
import AppTabs from "../../../../components/common/AppTabs";
import AppTable, { type AppTableColumn } from "../../../../components/common/AppTable";
import SLABadge from "../../../../components/common/SLABadge";
import { LeaveRequest, LeaveType } from "../../../../types";

const REQUEST_STATUS_COLORS: Record<string, string> = {
  Draft: "bg-stone-100 text-stone-500",
  Submitted: "bg-blue-100 text-blue-700",
  "For Approval": "bg-amber-100 text-amber-700",
  Approved: "bg-emerald-100 text-emerald-700",
  Rejected: "bg-red-100 text-red-700",
  Cancelled: "bg-stone-100 text-stone-400",
};

interface FileLeaveModalProps {
  onClose: () => void;
  onSave: (data: { employeeId: string; leaveTypeId: string; startDate: string; endDate: string; totalDays: number; reason?: string }) => void;
}

function FileLeaveModal({ onClose, onSave }: FileLeaveModalProps) {
  const { employees, leaveTypes } = useSTSNStore();
  const [employeeId, setEmployeeId] = useState("");
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState("");

  const totalDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(0, diff);
  }, [startDate, endDate]);

  const activeTypes = leaveTypes.filter((t) => t.isActive);

  return createPortal(
    <div className="app-modal-backdrop z-50 animate-fade-in text-stone-800">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-stone-200">
        <div className="modal-header-gradient text-white p-4 flex items-center justify-between">
          <h3 className="font-display font-semibold text-base">File Leave Request</h3>
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
          <div>
            <label className="text-xs font-semibold text-stone-600 block mb-1">Leave Type <span className="text-red-500">*</span></label>
            <select value={leaveTypeId} onChange={(e) => setLeaveTypeId(e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-gold/30">
              <option value="">— Select Type —</option>
              {activeTypes.map((t) => <option key={t.id} value={t.id}>{t.name} {t.isPaid ? "(Paid)" : "(Unpaid)"}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-stone-600 block mb-1">Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-gold/30" />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-600 block mb-1">End Date</label>
              <input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-gold/30" />
            </div>
          </div>
          <div className="bg-stsn-cream rounded-lg px-3 py-2 text-xs text-stone-600">
            Total days: <span className="font-bold text-stsn-brown">{totalDays}</span>
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-600 block mb-1">Reason</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-gold/30 resize-none" placeholder="Brief reason for leave..." />
          </div>
        </div>
        <div className="px-5 pb-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-xs rounded-lg border border-stone-200 hover:bg-stone-50 cursor-pointer">Cancel</button>
          <button
            disabled={!employeeId || !leaveTypeId || totalDays < 1}
            onClick={() => { onSave({ employeeId, leaveTypeId, startDate, endDate, totalDays, reason: reason || undefined }); onClose(); }}
            className="px-4 py-2 text-xs rounded-lg btn-primary-gradient text-white font-semibold cursor-pointer disabled:opacity-50"
          >
            Submit Request
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function LeaveManagementPage() {
  const { leaveRequests, leaveTypes, employees, addLeaveRequest, approveLeaveRequest, rejectLeaveRequest, cancelLeaveRequest, currentUser } = useSTSNStore();
  const { toast } = useAppDialog();

  const [tab, setTab] = useState<"requests" | "types">("requests");
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterEmployee, setFilterEmployee] = useState("All");

  const employeeMap = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);
  const leaveTypeMap = useMemo(() => new Map(leaveTypes.map((t) => [t.id, t])), [leaveTypes]);

  const filteredRequests = useMemo(() => {
    let list = [...leaveRequests];
    if (filterEmployee !== "All") list = list.filter((r) => r.employeeId === filterEmployee);
    if (filterStatus !== "All") list = list.filter((r) => r.status === filterStatus);
    return list.sort((a, b) => b.createdAt?.localeCompare(a.createdAt ?? "") ?? 0);
  }, [leaveRequests, filterEmployee, filterStatus]);

  const pendingCount = useMemo(() => leaveRequests.filter((r) => r.status === "For Approval" || r.status === "Submitted").length, [leaveRequests]);

  const legacyRequestColumns: any[] = [
    {
      title: "Employee",
      render: (_, row) => {
        const e = employeeMap.get(row.employeeId);
        return e ? <span className="text-xs font-semibold text-stone-800">{e.firstName} {e.lastName}</span> : <span className="text-xs text-stone-400">—</span>;
      },
    },
    {
      title: "Leave Type",
      render: (_, row) => {
        const t = leaveTypeMap.get(row.leaveTypeId);
        return t ? <span className="text-xs">{t.name} <span className="text-[10px] text-stone-400">{t.isPaid ? "• Paid" : "• Unpaid"}</span></span> : <span className="text-xs text-stone-400">—</span>;
      },
    },
    { title: "Start", data: "startDate", render: (v) => <span className="font-mono text-xs">{v}</span>, width: "95px" },
    { title: "End", data: "endDate", render: (v) => <span className="font-mono text-xs">{v}</span>, width: "95px" },
    { title: "Days", data: "totalDays", render: (v) => <span className="text-xs font-semibold">{v}</span>, width: "50px" },
    {
      title: "Status",
      data: "status",
      render: (v) => <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${REQUEST_STATUS_COLORS[v] ?? "bg-gray-100 text-gray-600"}`}>{v}</span>,
      width: "110px",
    },
    {
      title: "SLA",
      orderable: false,
      searchable: false,
      render: (_, row) => (row.status === "Submitted" || row.status === "For Approval")
        ? <SLABadge dateStr={row.createdAt} />
        : <span className="text-[9px] text-stone-300">—</span>,
      width: "65px",
    },
    {
      title: "Actions",
      orderable: false,
      searchable: false,
      render: (_, row) => {
        const canAct = row.status === "Submitted" || row.status === "For Approval";
        const canCancel = row.status !== "Cancelled" && row.status !== "Approved";
        return (
          <div className="flex gap-1">
            {canAct && (
              <>
                <button onClick={(e) => { e.stopPropagation(); handleApprove(row.id); }} className="p-1 rounded hover:bg-emerald-50 cursor-pointer" title="Approve"><CheckCircle className="w-4 h-4 text-emerald-500" /></button>
                <button onClick={(e) => { e.stopPropagation(); handleReject(row.id); }} className="p-1 rounded hover:bg-red-50 cursor-pointer" title="Reject"><XCircle className="w-4 h-4 text-red-400" /></button>
              </>
            )}
            {canCancel && (
              <button onClick={(e) => { e.stopPropagation(); handleCancel(row.id); }} className="text-[10px] px-2 py-0.5 rounded border border-stone-200 text-stone-400 hover:bg-stone-50 cursor-pointer">Cancel</button>
            )}
          </div>
        );
      },
      width: "120px",
    },
  ];

  const legacyTypeColumns: any[] = [
    { title: "Code", data: "code", render: (v) => <span className="font-mono text-xs font-bold text-stsn-brown">{v}</span>, width: "80px" },
    { title: "Name", data: "name", render: (v) => <span className="text-xs font-semibold">{v}</span> },
    { title: "Paid", data: "isPaid", render: (v) => <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${v ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-500"}`}>{v ? "Paid" : "Unpaid"}</span>, width: "70px" },
    { title: "Credits/yr", data: "defaultCredits", render: (v) => <span className="text-xs">{v} days</span>, width: "80px" },
    { title: "Max/Request", data: "maxDaysPerRequest", render: (v) => <span className="text-xs">{v ? `${v} days` : "—"}</span>, width: "100px" },
    { title: "Approval Req.", data: "requiresApproval", render: (v) => <span className={`text-[10px] ${v ? "text-amber-600 font-semibold" : "text-stone-400"}`}>{v ? "Yes" : "No"}</span>, width: "100px" },
    {
      title: "Status",
      data: "isActive",
      render: (v) => v
        ? <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">Active</span>
        : <span className="text-[10px] bg-stone-100 text-stone-400 px-2 py-0.5 rounded-full font-semibold">Inactive</span>,
      width: "75px",
    },
  ];

  void legacyRequestColumns;
  void legacyTypeColumns;

  const requestColumns: AppTableColumn<LeaveRequest>[] = [
    {
      accessorKey: "employeeId",
      header: "Employee",
      cell: ({ row }) => {
        const e = employeeMap.get(row.original.employeeId);
        return e ? <span className="text-xs font-semibold text-stone-800">{e.firstName} {e.lastName}</span> : <span className="text-xs text-stone-400">—</span>;
      },
    },
    {
      accessorKey: "leaveTypeId",
      header: "Leave Type",
      cell: ({ row }) => {
        const t = leaveTypeMap.get(row.original.leaveTypeId);
        return t ? <span className="text-xs">{t.name} <span className="text-[10px] text-stone-400">{t.isPaid ? "• Paid" : "• Unpaid"}</span></span> : <span className="text-xs text-stone-400">—</span>;
      },
    },
    { accessorKey: "startDate", header: "Start", cell: ({ getValue }) => <span className="font-mono text-xs">{String(getValue())}</span> },
    { accessorKey: "endDate", header: "End", cell: ({ getValue }) => <span className="font-mono text-xs">{String(getValue())}</span> },
    { accessorKey: "totalDays", header: "Days", cell: ({ getValue }) => <span className="text-xs font-semibold">{String(getValue())}</span> },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => {
        const value = String(getValue());
        return <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${REQUEST_STATUS_COLORS[value] ?? "bg-gray-100 text-gray-600"}`}>{value}</span>;
      },
    },
    {
      id: "sla",
      header: "SLA",
      enableSorting: false,
      enableGlobalFilter: false,
      cell: ({ row }) => (row.original.status === "Submitted" || row.original.status === "For Approval")
        ? <SLABadge dateStr={row.original.createdAt} />
        : <span className="text-[9px] text-stone-300">—</span>,
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      enableGlobalFilter: false,
      cell: ({ row }) => {
        const req = row.original;
        const canAct = req.status === "Submitted" || req.status === "For Approval";
        const canCancel = req.status !== "Cancelled" && req.status !== "Approved";
        return (
          <div className="flex gap-1">
            {canAct && (
              <>
                <button type="button" onClick={(e) => { e.stopPropagation(); handleApprove(req.id); }} className="p-1 rounded hover:bg-emerald-50 cursor-pointer" title="Approve"><CheckCircle className="w-4 h-4 text-emerald-500" /></button>
                <button type="button" onClick={(e) => { e.stopPropagation(); handleReject(req.id); }} className="p-1 rounded hover:bg-red-50 cursor-pointer" title="Reject"><XCircle className="w-4 h-4 text-red-400" /></button>
              </>
            )}
            {canCancel && (
              <button type="button" onClick={(e) => { e.stopPropagation(); handleCancel(req.id); }} className="text-[10px] px-2 py-0.5 rounded border border-stone-200 text-stone-400 hover:bg-stone-50 cursor-pointer">Cancel</button>
            )}
          </div>
        );
      },
    },
  ];

  const typeColumns: AppTableColumn<LeaveType>[] = [
    { accessorKey: "code", header: "Code", cell: ({ getValue }) => <span className="font-mono text-xs font-bold text-stsn-brown">{String(getValue())}</span> },
    { accessorKey: "name", header: "Name", cell: ({ getValue }) => <span className="text-xs font-semibold">{String(getValue())}</span> },
    { accessorKey: "isPaid", header: "Paid", cell: ({ getValue }) => getValue<boolean>() ? <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-700">Paid</span> : <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-stone-100 text-stone-500">Unpaid</span> },
    { accessorKey: "defaultCredits", header: "Credits/yr", cell: ({ getValue }) => <span className="text-xs">{String(getValue())} days</span> },
    { accessorKey: "maxDaysPerRequest", header: "Max/Request", cell: ({ getValue }) => <span className="text-xs">{getValue<number | undefined>() ? `${getValue<number>()} days` : "—"}</span> },
    { accessorKey: "requiresApproval", header: "Approval Req.", cell: ({ getValue }) => <span className={`text-[10px] ${getValue<boolean>() ? "text-amber-600 font-semibold" : "text-stone-400"}`}>{getValue<boolean>() ? "Yes" : "No"}</span> },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ getValue }) => getValue<boolean>()
        ? <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">Active</span>
        : <span className="text-[10px] bg-stone-100 text-stone-400 px-2 py-0.5 rounded-full font-semibold">Inactive</span>,
    },
  ];

  const handleApprove = (id: string) => {
    approveLeaveRequest(id, currentUser?.name ?? "HR");
    toast("Leave request approved.");
  };
  const handleReject = (id: string) => {
    rejectLeaveRequest(id, currentUser?.name ?? "HR", "");
    toast("Leave request rejected.");
  };
  const handleCancel = (id: string) => {
    cancelLeaveRequest(id);
    toast("Leave request cancelled.");
  };
  const handleFile = (data: Parameters<FileLeaveModalProps["onSave"]>[0]) => {
    addLeaveRequest({ ...data, status: "Submitted" });
    toast("Leave request submitted.");
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <AppCard className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" tone="brand">
        <div>
          <h2 className="text-xl font-display font-semibold text-stone-900 tracking-tight flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-stsn-brown" />
            Leave Management
          </h2>
          <p className="text-stone-500 text-xs mt-1">Leave filing, approval workflow, and leave type configuration.</p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full font-semibold">{pendingCount} pending approval{pendingCount > 1 ? "s" : ""}</span>
          )}
          {tab === "requests" && (
            <AppButton onClick={() => setShowModal(true)} size="sm" leftIcon={Plus}>
              File Leave
            </AppButton>
          )}
        </div>
      </AppCard>

      <AppTabs
        items={[
          { value: "requests", label: "Requests", badge: leaveRequests.length },
          { value: "types", label: "Leave Types", badge: leaveTypes.length },
        ]}
        value={tab}
        onChange={(value) => setTab(value)}
      />

      {tab === "requests" && (
        <AppTable<LeaveRequest>
          data={filteredRequests}
          columns={requestColumns}
          title="Leave Requests"
          searchPlaceholder="Search leave requests..."
          emptyMessage="No leave requests found."
          emptyDescription="Adjust the employee, status, or search filters."
          loading={false}
          enableColumnVisibility={false}
          initialPageSize={15}
          pageSizeOptions={[15]}
          getRowId={(row) => row.id}
          getRowClassName={(req) => {
            if (req.status === "Rejected" || req.status === "Cancelled") return "bg-red-50";
            if (req.status === "Approved") return "bg-emerald-50";
            if (req.status === "Submitted" || req.status === "For Approval") return "bg-amber-50";
            if (req.status === "Draft") return "bg-blue-50";
            return undefined;
          }}
          toolbar={
            <>
              <select value={filterEmployee} onChange={(e) => setFilterEmployee(e.target.value)} className="border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-stsn-gold cursor-pointer bg-stone-50">
                <option value="All">All Employees</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-stsn-gold cursor-pointer bg-stone-50">
                <option value="All">All Statuses</option>
                {["Draft", "Submitted", "For Approval", "Approved", "Rejected", "Cancelled"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </>
          }
        />
      )}

      {tab === "types" && (
        <AppTable<LeaveType>
          data={leaveTypes}
          columns={typeColumns}
          title="Leave Types"
          searchPlaceholder="Search leave types..."
          emptyMessage="No leave types configured."
          emptyDescription="Add leave types before filing leave requests."
          loading={false}
          enableColumnVisibility={false}
          initialPageSize={10}
          pageSizeOptions={[10]}
          getRowId={(row) => row.id}
        />
      )}

      {showModal && <FileLeaveModal onClose={() => setShowModal(false)} onSave={handleFile} />}
    </div>
  );
}

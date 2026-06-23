/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { Users, ChevronRight, X, Clock } from "lucide-react";
import { useSTSNStore } from "../../../../services/store";
import { useAppDialog } from "../../../../components/common/useAppDialog";
import STSNDataTable, { type STSNColumn } from "../../../../components/common/STSNDataTable";
import { Employee, EmployeeLifecycleEvent } from "../../../../types";
import { EMPLOYMENT_STATUSES } from "../../utils/payrollCalculations";
import { createPortal } from "react-dom";

const STATUS_COLORS: Record<string, string> = {
  Active:         "bg-emerald-100 text-emerald-700",
  Regular:        "bg-green-100 text-green-700",
  Probationary:   "bg-blue-100 text-blue-700",
  "For Onboarding": "bg-cyan-100 text-cyan-700",
  Applicant:      "bg-slate-100 text-slate-600",
  "On Leave":     "bg-amber-100 text-amber-700",
  Suspended:      "bg-orange-100 text-orange-700",
  Resigned:       "bg-stone-100 text-stone-600",
  Terminated:     "bg-red-100 text-red-700",
  Retired:        "bg-purple-100 text-purple-700",
  Inactive:       "bg-gray-100 text-gray-500",
};

function StatusBadge({ status }: { status?: string }) {
  const s = status ?? "Active";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLORS[s] ?? "bg-gray-100 text-gray-600"}`}>
      {s}
    </span>
  );
}

interface ChangeStatusModalProps {
  employee: Employee;
  onClose: () => void;
  onConfirm: (toStatus: string, remarks: string) => void;
}

function ChangeStatusModal({ employee, onClose, onConfirm }: ChangeStatusModalProps) {
  const [toStatus, setToStatus] = useState(employee.employmentStatus ?? "Active");
  const [remarks, setRemarks] = useState("");

  return createPortal(
    <div className="app-modal-backdrop z-50 animate-fade-in text-stone-800">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-stone-200">
        <div className="modal-header-gradient text-white p-4 flex items-center justify-between">
          <h3 className="font-display font-semibold text-base">Change Employment Status</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg cursor-pointer"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <p className="text-xs text-stone-500">Employee</p>
            <p className="text-sm font-semibold text-stone-800">{employee.firstName} {employee.lastName}</p>
            <p className="text-xs text-stone-400">{employee.position} — {employee.department}</p>
          </div>
          <div>
            <p className="text-xs text-stone-500 mb-1">Current Status</p>
            <StatusBadge status={employee.employmentStatus} />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-600 block mb-1">New Status <span className="text-red-500">*</span></label>
            <select
              value={toStatus}
              onChange={(e) => setToStatus(e.target.value)}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-gold/30"
            >
              {EMPLOYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-600 block mb-1">Remarks</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              placeholder="Reason for status change..."
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-gold/30 resize-none"
            />
          </div>
        </div>
        <div className="px-5 pb-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-xs rounded-lg border border-stone-200 hover:bg-stone-50 cursor-pointer">Cancel</button>
          <button
            onClick={() => { onConfirm(toStatus, remarks); onClose(); }}
            disabled={toStatus === (employee.employmentStatus ?? "Active")}
            className="px-4 py-2 text-xs rounded-lg btn-primary-gradient text-white font-semibold cursor-pointer disabled:opacity-50"
          >
            Save Status Change
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

interface ProfilePanelProps {
  employee: Employee;
  lifecycleEvents: EmployeeLifecycleEvent[];
  onClose: () => void;
  onChangeStatus: () => void;
}

function ProfilePanel({ employee, lifecycleEvents, onClose, onChangeStatus }: ProfilePanelProps) {
  const empEvents = lifecycleEvents.filter((e) => e.employeeId === employee.id);
  return (
    <div className="bg-white border border-stsn-beige rounded-xl shadow-sm flex flex-col h-full">
      <div className="p-4 border-b border-stsn-beige flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-stone-800">{employee.firstName} {employee.lastName}</p>
          <p className="text-xs text-stone-500">{employee.employeeNo ?? "No EE #"} · {employee.position}</p>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-stone-100 rounded-lg cursor-pointer"><X className="w-4 h-4 text-stone-400" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-3">
          {[
            ["Department", employee.department],
            ["Contract", employee.status],
            ["Employment Status", <StatusBadge status={employee.employmentStatus} />],
            ["Monthly Salary", `₱${employee.salary.toLocaleString()}`],
            ["Hire Date", employee.hireDate ?? "—"],
            ["Regularization", employee.regularizationDate ?? "—"],
            ["Leave Balance", `${employee.leaveBalance} days`],
            ["Email", employee.email],
          ].map(([label, val]) => (
            <div key={String(label)}>
              <p className="text-[10px] uppercase font-mono tracking-wider text-stone-400">{label}</p>
              <p className="text-stone-700 font-medium mt-0.5">{val}</p>
            </div>
          ))}
        </div>
        {employee.contact && (
          <div><p className="text-[10px] uppercase font-mono tracking-wider text-stone-400">Contact</p><p className="text-stone-700">{employee.contact}</p></div>
        )}
        {employee.address && (
          <div><p className="text-[10px] uppercase font-mono tracking-wider text-stone-400">Address</p><p className="text-stone-700">{employee.address}</p></div>
        )}

        <div className="pt-2 border-t border-stone-100">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-3.5 h-3.5 text-stsn-brown" />
            <p className="text-[11px] font-semibold text-stone-700 uppercase tracking-wide">Lifecycle Events</p>
          </div>
          {empEvents.length === 0 ? (
            <p className="text-stone-400 text-[11px]">No lifecycle events recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {empEvents.map((ev) => (
                <div key={ev.id} className="border border-stone-100 rounded-lg p-2.5 bg-stone-50">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-stone-700">{ev.eventType}</span>
                    <span className="text-[9px] text-stone-400 font-mono shrink-0">{ev.effectiveDate}</span>
                  </div>
                  {(ev.fromStatus || ev.toStatus) && (
                    <p className="text-stone-500 mt-0.5">
                      {ev.fromStatus && <><StatusBadge status={ev.fromStatus} /> → </>}
                      {ev.toStatus && <StatusBadge status={ev.toStatus} />}
                    </p>
                  )}
                  {ev.remarks && <p className="text-stone-500 mt-0.5 italic">{ev.remarks}</p>}
                  {ev.createdBy && <p className="text-[10px] text-stone-400 mt-0.5">By: {ev.createdBy}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="p-4 border-t border-stone-100">
        <button
          onClick={onChangeStatus}
          className="w-full btn-primary-gradient text-white text-xs font-semibold py-2 rounded-lg cursor-pointer"
        >
          Change Status
        </button>
      </div>
    </div>
  );
}

export default function EmployeeLifecyclePage() {
  const {
    employees, employeeLifecycleEvents, currentUser, activeSchool,
    updateEmployeeLifecycleStatus,
  } = useSTSNStore();
  const { toast } = useAppDialog();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterDept, setFilterDept] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showChangeStatus, setShowChangeStatus] = useState(false);

  const userSchool = currentUser?.schoolId;
  const effectiveSchool = userSchool ?? (activeSchool !== "ALL" ? activeSchool : undefined);

  const filtered = useMemo(() => {
    let list = employees.filter((e) => !effectiveSchool || !e.schoolId || e.schoolId === effectiveSchool);
    if (filterDept !== "All") list = list.filter((e) => e.department === filterDept);
    if (filterStatus !== "All") list = list.filter((e) => (e.employmentStatus ?? "Active") === filterStatus);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((e) =>
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
        e.position.toLowerCase().includes(q) ||
        (e.employeeNo ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [employees, effectiveSchool, filterDept, filterStatus, searchQuery]);

  const departments = useMemo(() => ["All", ...Array.from(new Set(employees.map((e) => e.department)))], [employees]);

  const columns: STSNColumn<Employee>[] = [
    {
      title: "EE #",
      data: "employeeNo",
      render: (v) => <span className="font-mono text-[10px] text-stone-500">{v ?? "—"}</span>,
      width: "80px",
    },
    {
      title: "Name",
      render: (_, row) => (
        <div>
          <p className="font-semibold text-stone-800 text-xs">{row.firstName} {row.lastName}</p>
          <p className="text-[10px] text-stone-400">{row.position}</p>
        </div>
      ),
    },
    { title: "Department", data: "department", render: (v) => <span className="text-xs">{v}</span> },
    {
      title: "Contract",
      data: "status",
      render: (v) => <span className="text-xs text-stone-600">{v}</span>,
      width: "100px",
    },
    {
      title: "Employment Status",
      data: "employmentStatus",
      render: (v) => <StatusBadge status={v} />,
      width: "130px",
    },
    {
      title: "Hire Date",
      data: "hireDate",
      render: (v) => <span className="text-xs font-mono text-stone-500">{v ?? "—"}</span>,
      width: "100px",
    },
    {
      title: "Leave Bal.",
      data: "leaveBalance",
      render: (v) => <span className="text-xs font-mono">{v} days</span>,
      width: "80px",
    },
    {
      title: "",
      orderable: false,
      searchable: false,
      render: (_, row) => (
        <button
          onClick={(e) => { e.stopPropagation(); setSelectedEmployee(row); }}
          className="p-1 hover:bg-stsn-cream rounded cursor-pointer"
        >
          <ChevronRight className="w-4 h-4 text-stone-400" />
        </button>
      ),
      width: "40px",
    },
  ];

  const handleChangeStatus = (toStatus: string, remarks: string) => {
    if (!selectedEmployee) return;
    const fromStatus = selectedEmployee.employmentStatus ?? "Active";
    updateEmployeeLifecycleStatus(
      selectedEmployee.id, toStatus, fromStatus, remarks, currentUser?.name ?? "HR"
    );
    setSelectedEmployee((prev) => prev ? { ...prev, employmentStatus: toStatus } : prev);
    toast(`Status changed to ${toStatus} for ${selectedEmployee.firstName} ${selectedEmployee.lastName}.`);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-white border border-stsn-beige rounded-xl shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-display font-semibold text-stone-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-stsn-brown" />
            Employee Life Cycles
          </h2>
          <p className="text-stone-500 text-xs mt-1">
            Employee records, employment status tracking, and lifecycle movement history.
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-display font-bold text-stsn-brown">{employees.length}</p>
          <p className="text-[10px] text-stone-400 uppercase font-mono tracking-wider">Total Employees</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-stsn-beige rounded-xl px-4 py-3 shadow-sm flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search name, position, EE #..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border border-stone-200 rounded-lg px-3 py-2 text-xs w-56 focus:outline-none focus:ring-2 focus:ring-stsn-gold/30"
        />
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-stsn-gold/30"
        >
          {departments.map((d) => <option key={d}>{d}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-stsn-gold/30"
        >
          <option value="All">All Statuses</option>
          {EMPLOYMENT_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Main content */}
      <div className={`flex gap-4 ${selectedEmployee ? "flex-col lg:flex-row" : ""}`}>
        <div className={`${selectedEmployee ? "lg:flex-1" : "w-full"} bg-white border border-stsn-beige rounded-xl shadow-sm overflow-hidden p-1`}>
          <STSNDataTable<Employee>
            columns={columns}
            rows={filtered}
            emptyMessage="No employees found matching the current filters."
            searchable={false}
            pageLength={15}
            onRowClick={(row) => setSelectedEmployee(row)}
            selectedId={selectedEmployee?.id}
          />
        </div>

        {selectedEmployee && (
          <div className="lg:w-80 xl:w-96 flex-shrink-0">
            <ProfilePanel
              employee={selectedEmployee}
              lifecycleEvents={employeeLifecycleEvents}
              onClose={() => setSelectedEmployee(null)}
              onChangeStatus={() => setShowChangeStatus(true)}
            />
          </div>
        )}
      </div>

      {/* Status change modal */}
      {showChangeStatus && selectedEmployee && (
        <ChangeStatusModal
          employee={selectedEmployee}
          onClose={() => setShowChangeStatus(false)}
          onConfirm={handleChangeStatus}
        />
      )}
    </div>
  );
}

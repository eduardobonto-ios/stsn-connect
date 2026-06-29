/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { UserCheck, CheckCircle, Clock, SkipForward, X, ChevronRight } from "lucide-react";
import { useSTSNStore } from "../../../../services/store";
import { useAppDialog } from "../../../../components/common/useAppDialog";
import AppTable, {
  appTableColumnsFromLegacy,
  type AppTableLegacyColumn,
} from "../../../../components/common/AppTable";
import { EmployeeOnboardingTask, OnboardingTask } from "../../../../types";

const TASK_STATUS_COLORS: Record<string, string> = {
  Pending: "bg-stone-100 text-stone-500",
  "In Progress": "bg-blue-100 text-blue-700",
  Completed: "bg-emerald-100 text-emerald-700",
  Skipped: "bg-stone-100 text-stone-400",
  Overdue: "bg-red-100 text-red-700",
};

interface EmployeeChecklistProps {
  employeeId: string;
  onClose: () => void;
}

function EmployeeChecklist({ employeeId, onClose }: EmployeeChecklistProps) {
  const { employees, employeeOnboardingTasks, onboardingTasks, completeOnboardingTask, skipOnboardingTask, currentUser } = useSTSNStore();
  const { toast } = useAppDialog();

  const employee = employees.find((e) => e.id === employeeId);
  const empTasks = employeeOnboardingTasks.filter((t) => t.employeeId === employeeId);
  const taskMap = useMemo(() => new Map(onboardingTasks.map((t) => [t.id, t])), [onboardingTasks]);

  const completed = empTasks.filter((t) => t.status === "Completed").length;
  const total = empTasks.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const sorted = [...empTasks].sort((a, b) => {
    const ta = taskMap.get(a.onboardingTaskId);
    const tb = taskMap.get(b.onboardingTaskId);
    return (ta?.sortOrder ?? 0) - (tb?.sortOrder ?? 0);
  });

  return (
    <div className="bg-white border border-stsn-beige rounded-xl shadow-sm flex flex-col">
      <div className="p-4 border-b border-stone-100 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-stone-800">{employee?.firstName} {employee?.lastName}</p>
          <p className="text-xs text-stone-500">{employee?.position} — Onboarding Checklist</p>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-stone-100 rounded-lg cursor-pointer"><X className="w-4 h-4 text-stone-400" /></button>
      </div>
      <div className="p-4 border-b border-stone-100">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-stone-600 font-medium">Progress</span>
          <span className="font-mono font-semibold text-stsn-brown">{completed}/{total} ({pct}%)</span>
        </div>
        <div className="h-2 bg-stone-100 rounded-full">
          <div className="h-2 bg-stsn-brown rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto max-h-96">
        {sorted.length === 0 ? (
          <p className="text-xs text-stone-400 text-center py-8">No onboarding tasks assigned.</p>
        ) : (
          <div className="divide-y divide-stone-50">
            {sorted.map((empTask) => {
              const task = taskMap.get(empTask.onboardingTaskId);
              const isDone = empTask.status === "Completed";
              const isSkipped = empTask.status === "Skipped";
              return (
                <div key={empTask.id} className={`p-3 flex items-start gap-3 ${isDone ? "opacity-60" : ""}`}>
                  <div className="mt-0.5">
                    {isDone ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : isSkipped ? (
                      <SkipForward className="w-4 h-4 text-stone-300 shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold ${isDone ? "line-through text-stone-400" : "text-stone-800"}`}>{task?.taskName ?? "Unknown Task"}</p>
                    {task?.description && <p className="text-[10px] text-stone-400 mt-0.5">{task.description}</p>}
                    {task?.responsibleParty && <p className="text-[10px] text-stone-400">Responsible: {task.responsibleParty}</p>}
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${TASK_STATUS_COLORS[empTask.status] ?? "bg-gray-100 text-gray-600"}`}>{empTask.status}</span>
                      {empTask.dueDate && <span className="text-[10px] text-stone-400">Due: {empTask.dueDate}</span>}
                      {empTask.completedAt && <span className="text-[10px] text-stone-400">Done: {empTask.completedAt.split("T")[0]}</span>}
                    </div>
                  </div>
                  {!isDone && !isSkipped && (
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => { completeOnboardingTask(empTask.id, currentUser?.name ?? "HR"); toast(`Task "${task?.taskName}" completed.`); }}
                        className="text-[10px] px-2 py-0.5 rounded border border-emerald-200 text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                      >
                        Done
                      </button>
                      <button
                        onClick={() => { skipOnboardingTask(empTask.id); toast(`Task "${task?.taskName}" skipped.`); }}
                        className="text-[10px] px-2 py-0.5 rounded border border-stone-200 text-stone-400 hover:bg-stone-50 cursor-pointer"
                      >
                        Skip
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const { employees, employeeOnboardingTasks, onboardingTemplates, onboardingTasks } = useSTSNStore();

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("All");

  const onboardingEmployees = useMemo(() => {
    return employees.filter((e) =>
      e.employmentStatus === "For Onboarding" || employeeOnboardingTasks.some((t) => t.employeeId === e.id)
    );
  }, [employees, employeeOnboardingTasks]);

  const filtered = useMemo(() => {
    if (filterStatus === "All") return onboardingEmployees;
    return onboardingEmployees.filter((e) => {
      const tasks = employeeOnboardingTasks.filter((t) => t.employeeId === e.id);
      if (filterStatus === "Complete") return tasks.length > 0 && tasks.every((t) => t.status === "Completed" || t.status === "Skipped");
      if (filterStatus === "In Progress") return tasks.some((t) => t.status === "In Progress" || t.status === "Pending");
      return true;
    });
  }, [onboardingEmployees, filterStatus, employeeOnboardingTasks]);

  const taskMap = useMemo(() => new Map(onboardingTasks.map((t) => [t.id, t])), [onboardingTasks]);

  type EmpRow = typeof onboardingEmployees[0];

  const empColumns: AppTableLegacyColumn<EmpRow>[] = [
    {
      title: "Employee",
      render: (_, row) => (
        <div>
          <p className="text-xs font-semibold text-stone-800">{row.firstName} {row.lastName}</p>
          <p className="text-[10px] text-stone-400">{row.position} · {row.department}</p>
        </div>
      ),
    },
    {
      title: "Status",
      data: "employmentStatus",
      render: (v) => <span className="text-[10px] bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full font-semibold">{v ?? "For Onboarding"}</span>,
      width: "120px",
    },
    {
      title: "Tasks",
      render: (_, row) => {
        const tasks = employeeOnboardingTasks.filter((t) => t.employeeId === row.id);
        const done = tasks.filter((t) => t.status === "Completed").length;
        const total = tasks.length;
        if (total === 0) return <span className="text-xs text-stone-400">No tasks</span>;
        const pct = Math.round((done / total) * 100);
        return (
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 bg-stone-100 rounded-full flex-shrink-0">
              <div className="h-1.5 bg-stsn-brown rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <span className="font-mono text-xs text-stone-600">{done}/{total}</span>
          </div>
        );
      },
      width: "140px",
    },
    {
      title: "Pending",
      render: (_, row) => {
        const pending = employeeOnboardingTasks.filter((t) => t.employeeId === row.id && (t.status === "Pending" || t.status === "In Progress")).length;
        return pending > 0
          ? <span className="text-xs text-amber-600 font-semibold">{pending} pending</span>
          : <span className="text-xs text-stone-400">—</span>;
      },
      width: "80px",
    },
    {
      title: "",
      orderable: false,
      searchable: false,
      render: (_, row) => (
        <button onClick={(e) => { e.stopPropagation(); setSelectedEmployeeId(row.id); }} className="p-1 hover:bg-stsn-cream rounded cursor-pointer">
          <ChevronRight className="w-4 h-4 text-stone-400" />
        </button>
      ),
      width: "40px",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-white border border-stsn-beige rounded-xl shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-display font-semibold text-stone-900 tracking-tight flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-stsn-brown" />
            Onboarding
          </h2>
          <p className="text-stone-500 text-xs mt-1">Track new hire checklists and onboarding task completion.</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-display font-bold text-stsn-brown">{onboardingEmployees.length}</p>
          <p className="text-[10px] text-stone-400 uppercase font-mono tracking-wider">Employees Onboarding</p>
        </div>
      </div>

      {onboardingTemplates.length > 0 && (
        <div className="bg-stsn-cream border border-stsn-beige rounded-xl p-4 text-xs text-stone-600">
          <p className="font-semibold mb-1">Onboarding Templates</p>
          <div className="flex flex-wrap gap-2 mt-1">
            {onboardingTemplates.filter((t) => t.isActive).map((tmpl) => {
              const count = onboardingTasks.filter((t) => t.templateId === tmpl.id).length;
              return (
                <span key={tmpl.id} className="text-[10px] bg-white border border-stone-200 px-2.5 py-1 rounded-full text-stone-600">
                  {tmpl.name} <span className="text-stone-400">({count} tasks)</span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div className={`flex gap-4 ${selectedEmployeeId ? "flex-col lg:flex-row" : ""}`}>
        {onboardingEmployees.length === 0 ? (
          <section className={`overflow-hidden rounded-lg border border-[var(--erp-border)] bg-[var(--erp-surface)] shadow-sm ${selectedEmployeeId ? "lg:flex-1" : "w-full"}`}>
            <div className="border-b border-[var(--erp-border)] px-4 py-3">
              <h3 className="text-sm font-bold text-[var(--erp-text)]">Onboarding Employees</h3>
            </div>
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <UserCheck className="w-10 h-10 text-stone-200" />
              <p className="text-sm font-semibold text-stone-500">No employees in onboarding</p>
              <p className="text-xs text-stone-400 text-center max-w-xs">
                Employees with "For Onboarding" status or assigned onboarding tasks will appear here. Set an employee's status to "For Onboarding" from the Employee Life Cycles page.
              </p>
            </div>
          </section>
        ) : (
          <AppTable<EmpRow>
            title="Onboarding Employees"
            enableSearch={false}
            toolbar={
              <>
                {["All", "In Progress", "Complete"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`text-xs px-3 py-1 rounded-full border font-semibold cursor-pointer transition-all ${filterStatus === s ? "bg-stsn-brown text-white border-stsn-brown" : "border-stone-200 text-stone-500 hover:border-stsn-gold"}`}
                  >
                    {s}
                  </button>
                ))}
                <span className="text-[11px] font-mono text-stone-400 whitespace-nowrap">{filtered.length} employee(s)</span>
              </>
            }
            className={selectedEmployeeId ? "lg:flex-1" : "w-full"}
            data={filtered}
            columns={appTableColumnsFromLegacy(empColumns)}
            emptyMessage="No employees match the current filter."
            loading={false}
            initialPageSize={10}
            pageSizeOptions={[10]}
            getRowId={(row) => row.id}
            onRowClick={(row) => setSelectedEmployeeId(row.id)}
            selectedRowId={selectedEmployeeId ?? undefined}
          />
        )}
        {selectedEmployeeId && (
          <div className="lg:w-96 flex-shrink-0">
            <EmployeeChecklist
              employeeId={selectedEmployeeId}
              onClose={() => setSelectedEmployeeId(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

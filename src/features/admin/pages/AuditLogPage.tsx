/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import { Shield, Search, Download } from "lucide-react";
import { useSTSNStore } from "../../../services/store";
import type { AuditEntityType, AuditAction, AuditLogEntry } from "../../../types";
import STSNDataTable, { type STSNColumn } from "../../../components/common/STSNDataTable";
import DrilldownDrawer from "../../../components/common/DrilldownDrawer";

const ACTION_BADGE: Record<AuditAction, string> = {
  created:   "bg-blue-50 text-blue-700 border-blue-200",
  updated:   "bg-amber-50 text-amber-700 border-amber-200",
  approved:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected:  "bg-red-50 text-red-700 border-red-200",
  returned:  "bg-orange-50 text-orange-700 border-orange-200",
  deleted:   "bg-red-100 text-red-800 border-red-300",
  finalized: "bg-purple-50 text-purple-700 border-purple-200",
  submitted: "bg-sky-50 text-sky-700 border-sky-200",
  voided:    "bg-stone-100 text-stone-600 border-stone-300",
  delegated: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

const ALL_ENTITY_TYPES: AuditEntityType[] = [
  "enrollment", "assessment", "payment", "grade",
  "employee", "leave", "void", "user", "discount",
  "payroll", "delegation",
];

function ActionBadge({ action }: { action: AuditAction }) {
  return (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border capitalize ${ACTION_BADGE[action] ?? "bg-stone-100 text-stone-600 border-stone-200"}`}>
      {action}
    </span>
  );
}

export default function AuditLogPage() {
  const { auditLog } = useSTSNStore();
  const [search, setSearch] = useState("");
  const [filterEntity, setFilterEntity] = useState<AuditEntityType | "">("");
  const [filterAction, setFilterAction] = useState<AuditAction | "">("");
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return auditLog.filter((e) => {
      if (filterEntity && e.entityType !== filterEntity) return false;
      if (filterAction && e.action !== filterAction) return false;
      if (q && !e.actorName.toLowerCase().includes(q) && !e.entityId.includes(q) && !(e.remarks ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [auditLog, search, filterEntity, filterAction]);

  const handleExport = () => {
    const headers = ["Timestamp", "Actor", "Role", "School", "Entity Type", "Entity ID", "Action", "Remarks"];
    const rows = filtered.map((e) => [
      e.timestamp, e.actorName, e.actorRole, e.schoolId ?? "ALL",
      e.entityType, e.entityId, e.action, e.remarks ?? "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `audit-log-${new Date().toISOString().split("T")[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const columns: STSNColumn<AuditLogEntry>[] = [
    {
      title: "Timestamp",
      data: "timestamp",
      render: (v: string) => (
        <span className="font-mono text-[10px] text-stone-400">
          {v.replace("T", " ").substring(0, 16)}
        </span>
      ),
    },
    {
      title: "Actor",
      data: "actorName",
      className: "font-semibold text-stone-700",
    },
    {
      title: "Role",
      data: "actorRole",
      render: (v: string) => (
        <span className="text-[10px] font-mono text-stone-500">{v}</span>
      ),
    },
    {
      title: "Entity Type",
      data: "entityType",
      render: (v: string) => (
        <span className="text-[10px] capitalize text-stone-500">{v}</span>
      ),
    },
    {
      title: "Action",
      data: "action",
      render: (v: AuditAction) => <ActionBadge action={v} />,
    },
    {
      title: "Remarks",
      data: "remarks",
      orderable: false,
      render: (v: string | undefined) => (
        <span className="text-[10px] text-stone-400 truncate max-w-[160px] block">{v ?? "—"}</span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-stsn-gold/10 border border-stsn-gold/20 flex items-center justify-center">
            <Shield className="w-4.5 h-4.5 text-stsn-gold" />
          </div>
          <div>
            <h2 className="text-sm font-display font-bold text-stsn-brown-dark">Central Audit Log</h2>
            <p className="text-[10px] text-stone-400 mt-0.5">Immutable record of all approval-sensitive actions — click a row to inspect details</p>
          </div>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-white border border-stone-200 rounded-xl shadow-sm hover:bg-stsn-cream transition cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-stsn-beige shadow-sm p-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[180px] bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5">
          <Search className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search actor, entity ID, remarks…"
            className="flex-1 text-xs outline-none bg-transparent text-stone-700 placeholder-stone-400"
          />
        </div>
        <select
          value={filterEntity}
          onChange={(e) => setFilterEntity(e.target.value as AuditEntityType | "")}
          className="text-xs border border-stone-200 rounded-lg px-2.5 py-1.5 bg-stone-50 text-stone-700 outline-none focus:ring-1 focus:ring-stsn-gold cursor-pointer"
        >
          <option value="">All Entity Types</option>
          {ALL_ENTITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value as AuditAction | "")}
          className="text-xs border border-stone-200 rounded-lg px-2.5 py-1.5 bg-stone-50 text-stone-700 outline-none focus:ring-1 focus:ring-stsn-gold cursor-pointer"
        >
          <option value="">All Actions</option>
          {(Object.keys(ACTION_BADGE) as AuditAction[]).map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <span className="text-[10px] text-stone-400 self-center font-mono">{filtered.length} entries</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-stsn-beige shadow-sm overflow-hidden">
        <STSNDataTable<AuditLogEntry>
          columns={columns}
          rows={filtered}
          searchable={false}
          pageLength={25}
          onRowClick={(row) => setSelectedEntry(row)}
          emptyMessage="No audit entries match your filters."
          tableId="audit-log"
        />
      </div>

      {/* Drilldown Drawer */}
      <DrilldownDrawer
        open={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
        title="Audit Entry Detail"
        subtitle={selectedEntry ? `${selectedEntry.actorName} · ${selectedEntry.action}` : ""}
        width="md"
      >
        {selectedEntry && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-3">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
                <div>
                  <dt className="text-[10px] font-mono font-bold uppercase text-stone-400 mb-0.5">Timestamp</dt>
                  <dd className="font-mono text-stone-700">{selectedEntry.timestamp.replace("T", " ").substring(0, 19)}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-mono font-bold uppercase text-stone-400 mb-0.5">School</dt>
                  <dd className="font-semibold text-stone-700">{selectedEntry.schoolId ?? "ALL"}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-mono font-bold uppercase text-stone-400 mb-0.5">Actor</dt>
                  <dd className="font-semibold text-stone-700">{selectedEntry.actorName}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-mono font-bold uppercase text-stone-400 mb-0.5">Role</dt>
                  <dd className="font-mono text-stone-600">{selectedEntry.actorRole}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-mono font-bold uppercase text-stone-400 mb-0.5">Entity Type</dt>
                  <dd className="capitalize text-stone-700">{selectedEntry.entityType}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-mono font-bold uppercase text-stone-400 mb-0.5">Entity ID</dt>
                  <dd className="font-mono text-[10px] text-stone-500 break-all">{selectedEntry.entityId}</dd>
                </div>
              </dl>
              <div className="pt-1">
                <dt className="text-[10px] font-mono font-bold uppercase text-stone-400 mb-1.5">Action</dt>
                <dd><ActionBadge action={selectedEntry.action} /></dd>
              </div>
              {selectedEntry.remarks && (
                <div className="pt-1">
                  <dt className="text-[10px] font-mono font-bold uppercase text-stone-400 mb-1">Remarks</dt>
                  <dd className="text-xs text-stone-700 leading-relaxed bg-stone-50 rounded-lg p-2.5 border border-stone-100">{selectedEntry.remarks}</dd>
                </div>
              )}
              {selectedEntry.ipAddress && (
                <div className="pt-1">
                  <dt className="text-[10px] font-mono font-bold uppercase text-stone-400 mb-1">IP Address</dt>
                  <dd className="font-mono text-xs text-stone-500">{selectedEntry.ipAddress}</dd>
                </div>
              )}
            </div>

            {selectedEntry.previousValue && Object.keys(selectedEntry.previousValue).length > 0 && (
              <div className="bg-white rounded-xl border border-stone-200 p-4">
                <h3 className="text-[10px] font-mono font-bold uppercase text-stone-400 mb-2">Previous Value</h3>
                <pre className="text-[10px] font-mono text-stone-600 whitespace-pre-wrap break-all bg-stone-50 rounded-lg p-3 border border-stone-100 overflow-x-auto">
                  {JSON.stringify(selectedEntry.previousValue, null, 2)}
                </pre>
              </div>
            )}

            {selectedEntry.newValue && Object.keys(selectedEntry.newValue).length > 0 && (
              <div className="bg-white rounded-xl border border-stone-200 p-4">
                <h3 className="text-[10px] font-mono font-bold uppercase text-stone-400 mb-2">New Value</h3>
                <pre className="text-[10px] font-mono text-stone-600 whitespace-pre-wrap break-all bg-stone-50 rounded-lg p-3 border border-stone-100 overflow-x-auto">
                  {JSON.stringify(selectedEntry.newValue, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </DrilldownDrawer>
    </div>
  );
}

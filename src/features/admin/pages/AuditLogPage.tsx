/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import { Shield, Search, Download } from "lucide-react";
import { useSTSNStore } from "../../../services/store";
import type { AuditEntityType, AuditAction } from "../../../types";

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

export default function AuditLogPage() {
  const { auditLog } = useSTSNStore();
  const [search, setSearch] = useState("");
  const [filterEntity, setFilterEntity] = useState<AuditEntityType | "">("");
  const [filterAction, setFilterAction] = useState<AuditAction | "">("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return auditLog.filter((e) => {
      if (filterEntity && e.entityType !== filterEntity) return false;
      if (filterAction && e.action !== filterAction) return false;
      if (q && !e.actorName.toLowerCase().includes(q) && !e.entityId.includes(q) && !(e.remarks ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [auditLog, search, filterEntity, filterAction]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
            <p className="text-[10px] text-stone-400 mt-0.5">Immutable record of all approval-sensitive actions</p>
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
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search actor, entity ID, remarks…"
            className="flex-1 text-xs outline-none bg-transparent text-stone-700 placeholder-stone-400"
          />
        </div>
        <select
          value={filterEntity}
          onChange={(e) => { setFilterEntity(e.target.value as AuditEntityType | ""); setPage(1); }}
          className="text-xs border border-stone-200 rounded-lg px-2.5 py-1.5 bg-stone-50 text-stone-700 outline-none focus:ring-1 focus:ring-stsn-gold cursor-pointer"
        >
          <option value="">All Entity Types</option>
          {ALL_ENTITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          value={filterAction}
          onChange={(e) => { setFilterAction(e.target.value as AuditAction | ""); setPage(1); }}
          className="text-xs border border-stone-200 rounded-lg px-2.5 py-1.5 bg-stone-50 text-stone-700 outline-none focus:ring-1 focus:ring-stsn-gold cursor-pointer"
        >
          <option value="">All Actions</option>
          {(Object.keys(ACTION_BADGE) as AuditAction[]).map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <span className="text-[10px] text-stone-400 self-center font-mono">{filtered.length} entries</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-stsn-beige shadow-sm overflow-hidden">
        {/* Column headers */}
        <div className="hidden md:grid grid-cols-[160px_1fr_80px_100px_100px_80px_1fr] gap-3 px-4 py-2 bg-stone-50 border-b border-stone-100">
          {["Timestamp", "Actor", "Role", "Entity Type", "Entity ID", "Action", "Remarks"].map((h) => (
            <span key={h} className="text-[8.5px] font-mono font-bold uppercase tracking-widest text-stone-400">{h}</span>
          ))}
        </div>

        {pageRows.length === 0 ? (
          <div className="flex flex-col items-center py-12 gap-2 text-center">
            <Shield className="w-8 h-8 text-stone-200" />
            <p className="text-xs font-semibold text-stone-400">No audit entries match your filters</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-50">
            {pageRows.map((entry) => (
              <div key={entry.id} className="grid grid-cols-1 md:grid-cols-[160px_1fr_80px_100px_100px_80px_1fr] gap-1 md:gap-3 px-4 py-2.5 hover:bg-stone-50/60 transition text-xs">
                <span className="font-mono text-[10px] text-stone-400">{entry.timestamp.replace("T", " ").substring(0, 16)}</span>
                <span className="font-semibold text-stone-700 truncate">{entry.actorName}</span>
                <span className="text-[10px] font-mono text-stone-500">{entry.actorRole}</span>
                <span className="text-[10px] text-stone-500 capitalize">{entry.entityType}</span>
                <span className="font-mono text-[10px] text-stone-400 truncate">{entry.entityId.substring(0, 8)}…</span>
                <span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border capitalize ${ACTION_BADGE[entry.action] ?? "bg-stone-100 text-stone-600 border-stone-200"}`}>
                    {entry.action}
                  </span>
                </span>
                <span className="text-[10px] text-stone-400 truncate">{entry.remarks ?? "—"}</span>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-stone-100 bg-stone-50/40">
            <span className="text-[10px] text-stone-400 font-mono">Page {page} of {totalPages}</span>
            <div className="flex gap-1.5">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="text-[10px] px-2 py-1 rounded border border-stone-200 bg-white text-stone-600 hover:bg-stsn-cream disabled:opacity-40 cursor-pointer transition">
                ← Prev
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="text-[10px] px-2 py-1 rounded border border-stone-200 bg-white text-stone-600 hover:bg-stsn-cream disabled:opacity-40 cursor-pointer transition">
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

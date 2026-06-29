/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { useSTSNStore } from "../../../services/store";
import type { AuditAction, AuditEntityType, AuditLogEntry } from "../../../types";
import AppButton from "../../../components/common/AppButton";
import AppSearchInput from "../../../components/common/AppSearchInput";
import AppSelect from "../../../components/common/AppSelect";
import AppTable, { type AppTableColumn } from "../../../components/common/AppTable";
import DrilldownDrawer from "../../../components/common/DrilldownDrawer";

const ACTION_BADGE: Record<AuditAction, string> = {
  created: "bg-blue-50 text-blue-700 border-blue-200",
  updated: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  returned: "bg-orange-50 text-orange-700 border-orange-200",
  deleted: "bg-red-100 text-red-800 border-red-300",
  finalized: "bg-purple-50 text-purple-700 border-purple-200",
  submitted: "bg-sky-50 text-sky-700 border-sky-200",
  voided: "bg-stone-100 text-stone-600 border-stone-300",
  delegated: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

const ALL_ENTITY_TYPES: AuditEntityType[] = [
  "enrollment",
  "assessment",
  "payment",
  "grade",
  "employee",
  "leave",
  "void",
  "user",
  "discount",
  "payroll",
  "delegation",
];

function ActionBadge({ action }: { action: AuditAction }) {
  return (
    <span
      className={`text-[9px] font-bold px-1.5 py-0.5 rounded border capitalize ${
        ACTION_BADGE[action] ?? "bg-stone-100 text-stone-600 border-stone-200"
      }`}
    >
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
    return auditLog.filter((entry) => {
      if (filterEntity && entry.entityType !== filterEntity) return false;
      if (filterAction && entry.action !== filterAction) return false;
      if (
        q &&
        !entry.actorName.toLowerCase().includes(q) &&
        !entry.entityId.includes(q) &&
        !(entry.remarks ?? "").toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [auditLog, search, filterEntity, filterAction]);

  const handleExport = () => {
    const headers = [
      "Timestamp",
      "Actor",
      "Role",
      "School",
      "Entity Type",
      "Entity ID",
      "Action",
      "Remarks",
    ];
    const rows = filtered.map((entry) => [
      entry.timestamp,
      entry.actorName,
      entry.actorRole,
      entry.schoolId ?? "ALL",
      entry.entityType,
      entry.entityId,
      entry.action,
      entry.remarks ?? "",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-log-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const columns = useMemo<AppTableColumn<AuditLogEntry>[]>(
    () => [
      {
        accessorKey: "timestamp",
        header: "Timestamp",
        cell: ({ getValue }) => (
          <span className="font-mono text-[10px] text-stone-400">
            {String(getValue()).replace("T", " ").substring(0, 16)}
          </span>
        ),
      },
      {
        accessorKey: "actorName",
        header: "Actor",
        cell: ({ getValue }) => (
          <span className="font-semibold text-stone-700">{String(getValue())}</span>
        ),
      },
      {
        accessorKey: "actorRole",
        header: "Role",
        cell: ({ getValue }) => (
          <span className="text-[10px] font-mono text-stone-500">{String(getValue())}</span>
        ),
      },
      {
        accessorKey: "entityType",
        header: "Entity Type",
        cell: ({ getValue }) => (
          <span className="text-[10px] capitalize text-stone-500">{String(getValue())}</span>
        ),
      },
      {
        accessorKey: "action",
        header: "Action",
        cell: ({ getValue }) => <ActionBadge action={getValue<AuditAction>()} />,
      },
      {
        accessorKey: "remarks",
        header: "Remarks",
        enableSorting: false,
        cell: ({ getValue }) => (
          <span className="text-[10px] text-stone-400 truncate max-w-[160px] block">
            {getValue<string | undefined>() ?? "-"}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      <AppTable<AuditLogEntry>
        data={filtered}
        columns={columns}
        title="Central Audit Log"
        description="Immutable record of all approval-sensitive actions - click a row to inspect details"
        enableSearch={false}
        enableColumnVisibility={false}
        initialPageSize={25}
        pageSizeOptions={[25]}
        loading={false}
        emptyMessage="No audit entries match your filters."
        emptyDescription="Clear the search or filters to review audit activity."
        getRowId={(row) => row.id}
        onRowClick={(row) => setSelectedEntry(row)}
        toolbar={
          <>
            <AppSearchInput
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onClear={() => setSearch("")}
              placeholder="Search actor, entity ID, remarks..."
              aria-label="Search audit log"
              uiSize="sm"
              wrapperClassName="min-w-[224px]"
            />
            <AppSelect
              value={filterEntity}
              onChange={(event) => setFilterEntity(event.target.value as AuditEntityType | "")}
              uiSize="sm"
              className="min-w-[160px]"
            >
              <option value="">All Entity Types</option>
              {ALL_ENTITY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </AppSelect>
            <AppSelect
              value={filterAction}
              onChange={(event) => setFilterAction(event.target.value as AuditAction | "")}
              uiSize="sm"
              className="min-w-[144px]"
            >
              <option value="">All Actions</option>
              {(Object.keys(ACTION_BADGE) as AuditAction[]).map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </AppSelect>
            <span className="text-[10px] text-[var(--erp-text-muted)] font-mono whitespace-nowrap">
              {filtered.length} entries
            </span>
            <AppButton type="button" variant="outline" size="sm" leftIcon={Download} onClick={handleExport}>
              Export CSV
            </AppButton>
          </>
        }
      />

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
                  <dd className="font-mono text-stone-700">
                    {selectedEntry.timestamp.replace("T", " ").substring(0, 19)}
                  </dd>
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
                  <dd className="text-xs text-stone-700 leading-relaxed bg-stone-50 rounded-lg p-2.5 border border-stone-100">
                    {selectedEntry.remarks}
                  </dd>
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

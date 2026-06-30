/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import { Download, History, ShieldCheck } from "lucide-react";
import AppButton from "../../../components/common/AppButton";
import AppCard from "../../../components/common/AppCard";
import AppSearchInput from "../../../components/common/AppSearchInput";
import AppSelect from "../../../components/common/AppSelect";
import AppStatusBadge from "../../../components/common/AppStatusBadge";
import AppTable, { type AppTableColumn } from "../../../components/common/AppTable";
import DrilldownDrawer from "../../../components/common/DrilldownDrawer";
import { useSTSNStore } from "../../../services/store";
import type { AuditAction, AuditEntityType, AuditLogEntry } from "../../../types";

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
      className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
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
    const query = search.toLowerCase();
    return auditLog.filter((entry) => {
      if (filterEntity && entry.entityType !== filterEntity) return false;
      if (filterAction && entry.action !== filterAction) return false;
      if (
        query &&
        !entry.actorName.toLowerCase().includes(query) &&
        !entry.entityId.includes(query) &&
        !(entry.remarks ?? "").toLowerCase().includes(query)
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
          <span className="font-mono text-[10px] text-[var(--erp-text-muted)]">
            {String(getValue()).replace("T", " ").substring(0, 16)}
          </span>
        ),
      },
      {
        accessorKey: "actorName",
        header: "Actor",
        cell: ({ getValue }) => (
          <span className="font-semibold text-[var(--erp-text)]">{String(getValue())}</span>
        ),
      },
      {
        accessorKey: "actorRole",
        header: "Role",
        cell: ({ getValue }) => (
          <span className="text-[10px] font-mono text-[var(--erp-text-muted)]">{String(getValue())}</span>
        ),
      },
      {
        accessorKey: "entityType",
        header: "Entity Type",
        cell: ({ getValue }) => (
          <span className="text-[10px] capitalize text-[var(--erp-text-muted)]">
            {String(getValue())}
          </span>
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
          <span className="block max-w-[180px] truncate text-[10px] text-[var(--erp-text-muted)]">
            {getValue<string | undefined>() ?? "-"}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      <AppCard tone="brand" className="border border-[var(--erp-border)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--erp-border)] bg-white shadow-sm">
                <History className="h-5 w-5 text-[var(--erp-brand)]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-[var(--erp-text)]">
                  Central Audit Log
                </h3>
                <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[var(--erp-text-muted)]">
                  Immutable record of approval-sensitive actions, delegation changes, and user access
                  activity across the system.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[var(--erp-border)] bg-white px-4 py-3 shadow-sm">
                <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
                  Visible Entries
                </p>
                <p className="mt-1 text-2xl font-semibold text-[var(--erp-text)]">{filtered.length}</p>
              </div>
              <div className="rounded-2xl border border-[var(--erp-border)] bg-white px-4 py-3 shadow-sm">
                <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
                  Total Logged
                </p>
                <p className="mt-1 text-2xl font-semibold text-[var(--erp-text)]">{auditLog.length}</p>
              </div>
              <div className="rounded-2xl border border-[var(--erp-border)] bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
                    Audit Integrity
                  </p>
                </div>
                <p className="mt-1 text-sm font-semibold text-[var(--erp-text)]">Read-only review surface</p>
              </div>
            </div>
          </div>
          <AppButton
            type="button"
            variant="outline"
            size="sm"
            leftIcon={Download}
            onClick={handleExport}
            className="self-start"
          >
            Export CSV
          </AppButton>
        </div>
      </AppCard>

      <AppTable<AuditLogEntry>
        data={filtered}
        columns={columns}
        title="Audit Entries"
        description="Use the filters below to narrow the log, then click a row to inspect the immutable payload."
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
            <span className="whitespace-nowrap text-[10px] font-mono text-[var(--erp-text-muted)]">
              {filtered.length} entries
            </span>
          </>
        }
      />

      <DrilldownDrawer
        open={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
        title="Audit Entry Detail"
        subtitle={selectedEntry ? `${selectedEntry.actorName} • ${selectedEntry.action}` : ""}
        width="md"
      >
        {selectedEntry && (
          <div className="space-y-4">
            <AppCard className="border border-[var(--erp-border)]">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
                <div>
                  <dt className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
                    Timestamp
                  </dt>
                  <dd className="mt-1 font-mono text-[var(--erp-text)]">
                    {selectedEntry.timestamp.replace("T", " ").substring(0, 19)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
                    School
                  </dt>
                  <dd className="mt-1 font-semibold text-[var(--erp-text)]">
                    {selectedEntry.schoolId ?? "ALL"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
                    Actor
                  </dt>
                  <dd className="mt-1 font-semibold text-[var(--erp-text)]">{selectedEntry.actorName}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
                    Role
                  </dt>
                  <dd className="mt-1 font-mono text-[var(--erp-text)]">{selectedEntry.actorRole}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
                    Entity Type
                  </dt>
                  <dd className="mt-1 capitalize text-[var(--erp-text)]">{selectedEntry.entityType}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
                    Entity ID
                  </dt>
                  <dd className="mt-1 break-all font-mono text-[10px] text-[var(--erp-text-muted)]">
                    {selectedEntry.entityId}
                  </dd>
                </div>
              </dl>
              <div className="mt-4">
                <dt className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
                  Action
                </dt>
                <dd className="mt-1">
                  <ActionBadge action={selectedEntry.action} />
                </dd>
              </div>
              {selectedEntry.remarks && (
                <div className="mt-4">
                  <dt className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
                    Remarks
                  </dt>
                  <dd className="mt-1 rounded-2xl border border-[var(--erp-border)] bg-[var(--erp-surface-muted)] px-3 py-2.5 text-[var(--erp-text)]">
                    {selectedEntry.remarks}
                  </dd>
                </div>
              )}
              {selectedEntry.ipAddress && (
                <div className="mt-4">
                  <dt className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
                    IP Address
                  </dt>
                  <dd className="mt-1 font-mono text-xs text-[var(--erp-text-muted)]">
                    {selectedEntry.ipAddress}
                  </dd>
                </div>
              )}
            </AppCard>

            {selectedEntry.previousValue && Object.keys(selectedEntry.previousValue).length > 0 && (
              <AppCard className="border border-[var(--erp-border)]">
                <h3 className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
                  Previous Value
                </h3>
                <pre className="mt-2 overflow-x-auto rounded-2xl border border-[var(--erp-border)] bg-[var(--erp-surface-muted)] p-3 text-[10px] text-[var(--erp-text-muted)]">
                  {JSON.stringify(selectedEntry.previousValue, null, 2)}
                </pre>
              </AppCard>
            )}

            {selectedEntry.newValue && Object.keys(selectedEntry.newValue).length > 0 && (
              <AppCard className="border border-[var(--erp-border)]">
                <h3 className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
                  New Value
                </h3>
                <pre className="mt-2 overflow-x-auto rounded-2xl border border-[var(--erp-border)] bg-[var(--erp-surface-muted)] p-3 text-[10px] text-[var(--erp-text-muted)]">
                  {JSON.stringify(selectedEntry.newValue, null, 2)}
                </pre>
              </AppCard>
            )}
          </div>
        )}
      </DrilldownDrawer>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useRef, useEffect, useCallback, useState } from "react";
import DataTable, { type DataTableSlots } from "datatables.net-react";
import DT from "datatables.net-dt";
import "datatables.net-dt/css/dataTables.dataTables.css";
import { Inbox, Columns3 } from "lucide-react";

DataTable.use(DT);
const DataTableComponent = DataTable as unknown as React.ComponentType<any>;

export interface STSNColumn<T = any> {
  /** Column header label */
  title: string;
  /** Key on the row object to read the raw value from */
  data?: keyof T | string;
  /** Custom cell renderer - receives the raw value and the full row */
  render?: (value: any, row: T) => React.ReactNode;
  /** Extra classes applied to every cell in this column */
  className?: string;
  /** Disable sorting for this column */
  orderable?: boolean;
  /** Disable searching for this column */
  searchable?: boolean;
  /** Optional fixed width (e.g. "120px", "20%") */
  width?: string;
}

export interface STSNDataTableProps<T = any> {
  key?: React.Key;
  columns: STSNColumn<T>[];
  rows: T[];
  /** Message shown when there are no rows */
  emptyMessage?: string;
  /** Number of rows per page */
  pageLength?: number;
  /** Show the global search box */
  searchable?: boolean;
  /** Extra classes applied to the outer wrapper */
  className?: string;
  /** Optional caption shown above the table */
  caption?: string;
  /** Called when the user clicks anywhere on a data row */
  onRowClick?: (row: T) => void;
  /** ID of the currently selected row — highlights it with a left-border accent */
  selectedId?: string;

  // ---- P3-C: Bulk selection ----
  /** Enable checkbox-based bulk selection */
  bulkSelectable?: boolean;
  /** Called with the currently selected rows whenever selection changes */
  onBulkSelect?: (selectedRows: T[]) => void;
  /** Rendered above the table when at least one row is selected */
  bulkActionBar?: React.ReactNode;

  // ---- P3-C: Column visibility ----
  /** Show a "Columns" toggle button above the table */
  columnToggleable?: boolean;
  /** Column `data` keys hidden by default */
  defaultHiddenColumns?: string[];
  /** Unique key used to persist column visibility in localStorage */
  tableId?: string;

  // ---- P3-F: Row-level color coding ----
  /** Return a Tailwind bg class (e.g. "bg-red-50") based on row data */
  rowColorClass?: (row: T) => string | undefined;
}

/**
 * STSN-themed wrapper around the official DataTables React component.
 * Provides search, sorting, pagination, bulk selection, column visibility
 * toggle, and row-level color coding while preserving the brown/gold styling.
 */
export default function STSNDataTable<T = any>({
  columns,
  rows,
  emptyMessage = "No records found.",
  pageLength = 10,
  searchable = true,
  className = "",
  caption,
  onRowClick,
  selectedId,
  bulkSelectable,
  onBulkSelect,
  bulkActionBar,
  columnToggleable,
  defaultHiddenColumns,
  tableId,
  rowColorClass,
}: STSNDataTableProps<T>) {
  const onRowClickRef = useRef(onRowClick);
  useEffect(() => { onRowClickRef.current = onRowClick; });

  const selectedIdRef = useRef(selectedId);
  useEffect(() => { selectedIdRef.current = selectedId; });

  const rowColorClassRef = useRef(rowColorClass);
  useEffect(() => { rowColorClassRef.current = rowColorClass; });

  const containerRef = useRef<HTMLDivElement>(null);

  // ---- Column visibility state ----
  const storageKey = tableId ? `stsn-col-vis-${tableId}` : null;
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) return new Set(JSON.parse(saved));
      } catch { /* ignore */ }
    }
    return new Set(defaultHiddenColumns ?? []);
  });
  const [colPanelOpen, setColPanelOpen] = useState(false);
  const colPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!colPanelOpen) return;
    const handler = (e: MouseEvent) => {
      if (colPanelRef.current && !colPanelRef.current.contains(e.target as Node)) {
        setColPanelOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [colPanelOpen]);

  const toggleColumn = (key: string) => {
    setHiddenColumns((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      if (storageKey) {
        try { localStorage.setItem(storageKey, JSON.stringify([...next])); } catch { /* ignore */ }
      }
      return next;
    });
  };

  const visibleColumns = useMemo(
    () => columns.filter((c) => !hiddenColumns.has(c.data as string)),
    [columns, hiddenColumns],
  );

  // ---- Bulk selection state ----
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const selectedIdsRef = useRef(selectedIds);
  useEffect(() => { selectedIdsRef.current = selectedIds; });
  const onBulkSelectRef = useRef(onBulkSelect);
  useEffect(() => { onBulkSelectRef.current = onBulkSelect; });

  // Notify parent whenever selection changes
  useEffect(() => {
    if (!bulkSelectable || !onBulkSelectRef.current) return;
    const selected = rows.filter((r: any) => selectedIds.has(r.id));
    onBulkSelectRef.current(selected);
  }, [selectedIds, rows, bulkSelectable]);

  // Handle checkbox clicks via event delegation on the container
  useEffect(() => {
    if (!bulkSelectable || !containerRef.current) return;
    const container = containerRef.current;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const cb = target.closest<HTMLInputElement>("input.stsn-bulk-cb");
      if (!cb) return;
      const id = cb.getAttribute("data-id");
      if (!id) return;
      e.stopPropagation();
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
    };
    container.addEventListener("click", handler);
    return () => container.removeEventListener("click", handler);
  }, [bulkSelectable]);

  // Keep checkbox checked state in sync after DataTables re-renders
  const syncCheckboxes = useCallback(() => {
    if (!containerRef.current || !bulkSelectable) return;
    containerRef.current.querySelectorAll<HTMLInputElement>("input.stsn-bulk-cb").forEach((cb) => {
      const id = cb.getAttribute("data-id");
      if (id) cb.checked = selectedIdsRef.current.has(id);
    });
  }, [bulkSelectable]);

  const applySelection = useCallback(() => {
    if (!containerRef.current) return;
    containerRef.current.querySelectorAll<HTMLElement>("tr[data-row-id]").forEach((row) => {
      if (row.getAttribute("data-row-id") === selectedIdRef.current) {
        row.classList.add("stsn-row-selected");
      } else {
        row.classList.remove("stsn-row-selected");
      }
    });
    syncCheckboxes();
  }, [syncCheckboxes]);

  useEffect(() => { applySelection(); }, [selectedId, applySelection]);

  const allVisibleIds = useMemo(
    () => new Set((rows as any[]).map((r) => r.id).filter(Boolean)),
    [rows],
  );
  const allSelected = allVisibleIds.size > 0 && [...allVisibleIds].every((id) => selectedIds.has(id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allVisibleIds));
    }
  };

  // ---- Build columns for DataTables (with optional checkbox column) ----
  const effectiveColumns = useMemo(() => {
    if (!bulkSelectable) return visibleColumns;
    const checkboxCol: STSNColumn<T> = {
      title: "",
      data: "id" as any,
      orderable: false,
      searchable: false,
      width: "36px",
      render: (id: string) => (
        <input
          type="checkbox"
          data-id={id}
          className="stsn-bulk-cb w-4 h-4 rounded accent-stsn-brown cursor-pointer"
          readOnly
        />
      ),
    };
    return [checkboxCol, ...visibleColumns];
  }, [bulkSelectable, visibleColumns]);

  const dtColumns = useMemo(
    () =>
      effectiveColumns.map((col) => ({
        title: col.title,
        data: (col.data as string) ?? null,
        className: col.className,
        orderable: col.orderable !== false,
        searchable: col.searchable !== false,
        width: col.width,
        defaultContent: "",
      })),
    [effectiveColumns],
  );

  const slots = useMemo(() => {
    const result: DataTableSlots = {};
    effectiveColumns.forEach((col, index) => {
      if (col.render) {
        result[index] = (data: any, row: T) => col.render!(data, row) as any;
      }
    });
    return result;
  }, [effectiveColumns]);

  const options = useMemo(
    () => ({
      paging: true,
      pageLength,
      searching: searchable,
      ordering: true,
      info: true,
      lengthChange: false,
      language: {
        emptyTable: emptyMessage,
        search: "Search:",
        paginate: { previous: "Prev", next: "Next" },
      },
      createdRow: (row: Node, data: unknown) => {
        const el = row as HTMLElement;
        const id = (data as any)?.id;
        if (id) el.setAttribute("data-row-id", id);
        if (id && id === selectedIdRef.current) el.classList.add("stsn-row-selected");

        // Row-level color class
        if (rowColorClassRef.current) {
          const cls = rowColorClassRef.current(data as T);
          if (cls) el.classList.add(...cls.split(" ").filter(Boolean));
        }

        if (onRowClickRef.current) {
          el.style.cursor = "pointer";
          el.addEventListener("click", (e) => {
            const target = e.target as HTMLElement;
            if (target.closest("input.stsn-bulk-cb")) return;
            onRowClickRef.current?.(data as T);
          });
        }
        setTimeout(() => { applySelection(); syncCheckboxes(); }, 0);
      },
      drawCallback: () => {
        setTimeout(() => { applySelection(); syncCheckboxes(); }, 0);
      },
    }),
    [applySelection, emptyMessage, pageLength, searchable, syncCheckboxes],
  );

  // Re-key DataTable when visible columns change so it re-initialises
  const tableKey = useMemo(
    () => effectiveColumns.map((c) => c.data ?? c.title).join("|"),
    [effectiveColumns],
  );

  if (rows.length === 0) {
    return (
      <div ref={containerRef} className={`stsn-datatable ${className}`}>
        {caption && (
          <p className="text-xs font-mono uppercase tracking-wide text-stone-400 mb-2">{caption}</p>
        )}
        <div className="flex flex-col items-center justify-center gap-2 py-12 px-4 border border-stsn-beige rounded-xl bg-stsn-cream/50 text-center">
          <Inbox className="w-8 h-8 text-stsn-gold/50" />
          <p className="text-sm text-stone-500">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`stsn-datatable overflow-x-auto ${className}`}>
      {caption && (
        <p className="text-xs font-mono uppercase tracking-wide text-stone-400 mb-2">{caption}</p>
      )}

      {/* Toolbar: column toggle and select-all */}
      {(columnToggleable || bulkSelectable) && (
        <div className="flex items-center justify-between gap-2 mb-2">
          {bulkSelectable && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded accent-stsn-brown cursor-pointer"
                title="Select all"
              />
              <span className="text-xs text-stone-500">
                {selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select all"}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 ml-auto">
            {columnToggleable && (
              <div className="relative" ref={colPanelRef}>
                <button
                  onClick={() => setColPanelOpen((v) => !v)}
                  className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stsn-cream text-stone-600 transition cursor-pointer"
                >
                  <Columns3 className="w-3.5 h-3.5" /> Columns
                </button>
                {colPanelOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-stone-200 rounded-xl shadow-lg z-30 p-3 min-w-[180px] animate-fade-in">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-stone-400 mb-2">Show / Hide Columns</p>
                    <div className="space-y-1.5">
                      {columns.map((col) => {
                        const key = col.data as string;
                        return (
                          <label key={key || col.title} className="flex items-center gap-2 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={!hiddenColumns.has(key)}
                              onChange={() => toggleColumn(key)}
                              className="w-3.5 h-3.5 rounded accent-stsn-brown cursor-pointer"
                            />
                            <span className="text-xs text-stone-700 group-hover:text-stsn-brown transition">{col.title}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bulk action bar */}
      {bulkSelectable && selectedIds.size > 0 && bulkActionBar && (
        <div className="mb-2 animate-fade-in">{bulkActionBar}</div>
      )}

      <DataTableComponent
        key={tableKey}
        data={rows}
        columns={dtColumns}
        slots={slots}
        className="display w-full text-xs"
        options={options}
      >
        <thead>
          <tr>
            {effectiveColumns.map((col, index) => (
              <th key={index}>{col.title}</th>
            ))}
          </tr>
        </thead>
      </DataTableComponent>
    </div>
  );
}

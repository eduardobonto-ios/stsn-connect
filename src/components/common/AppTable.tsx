/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type Row,
  type SortingState,
  type Updater,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronUp,
  Columns3,
  Inbox,
  Loader2,
  Search,
  X,
} from "lucide-react";

export type AppTableColumn<TData> = ColumnDef<TData>;

export interface AppTableLegacyColumn<TData> {
  title: string;
  data?: keyof TData | string;
  render?: (value: any, row: TData) => React.ReactNode;
  className?: string;
  orderable?: boolean;
  searchable?: boolean;
  width?: string;
}

export function appTableColumnsFromLegacy<TData>(
  legacyColumns: AppTableLegacyColumn<TData>[],
): AppTableColumn<TData>[] {
  return legacyColumns.map((column, index) => {
    const id = column.data ? String(column.data) : `legacy-column-${index}`;
    return {
      id,
      header: column.title,
      accessorFn: (row) => (column.data ? (row as Record<string, unknown>)[String(column.data)] : undefined),
      enableSorting: column.orderable !== false,
      cell: ({ row, getValue }) => {
        const content = column.render
          ? column.render(getValue(), row.original)
          : (getValue() as React.ReactNode);
        return column.className ? <span className={column.className}>{content}</span> : content;
      },
    };
  });
}

export interface AppTableProps<TData> {
  data: TData[];
  columns: AppTableColumn<TData>[];
  title?: string;
  description?: string;
  toolbar?: React.ReactNode;
  rightToolbar?: React.ReactNode;
  tableActions?: React.ReactNode;
  emptyMessage?: string;
  emptyDescription?: string;
  loading?: boolean;
  searchPlaceholder?: string;
  enableSearch?: boolean;
  enableColumnVisibility?: boolean;
  columnVisibilityPersistenceKey?: string;
  enablePagination?: boolean;
  initialPageSize?: number;
  pageSizeOptions?: number[];
  pageIndex?: number;
  pageSize?: number;
  onPaginationChange?: (pagination: PaginationState) => void;
  rowActions?: (row: Row<TData>) => React.ReactNode;
  getRowId?: (originalRow: TData, index: number, parent?: Row<TData>) => string;
  onRowClick?: (row: TData) => void;
  selectedRowId?: string;
  selectedRowKey?: keyof TData | ((row: TData) => string | number | null | undefined);
  enableRowSelection?: boolean;
  selectedRowIds?: string[];
  defaultSelectedRowIds?: string[];
  onSelectionChange?: (selectedRows: TData[], selectedRowIds: string[]) => void;
  isRowSelectionDisabled?: (row: TData) => boolean;
  renderBulkActions?: (
    selectedRows: TData[],
    selectedRowIds: string[],
    clearSelection: () => void,
  ) => React.ReactNode;
  getRowClassName?: (row: TData) => string | undefined;
  compact?: boolean;
  density?: "compact" | "comfortable";
  className?: string;
  tableClassName?: string;
}

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function readPersistedColumnVisibility(key?: string): VisibilityState {
  if (!key || typeof window === "undefined") return {};
  try {
    const stored = window.localStorage.getItem(key);
    if (!stored) return {};
    const parsed = JSON.parse(stored) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as VisibilityState;
  } catch {
    return {};
  }
}

function persistColumnVisibility(key: string | undefined, visibility: VisibilityState) {
  if (!key || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(visibility));
  } catch {
    // Column visibility persistence is optional; rendering should not depend on storage access.
  }
}

function resolveSelectedRowKey<TData>(
  row: TData,
  selectedRowKey?: keyof TData | ((row: TData) => string | number | null | undefined),
) {
  if (!selectedRowKey) return undefined;
  if (typeof selectedRowKey === "function") return selectedRowKey(row);
  return row[selectedRowKey];
}

export default function AppTable<TData>({
  data,
  columns,
  title,
  description,
  toolbar,
  rightToolbar,
  tableActions,
  emptyMessage = "No records found.",
  emptyDescription = "Try adjusting the search or filters.",
  loading = false,
  searchPlaceholder = "Search records...",
  enableSearch = true,
  enableColumnVisibility = true,
  columnVisibilityPersistenceKey,
  enablePagination = true,
  initialPageSize = 10,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  pageIndex,
  pageSize,
  onPaginationChange,
  rowActions,
  getRowId,
  onRowClick,
  selectedRowId,
  selectedRowKey,
  enableRowSelection = false,
  selectedRowIds,
  defaultSelectedRowIds = [],
  onSelectionChange,
  isRowSelectionDisabled,
  renderBulkActions,
  getRowClassName,
  compact = false,
  density,
  className = "",
  tableClassName = "",
}: AppTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() =>
    readPersistedColumnVisibility(columnVisibilityPersistenceKey),
  );
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: pageSize ?? initialPageSize,
  });
  const [internalSelectedRowIds, setInternalSelectedRowIds] = useState<Set<string>>(
    () => new Set(defaultSelectedRowIds),
  );
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);

  const effectivePagination = useMemo(
    () => ({
      pageIndex: pageIndex ?? pagination.pageIndex,
      pageSize: pageSize ?? pagination.pageSize,
    }),
    [pageIndex, pageSize, pagination],
  );

  const selectedRowIdSet = useMemo(
    () => new Set(selectedRowIds ?? Array.from(internalSelectedRowIds)),
    [internalSelectedRowIds, selectedRowIds],
  );

  const selectedRowIdsControlled = selectedRowIds !== undefined;
  const effectiveDensity = density ?? (compact ? "compact" : "comfortable");
  const rowPaddingClass = effectiveDensity === "compact" ? "px-3 py-2" : "px-4 py-3";
  const headerPaddingClass = effectiveDensity === "compact" ? "px-3 py-2" : "px-4 py-3";
  const tableMinWidthClass = compact ? "min-w-[560px]" : "min-w-[720px]";
  const canChangePageSize = pageSizeOptions.length > 1;

  const handlePaginationChange = (updater: Updater<PaginationState>) => {
    const nextPagination =
      typeof updater === "function" ? updater(effectivePagination) : updater;
    setPagination((current) => ({
      pageIndex: pageIndex === undefined ? nextPagination.pageIndex : current.pageIndex,
      pageSize: pageSize === undefined ? nextPagination.pageSize : current.pageSize,
    }));
    onPaginationChange?.(nextPagination);
  };

  const handleColumnVisibilityChange = (updater: Updater<VisibilityState>) => {
    setColumnVisibility((current) => {
      const nextVisibility = typeof updater === "function" ? updater(current) : updater;
      persistColumnVisibility(columnVisibilityPersistenceKey, nextVisibility);
      return nextVisibility;
    });
  };

  const tableColumns = useMemo(() => {
    if (!rowActions) return columns;
    return [
      ...columns,
      {
        id: "actions",
        header: "",
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            {rowActions(row)}
          </div>
        ),
        meta: { align: "right" },
      } satisfies ColumnDef<TData>,
    ];
  }, [columns, rowActions]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      sorting,
      globalFilter,
      columnFilters,
      columnVisibility,
      pagination: effectivePagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: handleColumnVisibilityChange,
    onPaginationChange: handlePaginationChange,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableGlobalFilter: enableSearch,
  });

  const visibleRows = enablePagination
    ? table.getRowModel().rows
    : table.getFilteredRowModel().rows;
  const totalRows = table.getFilteredRowModel().rows.length;
  const selectionColumnCount = enableRowSelection ? 1 : 0;
  const visibleSelectableRows = visibleRows.filter(
    (row) => !isRowSelectionDisabled?.(row.original),
  );
  const selectedRows = table
    .getCoreRowModel()
    .rows.filter((row) => selectedRowIdSet.has(row.id))
    .map((row) => row.original);
  const allVisibleRowsSelected =
    visibleSelectableRows.length > 0 &&
    visibleSelectableRows.every((row) => selectedRowIdSet.has(row.id));
  const someVisibleRowsSelected =
    visibleSelectableRows.some((row) => selectedRowIdSet.has(row.id)) &&
    !allVisibleRowsSelected;
  const selectedCount = selectedRowIdSet.size;
  const canShowToolbar =
    title ||
    description ||
    toolbar ||
    rightToolbar ||
    enableSearch ||
    enableColumnVisibility;
  const firstRow =
    totalRows === 0 ? 0 : effectivePagination.pageIndex * effectivePagination.pageSize + 1;
  const lastRow = Math.min(
    (effectivePagination.pageIndex + 1) * effectivePagination.pageSize,
    totalRows,
  );

  const commitSelection = (nextSelectedRowIds: Set<string>) => {
    const nextIds = Array.from(nextSelectedRowIds);
    if (!selectedRowIdsControlled) {
      setInternalSelectedRowIds(nextSelectedRowIds);
    }
    const nextRows = table
      .getCoreRowModel()
      .rows.filter((row) => nextSelectedRowIds.has(row.id))
      .map((row) => row.original);
    onSelectionChange?.(nextRows, nextIds);
  };

  const toggleRowSelection = (row: Row<TData>) => {
    if (isRowSelectionDisabled?.(row.original)) return;
    const nextSelectedRowIds = new Set(selectedRowIdSet);
    if (nextSelectedRowIds.has(row.id)) {
      nextSelectedRowIds.delete(row.id);
    } else {
      nextSelectedRowIds.add(row.id);
    }
    commitSelection(nextSelectedRowIds);
  };

  const toggleVisibleRowsSelection = () => {
    const nextSelectedRowIds = new Set(selectedRowIdSet);
    if (allVisibleRowsSelected) {
      visibleSelectableRows.forEach((row) => nextSelectedRowIds.delete(row.id));
    } else {
      visibleSelectableRows.forEach((row) => nextSelectedRowIds.add(row.id));
    }
    commitSelection(nextSelectedRowIds);
  };

  const clearSelection = () => commitSelection(new Set());

  return (
    <section
      className={`overflow-hidden rounded-xl border border-[var(--erp-border)] bg-[var(--erp-surface)] shadow-sm ${className}`}
    >
      {canShowToolbar && (
        <div className="flex flex-col gap-3 border-b border-[var(--erp-border)] px-5 py-4 md:flex-row md:items-start">
          {(title || description) && (
            <div className="min-w-0 md:flex-1">
              {title && (
                <h3 className="truncate text-sm font-bold text-[var(--erp-text)]">
                  {title}
                </h3>
              )}
              {description && (
                <p className="mt-1 text-xs leading-relaxed text-[var(--erp-text-muted)]">
                  {description}
                </p>
              )}
            </div>
          )}

          <div className="flex w-full flex-wrap items-start justify-end gap-2 md:ml-auto md:w-auto md:max-w-full md:shrink-0">
            {(toolbar || rightToolbar) && (
              <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
                {toolbar && (
                  <div className="flex flex-wrap items-center justify-end gap-2">{toolbar}</div>
                )}

                {rightToolbar && (
                  <div className="flex flex-wrap items-center justify-end gap-2">{rightToolbar}</div>
                )}
              </div>
            )}

            {(enableSearch || enableColumnVisibility) && (
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                {enableSearch && (
                  <div className="relative w-full sm:w-[18rem] sm:max-w-[20rem] sm:flex-none">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
                    <input
                      type="search"
                      value={globalFilter}
                      onChange={(event) => setGlobalFilter(event.target.value)}
                      placeholder={searchPlaceholder}
                      className="h-9 w-full rounded-xl border border-[var(--erp-border)] bg-[var(--erp-surface-muted)] pl-9 pr-9 text-xs text-[var(--erp-text)] outline-none transition placeholder:text-slate-400 focus:border-[var(--erp-brand)] focus:bg-white focus:ring-2 focus:ring-[var(--erp-brand)]/15"
                      aria-label="Search table"
                    />
                    {globalFilter && (
                      <button
                        type="button"
                        onClick={() => setGlobalFilter("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                        aria-label="Clear table search"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {enableColumnVisibility && (
                  <div className="relative shrink-0 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setColumnMenuOpen((open) => !open)}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[var(--erp-border)] bg-white px-3 text-xs font-semibold text-[var(--erp-text)] transition hover:bg-[var(--erp-surface-muted)]"
                      aria-expanded={columnMenuOpen}
                      aria-haspopup="menu"
                    >
                      <Columns3 className="h-3.5 w-3.5" />
                      Columns
                    </button>
                    {columnMenuOpen && (
                      <div
                        className="absolute right-0 z-30 mt-1 min-w-52 rounded-xl border border-[var(--erp-border)] bg-white p-3 shadow-lg"
                        role="menu"
                      >
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Show columns
                        </p>
                        <div className="space-y-1.5">
                          {table.getAllLeafColumns().map((column) => {
                            if (!column.getCanHide()) return null;
                            return (
                              <label
                                key={column.id}
                                className="flex cursor-pointer items-center gap-2 text-xs text-[var(--erp-text)]"
                              >
                                <input
                                  type="checkbox"
                                  checked={column.getIsVisible()}
                                  onChange={column.getToggleVisibilityHandler()}
                                  className="h-3.5 w-3.5 rounded accent-[var(--erp-brand)]"
                                />
                                <span className="truncate">{String(column.columnDef.header ?? column.id)}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {(tableActions || (enableRowSelection && selectedCount > 0)) && (
        <div className="flex flex-col gap-2 border-b border-[var(--erp-border)] bg-[linear-gradient(180deg,#fffdf6_0%,#f8f2e4_100%)] px-5 py-3 text-xs sm:flex-row sm:items-center sm:justify-between">
          {enableRowSelection && selectedCount > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-[var(--erp-text)]">
                {selectedCount} selected
              </span>
              <button
                type="button"
                onClick={clearSelection}
                className="inline-flex h-8 items-center gap-1 rounded-xl border border-[var(--erp-border)] bg-white px-2.5 font-semibold text-[var(--erp-text-muted)] transition hover:text-[var(--erp-text)]"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </button>
              {renderBulkActions?.(selectedRows, Array.from(selectedRowIdSet), clearSelection)}
            </div>
          ) : (
            <div />
          )}
          {tableActions && (
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">{tableActions}</div>
          )}
        </div>
      )}

      <div className="relative overflow-x-auto">
        <table className={`w-full ${tableMinWidthClass} border-collapse text-left text-xs ${tableClassName}`}>
          <thead className="bg-[linear-gradient(180deg,#F8F2E4_0%,#F3E6C6_100%)] text-[10px] uppercase tracking-wide text-[var(--erp-text-muted)]">
            {table.getHeaderGroups().map((headerGroup, headerGroupIndex) => (
              <tr key={headerGroup.id}>
                {enableRowSelection && (
                  <th
                    scope="col"
                    className={`w-10 whitespace-nowrap border-b border-[var(--erp-border)] ${headerPaddingClass} font-bold`}
                  >
                    {headerGroupIndex === 0 && (
                      <input
                        type="checkbox"
                        checked={allVisibleRowsSelected}
                        aria-checked={someVisibleRowsSelected ? "mixed" : allVisibleRowsSelected}
                        onChange={toggleVisibleRowsSelection}
                        disabled={visibleSelectableRows.length === 0}
                        className="h-3.5 w-3.5 rounded accent-[var(--erp-brand)] disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Select all visible rows"
                      />
                    )}
                  </th>
                )}
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    scope="col"
                    className={`whitespace-nowrap border-b border-[var(--erp-border)] ${headerPaddingClass} font-bold`}
                  >
                    {header.isPlaceholder ? null : (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        disabled={!header.column.getCanSort()}
                        className={`inline-flex items-center gap-1 ${header.column.getCanSort() ? "cursor-pointer hover:text-[var(--erp-text)]" : "cursor-default"}`}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === "asc" && <ChevronUp className="h-3 w-3" />}
                        {header.column.getIsSorted() === "desc" && <ChevronDown className="h-3 w-3" />}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-[var(--erp-border)] bg-white">
            {loading ? (
              <tr>
                <td colSpan={table.getVisibleLeafColumns().length + selectionColumnCount} className="px-4 py-14 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-[var(--erp-text-muted)]">
                      <Loader2 className="h-6 w-6 animate-spin text-[var(--erp-accent)]" />
                    <span className="text-sm font-semibold">Loading records...</span>
                  </div>
                </td>
              </tr>
            ) : visibleRows.length === 0 ? (
              <tr>
                <td colSpan={table.getVisibleLeafColumns().length + selectionColumnCount} className="px-4 py-14 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--erp-border)] bg-[var(--erp-surface-muted)]">
                      <Inbox className="h-5 w-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[var(--erp-text)]">{emptyMessage}</p>
                      <p className="mt-1 text-xs text-[var(--erp-text-muted)]">{emptyDescription}</p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              visibleRows.map((row) => {
                const selectedRowValue = resolveSelectedRowKey(row.original, selectedRowKey);
                const isDisplaySelected =
                  selectedRowId !== undefined &&
                  (row.id === selectedRowId ||
                    (selectedRowValue !== undefined &&
                      selectedRowValue !== null &&
                      String(selectedRowValue) === selectedRowId));
                const selectionDisabled = isRowSelectionDisabled?.(row.original) ?? false;

                return (
                  <tr
                    key={row.id}
                    onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                    onKeyDown={
                      onRowClick
                        ? (event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              onRowClick(row.original);
                            }
                          }
                        : undefined
                    }
                    tabIndex={onRowClick ? 0 : undefined}
                    role={onRowClick ? "button" : undefined}
                    aria-selected={isDisplaySelected || selectedRowIdSet.has(row.id)}
                    className={`transition hover:bg-[var(--erp-surface-muted)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--erp-brand)]/20 ${onRowClick ? "cursor-pointer" : ""} ${isDisplaySelected ? "border-l-4 border-l-[var(--erp-accent)] bg-[linear-gradient(90deg,rgba(231,184,47,0.12)_0%,rgba(255,253,246,0.82)_100%)]" : ""} ${getRowClassName?.(row.original) ?? ""}`}
                  >
                    {enableRowSelection && (
                      <td className={`${rowPaddingClass} align-middle`}>
                        <input
                          type="checkbox"
                          checked={selectedRowIdSet.has(row.id)}
                          disabled={selectionDisabled}
                          onClick={(event) => event.stopPropagation()}
                          onChange={() => toggleRowSelection(row)}
                          className="h-3.5 w-3.5 rounded accent-[var(--erp-brand)] disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Select row"
                        />
                      </td>
                    )}
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className={`${rowPaddingClass} align-middle text-[var(--erp-text)]`}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {enablePagination && (
        <div className="flex flex-col gap-3 border-t border-[var(--erp-border)] px-4 py-3 text-xs text-[var(--erp-text-muted)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            Showing <span className="font-semibold text-[var(--erp-text)]">{firstRow}</span> to{" "}
            <span className="font-semibold text-[var(--erp-text)]">{lastRow}</span> of{" "}
            <span className="font-semibold text-[var(--erp-text)]">{totalRows}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canChangePageSize && (
              <label className="flex items-center gap-2">
                <span>Rows</span>
                <select
                  value={effectivePagination.pageSize}
                  onChange={(event) => table.setPageSize(Number(event.target.value))}
                  className="h-8 rounded-xl border border-[var(--erp-border)] bg-white px-2 text-xs text-[var(--erp-text)] outline-none focus:border-[var(--erp-brand)]"
                >
                  {pageSizeOptions.map((pageSizeOption) => (
                    <option key={pageSizeOption} value={pageSizeOption}>
                      {pageSizeOption}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <div className="flex items-center gap-1">
              <PaginationButton
                label="First page"
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.setPageIndex(0)}
              >
                <ChevronsLeft className="h-3.5 w-3.5" />
              </PaginationButton>
              <PaginationButton
                label="Previous page"
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.previousPage()}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </PaginationButton>
              <span className="px-2 font-semibold text-[var(--erp-text)]">
                {effectivePagination.pageIndex + 1} / {Math.max(table.getPageCount(), 1)}
              </span>
              <PaginationButton
                label="Next page"
                disabled={!table.getCanNextPage()}
                onClick={() => table.nextPage()}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </PaginationButton>
              <PaginationButton
                label="Last page"
                disabled={!table.getCanNextPage()}
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              >
                <ChevronsRight className="h-3.5 w-3.5" />
              </PaginationButton>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

interface PaginationButtonProps {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function PaginationButton({ label, disabled, onClick, children }: PaginationButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--erp-border)] bg-white text-[var(--erp-text)] transition hover:bg-[var(--erp-surface-muted)] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

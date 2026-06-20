/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useRef, useEffect } from "react";
import DataTable, { type DataTableSlots } from "datatables.net-react";
import DT from "datatables.net-dt";
import "datatables.net-dt/css/dataTables.dataTables.css";
import { Inbox } from "lucide-react";

DataTable.use(DT);

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
}

/**
 * STSN-themed wrapper around the official DataTables React component.
 * Provides search, sorting, pagination and an empty state while
 * preserving the brown/gold institutional styling.
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
}: STSNDataTableProps<T>) {
  const onRowClickRef = useRef(onRowClick);
  useEffect(() => {
    onRowClickRef.current = onRowClick;
  });
  const dtColumns = useMemo(
    () =>
      columns.map((col) => ({
        title: col.title,
        data: (col.data as string) ?? null,
        className: col.className,
        orderable: col.orderable !== false,
        searchable: col.searchable !== false,
        width: col.width,
        defaultContent: "",
      })),
    [columns],
  );

  const slots = useMemo(() => {
    const result: DataTableSlots = {};
    columns.forEach((col, index) => {
      if (col.render) {
        result[index] = (data: any, row: T) => col.render!(data, row) as any;
      }
    });
    return result;
  }, [columns]);

  if (rows.length === 0) {
    return (
      <div className={`stsn-datatable ${className}`}>
        {caption && (
          <p className="text-xs font-mono uppercase tracking-wide text-stone-400 mb-2">
            {caption}
          </p>
        )}
        <div className="flex flex-col items-center justify-center gap-2 py-12 px-4 border border-stsn-beige rounded-xl bg-stsn-cream/50 text-center">
          <Inbox className="w-8 h-8 text-stsn-gold/50" />
          <p className="text-sm text-stone-500">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`stsn-datatable overflow-x-auto ${className}`}>
      {caption && (
        <p className="text-xs font-mono uppercase tracking-wide text-stone-400 mb-2">
          {caption}
        </p>
      )}
      <DataTable
        data={rows}
        columns={dtColumns}
        slots={slots}
        className="display w-full text-xs"
        options={{
          paging: true,
          pageLength,
          searching: searchable,
          ordering: true,
          info: true,
          lengthChange: false,
          language: {
            emptyTable: emptyMessage,
            search: "Search:",
            paginate: {
              previous: "Prev",
              next: "Next",
            },
          },
          createdRow: onRowClick
            ? (row: Node, data: unknown) => {
                (row as HTMLElement).style.cursor = "pointer";
                (row as HTMLElement).addEventListener("click", () => {
                  onRowClickRef.current?.(data as T);
                });
              }
            : undefined,
        }}
      >
        <thead>
          <tr>
            {columns.map((col, index) => (
              <th key={index}>{col.title}</th>
            ))}
          </tr>
        </thead>
      </DataTable>
    </div>
  );
}

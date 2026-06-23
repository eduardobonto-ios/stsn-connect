import React, { useMemo, useState } from "react";
import type { ReportColumn, ReportRow } from "../types";

type ReportTableProps = {
  columns: ReportColumn[];
  rows: ReportRow[];
};

const PAGE_SIZE = 10;

export default function ReportTable({ columns, rows }: ReportTableProps) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const visibleRows = useMemo(
    () => rows.slice(startIndex, startIndex + PAGE_SIZE),
    [rows, startIndex],
  );

  const alignClass = (align?: ReportColumn["align"]) => {
    if (align === "right") return "text-right";
    if (align === "center") return "text-center";
    return "text-left";
  };

  const showingStart = rows.length === 0 ? 0 : startIndex + 1;
  const showingEnd = Math.min(startIndex + PAGE_SIZE, rows.length);

  return (
    <section className="bg-white border border-stsn-beige rounded-xl p-4 shadow-sm">
      <div className="overflow-x-auto rounded-xl border border-stsn-beige">
        <table className="w-full min-w-[760px] border-collapse text-xs">
          <thead>
            <tr className="bg-stsn-brown text-stsn-cream">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 font-black uppercase tracking-wide ${alignClass(column.align)}`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-stone-500">
                  No report rows match the selected filters.
                </td>
              </tr>
            ) : (
              visibleRows.map((row, rowIndex) => (
                <tr
                  key={String(row.id ?? `${currentPage}-${rowIndex}`)}
                  className={rowIndex % 2 === 0 ? "bg-stone-50" : "bg-white"}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`border-t border-stsn-beige px-4 py-3 text-stone-700 ${alignClass(column.align)}`}
                    >
                      {String(row[column.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col gap-3 text-xs text-stone-600 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono">
          Showing {showingStart} to {showingEnd} of {rows.length} entries
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            disabled={currentPage === 1}
            className="rounded-lg border border-stsn-beige px-3 py-1.5 font-semibold text-stone-600 disabled:opacity-40"
          >
            Prev
          </button>
          <span className="rounded-lg border border-stsn-beige bg-stsn-cream px-3 py-1.5 font-black text-stsn-brown">
            {currentPage}
          </span>
          <button
            type="button"
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            disabled={currentPage === totalPages}
            className="rounded-lg border border-stsn-beige px-3 py-1.5 font-semibold text-stone-600 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react";
import { Clock, Printer, Download } from "lucide-react";
import AppTable, { type AppTableColumn } from "../../../../components/common/AppTable";
import AppButton from "../../../../components/common/AppButton";
import EmptyState from "../../../../components/common/EmptyState";
import { SectionPanel, LibraryStatusBadge, formatMoney } from "../shared";
import { daysBetween } from "../../data/useLibraryData";
import { reportExportService } from "../../../../services/reportExportService";
import type { LibraryData } from "../../data/useLibraryData";

const todayStr = () => new Date().toISOString().slice(0, 10);

interface OverdueRow {
  id: string;
  borrower: string;
  transactionNo: string;
  title: string;
  accession: string;
  dueDate: string;
  days: number;
  fine: number;
}

export default function LibraryOverdue({ lib }: { lib: LibraryData }) {
  const scopedTxns = useMemo(() => new Map(lib.transactions.map((t) => [t.id, t])), [lib.transactions]);
  const today = todayStr();
  const grace = lib.activeFineRule?.graceDays ?? 0;
  const finePerDay = lib.activeFineRule?.finePerDay ?? 0;
  const maxFine = lib.activeFineRule?.maxFine ?? Infinity;

  const rows = useMemo<OverdueRow[]>(() => {
    return lib.items
      .filter((i) => (i.itemStatus === "BORROWED" || i.itemStatus === "OVERDUE") && i.dueDate && scopedTxns.has(i.transactionId))
      .map((item) => {
        const txn = scopedTxns.get(item.transactionId);
        const days = Math.max(0, daysBetween(item.dueDate!, today) - grace);
        return {
          id: item.id,
          borrower: txn?.borrowerName ?? "Unknown",
          transactionNo: txn?.transactionNo ?? "—",
          title: lib.bookById(item.bookId)?.title ?? "Unknown",
          accession: lib.copyById(item.copyId)?.accessionNo ?? "—",
          dueDate: item.dueDate!,
          days,
          fine: Math.min(days * finePerDay, maxFine),
        };
      })
      .filter((r) => r.days > 0)
      .sort((a, b) => b.days - a.days);
  }, [lib.items, lib.bookById, lib.copyById, scopedTxns, today, grace, finePerDay, maxFine]);

  const exportReport = (format: "print" | "csv" | "excel" | "pdf") => {
    const payload = {
      title: "Overdue Books Report",
      columns: [
        { key: "borrower", label: "Borrower" },
        { key: "title", label: "Book" },
        { key: "accession", label: "Accession" },
        { key: "dueDate", label: "Due Date" },
        { key: "days", label: "Days Overdue" },
        { key: "fine", label: "Est. Fine" },
      ],
      rows: rows.map((r) => ({ ...r, fine: formatMoney(r.fine) })),
    };
    if (format === "print") reportExportService.print(payload);
    if (format === "csv") reportExportService.exportCsv(payload);
    if (format === "excel") reportExportService.exportExcel(payload);
    if (format === "pdf") reportExportService.exportPdf(payload);
  };

  const columns = useMemo<AppTableColumn<OverdueRow>[]>(() => [
    { id: "borrower", header: "Borrower", accessorFn: (r) => r.borrower, cell: ({ row }) => (<div><p className="font-semibold text-stone-800">{row.original.borrower}</p><p className="text-[10px] font-mono text-stone-400">{row.original.transactionNo}</p></div>) },
    { id: "book", header: "Book", accessorFn: (r) => r.title, cell: ({ row }) => (<div><p className="text-stone-700">{row.original.title}</p><p className="text-[10px] font-mono text-stone-400">{row.original.accession}</p></div>) },
    { id: "due", header: "Due Date", accessorFn: (r) => r.dueDate, cell: ({ getValue }) => <span className="font-mono text-stone-600">{String(getValue())}</span> },
    { id: "days", header: "Days", accessorFn: (r) => r.days, cell: ({ row }) => <LibraryStatusBadge status="OVERDUE" label={`${row.original.days}d`} /> },
    { id: "fine", header: "Est. Fine", accessorFn: (r) => r.fine, cell: ({ row }) => <span className="block text-right font-mono font-bold text-amber-700">{formatMoney(row.original.fine)}</span> },
  ], []);

  return (
    <SectionPanel
      title="Overdue Books"
      icon={Clock}
      meta={`${rows.length} overdue`}
      actions={rows.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <AppButton size="sm" variant="outline" leftIcon={Printer} onClick={() => exportReport("print")}>Print</AppButton>
          <AppButton size="sm" variant="outline" leftIcon={Download} onClick={() => exportReport("csv")}>CSV</AppButton>
          <AppButton size="sm" variant="outline" leftIcon={Download} onClick={() => exportReport("excel")}>Excel</AppButton>
          <AppButton size="sm" variant="outline" leftIcon={Download} onClick={() => exportReport("pdf")}>PDF</AppButton>
        </div>
      )}
    >
      {rows.length === 0 ? (
        <EmptyState icon={Clock} title="Nothing overdue" description="No borrowed books are currently past their due date." compact />
      ) : (
        <AppTable<OverdueRow> columns={columns} data={rows} getRowId={(r) => r.id} initialPageSize={10} emptyMessage="No overdue books." />
      )}
    </SectionPanel>
  );
}

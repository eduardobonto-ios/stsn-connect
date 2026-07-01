/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import { BarChart3, FileText, Printer, Download } from "lucide-react";
import AppTable, { type AppTableColumn } from "../../../../components/common/AppTable";
import AppButton from "../../../../components/common/AppButton";
import { SectionPanel, formatMoney } from "../shared";
import { daysBetween } from "../../data/useLibraryData";
import { reportExportService } from "../../../../services/reportExportService";
import type { LibraryData } from "../../data/useLibraryData";
import type { ReportColumn, ReportRow } from "../../../reports/types";

type ReportId = "borrowed" | "overdue" | "inventory" | "lost-damaged" | "borrower-history";

const REPORTS: { id: ReportId; title: string; desc: string }[] = [
  { id: "borrowed", title: "Borrowed Books", desc: "Active loans by borrower and due date." },
  { id: "overdue", title: "Overdue Books", desc: "Overdue items with days late and estimated fines." },
  { id: "inventory", title: "Book Inventory", desc: "Copies by status, shelf, and valuation." },
  { id: "lost-damaged", title: "Lost / Damaged", desc: "Lost and damaged copies with penalties." },
  { id: "borrower-history", title: "Borrower History", desc: "Per-borrower loan and fine history." },
];

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function LibraryReports({ lib }: { lib: LibraryData }) {
  const [reportId, setReportId] = useState<ReportId>("borrowed");
  const report = REPORTS.find((r) => r.id === reportId)!;

  const scopedTxns = useMemo(() => new Map(lib.transactions.map((t) => [t.id, t])), [lib.transactions]);
  const shelfName = (id?: string | null) => lib.shelves.find((s) => s.id === id)?.name ?? "—";
  const today = todayStr();
  const grace = lib.activeFineRule?.graceDays ?? 0;
  const finePerDay = lib.activeFineRule?.finePerDay ?? 0;
  const maxFine = lib.activeFineRule?.maxFine ?? Infinity;

  const { columns, rows } = useMemo<{ columns: ReportColumn[]; rows: ReportRow[] }>(() => {
    if (reportId === "borrowed") {
      const cols: ReportColumn[] = [
        { key: "borrower", label: "Borrower" }, { key: "transactionNo", label: "Transaction" },
        { key: "title", label: "Book" }, { key: "checkoutDate", label: "Checked Out" }, { key: "dueDate", label: "Due" },
      ];
      const data: ReportRow[] = lib.items
        .filter((i) => (i.itemStatus === "BORROWED" || i.itemStatus === "OVERDUE") && scopedTxns.has(i.transactionId))
        .map((i) => {
          const t = scopedTxns.get(i.transactionId);
          return { borrower: t?.borrowerName ?? "—", transactionNo: t?.transactionNo ?? "—", title: lib.bookById(i.bookId)?.title ?? "—", checkoutDate: t?.checkoutDate ?? "—", dueDate: i.dueDate ?? "—" };
        });
      return { columns: cols, rows: data };
    }
    if (reportId === "overdue") {
      const cols: ReportColumn[] = [
        { key: "borrower", label: "Borrower" }, { key: "title", label: "Book" }, { key: "dueDate", label: "Due" },
        { key: "days", label: "Days Overdue", align: "right" }, { key: "fine", label: "Est. Fine", align: "right" },
      ];
      const data: ReportRow[] = lib.items
        .filter((i) => (i.itemStatus === "BORROWED" || i.itemStatus === "OVERDUE") && i.dueDate && scopedTxns.has(i.transactionId))
        .map((i) => {
          const t = scopedTxns.get(i.transactionId);
          const days = Math.max(0, daysBetween(i.dueDate!, today) - grace);
          return { borrower: t?.borrowerName ?? "—", title: lib.bookById(i.bookId)?.title ?? "—", dueDate: i.dueDate!, days, fine: formatMoney(Math.min(days * finePerDay, maxFine)) };
        })
        .filter((r) => Number(r.days) > 0);
      return { columns: cols, rows: data };
    }
    if (reportId === "inventory") {
      const cols: ReportColumn[] = [
        { key: "accession", label: "Accession" }, { key: "title", label: "Title" }, { key: "shelf", label: "Shelf" },
        { key: "condition", label: "Condition" }, { key: "status", label: "Status" }, { key: "cost", label: "Cost", align: "right" },
      ];
      const data: ReportRow[] = lib.copies.map((c) => ({
        accession: c.accessionNo, title: lib.bookById(c.bookId)?.title ?? "—", shelf: shelfName(c.shelfId),
        condition: c.condition, status: c.copyStatus, cost: c.acquisitionCost != null ? formatMoney(c.acquisitionCost) : "—",
      }));
      return { columns: cols, rows: data };
    }
    if (reportId === "lost-damaged") {
      const cols: ReportColumn[] = [
        { key: "accession", label: "Accession" }, { key: "title", label: "Title" }, { key: "status", label: "Status" }, { key: "cost", label: "Cost", align: "right" },
      ];
      const data: ReportRow[] = lib.copies
        .filter((c) => c.copyStatus === "LOST" || c.copyStatus === "DAMAGED")
        .map((c) => ({ accession: c.accessionNo, title: lib.bookById(c.bookId)?.title ?? "—", status: c.copyStatus, cost: c.acquisitionCost != null ? formatMoney(c.acquisitionCost) : "—" }));
      return { columns: cols, rows: data };
    }
    // borrower-history
    const cols: ReportColumn[] = [
      { key: "borrower", label: "Borrower" }, { key: "loans", label: "Loans", align: "right" },
      { key: "open", label: "Open", align: "right" }, { key: "fines", label: "Fines", align: "right" },
    ];
    const byBorrower = new Map<string, { borrower: string; loans: number; open: number; fines: number }>();
    lib.transactions.forEach((t) => {
      const key = t.borrowerRefId ?? t.borrowerName ?? t.id;
      const entry = byBorrower.get(key) ?? { borrower: t.borrowerName ?? "—", loans: 0, open: 0, fines: 0 };
      entry.loans += 1;
      if (t.status === "BORROWED" || t.status === "OVERDUE") entry.open += 1;
      byBorrower.set(key, entry);
    });
    lib.fines.forEach((f) => {
      const key = f.borrowerRefId ?? f.borrowerName ?? "";
      const entry = byBorrower.get(key);
      if (entry) entry.fines += f.amount;
    });
    const data: ReportRow[] = Array.from(byBorrower.values()).map((e) => ({ ...e, fines: formatMoney(e.fines) }));
    return { columns: cols, rows: data };
  }, [reportId, lib, scopedTxns, today, grace, finePerDay, maxFine]);

  const tableColumns = useMemo<AppTableColumn<ReportRow>[]>(() => columns.map((c) => ({
    id: c.key,
    accessorFn: (row) => row[c.key],
    header: c.label,
    cell: ({ getValue }) => <span className={`block text-xs text-stone-700 ${c.align === "right" ? "text-right font-mono" : ""}`}>{String(getValue() ?? "")}</span>,
  })), [columns]);

  const doExport = (format: "print" | "csv" | "excel" | "pdf") => {
    const payload = { title: report.title, columns, rows };
    if (format === "print") reportExportService.print(payload);
    if (format === "csv") reportExportService.exportCsv(payload);
    if (format === "excel") reportExportService.exportExcel(payload);
    if (format === "pdf") reportExportService.exportPdf(payload);
  };

  return (
    <div className="space-y-4">
      <SectionPanel title="Report Generator" icon={BarChart3}>
        <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1.5 tracking-wide">Report Type</label>
        <select
          value={reportId}
          onChange={(e) => setReportId(e.target.value as ReportId)}
          className="w-full sm:max-w-md bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown"
        >
          {REPORTS.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
        </select>
      </SectionPanel>

      <SectionPanel
        title={report.title}
        icon={FileText}
        meta={`${rows.length} rows`}
        actions={
          <div className="flex flex-wrap gap-2">
            <AppButton size="sm" variant="outline" leftIcon={Printer} onClick={() => doExport("print")}>Print</AppButton>
            <AppButton size="sm" variant="outline" leftIcon={Download} onClick={() => doExport("csv")}>CSV</AppButton>
            <AppButton size="sm" variant="outline" leftIcon={Download} onClick={() => doExport("excel")}>Excel</AppButton>
            <AppButton size="sm" variant="outline" leftIcon={Download} onClick={() => doExport("pdf")}>PDF</AppButton>
          </div>
        }
      >
        <p className="text-xs text-stone-500 mb-3">{report.desc}</p>
        <AppTable<ReportRow> columns={tableColumns} data={rows} getRowId={(_r, i) => `${reportId}-${i}`} enableSearch={false} initialPageSize={10} emptyMessage="No rows for this report." />
      </SectionPanel>
    </div>
  );
}

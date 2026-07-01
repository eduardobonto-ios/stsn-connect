/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import { RotateCcw, CheckCircle, AlertTriangle } from "lucide-react";
import AppTable, { type AppTableColumn } from "../../../../components/common/AppTable";
import AppButton from "../../../../components/common/AppButton";
import AppModal from "../../../../components/common/AppModal";
import EmptyState from "../../../../components/common/EmptyState";
import { SectionPanel, LibraryStatusBadge, formatMoney } from "../shared";
import { daysBetween } from "../../data/useLibraryData";
import type { LibrarySectionProps } from "./section-props";
import type { LibraryCondition, LibraryTransactionItem } from "../../types";

const field = "w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown";
const label = "block text-[10px] uppercase font-bold text-stone-500 mb-1.5 tracking-wide";
const todayStr = () => new Date().toISOString().slice(0, 10);

interface OpenRow {
  item: LibraryTransactionItem;
  borrower: string;
  transactionNo: string;
  title: string;
  accession: string;
  overdue: number;
}

export default function LibraryReturns({ lib, canPage }: LibrarySectionProps) {
  const canManage = canPage("LIBRARY_SYSTEM", "returns", "manage");
  const [active, setActive] = useState<OpenRow | null>(null);
  const [returnDate, setReturnDate] = useState(todayStr());
  const [condition, setCondition] = useState<LibraryCondition>("Good");
  const [markDamaged, setMarkDamaged] = useState(false);

  const scopedTxns = useMemo(() => new Map(lib.transactions.map((t) => [t.id, t])), [lib.transactions]);
  const today = todayStr();
  const grace = lib.activeFineRule?.graceDays ?? 0;

  const rows = useMemo<OpenRow[]>(() => {
    return lib.items
      .filter((i) => (i.itemStatus === "BORROWED" || i.itemStatus === "OVERDUE") && scopedTxns.has(i.transactionId))
      .map((item) => {
        const txn = scopedTxns.get(item.transactionId);
        const overdue = item.dueDate ? Math.max(0, daysBetween(item.dueDate, today) - grace) : 0;
        return {
          item,
          borrower: txn?.borrowerName ?? "Unknown",
          transactionNo: txn?.transactionNo ?? "—",
          title: lib.bookById(item.bookId)?.title ?? "Unknown",
          accession: lib.copyById(item.copyId)?.accessionNo ?? "—",
          overdue,
        };
      });
  }, [lib.items, lib.bookById, lib.copyById, scopedTxns, today, grace]);

  const open = (row: OpenRow) => {
    setActive(row);
    setReturnDate(todayStr());
    setCondition("Good");
    setMarkDamaged(false);
  };

  const previewOverdue = active?.item.dueDate ? Math.max(0, daysBetween(active.item.dueDate, returnDate) - grace) : 0;
  const previewFine = lib.activeFineRule
    ? Math.min(previewOverdue * lib.activeFineRule.finePerDay, lib.activeFineRule.maxFine ?? Infinity)
    : 0;

  const submit = () => {
    if (!active || !canManage) return;
    lib.processReturn(active.item, { returnDate, condition, markDamaged });
    setActive(null);
  };

  const columns = useMemo<AppTableColumn<OpenRow>[]>(() => [
    {
      id: "borrower", header: "Borrower", accessorFn: (r) => `${r.borrower} ${r.transactionNo}`,
      cell: ({ row }) => (<div><p className="font-semibold text-stone-800">{row.original.borrower}</p><p className="text-[10px] font-mono text-stone-400">{row.original.transactionNo}</p></div>),
    },
    {
      id: "book", header: "Book", accessorFn: (r) => `${r.title} ${r.accession}`,
      cell: ({ row }) => (<div><p className="text-stone-700">{row.original.title}</p><p className="text-[10px] font-mono text-stone-400">{row.original.accession}</p></div>),
    },
    { id: "due", header: "Due Date", accessorFn: (r) => r.item.dueDate ?? "", cell: ({ getValue }) => <span className="font-mono text-stone-600">{String(getValue() || "—")}</span> },
    {
      id: "overdue", header: "Overdue", accessorFn: (r) => r.overdue,
      cell: ({ row }) => row.original.overdue > 0
        ? <LibraryStatusBadge status="OVERDUE" label={`${row.original.overdue}d overdue`} />
        : <span className="text-[10px] text-emerald-600 font-bold">On time</span>,
    },
    {
      id: "actions", header: "", enableSorting: false,
      cell: ({ row }) => canManage && (
        <div className="flex justify-end">
          <AppButton size="xs" leftIcon={RotateCcw} onClick={() => open(row.original)}>Return</AppButton>
        </div>
      ),
    },
  ], [canManage]);

  return (
    <>
      <SectionPanel title="Process Returns" icon={RotateCcw} meta={`${rows.length} out on loan`}>
        {rows.length === 0 ? (
          <EmptyState icon={CheckCircle} title="No books on loan" description="All copies have been returned. Nothing to process." compact />
        ) : (
          <AppTable<OpenRow> columns={columns} data={rows} getRowId={(r) => r.item.id} initialPageSize={10} emptyMessage="No open loans." />
        )}
      </SectionPanel>

      {active && (
        <AppModal
          open
          onClose={() => setActive(null)}
          title="Process Return"
          eyebrow="Returns"
          icon={RotateCcw}
          maxWidthClass="max-w-md"
          footer={
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setActive(null)} className="text-xs font-bold px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer transition">Cancel</button>
              <AppButton size="sm" leftIcon={CheckCircle} onClick={submit}>Confirm Return</AppButton>
            </div>
          }
        >
          <div className="space-y-3 text-xs">
            <div className="bg-stone-50 border border-stone-200 rounded-lg p-3">
              <p className="font-bold text-stone-800">{active.title}</p>
              <p className="font-mono text-[10px] text-stone-400">{active.accession} • {active.borrower}</p>
              <p className="text-[10px] text-stone-500 mt-1">Due {active.item.dueDate ?? "—"}</p>
            </div>
            <div>
              <label className={label}>Return Date</label>
              <input type="date" className={field} value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
            </div>
            <div>
              <label className={label}>Returned Condition</label>
              <select className={field} value={condition} onChange={(e) => setCondition(e.target.value as LibraryCondition)}>
                {["New", "Good", "Fair", "Poor"].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={markDamaged} onChange={(e) => setMarkDamaged(e.target.checked)} className="accent-red-600" />
              <span className="text-[11px] font-semibold text-stone-600">Flag copy as damaged (raises a damage fine)</span>
            </label>

            {(previewOverdue > 0 || markDamaged) && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-[11px] text-amber-800">
                  {previewOverdue > 0 && <p>{previewOverdue} day(s) overdue → est. fine <span className="font-bold">{formatMoney(previewFine)}</span></p>}
                  {markDamaged && <p>A damage fine will be assessed on settlement.</p>}
                </div>
              </div>
            )}
          </div>
        </AppModal>
      )}
    </>
  );
}

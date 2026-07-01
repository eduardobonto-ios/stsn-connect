/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import { AlertTriangle, Ban } from "lucide-react";
import AppTable, { type AppTableColumn } from "../../../../components/common/AppTable";
import AppButton from "../../../../components/common/AppButton";
import AppModal from "../../../../components/common/AppModal";
import EmptyState from "../../../../components/common/EmptyState";
import { SectionPanel, LibraryStatusBadge, formatMoney } from "../shared";
import type { LibrarySectionProps } from "./section-props";
import type { LibraryCopy } from "../../types";

export default function LibraryLostDamaged({ lib, canPage }: LibrarySectionProps) {
  const canManage = canPage("LIBRARY_SYSTEM", "lost-damaged", "manage");
  const [target, setTarget] = useState<{ copy: LibraryCopy; type: "LOST" | "DAMAGED" } | null>(null);
  const [amount, setAmount] = useState("");

  const bookTitle = (id: string) => lib.books.find((b) => b.id === id)?.title ?? "Unknown";

  const rows = useMemo(
    () => lib.copies.filter((c) => c.copyStatus !== "ARCHIVED"),
    [lib.copies],
  );

  const openMark = (copy: LibraryCopy, type: "LOST" | "DAMAGED") => {
    const rule = lib.activeFineRule;
    const cost = copy.acquisitionCost ?? 0;
    let suggested = cost;
    if (type === "LOST") {
      if (rule?.lostFeeMode === "fixed") suggested = rule.lostFeeValue ?? cost;
      else if (rule?.lostFeeMode === "multiplier") suggested = cost * (rule.lostFeeValue ?? 1);
    } else {
      suggested = rule?.lostFeeMode === "fixed" && rule.lostFeeValue != null ? rule.lostFeeValue : cost / 2;
    }
    setAmount(String(Number(suggested.toFixed(2))));
    setTarget({ copy, type });
  };

  const confirm = () => {
    if (!target || !canManage) return;
    lib.markLostDamaged(target.copy, target.type, amount ? Number(amount) : undefined);
    setTarget(null);
  };

  const columns = useMemo<AppTableColumn<LibraryCopy>[]>(() => [
    { id: "accession", header: "Accession", accessorFn: (r) => r.accessionNo, cell: ({ getValue }) => <span className="font-mono font-bold text-stsn-brown">{String(getValue())}</span> },
    { id: "title", header: "Title", accessorFn: (r) => bookTitle(r.bookId), cell: ({ getValue }) => <span className="font-semibold text-stone-800">{String(getValue())}</span> },
    { id: "cost", header: "Cost", accessorFn: (r) => r.acquisitionCost ?? 0, cell: ({ row }) => <span className="font-mono text-stone-600">{row.original.acquisitionCost != null ? formatMoney(row.original.acquisitionCost) : "—"}</span> },
    { id: "status", header: "Status", accessorFn: (r) => r.copyStatus, cell: ({ row }) => <LibraryStatusBadge status={row.original.copyStatus} /> },
    {
      id: "actions", header: "", enableSorting: false,
      cell: ({ row }) => {
        const c = row.original;
        const actionable = c.copyStatus !== "LOST" && c.copyStatus !== "DAMAGED";
        if (!canManage || !actionable) return null;
        return (
          <div className="flex items-center justify-end gap-1.5">
            <button onClick={() => openMark(c, "LOST")} className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 cursor-pointer transition"><Ban className="w-3 h-3" /> Lost</button>
            <button onClick={() => openMark(c, "DAMAGED")} className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 cursor-pointer transition"><AlertTriangle className="w-3 h-3" /> Damaged</button>
          </div>
        );
      },
    },
  ], [lib.books, canManage, lib.activeFineRule]);

  return (
    <>
      <SectionPanel title="Lost / Damaged" icon={AlertTriangle} meta={`${lib.copies.filter((c) => c.copyStatus === "LOST" || c.copyStatus === "DAMAGED").length} flagged`}>
        {rows.length === 0 ? (
          <EmptyState icon={AlertTriangle} title="No copies to manage" description="Add inventory copies to flag lost or damaged items." compact />
        ) : (
          <AppTable<LibraryCopy> columns={columns} data={rows} getRowId={(r) => r.id} initialPageSize={10} emptyMessage="No copies." />
        )}
      </SectionPanel>

      {target && (
        <AppModal
          open
          onClose={() => setTarget(null)}
          title={target.type === "LOST" ? "Mark Copy as Lost" : "Mark Copy as Damaged"}
          eyebrow="Lost / Damaged"
          icon={target.type === "LOST" ? Ban : AlertTriangle}
          maxWidthClass="max-w-md"
          footer={
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setTarget(null)} className="text-xs font-bold px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer transition">Cancel</button>
              <AppButton variant="destructive" size="sm" onClick={confirm}>Confirm & Raise Fine</AppButton>
            </div>
          }
        >
          <div className="space-y-3 text-xs">
            <div className="bg-stone-50 border border-stone-200 rounded-lg p-3">
              <p className="font-bold text-stone-800">{bookTitle(target.copy.bookId)}</p>
              <p className="font-mono text-[10px] text-stone-400">{target.copy.accessionNo}</p>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1.5 tracking-wide">Penalty Amount</label>
              <input type="number" step="0.01" className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <p className="text-[10px] text-stone-400 mt-1">A {target.type === "LOST" ? "lost" : "damage"} fine of <span className="font-bold">{formatMoney(Number(amount || 0))}</span> will be raised as PENDING for settlement.</p>
            </div>
          </div>
        </AppModal>
      )}
    </>
  );
}

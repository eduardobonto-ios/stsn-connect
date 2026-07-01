/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import { Coins, CheckCircle, Ban, Undo2 } from "lucide-react";
import AppTable, { type AppTableColumn } from "../../../../components/common/AppTable";
import AppButton from "../../../../components/common/AppButton";
import AppModal from "../../../../components/common/AppModal";
import { SectionPanel, LibraryStatusBadge, formatMoney } from "../shared";
import type { LibrarySectionProps } from "./section-props";
import type { LibraryFine } from "../../types";

const field = "w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown";
const label = "block text-[10px] uppercase font-bold text-stone-500 mb-1.5 tracking-wide";

export default function LibraryFines({ lib, canPage }: LibrarySectionProps) {
  const canSettle = canPage("LIBRARY_SYSTEM", "fines", "manage");
  const canWaive = canPage("LIBRARY_SYSTEM", "fines", "approve");

  const [settleFor, setSettleFor] = useState<LibraryFine | null>(null);
  const [orNumber, setOrNumber] = useState("");
  const [settleRemarks, setSettleRemarks] = useState("");
  const [waiveFor, setWaiveFor] = useState<LibraryFine | null>(null);
  const [waiveReason, setWaiveReason] = useState("");

  const openSettle = (f: LibraryFine) => { setOrNumber(""); setSettleRemarks(""); setSettleFor(f); };
  const openWaive = (f: LibraryFine) => { setWaiveReason(""); setWaiveFor(f); };

  const doSettle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleFor) return;
    lib.settleFine(settleFor.id, { orNumber: orNumber.trim() || undefined, remarks: settleRemarks.trim() || undefined });
    setSettleFor(null);
  };
  const doWaive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waiveFor || !waiveReason.trim()) return;
    lib.waiveFine(waiveFor.id, waiveReason.trim());
    setWaiveFor(null);
  };

  const totals = useMemo(() => {
    const pending = lib.fines.filter((f) => f.status === "PENDING");
    return {
      pendingCount: pending.length,
      pendingAmount: pending.reduce((s, f) => s + f.amount, 0),
      collected: lib.fines.filter((f) => f.status === "PAID").reduce((s, f) => s + f.amount, 0),
    };
  }, [lib.fines]);

  const columns = useMemo<AppTableColumn<LibraryFine>[]>(() => [
    { id: "borrower", header: "Borrower", accessorFn: (r) => r.borrowerName ?? "—", cell: ({ getValue }) => <span className="font-semibold text-stone-800">{String(getValue())}</span> },
    { id: "type", header: "Type", accessorFn: (r) => r.fineType, cell: ({ row }) => <LibraryStatusBadge status={row.original.fineType === "OVERDUE" ? "OVERDUE" : row.original.fineType === "LOST" ? "LOST" : "DAMAGED"} label={row.original.fineType} /> },
    { id: "amount", header: "Amount", accessorFn: (r) => r.amount, cell: ({ row }) => <span className="block text-right font-mono font-bold text-stone-800">{formatMoney(row.original.amount)}</span> },
    { id: "assessed", header: "Assessed", accessorFn: (r) => r.assessedDate, cell: ({ getValue }) => <span className="font-mono text-stone-500">{String(getValue())}</span> },
    { id: "status", header: "Status", accessorFn: (r) => r.status, cell: ({ row }) => <LibraryStatusBadge status={row.original.status} /> },
    {
      id: "actions", header: "", enableSorting: false,
      cell: ({ row }) => {
        const f = row.original;
        if (f.status !== "PENDING") return <span className="text-[10px] text-stone-400">{f.orNumber ? `OR ${f.orNumber}` : "—"}</span>;
        return (
          <div className="flex items-center justify-end gap-1.5">
            {canSettle && <button onClick={() => openSettle(f)} className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 cursor-pointer transition"><CheckCircle className="w-3 h-3" /> Settle</button>}
            {canWaive && <button onClick={() => openWaive(f)} className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 cursor-pointer transition"><Undo2 className="w-3 h-3" /> Waive</button>}
            {canSettle && <button onClick={() => lib.cancelFine(f.id)} className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-stone-50 text-stone-600 border border-stone-200 hover:bg-stone-100 cursor-pointer transition"><Ban className="w-3 h-3" /> Cancel</button>}
          </div>
        );
      },
    },
  ], [canSettle, canWaive, lib]);

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-[10px] uppercase font-mono text-amber-600">Pending</p><p className="text-xl font-black text-amber-700 mt-1">{formatMoney(totals.pendingAmount)}</p><p className="text-[10px] text-amber-600 mt-0.5">{totals.pendingCount} fine(s)</p></div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-[10px] uppercase font-mono text-emerald-600">Collected</p><p className="text-xl font-black text-emerald-700 mt-1">{formatMoney(totals.collected)}</p></div>
        <div className="rounded-xl border border-stone-200 bg-white p-4"><p className="text-[10px] uppercase font-mono text-stone-400">Total Fines</p><p className="text-xl font-black text-stone-700 mt-1">{lib.fines.length}</p></div>
      </div>

      <SectionPanel title="Fines" icon={Coins} meta={`${lib.fines.length} records`}>
        <AppTable<LibraryFine> columns={columns} data={lib.fines} getRowId={(r) => r.id} initialPageSize={10} emptyMessage="No fines recorded." />
      </SectionPanel>

      {settleFor && (
        <AppModal
          open onClose={() => setSettleFor(null)} title="Settle Fine" eyebrow="Cashier Settlement" icon={CheckCircle}
          panelAs="form" onSubmit={doSettle} maxWidthClass="max-w-md"
          footer={
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setSettleFor(null)} className="text-xs font-bold px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer transition">Cancel</button>
              <AppButton type="submit" size="sm" leftIcon={CheckCircle}>Mark Paid</AppButton>
            </div>
          }
        >
          <div className="space-y-3 text-xs">
            <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 flex justify-between">
              <div><p className="font-bold text-stone-800">{settleFor.borrowerName ?? "—"}</p><p className="text-[10px] text-stone-400">{settleFor.fineType} fine</p></div>
              <p className="font-mono font-black text-stone-800">{formatMoney(settleFor.amount)}</p>
            </div>
            <div><label className={label}>OR Number</label><input className={`${field} font-mono`} value={orNumber} onChange={(e) => setOrNumber(e.target.value)} placeholder="Official receipt no." /></div>
            <div><label className={label}>Remarks</label><input className={field} value={settleRemarks} onChange={(e) => setSettleRemarks(e.target.value)} placeholder="Optional" /></div>
          </div>
        </AppModal>
      )}

      {waiveFor && (
        <AppModal
          open onClose={() => setWaiveFor(null)} title="Waive Fine" eyebrow="Approval" icon={Undo2}
          panelAs="form" onSubmit={doWaive} maxWidthClass="max-w-md"
          footer={
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setWaiveFor(null)} className="text-xs font-bold px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer transition">Cancel</button>
              <AppButton type="submit" size="sm" variant="secondary" disabled={!waiveReason.trim()}>Waive Fine</AppButton>
            </div>
          }
        >
          <div className="space-y-3 text-xs">
            <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 flex justify-between">
              <div><p className="font-bold text-stone-800">{waiveFor.borrowerName ?? "—"}</p><p className="text-[10px] text-stone-400">{waiveFor.fineType} fine</p></div>
              <p className="font-mono font-black text-stone-800">{formatMoney(waiveFor.amount)}</p>
            </div>
            <div><label className={label}>Reason for Waiver <span className="text-red-500">*</span></label><textarea rows={3} required className={`${field} resize-none`} value={waiveReason} onChange={(e) => setWaiveReason(e.target.value)} placeholder="Justification for waiving this fine" /></div>
          </div>
        </AppModal>
      )}
    </>
  );
}

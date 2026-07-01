/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react";
import {
  BookMarked, RotateCcw, BookPlus, Activity, History, Coins, ArrowRight,
} from "lucide-react";
import { SectionPanel, LibraryStatusBadge, formatMoney } from "../shared";
import EmptyState from "../../../../components/common/EmptyState";
import type { LibraryDashboardProps } from "./section-props";

const todayStr = () => new Date().toISOString().slice(0, 10);

const COPY_STATUSES: { key: string; label: string }[] = [
  { key: "AVAILABLE", label: "Available" },
  { key: "BORROWED", label: "Borrowed" },
  { key: "RESERVED", label: "Reserved" },
  { key: "DAMAGED", label: "Damaged" },
  { key: "LOST", label: "Lost" },
];

export default function LibraryDashboard({ lib, onNavigate }: LibraryDashboardProps) {
  const recent = useMemo(
    () =>
      [...lib.transactions]
        .sort((a, b) => (b.checkoutDate ?? "").localeCompare(a.checkoutDate ?? ""))
        .slice(0, 8),
    [lib.transactions],
  );

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    lib.copies.forEach((c) => {
      counts[c.copyStatus] = (counts[c.copyStatus] ?? 0) + 1;
    });
    return counts;
  }, [lib.copies]);

  const finesPending = useMemo(
    () => lib.fines.filter((f) => f.status === "PENDING"),
    [lib.fines],
  );
  const finesTotal = finesPending.reduce((sum, f) => sum + f.amount, 0);

  const today = todayStr();
  const totalCopies = lib.copies.length || 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Main column */}
      <div className="lg:col-span-2 space-y-4">
        <SectionPanel title="Recent Borrowing Activity" icon={History} meta={`${lib.transactions.length} total`}>
          {recent.length === 0 ? (
            <EmptyState
              icon={History}
              title="No borrowing activity yet"
              description="Checkouts recorded at the borrowing window will appear here."
              compact
            />
          ) : (
            <div className="space-y-2">
              {recent.map((txn) => {
                const items = lib.itemsByTransaction(txn.id);
                const overdue = items.some(
                  (i) => (i.itemStatus === "BORROWED" || i.itemStatus === "OVERDUE") && i.dueDate && i.dueDate < today,
                );
                return (
                  <div
                    key={txn.id}
                    className="flex items-center justify-between gap-3 border border-stone-200 rounded-lg px-3 py-2.5 hover:bg-stone-50 transition"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-stone-800 truncate">{txn.borrowerName ?? "Unknown"}</p>
                      <p className="text-[10px] font-mono text-stone-400">
                        {txn.transactionNo} • {items.length} book{items.length !== 1 ? "s" : ""} • out {txn.checkoutDate}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] font-mono text-stone-400">due {txn.dueDate}</span>
                      <LibraryStatusBadge status={overdue && txn.status === "BORROWED" ? "OVERDUE" : txn.status} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionPanel>

        <SectionPanel title="Inventory Status" icon={Activity}>
          <div className="space-y-3">
            {COPY_STATUSES.map((s) => {
              const count = statusCounts[s.key] ?? 0;
              const pct = Math.round((count / totalCopies) * 100);
              return (
                <div key={s.key}>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <div className="flex items-center gap-2">
                      <LibraryStatusBadge status={s.key} />
                    </div>
                    <span className="font-mono font-bold text-stone-600">{count} • {pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-stone-100 overflow-hidden">
                    <div className="h-full bg-stsn-gold rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </SectionPanel>
      </div>

      {/* Right rail */}
      <div className="space-y-4">
        <SectionPanel title="Quick Actions">
          <div className="space-y-2">
            <button
              onClick={() => onNavigate("borrowing")}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl border border-stsn-beige bg-stsn-cream/60 hover:bg-stsn-cream transition cursor-pointer text-left"
            >
              <BookMarked className="w-4 h-4 text-stsn-brown flex-shrink-0" />
              <span className="text-xs font-bold text-stsn-brown flex-1">New Checkout</span>
              <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
            </button>
            <button
              onClick={() => onNavigate("returns")}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl border border-stsn-beige bg-white hover:bg-stone-50 transition cursor-pointer text-left"
            >
              <RotateCcw className="w-4 h-4 text-stsn-brown flex-shrink-0" />
              <span className="text-xs font-bold text-stsn-brown flex-1">Process Return</span>
              <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
            </button>
            <button
              onClick={() => onNavigate("catalog")}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl border border-stsn-beige bg-white hover:bg-stone-50 transition cursor-pointer text-left"
            >
              <BookPlus className="w-4 h-4 text-stsn-brown flex-shrink-0" />
              <span className="text-xs font-bold text-stsn-brown flex-1">Add Title</span>
              <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
            </button>
          </div>
        </SectionPanel>

        <SectionPanel title="Outstanding Fines" icon={Coins}>
          <div className="text-center py-2">
            <p className="text-2xl font-display font-black text-amber-600 leading-none">{formatMoney(finesTotal)}</p>
            <p className="text-[10px] font-mono uppercase tracking-wide text-stone-400 mt-1">
              {finesPending.length} pending fine{finesPending.length !== 1 ? "s" : ""}
            </p>
            <button
              onClick={() => onNavigate("fines")}
              className="mt-3 text-[11px] font-bold text-stsn-brown hover:underline cursor-pointer inline-flex items-center gap-1"
            >
              Manage fines <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </SectionPanel>
      </div>
    </div>
  );
}

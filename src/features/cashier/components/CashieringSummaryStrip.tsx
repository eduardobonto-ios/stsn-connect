import React from "react";
import { Banknote, FileText, Receipt, Wallet } from "lucide-react";

const metrics = [
  { key: "queue", label: "Waiting in queue", icon: Receipt },
  { key: "balance", label: "Total balance due", icon: Wallet },
  { key: "transactions", label: "Transactions today", icon: FileText },
  { key: "collected", label: "Amount collected today", icon: Banknote },
] as const;

export default function CashieringSummaryStrip({
  queueCount,
  balanceDue,
  transactionsToday,
  collectedToday,
  formatMoney,
}: {
  queueCount: number;
  balanceDue: number;
  transactionsToday: number;
  collectedToday: number;
  formatMoney: (value: number) => string;
}) {
  const values = { queue: String(queueCount), balance: formatMoney(balanceDue), transactions: String(transactionsToday), collected: formatMoney(collectedToday) };
  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4" aria-label="Cashiering summary">
      {metrics.map(({ key, label, icon: Icon }) => (
        <div key={key} className="flex min-w-0 items-center gap-3 rounded-xl border border-stsn-beige bg-white px-3 py-2.5 shadow-sm">
          <span className="rounded-lg bg-stsn-cream p-2 text-stsn-brown"><Icon className="h-4 w-4" /></span>
          <div className="min-w-0">
            <p className="truncate text-[9px] font-bold uppercase tracking-wide text-stone-500">{label}</p>
            <p className="truncate font-display text-base font-black text-stone-900">{values[key]}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

import React from "react";
import { CalendarDays } from "lucide-react";
import AppActionToolbar from "../../../components/common/AppActionToolbar";
import AppSearchInput from "../../../components/common/AppSearchInput";
import type { CashierTab } from "./CashieringTabs";

const PLACEHOLDERS: Record<CashierTab, string> = {
  queue: "Search student name or student number…",
  "other-payments": "Search student, OR number, or category…",
  vouchers: "Search voucher, payee, category, or reference…",
  history: "Search OR, payer, category, or remarks…",
  reports: "Search report payment records…",
};

export default function CashieringToolbar({ tab, query, onQueryChange, searchRef, historyDate, onHistoryDateChange, actions }: {
  tab: CashierTab;
  query: string;
  onQueryChange: (value: string) => void;
  searchRef?: React.Ref<HTMLInputElement>;
  historyDate: string;
  onHistoryDateChange: (value: string) => void;
  actions?: React.ReactNode;
}) {
  if (tab === "reports") return null;
  return (
    <AppActionToolbar className="py-2">
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
        <AppSearchInput ref={searchRef} value={query} onChange={(event) => onQueryChange(event.target.value)} onClear={() => onQueryChange("")} placeholder={PLACEHOLDERS[tab]} uiSize="sm" wrapperClassName="max-w-xl" />
        {tab === "history" && (
          <label className="flex items-center gap-2 text-[10px] font-bold uppercase text-stone-500">
            <CalendarDays className="h-3.5 w-3.5" />
            <input type="date" value={historyDate} onChange={(event) => onHistoryDateChange(event.target.value)} className="rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs font-semibold text-stone-700" />
          </label>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </AppActionToolbar>
  );
}

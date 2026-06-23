import React, { useEffect, useMemo, useState } from "react";
import {
  Activity, Banknote, Download, Eye, Filter, Loader2, PieChart, Search, Scale, X,
} from "lucide-react";
import STSNDataTable, { type STSNColumn } from "../../../../components/common/STSNDataTable";
import { dbSelectAll } from "../../../../services/supabaseCrud";

type ReportKind = "trial-balance" | "balance-sheet" | "income-statement" | "cash-flow";
type AccountType = "Asset" | "Liability" | "Equity" | "Revenue" | "Expense";
type NormalBalance = "Debit" | "Credit";
type JEStatus = "Draft" | "Posted" | "Void";
type CashFlowCategory = "Operating" | "Investing" | "Financing";

interface ChartAccount {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  normalBalance: NormalBalance;
  parentCode: string | null;
  isHeader: boolean;
  status: string;
}

interface JournalEntry {
  id: string;
  entryNo: string;
  entryDate: string;
  fiscalYear: string;
  fiscalPeriod: string;
  description: string;
  referenceNo: string;
  sourceType: string;
  status: JEStatus;
}

interface JournalEntryLine {
  id: string;
  journalEntryId: string;
  lineNo: number;
  accountCode: string;
  costCenterId: string | null;
  debitAmount: number;
  creditAmount: number;
  description: string;
}

interface AccountBalanceRow {
  id: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  normalBalance: NormalBalance;
  debit: number;
  credit: number;
  debitBalance: number;
  creditBalance: number;
  statementAmount: number;
  lineCount: number;
}

interface StatementRow {
  id: string;
  section: string;
  accountCode: string;
  accountName: string;
  amount: number;
}

interface CashFlowRow {
  id: string;
  category: CashFlowCategory;
  entryDate: string;
  entryNo: string;
  description: string;
  cashAccount: string;
  amount: number;
}

interface LineDetailRow extends JournalEntryLine {
  entryNo: string;
  entryDate: string;
  fiscalPeriod: string;
  descriptionText: string;
}

function fmt(value: number): string {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function signedAmount(type: AccountType, debit: number, credit: number): number {
  return type === "Asset" || type === "Expense" ? debit - credit : credit - debit;
}

function rowToAccount(r: any): ChartAccount {
  return {
    id: r.id,
    code: r.code ?? "",
    name: r.name ?? "",
    type: (r.type ?? "Asset") as AccountType,
    normalBalance: (r.normalBalance ?? "Debit") as NormalBalance,
    parentCode: r.parentCode ?? null,
    isHeader: Boolean(r.isHeader),
    status: r.status ?? "Active",
  };
}

function rowToJE(r: any): JournalEntry {
  return {
    id: r.id,
    entryNo: r.entryNo ?? "",
    entryDate: r.entryDate ?? "",
    fiscalYear: r.fiscalYear ?? "",
    fiscalPeriod: r.fiscalPeriod ?? "",
    description: r.description ?? "",
    referenceNo: r.referenceNo ?? "",
    sourceType: r.sourceType ?? "Manual",
    status: (r.status ?? "Draft") as JEStatus,
  };
}

function rowToLine(r: any): JournalEntryLine {
  return {
    id: r.id,
    journalEntryId: r.journalEntryId,
    lineNo: Number(r.lineNo ?? 1),
    accountCode: r.accountCode ?? "",
    costCenterId: r.costCenterId ?? null,
    debitAmount: Number(r.debitAmount ?? 0),
    creditAmount: Number(r.creditAmount ?? 0),
    description: r.description ?? "",
  };
}

function inferCashFlowCategory(accountsByCode: Map<string, ChartAccount>, entryLines: JournalEntryLine[], cashLine: JournalEntryLine): CashFlowCategory {
  const counterpartTypes = entryLines
    .filter((line) => line.id !== cashLine.id)
    .map((line) => accountsByCode.get(line.accountCode)?.type)
    .filter(Boolean) as AccountType[];

  if (counterpartTypes.some((type) => type === "Equity" || type === "Liability")) return "Financing";
  if (counterpartTypes.some((type) => type === "Asset")) return "Investing";
  return "Operating";
}

const REPORT_CONFIG: Record<ReportKind, { title: string; desc: string; icon: React.ElementType }> = {
  "trial-balance": {
    title: "Trial Balance Report",
    desc: "Debit and credit totals by GL account, derived from posted journal entries.",
    icon: Scale,
  },
  "balance-sheet": {
    title: "Balance Sheet Report",
    desc: "Assets, liabilities, and equity snapshot from posted journal balances.",
    icon: PieChart,
  },
  "income-statement": {
    title: "Income Statement",
    desc: "Revenue less expenses for the selected period.",
    icon: Activity,
  },
  "cash-flow": {
    title: "Cash Flow Report",
    desc: "Cash movements grouped into operating, investing, and financing activity.",
    icon: Banknote,
  },
};

const TYPE_BADGE: Record<AccountType, string> = {
  Asset: "bg-blue-50 text-blue-700 border-blue-200",
  Liability: "bg-rose-50 text-rose-700 border-rose-200",
  Equity: "bg-purple-50 text-purple-700 border-purple-200",
  Revenue: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Expense: "bg-amber-50 text-amber-700 border-amber-200",
};

export default function FinancialStatementsPage({ report }: { report: ReportKind }) {
  const [accounts, setAccounts] = useState<ChartAccount[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [lines, setLines] = useState<JournalEntryLine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fiscalYear, setFiscalYear] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [detailTarget, setDetailTarget] = useState<AccountBalanceRow | null>(null);

  useEffect(() => {
    Promise.all([
      dbSelectAll("chart_of_accounts"),
      dbSelectAll("journal_entries"),
      dbSelectAll("journal_entry_lines"),
    ]).then(([accountRows, entryRows, lineRows]) => {
      setAccounts(accountRows.map(rowToAccount));
      setEntries(entryRows.map(rowToJE));
      setLines(lineRows.map(rowToLine));
      setIsLoading(false);
    });
  }, []);

  const config = REPORT_CONFIG[report];
  const Icon = config.icon;

  const accountsByCode = useMemo(() => new Map(accounts.map((account) => [account.code, account])), [accounts]);
  const entriesById = useMemo(() => new Map(entries.map((entry) => [entry.id, entry])), [entries]);
  const fiscalYears = useMemo(() => [...new Set(entries.map((entry) => entry.fiscalYear).filter(Boolean))].sort().reverse(), [entries]);

  const filteredEntries = useMemo(() => entries.filter((entry) => {
    if (entry.status !== "Posted") return false;
    if (fiscalYear !== "All" && entry.fiscalYear !== fiscalYear) return false;
    if (dateFrom && entry.entryDate < dateFrom) return false;
    if (dateTo && entry.entryDate > dateTo) return false;
    return true;
  }), [entries, fiscalYear, dateFrom, dateTo]);

  const filteredEntryIds = useMemo(() => new Set(filteredEntries.map((entry) => entry.id)), [filteredEntries]);

  const postedLines = useMemo(
    () => lines.filter((line) => filteredEntryIds.has(line.journalEntryId)),
    [lines, filteredEntryIds],
  );

  const balanceRows = useMemo<AccountBalanceRow[]>(() => {
    const totals = new Map<string, { debit: number; credit: number; lineCount: number }>();
    postedLines.forEach((line) => {
      const total = totals.get(line.accountCode) ?? { debit: 0, credit: 0, lineCount: 0 };
      total.debit += line.debitAmount;
      total.credit += line.creditAmount;
      total.lineCount += 1;
      totals.set(line.accountCode, total);
    });

    return accounts
      .filter((account) => !account.isHeader)
      .map((account) => {
        const total = totals.get(account.code) ?? { debit: 0, credit: 0, lineCount: 0 };
        const debitBalance = Math.max(total.debit - total.credit, 0);
        const creditBalance = Math.max(total.credit - total.debit, 0);
        return {
          id: account.code,
          accountCode: account.code,
          accountName: account.name,
          accountType: account.type,
          normalBalance: account.normalBalance,
          debit: total.debit,
          credit: total.credit,
          debitBalance,
          creditBalance,
          statementAmount: signedAmount(account.type, total.debit, total.credit),
          lineCount: total.lineCount,
        };
      })
      .filter((row) => Math.abs(row.debit) > 0.004 || Math.abs(row.credit) > 0.004)
      .sort((a, b) => a.accountCode.localeCompare(b.accountCode));
  }, [accounts, postedLines]);

  const trialBalanceRows = useMemo(() => {
    const q = search.toLowerCase();
    return balanceRows.filter((row) => !q || row.accountCode.toLowerCase().includes(q) || row.accountName.toLowerCase().includes(q) || row.accountType.toLowerCase().includes(q));
  }, [balanceRows, search]);

  const totals = useMemo(() => {
    const debit = balanceRows.reduce((sum, row) => sum + row.debit, 0);
    const credit = balanceRows.reduce((sum, row) => sum + row.credit, 0);
    const revenue = balanceRows.filter((row) => row.accountType === "Revenue").reduce((sum, row) => sum + row.statementAmount, 0);
    const expenses = balanceRows.filter((row) => row.accountType === "Expense").reduce((sum, row) => sum + row.statementAmount, 0);
    const assets = balanceRows.filter((row) => row.accountType === "Asset").reduce((sum, row) => sum + row.statementAmount, 0);
    const liabilities = balanceRows.filter((row) => row.accountType === "Liability").reduce((sum, row) => sum + row.statementAmount, 0);
    const equity = balanceRows.filter((row) => row.accountType === "Equity").reduce((sum, row) => sum + row.statementAmount, 0);
    const netIncome = revenue - expenses;
    return { debit, credit, revenue, expenses, assets, liabilities, equity, netIncome };
  }, [balanceRows]);

  const statementRows = useMemo<StatementRow[]>(() => {
    const q = search.toLowerCase();
    const includeTypes: AccountType[] = report === "balance-sheet" ? ["Asset", "Liability", "Equity"] : ["Revenue", "Expense"];
    const rows = balanceRows
      .filter((row) => includeTypes.includes(row.accountType))
      .filter((row) => Math.abs(row.statementAmount) > 0.004)
      .map((row) => ({
        id: row.accountCode,
        section: row.accountType,
        accountCode: row.accountCode,
        accountName: row.accountName,
        amount: row.statementAmount,
      }));

    if (report === "balance-sheet" && Math.abs(totals.netIncome) > 0.004) {
      rows.push({
        id: "current-year-net-income",
        section: "Equity",
        accountCode: "NET",
        accountName: "Current Year Surplus / Deficit",
        amount: totals.netIncome,
      });
    }

    return rows.filter((row) => !q || row.section.toLowerCase().includes(q) || row.accountCode.toLowerCase().includes(q) || row.accountName.toLowerCase().includes(q));
  }, [balanceRows, report, search, totals.netIncome]);

  const cashFlowRows = useMemo<CashFlowRow[]>(() => {
    const q = search.toLowerCase();
    const cashCodes = new Set(accounts.filter((account) => !account.isHeader && account.type === "Asset" && /cash|bank/i.test(`${account.code} ${account.name}`)).map((account) => account.code));

    return filteredEntries.map((entry) => {
      const entryLines = lines.filter((line) => line.journalEntryId === entry.id);
      const cashLines = entryLines.filter((line) => cashCodes.has(line.accountCode));
      if (cashLines.length === 0) return null;

      const amount = cashLines.reduce((sum, line) => sum + line.debitAmount - line.creditAmount, 0);
      const category = inferCashFlowCategory(accountsByCode, entryLines, cashLines[0]);
      return {
        id: entry.id,
        category,
        entryDate: entry.entryDate,
        entryNo: entry.entryNo,
        description: entry.description || cashLines[0].description,
        cashAccount: cashLines.map((line) => `${line.accountCode} - ${accountsByCode.get(line.accountCode)?.name ?? "Cash Account"}`).join(", "),
        amount,
      };
    })
      .filter((row): row is CashFlowRow => row !== null)
      .filter((row) => Math.abs(row.amount) > 0.004)
      .filter((row) => !q || row.entryNo.toLowerCase().includes(q) || row.description.toLowerCase().includes(q) || row.category.toLowerCase().includes(q) || row.cashAccount.toLowerCase().includes(q))
      .sort((a, b) => b.entryDate.localeCompare(a.entryDate));
  }, [accounts, accountsByCode, filteredEntries, lines, search]);

  const cashFlowTotals = useMemo(() => {
    const blank: Record<CashFlowCategory, number> = { Operating: 0, Investing: 0, Financing: 0 };
    cashFlowRows.forEach((row) => { blank[row.category] += row.amount; });
    return blank;
  }, [cashFlowRows]);

  const detailRows = useMemo<LineDetailRow[]>(() => {
    if (!detailTarget) return [];
    return postedLines
      .filter((line) => line.accountCode === detailTarget.accountCode)
      .map((line) => {
        const entry = entriesById.get(line.journalEntryId);
        return {
          ...line,
          entryNo: entry?.entryNo ?? "",
          entryDate: entry?.entryDate ?? "",
          fiscalPeriod: entry?.fiscalPeriod ?? "",
          descriptionText: line.description || entry?.description || "",
        };
      })
      .sort((a, b) => b.entryDate.localeCompare(a.entryDate) || a.lineNo - b.lineNo);
  }, [detailTarget, entriesById, postedLines]);

  const trialColumns: STSNColumn<AccountBalanceRow>[] = [
    {
      title: "Account",
      data: "accountName",
      render: (_, row) => (
        <div>
          <p className="font-mono text-xs font-bold text-stone-800">{row.accountCode}</p>
          <p className="text-xs font-semibold text-stone-700">{row.accountName}</p>
        </div>
      ),
    },
    {
      title: "Type",
      data: "accountType",
      render: (value: AccountType) => <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full border ${TYPE_BADGE[value]}`}>{value}</span>,
      width: "110px",
    },
    { title: "Normal", data: "normalBalance", render: (value: NormalBalance) => <span className="font-mono text-xs text-stone-500">{value}</span>, width: "85px" },
    { title: "Debit Total", data: "debit", className: "text-right", render: (value: number) => <span className="font-mono text-xs font-semibold text-stone-700">PHP {fmt(value)}</span>, width: "130px" },
    { title: "Credit Total", data: "credit", className: "text-right", render: (value: number) => <span className="font-mono text-xs font-semibold text-stone-700">PHP {fmt(value)}</span>, width: "130px" },
    { title: "Debit Balance", data: "debitBalance", className: "text-right", render: (value: number) => <span className={`font-mono text-xs ${value ? "font-bold text-blue-700" : "text-stone-300"}`}>{value ? `PHP ${fmt(value)}` : "-"}</span>, width: "130px" },
    { title: "Credit Balance", data: "creditBalance", className: "text-right", render: (value: number) => <span className={`font-mono text-xs ${value ? "font-bold text-rose-700" : "text-stone-300"}`}>{value ? `PHP ${fmt(value)}` : "-"}</span>, width: "130px" },
    {
      title: "",
      data: "id",
      orderable: false,
      searchable: false,
      render: (_, row) => (
        <button onClick={() => setDetailTarget(row)} title="View posting detail" className="p-1 rounded-lg hover:bg-blue-50 text-stone-400 hover:text-blue-600 transition cursor-pointer">
          <Eye className="w-3.5 h-3.5" />
        </button>
      ),
      width: "45px",
    },
  ];

  const statementColumns: STSNColumn<StatementRow>[] = [
    { title: "Section", data: "section", render: (value: string) => <span className="text-xs font-semibold text-stone-600">{value}</span>, width: "120px" },
    { title: "Account Code", data: "accountCode", render: (value: string) => <span className="font-mono text-xs font-bold text-stone-700">{value}</span>, width: "120px" },
    { title: "Account", data: "accountName", render: (value: string) => <span className="text-xs font-semibold text-stone-800">{value}</span> },
    { title: "Amount", data: "amount", className: "text-right", render: (value: number) => <span className={`font-mono text-xs font-bold ${value < 0 ? "text-rose-600" : "text-stone-900"}`}>PHP {fmt(value)}</span>, width: "140px" },
  ];

  const cashFlowColumns: STSNColumn<CashFlowRow>[] = [
    { title: "Category", data: "category", render: (value: CashFlowCategory) => <span className="text-xs font-semibold text-stone-700">{value}</span>, width: "110px" },
    { title: "Date", data: "entryDate", width: "105px" },
    { title: "Entry No.", data: "entryNo", render: (value: string) => <span className="font-mono text-xs font-bold text-stone-700">{value}</span>, width: "150px" },
    { title: "Description", data: "description" },
    { title: "Cash Account", data: "cashAccount", render: (value: string) => <span className="font-mono text-xs text-stone-600">{value}</span>, width: "180px" },
    { title: "Cash Movement", data: "amount", className: "text-right", render: (value: number) => <span className={`font-mono text-xs font-bold ${value < 0 ? "text-rose-600" : "text-emerald-700"}`}>{value < 0 ? "-" : ""}PHP {fmt(Math.abs(value))}</span>, width: "140px" },
  ];

  const detailColumns: STSNColumn<LineDetailRow>[] = [
    { title: "Date", data: "entryDate", width: "105px" },
    { title: "Entry No.", data: "entryNo", render: (value: string) => <span className="font-mono text-xs font-bold text-stone-700">{value}</span>, width: "150px" },
    { title: "Period", data: "fiscalPeriod", width: "130px" },
    { title: "Description", data: "descriptionText" },
    { title: "Debit", data: "debitAmount", className: "text-right", render: (value: number) => <span className="font-mono text-xs">{value ? `PHP ${fmt(value)}` : "-"}</span>, width: "115px" },
    { title: "Credit", data: "creditAmount", className: "text-right", render: (value: number) => <span className="font-mono text-xs">{value ? `PHP ${fmt(value)}` : "-"}</span>, width: "115px" },
  ];

  const balanceSheetRightSide = totals.liabilities + totals.equity + totals.netIncome;
  const cashNetChange = cashFlowTotals.Operating + cashFlowTotals.Investing + cashFlowTotals.Financing;

  return (
    <div className="space-y-5 animate-fade-in font-sans">
      <div className="p-5 bg-white border border-stsn-beige rounded-xl shadow-sm flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-semibold text-stone-900 tracking-tight flex items-center gap-2">
            <Icon className="w-5 h-5 text-stsn-brown" />
            {config.title}
          </h2>
          <p className="text-stone-500 text-xs mt-1">{config.desc}</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 text-xs text-stone-500 hover:text-stone-700 border border-stone-200 rounded-lg hover:bg-stone-50 transition cursor-pointer">
          <Download className="w-3.5 h-3.5" />
          Export
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {report === "trial-balance" && (
          <>
            <SummaryCard label="Debit Totals" value={`PHP ${fmt(totals.debit)}`} tone="blue" />
            <SummaryCard label="Credit Totals" value={`PHP ${fmt(totals.credit)}`} tone="rose" />
            <SummaryCard label="Difference" value={`PHP ${fmt(Math.abs(totals.debit - totals.credit))}`} tone={Math.abs(totals.debit - totals.credit) < 0.01 ? "emerald" : "amber"} />
            <SummaryCard label="Posted Entries" value={String(filteredEntries.length)} tone="stone" />
          </>
        )}
        {report === "balance-sheet" && (
          <>
            <SummaryCard label="Assets" value={`PHP ${fmt(totals.assets)}`} tone="blue" />
            <SummaryCard label="Liabilities" value={`PHP ${fmt(totals.liabilities)}`} tone="rose" />
            <SummaryCard label="Equity + Surplus" value={`PHP ${fmt(totals.equity + totals.netIncome)}`} tone="purple" />
            <SummaryCard label="Equation Difference" value={`PHP ${fmt(Math.abs(totals.assets - balanceSheetRightSide))}`} tone={Math.abs(totals.assets - balanceSheetRightSide) < 0.01 ? "emerald" : "amber"} />
          </>
        )}
        {report === "income-statement" && (
          <>
            <SummaryCard label="Revenue" value={`PHP ${fmt(totals.revenue)}`} tone="emerald" />
            <SummaryCard label="Expenses" value={`PHP ${fmt(totals.expenses)}`} tone="amber" />
            <SummaryCard label="Net Income" value={`PHP ${fmt(totals.netIncome)}`} tone={totals.netIncome >= 0 ? "blue" : "rose"} />
            <SummaryCard label="Posted Entries" value={String(filteredEntries.length)} tone="stone" />
          </>
        )}
        {report === "cash-flow" && (
          <>
            <SummaryCard label="Operating" value={`PHP ${fmt(cashFlowTotals.Operating)}`} tone="emerald" />
            <SummaryCard label="Investing" value={`PHP ${fmt(cashFlowTotals.Investing)}`} tone="blue" />
            <SummaryCard label="Financing" value={`PHP ${fmt(cashFlowTotals.Financing)}`} tone="purple" />
            <SummaryCard label="Net Cash Change" value={`PHP ${fmt(cashNetChange)}`} tone={cashNetChange >= 0 ? "emerald" : "rose"} />
          </>
        )}
      </div>

      <div className="bg-white border border-stsn-beige rounded-xl px-4 py-3 shadow-sm flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search report rows..."
            className="w-full pl-8 pr-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-stone-400" />
          <select
            value={fiscalYear}
            onChange={(e) => setFiscalYear(e.target.value)}
            className="text-xs border border-stone-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-stsn-gold/50"
          >
            <option value="All">All Fiscal Years</option>
            {fiscalYears.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </div>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="text-xs border border-stone-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-stsn-gold/50" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="text-xs border border-stone-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-stsn-gold/50" />
      </div>

      <div className="bg-white border border-stsn-beige rounded-xl shadow-sm overflow-hidden p-1">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-stone-400 text-xs">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading financial statement data...
          </div>
        ) : report === "trial-balance" ? (
          <STSNDataTable key="trial-balance-table" columns={trialColumns} rows={trialBalanceRows} searchable={false} emptyMessage="No posted journal balances for this period." pageLength={15} />
        ) : report === "cash-flow" ? (
          <STSNDataTable key="cash-flow-table" columns={cashFlowColumns} rows={cashFlowRows} searchable={false} emptyMessage="No cash movements for this period." pageLength={15} />
        ) : (
          <STSNDataTable key={`${report}-table`} columns={statementColumns} rows={statementRows} searchable={false} emptyMessage="No statement balances for this period." pageLength={15} />
        )}
      </div>

      {detailTarget && (
        <div className="app-modal-backdrop z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl border border-stone-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-sm font-bold text-stone-800">{detailTarget.accountCode} - {detailTarget.accountName}</h3>
                <p className="text-[10px] text-stone-400">{detailTarget.lineCount} posted line{detailTarget.lineCount !== 1 ? "s" : ""} in the selected period</p>
              </div>
              <button onClick={() => setDetailTarget(null)} className="text-stone-400 hover:text-stone-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-5">
              <STSNDataTable columns={detailColumns} rows={detailRows} searchable={false} emptyMessage="No posting detail found." pageLength={10} />
            </div>
            <div className="px-6 py-4 border-t border-stone-100 flex justify-end flex-shrink-0">
              <button onClick={() => setDetailTarget(null)} className="px-4 py-2 text-xs font-semibold text-stone-500 hover:text-stone-700 border border-stone-200 rounded-xl hover:bg-stone-50 transition cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: string; tone: "amber" | "blue" | "emerald" | "purple" | "rose" | "stone" }) {
  const toneClass = {
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    purple: "border-purple-200 bg-purple-50 text-purple-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
    stone: "border-stone-200 bg-stone-50 text-stone-700",
  }[tone];

  return (
    <div className={`border rounded-xl px-4 py-3 shadow-sm ${toneClass}`}>
      <p className="text-[10px] font-mono uppercase tracking-wider opacity-70">{label}</p>
      <p className="text-base font-bold mt-0.5">{value}</p>
    </div>
  );
}

import React, { useState, useMemo, useEffect } from "react";
import {
  BookMarked, Plus, Eye, Edit2, Trash2, Search, Filter, Download,
  CheckCircle, AlertTriangle, Loader2, Send, Ban, X,
} from "lucide-react";
import STSNDataTable, { type STSNColumn } from "../../../../components/common/STSNDataTable";
import { useAppDialog } from "../../../../components/common/useAppDialog";
import { dbInsert, dbUpdate, dbDelete, dbDeleteWhere, dbSelectAll, newId } from "../../../../services/supabaseCrud";

// ─── Types ────────────────────────────────────────────────────────────────────

type JEStatus = "Draft" | "Posted" | "Void";

interface JournalEntry {
  id: string;
  entryNo: string;
  entryDate: string;
  fiscalYear: string;
  fiscalPeriod: string;
  description: string;
  referenceNo: string;
  sourceType: string;
  costCenterId: string | null;
  status: JEStatus;
  createdBy: string;
  postedBy: string | null;
  postedAt: string | null;
  voidedBy: string | null;
  voidedAt: string | null;
  voidReason: string | null;
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

interface ChartAccount {
  id: string;
  code: string;
  name: string;
  type: string;
  isHeader: boolean;
  status: string;
}

interface CostCenter {
  id: string;
  code: string;
  name: string;
  status: string;
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function rowToJE(r: any): JournalEntry {
  return {
    id:           r.id,
    entryNo:      r.entryNo,
    entryDate:    r.entryDate,
    fiscalYear:   r.fiscalYear,
    fiscalPeriod: r.fiscalPeriod,
    description:  r.description  ?? "",
    referenceNo:  r.referenceNo  ?? "",
    sourceType:   r.sourceType   ?? "Manual",
    costCenterId: r.costCenterId ?? null,
    status:       r.status       as JEStatus,
    createdBy:    r.createdBy    ?? "",
    postedBy:     r.postedBy     ?? null,
    postedAt:     r.postedAt     ?? null,
    voidedBy:     r.voidedBy     ?? null,
    voidedAt:     r.voidedAt     ?? null,
    voidReason:   r.voidReason   ?? null,
  };
}

function rowToLine(r: any): JournalEntryLine {
  return {
    id:             r.id,
    journalEntryId: r.journalEntryId,
    lineNo:         r.lineNo,
    accountCode:    r.accountCode,
    costCenterId:   r.costCenterId  ?? null,
    debitAmount:    Number(r.debitAmount)  || 0,
    creditAmount:   Number(r.creditAmount) || 0,
    description:    r.description   ?? "",
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function fiscalYearFromDate(d: string): string {
  const date = new Date(d);
  const y = date.getFullYear();
  return date.getMonth() >= 5 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

function fiscalPeriodFromDate(d: string): string {
  const date = new Date(d);
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function fmt(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2 });
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<JEStatus, { label: string; badgeClass: string }> = {
  Draft:  { label: "Draft",  badgeClass: "bg-amber-50 text-amber-700 border-amber-200"       },
  Posted: { label: "Posted", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  Void:   { label: "Void",   badgeClass: "bg-stone-100 text-stone-500 border-stone-200"      },
};

// ─── Form line ────────────────────────────────────────────────────────────────

interface FormLine {
  key: string;
  accountCode: string;
  costCenterId: string;
  debit: string;
  credit: string;
  description: string;
}

const blankLine = (): FormLine => ({
  key: crypto.randomUUID(),
  accountCode: "", costCenterId: "", debit: "", credit: "", description: "",
});

interface HeaderForm {
  entryNo: string;
  entryDate: string;
  description: string;
  referenceNo: string;
  costCenterId: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function JournalEntriesPage() {
  const { alert, confirm } = useAppDialog();

  const [entries, setEntries]         = useState<JournalEntry[]>([]);
  const [allLines, setAllLines]       = useState<JournalEntryLine[]>([]);
  const [accounts, setAccounts]       = useState<ChartAccount[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [isLoading, setIsLoading]     = useState(true);

  const [search, setSearch]           = useState("");
  const [filterStatus, setFilterStatus] = useState<JEStatus | "All">("All");

  const [showForm, setShowForm]       = useState(false);
  const [editTarget, setEditTarget]   = useState<JournalEntry | null>(null);
  const [viewEntry, setViewEntry]     = useState<JournalEntry | null>(null);

  const [voidModal, setVoidModal]     = useState<JournalEntry | null>(null);
  const [voidReason, setVoidReason]   = useState("");

  const today = todayISO();
  const [headerForm, setHeaderForm]   = useState<HeaderForm>({
    entryNo: "", entryDate: today, description: "", referenceNo: "", costCenterId: "",
  });
  const [formLines, setFormLines]     = useState<FormLine[]>([blankLine(), blankLine()]);

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      dbSelectAll("journal_entries"),
      dbSelectAll("journal_entry_lines"),
      dbSelectAll("chart_of_accounts"),
      dbSelectAll("cost_centers"),
    ]).then(([jes, jels, coas, ccs]) => {
      setEntries(jes.map(rowToJE));
      setAllLines(jels.map(rowToLine));
      setAccounts(coas as ChartAccount[]);
      setCostCenters(ccs as CostCenter[]);
      setIsLoading(false);
    });
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────
  const postableAccounts = useMemo(
    () => accounts.filter((a) => !a.isHeader && a.status === "Active").sort((a, b) => a.code.localeCompare(b.code)),
    [accounts],
  );
  const activeCostCenters = useMemo(
    () => costCenters.filter((cc) => cc.status === "Active").sort((a, b) => a.code.localeCompare(b.code)),
    [costCenters],
  );

  const filtered = useMemo(() =>
    entries
      .filter((je) => {
        const ok = filterStatus === "All" || je.status === filterStatus;
        const q = search.toLowerCase();
        return ok && (!q || je.entryNo.toLowerCase().includes(q) || je.description.toLowerCase().includes(q) || je.referenceNo.toLowerCase().includes(q) || je.fiscalPeriod.toLowerCase().includes(q));
      })
      .sort((a, b) => b.entryDate.localeCompare(a.entryDate)),
    [entries, search, filterStatus],
  );

  const stats = useMemo(() => ({
    total:  entries.length,
    draft:  entries.filter((e) => e.status === "Draft").length,
    posted: entries.filter((e) => e.status === "Posted").length,
    void:   entries.filter((e) => e.status === "Void").length,
  }), [entries]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  function linesFor(jeId: string) { return allLines.filter((l) => l.journalEntryId === jeId); }

  function entryTotals(jeId: string) {
    const ls = linesFor(jeId);
    const dr = ls.reduce((s, l) => s + l.debitAmount, 0);
    const cr = ls.reduce((s, l) => s + l.creditAmount, 0);
    return { dr, cr, balanced: Math.abs(dr - cr) < 0.01 };
  }

  function nextEntryNo(date: string): string {
    const fy = fiscalYearFromDate(date);
    const seq = entries.filter((e) => e.fiscalYear === fy).length + 1;
    return `JE-${fy}-${String(seq).padStart(5, "0")}`;
  }

  // ── Open form ─────────────────────────────────────────────────────────────
  function openAdd() {
    const date = today;
    setHeaderForm({ entryNo: nextEntryNo(date), entryDate: date, description: "", referenceNo: "", costCenterId: "" });
    setFormLines([blankLine(), blankLine()]);
    setEditTarget(null);
    setShowForm(true);
  }

  function openEdit(je: JournalEntry) {
    const ls = linesFor(je.id).sort((a, b) => a.lineNo - b.lineNo);
    setHeaderForm({ entryNo: je.entryNo, entryDate: je.entryDate, description: je.description, referenceNo: je.referenceNo, costCenterId: je.costCenterId ?? "" });
    setFormLines(
      ls.length > 0
        ? ls.map((l) => ({ key: l.id, accountCode: l.accountCode, costCenterId: l.costCenterId ?? "", debit: l.debitAmount > 0 ? String(l.debitAmount) : "", credit: l.creditAmount > 0 ? String(l.creditAmount) : "", description: l.description }))
        : [blankLine(), blankLine()],
    );
    setEditTarget(je);
    setShowForm(true);
  }

  // ── Form line ops ─────────────────────────────────────────────────────────
  const updateLine = (key: string, patch: Partial<FormLine>) =>
    setFormLines((prev) => prev.map((l) => l.key === key ? { ...l, ...patch } : l));
  const addLine    = () => setFormLines((prev) => [...prev, blankLine()]);
  const removeLine = (key: string) => setFormLines((prev) => prev.filter((l) => l.key !== key));

  const formTotals = useMemo(() => {
    const dr = formLines.reduce((s, l) => s + (parseFloat(l.debit)  || 0), 0);
    const cr = formLines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
    return { dr, cr, balanced: Math.abs(dr - cr) < 0.01 && dr > 0 };
  }, [formLines]);

  // ── Save ──────────────────────────────────────────────────────────────────
  async function handleSave(postImmediately: boolean) {
    const validLines = formLines.filter((l) => l.accountCode && ((parseFloat(l.debit) || 0) > 0 || (parseFloat(l.credit) || 0) > 0));
    if (validLines.length < 2) { alert("At least two lines with an account and amount are required.", { variant: "danger" }); return; }
    if (!formTotals.balanced)  { alert("Total debits must equal total credits before saving.",        { variant: "danger" }); return; }

    const status: JEStatus   = postImmediately ? "Posted" : "Draft";
    const date               = headerForm.entryDate;
    const now                = new Date().toISOString();

    const jeData: Omit<JournalEntry, "id"> = {
      entryNo:      headerForm.entryNo,
      entryDate:    date,
      fiscalYear:   fiscalYearFromDate(date),
      fiscalPeriod: fiscalPeriodFromDate(date),
      description:  headerForm.description,
      referenceNo:  headerForm.referenceNo,
      sourceType:   "Manual",
      costCenterId: headerForm.costCenterId || null,
      status,
      createdBy:    "Accounting Staff",
      postedBy:     postImmediately ? "Accounting Staff" : null,
      postedAt:     postImmediately ? now : null,
      voidedBy:     null, voidedAt: null, voidReason: null,
    };

    const buildLines = (jeId: string) =>
      validLines.map((l, i) => ({
        id:             newId(),
        journalEntryId: jeId,
        lineNo:         i + 1,
        accountCode:    l.accountCode,
        costCenterId:   l.costCenterId || null,
        debitAmount:    parseFloat(l.debit)  || 0,
        creditAmount:   parseFloat(l.credit) || 0,
        description:    l.description,
      }));

    if (editTarget) {
      setEntries((prev) => prev.map((e) => e.id === editTarget.id ? { ...e, ...jeData } : e));
      dbUpdate("journal_entries", editTarget.id, jeData);
      dbDeleteWhere("journal_entry_lines", "journal_entry_id", editTarget.id);
      setAllLines((prev) => prev.filter((l) => l.journalEntryId !== editTarget.id));
      const newLines = buildLines(editTarget.id);
      newLines.forEach((line) => dbInsert("journal_entry_lines", line));
      setAllLines((prev) => [...prev, ...newLines]);
    } else {
      const id = newId();
      setEntries((prev) => [...prev, { id, ...jeData }]);
      dbInsert("journal_entries", { id, ...jeData });
      const newLines = buildLines(id);
      newLines.forEach((line) => dbInsert("journal_entry_lines", line));
      setAllLines((prev) => [...prev, ...newLines]);
    }

    setShowForm(false);
  }

  // ── Post ──────────────────────────────────────────────────────────────────
  async function handlePost(je: JournalEntry) {
    if (!entryTotals(je.id).balanced) { alert("Cannot post: debits and credits are not balanced.", { variant: "danger" }); return; }
    if (!await confirm(`Post journal entry "${je.entryNo}"? This cannot be undone.`, { variant: "danger" })) return;
    const patch = { status: "Posted" as JEStatus, postedBy: "Accounting Staff", postedAt: new Date().toISOString() };
    setEntries((prev) => prev.map((e) => e.id === je.id ? { ...e, ...patch } : e));
    dbUpdate("journal_entries", je.id, patch);
    if (viewEntry?.id === je.id) setViewEntry((v) => v ? { ...v, ...patch } : v);
  }

  // ── Void ──────────────────────────────────────────────────────────────────
  async function handleVoid() {
    if (!voidModal) return;
    if (!voidReason.trim()) { alert("Please enter a reason for voiding this entry.", { variant: "danger" }); return; }
    const patch = { status: "Void" as JEStatus, voidedBy: "Accounting Staff", voidedAt: new Date().toISOString(), voidReason: voidReason.trim() };
    setEntries((prev) => prev.map((e) => e.id === voidModal.id ? { ...e, ...patch } : e));
    dbUpdate("journal_entries", voidModal.id, patch);
    if (viewEntry?.id === voidModal.id) setViewEntry((v) => v ? { ...v, ...patch } : v);
    setVoidModal(null);
    setVoidReason("");
  }

  // ── Delete draft ──────────────────────────────────────────────────────────
  async function handleDelete(je: JournalEntry) {
    if (!await confirm(`Delete draft "${je.entryNo}"?`, { variant: "danger" })) return;
    setEntries((prev) => prev.filter((e) => e.id !== je.id));
    setAllLines((prev) => prev.filter((l) => l.journalEntryId !== je.id));
    dbDelete("journal_entries", je.id);
  }

  // ── Main table columns ────────────────────────────────────────────────────
  const columns: STSNColumn<JournalEntry>[] = [
    {
      title: "Entry No.",
      data: "entryNo",
      render: (_: any, row: JournalEntry) => <span className="font-mono text-xs font-bold text-stsn-brown">{row.entryNo}</span>,
      width: "165px",
    },
    {
      title: "Date",
      data: "entryDate",
      render: (_: any, row: JournalEntry) => (
        <div>
          <span className="font-mono text-xs text-stone-700">{row.entryDate}</span>
          <p className="text-[10px] text-stone-400 mt-0.5">{row.fiscalPeriod}</p>
        </div>
      ),
      width: "120px",
    },
    {
      title: "Description",
      data: "description",
      render: (_: any, row: JournalEntry) => (
        <div>
          <span className="text-xs font-semibold text-stone-800">{row.description || <span className="font-normal text-stone-300">—</span>}</span>
          {row.referenceNo && <p className="text-[10px] font-mono text-stone-400 mt-0.5">Ref: {row.referenceNo}</p>}
        </div>
      ),
    },
    {
      title: "Total Dr. (₱)",
      data: "id",
      className: "text-right",
      render: (_: any, row: JournalEntry) => {
        const { dr } = entryTotals(row.id);
        return <span className="font-mono text-xs font-bold text-red-600">{dr > 0 ? fmt(dr) : "—"}</span>;
      },
      width: "120px",
    },
    {
      title: "Total Cr. (₱)",
      data: "id",
      orderable: false,
      className: "text-right",
      render: (_: any, row: JournalEntry) => {
        const { cr } = entryTotals(row.id);
        return <span className="font-mono text-xs font-bold text-emerald-600">{cr > 0 ? fmt(cr) : "—"}</span>;
      },
      width: "120px",
    },
    {
      title: "Status",
      data: "status",
      className: "text-center",
      render: (_: any, row: JournalEntry) => {
        const cfg = STATUS_CONFIG[row.status];
        return <span className={`inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${cfg.badgeClass}`}>{cfg.label}</span>;
      },
      width: "90px",
    },
    {
      title: "",
      data: "id",
      orderable: false,
      searchable: false,
      render: (_: any, row: JournalEntry) => (
        <div className="flex items-center gap-1.5 justify-end">
          <button onClick={() => setViewEntry(row)} title="View entry" className="p-1 rounded-lg hover:bg-blue-50 text-stone-400 hover:text-blue-600 transition cursor-pointer">
            <Eye className="w-3.5 h-3.5" />
          </button>
          {row.status === "Draft" && (
            <>
              <button onClick={() => openEdit(row)} title="Edit entry" className="p-1 rounded-lg hover:bg-amber-50 text-stone-400 hover:text-amber-600 transition cursor-pointer">
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => handleDelete(row)} title="Delete draft" className="p-1 rounded-lg hover:bg-rose-50 text-stone-400 hover:text-rose-500 transition cursor-pointer">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          {row.status === "Posted" && (
            <button onClick={() => { setVoidModal(row); setVoidReason(""); }} title="Void entry" className="p-1 rounded-lg hover:bg-rose-50 text-stone-400 hover:text-rose-500 transition cursor-pointer">
              <Ban className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
      width: "100px",
    },
  ];

  // ── Detail (view) line columns ────────────────────────────────────────────
  const lineColumns: STSNColumn<JournalEntryLine>[] = [
    {
      title: "#",
      data: "lineNo",
      render: (v: any) => <span className="font-mono text-xs text-stone-500">{v}</span>,
      width: "44px",
    },
    {
      title: "Account",
      data: "accountCode",
      render: (_: any, row: JournalEntryLine) => {
        const acct = accounts.find((a) => a.code === row.accountCode);
        return (
          <div>
            <span className="font-mono text-xs font-bold text-stone-700">{row.accountCode}</span>
            {acct && <p className="text-[10px] text-stone-500 mt-0.5">{acct.name}</p>}
          </div>
        );
      },
    },
    {
      title: "Description",
      data: "description",
      render: (v: any) => <span className="text-xs text-stone-600">{v || "—"}</span>,
    },
    {
      title: "Debit (₱)",
      data: "debitAmount",
      className: "text-right",
      render: (v: any) => <span className="font-mono text-xs font-bold text-red-600">{Number(v) > 0 ? fmt(Number(v)) : "—"}</span>,
      width: "120px",
    },
    {
      title: "Credit (₱)",
      data: "creditAmount",
      className: "text-right",
      render: (v: any) => <span className="font-mono text-xs font-bold text-emerald-600">{Number(v) > 0 ? fmt(Number(v)) : "—"}</span>,
      width: "120px",
    },
  ];

  const viewLines = useMemo(
    () => viewEntry ? linesFor(viewEntry.id).sort((a, b) => a.lineNo - b.lineNo) : [],
    [viewEntry, allLines],
  );
  const viewTotals = useMemo(() => ({
    dr: viewLines.reduce((s, l) => s + l.debitAmount, 0),
    cr: viewLines.reduce((s, l) => s + l.creditAmount, 0),
  }), [viewLines]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 animate-fade-in font-sans">

      {/* Page header */}
      <div className="p-5 bg-white border border-stsn-beige rounded-xl shadow-sm flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-semibold text-stone-900 tracking-tight flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-stsn-brown" />
            Journal Entries
          </h2>
          <p className="text-stone-500 text-xs mt-1">
            Double-entry bookkeeping postings referencing the Chart of Accounts and Cost Centers.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-stsn-brown text-white text-xs font-bold rounded-xl hover:bg-stsn-brown-dark transition shadow-sm cursor-pointer flex-shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          New Entry
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-stone-200 rounded-xl px-4 py-3 text-center shadow-sm">
          <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400">Total</p>
          <p className="text-xl font-bold text-stone-800 mt-0.5">{stats.total}</p>
          <p className="text-[9px] text-stone-400">Entries</p>
        </div>
        <div className="bg-white border border-amber-200 rounded-xl px-4 py-3 text-center shadow-sm">
          <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400">Draft</p>
          <p className="text-xl font-bold text-amber-600 mt-0.5">{stats.draft}</p>
          <p className="text-[9px] text-stone-400">Entries</p>
        </div>
        <div className="bg-white border border-emerald-200 rounded-xl px-4 py-3 text-center shadow-sm">
          <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400">Posted</p>
          <p className="text-xl font-bold text-emerald-600 mt-0.5">{stats.posted}</p>
          <p className="text-[9px] text-stone-400">Entries</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl px-4 py-3 text-center shadow-sm">
          <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400">Void</p>
          <p className="text-xl font-bold text-stone-400 mt-0.5">{stats.void}</p>
          <p className="text-[9px] text-stone-400">Entries</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-stsn-beige rounded-xl px-4 py-3 shadow-sm flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by entry no., description, reference…"
            className="w-full pl-8 pr-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-stone-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as JEStatus | "All")}
            className="text-xs border border-stone-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-stsn-gold/50"
          >
            <option value="All">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Posted">Posted</option>
            <option value="Void">Void</option>
          </select>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 text-xs text-stone-500 hover:text-stone-700 border border-stone-200 rounded-lg hover:bg-stone-50 transition cursor-pointer">
          <Download className="w-3.5 h-3.5" />
          Export
        </button>
      </div>

      {/* Main table */}
      <div className="bg-white border border-stsn-beige rounded-xl shadow-sm overflow-hidden p-1">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-stone-400 text-xs">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading journal entries…
          </div>
        ) : (
          <STSNDataTable
            columns={columns}
            rows={filtered}
            searchable={false}
            emptyMessage="No journal entries match your search."
            pageLength={10}
          />
        )}
      </div>

      {/* ── View / Detail Modal ──────────────────────────────────────────── */}
      {viewEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl border border-stone-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between gap-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="text-sm font-bold text-stone-800">{viewEntry.entryNo}</h3>
                  <p className="text-[10px] text-stone-400 mt-0.5">{viewEntry.entryDate} · {viewEntry.fiscalPeriod} · {viewEntry.fiscalYear}</p>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${STATUS_CONFIG[viewEntry.status].badgeClass}`}>
                  {STATUS_CONFIG[viewEntry.status].label}
                </span>
              </div>
              <button onClick={() => setViewEntry(null)} className="text-stone-400 hover:text-stone-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-0.5">Description</p>
                  <p className="text-stone-800">{viewEntry.description || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-0.5">Reference No.</p>
                  <p className="font-mono text-stone-700">{viewEntry.referenceNo || "—"}</p>
                </div>
                {viewEntry.status === "Void" && viewEntry.voidReason && (
                  <div className="col-span-2 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-rose-500 mb-0.5">Void Reason</p>
                    <p className="text-rose-700 text-xs">{viewEntry.voidReason}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2">Journal Lines</p>
                <div className="border border-stone-200 rounded-xl overflow-hidden">
                  <STSNDataTable
                    columns={lineColumns}
                    rows={viewLines}
                    searchable={false}
                    emptyMessage="No lines recorded."
                    pageLength={10}
                  />
                </div>
                <div className="flex justify-end gap-6 mt-3 text-xs font-mono pr-1">
                  <span className="text-stone-500">Total Debit: <strong className="text-red-600">₱{fmt(viewTotals.dr)}</strong></span>
                  <span className="text-stone-500">Total Credit: <strong className="text-emerald-600">₱{fmt(viewTotals.cr)}</strong></span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-stone-100 flex justify-between items-center flex-shrink-0 gap-2">
              <p className="text-[10px] text-stone-400">
                Created by <strong>{viewEntry.createdBy}</strong>
                {viewEntry.postedBy && <> · Posted by <strong>{viewEntry.postedBy}</strong></>}
                {viewEntry.voidedBy && <> · Voided by <strong>{viewEntry.voidedBy}</strong></>}
              </p>
              <div className="flex gap-2">
                {viewEntry.status === "Draft" && (
                  <>
                    <button
                      onClick={() => { setViewEntry(null); openEdit(viewEntry); }}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-amber-700 border border-amber-200 bg-amber-50 hover:bg-amber-100 rounded-xl transition cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handlePost(viewEntry)}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-sm cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" /> Post Entry
                    </button>
                  </>
                )}
                {viewEntry.status === "Posted" && (
                  <button
                    onClick={() => { setVoidModal(viewEntry); setVoidReason(""); }}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 border border-rose-200 bg-rose-50 hover:bg-rose-100 rounded-xl transition cursor-pointer"
                  >
                    <Ban className="w-3.5 h-3.5" /> Void Entry
                  </button>
                )}
                <button
                  onClick={() => setViewEntry(null)}
                  className="px-4 py-2 text-xs font-semibold text-stone-500 hover:text-stone-700 border border-stone-200 rounded-xl hover:bg-stone-50 transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit Modal ─────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl border border-stone-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between flex-shrink-0">
              <h3 className="text-sm font-bold text-stone-800">
                {editTarget ? `Edit — ${editTarget.entryNo}` : "New Journal Entry"}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-stone-400 hover:text-stone-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
              {/* Header fields */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Entry No. *</label>
                  <input
                    value={headerForm.entryNo}
                    onChange={(e) => setHeaderForm((f) => ({ ...f, entryNo: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Date *</label>
                  <input
                    type="date"
                    value={headerForm.entryDate}
                    onChange={(e) => {
                      const d = e.target.value;
                      setHeaderForm((f) => ({ ...f, entryDate: d, entryNo: editTarget ? f.entryNo : nextEntryNo(d) }));
                    }}
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Reference No.</label>
                  <input
                    value={headerForm.referenceNo}
                    onChange={(e) => setHeaderForm((f) => ({ ...f, referenceNo: e.target.value }))}
                    placeholder="e.g. OR-001234"
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50 font-mono"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Description</label>
                  <input
                    value={headerForm.description}
                    onChange={(e) => setHeaderForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="e.g. Tuition collection — June 2026"
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Cost Center</label>
                  <select
                    value={headerForm.costCenterId}
                    onChange={(e) => setHeaderForm((f) => ({ ...f, costCenterId: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50"
                  >
                    <option value="">— None —</option>
                    {activeCostCenters.map((cc) => (
                      <option key={cc.id} value={cc.id}>{cc.code} — {cc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Derived fiscal info */}
              <div className="flex gap-4 text-[11px] font-mono text-stone-500 bg-stone-50 border border-stone-100 rounded-lg px-4 py-2">
                <span>Fiscal Year: <strong className="text-stone-700">{fiscalYearFromDate(headerForm.entryDate)}</strong></span>
                <span>Period: <strong className="text-stone-700">{fiscalPeriodFromDate(headerForm.entryDate)}</strong></span>
              </div>

              {/* Line items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Line Items</p>
                  <button onClick={addLine} className="flex items-center gap-1 text-[11px] font-bold text-stsn-brown hover:text-stsn-brown-dark cursor-pointer">
                    <Plus className="w-3 h-3" /> Add Line
                  </button>
                </div>

                <div className="border border-stone-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-stone-50 border-b border-stone-200">
                      <tr>
                        <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-stone-500 w-[28%]">Account</th>
                        <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-stone-500">Description</th>
                        <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-stone-500 w-[130px]">Cost Center</th>
                        <th className="text-right px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-stone-500 w-[110px]">Debit (₱)</th>
                        <th className="text-right px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-stone-500 w-[110px]">Credit (₱)</th>
                        <th className="w-[36px]"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {formLines.map((line) => (
                        <tr key={line.key} className="hover:bg-stone-50/50">
                          <td className="px-2 py-1.5">
                            <select
                              value={line.accountCode}
                              onChange={(e) => updateLine(line.key, { accountCode: e.target.value })}
                              className="w-full text-xs border border-stone-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-stsn-gold/50 font-mono"
                            >
                              <option value="">— Select —</option>
                              {postableAccounts.map((a) => (
                                <option key={a.code} value={a.code}>{a.code} — {a.name}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              value={line.description}
                              onChange={(e) => updateLine(line.key, { description: e.target.value })}
                              placeholder="Memo…"
                              className="w-full text-xs border border-stone-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-stsn-gold/50"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <select
                              value={line.costCenterId}
                              onChange={(e) => updateLine(line.key, { costCenterId: e.target.value })}
                              className="w-full text-xs border border-stone-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-stsn-gold/50"
                            >
                              <option value="">—</option>
                              {activeCostCenters.map((cc) => (
                                <option key={cc.id} value={cc.id}>{cc.code}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={line.debit}
                              onChange={(e) => updateLine(line.key, { debit: e.target.value, credit: e.target.value ? "" : line.credit })}
                              placeholder="0.00"
                              className="w-full text-xs border border-stone-200 rounded-lg px-2 py-1.5 text-right focus:outline-none focus:ring-1 focus:ring-stsn-gold/50 font-mono"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={line.credit}
                              onChange={(e) => updateLine(line.key, { credit: e.target.value, debit: e.target.value ? "" : line.debit })}
                              placeholder="0.00"
                              className="w-full text-xs border border-stone-200 rounded-lg px-2 py-1.5 text-right focus:outline-none focus:ring-1 focus:ring-stsn-gold/50 font-mono"
                            />
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            {formLines.length > 2 && (
                              <button onClick={() => removeLine(line.key)} className="text-stone-300 hover:text-rose-500 transition cursor-pointer">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-stone-50 border-t border-stone-200">
                      <tr>
                        <td colSpan={3} className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-stone-500">Totals</td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-red-600">
                          {formTotals.dr > 0 ? fmt(formTotals.dr) : "—"}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">
                          {formTotals.cr > 0 ? fmt(formTotals.cr) : "—"}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {(formTotals.dr > 0 || formTotals.cr > 0) && (
                  <div className={`mt-2 flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg ${formTotals.balanced ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"}`}>
                    {formTotals.balanced
                      ? <><CheckCircle className="w-3.5 h-3.5" /> Entry is balanced — debits equal credits.</>
                      : <><AlertTriangle className="w-3.5 h-3.5" /> Unbalanced — difference: ₱{fmt(Math.abs(formTotals.dr - formTotals.cr))}</>
                    }
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-stone-100 flex justify-between items-center flex-shrink-0 gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-xs font-semibold text-stone-500 hover:text-stone-700 border border-stone-200 rounded-xl hover:bg-stone-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSave(false)}
                  disabled={!headerForm.entryNo.trim() || !formTotals.balanced}
                  className="px-4 py-2 text-xs font-bold text-stsn-brown border border-stsn-brown/30 bg-stsn-cream hover:bg-amber-50 rounded-xl transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Save as Draft
                </button>
                <button
                  onClick={() => handleSave(true)}
                  disabled={!headerForm.entryNo.trim() || !formTotals.balanced}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" /> Save & Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Void Modal ───────────────────────────────────────────────────── */}
      {voidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-stone-200">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-rose-700 flex items-center gap-2">
                <Ban className="w-4 h-4" /> Void Journal Entry
              </h3>
              <button onClick={() => setVoidModal(null)} className="text-stone-400 hover:text-stone-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="bg-rose-50 border border-rose-200 rounded-lg px-4 py-3 text-xs text-rose-700">
                You are about to void <strong>{voidModal.entryNo}</strong>. This action is irreversible.
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Void Reason *</label>
                <textarea
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  rows={3}
                  placeholder="Explain why this entry is being voided…"
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-300 resize-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-stone-100 flex justify-end gap-2">
              <button
                onClick={() => setVoidModal(null)}
                className="px-4 py-2 text-xs font-semibold text-stone-500 hover:text-stone-700 border border-stone-200 rounded-xl hover:bg-stone-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleVoid}
                disabled={!voidReason.trim()}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Ban className="w-3.5 h-3.5" /> Void Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

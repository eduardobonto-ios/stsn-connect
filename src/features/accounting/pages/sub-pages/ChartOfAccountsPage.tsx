import React, { useState, useMemo, useEffect } from "react";
import {
  List, Plus, Edit2, Trash2, Search, ChevronRight, ChevronDown,
  CheckCircle, XCircle, Filter, Download, Loader2
} from "lucide-react";
import STSNDataTable, { type STSNColumn } from "../../../../components/common/STSNDataTable";
import { useAppDialog } from "../../../../components/common/useAppDialog";
import { dbInsert, dbUpdate, dbDelete, dbSelectAll, newId } from "../../../../services/supabaseCrud";

// ─── Types ───────────────────────────────────────────────────────────────────

type AccountType = "Asset" | "Liability" | "Equity" | "Revenue" | "Expense";
type NormalBalance = "Debit" | "Credit";
type AccountStatus = "Active" | "Inactive";

interface ChartAccount {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  normalBalance: NormalBalance;
  parentCode: string | null;
  description: string;
  status: AccountStatus;
  isHeader: boolean;
}

// ─── DB row → app type ────────────────────────────────────────────────────────

function rowToAccount(r: any): ChartAccount {
  return {
    id:            r.id,
    code:          r.code,
    name:          r.name,
    type:          r.type          as AccountType,
    normalBalance: r.normalBalance as NormalBalance,
    parentCode:    r.parentCode    ?? null,
    description:   r.description   ?? "",
    isHeader:      r.isHeader      ?? false,
    status:        r.status        as AccountStatus,
  };
}

// ─── Config ──────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<AccountType, { label: string; badgeClass: string; color: string }> = {
  Asset:     { label: "Asset",     badgeClass: "bg-blue-50 text-blue-700 border-blue-200",        color: "text-blue-700"   },
  Liability: { label: "Liability", badgeClass: "bg-rose-50 text-rose-700 border-rose-200",        color: "text-rose-700"   },
  Equity:    { label: "Equity",    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",  color: "text-purple-700" },
  Revenue:   { label: "Revenue",   badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200", color: "text-emerald-700" },
  Expense:   { label: "Expense",   badgeClass: "bg-amber-50 text-amber-700 border-amber-200",     color: "text-amber-700"  },
};

const ACCOUNT_TYPES: AccountType[] = ["Asset", "Liability", "Equity", "Revenue", "Expense"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getIndentLevel(accounts: ChartAccount[], account: ChartAccount): number {
  if (!account.parentCode) return 0;
  const parent = accounts.find((a) => a.code === account.parentCode);
  if (!parent) return 1;
  return 1 + getIndentLevel(accounts, parent);
}

const DEFAULT_FORM: Omit<ChartAccount, "id"> = {
  code: "",
  name: "",
  type: "Asset",
  normalBalance: "Debit",
  parentCode: null,
  description: "",
  status: "Active",
  isHeader: false,
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function ChartOfAccountsPage() {
  const { confirm, alert } = useAppDialog();
  const [accounts, setAccounts] = useState<ChartAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<AccountType | "All">("All");
  const [expandedCodes, setExpandedCodes] = useState<Set<string>>(new Set(["1000", "2000", "3000", "4000", "5000"]));
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<ChartAccount | null>(null);
  const [form, setForm] = useState<Omit<ChartAccount, "id">>(DEFAULT_FORM);

  useEffect(() => {
    dbSelectAll("chart_of_accounts").then((rows) => {
      setAccounts(rows.map(rowToAccount));
      setIsLoading(false);
    });
  }, []);

  const isSearching = search.trim().length > 0 || filterType !== "All";

  // Flat list for search/filter mode — sorted by code.
  const flatFiltered = useMemo(() => {
    if (!isSearching) return [];
    return accounts
      .filter((a) => {
        const matchesType = filterType === "All" || a.type === filterType;
        const q = search.toLowerCase();
        const matchesSearch = !q || a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q);
        return matchesType && matchesSearch;
      })
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [accounts, search, filterType, isSearching]);

  // Flat list that mirrors the tree order, filtered by expandedCodes.
  const treeRows = useMemo(() => {
    const result: ChartAccount[] = [];
    function addVisible(parentCode: string | null) {
      accounts
        .filter((a) => a.parentCode === parentCode)
        .sort((a, b) => a.code.localeCompare(b.code))
        .forEach((account) => {
          result.push(account);
          const hasChildren = accounts.some((a) => a.parentCode === account.code);
          if (hasChildren && expandedCodes.has(account.code)) addVisible(account.code);
        });
    }
    addVisible(null);
    return result;
  }, [accounts, expandedCodes]);

  function toggleExpand(code: string) {
    setExpandedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code); else next.add(code);
      return next;
    });
  }

  function openAdd(parentCode?: string) {
    const inferType = parentCode ? (accounts.find((a) => a.code === parentCode)?.type ?? "Asset") : "Asset";
    const inferNB: NormalBalance = inferType === "Asset" || inferType === "Expense" ? "Debit" : "Credit";
    setForm({ ...DEFAULT_FORM, parentCode: parentCode ?? null, type: inferType, normalBalance: inferNB });
    setEditTarget(null);
    setShowForm(true);
  }

  function openEdit(account: ChartAccount) {
    setForm({ code: account.code, name: account.name, type: account.type, normalBalance: account.normalBalance, parentCode: account.parentCode, description: account.description, status: account.status, isHeader: account.isHeader });
    setEditTarget(account);
    setShowForm(true);
  }

  function handleSave() {
    if (!form.code.trim() || !form.name.trim()) return;
    if (editTarget) {
      setAccounts((prev) => prev.map((a) => a.id === editTarget.id ? { ...a, ...form } : a));
      dbUpdate("chart_of_accounts", editTarget.id, form);
    } else {
      const id = newId();
      setAccounts((prev) => [...prev, { id, ...form }]);
      dbInsert("chart_of_accounts", { id, ...form });
      if (form.parentCode) setExpandedCodes((prev) => new Set([...prev, form.parentCode!]));
    }
    setShowForm(false);
  }

  async function handleDelete(id: string) {
    const target = accounts.find((a) => a.id === id);
    if (!target) return;
    const hasChildren = accounts.some((a) => a.parentCode === target.code);
    if (hasChildren) {
      await alert("Remove child accounts first before deleting this header.", { variant: "warning" });
      return;
    }
    if (await confirm(`Delete account "${target.code} — ${target.name}"?`, { variant: "danger" })) {
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      dbDelete("chart_of_accounts", id);
    }
  }

  const stats = useMemo(() => {
    const byType = ACCOUNT_TYPES.reduce((m, t) => { m[t] = accounts.filter((a) => a.type === t && !a.isHeader).length; return m; }, {} as Record<AccountType, number>);
    return { total: accounts.filter((a) => !a.isHeader).length, byType };
  }, [accounts]);

  // Tree-mode columns — sorting disabled on all (would break hierarchy).
  const treeColumns: STSNColumn<ChartAccount>[] = [
    {
      title: "Code",
      data: "code",
      orderable: false,
      render: (_: any, row: ChartAccount) => {
        const hasChildren = accounts.some((a) => a.parentCode === row.code);
        const isExpanded = expandedCodes.has(row.code);
        const indent = getIndentLevel(accounts, row) * 20;
        return (
          <div className="flex items-center gap-2" style={{ paddingLeft: indent }}>
            {hasChildren ? (
              <button onClick={() => toggleExpand(row.code)} className="w-5 h-5 flex items-center justify-center text-stone-400 hover:text-stone-600 flex-shrink-0 cursor-pointer">
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            ) : (
              <span className="w-5 h-5 flex-shrink-0" />
            )}
            <span className={`font-mono text-xs ${row.isHeader ? "font-bold text-stone-700" : "text-stone-500"}`}>{row.code}</span>
          </div>
        );
      },
      width: "170px",
    },
    {
      title: "Account Name",
      data: "name",
      orderable: false,
      render: (_: any, row: ChartAccount) => (
        <div>
          <span className={`text-xs ${row.isHeader ? "font-bold text-stone-800" : "text-stone-700"}`}>{row.name}</span>
          {row.description && !row.isHeader && (
            <p className="text-[10px] text-stone-400 mt-0.5">{row.description}</p>
          )}
        </div>
      ),
    },
    {
      title: "Type",
      data: "type",
      orderable: false,
      render: (_: any, row: ChartAccount) => {
        if (row.isHeader) return <span />;
        const typeCfg = TYPE_CONFIG[row.type];
        return (
          <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${typeCfg.badgeClass}`}>
            {typeCfg.label}
          </span>
        );
      },
      width: "100px",
    },
    {
      title: "Normal Bal.",
      data: "normalBalance",
      className: "text-center",
      orderable: false,
      render: (_: any, row: ChartAccount) => {
        if (row.isHeader) return <span />;
        return (
          <span className={`text-[10px] font-mono font-semibold ${row.normalBalance === "Debit" ? "text-blue-600" : "text-rose-600"}`}>
            {row.normalBalance}
          </span>
        );
      },
      width: "100px",
    },
    {
      title: "Active",
      data: "status",
      className: "text-center",
      orderable: false,
      render: (_: any, row: ChartAccount) => {
        if (row.isHeader) return <span />;
        return row.status === "Active"
          ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 inline-block" />
          : <XCircle className="w-3.5 h-3.5 text-stone-300 inline-block" />;
      },
      width: "70px",
    },
    {
      title: "",
      data: "id",
      orderable: false,
      searchable: false,
      render: (_: any, row: ChartAccount) => (
        <div className="flex items-center gap-1.5 justify-end">
          <button onClick={() => openAdd(row.code)} title="Add child account" className="p-1 rounded-lg hover:bg-emerald-50 text-stone-400 hover:text-emerald-600 transition cursor-pointer">
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => openEdit(row)} title="Edit account" className="p-1 rounded-lg hover:bg-amber-50 text-stone-400 hover:text-amber-600 transition cursor-pointer">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          {!row.isHeader && (
            <button onClick={() => handleDelete(row.id)} title="Delete account" className="p-1 rounded-lg hover:bg-rose-50 text-stone-400 hover:text-rose-500 transition cursor-pointer">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
      width: "90px",
    },
  ];

  // Search/filter-mode columns — sorting enabled.
  const flatColumns: STSNColumn<ChartAccount>[] = [
    {
      title: "Code",
      data: "code",
      render: (_: any, row: ChartAccount) => (
        <span className={`font-mono text-xs ${row.isHeader ? "font-bold text-stone-700" : "text-stone-500"}`}>
          {row.code}
        </span>
      ),
      width: "130px",
    },
    {
      title: "Account Name",
      data: "name",
      render: (_: any, row: ChartAccount) => (
        <div>
          <span className={`text-xs ${row.isHeader ? "font-bold text-stone-800" : "text-stone-700"}`}>{row.name}</span>
          {row.description && !row.isHeader && (
            <p className="text-[10px] text-stone-400 mt-0.5">{row.description}</p>
          )}
        </div>
      ),
    },
    {
      title: "Type",
      data: "type",
      render: (_: any, row: ChartAccount) => {
        if (row.isHeader) return <span />;
        const typeCfg = TYPE_CONFIG[row.type];
        return (
          <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${typeCfg.badgeClass}`}>
            {typeCfg.label}
          </span>
        );
      },
      width: "100px",
    },
    {
      title: "Normal Bal.",
      data: "normalBalance",
      className: "text-center",
      render: (_: any, row: ChartAccount) => {
        if (row.isHeader) return <span />;
        return (
          <span className={`text-[10px] font-mono font-semibold ${row.normalBalance === "Debit" ? "text-blue-600" : "text-rose-600"}`}>
            {row.normalBalance}
          </span>
        );
      },
      width: "100px",
    },
    {
      title: "Active",
      data: "status",
      className: "text-center",
      orderable: false,
      render: (_: any, row: ChartAccount) => {
        if (row.isHeader) return <span />;
        return row.status === "Active"
          ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 inline-block" />
          : <XCircle className="w-3.5 h-3.5 text-stone-300 inline-block" />;
      },
      width: "70px",
    },
    {
      title: "",
      data: "id",
      orderable: false,
      searchable: false,
      render: (_: any, row: ChartAccount) => (
        <div className="flex items-center gap-1.5 justify-end">
          <button onClick={() => openEdit(row)} title="Edit account" className="p-1 rounded-lg hover:bg-amber-50 text-stone-400 hover:text-amber-600 transition cursor-pointer">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          {!row.isHeader && (
            <button onClick={() => handleDelete(row.id)} title="Delete account" className="p-1 rounded-lg hover:bg-rose-50 text-stone-400 hover:text-rose-500 transition cursor-pointer">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
      width: "80px",
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in font-sans">
      {/* Header */}
      <div className="p-5 bg-white border border-stsn-beige rounded-xl shadow-sm flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-semibold text-stone-900 tracking-tight flex items-center gap-2">
            <List className="w-5 h-5 text-stsn-brown" />
            Chart of Accounts
          </h2>
          <p className="text-stone-500 text-xs mt-1">
            General Ledger account codes and hierarchy. All Journal Entries, Invoices, and Financial Reports reference these accounts.
          </p>
        </div>
        <button
          onClick={() => openAdd()}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-stsn-brown text-white text-xs font-bold rounded-xl hover:bg-stsn-brown-dark transition shadow-sm cursor-pointer flex-shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          New Account
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-stone-200 rounded-xl px-4 py-3 text-center shadow-sm">
          <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400">Total</p>
          <p className="text-xl font-bold text-stone-800 mt-0.5">{stats.total}</p>
          <p className="text-[9px] text-stone-400">Accounts</p>
        </div>
        {ACCOUNT_TYPES.map((t) => {
          const cfg = TYPE_CONFIG[t];
          return (
            <div key={t} className="bg-white border border-stone-200 rounded-xl px-4 py-3 text-center shadow-sm">
              <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400">{t}</p>
              <p className={`text-xl font-bold mt-0.5 ${cfg.color}`}>{stats.byType[t]}</p>
              <p className="text-[9px] text-stone-400">Accounts</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white border border-stsn-beige rounded-xl px-4 py-3 shadow-sm flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code or name…"
            className="w-full pl-8 pr-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-stone-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as AccountType | "All")}
            className="text-xs border border-stone-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-stsn-gold/50"
          >
            <option value="All">All Types</option>
            {ACCOUNT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 text-xs text-stone-500 hover:text-stone-700 border border-stone-200 rounded-lg hover:bg-stone-50 transition cursor-pointer">
          <Download className="w-3.5 h-3.5" />
          Export
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-stsn-beige rounded-xl shadow-sm overflow-hidden p-1">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-stone-400 text-xs">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading accounts…
          </div>
        ) : (
        <STSNDataTable
          columns={isSearching ? flatColumns : treeColumns}
          rows={isSearching ? flatFiltered : treeRows}
          searchable={false}
          emptyMessage={isSearching ? "No accounts match your search." : "No accounts found."}
          pageLength={50}
        />
        )}
      </div>

      {/* Add / Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-stone-200">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-800">{editTarget ? "Edit Account" : "New Account"}</h3>
              <button onClick={() => setShowForm(false)} className="text-stone-400 hover:text-stone-600 text-xs font-bold cursor-pointer">✕ Cancel</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Account Code *</label>
                  <input
                    value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                    placeholder="e.g. 1110"
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Account Type *</label>
                  <select
                    value={form.type}
                    onChange={(e) => {
                      const t = e.target.value as AccountType;
                      const nb: NormalBalance = t === "Asset" || t === "Expense" ? "Debit" : "Credit";
                      setForm((f) => ({ ...f, type: t, normalBalance: nb }));
                    }}
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50"
                  >
                    {ACCOUNT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Account Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Cash on Hand"
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Normal Balance</label>
                  <select
                    value={form.normalBalance}
                    onChange={(e) => setForm((f) => ({ ...f, normalBalance: e.target.value as NormalBalance }))}
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50"
                  >
                    <option value="Debit">Debit</option>
                    <option value="Credit">Credit</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Parent Account</label>
                  <select
                    value={form.parentCode ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, parentCode: e.target.value || null }))}
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50"
                  >
                    <option value="">— None (Root) —</option>
                    {accounts.filter((a) => a.isHeader).map((a) => (
                      <option key={a.id} value={a.code}>{a.code} — {a.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Description</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Short description of this account"
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50"
                />
              </div>

              <div className="flex items-center gap-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isHeader} onChange={(e) => setForm((f) => ({ ...f, isHeader: e.target.checked }))} className="rounded" />
                  <span className="text-xs text-stone-600 font-medium">Header / Group account</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.status === "Active"}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.checked ? "Active" : "Inactive" }))}
                    className="rounded"
                  />
                  <span className="text-xs text-stone-600 font-medium">Active</span>
                </label>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-stone-100 flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-xs font-semibold text-stone-500 hover:text-stone-700 border border-stone-200 rounded-xl hover:bg-stone-50 transition cursor-pointer">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!form.code.trim() || !form.name.trim()}
                className="px-4 py-2 text-xs font-bold text-white bg-stsn-brown hover:bg-stsn-brown-dark rounded-xl transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {editTarget ? "Save Changes" : "Add Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

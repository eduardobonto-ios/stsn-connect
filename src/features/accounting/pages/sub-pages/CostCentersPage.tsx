import React, { useState, useMemo, useEffect } from "react";
import {
  Building2, Plus, Edit2, Trash2, Search, Filter, Download,
  CheckCircle, XCircle, Loader2
} from "lucide-react";
import STSNDataTable, { type STSNColumn } from "../../../../components/common/STSNDataTable";
import { useAppDialog } from "../../../../components/common/useAppDialog";
import { dbInsert, dbUpdate, dbDelete, dbSelectAll, newId } from "../../../../services/supabaseCrud";

// ─── Types ───────────────────────────────────────────────────────────────────

type CostCenterType = "Department" | "Program" | "Project" | "Administrative";
type CostCenterStatus = "Active" | "Inactive";

interface CostCenter {
  id: string;
  code: string;
  name: string;
  type: CostCenterType;
  description: string;
  glAccountCode: string | null;
  status: CostCenterStatus;
}

// ─── DB row → app type ────────────────────────────────────────────────────────

function rowToCostCenter(r: any): CostCenter {
  return {
    id:            r.id,
    code:          r.code,
    name:          r.name,
    type:          r.type          as CostCenterType,
    description:   r.description   ?? "",
    glAccountCode: r.glAccountCode ?? null,
    status:        r.status        as CostCenterStatus,
  };
}

// ─── Config ──────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<CostCenterType, { label: string; badgeClass: string; color: string }> = {
  Department:     { label: "Department",     badgeClass: "bg-blue-50 text-blue-700 border-blue-200",     color: "text-blue-700"   },
  Program:        { label: "Program",        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200", color: "text-emerald-700" },
  Project:        { label: "Project",        badgeClass: "bg-purple-50 text-purple-700 border-purple-200",  color: "text-purple-700" },
  Administrative: { label: "Administrative", badgeClass: "bg-amber-50 text-amber-700 border-amber-200",   color: "text-amber-700"  },
};

const COST_CENTER_TYPES: CostCenterType[] = ["Department", "Program", "Project", "Administrative"];

const DEFAULT_FORM: Omit<CostCenter, "id"> = {
  code: "",
  name: "",
  type: "Department",
  description: "",
  glAccountCode: null,
  status: "Active",
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function CostCentersPage() {
  const { confirm } = useAppDialog();
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<CostCenterType | "All">("All");
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<CostCenter | null>(null);
  const [form, setForm] = useState<Omit<CostCenter, "id">>(DEFAULT_FORM);

  useEffect(() => {
    dbSelectAll("cost_centers").then((rows) => {
      setCostCenters(rows.map(rowToCostCenter));
      setIsLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    return costCenters
      .filter((cc) => {
        const matchesType = filterType === "All" || cc.type === filterType;
        const q = search.toLowerCase();
        const matchesSearch =
          !q ||
          cc.code.toLowerCase().includes(q) ||
          cc.name.toLowerCase().includes(q) ||
          cc.description.toLowerCase().includes(q);
        return matchesType && matchesSearch;
      })
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [costCenters, search, filterType]);

  function openAdd() {
    setForm(DEFAULT_FORM);
    setEditTarget(null);
    setShowForm(true);
  }

  function openEdit(cc: CostCenter) {
    setForm({
      code: cc.code, name: cc.name, type: cc.type,
      description: cc.description, glAccountCode: cc.glAccountCode, status: cc.status,
    });
    setEditTarget(cc);
    setShowForm(true);
  }

  function handleSave() {
    if (!form.code.trim() || !form.name.trim()) return;
    if (editTarget) {
      setCostCenters((prev) => prev.map((cc) => cc.id === editTarget.id ? { ...cc, ...form } : cc));
      dbUpdate("cost_centers", editTarget.id, form);
    } else {
      const id = newId();
      setCostCenters((prev) => [...prev, { id, ...form }]);
      dbInsert("cost_centers", { id, ...form });
    }
    setShowForm(false);
  }

  async function handleDelete(id: string) {
    const target = costCenters.find((cc) => cc.id === id);
    if (!target) return;
    if (await confirm(`Delete cost center "${target.code} — ${target.name}"?`, { variant: "danger" })) {
      setCostCenters((prev) => prev.filter((cc) => cc.id !== id));
      dbDelete("cost_centers", id);
    }
  }

  const stats = useMemo(() => {
    const byType = COST_CENTER_TYPES.reduce((m, t) => {
      m[t] = costCenters.filter((cc) => cc.type === t).length;
      return m;
    }, {} as Record<CostCenterType, number>);
    return {
      total: costCenters.length,
      active: costCenters.filter((cc) => cc.status === "Active").length,
      byType,
    };
  }, [costCenters]);

  const columns: STSNColumn<CostCenter>[] = [
    {
      title: "Code",
      data: "code",
      render: (_: any, row: CostCenter) => (
        <span className="font-mono text-xs font-semibold text-stone-700">{row.code}</span>
      ),
      width: "110px",
    },
    {
      title: "Name",
      data: "name",
      render: (_: any, row: CostCenter) => (
        <div>
          <span className="text-xs font-semibold text-stone-800">{row.name}</span>
          {row.description && (
            <p className="text-[10px] text-stone-400 mt-0.5">{row.description}</p>
          )}
        </div>
      ),
    },
    {
      title: "Type",
      data: "type",
      render: (_: any, row: CostCenter) => {
        const cfg = TYPE_CONFIG[row.type];
        return (
          <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.badgeClass}`}>
            {cfg.label}
          </span>
        );
      },
      width: "120px",
    },
    {
      title: "GL Account",
      data: "glAccountCode",
      render: (_: any, row: CostCenter) =>
        row.glAccountCode
          ? <span className="font-mono text-xs text-stone-600">{row.glAccountCode}</span>
          : <span className="text-[10px] text-stone-300">—</span>,
      width: "110px",
    },
    {
      title: "Active",
      data: "status",
      className: "text-center",
      orderable: false,
      render: (_: any, row: CostCenter) =>
        row.status === "Active"
          ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 inline-block" />
          : <XCircle className="w-3.5 h-3.5 text-stone-300 inline-block" />,
      width: "70px",
    },
    {
      title: "",
      data: "id",
      orderable: false,
      searchable: false,
      render: (_: any, row: CostCenter) => (
        <div className="flex items-center gap-1.5 justify-end">
          <button
            onClick={() => openEdit(row)}
            title="Edit cost center"
            className="p-1 rounded-lg hover:bg-amber-50 text-stone-400 hover:text-amber-600 transition cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            title="Delete cost center"
            className="p-1 rounded-lg hover:bg-rose-50 text-stone-400 hover:text-rose-500 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
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
            <Building2 className="w-5 h-5 text-stsn-brown" />
            Cost Centers
          </h2>
          <p className="text-stone-500 text-xs mt-1">
            Departmental and unit segments used to classify and track costs in Journal Entries and Financial Reports.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-stsn-brown text-white text-xs font-bold rounded-xl hover:bg-stsn-brown-dark transition shadow-sm cursor-pointer flex-shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          New Cost Center
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-stone-200 rounded-xl px-4 py-3 text-center shadow-sm">
          <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400">Total</p>
          <p className="text-xl font-bold text-stone-800 mt-0.5">{stats.total}</p>
          <p className="text-[9px] text-stone-400">Cost Centers</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl px-4 py-3 text-center shadow-sm">
          <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400">Active</p>
          <p className="text-xl font-bold text-emerald-600 mt-0.5">{stats.active}</p>
          <p className="text-[9px] text-stone-400">Cost Centers</p>
        </div>
        {COST_CENTER_TYPES.map((t) => {
          const cfg = TYPE_CONFIG[t];
          return (
            <div key={t} className="bg-white border border-stone-200 rounded-xl px-4 py-3 text-center shadow-sm">
              <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400">{t}</p>
              <p className={`text-xl font-bold mt-0.5 ${cfg.color}`}>{stats.byType[t]}</p>
              <p className="text-[9px] text-stone-400">Cost Centers</p>
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
            onChange={(e) => setFilterType(e.target.value as CostCenterType | "All")}
            className="text-xs border border-stone-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-stsn-gold/50"
          >
            <option value="All">All Types</option>
            {COST_CENTER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
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
            Loading cost centers…
          </div>
        ) : (
          <STSNDataTable
            columns={columns}
            rows={filtered}
            searchable={false}
            emptyMessage="No cost centers match your search."
            pageLength={15}
          />
        )}
      </div>

      {/* Add / Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-stone-200">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-800">
                {editTarget ? "Edit Cost Center" : "New Cost Center"}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-stone-400 hover:text-stone-600 text-xs font-bold cursor-pointer">
                ✕ Cancel
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Code *</label>
                  <input
                    value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                    placeholder="e.g. CC-1000"
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Type *</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as CostCenterType }))}
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50"
                  >
                    {COST_CENTER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Basic Education Department"
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Description</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Short description of this cost center"
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Linked GL Account Code</label>
                <input
                  value={form.glAccountCode ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, glAccountCode: e.target.value || null }))}
                  placeholder="e.g. 4110 (optional)"
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50 font-mono"
                />
              </div>

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

            <div className="px-6 py-4 border-t border-stone-100 flex justify-end gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-xs font-semibold text-stone-500 hover:text-stone-700 border border-stone-200 rounded-xl hover:bg-stone-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!form.code.trim() || !form.name.trim()}
                className="px-4 py-2 text-xs font-bold text-white bg-stsn-brown hover:bg-stsn-brown-dark rounded-xl transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {editTarget ? "Save Changes" : "Add Cost Center"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

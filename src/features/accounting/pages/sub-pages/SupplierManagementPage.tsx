import React, { useEffect, useMemo, useState } from "react";
import {
  Truck, Plus, Edit2, Trash2, Search, Filter, Download,
  Loader2, X, Mail, Phone,
} from "lucide-react";
import STSNDataTable, { type STSNColumn } from "../../../../components/common/STSNDataTable";
import { useAppDialog } from "../../../../components/common/useAppDialog";
import { dbDelete, dbInsert, dbSelectAll, dbUpdate, newId } from "../../../../services/supabaseCrud";

type SupplierStatus = "Active" | "Inactive" | "Blocked";

interface Supplier {
  id: string;
  supplierCode: string;
  name: string;
  tin: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  paymentTerms: string;
  defaultGlAccountCode: string | null;
  status: SupplierStatus;
  notes: string;
}

interface ChartAccount {
  id: string;
  code: string;
  name: string;
  type: string;
  isHeader: boolean;
  status: string;
}

function rowToSupplier(r: any): Supplier {
  return {
    id: r.id,
    supplierCode: r.supplierCode ?? "",
    name: r.name ?? "",
    tin: r.tin ?? "",
    contactPerson: r.contactPerson ?? "",
    email: r.email ?? "",
    phone: r.phone ?? "",
    address: r.address ?? "",
    paymentTerms: r.paymentTerms ?? "Due on Receipt",
    defaultGlAccountCode: r.defaultGlAccountCode ?? null,
    status: (r.status ?? "Active") as SupplierStatus,
    notes: r.notes ?? "",
  };
}

const SUPPLIER_STATUSES: SupplierStatus[] = ["Active", "Inactive", "Blocked"];

const STATUS_CONFIG: Record<SupplierStatus, { label: string; badgeClass: string }> = {
  Active: { label: "Active", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  Inactive: { label: "Inactive", badgeClass: "bg-stone-100 text-stone-500 border-stone-200" },
  Blocked: { label: "Blocked", badgeClass: "bg-rose-50 text-rose-700 border-rose-200" },
};

const DEFAULT_FORM: Omit<Supplier, "id"> = {
  supplierCode: "",
  name: "",
  tin: "",
  contactPerson: "",
  email: "",
  phone: "",
  address: "",
  paymentTerms: "Due on Receipt",
  defaultGlAccountCode: null,
  status: "Active",
  notes: "",
};

export default function SupplierManagementPage() {
  const { confirm } = useAppDialog();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [accounts, setAccounts] = useState<ChartAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<SupplierStatus | "All">("All");
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Supplier | null>(null);
  const [form, setForm] = useState<Omit<Supplier, "id">>(DEFAULT_FORM);

  useEffect(() => {
    Promise.all([
      dbSelectAll("suppliers"),
      dbSelectAll("chart_of_accounts"),
    ]).then(([supplierRows, accountRows]) => {
      setSuppliers(supplierRows.map(rowToSupplier));
      setAccounts(accountRows as ChartAccount[]);
      setIsLoading(false);
    });
  }, []);

  const postableAccounts = useMemo(
    () => accounts
      .filter((account) => !account.isHeader && account.status === "Active")
      .sort((a, b) => a.code.localeCompare(b.code)),
    [accounts],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return suppliers
      .filter((supplier) => {
        const matchesStatus = filterStatus === "All" || supplier.status === filterStatus;
        const matchesSearch =
          !q ||
          supplier.supplierCode.toLowerCase().includes(q) ||
          supplier.name.toLowerCase().includes(q) ||
          supplier.tin.toLowerCase().includes(q) ||
          supplier.contactPerson.toLowerCase().includes(q) ||
          supplier.email.toLowerCase().includes(q) ||
          supplier.phone.toLowerCase().includes(q);
        return matchesStatus && matchesSearch;
      })
      .sort((a, b) => a.supplierCode.localeCompare(b.supplierCode));
  }, [suppliers, search, filterStatus]);

  const stats = useMemo(() => ({
    total: suppliers.length,
    active: suppliers.filter((supplier) => supplier.status === "Active").length,
    inactive: suppliers.filter((supplier) => supplier.status === "Inactive").length,
    blocked: suppliers.filter((supplier) => supplier.status === "Blocked").length,
  }), [suppliers]);

  function openAdd() {
    setForm(DEFAULT_FORM);
    setEditTarget(null);
    setShowForm(true);
  }

  function openEdit(supplier: Supplier) {
    setForm({
      supplierCode: supplier.supplierCode,
      name: supplier.name,
      tin: supplier.tin,
      contactPerson: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      paymentTerms: supplier.paymentTerms,
      defaultGlAccountCode: supplier.defaultGlAccountCode,
      status: supplier.status,
      notes: supplier.notes,
    });
    setEditTarget(supplier);
    setShowForm(true);
  }

  function handleSave() {
    if (!form.supplierCode.trim() || !form.name.trim()) return;

    if (editTarget) {
      setSuppliers((prev) => prev.map((supplier) => (
        supplier.id === editTarget.id ? { ...supplier, ...form } : supplier
      )));
      dbUpdate("suppliers", editTarget.id, form);
    } else {
      const id = newId();
      setSuppliers((prev) => [...prev, { id, ...form }]);
      dbInsert("suppliers", { id, ...form });
    }

    setShowForm(false);
  }

  async function handleDelete(id: string) {
    const target = suppliers.find((supplier) => supplier.id === id);
    if (!target) return;

    if (await confirm(`Delete supplier "${target.supplierCode} — ${target.name}"?`, { variant: "danger" })) {
      setSuppliers((prev) => prev.filter((supplier) => supplier.id !== id));
      dbDelete("suppliers", id);
    }
  }

  const columns: STSNColumn<Supplier>[] = [
    {
      title: "Code",
      data: "supplierCode",
      render: (_: any, row: Supplier) => (
        <span className="font-mono text-xs font-semibold text-stone-700">{row.supplierCode}</span>
      ),
      width: "115px",
    },
    {
      title: "Supplier",
      data: "name",
      render: (_: any, row: Supplier) => (
        <div>
          <span className="text-xs font-semibold text-stone-800">{row.name}</span>
          <p className="text-[10px] text-stone-400 mt-0.5">
            {row.tin ? `TIN: ${row.tin}` : "No TIN recorded"}
          </p>
        </div>
      ),
    },
    {
      title: "Contact",
      data: "contactPerson",
      render: (_: any, row: Supplier) => (
        <div className="space-y-0.5">
          <p className="text-xs font-medium text-stone-700">{row.contactPerson || "—"}</p>
          {row.email && (
            <p className="text-[10px] text-stone-400 flex items-center gap-1">
              <Mail className="w-3 h-3" /> {row.email}
            </p>
          )}
          {row.phone && (
            <p className="text-[10px] text-stone-400 flex items-center gap-1">
              <Phone className="w-3 h-3" /> {row.phone}
            </p>
          )}
        </div>
      ),
    },
    {
      title: "Terms",
      data: "paymentTerms",
      render: (value: string) => (
        <span className="text-xs text-stone-600">{value || "Due on Receipt"}</span>
      ),
      width: "130px",
    },
    {
      title: "GL Account",
      data: "defaultGlAccountCode",
      render: (_: any, row: Supplier) =>
        row.defaultGlAccountCode
          ? <span className="font-mono text-xs text-stone-600">{row.defaultGlAccountCode}</span>
          : <span className="text-[10px] text-stone-300">—</span>,
      width: "115px",
    },
    {
      title: "Status",
      data: "status",
      render: (_: any, row: Supplier) => {
        const cfg = STATUS_CONFIG[row.status];
        return (
          <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.badgeClass}`}>
            {cfg.label}
          </span>
        );
      },
      width: "105px",
    },
    {
      title: "",
      data: "id",
      orderable: false,
      searchable: false,
      render: (_: any, row: Supplier) => (
        <div className="flex items-center gap-1.5 justify-end">
          <button
            onClick={() => openEdit(row)}
            title="Edit supplier"
            className="p-1 rounded-lg hover:bg-amber-50 text-stone-400 hover:text-amber-600 transition cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            title="Delete supplier"
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
      <div className="p-5 bg-white border border-stsn-beige rounded-xl shadow-sm flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-semibold text-stone-900 tracking-tight flex items-center gap-2">
            <Truck className="w-5 h-5 text-stsn-brown" />
            Supplier Management
          </h2>
          <p className="text-stone-500 text-xs mt-1">
            Maintain the vendor master list used by purchase invoices, AP aging, and supplier-related GL postings.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-stsn-brown text-white text-xs font-bold rounded-xl hover:bg-stsn-brown-dark transition shadow-sm cursor-pointer flex-shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          New Supplier
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-stone-200 rounded-xl px-4 py-3 text-center shadow-sm">
          <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400">Total</p>
          <p className="text-xl font-bold text-stone-800 mt-0.5">{stats.total}</p>
          <p className="text-[9px] text-stone-400">Suppliers</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl px-4 py-3 text-center shadow-sm">
          <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400">Active</p>
          <p className="text-xl font-bold text-emerald-600 mt-0.5">{stats.active}</p>
          <p className="text-[9px] text-stone-400">Ready for AP</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl px-4 py-3 text-center shadow-sm">
          <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400">Inactive</p>
          <p className="text-xl font-bold text-stone-500 mt-0.5">{stats.inactive}</p>
          <p className="text-[9px] text-stone-400">Archived</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl px-4 py-3 text-center shadow-sm">
          <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400">Blocked</p>
          <p className="text-xl font-bold text-rose-600 mt-0.5">{stats.blocked}</p>
          <p className="text-[9px] text-stone-400">On hold</p>
        </div>
      </div>

      <div className="bg-white border border-stsn-beige rounded-xl px-4 py-3 shadow-sm flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search supplier, TIN, contact, email, or phone…"
            className="w-full pl-8 pr-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-stone-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as SupplierStatus | "All")}
            className="text-xs border border-stone-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-stsn-gold/50"
          >
            <option value="All">All Statuses</option>
            {SUPPLIER_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 text-xs text-stone-500 hover:text-stone-700 border border-stone-200 rounded-lg hover:bg-stone-50 transition cursor-pointer">
          <Download className="w-3.5 h-3.5" />
          Export
        </button>
      </div>

      <div className="bg-white border border-stsn-beige rounded-xl shadow-sm overflow-hidden p-1">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-stone-400 text-xs">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading suppliers…
          </div>
        ) : (
          <STSNDataTable
            columns={columns}
            rows={filtered}
            searchable={false}
            emptyMessage="No suppliers match your search."
            pageLength={10}
          />
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl border border-stone-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between flex-shrink-0">
              <h3 className="text-sm font-bold text-stone-800">
                {editTarget ? "Edit Supplier" : "New Supplier"}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-stone-400 hover:text-stone-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Supplier Code *</label>
                  <input value={form.supplierCode} onChange={(e) => setForm((prev) => ({ ...prev, supplierCode: e.target.value }))} placeholder="e.g. SUP-1000" className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50 font-mono" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">TIN</label>
                  <input value={form.tin} onChange={(e) => setForm((prev) => ({ ...prev, tin: e.target.value }))} placeholder="000-000-000-000" className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50 font-mono" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as SupplierStatus }))} className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50">
                    {SUPPLIER_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Supplier Name *</label>
                <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Registered business / supplier name" className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Contact Person</label>
                  <input value={form.contactPerson} onChange={(e) => setForm((prev) => ({ ...prev, contactPerson: e.target.value }))} placeholder="Primary contact" className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="supplier@example.com" className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Phone</label>
                  <input value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} placeholder="+63..." className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Payment Terms</label>
                  <input value={form.paymentTerms} onChange={(e) => setForm((prev) => ({ ...prev, paymentTerms: e.target.value }))} placeholder="e.g. Net 30" className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Default GL Account</label>
                  <select value={form.defaultGlAccountCode ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, defaultGlAccountCode: e.target.value || null }))} className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50">
                    <option value="">— None —</option>
                    {postableAccounts.map((account) => (
                      <option key={account.code} value={account.code}>{account.code} — {account.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Address</label>
                <textarea value={form.address} onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))} rows={2} placeholder="Billing / business address" className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50 resize-none" />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} rows={2} placeholder="Procurement, AP, or compliance notes" className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50 resize-none" />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-stone-100 flex justify-between items-center flex-shrink-0 gap-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-xs font-semibold text-stone-500 hover:text-stone-700 border border-stone-200 rounded-xl hover:bg-stone-50 transition cursor-pointer">
                Cancel
              </button>
              <button onClick={handleSave} disabled={!form.supplierCode.trim() || !form.name.trim()} className="px-4 py-2 text-xs font-bold text-white bg-stsn-brown hover:bg-stsn-brown-dark rounded-xl transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                {editTarget ? "Save Changes" : "Add Supplier"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

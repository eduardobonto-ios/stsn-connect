import React, { useEffect, useMemo, useState } from "react";
import {
  PackageOpen, Plus, Edit2, Trash2, Search, Filter, Download,
  Loader2, X, CheckCircle, XCircle,
} from "lucide-react";
import STSNDataTable, { type STSNColumn } from "../../../../components/common/STSNDataTable";
import DataTableCard from "../../../../components/common/DataTableCard";
import ModulePageHeader from "../../../../components/common/ModulePageHeader";
import { useAppDialog } from "../../../../components/common/useAppDialog";
import { dbDelete, dbInsert, dbSelectAll, dbUpdate, newId } from "../../../../services/supabaseCrud";

type ItemType = "Product" | "Service";
type ItemStatus = "Active" | "Inactive";

interface AccountingItem {
  id: string;
  itemCode: string;
  name: string;
  type: ItemType;
  description: string;
  unit: string;
  salesPrice: number;
  purchaseCost: number;
  revenueGlAccountCode: string | null;
  expenseGlAccountCode: string | null;
  inventoryGlAccountCode: string | null;
  status: ItemStatus;
}

interface ChartAccount {
  id: string;
  code: string;
  name: string;
  type: string;
  isHeader: boolean;
  status: string;
}

function rowToItem(r: any): AccountingItem {
  return {
    id: r.id,
    itemCode: r.itemCode ?? "",
    name: r.name ?? "",
    type: (r.type ?? "Product") as ItemType,
    description: r.description ?? "",
    unit: r.unit ?? "Each",
    salesPrice: Number(r.salesPrice ?? 0),
    purchaseCost: Number(r.purchaseCost ?? 0),
    revenueGlAccountCode: r.revenueGlAccountCode ?? null,
    expenseGlAccountCode: r.expenseGlAccountCode ?? null,
    inventoryGlAccountCode: r.inventoryGlAccountCode ?? null,
    status: (r.status ?? "Active") as ItemStatus,
  };
}

const ITEM_TYPES: ItemType[] = ["Product", "Service"];
const ITEM_STATUSES: ItemStatus[] = ["Active", "Inactive"];

const TYPE_CONFIG: Record<ItemType, { label: string; badgeClass: string; color: string }> = {
  Product: { label: "Product", badgeClass: "bg-blue-50 text-blue-700 border-blue-200", color: "text-blue-700" },
  Service: { label: "Service", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200", color: "text-emerald-700" },
};

const DEFAULT_FORM: Omit<AccountingItem, "id"> = {
  itemCode: "",
  name: "",
  type: "Product",
  description: "",
  unit: "Each",
  salesPrice: 0,
  purchaseCost: 0,
  revenueGlAccountCode: null,
  expenseGlAccountCode: null,
  inventoryGlAccountCode: null,
  status: "Active",
};

export default function ItemProductManagementPage() {
  const { confirm } = useAppDialog();
  const [items, setItems] = useState<AccountingItem[]>([]);
  const [accounts, setAccounts] = useState<ChartAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<ItemType | "All">("All");
  const [filterStatus, setFilterStatus] = useState<ItemStatus | "All">("All");
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<AccountingItem | null>(null);
  const [form, setForm] = useState<Omit<AccountingItem, "id">>(DEFAULT_FORM);

  useEffect(() => {
    Promise.all([
      dbSelectAll("items"),
      dbSelectAll("chart_of_accounts"),
    ]).then(([itemRows, accountRows]) => {
      setItems(itemRows.map(rowToItem));
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

  const revenueAccounts = useMemo(
    () => postableAccounts.filter((account) => account.type === "Revenue"),
    [postableAccounts],
  );

  const expenseAccounts = useMemo(
    () => postableAccounts.filter((account) => account.type === "Expense"),
    [postableAccounts],
  );

  const assetAccounts = useMemo(
    () => postableAccounts.filter((account) => account.type === "Asset"),
    [postableAccounts],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items
      .filter((item) => {
        const matchesType = filterType === "All" || item.type === filterType;
        const matchesStatus = filterStatus === "All" || item.status === filterStatus;
        const matchesSearch =
          !q ||
          item.itemCode.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.unit.toLowerCase().includes(q);
        return matchesType && matchesStatus && matchesSearch;
      })
      .sort((a, b) => a.itemCode.localeCompare(b.itemCode));
  }, [items, search, filterType, filterStatus]);

  const stats = useMemo(() => ({
    total: items.length,
    active: items.filter((item) => item.status === "Active").length,
    products: items.filter((item) => item.type === "Product").length,
    services: items.filter((item) => item.type === "Service").length,
  }), [items]);

  function openAdd() {
    setForm(DEFAULT_FORM);
    setEditTarget(null);
    setShowForm(true);
  }

  function openEdit(item: AccountingItem) {
    setForm({
      itemCode: item.itemCode,
      name: item.name,
      type: item.type,
      description: item.description,
      unit: item.unit,
      salesPrice: item.salesPrice,
      purchaseCost: item.purchaseCost,
      revenueGlAccountCode: item.revenueGlAccountCode,
      expenseGlAccountCode: item.expenseGlAccountCode,
      inventoryGlAccountCode: item.inventoryGlAccountCode,
      status: item.status,
    });
    setEditTarget(item);
    setShowForm(true);
  }

  function handleSave() {
    if (!form.itemCode.trim() || !form.name.trim()) return;

    if (editTarget) {
      setItems((prev) => prev.map((item) => (
        item.id === editTarget.id ? { ...item, ...form } : item
      )));
      dbUpdate("items", editTarget.id, form);
    } else {
      const id = newId();
      setItems((prev) => [...prev, { id, ...form }]);
      dbInsert("items", { id, ...form });
    }

    setShowForm(false);
  }

  async function handleDelete(id: string) {
    const target = items.find((item) => item.id === id);
    if (!target) return;

    if (await confirm(`Delete item "${target.itemCode} - ${target.name}"?`, { variant: "danger" })) {
      setItems((prev) => prev.filter((item) => item.id !== id));
      dbDelete("items", id);
    }
  }

  const columns: STSNColumn<AccountingItem>[] = [
    {
      title: "Code",
      data: "itemCode",
      render: (_: any, row: AccountingItem) => (
        <span className="font-mono text-xs font-semibold text-stone-700">{row.itemCode}</span>
      ),
      width: "115px",
    },
    {
      title: "Item / Service",
      data: "name",
      render: (_: any, row: AccountingItem) => (
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
      render: (_: any, row: AccountingItem) => {
        const cfg = TYPE_CONFIG[row.type];
        return (
          <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.badgeClass}`}>
            {cfg.label}
          </span>
        );
      },
      width: "105px",
    },
    {
      title: "Unit",
      data: "unit",
      render: (value: string) => <span className="text-xs text-stone-600">{value}</span>,
      width: "85px",
    },
    {
      title: "Sales Price",
      data: "salesPrice",
      className: "text-right",
      render: (value: number) => <span className="font-mono text-xs font-bold text-stone-800">PHP {value.toLocaleString()}</span>,
      width: "125px",
    },
    {
      title: "Purchase Cost",
      data: "purchaseCost",
      className: "text-right",
      render: (value: number) => <span className="font-mono text-xs font-bold text-stone-700">PHP {value.toLocaleString()}</span>,
      width: "125px",
    },
    {
      title: "GL Mapping",
      data: "revenueGlAccountCode",
      render: (_: any, row: AccountingItem) => (
        <div className="space-y-0.5">
          <p className="text-[10px] text-stone-500">
            Revenue: <span className="font-mono text-stone-700">{row.revenueGlAccountCode || "-"}</span>
          </p>
          <p className="text-[10px] text-stone-500">
            Expense: <span className="font-mono text-stone-700">{row.expenseGlAccountCode || "-"}</span>
          </p>
          {row.type === "Product" && (
            <p className="text-[10px] text-stone-500">
              Inventory: <span className="font-mono text-stone-700">{row.inventoryGlAccountCode || "-"}</span>
            </p>
          )}
        </div>
      ),
      width: "150px",
    },
    {
      title: "Active",
      data: "status",
      className: "text-center",
      orderable: false,
      render: (_: any, row: AccountingItem) =>
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
      render: (_: any, row: AccountingItem) => (
        <div className="flex items-center gap-1.5 justify-end">
          <button
            onClick={() => openEdit(row)}
            title="Edit item"
            className="p-1 rounded-lg hover:bg-amber-50 text-stone-400 hover:text-amber-600 transition cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            title="Delete item"
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
      <ModulePageHeader
        badge="Accounting Setup"
        badgeIcon={PackageOpen}
        title="Item / Product Management"
        subtitle="Maintain products and services with GL mappings for future sales and purchase invoice posting."
        actions={
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-xl shadow-lg transition cursor-pointer bg-[#C5A059] hover:bg-[#d4af68] text-[#1C1512]"
          >
            <Plus className="w-4 h-4" /> New Item
          </button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-stone-200 rounded-xl px-4 py-3 text-center shadow-sm">
          <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400">Total</p>
          <p className="text-xl font-bold text-stone-800 mt-0.5">{stats.total}</p>
          <p className="text-[9px] text-stone-400">Catalog Items</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl px-4 py-3 text-center shadow-sm">
          <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400">Active</p>
          <p className="text-xl font-bold text-emerald-600 mt-0.5">{stats.active}</p>
          <p className="text-[9px] text-stone-400">Usable</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl px-4 py-3 text-center shadow-sm">
          <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400">Products</p>
          <p className="text-xl font-bold text-blue-600 mt-0.5">{stats.products}</p>
          <p className="text-[9px] text-stone-400">Goods</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl px-4 py-3 text-center shadow-sm">
          <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400">Services</p>
          <p className="text-xl font-bold text-emerald-600 mt-0.5">{stats.services}</p>
          <p className="text-[9px] text-stone-400">Billable</p>
        </div>
      </div>

      <DataTableCard
        title="Item & Product Catalog"
        icon={PackageOpen}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search item code, name, unit, or description…"
        actions={
          <>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value as ItemType | "All")} className="text-xs border border-stone-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-stsn-gold/50 bg-stone-50 cursor-pointer">
              <option value="All">All Types</option>
              {ITEM_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as ItemStatus | "All")} className="text-xs border border-stone-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-stsn-gold/50 bg-stone-50 cursor-pointer">
              <option value="All">All Statuses</option>
              {ITEM_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-stone-500 hover:text-stone-700 border border-stone-200 rounded-lg hover:bg-stone-50 transition cursor-pointer">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </>
        }
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-stone-400 text-xs">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading items...
          </div>
        ) : (
          <STSNDataTable
            columns={columns}
            rows={filtered}
            searchable={false}
            emptyMessage="No items match your search."
            pageLength={10}
          />
        )}
      </DataTableCard>

      {showForm && (
        <div className="app-modal-backdrop z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl border border-stone-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between flex-shrink-0">
              <h3 className="text-sm font-bold text-stone-800">
                {editTarget ? "Edit Item" : "New Item"}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-stone-400 hover:text-stone-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Item Code *</label>
                  <input value={form.itemCode} onChange={(e) => setForm((prev) => ({ ...prev, itemCode: e.target.value }))} placeholder="e.g. ITM-1000" className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50 font-mono" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Type</label>
                  <select value={form.type} onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as ItemType }))} className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50">
                    {ITEM_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Unit</label>
                  <input value={form.unit} onChange={(e) => setForm((prev) => ({ ...prev, unit: e.target.value }))} placeholder="Each, Hr, Lot" className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as ItemStatus }))} className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50">
                    {ITEM_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Name *</label>
                <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Catalog item or service name" className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50" />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} rows={2} placeholder="Short item notes for invoice selection" className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50 resize-none" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Sales Price</label>
                  <input type="number" min="0" value={form.salesPrice} onChange={(e) => setForm((prev) => ({ ...prev, salesPrice: Number(e.target.value) }))} className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Purchase Cost</label>
                  <input type="number" min="0" value={form.purchaseCost} onChange={(e) => setForm((prev) => ({ ...prev, purchaseCost: Number(e.target.value) }))} className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Revenue GL Account</label>
                  <select value={form.revenueGlAccountCode ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, revenueGlAccountCode: e.target.value || null }))} className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50">
                    <option value="">None</option>
                    {revenueAccounts.map((account) => (
                      <option key={account.code} value={account.code}>{account.code} - {account.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Expense GL Account</label>
                  <select value={form.expenseGlAccountCode ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, expenseGlAccountCode: e.target.value || null }))} className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50">
                    <option value="">None</option>
                    {expenseAccounts.map((account) => (
                      <option key={account.code} value={account.code}>{account.code} - {account.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Inventory GL Account</label>
                  <select value={form.inventoryGlAccountCode ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, inventoryGlAccountCode: e.target.value || null }))} className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50">
                    <option value="">None</option>
                    {assetAccounts.map((account) => (
                      <option key={account.code} value={account.code}>{account.code} - {account.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-stone-100 flex justify-between items-center flex-shrink-0 gap-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-xs font-semibold text-stone-500 hover:text-stone-700 border border-stone-200 rounded-xl hover:bg-stone-50 transition cursor-pointer">
                Cancel
              </button>
              <button onClick={handleSave} disabled={!form.itemCode.trim() || !form.name.trim()} className="px-4 py-2 text-xs font-bold text-white bg-stsn-brown hover:bg-stsn-brown-dark rounded-xl transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                {editTarget ? "Save Changes" : "Add Item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

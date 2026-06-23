import React, { useEffect, useMemo, useState } from "react";
import {
  Truck, Search, Filter, Download, Loader2, X, Eye,
} from "lucide-react";
import STSNDataTable, { type STSNColumn } from "../../../../components/common/STSNDataTable";
import { dbSelectAll } from "../../../../services/supabaseCrud";

type InvoiceStatus = "Draft" | "Posted" | "Paid" | "Void";
type AgingBucket = "Current" | "1-30" | "31-60" | "61-90" | "91-120" | "120+";
type ViewMode = "by-invoice" | "by-vendor";

interface PurchaseInvoice {
  id: string;
  invoiceNo: string;
  supplierInvoiceNo: string;
  invoiceDate: string;
  dueDate: string;
  supplierId: string | null;
  supplierCode: string;
  supplierName: string;
  apGlAccountCode: string;
  subtotal: number;
  totalAmount: number;
  status: InvoiceStatus;
  journalEntryId: string | null;
  notes: string;
}

interface PurchaseInvoiceLine {
  id: string;
  purchaseInvoiceId: string;
  lineNo: number;
  itemId: string | null;
  itemCode: string;
  description: string;
  quantity: number;
  unitCost: number;
  expenseGlAccountCode: string;
  lineTotal: number;
}

interface AgingRow extends PurchaseInvoice {
  daysOverdue: number;
  bucket: AgingBucket;
}

interface VendorRow {
  id: string;
  supplierName: string;
  supplierCode: string;
  current: number;
  b1_30: number;
  b31_60: number;
  b61_90: number;
  b91_120: number;
  b120plus: number;
  total: number;
  invoiceCount: number;
}

function daysOverdue(dueDateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr);
  return Math.floor((today.getTime() - due.getTime()) / 86400000);
}

function toBucket(days: number): AgingBucket {
  if (days <= 0) return "Current";
  if (days <= 30) return "1-30";
  if (days <= 60) return "31-60";
  if (days <= 90) return "61-90";
  if (days <= 120) return "91-120";
  return "120+";
}

function fmt(value: number): string {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function rowToInvoice(r: any): PurchaseInvoice {
  return {
    id: r.id,
    invoiceNo: r.invoiceNo ?? "",
    supplierInvoiceNo: r.supplierInvoiceNo ?? "",
    invoiceDate: r.invoiceDate ?? "",
    dueDate: r.dueDate ?? "",
    supplierId: r.supplierId ?? null,
    supplierCode: r.supplierCode ?? "",
    supplierName: r.supplierName ?? "",
    apGlAccountCode: r.apGlAccountCode ?? "2110",
    subtotal: Number(r.subtotal ?? 0),
    totalAmount: Number(r.totalAmount ?? 0),
    status: (r.status ?? "Draft") as InvoiceStatus,
    journalEntryId: r.journalEntryId ?? null,
    notes: r.notes ?? "",
  };
}

function rowToLine(r: any): PurchaseInvoiceLine {
  return {
    id: r.id,
    purchaseInvoiceId: r.purchaseInvoiceId,
    lineNo: Number(r.lineNo ?? 1),
    itemId: r.itemId ?? null,
    itemCode: r.itemCode ?? "",
    description: r.description ?? "",
    quantity: Number(r.quantity ?? 0),
    unitCost: Number(r.unitCost ?? 0),
    expenseGlAccountCode: r.expenseGlAccountCode ?? "",
    lineTotal: Number(r.lineTotal ?? 0),
  };
}

const BUCKETS: AgingBucket[] = ["Current", "1-30", "31-60", "61-90", "91-120", "120+"];

const BUCKET_CONFIG: Record<AgingBucket, { label: string; badgeClass: string; cardBorder: string; amountClass: string }> = {
  "Current":  { label: "Current",     badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200", cardBorder: "border-emerald-200 bg-emerald-50",  amountClass: "text-emerald-700" },
  "1-30":     { label: "1–30 Days",   badgeClass: "bg-amber-50 text-amber-700 border-amber-200",       cardBorder: "border-amber-200 bg-amber-50",      amountClass: "text-amber-700"   },
  "31-60":    { label: "31–60 Days",  badgeClass: "bg-orange-50 text-orange-700 border-orange-200",    cardBorder: "border-orange-200 bg-orange-50",    amountClass: "text-orange-700"  },
  "61-90":    { label: "61–90 Days",  badgeClass: "bg-red-50 text-red-600 border-red-200",             cardBorder: "border-red-200 bg-red-50",          amountClass: "text-red-600"     },
  "91-120":   { label: "91–120 Days", badgeClass: "bg-rose-50 text-rose-700 border-rose-200",          cardBorder: "border-rose-200 bg-rose-50",        amountClass: "text-rose-700"    },
  "120+":     { label: "120+ Days",   badgeClass: "bg-stone-100 text-stone-600 border-stone-300",      cardBorder: "border-stone-300 bg-stone-100",     amountClass: "text-stone-600"   },
};

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; badgeClass: string }> = {
  Draft:  { label: "Draft",  badgeClass: "bg-amber-50 text-amber-700 border-amber-200"       },
  Posted: { label: "Posted", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  Paid:   { label: "Paid",   badgeClass: "bg-blue-50 text-blue-700 border-blue-200"          },
  Void:   { label: "Void",   badgeClass: "bg-stone-100 text-stone-500 border-stone-200"      },
};

export default function APAgingPage() {
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [allLines, setAllLines] = useState<PurchaseInvoiceLine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterBucket, setFilterBucket] = useState<AgingBucket | "All">("All");
  const [viewMode, setViewMode] = useState<ViewMode>("by-invoice");
  const [viewTarget, setViewTarget] = useState<AgingRow | null>(null);

  useEffect(() => {
    Promise.all([
      dbSelectAll("purchase_invoices"),
      dbSelectAll("purchase_invoice_lines"),
    ]).then(([invoiceRows, lineRows]) => {
      setInvoices(invoiceRows.map(rowToInvoice));
      setAllLines(lineRows.map(rowToLine));
      setIsLoading(false);
    });
  }, []);

  const agingRows: AgingRow[] = useMemo(
    () => invoices
      .filter((inv) => inv.status === "Posted")
      .map((inv) => {
        const days = daysOverdue(inv.dueDate);
        return { ...inv, daysOverdue: days, bucket: toBucket(days) };
      })
      .sort((a, b) => b.daysOverdue - a.daysOverdue),
    [invoices],
  );

  const bucketTotals = useMemo(() => {
    const totals: Record<AgingBucket, number> = { Current: 0, "1-30": 0, "31-60": 0, "61-90": 0, "91-120": 0, "120+": 0 };
    agingRows.forEach((row) => { totals[row.bucket] += row.totalAmount; });
    return totals;
  }, [agingRows]);

  const totalOutstanding = useMemo(() => agingRows.reduce((sum, row) => sum + row.totalAmount, 0), [agingRows]);

  const filteredInvoices = useMemo(() => {
    const q = search.toLowerCase();
    return agingRows.filter((row) => {
      const matchBucket = filterBucket === "All" || row.bucket === filterBucket;
      const matchSearch = !q || row.invoiceNo.toLowerCase().includes(q) || row.supplierName.toLowerCase().includes(q) || row.supplierCode.toLowerCase().includes(q) || row.supplierInvoiceNo.toLowerCase().includes(q);
      return matchBucket && matchSearch;
    });
  }, [agingRows, search, filterBucket]);

  const vendorRows: VendorRow[] = useMemo(() => {
    const map = new Map<string, VendorRow>();
    agingRows.forEach((row) => {
      const key = row.supplierName || row.supplierCode || row.id;
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          supplierName: row.supplierName,
          supplierCode: row.supplierCode,
          current: 0, b1_30: 0, b31_60: 0, b61_90: 0, b91_120: 0, b120plus: 0, total: 0,
          invoiceCount: 0,
        });
      }
      const entry = map.get(key)!;
      entry.total += row.totalAmount;
      entry.invoiceCount += 1;
      if (row.bucket === "Current")  entry.current  += row.totalAmount;
      if (row.bucket === "1-30")     entry.b1_30    += row.totalAmount;
      if (row.bucket === "31-60")    entry.b31_60   += row.totalAmount;
      if (row.bucket === "61-90")    entry.b61_90   += row.totalAmount;
      if (row.bucket === "91-120")   entry.b91_120  += row.totalAmount;
      if (row.bucket === "120+")     entry.b120plus += row.totalAmount;
    });
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [agingRows]);

  const filteredVendors = useMemo(() => {
    const q = search.toLowerCase();
    return vendorRows.filter((v) => !q || v.supplierName.toLowerCase().includes(q) || v.supplierCode.toLowerCase().includes(q));
  }, [vendorRows, search]);

  const viewLines = useMemo(
    () => viewTarget ? allLines.filter((line) => line.purchaseInvoiceId === viewTarget.id).sort((a, b) => a.lineNo - b.lineNo) : [],
    [allLines, viewTarget],
  );

  const invoiceColumns: STSNColumn<AgingRow>[] = [
    {
      title: "Invoice No.",
      data: "invoiceNo",
      render: (_, row) => <span className="font-mono text-xs font-semibold text-stone-700">{row.invoiceNo}</span>,
      width: "130px",
    },
    {
      title: "Supplier",
      data: "supplierName",
      render: (_, row) => (
        <div>
          <p className="text-xs font-semibold text-stone-800">{row.supplierName}</p>
          <p className="text-[10px] text-stone-400 font-mono">{row.supplierCode || "—"} {row.supplierInvoiceNo ? `• Ref: ${row.supplierInvoiceNo}` : ""}</p>
        </div>
      ),
    },
    { title: "Invoice Date", data: "invoiceDate", width: "110px" },
    { title: "Due Date", data: "dueDate", width: "110px" },
    {
      title: "Amount",
      data: "totalAmount",
      className: "text-right",
      render: (value: number) => <span className="font-mono text-xs font-bold text-stone-900">PHP {fmt(value)}</span>,
      width: "125px",
    },
    {
      title: "Days Overdue",
      data: "daysOverdue",
      className: "text-right",
      render: (value: number) => (
        <span className={`font-mono text-xs font-bold ${value > 0 ? "text-red-600" : "text-emerald-600"}`}>
          {value > 0 ? `+${value}d` : value === 0 ? "Today" : `${Math.abs(value)}d left`}
        </span>
      ),
      width: "105px",
    },
    {
      title: "Aging Bucket",
      data: "bucket",
      render: (value: AgingBucket) => {
        const cfg = BUCKET_CONFIG[value];
        return <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.badgeClass}`}>{cfg.label}</span>;
      },
      width: "115px",
    },
    {
      title: "",
      data: "id",
      orderable: false,
      searchable: false,
      render: (_, row) => (
        <div className="flex items-center justify-end">
          <button
            onClick={() => setViewTarget(row)}
            title="View invoice"
            className="p-1 rounded-lg hover:bg-blue-50 text-stone-400 hover:text-blue-600 transition cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
      width: "50px",
    },
  ];

  const vendorColumns: STSNColumn<VendorRow>[] = [
    {
      title: "Supplier",
      data: "supplierName",
      render: (_, row) => (
        <div>
          <p className="text-xs font-semibold text-stone-800">{row.supplierName}</p>
          <p className="text-[10px] text-stone-400 font-mono">{row.supplierCode || "—"}</p>
        </div>
      ),
    },
    {
      title: "Current",
      data: "current",
      className: "text-right",
      render: (v: number) => <span className={`font-mono text-xs ${v > 0 ? "text-emerald-700 font-bold" : "text-stone-300"}`}>{v > 0 ? `PHP ${fmt(v)}` : "—"}</span>,
      width: "120px",
    },
    {
      title: "1–30 Days",
      data: "b1_30",
      className: "text-right",
      render: (v: number) => <span className={`font-mono text-xs ${v > 0 ? "text-amber-700 font-bold" : "text-stone-300"}`}>{v > 0 ? `PHP ${fmt(v)}` : "—"}</span>,
      width: "120px",
    },
    {
      title: "31–60 Days",
      data: "b31_60",
      className: "text-right",
      render: (v: number) => <span className={`font-mono text-xs ${v > 0 ? "text-orange-700 font-bold" : "text-stone-300"}`}>{v > 0 ? `PHP ${fmt(v)}` : "—"}</span>,
      width: "120px",
    },
    {
      title: "61–90 Days",
      data: "b61_90",
      className: "text-right",
      render: (v: number) => <span className={`font-mono text-xs ${v > 0 ? "text-red-600 font-bold" : "text-stone-300"}`}>{v > 0 ? `PHP ${fmt(v)}` : "—"}</span>,
      width: "120px",
    },
    {
      title: "91–120 Days",
      data: "b91_120",
      className: "text-right",
      render: (v: number) => <span className={`font-mono text-xs ${v > 0 ? "text-rose-700 font-bold" : "text-stone-300"}`}>{v > 0 ? `PHP ${fmt(v)}` : "—"}</span>,
      width: "120px",
    },
    {
      title: "120+ Days",
      data: "b120plus",
      className: "text-right",
      render: (v: number) => <span className={`font-mono text-xs ${v > 0 ? "text-stone-600 font-bold" : "text-stone-300"}`}>{v > 0 ? `PHP ${fmt(v)}` : "—"}</span>,
      width: "120px",
    },
    {
      title: "Total",
      data: "total",
      className: "text-right",
      render: (v: number) => <span className="font-mono text-xs font-black text-stone-900">PHP {fmt(v)}</span>,
      width: "130px",
    },
    {
      title: "Inv.",
      data: "invoiceCount",
      className: "text-center",
      render: (v: number) => <span className="font-mono text-xs text-stone-500">{v}</span>,
      width: "50px",
    },
  ];

  const lineColumns: STSNColumn<PurchaseInvoiceLine>[] = [
    { title: "#", data: "lineNo", width: "45px" },
    { title: "Item", data: "itemCode", render: (v) => <span className="font-mono text-xs text-stone-600">{v || "—"}</span>, width: "95px" },
    { title: "Description", data: "description" },
    { title: "Qty", data: "quantity", className: "text-right", render: (v: number) => <span className="font-mono text-xs">{fmt(v)}</span>, width: "70px" },
    { title: "Unit Cost", data: "unitCost", className: "text-right", render: (v: number) => <span className="font-mono text-xs">PHP {fmt(v)}</span>, width: "110px" },
    { title: "Expense GL", data: "expenseGlAccountCode", render: (v) => <span className="font-mono text-xs">{v}</span>, width: "100px" },
    { title: "Line Total", data: "lineTotal", className: "text-right", render: (v: number) => <span className="font-mono text-xs font-bold">PHP {fmt(v)}</span>, width: "115px" },
  ];

  return (
    <div className="space-y-5 animate-fade-in font-sans">
      {/* Header */}
      <div className="p-5 bg-white border border-stsn-beige rounded-xl shadow-sm flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-semibold text-stone-900 tracking-tight flex items-center gap-2">
            <Truck className="w-5 h-5 text-stsn-brown" />
            AP Summary with Aging
          </h2>
          <p className="text-stone-500 text-xs mt-1">
            Outstanding accounts payable aged by vendor and due date. Showing Posted invoices only.
          </p>
        </div>
        {/* View Toggle */}
        <div className="flex items-center bg-stone-100 rounded-lg p-0.5 gap-0.5 flex-shrink-0">
          <button
            onClick={() => setViewMode("by-invoice")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${viewMode === "by-invoice" ? "bg-white shadow text-stone-800" : "text-stone-500 hover:text-stone-700"}`}
          >
            By Invoice
          </button>
          <button
            onClick={() => setViewMode("by-vendor")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${viewMode === "by-vendor" ? "bg-white shadow text-stone-800" : "text-stone-500 hover:text-stone-700"}`}
          >
            By Vendor
          </button>
        </div>
      </div>

      {/* Aging Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white border border-stone-200 rounded-xl px-4 py-3 text-center shadow-sm col-span-1">
          <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400">Total AP</p>
          <p className="text-base font-bold text-stone-800 mt-0.5">PHP {fmt(totalOutstanding)}</p>
          <p className="text-[9px] text-stone-400">{agingRows.length} Invoice{agingRows.length !== 1 ? "s" : ""}</p>
        </div>
        {BUCKETS.map((bucket) => {
          const cfg = BUCKET_CONFIG[bucket];
          const count = agingRows.filter((r) => r.bucket === bucket).length;
          const isActive = filterBucket === bucket;
          return (
            <div
              key={bucket}
              onClick={() => setFilterBucket(isActive ? "All" : bucket)}
              className={`border rounded-xl px-3 py-3 text-center shadow-sm cursor-pointer transition hover:shadow-md ${cfg.cardBorder} ${isActive ? "ring-2 ring-offset-1 ring-stone-400" : ""}`}
            >
              <p className="text-[10px] font-mono uppercase tracking-wider text-stone-500 truncate">{cfg.label}</p>
              <p className={`text-sm font-bold mt-0.5 ${bucketTotals[bucket] > 0 ? cfg.amountClass : "text-stone-400"}`}>
                PHP {fmt(bucketTotals[bucket])}
              </p>
              <p className="text-[9px] text-stone-400">{count} inv.</p>
            </div>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-stsn-beige rounded-xl px-4 py-3 shadow-sm flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice no. or supplier..."
            className="w-full pl-8 pr-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50"
          />
        </div>
        {viewMode === "by-invoice" && (
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={filterBucket}
              onChange={(e) => setFilterBucket(e.target.value as AgingBucket | "All")}
              className="text-xs border border-stone-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-stsn-gold/50"
            >
              <option value="All">All Buckets</option>
              {BUCKETS.map((b) => <option key={b} value={b}>{BUCKET_CONFIG[b].label}</option>)}
            </select>
          </div>
        )}
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
            Loading AP aging data...
          </div>
        ) : viewMode === "by-invoice" ? (
          <STSNDataTable
            columns={invoiceColumns}
            rows={filteredInvoices}
            searchable={false}
            emptyMessage="No outstanding AP invoices."
            pageLength={15}
          />
        ) : (
          <STSNDataTable
            columns={vendorColumns}
            rows={filteredVendors}
            searchable={false}
            emptyMessage="No outstanding AP invoices."
            pageLength={15}
          />
        )}
      </div>

      {/* View Invoice Modal */}
      {viewTarget && (
        <div className="app-modal-backdrop z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl border border-stone-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-sm font-bold text-stone-800">{viewTarget.invoiceNo}</h3>
                <p className="text-[10px] text-stone-400">{viewTarget.supplierName} • Due {viewTarget.dueDate}</p>
              </div>
              <button onClick={() => setViewTarget(null)} className="text-stone-400 hover:text-stone-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-stone-50 rounded-xl border border-stone-200 p-3">
                  <p className="text-[10px] text-stone-400 uppercase font-mono">Status</p>
                  <span className={`inline-flex mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_CONFIG[viewTarget.status].badgeClass}`}>
                    {STATUS_CONFIG[viewTarget.status].label}
                  </span>
                </div>
                <div className="bg-stone-50 rounded-xl border border-stone-200 p-3">
                  <p className="text-[10px] text-stone-400 uppercase font-mono">Aging Bucket</p>
                  <span className={`inline-flex mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${BUCKET_CONFIG[viewTarget.bucket].badgeClass}`}>
                    {BUCKET_CONFIG[viewTarget.bucket].label}
                  </span>
                </div>
                <div className="bg-stone-50 rounded-xl border border-stone-200 p-3">
                  <p className="text-[10px] text-stone-400 uppercase font-mono">Days Overdue</p>
                  <p className={`text-xs font-bold mt-1 ${viewTarget.daysOverdue > 0 ? "text-red-600" : "text-emerald-600"}`}>
                    {viewTarget.daysOverdue > 0
                      ? `${viewTarget.daysOverdue} days overdue`
                      : viewTarget.daysOverdue === 0
                        ? "Due Today"
                        : `${Math.abs(viewTarget.daysOverdue)}d remaining`}
                  </p>
                </div>
                <div className="bg-stone-50 rounded-xl border border-stone-200 p-3">
                  <p className="text-[10px] text-stone-400 uppercase font-mono">Total</p>
                  <p className="text-xs font-mono font-black text-stone-900 mt-1">PHP {fmt(viewTarget.totalAmount)}</p>
                </div>
              </div>

              {viewTarget.supplierInvoiceNo && (
                <div className="text-xs text-stone-500 bg-stone-50 border border-stone-200 rounded-xl p-3">
                  Supplier Invoice No.: <span className="font-mono font-semibold text-stone-700">{viewTarget.supplierInvoiceNo}</span>
                </div>
              )}

              <STSNDataTable
                columns={lineColumns}
                rows={viewLines}
                searchable={false}
                emptyMessage="No invoice lines found."
                pageLength={10}
              />

              {viewTarget.notes && (
                <p className="text-xs text-stone-500 bg-stone-50 border border-stone-200 rounded-xl p-3">{viewTarget.notes}</p>
              )}
            </div>

            <div className="px-6 py-4 border-t border-stone-100 flex justify-end flex-shrink-0">
              <button
                onClick={() => setViewTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-stone-500 hover:text-stone-700 border border-stone-200 rounded-xl hover:bg-stone-50 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

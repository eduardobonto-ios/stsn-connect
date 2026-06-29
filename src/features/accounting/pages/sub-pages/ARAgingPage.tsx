import React, { useEffect, useMemo, useState } from "react";
import {
  Users, Download, X, Eye,
} from "lucide-react";
import AppTable, { appTableColumnsFromLegacy, type AppTableLegacyColumn } from "../../../../components/common/AppTable";
import ModulePageHeader from "../../../../components/common/ModulePageHeader";
import { dbSelectAll } from "../../../../services/supabaseCrud";

type InvoiceStatus = "Draft" | "Posted" | "Paid" | "Void";
type AgingBucket = "Current" | "1-30" | "31-60" | "61-90" | "91-120" | "120+";

interface SalesInvoice {
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  dueDate: string;
  customerType: string;
  customerId: string | null;
  customerName: string;
  customerNo: string;
  arGlAccountCode: string;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  status: InvoiceStatus;
  journalEntryId: string | null;
  notes: string;
}

interface SalesInvoiceLine {
  id: string;
  salesInvoiceId: string;
  lineNo: number;
  itemId: string | null;
  itemCode: string;
  description: string;
  quantity: number;
  unitPrice: number;
  revenueGlAccountCode: string;
  lineTotal: number;
}

interface AgingRow extends SalesInvoice {
  daysOverdue: number;
  bucket: AgingBucket;
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

function rowToInvoice(r: any): SalesInvoice {
  return {
    id: r.id,
    invoiceNo: r.invoiceNo ?? "",
    invoiceDate: r.invoiceDate ?? "",
    dueDate: r.dueDate ?? "",
    customerType: r.customerType ?? "Student",
    customerId: r.customerId ?? null,
    customerName: r.customerName ?? "",
    customerNo: r.customerNo ?? "",
    arGlAccountCode: r.arGlAccountCode ?? "1130",
    subtotal: Number(r.subtotal ?? 0),
    discountAmount: Number(r.discountAmount ?? 0),
    totalAmount: Number(r.totalAmount ?? 0),
    status: (r.status ?? "Draft") as InvoiceStatus,
    journalEntryId: r.journalEntryId ?? null,
    notes: r.notes ?? "",
  };
}

function rowToLine(r: any): SalesInvoiceLine {
  return {
    id: r.id,
    salesInvoiceId: r.salesInvoiceId,
    lineNo: Number(r.lineNo ?? 1),
    itemId: r.itemId ?? null,
    itemCode: r.itemCode ?? "",
    description: r.description ?? "",
    quantity: Number(r.quantity ?? 0),
    unitPrice: Number(r.unitPrice ?? 0),
    revenueGlAccountCode: r.revenueGlAccountCode ?? "",
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
  Draft:  { label: "Draft",  badgeClass: "bg-amber-50 text-amber-700 border-amber-200"    },
  Posted: { label: "Posted", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  Paid:   { label: "Paid",   badgeClass: "bg-blue-50 text-blue-700 border-blue-200"       },
  Void:   { label: "Void",   badgeClass: "bg-stone-100 text-stone-500 border-stone-200"   },
};

export default function ARAgingPage() {
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [allLines, setAllLines] = useState<SalesInvoiceLine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterBucket, setFilterBucket] = useState<AgingBucket | "All">("All");
  const [viewTarget, setViewTarget] = useState<AgingRow | null>(null);

  useEffect(() => {
    Promise.all([
      dbSelectAll("sales_invoices"),
      dbSelectAll("sales_invoice_lines"),
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

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return agingRows.filter((row) => {
      const matchBucket = filterBucket === "All" || row.bucket === filterBucket;
      const matchSearch = !q || row.invoiceNo.toLowerCase().includes(q) || row.customerName.toLowerCase().includes(q) || row.customerNo.toLowerCase().includes(q);
      return matchBucket && matchSearch;
    });
  }, [agingRows, search, filterBucket]);

  const viewLines = useMemo(
    () => viewTarget ? allLines.filter((line) => line.salesInvoiceId === viewTarget.id).sort((a, b) => a.lineNo - b.lineNo) : [],
    [allLines, viewTarget],
  );

  const columns: AppTableLegacyColumn<AgingRow>[] = [
    {
      title: "Invoice No.",
      data: "invoiceNo",
      render: (_, row) => <span className="font-mono text-xs font-semibold text-stone-700">{row.invoiceNo}</span>,
      width: "130px",
    },
    {
      title: "Customer",
      data: "customerName",
      render: (_, row) => (
        <div>
          <p className="text-xs font-semibold text-stone-800">{row.customerName}</p>
          <p className="text-[10px] text-stone-400 font-mono">{row.customerNo || "—"}</p>
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

  const lineColumns: AppTableLegacyColumn<SalesInvoiceLine>[] = [
    { title: "#", data: "lineNo", width: "45px" },
    { title: "Item", data: "itemCode", render: (v) => <span className="font-mono text-xs text-stone-600">{v || "—"}</span>, width: "95px" },
    { title: "Description", data: "description" },
    { title: "Qty", data: "quantity", className: "text-right", render: (v: number) => <span className="font-mono text-xs">{fmt(v)}</span>, width: "70px" },
    { title: "Unit Price", data: "unitPrice", className: "text-right", render: (v: number) => <span className="font-mono text-xs">PHP {fmt(v)}</span>, width: "110px" },
    { title: "Revenue GL", data: "revenueGlAccountCode", render: (v) => <span className="font-mono text-xs">{v}</span>, width: "100px" },
    { title: "Line Total", data: "lineTotal", className: "text-right", render: (v: number) => <span className="font-mono text-xs font-bold">PHP {fmt(v)}</span>, width: "115px" },
  ];

  return (
    <div className="space-y-5 animate-fade-in font-sans">
      <ModulePageHeader
        badge="Accounts Receivable"
        badgeIcon={Users}
        title="AR Summary with Aging"
        subtitle="Outstanding accounts receivable aged by 30 / 60 / 90 / 120+ day buckets. Showing Posted invoices only."
      />

      {/* Aging Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white border border-stone-200 rounded-xl px-4 py-3 text-center shadow-sm col-span-1">
          <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400">Total AR</p>
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

      <AppTable
        data={filtered}
        columns={appTableColumnsFromLegacy(columns)}
        title="Accounts Receivable Aging"
        toolbar={
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice no. or customer..."
            className="h-9 min-w-[220px] rounded-lg border border-[var(--erp-border)] bg-[var(--erp-surface-muted)] px-3 text-xs text-[var(--erp-text)] outline-none transition placeholder:text-stone-400 focus:border-[var(--erp-brand)] focus:bg-white focus:ring-2 focus:ring-[var(--erp-brand)]/15 sm:w-72"
          />
        }
        rightToolbar={
          <>
            <select value={filterBucket} onChange={(e) => setFilterBucket(e.target.value as AgingBucket | "All")} className="text-xs border border-stone-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-stsn-gold/50 bg-stone-50 cursor-pointer">
              <option value="All">All Buckets</option>
              {BUCKETS.map((b) => <option key={b} value={b}>{BUCKET_CONFIG[b].label}</option>)}
            </select>
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-stone-500 hover:text-stone-700 border border-stone-200 rounded-lg hover:bg-stone-50 transition cursor-pointer">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </>
        }
        loading={isLoading}
        enableSearch={false}
        emptyMessage="No outstanding AR invoices."
        initialPageSize={15}
        pageSizeOptions={[15]}
        getRowId={(row) => row.id}
      />

      {/* View Invoice Modal */}
      {viewTarget && (
        <div className="app-modal-backdrop z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl border border-stone-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-sm font-bold text-stone-800">{viewTarget.invoiceNo}</h3>
                <p className="text-[10px] text-stone-400">{viewTarget.customerName} • Due {viewTarget.dueDate}</p>
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

              <AppTable
                data={viewLines}
                columns={appTableColumnsFromLegacy(lineColumns)}
                loading={false}
                enableSearch={false}
                emptyMessage="No invoice lines found."
                initialPageSize={10}
                pageSizeOptions={[10]}
                getRowId={(row) => row.id}
                compact
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


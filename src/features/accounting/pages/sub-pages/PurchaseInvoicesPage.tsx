import React, { useEffect, useMemo, useState } from "react";
import {
  FileInput, Plus, Eye, Edit2, Trash2, Search, Filter, Download,
  Loader2, X, Send, Ban, PlusCircle, Trash,
} from "lucide-react";
import STSNDataTable, { type STSNColumn } from "../../../../components/common/STSNDataTable";
import { useAppDialog } from "../../../../components/common/useAppDialog";
import { dbDelete, dbDeleteWhere, dbInsert, dbSelectAll, dbUpdate, newId } from "../../../../services/supabaseCrud";

type PurchaseInvoiceStatus = "Draft" | "Posted" | "Paid" | "Void";

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
  status: PurchaseInvoiceStatus;
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

interface Supplier {
  id: string;
  supplierCode: string;
  name: string;
  paymentTerms: string;
  defaultGlAccountCode: string | null;
  status: string;
}

interface AccountingItem {
  id: string;
  itemCode: string;
  name: string;
  purchaseCost: number;
  expenseGlAccountCode: string | null;
  status: string;
}

interface ChartAccount {
  id: string;
  code: string;
  name: string;
  type: string;
  isHeader: boolean;
  status: string;
}

interface FormLine {
  key: string;
  itemId: string;
  itemCode: string;
  description: string;
  quantity: string;
  unitCost: string;
  expenseGlAccountCode: string;
}

interface InvoiceForm {
  invoiceNo: string;
  supplierInvoiceNo: string;
  invoiceDate: string;
  dueDate: string;
  supplierId: string;
  supplierCode: string;
  supplierName: string;
  apGlAccountCode: string;
  notes: string;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function plusDaysISO(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function fiscalYearFromDate(value: string): string {
  const date = new Date(value);
  const year = date.getFullYear();
  return date.getMonth() >= 5 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

function fiscalPeriodFromDate(value: string): string {
  const date = new Date(value);
  return date.toLocaleString("en-US", { month: "long", year: "numeric" });
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
    status: (r.status ?? "Draft") as PurchaseInvoiceStatus,
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

const STATUS_CONFIG: Record<PurchaseInvoiceStatus, { label: string; badgeClass: string }> = {
  Draft: { label: "Draft", badgeClass: "bg-amber-50 text-amber-700 border-amber-200" },
  Posted: { label: "Posted", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  Paid: { label: "Paid", badgeClass: "bg-blue-50 text-blue-700 border-blue-200" },
  Void: { label: "Void", badgeClass: "bg-stone-100 text-stone-500 border-stone-200" },
};

const blankLine = (): FormLine => ({
  key: crypto.randomUUID(),
  itemId: "",
  itemCode: "",
  description: "",
  quantity: "1",
  unitCost: "0",
  expenseGlAccountCode: "",
});

export default function PurchaseInvoicesPage() {
  const { alert, confirm } = useAppDialog();
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [allLines, setAllLines] = useState<PurchaseInvoiceLine[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<AccountingItem[]>([]);
  const [accounts, setAccounts] = useState<ChartAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<PurchaseInvoiceStatus | "All">("All");
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<PurchaseInvoice | null>(null);
  const [viewTarget, setViewTarget] = useState<PurchaseInvoice | null>(null);
  const [form, setForm] = useState<InvoiceForm>({
    invoiceNo: "",
    supplierInvoiceNo: "",
    invoiceDate: todayISO(),
    dueDate: plusDaysISO(30),
    supplierId: "",
    supplierCode: "",
    supplierName: "",
    apGlAccountCode: "2110",
    notes: "",
  });
  const [formLines, setFormLines] = useState<FormLine[]>([blankLine()]);

  useEffect(() => {
    Promise.all([
      dbSelectAll("purchase_invoices"),
      dbSelectAll("purchase_invoice_lines"),
      dbSelectAll("suppliers"),
      dbSelectAll("items"),
      dbSelectAll("chart_of_accounts"),
    ]).then(([invoiceRows, lineRows, supplierRows, itemRows, accountRows]) => {
      setInvoices(invoiceRows.map(rowToInvoice));
      setAllLines(lineRows.map(rowToLine));
      setSuppliers(supplierRows as Supplier[]);
      setItems(itemRows as AccountingItem[]);
      setAccounts(accountRows as ChartAccount[]);
      setIsLoading(false);
    });
  }, []);

  const activeSuppliers = useMemo(
    () => suppliers.filter((supplier) => supplier.status === "Active").sort((a, b) => a.supplierCode.localeCompare(b.supplierCode)),
    [suppliers],
  );

  const activeItems = useMemo(
    () => items.filter((item) => item.status === "Active").sort((a, b) => a.itemCode.localeCompare(b.itemCode)),
    [items],
  );

  const postableAccounts = useMemo(
    () => accounts.filter((account) => !account.isHeader && account.status === "Active").sort((a, b) => a.code.localeCompare(b.code)),
    [accounts],
  );

  const liabilityAccounts = useMemo(
    () => postableAccounts.filter((account) => account.type === "Liability"),
    [postableAccounts],
  );

  const expenseAccounts = useMemo(
    () => postableAccounts.filter((account) => account.type === "Expense"),
    [postableAccounts],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return invoices
      .filter((invoice) => {
        const matchesStatus = filterStatus === "All" || invoice.status === filterStatus;
        const matchesSearch =
          !q ||
          invoice.invoiceNo.toLowerCase().includes(q) ||
          invoice.supplierInvoiceNo.toLowerCase().includes(q) ||
          invoice.supplierName.toLowerCase().includes(q) ||
          invoice.supplierCode.toLowerCase().includes(q) ||
          invoice.notes.toLowerCase().includes(q);
        return matchesStatus && matchesSearch;
      })
      .sort((a, b) => b.invoiceDate.localeCompare(a.invoiceDate));
  }, [invoices, search, filterStatus]);

  const stats = useMemo(() => ({
    total: invoices.length,
    draft: invoices.filter((invoice) => invoice.status === "Draft").length,
    posted: invoices.filter((invoice) => invoice.status === "Posted").length,
    payable: invoices.filter((invoice) => invoice.status === "Posted").reduce((sum, invoice) => sum + invoice.totalAmount, 0),
  }), [invoices]);

  const formTotals = useMemo(() => {
    const subtotal = formLines.reduce((sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.unitCost) || 0), 0);
    return { subtotal, total: subtotal };
  }, [formLines]);

  const viewLines = useMemo(
    () => viewTarget ? allLines.filter((line) => line.purchaseInvoiceId === viewTarget.id).sort((a, b) => a.lineNo - b.lineNo) : [],
    [allLines, viewTarget],
  );

  function nextInvoiceNo(): string {
    return `PI-${new Date().getFullYear()}-${String(invoices.length + 1001).padStart(4, "0")}`;
  }

  function openAdd() {
    setForm({
      invoiceNo: nextInvoiceNo(),
      supplierInvoiceNo: "",
      invoiceDate: todayISO(),
      dueDate: plusDaysISO(30),
      supplierId: "",
      supplierCode: "",
      supplierName: "",
      apGlAccountCode: "2110",
      notes: "",
    });
    setFormLines([blankLine()]);
    setEditTarget(null);
    setShowForm(true);
  }

  function openEdit(invoice: PurchaseInvoice) {
    const lines = allLines.filter((line) => line.purchaseInvoiceId === invoice.id).sort((a, b) => a.lineNo - b.lineNo);
    setForm({
      invoiceNo: invoice.invoiceNo,
      supplierInvoiceNo: invoice.supplierInvoiceNo,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      supplierId: invoice.supplierId ?? "",
      supplierCode: invoice.supplierCode,
      supplierName: invoice.supplierName,
      apGlAccountCode: invoice.apGlAccountCode,
      notes: invoice.notes,
    });
    setFormLines(lines.length ? lines.map((line) => ({
      key: line.id,
      itemId: line.itemId ?? "",
      itemCode: line.itemCode,
      description: line.description,
      quantity: String(line.quantity),
      unitCost: String(line.unitCost),
      expenseGlAccountCode: line.expenseGlAccountCode,
    })) : [blankLine()]);
    setEditTarget(invoice);
    setShowForm(true);
  }

  function handleSupplierChange(supplierId: string) {
    const supplier = activeSuppliers.find((candidate) => candidate.id === supplierId);
    setForm((prev) => ({
      ...prev,
      supplierId,
      supplierCode: supplier?.supplierCode ?? "",
      supplierName: supplier?.name ?? "",
    }));
  }

  function handleItemChange(key: string, itemId: string) {
    const item = activeItems.find((candidate) => candidate.id === itemId);
    setFormLines((prev) => prev.map((line) => (
      line.key === key
        ? {
            ...line,
            itemId,
            itemCode: item?.itemCode ?? "",
            description: item?.name ?? "",
            unitCost: String(item?.purchaseCost ?? 0),
            expenseGlAccountCode: item?.expenseGlAccountCode ?? line.expenseGlAccountCode,
          }
        : line
    )));
  }

  function cleanLines(invoiceId: string): PurchaseInvoiceLine[] {
    return formLines
      .map((line, index) => {
        const quantity = Number(line.quantity) || 0;
        const unitCost = Number(line.unitCost) || 0;
        return {
          id: newId(),
          purchaseInvoiceId: invoiceId,
          lineNo: index + 1,
          itemId: line.itemId || null,
          itemCode: line.itemCode,
          description: line.description,
          quantity,
          unitCost,
          expenseGlAccountCode: line.expenseGlAccountCode,
          lineTotal: quantity * unitCost,
        };
      })
      .filter((line) => line.description.trim() && line.quantity > 0 && line.unitCost > 0 && line.expenseGlAccountCode);
  }

  async function handleSave() {
    if (!form.invoiceNo.trim() || !form.supplierName.trim() || !form.apGlAccountCode.trim()) return;

    const invoiceId = editTarget?.id ?? newId();
    const lines = cleanLines(invoiceId);
    if (lines.length === 0) {
      await alert("Add at least one valid line with an expense GL account.", { variant: "warning" });
      return;
    }

    const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
    if (subtotal <= 0) {
      await alert("Purchase invoice total must be greater than zero.", { variant: "warning" });
      return;
    }

    const invoice: PurchaseInvoice = {
      id: invoiceId,
      invoiceNo: form.invoiceNo.trim(),
      supplierInvoiceNo: form.supplierInvoiceNo.trim(),
      invoiceDate: form.invoiceDate,
      dueDate: form.dueDate,
      supplierId: form.supplierId || null,
      supplierCode: form.supplierCode.trim(),
      supplierName: form.supplierName.trim(),
      apGlAccountCode: form.apGlAccountCode,
      subtotal,
      totalAmount: subtotal,
      status: editTarget?.status ?? "Draft",
      journalEntryId: editTarget?.journalEntryId ?? null,
      notes: form.notes,
    };

    if (editTarget) {
      setInvoices((prev) => prev.map((existing) => existing.id === editTarget.id ? invoice : existing));
      setAllLines((prev) => [...prev.filter((line) => line.purchaseInvoiceId !== editTarget.id), ...lines]);
      dbUpdate("purchase_invoices", editTarget.id, invoice);
      await dbDeleteWhere("purchase_invoice_lines", "purchase_invoice_id", editTarget.id);
    } else {
      setInvoices((prev) => [...prev, invoice]);
      setAllLines((prev) => [...prev, ...lines]);
      dbInsert("purchase_invoices", invoice);
    }

    for (const line of lines) dbInsert("purchase_invoice_lines", line);
    setShowForm(false);
  }

  async function handlePost(invoice: PurchaseInvoice) {
    if (invoice.status !== "Draft") return;
    const lines = allLines.filter((line) => line.purchaseInvoiceId === invoice.id);
    if (lines.length === 0) {
      await alert("This invoice has no lines to post.", { variant: "warning" });
      return;
    }

    if (!(await confirm(`Post purchase invoice "${invoice.invoiceNo}" to Expense and AP?`, { variant: "info" }))) return;

    const journalEntryId = newId();
    dbInsert("journal_entries", {
      id: journalEntryId,
      entryNo: `JE-PI-${invoice.invoiceNo.replace(/^PI-/, "")}`,
      entryDate: invoice.invoiceDate,
      fiscalYear: fiscalYearFromDate(invoice.invoiceDate),
      fiscalPeriod: fiscalPeriodFromDate(invoice.invoiceDate),
      description: `Purchase Invoice ${invoice.invoiceNo} - ${invoice.supplierName}`,
      referenceNo: invoice.invoiceNo,
      sourceType: "Invoice",
      sourceId: invoice.id,
      status: "Posted",
      createdBy: "Accounting",
      postedBy: "Accounting",
      postedAt: new Date().toISOString(),
    });
    lines.forEach((line, index) => {
      dbInsert("journal_entry_lines", {
        id: newId(),
        journalEntryId,
        lineNo: index + 1,
        accountCode: line.expenseGlAccountCode,
        debitAmount: line.lineTotal,
        creditAmount: 0,
        description: line.description,
      });
    });
    dbInsert("journal_entry_lines", {
      id: newId(),
      journalEntryId,
      lineNo: lines.length + 1,
      accountCode: invoice.apGlAccountCode,
      debitAmount: 0,
      creditAmount: invoice.totalAmount,
      description: `AP - ${invoice.invoiceNo}`,
    });

    const patch = { status: "Posted" as PurchaseInvoiceStatus, journalEntryId };
    setInvoices((prev) => prev.map((existing) => existing.id === invoice.id ? { ...existing, ...patch } : existing));
    setViewTarget((prev) => prev?.id === invoice.id ? { ...prev, ...patch } : prev);
    dbUpdate("purchase_invoices", invoice.id, patch);
  }

  async function handleVoid(invoice: PurchaseInvoice) {
    if (invoice.status === "Void") return;
    if (await confirm(`Void purchase invoice "${invoice.invoiceNo}"?`, { variant: "danger" })) {
      setInvoices((prev) => prev.map((existing) => existing.id === invoice.id ? { ...existing, status: "Void" } : existing));
      setViewTarget((prev) => prev?.id === invoice.id ? { ...prev, status: "Void" } : prev);
      dbUpdate("purchase_invoices", invoice.id, { status: "Void" });
    }
  }

  async function handleDelete(id: string) {
    const invoice = invoices.find((candidate) => candidate.id === id);
    if (!invoice || invoice.status !== "Draft") return;
    if (await confirm(`Delete draft purchase invoice "${invoice.invoiceNo}"?`, { variant: "danger" })) {
      setInvoices((prev) => prev.filter((existing) => existing.id !== id));
      setAllLines((prev) => prev.filter((line) => line.purchaseInvoiceId !== id));
      dbDelete("purchase_invoices", id);
    }
  }

  const columns: STSNColumn<PurchaseInvoice>[] = [
    { title: "Invoice No.", data: "invoiceNo", render: (_: any, row) => <span className="font-mono text-xs font-semibold text-stone-700">{row.invoiceNo}</span>, width: "125px" },
    {
      title: "Supplier",
      data: "supplierName",
      render: (_: any, row) => (
        <div>
          <p className="text-xs font-semibold text-stone-800">{row.supplierName}</p>
          <p className="text-[10px] text-stone-400 font-mono">{row.supplierCode || "No supplier code"}</p>
        </div>
      ),
    },
    { title: "Supplier Inv.", data: "supplierInvoiceNo", render: (value: string) => <span className="font-mono text-xs text-stone-600">{value || "-"}</span>, width: "120px" },
    { title: "Invoice Date", data: "invoiceDate", width: "115px" },
    { title: "Due Date", data: "dueDate", width: "115px" },
    { title: "Total", data: "totalAmount", className: "text-right", render: (value: number) => <span className="font-mono text-xs font-bold text-stone-900">PHP {fmt(value)}</span>, width: "120px" },
    { title: "AP Account", data: "apGlAccountCode", render: (value: string) => <span className="font-mono text-xs text-stone-600">{value}</span>, width: "95px" },
    {
      title: "Status",
      data: "status",
      render: (_: any, row) => <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_CONFIG[row.status].badgeClass}`}>{STATUS_CONFIG[row.status].label}</span>,
      width: "95px",
    },
    {
      title: "",
      data: "id",
      orderable: false,
      searchable: false,
      render: (_: any, row) => (
        <div className="flex items-center gap-1.5 justify-end">
          <button onClick={() => setViewTarget(row)} title="View invoice" className="p-1 rounded-lg hover:bg-blue-50 text-stone-400 hover:text-blue-600 transition cursor-pointer"><Eye className="w-3.5 h-3.5" /></button>
          {row.status === "Draft" && (
            <>
              <button onClick={() => openEdit(row)} title="Edit invoice" className="p-1 rounded-lg hover:bg-amber-50 text-stone-400 hover:text-amber-600 transition cursor-pointer"><Edit2 className="w-3.5 h-3.5" /></button>
              <button onClick={() => handlePost(row)} title="Post invoice" className="p-1 rounded-lg hover:bg-emerald-50 text-stone-400 hover:text-emerald-600 transition cursor-pointer"><Send className="w-3.5 h-3.5" /></button>
              <button onClick={() => handleDelete(row.id)} title="Delete draft" className="p-1 rounded-lg hover:bg-rose-50 text-stone-400 hover:text-rose-500 transition cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
            </>
          )}
        </div>
      ),
      width: "115px",
    },
  ];

  const lineColumns: STSNColumn<PurchaseInvoiceLine>[] = [
    { title: "#", data: "lineNo", width: "45px" },
    { title: "Item", data: "itemCode", render: (value: string) => <span className="font-mono text-xs text-stone-600">{value || "-"}</span>, width: "95px" },
    { title: "Description", data: "description" },
    { title: "Qty", data: "quantity", className: "text-right", render: (value: number) => <span className="font-mono text-xs">{fmt(value)}</span>, width: "75px" },
    { title: "Unit Cost", data: "unitCost", className: "text-right", render: (value: number) => <span className="font-mono text-xs">PHP {fmt(value)}</span>, width: "110px" },
    { title: "Expense GL", data: "expenseGlAccountCode", render: (value: string) => <span className="font-mono text-xs">{value}</span>, width: "100px" },
    { title: "Line Total", data: "lineTotal", className: "text-right", render: (value: number) => <span className="font-mono text-xs font-bold">PHP {fmt(value)}</span>, width: "115px" },
  ];

  return (
    <div className="space-y-5 animate-fade-in font-sans">
      <div className="p-5 bg-white border border-stsn-beige rounded-xl shadow-sm flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-semibold text-stone-900 tracking-tight flex items-center gap-2">
            <FileInput className="w-5 h-5 text-stsn-brown" />
            Purchase Invoice
          </h2>
          <p className="text-stone-500 text-xs mt-1">Record vendor invoices and post them to Expense and Accounts Payable.</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 px-3.5 py-2 bg-stsn-brown text-white text-xs font-bold rounded-xl hover:bg-stsn-brown-dark transition shadow-sm cursor-pointer flex-shrink-0">
          <Plus className="w-3.5 h-3.5" /> New Purchase Invoice
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-stone-200 rounded-xl px-4 py-3 text-center shadow-sm"><p className="text-[10px] font-mono uppercase tracking-wider text-stone-400">Total</p><p className="text-xl font-bold text-stone-800 mt-0.5">{stats.total}</p><p className="text-[9px] text-stone-400">Invoices</p></div>
        <div className="bg-white border border-stone-200 rounded-xl px-4 py-3 text-center shadow-sm"><p className="text-[10px] font-mono uppercase tracking-wider text-stone-400">Draft</p><p className="text-xl font-bold text-amber-600 mt-0.5">{stats.draft}</p><p className="text-[9px] text-stone-400">Unposted</p></div>
        <div className="bg-white border border-stone-200 rounded-xl px-4 py-3 text-center shadow-sm"><p className="text-[10px] font-mono uppercase tracking-wider text-stone-400">Posted</p><p className="text-xl font-bold text-emerald-600 mt-0.5">{stats.posted}</p><p className="text-[9px] text-stone-400">In AP</p></div>
        <div className="bg-white border border-stone-200 rounded-xl px-4 py-3 text-center shadow-sm"><p className="text-[10px] font-mono uppercase tracking-wider text-stone-400">Payable</p><p className="text-xl font-bold text-blue-600 mt-0.5">PHP {fmt(stats.payable)}</p><p className="text-[9px] text-stone-400">Posted total</p></div>
      </div>

      <div className="bg-white border border-stsn-beige rounded-xl px-4 py-3 shadow-sm flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invoice, supplier, or notes..." className="w-full pl-8 pr-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50" />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-stone-400" />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as PurchaseInvoiceStatus | "All")} className="text-xs border border-stone-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-stsn-gold/50">
            <option value="All">All Statuses</option>
            {Object.keys(STATUS_CONFIG).map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 text-xs text-stone-500 hover:text-stone-700 border border-stone-200 rounded-lg hover:bg-stone-50 transition cursor-pointer">
          <Download className="w-3.5 h-3.5" /> Export
        </button>
      </div>

      <div className="bg-white border border-stsn-beige rounded-xl shadow-sm overflow-hidden p-1">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-stone-400 text-xs"><Loader2 className="w-4 h-4 animate-spin" /> Loading purchase invoices...</div>
        ) : (
          <STSNDataTable columns={columns} rows={filtered} searchable={false} emptyMessage="No purchase invoices match your search." pageLength={10} />
        )}
      </div>

      {showForm && (
        <div className="app-modal-backdrop z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl border border-stone-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between flex-shrink-0">
              <h3 className="text-sm font-bold text-stone-800">{editTarget ? "Edit Purchase Invoice" : "New Purchase Invoice"}</h3>
              <button onClick={() => setShowForm(false)} className="text-stone-400 hover:text-stone-600 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                <div><label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Invoice No. *</label><input value={form.invoiceNo} onChange={(e) => setForm((prev) => ({ ...prev, invoiceNo: e.target.value }))} className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50 font-mono" /></div>
                <div><label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Supplier Inv.</label><input value={form.supplierInvoiceNo} onChange={(e) => setForm((prev) => ({ ...prev, supplierInvoiceNo: e.target.value }))} className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50 font-mono" /></div>
                <div><label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Invoice Date</label><input type="date" value={form.invoiceDate} onChange={(e) => setForm((prev) => ({ ...prev, invoiceDate: e.target.value }))} className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50" /></div>
                <div><label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Due Date</label><input type="date" value={form.dueDate} onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))} className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50" /></div>
                <div><label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">AP GL Account</label><select value={form.apGlAccountCode} onChange={(e) => setForm((prev) => ({ ...prev, apGlAccountCode: e.target.value }))} className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50">{liabilityAccounts.map((account) => <option key={account.code} value={account.code}>{account.code} - {account.name}</option>)}</select></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div><label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Supplier *</label><select value={form.supplierId} onChange={(e) => handleSupplierChange(e.target.value)} className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50"><option value="">Select supplier</option>{activeSuppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.supplierCode} - {supplier.name}</option>)}</select></div>
                <div><label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Supplier Name *</label><input value={form.supplierName} onChange={(e) => setForm((prev) => ({ ...prev, supplierName: e.target.value }))} className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50" /></div>
                <div><label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Supplier Code</label><input value={form.supplierCode} onChange={(e) => setForm((prev) => ({ ...prev, supplierCode: e.target.value }))} className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50 font-mono" /></div>
              </div>

              <div className="border border-stone-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-stone-700">Invoice Lines</h4>
                  <button onClick={() => setFormLines((prev) => [...prev, blankLine()])} className="flex items-center gap-1.5 text-xs font-bold text-stsn-brown hover:text-stsn-brown-dark cursor-pointer"><PlusCircle className="w-3.5 h-3.5" /> Add Line</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-stone-50 text-[10px] uppercase tracking-wider text-stone-500"><tr><th className="text-left px-3 py-2 min-w-[170px]">Item</th><th className="text-left px-3 py-2 min-w-[210px]">Description</th><th className="text-right px-3 py-2 w-24">Qty</th><th className="text-right px-3 py-2 w-32">Unit Cost</th><th className="text-left px-3 py-2 min-w-[170px]">Expense GL</th><th className="text-right px-3 py-2 w-32">Total</th><th className="w-10" /></tr></thead>
                    <tbody className="divide-y divide-stone-100">
                      {formLines.map((line) => (
                        <tr key={line.key}>
                          <td className="px-3 py-2"><select value={line.itemId} onChange={(e) => handleItemChange(line.key, e.target.value)} className="w-full px-2 py-1.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50"><option value="">Manual line</option>{activeItems.map((item) => <option key={item.id} value={item.id}>{item.itemCode} - {item.name}</option>)}</select></td>
                          <td className="px-3 py-2"><input value={line.description} onChange={(e) => setFormLines((prev) => prev.map((candidate) => candidate.key === line.key ? { ...candidate, description: e.target.value } : candidate))} className="w-full px-2 py-1.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50" /></td>
                          <td className="px-3 py-2"><input type="number" min="0" value={line.quantity} onChange={(e) => setFormLines((prev) => prev.map((candidate) => candidate.key === line.key ? { ...candidate, quantity: e.target.value } : candidate))} className="w-full px-2 py-1.5 border border-stone-200 rounded-lg text-right focus:outline-none focus:ring-1 focus:ring-stsn-gold/50" /></td>
                          <td className="px-3 py-2"><input type="number" min="0" value={line.unitCost} onChange={(e) => setFormLines((prev) => prev.map((candidate) => candidate.key === line.key ? { ...candidate, unitCost: e.target.value } : candidate))} className="w-full px-2 py-1.5 border border-stone-200 rounded-lg text-right focus:outline-none focus:ring-1 focus:ring-stsn-gold/50" /></td>
                          <td className="px-3 py-2"><select value={line.expenseGlAccountCode} onChange={(e) => setFormLines((prev) => prev.map((candidate) => candidate.key === line.key ? { ...candidate, expenseGlAccountCode: e.target.value } : candidate))} className="w-full px-2 py-1.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50"><option value="">Select expense</option>{expenseAccounts.map((account) => <option key={account.code} value={account.code}>{account.code} - {account.name}</option>)}</select></td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-stone-800">PHP {fmt((Number(line.quantity) || 0) * (Number(line.unitCost) || 0))}</td>
                          <td className="px-3 py-2"><button onClick={() => setFormLines((prev) => prev.length === 1 ? prev : prev.filter((candidate) => candidate.key !== line.key))} className="p-1 rounded-lg text-stone-400 hover:text-rose-500 hover:bg-rose-50 cursor-pointer"><Trash className="w-3.5 h-3.5" /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2"><label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Notes</label><textarea value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} rows={3} className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50 resize-none" /></div>
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2"><div className="flex justify-between text-xs"><span className="text-stone-500">Subtotal</span><span className="font-mono font-bold">PHP {fmt(formTotals.subtotal)}</span></div><div className="flex justify-between text-sm border-t border-stone-200 pt-2"><span className="font-bold text-stone-700">Total</span><span className="font-mono font-black text-stone-900">PHP {fmt(formTotals.total)}</span></div></div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-stone-100 flex justify-between items-center flex-shrink-0 gap-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-xs font-semibold text-stone-500 hover:text-stone-700 border border-stone-200 rounded-xl hover:bg-stone-50 transition cursor-pointer">Cancel</button>
              <button onClick={handleSave} disabled={!form.invoiceNo.trim() || !form.supplierName.trim()} className="px-4 py-2 text-xs font-bold text-white bg-stsn-brown hover:bg-stsn-brown-dark rounded-xl transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">{editTarget ? "Save Changes" : "Add Purchase Invoice"}</button>
            </div>
          </div>
        </div>
      )}

      {viewTarget && (
        <div className="app-modal-backdrop z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl border border-stone-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between flex-shrink-0">
              <div><h3 className="text-sm font-bold text-stone-800">{viewTarget.invoiceNo}</h3><p className="text-[10px] text-stone-400">{viewTarget.supplierName} - Due {viewTarget.dueDate}</p></div>
              <button onClick={() => setViewTarget(null)} className="text-stone-400 hover:text-stone-600 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-stone-50 rounded-xl border border-stone-200 p-3"><p className="text-[10px] text-stone-400 uppercase font-mono">Status</p><span className={`inline-flex mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_CONFIG[viewTarget.status].badgeClass}`}>{STATUS_CONFIG[viewTarget.status].label}</span></div>
                <div className="bg-stone-50 rounded-xl border border-stone-200 p-3"><p className="text-[10px] text-stone-400 uppercase font-mono">Invoice Date</p><p className="text-xs font-bold text-stone-800 mt-1">{viewTarget.invoiceDate}</p></div>
                <div className="bg-stone-50 rounded-xl border border-stone-200 p-3"><p className="text-[10px] text-stone-400 uppercase font-mono">AP Account</p><p className="text-xs font-bold text-stone-800 mt-1">{viewTarget.apGlAccountCode}</p></div>
                <div className="bg-stone-50 rounded-xl border border-stone-200 p-3"><p className="text-[10px] text-stone-400 uppercase font-mono">Total</p><p className="text-xs font-mono font-black text-stone-900 mt-1">PHP {fmt(viewTarget.totalAmount)}</p></div>
              </div>
              <STSNDataTable columns={lineColumns} rows={viewLines} searchable={false} emptyMessage="No invoice lines found." pageLength={10} />
              {viewTarget.notes && <p className="text-xs text-stone-500 bg-stone-50 border border-stone-200 rounded-xl p-3">{viewTarget.notes}</p>}
            </div>
            <div className="px-6 py-4 border-t border-stone-100 flex justify-between items-center flex-shrink-0 gap-2">
              <button onClick={() => setViewTarget(null)} className="px-4 py-2 text-xs font-semibold text-stone-500 hover:text-stone-700 border border-stone-200 rounded-xl hover:bg-stone-50 transition cursor-pointer">Close</button>
              <div className="flex items-center gap-2">
                {viewTarget.status === "Draft" && <button onClick={() => handlePost(viewTarget)} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition cursor-pointer"><Send className="w-3.5 h-3.5" /> Post Invoice</button>}
                {viewTarget.status !== "Void" && <button onClick={() => handleVoid(viewTarget)} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition cursor-pointer"><Ban className="w-3.5 h-3.5" /> Void</button>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

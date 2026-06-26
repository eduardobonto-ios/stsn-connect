import React, { useEffect, useMemo, useState } from "react";
import {
  FileText, Plus, Eye, Edit2, Trash2, Search, Filter, Download,
  Loader2, X, Send, Ban, PlusCircle, Trash,
} from "lucide-react";
import STSNDataTable, { type STSNColumn } from "../../../../components/common/STSNDataTable";
import ModulePageHeader from "../../../../components/common/ModulePageHeader";
import { useAppDialog } from "../../../../components/common/useAppDialog";
import { dbDelete, dbDeleteWhere, dbInsert, dbSelectAll, dbUpdate, newId } from "../../../../services/supabaseCrud";

type SalesInvoiceStatus = "Draft" | "Posted" | "Paid" | "Void";

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
  status: SalesInvoiceStatus;
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

interface AccountingItem {
  id: string;
  itemCode: string;
  name: string;
  type: string;
  description: string;
  unit: string;
  salesPrice: number;
  revenueGlAccountCode: string | null;
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

interface StudentCustomer {
  id: string;
  studentNo: string;
  firstName: string;
  lastName: string;
}

interface FormLine {
  key: string;
  itemId: string;
  itemCode: string;
  description: string;
  quantity: string;
  unitPrice: string;
  revenueGlAccountCode: string;
}

interface InvoiceForm {
  invoiceNo: string;
  invoiceDate: string;
  dueDate: string;
  customerId: string;
  customerName: string;
  customerNo: string;
  arGlAccountCode: string;
  discountAmount: string;
  notes: string;
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
    status: (r.status ?? "Draft") as SalesInvoiceStatus,
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

const STATUS_CONFIG: Record<SalesInvoiceStatus, { label: string; badgeClass: string }> = {
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
  unitPrice: "0",
  revenueGlAccountCode: "",
});

export default function SalesInvoicesPage() {
  const { alert, confirm } = useAppDialog();
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [allLines, setAllLines] = useState<SalesInvoiceLine[]>([]);
  const [items, setItems] = useState<AccountingItem[]>([]);
  const [accounts, setAccounts] = useState<ChartAccount[]>([]);
  const [students, setStudents] = useState<StudentCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<SalesInvoiceStatus | "All">("All");
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<SalesInvoice | null>(null);
  const [viewTarget, setViewTarget] = useState<SalesInvoice | null>(null);
  const [form, setForm] = useState<InvoiceForm>({
    invoiceNo: "",
    invoiceDate: todayISO(),
    dueDate: plusDaysISO(30),
    customerId: "",
    customerName: "",
    customerNo: "",
    arGlAccountCode: "1130",
    discountAmount: "0",
    notes: "",
  });
  const [formLines, setFormLines] = useState<FormLine[]>([blankLine()]);

  useEffect(() => {
    Promise.all([
      dbSelectAll("sales_invoices"),
      dbSelectAll("sales_invoice_lines"),
      dbSelectAll("items"),
      dbSelectAll("chart_of_accounts"),
      dbSelectAll("students"),
    ]).then(([invoiceRows, lineRows, itemRows, accountRows, studentRows]) => {
      setInvoices(invoiceRows.map(rowToInvoice));
      setAllLines(lineRows.map(rowToLine));
      setItems(itemRows as AccountingItem[]);
      setAccounts(accountRows as ChartAccount[]);
      setStudents(studentRows as StudentCustomer[]);
      setIsLoading(false);
    });
  }, []);

  const activeItems = useMemo(
    () => items.filter((item) => item.status === "Active").sort((a, b) => a.itemCode.localeCompare(b.itemCode)),
    [items],
  );

  const postableAccounts = useMemo(
    () => accounts.filter((account) => !account.isHeader && account.status === "Active").sort((a, b) => a.code.localeCompare(b.code)),
    [accounts],
  );

  const assetAccounts = useMemo(
    () => postableAccounts.filter((account) => account.type === "Asset"),
    [postableAccounts],
  );

  const revenueAccounts = useMemo(
    () => postableAccounts.filter((account) => account.type === "Revenue"),
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
          invoice.customerName.toLowerCase().includes(q) ||
          invoice.customerNo.toLowerCase().includes(q) ||
          invoice.notes.toLowerCase().includes(q);
        return matchesStatus && matchesSearch;
      })
      .sort((a, b) => b.invoiceDate.localeCompare(a.invoiceDate));
  }, [invoices, search, filterStatus]);

  const stats = useMemo(() => ({
    total: invoices.length,
    draft: invoices.filter((invoice) => invoice.status === "Draft").length,
    posted: invoices.filter((invoice) => invoice.status === "Posted").length,
    receivable: invoices.filter((invoice) => invoice.status === "Posted").reduce((sum, invoice) => sum + invoice.totalAmount, 0),
  }), [invoices]);

  const formTotals = useMemo(() => {
    const subtotal = formLines.reduce((sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0), 0);
    const discount = Number(form.discountAmount) || 0;
    return { subtotal, discount, total: Math.max(0, subtotal - discount) };
  }, [formLines, form.discountAmount]);

  const viewLines = useMemo(
    () => viewTarget ? allLines.filter((line) => line.salesInvoiceId === viewTarget.id).sort((a, b) => a.lineNo - b.lineNo) : [],
    [allLines, viewTarget],
  );

  function nextInvoiceNo(): string {
    return `SI-${new Date().getFullYear()}-${String(invoices.length + 1001).padStart(4, "0")}`;
  }

  function openAdd() {
    setForm({
      invoiceNo: nextInvoiceNo(),
      invoiceDate: todayISO(),
      dueDate: plusDaysISO(30),
      customerId: "",
      customerName: "",
      customerNo: "",
      arGlAccountCode: "1130",
      discountAmount: "0",
      notes: "",
    });
    setFormLines([blankLine()]);
    setEditTarget(null);
    setShowForm(true);
  }

  function openEdit(invoice: SalesInvoice) {
    const lines = allLines.filter((line) => line.salesInvoiceId === invoice.id).sort((a, b) => a.lineNo - b.lineNo);
    setForm({
      invoiceNo: invoice.invoiceNo,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      customerId: invoice.customerId ?? "",
      customerName: invoice.customerName,
      customerNo: invoice.customerNo,
      arGlAccountCode: invoice.arGlAccountCode,
      discountAmount: String(invoice.discountAmount),
      notes: invoice.notes,
    });
    setFormLines(lines.length ? lines.map((line) => ({
      key: line.id,
      itemId: line.itemId ?? "",
      itemCode: line.itemCode,
      description: line.description,
      quantity: String(line.quantity),
      unitPrice: String(line.unitPrice),
      revenueGlAccountCode: line.revenueGlAccountCode,
    })) : [blankLine()]);
    setEditTarget(invoice);
    setShowForm(true);
  }

  function handleCustomerChange(studentId: string) {
    const student = students.find((candidate) => candidate.id === studentId);
    setForm((prev) => ({
      ...prev,
      customerId: studentId,
      customerName: student ? `${student.lastName}, ${student.firstName}` : "",
      customerNo: student?.studentNo ?? "",
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
            unitPrice: String(item?.salesPrice ?? 0),
            revenueGlAccountCode: item?.revenueGlAccountCode ?? line.revenueGlAccountCode,
          }
        : line
    )));
  }

  function cleanLines(invoiceId: string): SalesInvoiceLine[] {
    return formLines
      .map((line, index) => {
        const quantity = Number(line.quantity) || 0;
        const unitPrice = Number(line.unitPrice) || 0;
        return {
          id: newId(),
          salesInvoiceId: invoiceId,
          lineNo: index + 1,
          itemId: line.itemId || null,
          itemCode: line.itemCode,
          description: line.description,
          quantity,
          unitPrice,
          revenueGlAccountCode: line.revenueGlAccountCode,
          lineTotal: quantity * unitPrice,
        };
      })
      .filter((line) => line.description.trim() && line.quantity > 0 && line.unitPrice > 0 && line.revenueGlAccountCode);
  }

  async function handleSave() {
    if (!form.invoiceNo.trim() || !form.customerName.trim() || !form.arGlAccountCode.trim()) return;

    const invoiceId = editTarget?.id ?? newId();
    const lines = cleanLines(invoiceId);
    if (lines.length === 0) {
      await alert("Add at least one valid line with a revenue GL account.", { variant: "warning" });
      return;
    }

    const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
    const discountAmount = Number(form.discountAmount) || 0;
    const totalAmount = Math.max(0, subtotal - discountAmount);
    if (totalAmount <= 0) {
      await alert("Sales invoice total must be greater than zero.", { variant: "warning" });
      return;
    }
    const invoice: SalesInvoice = {
      id: invoiceId,
      invoiceNo: form.invoiceNo.trim(),
      invoiceDate: form.invoiceDate,
      dueDate: form.dueDate,
      customerType: "Student",
      customerId: form.customerId || null,
      customerName: form.customerName.trim(),
      customerNo: form.customerNo.trim(),
      arGlAccountCode: form.arGlAccountCode,
      subtotal,
      discountAmount,
      totalAmount,
      status: editTarget?.status ?? "Draft",
      journalEntryId: editTarget?.journalEntryId ?? null,
      notes: form.notes,
    };

    if (editTarget) {
      setInvoices((prev) => prev.map((existing) => existing.id === editTarget.id ? invoice : existing));
      setAllLines((prev) => [...prev.filter((line) => line.salesInvoiceId !== editTarget.id), ...lines]);
      dbUpdate("sales_invoices", editTarget.id, invoice);
      await dbDeleteWhere("sales_invoice_lines", "sales_invoice_id", editTarget.id);
    } else {
      setInvoices((prev) => [...prev, invoice]);
      setAllLines((prev) => [...prev, ...lines]);
      dbInsert("sales_invoices", invoice);
    }

    for (const line of lines) dbInsert("sales_invoice_lines", line);
    setShowForm(false);
  }

  async function handlePost(invoice: SalesInvoice) {
    if (invoice.status !== "Draft") return;
    const lines = allLines.filter((line) => line.salesInvoiceId === invoice.id);
    if (lines.length === 0) {
      await alert("This invoice has no lines to post.", { variant: "warning" });
      return;
    }

    if (!(await confirm(`Post sales invoice "${invoice.invoiceNo}" to AR and Revenue?`, { variant: "info" }))) return;

    const journalEntryId = newId();
    const journalEntry = {
      id: journalEntryId,
      entryNo: `JE-SI-${invoice.invoiceNo.replace(/^SI-/, "")}`,
      entryDate: invoice.invoiceDate,
      fiscalYear: fiscalYearFromDate(invoice.invoiceDate),
      fiscalPeriod: fiscalPeriodFromDate(invoice.invoiceDate),
      description: `Sales Invoice ${invoice.invoiceNo} - ${invoice.customerName}`,
      referenceNo: invoice.invoiceNo,
      sourceType: "Invoice",
      sourceId: invoice.id,
      status: "Posted",
      createdBy: "Accounting",
      postedBy: "Accounting",
      postedAt: new Date().toISOString(),
    };

    dbInsert("journal_entries", journalEntry);
    dbInsert("journal_entry_lines", {
      id: newId(),
      journalEntryId,
      lineNo: 1,
      accountCode: invoice.arGlAccountCode,
      debitAmount: invoice.totalAmount,
      creditAmount: 0,
      description: `AR - ${invoice.invoiceNo}`,
    });
    let creditedTotal = 0;
    lines.forEach((line, index) => {
      const creditAmount = index === lines.length - 1
        ? Math.max(0, invoice.totalAmount - creditedTotal)
        : Math.round((line.lineTotal / invoice.subtotal) * invoice.totalAmount * 100) / 100;
      creditedTotal += creditAmount;
      dbInsert("journal_entry_lines", {
        id: newId(),
        journalEntryId,
        lineNo: index + 2,
        accountCode: line.revenueGlAccountCode,
        debitAmount: 0,
        creditAmount,
        description: line.description,
      });
    });

    const patch = { status: "Posted" as SalesInvoiceStatus, journalEntryId };
    setInvoices((prev) => prev.map((existing) => existing.id === invoice.id ? { ...existing, ...patch } : existing));
    setViewTarget((prev) => prev?.id === invoice.id ? { ...prev, ...patch } : prev);
    dbUpdate("sales_invoices", invoice.id, patch);
  }

  async function handleVoid(invoice: SalesInvoice) {
    if (invoice.status === "Void") return;
    if (await confirm(`Void sales invoice "${invoice.invoiceNo}"?`, { variant: "danger" })) {
      setInvoices((prev) => prev.map((existing) => existing.id === invoice.id ? { ...existing, status: "Void" } : existing));
      setViewTarget((prev) => prev?.id === invoice.id ? { ...prev, status: "Void" } : prev);
      dbUpdate("sales_invoices", invoice.id, { status: "Void" });
    }
  }

  async function handleDelete(id: string) {
    const invoice = invoices.find((candidate) => candidate.id === id);
    if (!invoice || invoice.status !== "Draft") return;
    if (await confirm(`Delete draft sales invoice "${invoice.invoiceNo}"?`, { variant: "danger" })) {
      setInvoices((prev) => prev.filter((existing) => existing.id !== id));
      setAllLines((prev) => prev.filter((line) => line.salesInvoiceId !== id));
      dbDelete("sales_invoices", id);
    }
  }

  const columns: STSNColumn<SalesInvoice>[] = [
    {
      title: "Invoice No.",
      data: "invoiceNo",
      render: (_: any, row: SalesInvoice) => <span className="font-mono text-xs font-semibold text-stone-700">{row.invoiceNo}</span>,
      width: "125px",
    },
    {
      title: "Customer",
      data: "customerName",
      render: (_: any, row: SalesInvoice) => (
        <div>
          <p className="text-xs font-semibold text-stone-800">{row.customerName}</p>
          <p className="text-[10px] text-stone-400 font-mono">{row.customerNo || "No customer no."}</p>
        </div>
      ),
    },
    { title: "Invoice Date", data: "invoiceDate", width: "115px" },
    { title: "Due Date", data: "dueDate", width: "115px" },
    {
      title: "Total",
      data: "totalAmount",
      className: "text-right",
      render: (value: number) => <span className="font-mono text-xs font-bold text-stone-900">PHP {fmt(value)}</span>,
      width: "120px",
    },
    {
      title: "AR Account",
      data: "arGlAccountCode",
      render: (value: string) => <span className="font-mono text-xs text-stone-600">{value}</span>,
      width: "95px",
    },
    {
      title: "Status",
      data: "status",
      render: (_: any, row: SalesInvoice) => {
        const cfg = STATUS_CONFIG[row.status];
        return <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.badgeClass}`}>{cfg.label}</span>;
      },
      width: "95px",
    },
    {
      title: "",
      data: "id",
      orderable: false,
      searchable: false,
      render: (_: any, row: SalesInvoice) => (
        <div className="flex items-center gap-1.5 justify-end">
          <button onClick={() => setViewTarget(row)} title="View invoice" className="p-1 rounded-lg hover:bg-blue-50 text-stone-400 hover:text-blue-600 transition cursor-pointer">
            <Eye className="w-3.5 h-3.5" />
          </button>
          {row.status === "Draft" && (
            <>
              <button onClick={() => openEdit(row)} title="Edit invoice" className="p-1 rounded-lg hover:bg-amber-50 text-stone-400 hover:text-amber-600 transition cursor-pointer">
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => handlePost(row)} title="Post invoice" className="p-1 rounded-lg hover:bg-emerald-50 text-stone-400 hover:text-emerald-600 transition cursor-pointer">
                <Send className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => handleDelete(row.id)} title="Delete draft" className="p-1 rounded-lg hover:bg-rose-50 text-stone-400 hover:text-rose-500 transition cursor-pointer">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      ),
      width: "115px",
    },
  ];

  const lineColumns: STSNColumn<SalesInvoiceLine>[] = [
    { title: "#", data: "lineNo", width: "45px" },
    { title: "Item", data: "itemCode", render: (_: any, row: SalesInvoiceLine) => <span className="font-mono text-xs text-stone-600">{row.itemCode || "-"}</span>, width: "95px" },
    { title: "Description", data: "description" },
    { title: "Qty", data: "quantity", className: "text-right", render: (value: number) => <span className="font-mono text-xs">{fmt(value)}</span>, width: "75px" },
    { title: "Unit Price", data: "unitPrice", className: "text-right", render: (value: number) => <span className="font-mono text-xs">PHP {fmt(value)}</span>, width: "110px" },
    { title: "Revenue GL", data: "revenueGlAccountCode", render: (value: string) => <span className="font-mono text-xs">{value}</span>, width: "100px" },
    { title: "Line Total", data: "lineTotal", className: "text-right", render: (value: number) => <span className="font-mono text-xs font-bold">PHP {fmt(value)}</span>, width: "115px" },
  ];

  return (
    <div className="space-y-5 animate-fade-in font-sans">
      <ModulePageHeader
        badge="Accounts Receivable"
        badgeIcon={FileText}
        title="Sales Invoice"
        subtitle="Create receivable invoices and post them to Accounts Receivable and Revenue accounts."
        actions={
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-xl shadow-lg transition cursor-pointer bg-[#C5A059] hover:bg-[#d4af68] text-[#1C1512]"
          >
            <Plus className="w-4 h-4" /> New Sales Invoice
          </button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-stone-200 rounded-xl px-4 py-3 text-center shadow-sm">
          <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400">Total</p>
          <p className="text-xl font-bold text-stone-800 mt-0.5">{stats.total}</p>
          <p className="text-[9px] text-stone-400">Invoices</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl px-4 py-3 text-center shadow-sm">
          <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400">Draft</p>
          <p className="text-xl font-bold text-amber-600 mt-0.5">{stats.draft}</p>
          <p className="text-[9px] text-stone-400">Unposted</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl px-4 py-3 text-center shadow-sm">
          <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400">Posted</p>
          <p className="text-xl font-bold text-emerald-600 mt-0.5">{stats.posted}</p>
          <p className="text-[9px] text-stone-400">In AR</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl px-4 py-3 text-center shadow-sm">
          <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400">Receivable</p>
          <p className="text-xl font-bold text-blue-600 mt-0.5">PHP {fmt(stats.receivable)}</p>
          <p className="text-[9px] text-stone-400">Posted total</p>
        </div>
      </div>

      <div className="bg-white border border-stsn-beige rounded-xl px-4 py-3 shadow-sm flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invoice, customer, or notes..." className="w-full pl-8 pr-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50" />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-stone-400" />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as SalesInvoiceStatus | "All")} className="text-xs border border-stone-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-stsn-gold/50">
            <option value="All">All Statuses</option>
            {Object.keys(STATUS_CONFIG).map((status) => <option key={status} value={status}>{status}</option>)}
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
            Loading sales invoices...
          </div>
        ) : (
          <STSNDataTable columns={columns} rows={filtered} searchable={false} emptyMessage="No sales invoices match your search." pageLength={10} />
        )}
      </div>

      {showForm && (
        <div className="app-modal-backdrop z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl border border-stone-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between flex-shrink-0">
              <h3 className="text-sm font-bold text-stone-800">{editTarget ? "Edit Sales Invoice" : "New Sales Invoice"}</h3>
              <button onClick={() => setShowForm(false)} className="text-stone-400 hover:text-stone-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Invoice No. *</label>
                  <input value={form.invoiceNo} onChange={(e) => setForm((prev) => ({ ...prev, invoiceNo: e.target.value }))} className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50 font-mono" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Invoice Date</label>
                  <input type="date" value={form.invoiceDate} onChange={(e) => setForm((prev) => ({ ...prev, invoiceDate: e.target.value }))} className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Due Date</label>
                  <input type="date" value={form.dueDate} onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))} className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">AR GL Account</label>
                  <select value={form.arGlAccountCode} onChange={(e) => setForm((prev) => ({ ...prev, arGlAccountCode: e.target.value }))} className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50">
                    {assetAccounts.map((account) => <option key={account.code} value={account.code}>{account.code} - {account.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Student Customer *</label>
                  <select value={form.customerId} onChange={(e) => handleCustomerChange(e.target.value)} className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50">
                    <option value="">Select student</option>
                    {students.map((student) => <option key={student.id} value={student.id}>{student.studentNo} - {student.lastName}, {student.firstName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Customer Name *</label>
                  <input value={form.customerName} onChange={(e) => setForm((prev) => ({ ...prev, customerName: e.target.value }))} className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Customer No.</label>
                  <input value={form.customerNo} onChange={(e) => setForm((prev) => ({ ...prev, customerNo: e.target.value }))} className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50 font-mono" />
                </div>
              </div>

              <div className="border border-stone-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-stone-700">Invoice Lines</h4>
                  <button onClick={() => setFormLines((prev) => [...prev, blankLine()])} className="flex items-center gap-1.5 text-xs font-bold text-stsn-brown hover:text-stsn-brown-dark cursor-pointer">
                    <PlusCircle className="w-3.5 h-3.5" />
                    Add Line
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-stone-50 text-[10px] uppercase tracking-wider text-stone-500">
                      <tr>
                        <th className="text-left px-3 py-2 min-w-[170px]">Item</th>
                        <th className="text-left px-3 py-2 min-w-[210px]">Description</th>
                        <th className="text-right px-3 py-2 w-24">Qty</th>
                        <th className="text-right px-3 py-2 w-32">Unit Price</th>
                        <th className="text-left px-3 py-2 min-w-[170px]">Revenue GL</th>
                        <th className="text-right px-3 py-2 w-32">Total</th>
                        <th className="w-10" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {formLines.map((line) => (
                        <tr key={line.key}>
                          <td className="px-3 py-2">
                            <select value={line.itemId} onChange={(e) => handleItemChange(line.key, e.target.value)} className="w-full px-2 py-1.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50">
                              <option value="">Manual line</option>
                              {activeItems.map((item) => <option key={item.id} value={item.id}>{item.itemCode} - {item.name}</option>)}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <input value={line.description} onChange={(e) => setFormLines((prev) => prev.map((candidate) => candidate.key === line.key ? { ...candidate, description: e.target.value } : candidate))} className="w-full px-2 py-1.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50" />
                          </td>
                          <td className="px-3 py-2">
                            <input type="number" min="0" value={line.quantity} onChange={(e) => setFormLines((prev) => prev.map((candidate) => candidate.key === line.key ? { ...candidate, quantity: e.target.value } : candidate))} className="w-full px-2 py-1.5 border border-stone-200 rounded-lg text-right focus:outline-none focus:ring-1 focus:ring-stsn-gold/50" />
                          </td>
                          <td className="px-3 py-2">
                            <input type="number" min="0" value={line.unitPrice} onChange={(e) => setFormLines((prev) => prev.map((candidate) => candidate.key === line.key ? { ...candidate, unitPrice: e.target.value } : candidate))} className="w-full px-2 py-1.5 border border-stone-200 rounded-lg text-right focus:outline-none focus:ring-1 focus:ring-stsn-gold/50" />
                          </td>
                          <td className="px-3 py-2">
                            <select value={line.revenueGlAccountCode} onChange={(e) => setFormLines((prev) => prev.map((candidate) => candidate.key === line.key ? { ...candidate, revenueGlAccountCode: e.target.value } : candidate))} className="w-full px-2 py-1.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50">
                              <option value="">Select revenue</option>
                              {revenueAccounts.map((account) => <option key={account.code} value={account.code}>{account.code} - {account.name}</option>)}
                            </select>
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-stone-800">PHP {fmt((Number(line.quantity) || 0) * (Number(line.unitPrice) || 0))}</td>
                          <td className="px-3 py-2">
                            <button onClick={() => setFormLines((prev) => prev.length === 1 ? prev : prev.filter((candidate) => candidate.key !== line.key))} className="p-1 rounded-lg text-stone-400 hover:text-rose-500 hover:bg-rose-50 cursor-pointer">
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Notes</label>
                  <textarea value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} rows={3} className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stsn-gold/50 resize-none" />
                </div>
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-xs"><span className="text-stone-500">Subtotal</span><span className="font-mono font-bold">PHP {fmt(formTotals.subtotal)}</span></div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Discount</label>
                    <input type="number" min="0" value={form.discountAmount} onChange={(e) => setForm((prev) => ({ ...prev, discountAmount: e.target.value }))} className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg text-right focus:outline-none focus:ring-1 focus:ring-stsn-gold/50" />
                  </div>
                  <div className="flex justify-between text-sm border-t border-stone-200 pt-2"><span className="font-bold text-stone-700">Total</span><span className="font-mono font-black text-stone-900">PHP {fmt(formTotals.total)}</span></div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-stone-100 flex justify-between items-center flex-shrink-0 gap-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-xs font-semibold text-stone-500 hover:text-stone-700 border border-stone-200 rounded-xl hover:bg-stone-50 transition cursor-pointer">Cancel</button>
              <button onClick={handleSave} disabled={!form.invoiceNo.trim() || !form.customerName.trim()} className="px-4 py-2 text-xs font-bold text-white bg-stsn-brown hover:bg-stsn-brown-dark rounded-xl transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                {editTarget ? "Save Changes" : "Add Sales Invoice"}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewTarget && (
        <div className="app-modal-backdrop z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl border border-stone-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-sm font-bold text-stone-800">{viewTarget.invoiceNo}</h3>
                <p className="text-[10px] text-stone-400">{viewTarget.customerName} - Due {viewTarget.dueDate}</p>
              </div>
              <button onClick={() => setViewTarget(null)} className="text-stone-400 hover:text-stone-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-stone-50 rounded-xl border border-stone-200 p-3">
                  <p className="text-[10px] text-stone-400 uppercase font-mono">Status</p>
                  <span className={`inline-flex mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_CONFIG[viewTarget.status].badgeClass}`}>{STATUS_CONFIG[viewTarget.status].label}</span>
                </div>
                <div className="bg-stone-50 rounded-xl border border-stone-200 p-3">
                  <p className="text-[10px] text-stone-400 uppercase font-mono">Invoice Date</p>
                  <p className="text-xs font-bold text-stone-800 mt-1">{viewTarget.invoiceDate}</p>
                </div>
                <div className="bg-stone-50 rounded-xl border border-stone-200 p-3">
                  <p className="text-[10px] text-stone-400 uppercase font-mono">AR Account</p>
                  <p className="text-xs font-bold text-stone-800 mt-1">{viewTarget.arGlAccountCode}</p>
                </div>
                <div className="bg-stone-50 rounded-xl border border-stone-200 p-3">
                  <p className="text-[10px] text-stone-400 uppercase font-mono">Total</p>
                  <p className="text-xs font-mono font-black text-stone-900 mt-1">PHP {fmt(viewTarget.totalAmount)}</p>
                </div>
              </div>
              <STSNDataTable columns={lineColumns} rows={viewLines} searchable={false} emptyMessage="No invoice lines found." pageLength={10} />
              {viewTarget.notes && <p className="text-xs text-stone-500 bg-stone-50 border border-stone-200 rounded-xl p-3">{viewTarget.notes}</p>}
            </div>
            <div className="px-6 py-4 border-t border-stone-100 flex justify-between items-center flex-shrink-0 gap-2">
              <button onClick={() => setViewTarget(null)} className="px-4 py-2 text-xs font-semibold text-stone-500 hover:text-stone-700 border border-stone-200 rounded-xl hover:bg-stone-50 transition cursor-pointer">Close</button>
              <div className="flex items-center gap-2">
                {viewTarget.status === "Draft" && (
                  <button onClick={() => handlePost(viewTarget)} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition cursor-pointer">
                    <Send className="w-3.5 h-3.5" />
                    Post Invoice
                  </button>
                )}
                {viewTarget.status !== "Void" && (
                  <button onClick={() => handleVoid(viewTarget)} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition cursor-pointer">
                    <Ban className="w-3.5 h-3.5" />
                    Void
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

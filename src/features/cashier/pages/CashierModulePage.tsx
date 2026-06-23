/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from "react";
import { useSTSNStore } from "../../../services/store";
import { Payment, Student, StudentAssessment } from "../../../types";
import {
  Wallet, Search, Receipt, History, CheckCircle, AlertCircle,
  Banknote, Printer, Package, Info, X, Clock, ListChecks,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { PreviewModal, ReceiptPreview } from "../../../components/ModalPreviews";
import STSNDataTable, { type STSNColumn } from "../../../components/common/STSNDataTable";
import { getAccountingLabels, ASSESSMENT_APPROVAL_STATUS_CONFIG, DEFAULT_ASSESSMENT_APPROVAL_STATUS } from "../../../config/accounting.config";
import { academicUnitToDepartment } from "../../../config/schools.config";
import { BookPackage } from "../../../types";

type CashierTab = "queue" | "history";

const PAYMENT_METHODS: Payment["paymentMethod"][] = ["Cash", "GCash", "Bank Transfer", "Credit Card"];
const PAYMENT_REMITTANCE_TERMS: Payment["term"][] = ["Downpayment", "Midterm", "Finals", "Full Payment", "Installment"];

/** Resolves the assigned book package for an assessment, if books were availed (Basic Ed only). */
function getBookPackageInfo(assessment: StudentAssessment, bookPackages: BookPackage[]) {
  if (!assessment.booksAvailed) return undefined;
  return bookPackages.find((p) => p.id === assessment.bookPackageId);
}

/** Builds the Basic Ed vs College academic info line for a queue/history row. */
function getAcademicLine(student: Student | undefined, unit: "basic-ed" | "college"): string {
  const labels = getAccountingLabels(unit);
  if (unit === "basic-ed") {
    return `${labels.levelLabel}: ${student?.yearLevel || "—"} • ${labels.groupLabel}: ${student?.section || "—"}`;
  }
  return `${labels.programLabel}: ${student?.trackOrCourse || "—"} • ${labels.levelLabel}: ${student?.yearLevel || "—"}`;
}

/** Slices a list of records to the given page (1-indexed) and page size. */
function paginateRecords<T>(records: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return records.slice(start, start + pageSize);
}

/** Compact previous/page-number/next pagination footer for card lists. */
function CardPagination({
  page, totalRecords, pageSize, onPageChange,
}: { page: number; totalRecords: number; pageSize: number; onPageChange: (page: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  if (totalRecords <= pageSize) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(totalRecords, page * pageSize);

  return (
    <div className="mt-3 pt-3 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-2">
      <p className="text-[10px] text-stone-400 font-mono">Showing {start}-{end} of {totalRecords} records</p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md border border-stsn-beige text-stsn-brown hover:bg-stsn-cream transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronLeft className="w-3 h-3" /> Previous
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`text-[10px] font-bold w-6 h-6 rounded-md border transition cursor-pointer ${p === page ? "bg-stsn-brown text-stsn-cream border-stsn-brown" : "border-stsn-beige text-stsn-brown hover:bg-stsn-cream"}`}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md border border-stsn-beige text-stsn-brown hover:bg-stsn-cream transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          Next <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

export default function CashierModule() {
  const { students, assessments, payments, currentUser, academicUnit, addPayment, bookPackages } = useSTSNStore();
  const [activeTab, setActiveTab] = useState<CashierTab>("queue");
  const [searchQuery, setSearchQuery] = useState("");

  const [collectModalId, setCollectModalId] = useState<string | null>(null);
  const [paymentForm, setPaymentForm] = useState<{ orNumber: string; amount: string; paymentMethod: Payment["paymentMethod"]; term: Payment["term"]; reference: string }>({
    orNumber: "", amount: "", paymentMethod: "Cash", term: "Installment", reference: "",
  });
  const [orError, setOrError] = useState<string | null>(null);

  const [receipt, setReceipt] = useState<{ payment: Payment; student: Student; assessment?: StudentAssessment } | null>(null);

  const rowsPerPage = 5;
  const [approvedPage, setApprovedPage] = useState(1);
  const [pendingPage, setPendingPage] = useState(1);

  const departmentFilter = academicUnitToDepartment(academicUnit);

  useEffect(() => {
    setApprovedPage(1);
    setPendingPage(1);
  }, [searchQuery, academicUnit]);

  const matchesSearch = (student: Student | undefined) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return `${student?.firstName} ${student?.lastName}`.toLowerCase().includes(q) || (student?.studentNo || "").toLowerCase().includes(q);
  };

  // Payment Queue — Approved for Payment assessments with an outstanding balance, scoped to this school's academic unit.
  const queueRows = useMemo(() => {
    return assessments
      .filter((a) => a.approvalStatus === "Approved for Payment" && a.balance > 0)
      .map((a) => ({ assessment: a, student: students.find((s) => s.id === a.studentId) }))
      .filter(({ student }) => student?.department === departmentFilter && matchesSearch(student));
  }, [assessments, students, departmentFilter, searchQuery]);

  // Awaiting Accounting — visible for context only, never actionable by Cashier.
  const awaitingRows = useMemo(() => {
    return assessments
      .filter((a) => !!a.approvalStatus && (a.approvalStatus !== "Approved for Payment" || a.balance <= 0))
      .map((a) => ({ assessment: a, student: students.find((s) => s.id === a.studentId) }))
      .filter(({ student, assessment }) => student?.department === departmentFilter && matchesSearch(student) && assessment.balance > 0);
  }, [assessments, students, departmentFilter, searchQuery]);

  // Collection History — all payments posted against students in this academic unit.
  const historyRows = useMemo(() => {
    return payments
      .map((p) => ({
        payment: p,
        student: students.find((s) => s.id === p.studentId),
        // Prefer the specific assessment the payment was collected against; fall back to first match.
        assessment: p.assessmentId
          ? assessments.find((a) => a.id === p.assessmentId)
          : assessments.find((a) => a.studentId === p.studentId),
      }))
      .filter(({ student }) => student?.department === departmentFilter && matchesSearch(student))
      .sort((a, b) => b.payment.paymentDate.localeCompare(a.payment.paymentDate));
  }, [payments, students, assessments, departmentFilter, searchQuery]);

  const paginatedQueueRows = useMemo(() => paginateRecords(queueRows, approvedPage, rowsPerPage), [queueRows, approvedPage]);
  const paginatedAwaitingRows = useMemo(() => paginateRecords(awaitingRows, pendingPage, rowsPerPage), [awaitingRows, pendingPage]);

  const collectRow = queueRows.find((r) => r.assessment.id === collectModalId);

  const openCollect = (assessmentId: string) => {
    const row = queueRows.find((r) => r.assessment.id === assessmentId);
    setPaymentForm({ orNumber: "", amount: row ? String(row.assessment.balance) : "", paymentMethod: "Cash", term: "Installment", reference: "" });
    setOrError(null);
    setCollectModalId(assessmentId);
  };

  const handlePostPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectRow?.student) return;
    const amount = Number(paymentForm.amount);
    if (!amount || amount <= 0) return;

    const orNumber = paymentForm.orNumber.trim();
    if (!orNumber) { setOrError("BIR Official Receipt No. is required."); return; }
    if (payments.some((p) => p.orNumber === orNumber)) {
      setOrError(`OR No. "${orNumber}" has already been used. Check your receipt booklet.`);
      return;
    }
    setOrError(null);

    const posted = addPayment({
      studentId: collectRow.student.id,
      assessmentId: collectRow.assessment.id,
      schoolId: collectRow.student.schoolId,
      orNumber,
      amount,
      paymentMethod: paymentForm.paymentMethod,
      term: paymentForm.term,
      remarks: `Collected by ${currentUser?.name || "Cashier"} via Cashiering module${paymentForm.reference ? ` — Ref: ${paymentForm.reference}` : ""}`,
    });

    setCollectModalId(null);
    setReceipt({
      payment: posted,
      student: collectRow.student,
      assessment: { ...collectRow.assessment, balance: Math.max(0, collectRow.assessment.balance - amount) },
    });
  };

  const reprintReceipt = (row: { payment: Payment; student?: Student; assessment?: StudentAssessment }) => {
    if (!row.student) return;
    setReceipt({ payment: row.payment, student: row.student, assessment: row.assessment });
  };

  const historyColumns: STSNColumn<{ payment: Payment; student?: Student; assessment?: StudentAssessment }>[] = [
    {
      title: "OR Number",
      data: "payment.orNumber",
      className: "font-mono font-bold text-stsn-brown",
    },
    {
      title: "Student",
      data: "student.lastName",
      render: (_value, row) => (
        <>
          <span className="font-semibold text-stone-800">{row.student ? `${row.student.lastName}, ${row.student.firstName}` : "Unknown Student"}</span>
          <span className="text-[10px] text-stone-400 block font-mono">{row.student?.studentNo}</span>
        </>
      ),
    },
    { title: "Date", data: "payment.paymentDate", className: "font-mono text-stone-600" },
    { title: "Method", data: "payment.paymentMethod", className: "text-stone-600" },
    { title: "Term", data: "payment.term", className: "text-stone-600" },
    {
      title: "Amount",
      data: "payment.amount",
      className: "text-right font-mono font-bold text-stone-800",
      render: (value: number) => `₱${value.toLocaleString()}`,
    },
    {
      title: "Receipt",
      className: "text-right",
      orderable: false,
      searchable: false,
      render: (_value, row) => (
        <button
          onClick={() => reprintReceipt(row)}
          className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-stsn-cream text-stsn-brown border border-stsn-beige hover:bg-stsn-beige cursor-pointer transition"
        >
          <Printer className="w-3 h-3" /> View
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="p-5 bg-white border border-stsn-beige rounded-xl shadow-sm">
        <h2 className="text-xl font-display font-semibold text-stone-900 tracking-tight flex items-center gap-2">
          <Wallet className="w-5 h-5 text-stsn-brown" />
          Cashiering Office
        </h2>
        <p className="text-stone-500 text-xs mt-1">
          Collect payments on assessments approved by Accounting, preview official receipts, and review collection history.
          Cashier cannot edit fees, discounts, books, or assessment approval status.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl border border-stsn-beige shadow-sm overflow-hidden">
        <div className="flex border-b border-stone-100">
          <button
            onClick={() => setActiveTab("queue")}
            className={`flex-1 py-3 px-4 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${activeTab === "queue" ? "tab-active-gradient" : "text-stone-500 hover:bg-stone-50"}`}
          >
            <Receipt className="w-4 h-4" />
            Payment Queue
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-3 px-4 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${activeTab === "history" ? "tab-active-gradient" : "text-stone-500 hover:bg-stone-50"}`}
          >
            <History className="w-4 h-4" />
            Collection History
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-stsn-beige shadow-sm p-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 text-stone-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by student name or student no..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-md py-1.5 pl-8 pr-3 text-xs focus:ring-1 focus:ring-stsn-brown focus:outline-none font-medium"
          />
        </div>
      </div>

      {/* ===================== PAYMENT QUEUE ===================== */}
      {activeTab === "queue" && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white rounded-xl border border-stsn-beige shadow-sm p-4">
            <h3 className="text-sm font-display font-bold text-stone-900 flex items-center gap-2 mb-1">
              <Receipt className="w-4 h-4 text-stsn-gold" /> Approved for Payment
            </h3>
            <p className="text-xs text-stone-500 mb-3">
              Only assessments approved by Accounting and with an outstanding balance appear here.
            </p>
            {queueRows.length === 0 ? (
              <p className="text-xs text-stone-400 italic p-6 text-center">No approved assessments awaiting payment.</p>
            ) : (
              <div className="space-y-3">
                {paginatedQueueRows.map(({ assessment, student }) => {
                  const books = getBookPackageInfo(assessment, bookPackages);
                  const netPayable = Math.max(0, assessment.totalAmount - assessment.discountAmount);
                  return (
                    <div key={assessment.id} className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${ASSESSMENT_APPROVAL_STATUS_CONFIG["Approved for Payment"].badgeClass}`}>
                            {ASSESSMENT_APPROVAL_STATUS_CONFIG["Approved for Payment"].label}
                          </span>
                          {books && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border text-purple-700 bg-purple-50 border-purple-200 flex items-center gap-1">
                              <Package className="w-3 h-3" /> {books.packageName}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-bold text-stone-900">{student ? `${student.lastName}, ${student.firstName}` : "Unknown Student"}</p>
                        <p className="text-[10px] font-mono text-stone-400">{student?.studentNo}</p>
                        <p className="text-[10px] text-stone-500 mt-0.5">{getAcademicLine(student, academicUnit)} • {assessment.schoolYear}</p>
                        <p className="text-[10px] text-stone-500">Payment Term: {assessment.paymentTerm}</p>
                      </div>
                      <div className="text-right flex flex-col items-end justify-between">
                        <div>
                          <p className="text-[9px] uppercase font-mono text-stone-400">Net Payable</p>
                          <p className="text-sm font-display font-black text-stone-900">₱{netPayable.toLocaleString()}</p>
                          <p className="text-[9px] uppercase font-mono text-stone-400 mt-1">Balance Due</p>
                          <p className="text-base font-display font-black text-emerald-700">₱{assessment.balance.toLocaleString()}</p>
                        </div>
                        <button
                          onClick={() => openCollect(assessment.id)}
                          className="mt-2 flex items-center gap-1.5 bg-stsn-brown text-stsn-cream text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer hover:bg-stsn-brown-dark transition"
                        >
                          <Banknote className="w-3.5 h-3.5" /> Collect Payment
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <CardPagination page={approvedPage} totalRecords={queueRows.length} pageSize={rowsPerPage} onPageChange={setApprovedPage} />
          </div>

          {/* Awaiting Accounting — read-only context, not actionable */}
          {awaitingRows.length > 0 && (
            <div className="bg-white rounded-xl border border-stsn-beige shadow-sm p-4">
              <h3 className="text-sm font-display font-bold text-stone-900 flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-stone-400" /> Awaiting Accounting Approval
              </h3>
              <p className="text-xs text-stone-500 mb-3">
                These assessments are not yet approved for payment and cannot be collected at the Cashier window.
              </p>
              <div className="space-y-2">
                {paginatedAwaitingRows.map(({ assessment, student }) => {
                  const status = assessment.approvalStatus || DEFAULT_ASSESSMENT_APPROVAL_STATUS;
                  const cfg = ASSESSMENT_APPROVAL_STATUS_CONFIG[status];
                  return (
                    <div key={assessment.id} className="flex items-center justify-between bg-stone-50 border border-stone-200 rounded-lg p-3 opacity-80">
                      <div>
                        <p className="text-xs font-bold text-stone-700">{student ? `${student.lastName}, ${student.firstName}` : "Unknown Student"}</p>
                        <p className="text-[10px] font-mono text-stone-400">{student?.studentNo} • {getAcademicLine(student, academicUnit)}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${cfg.badgeClass}`}>{cfg.label}</span>
                        <p className="text-[10px] text-stone-400 mt-1">Balance: ₱{assessment.balance.toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <CardPagination page={pendingPage} totalRecords={awaitingRows.length} pageSize={rowsPerPage} onPageChange={setPendingPage} />
            </div>
          )}
        </div>
      )}

      {/* ===================== COLLECTION HISTORY ===================== */}
      {activeTab === "history" && (
        <div className="bg-white rounded-xl border border-stsn-beige shadow-sm p-4 animate-fade-in">
          <h3 className="text-sm font-display font-bold text-stone-900 flex items-center gap-2 mb-1">
            <ListChecks className="w-4 h-4 text-stsn-gold" /> Payment Collection History
          </h3>
          <p className="text-xs text-stone-500 mb-3">All payments posted for students in this academic unit.</p>
          <STSNDataTable
            columns={historyColumns}
            rows={historyRows}
            emptyMessage="No payments recorded yet."
          />
        </div>
      )}

      {/* ===================== COLLECT PAYMENT MODAL ===================== */}
      {collectRow && (
        <PreviewModal isOpen={true} onClose={() => setCollectModalId(null)} title="Collect Payment" hidePrint>
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2 text-blue-700">
              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>Fees, discounts, books, and approval status are read-only and were set by Accounting. Cashier may only record a payment.</span>
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 space-y-1.5">
              <p className="text-sm font-bold text-stone-900">{collectRow.student ? `${collectRow.student.lastName}, ${collectRow.student.firstName}` : "—"}</p>
              <p className="font-mono text-stone-400">{collectRow.student?.studentNo}</p>
              <p className="text-stone-500">{getAcademicLine(collectRow.student, academicUnit)} • {collectRow.assessment.schoolYear}</p>
              {/* Fee breakdown table */}
              {collectRow.assessment.fees && collectRow.assessment.fees.length > 0 && (() => {
                const groups: Record<string, { feeName: string; amount: number }[]> = {};
                for (const fee of collectRow.assessment.fees) {
                  if (!groups[fee.category]) groups[fee.category] = [];
                  groups[fee.category].push({ feeName: fee.feeName, amount: fee.amount });
                }
                return (
                  <div className="pt-2 border-t border-stone-200">
                    <p className="text-[9px] uppercase font-mono text-stone-400 mb-1.5">Fee Breakdown</p>
                    <div className="space-y-2">
                      {Object.entries(groups).map(([category, fees]) => (
                        <div key={category}>
                          <p className="text-[9px] font-bold uppercase text-stone-500 mb-0.5">{category}</p>
                          {fees.map((fee, i) => (
                            <div key={i} className="flex justify-between pl-2 text-[10px]">
                              <span className="text-stone-600">{fee.feeName}</span>
                              <span className="font-mono text-stone-700">₱{fee.amount.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Books */}
              {getBookPackageInfo(collectRow.assessment, bookPackages) && (
                <div className="pt-2 border-t border-stone-200">
                  <p className="text-[9px] uppercase font-mono text-stone-400 mb-1.5">Books</p>
                  {(() => {
                    const pkg = getBookPackageInfo(collectRow.assessment, bookPackages)!;
                    return (
                      <div className="space-y-0.5">
                        <div className="flex justify-between items-center">
                          <span className="flex items-center gap-1 text-purple-700 font-semibold text-[10px]">
                            <Package className="w-3 h-3" /> {pkg.packageName}
                          </span>
                          <span className="font-mono text-[10px] text-stone-700">₱{pkg.totalAmount.toLocaleString()}</span>
                        </div>
                        {pkg.books.map((book) => (
                          <div key={book.id} className="flex justify-between pl-4 text-[9px] text-stone-500">
                            <span>{book.title}</span>
                            <span className="font-mono">₱{book.unitPrice.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Totals summary */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-200">
                <div>
                  <p className="text-[9px] uppercase font-mono text-stone-400">Total Assessment</p>
                  <p className="font-mono font-bold text-stone-800">₱{collectRow.assessment.totalAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase font-mono text-stone-400">
                    Discount{collectRow.assessment.discountPercentage > 0 ? ` (${collectRow.assessment.discountPercentage}%)` : ""}
                  </p>
                  <p className="font-mono font-bold text-emerald-700">
                    {collectRow.assessment.discountAmount > 0 ? `-₱${collectRow.assessment.discountAmount.toLocaleString()}` : "₱0"}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] uppercase font-mono text-stone-400">Payment Term</p>
                  <p className="font-bold text-stone-800">{collectRow.assessment.paymentTerm}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase font-mono text-stone-400">Balance Due</p>
                  <p className="font-mono font-bold text-emerald-700">₱{collectRow.assessment.balance.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handlePostPayment} className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1.5">
                  BIR Official Receipt No. <span className="text-red-500">*</span>
                </label>
                <input
                  type="text" required
                  value={paymentForm.orNumber}
                  onChange={(e) => { setPaymentForm({ ...paymentForm, orNumber: e.target.value }); setOrError(null); }}
                  placeholder="e.g. 0001234 — must match physical receipt booklet"
                  className={`w-full bg-white border rounded-lg py-2 px-3 text-xs font-semibold font-mono focus:outline-none focus:ring-1 focus:ring-stsn-brown ${orError ? "border-red-400 ring-1 ring-red-400" : "border-stone-200"}`}
                />
                {orError && <p className="text-red-600 text-[10px] mt-1 font-semibold">{orError}</p>}
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1.5">Amount to Collect</label>
                <input
                  type="number" min="1" step="0.01" required
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1.5">Payment Method</label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as Payment["paymentMethod"] })}
                    className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown"
                  >
                    {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1.5">Term / Purpose</label>
                  <select
                    value={paymentForm.term}
                    onChange={(e) => setPaymentForm({ ...paymentForm, term: e.target.value as Payment["term"] })}
                    className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown"
                  >
                    {PAYMENT_REMITTANCE_TERMS.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1.5">Reference No. (optional)</label>
                <input
                  type="text"
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                  placeholder="GCash/Bank reference, check no., etc."
                  className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setCollectModalId(null)} className="text-xs font-bold px-3 py-2 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer transition">
                  <CheckCircle className="w-3.5 h-3.5" /> Post Payment
                </button>
              </div>
            </form>
          </div>
        </PreviewModal>
      )}

      {/* ===================== RECEIPT PREVIEW ===================== */}
      {receipt && (
        <PreviewModal isOpen={true} onClose={() => setReceipt(null)} title="Official Receipt">
          <ReceiptPreview
            student={receipt.student}
            assessment={receipt.assessment}
            payment={receipt.payment}
            bookPackage={receipt.assessment ? getBookPackageInfo(receipt.assessment, bookPackages) : undefined}
          />
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-[11px] flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>Receipt preview only. Use the Print button above to print this OR for the payor.</span>
          </div>
          <div className="mt-3 flex justify-end">
            <button onClick={() => setReceipt(null)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer">
              <X className="w-3.5 h-3.5" /> Close
            </button>
          </div>
        </PreviewModal>
      )}
    </div>
  );
}

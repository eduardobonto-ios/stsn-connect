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
  ChevronLeft, ChevronRight, BarChart3, Download, FileText, Ban,
} from "lucide-react";
import ModulePageHeader from "../../../components/common/ModulePageHeader";
import { PreviewModal, ReceiptPreview } from "../../../components/ModalPreviews";
import STSNDataTable, { type STSNColumn } from "../../../components/common/STSNDataTable";
import EmptyState from "../../../components/common/EmptyState";
import { getAccountingLabels, ASSESSMENT_APPROVAL_STATUS_CONFIG, DEFAULT_ASSESSMENT_APPROVAL_STATUS } from "../../../config/accounting.config";
import { BookPackage } from "../../../types";
import { getAcademicScopedData } from "../../../services/academicUnitScopeService";
import { reportExportService } from "../../../services/reportExportService";
import type { ReportColumn, ReportRow } from "../../reports/types";

type CashierTab = "queue" | "history" | "reports";
type CashierReportId =
  | "daily-collection"
  | "or-register"
  | "payment-history"
  | "collection-by-method"
  | "collection-by-cashier"
  | "voided-receipts"
  | "student-payment-summary"
  | "end-of-day-summary";

const PAYMENT_METHODS: Payment["paymentMethod"][] = ["Cash", "GCash", "Bank Transfer", "Credit Card"];
const PAYMENT_REMITTANCE_TERMS: Payment["term"][] = ["Downpayment", "Midterm", "Finals", "Full Payment", "Installment"];

const CASHIER_REPORT_OPTIONS: { id: CashierReportId; title: string; desc: string }[] = [
  { id: "daily-collection", title: "Daily Collection Report", desc: "Collection totals grouped by transaction date." },
  { id: "or-register", title: "OR Register / Receipt List", desc: "Official receipt register with student and payment details." },
  { id: "payment-history", title: "Payment History Report", desc: "Detailed payment posting history." },
  { id: "collection-by-method", title: "Collection by Payment Method", desc: "Collection totals grouped by tender type." },
  { id: "collection-by-cashier", title: "Collection by Cashier", desc: "Collection totals grouped by cashier name." },
  { id: "voided-receipts", title: "Cancelled / Voided Receipt Report", desc: "Voided receipt register when void data is available." },
  { id: "student-payment-summary", title: "Student Payment Summary", desc: "Total payments and remaining balance by student." },
  { id: "end-of-day-summary", title: "End-of-Day Cashier Summary", desc: "Daily cashier collection totals for closing." },
];

const CASHIER_REPORT_COLUMNS: Record<CashierReportId, ReportColumn[]> = {
  "daily-collection": [
    { key: "paymentDate", label: "Date" },
    { key: "transactionCount", label: "Transactions", align: "right" },
    { key: "totalAmount", label: "Total Amount", align: "right" },
  ],
  "or-register": [
    { key: "orNumber", label: "OR Number" },
    { key: "paymentDate", label: "Date" },
    { key: "studentNo", label: "Student No." },
    { key: "studentName", label: "Student" },
    { key: "paymentMethod", label: "Method" },
    { key: "term", label: "Term" },
    { key: "amount", label: "Amount", align: "right" },
  ],
  "payment-history": [
    { key: "paymentDate", label: "Date" },
    { key: "orNumber", label: "OR Number" },
    { key: "studentName", label: "Student" },
    { key: "paymentMethod", label: "Method" },
    { key: "term", label: "Term" },
    { key: "amount", label: "Amount", align: "right" },
    { key: "remarks", label: "Remarks" },
  ],
  "collection-by-method": [
    { key: "paymentMethod", label: "Payment Method" },
    { key: "transactionCount", label: "Transactions", align: "right" },
    { key: "totalAmount", label: "Total Amount", align: "right" },
  ],
  "collection-by-cashier": [
    { key: "cashier", label: "Cashier" },
    { key: "transactionCount", label: "Transactions", align: "right" },
    { key: "totalAmount", label: "Total Amount", align: "right" },
  ],
  "voided-receipts": [
    { key: "orNumber", label: "OR Number" },
    { key: "paymentDate", label: "Date" },
    { key: "studentName", label: "Student" },
    { key: "amount", label: "Amount", align: "right" },
    { key: "status", label: "Status" },
  ],
  "student-payment-summary": [
    { key: "studentNo", label: "Student No." },
    { key: "studentName", label: "Student" },
    { key: "transactionCount", label: "Payments", align: "right" },
    { key: "totalPaid", label: "Total Paid", align: "right" },
    { key: "remainingBalance", label: "Remaining Balance", align: "right" },
    { key: "lastPaymentDate", label: "Last Payment" },
  ],
  "end-of-day-summary": [
    { key: "paymentDate", label: "Date" },
    { key: "cashier", label: "Cashier" },
    { key: "transactionCount", label: "Transactions", align: "right" },
    { key: "totalAmount", label: "Total Amount", align: "right" },
  ],
};

type CashierPaymentRow = { payment: Payment; student?: Student; assessment?: StudentAssessment };

function formatMoney(value: number): string {
  return `₱${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getCashierName(payment: Payment): string {
  const match = payment.remarks?.match(/Collected by (.+?) via Cashiering module/);
  return match?.[1] ?? "Cashier";
}

function groupBy<T>(items: T[], getKey: (item: T) => string): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  items.forEach((item) => {
    const key = getKey(item);
    grouped.set(key, [...(grouped.get(key) ?? []), item]);
  });
  return grouped;
}

function getActiveSetupNames(items: { name: string; isActive?: boolean; sortOrder?: number }[] | undefined, fallback: string[]): string[] {
  const configured = [...(items ?? [])]
    .filter((item) => item.isActive !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name))
    .map((item) => item.name)
    .filter(Boolean);
  return configured.length > 0 ? configured : fallback;
}

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

export default function CashierModule({ subPage, onSubPageChange }: { subPage?: string; onSubPageChange?: (page: string) => void }) {
  const { students, assessments, payments, voidRequests, currentUser, activeSchool, academicUnit, addPayment, submitVoidRequest, bookPackages, setupData } = useSTSNStore();
  const [activeTab, setActiveTab] = useState<CashierTab>((subPage as CashierTab) ?? "queue");

  useEffect(() => {
    if (subPage && subPage !== activeTab) setActiveTab(subPage as CashierTab);
  }, [subPage]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReportId, setSelectedReportId] = useState<CashierReportId>("daily-collection");
  const [reportDateFrom, setReportDateFrom] = useState("");
  const [reportDateTo, setReportDateTo] = useState("");

  const [collectModalId, setCollectModalId] = useState<string | null>(null);
  const [paymentForm, setPaymentForm] = useState<{ orNumber: string; amount: string; paymentMethod: Payment["paymentMethod"]; term: Payment["term"]; reference: string }>({
    orNumber: "", amount: "", paymentMethod: "Cash", term: "Installment", reference: "",
  });
  const [orError, setOrError] = useState<string | null>(null);

  const [receipt, setReceipt] = useState<{ payment: Payment; student: Student; assessment?: StudentAssessment } | null>(null);

  const [voidModalPaymentId, setVoidModalPaymentId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [voidConfirmInput, setVoidConfirmInput] = useState("");

  const rowsPerPage = 5;
  const [approvedPage, setApprovedPage] = useState(1);
  const [pendingPage, setPendingPage] = useState(1);

  const scopedData = useMemo(
    () =>
      getAcademicScopedData({
        currentUser,
        activeSchool,
        academicUnit,
        students,
        assessments,
        payments,
        bookPackages,
      }),
    [currentUser, activeSchool, academicUnit, students, assessments, payments, bookPackages],
  );
  const scopedStudents = scopedData.students;
  const scopedAssessments = scopedData.assessments ?? [];
  const scopedPayments = scopedData.payments ?? [];
  const scopedBookPackages = scopedData.bookPackages ?? [];
  const paymentMethodOptions = useMemo(
    () => getActiveSetupNames(setupData.payment_methods, PAYMENT_METHODS),
    [setupData.payment_methods],
  );
  const paymentRemittanceTermOptions = useMemo(
    () => getActiveSetupNames(setupData.payment_remittance_terms, PAYMENT_REMITTANCE_TERMS),
    [setupData.payment_remittance_terms],
  );

  useEffect(() => {
    setApprovedPage(1);
    setPendingPage(1);
  }, [searchQuery, academicUnit, activeSchool]);

  const matchesSearch = (student: Student | undefined) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return `${student?.firstName} ${student?.lastName}`.toLowerCase().includes(q) || (student?.studentNo || "").toLowerCase().includes(q);
  };

  // Payment Queue — Approved for Payment assessments with an outstanding balance, scoped to this school's academic unit.
  const queueRows = useMemo(() => {
    return scopedAssessments
      .filter((a) => a.approvalStatus === "Approved for Payment" && a.balance > 0)
      .map((a) => ({ assessment: a, student: scopedStudents.find((s) => s.id === a.studentId) }))
      .filter(({ student }) => matchesSearch(student));
  }, [scopedAssessments, scopedStudents, searchQuery]);

  // Awaiting Accounting — visible for context only, never actionable by Cashier.
  const awaitingRows = useMemo(() => {
    return scopedAssessments
      .filter((a) => !!a.approvalStatus && (a.approvalStatus !== "Approved for Payment" || a.balance <= 0))
      .map((a) => ({ assessment: a, student: scopedStudents.find((s) => s.id === a.studentId) }))
      .filter(({ student, assessment }) => matchesSearch(student) && assessment.balance > 0);
  }, [scopedAssessments, scopedStudents, searchQuery]);

  // Collection History — all payments posted against students in this academic unit.
  const historyRows = useMemo(() => {
    return scopedPayments
      .map((p) => ({
        payment: p,
        student: scopedStudents.find((s) => s.id === p.studentId),
        // Prefer the specific assessment the payment was collected against; fall back to first match.
        assessment: p.assessmentId
          ? scopedAssessments.find((a) => a.id === p.assessmentId)
          : scopedAssessments.find((a) => a.studentId === p.studentId),
      }))
      .filter(({ student }) => matchesSearch(student))
      .sort((a, b) => b.payment.paymentDate.localeCompare(a.payment.paymentDate));
  }, [scopedPayments, scopedStudents, scopedAssessments, searchQuery]);

  const reportPaymentRows = useMemo<CashierPaymentRow[]>(() => {
    return historyRows
      .filter(({ payment }) => (!reportDateFrom || payment.paymentDate >= reportDateFrom) && (!reportDateTo || payment.paymentDate <= reportDateTo))
      .sort((a, b) => b.payment.paymentDate.localeCompare(a.payment.paymentDate));
  }, [historyRows, reportDateFrom, reportDateTo]);

  const selectedReport = CASHIER_REPORT_OPTIONS.find((report) => report.id === selectedReportId) ?? CASHIER_REPORT_OPTIONS[0];
  const reportColumns = CASHIER_REPORT_COLUMNS[selectedReportId];

  const reportRows = useMemo<ReportRow[]>(() => {
    if (selectedReportId === "daily-collection") {
      return Array.from(groupBy<CashierPaymentRow>(reportPaymentRows, (row) => row.payment.paymentDate).entries())
        .map(([paymentDate, rows]) => ({
          paymentDate,
          transactionCount: rows.length,
          totalAmount: formatMoney(rows.reduce((sum, row) => sum + row.payment.amount, 0)),
        }))
        .sort((a, b) => String(b.paymentDate).localeCompare(String(a.paymentDate)));
    }

    if (selectedReportId === "or-register") {
      return reportPaymentRows.map(({ payment, student }) => ({
        orNumber: payment.orNumber,
        paymentDate: payment.paymentDate,
        studentNo: student?.studentNo ?? "",
        studentName: student ? `${student.lastName}, ${student.firstName}` : "Unknown Student",
        paymentMethod: payment.paymentMethod,
        term: payment.term,
        amount: formatMoney(payment.amount),
      }));
    }

    if (selectedReportId === "payment-history") {
      return reportPaymentRows.map(({ payment, student }) => ({
        paymentDate: payment.paymentDate,
        orNumber: payment.orNumber,
        studentName: student ? `${student.lastName}, ${student.firstName}` : "Unknown Student",
        paymentMethod: payment.paymentMethod,
        term: payment.term,
        amount: formatMoney(payment.amount),
        remarks: payment.remarks ?? "",
      }));
    }

    if (selectedReportId === "collection-by-method") {
      return Array.from(groupBy<CashierPaymentRow>(reportPaymentRows, (row) => row.payment.paymentMethod || "Unspecified").entries())
        .map(([paymentMethod, rows]) => ({
          paymentMethod,
          transactionCount: rows.length,
          totalAmount: formatMoney(rows.reduce((sum, row) => sum + row.payment.amount, 0)),
        }))
        .sort((a, b) => String(a.paymentMethod).localeCompare(String(b.paymentMethod)));
    }

    if (selectedReportId === "collection-by-cashier") {
      return Array.from(groupBy<CashierPaymentRow>(reportPaymentRows, (row) => getCashierName(row.payment)).entries())
        .map(([cashier, rows]) => ({
          cashier,
          transactionCount: rows.length,
          totalAmount: formatMoney(rows.reduce((sum, row) => sum + row.payment.amount, 0)),
        }))
        .sort((a, b) => String(a.cashier).localeCompare(String(b.cashier)));
    }

    if (selectedReportId === "voided-receipts") {
      return voidRequests
        .filter((v) => {
          const payment = scopedPayments.find((p) => p.id === v.paymentId);
          if (!payment) return false;
          if (reportDateFrom && payment.paymentDate < reportDateFrom) return false;
          if (reportDateTo && payment.paymentDate > reportDateTo) return false;
          return true;
        })
        .map((v) => {
          const payment = scopedPayments.find((p) => p.id === v.paymentId);
          return {
            orNumber: v.orNumber,
            paymentDate: payment?.paymentDate ?? "",
            studentName: v.studentName,
            amount: formatMoney(v.amount),
            status: v.status,
          };
        })
        .sort((a, b) => String(b.paymentDate).localeCompare(String(a.paymentDate)));
    }

    if (selectedReportId === "student-payment-summary") {
      return Array.from(groupBy<CashierPaymentRow>(reportPaymentRows, (row) => row.payment.studentId).entries())
        .map(([studentId, rows]) => {
          const student = rows[0]?.student;
          const remainingBalance = scopedAssessments
            .filter((assessment) => assessment.studentId === studentId)
            .reduce((sum, assessment) => sum + assessment.balance, 0);
          return {
            studentNo: student?.studentNo ?? "",
            studentName: student ? `${student.lastName}, ${student.firstName}` : "Unknown Student",
            transactionCount: rows.length,
            totalPaid: formatMoney(rows.reduce((sum, row) => sum + row.payment.amount, 0)),
            remainingBalance: formatMoney(remainingBalance),
            lastPaymentDate: rows.map((row) => row.payment.paymentDate).sort().slice(-1)[0] ?? "",
          };
        })
        .sort((a, b) => String(a.studentName).localeCompare(String(b.studentName)));
    }

    return Array.from(groupBy<CashierPaymentRow>(reportPaymentRows, (row) => `${row.payment.paymentDate}|${getCashierName(row.payment)}`).entries())
      .map(([key, rows]) => {
        const [paymentDate, cashier] = key.split("|");
        return {
          paymentDate,
          cashier,
          transactionCount: rows.length,
          totalAmount: formatMoney(rows.reduce((sum, row) => sum + row.payment.amount, 0)),
        };
      })
      .sort((a, b) => String(b.paymentDate).localeCompare(String(a.paymentDate)) || String(a.cashier).localeCompare(String(b.cashier)));
  }, [reportPaymentRows, scopedAssessments, selectedReportId]);

  const cashierReportTableColumns = useMemo<STSNColumn<ReportRow>[]>(() => reportColumns.map((column) => ({
    title: column.label,
    data: column.key,
    className: column.align === "right" ? "text-right" : column.align === "center" ? "text-center" : undefined,
    render: (value) => <span className="text-xs text-stone-700">{String(value ?? "")}</span>,
  })), [reportColumns]);

  const exportCurrentReport = (format: "print" | "csv" | "excel" | "pdf") => {
    const payload = { title: selectedReport.title, columns: reportColumns, rows: reportRows };
    if (format === "print") reportExportService.print(payload);
    if (format === "csv") reportExportService.exportCsv(payload);
    if (format === "excel") reportExportService.exportExcel(payload);
    if (format === "pdf") reportExportService.exportPdf(payload);
  };

  const paginatedQueueRows = useMemo(() => paginateRecords(queueRows, approvedPage, rowsPerPage), [queueRows, approvedPage]);
  const paginatedAwaitingRows = useMemo(() => paginateRecords(awaitingRows, pendingPage, rowsPerPage), [awaitingRows, pendingPage]);

  const collectRow = queueRows.find((r) => r.assessment.id === collectModalId);

  const openCollect = (assessmentId: string) => {
    const row = queueRows.find((r) => r.assessment.id === assessmentId);
    setPaymentForm({
      orNumber: "",
      amount: row ? String(row.assessment.balance) : "",
      paymentMethod: (paymentMethodOptions[0] ?? "Cash") as Payment["paymentMethod"],
      term: (paymentRemittanceTermOptions[0] ?? "Installment") as Payment["term"],
      reference: "",
    });
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
      render: (value, row) => {
        const existingVoid = voidRequests.find((v) => v.paymentId === row.payment.id);
        return (
          <div className="flex flex-col gap-0.5">
            <span className="font-mono font-bold text-stsn-brown">{String(value)}</span>
            {existingVoid && (
              <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded-md w-fit ${
                existingVoid.status === "Pending Void Approval"
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : existingVoid.status === "Approved"
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-stone-50 text-stone-500 border border-stone-200"
              }`}>
                {existingVoid.status === "Pending Void Approval" ? "VOID PENDING" :
                 existingVoid.status === "Approved" ? "VOIDED" : "VOID REJECTED"}
              </span>
            )}
          </div>
        );
      },
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
      title: "Actions",
      className: "text-right",
      orderable: false,
      searchable: false,
      render: (_value, row) => {
        const existingVoid = voidRequests.find((v) => v.paymentId === row.payment.id);
        const canRequestVoid = !existingVoid || existingVoid.status === "Rejected";
        return (
          <div className="flex items-center justify-end gap-1.5">
            <button
              onClick={() => reprintReceipt(row)}
              className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-stsn-cream text-stsn-brown border border-stsn-beige hover:bg-stsn-beige cursor-pointer transition"
            >
              <Printer className="w-3 h-3" /> View
            </button>
            {canRequestVoid && (
              <button
                onClick={() => { setVoidModalPaymentId(row.payment.id); setVoidReason(""); }}
                className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 cursor-pointer transition"
                title="Request void / cancellation"
              >
                <Ban className="w-3 h-3" /> Void
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <ModulePageHeader
        badge="Collection Window"
        badgeIcon={Wallet}
        title="Cashiering Office"
        subtitle="Collect payments on approved assessments, preview official receipts, and review collection history."
      />

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl border border-stsn-beige shadow-sm overflow-hidden">
        <div className="flex border-b border-stone-100">
          <button
            onClick={() => { setActiveTab("queue"); onSubPageChange?.("queue"); }}
            className={`flex-1 py-3 px-4 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${activeTab === "queue" ? "tab-active-gradient" : "text-stone-500 hover:bg-stone-50"}`}
          >
            <Receipt className="w-4 h-4" />
            Payment Queue
          </button>
          <button
            onClick={() => { setActiveTab("history"); onSubPageChange?.("history"); }}
            className={`flex-1 py-3 px-4 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${activeTab === "history" ? "tab-active-gradient" : "text-stone-500 hover:bg-stone-50"}`}
          >
            <History className="w-4 h-4" />
            Collection History
          </button>
          <button
            onClick={() => { setActiveTab("reports"); onSubPageChange?.("reports"); }}
            className={`flex-1 py-3 px-4 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${activeTab === "reports" ? "tab-active-gradient" : "text-stone-500 hover:bg-stone-50"}`}
          >
            <BarChart3 className="w-4 h-4" />
            Reports
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
              <EmptyState
                icon={Receipt}
                title="Payment Queue is Empty"
                description="Assessments approved by Accounting and with an outstanding balance will appear here for collection."
                compact
              />
            ) : (
              <div className="space-y-3">
                {paginatedQueueRows.map(({ assessment, student }) => {
                  const books = getBookPackageInfo(assessment, scopedBookPackages);
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

      {/* ===================== CASHIER REPORTS ===================== */}
      {activeTab === "reports" && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white rounded-xl border border-stsn-beige shadow-sm p-4">
            <h3 className="text-sm font-display font-bold text-stone-900 flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-stsn-gold" /> Cashier Reports
            </h3>
            <p className="text-xs text-stone-500 mb-3">
              Generate collection, receipt, payment method, cashier, student payment, and end-of-day reports from posted payments.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
              <div className="lg:col-span-2">
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1.5">Report Type</label>
                <select
                  value={selectedReportId}
                  onChange={(e) => setSelectedReportId(e.target.value as CashierReportId)}
                  className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown"
                >
                  {CASHIER_REPORT_OPTIONS.map((report) => <option key={report.id} value={report.id}>{report.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1.5">Date From</label>
                <input
                  type="date"
                  value={reportDateFrom}
                  onChange={(e) => setReportDateFrom(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1.5">Date To</label>
                <input
                  type="date"
                  value={reportDateTo}
                  onChange={(e) => setReportDateTo(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-stsn-beige shadow-sm p-4">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3 mb-3">
              <div>
                <h4 className="text-sm font-display font-bold text-stone-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-stsn-gold" /> {selectedReport.title}
                </h4>
                <p className="text-xs text-stone-500 mt-1">{selectedReport.desc}</p>
                {selectedReportId === "voided-receipts" && (
                  <p className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1.5 mt-2">
                    Shows all receipts with an active void request (Pending, Approved, or Rejected). Cashiers can submit void requests from Collection History; Accounting approves via the Approval Queue.
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => exportCurrentReport("print")} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer">
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
                <button onClick={() => exportCurrentReport("csv")} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer">
                  <Download className="w-3.5 h-3.5" /> CSV
                </button>
                <button onClick={() => exportCurrentReport("excel")} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer">
                  <Download className="w-3.5 h-3.5" /> Excel
                </button>
                <button onClick={() => exportCurrentReport("pdf")} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer">
                  <Download className="w-3.5 h-3.5" /> PDF
                </button>
              </div>
            </div>
            <STSNDataTable
              columns={cashierReportTableColumns}
              rows={reportRows}
              searchable={false}
              emptyMessage="No report rows for the selected filters."
            />
          </div>
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
              {getBookPackageInfo(collectRow.assessment, scopedBookPackages) && (
                <div className="pt-2 border-t border-stone-200">
                  <p className="text-[9px] uppercase font-mono text-stone-400 mb-1.5">Books</p>
                  {(() => {
                    const pkg = getBookPackageInfo(collectRow.assessment, scopedBookPackages)!;
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
                    {paymentMethodOptions.map((m) => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1.5">Term / Purpose</label>
                  <select
                    value={paymentForm.term}
                    onChange={(e) => setPaymentForm({ ...paymentForm, term: e.target.value as Payment["term"] })}
                    className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown"
                  >
                    {paymentRemittanceTermOptions.map((t) => <option key={t}>{t}</option>)}
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

      {/* ===================== VOID REQUEST MODAL ===================== */}
      {voidModalPaymentId && (() => {
        const voidPayment = scopedPayments.find((p) => p.id === voidModalPaymentId);
        const voidStudent = voidPayment ? scopedStudents.find((s) => s.id === voidPayment.studentId) : undefined;
        const handleSubmitVoid = (e: React.FormEvent) => {
          e.preventDefault();
          if (!voidPayment || !currentUser) return;
          const reason = voidReason.trim();
          if (!reason) return;
          submitVoidRequest({
            paymentId: voidPayment.id,
            orNumber: voidPayment.orNumber,
            amount: voidPayment.amount,
            studentId: voidPayment.studentId,
            studentName: voidStudent ? `${voidStudent.lastName}, ${voidStudent.firstName}` : voidPayment.studentId,
            requestedBy: currentUser.name,
            reason,
            schoolId: voidStudent?.schoolId ?? undefined,
          });
          setVoidModalPaymentId(null);
          setVoidReason("");
          setVoidConfirmInput("");
        };
        return (
          <PreviewModal isOpen={true} onClose={() => { setVoidModalPaymentId(null); setVoidReason(""); setVoidConfirmInput(""); }} title="Request Receipt Void" hidePrint>
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-red-700">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>A void request requires approval from Accounting. The receipt remains active until the request is approved. Per BIR regulations, void requests must state a valid reason.</span>
              </div>

              {voidPayment && (
                <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 space-y-1.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[9px] uppercase font-mono text-stone-400">Official Receipt No.</p>
                      <p className="font-mono font-bold text-stsn-brown text-base">{voidPayment.orNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] uppercase font-mono text-stone-400">Amount</p>
                      <p className="font-mono font-bold text-stone-900 text-base">{formatMoney(voidPayment.amount)}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-stone-200 grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[9px] uppercase font-mono text-stone-400">Student</p>
                      <p className="font-semibold text-stone-800 text-[11px]">
                        {voidStudent ? `${voidStudent.lastName}, ${voidStudent.firstName}` : voidPayment.studentId}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase font-mono text-stone-400">Payment Date</p>
                      <p className="font-mono text-stone-700 text-[11px]">{voidPayment.paymentDate}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase font-mono text-stone-400">Method</p>
                      <p className="text-stone-700 text-[11px]">{voidPayment.paymentMethod}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase font-mono text-stone-400">Term</p>
                      <p className="text-stone-700 text-[11px]">{voidPayment.term}</p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmitVoid} className="space-y-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1.5">
                    Reason for Void <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={voidReason}
                    onChange={(e) => setVoidReason(e.target.value)}
                    placeholder="e.g. Payment was posted under the wrong student account. OR was not yet issued to payor."
                    className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-red-400 resize-none"
                  />
                  <p className="text-[9.5px] text-stone-400 mt-1">This reason will be included in the void request sent to Accounting for approval.</p>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-red-600 mb-1.5">
                    Type the OR Number to confirm <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={voidConfirmInput}
                    onChange={(e) => setVoidConfirmInput(e.target.value)}
                    placeholder={voidPayment?.orNumber ?? "OR Number"}
                    className={`w-full bg-white border rounded-lg py-2 px-3 text-xs font-mono font-bold focus:outline-none focus:ring-1 transition ${
                      voidConfirmInput === voidPayment?.orNumber
                        ? "border-red-400 focus:ring-red-400 text-red-700"
                        : "border-stone-200 focus:ring-stone-300 text-stone-700"
                    }`}
                  />
                  {voidConfirmInput.length > 0 && voidConfirmInput !== voidPayment?.orNumber && (
                    <p className="text-[9.5px] text-red-500 mt-1">OR number does not match. Type exactly: <strong>{voidPayment?.orNumber}</strong></p>
                  )}
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" onClick={() => { setVoidModalPaymentId(null); setVoidReason(""); setVoidConfirmInput(""); }} className="text-xs font-bold px-3 py-2 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!voidReason.trim() || voidConfirmInput !== voidPayment?.orNumber}
                    className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Ban className="w-3.5 h-3.5" /> Submit Void Request
                  </button>
                </div>
              </form>
            </div>
          </PreviewModal>
        );
      })()}

      {/* ===================== RECEIPT PREVIEW ===================== */}
      {receipt && (
        <PreviewModal isOpen={true} onClose={() => setReceipt(null)} title="Official Receipt">
          <ReceiptPreview
            student={receipt.student}
            assessment={receipt.assessment}
            payment={receipt.payment}
            bookPackage={receipt.assessment ? getBookPackageInfo(receipt.assessment, scopedBookPackages) : undefined}
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

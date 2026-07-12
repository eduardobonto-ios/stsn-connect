/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from "react";
import { useSTSNStore } from "../../../services/store";
import { usePermissions } from "../../../hooks/usePermissions";
import { Payment, Student, StudentAssessment, CashVoucher } from "../../../types";
import {
  Wallet, Search, Receipt, History, CheckCircle, AlertCircle,
  Banknote, Printer, Package, Info, X, Clock, ListChecks,
  ChevronLeft, ChevronRight, BarChart3, Download, FileText, Ban,
  TrendingUp, CalendarDays, Plus, ThumbsDown, Send,
} from "lucide-react";
import ModulePageHeader from "../../../components/common/ModulePageHeader";
import AppButton from "../../../components/common/AppButton";
import AppCard from "../../../components/common/AppCard";
import AppKpiCard from "../../../components/common/AppKpiCard";
import AppModal from "../../../components/common/AppModal";
import AppStatusBadge from "../../../components/common/AppStatusBadge";
import { ReceiptPreview, VoucherPreview } from "../../../components/ModalPreviews";
import AppTable, { type AppTableColumn } from "../../../components/common/AppTable";
import EmptyState from "../../../components/common/EmptyState";
import { PreviewModal } from "../../../components/ModalPreviews";
import { getAccountingLabels, ASSESSMENT_APPROVAL_STATUS_CONFIG, DEFAULT_ASSESSMENT_APPROVAL_STATUS } from "../../../config/accounting.config";
import { BookPackage } from "../../../types";
import { getAcademicScopedData } from "../../../services/academicUnitScopeService";
import { reportExportService } from "../../../services/reportExportService";
import type { ReportColumn, ReportRow } from "../../reports/types";

type CashierTab = "queue" | "other-payments" | "vouchers" | "history" | "reports";
type CashierReportId =
  | "daily-collection"
  | "or-register"
  | "payment-history"
  | "collection-by-method"
  | "collection-by-cashier"
  | "voided-receipts"
  | "student-payment-summary"
  | "end-of-day-summary"
  | "cash-voucher-register";

const PAYMENT_METHODS: Payment["paymentMethod"][] = ["Cash", "GCash", "Bank Transfer", "Credit Card"];
const PAYMENT_REMITTANCE_TERMS: Payment["term"][] = ["Downpayment", "Midterm", "Finals", "Full Payment", "Installment"];
const OTHER_PAYMENT_CATEGORIES = ["Transcript Fee", "ID Replacement", "Certification", "Library Fine", "Miscellaneous"];
const CASH_VOUCHER_CATEGORIES = ["Refund / Overpayment", "Reimbursement", "Petty Cash Release"];

const CASHIER_REPORT_OPTIONS: { id: CashierReportId; title: string; desc: string }[] = [
  { id: "daily-collection", title: "Daily Collection Report", desc: "Collection totals grouped by transaction date." },
  { id: "or-register", title: "OR Register / Receipt List", desc: "Official receipt register with student and payment details." },
  { id: "payment-history", title: "Payment History Report", desc: "Detailed payment posting history." },
  { id: "collection-by-method", title: "Collection by Payment Method", desc: "Collection totals grouped by tender type." },
  { id: "collection-by-cashier", title: "Collection by Cashier", desc: "Collection totals grouped by cashier name." },
  { id: "voided-receipts", title: "Cancelled / Voided Receipt Report", desc: "Voided receipt register when void data is available." },
  { id: "student-payment-summary", title: "Student Payment Summary", desc: "Total payments and remaining balance by student." },
  { id: "end-of-day-summary", title: "End-of-Day Cashier Summary", desc: "Daily cashier collection totals for closing." },
  { id: "cash-voucher-register", title: "Cash Voucher Register", desc: "Cash release requests, approvals, and disbursement status." },
];

const CASHIER_REPORT_COLUMNS: Record<CashierReportId, ReportColumn[]> = {
  "daily-collection": [
    { key: "paymentDate", label: "Date" },
    { key: "particulars", label: "Particulars" },
    { key: "transactionCount", label: "Transactions", align: "right" },
    { key: "totalAmount", label: "Total Amount", align: "right" },
  ],
  "or-register": [
    { key: "orNumber", label: "OR Number" },
    { key: "paymentDate", label: "Date" },
    { key: "studentNo", label: "Student No." },
    { key: "studentName", label: "Student" },
    { key: "transactionType", label: "Type" },
    { key: "paymentMethod", label: "Method" },
    { key: "term", label: "Term" },
    { key: "amount", label: "Amount", align: "right" },
  ],
  "payment-history": [
    { key: "paymentDate", label: "Date" },
    { key: "orNumber", label: "OR Number" },
    { key: "studentName", label: "Student" },
    { key: "transactionType", label: "Type" },
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
  "cash-voucher-register": [
    { key: "voucherNo", label: "Voucher No." },
    { key: "requestedAt", label: "Date" },
    { key: "payeeName", label: "Payee" },
    { key: "category", label: "Category" },
    { key: "amount", label: "Amount", align: "right" },
    { key: "status", label: "Status" },
    { key: "releasedBy", label: "Released By" },
  ],
};

type CashierPaymentRow = { payment: Payment; student?: Student; assessment?: StudentAssessment };
type CashierHistoryRow = { payment: Payment; student?: Student; assessment?: StudentAssessment };

function formatMoney(value: number): string {
  return `₱${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getCashierName(payment: Payment): string {
  const match = payment.remarks?.match(/Collected by (.+?) via Cashiering module/);
  return match?.[1] ?? "Cashier";
}

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Dates come from two sources with different shapes: DB-loaded rows carry a
 * full timestamptz string ("2026-06-22T21:43:00+00:00"), while rows created
 * client-side this session carry "2026-06-22 21:43" (see nowStamp() in
 * store.ts). Both share the same first 10 characters, so slicing avoids the
 * cross-format Date-parsing pitfalls entirely.
 */
function toDateOnly(value: string | undefined | null): string {
  return (value ?? "").slice(0, 10);
}

/** Human-readable date, e.g. "Jun 22, 2026". Never throws on odd input. */
function formatDateOnly(value: string | undefined | null): string {
  const raw = toDateOnly(value);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!match) return raw || "—";
  const [, y, m, d] = match;
  const monthAbbr = MONTH_ABBR[Number(m) - 1];
  return monthAbbr ? `${monthAbbr} ${Number(d)}, ${y}` : raw;
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

function getBookPackageInfo(assessment: StudentAssessment, bookPackages: BookPackage[]) {
  if (!assessment.booksAvailed) return undefined;
  return bookPackages.find((p) => p.id === assessment.bookPackageId);
}

function getAcademicLine(student: Student | undefined, unit: "basic-ed" | "college"): string {
  const labels = getAccountingLabels(unit);
  if (unit === "basic-ed") {
    return `${labels.levelLabel}: ${student?.yearLevel || "—"} • ${labels.groupLabel}: ${student?.section || "—"}`;
  }
  return `${labels.programLabel}: ${student?.trackOrCourse || "—"} • ${labels.levelLabel}: ${student?.yearLevel || "—"}`;
}

function paginateRecords<T>(records: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return records.slice(start, start + pageSize);
}

function CardPagination({
  page, totalRecords, pageSize, onPageChange,
}: { page: number; totalRecords: number; pageSize: number; onPageChange: (page: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  if (totalRecords <= pageSize) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(totalRecords, page * pageSize);

  return (
    <div className="mt-3 pt-3 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-2">
      <p className="text-[10px] text-stone-400 font-mono">Showing {start}–{end} of {totalRecords} records</p>
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
  const {
    students, assessments, payments, voidRequests, cashVouchers, currentUser, activeSchool, academicUnit,
    addPayment, submitVoidRequest, submitCashVoucherRequest, approveCashVoucher, rejectCashVoucher, releaseCashVoucher,
    bookPackages, setupData,
  } = useSTSNStore();
  const { canPage, hasPageAccess } = usePermissions();
  const canCollectPayment = canPage("CASHIER", "queue", "create");
  const canVoidPayment = canPage("CASHIER", "queue", "void");
  const canCollectOtherPayment = canPage("CASHIER", "other-payments", "create");
  const canCreateVoucher = canPage("CASHIER", "vouchers", "create");
  const canApproveVoucher = canPage("CASHIER", "vouchers", "approve");
  const canRejectVoucher = canPage("CASHIER", "vouchers", "reject");
  const canReleaseVoucher = canPage("CASHIER", "vouchers", "post");
  const [activeTab, setActiveTab] = useState<CashierTab>((subPage as CashierTab) ?? "queue");
  const pageAccessByTab: Record<CashierTab, boolean> = {
    queue: hasPageAccess("CASHIER", "queue"),
    "other-payments": hasPageAccess("CASHIER", "other-payments"),
    vouchers: hasPageAccess("CASHIER", "vouchers"),
    history: hasPageAccess("CASHIER", "history"),
    reports: hasPageAccess("CASHIER", "reports"),
  };
  const activeTabAccessible = pageAccessByTab[activeTab];

  useEffect(() => {
    if (subPage && subPage !== activeTab) setActiveTab(subPage as CashierTab);
  }, [subPage]);

  const [searchQuery, setSearchQuery] = useState("");
  const [historyDateFilter, setHistoryDateFilter] = useState("");
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

  // ── Other Payments (OR) — standalone collection modal ──────────────────
  const [orCollectModalOpen, setOrCollectModalOpen] = useState(false);
  const [orCollectStudentQuery, setOrCollectStudentQuery] = useState("");
  const [orCollectForm, setOrCollectForm] = useState<{
    transactionType: "AR" | "OR"; studentId: string; category: string; orNumber: string; amount: string;
    paymentMethod: Payment["paymentMethod"]; remarks: string;
  }>({ transactionType: "OR", studentId: "", category: "", orNumber: "", amount: "", paymentMethod: "Cash", remarks: "" });
  const [orCollectError, setOrCollectError] = useState<string | null>(null);

  // ── Cash Vouchers ────────────────────────────────────────────────────────
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [voucherStudentQuery, setVoucherStudentQuery] = useState("");
  const [voucherForm, setVoucherForm] = useState<{
    payeeType: "Student" | "External"; payeeStudentId: string; payeeNameExternal: string;
    category: string; voucherNo: string; amount: string; purpose: string;
  }>({ payeeType: "Student", payeeStudentId: "", payeeNameExternal: "", category: "", voucherNo: "", amount: "", purpose: "" });
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [voucherDecision, setVoucherDecision] = useState<{ id: string; action: "approve" | "reject" } | null>(null);
  const [voucherDecisionRemarks, setVoucherDecisionRemarks] = useState("");
  const [voucherPreview, setVoucherPreview] = useState<CashVoucher | null>(null);

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
  const otherPaymentCategoryOptions = useMemo(
    () => getActiveSetupNames(setupData.other_payment_categories, OTHER_PAYMENT_CATEGORIES),
    [setupData.other_payment_categories],
  );
  const cashVoucherCategoryOptions = useMemo(
    () => getActiveSetupNames(setupData.cash_voucher_categories, CASH_VOUCHER_CATEGORIES),
    [setupData.cash_voucher_categories],
  );

  const scopedCashVouchers = useMemo(
    () => cashVouchers.filter((v) => activeSchool === "ALL" || !v.schoolId || v.schoolId === activeSchool),
    [cashVouchers, activeSchool],
  );

  // Today's date string for KPI calculations
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const todayPayments = useMemo(
    () => scopedPayments.filter((p) => toDateOnly(p.paymentDate) === todayStr),
    [scopedPayments, todayStr],
  );
  const todayTotal = useMemo(
    () => todayPayments.reduce((sum, p) => sum + p.amount, 0),
    [todayPayments],
  );
  const pendingVoids = useMemo(
    () => voidRequests.filter((v) => v.status === "Pending Void Approval" && scopedPayments.some((p) => p.id === v.paymentId)),
    [voidRequests, scopedPayments],
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

  const findStudentMatches = (query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return scopedStudents
      .filter((s) => `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || (s.studentNo || "").toLowerCase().includes(q))
      .slice(0, 8);
  };

  const queueRows = useMemo(() => {
    return scopedAssessments
      .filter((a) => a.approvalStatus === "Approved for Payment" && a.balance > 0)
      .map((a) => ({ assessment: a, student: scopedStudents.find((s) => s.id === a.studentId) }))
      .filter(({ student }) => matchesSearch(student));
  }, [scopedAssessments, scopedStudents, searchQuery]);

  const awaitingRows = useMemo(() => {
    return scopedAssessments
      .filter((a) => !!a.approvalStatus && (a.approvalStatus !== "Approved for Payment" || a.balance <= 0))
      .map((a) => ({ assessment: a, student: scopedStudents.find((s) => s.id === a.studentId) }))
      .filter(({ student, assessment }) => matchesSearch(student) && assessment.balance > 0);
  }, [scopedAssessments, scopedStudents, searchQuery]);

  const historyRows = useMemo(() => {
    return scopedPayments
      .map((p) => ({
        payment: p,
        student: scopedStudents.find((s) => s.id === p.studentId),
        assessment: p.assessmentId
          ? scopedAssessments.find((a) => a.id === p.assessmentId)
          : scopedAssessments.find((a) => a.studentId === p.studentId),
      }))
      .filter(({ student }) => matchesSearch(student))
      .sort((a, b) => b.payment.paymentDate.localeCompare(a.payment.paymentDate));
  }, [scopedPayments, scopedStudents, scopedAssessments, searchQuery]);

  const orPaymentRows = useMemo(() => {
    return scopedPayments
      .filter((p) => p.transactionType === "OR")
      .map((p) => ({ payment: p, student: scopedStudents.find((s) => s.id === p.studentId) }))
      .filter(({ student }) => matchesSearch(student))
      .sort((a, b) => b.payment.paymentDate.localeCompare(a.payment.paymentDate));
  }, [scopedPayments, scopedStudents, searchQuery]);

  const voucherRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return scopedCashVouchers
      .filter((v) => !q || v.payeeName.toLowerCase().includes(q) || v.voucherNo.toLowerCase().includes(q))
      .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
  }, [scopedCashVouchers, searchQuery]);

  const filteredHistoryRows = useMemo(
    () => historyRows.filter(({ payment }) => !historyDateFilter || toDateOnly(payment.paymentDate) === historyDateFilter),
    [historyRows, historyDateFilter],
  );

  const reportPaymentRows = useMemo<CashierPaymentRow[]>(() => {
    return historyRows
      .filter(({ payment }) => (!reportDateFrom || toDateOnly(payment.paymentDate) >= reportDateFrom) && (!reportDateTo || toDateOnly(payment.paymentDate) <= reportDateTo))
      .sort((a, b) => b.payment.paymentDate.localeCompare(a.payment.paymentDate));
  }, [historyRows, reportDateFrom, reportDateTo]);

  const selectedReport = CASHIER_REPORT_OPTIONS.find((report) => report.id === selectedReportId) ?? CASHIER_REPORT_OPTIONS[0];
  const reportColumns = CASHIER_REPORT_COLUMNS[selectedReportId];

  const reportRows = useMemo<ReportRow[]>(() => {
    if (selectedReportId === "daily-collection") {
      return Array.from(groupBy<CashierPaymentRow>(reportPaymentRows, (row) => toDateOnly(row.payment.paymentDate)).entries())
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([dateKey, rows]) => ({
          paymentDate: formatDateOnly(dateKey),
          particulars: rows
            .map(({ payment, student }) => {
              const who = student ? `${student.lastName}, ${student.firstName}` : "Unknown Student";
              const what = payment.paymentCategory || payment.term || "Payment";
              return `${who} — ${what}`;
            })
            .join("; "),
          transactionCount: rows.length,
          totalAmount: formatMoney(rows.reduce((sum, row) => sum + row.payment.amount, 0)),
        }));
    }

    if (selectedReportId === "or-register") {
      return reportPaymentRows.map(({ payment, student }) => ({
        orNumber: payment.orNumber,
        paymentDate: formatDateOnly(payment.paymentDate),
        studentNo: student?.studentNo ?? "",
        studentName: student ? `${student.lastName}, ${student.firstName}` : "Unknown Student",
        transactionType: payment.transactionType ?? "AR",
        paymentMethod: payment.paymentMethod,
        term: payment.term,
        amount: formatMoney(payment.amount),
      }));
    }

    if (selectedReportId === "payment-history") {
      return reportPaymentRows.map(({ payment, student }) => ({
        paymentDate: formatDateOnly(payment.paymentDate),
        orNumber: payment.orNumber,
        studentName: student ? `${student.lastName}, ${student.firstName}` : "Unknown Student",
        transactionType: payment.transactionType ?? "AR",
        paymentMethod: payment.paymentMethod,
        term: payment.term,
        amount: formatMoney(payment.amount),
        remarks: payment.remarks ?? "",
      }));
    }

    if (selectedReportId === "cash-voucher-register") {
      return scopedCashVouchers
        .filter((v) => (!reportDateFrom || toDateOnly(v.requestedAt) >= reportDateFrom) && (!reportDateTo || toDateOnly(v.requestedAt) <= reportDateTo))
        .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
        .map((v) => ({
          voucherNo: v.voucherNo,
          requestedAt: formatDateOnly(v.requestedAt),
          payeeName: v.payeeName,
          category: v.category,
          amount: formatMoney(v.amount),
          status: v.status,
          releasedBy: v.releasedBy ?? "",
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
          if (reportDateFrom && toDateOnly(payment.paymentDate) < reportDateFrom) return false;
          if (reportDateTo && toDateOnly(payment.paymentDate) > reportDateTo) return false;
          return true;
        })
        .sort((a, b) => {
          const pa = scopedPayments.find((p) => p.id === a.paymentId)?.paymentDate ?? "";
          const pb = scopedPayments.find((p) => p.id === b.paymentId)?.paymentDate ?? "";
          return pb.localeCompare(pa);
        })
        .map((v) => {
          const payment = scopedPayments.find((p) => p.id === v.paymentId);
          return {
            orNumber: v.orNumber,
            paymentDate: formatDateOnly(payment?.paymentDate),
            studentName: v.studentName,
            amount: formatMoney(v.amount),
            status: v.status,
          };
        });
    }

    if (selectedReportId === "student-payment-summary") {
      return Array.from(groupBy<CashierPaymentRow>(reportPaymentRows, (row) => row.payment.studentId).entries())
        .map(([studentId, rows]) => {
          const student = rows[0]?.student;
          const remainingBalance = scopedAssessments
            .filter((assessment) => assessment.studentId === studentId)
            .reduce((sum, assessment) => sum + assessment.balance, 0);
          const lastPaymentDate = rows.map((row) => toDateOnly(row.payment.paymentDate)).sort().slice(-1)[0];
          return {
            studentNo: student?.studentNo ?? "",
            studentName: student ? `${student.lastName}, ${student.firstName}` : "Unknown Student",
            transactionCount: rows.length,
            totalPaid: formatMoney(rows.reduce((sum, row) => sum + row.payment.amount, 0)),
            remainingBalance: formatMoney(remainingBalance),
            lastPaymentDate: formatDateOnly(lastPaymentDate),
          };
        })
        .sort((a, b) => String(a.studentName).localeCompare(String(b.studentName)));
    }

    return Array.from(groupBy<CashierPaymentRow>(reportPaymentRows, (row) => `${toDateOnly(row.payment.paymentDate)}|${getCashierName(row.payment)}`).entries())
      .map(([key, rows]) => {
        const [dateKey, cashier] = key.split("|");
        return { dateKey, cashier, rows };
      })
      .sort((a, b) => b.dateKey.localeCompare(a.dateKey) || a.cashier.localeCompare(b.cashier))
      .map(({ dateKey, cashier, rows }) => ({
        paymentDate: formatDateOnly(dateKey),
        cashier,
        transactionCount: rows.length,
        totalAmount: formatMoney(rows.reduce((sum, row) => sum + row.payment.amount, 0)),
      }));
  }, [reportPaymentRows, scopedAssessments, scopedPayments, voidRequests, scopedCashVouchers, selectedReportId, reportDateFrom, reportDateTo]);

  const cashierReportTableColumns = useMemo<AppTableColumn<ReportRow>[]>(() => reportColumns.map((column) => ({
    accessorKey: column.key,
    header: column.label,
    cell: ({ getValue }) => (
      <span className={`block text-xs text-stone-700 ${column.align === "right" ? "text-right" : column.align === "center" ? "text-center" : ""}`}>
        {String(getValue() ?? "")}
      </span>
    ),
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
    if (!canCollectPayment) { setOrError("You don't have permission to collect payments."); return; }
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

  // ── Other Payments (OR) — standalone collection ─────────────────────────
  const openOrCollectModal = () => {
    setOrCollectForm({
      transactionType: "OR",
      studentId: "", category: otherPaymentCategoryOptions[0] ?? "", orNumber: "", amount: "",
      paymentMethod: (paymentMethodOptions[0] ?? "Cash") as Payment["paymentMethod"], remarks: "",
    });
    setOrCollectStudentQuery("");
    setOrCollectError(null);
    setOrCollectModalOpen(true);
  };

  const handlePostOtherPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCollectOtherPayment) { setOrCollectError("You don't have permission to collect other payments."); return; }
    const student = scopedStudents.find((s) => s.id === orCollectForm.studentId);
    if (!student) { setOrCollectError("Select a student first."); return; }
    const amount = Number(orCollectForm.amount);
    if (!amount || amount <= 0) { setOrCollectError("Enter a valid amount."); return; }
    if (!orCollectForm.category) {
      setOrCollectError(orCollectForm.transactionType === "AR" ? "Select a payment term." : "Select a category.");
      return;
    }
    const typedOrNumber = orCollectForm.orNumber.trim();
    if (typedOrNumber && payments.some((p) => p.orNumber === typedOrNumber)) {
      setOrCollectError(`OR No. "${typedOrNumber}" has already been used. Check your receipt booklet.`);
      return;
    }
    setOrCollectError(null);
    // BIR OR No. is optional here — fall back to an internal reference so the
    // record still gets a unique receipt identifier when none was typed.
    const orNumber = typedOrNumber || `NO-OR-${Date.now()}`;
    const isAr = orCollectForm.transactionType === "AR";

    const posted = addPayment({
      studentId: student.id,
      schoolId: student.schoolId,
      orNumber,
      amount,
      paymentMethod: orCollectForm.paymentMethod,
      term: orCollectForm.category,
      remarks: `Collected by ${currentUser?.name || "Cashier"} via Cashiering module — ${isAr ? "Other Payment (AR)" : "Other Payment (OR)"}${orCollectForm.remarks ? ` — ${orCollectForm.remarks}` : ""}`,
      transactionType: orCollectForm.transactionType,
      paymentCategory: isAr ? undefined : orCollectForm.category,
    });

    setOrCollectModalOpen(false);
    // Mirror the Payment Queue receipt pattern: compute the post-payment
    // balance locally since the store hasn't re-rendered scopedAssessments yet.
    const matchedAssessment = isAr ? scopedAssessments.find((a) => a.studentId === student.id) : undefined;
    const receiptAssessment = matchedAssessment
      ? { ...matchedAssessment, balance: Math.max(0, matchedAssessment.balance - amount) }
      : undefined;
    setReceipt({ payment: posted, student, assessment: receiptAssessment });
  };

  // ── Cash Vouchers ────────────────────────────────────────────────────────
  const openVoucherModal = () => {
    setVoucherForm({
      payeeType: "Student", payeeStudentId: "", payeeNameExternal: "",
      category: cashVoucherCategoryOptions[0] ?? "", voucherNo: "", amount: "", purpose: "",
    });
    setVoucherStudentQuery("");
    setVoucherError(null);
    setVoucherModalOpen(true);
  };

  const handleSubmitVoucherRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateVoucher || !currentUser) { setVoucherError("You don't have permission to request cash vouchers."); return; }
    const voucherNo = voucherForm.voucherNo.trim();
    if (!voucherNo) { setVoucherError("Voucher No. is required."); return; }
    if (cashVouchers.some((v) => v.voucherNo === voucherNo)) {
      setVoucherError(`Voucher No. "${voucherNo}" has already been used.`);
      return;
    }
    const amount = Number(voucherForm.amount);
    if (!amount || amount <= 0) { setVoucherError("Enter a valid amount."); return; }
    if (!voucherForm.category) { setVoucherError("Select a category."); return; }
    if (!voucherForm.purpose.trim()) { setVoucherError("Purpose is required."); return; }

    let payeeName = voucherForm.payeeNameExternal.trim();
    let payeeStudentId: string | undefined;
    if (voucherForm.payeeType === "Student") {
      const student = scopedStudents.find((s) => s.id === voucherForm.payeeStudentId);
      if (!student) { setVoucherError("Select a payee student first."); return; }
      payeeName = `${student.lastName}, ${student.firstName}`;
      payeeStudentId = student.id;
    } else if (!payeeName) {
      setVoucherError("Enter the payee's name.");
      return;
    }
    setVoucherError(null);

    submitCashVoucherRequest({
      schoolId: activeSchool === "ALL" ? undefined : activeSchool,
      voucherNo,
      payeeType: voucherForm.payeeType,
      payeeStudentId,
      payeeName,
      category: voucherForm.category,
      amount,
      purpose: voucherForm.purpose.trim(),
      requestedBy: currentUser.name,
    });

    setVoucherModalOpen(false);
  };

  const submitVoucherDecision = () => {
    if (!voucherDecision || !currentUser) return;
    if (voucherDecision.action === "approve") {
      if (!canApproveVoucher) return;
      approveCashVoucher(voucherDecision.id, currentUser.name, voucherDecisionRemarks.trim() || undefined);
    } else {
      if (!canRejectVoucher || !voucherDecisionRemarks.trim()) return;
      rejectCashVoucher(voucherDecision.id, currentUser.name, voucherDecisionRemarks.trim());
    }
    setVoucherDecision(null);
    setVoucherDecisionRemarks("");
  };

  const handleReleaseVoucher = (voucherId: string) => {
    if (!canReleaseVoucher || !currentUser) return;
    releaseCashVoucher(voucherId, currentUser.name);
    const updated = useSTSNStore.getState().cashVouchers.find((v) => v.id === voucherId);
    if (updated) setVoucherPreview(updated);
  };

  const historyColumns: AppTableColumn<CashierHistoryRow>[] = [
    {
      id: "orNumber",
      header: "OR Number",
      accessorFn: (row) => row.payment.orNumber,
      cell: ({ row, getValue }) => {
        const original = row.original;
        const existingVoid = voidRequests.find((v) => v.paymentId === original.payment.id);
        return (
          <div className="flex flex-col gap-0.5">
            <span className="font-mono font-bold text-stsn-brown">{String(getValue())}</span>
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
      id: "student",
      header: "Student",
      accessorFn: (row) => row.student ? `${row.student.lastName}, ${row.student.firstName}` : "Unknown Student",
      cell: ({ row }) => (
        <>
          <span className="font-semibold text-stone-800">{row.original.student ? `${row.original.student.lastName}, ${row.original.student.firstName}` : "Unknown Student"}</span>
          <span className="text-[10px] text-stone-400 block font-mono">{row.original.student?.studentNo}</span>
        </>
      ),
    },
    {
      id: "type",
      header: "Type",
      accessorFn: (row) => row.payment.transactionType ?? "AR",
      cell: ({ getValue }) => {
        const type = String(getValue() ?? "AR");
        return (
          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${type === "OR" ? "bg-sky-100 text-sky-700" : "bg-emerald-100 text-emerald-700"}`}>
            {type}
          </span>
        );
      },
    },
    {
      id: "date",
      header: "Date",
      accessorFn: (row) => row.payment.paymentDate,
      cell: ({ getValue }) => <span className="font-mono text-stone-600">{formatDateOnly(String(getValue() ?? ""))}</span>,
    },
    {
      id: "method",
      header: "Method",
      accessorFn: (row) => row.payment.paymentMethod,
      cell: ({ getValue }) => <span className="text-stone-600">{String(getValue() ?? "")}</span>,
    },
    {
      id: "term",
      header: "Term",
      accessorFn: (row) => row.payment.term,
      cell: ({ getValue }) => <span className="text-stone-600">{String(getValue() ?? "")}</span>,
    },
    {
      id: "amount",
      header: "Amount",
      accessorFn: (row) => row.payment.amount,
      cell: ({ getValue }) => (
        <span className="block text-right font-mono font-bold text-stone-800">
          {formatMoney(Number(getValue() ?? 0))}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => {
        const original = row.original;
        const existingVoid = voidRequests.find((v) => v.paymentId === original.payment.id);
        const canRequestVoid = !existingVoid || existingVoid.status === "Rejected";
        return (
          <div className="flex items-center justify-end gap-1.5">
            <button
              onClick={() => reprintReceipt(original)}
              className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-stsn-cream text-stsn-brown border border-stsn-beige hover:bg-stsn-beige cursor-pointer transition"
            >
              <Printer className="w-3 h-3" /> View
            </button>
            {canRequestVoid && canVoidPayment && (
              <button
                onClick={() => { setVoidModalPaymentId(original.payment.id); setVoidReason(""); }}
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

  const otherPaymentColumns: AppTableColumn<{ payment: Payment; student?: Student }>[] = [
    {
      id: "orNumber",
      header: "OR Number",
      accessorFn: (row) => row.payment.orNumber,
      cell: ({ getValue }) => <span className="font-mono font-bold text-stsn-brown">{String(getValue())}</span>,
    },
    {
      id: "student",
      header: "Student",
      accessorFn: (row) => row.student ? `${row.student.lastName}, ${row.student.firstName}` : "Unknown Student",
      cell: ({ row }) => (
        <>
          <span className="font-semibold text-stone-800">{row.original.student ? `${row.original.student.lastName}, ${row.original.student.firstName}` : "Unknown Student"}</span>
          <span className="text-[10px] text-stone-400 block font-mono">{row.original.student?.studentNo}</span>
        </>
      ),
    },
    {
      id: "category",
      header: "Category",
      accessorFn: (row) => row.payment.paymentCategory ?? row.payment.term,
      cell: ({ getValue }) => <span className="text-stone-600">{String(getValue() ?? "")}</span>,
    },
    {
      id: "date",
      header: "Date",
      accessorFn: (row) => row.payment.paymentDate,
      cell: ({ getValue }) => <span className="font-mono text-stone-600">{formatDateOnly(String(getValue() ?? ""))}</span>,
    },
    {
      id: "method",
      header: "Method",
      accessorFn: (row) => row.payment.paymentMethod,
      cell: ({ getValue }) => <span className="text-stone-600">{String(getValue() ?? "")}</span>,
    },
    {
      id: "amount",
      header: "Amount",
      accessorFn: (row) => row.payment.amount,
      cell: ({ getValue }) => (
        <span className="block text-right font-mono font-bold text-stone-800">
          {formatMoney(Number(getValue() ?? 0))}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => reprintReceipt(row.original)}
            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-stsn-cream text-stsn-brown border border-stsn-beige hover:bg-stsn-beige cursor-pointer transition"
          >
            <Printer className="w-3 h-3" /> View
          </button>
        </div>
      ),
    },
  ];

  const voucherColumns: AppTableColumn<CashVoucher>[] = [
    {
      id: "voucherNo",
      header: "Voucher No.",
      accessorFn: (row) => row.voucherNo,
      cell: ({ getValue }) => <span className="font-mono font-bold text-stsn-brown">{String(getValue())}</span>,
    },
    {
      id: "payee",
      header: "Payee",
      accessorFn: (row) => row.payeeName,
      cell: ({ row }) => (
        <>
          <span className="font-semibold text-stone-800">{row.original.payeeName}</span>
          <span className="text-[10px] text-stone-400 block font-mono">{row.original.payeeType}</span>
        </>
      ),
    },
    {
      id: "category",
      header: "Category",
      accessorFn: (row) => row.category,
      cell: ({ getValue }) => <span className="text-stone-600">{String(getValue() ?? "")}</span>,
    },
    {
      id: "amount",
      header: "Amount",
      accessorFn: (row) => row.amount,
      cell: ({ getValue }) => (
        <span className="block text-right font-mono font-bold text-stone-800">
          {formatMoney(Number(getValue() ?? 0))}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      accessorFn: (row) => row.status,
      cell: ({ getValue }) => {
        const status = String(getValue() ?? "");
        const tone =
          status === "Released" ? "bg-emerald-100 text-emerald-700" :
          status === "Approved" ? "bg-sky-100 text-sky-700" :
          status === "Rejected" ? "bg-red-100 text-red-700" :
          "bg-amber-100 text-amber-700";
        return <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${tone}`}>{status}</span>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => {
        const voucher = row.original;
        return (
          <div className="flex items-center justify-end gap-1.5">
            <button
              onClick={() => setVoucherPreview(voucher)}
              className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-stsn-cream text-stsn-brown border border-stsn-beige hover:bg-stsn-beige cursor-pointer transition"
            >
              <Printer className="w-3 h-3" /> View
            </button>
            {voucher.status === "Pending Approval" && canApproveVoucher && (
              <button
                onClick={() => setVoucherDecision({ id: voucher.id, action: "approve" })}
                className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 cursor-pointer transition"
              >
                <CheckCircle className="w-3 h-3" /> Approve
              </button>
            )}
            {voucher.status === "Pending Approval" && canRejectVoucher && (
              <button
                onClick={() => setVoucherDecision({ id: voucher.id, action: "reject" })}
                className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 cursor-pointer transition"
              >
                <ThumbsDown className="w-3 h-3" /> Reject
              </button>
            )}
            {voucher.status === "Approved" && canReleaseVoucher && (
              <button
                onClick={() => handleReleaseVoucher(voucher.id)}
                className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-stsn-brown text-white hover:bg-stsn-brown/90 cursor-pointer transition"
              >
                <Send className="w-3 h-3" /> Release
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in font-sans">

      {/* ── Module Header ─────────────────────────────────── */}
      <ModulePageHeader
        badge="Collection Window"
        badgeIcon={Wallet}
        title="Cashiering Office"
        subtitle="Collect payments on approved assessments, issue official receipts, and review collection history."
      />

      {/* ── KPI Summary Strip ─────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AppKpiCard
          label="Today's Collections"
          value={formatMoney(todayTotal)}
          icon={TrendingUp}
          tone="success"
          hint={`${todayPayments.length} transaction${todayPayments.length !== 1 ? "s" : ""} posted`}
        />
        <AppKpiCard
          label="Payment Queue"
          value={queueRows.length}
          icon={Receipt}
          tone="warning"
          hint="Approved with outstanding balance"
        />
        <AppKpiCard
          label="Receipts Issued Today"
          value={todayPayments.length}
          icon={FileText}
          tone="brand"
          hint="Official receipts for today"
        />
        <AppKpiCard
          label="Pending Voids"
          value={pendingVoids.length}
          icon={Ban}
          tone={pendingVoids.length > 0 ? "danger" : "neutral"}
          hint="Awaiting Accounting approval"
        />
      </div>

      {/* ── Tab Bar + Search ─────────────────────────────── */}
      <div className="bg-white rounded-xl border border-stsn-beige shadow-sm overflow-hidden">
        <div className="flex items-stretch border-b border-stone-100">
          {/* Tabs */}
          {pageAccessByTab.queue && (
            <button
              onClick={() => { setActiveTab("queue"); onSubPageChange?.("queue"); }}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold transition cursor-pointer whitespace-nowrap ${activeTab === "queue" ? "tab-active-gradient" : "text-stone-500 hover:bg-stone-50"}`}
            >
              <Receipt className="w-4 h-4" />
              Payment Queue
              {queueRows.length > 0 && (
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none ${
                  activeTab === "queue"
                    ? "bg-stsn-brown/15 text-stsn-brown"
                    : "bg-amber-100 text-amber-700"
                }`}>
                  {queueRows.length}
                </span>
              )}
            </button>
          )}
          {pageAccessByTab["other-payments"] && (
            <button
              onClick={() => { setActiveTab("other-payments"); onSubPageChange?.("other-payments"); }}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold transition cursor-pointer whitespace-nowrap ${activeTab === "other-payments" ? "tab-active-gradient" : "text-stone-500 hover:bg-stone-50"}`}
            >
              <FileText className="w-4 h-4" />
              Other Payments
            </button>
          )}
          {pageAccessByTab.vouchers && (
            <button
              onClick={() => { setActiveTab("vouchers"); onSubPageChange?.("vouchers"); }}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold transition cursor-pointer whitespace-nowrap ${activeTab === "vouchers" ? "tab-active-gradient" : "text-stone-500 hover:bg-stone-50"}`}
            >
              <Banknote className="w-4 h-4" />
              Cash Vouchers
              {voucherRows.some((v) => v.status === "Pending Approval") && (
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none ${
                  activeTab === "vouchers"
                    ? "bg-stsn-brown/15 text-stsn-brown"
                    : "bg-amber-100 text-amber-700"
                }`}>
                  {voucherRows.filter((v) => v.status === "Pending Approval").length}
                </span>
              )}
            </button>
          )}
          {pageAccessByTab.history && (
            <button
              onClick={() => { setActiveTab("history"); onSubPageChange?.("history"); }}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold transition cursor-pointer whitespace-nowrap ${activeTab === "history" ? "tab-active-gradient" : "text-stone-500 hover:bg-stone-50"}`}
            >
              <History className="w-4 h-4" />
              Collection History
            </button>
          )}
          {pageAccessByTab.reports && (
            <button
              onClick={() => { setActiveTab("reports"); onSubPageChange?.("reports"); }}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold transition cursor-pointer whitespace-nowrap ${activeTab === "reports" ? "tab-active-gradient" : "text-stone-500 hover:bg-stone-50"}`}
            >
              <BarChart3 className="w-4 h-4" />
              Reports
            </button>
          )}

          {/* Search — flush right */}
          <div className="flex-1 flex items-center justify-end px-3 py-2 gap-2">
            {activeTab === "history" && (
              <div className="flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                <input
                  type="date"
                  value={historyDateFilter}
                  onChange={(e) => setHistoryDateFilter(e.target.value)}
                  className="bg-stone-50 border border-stone-200 rounded-lg py-1.5 px-2 text-xs font-semibold focus:ring-1 focus:ring-stsn-brown focus:outline-none w-36"
                  title="Filter by date"
                />
                {historyDateFilter && (
                  <button
                    type="button"
                    onClick={() => setHistoryDateFilter("")}
                    className="text-stone-400 hover:text-stone-600 transition cursor-pointer"
                    title="Clear date filter"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 w-3.5 h-3.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search student…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-stone-50 border border-stone-200 rounded-lg py-1.5 pl-7 pr-3 text-xs focus:ring-1 focus:ring-stsn-brown focus:outline-none font-medium w-44"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── PAYMENT QUEUE ─────────────────────────────────── */}
      {!activeTabAccessible && (
        <AppCard className="border border-amber-200 bg-amber-50/60">
          <p className="text-xs text-amber-800">
            This cashier page is disabled for the current access profile.
          </p>
        </AppCard>
      )}

      {activeTabAccessible && activeTab === "queue" && (
        <div className="space-y-4 animate-fade-in">

          {/* Approved for Payment */}
          <div className="bg-white rounded-xl border border-stsn-beige shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-stsn-gold" />
                <h3 className="text-sm font-display font-bold text-stone-900">Approved for Payment</h3>
              </div>
              <p className="text-[10px] text-stone-400 font-mono">{queueRows.length} in queue</p>
            </div>

            <div className="p-4">
              {queueRows.length === 0 ? (
                <EmptyState
                  icon={Receipt}
                  title="Payment Queue is Empty"
                  description="Assessments approved by Accounting and with an outstanding balance will appear here."
                  compact
                />
              ) : (
                <div className="space-y-3">
                  {paginatedQueueRows.map(({ assessment, student }) => {
                    const books = getBookPackageInfo(assessment, scopedBookPackages);
                    const netPayable = Math.max(0, assessment.totalAmount - assessment.discountAmount);
                    return (
                      <div
                        key={assessment.id}
                        className="border border-stone-200 rounded-xl overflow-hidden flex flex-col sm:flex-row"
                      >
                        {/* Left — student + assessment info */}
                        <div className="flex-1 p-4 bg-stone-50/60">
                          <div className="flex flex-wrap items-center gap-1.5 mb-2">
                            <AppStatusBadge status={ASSESSMENT_APPROVAL_STATUS_CONFIG["Approved for Payment"].label} />
                            {books && (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border text-purple-700 bg-purple-50 border-purple-200 flex items-center gap-1">
                                <Package className="w-3 h-3" /> {books.packageName}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-bold text-stone-900 leading-tight">
                            {student ? `${student.lastName}, ${student.firstName}` : "Unknown Student"}
                          </p>
                          <p className="text-[10px] font-mono text-stone-400 mt-0.5">{student?.studentNo}</p>
                          <p className="text-[10px] text-stone-500 mt-1.5">{getAcademicLine(student, academicUnit)} • {assessment.schoolYear}</p>
                          <p className="text-[10px] text-stone-500">Payment Term: <span className="font-semibold">{assessment.paymentTerm}</span></p>
                          <div className="mt-2 flex items-center gap-3">
                            <div>
                              <p className="text-[9px] uppercase font-mono text-stone-400">Net Payable</p>
                              <p className="text-xs font-mono font-bold text-stone-700">₱{netPayable.toLocaleString()}</p>
                            </div>
                            {assessment.discountAmount > 0 && (
                              <div>
                                <p className="text-[9px] uppercase font-mono text-stone-400">Discount</p>
                                <p className="text-xs font-mono font-bold text-emerald-600">−₱{assessment.discountAmount.toLocaleString()}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right — balance + action */}
                        <div className="sm:w-44 flex flex-col items-center justify-center p-4 bg-emerald-50 border-t sm:border-t-0 sm:border-l border-emerald-200 gap-3">
                          <div className="text-center">
                            <p className="text-[9px] uppercase font-mono font-bold text-emerald-600 tracking-wider">Balance Due</p>
                            <p className="text-2xl font-display font-black text-emerald-700 leading-tight mt-0.5">
                              ₱{assessment.balance.toLocaleString()}
                            </p>
                          </div>
                          {canCollectPayment && (
                            <AppButton type="button" onClick={() => openCollect(assessment.id)} leftIcon={Banknote} variant="primary" size="sm" fullWidth>
                              Collect Payment
                            </AppButton>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <CardPagination page={approvedPage} totalRecords={queueRows.length} pageSize={rowsPerPage} onPageChange={setApprovedPage} />
            </div>
          </div>

          {/* Awaiting Accounting — read-only context */}
          {awaitingRows.length > 0 && (
            <div className="bg-white rounded-xl border border-stsn-beige shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-stone-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-stone-400" />
                <h3 className="text-sm font-display font-bold text-stone-900">Awaiting Accounting Approval</h3>
                <p className="text-[10px] text-stone-400 font-mono ml-auto">{awaitingRows.length} pending</p>
              </div>
              <div className="p-4">
                <p className="text-xs text-stone-500 mb-3">
                  These assessments have not yet been approved for payment and cannot be collected at the cashier window.
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
                          <AppStatusBadge status={cfg.label} />
                          <p className="text-[10px] text-stone-400 mt-1 font-mono">₱{assessment.balance.toLocaleString()}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <CardPagination page={pendingPage} totalRecords={awaitingRows.length} pageSize={rowsPerPage} onPageChange={setPendingPage} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── OTHER PAYMENTS (OR) ───────────────────────────────── */}
      {activeTabAccessible && activeTab === "other-payments" && (
        <div className="bg-white rounded-xl border border-stsn-beige shadow-sm overflow-hidden animate-fade-in">
          <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-stsn-gold" />
              <h3 className="text-sm font-display font-bold text-stone-900">Other Payments</h3>
              <p className="text-[10px] text-stone-400 font-mono">{orPaymentRows.length} records</p>
            </div>
            {canCollectOtherPayment && (
              <AppButton type="button" onClick={openOrCollectModal} leftIcon={Plus} variant="primary" size="sm">
                New Collection
              </AppButton>
            )}
          </div>
          <div className="p-4">
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-700 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>Use this for walk-in collections outside the Payment Queue (transcript fees, ID replacement, certifications, library fines, etc.). Choose <strong>OR</strong> for a standalone collection, or <strong>AR</strong> to apply it against the student's balance.</span>
            </div>
            {orPaymentRows.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No Other Payments Yet"
                description="Standalone collections not tied to an assessment will appear here."
                compact
              />
            ) : (
              <AppTable<{ payment: Payment; student?: Student }>
                columns={otherPaymentColumns}
                data={orPaymentRows}
                emptyMessage="No other payments recorded yet."
                initialPageSize={10}
                pageSizeOptions={[10]}
                enableSearch={false}
                getRowId={(row) => row.payment.id}
              />
            )}
          </div>
        </div>
      )}

      {/* ── CASH VOUCHERS ─────────────────────────────────────── */}
      {activeTabAccessible && activeTab === "vouchers" && (
        <div className="bg-white rounded-xl border border-stsn-beige shadow-sm overflow-hidden animate-fade-in">
          <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Banknote className="w-4 h-4 text-stsn-gold" />
              <h3 className="text-sm font-display font-bold text-stone-900">Cash Vouchers</h3>
              <p className="text-[10px] text-stone-400 font-mono">{voucherRows.length} records</p>
            </div>
            {canCreateVoucher && (
              <AppButton type="button" onClick={openVoucherModal} leftIcon={Plus} variant="primary" size="sm">
                New Voucher Request
              </AppButton>
            )}
          </div>
          <div className="p-4">
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-700 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>Cash release for refunds, reimbursements, and petty cash requires Accounting approval before it can be released.</span>
            </div>
            {voucherRows.length === 0 ? (
              <EmptyState
                icon={Banknote}
                title="No Cash Vouchers Yet"
                description="Cash release requests — refunds, reimbursements, petty cash — will appear here."
                compact
              />
            ) : (
              <AppTable<CashVoucher>
                columns={voucherColumns}
                data={voucherRows}
                emptyMessage="No cash vouchers recorded yet."
                initialPageSize={10}
                pageSizeOptions={[10]}
                enableSearch={false}
                getRowId={(row) => row.id}
              />
            )}
          </div>
        </div>
      )}

      {/* ── COLLECTION HISTORY ─────────────────────────────── */}
      {activeTabAccessible && activeTab === "history" && (
        <div className="bg-white rounded-xl border border-stsn-beige shadow-sm overflow-hidden animate-fade-in">
          <div className="px-4 py-3 border-b border-stone-100 flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-stsn-gold" />
            <h3 className="text-sm font-display font-bold text-stone-900">Payment Collection History</h3>
            {historyDateFilter && (
              <span className="ml-auto text-[10px] font-bold text-stsn-brown bg-stsn-cream border border-stsn-beige px-2 py-0.5 rounded-full font-mono">
                {historyDateFilter}
              </span>
            )}
            {!historyDateFilter && (
              <p className="text-[10px] text-stone-400 font-mono ml-auto">{filteredHistoryRows.length} records</p>
            )}
          </div>
          <div className="p-4">
            {historyDateFilter && filteredHistoryRows.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="No Payments on This Date"
                description="No payments were posted on the selected date. Try a different date or clear the filter."
                compact
              />
            ) : (
              <AppTable<CashierHistoryRow>
                columns={historyColumns}
                data={filteredHistoryRows}
                emptyMessage="No payments recorded yet."
                initialPageSize={10}
                pageSizeOptions={[10]}
                enableSearch={false}
                getRowId={(row) => row.payment.id}
              />
            )}
          </div>
        </div>
      )}

      {/* ── CASHIER REPORTS ─────────────────────────────────── */}
      {activeTabAccessible && activeTab === "reports" && (
        <div className="space-y-4 animate-fade-in">

          {/* Report controls */}
          <div className="bg-white rounded-xl border border-stsn-beige shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-stone-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-stsn-gold" />
              <h3 className="text-sm font-display font-bold text-stone-900">Report Generator</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
                <div className="lg:col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1.5 tracking-wide">Report Type</label>
                  <select
                    value={selectedReportId}
                    onChange={(e) => setSelectedReportId(e.target.value as CashierReportId)}
                    className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown"
                  >
                    {CASHIER_REPORT_OPTIONS.map((report) => <option key={report.id} value={report.id}>{report.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1.5 tracking-wide">Date From</label>
                  <input
                    type="date"
                    value={reportDateFrom}
                    onChange={(e) => setReportDateFrom(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1.5 tracking-wide">Date To</label>
                  <input
                    type="date"
                    value={reportDateTo}
                    onChange={(e) => setReportDateTo(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Report output */}
          <div className="bg-white rounded-xl border border-stsn-beige shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-stsn-gold" />
                  <h4 className="text-sm font-display font-bold text-stone-900">{selectedReport.title}</h4>
                </div>
                <p className="text-xs text-stone-500 mt-0.5 ml-6">{selectedReport.desc}</p>
              </div>
              <div className="flex flex-wrap gap-2 flex-shrink-0">
                <AppButton type="button" onClick={() => exportCurrentReport("print")} leftIcon={Printer} variant="outline" size="sm">Print</AppButton>
                <AppButton type="button" onClick={() => exportCurrentReport("csv")} leftIcon={Download} variant="outline" size="sm">CSV</AppButton>
                <AppButton type="button" onClick={() => exportCurrentReport("excel")} leftIcon={Download} variant="outline" size="sm">Excel</AppButton>
                <AppButton type="button" onClick={() => exportCurrentReport("pdf")} leftIcon={Download} variant="outline" size="sm">PDF</AppButton>
              </div>
            </div>
            <div className="p-4">
              {selectedReportId === "voided-receipts" && (
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-700 flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>Shows all receipts with an active void request (Pending, Approved, or Rejected). Cashiers can submit void requests from Collection History; Accounting approves via the Approval Queue.</span>
                </div>
              )}
              <AppTable<ReportRow>
                columns={cashierReportTableColumns}
                data={reportRows}
                enableSearch={false}
                emptyMessage="No report rows for the selected filters."
                initialPageSize={10}
                pageSizeOptions={[10]}
                getRowId={(_row, index) => `${selectedReportId}-${index}`}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── COLLECT PAYMENT MODAL ─────────────────────────── */}
      {collectRow && (
        <AppModal
          open={true}
          onClose={() => setCollectModalId(null)}
          title="Collect Payment"
          eyebrow="Cashier Window"
          icon={Banknote}
          panelAs="form"
          onSubmit={handlePostPayment}
          maxWidthClass="max-w-lg"
          footer={
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setCollectModalId(null)} className="text-xs font-bold px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer transition">Cancel</button>
              <button type="submit" className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer transition"><CheckCircle className="w-3.5 h-3.5" /> Post Payment</button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2 text-blue-700">
              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>Fees, discounts, books, and approval status are read-only and were set by Accounting. Cashier may only record a payment.</span>
            </div>

            {/* Student + assessment summary */}
            <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 space-y-1.5">
              <p className="text-sm font-bold text-stone-900">{collectRow.student ? `${collectRow.student.lastName}, ${collectRow.student.firstName}` : "—"}</p>
              <p className="font-mono text-stone-400">{collectRow.student?.studentNo}</p>
              <p className="text-stone-500">{getAcademicLine(collectRow.student, academicUnit)} • {collectRow.assessment.schoolYear}</p>

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

            {/* Payment form fields */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1.5 tracking-wide">
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
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1.5 tracking-wide">Amount to Collect</label>
              <input
                type="number" min="1" step="0.01" required
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1.5 tracking-wide">Payment Method</label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as Payment["paymentMethod"] })}
                  className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown"
                >
                  {paymentMethodOptions.map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1.5 tracking-wide">Term / Purpose</label>
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
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1.5 tracking-wide">Reference No. (optional)</label>
              <input
                type="text"
                value={paymentForm.reference}
                onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                placeholder="GCash/Bank reference, check no., etc."
                className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown"
              />
            </div>
          </div>
        </AppModal>
      )}

      {/* ── VOID REQUEST MODAL ──────────────────────────────── */}
      {voidModalPaymentId && (() => {
        const voidPayment = scopedPayments.find((p) => p.id === voidModalPaymentId);
        const voidStudent = voidPayment ? scopedStudents.find((s) => s.id === voidPayment.studentId) : undefined;
        const handleSubmitVoid = (e: React.FormEvent) => {
          e.preventDefault();
          if (!canVoidPayment) return;
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
          <AppModal
            open={true}
            onClose={() => { setVoidModalPaymentId(null); setVoidReason(""); setVoidConfirmInput(""); }}
            title="Request Receipt Void"
            eyebrow="Void Request"
            icon={Ban}
            panelAs="form"
            onSubmit={handleSubmitVoid}
            maxWidthClass="max-w-lg"
            footer={
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => { setVoidModalPaymentId(null); setVoidReason(""); setVoidConfirmInput(""); }} className="text-xs font-bold px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer transition">Cancel</button>
                <button type="submit" disabled={!voidReason.trim() || voidConfirmInput !== voidPayment?.orNumber} className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed"><Ban className="w-3.5 h-3.5" /> Submit Void Request</button>
              </div>
            }
          >
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

              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1.5 tracking-wide">
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
                <label className="block text-[10px] uppercase font-bold text-red-600 mb-1.5 tracking-wide">
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
            </div>
          </AppModal>
        );
      })()}

      {/* ── OTHER PAYMENT (AR/OR) COLLECTION MODAL ──────────── */}
      {orCollectModalOpen && (
        <AppModal
          open={true}
          onClose={() => setOrCollectModalOpen(false)}
          title={orCollectForm.transactionType === "AR" ? "Collect Payment (AR)" : "Collect Other Payment (OR)"}
          eyebrow={orCollectForm.transactionType === "AR" ? "Applied to Balance" : "Standalone OR"}
          icon={FileText}
          panelAs="form"
          onSubmit={handlePostOtherPayment}
          maxWidthClass="max-w-lg"
          footer={
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setOrCollectModalOpen(false)} className="text-xs font-bold px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer transition">Cancel</button>
              <button type="submit" className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer transition"><CheckCircle className="w-3.5 h-3.5" /> Post Payment</button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1.5 tracking-wide">Transaction Type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOrCollectForm({ ...orCollectForm, transactionType: "OR", category: otherPaymentCategoryOptions[0] ?? "" })}
                  className={`flex-1 text-xs font-bold py-2 rounded-lg border cursor-pointer transition ${orCollectForm.transactionType === "OR" ? "bg-stsn-brown text-white border-stsn-brown" : "border-stone-200 text-stone-600 hover:bg-stone-50"}`}
                >
                  OR — Standalone Collection
                </button>
                <button
                  type="button"
                  onClick={() => setOrCollectForm({ ...orCollectForm, transactionType: "AR", category: paymentRemittanceTermOptions[0] ?? "" })}
                  className={`flex-1 text-xs font-bold py-2 rounded-lg border cursor-pointer transition ${orCollectForm.transactionType === "AR" ? "bg-stsn-brown text-white border-stsn-brown" : "border-stone-200 text-stone-600 hover:bg-stone-50"}`}
                >
                  AR — Apply to Balance
                </button>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2 text-blue-700">
              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              {orCollectForm.transactionType === "AR" ? (
                <span>This will be applied against the student's outstanding assessment balance (first active assessment). For a specific assessment, use the Payment Queue tab instead.</span>
              ) : (
                <span>This collection is not tied to an assessment and will not affect the student's outstanding balance.</span>
              )}
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1.5 tracking-wide">Student <span className="text-red-500">*</span></label>
              {orCollectForm.studentId ? (
                (() => {
                  const selected = scopedStudents.find((s) => s.id === orCollectForm.studentId);
                  return (
                    <div className="flex items-center justify-between bg-stone-50 border border-stone-200 rounded-lg p-2.5">
                      <div>
                        <p className="font-bold text-stone-800">{selected ? `${selected.lastName}, ${selected.firstName}` : "—"}</p>
                        <p className="text-[10px] font-mono text-stone-400">{selected?.studentNo}</p>
                      </div>
                      <button type="button" onClick={() => setOrCollectForm({ ...orCollectForm, studentId: "" })} className="text-stone-400 hover:text-stone-600 cursor-pointer">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })()
              ) : (
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 w-3.5 h-3.5 pointer-events-none" />
                    <input
                      type="text"
                      value={orCollectStudentQuery}
                      onChange={(e) => setOrCollectStudentQuery(e.target.value)}
                      placeholder="Search student by name or student no…"
                      className="w-full bg-white border border-stone-200 rounded-lg py-2 pl-7 pr-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown"
                    />
                  </div>
                  {orCollectStudentQuery.trim() && (
                    <div className="mt-1 border border-stone-200 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                      {findStudentMatches(orCollectStudentQuery).length === 0 ? (
                        <p className="text-[10px] text-stone-400 p-2">No matching students.</p>
                      ) : findStudentMatches(orCollectStudentQuery).map((s) => (
                        <button
                          type="button"
                          key={s.id}
                          onClick={() => { setOrCollectForm({ ...orCollectForm, studentId: s.id }); setOrCollectStudentQuery(""); }}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-stsn-cream cursor-pointer border-b border-stone-100 last:border-b-0"
                        >
                          <span className="font-semibold text-stone-800">{s.lastName}, {s.firstName}</span>
                          <span className="text-[10px] font-mono text-stone-400 block">{s.studentNo}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1.5 tracking-wide">
                {orCollectForm.transactionType === "AR" ? "Payment Term / Purpose" : "Category"} <span className="text-red-500">*</span>
              </label>
              <select
                value={orCollectForm.category}
                onChange={(e) => setOrCollectForm({ ...orCollectForm, category: e.target.value })}
                className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown"
              >
                {(orCollectForm.transactionType === "AR" ? paymentRemittanceTermOptions : otherPaymentCategoryOptions).map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1.5 tracking-wide">
                BIR Official Receipt No. <span className="text-stone-400 normal-case">(optional)</span>
              </label>
              <input
                type="text"
                value={orCollectForm.orNumber}
                onChange={(e) => { setOrCollectForm({ ...orCollectForm, orNumber: e.target.value }); setOrCollectError(null); }}
                placeholder="e.g. 0001234 — leave blank if no physical receipt is issued yet"
                className={`w-full bg-white border rounded-lg py-2 px-3 text-xs font-semibold font-mono focus:outline-none focus:ring-1 focus:ring-stsn-brown ${orCollectError ? "border-red-400 ring-1 ring-red-400" : "border-stone-200"}`}
              />
              {orCollectError && <p className="text-red-600 text-[10px] mt-1 font-semibold">{orCollectError}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1.5 tracking-wide">Amount</label>
                <input
                  type="number" min="1" step="0.01" required
                  value={orCollectForm.amount}
                  onChange={(e) => setOrCollectForm({ ...orCollectForm, amount: e.target.value })}
                  className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1.5 tracking-wide">Payment Method</label>
                <select
                  value={orCollectForm.paymentMethod}
                  onChange={(e) => setOrCollectForm({ ...orCollectForm, paymentMethod: e.target.value as Payment["paymentMethod"] })}
                  className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown"
                >
                  {paymentMethodOptions.map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1.5 tracking-wide">Remarks (optional)</label>
              <input
                type="text"
                value={orCollectForm.remarks}
                onChange={(e) => setOrCollectForm({ ...orCollectForm, remarks: e.target.value })}
                placeholder="Additional notes for this collection"
                className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown"
              />
            </div>
          </div>
        </AppModal>
      )}

      {/* ── CASH VOUCHER REQUEST MODAL ──────────────────────── */}
      {voucherModalOpen && (
        <AppModal
          open={true}
          onClose={() => setVoucherModalOpen(false)}
          title="Request Cash Voucher"
          eyebrow="Cash Release"
          icon={Banknote}
          panelAs="form"
          onSubmit={handleSubmitVoucherRequest}
          maxWidthClass="max-w-lg"
          footer={
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setVoucherModalOpen(false)} className="text-xs font-bold px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer transition">Cancel</button>
              <button type="submit" className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-stsn-brown hover:bg-stsn-brown/90 text-white cursor-pointer transition"><Send className="w-3.5 h-3.5" /> Submit Request</button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2 text-blue-700">
              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>Requires Accounting approval before the cashier can release the cash.</span>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1.5 tracking-wide">Payee Type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setVoucherForm({ ...voucherForm, payeeType: "Student" })}
                  className={`flex-1 text-xs font-bold py-2 rounded-lg border cursor-pointer transition ${voucherForm.payeeType === "Student" ? "bg-stsn-brown text-white border-stsn-brown" : "border-stone-200 text-stone-600 hover:bg-stone-50"}`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setVoucherForm({ ...voucherForm, payeeType: "External" })}
                  className={`flex-1 text-xs font-bold py-2 rounded-lg border cursor-pointer transition ${voucherForm.payeeType === "External" ? "bg-stsn-brown text-white border-stsn-brown" : "border-stone-200 text-stone-600 hover:bg-stone-50"}`}
                >
                  External (Staff / Vendor)
                </button>
              </div>
            </div>

            {voucherForm.payeeType === "Student" ? (
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1.5 tracking-wide">Payee Student <span className="text-red-500">*</span></label>
                {voucherForm.payeeStudentId ? (
                  (() => {
                    const selected = scopedStudents.find((s) => s.id === voucherForm.payeeStudentId);
                    return (
                      <div className="flex items-center justify-between bg-stone-50 border border-stone-200 rounded-lg p-2.5">
                        <div>
                          <p className="font-bold text-stone-800">{selected ? `${selected.lastName}, ${selected.firstName}` : "—"}</p>
                          <p className="text-[10px] font-mono text-stone-400">{selected?.studentNo}</p>
                        </div>
                        <button type="button" onClick={() => setVoucherForm({ ...voucherForm, payeeStudentId: "" })} className="text-stone-400 hover:text-stone-600 cursor-pointer">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })()
                ) : (
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 w-3.5 h-3.5 pointer-events-none" />
                      <input
                        type="text"
                        value={voucherStudentQuery}
                        onChange={(e) => setVoucherStudentQuery(e.target.value)}
                        placeholder="Search student by name or student no…"
                        className="w-full bg-white border border-stone-200 rounded-lg py-2 pl-7 pr-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown"
                      />
                    </div>
                    {voucherStudentQuery.trim() && (
                      <div className="mt-1 border border-stone-200 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                        {findStudentMatches(voucherStudentQuery).length === 0 ? (
                          <p className="text-[10px] text-stone-400 p-2">No matching students.</p>
                        ) : findStudentMatches(voucherStudentQuery).map((s) => (
                          <button
                            type="button"
                            key={s.id}
                            onClick={() => { setVoucherForm({ ...voucherForm, payeeStudentId: s.id }); setVoucherStudentQuery(""); }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-stsn-cream cursor-pointer border-b border-stone-100 last:border-b-0"
                          >
                            <span className="font-semibold text-stone-800">{s.lastName}, {s.firstName}</span>
                            <span className="text-[10px] font-mono text-stone-400 block">{s.studentNo}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1.5 tracking-wide">Payee Name <span className="text-red-500">*</span></label>
                <input
                  type="text" required
                  value={voucherForm.payeeNameExternal}
                  onChange={(e) => setVoucherForm({ ...voucherForm, payeeNameExternal: e.target.value })}
                  placeholder="Staff or vendor name"
                  className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown"
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1.5 tracking-wide">Category <span className="text-red-500">*</span></label>
              <select
                value={voucherForm.category}
                onChange={(e) => setVoucherForm({ ...voucherForm, category: e.target.value })}
                className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown"
              >
                {cashVoucherCategoryOptions.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1.5 tracking-wide">Voucher No. <span className="text-red-500">*</span></label>
              <input
                type="text" required
                value={voucherForm.voucherNo}
                onChange={(e) => { setVoucherForm({ ...voucherForm, voucherNo: e.target.value }); setVoucherError(null); }}
                placeholder="e.g. CV-0001 — must match physical voucher booklet"
                className={`w-full bg-white border rounded-lg py-2 px-3 text-xs font-semibold font-mono focus:outline-none focus:ring-1 focus:ring-stsn-brown ${voucherError ? "border-red-400 ring-1 ring-red-400" : "border-stone-200"}`}
              />
              {voucherError && <p className="text-red-600 text-[10px] mt-1 font-semibold">{voucherError}</p>}
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1.5 tracking-wide">Amount</label>
              <input
                type="number" min="1" step="0.01" required
                value={voucherForm.amount}
                onChange={(e) => setVoucherForm({ ...voucherForm, amount: e.target.value })}
                className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1.5 tracking-wide">Purpose <span className="text-red-500">*</span></label>
              <textarea
                required
                rows={2}
                value={voucherForm.purpose}
                onChange={(e) => setVoucherForm({ ...voucherForm, purpose: e.target.value })}
                placeholder="Reason for this cash release"
                className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown resize-none"
              />
            </div>
          </div>
        </AppModal>
      )}

      {/* ── CASH VOUCHER DECISION MODAL (Approve / Reject) ──── */}
      {voucherDecision && (
        <AppModal
          open={true}
          onClose={() => { setVoucherDecision(null); setVoucherDecisionRemarks(""); }}
          title={voucherDecision.action === "approve" ? "Approve Cash Voucher" : "Reject Cash Voucher"}
          eyebrow="Accounting Review"
          icon={voucherDecision.action === "approve" ? CheckCircle : ThumbsDown}
          maxWidthClass="max-w-md"
          footer={
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setVoucherDecision(null); setVoucherDecisionRemarks(""); }} className="text-xs font-bold px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer transition">Cancel</button>
              <button
                type="button"
                onClick={submitVoucherDecision}
                disabled={voucherDecision.action === "reject" && !voucherDecisionRemarks.trim()}
                className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl text-white cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed ${voucherDecision.action === "approve" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}`}
              >
                {voucherDecision.action === "approve" ? <CheckCircle className="w-3.5 h-3.5" /> : <ThumbsDown className="w-3.5 h-3.5" />}
                {voucherDecision.action === "approve" ? "Approve" : "Reject"}
              </button>
            </div>
          }
        >
          <div className="space-y-3 text-xs">
            <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1.5 tracking-wide">
              Remarks {voucherDecision.action === "reject" && <span className="text-red-500">*</span>}
            </label>
            <textarea
              rows={3}
              value={voucherDecisionRemarks}
              onChange={(e) => setVoucherDecisionRemarks(e.target.value)}
              placeholder={voucherDecision.action === "approve" ? "Optional approval notes" : "Reason for rejection"}
              className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown resize-none"
            />
          </div>
        </AppModal>
      )}

      {/* ── CASH VOUCHER PREVIEW ────────────────────────────── */}
      {voucherPreview && (
        <PreviewModal isOpen={true} onClose={() => setVoucherPreview(null)} title="Cash Voucher">
          <VoucherPreview voucher={voucherPreview} />
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-[11px] flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>Voucher preview only. Use the Print button above to print this voucher.</span>
          </div>
          <div className="mt-3 flex justify-end">
            <button type="button" onClick={() => setVoucherPreview(null)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer transition"><X className="w-3.5 h-3.5" /> Close</button>
          </div>
        </PreviewModal>
      )}

      {/* ── RECEIPT PREVIEW ─────────────────────────────────── */}
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
            <button type="button" onClick={() => setReceipt(null)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer transition"><X className="w-3.5 h-3.5" /> Close</button>
          </div>
        </PreviewModal>
      )}
    </div>
  );
}

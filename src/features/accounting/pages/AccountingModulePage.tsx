/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { useSTSNStore } from "../../../services/store";
import { useAppDialog } from "../../../components/common/useAppDialog";
import { DiscountRequest, DiscountType } from "../../../types";
import {
  Coins, TrendingUp, FileText, Search, Filter, Plus, Edit2, Trash2,
  CheckCircle, XCircle, Clock, Eye, AlertCircle, Award, Receipt,
  Percent, Calendar, Scale, ChevronDown, BarChart3, ArrowUpRight,
  Download, Users, BookOpen, Wallet, Paperclip, X, ChevronRight,
  RefreshCw, Info, Lock, Unlock, ClipboardList, Banknote, Printer, UserCircle2,
  RotateCcw, History, GraduationCap, AlertTriangle
} from "lucide-react";
import { PreviewModal, ReceiptPreview } from "../../../components/ModalPreviews";
import STSNDataTable, { type STSNColumn } from "../../../components/common/STSNDataTable";
import SLABadge from "../../../components/common/SLABadge";
import { Payment, StudentAssessment, Student } from "../../../types";
import { getAccountingLabels, FINANCIAL_HOLD_STATUS_CONFIG, DISCOUNT_STATUS_CONFIG, BLOCKED_PROCESS_LABELS, DEFAULT_HOLD_CATEGORY, ASSESSMENT_APPROVAL_STATUS_CONFIG, DEFAULT_ASSESSMENT_APPROVAL_STATUS } from "../../../config/accounting.config";
import { FinancialHold, AssessmentBillingSummary, BookPackage } from "../../../types";
import ChartOfAccountsPage from "./sub-pages/ChartOfAccountsPage";
import CostCentersPage from "./sub-pages/CostCentersPage";
import JournalEntriesPage from "./sub-pages/JournalEntriesPage";
import SupplierManagementPage from "./sub-pages/SupplierManagementPage";
import ItemProductManagementPage from "./sub-pages/ItemProductManagementPage";
import SalesInvoicesPage from "./sub-pages/SalesInvoicesPage";
import PurchaseInvoicesPage from "./sub-pages/PurchaseInvoicesPage";
import ARAgingPage from "./sub-pages/ARAgingPage";
import APAgingPage from "./sub-pages/APAgingPage";
import FinancialStatementsPage from "./sub-pages/FinancialStatementsPage";

type AccountingTab = "dashboard" | "ledger" | "discounts" | "billing" | "holds";


/** Default Discount Type form state, including enterprise policy fields. */
const DEFAULT_TYPE_FORM = {
  code: "",
  name: "",
  discountPercent: 0,
  discountSource: "Sibling" as DiscountType["discountSource"],
  requiresApproval: true,
  description: "",
  effectiveSchoolYear: "2026-2027",
  applicableAcademicUnit: "both" as DiscountType["applicableAcademicUnit"],
  appliesTo: "Tuition" as NonNullable<DiscountType["appliesTo"]>,
  discountBasis: "Percentage" as NonNullable<DiscountType["discountBasis"]>,
  discountFixedAmount: 0,
  isStackable: false,
  requiresDocument: false,
  maxAmount: 0,
};

/** Resolves the accounting AcademicUnit for a student from its Basic Ed / College department. */
function getStudentAccountingUnit(student?: Student): "basic-ed" | "college" {
  return student?.department === "College" ? "college" : "basic-ed";
}

/** Builds the Basic Ed vs College meta line for a receivable (Grade Level/Section/Monthly Plan vs Program/Year Level/Semester/Units). */
function getReceivableMetaLine(student: Student | undefined, assessment: StudentAssessment): string {
  const unit = getStudentAccountingUnit(student);
  const labels = getAccountingLabels(unit);
  if (unit === "basic-ed") {
    return `${labels.levelLabel}: ${student?.yearLevel || "—"} • ${labels.groupLabel}: ${student?.section || "—"} • ${labels.termLabel}: ${assessment.paymentTerm}`;
  }
  return `${labels.programLabel}: ${student?.trackOrCourse || "—"} • ${labels.levelLabel}: ${student?.yearLevel || "—"} • ${labels.termLabel}: ${assessment.semester} • ${labels.billingBasisLabel}: ${assessment.fees.length} Items`;
}

/** Builds the Basic Ed vs College academic info line for a discount request card. */
function getRequestAcademicLine(student: Student | undefined, assessment: StudentAssessment | undefined): string {
  if (!student) return "—";
  const unit = getStudentAccountingUnit(student);
  const labels = getAccountingLabels(unit);
  if (unit === "basic-ed") {
    return `${labels.levelLabel}: ${student.yearLevel || "—"} • ${labels.groupLabel}: ${student.section || "—"}`;
  }
  return `${labels.programLabel}: ${student.trackOrCourse || "—"} • ${labels.levelLabel}: ${student.yearLevel || "—"} • ${labels.termLabel}: ${assessment?.semester || "—"}`;
}

/** Badge styles for the Applicable Academic Unit chip on a Discount Type. */
const ACADEMIC_UNIT_BADGE: Record<string, { label: string; badgeClass: string }> = {
  "basic-ed": { label: "Basic Ed", badgeClass: "text-blue-700 bg-blue-50 border-blue-200" },
  "college": { label: "College", badgeClass: "text-purple-700 bg-purple-50 border-purple-200" },
  "both": { label: "Basic Ed + College", badgeClass: "text-stone-700 bg-stone-50 border-stone-200" },
};

/** Max Amount / Max % display for a Discount Type, based on discount basis. */
function getMaxAmountLabel(dt: DiscountType): string {
  if (dt.discountBasis === "Fixed Amount" && dt.discountFixedAmount) return `₱${dt.discountFixedAmount.toLocaleString()} fixed`;
  if (dt.maxAmount) return `Up to ₱${dt.maxAmount.toLocaleString()}`;
  return `${dt.discountPercent}% (no cap)`;
}

/** Auto Apply Rule description for a Discount Type, derived from requiresApproval + appliesTo. */
function getAutoApplyRuleLabel(dt: DiscountType): string {
  return !dt.requiresApproval
    ? `Auto-applies to ${dt.appliesTo || "Total Assessment"} on eligibility match`
    : "Manual L1/L2 approval required before applying";
}

/** Resolves the display label + badge style for a discount request's workflow status. */
function getRequestWorkflowStatus(req: DiscountRequest): { label: string; badgeClass: string } {
  if (req.status === "Pending" || req.status === "For Review") {
    if (req.level1Status === "Pending") {
      return { label: "Pending L1 Review", badgeClass: "text-amber-700 bg-amber-50 border-amber-200" };
    }
    if (req.level1Status === "Approved" && req.level2Status === "Pending") {
      return { label: "Pending L2 Review", badgeClass: "text-blue-700 bg-blue-50 border-blue-200" };
    }
  }
  const cfg = DISCOUNT_STATUS_CONFIG[req.status];
  return { label: cfg.label, badgeClass: cfg.badgeClass };
}

const REQUEST_STATUS_FILTERS = ["All", "Pending L1 Review", "Pending L2 Review", "Approved", "Rejected", "Returned for Documents", "Expired", "Cancelled"];

// ============================================================
// ACCOUNTING DASHBOARD TAB
// ============================================================
function AccountingDashboard() {
  const {
    assessments,
    payments,
    students,
    discountTypes,
    discountRequests,
    financialHolds,
    paymentCollectionSummaries,
    promissoryNotes,
  } = useSTSNStore();

  const totalAssessed = useMemo(() => assessments.reduce((s, a) => s + a.totalAmount, 0), [assessments]);
  const totalCollected = useMemo(() => payments.reduce((s, p) => s + p.amount, 0), [payments]);
  const totalOutstanding = useMemo(() => assessments.reduce((s, a) => s + a.balance, 0), [assessments]);
  const totalDiscounts = useMemo(() => assessments.reduce((s, a) => s + a.discountAmount, 0), [assessments]);
  const studentsWithBalance = useMemo(() => assessments.filter((a) => a.balance > 0).length, [assessments]);
  const studentsCleared = useMemo(() => assessments.filter((a) => a.balance === 0).length, [assessments]);
  const pendingRequests = useMemo(() => discountRequests.filter((r) => r.status === "Pending" || r.status === "For Review").length, [discountRequests]);

  const collectionByMethod = useMemo(() => {
    const map: Record<string, number> = {};
    payments.forEach((p) => { map[p.paymentMethod] = (map[p.paymentMethod] || 0) + p.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [payments]);

  const recentPayments = useMemo(() => [...payments].sort((a, b) => b.paymentDate.localeCompare(a.paymentDate)).slice(0, 6), [payments]);

  // "Today" surrogate for the prototype — most recent payment date present in the mock data.
  const latestPaymentDate = useMemo(() => payments.reduce((max, p) => (p.paymentDate > max ? p.paymentDate : max), ""), [payments]);
  const todaysCollection = useMemo(() => payments.filter((p) => p.paymentDate === latestPaymentDate).reduce((s, p) => s + p.amount, 0), [payments, latestPaymentDate]);

  const pendingPaymentVerifications = useMemo(() => paymentCollectionSummaries.filter((p) => p.verificationStatus === "Pending Verification").length, [paymentCollectionSummaries]);
  const activeFinancialHolds = useMemo(() => financialHolds.filter((h) => h.status === "Active"), [financialHolds]);
  const promissoryNotesDue = useMemo(() => promissoryNotes.filter((n) => n.status !== "Settled").length, [promissoryNotes]);

  const receivables = useMemo(() => [...assessments].filter((a) => a.balance > 0).sort((a, b) => b.balance - a.balance), [assessments]);

  const kpis = [
    { label: "Total Assessed", value: `₱${totalAssessed.toLocaleString()}`, icon: FileText, critical: false, card: "bg-gradient-to-br from-amber-50 via-yellow-50 to-stsn-cream border-amber-200/70", iconBg: "bg-amber-100 text-stsn-brown-dark" },
    { label: "Total Collected", value: `₱${totalCollected.toLocaleString()}`, icon: Coins, critical: false, card: "bg-gradient-to-br from-emerald-50 via-green-50 to-stsn-cream border-emerald-200/70", iconBg: "bg-emerald-100 text-emerald-700" },
    { label: "Outstanding Balance", value: `₱${totalOutstanding.toLocaleString()}`, icon: AlertCircle, critical: true, card: "bg-gradient-to-br from-rose-50 via-red-50 to-stsn-cream border-rose-200/70", iconBg: "bg-rose-100 text-red-700" },
    { label: "Today's Collection", value: `₱${todaysCollection.toLocaleString()}`, icon: TrendingUp, critical: false, card: "bg-gradient-to-br from-teal-50 via-cyan-50 to-stsn-cream border-teal-200/70", iconBg: "bg-teal-100 text-teal-700" },
  ];

  const actionItems: { icon: React.ElementType; label: string; count: number }[] = [
    { icon: Percent, label: "Discount request(s) awaiting review", count: pendingRequests },
    { icon: Wallet, label: "Payment(s) pending verification", count: pendingPaymentVerifications },
    { icon: Lock, label: "Student(s) on financial hold", count: activeFinancialHolds.length },
    { icon: Banknote, label: "Promissory note(s) due for follow-up", count: promissoryNotesDue },
  ];

  const discountedAssessments = useMemo(() => assessments.filter((a) => a.discountAmount > 0), [assessments]);

  type DiscountSummaryRow = { id: string; studentLabel: string; scholarshipName: string; discountPercentage: number; discountAmount: number };
  const discountSummaryRows: DiscountSummaryRow[] = useMemo(() => discountedAssessments.map((a) => {
    const stud = students.find((s) => s.id === a.studentId);
    return {
      id: a.id,
      studentLabel: stud ? `${stud.lastName}, ${stud.firstName}` : "—",
      scholarshipName: a.scholarshipName || "General Discount",
      discountPercentage: a.discountPercentage,
      discountAmount: a.discountAmount,
    };
  }), [discountedAssessments, students]);

  const discountSummaryColumns: STSNColumn<DiscountSummaryRow>[] = [
    { title: "Student", data: "studentLabel", className: "font-semibold text-stone-800" },
    { title: "Scholarship / Discount", data: "scholarshipName", className: "text-stone-600" },
    { title: "% Disc", data: "discountPercentage", className: "text-right font-mono font-bold text-amber-700", render: (v) => `${v}%` },
    { title: "Amount Saved", data: "discountAmount", className: "text-right font-mono font-bold text-emerald-700", render: (v) => `₱${v.toLocaleString()}` },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className={`${kpi.card} border rounded-xl shadow-sm hover:shadow-md transition-shadow p-4`}
            >
              <div className={`inline-flex p-2 rounded-lg mb-2 shadow-sm ${kpi.iconBg}`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-[10px] uppercase font-mono tracking-wider text-stone-500 leading-tight">{kpi.label}</p>
              <p className={`text-lg font-display font-black mt-0.5 ${kpi.critical ? "text-red-700" : "text-stone-800"}`}>{kpi.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Collection Snapshot */}
        <div className="bg-white rounded-xl border border-stsn-beige shadow-sm p-5">
          <h3 className="text-xs font-display font-bold uppercase tracking-wider text-stone-700 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-stsn-gold" /> Collection Snapshot
          </h3>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-stone-50 rounded-lg p-2 text-center">
              <p className="text-sm font-display font-black text-orange-600">{studentsWithBalance}</p>
              <p className="text-[9px] uppercase font-mono text-stone-400 leading-tight">With Balance</p>
            </div>
            <div className="bg-stone-50 rounded-lg p-2 text-center">
              <p className="text-sm font-display font-black text-teal-600">{studentsCleared}</p>
              <p className="text-[9px] uppercase font-mono text-stone-400 leading-tight">Cleared</p>
            </div>
            <div className="bg-stone-50 rounded-lg p-2 text-center">
              <p className="text-sm font-display font-black text-amber-600">₱{totalDiscounts.toLocaleString()}</p>
              <p className="text-[9px] uppercase font-mono text-stone-400 leading-tight">Discounts Given</p>
            </div>
          </div>
          <div className="space-y-3">
            {collectionByMethod.map(([method, amount]) => {
              const pct = totalCollected > 0 ? Math.round((amount / totalCollected) * 100) : 0;
              return (
                <div key={method}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-stone-700">{method}</span>
                    <span className="text-xs font-mono font-bold text-stsn-brown">₱{amount.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-2">
                    <div className="bg-gradient-to-r from-stsn-brown to-stsn-gold h-2 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[9px] text-stone-400 font-mono">{pct}%</span>
                </div>
              );
            })}
            {collectionByMethod.length === 0 && <p className="text-xs text-stone-400 text-center py-4">No collections recorded.</p>}
          </div>
        </div>

        {/* Receivables Watchlist */}
        <div className="bg-white rounded-xl border border-stsn-beige shadow-sm p-5">
          <h3 className="text-xs font-display font-bold uppercase tracking-wider text-stone-700 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-stsn-gold" /> Receivables Watchlist
          </h3>
          <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1">
            {receivables.map((a) => {
              const stud = students.find((s) => s.id === a.studentId);
              return (
                <div key={a.id} className="flex items-center justify-between p-2.5 bg-stone-50 rounded-lg border border-stone-200/60">
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-stone-800 truncate">{stud ? `${stud.lastName}, ${stud.firstName}` : "Unknown"}</p>
                      {a.financialHoldStatus === "Hold" && (
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full border text-red-700 bg-red-50 border-red-200 flex items-center gap-0.5 flex-shrink-0">
                          <Lock className="w-2.5 h-2.5" /> HOLD
                        </span>
                      )}
                    </div>
                    <p className="text-[9px] font-mono text-stone-400">{stud?.studentNo} • {a.schoolYear}</p>
                    <p className="text-[9px] text-stone-500 truncate">{getReceivableMetaLine(stud, a)}</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-red-600 flex-shrink-0">₱{a.balance.toLocaleString()}</span>
                </div>
              );
            })}
            {receivables.length === 0 && (
              <p className="text-xs text-stone-400 text-center py-6">All accounts cleared.</p>
            )}
          </div>
        </div>

        {/* Pending Accounting Actions */}
        <div className="bg-white rounded-xl border border-stsn-beige shadow-sm p-5">
          <h3 className="text-xs font-display font-bold uppercase tracking-wider text-stone-700 mb-4 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-stsn-gold" /> Pending Accounting Actions
          </h3>
          <div className="space-y-2.5">
            {actionItems.map((item) => {
              const Icon = item.icon;
              const isClear = item.count === 0;
              return (
                <div key={item.label} className={`flex items-center gap-3 p-2.5 rounded-lg border ${isClear ? "bg-emerald-50 border-emerald-100" : "bg-amber-50 border-amber-200"}`}>
                  {isClear
                    ? <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    : <Icon className="w-4 h-4 text-amber-600 flex-shrink-0" />}
                  <span className={`text-xs font-semibold flex-1 ${isClear ? "text-emerald-800" : "text-amber-800"}`}>{item.label}</span>
                  <span className={`text-xs font-mono font-black ${isClear ? "text-emerald-700" : "text-amber-700"}`}>{item.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-stsn-beige shadow-sm p-5">
          <h3 className="text-xs font-display font-bold uppercase tracking-wider text-stone-700 mb-4 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-stsn-gold" /> Recent Accounting Activity
          </h3>
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {recentPayments.map((pay) => {
              const stud = students.find((s) => s.id === pay.studentId);
              return (
                <div key={pay.id} className="flex items-center justify-between gap-3 p-2.5 bg-emerald-50 rounded border border-emerald-100">
                  <div className="min-w-0">
                    <p className="inline-flex rounded border border-red-200 bg-red-50 px-1.5 py-0.5 text-[10px] font-mono font-black text-red-700 shadow-sm">{pay.orNumber}</p>
                    <p className="text-xs font-semibold text-stone-800">{stud ? `${stud.firstName} ${stud.lastName}` : "—"}</p>
                    <p className="text-[9px] text-stone-400">{pay.paymentDate}</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-700">+₱{pay.amount.toLocaleString()}</span>
                </div>
              );
            })}
            {recentPayments.length === 0 && <p className="text-xs text-stone-400 text-center py-4">No recent payments.</p>}
          </div>
        </div>

        {/* Financial Hold Summary */}
        <div className="bg-white rounded-xl border border-stsn-beige shadow-sm p-5">
          <h3 className="text-xs font-display font-bold uppercase tracking-wider text-stone-700 mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4 text-stsn-gold" /> Financial Hold Summary
          </h3>
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {financialHolds.map((hold) => {
              const badge = FINANCIAL_HOLD_STATUS_CONFIG[hold.status];
              return (
                <div key={hold.id} className="p-2.5 bg-stone-50 rounded-lg border border-stone-200/60">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-stone-800 truncate">{hold.studentName}</p>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${badge.badgeClass}`}>{badge.label}</span>
                  </div>
                  <p className="text-[9px] font-mono text-stone-400">{hold.studentNo} • {hold.holdType}</p>
                  <p className="text-[10px] text-stone-600 mt-0.5">{hold.reason}</p>
                  <p className="text-xs font-mono font-bold text-red-600 mt-1">₱{hold.balanceAmount.toLocaleString()}</p>
                </div>
              );
            })}
            {financialHolds.length === 0 && <p className="text-xs text-stone-400 text-center py-6">No financial holds on record.</p>}
          </div>
        </div>
      </div>

      {/* Discount Summary */}
      <div className="bg-white rounded-xl border border-stsn-beige shadow-sm p-5">
        <h3 className="text-xs font-display font-bold uppercase tracking-wider text-stone-700 mb-4 flex items-center gap-2">
          <Award className="w-4 h-4 text-stsn-gold" /> Discount & Scholarship Summary
        </h3>
        <STSNDataTable<DiscountSummaryRow>
          columns={discountSummaryColumns}
          rows={discountSummaryRows}
          emptyMessage="No discounts applied."
        />
      </div>
    </div>
  );
}

// ============================================================
// STUDENT LEDGER TAB
// ============================================================
type LedgerRow = {
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  type: "Assessment" | "Payment" | "Discount" | "Adjustment" | "Penalty";
  ref?: string;
  postedBy: string;
  status: "Posted" | "Pending Verification" | "Pending";
};

const LEDGER_STATUS_STYLES: Record<LedgerRow["status"], string> = {
  Posted: "text-emerald-700 bg-emerald-50 border-emerald-200",
  "Pending Verification": "text-amber-700 bg-amber-50 border-amber-200",
  Pending: "text-amber-700 bg-amber-50 border-amber-200",
};

type LedgerActionModal = "adjustment" | "discount" | "soa" | "print" | "no-receipt" | null;

function StudentLedger() {
  const {
    students,
    assessments,
    payments,
    discountTypes,
    currentUser,
    assessmentBillingSummaries,
    studentLedgerSummaries,
    paymentCollectionSummaries,
    setupData,
  } = useSTSNStore();
  const schoolYearOptions = [...(setupData.school_years ?? [])].reverse();
  const semesterOptions = setupData.semesters ?? [];
  const txTypeOptions = ["All", ...(setupData.transaction_types ?? []).map((t) => t.name)];
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [filterYear, setFilterYear] = useState("2026-2027");
  const [filterSemester, setFilterSemester] = useState("All");
  const [filterTxType, setFilterTxType] = useState("All");
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState<Payment | null>(null);

  // Session-only mock state for ledger actions (no backend persistence)
  const [holdOverrides, setHoldOverrides] = useState<Record<string, "None" | "Hold" | "Cleared">>({});
  const [manualEntries, setManualEntries] = useState<Record<string, Omit<LedgerRow, "balance">[]>>({});
  const [activeAction, setActiveAction] = useState<LedgerActionModal>(null);
  const [adjustmentForm, setAdjustmentForm] = useState<{ description: string; amount: string; direction: "debit" | "credit" }>({ description: "", amount: "", direction: "credit" });
  const [discountTypeId, setDiscountTypeId] = useState("");

  const filteredStudents = useMemo(() =>
    students.filter((s) => {
      const q = searchQuery.toLowerCase();
      return `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || s.studentNo.toLowerCase().includes(q);
    }),
    [students, searchQuery]
  );

  const currentStudent = students.find((s) => s.id === selectedStudentId);
  const currentAssessment = assessments.find((a) => a.studentId === selectedStudentId && (filterYear === "All" || a.schoolYear === filterYear));
  const studentPayments = useMemo(() =>
    payments
      .filter((p) => p.studentId === selectedStudentId)
      .sort((a, b) => a.paymentDate.localeCompare(b.paymentDate)),
    [payments, selectedStudentId]
  );

  const accountingUnit = getStudentAccountingUnit(currentStudent);
  const labels = getAccountingLabels(accountingUnit);
  const billingSummary = assessmentBillingSummaries.find((b) => b.studentId === selectedStudentId && (filterYear === "All" || b.schoolYear === filterYear));
  const ledgerSummary = studentLedgerSummaries.find((s) => s.studentId === selectedStudentId && (filterYear === "All" || s.schoolYear === filterYear));

  const totalPaid = studentPayments.reduce((s, p) => s + p.amount, 0);
  const holdStatus: "None" | "Hold" | "Cleared" = holdOverrides[selectedStudentId] ?? currentAssessment?.financialHoldStatus ?? ledgerSummary?.financialHoldStatus ?? "None";
  const clearanceStatus: "Cleared" | "Not Cleared" = currentAssessment
    ? (currentAssessment.balance <= 0 && holdStatus !== "Hold" ? "Cleared" : "Not Cleared")
    : (ledgerSummary?.clearanceStatus ?? "Not Cleared");
  const lastPaymentDate = studentPayments.length > 0 ? studentPayments[studentPayments.length - 1].paymentDate : ledgerSummary?.lastPaymentDate;
  const adjustmentAmount = Number(adjustmentForm.amount) || 0;
  const projectedAdjustmentBalance = currentAssessment
    ? Math.max(0, currentAssessment.balance + (adjustmentForm.direction === "debit" ? adjustmentAmount : -adjustmentAmount))
    : 0;

  // Build ledger rows with running balance
  const ledgerRows = useMemo(() => {
    if (!currentAssessment) return [];
    const rows: LedgerRow[] = [];
    let runningBalance = 0;

    // Assessment row
    runningBalance += currentAssessment.totalAmount;
    rows.push({ date: currentAssessment.schoolYear, description: `Assessment — ${currentAssessment.schoolYear} ${currentAssessment.semester}`, debit: currentAssessment.totalAmount, credit: 0, balance: runningBalance, type: "Assessment", postedBy: "System (Auto-Generated)", status: "Posted" });

    // Discount row
    if (currentAssessment.discountAmount > 0) {
      runningBalance -= currentAssessment.discountAmount;
      rows.push({ date: currentAssessment.schoolYear, description: `Discount: ${currentAssessment.scholarshipName || "General Discount"} (${currentAssessment.discountPercentage}%)`, debit: 0, credit: currentAssessment.discountAmount, balance: runningBalance, type: "Discount", postedBy: "Accounting Office", status: "Posted" });
    }

    // Payment rows
    studentPayments.forEach((pay) => {
      if (filterTxType !== "All" && filterTxType !== "Payment") return;
      runningBalance -= pay.amount;
      const collection = paymentCollectionSummaries.find((p) => p.studentId === pay.studentId && p.amount === pay.amount);
      rows.push({
        date: pay.paymentDate, description: `Payment — ${pay.term} via ${pay.paymentMethod}`, debit: 0, credit: pay.amount, balance: runningBalance, type: "Payment", ref: pay.orNumber,
        postedBy: collection?.cashier || "Eduardo Bonto, CPA",
        status: collection?.verificationStatus === "Pending Verification" ? "Pending Verification" : "Posted",
      });
    });

    // Session-only manual entries (Add Adjustment / Apply Discount actions)
    (manualEntries[selectedStudentId] || []).forEach((entry) => {
      runningBalance += entry.debit - entry.credit;
      rows.push({ ...entry, balance: runningBalance });
    });

    return rows.filter((r) => filterTxType === "All" || r.type === filterTxType);
  }, [currentAssessment, studentPayments, filterTxType, manualEntries, selectedStudentId]);

  const typeColors: Record<string, string> = {
    Assessment: "text-orange-600",
    Payment: "text-emerald-600",
    Discount: "text-blue-600",
    Adjustment: "text-purple-600",
    Penalty: "text-red-600",
  };

  // ---- Action handlers (mock-only, session state) ----
  const handleAddAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent || !adjustmentForm.amount || !adjustmentForm.description.trim()) return;
    const amt = Number(adjustmentForm.amount);
    const entry: Omit<LedgerRow, "balance"> = {
      date: new Date().toISOString().slice(0, 10),
      description: adjustmentForm.description.trim(),
      debit: adjustmentForm.direction === "debit" ? amt : 0,
      credit: adjustmentForm.direction === "credit" ? amt : 0,
      type: "Adjustment",
      postedBy: currentUser?.name || "Accounting Staff",
      status: "Posted",
    };
    setManualEntries((prev) => ({ ...prev, [currentStudent.id]: [...(prev[currentStudent.id] || []), entry] }));
    setAdjustmentForm({ description: "", amount: "", direction: "credit" });
    setActiveAction(null);
  };

  const handleApplyDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent || !currentAssessment || !discountTypeId) return;
    const dt = discountTypes.find((d) => d.id === discountTypeId);
    if (!dt) return;
    const amt = Math.round((currentAssessment.totalAmount * dt.discountPercent) / 100);
    const entry: Omit<LedgerRow, "balance"> = {
      date: new Date().toISOString().slice(0, 10),
      description: `Discount Applied: ${dt.name} (${dt.discountPercent}%)`,
      debit: 0, credit: amt,
      type: "Discount",
      postedBy: currentUser?.name || "Accounting Staff",
      status: "Posted",
    };
    setManualEntries((prev) => ({ ...prev, [currentStudent.id]: [...(prev[currentStudent.id] || []), entry] }));
    setDiscountTypeId("");
    setActiveAction(null);
  };

  const toggleHold = () => {
    if (!currentStudent) return;
    setHoldOverrides((prev) => ({ ...prev, [currentStudent.id]: holdStatus === "Hold" ? "Cleared" : "Hold" }));
  };

  const handleIssueReceipt = () => {
    if (studentPayments.length === 0) { setActiveAction("no-receipt"); return; }
    setSelectedReceiptPayment(studentPayments[studentPayments.length - 1]);
    setIsReceiptOpen(true);
  };

  const actionBtnClass = "flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg shadow cursor-pointer transition whitespace-nowrap";

  const ledgerColumns: STSNColumn<LedgerRow>[] = [
    {
      title: "Date / Ref",
      data: "date",
      render: (_value, row) => (
        <>
          <p className="font-mono text-stone-600 text-[10px]">{row.date}</p>
          {row.ref && <p className="font-mono text-stsn-gold text-[9px]">{row.ref}</p>}
        </>
      ),
    },
    {
      title: "Description",
      data: "description",
      render: (value) => <span className="font-medium text-stone-800">{value}</span>,
    },
    {
      title: "Debit (₱)",
      data: "debit",
      className: "text-right",
      render: (value: number) => <span className="font-mono font-bold text-red-600">{value > 0 ? value.toLocaleString() : "—"}</span>,
    },
    {
      title: "Credit (₱)",
      data: "credit",
      className: "text-right",
      render: (value: number) => <span className="font-mono font-bold text-emerald-600">{value > 0 ? value.toLocaleString() : "—"}</span>,
    },
    {
      title: "Balance (₱)",
      data: "balance",
      className: "text-right",
      render: (value: number) => <span className="font-mono font-bold text-stone-900">{value.toLocaleString()}</span>,
    },
    {
      title: "Type",
      data: "type",
      className: "text-center",
      searchable: false,
      render: (value: LedgerRow["type"]) => <span className={`text-[9px] font-bold font-mono ${typeColors[value] || "text-stone-500"}`}>{value.toUpperCase()}</span>,
    },
    {
      title: "Posted By",
      data: "postedBy",
      render: (value) => <span className="text-stone-600 text-[10px]">{value}</span>,
    },
    {
      title: "Status",
      data: "status",
      className: "text-center",
      searchable: false,
      render: (value: LedgerRow["status"]) => <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${LEDGER_STATUS_STYLES[value]}`}>{value}</span>,
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-in">
      {/* Student List */}
      <div className="bg-white rounded-xl border border-stsn-beige shadow-sm p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search student..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-md py-1.5 pl-8 pr-3 text-xs focus:ring-1 focus:ring-stsn-brown focus:outline-none"
          />
        </div>
        <div className="space-y-1 max-h-[500px] overflow-y-auto">
          {filteredStudents.map((stud) => {
            const assess = assessments.find((a) => a.studentId === stud.id);
            return (
              <div
                key={stud.id}
                onClick={() => setSelectedStudentId(stud.id)}
                className={`p-2.5 rounded-lg cursor-pointer transition ${selectedStudentId === stud.id ? "bg-stsn-cream border border-stsn-beige" : "hover:bg-stone-50"}`}
              >
                <p className="text-[10px] font-mono text-stone-400">{stud.studentNo}</p>
                <p className="text-xs font-bold text-stone-800">{stud.lastName}, {stud.firstName}</p>
                <div className="flex justify-between mt-0.5">
                  <span className="text-[9px] text-stsn-brown font-semibold">{stud.trackOrCourse}</span>
                  <span className={`text-[9px] font-mono font-bold ${assess && assess.balance > 0 ? "text-red-600" : "text-emerald-600"}`}>
                    ₱{assess ? assess.balance.toLocaleString() : "0"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ledger Detail */}
      {!currentStudent ? (
        <div className="lg:col-span-3 bg-white rounded-xl border border-stsn-beige shadow-sm flex items-center justify-center min-h-[420px] p-8">
          <div className="text-center max-w-sm">
            <div className="w-14 h-14 rounded-full bg-stsn-cream border border-stsn-beige flex items-center justify-center mx-auto mb-3">
              <UserCircle2 className="w-7 h-7 text-stsn-gold" />
            </div>
            <h3 className="text-sm font-display font-bold text-stone-800 mb-1">No Student Selected</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Select a student to view assessment, payments, balance, and ledger history.
            </p>
          </div>
        </div>
      ) : (
      <div className="lg:col-span-3 space-y-4">
        {/* Filters & Header */}
        <div className="bg-white rounded-xl border border-stsn-beige shadow-sm p-4 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-sm font-display font-bold text-stone-900">{currentStudent.lastName}, {currentStudent.firstName}</h3>
              <p className="text-[10px] font-mono text-stone-400">
                {currentStudent.studentNo} • {accountingUnit === "basic-ed" ? "Basic Education" : "College"} • SY {filterYear === "All" ? (currentAssessment?.schoolYear || "—") : filterYear}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="bg-stone-50 border border-stone-200 rounded-md py-1 px-2 text-xs font-semibold focus:outline-none">
                <option value="All">All Years</option>
                {schoolYearOptions.map((y) => <option key={y.id}>{y.name}</option>)}
              </select>
              <select value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)} className="bg-stone-50 border border-stone-200 rounded-md py-1 px-2 text-xs font-semibold focus:outline-none">
                <option>All</option>
                {semesterOptions.map((s) => <option key={s.id}>{s.name}</option>)}
              </select>
              <select value={filterTxType} onChange={(e) => setFilterTxType(e.target.value)} className="bg-stone-50 border border-stone-200 rounded-md py-1 px-2 text-xs font-semibold focus:outline-none">
                {txTypeOptions.map((t) => <option key={t}>{t}</option>)}
              </select>
              <button className="flex items-center gap-1 bg-stsn-brown text-stsn-cream text-xs font-semibold px-3 py-1.5 rounded-lg shadow cursor-pointer hover:bg-stsn-brown-dark transition">
                <Download className="w-3.5 h-3.5" /> Export PDF
              </button>
              <button className="flex items-center gap-1 bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow cursor-pointer hover:bg-emerald-800 transition">
                <Download className="w-3.5 h-3.5" /> Export Excel
              </button>
            </div>
          </div>

          {/* Basic Ed vs College academic info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 pt-3 border-t border-stone-100">
            {accountingUnit === "basic-ed" ? (
              <>
                <div className="bg-stone-50 rounded-lg p-2.5">
                  <p className="text-[9px] uppercase font-mono text-stone-400">Grade Level</p>
                  <p className="text-xs font-bold text-stone-900 mt-0.5">{currentStudent.yearLevel || "—"}</p>
                </div>
                <div className="bg-stone-50 rounded-lg p-2.5">
                  <p className="text-[9px] uppercase font-mono text-stone-400">Section</p>
                  <p className="text-xs font-bold text-stone-900 mt-0.5">{currentStudent.section || "—"}</p>
                </div>
                <div className="bg-stone-50 rounded-lg p-2.5">
                  <p className="text-[9px] uppercase font-mono text-stone-400">Tuition Package</p>
                  <p className="text-xs font-bold text-stone-900 mt-0.5 truncate">{billingSummary?.feeTemplateName || currentStudent.trackOrCourse || "—"}</p>
                </div>
                <div className="bg-stone-50 rounded-lg p-2.5">
                  <p className="text-[9px] uppercase font-mono text-stone-400">Monthly Plan</p>
                  <p className="text-xs font-bold text-stone-900 mt-0.5">{currentAssessment?.paymentTerm || "—"}</p>
                </div>
              </>
            ) : (
              <>
                <div className="bg-stone-50 rounded-lg p-2.5">
                  <p className="text-[9px] uppercase font-mono text-stone-400">Program</p>
                  <p className="text-xs font-bold text-stone-900 mt-0.5">{currentStudent.trackOrCourse || "—"}</p>
                </div>
                <div className="bg-stone-50 rounded-lg p-2.5">
                  <p className="text-[9px] uppercase font-mono text-stone-400">Course / Block</p>
                  <p className="text-xs font-bold text-stone-900 mt-0.5">{currentStudent.section || "—"}</p>
                </div>
                <div className="bg-stone-50 rounded-lg p-2.5">
                  <p className="text-[9px] uppercase font-mono text-stone-400">Year Level</p>
                  <p className="text-xs font-bold text-stone-900 mt-0.5">{currentStudent.yearLevel || "—"}</p>
                </div>
                <div className="bg-stone-50 rounded-lg p-2.5">
                  <p className="text-[9px] uppercase font-mono text-stone-400">Semester</p>
                  <p className="text-xs font-bold text-stone-900 mt-0.5">{currentAssessment?.semester || "—"}</p>
                </div>
                <div className="bg-stone-50 rounded-lg p-2.5">
                  <p className="text-[9px] uppercase font-mono text-stone-400">Units / Load</p>
                  <p className="text-xs font-bold text-stone-900 mt-0.5">{currentAssessment ? `${currentAssessment.fees.length} Fee Items` : "—"}</p>
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-3 border-t border-stone-100">
            <button onClick={() => setActiveAction("adjustment")} className={`${actionBtnClass} bg-stone-600 text-white hover:bg-stone-700`}>
              <Edit2 className="w-3.5 h-3.5" /> Add Adjustment
            </button>
            <button onClick={() => setActiveAction("soa")} className={`${actionBtnClass} bg-stsn-brown text-stsn-cream hover:bg-stsn-brown-dark`}>
              <FileText className="w-3.5 h-3.5" /> Generate SOA
            </button>
            <button onClick={() => setActiveAction("print")} className={`${actionBtnClass} bg-stone-700 text-white hover:bg-stone-800`}>
              <Printer className="w-3.5 h-3.5" /> Print Ledger
            </button>
            <button onClick={handleIssueReceipt} className={`${actionBtnClass} bg-blue-700 text-white hover:bg-blue-800`}>
              <Receipt className="w-3.5 h-3.5" /> View Receipt
            </button>
            <button onClick={() => setActiveAction("discount")} className={`${actionBtnClass} bg-amber-600 text-white hover:bg-amber-700`}>
              <Percent className="w-3.5 h-3.5" /> Apply Discount
            </button>
            <button onClick={toggleHold} className={`${actionBtnClass} ${holdStatus === "Hold" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"} text-white`}>
              {holdStatus === "Hold" ? <><Unlock className="w-3.5 h-3.5" /> Clear Hold</> : <><Lock className="w-3.5 h-3.5" /> Put on Hold</>}
            </button>
          </div>

          {/* Accounting Summary */}
          {currentAssessment && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 border-t border-stone-100">
              <div className="bg-stone-50 rounded-lg p-3">
                <p className="text-[9px] uppercase font-mono text-stone-400">Total Assessment</p>
                <p className="text-sm font-display font-bold text-stone-900">₱{currentAssessment.totalAmount.toLocaleString()}</p>
              </div>
              <div className="bg-emerald-50 rounded-lg p-3">
                <p className="text-[9px] uppercase font-mono text-emerald-400">Total Paid</p>
                <p className="text-sm font-display font-bold text-emerald-700">₱{totalPaid.toLocaleString()}</p>
              </div>
              <div className={`rounded-lg p-3 ${currentAssessment.balance > 0 ? "bg-red-50" : "bg-emerald-50"}`}>
                <p className={`text-[9px] uppercase font-mono ${currentAssessment.balance > 0 ? "text-red-400" : "text-emerald-400"}`}>Current Balance</p>
                <p className={`text-sm font-display font-bold ${currentAssessment.balance > 0 ? "text-red-700" : "text-emerald-700"}`}>₱{currentAssessment.balance.toLocaleString()}</p>
              </div>
              <div className={`rounded-lg p-3 ${holdStatus === "Hold" ? "bg-red-50" : "bg-stone-50"}`}>
                <p className={`text-[9px] uppercase font-mono ${holdStatus === "Hold" ? "text-red-400" : "text-stone-400"}`}>Financial Hold</p>
                <p className={`text-sm font-display font-bold ${holdStatus === "Hold" ? "text-red-700" : holdStatus === "Cleared" ? "text-emerald-700" : "text-stone-700"}`}>
                  {holdStatus === "Hold" ? "On Hold" : holdStatus === "Cleared" ? "Cleared" : "None"}
                </p>
              </div>
              <div className="bg-stone-50 rounded-lg p-3">
                <p className="text-[9px] uppercase font-mono text-stone-400">Last Payment</p>
                <p className="text-sm font-display font-bold text-stone-900">{lastPaymentDate ? lastPaymentDate.split(" ")[0] : "—"}</p>
              </div>
              <div className={`rounded-lg p-3 ${clearanceStatus === "Cleared" ? "bg-emerald-50" : "bg-amber-50"}`}>
                <p className={`text-[9px] uppercase font-mono ${clearanceStatus === "Cleared" ? "text-emerald-400" : "text-amber-400"}`}>Clearance</p>
                <p className={`text-sm font-display font-bold ${clearanceStatus === "Cleared" ? "text-emerald-700" : "text-amber-700"}`}>{clearanceStatus}</p>
              </div>
            </div>
          )}
        </div>

        {/* Ledger Table */}
        <div className="bg-white rounded-xl border border-stsn-beige shadow-sm overflow-hidden">
          <div className="p-4 border-b border-stone-100 flex items-center gap-2">
            <Scale className="w-4 h-4 text-stsn-gold" />
            <h4 className="text-xs font-display font-bold uppercase tracking-wider text-stone-700">Transaction Ledger</h4>
          </div>
          <div className="p-4">
            <STSNDataTable<LedgerRow>
              columns={ledgerColumns}
              rows={ledgerRows}
              emptyMessage="No transactions found for the selected filters."
            />
          </div>
        </div>

        {/* Payment History */}
        {studentPayments.length > 0 && (
          <div className="bg-white rounded-xl border border-stsn-beige shadow-sm p-4">
            <h4 className="text-xs font-display font-bold uppercase tracking-wider text-stone-700 mb-3 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-stsn-gold" /> Payment Receipts
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {studentPayments.map((pay) => (
                <div
                  key={pay.id}
                  onClick={() => { setSelectedReceiptPayment(pay); setIsReceiptOpen(true); }}
                  className="p-3 bg-stsn-cream border border-stsn-beige rounded-lg cursor-pointer hover:border-stsn-brown transition flex justify-between items-center"
                >
                  <div>
                    <p className="text-[10px] font-mono font-bold text-stsn-gold">{pay.orNumber}</p>
                    <p className="text-xs font-semibold text-stone-800">{pay.term}</p>
                    <p className="text-[9px] text-stone-400">{pay.paymentDate} • {pay.paymentMethod}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-display font-bold text-stone-900">₱{pay.amount.toLocaleString()}</p>
                    <p className="text-[9px] text-stsn-brown font-semibold hover:underline">View Receipt</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      )}

      {isReceiptOpen && selectedReceiptPayment && currentStudent && (
        <PreviewModal isOpen={isReceiptOpen} onClose={() => setIsReceiptOpen(false)} title="Official Receipt">
          <ReceiptPreview student={currentStudent} assessment={currentAssessment} payment={selectedReceiptPayment} />
        </PreviewModal>
      )}


      {/* ADD ADJUSTMENT MODAL */}
      {activeAction === "adjustment" && currentStudent && (
        <div className="app-modal-backdrop z-50">
          <form onSubmit={handleAddAdjustment} className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-xl overflow-hidden">
            <div className="modal-header-gradient text-white p-4 flex justify-between items-center">
              <div>
                <h3 className="font-display font-bold text-sm">Post Ledger Adjustment</h3>
                <p className="text-[10px] text-stsn-cream/80 mt-0.5">{currentStudent.lastName}, {currentStudent.firstName} • {currentStudent.studentNo}</p>
              </div>
              <button type="button" onClick={() => setActiveAction(null)} className="cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4 bg-stsn-cream">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-800 leading-relaxed">
                Use adjustments for accounting-approved corrections only. Cash, GCash, bank, and card collections should be posted from the Cashiering module.
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white border border-stone-200 rounded-lg p-3">
                  <p className="text-[9px] uppercase font-mono text-stone-400">Current Balance</p>
                  <p className="text-sm font-display font-bold text-stone-900">₱{(currentAssessment?.balance || 0).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Adjustment Amount (₱) *</label>
                  <input required type="number" min={1} value={adjustmentForm.amount} onChange={(e) => setAdjustmentForm({ ...adjustmentForm, amount: e.target.value })} className="w-full bg-white border border-stone-200 rounded py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown" placeholder="e.g. 500" />
                </div>
                <div className="bg-white border border-stone-200 rounded-lg p-3">
                  <p className="text-[9px] uppercase font-mono text-stone-400">Projected Balance</p>
                  <p className={`text-sm font-display font-bold ${projectedAdjustmentBalance > 0 ? "text-red-700" : "text-emerald-700"}`}>₱{projectedAdjustmentBalance.toLocaleString()}</p>
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Adjustment Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button type="button" onClick={() => setAdjustmentForm({ ...adjustmentForm, direction: "debit" })} className={`text-left rounded-lg border p-3 transition cursor-pointer ${adjustmentForm.direction === "debit" ? "border-red-300 bg-red-50 text-red-800" : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"}`}>
                    <p className="text-xs font-bold">Debit Adjustment</p>
                    <p className="text-[10px] mt-0.5">Increases the student's balance for an approved charge or penalty.</p>
                  </button>
                  <button type="button" onClick={() => setAdjustmentForm({ ...adjustmentForm, direction: "credit" })} className={`text-left rounded-lg border p-3 transition cursor-pointer ${adjustmentForm.direction === "credit" ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"}`}>
                    <p className="text-xs font-bold">Credit Adjustment</p>
                    <p className="text-[10px] mt-0.5">Decreases the student's balance for a waiver, correction, or approved credit memo.</p>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Reason / Accounting Memo *</label>
                <textarea required rows={3} value={adjustmentForm.description} onChange={(e) => setAdjustmentForm({ ...adjustmentForm, description: e.target.value })} className="w-full bg-white border border-stone-200 rounded py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-stsn-brown resize-none" placeholder="Example: Approved credit memo for duplicate laboratory fee assessment." />
              </div>
              <div className="bg-white border border-stone-200 rounded-lg p-3 text-[10px] text-stone-500">
                Posted adjustments appear in the transaction ledger as manual accounting entries and should match the supporting approval or memo on file.
              </div>
              <button type="submit" className="w-full bg-stsn-brown hover:bg-stsn-brown-dark text-stsn-cream font-bold text-xs py-2.5 rounded-lg shadow cursor-pointer transition">
                Post Adjustment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* APPLY DISCOUNT MODAL */}
      {activeAction === "discount" && currentStudent && (
        <div className="app-modal-backdrop z-50">
          <form onSubmit={handleApplyDiscount} className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-sm overflow-hidden">
            <div className="modal-header-gradient text-white p-4 flex justify-between items-center">
              <h3 className="font-display font-bold text-sm">Apply Discount — {currentStudent.lastName}, {currentStudent.firstName}</h3>
              <button type="button" onClick={() => setActiveAction(null)} className="cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4 bg-stsn-cream">
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Discount Type *</label>
                <select required value={discountTypeId} onChange={(e) => setDiscountTypeId(e.target.value)} className="w-full bg-white border border-stone-200 rounded py-2 px-3 text-xs font-semibold focus:outline-none">
                  <option value="">— Select Discount —</option>
                  {discountTypes.filter((dt) => dt.isActive).map((dt) => <option key={dt.id} value={dt.id}>{dt.name} ({dt.discountPercent}%)</option>)}
                </select>
              </div>
              {currentAssessment && discountTypeId && (
                <p className="text-xs text-stone-600 bg-white border border-stone-200 rounded-lg p-3">
                  Estimated credit: <strong className="text-emerald-700">₱{Math.round((currentAssessment.totalAmount * (discountTypes.find((d) => d.id === discountTypeId)?.discountPercent || 0)) / 100).toLocaleString()}</strong>
                </p>
              )}
              <button type="submit" className="w-full bg-stsn-brown hover:bg-stsn-brown-dark text-stsn-cream font-bold text-xs py-2.5 rounded-lg shadow cursor-pointer transition">
                Apply to Ledger
              </button>
            </div>
          </form>
        </div>
      )}

      {/* GENERATE SOA / PRINT LEDGER MODAL */}
      {(activeAction === "soa" || activeAction === "print") && currentStudent && (
        <PreviewModal isOpen={true} onClose={() => setActiveAction(null)} title={activeAction === "soa" ? "Statement of Account" : "Print Ledger Preview"}>
          <div className="space-y-4 print-card bg-white p-6 text-stone-800">
            <div className="pb-4 border-b-2 border-stsn-brown">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <img src="/stsn-crest.png" alt="STSN Crest" className="w-16 h-16 object-contain flex-shrink-0" />
                  <div className="min-w-0">
                    <h2 className="font-display font-extrabold text-stsn-brown-dark text-lg leading-tight">St. Theresa's School of Novaliches</h2>
                    <p className="text-[10px] text-stone-500 leading-snug">#7 Kingfisher Street Zabarte Subdivision, Novaliches Quezon City, 1124 Philippines</p>
                    <p className="text-[10px] text-stsn-brown font-mono uppercase tracking-widest mt-1">Treasury & Accounting Office</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[9px] uppercase font-mono text-stone-400">Document</p>
                  <p className="text-sm font-display font-black text-stsn-brown-dark">{activeAction === "soa" ? "Statement of Account" : "Student Ledger"}</p>
                  <p className="text-[9px] font-mono text-stone-400 mt-1">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs bg-stsn-cream/60 border border-stsn-beige rounded-lg p-3">
              <div><span className="text-stone-400 font-mono text-[10px] block uppercase">Student</span><strong>{currentStudent.lastName}, {currentStudent.firstName}</strong></div>
              <div><span className="text-stone-400 font-mono text-[10px] block uppercase">Student No.</span><strong>{currentStudent.studentNo}</strong></div>
              <div><span className="text-stone-400 font-mono text-[10px] block uppercase">School Year</span><strong>{currentAssessment?.schoolYear || filterYear}</strong></div>
              <div><span className="text-stone-400 font-mono text-[10px] block uppercase">Current Balance</span><strong className={currentAssessment && currentAssessment.balance > 0 ? "text-red-600" : "text-emerald-600"}>₱{(currentAssessment?.balance || 0).toLocaleString()}</strong></div>
            </div>
            <table className="w-full text-[11px] border border-stone-200 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200">
                  <th className="text-left py-1.5 px-2 font-bold text-stone-500 uppercase text-[9px]">Date</th>
                  <th className="text-left py-1.5 px-2 font-bold text-stone-500 uppercase text-[9px]">Description</th>
                  <th className="text-right py-1.5 px-2 font-bold text-stone-500 uppercase text-[9px]">Debit</th>
                  <th className="text-right py-1.5 px-2 font-bold text-stone-500 uppercase text-[9px]">Credit</th>
                  <th className="text-right py-1.5 px-2 font-bold text-stone-500 uppercase text-[9px]">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {ledgerRows.map((row, i) => (
                  <tr key={i}>
                    <td className="py-1.5 px-2 font-mono text-stone-500">{row.date}</td>
                    <td className="py-1.5 px-2 text-stone-800">{row.description}</td>
                    <td className="py-1.5 px-2 text-right font-mono text-red-600">{row.debit > 0 ? row.debit.toLocaleString() : "—"}</td>
                    <td className="py-1.5 px-2 text-right font-mono text-emerald-600">{row.credit > 0 ? row.credit.toLocaleString() : "—"}</td>
                    <td className="py-1.5 px-2 text-right font-mono font-bold text-stone-900">{row.balance.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[10px] text-stone-400 text-center">System-generated document • For accounting reference only</p>
          </div>
        </PreviewModal>
      )}

      {/* NO RECEIPT AVAILABLE MODAL */}
      {activeAction === "no-receipt" && currentStudent && (
        <PreviewModal isOpen={true} onClose={() => setActiveAction(null)} title="View Receipt">
          <div className="text-center py-10">
            <Receipt className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-stone-700">No Payment Receipts Yet</p>
            <p className="text-xs text-stone-400 mt-1">{currentStudent.lastName}, {currentStudent.firstName} has no recorded payments to issue a receipt for.</p>
          </div>
        </PreviewModal>
      )}
    </div>
  );
}

// ============================================================
// DISCOUNT MANAGEMENT TAB
// ============================================================
function DiscountManagement() {
  const {
    discountTypes, discountRequests, students, assessments, currentUser,
    addDiscountType, updateDiscountType, deleteDiscountType, toggleDiscountTypeActive,
    addDiscountRequest, approveDiscountRequest, rejectDiscountRequest, setupData
  } = useSTSNStore();
  const { confirm } = useAppDialog();
  const schoolYearOptions = [...(setupData.school_years ?? [])].reverse();

  const [searchTypes, setSearchTypes] = useState("");
  const [searchRequests, setSearchRequests] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterSource, setFilterSource] = useState("All");

  // Discount Type Form
  const [isTypeFormOpen, setIsTypeFormOpen] = useState(false);
  const [editingType, setEditingType] = useState<DiscountType | null>(null);
  const [typeForm, setTypeForm] = useState(DEFAULT_TYPE_FORM);

  // New Request Form
  const [isRequestFormOpen, setIsRequestFormOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({ studentId: "", discountTypeId: "", siblingNames: "", remarks: "", attachmentNames: "" });

  // Approval Modal
  const [approvalModal, setApprovalModal] = useState<{ req: DiscountRequest; action: "approve" | "reject"; level: 1 | 2 } | null>(null);
  const [approvalRemarks, setApprovalRemarks] = useState("");

  // View Audit Trail
  const [viewAudit, setViewAudit] = useState<DiscountRequest | null>(null);

  const filteredTypes = useMemo(() => {
    const q = searchTypes.toLowerCase();
    return discountTypes.filter((dt) => {
      const matchSearch = dt.name.toLowerCase().includes(q) || dt.code.toLowerCase().includes(q);
      const matchSource = filterSource === "All" || dt.discountSource === filterSource;
      return matchSearch && matchSource;
    });
  }, [discountTypes, filterSource, searchTypes]);

  const filteredRequests = useMemo(() => {
    const q = searchRequests.toLowerCase();
    return discountRequests.filter((req) => {
      const matchSearch = req.studentName.toLowerCase().includes(q) || req.referenceNo.toLowerCase().includes(q) || req.discountTypeName.toLowerCase().includes(q);
      const matchStatus = filterStatus === "All" || getRequestWorkflowStatus(req).label === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [discountRequests, filterStatus, searchRequests]);

  const handleSaveType = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingType) {
      updateDiscountType(editingType.id, typeForm);
    } else {
      addDiscountType({ ...typeForm, isActive: true });
    }
    setIsTypeFormOpen(false);
    setEditingType(null);
    setTypeForm(DEFAULT_TYPE_FORM);
  };

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const discountType = discountTypes.find((dt) => dt.id === requestForm.discountTypeId);
    const student = students.find((s) => s.id === requestForm.studentId);
    if (!discountType || !student) return;
    addDiscountRequest({
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      studentNo: student.studentNo,
      discountTypeId: discountType.id,
      discountTypeName: discountType.name,
      discountPercent: discountType.discountPercent,
      requestedBy: currentUser?.name || "System",
      siblingNames: requestForm.siblingNames ? requestForm.siblingNames.split(",").map((s) => s.trim()) : [],
      remarks: requestForm.remarks,
      attachmentNames: requestForm.attachmentNames ? requestForm.attachmentNames.split(",").map((s) => s.trim()) : [],
      status: "Pending"
    });
    setIsRequestFormOpen(false);
    setRequestForm({ studentId: "", discountTypeId: "", siblingNames: "", remarks: "", attachmentNames: "" });
  };

  const handleApproval = () => {
    if (!approvalModal) return;
    if (approvalModal.action === "approve") {
      approveDiscountRequest(approvalModal.req.id, approvalModal.level, currentUser?.name || "Admin", approvalRemarks);
    } else {
      rejectDiscountRequest(approvalModal.req.id, approvalModal.level, currentUser?.name || "Admin", approvalRemarks);
    }
    setApprovalModal(null);
    setApprovalRemarks("");
  };

  const SOURCES = useMemo(
    () => ["All", ...(setupData.discount_sources ?? []).map((s) => s.name)],
    [setupData.discount_sources],
  );

  const discountTypeColumns: STSNColumn<DiscountType>[] = useMemo(() => [
    {
      title: "Code",
      data: "code",
      render: (value) => <span className="font-mono font-bold text-stsn-brown">{value}</span>,
    },
    {
      title: "Name",
      data: "name",
      render: (value) => <span className="font-semibold text-stone-800">{value}</span>,
    },
    {
      title: "Source",
      data: "discountSource",
      render: (value) => <span className="px-2 py-0.5 text-[9px] font-bold rounded-full border font-mono bg-amber-50 border-amber-200 text-amber-700">{value}</span>,
    },
    {
      title: "Discount",
      data: "discountPercent",
      render: (_value, dt) => (
        <>
          <p className="font-mono font-bold text-emerald-700">{dt.discountBasis === "Fixed Amount" ? `₱${(dt.discountFixedAmount || 0).toLocaleString()}` : `${dt.discountPercent}%`}</p>
          <p className="text-[9px] text-stone-400 mt-0.5">{getMaxAmountLabel(dt)}</p>
        </>
      ),
    },
    {
      title: "Applies To",
      data: "appliesTo",
      render: (_value, dt) => {
        const unitBadge = ACADEMIC_UNIT_BADGE[dt.applicableAcademicUnit || "both"];
        return (
          <div className="flex flex-col gap-1">
            <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border font-mono w-fit ${unitBadge.badgeClass}`}>{unitBadge.label}</span>
            <span className="text-[9px] text-stone-400">{dt.appliesTo || "Total Assessment"}</span>
          </div>
        );
      },
    },
    {
      title: "Effective SY",
      data: "effectiveSchoolYear",
      render: (value) => <span className="font-mono text-stone-600 text-[10px]">{value || "—"}</span>,
    },
    {
      title: "Policy",
      data: "isStackable",
      searchable: false,
      render: (_value, dt) => (
        <div className="flex flex-wrap gap-1 max-w-[180px]">
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${dt.isStackable ? "text-blue-700 bg-blue-50 border-blue-200" : "text-stone-500 bg-stone-50 border-stone-200"}`}>
            {dt.isStackable ? "Stackable" : "Non-Stackable"}
          </span>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${dt.requiresDocument ? "text-orange-700 bg-orange-50 border-orange-200" : "text-stone-500 bg-stone-50 border-stone-200"}`}>
            {dt.requiresDocument ? "Doc Required" : "No Doc"}
          </span>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${dt.requiresApproval ? "text-amber-600 bg-amber-50 border-amber-200" : "text-emerald-600 bg-emerald-50 border-emerald-200"}`} title={getAutoApplyRuleLabel(dt)}>
            {dt.requiresApproval ? "Approval Required" : "Auto-Apply"}
          </span>
        </div>
      ),
    },
    {
      title: "Status",
      data: "isActive",
      searchable: false,
      render: (_value, dt) => (
        <button onClick={() => toggleDiscountTypeActive(dt.id)} className={`text-[9px] font-bold px-2 py-0.5 rounded-full border cursor-pointer ${dt.isActive ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-stone-500 bg-stone-50 border-stone-200"}`}>
          {dt.isActive ? "Active" : "Inactive"}
        </button>
      ),
    },
    {
      title: "Actions",
      data: "id",
      orderable: false,
      searchable: false,
      render: (_value, dt) => (
        <div className="flex items-center gap-1">
          <button onClick={() => { setEditingType(dt); setTypeForm({
            code: dt.code, name: dt.name, discountPercent: dt.discountPercent, discountSource: dt.discountSource, requiresApproval: dt.requiresApproval, description: dt.description || "",
            effectiveSchoolYear: dt.effectiveSchoolYear || DEFAULT_TYPE_FORM.effectiveSchoolYear,
            applicableAcademicUnit: dt.applicableAcademicUnit || DEFAULT_TYPE_FORM.applicableAcademicUnit,
            appliesTo: dt.appliesTo || DEFAULT_TYPE_FORM.appliesTo,
            discountBasis: dt.discountBasis || DEFAULT_TYPE_FORM.discountBasis,
            discountFixedAmount: dt.discountFixedAmount || 0,
            isStackable: dt.isStackable ?? false,
            requiresDocument: dt.requiresDocument ?? false,
            maxAmount: dt.maxAmount || 0,
          }); setIsTypeFormOpen(true); }} className="p-1.5 hover:bg-stone-100 rounded text-stone-500 hover:text-stsn-brown cursor-pointer">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={async () => { if (await confirm(`Delete "${dt.name}"?`, { variant: "danger" })) deleteDiscountType(dt.id); }} className="p-1.5 hover:bg-red-50 rounded text-stone-400 hover:text-red-600 cursor-pointer">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ], [confirm, deleteDiscountType, toggleDiscountTypeActive]);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="bg-white rounded-xl border border-stsn-beige shadow-sm overflow-hidden p-4">
        <p className="text-xs font-mono uppercase tracking-wider text-stone-400">Discounts</p>
        <p className="text-sm text-stone-500 mt-1">
          Discount Types and Approval Requests are shown together to keep the page focused and avoid table remount flicker.
        </p>
      </div>

      {/* Discount Types */}
      <div className="bg-white rounded-xl border border-stsn-beige shadow-sm overflow-hidden">
        {/* ---- DISCOUNT TYPES ---- */}
        {true && (
          <div className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
              <div className="flex items-stretch gap-2 flex-1">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input type="text" placeholder="Search discount types..." value={searchTypes} onChange={(e) => setSearchTypes(e.target.value)} className="h-9 w-full bg-stone-50 border border-stone-200 rounded-md pl-8 pr-3 text-xs focus:outline-none" />
                </div>
                <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)} className="h-9 min-w-[108px] bg-stone-50 border border-stone-200 rounded-md px-3 text-xs font-semibold focus:outline-none">
                  {SOURCES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <button
                onClick={() => { setEditingType(null); setTypeForm(DEFAULT_TYPE_FORM); setIsTypeFormOpen(true); }}
                className="flex items-center gap-1.5 bg-stsn-brown text-stsn-cream text-xs font-bold px-4 py-2 rounded-lg shadow cursor-pointer hover:bg-stsn-brown-dark transition"
              >
                <Plus className="w-4 h-4" /> Add Discount Type
              </button>
            </div>

            <STSNDataTable<DiscountType>
              columns={discountTypeColumns}
              rows={filteredTypes}
              emptyMessage="No discount types found."
              searchable={false}
            />
          </div>
        )}

        {/* ---- APPROVAL REQUESTS ---- */}
        {true && (
          <div className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
              <div className="flex items-stretch gap-2 flex-1">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input type="text" placeholder="Search by student or reference..." value={searchRequests} onChange={(e) => setSearchRequests(e.target.value)} className="h-9 w-full bg-stone-50 border border-stone-200 rounded-md pl-8 pr-3 text-xs focus:outline-none" />
                </div>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="h-9 min-w-[168px] bg-stone-50 border border-stone-200 rounded-md px-3 text-xs font-semibold focus:outline-none">
                  {REQUEST_STATUS_FILTERS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <button
                onClick={() => { setRequestForm({ studentId: "", discountTypeId: "", siblingNames: "", remarks: "", attachmentNames: "" }); setIsRequestFormOpen(true); }}
                className="flex items-center gap-1.5 bg-stsn-brown text-stsn-cream text-xs font-bold px-4 py-2 rounded-lg shadow cursor-pointer hover:bg-stsn-brown-dark transition"
              >
                <Plus className="w-4 h-4" /> New Request
              </button>
            </div>

            <div className="space-y-3">
              {filteredRequests.map((req) => {
                const reqStudent = students.find((s) => s.id === req.studentId);
                const reqAssessment = assessments.find((a) => a.studentId === req.studentId);
                const workflowStatus = getRequestWorkflowStatus(req);
                return (
                <div key={req.id} className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono font-bold text-stsn-gold">{req.referenceNo}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${workflowStatus.badgeClass}`}>{workflowStatus.label}</span>
                      </div>
                      <p className="text-sm font-bold text-stone-900">{req.studentName}</p>
                      <p className="text-[10px] text-stone-500">{req.studentNo} • {getRequestAcademicLine(reqStudent, reqAssessment)}</p>
                      <p className="text-[10px] text-stone-500">Requested by {req.requestedBy} on {req.requestedAt}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-stone-700">{req.discountTypeName}</p>
                      <p className="text-lg font-display font-black text-emerald-700">{req.discountPercent}% off</p>
                    </div>
                  </div>

                  {/* Level Approval Status */}
                  <div className="grid grid-cols-2 gap-3">
                    {[{ level: 1, status: req.level1Status, by: req.level1ApprovedBy, at: req.level1ApprovedAt },
                      { level: 2, status: req.level2Status, by: req.level2ApprovedBy, at: req.level2ApprovedAt }].map((lvl) => (
                      <div key={lvl.level} className="bg-white border border-stone-200 rounded-lg p-2.5">
                        <p className="text-[9px] uppercase font-mono text-stone-400 mb-1">Level {lvl.level} Review</p>
                        <div className="flex items-center gap-1.5">
                          {lvl.status === "Approved" && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                          {lvl.status === "Rejected" && <XCircle className="w-3.5 h-3.5 text-red-600" />}
                          {lvl.status === "Pending" && <Clock className="w-3.5 h-3.5 text-amber-500" />}
                          <span className={`text-[10px] font-bold ${lvl.status === "Approved" ? "text-emerald-700" : lvl.status === "Rejected" ? "text-red-700" : "text-amber-700"}`}>{lvl.status}</span>
                        </div>
                        {lvl.by && <p className="text-[9px] text-stone-400 mt-0.5">{lvl.by} • {lvl.at}</p>}
                      </div>
                    ))}
                  </div>

                  {/* Siblings */}
                  {req.siblingNames && req.siblingNames.length > 0 && (
                    <div className="text-xs text-stone-600">
                      <span className="font-semibold">Sibling(s): </span>{req.siblingNames.join(", ")}
                    </div>
                  )}

                  {/* Supporting Documents */}
                  {req.attachmentNames && req.attachmentNames.length > 0 ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Paperclip className="w-3.5 h-3.5 text-stone-400" />
                      <span className="text-[9px] uppercase font-mono text-stone-400">Supporting Documents:</span>
                      {req.attachmentNames.map((att, i) => (
                        <span key={i} className="text-[10px] bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 rounded-full font-mono">{att}</span>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-[9px] uppercase font-mono text-stone-400">
                      <Paperclip className="w-3.5 h-3.5 text-stone-300" /> No Supporting Documents Uploaded
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-stone-200">
                    {req.status !== "Approved" && req.status !== "Rejected" && (
                      <>
                        {req.level1Status === "Pending" && (
                          <>
                            <button onClick={() => setApprovalModal({ req, action: "approve", level: 1 })} className="flex items-center gap-1 bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer hover:bg-emerald-700 transition">
                              <CheckCircle className="w-3.5 h-3.5" /> L1 Approve
                            </button>
                            <button onClick={() => setApprovalModal({ req, action: "reject", level: 1 })} className="flex items-center gap-1 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer hover:bg-red-700 transition">
                              <XCircle className="w-3.5 h-3.5" /> L1 Reject
                            </button>
                          </>
                        )}
                        {req.level1Status === "Approved" && req.level2Status === "Pending" && (
                          <>
                            <button onClick={() => setApprovalModal({ req, action: "approve", level: 2 })} className="flex items-center gap-1 bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer hover:bg-emerald-800 transition">
                              <CheckCircle className="w-3.5 h-3.5" /> L2 Final Approve
                            </button>
                            <button onClick={() => setApprovalModal({ req, action: "reject", level: 2 })} className="flex items-center gap-1 bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer hover:bg-red-800 transition">
                              <XCircle className="w-3.5 h-3.5" /> L2 Reject
                            </button>
                          </>
                        )}
                      </>
                    )}
                    <button onClick={() => setViewAudit(req)} className="flex items-center gap-1 bg-stone-100 text-stone-600 text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer hover:bg-stone-200 transition ml-auto">
                      <Eye className="w-3.5 h-3.5" /> Audit Trail
                    </button>
                  </div>
                </div>
                );
              })}
              {filteredRequests.length === 0 && <p className="text-center text-xs text-stone-400 py-10">No discount requests found.</p>}
            </div>
          </div>
        )}
      </div>

      {/* DISCOUNT TYPE FORM MODAL */}
      {isTypeFormOpen && (
        <div className="app-modal-backdrop z-50">
          <form onSubmit={handleSaveType} className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="modal-header-gradient text-white p-4 flex justify-between items-center flex-shrink-0">
              <h3 className="font-display font-bold text-sm">{editingType ? "Edit Discount Type" : "New Discount Type"}</h3>
              <button type="button" onClick={() => setIsTypeFormOpen(false)} className="cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4 bg-stsn-cream overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Code *</label>
                  <input required value={typeForm.code} onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value })} className="w-full bg-white border border-stone-200 rounded py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown" placeholder="e.g. SIB-2" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Name *</label>
                  <input required value={typeForm.name} onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })} className="w-full bg-white border border-stone-200 rounded py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown" placeholder="e.g. 2nd Sibling Discount" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Source *</label>
                  <select required value={typeForm.discountSource} onChange={(e: any) => setTypeForm({ ...typeForm, discountSource: e.target.value })} className="w-full bg-white border border-stone-200 rounded py-2 px-3 text-xs font-semibold focus:outline-none">
                    {["Government", "Sibling", "Owner", "Scholarship", "Employee", "Other"].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Effective School Year</label>
                  <select value={typeForm.effectiveSchoolYear} onChange={(e) => setTypeForm({ ...typeForm, effectiveSchoolYear: e.target.value })} className="w-full bg-white border border-stone-200 rounded py-2 px-3 text-xs font-semibold focus:outline-none">
                    {schoolYearOptions.map((y) => <option key={y.id}>{y.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Discount Basis</label>
                  <select value={typeForm.discountBasis} onChange={(e: any) => setTypeForm({ ...typeForm, discountBasis: e.target.value })} className="w-full bg-white border border-stone-200 rounded py-2 px-3 text-xs font-semibold focus:outline-none">
                    <option value="Percentage">Percentage</option>
                    <option value="Fixed Amount">Fixed Amount</option>
                  </select>
                </div>
                {typeForm.discountBasis === "Fixed Amount" ? (
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Fixed Amount (₱) *</label>
                    <input required type="number" min={0} value={typeForm.discountFixedAmount} onChange={(e) => setTypeForm({ ...typeForm, discountFixedAmount: Number(e.target.value) })} className="w-full bg-white border border-stone-200 rounded py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown" />
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Discount % *</label>
                    <input required type="number" min={0} max={100} value={typeForm.discountPercent} onChange={(e) => setTypeForm({ ...typeForm, discountPercent: Number(e.target.value) })} className="w-full bg-white border border-stone-200 rounded py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Applies To</label>
                  <select value={typeForm.appliesTo} onChange={(e: any) => setTypeForm({ ...typeForm, appliesTo: e.target.value })} className="w-full bg-white border border-stone-200 rounded py-2 px-3 text-xs font-semibold focus:outline-none">
                    {["Tuition", "Miscellaneous", "Laboratory", "Total Assessment"].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Applicable Academic Unit</label>
                  <select value={typeForm.applicableAcademicUnit} onChange={(e: any) => setTypeForm({ ...typeForm, applicableAcademicUnit: e.target.value })} className="w-full bg-white border border-stone-200 rounded py-2 px-3 text-xs font-semibold focus:outline-none">
                    <option value="both">Basic Ed + College</option>
                    <option value="basic-ed">Basic Ed Only</option>
                    <option value="college">College Only</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Max Amount (₱)</label>
                  <input type="number" min={0} value={typeForm.maxAmount} onChange={(e) => setTypeForm({ ...typeForm, maxAmount: Number(e.target.value) })} className="w-full bg-white border border-stone-200 rounded py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown" placeholder="0 = no cap" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Approval Required</label>
                  <select value={typeForm.requiresApproval ? "yes" : "no"} onChange={(e) => setTypeForm({ ...typeForm, requiresApproval: e.target.value === "yes" })} className="w-full bg-white border border-stone-200 rounded py-2 px-3 text-xs font-semibold focus:outline-none">
                    <option value="yes">Yes — Multi-level</option>
                    <option value="no">No — Auto-apply</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Stackable</label>
                  <select value={typeForm.isStackable ? "yes" : "no"} onChange={(e) => setTypeForm({ ...typeForm, isStackable: e.target.value === "yes" })} className="w-full bg-white border border-stone-200 rounded py-2 px-3 text-xs font-semibold focus:outline-none">
                    <option value="no">No — Standalone</option>
                    <option value="yes">Yes — Stackable</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Requires Document</label>
                  <select value={typeForm.requiresDocument ? "yes" : "no"} onChange={(e) => setTypeForm({ ...typeForm, requiresDocument: e.target.value === "yes" })} className="w-full bg-white border border-stone-200 rounded py-2 px-3 text-xs font-semibold focus:outline-none">
                    <option value="no">No</option>
                    <option value="yes">Yes — Proof Required</option>
                  </select>
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-lg p-2.5 text-[10px] text-stone-500 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-stsn-gold flex-shrink-0 mt-0.5" />
                <span><strong>Auto Apply Rule:</strong> {getAutoApplyRuleLabel(typeForm as unknown as DiscountType)}</span>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Description</label>
                <textarea value={typeForm.description} onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })} rows={2} className="w-full bg-white border border-stone-200 rounded py-2 px-3 text-xs focus:outline-none resize-none" placeholder="Optional description..." />
              </div>
              <button type="submit" className="w-full bg-stsn-brown hover:bg-stsn-brown-dark text-stsn-cream font-bold text-xs py-2.5 rounded-lg shadow cursor-pointer transition">
                {editingType ? "Save Changes" : "Create Discount Type"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* NEW REQUEST FORM MODAL */}
      {isRequestFormOpen && (
        <div className="app-modal-backdrop z-50">
          <form onSubmit={handleSubmitRequest} className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden">
            <div className="modal-header-gradient text-white p-4 flex justify-between items-center">
              <h3 className="font-display font-bold text-sm">Submit Discount Request</h3>
              <button type="button" onClick={() => setIsRequestFormOpen(false)} className="cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4 bg-stsn-cream">
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Student *</label>
                <select required value={requestForm.studentId} onChange={(e) => setRequestForm({ ...requestForm, studentId: e.target.value })} className="w-full bg-white border border-stone-200 rounded py-2 px-3 text-xs font-semibold focus:outline-none">
                  <option value="">— Select Student —</option>
                  {students.map((s) => <option key={s.id} value={s.id}>{s.lastName}, {s.firstName} ({s.studentNo})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Discount Type *</label>
                <select required value={requestForm.discountTypeId} onChange={(e) => setRequestForm({ ...requestForm, discountTypeId: e.target.value })} className="w-full bg-white border border-stone-200 rounded py-2 px-3 text-xs font-semibold focus:outline-none">
                  <option value="">— Select Discount —</option>
                  {discountTypes.filter((dt) => dt.isActive).map((dt) => <option key={dt.id} value={dt.id}>{dt.name} ({dt.discountPercent}%) — {dt.discountSource}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Sibling Names <span className="normal-case text-stone-400 text-[9px]">(Optional — comma-separated)</span></label>
                <input value={requestForm.siblingNames} onChange={(e) => setRequestForm({ ...requestForm, siblingNames: e.target.value })} className="w-full bg-white border border-stone-200 rounded py-2 px-3 text-xs focus:outline-none" placeholder="e.g. Juan Santos, Maria Santos" />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Attachment Files <span className="normal-case text-stone-400 text-[9px]">(Optional — filenames comma-separated)</span></label>
                <input value={requestForm.attachmentNames} onChange={(e) => setRequestForm({ ...requestForm, attachmentNames: e.target.value })} className="w-full bg-white border border-stone-200 rounded py-2 px-3 text-xs focus:outline-none" placeholder="e.g. birth_cert.pdf, sibling_id.jpg" />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Remarks</label>
                <textarea value={requestForm.remarks} onChange={(e) => setRequestForm({ ...requestForm, remarks: e.target.value })} rows={2} className="w-full bg-white border border-stone-200 rounded py-2 px-3 text-xs focus:outline-none resize-none" />
              </div>
              <button type="submit" className="w-full bg-stsn-brown hover:bg-stsn-brown-dark text-stsn-cream font-bold text-xs py-2.5 rounded-lg shadow cursor-pointer transition">
                Submit for Approval
              </button>
            </div>
          </form>
        </div>
      )}

      {/* APPROVAL MODAL */}
      {approvalModal && (
        <div className="app-modal-backdrop z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-sm overflow-hidden">
            <div className={`p-4 text-white flex justify-between items-center ${approvalModal.action === "approve" ? "bg-gradient-to-r from-emerald-700 to-emerald-600" : "bg-gradient-to-r from-red-700 to-red-600"}`}>
              <h3 className="font-bold text-sm">{approvalModal.action === "approve" ? "Approve" : "Reject"} — Level {approvalModal.level}</h3>
              <button onClick={() => setApprovalModal(null)} className="cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 bg-stsn-cream space-y-3">
              <p className="text-xs text-stone-600">
                You are about to <strong>{approvalModal.action}</strong> discount request <strong>{approvalModal.req.referenceNo}</strong> for <strong>{approvalModal.req.studentName}</strong>.
              </p>
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Remarks</label>
                <textarea value={approvalRemarks} onChange={(e) => setApprovalRemarks(e.target.value)} rows={3} className="w-full bg-white border border-stone-200 rounded py-2 px-3 text-xs focus:outline-none resize-none" placeholder="Add remarks for audit trail..." />
              </div>
              <button onClick={handleApproval} className={`w-full text-white font-bold text-xs py-2.5 rounded-lg shadow cursor-pointer transition ${approvalModal.action === "approve" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}`}>
                Confirm {approvalModal.action === "approve" ? "Approval" : "Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AUDIT TRAIL MODAL */}
      {viewAudit && (
        <div className="app-modal-backdrop z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden">
            <div className="modal-header-gradient text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-sm">Audit Trail — {viewAudit.referenceNo}</h3>
              <button onClick={() => setViewAudit(null)} className="cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 bg-stsn-cream space-y-2 max-h-96 overflow-y-auto">
              {viewAudit.auditTrail.map((entry, i) => (
                <div key={entry.id} className="flex gap-3 items-start">
                  <div className="w-2 h-2 rounded-full bg-stsn-gold mt-1.5 flex-shrink-0" />
                  <div className="bg-white border border-stone-200 rounded-lg p-3 flex-1">
                    <p className="text-[10px] font-mono font-bold text-stsn-brown">{entry.action}</p>
                    <p className="text-xs font-semibold text-stone-800">{entry.performedBy}</p>
                    <p className="text-[9px] text-stone-400">{entry.performedAt}</p>
                    {entry.details && <p className="text-xs text-stone-600 mt-1">{entry.details}</p>}
                  </div>
                </div>
              ))}
              {viewAudit.auditTrail.length === 0 && <p className="text-xs text-stone-400 text-center py-4">No audit entries.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// FINANCIAL HOLDS TAB
// ============================================================
const HOLD_STATUS_FILTERS = ["All", "Active", "Cleared"];

type FinancialHoldRow = FinancialHold & {
  lastUpdated: string;
  holdCategory: NonNullable<FinancialHold["holdCategory"]>;
  blockedProcess: string;
};

function FinancialHolds() {
  const { financialHolds } = useSTSNStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  // Session-only mock state for the "Action" toggle (no backend persistence)
  const [overrides, setOverrides] = useState<Record<string, { status: FinancialHold["status"]; updatedAt: string }>>({});

  const rows = useMemo(() => {
    return financialHolds.map((hold) => {
      const override = overrides[hold.id];
      const status = override?.status ?? hold.status;
      const lastUpdated = override?.updatedAt ?? (hold.status === "Cleared" ? hold.clearedAt : hold.createdAt) ?? hold.createdAt;
      return {
        ...hold,
        status,
        lastUpdated,
        holdCategory: hold.holdCategory || DEFAULT_HOLD_CATEGORY,
        blockedProcess: BLOCKED_PROCESS_LABELS[hold.holdType],
      };
    }).filter((hold) => {
      const q = searchQuery.toLowerCase();
      const matchSearch = hold.studentName.toLowerCase().includes(q) || hold.studentNo.toLowerCase().includes(q);
      const matchStatus = filterStatus === "All" || hold.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [overrides, searchQuery, filterStatus]);

  const toggleHold = (id: string, currentStatus: FinancialHold["status"]) => {
    const now = new Date().toISOString().slice(0, 16).replace("T", " ");
    setOverrides((prev) => ({ ...prev, [id]: { status: currentStatus === "Active" ? "Cleared" : "Active", updatedAt: now } }));
  };

  const holdColumns: STSNColumn<FinancialHoldRow>[] = [
    {
      title: "Student",
      data: "studentName",
      render: (_value, hold) => (
        <>
          <p className="font-bold text-stone-800">{hold.studentName}</p>
          <p className="font-mono text-[9px] text-stone-400">{hold.studentNo}</p>
        </>
      ),
    },
    {
      title: "Reason",
      data: "reason",
      render: (value) => <span className="text-stone-600 max-w-[220px]">{value}</span>,
    },
    {
      title: "Hold Type",
      data: "holdCategory",
      render: (value) => <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border text-amber-700 bg-amber-50 border-amber-200 whitespace-nowrap">{value}</span>,
    },
    {
      title: "Blocked Process",
      data: "blockedProcess",
      render: (value) => <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border text-blue-700 bg-blue-50 border-blue-200 whitespace-nowrap">{value}</span>,
    },
    {
      title: "Balance",
      data: "balanceAmount",
      className: "text-right",
      render: (value: number) => <span className="font-mono font-bold text-red-600">₱{value.toLocaleString()}</span>,
    },
    {
      title: "Status",
      data: "status",
      searchable: false,
      render: (_value, hold) => <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${FINANCIAL_HOLD_STATUS_CONFIG[hold.status].badgeClass}`}>{FINANCIAL_HOLD_STATUS_CONFIG[hold.status].label}</span>,
    },
    {
      title: "Action",
      data: "id",
      orderable: false,
      searchable: false,
      render: (_value, hold) => (
        <button
          onClick={() => toggleHold(hold.id, hold.status)}
          className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg shadow cursor-pointer transition whitespace-nowrap ${hold.status === "Active" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-stone-500 hover:bg-stone-600 text-white"}`}
        >
          {hold.status === "Active" ? <><Unlock className="w-3 h-3" /> Clear Hold</> : <><Lock className="w-3 h-3" /> Reactivate</>}
        </button>
      ),
    },
    {
      title: "Last Updated",
      data: "lastUpdated",
      render: (value) => <span className="font-mono text-stone-500 text-[10px] whitespace-nowrap">{value}</span>,
    },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="bg-white rounded-xl border border-stsn-beige shadow-sm overflow-hidden">
        <div className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <div>
              <h3 className="text-sm font-display font-bold text-stone-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-stsn-gold" /> Financial Holds
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">Students with active or resolved financial holds restricting school processes.</p>
            </div>
            <div className="flex items-stretch gap-2">
              <div className="relative flex-1 sm:w-56">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input type="text" placeholder="Search student..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-9 w-full bg-stone-50 border border-stone-200 rounded-md pl-8 pr-3 text-xs focus:outline-none" />
              </div>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="h-9 min-w-[84px] bg-stone-50 border border-stone-200 rounded-md px-3 text-xs font-semibold focus:outline-none">
                {HOLD_STATUS_FILTERS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <STSNDataTable<FinancialHoldRow>
            columns={holdColumns}
            rows={rows}
            emptyMessage="No financial holds match the selected filters."
            searchable={false}
          />

          <div className="bg-stsn-cream border border-stsn-beige rounded-lg p-3 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-stsn-gold flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-stone-500 leading-relaxed">
              "Clear Hold" / "Reactivate" actions are session-only for this prototype. This workflow is prepared for prototype review and future backend integration with the Registrar and Enrollment modules.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ASSESSMENT APPROVAL — Accounting approval queue
// ============================================================
const ASSESSMENT_APPROVAL_STATUS_FILTERS = ["All", "Pending Accounting Approval", "Approved for Payment", "Returned to Registrar", "Rejected"];

type ApprovalAction = "approve" | "return" | "reject";

const APPROVAL_ACTION_CONFIG: Record<ApprovalAction, { title: string; verb: string; remarksRequired: boolean; confirmClass: string; icon: React.ElementType }> = {
  approve: { title: "Approve Assessment", verb: "approve", remarksRequired: false, confirmClass: "bg-emerald-600 hover:bg-emerald-700", icon: CheckCircle },
  return: { title: "Return to Registrar", verb: "return", remarksRequired: true, confirmClass: "bg-orange-600 hover:bg-orange-700", icon: RotateCcw },
  reject: { title: "Reject Assessment", verb: "reject", remarksRequired: true, confirmClass: "bg-red-600 hover:bg-red-700", icon: XCircle },
};

/** Builds the Basic Ed vs College academic info line for the Assessment Approval queue/detail. */
function getApprovalAcademicLine(student: Student | undefined, assessment: StudentAssessment): { unit: "basic-ed" | "college"; line: string } {
  const unit = getStudentAccountingUnit(student);
  const labels = getAccountingLabels(unit);
  if (unit === "basic-ed") {
    return { unit, line: `${labels.levelLabel}: ${student?.yearLevel || "—"} • ${labels.groupLabel}: ${student?.section || "—"}` };
  }
  return { unit, line: `${labels.programLabel}: ${student?.trackOrCourse || "—"} • ${labels.levelLabel}: ${student?.yearLevel || "—"} • ${labels.termLabel}: ${assessment.semester}` };
}

/** Resolves the book package (name + price) for an assessment, if books are availed. Basic Ed only — no individual book selection. */
function getBookPackageInfo(assessment: StudentAssessment, bookPackages: BookPackage[]): { included: boolean; packageName?: string; amount?: number } {
  if (!assessment.booksAvailed) return { included: false };
  const pkg = bookPackages.find((p) => p.id === assessment.bookPackageId);
  return { included: true, packageName: pkg?.packageName || "Book Package", amount: pkg?.totalAmount };
}

/** Builds a payment schedule preview from totalAmount/discountAmount/paymentTerm for the Assessment Approval detail panel. */
function buildPaymentSchedulePreview(assessment: StudentAssessment): { label: string; amount: number }[] {
  const net = Math.max(0, assessment.totalAmount - assessment.discountAmount);
  switch (assessment.paymentTerm) {
    case "Cash Basis":
      return [{ label: "Full Payment — Upon Enrollment", amount: net }];
    case "Quarterly": {
      const dp = Math.round(net * 0.3);
      const rem = net - dp;
      const q = Math.round(rem / 3);
      return [
        { label: "Downpayment", amount: dp },
        { label: "1st Quarter", amount: q },
        { label: "2nd Quarter", amount: q },
        { label: "3rd Quarter", amount: rem - q * 2 },
      ];
    }
    case "Semestral": {
      const dp = Math.round(net * 0.3);
      const rem = net - dp;
      const mid = Math.round(rem / 2);
      return [
        { label: "Downpayment", amount: dp },
        { label: "Midterm", amount: mid },
        { label: "Final", amount: rem - mid },
      ];
    }
    case "Installment - 2 Payments": {
      const half = Math.round(net / 2);
      return [
        { label: "1st Installment", amount: half },
        { label: "2nd Installment", amount: net - half },
      ];
    }
    case "Installment - 4 Payments": {
      const part = Math.round(net / 4);
      return [
        { label: "1st Installment", amount: part },
        { label: "2nd Installment", amount: part },
        { label: "3rd Installment", amount: part },
        { label: "4th Installment", amount: net - part * 3 },
      ];
    }
    default:
      return [{ label: "Full Payment", amount: net }];
  }
}

function AssessmentApproval() {
  const {
    students,
    assessments,
    currentUser,
    approveAssessment,
    returnAssessmentToRegistrar,
    rejectAssessment,
    bookPackages,
  } = useSTSNStore();
  const { confirm, prompt, toast: dialogToast } = useAppDialog();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionModal, setActionModal] = useState<ApprovalAction | null>(null);
  const [remarks, setRemarks] = useState("");
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());

  // L2 approval gate — HEAD designation (or unset) can approve; STAFF/OFFICER cannot
  const canFinalApprove =
    currentUser?.role === "SUPER_ADMIN" ||
    (currentUser?.role === "ACCOUNTING" &&
      (!currentUser.designation || currentUser.designation === "HEAD"));

  const rows = useMemo(() => {
    return assessments
      .filter((a) => !!a.approvalStatus)
      .map((a) => {
        const student = students.find((s) => s.id === a.studentId);
        const status = a.approvalStatus || DEFAULT_ASSESSMENT_APPROVAL_STATUS;
        const { unit, line } = getApprovalAcademicLine(student, a);
        return { assessment: a, student, status, unit, academicLine: line };
      })
      .filter(({ assessment, student, status }) => {
        const q = searchQuery.toLowerCase();
        const matchSearch = !q
          || (student?.firstName + " " + student?.lastName).toLowerCase().includes(q)
          || (student?.studentNo || "").toLowerCase().includes(q);
        const matchStatus = filterStatus === "All" || status === filterStatus;
        return matchSearch && matchStatus;
      });
  }, [assessments, students, searchQuery, filterStatus]);

  const selected = rows.find((r) => r.assessment.id === selectedId);

  const closeDetail = () => { setSelectedId(null); setActionModal(null); setRemarks(""); };

  const pendingRows = rows.filter((r) => r.status === "Pending Accounting Approval");
  const allPendingSelected = pendingRows.length > 0 && pendingRows.every((r) => bulkSelected.has(r.assessment.id));
  const toggleBulk = (id: string) => setBulkSelected((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const toggleSelectAll = () => {
    if (allPendingSelected) { setBulkSelected(new Set()); }
    else { setBulkSelected(new Set(pendingRows.map((r) => r.assessment.id))); }
  };
  const handleBulkApprove = async () => {
    if (bulkSelected.size === 0) return;
    const ok = await confirm(`Approve ${bulkSelected.size} selected assessment${bulkSelected.size > 1 ? "s" : ""} for payment?`, { title: "Bulk Approve Assessments", confirmText: "Approve All", variant: "success" });
    if (!ok) return;
    const by = currentUser?.name || "Accounting Office";
    bulkSelected.forEach((id) => approveAssessment(id, by, "Bulk approved."));
    setBulkSelected(new Set());
    dialogToast(`${bulkSelected.size} assessments approved.`, { variant: "success" });
  };
  const handleBulkReturn = async () => {
    if (bulkSelected.size === 0) return;
    const r = await prompt(`Return ${bulkSelected.size} selected assessment${bulkSelected.size > 1 ? "s" : ""} to Registrar. Enter remarks:`, { title: "Bulk Return to Registrar", placeholder: "Remarks for all selected...", confirmText: "Return All" });
    if (r === null) return;
    const by = currentUser?.name || "Accounting Office";
    bulkSelected.forEach((id) => returnAssessmentToRegistrar(id, by, r || "Returned for correction."));
    setBulkSelected(new Set());
    dialogToast(`${bulkSelected.size} assessments returned to Registrar.`, { variant: "warning" });
  };

  const handleConfirmAction = () => {
    if (!selected || !actionModal) return;
    const by = currentUser?.name || "Accounting Office";
    if (actionModal === "approve") approveAssessment(selected.assessment.id, by, remarks);
    if (actionModal === "return") returnAssessmentToRegistrar(selected.assessment.id, by, remarks);
    if (actionModal === "reject") rejectAssessment(selected.assessment.id, by, remarks);
    setActionModal(null);
    setRemarks("");
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-stsn-beige shadow-sm p-4 flex flex-col sm:flex-row gap-3 justify-between">
        <div>
          <h3 className="text-sm font-display font-bold text-stone-900 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-stsn-gold" /> Assessment Approval Queue
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Tuition, miscellaneous fees, discounts, payment term, and optional books must be approved before Cashier can collect payment.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-stone-400" />
            <input type="text" placeholder="Search student or student no..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-stone-50 border border-stone-200 rounded-md py-1.5 pl-8 pr-3 text-xs focus:outline-none" />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-stone-50 border border-stone-200 rounded-md py-1.5 px-2 text-xs font-semibold focus:outline-none">
            {ASSESSMENT_APPROVAL_STATUS_FILTERS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Bulk action bar — shown when items are selected */}
      {bulkSelected.size > 0 && (
        <div className="bg-stsn-brown text-stsn-cream rounded-xl px-4 py-3 flex items-center justify-between gap-3 shadow-md animate-fade-in">
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={allPendingSelected} onChange={toggleSelectAll} className="w-4 h-4 rounded accent-stsn-gold cursor-pointer" />
            <span className="text-xs font-bold">{bulkSelected.size} assessment{bulkSelected.size > 1 ? "s" : ""} selected</span>
          </div>
          <div className="flex gap-2">
            <button onClick={handleBulkApprove} disabled={!canFinalApprove} className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed">
              <CheckCircle className="w-3.5 h-3.5" /> Approve All
            </button>
            <button onClick={handleBulkReturn} disabled={!canFinalApprove} className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed">
              <RotateCcw className="w-3.5 h-3.5" /> Return All
            </button>
            <button onClick={() => setBulkSelected(new Set())} className="text-xs font-bold px-2 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg cursor-pointer transition">
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Approval Cards */}
      <div className="space-y-3">
        {rows.map(({ assessment, student, status, unit, academicLine }) => {
          const statusCfg = ASSESSMENT_APPROVAL_STATUS_CONFIG[status];
          const books = getBookPackageInfo(assessment, bookPackages);
          const netPayable = Math.max(0, assessment.totalAmount - assessment.discountAmount);
          const isPendingApproval = status === "Pending Accounting Approval";
          const isChecked = bulkSelected.has(assessment.id);
          return (
            <div key={assessment.id} className={`border rounded-xl p-4 space-y-3 transition ${isChecked ? "bg-stsn-gold/5 border-stsn-gold/40" : "bg-stone-50 border-stone-200"}`}>
              <div className="flex flex-col sm:flex-row justify-between gap-2">
                <div className="flex items-start gap-2">
                  {isPendingApproval && (
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleBulk(assessment.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 w-4 h-4 rounded accent-stsn-brown cursor-pointer flex-shrink-0"
                    />
                  )}
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${unit === "basic-ed" ? "text-blue-700 bg-blue-50 border-blue-200" : "text-purple-700 bg-purple-50 border-purple-200"}`}>
                      {unit === "basic-ed" ? "Basic Education" : "College"}
                    </span>
                    <span className="text-[9px] font-mono text-stone-400">{student?.schoolId || "—"}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${statusCfg.badgeClass}`}>{statusCfg.label}</span>
                  </div>
                  <p className="text-sm font-bold text-stone-900">{student ? `${student.lastName}, ${student.firstName}` : "Unknown Student"}</p>
                  <p className="text-[10px] font-mono text-stone-400">{student?.studentNo}</p>
                  <p className="text-[10px] text-stone-500 mt-0.5">{academicLine} • {assessment.schoolYear}</p>
                </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] uppercase font-mono text-stone-400">Assessment Total</p>
                  <p className="text-lg font-display font-black text-stone-900">₱{assessment.totalAmount.toLocaleString()}</p>
                  <p className="text-[10px] text-stone-500">Net Payable: ₱{netPayable.toLocaleString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-white border border-stone-200 rounded-lg p-2">
                  <p className="text-[9px] uppercase font-mono text-stone-400">Books Included</p>
                  <p className={`text-xs font-bold mt-0.5 ${books.included ? "text-emerald-700" : "text-stone-600"}`}>{books.included ? "Yes" : "No"}</p>
                </div>
                <div className="bg-white border border-stone-200 rounded-lg p-2">
                  <p className="text-[9px] uppercase font-mono text-stone-400">Discount Applied</p>
                  <p className="text-xs font-bold text-stone-700 mt-0.5">{assessment.discountPercentage > 0 ? `${assessment.discountPercentage}% (₱${assessment.discountAmount.toLocaleString()})` : "None"}</p>
                </div>
                <div className="bg-white border border-stone-200 rounded-lg p-2">
                  <p className="text-[9px] uppercase font-mono text-stone-400">Payment Term</p>
                  <p className="text-xs font-bold text-stone-700 mt-0.5">{assessment.paymentTerm}</p>
                </div>
                <div className={`border rounded-lg p-2 ${status === "Pending Accounting Approval" ? "bg-white border-stone-200" : "bg-white border-stone-200"}`}>
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-[9px] uppercase font-mono text-stone-400">Waiting</p>
                    {status === "Pending Accounting Approval" && (
                      <SLABadge dateStr={assessment.submittedDate} />
                    )}
                  </div>
                  <p className="text-xs font-bold text-stone-700 mt-0.5">{assessment.submittedDate || "—"}</p>
                  <p className="text-[9px] text-stone-400 truncate">{assessment.submittedBy || "—"}</p>
                </div>
              </div>

              <div className="flex justify-end pt-1 border-t border-stone-200">
                <button onClick={() => setSelectedId(assessment.id)} className="flex items-center gap-1 bg-stsn-brown text-stsn-cream text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer hover:bg-stsn-brown-dark transition">
                  <Eye className="w-3.5 h-3.5" /> Review Assessment
                </button>
              </div>
            </div>
          );
        })}
        {rows.length === 0 && (
          <div className="bg-white rounded-xl border border-stsn-beige shadow-sm p-10 text-center">
            <ClipboardList className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-stone-700">No Assessments Found</p>
            <p className="text-xs text-stone-400 mt-1">No submitted assessments match the selected filters.</p>
          </div>
        )}
      </div>

      {/* DETAIL PANEL MODAL */}
      {selected && (
        <PreviewModal isOpen={true} onClose={closeDetail} title="Assessment Approval — Detail">
          <AssessmentApprovalDetail
            assessment={selected.assessment}
            student={selected.student}
            status={selected.status}
            academicLine={selected.academicLine}
            canFinalApprove={canFinalApprove}
            onApprove={() => setActionModal("approve")}
            onReturn={() => setActionModal("return")}
            onReject={() => setActionModal("reject")}
          />
        </PreviewModal>
      )}

      {/* ACTION CONFIRM MODAL */}
      {actionModal && selected && (() => {
        const cfg = APPROVAL_ACTION_CONFIG[actionModal];
        const Icon = cfg.icon;
        return (
          <div className="app-modal-backdrop z-[60]">
            <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-sm overflow-hidden">
              <div className={`p-4 text-white flex justify-between items-center ${cfg.confirmClass}`}>
                <h3 className="font-bold text-sm flex items-center gap-2"><Icon className="w-4 h-4" /> {cfg.title}</h3>
                <button onClick={() => setActionModal(null)} className="cursor-pointer"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-5 bg-stsn-cream space-y-3">
                <p className="text-xs text-stone-600">
                  You are about to <strong>{cfg.verb}</strong> the assessment for <strong>{selected.student ? `${selected.student.lastName}, ${selected.student.firstName}` : "this student"}</strong>.
                  {actionModal === "approve" && " This assessment becomes visible to the Cashier queue for payment collection."}
                  {actionModal === "return" && " The Registrar must review and resubmit before this assessment can be approved."}
                  {actionModal === "reject" && " Cashier will not be able to collect payment against this assessment."}
                </p>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
                    Accounting Remarks {cfg.remarksRequired && <span className="text-red-500">*</span>}
                  </label>
                  <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} className="w-full bg-white border border-stone-200 rounded py-2 px-3 text-xs focus:outline-none resize-none" placeholder="Add remarks for the audit trail..." />
                </div>
                <button
                  onClick={handleConfirmAction}
                  disabled={cfg.remarksRequired && !remarks.trim()}
                  className={`w-full text-white font-bold text-xs py-2.5 rounded-lg shadow cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed ${cfg.confirmClass}`}
                >
                  Confirm {cfg.title}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

/** Assessment Approval detail panel — fee breakdown, books, discount, payment schedule, remarks, audit timeline. */
function AssessmentApprovalDetail({
  assessment, student, status, academicLine, canFinalApprove = true, onApprove, onReturn, onReject,
}: {
  assessment: StudentAssessment;
  student: Student | undefined;
  status: NonNullable<StudentAssessment["approvalStatus"]>;
  academicLine: string;
  canFinalApprove?: boolean;
  onApprove: () => void;
  onReturn: () => void;
  onReject: () => void;
}) {
  const { bookPackages } = useSTSNStore();
  const statusCfg = ASSESSMENT_APPROVAL_STATUS_CONFIG[status];
  const books = getBookPackageInfo(assessment, bookPackages);
  const netPayable = Math.max(0, assessment.totalAmount - assessment.discountAmount);
  const schedule = buildPaymentSchedulePreview(assessment);
  const isPending = status === "Pending Accounting Approval";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 bg-stsn-cream border border-stsn-beige rounded-xl p-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${statusCfg.badgeClass}`}>{statusCfg.label}</span>
            <span className="text-[9px] font-mono text-stone-400">{student?.schoolId}</span>
          </div>
          <p className="text-sm font-display font-bold text-stone-900">{student ? `${student.lastName}, ${student.firstName}` : "Unknown Student"}</p>
          <p className="text-[10px] font-mono text-stone-400">{student?.studentNo}</p>
          <p className="text-[10px] text-stone-500 mt-0.5">{academicLine}</p>
          <p className="text-[10px] text-stone-500">SY {assessment.schoolYear} • {assessment.semester}</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] uppercase font-mono text-stone-400">Net Payable</p>
          <p className="text-xl font-display font-black text-stsn-brown-dark">₱{netPayable.toLocaleString()}</p>
          <p className="text-[10px] text-stone-500">Total Assessment: ₱{assessment.totalAmount.toLocaleString()}</p>
        </div>
      </div>

      {/* Fee Breakdown */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="p-3 border-b border-stone-100 flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-stsn-gold" />
          <h4 className="text-[10px] font-display font-bold uppercase tracking-wider text-stone-700">Fee Breakdown</h4>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-200">
              <th className="text-left py-2 px-3 font-bold text-stone-500 uppercase tracking-wider text-[10px]">Fee</th>
              <th className="text-left py-2 px-3 font-bold text-stone-500 uppercase tracking-wider text-[10px]">Category</th>
              <th className="text-right py-2 px-3 font-bold text-stone-500 uppercase tracking-wider text-[10px]">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {assessment.fees.map((fee, i) => (
              <tr key={i}>
                <td className="py-2 px-3 font-medium text-stone-800">{fee.feeName}</td>
                <td className="py-2 px-3 text-stone-500">{fee.category}</td>
                <td className="py-2 px-3 text-right font-mono font-bold text-stone-900">₱{fee.amount.toLocaleString()}</td>
              </tr>
            ))}
            {/* Books Package row — shown only if included. Accounting cannot select individual books. */}
            {books.included && (
              <tr className="bg-blue-50/50">
                <td className="py-2 px-3 font-medium text-blue-900 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-500" /> {books.packageName}
                </td>
                <td className="py-2 px-3 text-blue-600">Books</td>
                <td className="py-2 px-3 text-right font-mono font-bold text-blue-900">{books.amount != null ? `₱${books.amount.toLocaleString()}` : "Included"}</td>
              </tr>
            )}
            <tr className="bg-stone-50 font-bold">
              <td className="py-2 px-3 text-stone-700" colSpan={2}>Gross Total</td>
              <td className="py-2 px-3 text-right font-mono text-stone-900">₱{assessment.totalAmount.toLocaleString()}</td>
            </tr>
            {assessment.discountAmount > 0 && (
              <tr className="text-emerald-700">
                <td className="py-2 px-3 font-semibold" colSpan={2}>
                  Discount / Scholarship: {assessment.scholarshipName || "General Discount"} ({assessment.discountPercentage}%)
                </td>
                <td className="py-2 px-3 text-right font-mono font-bold">- ₱{assessment.discountAmount.toLocaleString()}</td>
              </tr>
            )}
            <tr className="bg-stsn-cream font-bold border-t-2 border-stsn-beige">
              <td className="py-2 px-3 text-stsn-brown-dark" colSpan={2}>Net Payable</td>
              <td className="py-2 px-3 text-right font-mono text-stsn-brown-dark">₱{netPayable.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Payment Schedule */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="p-3 border-b border-stone-100 flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-stsn-gold" />
          <h4 className="text-[10px] font-display font-bold uppercase tracking-wider text-stone-700">Payment Schedule — {assessment.paymentTerm}</h4>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-200">
              <th className="text-left py-2 px-3 font-bold text-stone-500 uppercase tracking-wider text-[10px]">Installment</th>
              <th className="text-right py-2 px-3 font-bold text-stone-500 uppercase tracking-wider text-[10px]">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {schedule.map((row, i) => (
              <tr key={i}>
                <td className="py-2 px-3 font-medium text-stone-800">{row.label}</td>
                <td className="py-2 px-3 text-right font-mono font-bold text-stone-900">₱{row.amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Remarks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white border border-stone-200 rounded-xl p-3">
          <h4 className="text-[10px] font-display font-bold uppercase tracking-wider text-stone-700 mb-1.5 flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-stsn-gold" /> Registrar Remarks
          </h4>
          <p className="text-xs text-stone-600">{assessment.registrarRemarks || "No remarks from Registrar."}</p>
          {assessment.submittedBy && (
            <p className="text-[10px] text-stone-400 mt-1.5">Submitted by {assessment.submittedBy} on {assessment.submittedDate}</p>
          )}
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-3">
          <h4 className="text-[10px] font-display font-bold uppercase tracking-wider text-stone-700 mb-1.5 flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-stsn-gold" /> Accounting Remarks
          </h4>
          <p className="text-xs text-stone-600">{assessment.accountingRemarks || "No remarks from Accounting yet."}</p>
          {assessment.approvedBy && (
            <p className="text-[10px] text-stone-400 mt-1.5">{status === "Approved for Payment" ? "Approved" : "Reviewed"} by {assessment.approvedBy} on {assessment.approvedDate}</p>
          )}
        </div>
      </div>

      {/* Audit Timeline */}
      <div className="bg-white border border-stone-200 rounded-xl p-3">
        <h4 className="text-[10px] font-display font-bold uppercase tracking-wider text-stone-700 mb-2 flex items-center gap-1.5">
          <History className="w-3.5 h-3.5 text-stsn-gold" /> Audit Timeline
        </h4>
        <div className="space-y-2">
          {(assessment.auditTrail || []).map((entry) => (
            <div key={entry.id} className="flex gap-3 items-start">
              <div className="w-2 h-2 rounded-full bg-stsn-gold mt-1.5 flex-shrink-0" />
              <div className="bg-stone-50 border border-stone-200 rounded-lg p-2.5 flex-1">
                <p className="text-[10px] font-mono font-bold text-stsn-brown">{entry.action}</p>
                <p className="text-xs font-semibold text-stone-800">{entry.performedBy}</p>
                <p className="text-[9px] text-stone-400">{entry.performedAt}</p>
                {entry.details && <p className="text-xs text-stone-600 mt-1">{entry.details}</p>}
              </div>
            </div>
          ))}
          {(!assessment.auditTrail || assessment.auditTrail.length === 0) && (
            <p className="text-xs text-stone-400 text-center py-2">No audit entries yet.</p>
          )}
        </div>
      </div>

      {/* Actions */}
      {isPending ? (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-200">
          {!canFinalApprove && (
            <div className="w-full bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-2 text-[11px] text-amber-700">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              Approval authority requires Accounting Head designation. Contact your supervisor.
            </div>
          )}
          <button onClick={onApprove} disabled={!canFinalApprove} className="flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer hover:bg-emerald-700 transition disabled:opacity-40 disabled:cursor-not-allowed">
            <CheckCircle className="w-4 h-4" /> Approve Assessment
          </button>
          <button onClick={onReturn} disabled={!canFinalApprove} className="flex items-center gap-1.5 bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer hover:bg-orange-700 transition disabled:opacity-40 disabled:cursor-not-allowed">
            <RotateCcw className="w-4 h-4" /> Return to Registrar
          </button>
          <button onClick={onReject} disabled={!canFinalApprove} className="flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer hover:bg-red-700 transition disabled:opacity-40 disabled:cursor-not-allowed">
            <XCircle className="w-4 h-4" /> Reject Assessment
          </button>
          {books.included && (
            <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-2.5 flex items-start gap-2 mt-1">
              <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-blue-700 leading-relaxed">
                This assessment includes the <strong>{books.packageName}</strong>. Books are approved or returned as part of the whole assessment — individual titles cannot be selected. If book inclusion is incorrect, use <strong>Return to Registrar</strong>.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-stsn-gold flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-stone-500 leading-relaxed">
            This assessment is <strong>{statusCfg.label}</strong> and is no longer pending Accounting action.
            {status === "Approved for Payment" && " It is visible to the Cashier queue for payment collection."}
            {status !== "Approved for Payment" && " Cashier cannot collect payment against this assessment."}
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// ASSESSMENT & BILLING TAB
// ============================================================
const BILLING_STATUS_BADGE: Record<AssessmentBillingSummary["status"], string> = {
  "Draft": "text-stone-500 bg-stone-50 border-stone-200",
  "Pending Approval": "text-amber-700 bg-amber-50 border-amber-200",
  "Approved": "text-emerald-700 bg-emerald-50 border-emerald-200",
  "Voided": "text-red-700 bg-red-50 border-red-200",
};

type AssessmentBillingRow = AssessmentBillingSummary & {
  stud: Student | undefined;
  gradeLevel: string;
  program: string;
  monthlyPlan: string;
  miscFees: number;
  labFees: number;
  units: string;
};

function AssessmentBilling() {
  const {
    students,
    assessments,
    assessmentBillingSummaries,
  } = useSTSNStore();

  const rows = useMemo(() => assessmentBillingSummaries.map((b) => {
    const stud = students.find((s) => s.id === b.studentId);
    const assess = assessments.find((a) => a.studentId === b.studentId && a.schoolYear === b.schoolYear);
    const miscFees = assess?.fees.filter((f) => f.category === "Miscellaneous").reduce((s, f) => s + f.amount, 0) ?? 0;
    const labFees = assess?.fees.filter((f) => f.category === "Laboratory").reduce((s, f) => s + f.amount, 0) ?? 0;
    const tuitionFee = assess?.fees.find((f) => f.category === "Tuition");
    const unitsMatch = tuitionFee?.feeName.match(/(\d+)\s*Units?/i);
    return {
      ...b, stud,
      gradeLevel: stud?.yearLevel || "—",
      program: stud?.trackOrCourse || "—",
      monthlyPlan: assess?.paymentTerm || "—",
      miscFees, labFees,
      units: unitsMatch ? `${unitsMatch[1]} Units` : "—",
    };
  }), [assessmentBillingSummaries, students, assessments]);

  const basicEdRows = rows.filter((r) => r.academicUnit === "basic-ed");
  const collegeRows = rows.filter((r) => r.academicUnit === "college");

  const studentNameColumn: STSNColumn<AssessmentBillingRow> = {
    title: "Student",
    data: "studentName",
    render: (_value, row) => (
      <>
        <p className="font-bold text-stone-800">{row.studentName}</p>
        <p className="font-mono text-[9px] text-stone-400">{row.studentNo}</p>
      </>
    ),
  };

  const statusColumn: STSNColumn<AssessmentBillingRow> = {
    title: "Status",
    data: "status",
    searchable: false,
    render: (value: AssessmentBillingRow["status"]) => <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${BILLING_STATUS_BADGE[value]}`}>{value}</span>,
  };

  const basicEdColumns: STSNColumn<AssessmentBillingRow>[] = [
    studentNameColumn,
    { title: "Grade Level", data: "gradeLevel", render: (value) => <span className="font-semibold text-stone-700">{value}</span> },
    { title: "Tuition Package", data: "feeTemplateName", render: (value) => <span className="text-stone-600">{value}</span> },
    { title: "Monthly Plan", data: "monthlyPlan", render: (value) => <span className="text-stone-600">{value}</span> },
    { title: "Miscellaneous Fees", data: "miscFees", className: "text-right", render: (value: number) => <span className="font-mono font-bold text-stone-700">₱{value.toLocaleString()}</span> },
    { title: "Total Assessment", data: "totalAssessment", className: "text-right", render: (value: number) => <span className="font-mono font-bold text-stone-900">₱{value.toLocaleString()}</span> },
    { title: "Balance", data: "balance", className: "text-right", render: (value: number) => <span className="font-mono font-bold text-red-600">₱{value.toLocaleString()}</span> },
    statusColumn,
  ];

  const collegeColumns: STSNColumn<AssessmentBillingRow>[] = [
    studentNameColumn,
    { title: "Program", data: "program", render: (value) => <span className="font-semibold text-stone-700">{value}</span> },
    { title: "Semester", data: "semester", render: (value) => <span className="text-stone-600">{value}</span> },
    { title: "Units", data: "units", render: (value) => <span className="font-mono text-stone-600">{value}</span> },
    {
      title: "Subject Load",
      data: "id",
      searchable: false,
      render: () => <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border text-stone-400 bg-stone-50 border-stone-200">Coming Soon</span>,
    },
    { title: "Laboratory Fees", data: "labFees", className: "text-right", render: (value: number) => <span className="font-mono font-bold text-stone-700">₱{value.toLocaleString()}</span> },
    { title: "Total Assessment", data: "totalAssessment", className: "text-right", render: (value: number) => <span className="font-mono font-bold text-stone-900">₱{value.toLocaleString()}</span> },
    { title: "Balance", data: "balance", className: "text-right", render: (value: number) => <span className="font-mono font-bold text-red-600">₱{value.toLocaleString()}</span> },
    statusColumn,
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Basic Ed */}
      <div className="bg-white rounded-xl border border-stsn-beige shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-100 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-stsn-gold" />
          <h3 className="text-xs font-display font-bold uppercase tracking-wider text-stone-700">Basic Education — Assessment & Billing</h3>
        </div>
        <div className="billing-table-card billing-table-wrapper">
          <STSNDataTable<AssessmentBillingRow>
            columns={basicEdColumns}
            rows={basicEdRows}
            emptyMessage="No Basic Education assessments on record."
          />
        </div>
      </div>

      {/* College */}
      <div className="bg-white rounded-xl border border-stsn-beige shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-100 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-stsn-gold" />
          <h3 className="text-xs font-display font-bold uppercase tracking-wider text-stone-700">College — Assessment & Billing</h3>
        </div>
        <div className="billing-table-card billing-table-wrapper">
          <STSNDataTable<AssessmentBillingRow>
            columns={collegeColumns}
            rows={collegeRows}
            emptyMessage="No College assessments on record."
          />
        </div>
      </div>

      {/* Coming Soon */}
      <div className="bg-white rounded-xl border border-stsn-beige shadow-sm p-6 text-center">
        <ClipboardList className="w-8 h-8 text-stone-300 mx-auto mb-2" />
        <p className="text-sm font-bold text-stone-700">Assessment Generation & Fee Template Management</p>
        <p className="text-xs text-stone-400 mt-1 max-w-md mx-auto">
          This workflow is prepared for prototype review and future backend integration.
        </p>
      </div>
    </div>
  );
}

function AssessmentAndBilling() {
  return (
    <div className="space-y-4 animate-fade-in">
      <AssessmentApproval />
      <AssessmentBilling />
    </div>
  );
}

// ============================================================
// MAIN ACCOUNTING MODULE
// ============================================================
// ============================================================
// SUB-PAGE ROUTER — new accounting features
// ============================================================
function ComingSoon({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 animate-fade-in">
      <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center">
        <Coins className="w-7 h-7 text-stsn-brown opacity-60" />
      </div>
      <h3 className="text-lg font-display font-semibold text-stone-700">{title}</h3>
      <p className="text-sm text-stone-400 max-w-sm">{desc}</p>
      <span className="text-[10px] font-mono uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
        Coming Soon
      </span>
    </div>
  );
}

function AccountingSubPageRouter({ subPage }: { subPage: string }) {
  switch (subPage) {
    case "chart-of-accounts":  return <ChartOfAccountsPage />;
    case "cost-centers":       return <CostCentersPage />;
    case "journal-entries":    return <JournalEntriesPage />;
    case "suppliers":          return <SupplierManagementPage />;
    case "items":              return <ItemProductManagementPage />;
    case "sales-invoices":     return <SalesInvoicesPage />;
    case "purchase-invoices":  return <PurchaseInvoicesPage />;
    case "ar-aging":           return <ARAgingPage />;
    case "ap-aging":           return <APAgingPage />;
    case "trial-balance":      return <FinancialStatementsPage report="trial-balance" />;
    case "balance-sheet":      return <FinancialStatementsPage report="balance-sheet" />;
    case "income-statement":   return <FinancialStatementsPage report="income-statement" />;
    case "cash-flow":          return <FinancialStatementsPage report="cash-flow" />;
    default:                   return null;
  }
}

const LEGACY_TABS: AccountingTab[] = ["dashboard", "ledger", "discounts", "billing", "holds"];

interface AccountingModuleProps {
  subPage?: string;
  onSubPageChange?: (page: string) => void;
}

export default function AccountingModule({ subPage = "dashboard", onSubPageChange }: AccountingModuleProps) {
  const isLegacyTab = LEGACY_TABS.includes(subPage as AccountingTab);
  const activeTab = isLegacyTab ? (subPage as AccountingTab) : "dashboard";

  if (!isLegacyTab) {
    return (
      <div className="space-y-6 animate-fade-in font-sans">
        <AccountingSubPageRouter subPage={subPage} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="p-5 bg-white border border-stsn-beige rounded-xl shadow-sm">
        <h2 className="text-xl font-display font-semibold text-stone-900 tracking-tight flex items-center gap-2">
          <Coins className="w-5 h-5 text-stsn-brown" />
          Treasury & Accounting Office
        </h2>
        <p className="text-stone-500 text-xs mt-1">
          Financial analytics, student ledger management, discount administration, and accounting operations.
        </p>
      </div>
      {/* Tab Content */}
      {activeTab === "dashboard" && <AccountingDashboard />}
      {activeTab === "ledger" && <StudentLedger />}
      {activeTab === "discounts" && <DiscountManagement />}
      {activeTab === "billing" && <AssessmentAndBilling />}
      {activeTab === "holds" && <FinancialHolds />}
    </div>
  );
}

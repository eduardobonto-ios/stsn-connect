/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { useSTSNStore } from "../services/store";
import { DiscountRequest, DiscountType } from "../types";
import {
  Coins, TrendingUp, FileText, Search, Filter, Plus, Edit2, Trash2,
  CheckCircle, XCircle, Clock, Eye, AlertCircle, Award, Receipt,
  Percent, Calendar, Scale, ChevronDown, BarChart3, ArrowUpRight,
  Download, Users, BookOpen, Wallet, Paperclip, X, ChevronRight,
  RefreshCw, Info
} from "lucide-react";
import { PreviewModal, ReceiptPreview } from "../components/ModalPreviews";
import { Payment, StudentAssessment, Student } from "../types";

type AccountingTab = "dashboard" | "ledger" | "discounts";
type DiscountsSubTab = "types" | "requests" | "government" | "sibling";

const SCHOOL_YEARS = ["2026-2027", "2025-2026", "2024-2025"];
const SEMESTERS = ["First Semester", "Second Semester", "Full Year", "Summer"];
const TX_TYPES = ["All", "Payment", "Assessment", "Discount", "Penalty"];
const STATUS_COLORS: Record<string, string> = {
  Approved: "text-emerald-700 bg-emerald-50 border-emerald-200",
  Rejected: "text-red-700 bg-red-50 border-red-200",
  Pending: "text-amber-700 bg-amber-50 border-amber-200",
  "For Review": "text-blue-700 bg-blue-50 border-blue-200",
};

// ============================================================
// ACCOUNTING DASHBOARD TAB
// ============================================================
function AccountingDashboard() {
  const { assessments, payments, students, discountTypes, discountRequests } = useSTSNStore();

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

  const kpis = [
    { label: "Total Assessed", value: `₱${totalAssessed.toLocaleString()}`, icon: FileText, color: "from-stsn-brown-dark to-stsn-brown", textColor: "text-stsn-cream" },
    { label: "Total Collections", value: `₱${totalCollected.toLocaleString()}`, icon: Coins, color: "from-emerald-700 to-emerald-600", textColor: "text-white" },
    { label: "Outstanding Balances", value: `₱${totalOutstanding.toLocaleString()}`, icon: AlertCircle, color: "from-red-700 to-red-600", textColor: "text-white" },
    { label: "Total Discounts Given", value: `₱${totalDiscounts.toLocaleString()}`, icon: Percent, color: "from-amber-600 to-amber-500", textColor: "text-white" },
    { label: "Accounts with Balance", value: studentsWithBalance, icon: Users, color: "from-orange-600 to-orange-500", textColor: "text-white" },
    { label: "Cleared Accounts", value: studentsCleared, icon: CheckCircle, color: "from-teal-600 to-teal-500", textColor: "text-white" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className={`bg-gradient-to-br ${kpi.color} ${kpi.textColor} p-4 rounded-xl shadow-md`}>
              <Icon className="w-5 h-5 opacity-80 mb-2" />
              <p className="text-[10px] uppercase font-mono tracking-wider opacity-80 leading-tight">{kpi.label}</p>
              <p className="text-lg font-display font-black mt-0.5">{kpi.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Collection by Method */}
        <div className="bg-white rounded-xl border border-stsn-beige shadow-sm p-5">
          <h3 className="text-xs font-display font-bold uppercase tracking-wider text-stone-700 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-stsn-gold" /> Collection by Method
          </h3>
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

        {/* Student Receivables */}
        <div className="bg-white rounded-xl border border-stsn-beige shadow-sm p-5">
          <h3 className="text-xs font-display font-bold uppercase tracking-wider text-stone-700 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-stsn-gold" /> Student Receivables
          </h3>
          <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
            {assessments.filter((a) => a.balance > 0).map((a) => {
              const stud = students.find((s) => s.id === a.studentId);
              return (
                <div key={a.id} className="flex items-center justify-between p-2.5 bg-stone-50 rounded-lg border border-stone-200/60">
                  <div>
                    <p className="text-xs font-bold text-stone-800">{stud ? `${stud.lastName}, ${stud.firstName}` : "Unknown"}</p>
                    <p className="text-[9px] font-mono text-stone-400">{stud?.studentNo} • {a.schoolYear}</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-red-600">₱{a.balance.toLocaleString()}</span>
                </div>
              );
            })}
            {assessments.filter((a) => a.balance > 0).length === 0 && (
              <p className="text-xs text-stone-400 text-center py-6">All accounts cleared.</p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-stsn-beige shadow-sm p-5">
          <h3 className="text-xs font-display font-bold uppercase tracking-wider text-stone-700 mb-4 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-stsn-gold" /> Recent Accounting Activity
          </h3>
          {pendingRequests > 0 && (
            <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span className="text-xs font-semibold text-amber-800">{pendingRequests} discount request{pendingRequests > 1 ? "s" : ""} awaiting review</span>
            </div>
          )}
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {recentPayments.map((pay) => {
              const stud = students.find((s) => s.id === pay.studentId);
              return (
                <div key={pay.id} className="flex items-center justify-between p-2 bg-emerald-50 rounded border border-emerald-100">
                  <div>
                    <p className="text-[10px] font-mono font-bold text-stsn-gold">{pay.orNumber}</p>
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
      </div>

      {/* Discount Summary */}
      <div className="bg-white rounded-xl border border-stsn-beige shadow-sm p-5">
        <h3 className="text-xs font-display font-bold uppercase tracking-wider text-stone-700 mb-4 flex items-center gap-2">
          <Award className="w-4 h-4 text-stsn-gold" /> Discount & Scholarship Summary
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="text-left py-2 px-3 font-bold text-stone-600 uppercase tracking-wider text-[10px]">Student</th>
                <th className="text-left py-2 px-3 font-bold text-stone-600 uppercase tracking-wider text-[10px]">Scholarship / Discount</th>
                <th className="text-right py-2 px-3 font-bold text-stone-600 uppercase tracking-wider text-[10px]">% Disc</th>
                <th className="text-right py-2 px-3 font-bold text-stone-600 uppercase tracking-wider text-[10px]">Amount Saved</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {assessments.filter((a) => a.discountAmount > 0).map((a) => {
                const stud = students.find((s) => s.id === a.studentId);
                return (
                  <tr key={a.id} className="hover:bg-stone-50">
                    <td className="py-2 px-3 font-semibold text-stone-800">{stud ? `${stud.lastName}, ${stud.firstName}` : "—"}</td>
                    <td className="py-2 px-3 text-stone-600">{a.scholarshipName || "General Discount"}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-amber-700">{a.discountPercentage}%</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">₱{a.discountAmount.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {assessments.filter((a) => a.discountAmount > 0).length === 0 && (
            <p className="text-xs text-stone-400 text-center py-6">No discounts applied.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// STUDENT LEDGER TAB
// ============================================================
function StudentLedger() {
  const { students, assessments, payments } = useSTSNStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || "");
  const [filterYear, setFilterYear] = useState("2026-2027");
  const [filterSemester, setFilterSemester] = useState("All");
  const [filterTxType, setFilterTxType] = useState("All");
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState<Payment | null>(null);

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

  // Build ledger rows with running balance
  const ledgerRows = useMemo(() => {
    if (!currentAssessment) return [];
    const rows: { date: string; description: string; debit: number; credit: number; balance: number; type: string; ref?: string }[] = [];
    let runningBalance = 0;

    // Assessment row
    runningBalance += currentAssessment.totalAmount;
    rows.push({ date: currentAssessment.schoolYear, description: `Assessment — ${currentAssessment.schoolYear} ${currentAssessment.semester}`, debit: currentAssessment.totalAmount, credit: 0, balance: runningBalance, type: "Assessment" });

    // Discount row
    if (currentAssessment.discountAmount > 0) {
      runningBalance -= currentAssessment.discountAmount;
      rows.push({ date: currentAssessment.schoolYear, description: `Discount: ${currentAssessment.scholarshipName || "General Discount"} (${currentAssessment.discountPercentage}%)`, debit: 0, credit: currentAssessment.discountAmount, balance: runningBalance, type: "Discount" });
    }

    // Payment rows
    studentPayments.forEach((pay) => {
      if (filterTxType !== "All" && filterTxType !== "Payment") return;
      runningBalance -= pay.amount;
      rows.push({ date: pay.paymentDate, description: `Payment — ${pay.term} via ${pay.paymentMethod}`, debit: 0, credit: pay.amount, balance: runningBalance, type: "Payment", ref: pay.orNumber });
    });

    return rows.filter((r) => filterTxType === "All" || r.type === filterTxType);
  }, [currentAssessment, studentPayments, filterTxType]);

  const typeColors: Record<string, string> = {
    Assessment: "text-orange-600",
    Payment: "text-emerald-600",
    Discount: "text-blue-600",
    Penalty: "text-red-600",
  };

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
      <div className="lg:col-span-3 space-y-4">
        {/* Filters & Header */}
        <div className="bg-white rounded-xl border border-stsn-beige shadow-sm p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-sm font-display font-bold text-stone-900">{currentStudent ? `${currentStudent.lastName}, ${currentStudent.firstName}` : "Select a Student"}</h3>
              {currentStudent && <p className="text-[10px] font-mono text-stone-400">{currentStudent.studentNo} • {currentStudent.trackOrCourse} • {currentStudent.yearLevel}</p>}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="bg-stone-50 border border-stone-200 rounded-md py-1 px-2 text-xs font-semibold focus:outline-none">
                <option value="All">All Years</option>
                {SCHOOL_YEARS.map((y) => <option key={y}>{y}</option>)}
              </select>
              <select value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)} className="bg-stone-50 border border-stone-200 rounded-md py-1 px-2 text-xs font-semibold focus:outline-none">
                <option>All</option>
                {SEMESTERS.map((s) => <option key={s}>{s}</option>)}
              </select>
              <select value={filterTxType} onChange={(e) => setFilterTxType(e.target.value)} className="bg-stone-50 border border-stone-200 rounded-md py-1 px-2 text-xs font-semibold focus:outline-none">
                {TX_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
              <button className="flex items-center gap-1 bg-stsn-brown text-stsn-cream text-xs font-semibold px-3 py-1.5 rounded-lg shadow cursor-pointer hover:bg-stsn-brown-dark transition">
                <Download className="w-3.5 h-3.5" /> Export PDF
              </button>
              <button className="flex items-center gap-1 bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow cursor-pointer hover:bg-emerald-800 transition">
                <Download className="w-3.5 h-3.5" /> Export Excel
              </button>
            </div>
          </div>

          {/* Balance Summary */}
          {currentAssessment && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <div className="bg-stone-50 rounded-lg p-3">
                <p className="text-[9px] uppercase font-mono text-stone-400">Total Assessed</p>
                <p className="text-sm font-display font-bold text-stone-900">₱{currentAssessment.totalAmount.toLocaleString()}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-[9px] uppercase font-mono text-blue-400">Discount Applied</p>
                <p className="text-sm font-display font-bold text-blue-700">₱{currentAssessment.discountAmount.toLocaleString()}</p>
              </div>
              <div className="bg-emerald-50 rounded-lg p-3">
                <p className="text-[9px] uppercase font-mono text-emerald-400">Total Paid</p>
                <p className="text-sm font-display font-bold text-emerald-700">₱{studentPayments.reduce((s, p) => s + p.amount, 0).toLocaleString()}</p>
              </div>
              <div className={`rounded-lg p-3 ${currentAssessment.balance > 0 ? "bg-red-50" : "bg-emerald-50"}`}>
                <p className={`text-[9px] uppercase font-mono ${currentAssessment.balance > 0 ? "text-red-400" : "text-emerald-400"}`}>Outstanding Balance</p>
                <p className={`text-sm font-display font-bold ${currentAssessment.balance > 0 ? "text-red-700" : "text-emerald-700"}`}>₱{currentAssessment.balance.toLocaleString()}</p>
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
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200">
                  <th className="text-left py-2 px-3 font-bold text-stone-500 uppercase tracking-wider text-[10px] w-32">Date / Ref</th>
                  <th className="text-left py-2 px-3 font-bold text-stone-500 uppercase tracking-wider text-[10px]">Description</th>
                  <th className="text-right py-2 px-3 font-bold text-stone-500 uppercase tracking-wider text-[10px] w-28">Debit (₱)</th>
                  <th className="text-right py-2 px-3 font-bold text-stone-500 uppercase tracking-wider text-[10px] w-28">Credit (₱)</th>
                  <th className="text-right py-2 px-3 font-bold text-stone-500 uppercase tracking-wider text-[10px] w-32">Balance (₱)</th>
                  <th className="text-center py-2 px-3 font-bold text-stone-500 uppercase tracking-wider text-[10px] w-24">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {ledgerRows.map((row, i) => (
                  <tr key={i} className="hover:bg-stone-50">
                    <td className="py-2.5 px-3">
                      <p className="font-mono text-stone-600 text-[10px]">{row.date}</p>
                      {row.ref && <p className="font-mono text-stsn-gold text-[9px]">{row.ref}</p>}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-stone-800">{row.description}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-red-600">{row.debit > 0 ? `${row.debit.toLocaleString()}` : "—"}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">{row.credit > 0 ? `${row.credit.toLocaleString()}` : "—"}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-900">{row.balance.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-[9px] font-bold font-mono ${typeColors[row.type] || "text-stone-500"}`}>{row.type.toUpperCase()}</span>
                    </td>
                  </tr>
                ))}
                {ledgerRows.length === 0 && (
                  <tr><td colSpan={6} className="py-10 text-center text-xs text-stone-400">No transactions found for the selected filters.</td></tr>
                )}
              </tbody>
            </table>
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

      {isReceiptOpen && selectedReceiptPayment && currentStudent && (
        <PreviewModal isOpen={isReceiptOpen} onClose={() => setIsReceiptOpen(false)} title="Official Receipt">
          <ReceiptPreview student={currentStudent} assessment={currentAssessment} payment={selectedReceiptPayment} />
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
    discountTypes, discountRequests, students, currentUser,
    addDiscountType, updateDiscountType, deleteDiscountType, toggleDiscountTypeActive,
    addDiscountRequest, approveDiscountRequest, rejectDiscountRequest
  } = useSTSNStore();

  const [subTab, setSubTab] = useState<DiscountsSubTab>("types");
  const [searchTypes, setSearchTypes] = useState("");
  const [searchRequests, setSearchRequests] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterSource, setFilterSource] = useState("All");

  // Discount Type Form
  const [isTypeFormOpen, setIsTypeFormOpen] = useState(false);
  const [editingType, setEditingType] = useState<DiscountType | null>(null);
  const [typeForm, setTypeForm] = useState({ code: "", name: "", discountPercent: 0, discountSource: "Sibling" as DiscountType["discountSource"], requiresApproval: true, description: "" });

  // New Request Form
  const [isRequestFormOpen, setIsRequestFormOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({ studentId: "", discountTypeId: "", siblingNames: "", remarks: "", attachmentNames: "" });

  // Approval Modal
  const [approvalModal, setApprovalModal] = useState<{ req: DiscountRequest; action: "approve" | "reject"; level: 1 | 2 } | null>(null);
  const [approvalRemarks, setApprovalRemarks] = useState("");

  // View Audit Trail
  const [viewAudit, setViewAudit] = useState<DiscountRequest | null>(null);

  const filteredTypes = discountTypes.filter((dt) => {
    const q = searchTypes.toLowerCase();
    const matchSearch = dt.name.toLowerCase().includes(q) || dt.code.toLowerCase().includes(q);
    const matchSource = filterSource === "All" || dt.discountSource === filterSource;
    return matchSearch && matchSource;
  });

  const filteredRequests = discountRequests.filter((req) => {
    const q = searchRequests.toLowerCase();
    const matchSearch = req.studentName.toLowerCase().includes(q) || req.referenceNo.toLowerCase().includes(q) || req.discountTypeName.toLowerCase().includes(q);
    const matchStatus = filterStatus === "All" || req.status === filterStatus;
    const matchSubTab = subTab === "requests"
      ? true
      : subTab === "government"
        ? ["Government"].includes(discountTypes.find((d) => d.id === req.discountTypeId)?.discountSource || "")
        : subTab === "sibling"
          ? ["Sibling", "Owner"].includes(discountTypes.find((d) => d.id === req.discountTypeId)?.discountSource || "")
          : true;
    return matchSearch && matchStatus && matchSubTab;
  });

  const handleSaveType = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingType) {
      updateDiscountType(editingType.id, typeForm);
    } else {
      addDiscountType({ ...typeForm, isActive: true });
    }
    setIsTypeFormOpen(false);
    setEditingType(null);
    setTypeForm({ code: "", name: "", discountPercent: 0, discountSource: "Sibling", requiresApproval: true, description: "" });
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

  const SOURCES = ["All", "Government", "Sibling", "Owner", "Scholarship", "Employee", "Other"];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Sub-navigation */}
      <div className="bg-white rounded-xl border border-stsn-beige shadow-sm overflow-hidden">
        <div className="flex border-b border-stone-100">
          {([
            { key: "types", label: "Discount Types" },
            { key: "requests", label: "All Requests" },
            { key: "government", label: "Government Discounts" },
            { key: "sibling", label: "Sibling / Owner" },
          ] as { key: DiscountsSubTab; label: string }[]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSubTab(tab.key)}
              className={`flex-1 py-3 text-xs font-bold transition cursor-pointer ${subTab === tab.key ? "tab-active-gradient" : "text-stone-500 hover:bg-stone-50"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ---- DISCOUNT TYPES ---- */}
        {subTab === "types" && (
          <div className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
              <div className="flex gap-2 flex-1">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-stone-400" />
                  <input type="text" placeholder="Search discount types..." value={searchTypes} onChange={(e) => setSearchTypes(e.target.value)} className="w-full bg-stone-50 border border-stone-200 rounded-md py-1.5 pl-8 pr-3 text-xs focus:outline-none" />
                </div>
                <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)} className="bg-stone-50 border border-stone-200 rounded-md py-1.5 px-2 text-xs font-semibold focus:outline-none">
                  {SOURCES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <button
                onClick={() => { setEditingType(null); setTypeForm({ code: "", name: "", discountPercent: 0, discountSource: "Sibling", requiresApproval: true, description: "" }); setIsTypeFormOpen(true); }}
                className="flex items-center gap-1.5 bg-stsn-brown text-stsn-cream text-xs font-bold px-4 py-2 rounded-lg shadow cursor-pointer hover:bg-stsn-brown-dark transition"
              >
                <Plus className="w-4 h-4" /> Add Discount Type
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200">
                    {["Code", "Name", "Source", "Discount %", "Requires Approval", "Status", "Actions"].map((h) => (
                      <th key={h} className="text-left py-2 px-3 font-bold text-stone-500 uppercase tracking-wider text-[10px]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredTypes.map((dt) => (
                    <tr key={dt.id} className="hover:bg-stone-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-stsn-brown">{dt.code}</td>
                      <td className="py-2.5 px-3 font-semibold text-stone-800">{dt.name}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 text-[9px] font-bold rounded-full border font-mono bg-amber-50 border-amber-200 text-amber-700">{dt.discountSource}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">{dt.discountPercent}%</td>
                      <td className="py-2.5 px-3 text-center">
                        {dt.requiresApproval
                          ? <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Required</span>
                          : <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Auto</span>}
                      </td>
                      <td className="py-2.5 px-3">
                        <button onClick={() => toggleDiscountTypeActive(dt.id)} className={`text-[9px] font-bold px-2 py-0.5 rounded-full border cursor-pointer ${dt.isActive ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-stone-500 bg-stone-50 border-stone-200"}`}>
                          {dt.isActive ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setEditingType(dt); setTypeForm({ code: dt.code, name: dt.name, discountPercent: dt.discountPercent, discountSource: dt.discountSource, requiresApproval: dt.requiresApproval, description: dt.description || "" }); setIsTypeFormOpen(true); }} className="p-1.5 hover:bg-stone-100 rounded text-stone-500 hover:text-stsn-brown cursor-pointer">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => { if (confirm(`Delete "${dt.name}"?`)) deleteDiscountType(dt.id); }} className="p-1.5 hover:bg-red-50 rounded text-stone-400 hover:text-red-600 cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredTypes.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-xs text-stone-400">No discount types found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ---- APPROVAL REQUESTS ---- */}
        {(subTab === "requests" || subTab === "government" || subTab === "sibling") && (
          <div className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
              <div className="flex gap-2 flex-1">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-stone-400" />
                  <input type="text" placeholder="Search by student or reference..." value={searchRequests} onChange={(e) => setSearchRequests(e.target.value)} className="w-full bg-stone-50 border border-stone-200 rounded-md py-1.5 pl-8 pr-3 text-xs focus:outline-none" />
                </div>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-stone-50 border border-stone-200 rounded-md py-1.5 px-2 text-xs font-semibold focus:outline-none">
                  {["All", "Pending", "For Review", "Approved", "Rejected"].map((s) => <option key={s}>{s}</option>)}
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
              {filteredRequests.map((req) => (
                <div key={req.id} className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono font-bold text-stsn-gold">{req.referenceNo}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[req.status] || ""}`}>{req.status}</span>
                      </div>
                      <p className="text-sm font-bold text-stone-900">{req.studentName}</p>
                      <p className="text-[10px] text-stone-500">{req.studentNo} • Requested by {req.requestedBy} on {req.requestedAt}</p>
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

                  {/* Attachments */}
                  {req.attachmentNames && req.attachmentNames.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Paperclip className="w-3.5 h-3.5 text-stone-400" />
                      {req.attachmentNames.map((att, i) => (
                        <span key={i} className="text-[10px] bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 rounded-full font-mono">{att}</span>
                      ))}
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
              ))}
              {filteredRequests.length === 0 && <p className="text-center text-xs text-stone-400 py-10">No discount requests found.</p>}
            </div>
          </div>
        )}
      </div>

      {/* DISCOUNT TYPE FORM MODAL */}
      {isTypeFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleSaveType} className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="modal-header-gradient text-stsn-cream p-4 flex justify-between items-center">
              <h3 className="font-display font-bold text-sm">{editingType ? "Edit Discount Type" : "New Discount Type"}</h3>
              <button type="button" onClick={() => setIsTypeFormOpen(false)} className="cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4 bg-stsn-cream">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Code *</label>
                  <input required value={typeForm.code} onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value })} className="w-full bg-white border border-stone-200 rounded py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown" placeholder="e.g. SIB-2" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Discount % *</label>
                  <input required type="number" min={0} max={100} value={typeForm.discountPercent} onChange={(e) => setTypeForm({ ...typeForm, discountPercent: Number(e.target.value) })} className="w-full bg-white border border-stone-200 rounded py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Name *</label>
                <input required value={typeForm.name} onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })} className="w-full bg-white border border-stone-200 rounded py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown" placeholder="e.g. 2nd Sibling Discount" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Source *</label>
                  <select required value={typeForm.discountSource} onChange={(e: any) => setTypeForm({ ...typeForm, discountSource: e.target.value })} className="w-full bg-white border border-stone-200 rounded py-2 px-3 text-xs font-semibold focus:outline-none">
                    {["Government", "Sibling", "Owner", "Scholarship", "Employee", "Other"].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Approval Required</label>
                  <select value={typeForm.requiresApproval ? "yes" : "no"} onChange={(e) => setTypeForm({ ...typeForm, requiresApproval: e.target.value === "yes" })} className="w-full bg-white border border-stone-200 rounded py-2 px-3 text-xs font-semibold focus:outline-none">
                    <option value="yes">Yes — Multi-level</option>
                    <option value="no">No — Auto-apply</option>
                  </select>
                </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleSubmitRequest} className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="modal-header-gradient text-stsn-cream p-4 flex justify-between items-center">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="modal-header-gradient text-stsn-cream p-4 flex justify-between items-center">
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
// MAIN ACCOUNTING MODULE
// ============================================================
export default function AccountingModule() {
  const [activeTab, setActiveTab] = useState<AccountingTab>("dashboard");

  const tabs: { key: AccountingTab; label: string; icon: React.ElementType }[] = [
    { key: "dashboard", label: "Accounting Dashboard", icon: BarChart3 },
    { key: "ledger", label: "Student Ledger", icon: Scale },
    { key: "discounts", label: "Discount Management", icon: Percent },
  ];

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

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl border border-stsn-beige shadow-sm overflow-hidden">
        <div className="flex border-b border-stone-100">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-3 px-4 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${activeTab === tab.key ? "tab-active-gradient" : "text-stone-500 hover:bg-stone-50"}`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "dashboard" && <AccountingDashboard />}
      {activeTab === "ledger" && <StudentLedger />}
      {activeTab === "discounts" && <DiscountManagement />}
    </div>
  );
}

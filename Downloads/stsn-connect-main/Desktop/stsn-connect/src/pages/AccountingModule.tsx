/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useSTSNStore } from "../services/store";
import { Student, StudentAssessment, Payment } from "../types";
import {
  CreditCard,
  Plus,
  Coins,
  ShieldCheck,
  CheckCircle,
  FileCheck,
  Scale,
  Sparkles,
  Award,
  Search,
  BookOpen,
  Filter
} from "lucide-react";
import { PreviewModal, ReceiptPreview } from "../components/ModalPreviews";

export default function AccountingModule() {
  const {
    students,
    assessments,
    payments,
    addPayment
  } = useSTSNStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("stud-enrico");
  
  // Payment action states
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(5000);
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Bank Transfer" | "GCash" | "Credit Card">("GCash");
  const [payTerm, setPayTerm] = useState<"Downpayment" | "Midterm" | "Finals" | "Full Payment" | "Installment">("Installment");
  const [payRemarks, setPayRemarks] = useState("");
  
  // Receipt preview states
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState<Payment | null>(null);

  // Filters
  const currentStudent = students.find((s) => s.id === selectedStudentId);
  const currentAssessment = assessments.find((a) => a.studentId === selectedStudentId);
  const currentPayments = payments.filter((p) => p.studentId === selectedStudentId);

  const filteredStudents = students.filter((s) => {
    const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || s.studentNo.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handlePostPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || payAmount <= 0) return;

    const newPayment = addPayment({
      studentId: selectedStudentId,
      amount: Number(payAmount),
      paymentMethod,
      term: payTerm,
      remarks: payRemarks || "Quarterly tuition balance payment"
    });

    setIsPayModalOpen(false);
    setSelectedReceiptPayment(newPayment);
    setIsReceiptOpen(true);
    setPayRemarks("");
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-white border border-stsn-beige rounded-xl shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-display font-semibold text-stone-900 tracking-tight flex items-center gap-2">
            <Coins className="w-5 h-5 text-stsn-brown" />
            Treasury & Tuition Assessment Ledger
          </h2>
          <p className="text-stone-500 text-xs mt-1">
            Track student fee assessments, manage institutional scholarships, record cash and electronic payment gates, and release receipts.
          </p>
        </div>
        
        {currentAssessment && (
          <button
            onClick={() => {
              setPayAmount(currentAssessment.balance > 5000 ? 5000 : currentAssessment.balance);
              setIsPayModalOpen(true);
            }}
            disabled={currentAssessment.balance <= 0}
            className="bg-stsn-brown hover:bg-stsn-brown-dark disabled:bg-stone-200 disabled:text-stone-400 text-stsn-cream text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer shadow flex items-center gap-2 transition"
          >
            <CreditCard className="w-4 h-4 text-stsn-gold-light" />
            Receive Payment Desk
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Accounts Directory */}
        <div className="bg-white p-6 rounded-xl border border-stsn-beige shadow-sm space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 text-stone-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search student balances..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-md py-1.5 pl-8 pr-3 text-xs focus:ring-1 focus:ring-stsn-brown focus:outline-none focus:border-stsn-brown font-semibold text-stone-800"
            />
          </div>

          <div className="divide-y divide-stone-100 max-h-[420px] overflow-y-auto pr-1">
            {filteredStudents.map((stud) => {
              const assert = assessments.find((a) => a.studentId === stud.id);
              const isSelected = selectedStudentId === stud.id;
              return (
                <div
                  key={stud.id}
                  onClick={() => setSelectedStudentId(stud.id)}
                  className={`p-3 rounded-lg cursor-pointer transition flex items-center justify-between ${
                    isSelected ? "bg-stsn-cream border border-stsn-beige" : "hover:bg-stone-50"
                  }`}
                >
                  <div>
                    <span className="text-[10px] font-mono text-stone-400 block">{stud.studentNo}</span>
                    <span className="text-xs font-bold text-stone-800">{stud.lastName}, {stud.firstName}</span>
                    <span className="text-[9.5px] text-stsn-brown font-semibold block">{stud.trackOrCourse} Class</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-mono text-stone-400 block">Balance</span>
                    <span className={`text-xs font-bold ${assert && assert.balance > 0 ? "text-red-600" : "text-green-600"}`}>
                      ₱{assert ? assert.balance.toLocaleString() : "0"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Central & Right Columns: Active student assessment folder detail */}
        {currentStudent && currentAssessment ? (
          <div className="lg:col-span-2 space-y-6">
            
            {/* Top overview card of balance */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="bg-gradient-to-br from-stsn-brown-dark to-stsn-brown text-stsn-cream p-5 rounded-xl border border-stsn-brown/30 shadow">
                <span className="text-[10px] font-mono uppercase text-stsn-gold-light tracking-wider font-semibold block">Outstanding Balance</span>
                <span className="text-3xl font-display font-black tracking-tight mt-1 block">
                  ₱{currentAssessment.balance.toLocaleString("en-US", { minimumFractionDigits: 1 })}
                </span>
                <div className="mt-4 flex justify-between items-center text-[10px] text-stsn-gold-light uppercase font-mono pt-2 border-t border-white/10">
                  <span>Term: {currentAssessment.paymentTerm}</span>
                  {currentAssessment.balance === 0 && (
                    <span className="bg-green-500/20 text-green-300 font-bold px-2 py-0.5 rounded border border-green-500/20">Cleared</span>
                  )}
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-stsn-beige shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-stone-400 font-semibold block">Discount / Scholarship</span>
                  <span className="text-base font-bold text-stone-900 mt-1 block h-10 overflow-hidden line-clamp-1 pr-1 leading-snug">
                    {currentAssessment.scholarshipName || "Full Tuition Account"}
                  </span>
                </div>
                <div className="pt-2 border-t border-stone-100 flex justify-between items-center text-[11px] font-semibold">
                  <span className="text-stone-500">Scholarship Benefit:</span>
                  <span className="text-stsn-brown font-mono font-bold">
                    {currentAssessment.discountPercentage}% (₱{currentAssessment.discountAmount.toLocaleString()})
                  </span>
                </div>
              </div>

            </div>

            {/* Assessment line-items and Receipt logs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Fee breakdown list */}
              <div className="bg-white p-5 rounded-xl border border-stsn-beige shadow-sm">
                <h4 className="text-xs font-display font-semibold text-stone-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-stsn-gold" />
                  Assessed Fee Breakdown
                </h4>

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {currentAssessment.fees.map((fee, idx) => (
                    <div key={idx} className="p-2.5 bg-stone-50 border border-stone-200/60 rounded flex justify-between text-xs">
                      <div>
                        <span className="font-semibold text-stone-800 block">{fee.feeName}</span>
                        <span className="text-[10px] text-stone-400 capitalize">{fee.category} Fee</span>
                      </div>
                      <span className="font-mono text-stone-900 font-bold self-center">₱{fee.amount.toLocaleString()}</span>
                    </div>
                  ))}
                  
                  <div className="pt-2.5 border-t border-stone-200 flex justify-between text-xs font-bold text-stone-900">
                    <span>Summary Assessment Total:</span>
                    <span className="font-mono text-stsn-brown">₱{currentAssessment.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Payments ledger log */}
              <div className="bg-white p-5 rounded-xl border border-stsn-beige shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-display font-semibold text-stone-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Student Payment History
                  </h4>
                  
                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                    {currentPayments.length === 0 ? (
                      <p className="text-xs text-stone-400 italic text-center py-8">No payments logged in memory ledger.</p>
                    ) : (
                      currentPayments.map((pay) => (
                        <div
                          key={pay.id}
                          onClick={() => {
                            setSelectedReceiptPayment(pay);
                            setIsReceiptOpen(true);
                          }}
                          className="bg-stsn-cream/[25] hover:bg-stsn-cream border border-stsn-beige/50 hover:border-stsn-beige p-2.5 rounded flex justify-between items-center text-xs transition cursor-pointer"
                        >
                          <div>
                            <span className="font-mono text-[9px] font-bold text-stsn-gold block">{pay.orNumber}</span>
                            <span className="font-semibold text-stone-800">{pay.term}</span>
                            <span className="text-[9px] text-stone-450 block font-mono">{pay.paymentDate}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-stone-950 block">₱{pay.amount.toLocaleString()}</span>
                            <span className="text-[9px] font-bold hover:underline text-stsn-brown">Preview Receipt</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

            </div>

          </div>
        ) : (
          <div className="bg-white p-12 rounded-xl border border-stsn-beige shadow-sm text-center lg:col-span-2">
            <Coins className="w-10 h-10 text-stone-300 mx-auto" />
            <p className="text-xs text-stone-400 mt-2 font-semibold">Please select a student record from the sidebar list to inspect fees/ledgers.</p>
          </div>
        )}

      </div>

      {/* PROCESS PAYMENT DIALOG MODAL */}
      {isPayModalOpen && currentStudent && currentAssessment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <form onSubmit={handlePostPayment} className="bg-white border text-stone-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in font-sans">
            <div className="bg-stsn-brown text-stsn-cream p-4 flex items-center justify-between">
              <h3 className="font-display font-semibold text-base flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-stsn-gold" />
                Receive Student Payment Desk
              </h3>
              <button type="button" onClick={() => setIsPayModalOpen(false)} className="text-stsn-cream">
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <div className="p-6 bg-stsn-cream space-y-4">
              <div className="p-3 bg-white border border-stsn-beige rounded-xl">
                <span className="text-[10px] text-stone-400 uppercase font-mono block">Student Name</span>
                <span className="text-xs font-bold text-stone-900">{currentStudent.lastName}, {currentStudent.firstName}</span>
                <span className="text-[9.5px] text-stsn-brown block">{currentStudent.studentNo} • {currentStudent.trackOrCourse} strand</span>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Payment Amount (PHP)</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={currentAssessment.balance}
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full bg-white border border-stone-200 rounded py-2 px-3 text-sm font-semibold focus:outline-none"
                />
                <span className="text-[9.5px] text-stone-400 mt-1 block font-mono">Max collectable: ₱{currentAssessment.balance.toLocaleString()}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Pay Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e: any) => setPaymentMethod(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded py-1.5 px-2 text-xs font-semibold focus:outline-none"
                  >
                    <option value="Cash">Cash Desk</option>
                    <option value="GCash">GCash Gateway</option>
                    <option value="Bank Transfer">Bank Transfer (BDO)</option>
                    <option value="Credit Card">Credit Card Gate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Assessment Term</label>
                  <select
                    value={payTerm}
                    onChange={(e: any) => setPayTerm(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded py-1.5 px-2 text-xs font-semibold focus:outline-none"
                  >
                    <option value="Downpayment">Downpayment</option>
                    <option value="Midterm">Midterm</option>
                    <option value="Finals">Finals</option>
                    <option value="Installment">Installment</option>
                    <option value="Full Payment">Full Settlement</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Staff Remarks</label>
                <input
                  type="text"
                  value={payRemarks}
                  onChange={(e) => setPayRemarks(e.target.value)}
                  placeholder="E.g. Payor is student's mother via GCash clearance"
                  className="w-full bg-white border border-stone-200 rounded py-2 px-3 text-xs focus:outline-none font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-stsn-brown hover:bg-stsn-brown-dark text-stsn-cream font-bold text-xs py-2.5 rounded-lg shadow cursor-pointer transition"
              >
                Post Ledger & Issue Receipt
              </button>
            </div>
          </form>
        </div>
      )}

      {/* OFFICIAL RECEIPT DIALOG MODAL */}
      {isReceiptOpen && selectedReceiptPayment && currentStudent && (
        <PreviewModal
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          title="Print official receipt coupon"
        >
          <ReceiptPreview
            student={currentStudent}
            assessment={currentAssessment}
            payment={selectedReceiptPayment}
          />
        </PreviewModal>
      )}

    </div>
  );
}

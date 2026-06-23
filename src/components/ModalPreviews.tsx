/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from "react";
import { createPortal } from "react-dom";
import { Student, Payment, Employee, StudentAssessment, Grade, Subject, PayrollRow, BookPackage } from "../types";
import { X, Printer, CheckCircle, Award, ShieldAlert, Sparkles, QrCode, FileCheck, Landmark, GraduationCap } from "lucide-react";

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  hidePrint?: boolean;
  maxWidthClass?: string;
}

export function PreviewModal({ isOpen, onClose, title, children, hidePrint = false, maxWidthClass = "max-w-3xl" }: PreviewModalProps) {
  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm animate-fade-in flex items-center justify-center p-4 md:p-8 text-stone-800">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidthClass} overflow-hidden flex flex-col max-h-[90vh] border border-stone-200`}>
        <div className="modal-header-gradient text-white p-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-stsn-gold" />
            <h3 className="font-display font-semibold text-base">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            {!hidePrint && (
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-xs px-2.5 py-1 rounded-lg text-white transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print
              </button>
            )}
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto bg-stsn-cream flex-1">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

// 1. COR PREVIEW — School-aware branding
export function CORPreview({ student, subjects }: { student: Student; subjects: Subject[] }) {
  const totalUnits = subjects.reduce((sum, s) => sum + s.units, 0);
  const isCollege = student.department === "College";

  const schoolName = isCollege
    ? "Colegio de Sta. Teresa de Avila"
    : "St. Theresa's School of Novaliches";

  const schoolSubtitle = isCollege
    ? "College Department • Colegio de Sta. Teresa de Avila"
    : "Basic Education Department • St. Theresa's School of Novaliches";

  return (
    <div className="bg-white p-8 border-2 border-stone-100 shadow-sm print-card mx-auto max-w-2xl font-sans text-stone-800 relative">
      {/* School-specific accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 rounded-t-sm ${isCollege ? "bg-gradient-to-r from-blue-700 via-blue-500 to-blue-700" : "bg-gradient-to-r from-stsn-brown-dark via-stsn-gold to-stsn-brown-dark"}`} />

      {/* Header & Seal */}
      <div className="text-center pb-6 border-b-2 border-stsn-brown/20 pt-2">
        <div className="mx-auto w-16 h-16 rounded-full bg-stsn-brown/5 flex items-center justify-center border-2 border-stsn-gold mb-2 shadow-md overflow-hidden">
          {isCollege ? (
            <GraduationCap className="w-9 h-9 text-blue-700" />
          ) : (
            <img src="/stsn-crest.png" alt="STSN Crest" className="w-full h-full object-contain p-1" />
          )}
        </div>
        <h2 className={`font-display font-bold text-xl uppercase tracking-tight ${isCollege ? "text-blue-800" : "text-stsn-brown-dark"}`}>
          {schoolName}
        </h2>
        <p className="text-[10px] text-stone-500 font-mono tracking-widest uppercase mt-0.5">
          {isCollege
            ? "Sta. Teresa St., Novaliches, Quezon City • Tel: 480-3924"
            : "#7 Kingfisher St. Zabarte Subdivision, Novaliches, Quezon City"}
        </p>
        <p className={`text-xs font-bold mt-2 ${isCollege ? "text-blue-600" : "text-stsn-gold"}`}>
          OFFICIAL CERTIFICATE OF REGISTRATION (COR)
        </p>
        <p className="text-[11px] font-medium text-stone-500">School Year: 2026-2027 • First Semester</p>
        <div className={`mt-2 inline-block text-[9px] font-mono font-bold uppercase px-3 py-0.5 rounded-full ${isCollege ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-stsn-cream text-stsn-brown border border-stsn-beige"}`}>
          {isCollege ? "TERTIARY LEVEL — COLLEGIATE DIVISION" : "K-12 BASIC EDUCATION DIVISION"}
        </div>
      </div>

      {/* Student Details Grid */}
      <div className="grid grid-cols-2 gap-y-2.5 gap-x-6 text-xs my-6 p-4 bg-stsn-cream/50 border border-stsn-beige/60 rounded-xl">
        <div>
          <span className="text-stone-400 font-medium font-mono text-[10px] block uppercase">Student ID Number</span>
          <span className="font-bold text-stone-900">{student.studentNo}</span>
        </div>
        <div>
          <span className="text-stone-400 font-medium font-mono text-[10px] block uppercase">Academic Department</span>
          <span className="font-bold text-stone-900">{student.department}</span>
        </div>
        <div>
          <span className="text-stone-400 font-medium font-mono text-[10px] block uppercase">Full Name</span>
          <span className="font-bold text-stone-900">{student.lastName}, {student.firstName} {student.middleName}</span>
        </div>
        <div>
          <span className="text-stone-400 font-medium font-mono text-[10px] block uppercase">
            {isCollege ? "Course / Program" : "Strand / Level"}
          </span>
          <span className="font-bold text-stsn-brown">{student.trackOrCourse || "N/A"} — {student.yearLevel}</span>
        </div>
        <div>
          <span className="text-stone-400 font-medium font-mono text-[10px] block uppercase">
            {isCollege ? "Section / Block" : "Advisory Section"}
          </span>
          <span className="font-bold text-stone-900">{student.section || "Unassigned"}</span>
        </div>
        <div>
          <span className="text-stone-400 font-medium font-mono text-[10px] block uppercase">Enrollment Status</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
            OFFICIALLY ENROLLED
          </span>
        </div>
      </div>

      {/* Enrolled Subjects List */}
      <div className="mt-4">
        <h4 className={`text-xs font-display font-semibold uppercase tracking-wider mb-2 ${isCollege ? "text-blue-700" : "text-stsn-brown"}`}>
          Pre-registered Class Load
        </h4>
        <table className="w-full text-left text-xs border border-stone-200 rounded-lg overflow-hidden">
          <thead>
            <tr className={`border-b border-stone-200 text-[10px] font-bold text-white uppercase ${isCollege ? "bg-blue-700" : "bg-stsn-brown"}`}>
              <th className="p-2.5">Subject Code</th>
              <th className="p-2.5">Descriptive Title</th>
              <th className="p-2.5 text-center">Units</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {subjects.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-4 text-center text-stone-400 italic">No registered subjects loaded.</td>
              </tr>
            ) : (
              subjects.map((sub) => (
                <tr key={sub.id} className="hover:bg-stone-50/50">
                  <td className={`p-2.5 font-mono font-semibold ${isCollege ? "text-blue-700" : "text-stsn-brown"}`}>{sub.code}</td>
                  <td className="p-2.5 text-stone-700">{sub.name}</td>
                  <td className="p-2.5 text-center font-bold">
                    {isCollege ? (sub.units > 0 ? sub.units : "—") : "N/A (K-12)"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-6 pt-4 border-t border-stone-100 text-[11px] text-stone-500">
        <div>
          <span className="block">
            Total Load: <strong>
              {isCollege
                ? (totalUnits > 0 ? `${totalUnits} Units` : "N/A")
                : `${subjects.length} Subjects`}
            </strong>
          </span>
        </div>
        <div className="font-mono text-[10px]">
          Code: <span className="font-bold text-stone-800">
            {isCollege ? "CDSTA-COR-" : "STSN-COR-"}981A
          </span>
        </div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-8 mt-12 text-center text-xs pt-4 border-t border-stone-200">
        <div>
          <div className="h-10 border-b border-stone-300 w-3/4 mx-auto" />
          <span className="block font-medium text-stone-700 mt-2">
            {isCollege ? "Dr. Maria Santos, Ed.D." : "Cynthia Ramos, LPT"}
          </span>
          <span className="text-[10px] text-stone-400 uppercase font-mono">
            {isCollege ? "College Registrar" : "Senior Registrar Desk"}
          </span>
        </div>
        <div>
          <div className="h-10 border-b border-stone-300 w-3/4 mx-auto flex items-end justify-center">
            <span className={`text-[10px] font-mono tracking-widest font-bold rotate-[-3deg] border-2 px-1 rounded uppercase ${isCollege ? "text-blue-600 border-blue-500" : "text-red-500 border-red-500"}`}>
              {isCollege ? "CDSTA PAID" : "STSN PAID"}
            </span>
          </div>
          <span className="block font-medium text-stone-700 mt-2">Treasury & Accounting Office</span>
          <span className="text-[10px] text-stone-400 uppercase font-mono">Released Clearance Seal</span>
        </div>
      </div>
    </div>
  );
}

// 2. OR PREVIEW
export function ReceiptPreview({
  student, assessment, payment, bookPackage,
}: {
  student: Student;
  assessment?: StudentAssessment;
  payment: Payment;
  bookPackage?: BookPackage;
}) {
  const isCollege = student.department === "College";
  const schoolName = isCollege
    ? "COLEGIO DE STA. TERESA DE AVILA"
    : "ST. THERESA'S SCHOOL OF NOVALICHES";
  const schoolAddress = isCollege
    ? "Sta. Teresa St., Novaliches, Quezon City • TEL: 480-3924"
    : "#7 Kingfisher St. Zabarte Subdivision, Novaliches, QC • TEL: 480-2819";

  // Group fees by category for itemized breakdown
  const feeGroups: Record<string, { feeName: string; amount: number }[]> = {};
  if (assessment?.fees) {
    for (const fee of assessment.fees) {
      if (!feeGroups[fee.category]) feeGroups[fee.category] = [];
      feeGroups[fee.category].push({ feeName: fee.feeName, amount: fee.amount });
    }
  }

  const netPayable = assessment
    ? Math.max(0, assessment.totalAmount - assessment.discountAmount)
    : payment.amount;

  return (
    <div className="bg-white p-6 border-2 border-stone-100 shadow-sm print-card max-w-md mx-auto font-mono text-xs text-stone-700 leading-relaxed">

      {/* School Header */}
      <div className="text-center pb-4 border-b border-dashed border-stone-300">
        <h2 className="font-display font-extrabold text-[#3E1E09] tracking-tight text-base leading-tight">{schoolName}</h2>
        <p className="text-[9px] text-stone-500 mt-0.5">{schoolAddress}</p>
        <div className="mt-3">
          <p className="text-stsn-gold font-bold text-sm tracking-widest uppercase">Official Receipt</p>
          <p className="font-black text-stone-950 text-base mt-0.5">{payment.orNumber}</p>
        </div>
      </div>

      {/* Payor Info */}
      <div className="space-y-1.5 py-4 border-b border-dashed border-stone-300">
        {[
          ["DATE", payment.paymentDate],
          ["PAYOR", `${student.lastName}, ${student.firstName}`],
          ["STUDENT ID", student.studentNo],
          ["GRADE / YEAR LEVEL", student.yearLevel],
          ["SECTION", student.section || "—"],
          ["SCHOOL YEAR", assessment?.schoolYear || "2026-2027"],
          ["PAYMENT TERM", assessment?.paymentTerm || "—"],
          ["PURPOSE", payment.term],
          ["PAYMENT METHOD", payment.paymentMethod],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between gap-2">
            <span className="text-stone-400 shrink-0">{label}:</span>
            <span className="font-bold text-stone-900 text-right truncate max-w-[200px]">{value}</span>
          </div>
        ))}
      </div>

      {/* Fee Breakdown */}
      {assessment && (
        <div className="py-4 border-b border-dashed border-stone-300">
          <div className="flex justify-between text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-3 border-b border-stone-200 pb-1.5">
            <span>Particulars</span>
            <span>Amount (PHP)</span>
          </div>

          {Object.keys(feeGroups).length > 0 ? (
            Object.entries(feeGroups).map(([category, fees]) => (
              <div key={category} className="mb-3">
                <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wide mb-1">{category}</p>
                {fees.map((fee, i) => (
                  <div key={i} className="flex justify-between pl-3">
                    <span className="text-stone-600">{fee.feeName}</span>
                    <span className="font-medium">{fee.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            ))
          ) : (
            <div className="flex justify-between mb-2">
              <span className="text-stone-600">Tuition & Enrollment Assessment</span>
              <span className="font-medium">{assessment.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            </div>
          )}

          {bookPackage && (
            <div className="mb-3">
              <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wide mb-1">Books</p>
              <div className="flex justify-between pl-3">
                <span className="text-stone-600">{bookPackage.packageName}</span>
                <span className="font-medium">{bookPackage.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          )}

          <div className="border-t border-stone-300 pt-2 mt-1 space-y-1.5">
            <div className="flex justify-between font-bold text-stone-800">
              <span>TOTAL ASSESSMENT</span>
              <span>{assessment.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            </div>
            {assessment.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>
                  DISCOUNT{assessment.scholarshipName ? ` — ${assessment.scholarshipName}` : ""}
                  {assessment.discountPercentage > 0 ? ` (${assessment.discountPercentage}%)` : ""}
                </span>
                <span>-{assessment.discountAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-stone-900 border-t border-stone-300 pt-1.5">
              <span>NET PAYABLE</span>
              <span>{netPayable.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      )}

      {/* Payment Summary */}
      <div className="py-4 space-y-1.5 border-b border-dashed border-stone-300">
        <div className="flex justify-between text-sm font-bold text-stone-950">
          <span>AMOUNT PAID:</span>
          <span>PHP {payment.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
        </div>
        {assessment && (
          <div className="flex justify-between text-[11px] font-semibold text-stone-500">
            <span>REMAINING BALANCE:</span>
            <span>PHP {assessment.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
          </div>
        )}
        {payment.remarks && (
          <p className="text-[10px] text-stone-500 italic mt-1">*{payment.remarks}</p>
        )}
      </div>

      {/* Signature Area */}
      <div className="pt-5 grid grid-cols-2 gap-6">
        <div className="text-center">
          <div className="h-8 border-b border-stone-400 w-full" />
          <p className="text-[9px] text-stone-400 uppercase tracking-wider mt-1.5">Cashier / Collector</p>
        </div>
        <div className="text-center">
          <div className="h-8 border-b border-stone-400 w-full" />
          <p className="text-[9px] text-stone-400 uppercase tracking-wider mt-1.5">Payor's Signature</p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-4 border-t border-dashed border-stone-300 text-[10px] text-stone-400 space-y-0.5 mt-5">
        <p>Thank you for keeping your account updated!</p>
        <p>"Virtus et Scientia" • St. Theresa School of Novaliches</p>
        <p className="font-semibold text-stone-700 mt-1">SYSTEM GENERATED — NO SIGNATURE REQUIRED</p>
      </div>
    </div>
  );
}

// 3. REPORT CARD PREVIEW
export function ReportCardPreview({ student, grades, subjects }: { student: Student; grades: Grade[]; subjects: Subject[] }) {
  const isBasicEd = student.department === "Basic Education";
  const cardData = subjects.map((sub) => {
    const grade = grades.find((g) => g.subjectCode === sub.code);
    const q1 = grade?.midtermGrade || 85;
    const q2 = grade?.finalGrade || 87;
    const q3 = Math.min(100, Math.max(50, (grade?.midtermGrade ?? 85) + 2));
    const q4 = Math.min(100, Math.max(50, (grade?.finalGrade ?? 87) - 1));
    const calculatedFinalRating = Math.round((q1 + q2 + q3 + q4) / 4);
    return {
      code: sub.code,
      name: sub.name,
      midterm: grade?.midtermGrade || null,
      final: grade?.finalGrade || null,
      q1, q2, q3, q4,
      finalRating: calculatedFinalRating,
      remarks: calculatedFinalRating >= 75 ? "Passed" : "Failed"
    };
  });

  const validFinalGrades = cardData.filter((c) => c.final !== null).map((c) => c.final!);
  const collegeGpa = validFinalGrades.length > 0
    ? (validFinalGrades.reduce((sum, g) => sum + g, 0) / validFinalGrades.length).toFixed(2)
    : "N/A";
  const basicEdGpa = cardData.length > 0
    ? (cardData.reduce((sum, c) => sum + c.finalRating, 0) / cardData.length).toFixed(1)
    : "N/A";

  const schoolName = isBasicEd ? "St. Theresa's School of Novaliches" : "Colegio de Sta. Teresa de Avila";
  const docTitle = isBasicEd ? "STUDENT PROGRESS REPORT CARD (SF9)" : "COLLEGIATE ACADEMIC RECORD / TRANSCRIPT";

  return (
    <div className="bg-white p-6 sm:p-8 border-2 border-stone-100 shadow-sm print-card mx-auto max-w-3xl font-sans text-stone-800">
      <div className={`absolute top-0 left-0 right-0 h-1.5 rounded-t-sm ${isBasicEd ? "bg-gradient-to-r from-stsn-brown-dark via-stsn-gold to-stsn-brown-dark" : "bg-gradient-to-r from-blue-700 via-blue-400 to-blue-700"}`} />

      {/* Branding Header */}
      <div className="text-center pb-4 border-b border-stsn-gold relative">
        <div className="absolute top-0 right-2 w-12 h-12 rounded-full border border-stsn-gold/30 bg-stsn-cream flex items-center justify-center font-display font-bold text-[10px] text-stsn-brown leading-none select-none">
          {isBasicEd ? "STSN" : "CDSTA"}
        </div>
        <h2 className={`font-display font-bold text-xl uppercase tracking-tight ${isBasicEd ? "text-stsn-brown" : "text-blue-800"}`}>
          {schoolName}
        </h2>
        <p className="text-[10px] text-stone-500 font-mono tracking-widest uppercase">
          {isBasicEd ? "#7 Kingfisher St. Zabarte Subdivision, Novaliches Quezon City" : "Sta. Teresa St., Novaliches, Quezon City • Tel: 480-3924"}
        </p>
        <h3 className={`text-xs font-bold text-stone-900 uppercase mt-3 tracking-widest py-1 rounded inline-block px-4 ${isBasicEd ? "bg-stone-100" : "bg-blue-50 text-blue-800"}`}>
          {docTitle}
        </h3>
        <p className="text-[11px] font-medium text-stone-500 mt-0.5">
          Academic Year 2026-2027 • {isBasicEd ? "K-12 Basic Education Department" : "College Division — Colegio de Sta. Teresa de Avila"}
        </p>
      </div>

      {/* Student Profile Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs my-5 bg-stone-50 p-4 rounded-xl border border-stone-200">
        <div>Name: <strong className="uppercase font-semibold text-stone-900">{student.lastName}, {student.firstName} {student.middleName}</strong></div>
        <div>Student No.: <strong className="font-mono">{student.studentNo}</strong></div>
        <div>Department: <strong className={isBasicEd ? "text-stsn-brown" : "text-blue-700"}>{isBasicEd ? "Basic Education (K-12)" : "Tertiary Division (College)"}</strong></div>
        <div>Year Level & Section: <strong>{student.yearLevel} — Section {student.section || "N/A"}</strong></div>
        <div>{isBasicEd ? "Strand:" : "Program:"} <strong>{student.trackOrCourse || "N/A"}</strong></div>
        <div>Adviser: <strong>{isBasicEd ? "Mrs. Beatriz Cruz" : "Dr. Arthur Reyes"}</strong></div>
      </div>

      {isBasicEd ? (
        <div className="space-y-6">
          <div>
            <h4 className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest mb-1.5">REPORT ON LEARNING PROGRESS AND ACHIEVEMENT</h4>
            <table className="w-full text-left text-xs border border-stone-200 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-stsn-brown text-stsn-cream text-[9.5px] uppercase font-mono font-bold leading-none">
                  <th className="p-2 w-1/3">Learning Area / Subject</th>
                  <th className="p-2 text-center border-l border-stsn-cream/20">Q1</th>
                  <th className="p-2 text-center border-l border-stsn-cream/20">Q2</th>
                  <th className="p-2 text-center border-l border-stsn-cream/20">Q3</th>
                  <th className="p-2 text-center border-l border-stsn-cream/20">Q4</th>
                  <th className="p-2 text-center border-l border-stsn-cream/25 bg-stsn-brown-dark font-sans text-[10px]">Final Rating</th>
                  <th className="p-2 text-center border-l border-stsn-cream/20">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 font-medium text-stone-700">
                {cardData.length === 0 ? (
                  <tr><td colSpan={7} className="p-4 text-center text-stone-400 italic">No grades encoded yet.</td></tr>
                ) : (
                  cardData.map((row) => (
                    <tr key={row.code} className="hover:bg-stone-50/50 text-[11.5px]">
                      <td className="p-2">
                        <span className="font-mono font-bold text-stone-400 text-[10px] block leading-none mb-0.5">{row.code}</span>
                        <span className="font-bold text-stone-900">{row.name}</span>
                      </td>
                      <td className="p-2 text-center font-mono text-stone-600">{row.q1}</td>
                      <td className="p-2 text-center font-mono text-stone-600">{row.q2}</td>
                      <td className="p-2 text-center font-mono text-stone-600">{row.q3}</td>
                      <td className="p-2 text-center font-mono text-stone-600">{row.q4}</td>
                      <td className="p-2 text-center font-mono font-black text-[#5C3A21] bg-stsn-cream/30 text-xs">{row.finalRating}%</td>
                      <td className="p-2 text-center">
                        <span className="bg-green-50 text-green-700 border border-green-200 font-mono font-bold text-[9px] px-1.5 py-0.5 rounded uppercase">PASSED</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-stone-200 p-4 rounded-xl space-y-2 bg-stone-50/50">
              <h4 className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest border-b border-stone-200 pb-1.5">CORE VALUES OBSERVATION</h4>
              <div className="space-y-1.5 text-[11px] leading-relaxed text-stone-600">
                {[
                  ["Maka-Diyos (Spiritual reverence)", "AO / Always Observed"],
                  ["Maka-tao (Respect & empathy)", "AO / Always Observed"],
                  ["Makakalikasan (Environment care)", "SO / Sometimes Observed"],
                  ["Makabansa (Civic duty)", "AO / Always Observed"]
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between font-medium border-b border-dashed border-stone-200 pb-1">
                    <span>{label}</span>
                    <strong className="font-mono text-stsn-brown text-[9px]">{val}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-stone-200 p-4 rounded-xl space-y-2 bg-stone-50/50">
              <h4 className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest border-b border-stone-200 pb-1.5">LEARNER ATTENDANCE RECORD</h4>
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono font-medium">
                {[["School Days", "180", "text-stone-850"], ["Days Present", "178", "text-green-700"], ["Days Tardy", "2", "text-red-600"]].map(([label, val, color]) => (
                  <div key={label} className="bg-white p-2 border border-stone-150 rounded">
                    <span className="text-[9px] block uppercase text-stone-400 leading-none">{label}</span>
                    <strong className={`text-sm font-black mt-1 block ${color}`}>{val}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center p-4 bg-stsn-cream border border-stsn-beige rounded-xl">
            <div>
              <h4 className="text-xs font-bold text-stsn-brown uppercase">Semestral General Average</h4>
              <p className="text-[10px] text-stone-400 font-mono mt-0.5">DepEd Consolidated Grading System</p>
            </div>
            <div className="text-right">
              <span className="text-[9.5px] block font-semibold text-stone-400 uppercase font-mono mb-0.5">General Average</span>
              <span className="text-2xl font-bold font-display text-stsn-brown-dark">{basicEdGpa}%</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <table className="w-full text-left text-xs border border-stone-200 rounded-lg overflow-hidden mt-4">
            <thead>
              <tr className="bg-blue-700 text-white text-[10px] uppercase font-bold font-mono">
                <th className="p-2.5">Code</th>
                <th className="p-2.5">Subject Description</th>
                <th className="p-2.5 text-center">Units</th>
                <th className="p-2.5 text-center">Midterm</th>
                <th className="p-2.5 text-center">Final Grade</th>
                <th className="p-2.5 text-center">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {cardData.length === 0 ? (
                <tr><td colSpan={6} className="p-4 text-center text-stone-400 italic">No grades found.</td></tr>
              ) : (
                cardData.map((row) => (
                  <tr key={row.code} className="hover:bg-stone-50/50">
                    <td className="p-2.5 font-mono font-semibold text-blue-700">{row.code}</td>
                    <td className="p-2.5 text-stone-700 font-bold">{row.name}</td>
                    <td className="p-2.5 text-center font-mono text-stone-500">3</td>
                    <td className="p-2.5 text-center font-bold text-stone-900">{row.midterm !== null ? row.midterm : "N/A"}</td>
                    <td className="p-2.5 text-center font-bold text-stone-900">{row.final !== null ? row.final : "N/A"}</td>
                    <td className="p-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${row.remarks === "Passed" ? "bg-green-50 text-green-700 border border-green-150" : "bg-red-50 text-red-700 border border-red-150"}`}>
                        {row.remarks}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="flex justify-between items-center mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <div>
              <h4 className="text-xs font-bold text-blue-800 uppercase">Collegiate GPA Standing</h4>
              <p className="text-[10px] text-stone-400 font-mono mt-0.5">CHEd Standard Grade Point Average</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] block font-semibold text-stone-400 uppercase font-mono">GPA Rating</span>
              <span className="text-2xl font-bold font-display text-blue-800">{collegeGpa}</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-8 mt-12 text-center text-xs">
        <div>
          <div className="h-10 border-b border-stone-300 w-3/4 mx-auto" />
          <span className="block font-semibold text-stone-700 mt-2">{isBasicEd ? "Mrs. Beatriz Cruz" : "Dr. Arthur Reyes"}</span>
          <span className="text-[9.5px] text-stone-400 uppercase font-mono">Class Section Adviser</span>
        </div>
        <div>
          <div className="h-10 border-b border-stone-300 w-3/4 mx-auto" />
          <span className="block font-semibold text-stone-700 mt-2">{isBasicEd ? "Cynthia Ramos, LPT" : "Dr. Maria Santos, Ed.D."}</span>
          <span className="text-[9.5px] text-stone-400 uppercase font-mono">
            {isBasicEd ? "Basic Ed Registrar" : "College Registrar"}
          </span>
        </div>
      </div>
    </div>
  );
}

// 4. PAYSLIP PREVIEW
export function PayslipPreview({ employee, row }: { employee: Employee; row: PayrollRow }) {
  return (
    <div className="bg-white p-8 border-2 border-stone-100 shadow-sm print-card mx-auto max-w-xl font-sans text-stone-800">
      <div className="text-center pb-4 border-b-2 border-stone-200">
        <h2 className="font-display font-extrabold text-xl uppercase tracking-tight text-stsn-brown">St. Theresa School</h2>
        <p className="text-xs font-semibold text-stone-400 tracking-wider">OFFICIAL RECOGNIZED CORPORATE PAYSLIP</p>
        <p className="text-[11px] font-mono text-stsn-gold font-medium">PAYROLL PERIOD: {row.period}</p>
      </div>
      <div className="grid grid-cols-2 gap-4 text-xs my-4 bg-stone-50 p-3 rounded-lg border border-stone-200/80">
        <div>Employee Name: <strong>{employee.firstName} {employee.lastName}</strong></div>
        <div>Staff Position: <strong>{employee.position}</strong></div>
        <div>Department: <strong>{employee.department}</strong></div>
        <div>Employment Status: <strong>{employee.status} (Full benefits)</strong></div>
      </div>
      <div className="grid grid-cols-2 gap-6 mt-6">
        <div>
          <h4 className="border-b border-stone-400 text-xs font-bold text-stsn-brown pb-1 mb-2">EARNINGS / ALLOWANCES</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between"><span>Basic Standard Pay:</span><span className="font-mono">PHP {row.basicSalary.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></div>
            <div className="flex justify-between"><span>Standard Allowances:</span><span className="font-mono">PHP {row.allowances.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></div>
            <div className="flex justify-between border-t border-stone-200 font-bold pt-1 text-stone-900">
              <span>Gross Pay:</span>
              <span className="font-mono">PHP {(row.basicSalary + row.allowances).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
        <div>
          <h4 className="border-b border-stone-400 text-xs font-bold text-red-700 pb-1 mb-2">GOVERNMENT DEDUCTIONS</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between"><span>SSS contribution:</span><span className="font-mono text-red-500">-{row.sssDeduction.toLocaleString()}</span></div>
            <div className="flex justify-between"><span>PhilHealth deduction:</span><span className="font-mono text-red-500">-{row.philhealthDeduction.toLocaleString()}</span></div>
            <div className="flex justify-between"><span>Pag-IBIG collection:</span><span className="font-mono text-red-500">-{row.pagibigDeduction.toLocaleString()}</span></div>
            <div className="flex justify-between"><span>Withholding tax:</span><span className="font-mono text-red-500">-{row.taxDeduction.toLocaleString()}</span></div>
            <div className="flex justify-between border-t border-stone-200 font-bold pt-1 text-red-900">
              <span>Deductions sum:</span>
              <span className="font-mono">PHP {(row.sssDeduction + row.philhealthDeduction + row.pagibigDeduction + row.taxDeduction).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8 p-4 bg-stsn-cream border-2 border-stsn-gold/30 rounded-xl flex justify-between items-center text-stsn-brown-dark font-display font-medium">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-stsn-brown">NET TAKE-HOME DISBURSEMENT</h3>
          <p className="text-[10px] text-stone-400 font-mono mt-0.5">Disbursed directly via BDO Employee Ledger</p>
        </div>
        <div className="text-right text-xl font-bold font-display text-stsn-brown">
          PHP {row.netPay.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-8 mt-12 text-center text-xs">
        <div>
          <div className="h-10 border-b border-stone-300 w-3/4 mx-auto" />
          <span className="block font-medium text-stone-700 mt-2">Gemma Santos</span>
          <span className="text-[10px] text-stone-400 uppercase font-mono">HR Payroll Department Head</span>
        </div>
        <div>
          <div className="h-10 border-b border-stone-300 w-3/4 mx-auto flex items-end justify-center">
            <span className="text-[10px] text-green-600 font-mono tracking-widest font-bold rotate-[-3deg] border-2 border-green-500 px-1 rounded uppercase">DISBURSED VIA BANK</span>
          </div>
          <span className="block font-medium text-stone-700 mt-2">Finance & Auditing Desk</span>
          <span className="text-[10px] text-stone-400 uppercase font-mono">BDO Cash Release Clearance</span>
        </div>
      </div>
    </div>
  );
}

// 5. ID CARD PREVIEW — 3D Flip Mechanism
export function IDCardPreview({
  name, roleType, idNo, trackOrDept, email, isFlipped = false
}: {
  name: string;
  roleType: string;
  idNo: string;
  trackOrDept: string;
  email: string;
  isFlipped?: boolean;
}) {
  const isStudent = roleType.toLowerCase() === "student";

  return (
    <div className="flex justify-center items-center py-2 font-sans">
      {/* 3D Flip Scene */}
      <div className="card-flip-scene">
        <div className={`card-flip-inner ${isFlipped ? "is-flipped" : ""}`}>

          {/* ===== FRONT FACE ===== */}
          <div className="card-face">
            <div className="w-full h-full bg-gradient-to-b from-[#2E1C10] via-stsn-brown-dark to-stone-900 text-white p-5 flex flex-col justify-between overflow-hidden relative border-2 border-stsn-gold/40">
              {/* Decorative glows */}
              <div className="absolute -top-12 -right-12 w-28 h-28 bg-stsn-gold/20 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute top-1/2 left-10 w-24 h-24 bg-stsn-gold-light/10 rounded-full blur-2xl pointer-events-none animate-pulse" />
              <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />

              {/* Brand Header */}
              <div className="flex items-center gap-2 pb-4 border-b border-white/10 relative z-10">
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-stsn-gold font-display font-black border border-stsn-gold shadow-lg">
                  T
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-[11px] leading-tight text-white tracking-tight uppercase">St. Theresa School</h3>
                  <p className="text-[7.5px] text-stone-400 tracking-wider">"Virtus et Scientia" • EST. 1982</p>
                </div>
              </div>

              {/* Photo + Details */}
              <div className="my-auto py-4 flex flex-col items-center relative z-10">
                <div className="w-24 h-24 rounded-2xl bg-stone-800 border-4 border-stsn-gold/60 p-1 flex items-center justify-center relative overflow-hidden shadow-lg">
                  {/* Real demo photo — randomuser.me placeholder */}
                  <img
                    src="https://randomuser.me/api/portraits/women/44.jpg"
                    alt="Student Photo"
                    className="w-full h-full rounded-xl object-cover object-top"
                  />
                  <div className={`absolute bottom-0 inset-x-0 text-center py-0.5 text-[8.5px] font-bold uppercase tracking-widest ${isStudent ? "bg-stsn-gold text-stsn-brown-dark" : "bg-emerald-600 text-white"}`}>
                    {roleType}
                  </div>
                </div>

                <div className="text-center mt-4">
                  <h4 className="font-display font-bold text-base leading-snug truncate max-w-[230px]">{name}</h4>
                  <p className="text-[10px] text-stsn-gold font-mono tracking-wide mt-0.5">{idNo}</p>
                  <p className="text-xs text-stone-300 font-semibold mt-1 uppercase tracking-wide">{trackOrDept}</p>
                </div>
              </div>

              {/* Bottom Info */}
              <div className="pt-3 border-t border-white/10 flex justify-between items-center relative z-10">
                <div>
                  <span className="text-[7px] text-stone-400 uppercase block font-mono">Academic ID</span>
                  <span className="text-[9px] font-bold text-stsn-gold-light">SY 2026-2027</span>
                </div>
                <div className="text-right">
                  <span className="text-[7px] text-stone-400 uppercase block font-mono">System ID</span>
                  <span className="text-[9px] font-bold font-mono">STSN-{idNo.split("-").pop()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ===== BACK FACE ===== */}
          <div className="card-face card-face-back">
            <div className="w-full h-full bg-stsn-cream border-2 border-stsn-beige p-5 flex flex-col justify-between text-stone-800 relative">
              {/* Hologram sticker */}
              <div className="absolute top-4 right-4 w-10 h-10 border border-stsn-gold/50 rounded-lg bg-gradient-to-br from-yellow-300 via-pink-400 to-indigo-400 opacity-80 flex items-center justify-center shadow-inner">
                <span className="text-[5px] text-white/90 font-mono uppercase font-bold tracking-tight text-center leading-tight">STSN<br/>VALID</span>
              </div>

              {/* Terms */}
              <div className="space-y-3 pt-2">
                <div className="bg-stsn-brown/5 border border-stsn-brown/10 rounded-lg p-3">
                  <h4 className="text-[9.5px] font-bold text-stsn-brown uppercase mb-1">Property of St. Theresa School</h4>
                  <p className="text-[8px] text-stone-500 leading-relaxed">
                    This card is non-transferable and must be worn inside school premises at all times. Return immediately if found to the Registrar Desk.
                  </p>
                </div>

                <div className="space-y-1 text-[8.5px] text-stone-600 font-mono">
                  <p><strong>Contact Desk:</strong> desk@stsn.edu.ph</p>
                  <p><strong>Emergency:</strong> +63 917 019 1575</p>
                  <p><strong>System Auth:</strong> {email}</p>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center gap-2 my-auto">
                <div className="p-3 bg-white border border-stone-200 rounded-xl shadow-inner">
                  <QrCode className="w-16 h-16 text-stsn-brown-dark" />
                </div>
                <span className="text-[7.5px] text-stone-400 font-mono uppercase tracking-widest">STSN Secure QR — Campus Gate Verified</span>
              </div>

              {/* Signature + Barcode */}
              <div className="pt-2 border-t border-stone-200 text-center">
                <div className="h-5 border-b border-stone-300 w-2/3 mx-auto flex items-end justify-center">
                  <span className="font-mono text-[7px] italic text-stone-400">Eduardo Bonto, CPA — VP Administration</span>
                </div>

                {/* Barcode mockup */}
                <div className="mt-3 flex gap-0.5 justify-center h-5 w-full bg-slate-50 border border-stone-200 rounded p-1">
                  {[1, 0.5, 2, 0.5, 1.5, 0.1, 2, 0.5, 1, 0.5, 1, 3, 1].map((w, i) => (
                    <div key={i} className="bg-stone-800" style={{ width: `${w * 4}px` }} />
                  ))}
                </div>
                <span className="text-[7px] font-mono text-stone-400 mt-1 block">
                  {idNo}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

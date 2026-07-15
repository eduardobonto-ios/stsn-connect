import React from "react";
import { Banknote, ChevronDown, Clock, Package, Receipt } from "lucide-react";
import AppButton from "../../../components/common/AppButton";
import AppStatusBadge from "../../../components/common/AppStatusBadge";
import EmptyState from "../../../components/common/EmptyState";
import type { BookPackage, Student, StudentAssessment } from "../../../types";
import { ASSESSMENT_APPROVAL_STATUS_CONFIG, DEFAULT_ASSESSMENT_APPROVAL_STATUS } from "../../../config/accounting.config";

export type QueueRow = { assessment: StudentAssessment; student?: Student };

export default function PaymentQueueView({ rows, awaitingRows, selectedId, academicUnit, bookPackages, canCollect, onSelect, onCollect, formatMoney, getAcademicLine }: {
  rows: QueueRow[];
  awaitingRows: QueueRow[];
  selectedId: string | null;
  academicUnit: "basic-ed" | "college";
  bookPackages: BookPackage[];
  canCollect: boolean;
  onSelect: (id: string) => void;
  onCollect: (id: string) => void;
  formatMoney: (value: number) => string;
  getAcademicLine: (student: Student | undefined, unit: "basic-ed" | "college") => string;
}) {
  const selected = rows.find(({ assessment }) => assessment.id === selectedId);
  const selectedPackage = selected?.assessment.booksAvailed ? bookPackages.find((item) => item.id === selected.assessment.bookPackageId) : undefined;
  const net = selected ? Math.max(0, selected.assessment.totalAmount - selected.assessment.discountAmount) : 0;
  const paid = selected ? Math.max(0, net - selected.assessment.balance) : 0;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)]">
        <section className="overflow-hidden rounded-xl border border-stsn-beige bg-white shadow-sm" aria-label="Approved payment queue">
          <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
            <h3 className="flex items-center gap-2 text-sm font-bold text-stone-900"><Receipt className="h-4 w-4 text-stsn-gold" />Approved for Payment</h3>
            <span className="text-[10px] font-mono text-stone-500">{rows.length} in queue</span>
          </div>
          {rows.length === 0 ? (
            <div className="p-4"><EmptyState icon={Receipt} title="Payment Queue is Empty" description="Approved assessments with an outstanding balance will appear here." compact /></div>
          ) : (
            <div role="listbox" aria-label="Students ready for collection" className="divide-y divide-stone-100">
              {rows.map(({ assessment, student }) => {
                const isSelected = assessment.id === selectedId;
                const pkg = assessment.booksAvailed ? bookPackages.find((item) => item.id === assessment.bookPackageId) : undefined;
                return (
                  <button key={assessment.id} type="button" role="option" aria-selected={isSelected} onClick={() => onSelect(assessment.id)} onKeyDown={(event) => { if (event.key === "Enter") onSelect(assessment.id); }} className={`w-full border-l-4 px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stsn-gold ${isSelected ? "border-l-stsn-gold bg-stsn-cream/70" : "border-l-transparent hover:bg-stone-50"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-stone-900">{student ? `${student.lastName}, ${student.firstName}` : "Unknown Student"}</p>
                        <p className="text-[10px] font-mono text-stone-500">{student?.studentNo || "—"}</p>
                        <p className="mt-1 truncate text-[10px] text-stone-500">{getAcademicLine(student, academicUnit)} • {assessment.schoolYear}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[9px]">
                          <AppStatusBadge status={ASSESSMENT_APPROVAL_STATUS_CONFIG["Approved for Payment"].label} />
                          <span className="rounded-full bg-stone-100 px-2 py-0.5 font-semibold text-stone-600">{assessment.paymentTerm}</span>
                          {pkg && <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 font-semibold text-purple-700"><Package className="h-3 w-3" />{pkg.packageName}</span>}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[9px] font-bold uppercase text-stone-400">Balance due</p>
                        <p className="font-mono text-sm font-black text-emerald-700">{formatMoney(assessment.balance)}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <aside className="rounded-xl border border-stsn-beige bg-white shadow-sm lg:sticky lg:top-4" aria-label="Selected student account">
          {!selected ? <div className="p-5"><EmptyState icon={Receipt} title="Select a student" description="Choose a queue row to review the account before collecting." compact /></div> : (
            <div className="p-4">
              <p className="text-sm font-black text-stone-900">{selected.student ? `${selected.student.lastName}, ${selected.student.firstName}` : "Unknown Student"}</p>
              <p className="text-[10px] font-mono text-stone-500">{selected.student?.studentNo || "—"}</p>
              <p className="mt-1 text-[10px] text-stone-500">{getAcademicLine(selected.student, academicUnit)} • {selected.assessment.schoolYear}</p>
              <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-stone-50 p-2"><dt className="text-[9px] uppercase text-stone-400">Net assessment</dt><dd className="font-mono font-bold">{formatMoney(net)}</dd></div>
                <div className="rounded-lg bg-stone-50 p-2"><dt className="text-[9px] uppercase text-stone-400">Amount paid</dt><dd className="font-mono font-bold">{formatMoney(paid)}</dd></div>
                <div className="rounded-lg bg-stone-50 p-2"><dt className="text-[9px] uppercase text-stone-400">Discount</dt><dd className="font-mono font-bold text-emerald-700">{formatMoney(selected.assessment.discountAmount)}</dd></div>
                <div className="rounded-lg bg-emerald-50 p-2"><dt className="text-[9px] uppercase text-emerald-700">Balance due</dt><dd className="font-mono font-black text-emerald-800">{formatMoney(selected.assessment.balance)}</dd></div>
              </dl>
              {selected.assessment.fees.length > 0 && <details className="mt-3 rounded-lg border border-stone-200 p-3 text-xs"><summary className="flex cursor-pointer list-none items-center justify-between font-bold text-stone-700">Fee breakdown <ChevronDown className="h-3.5 w-3.5" /></summary><div className="mt-2 space-y-1">{selected.assessment.fees.map((fee, index) => <div key={`${fee.feeName}-${index}`} className="flex justify-between gap-2 text-[10px]"><span>{fee.feeName}</span><span className="font-mono">{formatMoney(fee.amount)}</span></div>)}</div></details>}
              {selectedPackage && <details className="mt-2 rounded-lg border border-purple-100 bg-purple-50/50 p-3 text-xs"><summary className="cursor-pointer font-bold text-purple-800">Book package: {selectedPackage.packageName}</summary><div className="mt-2 space-y-1">{selectedPackage.books.map((book) => <div key={book.id} className="flex justify-between text-[10px]"><span>{book.title}</span><span className="font-mono">{formatMoney(book.unitPrice)}</span></div>)}</div></details>}
              {canCollect && <AppButton type="button" onClick={() => onCollect(selected.assessment.id)} leftIcon={Banknote} variant="primary" size="sm" fullWidth className="mt-4">Collect {formatMoney(selected.assessment.balance)}</AppButton>}
            </div>
          )}
        </aside>
      </div>

      {awaitingRows.length > 0 && <section className="overflow-hidden rounded-xl border border-stsn-beige bg-white shadow-sm"><div className="flex items-center gap-2 border-b border-stone-100 px-4 py-3"><Clock className="h-4 w-4 text-amber-600" /><h3 className="text-sm font-bold text-stone-900">Awaiting Accounting Approval</h3><span className="ml-auto text-[10px] font-mono text-stone-500">{awaitingRows.length} pending</span></div><div className="divide-y divide-stone-100">{awaitingRows.map(({ assessment, student }) => { const status = assessment.approvalStatus || DEFAULT_ASSESSMENT_APPROVAL_STATUS; return <div key={assessment.id} className="flex items-center justify-between gap-3 px-4 py-2.5"><div><p className="text-xs font-bold text-stone-700">{student ? `${student.lastName}, ${student.firstName}` : "Unknown Student"}</p><p className="text-[10px] text-stone-500">{student?.studentNo} • {getAcademicLine(student, academicUnit)}</p></div><div className="text-right"><AppStatusBadge status={ASSESSMENT_APPROVAL_STATUS_CONFIG[status].label} /><p className="mt-1 text-[10px] font-mono text-stone-500">{formatMoney(assessment.balance)}</p></div></div>; })}</div></section>}
    </div>
  );
}

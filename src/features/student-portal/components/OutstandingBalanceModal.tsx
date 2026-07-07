/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react";
import { CreditCard, Receipt } from "lucide-react";
import AppModal from "../../../components/common/AppModal";
import AppEmptyState from "../../../components/common/AppEmptyState";
import type { StudentAssessment } from "../../../types";

export interface BalanceFeeRow {
  category: string;
  amount: number;
}

export interface BalanceInstallmentRow {
  label: string;
  amount: number;
  due: string;
  paid: boolean;
}

export interface BalancePaymentRow {
  id: string;
  orNumber: string;
  paymentDate: string;
  term: string;
  paymentMethod: string;
  amount: number;
  highlighted?: boolean;
}

interface LedgerLine {
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  status: string;
}

interface OutstandingBalanceModalProps {
  open: boolean;
  onClose: () => void;
  assessment?: StudentAssessment;
  ledgerFeesByCategory: BalanceFeeRow[];
  installmentSchedule: BalanceInstallmentRow[];
  paymentHistoryRows: BalancePaymentRow[];
  /** Effective outstanding balance (accounts for any settlement override on the page). */
  effectiveBalance: number;
  schoolName?: string;
}

const peso = (value: number) => `₱${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function OutstandingBalanceModal({
  open,
  onClose,
  assessment,
  ledgerFeesByCategory,
  installmentSchedule,
  paymentHistoryRows,
  effectiveBalance,
  schoolName,
}: OutstandingBalanceModalProps) {
  // Build an itemized ledger: assessed fees (debits) + discount + payments (credits),
  // with a running balance — derived entirely from the page's existing data.
  const ledgerLines = useMemo<LedgerLine[]>(() => {
    if (!assessment) return [];
    const lines: LedgerLine[] = [];
    let running = 0;

    for (const fee of ledgerFeesByCategory) {
      running += fee.amount;
      lines.push({
        date: assessment.schoolYear,
        description: `${fee.category} Fee`,
        debit: fee.amount,
        credit: 0,
        balance: running,
        status: "Billed",
      });
    }

    if (assessment.discountAmount > 0) {
      running -= assessment.discountAmount;
      lines.push({
        date: assessment.schoolYear,
        description: `Less: Discount${assessment.discountPercentage ? ` (${assessment.discountPercentage}%)` : ""}${assessment.scholarshipName ? ` — ${assessment.scholarshipName}` : ""}`,
        debit: 0,
        credit: assessment.discountAmount,
        balance: running,
        status: "Applied",
      });
    }

    for (const payment of paymentHistoryRows) {
      running -= payment.amount;
      lines.push({
        date: payment.paymentDate,
        description: `Payment — ${payment.paymentMethod}${payment.orNumber ? ` (${payment.orNumber})` : ""}`,
        debit: 0,
        credit: payment.amount,
        balance: Math.max(running, 0),
        status: payment.highlighted ? "Settled" : "Posted",
      });
    }

    return lines;
  }, [assessment, ledgerFeesByCategory, paymentHistoryRows]);

  const totalPaid = useMemo(
    () => paymentHistoryRows.reduce((sum, p) => sum + p.amount, 0),
    [paymentHistoryRows]
  );

  const isSettled = effectiveBalance <= 0;

  return (
    <AppModal
      open={open}
      onClose={onClose}
      icon={CreditCard}
      eyebrow="Student Financials"
      title="Outstanding Balance Details"
      maxWidthClass="max-w-3xl"
      bodyClassName="p-5 max-h-[75vh] overflow-y-auto"
    >
      {!assessment ? (
        <AppEmptyState
          icon={Receipt}
          title="No ledger records found for this student."
          description="Assessment and payment records will appear here once an assessment is issued and posted."
        />
      ) : (
        <div className="space-y-5">
          {/* Summary header */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <SummaryStat label="School Year" value={assessment.schoolYear || "—"} />
            <SummaryStat label="Term / Semester" value={assessment.semester || "—"} />
            <SummaryStat label="Payment Mode" value={assessment.paymentTerm || "—"} />
            <SummaryStat label="Total Assessed" value={peso(assessment.totalAmount)} />
            <SummaryStat label="Total Paid" value={peso(totalPaid)} valueClass="text-green-600" />
            <SummaryStat
              label="Remaining Balance"
              value={peso(Math.max(effectiveBalance, 0))}
              valueClass={isSettled ? "text-green-600" : "text-red-600"}
            />
          </div>

          <div className="flex items-center justify-between gap-2 flex-wrap">
            {schoolName && (
              <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">{schoolName}</span>
            )}
            <span
              className={`text-[9.5px] font-mono px-2.5 py-0.5 rounded-full uppercase font-bold border ${
                isSettled
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              {isSettled ? "Fully Paid" : "Outstanding Balance"}
            </span>
          </div>

          {/* Itemized ledger table */}
          <div>
            <h4 className="text-[11px] font-display font-bold text-stone-900 uppercase tracking-wider mb-2">
              Itemized Ledger
            </h4>
            <div className="overflow-x-auto rounded-xl border border-stone-200/70">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="bg-stone-50 text-stone-400 font-mono uppercase text-[9.5px]">
                    <th className="px-3 py-2 font-bold">Date</th>
                    <th className="px-3 py-2 font-bold">Description</th>
                    <th className="px-3 py-2 font-bold text-right">Debit</th>
                    <th className="px-3 py-2 font-bold text-right">Credit</th>
                    <th className="px-3 py-2 font-bold text-right">Balance</th>
                    <th className="px-3 py-2 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {ledgerLines.map((line, idx) => (
                    <tr key={idx} className="text-stone-700">
                      <td className="px-3 py-2 whitespace-nowrap text-stone-500">{line.date}</td>
                      <td className="px-3 py-2 font-medium text-stone-900">{line.description}</td>
                      <td className="px-3 py-2 text-right font-mono">{line.debit ? peso(line.debit) : "—"}</td>
                      <td className="px-3 py-2 text-right font-mono text-green-600">
                        {line.credit ? peso(line.credit) : "—"}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-stone-900">{peso(line.balance)}</td>
                      <td className="px-3 py-2">
                        <span className="text-[9px] font-mono font-bold uppercase text-stone-500">{line.status}</span>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-stone-50 font-bold text-stone-950">
                    <td className="px-3 py-2.5" colSpan={4}>
                      Remaining Balance
                    </td>
                    <td className={`px-3 py-2.5 text-right font-mono ${isSettled ? "text-green-600" : "text-red-600"}`}>
                      {peso(Math.max(effectiveBalance, 0))}
                    </td>
                    <td className="px-3 py-2.5" />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Installment due schedule */}
          {installmentSchedule.length > 0 && (
            <div>
              <h4 className="text-[11px] font-display font-bold text-stone-900 uppercase tracking-wider mb-2">
                Installment Due Schedule
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {installmentSchedule.map((item) => (
                  <div key={item.label} className="p-3 bg-stsn-cream/40 rounded-xl border border-stsn-beige/50 space-y-1">
                    <div className="flex justify-between text-stone-900 font-bold text-[11px]">
                      <span>{item.label}</span>
                      <span className={item.paid ? "text-green-600" : "text-amber-700"}>{peso(item.amount)}</span>
                    </div>
                    <div className="flex justify-between text-[9px] text-stone-400 font-mono">
                      <span>Due: {item.due}</span>
                      <span className={`font-bold uppercase ${item.paid ? "text-green-600" : "text-amber-700"}`}>
                        {item.paid ? "Paid" : "Outstanding"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </AppModal>
  );
}

function SummaryStat({ label, value, valueClass = "text-stone-900" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/60">
      <span className="text-[9px] font-mono uppercase tracking-wider text-stone-400 font-bold block">{label}</span>
      <span className={`text-sm font-display font-bold mt-0.5 block ${valueClass}`}>{value}</span>
    </div>
  );
}

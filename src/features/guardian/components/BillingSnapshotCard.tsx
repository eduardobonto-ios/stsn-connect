import React from "react";
import { CreditCard, ShieldAlert } from "lucide-react";
import AppCard from "../../../components/common/AppCard";
import AppEmptyState from "../../../components/common/AppEmptyState";
import type { StudentAssessment } from "../../../types";

interface BillingSnapshotCardProps {
  latestAssessment?: StudentAssessment;
  totalPaid: number;
  paymentCount: number;
  activeHoldCount: number;
}

export default function BillingSnapshotCard({
  latestAssessment,
  totalPaid,
  paymentCount,
  activeHoldCount,
}: BillingSnapshotCardProps) {
  return (
    <AppCard tone="brand">
      <div className="flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-emerald-600" />
        <h3 className="text-sm font-bold text-stone-900">Finance Snapshot</h3>
      </div>

      {!latestAssessment ? (
        <AppEmptyState
          icon={CreditCard}
          title="No assessment on record"
          description="Billing information will appear here once an assessment has been posted for this child."
          compact
          tone="brand"
          className="px-0 py-8"
        />
      ) : (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-stone-200 bg-white px-4 py-3">
              <p className="text-[10px] font-mono uppercase text-stone-400">Net Assessment</p>
              <p className="mt-1 text-lg font-black text-stone-900">
                PHP {(latestAssessment.totalAmount - latestAssessment.discountAmount).toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white px-4 py-3">
              <p className="text-[10px] font-mono uppercase text-stone-400">Outstanding Balance</p>
              <p className={`mt-1 text-lg font-black ${latestAssessment.balance > 0 ? "text-red-600" : "text-emerald-700"}`}>
                PHP {latestAssessment.balance.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-stone-200 bg-white px-4 py-3">
              <p className="text-[10px] font-mono uppercase text-stone-400">Posted Payments</p>
              <p className="mt-1 text-lg font-black text-blue-700">PHP {totalPaid.toLocaleString()}</p>
              <p className="mt-1 text-[10px] text-stone-500">{paymentCount} receipt record{paymentCount !== 1 ? "s" : ""}</p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white px-4 py-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                <p className="text-[10px] font-mono uppercase text-stone-400">Financial Holds</p>
              </div>
              <p className="mt-1 text-lg font-black text-stone-900">{activeHoldCount}</p>
              <p className="mt-1 text-[10px] text-stone-500">Store-backed hold records affecting this child.</p>
            </div>
          </div>
        </div>
      )}
    </AppCard>
  );
}

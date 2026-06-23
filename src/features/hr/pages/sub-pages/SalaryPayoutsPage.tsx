/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { Wallet, ChevronRight, X, CheckCircle } from "lucide-react";
import { useSTSNStore } from "../../../../services/store";
import { useAppDialog } from "../../../../components/common/useAppDialog";
import STSNDataTable, { type STSNColumn } from "../../../../components/common/STSNDataTable";
import { SalaryPayoutBatch, SalaryPayoutLine } from "../../../../types";

const BATCH_STATUS_COLORS: Record<string, string> = {
  Pending: "bg-stone-100 text-stone-500",
  Queued: "bg-blue-100 text-blue-700",
  Released: "bg-emerald-100 text-emerald-700",
  Failed: "bg-red-100 text-red-700",
  Cancelled: "bg-stone-100 text-stone-400",
};

const METHOD_COLORS: Record<string, string> = {
  "Bank Transfer": "bg-blue-50 text-blue-600",
  Cash: "bg-emerald-50 text-emerald-600",
  Check: "bg-amber-50 text-amber-700",
};

interface BatchDetailProps {
  batch: SalaryPayoutBatch;
  onClose: () => void;
  onRelease: (batchId: string) => void;
}

function BatchDetail({ batch, onClose, onRelease }: BatchDetailProps) {
  const { salaryPayoutLines, employees, payrollLines } = useSTSNStore();

  const batchLines = salaryPayoutLines.filter((l) => l.payoutBatchId === batch.id);
  const employeeMap = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);
  const payrollLineMap = useMemo(() => new Map(payrollLines.map((p) => [p.id, p])), [payrollLines]);

  const totalAmount = batchLines.reduce((sum, l) => sum + l.amount, 0);

  const lineColumns: STSNColumn<SalaryPayoutLine>[] = [
    {
      title: "Employee",
      render: (_, row) => {
        const e = employeeMap.get(row.employeeId);
        return e ? <span className="text-xs font-semibold text-stone-800">{e.firstName} {e.lastName}</span> : <span className="text-xs text-stone-400">—</span>;
      },
    },
    { title: "Amount", data: "amount", render: (v) => <span className="font-mono text-xs font-semibold text-emerald-700">₱{Number(v).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>, width: "110px" },
    { title: "Reference #", data: "referenceNo", render: (v) => <span className="font-mono text-xs text-stone-500">{v ?? "—"}</span> },
    {
      title: "Status",
      data: "status",
      render: (v) => <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${BATCH_STATUS_COLORS[v] ?? "bg-gray-100 text-gray-600"}`}>{v}</span>,
      width: "90px",
    },
  ];

  return (
    <div className="bg-white border border-stsn-beige rounded-xl shadow-sm flex flex-col h-full">
      <div className="p-4 border-b border-stone-100 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-stone-800">Payout #{batch.payoutNo}</p>
          <p className="text-xs text-stone-500">{batch.payoutMethod} · {batchLines.length} recipient(s)</p>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-stone-100 rounded-lg cursor-pointer"><X className="w-4 h-4 text-stone-400" /></button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {batchLines.length > 0 ? (
          <STSNDataTable<SalaryPayoutLine>
            columns={lineColumns}
            rows={batchLines}
            emptyMessage="No payout lines."
            pageLength={10}
          />
        ) : (
          <div className="p-8 text-center text-xs text-stone-400">No payout lines in this batch.</div>
        )}
      </div>
      <div className="p-4 border-t border-stone-100 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs text-stone-500">Total Payout</span>
          <span className="text-sm font-bold text-emerald-700 font-mono">₱{totalAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
        </div>
        {(batch.status === "Pending" || batch.status === "Queued") && (
          <button
            onClick={() => onRelease(batch.id)}
            className="w-full btn-primary-gradient text-white text-xs font-semibold py-2 rounded-lg cursor-pointer flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" /> Release Payout
          </button>
        )}
      </div>
    </div>
  );
}

export default function SalaryPayoutsPage() {
  const { salaryPayoutBatches, releaseSalaryPayoutBatch, currentUser } = useSTSNStore();
  const { toast } = useAppDialog();

  const [selectedBatch, setSelectedBatch] = useState<SalaryPayoutBatch | null>(null);
  const [filterStatus, setFilterStatus] = useState("All");

  const filtered = useMemo(() => {
    let batches = [...salaryPayoutBatches];
    if (filterStatus !== "All") batches = batches.filter((b) => b.status === filterStatus);
    return batches.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  }, [salaryPayoutBatches, filterStatus]);

  const pendingCount = useMemo(() => salaryPayoutBatches.filter((b) => b.status === "Pending" || b.status === "Queued").length, [salaryPayoutBatches]);

  const batchColumns: STSNColumn<SalaryPayoutBatch>[] = [
    { title: "Payout #", data: "payoutNo", render: (v) => <span className="font-mono text-xs font-bold text-stsn-brown">{v}</span>, width: "90px" },
    {
      title: "Method",
      data: "payoutMethod",
      render: (v) => <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${METHOD_COLORS[v] ?? "bg-gray-100 text-gray-600"}`}>{v}</span>,
      width: "110px",
    },
    {
      title: "Status",
      data: "status",
      render: (v) => <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${BATCH_STATUS_COLORS[v] ?? "bg-gray-100 text-gray-600"}`}>{v}</span>,
      width: "90px",
    },
    { title: "Released By", data: "releasedBy", render: (v) => <span className="text-xs text-stone-500">{v ?? "—"}</span> },
    { title: "Released At", data: "releasedAt", render: (v) => <span className="font-mono text-xs text-stone-500">{v ? v.split("T")[0] : "—"}</span>, width: "100px" },
    { title: "Notes", data: "notes", render: (v) => <span className="text-xs text-stone-400 truncate">{v ?? "—"}</span> },
    {
      title: "",
      orderable: false,
      searchable: false,
      render: (_, row) => (
        <button onClick={(e) => { e.stopPropagation(); setSelectedBatch(row); }} className="p-1 hover:bg-stsn-cream rounded cursor-pointer">
          <ChevronRight className="w-4 h-4 text-stone-400" />
        </button>
      ),
      width: "40px",
    },
  ];

  const handleRelease = (batchId: string) => {
    releaseSalaryPayoutBatch(batchId, currentUser?.name ?? "HR");
    toast("Payout batch released successfully.");
    setSelectedBatch((prev) => prev?.id === batchId ? { ...prev, status: "Released", releasedBy: currentUser?.name ?? "HR", releasedAt: new Date().toISOString() } : prev);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-white border border-stsn-beige rounded-xl shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-display font-semibold text-stone-900 tracking-tight flex items-center gap-2">
            <Wallet className="w-5 h-5 text-stsn-brown" />
            Salary Payouts
          </h2>
          <p className="text-stone-500 text-xs mt-1">Track payout batches and payment release status.</p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full font-semibold">{pendingCount} pending release{pendingCount > 1 ? "s" : ""}</span>
          )}
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-1 bg-stone-100 p-1 rounded-xl w-fit">
        {["All", "Pending", "Queued", "Released", "Failed", "Cancelled"].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${filterStatus === s ? "bg-white text-stsn-brown shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className={`flex gap-4 ${selectedBatch ? "flex-col lg:flex-row" : ""}`}>
        <div className={`${selectedBatch ? "lg:flex-1" : "w-full"} bg-white border border-stsn-beige rounded-xl shadow-sm overflow-hidden p-1`}>
          <STSNDataTable<SalaryPayoutBatch>
            columns={batchColumns}
            rows={filtered}
            emptyMessage="No payout batches found."
            pageLength={15}
            onRowClick={(row) => setSelectedBatch(row)}
            selectedId={selectedBatch?.id}
          />
        </div>

        {selectedBatch && (
          <div className="lg:w-96 flex-shrink-0">
            <BatchDetail
              batch={selectedBatch}
              onClose={() => setSelectedBatch(null)}
              onRelease={handleRelease}
            />
          </div>
        )}
      </div>
    </div>
  );
}

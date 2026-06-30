/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { Wallet, ChevronRight, X, CheckCircle } from "lucide-react";
import { useSTSNStore } from "../../../../services/store";
import { useAppDialog } from "../../../../components/common/useAppDialog";
import AppButton from "../../../../components/common/AppButton";
import AppCard from "../../../../components/common/AppCard";
import AppStatusBadge from "../../../../components/common/AppStatusBadge";
import AppTable, {
  appTableColumnsFromLegacy,
  type AppTableLegacyColumn,
} from "../../../../components/common/AppTable";
import AppTabs from "../../../../components/common/AppTabs";
import { SalaryPayoutBatch, SalaryPayoutLine } from "../../../../types";

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

  const lineColumns: AppTableLegacyColumn<SalaryPayoutLine>[] = [
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
      render: (v) => <AppStatusBadge status={String(v)} className="text-[10px]" />,
      width: "90px",
    },
  ];

  return (
    <AppCard className="border border-stsn-beige flex h-full flex-col" padded={false}>
      <div className="p-4 border-b border-stone-100 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-stone-800">Payout #{batch.payoutNo}</p>
          <p className="text-xs text-stone-500">{batch.payoutMethod} · {batchLines.length} recipient(s)</p>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-stone-100 rounded-lg cursor-pointer"><X className="w-4 h-4 text-stone-400" /></button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {batchLines.length > 0 ? (
          <AppTable<SalaryPayoutLine>
            columns={appTableColumnsFromLegacy(lineColumns)}
            data={batchLines}
            emptyMessage="No payout lines."
            loading={false}
            initialPageSize={10}
            pageSizeOptions={[10]}
            compact
            getRowId={(row) => row.id}
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
          <AppButton
            onClick={() => onRelease(batch.id)}
            variant="primary"
            size="sm"
            fullWidth
            leftIcon={CheckCircle}
          >
            Release Payout
          </AppButton>
        )}
      </div>
    </AppCard>
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
  const statusTabItems = useMemo(
    () => ["All", "Pending", "Queued", "Released", "Failed", "Cancelled"].map((status) => ({ value: status, label: status })),
    [],
  );

  const batchColumns: AppTableLegacyColumn<SalaryPayoutBatch>[] = [
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
      render: (v) => <AppStatusBadge status={String(v)} className="text-[10px]" />,
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
      <AppCard className="border border-stsn-beige sm:flex sm:items-center sm:justify-between">
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
      </AppCard>

      <div className={`flex gap-4 ${selectedBatch ? "flex-col lg:flex-row" : ""}`}>
        <AppTable<SalaryPayoutBatch>
          title="Salary Payout Batches"
          enableSearch={false}
          toolbar={
            <AppTabs
              items={statusTabItems}
              value={filterStatus}
              onChange={setFilterStatus}
              variant="pill"
              className="border-none bg-transparent shadow-none"
              tabsClassName="p-0"
            />
          }
          className={selectedBatch ? "lg:flex-1" : "w-full"}
          data={filtered}
          columns={appTableColumnsFromLegacy(batchColumns)}
          emptyMessage="No payout batches found."
          loading={false}
          initialPageSize={15}
          pageSizeOptions={[15]}
          getRowId={(row) => row.id}
          onRowClick={(row) => setSelectedBatch(row)}
          selectedRowId={selectedBatch?.id}
        />

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

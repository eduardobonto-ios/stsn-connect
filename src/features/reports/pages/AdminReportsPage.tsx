import React, { useMemo, useState } from "react";
import { FileText, Filter, ShieldCheck } from "lucide-react";
import AppCard from "../../../components/common/AppCard";
import AppSearchInput from "../../../components/common/AppSearchInput";
import AppSelect from "../../../components/common/AppSelect";
import ModulePageHeader from "../../../components/common/ModulePageHeader";
import { useSTSNStore } from "../../../services/store";
import ReportExportButtons from "../components/ReportExportButtons";
import ReportPreviewModal from "../components/ReportPreviewModal";
import ReportTable from "../components/ReportTable";
import { ADMIN_REPORTS, type AdminReportContext } from "../data/adminReports";

const STATUS_OPTIONS = ["Active", "Inactive"];

export default function AdminReportsPage() {
  const { users } = useSTSNStore();
  const [activeReportId, setActiveReportId] = useState(ADMIN_REPORTS[0].id);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const activeReport = ADMIN_REPORTS.find((report) => report.id === activeReportId) ?? ADMIN_REPORTS[0];
  const context: AdminReportContext = useMemo(() => ({ users }), [users]);
  const rows = useMemo(
    () => activeReport.buildRows(context, search, statusFilter),
    [activeReport, context, search, statusFilter],
  );

  const showStatusFilter = activeReport.id === "user-access-report";

  const handleSwitchReport = (id: string) => {
    setActiveReportId(id);
    setSearch("");
    setStatusFilter("All");
  };

  return (
    <div className="space-y-5">
      <ModulePageHeader
        badge="Admin Reports"
        badgeIcon={FileText}
        title="User Access, Logs, and System Audit Reports"
        subtitle="Generate Admin reports covering user access, login history, activity logs, and data export records."
        actions={
          <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5">
            <ShieldCheck className="h-4 w-4 flex-shrink-0 text-emerald-400" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wide leading-none text-white">
                Access Controlled
              </p>
              <p className="mt-0.5 text-[10px] text-white/55">Visible only to Super Admin.</p>
            </div>
          </div>
        }
      />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {ADMIN_REPORTS.map((report) => {
          const isActive = report.id === activeReport.id;
          return (
            <button
              key={report.id}
              type="button"
              onClick={() => handleSwitchReport(report.id)}
              className={`rounded-2xl border p-4 text-left shadow-sm transition ${
                isActive
                  ? "border-[var(--erp-brand)] bg-[linear-gradient(180deg,#11233f_0%,#173154_100%)] text-white"
                  : "border-[var(--erp-border)] bg-white text-[var(--erp-text)] hover:bg-[var(--erp-surface-muted)]"
              }`}
            >
              <p className={`text-sm font-semibold ${isActive ? "text-[var(--erp-accent)]" : "text-[var(--erp-brand)]"}`}>
                {report.title}
              </p>
              <p className={`mt-1 line-clamp-2 text-xs leading-relaxed ${isActive ? "text-white/72" : "text-[var(--erp-text-muted)]"}`}>
                {report.description}
              </p>
            </button>
          );
        })}
      </section>

      <AppCard tone="brand" className="border border-[var(--erp-border)]">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--erp-border)] bg-white shadow-sm">
              <Filter className="h-4 w-4 text-[var(--erp-brand)]" />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
                Report Filters
              </p>
              <h3 className="mt-1 text-base font-semibold text-[var(--erp-text)]">Admin report controls</h3>
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--erp-border)] bg-white px-4 py-3 shadow-sm">
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
              Visible Rows
            </p>
            <p className="mt-1 text-lg font-semibold text-[var(--erp-text)]">{rows.length}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className={showStatusFilter ? "md:col-span-2" : "md:col-span-3"}>
            <span className="mb-1 block text-[10px] font-mono uppercase text-[var(--erp-text-muted)]">
              Search
            </span>
            <AppSearchInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name, email, role, department..."
              uiSize="sm"
            />
          </div>
          {showStatusFilter && (
            <div>
              <span className="mb-1 block text-[10px] font-mono uppercase text-[var(--erp-text-muted)]">
                Account Status
              </span>
              <AppSelect value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} uiSize="sm">
                <option value="All">All</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </AppSelect>
            </div>
          )}
        </div>
      </AppCard>

      <AppCard tone="brand" className="border border-[var(--erp-border)] lg:flex lg:items-center lg:justify-between">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
            Active Report
          </p>
          <h2 className="text-lg font-semibold text-[var(--erp-text)]">{activeReport.title}</h2>
          <p className="text-xs text-[var(--erp-text-muted)]">
            {rows.length === 0
              ? activeReport.id === "user-access-report"
                ? "No users match the selected filters."
                : "No data available - logging not yet enabled."
              : `${rows.length} row${rows.length === 1 ? "" : "s"} ready`}
          </p>
        </div>
        <ReportExportButtons
          title={activeReport.title}
          columns={activeReport.columns}
          rows={rows}
          onPreview={() => setIsPreviewOpen(true)}
        />
      </AppCard>

      <ReportTable columns={activeReport.columns} rows={rows} />

      {isPreviewOpen && (
        <ReportPreviewModal
          title={activeReport.title}
          columns={activeReport.columns}
          rows={rows}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}
    </div>
  );
}

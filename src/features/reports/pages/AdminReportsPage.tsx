import React, { useMemo, useState } from "react";
import { FileText, Filter, Search, ShieldCheck } from "lucide-react";
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

  const activeReport = ADMIN_REPORTS.find((r) => r.id === activeReportId) ?? ADMIN_REPORTS[0];

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
          <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wide leading-none">Access Controlled</p>
              <p className="text-[10px] text-white/55 mt-0.5">Visible only to Super Admin.</p>
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
              className={`rounded-xl border p-4 text-left shadow-sm transition ${
                isActive
                  ? "border-stsn-gold bg-stsn-brown text-white"
                  : "border-stsn-beige bg-white text-stone-700 hover:bg-stsn-cream"
              }`}
            >
              <p className={`text-sm font-black ${isActive ? "text-stsn-gold-light" : "text-stsn-brown"}`}>
                {report.title}
              </p>
              <p className={`mt-1 line-clamp-2 text-xs leading-relaxed ${isActive ? "text-stone-200" : "text-stone-500"}`}>
                {report.description}
              </p>
            </button>
          );
        })}
      </section>

      <section className="bg-white border border-stsn-beige rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-stsn-gold" />
          <h3 className="text-sm font-black text-stsn-brown uppercase">Report Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className={showStatusFilter ? "md:col-span-2" : "md:col-span-3"}>
            <span className="block text-[10px] uppercase font-mono text-stone-400 mb-1">Search</span>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-stone-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-stsn-beige bg-white pl-8 pr-3 py-2 text-xs font-semibold text-stone-700 outline-none focus:border-stsn-gold"
                placeholder="Name, email, role, department..."
              />
            </div>
          </div>
          {showStatusFilter && (
            <div>
              <span className="block text-[10px] uppercase font-mono text-stone-400 mb-1">Account Status</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border border-stsn-beige bg-white px-3 py-2 text-xs font-semibold text-stone-700 outline-none focus:border-stsn-gold"
              >
                <option value="All">All</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-stsn-beige bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-stone-400">Active Report</p>
          <h2 className="text-lg font-black text-stsn-brown">{activeReport.title}</h2>
          <p className="text-xs text-stone-500">
            {rows.length === 0
              ? activeReport.id === "user-access-report"
                ? "No users match the selected filters."
                : "No data available — logging not yet enabled."
              : `${rows.length} row${rows.length === 1 ? "" : "s"} ready`}
          </p>
        </div>
        <ReportExportButtons
          title={activeReport.title}
          columns={activeReport.columns}
          rows={rows}
          onPreview={() => setIsPreviewOpen(true)}
        />
      </section>

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

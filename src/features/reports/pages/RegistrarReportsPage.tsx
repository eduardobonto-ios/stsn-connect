import React, { useMemo, useState } from "react";
import { FileText, ShieldCheck } from "lucide-react";
import { useSTSNStore } from "../../../services/store";
import ReportExportButtons from "../components/ReportExportButtons";
import ReportFilterPanel from "../components/ReportFilterPanel";
import ReportPreviewModal from "../components/ReportPreviewModal";
import ReportTable from "../components/ReportTable";
import { buildRegistrarFilterRows, REGISTRAR_REPORTS } from "../data/registrarReports";
import { DEFAULT_REPORT_FILTERS } from "../types";

export default function RegistrarReportsPage() {
  const { students, enrollments, requirements, sections } = useSTSNStore();
  const [activeReportId, setActiveReportId] = useState(REGISTRAR_REPORTS[0].id);
  const [filters, setFilters] = useState(DEFAULT_REPORT_FILTERS);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const activeReport = REGISTRAR_REPORTS.find((report) => report.id === activeReportId) ?? REGISTRAR_REPORTS[0];
  const context = useMemo(
    () => ({ students, enrollments, requirements, sections }),
    [students, enrollments, requirements, sections],
  );
  const filterRows = useMemo(() => buildRegistrarFilterRows(context), [context]);
  const rows = useMemo(() => activeReport.buildRows(context, filters), [activeReport, context, filters]);

  return (
    <div className="space-y-5">
      <section className="bg-white border border-stsn-beige rounded-xl p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-stsn-cream text-stsn-brown border border-stsn-beige">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-stone-400">Registrar Reports</p>
                <h1 className="text-2xl font-black text-stsn-brown">Enrollment and Student Records Reports</h1>
              </div>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-stone-600">
              Generate Registrar reports from shared filters, tables, preview, print, CSV, Excel, and PDF actions.
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
            <div className="flex items-center gap-2 text-xs font-black uppercase">
              <ShieldCheck className="h-4 w-4" />
              Access Controlled
            </div>
            <p className="mt-1 text-xs">Visible only to roles with Registrar Reports permission.</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-5">
        {REGISTRAR_REPORTS.map((report) => {
          const isActive = report.id === activeReport.id;
          return (
            <button
              key={report.id}
              type="button"
              onClick={() => {
                setActiveReportId(report.id);
                setFilters(DEFAULT_REPORT_FILTERS);
              }}
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

      <ReportFilterPanel filters={filters} rows={filterRows} onChange={setFilters} />

      <section className="flex flex-col gap-3 rounded-xl border border-stsn-beige bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-stone-400">Active Report</p>
          <h2 className="text-lg font-black text-stsn-brown">{activeReport.title}</h2>
          <p className="text-xs text-stone-500">{rows.length} row{rows.length === 1 ? "" : "s"} ready</p>
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

import React, { useMemo, useState } from "react";
import { FileText, ShieldCheck } from "lucide-react";
import AppCard from "../../../components/common/AppCard";
import ModulePageHeader from "../../../components/common/ModulePageHeader";
import { getAcademicScopedData } from "../../../services/academicUnitScopeService";
import { useSTSNStore } from "../../../services/store";
import ReportExportButtons from "../components/ReportExportButtons";
import ReportFilterPanel from "../components/ReportFilterPanel";
import ReportPreviewModal from "../components/ReportPreviewModal";
import ReportTable from "../components/ReportTable";
import { buildRegistrarFilterRows, REGISTRAR_REPORTS } from "../data/registrarReports";
import { DEFAULT_REPORT_FILTERS } from "../types";

export default function RegistrarReportsPage() {
  const { students, enrollments, requirements, sections, currentUser, activeSchool, academicUnit } =
    useSTSNStore();
  const [activeReportId, setActiveReportId] = useState(REGISTRAR_REPORTS[0].id);
  const [filters, setFilters] = useState(DEFAULT_REPORT_FILTERS);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const activeReport =
    REGISTRAR_REPORTS.find((report) => report.id === activeReportId) ?? REGISTRAR_REPORTS[0];
  const scopedData = useMemo(
    () =>
      getAcademicScopedData({
        currentUser,
        activeSchool,
        academicUnit,
        students,
        enrollments,
        requirements,
        sections,
      }),
    [currentUser, activeSchool, academicUnit, students, enrollments, requirements, sections],
  );
  const context = useMemo(
    () => ({
      students: scopedData.students,
      enrollments: scopedData.enrollments ?? [],
      requirements: scopedData.requirements ?? [],
      sections: scopedData.sections ?? [],
    }),
    [scopedData],
  );
  const filterRows = useMemo(() => buildRegistrarFilterRows(context), [context]);
  const rows = useMemo(() => activeReport.buildRows(context, filters), [activeReport, context, filters]);

  return (
    <div className="space-y-5">
      <ModulePageHeader
        badge="Registrar Reports"
        badgeIcon={FileText}
        title="Enrollment and Student Records Reports"
        subtitle="Generate Registrar reports from shared filters, tables, preview, print, CSV, Excel, and PDF actions."
        actions={
          <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5">
            <ShieldCheck className="h-4 w-4 flex-shrink-0 text-emerald-400" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wide leading-none text-white">
                Access Controlled
              </p>
              <p className="mt-0.5 text-[10px] text-white/55">Registrar Reports permission required.</p>
            </div>
          </div>
        }
      />

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

      <ReportFilterPanel filters={filters} rows={filterRows} onChange={setFilters} />

      <AppCard tone="brand" className="border border-[var(--erp-border)] lg:flex lg:items-center lg:justify-between">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
            Active Report
          </p>
          <h2 className="text-lg font-semibold text-[var(--erp-text)]">{activeReport.title}</h2>
          <p className="text-xs text-[var(--erp-text-muted)]">
            {rows.length} row{rows.length === 1 ? "" : "s"} ready
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

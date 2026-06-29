import React, { useEffect, useMemo, useState } from "react";
import { FileText, Filter, ShieldCheck } from "lucide-react";
import AppCard from "../../../components/common/AppCard";
import AppErrorState from "../../../components/common/AppErrorState";
import AppLoadingState from "../../../components/common/AppLoadingState";
import AppSearchInput from "../../../components/common/AppSearchInput";
import AppSelect from "../../../components/common/AppSelect";
import ModulePageHeader from "../../../components/common/ModulePageHeader";
import { filterStudentLinkedRecords, getAcademicScopedData } from "../../../services/academicUnitScopeService";
import { dbSelectAll } from "../../../services/supabaseCrud";
import { useSTSNStore } from "../../../services/store";
import ReportExportButtons from "../components/ReportExportButtons";
import ReportPreviewModal from "../components/ReportPreviewModal";
import ReportTable from "../components/ReportTable";
import {
  GUIDANCE_REPORTS,
  INCIDENT_TYPES,
  SESSION_STATUSES,
  type AnecdotalRecord,
  type GuidanceReportContext,
  type GuidanceSession,
} from "../data/guidanceReports";

export default function GuidanceReportsPage() {
  const { students, currentUser, activeSchool, academicUnit } = useSTSNStore();
  const [activeReportId, setActiveReportId] = useState(GUIDANCE_REPORTS[0].id);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [records, setRecords] = useState<AnecdotalRecord[]>([]);
  const [sessions, setSessions] = useState<GuidanceSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadGuidanceData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [aRows, sRows] = await Promise.all([
        dbSelectAll<any>("anecdotal_records"),
        dbSelectAll<any>("guidance_sessions"),
      ]);
      setRecords(
        aRows.map((row: any) => ({
          id: row.id,
          studentId: row.studentId,
          recordDate: row.recordDate ?? "",
          incidentType: row.incidentType ?? "Other",
          description: row.description ?? "",
          actionTaken: row.actionTaken ?? "",
          reportedBy: row.reportedBy ?? "",
          followUpDate: row.followUpDate ?? "",
          followUpDone: row.followUpDone ?? false,
          isConfidential: row.isConfidential ?? false,
        })),
      );
      setSessions(
        sRows.map((row: any) => ({
          id: row.id,
          studentId: row.studentId,
          sessionDate: row.sessionDate ?? "",
          sessionType: row.sessionType ?? "Individual",
          concernArea: row.concernArea ?? "Other",
          summary: row.summary ?? "",
          recommendations: row.recommendations ?? "",
          nextSession: row.nextSession ?? "",
          counselorName: row.counselorName ?? "",
          isConfidential: row.isConfidential ?? true,
          status: row.status ?? "Completed",
        })),
      );
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load guidance report data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadGuidanceData();
  }, []);

  const scopedStudents = useMemo(
    () => getAcademicScopedData({ currentUser, activeSchool, academicUnit, students }).students,
    [currentUser, activeSchool, academicUnit, students],
  );
  const scopedRecords = useMemo(() => filterStudentLinkedRecords(records, scopedStudents), [records, scopedStudents]);
  const scopedSessions = useMemo(() => filterStudentLinkedRecords(sessions, scopedStudents), [sessions, scopedStudents]);

  const activeReport = GUIDANCE_REPORTS.find((report) => report.id === activeReportId) ?? GUIDANCE_REPORTS[0];

  const isSessionsReport =
    activeReport.id === "counseling-sessions-report" || activeReport.id === "parent-conference-report";

  const typeOptions = isSessionsReport ? SESSION_STATUSES : INCIDENT_TYPES;
  const typeLabel = isSessionsReport ? "Session Status" : "Incident Type";

  const context: GuidanceReportContext = useMemo(
    () => ({ students: scopedStudents, records: scopedRecords, sessions: scopedSessions }),
    [scopedStudents, scopedRecords, scopedSessions],
  );

  const rows = useMemo(
    () => activeReport.buildRows(context, search, typeFilter),
    [activeReport, context, search, typeFilter],
  );

  const handleSwitchReport = (id: string) => {
    setActiveReportId(id);
    setSearch("");
    setTypeFilter("All");
  };

  return (
    <div className="space-y-5">
      <ModulePageHeader
        badge="Guidance Reports"
        badgeIcon={FileText}
        title="Counseling, Incidents, and Conference Reports"
        subtitle="Generate Guidance reports from anecdotal records, counseling sessions, incident summaries, and parent conference logs."
        actions={
          <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5">
            <ShieldCheck className="h-4 w-4 flex-shrink-0 text-emerald-400" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wide leading-none text-white">
                Access Controlled
              </p>
              <p className="mt-0.5 text-[10px] text-white/55">Guidance Reports permission required.</p>
            </div>
          </div>
        }
      />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {GUIDANCE_REPORTS.map((report) => {
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
              <h3 className="mt-1 text-base font-semibold text-[var(--erp-text)]">Guidance report controls</h3>
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--erp-border)] bg-white px-4 py-3 shadow-sm">
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
              Loaded Records
            </p>
            <p className="mt-1 text-lg font-semibold text-[var(--erp-text)]">
              {records.length + sessions.length}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="md:col-span-2">
            <span className="mb-1 block text-[10px] font-mono uppercase text-[var(--erp-text-muted)]">
              Search
            </span>
            <AppSearchInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Student name, keyword..."
              uiSize="sm"
            />
          </div>
          <div>
            <span className="mb-1 block text-[10px] font-mono uppercase text-[var(--erp-text-muted)]">
              {typeLabel}
            </span>
            <AppSelect value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} uiSize="sm">
              <option value="All">All</option>
              {typeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </AppSelect>
          </div>
        </div>
      </AppCard>

      {isLoading ? (
        <AppLoadingState
          title="Loading guidance report data"
          description="Preparing counseling and anecdotal report sources."
        />
      ) : loadError ? (
        <AppErrorState description={loadError} onRetry={() => void loadGuidanceData()} retryLabel="Reload guidance data" />
      ) : (
        <>
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
        </>
      )}

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

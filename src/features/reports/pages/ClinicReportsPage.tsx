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
  CLINIC_REPORTS,
  DISPOSITIONS,
  type ClinicReportContext,
  type ClinicVisit,
  type HealthProfile,
} from "../data/clinicReports";

export default function ClinicReportsPage() {
  const { students, currentUser, activeSchool, academicUnit } = useSTSNStore();
  const [activeReportId, setActiveReportId] = useState(CLINIC_REPORTS[0].id);
  const [search, setSearch] = useState("");
  const [dispositionFilter, setDispositionFilter] = useState("All");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [visits, setVisits] = useState<ClinicVisit[]>([]);
  const [profiles, setProfiles] = useState<HealthProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadClinicData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [visitRows, profileRows] = await Promise.all([
        dbSelectAll<any>("clinic_visits"),
        dbSelectAll<any>("student_health_profiles"),
      ]);
      setVisits(
        visitRows.map((row: any) => ({
          id: row.id,
          studentId: row.studentId,
          visitDate: row.visitDate ?? "",
          visitTime: row.visitTime ?? "",
          chiefComplaint: row.chiefComplaint ?? "",
          vitalSigns: row.vitalSigns ?? {},
          actionTaken: row.actionTaken ?? "",
          disposition: row.disposition ?? "Released",
          recordedBy: row.recordedBy ?? "",
          notes: row.notes ?? "",
        })),
      );
      setProfiles(
        profileRows.map((row: any) => ({
          id: row.id,
          studentId: row.studentId,
          bloodType: row.bloodType ?? "",
          allergies: row.allergies ?? [],
          chronicConditions: row.chronicConditions ?? [],
          emergencyContact: row.emergencyContact ?? "",
          emergencyPhone: row.emergencyPhone ?? "",
          physicianName: row.physicianName ?? "",
          philhealthNo: row.philhealthNo ?? "",
          notes: row.notes ?? "",
        })),
      );
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load clinic report data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadClinicData();
  }, []);

  const scopedStudents = useMemo(
    () => getAcademicScopedData({ currentUser, activeSchool, academicUnit, students }).students,
    [currentUser, activeSchool, academicUnit, students],
  );
  const scopedVisits = useMemo(() => filterStudentLinkedRecords(visits, scopedStudents), [visits, scopedStudents]);
  const scopedProfiles = useMemo(() => filterStudentLinkedRecords(profiles, scopedStudents), [profiles, scopedStudents]);

  const activeReport = CLINIC_REPORTS.find((report) => report.id === activeReportId) ?? CLINIC_REPORTS[0];

  const showDispositionFilter =
    activeReport.id === "clinic-visit-report" || activeReport.id === "medical-incident-report";

  const context: ClinicReportContext = useMemo(
    () => ({ students: scopedStudents, visits: scopedVisits, profiles: scopedProfiles }),
    [scopedStudents, scopedVisits, scopedProfiles],
  );

  const rows = useMemo(
    () => activeReport.buildRows(context, search, dispositionFilter),
    [activeReport, context, search, dispositionFilter],
  );

  const handleSwitchReport = (id: string) => {
    setActiveReportId(id);
    setSearch("");
    setDispositionFilter("All");
  };

  return (
    <div className="space-y-5">
      <ModulePageHeader
        badge="Clinic Reports"
        badgeIcon={FileText}
        title="Clinic Visits, Health Profiles, and Medical Incidents"
        subtitle="Generate Clinic reports from visit logs, student health profiles, medicine issuance records, and medical incident summaries."
        actions={
          <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5">
            <ShieldCheck className="h-4 w-4 flex-shrink-0 text-emerald-400" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wide leading-none text-white">
                Access Controlled
              </p>
              <p className="mt-0.5 text-[10px] text-white/55">Clinic Reports permission required.</p>
            </div>
          </div>
        }
      />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {CLINIC_REPORTS.map((report) => {
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
              <h3 className="mt-1 text-base font-semibold text-[var(--erp-text)]">Clinic report controls</h3>
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--erp-border)] bg-white px-4 py-3 shadow-sm">
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
              Loaded Records
            </p>
            <p className="mt-1 text-lg font-semibold text-[var(--erp-text)]">
              {visits.length + profiles.length}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className={showDispositionFilter ? "md:col-span-2" : "md:col-span-3"}>
            <span className="mb-1 block text-[10px] font-mono uppercase text-[var(--erp-text-muted)]">
              Search
            </span>
            <AppSearchInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Student name, complaint, keyword..."
              uiSize="sm"
            />
          </div>
          {showDispositionFilter && (
            <div>
              <span className="mb-1 block text-[10px] font-mono uppercase text-[var(--erp-text-muted)]">
                Disposition
              </span>
              <AppSelect
                value={dispositionFilter}
                onChange={(event) => setDispositionFilter(event.target.value)}
                uiSize="sm"
              >
                <option value="All">All</option>
                {DISPOSITIONS.map((disposition) => (
                  <option key={disposition} value={disposition}>
                    {disposition}
                  </option>
                ))}
              </AppSelect>
            </div>
          )}
        </div>
      </AppCard>

      {isLoading ? (
        <AppLoadingState
          title="Loading clinic report data"
          description="Preparing visit logs and student health profile records."
        />
      ) : loadError ? (
        <AppErrorState description={loadError} onRetry={() => void loadClinicData()} retryLabel="Reload clinic data" />
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

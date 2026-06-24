import React, { useEffect, useMemo, useState } from "react";
import { FileText, Filter, Search, ShieldCheck } from "lucide-react";
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

  useEffect(() => {
    Promise.all([
      dbSelectAll<any>("clinic_visits"),
      dbSelectAll<any>("student_health_profiles"),
    ]).then(([vRows, pRows]) => {
      setVisits(
        vRows.map((r: any) => ({
          id: r.id,
          studentId: r.studentId,
          visitDate: r.visitDate ?? "",
          visitTime: r.visitTime ?? "",
          chiefComplaint: r.chiefComplaint ?? "",
          vitalSigns: r.vitalSigns ?? {},
          actionTaken: r.actionTaken ?? "",
          disposition: r.disposition ?? "Released",
          recordedBy: r.recordedBy ?? "",
          notes: r.notes ?? "",
        })),
      );
      setProfiles(
        pRows.map((r: any) => ({
          id: r.id,
          studentId: r.studentId,
          bloodType: r.bloodType ?? "",
          allergies: r.allergies ?? [],
          chronicConditions: r.chronicConditions ?? [],
          emergencyContact: r.emergencyContact ?? "",
          emergencyPhone: r.emergencyPhone ?? "",
          physicianName: r.physicianName ?? "",
          philhealthNo: r.philhealthNo ?? "",
          notes: r.notes ?? "",
        })),
      );
    });
  }, []);

  const scopedStudents = useMemo(
    () => getAcademicScopedData({ currentUser, activeSchool, academicUnit, students }).students,
    [currentUser, activeSchool, academicUnit, students],
  );
  const scopedVisits = useMemo(
    () => filterStudentLinkedRecords(visits, scopedStudents),
    [visits, scopedStudents],
  );
  const scopedProfiles = useMemo(
    () => filterStudentLinkedRecords(profiles, scopedStudents),
    [profiles, scopedStudents],
  );

  const activeReport = CLINIC_REPORTS.find((r) => r.id === activeReportId) ?? CLINIC_REPORTS[0];

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
      <section className="bg-white border border-stsn-beige rounded-xl p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-stsn-cream text-stsn-brown border border-stsn-beige">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-stone-400">Clinic Reports</p>
                <h1 className="text-2xl font-black text-stsn-brown">Clinic Visits, Health Profiles, and Medical Incidents</h1>
              </div>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-stone-600">
              Generate Clinic reports from visit logs, student health profiles, medicine issuance records, and medical incident summaries.
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
            <div className="flex items-center gap-2 text-xs font-black uppercase">
              <ShieldCheck className="h-4 w-4" />
              Access Controlled
            </div>
            <p className="mt-1 text-xs">Visible only to roles with Clinic Reports permission.</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {CLINIC_REPORTS.map((report) => {
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
          <div className={showDispositionFilter ? "md:col-span-2" : "md:col-span-3"}>
            <span className="block text-[10px] uppercase font-mono text-stone-400 mb-1">Search</span>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-stone-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-stsn-beige bg-white pl-8 pr-3 py-2 text-xs font-semibold text-stone-700 outline-none focus:border-stsn-gold"
                placeholder="Student name, complaint, keyword..."
              />
            </div>
          </div>
          {showDispositionFilter && (
            <div>
              <span className="block text-[10px] uppercase font-mono text-stone-400 mb-1">Disposition</span>
              <select
                value={dispositionFilter}
                onChange={(e) => setDispositionFilter(e.target.value)}
                className="w-full rounded-lg border border-stsn-beige bg-white px-3 py-2 text-xs font-semibold text-stone-700 outline-none focus:border-stsn-gold"
              >
                <option value="All">All</option>
                {DISPOSITIONS.map((d) => (
                  <option key={d} value={d}>{d}</option>
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
            {rows.length} row{rows.length === 1 ? "" : "s"} ready
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

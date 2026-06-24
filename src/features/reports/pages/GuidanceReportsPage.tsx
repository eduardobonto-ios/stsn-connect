import React, { useEffect, useMemo, useState } from "react";
import { FileText, Filter, Search, ShieldCheck } from "lucide-react";
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

  useEffect(() => {
    Promise.all([
      dbSelectAll<any>("anecdotal_records"),
      dbSelectAll<any>("guidance_sessions"),
    ]).then(([aRows, sRows]) => {
      setRecords(
        aRows.map((r: any) => ({
          id: r.id,
          studentId: r.studentId,
          recordDate: r.recordDate ?? "",
          incidentType: r.incidentType ?? "Other",
          description: r.description ?? "",
          actionTaken: r.actionTaken ?? "",
          reportedBy: r.reportedBy ?? "",
          followUpDate: r.followUpDate ?? "",
          followUpDone: r.followUpDone ?? false,
          isConfidential: r.isConfidential ?? false,
        })),
      );
      setSessions(
        sRows.map((s: any) => ({
          id: s.id,
          studentId: s.studentId,
          sessionDate: s.sessionDate ?? "",
          sessionType: s.sessionType ?? "Individual",
          concernArea: s.concernArea ?? "Other",
          summary: s.summary ?? "",
          recommendations: s.recommendations ?? "",
          nextSession: s.nextSession ?? "",
          counselorName: s.counselorName ?? "",
          isConfidential: s.isConfidential ?? true,
          status: s.status ?? "Completed",
        })),
      );
    });
  }, []);

  const scopedStudents = useMemo(
    () => getAcademicScopedData({ currentUser, activeSchool, academicUnit, students }).students,
    [currentUser, activeSchool, academicUnit, students],
  );
  const scopedRecords = useMemo(
    () => filterStudentLinkedRecords(records, scopedStudents),
    [records, scopedStudents],
  );
  const scopedSessions = useMemo(
    () => filterStudentLinkedRecords(sessions, scopedStudents),
    [sessions, scopedStudents],
  );

  const activeReport = GUIDANCE_REPORTS.find((r) => r.id === activeReportId) ?? GUIDANCE_REPORTS[0];

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
      <section className="bg-white border border-stsn-beige rounded-xl p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-stsn-cream text-stsn-brown border border-stsn-beige">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-stone-400">Guidance Reports</p>
                <h1 className="text-2xl font-black text-stsn-brown">Counseling, Incidents, and Conference Reports</h1>
              </div>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-stone-600">
              Generate Guidance reports from anecdotal records, counseling sessions, incident summaries, and parent conference logs.
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
            <div className="flex items-center gap-2 text-xs font-black uppercase">
              <ShieldCheck className="h-4 w-4" />
              Access Controlled
            </div>
            <p className="mt-1 text-xs">Visible only to roles with Guidance Reports permission.</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {GUIDANCE_REPORTS.map((report) => {
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
          <div className="md:col-span-2">
            <span className="block text-[10px] uppercase font-mono text-stone-400 mb-1">Search</span>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-stone-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-stsn-beige bg-white pl-8 pr-3 py-2 text-xs font-semibold text-stone-700 outline-none focus:border-stsn-gold"
                placeholder="Student name, keyword..."
              />
            </div>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-mono text-stone-400 mb-1">{typeLabel}</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full rounded-lg border border-stsn-beige bg-white px-3 py-2 text-xs font-semibold text-stone-700 outline-none focus:border-stsn-gold"
            >
              <option value="All">All</option>
              {typeOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
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

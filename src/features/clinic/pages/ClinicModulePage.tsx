/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo } from "react";
import {
  Stethoscope, Plus, X, Calendar, User,
  Heart, AlertCircle, CheckCircle, Clock,
} from "lucide-react";
import ModulePageHeader from "../../../components/common/ModulePageHeader";
import PersonIdentityCell from "../../../components/common/PersonIdentityCell";
import AppCard from "../../../components/common/AppCard";
import AppButton from "../../../components/common/AppButton";
import AppEmptyState from "../../../components/common/AppEmptyState";
import AppLoadingState from "../../../components/common/AppLoadingState";
import AppSearchInput from "../../../components/common/AppSearchInput";
import AppTabs from "../../../components/common/AppTabs";
import { useSTSNStore } from "../../../services/store";
import { getAcademicScopedData, filterStudentLinkedRecords } from "../../../services/academicUnitScopeService";
import { dbInsert, dbSelectAll, newId } from "../../../services/supabaseCrud";
import { useAppDialog } from "../../../components/common/useAppDialog";
import AppTable, {
  appTableColumnsFromLegacy,
  type AppTableLegacyColumn,
} from "../../../components/common/AppTable";
import ExportMenu from "../../../components/common/ExportMenu";
import { reportExportService } from "../../../services/reportExportService";

// ─── Types ────────────────────────────────────────────────────────────────────

type Disposition = "Released" | "Sent Home" | "Referred to Hospital" | "Observation" | "For Follow-up";

interface ClinicVisit {
  id: string;
  studentId: string;
  section?: string;
  visitDate: string;
  visitTime?: string;
  chiefComplaint: string;
  vitalSigns?: Record<string, string>;
  actionTaken?: string;
  disposition: Disposition;
  recordedBy?: string;
  notes?: string;
}

interface HealthProfile {
  id: string;
  studentId: string;
  bloodType?: string;
  allergies?: string[];
  chronicConditions?: string[];
  emergencyContact?: string;
  emergencyPhone?: string;
  physicianName?: string;
  philhealthNo?: string;
  notes?: string;
}

type ClinicVisitRow = ClinicVisit & { studentName: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rowToVisit(r: any): ClinicVisit {
  return {
    id: r.id,
    studentId: r.studentId,
    section: r.section ?? "",
    visitDate: r.visitDate ?? "",
    visitTime: r.visitTime ?? "",
    chiefComplaint: r.chiefComplaint ?? "",
    vitalSigns: r.vitalSigns ?? {},
    actionTaken: r.actionTaken ?? "",
    disposition: r.disposition ?? "Released",
    recordedBy: r.recordedBy ?? "",
    notes: r.notes ?? "",
  };
}

function rowToProfile(r: any): HealthProfile {
  return {
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
  };
}

const DISPOSITION_CONFIG: Record<Disposition, { label: string; badgeClass: string }> = {
  "Released":             { label: "Released",              badgeClass: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  "Sent Home":            { label: "Sent Home",             badgeClass: "text-amber-700 bg-amber-50 border-amber-200" },
  "Referred to Hospital": { label: "Referred to Hospital",  badgeClass: "text-red-700 bg-red-50 border-red-200" },
  "Observation":          { label: "Under Observation",     badgeClass: "text-blue-700 bg-blue-50 border-blue-200" },
  "For Follow-up":        { label: "For Follow-up",         badgeClass: "text-purple-700 bg-purple-50 border-purple-200" },
};

const DEFAULT_VISIT_FORM = {
  studentId: "",
  visitDate: new Date().toISOString().split("T")[0],
  visitTime: new Date().toTimeString().slice(0, 5),
  chiefComplaint: "",
  temperature: "",
  pulseRate: "",
  bloodPressure: "",
  actionTaken: "",
  disposition: "Released" as Disposition,
  recordedBy: "",
  notes: "",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ClinicModule() {
  const { students, currentUser, activeSchool, academicUnit } = useSTSNStore();
  const { toast, confirm } = useAppDialog();

  const [activeTab, setActiveTab] = useState<"visits" | "history" | "profiles">("visits");
  const [visits, setVisits] = useState<ClinicVisit[]>([]);
  const [profiles, setProfiles] = useState<HealthProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [profileSearch, setProfileSearch] = useState("");
  const [filterDisposition, setFilterDisposition] = useState("All");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(DEFAULT_VISIT_FORM);
  const [detailVisit, setDetailVisit] = useState<ClinicVisit | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      dbSelectAll<any>("clinic_visits"),
      dbSelectAll<any>("student_health_profiles"),
    ]).then(([vRows, pRows]) => {
      setVisits(vRows.map(rowToVisit));
      setProfiles(pRows.map(rowToProfile));
      setLoading(false);
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

  const today = new Date().toISOString().split("T")[0];

  const todaysVisits = useMemo(() => scopedVisits.filter((v) => v.visitDate === today), [scopedVisits, today]);

  const filteredVisits = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return scopedVisits.filter((v) => {
      const stu = scopedStudents.find((s) => s.id === v.studentId);
      const name = stu ? `${stu.firstName} ${stu.lastName}`.toLowerCase() : "";
      const matchSearch = !q || name.includes(q) || v.chiefComplaint.toLowerCase().includes(q);
      const matchDisp = filterDisposition === "All" || v.disposition === filterDisposition;
      return matchSearch && matchDisp;
    });
  }, [scopedVisits, scopedStudents, searchQuery, filterDisposition]);

  const followUpVisits = useMemo(
    () => scopedVisits.filter((v) => v.disposition === "For Follow-up"),
    [scopedVisits],
  );

  const filteredProfiles = useMemo(() => {
    const q = profileSearch.toLowerCase();
    if (!q) return scopedProfiles;
    return scopedProfiles.filter((p) => {
      const stu = scopedStudents.find((s) => s.id === p.studentId);
      const name = stu ? `${stu.firstName} ${stu.lastName}`.toLowerCase() : "";
      return name.includes(q) || (p.bloodType ?? "").toLowerCase().includes(q);
    });
  }, [scopedProfiles, scopedStudents, profileSearch]);

  const exportVisitHistory = (format: "pdf" | "print" | "csv" | "excel") => {
    const columns = [
      { key: "studentName", label: "Student" },
      { key: "visitDate", label: "Date" },
      { key: "visitTime", label: "Time" },
      { key: "chiefComplaint", label: "Chief Complaint" },
      { key: "disposition", label: "Disposition" },
      { key: "recordedBy", label: "Recorded By" },
    ];
    const rows = visitRows.map((v) => ({
      studentName: v.studentName,
      visitDate: v.visitDate,
      visitTime: v.visitTime || "—",
      chiefComplaint: v.chiefComplaint,
      disposition: DISPOSITION_CONFIG[v.disposition]?.label ?? v.disposition,
      recordedBy: v.recordedBy || "—",
    }));
    const payload = { title: "Clinic Visit History", columns, rows };
    if (format === "print") reportExportService.print(payload);
    else if (format === "csv") reportExportService.exportCsv(payload);
    else if (format === "excel") reportExportService.exportExcel(payload);
    else reportExportService.exportPdf(payload);
  };

  const kpis = [
    { label: "Total Visits (All Time)", value: scopedVisits.length, icon: Stethoscope, color: "text-stsn-brown", bg: "bg-amber-50 border-amber-200" },
    { label: "Today's Visits", value: todaysVisits.length, icon: Calendar, color: "text-teal-700", bg: "bg-teal-50 border-teal-200" },
    { label: "Sent Home / Referred", value: scopedVisits.filter((v) => v.disposition === "Sent Home" || v.disposition === "Referred to Hospital").length, icon: AlertCircle, color: "text-red-700", bg: "bg-red-50 border-red-200" },
    { label: "Health Profiles", value: scopedProfiles.length, icon: Heart, color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  ];

  const visitColumns: AppTableLegacyColumn<ClinicVisitRow>[] = [
    {
      title: "Student",
      data: "studentName",
      render: (_value, row) => {
        const stu = scopedStudents.find((s) => s.id === row.studentId);
        if (!stu) return <span className="font-semibold text-stone-500">{row.studentName}</span>;
        return <PersonIdentityCell firstName={stu.firstName} lastName={stu.lastName} secondary={stu.section || undefined} />;
      },
    },
    { title: "Date", data: "visitDate", className: "font-mono text-xs text-stone-600", width: "100px" },
    { title: "Chief Complaint", data: "chiefComplaint", className: "text-stone-700" },
    {
      title: "Disposition", data: "disposition", width: "160px",
      render: (v: Disposition) => {
        const cfg = DISPOSITION_CONFIG[v] ?? { label: v, badgeClass: "text-stone-600 bg-stone-50 border-stone-200" };
        return <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${cfg.badgeClass}`}>{cfg.label}</span>;
      },
    },
    { title: "Recorded By", data: "recordedBy", className: "text-xs text-stone-500", width: "130px" },
    {
      title: "Action", data: "id", width: "80px",
      render: (_: string, row: any) => (
        <button onClick={() => setDetailVisit(row)} className="text-[10px] font-bold text-stsn-brown underline cursor-pointer">View</button>
      ),
    },
  ];

  const visitRows = filteredVisits.map((v) => {
    const stu = scopedStudents.find((s) => s.id === v.studentId);
    return { ...v, studentName: stu ? `${stu.lastName}, ${stu.firstName}` : "Unknown" };
  });

  const handleSubmitVisit = async () => {
    if (!form.studentId || !form.chiefComplaint.trim()) {
      toast("Please fill in required fields (Student and Chief Complaint).");
      return;
    }
    const id = newId();
    const newVisit: ClinicVisit = {
      id,
      studentId: form.studentId,
      visitDate: form.visitDate,
      visitTime: form.visitTime,
      chiefComplaint: form.chiefComplaint,
      vitalSigns: {
        ...(form.temperature && { temperature: form.temperature }),
        ...(form.pulseRate && { pulse_rate: form.pulseRate }),
        ...(form.bloodPressure && { blood_pressure: form.bloodPressure }),
      },
      actionTaken: form.actionTaken,
      disposition: form.disposition,
      recordedBy: form.recordedBy || currentUser?.name || "Clinic Staff",
      notes: form.notes,
    };
    const error = await dbInsert("clinic_visits", {
      id,
      studentId: form.studentId,
      visitDate: form.visitDate,
      visitTime: form.visitTime || null,
      chiefComplaint: form.chiefComplaint,
      vitalSigns: newVisit.vitalSigns,
      actionTaken: form.actionTaken || null,
      disposition: form.disposition,
      recordedBy: newVisit.recordedBy,
      notes: form.notes || null,
    });
    if (error) {
      toast("Unable to save clinic visit. Please try again.");
      return;
    }
    setVisits((prev) => [newVisit, ...prev]);
    setShowForm(false);
    setForm(DEFAULT_VISIT_FORM);
    toast("Clinic visit logged successfully.");
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <ModulePageHeader
        badge="Clinic Office"
        badgeIcon={Stethoscope}
        title="Nurse / Clinic Office"
        subtitle="Student health visit logs, health profiles, and clinical records management."
        actions={
          <AppButton
            onClick={() => { setShowForm(true); setForm(DEFAULT_VISIT_FORM); }}
            variant="primary"
            size="md"
            leftIcon={Plus}
          >
            Log Visit
          </AppButton>
        }
      />

      {/* KPI Cards */}
      {loading ? (
        <AppLoadingState title="Loading clinic records..." description="Preparing visit logs and health profiles." />
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <AppCard key={kpi.label} className={`border-none p-4 ${kpi.bg}`} tone="brand">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                  <p className="text-[10px] uppercase font-mono tracking-wider text-stone-500">{kpi.label}</p>
                </div>
                <p className="text-2xl font-display font-black text-stone-800">{kpi.value}</p>
              </AppCard>
            );
          })}
        </div>
      )}

      {/* Tabs */}
      <AppCard className="overflow-hidden p-0" tone="brand">
        <AppTabs<"visits" | "history" | "profiles">
          items={[
            { value: "visits", label: "Today's Visits" },
            { value: "history", label: "Visit History" },
            { value: "profiles", label: "Health Profiles" },
          ]}
          value={activeTab}
          onChange={(value) => setActiveTab(value)}
          variant="underline"
          rightSlot={
            activeTab === "history" ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <AppSearchInput
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search student or complaint..."
                  uiSize="sm"
                  wrapperClassName="w-full sm:w-52"
                />
                <select
                  value={filterDisposition}
                  onChange={(e) => setFilterDisposition(e.target.value)}
                  className="min-h-9 rounded-xl border border-[var(--erp-border)] bg-white px-3 text-xs text-[var(--erp-text)] outline-none transition focus:border-[var(--erp-accent)]/60 focus:ring-4 focus:ring-[var(--erp-brand)]/12"
                >
                  <option value="All">All Dispositions</option>
                  {Object.keys(DISPOSITION_CONFIG).map((d) => <option key={d} value={d}>{DISPOSITION_CONFIG[d as Disposition].label}</option>)}
                </select>
                <ExportMenu onExport={exportVisitHistory} label="Export" />
              </div>
            ) : undefined
          }
        />

        <div className="p-5">
          {/* TODAY'S VISITS */}
          {activeTab === "visits" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-display font-bold text-stone-800">
                  Today's Visits — {new Date().toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </h3>
                <span className="text-[10px] font-mono font-bold text-stsn-brown bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  {todaysVisits.length} visit{todaysVisits.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Follow-up reminder strip */}
              {followUpVisits.length > 0 && (
                <AppCard className="flex items-start gap-2.5 border border-purple-200 bg-purple-50 p-3" tone="muted">
                  <AlertCircle className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-purple-800">Follow-up Required</p>
                    <p className="text-[10px] text-purple-700 mt-0.5">
                      {followUpVisits.length} student{followUpVisits.length !== 1 ? "s" : ""} from previous visits are marked <strong>For Follow-up</strong>. Check Visit History for details.
                    </p>
                  </div>
                </AppCard>
              )}
              {todaysVisits.length === 0 ? (
                <AppEmptyState
                  icon={CheckCircle}
                  title="No visits recorded today."
                  description='Click "Log Visit" to add a clinic visit entry.'
                  compact
                />
              ) : (
                <div className="space-y-3">
                  {todaysVisits.map((v) => {
                    const stu = scopedStudents.find((s) => s.id === v.studentId);
                    const cfg = DISPOSITION_CONFIG[v.disposition];
                    return (
                      <AppCard key={v.id} className="border border-stone-200 bg-stone-50 p-3" tone="muted">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <User className="w-3.5 h-3.5 text-stsn-gold flex-shrink-0" />
                            <p className="text-sm font-bold text-stone-800 truncate">
                              {stu ? `${stu.lastName}, ${stu.firstName}` : "Unknown Student"}
                            </p>
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0 ${cfg.badgeClass}`}>{cfg.label}</span>
                          </div>
                          <p className="text-xs text-stone-600 truncate">{v.chiefComplaint}</p>
                          <p className="text-[10px] text-stone-400 mt-0.5">
                            {v.visitTime && <span className="mr-2"><Clock className="inline w-3 h-3 mr-0.5" />{v.visitTime}</span>}
                            {v.recordedBy && <span>By: {v.recordedBy}</span>}
                          </p>
                        </div>
                        <button onClick={() => setDetailVisit(v)} className="text-[10px] font-bold text-stsn-brown underline cursor-pointer flex-shrink-0">View</button>
                      </AppCard>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* VISIT HISTORY */}
          {activeTab === "history" && (
            <div className="space-y-4">
              <AppTable<ClinicVisitRow>
                columns={appTableColumnsFromLegacy(visitColumns)}
                data={visitRows}
                emptyMessage="No clinic visits match the selected filters."
                loading={loading}
                initialPageSize={10}
                pageSizeOptions={[10]}
                enableSearch={false}
                getRowId={(visit) => visit.id}
              />
            </div>
          )}

          {/* HEALTH PROFILES */}
          {activeTab === "profiles" && (
            <div className="space-y-4">
              <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <p className="text-xs text-stone-500">Student health profiles with blood type, allergies, chronic conditions, and emergency contacts.</p>
                <AppSearchInput
                  value={profileSearch}
                  onChange={(e) => setProfileSearch(e.target.value)}
                  placeholder="Search student..."
                  uiSize="sm"
                  wrapperClassName="w-full sm:w-56"
                />
              </div>
              {filteredProfiles.length === 0 ? (
                <AppEmptyState
                  icon={Heart}
                  title={scopedProfiles.length === 0 ? "No health profiles on record." : "No profiles match your search."}
                  description="Student health profiles will appear here when records are available."
                  compact
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredProfiles.map((p) => {
                    const stu = scopedStudents.find((s) => s.id === p.studentId);
                    return (
                      <AppCard key={p.id} className="border border-stone-200 bg-stone-50 p-4 space-y-2" tone="muted">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-stsn-gold" />
                          <p className="text-sm font-bold text-stone-800">
                            {stu ? `${stu.lastName}, ${stu.firstName}` : "Unknown"}
                          </p>
                          {p.bloodType && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border text-red-700 bg-red-50 border-red-200">
                              {p.bloodType}
                            </span>
                          )}
                        </div>
                        {(p.allergies?.length ?? 0) > 0 && (
                          <p className="text-xs text-stone-600">
                            <span className="font-semibold text-stone-700">Allergies: </span>
                            {p.allergies?.join(", ")}
                          </p>
                        )}
                        {(p.chronicConditions?.length ?? 0) > 0 && (
                          <p className="text-xs text-stone-600">
                            <span className="font-semibold text-stone-700">Conditions: </span>
                            {p.chronicConditions?.join(", ")}
                          </p>
                        )}
                        {p.emergencyContact && (
                          <p className="text-xs text-stone-500">
                            Emergency: {p.emergencyContact} {p.emergencyPhone && `— ${p.emergencyPhone}`}
                          </p>
                        )}
                      </AppCard>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </AppCard>

      {/* LOG VISIT MODAL */}
      {showForm && (
        <div className="app-modal-backdrop z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden">
            <div className="bg-gradient-to-r from-stsn-brown to-stsn-brown-dark p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center gap-2"><Stethoscope className="w-4 h-4" /> Log Clinic Visit</h3>
              <button onClick={() => setShowForm(false)} className="cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 bg-stsn-cream space-y-3 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Student <span className="text-red-500">*</span></label>
                  <select value={form.studentId} onChange={(e) => setForm((p) => ({ ...p, studentId: e.target.value }))} className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none">
                    <option value="">— Select student —</option>
                    {scopedStudents.map((s) => <option key={s.id} value={s.id}>{s.lastName}, {s.firstName} ({s.studentNo})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Visit Date</label>
                  <input type="date" value={form.visitDate} onChange={(e) => setForm((p) => ({ ...p, visitDate: e.target.value }))} className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Time</label>
                  <input type="time" value={form.visitTime} onChange={(e) => setForm((p) => ({ ...p, visitTime: e.target.value }))} className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Chief Complaint <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="e.g. Headache, fever, stomach pain…" value={form.chiefComplaint} onChange={(e) => setForm((p) => ({ ...p, chiefComplaint: e.target.value }))} className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Temperature</label>
                  <input type="text" placeholder="e.g. 37.5°C" value={form.temperature} onChange={(e) => setForm((p) => ({ ...p, temperature: e.target.value }))} className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Pulse Rate</label>
                  <input type="text" placeholder="e.g. 80 bpm" value={form.pulseRate} onChange={(e) => setForm((p) => ({ ...p, pulseRate: e.target.value }))} className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Blood Pressure</label>
                  <input type="text" placeholder="e.g. 120/80" value={form.bloodPressure} onChange={(e) => setForm((p) => ({ ...p, bloodPressure: e.target.value }))} className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Action Taken</label>
                  <textarea rows={2} placeholder="Medicine given, rest advised, parents notified…" value={form.actionTaken} onChange={(e) => setForm((p) => ({ ...p, actionTaken: e.target.value }))} className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none resize-none" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Disposition</label>
                  <select value={form.disposition} onChange={(e) => setForm((p) => ({ ...p, disposition: e.target.value as Disposition }))} className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none">
                    {Object.keys(DISPOSITION_CONFIG).map((d) => <option key={d} value={d}>{DISPOSITION_CONFIG[d as Disposition].label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Recorded By</label>
                  <input type="text" placeholder="Nurse / Staff name" value={form.recordedBy} onChange={(e) => setForm((p) => ({ ...p, recordedBy: e.target.value }))} className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none" />
                </div>
              </div>
              <button onClick={handleSubmitVisit} className="w-full bg-stsn-brown hover:bg-stsn-brown-dark text-white font-bold text-xs py-2.5 rounded-xl shadow cursor-pointer transition mt-2">
                Save Clinic Visit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {detailVisit && (() => {
        const stu = scopedStudents.find((s) => s.id === detailVisit.studentId);
        const cfg = DISPOSITION_CONFIG[detailVisit.disposition];
        return (
          <div className="app-modal-backdrop z-50">
            <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden">
              <div className="bg-gradient-to-r from-stsn-brown to-stsn-brown-dark p-4 text-white flex justify-between items-center">
                <h3 className="font-bold text-sm flex items-center gap-2"><Stethoscope className="w-4 h-4" /> Clinic Visit Detail</h3>
                <button onClick={() => setDetailVisit(null)} className="cursor-pointer"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-5 bg-stsn-cream space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-stone-900">{stu ? `${stu.lastName}, ${stu.firstName}` : "Unknown"}</p>
                    <p className="text-[10px] font-mono text-stone-400">{stu?.studentNo} • {stu?.yearLevel} • {stu?.section}</p>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${cfg.badgeClass}`}>{cfg.label}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Visit Date", value: detailVisit.visitDate },
                    { label: "Time", value: detailVisit.visitTime || "—" },
                    { label: "Chief Complaint", value: detailVisit.chiefComplaint },
                    { label: "Recorded By", value: detailVisit.recordedBy || "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white rounded-lg border border-stone-200 p-2.5">
                      <p className="text-[9px] uppercase font-mono text-stone-400">{label}</p>
                      <p className="text-xs font-semibold text-stone-800 mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
                {detailVisit.vitalSigns && Object.keys(detailVisit.vitalSigns).length > 0 && (
                  <div className="bg-white rounded-lg border border-stone-200 p-3">
                    <p className="text-[9px] uppercase font-mono text-stone-400 mb-1.5">Vital Signs</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(detailVisit.vitalSigns).map(([k, v]) => (
                        <span key={k} className="text-[10px] bg-amber-50 border border-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
                          {k.replace(/_/g, " ")}: {v}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {detailVisit.actionTaken && (
                  <div className="bg-white rounded-lg border border-stone-200 p-3">
                    <p className="text-[9px] uppercase font-mono text-stone-400 mb-1">Action Taken</p>
                    <p className="text-xs text-stone-700">{detailVisit.actionTaken}</p>
                  </div>
                )}
                {detailVisit.notes && (
                  <div className="bg-white rounded-lg border border-stone-200 p-3">
                    <p className="text-[9px] uppercase font-mono text-stone-400 mb-1">Notes</p>
                    <p className="text-xs text-stone-700">{detailVisit.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

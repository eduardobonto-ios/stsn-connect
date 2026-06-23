/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo } from "react";
import {
  Stethoscope, Plus, Search, Eye, X, Calendar, User,
  Heart, AlertCircle, CheckCircle, Clock, Download, Filter,
} from "lucide-react";
import { useSTSNStore } from "../../../services/store";
import { dbInsert, dbSelectAll, newId } from "../../../services/supabaseCrud";
import { useAppDialog } from "../../../components/common/useAppDialog";
import STSNDataTable, { type STSNColumn } from "../../../components/common/STSNDataTable";

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
  const { students, currentUser } = useSTSNStore();
  const { toast, confirm } = useAppDialog();

  const [activeTab, setActiveTab] = useState<"visits" | "history" | "profiles">("visits");
  const [visits, setVisits] = useState<ClinicVisit[]>([]);
  const [profiles, setProfiles] = useState<HealthProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
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

  const today = new Date().toISOString().split("T")[0];

  const todaysVisits = useMemo(() => visits.filter((v) => v.visitDate === today), [visits, today]);

  const filteredVisits = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return visits.filter((v) => {
      const stu = students.find((s) => s.id === v.studentId);
      const name = stu ? `${stu.firstName} ${stu.lastName}`.toLowerCase() : "";
      const matchSearch = !q || name.includes(q) || v.chiefComplaint.toLowerCase().includes(q);
      const matchDisp = filterDisposition === "All" || v.disposition === filterDisposition;
      return matchSearch && matchDisp;
    });
  }, [visits, students, searchQuery, filterDisposition]);

  const kpis = [
    { label: "Total Visits (All Time)", value: visits.length, icon: Stethoscope, color: "text-stsn-brown", bg: "bg-amber-50 border-amber-200" },
    { label: "Today's Visits", value: todaysVisits.length, icon: Calendar, color: "text-teal-700", bg: "bg-teal-50 border-teal-200" },
    { label: "Sent Home / Referred", value: visits.filter((v) => v.disposition === "Sent Home" || v.disposition === "Referred to Hospital").length, icon: AlertCircle, color: "text-red-700", bg: "bg-red-50 border-red-200" },
    { label: "Health Profiles", value: profiles.length, icon: Heart, color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  ];

  const visitColumns: STSNColumn<ClinicVisit & { studentName: string }>[] = [
    { title: "Student", data: "studentName", className: "font-semibold text-stone-800" },
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
    const stu = students.find((s) => s.id === v.studentId);
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
    setVisits((prev) => [newVisit, ...prev]);
    dbInsert("clinic_visits", {
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
    setShowForm(false);
    setForm(DEFAULT_VISIT_FORM);
    toast("Clinic visit logged successfully.");
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="p-5 bg-white border border-stsn-beige rounded-xl shadow-sm flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-semibold text-stone-900 tracking-tight flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-stsn-brown" /> Nurse / Clinic Office
          </h2>
          <p className="text-stone-500 text-xs mt-1">
            Student health visit logs, health profiles, and clinical records management.
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setForm(DEFAULT_VISIT_FORM); }}
          className="flex items-center gap-2 bg-stsn-brown hover:bg-stsn-brown-dark text-white text-xs font-bold px-4 py-2 rounded-xl shadow cursor-pointer transition"
        >
          <Plus className="w-4 h-4" /> Log Visit
        </button>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map((i) => <div key={i} className="bg-white rounded-xl border border-stsn-beige shadow-sm p-4 h-20 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className={`border rounded-xl shadow-sm p-4 ${kpi.bg}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                  <p className="text-[10px] uppercase font-mono tracking-wider text-stone-500">{kpi.label}</p>
                </div>
                <p className="text-2xl font-display font-black text-stone-800">{kpi.value}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border border-stsn-beige rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-stone-100">
          {([["visits", "Today's Visits"], ["history", "Visit History"], ["profiles", "Health Profiles"]] as const).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-xs font-bold transition-all ${activeTab === tab ? "tab-active-gradient text-stsn-brown border-b-2 border-stsn-gold" : "text-stone-500 hover:text-stone-700 hover:bg-stone-50"}`}
            >
              {label}
            </button>
          ))}
        </div>

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
              {todaysVisits.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-10 h-10 text-stone-200 mx-auto mb-3" />
                  <p className="text-sm font-bold text-stone-600">No visits recorded today.</p>
                  <p className="text-xs text-stone-400 mt-1">Click "Log Visit" to add a clinic visit entry.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todaysVisits.map((v) => {
                    const stu = students.find((s) => s.id === v.studentId);
                    const cfg = DISPOSITION_CONFIG[v.disposition];
                    return (
                      <div key={v.id} className="flex items-start justify-between p-3 bg-stone-50 border border-stone-200 rounded-xl gap-3">
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
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* VISIT HISTORY */}
          {activeTab === "history" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-stone-400" />
                  <input
                    type="text" placeholder="Search student name or complaint..."
                    value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-stsn-gold/40"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-stone-400" />
                  <select
                    value={filterDisposition} onChange={(e) => setFilterDisposition(e.target.value)}
                    className="bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-xs focus:outline-none"
                  >
                    <option value="All">All Dispositions</option>
                    {Object.keys(DISPOSITION_CONFIG).map((d) => <option key={d} value={d}>{DISPOSITION_CONFIG[d as Disposition].label}</option>)}
                  </select>
                </div>
              </div>
              <STSNDataTable
                columns={visitColumns}
                rows={visitRows}
                emptyMessage="No clinic visits match the selected filters."
                pageLength={10}
                searchable={false}
              />
            </div>
          )}

          {/* HEALTH PROFILES */}
          {activeTab === "profiles" && (
            <div className="space-y-4">
              <p className="text-xs text-stone-500">Student health profiles with blood type, allergies, chronic conditions, and emergency contacts.</p>
              {profiles.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="w-10 h-10 text-stone-200 mx-auto mb-3" />
                  <p className="text-sm font-bold text-stone-600">No health profiles on record.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profiles.map((p) => {
                    const stu = students.find((s) => s.id === p.studentId);
                    return (
                      <div key={p.id} className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2">
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
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

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
                    {students.map((s) => <option key={s.id} value={s.id}>{s.lastName}, {s.firstName} ({s.studentNo})</option>)}
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
        const stu = students.find((s) => s.id === detailVisit.studentId);
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

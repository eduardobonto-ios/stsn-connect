/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo } from "react";
import {
  NotebookPen, Plus, Search, Eye, X, Calendar, User,
  MessageSquare, CheckCircle, Clock, AlertCircle, Filter, Lock,
} from "lucide-react";
import ModulePageHeader from "../../../components/common/ModulePageHeader";
import PersonIdentityCell from "../../../components/common/PersonIdentityCell";
import { useSTSNStore } from "../../../services/store";
import { getAcademicScopedData, filterStudentLinkedRecords } from "../../../services/academicUnitScopeService";
import { dbInsert, dbSelectAll, newId } from "../../../services/supabaseCrud";
import { useAppDialog } from "../../../components/common/useAppDialog";
import STSNDataTable, { type STSNColumn } from "../../../components/common/STSNDataTable";

// ─── Types ────────────────────────────────────────────────────────────────────

type IncidentType = "Behavior" | "Academic" | "Attendance" | "Social" | "Commendation" | "Disciplinary" | "Other";
type SessionType = "Individual" | "Group" | "Family" | "Crisis" | "Follow-up";
type ConcernArea = "Academic" | "Behavioral" | "Career" | "Personal/Social" | "Family" | "Peer Relationship" | "Crisis" | "Other";
type SessionStatus = "Scheduled" | "Completed" | "Cancelled" | "No-show";

interface AnecdotalRecord {
  id: string;
  studentId: string;
  recordDate: string;
  incidentType: IncidentType;
  description: string;
  actionTaken?: string;
  reportedBy?: string;
  followUpDate?: string;
  followUpDone: boolean;
  isConfidential: boolean;
}

interface GuidanceSession {
  id: string;
  studentId: string;
  sessionDate: string;
  sessionType: SessionType;
  concernArea: ConcernArea;
  summary: string;
  recommendations?: string;
  nextSession?: string;
  counselorName?: string;
  isConfidential: boolean;
  status: SessionStatus;
}

// ─── Config ──────────────────────────────────────────────────────────────────

const INCIDENT_TYPE_CONFIG: Record<IncidentType, { badgeClass: string }> = {
  Behavior:      { badgeClass: "text-amber-700 bg-amber-50 border-amber-200" },
  Academic:      { badgeClass: "text-blue-700 bg-blue-50 border-blue-200" },
  Attendance:    { badgeClass: "text-orange-700 bg-orange-50 border-orange-200" },
  Social:        { badgeClass: "text-purple-700 bg-purple-50 border-purple-200" },
  Commendation:  { badgeClass: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  Disciplinary:  { badgeClass: "text-red-700 bg-red-50 border-red-200" },
  Other:         { badgeClass: "text-stone-700 bg-stone-50 border-stone-200" },
};

const SESSION_STATUS_CONFIG: Record<SessionStatus, { badgeClass: string }> = {
  Scheduled:  { badgeClass: "text-blue-700 bg-blue-50 border-blue-200" },
  Completed:  { badgeClass: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  Cancelled:  { badgeClass: "text-stone-600 bg-stone-50 border-stone-200" },
  "No-show":  { badgeClass: "text-red-700 bg-red-50 border-red-200" },
};

const INCIDENT_TYPES: IncidentType[] = ["Behavior", "Academic", "Attendance", "Social", "Commendation", "Disciplinary", "Other"];
const SESSION_TYPES: SessionType[] = ["Individual", "Group", "Family", "Crisis", "Follow-up"];
const CONCERN_AREAS: ConcernArea[] = ["Academic", "Behavioral", "Career", "Personal/Social", "Family", "Peer Relationship", "Crisis", "Other"];
const SESSION_STATUSES: SessionStatus[] = ["Scheduled", "Completed", "Cancelled", "No-show"];

const DEFAULT_ANEC_FORM = {
  studentId: "",
  recordDate: new Date().toISOString().split("T")[0],
  incidentType: "Behavior" as IncidentType,
  description: "",
  actionTaken: "",
  reportedBy: "",
  followUpDate: "",
  isConfidential: false,
};

const DEFAULT_SESSION_FORM = {
  studentId: "",
  sessionDate: new Date().toISOString().split("T")[0],
  sessionType: "Individual" as SessionType,
  concernArea: "Academic" as ConcernArea,
  summary: "",
  recommendations: "",
  nextSession: "",
  counselorName: "",
  isConfidential: true,
  status: "Completed" as SessionStatus,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function GuidanceModule() {
  const { students, currentUser, activeSchool, academicUnit } = useSTSNStore();
  const { toast } = useAppDialog();

  const [activeTab, setActiveTab] = useState<"anecdotal" | "sessions">("anecdotal");
  const [records, setRecords] = useState<AnecdotalRecord[]>([]);
  const [sessions, setSessions] = useState<GuidanceSession[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  const [showAnecForm, setShowAnecForm] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [anecForm, setAnecForm] = useState(DEFAULT_ANEC_FORM);
  const [sessionForm, setSessionForm] = useState(DEFAULT_SESSION_FORM);
  const [detailRecord, setDetailRecord] = useState<AnecdotalRecord | null>(null);
  const [detailSession, setDetailSession] = useState<GuidanceSession | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      dbSelectAll<any>("anecdotal_records"),
      dbSelectAll<any>("guidance_sessions"),
    ]).then(([aRows, sRows]) => {
      setRecords(aRows.map((r: any) => ({
        id: r.id, studentId: r.studentId, recordDate: r.recordDate,
        incidentType: r.incidentType as IncidentType, description: r.description,
        actionTaken: r.actionTaken ?? "", reportedBy: r.reportedBy ?? "",
        followUpDate: r.followUpDate ?? "", followUpDone: r.followUpDone ?? false,
        isConfidential: r.isConfidential ?? false,
      })));
      setSessions(sRows.map((s: any) => ({
        id: s.id, studentId: s.studentId, sessionDate: s.sessionDate,
        sessionType: s.sessionType as SessionType, concernArea: s.concernArea as ConcernArea,
        summary: s.summary, recommendations: s.recommendations ?? "",
        nextSession: s.nextSession ?? "", counselorName: s.counselorName ?? "",
        isConfidential: s.isConfidential ?? true, status: s.status as SessionStatus,
      })));
      setLoading(false);
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

  const kpis = [
    { label: "Total Records", value: scopedRecords.length, icon: NotebookPen, bg: "bg-amber-50 border-amber-200", color: "text-stsn-brown" },
    { label: "Pending Follow-ups", value: scopedRecords.filter((r) => !r.followUpDone && r.followUpDate).length, icon: AlertCircle, bg: "bg-red-50 border-red-200", color: "text-red-700" },
    { label: "Sessions Conducted", value: scopedSessions.filter((s) => s.status === "Completed").length, icon: CheckCircle, bg: "bg-emerald-50 border-emerald-200", color: "text-emerald-700" },
    { label: "Upcoming Sessions", value: scopedSessions.filter((s) => s.status === "Scheduled").length, icon: Calendar, bg: "bg-blue-50 border-blue-200", color: "text-blue-700" },
  ];

  const filteredRecords = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return scopedRecords.filter((r) => {
      const stu = scopedStudents.find((s) => s.id === r.studentId);
      const name = stu ? `${stu.firstName} ${stu.lastName}`.toLowerCase() : "";
      const matchSearch = !q || name.includes(q) || r.description.toLowerCase().includes(q);
      const matchType = filterType === "All" || r.incidentType === filterType;
      return matchSearch && matchType;
    });
  }, [scopedRecords, scopedStudents, searchQuery, filterType]);

  const filteredSessions = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return scopedSessions.filter((s) => {
      const stu = scopedStudents.find((st) => st.id === s.studentId);
      const name = stu ? `${stu.firstName} ${stu.lastName}`.toLowerCase() : "";
      const matchSearch = !q || name.includes(q) || s.concernArea.toLowerCase().includes(q);
      const matchStatus = filterStatus === "All" || s.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [scopedSessions, scopedStudents, searchQuery, filterStatus]);

  const getStudentLabel = (id: string) => {
    const stu = scopedStudents.find((s) => s.id === id);
    return stu ? `${stu.lastName}, ${stu.firstName}` : "Unknown";
  };

  const handleSaveRecord = async () => {
    if (!anecForm.studentId || !anecForm.description.trim()) {
      toast("Please fill in required fields.");
      return;
    }
    const id = newId();
    const newRec: AnecdotalRecord = {
      id, studentId: anecForm.studentId, recordDate: anecForm.recordDate,
      incidentType: anecForm.incidentType, description: anecForm.description,
      actionTaken: anecForm.actionTaken, reportedBy: anecForm.reportedBy || currentUser?.name || "",
      followUpDate: anecForm.followUpDate || undefined, followUpDone: false,
      isConfidential: anecForm.isConfidential,
    };
    const error = await dbInsert("anecdotal_records", { id, studentId: anecForm.studentId, recordDate: anecForm.recordDate, incidentType: anecForm.incidentType, description: anecForm.description, actionTaken: anecForm.actionTaken || null, reportedBy: newRec.reportedBy, followUpDate: anecForm.followUpDate || null, followUpDone: false, isConfidential: anecForm.isConfidential });
    if (error) {
      toast("Unable to save anecdotal record. Please try again.");
      return;
    }
    setRecords((prev) => [newRec, ...prev]);
    setShowAnecForm(false);
    setAnecForm(DEFAULT_ANEC_FORM);
    toast("Anecdotal record saved.");
  };

  const handleSaveSession = async () => {
    if (!sessionForm.studentId || !sessionForm.summary.trim()) {
      toast("Please fill in required fields.");
      return;
    }
    const id = newId();
    const newSes: GuidanceSession = {
      id, studentId: sessionForm.studentId, sessionDate: sessionForm.sessionDate,
      sessionType: sessionForm.sessionType, concernArea: sessionForm.concernArea,
      summary: sessionForm.summary, recommendations: sessionForm.recommendations,
      nextSession: sessionForm.nextSession || undefined,
      counselorName: sessionForm.counselorName || currentUser?.name || "",
      isConfidential: sessionForm.isConfidential, status: sessionForm.status,
    };
    const error = await dbInsert("guidance_sessions", { id, studentId: sessionForm.studentId, sessionDate: sessionForm.sessionDate, sessionType: sessionForm.sessionType, concernArea: sessionForm.concernArea, summary: sessionForm.summary, recommendations: sessionForm.recommendations || null, nextSession: sessionForm.nextSession || null, counselorName: newSes.counselorName, isConfidential: sessionForm.isConfidential, status: sessionForm.status });
    if (error) {
      toast("Unable to save guidance session. Please try again.");
      return;
    }
    setSessions((prev) => [newSes, ...prev]);
    setShowSessionForm(false);
    setSessionForm(DEFAULT_SESSION_FORM);
    toast("Guidance session saved.");
  };

  const anecColumns: STSNColumn<AnecdotalRecord & { studentName: string }>[] = [
    {
      title: "Student",
      data: "studentName",
      render: (_value, row) => {
        const stu = scopedStudents.find((s) => s.id === row.studentId);
        if (!stu) return <span className="font-semibold text-stone-500">{row.studentName}</span>;
        return <PersonIdentityCell firstName={stu.firstName} lastName={stu.lastName} secondary={stu.section || undefined} />;
      },
    },
    { title: "Date", data: "recordDate", width: "90px", className: "font-mono text-xs" },
    {
      title: "Type", data: "incidentType", width: "140px",
      render: (v: IncidentType, row: any) => (
        <div className="flex items-center gap-1.5">
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${INCIDENT_TYPE_CONFIG[v].badgeClass}`}>{v}</span>
          {row.isConfidential && <Lock className="w-3 h-3 text-stone-400 flex-shrink-0" title="Confidential" />}
          {!row.followUpDone && row.followUpDate && <AlertCircle className="w-3 h-3 text-amber-500 flex-shrink-0" title="Pending follow-up" />}
        </div>
      ),
    },
    { title: "Description", data: "description", className: "text-xs text-stone-600" },
    { title: "By", data: "reportedBy", width: "110px", className: "text-xs text-stone-400" },
    {
      title: "", data: "id", width: "80px",
      render: (_: string, row: any) => (
        <button onClick={() => setDetailRecord(row)} className="text-[10px] font-bold text-stsn-brown underline cursor-pointer">View</button>
      ),
    },
  ];

  const sessionColumns: STSNColumn<GuidanceSession & { studentName: string }>[] = [
    {
      title: "Student",
      data: "studentName",
      render: (_value, row) => {
        const stu = scopedStudents.find((s) => s.id === row.studentId);
        if (!stu) return <span className="font-semibold text-stone-500">{row.studentName}</span>;
        return <PersonIdentityCell firstName={stu.firstName} lastName={stu.lastName} secondary={stu.section || undefined} />;
      },
    },
    { title: "Date", data: "sessionDate", width: "90px", className: "font-mono text-xs" },
    { title: "Type", data: "sessionType", width: "100px", className: "text-xs font-semibold" },
    { title: "Concern", data: "concernArea", className: "text-xs text-stone-600" },
    {
      title: "Status", data: "status", width: "100px",
      render: (v: SessionStatus) => <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${SESSION_STATUS_CONFIG[v].badgeClass}`}>{v}</span>,
    },
    {
      title: "", data: "id", width: "80px",
      render: (_: string, row: any) => (
        <button onClick={() => setDetailSession(row)} className="text-[10px] font-bold text-stsn-brown underline cursor-pointer">View</button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <ModulePageHeader
        badge="Guidance Office"
        badgeIcon={NotebookPen}
        title="Guidance Office"
        subtitle="Anecdotal records, behavioral incident tracking, and individual counseling session logs."
        actions={
          <div className="flex gap-2">
            <button onClick={() => { setShowAnecForm(true); setAnecForm(DEFAULT_ANEC_FORM); }} className="inline-flex items-center gap-1.5 bg-[#C5A059] hover:bg-[#d4af68] text-[#1C1512] text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg transition cursor-pointer">
              <Plus className="w-3.5 h-3.5" /> Record
            </button>
            <button onClick={() => { setShowSessionForm(true); setSessionForm(DEFAULT_SESSION_FORM); }} className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/25 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer">
              <MessageSquare className="w-3.5 h-3.5" /> Session
            </button>
          </div>
        }
      />

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

      {/* Pending Follow-up Reminder Strip */}
      {!loading && scopedRecords.filter((r) => !r.followUpDone && r.followUpDate).length > 0 && (
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-xs font-bold text-amber-800">Pending Follow-ups</p>
            <p className="text-[10px] text-amber-700 mt-0.5">
              {scopedRecords.filter((r) => !r.followUpDone && r.followUpDate).length} anecdotal record{scopedRecords.filter((r) => !r.followUpDone && r.followUpDate).length !== 1 ? "s" : ""} require a follow-up action.
              {" "}Review the <strong>Anecdotal Records</strong> tab and mark them done.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border border-stsn-beige rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-stone-100">
          {([["anecdotal", "Anecdotal Records"], ["sessions", "Counseling Sessions"]] as const).map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-xs font-bold transition-all ${activeTab === tab ? "tab-active-gradient text-stsn-brown border-b-2 border-stsn-gold" : "text-stone-500 hover:text-stone-700 hover:bg-stone-50"}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4">
          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-stone-400" />
              <input type="text" placeholder="Search student or keyword…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-stsn-gold/40" />
            </div>
            {activeTab === "anecdotal" && (
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-xs focus:outline-none">
                <option value="All">All Types</option>
                {INCIDENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            )}
            {activeTab === "sessions" && (
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-xs focus:outline-none">
                <option value="All">All Statuses</option>
                {SESSION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
          </div>

          {activeTab === "anecdotal" && (
            <STSNDataTable
              columns={anecColumns}
              rows={filteredRecords.map((r) => ({ ...r, studentName: getStudentLabel(r.studentId) }))}
              emptyMessage="No anecdotal records match the selected filters."
              pageLength={10}
              searchable={false}
            />
          )}
          {activeTab === "sessions" && (
            <STSNDataTable
              columns={sessionColumns}
              rows={filteredSessions.map((s) => ({ ...s, studentName: getStudentLabel(s.studentId) }))}
              emptyMessage="No counseling sessions match the selected filters."
              pageLength={10}
              searchable={false}
            />
          )}
        </div>
      </div>

      {/* ANECDOTAL FORM MODAL */}
      {showAnecForm && (
        <div className="app-modal-backdrop z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden">
            <div className="bg-gradient-to-r from-stsn-brown to-stsn-brown-dark p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center gap-2"><NotebookPen className="w-4 h-4" /> New Anecdotal Record</h3>
              <button onClick={() => setShowAnecForm(false)} className="cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 bg-stsn-cream space-y-3 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Student <span className="text-red-500">*</span></label>
                  <select value={anecForm.studentId} onChange={(e) => setAnecForm((p) => ({ ...p, studentId: e.target.value }))} className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none">
                    <option value="">— Select student —</option>
                    {scopedStudents.map((s) => <option key={s.id} value={s.id}>{s.lastName}, {s.firstName} ({s.studentNo})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Date</label>
                  <input type="date" value={anecForm.recordDate} onChange={(e) => setAnecForm((p) => ({ ...p, recordDate: e.target.value }))} className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Incident Type</label>
                  <select value={anecForm.incidentType} onChange={(e) => setAnecForm((p) => ({ ...p, incidentType: e.target.value as IncidentType }))} className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none">
                    {INCIDENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Description <span className="text-red-500">*</span></label>
                  <textarea rows={3} value={anecForm.description} onChange={(e) => setAnecForm((p) => ({ ...p, description: e.target.value }))} placeholder="Describe the incident or observation in detail…" className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none resize-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Action Taken</label>
                  <textarea rows={2} value={anecForm.actionTaken} onChange={(e) => setAnecForm((p) => ({ ...p, actionTaken: e.target.value }))} placeholder="Steps taken or consequence given…" className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none resize-none" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Reported By</label>
                  <input type="text" value={anecForm.reportedBy} onChange={(e) => setAnecForm((p) => ({ ...p, reportedBy: e.target.value }))} placeholder="Teacher / Staff" className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Follow-up Date</label>
                  <input type="date" value={anecForm.followUpDate} onChange={(e) => setAnecForm((p) => ({ ...p, followUpDate: e.target.value }))} className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none" />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <input type="checkbox" id="anec-confidential" checked={anecForm.isConfidential} onChange={(e) => setAnecForm((p) => ({ ...p, isConfidential: e.target.checked }))} className="cursor-pointer" />
                  <label htmlFor="anec-confidential" className="text-xs text-stone-600 cursor-pointer flex items-center gap-1">
                    <Lock className="w-3 h-3 text-stone-400" /> Mark as confidential
                  </label>
                </div>
              </div>
              <button onClick={handleSaveRecord} className="w-full bg-stsn-brown hover:bg-stsn-brown-dark text-white font-bold text-xs py-2.5 rounded-xl shadow cursor-pointer transition mt-1">
                Save Anecdotal Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SESSION FORM MODAL */}
      {showSessionForm && (
        <div className="app-modal-backdrop z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden">
            <div className="bg-gradient-to-r from-stone-700 to-stone-800 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center gap-2"><MessageSquare className="w-4 h-4" /> New Guidance Session</h3>
              <button onClick={() => setShowSessionForm(false)} className="cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 bg-stsn-cream space-y-3 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Student <span className="text-red-500">*</span></label>
                  <select value={sessionForm.studentId} onChange={(e) => setSessionForm((p) => ({ ...p, studentId: e.target.value }))} className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none">
                    <option value="">— Select student —</option>
                    {scopedStudents.map((s) => <option key={s.id} value={s.id}>{s.lastName}, {s.firstName} ({s.studentNo})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Session Date</label>
                  <input type="date" value={sessionForm.sessionDate} onChange={(e) => setSessionForm((p) => ({ ...p, sessionDate: e.target.value }))} className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Status</label>
                  <select value={sessionForm.status} onChange={(e) => setSessionForm((p) => ({ ...p, status: e.target.value as SessionStatus }))} className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none">
                    {SESSION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Session Type</label>
                  <select value={sessionForm.sessionType} onChange={(e) => setSessionForm((p) => ({ ...p, sessionType: e.target.value as SessionType }))} className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none">
                    {SESSION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Concern Area</label>
                  <select value={sessionForm.concernArea} onChange={(e) => setSessionForm((p) => ({ ...p, concernArea: e.target.value as ConcernArea }))} className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none">
                    {CONCERN_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Session Summary <span className="text-red-500">*</span></label>
                  <textarea rows={3} value={sessionForm.summary} onChange={(e) => setSessionForm((p) => ({ ...p, summary: e.target.value }))} placeholder="Key discussion points and student response…" className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none resize-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Recommendations</label>
                  <textarea rows={2} value={sessionForm.recommendations} onChange={(e) => setSessionForm((p) => ({ ...p, recommendations: e.target.value }))} placeholder="Referrals, next steps, action plan…" className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none resize-none" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Next Session</label>
                  <input type="date" value={sessionForm.nextSession} onChange={(e) => setSessionForm((p) => ({ ...p, nextSession: e.target.value }))} className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Counselor</label>
                  <input type="text" value={sessionForm.counselorName} onChange={(e) => setSessionForm((p) => ({ ...p, counselorName: e.target.value }))} placeholder="Counselor name" className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none" />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <input type="checkbox" id="ses-confidential" checked={sessionForm.isConfidential} onChange={(e) => setSessionForm((p) => ({ ...p, isConfidential: e.target.checked }))} className="cursor-pointer" />
                  <label htmlFor="ses-confidential" className="text-xs text-stone-600 cursor-pointer flex items-center gap-1">
                    <Lock className="w-3 h-3 text-stone-400" /> Confidential session
                  </label>
                </div>
              </div>
              <button onClick={handleSaveSession} className="w-full bg-stone-700 hover:bg-stone-800 text-white font-bold text-xs py-2.5 rounded-xl shadow cursor-pointer transition mt-1">
                Save Session Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODALS */}
      {detailRecord && (() => {
        const stu = scopedStudents.find((s) => s.id === detailRecord.studentId);
        const cfg = INCIDENT_TYPE_CONFIG[detailRecord.incidentType];
        return (
          <div className="app-modal-backdrop z-50">
            <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden">
              <div className="bg-gradient-to-r from-stsn-brown to-stsn-brown-dark p-4 text-white flex justify-between items-center">
                <h3 className="font-bold text-sm">Anecdotal Record — Detail</h3>
                <button onClick={() => setDetailRecord(null)} className="cursor-pointer"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-5 bg-stsn-cream space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-stone-900">{stu ? `${stu.lastName}, ${stu.firstName}` : "Unknown"}</p>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${cfg.badgeClass}`}>{detailRecord.incidentType}</span>
                </div>
                <p className="text-[10px] font-mono text-stone-400">{detailRecord.recordDate} • Reported by {detailRecord.reportedBy || "—"}</p>
                <div className="bg-white rounded-lg border border-stone-200 p-3">
                  <p className="text-[9px] uppercase font-mono text-stone-400 mb-1">Description</p>
                  <p className="text-xs text-stone-700">{detailRecord.description}</p>
                </div>
                {detailRecord.actionTaken && (
                  <div className="bg-white rounded-lg border border-stone-200 p-3">
                    <p className="text-[9px] uppercase font-mono text-stone-400 mb-1">Action Taken</p>
                    <p className="text-xs text-stone-700">{detailRecord.actionTaken}</p>
                  </div>
                )}
                <div className="flex gap-3">
                  {detailRecord.followUpDate && (
                    <div className="bg-white rounded-lg border border-stone-200 p-2.5 flex-1">
                      <p className="text-[9px] uppercase font-mono text-stone-400">Follow-up</p>
                      <p className="text-xs font-semibold text-stone-800 mt-0.5">{detailRecord.followUpDate}</p>
                      <p className="text-[9px] text-stone-400">{detailRecord.followUpDone ? "Done" : "Pending"}</p>
                    </div>
                  )}
                  {detailRecord.isConfidential && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-red-600" />
                      <span className="text-[10px] font-bold text-red-700">Confidential</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {detailSession && (() => {
        const stu = scopedStudents.find((s) => s.id === detailSession.studentId);
        const cfg = SESSION_STATUS_CONFIG[detailSession.status];
        return (
          <div className="app-modal-backdrop z-50">
            <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden">
              <div className="bg-gradient-to-r from-stone-700 to-stone-800 p-4 text-white flex justify-between items-center">
                <h3 className="font-bold text-sm">Guidance Session — Detail</h3>
                <button onClick={() => setDetailSession(null)} className="cursor-pointer"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-5 bg-stsn-cream space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-stone-900">{stu ? `${stu.lastName}, ${stu.firstName}` : "Unknown"}</p>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${cfg.badgeClass}`}>{detailSession.status}</span>
                </div>
                <p className="text-[10px] font-mono text-stone-400">{detailSession.sessionDate} • {detailSession.sessionType} • {detailSession.concernArea}</p>
                {detailSession.counselorName && <p className="text-xs text-stone-500">Counselor: {detailSession.counselorName}</p>}
                <div className="bg-white rounded-lg border border-stone-200 p-3">
                  <p className="text-[9px] uppercase font-mono text-stone-400 mb-1">Session Summary</p>
                  <p className="text-xs text-stone-700">{detailSession.summary}</p>
                </div>
                {detailSession.recommendations && (
                  <div className="bg-white rounded-lg border border-stone-200 p-3">
                    <p className="text-[9px] uppercase font-mono text-stone-400 mb-1">Recommendations</p>
                    <p className="text-xs text-stone-700">{detailSession.recommendations}</p>
                  </div>
                )}
                {detailSession.nextSession && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-xs text-blue-700 font-semibold">Next Session: {detailSession.nextSession}</span>
                  </div>
                )}
                {detailSession.isConfidential && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-red-600" />
                    <span className="text-[10px] font-bold text-red-700">Confidential Session Record</span>
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

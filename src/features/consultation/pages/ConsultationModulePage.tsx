/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo } from "react";
import {
  PhoneCall, Plus, Search, Eye, X, Calendar, User,
  CheckCircle, Clock, AlertCircle,
} from "lucide-react";
import { useSTSNStore } from "../../../services/store";
import { getAcademicScopedData } from "../../../services/academicUnitScopeService";
import { dbInsert, dbUpdate, dbSelectAll, newId } from "../../../services/supabaseCrud";
import { useAppDialog } from "../../../components/common/useAppDialog";
import STSNDataTable, { type STSNColumn } from "../../../components/common/STSNDataTable";
import ModulePageHeader from "../../../components/common/ModulePageHeader";

// ─── Types ────────────────────────────────────────────────────────────────────

type RequestorRole = "Student" | "Parent" | "Teacher" | "Admin";
type AppointmentStatus = "Pending" | "Confirmed" | "Completed" | "Cancelled" | "Rescheduled";

interface ConsultationAppointment {
  id: string;
  studentId?: string;
  teacherId?: string;
  requestedBy: string;
  requestorRole: RequestorRole;
  purpose: string;
  appointmentDate?: string;
  appointmentTime?: string;
  venue?: string;
  status: AppointmentStatus;
  remarks?: string;
  teacherNotes?: string;
}

// ─── Config ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; badgeClass: string; icon: React.ElementType }> = {
  Pending:     { label: "Pending",     badgeClass: "text-amber-700 bg-amber-50 border-amber-200",      icon: Clock },
  Confirmed:   { label: "Confirmed",   badgeClass: "text-blue-700 bg-blue-50 border-blue-200",          icon: CheckCircle },
  Completed:   { label: "Completed",   badgeClass: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: CheckCircle },
  Cancelled:   { label: "Cancelled",   badgeClass: "text-stone-600 bg-stone-50 border-stone-200",       icon: X },
  Rescheduled: { label: "Rescheduled", badgeClass: "text-purple-700 bg-purple-50 border-purple-200",    icon: Calendar },
};

const REQUESTOR_ROLES: RequestorRole[] = ["Student", "Parent", "Teacher", "Admin"];
const STATUSES: AppointmentStatus[] = ["Pending", "Confirmed", "Completed", "Cancelled", "Rescheduled"];

const DEFAULT_FORM = {
  studentId: "",
  teacherId: "",
  requestedBy: "",
  requestorRole: "Parent" as RequestorRole,
  purpose: "",
  appointmentDate: "",
  appointmentTime: "",
  venue: "",
  remarks: "",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ConsultationModule() {
  const { students, teachers, currentUser, activeSchool, academicUnit } = useSTSNStore();
  const { toast } = useAppDialog();

  const [activeTab, setActiveTab] = useState<"appointments" | "requests">("appointments");
  const [appointments, setAppointments] = useState<ConsultationAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [detailItem, setDetailItem] = useState<ConsultationAppointment | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [teacherNotes, setTeacherNotes] = useState("");
  const [pendingPage, setPendingPage] = useState(1);
  const PENDING_PAGE_SIZE = 10;

  useEffect(() => {
    setLoading(true);
    dbSelectAll<any>("consultation_appointments").then((rows) => {
      setAppointments(rows.map((r: any) => ({
        id: r.id,
        studentId: r.studentId ?? undefined,
        teacherId: r.teacherId ?? undefined,
        requestedBy: r.requestedBy ?? "",
        requestorRole: r.requestorRole as RequestorRole,
        purpose: r.purpose ?? "",
        appointmentDate: r.appointmentDate ?? undefined,
        appointmentTime: r.appointmentTime ?? undefined,
        venue: r.venue ?? "",
        status: r.status as AppointmentStatus,
        remarks: r.remarks ?? "",
        teacherNotes: r.teacherNotes ?? "",
      })));
      setLoading(false);
    });
  }, []);

  const scopedData = useMemo(
    () => getAcademicScopedData({ currentUser, activeSchool, academicUnit, students, teachers }),
    [currentUser, activeSchool, academicUnit, students, teachers],
  );
  const scopedStudents = scopedData.students;
  const scopedTeachers = scopedData.teachers ?? [];
  const scopedStudentIds = useMemo(() => new Set(scopedStudents.map((student) => student.id)), [scopedStudents]);
  const scopedTeacherIds = useMemo(() => new Set(scopedTeachers.map((teacher) => teacher.id)), [scopedTeachers]);
  const scopedAppointments = useMemo(
    () =>
      appointments.filter((appointment) => {
        if (appointment.studentId) return scopedStudentIds.has(appointment.studentId);
        if (appointment.teacherId) return scopedTeacherIds.has(appointment.teacherId);
        return false;
      }),
    [appointments, scopedStudentIds, scopedTeacherIds],
  );

  const kpis = [
    { label: "Total Requests", value: scopedAppointments.length, bg: "bg-amber-50 border-amber-200", color: "text-stsn-brown", icon: PhoneCall },
    { label: "Pending", value: scopedAppointments.filter((a) => a.status === "Pending").length, bg: "bg-amber-50 border-amber-200", color: "text-amber-700", icon: Clock },
    { label: "Confirmed / Upcoming", value: scopedAppointments.filter((a) => a.status === "Confirmed").length, bg: "bg-blue-50 border-blue-200", color: "text-blue-700", icon: Calendar },
    { label: "Completed", value: scopedAppointments.filter((a) => a.status === "Completed").length, bg: "bg-emerald-50 border-emerald-200", color: "text-emerald-700", icon: CheckCircle },
  ];

  const confirmedItems = useMemo(() =>
    scopedAppointments.filter((a) => a.status === "Confirmed" || a.status === "Completed")
      .sort((a, b) => (a.appointmentDate || "").localeCompare(b.appointmentDate || "")),
    [scopedAppointments]
  );

  const pendingItems = useMemo(() =>
    scopedAppointments.filter((a) => a.status === "Pending" || a.status === "Rescheduled"),
    [scopedAppointments]
  );

  const filteredItems = useMemo(() => {
    const source = activeTab === "appointments" ? confirmedItems : pendingItems;
    const q = searchQuery.toLowerCase();
    return source.filter((a) => {
      const stu = scopedStudents.find((s) => s.id === a.studentId);
      const tea = scopedTeachers.find((t) => t.id === a.teacherId);
      const name = stu ? `${stu.firstName} ${stu.lastName}`.toLowerCase() : a.requestedBy.toLowerCase();
      const teacherName = tea ? `${tea.firstName} ${tea.lastName}`.toLowerCase() : "";
      const matchSearch = !q || name.includes(q) || a.purpose.toLowerCase().includes(q) || teacherName.includes(q);
      const matchStatus = filterStatus === "All" || a.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [activeTab, confirmedItems, pendingItems, searchQuery, filterStatus, scopedStudents, scopedTeachers]);

  const getStudentLabel = (id?: string) => {
    if (!id) return "—";
    const stu = scopedStudents.find((s) => s.id === id);
    return stu ? `${stu.lastName}, ${stu.firstName}` : "Unknown";
  };

  const getTeacherLabel = (id?: string) => {
    if (!id) return "—";
    const tea = scopedTeachers.find((t) => t.id === id);
    return tea ? `${tea.lastName}, ${tea.firstName}` : "Unknown";
  };

  const handleSubmit = async () => {
    if (!form.requestedBy.trim() || !form.purpose.trim()) {
      toast("Please fill in Requested By and Purpose fields.");
      return;
    }
    const id = newId();
    const newAppt: ConsultationAppointment = {
      id,
      studentId: form.studentId || undefined,
      teacherId: form.teacherId || undefined,
      requestedBy: form.requestedBy,
      requestorRole: form.requestorRole,
      purpose: form.purpose,
      appointmentDate: form.appointmentDate || undefined,
      appointmentTime: form.appointmentTime || undefined,
      venue: form.venue || undefined,
      status: "Pending",
      remarks: form.remarks || undefined,
    };
    const error = await dbInsert("consultation_appointments", {
      id,
      studentId: form.studentId || null,
      teacherId: form.teacherId || null,
      requestedBy: form.requestedBy,
      requestorRole: form.requestorRole,
      purpose: form.purpose,
      appointmentDate: form.appointmentDate || null,
      appointmentTime: form.appointmentTime || null,
      venue: form.venue || null,
      status: "Pending",
      remarks: form.remarks || null,
    });
    if (error) {
      toast("Unable to submit consultation request. Please try again.");
      return;
    }
    setAppointments((prev) => [newAppt, ...prev]);
    setShowForm(false);
    setForm(DEFAULT_FORM);
    toast("Consultation request submitted.");
  };

  const updateStatus = async (id: string, status: AppointmentStatus, notes?: string) => {
    const error = await dbUpdate("consultation_appointments", id, { status, ...(notes !== undefined && { teacherNotes: notes }) });
    if (error) {
      toast("Unable to update consultation status. Please try again.");
      return false;
    }
    setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, status, ...(notes !== undefined && { teacherNotes: notes }) } : a));
    return true;
  };

  const columns: STSNColumn<ConsultationAppointment & { studentLabel: string; teacherLabel: string }>[] = [
    { title: "Requested By", data: "requestedBy", className: "font-semibold text-stone-800" },
    { title: "Student", data: "studentLabel", className: "text-xs text-stone-600" },
    { title: "Teacher / Adviser", data: "teacherLabel", className: "text-xs text-stone-500" },
    { title: "Purpose", data: "purpose", className: "text-xs text-stone-600" },
    { title: "Date", data: "appointmentDate", width: "90px", className: "font-mono text-xs", render: (v: string | undefined) => v || "TBD" },
    {
      title: "Status", data: "status", width: "110px",
      render: (v: AppointmentStatus) => {
        const cfg = STATUS_CONFIG[v];
        return <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${cfg.badgeClass}`}>{cfg.label}</span>;
      },
    },
    {
      title: "", data: "id", width: "60px",
      render: (_: string, row: any) => (
        <button onClick={() => setDetailItem(row)} className="text-[10px] font-bold text-stsn-brown underline cursor-pointer">View</button>
      ),
    },
  ];

  const tableData = filteredItems.map((a) => ({
    ...a,
    studentLabel: getStudentLabel(a.studentId),
    teacherLabel: getTeacherLabel(a.teacherId),
  }));

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <ModulePageHeader
        badge="Faculty & Staff"
        badgeIcon={PhoneCall}
        title="Consultation Management"
        subtitle="Teacher–parent and adviser–student consultation appointment booking and tracking."
        actions={
          <button
            onClick={() => { setShowForm(true); setForm(DEFAULT_FORM); }}
            className="inline-flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-xl shadow-lg transition cursor-pointer bg-[#C5A059] hover:bg-[#d4af68] text-[#1C1512]"
          >
            <Plus className="w-4 h-4" /> Request Consultation
          </button>
        }
      />

      {/* KPI Cards */}
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

      {/* Tabs */}
      <div className="bg-white border border-stsn-beige rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center border-b border-stone-100">
          <div className="flex flex-1">
            {([["appointments", "Confirmed Appointments"], ["requests", "Pending Requests"]] as const).map(([tab, label]) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-xs font-bold transition-all ${activeTab === tab ? "tab-active-gradient text-stsn-brown border-b-2 border-stsn-gold" : "text-stone-500 hover:text-stone-700 hover:bg-stone-50"}`}>
                {label}
                {tab === "requests" && pendingItems.length > 0 && (
                  <span className="ml-1.5 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{pendingItems.length}</span>
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 px-3 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
              <input type="text" placeholder="Search by name, purpose, or teacher…"
                value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPendingPage(1); }}
                className="h-8 w-44 bg-stone-50 border border-stone-200 rounded-lg pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-stsn-gold/40" />
            </div>
            <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPendingPage(1); }}
              className="h-8 bg-stone-50 border border-stone-200 rounded-lg px-2 text-xs focus:outline-none">
              <option value="All">All Statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {activeTab === "requests" && (() => {
            const totalPages = Math.max(1, Math.ceil(filteredItems.length / PENDING_PAGE_SIZE));
            const safePage = Math.min(pendingPage, totalPages);
            const pageStart = (safePage - 1) * PENDING_PAGE_SIZE;
            const pageEnd = pageStart + PENDING_PAGE_SIZE;
            const pageItems = filteredItems.slice(pageStart, pageEnd);
            const from = filteredItems.length === 0 ? 0 : pageStart + 1;
            const to = Math.min(pageEnd, filteredItems.length);
            return (
              <div className="space-y-3">
                {filteredItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-12 px-4 border border-stsn-beige rounded-xl bg-stsn-cream/50 text-center">
                    <PhoneCall className="w-8 h-8 text-stsn-gold/50" />
                    <p className="text-sm text-stone-500">No pending consultation requests.</p>
                  </div>
                ) : (
                  <>
                    {pageItems.map((a) => {
                      const stu = scopedStudents.find((s) => s.id === a.studentId);
                      const tea = scopedTeachers.find((t) => t.id === a.teacherId);
                      const cfg = STATUS_CONFIG[a.status];
                      return (
                        <div key={a.id} className="bg-stone-50 border border-stone-200 rounded-xl p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${cfg.badgeClass}`}>{cfg.label}</span>
                                <span className="text-[8px] font-mono text-stone-400">{a.requestorRole}</span>
                              </div>
                              <p className="text-sm font-bold text-stone-800">{a.requestedBy}</p>
                              <p className="text-xs text-stone-500">{a.purpose}</p>
                              {stu && <p className="text-[10px] text-stone-400">Student: {stu.lastName}, {stu.firstName}</p>}
                              {tea && <p className="text-[10px] text-stone-400">Teacher: {tea.lastName}, {tea.firstName}</p>}
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <button
                                onClick={() => { setConfirmingId(a.id); setTeacherNotes(""); }}
                                className="text-xs font-bold bg-stsn-brown hover:bg-stsn-brown-dark text-white px-3 py-1.5 rounded-lg cursor-pointer transition"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={async () => {
                                  if (await updateStatus(a.id, "Cancelled")) toast("Consultation request declined.");
                                }}
                                className="text-xs font-bold bg-stone-200 hover:bg-stone-300 text-stone-700 px-3 py-1.5 rounded-lg cursor-pointer transition"
                              >
                                Decline
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {/* DataTables-style pagination footer */}
                    <div className="flex items-center justify-between pt-2 text-xs text-stone-500">
                      <span>Showing {from} to {to} of {filteredItems.length} entries</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setPendingPage((p) => Math.max(1, p - 1))}
                          disabled={safePage === 1}
                          className="px-2.5 py-1 rounded border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition text-xs"
                        >
                          Previous
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                          <button
                            key={pg}
                            onClick={() => setPendingPage(pg)}
                            className={`px-2.5 py-1 rounded border text-xs cursor-pointer transition ${pg === safePage ? "bg-stsn-brown text-white border-stsn-brown font-bold" : "border-stone-200 bg-white hover:bg-stone-50 text-stone-600"}`}
                          >
                            {pg}
                          </button>
                        ))}
                        <button
                          onClick={() => setPendingPage((p) => Math.min(totalPages, p + 1))}
                          disabled={safePage === totalPages}
                          className="px-2.5 py-1 rounded border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition text-xs"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })()}

          {(activeTab === "appointments" || filteredItems.length === 0) && (
            <STSNDataTable
              columns={columns}
              rows={activeTab === "appointments" ? tableData : []}
              emptyMessage={activeTab === "requests" ? "No pending consultation requests." : "No confirmed appointments."}
              pageLength={10}
              searchable={false}
            />
          )}
        </div>
      </div>

      {/* CONFIRM MODAL */}
      {confirmingId && (
        <div className="app-modal-backdrop z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-sm overflow-hidden">
            <div className="bg-gradient-to-r from-stsn-brown to-stsn-brown-dark p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Confirm Appointment</h3>
              <button onClick={() => setConfirmingId(null)} className="cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 bg-stsn-cream space-y-3">
              <p className="text-xs text-stone-600">Add notes or a venue for this consultation appointment.</p>
              <textarea rows={3} value={teacherNotes} onChange={(e) => setTeacherNotes(e.target.value)} placeholder="e.g. Confirmed for June 10, 2026 at 2:00 PM — Room 14…" className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none resize-none" />
              <button
                onClick={async () => {
                  if (await updateStatus(confirmingId, "Confirmed", teacherNotes)) {
                    setConfirmingId(null);
                    setTeacherNotes("");
                    toast("Appointment confirmed.");
                  }
                }}
                className="w-full bg-stsn-brown hover:bg-stsn-brown-dark text-white font-bold text-xs py-2.5 rounded-xl shadow cursor-pointer transition"
              >
                Confirm Appointment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REQUEST FORM MODAL */}
      {showForm && (
        <div className="app-modal-backdrop z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden">
            <div className="bg-gradient-to-r from-stsn-brown to-stsn-brown-dark p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center gap-2"><PhoneCall className="w-4 h-4" /> New Consultation Request</h3>
              <button onClick={() => setShowForm(false)} className="cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 bg-stsn-cream space-y-3 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Requested By <span className="text-red-500">*</span></label>
                  <input type="text" value={form.requestedBy} onChange={(e) => setForm((p) => ({ ...p, requestedBy: e.target.value }))} placeholder="Full name of parent / student" className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Requestor Role</label>
                  <select value={form.requestorRole} onChange={(e) => setForm((p) => ({ ...p, requestorRole: e.target.value as RequestorRole }))} className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none">
                    {REQUESTOR_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Student</label>
                  <select value={form.studentId} onChange={(e) => setForm((p) => ({ ...p, studentId: e.target.value }))} className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none">
                    <option value="">— Select student (optional) —</option>
                    {scopedStudents.map((s) => <option key={s.id} value={s.id}>{s.lastName}, {s.firstName} ({s.studentNo})</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Teacher / Adviser</label>
                  <select value={form.teacherId} onChange={(e) => setForm((p) => ({ ...p, teacherId: e.target.value }))} className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none">
                    <option value="">— Select teacher (optional) —</option>
                    {scopedTeachers.map((t) => <option key={t.id} value={t.id}>{t.lastName}, {t.firstName}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Purpose / Agenda <span className="text-red-500">*</span></label>
                  <textarea rows={2} value={form.purpose} onChange={(e) => setForm((p) => ({ ...p, purpose: e.target.value }))} placeholder="Reason for requesting consultation…" className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none resize-none" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Preferred Date</label>
                  <input type="date" value={form.appointmentDate} onChange={(e) => setForm((p) => ({ ...p, appointmentDate: e.target.value }))} className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Preferred Time</label>
                  <input type="time" value={form.appointmentTime} onChange={(e) => setForm((p) => ({ ...p, appointmentTime: e.target.value }))} className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Venue</label>
                  <input type="text" value={form.venue} onChange={(e) => setForm((p) => ({ ...p, venue: e.target.value }))} placeholder="e.g. Guidance Room, Online via Teams" className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Additional Remarks</label>
                  <textarea rows={2} value={form.remarks} onChange={(e) => setForm((p) => ({ ...p, remarks: e.target.value }))} placeholder="Any additional information…" className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none resize-none" />
                </div>
              </div>
              <button onClick={handleSubmit} className="w-full bg-stsn-brown hover:bg-stsn-brown-dark text-white font-bold text-xs py-2.5 rounded-xl shadow cursor-pointer transition mt-1">
                Submit Consultation Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {detailItem && (() => {
        const stu = scopedStudents.find((s) => s.id === detailItem.studentId);
        const tea = scopedTeachers.find((t) => t.id === detailItem.teacherId);
        const cfg = STATUS_CONFIG[detailItem.status];
        const StatusIcon = cfg.icon;
        return (
          <div className="app-modal-backdrop z-50">
            <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden">
              <div className="bg-gradient-to-r from-stsn-brown to-stsn-brown-dark p-4 text-white flex justify-between items-center">
                <h3 className="font-bold text-sm">Consultation — Detail</h3>
                <button onClick={() => setDetailItem(null)} className="cursor-pointer"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-5 bg-stsn-cream space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-stone-900">{detailItem.requestedBy}</p>
                    <p className="text-[10px] text-stone-400">{detailItem.requestorRole}</p>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${cfg.badgeClass}`}>
                    <StatusIcon className="w-2.5 h-2.5" />{cfg.label}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {stu && (
                    <div className="bg-white rounded-lg border border-stone-200 p-2.5">
                      <p className="text-[9px] uppercase font-mono text-stone-400">Student</p>
                      <p className="text-xs font-semibold text-stone-800 mt-0.5">{stu.lastName}, {stu.firstName}</p>
                      <p className="text-[9px] text-stone-400">{stu.studentNo}</p>
                    </div>
                  )}
                  {tea && (
                    <div className="bg-white rounded-lg border border-stone-200 p-2.5">
                      <p className="text-[9px] uppercase font-mono text-stone-400">Teacher</p>
                      <p className="text-xs font-semibold text-stone-800 mt-0.5">{tea.lastName}, {tea.firstName}</p>
                    </div>
                  )}
                  {detailItem.appointmentDate && (
                    <div className="bg-white rounded-lg border border-stone-200 p-2.5">
                      <p className="text-[9px] uppercase font-mono text-stone-400">Date</p>
                      <p className="text-xs font-semibold text-stone-800 mt-0.5">{detailItem.appointmentDate}</p>
                    </div>
                  )}
                  {detailItem.appointmentTime && (
                    <div className="bg-white rounded-lg border border-stone-200 p-2.5">
                      <p className="text-[9px] uppercase font-mono text-stone-400">Time</p>
                      <p className="text-xs font-semibold text-stone-800 mt-0.5">{detailItem.appointmentTime}</p>
                    </div>
                  )}
                </div>
                <div className="bg-white rounded-lg border border-stone-200 p-3">
                  <p className="text-[9px] uppercase font-mono text-stone-400 mb-1">Purpose</p>
                  <p className="text-xs text-stone-700">{detailItem.purpose}</p>
                </div>
                {detailItem.venue && (
                  <div className="bg-white rounded-lg border border-stone-200 p-3">
                    <p className="text-[9px] uppercase font-mono text-stone-400 mb-1">Venue</p>
                    <p className="text-xs text-stone-700">{detailItem.venue}</p>
                  </div>
                )}
                {detailItem.teacherNotes && (
                  <div className="bg-blue-50 rounded-lg border border-blue-200 p-3">
                    <p className="text-[9px] uppercase font-mono text-blue-400 mb-1">Teacher Notes</p>
                    <p className="text-xs text-blue-800">{detailItem.teacherNotes}</p>
                  </div>
                )}
                {detailItem.status === "Confirmed" && (
                  <button
                    onClick={async () => {
                      if (await updateStatus(detailItem.id, "Completed")) {
                        setDetailItem(null);
                        toast("Consultation marked as completed.");
                      }
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl shadow cursor-pointer transition"
                  >
                    Mark as Completed
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

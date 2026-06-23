/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { Briefcase, Plus, X, ChevronRight, UserCheck } from "lucide-react";
import { createPortal } from "react-dom";
import { useSTSNStore } from "../../../../services/store";
import { useAppDialog } from "../../../../components/common/useAppDialog";
import STSNDataTable, { type STSNColumn } from "../../../../components/common/STSNDataTable";
import { JobRequisition, JobApplicant, ApplicantInterview } from "../../../../types";

const REQ_STATUS_COLORS: Record<string, string> = {
  Draft: "bg-stone-100 text-stone-500",
  Approved: "bg-blue-100 text-blue-700",
  Posted: "bg-cyan-100 text-cyan-700",
  Screening: "bg-amber-100 text-amber-700",
  Interview: "bg-indigo-100 text-indigo-700",
  Offered: "bg-purple-100 text-purple-700",
  Closed: "bg-emerald-100 text-emerald-700",
  Cancelled: "bg-red-100 text-red-700",
};

const APPLICANT_STATUS_COLORS: Record<string, string> = {
  "For Screening": "bg-amber-100 text-amber-700",
  "For Interview": "bg-blue-100 text-blue-700",
  "For Assessment": "bg-indigo-100 text-indigo-700",
  Offered: "bg-purple-100 text-purple-700",
  Hired: "bg-emerald-100 text-emerald-700",
  Rejected: "bg-red-100 text-red-700",
  Withdrew: "bg-stone-100 text-stone-500",
};

const INTERVIEW_RESULT_COLORS: Record<string, string> = {
  Passed: "bg-emerald-100 text-emerald-700",
  Failed: "bg-red-100 text-red-700",
  "No Show": "bg-orange-100 text-orange-700",
  Pending: "bg-amber-100 text-amber-700",
};

interface AddRequisitionModalProps {
  onClose: () => void;
  onSave: (data: Omit<JobRequisition, "id" | "createdAt">) => void;
}

function AddRequisitionModal({ onClose, onSave }: AddRequisitionModalProps) {
  const { employees } = useSTSNStore();
  const [positionTitle, setPositionTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [employmentType, setEmploymentType] = useState<JobRequisition["employmentType"]>("Full-Time");
  const [headCount, setHeadCount] = useState(1);
  const [reason, setReason] = useState("");
  const [targetStartDate, setTargetStartDate] = useState("");
  const [requestedBy, setRequestedBy] = useState("");

  const departments = useMemo(() => Array.from(new Set(employees.map((e) => e.department))).sort(), [employees]);
  const reqNo = `REQ-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;

  return createPortal(
    <div className="app-modal-backdrop z-50 animate-fade-in text-stone-800">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-stone-200">
        <div className="modal-header-gradient text-white p-4 flex items-center justify-between">
          <h3 className="font-display font-semibold text-base">New Job Requisition</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg cursor-pointer"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-stone-600 block mb-1">Position Title <span className="text-red-500">*</span></label>
              <input value={positionTitle} onChange={(e) => setPositionTitle(e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-gold/30" placeholder="e.g., Math Teacher" />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-600 block mb-1">Department <span className="text-red-500">*</span></label>
              <input value={department} onChange={(e) => setDepartment(e.target.value)} list="dept-list" className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-gold/30" placeholder="Department" />
              <datalist id="dept-list">{departments.map((d) => <option key={d} value={d} />)}</datalist>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-stone-600 block mb-1">Employment Type</label>
              <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value as any)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-gold/30">
                {["Full-Time", "Part-Time", "Contractual"].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-600 block mb-1">Head Count</label>
              <input type="number" min={1} value={headCount} onChange={(e) => setHeadCount(Number(e.target.value))} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-gold/30" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-stone-600 block mb-1">Target Start Date</label>
              <input type="date" value={targetStartDate} onChange={(e) => setTargetStartDate(e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-gold/30" />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-600 block mb-1">Requested By</label>
              <input value={requestedBy} onChange={(e) => setRequestedBy(e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-gold/30" placeholder="Name or title" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-600 block mb-1">Reason / Justification</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-gold/30 resize-none" placeholder="Reason for the requisition..." />
          </div>
        </div>
        <div className="px-5 pb-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-xs rounded-lg border border-stone-200 hover:bg-stone-50 cursor-pointer">Cancel</button>
          <button
            disabled={!positionTitle.trim() || !department.trim()}
            onClick={() => {
              onSave({ requisitionNo: reqNo, positionTitle, department, employmentType, headCount, reason: reason || undefined, targetStartDate: targetStartDate || undefined, requestedBy: requestedBy || undefined, status: "Draft" });
              onClose();
            }}
            className="px-4 py-2 text-xs rounded-lg btn-primary-gradient text-white font-semibold cursor-pointer disabled:opacity-50"
          >
            Create Requisition
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

interface AddApplicantModalProps {
  requisition?: JobRequisition;
  onClose: () => void;
  onSave: (data: Omit<JobApplicant, "id" | "createdAt">) => void;
}

function AddApplicantModal({ requisition, onClose, onSave }: AddApplicantModalProps) {
  const { jobRequisitions } = useSTSNStore();
  const [jobRequisitionId, setJobRequisitionId] = useState(requisition?.id ?? "");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [notes, setNotes] = useState("");

  const openReqs = jobRequisitions.filter((r) => ["Approved", "Posted", "Screening", "Interview"].includes(r.status));

  return createPortal(
    <div className="app-modal-backdrop z-50 animate-fade-in text-stone-800">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-stone-200">
        <div className="modal-header-gradient text-white p-4 flex items-center justify-between">
          <h3 className="font-display font-semibold text-base">Add Applicant</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg cursor-pointer"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-xs font-semibold text-stone-600 block mb-1">Applying For</label>
            <select value={jobRequisitionId} onChange={(e) => setJobRequisitionId(e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-gold/30">
              <option value="">— Walk-in / General Application —</option>
              {openReqs.map((r) => <option key={r.id} value={r.id}>{r.positionTitle} ({r.requisitionNo})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-stone-600 block mb-1">First Name <span className="text-red-500">*</span></label>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-gold/30" />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-600 block mb-1">Last Name <span className="text-red-500">*</span></label>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-gold/30" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-stone-600 block mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-gold/30" />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-600 block mb-1">Contact</label>
              <input value={contact} onChange={(e) => setContact(e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-gold/30" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-600 block mb-1">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-gold/30 resize-none" />
          </div>
        </div>
        <div className="px-5 pb-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-xs rounded-lg border border-stone-200 hover:bg-stone-50 cursor-pointer">Cancel</button>
          <button
            disabled={!firstName.trim() || !lastName.trim()}
            onClick={() => {
              onSave({ jobRequisitionId: jobRequisitionId || undefined, firstName, lastName, email: email || undefined, contact: contact || undefined, appliedAt: new Date().toISOString().split("T")[0], status: "For Screening", notes: notes || undefined });
              onClose();
            }}
            className="px-4 py-2 text-xs rounded-lg btn-primary-gradient text-white font-semibold cursor-pointer disabled:opacity-50"
          >
            Add Applicant
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

interface RequisitionDetailProps {
  requisition: JobRequisition;
  onClose: () => void;
  onStatusChange: (id: string, status: JobRequisition["status"]) => void;
}

function RequisitionDetail({ requisition, onClose, onStatusChange }: RequisitionDetailProps) {
  const { jobApplicants, applicantInterviews, updateJobApplicantStatus, addApplicantInterview, updateInterviewResult } = useSTSNStore();
  const [showAddApplicant, setShowAddApplicant] = useState(false);
  const { addJobApplicant } = useSTSNStore();
  const { toast } = useAppDialog();

  const reqApplicants = jobApplicants.filter((a) => a.jobRequisitionId === requisition.id);
  const applicantMap = useMemo(() => new Map(reqApplicants.map((a) => [a.id, a])), [reqApplicants]);

  const nextStatuses: Record<string, JobRequisition["status"][]> = {
    Draft: ["Approved", "Cancelled"],
    Approved: ["Posted", "Cancelled"],
    Posted: ["Screening", "Cancelled"],
    Screening: ["Interview"],
    Interview: ["Offered", "Closed"],
    Offered: ["Closed"],
    Closed: [],
    Cancelled: [],
  };

  const applicantCols: STSNColumn<JobApplicant>[] = [
    { title: "Name", render: (_, r) => <span className="text-xs font-semibold">{r.firstName} {r.lastName}</span> },
    { title: "Applied", data: "appliedAt", render: (v) => <span className="font-mono text-xs">{v}</span>, width: "90px" },
    {
      title: "Status",
      data: "status",
      render: (v) => <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${APPLICANT_STATUS_COLORS[v] ?? "bg-gray-100 text-gray-600"}`}>{v}</span>,
      width: "110px",
    },
    {
      title: "Move",
      orderable: false,
      searchable: false,
      render: (_, row) => {
        const moves: Record<string, JobApplicant["status"]> = {
          "For Screening": "For Interview",
          "For Interview": "For Assessment",
          "For Assessment": "Offered",
          "Offered": "Hired",
        };
        const next = moves[row.status];
        return next ? (
          <button onClick={(e) => { e.stopPropagation(); updateJobApplicantStatus(row.id, next); toast(`${row.firstName} moved to ${next}.`); }} className="text-[10px] px-2 py-0.5 rounded border border-blue-200 text-blue-600 hover:bg-blue-50 cursor-pointer">→ {next}</button>
        ) : row.status !== "Hired" && row.status !== "Rejected" && row.status !== "Withdrew" ? (
          <button onClick={(e) => { e.stopPropagation(); updateJobApplicantStatus(row.id, "Rejected"); toast(`${row.firstName} marked as Rejected.`); }} className="text-[10px] px-2 py-0.5 rounded border border-red-200 text-red-500 hover:bg-red-50 cursor-pointer">Reject</button>
        ) : row.status === "Hired" ? <span className="text-[10px] text-emerald-600 font-semibold">Hired ✓</span> : null;
      },
      width: "110px",
    },
  ];

  return (
    <div className="bg-white border border-stsn-beige rounded-xl shadow-sm flex flex-col">
      <div className="p-4 border-b border-stone-100 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-stone-800">{requisition.positionTitle}</p>
          <p className="text-xs text-stone-500">{requisition.requisitionNo} · {requisition.department} · {requisition.employmentType}</p>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-stone-100 rounded-lg cursor-pointer"><X className="w-4 h-4 text-stone-400" /></button>
      </div>
      <div className="p-4 border-b border-stone-100">
        <div className="flex flex-wrap gap-2 mb-3">
          {nextStatuses[requisition.status]?.map((next) => (
            <button key={next} onClick={() => onStatusChange(requisition.id, next)} className={`text-[10px] px-3 py-1 rounded-full border font-semibold cursor-pointer ${REQ_STATUS_COLORS[next] ?? "border-stone-200"}`}>
              Move to: {next}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          {[
            ["Head Count", requisition.headCount],
            ["Target Start", requisition.targetStartDate ?? "—"],
            ["Requested By", requisition.requestedBy ?? "—"],
          ].map(([label, val]) => (
            <div key={String(label)}>
              <p className="text-[10px] text-stone-400 uppercase font-mono tracking-wider">{label}</p>
              <p className="text-stone-700 font-medium mt-0.5">{val}</p>
            </div>
          ))}
        </div>
        {requisition.reason && <p className="text-xs text-stone-500 mt-2 italic">{requisition.reason}</p>}
      </div>
      <div className="p-3 border-b border-stone-100 flex items-center justify-between">
        <p className="text-xs font-semibold text-stone-700">Applicants ({reqApplicants.length})</p>
        <button onClick={() => setShowAddApplicant(true)} className="text-[10px] px-3 py-1 rounded-lg btn-primary-gradient text-white font-semibold cursor-pointer flex items-center gap-1">
          <Plus className="w-3 h-3" /> Add Applicant
        </button>
      </div>
      <div className="overflow-y-auto max-h-72">
        {reqApplicants.length > 0 ? (
          <STSNDataTable<JobApplicant>
            columns={applicantCols}
            rows={reqApplicants}
            emptyMessage="No applicants yet."
            pageLength={5}
            searchable={false}
          />
        ) : (
          <p className="text-xs text-stone-400 text-center py-6">No applicants yet. Add one to begin tracking.</p>
        )}
      </div>
      {showAddApplicant && (
        <AddApplicantModal
          requisition={requisition}
          onClose={() => setShowAddApplicant(false)}
          onSave={(data) => { addJobApplicant(data); setShowAddApplicant(false); toast("Applicant added."); }}
        />
      )}
    </div>
  );
}

export default function RecruitmentPage() {
  const { jobRequisitions, jobApplicants, addJobRequisition, updateJobRequisitionStatus, currentUser } = useSTSNStore();
  const { toast } = useAppDialog();

  const [tab, setTab] = useState<"requisitions" | "applicants">("requisitions");
  const [showAddReq, setShowAddReq] = useState(false);
  const [showAddApplicant, setShowAddApplicant] = useState(false);
  const [selectedReq, setSelectedReq] = useState<JobRequisition | null>(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const { addJobApplicant } = useSTSNStore();

  const reqMap = useMemo(() => new Map(jobRequisitions.map((r) => [r.id, r])), [jobRequisitions]);

  const filteredReqs = useMemo(() => {
    if (filterStatus === "All") return jobRequisitions;
    return jobRequisitions.filter((r) => r.status === filterStatus);
  }, [jobRequisitions, filterStatus]);

  const reqColumns: STSNColumn<JobRequisition>[] = [
    { title: "Req #", data: "requisitionNo", render: (v) => <span className="font-mono text-xs font-bold text-stsn-brown">{v}</span>, width: "110px" },
    { title: "Position", data: "positionTitle", render: (v) => <span className="text-xs font-semibold">{v}</span> },
    { title: "Department", data: "department", render: (v) => <span className="text-xs">{v}</span> },
    { title: "Type", data: "employmentType", render: (v) => <span className="text-xs text-stone-500">{v}</span>, width: "90px" },
    { title: "HC", data: "headCount", render: (v) => <span className="text-xs font-mono">{v}</span>, width: "40px" },
    {
      title: "Status",
      data: "status",
      render: (v) => <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${REQ_STATUS_COLORS[v] ?? "bg-gray-100 text-gray-600"}`}>{v}</span>,
      width: "90px",
    },
    {
      title: "Applicants",
      render: (_, row) => <span className="text-xs font-mono">{jobApplicants.filter((a) => a.jobRequisitionId === row.id).length}</span>,
      orderable: false,
      width: "80px",
    },
    {
      title: "",
      orderable: false,
      searchable: false,
      render: (_, row) => (
        <button onClick={(e) => { e.stopPropagation(); setSelectedReq(row); }} className="p-1 hover:bg-stsn-cream rounded cursor-pointer">
          <ChevronRight className="w-4 h-4 text-stone-400" />
        </button>
      ),
      width: "40px",
    },
  ];

  const applicantColumns: STSNColumn<JobApplicant>[] = [
    {
      title: "Name",
      render: (_, r) => (
        <div>
          <p className="text-xs font-semibold">{r.firstName} {r.lastName}</p>
          {r.email && <p className="text-[10px] text-stone-400">{r.email}</p>}
        </div>
      ),
    },
    {
      title: "Applying For",
      render: (_, r) => {
        const req = r.jobRequisitionId ? reqMap.get(r.jobRequisitionId) : null;
        return <span className="text-xs text-stone-600">{req ? req.positionTitle : "General Application"}</span>;
      },
    },
    { title: "Applied", data: "appliedAt", render: (v) => <span className="font-mono text-xs">{v}</span>, width: "90px" },
    {
      title: "Status",
      data: "status",
      render: (v) => <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${APPLICANT_STATUS_COLORS[v] ?? "bg-gray-100 text-gray-600"}`}>{v}</span>,
      width: "110px",
    },
    { title: "Notes", data: "notes", render: (v) => <span className="text-xs text-stone-400">{v ?? "—"}</span> },
  ];

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-white border border-stsn-beige rounded-xl shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-display font-semibold text-stone-900 tracking-tight flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-stsn-brown" />
            Recruitment
          </h2>
          <p className="text-stone-500 text-xs mt-1">Job requisitions, applicant tracking, and hiring pipeline.</p>
        </div>
        <div className="flex gap-2">
          {tab === "requisitions" && (
            <button onClick={() => setShowAddReq(true)} className="btn-primary-gradient text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer">
              <Plus className="w-4 h-4" /> New Requisition
            </button>
          )}
          {tab === "applicants" && (
            <button onClick={() => setShowAddApplicant(true)} className="btn-primary-gradient text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer">
              <Plus className="w-4 h-4" /> Add Applicant
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-stone-100 p-1 rounded-xl w-fit">
        {(["requisitions", "applicants"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${tab === t ? "bg-white text-stsn-brown shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
          >
            {t === "requisitions" ? `Requisitions (${jobRequisitions.length})` : `All Applicants (${jobApplicants.length})`}
          </button>
        ))}
      </div>

      {tab === "requisitions" && (
        <>
          {/* Filter card */}
          <div className="bg-white border border-stsn-beige rounded-xl px-4 py-3 shadow-sm flex flex-wrap gap-3 items-center">
            <label className="text-xs text-stone-500">Status:</label>
            {["All", "Draft", "Approved", "Posted", "Screening", "Interview", "Offered", "Closed", "Cancelled"].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`text-[10px] px-2.5 py-1 rounded-full border font-semibold cursor-pointer transition-all ${filterStatus === s ? "bg-stsn-brown text-white border-stsn-brown" : s !== "All" ? `${REQ_STATUS_COLORS[s]} border-transparent` : "border-stone-200 text-stone-500"}`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className={`flex gap-4 ${selectedReq ? "flex-col lg:flex-row" : ""}`}>
            <div className={`${selectedReq ? "lg:flex-1" : "w-full"} bg-white border border-stsn-beige rounded-xl shadow-sm overflow-hidden p-1`}>
              <STSNDataTable<JobRequisition>
                columns={reqColumns}
                rows={filteredReqs}
                emptyMessage="No job requisitions found. Create one to start the hiring process."
                pageLength={10}
                searchable={false}
                onRowClick={(row) => setSelectedReq(row)}
                selectedId={selectedReq?.id}
              />
            </div>
            {selectedReq && (
              <div className="lg:w-96 flex-shrink-0">
                <RequisitionDetail
                  requisition={selectedReq}
                  onClose={() => setSelectedReq(null)}
                  onStatusChange={(id, status) => { updateJobRequisitionStatus(id, status, currentUser?.name); setSelectedReq((prev) => prev?.id === id ? { ...prev, status } : prev); toast(`Requisition moved to ${status}.`); }}
                />
              </div>
            )}
          </div>
        </>
      )}

      {tab === "applicants" && (
        <div className="bg-white border border-stsn-beige rounded-xl shadow-sm overflow-hidden p-1">
          <STSNDataTable<JobApplicant>
            columns={applicantColumns}
            rows={jobApplicants}
            emptyMessage="No applicants found."
            pageLength={15}
          />
        </div>
      )}

      {showAddReq && <AddRequisitionModal onClose={() => setShowAddReq(false)} onSave={(data) => { addJobRequisition(data); toast("Job requisition created."); }} />}
      {showAddApplicant && (
        <AddApplicantModal
          onClose={() => setShowAddApplicant(false)}
          onSave={(data) => { addJobApplicant(data); toast("Applicant added."); }}
        />
      )}
    </div>
  );
}

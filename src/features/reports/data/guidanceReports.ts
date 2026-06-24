import type { ReportColumn, ReportRow } from "../types";
import type { Student } from "../../../types";

type IncidentType = "Behavior" | "Academic" | "Attendance" | "Social" | "Commendation" | "Disciplinary" | "Other";
type SessionType = "Individual" | "Group" | "Family" | "Crisis" | "Follow-up";
type ConcernArea = "Academic" | "Behavioral" | "Career" | "Personal/Social" | "Family" | "Peer Relationship" | "Crisis" | "Other";
type SessionStatus = "Scheduled" | "Completed" | "Cancelled" | "No-show";

export interface AnecdotalRecord {
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

export interface GuidanceSession {
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

export type GuidanceReportContext = {
  students: Student[];
  records: AnecdotalRecord[];
  sessions: GuidanceSession[];
};

export type GuidanceReportDefinition = {
  id: string;
  title: string;
  description: string;
  columns: ReportColumn[];
  buildRows: (context: GuidanceReportContext, search: string, typeFilter: string) => ReportRow[];
};

export const INCIDENT_TYPES: IncidentType[] = ["Behavior", "Academic", "Attendance", "Social", "Commendation", "Disciplinary", "Other"];
export const SESSION_STATUSES: SessionStatus[] = ["Scheduled", "Completed", "Cancelled", "No-show"];

function fullName(s: Student) {
  return `${s.lastName}, ${s.firstName}`;
}

function studentById(students: Student[], id: string) {
  return students.find((s) => s.id === id);
}

function matchesSearch(values: (string | undefined)[], q: string) {
  if (!q) return true;
  const lq = q.toLowerCase();
  return values.some((v) => v?.toLowerCase().includes(lq));
}

export const GUIDANCE_REPORTS: GuidanceReportDefinition[] = [
  {
    id: "anecdotal-records-report",
    title: "Anecdotal Records Report",
    description: "All anecdotal records with student name, date, incident type, description, and action taken.",
    columns: [
      { key: "studentName", label: "Student" },
      { key: "recordDate", label: "Date" },
      { key: "incidentType", label: "Incident Type" },
      { key: "description", label: "Description" },
      { key: "actionTaken", label: "Action Taken" },
      { key: "reportedBy", label: "Reported By" },
      { key: "followUpDate", label: "Follow-up Date" },
    ],
    buildRows: (context, search, typeFilter) =>
      context.records
        .filter((r) => {
          const stu = studentById(context.students, r.studentId);
          const name = stu ? fullName(stu) : "";
          const matchType = typeFilter === "All" || r.incidentType === typeFilter;
          return matchType && matchesSearch([name, r.description, r.reportedBy, r.incidentType], search);
        })
        .map((r) => {
          const stu = studentById(context.students, r.studentId);
          return {
            id: r.id,
            studentName: stu ? fullName(stu) : "Unknown",
            recordDate: r.recordDate,
            incidentType: r.incidentType,
            description: r.description,
            actionTaken: r.actionTaken || "—",
            reportedBy: r.reportedBy || "—",
            followUpDate: r.followUpDate || "—",
          };
        }),
  },
  {
    id: "counseling-sessions-report",
    title: "Counseling Sessions Report",
    description: "All guidance counseling sessions with student name, date, type, concern area, counselor, and status.",
    columns: [
      { key: "studentName", label: "Student" },
      { key: "sessionDate", label: "Date" },
      { key: "sessionType", label: "Session Type" },
      { key: "concernArea", label: "Concern Area" },
      { key: "status", label: "Status" },
      { key: "counselorName", label: "Counselor" },
    ],
    buildRows: (context, search, typeFilter) =>
      context.sessions
        .filter((s) => {
          const stu = studentById(context.students, s.studentId);
          const name = stu ? fullName(stu) : "";
          const matchType = typeFilter === "All" || s.status === typeFilter;
          return matchType && matchesSearch([name, s.concernArea, s.counselorName, s.sessionType], search);
        })
        .map((s) => {
          const stu = studentById(context.students, s.studentId);
          return {
            id: s.id,
            studentName: stu ? fullName(stu) : "Unknown",
            sessionDate: s.sessionDate,
            sessionType: s.sessionType,
            concernArea: s.concernArea,
            status: s.status,
            counselorName: s.counselorName || "—",
          };
        }),
  },
  {
    id: "student-incident-report",
    title: "Student Incident Report",
    description: "Anecdotal records grouped by incident type showing total count per category.",
    columns: [
      { key: "incidentType", label: "Incident Type" },
      { key: "count", label: "Count", align: "right" },
    ],
    buildRows: (context, search, typeFilter) => {
      const filtered = context.records.filter((r) => {
        const stu = studentById(context.students, r.studentId);
        const name = stu ? fullName(stu) : "";
        const matchType = typeFilter === "All" || r.incidentType === typeFilter;
        return matchType && matchesSearch([name, r.incidentType], search);
      });
      const counts = new Map<string, number>();
      filtered.forEach((r) => counts.set(r.incidentType, (counts.get(r.incidentType) ?? 0) + 1));
      return Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([type, count]) => ({ id: type, incidentType: type, count }));
    },
  },
  {
    id: "parent-conference-report",
    title: "Parent Conference Report",
    description: "Guidance sessions involving family or parent conferences.",
    columns: [
      { key: "studentName", label: "Student" },
      { key: "sessionDate", label: "Date" },
      { key: "concernArea", label: "Concern Area" },
      { key: "summary", label: "Summary" },
      { key: "counselorName", label: "Counselor" },
      { key: "status", label: "Status" },
    ],
    buildRows: (context, search, typeFilter) =>
      context.sessions
        .filter((s) => s.sessionType === "Family")
        .filter((s) => {
          const stu = studentById(context.students, s.studentId);
          const name = stu ? fullName(stu) : "";
          const matchType = typeFilter === "All" || s.status === typeFilter;
          return matchType && matchesSearch([name, s.concernArea, s.counselorName], search);
        })
        .map((s) => {
          const stu = studentById(context.students, s.studentId);
          return {
            id: s.id,
            studentName: stu ? fullName(stu) : "Unknown",
            sessionDate: s.sessionDate,
            concernArea: s.concernArea,
            summary: s.summary,
            counselorName: s.counselorName || "—",
            status: s.status,
          };
        }),
  },
];

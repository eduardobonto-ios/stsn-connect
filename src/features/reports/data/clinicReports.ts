import type { ReportColumn, ReportRow } from "../types";
import type { Student } from "../../../types";

type Disposition = "Released" | "Sent Home" | "Referred to Hospital" | "Observation" | "For Follow-up";

export interface ClinicVisit {
  id: string;
  studentId: string;
  visitDate: string;
  visitTime?: string;
  chiefComplaint: string;
  vitalSigns?: Record<string, string>;
  actionTaken?: string;
  disposition: Disposition;
  recordedBy?: string;
  notes?: string;
}

export interface HealthProfile {
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

export type ClinicReportContext = {
  students: Student[];
  visits: ClinicVisit[];
  profiles: HealthProfile[];
};

export type ClinicReportDefinition = {
  id: string;
  title: string;
  description: string;
  columns: ReportColumn[];
  buildRows: (context: ClinicReportContext, search: string, dispositionFilter: string) => ReportRow[];
};

export const DISPOSITIONS: Disposition[] = ["Released", "Sent Home", "Referred to Hospital", "Observation", "For Follow-up"];

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

export const CLINIC_REPORTS: ClinicReportDefinition[] = [
  {
    id: "clinic-visit-report",
    title: "Clinic Visit Report",
    description: "All student clinic visits with date, chief complaint, disposition, and recording staff.",
    columns: [
      { key: "studentName", label: "Student" },
      { key: "visitDate", label: "Visit Date" },
      { key: "visitTime", label: "Time" },
      { key: "chiefComplaint", label: "Chief Complaint" },
      { key: "disposition", label: "Disposition" },
      { key: "recordedBy", label: "Recorded By" },
    ],
    buildRows: (context, search, dispositionFilter) =>
      context.visits
        .filter((v) => {
          const stu = studentById(context.students, v.studentId);
          const name = stu ? fullName(stu) : "";
          const matchDisp = dispositionFilter === "All" || v.disposition === dispositionFilter;
          return matchDisp && matchesSearch([name, v.chiefComplaint, v.recordedBy], search);
        })
        .map((v) => {
          const stu = studentById(context.students, v.studentId);
          return {
            id: v.id,
            studentName: stu ? fullName(stu) : "Unknown",
            visitDate: v.visitDate,
            visitTime: v.visitTime || "—",
            chiefComplaint: v.chiefComplaint,
            disposition: v.disposition,
            recordedBy: v.recordedBy || "—",
          };
        }),
  },
  {
    id: "student-health-profile-report",
    title: "Student Health Profile Report",
    description: "Student health profiles with blood type, allergies, chronic conditions, and emergency contacts.",
    columns: [
      { key: "studentName", label: "Student" },
      { key: "bloodType", label: "Blood Type" },
      { key: "allergies", label: "Allergies" },
      { key: "chronicConditions", label: "Chronic Conditions" },
      { key: "emergencyContact", label: "Emergency Contact" },
      { key: "emergencyPhone", label: "Contact No." },
    ],
    buildRows: (context, search) =>
      context.profiles
        .filter((p) => {
          const stu = studentById(context.students, p.studentId);
          const name = stu ? fullName(stu) : "";
          return matchesSearch(
            [name, p.bloodType, p.allergies?.join(", "), p.chronicConditions?.join(", ")],
            search,
          );
        })
        .map((p) => {
          const stu = studentById(context.students, p.studentId);
          return {
            id: p.id,
            studentName: stu ? fullName(stu) : "Unknown",
            bloodType: p.bloodType || "—",
            allergies: p.allergies?.join(", ") || "—",
            chronicConditions: p.chronicConditions?.join(", ") || "—",
            emergencyContact: p.emergencyContact || "—",
            emergencyPhone: p.emergencyPhone || "—",
          };
        }),
  },
  {
    id: "medicine-issuance-report",
    title: "Medicine Issuance Report",
    description: "Clinic visits where medication or treatment was recorded in the action taken field.",
    columns: [
      { key: "studentName", label: "Student" },
      { key: "visitDate", label: "Visit Date" },
      { key: "chiefComplaint", label: "Chief Complaint" },
      { key: "actionTaken", label: "Action Taken / Medicine Given" },
      { key: "recordedBy", label: "Recorded By" },
    ],
    buildRows: (context, search) =>
      context.visits
        .filter((v) => v.actionTaken && v.actionTaken.trim() !== "")
        .filter((v) => {
          const stu = studentById(context.students, v.studentId);
          const name = stu ? fullName(stu) : "";
          return matchesSearch([name, v.chiefComplaint, v.actionTaken], search);
        })
        .map((v) => {
          const stu = studentById(context.students, v.studentId);
          return {
            id: v.id,
            studentName: stu ? fullName(stu) : "Unknown",
            visitDate: v.visitDate,
            chiefComplaint: v.chiefComplaint,
            actionTaken: v.actionTaken || "—",
            recordedBy: v.recordedBy || "—",
          };
        }),
  },
  {
    id: "medical-incident-report",
    title: "Medical Incident Report",
    description: "Visits where students were sent home, referred to a hospital, placed under observation, or scheduled for follow-up.",
    columns: [
      { key: "studentName", label: "Student" },
      { key: "visitDate", label: "Visit Date" },
      { key: "chiefComplaint", label: "Chief Complaint" },
      { key: "disposition", label: "Disposition" },
      { key: "actionTaken", label: "Action Taken" },
      { key: "recordedBy", label: "Recorded By" },
    ],
    buildRows: (context, search, dispositionFilter) => {
      const incidentDispositions: Disposition[] = ["Sent Home", "Referred to Hospital", "Observation", "For Follow-up"];
      return context.visits
        .filter((v) => incidentDispositions.includes(v.disposition))
        .filter((v) => {
          const stu = studentById(context.students, v.studentId);
          const name = stu ? fullName(stu) : "";
          const matchDisp = dispositionFilter === "All" || v.disposition === dispositionFilter;
          return matchDisp && matchesSearch([name, v.chiefComplaint, v.disposition], search);
        })
        .map((v) => {
          const stu = studentById(context.students, v.studentId);
          return {
            id: v.id,
            studentName: stu ? fullName(stu) : "Unknown",
            visitDate: v.visitDate,
            chiefComplaint: v.chiefComplaint,
            disposition: v.disposition,
            actionTaken: v.actionTaken || "—",
            recordedBy: v.recordedBy || "—",
          };
        });
    },
  },
];

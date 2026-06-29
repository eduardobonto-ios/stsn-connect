export type ParentPortalTab = "overview" | "academics" | "finance" | "documents";

export interface ParentTaskItem {
  id: string;
  title: string;
  description: string;
  tone: "warning" | "danger" | "info";
}

export interface ParentGradeRow {
  id: string;
  subjectCode: string;
  subjectName: string;
  schoolYear: string;
  semester: string;
  finalGrade: number | null;
  remarks: string;
}

export interface ParentPaymentRow {
  id: string;
  orNumber: string;
  paymentDate: string;
  term: string;
  paymentMethod: string;
  amount: number;
}

export interface ParentDocumentRow {
  id: string;
  name: string;
  status: string;
  verificationStatus: string;
  uploadStatus: string;
  submittedDate?: string;
}

export interface ParentScheduleRow {
  id: string;
  subjectName: string;
  subjectCode: string;
  teacherName: string;
  day: string;
  time: string;
  room: string;
}

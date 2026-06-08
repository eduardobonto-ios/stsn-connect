/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "REGISTRAR"
  | "ACCOUNTING"
  | "TEACHER"
  | "STUDENT"
  | "HR"
  | "EMPLOYEE";

export type SchoolId = "STSN" | "CDSTA";

export interface User {
  id: string;
  schoolId?: SchoolId; // undefined = access to all schools (SUPER_ADMIN)
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  avatarUrl?: string;
  department?: "Basic Education" | "College" | "Administration" | "Support";
}

export interface Student {
  id: string;
  schoolId?: SchoolId;
  studentNo: string;
  firstName: string;
  lastName: string;
  middleName: string;
  gender: "Male" | "Female";
  civilStatus: string;
  religion: string;
  nationality: string;
  birthday: string;
  birthplace: string;
  email: string;
  contactNo: string;
  address: string;
  province: string;
  municipality: string;
  zipCode: string;
  userId?: string;

  // Academic Background
  department: "Basic Education" | "College";
  yearLevel: string; // e.g., "Grade 11", "1st Year"
  trackOrCourse: string; // STEM, HUMSS, BSIT, etc.
  section: string;
  enrollmentStatus: "Pending" | "Enrolled" | "Approved" | "Draft" | "Rejected";
}

export interface Teacher {
  id: string;
  schoolId?: SchoolId;
  firstName: string;
  lastName: string;
  middleName: string;
  department: "Basic Education" | "College";
  email: string;
  phone: string;
  specialization: string;
  advisorySection?: string;
  isActive: boolean;
}

export interface Employee {
  id: string;
  schoolId?: SchoolId;
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  position: string;
  positionTitle?: string;
  department: "Basic Education" | "College" | "Accounting" | "Registrar" | "HR" | "Administration";
  salary: number;
  status: "Full-Time" | "Part-Time" | "Contractual";
  leaveBalance: number;
  contact?: string;
  address?: string;
  emergencyContact?: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  department: "Basic Education" | "College";
  durationYears: number;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  units: number;
  department: "Basic Education" | "College";
  yearLevel: string;
  semester: "First Semester" | "Second Semester" | "Full Year";
  trackOrCourse?: string; // STEM, BSIT, etc.
  prerequisites?: string[];
}

export interface Curriculum {
  id: string;
  courseCodeOrStrand: string;
  name: string;
  subjects: {
    yearLevel: string;
    semester: string;
    subjectCodes: string[];
  }[];
}

export interface Requirement {
  id: string;
  studentId: string;
  name: "PSA Birth Certificate" | "Good Moral Certificate" | "Transcript of Records (TOR)" | "Form 137 / SF9" | "ID Picture (2x2)";
  status: "Submitted" | "Pending" | "Rejected";
  submittedDate?: string;
  remarks?: string;
  // Document upload workflow
  uploadStatus?: "Uploaded" | "Not Uploaded";
  uploadFileName?: string;
  uploadDate?: string;
  verificationStatus?: "Pending" | "Verified" | "Rejected";
  verifiedBy?: string;
  verifiedAt?: string;
  hardcopySubmitted?: boolean;
  hardcopySubmittedDate?: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  schoolYear: string; // e.g., "2026-2027"
  semester: string; // "First Semester", "Second Semester" or "N/A"
  enrollmentType: "New Student" | "Old Student" | "Transferee" | "Returnee";
  status: "Pending" | "Enrolled" | "Approved" | "Rejected";
  submittedAt: string;
  subjectCodes: string[];
  assessmentId?: string;
}

export interface AssessmentFee {
  id: string;
  name: string;
  category: "Tuition" | "Miscellaneous" | "Laboratory" | "ID/Other";
  amount: number;
}

export interface StudentAssessment {
  id: string;
  studentId: string;
  schoolYear: string;
  semester: string;
  fees: { feeName: string; category: string; amount: number }[];
  totalAmount: number;
  discountPercentage: number;
  discountAmount: number;
  scholarshipName?: string;
  paymentTerm: "Cash Basis" | "Quarterly" | "Semestral" | "Installment - 2 Payments" | "Installment - 4 Payments";
  balance: number;
  isPaid?: boolean;
}

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: "Cash" | "Bank Transfer" | "GCash" | "Credit Card";
  orNumber: string; // Official Receipt Number
  term: "Downpayment" | "Midterm" | "Finals" | "Full Payment" | "Installment";
  remarks?: string;
}

export interface Grade {
  id: string;
  studentId: string;
  subjectCode: string;
  teacherId: string;
  schoolYear: string;
  semester: string;
  midtermGrade: number;
  finalGrade: number;
  remarks?: "Passed" | "Failed" | "Incomplete";
}

export interface Schedule {
  id: string;
  subjectCode: string;
  subjectName: string;
  teacherName: string;
  section: string;
  day: "Mon/Wed" | "Tue/Thu" | "Friday" | "Saturday" | "Mon/Wed/Fri" | "Tue/Thu/Fri";
  time: string; // e.g., "08:00 AM - 10:00 AM"
  room: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  category: "Academic" | "Event" | "Billing" | "General";
  author: string;
}

export interface SchoolEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  department?: "Basic Education" | "College" | "All";
}

export interface PayrollRow {
  id: string;
  employeeId: string;
  employeeName: string;
  position: string;
  basicSalary: number;
  allowances: number;
  sssDeduction: number;
  philhealthDeduction: number;
  pagibigDeduction: number;
  taxDeduction: number;
  netPay: number;
  period: string;
  status: "Paid" | "Pending";
}

// ============================================================
// CORE SETUP — Generic entity for all maintenance pages
// ============================================================
export interface SetupItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  sortOrder?: number;
  [key: string]: any;
}

// ============================================================
// DISCOUNT MANAGEMENT
// ============================================================
export interface DiscountType {
  id: string;
  code: string;
  name: string;
  discountPercent: number;
  discountSource: "Government" | "Sibling" | "Owner" | "Scholarship" | "Employee" | "Other";
  requiresApproval: boolean;
  maxBeneficiaries?: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  action: string;
  performedBy: string;
  performedAt: string;
  details?: string;
}

export interface DiscountRequest {
  id: string;
  referenceNo: string;
  studentId: string;
  studentName: string;
  studentNo: string;
  discountTypeId: string;
  discountTypeName: string;
  discountPercent: number;
  requestedBy: string;
  requestedAt: string;
  status: "Pending" | "For Review" | "Approved" | "Rejected";
  siblingStudentIds?: string[];
  siblingNames?: string[];
  level1Status?: "Pending" | "Approved" | "Rejected";
  level1ApprovedBy?: string;
  level1ApprovedAt?: string;
  level2Status?: "Pending" | "Approved" | "Rejected";
  level2ApprovedBy?: string;
  level2ApprovedAt?: string;
  remarks?: string;
  attachmentNames?: string[];
  auditTrail: AuditEntry[];
}

// ============================================================
// CLASS SCHEDULING
// ============================================================
export interface ClassSchedule {
  id: string;
  schoolId?: SchoolId;
  subjectCode: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  section: string;
  roomName: string;
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";
  startTime: string;
  endTime: string;
  schoolYear: string;
  semester: string;
  isActive: boolean;
  department: "Basic Education" | "College";
  yearLevel?: string;
  courseOrTrack?: string;
  notes?: string;
}

// ============================================================
// CLASS SECTIONING — Master Section Repository
// ============================================================
export interface SchoolSection {
  id: string;
  schoolId?: SchoolId;
  code: string;
  name: string;
  department: "Basic Education" | "College";
  yearLevel: string;
  strandOrTrack?: string;
  adviserId?: string;
  adviserName?: string;
  capacity: number;
  currentCount: number;
  academicYear: string;
  semester?: string;
  isActive: boolean;
  createdAt: string;
  enrolledStudentIds?: string[];
}

// ============================================================
// ROOM MANAGEMENT
// ============================================================
export interface Room {
  id: string;
  schoolId?: SchoolId;
  code: string;
  name: string;
  building?: string;
  floor?: string;
  capacity: number;
  type: "Classroom" | "Laboratory" | "Gymnasium" | "Auditorium" | "Office" | "Other";
  isActive: boolean;
  status: "Available" | "Under Maintenance" | "Reserved";
}

// ============================================================
// ONLINE LEARNING / LMS
// ============================================================
export interface LearningMaterial {
  id: string;
  schoolId: SchoolId;
  title: string;
  description: string;
  subjectCode: string;
  subjectName: string;
  section: string;
  teacherId: string;
  teacherName: string;
  learningType: "Video" | "Module" | "Document";
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  publishStatus: "Published" | "Draft";
  uploadDate: string;
  department: "Basic Education" | "College";
  yearLevel?: string;
  trackOrCourse?: string;
  tags?: string[];
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AcademicUnit } from "./school.types";

export type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "REGISTRAR"
  | "ACCOUNTING"
  | "TEACHER"
  | "STUDENT"
  | "HR"
  | "EMPLOYEE"
  | "CASHIER"
  | "GUIDANCE"
  | "NURSE";

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
  /** Links this teacher record to its login account (User.id) — preferred over email matching. */
  userId?: string;
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
  // Phase 2 — lifecycle fields (migration 0020)
  employeeNo?: string;
  userId?: string;
  employmentStatus?: string;
  hireDate?: string;
  regularizationDate?: string;
  separationDate?: string;
  separationReason?: string;
  supervisorId?: string;
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
  uploadFilePath?: string;
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
  schoolId?: SchoolId;
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
  financialHoldStatus?: "None" | "Hold" | "Cleared";
  lastPaymentDate?: string;

  // ============================================================
  // ACCOUNTING APPROVAL WORKFLOW (additive, optional)
  // Cashier may only collect payment when approvalStatus === "Approved for Payment".
  // ============================================================
  /** Books apply to Basic Education only — Accounting approves/returns the whole assessment, never individual books. */
  booksAvailed?: boolean;
  bookPackageId?: string;
  /** Accounting approval workflow status. Undefined = not yet submitted for approval. */
  approvalStatus?: "Pending Accounting Approval" | "Approved for Payment" | "Returned to Registrar" | "Rejected";
  submittedBy?: string;
  submittedDate?: string;
  registrarRemarks?: string;
  accountingRemarks?: string;
  approvedBy?: string;
  approvedDate?: string;
  auditTrail?: AuditEntry[];
}

export interface Payment {
  id: string;
  schoolId?: SchoolId;
  studentId: string;
  assessmentId?: string; // links payment to a specific assessment (prevents balance deducted from all)
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  orNumber: string; // Official Receipt Number
  term: string;
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
  // Enterprise policy fields (Phase 2 foundation — optional, prototype-friendly)
  effectiveSchoolYear?: string;
  applicableAcademicUnit?: AcademicUnit | "both";
  appliesTo?: "Tuition" | "Miscellaneous" | "Laboratory" | "Total Assessment";
  discountBasis?: "Percentage" | "Fixed Amount";
  discountFixedAmount?: number;
  isStackable?: boolean;
  requiresDocument?: boolean;
  maxAmount?: number;
  glCode?: string;
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
  status: "Pending" | "For Review" | "Approved" | "Rejected" | "Returned for Documents" | "Cancelled" | "Expired";
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
// ============================================================
// ACCOUNTING — Foundation types (Phase 2)
// ============================================================
export type AccountingTab = "dashboard" | "ledger" | "discounts" | "billing" | "holds" | "reports";

export interface AccountingKpi {
  id: string;
  label: string;
  value: string | number;
  hint?: string;
}

export interface LedgerTransaction {
  id: string;
  studentId: string;
  date: string;
  description: string;
  type: "Assessment" | "Payment" | "Discount" | "Adjustment";
  debit: number;
  credit: number;
  balance: number;
  reference?: string;
}

export interface StudentLedgerSummary {
  studentId: string;
  schoolYear: string;
  totalAssessed: number;
  totalPaid: number;
  discountApplied: number;
  balance: number;
  financialHoldStatus: "None" | "Hold" | "Cleared";
  clearanceStatus: "Cleared" | "Not Cleared";
  lastPaymentDate?: string;
}

export interface FinancialHold {
  id: string;
  studentId: string;
  studentName: string;
  studentNo: string;
  holdType: "Enrollment" | "COR" | "Exam Permit" | "Transcript" | "Graduation Clearance" | "Transfer Credentials";
  /** Root-cause category for the hold (distinct from the blocked process above). */
  holdCategory?: "Unpaid Balance" | "Missing Payment" | "Registrar Hold" | "Incomplete Documents" | "Returned Payment";
  reason: string;
  balanceAmount: number;
  createdBy: string;
  createdAt: string;
  status: "Active" | "Cleared";
  clearedBy?: string;
  clearedAt?: string;
  clearanceRemarks?: string;
}

export interface AssessmentBillingSummary {
  id: string;
  studentId: string;
  studentName: string;
  studentNo: string;
  schoolYear: string;
  semester: string;
  academicUnit: AcademicUnit;
  feeTemplateName: string;
  totalAssessment: number;
  amountDue: number;
  balance: number;
  status: "Draft" | "Pending Approval" | "Approved" | "Voided";
}

export interface PaymentCollectionSummary {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  paymentMethod: Payment["paymentMethod"];
  referenceNo: string;
  paymentDate: string;
  cashier: string;
  term: string;
  verificationStatus: "Verified" | "Pending Verification" | "Voided";
}

// ============================================================
// BOOKS SETUP — Basic Education book package configuration
// ============================================================
/**
 * A single book line item within a BookPackage.
 * Students cannot select individual books — these are display-only,
 * the package as a whole is added/removed as one unit.
 */
export interface BookPackageItem {
  id: string;
  title: string;
  subjectCode?: string;
  quantity: number;
  unitPrice: number;
}

export interface BookPackage {
  id: string; // packageId, e.g. "bp-grade1"
  packageName: string;
  gradeLevel: string; // e.g. "Grade 1" — Basic Education only
  schoolId: SchoolId;
  academicUnit: AcademicUnit; // always "basic-ed"
  schoolYear: string; // effective school year, e.g. "2026-2027"
  books: BookPackageItem[];
  totalAmount: number;
  isRequired: boolean;
  status: "Active" | "Inactive";
  lastUpdated: string;
  updatedBy?: string;
}

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

// ============================================================
// HR MODULE — Phase 2: Employee Life Cycle
// ============================================================
export interface EmployeeLifecycleEvent {
  id: string;
  employeeId: string;
  eventType: string;
  fromStatus?: string;
  toStatus?: string;
  effectiveDate: string;
  remarks?: string;
  createdBy?: string;
  createdAt: string;
}

// ============================================================
// HR MODULE — Phase 3: Shift, Time, Attendance, Leave
// ============================================================
export interface ShiftTemplate {
  id: string;
  schoolId?: SchoolId;
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  isOvernight: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface EmployeeShiftAssignment {
  id: string;
  employeeId: string;
  shiftTemplateId: string;
  effectiveFrom: string;
  effectiveTo?: string;
  restDays: string[];
  createdAt: string;
}

export interface EmployeeTimeLog {
  id: string;
  employeeId: string;
  logDate: string;
  timeIn?: string;
  timeOut?: string;
  source: "Biometric" | "Manual" | "System";
  isApproved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  remarks?: string;
  createdAt: string;
}

export interface EmployeeAttendance {
  id: string;
  employeeId: string;
  attendanceDate: string;
  timeIn?: string;
  timeOut?: string;
  status: "Present" | "Late" | "Undertime" | "Absent" | "On Leave" | "Official Business" | "Holiday" | "Rest Day" | "Half Day";
  lateMinutes: number;
  undertimeMinutes: number;
  overtimeMinutes: number;
  remarks?: string;
  createdAt: string;
}

export interface LeaveType {
  id: string;
  code: string;
  name: string;
  isPaid: boolean;
  defaultCredits: number;
  maxDaysPerRequest?: number;
  requiresApproval: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason?: string;
  status: "Draft" | "Submitted" | "For Approval" | "Approved" | "Rejected" | "Cancelled";
  approvedBy?: string;
  approvedAt?: string;
  remarks?: string;
  createdAt: string;
}

// ============================================================
// HR MODULE — Phase 4: Payroll, Payouts, Taxes, Benefits
// ============================================================
export interface PayrollPeriod {
  id: string;
  schoolId?: SchoolId;
  periodCode: string;
  label?: string;
  startDate: string;
  endDate: string;
  payoutDate?: string;
  status: "Open" | "Locked" | "Closed";
  createdAt: string;
}

export interface PayrollRun {
  id: string;
  schoolId?: SchoolId;
  payrollPeriodId: string;
  runNo: string;
  status: "Draft" | "Computed" | "For Review" | "Approved" | "Released" | "Cancelled";
  computedBy?: string;
  approvedBy?: string;
  computedAt?: string;
  approvedAt?: string;
  notes?: string;
  createdAt: string;
}

export interface PayrollLine {
  id: string;
  payrollRunId: string;
  employeeId: string;
  basicPay: number;
  allowances: number;
  overtimePay: number;
  lateDeduction: number;
  undertimeDeduction: number;
  absenceDeduction: number;
  sssDeduction: number;
  philhealthDeduction: number;
  pagibigDeduction: number;
  withholdingTax: number;
  otherDeductions: number;
  otherAllowances: number;
  grossPay: number;
  netPay: number;
  status: "Computed" | "For Review" | "Approved" | "Released" | "Cancelled";
  createdAt: string;
}

export interface SalaryPayoutBatch {
  id: string;
  payrollRunId: string;
  payoutNo: string;
  payoutMethod: "Bank Transfer" | "Cash" | "Check";
  status: "Pending" | "Queued" | "Released" | "Failed" | "Cancelled";
  releasedBy?: string;
  releasedAt?: string;
  notes?: string;
  createdAt: string;
}

export interface SalaryPayoutLine {
  id: string;
  payoutBatchId: string;
  payrollLineId: string;
  employeeId: string;
  amount: number;
  referenceNo?: string;
  status: "Pending" | "Released" | "Failed" | "Cancelled";
  releasedAt?: string;
  createdAt: string;
}

export interface BenefitPlan {
  id: string;
  code: string;
  name: string;
  category: "Statutory" | "Company Benefit" | "Allowance" | "Deduction";
  employeeShareType: "Fixed" | "Percentage" | "Configured";
  employeeShareValue: number;
  employerShareType: "Fixed" | "Percentage" | "Configured";
  employerShareValue: number;
  isTaxable: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface TaxTable {
  id: string;
  effectiveYear: number;
  name: string;
  frequency: "Monthly" | "Semi-Monthly" | "Annual";
  isActive: boolean;
  createdAt: string;
  brackets?: TaxBracket[];
}

export interface TaxBracket {
  id: string;
  taxTableId: string;
  incomeFrom: number;
  incomeTo?: number;
  baseTax: number;
  rateAbove: number;
  createdAt: string;
}

// ---- HR Phase 5: Recruitment & Onboarding ----

export interface JobRequisition {
  id: string;
  schoolId?: string;
  requisitionNo: string;
  positionTitle: string;
  department: string;
  employmentType: "Full-Time" | "Part-Time" | "Contractual";
  headCount: number;
  reason?: string;
  targetStartDate?: string;
  status: "Draft" | "Approved" | "Posted" | "Screening" | "Interview" | "Offered" | "Closed" | "Cancelled";
  requestedBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

export interface JobApplicant {
  id: string;
  jobRequisitionId?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email?: string;
  contact?: string;
  address?: string;
  resumeUrl?: string;
  appliedAt: string;
  status: "For Screening" | "For Interview" | "For Assessment" | "Offered" | "Hired" | "Rejected" | "Withdrew";
  hiredEmployeeId?: string;
  notes?: string;
  createdAt: string;
}

export interface ApplicantInterview {
  id: string;
  applicantId: string;
  scheduledAt: string;
  interviewType: "Initial" | "Technical" | "Final" | "HR" | "Panel";
  interviewer?: string;
  result?: "Passed" | "Failed" | "No Show" | "Pending";
  remarks?: string;
  createdAt: string;
}

export interface OnboardingTemplate {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface OnboardingTask {
  id: string;
  templateId: string;
  taskName: string;
  description?: string;
  responsibleParty?: string;
  dueDayOffset: number;
  isRequired: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface EmployeeOnboardingTask {
  id: string;
  employeeId: string;
  onboardingTaskId: string;
  dueDate?: string;
  status: "Pending" | "In Progress" | "Completed" | "Skipped" | "Overdue";
  completedAt?: string;
  completedBy?: string;
  notes?: string;
  createdAt: string;
}

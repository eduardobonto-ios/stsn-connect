/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from "zustand";
import {
  createApprovalRequest,
  submitApprovalRequest,
  approveStep as awApproveStep,
  returnRequest as awReturnRequest,
  rejectRequest as awRejectRequest,
  cancelRequest as awCancelRequest,
  findApprovalRequestByEntity,
  type WorkflowType,
} from "./approvalWorkflowService";
import {
  User,
  Student,
  Teacher,
  Employee,
  Course,
  Subject,
  Curriculum,
  Requirement,
  Enrollment,
  StudentAssessment,
  Payment,
  Grade,
  Schedule,
  Announcement,
  SchoolEvent,
  PayrollRow,
  SetupItem,
  DiscountType,
  DiscountRequest,
  AuditEntry,
  ClassSchedule,
  LearningMaterial,
  SchoolId,
  SchoolSection,
  Room,
  BookPackage,
  StudentLedgerSummary,
  LedgerTransaction,
  FinancialHold,
  AssessmentBillingSummary,
  PaymentCollectionSummary,
  EmployeeLifecycleEvent,
  ShiftTemplate,
  EmployeeShiftAssignment,
  EmployeeTimeLog,
  EmployeeAttendance,
  LeaveType,
  LeaveRequest,
  PayrollPeriod,
  PayrollRun,
  PayrollLine,
  SalaryPayoutBatch,
  SalaryPayoutLine,
  BenefitPlan,
  StatutoryContributionRule,
  TaxTable,
  TaxBracket,
  JobRequisition,
  JobApplicant,
  ApplicantInterview,
  OnboardingTemplate,
  OnboardingTask,
  EmployeeOnboardingTask,
  OnlineEnrollmentApplication,
  VoidRequest,
  CashVoucher,
  STSNNotification,
  AuditLogEntry,
  AuditEntityType,
  AuditAction,
  ApprovalDelegation,
  DelegationScope,
  StudentGuardianContact,
  StudentEducationBackground,
  EmployeeProfileContact,
  EmployeeEducationBackground,
  EmployeeLicenseCertification,
  EmployeeDocumentRecord,
  StudentInvoice,
  InvoiceLine,
  PaymentPlan,
  PaymentPlanInstallment,
  StudentReceipt,
  ReceiptAllocation,
  DirectCollectionLine,
  UnappliedCredit,
  AllocationReallocationRequest,
} from "../types";
import type { AcademicUnit } from "../types/school.types";
import { getAcademicUnit } from "../config/schools.config";
import type { GradePeriod, StudentGradeEntry, SubjectClassLoad, GradeRosterStudent, GradeItem, GradeCategory } from "../types/grading";
import { supabase } from "../lib/supabase";
import { loadAllData } from "./dataLoader";
import { newId, dbInsert, dbInsertReturning, dbUpdate, dbDelete, dbDeleteWhere, toCamel } from "./supabaseCrud";
import { resolveSchoolId, resolveSubjectId, subjectCodeToId } from "./idMaps";
import { loadSecurityCatalog, computeEffectivePermissions, getPrimaryRoleCode } from "./securityPermissionService";
import { EMPTY_SECURITY_CATALOG } from "../types/security-permissions.types";
import type { SecurityCatalog, EffectivePermissions } from "../types/security-permissions.types";

const nowStamp = () => new Date().toISOString().replace("T", " ").substring(0, 16);
const todayStamp = () => new Date().toISOString().split("T")[0];
const financeMaintenanceError = () =>
  new Error("Student finance is in maintenance mode. Posting will reopen after reconciliation.");
const AUTH_SESSION_STORAGE_KEY = "stsn.currentSession";
interface StoredAuthSession {
  userId: string;
  activeSchool?: SchoolId | "ALL";
}

const readStoredAuthSession = (): StoredAuthSession | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredAuthSession) : null;
  } catch {
    return null;
  }
};

const writeStoredAuthSession = (session: StoredAuthSession) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Ignore storage failures; login should still work for the active tab.
  }
};

const clearStoredAuthSession = () => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
};
const FINANCE_REALTIME_TABLES = [
  "assessments",
  "assessment_fees",
  "enrollments",
  "students",
  "student_payment_term_templates",
  "student_payment_term_template_installments",
  "discount_types",
  "discount_requests",
  "discount_request_audit_trail",
  "student_finance_adjustments",
  "financial_holds",
  "student_finance_invoices",
  "student_finance_invoice_lines",
  "student_invoice_payment_plans",
  "student_invoice_installments",
  "student_receipts",
  "student_receipt_allocations",
  "student_direct_collection_lines",
  "student_allocation_reversals",
  "student_allocation_reallocation_requests",
  "student_receipt_void_requests",
  "student_receipt_journal_links",
] as const;

let financeRealtimeChannel: ReturnType<typeof supabase.channel> | null = null;
let financeRefreshTimer: ReturnType<typeof setTimeout> | null = null;
let financeReconnectTimer: ReturnType<typeof setTimeout> | null = null;
let financeReconnectAttempt = 0;

type FinanceRealtimeStatus = "disconnected" | "connecting" | "connected" | "reconnecting";

const ensureFinanceRealtimeSubscription = (
  refresh: () => void,
  onStatus: (status: FinanceRealtimeStatus) => void,
) => {
  if (financeRealtimeChannel) return;
  onStatus(financeReconnectAttempt > 0 ? "reconnecting" : "connecting");
  const scheduleRefresh = () => {
    if (financeRefreshTimer) clearTimeout(financeRefreshTimer);
    financeRefreshTimer = setTimeout(refresh, 250);
  };
  let channel = supabase.channel("student-finance-sync");
  for (const table of FINANCE_REALTIME_TABLES) {
    channel = channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table },
      scheduleRefresh,
    );
  }
  financeRealtimeChannel = channel.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      financeReconnectAttempt = 0;
      onStatus("connected");
      return;
    }
    if (!["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(status)) return;
    console.error(`[finance-realtime] subscription ${status}; reconnecting`);
    onStatus("reconnecting");
    const failedChannel = financeRealtimeChannel;
    financeRealtimeChannel = null;
    if (failedChannel) void supabase.removeChannel(failedChannel);
    if (financeReconnectTimer) clearTimeout(financeReconnectTimer);
    const delay = Math.min(30_000, 1_000 * 2 ** financeReconnectAttempt++);
    financeReconnectTimer = setTimeout(
      () => ensureFinanceRealtimeSubscription(refresh, onStatus),
      delay,
    );
  });
};

interface STSNState {
  isLoading: boolean;
  financeWritesEnabled: boolean;
  financeRealtimeStatus: FinanceRealtimeStatus;
  currentUser: User | null;
  /** RBAC catalog (security_* tables), loaded once on initialize. */
  securityCatalog: SecurityCatalog;
  /** Effective permissions resolved for the signed-in user (null when logged out). */
  effectivePermissions: EffectivePermissions | null;
  /** Reloads the RBAC catalog and recomputes the current user's effective set. */
  reloadSecurityPermissions: () => Promise<void>;
  activeSchool: SchoolId | "ALL";
  /** Academic unit derived from activeSchool — drives academic structure & workflow behavior (never role-driven). */
  academicUnit: AcademicUnit;
  schools: { id: string; uuid: string; name: string; shortName: string; location: string; academicUnit: string; brandingLabel: string; supportedRoles: string[] }[];
  users: User[];
  students: Student[];
  teachers: Teacher[];
  employees: Employee[];
  courses: Course[];
  subjects: Subject[];
  curriculums: Curriculum[];
  requirements: Requirement[];
  enrollments: Enrollment[];
  onlineEnrollmentApplications: OnlineEnrollmentApplication[];
  assessments: StudentAssessment[];
  payments: Payment[];
  studentInvoices: StudentInvoice[];
  invoiceLines: InvoiceLine[];
  paymentPlans: PaymentPlan[];
  paymentPlanInstallments: PaymentPlanInstallment[];
  studentReceipts: StudentReceipt[];
  receiptAllocations: ReceiptAllocation[];
  directCollectionLines: DirectCollectionLine[];
  unappliedCredits: UnappliedCredit[];
  allocationReallocationRequests: AllocationReallocationRequest[];
  grades: Grade[];
  schedules: Schedule[];
  announcements: Announcement[];
  events: SchoolEvent[];
  payroll: PayrollRow[];
  setupData: Record<string, SetupItem[]>;
  discountTypes: DiscountType[];
  discountRequests: DiscountRequest[];
  voidRequests: VoidRequest[];
  cashVouchers: CashVoucher[];
  notifications: STSNNotification[];
  classSchedules: ClassSchedule[];
  learningMaterials: LearningMaterial[];
  sections: SchoolSection[];
  rooms: Room[];
  bookPackages: BookPackage[];
  studentLedgerSummaries: StudentLedgerSummary[];
  ledgerTransactions: LedgerTransaction[];
  financialHolds: FinancialHold[];
  assessmentBillingSummaries: AssessmentBillingSummary[];
  paymentCollectionSummaries: PaymentCollectionSummary[];
  promissoryNotes: { id: string; studentId: string; amount: number; dueDate: string; status: string }[];
  classLoads: SubjectClassLoad[];
  gradePeriods: GradePeriod[];
  studentGradeEntries: StudentGradeEntry[];
  demoStudents: GradeRosterStudent[];
  activityLogs: { id: string; action: string; subject: string; type: string; time?: string }[];
  enrollmentHistoryStats: { year: string; stsn: number; cdsta: number }[];
  tuitionFeeSchedule: { yearLevel: string; tuition: number; lab: number; computer: number; label: string }[];
  miscFeeSchedule: { feeName: string; category: "Miscellaneous"; amount: number; isRequired: boolean; note?: string }[];
  labFeeAdjustments: { scope: "SHS" | "College"; programCode: string; amount: number }[];
  discountOptions: { id: string; label: string; percentage: number; badge?: string }[];
  paymentTermOptions: { term: string; description: string }[];
  studentGuardians: StudentGuardianContact[];
  studentEducationBackgrounds: StudentEducationBackground[];
  employeeProfileContacts: EmployeeProfileContact[];
  employeeEducationBackgrounds: EmployeeEducationBackground[];
  employeeLicenseCertifications: EmployeeLicenseCertification[];
  employeeDocuments: EmployeeDocumentRecord[];

  // HR Phase 2-4
  employeeLifecycleEvents: EmployeeLifecycleEvent[];
  shiftTemplates: ShiftTemplate[];
  employeeShiftAssignments: EmployeeShiftAssignment[];
  employeeTimeLogs: EmployeeTimeLog[];
  employeeAttendance: EmployeeAttendance[];
  leaveTypes: LeaveType[];
  leaveRequests: LeaveRequest[];
  payrollPeriods: PayrollPeriod[];
  payrollRuns: PayrollRun[];
  payrollLines: PayrollLine[];
  salaryPayoutBatches: SalaryPayoutBatch[];
  salaryPayoutLines: SalaryPayoutLine[];
  benefitPlans: BenefitPlan[];
  statutoryContributionRules: StatutoryContributionRule[];
  taxTables: TaxTable[];
  taxBrackets: TaxBracket[];
  // HR Phase 5
  jobRequisitions: JobRequisition[];
  jobApplicants: JobApplicant[];
  applicantInterviews: ApplicantInterview[];
  onboardingTemplates: OnboardingTemplate[];
  onboardingTasks: OnboardingTask[];
  employeeOnboardingTasks: EmployeeOnboardingTask[];

  // P4-F: Central Audit Log
  auditLog: AuditLogEntry[];
  logAudit: (
    action: AuditAction,
    entityType: AuditEntityType,
    entityId: string,
    prev?: Record<string, unknown>,
    next?: Record<string, unknown>,
    remarks?: string,
  ) => void;

  // P4-D: Approval Delegations
  delegations: ApprovalDelegation[];
  addDelegation: (delegation: Omit<ApprovalDelegation, "id" | "createdAt">) => void;
  revokeDelegation: (id: string) => void;
  getActiveDelegation: (scope: DelegationScope, delegateId: string) => ApprovalDelegation | undefined;

  // Bootstrap
  initialize: () => Promise<void>;
  reloadFinanceData: () => Promise<void>;

  // Actions
  login: (email: string, password: string, schoolContext?: SchoolId) => Promise<boolean>;
  logout: () => Promise<void>;

  // Registrar Actions
  addStudent: (student: Omit<Student, "id" | "studentNo">) => Promise<Student>;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  updateStudentRequirements: (studentId: string, reqName: string, status: "Submitted" | "Pending" | "Rejected") => void;
  ensureStudentRequirements: (studentId: string) => void;
  approveEnrollment: (enrollmentId: string, section: string) => void;
  rejectEnrollment: (enrollmentId: string) => void;
  submitNewEnrollment: (enrollment: Omit<Enrollment, "id">) => Promise<Enrollment>;
  updateEnrollmentStatus: (enrollmentId: string, status: Enrollment["status"]) => void;
  updateOnlineEnrollmentApplicationStatus: (applicationId: string, status: OnlineEnrollmentApplication["status"]) => void;
  acceptOnlineEnrollmentApplication: (applicationId: string) => Promise<void>;

  // Accounting Actions
  addAssessment: (assessment: StudentAssessment) => Promise<void>;
  updateAssessment: (id: string, updates: Partial<StudentAssessment>) => Promise<void>;
  addPayment: (payment: Omit<Payment, "id" | "paymentDate">) => Promise<Payment>;
  postStudentReceipt: (input: {
    schoolId?: SchoolId;
    studentId: string;
    amount: number;
    paymentMethod: string;
    receiptNo: string;
    allocations: { invoiceId: string; amount: number }[];
    directCollections?: { category: string; amount: number; description?: string }[];
    allowUnappliedCredit?: boolean;
    remarks?: string;
  }) => Promise<StudentReceipt>;
  applyUnappliedCredit: (
    receiptId: string,
    allocations: { invoiceId: string; amount: number }[],
  ) => Promise<void>;
  submitAllocationReallocation: (
    allocationId: string,
    destinationInvoiceId: string,
    amount: number,
    reason: string,
  ) => Promise<void>;
  reviewAllocationReallocation: (
    requestId: string,
    approved: boolean,
    remarks?: string,
  ) => Promise<void>;
  postStudentAdjustment: (
    assessmentId: string,
    amount: number,
    direction: "debit" | "credit",
    description: string,
    entryType?: "Adjustment" | "Discount",
  ) => Promise<void>;
  setAssessmentHold: (assessmentId: string, status: "None" | "Hold" | "Cleared") => Promise<void>;
  setFinancialHoldStatus: (holdId: string, status: "Active" | "Cleared", remarks?: string) => Promise<void>;

  // Accounting Approval Workflow Actions
  approveAssessment: (assessmentId: string, approvedBy: string, remarks?: string) => Promise<void>;
  returnAssessmentToRegistrar: (assessmentId: string, performedBy: string, remarks: string) => Promise<void>;
  rejectAssessment: (assessmentId: string, performedBy: string, remarks: string) => Promise<void>;

  // Grading Actions
  saveGrade: (studentId: string, subjectCode: string, midterm: number, final: number) => void;
  saveGradeEntry: (studentId: string, gradeItemId: string, score: number | null) => void;
  addGradeItem: (periodId: string, item: GradeItem, categoryWeight: number) => void;
  updateGradeCategories: (periodId: string, categories: GradeCategory[]) => void;
  finalizeGradePeriod: (periodId: string, finalizedBy: string) => void;

  // Human Resource & Admin Actions
  addEmployee: (employee: Omit<Employee, "id">) => Employee;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  updateTeacher: (id: string, updates: Partial<Teacher>) => void;
  // Tags an employee as teaching staff/faculty by upserting employee_faculty_profiles.
  // Does not require an existing Teacher record or public.teachers row (Phase 6 prep).
  upsertEmployeeFacultyProfile: (
    employeeId: string,
    profile: {
      isTeachingStaff?: boolean;
      specialization?: string;
      advisorySection?: string;
      facultyRank?: string | null;
    },
  ) => void;
  addPayrollRow: (payrollRow: PayrollRow) => void;
  markPaidPayroll: (id: string) => void;
  processGlobalPayroll: () => void;

  // Users Management
  toggleUserStatus: (id: string) => Promise<void>;

  // Academic Management
  addAnnouncement: (announcement: Omit<Announcement, "id" | "date">) => void;

  // Course management actions
  addCourse: (course: Omit<Course, "id">) => void;
  updateCourse: (id: string, updates: Partial<Course>) => void;
  deleteCourse: (id: string) => void;

  // Subject management actions
  addSubject: (subject: Omit<Subject, "id">) => void;
  updateSubject: (id: string, updates: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;

  // Curriculum management actions
  addCurriculum: (curriculum: Omit<Curriculum, "id">) => void;
  updateCurriculum: (id: string, updates: Partial<Curriculum>) => void;
  deleteCurriculum: (id: string) => void;

  // Core Setup actions (generic CRUD)
  addSetupItem: (category: string, item: Omit<SetupItem, "id" | "createdAt">) => SetupItem;
  updateSetupItem: (category: string, id: string, updates: Partial<SetupItem>) => void;
  deleteSetupItem: (category: string, id: string) => void;
  toggleSetupItemActive: (category: string, id: string) => void;

  // Discount Management actions
  addDiscountType: (dt: Omit<DiscountType, "id" | "createdAt">) => Promise<void>;
  updateDiscountType: (id: string, updates: Partial<DiscountType>) => Promise<void>;
  deleteDiscountType: (id: string) => Promise<void>;
  toggleDiscountTypeActive: (id: string) => Promise<void>;
  addDiscountRequest: (req: Omit<DiscountRequest, "id" | "referenceNo" | "requestedAt" | "auditTrail">) => Promise<DiscountRequest>;
  approveDiscountRequest: (id: string, level: 1 | 2, approvedBy: string, remarks?: string) => Promise<void>;
  rejectDiscountRequest: (id: string, level: 1 | 2, approvedBy: string, remarks?: string) => Promise<void>;

  // Payment Void Approval Workflow
  submitVoidRequest: (req: Omit<VoidRequest, "id" | "requestedAt" | "status">) => Promise<VoidRequest>;
  approveVoidRequest: (id: string, reviewedBy: string, remarks?: string) => Promise<void>;
  rejectVoidRequest: (id: string, reviewedBy: string, remarks: string) => Promise<void>;

  // Cash Voucher Release Workflow
  submitCashVoucherRequest: (req: Omit<CashVoucher, "id" | "requestedAt" | "status">) => CashVoucher;
  approveCashVoucher: (id: string, reviewedBy: string, remarks?: string) => void;
  rejectCashVoucher: (id: string, reviewedBy: string, remarks: string) => void;
  releaseCashVoucher: (id: string, releasedBy: string, referenceNo?: string) => void;

  // Notification Actions
  addNotification: (n: Omit<STSNNotification, "id" | "createdAt" | "readBy">) => void;
  markNotificationRead: (id: string, userId: string) => void;
  clearAllNotifications: () => void;

  // Grade submission workflow
  submitGradePeriod: (periodId: string, submittedBy: string) => void;
  approveGradePeriod: (periodId: string, approvedBy: string) => void;
  returnGradePeriod: (periodId: string, returnedBy: string, remarks: string) => void;

  // Class Scheduling actions
  addClassSchedule: (schedule: Omit<ClassSchedule, "id">) => ClassSchedule;
  updateClassSchedule: (id: string, updates: Partial<ClassSchedule>) => void;
  deleteClassSchedule: (id: string) => void;
  toggleClassScheduleActive: (id: string) => void;
  assignSectionAdviser: (sectionId: string, teacherId: string | null) => void;

  // Multi-school actions
  setActiveSchool: (school: SchoolId | "ALL") => void;

  // LMS actions
  addLearningMaterial: (material: Omit<LearningMaterial, "id">) => LearningMaterial;
  updateLearningMaterial: (id: string, updates: Partial<LearningMaterial>) => void;
  deleteLearningMaterial: (id: string) => void;
  toggleLearningMaterialPublish: (id: string) => void;

  // HR Excel import
  bulkImportEmployees: (employees: Omit<Employee, "id">[]) => void;

  // HR Phase 2 — Employee Lifecycle
  addEmployeeLifecycleEvent: (event: Omit<EmployeeLifecycleEvent, "id" | "createdAt">) => void;
  updateEmployeeLifecycleStatus: (employeeId: string, toStatus: string, fromStatus: string, remarks: string, createdBy: string) => void;

  // HR Phase 3 — Shifts
  addShiftTemplate: (template: Omit<ShiftTemplate, "id" | "createdAt">) => void;
  updateShiftTemplate: (id: string, updates: Partial<ShiftTemplate>) => void;
  toggleShiftTemplateActive: (id: string) => void;
  assignEmployeeShift: (assignment: Omit<EmployeeShiftAssignment, "id" | "createdAt">) => void;

  // HR Phase 3 — Time Logs
  addEmployeeTimeLog: (log: Omit<EmployeeTimeLog, "id" | "createdAt">) => void;
  approveEmployeeTimeLog: (id: string, approvedBy: string) => void;

  // HR Phase 3 — Attendance
  addEmployeeAttendance: (record: Omit<EmployeeAttendance, "id" | "createdAt">) => void;
  updateEmployeeAttendance: (id: string, updates: Partial<EmployeeAttendance>) => void;

  // HR Phase 3 — Leave
  addLeaveRequest: (request: Omit<LeaveRequest, "id" | "createdAt">) => void;
  approveLeaveRequest: (id: string, approvedBy: string, remarks?: string) => void;
  rejectLeaveRequest: (id: string, approvedBy: string, remarks: string) => void;
  cancelLeaveRequest: (id: string) => void;

  // HR Phase 4 — Payroll Periods & Runs
  addPayrollPeriod: (period: Omit<PayrollPeriod, "id" | "createdAt">) => PayrollPeriod;
  addPayrollRun: (run: Omit<PayrollRun, "id" | "createdAt">) => PayrollRun;
  updatePayrollRunStatus: (id: string, status: PayrollRun["status"], by: string) => void;
  addPayrollLine: (line: Omit<PayrollLine, "id" | "createdAt">) => void;
  addPayrollLines: (lines: Omit<PayrollLine, "id" | "createdAt">[]) => void;

  // HR Phase 4 — Salary Payouts
  addSalaryPayoutBatch: (batch: Omit<SalaryPayoutBatch, "id" | "createdAt">) => SalaryPayoutBatch;
  addSalaryPayoutLines: (lines: Omit<SalaryPayoutLine, "id" | "createdAt">[]) => void;
  releaseSalaryPayoutBatch: (id: string, releasedBy: string) => void;

  // HR Phase 4 — Benefits
  updateBenefitPlan: (id: string, updates: Partial<BenefitPlan>) => void;
  toggleBenefitPlanActive: (id: string) => void;

  // HR Phase 5 — Recruitment
  addJobRequisition: (data: Omit<JobRequisition, "id" | "createdAt">) => void;
  updateJobRequisitionStatus: (id: string, status: JobRequisition["status"], approvedBy?: string) => void;
  addJobApplicant: (data: Omit<JobApplicant, "id" | "createdAt">) => void;
  updateJobApplicantStatus: (id: string, status: JobApplicant["status"], notes?: string) => void;
  addApplicantInterview: (data: Omit<ApplicantInterview, "id" | "createdAt">) => void;
  updateInterviewResult: (id: string, result: ApplicantInterview["result"], remarks?: string) => void;

  // HR Phase 5 — Onboarding
  addEmployeeOnboardingTask: (data: Omit<EmployeeOnboardingTask, "id" | "createdAt">) => void;
  completeOnboardingTask: (taskId: string, completedBy: string) => void;
  skipOnboardingTask: (taskId: string) => void;

  // Section CRUD
  addSection: (section: Omit<SchoolSection, "id" | "createdAt">) => SchoolSection;
  updateSection: (id: string, updates: Partial<SchoolSection>) => void;
  deleteSection: (id: string) => void;
  toggleSectionActive: (id: string) => void;
  assignStudentsToSection: (sectionId: string, studentIds: string[]) => void;

  // Book Package CRUD
  addBookPackage: (bookPackage: Omit<BookPackage, "id">) => BookPackage;
  updateBookPackage: (id: string, updates: Partial<BookPackage>) => void;

  // Room CRUD
  addRoom: (room: Omit<Room, "id">) => Room;
  updateRoom: (id: string, updates: Partial<Room>) => void;
  deleteRoom: (id: string) => void;
  toggleRoomActive: (id: string) => void;

  // Document verification workflow
  updateRequirementUpload: (studentId: string, reqName: string, fileName: string) => void;
  uploadRequirementFile: (studentId: string, reqName: string, file: File) => Promise<void>;
  getRequirementFileUrl: (studentId: string, reqName: string) => Promise<string>;
  verifyRequirement: (studentId: string, reqName: string, status: "Verified" | "Rejected", verifiedBy: string, remarks?: string) => void;
  markHardcopySubmitted: (studentId: string, reqName: string) => void;

  // Guardian Information (Admission & Enrollment)
  addStudentGuardian: (guardian: Omit<StudentGuardianContact, "id">) => void;
  updateStudentGuardian: (id: string, updates: Partial<StudentGuardianContact>) => void;
  deleteStudentGuardian: (id: string) => void;
  addStudentEducationBackground: (record: Omit<StudentEducationBackground, "id" | "createdAt" | "updatedAt">) => void;
  updateStudentEducationBackground: (id: string, updates: Partial<StudentEducationBackground>) => void;
  deleteStudentEducationBackground: (id: string) => void;
  addEmployeeProfileContact: (contact: Omit<EmployeeProfileContact, "id" | "createdAt" | "updatedAt">) => void;
  updateEmployeeProfileContact: (id: string, updates: Partial<EmployeeProfileContact>) => void;
  deleteEmployeeProfileContact: (id: string) => void;
  addEmployeeEducationBackground: (record: Omit<EmployeeEducationBackground, "id" | "createdAt" | "updatedAt">) => void;
  updateEmployeeEducationBackground: (id: string, updates: Partial<EmployeeEducationBackground>) => void;
  deleteEmployeeEducationBackground: (id: string) => void;
  addEmployeeLicenseCertification: (record: Omit<EmployeeLicenseCertification, "id" | "createdAt" | "updatedAt">) => void;
  updateEmployeeLicenseCertification: (id: string, updates: Partial<EmployeeLicenseCertification>) => void;
  deleteEmployeeLicenseCertification: (id: string) => void;
  addActivityLog: (entry: { action: string; subject: string; type?: string; actorName?: string; occurredAt?: string }) => void;
}

/** Strips a code-based field and replaces it with the resolved FK column, so
 *  the generic snake-case writer never sees the business-code string. */
const withSchoolFk = <T extends { schoolId?: string }>(row: T) => {
  const { schoolId, ...rest } = row as any;
  return { ...rest, school_id: resolveSchoolId(schoolId) };
};
const withSubjectFk = (row: any, codeField = "subjectCode") => {
  const { [codeField]: code, ...rest } = row;
  return { ...rest, subject_id: resolveSubjectId(code) };
};
const resolveTeacherEmployeeId = (teachers: Teacher[], teacherId?: string | null) =>
  teacherId ? teachers.find((teacher) => teacher.id === teacherId)?.employeeId ?? undefined : undefined;

/** Last-resort owner resolution for grade writes: the signed-in user's employee
 *  id, via their teacher bridge or a direct employees.userId link. */
const resolveOwnerEmployeeIdFromUser = (get: () => STSNState): string | undefined => {
  const userId = get().currentUser?.id;
  if (!userId) return undefined;
  return (
    get().teachers.find((teacher) => teacher.userId === userId)?.employeeId ??
    get().employees.find((employee) => employee.userId === userId)?.id
  );
};

const studentPersistence = new Map<string, Promise<void>>();

const getDefaultRequirementNames = (
  department: Student["department"],
): Requirement["name"][] => [
  "PSA Birth Certificate",
  "Good Moral Certificate",
  "ID Picture (2x2)",
  department === "College" ? "Transcript of Records (TOR)" : "Form 137 / SF9",
];

const createPendingRequirement = (
  studentId: string,
  name: Requirement["name"],
): Requirement => ({
  id: newId(),
  studentId,
  name,
  status: "Pending",
  uploadStatus: "Not Uploaded",
  verificationStatus: "Pending",
});

const persistRequirementsWithRecheck = async (studentId: string, reqs: Requirement[]) => {
  await Promise.all(reqs.map((r) => dbInsert("requirements", r)));

  const { data, error } = await supabase
    .from("requirements")
    .select("name")
    .eq("student_id", studentId);

  if (error) {
    console.error("[supabase] recheck requirements failed:", error);
    return;
  }

  const persistedNames = new Set((data ?? []).map((r: any) => r.name));
  const missingReqs = reqs.filter((r) => !persistedNames.has(r.name));
  for (const req of missingReqs) await dbInsert("requirements", req);
};

const DOCUMENT_BUCKET = "student-documents";
const sanitizeStorageName = (value: string) =>
  value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "document";

// ── Approval workflow persistence helpers (fire-and-forget) ──────────────────
// These call the centralized approval service to write to approval_requests,
// approval_steps, and approval_actions tables without blocking the synchronous
// local state update that the UI already relies on.

type ApprovalActor = Pick<User, "id" | "role" | "designation" | "schoolId" | "isActive" | "name">;

async function awFindOrCreate(
  entityId: string,
  wfType: WorkflowType,
  actor: ApprovalActor,
  titleFallback: string,
  schoolId?: string,
): Promise<string> {
  const existing = await findApprovalRequestByEntity(entityId, wfType);
  if (existing) return existing.id;
  const id = await createApprovalRequest({
    workflowType: wfType,
    entityType: wfType,
    entityId,
    schoolId,
    requestedBy: actor.id,
    requestedRole: actor.role,
    requestTitle: titleFallback,
  });
  await submitApprovalRequest(id, actor);
  return id;
}

async function awActApprove(
  entityId: string,
  wfType: WorkflowType,
  actor: ApprovalActor,
  titleFallback: string,
  schoolId?: string,
  remarks?: string,
): Promise<void> {
  try {
    const requestId = await awFindOrCreate(entityId, wfType, actor, titleFallback, schoolId);
    await awApproveStep(requestId, actor, remarks);
  } catch (e) {
    console.error(`[approvalWorkflow] awActApprove(${wfType}/${entityId}) failed:`, e);
  }
}

async function awActReturn(
  entityId: string,
  wfType: WorkflowType,
  actor: ApprovalActor,
  titleFallback: string,
  remarks: string,
  schoolId?: string,
): Promise<void> {
  try {
    const requestId = await awFindOrCreate(entityId, wfType, actor, titleFallback, schoolId);
    await awReturnRequest(requestId, actor, remarks);
  } catch (e) {
    console.error(`[approvalWorkflow] awActReturn(${wfType}/${entityId}) failed:`, e);
  }
}

async function awActReject(
  entityId: string,
  wfType: WorkflowType,
  actor: ApprovalActor,
  titleFallback: string,
  remarks: string,
  schoolId?: string,
): Promise<void> {
  try {
    const requestId = await awFindOrCreate(entityId, wfType, actor, titleFallback, schoolId);
    await awRejectRequest(requestId, actor, remarks);
  } catch (e) {
    console.error(`[approvalWorkflow] awActReject(${wfType}/${entityId}) failed:`, e);
  }
}

export const useSTSNStore = create<STSNState>((set, get) => ({
  isLoading: true,
  financeWritesEnabled: false,
  financeRealtimeStatus: "disconnected",
  currentUser: null,
  securityCatalog: EMPTY_SECURITY_CATALOG,
  effectivePermissions: null,
  activeSchool: "ALL",
  academicUnit: getAcademicUnit("ALL"),
  schools: [],
  users: [],
  students: [],
  teachers: [],
  employees: [],
  courses: [],
  subjects: [],
  curriculums: [],
  requirements: [],
  enrollments: [],
  onlineEnrollmentApplications: [],
  assessments: [],
  payments: [],
  studentInvoices: [],
  invoiceLines: [],
  paymentPlans: [],
  paymentPlanInstallments: [],
  studentReceipts: [],
  receiptAllocations: [],
  directCollectionLines: [],
  unappliedCredits: [],
  allocationReallocationRequests: [],
  grades: [],
  schedules: [],
  announcements: [],
  events: [],
  payroll: [],
  setupData: {},
  discountTypes: [],
  discountRequests: [],
  voidRequests: [],
  cashVouchers: [],
  notifications: [],
  classSchedules: [],
  learningMaterials: [],
  sections: [],
  rooms: [],
  bookPackages: [],
  studentLedgerSummaries: [],
  ledgerTransactions: [],
  financialHolds: [],
  assessmentBillingSummaries: [],
  paymentCollectionSummaries: [],
  promissoryNotes: [],
  classLoads: [],
  gradePeriods: [],
  studentGradeEntries: [],
  demoStudents: [],
  activityLogs: [],
  enrollmentHistoryStats: [],
  tuitionFeeSchedule: [],
  miscFeeSchedule: [],
  labFeeAdjustments: [],
  discountOptions: [],
  paymentTermOptions: [],
  studentGuardians: [],
  studentEducationBackgrounds: [],
  employeeProfileContacts: [],
  employeeEducationBackgrounds: [],
  employeeLicenseCertifications: [],
  employeeDocuments: [],
  employeeLifecycleEvents: [],
  shiftTemplates: [],
  employeeShiftAssignments: [],
  employeeTimeLogs: [],
  employeeAttendance: [],
  leaveTypes: [],
  leaveRequests: [],
  payrollPeriods: [],
  payrollRuns: [],
  payrollLines: [],
  salaryPayoutBatches: [],
  salaryPayoutLines: [],
  benefitPlans: [],
  statutoryContributionRules: [],
  taxTables: [],
  taxBrackets: [],
  jobRequisitions: [],
  jobApplicants: [],
  applicantInterviews: [],
  onboardingTemplates: [],
  onboardingTasks: [],
  employeeOnboardingTasks: [],

  // P4-F: Central Audit Log
  auditLog: [],

  // P4-D: Approval Delegations
  delegations: [],

  initialize: async () => {
    const [data, securityCatalog] = await Promise.all([loadAllData(), loadSecurityCatalog()]);
    const storedSession = readStoredAuthSession();
    const restoredUser = storedSession
      ? data.users.find((u) => u.id === storedSession.userId && u.isActive) ?? null
      : null;
    if (storedSession && !restoredUser) {
      clearStoredAuthSession();
    }
    const seededUser =
      restoredUser ?? (data.users.find((u) => u.role === "SUPER_ADMIN") || null);
    const currentUser = seededUser
      ? {
          ...seededUser,
          role: getPrimaryRoleCode(securityCatalog, seededUser.id, seededUser.role),
        }
      : null;
    const activeSchool = storedSession?.activeSchool ?? currentUser?.schoolId ?? "ALL";
    set({
      ...data,
      securityCatalog,
      effectivePermissions: currentUser
        ? computeEffectivePermissions(securityCatalog, currentUser.id, currentUser.role)
        : null,
      activeSchool,
      academicUnit: getAcademicUnit(activeSchool),
      isLoading: false,
      currentUser,
    });
    if (currentUser) {
      ensureFinanceRealtimeSubscription(
        () => void get().reloadFinanceData(),
        (financeRealtimeStatus) => set({ financeRealtimeStatus }),
      );
    }
  },

  reloadFinanceData: async () => {
    const data = await loadAllData();
    set({
      students: data.students,
      enrollments: data.enrollments,
      onlineEnrollmentApplications: data.onlineEnrollmentApplications,
      assessments: data.assessments,
      payments: data.payments,
      studentInvoices: data.studentInvoices,
      invoiceLines: data.invoiceLines,
      paymentPlans: data.paymentPlans,
      paymentPlanInstallments: data.paymentPlanInstallments,
      studentReceipts: data.studentReceipts,
      receiptAllocations: data.receiptAllocations,
      directCollectionLines: data.directCollectionLines,
      unappliedCredits: data.unappliedCredits,
      allocationReallocationRequests: data.allocationReallocationRequests,
      financeWritesEnabled: data.financeWritesEnabled,
      voidRequests: data.voidRequests,
      studentLedgerSummaries: data.studentLedgerSummaries,
      ledgerTransactions: data.ledgerTransactions,
      financialHolds: data.financialHolds,
      assessmentBillingSummaries: data.assessmentBillingSummaries,
      paymentCollectionSummaries: data.paymentCollectionSummaries,
    });
  },

  reloadSecurityPermissions: async () => {
    const securityCatalog = await loadSecurityCatalog();
    const user = get().currentUser;
    const syncedUser = user
      ? {
          ...user,
          role: getPrimaryRoleCode(securityCatalog, user.id, user.role),
        }
      : null;
    set({
      securityCatalog,
      currentUser: syncedUser,
      effectivePermissions: syncedUser
        ? computeEffectivePermissions(securityCatalog, syncedUser.id, syncedUser.role)
        : null,
    });
  },

  login: async (email: string, role: string, schoolContext?: SchoolId) => {
    const catalog = await loadSecurityCatalog();
    const normalizedEmail = email.trim().toLowerCase();
    let availableUsers = get().users;
    let user = availableUsers.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (!user) {
      const refreshed = await loadAllData();
      availableUsers = refreshed.users;
      user = availableUsers.find((u) => u.email.toLowerCase() === normalizedEmail);
      set({ ...refreshed });
    }
    if (user && user.isActive) {
      const resolvedSchool = user.schoolId || schoolContext || "ALL";
      const resolvedRole = getPrimaryRoleCode(catalog, user.id, user.role);
      writeStoredAuthSession({ userId: user.id, activeSchool: resolvedSchool });
      set({
        currentUser: { ...user, role: resolvedRole },
        activeSchool: resolvedSchool,
        academicUnit: getAcademicUnit(resolvedSchool),
        securityCatalog: catalog,
        effectivePermissions: computeEffectivePermissions(catalog, user.id, resolvedRole),
      });
      ensureFinanceRealtimeSubscription(
        () => void get().reloadFinanceData(),
        (financeRealtimeStatus) => set({ financeRealtimeStatus }),
      );
      return true;
    }
    const fallbackUser = availableUsers.find((u) => u.role === role);
    if (fallbackUser) {
      const resolvedSchool = fallbackUser.schoolId || schoolContext || "ALL";
      const resolvedRole = getPrimaryRoleCode(catalog, fallbackUser.id, fallbackUser.role);
      writeStoredAuthSession({ userId: fallbackUser.id, activeSchool: resolvedSchool });
      set({
        currentUser: { ...fallbackUser, role: resolvedRole },
        activeSchool: resolvedSchool,
        academicUnit: getAcademicUnit(resolvedSchool),
        securityCatalog: catalog,
        effectivePermissions: computeEffectivePermissions(catalog, fallbackUser.id, resolvedRole),
      });
      ensureFinanceRealtimeSubscription(
        () => void get().reloadFinanceData(),
        (financeRealtimeStatus) => set({ financeRealtimeStatus }),
      );
      return true;
    }
    return false;
  },

  logout: async () => {
    clearStoredAuthSession();
    if (financeRealtimeChannel) await supabase.removeChannel(financeRealtimeChannel);
    financeRealtimeChannel = null;
    set({ currentUser: null, effectivePermissions: null, financeRealtimeStatus: "disconnected" });
  },
  setCurrentUser: (user) => {
    if (user) {
      writeStoredAuthSession({ userId: user.id, activeSchool: user.schoolId ?? "ALL" });
    } else {
      clearStoredAuthSession();
    }
    set({ currentUser: user });
  },

  addStudent: async (studentData) => {
    const newStudentId = newId();

    // student_no is generated server-side (trigger + sequence, see migration
    // 20260712100000_student_no_sequence.sql) so it can never collide under
    // concurrent enrollments the way a client-side `students.length + 1`
    // count could. The insert is awaited and thrown on failure so the caller
    // never shows a row locally that didn't actually persist.
    const { data: inserted, error } = await dbInsertReturning<{ studentNo: string }>(
      "students",
      withSchoolFk({ ...studentData, id: newStudentId }),
      "student_no",
    );
    if (error || !inserted) {
      throw new Error("Failed to save the student record. Please try again.");
    }

    const newStudent: Student = { ...studentData, id: newStudentId, studentNo: inserted.studentNo };
    set((state) => ({ students: [...state.students, newStudent] }));

    const newReqs = getDefaultRequirementNames(studentData.department).map((name) =>
      createPendingRequirement(newStudentId, name)
    );
    set((state) => ({ requirements: [...state.requirements, ...newReqs] }));

    const persisted = persistRequirementsWithRecheck(newStudentId, newReqs);
    studentPersistence.set(newStudentId, persisted);
    persisted.finally(() => {
      if (studentPersistence.get(newStudentId) === persisted) studentPersistence.delete(newStudentId);
    });

    return newStudent;
  },

  updateStudent: (id, updates) => {
    set((state) => ({ students: state.students.map((s) => (s.id === id ? { ...s, ...updates } : s)) }));
    dbUpdate("students", id, "schoolId" in updates ? withSchoolFk(updates as any) : updates);
  },

  updateStudentRequirements: (studentId, reqName, status) => {
    const req = get().requirements.find((r) => r.studentId === studentId && r.name === reqName);
    const submittedDate = status === "Submitted" ? todayStamp() : req?.submittedDate;
    set((state) => ({
      requirements: state.requirements.map((r) =>
        r.studentId === studentId && r.name === reqName ? { ...r, status, submittedDate } : r
      )
    }));
    if (req) dbUpdate("requirements", req.id, { status, submittedDate });
  },

  ensureStudentRequirements: (studentId) => {
    const student = get().students.find((s) => s.id === studentId);
    if (!student) return;

    const existingReqs = get().requirements.filter((r) => r.studentId === studentId);
    const existingNames = new Set(existingReqs.map((r) => r.name));
    const missingReqs = getDefaultRequirementNames(student.department)
      .filter((name) => !existingNames.has(name))
      .map((name) => createPendingRequirement(studentId, name));

    if (missingReqs.length === 0) return;

    set((state) => ({ requirements: [...state.requirements, ...missingReqs] }));

    const persisted = (studentPersistence.get(studentId) ?? Promise.resolve())
      .then(() => persistRequirementsWithRecheck(studentId, missingReqs))
      .then(() => undefined);
    studentPersistence.set(studentId, persisted);
    persisted.finally(() => {
      if (studentPersistence.get(studentId) === persisted) studentPersistence.delete(studentId);
    });
  },

  submitNewEnrollment: async (enrollData) => {
    if (!get().financeWritesEnabled) throw financeMaintenanceError();
    const newEnrollmentId = newId();
    const newEnrollment: Enrollment = {
      ...enrollData,
      id: newEnrollmentId,
      status: "For Assessment",
      enrollmentSource: enrollData.enrollmentSource ?? "ERP",
      isOnlineEnrollment: enrollData.isOnlineEnrollment ?? false,
      completionStatus: enrollData.completionStatus ?? "Complete",
      missingFields: enrollData.missingFields ?? [],
    };

    const student = get().students.find((s) => s.id === enrollData.studentId);
    const enrollmentSchool = get().activeSchool;
    const assessmentSchoolId = student?.schoolId ?? (
      enrollmentSchool === "STSN" || enrollmentSchool === "CDSTA"
        ? enrollmentSchool
        : undefined
    );
    if (!assessmentSchoolId) {
      throw new Error("The student's school must be assigned before creating an assessment.");
    }
    const isCollege = student?.department === "College";
    const tuitionRate = isCollege ? 950 * enrollData.subjectCodes.length * 3 : 18000;
    const totalAmount = tuitionRate + 4500 + 3500 + 1000;

    const baseFees = [
      { feeName: isCollege ? `College Tuition Fee` : "SHS Tuition Fee (Flat)", category: "Tuition", amount: tuitionRate },
      { feeName: "Registration & Misc Fee", category: "Miscellaneous", amount: 4500 },
      { feeName: "Computer Laboratory Fee", category: "Laboratory", amount: 3500 },
      { feeName: "School ID / Facilities Fee", category: "ID/Other", amount: 1000 }
    ];

    const newAssessmentId = newId();
    const newAssessment: StudentAssessment = {
      id: newAssessmentId,
      schoolId: assessmentSchoolId,
      studentId: enrollData.studentId,
      schoolYear: enrollData.schoolYear,
      semester: enrollData.semester,
      fees: baseFees,
      totalAmount,
      discountPercentage: 0,
      discountAmount: 0,
      paymentTerm: "Installment - 4 Payments",
      balance: totalAmount
    };

    // Await the core writes (enrollment, its subjects, and the assessment
    // that gates it into the "For Assessment" queue) before touching local
    // state, so a failed insert can never leave a ghost row that only
    // disappears on the next reload — the caller sees a thrown error instead.
    await studentPersistence.get(enrollData.studentId);

    const enrollError = await dbInsert("enrollments", {
      id: newEnrollmentId,
      studentId: enrollData.studentId,
      schoolYear: enrollData.schoolYear,
      semester: enrollData.semester,
      enrollmentType: enrollData.enrollmentType,
      status: "For Assessment",
      submittedAt: enrollData.submittedAt,
      enrollmentSource: newEnrollment.enrollmentSource,
      isOnlineEnrollment: newEnrollment.isOnlineEnrollment,
      onlineApplicationId: newEnrollment.onlineApplicationId,
      completionStatus: newEnrollment.completionStatus,
      missingFields: newEnrollment.missingFields,
      sourceMetadata: newEnrollment.sourceMetadata,
    });
    if (enrollError) throw new Error("Failed to save the enrollment. Please try again.");

    await Promise.all(enrollData.subjectCodes.map((code) => {
      const subjectId = resolveSubjectId(code);
      return subjectId ? dbInsert("enrollment_subjects", { enrollment_id: newEnrollmentId, subject_id: subjectId }) : Promise.resolve(null);
    }));

    const assessmentError = await dbInsert("assessments", withSchoolFk({
      id: newAssessmentId, studentId: enrollData.studentId, schoolYear: enrollData.schoolYear, semester: enrollData.semester,
      schoolId: assessmentSchoolId,
      enrollmentId: newEnrollmentId,
      totalAmount, discountPercentage: 0, discountAmount: 0, paymentTerm: "Installment - 4 Payments", balance: totalAmount,
    }));
    if (assessmentError) throw new Error("Enrollment saved, but the assessment could not be created. Please generate it manually.");
    const { error: feeError } = await supabase.rpc("replace_draft_assessment_fees", {
      p_assessment_id: newAssessmentId,
      p_fees: baseFees.map((fee) => ({
        fee_name: fee.feeName,
        category: fee.category,
        amount: fee.amount,
        quantity: 1,
        unit_amount: fee.amount,
      })),
    });
    if (feeError) {
      console.error("[supabase] replace_draft_assessment_fees failed:", feeError);
      throw new Error("Enrollment saved, but its assessment charges could not be created.");
    }
    const linkError = await dbUpdate("enrollments", newEnrollmentId, { assessmentId: newAssessmentId });
    if (linkError) throw new Error("Enrollment and assessment were saved, but their database link could not be completed.");
    newEnrollment.assessmentId = newAssessmentId;

    set((state) => ({
      enrollments: [...state.enrollments, newEnrollment],
      students: state.students.map((s) => (s.id === enrollData.studentId ? { ...s, enrollmentStatus: "For Assessment" } : s)),
      assessments: [...state.assessments, newAssessment],
    }));

    const existingReqs = get().requirements.filter((r) => r.studentId === enrollData.studentId);
    if (existingReqs.length === 0) {
      const newReqs = getDefaultRequirementNames(isCollege ? "College" : "Basic Education").map((name) =>
        createPendingRequirement(enrollData.studentId, name)
      );
      set((state) => ({ requirements: [...state.requirements, ...newReqs] }));
      const persisted = persistRequirementsWithRecheck(enrollData.studentId, newReqs);
      studentPersistence.set(enrollData.studentId, persisted);
      persisted.finally(() => {
        if (studentPersistence.get(enrollData.studentId) === persisted) studentPersistence.delete(enrollData.studentId);
      });
    }

    return newEnrollment;
  },

  approveEnrollment: (enrollmentId, section) => {
    const enrollment = get().enrollments.find((e) => e.id === enrollmentId);
    if (!enrollment) return;

    // Block approval when any required document is still pending (not yet submitted or verified).
    const pendingDocs = get().requirements.filter(
      (r) => r.studentId === enrollment.studentId && r.status === "Pending"
    );
    if (pendingDocs.length > 0) {
      console.warn(
        `[approveEnrollment] Blocked: ${pendingDocs.length} required document(s) still pending for student ${enrollment.studentId}: ${pendingDocs.map((r) => r.name).join(", ")}`
      );
      return;
    }

    set((state) => ({
      enrollments: state.enrollments.map((e) => (e.id === enrollmentId ? { ...e, status: "Enrolled" } : e)),
      students: state.students.map((s) => (s.id === enrollment.studentId ? { ...s, enrollmentStatus: "Enrolled", section } : s))
    }));
    dbUpdate("enrollments", enrollmentId, { status: "Enrolled" });
    dbUpdate("students", enrollment.studentId, { enrollmentStatus: "Enrolled", section });
  },

  rejectEnrollment: (enrollmentId) => {
    const enrollment = get().enrollments.find((e) => e.id === enrollmentId);
    if (!enrollment) return;
    set((state) => ({
      enrollments: state.enrollments.map((e) => (e.id === enrollmentId ? { ...e, status: "Rejected" } : e)),
      students: state.students.map((s) => (s.id === enrollment.studentId ? { ...s, enrollmentStatus: "Rejected" } : s))
    }));
    dbUpdate("enrollments", enrollmentId, { status: "Rejected" });
    dbUpdate("students", enrollment.studentId, { enrollmentStatus: "Rejected" });
  },

  updateEnrollmentStatus: (enrollmentId, status) => {
    const enrollment = get().enrollments.find((e) => e.id === enrollmentId);
    if (!enrollment) return;
    set((state) => ({
      enrollments: state.enrollments.map((e) => (e.id === enrollmentId ? { ...e, status } : e)),
      students: state.students.map((s) => (s.id === enrollment.studentId ? { ...s, enrollmentStatus: status } : s)),
    }));
    dbUpdate("enrollments", enrollmentId, { status });
    dbUpdate("students", enrollment.studentId, { enrollmentStatus: status });
  },

  updateOnlineEnrollmentApplicationStatus: (applicationId, status) => {
    set((state) => ({
      onlineEnrollmentApplications: state.onlineEnrollmentApplications.map((application) =>
        application.id === applicationId
          ? {
              ...application,
              status,
              completionStatus: status === "For Completion" ? "Incomplete" : application.completionStatus,
            }
          : application,
      ),
    }));
    dbUpdate("online_enrollment_applications", applicationId, {
      status,
      completionStatus: status === "For Completion" ? "Incomplete" : undefined,
      updatedAt: new Date().toISOString(),
    });
  },

  acceptOnlineEnrollmentApplication: async (applicationId) => {
    if (!get().financeWritesEnabled) throw financeMaintenanceError();
    const actor = get().currentUser?.name ?? "Registrar";
    const { error } = await supabase.rpc("accept_online_enrollment_application", {
      p_application_id: applicationId,
      p_actor: actor,
    });
    if (error) {
      console.error("[supabase] accept_online_enrollment_application failed:", error);
      throw new Error(error.message || "Online enrollment application could not be accepted.");
    }
    await get().reloadFinanceData();
  },

  addAssessment: async (assessment) => {
    if (!get().financeWritesEnabled) throw financeMaintenanceError();
    const { fees, auditTrail, ...rest } = assessment;
    const schoolId = rest.schoolId ?? get().students.find((s) => s.id === rest.studentId)?.schoolId;
    if (!schoolId) throw new Error("The assessment requires a valid school.");
    const assessmentError = await dbInsert(
      "assessments",
      withSchoolFk({ ...rest, schoolId }),
    );
    if (assessmentError) throw new Error("Assessment could not be created.");
    if (fees) {
      const { error } = await supabase.rpc("replace_draft_assessment_fees", {
        p_assessment_id: assessment.id,
        p_fees: fees.map((fee) => ({
          fee_name: fee.feeName,
          category: fee.category,
          amount: fee.amount,
          quantity: 1,
          unit_amount: fee.amount,
        })),
      });
      if (error) {
        console.error("[supabase] replace_draft_assessment_fees failed:", error);
        throw new Error("Assessment fees could not be saved.");
      }
    }
    for (const entry of auditTrail ?? []) {
      const { error: auditError } = await supabase.rpc("append_student_assessment_audit", {
        p_assessment_id: assessment.id,
        p_action: entry.action,
        p_details: entry.details,
      });
      if (auditError) throw new Error("Assessment audit history could not be saved.");
    }
    set((state) => ({ assessments: [...state.assessments, assessment] }));
  },

  updateAssessment: async (id, updates) => {
    if (!get().financeWritesEnabled) throw financeMaintenanceError();
    const { fees, auditTrail, ...rest } = updates;
    let canonicalAssessment: Partial<StudentAssessment> | null = null;
    if (Object.keys(rest).length > 0) {
      const updateError = await dbUpdate(
        "assessments",
        id,
        "schoolId" in rest ? withSchoolFk(rest) : rest,
      );
      if (updateError) throw new Error("Assessment changes could not be saved.");
    }
    if (fees) {
      const { data, error } = await supabase.rpc("replace_draft_assessment_fees", {
        p_assessment_id: id,
        p_fees: fees.map((fee) => ({
          fee_name: fee.feeName,
          category: fee.category,
          amount: fee.amount,
          quantity: 1,
          unit_amount: fee.amount,
        })),
      });
      if (error || !data) {
        console.error("[supabase] replace_draft_assessment_fees failed:", error);
        throw new Error(error?.message || "Assessment fees could not be replaced.");
      }
      canonicalAssessment = toCamel(data) as Partial<StudentAssessment>;
    }
    if (auditTrail) {
      const existingIds = new Set(
        get().assessments.find((assessment) => assessment.id === id)?.auditTrail?.map((entry) => entry.id) ?? [],
      );
      for (const entry of auditTrail.filter((item) => !existingIds.has(item.id))) {
        const { error: auditError } = await supabase.rpc("append_student_assessment_audit", {
          p_assessment_id: id,
          p_action: entry.action,
          p_details: entry.details,
        });
        if (auditError) throw new Error("Assessment audit history could not be saved.");
      }
    }
    set((state) => ({
      assessments: state.assessments.map((a) =>
        a.id === id ? { ...a, ...updates, ...canonicalAssessment } : a
      ),
    }));
  },

  approveAssessment: async (assessmentId, approvedBy, remarks) => {
    if (!get().financeWritesEnabled) throw financeMaintenanceError();
    const assessment = get().assessments.find((a) => a.id === assessmentId);
    const linkedEnrollment = assessment
      ? get().enrollments.find((e) => e.assessmentId === assessmentId || (
          e.studentId === assessment.studentId &&
          e.schoolYear === assessment.schoolYear &&
          e.semester === assessment.semester
        ))
      : undefined;
    const { data, error } = await supabase.rpc("approve_student_assessment", {
      p_assessment_id: assessmentId,
      p_approved_by: approvedBy,
      p_remarks: remarks ?? null,
    });
    if (error || !data) {
      console.error("[supabase] approve_student_assessment failed:", error);
      throw new Error(error?.message || "Assessment approval could not be posted.");
    }

    const result = toCamel(data) as { assessment: Partial<StudentAssessment> };
    const approvedAssessment = result.assessment;
    set((state) => ({
      assessments: state.assessments.map((a) => a.id !== assessmentId ? a : {
        ...a,
        ...approvedAssessment,
        approvalStatus: "Approved for Payment",
        approvedBy,
        accountingRemarks: remarks || a.accountingRemarks,
      }),
      enrollments: linkedEnrollment
        ? state.enrollments.map((e) => e.id === linkedEnrollment.id ? { ...e, status: "For Payment" } : e)
        : state.enrollments,
      students: linkedEnrollment
        ? state.students.map((s) => s.id === linkedEnrollment.studentId ? { ...s, enrollmentStatus: "For Payment" } : s)
        : state.students,
    }));
    const actor = get().currentUser;
    if (actor) awActApprove(assessmentId, "assessment", actor, `Assessment — ${assessment?.studentId ?? assessmentId}`, assessment?.schoolId as string | undefined, remarks);
    const asmtStudent = get().students.find((s) => s.id === assessment?.studentId);
    get().addNotification({ title: "Assessment Approved for Payment", body: `Assessment for ${asmtStudent ? `${asmtStudent.firstName} ${asmtStudent.lastName}` : "student"} approved. Student may now proceed to Cashier.`, type: "approval", entityType: "assessment", entityId: assessmentId, targetRoles: ["CASHIER", "REGISTRAR", "SUPER_ADMIN", "ADMIN"], schoolId: assessment?.schoolId as any });
  },

  returnAssessmentToRegistrar: async (assessmentId, performedBy, remarks) => {
    if (!get().financeWritesEnabled) throw financeMaintenanceError();
    const { error } = await supabase.rpc("review_student_assessment", {
      p_assessment_id: assessmentId,
      p_decision: "Returned to Registrar",
      p_remarks: remarks,
    });
    if (error) throw new Error(error.message || "Assessment could not be returned.");
    const now = nowStamp();
    const entry: AuditEntry = { id: newId(), action: "RETURNED_TO_REGISTRAR", performedBy, performedAt: now, details: remarks };
    set((state) => ({
      assessments: state.assessments.map((a) => a.id !== assessmentId ? a : {
        ...a, approvalStatus: "Returned to Registrar", accountingRemarks: remarks, auditTrail: [...(a.auditTrail || []), entry],
      })
    }));
    const actorRet = get().currentUser;
    const asmtRet = get().assessments.find((a) => a.id === assessmentId);
    if (actorRet) awActReturn(assessmentId, "assessment", actorRet, `Assessment — ${assessmentId}`, remarks, asmtRet?.schoolId as string | undefined);
    get().addNotification({ title: "Assessment Returned to Registrar", body: `An assessment was returned for correction: ${remarks}`, type: "return", entityType: "assessment", entityId: assessmentId, targetRoles: ["REGISTRAR", "SUPER_ADMIN", "ADMIN"] });
  },

  rejectAssessment: async (assessmentId, performedBy, remarks) => {
    if (!get().financeWritesEnabled) throw financeMaintenanceError();
    const { error } = await supabase.rpc("review_student_assessment", {
      p_assessment_id: assessmentId,
      p_decision: "Rejected",
      p_remarks: remarks,
    });
    if (error) throw new Error(error.message || "Assessment could not be rejected.");
    const now = nowStamp();
    const entry: AuditEntry = { id: newId(), action: "REJECTED", performedBy, performedAt: now, details: remarks };
    set((state) => ({
      assessments: state.assessments.map((a) => a.id !== assessmentId ? a : {
        ...a, approvalStatus: "Rejected", accountingRemarks: remarks, auditTrail: [...(a.auditTrail || []), entry],
      })
    }));
    const actorRej = get().currentUser;
    const asmtRej = get().assessments.find((a) => a.id === assessmentId);
    if (actorRej) awActReject(assessmentId, "assessment", actorRej, `Assessment — ${assessmentId}`, remarks, asmtRej?.schoolId as string | undefined);
  },

  addPayment: async (paymentData) => {
    if (!get().financeWritesEnabled) throw financeMaintenanceError();
    const idempotencyKey = newId();
    const actorName = get().currentUser?.name ?? "System";
    const { data, error } = await supabase.rpc("post_student_payment", {
      p_student_id: paymentData.studentId,
      p_assessment_id: paymentData.assessmentId ?? null,
      p_school_id: resolveSchoolId(paymentData.schoolId),
      p_amount: paymentData.amount,
      p_payment_method: paymentData.paymentMethod,
      p_or_number: paymentData.orNumber,
      p_term: paymentData.term,
      p_remarks: paymentData.remarks ?? null,
      p_transaction_type: paymentData.transactionType ?? "AR",
      p_payment_category: paymentData.paymentCategory ?? null,
      p_posted_by: actorName,
      p_idempotency_key: idempotencyKey,
    });

    if (error || !data) {
      console.error("[supabase] post_student_payment failed:", error);
      throw new Error(error?.message || "Payment could not be posted. No account balances were changed.");
    }

    const result = toCamel(data) as {
      payment: Payment;
      assessment?: Partial<StudentAssessment> | null;
      enrollment?: Partial<Enrollment> | null;
      ledgerTransaction?: LedgerTransaction | null;
      ledgerSummary?: StudentLedgerSummary | null;
      billingSummary?: Partial<AssessmentBillingSummary> | null;
      collectionSummary?: Partial<PaymentCollectionSummary> | null;
      student?: Partial<Student> | null;
    };
    const persistedPayment: Payment = {
      ...result.payment,
      schoolId: paymentData.schoolId,
      amount: Number(result.payment.amount),
    };
    const student = get().students.find((row) => row.id === paymentData.studentId);
    const billingSummary = result.billingSummary
      ? {
          ...result.billingSummary,
          studentName: student ? `${student.firstName} ${student.lastName}` : "",
          studentNo: student?.studentNo ?? "",
        } as AssessmentBillingSummary
      : null;
    const collectionSummary = result.collectionSummary
      ? {
          ...result.collectionSummary,
          studentName: student ? `${student.firstName} ${student.lastName}` : "",
        } as PaymentCollectionSummary
      : null;

    set((state) => ({
      payments: state.payments.some((p) => p.id === persistedPayment.id)
        ? state.payments.map((p) => p.id === persistedPayment.id ? persistedPayment : p)
        : [...state.payments, persistedPayment],
      assessments: result.assessment
        ? state.assessments.map((a) => a.id === result.assessment?.id ? { ...a, ...result.assessment } : a)
        : state.assessments,
      enrollments: result.enrollment
        ? state.enrollments.map((e) => e.id === result.enrollment?.id ? { ...e, ...result.enrollment } : e)
        : state.enrollments,
      students: result.student || result.enrollment?.status
        ? state.students.map((s) => s.id === paymentData.studentId
            ? {
                ...s,
                studentNo: result.student?.studentNo ?? s.studentNo,
                enrollmentStatus: (result.student?.enrollmentStatus ?? result.enrollment?.status ?? s.enrollmentStatus) as Student["enrollmentStatus"],
              }
            : s)
        : state.students,
      ledgerTransactions: result.ledgerTransaction
        ? [
            ...state.ledgerTransactions.filter((row) => row.id !== result.ledgerTransaction?.id),
            result.ledgerTransaction,
          ]
        : state.ledgerTransactions,
      studentLedgerSummaries: result.ledgerSummary
        ? [
            ...state.studentLedgerSummaries.filter((row) =>
              row.studentId !== result.ledgerSummary?.studentId ||
              row.schoolYear !== result.ledgerSummary?.schoolYear
            ),
            result.ledgerSummary,
          ]
        : state.studentLedgerSummaries,
      assessmentBillingSummaries: billingSummary
        ? [
            ...state.assessmentBillingSummaries.filter((row) => row.id !== billingSummary.id),
            billingSummary,
          ]
        : state.assessmentBillingSummaries,
      paymentCollectionSummaries: collectionSummary
        ? [
            ...state.paymentCollectionSummaries.filter((row) => row.id !== collectionSummary.id),
            collectionSummary,
          ]
        : state.paymentCollectionSummaries,
    }));

    return persistedPayment;
  },

  postStudentReceipt: async (input) => {
    if (!get().financeWritesEnabled) throw financeMaintenanceError();
    const actor = get().currentUser?.name ?? "System";
    const { data, error } = await supabase.rpc("post_student_receipt", {
      p_school_id: resolveSchoolId(input.schoolId),
      p_student_id: input.studentId,
      p_amount: input.amount,
      p_payment_method: input.paymentMethod,
      p_receipt_no: input.receiptNo,
      p_allocations: input.allocations.map((allocation) => ({
        invoice_id: allocation.invoiceId,
        amount: allocation.amount,
      })),
      p_direct_collections: (input.directCollections ?? []).map((line) => ({
        category: line.category,
        amount: line.amount,
        description: line.description ?? null,
      })),
      p_allow_unapplied_credit: input.allowUnappliedCredit ?? false,
      p_remarks: input.remarks ?? null,
      p_posted_by: actor,
      p_idempotency_key: newId(),
    });
    if (error || !data) {
      console.error("[supabase] post_student_receipt failed:", error);
      throw new Error(error?.message || "Receipt could not be posted.");
    }
    const result = toCamel(data) as { receipt: StudentReceipt };
    await get().reloadFinanceData();
    return {
      ...result.receipt,
      schoolId: input.schoolId,
      amount: Number(result.receipt.amount),
      allocatedAmount: Number(result.receipt.allocatedAmount ?? 0),
      directCollectionAmount: Number(result.receipt.directCollectionAmount ?? 0),
      unappliedAmount: Number(result.receipt.unappliedAmount ?? 0),
    };
  },

  applyUnappliedCredit: async (receiptId, allocations) => {
    if (!get().financeWritesEnabled) throw financeMaintenanceError();
    const { error } = await supabase.rpc("apply_student_unapplied_credit", {
      p_receipt_id: receiptId,
      p_allocations: allocations.map((allocation) => ({
        invoice_id: allocation.invoiceId,
        amount: allocation.amount,
      })),
      p_actor: get().currentUser?.name ?? "System",
      p_idempotency_key: newId(),
    });
    if (error) throw new Error(error.message || "Student credit could not be applied.");
    await get().reloadFinanceData();
  },

  submitAllocationReallocation: async (
    allocationId,
    destinationInvoiceId,
    amount,
    reason,
  ) => {
    if (!get().financeWritesEnabled) throw financeMaintenanceError();
    const { error } = await supabase.rpc("submit_student_allocation_reallocation", {
      p_allocation_id: allocationId,
      p_destination_invoice_id: destinationInvoiceId,
      p_amount: amount,
      p_reason: reason,
      p_requested_by: get().currentUser?.name ?? "System",
    });
    if (error) throw new Error(error.message || "Reallocation request could not be submitted.");
    await get().reloadFinanceData();
  },

  reviewAllocationReallocation: async (requestId, approved, remarks) => {
    if (!get().financeWritesEnabled) throw financeMaintenanceError();
    const { error } = await supabase.rpc("review_student_allocation_reallocation", {
      p_request_id: requestId,
      p_approved: approved,
      p_reviewed_by: get().currentUser?.name ?? "System",
      p_remarks: remarks ?? null,
    });
    if (error) throw new Error(error.message || "Reallocation request could not be reviewed.");
    await get().reloadFinanceData();
  },

  postStudentAdjustment: async (assessmentId, amount, direction, description, entryType = "Adjustment") => {
    if (!get().financeWritesEnabled) throw financeMaintenanceError();
    const { error } = await supabase.rpc("post_student_adjustment", {
      p_assessment_id: assessmentId,
      p_amount: amount,
      p_direction: direction,
      p_description: description,
      p_posted_by: get().currentUser?.name ?? "System",
      p_entry_type: entryType,
    });
    if (error) {
      console.error("[supabase] post_student_adjustment failed:", error);
      throw new Error(error.message || "The student-account adjustment could not be posted.");
    }
    await get().reloadFinanceData();
  },

  setAssessmentHold: async (assessmentId, status) => {
    if (!get().financeWritesEnabled) throw financeMaintenanceError();
    const { error } = await supabase.rpc("set_student_assessment_hold", {
      p_assessment_id: assessmentId,
      p_status: status,
      p_actor: get().currentUser?.name ?? "System",
    });
    if (error) {
      console.error("[supabase] set_student_assessment_hold failed:", error);
      throw new Error(error.message || "The assessment hold could not be updated.");
    }
    await get().reloadFinanceData();
  },

  setFinancialHoldStatus: async (holdId, status, remarks) => {
    if (!get().financeWritesEnabled) throw financeMaintenanceError();
    const { error } = await supabase.rpc("set_financial_hold_record_status", {
      p_hold_id: holdId,
      p_status: status,
      p_actor: get().currentUser?.name ?? "System",
      p_remarks: remarks ?? null,
    });
    if (error) {
      console.error("[supabase] set_financial_hold_record_status failed:", error);
      throw new Error(error.message || "The financial hold could not be updated.");
    }
    await get().reloadFinanceData();
  },

  saveGrade: (studentId, subjectCode, midterm, final) => {
    const passed = final >= 75 ? "Passed" : "Failed";
    const existing = get().grades.find((g) => g.studentId === studentId && g.subjectCode === subjectCode);
    const currentUserId = get().currentUser?.id;
    const activeTeacher =
      get().teachers.find((teacher) => teacher.userId === currentUserId) ??
      get().teachers[0];
    const teacherId = activeTeacher?.id || "";
    const employeeId =
      activeTeacher?.employeeId ??
      get().employees.find((employee) => employee.userId === currentUserId)?.id;

    if (existing) {
      set((state) => ({
        grades: state.grades.map((g) => g.studentId === studentId && g.subjectCode === subjectCode ? { ...g, teacherId, employeeId, midtermGrade: midterm, finalGrade: final, remarks: passed } : g)
      }));
      dbUpdate("grades", existing.id, { teacherId, employeeId, midtermGrade: midterm, finalGrade: final, remarks: passed });
    } else {
      const newGrade: Grade = { id: newId(), studentId, subjectCode, teacherId, employeeId, schoolYear: "2026-2027", semester: "First Semester", midtermGrade: midterm, finalGrade: final, remarks: passed };
      set((state) => ({ grades: [...state.grades, newGrade] }));
      dbInsert("grades", withSubjectFk({ id: newGrade.id, studentId, teacherId: newGrade.teacherId, employeeId: newGrade.employeeId, schoolYear: newGrade.schoolYear, semester: newGrade.semester, midtermGrade: midterm, finalGrade: final, remarks: passed, subjectCode }));
    }
  },

  saveGradeEntry: (studentId, gradeItemId, score) => {
    const periods = get().gradePeriods;
    const period = periods.find((p) => p.items.some((i) => i.id === gradeItemId));
    if (period?.isFinalized) {
      console.warn(`[saveGradeEntry] Grade period "${period.label}" is finalized — entry not saved.`);
      return;
    }
    const existing = get().studentGradeEntries.find((e) => e.studentId === studentId && e.gradeItemId === gradeItemId);
    const periodId = period?.id ?? "";
    // Employee ownership (dual-key consolidation): stamp the canonical grade
    // write table so newly-saved entries carry employee ownership at write time.
    // Prefer the parent period's owner; fall back to the period teacher's bridge,
    // then the signed-in user's employee/teacher link. Preserve any existing
    // ownership when re-scoring so an update never nulls a stamped row.
    const employeeId =
      period?.employeeId ??
      resolveTeacherEmployeeId(get().teachers, period?.teacherId) ??
      existing?.employeeId ??
      resolveOwnerEmployeeIdFromUser(get);

    if (existing) {
      set((state) => ({
        studentGradeEntries: state.studentGradeEntries.map((e) => e.studentId === studentId && e.gradeItemId === gradeItemId ? { ...e, score, employeeId: employeeId ?? e.employeeId } : e)
      }));
    } else {
      const entry: StudentGradeEntry = { id: newId(), periodId, studentId, gradeItemId, score, employeeId };
      set((state) => ({ studentGradeEntries: [...state.studentGradeEntries, entry] }));
    }
    supabase.from("student_grade_entries").upsert(
      { id: existing?.id ?? newId(), grade_period_id: periodId, student_id: studentId, grade_item_id: gradeItemId, score, employee_id: employeeId ?? null },
      { onConflict: "grade_item_id,student_id" }
    ).then(({ error }) => { if (error) console.error("[supabase] upsert student_grade_entries failed:", error); });
  },

  addGradeItem: (periodId, item, categoryWeight) => {
    set((state) => ({
      gradePeriods: state.gradePeriods.map((p) => {
        if (p.id !== periodId) return p;
        let updatedCategories = [...p.categories];
        const existingCat = updatedCategories.find((c) => c.name === item.category);
        if (!existingCat && categoryWeight > 0) updatedCategories = [...updatedCategories, { name: item.category, weight: categoryWeight }];
        return { ...p, categories: updatedCategories, items: [...p.items, item] };
      })
    }));
    dbInsert("grade_items", { id: item.id, gradePeriodId: periodId, label: item.label, category: item.category, maxScore: item.maxScore, sortOrder: item.order, dueDate: item.dueDate });
    const period = get().gradePeriods.find((p) => p.id === periodId);
    const existingCat = period?.categories.find((c) => c.name === item.category);
    if (!existingCat && categoryWeight > 0) dbInsert("grade_categories", { gradePeriodId: periodId, name: item.category, weight: categoryWeight });

    const targetLoad = get().classLoads.find((l) => l.subjectCode === period?.subjectCode);
    // Stamp employee ownership on the seeded entries so the canonical grade write
    // table carries employee ownership from the moment a grade item is created.
    const entryEmployeeId =
      period?.employeeId ??
      resolveTeacherEmployeeId(get().teachers, period?.teacherId) ??
      resolveOwnerEmployeeIdFromUser(get);
    const newEntries: StudentGradeEntry[] = (targetLoad?.studentIds ?? []).map((studentId) => ({ id: newId(), periodId, studentId, gradeItemId: item.id, score: null, employeeId: entryEmployeeId }));
    set((state) => ({ studentGradeEntries: [...state.studentGradeEntries, ...newEntries] }));
    for (const e of newEntries) dbInsert("student_grade_entries", { id: e.id, gradePeriodId: periodId, studentId: e.studentId, gradeItemId: item.id, score: null, employeeId: entryEmployeeId ?? null });
  },

  updateGradeCategories: (periodId, categories) => {
    set((state) => ({ gradePeriods: state.gradePeriods.map((p) => (p.id === periodId ? { ...p, categories } : p)) }));
    dbDeleteWhere("grade_categories", "grade_period_id", periodId);
    for (const c of categories) dbInsert("grade_categories", { gradePeriodId: periodId, name: c.name, weight: c.weight });
  },

  finalizeGradePeriod: (periodId, finalizedBy) => {
    const now = new Date().toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
    set((state) => ({
      gradePeriods: state.gradePeriods.map((p) => (p.id === periodId ? { ...p, isFinalized: true, finalizedAt: now, finalizedBy } : p))
    }));
    dbUpdate("grade_periods", periodId, { isFinalized: true, finalizedAt: now, finalizedBy });
  },

  addEmployee: (employee) => {
    const newEmp: Employee = { ...employee, id: newId() };
    set((state) => ({ employees: [...state.employees, newEmp] }));
    dbInsert("employees", withSchoolFk(newEmp));
    return newEmp;
  },

  updateEmployee: (id, updates) => {
    set((state) => ({ employees: state.employees.map((e) => (e.id === id ? { ...e, ...updates } : e)) }));
    dbUpdate("employees", id, "schoolId" in updates ? withSchoolFk(updates as any) : updates);
  },

  updateTeacher: (id, updates) => {
    // Faculty identity/metadata is employee-backed now. Update the local
    // (employee-derived) teacher slice for UI reactivity, then persist faculty-only
    // fields to employee_faculty_profiles — NOT public.teachers (teacher→employee
    // consolidation, Phase 6 prep). Shared identity fields (name/email/department/
    // contact) belong on employees and are persisted via updateEmployee by callers.
    set((state) => ({ teachers: state.teachers.map((teacher) => (teacher.id === id ? { ...teacher, ...updates } : teacher)) }));
    const teacher = get().teachers.find((t) => t.id === id);
    const employeeId = teacher?.employeeId;
    if (!employeeId) return;
    const profileUpdates: Record<string, any> = {};
    if ("specialization" in updates) profileUpdates.specialization = updates.specialization ?? null;
    if ("advisorySection" in updates) profileUpdates.advisory_section = updates.advisorySection ?? null;
    if (Object.keys(profileUpdates).length === 0) return;
    supabase
      .from("employee_faculty_profiles")
      .upsert({ employee_id: employeeId, ...profileUpdates }, { onConflict: "employee_id" })
      .then(({ error }) => {
        if (error) console.error("[supabase] upsert employee_faculty_profiles failed:", error);
      });
  },

  upsertEmployeeFacultyProfile: (employeeId, profile) => {
    const employee = get().employees.find((e) => e.id === employeeId);
    if (!employee) return;
    const isTeachingStaff = profile.isTeachingStaff ?? true;

    set((state) => {
      const employees = state.employees.map((e) =>
        e.id === employeeId
          ? {
              ...e,
              isTeachingStaff,
              facultyRank: profile.facultyRank !== undefined ? profile.facultyRank : e.facultyRank,
            }
          : e,
      );

      const existingTeacher = state.teachers.find((t) => t.employeeId === employeeId);
      let teachers = state.teachers;
      if (existingTeacher) {
        teachers = state.teachers.map((t) =>
          t.employeeId === employeeId
            ? {
                ...t,
                specialization: profile.specialization !== undefined ? profile.specialization : t.specialization,
                advisorySection: profile.advisorySection !== undefined ? profile.advisorySection : t.advisorySection,
              }
            : t,
        );
      } else if (isTeachingStaff) {
        // Brand-new faculty tagging: synthesize a Teacher entry with no legacy
        // teacher_id, matching dataLoader's employee-backed teacher shape.
        teachers = [
          ...state.teachers,
          {
            id: employee.id,
            schoolId: employee.schoolId,
            userId: employee.userId,
            employeeId: employee.id,
            firstName: employee.firstName,
            lastName: employee.lastName,
            middleName: employee.middleName ?? "",
            department: employee.department as Teacher["department"],
            email: employee.email ?? "",
            phone: employee.contact ?? "",
            specialization: profile.specialization ?? "",
            advisorySection: profile.advisorySection,
            isActive: employee.employmentStatus ? employee.employmentStatus === "Active" : true,
          },
        ];
      }

      return { employees, teachers };
    });

    const dbUpdates: Record<string, any> = { employee_id: employeeId, is_teaching_staff: isTeachingStaff };
    if (profile.specialization !== undefined) dbUpdates.specialization = profile.specialization || null;
    if (profile.advisorySection !== undefined) dbUpdates.advisory_section = profile.advisorySection || null;
    if (profile.facultyRank !== undefined) dbUpdates.faculty_rank = profile.facultyRank || null;

    supabase
      .from("employee_faculty_profiles")
      .upsert(dbUpdates, { onConflict: "employee_id" })
      .then(({ error }) => {
        if (error) console.error("[supabase] upsert employee_faculty_profiles failed:", error);
      });
  },

  addPayrollRow: (row) => {
    set((state) => ({ payroll: [row, ...state.payroll] }));
    dbInsert("payroll", row);
  },

  markPaidPayroll: (id) => {
    set((state) => ({ payroll: state.payroll.map((p) => (p.id === id ? { ...p, status: "Paid" } : p)) }));
    dbUpdate("payroll", id, { status: "Paid" });
  },

  processGlobalPayroll: () => {
    const employees = get().employees;
    const period = "June 01 - 15, 2026";
    const newRows: PayrollRow[] = employees.map((emp) => {
      const gross = emp.salary / 2;
      const allowance = emp.status === "Full-Time" ? 1750 : 500;
      const sss = Math.round(gross * 0.04);
      const phil = Math.round(gross * 0.015);
      const pag = 100;
      const tax = Math.round((gross - sss - phil - pag) * 0.08);
      const net = gross + allowance - (sss + phil + pag + tax);
      return {
        id: newId(), employeeId: emp.id, employeeName: `${emp.firstName} ${emp.lastName}`, position: emp.position,
        basicSalary: gross, allowances: allowance, sssDeduction: sss, philhealthDeduction: phil, pagibigDeduction: pag,
        taxDeduction: tax, netPay: net, period, status: "Pending"
      };
    });
    set((state) => ({ payroll: [...newRows, ...state.payroll] }));
    for (const row of newRows) dbInsert("payroll", row);
  },

  toggleUserStatus: async (id) => {
    const user = get().users.find((u) => u.id === id);
    if (!user) throw new Error("User account was not found.");
    const { error } = await supabase.rpc("app_set_user_active", {
      p_user_id: id,
      p_is_active: !user.isActive,
    });
    if (error) throw new Error(error.message || "User access could not be updated.");
    set((state) => ({ users: state.users.map((u) => (u.id === id ? { ...u, isActive: !u.isActive } : u)) }));
  },

  addAnnouncement: (annData) => {
    const author = get().currentUser?.name || "System Bureau";
    const newAnn: Announcement = { ...annData, id: newId(), date: todayStamp(), author };
    set((state) => ({ announcements: [newAnn, ...state.announcements] }));
    dbInsert("announcements", newAnn);
  },

  addCourse: (courseData) => {
    const newCourse: Course = { ...courseData, id: newId() };
    set((state) => ({ courses: [...state.courses, newCourse] }));
    dbInsert("courses", newCourse);
  },

  updateCourse: (id, updates) => {
    set((state) => ({ courses: state.courses.map((c) => (c.id === id ? { ...c, ...updates } : c)) }));
    dbUpdate("courses", id, updates);
  },

  deleteCourse: (id) => {
    set((state) => ({ courses: state.courses.filter((c) => c.id !== id) }));
    dbDelete("courses", id);
  },

  addSubject: (subjectData) => {
    const newSubject: Subject = { ...subjectData, id: newId() };
    set((state) => ({ subjects: [...state.subjects, newSubject] }));
    subjectCodeToId[newSubject.code] = newSubject.id;
    dbInsert("subjects", newSubject);
  },

  updateSubject: (id, updates) => {
    set((state) => ({ subjects: state.subjects.map((s) => (s.id === id ? { ...s, ...updates } : s)) }));
    dbUpdate("subjects", id, updates);
  },

  deleteSubject: (id) => {
    set((state) => ({ subjects: state.subjects.filter((s) => s.id !== id) }));
    dbDelete("subjects", id);
  },

  addCurriculum: (curriculumData) => {
    const newCurriculumId = newId();
    const newCurriculum: Curriculum = { ...curriculumData, id: newCurriculumId };
    set((state) => ({ curriculums: [...state.curriculums, newCurriculum] }));
    dbInsert("curriculums", { id: newCurriculumId, courseCodeOrStrand: curriculumData.courseCodeOrStrand, name: curriculumData.name });
    for (const block of curriculumData.subjects) {
      for (const code of block.subjectCodes) {
        const subjectId = resolveSubjectId(code);
        if (subjectId) {
          dbInsert("curriculum_subjects", { curriculum_id: newCurriculumId, subject_id: subjectId, yearLevel: block.yearLevel, semester: block.semester });
        } else {
          console.warn(`[addCurriculum] Subject code "${code}" could not be resolved to a DB ID — curriculum_subjects row skipped.`);
        }
      }
    }
  },

  updateCurriculum: (id, updates) => {
    set((state) => ({ curriculums: state.curriculums.map((c) => (c.id === id ? { ...c, ...updates } : c)) }));
    const { subjects, ...rest } = updates;
    if (Object.keys(rest).length > 0) dbUpdate("curriculums", id, rest);
    if (subjects) {
      dbDeleteWhere("curriculum_subjects", "curriculum_id", id);
      for (const block of subjects) {
        for (const code of block.subjectCodes) {
          const subjectId = resolveSubjectId(code);
          if (subjectId) {
            dbInsert("curriculum_subjects", { curriculum_id: id, subject_id: subjectId, yearLevel: block.yearLevel, semester: block.semester });
          } else {
            console.warn(`[updateCurriculum] Subject code "${code}" could not be resolved to a DB ID — curriculum_subjects row skipped.`);
          }
        }
      }
    }
  },

  deleteCurriculum: (id) => {
    set((state) => ({ curriculums: state.curriculums.filter((c) => c.id !== id) }));
    dbDelete("curriculums", id);
  },

  // ---- Core Setup Actions ----
  addSetupItem: (category, itemData) => {
    const { code, name, description, isActive, sortOrder, ...metadata } = itemData as any;
    const newItem = { ...itemData, id: newId(), createdAt: todayStamp(), createdBy: get().currentUser?.name || "System", isActive: itemData.isActive ?? true } as SetupItem;
    set((state) => ({ setupData: { ...state.setupData, [category]: [...(state.setupData[category] || []), newItem] } }));
    dbInsert("setup_items", { id: newItem.id, category, code: code ?? newItem.id, name, description, isActive: newItem.isActive, sortOrder, metadata, createdBy: newItem.createdBy, createdAt: newItem.createdAt });
    return newItem;
  },

  updateSetupItem: (category, id, updates) => {
    const updatedAt = todayStamp();
    set((state) => ({
      setupData: { ...state.setupData, [category]: (state.setupData[category] || []).map((item) => (item.id === id ? { ...item, ...updates, updatedAt } : item)) }
    }));
    const { code, name, description, isActive, sortOrder, ...metadata } = updates as any;
    const dbUpdates: any = { updatedAt };
    if (code !== undefined) dbUpdates.code = code;
    if (name !== undefined) dbUpdates.name = name;
    if (description !== undefined) dbUpdates.description = description;
    if (isActive !== undefined) dbUpdates.isActive = isActive;
    if (sortOrder !== undefined) dbUpdates.sortOrder = sortOrder;
    if (Object.keys(metadata).length > 0) dbUpdates.metadata = metadata;
    dbUpdate("setup_items", id, dbUpdates);
  },

  deleteSetupItem: (category, id) => {
    set((state) => ({ setupData: { ...state.setupData, [category]: (state.setupData[category] || []).filter((item) => item.id !== id) } }));
    dbDelete("setup_items", id);
  },

  toggleSetupItemActive: (category, id) => {
    const updatedAt = todayStamp();
    const current = get().setupData[category]?.find((i) => i.id === id);
    set((state) => ({
      setupData: { ...state.setupData, [category]: (state.setupData[category] || []).map((item) => (item.id === id ? { ...item, isActive: !item.isActive, updatedAt } : item)) }
    }));
    if (current) dbUpdate("setup_items", id, { isActive: !current.isActive, updatedAt });
  },

  // ---- Discount Management Actions ----
  addDiscountType: async (dtData) => {
    if (!get().financeWritesEnabled) throw financeMaintenanceError();
    const newDT: DiscountType = { ...dtData, id: newId(), createdAt: todayStamp(), isActive: dtData.isActive ?? true };
    const error = await dbInsert("discount_types", newDT);
    if (error) throw new Error("The discount type could not be created.");
    set((state) => ({ discountTypes: [...state.discountTypes, newDT] }));
  },

  updateDiscountType: async (id, updates) => {
    if (!get().financeWritesEnabled) throw financeMaintenanceError();
    const error = await dbUpdate("discount_types", id, updates);
    if (error) throw new Error("The discount type could not be updated.");
    set((state) => ({ discountTypes: state.discountTypes.map((dt) => (dt.id === id ? { ...dt, ...updates } : dt)) }));
  },

  deleteDiscountType: async (id) => {
    if (!get().financeWritesEnabled) throw financeMaintenanceError();
    const error = await dbDelete("discount_types", id);
    if (error) throw new Error("The discount type could not be deleted.");
    set((state) => ({ discountTypes: state.discountTypes.filter((dt) => dt.id !== id) }));
  },

  toggleDiscountTypeActive: async (id) => {
    if (!get().financeWritesEnabled) throw financeMaintenanceError();
    const dt = get().discountTypes.find((d) => d.id === id);
    if (!dt) throw new Error("The discount type was not found.");
    const error = await dbUpdate("discount_types", id, { isActive: !dt.isActive });
    if (error) throw new Error("The discount type status could not be updated.");
    set((state) => ({ discountTypes: state.discountTypes.map((d) => (d.id === id ? { ...d, isActive: !d.isActive } : d)) }));
  },

  addDiscountRequest: async (reqData) => {
    if (!get().financeWritesEnabled) throw financeMaintenanceError();
    const { data, error } = await supabase.rpc("submit_student_discount_request", {
      p_student_id: reqData.studentId,
      p_discount_type_id: reqData.discountTypeId,
      p_sibling_names: reqData.siblingNames,
      p_remarks: reqData.remarks ?? null,
      p_attachment_names: reqData.attachmentNames,
    });
    if (error || !data) {
      console.error("[supabase] submit_student_discount_request failed:", error);
      throw new Error(error?.message || "The discount request could not be submitted.");
    }
    const persisted = toCamel(data) as Partial<DiscountRequest> & { id: string; referenceNo: string; requestedAt: string };
    const auditEntry: AuditEntry = { id: newId(), action: "REQUEST_SUBMITTED", performedBy: get().currentUser?.name || reqData.requestedBy, performedAt: persisted.requestedAt, details: `Discount request submitted for ${reqData.discountTypeName}` };
    const newReq: DiscountRequest = {
      ...reqData, ...persisted, id: persisted.id, referenceNo: persisted.referenceNo,
      requestedAt: persisted.requestedAt, status: "Pending", level1Status: "Pending", level2Status: "Pending", auditTrail: [auditEntry]
    };
    set((state) => ({ discountRequests: [newReq, ...state.discountRequests] }));
    // Create + submit in approval engine (fire-and-forget)
    const actorADR = get().currentUser;
    if (actorADR) {
      createApprovalRequest({
        workflowType: "discount",
        entityType: "discount_request",
        entityId: newReq.id,
        requestedBy: actorADR.id,
        requestedRole: actorADR.role,
        requestTitle: `Discount — ${reqData.discountTypeName} for ${reqData.studentName ?? reqData.studentId}`,
      }).then((reqId) => submitApprovalRequest(reqId, actorADR))
        .catch((e) => console.error("[approvalWorkflow] addDiscountRequest failed:", e));
    }
    return newReq;
  },

  approveDiscountRequest: async (id, level, approvedBy, remarks) => {
    if (!get().financeWritesEnabled) throw financeMaintenanceError();
    const req = get().discountRequests.find((r) => r.id === id);
    if (!req) throw new Error("Discount request was not found.");
    const now = nowStamp();
    const auditEntry: AuditEntry = { id: newId(), action: `LEVEL_${level}_APPROVED`, performedBy: approvedBy, performedAt: now, details: remarks || `Approved at Level ${level}` };
    const { data, error } = await supabase.rpc("approve_student_discount_request", {
      p_request_id: id,
      p_level: level,
      p_approved_by: approvedBy,
      p_remarks: remarks ?? null,
    });
    if (error || !data) {
      console.error("[supabase] approve_student_discount_request failed:", error);
      throw new Error(error?.message || "The discount approval could not be posted.");
    }
    const result = toCamel(data) as {
      discountRequest: Partial<DiscountRequest>;
      assessment?: Partial<StudentAssessment> | null;
    };
    set((state) => ({
      discountRequests: state.discountRequests.map((req) => {
        if (req.id !== id) return req;
        return {
          ...req,
          ...result.discountRequest,
          auditTrail: [...req.auditTrail, auditEntry]
        };
      }),
      assessments: result.assessment
        ? state.assessments.map((assessment) =>
            assessment.id === result.assessment?.id
              ? { ...assessment, ...result.assessment }
              : assessment
          )
        : state.assessments,
    }));
    const actorApprDisc = get().currentUser;
    if (actorApprDisc) awActApprove(id, "discount", actorApprDisc, `Discount — ${req.referenceNo}`);
    if (result.assessment) await get().reloadFinanceData();
  },

  rejectDiscountRequest: async (id, level, approvedBy, remarks) => {
    if (!get().financeWritesEnabled) throw financeMaintenanceError();
    const { data, error } = await supabase.rpc("reject_student_discount_request", {
      p_request_id: id,
      p_level: level,
      p_rejected_by: approvedBy,
      p_remarks: remarks ?? null,
    });
    if (error || !data) {
      console.error("[supabase] reject_student_discount_request failed:", error);
      throw new Error(error?.message || "The discount rejection could not be posted.");
    }
    const persisted = toCamel(data) as Partial<DiscountRequest>;
    const now = nowStamp();
    const auditEntry: AuditEntry = { id: newId(), action: `LEVEL_${level}_REJECTED`, performedBy: approvedBy, performedAt: now, details: remarks || `Rejected at Level ${level}` };
    set((state) => ({
      discountRequests: state.discountRequests.map((req) => {
        if (req.id !== id) return req;
        const levelKey = level === 1 ? "level1" : "level2";
        return { ...req, ...persisted, [`${levelKey}Status`]: "Rejected", [`${levelKey}ApprovedBy`]: approvedBy, [`${levelKey}ApprovedAt`]: now, status: "Rejected", auditTrail: [...req.auditTrail, auditEntry] };
      })
    }));
    const actorRejDisc = get().currentUser;
    const discReq = get().discountRequests.find((r) => r.id === id);
    if (actorRejDisc && discReq) awActReject(id, "discount", actorRejDisc, `Discount — ${discReq.referenceNo}`, remarks || "Rejected");
  },

  // ---- Payment Void Approval Actions ----
  submitVoidRequest: async (reqData) => {
    if (!get().financeWritesEnabled) throw financeMaintenanceError();
    const { data, error } = await supabase.rpc("submit_payment_void_request", {
      p_payment_id: reqData.paymentId,
      p_requested_by: reqData.requestedBy,
      p_reason: reqData.reason,
    });
    if (error || !data) {
      console.error("[supabase] submit_payment_void_request failed:", error);
      throw new Error(error?.message || "The void request could not be saved.");
    }
    const persisted = toCamel(data) as {
      id: string;
      requestedAt: string;
      status: VoidRequest["status"];
    };
    const newReq: VoidRequest = {
      ...reqData,
      id: persisted.id,
      requestedAt: persisted.requestedAt,
      status: persisted.status,
    };
    set((state) => ({ voidRequests: [newReq, ...state.voidRequests.filter((r) => r.id !== newReq.id)] }));
    const actorSVR = get().currentUser;
    if (actorSVR) {
      createApprovalRequest({
        workflowType: "payment_void",
        entityType: "void_request",
        entityId: newReq.id,
        schoolId: reqData.schoolId as string | undefined,
        requestedBy: actorSVR.id,
        requestedRole: actorSVR.role,
        requestTitle: `Void — OR ${reqData.orNumber} for ${reqData.studentName}`,
        priority: "High",
      }).then((reqId) => submitApprovalRequest(reqId, actorSVR))
        .catch((e) => console.error("[approvalWorkflow] submitVoidRequest failed:", e));
    }
    return newReq;
  },

  approveVoidRequest: async (id, reviewedBy, remarks) => {
    if (!get().financeWritesEnabled) throw financeMaintenanceError();
    const req = get().voidRequests.find((r) => r.id === id);
    const { error } = await supabase.rpc("review_payment_void_request", {
      p_request_id: id,
      p_approved: true,
      p_reviewed_by: reviewedBy,
      p_remarks: remarks ?? null,
    });
    if (error) {
      console.error("[supabase] review_payment_void_request approve failed:", error);
      throw new Error(error.message || "The payment could not be voided.");
    }
    const refreshed = await loadAllData();
    set({
      payments: refreshed.payments,
      voidRequests: refreshed.voidRequests,
      assessments: refreshed.assessments,
      enrollments: refreshed.enrollments,
      students: refreshed.students,
      ledgerTransactions: refreshed.ledgerTransactions,
      studentLedgerSummaries: refreshed.studentLedgerSummaries,
      assessmentBillingSummaries: refreshed.assessmentBillingSummaries,
      paymentCollectionSummaries: refreshed.paymentCollectionSummaries,
    });
    const actorAVR = get().currentUser;
    if (actorAVR && req) awActApprove(id, "payment_void", actorAVR, `Void — OR ${req.orNumber}`, req.schoolId as string | undefined, remarks);
    if (req) get().addNotification({ title: "Void Request Approved", body: `OR No. ${req.orNumber} for ${req.studentName} has been approved for voiding.`, type: "approval", entityType: "void", entityId: id, targetRoles: ["CASHIER", "ACCOUNTING", "SUPER_ADMIN", "ADMIN"], schoolId: req.schoolId });
  },

  rejectVoidRequest: async (id, reviewedBy, remarks) => {
    if (!get().financeWritesEnabled) throw financeMaintenanceError();
    const req = get().voidRequests.find((r) => r.id === id);
    const { error } = await supabase.rpc("review_payment_void_request", {
      p_request_id: id,
      p_approved: false,
      p_reviewed_by: reviewedBy,
      p_remarks: remarks,
    });
    if (error) {
      console.error("[supabase] review_payment_void_request reject failed:", error);
      throw new Error(error.message || "The void request could not be rejected.");
    }
    set((state) => ({
      voidRequests: state.voidRequests.map((r) =>
        r.id !== id ? r : { ...r, status: "Rejected", reviewedBy, reviewedAt: nowStamp(), reviewRemarks: remarks }
      ),
    }));
    const actorRVR = get().currentUser;
    if (actorRVR && req) awActReject(id, "payment_void", actorRVR, `Void — OR ${req.orNumber}`, remarks, req.schoolId as string | undefined);
    if (req) get().addNotification({ title: "Void Request Rejected", body: `Void request for OR No. ${req.orNumber} was rejected: ${remarks}`, type: "rejection", entityType: "void", entityId: id, targetRoles: ["CASHIER", "ACCOUNTING", "SUPER_ADMIN", "ADMIN"], schoolId: req.schoolId });
  },

  // ---- Cash Voucher Release Actions ----
  submitCashVoucherRequest: (reqData) => {
    const newVoucher: CashVoucher = { ...reqData, id: newId(), requestedAt: nowStamp(), status: "Pending Approval" };
    set((state) => ({ cashVouchers: [newVoucher, ...state.cashVouchers] }));
    dbInsert("cash_vouchers", newVoucher);
    const actorSCV = get().currentUser;
    if (actorSCV) {
      createApprovalRequest({
        workflowType: "cash_voucher_release",
        entityType: "cash_voucher",
        entityId: newVoucher.id,
        schoolId: reqData.schoolId as string | undefined,
        requestedBy: actorSCV.id,
        requestedRole: actorSCV.role,
        requestTitle: `Cash Voucher — ${newVoucher.voucherNo} for ${newVoucher.payeeName}`,
        priority: "High",
      }).then((reqId) => submitApprovalRequest(reqId, actorSCV))
        .catch((e) => console.error("[approvalWorkflow] submitCashVoucherRequest failed:", e));
    }
    return newVoucher;
  },

  approveCashVoucher: (id, reviewedBy, remarks) => {
    const now = nowStamp();
    const voucher = get().cashVouchers.find((v) => v.id === id);
    set((state) => ({
      cashVouchers: state.cashVouchers.map((v) =>
        v.id !== id ? v : { ...v, status: "Approved", approvedBy: reviewedBy, approvedAt: now, reviewRemarks: remarks }
      ),
    }));
    dbUpdate("cash_vouchers", id, { status: "Approved", approvedBy: reviewedBy, approvedAt: now, reviewRemarks: remarks });
    const actorACV = get().currentUser;
    if (actorACV && voucher) awActApprove(id, "cash_voucher_release", actorACV, `Cash Voucher — ${voucher.voucherNo}`, voucher.schoolId as string | undefined, remarks);
    if (voucher) get().addNotification({ title: "Cash Voucher Approved", body: `Voucher No. ${voucher.voucherNo} for ${voucher.payeeName} has been approved and is ready for release.`, type: "approval", entityType: "cash_voucher", entityId: id, targetRoles: ["CASHIER", "ACCOUNTING", "SUPER_ADMIN", "ADMIN"], schoolId: voucher.schoolId });
  },

  rejectCashVoucher: (id, reviewedBy, remarks) => {
    const now = nowStamp();
    const voucher = get().cashVouchers.find((v) => v.id === id);
    set((state) => ({
      cashVouchers: state.cashVouchers.map((v) =>
        v.id !== id ? v : { ...v, status: "Rejected", approvedBy: reviewedBy, approvedAt: now, reviewRemarks: remarks }
      ),
    }));
    dbUpdate("cash_vouchers", id, { status: "Rejected", approvedBy: reviewedBy, approvedAt: now, reviewRemarks: remarks });
    const actorRCV = get().currentUser;
    if (actorRCV && voucher) awActReject(id, "cash_voucher_release", actorRCV, `Cash Voucher — ${voucher.voucherNo}`, remarks, voucher.schoolId as string | undefined);
    if (voucher) get().addNotification({ title: "Cash Voucher Rejected", body: `Voucher No. ${voucher.voucherNo} for ${voucher.payeeName} was rejected: ${remarks}`, type: "rejection", entityType: "cash_voucher", entityId: id, targetRoles: ["CASHIER", "ACCOUNTING", "SUPER_ADMIN", "ADMIN"], schoolId: voucher.schoolId });
  },

  releaseCashVoucher: (id, releasedBy, referenceNo) => {
    const now = nowStamp();
    const voucher = get().cashVouchers.find((v) => v.id === id);
    if (!voucher || voucher.status !== "Approved") return;
    set((state) => ({
      cashVouchers: state.cashVouchers.map((v) =>
        v.id !== id ? v : { ...v, status: "Released", releasedBy, releasedAt: now, referenceNo }
      ),
    }));
    dbUpdate("cash_vouchers", id, { status: "Released", releasedBy, releasedAt: now, referenceNo });
    get().addNotification({ title: "Cash Released", body: `Voucher No. ${voucher.voucherNo} for ${voucher.payeeName} (₱${voucher.amount.toLocaleString()}) has been released.`, type: "info", entityType: "cash_voucher", entityId: id, targetRoles: ["CASHIER", "ACCOUNTING", "SUPER_ADMIN", "ADMIN"], schoolId: voucher.schoolId });
  },

  // ---- Notification Actions ----
  addNotification: (n) => {
    const notif: STSNNotification = { ...n, id: newId(), createdAt: new Date().toISOString(), readBy: [] };
    set((state) => ({ notifications: [notif, ...state.notifications].slice(0, 100) }));
  },

  markNotificationRead: (id, userId) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id !== id || n.readBy.includes(userId) ? n : { ...n, readBy: [...n.readBy, userId] }
      ),
    }));
  },

  clearAllNotifications: () => {
    set({ notifications: [] });
  },

  // ---- Grade Submission Workflow ----
  submitGradePeriod: (periodId, submittedBy) => {
    const now = nowStamp();
    const period = get().gradePeriods.find((p) => p.id === periodId);
    set((state) => ({
      gradePeriods: state.gradePeriods.map((p) =>
        p.id !== periodId ? p : { ...p, submittedForApproval: true, submittedAt: now, submittedBy, gradeApprovalStatus: "Submitted" as const }
      ),
    }));
    dbUpdate("grade_periods", periodId, {
      submittedForApproval: true,
      submittedAt: now,
      submittedBy,
      gradeApprovalStatus: "Submitted",
    });
    // Persist to approval engine
    const actorSGP = get().currentUser;
    if (actorSGP && period) {
      createApprovalRequest({
        workflowType: "grade_period",
        entityType: "grade_period",
        entityId: periodId,
        requestedBy: actorSGP.id,
        requestedRole: actorSGP.role,
        requestTitle: `Grade Period — ${period.label} ${period.subjectCode}`,
      }).then((id) => submitApprovalRequest(id, actorSGP))
        .catch((e) => console.error("[approvalWorkflow] submitGradePeriod failed:", e));
    }
    if (period) get().addNotification({ title: "Grade Period Submitted for Approval", body: `${period.label} — ${period.subjectCode} submitted by ${submittedBy} and awaiting Principal approval.`, type: "reminder", entityType: "grade", entityId: periodId, targetRoles: ["PRINCIPAL", "SUPER_ADMIN", "ADMIN"] });
  },

  approveGradePeriod: (periodId, approvedBy) => {
    const now = nowStamp();
    const period = get().gradePeriods.find((p) => p.id === periodId);
    set((state) => ({
      gradePeriods: state.gradePeriods.map((p) =>
        p.id !== periodId ? p : { ...p, isFinalized: true, finalizedAt: now, finalizedBy: approvedBy, gradeApprovalStatus: "Approved" as const, approvedAt: now, approvedBy }
      ),
    }));
    dbUpdate("grade_periods", periodId, {
      isFinalized: true,
      finalizedAt: now,
      finalizedBy: approvedBy,
      submittedForApproval: false,
      gradeApprovalStatus: "Approved",
      approvedAt: now,
      approvedBy,
    });
    const actorAGP = get().currentUser;
    if (actorAGP && period) awActApprove(periodId, "grade_period", actorAGP, `Grade Period — ${period.label} ${period.subjectCode}`);
    if (period) get().addNotification({ title: "Grade Period Approved", body: `${period.label} — ${period.subjectCode} has been approved and finalized by ${approvedBy}.`, type: "approval", entityType: "grade", entityId: periodId, targetRoles: ["TEACHER", "REGISTRAR", "SUPER_ADMIN", "ADMIN"] });
  },

  returnGradePeriod: (periodId, returnedBy, remarks) => {
    const now = nowStamp();
    const period = get().gradePeriods.find((p) => p.id === periodId);
    set((state) => ({
      gradePeriods: state.gradePeriods.map((p) =>
        p.id !== periodId ? p : { ...p, submittedForApproval: false, gradeApprovalStatus: "Returned" as const, returnRemarks: remarks, returnedAt: now, returnedBy }
      ),
    }));
    dbUpdate("grade_periods", periodId, {
      submittedForApproval: false,
      gradeApprovalStatus: "Returned",
      returnRemarks: remarks,
      returnedAt: now,
      returnedBy,
    });
    const actorRGP = get().currentUser;
    if (actorRGP && period) awActReturn(periodId, "grade_period", actorRGP, `Grade Period — ${period.label} ${period.subjectCode}`, remarks);
    if (period) get().addNotification({ title: "Grade Period Returned", body: `${period.label} — ${period.subjectCode} was returned for revision: ${remarks}`, type: "return", entityType: "grade", entityId: periodId, targetRoles: ["TEACHER", "SUPER_ADMIN", "ADMIN"] });
  },

  // ---- Class Scheduling Actions ----
  addClassSchedule: (scheduleData) => {
    // employee_id is the authoritative owner; teacher_id is a REMOVABLE dual-write
    // (legacy FK → public.teachers) kept only for the dual-read window.
    const employeeId = scheduleData.employeeId ?? resolveTeacherEmployeeId(get().teachers, scheduleData.teacherId);
    const newSchedule: ClassSchedule = { ...scheduleData, employeeId, id: newId() };
    set((state) => ({ classSchedules: [...state.classSchedules, newSchedule] }));
    dbInsert("class_schedules", withSubjectFk({ ...scheduleData, employeeId, id: newSchedule.id, roomName: scheduleData.roomName, courseOrTrack: scheduleData.courseOrTrack }));
    return newSchedule;
  },

  updateClassSchedule: (id, updates) => {
    const current = get().classSchedules.find((schedule) => schedule.id === id);
    const teacherId = "teacherId" in updates ? updates.teacherId : current?.teacherId;
    const employeeId =
      ("employeeId" in updates && updates.employeeId !== undefined)
        ? updates.employeeId
        : resolveTeacherEmployeeId(get().teachers, teacherId);
    const mergedUpdates = { ...updates, ...(employeeId !== undefined ? { employeeId } : {}) };
    set((state) => ({ classSchedules: state.classSchedules.map((s) => (s.id === id ? { ...s, ...mergedUpdates } : s)) }));
    dbUpdate("class_schedules", id, "subjectCode" in mergedUpdates ? withSubjectFk(mergedUpdates) : mergedUpdates);
  },

  deleteClassSchedule: (id) => {
    set((state) => ({ classSchedules: state.classSchedules.filter((s) => s.id !== id) }));
    dbDelete("class_schedules", id);
  },

  toggleClassScheduleActive: (id) => {
    const sched = get().classSchedules.find((s) => s.id === id);
    set((state) => ({ classSchedules: state.classSchedules.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s)) }));
    if (sched) dbUpdate("class_schedules", id, { isActive: !sched.isActive });
  },

  assignSectionAdviser: (sectionId, teacherId) => {
    const targetSection = get().sections.find((section) => section.id === sectionId);
    if (!targetSection) return;

    const selectedTeacher = teacherId ? get().teachers.find((teacher) => teacher.id === teacherId) : undefined;
    // Employee ownership is authoritative for advisory assignment now.
    const adviserEmployeeId = selectedTeacher?.employeeId;
    const previousAdviserId = targetSection.adviserId;
    // Detect a prior advisory assignment for this faculty member by employee
    // ownership first (canonical), falling back to the legacy teacher id.
    const previousSection = teacherId
      ? get().sections.find(
          (section) =>
            section.id !== sectionId &&
            ((adviserEmployeeId && section.adviserEmployeeId === adviserEmployeeId) ||
              section.adviserId === teacherId),
        )
      : undefined;
    const adviserName = selectedTeacher ? `${selectedTeacher.firstName} ${selectedTeacher.lastName}` : undefined;

    set((state) => ({
      sections: state.sections.map((section) => {
        if (section.id === sectionId) {
          return { ...section, adviserId: teacherId || undefined, adviserEmployeeId, adviserName };
        }
        if (teacherId && section.adviserId === teacherId) {
          return { ...section, adviserId: undefined, adviserEmployeeId: undefined, adviserName: undefined };
        }
        return section;
      }),
      teachers: state.teachers.map((teacher) => {
        if (teacher.id === teacherId) return { ...teacher, advisorySection: targetSection.name };
        if (teacher.id === previousAdviserId && teacher.advisorySection === targetSection.name) {
          return { ...teacher, advisorySection: undefined };
        }
        if (teacher.id !== teacherId && teacher.advisorySection === targetSection.name) {
          return { ...teacher, advisorySection: undefined };
        }
        return teacher;
      }),
    }));

    // adviser_employee_id is the authoritative ownership column. adviser_id is
    // kept in sync as a REMOVABLE dual-write (legacy FK → public.teachers) for the
    // dual-read window; drop the adviserId half before Phase 6 retires the column.
    dbUpdate("sections", sectionId, { adviserId: teacherId, adviserEmployeeId });
    if (previousSection) dbUpdate("sections", previousSection.id, { adviserId: null, adviserEmployeeId: null });
  },

  // ---- Multi-school ----
  setActiveSchool: (school) => {
    const currentUser = get().currentUser;
    if (currentUser) {
      writeStoredAuthSession({ userId: currentUser.id, activeSchool: school });
    }
    set({ activeSchool: school, academicUnit: getAcademicUnit(school) });
  },

  // ---- LMS Actions ----
  addLearningMaterial: (materialData) => {
    // employee_id is the authoritative owner; teacher_id is a REMOVABLE dual-write
    // (legacy FK → public.teachers) kept only for the dual-read window.
    const employeeId = materialData.employeeId ?? resolveTeacherEmployeeId(get().teachers, materialData.teacherId);
    const newMaterial: LearningMaterial = { ...materialData, employeeId, id: newId() };
    set((state) => ({ learningMaterials: [newMaterial, ...state.learningMaterials] }));
    dbInsert("learning_materials", withSubjectFk(withSchoolFk({ ...materialData, employeeId, id: newMaterial.id })));
    return newMaterial;
  },

  updateLearningMaterial: (id, updates) => {
    const current = get().learningMaterials.find((material) => material.id === id);
    const teacherId = "teacherId" in updates ? updates.teacherId : current?.teacherId;
    const employeeId =
      ("employeeId" in updates && updates.employeeId !== undefined)
        ? updates.employeeId
        : resolveTeacherEmployeeId(get().teachers, teacherId);
    const mergedUpdates = { ...updates, ...(employeeId !== undefined ? { employeeId } : {}) };
    set((state) => ({ learningMaterials: state.learningMaterials.map((m) => (m.id === id ? { ...m, ...mergedUpdates } : m)) }));
    let dbUpdates: any = mergedUpdates;
    if ("schoolId" in updates) dbUpdates = withSchoolFk(dbUpdates);
    if ("subjectCode" in updates) dbUpdates = withSubjectFk(dbUpdates);
    dbUpdate("learning_materials", id, dbUpdates);
  },

  deleteLearningMaterial: (id) => {
    set((state) => ({ learningMaterials: state.learningMaterials.filter((m) => m.id !== id) }));
    dbDelete("learning_materials", id);
  },

  toggleLearningMaterialPublish: (id) => {
    const material = get().learningMaterials.find((m) => m.id === id);
    set((state) => ({
      learningMaterials: state.learningMaterials.map((m) => (m.id === id ? { ...m, publishStatus: m.publishStatus === "Published" ? "Draft" : "Published" } : m))
    }));
    if (material) dbUpdate("learning_materials", id, { publishStatus: material.publishStatus === "Published" ? "Draft" : "Published" });
  },

  // ---- HR Bulk Import ----
  bulkImportEmployees: (employeesData) => {
    const newEmployees: Employee[] = employeesData.map((emp) => ({ ...emp, id: newId() }));
    set((state) => ({ employees: [...state.employees, ...newEmployees] }));
    for (const emp of newEmployees) dbInsert("employees", withSchoolFk(emp));
  },

  // ---- HR Phase 2: Employee Lifecycle ----
  addEmployeeLifecycleEvent: (eventData) => {
    const newEvent: EmployeeLifecycleEvent = { ...eventData, id: newId(), createdAt: new Date().toISOString() };
    set((state) => ({ employeeLifecycleEvents: [newEvent, ...state.employeeLifecycleEvents] }));
    dbInsert("employee_lifecycle_events", {
      id: newEvent.id, employee_id: newEvent.employeeId, event_type: newEvent.eventType,
      from_status: newEvent.fromStatus, to_status: newEvent.toStatus, effective_date: newEvent.effectiveDate,
      remarks: newEvent.remarks, created_by: newEvent.createdBy,
    });
  },

  updateEmployeeLifecycleStatus: (employeeId, toStatus, fromStatus, remarks, createdBy) => {
    const eventData: Omit<EmployeeLifecycleEvent, "id" | "createdAt"> = {
      employeeId, eventType: "Status Change", fromStatus, toStatus,
      effectiveDate: new Date().toISOString().split("T")[0], remarks, createdBy,
    };
    get().addEmployeeLifecycleEvent(eventData);
    get().updateEmployee(employeeId, { employmentStatus: toStatus });
  },

  // ---- HR Phase 3: Shift Templates ----
  addShiftTemplate: (templateData) => {
    const newTemplate: ShiftTemplate = { ...templateData, id: newId(), createdAt: new Date().toISOString() };
    set((state) => ({ shiftTemplates: [...state.shiftTemplates, newTemplate] }));
    dbInsert("shift_templates", {
      id: newTemplate.id, school_id: resolveSchoolId(newTemplate.schoolId), code: newTemplate.code,
      name: newTemplate.name, start_time: newTemplate.startTime, end_time: newTemplate.endTime,
      break_minutes: newTemplate.breakMinutes, is_overnight: newTemplate.isOvernight, is_active: newTemplate.isActive,
    });
  },

  updateShiftTemplate: (id, updates) => {
    set((state) => ({ shiftTemplates: state.shiftTemplates.map((t) => (t.id === id ? { ...t, ...updates } : t)) }));
    dbUpdate("shift_templates", id, updates);
  },

  toggleShiftTemplateActive: (id) => {
    const template = get().shiftTemplates.find((t) => t.id === id);
    set((state) => ({ shiftTemplates: state.shiftTemplates.map((t) => (t.id === id ? { ...t, isActive: !t.isActive } : t)) }));
    if (template) dbUpdate("shift_templates", id, { is_active: !template.isActive });
  },

  assignEmployeeShift: (assignmentData) => {
    const newAssignment: EmployeeShiftAssignment = { ...assignmentData, id: newId(), createdAt: new Date().toISOString() };
    set((state) => ({ employeeShiftAssignments: [newAssignment, ...state.employeeShiftAssignments] }));
    dbInsert("employee_shift_assignments", {
      id: newAssignment.id, employee_id: newAssignment.employeeId, shift_template_id: newAssignment.shiftTemplateId,
      effective_from: newAssignment.effectiveFrom, effective_to: newAssignment.effectiveTo, rest_days: newAssignment.restDays,
    });
  },

  // ---- HR Phase 3: Time Logs ----
  addEmployeeTimeLog: (logData) => {
    const newLog: EmployeeTimeLog = { ...logData, id: newId(), createdAt: new Date().toISOString() };
    set((state) => ({ employeeTimeLogs: [newLog, ...state.employeeTimeLogs] }));
    dbInsert("employee_time_logs", {
      id: newLog.id, employee_id: newLog.employeeId, log_date: newLog.logDate, time_in: newLog.timeIn,
      time_out: newLog.timeOut, source: newLog.source, is_approved: newLog.isApproved, remarks: newLog.remarks,
    });
  },

  approveEmployeeTimeLog: (id, approvedBy) => {
    const now = new Date().toISOString();
    set((state) => ({
      employeeTimeLogs: state.employeeTimeLogs.map((l) => l.id === id ? { ...l, isApproved: true, approvedBy, approvedAt: now } : l)
    }));
    dbUpdate("employee_time_logs", id, { is_approved: true, approved_by: approvedBy, approved_at: now });
  },

  // ---- HR Phase 3: Attendance ----
  addEmployeeAttendance: (recordData) => {
    const newRecord: EmployeeAttendance = { ...recordData, id: newId(), createdAt: new Date().toISOString() };
    set((state) => ({ employeeAttendance: [newRecord, ...state.employeeAttendance] }));
    dbInsert("employee_attendance", {
      id: newRecord.id, employee_id: newRecord.employeeId, attendance_date: newRecord.attendanceDate,
      time_in: newRecord.timeIn, time_out: newRecord.timeOut, status: newRecord.status,
      late_minutes: newRecord.lateMinutes, undertime_minutes: newRecord.undertimeMinutes,
      overtime_minutes: newRecord.overtimeMinutes, remarks: newRecord.remarks,
    });
  },

  updateEmployeeAttendance: (id, updates) => {
    set((state) => ({ employeeAttendance: state.employeeAttendance.map((a) => (a.id === id ? { ...a, ...updates } : a)) }));
    dbUpdate("employee_attendance", id, updates);
  },

  // ---- HR Phase 3: Leave Requests ----
  addLeaveRequest: (requestData) => {
    const newRequest: LeaveRequest = { ...requestData, id: newId(), createdAt: new Date().toISOString() };
    set((state) => ({ leaveRequests: [newRequest, ...state.leaveRequests] }));
    dbInsert("leave_requests", {
      id: newRequest.id, employee_id: newRequest.employeeId, leave_type_id: newRequest.leaveTypeId,
      start_date: newRequest.startDate, end_date: newRequest.endDate, total_days: newRequest.totalDays,
      reason: newRequest.reason, status: newRequest.status,
    });
  },

  approveLeaveRequest: (id, approvedBy, remarks) => {
    const now = new Date().toISOString();
    const req = get().leaveRequests.find((r) => r.id === id);
    const emp = req ? get().employees.find((e) => e.id === req.employeeId) : undefined;
    set((state) => ({
      leaveRequests: state.leaveRequests.map((r) => r.id === id ? { ...r, status: "Approved", approvedBy, approvedAt: now, remarks: remarks ?? r.remarks } : r)
    }));
    dbUpdate("leave_requests", id, { status: "Approved", approved_by: approvedBy, approved_at: now, remarks });
    const actorALR = get().currentUser;
    if (actorALR && req) awActApprove(id, "leave_request", actorALR, `Leave Request — ${req.employeeId}`, undefined, remarks);
    if (req) get().addNotification({ title: "Leave Request Approved", body: `Leave request for ${emp ? `${emp.firstName} ${emp.lastName}` : "employee"} (${req.startDate} – ${req.endDate}) has been approved.`, type: "approval", entityType: "leave", entityId: id, targetRoles: ["HR", "SUPER_ADMIN", "ADMIN"] });
  },

  rejectLeaveRequest: (id, approvedBy, remarks) => {
    const now = new Date().toISOString();
    const req = get().leaveRequests.find((r) => r.id === id);
    const emp = req ? get().employees.find((e) => e.id === req.employeeId) : undefined;
    set((state) => ({
      leaveRequests: state.leaveRequests.map((r) => r.id === id ? { ...r, status: "Rejected", approvedBy, approvedAt: now, remarks } : r)
    }));
    dbUpdate("leave_requests", id, { status: "Rejected", approved_by: approvedBy, approved_at: now, remarks });
    const actorRLR = get().currentUser;
    if (actorRLR && req) awActReject(id, "leave_request", actorRLR, `Leave Request — ${req.employeeId}`, remarks ?? "");
    if (req) get().addNotification({ title: "Leave Request Rejected", body: `Leave request for ${emp ? `${emp.firstName} ${emp.lastName}` : "employee"} was rejected: ${remarks}`, type: "rejection", entityType: "leave", entityId: id, targetRoles: ["HR", "SUPER_ADMIN", "ADMIN"] });
  },

  cancelLeaveRequest: (id) => {
    set((state) => ({
      leaveRequests: state.leaveRequests.map((r) => r.id === id ? { ...r, status: "Cancelled" } : r)
    }));
    dbUpdate("leave_requests", id, { status: "Cancelled" });
  },

  // ---- HR Phase 4: Payroll Periods ----
  addPayrollPeriod: (periodData) => {
    const newPeriod: PayrollPeriod = { ...periodData, id: newId(), createdAt: new Date().toISOString() };
    set((state) => ({ payrollPeriods: [newPeriod, ...state.payrollPeriods] }));
    dbInsert("payroll_periods", {
      id: newPeriod.id, school_id: resolveSchoolId(newPeriod.schoolId), period_code: newPeriod.periodCode,
      label: newPeriod.label, start_date: newPeriod.startDate, end_date: newPeriod.endDate,
      payout_date: newPeriod.payoutDate, status: newPeriod.status,
    });
    return newPeriod;
  },

  addPayrollRun: (runData) => {
    const newRun: PayrollRun = { ...runData, id: newId(), createdAt: new Date().toISOString() };
    set((state) => ({ payrollRuns: [newRun, ...state.payrollRuns] }));
    dbInsert("payroll_runs", {
      id: newRun.id, school_id: resolveSchoolId(newRun.schoolId), payroll_period_id: newRun.payrollPeriodId,
      run_no: newRun.runNo, status: newRun.status, notes: newRun.notes,
    });
    return newRun;
  },

  updatePayrollRunStatus: (id, status, by) => {
    const now = new Date().toISOString();
    set((state) => ({
      payrollRuns: state.payrollRuns.map((r) => {
        if (r.id !== id) return r;
        const updates: Partial<PayrollRun> = { status };
        if (status === "Computed") { updates.computedBy = by; updates.computedAt = now; }
        if (status === "Approved") { updates.approvedBy = by; updates.approvedAt = now; }
        return { ...r, ...updates };
      }),
      payrollLines: state.payrollLines.map((line) => {
        if (line.payrollRunId !== id) return line;
        if (status === "Approved") return { ...line, status: "Approved" };
        if (status === "Released") return { ...line, status: "Released" };
        if (status === "Cancelled") return { ...line, status: "Cancelled" };
        return line;
      }),
    }));
    const dbUpdates: any = { status };
    if (status === "Computed") { dbUpdates.computed_by = by; dbUpdates.computed_at = now; }
    if (status === "Approved") { dbUpdates.approved_by = by; dbUpdates.approved_at = now; }
    dbUpdate("payroll_runs", id, dbUpdates);
    if (status === "Approved" || status === "Released" || status === "Cancelled") {
      get().payrollLines
        .filter((line) => line.payrollRunId === id)
        .forEach((line) => dbUpdate("payroll_lines", line.id, { status }));
    }
  },

  addPayrollLine: (lineData) => {
    const newLine: PayrollLine = { ...lineData, id: newId(), createdAt: new Date().toISOString() };
    set((state) => ({ payrollLines: [...state.payrollLines, newLine] }));
    dbInsert("payroll_lines", {
      id: newLine.id, payroll_run_id: newLine.payrollRunId, employee_id: newLine.employeeId,
      basic_pay: newLine.basicPay, allowances: newLine.allowances, overtime_pay: newLine.overtimePay,
      late_deduction: newLine.lateDeduction, undertime_deduction: newLine.undertimeDeduction, absence_deduction: newLine.absenceDeduction,
      sss_deduction: newLine.sssDeduction, philhealth_deduction: newLine.philhealthDeduction, pagibig_deduction: newLine.pagibigDeduction,
      withholding_tax: newLine.withholdingTax, other_deductions: newLine.otherDeductions, other_allowances: newLine.otherAllowances,
      gross_pay: newLine.grossPay, net_pay: newLine.netPay, status: newLine.status,
    });
  },

  addPayrollLines: (linesData) => {
    const newLines: PayrollLine[] = linesData.map((l) => ({ ...l, id: newId(), createdAt: new Date().toISOString() }));
    set((state) => ({ payrollLines: [...state.payrollLines, ...newLines] }));
    for (const newLine of newLines) {
      dbInsert("payroll_lines", {
        id: newLine.id, payroll_run_id: newLine.payrollRunId, employee_id: newLine.employeeId,
        basic_pay: newLine.basicPay, allowances: newLine.allowances, overtime_pay: newLine.overtimePay,
        late_deduction: newLine.lateDeduction, undertime_deduction: newLine.undertimeDeduction, absence_deduction: newLine.absenceDeduction,
        sss_deduction: newLine.sssDeduction, philhealth_deduction: newLine.philhealthDeduction, pagibig_deduction: newLine.pagibigDeduction,
        withholding_tax: newLine.withholdingTax, other_deductions: newLine.otherDeductions, other_allowances: newLine.otherAllowances,
        gross_pay: newLine.grossPay, net_pay: newLine.netPay, status: newLine.status,
      });
    }
  },

  // ---- HR Phase 4: Salary Payout Batches ----
  addSalaryPayoutBatch: (batchData) => {
    const newBatch: SalaryPayoutBatch = { ...batchData, id: newId(), createdAt: new Date().toISOString() };
    set((state) => ({ salaryPayoutBatches: [newBatch, ...state.salaryPayoutBatches] }));
    dbInsert("salary_payout_batches", {
      id: newBatch.id, payroll_run_id: newBatch.payrollRunId, payout_no: newBatch.payoutNo,
      payout_method: newBatch.payoutMethod, status: newBatch.status, notes: newBatch.notes,
    });
    return newBatch;
  },

  addSalaryPayoutLines: (linesData) => {
    const newLines: SalaryPayoutLine[] = linesData.map((line) => ({ ...line, id: newId(), createdAt: new Date().toISOString() }));
    set((state) => ({ salaryPayoutLines: [...state.salaryPayoutLines, ...newLines] }));
    for (const line of newLines) {
      dbInsert("salary_payout_lines", {
        id: line.id, payout_batch_id: line.payoutBatchId, payroll_line_id: line.payrollLineId,
        employee_id: line.employeeId, amount: line.amount, reference_no: line.referenceNo,
        status: line.status, released_at: line.releasedAt,
      });
    }
  },

  releaseSalaryPayoutBatch: (id, releasedBy) => {
    const now = new Date().toISOString();
    const affectedRunId = get().salaryPayoutBatches.find((b) => b.id === id)?.payrollRunId;
    const affectedPayrollLineIds = get().salaryPayoutLines
      .filter((line) => line.payoutBatchId === id)
      .map((line) => line.payrollLineId);
    set((state) => ({
      salaryPayoutBatches: state.salaryPayoutBatches.map((b) => b.id === id ? { ...b, status: "Released", releasedBy, releasedAt: now } : b),
      salaryPayoutLines: state.salaryPayoutLines.map((l) => l.payoutBatchId === id ? { ...l, status: "Released", releasedAt: now } : l),
      payrollRuns: state.payrollRuns.map((r) => r.id === affectedRunId ? { ...r, status: "Released" } : r),
      payrollLines: state.payrollLines.map((l) => affectedPayrollLineIds.includes(l.id) ? { ...l, status: "Released" } : l),
    }));
    dbUpdate("salary_payout_batches", id, { status: "Released", released_by: releasedBy, released_at: now });
    if (affectedRunId) dbUpdate("payroll_runs", affectedRunId, { status: "Released" });
    affectedPayrollLineIds.forEach((lineId) => dbUpdate("payroll_lines", lineId, { status: "Released" }));
  },

  // ---- HR Phase 4: Benefit Plans ----
  updateBenefitPlan: (id, updates) => {
    set((state) => ({ benefitPlans: state.benefitPlans.map((b) => (b.id === id ? { ...b, ...updates } : b)) }));
    dbUpdate("benefit_plans", id, updates);
  },

  toggleBenefitPlanActive: (id) => {
    const plan = get().benefitPlans.find((b) => b.id === id);
    set((state) => ({ benefitPlans: state.benefitPlans.map((b) => (b.id === id ? { ...b, isActive: !b.isActive } : b)) }));
    if (plan) dbUpdate("benefit_plans", id, { is_active: !plan.isActive });
  },

  // ---- HR Phase 5: Recruitment ----
  addJobRequisition: (data) => {
    const newReq: JobRequisition = { ...data, id: newId(), createdAt: todayStamp() };
    set((state) => ({ jobRequisitions: [newReq, ...state.jobRequisitions] }));
    dbInsert("job_requisitions", {
      id: newReq.id, requisition_no: newReq.requisitionNo, position_title: newReq.positionTitle,
      department: newReq.department, employment_type: newReq.employmentType, head_count: newReq.headCount,
      reason: newReq.reason, target_start_date: newReq.targetStartDate, status: newReq.status,
      requested_by: newReq.requestedBy, created_at: newReq.createdAt,
    });
  },

  updateJobRequisitionStatus: (id, status, approvedBy) => {
    const now = new Date().toISOString();
    set((state) => ({
      jobRequisitions: state.jobRequisitions.map((r) =>
        r.id === id ? { ...r, status, ...(approvedBy ? { approvedBy, approvedAt: now } : {}) } : r
      ),
    }));
    dbUpdate("job_requisitions", id, { status, ...(approvedBy ? { approved_by: approvedBy, approved_at: now } : {}) });
  },

  addJobApplicant: (data) => {
    const newApplicant: JobApplicant = { ...data, id: newId(), createdAt: todayStamp() };
    set((state) => ({ jobApplicants: [newApplicant, ...state.jobApplicants] }));
    dbInsert("job_applicants", {
      id: newApplicant.id, job_requisition_id: newApplicant.jobRequisitionId,
      first_name: newApplicant.firstName, last_name: newApplicant.lastName, middle_name: newApplicant.middleName,
      email: newApplicant.email, contact: newApplicant.contact, address: newApplicant.address,
      applied_at: newApplicant.appliedAt, status: newApplicant.status, notes: newApplicant.notes,
      created_at: newApplicant.createdAt,
    });
  },

  updateJobApplicantStatus: (id, status, notes) => {
    set((state) => ({
      jobApplicants: state.jobApplicants.map((a) => a.id === id ? { ...a, status, ...(notes !== undefined ? { notes } : {}) } : a),
    }));
    dbUpdate("job_applicants", id, { status, ...(notes !== undefined ? { notes } : {}) });
  },

  addApplicantInterview: (data) => {
    const newInterview: ApplicantInterview = { ...data, id: newId(), createdAt: todayStamp() };
    set((state) => ({ applicantInterviews: [newInterview, ...state.applicantInterviews] }));
    dbInsert("applicant_interviews", {
      id: newInterview.id, applicant_id: newInterview.applicantId, scheduled_at: newInterview.scheduledAt,
      interview_type: newInterview.interviewType, interviewer: newInterview.interviewer,
      result: newInterview.result, remarks: newInterview.remarks, created_at: newInterview.createdAt,
    });
  },

  updateInterviewResult: (id, result, remarks) => {
    set((state) => ({
      applicantInterviews: state.applicantInterviews.map((i) =>
        i.id === id ? { ...i, result, ...(remarks !== undefined ? { remarks } : {}) } : i
      ),
    }));
    dbUpdate("applicant_interviews", id, { result, ...(remarks !== undefined ? { remarks } : {}) });
  },

  // ---- HR Phase 5: Onboarding ----
  addEmployeeOnboardingTask: (data) => {
    const newTask: EmployeeOnboardingTask = { ...data, id: newId(), createdAt: todayStamp() };
    set((state) => ({ employeeOnboardingTasks: [newTask, ...state.employeeOnboardingTasks] }));
    dbInsert("employee_onboarding_tasks", {
      id: newTask.id, employee_id: newTask.employeeId, onboarding_task_id: newTask.onboardingTaskId,
      due_date: newTask.dueDate, status: newTask.status, created_at: newTask.createdAt,
    });
  },

  completeOnboardingTask: (taskId, completedBy) => {
    const now = new Date().toISOString();
    set((state) => ({
      employeeOnboardingTasks: state.employeeOnboardingTasks.map((t) =>
        t.id === taskId ? { ...t, status: "Completed", completedAt: now, completedBy } : t
      ),
    }));
    dbUpdate("employee_onboarding_tasks", taskId, { status: "Completed", completed_at: now, completed_by: completedBy });
  },

  skipOnboardingTask: (taskId) => {
    set((state) => ({
      employeeOnboardingTasks: state.employeeOnboardingTasks.map((t) =>
        t.id === taskId ? { ...t, status: "Skipped" } : t
      ),
    }));
    dbUpdate("employee_onboarding_tasks", taskId, { status: "Skipped" });
  },

  // ---- Section CRUD ----
  addSection: (sectionData) => {
    const newSection: SchoolSection = { ...sectionData, id: newId(), createdAt: todayStamp(), currentCount: sectionData.currentCount ?? 0, enrolledStudentIds: sectionData.enrolledStudentIds ?? [] };
    set((state) => ({ sections: [...state.sections, newSection] }));
    dbInsert("sections", withSchoolFk({ ...sectionData, id: newSection.id, createdAt: newSection.createdAt, currentCount: newSection.currentCount }));
    for (const studentId of newSection.enrolledStudentIds) dbInsert("section_students", { section_id: newSection.id, student_id: studentId });
    return newSection;
  },

  updateSection: (id, updates) => {
    set((state) => ({ sections: state.sections.map((s) => (s.id === id ? { ...s, ...updates } : s)) }));
    const { enrolledStudentIds, ...rest } = updates;
    if (Object.keys(rest).length > 0) dbUpdate("sections", id, "schoolId" in rest ? withSchoolFk(rest as any) : rest);
  },

  deleteSection: (id) => {
    set((state) => ({ sections: state.sections.filter((s) => s.id !== id) }));
    dbDelete("sections", id);
  },

  // ---- P4-F: Central Audit Log ----

  logAudit: (action, entityType, entityId, prev, next, remarks) => {
    const { currentUser } = get();
    if (!currentUser) return;
    const entry: AuditLogEntry = {
      id: newId(),
      timestamp: new Date().toISOString(),
      actorId: currentUser.id,
      actorRole: currentUser.role,
      actorName: currentUser.name,
      schoolId: currentUser.schoolId,
      entityType,
      entityId,
      action,
      previousValue: prev,
      newValue: next,
      remarks,
    };
    set((state) => ({
      auditLog: [entry, ...state.auditLog].slice(0, 1000),
    }));
  },

  // ---- P4-D: Approval Delegations ----

  addDelegation: (delegation) => {
    const newDelegation: ApprovalDelegation = {
      ...delegation,
      id: newId(),
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ delegations: [newDelegation, ...state.delegations] }));
  },

  revokeDelegation: (id) => {
    set((state) => ({
      delegations: state.delegations.map((d) =>
        d.id === id ? { ...d, isActive: false } : d,
      ),
    }));
  },

  getActiveDelegation: (scope, delegateId) => {
    const today = todayStamp();
    return get().delegations.find(
      (d) =>
        d.isActive &&
        d.delegateId === delegateId &&
        (d.scope === scope || d.scope === "ALL") &&
        d.startDate <= today &&
        d.endDate >= today,
    );
  },

  toggleSectionActive: (id) => {
    const section = get().sections.find((s) => s.id === id);
    set((state) => ({ sections: state.sections.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s)) }));
    if (section) dbUpdate("sections", id, { isActive: !section.isActive });
  },

  assignStudentsToSection: (sectionId, studentIds) => {
    const section = get().sections.find((s) => s.id === sectionId);

    // Identify sections that will lose students (to update their counts in DB).
    const affectedOldSections = get().sections.filter(
      (s) => s.id !== sectionId && (s.enrolledStudentIds || []).some((id) => studentIds.includes(id))
    );

    set((state) => {
      // Remove reassigned students from all OTHER sections first.
      const sectionsCleared = state.sections.map((s) => {
        if (s.id === sectionId) return s;
        const prev = s.enrolledStudentIds || [];
        const filtered = prev.filter((id) => !studentIds.includes(id));
        if (filtered.length === prev.length) return s;
        return { ...s, enrolledStudentIds: filtered, currentCount: filtered.length };
      });
      const targetSection = sectionsCleared.find((s) => s.id === sectionId);
      const merged = Array.from(new Set([...(targetSection?.enrolledStudentIds || []), ...studentIds]));
      return {
        sections: sectionsCleared.map((s) =>
          s.id === sectionId ? { ...s, enrolledStudentIds: merged, currentCount: merged.length } : s
        ),
        students: state.students.map((stu) => {
          if (!studentIds.includes(stu.id)) return stu;
          return section ? { ...stu, section: section.name } : stu;
        })
      };
    });

    const merged = Array.from(new Set([...(section?.enrolledStudentIds || []), ...studentIds]));
    dbUpdate("sections", sectionId, { currentCount: merged.length });

    // Update old sections' counts in DB.
    for (const s of affectedOldSections) {
      const newCount = (s.enrolledStudentIds || []).filter((id) => !studentIds.includes(id)).length;
      dbUpdate("sections", s.id, { currentCount: newCount });
    }

    for (const studentId of studentIds) {
      // Delete any existing section membership before inserting the new one.
      supabase.from("section_students").delete().eq("student_id", studentId)
        .then(({ error }) => { if (error) console.error("[supabase] clear section_students failed:", error); });
      dbInsert("section_students", { section_id: sectionId, student_id: studentId });
      if (section) dbUpdate("students", studentId, { section: section.name });
    }
  },

  // ---- Book Package CRUD ----
  addBookPackage: (packageData) => {
    const packageId = newId();
    const books = packageData.books.map((book) => ({ ...book, id: book.id || newId() }));
    const newPackage: BookPackage = { ...packageData, id: packageId, books };
    set((state) => ({ bookPackages: [...state.bookPackages, newPackage] }));

    const { books: _books, ...packageRow } = newPackage;
    dbInsert("book_packages", withSchoolFk(packageRow)).then(() => {
      for (const book of books) {
        dbInsert("book_package_items", withSubjectFk({
          id: book.id,
          bookPackageId: packageId,
          title: book.title,
          quantity: book.quantity,
          unitPrice: book.unitPrice,
          subjectCode: book.subjectCode,
        }));
      }
    });
    return newPackage;
  },

  updateBookPackage: (id, updates) => {
    set((state) => ({ bookPackages: state.bookPackages.map((p) => (p.id === id ? { ...p, ...updates } : p)) }));
    const { books, ...rest } = updates;
    if (Object.keys(rest).length > 0) dbUpdate("book_packages", id, "schoolId" in rest ? withSchoolFk(rest as any) : rest);
    if (books) {
      dbDeleteWhere("book_package_items", "book_package_id", id).then(() => {
        for (const book of books) dbInsert("book_package_items", withSubjectFk({ id: book.id ?? newId(), bookPackageId: id, title: book.title, quantity: book.quantity, unitPrice: book.unitPrice, subjectCode: book.subjectCode }));
      });
    }
  },

  // ---- Room CRUD ----
  addRoom: (roomData) => {
    const newRoom: Room = { ...roomData, id: newId() };
    set((state) => ({ rooms: [...state.rooms, newRoom] }));
    dbInsert("rooms", withSchoolFk(newRoom));
    return newRoom;
  },

  updateRoom: (id, updates) => {
    set((state) => ({ rooms: state.rooms.map((r) => (r.id === id ? { ...r, ...updates } : r)) }));
    dbUpdate("rooms", id, "schoolId" in updates ? withSchoolFk(updates as any) : updates);
  },

  deleteRoom: (id) => {
    set((state) => ({ rooms: state.rooms.filter((r) => r.id !== id) }));
    dbDelete("rooms", id);
  },

  toggleRoomActive: (id) => {
    const room = get().rooms.find((r) => r.id === id);
    set((state) => ({ rooms: state.rooms.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r)) }));
    if (room) dbUpdate("rooms", id, { isActive: !room.isActive });
  },

  // ---- Document Verification Workflow ----
  updateRequirementUpload: (studentId, reqName, fileName) => {
    const now = todayStamp();
    const req = get().requirements.find((r) => r.studentId === studentId && r.name === reqName);
    set((state) => ({
      requirements: state.requirements.map((r) =>
        r.studentId === studentId && r.name === reqName ? { ...r, uploadStatus: "Uploaded", uploadFileName: fileName, uploadDate: now, verificationStatus: "Pending" } : r
      )
    }));
    if (req) dbUpdate("requirements", req.id, { uploadStatus: "Uploaded", uploadFileName: fileName, uploadDate: now, verificationStatus: "Pending" });
  },

  uploadRequirementFile: async (studentId, reqName, file) => {
    const req = get().requirements.find((r) => r.studentId === studentId && r.name === reqName);
    if (!req) throw new Error("Requirement record was not found.");

    const reqSlug = sanitizeStorageName(reqName);
    const fileName = sanitizeStorageName(file.name);
    const storagePath = `${studentId}/${reqSlug}/${Date.now()}-${fileName}`;

    const { error } = await supabase.storage
      .from(DOCUMENT_BUCKET)
      .upload(storagePath, file, {
        cacheControl: "3600",
        contentType: file.type || undefined,
        upsert: false,
      });

    if (error) throw error;

    const now = todayStamp();
    set((state) => ({
      requirements: state.requirements.map((r) =>
        r.studentId === studentId && r.name === reqName
          ? { ...r, uploadStatus: "Uploaded", uploadFileName: file.name, uploadFilePath: storagePath, uploadDate: now, verificationStatus: "Pending", remarks: undefined }
          : r
      )
    }));
    dbUpdate("requirements", req.id, {
      uploadStatus: "Uploaded",
      uploadFileName: file.name,
      uploadFilePath: storagePath,
      uploadDate: now,
      verificationStatus: "Pending",
      remarks: null,
    });
  },

  getRequirementFileUrl: async (studentId, reqName) => {
    const req = get().requirements.find((r) => r.studentId === studentId && r.name === reqName);
    if (!req?.uploadFilePath) {
      throw new Error("This document does not have a stored file path yet.");
    }

    const { data, error } = await supabase.storage
      .from(DOCUMENT_BUCKET)
      .createSignedUrl(req.uploadFilePath, 60 * 5);

    if (error) throw error;
    return data.signedUrl;
  },

  verifyRequirement: (studentId, reqName, status, verifiedBy, remarks) => {
    const now = nowStamp();
    const req = get().requirements.find((r) => r.studentId === studentId && r.name === reqName);
    const newStatus = status === "Verified" ? "Submitted" : "Rejected";
    set((state) => ({
      requirements: state.requirements.map((r) =>
        r.studentId === studentId && r.name === reqName
          ? { ...r, verificationStatus: status, verifiedBy, verifiedAt: now, remarks: remarks || r.remarks, status: newStatus }
          : r
      )
    }));
    if (req) dbUpdate("requirements", req.id, { verificationStatus: status, verifiedBy, verifiedAt: now, remarks: remarks || req.remarks, status: newStatus });
  },

  markHardcopySubmitted: (studentId, reqName) => {
    const now = todayStamp();
    const req = get().requirements.find((r) => r.studentId === studentId && r.name === reqName);
    set((state) => ({
      requirements: state.requirements.map((r) =>
        r.studentId === studentId && r.name === reqName ? { ...r, hardcopySubmitted: true, hardcopySubmittedDate: now } : r
      )
    }));
    if (req) dbUpdate("requirements", req.id, { hardcopySubmitted: true, hardcopySubmittedDate: now });
  },

  // ---- Guardian Information ----
  addStudentGuardian: (guardian) => {
    const newGuardian = { ...guardian, id: newId() };
    set((state) => ({ studentGuardians: [...state.studentGuardians, newGuardian] }));
    dbInsert("student_guardians", newGuardian);
  },

  updateStudentGuardian: (id, updates) => {
    set((state) => ({ studentGuardians: state.studentGuardians.map((g) => (g.id === id ? { ...g, ...updates } : g)) }));
    dbUpdate("student_guardians", id, updates);
  },

  deleteStudentGuardian: (id) => {
    set((state) => ({ studentGuardians: state.studentGuardians.filter((g) => g.id !== id) }));
    dbDelete("student_guardians", id);
  },

  addStudentEducationBackground: (record) => {
    const newRecord: StudentEducationBackground = {
      ...record,
      id: newId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({
      studentEducationBackgrounds: [...state.studentEducationBackgrounds, newRecord],
    }));
    dbInsert("student_education_backgrounds", newRecord);
  },

  updateStudentEducationBackground: (id, updates) => {
    set((state) => ({
      studentEducationBackgrounds: state.studentEducationBackgrounds.map((record) =>
        record.id === id ? { ...record, ...updates, updatedAt: new Date().toISOString() } : record
      ),
    }));
    dbUpdate("student_education_backgrounds", id, updates);
  },

  deleteStudentEducationBackground: (id) => {
    set((state) => ({
      studentEducationBackgrounds: state.studentEducationBackgrounds.filter((record) => record.id !== id),
    }));
    dbDelete("student_education_backgrounds", id);
  },

  addEmployeeProfileContact: (contact) => {
    const newContact: EmployeeProfileContact = {
      ...contact,
      id: newId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({
      employeeProfileContacts: [...state.employeeProfileContacts, newContact],
    }));
    dbInsert("employee_profile_contacts", newContact);
  },

  updateEmployeeProfileContact: (id, updates) => {
    set((state) => ({
      employeeProfileContacts: state.employeeProfileContacts.map((contact) =>
        contact.id === id ? { ...contact, ...updates, updatedAt: new Date().toISOString() } : contact,
      ),
    }));
    dbUpdate("employee_profile_contacts", id, updates);
  },

  deleteEmployeeProfileContact: (id) => {
    set((state) => ({
      employeeProfileContacts: state.employeeProfileContacts.filter((contact) => contact.id !== id),
    }));
    dbDelete("employee_profile_contacts", id);
  },

  addEmployeeEducationBackground: (record) => {
    const newRecord: EmployeeEducationBackground = {
      ...record,
      id: newId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({
      employeeEducationBackgrounds: [...state.employeeEducationBackgrounds, newRecord],
    }));
    dbInsert("employee_education_backgrounds", newRecord);
  },

  updateEmployeeEducationBackground: (id, updates) => {
    set((state) => ({
      employeeEducationBackgrounds: state.employeeEducationBackgrounds.map((record) =>
        record.id === id ? { ...record, ...updates, updatedAt: new Date().toISOString() } : record,
      ),
    }));
    dbUpdate("employee_education_backgrounds", id, updates);
  },

  deleteEmployeeEducationBackground: (id) => {
    set((state) => ({
      employeeEducationBackgrounds: state.employeeEducationBackgrounds.filter((record) => record.id !== id),
    }));
    dbDelete("employee_education_backgrounds", id);
  },

  addEmployeeLicenseCertification: (record) => {
    const newRecord: EmployeeLicenseCertification = {
      ...record,
      id: newId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({
      employeeLicenseCertifications: [...state.employeeLicenseCertifications, newRecord],
    }));
    dbInsert("employee_license_certifications", newRecord);
  },

  updateEmployeeLicenseCertification: (id, updates) => {
    set((state) => ({
      employeeLicenseCertifications: state.employeeLicenseCertifications.map((record) =>
        record.id === id ? { ...record, ...updates, updatedAt: new Date().toISOString() } : record,
      ),
    }));
    dbUpdate("employee_license_certifications", id, updates);
  },

  deleteEmployeeLicenseCertification: (id) => {
    set((state) => ({
      employeeLicenseCertifications: state.employeeLicenseCertifications.filter((record) => record.id !== id),
    }));
    dbDelete("employee_license_certifications", id);
  },

  addActivityLog: ({ action, subject, type = "Profile", actorName, occurredAt }) => {
    const entry = {
      id: newId(),
      action,
      subject,
      type,
      time: occurredAt ?? new Date().toISOString(),
    };
    set((state) => ({
      activityLogs: [entry, ...state.activityLogs].slice(0, 1000),
    }));
    dbInsert("activity_logs", {
      id: entry.id,
      actorName: actorName ?? get().currentUser?.name,
      action,
      subjectLabel: subject,
      activityType: type,
      occurredAt: entry.time,
    });
  },
}));

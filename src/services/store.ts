/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from "zustand";
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
  PaymentCollectionSummary
} from "../types";
import type { AcademicUnit } from "../types/school.types";
import { getAcademicUnit } from "../config/schools.config";
import type { GradePeriod, StudentGradeEntry, SubjectClassLoad, GradeRosterStudent, GradeItem, GradeCategory } from "../types/grading";
import { supabase } from "../lib/supabase";
import { loadAllData } from "./dataLoader";
import { newId, dbInsert, dbUpdate, dbDelete, dbDeleteWhere } from "./supabaseCrud";
import { resolveSchoolId, resolveSubjectId, subjectCodeToId } from "./idMaps";

const nowStamp = () => new Date().toISOString().replace("T", " ").substring(0, 16);
const todayStamp = () => new Date().toISOString().split("T")[0];

interface STSNState {
  isLoading: boolean;
  currentUser: User | null;
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
  assessments: StudentAssessment[];
  payments: Payment[];
  grades: Grade[];
  schedules: Schedule[];
  announcements: Announcement[];
  events: SchoolEvent[];
  payroll: PayrollRow[];
  setupData: Record<string, SetupItem[]>;
  discountTypes: DiscountType[];
  discountRequests: DiscountRequest[];
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
  studentGuardians: { id: string; studentId: string; guardianName: string; relationship?: string; contactNo?: string; email?: string; address?: string; isPrimary: boolean }[];

  // Bootstrap
  initialize: () => Promise<void>;

  // Actions
  login: (email: string, role: string, schoolContext?: SchoolId) => boolean;
  logout: () => void;
  setCurrentUser: (user: User | null) => void;

  // Registrar Actions
  addStudent: (student: Omit<Student, "id" | "studentNo">) => Student;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  updateStudentRequirements: (studentId: string, reqName: string, status: "Submitted" | "Pending" | "Rejected") => void;
  ensureStudentRequirements: (studentId: string) => void;
  approveEnrollment: (enrollmentId: string, section: string) => void;
  rejectEnrollment: (enrollmentId: string) => void;
  submitNewEnrollment: (enrollment: Omit<Enrollment, "id">) => Enrollment;

  // Accounting Actions
  addAssessment: (assessment: StudentAssessment) => void;
  updateAssessment: (id: string, updates: Partial<StudentAssessment>) => void;
  addPayment: (payment: Omit<Payment, "id" | "paymentDate">) => Payment;

  // Accounting Approval Workflow Actions
  approveAssessment: (assessmentId: string, approvedBy: string, remarks?: string) => void;
  returnAssessmentToRegistrar: (assessmentId: string, performedBy: string, remarks: string) => void;
  rejectAssessment: (assessmentId: string, performedBy: string, remarks: string) => void;

  // Grading Actions
  saveGrade: (studentId: string, subjectCode: string, midterm: number, final: number) => void;
  saveGradeEntry: (studentId: string, gradeItemId: string, score: number | null) => void;
  addGradeItem: (periodId: string, item: GradeItem, categoryWeight: number) => void;
  updateGradeCategories: (periodId: string, categories: GradeCategory[]) => void;
  finalizeGradePeriod: (periodId: string, finalizedBy: string) => void;

  // Human Resource & Admin Actions
  addEmployee: (employee: Omit<Employee, "id">) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  addPayrollRow: (payrollRow: PayrollRow) => void;
  markPaidPayroll: (id: string) => void;
  processGlobalPayroll: () => void;

  // Users Management
  toggleUserStatus: (id: string) => void;
  addUser: (user: User) => void;

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
  addDiscountType: (dt: Omit<DiscountType, "id" | "createdAt">) => void;
  updateDiscountType: (id: string, updates: Partial<DiscountType>) => void;
  deleteDiscountType: (id: string) => void;
  toggleDiscountTypeActive: (id: string) => void;
  addDiscountRequest: (req: Omit<DiscountRequest, "id" | "referenceNo" | "requestedAt" | "auditTrail">) => DiscountRequest;
  approveDiscountRequest: (id: string, level: 1 | 2, approvedBy: string, remarks?: string) => void;
  rejectDiscountRequest: (id: string, level: 1 | 2, approvedBy: string, remarks?: string) => void;

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
  addStudentGuardian: (guardian: Omit<STSNState["studentGuardians"][number], "id">) => void;
  updateStudentGuardian: (id: string, updates: Partial<STSNState["studentGuardians"][number]>) => void;
  deleteStudentGuardian: (id: string) => void;
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

export const useSTSNStore = create<STSNState>((set, get) => ({
  isLoading: true,
  currentUser: null,
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
  assessments: [],
  payments: [],
  grades: [],
  schedules: [],
  announcements: [],
  events: [],
  payroll: [],
  setupData: {},
  discountTypes: [],
  discountRequests: [],
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

  initialize: async () => {
    const data = await loadAllData();
    set({
      ...data,
      isLoading: false,
      currentUser: data.users.find((u) => u.role === "SUPER_ADMIN") || null,
    });
  },

  login: (email: string, role: string, schoolContext?: SchoolId) => {
    const user = get().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (user && user.isActive) {
      const resolvedSchool = user.schoolId || schoolContext || "ALL";
      set({ currentUser: user, activeSchool: resolvedSchool, academicUnit: getAcademicUnit(resolvedSchool) });
      return true;
    }
    const fallbackUser = get().users.find((u) => u.role === role);
    if (fallbackUser) {
      const resolvedSchool = fallbackUser.schoolId || schoolContext || "ALL";
      set({ currentUser: fallbackUser, activeSchool: resolvedSchool, academicUnit: getAcademicUnit(resolvedSchool) });
      return true;
    }
    return false;
  },

  logout: () => set({ currentUser: null }),
  setCurrentUser: (user) => set({ currentUser: user }),

  addStudent: (studentData) => {
    const serial = get().students.length + 1;
    const studentNo = `STSN-2026-${String(serial).padStart(4, "0")}`;
    const newStudentId = newId();
    const newStudent: Student = { ...studentData, id: newStudentId, studentNo };

    set((state) => ({ students: [...state.students, newStudent] }));

    const newReqs = getDefaultRequirementNames(studentData.department).map((name) =>
      createPendingRequirement(newStudentId, name)
    );

    set((state) => ({ requirements: [...state.requirements, ...newReqs] }));

    const persisted = Promise.resolve(dbInsert("students", withSchoolFk({ ...studentData, id: newStudentId, studentNo })))
      .then(() => persistRequirementsWithRecheck(newStudentId, newReqs))
      .then(() => undefined);
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

  submitNewEnrollment: (enrollData) => {
    const newEnrollmentId = newId();
    const newEnrollment: Enrollment = { ...enrollData, id: newEnrollmentId, status: "Pending" };

    set((state) => ({
      enrollments: [...state.enrollments, newEnrollment],
      students: state.students.map((student) =>
        student.id === enrollData.studentId ? { ...student, enrollmentStatus: "Pending" } : student
      )
    }));

    const student = get().students.find((s) => s.id === enrollData.studentId);
    const isCollege = student?.department === "College";

    const existingReqs = get().requirements.filter((r) => r.studentId === enrollData.studentId);
    if (existingReqs.length === 0) {
      const newReqs = getDefaultRequirementNames(isCollege ? "College" : "Basic Education").map((name) =>
        createPendingRequirement(enrollData.studentId, name)
      );
      set((state) => ({ requirements: [...state.requirements, ...newReqs] }));
      const persisted = (studentPersistence.get(enrollData.studentId) ?? Promise.resolve())
        .then(() => persistRequirementsWithRecheck(enrollData.studentId, newReqs))
        .then(() => undefined);
      studentPersistence.set(enrollData.studentId, persisted);
      persisted.finally(() => {
        if (studentPersistence.get(enrollData.studentId) === persisted) studentPersistence.delete(enrollData.studentId);
      });
    }
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

    set((state) => ({ assessments: [...state.assessments, newAssessment] }));

    const persisted = (studentPersistence.get(enrollData.studentId) ?? Promise.resolve()).then(async () => {
      await dbInsert("enrollments", { id: newEnrollmentId, studentId: enrollData.studentId, schoolYear: enrollData.schoolYear, semester: enrollData.semester, enrollmentType: enrollData.enrollmentType, status: "Pending", submittedAt: enrollData.submittedAt });
      await Promise.all(enrollData.subjectCodes.map((code) => {
        const subjectId = resolveSubjectId(code);
        return subjectId ? dbInsert("enrollment_subjects", { enrollment_id: newEnrollmentId, subject_id: subjectId }) : Promise.resolve();
      }));
      await dbInsert("assessments", { id: newAssessmentId, studentId: enrollData.studentId, schoolYear: enrollData.schoolYear, semester: enrollData.semester, totalAmount, discountPercentage: 0, discountAmount: 0, paymentTerm: "Installment - 4 Payments", balance: totalAmount });
      await Promise.all(baseFees.map((fee) => dbInsert("assessment_fees", { assessment_id: newAssessmentId, fee_name: fee.feeName, category: fee.category, amount: fee.amount })));
    });
    studentPersistence.set(enrollData.studentId, persisted);
    persisted.finally(() => {
      if (studentPersistence.get(enrollData.studentId) === persisted) studentPersistence.delete(enrollData.studentId);
    });

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

  addAssessment: (assessment) => {
    set((state) => ({ assessments: [...state.assessments, assessment] }));
    const { fees, auditTrail, ...rest } = assessment;
    dbInsert("assessments", rest);
    for (const fee of fees ?? []) dbInsert("assessment_fees", { assessment_id: assessment.id, fee_name: fee.feeName, category: fee.category, amount: fee.amount });
    for (const entry of auditTrail ?? []) dbInsert("assessment_audit_trail", { id: entry.id, assessment_id: assessment.id, action: entry.action, performed_by: entry.performedBy, performed_at: entry.performedAt, details: entry.details });
  },

  updateAssessment: (id, updates) => {
    set((state) => ({ assessments: state.assessments.map((a) => (a.id === id ? { ...a, ...updates } : a)) }));
    const { fees, auditTrail, ...rest } = updates;
    if (Object.keys(rest).length > 0) dbUpdate("assessments", id, rest);
    if (fees) {
      dbDeleteWhere("assessment_fees", "assessment_id", id);
      for (const fee of fees) dbInsert("assessment_fees", { assessment_id: id, fee_name: fee.feeName, category: fee.category, amount: fee.amount });
    }
    if (auditTrail) {
      dbDeleteWhere("assessment_audit_trail", "assessment_id", id);
      for (const entry of auditTrail) dbInsert("assessment_audit_trail", { id: entry.id, assessment_id: id, action: entry.action, performed_by: entry.performedBy, performed_at: entry.performedAt, details: entry.details });
    }
  },

  approveAssessment: (assessmentId, approvedBy, remarks) => {
    const now = nowStamp();
    const entry: AuditEntry = { id: newId(), action: "APPROVED_FOR_PAYMENT", performedBy: approvedBy, performedAt: now, details: remarks || "Assessment approved for payment." };
    set((state) => ({
      assessments: state.assessments.map((a) => a.id !== assessmentId ? a : {
        ...a, approvalStatus: "Approved for Payment", approvedBy, approvedDate: now,
        accountingRemarks: remarks || a.accountingRemarks, auditTrail: [...(a.auditTrail || []), entry],
      })
    }));
    dbUpdate("assessments", assessmentId, { approvalStatus: "Approved for Payment", approvedBy, approvedDate: now, accountingRemarks: remarks });
    dbInsert("assessment_audit_trail", { id: entry.id, assessment_id: assessmentId, action: entry.action, performed_by: entry.performedBy, performed_at: entry.performedAt, details: entry.details });
  },

  returnAssessmentToRegistrar: (assessmentId, performedBy, remarks) => {
    const now = nowStamp();
    const entry: AuditEntry = { id: newId(), action: "RETURNED_TO_REGISTRAR", performedBy, performedAt: now, details: remarks };
    set((state) => ({
      assessments: state.assessments.map((a) => a.id !== assessmentId ? a : {
        ...a, approvalStatus: "Returned to Registrar", accountingRemarks: remarks, auditTrail: [...(a.auditTrail || []), entry],
      })
    }));
    dbUpdate("assessments", assessmentId, { approvalStatus: "Returned to Registrar", accountingRemarks: remarks });
    dbInsert("assessment_audit_trail", { id: entry.id, assessment_id: assessmentId, action: entry.action, performed_by: entry.performedBy, performed_at: entry.performedAt, details: entry.details });
  },

  rejectAssessment: (assessmentId, performedBy, remarks) => {
    const now = nowStamp();
    const entry: AuditEntry = { id: newId(), action: "REJECTED", performedBy, performedAt: now, details: remarks };
    set((state) => ({
      assessments: state.assessments.map((a) => a.id !== assessmentId ? a : {
        ...a, approvalStatus: "Rejected", accountingRemarks: remarks, auditTrail: [...(a.auditTrail || []), entry],
      })
    }));
    dbUpdate("assessments", assessmentId, { approvalStatus: "Rejected", accountingRemarks: remarks });
    dbInsert("assessment_audit_trail", { id: entry.id, assessment_id: assessmentId, action: entry.action, performed_by: entry.performedBy, performed_at: entry.performedAt, details: entry.details });
  },

  addPayment: (paymentData) => {
    const newPaymentId = newId();
    const paymentDate = new Date().toISOString().replace("T", " ").substring(0, 16);
    const newPayment: Payment = { ...paymentData, id: newPaymentId, paymentDate };

    set((state) => ({
      payments: [...state.payments, newPayment],
      assessments: state.assessments.map((a) => {
        // Only deduct from the specific assessment that was collected against.
        // If no assessmentId provided, fall back to the first matching assessment (legacy path).
        const isTarget = paymentData.assessmentId
          ? a.id === paymentData.assessmentId
          : a.studentId === paymentData.studentId;
        return isTarget ? { ...a, balance: Math.max(0, a.balance - paymentData.amount) } : a;
      })
    }));

    dbInsert("payments", { ...paymentData, id: newPaymentId, paymentDate });
    const targetAssessment = get().assessments.find((a) =>
      paymentData.assessmentId ? a.id === paymentData.assessmentId : a.studentId === paymentData.studentId
    );
    if (targetAssessment) dbUpdate("assessments", targetAssessment.id, { balance: Math.max(0, targetAssessment.balance - paymentData.amount) });

    return newPayment;
  },

  saveGrade: (studentId, subjectCode, midterm, final) => {
    const passed = final >= 75 ? "Passed" : "Failed";
    const existing = get().grades.find((g) => g.studentId === studentId && g.subjectCode === subjectCode);
    const teacherId = get().currentUser?.id || get().teachers[0]?.id;

    if (existing) {
      set((state) => ({
        grades: state.grades.map((g) => g.studentId === studentId && g.subjectCode === subjectCode ? { ...g, midtermGrade: midterm, finalGrade: final, remarks: passed } : g)
      }));
      dbUpdate("grades", existing.id, { midtermGrade: midterm, finalGrade: final, remarks: passed });
    } else {
      const newGrade: Grade = { id: newId(), studentId, subjectCode, teacherId: teacherId || "", schoolYear: "2026-2027", semester: "First Semester", midtermGrade: midterm, finalGrade: final, remarks: passed };
      set((state) => ({ grades: [...state.grades, newGrade] }));
      dbInsert("grades", withSubjectFk({ id: newGrade.id, studentId, teacherId: newGrade.teacherId, schoolYear: newGrade.schoolYear, semester: newGrade.semester, midtermGrade: midterm, finalGrade: final, remarks: passed, subjectCode }));
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

    if (existing) {
      set((state) => ({
        studentGradeEntries: state.studentGradeEntries.map((e) => e.studentId === studentId && e.gradeItemId === gradeItemId ? { ...e, score } : e)
      }));
    } else {
      const entry: StudentGradeEntry = { id: newId(), periodId, studentId, gradeItemId, score };
      set((state) => ({ studentGradeEntries: [...state.studentGradeEntries, entry] }));
    }
    supabase.from("student_grade_entries").upsert(
      { id: existing?.id ?? newId(), grade_period_id: periodId, student_id: studentId, grade_item_id: gradeItemId, score },
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
    const newEntries: StudentGradeEntry[] = (targetLoad?.studentIds ?? []).map((studentId) => ({ id: newId(), periodId, studentId, gradeItemId: item.id, score: null }));
    set((state) => ({ studentGradeEntries: [...state.studentGradeEntries, ...newEntries] }));
    for (const e of newEntries) dbInsert("student_grade_entries", { id: e.id, gradePeriodId: periodId, studentId: e.studentId, gradeItemId: item.id, score: null });
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
  },

  updateEmployee: (id, updates) => {
    set((state) => ({ employees: state.employees.map((e) => (e.id === id ? { ...e, ...updates } : e)) }));
    dbUpdate("employees", id, "schoolId" in updates ? withSchoolFk(updates as any) : updates);
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

  toggleUserStatus: (id) => {
    const user = get().users.find((u) => u.id === id);
    set((state) => ({ users: state.users.map((u) => (u.id === id ? { ...u, isActive: !u.isActive } : u)) }));
    if (user) dbUpdate("users", id, { isActive: !user.isActive });
  },

  addUser: (user) => {
    set((state) => ({ users: [...state.users, user] }));
    dbInsert("users", withSchoolFk(user));
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
  addDiscountType: (dtData) => {
    const newDT: DiscountType = { ...dtData, id: newId(), createdAt: todayStamp(), isActive: dtData.isActive ?? true };
    set((state) => ({ discountTypes: [...state.discountTypes, newDT] }));
    dbInsert("discount_types", newDT);
  },

  updateDiscountType: (id, updates) => {
    set((state) => ({ discountTypes: state.discountTypes.map((dt) => (dt.id === id ? { ...dt, ...updates } : dt)) }));
    dbUpdate("discount_types", id, updates);
  },

  deleteDiscountType: (id) => {
    set((state) => ({ discountTypes: state.discountTypes.filter((dt) => dt.id !== id) }));
    dbDelete("discount_types", id);
  },

  toggleDiscountTypeActive: (id) => {
    const dt = get().discountTypes.find((d) => d.id === id);
    set((state) => ({ discountTypes: state.discountTypes.map((d) => (d.id === id ? { ...d, isActive: !d.isActive } : d)) }));
    if (dt) dbUpdate("discount_types", id, { isActive: !dt.isActive });
  },

  addDiscountRequest: (reqData) => {
    const serial = get().discountRequests.length + 1001;
    const newReqId = newId();
    const auditEntry: AuditEntry = { id: newId(), action: "REQUEST_SUBMITTED", performedBy: reqData.requestedBy, performedAt: nowStamp(), details: `Discount request submitted for ${reqData.discountTypeName}` };
    const newReq: DiscountRequest = {
      ...reqData, id: newReqId, referenceNo: `DISC-${new Date().getFullYear()}-${String(serial).padStart(4, "0")}`,
      requestedAt: nowStamp(), status: "Pending", level1Status: "Pending", level2Status: "Pending", auditTrail: [auditEntry]
    };
    set((state) => ({ discountRequests: [newReq, ...state.discountRequests] }));
    dbInsert("discount_requests", { id: newReqId, referenceNo: newReq.referenceNo, studentId: reqData.studentId, discountTypeId: reqData.discountTypeId, requestedBy: reqData.requestedBy, requestedAt: newReq.requestedAt, status: "Pending", siblingNames: reqData.siblingNames, level1Status: "Pending", level2Status: "Pending", remarks: reqData.remarks, attachmentNames: reqData.attachmentNames });
    dbInsert("discount_request_audit_trail", { id: auditEntry.id, discountRequestId: newReqId, action: auditEntry.action, performedBy: auditEntry.performedBy, performedAt: auditEntry.performedAt, details: auditEntry.details });
    return newReq;
  },

  approveDiscountRequest: (id, level, approvedBy, remarks) => {
    const now = nowStamp();
    const auditEntry: AuditEntry = { id: newId(), action: `LEVEL_${level}_APPROVED`, performedBy: approvedBy, performedAt: now, details: remarks || `Approved at Level ${level}` };
    set((state) => ({
      discountRequests: state.discountRequests.map((req) => {
        if (req.id !== id) return req;
        const levelKey = level === 1 ? "level1" : "level2";
        return {
          ...req,
          [`${levelKey}Status`]: "Approved", [`${levelKey}ApprovedBy`]: approvedBy, [`${levelKey}ApprovedAt`]: now,
          status: (level === 1 && req.level2Status === "Approved") || (level === 2 && req.level1Status === "Approved") ? "Approved" : "For Review",
          auditTrail: [...req.auditTrail, auditEntry]
        };
      })
    }));
    const req = get().discountRequests.find((r) => r.id === id);
    if (req) {
      const levelKey = level === 1 ? "level1" : "level2";
      dbUpdate("discount_requests", id, { [`${levelKey}Status`]: "Approved", [`${levelKey}ApprovedBy`]: approvedBy, [`${levelKey}ApprovedAt`]: now, status: req.status });
      dbInsert("discount_request_audit_trail", { id: auditEntry.id, discountRequestId: id, action: auditEntry.action, performedBy: auditEntry.performedBy, performedAt: auditEntry.performedAt, details: auditEntry.details });
    }
    if (req && req.level1Status === "Approved" && req.level2Status === "Approved") {
      const assessment = get().assessments.find((a) => a.studentId === req.studentId);
      if (assessment) {
        const discountAmt = Math.round(assessment.totalAmount * (req.discountPercent / 100));
        get().updateAssessment(assessment.id, { discountPercentage: req.discountPercent, discountAmount: discountAmt, scholarshipName: req.discountTypeName, balance: Math.max(0, assessment.totalAmount - discountAmt) });
      }
    }
  },

  rejectDiscountRequest: (id, level, approvedBy, remarks) => {
    const now = nowStamp();
    const auditEntry: AuditEntry = { id: newId(), action: `LEVEL_${level}_REJECTED`, performedBy: approvedBy, performedAt: now, details: remarks || `Rejected at Level ${level}` };
    set((state) => ({
      discountRequests: state.discountRequests.map((req) => {
        if (req.id !== id) return req;
        const levelKey = level === 1 ? "level1" : "level2";
        return { ...req, [`${levelKey}Status`]: "Rejected", [`${levelKey}ApprovedBy`]: approvedBy, [`${levelKey}ApprovedAt`]: now, status: "Rejected", auditTrail: [...req.auditTrail, auditEntry] };
      })
    }));
    const levelKey = level === 1 ? "level1" : "level2";
    dbUpdate("discount_requests", id, { [`${levelKey}Status`]: "Rejected", [`${levelKey}ApprovedBy`]: approvedBy, [`${levelKey}ApprovedAt`]: now, status: "Rejected" });
    dbInsert("discount_request_audit_trail", { id: auditEntry.id, discountRequestId: id, action: auditEntry.action, performedBy: auditEntry.performedBy, performedAt: auditEntry.performedAt, details: auditEntry.details });
  },

  // ---- Class Scheduling Actions ----
  addClassSchedule: (scheduleData) => {
    const newSchedule: ClassSchedule = { ...scheduleData, id: newId() };
    set((state) => ({ classSchedules: [...state.classSchedules, newSchedule] }));
    dbInsert("class_schedules", withSubjectFk({ ...scheduleData, id: newSchedule.id, roomName: scheduleData.roomName, courseOrTrack: scheduleData.courseOrTrack }));
    return newSchedule;
  },

  updateClassSchedule: (id, updates) => {
    set((state) => ({ classSchedules: state.classSchedules.map((s) => (s.id === id ? { ...s, ...updates } : s)) }));
    dbUpdate("class_schedules", id, "subjectCode" in updates ? withSubjectFk(updates) : updates);
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
    const previousAdviserId = targetSection.adviserId;
    const previousSection = teacherId
      ? get().sections.find((section) => section.id !== sectionId && section.adviserId === teacherId)
      : undefined;
    const teachersAssignedToTarget = get().teachers.filter(
      (teacher) => teacher.id !== teacherId && teacher.advisorySection === targetSection.name
    );
    const adviserName = selectedTeacher ? `${selectedTeacher.firstName} ${selectedTeacher.lastName}` : undefined;

    set((state) => ({
      sections: state.sections.map((section) => {
        if (section.id === sectionId) {
          return { ...section, adviserId: teacherId || undefined, adviserName };
        }
        if (teacherId && section.adviserId === teacherId) {
          return { ...section, adviserId: undefined, adviserName: undefined };
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

    dbUpdate("sections", sectionId, { adviserId: teacherId });
    if (previousSection) dbUpdate("sections", previousSection.id, { adviserId: null });
    if (previousAdviserId && previousAdviserId !== teacherId) {
      dbUpdate("teachers", previousAdviserId, { advisorySection: null });
    }
    for (const teacher of teachersAssignedToTarget) {
      if (teacher.id !== previousAdviserId) dbUpdate("teachers", teacher.id, { advisorySection: null });
    }
    if (teacherId) dbUpdate("teachers", teacherId, { advisorySection: targetSection.name });
  },

  // ---- Multi-school ----
  setActiveSchool: (school) => set({ activeSchool: school, academicUnit: getAcademicUnit(school) }),

  // ---- LMS Actions ----
  addLearningMaterial: (materialData) => {
    const newMaterial: LearningMaterial = { ...materialData, id: newId() };
    set((state) => ({ learningMaterials: [newMaterial, ...state.learningMaterials] }));
    dbInsert("learning_materials", withSubjectFk(withSchoolFk({ ...materialData, id: newMaterial.id })));
    return newMaterial;
  },

  updateLearningMaterial: (id, updates) => {
    set((state) => ({ learningMaterials: state.learningMaterials.map((m) => (m.id === id ? { ...m, ...updates } : m)) }));
    let dbUpdates: any = updates;
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
  }
}));

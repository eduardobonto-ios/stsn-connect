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
  UserRole,
  SetupItem,
  DiscountType,
  DiscountRequest,
  AuditEntry,
  ClassSchedule,
  LearningMaterial,
  SchoolId
} from "../types";
import {
  MOCK_USERS,
  MOCK_STUDENTS,
  MOCK_TEACHERS,
  MOCK_EMPLOYEES,
  MOCK_COURSES,
  MOCK_SUBJECTS,
  MOCK_CURRICULUMS,
  MOCK_REQUIREMENTS,
  MOCK_ENROLLMENTS,
  MOCK_ASSESSMENTS,
  MOCK_PAYMENTS,
  MOCK_GRADES,
  MOCK_SCHEDULES,
  MOCK_ANNOUNCEMENTS,
  MOCK_EVENTS,
  STARTING_PAYROLL,
  MOCK_SETUP_DATA,
  MOCK_DISCOUNT_TYPES,
  MOCK_DISCOUNT_REQUESTS,
  MOCK_CLASS_SCHEDULES,
  MOCK_LEARNING_MATERIALS
} from "../mock-data";

interface STSNState {
  currentUser: User | null;
  activeSchool: SchoolId | "ALL";
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

  // Actions
  login: (email: string, role: string) => boolean;
  logout: () => void;
  setCurrentUser: (user: User | null) => void;
  
  // Registrar Actions
  addStudent: (student: Omit<Student, "id" | "studentNo">) => Student;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  updateStudentRequirements: (studentId: string, reqName: string, status: "Submitted" | "Pending" | "Rejected") => void;
  approveEnrollment: (enrollmentId: string, section: string) => void;
  rejectEnrollment: (enrollmentId: string) => void;
  submitNewEnrollment: (enrollment: Omit<Enrollment, "id">) => Enrollment;

  // Accounting Actions
  addAssessment: (assessment: StudentAssessment) => void;
  updateAssessment: (id: string, updates: Partial<StudentAssessment>) => void;
  addPayment: (payment: Omit<Payment, "id" | "orNumber" | "paymentDate">) => Payment;

  // Grading Actions
  saveGrade: (studentId: string, subjectCode: string, midterm: number, final: number) => void;

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

  // Multi-school actions
  setActiveSchool: (school: SchoolId | "ALL") => void;

  // LMS actions
  addLearningMaterial: (material: Omit<LearningMaterial, "id">) => LearningMaterial;
  updateLearningMaterial: (id: string, updates: Partial<LearningMaterial>) => void;
  deleteLearningMaterial: (id: string) => void;
  toggleLearningMaterialPublish: (id: string) => void;

  // HR Excel import
  bulkImportEmployees: (employees: Omit<Employee, "id">[]) => void;
}

export const useSTSNStore = create<STSNState>((set, get) => ({
  currentUser: MOCK_USERS.find((u) => u.role === "SUPER_ADMIN") || null,
  activeSchool: "ALL",
  users: MOCK_USERS,
  students: MOCK_STUDENTS,
  teachers: MOCK_TEACHERS,
  employees: MOCK_EMPLOYEES,
  courses: MOCK_COURSES,
  subjects: MOCK_SUBJECTS,
  curriculums: MOCK_CURRICULUMS,
  requirements: MOCK_REQUIREMENTS,
  enrollments: MOCK_ENROLLMENTS,
  assessments: MOCK_ASSESSMENTS,
  payments: MOCK_PAYMENTS,
  grades: MOCK_GRADES,
  schedules: MOCK_SCHEDULES,
  announcements: MOCK_ANNOUNCEMENTS,
  events: MOCK_EVENTS,
  payroll: STARTING_PAYROLL,
  setupData: MOCK_SETUP_DATA,
  discountTypes: MOCK_DISCOUNT_TYPES,
  discountRequests: MOCK_DISCOUNT_REQUESTS,
  classSchedules: MOCK_CLASS_SCHEDULES,
  learningMaterials: MOCK_LEARNING_MATERIALS,

  login: (email: string, role: string) => {
    const user = get().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (user && user.isActive) {
      set({ currentUser: user, activeSchool: user.schoolId || "ALL" });
      return true;
    }
    // Handle fallback if matching by email
    const fallbackUser = get().users.find((u) => u.role === role);
    if (fallbackUser) {
      set({ currentUser: fallbackUser, activeSchool: fallbackUser.schoolId || "ALL" });
      return true;
    }
    return false;
  },

  logout: () => {
    set({ currentUser: null });
  },

  setCurrentUser: (user) => {
    set({ currentUser: user });
  },

  addStudent: (studentData) => {
    const serial = get().students.length + 1;
    const studentNo = `STSN-2026-${String(serial).padStart(4, "0")}`;
    const newId = `stud-${Date.now()}`;
    const newStudent: Student = {
      ...studentData,
      id: newId,
      studentNo
    };

    set((state) => ({
      students: [...state.students, newStudent]
    }));

    // Generate requirement items
    const requiredChecklists: ("PSA Birth Certificate" | "Good Moral Certificate" | "Transcript of Records (TOR)" | "Form 137 / SF9" | "ID Picture (2x2)")[] = [
      "PSA Birth Certificate",
      "Good Moral Certificate",
      "ID Picture (2x2)"
    ];
    if (studentData.department === "College") {
      requiredChecklists.push("Transcript of Records (TOR)");
    } else {
      requiredChecklists.push("Form 137 / SF9");
    }

    const newReqs: Requirement[] = requiredChecklists.map((name, i) => ({
      id: `req-new-${newId}-${i}`,
      studentId: newId,
      name,
      status: "Pending"
    }));

    set((state) => ({
      requirements: [...state.requirements, ...newReqs]
    }));

    return newStudent;
  },

  updateStudent: (id, updates) => {
    set((state) => ({
      students: state.students.map((s) => (s.id === id ? { ...s, ...updates } : s))
    }));
  },

  updateStudentRequirements: (studentId, reqName, status) => {
    set((state) => ({
      requirements: state.requirements.map((req) =>
        req.studentId === studentId && req.name === reqName
          ? { ...req, status, submittedDate: status === "Submitted" ? new Date().toISOString().split("T")[0] : req.submittedDate }
          : req
      )
    }));
  },

  submitNewEnrollment: (enrollData) => {
    const newId = `enr-${Date.now()}`;
    const newEnrollment: Enrollment = {
      ...enrollData,
      id: newId,
      status: "Pending"
    };

    set((state) => ({
      enrollments: [...state.enrollments, newEnrollment],
      students: state.students.map((student) =>
        student.id === enrollData.studentId ? { ...student, enrollmentStatus: "Pending" } : student
      )
    }));

    // Create Initial assessment of registration fees
    const isCollege = get().students.find((s) => s.id === enrollData.studentId)?.department === "College";
    const tuitionRate = isCollege ? 950 * enrollData.subjectCodes.length * 3 : 18000;
    const totalAmount = tuitionRate + 4500 + 3500 + 1000;

    const baseFees = [
      { feeName: isCollege ? `College Tuition Fee` : "SHS Tuition Fee (Flat)", category: "Tuition", amount: tuitionRate },
      { feeName: "Registration & Misc Fee", category: "Miscellaneous", amount: 4500 },
      { feeName: "Computer Laboratory Fee", category: "Laboratory", amount: 3500 },
      { feeName: "School ID / Facilities Fee", category: "ID/Other", amount: 1000 }
    ];

    const newAssessment: StudentAssessment = {
      id: `as-${enrollData.studentId}`,
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

    set((state) => ({
      assessments: [...state.assessments, newAssessment]
    }));

    return newEnrollment;
  },

  approveEnrollment: (enrollmentId, section) => {
    const enrollment = get().enrollments.find((e) => e.id === enrollmentId);
    if (!enrollment) return;

    set((state) => ({
      enrollments: state.enrollments.map((e) => (e.id === enrollmentId ? { ...e, status: "Enrolled" } : e)),
      students: state.students.map((s) =>
        s.id === enrollment.studentId ? { ...s, enrollmentStatus: "Enrolled", section } : s
      )
    }));
  },

  rejectEnrollment: (enrollmentId) => {
    const enrollment = get().enrollments.find((e) => e.id === enrollmentId);
    if (!enrollment) return;

    set((state) => ({
      enrollments: state.enrollments.map((e) => (e.id === enrollmentId ? { ...e, status: "Rejected" } : e)),
      students: state.students.map((s) =>
        s.id === enrollment.studentId ? { ...s, enrollmentStatus: "Rejected" } : s
      )
    }));
  },

  addAssessment: (assessment) => {
    set((state) => ({
      assessments: [...state.assessments, assessment]
    }));
  },

  updateAssessment: (id, updates) => {
    set((state) => ({
      assessments: state.assessments.map((a) => (a.id === id ? { ...a, ...updates } : a))
    }));
  },

  addPayment: (paymentData) => {
    const serial = get().payments.length + 10451;
    const orNumber = `OR-2026-${serial}`;
    const newId = `pay-${Date.now()}`;
    const newPayment: Payment = {
      ...paymentData,
      id: newId,
      orNumber,
      paymentDate: new Date().toISOString().replace("T", " ").substring(0, 16)
    };

    set((state) => ({
      payments: [...state.payments, newPayment],
      // Deduct from assessment balance
      assessments: state.assessments.map((a) => {
        if (a.studentId === paymentData.studentId) {
          const newBal = Math.max(0, a.balance - paymentData.amount);
          return { ...a, balance: newBal };
        }
        return a;
      })
    }));

    return newPayment;
  },

  saveGrade: (studentId, subjectCode, midterm, final) => {
    const passed = final >= 75 ? "Passed" : "Failed";
    const existing = get().grades.find((g) => g.studentId === studentId && g.subjectCode === subjectCode);

    if (existing) {
      set((state) => ({
        grades: state.grades.map((g) =>
          g.studentId === studentId && g.subjectCode === subjectCode
            ? { ...g, midtermGrade: midterm, finalGrade: final, remarks: passed }
            : g
        )
      }));
    } else {
      const newGrade: Grade = {
        id: `gr-${Date.now()}`,
        studentId,
        subjectCode,
        teacherId: get().currentUser?.id || "teach-arthur",
        schoolYear: "2026-2027",
        semester: "First Semester",
        midtermGrade: midterm,
        finalGrade: final,
        remarks: passed
      };
      set((state) => ({
        grades: [...state.grades, newGrade]
      }));
    }
  },

  addEmployee: (employee) => {
    const newEmp: Employee = {
      ...employee,
      id: `emp-${Date.now()}`
    };
    set((state) => ({
      employees: [...state.employees, newEmp]
    }));
  },

  updateEmployee: (id, updates) => {
    set((state) => ({
      employees: state.employees.map((e) => (e.id === id ? { ...e, ...updates } : e))
    }));
  },

  addPayrollRow: (row) => {
    set((state) => ({
      payroll: [row, ...state.payroll]
    }));
  },

  markPaidPayroll: (id) => {
    set((state) => ({
      payroll: state.payroll.map((p) => (p.id === id ? { ...p, status: "Paid" } : p))
    }));
  },

  processGlobalPayroll: () => {
    // Generate new payroll rows for all active employees for current bi-weekly period
    const employees = get().employees;
    const period = "June 01 - 15, 2026";
    const newRows: PayrollRow[] = employees.map((emp) => {
      const gross = emp.salary / 2; // Bi weekly
      const allowance = emp.status === "Full-Time" ? 1750 : 500;
      const sss = Math.round(gross * 0.04);
      const phil = Math.round(gross * 0.015);
      const pag = 100;
      const tax = Math.round((gross - sss - phil - pag) * 0.08);
      const net = gross + allowance - (sss + phil + pag + tax);

      return {
        id: `payr-new-${emp.id}-${Date.now()}`,
        employeeId: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        position: emp.position,
        basicSalary: gross,
        allowances: allowance,
        sssDeduction: sss,
        philhealthDeduction: phil,
        pagibigDeduction: pag,
        taxDeduction: tax,
        netPay: net,
        period,
        status: "Pending"
      };
    });

    set((state) => ({
      payroll: [...newRows, ...state.payroll]
    }));
  },

  toggleUserStatus: (id) => {
    set((state) => ({
      users: state.users.map((u) => (u.id === id ? { ...u, isActive: !u.isActive } : u))
    }));
  },

  addUser: (user) => {
    set((state) => ({
      users: [...state.users, user]
    }));
  },

  addAnnouncement: (annData) => {
    const author = get().currentUser?.name || "System Bureau";
    const newAnn: Announcement = {
      ...annData,
      id: `ann-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      author
    };
    set((state) => ({
      announcements: [newAnn, ...state.announcements]
    }));
  },

  addCourse: (courseData) => {
    const newId = `c-${courseData.code.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
    const newCourse: Course = {
      ...courseData,
      id: newId
    };
    set((state) => ({
      courses: [...state.courses, newCourse]
    }));
  },

  updateCourse: (id, updates) => {
    set((state) => ({
      courses: state.courses.map((c) => (c.id === id ? { ...c, ...updates } : c))
    }));
  },

  deleteCourse: (id) => {
    set((state) => ({
      courses: state.courses.filter((c) => c.id !== id)
    }));
  },

  addSubject: (subjectData) => {
    const newId = `s-sub-${Date.now()}`;
    const newSubject: Subject = {
      ...subjectData,
      id: newId
    };
    set((state) => ({
      subjects: [...state.subjects, newSubject]
    }));
  },

  updateSubject: (id, updates) => {
    set((state) => ({
      subjects: state.subjects.map((s) => (s.id === id ? { ...s, ...updates } : s))
    }));
  },

  deleteSubject: (id) => {
    set((state) => ({
      subjects: state.subjects.filter((s) => s.id !== id)
    }));
  },

  addCurriculum: (curriculumData) => {
    const newId = `curr-${Date.now()}`;
    const newCurriculum: Curriculum = {
      ...curriculumData,
      id: newId
    };
    set((state) => ({
      curriculums: [...state.curriculums, newCurriculum]
    }));
  },

  updateCurriculum: (id, updates) => {
    set((state) => ({
      curriculums: state.curriculums.map((c) => (c.id === id ? { ...c, ...updates } : c))
    }));
  },

  deleteCurriculum: (id) => {
    set((state) => ({
      curriculums: state.curriculums.filter((c) => c.id !== id)
    }));
  },

  // ---- Core Setup Actions ----
  addSetupItem: (category, itemData) => {
    const newItem = {
      ...itemData,
      id: `setup-${category}-${Date.now()}`,
      createdAt: new Date().toISOString().split("T")[0],
      createdBy: get().currentUser?.name || "System",
      isActive: itemData.isActive ?? true
    } as SetupItem;
    set((state) => ({
      setupData: {
        ...state.setupData,
        [category]: [...(state.setupData[category] || []), newItem]
      }
    }));
    return newItem;
  },

  updateSetupItem: (category, id, updates) => {
    set((state) => ({
      setupData: {
        ...state.setupData,
        [category]: (state.setupData[category] || []).map((item) =>
          item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString().split("T")[0] } : item
        )
      }
    }));
  },

  deleteSetupItem: (category, id) => {
    set((state) => ({
      setupData: {
        ...state.setupData,
        [category]: (state.setupData[category] || []).filter((item) => item.id !== id)
      }
    }));
  },

  toggleSetupItemActive: (category, id) => {
    set((state) => ({
      setupData: {
        ...state.setupData,
        [category]: (state.setupData[category] || []).map((item) =>
          item.id === id ? { ...item, isActive: !item.isActive, updatedAt: new Date().toISOString().split("T")[0] } : item
        )
      }
    }));
  },

  // ---- Discount Management Actions ----
  addDiscountType: (dtData) => {
    const newDT: DiscountType = {
      ...dtData,
      id: `dt-${Date.now()}`,
      createdAt: new Date().toISOString().split("T")[0],
      isActive: dtData.isActive ?? true
    };
    set((state) => ({ discountTypes: [...state.discountTypes, newDT] }));
  },

  updateDiscountType: (id, updates) => {
    set((state) => ({
      discountTypes: state.discountTypes.map((dt) => (dt.id === id ? { ...dt, ...updates } : dt))
    }));
  },

  deleteDiscountType: (id) => {
    set((state) => ({ discountTypes: state.discountTypes.filter((dt) => dt.id !== id) }));
  },

  toggleDiscountTypeActive: (id) => {
    set((state) => ({
      discountTypes: state.discountTypes.map((dt) => (dt.id === id ? { ...dt, isActive: !dt.isActive } : dt))
    }));
  },

  addDiscountRequest: (reqData) => {
    const serial = get().discountRequests.length + 1001;
    const newReq: DiscountRequest = {
      ...reqData,
      id: `dreq-${Date.now()}`,
      referenceNo: `DISC-${new Date().getFullYear()}-${String(serial).padStart(4, "0")}`,
      requestedAt: new Date().toISOString().replace("T", " ").substring(0, 16),
      status: "Pending",
      level1Status: "Pending",
      level2Status: "Pending",
      auditTrail: [{
        id: `audit-${Date.now()}`,
        action: "REQUEST_SUBMITTED",
        performedBy: reqData.requestedBy,
        performedAt: new Date().toISOString().replace("T", " ").substring(0, 16),
        details: `Discount request submitted for ${reqData.discountTypeName}`
      }]
    };
    set((state) => ({ discountRequests: [newReq, ...state.discountRequests] }));
    return newReq;
  },

  approveDiscountRequest: (id, level, approvedBy, remarks) => {
    const now = new Date().toISOString().replace("T", " ").substring(0, 16);
    const auditEntry: AuditEntry = {
      id: `audit-${Date.now()}`,
      action: `LEVEL_${level}_APPROVED`,
      performedBy: approvedBy,
      performedAt: now,
      details: remarks || `Approved at Level ${level}`
    };
    set((state) => ({
      discountRequests: state.discountRequests.map((req) => {
        if (req.id !== id) return req;
        const levelKey = level === 1 ? "level1" : "level2";
        const otherLevelApproved = level === 1 ? req.level2Status : req.level1Status;
        const newStatus = level === 1
          ? (req.level2Status === "Approved" ? "Approved" : "For Review")
          : (req.level1Status === "Approved" ? "Approved" : "For Review");
        return {
          ...req,
          [`${levelKey}Status`]: "Approved",
          [`${levelKey}ApprovedBy`]: approvedBy,
          [`${levelKey}ApprovedAt`]: now,
          status: (level === 1 && req.level2Status === "Approved") || (level === 2 && req.level1Status === "Approved") ? "Approved" : "For Review",
          auditTrail: [...req.auditTrail, auditEntry]
        };
      })
    }));
    // Apply discount to assessment if fully approved
    const req = get().discountRequests.find((r) => r.id === id);
    if (req && req.level1Status === "Approved" && req.level2Status === "Approved") {
      const assessment = get().assessments.find((a) => a.studentId === req.studentId);
      if (assessment) {
        const discountAmt = Math.round(assessment.totalAmount * (req.discountPercent / 100));
        get().updateAssessment(assessment.id, {
          discountPercentage: req.discountPercent,
          discountAmount: discountAmt,
          scholarshipName: req.discountTypeName,
          balance: Math.max(0, assessment.totalAmount - discountAmt)
        });
      }
    }
  },

  rejectDiscountRequest: (id, level, approvedBy, remarks) => {
    const now = new Date().toISOString().replace("T", " ").substring(0, 16);
    const auditEntry: AuditEntry = {
      id: `audit-${Date.now()}`,
      action: `LEVEL_${level}_REJECTED`,
      performedBy: approvedBy,
      performedAt: now,
      details: remarks || `Rejected at Level ${level}`
    };
    set((state) => ({
      discountRequests: state.discountRequests.map((req) => {
        if (req.id !== id) return req;
        const levelKey = level === 1 ? "level1" : "level2";
        return {
          ...req,
          [`${levelKey}Status`]: "Rejected",
          [`${levelKey}ApprovedBy`]: approvedBy,
          [`${levelKey}ApprovedAt`]: now,
          status: "Rejected",
          auditTrail: [...req.auditTrail, auditEntry]
        };
      })
    }));
  },

  // ---- Class Scheduling Actions ----
  addClassSchedule: (scheduleData) => {
    const newSchedule: ClassSchedule = {
      ...scheduleData,
      id: `csched-${Date.now()}`
    };
    set((state) => ({ classSchedules: [...state.classSchedules, newSchedule] }));
    return newSchedule;
  },

  updateClassSchedule: (id, updates) => {
    set((state) => ({
      classSchedules: state.classSchedules.map((s) => (s.id === id ? { ...s, ...updates } : s))
    }));
  },

  deleteClassSchedule: (id) => {
    set((state) => ({ classSchedules: state.classSchedules.filter((s) => s.id !== id) }));
  },

  toggleClassScheduleActive: (id) => {
    set((state) => ({
      classSchedules: state.classSchedules.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s))
    }));
  },

  // ---- Multi-school ----
  setActiveSchool: (school) => {
    set({ activeSchool: school });
  },

  // ---- LMS Actions ----
  addLearningMaterial: (materialData) => {
    const newMaterial: LearningMaterial = {
      ...materialData,
      id: `lm-${Date.now()}`
    };
    set((state) => ({ learningMaterials: [newMaterial, ...state.learningMaterials] }));
    return newMaterial;
  },

  updateLearningMaterial: (id, updates) => {
    set((state) => ({
      learningMaterials: state.learningMaterials.map((m) => (m.id === id ? { ...m, ...updates } : m))
    }));
  },

  deleteLearningMaterial: (id) => {
    set((state) => ({ learningMaterials: state.learningMaterials.filter((m) => m.id !== id) }));
  },

  toggleLearningMaterialPublish: (id) => {
    set((state) => ({
      learningMaterials: state.learningMaterials.map((m) =>
        m.id === id ? { ...m, publishStatus: m.publishStatus === "Published" ? "Draft" : "Published" } : m
      )
    }));
  },

  // ---- HR Bulk Import ----
  bulkImportEmployees: (employeesData) => {
    const newEmployees: Employee[] = employeesData.map((emp, i) => ({
      ...emp,
      id: `emp-import-${Date.now()}-${i}`
    }));
    set((state) => ({ employees: [...state.employees, ...newEmployees] }));
  }
}));

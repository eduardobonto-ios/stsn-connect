/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Fetches every entity from Supabase and reconstructs the exact nested shapes
 * the app's existing types expect (the same shapes the old mock-data module
 * used to export), so the rest of the app needs zero changes to consume it.
 */
import { supabase } from "../lib/supabase";
import { toCamel } from "./supabaseCrud";
import { schoolCodeToId, subjectCodeToId } from "./idMaps";
import type {
  User, Student, Teacher, Employee, Course, Subject, Curriculum, Requirement, Enrollment,
  StudentAssessment, Payment, Grade, Schedule, Announcement, SchoolEvent, PayrollRow, SetupItem,
  DiscountType, DiscountRequest, ClassSchedule, LearningMaterial, SchoolSection, Room, BookPackage,
  StudentLedgerSummary, LedgerTransaction, FinancialHold, AssessmentBillingSummary, PaymentCollectionSummary,
  EmployeeLifecycleEvent, ShiftTemplate, EmployeeShiftAssignment, EmployeeTimeLog, EmployeeAttendance,
  LeaveType, LeaveRequest, PayrollPeriod, PayrollRun, PayrollLine, SalaryPayoutBatch, SalaryPayoutLine,
  BenefitPlan, StatutoryContributionRule, TaxTable, TaxBracket,
  JobRequisition, JobApplicant, ApplicantInterview,
  OnboardingTemplate, OnboardingTask, EmployeeOnboardingTask,
  OnlineEnrollmentApplication,
  CashVoucher,
  VoidRequest,
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
  AcademicYear,
  AcademicYearLevel,
  StudentFeeCategory,
  StudentFeeItem,
  StudentFeeSchedule,
  StudentFeeScheduleRate,
  StudentPaymentTermTemplate,
  StudentPaymentTermTemplateInstallment,
  StudentAidProgram,
  StudentAidAward,
} from "../types";
import type { GradePeriod, StudentGradeEntry, SubjectClassLoad, GradeRosterStudent } from "../types/grading";

const personName = (
  person:
    | { first_name?: string; last_name?: string; firstName?: string; lastName?: string }
    | null
    | undefined
) => person ? `${person.first_name ?? person.firstName ?? ""} ${person.last_name ?? person.lastName ?? ""}`.trim() || undefined : undefined;

export interface LoadedData {
  financeWritesEnabled: boolean;
  studentFeeEngineEnabled: boolean;
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
  classSchedules: ClassSchedule[];
  learningMaterials: LearningMaterial[];
  sections: SchoolSection[];
  rooms: Room[];
  studentLedgerSummaries: StudentLedgerSummary[];
  ledgerTransactions: LedgerTransaction[];
  financialHolds: FinancialHold[];
  assessmentBillingSummaries: AssessmentBillingSummary[];
  paymentCollectionSummaries: PaymentCollectionSummary[];
  promissoryNotes: { id: string; studentId: string; amount: number; dueDate: string; status: string }[];
  bookPackages: BookPackage[];
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
  academicYears: AcademicYear[];
  academicYearLevels: AcademicYearLevel[];
  studentFeeCategories: StudentFeeCategory[];
  studentFeeItems: StudentFeeItem[];
  studentFeeSchedules: StudentFeeSchedule[];
  studentFeeScheduleRates: StudentFeeScheduleRate[];
  studentPaymentTermTemplates: StudentPaymentTermTemplate[];
  studentPaymentTermTemplateInstallments: StudentPaymentTermTemplateInstallment[];
  studentAidPrograms: StudentAidProgram[];
  studentAidAwards: StudentAidAward[];
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
  jobRequisitions: JobRequisition[];
  jobApplicants: JobApplicant[];
  applicantInterviews: ApplicantInterview[];
  onboardingTemplates: OnboardingTemplate[];
  onboardingTasks: OnboardingTask[];
  employeeOnboardingTasks: EmployeeOnboardingTask[];
}

export async function loadAllData(): Promise<LoadedData> {
  // ---- Schools (drives schoolCodeToId map used by every write path) ----
  const { data: schoolRows } = await supabase.from("schools").select("*");
  const schools = (schoolRows ?? []).map((s: any) => {
    schoolCodeToId[s.code] = s.id;
    return {
      id: s.code, uuid: s.id, name: s.name, shortName: s.short_name, location: s.location,
      academicUnit: s.academic_unit, brandingLabel: s.branding_label, supportedRoles: s.supported_roles ?? [],
    };
  });
  const schoolIdToCode = new Map((schoolRows ?? []).map((school: any) => [school.id, school.code]));

  // ---- Subjects (drives subjectCodeToId map) ----
  const { data: subjectRows } = await supabase.from("subjects").select("*");
  const subjects: Subject[] = (subjectRows ?? []).map((s: any) => {
    subjectCodeToId[s.code] = s.id;
    return {
      id: s.id, code: s.code, name: s.name, units: s.units, department: s.department,
      yearLevel: s.year_level, semester: s.semester, trackOrCourse: s.track_or_course, prerequisites: s.prerequisites ?? [],
    };
  });

  // ---- Users ----
  const { data: userRows } = await supabase.from("users").select("*, schools(code)");
  const users: User[] = (userRows ?? []).map((u: any) => ({
    id: u.id, authUserId: u.auth_user_id ?? undefined,
    schoolId: u.schools?.code, email: u.email, name: u.name, role: u.role,
    designation: u.designation ?? undefined,
    isActive: u.is_active, avatarUrl: u.avatar_url, department: u.department,
  }));

  // ---- Teachers (faculty) ----
  // Faculty identity is synthesized from employees + employee_faculty_profiles
  // below (after the employee load). The app no longer reads public.teachers at
  // runtime — teacher→employee consolidation, Phase 6 prep.

  // ---- Students ----
  const { data: studentRows } = await supabase.from("students").select("*, schools(code)");
  const students: Student[] = (studentRows ?? []).map((s: any) => ({
    id: s.id, schoolId: s.schools?.code, studentNo: s.student_no, lrn: s.lrn, firstName: s.first_name, lastName: s.last_name,
    createdVia: s.created_via, sourceMetadata: s.source_metadata ?? {},
    middleName: s.middle_name, gender: s.gender, civilStatus: s.civil_status, religion: s.religion,
    nationality: s.nationality, birthday: s.birthday, birthplace: s.birthplace, email: s.email,
    contactNo: s.contact_no, address: s.address, province: s.province, municipality: s.municipality,
    zipCode: s.zip_code, userId: s.user_id, department: s.department, yearLevel: s.year_level,
    trackOrCourse: s.track_or_course, section: s.section, enrollmentStatus: s.enrollment_status,
  }));

  // ---- Employees ----
  const { data: employeeRows } = await supabase.from("employees").select("*, schools(code)");
  const { data: facultyProfileRows } = await supabase
    .from("employee_faculty_profiles")
    .select("employee_id, teacher_id, specialization, advisory_section, is_teaching_staff, faculty_rank");
  const facultyProfileByEmployeeId = new Map(
    (facultyProfileRows ?? []).map((f: any) => [f.employee_id, f])
  );
  const employees: Employee[] = (employeeRows ?? []).map((e: any) => {
    const facultyProfile = facultyProfileByEmployeeId.get(e.id);
    return {
      id: e.id, schoolId: e.schools?.code, firstName: e.first_name, lastName: e.last_name, middleName: e.middle_name,
      email: e.email, position: e.position, positionTitle: e.position_title, department: e.department,
      salary: e.salary, status: e.status, leaveBalance: e.leave_balance, contact: e.contact,
      address: e.address, emergencyContact: e.emergency_contact,
      employeeNo: e.employee_no, userId: e.user_id, employmentStatus: e.employment_status ?? "Active",
      hireDate: e.hire_date, regularizationDate: e.regularization_date, separationDate: e.separation_date,
      separationReason: e.separation_reason, supervisorId: e.supervisor_id,
      isTeachingStaff: facultyProfile?.is_teaching_staff ?? false,
      facultyRank: facultyProfile?.faculty_rank ?? null,
    };
  });
  const employeeById = new Map(employees.map((e) => [e.id, e]));

  // ---- Teachers (synthesized, employee-backed) ----
  // Faculty identity now derives from employees + employee_faculty_profiles
  // instead of public.teachers. Teacher.id keeps the legacy teachers.id while the
  // faculty profile still carries one (transitional — lets legacy teacher_id-owned
  // rows and FK dual-writes resolve during the dual-read window) and falls back to
  // the employee id otherwise. Remove the legacy-id fallback wiring when Phase 6
  // drops public.teachers. Identity/contact fields come from the employee; faculty
  // metadata (specialization, advisory section) from the faculty profile.
  let teachers: Teacher[] = (facultyProfileRows ?? [])
    .map((fp: any): Teacher | null => {
      const emp = employeeById.get(fp.employee_id);
      if (!emp) return null;
      return {
        id: fp.teacher_id ?? emp.id,
        schoolId: emp.schoolId,
        userId: emp.userId,
        employeeId: emp.id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        middleName: emp.middleName ?? "",
        department: emp.department as Teacher["department"],
        email: emp.email ?? "",
        phone: emp.contact ?? "",
        specialization: fp.specialization ?? "",
        advisorySection: fp.advisory_section ?? undefined,
        isActive: emp.employmentStatus ? emp.employmentStatus === "Active" : true,
      };
    })
    .filter((t): t is Teacher => t !== null);
  let teacherById = new Map(teachers.map((t) => [t.id, t]));

  // ---- Courses ----
  const { data: courseRows } = await supabase.from("courses").select("*");
  const courses: Course[] = (courseRows ?? []).map((c: any) => ({
    id: c.id, code: c.code, name: c.name, department: c.department, durationYears: c.duration_years,
  }));

  // ---- Curriculums + curriculum_subjects ----
  const { data: curriculumRows } = await supabase.from("curriculums").select("*");
  const { data: currSubjRows } = await supabase.from("curriculum_subjects").select("*, subjects(code)");
  const curriculums: Curriculum[] = (curriculumRows ?? []).map((c: any) => {
    const blocks = new Map<string, { yearLevel: string; semester: string; subjectCodes: string[] }>();
    for (const cs of currSubjRows ?? []) {
      if (cs.curriculum_id !== c.id) continue;
      const key = `${cs.year_level}|${cs.semester}`;
      if (!blocks.has(key)) blocks.set(key, { yearLevel: cs.year_level, semester: cs.semester, subjectCodes: [] });
      if (cs.subjects?.code) blocks.get(key)!.subjectCodes.push(cs.subjects.code);
    }
    return { id: c.id, courseCodeOrStrand: c.course_code_or_strand, name: c.name, subjects: Array.from(blocks.values()) };
  });

  // ---- Sections + section_students ----
  const { data: sectionRows } = await supabase.from("sections").select("*, schools(code)");
  const { data: sectionStudentRows } = await supabase.from("section_students").select("*");
  const sections: SchoolSection[] = (sectionRows ?? []).map((s: any) => {
    const adviserEmployee = s.adviser_employee_id ? employeeById.get(s.adviser_employee_id) : undefined;
    const adviserTeacher = s.adviser_id ? teacherById.get(s.adviser_id) : undefined;
    const adviserName = personName(adviserEmployee) ?? personName(adviserTeacher);
    return {
      id: s.id, schoolId: s.schools?.code, code: s.code, name: s.name, department: s.department,
      yearLevel: s.year_level, strandOrTrack: s.strand_or_track, adviserId: s.adviser_id,
      adviserEmployeeId: s.adviser_employee_id, adviserName, capacity: s.capacity, currentCount: s.current_count,
      academicYear: s.academic_year, semester: s.semester, isActive: s.is_active, createdAt: s.created_at,
      enrolledStudentIds: (sectionStudentRows ?? []).filter((ss: any) => ss.section_id === s.id).map((ss: any) => ss.student_id),
    };
  });
  teachers = teachers.map((teacher) => {
    const derivedAdvisorySection = sections.find(
      (section) =>
        (!!teacher.employeeId && section.adviserEmployeeId === teacher.employeeId) ||
        section.adviserId === teacher.id
    )?.name;
    return {
      ...teacher,
      advisorySection: derivedAdvisorySection ?? teacher.advisorySection,
    };
  });
  teacherById = new Map(teachers.map((teacher) => [teacher.id, teacher]));

  // ---- Rooms ----
  const { data: roomRows } = await supabase.from("rooms").select("*, schools(code)");
  const rooms: Room[] = (roomRows ?? []).map((r: any) => ({
    id: r.id, schoolId: r.schools?.code, code: r.code, name: r.name, building: r.building, floor: r.floor,
    capacity: r.capacity, type: r.type, isActive: r.is_active, status: r.status,
  }));

  // ---- Class schedules ----
  const { data: classSchedRows } = await supabase.from("class_schedules").select("*, subjects(code,name)");
  const classSchedules: ClassSchedule[] = (classSchedRows ?? []).map((c: any) => {
    const owningEmployee = c.employee_id ? employeeById.get(c.employee_id) : undefined;
    const owningTeacher = c.teacher_id ? teacherById.get(c.teacher_id) : undefined;
    return {
      id: c.id, subjectCode: c.subjects?.code ?? "", subjectName: c.subjects?.name ?? "", teacherId: c.teacher_id,
      employeeId: c.employee_id,
      teacherName: personName(owningEmployee) ?? personName(owningTeacher) ?? "",
      section: c.section, roomName: c.room_name, day: c.day,
      startTime: c.start_time, endTime: c.end_time, schoolYear: c.school_year, semester: c.semester,
      isActive: c.is_active, department: c.department, yearLevel: c.year_level, courseOrTrack: c.course_or_track, notes: c.notes,
    };
  });

  // ---- Legacy flat schedules ----
  const { data: scheduleRows } = await supabase.from("schedules").select("*");
  const schedules: Schedule[] = (scheduleRows ?? []).map((s: any) => ({
    id: s.id, subjectCode: s.subject_code, subjectName: s.subject_name, teacherName: s.teacher_name,
    section: s.section, day: s.day, time: s.time, room: s.room,
  }));

  // ---- Requirements ----
  const { data: reqRows } = await supabase.from("requirements").select("*");
  const requirements: Requirement[] = (reqRows ?? []).map((r: any) => ({
    id: r.id, studentId: r.student_id, name: r.name, status: r.status, submittedDate: r.submitted_date,
    remarks: r.remarks, uploadStatus: r.upload_status, uploadFileName: r.upload_file_name, uploadFilePath: r.upload_file_path, uploadDate: r.upload_date,
    verificationStatus: r.verification_status, verifiedBy: r.verified_by, verifiedAt: r.verified_at,
    hardcopySubmitted: r.hardcopy_submitted, hardcopySubmittedDate: r.hardcopy_submitted_date,
  }));

  // ---- Book packages + items ----
  const { data: bookPkgRows } = await supabase.from("book_packages").select("*, schools(code)");
  const { data: bookItemRows } = await supabase.from("book_package_items").select("*, subjects(code)");
  const bookPackages: BookPackage[] = (bookPkgRows ?? []).map((b: any) => ({
    id: b.id, packageName: b.package_name, gradeLevel: b.grade_level, schoolId: b.schools?.code,
    academicUnit: b.academic_unit, schoolYear: b.school_year, totalAmount: b.total_amount,
    isRequired: b.is_required, status: b.status, lastUpdated: b.last_updated, updatedBy: b.updated_by,
    books: (bookItemRows ?? []).filter((it: any) => it.book_package_id === b.id).map((it: any) => ({
      id: it.id, title: it.title, subjectCode: it.subjects?.code, quantity: it.quantity, unitPrice: it.unit_price,
    })),
  }));

  // ---- Assessments + fees + audit trail ----
  const { data: assessmentRows } = await supabase.from("assessments").select("*, schools(code), book_packages(legacy_id)");
  const { data: assessmentFinancialRows } = await supabase.from("assessment_financials").select("*");
  const { data: assessmentFeeRows } = await supabase.from("assessment_fees").select("*");
  const { data: assessmentAuditRows } = await supabase.from("assessment_audit_trail").select("*");
  const assessmentFinancialById = new Map(
    (assessmentFinancialRows ?? []).map((row: any) => [row.assessment_id, row]),
  );
  const assessments: StudentAssessment[] = (assessmentRows ?? []).map((a: any) => {
    const financial: any = assessmentFinancialById.get(a.id);
    const totalAmount = financial
      ? Number(financial.gross_charges) + Number(financial.debit_adjustments)
      : Number(a.total_amount);
    const discountAmount = financial ? Number(financial.discount_amount) : Number(a.discount_amount);
    return {
      id: a.id, enrollmentId: a.enrollment_id, schoolId: a.schools?.code, studentId: a.student_id, schoolYear: a.school_year, semester: a.semester,
      fees: (assessmentFeeRows ?? []).filter((f: any) => f.assessment_id === a.id).map((f: any) => ({ feeName: f.fee_name, category: f.category, amount: Number(f.amount) })),
      totalAmount, discountPercentage: totalAmount > 0 ? (discountAmount / totalAmount) * 100 : 0, discountAmount,
      scholarshipName: a.scholarship_name, paymentTerm: a.payment_term,
      balance: financial ? Number(financial.balance) : Number(a.balance),
      isPaid: financial ? financial.is_paid : a.is_paid,
      financialHoldStatus: a.financial_hold_status,
      lastPaymentDate: financial?.last_payment_date ?? a.last_payment_date,
      booksAvailed: a.books_availed,
      bookPackageId: a.book_package_id, approvalStatus: a.approval_status, submittedBy: a.submitted_by,
      submittedDate: a.submitted_date, registrarRemarks: a.registrar_remarks, accountingRemarks: a.accounting_remarks,
      approvedBy: a.approved_by, approvedDate: a.approved_date,
      auditTrail: (assessmentAuditRows ?? []).filter((t: any) => t.assessment_id === a.id).map((t: any) => ({
        id: t.id, action: t.action, performedBy: t.performed_by, performedAt: t.performed_at, details: t.details,
      })),
    };
  });

  // ---- Enrollments + enrollment_subjects ----
  const { data: enrollmentRows } = await supabase.from("enrollments").select("*");
  const { data: enrollSubjRows } = await supabase.from("enrollment_subjects").select("*, subjects(code)");
  const enrollments: Enrollment[] = (enrollmentRows ?? []).map((e: any) => ({
    id: e.id, studentId: e.student_id, schoolYear: e.school_year, semester: e.semester, enrollmentType: e.enrollment_type,
    status: e.status, submittedAt: e.submitted_at, assessmentId: e.assessment_id,
    enrollmentSource: e.enrollment_source, isOnlineEnrollment: e.is_online_enrollment,
    onlineApplicationId: e.online_application_id, completionStatus: e.completion_status,
    missingFields: e.missing_fields ?? [], sourceMetadata: e.source_metadata ?? {},
    subjectCodes: (enrollSubjRows ?? []).filter((es: any) => es.enrollment_id === e.id).map((es: any) => es.subjects?.code).filter(Boolean),
  }));

  const { data: onlineApplicationRows } = await supabase
    .from("online_enrollment_applications")
    .select("*")
    .order("submitted_at", { ascending: false });
  const onlineEnrollmentApplications: OnlineEnrollmentApplication[] = (onlineApplicationRows ?? []).map((a: any) => ({
    id: a.id,
    referenceNo: a.reference_no,
    schoolId: schoolIdToCode.get(a.school_id),
    studentId: a.student_id,
    enrollmentId: a.enrollment_id,
    enrollmentType: a.enrollment_type,
    lrn: a.lrn,
    schoolYear: a.school_year,
    semester: a.semester,
    gradeLevelApplyingFor: a.grade_level_applying_for,
    strandOrTrack: a.strand_or_track,
    previousSchool: a.previous_school,
    previousSchoolAddress: a.previous_school_address,
    firstName: a.first_name,
    lastName: a.last_name,
    middleName: a.middle_name,
    birthDate: a.birth_date,
    gender: a.gender,
    email: a.email,
    contactNo: a.contact_no,
    completeAddress: a.complete_address,
    barangay: a.barangay,
    cityMunicipality: a.city_municipality,
    province: a.province,
    zipCode: a.zip_code,
    guardianName: a.guardian_name,
    guardianRelationship: a.guardian_relationship,
    guardianContactNo: a.guardian_contact_no,
    guardianEmail: a.guardian_email,
    guardianAddress: a.guardian_address,
    status: a.status,
    completionStatus: a.completion_status,
    missingFields: a.missing_fields ?? [],
    submittedFrom: a.submitted_from,
    submittedAt: a.submitted_at,
    reviewNotes: a.review_notes,
    payload: a.payload ?? {},
  }));

  // ---- Normalized invoices / receipts / allocations / schedules ----
  const { data: invoiceRows } = await supabase
    .from("student_invoice_financials").select("*");
  const studentInvoices: StudentInvoice[] = (invoiceRows ?? []).map((i: any) => ({
    id: i.invoice_id, assessmentId: i.assessment_id, enrollmentId: i.enrollment_id,
    schoolId: schoolIdToCode.get(i.school_id), studentId: i.student_id,
    invoiceNo: i.invoice_no, academicYear: i.academic_year, semester: i.semester,
    currencyCode: "PHP", status: i.status, grossCharges: Number(i.gross_charges),
    debitAdjustments: Number(i.debit_adjustments), creditAdjustments: Number(i.credit_adjustments),
    discountAmount: Number(i.discount_amount), allocatedAmount: Number(i.allocated_amount),
    balance: Number(i.balance), isPaid: i.is_paid,
  }));
  const invoiceById = new Map(studentInvoices.map((invoice) => [invoice.id, invoice]));

  const { data: invoiceLineRows } = await supabase.from("student_finance_invoice_lines").select("*");
  const invoiceLines: InvoiceLine[] = (invoiceLineRows ?? []).map((line: any) => ({
    id: line.id, invoiceId: line.invoice_id, assessmentFeeId: line.assessment_fee_id,
    lineNo: line.line_no, description: line.description, category: line.category,
    quantity: Number(line.quantity), unitAmount: Number(line.unit_amount),
    amount: Number(line.amount), revenueAccountCode: line.revenue_account_code,
  }));
  const { data: planRows } = await supabase.from("student_invoice_payment_plans").select("*");
  const paymentPlans: PaymentPlan[] = (planRows ?? []).map((plan: any) => ({
    id: plan.id, invoiceId: plan.invoice_id, templateId: plan.template_id,
    templateVersion: plan.template_version, status: plan.status,
  }));
  const { data: installmentRows } = await supabase.from("student_installment_standing").select("*");
  const paymentPlanInstallments: PaymentPlanInstallment[] = (installmentRows ?? []).map((row: any) => ({
    id: row.id, invoiceId: row.invoice_id, sequenceNo: row.sequence_no,
    label: row.label, dueDate: row.due_date, amount: Number(row.amount),
    paidAmount: Number(row.paid_amount), remainingAmount: Number(row.remaining_amount),
    status: row.status,
  }));

  const { data: receiptRows } = await supabase
    .from("student_receipt_financials").select("*, student_payment_methods(name), schools(code)");
  const studentReceipts: StudentReceipt[] = (receiptRows ?? []).map((r: any) => ({
    id: r.id, schoolId: r.schools?.code, studentId: r.student_id,
    receiptNo: r.receipt_no, receiptDate: r.receipt_date,
    paymentMethodId: r.payment_method_id, paymentMethod: r.student_payment_methods?.name,
    amount: Number(r.amount), currencyCode: r.currency_code, status: r.status,
    remarks: r.remarks, postedBy: r.posted_by, postedAt: r.posted_at,
    allocatedAmount: Number(r.allocated_amount), directCollectionAmount: Number(r.direct_collection_amount),
    unappliedAmount: Number(r.unapplied_amount), allowUnappliedCredit: r.allow_unapplied_credit,
    voidedBy: r.voided_by, voidedAt: r.voided_at, voidReason: r.void_reason,
  }));
  const { data: reversalRows } = await supabase.from("student_allocation_reversals").select("*");
  const reversedByAllocation = new Map<string, number>();
  (reversalRows ?? []).forEach((reversal: any) => {
    reversedByAllocation.set(
      reversal.allocation_id,
      (reversedByAllocation.get(reversal.allocation_id) ?? 0) + Number(reversal.amount),
    );
  });
  const { data: allocationRows } = await supabase.from("student_receipt_allocations").select("*");
  const receiptAllocations: ReceiptAllocation[] = (allocationRows ?? []).map((a: any) => ({
    id: a.id, receiptId: a.receipt_id, invoiceId: a.invoice_id,
    amount: Number(a.amount), source: a.source, allocatedBy: a.allocated_by,
    allocatedAt: a.allocated_at,
    reversedAmount: reversedByAllocation.get(a.id) ?? 0,
    effectiveAmount: Math.max(0, Number(a.amount) - (reversedByAllocation.get(a.id) ?? 0)),
  }));
  const allocationsByReceipt = new Map<string, ReceiptAllocation[]>();
  receiptAllocations.forEach((allocation) => {
    allocationsByReceipt.set(allocation.receiptId, [
      ...(allocationsByReceipt.get(allocation.receiptId) ?? []), allocation,
    ]);
  });
  const { data: directRows } = await supabase.from("student_direct_collection_lines").select("*");
  const directCollectionLines: DirectCollectionLine[] = (directRows ?? []).map((line: any) => ({
    id: line.id, receiptId: line.receipt_id, collectionCategoryId: line.collection_category_id,
    amount: Number(line.amount), description: line.description,
  }));
  const { data: creditRows } = await supabase.from("student_unapplied_credits").select("*");
  const unappliedCredits: UnappliedCredit[] = (creditRows ?? []).map((credit: any) => ({
    receiptId: credit.receipt_id, schoolId: schoolIdToCode.get(credit.school_id),
    studentId: credit.student_id, receiptNo: credit.receipt_no,
    receiptDate: credit.receipt_date, amount: Number(credit.amount),
    currencyCode: credit.currency_code,
  }));
  const { data: reallocationRows } = await supabase
    .from("student_allocation_reallocation_requests").select("*");
  const allocationReallocationRequests: AllocationReallocationRequest[] =
    (reallocationRows ?? []).map((request: any) => ({
      id: request.id, allocationId: request.allocation_id,
      destinationInvoiceId: request.destination_invoice_id, amount: Number(request.amount),
      reason: request.reason, status: request.status, requestedBy: request.requested_by,
      requestedAt: request.requested_at, reviewedBy: request.reviewed_by,
      reviewedAt: request.reviewed_at, reviewRemarks: request.review_remarks,
    }));

  const payments: Payment[] = studentReceipts.map((receipt) => {
        const allocations = allocationsByReceipt.get(receipt.id) ?? [];
        const invoiceIds = [...new Set(allocations.map((allocation) => allocation.invoiceId))];
        const assessmentId = invoiceIds.length === 1
          ? invoiceById.get(invoiceIds[0])?.assessmentId
          : undefined;
        return {
          id: receipt.id, schoolId: receipt.schoolId, studentId: receipt.studentId,
          assessmentId, amount: receipt.amount, paymentDate: receipt.receiptDate,
          paymentMethod: receipt.paymentMethod ?? "", orNumber: receipt.receiptNo,
          term: receipt.directCollectionAmount > 0 ? "Direct Collection" : "Invoice Allocation",
          remarks: receipt.remarks,
          transactionType: receipt.directCollectionAmount > 0 ? "OR" : "AR",
          paymentMethodId: receipt.paymentMethodId, currencyCode: receipt.currencyCode,
          status: receipt.status, postedBy: receipt.postedBy, postedAt: receipt.postedAt,
          voidedBy: receipt.voidedBy, voidedAt: receipt.voidedAt, voidReason: receipt.voidReason,
        };
      });

  // ---- Persisted Receipt Void Requests ----
  const paymentById = new Map(payments.map((payment) => [payment.id, payment]));
  const studentForVoidById = new Map((studentRows ?? []).map((s: any) => [s.id, s]));
  const { data: receiptVoidRows } = await supabase
    .from("student_receipt_void_requests").select("*");
  const voidRequests: VoidRequest[] = (receiptVoidRows ?? []).map((v: any) => {
    const payment: any = paymentById.get(v.receipt_id ?? v.payment_id);
    const student: any = studentForVoidById.get(payment?.studentId);
    return {
      id: v.id,
      schoolId: payment?.schoolId,
      paymentId: v.receipt_id,
      orNumber: payment?.orNumber ?? "",
      amount: Number(payment?.amount ?? 0),
      studentId: payment?.studentId ?? "",
      studentName: student ? `${student.last_name}, ${student.first_name}` : "",
      requestedBy: v.requested_by,
      requestedAt: v.requested_at,
      reason: v.reason,
      status: v.status === "Pending" ? "Pending Void Approval" : v.status,
      reviewedBy: v.reviewed_by,
      reviewedAt: v.reviewed_at,
      reviewRemarks: v.review_remarks,
    };
  });

  // ---- Cash Vouchers ----
  const { data: cashVoucherRows } = await supabase.from("cash_vouchers").select("*, schools(code)");
  const cashVouchers: CashVoucher[] = (cashVoucherRows ?? []).map((v: any) => ({
    id: v.id, schoolId: v.schools?.code, voucherNo: v.voucher_no, payeeType: v.payee_type,
    payeeStudentId: v.payee_student_id, payeeName: v.payee_name, category: v.category, amount: v.amount,
    purpose: v.purpose, requestedBy: v.requested_by, requestedAt: v.requested_at, status: v.status,
    approvedBy: v.approved_by, approvedAt: v.approved_at, reviewRemarks: v.review_remarks,
    releasedBy: v.released_by, releasedAt: v.released_at, referenceNo: v.reference_no,
  }));

  // ---- Discount types & requests ----
  const { data: discountTypeRows } = await supabase.from("discount_types").select("*");
  const discountTypes: DiscountType[] = (discountTypeRows ?? []).map((d: any) => ({
    id: d.id, code: d.code, name: d.name, discountPercent: d.discount_percent, discountSource: d.discount_source,
    requiresApproval: d.requires_approval, maxBeneficiaries: d.max_beneficiaries, description: d.description,
    isActive: d.is_active, createdAt: d.created_at, effectiveSchoolYear: d.effective_school_year,
    applicableAcademicUnit: d.applicable_academic_unit, appliesTo: d.applies_to, discountBasis: d.discount_basis,
    discountFixedAmount: d.discount_fixed_amount, isStackable: d.is_stackable, requiresDocument: d.requires_document,
    maxAmount: d.max_amount, glCode: d.gl_code,
    schoolId: d.school_id, academicYearId: d.academic_year_id,
    siblingPosition: d.sibling_position, exclusiveGroup: d.exclusive_group,
    effectiveFrom: d.effective_from, effectiveTo: d.effective_to,
  }));
  const discountTypeById = new Map(discountTypeRows?.map((d: any) => [d.id, d]) ?? []);
  const { data: studentRowsForNames } = { data: studentRows } as any;
  const studentById = new Map((studentRows ?? []).map((s: any) => [s.id, s]));
  const { data: discountReqRows } = await supabase.from("discount_requests").select("*");
  const { data: discountAuditRows } = await supabase.from("discount_request_audit_trail").select("*");
  const discountRequests: DiscountRequest[] = (discountReqRows ?? []).map((d: any) => {
    const stu = studentById.get(d.student_id);
    const dt: any = discountTypeById.get(d.discount_type_id);
    return {
      id: d.id, referenceNo: d.reference_no, studentId: d.student_id,
      studentName: stu ? `${stu.first_name} ${stu.last_name}` : "", studentNo: stu?.student_no ?? "",
      discountTypeId: d.discount_type_id, discountTypeName: dt?.name ?? "", discountPercent: dt?.discount_percent ?? 0,
      requestedBy: d.requested_by, requestedAt: d.requested_at, status: d.status,
      siblingStudentIds: d.sibling_student_ids ?? [], siblingNames: d.sibling_names ?? [],
      level1Status: d.level1_status, level1ApprovedBy: d.level1_approved_by, level1ApprovedAt: d.level1_approved_at,
      level2Status: d.level2_status, level2ApprovedBy: d.level2_approved_by, level2ApprovedAt: d.level2_approved_at,
      remarks: d.remarks, attachmentNames: d.attachment_names ?? [],
      auditTrail: (discountAuditRows ?? []).filter((t: any) => t.discount_request_id === d.id).map((t: any) => ({
        id: t.id, action: t.action, performedBy: t.performed_by, performedAt: t.performed_at, details: t.details,
      })),
    };
  });

  // ---- Grades ----
  const { data: gradeRows } = await supabase.from("grades").select("*, subjects(code)");
  const grades: Grade[] = (gradeRows ?? []).map((g: any) => ({
    id: g.id, studentId: g.student_id, subjectCode: g.subjects?.code ?? "", teacherId: g.teacher_id,
    employeeId: g.employee_id, schoolYear: g.school_year, semester: g.semester,
    midtermGrade: g.midterm_grade, finalGrade: g.final_grade, remarks: g.remarks,
  }));

  // ---- Announcements / events ----
  const { data: annRows } = await supabase.from("announcements").select("*");
  const announcements: Announcement[] = (annRows ?? []).map((a: any) => ({
    id: a.id, title: a.title, content: a.content, date: a.date, category: a.category, author: a.author,
  }));
  const { data: eventRows } = await supabase.from("school_events").select("*");
  const events: SchoolEvent[] = (eventRows ?? []).map((e: any) => ({
    id: e.id, title: e.title, description: e.description, date: e.date, department: e.department,
  }));

  // ---- Payroll ----
  const { data: payrollRows } = await supabase.from("payroll").select("*");
  const payroll: PayrollRow[] = (payrollRows ?? []).map((p: any) => ({
    id: p.id, employeeId: p.employee_id, employeeName: p.employee_name, position: p.position,
    basicSalary: p.basic_salary, allowances: p.allowances, sssDeduction: p.sss_deduction,
    philhealthDeduction: p.philhealth_deduction, pagibigDeduction: p.pagibig_deduction, taxDeduction: p.tax_deduction,
    netPay: p.net_pay, period: p.period, status: p.status,
  }));

  // ---- Setup items (generic reference data) ----
  const { data: setupRows } = await supabase.from("setup_items").select("*").order("sort_order");
  const setupData: Record<string, SetupItem[]> = {};
  for (const s of setupRows ?? []) {
    const item: SetupItem = {
      id: s.id, code: s.code, name: s.name, description: s.description, isActive: s.is_active,
      createdAt: s.created_at, createdBy: s.created_by, sortOrder: s.sort_order, ...(s.metadata ?? {}),
    };
    (setupData[s.category] ??= []).push(item);
  }

  // ---- Learning materials ----
  const { data: lmRows } = await supabase.from("learning_materials").select("*, schools(code), subjects(code,name)");
  const learningMaterials: LearningMaterial[] = (lmRows ?? []).map((m: any) => {
    const owningEmployee = m.employee_id ? employeeById.get(m.employee_id) : undefined;
    const owningTeacher = m.teacher_id ? teacherById.get(m.teacher_id) : undefined;
    return {
      id: m.id, schoolId: m.schools?.code, title: m.title, description: m.description, subjectCode: m.subjects?.code ?? "",
      subjectName: m.subjects?.name ?? "", section: m.section, teacherId: m.teacher_id, employeeId: m.employee_id,
      teacherName: personName(owningEmployee) ?? personName(owningTeacher) ?? "",
      learningType: m.learning_type, fileUrl: m.file_url, fileName: m.file_name, fileSize: m.file_size,
      videoUrl: m.video_url, thumbnailUrl: m.thumbnail_url, publishStatus: m.publish_status, uploadDate: m.upload_date,
      department: m.department, yearLevel: m.year_level, trackOrCourse: m.track_or_course, tags: m.tags ?? [],
    };
  });

  // ---- Ledger / holds / billing / collections / promissory notes ----
  const { data: lsRows } = await supabase.from("student_ledger_summaries").select("*");
  const studentLedgerSummaries: StudentLedgerSummary[] = (lsRows ?? []).map((l: any) => ({
    studentId: l.student_id, schoolYear: l.school_year, totalAssessed: l.total_assessed, totalPaid: l.total_paid,
    discountApplied: l.discount_applied, balance: l.balance, financialHoldStatus: l.financial_hold_status,
    clearanceStatus: l.clearance_status, lastPaymentDate: l.last_payment_date,
  }));
  const { data: ltRows } = await supabase.from("ledger_transactions").select("*");
  const ledgerTransactions: LedgerTransaction[] = (ltRows ?? []).map((l: any) => ({
    id: l.id, studentId: l.student_id, date: l.date, description: l.description, type: l.type,
    debit: l.debit, credit: l.credit, balance: l.balance, reference: l.reference,
  }));
  const { data: fhRows } = await supabase.from("financial_holds").select("*");
  const financialHolds: FinancialHold[] = (fhRows ?? []).map((h: any) => {
    const stu = studentById.get(h.student_id);
    return {
      id: h.id, studentId: h.student_id, studentName: stu ? `${stu.first_name} ${stu.last_name}` : "",
      studentNo: stu?.student_no ?? "", holdType: h.hold_type, holdCategory: h.hold_category, reason: h.reason,
      balanceAmount: h.balance_amount, createdBy: h.created_by, createdAt: h.created_at, status: h.status,
      clearedBy: h.cleared_by, clearedAt: h.cleared_at, clearanceRemarks: h.clearance_remarks,
    };
  });
  const { data: absRows } = await supabase.from("assessment_billing_summaries").select("*");
  const assessmentBillingSummaries: AssessmentBillingSummary[] = (absRows ?? []).map((b: any) => {
    const stu = studentById.get(b.student_id);
    return {
      id: b.id, studentId: b.student_id, studentName: stu ? `${stu.first_name} ${stu.last_name}` : "",
      studentNo: stu?.student_no ?? "", schoolYear: b.school_year, semester: b.semester, academicUnit: b.academic_unit,
      feeTemplateName: b.fee_template_name, totalAssessment: b.total_assessment, amountDue: b.amount_due,
      balance: b.balance, status: b.status,
    };
  });
  const { data: pcsRows } = await supabase.from("payment_collection_summaries").select("*");
  const paymentCollectionSummaries: PaymentCollectionSummary[] = (pcsRows ?? []).map((p: any) => {
    const stu = studentById.get(p.student_id);
    return {
      id: p.id, studentId: p.student_id, studentName: stu ? `${stu.first_name} ${stu.last_name}` : "",
      amount: p.amount, paymentMethod: p.payment_method, referenceNo: p.reference_no, paymentDate: p.payment_date,
      cashier: p.cashier, term: p.term, verificationStatus: p.verification_status,
    };
  });
  const { data: pnRows } = await supabase.from("promissory_notes").select("*");
  const promissoryNotes = (pnRows ?? []).map((p: any) => ({ id: p.id, studentId: p.student_id, amount: p.amount, dueDate: p.due_date, status: p.status }));

  // ---- Grading: class loads, grade periods/categories/items, entries, demo students ----
  const { data: clRows } = await supabase.from("subject_class_loads").select("*, subjects(code,name), sections(name)");
  const { data: clStudentRows } = await supabase.from("class_load_students").select("*");
  const classLoads: SubjectClassLoad[] = (clRows ?? []).map((c: any) => ({
    id: c.id, teacherId: c.teacher_id, employeeId: c.employee_id, subjectCode: c.subjects?.code ?? "", subjectName: c.subjects?.name ?? "",
    sectionId: c.section_id, sectionName: c.sections?.name ?? "", department: c.department, schoolYear: c.school_year,
    semester: c.semester, studentIds: (clStudentRows ?? []).filter((cs: any) => cs.class_load_id === c.id).map((cs: any) => cs.student_id),
  }));

  const { data: gpRows } = await supabase.from("grade_periods").select("*, subjects(code)");
  const { data: gcRows } = await supabase.from("grade_categories").select("*");
  const { data: giRows } = await supabase.from("grade_items").select("*");
  const gradePeriods: GradePeriod[] = (gpRows ?? []).map((g: any) => ({
    id: g.id, label: g.label, subjectCode: g.subjects?.code ?? "", sectionId: g.section_id, schoolYear: g.school_year,
    teacherId: g.teacher_id, employeeId: g.employee_id, isFinalized: g.is_finalized, finalizedAt: g.finalized_at, finalizedBy: g.finalized_by,
    gradeApprovalStatus: g.grade_approval_status ?? undefined,
    submittedForApproval: g.submitted_for_approval ?? undefined,
    submittedAt: g.submitted_at ?? undefined,
    submittedBy: g.submitted_by ?? undefined,
    approvedBy: g.approved_by ?? undefined,
    approvedAt: g.approved_at ?? undefined,
    returnedBy: g.returned_by ?? undefined,
    returnedAt: g.returned_at ?? undefined,
    returnRemarks: g.return_remarks ?? undefined,
    categories: (gcRows ?? []).filter((c: any) => c.grade_period_id === g.id).map((c: any) => ({ name: c.name, weight: c.weight })),
    items: (giRows ?? []).filter((it: any) => it.grade_period_id === g.id).map((it: any) => ({
      id: it.id, label: it.label, category: it.category, maxScore: it.max_score, order: it.sort_order, dueDate: it.due_date,
    })),
  }));

  const { data: sgeRows } = await supabase.from("student_grade_entries").select("*");
  const studentGradeEntries: StudentGradeEntry[] = (sgeRows ?? []).map((e: any) => ({
    id: e.id, periodId: e.grade_period_id, studentId: e.student_id, gradeItemId: e.grade_item_id, score: e.score,
    employeeId: e.employee_id ?? undefined,
  }));

  const demoStudents: GradeRosterStudent[] = students
    .filter((s) => !s.email) // grading-demo students were seeded without contact info
    .map((s) => ({ id: s.id, studentNo: s.studentNo, firstName: s.firstName, lastName: s.lastName, section: s.section, yearLevel: s.yearLevel, trackOrCourse: s.trackOrCourse, department: s.department }));

  const { data: activityRows } = await supabase.from("activity_logs").select("*").order("occurred_at", { ascending: false });
  const activityLogs = (activityRows ?? []).map((a: any) => ({ id: a.id, action: a.action, subject: a.subject_label, type: a.activity_type, time: a.occurred_at }));

  // ---- Enrollment history (dashboard trend chart) ----
  const { data: ehsRows } = await supabase.from("enrollment_history_stats").select("*, schools(code)").order("school_year");
  const ehsMap = new Map<string, { year: string; stsn: number; cdsta: number }>();
  for (const r of (ehsRows ?? []) as any[]) {
    const entry = ehsMap.get(r.school_year) ?? { year: r.school_year, stsn: 0, cdsta: 0 };
    if (r.schools?.code === "STSN") entry.stsn = r.student_count;
    if (r.schools?.code === "CDSTA") entry.cdsta = r.student_count;
    ehsMap.set(r.school_year, entry);
  }
  const enrollmentHistoryStats = Array.from(ehsMap.values());

  // ---- Canonical student-fee and payment-term configuration ----
  const { data: academicYearRows } = await supabase.from("academic_years").select("*").order("start_date");
  const academicYears: AcademicYear[] = (academicYearRows ?? []).map((r: any) => ({
    id: r.id, code: r.code, name: r.name, startDate: r.start_date, endDate: r.end_date,
    status: r.status, isCurrent: r.is_current,
  }));
  const { data: levelRows } = await supabase.from("academic_year_levels").select("*").order("sort_order");
  const academicYearLevels: AcademicYearLevel[] = (levelRows ?? []).map((r: any) => ({
    id: r.id, code: r.code, name: r.name, academicUnit: r.academic_unit,
    sortOrder: r.sort_order, isActive: r.is_active,
  }));
  const { data: feeCategoryRows } = await supabase.from("student_fee_categories").select("*");
  const studentFeeCategories: StudentFeeCategory[] = (feeCategoryRows ?? []).map((r: any) => ({
    id: r.id, schoolId: r.school_id, code: r.code, name: r.name,
    postingCategory: r.posting_category, revenueAccountCode: r.revenue_account_code, isActive: r.is_active,
  }));
  const { data: feeItemRows } = await supabase.from("student_fee_items").select("*").order("sort_order");
  const studentFeeItems: StudentFeeItem[] = (feeItemRows ?? []).map((r: any) => ({
    id: r.id, schoolId: r.school_id, code: r.code, name: r.name, categoryId: r.category_id,
    billingBasis: r.billing_basis, isRequired: r.is_required,
    isDiscountable: r.is_discountable, isActive: r.is_active, sortOrder: r.sort_order,
  }));
  const { data: feeScheduleRows } = await supabase.from("student_fee_schedules").select("*").order("version", { ascending: false });
  const studentFeeSchedules: StudentFeeSchedule[] = (feeScheduleRows ?? []).map((r: any) => ({
    id: r.id, schoolId: r.school_id, academicYearId: r.academic_year_id,
    academicUnit: r.academic_unit, version: r.version, status: r.status,
    sourceReference: r.source_reference, sourceNotes: r.source_notes,
    publishedBy: r.published_by ?? undefined, publishedAt: r.published_at ?? undefined,
  }));
  const { data: feeRateRows } = await supabase.from("student_fee_schedule_rates").select("*");
  const studentFeeScheduleRates: StudentFeeScheduleRate[] = (feeRateRows ?? []).map((r: any) => ({
    id: r.id, scheduleId: r.schedule_id, feeItemId: r.fee_item_id,
    yearLevelId: r.year_level_id, courseId: r.course_id ?? undefined,
    amount: Number(r.amount), isRequired: r.is_required ?? undefined, note: r.note ?? undefined,
  }));
  const { data: termRows } = await supabase.from("student_payment_term_templates").select("*");
  const studentPaymentTermTemplates: StudentPaymentTermTemplate[] = (termRows ?? []).map((r: any) => ({
    id: r.id, schoolId: r.school_id, academicYear: r.academic_year, code: r.code,
    name: r.name, version: r.version, isActive: r.is_active, isDefault: r.is_default,
  }));
  const { data: termInstallmentRows } = await supabase.from("student_payment_term_template_installments").select("*").order("sequence_no");
  const studentPaymentTermTemplateInstallments: StudentPaymentTermTemplateInstallment[] = (termInstallmentRows ?? []).map((r: any) => ({
    id: r.id, templateId: r.template_id, sequenceNo: r.sequence_no, label: r.label,
    percentage: Number(r.percentage), dueDate: r.due_date,
  }));
  const { data: aidProgramRows } = await supabase.from("student_aid_programs").select("*");
  const studentAidPrograms: StudentAidProgram[] = (aidProgramRows ?? []).map((r: any) => ({
    id: r.id, schoolId: r.school_id, code: r.code, name: r.name, sponsorName: r.sponsor_name,
    benefitBasis: r.benefit_basis, benefitValue: Number(r.benefit_value),
    academicYearId: r.academic_year_id ?? undefined, isActive: r.is_active,
  }));
  const { data: aidAwardRows } = await supabase.from("student_aid_awards").select("*");
  const studentAidAwards: StudentAidAward[] = (aidAwardRows ?? []).map((r: any) => ({
    id: r.id, programId: r.program_id, studentId: r.student_id,
    enrollmentId: r.enrollment_id ?? undefined, approvedAmount: Number(r.approved_amount),
    status: r.status, referenceNo: r.reference_no ?? undefined,
  }));

  // Compatibility projections are derived from canonical rows only. Runtime no
  // longer reads the legacy fee/discount/payment-option tables.
  const tuitionFeeSchedule: LoadedData["tuitionFeeSchedule"] = [];
  const miscFeeSchedule: LoadedData["miscFeeSchedule"] = [];
  const labFeeAdjustments: LoadedData["labFeeAdjustments"] = [];
  const discountOptions = discountTypes.filter((d) => d.isActive).map((d) => ({
    id: d.id, label: d.name, percentage: Number(d.discountPercent),
  }));
  const paymentTermOptions = studentPaymentTermTemplates.filter((t) => t.isActive).map((t) => ({
    term: t.name, description: t.code,
  }));

  // ---- Student guardians ----
  const { data: guardianRows } = await supabase.from("student_guardians").select("*");
  const studentGuardians = (guardianRows ?? []).map((g: any) => ({
    id: g.id,
    studentId: g.student_id,
    guardianType: g.guardian_type,
    guardianName: g.guardian_name,
    relationship: g.relationship,
    contactNo: g.contact_no,
    email: g.email,
    address: g.address,
    occupation: g.occupation,
    isPrimary: g.is_primary,
    isEmergencyContact: g.is_emergency_contact,
    canReceivePortalNotifications: g.can_receive_portal_notifications,
  }));

  const { data: educationRows } = await supabase
    .from("student_education_backgrounds")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  const studentEducationBackgrounds = (educationRows ?? []).map((row: any) => ({
    id: row.id,
    studentId: row.student_id,
    educationLevel: row.education_level,
    schoolName: row.school_name,
    schoolAddress: row.school_address,
    yearAttended: row.year_attended,
    yearGraduated: row.year_graduated,
    degreeOrStrandOrCourse: row.degree_or_strand_or_course,
    honorsOrAwards: row.honors_or_awards,
    lastGradeLevelCompleted: row.last_grade_level_completed,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  const { data: employeeProfileContactRows } = await supabase
    .from("employee_profile_contacts")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  const employeeProfileContacts = (employeeProfileContactRows ?? []).map((row: any) => ({
    id: row.id,
    employeeId: row.employee_id,
    contactType: row.contact_type,
    fullName: row.full_name,
    relationship: row.relationship,
    contactNo: row.contact_no,
    email: row.email,
    address: row.address,
    occupation: row.occupation,
    isPrimaryContact: row.is_primary_contact,
    isEmergencyContact: row.is_emergency_contact,
    canReceiveNotifications: row.can_receive_notifications,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  const { data: employeeEducationRows } = await supabase
    .from("employee_education_backgrounds")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  const employeeEducationBackgrounds = (employeeEducationRows ?? []).map((row: any) => ({
    id: row.id,
    employeeId: row.employee_id,
    educationLevel: row.education_level,
    schoolName: row.school_name,
    schoolAddress: row.school_address,
    yearAttended: row.year_attended,
    yearGraduated: row.year_graduated,
    degreeOrCourse: row.degree_or_course,
    majorOrSpecialization: row.major_or_specialization,
    honorsOrAwards: row.honors_or_awards,
    prcEducationNote: row.prc_education_note,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  const { data: employeeLicenseRows } = await supabase
    .from("employee_license_certifications")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  const employeeLicenseCertifications = (employeeLicenseRows ?? []).map((row: any) => ({
    id: row.id,
    employeeId: row.employee_id,
    title: row.title,
    licenseNumber: row.license_number,
    issuingAuthority: row.issuing_authority,
    issuedAt: row.issued_at,
    expiresAt: row.expires_at,
    status: row.status,
    notes: row.notes,
    isPrimary: row.is_primary,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  const { data: employeeDocumentRows } = await supabase
    .from("employee_documents")
    .select("*")
    .order("created_at", { ascending: false });
  const employeeDocuments = (employeeDocumentRows ?? []).map((row: any) => ({
    id: row.id,
    employeeId: row.employee_id,
    documentName: row.document_name,
    documentType: row.document_type,
    status: row.status,
    fileUrl: row.file_url,
    remarks: row.remarks,
    submittedAt: row.submitted_at,
    verifiedBy: row.verified_by,
    verifiedAt: row.verified_at,
    createdAt: row.created_at,
  }));

  // ---- HR Phase 2: Employee Lifecycle Events ----
  const { data: lifecycleRows } = await supabase.from("employee_lifecycle_events").select("*").order("effective_date", { ascending: false });
  const employeeLifecycleEvents: EmployeeLifecycleEvent[] = (lifecycleRows ?? []).map((r: any) => ({
    id: r.id, employeeId: r.employee_id, eventType: r.event_type, fromStatus: r.from_status,
    toStatus: r.to_status, effectiveDate: r.effective_date, remarks: r.remarks,
    createdBy: r.created_by, createdAt: r.created_at,
  }));

  // ---- HR Phase 3: Shift Templates ----
  const { data: shiftTemplateRows } = await supabase.from("shift_templates").select("*, schools(code)").order("code");
  const shiftTemplates: ShiftTemplate[] = (shiftTemplateRows ?? []).map((r: any) => ({
    id: r.id, schoolId: r.schools?.code, code: r.code, name: r.name, startTime: r.start_time,
    endTime: r.end_time, breakMinutes: r.break_minutes, isOvernight: r.is_overnight,
    isActive: r.is_active, createdAt: r.created_at,
  }));

  // ---- HR Phase 3: Employee Shift Assignments ----
  const { data: shiftAssignRows } = await supabase.from("employee_shift_assignments").select("*").order("effective_from", { ascending: false });
  const employeeShiftAssignments: EmployeeShiftAssignment[] = (shiftAssignRows ?? []).map((r: any) => ({
    id: r.id, employeeId: r.employee_id, shiftTemplateId: r.shift_template_id,
    effectiveFrom: r.effective_from, effectiveTo: r.effective_to, restDays: r.rest_days ?? [],
    createdAt: r.created_at,
  }));

  // ---- HR Phase 3: Employee Time Logs ----
  const { data: timeLogRows } = await supabase.from("employee_time_logs").select("*").order("log_date", { ascending: false });
  const employeeTimeLogs: EmployeeTimeLog[] = (timeLogRows ?? []).map((r: any) => ({
    id: r.id, employeeId: r.employee_id, logDate: r.log_date, timeIn: r.time_in, timeOut: r.time_out,
    source: r.source, isApproved: r.is_approved, approvedBy: r.approved_by, approvedAt: r.approved_at,
    remarks: r.remarks, createdAt: r.created_at,
  }));

  // ---- HR Phase 3: Employee Attendance ----
  const { data: attendanceRows } = await supabase.from("employee_attendance").select("*").order("attendance_date", { ascending: false });
  const employeeAttendance: EmployeeAttendance[] = (attendanceRows ?? []).map((r: any) => ({
    id: r.id, employeeId: r.employee_id, attendanceDate: r.attendance_date, timeIn: r.time_in,
    timeOut: r.time_out, status: r.status, lateMinutes: r.late_minutes, undertimeMinutes: r.undertime_minutes,
    overtimeMinutes: r.overtime_minutes, remarks: r.remarks, createdAt: r.created_at,
  }));

  // ---- HR Phase 3: Leave Types ----
  const { data: leaveTypeRows } = await supabase.from("leave_types").select("*").order("code");
  const leaveTypes: LeaveType[] = (leaveTypeRows ?? []).map((r: any) => ({
    id: r.id, code: r.code, name: r.name, isPaid: r.is_paid, defaultCredits: r.default_credits,
    maxDaysPerRequest: r.max_days_per_request, requiresApproval: r.requires_approval,
    isActive: r.is_active, createdAt: r.created_at,
  }));

  // ---- HR Phase 3: Leave Requests ----
  const { data: leaveRequestRows } = await supabase.from("leave_requests").select("*").order("created_at", { ascending: false });
  const leaveRequests: LeaveRequest[] = (leaveRequestRows ?? []).map((r: any) => ({
    id: r.id, employeeId: r.employee_id, leaveTypeId: r.leave_type_id, startDate: r.start_date,
    endDate: r.end_date, totalDays: r.total_days, reason: r.reason, status: r.status,
    approvedBy: r.approved_by, approvedAt: r.approved_at, remarks: r.remarks, createdAt: r.created_at,
  }));

  // ---- HR Phase 4: Payroll Periods ----
  const { data: payrollPeriodRows } = await supabase.from("payroll_periods").select("*, schools(code)").order("start_date", { ascending: false });
  const payrollPeriods: PayrollPeriod[] = (payrollPeriodRows ?? []).map((r: any) => ({
    id: r.id, schoolId: r.schools?.code, periodCode: r.period_code, label: r.label,
    startDate: r.start_date, endDate: r.end_date, payoutDate: r.payout_date,
    status: r.status, createdAt: r.created_at,
  }));

  // ---- HR Phase 4: Payroll Runs ----
  const { data: payrollRunRows } = await supabase.from("payroll_runs").select("*, schools(code)").order("created_at", { ascending: false });
  const payrollRuns: PayrollRun[] = (payrollRunRows ?? []).map((r: any) => ({
    id: r.id, schoolId: r.schools?.code, payrollPeriodId: r.payroll_period_id, runNo: r.run_no,
    status: r.status, computedBy: r.computed_by, approvedBy: r.approved_by, computedAt: r.computed_at,
    approvedAt: r.approved_at, notes: r.notes, createdAt: r.created_at,
  }));

  // ---- HR Phase 4: Payroll Lines ----
  const { data: payrollLineRows } = await supabase.from("payroll_lines").select("*");
  const payrollLines: PayrollLine[] = (payrollLineRows ?? []).map((r: any) => ({
    id: r.id, payrollRunId: r.payroll_run_id, employeeId: r.employee_id,
    basicPay: r.basic_pay, allowances: r.allowances, overtimePay: r.overtime_pay,
    lateDeduction: r.late_deduction, undertimeDeduction: r.undertime_deduction, absenceDeduction: r.absence_deduction,
    sssDeduction: r.sss_deduction, philhealthDeduction: r.philhealth_deduction, pagibigDeduction: r.pagibig_deduction,
    withholdingTax: r.withholding_tax, otherDeductions: r.other_deductions, otherAllowances: r.other_allowances,
    grossPay: r.gross_pay, netPay: r.net_pay, status: r.status, createdAt: r.created_at,
  }));

  // ---- HR Phase 4: Salary Payout Batches ----
  const { data: payoutBatchRows } = await supabase.from("salary_payout_batches").select("*").order("created_at", { ascending: false });
  const salaryPayoutBatches: SalaryPayoutBatch[] = (payoutBatchRows ?? []).map((r: any) => ({
    id: r.id, payrollRunId: r.payroll_run_id, payoutNo: r.payout_no, payoutMethod: r.payout_method,
    status: r.status, releasedBy: r.released_by, releasedAt: r.released_at, notes: r.notes, createdAt: r.created_at,
  }));

  // ---- HR Phase 4: Salary Payout Lines ----
  const { data: payoutLineRows } = await supabase.from("salary_payout_lines").select("*");
  const salaryPayoutLines: SalaryPayoutLine[] = (payoutLineRows ?? []).map((r: any) => ({
    id: r.id, payoutBatchId: r.payout_batch_id, payrollLineId: r.payroll_line_id, employeeId: r.employee_id,
    amount: r.amount, referenceNo: r.reference_no, status: r.status, releasedAt: r.released_at, createdAt: r.created_at,
  }));

  // ---- HR Phase 4: Benefit Plans ----
  const { data: benefitPlanRows } = await supabase.from("benefit_plans").select("*").order("category");
  const benefitPlans: BenefitPlan[] = (benefitPlanRows ?? []).map((r: any) => ({
    id: r.id, code: r.code, name: r.name, category: r.category,
    employeeShareType: r.employee_share_type, employeeShareValue: r.employee_share_value,
    employerShareType: r.employer_share_type, employerShareValue: r.employer_share_value,
    isTaxable: r.is_taxable, isActive: r.is_active, createdAt: r.created_at,
  }));

  // ---- HR Phase 4: Statutory Contribution Rules ----
  const { data: statutoryRuleRows } = await supabase
    .from("statutory_contribution_rules")
    .select("*")
    .order("effective_year", { ascending: false })
    .order("min_salary", { ascending: true });
  const statutoryContributionRules: StatutoryContributionRule[] = (statutoryRuleRows ?? []).map((r: any) => ({
    id: r.id, benefitPlanId: r.benefit_plan_id, effectiveYear: r.effective_year,
    minSalary: r.min_salary, maxSalary: r.max_salary, employeeRate: r.employee_rate,
    employerRate: r.employer_rate, employeeFixed: r.employee_fixed,
    employerFixed: r.employer_fixed, notes: r.notes, createdAt: r.created_at,
  }));

  // ---- HR Phase 4: Tax Tables + Brackets ----
  const { data: taxTableRows } = await supabase.from("tax_tables").select("*").order("effective_year", { ascending: false });
  const { data: taxBracketRows } = await supabase.from("tax_brackets").select("*").order("income_from");
  const taxBrackets: TaxBracket[] = (taxBracketRows ?? []).map((r: any) => ({
    id: r.id, taxTableId: r.tax_table_id, incomeFrom: r.income_from, incomeTo: r.income_to,
    baseTax: r.base_tax, rateAbove: r.rate_above, createdAt: r.created_at,
  }));
  const taxTables: TaxTable[] = (taxTableRows ?? []).map((r: any) => ({
    id: r.id, effectiveYear: r.effective_year, name: r.name, frequency: r.frequency,
    isActive: r.is_active, createdAt: r.created_at,
    brackets: taxBrackets.filter((b) => b.taxTableId === r.id),
  }));

  // ---- HR Phase 5: Job Requisitions ----
  const { data: jobReqRows } = await supabase.from("job_requisitions").select("*, schools(code)").order("created_at", { ascending: false });
  const jobRequisitions: JobRequisition[] = (jobReqRows ?? []).map((r: any) => ({
    id: r.id, schoolId: r.schools?.code, requisitionNo: r.requisition_no, positionTitle: r.position_title,
    department: r.department, employmentType: r.employment_type, headCount: r.head_count,
    reason: r.reason, targetStartDate: r.target_start_date, status: r.status,
    requestedBy: r.requested_by, approvedBy: r.approved_by, approvedAt: r.approved_at, createdAt: r.created_at,
  }));

  // ---- HR Phase 5: Job Applicants ----
  const { data: jobApplicantRows } = await supabase.from("job_applicants").select("*").order("created_at", { ascending: false });
  const jobApplicants: JobApplicant[] = (jobApplicantRows ?? []).map((r: any) => ({
    id: r.id, jobRequisitionId: r.job_requisition_id, firstName: r.first_name, lastName: r.last_name,
    middleName: r.middle_name, email: r.email, contact: r.contact, address: r.address,
    resumeUrl: r.resume_url, appliedAt: r.applied_at, status: r.status,
    hiredEmployeeId: r.hired_employee_id, notes: r.notes, createdAt: r.created_at,
  }));

  // ---- HR Phase 5: Applicant Interviews ----
  const { data: interviewRows } = await supabase.from("applicant_interviews").select("*").order("scheduled_at", { ascending: false });
  const applicantInterviews: ApplicantInterview[] = (interviewRows ?? []).map((r: any) => ({
    id: r.id, applicantId: r.applicant_id, scheduledAt: r.scheduled_at, interviewType: r.interview_type,
    interviewer: r.interviewer, result: r.result, remarks: r.remarks, createdAt: r.created_at,
  }));

  // ---- HR Phase 5: Onboarding Templates ----
  const { data: onboardingTemplateRows } = await supabase.from("onboarding_templates").select("*").order("name");
  const onboardingTemplates: OnboardingTemplate[] = (onboardingTemplateRows ?? []).map((r: any) => ({
    id: r.id, name: r.name, description: r.description, isActive: r.is_active, createdAt: r.created_at,
  }));

  // ---- HR Phase 5: Onboarding Tasks ----
  const { data: onboardingTaskRows } = await supabase.from("onboarding_tasks").select("*").order("sort_order");
  const onboardingTasks: OnboardingTask[] = (onboardingTaskRows ?? []).map((r: any) => ({
    id: r.id, templateId: r.template_id, taskName: r.task_name, description: r.description,
    responsibleParty: r.responsible_party, dueDayOffset: r.due_day_offset,
    isRequired: r.is_required, sortOrder: r.sort_order, createdAt: r.created_at,
  }));

  // ---- HR Phase 5: Employee Onboarding Tasks ----
  const { data: empOnboardingRows } = await supabase.from("employee_onboarding_tasks").select("*");
  const employeeOnboardingTasks: EmployeeOnboardingTask[] = (empOnboardingRows ?? []).map((r: any) => ({
    id: r.id, employeeId: r.employee_id, onboardingTaskId: r.onboarding_task_id, dueDate: r.due_date,
    status: r.status, completedAt: r.completed_at, completedBy: r.completed_by, notes: r.notes, createdAt: r.created_at,
  }));

  const { data: financeControl } = await supabase
    .from("system_runtime_controls")
    .select("enabled")
    .eq("control_key", "student_finance_writes")
    .maybeSingle();
  const financeWritesEnabled = financeControl?.enabled === true;
  const { data: feeEngineControl } = await supabase
    .from("system_runtime_controls")
    .select("enabled")
    .eq("control_key", "student_fee_schedule_engine_enabled")
    .maybeSingle();
  const studentFeeEngineEnabled = feeEngineControl?.enabled === true;

  return {
    financeWritesEnabled, studentFeeEngineEnabled,
    schools, users, students, teachers, employees, courses, subjects, curriculums, requirements, enrollments, onlineEnrollmentApplications,
    assessments, payments, studentInvoices, invoiceLines, paymentPlans, paymentPlanInstallments,
    studentReceipts, receiptAllocations, directCollectionLines, unappliedCredits,
    allocationReallocationRequests, grades, schedules, announcements, events, payroll, setupData, discountTypes,
    discountRequests, voidRequests, cashVouchers, classSchedules, learningMaterials, sections, rooms, studentLedgerSummaries, ledgerTransactions,
    financialHolds, assessmentBillingSummaries, paymentCollectionSummaries, promissoryNotes, bookPackages,
    classLoads, gradePeriods, studentGradeEntries, demoStudents, activityLogs,
    enrollmentHistoryStats, tuitionFeeSchedule, miscFeeSchedule, labFeeAdjustments, discountOptions, paymentTermOptions,
    academicYears, academicYearLevels, studentFeeCategories, studentFeeItems, studentFeeSchedules,
    studentFeeScheduleRates, studentPaymentTermTemplates, studentPaymentTermTemplateInstallments,
    studentAidPrograms, studentAidAwards,
    studentGuardians, studentEducationBackgrounds,
    employeeProfileContacts, employeeEducationBackgrounds, employeeLicenseCertifications, employeeDocuments,
    employeeLifecycleEvents, shiftTemplates, employeeShiftAssignments, employeeTimeLogs, employeeAttendance,
    leaveTypes, leaveRequests, payrollPeriods, payrollRuns, payrollLines,
    salaryPayoutBatches, salaryPayoutLines, benefitPlans, statutoryContributionRules, taxTables, taxBrackets,
    jobRequisitions, jobApplicants, applicantInterviews, onboardingTemplates, onboardingTasks, employeeOnboardingTasks,
  };
}

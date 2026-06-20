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
} from "../types";
import type { GradePeriod, StudentGradeEntry, SubjectClassLoad, GradeRosterStudent } from "../types/grading";

const teacherName = (t: any) => (t ? `${t.first_name} ${t.last_name}` : undefined);

export interface LoadedData {
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
  studentGuardians: { id: string; studentId: string; guardianName: string; relationship?: string; contactNo?: string; email?: string; address?: string; isPrimary: boolean }[];
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
    id: u.id, schoolId: u.schools?.code, email: u.email, name: u.name, role: u.role,
    isActive: u.is_active, avatarUrl: u.avatar_url, department: u.department,
  }));

  // ---- Teachers ----
  const { data: teacherRows } = await supabase.from("teachers").select("*, schools(code)");
  const teachers: Teacher[] = (teacherRows ?? []).map((t: any) => ({
    id: t.id, schoolId: t.schools?.code, userId: t.user_id, firstName: t.first_name, lastName: t.last_name,
    middleName: t.middle_name, department: t.department, email: t.email, phone: t.phone,
    specialization: t.specialization, advisorySection: t.advisory_section, isActive: t.is_active,
  }));
  const teacherById = new Map(teachers.map((t) => [t.id, t]));

  // ---- Students ----
  const { data: studentRows } = await supabase.from("students").select("*, schools(code)");
  const students: Student[] = (studentRows ?? []).map((s: any) => ({
    id: s.id, schoolId: s.schools?.code, studentNo: s.student_no, firstName: s.first_name, lastName: s.last_name,
    middleName: s.middle_name, gender: s.gender, civilStatus: s.civil_status, religion: s.religion,
    nationality: s.nationality, birthday: s.birthday, birthplace: s.birthplace, email: s.email,
    contactNo: s.contact_no, address: s.address, province: s.province, municipality: s.municipality,
    zipCode: s.zip_code, userId: s.user_id, department: s.department, yearLevel: s.year_level,
    trackOrCourse: s.track_or_course, section: s.section, enrollmentStatus: s.enrollment_status,
  }));

  // ---- Employees ----
  const { data: employeeRows } = await supabase.from("employees").select("*, schools(code)");
  const employees: Employee[] = (employeeRows ?? []).map((e: any) => ({
    id: e.id, schoolId: e.schools?.code, firstName: e.first_name, lastName: e.last_name, middleName: e.middle_name,
    email: e.email, position: e.position, positionTitle: e.position_title, department: e.department,
    salary: e.salary, status: e.status, leaveBalance: e.leave_balance, contact: e.contact,
    address: e.address, emergencyContact: e.emergency_contact,
  }));

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
  const { data: sectionRows } = await supabase.from("sections").select("*, schools(code), teachers(first_name,last_name)");
  const { data: sectionStudentRows } = await supabase.from("section_students").select("*");
  const sections: SchoolSection[] = (sectionRows ?? []).map((s: any) => ({
    id: s.id, schoolId: s.schools?.code, code: s.code, name: s.name, department: s.department,
    yearLevel: s.year_level, strandOrTrack: s.strand_or_track, adviserId: s.adviser_id,
    adviserName: teacherName(s.teachers), capacity: s.capacity, currentCount: s.current_count,
    academicYear: s.academic_year, semester: s.semester, isActive: s.is_active, createdAt: s.created_at,
    enrolledStudentIds: (sectionStudentRows ?? []).filter((ss: any) => ss.section_id === s.id).map((ss: any) => ss.student_id),
  }));

  // ---- Rooms ----
  const { data: roomRows } = await supabase.from("rooms").select("*, schools(code)");
  const rooms: Room[] = (roomRows ?? []).map((r: any) => ({
    id: r.id, schoolId: r.schools?.code, code: r.code, name: r.name, building: r.building, floor: r.floor,
    capacity: r.capacity, type: r.type, isActive: r.is_active, status: r.status,
  }));

  // ---- Class schedules ----
  const { data: classSchedRows } = await supabase.from("class_schedules").select("*, subjects(code,name), teachers(first_name,last_name)");
  const classSchedules: ClassSchedule[] = (classSchedRows ?? []).map((c: any) => ({
    id: c.id, subjectCode: c.subjects?.code ?? "", subjectName: c.subjects?.name ?? "", teacherId: c.teacher_id,
    teacherName: teacherName(c.teachers) ?? "", section: c.section, roomName: c.room_name, day: c.day,
    startTime: c.start_time, endTime: c.end_time, schoolYear: c.school_year, semester: c.semester,
    isActive: c.is_active, department: c.department, yearLevel: c.year_level, courseOrTrack: c.course_or_track, notes: c.notes,
  }));

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
    remarks: r.remarks, uploadStatus: r.upload_status, uploadFileName: r.upload_file_name, uploadDate: r.upload_date,
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
  const { data: assessmentFeeRows } = await supabase.from("assessment_fees").select("*");
  const { data: assessmentAuditRows } = await supabase.from("assessment_audit_trail").select("*");
  const assessments: StudentAssessment[] = (assessmentRows ?? []).map((a: any) => ({
    id: a.id, schoolId: a.schools?.code, studentId: a.student_id, schoolYear: a.school_year, semester: a.semester,
    fees: (assessmentFeeRows ?? []).filter((f: any) => f.assessment_id === a.id).map((f: any) => ({ feeName: f.fee_name, category: f.category, amount: f.amount })),
    totalAmount: a.total_amount, discountPercentage: a.discount_percentage, discountAmount: a.discount_amount,
    scholarshipName: a.scholarship_name, paymentTerm: a.payment_term, balance: a.balance, isPaid: a.is_paid,
    financialHoldStatus: a.financial_hold_status, lastPaymentDate: a.last_payment_date, booksAvailed: a.books_availed,
    bookPackageId: a.book_package_id, approvalStatus: a.approval_status, submittedBy: a.submitted_by,
    submittedDate: a.submitted_date, registrarRemarks: a.registrar_remarks, accountingRemarks: a.accounting_remarks,
    approvedBy: a.approved_by, approvedDate: a.approved_date,
    auditTrail: (assessmentAuditRows ?? []).filter((t: any) => t.assessment_id === a.id).map((t: any) => ({
      id: t.id, action: t.action, performedBy: t.performed_by, performedAt: t.performed_at, details: t.details,
    })),
  }));

  // ---- Enrollments + enrollment_subjects ----
  const { data: enrollmentRows } = await supabase.from("enrollments").select("*");
  const { data: enrollSubjRows } = await supabase.from("enrollment_subjects").select("*, subjects(code)");
  const enrollments: Enrollment[] = (enrollmentRows ?? []).map((e: any) => ({
    id: e.id, studentId: e.student_id, schoolYear: e.school_year, semester: e.semester, enrollmentType: e.enrollment_type,
    status: e.status, submittedAt: e.submitted_at, assessmentId: e.assessment_id,
    subjectCodes: (enrollSubjRows ?? []).filter((es: any) => es.enrollment_id === e.id).map((es: any) => es.subjects?.code).filter(Boolean),
  }));

  // ---- Payments ----
  const { data: paymentRows } = await supabase.from("payments").select("*, schools(code)");
  const payments: Payment[] = (paymentRows ?? []).map((p: any) => ({
    id: p.id, schoolId: p.schools?.code, studentId: p.student_id, amount: p.amount, paymentDate: p.payment_date,
    paymentMethod: p.payment_method, orNumber: p.or_number, term: p.term, remarks: p.remarks,
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
    schoolYear: g.school_year, semester: g.semester, midtermGrade: g.midterm_grade, finalGrade: g.final_grade, remarks: g.remarks,
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
  const { data: lmRows } = await supabase.from("learning_materials").select("*, schools(code), subjects(code,name), teachers(first_name,last_name)");
  const learningMaterials: LearningMaterial[] = (lmRows ?? []).map((m: any) => ({
    id: m.id, schoolId: m.schools?.code, title: m.title, description: m.description, subjectCode: m.subjects?.code ?? "",
    subjectName: m.subjects?.name ?? "", section: m.section, teacherId: m.teacher_id, teacherName: teacherName(m.teachers) ?? "",
    learningType: m.learning_type, fileUrl: m.file_url, fileName: m.file_name, fileSize: m.file_size,
    videoUrl: m.video_url, thumbnailUrl: m.thumbnail_url, publishStatus: m.publish_status, uploadDate: m.upload_date,
    department: m.department, yearLevel: m.year_level, trackOrCourse: m.track_or_course, tags: m.tags ?? [],
  }));

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
    id: c.id, teacherId: c.teacher_id, subjectCode: c.subjects?.code ?? "", subjectName: c.subjects?.name ?? "",
    sectionId: c.section_id, sectionName: c.sections?.name ?? "", department: c.department, schoolYear: c.school_year,
    semester: c.semester, studentIds: (clStudentRows ?? []).filter((cs: any) => cs.class_load_id === c.id).map((cs: any) => cs.student_id),
  }));

  const { data: gpRows } = await supabase.from("grade_periods").select("*, subjects(code)");
  const { data: gcRows } = await supabase.from("grade_categories").select("*");
  const { data: giRows } = await supabase.from("grade_items").select("*");
  const gradePeriods: GradePeriod[] = (gpRows ?? []).map((g: any) => ({
    id: g.id, label: g.label, subjectCode: g.subjects?.code ?? "", sectionId: g.section_id, schoolYear: g.school_year,
    teacherId: g.teacher_id, isFinalized: g.is_finalized, finalizedAt: g.finalized_at, finalizedBy: g.finalized_by,
    categories: (gcRows ?? []).filter((c: any) => c.grade_period_id === g.id).map((c: any) => ({ name: c.name, weight: c.weight })),
    items: (giRows ?? []).filter((it: any) => it.grade_period_id === g.id).map((it: any) => ({
      id: it.id, label: it.label, category: it.category, maxScore: it.max_score, order: it.sort_order, dueDate: it.due_date,
    })),
  }));

  const { data: sgeRows } = await supabase.from("student_grade_entries").select("*");
  const studentGradeEntries: StudentGradeEntry[] = (sgeRows ?? []).map((e: any) => ({
    id: e.id, periodId: e.grade_period_id, studentId: e.student_id, gradeItemId: e.grade_item_id, score: e.score,
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

  // ---- Assessment fee-calculation engine data (replaces mockAssessmentService constants) ----
  const { data: tfsRows } = await supabase.from("tuition_fee_schedule").select("*").order("sort_order");
  const tuitionFeeSchedule = (tfsRows ?? []).map((t: any) => ({ yearLevel: t.year_level, tuition: t.tuition, lab: t.lab_fee, computer: t.computer_fee, label: t.label }));

  const { data: mfsRows } = await supabase.from("misc_fee_schedule").select("*").order("sort_order");
  const miscFeeSchedule = (mfsRows ?? []).map((m: any) => ({ feeName: m.fee_name, category: "Miscellaneous" as const, amount: m.amount, isRequired: m.is_required, note: m.note }));

  const { data: lfaRows } = await supabase.from("lab_fee_adjustments").select("*");
  const labFeeAdjustments = (lfaRows ?? []).map((l: any) => ({ scope: l.scope, programCode: l.program_code, amount: l.amount }));

  const { data: adoRows } = await supabase.from("assessment_discount_options").select("*").order("sort_order");
  const discountOptions = (adoRows ?? []).map((d: any) => ({ id: d.code, label: d.label, percentage: d.percentage, badge: d.badge }));

  const { data: aptoRows } = await supabase.from("assessment_payment_term_options").select("*").order("sort_order");
  const paymentTermOptions = (aptoRows ?? []).map((p: any) => ({ term: p.term, description: p.description }));

  // ---- Student guardians ----
  const { data: guardianRows } = await supabase.from("student_guardians").select("*");
  const studentGuardians = (guardianRows ?? []).map((g: any) => ({
    id: g.id, studentId: g.student_id, guardianName: g.guardian_name, relationship: g.relationship,
    contactNo: g.contact_no, email: g.email, address: g.address, isPrimary: g.is_primary,
  }));

  return {
    schools, users, students, teachers, employees, courses, subjects, curriculums, requirements, enrollments,
    assessments, payments, grades, schedules, announcements, events, payroll, setupData, discountTypes,
    discountRequests, classSchedules, learningMaterials, sections, rooms, studentLedgerSummaries, ledgerTransactions,
    financialHolds, assessmentBillingSummaries, paymentCollectionSummaries, promissoryNotes, bookPackages,
    classLoads, gradePeriods, studentGradeEntries, demoStudents, activityLogs,
    enrollmentHistoryStats, tuitionFeeSchedule, miscFeeSchedule, labFeeAdjustments, discountOptions, paymentTermOptions, studentGuardians,
  };
}

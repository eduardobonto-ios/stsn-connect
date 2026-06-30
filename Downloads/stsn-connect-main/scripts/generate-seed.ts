/**
 * Generates supabase/migrations/0003_data.sql from the REAL mock-data source
 * files (not hand-transcribed), so every row in the database is guaranteed
 * to match what the UI currently renders. Run with: npx tsx scripts/generate-seed.ts
 */
import { writeFileSync } from "fs";
import {
  MOCK_USERS, MOCK_STUDENTS, MOCK_TEACHERS, MOCK_EMPLOYEES, MOCK_COURSES, MOCK_SUBJECTS,
  MOCK_CURRICULUMS, MOCK_REQUIREMENTS, MOCK_ENROLLMENTS, MOCK_ASSESSMENTS, MOCK_PAYMENTS,
  MOCK_GRADES, MOCK_SCHEDULES, MOCK_ANNOUNCEMENTS, MOCK_EVENTS, STARTING_PAYROLL,
  MOCK_SETUP_DATA, MOCK_DISCOUNT_TYPES, MOCK_DISCOUNT_REQUESTS, MOCK_CLASS_SCHEDULES,
  MOCK_LEARNING_MATERIALS, MOCK_SECTIONS, MOCK_ROOMS, MOCK_STUDENT_LEDGER_SUMMARIES,
  MOCK_LEDGER_TRANSACTIONS, MOCK_FINANCIAL_HOLDS, MOCK_ASSESSMENT_BILLING_SUMMARIES,
  MOCK_PAYMENT_COLLECTION_SUMMARIES, MOCK_BOOK_PACKAGES,
} from "../src/mock-data/index";
import {
  MOCK_DEMO_STUDENTS, MOCK_CLASS_LOADS, MOCK_GRADE_PERIODS, MOCK_STUDENT_GRADE_ENTRIES,
} from "../src/mock-data/gradingMockData";
import { SCHOOL_CONTEXTS } from "../src/config/schools.config";

// ---- inline page-local mock data (not exported as modules) ----
const MOCK_PROMISSORY_NOTES = [
  { id: "pn-1", studentId: "stud-enrico", amount: 7240, dueDate: "2026-06-30", status: "Active" },
  { id: "pn-2", studentId: "stud-juan", amount: 5100, dueDate: "2026-06-10", status: "Overdue" },
];
const RECENT_TEACHER_ACTIVITIES = [
  { id: "act-1", action: "Released Course Syllabus & Reading Checklist", subject: "SHS Gen Math • STEM Grade 11", type: "syllabus" },
  { id: "act-2", action: "Midterm grades finalized & locked", subject: "Senior High Applied Calculus • St. Thomas Section", type: "grade" },
  { id: "act-3", action: "Secured clearance for classroom attendance books", subject: "Office of the Senior Academic Registrar Desk", type: "clearance" },
  { id: "act-4", action: "Advisory Class Meeting Minutes recorded", subject: "St. Thomas Advisory Council", type: "advisory" },
];
const ENROLLMENT_TREND = [
  { year: "2023-2024", stsn: 280, cdsta: 140 },
  { year: "2024-2025", stsn: 320, cdsta: 192 },
  { year: "2025-2026", stsn: 410, cdsta: 270 },
  { year: "2026-2027", stsn: 520, cdsta: 320 },
];

// ---- SQL literal helpers ----
const esc = (v: unknown): string => {
  if (v === null || v === undefined) return "NULL";
  return `'${String(v).replace(/'/g, "''")}'`;
};
const num = (v: unknown): string => (v === null || v === undefined || v === "" ? "NULL" : String(Number(v)));
const bool = (v: unknown): string => (v === null || v === undefined ? "NULL" : v ? "true" : "false");
const dateVal = (v: unknown): string => (v ? esc(String(v).slice(0, 10)) : "NULL");
const tsVal = (v: unknown): string => (v ? esc(String(v)) : "NULL");
const textArr = (arr?: string[] | null): string => {
  if (!arr || arr.length === 0) return "'{}'";
  return `ARRAY[${arr.map((s) => esc(s)).join(",")}]::text[]`;
};
const jsonb = (obj: unknown): string => `'${JSON.stringify(obj ?? {}).replace(/'/g, "''")}'::jsonb`;
const fk = (table: string, legacyId?: string | null): string =>
  legacyId ? `(select id from public.${table} where legacy_id = ${esc(legacyId)})` : "NULL";

let out = "";
const section = (title: string) => {
  out += `\n-- ============================================================================\n-- ${title}\n-- ============================================================================\n`;
};
const insert = (table: string, columns: string[], rows: string[][]) => {
  if (rows.length === 0) return;
  out += `insert into public.${table} (${columns.join(", ")}) values\n`;
  out += rows.map((r) => `  (${r.join(", ")})`).join(",\n");
  out += `\non conflict do nothing;\n`;
};

// ---- 1. schools ----
section("SCHOOLS");
insert(
  "schools",
  ["legacy_id", "code", "name", "short_name", "location", "academic_unit", "branding_label", "supported_roles"],
  SCHOOL_CONTEXTS.map((s: any) => [
    esc(s.id), esc(s.id), esc(s.name), esc(s.shortName), esc(s.location),
    esc(s.academicUnit), esc(s.brandingLabel), textArr(s.supportedRoles),
  ])
);

// ---- 2. setup_items ----
section("SETUP_ITEMS");
{
  const rows: string[][] = [];
  for (const [category, items] of Object.entries(MOCK_SETUP_DATA as Record<string, any[]>)) {
    items.forEach((it, idx) => {
      const { id, code, name, description, isActive, createdAt, createdBy, sortOrder, ...rest } = it;
      rows.push([
        esc(id), esc(category), esc(code ?? id), esc(name ?? code ?? id), esc(description),
        bool(isActive ?? true), num(sortOrder ?? idx), jsonb(rest), esc(createdBy), tsVal(createdAt),
      ]);
    });
  }
  insert("setup_items", ["legacy_id", "category", "code", "name", "description", "is_active", "sort_order", "metadata", "created_by", "created_at"], rows);
}

// extra setup_items categories for dropdown lists previously hardcoded inline in pages
{
  const extra: Record<string, string[]> = {
    days_of_week: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    transaction_types: ["Payment", "Assessment", "Discount", "Adjustment", "Penalty"],
    discount_sources: ["Government", "Sibling", "Owner", "Scholarship", "Employee", "Other"],
    discount_request_statuses: ["Pending", "For Review", "Approved", "Rejected", "Returned for Documents", "Cancelled", "Expired"],
    financial_hold_statuses: ["Active", "Cleared"],
    assessment_approval_statuses: ["Pending Accounting Approval", "Approved for Payment", "Returned to Registrar", "Rejected"],
    enrollment_types: ["New Student", "Old Student", "Transferee", "Returnee"],
    book_package_statuses: ["Active", "Inactive"],
    learning_material_types: ["Video", "Module", "Document"],
    room_statuses: ["Available", "Under Maintenance", "Reserved"],
    payment_remittance_terms: ["Downpayment", "Midterm", "Finals", "Full Payment", "Installment"],
    payment_methods_cashier: ["Cash", "GCash", "Bank Transfer", "Credit Card"],
  };
  const rows: string[][] = [];
  for (const [category, values] of Object.entries(extra)) {
    values.forEach((name, idx) => {
      rows.push([esc(`${category}-${idx + 1}`), esc(category), esc(name), esc(name), "NULL", "true", num(idx), jsonb({}), "NULL", "now()"]);
    });
  }
  insert("setup_items", ["legacy_id", "category", "code", "name", "description", "is_active", "sort_order", "metadata", "created_by", "created_at"], rows);
}

// ---- 3. users ----
section("USERS");
insert(
  "users",
  ["legacy_id", "school_id", "email", "name", "role", "is_active", "avatar_url", "department"],
  MOCK_USERS.map((u: any) => [esc(u.id), fk("schools", u.schoolId), esc(u.email), esc(u.name), esc(u.role), bool(u.isActive), esc(u.avatarUrl), esc(u.department)])
);

// ---- 4. courses ----
section("COURSES");
insert(
  "courses",
  ["legacy_id", "code", "name", "department", "duration_years"],
  MOCK_COURSES.map((c: any) => [esc(c.id), esc(c.code), esc(c.name), esc(c.department), num(c.durationYears)])
);

// ---- 5. subjects ----
section("SUBJECTS");
insert(
  "subjects",
  ["legacy_id", "code", "name", "units", "department", "year_level", "semester", "track_or_course", "prerequisites"],
  MOCK_SUBJECTS.map((s: any) => [
    esc(s.id), esc(s.code), esc(s.name), num(s.units), esc(s.department), esc(s.yearLevel), esc(s.semester), esc(s.trackOrCourse), textArr(s.prerequisites),
  ])
);

// ---- 6. teachers ----
section("TEACHERS");
insert(
  "teachers",
  ["legacy_id", "school_id", "user_id", "first_name", "last_name", "middle_name", "department", "email", "phone", "specialization", "advisory_section", "is_active"],
  MOCK_TEACHERS.map((t: any) => [
    esc(t.id), fk("schools", t.schoolId), fk("users", t.userId), esc(t.firstName), esc(t.lastName), esc(t.middleName),
    esc(t.department), esc(t.email), esc(t.phone), esc(t.specialization), esc(t.advisorySection), bool(t.isActive),
  ])
);

// ---- 7. students (real + grading demo students) ----
section("STUDENTS");
insert(
  "students",
  ["legacy_id", "school_id", "user_id", "student_no", "first_name", "last_name", "middle_name", "gender", "civil_status", "religion", "nationality", "birthday", "birthplace", "email", "contact_no", "address", "province", "municipality", "zip_code", "department", "year_level", "track_or_course", "section", "enrollment_status"],
  MOCK_STUDENTS.map((s: any) => [
    esc(s.id), fk("schools", s.schoolId), fk("users", s.userId), esc(s.studentNo), esc(s.firstName), esc(s.lastName), esc(s.middleName),
    esc(s.gender), esc(s.civilStatus), esc(s.religion), esc(s.nationality), dateVal(s.birthday), esc(s.birthplace), esc(s.email), esc(s.contactNo),
    esc(s.address), esc(s.province), esc(s.municipality), esc(s.zipCode), esc(s.department), esc(s.yearLevel), esc(s.trackOrCourse), esc(s.section), esc(s.enrollmentStatus),
  ])
);
insert(
  "students",
  ["legacy_id", "student_no", "first_name", "last_name", "department", "year_level", "track_or_course", "section", "enrollment_status"],
  MOCK_DEMO_STUDENTS.map((s: any) => [esc(s.id), esc(s.studentNo), esc(s.firstName), esc(s.lastName), esc(s.department), esc(s.yearLevel), esc(s.trackOrCourse), esc(s.section), esc("Enrolled")])
);

// ---- 8. employees ----
section("EMPLOYEES");
insert(
  "employees",
  ["legacy_id", "school_id", "first_name", "last_name", "middle_name", "email", "position", "position_title", "department", "salary", "status", "leave_balance", "contact", "address", "emergency_contact"],
  MOCK_EMPLOYEES.map((e: any) => [
    esc(e.id), fk("schools", e.schoolId), esc(e.firstName), esc(e.lastName), esc(e.middleName), esc(e.email), esc(e.position), esc(e.positionTitle),
    esc(e.department), num(e.salary), esc(e.status), num(e.leaveBalance), esc(e.contact), esc(e.address), esc(e.emergencyContact),
  ])
);

// ---- 9/10. curriculums + curriculum_subjects ----
section("CURRICULUMS");
insert("curriculums", ["legacy_id", "course_code_or_strand", "name"], MOCK_CURRICULUMS.map((c: any) => [esc(c.id), esc(c.courseCodeOrStrand), esc(c.name)]));
section("CURRICULUM_SUBJECTS");
{
  const rows: string[][] = [];
  for (const c of MOCK_CURRICULUMS as any[]) {
    for (const block of c.subjects) {
      for (const subjectCode of block.subjectCodes) {
        rows.push([fk("curriculums", c.id), fk("subjects", subjectCode), esc(block.yearLevel), esc(block.semester)]);
      }
    }
  }
  insert("curriculum_subjects", ["curriculum_id", "subject_id", "year_level", "semester"], rows);
}

// ---- 11/12. sections + section_students ----
section("SECTIONS");
insert(
  "sections",
  ["legacy_id", "school_id", "code", "name", "department", "year_level", "strand_or_track", "adviser_id", "capacity", "current_count", "academic_year", "semester", "is_active"],
  MOCK_SECTIONS.map((s: any) => [
    esc(s.id), fk("schools", s.schoolId), esc(s.code), esc(s.name), esc(s.department), esc(s.yearLevel), esc(s.strandOrTrack),
    fk("teachers", s.adviserId), num(s.capacity), num(s.currentCount), esc(s.academicYear), esc(s.semester), bool(s.isActive),
  ])
);
section("SECTION_STUDENTS");
{
  const rows: string[][] = [];
  for (const s of MOCK_SECTIONS as any[]) {
    for (const studentId of s.enrolledStudentIds ?? []) {
      rows.push([fk("sections", s.id), fk("students", studentId)]);
    }
  }
  insert("section_students", ["section_id", "student_id"], rows);
}

// ---- 13. rooms ----
section("ROOMS");
insert(
  "rooms",
  ["legacy_id", "school_id", "code", "name", "building", "floor", "capacity", "type", "is_active", "status"],
  MOCK_ROOMS.map((r: any) => [esc(r.id), fk("schools", r.schoolId), esc(r.code), esc(r.name), esc(r.building), esc(r.floor), num(r.capacity), esc(r.type), bool(r.isActive), esc(r.status)])
);

// ---- 14. class_schedules ----
section("CLASS_SCHEDULES");
insert(
  "class_schedules",
  ["legacy_id", "subject_id", "teacher_id", "section", "room_name", "day", "start_time", "end_time", "school_year", "semester", "is_active", "department", "year_level", "course_or_track", "notes"],
  MOCK_CLASS_SCHEDULES.map((c: any) => [
    esc(c.id), fk("subjects", c.subjectCode), fk("teachers", c.teacherId), esc(c.section), esc(c.roomName), esc(c.day),
    esc(c.startTime), esc(c.endTime), esc(c.schoolYear), esc(c.semester), bool(c.isActive), esc(c.department), esc(c.yearLevel), esc(c.courseOrTrack), esc(c.notes),
  ])
);

// ---- 15. schedules (legacy flat) ----
section("SCHEDULES");
insert(
  "schedules",
  ["legacy_id", "subject_code", "subject_name", "teacher_name", "section", "day", "time", "room"],
  MOCK_SCHEDULES.map((s: any) => [esc(s.id), esc(s.subjectCode), esc(s.subjectName), esc(s.teacherName), esc(s.section), esc(s.day), esc(s.time), esc(s.room)])
);

// ---- 16. requirements ----
section("REQUIREMENTS");
insert(
  "requirements",
  ["legacy_id", "student_id", "name", "status", "submitted_date", "remarks", "upload_status", "upload_file_name", "upload_date", "verification_status", "verified_by", "verified_at", "hardcopy_submitted", "hardcopy_submitted_date"],
  MOCK_REQUIREMENTS.map((r: any) => [
    esc(r.id), fk("students", r.studentId), esc(r.name), esc(r.status), dateVal(r.submittedDate), esc(r.remarks),
    esc(r.uploadStatus), esc(r.uploadFileName), dateVal(r.uploadDate), esc(r.verificationStatus), esc(r.verifiedBy),
    tsVal(r.verifiedAt), bool(r.hardcopySubmitted ?? false), dateVal(r.hardcopySubmittedDate),
  ])
);

// ---- 17/18. book_packages + book_package_items ----
section("BOOK_PACKAGES");
insert(
  "book_packages",
  ["legacy_id", "package_name", "grade_level", "school_id", "academic_unit", "school_year", "total_amount", "is_required", "status", "last_updated", "updated_by"],
  MOCK_BOOK_PACKAGES.map((b: any) => [
    esc(b.id), esc(b.packageName), esc(b.gradeLevel), fk("schools", b.schoolId), esc(b.academicUnit), esc(b.schoolYear),
    num(b.totalAmount), bool(b.isRequired), esc(b.status), dateVal(b.lastUpdated), esc(b.updatedBy),
  ])
);
section("BOOK_PACKAGE_ITEMS");
{
  const rows: string[][] = [];
  for (const b of MOCK_BOOK_PACKAGES as any[]) {
    for (const item of b.books) {
      rows.push([esc(item.id), fk("book_packages", b.id), esc(item.title), fk("subjects", item.subjectCode), num(item.quantity), num(item.unitPrice)]);
    }
  }
  insert("book_package_items", ["legacy_id", "book_package_id", "title", "subject_id", "quantity", "unit_price"], rows);
}

// ---- 19/20/21. assessments + assessment_fees + assessment_audit_trail ----
section("ASSESSMENTS");
insert(
  "assessments",
  ["legacy_id", "school_id", "student_id", "school_year", "semester", "total_amount", "discount_percentage", "discount_amount", "scholarship_name", "payment_term", "balance", "is_paid", "financial_hold_status", "last_payment_date", "books_availed", "book_package_id", "approval_status", "submitted_by", "submitted_date", "registrar_remarks", "accounting_remarks", "approved_by", "approved_date"],
  MOCK_ASSESSMENTS.map((a: any) => [
    esc(a.id), fk("schools", a.schoolId), fk("students", a.studentId), esc(a.schoolYear), esc(a.semester), num(a.totalAmount),
    num(a.discountPercentage), num(a.discountAmount), esc(a.scholarshipName), esc(a.paymentTerm), num(a.balance), bool(a.isPaid ?? false),
    esc(a.financialHoldStatus), dateVal(a.lastPaymentDate), bool(a.booksAvailed ?? false), fk("book_packages", a.bookPackageId),
    esc(a.approvalStatus), esc(a.submittedBy), dateVal(a.submittedDate), esc(a.registrarRemarks), esc(a.accountingRemarks), esc(a.approvedBy), dateVal(a.approvedDate),
  ])
);
section("ASSESSMENT_FEES");
{
  const rows: string[][] = [];
  for (const a of MOCK_ASSESSMENTS as any[]) {
    for (const fee of a.fees ?? []) {
      rows.push([fk("assessments", a.id), esc(fee.feeName), esc(fee.category), num(fee.amount)]);
    }
  }
  insert("assessment_fees", ["assessment_id", "fee_name", "category", "amount"], rows);
}
section("ASSESSMENT_AUDIT_TRAIL");
{
  const rows: string[][] = [];
  for (const a of MOCK_ASSESSMENTS as any[]) {
    for (const entry of a.auditTrail ?? []) {
      rows.push([esc(entry.id), fk("assessments", a.id), esc(entry.action), esc(entry.performedBy), tsVal(entry.performedAt), esc(entry.details)]);
    }
  }
  insert("assessment_audit_trail", ["legacy_id", "assessment_id", "action", "performed_by", "performed_at", "details"], rows);
}

// ---- 22/23. enrollments + enrollment_subjects ----
section("ENROLLMENTS");
insert(
  "enrollments",
  ["legacy_id", "student_id", "school_year", "semester", "enrollment_type", "status", "submitted_at", "assessment_id"],
  MOCK_ENROLLMENTS.map((e: any) => [
    esc(e.id), fk("students", e.studentId), esc(e.schoolYear), esc(e.semester), esc(e.enrollmentType), esc(e.status), tsVal(e.submittedAt), fk("assessments", e.assessmentId),
  ])
);
section("ENROLLMENT_SUBJECTS");
{
  const rows: string[][] = [];
  for (const e of MOCK_ENROLLMENTS as any[]) {
    for (const subjectCode of e.subjectCodes ?? []) {
      rows.push([fk("enrollments", e.id), fk("subjects", subjectCode)]);
    }
  }
  insert("enrollment_subjects", ["enrollment_id", "subject_id"], rows);
}

// ---- 24. payments ----
section("PAYMENTS");
insert(
  "payments",
  ["legacy_id", "school_id", "student_id", "amount", "payment_date", "payment_method", "or_number", "term", "remarks"],
  MOCK_PAYMENTS.map((p: any) => [esc(p.id), fk("schools", p.schoolId), fk("students", p.studentId), num(p.amount), tsVal(p.paymentDate), esc(p.paymentMethod), esc(p.orNumber), esc(p.term), esc(p.remarks)])
);

// ---- 25. discount_types ----
section("DISCOUNT_TYPES");
insert(
  "discount_types",
  ["legacy_id", "code", "name", "discount_percent", "discount_source", "requires_approval", "max_beneficiaries", "description", "is_active", "effective_school_year", "applicable_academic_unit", "applies_to", "discount_basis", "discount_fixed_amount", "is_stackable", "requires_document", "max_amount", "gl_code"],
  MOCK_DISCOUNT_TYPES.map((d: any) => [
    esc(d.id), esc(d.code), esc(d.name), num(d.discountPercent), esc(d.discountSource), bool(d.requiresApproval), num(d.maxBeneficiaries),
    esc(d.description), bool(d.isActive), esc(d.effectiveSchoolYear), esc(d.applicableAcademicUnit), esc(d.appliesTo), esc(d.discountBasis),
    num(d.discountFixedAmount), bool(d.isStackable ?? false), bool(d.requiresDocument ?? false), num(d.maxAmount), esc(d.glCode),
  ])
);

// ---- 26/27. discount_requests + audit trail ----
section("DISCOUNT_REQUESTS");
insert(
  "discount_requests",
  ["legacy_id", "reference_no", "student_id", "discount_type_id", "requested_by", "requested_at", "status", "sibling_names", "level1_status", "level1_approved_by", "level1_approved_at", "level2_status", "level2_approved_by", "level2_approved_at", "remarks", "attachment_names"],
  MOCK_DISCOUNT_REQUESTS.map((d: any) => [
    esc(d.id), esc(d.referenceNo), fk("students", d.studentId), fk("discount_types", d.discountTypeId), esc(d.requestedBy), tsVal(d.requestedAt),
    esc(d.status), textArr(d.siblingNames), esc(d.level1Status), esc(d.level1ApprovedBy), tsVal(d.level1ApprovedAt),
    esc(d.level2Status), esc(d.level2ApprovedBy), tsVal(d.level2ApprovedAt), esc(d.remarks), textArr(d.attachmentNames),
  ])
);
section("DISCOUNT_REQUEST_AUDIT_TRAIL");
{
  const rows: string[][] = [];
  for (const d of MOCK_DISCOUNT_REQUESTS as any[]) {
    for (const entry of d.auditTrail ?? []) {
      rows.push([esc(entry.id), fk("discount_requests", d.id), esc(entry.action), esc(entry.performedBy), tsVal(entry.performedAt), esc(entry.details)]);
    }
  }
  insert("discount_request_audit_trail", ["legacy_id", "discount_request_id", "action", "performed_by", "performed_at", "details"], rows);
}

// ---- 28. student_ledger_summaries ----
section("STUDENT_LEDGER_SUMMARIES");
insert(
  "student_ledger_summaries",
  ["student_id", "school_year", "total_assessed", "total_paid", "discount_applied", "balance", "financial_hold_status", "clearance_status", "last_payment_date"],
  MOCK_STUDENT_LEDGER_SUMMARIES.map((l: any) => [
    fk("students", l.studentId), esc(l.schoolYear), num(l.totalAssessed), num(l.totalPaid), num(l.discountApplied), num(l.balance),
    esc(l.financialHoldStatus), esc(l.clearanceStatus), dateVal(l.lastPaymentDate),
  ])
);

// ---- 29. ledger_transactions ----
section("LEDGER_TRANSACTIONS");
insert(
  "ledger_transactions",
  ["legacy_id", "student_id", "date", "description", "type", "debit", "credit", "balance", "reference"],
  MOCK_LEDGER_TRANSACTIONS.map((l: any) => [esc(l.id), fk("students", l.studentId), dateVal(l.date), esc(l.description), esc(l.type), num(l.debit), num(l.credit), num(l.balance), esc(l.reference)])
);

// ---- 30. financial_holds ----
section("FINANCIAL_HOLDS");
insert(
  "financial_holds",
  ["legacy_id", "student_id", "hold_type", "hold_category", "reason", "balance_amount", "created_by", "status", "cleared_by", "cleared_at", "clearance_remarks", "created_at"],
  MOCK_FINANCIAL_HOLDS.map((h: any) => [
    esc(h.id), fk("students", h.studentId), esc(h.holdType), esc(h.holdCategory), esc(h.reason), num(h.balanceAmount), esc(h.createdBy),
    esc(h.status), esc(h.clearedBy), tsVal(h.clearedAt), esc(h.clearanceRemarks), tsVal(h.createdAt),
  ])
);

// ---- 31. assessment_billing_summaries ----
section("ASSESSMENT_BILLING_SUMMARIES");
insert(
  "assessment_billing_summaries",
  ["legacy_id", "student_id", "school_year", "semester", "academic_unit", "fee_template_name", "total_assessment", "amount_due", "balance", "status"],
  MOCK_ASSESSMENT_BILLING_SUMMARIES.map((b: any) => [
    esc(b.id), fk("students", b.studentId), esc(b.schoolYear), esc(b.semester), esc(b.academicUnit), esc(b.feeTemplateName), num(b.totalAssessment), num(b.amountDue), num(b.balance), esc(b.status),
  ])
);

// ---- 32. payment_collection_summaries ----
section("PAYMENT_COLLECTION_SUMMARIES");
insert(
  "payment_collection_summaries",
  ["legacy_id", "student_id", "amount", "payment_method", "reference_no", "payment_date", "cashier", "term", "verification_status"],
  MOCK_PAYMENT_COLLECTION_SUMMARIES.map((p: any) => [
    esc(p.id), fk("students", p.studentId), num(p.amount), esc(p.paymentMethod), esc(p.referenceNo), tsVal(p.paymentDate), esc(p.cashier), esc(p.term), esc(p.verificationStatus),
  ])
);

// ---- 33. promissory_notes ----
section("PROMISSORY_NOTES");
insert(
  "promissory_notes",
  ["legacy_id", "student_id", "amount", "due_date", "status"],
  MOCK_PROMISSORY_NOTES.map((p) => [esc(p.id), fk("students", p.studentId), num(p.amount), dateVal(p.dueDate), esc(p.status)])
);

// ---- 34/35. subject_class_loads + class_load_students ----
section("SUBJECT_CLASS_LOADS");
insert(
  "subject_class_loads",
  ["legacy_id", "teacher_id", "subject_id", "section_id", "department", "school_year", "semester"],
  MOCK_CLASS_LOADS.map((c: any) => [esc(c.id), fk("teachers", c.teacherId), fk("subjects", c.subjectCode), fk("sections", c.sectionId), esc(c.department), esc(c.schoolYear), esc(c.semester)])
);
section("CLASS_LOAD_STUDENTS");
{
  const rows: string[][] = [];
  for (const c of MOCK_CLASS_LOADS as any[]) {
    for (const studentId of c.studentIds ?? []) {
      rows.push([fk("subject_class_loads", c.id), fk("students", studentId)]);
    }
  }
  insert("class_load_students", ["class_load_id", "student_id"], rows);
}

// ---- 36/37/38. grade_periods + grade_categories + grade_items ----
section("GRADE_PERIODS");
insert(
  "grade_periods",
  ["legacy_id", "label", "subject_id", "section_id", "school_year", "teacher_id", "is_finalized", "finalized_at", "finalized_by"],
  MOCK_GRADE_PERIODS.map((g: any) => [
    esc(g.id), esc(g.label), fk("subjects", g.subjectCode), fk("sections", g.sectionId), esc(g.schoolYear), fk("teachers", g.teacherId), bool(g.isFinalized), tsVal(g.finalizedAt), esc(g.finalizedBy),
  ])
);
section("GRADE_CATEGORIES");
{
  const rows: string[][] = [];
  for (const g of MOCK_GRADE_PERIODS as any[]) {
    for (const c of g.categories ?? []) {
      rows.push([fk("grade_periods", g.id), esc(c.name), num(c.weight)]);
    }
  }
  insert("grade_categories", ["grade_period_id", "name", "weight"], rows);
}
section("GRADE_ITEMS");
{
  const rows: string[][] = [];
  for (const g of MOCK_GRADE_PERIODS as any[]) {
    for (const it of g.items ?? []) {
      rows.push([esc(it.id), fk("grade_periods", g.id), esc(it.label), esc(it.category), num(it.maxScore), num(it.order), dateVal(it.dueDate)]);
    }
  }
  insert("grade_items", ["legacy_id", "grade_period_id", "label", "category", "max_score", "sort_order", "due_date"], rows);
}

// ---- 39. student_grade_entries ----
section("STUDENT_GRADE_ENTRIES");
insert(
  "student_grade_entries",
  ["legacy_id", "grade_period_id", "student_id", "grade_item_id", "score"],
  MOCK_STUDENT_GRADE_ENTRIES.map((e: any) => [esc(e.id), fk("grade_periods", e.periodId), fk("students", e.studentId), fk("grade_items", e.gradeItemId), num(e.score)])
);

// ---- 40. grades ----
section("GRADES");
insert(
  "grades",
  ["legacy_id", "student_id", "subject_id", "teacher_id", "school_year", "semester", "midterm_grade", "final_grade", "remarks"],
  MOCK_GRADES.map((g: any) => [
    esc(g.id), fk("students", g.studentId), fk("subjects", g.subjectCode), fk("teachers", g.teacherId), esc(g.schoolYear), esc(g.semester), num(g.midtermGrade), num(g.finalGrade), esc(g.remarks),
  ])
);

// ---- 41/42. announcements + school_events ----
section("ANNOUNCEMENTS");
insert(
  "announcements",
  ["legacy_id", "title", "content", "date", "category", "author"],
  MOCK_ANNOUNCEMENTS.map((a: any) => [esc(a.id), esc(a.title), esc(a.content), dateVal(a.date), esc(a.category), esc(a.author)])
);
section("SCHOOL_EVENTS");
insert(
  "school_events",
  ["legacy_id", "title", "description", "date", "department"],
  MOCK_EVENTS.map((e: any) => [esc(e.id), esc(e.title), esc(e.description), dateVal(e.date), esc(e.department)])
);

// ---- 43. learning_materials ----
section("LEARNING_MATERIALS");
insert(
  "learning_materials",
  ["legacy_id", "school_id", "title", "description", "subject_id", "section", "teacher_id", "learning_type", "file_url", "file_name", "file_size", "video_url", "thumbnail_url", "publish_status", "upload_date", "department", "year_level", "track_or_course", "tags"],
  MOCK_LEARNING_MATERIALS.map((m: any) => [
    esc(m.id), fk("schools", m.schoolId), esc(m.title), esc(m.description), fk("subjects", m.subjectCode), esc(m.section), fk("teachers", m.teacherId),
    esc(m.learningType), esc(m.fileUrl), esc(m.fileName), esc(m.fileSize), esc(m.videoUrl), esc(m.thumbnailUrl), esc(m.publishStatus),
    dateVal(m.uploadDate), esc(m.department), esc(m.yearLevel), esc(m.trackOrCourse), textArr(m.tags),
  ])
);

// ---- 44. activity_logs ----
section("ACTIVITY_LOGS");
insert(
  "activity_logs",
  ["legacy_id", "actor_name", "action", "subject_label", "activity_type"],
  RECENT_TEACHER_ACTIVITIES.map((a) => [esc(a.id), esc("Prof. Beatriz Cruz"), esc(a.action), esc(a.subject), esc(a.type)])
);

// ---- 45. enrollment_history_stats ----
section("ENROLLMENT_HISTORY_STATS");
{
  const rows: string[][] = [];
  for (const t of ENROLLMENT_TREND) {
    rows.push([esc(t.year), fk("schools", "STSN"), num(t.stsn)]);
    rows.push([esc(t.year), fk("schools", "CDSTA"), num(t.cdsta)]);
  }
  insert("enrollment_history_stats", ["school_year", "school_id", "student_count"], rows);
}

// ---- 46. payroll ----
section("PAYROLL");
insert(
  "payroll",
  ["legacy_id", "employee_id", "employee_name", "position", "basic_salary", "allowances", "sss_deduction", "philhealth_deduction", "pagibig_deduction", "tax_deduction", "net_pay", "period", "status"],
  STARTING_PAYROLL.map((p: any) => [
    esc(p.id), fk("employees", p.employeeId), esc(p.employeeName), esc(p.position), num(p.basicSalary), num(p.allowances), num(p.sssDeduction),
    num(p.philhealthDeduction), num(p.pagibigDeduction), num(p.taxDeduction), num(p.netPay), esc(p.period), esc(p.status),
  ])
);

writeFileSync(new URL("../supabase/migrations/0003_data.sql", import.meta.url), out);
console.log("Wrote supabase/migrations/0003_data.sql:", out.length, "bytes");

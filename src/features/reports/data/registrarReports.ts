import type {
  ReportColumn,
  ReportDataContext,
  ReportDefinition,
  ReportFilterValues,
  ReportRow,
} from "../types";
import { formatSchool } from "../types";

const studentColumns: ReportColumn[] = [
  { key: "studentNo", label: "Student No." },
  { key: "studentName", label: "Student Name" },
  { key: "school", label: "School" },
  { key: "department", label: "Department" },
  { key: "yearLevel", label: "Year Level" },
  { key: "trackOrCourse", label: "Track / Course" },
  { key: "section", label: "Section / Block" },
  { key: "status", label: "Status" },
];

const enrollmentColumns: ReportColumn[] = [
  { key: "studentNo", label: "Student No." },
  { key: "studentName", label: "Student Name" },
  { key: "schoolYear", label: "School Year" },
  { key: "semester", label: "Semester" },
  { key: "enrollmentType", label: "Enrollment Type" },
  { key: "yearLevel", label: "Year Level" },
  { key: "section", label: "Section / Block" },
  { key: "status", label: "Status" },
];

function fullName(row: { firstName: string; middleName?: string; lastName: string }) {
  return [row.lastName, `${row.firstName} ${row.middleName ?? ""}`.trim()].filter(Boolean).join(", ");
}

function latestEnrollment(context: ReportDataContext, studentId: string) {
  return context.enrollments
    .filter((enrollment) => enrollment.studentId === studentId)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0];
}

function resolveSection(context: ReportDataContext, studentId: string, schoolYear?: string, semester?: string) {
  const section = context.sections.find((item) =>
    (item.enrolledStudentIds ?? []).includes(studentId) &&
    (!schoolYear || item.academicYear === schoolYear) &&
    (!semester || !item.semester || item.semester === semester),
  );
  return section?.name;
}

function baseStudentRows(context: ReportDataContext): ReportRow[] {
  return context.students.map((student) => {
    const enrollment = latestEnrollment(context, student.id);
    return {
      id: student.id,
      studentNo: student.studentNo,
      studentName: fullName(student),
      school: formatSchool(student.schoolId),
      department: student.department,
      yearLevel: student.yearLevel,
      trackOrCourse: student.trackOrCourse,
      section: student.section || "Unassigned",
      status: student.enrollmentStatus,
      schoolYear: enrollment?.schoolYear ?? "N/A",
      semester: enrollment?.semester ?? "N/A",
      enrollmentType: enrollment?.enrollmentType ?? "N/A",
      submittedAt: enrollment?.submittedAt ?? "",
    };
  });
}

function matchesFilters(row: ReportRow, filters: ReportFilterValues) {
  const q = filters.search.trim().toLowerCase();
  const searchable = [
    row.studentNo,
    row.studentName,
    row.yearLevel,
    row.trackOrCourse,
    row.section,
    row.status,
    row.schoolYear,
    row.enrollmentType,
  ].join(" ").toLowerCase();

  return (
    (!q || searchable.includes(q)) &&
    (filters.schoolYear === "All" || row.schoolYear === filters.schoolYear) &&
    (filters.status === "All" || row.status === filters.status) &&
    (filters.yearLevel === "All" || row.yearLevel === filters.yearLevel) &&
    (filters.section === "All" || row.section === filters.section) &&
    (filters.enrollmentType === "All" || row.enrollmentType === filters.enrollmentType)
  );
}

function filteredStudentRows(context: ReportDataContext, filters: ReportFilterValues) {
  return baseStudentRows(context).filter((row) => matchesFilters(row, filters));
}

function baseEnrollmentRows(context: ReportDataContext): ReportRow[] {
  const studentsById = new Map(context.students.map((student) => [student.id, student]));
  return context.enrollments.map((enrollment) => {
    const student = studentsById.get(enrollment.studentId);
    const section = resolveSection(context, enrollment.studentId, enrollment.schoolYear, enrollment.semester);

    return {
      id: enrollment.id,
      studentId: enrollment.studentId,
      studentNo: student?.studentNo ?? "N/A",
      studentName: student ? fullName(student) : "Unknown Student",
      school: formatSchool(student?.schoolId),
      department: student?.department ?? "N/A",
      yearLevel: student?.yearLevel ?? "N/A",
      trackOrCourse: student?.trackOrCourse ?? "N/A",
      section: section ?? student?.section ?? "Unassigned",
      status: enrollment.status,
      schoolYear: enrollment.schoolYear,
      semester: enrollment.semester,
      enrollmentType: enrollment.enrollmentType,
      submittedAt: enrollment.submittedAt,
      subjectCount: enrollment.subjectCodes.length,
    };
  });
}

function filteredEnrollmentRows(context: ReportDataContext, filters: ReportFilterValues) {
  return baseEnrollmentRows(context).filter((row) => matchesFilters(row, filters));
}

export function buildRegistrarFilterRows(context: ReportDataContext) {
  return baseEnrollmentRows(context);
}

function countRows(rows: ReportRow[], groupKeys: string[], valueLabel = "Students"): ReportRow[] {
  const counts = new Map<string, ReportRow>();
  rows.forEach((row) => {
    const key = groupKeys.map((groupKey) => String(row[groupKey] ?? "N/A")).join("||");
    const existing = counts.get(key);
    if (existing) {
      existing.count = Number(existing.count ?? 0) + 1;
      return;
    }
    const grouped: ReportRow = { id: key };
    groupKeys.forEach((groupKey) => {
      grouped[groupKey] = row[groupKey] ?? "N/A";
    });
    grouped.metric = valueLabel;
    grouped.count = 1;
    counts.set(key, grouped);
  });
  return Array.from(counts.values()).sort((a, b) => String(a.id).localeCompare(String(b.id)));
}

export const REGISTRAR_REPORTS: ReportDefinition[] = [
  {
    id: "student-masterlist",
    title: "Student Masterlist",
    description: "Complete student directory with academic placement and current enrollment status.",
    columns: studentColumns,
    buildRows: filteredStudentRows,
  },
  {
    id: "officially-enrolled-students",
    title: "Officially Enrolled Students",
    description: "Students with an active enrolled status for the selected school year or filters.",
    columns: enrollmentColumns,
    buildRows: (context, filters) =>
      filteredStudentRows(context, { ...filters, status: filters.status === "All" ? "Enrolled" : filters.status })
        .filter((row) => row.status === "Enrolled"),
  },
  {
    id: "enrollment-summary",
    title: "Enrollment Summary",
    description: "Enrollment totals grouped by school year, department, status, and enrollment type.",
    columns: [
      { key: "schoolYear", label: "School Year" },
      { key: "department", label: "Department" },
      { key: "status", label: "Status" },
      { key: "enrollmentType", label: "Enrollment Type" },
      { key: "count", label: "Count", align: "right" },
    ],
    buildRows: (context, filters) =>
      countRows(filteredEnrollmentRows(context, filters), ["schoolYear", "department", "status", "enrollmentType"]),
  },
  {
    id: "enrollment-count-by-grade-year-level",
    title: "Enrollment Count by Grade / Year Level",
    description: "Student counts grouped by grade or year level.",
    columns: [
      { key: "yearLevel", label: "Grade / Year Level" },
      { key: "department", label: "Department" },
      { key: "count", label: "Count", align: "right" },
    ],
    buildRows: (context, filters) =>
      countRows(filteredEnrollmentRows(context, filters), ["yearLevel", "department"]),
  },
  {
    id: "enrollment-count-by-section-block",
    title: "Enrollment Count by Section / Block",
    description: "Student counts grouped by section or block.",
    columns: [
      { key: "section", label: "Section / Block" },
      { key: "yearLevel", label: "Grade / Year Level" },
      { key: "count", label: "Count", align: "right" },
    ],
    buildRows: (context, filters) =>
      countRows(filteredEnrollmentRows(context, filters), ["section", "yearLevel"]),
  },
  {
    id: "enrollment-status-report",
    title: "Enrollment Status Report",
    description: "Students grouped by current enrollment status.",
    columns: [
      { key: "status", label: "Status" },
      { key: "yearLevel", label: "Grade / Year Level" },
      { key: "count", label: "Count", align: "right" },
    ],
    buildRows: (context, filters) =>
      countRows(filteredEnrollmentRows(context, filters), ["status", "yearLevel"]),
  },
  {
    id: "transferee-returnee-report",
    title: "Transferee / Returnee Report",
    description: "Students tagged as transferees or returnees in their enrollment record.",
    columns: enrollmentColumns,
    buildRows: (context, filters) =>
      filteredStudentRows(context, filters).filter((row) =>
        ["Transferee", "Returnee"].includes(String(row.enrollmentType)),
      ),
  },
  {
    id: "dropped-withdrawn-students",
    title: "Dropped / Withdrawn Students",
    description: "Students with dropped, withdrawn, rejected, or inactive enrollment outcomes.",
    columns: studentColumns,
    buildRows: (context, filters) =>
      filteredStudentRows(context, filters).filter((row) =>
        ["Dropped", "Withdrawn", "Rejected"].includes(String(row.status)),
      ),
  },
  {
    id: "requirements-submission-report",
    title: "Requirements Submission Report",
    description: "Student enrollment requirement submission and verification status.",
    columns: [
      { key: "studentNo", label: "Student No." },
      { key: "studentName", label: "Student Name" },
      { key: "requirement", label: "Requirement" },
      { key: "submissionStatus", label: "Submission Status" },
      { key: "verificationStatus", label: "Verification" },
      { key: "hardcopy", label: "Hardcopy" },
      { key: "submittedDate", label: "Submitted Date" },
    ],
    buildRows: (context, filters) => {
      const studentsById = new Map(context.students.map((student) => [student.id, student]));
      const allowedStudents = new Set(filteredStudentRows(context, filters).map((row) => row.id));
      return context.requirements
        .filter((requirement) => allowedStudents.has(requirement.studentId))
        .map((requirement) => {
          const student = studentsById.get(requirement.studentId);
          return {
            id: requirement.id,
            studentNo: student?.studentNo ?? "N/A",
            studentName: student ? fullName(student) : "Unknown Student",
            requirement: requirement.name,
            submissionStatus: requirement.status,
            verificationStatus: requirement.verificationStatus ?? "Pending",
            hardcopy: requirement.hardcopySubmitted ? "Submitted" : "Pending",
            submittedDate: requirement.submittedDate ?? requirement.uploadDate ?? "N/A",
          };
        });
    },
  },
  {
    id: "certificate-of-registration",
    title: "COR / Certificate of Registration",
    description: "Registration certificate listing enrollment status and enrolled subjects count.",
    columns: [
      { key: "studentNo", label: "Student No." },
      { key: "studentName", label: "Student Name" },
      { key: "schoolYear", label: "School Year" },
      { key: "semester", label: "Semester" },
      { key: "yearLevel", label: "Grade / Year Level" },
      { key: "section", label: "Section / Block" },
      { key: "subjectCount", label: "Subjects", align: "right" },
      { key: "status", label: "Status" },
    ],
    buildRows: filteredEnrollmentRows,
  },
];

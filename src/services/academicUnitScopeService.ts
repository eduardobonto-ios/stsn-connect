import { academicUnitToDepartment } from "../config/schools.config";
import type {
  BookPackage,
  ClassSchedule,
  Employee,
  Enrollment,
  FinancialHold,
  LearningMaterial,
  Payment,
  Requirement,
  Room,
  SchoolId,
  SchoolSection,
  Student,
  StudentAssessment,
  StudentLedgerSummary,
  Subject,
  Teacher,
  User,
} from "../types";
import type { AcademicUnit } from "../types/school.types";

type Department = "Basic Education" | "College";

export type AcademicUnitScope = {
  schoolId?: SchoolId;
  department?: Department;
  academicUnit: AcademicUnit;
  isAllSchools: boolean;
};

export type AcademicScopeInput = {
  currentUser: User | null;
  activeSchool: SchoolId | "ALL";
  academicUnit: AcademicUnit;
};

export type AcademicScopedDataInput = AcademicScopeInput & {
  students: Student[];
  teachers?: Teacher[];
  employees?: Employee[];
  subjects?: Subject[];
  enrollments?: Enrollment[];
  requirements?: Requirement[];
  assessments?: StudentAssessment[];
  payments?: Payment[];
  rooms?: Room[];
  sections?: SchoolSection[];
  classSchedules?: ClassSchedule[];
  bookPackages?: BookPackage[];
  learningMaterials?: LearningMaterial[];
  studentLedgerSummaries?: StudentLedgerSummary[];
  financialHolds?: FinancialHold[];
};

export function resolveAcademicUnitScope({
  currentUser,
  activeSchool,
  academicUnit,
}: AcademicScopeInput): AcademicUnitScope {
  const schoolId = currentUser?.schoolId ?? (activeSchool !== "ALL" ? activeSchool : undefined);
  return {
    schoolId,
    department: schoolId ? academicUnitToDepartment(academicUnit) : undefined,
    academicUnit,
    isAllSchools: !schoolId,
  };
}

function matchesSchool(record: { schoolId?: SchoolId }, scope: AcademicUnitScope) {
  return !scope.schoolId || record.schoolId === scope.schoolId;
}

function matchesDepartment(record: { department?: string }, scope: AcademicUnitScope) {
  return !scope.department || record.department === scope.department;
}

export function filterStudentsByAcademicScope(students: Student[], scope: AcademicUnitScope) {
  return students.filter((student) => matchesSchool(student, scope) && matchesDepartment(student, scope));
}

export function filterTeachersByAcademicScope(teachers: Teacher[], scope: AcademicUnitScope) {
  return teachers.filter((teacher) => matchesSchool(teacher, scope) && matchesDepartment(teacher, scope));
}

export function filterEmployeesByAcademicScope(employees: Employee[], scope: AcademicUnitScope) {
  return employees.filter((employee) => matchesSchool(employee, scope));
}

export function filterSubjectsByAcademicScope(subjects: Subject[], scope: AcademicUnitScope) {
  return subjects.filter((subject) => matchesDepartment(subject, scope));
}

export function filterSectionsByAcademicScope(sections: SchoolSection[], scope: AcademicUnitScope) {
  return sections.filter((section) => matchesSchool(section, scope) && matchesDepartment(section, scope));
}

export function filterClassSchedulesByAcademicScope(classSchedules: ClassSchedule[], scope: AcademicUnitScope) {
  // class_schedules has no school_id column; department alone distinguishes STSN from CDSTA
  return classSchedules.filter((schedule) => matchesDepartment(schedule, scope));
}

export function filterBookPackagesByAcademicScope(bookPackages: BookPackage[], scope: AcademicUnitScope) {
  return bookPackages.filter((bookPackage) => {
    if (scope.schoolId && bookPackage.schoolId !== scope.schoolId) return false;
    return scope.isAllSchools || bookPackage.academicUnit === scope.academicUnit;
  });
}

export function filterLearningMaterialsByAcademicScope(learningMaterials: LearningMaterial[], scope: AcademicUnitScope) {
  return learningMaterials.filter((material) => matchesSchool(material, scope));
}

export function filterStudentLinkedRecords<T extends { studentId: string }>(
  records: T[],
  scopedStudents: Student[],
) {
  const studentIds = new Set(scopedStudents.map((student) => student.id));
  return records.filter((record) => studentIds.has(record.studentId));
}

export function filterSchoolRecordsByAcademicScope<T extends { schoolId?: SchoolId }>(
  records: T[],
  scope: AcademicUnitScope,
) {
  return records.filter((record) => matchesSchool(record, scope));
}

export function getAcademicScopedData(input: AcademicScopedDataInput) {
  const scope = resolveAcademicUnitScope(input);
  const students = filterStudentsByAcademicScope(input.students, scope);

  return {
    scope,
    students,
    teachers: input.teachers ? filterTeachersByAcademicScope(input.teachers, scope) : undefined,
    employees: input.employees ? filterEmployeesByAcademicScope(input.employees, scope) : undefined,
    subjects: input.subjects ? filterSubjectsByAcademicScope(input.subjects, scope) : undefined,
    enrollments: input.enrollments ? filterStudentLinkedRecords(input.enrollments, students) : undefined,
    requirements: input.requirements ? filterStudentLinkedRecords(input.requirements, students) : undefined,
    assessments: input.assessments ? filterStudentLinkedRecords(input.assessments, students) : undefined,
    payments: input.payments ? filterStudentLinkedRecords(input.payments, students) : undefined,
    rooms: input.rooms ? filterSchoolRecordsByAcademicScope(input.rooms, scope) : undefined,
    sections: input.sections ? filterSectionsByAcademicScope(input.sections, scope) : undefined,
    classSchedules: input.classSchedules ? filterClassSchedulesByAcademicScope(input.classSchedules, scope) : undefined,
    bookPackages: input.bookPackages ? filterBookPackagesByAcademicScope(input.bookPackages, scope) : undefined,
    learningMaterials: input.learningMaterials
      ? filterLearningMaterialsByAcademicScope(input.learningMaterials, scope)
      : undefined,
    studentLedgerSummaries: input.studentLedgerSummaries
      ? filterStudentLinkedRecords(input.studentLedgerSummaries, students)
      : undefined,
    financialHolds: input.financialHolds ? filterStudentLinkedRecords(input.financialHolds, students) : undefined,
  };
}

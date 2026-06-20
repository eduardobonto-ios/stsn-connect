/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
import { useSTSNStore } from "../../../services/store";
import { Student, Enrollment, Subject, Requirement } from "../../../types";
import {
  FileCheck,
  CheckCircle,
  XCircle,
  FileText,
  UserPlus,
  Compass,
  ArrowRight,
  Printer,
  Search,
  BookOpen,
  Layers,
  Grid,
  Filter,
  UploadCloud,
  FileSpreadsheet,
  UserCheck,
  Cpu,
  GraduationCap,
  Building2,
  School,
  Plus,
  Trash2,
  Users,
  ChevronDown,
  Info,
  Upload,
  ShieldCheck,
  Package,
  DollarSign,
  Calendar,
  CreditCard,
  AlertCircle,
  RefreshCw,
  CheckSquare,
  Clock,
  X,
  Send,
} from "lucide-react";
import { PreviewModal, CORPreview } from "../../../components/ModalPreviews";
import STSNDataTable, {
  type STSNColumn,
} from "../../../components/common/STSNDataTable";
import { useAppDialog } from "../../../components/common/useAppDialog";
import {
  computeMockAssessment,
  generatePaymentSchedule,
  type MockPaymentTerm,
} from "../../../services/mockAssessmentService";
import {
  getAcademicTerms,
  academicUnitToDepartment,
} from "../../../config/schools.config";
import { getBookPackageByGradeLevel } from "../../../utils/resolveBookPackage";
import { BOOK_PACKAGE_STATUS_BADGE } from "../../../config/books.config";
import {
  ASSESSMENT_APPROVAL_STATUS_CONFIG,
  DEFAULT_ASSESSMENT_APPROVAL_STATUS,
} from "../../../config/accounting.config";

const PAYMENT_TERMS = [
  "Cash Basis",
  "Quarterly",
  "Semestral",
  "Installment - 2 Payments",
  "Installment - 4 Payments",
] as const;

function getPaymentSchedule(
  totalAfterDiscount: number,
  term: string,
  schoolYear: string,
): { due: string; amount: number }[] {
  if (term === "Cash Basis")
    return [
      { due: `${schoolYear} — Upon Enrollment`, amount: totalAfterDiscount },
    ];
  if (term === "Quarterly") {
    const q = Math.round(totalAfterDiscount / 4);
    return [
      { due: "1st Quarter (June)", amount: q },
      { due: "2nd Quarter (September)", amount: q },
      { due: "3rd Quarter (December)", amount: q },
      { due: "4th Quarter (March)", amount: totalAfterDiscount - q * 3 },
    ];
  }
  if (term === "Semestral") {
    const half = Math.round(totalAfterDiscount / 2);
    return [
      { due: "1st Semester (June)", amount: half },
      { due: "2nd Semester (November)", amount: totalAfterDiscount - half },
    ];
  }
  if (term === "Installment - 2 Payments") {
    const h = Math.round(totalAfterDiscount / 2);
    return [
      { due: "1st Payment (Enrollment)", amount: h },
      { due: "2nd Payment (Midterm)", amount: totalAfterDiscount - h },
    ];
  }
  if (term === "Installment - 4 Payments") {
    const q = Math.round(totalAfterDiscount / 4);
    return [
      { due: "Downpayment (Enrollment)", amount: q },
      { due: "1st Installment", amount: q },
      { due: "2nd Installment", amount: q },
      { due: "Final Payment", amount: totalAfterDiscount - q * 3 },
    ];
  }
  return [];
}

type SchoolContext = "BASIC_ED" | "COLLEGE";
type DetailTab =
  | "info"
  | "guardian"
  | "academic"
  | "assessment_fees"
  | "documents"
  | "enrollment"
  | "subjects"
  | "curriculum";

export default function RegistrarModule() {
  const {
    students,
    requirements,
    enrollments,
    subjects,
    courses,
    assessments,
    sections,
    currentUser,
    activeSchool,
    academicUnit,
    addStudent,
    updateStudentRequirements,
    submitNewEnrollment,
    approveEnrollment,
    rejectEnrollment,
    assignStudentsToSection,
    updateAssessment,
    updateRequirementUpload,
    verifyRequirement,
    markHardcopySubmitted,
    bookPackages,
    discountOptions,
    paymentTermOptions,
    tuitionFeeSchedule,
    miscFeeSchedule,
    labFeeAdjustments,
    setupData,
  } = useSTSNStore();
  const { toast, prompt } = useAppDialog();

  // Basic-Ed cascading dropdown data — derived from setupData.year_levels (grouped
  // by level range, since level ranges map 1:1 to the BE program categories) and
  // courses (Basic Education strands/department codes).
  const BE_PROGRAM_CATEGORIES: Record<string, string[]> = useMemo(() => {
    const yearLevels = setupData.year_levels ?? [];
    const buckets: [string, [number, number]][] = [
      ["Preschool", [0, 2]],
      ["Primary", [3, 5]],
      ["Intermediate", [6, 8]],
      ["Junior High School", [9, 12]],
      ["Senior High School", [13, 14]],
    ];
    const result: Record<string, string[]> = {};
    for (const [bucketName, [lo, hi]] of buckets) {
      result[bucketName] = yearLevels
        .filter((yl) => typeof yl.level === "number" && yl.level >= lo && yl.level <= hi)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((yl) => yl.name);
    }
    return result;
  }, [setupData.year_levels]);

  const BE_STRANDS_BY_LEVEL: Record<string, string[]> = useMemo(() => {
    const shsStrands = courses.filter((c) => c.department === "Basic Education" && c.durationYears === 2).map((c) => c.code);
    const result: Record<string, string[]> = {};
    for (const level of BE_PROGRAM_CATEGORIES["Preschool"] ?? []) result[level] = ["Preschool"];
    for (const level of [...(BE_PROGRAM_CATEGORIES["Primary"] ?? []), ...(BE_PROGRAM_CATEGORIES["Intermediate"] ?? [])]) result[level] = ["Elementary"];
    for (const level of BE_PROGRAM_CATEGORIES["Junior High School"] ?? []) result[level] = ["Junior High"];
    for (const level of BE_PROGRAM_CATEGORIES["Senior High School"] ?? []) result[level] = shsStrands;
    return result;
  }, [BE_PROGRAM_CATEGORIES, courses]);

  // Academic structure & workflow are driven by the selected school's
  // academic unit, never by the user's role.
  const schoolContext: SchoolContext = useMemo(() => {
    return academicUnit === "college" ? "COLLEGE" : "BASIC_ED";
  }, [academicUnit]);

  // Single source of truth for Basic-Ed vs College terminology.
  const terms = useMemo(() => getAcademicTerms(academicUnit), [academicUnit]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("info");
  const [isNewStudentModalOpen, setIsNewStudentModalOpen] = useState(false);
  const [isCorModalOpen, setIsCorModalOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"directory" | "bulk_import">(
    "directory",
  );

  // Enrollment form states
  const [formStep, setFormStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [gender, setGender] = useState<"Male" | "Female">("Male");
  const [dept, setDept] = useState<"Basic Education" | "College">(
    schoolContext === "COLLEGE" ? "College" : "Basic Education",
  );

  // Basic Ed cascading dropdown
  const [beProgramCategory, setBeProgramCategory] =
    useState("Senior High School");
  const [yearLvl, setYearLvl] = useState("Grade 11");
  const [courseCode, setCourseCode] = useState("STEM");

  // College dropdown
  const [collegeCourse, setCollegeCourse] = useState("BSIT");
  const [collegeYear, setCollegeYear] = useState("1st Year");

  // Step 3 subject setup
  const [selectedSubjectCodes, setSelectedSubjectCodes] = useState<string[]>(
    [],
  );
  const [isIrregular, setIsIrregular] = useState(false);
  const [backSubjects] = useState<
    Array<{ code: string; name: string; sourceSem: string }>
  >([
    { code: "MATH101", name: "College Algebra", sourceSem: "1st Year 1st Sem" },
    {
      code: "ENG102",
      name: "Technical Writing",
      sourceSem: "1st Year 2nd Sem",
    },
  ]);

  // Bulk import states
  const [importType, setImportType] = useState<"masterlist" | "roster">(
    "masterlist",
  );
  const [dragActive, setDragActive] = useState(false);
  const [mockFileName, setMockFileName] = useState<string | null>(null);
  const [mockRowsPreview, setMockRowsPreview] = useState<any[]>([]);
  const [bulkImportSuccess, setBulkImportSuccess] = useState("");

  // Document verification modal
  const [verifyModal, setVerifyModal] = useState<{
    reqName: string;
    studentId: string;
  } | null>(null);
  const [verifyRemarks, setVerifyRemarks] = useState("");

  const contextStudents = useMemo(() => {
    const deptFilter = academicUnitToDepartment(academicUnit);
    return students.filter((s) => s.department === deptFilter);
  }, [students, academicUnit]);

  const filteredStudents = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return contextStudents.filter((s) => {
      const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
      return (
        fullName.includes(query) || s.studentNo.toLowerCase().includes(query)
      );
    });
  }, [contextStudents, searchQuery]);

  const studentReqs = useMemo(
    () =>
      selectedStudent
        ? requirements.filter((r) => r.studentId === selectedStudent.id)
        : [],
    [selectedStudent, requirements],
  );

  const studentAssessment = useMemo(
    () =>
      selectedStudent
        ? assessments.find((a) => a.studentId === selectedStudent.id)
        : undefined,
    [selectedStudent, assessments],
  );

  const isFeesPaid = useMemo(() => {
    if (!studentAssessment) return false;
    return studentAssessment.balance === 0 || studentAssessment.isPaid === true;
  }, [studentAssessment]);

  // Candidate sections for "Clear & Enroll" — narrowed by department, then
  // year level, then strand/program, falling back to broader matches so a
  // section is always offered when one exists for the student's department.
  const matchingSections = useMemo(() => {
    if (!selectedStudent) return [];
    const active = sections.filter(
      (s) => s.isActive && s.department === selectedStudent.department,
    );
    const byYear = active.filter(
      (s) => s.yearLevel === selectedStudent.yearLevel,
    );
    const byTrack = byYear.filter(
      (s) => s.strandOrTrack === selectedStudent.trackOrCourse,
    );
    if (byTrack.length > 0) return byTrack;
    if (byYear.length > 0) return byYear;
    return active;
  }, [sections, selectedStudent]);

  const [selectedSectionId, setSelectedSectionId] = useState("");

  useEffect(() => {
    setSelectedSectionId(matchingSections[0]?.id ?? "");
  }, [selectedStudent?.id, matchingSections]);

  const selectedSection = useMemo(
    () => sections.find((s) => s.id === selectedSectionId),
    [sections, selectedSectionId],
  );

  const handleClearAndEnroll = () => {
    if (!selectedStudent || !selectedSection) return;
    approveEnrollment(`enr-${selectedStudent.id}`, selectedSection.name);
    assignStudentsToSection(selectedSection.id, [selectedStudent.id]);
    setSelectedStudent({
      ...selectedStudent,
      enrollmentStatus: "Enrolled",
      section: selectedSection.name,
    });
    toast(`Approved! Assigned to: ${selectedSection.name}`);
  };

  const handleRejectEnrollment = () => {
    if (!selectedStudent) return;
    rejectEnrollment(`enr-${selectedStudent.id}`);
    setSelectedStudent({ ...selectedStudent, enrollmentStatus: "Rejected" });
    toast("Marked as incomplete.");
  };

  // Fallback mock assessment when no stored assessment exists for the selected student
  const [regDiscountId, setRegDiscountId] = useState("none");
  const [regPaymentTerm, setRegPaymentTerm] =
    useState<MockPaymentTerm>("Quarterly");
  const [includeBooks, setIncludeBooks] = useState(false);
  const [assessmentStatus, setAssessmentStatus] = useState<
    "Draft" | "Pending Accounting Approval"
  >("Draft");
  const regSelectedDiscount =
    discountOptions.find((d) => d.id === regDiscountId) ?? discountOptions[0] ?? { id: "none", label: "None", percentage: 0, badge: "" };
  const isAssessmentLocked = assessmentStatus === "Pending Accounting Approval";

  // Reset preview-only selections whenever the selected student changes
  useEffect(() => {
    setIncludeBooks(false);
    setAssessmentStatus("Draft");
  }, [selectedStudent?.id]);

  // Assigned Grade/Year Level book package — Basic Education only, full package only (no per-title selection)
  const bookPackageResolution = useMemo(() => {
    if (schoolContext !== "BASIC_ED" || !selectedStudent) return {};
    return getBookPackageByGradeLevel(
      bookPackages,
      selectedStudent.yearLevel,
      "2026-2027",
      activeSchool,
    );
  }, [schoolContext, selectedStudent, activeSchool]);
  const bookPackage = bookPackageResolution.package;

  const mockFallbackAssessment = useMemo(
    () =>
      selectedStudent
        ? computeMockAssessment(
            selectedStudent.department,
            selectedStudent.yearLevel ?? "Grade 11",
            selectedStudent.trackOrCourse ?? undefined,
            regSelectedDiscount.percentage,
            regPaymentTerm,
            tuitionFeeSchedule,
            miscFeeSchedule,
            labFeeAdjustments,
            "2026-2027",
          )
        : null,
    [selectedStudent, regSelectedDiscount.percentage, regPaymentTerm, tuitionFeeSchedule, miscFeeSchedule, labFeeAdjustments],
  );

  // Effective assessment = mock fallback + optional Books Package (Basic Ed only)
  const effectiveAssessment = useMemo(() => {
    if (!mockFallbackAssessment) return null;
    if (!includeBooks || !bookPackage) return mockFallbackAssessment;

    const booksFee = {
      feeName: `Books Package - ${bookPackage.gradeLevel}`,
      category: "Books" as const,
      amount: bookPackage.totalAmount,
      isRequired: false,
      note: bookPackage.packageName,
    };
    const fees = [...mockFallbackAssessment.fees, booksFee];
    const grossTotal =
      mockFallbackAssessment.grossTotal + bookPackage.totalAmount;
    const discountAmount = Math.round(
      grossTotal * (regSelectedDiscount.percentage / 100),
    );
    const netPayable = Math.max(0, grossTotal - discountAmount);
    const paymentSchedule = generatePaymentSchedule(
      netPayable,
      regPaymentTerm,
      "2026-2027",
    );

    return {
      ...mockFallbackAssessment,
      fees,
      grossTotal,
      discountAmount,
      netPayable,
      paymentSchedule,
    };
  }, [
    mockFallbackAssessment,
    includeBooks,
    bookPackage,
    regSelectedDiscount.percentage,
    regPaymentTerm,
  ]);

  const getEnrolledSubjects = (studentId: string): Subject[] => {
    const latest = enrollments.find(
      (e) => e.studentId === studentId && e.status === "Enrolled",
    );
    if (!latest) return [];
    return subjects.filter((s) => latest.subjectCodes.includes(s.code));
  };

  const currentAvailableSubjects = useMemo(() => {
    if (dept === "College")
      return subjects.filter(
        (s) => s.department === "College" && s.trackOrCourse === collegeCourse,
      );
    return subjects.filter(
      (s) =>
        s.department === "Basic Education" &&
        s.trackOrCourse === courseCode &&
        s.yearLevel === yearLvl,
    );
  }, [subjects, dept, collegeCourse, courseCode, yearLvl]);

  const selectedSubjectObjects = currentAvailableSubjects.filter((s) =>
    selectedSubjectCodes.includes(s.code),
  );
  const totalUnits = selectedSubjectObjects.reduce(
    (sum, s) => sum + s.units,
    0,
  );

  const handleCreateStudent = () => {
    const finalCourse = dept === "College" ? collegeCourse : courseCode;
    const finalYear = dept === "College" ? collegeYear : yearLvl;
    const baseNewStudent = addStudent({
      firstName,
      lastName,
      middleName,
      gender,
      civilStatus: "Single",
      religion: "Catholic",
      nationality: "Filipino",
      birthday: "2008-01-01",
      birthplace: "Quezon City",
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@stsn.edu.ph`,
      contactNo: "+639170000000",
      address: dept === "College" ? "Novaliches, QC" : "Zabarte Subdivision",
      province: "Metro Manila",
      municipality: "Quezon City",
      zipCode: "1123",
      department: dept,
      yearLevel: finalYear,
      trackOrCourse: finalCourse,
      section: "",
      enrollmentStatus: "Pending",
    });
    submitNewEnrollment({
      studentId: baseNewStudent.id,
      schoolYear: "2026-2027",
      semester: dept === "College" ? "First Semester" : "N/A",
      enrollmentType: "New Student",
      subjectCodes: selectedSubjectCodes,
      status: "Pending",
      submittedAt: new Date().toISOString().replace("T", " ").substring(0, 16),
    });
    setIsNewStudentModalOpen(false);
    setFormStep(1);
    setFirstName("");
    setLastName("");
    setMiddleName("");
    setSelectedSubjectCodes([]);
    setSelectedStudent(baseNewStudent);
  };

  const handleBeCategoryChange = (category: string) => {
    setBeProgramCategory(category);
    const levels = BE_PROGRAM_CATEGORIES[category] || [];
    const newLevel = levels[0] || "";
    setYearLvl(newLevel);
    const strands = BE_STRANDS_BY_LEVEL[newLevel] || ["Elementary"];
    setCourseCode(strands[0]);
  };

  const handleBeYearChange = (level: string) => {
    setYearLvl(level);
    const strands = BE_STRANDS_BY_LEVEL[level] || ["Elementary"];
    if (!strands.includes(courseCode)) setCourseCode(strands[0]);
  };

  const getDetailTabs = (): { id: DetailTab; label: string }[] => {
    if (schoolContext === "BASIC_ED") {
      return [
        { id: "info", label: "Student Info" },
        { id: "guardian", label: "Guardian" },
        { id: "academic", label: "Academic Info" },
        { id: "assessment_fees", label: "Assessment Fees" },
        { id: "documents", label: "Documents" },
        { id: "enrollment", label: "Enrollment" },
      ];
    }
    return [
      { id: "info", label: "Student Info" },
      { id: "academic", label: "Academic Info" },
      { id: "assessment_fees", label: "Assessment Fees" },
      { id: "documents", label: "Documents" },
      { id: "subjects", label: "Subjects" },
      { id: "curriculum", label: "Curriculum" },
    ];
  };

  const mockBulkDrop = () => {
    setMockFileName(
      importType === "masterlist"
        ? "DepEd_Learners_SF9_SHS_ABM_BatchA.xlsx"
        : "Advisory_Class_Roster_Sectioning.xlsx",
    );
    if (importType === "masterlist") {
      setMockRowsPreview([
        {
          colA: "10281940173",
          colB: "Reyes",
          colC: "Cesar Daniel",
          colD: "Gomez",
          colE: schoolContext === "BASIC_ED" ? "Basic Education" : "College",
          colF: schoolContext === "BASIC_ED" ? "STEM" : "BSIT",
          colG: schoolContext === "BASIC_ED" ? "Grade 11" : "1st Year",
          colH: "Novaliches, QC",
          colI: "Elena Reyes",
          colJ: "+639194918204",
        },
        {
          colA: "30294029184",
          colB: "Sy",
          colC: "Jonathan",
          colD: "Co",
          colE: schoolContext === "BASIC_ED" ? "Basic Education" : "College",
          colF: schoolContext === "BASIC_ED" ? "ABM" : "BSCS",
          colG: schoolContext === "BASIC_ED" ? "Grade 12" : "1st Year",
          colH: "Binondo, Manila",
          colI: "Robert Sy",
          colJ: "+639151234567",
        },
        {
          colA: "20148591820",
          colB: "Salvador",
          colC: "Marcus",
          colD: "Reyes",
          colE: schoolContext === "BASIC_ED" ? "Basic Education" : "College",
          colF: schoolContext === "BASIC_ED" ? "HUMSS" : "BSBA",
          colG: schoolContext === "BASIC_ED" ? "Grade 11" : "2nd Year",
          colH: "Caloocan City",
          colI: "Sonia Salvador",
          colJ: "+639228889911",
        },
      ]);
    } else {
      setMockRowsPreview([
        {
          lrn: "10281940173",
          name: "Reyes, Cesar Daniel",
          section: schoolContext === "BASIC_ED" ? "St. Thomas" : "IT101",
          adviser:
            schoolContext === "BASIC_ED"
              ? "Mrs. Beatriz Cruz"
              : "Dr. Jose Mercado",
        },
        {
          lrn: "30294029184",
          name: "Sy, Jonathan",
          section: schoolContext === "BASIC_ED" ? "St. Catherine" : "BA201",
          adviser:
            schoolContext === "BASIC_ED"
              ? "Ms. Elena Soriano"
              : "Prof. Elena Santos",
        },
        {
          lrn: "20148591820",
          name: "Salvador, Marcus",
          section: schoolContext === "BASIC_ED" ? "St. Albert" : "CS101",
          adviser:
            schoolContext === "BASIC_ED"
              ? "Mr. Roel Santos"
              : "Dr. Maria Reyes",
        },
      ]);
    }
  };

  const schoolLabel =
    schoolContext === "BASIC_ED"
      ? "St. Theresa's School of Novaliches"
      : "Colegio de Sta. Teresa de Avila";
  const schoolBadgeClass =
    schoolContext === "BASIC_ED" ? "badge-basic-ed" : "badge-college";

  // Students directory table columns. Memoized so the columns/slots passed
  // to STSNDataTable keep a stable identity across renders (e.g. when
  // selecting a student updates the right-side panel), preventing the
  // underlying DataTable from being cleared/redrawn unnecessarily.
  const studentDirectoryColumns: STSNColumn<Student>[] = useMemo(
    () => [
      {
        title: terms.studentIdLabel,
        data: "studentNo",
        className: `font-mono font-bold text-xs ${schoolContext === "BASIC_ED" ? "text-stsn-brown" : "text-blue-700"}`,
        render: (value) => value,
      },
      {
        title: "Full Name",
        data: "lastName",
        render: (_value, stud) => {
          return (
            <div
              onClick={() => {
                setSelectedStudent(stud);
                setDetailTab("info");
              }}
              className="cursor-pointer transition-all"
            >
              <div className="font-semibold text-stone-900">
                {stud.lastName}, {stud.firstName}
              </div>
              <span className="text-[10px] text-stone-400 block">
                {stud.section ? `Section: ${stud.section}` : "No section"}
              </span>
            </div>
          );
        },
      },
      {
        title: terms.unitNounSingular,
        data: "yearLevel",
        className: "text-stone-600 font-medium",
      },
      {
        title: terms.trackNoun,
        data: "trackOrCourse",
        render: (_value, stud) => (
          <span
            className={`rounded px-2 py-0.5 text-[10.5px] font-bold ${schoolBadgeClass}`}
          >
            {stud.trackOrCourse || "N/A"}
          </span>
        ),
      },
      {
        title: "Status",
        data: "enrollmentStatus",
        className: "text-center",
        searchable: false,
        render: (_value, stud) => (
          <span
            className={`inline-block text-[9.5px] font-bold leading-none px-2 py-1 rounded-full ${
              stud.enrollmentStatus === "Enrolled"
                ? "bg-green-50 text-green-700 border border-green-200"
                : stud.enrollmentStatus === "Approved"
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : stud.enrollmentStatus === "Rejected"
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}
          >
            {stud.enrollmentStatus}
          </span>
        ),
      },
      {
        title: "COR",
        className: "text-right",
        orderable: false,
        searchable: false,
        render: (_value, stud) => {
          const isEnrolled = stud.enrollmentStatus === "Enrolled";
          return (
            <button
              onClick={() => {
                setSelectedStudent(stud);
                if (isEnrolled) setIsCorModalOpen(true);
                else
                  toast(
                    `Status: ${stud.enrollmentStatus}. Complete enrollment first.`,
                  );
              }}
              className={`text-[10px] font-bold px-2 py-1 rounded cursor-pointer transition ${isEnrolled ? (schoolContext === "BASIC_ED" ? "btn-primary-gradient text-white" : "bg-blue-600 hover:bg-blue-700 text-white") : "bg-stone-100 text-stone-400 cursor-not-allowed"}`}
            >
              COR
            </button>
          );
        },
      },
    ],
    [
      terms,
      schoolContext,
      schoolBadgeClass,
      setSelectedStudent,
      setDetailTab,
      setIsCorModalOpen,
      toast,
    ],
  );

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* MODULE HEADER — no manual school switcher, auto-detected */}
      <div
        className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 rounded-xl shadow-sm gap-4 ${schoolContext === "BASIC_ED" ? "bg-white border border-stsn-beige shadow-sm" : "bg-blue-50 border border-blue-200"}`}
      >
        <div>
          <div
            className={`text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded-full border inline-block mb-1.5 ${schoolBadgeClass}`}
          >
            {schoolContext === "BASIC_ED"
              ? "K-12 Basic Education"
              : "Tertiary / College Division"}
          </div>
          <h2 className="text-xl font-display font-semibold text-stone-900 tracking-tight flex items-center gap-2">
            <Compass
              className={`w-5 h-5 ${schoolContext === "BASIC_ED" ? "text-stsn-brown" : "text-blue-600"}`}
            />
            {schoolContext === "BASIC_ED"
              ? "Basic Education Admissions & Enrollment"
              : "College Admissions & Enrollment"}
          </h2>
          <p className="text-stone-500 text-xs mt-1">
            {schoolLabel} • {contextStudents.length} students enrolled •{" "}
            {terms.studentIdLabel} & {terms.trackNoun}
          </p>
        </div>
        <button
          onClick={() => {
            setDept(
              schoolContext === "BASIC_ED" ? "Basic Education" : "College",
            );
            setBeProgramCategory("Senior High School");
            setYearLvl(schoolContext === "BASIC_ED" ? "Grade 11" : "1st Year");
            setCourseCode(schoolContext === "BASIC_ED" ? "STEM" : "BSIT");
            setCollegeCourse("BSIT");
            setCollegeYear("1st Year");
            setIsNewStudentModalOpen(true);
          }}
          className={`text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer shadow flex items-center gap-2 transition ${schoolContext === "BASIC_ED" ? "btn-primary-gradient" : "bg-blue-600 hover:bg-blue-700"}`}
        >
          <UserPlus className="w-4 h-4" />
          Enroll New Candidate
        </button>
      </div>

      {/* SUB-TAB SELECTOR */}
      <div className="flex border-b border-stone-200 bg-white p-2 rounded-xl border border-stsn-beige gap-2">
        <button
          onClick={() => {
            setActiveSubTab("directory");
            setBulkImportSuccess("");
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${activeSubTab === "directory" ? "btn-primary-gradient text-white shadow-sm" : "text-stone-500 hover:text-stone-800 hover:bg-stone-50"}`}
        >
          <Grid className="w-4 h-4" />
          Admissions & Enrollment Directory
        </button>
        <button
          onClick={() => {
            setActiveSubTab("bulk_import");
            setMockFileName(null);
            setMockRowsPreview([]);
            setBulkImportSuccess("");
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${activeSubTab === "bulk_import" ? "btn-primary-gradient text-white shadow-sm" : "text-stone-500 hover:text-stone-800 hover:bg-stone-50"}`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          {terms.bulkImportLabel}
        </button>
      </div>

      {/* ===================== DIRECTORY TAB ===================== */}
      {activeSubTab === "directory" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Left: Students Table */}
          <div className="bg-white p-6 rounded-xl border border-stsn-beige shadow-sm lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center bg-stone-50 p-2.5 rounded-lg border border-stone-200">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 text-stone-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={`Search ${schoolContext === "BASIC_ED" ? "learners" : "college students"} by name or ID...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-md py-1.5 pl-8 pr-3 text-xs focus:ring-1 focus:ring-stsn-brown focus:outline-none font-medium"
                />
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[9px] font-mono px-2 py-0.5 rounded border font-bold ${schoolBadgeClass}`}
                >
                  {schoolContext === "BASIC_ED" ? "Basic Ed" : "College"}
                </span>
                <span className="text-[10px] text-stone-400 font-mono">
                  Found: {filteredStudents.length}
                </span>
              </div>
            </div>

            <STSNDataTable<Student>
              columns={studentDirectoryColumns}
              rows={filteredStudents}
              emptyMessage="No students found."
              onRowClick={(stud) => {
                setSelectedStudent(stud);
                setDetailTab("info");
              }}
            />
          </div>

          {/* Right: Student Detail Panel */}
          <div className="space-y-4">
            {selectedStudent ? (
              <div className="bg-white rounded-xl border border-stsn-beige shadow-sm overflow-hidden animate-fade-in">
                {/* Header */}
                <div
                  className={`p-4 ${schoolContext === "BASIC_ED" ? "bg-gradient-to-r from-stsn-brown-dark to-stsn-brown" : "bg-gradient-to-r from-blue-800 to-blue-600"} text-white`}
                >
                  <span className="text-[9px] font-mono uppercase tracking-widest text-white/70 block">
                    Admissions Desk — {schoolLabel}
                  </span>
                  <h3 className="text-base font-display font-bold text-white mt-1">
                    {selectedStudent.lastName}, {selectedStudent.firstName}
                  </h3>
                  <p className="text-xs text-white/70 mt-0.5">
                    {selectedStudent.studentNo} •{" "}
                    {selectedStudent.trackOrCourse}
                  </p>
                </div>

                {/* Detail Tabs */}
                <div className="flex gap-0.5 bg-stone-50 p-1 border-b border-stone-100 overflow-x-auto">
                  {getDetailTabs().map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setDetailTab(tab.id)}
                      className={`px-2 py-1.5 text-[10px] font-bold rounded-md whitespace-nowrap transition ${
                        detailTab === tab.id
                          ? schoolContext === "BASIC_ED"
                            ? "bg-stsn-brown text-white"
                            : "bg-blue-600 text-white"
                          : "text-stone-500 hover:bg-stone-100"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="p-5 space-y-4">
                  {/* Student Info Tab */}
                  {detailTab === "info" && (
                    <div className="space-y-3 text-xs">
                      <h4 className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest">
                        Personal Information
                      </h4>
                      {[
                        [
                          "Full Name",
                          `${selectedStudent.lastName}, ${selectedStudent.firstName} ${selectedStudent.middleName}`,
                        ],
                        ["Student No.", selectedStudent.studentNo],
                        ["Gender", selectedStudent.gender],
                        [
                          "Contact",
                          selectedStudent.contactNo || "+63 917 000 0000",
                        ],
                        ["Email", selectedStudent.email],
                        ["Address", selectedStudent.address || "N/A"],
                        [
                          "Municipality",
                          selectedStudent.municipality || "Quezon City",
                        ],
                        [
                          "Province",
                          selectedStudent.province || "Metro Manila",
                        ],
                      ].map(([label, val]) => (
                        <div
                          key={label}
                          className="flex justify-between items-start gap-2 py-1.5 border-b border-stone-50"
                        >
                          <span className="text-stone-400 font-mono text-[10px] uppercase flex-shrink-0">
                            {label}:
                          </span>
                          <span
                            className="font-semibold text-stone-800 text-right max-w-[160px] truncate"
                            title={val}
                          >
                            {val}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Guardian Tab — Basic Ed only */}
                  {detailTab === "guardian" && (
                    <div className="space-y-3 text-xs">
                      <h4 className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest">
                        Guardian / Parent Information
                      </h4>
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[10.5px] flex items-start gap-2">
                        <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        <span>
                          Guardian information is required for all Basic
                          Education learners (DepEd mandate).
                        </span>
                      </div>
                      {[
                        ["Guardian / Parent Name", "Mr./Mrs. Guardian Name"],
                        ["Relationship", "Parent / Guardian"],
                        ["Contact No.", "+63 917 000 0000"],
                        ["Home Address", selectedStudent.address || "N/A"],
                        ["Email (optional)", "guardian@email.com"],
                      ].map(([label, val]) => (
                        <div
                          key={label}
                          className="py-1.5 border-b border-stone-50"
                        >
                          <span className="text-stone-400 font-mono text-[9px] uppercase block">
                            {label}
                          </span>
                          <span className="font-semibold text-stone-800">
                            {val}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Academic Info Tab */}
                  {detailTab === "academic" && (
                    <div className="space-y-3 text-xs">
                      <h4 className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest">
                        Academic Information
                      </h4>
                      {[
                        ["Department", selectedStudent.department],
                        [terms.unitNounSingular, selectedStudent.yearLevel],
                        [terms.trackNoun, selectedStudent.trackOrCourse],
                        [
                          terms.groupNoun,
                          selectedStudent.section || "Unassigned",
                        ],
                        ["Enrollment Status", selectedStudent.enrollmentStatus],
                        [terms.enrollmentUnit, "2026-2027"],
                      ].map(([label, val]) => (
                        <div
                          key={label}
                          className="flex justify-between items-center py-1.5 border-b border-stone-50"
                        >
                          <span className="text-stone-400 font-mono text-[10px] uppercase">
                            {label}:
                          </span>
                          <span
                            className={`font-bold px-2 py-0.5 rounded text-[10px] ${val === "Enrolled" ? "bg-green-50 text-green-700 border border-green-200" : "text-stone-800"}`}
                          >
                            {val}
                          </span>
                        </div>
                      ))}
                      {/* Requirements Checklist */}
                      <div className="pt-3">
                        <h4 className="text-[10px] font-display font-semibold text-stone-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-stsn-gold" />
                          Credentials Checklist
                        </h4>
                        <div className="space-y-2">
                          {studentReqs.length === 0 ? (
                            <p className="text-[11px] text-stone-400 italic">
                              No requirements found.
                            </p>
                          ) : (
                            studentReqs.map((req) => (
                              <div
                                key={req.id}
                                className="p-2.5 bg-stone-50 border border-stone-200/80 rounded-lg flex items-center justify-between"
                              >
                                <div>
                                  <span className="text-stone-800 text-xs font-semibold block">
                                    {req.name}
                                  </span>
                                  {req.submittedDate && (
                                    <span className="text-[9px] text-stone-400 font-mono">
                                      {req.submittedDate}
                                    </span>
                                  )}
                                </div>
                                <select
                                  value={req.status}
                                  onChange={(e: any) =>
                                    updateStudentRequirements(
                                      selectedStudent.id,
                                      req.name,
                                      e.target.value,
                                    )
                                  }
                                  className={`text-[10px] font-bold rounded py-0.5 px-1.5 border focus:outline-none cursor-pointer ${req.status === "Submitted" ? "bg-green-50 border-green-200 text-green-700" : req.status === "Rejected" ? "bg-red-50 border-red-200 text-red-700" : "bg-amber-50 border-amber-200 text-amber-700"}`}
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Submitted">Approved</option>
                                  <option value="Rejected">Missing</option>
                                </select>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Assessment Fees Tab */}
                  {detailTab === "assessment_fees" && (
                    <div className="space-y-4 text-xs">
                      <h4 className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5" /> Assessment Fees
                      </h4>

                      {!studentAssessment ? (
                        /* ── MOCK PREVIEW when no stored assessment exists ── */
                        mockFallbackAssessment && effectiveAssessment ? (
                          <div className="space-y-4">
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 text-blue-700 text-[11px]">
                                <Info className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="font-medium">
                                  Assessment Preview — Standard fee schedule
                                  based on student profile. Subject to
                                  Accounting Office confirmation.
                                </span>
                              </div>
                              <span
                                className={`text-[9px] font-bold px-2 py-1 rounded uppercase whitespace-nowrap ${
                                  assessmentStatus === "Draft"
                                    ? "bg-stone-100 text-stone-600 border border-stone-200"
                                    : "bg-amber-50 text-amber-700 border border-amber-200"
                                }`}
                              >
                                {assessmentStatus}
                              </span>
                            </div>

                            {/* Book Package — Basic Education only */}
                            {schoolContext === "BASIC_ED" && (
                              <div className="border border-stone-200 rounded-lg overflow-hidden">
                                <div className="bg-stone-50 px-3 py-2 border-b border-stone-200 flex items-center gap-1.5">
                                  <Package className="w-3.5 h-3.5 text-stsn-brown" />
                                  <span className="text-[10px] font-bold text-stone-600 uppercase">
                                    Book Package
                                  </span>
                                </div>
                                <div className="p-3 space-y-2.5">
                                  {bookPackage ? (
                                    <>
                                      <div className="grid grid-cols-2 gap-2.5 text-[11px]">
                                        <div>
                                          <span className="text-stone-400 block text-[9px] uppercase font-bold">
                                            Package Name
                                          </span>
                                          <span className="font-semibold text-stone-700">
                                            {bookPackage.packageName}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-stone-400 block text-[9px] uppercase font-bold">
                                            Grade Level
                                          </span>
                                          <span className="font-semibold text-stone-700">
                                            {bookPackage.gradeLevel}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-stone-400 block text-[9px] uppercase font-bold">
                                            Number of Books
                                          </span>
                                          <span className="font-semibold text-stone-700">
                                            {bookPackage.books.length}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-stone-400 block text-[9px] uppercase font-bold">
                                            Total Book Amount
                                          </span>
                                          <span className="font-mono font-bold text-stone-800">
                                            ₱
                                            {bookPackage.totalAmount.toLocaleString()}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-stone-400 block text-[9px] uppercase font-bold">
                                            School Year
                                          </span>
                                          <span className="font-semibold text-stone-700">
                                            {bookPackage.schoolYear}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-stone-400 block text-[9px] uppercase font-bold">
                                            Status
                                          </span>
                                          <span
                                            className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded border ${BOOK_PACKAGE_STATUS_BADGE[bookPackage.status].badgeClass}`}
                                          >
                                            {
                                              BOOK_PACKAGE_STATUS_BADGE[
                                                bookPackage.status
                                              ].label
                                            }
                                          </span>
                                        </div>
                                      </div>
                                      <label
                                        className={`flex items-center gap-2 pt-2 border-t border-stone-100 ${isAssessmentLocked ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={includeBooks}
                                          disabled={isAssessmentLocked}
                                          onChange={(e) =>
                                            setIncludeBooks(e.target.checked)
                                          }
                                          className="w-3.5 h-3.5 accent-stsn-brown"
                                        />
                                        <span className="text-[11px] font-semibold text-stone-700">
                                          Avail Books Now
                                        </span>
                                      </label>
                                      {!includeBooks && (
                                        <p className="text-[10px] text-stone-400 italic">
                                          Book package is assigned but not
                                          included in this assessment.
                                        </p>
                                      )}
                                    </>
                                  ) : (
                                    <p className="text-[10px] text-stone-400 italic">
                                      {bookPackageResolution.notice ||
                                        `No book package is configured for ${selectedStudent?.yearLevel}.`}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Fee Breakdown */}
                            <div className="border border-stone-200 rounded-lg overflow-hidden">
                              <div className="bg-stone-50 px-3 py-2 border-b border-stone-200">
                                <span className="text-[10px] font-bold text-stone-600 uppercase">
                                  Fee Breakdown
                                </span>
                              </div>
                              <table className="w-full text-xs">
                                <thead>
                                  <tr
                                    className={`text-white text-[10px] uppercase font-bold ${schoolContext === "BASIC_ED" ? "bg-stsn-brown" : "bg-blue-700"}`}
                                  >
                                    <th className="p-2.5 text-left">
                                      Fee Name
                                    </th>
                                    <th className="p-2.5 text-left">
                                      Category
                                    </th>
                                    <th className="p-2.5 text-right">Amount</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                  {effectiveAssessment.fees.map((fee, i) => (
                                    <tr key={i} className="hover:bg-stone-50">
                                      <td className="p-2.5 font-medium text-stone-700">
                                        {fee.feeName}
                                      </td>
                                      <td className="p-2.5">
                                        <span
                                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                            fee.category === "Tuition"
                                              ? "bg-blue-50 text-blue-700"
                                              : fee.category === "Miscellaneous"
                                                ? "bg-amber-50 text-amber-700"
                                                : fee.category === "Laboratory"
                                                  ? "bg-emerald-50 text-emerald-700"
                                                  : fee.category === "Books"
                                                    ? "bg-purple-50 text-purple-700"
                                                    : "bg-stone-100 text-stone-600"
                                          }`}
                                        >
                                          {fee.category}
                                        </span>
                                      </td>
                                      <td className="p-2.5 text-right font-mono font-bold text-stone-800">
                                        ₱{fee.amount.toLocaleString()}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr className="border-t-2 border-stone-200">
                                    <td
                                      colSpan={2}
                                      className="p-2.5 font-bold text-stone-700"
                                    >
                                      Gross Total
                                    </td>
                                    <td className="p-2.5 text-right font-mono font-black text-stone-900">
                                      ₱
                                      {effectiveAssessment.grossTotal.toLocaleString()}
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>

                            {/* Discount selector */}
                            <div>
                              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1.5">
                                Scholarship / Discount
                              </label>
                              <select
                                value={regDiscountId}
                                onChange={(e) =>
                                  setRegDiscountId(e.target.value)
                                }
                                disabled={isAssessmentLocked}
                                className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                {discountOptions.map((d) => (
                                  <option key={d.id} value={d.id}>
                                    {d.label}
                                    {d.percentage > 0
                                      ? ` (${d.percentage}%)`
                                      : ""}
                                  </option>
                                ))}
                              </select>
                              {regSelectedDiscount.percentage > 0 && (
                                <div className="mt-2 p-2.5 bg-green-50 border border-green-200 rounded-lg flex justify-between items-center">
                                  <span className="text-[11px] text-green-700 font-medium">
                                    {regSelectedDiscount.label}
                                  </span>
                                  <span className="text-[11px] font-mono font-bold text-green-700">
                                    −₱
                                    {effectiveAssessment.discountAmount.toLocaleString()}{" "}
                                    ({regSelectedDiscount.percentage}%)
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Payment Term selector */}
                            <div>
                              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1.5">
                                Payment Term
                              </label>
                              <select
                                value={regPaymentTerm}
                                onChange={(e) =>
                                  setRegPaymentTerm(
                                    e.target.value as MockPaymentTerm,
                                  )
                                }
                                disabled={isAssessmentLocked}
                                className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                {paymentTermOptions.map((t) => (
                                  <option key={t.term} value={t.term}>{t.term}</option>
                                ))}
                              </select>
                            </div>

                            {/* Payment Schedule */}
                            <div className="border border-stone-200 rounded-lg overflow-hidden">
                              <div className="bg-stone-50 px-3 py-2 border-b border-stone-200 flex justify-between items-center">
                                <span className="text-[10px] font-bold text-stone-600 uppercase">
                                  Payment Schedule
                                </span>
                                <span className="text-[10px] font-mono text-stone-500">
                                  {regPaymentTerm}
                                </span>
                              </div>
                              {effectiveAssessment.paymentSchedule.map(
                                (item, i) => (
                                  <div
                                    key={i}
                                    className="flex justify-between items-center px-3 py-2.5 border-b border-stone-100 last:border-none hover:bg-stone-50"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Calendar className="w-3.5 h-3.5 text-stsn-gold flex-shrink-0" />
                                      <div>
                                        <span className="font-medium text-stone-700 text-[11px] block">
                                          {item.dueLabel}
                                        </span>
                                        <span className="text-[9.5px] text-stone-400 font-mono">
                                          {item.dueDate}
                                        </span>
                                      </div>
                                    </div>
                                    <span className="font-mono font-bold text-stsn-brown text-xs">
                                      ₱{item.amount.toLocaleString()}
                                    </span>
                                  </div>
                                ),
                              )}
                              <div className="px-3 py-2.5 bg-stsn-cream flex justify-between font-bold border-t border-stsn-beige">
                                <span className="text-stsn-brown text-xs">
                                  Net Payable
                                </span>
                                <span className="font-mono text-stsn-brown text-xs">
                                  ₱
                                  {effectiveAssessment.netPayable.toLocaleString()}
                                </span>
                              </div>
                            </div>

                            {/* Submit for Accounting Approval */}
                            <div className="flex items-center justify-end gap-2 pt-1">
                              {assessmentStatus === "Draft" ? (
                                <button
                                  onClick={() =>
                                    setAssessmentStatus(
                                      "Pending Accounting Approval",
                                    )
                                  }
                                  className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-2 bg-stsn-brown hover:bg-stsn-brown/90 text-white rounded-lg cursor-pointer transition"
                                >
                                  <CheckSquare className="w-3.5 h-3.5" /> Submit
                                  for Accounting Approval
                                </button>
                              ) : (
                                <span className="text-[10px] text-stone-400 italic flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5" /> Fee editing
                                  is locked while pending Accounting approval.
                                </span>
                              )}
                            </div>
                          </div>
                        ) : null
                      ) : (
                        <>
                          {(() => {
                            const approvalStatus =
                              studentAssessment.approvalStatus ||
                              DEFAULT_ASSESSMENT_APPROVAL_STATUS;
                            const statusCfg =
                              ASSESSMENT_APPROVAL_STATUS_CONFIG[approvalStatus];
                            const isSubmitted =
                              !!studentAssessment.approvalStatus;
                            const canSubmit =
                              !isSubmitted ||
                              approvalStatus === "Returned to Registrar" ||
                              approvalStatus === "Rejected";
                            const isLocked =
                              approvalStatus ===
                                "Pending Accounting Approval" ||
                              approvalStatus === "Approved for Payment";
                            const booksIncluded =
                              !!studentAssessment.booksAvailed;

                            const handleToggleBooks = (checked: boolean) => {
                              if (!bookPackage || isLocked) return;
                              const remainingFees =
                                studentAssessment.fees.filter(
                                  (f) => f.category !== "Books",
                                );
                              const newFees = checked
                                ? [
                                    ...remainingFees,
                                    {
                                      feeName: `Books Package - ${bookPackage.gradeLevel}`,
                                      category: "Books",
                                      amount: bookPackage.totalAmount,
                                    },
                                  ]
                                : remainingFees;
                              const oldNet =
                                studentAssessment.totalAmount -
                                studentAssessment.discountAmount;
                              const paidAmount =
                                oldNet - studentAssessment.balance;
                              const newTotal = newFees.reduce(
                                (sum, f) => sum + f.amount,
                                0,
                              );
                              const newNet =
                                newTotal - studentAssessment.discountAmount;
                              updateAssessment(studentAssessment.id, {
                                fees: newFees,
                                totalAmount: newTotal,
                                balance: Math.max(0, newNet - paidAmount),
                                booksAvailed: checked,
                                bookPackageId: checked
                                  ? bookPackage.id
                                  : undefined,
                              });
                            };

                            const handleSubmitForApproval = () => {
                              const now = new Date()
                                .toISOString()
                                .slice(0, 16)
                                .replace("T", " ");
                              updateAssessment(studentAssessment.id, {
                                approvalStatus: "Pending Accounting Approval",
                                submittedBy: currentUser?.name,
                                submittedDate: now,
                                auditTrail: [
                                  ...(studentAssessment.auditTrail || []),
                                  {
                                    id: `aud-${studentAssessment.id}-${Date.now()}`,
                                    action: isSubmitted
                                      ? "RESUBMITTED_FOR_APPROVAL"
                                      : "SUBMITTED_FOR_APPROVAL",
                                    performedBy:
                                      currentUser?.name || "Registrar",
                                    performedAt: now,
                                    details:
                                      "Assessment submitted to Accounting for approval.",
                                  },
                                ],
                              });
                            };

                            return (
                              <>
                                {/* Approval Status Banner */}
                                <div
                                  className={`p-3 rounded-xl border flex items-start gap-2 ${statusCfg.badgeClass}`}
                                >
                                  {approvalStatus === "Approved for Payment" ? (
                                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                  ) : approvalStatus === "Rejected" ||
                                    approvalStatus ===
                                      "Returned to Registrar" ? (
                                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                  ) : (
                                    <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                  )}
                                  <div className="flex-1">
                                    <span className="text-[10px] font-bold uppercase block">
                                      {statusCfg.label}
                                    </span>
                                    {studentAssessment.submittedBy && (
                                      <span className="text-[10px] block opacity-80">
                                        Submitted by{" "}
                                        {studentAssessment.submittedBy} on{" "}
                                        {studentAssessment.submittedDate}
                                      </span>
                                    )}
                                    {studentAssessment.accountingRemarks && (
                                      <span className="text-[10px] block opacity-80 mt-0.5">
                                        Accounting remarks:{" "}
                                        {studentAssessment.accountingRemarks}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Book Package (Basic Ed only) */}
                                {schoolContext === "BASIC_ED" &&
                                  bookPackage && (
                                    <div className="border border-stone-200 rounded-lg overflow-hidden">
                                      <div className="bg-stone-50 px-3 py-2 border-b border-stone-200 flex items-center gap-1.5">
                                        <Package className="w-3.5 h-3.5 text-stsn-brown" />
                                        <span className="text-[10px] font-bold text-stone-600 uppercase">
                                          Book Package
                                        </span>
                                      </div>
                                      <div className="p-3 space-y-2.5">
                                        <div className="grid grid-cols-2 gap-2.5 text-[11px]">
                                          <div>
                                            <span className="text-stone-400 block text-[9px] uppercase font-bold">
                                              Package Name
                                            </span>
                                            <span className="font-semibold text-stone-700">
                                              {bookPackage.packageName}
                                            </span>
                                          </div>
                                          <div>
                                            <span className="text-stone-400 block text-[9px] uppercase font-bold">
                                              Grade Level
                                            </span>
                                            <span className="font-semibold text-stone-700">
                                              {bookPackage.gradeLevel}
                                            </span>
                                          </div>
                                          <div>
                                            <span className="text-stone-400 block text-[9px] uppercase font-bold">
                                              Number of Books
                                            </span>
                                            <span className="font-semibold text-stone-700">
                                              {bookPackage.books.length}
                                            </span>
                                          </div>
                                          <div>
                                            <span className="text-stone-400 block text-[9px] uppercase font-bold">
                                              Total Book Amount
                                            </span>
                                            <span className="font-mono font-bold text-stone-800">
                                              ₱
                                              {bookPackage.totalAmount.toLocaleString()}
                                            </span>
                                          </div>
                                          <div>
                                            <span className="text-stone-400 block text-[9px] uppercase font-bold">
                                              School Year
                                            </span>
                                            <span className="font-semibold text-stone-700">
                                              {bookPackage.schoolYear}
                                            </span>
                                          </div>
                                          <div>
                                            <span className="text-stone-400 block text-[9px] uppercase font-bold">
                                              Status
                                            </span>
                                            <span
                                              className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded border ${BOOK_PACKAGE_STATUS_BADGE[bookPackage.status].badgeClass}`}
                                            >
                                              {
                                                BOOK_PACKAGE_STATUS_BADGE[
                                                  bookPackage.status
                                                ].label
                                              }
                                            </span>
                                          </div>
                                        </div>
                                        <label
                                          className={`flex items-center gap-2 pt-2 border-t border-stone-100 ${isLocked ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={booksIncluded}
                                            disabled={isLocked}
                                            onChange={(e) =>
                                              handleToggleBooks(
                                                e.target.checked,
                                              )
                                            }
                                            className="w-3.5 h-3.5 accent-stsn-brown"
                                          />
                                          <span className="text-[11px] font-semibold text-stone-700">
                                            Avail Books Now
                                          </span>
                                        </label>
                                        {!booksIncluded && (
                                          <p className="text-[10px] text-stone-400 italic">
                                            Book package is assigned but not
                                            included in this assessment.
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                {/* Tuition & Misc Fees */}
                                <div className="border border-stone-200 rounded-lg overflow-hidden">
                                  <div className="bg-stone-50 px-3 py-2 border-b border-stone-200">
                                    <span className="text-[10px] font-bold text-stone-600 uppercase">
                                      Fee Breakdown
                                    </span>
                                  </div>
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr
                                        className={`text-white text-[10px] uppercase font-bold ${schoolContext === "BASIC_ED" ? "bg-stsn-brown" : "bg-blue-700"}`}
                                      >
                                        <th className="p-2.5 text-left">
                                          Fee Name
                                        </th>
                                        <th className="p-2.5 text-left">
                                          Category
                                        </th>
                                        <th className="p-2.5 text-right">
                                          Amount
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-100">
                                      {studentAssessment.fees.map((fee, i) => (
                                        <tr
                                          key={i}
                                          className="hover:bg-stone-50"
                                        >
                                          <td className="p-2.5 font-medium text-stone-700">
                                            {fee.feeName}
                                          </td>
                                          <td className="p-2.5">
                                            <span
                                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                                fee.category === "Tuition"
                                                  ? "bg-blue-50 text-blue-700"
                                                  : fee.category ===
                                                      "Miscellaneous"
                                                    ? "bg-amber-50 text-amber-700"
                                                    : fee.category ===
                                                        "Laboratory"
                                                      ? "bg-emerald-50 text-emerald-700"
                                                      : fee.category === "Books"
                                                        ? "bg-purple-50 text-purple-700"
                                                        : "bg-stone-100 text-stone-600"
                                              }`}
                                            >
                                              {fee.category}
                                            </span>
                                          </td>
                                          <td className="p-2.5 text-right font-mono font-bold text-stone-800">
                                            ₱{fee.amount.toLocaleString()}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                    <tfoot>
                                      <tr className="border-t-2 border-stone-200">
                                        <td
                                          colSpan={2}
                                          className="p-2.5 font-bold text-stone-700"
                                        >
                                          Gross Total
                                        </td>
                                        <td className="p-2.5 text-right font-mono font-black text-stone-900">
                                          ₱
                                          {studentAssessment.totalAmount.toLocaleString()}
                                        </td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                </div>

                                {/* Discounts */}
                                {studentAssessment.discountPercentage > 0 && (
                                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <span className="text-[10px] font-bold text-green-700 uppercase block">
                                          Discount Applied
                                        </span>
                                        <span className="text-[11px] text-green-600">
                                          {studentAssessment.scholarshipName ||
                                            "Scholarship"}
                                        </span>
                                      </div>
                                      <div className="text-right">
                                        <span className="text-[10px] text-green-700 font-bold">
                                          {studentAssessment.discountPercentage}
                                          %
                                        </span>
                                        <span className="text-[10px] text-green-600 block font-mono">
                                          −₱
                                          {studentAssessment.discountAmount.toLocaleString()}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Payment Terms */}
                                <div>
                                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1.5">
                                    Payment Term
                                  </label>
                                  <select
                                    value={studentAssessment.paymentTerm}
                                    onChange={(e: any) =>
                                      updateAssessment(studentAssessment.id, {
                                        paymentTerm: e.target.value,
                                      })
                                    }
                                    disabled={isLocked}
                                    className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown disabled:bg-stone-100 disabled:text-stone-400 disabled:cursor-not-allowed"
                                  >
                                    {PAYMENT_TERMS.map((t) => (
                                      <option key={t}>{t}</option>
                                    ))}
                                  </select>
                                  {isLocked && (
                                    <span className="text-[10px] text-stone-400 italic flex items-center gap-1.5 mt-1">
                                      <Clock className="w-3.5 h-3.5" /> Payment
                                      term is locked while the assessment is in
                                      the Accounting approval workflow.
                                    </span>
                                  )}
                                </div>

                                {/* Payment Schedule */}
                                {(() => {
                                  const netAmount =
                                    studentAssessment.totalAmount -
                                    studentAssessment.discountAmount;
                                  const schedule = getPaymentSchedule(
                                    netAmount,
                                    studentAssessment.paymentTerm,
                                    studentAssessment.schoolYear,
                                  );
                                  return (
                                    <div className="border border-stone-200 rounded-lg overflow-hidden">
                                      <div className="bg-stone-50 px-3 py-2 border-b border-stone-200 flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-stone-600 uppercase">
                                          Payment Schedule
                                        </span>
                                        <span className="text-[10px] font-mono text-stone-500">
                                          {studentAssessment.paymentTerm}
                                        </span>
                                      </div>
                                      {schedule.map((item, i) => (
                                        <div
                                          key={i}
                                          className="flex justify-between items-center px-3 py-2.5 border-b border-stone-100 last:border-none hover:bg-stone-50"
                                        >
                                          <div className="flex items-center gap-2">
                                            <Calendar className="w-3.5 h-3.5 text-stsn-gold flex-shrink-0" />
                                            <span className="font-medium text-stone-700">
                                              {item.due}
                                            </span>
                                          </div>
                                          <span className="font-mono font-bold text-stsn-brown">
                                            ₱{item.amount.toLocaleString()}
                                          </span>
                                        </div>
                                      ))}
                                      <div className="px-3 py-2 bg-stsn-cream flex justify-between font-bold border-t border-stsn-beige">
                                        <span className="text-stsn-brown">
                                          Net Payable
                                        </span>
                                        <span className="font-mono text-stsn-brown">
                                          ₱{netAmount.toLocaleString()}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })()}

                                {/* Balance & Paid Status */}
                                <div
                                  className={`p-3 rounded-xl border flex items-center justify-between ${isFeesPaid ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}
                                >
                                  <div className="flex items-center gap-2">
                                    {isFeesPaid ? (
                                      <CheckCircle className="w-4 h-4 text-green-600" />
                                    ) : (
                                      <AlertCircle className="w-4 h-4 text-amber-600" />
                                    )}
                                    <div>
                                      <span
                                        className={`text-[10px] font-bold uppercase block ${isFeesPaid ? "text-green-700" : "text-amber-700"}`}
                                      >
                                        {isFeesPaid
                                          ? "Assessment Cleared"
                                          : "Balance Outstanding"}
                                      </span>
                                      <span
                                        className={`text-xs font-mono font-black ${isFeesPaid ? "text-green-800" : "text-amber-800"}`}
                                      >
                                        ₱
                                        {studentAssessment.balance.toLocaleString()}
                                      </span>
                                    </div>
                                  </div>
                                  {!isFeesPaid && (
                                    <button
                                      onClick={() =>
                                        updateAssessment(studentAssessment.id, {
                                          balance: 0,
                                          isPaid: true,
                                        })
                                      }
                                      className="text-[10px] font-bold px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg cursor-pointer transition"
                                    >
                                      Mark Paid
                                    </button>
                                  )}
                                </div>

                                {/* Submit / Resubmit for Accounting Approval */}
                                {canSubmit && (
                                  <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div>
                                      <span className="text-[10px] font-bold text-stone-600 uppercase block">
                                        {isSubmitted
                                          ? "Returned for Revision"
                                          : "Ready to Submit"}
                                      </span>
                                      <span className="text-[10px] text-stone-500">
                                        {isSubmitted
                                          ? "Resolve the remarks above, then resubmit this assessment to Accounting."
                                          : "Accounting must approve this assessment before the Cashier can collect payment."}
                                      </span>
                                    </div>
                                    <button
                                      onClick={handleSubmitForApproval}
                                      className="flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-2 bg-stsn-brown hover:bg-stsn-brown-dark text-stsn-cream rounded-lg cursor-pointer transition flex-shrink-0"
                                    >
                                      <Send className="w-3.5 h-3.5" />{" "}
                                      {isSubmitted
                                        ? "Resubmit for Approval"
                                        : "Submit for Accounting Approval"}
                                    </button>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </>
                      )}
                    </div>
                  )}

                  {/* Documents Tab */}
                  {detailTab === "documents" && (
                    <div className="space-y-3 text-xs">
                      <h4 className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" /> Document
                        Requirements
                      </h4>
                      <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-700 text-[10.5px] flex items-start gap-2">
                        <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        <span>
                          Review student-uploaded documents. You can verify,
                          reject, or mark hardcopy as submitted.
                        </span>
                      </div>
                      {studentReqs.length === 0 ? (
                        <p className="text-stone-400 italic text-[11px]">
                          No requirements found for this student.
                        </p>
                      ) : (
                        studentReqs.map((req) => (
                          <div
                            key={req.id}
                            className="border border-stone-200 rounded-xl overflow-hidden"
                          >
                            {/* Document Header */}
                            <div className="px-3 py-2 bg-stone-50 border-b border-stone-100 flex justify-between items-start">
                              <div>
                                <span className="text-xs font-bold text-stone-800">
                                  {req.name}
                                </span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {/* Upload status */}
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${req.uploadStatus === "Uploaded" ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-stone-100 text-stone-500"}`}
                                  >
                                    {req.uploadStatus === "Uploaded"
                                      ? "Uploaded"
                                      : "Not Uploaded"}
                                  </span>
                                  {/* Verification status */}
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${req.verificationStatus === "Verified" ? "bg-green-50 text-green-700 border border-green-200" : req.verificationStatus === "Rejected" ? "bg-red-50 text-red-700 border border-red-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}
                                  >
                                    {req.verificationStatus ||
                                      "Pending Verification"}
                                  </span>
                                  {/* Hardcopy status */}
                                  {req.hardcopySubmitted && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                                      Hardcopy ✓
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Details */}
                            <div className="px-3 py-2.5 space-y-1.5 text-[10.5px]">
                              {req.uploadFileName && (
                                <div className="flex items-center gap-1.5 text-stone-600">
                                  <FileText className="w-3 h-3 text-stsn-gold flex-shrink-0" />
                                  <span className="font-medium">
                                    {req.uploadFileName}
                                  </span>
                                  {req.uploadDate && (
                                    <span className="text-stone-400 font-mono ml-auto">
                                      {req.uploadDate}
                                    </span>
                                  )}
                                </div>
                              )}
                              {req.verifiedBy && (
                                <div className="text-stone-500 font-mono text-[9px]">
                                  Verified by: {req.verifiedBy}{" "}
                                  {req.verifiedAt ? `• ${req.verifiedAt}` : ""}
                                </div>
                              )}
                              {req.hardcopySubmittedDate && (
                                <div className="text-purple-600 font-mono text-[9px]">
                                  Hardcopy submitted:{" "}
                                  {req.hardcopySubmittedDate}
                                </div>
                              )}
                              {req.remarks && (
                                <div className="text-stone-500 italic text-[10px]">
                                  Remarks: {req.remarks}
                                </div>
                              )}
                            </div>

                            {/* Registrar Actions */}
                            <div className="px-3 pb-2.5 flex flex-wrap gap-1.5">
                              {req.uploadStatus === "Uploaded" &&
                                req.verificationStatus !== "Verified" && (
                                  <>
                                    <button
                                      onClick={() => {
                                        verifyRequirement(
                                          selectedStudent.id,
                                          req.name,
                                          "Verified",
                                          currentUser?.name || "Registrar",
                                        );
                                      }}
                                      className="text-[9px] font-bold px-2.5 py-1 bg-green-50 border border-green-200 text-green-700 rounded-lg hover:bg-green-100 cursor-pointer flex items-center gap-1 transition"
                                    >
                                      <ShieldCheck className="w-3 h-3" /> Verify
                                    </button>
                                    <button
                                      onClick={async () => {
                                        const remarks =
                                          (await prompt(
                                            "Rejection reason (optional):",
                                          )) || "";
                                        verifyRequirement(
                                          selectedStudent.id,
                                          req.name,
                                          "Rejected",
                                          currentUser?.name || "Registrar",
                                          remarks,
                                        );
                                      }}
                                      className="text-[9px] font-bold px-2.5 py-1 bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100 cursor-pointer flex items-center gap-1 transition"
                                    >
                                      <XCircle className="w-3 h-3" /> Reject
                                    </button>
                                  </>
                                )}
                              {!req.hardcopySubmitted && (
                                <button
                                  onClick={() =>
                                    markHardcopySubmitted(
                                      selectedStudent.id,
                                      req.name,
                                    )
                                  }
                                  className="text-[9px] font-bold px-2.5 py-1 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-100 cursor-pointer flex items-center gap-1 transition"
                                >
                                  <Package className="w-3 h-3" /> Mark Hardcopy
                                  Submitted
                                </button>
                              )}
                              {/* Simulate upload for registrar testing */}
                              {!req.uploadStatus && (
                                <button
                                  onClick={() =>
                                    updateRequirementUpload(
                                      selectedStudent.id,
                                      req.name,
                                      `${req.name.replace(/\s+/g, "_")}_scan.pdf`,
                                    )
                                  }
                                  className="text-[9px] font-bold px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 cursor-pointer flex items-center gap-1 transition"
                                >
                                  <Upload className="w-3 h-3" /> Simulate Upload
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Enrollment Tab — Basic Ed */}
                  {detailTab === "enrollment" && (
                    <div className="space-y-3 text-xs">
                      <h4 className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest">
                        Enrollment Management
                      </h4>
                      <div className="p-3 bg-stsn-cream border border-stsn-beige rounded-xl space-y-2">
                        <div className="flex justify-between">
                          <span className="text-stone-400">
                            {terms.enrollmentUnit}:
                          </span>
                          <strong>2026-2027</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-400">
                            Enrollment Type:
                          </span>
                          <strong>
                            {enrollments.find(
                              (e) => e.studentId === selectedStudent.id,
                            )?.enrollmentType || "New Student"}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-400">Status:</span>
                          <span
                            className={`font-bold px-2 py-0.5 rounded text-[10px] ${selectedStudent.enrollmentStatus === "Enrolled" ? "bg-green-50 text-green-700 border border-green-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}
                          >
                            {selectedStudent.enrollmentStatus}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-400">Fees Paid:</span>
                          <span
                            className={`font-bold text-[10px] ${isFeesPaid ? "text-green-600" : "text-amber-600"}`}
                          >
                            {isFeesPaid ? "Yes — Cleared" : "No — Outstanding"}
                          </span>
                        </div>
                      </div>

                      {!isFeesPaid && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-amber-800 text-[10.5px]">
                          <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                          <span>
                            Assessment fees must be cleared before enrollment
                            can be approved. Go to the{" "}
                            <strong>Assessment Fees</strong> tab to process
                            payment.
                          </span>
                        </div>
                      )}

                      {selectedStudent.enrollmentStatus !== "Enrolled" && (
                        <>
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1.5">
                              Assign {terms.groupNoun}
                            </label>
                            {matchingSections.length === 0 ? (
                              <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-400 italic text-[11px]">
                                No active {terms.groupNoun.toLowerCase()}{" "}
                                available for {selectedStudent.yearLevel} /{" "}
                                {selectedStudent.trackOrCourse}.
                              </div>
                            ) : (
                              <select
                                value={selectedSectionId}
                                onChange={(e) =>
                                  setSelectedSectionId(e.target.value)
                                }
                                className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown"
                              >
                                {matchingSections.map((sec) => (
                                  <option key={sec.id} value={sec.id}>
                                    {sec.name} ({sec.yearLevel}{" "}
                                    {sec.strandOrTrack
                                      ? `• ${sec.strandOrTrack}`
                                      : ""}
                                    ) — {sec.currentCount}/{sec.capacity}
                                    {sec.currentCount >= sec.capacity
                                      ? " • FULL"
                                      : ""}
                                  </option>
                                ))}
                              </select>
                            )}
                            {selectedSection &&
                              selectedSection.currentCount >=
                                selectedSection.capacity && (
                                <p className="text-[10px] text-amber-600 font-semibold mt-1">
                                  This {terms.groupNoun.toLowerCase()} is at
                                  full capacity.
                                </p>
                              )}
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-2">
                            <button
                              disabled={!isFeesPaid || !selectedSection}
                              onClick={handleClearAndEnroll}
                              title={
                                !isFeesPaid
                                  ? "Assessment fees must be paid first"
                                  : !selectedSection
                                    ? `No ${terms.groupNoun.toLowerCase()} available`
                                    : "Clear and Enroll"
                              }
                              className={`text-white text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-1 transition ${isFeesPaid && selectedSection ? "btn-primary-gradient cursor-pointer" : "bg-stone-300 cursor-not-allowed opacity-60"}`}
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Clear & Enroll
                            </button>
                            <button
                              onClick={handleRejectEnrollment}
                              className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-semibold py-2 rounded-lg cursor-pointer flex items-center justify-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Incomplete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Subjects Tab — College */}
                  {detailTab === "subjects" && (
                    <div className="space-y-3 text-xs">
                      <h4 className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest">
                        Subject Load Selection
                      </h4>
                      {(() => {
                        const enrolled = getEnrolledSubjects(
                          selectedStudent.id,
                        );
                        return (
                          <>
                            <table className="w-full text-left text-[11px] border border-stone-100 rounded-lg overflow-hidden">
                              <thead>
                                <tr className="bg-blue-700 text-white text-[9px] uppercase font-bold">
                                  <th className="p-2">Code</th>
                                  <th className="p-2">Subject</th>
                                  <th className="p-2 text-center">Units</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-stone-100">
                                {enrolled.length === 0 ? (
                                  <tr>
                                    <td
                                      colSpan={3}
                                      className="p-3 text-center text-stone-400 italic"
                                    >
                                      No subjects loaded.
                                    </td>
                                  </tr>
                                ) : (
                                  enrolled.map((sub) => (
                                    <tr
                                      key={sub.id}
                                      className="hover:bg-stone-50"
                                    >
                                      <td className="p-2 font-mono font-bold text-blue-700">
                                        {sub.code}
                                      </td>
                                      <td className="p-2 text-stone-700">
                                        {sub.name}
                                      </td>
                                      <td className="p-2 text-center font-bold">
                                        {sub.units}
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                            {enrolled.length > 0 && (
                              <div className="p-2 bg-blue-50 border border-blue-100 rounded-lg flex justify-between text-[10.5px] font-bold text-blue-800">
                                <span>Total Subjects: {enrolled.length}</span>
                                <span>
                                  Total Units:{" "}
                                  {enrolled.reduce(
                                    (s, sub) => s + sub.units,
                                    0,
                                  )}
                                </span>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {/* Curriculum Tab — College */}
                  {detailTab === "curriculum" && (
                    <div className="space-y-3 text-xs">
                      <h4 className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest">
                        Curriculum Assignment
                      </h4>
                      <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg space-y-2">
                        <div className="flex justify-between">
                          <span className="text-stone-400">Program:</span>
                          <strong>{selectedStudent.trackOrCourse}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-400">Year Level:</span>
                          <strong>{selectedStudent.yearLevel}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-400">Curriculum:</span>
                          <strong>
                            {selectedStudent.trackOrCourse} v3 (2026)
                          </strong>
                        </div>
                      </div>
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <span className="text-green-800 font-bold text-[10px] uppercase block">
                          Curriculum Assigned
                        </span>
                        <p className="text-green-700 text-[10.5px] mt-1">
                          Standard {selectedStudent.trackOrCourse} curriculum
                          auto-assigned.
                        </p>
                      </div>

                      {!isFeesPaid && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-amber-800 text-[10.5px]">
                          <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                          <span>
                            Assessment fees must be cleared before enrollment.
                            Visit <strong>Assessment Fees</strong> tab.
                          </span>
                        </div>
                      )}

                      {selectedStudent.enrollmentStatus !== "Enrolled" && (
                        <>
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1.5">
                              Assign {terms.groupNoun}
                            </label>
                            {matchingSections.length === 0 ? (
                              <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-400 italic text-[11px]">
                                No active {terms.groupNoun.toLowerCase()}{" "}
                                available for {selectedStudent.yearLevel} /{" "}
                                {selectedStudent.trackOrCourse}.
                              </div>
                            ) : (
                              <select
                                value={selectedSectionId}
                                onChange={(e) =>
                                  setSelectedSectionId(e.target.value)
                                }
                                className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                {matchingSections.map((sec) => (
                                  <option key={sec.id} value={sec.id}>
                                    {sec.name} ({sec.yearLevel}{" "}
                                    {sec.strandOrTrack
                                      ? `• ${sec.strandOrTrack}`
                                      : ""}
                                    ) — {sec.currentCount}/{sec.capacity}
                                    {sec.currentCount >= sec.capacity
                                      ? " • FULL"
                                      : ""}
                                  </option>
                                ))}
                              </select>
                            )}
                            {selectedSection &&
                              selectedSection.currentCount >=
                                selectedSection.capacity && (
                                <p className="text-[10px] text-amber-600 font-semibold mt-1">
                                  This {terms.groupNoun.toLowerCase()} is at
                                  full capacity.
                                </p>
                              )}
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-2">
                            <button
                              disabled={!isFeesPaid || !selectedSection}
                              onClick={handleClearAndEnroll}
                              title={
                                !isFeesPaid
                                  ? "Assessment fees must be paid first"
                                  : !selectedSection
                                    ? `No ${terms.groupNoun.toLowerCase()} available`
                                    : "Clear and Enroll"
                              }
                              className={`text-white text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-1 transition ${isFeesPaid && selectedSection ? "bg-blue-600 hover:bg-blue-700 cursor-pointer" : "bg-stone-300 cursor-not-allowed opacity-60"}`}
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Clear & Enroll
                            </button>
                            <button
                              onClick={handleRejectEnrollment}
                              className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-semibold py-2 rounded-lg cursor-pointer flex items-center justify-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white p-12 rounded-xl border border-stsn-beige shadow-sm text-center">
                <FileCheck className="w-10 h-10 text-stone-300 mx-auto" />
                <p className="text-xs text-stone-400 mt-2 font-medium">
                  Select a student from the directory to view their admissions
                  detail.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== BULK IMPORT TAB ===================== */}
      {activeSubTab === "bulk_import" && (
        <div className="bg-white p-6 border border-stsn-beige rounded-xl shadow-sm space-y-6 animate-fade-in">
          <div className="border-b border-stone-100 pb-4">
            <h3 className="text-base font-display font-bold text-stone-900 flex items-center gap-2">
              <FileSpreadsheet
                className={`w-5 h-5 ${schoolContext === "BASIC_ED" ? "text-stsn-brown" : "text-blue-600"}`}
              />
              {schoolContext === "BASIC_ED"
                ? "DepEd Learner Excel Upload Portal"
                : "CHEd College Student Masterlist Upload"}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(["masterlist", "roster"] as const).map((type) => (
              <div
                key={type}
                onClick={() => {
                  setImportType(type);
                  setMockFileName(null);
                  setMockRowsPreview([]);
                  setBulkImportSuccess("");
                }}
                className={`p-4 border rounded-xl cursor-pointer transition ${importType === type ? "card-gold-accent border-stsn-brown shadow-sm" : "border-stone-200 bg-stone-50 text-stone-500 hover:bg-stone-50/50"}`}
              >
                <h4 className="text-xs font-bold uppercase text-stsn-brown-dark flex items-center gap-1.5">
                  {type === "masterlist" ? (
                    <UserPlus className="w-4 h-4" />
                  ) : (
                    <Layers className="w-4 h-4" />
                  )}
                  {type === "masterlist"
                    ? "Option A: Masterlist Batch Upload"
                    : "Option B: Advisory Roster Assignments"}
                </h4>
                <p className="text-[11px] text-stone-500 mt-2">
                  {type === "masterlist"
                    ? "Registers new student accounts with automatic ID generation."
                    : "Imports section-to-student assignments to update enrollment rosters."}
                </p>
              </div>
            ))}
          </div>

          {!mockFileName ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                mockBulkDrop();
              }}
              onClick={mockBulkDrop}
              className={`p-10 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition ${dragActive ? "border-stsn-gold bg-stsn-cream/30" : "border-stone-300 hover:border-stone-400"}`}
            >
              <UploadCloud
                className={`w-12 h-12 ${schoolContext === "BASIC_ED" ? "text-stsn-brown" : "text-blue-600"}`}
              />
              <p className="text-stone-700 text-xs font-bold mt-3">
                Drag & drop your Excel file here, or click to browse
              </p>
              <p className="text-stone-400 text-[10px] uppercase font-mono mt-1">
                Conforming Excel format (.xlsx, .csv) up to 50MB
              </p>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center bg-stone-50 p-3 rounded-lg border border-stone-200">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  <div>
                    <span className="font-mono text-xs font-bold block text-stone-800">
                      {mockFileName}
                    </span>
                    <span className="text-[10px] text-green-700 font-bold">
                      ✓ Parsed — {mockRowsPreview.length} records found.
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMockFileName(null);
                    setMockRowsPreview([]);
                    setBulkImportSuccess("");
                  }}
                  className="text-[10px] font-bold text-red-600 hover:underline cursor-pointer"
                >
                  Change File
                </button>
              </div>

              <div className="overflow-x-auto border border-stone-200 rounded-lg max-h-[290px]">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr
                      className={`text-white font-mono text-[9px] uppercase border-b ${schoolContext === "BASIC_ED" ? "bg-stsn-brown" : "bg-blue-700"}`}
                    >
                      {importType === "masterlist"
                        ? [
                            "LRN",
                            "Surname",
                            "First Name",
                            "Middle",
                            "Dept",
                            "Strand/Course",
                            "Year Level",
                            "Address",
                            "Guardian",
                            "Contact",
                            "Cols K–AQ",
                          ].map((h) => (
                            <th
                              key={h}
                              className="p-2 border-r border-white/20"
                            >
                              {h}
                            </th>
                          ))
                        : [
                            "LRN",
                            "Full Name",
                            "Section",
                            "Adviser",
                            "Validation",
                          ].map((h) => (
                            <th
                              key={h}
                              className="p-2 border-r border-white/20"
                            >
                              {h}
                            </th>
                          ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {importType === "masterlist"
                      ? mockRowsPreview.map((row, idx) => (
                          <tr key={idx} className="hover:bg-stone-50">
                            <td
                              className={`p-2 font-bold font-mono text-[10.5px] ${schoolContext === "BASIC_ED" ? "text-stsn-brown" : "text-blue-700"}`}
                            >
                              {row.colA}
                            </td>
                            <td className="p-2 font-bold">{row.colB}</td>
                            <td className="p-2">{row.colC}</td>
                            <td className="p-2 text-stone-400">{row.colD}</td>
                            <td className="p-2 font-mono text-[10px]">
                              {row.colE}
                            </td>
                            <td className="p-2 font-bold">{row.colF}</td>
                            <td className="p-2">{row.colG}</td>
                            <td className="p-2 text-stone-500 truncate max-w-[100px]">
                              {row.colH}
                            </td>
                            <td className="p-2 text-stone-500">{row.colI}</td>
                            <td className="p-2 font-mono">{row.colJ}</td>
                            <td className="p-2 text-stone-300 italic font-mono text-[10px]">
                              Mapped tags
                            </td>
                          </tr>
                        ))
                      : mockRowsPreview.map((row, idx) => (
                          <tr key={idx} className="hover:bg-stone-50">
                            <td
                              className={`p-2 font-bold font-mono text-[10.5px] ${schoolContext === "BASIC_ED" ? "text-stsn-brown" : "text-blue-700"}`}
                            >
                              {row.lrn}
                            </td>
                            <td className="p-2 font-bold">{row.name}</td>
                            <td className="p-2 font-mono font-bold text-green-700">
                              {row.section}
                            </td>
                            <td className="p-2">{row.adviser}</td>
                            <td className="p-2 text-green-700 font-mono text-[10px]">
                              Ready (Matched)
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-stsn-cream p-4 border border-stsn-beige rounded-xl flex justify-between items-center">
                <div className="text-xs text-stone-600">
                  <strong className="text-stsn-brown uppercase font-mono text-[10px] block">
                    Academic Integrity Check
                  </strong>
                  <span className="text-[11px]">
                    Committing will register {mockRowsPreview.length} students
                    in "Pending" status.
                  </span>
                </div>
                <button
                  onClick={() =>
                    setBulkImportSuccess(
                      `Success: ${mockRowsPreview.length} students batch-registered under ${schoolLabel}.`,
                    )
                  }
                  className={`text-white text-xs font-bold px-4 py-2.5 rounded-lg inline-flex items-center gap-1.5 cursor-pointer shadow-md ${schoolContext === "BASIC_ED" ? "btn-primary-gradient" : "bg-blue-600 hover:bg-blue-700"}`}
                >
                  <Cpu className="w-4 h-4" /> Commit & Authorize
                </button>
              </div>

              {bulkImportSuccess && (
                <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-xs font-bold rounded-xl flex items-center gap-2.5">
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                  <div>
                    <h5 className="font-extrabold uppercase">
                      Transaction Complete
                    </h5>
                    <p className="text-[11px] font-medium text-green-600 mt-0.5">
                      {bulkImportSuccess}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===================== ENROLLMENT FORM MODAL ===================== */}
      {isNewStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div
              className={`text-white p-4 flex items-center justify-between ${schoolContext === "BASIC_ED" ? "modal-header-gradient" : "bg-gradient-to-r from-blue-800 to-blue-600"}`}
            >
              <h3 className="font-display font-semibold text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-stsn-gold" />
                {schoolContext === "BASIC_ED" ? "Basic Ed" : "College"} Student
                Enrollment Form
              </h3>
              <button
                onClick={() => setIsNewStudentModalOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Step indicators */}
            <div className="flex justify-between items-center px-6 py-3 bg-stone-50 border-b border-stone-100">
              {["Basic Details", "Academic Setup", "Subject Setup"].map(
                (step, idx) => (
                  <React.Fragment key={step}>
                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${formStep >= idx + 1 ? (schoolContext === "BASIC_ED" ? "bg-stsn-brown text-white" : "bg-blue-600 text-white") : "bg-stone-200 text-stone-500"}`}
                      >
                        {idx + 1}
                      </span>
                      <span
                        className={
                          formStep >= idx + 1
                            ? "text-stone-900 font-bold"
                            : "text-stone-400"
                        }
                      >
                        {step}
                      </span>
                    </div>
                    {idx < 2 && (
                      <div className="flex-1 h-px bg-stone-200 mx-2" />
                    )}
                  </React.Fragment>
                ),
              )}
            </div>

            <div className="p-6 bg-stsn-cream flex-1 overflow-y-auto space-y-4">
              {/* STEP 1 */}
              {formStep === 1 && (
                <div className="space-y-4 bg-white p-5 rounded-xl border border-stsn-beige animate-fade-in">
                  <h4 className="text-xs font-bold text-stsn-brown uppercase">
                    Student Biometrics
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Dela Cruz"
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 px-2.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-stsn-gold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Maria"
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 px-2.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-stsn-gold"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
                        Middle Name
                      </label>
                      <input
                        type="text"
                        value={middleName}
                        onChange={(e) => setMiddleName(e.target.value)}
                        placeholder="Santos"
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 px-2.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-stsn-gold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
                        Gender *
                      </label>
                      <select
                        value={gender}
                        onChange={(e: any) => setGender(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 px-2.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-stsn-gold"
                      >
                        <option>Male</option>
                        <option>Female</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      disabled={!firstName || !lastName}
                      onClick={() => setFormStep(2)}
                      className={`disabled:bg-stone-300 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1 ${schoolContext === "BASIC_ED" ? "btn-primary-gradient" : "bg-blue-600 hover:bg-blue-700"}`}
                    >
                      Continue <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2 */}
              {formStep === 2 && (
                <div className="space-y-4 bg-white p-5 rounded-xl border border-stsn-beige animate-fade-in">
                  <h4 className="text-xs font-bold text-stsn-brown uppercase">
                    Academic Program Setup
                  </h4>
                  {schoolContext === "BASIC_ED" ? (
                    <>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
                          Program Category
                        </label>
                        <select
                          value={beProgramCategory}
                          onChange={(e) =>
                            handleBeCategoryChange(e.target.value)
                          }
                          className="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 px-2.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-stsn-gold"
                        >
                          {Object.keys(BE_PROGRAM_CATEGORIES).map((cat) => (
                            <option key={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
                          Year Level / Grade
                        </label>
                        <select
                          value={yearLvl}
                          onChange={(e) => handleBeYearChange(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 px-2.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-stsn-gold"
                        >
                          {(BE_PROGRAM_CATEGORIES[beProgramCategory] || []).map(
                            (lvl) => (
                              <option key={lvl}>{lvl}</option>
                            ),
                          )}
                        </select>
                      </div>
                      {(BE_STRANDS_BY_LEVEL[yearLvl] || []).length > 1 && (
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
                            Strand / Track
                          </label>
                          <select
                            value={courseCode}
                            onChange={(e) => setCourseCode(e.target.value)}
                            className="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 px-2.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-stsn-gold"
                          >
                            {(BE_STRANDS_BY_LEVEL[yearLvl] || []).map((s) => (
                              <option key={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
                          College Program
                        </label>
                        <select
                          value={collegeCourse}
                          onChange={(e) => setCollegeCourse(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 px-2.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {courses
                            .filter((c) => c.department === "College")
                            .map((c) => (
                              <option key={c.id} value={c.code}>
                                {c.code} — {c.name}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
                          Year Level
                        </label>
                        <select
                          value={collegeYear}
                          onChange={(e) => setCollegeYear(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 px-2.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {["1st Year", "2nd Year", "3rd Year", "4th Year"].map(
                            (y) => (
                              <option key={y}>{y}</option>
                            ),
                          )}
                        </select>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between pt-2">
                    <button
                      onClick={() => setFormStep(1)}
                      className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => {
                        const defaults = subjects
                          .filter((s) => {
                            if (schoolContext === "COLLEGE")
                              return (
                                s.department === "College" &&
                                s.trackOrCourse === collegeCourse
                              );
                            return (
                              s.department === "Basic Education" &&
                              s.trackOrCourse === courseCode &&
                              s.yearLevel === yearLvl
                            );
                          })
                          .map((s) => s.code);
                        setSelectedSubjectCodes(defaults);
                        setFormStep(3);
                      }}
                      className={`text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1 ${schoolContext === "BASIC_ED" ? "btn-primary-gradient" : "bg-blue-600 hover:bg-blue-700"}`}
                    >
                      Subject Setup <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3 */}
              {formStep === 3 && (
                <div className="space-y-4 bg-white p-5 rounded-xl border border-stsn-beige animate-fade-in">
                  <div className="flex justify-between items-center pb-2 border-b border-stone-100">
                    <h4 className="text-xs font-bold text-stsn-brown uppercase">
                      Subject Load Setup
                    </h4>
                    {schoolContext === "COLLEGE" && (
                      <button
                        onClick={() => setIsIrregular(!isIrregular)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer ${isIrregular ? "bg-amber-50 border-amber-300 text-amber-700" : "bg-stone-50 border-stone-200 text-stone-500"}`}
                      >
                        {isIrregular
                          ? "✓ Irregular Student"
                          : "Mark as Irregular"}
                      </button>
                    )}
                  </div>
                  <div className="border border-stone-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr
                          className={`text-[10px] font-bold uppercase text-white ${schoolContext === "BASIC_ED" ? "bg-stsn-brown" : "bg-blue-600"}`}
                        >
                          <th className="p-2.5">Code</th>
                          <th className="p-2.5">Subject</th>
                          <th className="p-2.5 text-center">
                            {schoolContext === "COLLEGE" ? "Units" : "Type"}
                          </th>
                          <th className="p-2.5 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {currentAvailableSubjects.length === 0 ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="p-4 text-center text-stone-400 italic"
                            >
                              No subjects available for this level.
                            </td>
                          </tr>
                        ) : (
                          currentAvailableSubjects.map((sub) => {
                            const isSel = selectedSubjectCodes.includes(
                              sub.code,
                            );
                            return (
                              <tr
                                key={sub.id}
                                className={`hover:bg-stone-50 ${isSel ? "bg-stsn-cream/30" : ""}`}
                              >
                                <td
                                  className={`p-2.5 font-mono font-bold text-[11px] ${schoolContext === "BASIC_ED" ? "text-stsn-brown" : "text-blue-700"}`}
                                >
                                  {sub.code}
                                </td>
                                <td className="p-2.5 text-stone-700 font-medium">
                                  {sub.name}
                                </td>
                                <td className="p-2.5 text-center font-bold font-mono">
                                  {schoolContext === "COLLEGE"
                                    ? sub.units || "—"
                                    : "K-12"}
                                </td>
                                <td className="p-2.5 text-center">
                                  <button
                                    onClick={() =>
                                      isSel
                                        ? setSelectedSubjectCodes(
                                            selectedSubjectCodes.filter(
                                              (c) => c !== sub.code,
                                            ),
                                          )
                                        : setSelectedSubjectCodes([
                                            ...selectedSubjectCodes,
                                            sub.code,
                                          ])
                                    }
                                    className={`text-[9px] font-bold px-2 py-0.5 rounded border cursor-pointer transition ${isSel ? "bg-red-50 border-red-200 text-red-600" : "bg-green-50 border-green-200 text-green-700"}`}
                                  >
                                    {isSel ? "Remove" : "Add"}
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div
                    className={`p-3 rounded-lg border text-xs font-mono flex justify-between items-center ${schoolContext === "BASIC_ED" ? "bg-stsn-cream border-stsn-beige text-stsn-brown" : "bg-blue-50 border-blue-100 text-blue-800"}`}
                  >
                    <span>
                      Total Subjects:{" "}
                      <strong>{selectedSubjectCodes.length}</strong>
                    </span>
                    {schoolContext === "COLLEGE" && (
                      <span>
                        Total Units: <strong>{totalUnits}</strong>
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between pt-2">
                    <button
                      onClick={() => setFormStep(2)}
                      className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleCreateStudent}
                      className={`text-white text-xs font-bold px-5 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer ${schoolContext === "BASIC_ED" ? "btn-gold-gradient" : "bg-green-600 hover:bg-green-700"}`}
                    >
                      <CheckCircle className="w-4 h-4" /> Finalize Registration
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* COR MODAL — dynamic logo based on school context */}
      <PreviewModal
        isOpen={isCorModalOpen}
        onClose={() => setIsCorModalOpen(false)}
        title="Student Registration Card (COR)"
      >
        {selectedStudent && (
          <CORPreview
            student={selectedStudent}
            subjects={getEnrolledSubjects(selectedStudent.id)}
          />
        )}
      </PreviewModal>
    </div>
  );
}

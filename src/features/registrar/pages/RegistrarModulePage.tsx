/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useSTSNStore } from "../../../services/store";
import { Student, Enrollment, Subject, Requirement, SetupItem } from "../../../types";
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
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Download,
} from "lucide-react";
import { PreviewModal, CORPreview } from "../../../components/ModalPreviews";
import STSNDataTable, {
  type STSNColumn,
} from "../../../components/common/STSNDataTable";
import { useAppDialog } from "../../../components/common/useAppDialog";
import { getAcademicScopedData } from "../../../services/academicUnitScopeService";
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
import type { RegistrarImportPreviewRow, RegistrarImportSummary } from "../types/studentImport.types";
import { parseRegistrarStudentCsvTemplate } from "../utils/studentImportParser";

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

type DocumentPreviewKind = "image" | "pdf" | "office" | "unsupported";

function getDocumentPreviewKind(fileName: string): DocumentPreviewKind {
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension || "")) return "image";
  if (extension === "pdf") return "pdf";
  if (["doc", "docx"].includes(extension || "")) return "office";
  return "unsupported";
}

const BASIC_ED_PROGRAM_CATEGORY_ORDER = [
  "Preschool",
  "Primary",
  "Intermediate",
  "Junior High School",
  "Senior High School",
] as const;

const DEFAULT_BE_PROGRAM_CATEGORIES: Record<string, string[]> = {
  Preschool: ["Kinder 1", "Kinder 2"],
  Primary: ["Grade 1", "Grade 2", "Grade 3"],
  Intermediate: ["Grade 4", "Grade 5", "Grade 6"],
  "Junior High School": ["Grade 7", "Grade 8", "Grade 9", "Grade 10"],
  "Senior High School": ["Grade 11", "Grade 12"],
};

function getGradeNumber(levelName: string): number | null {
  const match = levelName.match(/^Grade\s+(\d+)$/i);
  return match ? Number(match[1]) : null;
}

function getBasicEdProgramCategory(level: SetupItem): string | null {
  const name = String(level.name ?? "");
  const code = String(level.code ?? "").toUpperCase();
  const academicLevel = String(level.academicLevel ?? "").toLowerCase();
  const gradeNumber = getGradeNumber(name);

  if (academicLevel.includes("college")) return null;
  if (academicLevel.includes("senior") || code === "G11" || code === "G12" || (gradeNumber !== null && gradeNumber >= 11)) {
    return "Senior High School";
  }
  if (academicLevel.includes("junior") || (gradeNumber !== null && gradeNumber >= 7 && gradeNumber <= 10)) {
    return "Junior High School";
  }
  if (academicLevel.includes("preschool") || /^(nursery|kinder)/i.test(name)) {
    return "Preschool";
  }
  if (gradeNumber !== null && gradeNumber >= 1 && gradeNumber <= 3) return "Primary";
  if (gradeNumber !== null && gradeNumber >= 4 && gradeNumber <= 6) return "Intermediate";
  if (academicLevel.includes("elementary")) return "Primary";
  return null;
}

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
    ensureStudentRequirements,
    submitNewEnrollment,
    approveEnrollment,
    rejectEnrollment,
    assignStudentsToSection,
    updateAssessment,
    uploadRequirementFile,
    verifyRequirement,
    markHardcopySubmitted,
    getRequirementFileUrl,
    bookPackages,
    discountOptions,
    paymentTermOptions,
    tuitionFeeSchedule,
    miscFeeSchedule,
    labFeeAdjustments,
    setupData,
  } = useSTSNStore();
  const { toast, confirm, prompt } = useAppDialog();

  // Basic-Ed cascading dropdown data — derived from setupData.year_levels (grouped
  // by level range, since level ranges map 1:1 to the BE program categories) and
  // courses (Basic Education strands/department codes).
  const BE_PROGRAM_CATEGORIES: Record<string, string[]> = useMemo(() => {
    const yearLevels = setupData.year_levels ?? [];
    const result: Record<string, string[]> = { ...DEFAULT_BE_PROGRAM_CATEGORIES };
    for (const category of BASIC_ED_PROGRAM_CATEGORY_ORDER) {
      const levels = yearLevels
        .filter((yl) => getBasicEdProgramCategory(yl) === category)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((yl) => yl.name)
        .filter(Boolean);
      if (levels.length > 0) result[category] = levels;
    }
    return result;
  }, [setupData.year_levels]);

  const BE_STRANDS_BY_LEVEL: Record<string, string[]> = useMemo(() => {
    const shsStrands = courses.filter((c) => c.department === "Basic Education" && c.durationYears === 2).map((c) => c.code);
    const seniorHighStrands = shsStrands.length > 0 ? shsStrands : ["STEM", "HUMSS", "ABM", "GAS"];
    const result: Record<string, string[]> = {};
    for (const level of BE_PROGRAM_CATEGORIES["Preschool"] ?? []) result[level] = ["Preschool"];
    for (const level of [...(BE_PROGRAM_CATEGORIES["Primary"] ?? []), ...(BE_PROGRAM_CATEGORIES["Intermediate"] ?? [])]) result[level] = ["Elementary"];
    for (const level of BE_PROGRAM_CATEGORIES["Junior High School"] ?? []) result[level] = ["Junior High"];
    for (const level of BE_PROGRAM_CATEGORIES["Senior High School"] ?? []) result[level] = seniorHighStrands;
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
  const [mockRowsPreview, setMockRowsPreview] = useState<RegistrarImportPreviewRow[]>([]);
  const [importSummary, setImportSummary] = useState<RegistrarImportSummary | null>(null);
  const [bulkImportSuccess, setBulkImportSuccess] = useState("");
  const importFileInputRef = useRef<HTMLInputElement>(null);

  // Document verification modal
  const [verifyModal, setVerifyModal] = useState<{
    reqName: string;
    studentId: string;
  } | null>(null);
  const [verifyRemarks, setVerifyRemarks] = useState("");
  const documentUploadInputRef = useRef<HTMLInputElement>(null);
  const [pendingDocumentUpload, setPendingDocumentUpload] = useState<{
    studentId: string;
    reqName: Requirement["name"];
  } | null>(null);
  const [uploadingRequirementKey, setUploadingRequirementKey] = useState<string | null>(null);
  const [documentPreview, setDocumentPreview] = useState<{
    fileName: string;
    url: string;
    kind: DocumentPreviewKind;
  } | null>(null);
  const [documentZoom, setDocumentZoom] = useState(1);

  const contextStudents = useMemo(() => {
    return getAcademicScopedData({ currentUser, activeSchool, academicUnit, students }).students;
  }, [students, currentUser, activeSchool, academicUnit]);

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

  useEffect(() => {
    if (selectedStudent) ensureStudentRequirements(selectedStudent.id);
  }, [selectedStudent?.id, ensureStudentRequirements]);

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
    const byYear = sections.filter(
      (s) =>
        s.isActive &&
        s.department === selectedStudent.department &&
        s.yearLevel === selectedStudent.yearLevel,
    );
    const byTrack = byYear.filter(
      (s) => s.strandOrTrack === selectedStudent.trackOrCourse,
    );
    if (byTrack.length > 0) return byTrack;
    return byYear;
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
    const packageSchool = activeSchool === "ALL" ? selectedStudent.schoolId ?? "STSN" : activeSchool;
    return getBookPackageByGradeLevel(
      bookPackages,
      selectedStudent.yearLevel,
      "2026-2027",
      packageSchool,
    );
  }, [schoolContext, selectedStudent, activeSchool]);
  const bookPackage = bookPackageResolution.package;

  const mockFallbackAssessment = useMemo(() => {
    if (!selectedStudent) return null;

    // Use fee items configured in Core Setup > Fee Items when available
    const feeItems = setupData.fee_items ?? [];
    const feeCategories = setupData.fee_categories ?? [];
    const yearLevels = setupData.year_levels ?? [];
    if (feeItems.length > 0) {
      const catByCode = new Map(feeCategories.map((c) => [c.code, c.name]));
      const legacyMap: Record<string, string> = {
        "fc-1": "Tuition", "fc-2": "Miscellaneous", "fc-3": "Laboratory",
        "fc-4": "Other", "fc-5": "Other", "fc-6": "Other",
      };
      const resolveCategory = (catId: string) =>
        catByCode.get(catId) ?? legacyMap[catId] ?? catId;

      // When year-level-mapped tuition items exist for Basic Ed, use year-level matching
      // so only ONE tuition fee is shown — the one for the student's year level.
      const isBasicEd = selectedStudent.department === "Basic Education";
      const hasYearLevelTuition = isBasicEd && feeItems.some(
        (item) => item.isActive !== false &&
          resolveCategory((item.categoryId as string) ?? "") === "Tuition" &&
          item.yearLevel
      );

      const fees = feeItems
        .filter((item) => item.isActive !== false)
        .filter((item) => {
          const catName = resolveCategory((item.categoryId as string) ?? "");
          if (catName === "Penalty") return false;
          if (catName === "Tuition" && isBasicEd && hasYearLevelTuition) {
            const itemYearLevelCode = item.yearLevel as string | undefined;
            if (!itemYearLevelCode) return false;
            const resolved = yearLevels.find((yl) => yl.code === itemYearLevelCode)?.name ?? itemYearLevelCode;
            return resolved === selectedStudent.yearLevel;
          }
          if (selectedStudent.department === "Basic Education" && (item.code as string)?.startsWith("COL")) return false;
          if (selectedStudent.department === "College" && (item.code as string)?.startsWith("SHS")) return false;
          return true;
        })
        .map((item) => {
          const catName = resolveCategory((item.categoryId as string) ?? "");
          const category: "Tuition" | "Laboratory" | "Miscellaneous" | "Other" | "Books" =
            catName === "Tuition" ? "Tuition" :
            catName === "Laboratory" ? "Laboratory" :
            catName === "Miscellaneous" ? "Miscellaneous" : "Other";
          return { feeName: item.name, category, amount: Number(item.amount) || 0, isRequired: true };
        });

      const grossTotal = fees.reduce((s, f) => s + f.amount, 0);
      const discountAmount = Math.round(grossTotal * (regSelectedDiscount.percentage / 100));
      const netPayable = Math.max(0, grossTotal - discountAmount);
      return {
        fees,
        tuitionTotal: fees.filter((f) => f.category === "Tuition").reduce((s, f) => s + f.amount, 0),
        labTotal: fees.filter((f) => f.category === "Laboratory").reduce((s, f) => s + f.amount, 0),
        miscTotal: fees.filter((f) => f.category === "Miscellaneous").reduce((s, f) => s + f.amount, 0),
        grossTotal, discountAmount, netPayable,
        paymentSchedule: generatePaymentSchedule(netPayable, regPaymentTerm, "2026-2027"),
      };
    }

    return computeMockAssessment(
      selectedStudent.department,
      selectedStudent.yearLevel ?? "Grade 11",
      selectedStudent.trackOrCourse ?? undefined,
      regSelectedDiscount.percentage,
      regPaymentTerm,
      tuitionFeeSchedule,
      miscFeeSchedule,
      labFeeAdjustments,
      "2026-2027",
    );
  }, [selectedStudent, regSelectedDiscount.percentage, regPaymentTerm, tuitionFeeSchedule, miscFeeSchedule, labFeeAdjustments, setupData.fee_items, setupData.fee_categories, setupData.year_levels]);

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

  const triggerRequirementUpload = (
    studentId: string,
    reqName: Requirement["name"],
  ) => {
    setPendingDocumentUpload({ studentId, reqName });
    documentUploadInputRef.current?.click();
  };

  const handleRequirementFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    const pending = pendingDocumentUpload;
    event.target.value = "";
    setPendingDocumentUpload(null);
    if (!file || !pending) return;

    const uploadKey = `${pending.studentId}:${pending.reqName}`;
    setUploadingRequirementKey(uploadKey);
    try {
      await uploadRequirementFile(pending.studentId, pending.reqName, file);
      toast(`${pending.reqName} uploaded successfully.`, {
        title: "Document Uploaded",
        variant: "success",
      });
    } catch (error) {
      console.error("[documents] upload failed:", error);
      toast(
        error instanceof Error
          ? error.message
          : "The document could not be uploaded.",
        { title: "Upload Failed", variant: "danger" },
      );
    } finally {
      setUploadingRequirementKey(null);
    }
  };

  const handleViewRequirementFile = async (
    studentId: string,
    reqName: Requirement["name"],
  ) => {
    try {
      const url = await getRequirementFileUrl(studentId, reqName);
      const req = requirements.find(
        (r) => r.studentId === studentId && r.name === reqName,
      );
      const fileName = req?.uploadFileName || reqName;
      setDocumentPreview({
        fileName,
        url,
        kind: getDocumentPreviewKind(fileName),
      });
      setDocumentZoom(1);
    } catch (error) {
      console.error("[documents] view failed:", error);
      toast(
        error instanceof Error
          ? error.message
          : "The document could not be opened.",
        { title: "Document Unavailable", variant: "danger" },
      );
    }
  };

  const handleDownloadRequirementFile = async () => {
    if (!documentPreview) return;
    try {
      const response = await fetch(documentPreview.url);
      if (!response.ok) throw new Error("The document could not be downloaded.");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = documentPreview.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("[documents] download failed:", error);
      toast(
        error instanceof Error
          ? error.message
          : "The document could not be downloaded.",
        { title: "Download Failed", variant: "danger" },
      );
    }
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

  const resetImportPreview = () => {
    setMockFileName(null);
    setMockRowsPreview([]);
    setImportSummary(null);
    setBulkImportSuccess("");
  };

  const handleImportFile = async (file: File) => {
    resetImportPreview();
    if (importType !== "masterlist") {
      toast("Roster assignment imports are not implemented yet.");
      return;
    }
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast("Please use the CSV template for this first import preview. XLSX parsing is a later step.");
      return;
    }

    const text = await file.text();
    const parsed = parseRegistrarStudentCsvTemplate(text);
    const existingLrns = new Set(contextStudents.map((student) => student.lrn?.trim()).filter(Boolean));
    const rows = parsed.rows.map((row) => {
      if (!row.lrn || !existingLrns.has(row.lrn.trim()) || row.importStatus === "duplicate") return row;
      return {
        ...row,
        importStatus: "duplicate" as const,
        errors: [...row.errors, "LRN already exists in student directory"],
      };
    });
    setMockFileName(file.name);
    setMockRowsPreview(rows);
    setImportSummary(summarizeImportRows(rows));
  };

  const getImportStatusClass = (status: RegistrarImportPreviewRow["importStatus"]) => {
    if (status === "valid") return "bg-green-50 text-green-700 border-green-200";
    if (status === "warning") return "bg-amber-50 text-amber-700 border-amber-200";
    if (status === "duplicate") return "bg-purple-50 text-purple-700 border-purple-200";
    if (status === "error") return "bg-red-50 text-red-700 border-red-200";
    return "bg-stone-50 text-stone-600 border-stone-200";
  };

  const summarizeImportRows = (rows: RegistrarImportPreviewRow[]): RegistrarImportSummary => ({
    totalRows: rows.length,
    validRows: rows.filter((row) => row.importStatus === "valid").length,
    warningRows: rows.filter((row) => row.importStatus === "warning").length,
    errorRows: rows.filter((row) => row.importStatus === "error").length,
    duplicateRows: rows.filter((row) => row.importStatus === "duplicate").length,
  });

  const escapeCsvValue = (value: string | number | undefined): string => {
    const text = String(value ?? "");
    if (!/[",\r\n]/.test(text)) return text;
    return `"${text.replace(/"/g, '""')}"`;
  };

  const buildImportRowsCsv = (rows: RegistrarImportPreviewRow[]): string => {
    const headers = [
      "Row No.",
      "LRN",
      "Student Name",
      "Gender",
      "Birthdate",
      "Year Level",
      "Strand/Track",
      "Stage",
      "Status",
      "Errors",
      "Warnings",
    ];
    const csvRows = rows.map((row) =>
      [
        row.sheetRowNumber,
        row.lrn,
        row.fullName,
        row.gender,
        row.birthday,
        row.yearLevel,
        row.trackOrCourse,
        row.academicStage,
        row.importStatus,
        row.errors.join("; "),
        row.warnings.join("; "),
      ].map(escapeCsvValue).join(","),
    );
    return [headers.join(","), ...csvRows].join("\r\n");
  };

  const downloadImportRows = (rows: RegistrarImportPreviewRow[], fileName: string) => {
    if (rows.length === 0) {
      toast("No rows available to download.");
      return;
    }
    const blob = new Blob([buildImportRowsCsv(rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCommitImportRows = async () => {
    const rowsToCommit = mockRowsPreview.filter((row) => row.importStatus === "valid" || row.importStatus === "warning");
    const excludedRows = mockRowsPreview.filter((row) => row.importStatus === "error" || row.importStatus === "duplicate");
    if (rowsToCommit.length === 0) {
      toast("No valid or warning rows are available to upload.", { variant: "warning" });
      return;
    }

    const confirmed = await confirm(
      `Upload ${rowsToCommit.length} student record(s)? ${excludedRows.length} error/duplicate row(s) will be excluded.`,
      {
        title: "Commit Registrar Import",
        variant: "warning",
        confirmText: "Upload Valid Rows",
        cancelText: "Review Again",
      },
    );
    if (!confirmed) return;

    const committedRows = new Set<RegistrarImportPreviewRow>();
    rowsToCommit.forEach((row) => {
      addStudent({
        schoolId: activeSchool === "STSN" || activeSchool === "CDSTA" ? activeSchool : currentUser?.schoolId,
        lrn: row.lrn,
        firstName: row.firstName ?? "",
        lastName: row.lastName ?? "",
        middleName: row.middleName ?? "",
        gender: row.gender === "Female" ? "Female" : "Male",
        civilStatus: "Single",
        religion: "",
        nationality: "Filipino",
        birthday: row.birthday ?? "",
        birthplace: "",
        email: "",
        contactNo: "",
        address: "",
        province: "",
        municipality: "",
        zipCode: "",
        department: "Basic Education",
        yearLevel: row.yearLevel ?? "",
        trackOrCourse: row.trackOrCourse ?? "",
        section: "",
        enrollmentStatus: "Pending",
      });
      committedRows.add(row);
    });

    const nextRows = mockRowsPreview.map((row) =>
      committedRows.has(row) ? { ...row, importStatus: "committed" as const } : row,
    );
    setMockRowsPreview(nextRows);
    setImportSummary(summarizeImportRows(nextRows));
    setBulkImportSuccess(
      `Uploaded ${rowsToCommit.length} student record(s). ${excludedRows.length} error/duplicate row(s) were excluded.`,
    );
    toast(`Uploaded ${rowsToCommit.length} student record(s).`, { variant: "success" });
  };

  const importErrorRows = useMemo(
    () => mockRowsPreview.filter((row) => row.importStatus === "error"),
    [mockRowsPreview],
  );
  const importDuplicateRows = useMemo(
    () => mockRowsPreview.filter((row) => row.importStatus === "duplicate"),
    [mockRowsPreview],
  );
  const importCommittableRows = useMemo(
    () => mockRowsPreview.filter((row) => row.importStatus === "valid" || row.importStatus === "warning"),
    [mockRowsPreview],
  );

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
            resetImportPreview();
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
              searchable={false}
              selectedId={selectedStudent?.id}
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
                      <input
                        ref={documentUploadInputRef}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        className="hidden"
                        onChange={handleRequirementFileSelect}
                      />
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
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleViewRequirementFile(
                                        selectedStudent.id,
                                        req.name,
                                      )
                                    }
                                    className="font-medium text-left text-stsn-brown hover:text-stsn-brown-dark hover:underline inline-flex items-center gap-1 min-w-0"
                                    title="View uploaded document"
                                  >
                                    <span className="truncate">
                                      {req.uploadFileName}
                                    </span>
                                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                  </button>
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
                              {!req.hardcopySubmitted &&
                                req.verificationStatus !== "Verified" && (
                                <button
                                  disabled={
                                    uploadingRequirementKey ===
                                    `${selectedStudent.id}:${req.name}`
                                  }
                                  onClick={() =>
                                    triggerRequirementUpload(
                                      selectedStudent.id,
                                      req.name,
                                    )
                                  }
                                  className={`text-[9px] font-bold px-2.5 py-1 border rounded-lg flex items-center gap-1 transition ${
                                    uploadingRequirementKey ===
                                    `${selectedStudent.id}:${req.name}`
                                      ? "bg-stone-100 border-stone-200 text-stone-400 cursor-wait"
                                      : "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 cursor-pointer"
                                  }`}
                                >
                                  <Upload className="w-3 h-3" />
                                  {uploadingRequirementKey ===
                                  `${selectedStudent.id}:${req.name}`
                                    ? "Uploading..."
                                    : req.uploadStatus === "Uploaded"
                                      ? "Replace File"
                                      : "Upload Document"}
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
          <div className="border-b border-stone-100 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-display font-bold text-stone-900 flex items-center gap-2">
                <FileSpreadsheet
                  className={`w-5 h-5 ${schoolContext === "BASIC_ED" ? "text-stsn-brown" : "text-blue-600"}`}
                />
                {schoolContext === "BASIC_ED"
                  ? "DepEd Learner Excel Upload Portal"
                  : "CHEd College Student Masterlist Upload"}
              </h3>
              <p className="text-[11px] text-stone-500 mt-1">
                Use the official template so LRN, Grade 11/12 strand, guardian, requirement, and enrollment markers line up with staging.
              </p>
            </div>
            <a
              href="/templates/registrar-student-masterlist-template.csv"
              download
              className={`inline-flex items-center justify-center gap-1.5 text-[11px] font-bold px-3 py-2 rounded-lg border transition ${schoolContext === "BASIC_ED" ? "border-stsn-beige text-stsn-brown hover:bg-stsn-cream" : "border-blue-200 text-blue-700 hover:bg-blue-50"}`}
            >
              <Download className="w-3.5 h-3.5" />
              Download CSV Template
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(["masterlist", "roster"] as const).map((type) => (
              <div
                key={type}
                onClick={() => {
                  setImportType(type);
                  resetImportPreview();
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
            <>
              <input
                ref={importFileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.currentTarget.files?.[0];
                  if (file) void handleImportFile(file);
                  e.currentTarget.value = "";
                }}
              />
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) void handleImportFile(file);
                }}
                onClick={() => importFileInputRef.current?.click()}
                className={`p-10 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition ${dragActive ? "border-stsn-gold bg-stsn-cream/30" : "border-stone-300 hover:border-stone-400"}`}
              >
                <UploadCloud
                  className={`w-12 h-12 ${schoolContext === "BASIC_ED" ? "text-stsn-brown" : "text-blue-600"}`}
                />
                <p className="text-stone-700 text-xs font-bold mt-3">
                  Drag & drop your completed CSV template here, or click to browse
                </p>
                <p className="text-stone-400 text-[10px] uppercase font-mono mt-1">
                  CSV template preview only. XLSX parsing will be added in the next import phase.
                </p>
              </div>
            </>
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
                  onClick={resetImportPreview}
                  className="text-[10px] font-bold text-red-600 hover:underline cursor-pointer"
                >
                  Change File
                </button>
              </div>

              {importSummary && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[
                      ["Total Rows", importSummary.totalRows, "text-stone-700"],
                      ["Ready", importSummary.validRows, "text-green-700"],
                      ["Warnings", importSummary.warningRows, "text-amber-700"],
                      ["Errors", importSummary.errorRows, "text-red-700"],
                      ["Duplicate LRN", importSummary.duplicateRows, "text-purple-700"],
                    ].map(([label, value, color]) => (
                      <div key={label} className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                        <p className="text-[9px] uppercase font-mono text-stone-400">{label}</p>
                        <p className={`text-lg font-display font-bold ${color}`}>{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => downloadImportRows(importErrorRows, "registrar-import-error-rows.csv")}
                      disabled={importErrorRows.length === 0}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-[11px] font-bold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Error Rows
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadImportRows(importDuplicateRows, "registrar-import-duplicate-rows.csv")}
                      disabled={importDuplicateRows.length === 0}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-purple-200 px-3 py-2 text-[11px] font-bold text-purple-700 hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Duplicate Rows
                    </button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto border border-stone-200 rounded-lg max-h-[290px]">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr
                      className={`text-white font-mono text-[9px] uppercase border-b ${schoolContext === "BASIC_ED" ? "bg-stsn-brown" : "bg-blue-700"}`}
                    >
                      {importType === "masterlist"
                        ? [
                            "LRN",
                            "Student Name",
                            "Gender",
                            "Birthdate",
                            "Stage",
                            "Strand/Course",
                            "Year Level",
                            "Status",
                            "Errors",
                            "Warnings",
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
                              {row.lrn || "No LRN"}
                            </td>
                            <td className="p-2 font-bold">{row.fullName || "Unnamed row"}</td>
                            <td className="p-2">{row.gender || "-"}</td>
                            <td className="p-2 text-stone-400">{row.birthday || "-"}</td>
                            <td className="p-2 font-mono text-[10px]">
                              {row.academicStage || "-"}
                            </td>
                            <td className="p-2 font-bold">{row.trackOrCourse || "-"}</td>
                            <td className="p-2">{row.yearLevel || "-"}</td>
                            <td className="p-2 text-stone-500 truncate max-w-[100px]">
                              <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${getImportStatusClass(row.importStatus)}`}>
                                {row.importStatus}
                              </span>
                            </td>
                            <td className="p-2 text-stone-500">{row.errors.join("; ") || "-"}</td>
                            <td className="p-2 font-mono">{row.warnings.join("; ") || "-"}</td>
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
                            <td className="p-2 font-bold">{row.fullName}</td>
                            <td className="p-2 font-mono font-bold text-green-700">
                              {row.yearLevel || "-"}
                            </td>
                            <td className="p-2">{row.trackOrCourse || "-"}</td>
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
                    Upload Validation
                  </strong>
                  <span className="text-[11px]">
                    {importCommittableRows.length} valid/warning row(s) will upload.
                    {importErrorRows.length + importDuplicateRows.length} error/duplicate row(s) will be excluded.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => void handleCommitImportRows()}
                  disabled={importCommittableRows.length === 0}
                  className={`text-white text-xs font-bold px-4 py-2.5 rounded-lg inline-flex items-center gap-1.5 shadow-md ${importCommittableRows.length === 0 ? "cursor-not-allowed bg-stone-400" : schoolContext === "BASIC_ED" ? "btn-primary-gradient cursor-pointer" : "bg-blue-600 hover:bg-blue-700 cursor-pointer"}`}
                >
                  <Cpu className="w-4 h-4" /> Commit Valid Rows
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
        <div className="app-modal-backdrop z-50 animate-fade-in">
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

      <PreviewModal
        isOpen={!!documentPreview}
        onClose={() => setDocumentPreview(null)}
        title={documentPreview?.fileName || "Document Preview"}
        hidePrint
        maxWidthClass="max-w-6xl"
      >
        {documentPreview && (
          <div className="space-y-3">
            <div className="bg-white border border-stone-200 rounded-xl px-3 py-2 flex flex-wrap items-center justify-between gap-2">
              <div className="text-[10px] font-mono text-stone-500 truncate">
                {Math.round(documentZoom * 100)}%
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setDocumentZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))
                  }
                  className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50"
                  title="Zoom out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDocumentZoom(1)}
                  className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDocumentZoom((z) => Math.min(2, +(z + 0.1).toFixed(2)))
                  }
                  className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50"
                  title="Zoom in"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleDownloadRequirementFile}
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg bg-stsn-brown text-white hover:bg-stsn-brown-dark"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-xl overflow-auto h-[68vh]">
              <div
                className="min-h-full flex items-start justify-center bg-stone-50"
                style={{
                  width: `${documentZoom * 100}%`,
                  minWidth: "100%",
                }}
              >
                {documentPreview.kind === "image" && (
                  <img
                    src={documentPreview.url}
                    alt={documentPreview.fileName}
                    className="w-full h-auto object-contain"
                  />
                )}
                {documentPreview.kind === "pdf" && (
                  <iframe
                    title={documentPreview.fileName}
                    src={documentPreview.url}
                    className="w-full h-[68vh] bg-white"
                  />
                )}
                {documentPreview.kind === "office" && (
                  <iframe
                    title={documentPreview.fileName}
                    src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(documentPreview.url)}`}
                    className="w-full h-[68vh] bg-white"
                  />
                )}
                {documentPreview.kind === "unsupported" && (
                  <div className="p-8 text-center space-y-3 m-auto">
                    <FileText className="w-10 h-10 mx-auto text-stone-300" />
                    <p className="text-sm font-bold text-stone-700">
                      Preview is not available for this file type.
                    </p>
                    <button
                      onClick={() =>
                        window.open(
                          documentPreview.url,
                          "_blank",
                          "noopener,noreferrer",
                        )
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg bg-stsn-brown text-white hover:bg-stsn-brown-dark"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Open File
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </PreviewModal>
    </div>
  );
}

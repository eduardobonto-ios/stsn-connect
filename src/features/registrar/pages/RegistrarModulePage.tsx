/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useSTSNStore } from "../../../services/store";
import { Student, Enrollment, Subject, Requirement, SetupItem, OnlineEnrollmentApplication } from "../../../types";
import {
  FileCheck,
  CheckCircle,
  XCircle,
  FileText,
  UserPlus,
  Compass,
  Search,
  BookOpen,
  Layers,
  Grid,
  UploadCloud,
  FileSpreadsheet,
  UserCheck,
  Cpu,
  School,
  Users,
  Info,
  Upload,
  ShieldCheck,
  Package,
  Calendar,
  CreditCard,
  AlertCircle,
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
import AppButton from "../../../components/common/AppButton";
import AppCard from "../../../components/common/AppCard";
import SLABadge from "../../../components/common/SLABadge";
import AppKpiCard from "../../../components/common/AppKpiCard";
import AppSearchInput from "../../../components/common/AppSearchInput";
import AppStatusBadge from "../../../components/common/AppStatusBadge";
import AppTabs from "../../../components/common/AppTabs";
import AppModal from "../../../components/common/AppModal";
import EnrollmentWizard from "../components/EnrollmentWizard";
import ModulePageHeader from "../../../components/common/ModulePageHeader";
import PersonIdentityCell from "../../../components/common/PersonIdentityCell";
import AppFilterChip from "../../../components/common/AppFilterChip";
import AppTable, {
  appTableColumnsFromLegacy,
  type AppTableLegacyColumn,
} from "../../../components/common/AppTable";
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
    onlineEnrollmentApplications,
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
    updateEnrollmentStatus,
    updateOnlineEnrollmentApplicationStatus,
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
  const [sourceFilter, setSourceFilter] = useState<"All" | "Online" | "Walk-in/ERP">("All");
  const [statusFilter, setStatusFilter] = useState<"All" | "Enrolled" | "Pending" | "For Assessment" | "Rejected">("All");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("info");
  const [isNewStudentModalOpen, setIsNewStudentModalOpen] = useState(false);
  const [isCorModalOpen, setIsCorModalOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"directory" | "online_queue" | "bulk_import">(
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

  const latestEnrollmentByStudentId = useMemo(() => {
    const map = new Map<string, Enrollment>();
    for (const enrollment of enrollments) {
      const current = map.get(enrollment.studentId);
      if (!current || new Date(enrollment.submittedAt).getTime() > new Date(current.submittedAt).getTime()) {
        map.set(enrollment.studentId, enrollment);
      }
    }
    return map;
  }, [enrollments]);

  const getEnrollmentSourceLabel = (enrollment?: Enrollment) =>
    enrollment?.isOnlineEnrollment || enrollment?.enrollmentSource === "Online"
      ? "Online"
      : enrollment?.enrollmentSource === "Walk-in"
        ? "Walk-in"
        : "ERP";

  const filteredStudents = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return contextStudents.filter((s) => {
      const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
      const latestEnrollment = latestEnrollmentByStudentId.get(s.id);
      const sourceLabel = getEnrollmentSourceLabel(latestEnrollment);
      const matchesSource =
        sourceFilter === "All" ||
        (sourceFilter === "Online" && sourceLabel === "Online") ||
        (sourceFilter === "Walk-in/ERP" && sourceLabel !== "Online");
      const matchesStatus =
        statusFilter === "All" ||
        s.enrollmentStatus === statusFilter ||
        (statusFilter === "Pending" && s.enrollmentStatus === "For Assessment");
      return matchesSource && matchesStatus && (
        fullName.includes(query) || s.studentNo.toLowerCase().includes(query)
      );
    });
  }, [contextStudents, latestEnrollmentByStudentId, searchQuery, sourceFilter, statusFilter]);

  const selectedEnrollment = useMemo(
    () => selectedStudent ? latestEnrollmentByStudentId.get(selectedStudent.id) : undefined,
    [latestEnrollmentByStudentId, selectedStudent],
  );

  const selectedOnlineApplication = useMemo<OnlineEnrollmentApplication | undefined>(() => {
    if (!selectedStudent) return undefined;
    return onlineEnrollmentApplications.find((application) =>
      (selectedEnrollment?.onlineApplicationId && application.id === selectedEnrollment.onlineApplicationId) ||
      application.enrollmentId === selectedEnrollment?.id ||
      application.studentId === selectedStudent.id
    );
  }, [onlineEnrollmentApplications, selectedEnrollment, selectedStudent]);

  const selectedSourceLabel = getEnrollmentSourceLabel(selectedEnrollment);

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

  const studentAssessment = useMemo(() => {
    if (!selectedStudent) return undefined;
    if (selectedEnrollment?.assessmentId) {
      const linkedAssessment = assessments.find((a) => a.id === selectedEnrollment.assessmentId);
      if (linkedAssessment) return linkedAssessment;
    }
    const scopedMatches = assessments
      .filter((a) =>
        a.studentId === selectedStudent.id &&
        (!selectedEnrollment?.schoolYear || a.schoolYear === selectedEnrollment.schoolYear) &&
        (!selectedEnrollment?.semester || a.semester === selectedEnrollment.semester) &&
        (!selectedStudent.schoolId || !a.schoolId || a.schoolId === selectedStudent.schoolId)
      )
      .sort((a, b) => {
        const aSubmitted = a.submittedDate ?? "";
        const bSubmitted = b.submittedDate ?? "";
        return bSubmitted.localeCompare(aSubmitted);
      });
    return scopedMatches[0];
  }, [assessments, selectedEnrollment, selectedStudent]);

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
    if (!selectedEnrollment) {
      toast("No enrollment record found for this student.", { variant: "warning" });
      return;
    }
    approveEnrollment(selectedEnrollment.id, selectedSection.name);
    assignStudentsToSection(selectedSection.id, [selectedStudent.id]);
    setSelectedStudent({
      ...selectedStudent,
      enrollmentStatus: "Enrolled",
      section: selectedSection.name,
    });
    toast(`Approved! Assigned to: ${selectedSection.name}`);
  };

  const handleRejectEnrollment = () => {
    if (!selectedStudent || !selectedEnrollment) return;
    rejectEnrollment(selectedEnrollment.id);
    setSelectedStudent({ ...selectedStudent, enrollmentStatus: "Rejected" });
    toast("Marked as incomplete.");
  };

  const onlineApplicationQueue = useMemo(() => {
    return [...onlineEnrollmentApplications].sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""));
  }, [onlineEnrollmentApplications]);

  const onlineApplicationQueueColumns: AppTableLegacyColumn<OnlineEnrollmentApplication>[] = useMemo(
    () => [
      {
        title: "Reference",
        data: "referenceNo",
        render: (value, row) => (
          <div>
            <p className="font-mono text-xs font-bold text-stsn-brown">{value}</p>
            <p className="text-[10px] text-stone-400">{row.submittedAt?.split("T")[0] ?? "No date"}</p>
          </div>
        ),
      },
      {
        title: "Applicant",
        render: (_, row) => (
          <div>
            <p className="text-xs font-semibold text-stone-800">{[row.lastName, row.firstName].filter(Boolean).join(", ") || "Name pending"}</p>
            <p className="text-[10px] text-stone-400">{row.lrn ? `LRN ${row.lrn}` : row.enrollmentType}</p>
          </div>
        ),
      },
      {
        title: "Placement",
        render: (_, row) => <span className="text-xs text-stone-600">{row.gradeLevelApplyingFor || row.strandOrTrack || row.schoolYear}</span>,
      },
      {
        title: "Status",
        data: "status",
        render: (value) => <AppStatusBadge status={value} />,
      },
      {
        title: "SLA",
        orderable: false,
        searchable: false,
        render: (_, row) => row.status === "Pending Registrar Review"
          ? <SLABadge dateStr={row.submittedAt} />
          : <span className="text-[9px] text-stone-300">—</span>,
        width: "65px",
      },
      {
        title: "Actions",
        orderable: false,
        searchable: false,
        render: (_, row) => (
          <div className="flex flex-wrap gap-1 justify-end">
            <button
              onClick={(event) => {
                event.stopPropagation();
                updateOnlineEnrollmentApplicationStatus(row.id, "For Completion");
                if (row.enrollmentId) updateEnrollmentStatus(row.enrollmentId, "Pending");
                toast(`${row.referenceNo} marked for completion.`);
              }}
              className="px-2 py-1 text-[10px] bg-amber-100 text-amber-700 rounded font-bold cursor-pointer"
            >
              For Completion
            </button>
            <button
              onClick={(event) => {
                event.stopPropagation();
                updateOnlineEnrollmentApplicationStatus(row.id, "Accepted");
                if (row.enrollmentId) updateEnrollmentStatus(row.enrollmentId, "For Assessment");
                toast(`${row.referenceNo} accepted for assessment.`);
              }}
              className="px-2 py-1 text-[10px] bg-emerald-600 text-white rounded font-bold cursor-pointer"
            >
              Accept
            </button>
            <button
              onClick={(event) => {
                event.stopPropagation();
                updateOnlineEnrollmentApplicationStatus(row.id, "Rejected");
                if (row.enrollmentId) updateEnrollmentStatus(row.enrollmentId, "Rejected");
                toast(`${row.referenceNo} rejected.`);
              }}
              className="px-2 py-1 text-[10px] bg-red-100 text-red-700 rounded font-bold cursor-pointer"
            >
              Reject
            </button>
          </div>
        ),
      },
    ],
    [toast, updateEnrollmentStatus, updateOnlineEnrollmentApplicationStatus],
  );

  // Pending online applications for bulk actions
  const enrollmentKpis = useMemo(() => {
    const enrolled = contextStudents.filter((s) => s.enrollmentStatus === "Enrolled").length;
    const pending = contextStudents.filter((s) => s.enrollmentStatus === "Pending" || s.enrollmentStatus === "For Assessment").length;
    const pendingApps = onlineApplicationQueue.filter((a) => a.status === "Pending Registrar Review").length;
    return { total: contextStudents.length, enrolled, pending, pendingApps };
  }, [contextStudents, onlineApplicationQueue]);

  const pendingOnlineApps = useMemo(
    () => onlineApplicationQueue.filter((a) => a.status === "Pending Registrar Review"),
    [onlineApplicationQueue],
  );

  const handleBulkAcceptApps = async () => {
    if (pendingOnlineApps.length === 0) return;
    const ok = await confirm(
      `Accept all ${pendingOnlineApps.length} pending application${pendingOnlineApps.length !== 1 ? "s" : ""} for assessment? Each will move to For Assessment status.`,
    );
    if (!ok) return;
    for (const app of pendingOnlineApps) {
      updateOnlineEnrollmentApplicationStatus(app.id, "Accepted");
      if (app.enrollmentId) updateEnrollmentStatus(app.enrollmentId, "For Assessment");
    }
    toast(`${pendingOnlineApps.length} application${pendingOnlineApps.length !== 1 ? "s" : ""} accepted for assessment.`);
  };

  const handleBulkRejectApps = async () => {
    if (pendingOnlineApps.length === 0) return;
    const ok = await confirm(
      `Reject all ${pendingOnlineApps.length} pending application${pendingOnlineApps.length !== 1 ? "s" : ""}? This is auditable and cannot be undone.`,
      { variant: "danger" },
    );
    if (!ok) return;
    for (const app of pendingOnlineApps) {
      updateOnlineEnrollmentApplicationStatus(app.id, "Rejected");
      if (app.enrollmentId) updateEnrollmentStatus(app.enrollmentId, "Rejected");
    }
    toast(`${pendingOnlineApps.length} application${pendingOnlineApps.length !== 1 ? "s" : ""} rejected.`, { variant: "warning" });
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
  // to AppTable keep a stable identity across renders (e.g. when selecting
  // a student updates the right-side panel).
  const studentDirectoryColumns: AppTableLegacyColumn<Student>[] = useMemo(
    () => [
      {
        title: terms.studentIdLabel,
        data: "studentNo",
        className: `font-mono font-bold text-xs ${schoolContext === "BASIC_ED" ? "text-stsn-brown" : "text-blue-700"}`,
        render: (value) => value,
      },
      {
        title: "Student",
        data: "lastName",
        render: (_value, stud) => (
          <PersonIdentityCell
            firstName={stud.firstName}
            lastName={stud.lastName}
            secondary={stud.section || "No section"}
            variant={schoolContext === "BASIC_ED" ? "basic-ed" : "college"}
            onClick={() => {
              setSelectedStudent(stud);
              setDetailTab("info");
            }}
          />
        ),
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
        title: "Source",
        className: "text-center",
        searchable: false,
        render: (_value, stud) => {
          const enrollment = latestEnrollmentByStudentId.get(stud.id);
          const source = getEnrollmentSourceLabel(enrollment);
          const isIncomplete = source === "Online" && enrollment?.completionStatus === "Incomplete";
          return (
            <div className="flex flex-col items-center gap-1">
              <span
                className={`inline-block text-[9.5px] font-bold leading-none px-2 py-1 rounded-full ${
                  source === "Online"
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "bg-stone-50 text-stone-600 border border-stone-200"
                }`}
              >
                {source === "Online" ? "Online" : source}
              </span>
              {isIncomplete && (
                <span className="inline-block text-[9px] font-bold leading-none px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  Incomplete
                </span>
              )}
            </div>
          );
        },
      },
      {
        title: "Status",
        data: "enrollmentStatus",
        className: "text-center",
        searchable: false,
        render: (_value, stud) => <AppStatusBadge status={stud.enrollmentStatus} />,
      },
      {
        title: "COR",
        className: "text-right",
        orderable: false,
        searchable: false,
        render: (_value, stud) => {
          const isEnrolled = stud.enrollmentStatus === "Enrolled";
          const disabledReason = isEnrolled
            ? undefined
            : `COR unavailable — status: ${stud.enrollmentStatus}. Complete enrollment first.`;
          return (
            <AppButton
              onClick={() => {
                setSelectedStudent(stud);
                if (isEnrolled) setIsCorModalOpen(true);
                else
                  toast(
                    `Status: ${stud.enrollmentStatus}. Complete enrollment first.`,
                  );
              }}
              title={disabledReason ?? "View / print Certificate of Registration"}
              aria-label={isEnrolled ? `Open COR for ${stud.firstName} ${stud.lastName}` : disabledReason}
              disabled={!isEnrolled}
              size="xs"
              variant={schoolContext === "BASIC_ED" ? "primary" : "primary-college"}
            >
              COR
            </AppButton>
          );
        },
      },
    ],
    [
      terms,
      schoolContext,
      schoolBadgeClass,
      latestEnrollmentByStudentId,
      setSelectedStudent,
      setDetailTab,
      setIsCorModalOpen,
      toast,
    ],
  );

  const pendingQueueCount = onlineApplicationQueue.filter(
    (application) =>
      application.status === "Pending Registrar Review" ||
      application.status === "For Completion",
  ).length;

  return (
    <div className="space-y-5 animate-fade-in font-sans">
      <ModulePageHeader
        variant={schoolContext === "BASIC_ED" ? "default" : "college"}
        badge={schoolContext === "BASIC_ED" ? "K-12 Basic Education" : "Tertiary / College Division"}
        badgeIcon={BookOpen}
        title={schoolContext === "BASIC_ED" ? "Admissions & Enrollment" : "College Admissions & Enrollment"}
        subtitle={`${schoolLabel} · ${contextStudents.length} ${contextStudents.length === 1 ? "student" : "students"} on record`}
        meta="S.Y. 2026–2027"
        actions={
          <div className="flex flex-col sm:items-end gap-1.5">
            <AppButton
              onClick={() => {
                setDept(schoolContext === "BASIC_ED" ? "Basic Education" : "College");
                setBeProgramCategory("Senior High School");
                setYearLvl(schoolContext === "BASIC_ED" ? "Grade 11" : "1st Year");
                setCourseCode(schoolContext === "BASIC_ED" ? "STEM" : "BSIT");
                setCollegeCourse("BSIT");
                setCollegeYear("1st Year");
                setIsNewStudentModalOpen(true);
              }}
              variant={schoolContext === "BASIC_ED" ? "primary" : "primary-college"}
              size="md"
              leftIcon={UserPlus}
            >
              Enroll New Candidate
            </AppButton>
            <span className="text-[10px] text-white/25 font-mono hidden sm:block">
              {terms.studentIdLabel} &amp; {terms.trackNoun}
            </span>
          </div>
        }
      />

      <AppCard className="overflow-hidden" padded={false}>
        <div className="border-b border-[var(--erp-border)]/70 px-4 pt-4">
          <AppTabs
            items={[
              {
                value: "directory",
                label: "Admissions & Directory",
                badge: undefined,
              },
              {
                value: "online_queue",
                label: "Online Queue",
                badge: pendingQueueCount || undefined,
              },
              {
                value: "bulk_import",
                label: terms.bulkImportLabel || "Bulk Import",
                badge: undefined,
              },
            ]}
            value={activeSubTab}
            onChange={(value) => {
              if (value === "bulk_import") {
                resetImportPreview();
              } else {
                setBulkImportSuccess("");
              }
              setActiveSubTab(value);
            }}
            className="rounded-none border-none bg-transparent shadow-none"
            tabsClassName="overflow-x-auto pb-1"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 px-5 py-4 text-xs text-[var(--erp-text-muted)] md:grid-cols-3">
          <div className={`rounded-2xl border px-4 py-3 ${activeSubTab === "directory" ? "border-[var(--erp-border)] bg-[var(--erp-surface-muted)]" : "border-stone-200 bg-white"}`}>
            <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400">Admissions & Directory</p>
            <p className="mt-1 font-semibold text-[var(--erp-text)]">{filteredStudents.length} student{filteredStudents.length !== 1 ? "s" : ""}</p>
          </div>
          <div className={`rounded-2xl border px-4 py-3 ${activeSubTab === "online_queue" ? "border-blue-200 bg-blue-50" : "border-stone-200 bg-white"}`}>
            <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400">Online Queue</p>
            <p className="mt-1 font-semibold text-[var(--erp-text)]">{pendingQueueCount > 0 ? `${pendingQueueCount} pending review` : "Applications inbox"}</p>
          </div>
          <div className={`rounded-2xl border px-4 py-3 ${activeSubTab === "bulk_import" ? "border-amber-200 bg-amber-50" : "border-stone-200 bg-white"}`}>
            <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400">{terms.bulkImportLabel || "Bulk Import"}</p>
            <p className="mt-1 font-semibold text-[var(--erp-text)]">CSV and masterlist upload staging</p>
          </div>
        </div>
      </AppCard>

      {/* ===================== DIRECTORY TAB ===================== */}
      {activeSubTab === "directory" && (
        <>
        {/* Enrollment Pipeline — divided metric bar */}
        <div className="bg-white border border-stsn-beige rounded-xl overflow-hidden shadow-sm animate-fade-in">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-stone-100">
            {[
              { label: "Total Students", value: enrollmentKpis.total, icon: Users, numColor: "text-stone-900", iconColor: "text-stone-300", bgClass: "", dotColor: "bg-stone-400", hint: "All statuses" },
              { label: "Enrolled", value: enrollmentKpis.enrolled, icon: CheckCircle, numColor: "text-emerald-700", iconColor: "text-emerald-200", bgClass: "bg-emerald-50/60", dotColor: "bg-emerald-500", hint: "Cleared & enrolled" },
              { label: "Pending / For Assessment", value: enrollmentKpis.pending, icon: Clock, numColor: "text-amber-700", iconColor: "text-amber-200", bgClass: "bg-amber-50/60", dotColor: "bg-amber-500", hint: "Requires action" },
              { label: "Pending Online Apps", value: enrollmentKpis.pendingApps, icon: UserCheck, numColor: "text-blue-700", iconColor: "text-blue-200", bgClass: "bg-blue-50/60", dotColor: "bg-blue-500", hint: "In review queue" },
            ].map((kpi) => (
              <div key={kpi.label} className={`px-5 py-5 ${kpi.bgClass}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${kpi.dotColor}`} />
                      <span className="text-[9px] font-mono font-bold text-stone-400 uppercase tracking-wider truncate">{kpi.label}</span>
                    </div>
                    <p className={`text-3xl font-black leading-none ${kpi.numColor}`}>{kpi.value}</p>
                    <p className="text-[10px] text-stone-400 mt-2">{kpi.hint}</p>
                  </div>
                  <kpi.icon className={`w-6 h-6 flex-shrink-0 mt-0.5 ${kpi.iconColor}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-in">
          {/* Left: Students Table */}
          <AppCard className="lg:col-span-2 overflow-hidden" padded={false}>
            {/* Search & Filter Bar */}
            <div className="px-4 py-3 border-b border-stone-100 space-y-2.5">
              <div className="flex items-center gap-2">
                <AppSearchInput
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClear={() => setSearchQuery("")}
                  placeholder={`Search ${schoolContext === "BASIC_ED" ? "learners" : "students"} by name or ID...`}
                  aria-label="Search students"
                  variant={schoolContext === "BASIC_ED" ? "default" : "college"}
                  wrapperClassName="flex-1"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                  aria-label="Filter by enrollment status"
                  className={`h-10 bg-white border border-stone-200 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:ring-2 cursor-pointer ${schoolContext === "BASIC_ED" ? "focus:ring-stsn-brown/20 focus:border-stsn-brown" : "focus:ring-blue-500/20 focus:border-blue-500"}`}
                >
                  <option value="All">All Status</option>
                  <option value="Enrolled">Enrolled</option>
                  <option value="Pending">Pending / For Assessment</option>
                  <option value="For Assessment">For Assessment</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(["All", "Online", "Walk-in/ERP"] as const).map((filter) => (
                    <AppFilterChip
                      key={filter}
                      label={filter}
                      active={sourceFilter === filter}
                      onClick={() => setSourceFilter(filter)}
                      variant={schoolContext === "BASIC_ED" ? "default" : "college"}
                      shape="pill"
                      size="sm"
                    />
                  ))}
                  {(sourceFilter !== "All" || statusFilter !== "All" || searchQuery) && (
                    <button
                      type="button"
                      onClick={() => { setSourceFilter("All"); setStatusFilter("All"); setSearchQuery(""); }}
                      className="h-7 px-2.5 rounded-full text-[11px] font-bold text-red-500 hover:text-red-700 flex items-center gap-0.5 border border-red-100 bg-red-50 hover:bg-red-100 transition cursor-pointer"
                    >
                      <X className="w-3 h-3" /> Clear filters
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${schoolBadgeClass}`}>
                    {schoolContext === "BASIC_ED" ? "Basic Ed" : "College"}
                  </span>
                  <span className="text-[11px] font-mono text-stone-400 whitespace-nowrap">
                    {filteredStudents.length} result{filteredStudents.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>

            <AppTable<Student>
              columns={appTableColumnsFromLegacy(studentDirectoryColumns)}
              data={filteredStudents}
              emptyMessage="No students found."
              enableSearch={false}
              selectedRowId={selectedStudent?.id}
              getRowId={(stud) => stud.id}
              className="px-3 pb-3"
              onRowClick={(stud) => {
                setSelectedStudent(stud);
                setDetailTab("info");
              }}
              getRowClassName={(stud) => {
                if (stud.enrollmentStatus === "Rejected" || stud.enrollmentStatus === "Cancelled" || stud.enrollmentStatus === "Withdrawn") return "bg-red-50";
                if (stud.enrollmentStatus === "Enrolled") return "bg-emerald-50";
                if (stud.enrollmentStatus === "Pending" || stud.enrollmentStatus === "For Assessment") return "bg-amber-50";
                if (stud.enrollmentStatus === "Draft") return "bg-blue-50";
                return undefined;
              }}
            />
          </AppCard>

          {/* Right: Student Detail Panel */}
          <div className="space-y-3">
            {selectedStudent ? (
              <AppCard className="overflow-hidden animate-fade-in lg:sticky lg:top-4 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto" padded={false}>
                {/* Profile Header — Identity Card */}
                <div
                  className={`relative px-5 pt-5 pb-4 ${
                    schoolContext === "BASIC_ED"
                      ? "app-detail-hero"
                      : "app-detail-hero-college"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Avatar circle */}
                    <div
                      className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center text-base font-black border ${
                        schoolContext === "BASIC_ED"
                          ? "bg-[rgba(242,201,76,0.16)] border-[rgba(242,201,76,0.32)] text-[#F2C94C]"
                          : "bg-sky-300/16 border-sky-300/28 text-sky-100"
                      }`}
                    >
                      {`${selectedStudent.firstName.charAt(0)}${selectedStudent.lastName.charAt(0)}`.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-mono uppercase tracking-widest text-white/55 leading-none mb-1">
                        Admissions Desk · {schoolLabel}
                      </p>
                      <h3 className="text-[15px] font-black text-white leading-tight">
                        {selectedStudent.lastName}, {selectedStudent.firstName}
                        {selectedStudent.middleName ? ` ${selectedStudent.middleName.charAt(0)}.` : ""}
                      </h3>
                      <p className="text-white/65 text-[10px] font-mono mt-0.5">
                        {selectedStudent.studentNo}
                        {selectedStudent.yearLevel ? ` · ${selectedStudent.yearLevel}` : ""}
                        {selectedStudent.trackOrCourse ? ` · ${selectedStudent.trackOrCourse}` : ""}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <AppStatusBadge
                          status={selectedStudent.enrollmentStatus}
                          className="border-white/10 bg-white/12 text-white"
                        />
                        <span className="app-detail-hero-badge text-[9px] font-bold uppercase px-2 py-0.5 rounded-full">
                          {selectedSourceLabel}
                        </span>
                        {selectedEnrollment?.completionStatus === "Incomplete" && (
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-[rgba(242,201,76,0.88)] text-[#102033]">
                            Incomplete
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Gold accent line */}
                  <div
                    className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                      schoolContext === "BASIC_ED"
                        ? "bg-gradient-to-r from-[rgba(242,201,76,0)] via-[#F2C94C] to-[rgba(242,201,76,0)]"
                        : "bg-gradient-to-r from-sky-300/0 via-sky-300 to-sky-300/0"
                    }`}
                  />
                </div>

                {/* Detail Tabs — underline style */}
                <div className="app-local-panel-tabs px-3 py-3">
                  <AppTabs
                    items={getDetailTabs().map((tab) => ({
                      value: tab.id,
                      label: tab.label,
                    }))}
                    value={detailTab}
                    onChange={(value) => setDetailTab(value as DetailTab)}
                    className="rounded-xl border-none bg-transparent shadow-none"
                    tabsClassName="overflow-x-auto pb-1"
                  />
                </div>

                <div className="p-5 space-y-4">
                  {/* Student Info Tab */}
                  {detailTab === "info" && (
                    <div className="space-y-3 text-xs">
                      <h4 className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest">
                        Personal Information
                      </h4>
                      {([
                        [
                          "Full Name",
                          `${selectedStudent.lastName}, ${selectedStudent.firstName}${selectedStudent.middleName ? ` ${selectedStudent.middleName}` : ""}`,
                        ],
                        ["Student No.", selectedStudent.studentNo],
                        ["LRN", selectedStudent.lrn],
                        ["Gender", selectedStudent.gender],
                        ["Birthday", selectedStudent.birthday],
                        ["Contact", selectedStudent.contactNo],
                        ["Email", selectedStudent.email],
                        ["Address", selectedStudent.address],
                        ["Municipality", selectedStudent.municipality],
                        ["Province", selectedStudent.province],
                      ] as [string, string | undefined][]).map(([label, val]) => (
                        <div
                          key={label}
                          className="flex justify-between items-start gap-2 py-1.5 border-b border-stone-50 last:border-0"
                        >
                          <span className="text-stone-400 font-mono text-[9px] uppercase flex-shrink-0">
                            {label}
                          </span>
                          {val ? (
                            <span
                              className="font-semibold text-stone-800 text-right max-w-[170px] break-words"
                              title={val}
                            >
                              {val}
                            </span>
                          ) : (
                            <span className="text-stone-300 italic text-[10px]">—</span>
                          )}
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
                      {selectedOnlineApplication?.guardianName ? (
                        <>
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[10.5px] flex items-start gap-2">
                            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            <span>
                              Guardian information is required for all Basic
                              Education learners (DepEd mandate). Data sourced
                              from online enrollment application.
                            </span>
                          </div>
                          {([
                            ["Guardian / Parent Name", selectedOnlineApplication.guardianName],
                            ["Relationship", selectedOnlineApplication.guardianRelationship],
                            ["Contact No.", selectedOnlineApplication.guardianContactNo],
                            ["Home Address", selectedOnlineApplication.completeAddress || selectedStudent.address],
                            ["Email", selectedOnlineApplication.guardianEmail],
                          ] as [string, string | undefined][]).map(([label, val]) => (
                            <div
                              key={label}
                              className="flex justify-between items-start gap-2 py-1.5 border-b border-stone-50 last:border-0"
                            >
                              <span className="text-stone-400 font-mono text-[9px] uppercase flex-shrink-0">
                                {label}
                              </span>
                              <span className="font-semibold text-stone-800 text-right max-w-[180px] break-words">
                                {val || <span className="text-stone-300 italic font-normal">Not provided</span>}
                              </span>
                            </div>
                          ))}
                        </>
                      ) : (
                        <div className="space-y-3">
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[10.5px] flex items-start gap-2">
                            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            <span>
                              Guardian information is required for all Basic
                              Education learners (DepEd mandate).
                            </span>
                          </div>
                          <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl text-center">
                            <Users className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                            <p className="text-[11px] font-semibold text-stone-600">
                              Guardian info not yet captured
                            </p>
                            <p className="text-[10px] text-stone-400 mt-1">
                              This student was enrolled via walk-in or ERP. Guardian
                              details are collected through the online enrollment form.
                            </p>
                          </div>
                          {selectedStudent.address && (
                            <div className="py-1.5 border-b border-stone-50">
                              <span className="text-stone-400 font-mono text-[9px] uppercase block">
                                Student Address (on file)
                              </span>
                              <span className="font-semibold text-stone-800">
                                {selectedStudent.address}
                                {selectedStudent.municipality ? `, ${selectedStudent.municipality}` : ""}
                                {selectedStudent.province ? `, ${selectedStudent.province}` : ""}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
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
                                    {
                                      setAssessmentStatus(
                                        "Pending Accounting Approval",
                                      );
                                      if (selectedEnrollment) updateEnrollmentStatus(selectedEnrollment.id, "For Assessment");
                                    }
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
                              if (selectedEnrollment) updateEnrollmentStatus(selectedEnrollment.id, "For Assessment");
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
                            {selectedEnrollment?.enrollmentType || "New Student"}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-400">Source:</span>
                          <strong>{selectedSourceLabel}</strong>
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

                      {selectedSourceLabel === "Online" && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h5 className="text-[10px] font-bold uppercase text-blue-800">
                                Online Application
                              </h5>
                              <p className="text-[10px] text-blue-700/80 font-mono">
                                {selectedOnlineApplication?.referenceNo || selectedEnrollment?.onlineApplicationId || "Reference pending"}
                              </p>
                            </div>
                            <span
                              className={`text-[9px] font-bold px-2 py-1 rounded-full border ${
                                selectedEnrollment?.completionStatus === "Incomplete"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-green-50 text-green-700 border-green-200"
                              }`}
                            >
                              {selectedEnrollment?.completionStatus || selectedOnlineApplication?.completionStatus || "Complete"}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {[
                              ["Submitted", selectedOnlineApplication?.submittedAt || selectedEnrollment?.submittedAt],
                              ["Birthdate", selectedOnlineApplication?.birthDate || selectedStudent.birthday],
                              ["Gender", selectedOnlineApplication?.gender || selectedStudent.gender],
                              ["Previous School", selectedOnlineApplication?.previousSchool],
                              ["Previous School Address", selectedOnlineApplication?.previousSchoolAddress],
                              ["Complete Address", selectedOnlineApplication?.completeAddress || selectedStudent.address],
                              ["Barangay", selectedOnlineApplication?.barangay],
                              ["City/Municipality", selectedOnlineApplication?.cityMunicipality || selectedStudent.municipality],
                              ["Province", selectedOnlineApplication?.province || selectedStudent.province],
                              ["Guardian Name", selectedOnlineApplication?.guardianName],
                              ["Guardian Relationship", selectedOnlineApplication?.guardianRelationship],
                              ["Guardian Contact", selectedOnlineApplication?.guardianContactNo],
                              ["Guardian Email", selectedOnlineApplication?.guardianEmail],
                            ].map(([label, value]) => (
                              <div key={label} className="bg-white/80 border border-blue-100 rounded-lg p-2">
                                <span className="block text-[9px] uppercase font-mono text-stone-400">
                                  {label}
                                </span>
                                <span className="block text-[11px] font-semibold text-stone-800 break-words">
                                  {value || "N/A"}
                                </span>
                              </div>
                            ))}
                          </div>

                          {((selectedEnrollment?.missingFields ?? selectedOnlineApplication?.missingFields ?? []).length > 0) && (
                            <div>
                              <span className="block text-[9px] uppercase font-mono text-amber-700 mb-1">
                                Missing Fields
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {(selectedEnrollment?.missingFields ?? selectedOnlineApplication?.missingFields ?? []).map((field) => (
                                  <span key={field} className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                    {field}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

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
              </AppCard>
            ) : (
              <div className="bg-white rounded-xl border border-stsn-beige shadow-sm overflow-hidden">
                <div
                  className={`h-1.5 ${schoolContext === "BASIC_ED" ? "btn-primary-gradient" : "bg-blue-600"}`}
                />
                <div className="p-10 text-center">
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${schoolContext === "BASIC_ED" ? "bg-stsn-cream border border-stsn-beige" : "bg-blue-50 border border-blue-100"}`}
                  >
                    <FileCheck
                      className={`w-8 h-8 ${schoolContext === "BASIC_ED" ? "text-stsn-brown/40" : "text-blue-400"}`}
                    />
                  </div>
                  <h4 className="text-sm font-display font-semibold text-stone-700">
                    No student selected
                  </h4>
                  <p className="text-[11px] text-stone-400 mt-1.5 max-w-[200px] mx-auto leading-relaxed">
                    Select a student from the directory to review their
                    admissions profile and take action.
                  </p>
                  <div className="mt-5 flex flex-col gap-2 text-[10px] text-stone-400">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                      <span>{enrollmentKpis.enrolled} enrolled</span>
                      <span className="mx-1 text-stone-300">·</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                      <span>{enrollmentKpis.pending} pending</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        </>
      )}

      {activeSubTab === "online_queue" && (
        <AppCard className="overflow-hidden animate-fade-in" padded={false}>
          {/* Queue header bar */}
          <div
            className={`px-6 pt-5 pb-5 ${schoolContext === "BASIC_ED" ? "app-detail-hero" : "app-detail-hero-college"}`}
          >
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
              <div>
                <span
                  className={`text-[10px] font-mono uppercase tracking-widest font-bold ${
                    schoolContext === "BASIC_ED" ? "text-[#C5A059]" : "text-blue-300"
                  }`}
                >
                  Registrar Application Review
                </span>
                <h3 className="text-xl font-black text-white mt-1 leading-tight">Online Enrollment Queue</h3>
                <p className="text-white/50 text-xs mt-1.5">
                  Review submitted applications, request completion, accept for assessment, or reject with an auditable status.
                </p>
              </div>
              <div className="text-white/40 text-[10px] font-mono whitespace-nowrap">
                {onlineApplicationQueue.length} total application{onlineApplicationQueue.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
          <div
            className={`h-0.5 ${
              schoolContext === "BASIC_ED"
                ? "bg-gradient-to-r from-[rgba(242,201,76,0)] via-[#F2C94C] to-[rgba(242,201,76,0)]"
                : "bg-gradient-to-r from-blue-400/0 via-blue-400 to-blue-400/0"
            }`}
          />
          <div className="bg-white p-6 space-y-4">
            {/* Status pipeline breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {(
                [
                  { status: "Pending Registrar Review" as const, bg: "bg-amber-50", border: "border-amber-200", numColor: "text-amber-700", dotColor: "bg-amber-500", shortLabel: "Pending Review" },
                  { status: "For Completion" as const, bg: "bg-blue-50", border: "border-blue-200", numColor: "text-blue-700", dotColor: "bg-blue-500", shortLabel: "For Completion" },
                  { status: "Accepted" as const, bg: "bg-emerald-50", border: "border-emerald-200", numColor: "text-emerald-700", dotColor: "bg-emerald-500", shortLabel: "Accepted" },
                  { status: "Rejected" as const, bg: "bg-red-50", border: "border-red-200", numColor: "text-red-700", dotColor: "bg-red-500", shortLabel: "Rejected" },
                  { status: "Cancelled" as const, bg: "bg-stone-50", border: "border-stone-200", numColor: "text-stone-600", dotColor: "bg-stone-400", shortLabel: "Cancelled" },
                ] as const
              ).map(({ status, bg, border, numColor, dotColor, shortLabel }) => (
                <div key={status} className={`px-3 py-3 rounded-xl border ${bg} ${border}`}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`} />
                    <span className="text-[9px] font-mono text-stone-400 uppercase truncate">{shortLabel}</span>
                  </div>
                  <p className={`text-2xl font-black leading-none ${numColor}`}>
                    {onlineApplicationQueue.filter((application) => application.status === status).length}
                  </p>
                </div>
              ))}
            </div>

          {/* Bulk action bar — only shown when there are pending applications */}
          {pendingOnlineApps.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span className="text-xs font-bold text-blue-800">
                  {pendingOnlineApps.length} pending application{pendingOnlineApps.length !== 1 ? "s" : ""} awaiting review
                </span>
              </div>
              <div className="flex items-center gap-2">
                <AppButton
                  onClick={handleBulkAcceptApps}
                  size="xs"
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Accept All Pending
                </AppButton>
                <AppButton
                  onClick={handleBulkRejectApps}
                  size="xs"
                  variant="danger-outline"
                >
                  Reject All Pending
                </AppButton>
              </div>
            </div>
          )}

          <AppTable<OnlineEnrollmentApplication>
            columns={appTableColumnsFromLegacy(onlineApplicationQueueColumns)}
            data={onlineApplicationQueue}
            emptyMessage="No online applications found."
            initialPageSize={15}
            pageSizeOptions={[15]}
            getRowId={(app) => app.id}
            getRowClassName={(app) => {
              if (app.status === "Rejected" || app.status === "Cancelled") return "bg-red-50";
              if (app.status === "Accepted") return "bg-emerald-50";
              if (app.status === "Pending Registrar Review") return "bg-amber-50";
              if (app.status === "For Completion") return "bg-blue-50";
              return undefined;
            }}
            onRowClick={(application) => {
              const linkedStudent = application.studentId
                ? contextStudents.find((student) => student.id === application.studentId)
                : undefined;
              if (linkedStudent) {
                setSelectedStudent(linkedStudent);
                setDetailTab("enrollment");
                setActiveSubTab("directory");
              } else {
                toast("This application is not linked to a student record yet.", { variant: "warning" });
              }
            }}
          />
          </div>
        </AppCard>
      )}

      {/* ===================== BULK IMPORT TAB ===================== */}
      {activeSubTab === "bulk_import" && (
        <AppCard className="overflow-hidden animate-fade-in" padded={false}>
          {/* Import header bar */}
          <div
            className={`px-6 pt-5 pb-5 ${schoolContext === "BASIC_ED" ? "app-detail-hero" : "app-detail-hero-college"}`}
          >
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
              <div>
                <span
                  className={`text-[10px] font-mono uppercase tracking-widest font-bold ${
                    schoolContext === "BASIC_ED" ? "text-[#F2C94C]" : "text-blue-300"
                  }`}
                >
                  Batch Data Entry
                </span>
                <h3 className="text-xl font-black text-white mt-1 leading-tight">
                  {schoolContext === "BASIC_ED"
                    ? "DepEd Learner Excel Upload Portal"
                    : "CHEd College Student Masterlist Upload"}
                </h3>
                <p className="text-white/50 text-xs mt-1.5">
                  Use the official template so LRN, Grade 11/12 strand, guardian, requirement, and enrollment markers line up with staging.
                </p>
              </div>
              <a
                href="/templates/registrar-student-masterlist-template.csv"
                download
                className={`inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl border transition flex-shrink-0 ${
                  schoolContext === "BASIC_ED"
                    ? "border-[#C5A059]/40 text-[#C5A059] hover:bg-[#C5A059]/10"
                    : "border-blue-400/40 text-blue-300 hover:bg-blue-400/10"
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                Download CSV Template
              </a>
            </div>
          </div>
          <div
            className={`h-0.5 ${
              schoolContext === "BASIC_ED"
                ? "bg-gradient-to-r from-[rgba(242,201,76,0)] via-[#F2C94C] to-[rgba(242,201,76,0)]"
                : "bg-gradient-to-r from-blue-400/0 via-blue-400 to-blue-400/0"
            }`}
          />
          <div className="bg-white p-6 space-y-6">

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
        </AppCard>
      )}

      {/* ===================== ENROLLMENT FORM MODAL ===================== */}
      <AppModal
        open={isNewStudentModalOpen}
        title={`${schoolContext === "BASIC_ED" ? "Basic Ed" : "College"} Student Enrollment Form`}
        icon={UserPlus}
        onClose={() => setIsNewStudentModalOpen(false)}
        maxWidthClass="max-w-xl"
        bodyClassName="p-0 overflow-hidden"
      >
        <EnrollmentWizard
          schoolContext={schoolContext}
          onCancel={() => setIsNewStudentModalOpen(false)}
          onSubmit={({ firstName, lastName, middleName, gender, dept, yearLevel, trackOrCourse, subjectCodes, enrollmentType }) => {
            const baseNewStudent = addStudent({
              firstName, lastName, middleName, gender,
              civilStatus: "Single", religion: "Catholic", nationality: "Filipino",
              birthday: "2008-01-01", birthplace: "Quezon City",
              email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@stsn.edu.ph`,
              contactNo: "+639170000000",
              address: dept === "College" ? "Novaliches, QC" : "Zabarte Subdivision",
              province: "Metro Manila", municipality: "Quezon City", zipCode: "1123",
              department: dept, yearLevel, trackOrCourse, section: "",
              enrollmentStatus: "Pending",
            });
            submitNewEnrollment({
              studentId: baseNewStudent.id,
              schoolYear: "2026-2027",
              semester: dept === "College" ? "First Semester" : "N/A",
              enrollmentType,
              subjectCodes,
              status: "Pending",
              submittedAt: new Date().toISOString().replace("T", " ").substring(0, 16),
            });
            setIsNewStudentModalOpen(false);
            setFormStep(1);
            setFirstName(""); setLastName(""); setMiddleName("");
            setSelectedSubjectCodes([]);
            setSelectedStudent(baseNewStudent);
          }}
        />
      </AppModal>

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

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useMemo } from "react";
import { useSTSNStore } from "../services/store";
import {
  BookOpen,
  FileCheck,
  Award,
  CreditCard,
  Sparkles,
  UserCheck,
  Calendar,
  RotateCw,
  Lock,
  Unlock,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Image as ImageIcon,
  Clock,
  Settings,
  User,
  UploadCloud,
  ShieldAlert,
  ClipboardList,
  Eye,
  RefreshCw,
  ChevronRight,
  Info,
  PlusCircle,
  Monitor,
  Play,
  Download,
  Video,
  Search,
  Receipt,
  Percent,
  Calculator,
  Printer,
  Tag
} from "lucide-react";
import { PreviewModal, CORPreview, IDCardPreview } from "../components/ModalPreviews";
import {
  computeMockAssessment,
  DISCOUNT_OPTIONS,
  PAYMENT_TERM_OPTIONS,
  PAYMENT_TERM_DESCRIPTIONS,
  type MockPaymentTerm,
} from "../services/mockAssessmentService";

type PortalTab = "overview" | "grades" | "ledger" | "profile" | "enrollment" | "elearning";

export default function StudentPortal() {
  const {
    students,
    assessments,
    payments,
    grades,
    subjects,
    enrollments,
    requirements,
    currentUser,
    announcements,
    learningMaterials,
    updateRequirementUpload
  } = useSTSNStore();

  const [activeTab, setActiveTab] = useState<PortalTab>("overview");
  const [isCorModalOpen, setIsCorModalOpen] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  // Online Learning state (must be at top level — hooks rule)
  const [lmsSearch, setLmsSearch] = useState("");
  const [lmsType, setLmsType] = useState<"All" | "Video" | "Module" | "Document">("All");
  const [viewingLms, setViewingLms] = useState<typeof learningMaterials[0] | null>(null);

  // Enrollment module state
  const [enrollmentOpen] = useState(true); // toggle to false to show closed state
  const [enrollmentStep, setEnrollmentStep] = useState<"landing" | "preform" | "status" | "fees">("landing");
  const [reEnrollConfirmed, setReEnrollConfirmed] = useState(false);

  const student = students.find((s) => s.email === currentUser?.email) || students[0];

  const [firstName, setFirstName] = useState(student?.firstName || "");
  const [lastName, setLastName] = useState(student?.lastName || "");
  const [middleName, setMiddleName] = useState(student?.middleName || "");
  const [contactNo, setContactNo] = useState(student?.contactNo || "");
  const [religion, setReligion] = useState(student?.religion || "Catholic");
  const [nationality, setNationality] = useState(student?.nationality || "Filipino");
  const [gender, setGender] = useState(student?.gender || "Male");
  const [address, setAddress] = useState(student?.address || "");
  const [province, setProvince] = useState(student?.province || "");
  const [municipality, setMunicipality] = useState(student?.municipality || "");
  const [zipCode, setZipCode] = useState(student?.zipCode || "");
  const [guardianName, setGuardianName] = useState("Mr. Veloso Sr.");
  const [guardianContact, setGuardianContact] = useState("+639171112222");
  const [overrideSettleBalance, setOverrideSettleBalance] = useState(false);
  const [profileSuccessMessage, setProfileSuccessMessage] = useState("");
  const [auditLogs, setAuditLogs] = useState<Array<{ date: string; action: string; category: string }>>([
    { date: "2026-05-30 09:15", action: "Completed initial registration checklist", category: "System" },
    { date: "2026-05-30 14:20", action: "Cleared Accounting finance credentials", category: "Finance" }
  ]);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [pendingUploadReqName, setPendingUploadReqName] = useState<string | null>(null);

  // Assessment Fees tab — TODO: Pre-populate from GET /api/scholarships/eligible?studentId=...
  const [selectedDiscountId, setSelectedDiscountId] = useState("none");
  const [selectedPaymentTerm, setSelectedPaymentTerm] = useState<MockPaymentTerm>("Quarterly");
  const selectedDiscount = DISCOUNT_OPTIONS.find((d) => d.id === selectedDiscountId) ?? DISCOUNT_OPTIONS[0];
  // TODO: Replace with GET /api/assessment/compute?studentId=...
  const mockAssessment = useMemo(
    () =>
      computeMockAssessment(
        student.department,
        student.yearLevel ?? "Grade 11",
        student.trackOrCourse ?? undefined,
        selectedDiscount.percentage,
        selectedPaymentTerm,
        "2026-2027"
      ),
    [student.department, student.yearLevel, student.trackOrCourse, selectedDiscount.percentage, selectedPaymentTerm]
  );

  const assessment = assessments.find((a) => a.studentId === student.id);
  const studentReqs = requirements.filter((r) => r.studentId === student.id);
  const studentGrades = grades.filter((g) => g.studentId === student.id);
  const hasOutstandingBalance = assessment ? (assessment.balance > 0 && !overrideSettleBalance) : false;
  const isBasicEd = student.department === "Basic Education";
  const gradesLocked = hasOutstandingBalance;

  const currentEnrollment = enrollments.find((e) => e.studentId === student.id && e.status === "Enrolled");
  const loadedSubjects = subjects.filter((sub) => {
    if (currentEnrollment) return currentEnrollment.subjectCodes.includes(sub.code);
    return sub.department === student.department && sub.trackOrCourse === student.trackOrCourse;
  });

  const validGrades = studentGrades.filter((g) => g.finalGrade !== null);
  const gpa = validGrades.length > 0
    ? (validGrades.reduce((sum, g) => sum + g.finalGrade, 0) / validGrades.length).toFixed(2)
    : "—";

  const statuses = ["Applicant", "Assessed", "Partially Paid", "Fully Paid", "Enrolled", "Sectioned"];
  const currentStatusString = overrideSettleBalance ? "Fully Paid" : (student.enrollmentStatus || "Enrolled");
  const getStepIndex = (status: string) => {
    if (status === "Pending" || status === "Draft") return 0;
    if (status === "Assessed" || status === "Approved") return 1;
    if (status === "Partially Paid") return 2;
    if (status === "Fully Paid") return 3;
    if (status === "Enrolled") return 4;
    if (status === "Sectioned") return 5;
    return 4;
  };
  const currentStepIdx = getStepIndex(currentStatusString);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const newLog = {
      date: new Date().toISOString().replace("T", " ").substring(0, 16),
      action: "Updated student contact, personal, and address fields",
      category: "User Edit"
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    setProfileSuccessMessage("Profile parameters successfully updated! Recorded to student audit trail.");
    setTimeout(() => setProfileSuccessMessage(""), 5000);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoPreview(URL.createObjectURL(file));
      const newLog = {
        date: new Date().toISOString().replace("T", " ").substring(0, 16),
        action: `Uploaded student portrait frame: ${file.name}`,
        category: "Upload"
      };
      setAuditLogs((prev) => [newLog, ...prev]);
    }
  };

  const handleDocumentFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!pendingUploadReqName) return;
    const file = e.target.files?.[0];
    if (!file) return;
    updateRequirementUpload(student.id, pendingUploadReqName, file.name);
    const newLog = {
      date: new Date().toISOString().replace("T", " ").substring(0, 16),
      action: `Uploaded document: "${pendingUploadReqName}" — ${file.name}`,
      category: "Upload"
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    setPendingUploadReqName(null);
    if (uploadInputRef.current) uploadInputRef.current.value = "";
  };

  const triggerDocUpload = (reqName: string) => {
    setPendingUploadReqName(reqName);
    uploadInputRef.current?.click();
  };

  const tabDef: { id: PortalTab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "My Dashboard & Schedule", icon: Calendar },
    { id: "grades", label: `Academic Report Card${gradesLocked ? " 🔒" : ""}`, icon: BookOpen },
    { id: "elearning", label: "Online Learning", icon: Monitor },
    { id: "ledger", label: "Financial Ledger Statement", icon: CreditCard },
    { id: "profile", label: "Editable Student Profile", icon: User },
    { id: "enrollment", label: "Enrollment", icon: ClipboardList }
  ];

  return (
    <div className="space-y-6 animate-fade-in font-sans text-stone-850">

      {/* HERO HEADER */}
      <div className="card-hero-gradient text-white p-6 rounded-2xl border border-stsn-brown/30 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="bg-stsn-gold/20 border border-stsn-gold/30 text-stsn-gold-light text-[10px] font-mono uppercase px-2.5 py-1 rounded-full font-bold">
            Academic Registrar Verified Access
          </span>
          <h2 className="text-2xl font-display font-medium mt-2 text-white">
            Mabuhay, {firstName}!
          </h2>
          <p className="text-stone-300 text-xs mt-1">
            {isBasicEd ? "Strand" : "Course"}: <strong className="text-stsn-gold-light">{student.trackOrCourse || "STEM"}</strong>
            {" "}• Department: <strong>{student.department}</strong>
            {" "}• Year Level: <strong className="text-stsn-gold-light">{student.yearLevel}</strong>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsCorModalOpen(true)}
            className="btn-gold-gradient border border-stsn-gold/50 text-white text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer shadow-md flex items-center gap-1.5 transition"
          >
            <Award className="w-4 h-4" />
            Official COR PDF
          </button>
        </div>
      </div>

      {/* TAB CONTROLLERS */}
      <div className="flex border-b border-stsn-beige/70 gap-1 overflow-x-auto pb-0">
        {tabDef.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-t-lg transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 border-b-2 ${
                isActive
                  ? "bg-stsn-brown text-white border-stsn-gold shadow-sm"
                  : "text-stone-500 hover:text-stsn-brown-dark border-transparent hover:bg-stone-50"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ENROLLMENT STEPPER BAR */}
      <div className="bg-white p-5 rounded-xl border border-stsn-beige shadow-sm">
        <div className="flex justify-between items-center pb-2.5 mb-4 border-b border-stone-100">
          <div>
            <span className="text-[9.5px] font-mono text-stone-400 font-bold uppercase block">Enrollment Progress Tracker</span>
            <span className="text-xs font-bold text-stone-900 uppercase">Interactive Enrollment Milestone</span>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stsn-gold/20 text-[#603513] border border-stsn-gold/30">
            Active Status: {currentStatusString}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {statuses.map((item, idx) => {
            const isCompleted = idx <= currentStepIdx;
            const isActive = idx === currentStepIdx;
            return (
              <div
                key={item}
                className={`p-2.5 rounded-lg border text-center transition ${
                  isActive
                    ? "stepper-active scale-102 font-bold shadow-md"
                    : isCompleted
                    ? "bg-stone-50 border-green-200 text-green-700 font-medium"
                    : "bg-stone-50/50 border-stone-200 text-stone-400"
                }`}
              >
                <div className="flex justify-center mb-1">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <span className="text-[10px] font-mono bg-stone-200 text-stone-500 font-bold px-1.5 rounded">
                      Step {idx + 1}
                    </span>
                  )}
                </div>
                <span className="text-[10px] block truncate">{item}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================== TAB A: OVERVIEW ========================== */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="card-stat-gradient p-5 rounded-xl shadow-sm smooth-hover flex justify-between items-center">
                <div>
                  <span className="text-[9.5px] font-mono uppercase text-stone-400 font-bold">Semestral Standing</span>
                  <span className="text-xl font-display font-bold text-stone-900 mt-1 block">GPA {gpa}</span>
                  <span className="text-[10px] text-green-600 font-semibold block mt-0.5">Status: Regularly Cleared</span>
                </div>
                <div className="p-3 rounded-full bg-gradient-to-br from-stsn-cream to-stsn-beige border border-stsn-beige text-stsn-brown shadow-sm">
                  <FileCheck className="w-5 h-5" />
                </div>
              </div>

              <div className="card-stat-gradient p-5 rounded-xl shadow-sm smooth-hover flex justify-between items-center">
                <div>
                  <span className="text-[9.5px] font-mono uppercase text-stone-400 font-bold">Outstanding Balance</span>
                  <span className={`text-xl font-display font-bold block mt-1 ${hasOutstandingBalance ? "text-red-600" : "text-green-600"}`}>
                    ₱{hasOutstandingBalance ? assessment?.balance.toLocaleString() : "0"}
                  </span>
                  <span className="text-[10px] text-stone-400 block mt-0.5">Mode: {assessment?.paymentTerm || "Monthly"}</span>
                </div>
                <div className={`p-3 rounded-full shadow-sm ${hasOutstandingBalance ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>

              <div className="card-stat-gradient p-5 rounded-xl shadow-sm smooth-hover flex justify-between items-center">
                <div>
                  <span className="text-[9.5px] font-mono uppercase text-stone-400 font-bold">Loaded Schedule</span>
                  <span className="text-xl font-display font-bold text-stone-900 mt-1 block">
                    {isBasicEd ? `${loadedSubjects.length} Subj.` : `${loadedSubjects.reduce((a, s) => a + s.units, 0)} Units`}
                  </span>
                  <span className="text-[10px] text-stone-400 block mt-0.5">{loadedSubjects.length} Acad Subjects</span>
                </div>
                <div className="p-3 rounded-full bg-gradient-to-br from-stsn-cream to-stsn-beige border border-stsn-beige text-stsn-brown shadow-sm">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Class Schedules */}
            <div className="bg-white p-6 rounded-xl border border-stsn-beige shadow-sm">
              <div className="flex justify-between items-center border-b border-stone-100 pb-2.5 mb-4">
                <h3 className="text-xs font-display font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-stsn-gold" />
                  Schedules Class Timeslots
                </h3>
                <span className="text-[9.5px] font-mono bg-stone-50 border border-stone-200/80 px-2.5 py-0.5 rounded-full text-stone-400">
                  Campus: Novaliches, QC
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loadedSubjects.map((sub, idx) => (
                  <div key={sub.id} className="p-4 bg-stone-50 border border-stone-200/60 rounded-xl flex justify-between items-center hover:bg-stone-100/50 transition smooth-hover">
                    <div>
                      <span className="font-mono text-[9px] font-bold text-stsn-brown uppercase block tracking-wider">Lec Room C-{102 + idx}</span>
                      <h4 className="text-xs font-bold text-stone-900 mt-0.5">{sub.name}</h4>
                      <span className="text-[10px] text-stone-450 block font-medium mt-1">
                        TTh {idx % 2 === 0 ? "08:30 AM - 10:00 AM" : "10:30 AM - 12:00 PM"}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] bg-stsn-gold/15 border border-stsn-gold/25 text-stsn-brown font-mono font-bold rounded px-2 py-0.5">
                        {isBasicEd ? "K-12" : `${sub.units} UNITS`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Announcements */}
            <div className="bg-white p-6 rounded-xl border border-stsn-beige shadow-sm space-y-4">
              <h3 className="text-xs font-display font-bold text-stone-900 uppercase tracking-widest pb-2.5 border-b border-stone-100">
                School Bulletins & Directives
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {announcements.slice(0, 4).map((ann) => (
                  <div key={ann.id} className="p-3 bg-stsn-cream/30 border border-stsn-beige/40 rounded-xl space-y-1.5 card-gold-accent smooth-hover">
                    <div className="flex justify-between text-[9px] text-stone-400">
                      <span className="bg-stsn-gold/20 text-[#603513] font-bold font-mono uppercase px-1.5 rounded">{ann.category}</span>
                      <span>{ann.date}</span>
                    </div>
                    <h4 className="text-xs font-bold text-stone-900 mt-1.5 leading-snug">{ann.title}</h4>
                    <p className="text-[10.5px] text-stone-500 font-medium leading-relaxed mt-1 line-clamp-2">{ann.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ID Card Column */}
          <div className="flex flex-col items-center">
            <div className="bg-white p-6 rounded-xl border border-stsn-beige shadow-sm w-full space-y-4">
              <div className="flex justify-between items-center border-b border-stone-100 pb-2">
                <h4 className="text-xs font-display font-semibold text-stone-850 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-stsn-gold" />
                  Executive Lanyard ID Card
                </h4>
                <button
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="text-stsn-brown hover:text-white hover:bg-stsn-brown text-[10px] font-bold flex items-center gap-1 py-1.5 px-3 border border-stsn-beige bg-stsn-cream/30 rounded-lg cursor-pointer transition"
                >
                  <RotateCw className="w-3 h-3 text-stsn-gold" />
                  {isFlipped ? "Show Front" : "Flip Card"}
                </button>
              </div>

              {/* Lanyard Graphic */}
              <div className="flex flex-col items-center pt-2 select-none">
                <div className="w-2.5 h-6 bg-stsn-brown-dark rounded-full shadow-inner" />
                <div className="w-14 h-16 border-l-4 border-r-4 border-stsn-brown rounded-b-2xl relative flex items-center justify-center">
                  <span className="absolute bottom-1 bg-stsn-gold text-[#1e0a01] font-mono text-[5px] font-bold px-1 rounded uppercase tracking-[0.2px]">
                    STSN SECURE
                  </span>
                </div>
                <div className="w-4 h-4 border-2 border-stsn-gold bg-stone-300 rounded-full shadow-md z-10" />

                {/* ID Card with 3D flip */}
                <div className="mt-1">
                  <IDCardPreview
                    name={photoPreview ? `${firstName} ${lastName}` : `${student.firstName} ${student.lastName}`}
                    roleType="STUDENT"
                    idNo={student.studentNo}
                    trackOrDept={student.trackOrCourse || "STEM Dept"}
                    email={student.email}
                    isFlipped={isFlipped}
                  />
                </div>
              </div>

              <p className="text-[9.5px] text-stone-400 text-center leading-relaxed font-mono pt-4 border-t border-stone-100">
                {isFlipped
                  ? "← Showing BACK side. Click 'Show Front' to return."
                  : "Secure QR Lookup. Valid for campus security readers at Novaliches gates."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================== TAB B: GRADES ========================== */}
      {activeTab === "grades" && (
        <div className="space-y-6">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-xs font-bold text-amber-800 uppercase block tracking-wider font-mono">Financial Status Rule Enforcement</span>
                <p className="text-[11.5px] text-amber-700 leading-relaxed max-w-2xl mt-0.5 font-medium">
                  Outstanding balances under payment plan <strong>{assessment?.paymentTerm}</strong> restrict grade release until treasury clearance.
                </p>
              </div>
            </div>
            <button
              onClick={() => setOverrideSettleBalance(!overrideSettleBalance)}
              className={`text-xs px-4 py-2 font-bold uppercase rounded-lg border shadow-sm transition whitespace-nowrap cursor-pointer ${
                overrideSettleBalance
                  ? "bg-green-600 text-white border-green-700 hover:bg-green-700"
                  : "bg-white border-amber-300 text-amber-800 hover:bg-amber-100"
              }`}
            >
              {overrideSettleBalance ? "↩ Re-enable Balance Check" : "💳 Resolve Mock Balance"}
            </button>
          </div>

          {gradesLocked ? (
            <div className="bg-white border-2 border-dashed border-stone-250 p-12 rounded-xl text-center shadow-sm flex flex-col items-center justify-center space-y-4 max-w-2xl mx-auto">
              <div className="p-5 bg-red-50 text-red-700 rounded-full border border-red-100 shadow-inner relative animate-pulse">
                <Lock className="w-10 h-10" />
              </div>
              <div>
                <h3 className="font-display font-black text-stone-900 uppercase text-base tracking-widest">Academic Grades Encrypted</h3>
                <span className="text-[11px] font-mono text-red-600 font-bold block mt-1">OUTSTANDING ACCOUNT BALANCE RESTRICTION ACTIVE</span>
              </div>
              <p className="text-xs text-stone-500 leading-relaxed max-w-lg">
                Your account balance is <strong className="text-red-700">₱{assessment?.balance.toLocaleString()}</strong>. Full treasury clearance is required prior to grade release.
              </p>
              <button
                onClick={() => setOverrideSettleBalance(true)}
                className="btn-primary-gradient text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
              >
                Bypass with Treasury Clearance Authorization
              </button>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-xl border border-stsn-beige shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2.5 border-b border-stone-100">
                <div>
                  <h3 className="text-xs font-display font-extrabold text-stone-950 uppercase tracking-widest flex items-center gap-1.5">
                    <Unlock className="w-4 h-4 text-green-600" />
                    Unlocked Semestral Report Card
                  </h3>
                  <p className="text-[10.5px] text-stone-400 font-mono mt-0.5 uppercase">Academic Year 2026-2027 • First Semester</p>
                </div>
                <span className="text-[9.5px] bg-green-50 border border-green-200 text-green-700 px-2.5 py-0.5 rounded-full font-bold">FINANCIALLY CLEARED</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-stone-100 rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-150 font-bold text-stone-500 text-[10px] uppercase">
                      <th className="p-3">Syllabus Code</th>
                      <th className="p-3">Course Module</th>
                      {!isBasicEd && <th className="p-3 text-center">Midterm</th>}
                      {isBasicEd ? (
                        <>
                          <th className="p-3 text-center">Q1</th>
                          <th className="p-3 text-center">Q2</th>
                          <th className="p-3 text-center">Q3</th>
                          <th className="p-3 text-center">Q4</th>
                        </>
                      ) : (
                        <th className="p-3 text-center">Final Grade</th>
                      )}
                      <th className="p-3 text-center">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-medium text-stone-700">
                    {loadedSubjects.map((sub) => {
                      const findGrade = studentGrades.find((g) => g.subjectCode === sub.code);
                      const avg = findGrade ? (findGrade.midtermGrade + findGrade.finalGrade) / 2 : 0;
                      const isPassed = findGrade && avg >= 75;
                      const q1 = findGrade?.midtermGrade || 85;
                      const q2 = findGrade?.finalGrade || 87;
                      const q3 = Math.min(100, q1 + 2);
                      const q4 = Math.min(100, q2 - 1);
                      return (
                        <tr key={sub.id} className="hover:bg-stone-50/50">
                          <td className="p-3 font-mono text-stsn-brown font-bold">{sub.code}</td>
                          <td className="p-3 font-bold text-stone-900">{sub.name}</td>
                          {!isBasicEd && <td className="p-3 text-center font-mono">{findGrade?.midtermGrade ?? "—"}</td>}
                          {isBasicEd ? (
                            <>
                              <td className="p-3 text-center font-mono">{q1}</td>
                              <td className="p-3 text-center font-mono">{q2}</td>
                              <td className="p-3 text-center font-mono">{q3}</td>
                              <td className="p-3 text-center font-mono">{q4}</td>
                            </>
                          ) : (
                            <td className="p-3 text-center font-mono">{findGrade?.finalGrade ?? "—"}</td>
                          )}
                          <td className="p-3 text-center">
                            {findGrade ? (
                              <span className={`inline-block text-[9.5px] font-bold px-2 py-0.5 rounded ${isPassed ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                                {isPassed ? "PASSED" : "FAILED"}
                              </span>
                            ) : (
                              <span className="text-[10px] text-stone-400 italic font-medium">Incomplete</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-stone-50 border border-stone-200/55 rounded-xl flex flex-col sm:flex-row justify-between text-xs font-medium text-stone-500">
                <span>Semestral Weighted Average: <strong>{gpa} {isBasicEd ? "%" : "GPA"}</strong></span>
                <span className="text-stone-400">All subject codes logged by instructors</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================== TAB: ONLINE LEARNING ========================== */}
      {activeTab === "elearning" && (
        <div className="space-y-5">
          {/* Video Player Modal */}
          {viewingLms && viewingLms.learningType === "Video" && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-fade-in" onClick={() => setViewingLms(null)}>
              <div className="bg-stone-900 rounded-2xl shadow-2xl w-full max-w-3xl mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
                  <h3 className="text-sm font-bold text-white leading-tight truncate pr-4">{viewingLms.title}</h3>
                  <button onClick={() => setViewingLms(null)} className="p-1.5 rounded-lg hover:bg-white/10 text-stone-400 hover:text-white cursor-pointer flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                {viewingLms.videoUrl && (
                  <div className="aspect-video w-full bg-black">
                    <iframe src={viewingLms.videoUrl} title={viewingLms.title} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                  </div>
                )}
                <div className="px-5 py-3 border-t border-white/10">
                  <p className="text-xs text-stone-400">{viewingLms.description}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] font-mono text-stone-500">
                    <span>{viewingLms.subjectName}</span><span>•</span><span>{viewingLms.teacherName}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Document Viewer Modal */}
          {viewingLms && viewingLms.learningType !== "Video" && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in" onClick={() => setViewingLms(null)}>
              <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md mx-4 text-center" onClick={(e) => e.stopPropagation()}>
                <div className="w-12 h-12 rounded-2xl bg-stsn-cream mx-auto mb-3 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-stsn-brown" />
                </div>
                <h3 className="text-sm font-bold text-stone-800">{viewingLms.title}</h3>
                <p className="text-xs text-stone-500 mt-1 mb-2">{viewingLms.subjectName} • {viewingLms.teacherName}</p>
                <p className="text-xs text-stone-400 mb-3">{viewingLms.description}</p>
                {viewingLms.fileName && <p className="text-[10px] font-mono bg-stone-50 rounded-lg p-2 mb-3">{viewingLms.fileName}{viewingLms.fileSize && ` • ${viewingLms.fileSize}`}</p>}
                <div className="flex gap-2">
                  <button onClick={() => setViewingLms(null)} className="flex-1 py-2 rounded-lg border border-stone-200 text-xs font-medium cursor-pointer hover:bg-stone-50">Close</button>
                  <button className="flex-1 py-2 rounded-lg bg-stsn-brown text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer">
                    <Download className="w-3.5 h-3.5" />Download
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Header Banner */}
          <div className="flex items-center gap-4 bg-gradient-to-r from-stsn-brown to-stsn-brown-dark rounded-2xl p-5 text-white">
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <Monitor className="w-5 h-5 text-stsn-gold" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold">Online Learning Portal</h3>
              <p className="text-xs text-stone-300 mt-0.5">All published lessons from your teachers</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-display font-black text-stsn-gold">
                {learningMaterials.filter((m) => m.publishStatus === "Published").length}
              </p>
              <p className="text-[10px] font-mono text-stone-300">Available Lessons</p>
            </div>
          </div>

          {/* Search + Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder="Search lessons, subjects, teachers..."
                value={lmsSearch}
                onChange={(e) => setLmsSearch(e.target.value)}
                className="w-full bg-white border border-stone-200 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-brown/20 focus:border-stsn-brown"
              />
            </div>
            <div className="flex gap-1">
              {(["All", "Video", "Module", "Document"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setLmsType(t)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    lmsType === t
                      ? "bg-stsn-brown text-white border-stsn-brown shadow-sm"
                      : "bg-white text-stone-600 border-stone-200 hover:border-stsn-brown/40"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Materials Grid — show ALL published for demo */}
          {(() => {
            const allPublished = learningMaterials.filter((m) => {
              if (m.publishStatus !== "Published") return false;
              const q = lmsSearch.toLowerCase();
              const matchSearch = !q || m.title.toLowerCase().includes(q) || m.subjectName.toLowerCase().includes(q) || m.teacherName.toLowerCase().includes(q);
              const matchType = lmsType === "All" || m.learningType === lmsType;
              return matchSearch && matchType;
            });

            if (allPublished.length === 0) {
              return (
                <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
                  <Monitor className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-stone-500">No learning materials found</p>
                  <p className="text-xs text-stone-400 mt-1">Try adjusting your search or filters</p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {allPublished.map((m) => {
                  const isVideo = m.learningType === "Video";
                  const thumb = m.thumbnailUrl || undefined;
                  return (
                    <div key={m.id} className="bg-white rounded-2xl border border-stone-200/70 shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col group">
                      {/* Thumbnail */}
                      <div
                        className="h-32 bg-gradient-to-br from-stsn-brown/10 to-stsn-gold/5 relative cursor-pointer overflow-hidden flex-shrink-0"
                        style={thumb ? { backgroundImage: `url("${thumb}")`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
                        onClick={() => setViewingLms(m)}
                      >
                        {!thumb && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            {isVideo
                              ? <Play className="w-10 h-10 text-stsn-brown/25" />
                              : <FileText className="w-10 h-10 text-stsn-brown/25" />}
                          </div>
                        )}
                        {isVideo && thumb && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 group-hover:opacity-100 transition-all">
                            <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                              <Play className="w-4 h-4 text-stsn-brown ml-0.5" />
                            </div>
                          </div>
                        )}
                        {/* Type badge */}
                        <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1 border ${
                          m.learningType === "Video" ? "bg-blue-100 text-blue-700 border-blue-200" :
                          m.learningType === "Module" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                          "bg-amber-100 text-amber-700 border-amber-200"
                        }`}>
                          {isVideo ? <Video className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                          {m.learningType}
                        </div>
                        {/* School badge */}
                        <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[8px] font-bold ${
                          m.schoolId === "STSN" ? "bg-stsn-brown/80 text-stsn-gold-light" : "bg-blue-700/80 text-blue-100"
                        }`}>
                          {m.schoolId}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 flex flex-col flex-1">
                        <h4
                          className="text-xs font-bold text-stone-800 line-clamp-2 cursor-pointer hover:text-stsn-brown transition-colors"
                          onClick={() => setViewingLms(m)}
                        >
                          {m.title}
                        </h4>
                        <p className="text-[10px] text-stone-500 mt-1.5 line-clamp-2 flex-1 leading-relaxed">{m.description}</p>

                        <div className="mt-2 space-y-0.5">
                          <p className="text-[10px] text-stone-500">
                            <span className="font-semibold text-stsn-gold">Subject:</span> {m.subjectName}
                          </p>
                          <p className="text-[10px] text-stone-400">
                            <span className="font-semibold">Teacher:</span> {m.teacherName}
                          </p>
                          <p className="text-[10px] text-stone-400 font-mono">
                            {m.section} • {m.uploadDate}
                          </p>
                        </div>

                        <div className="mt-3 pt-3 border-t border-stone-100 flex gap-2">
                          <button
                            onClick={() => setViewingLms(m)}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-stsn-brown hover:bg-stsn-brown-dark text-white text-[11px] font-semibold cursor-pointer transition-all"
                          >
                            {isVideo ? <><Play className="w-3 h-3" />Watch</> : <><Eye className="w-3 h-3" />Open</>}
                          </button>
                          {!isVideo && (
                            <button className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-semibold cursor-pointer flex items-center gap-1 transition-all">
                              <Download className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================== TAB C: LEDGER ========================== */}
      {activeTab === "ledger" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-stsn-beige shadow-sm space-y-4 md:col-span-2">
              <div className="flex justify-between items-center border-b border-stone-100 pb-3">
                <div>
                  <h3 className="text-xs font-display font-extrabold text-stone-950 uppercase tracking-widest">Statement of Student Ledger</h3>
                  <span className="text-[10px] text-stone-400">Current active assessment record</span>
                </div>
                <span className={`text-[9.5px] font-mono px-2 py-0.5 rounded uppercase font-bold border ${isBasicEd ? "bg-stsn-gold/20 border-stsn-gold/30 text-stsn-brown" : "bg-blue-50 border-blue-200 text-blue-700"}`}>
                  {isBasicEd ? "St. Theresa's School" : "Colegio de Sta. Teresa"}
                </span>
              </div>
              <div className="space-y-2 mt-4 text-xs font-medium">
                <div className="flex justify-between p-2.5 bg-stone-50 rounded-lg border border-stone-200/50">
                  <span>Gross Tuition Balance:</span>
                  <span className="font-mono text-stone-900">₱{assessment ? (assessment.totalAmount - 8500).toLocaleString() : "14,500.00"}</span>
                </div>
                <div className="flex justify-between p-2.5 bg-stone-50 rounded-lg border border-stone-200/50">
                  <span>Registration & ID Assessment Fee:</span>
                  <span className="font-mono text-stone-900">₱1,500.00</span>
                </div>
                <div className="flex justify-between p-2.5 bg-stone-50 rounded-lg border border-stone-200/50">
                  <span>Laboratory Use Surcharge:</span>
                  <span className="font-mono text-stone-900">₱4,000.00</span>
                </div>
                <div className="flex justify-between p-2.5 bg-stone-50 rounded-lg border border-stone-200/50">
                  <span>Miscellaneous Athletic/Library Surcharge:</span>
                  <span className="font-mono text-stone-900">₱3,000.00</span>
                </div>
                <div className="pt-3 border-t border-stone-200 flex justify-between font-bold text-stone-950 text-sm">
                  <span>Gross Assessed Billing Total:</span>
                  <span className="font-mono text-stsn-brown">₱{assessment?.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-stsn-beige shadow-sm space-y-4">
              <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-stone-400 border-b border-stone-100 pb-2">Instalment Due Schedule</h4>
              <div className="space-y-3 font-mono text-[11px] text-stone-500">
                {[
                  { label: "1st Installment (Down)", amount: "₱8,500.00", due: "June 15, 2026", paid: true },
                  { label: "2nd Installment (Mid)", amount: `₱${assessment ? (assessment.balance / 2).toLocaleString() : "9,000.00"}`, due: "Sept 15, 2026", paid: overrideSettleBalance },
                  { label: "3rd Installment (Final)", amount: `₱${assessment ? (assessment.balance / 2).toLocaleString() : "9,000.00"}`, due: "Oct 30, 2026", paid: overrideSettleBalance }
                ].map((item) => (
                  <div key={item.label} className="p-3 bg-stsn-cream/40 rounded-xl space-y-1">
                    <div className="flex justify-between text-stone-900 font-bold">
                      <span>{item.label}</span>
                      <span className={item.paid ? "text-green-600" : "text-amber-700"}>{item.amount}</span>
                    </div>
                    <div className="flex justify-between text-[9px] text-stone-400">
                      <span>Due: {item.due}</span>
                      <span className={`font-bold uppercase ${item.paid ? "text-green-600" : "text-amber-700"}`}>
                        {item.paid ? "PAID" : "OUTSTANDING"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-stsn-beige shadow-sm space-y-4">
            <h3 className="text-xs font-display font-extrabold text-stone-950 uppercase tracking-widest pb-2.5 border-b border-stone-100">Receipt Payment History Audit</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-stone-50 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-150 font-bold text-stone-500 text-[10px] uppercase">
                    <th className="p-3">Reference OR No</th>
                    <th className="p-3">Date Timestamp</th>
                    <th className="p-3">Term Settled</th>
                    <th className="p-3">Method</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium text-stone-600">
                  {payments.filter((p) => p.studentId === student.id).map((pay) => (
                    <tr key={pay.id} className="hover:bg-stone-50/50">
                      <td className="p-3 font-mono font-bold text-[#6D4C41]">{pay.orNumber}</td>
                      <td className="p-3">{pay.paymentDate}</td>
                      <td className="p-3 font-bold text-stone-800">{pay.term}</td>
                      <td className="p-3 font-semibold uppercase">{pay.paymentMethod}</td>
                      <td className="p-3 text-right font-mono font-bold text-green-700">₱{pay.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                  {overrideSettleBalance && (
                    <tr className="bg-green-50/50">
                      <td className="p-3 font-mono font-bold text-green-800">OR-MOCK-CLEARANCE</td>
                      <td className="p-3">Today (Simulated)</td>
                      <td className="p-3 font-bold text-stone-800">Full Settlement</td>
                      <td className="p-3 font-semibold uppercase">Treasury Exemption</td>
                      <td className="p-3 text-right font-mono font-bold text-green-700">₱{assessment?.balance.toLocaleString()}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================== TAB D: PROFILE ========================== */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSaveProfile} className="bg-white p-6 rounded-xl border border-stsn-beige shadow-sm space-y-6">
              <div className="flex justify-between items-center pb-3 border-b border-stone-100">
                <div>
                  <h3 className="text-xs font-display font-extrabold text-stone-950 uppercase tracking-widest flex items-center gap-1.5">
                    <Settings className="w-4 h-4 text-stsn-gold" />
                    Modify Student Demographics
                  </h3>
                  <p className="text-[10.5px] text-stone-400 mt-0.5">Edit contact and demographic fields. Non-editable parameters require administrative vetting.</p>
                </div>
                <button type="submit" className="btn-primary-gradient text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer flex items-center gap-1">
                  Save Profile Changes
                </button>
              </div>

              {profileSuccessMessage && (
                <div className="p-3.5 bg-green-50 border border-green-200 text-green-800 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>{profileSuccessMessage}</span>
                </div>
              )}

              <div className="space-y-4">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#3E1E09] block">1. Demographic & Personal Information</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: "First Name", value: firstName, setter: setFirstName, required: true },
                    { label: "Last Name", value: lastName, setter: setLastName, required: true },
                    { label: "Middle Name", value: middleName, setter: setMiddleName, required: false },
                    { label: "Affiliated Religion", value: religion, setter: setReligion, required: false },
                    { label: "Affiliated Nationality", value: nationality, setter: setNationality, required: false },
                  ].map(({ label, value, setter, required }) => (
                    <div key={label}>
                      <label className="block text-[10.5px] text-stone-500 font-bold uppercase mb-1">{label}</label>
                      <input
                        type="text"
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs outline-none focus:ring-1 focus:ring-stsn-gold focus:bg-white transition"
                        value={value}
                        onChange={(e) => setter(e.target.value)}
                        required={required}
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-[10.5px] text-stone-500 font-bold uppercase mb-1">Gender</label>
                    <select className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs outline-none focus:ring-1 focus:ring-stsn-gold" value={gender} onChange={(e: any) => setGender(e.target.value)}>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-stone-150">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#3E1E09] block">2. Contact & Address Parameters</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: "Mobile Contact No", value: contactNo, setter: setContactNo },
                    { label: "Registered Address", value: address, setter: setAddress },
                    { label: "Municipality / City", value: municipality, setter: setMunicipality },
                  ].map(({ label, value, setter }) => (
                    <div key={label}>
                      <label className="block text-[10.5px] text-stone-500 font-bold uppercase mb-1">{label}</label>
                      <input type="text" className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs outline-none focus:ring-1 focus:ring-stsn-gold" value={value} onChange={(e) => setter(e.target.value)} required />
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10.5px] text-stone-500 font-bold uppercase mb-1">Province</label>
                      <input type="text" className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs outline-none focus:ring-1 focus:ring-stsn-gold" value={province} onChange={(e) => setProvince(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-[10.5px] text-stone-500 font-bold uppercase mb-1">Zip Code</label>
                      <input type="text" className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs outline-none focus:ring-1 focus:ring-stsn-gold" value={zipCode} onChange={(e) => setZipCode(e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-stone-150">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#3E1E09] block">3. Emergency / Guardian Contacts</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10.5px] text-stone-500 font-bold uppercase mb-1">Guardian Name</label>
                    <input type="text" className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs outline-none focus:ring-1 focus:ring-stsn-gold" value={guardianName} onChange={(e) => setGuardianName(e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-[10.5px] text-stone-500 font-bold uppercase mb-1">Guardian Contact Number</label>
                    <input type="text" className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs outline-none focus:ring-1 focus:ring-stsn-gold" value={guardianContact} onChange={(e) => setGuardianContact(e.target.value)} required />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-150 bg-stone-50 p-4 rounded-xl border border-stone-200">
                <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1 mb-3">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                  Locked Academic Fields (Read-Only)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono text-stone-400">
                  {[
                    { label: "Student ID Code", val: student.studentNo },
                    { label: "Section Advisory", val: student.section || "St. Thomas" },
                    { label: "Department Level", val: student.department },
                    { label: "Accredited Course", val: student.trackOrCourse || "STEM" }
                  ].map(({ label, val }) => (
                    <div key={label}>
                      <span className="block text-[9px] uppercase font-bold text-stone-400">{label}</span>
                      <strong className="text-stone-700 font-semibold">{val}</strong>
                      <span className="text-[8px] font-semibold text-red-600 block mt-0.5">Registrar Clearance Required</span>
                    </div>
                  ))}
                </div>
              </div>
            </form>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-stsn-beige shadow-sm space-y-4">
              <h4 className="text-xs font-display font-extrabold text-stone-950 uppercase tracking-widest pb-2 border-b border-stone-100 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-stsn-gold" />
                Photo Management
              </h4>
              <div className="flex flex-col items-center justify-center p-4 border border-dashed border-stone-200 bg-stone-50 rounded-xl hover:bg-stone-50/85 transition group">
                {photoPreview ? (
                  <img src={photoPreview} className="w-24 h-24 object-cover rounded-2xl border-4 border-stsn-gold/50 shadow-md" alt="Portrait" />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-stone-200 border border-stone-300 flex items-center justify-center text-stone-400">
                    <User className="w-12 h-12" />
                  </div>
                )}
                <span className="text-[10px] text-stone-450 mt-2 font-mono text-center block">2x2 White background required</span>
                <label className="mt-3 bg-stsn-cream text-stsn-brown border border-stsn-beige/85 hover:bg-stsn-beige/40 text-[10px] font-bold px-3 py-1.5 rounded transition shadow-sm cursor-pointer">
                  Upload Portrait JPG
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>
            </div>

            {/* Hidden file input for document uploads */}
            <input
              ref={uploadInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              className="hidden"
              onChange={handleDocumentFileSelect}
            />

            <div className="bg-white p-6 rounded-xl border border-stsn-beige shadow-sm space-y-4">
              <h4 className="text-xs font-display font-extrabold text-stone-950 uppercase tracking-widest pb-2 border-b border-stone-100 flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-stsn-gold" />
                Enrollment Credentials
              </h4>
              {studentReqs.length === 0 ? (
                <p className="text-xs text-stone-400 italic">No requirement records found for your account.</p>
              ) : (
                <div className="space-y-3 text-xs">
                  {studentReqs.map((req) => {
                    const isHardcopyDone = req.hardcopySubmitted === true;
                    const isVerified = req.verificationStatus === "Verified";
                    const isRejected = req.verificationStatus === "Rejected";
                    const isUploaded = req.uploadStatus === "Uploaded";
                    const canUpload = !isHardcopyDone;

                    return (
                      <div key={req.id} className={`p-3 border rounded-xl space-y-2 ${isHardcopyDone ? "bg-green-50 border-green-200" : isRejected ? "bg-red-50 border-red-200" : isUploaded ? "bg-blue-50 border-blue-200" : "bg-stone-50 border-stone-200"}`}>
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <span className="font-bold text-stone-900 block leading-tight">{req.name}</span>
                            {req.uploadFileName && (
                              <span className="text-[9px] text-stone-500 font-mono block mt-0.5 truncate">
                                📎 {req.uploadFileName} {req.uploadDate ? `• ${req.uploadDate}` : ""}
                              </span>
                            )}
                            {req.remarks && (
                              <span className="text-[9px] text-red-600 italic block mt-0.5">
                                Registrar: "{req.remarks}"
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            {/* Upload status badge */}
                            <span className={`font-bold font-mono px-1.5 py-0.5 rounded text-[9px] uppercase border ${
                              isHardcopyDone ? "bg-green-100 text-green-700 border-green-300" :
                              isVerified ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                              isRejected ? "bg-red-50 text-red-600 border-red-200" :
                              isUploaded ? "bg-blue-50 text-blue-700 border-blue-200" :
                              "bg-amber-50 text-amber-700 border-amber-200"
                            }`}>
                              {isHardcopyDone ? "✓ Hardcopy OK" :
                               isVerified ? "✓ Verified" :
                               isRejected ? "✗ Rejected" :
                               isUploaded ? "Uploaded" : "Not Uploaded"}
                            </span>
                            {/* Verification badge */}
                            {req.verificationStatus && !isHardcopyDone && (
                              <span className={`text-[8px] font-mono px-1 py-0.5 rounded border ${
                                isVerified ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                isRejected ? "bg-red-50 text-red-600 border-red-100" :
                                "bg-stone-100 text-stone-500 border-stone-200"
                              }`}>
                                {req.verificationStatus}
                                {req.verifiedBy ? ` by ${req.verifiedBy}` : ""}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Upload button — disabled if hardcopy already submitted */}
                        {canUpload && (
                          <button
                            onClick={() => triggerDocUpload(req.name)}
                            className={`w-full text-[10px] font-bold py-1.5 px-3 rounded-lg border cursor-pointer flex items-center justify-center gap-1.5 transition ${
                              isRejected
                                ? "bg-red-600 hover:bg-red-700 text-white border-red-600"
                                : isUploaded
                                ? "bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200"
                                : "bg-stsn-brown hover:bg-stsn-brown-dark text-white border-stsn-brown"
                            }`}
                          >
                            <UploadCloud className="w-3.5 h-3.5" />
                            {isRejected ? "Re-Upload (Rejected)" : isUploaded ? "Replace File" : "Upload Document"}
                          </button>
                        )}

                        {isHardcopyDone && (
                          <div className="flex items-center gap-1.5 text-[9px] text-green-700 font-mono">
                            <CheckCircle2 className="w-3 h-3" />
                            Hardcopy submitted{req.hardcopySubmittedDate ? ` on ${req.hardcopySubmittedDate}` : ""}. Re-upload disabled.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-xl border border-stsn-beige shadow-sm space-y-4">
              <h4 className="text-xs font-display font-extrabold text-stone-950 uppercase tracking-widest pb-2 border-b border-stone-100 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-stone-400" />
                Portal Action Logs
              </h4>
              <div className="space-y-3 font-mono text-[9.5px]">
                {auditLogs.map((log, lIdx) => (
                  <div key={log.date + lIdx} className="p-2.5 bg-stone-50 rounded-lg border border-stone-200/50">
                    <div className="flex justify-between items-center text-stone-500 font-bold">
                      <span>{log.date}</span>
                      <span className="bg-stsn-brown/5 border border-stsn-brown/10 text-stsn-brown uppercase rounded px-1 text-[8px]">{log.category}</span>
                    </div>
                    <p className="text-stone-700 mt-1 leading-normal font-sans font-medium">{log.action}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================== TAB E: ENROLLMENT ========================== */}
      {activeTab === "enrollment" && (
        <div className="space-y-6 animate-fade-in">
          {!enrollmentOpen ? (
            /* ENROLLMENT CLOSED */
            <div className="bg-white p-16 rounded-2xl border border-stsn-beige shadow-sm flex flex-col items-center justify-center text-center space-y-5 max-w-2xl mx-auto">
              <div className="p-5 bg-stone-50 rounded-full border border-stone-200">
                <Lock className="w-12 h-12 text-stone-400" />
              </div>
              <div>
                <h3 className="font-display font-black text-stone-900 text-xl tracking-tight uppercase">Enrollment Period Closed</h3>
                <p className="text-stone-500 text-sm mt-2 max-w-sm mx-auto leading-relaxed">
                  Enrollment for the next academic year is currently closed. Please check back during the official enrollment window.
                </p>
              </div>
              <div className="p-4 bg-stsn-cream border border-stsn-beige rounded-xl text-xs text-stsn-brown font-mono">
                Next enrollment period: <strong>June 1 – June 30, 2027</strong>
              </div>
            </div>
          ) : (
            /* ENROLLMENT OPEN */
            <div className="space-y-6">
              {/* Enrollment Banner */}
              <div className="card-hero-gradient text-white p-6 rounded-2xl shadow-xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <span className="bg-green-400/20 border border-green-400/30 text-green-300 text-[10px] font-mono uppercase px-2.5 py-1 rounded-full font-bold">
                      ✓ Enrollment Is Currently OPEN
                    </span>
                    <h3 className="text-xl font-display font-bold mt-2 text-white">
                      SY 2027-2028 Enrollment Portal
                    </h3>
                    <p className="text-stone-300 text-xs mt-1">
                      Enrollment period: <strong className="text-stsn-gold-light">June 1 – June 30, 2027</strong>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-mono text-stone-400 uppercase block">Your Current Status</span>
                    <span className="text-lg font-bold text-stsn-gold">{student.enrollmentStatus}</span>
                  </div>
                </div>
              </div>

              {enrollmentStep === "landing" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {/* Pre-Enrollment Form */}
                  <div className="bg-white p-6 rounded-xl border border-stsn-beige shadow-sm smooth-hover cursor-pointer group" onClick={() => setEnrollmentStep("preform")}>
                    <div className="p-3 bg-stsn-cream border border-stsn-beige rounded-xl w-fit mb-4 group-hover:bg-stsn-brown/10 transition">
                      <FileText className="w-6 h-6 text-stsn-brown" />
                    </div>
                    <h4 className="text-sm font-bold text-stone-900">Pre-Enrollment Form</h4>
                    <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">Complete your intent to enroll for the upcoming school year.</p>
                    <div className="mt-4 flex items-center gap-1 text-xs font-bold text-stsn-brown group-hover:gap-2 transition-all">
                      Begin Form <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Re-Enrollment */}
                  <div className="bg-white p-6 rounded-xl border border-stsn-beige shadow-sm smooth-hover cursor-pointer group" onClick={() => setReEnrollConfirmed(!reEnrollConfirmed)}>
                    <div className="p-3 bg-green-50 border border-green-200 rounded-xl w-fit mb-4">
                      <RefreshCw className="w-6 h-6 text-green-600" />
                    </div>
                    <h4 className="text-sm font-bold text-stone-900">Re-Enrollment</h4>
                    <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                      Continuing students can submit their re-enrollment request here.
                    </p>
                    {reEnrollConfirmed ? (
                      <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg text-xs font-bold text-green-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Re-Enrollment submitted!
                      </div>
                    ) : (
                      <div className="mt-4 flex items-center gap-1 text-xs font-bold text-green-600 group-hover:gap-2 transition-all">
                        Submit Request <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>

                  {/* Curriculum Preview */}
                  <div className="bg-white p-6 rounded-xl border border-stsn-beige shadow-sm smooth-hover cursor-pointer group">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl w-fit mb-4">
                      <BookOpen className="w-6 h-6 text-blue-600" />
                    </div>
                    <h4 className="text-sm font-bold text-stone-900">Curriculum Preview</h4>
                    <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                      View your assigned curriculum subjects for the next semester.
                    </p>
                    <div className="mt-3 space-y-1">
                      {loadedSubjects.slice(0, 3).map((sub) => (
                        <div key={sub.id} className="text-[10px] font-mono text-stone-500 flex justify-between">
                          <span>{sub.code}</span>
                          <span>{isBasicEd ? "K-12" : `${sub.units} units`}</span>
                        </div>
                      ))}
                      {loadedSubjects.length > 3 && (
                        <p className="text-[10px] text-stone-400 italic">+{loadedSubjects.length - 3} more subjects...</p>
                      )}
                    </div>
                  </div>

                  {/* Subject Selection — College only */}
                  {!isBasicEd && (
                    <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-sm smooth-hover cursor-pointer group">
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl w-fit mb-4">
                        <PlusCircle className="w-6 h-6 text-blue-600" />
                      </div>
                      <h4 className="text-sm font-bold text-stone-900">Subject Selection</h4>
                      <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">College students can manage their subject load for the upcoming semester.</p>
                      <span className="mt-2 inline-block text-[9px] font-mono bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded uppercase font-bold">College Only</span>
                    </div>
                  )}

                  {/* Enrollment Status Tracker */}
                  <div className="bg-white p-6 rounded-xl border border-stsn-beige shadow-sm smooth-hover cursor-pointer group" onClick={() => setEnrollmentStep("status")}>
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl w-fit mb-4">
                      <Eye className="w-6 h-6 text-amber-600" />
                    </div>
                    <h4 className="text-sm font-bold text-stone-900">Enrollment Status Tracker</h4>
                    <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">Track the real-time progress of your enrollment application.</p>
                    <div className="mt-3 p-2 bg-stsn-cream border border-stsn-beige rounded-lg text-xs font-mono text-stsn-brown font-bold">
                      Current: {currentStatusString}
                    </div>
                  </div>

                  {/* Payment Assessment Preview */}
                  <div className="bg-white p-6 rounded-xl border border-green-200 shadow-sm smooth-hover cursor-pointer group" onClick={() => setEnrollmentStep("fees")}>
                    <div className="p-3 bg-green-50 border border-green-200 rounded-xl w-fit mb-4">
                      <CreditCard className="w-6 h-6 text-green-600" />
                    </div>
                    <h4 className="text-sm font-bold text-stone-900">Payment Assessment Preview</h4>
                    <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">Preview your tuition fees and payment schedule for the next enrollment.</p>
                    <div className="mt-3 flex justify-between text-xs font-mono">
                      <span className="text-stone-400">Estimated Total:</span>
                      <strong className="text-stsn-brown">₱{mockAssessment.grossTotal.toLocaleString()}</strong>
                    </div>
                    <div className="mt-3 flex items-center gap-1 text-xs font-bold text-green-600 group-hover:gap-2 transition-all">
                      View Assessment <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              )}

              {/* Pre-Enrollment Form View */}
              {enrollmentStep === "preform" && (
                <div className="bg-white p-6 rounded-xl border border-stsn-beige shadow-sm space-y-6 animate-fade-in max-w-2xl">
                  <div className="flex justify-between items-center pb-3 border-b border-stone-100">
                    <h3 className="text-sm font-display font-bold text-stone-900 uppercase tracking-wide">Pre-Enrollment Form — SY 2027-2028</h3>
                    <button onClick={() => setEnrollmentStep("landing")} className="text-xs text-stone-500 hover:text-stone-800 font-bold underline cursor-pointer">← Back</button>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-stsn-cream border border-stsn-beige rounded-xl">
                      <span className="text-[10px] font-mono font-bold text-stone-400 uppercase block mb-2">Enrolling Student</span>
                      <p className="text-sm font-bold text-stone-900">{student.lastName}, {student.firstName} {student.middleName}</p>
                      <p className="text-xs text-stone-500 mt-0.5">{student.studentNo} • {student.department} • {student.trackOrCourse}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10.5px] text-stone-500 font-bold uppercase mb-1">Enrollment Type</label>
                        <select className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs outline-none focus:ring-1 focus:ring-stsn-gold">
                          <option>Old Student (Continuing)</option>
                          <option>Transferee</option>
                          <option>Returnee</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10.5px] text-stone-500 font-bold uppercase mb-1">
                          {isBasicEd ? "Preferred Strand (Next Level)" : "Preferred Semester"}
                        </label>
                        <select className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs outline-none focus:ring-1 focus:ring-stsn-gold">
                          {isBasicEd ? (
                            <>
                              <option>Continue: {student.trackOrCourse}</option>
                              <option>STEM</option>
                              <option>HUMSS</option>
                              <option>ABM</option>
                              <option>GAS</option>
                            </>
                          ) : (
                            <>
                              <option>First Semester</option>
                              <option>Second Semester</option>
                            </>
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10.5px] text-stone-500 font-bold uppercase mb-1">Payment Plan</label>
                        <select className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs outline-none focus:ring-1 focus:ring-stsn-gold">
                          <option>Cash</option>
                          <option>Installment - 2 Payments</option>
                          <option>Installment - 4 Payments</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10.5px] text-stone-500 font-bold uppercase mb-1">Scholarship / Discount</label>
                        <select className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs outline-none focus:ring-1 focus:ring-stsn-gold">
                          <option>None</option>
                          <option>Academic Excellence Award</option>
                          <option>Sibling Discount (10%)</option>
                          <option>Faculty Dependent</option>
                          <option>Financial Assistance</option>
                        </select>
                      </div>
                    </div>

                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                      <strong className="uppercase font-mono">Required Documents for Submission:</strong>
                      <ul className="mt-2 space-y-1 font-medium">
                        <li>• PSA Birth Certificate (photocopy)</li>
                        <li>• Previous Report Card / SF9 (original)</li>
                        {isBasicEd ? <li>• Good Moral Character Certificate</li> : <li>• Transcript of Records / TOR</li>}
                        <li>• 2×2 ID Photo (white background)</li>
                      </ul>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => {
                          setEnrollmentStep("status");
                        }}
                        className="btn-primary-gradient flex-1 text-white text-xs font-bold py-2.5 rounded-lg cursor-pointer flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Submit Pre-Enrollment Intent
                      </button>
                      <button onClick={() => setEnrollmentStep("landing")} className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-lg cursor-pointer transition">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── ASSESSMENT FEES VIEW ─────────────────────────────────────── */}
              {enrollmentStep === "fees" && (
                <div className="space-y-5 animate-fade-in">
                  {/* Header bar */}
                  <div className="bg-white p-5 rounded-xl border border-stsn-beige shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <button onClick={() => setEnrollmentStep("landing")} className="text-xs text-stone-500 hover:text-stone-800 font-bold underline cursor-pointer mb-2 block">
                          ← Back to Enrollment
                        </button>
                        <h3 className="text-sm font-display font-bold text-stone-900 uppercase tracking-wide flex items-center gap-2">
                          <Receipt className="w-4 h-4 text-stsn-gold" />
                          Assessment of Fees — SY 2026-2027
                        </h3>
                        <p className="text-[10.5px] text-stone-400 font-mono mt-1">
                          {student.lastName}, {student.firstName} • {student.department} • {student.yearLevel}{student.trackOrCourse ? ` — ${student.trackOrCourse}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[9px] font-mono bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-1 rounded-full font-bold uppercase">
                          Demo Preview
                        </span>
                        <button
                          onClick={() => {
                            const printContent = `
                              <html><head><title>Assessment of Fees — ${student.lastName}, ${student.firstName}</title>
                              <style>
                                body{font-family:Arial,sans-serif;padding:24px;font-size:12px;color:#222}
                                h1{font-size:17px;margin-bottom:4px}
                                h2{font-size:13px;border-bottom:1px solid #ccc;padding-bottom:6px;margin-top:18px;color:#3a0000}
                                table{width:100%;border-collapse:collapse;margin-top:8px}
                                th,td{border:1px solid #ddd;padding:6px 10px;text-align:left}
                                th{background:#f5f5f5;font-size:10px;text-transform:uppercase}
                                .right{text-align:right}
                                .sub{font-weight:bold;background:#fdf6ee}
                                .disc{color:#c53030}
                                .net{background:#3a0000;color:white;font-weight:bold}
                                .footer{margin-top:36px;font-size:10px;color:#888;text-align:center;border-top:1px solid #eee;padding-top:10px}
                              </style></head><body>
                              <h1>St. Theresa School Network — Assessment of Fees</h1>
                              <p><strong>Student:</strong> ${student.lastName}, ${student.firstName} ${student.middleName || ""} &nbsp;&nbsp; <strong>Student No.:</strong> ${student.studentNo}</p>
                              <p><strong>Department:</strong> ${student.department} &nbsp; <strong>Year Level:</strong> ${student.yearLevel} &nbsp; <strong>Course/Strand:</strong> ${student.trackOrCourse || "—"}</p>
                              <p><strong>Academic Year:</strong> 2026-2027 &nbsp; <strong>Payment Term:</strong> ${selectedPaymentTerm}${selectedDiscount.percentage > 0 ? ` &nbsp; <strong>Discount:</strong> ${selectedDiscount.label} (${selectedDiscount.percentage}%)` : ""}</p>
                              <h2>Fee Breakdown</h2>
                              <table>
                                <tr><th>Fee Name</th><th>Category</th><th class="right">Amount (PHP)</th></tr>
                                ${mockAssessment.fees.map((f) => `<tr><td>${f.feeName}</td><td>${f.category}</td><td class="right">₱${f.amount.toLocaleString()}</td></tr>`).join("")}
                                <tr class="sub"><td colspan="2">Gross Total</td><td class="right">₱${mockAssessment.grossTotal.toLocaleString()}</td></tr>
                                ${mockAssessment.discountAmount > 0 ? `<tr class="disc"><td colspan="2">Discount — ${selectedDiscount.label} (${selectedDiscount.percentage}%)</td><td class="right">– ₱${mockAssessment.discountAmount.toLocaleString()}</td></tr>` : ""}
                                <tr class="net"><td colspan="2">NET PAYABLE</td><td class="right">₱${mockAssessment.netPayable.toLocaleString()}</td></tr>
                              </table>
                              <h2>Payment Schedule — ${selectedPaymentTerm}</h2>
                              <table>
                                <tr><th>#</th><th>Installment</th><th>Due Date</th><th class="right">Amount (PHP)</th></tr>
                                ${mockAssessment.paymentSchedule.map((s, i) => `<tr><td>${i + 1}</td><td>${s.dueLabel}</td><td>${s.dueDate}</td><td class="right">₱${s.amount.toLocaleString()}</td></tr>`).join("")}
                              </table>
                              <div class="footer">Computer-generated assessment preview. Subject to verification by the Accounting Office.<br/>Generated: ${new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}</div>
                              </body></html>`;
                            const w = window.open("", "_blank");
                            if (w) { w.document.write(printContent); w.document.close(); w.print(); }
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 bg-stsn-brown text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-stsn-brown-dark transition"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Print Assessment
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                    {/* LEFT: fee tables + discount + payment term */}
                    <div className="lg:col-span-2 space-y-5">

                      {/* A — Tuition & Laboratory Fees */}
                      <div className="bg-white rounded-xl border border-stsn-beige shadow-sm overflow-hidden">
                        <div className="px-5 py-3 bg-stsn-cream border-b border-stsn-beige flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-stsn-brown" />
                          <span className="text-xs font-display font-bold text-stsn-brown uppercase tracking-wide">A. Tuition &amp; Laboratory Fees</span>
                        </div>
                        <table className="w-full">
                          <thead className="bg-stone-50">
                            <tr>
                              <th className="text-left text-[10px] font-bold font-mono uppercase text-stone-400 px-4 py-2.5">Fee Name</th>
                              <th className="text-left text-[10px] font-bold font-mono uppercase text-stone-400 px-4 py-2.5 hidden sm:table-cell">Notes</th>
                              <th className="text-right text-[10px] font-bold font-mono uppercase text-stone-400 px-4 py-2.5">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-50">
                            {mockAssessment.fees.filter((f) => f.category === "Tuition" || f.category === "Laboratory").map((fee) => (
                              <tr key={fee.feeName} className="hover:bg-stone-50/50 transition">
                                <td className="px-4 py-2.5 text-xs font-semibold text-stone-800">{fee.feeName}</td>
                                <td className="px-4 py-2.5 text-[10.5px] text-stone-400 hidden sm:table-cell">{fee.note}</td>
                                <td className="px-4 py-2.5 text-xs font-mono font-bold text-right text-stone-900">₱{fee.amount.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-stsn-cream border-t border-stsn-beige">
                            <tr>
                              <td colSpan={2} className="px-4 py-2.5 text-xs font-bold text-stsn-brown">Sub-total (Tuition + Lab)</td>
                              <td className="px-4 py-2.5 text-xs font-mono font-bold text-right text-stsn-brown">₱{(mockAssessment.tuitionTotal + mockAssessment.labTotal).toLocaleString()}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                      {/* B — Miscellaneous Fees */}
                      <div className="bg-white rounded-xl border border-stsn-beige shadow-sm overflow-hidden">
                        <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-display font-bold text-blue-700 uppercase tracking-wide">B. Miscellaneous Fees</span>
                        </div>
                        <table className="w-full">
                          <thead className="bg-stone-50">
                            <tr>
                              <th className="text-left text-[10px] font-bold font-mono uppercase text-stone-400 px-4 py-2.5">Fee Name</th>
                              <th className="text-left text-[10px] font-bold font-mono uppercase text-stone-400 px-4 py-2.5 hidden sm:table-cell">Notes</th>
                              <th className="text-right text-[10px] font-bold font-mono uppercase text-stone-400 px-4 py-2.5">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-50">
                            {mockAssessment.fees.filter((f) => f.category === "Miscellaneous").map((fee) => (
                              <tr key={fee.feeName} className="hover:bg-stone-50/50 transition">
                                <td className="px-4 py-2.5 text-xs font-semibold text-stone-800">{fee.feeName}</td>
                                <td className="px-4 py-2.5 text-[10.5px] text-stone-400 hidden sm:table-cell">{fee.note}</td>
                                <td className="px-4 py-2.5 text-xs font-mono font-bold text-right text-stone-900">₱{fee.amount.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-blue-50 border-t border-blue-100">
                            <tr>
                              <td colSpan={2} className="px-4 py-2.5 text-xs font-bold text-blue-700">Miscellaneous Sub-total</td>
                              <td className="px-4 py-2.5 text-xs font-mono font-bold text-right text-blue-700">₱{mockAssessment.miscTotal.toLocaleString()}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                      {/* C — Discount / Scholarship */}
                      <div className="bg-white p-5 rounded-xl border border-stsn-beige shadow-sm space-y-3">
                        <div className="flex items-center gap-2 pb-2.5 border-b border-stone-100">
                          <Percent className="w-4 h-4 text-green-600" />
                          <span className="text-xs font-display font-bold text-stone-900 uppercase tracking-wide">C. Discount / Scholarship</span>
                          <span className="text-[9px] font-mono bg-amber-50 border border-amber-200 text-amber-600 px-1.5 py-0.5 rounded font-bold ml-auto">
                            TODO: auto-fetch eligibility
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {DISCOUNT_OPTIONS.map((opt) => {
                            const isSel = selectedDiscountId === opt.id;
                            return (
                              <label key={opt.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${isSel ? "bg-green-50 border-green-300 shadow-sm" : "bg-stone-50 border-stone-200 hover:border-stone-300"}`}>
                                <input type="radio" name="portal-discount" value={opt.id} checked={isSel} onChange={() => setSelectedDiscountId(opt.id)} className="accent-green-600 flex-shrink-0" />
                                <span className="text-xs font-semibold text-stone-900 flex-1 leading-tight">{opt.label}</span>
                                {opt.percentage > 0 && (
                                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${isSel ? "bg-green-100 border-green-300 text-green-700" : "bg-stone-100 border-stone-300 text-stone-500"}`}>
                                    -{opt.percentage}%
                                  </span>
                                )}
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* D — Payment Terms */}
                      <div className="bg-white p-5 rounded-xl border border-stsn-beige shadow-sm space-y-3">
                        <div className="flex items-center gap-2 pb-2.5 border-b border-stone-100">
                          <Calculator className="w-4 h-4 text-stsn-brown" />
                          <span className="text-xs font-display font-bold text-stone-900 uppercase tracking-wide">D. Payment Terms</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {PAYMENT_TERM_OPTIONS.map((term) => {
                            const isSel = selectedPaymentTerm === term;
                            return (
                              <label key={term} className={`flex flex-col gap-2 p-4 rounded-xl border cursor-pointer transition ${isSel ? "bg-stsn-cream border-stsn-gold shadow-sm" : "bg-stone-50 border-stone-200 hover:border-stone-300"}`}>
                                <div className="flex items-center gap-2">
                                  <input type="radio" name="portal-term" value={term} checked={isSel} onChange={() => setSelectedPaymentTerm(term)} className="accent-stsn-brown flex-shrink-0" />
                                  <span className={`text-xs font-bold ${isSel ? "text-stsn-brown" : "text-stone-700"}`}>{term}</span>
                                </div>
                                <p className="text-[10.5px] text-stone-500 leading-relaxed">{PAYMENT_TERM_DESCRIPTIONS[term]}</p>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* RIGHT: Summary + Schedule + Notice */}
                    <div className="space-y-5">

                      {/* E — Total Assessment Summary */}
                      <div className="bg-white rounded-xl border border-stsn-beige shadow-sm overflow-hidden">
                        <div className="px-5 py-3.5 btn-primary-gradient text-white flex items-center gap-2">
                          <Tag className="w-4 h-4" />
                          <span className="text-xs font-display font-bold uppercase tracking-wide">E. Total Assessment</span>
                        </div>
                        <div className="p-5 space-y-2.5">
                          <div className="flex justify-between text-xs py-1.5 border-b border-stone-100">
                            <span className="text-stone-500">Tuition &amp; Laboratory</span>
                            <span className="font-mono font-bold text-stone-900">₱{(mockAssessment.tuitionTotal + mockAssessment.labTotal).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-xs py-1.5 border-b border-stone-100">
                            <span className="text-stone-500">Miscellaneous Fees</span>
                            <span className="font-mono font-bold text-stone-900">₱{mockAssessment.miscTotal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-xs py-1.5 border-b border-stone-200">
                            <span className="font-bold text-stone-700">Gross Total</span>
                            <span className="font-mono font-bold text-stone-900">₱{mockAssessment.grossTotal.toLocaleString()}</span>
                          </div>
                          {mockAssessment.discountAmount > 0 && (
                            <div className="flex justify-between text-xs py-1.5 border-b border-stone-100">
                              <span className="text-green-600 font-medium">Discount ({selectedDiscount.percentage}%)</span>
                              <span className="font-mono font-bold text-green-600">– ₱{mockAssessment.discountAmount.toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center p-3.5 bg-stsn-brown rounded-xl mt-1">
                            <span className="text-xs font-bold text-stsn-gold-light uppercase tracking-wide">Net Payable</span>
                            <span className="font-mono text-lg font-black text-white">₱{mockAssessment.netPayable.toLocaleString()}</span>
                          </div>
                          <p className="text-[9.5px] text-stone-400 font-mono text-center leading-snug pt-1">
                            Term: {selectedPaymentTerm} • SY 2026-2027
                            {/* TODO: Connect real balance from accounting ledger */}
                          </p>
                        </div>
                      </div>

                      {/* F — Payment Schedule */}
                      <div className="bg-white rounded-xl border border-stsn-beige shadow-sm overflow-hidden">
                        <div className="px-5 py-3.5 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-amber-600" />
                          <span className="text-xs font-display font-bold text-amber-700 uppercase tracking-wide">F. Payment Schedule</span>
                        </div>
                        <div className="divide-y divide-stone-50">
                          {mockAssessment.paymentSchedule.map((item, idx) => (
                            <div key={idx} className="p-4 flex gap-3 hover:bg-stone-50/40 transition">
                              <div className="w-7 h-7 rounded-full bg-stsn-cream border border-stsn-beige flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-[9px] font-bold font-mono text-stsn-brown">{idx + 1}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-stone-900 leading-tight">{item.dueLabel}</p>
                                <p className="text-[10px] text-stone-400 font-mono mt-0.5">Due: {item.dueDate}</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-xs font-mono font-black text-stsn-brown">₱{item.amount.toLocaleString()}</p>
                                <span className="text-[8.5px] font-mono font-bold bg-amber-50 border border-amber-200 text-amber-600 px-1.5 py-0.5 rounded uppercase">
                                  {item.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="px-5 py-3 bg-stone-50 border-t border-stone-100">
                          {/* TODO: Replace mock status with real payment status from accounting */}
                          <p className="text-[9.5px] text-stone-400 font-mono leading-snug">
                            * Schedule is subject to change upon confirmation by the Accounting Office.
                          </p>
                        </div>
                      </div>

                      {/* Demo notice */}
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                        <div className="flex items-start gap-2">
                          <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold uppercase font-mono text-[10px]">Demo Preview Mode</p>
                            <p className="mt-1 leading-relaxed text-amber-700">
                              This assessment is generated from standard fee schedules for demo purposes. Final figures will be confirmed by the Registrar and Accounting Office.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Enrollment Status Tracker View */}
              {enrollmentStep === "status" && (
                <div className="bg-white p-6 rounded-xl border border-stsn-beige shadow-sm space-y-6 animate-fade-in">
                  <div className="flex justify-between items-center pb-3 border-b border-stone-100">
                    <h3 className="text-sm font-display font-bold text-stone-900 uppercase tracking-wide flex items-center gap-2">
                      <Eye className="w-4 h-4 text-stsn-gold" />
                      Live Enrollment Status Tracker
                    </h3>
                    <button onClick={() => setEnrollmentStep("landing")} className="text-xs text-stone-500 hover:text-stone-800 font-bold underline cursor-pointer">← Back</button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                    {statuses.map((item, idx) => {
                      const isCompleted = idx <= currentStepIdx;
                      const isActive = idx === currentStepIdx;
                      return (
                        <div key={item} className={`p-3 rounded-xl border text-center transition ${isActive ? "stepper-active shadow-md scale-105" : isCompleted ? "bg-green-50 border-green-200 text-green-700" : "bg-stone-50 border-stone-200 text-stone-400"}`}>
                          <div className="flex justify-center mb-1.5">
                            {isCompleted ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <span className="text-[10px] font-mono bg-stone-200 text-stone-500 font-bold px-1.5 py-0.5 rounded">{idx + 1}</span>}
                          </div>
                          <span className="text-[10px] font-bold block">{item}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="p-4 bg-stsn-cream border border-stsn-beige rounded-xl">
                      <span className="font-mono text-stone-400 text-[9px] uppercase block">Student Name</span>
                      <strong className="text-stone-900 text-sm">{student.lastName}, {student.firstName}</strong>
                    </div>
                    <div className="p-4 bg-stsn-cream border border-stsn-beige rounded-xl">
                      <span className="font-mono text-stone-400 text-[9px] uppercase block">Current Status</span>
                      <strong className="text-stsn-brown text-sm">{currentStatusString}</strong>
                    </div>
                    <div className="p-4 bg-stsn-cream border border-stsn-beige rounded-xl">
                      <span className="font-mono text-stone-400 text-[9px] uppercase block">School Year</span>
                      <strong className="text-stone-900 text-sm">2027-2028 (Next SY)</strong>
                    </div>
                  </div>

                  {student.enrollmentStatus === "Enrolled" && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-green-800 uppercase">Enrollment Confirmed — {student.section || "Pending Section"}</p>
                        <p className="text-[10.5px] text-green-700 mt-0.5">Your enrollment has been officially processed. Check your schedule above.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* COR MODAL */}
      <PreviewModal isOpen={isCorModalOpen} onClose={() => setIsCorModalOpen(false)} title="Student Registration Certificate (COR)">
        <CORPreview student={student} subjects={loadedSubjects} />
      </PreviewModal>
    </div>
  );
}

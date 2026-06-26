/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { CheckCircle, ChevronRight, FileText, GraduationCap, BookOpen, ClipboardList, Send } from "lucide-react";
import { useSTSNStore } from "../../../services/store";
import { useFormValidation, required } from "../../../hooks/useFormValidation";

// ---- Types ----------------------------------------------------------------

const BE_PROGRAM_CATEGORIES: Record<string, string[]> = {
  "Preschool": ["Kinder 1", "Kinder 2"],
  "Elementary": ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"],
  "Junior High School": ["Grade 7", "Grade 8", "Grade 9", "Grade 10"],
  "Senior High School": ["Grade 11", "Grade 12"],
};

const BE_STRANDS_BY_LEVEL: Record<string, string[]> = {
  "Grade 11": ["STEM", "HUMSS", "ABM", "GAS", "TVL-ICT"],
  "Grade 12": ["STEM", "HUMSS", "ABM", "GAS", "TVL-ICT"],
};

const REQUIREMENT_NAMES = [
  "PSA Birth Certificate",
  "Good Moral Certificate",
  "Transcript of Records (TOR)",
  "Form 137 / SF9",
  "ID Picture (2x2)",
] as const;

type RequirementName = (typeof REQUIREMENT_NAMES)[number];

interface RequirementChecklist {
  name: RequirementName;
  status: "Submitted" | "For Completion" | "Pending";
}

interface WizardProps {
  schoolContext: "BASIC_ED" | "COLLEGE";
  onSubmit: (data: {
    firstName: string;
    lastName: string;
    middleName: string;
    gender: "Male" | "Female";
    dept: "Basic Education" | "College";
    yearLevel: string;
    trackOrCourse: string;
    subjectCodes: string[];
    enrollmentType: "New Student" | "Old Student" | "Transferee" | "Returnee";
    lrn?: string;
  }) => void;
  onCancel: () => void;
}

// ---- Step indicator -------------------------------------------------------

const STEPS = [
  { label: "Student Info", icon: FileText },
  { label: "Academic Setup", icon: GraduationCap },
  { label: "Subject Load", icon: BookOpen },
  { label: "Requirements", icon: ClipboardList },
  { label: "Confirm & Submit", icon: Send },
];

function StepIndicator({ currentStep, isBasicEd }: { currentStep: number; isBasicEd: boolean }) {
  const activeColor = isBasicEd ? "bg-stsn-brown text-white" : "bg-blue-600 text-white";
  const doneColor = isBasicEd ? "bg-stsn-gold text-white" : "bg-blue-400 text-white";
  const activeBorder = isBasicEd ? "border-stsn-gold text-stsn-brown" : "border-blue-500 text-blue-700";

  return (
    <div className="flex items-center px-6 py-3 bg-stone-50 border-b border-stone-100 overflow-x-auto gap-0">
      {STEPS.map((step, idx) => {
        const stepNum = idx + 1;
        const isDone = stepNum < currentStep;
        const isActive = stepNum === currentStep;
        return (
          <React.Fragment key={step.label}>
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border-2 transition-all ${
                  isDone
                    ? doneColor + " border-transparent"
                    : isActive
                    ? activeColor + " border-transparent"
                    : "bg-white border-stone-200 text-stone-400"
                }`}
              >
                {isDone ? <CheckCircle className="w-3.5 h-3.5" /> : stepNum}
              </div>
              <span
                className={`text-[9px] font-bold whitespace-nowrap ${
                  isActive ? activeBorder : isDone ? "text-stone-500" : "text-stone-300"
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-1.5 min-w-[12px] ${isDone ? (isBasicEd ? "bg-stsn-gold" : "bg-blue-400") : "bg-stone-200"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ---- Main component -------------------------------------------------------

interface Step1Fields {
  lastName: string;
  firstName: string;
  lrn: string;
}

export default function EnrollmentWizard({ schoolContext, onSubmit, onCancel }: WizardProps) {
  const { subjects, courses } = useSTSNStore();
  const isBasicEd = schoolContext === "BASIC_ED";

  // Inline validation for Step 1
  const { fieldError, handleBlur: handleFieldBlur, validateAll } = useFormValidation<Step1Fields>({
    lastName: required("Last Name"),
    firstName: required("First Name"),
    lrn: (value) => {
      if (!isBasicEd || !value) return undefined;
      return value.replace(/\D/g, "").length !== 12 ? "LRN must be exactly 12 digits." : undefined;
    },
  });

  // Step state
  const [step, setStep] = useState(1);

  // Step 1: Student Info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [gender, setGender] = useState<"Male" | "Female">("Male");
  const [lrn, setLrn] = useState("");
  const [enrollmentType, setEnrollmentType] = useState<"New Student" | "Old Student" | "Transferee" | "Returnee">("New Student");

  // Step 2: Academic Setup
  const [beProgramCategory, setBeProgramCategory] = useState("Senior High School");
  const [yearLevel, setYearLevel] = useState("Grade 11");
  const [courseCode, setCourseCode] = useState("STEM");
  const [collegeCourse, setCollegeCourse] = useState("BSIT");
  const [collegeYear, setCollegeYear] = useState("1st Year");

  const handleBeCategoryChange = (cat: string) => {
    setBeProgramCategory(cat);
    const levels = BE_PROGRAM_CATEGORIES[cat] || [];
    const firstLevel = levels[0] || "";
    setYearLevel(firstLevel);
    const strands = BE_STRANDS_BY_LEVEL[firstLevel] || [];
    setCourseCode(strands[0] || "N/A");
    setSelectedSubjectCodes([]);
  };

  const handleBeYearChange = (lvl: string) => {
    setYearLevel(lvl);
    const strands = BE_STRANDS_BY_LEVEL[lvl] || [];
    setCourseCode(strands[0] || "N/A");
    setSelectedSubjectCodes([]);
  };

  // Step 3: Subject Load
  const [selectedSubjectCodes, setSelectedSubjectCodes] = useState<string[]>([]);

  const finalYearLevel = isBasicEd ? yearLevel : collegeYear;
  const finalTrackOrCourse = isBasicEd ? courseCode : collegeCourse;

  const availableSubjects = useMemo(() => {
    return subjects.filter((s) => {
      if (isBasicEd) return s.department === "Basic Education" && s.yearLevel === yearLevel;
      return s.department === "College" && s.yearLevel === collegeYear && s.trackOrCourse === collegeCourse;
    });
  }, [subjects, isBasicEd, yearLevel, collegeYear, collegeCourse]);

  const totalUnits = useMemo(
    () => availableSubjects.filter((s) => selectedSubjectCodes.includes(s.code)).reduce((sum, s) => sum + (s.units || 0), 0),
    [availableSubjects, selectedSubjectCodes],
  );

  const toggleSubject = (code: string) => {
    setSelectedSubjectCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  };

  // Step 4: Requirements
  const [requirements, setRequirements] = useState<RequirementChecklist[]>(
    REQUIREMENT_NAMES.map((name) => ({ name, status: "Pending" as const })),
  );

  const toggleRequirement = (name: RequirementName) => {
    setRequirements((prev) =>
      prev.map((r) =>
        r.name === name
          ? { ...r, status: r.status === "Submitted" ? "Pending" : "Submitted" }
          : r,
      ),
    );
  };

  // ---- Navigation -----------------------------------------------------------

  const canGoNext = () => {
    if (step === 1) return firstName.trim() !== "" && lastName.trim() !== "";
    if (step === 3) return selectedSubjectCodes.length > 0;
    return true;
  };

  const next = () => setStep((s) => Math.min(s + 1, 5));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = () => {
    onSubmit({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      middleName: middleName.trim(),
      gender,
      dept: isBasicEd ? "Basic Education" : "College",
      yearLevel: finalYearLevel,
      trackOrCourse: finalTrackOrCourse,
      subjectCodes: selectedSubjectCodes,
      enrollmentType,
      lrn: lrn.trim() || undefined,
    });
  };

  const accentBtn = isBasicEd
    ? "bg-stsn-brown hover:bg-stsn-brown-dark text-stsn-cream"
    : "bg-blue-600 hover:bg-blue-700 text-white";

  // ---- Render ---------------------------------------------------------------

  return (
    <>
      <StepIndicator currentStep={step} isBasicEd={isBasicEd} />

      <div className="p-6 bg-stsn-cream flex-1 overflow-y-auto space-y-4">

        {/* STEP 1: Student Info */}
        {step === 1 && (
          <div className="space-y-4 bg-white p-5 rounded-xl border border-stsn-beige animate-fade-in">
            <h4 className="text-xs font-bold text-stsn-brown uppercase flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" /> Student Information
            </h4>

            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Enrollment Type *</label>
              <div className="grid grid-cols-2 gap-2">
                {(["New Student", "Old Student", "Transferee", "Returnee"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setEnrollmentType(t)}
                    className={`text-[11px] font-bold py-2 px-3 rounded-lg border transition cursor-pointer ${
                      enrollmentType === t
                        ? isBasicEd ? "bg-stsn-brown text-white border-stsn-brown" : "bg-blue-600 text-white border-blue-600"
                        : "bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Last Name *</label>
                <input
                  type="text" value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  onBlur={(e) => handleFieldBlur("lastName", e.target.value, { lastName: e.target.value, firstName, lrn })}
                  placeholder="Dela Cruz"
                  className={`w-full bg-stone-50 border rounded-lg py-2 px-2.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-stsn-gold ${fieldError("lastName") ? "border-red-400 focus:ring-red-300" : "border-stone-200"}`}
                />
                {fieldError("lastName") && <p className="text-[10px] text-red-500 mt-1">{fieldError("lastName")}</p>}
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">First Name *</label>
                <input
                  type="text" value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  onBlur={(e) => handleFieldBlur("firstName", e.target.value, { lastName, firstName: e.target.value, lrn })}
                  placeholder="Maria"
                  className={`w-full bg-stone-50 border rounded-lg py-2 px-2.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-stsn-gold ${fieldError("firstName") ? "border-red-400 focus:ring-red-300" : "border-stone-200"}`}
                />
                {fieldError("firstName") && <p className="text-[10px] text-red-500 mt-1">{fieldError("firstName")}</p>}
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Middle Name</label>
                <input
                  type="text" value={middleName} onChange={(e) => setMiddleName(e.target.value)}
                  placeholder="Santos"
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 px-2.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-stsn-gold"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Gender *</label>
                <select
                  value={gender} onChange={(e) => setGender(e.target.value as "Male" | "Female")}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 px-2.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-stsn-gold"
                >
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>
              {isBasicEd && (
                <div className="col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">LRN (Learner Reference No.)</label>
                  <input
                    type="text" value={lrn}
                    onChange={(e) => setLrn(e.target.value)}
                    onBlur={(e) => handleFieldBlur("lrn", e.target.value, { lastName, firstName, lrn: e.target.value })}
                    placeholder="12-digit LRN"
                    maxLength={12}
                    className={`w-full bg-stone-50 border rounded-lg py-2 px-2.5 text-xs font-mono outline-none focus:ring-1 focus:ring-stsn-gold ${
                      fieldError("lrn") ? "border-red-400 focus:ring-red-300" : "border-stone-200"
                    }`}
                  />
                  {fieldError("lrn") && <p className="text-[10px] text-red-500 mt-1">{fieldError("lrn")}</p>}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  const valid = validateAll({ lastName, firstName, lrn });
                  if (valid && canGoNext()) next();
                }}
                disabled={!canGoNext()}
                className={`flex items-center gap-1.5 text-xs font-bold px-5 py-2 rounded-lg cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed ${accentBtn}`}
              >
                Next: Academic Setup <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Academic Setup */}
        {step === 2 && (
          <div className="space-y-4 bg-white p-5 rounded-xl border border-stsn-beige animate-fade-in">
            <h4 className="text-xs font-bold text-stsn-brown uppercase flex items-center gap-2">
              <GraduationCap className="w-3.5 h-3.5" /> Academic Program Setup
            </h4>

            {isBasicEd ? (
              <>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Program Category</label>
                  <select
                    value={beProgramCategory} onChange={(e) => handleBeCategoryChange(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 px-2.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-stsn-gold"
                  >
                    {Object.keys(BE_PROGRAM_CATEGORIES).map((cat) => <option key={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Year Level / Grade</label>
                  <select
                    value={yearLevel} onChange={(e) => handleBeYearChange(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 px-2.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-stsn-gold"
                  >
                    {(BE_PROGRAM_CATEGORIES[beProgramCategory] || []).map((lvl) => <option key={lvl}>{lvl}</option>)}
                  </select>
                </div>
                {(BE_STRANDS_BY_LEVEL[yearLevel] || []).length > 0 && (
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Strand / Track</label>
                    <select
                      value={courseCode} onChange={(e) => setCourseCode(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 px-2.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-stsn-gold"
                    >
                      {(BE_STRANDS_BY_LEVEL[yearLevel] || []).map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                )}
              </>
            ) : (
              <>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">College Program</label>
                  <select
                    value={collegeCourse} onChange={(e) => { setCollegeCourse(e.target.value); setSelectedSubjectCodes([]); }}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 px-2.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {courses.filter((c) => c.department === "College").map((c) => (
                      <option key={c.id} value={c.code}>{c.code} — {c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Year Level</label>
                  <select
                    value={collegeYear} onChange={(e) => { setCollegeYear(e.target.value); setSelectedSubjectCodes([]); }}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 px-2.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {["1st Year", "2nd Year", "3rd Year", "4th Year"].map((y) => <option key={y}>{y}</option>)}
                  </select>
                </div>
              </>
            )}

            <div className="flex justify-between pt-2">
              <button onClick={back} className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold px-4 py-2 rounded-lg cursor-pointer">
                Back
              </button>
              <button
                onClick={next}
                className={`flex items-center gap-1.5 text-xs font-bold px-5 py-2 rounded-lg cursor-pointer transition ${accentBtn}`}
              >
                Next: Subject Load <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Subject Load */}
        {step === 3 && (
          <div className="space-y-4 bg-white p-5 rounded-xl border border-stsn-beige animate-fade-in">
            <h4 className="text-xs font-bold text-stsn-brown uppercase flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5" /> Subject Load
            </h4>

            <div className="border border-stone-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className={`text-[10px] font-bold uppercase text-white ${isBasicEd ? "bg-stsn-brown" : "bg-blue-600"}`}>
                    <th className="p-2.5">Code</th>
                    <th className="p-2.5">Subject</th>
                    <th className="p-2.5 text-center">{isBasicEd ? "Type" : "Units"}</th>
                    <th className="p-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {availableSubjects.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-stone-400 italic text-xs">
                        No subjects found for {finalYearLevel} / {finalTrackOrCourse}.
                      </td>
                    </tr>
                  ) : (
                    availableSubjects.map((sub) => {
                      const isSel = selectedSubjectCodes.includes(sub.code);
                      return (
                        <tr key={sub.id} className={`hover:bg-stone-50 ${isSel ? "bg-stsn-cream/30" : ""}`}>
                          <td className={`p-2.5 font-mono font-bold text-[11px] ${isBasicEd ? "text-stsn-brown" : "text-blue-700"}`}>{sub.code}</td>
                          <td className="p-2.5 text-stone-700 font-medium">{sub.name}</td>
                          <td className="p-2.5 text-center font-bold font-mono">{isBasicEd ? "K-12" : (sub.units || "—")}</td>
                          <td className="p-2.5 text-center">
                            <button
                              onClick={() => toggleSubject(sub.code)}
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

            <div className={`p-3 rounded-lg border text-xs font-mono flex justify-between items-center ${isBasicEd ? "bg-stsn-cream border-stsn-beige text-stsn-brown" : "bg-blue-50 border-blue-100 text-blue-800"}`}>
              <span>Total Subjects: <strong>{selectedSubjectCodes.length}</strong></span>
              {!isBasicEd && <span>Total Units: <strong>{totalUnits}</strong></span>}
            </div>

            <div className="flex justify-between pt-2">
              <button onClick={back} className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold px-4 py-2 rounded-lg cursor-pointer">
                Back
              </button>
              <button
                onClick={next} disabled={selectedSubjectCodes.length === 0}
                className={`flex items-center gap-1.5 text-xs font-bold px-5 py-2 rounded-lg cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed ${accentBtn}`}
              >
                Next: Requirements <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Requirements Checklist */}
        {step === 4 && (
          <div className="space-y-4 bg-white p-5 rounded-xl border border-stsn-beige animate-fade-in">
            <div>
              <h4 className="text-xs font-bold text-stsn-brown uppercase flex items-center gap-2">
                <ClipboardList className="w-3.5 h-3.5" /> Requirements Checklist
              </h4>
              <p className="text-[11px] text-stone-500 mt-1">
                Check off submitted documents. Unchecked items will be marked "For Completion".
              </p>
            </div>

            <div className="space-y-2">
              {requirements.map((req) => (
                <label
                  key={req.name}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    req.status === "Submitted"
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-stone-50 border-stone-200 hover:bg-stone-100"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={req.status === "Submitted"}
                    onChange={() => toggleRequirement(req.name)}
                    className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
                  />
                  <div className="flex-1">
                    <p className={`text-xs font-semibold ${req.status === "Submitted" ? "text-emerald-800" : "text-stone-700"}`}>
                      {req.name}
                    </p>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    req.status === "Submitted"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    {req.status === "Submitted" ? "Submitted" : "For Completion"}
                  </span>
                </label>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-[11px] text-blue-700">
              Requirements marked "For Completion" can be submitted later. The enrollment will proceed with incomplete documents.
            </div>

            <div className="flex justify-between pt-2">
              <button onClick={back} className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold px-4 py-2 rounded-lg cursor-pointer">
                Back
              </button>
              <button
                onClick={next}
                className={`flex items-center gap-1.5 text-xs font-bold px-5 py-2 rounded-lg cursor-pointer transition ${accentBtn}`}
              >
                Next: Review & Confirm <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Confirmation & Submit */}
        {step === 5 && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-white p-5 rounded-xl border border-stsn-beige">
              <h4 className="text-xs font-bold text-stsn-brown uppercase flex items-center gap-2 mb-4">
                <Send className="w-3.5 h-3.5" /> Review & Confirm Enrollment
              </h4>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="col-span-2 bg-stsn-cream rounded-lg p-3 border border-stsn-beige">
                  <p className="text-[9px] uppercase font-mono font-bold text-stone-400 mb-1">Student</p>
                  <p className="font-bold text-stone-900 text-sm">{lastName}, {firstName} {middleName}</p>
                  <p className="text-stone-500 text-[11px]">Gender: {gender} · Type: {enrollmentType}</p>
                  {lrn && <p className="font-mono text-[11px] text-stone-400 mt-0.5">LRN: {lrn}</p>}
                </div>

                <div className="bg-stone-50 rounded-lg p-3 border border-stone-200">
                  <p className="text-[9px] uppercase font-mono font-bold text-stone-400 mb-1">Academic Info</p>
                  <p className="font-semibold text-stone-700">{finalYearLevel}</p>
                  <p className="text-stone-500 text-[11px]">{finalTrackOrCourse}</p>
                  <p className="text-stone-400 text-[10px]">{isBasicEd ? "Basic Education" : "College"}</p>
                </div>

                <div className="bg-stone-50 rounded-lg p-3 border border-stone-200">
                  <p className="text-[9px] uppercase font-mono font-bold text-stone-400 mb-1">Subject Load</p>
                  <p className="font-semibold text-stone-700">{selectedSubjectCodes.length} subjects</p>
                  {!isBasicEd && <p className="text-stone-500 text-[11px]">{totalUnits} units</p>}
                  <p className="text-stone-400 text-[10px] line-clamp-2 mt-0.5">
                    {selectedSubjectCodes.join(", ")}
                  </p>
                </div>

                <div className="col-span-2 bg-stone-50 rounded-lg p-3 border border-stone-200">
                  <p className="text-[9px] uppercase font-mono font-bold text-stone-400 mb-1">Requirements</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {requirements.map((r) => (
                      <span
                        key={r.name}
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          r.status === "Submitted"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {r.name.split(" ")[0]}: {r.status === "Submitted" ? "✓" : "Pending"}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-[11px] text-amber-800">
              <p className="font-bold mb-1">Upon submission:</p>
              <ul className="list-disc list-inside space-y-0.5 text-amber-700">
                <li>Student record will be created with status <strong>Pending</strong></li>
                <li>Enrollment will move to <strong>For Assessment</strong> queue</li>
                <li>Registrar must generate assessment before Accounting can approve</li>
              </ul>
            </div>

            <div className="flex justify-between pt-2">
              <button onClick={back} className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold px-4 py-2 rounded-lg cursor-pointer">
                Back
              </button>
              <button
                onClick={handleSubmit}
                className={`flex items-center gap-2 text-xs font-bold px-5 py-2 rounded-lg cursor-pointer transition ${accentBtn}`}
              >
                <CheckCircle className="w-4 h-4" /> Submit Enrollment
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

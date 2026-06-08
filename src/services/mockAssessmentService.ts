/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * MOCK ASSESSMENT SERVICE
 * =======================
 * Provides demo-ready fee structures, discount options, and payment schedule
 * generation for the STSN/CSTA Student Assessment Fees tab.
 *
 * TODO: Replace mock assessment API with real backend endpoint (e.g., GET /api/assessment/:studentId)
 * TODO: Connect real payment schedules from accounting system
 * TODO: Integrate accounting ledger for live balance tracking
 * TODO: Fetch discount eligibility from scholarship registry service
 */

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface MockFeeLineItem {
  feeName: string;
  category: "Tuition" | "Laboratory" | "Miscellaneous" | "Other";
  amount: number;
  isRequired: boolean;
  note?: string;
}

export interface DiscountOption {
  id: string;
  label: string;
  percentage: number;
  badge?: string;
}

export interface PaymentScheduleItem {
  dueLabel: string;
  dueDate: string;
  amount: number;
  /** Status is mock only for demo. TODO: Replace with real payment status from accounting */
  status: "Paid" | "Pending" | "Overdue";
}

export type MockPaymentTerm = "Cash Basis" | "Quarterly" | "Semestral";

export interface MockAssessmentResult {
  fees: MockFeeLineItem[];
  tuitionTotal: number;
  labTotal: number;
  miscTotal: number;
  grossTotal: number;
  discountAmount: number;
  netPayable: number;
  paymentSchedule: PaymentScheduleItem[];
}

// ─────────────────────────────────────────────────────────────────────────────
// MISC FEES — same for all students (Philippine standard)
// TODO: Replace with GET /api/fees/miscellaneous?academicYear=...
// ─────────────────────────────────────────────────────────────────────────────

export const MISC_FEE_SCHEDULE: MockFeeLineItem[] = [
  { feeName: "Library Fee", category: "Miscellaneous", amount: 800, isRequired: true, note: "Annual library access & digital resources" },
  { feeName: "ID & Validation Fee", category: "Miscellaneous", amount: 300, isRequired: true, note: "School ID card production" },
  { feeName: "Medical / Clinic Fee", category: "Miscellaneous", amount: 500, isRequired: true, note: "School nurse & clinic fund" },
  { feeName: "Athletic Fund", category: "Miscellaneous", amount: 700, isRequired: true, note: "Sports & intramurals participation" },
  { feeName: "Registration Fee", category: "Miscellaneous", amount: 1000, isRequired: true, note: "SY enrollment processing" },
];

// ─────────────────────────────────────────────────────────────────────────────
// TUITION FEE MATRIX — per department / year level / strand
// TODO: Replace with GET /api/fees/tuition?dept=...&yearLevel=...&course=...
// ─────────────────────────────────────────────────────────────────────────────

interface TuitionMatrix {
  tuition: number;
  lab: number;
  computer: number;
  label: string;
}

const TUITION_MATRIX: Record<string, TuitionMatrix> = {
  // Preschool
  "Nursery":    { tuition: 10500, lab: 800,  computer: 600,  label: "Preschool — Nursery" },
  "Kinder 1":   { tuition: 11000, lab: 900,  computer: 700,  label: "Preschool — Kinder 1" },
  "Kinder 2":   { tuition: 11500, lab: 900,  computer: 700,  label: "Preschool — Kinder 2" },
  // Primary
  "Grade 1":    { tuition: 14000, lab: 1200, computer: 900,  label: "Primary — Grade 1" },
  "Grade 2":    { tuition: 14000, lab: 1200, computer: 900,  label: "Primary — Grade 2" },
  "Grade 3":    { tuition: 14500, lab: 1200, computer: 1000, label: "Primary — Grade 3" },
  // Intermediate
  "Grade 4":    { tuition: 15000, lab: 1500, computer: 1200, label: "Intermediate — Grade 4" },
  "Grade 5":    { tuition: 15000, lab: 1500, computer: 1200, label: "Intermediate — Grade 5" },
  "Grade 6":    { tuition: 15500, lab: 1500, computer: 1200, label: "Intermediate — Grade 6" },
  // Junior High School
  "Grade 7":    { tuition: 17000, lab: 2000, computer: 1500, label: "Junior High — Grade 7" },
  "Grade 8":    { tuition: 17000, lab: 2000, computer: 1500, label: "Junior High — Grade 8" },
  "Grade 9":    { tuition: 17500, lab: 2000, computer: 1500, label: "Junior High — Grade 9" },
  "Grade 10":   { tuition: 17500, lab: 2000, computer: 1500, label: "Junior High — Grade 10" },
  // Senior High School
  "Grade 11":   { tuition: 18500, lab: 2500, computer: 1500, label: "Senior High — Grade 11" },
  "Grade 12":   { tuition: 18500, lab: 2500, computer: 1500, label: "Senior High — Grade 12" },
  // College
  "1st Year":   { tuition: 24000, lab: 3500, computer: 2000, label: "College — 1st Year" },
  "2nd Year":   { tuition: 25000, lab: 3500, computer: 2000, label: "College — 2nd Year" },
  "3rd Year":   { tuition: 25500, lab: 3500, computer: 2000, label: "College — 3rd Year" },
  "4th Year":   { tuition: 26000, lab: 3000, computer: 2000, label: "College — 4th Year" },
};

// Strand-based lab adjustments for SHS
const SHS_LAB_ADJUSTMENT: Record<string, number> = {
  "STEM":  3500,  // Science labs intensive
  "HUMSS": 2000,
  "ABM":   2000,
  "GAS":   2000,
};

// College program adjustments
const COLLEGE_LAB_ADJUSTMENT: Record<string, number> = {
  "BSIT": 3500,
  "BSCS": 3500,
  "BSECE": 4000,
  "BSBA": 2000,
  "BSED": 2000,
  "BSTM": 2500,
  "BSN":  4500,
};

// ─────────────────────────────────────────────────────────────────────────────
// DISCOUNT OPTIONS
// TODO: Replace with GET /api/scholarships/eligible?studentId=...
// ─────────────────────────────────────────────────────────────────────────────

export const DISCOUNT_OPTIONS: DiscountOption[] = [
  { id: "none",      label: "None",                              percentage: 0,   badge: "" },
  { id: "academic",  label: "Academic Scholarship",              percentage: 25,  badge: "25%" },
  { id: "sibling",   label: "Sibling Discount",                  percentage: 10,  badge: "10%" },
  { id: "govt",      label: "Government Subsidy (DepEd/CHED)",   percentage: 15,  badge: "15%" },
  { id: "faculty",   label: "Faculty Dependent",                 percentage: 20,  badge: "20%" },
  { id: "partial",   label: "Financial Assistance Grant",        percentage: 30,  badge: "30%" },
  { id: "president", label: "Presidential Scholarship (Full)",   percentage: 100, badge: "100%" },
];

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT TERM OPTIONS
// ─────────────────────────────────────────────────────────────────────────────

export const PAYMENT_TERM_OPTIONS: MockPaymentTerm[] = [
  "Cash Basis",
  "Quarterly",
  "Semestral",
];

export const PAYMENT_TERM_DESCRIPTIONS: Record<MockPaymentTerm, string> = {
  "Cash Basis": "One-time full payment upon enrollment. No installment fee.",
  "Quarterly":  "Downpayment + 3 quarterly installments every 3 months.",
  "Semestral":  "Downpayment + midterm + final payment every ~5 months.",
};

// ─────────────────────────────────────────────────────────────────────────────
// CORE SERVICE FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Derives the fee line items for a student based on their department/level/course.
 * TODO: Replace with API call: GET /api/assessment/fees?studentId=...&academicYear=...
 */
export function getMockFeeBreakdown(
  department: string,
  yearLevel: string,
  trackOrCourse?: string
): MockFeeLineItem[] {
  const matrix = TUITION_MATRIX[yearLevel] ?? TUITION_MATRIX["Grade 11"];

  // Determine lab amount based on strand/program
  let labAmount = matrix.lab;
  if (department === "College" && trackOrCourse && COLLEGE_LAB_ADJUSTMENT[trackOrCourse]) {
    labAmount = COLLEGE_LAB_ADJUSTMENT[trackOrCourse];
  } else if ((yearLevel === "Grade 11" || yearLevel === "Grade 12") && trackOrCourse && SHS_LAB_ADJUSTMENT[trackOrCourse]) {
    labAmount = SHS_LAB_ADJUSTMENT[trackOrCourse];
  }

  const levelLabel = matrix.label;

  const tuitionFees: MockFeeLineItem[] = [
    {
      feeName: "Tuition Fee",
      category: "Tuition",
      amount: matrix.tuition,
      isRequired: true,
      note: levelLabel,
    },
    {
      feeName: "Laboratory Fee",
      category: "Laboratory",
      amount: labAmount,
      isRequired: true,
      note: trackOrCourse ? `${trackOrCourse} Lab Program` : "General Laboratory",
    },
    {
      feeName: "Computer Fee",
      category: "Laboratory",
      amount: matrix.computer,
      isRequired: true,
      note: "ICT / Computer Laboratory access",
    },
  ];

  return [...tuitionFees, ...MISC_FEE_SCHEDULE];
}

/**
 * Generates a payment schedule based on net amount and selected term.
 * TODO: Replace with POST /api/assessment/payment-schedule
 */
export function generatePaymentSchedule(
  netTotal: number,
  term: MockPaymentTerm,
  academicYear: string = "2026-2027"
): PaymentScheduleItem[] {
  const [startYearStr] = academicYear.split("-");
  const startYear = parseInt(startYearStr, 10) || 2026;

  if (term === "Cash Basis") {
    return [
      {
        dueLabel: "Full Payment — Upon Enrollment",
        dueDate: `June 15, ${startYear}`,
        amount: netTotal,
        status: "Pending",
      },
    ];
  }

  if (term === "Quarterly") {
    const dp = Math.round(netTotal * 0.30);           // 30% downpayment
    const remaining = netTotal - dp;
    const q1 = Math.round(remaining / 3);
    const q2 = Math.round(remaining / 3);
    const q3 = remaining - q1 - q2;                  // absorb rounding remainder
    return [
      { dueLabel: "Downpayment — Upon Enrollment", dueDate: `June 15, ${startYear}`,      amount: dp, status: "Pending" },
      { dueLabel: "1st Quarter Payment",            dueDate: `September 15, ${startYear}`, amount: q1, status: "Pending" },
      { dueLabel: "2nd Quarter Payment",            dueDate: `December 15, ${startYear}`,  amount: q2, status: "Pending" },
      { dueLabel: "3rd Quarter Payment",            dueDate: `March 15, ${startYear + 1}`, amount: q3, status: "Pending" },
    ];
  }

  if (term === "Semestral") {
    const dp = Math.round(netTotal * 0.30);
    const remaining = netTotal - dp;
    const mid = Math.round(remaining * 0.50);
    const fin = remaining - mid;
    return [
      { dueLabel: "Downpayment — Upon Enrollment", dueDate: `June 15, ${startYear}`,       amount: dp,  status: "Pending" },
      { dueLabel: "Midterm Payment",               dueDate: `October 15, ${startYear}`,    amount: mid, status: "Pending" },
      { dueLabel: "Final Payment",                 dueDate: `February 15, ${startYear + 1}`, amount: fin, status: "Pending" },
    ];
  }

  return [];
}

/**
 * Master computation: given a student profile + UI selections, returns a full assessment result.
 * TODO: Replace with GET /api/assessment/compute?studentId=...&discountId=...&term=...
 */
export function computeMockAssessment(
  department: string,
  yearLevel: string,
  trackOrCourse: string | undefined,
  discountPercentage: number,
  paymentTerm: MockPaymentTerm,
  academicYear: string = "2026-2027"
): MockAssessmentResult {
  const fees = getMockFeeBreakdown(department, yearLevel, trackOrCourse);

  const tuitionTotal = fees.filter((f) => f.category === "Tuition").reduce((s, f) => s + f.amount, 0);
  const labTotal     = fees.filter((f) => f.category === "Laboratory").reduce((s, f) => s + f.amount, 0);
  const miscTotal    = fees.filter((f) => f.category === "Miscellaneous").reduce((s, f) => s + f.amount, 0);
  const grossTotal   = fees.reduce((s, f) => s + f.amount, 0);

  const discountAmount = Math.round(grossTotal * (discountPercentage / 100));
  const netPayable     = Math.max(0, grossTotal - discountAmount);

  const paymentSchedule = generatePaymentSchedule(netPayable, paymentTerm, academicYear);

  return {
    fees,
    tuitionTotal,
    labTotal,
    miscTotal,
    grossTotal,
    discountAmount,
    netPayable,
    paymentSchedule,
  };
}

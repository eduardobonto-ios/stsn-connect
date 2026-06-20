/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ASSESSMENT FEE-CALCULATION ENGINE
 * ==================================
 * Pure computation functions for the Student Assessment Fees tab. All fee
 * data (tuition matrix, misc fees, lab adjustments) now lives in Supabase —
 * callers pass in the relevant store slices (useSTSNStore().tuitionFeeSchedule,
 * .miscFeeSchedule, .labFeeAdjustments) rather than this module importing
 * hardcoded constants.
 */

export interface MockFeeLineItem {
  feeName: string;
  category: "Tuition" | "Laboratory" | "Miscellaneous" | "Other" | "Books";
  amount: number;
  isRequired: boolean;
  note?: string;
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

export interface TuitionFeeScheduleRow {
  yearLevel: string;
  tuition: number;
  lab: number;
  computer: number;
  label: string;
}

export interface LabFeeAdjustmentRow {
  scope: "SHS" | "College";
  programCode: string;
  amount: number;
}

/**
 * Derives the fee line items for a student based on their department/level/course.
 * `tuitionFeeSchedule`, `miscFeeSchedule`, and `labFeeAdjustments` come from
 * the Supabase-backed store (tuition_fee_schedule / misc_fee_schedule /
 * lab_fee_adjustments tables).
 */
export function getMockFeeBreakdown(
  department: string,
  yearLevel: string,
  trackOrCourse: string | undefined,
  tuitionFeeSchedule: TuitionFeeScheduleRow[],
  miscFeeSchedule: MockFeeLineItem[],
  labFeeAdjustments: LabFeeAdjustmentRow[]
): MockFeeLineItem[] {
  const matrix = tuitionFeeSchedule.find((t) => t.yearLevel === yearLevel) ?? tuitionFeeSchedule.find((t) => t.yearLevel === "Grade 11");
  if (!matrix) return miscFeeSchedule;

  let labAmount = matrix.lab;
  if (department === "College" && trackOrCourse) {
    const adj = labFeeAdjustments.find((l) => l.scope === "College" && l.programCode === trackOrCourse);
    if (adj) labAmount = adj.amount;
  } else if ((yearLevel === "Grade 11" || yearLevel === "Grade 12") && trackOrCourse) {
    const adj = labFeeAdjustments.find((l) => l.scope === "SHS" && l.programCode === trackOrCourse);
    if (adj) labAmount = adj.amount;
  }

  const tuitionFees: MockFeeLineItem[] = [
    { feeName: "Tuition Fee", category: "Tuition", amount: matrix.tuition, isRequired: true, note: matrix.label },
    { feeName: "Laboratory Fee", category: "Laboratory", amount: labAmount, isRequired: true, note: trackOrCourse ? `${trackOrCourse} Lab Program` : "General Laboratory" },
    { feeName: "Computer Fee", category: "Laboratory", amount: matrix.computer, isRequired: true, note: "ICT / Computer Laboratory access" },
  ];

  return [...tuitionFees, ...miscFeeSchedule];
}

/**
 * Generates a payment schedule based on net amount and selected term.
 * Pure date/percentage arithmetic — no business data, nothing to migrate.
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
      { dueLabel: "Full Payment — Upon Enrollment", dueDate: `June 15, ${startYear}`, amount: netTotal, status: "Pending" },
    ];
  }

  if (term === "Quarterly") {
    const dp = Math.round(netTotal * 0.30);
    const remaining = netTotal - dp;
    const q1 = Math.round(remaining / 3);
    const q2 = Math.round(remaining / 3);
    const q3 = remaining - q1 - q2;
    return [
      { dueLabel: "Downpayment — Upon Enrollment", dueDate: `June 15, ${startYear}`, amount: dp, status: "Pending" },
      { dueLabel: "1st Quarter Payment", dueDate: `September 15, ${startYear}`, amount: q1, status: "Pending" },
      { dueLabel: "2nd Quarter Payment", dueDate: `December 15, ${startYear}`, amount: q2, status: "Pending" },
      { dueLabel: "3rd Quarter Payment", dueDate: `March 15, ${startYear + 1}`, amount: q3, status: "Pending" },
    ];
  }

  if (term === "Semestral") {
    const dp = Math.round(netTotal * 0.30);
    const remaining = netTotal - dp;
    const mid = Math.round(remaining * 0.50);
    const fin = remaining - mid;
    return [
      { dueLabel: "Downpayment — Upon Enrollment", dueDate: `June 15, ${startYear}`, amount: dp, status: "Pending" },
      { dueLabel: "Midterm Payment", dueDate: `October 15, ${startYear}`, amount: mid, status: "Pending" },
      { dueLabel: "Final Payment", dueDate: `February 15, ${startYear + 1}`, amount: fin, status: "Pending" },
    ];
  }

  return [];
}

/**
 * Master computation: given a student profile + UI selections, returns a full assessment result.
 */
export function computeMockAssessment(
  department: string,
  yearLevel: string,
  trackOrCourse: string | undefined,
  discountPercentage: number,
  paymentTerm: MockPaymentTerm,
  tuitionFeeSchedule: TuitionFeeScheduleRow[],
  miscFeeSchedule: MockFeeLineItem[],
  labFeeAdjustments: LabFeeAdjustmentRow[],
  academicYear: string = "2026-2027"
): MockAssessmentResult {
  const fees = getMockFeeBreakdown(department, yearLevel, trackOrCourse, tuitionFeeSchedule, miscFeeSchedule, labFeeAdjustments);

  const tuitionTotal = fees.filter((f) => f.category === "Tuition").reduce((s, f) => s + f.amount, 0);
  const labTotal = fees.filter((f) => f.category === "Laboratory").reduce((s, f) => s + f.amount, 0);
  const miscTotal = fees.filter((f) => f.category === "Miscellaneous").reduce((s, f) => s + f.amount, 0);
  const grossTotal = fees.reduce((s, f) => s + f.amount, 0);

  const discountAmount = Math.round(grossTotal * (discountPercentage / 100));
  const netPayable = Math.max(0, grossTotal - discountAmount);

  const paymentSchedule = generatePaymentSchedule(netPayable, paymentTerm, academicYear);

  return { fees, tuitionTotal, labTotal, miscTotal, grossTotal, discountAmount, netPayable, paymentSchedule };
}

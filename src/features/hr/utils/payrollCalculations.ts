/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Payroll computation utility — extracted from store.ts per the HR guide.
 * Uses semi-monthly payroll frequency (salary / 2 per cut-off).
 */

import type { BenefitPlan, Employee, PayrollLine, StatutoryContributionRule, TaxTable } from "../../../types";

export interface AttendanceSummary {
  lateMinutes: number;
  undertimeMinutes: number;
  absentDays: number;
  overtimeMinutes: number;
}

export interface PayrollLineDraft extends Omit<PayrollLine, "id" | "createdAt" | "payrollRunId"> {
  payrollRunId: string;
}

const PAGIBIG_FIXED = 100;

function findConfiguredContribution(params: {
  code: string;
  grossSemiMonthly: number;
  benefitPlans?: BenefitPlan[];
  statutoryContributionRules?: StatutoryContributionRule[];
}): number | undefined {
  const { code, grossSemiMonthly, benefitPlans = [], statutoryContributionRules = [] } = params;
  const plan = benefitPlans.find((p) => p.code.toUpperCase() === code.toUpperCase() && p.isActive);
  if (!plan) return undefined;
  const monthly = grossSemiMonthly * 2;
  const currentYear = new Date().getFullYear();
  const rule = statutoryContributionRules
    .filter((r) =>
      r.benefitPlanId === plan.id &&
      r.effectiveYear <= currentYear &&
      monthly >= r.minSalary &&
      (r.maxSalary == null || monthly <= r.maxSalary)
    )
    .sort((a, b) => b.effectiveYear - a.effectiveYear || b.minSalary - a.minSalary)[0];
  if (rule) return Math.round((rule.employeeFixed + monthly * rule.employeeRate) / 2);
  if (plan.employeeShareType === "Fixed") return Math.round(plan.employeeShareValue / 2);
  if (plan.employeeShareType === "Percentage") return Math.round((monthly * (plan.employeeShareValue / 100)) / 2);
  return undefined;
}

function computeSSSDeduction(grossSemiMonthly: number): number {
  // Simplified table — SSS contribution ~4% employee share, capped
  const monthly = grossSemiMonthly * 2;
  if (monthly <= 4250) return 180 / 2;
  if (monthly <= 24750) return Math.round((monthly * 0.045) / 2);
  return 1125; // capped monthly / 2
}

function computePhilHealthDeduction(grossSemiMonthly: number): number {
  // PhilHealth 5% (2024+), employee share = 2.5%, capped monthly ₱100,000
  const monthly = Math.min(grossSemiMonthly * 2, 100000);
  return Math.round((monthly * 0.025) / 2);
}

function computeWithholdingTax(taxableIncome: number, taxTable?: TaxTable): number {
  // Use tax table brackets if provided; fall back to simplified BIR semi-monthly table
  const brackets = taxTable?.brackets ?? [];
  if (brackets.length > 0) {
    const sorted = [...brackets].sort((a, b) => a.incomeFrom - b.incomeFrom);
    for (let i = sorted.length - 1; i >= 0; i--) {
      const b = sorted[i];
      if (taxableIncome >= b.incomeFrom) {
        const excess = taxableIncome - b.incomeFrom;
        return Math.max(0, Math.round(b.baseTax + excess * b.rateAbove));
      }
    }
    return 0;
  }
  // BIR 2023 semi-monthly table simplified
  if (taxableIncome <= 10417) return 0;
  if (taxableIncome <= 16667) return Math.round((taxableIncome - 10417) * 0.15);
  if (taxableIncome <= 33333) return Math.round(937.5 + (taxableIncome - 16667) * 0.20);
  if (taxableIncome <= 83333) return Math.round(4270.83 + (taxableIncome - 33333) * 0.25);
  if (taxableIncome <= 333333) return Math.round(16770.83 + (taxableIncome - 83333) * 0.30);
  return Math.round(91770.83 + (taxableIncome - 333333) * 0.35);
}

export function calculatePayrollLine(params: {
  employee: Employee;
  payrollRunId: string;
  attendance?: AttendanceSummary;
  taxTable?: TaxTable;
  benefitPlans?: BenefitPlan[];
  statutoryContributionRules?: StatutoryContributionRule[];
}): PayrollLineDraft {
  const { employee, payrollRunId, attendance, taxTable, benefitPlans, statutoryContributionRules } = params;

  const semiMonthlyRate = employee.salary / 2;
  const dailyRate = employee.salary / 22;
  const minuteRate = dailyRate / 480;

  const lateDeduction = attendance ? Math.round(attendance.lateMinutes * minuteRate) : 0;
  const undertimeDeduction = attendance ? Math.round(attendance.undertimeMinutes * minuteRate) : 0;
  const absenceDeduction = attendance ? Math.round(attendance.absentDays * dailyRate) : 0;
  const overtimePay = attendance ? Math.round(attendance.overtimeMinutes * minuteRate * 1.25) : 0;
  const allowances = employee.status === "Full-Time" ? 1750 : 500;

  const grossPay = semiMonthlyRate + allowances + overtimePay - lateDeduction - undertimeDeduction - absenceDeduction;

  const sssDeduction = findConfiguredContribution({ code: "SSS", grossSemiMonthly: semiMonthlyRate, benefitPlans, statutoryContributionRules }) ?? computeSSSDeduction(semiMonthlyRate);
  const philhealthDeduction = findConfiguredContribution({ code: "PHILHEALTH", grossSemiMonthly: semiMonthlyRate, benefitPlans, statutoryContributionRules }) ?? computePhilHealthDeduction(semiMonthlyRate);
  const pagibigDeduction = findConfiguredContribution({ code: "PAGIBIG", grossSemiMonthly: semiMonthlyRate, benefitPlans, statutoryContributionRules }) ?? PAGIBIG_FIXED;

  const taxableIncome = grossPay - sssDeduction - philhealthDeduction - pagibigDeduction;
  const withholdingTax = computeWithholdingTax(taxableIncome, taxTable);

  const totalDeductions = sssDeduction + philhealthDeduction + pagibigDeduction + withholdingTax;
  const netPay = Math.max(0, grossPay - totalDeductions);

  return {
    payrollRunId,
    employeeId: employee.id,
    basicPay: Math.round(semiMonthlyRate),
    allowances,
    overtimePay,
    lateDeduction,
    undertimeDeduction,
    absenceDeduction,
    sssDeduction,
    philhealthDeduction,
    pagibigDeduction,
    withholdingTax,
    otherDeductions: 0,
    otherAllowances: 0,
    grossPay: Math.round(grossPay),
    netPay: Math.round(netPay),
    status: "Computed",
  };
}

export const EMPLOYMENT_STATUSES = [
  "Applicant", "For Onboarding", "Probationary", "Active", "Regular",
  "On Leave", "Suspended", "Resigned", "Terminated", "Retired", "Inactive",
] as const;

export type EmploymentStatus = typeof EMPLOYMENT_STATUSES[number];

export const ATTENDANCE_STATUSES = [
  "Present", "Late", "Undertime", "Absent", "On Leave",
  "Official Business", "Holiday", "Rest Day", "Half Day",
] as const;

export function formatTime(timeStr?: string): string {
  if (!timeStr) return "—";
  try {
    const d = new Date(timeStr);
    return d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return timeStr;
  }
}

export function minutesToHours(minutes: number): string {
  if (!minutes) return "0:00";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

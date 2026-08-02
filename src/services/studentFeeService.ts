import type {
  AcademicYear,
  AcademicYearLevel,
  ResolvedStudentFeeLine,
  StudentFeeCategory,
  StudentFeeItem,
  StudentFeeSchedule,
  StudentFeeScheduleRate,
  StudentPaymentTermTemplate,
  StudentPaymentTermTemplateInstallment,
} from "../types";

export interface StudentFeeConfiguration {
  academicYears: AcademicYear[];
  academicYearLevels: AcademicYearLevel[];
  studentFeeCategories: StudentFeeCategory[];
  studentFeeItems: StudentFeeItem[];
  studentFeeSchedules: StudentFeeSchedule[];
  studentFeeScheduleRates: StudentFeeScheduleRate[];
}

export class StudentFeeSetupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StudentFeeSetupError";
  }
}

const studentFeeAmountFormatter = new Intl.NumberFormat("en-PH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatStudentFeeAmount(value: number): string {
  return Number.isFinite(value) ? studentFeeAmountFormatter.format(value) : "";
}

export function normalizeStudentFeeAmountInput(value: string): string {
  const cleaned = value.replace(/,/g, "").replace(/[^\d.]/g, "");
  if (!cleaned) return "";

  const decimalIndex = cleaned.indexOf(".");
  const hasDecimal = decimalIndex >= 0;
  const wholePart = (hasDecimal ? cleaned.slice(0, decimalIndex) : cleaned)
    .replace(/^0+(?=\d)/, "") || "0";
  const decimalPart = hasDecimal
    ? cleaned.slice(decimalIndex + 1).replace(/\./g, "").slice(0, 2)
    : "";
  const groupedWholePart = wholePart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return hasDecimal ? `${groupedWholePart}.${decimalPart}` : groupedWholePart;
}

export function parseStudentFeeAmount(value: string): number {
  return Number(value.replace(/,/g, ""));
}

export function isPublishedStudentFeeScheduleHistory(schedule: StudentFeeSchedule): boolean {
  return schedule.status === "Published" || (schedule.status === "Archived" && Boolean(schedule.publishedAt));
}

export function isStudentFeeScheduleEditable(schedule: StudentFeeSchedule): boolean {
  return schedule.status === "Draft";
}

/**
 * Mirrors resolve_student_assessment_fees for immediate UI previews. The RPC is
 * still authoritative when an assessment is submitted.
 */
export function resolveConfiguredStudentFees(
  config: StudentFeeConfiguration,
  input: { schoolId: string; academicYear: string; yearLevel: string; courseId?: string },
): ResolvedStudentFeeLine[] {
  const academicYear = config.academicYears.find((year) => year.name === input.academicYear);
  if (!academicYear) throw new StudentFeeSetupError(`Academic year ${input.academicYear} is not configured.`);

  const levelToken = input.yearLevel.trim().toLowerCase();
  const yearLevel = config.academicYearLevels.find(
    (level) => level.isActive && (level.code.toLowerCase() === levelToken || level.name.toLowerCase() === levelToken),
  );
  if (!yearLevel) throw new StudentFeeSetupError(`Year level ${input.yearLevel} is not configured.`);

  const schedule = config.studentFeeSchedules.find(
    (candidate) => candidate.schoolId === input.schoolId
      && candidate.academicYearId === academicYear.id
      && candidate.academicUnit === yearLevel.academicUnit
      && candidate.status === "Published",
  );
  if (!schedule) {
    throw new StudentFeeSetupError(
      `No Published tuition-fee schedule exists for ${input.academicYear} (${yearLevel.academicUnit}).`,
    );
  }

  const applicableRates = config.studentFeeScheduleRates.filter(
    (rate) => rate.scheduleId === schedule.id
      && rate.yearLevelId === yearLevel.id
      && (!rate.courseId || rate.courseId === input.courseId),
  );
  const selectedByItem = new Map<string, StudentFeeScheduleRate>();
  for (const rate of applicableRates) {
    const selected = selectedByItem.get(rate.feeItemId);
    if (!selected || (rate.courseId === input.courseId && !selected.courseId)) selectedByItem.set(rate.feeItemId, rate);
  }

  const lines = [...selectedByItem.values()].flatMap((rate): ResolvedStudentFeeLine[] => {
    const item = config.studentFeeItems.find((candidate) => candidate.id === rate.feeItemId && candidate.isActive);
    const category = item && config.studentFeeCategories.find(
      (candidate) => candidate.id === item.categoryId && candidate.isActive,
    );
    if (!item || !category || rate.amount <= 0) return [];
    return [{
      feeScheduleId: schedule.id,
      feeScheduleRateId: rate.id,
      feeItemId: item.id,
      feeCategoryId: category.id,
      feeName: item.name,
      category: category.postingCategory,
      amount: Math.round(rate.amount * 100) / 100,
      quantity: 1,
      unitAmount: Math.round(rate.amount * 100) / 100,
      revenueAccountCode: category.revenueAccountCode,
      isRequired: rate.isRequired ?? item.isRequired,
    }];
  }).sort((left, right) => {
    const leftOrder = config.studentFeeItems.find((item) => item.id === left.feeItemId)?.sortOrder ?? 0;
    const rightOrder = config.studentFeeItems.find((item) => item.id === right.feeItemId)?.sortOrder ?? 0;
    return leftOrder - rightOrder;
  });

  if (!lines.length) throw new StudentFeeSetupError("The Published tuition-fee schedule resolved no applicable fee lines.");
  return lines;
}

export function findDefaultPaymentTermTemplate(
  templates: StudentPaymentTermTemplate[],
  input: { schoolId: string; academicYear: string },
): StudentPaymentTermTemplate {
  const template = templates.find(
    (candidate) => candidate.schoolId === input.schoolId
      && candidate.academicYear === input.academicYear
      && candidate.isActive
      && candidate.isDefault,
  );
  if (!template) {
    throw new StudentFeeSetupError(`No default payment-term template exists for ${input.academicYear}.`);
  }
  return template;
}

export function buildConfiguredPaymentSchedule(
  netAmount: number,
  template: StudentPaymentTermTemplate,
  installments: StudentPaymentTermTemplateInstallment[],
): { label: string; amount: number; dueDate: string }[] {
  const rows = installments
    .filter((row) => row.templateId === template.id)
    .sort((a, b) => a.sequenceNo - b.sequenceNo);
  if (!rows.length) throw new StudentFeeSetupError(`Payment term ${template.name} has no configured installments.`);
  const percentageTotal = rows.reduce((sum, row) => sum + row.percentage, 0);
  if (Math.abs(percentageTotal - 100) > 0.0001) {
    throw new StudentFeeSetupError(`Payment term ${template.name} percentages must total 100%.`);
  }
  let assigned = 0;
  return rows.map((row, index) => {
    const amount = index === rows.length - 1
      ? Math.round((netAmount - assigned) * 100) / 100
      : Math.round(netAmount * row.percentage) / 100;
    assigned += amount;
    return { label: row.label, amount, dueDate: row.dueDate };
  });
}

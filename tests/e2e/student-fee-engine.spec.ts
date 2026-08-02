import { expect, test } from "@playwright/test";
import {
  buildConfiguredPaymentSchedule,
  formatStudentFeeAmount,
  isPublishedStudentFeeScheduleHistory,
  isStudentFeeScheduleEditable,
  normalizeStudentFeeAmountInput,
  parseStudentFeeAmount,
  resolveConfiguredStudentFees,
  StudentFeeSetupError,
} from "../../src/services/studentFeeService";
import type { StudentFeeConfiguration } from "../../src/services/studentFeeService";

const config: StudentFeeConfiguration = {
  academicYears: [{ id: "ay", code: "SY", name: "2025-2026", startDate: "2025-06-01", endDate: "2026-03-31", status: "Active", isCurrent: true }],
  academicYearLevels: [{ id: "g1", code: "G1", name: "Grade 1", academicUnit: "basic-ed", sortOrder: 1, isActive: true }],
  studentFeeCategories: [
    { id: "tuition", schoolId: "school", code: "TUI", name: "Tuition", postingCategory: "Tuition", revenueAccountCode: "4110", isActive: true },
    { id: "misc", schoolId: "school", code: "MISC", name: "Misc", postingCategory: "Miscellaneous", revenueAccountCode: "4200", isActive: true },
  ],
  studentFeeItems: [
    { id: "tuition-item", schoolId: "school", code: "TUITION", name: "Tuition Fee", categoryId: "tuition", billingBasis: "Flat", isRequired: true, isDiscountable: true, isActive: true, sortOrder: 1 },
    { id: "misc-item", schoolId: "school", code: "MISC", name: "Registration", categoryId: "misc", billingBasis: "Flat", isRequired: true, isDiscountable: true, isActive: true, sortOrder: 2 },
    { id: "blank-item", schoolId: "school", code: "BLANK", name: "Blank Workbook Cell", categoryId: "misc", billingBasis: "Flat", isRequired: false, isDiscountable: false, isActive: true, sortOrder: 3 },
  ],
  studentFeeSchedules: [{ id: "schedule", schoolId: "school", academicYearId: "ay", academicUnit: "basic-ed", version: 1, status: "Published" }],
  studentFeeScheduleRates: [
    { id: "tuition-general", scheduleId: "schedule", feeItemId: "tuition-item", yearLevelId: "g1", amount: 10000.555 },
    { id: "tuition-course", scheduleId: "schedule", feeItemId: "tuition-item", yearLevelId: "g1", courseId: "stem", amount: 12000.555 },
    { id: "misc-rate", scheduleId: "schedule", feeItemId: "misc-item", yearLevelId: "g1", amount: 1500 },
  ],
};

test.describe("database-driven student fee engine", () => {
  test("formats maintenance amounts with grouping separators without changing their numeric value", () => {
    expect(formatStudentFeeAmount(39292.13)).toBe("39,292.13");
    expect(normalizeStudentFeeAmountInput("39292.1")).toBe("39,292.1");
    expect(normalizeStudentFeeAmountInput("PHP 39,292.139")).toBe("39,292.13");
    expect(parseStudentFeeAmount("39,292.13")).toBe(39292.13);
  });

  test("separates immutable published history from editable drafts", () => {
    const current = config.studentFeeSchedules[0];
    const previous = { ...current, id: "previous", version: 0, status: "Archived" as const, publishedAt: "2025-05-01T08:00:00Z" };
    const neverPublished = { ...current, id: "unused", version: 0, status: "Archived" as const };
    const draft = { ...current, id: "draft", version: 2, status: "Draft" as const };

    expect([current, previous, neverPublished, draft].filter(isPublishedStudentFeeScheduleHistory))
      .toEqual([current, previous]);
    expect(isStudentFeeScheduleEditable(current)).toBe(false);
    expect(isStudentFeeScheduleEditable(previous)).toBe(false);
    expect(isStudentFeeScheduleEditable(draft)).toBe(true);
  });

  test("resolves matrix totals, excludes blank cells, and rounds currency", () => {
    const lines = resolveConfiguredStudentFees(config, {
      schoolId: "school", academicYear: "2025-2026", yearLevel: "G1",
    });
    expect(lines.map((line) => line.feeName)).toEqual(["Tuition Fee", "Registration"]);
    expect(lines.find((line) => line.category === "Tuition")?.amount).toBe(10000.56);
    expect(lines.reduce((sum, line) => sum + line.amount, 0)).toBe(11500.56);
    expect(lines.filter((line) => line.category === "Miscellaneous").reduce((sum, line) => sum + line.amount, 0)).toBe(1500);
  });

  test("prefers a course override over the general rate", () => {
    const lines = resolveConfiguredStudentFees(config, {
      schoolId: "school", academicYear: "2025-2026", yearLevel: "Grade 1", courseId: "stem",
    });
    expect(lines.find((line) => line.category === "Tuition")?.amount).toBe(12000.56);
  });

  test("fails closed when no Published schedule exists", () => {
    expect(() => resolveConfiguredStudentFees({
      ...config,
      studentFeeSchedules: config.studentFeeSchedules.map((schedule) => ({ ...schedule, status: "Draft" })),
    }, { schoolId: "school", academicYear: "2025-2026", yearLevel: "G1" }))
      .toThrow(StudentFeeSetupError);
  });

  test("uses database installment percentages and assigns rounding residue to the last row", () => {
    const template = { id: "term", schoolId: "school", academicYear: "2025-2026", code: "TWO", name: "Two Payments", version: 1, isActive: true, isDefault: true };
    const schedule = buildConfiguredPaymentSchedule(100.01, template, [
      { id: "i1", templateId: "term", sequenceNo: 1, label: "First", percentage: 50, dueDate: "2025-06-15" },
      { id: "i2", templateId: "term", sequenceNo: 2, label: "Second", percentage: 50, dueDate: "2025-10-15" },
    ]);
    expect(schedule.map((row) => row.amount)).toEqual([50.01, 50]);
    expect(schedule.reduce((sum, row) => sum + row.amount, 0)).toBeCloseTo(100.01, 2);
  });
});

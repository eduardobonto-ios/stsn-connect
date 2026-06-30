/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  GradePeriod,
  GradeItem,
  GradeCategoryName,
  StudentGradeEntry,
  ComputedCategoryResult,
  ComputedPeriodGrade,
} from "../../../types/grading";

// ─── Rating scale ───────────────────────────────────────────────────────────
export function getRating(avg: number | null): string {
  if (avg == null) return "—";
  if (avg >= 90) return "Excellent";
  if (avg >= 85) return "Very Good";
  if (avg >= 80) return "Good";
  if (avg >= 75) return "Passed";
  return "Failed";
}

export function getRatingColor(avg: number | null): string {
  if (avg == null) return "text-stone-400";
  if (avg >= 90) return "text-violet-700";
  if (avg >= 85) return "text-blue-700";
  if (avg >= 80) return "text-emerald-700";
  if (avg >= 75) return "text-stsn-brown";
  return "text-red-600";
}

export function getRatingBadgeClass(avg: number | null): string {
  if (avg == null) return "bg-stone-50 text-stone-400 border-stone-200";
  if (avg >= 90) return "bg-violet-50 text-violet-700 border-violet-200";
  if (avg >= 85) return "bg-blue-50 text-blue-700 border-blue-200";
  if (avg >= 80) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (avg >= 75) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-red-50 text-red-700 border-red-200";
}

// ─── Core calculation helpers ───────────────────────────────────────────────

/** score / maxScore × 100 — returns null if score is null */
export function normalizeScore(score: number | null, maxScore: number): number | null {
  if (score == null) return null;
  if (maxScore <= 0) return null;
  return (score / maxScore) * 100;
}

/**
 * Average of all normalized scores for items belonging to a single category.
 * Items with null score are excluded (No Record ≠ zero).
 * Returns null when no valid score exists.
 */
export function computeCategoryAverage(
  entries: StudentGradeEntry[],
  items: GradeItem[],
  category: GradeCategoryName,
  studentId: string
): number | null {
  const categoryItems = items.filter((i) => i.category === category);
  if (categoryItems.length === 0) return null;

  const normalized: number[] = [];
  for (const item of categoryItems) {
    const entry = entries.find(
      (e) => e.studentId === studentId && e.gradeItemId === item.id
    );
    const norm = normalizeScore(entry?.score ?? null, item.maxScore);
    if (norm != null) normalized.push(norm);
  }

  if (normalized.length === 0) return null;
  return normalized.reduce((a, b) => a + b, 0) / normalized.length;
}

/**
 * Weighted period grade for one student.
 * Each category contributes: categoryAvg × (categoryWeight / totalUsedWeight).
 * Missing categories are excluded from the weight denominator so partial data
 * doesn't artificially deflate the grade.
 */
export function computePeriodGrade(
  period: GradePeriod,
  entries: StudentGradeEntry[],
  studentId: string
): ComputedPeriodGrade {
  const categoryResults: ComputedCategoryResult[] = [];
  let weightedSum = 0;
  let totalUsedWeight = 0;

  for (const cat of period.categories) {
    const avg = computeCategoryAverage(entries, period.items, cat.name, studentId);
    categoryResults.push({
      category: cat.name,
      weight: cat.weight,
      normalizedAverage: avg,
    });
    if (avg != null) {
      weightedSum += avg * cat.weight;
      totalUsedWeight += cat.weight;
    }
  }

  const weightedAverage =
    totalUsedWeight > 0 ? Math.round((weightedSum / totalUsedWeight) * 10) / 10 : null;

  return {
    studentId,
    periodId: period.id,
    periodLabel: period.label,
    categoryResults,
    weightedAverage,
    isPassing: weightedAverage != null ? weightedAverage >= 75 : null,
  };
}

/**
 * Compute period grades for all students in one shot.
 */
export function computeAllPeriodGrades(
  period: GradePeriod,
  entries: StudentGradeEntry[],
  studentIds: string[]
): ComputedPeriodGrade[] {
  return studentIds.map((id) => computePeriodGrade(period, entries, id));
}

/**
 * Term average across multiple period weighted averages.
 * Only periods with a computed grade contribute.
 */
export function computeTermAverage(periodGrades: (number | null)[]): number | null {
  const valid = periodGrades.filter((g): g is number => g != null);
  if (valid.length === 0) return null;
  return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10;
}

/**
 * Total weight of all categories in a period.
 * Used to validate that weights sum to 100.
 */
export function totalCategoryWeight(period: GradePeriod): number {
  return period.categories.reduce((sum, c) => sum + c.weight, 0);
}

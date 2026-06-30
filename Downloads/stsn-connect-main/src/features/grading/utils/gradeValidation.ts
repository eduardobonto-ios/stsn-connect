/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GradePeriod, GradeCategory, GradeCategoryName } from "../../../types/grading";

/** Returns true if the score is out of the valid range for its item */
export function isScoreInvalid(score: number | null, maxScore: number): boolean {
  if (score == null) return false; // null = No Record, not invalid
  return score < 0 || score > maxScore || !Number.isFinite(score);
}

/** Returns true if all category weights sum to 100 (±0.5 to allow e.g. 33.3% × 3 = 99.9%) */
export function areCategoryWeightsValid(categories: GradeCategory[]): boolean {
  if (categories.length === 0) return true;
  const total = categories.reduce((s, c) => s + c.weight, 0);
  return Math.abs(total - 100) < 0.5;
}

/** Returns the remaining weight budget (100 minus sum of current weights) */
export function remainingWeight(categories: GradeCategory[]): number {
  const used = categories.reduce((s, c) => s + c.weight, 0);
  return Math.round((100 - used) * 10) / 10;
}

/** Returns a user-facing validation message for weight issues, or null if valid */
export function weightValidationMessage(categories: GradeCategory[]): string | null {
  if (categories.length === 0) return null;
  const total = categories.reduce((s, c) => s + c.weight, 0);
  const diff = Math.round((total - 100) * 10) / 10;
  if (diff === 0) return null;
  if (diff > 0) return `Total weight is ${total}% — reduce by ${diff}% to reach 100%.`;
  return `Total weight is ${total}% — add ${Math.abs(diff)}% more to reach 100%.`;
}

/** Validate a period before finalization */
export interface PeriodValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePeriodForFinalization(period: GradePeriod): PeriodValidationResult {
  const errors: string[] = [];

  if (period.items.length === 0) {
    errors.push("No grade items have been added to this period.");
  }

  if (period.categories.length === 0) {
    errors.push("No grading categories are configured.");
  } else if (!areCategoryWeightsValid(period.categories)) {
    const total = period.categories.reduce((s, c) => s + c.weight, 0);
    errors.push(`Category weights sum to ${total}% — must equal 100%.`);
  }

  return { valid: errors.length === 0, errors };
}

/** Check if a category name already exists in the period */
export function categoryExists(
  categories: GradeCategory[],
  name: GradeCategoryName
): boolean {
  return categories.some((c) => c.name === name);
}

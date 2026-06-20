/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { BookPackage } from "../types";

/**
 * Books Setup config (Basic Education only).
 * Books do NOT apply to College — any UI consuming this config must hide
 * itself (or render the empty state) when academicUnit === "college".
 */

/** Basic Education grade levels eligible for a book package, in display order. */
export const BOOK_PACKAGE_GRADE_LEVELS: string[] = [
  "Nursery", "Kinder 1", "Kinder 2",
  "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6",
  "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12",
];

export const BOOK_PACKAGE_STATUSES: BookPackage["status"][] = ["Active", "Inactive"];

export interface StatusBadgeStyle {
  label: string;
  badgeClass: string;
}

export const BOOK_PACKAGE_STATUS_BADGE: Record<BookPackage["status"], StatusBadgeStyle> = {
  Active: { label: "Active", badgeClass: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  Inactive: { label: "Inactive", badgeClass: "text-stone-500 bg-stone-50 border-stone-200" },
};

/** Notice shown wherever a Books Setup UI is rendered for Basic Education. */
export const BOOKS_PACKAGE_ASSIGNMENT_NOTICE =
  "Book packages are assigned by grade level. Students cannot select individual books.";

/** Empty-state copy shown when the active academic unit is College. */
export const BOOKS_NOT_APPLICABLE_NOTICE =
  "Book package assessment is only available for Basic Education.";

/** Computes the total amount of a book package from its line items. */
export function computeBookPackageTotal(books: BookPackage["books"]): number {
  return books.reduce((sum, b) => sum + b.quantity * b.unitPrice, 0);
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * The app's type system keys schools/subjects by business code ("STSN",
 * "SHS-GEN-MATH") everywhere, but Supabase foreign keys are UUIDs. These maps
 * (populated once during store initialization) let write paths resolve a
 * business code back to the row id needed for an FK column.
 */
export const schoolCodeToId: Record<string, string> = {};
export const subjectCodeToId: Record<string, string> = {};

export const resolveSchoolId = (code?: string | null): string | null => (code ? schoolCodeToId[code] ?? null : null);
export const resolveSubjectId = (code?: string | null): string | null => (code ? subjectCodeToId[code] ?? null : null);

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ─── Period label unions ────────────────────────────────────────────────────
export type BasicEdPeriod = "1st Quarter" | "2nd Quarter" | "3rd Quarter" | "4th Quarter";
export type CollegePeriod  = "Prelim" | "Midterm" | "Final";
export type GradePeriodLabel = BasicEdPeriod | CollegePeriod;

export const BASIC_ED_PERIODS: BasicEdPeriod[] = [
  "1st Quarter", "2nd Quarter", "3rd Quarter", "4th Quarter",
];
export const COLLEGE_PERIODS: CollegePeriod[] = ["Prelim", "Midterm", "Final"];

// ─── Grade category names ───────────────────────────────────────────────────
export type GradeCategoryName =
  | "Quizzes"
  | "Activities"
  | "Projects"
  | "Assignments"
  | "Performance Tasks"
  | "Written Exams"
  | "Custom";

export const ALL_CATEGORY_NAMES: GradeCategoryName[] = [
  "Quizzes",
  "Activities",
  "Projects",
  "Assignments",
  "Performance Tasks",
  "Written Exams",
  "Custom",
];

// ─── Core grading interfaces ────────────────────────────────────────────────

/** A single gradable item (Quiz 1, Long Exam, Project 2, etc.) */
export interface GradeItem {
  id: string;
  label: string;
  category: GradeCategoryName;
  maxScore: number;
  order: number;
  dueDate?: string;
}

/** Weight configuration for one category within a grading period */
export interface GradeCategory {
  name: GradeCategoryName;
  weight: number; // 0–100; all category weights must sum to 100
}

/** Configuration for one grading period (not per-student — structure only) */
export interface GradePeriod {
  id: string;
  label: GradePeriodLabel;
  subjectCode: string;
  sectionId: string;
  schoolYear: string;
  teacherId: string;
  categories: GradeCategory[];
  items: GradeItem[];
  isFinalized: boolean;
  finalizedAt?: string;
  finalizedBy?: string;
}

/** A single student's raw score on a single grade item — null = No Record */
export interface StudentGradeEntry {
  id: string;
  periodId: string;
  studentId: string;
  gradeItemId: string;
  score: number | null;
}

/** Teacher's assignment to teach a subject to a specific section */
export interface SubjectClassLoad {
  id: string;
  teacherId: string;
  subjectCode: string;
  subjectName: string;
  sectionId: string;
  sectionName: string;
  department: "Basic Education" | "College";
  schoolYear: string;
  semester: "First Semester" | "Second Semester" | "Full Year";
  studentIds: string[];
}

// ─── Computed (never stored — always derived) ───────────────────────────────

export interface ComputedCategoryResult {
  category: GradeCategoryName;
  weight: number;
  normalizedAverage: number | null; // avg of (score/maxScore*100) across items
}

export interface ComputedPeriodGrade {
  studentId: string;
  periodId: string;
  periodLabel: GradePeriodLabel;
  categoryResults: ComputedCategoryResult[];
  weightedAverage: number | null;
  isPassing: boolean | null;
}

// ─── Lightweight student shape used in the grade sheet ─────────────────────
export interface GradeRosterStudent {
  id: string;
  studentNo: string;
  firstName: string;
  lastName: string;
  section: string;
  yearLevel: string;
  trackOrCourse: string;
  department: "Basic Education" | "College";
}

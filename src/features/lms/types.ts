/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Domain models for the Learning Management System (LMS module). Field names are
// camelCase mirrors of the snake_case columns in
// supabase/migrations/20260702120000_lms_module_schema.sql, produced by the
// toCamel() mapper in services/supabaseCrud.ts.

export type LmsDifficulty = "Beginner" | "Intermediate" | "Advanced";
export type LmsCourseStatus = "Draft" | "Published" | "Archived";
export type LmsLessonStatus = "Draft" | "Published" | "Archived";
export type LmsLessonContentType = "Video" | "Text" | "Document" | "Link" | "Quiz";
export type LmsResourceType = "Document" | "Link" | "Video" | "Other";
export type LmsEnrollmentStatus = "Active" | "Completed" | "Dropped";
export type LmsLessonProgressStatus = "NotStarted" | "InProgress" | "Completed";

export interface LmsCategory {
  id: string;
  schoolId?: string | null;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
}

export interface LmsCourse {
  id: string;
  schoolId?: string | null;
  categoryId?: string | null;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  difficulty: LmsDifficulty;
  durationMinutes: number;
  instructorId?: string | null;
  instructorName?: string | null;
  status: LmsCourseStatus;
  publishedAt?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export interface LmsCourseModule {
  id: string;
  schoolId?: string | null;
  courseId: string;
  title: string;
  description?: string | null;
  moduleOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string | null;
}

export interface LmsLesson {
  id: string;
  schoolId?: string | null;
  courseId: string;
  moduleId?: string | null;
  title: string;
  description?: string | null;
  contentType: LmsLessonContentType;
  contentUrl?: string | null;
  contentHtml?: string | null;
  lessonOrder: number;
  durationMinutes: number;
  isRequired: boolean;
  status: LmsLessonStatus;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string | null;
}

export interface LmsResource {
  id: string;
  schoolId?: string | null;
  courseId: string;
  lessonId?: string | null;
  title: string;
  resourceType: LmsResourceType;
  fileUrl?: string | null;
  externalUrl?: string | null;
  isActive: boolean;
}

export interface LmsEnrollment {
  id: string;
  schoolId?: string | null;
  courseId: string;
  studentId: string;
  studentName?: string | null;
  studentNo?: string | null;
  enrollmentStatus: LmsEnrollmentStatus;
  progressPercentage: number;
  startedAt?: string | null;
  completedAt?: string | null;
  isActive: boolean;
  createdAt?: string;
}

export interface LmsLessonProgress {
  id: string;
  schoolId?: string | null;
  courseId: string;
  lessonId: string;
  studentId: string;
  status: LmsLessonProgressStatus;
  progressPercentage: number;
  completedAt?: string | null;
  lastAccessedAt?: string | null;
}

export interface LmsActivityLog {
  id: string;
  schoolId?: string | null;
  userId?: string | null;
  userName?: string | null;
  courseId?: string | null;
  lessonId?: string | null;
  activityType: string;
  description?: string | null;
  createdAt?: string;
}

/** A learner option resolved from students for enrollment / autocomplete. */
export interface LmsStudentOption {
  refId: string;
  name: string;
  no: string;
  meta?: string;
}

// ── Assessments / Exams / Certificates (Phase 5–6) ──────────────────────────

export type LmsAssessmentType = "Assignment" | "Quiz" | "Exam" | "Activity" | "Project";
export type LmsAssessmentStatus = "Draft" | "Published" | "Archived";
export type LmsQuestionType =
  | "MultipleChoice"
  | "TrueFalse"
  | "ShortAnswer"
  | "Essay"
  | "Identification";
export type LmsAttemptStatus = "InProgress" | "Submitted" | "Graded";

export interface LmsAssessment {
  id: string;
  schoolId?: string | null;
  courseId?: string | null;
  title: string;
  description?: string | null;
  assessmentType: LmsAssessmentType;
  timeLimitMinutes: number;
  passingScore: number;
  totalPoints: number;
  dueDate?: string | null;
  status: LmsAssessmentStatus;
  allowRetake: boolean;
  maxAttempts: number;
  randomizeQuestions: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export interface LmsQuestion {
  id: string;
  schoolId?: string | null;
  assessmentId: string;
  questionText: string;
  questionType: LmsQuestionType;
  points: number;
  questionOrder: number;
  correctAnswer?: string | null;
  explanation?: string | null;
}

export interface LmsQuestionOption {
  id: string;
  questionId: string;
  optionText: string;
  isCorrect: boolean;
  optionOrder: number;
}

export interface LmsAttempt {
  id: string;
  schoolId?: string | null;
  assessmentId: string;
  studentId: string;
  attemptNumber: number;
  startedAt?: string | null;
  submittedAt?: string | null;
  status: LmsAttemptStatus;
  score: number;
  percentage: number;
  timeSpentSeconds: number;
}

export interface LmsAnswer {
  id: string;
  attemptId: string;
  questionId: string;
  selectedOptionId?: string | null;
  answerText?: string | null;
  isCorrect?: boolean | null;
  pointsAwarded: number;
}

export interface LmsResult {
  id: string;
  schoolId?: string | null;
  assessmentId: string;
  attemptId: string;
  studentId: string;
  score: number;
  percentage: number;
  passed: boolean;
  feedback?: string | null;
  gradedBy?: string | null;
  gradedAt?: string | null;
}

export interface LmsCertificate {
  id: string;
  schoolId?: string | null;
  courseId?: string | null;
  title: string;
  description?: string | null;
  templateUrl?: string | null;
  isActive: boolean;
}

export interface LmsStudentCertificate {
  id: string;
  schoolId?: string | null;
  certificateId?: string | null;
  studentId: string;
  courseId?: string | null;
  title?: string | null;
  issuedAt?: string | null;
  certificateUrl?: string | null;
}

export const LMS_SUB_PAGES = [
  "dashboard",
  "courses",
  "progress",
  "assessments",
  "exams",
  "question-builder",
  "teacher-board",
] as const;

export type LmsSubPage = (typeof LMS_SUB_PAGES)[number];

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSTSNStore } from "../../../services/store";
import {
  dbSelectAll,
  dbInsert,
  dbUpdate,
  dbDelete,
  newId,
} from "../../../services/supabaseCrud";
import type {
  LmsCategory,
  LmsCourse,
  LmsCourseModule,
  LmsLesson,
  LmsResource,
  LmsEnrollment,
  LmsLessonProgress,
  LmsActivityLog,
  LmsStudentOption,
  LmsAssessment,
  LmsQuestion,
  LmsQuestionOption,
  LmsAttempt,
  LmsAnswer,
  LmsResult,
  LmsCertificate,
  LmsStudentCertificate,
} from "../types";

const T = {
  categories: "lms_course_categories",
  courses: "lms_courses",
  modules: "lms_course_modules",
  lessons: "lms_course_lessons",
  resources: "lms_course_resources",
  enrollments: "lms_course_enrollments",
  lessonProgress: "lms_lesson_progress",
  activity: "lms_activity_logs",
  assessments: "lms_assessments",
  questions: "lms_assessment_questions",
  options: "lms_question_options",
  attempts: "lms_assessment_attempts",
  answers: "lms_assessment_answers",
  results: "lms_assessment_results",
  certificates: "lms_certificates",
  studentCertificates: "lms_student_certificates",
} as const;

/** Case-insensitive trimmed compare for free-text objective grading. */
const normalizeAnswer = (v?: string | null) => (v ?? "").trim().toLowerCase();

const nowIso = () => new Date().toISOString();

export function useLmsData() {
  const { students, schools, activeSchool, currentUser } = useSTSNStore();

  const [categories, setCategories] = useState<LmsCategory[]>([]);
  const [courses, setCourses] = useState<LmsCourse[]>([]);
  const [modules, setModules] = useState<LmsCourseModule[]>([]);
  const [lessons, setLessons] = useState<LmsLesson[]>([]);
  const [resources, setResources] = useState<LmsResource[]>([]);
  const [enrollments, setEnrollments] = useState<LmsEnrollment[]>([]);
  const [lessonProgress, setLessonProgress] = useState<LmsLessonProgress[]>([]);
  const [activity, setActivity] = useState<LmsActivityLog[]>([]);
  const [assessments, setAssessments] = useState<LmsAssessment[]>([]);
  const [questions, setQuestions] = useState<LmsQuestion[]>([]);
  const [options, setOptions] = useState<LmsQuestionOption[]>([]);
  const [attempts, setAttempts] = useState<LmsAttempt[]>([]);
  const [answers, setAnswers] = useState<LmsAnswer[]>([]);
  const [results, setResults] = useState<LmsResult[]>([]);
  const [certificates, setCertificates] = useState<LmsCertificate[]>([]);
  const [studentCertificates, setStudentCertificates] = useState<LmsStudentCertificate[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cat, crs, mod, les, res, enr, prog, act, asm, qs, opt, att, ans, rslt, cert, scert] =
        await Promise.all([
          dbSelectAll<LmsCategory>(T.categories),
          dbSelectAll<LmsCourse>(T.courses),
          dbSelectAll<LmsCourseModule>(T.modules),
          dbSelectAll<LmsLesson>(T.lessons),
          dbSelectAll<LmsResource>(T.resources),
          dbSelectAll<LmsEnrollment>(T.enrollments),
          dbSelectAll<LmsLessonProgress>(T.lessonProgress),
          dbSelectAll<LmsActivityLog>(T.activity),
          dbSelectAll<LmsAssessment>(T.assessments),
          dbSelectAll<LmsQuestion>(T.questions),
          dbSelectAll<LmsQuestionOption>(T.options),
          dbSelectAll<LmsAttempt>(T.attempts),
          dbSelectAll<LmsAnswer>(T.answers),
          dbSelectAll<LmsResult>(T.results),
          dbSelectAll<LmsCertificate>(T.certificates),
          dbSelectAll<LmsStudentCertificate>(T.studentCertificates),
        ]);
      setCategories(cat);
      setCourses(crs);
      setModules(mod);
      setLessons(les);
      setResources(res);
      setEnrollments(enr);
      setLessonProgress(prog);
      setActivity(act);
      setAssessments(asm);
      setQuestions(qs);
      setOptions(opt);
      setAttempts(att);
      setAnswers(ans);
      setResults(rslt);
      setCertificates(cert);
      setStudentCertificates(scert);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load LMS data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // ── school scoping (mirror useLibraryData) ─────────────────────────────────
  const activeSchoolUuid = useMemo(() => {
    if (activeSchool === "ALL") return null;
    const match = schools.find((s) => s.id === activeSchool || s.shortName === activeSchool);
    return match?.uuid ?? null;
  }, [schools, activeSchool]);

  const inScope = useCallback(
    (schoolId?: string | null) => {
      if (activeSchool === "ALL" || !activeSchoolUuid) return true;
      return !schoolId || schoolId === activeSchoolUuid;
    },
    [activeSchool, activeSchoolUuid],
  );

  const scoped = useMemo(
    () => ({
      categories: categories.filter((r) => inScope(r.schoolId)),
      courses: courses.filter((r) => inScope(r.schoolId)),
      enrollments: enrollments.filter((r) => inScope(r.schoolId)),
      activity: activity.filter((r) => inScope(r.schoolId)),
      assessments: assessments.filter((r) => inScope(r.schoolId)),
    }),
    [categories, courses, enrollments, activity, assessments, inScope],
  );

  // ── current student (self) + student options ───────────────────────────────
  const currentStudent = useMemo(() => {
    const scopedStudents = students.filter(
      (s) => activeSchool === "ALL" || s.schoolId === activeSchool,
    );
    return (
      students.find((s) => s.email && s.email === currentUser?.email) ??
      scopedStudents[0] ??
      students[0]
    );
  }, [students, activeSchool, currentUser?.email]);

  const studentOptions = useMemo<LmsStudentOption[]>(
    () =>
      students
        .filter((s) => activeSchool === "ALL" || s.schoolId === activeSchool)
        .map((s) => ({
          refId: s.id,
          name: `${s.lastName}, ${s.firstName}`,
          no: s.studentNo,
          meta: `${s.yearLevel ?? ""}${s.section ? ` • ${s.section}` : ""}`.trim(),
        })),
    [students, activeSchool],
  );

  // ── lookups ────────────────────────────────────────────────────────────────
  const categoryById = useCallback(
    (id?: string | null) => categories.find((c) => c.id === id),
    [categories],
  );
  const courseById = useCallback((id?: string | null) => courses.find((c) => c.id === id), [courses]);
  const moduleById = useCallback((id?: string | null) => modules.find((m) => m.id === id), [modules]);
  const modulesByCourse = useCallback(
    (courseId: string) =>
      modules
        .filter((m) => m.courseId === courseId)
        .sort((a, b) => a.moduleOrder - b.moduleOrder),
    [modules],
  );
  const lessonsByCourse = useCallback(
    (courseId: string) =>
      lessons
        .filter((l) => l.courseId === courseId)
        .sort((a, b) => a.lessonOrder - b.lessonOrder),
    [lessons],
  );
  const resourcesByCourse = useCallback(
    (courseId: string) => resources.filter((r) => r.courseId === courseId),
    [resources],
  );

  const enrollmentFor = useCallback(
    (courseId: string, studentId?: string) =>
      enrollments.find(
        (e) => e.courseId === courseId && e.studentId === (studentId ?? currentStudent?.id),
      ),
    [enrollments, currentStudent?.id],
  );

  const lessonProgressFor = useCallback(
    (lessonId: string, studentId?: string) =>
      lessonProgress.find(
        (p) => p.lessonId === lessonId && p.studentId === (studentId ?? currentStudent?.id),
      ),
    [lessonProgress, currentStudent?.id],
  );

  const actor = currentUser?.name ?? null;

  // ── activity log helper ─────────────────────────────────────────────────────
  const logActivity = useCallback(
    (input: {
      activityType: string;
      description?: string;
      courseId?: string | null;
      lessonId?: string | null;
      userId?: string | null;
      userName?: string | null;
    }) => {
      const row: LmsActivityLog = {
        id: newId(),
        schoolId: activeSchoolUuid,
        userId: input.userId ?? currentStudent?.id ?? null,
        userName: input.userName ?? actor,
        courseId: input.courseId ?? null,
        lessonId: input.lessonId ?? null,
        activityType: input.activityType,
        description: input.description ?? null,
        createdAt: nowIso(),
      };
      setActivity((prev) => [row, ...prev]);
      void dbInsert(T.activity, row);
      return row;
    },
    [activeSchoolUuid, actor, currentStudent?.id],
  );

  // ── course CRUD ──────────────────────────────────────────────────────────────
  const addCourse = useCallback(
    (
      input: Omit<LmsCourse, "id" | "isActive" | "status" | "difficulty" | "durationMinutes"> & {
        status?: LmsCourse["status"];
        difficulty?: LmsCourse["difficulty"];
        durationMinutes?: number;
        isActive?: boolean;
      },
    ) => {
      const row: LmsCourse = {
        id: newId(),
        isActive: input.isActive ?? true,
        status: input.status ?? "Draft",
        difficulty: input.difficulty ?? "Beginner",
        durationMinutes: input.durationMinutes ?? 0,
        ...input,
        schoolId: input.schoolId ?? activeSchoolUuid,
        createdBy: actor,
      };
      setCourses((prev) => [row, ...prev]);
      void dbInsert(T.courses, row);
      return row;
    },
    [activeSchoolUuid, actor],
  );

  const updateCourse = useCallback(
    (id: string, updates: Partial<LmsCourse>) => {
      const patch = { ...updates, updatedBy: actor };
      setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
      void dbUpdate(T.courses, id, patch);
    },
    [actor],
  );

  const deleteCourse = useCallback((id: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
    dbDelete(T.courses, id);
  }, []);

  const publishCourse = useCallback(
    (id: string, publish: boolean) => {
      updateCourse(id, {
        status: publish ? "Published" : "Draft",
        publishedAt: publish ? nowIso() : null,
      });
    },
    [updateCourse],
  );

  // ── module CRUD ───────────────────────────────────────────────────────────────
  const addModule = useCallback(
    (
      input: Omit<LmsCourseModule, "id" | "isActive" | "moduleOrder"> & {
        moduleOrder?: number;
        isActive?: boolean;
      },
    ) => {
      const existing = modules.filter((m) => m.courseId === input.courseId);
      const row: LmsCourseModule = {
        id: newId(),
        isActive: input.isActive ?? true,
        moduleOrder: input.moduleOrder ?? existing.length + 1,
        ...input,
        schoolId: input.schoolId ?? activeSchoolUuid,
        createdBy: actor,
      };
      setModules((prev) => [...prev, row]);
      void dbInsert(T.modules, row);
      return row;
    },
    [modules, activeSchoolUuid, actor],
  );

  const updateModule = useCallback((id: string, updates: Partial<LmsCourseModule>) => {
    setModules((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
    void dbUpdate(T.modules, id, updates);
  }, []);

  const deleteModule = useCallback((id: string) => {
    // Detach lessons from the deleted module so they fall back to the default group.
    setLessons((prev) => prev.map((l) => (l.moduleId === id ? { ...l, moduleId: null } : l)));
    setModules((prev) => prev.filter((m) => m.id !== id));
    dbDelete(T.modules, id);
  }, []);

  // ── lesson CRUD ───────────────────────────────────────────────────────────────
  const addLesson = useCallback(
    (
      input: Omit<LmsLesson, "id" | "isActive" | "status" | "contentType" | "lessonOrder" | "durationMinutes" | "isRequired"> & {
        status?: LmsLesson["status"];
        contentType?: LmsLesson["contentType"];
        lessonOrder?: number;
        durationMinutes?: number;
        isRequired?: boolean;
        isActive?: boolean;
      },
    ) => {
      const existing = lessons.filter((l) => l.courseId === input.courseId);
      const row: LmsLesson = {
        id: newId(),
        isActive: input.isActive ?? true,
        status: input.status ?? "Published",
        contentType: input.contentType ?? "Video",
        lessonOrder: input.lessonOrder ?? existing.length + 1,
        durationMinutes: input.durationMinutes ?? 0,
        isRequired: input.isRequired ?? true,
        ...input,
        schoolId: input.schoolId ?? activeSchoolUuid,
        createdBy: actor,
      };
      setLessons((prev) => [...prev, row]);
      void dbInsert(T.lessons, row);
      return row;
    },
    [activeSchoolUuid, actor, lessons],
  );

  const updateLesson = useCallback((id: string, updates: Partial<LmsLesson>) => {
    setLessons((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
    void dbUpdate(T.lessons, id, updates);
  }, []);

  const deleteLesson = useCallback((id: string) => {
    setLessons((prev) => prev.filter((l) => l.id !== id));
    dbDelete(T.lessons, id);
  }, []);

  // ── resource CRUD ─────────────────────────────────────────────────────────────
  const addResource = useCallback(
    (
      input: Omit<LmsResource, "id" | "isActive" | "resourceType"> & {
        resourceType?: LmsResource["resourceType"];
        isActive?: boolean;
      },
    ) => {
      const row: LmsResource = {
        id: newId(),
        isActive: input.isActive ?? true,
        resourceType: input.resourceType ?? "Document",
        ...input,
        schoolId: input.schoolId ?? activeSchoolUuid,
      };
      setResources((prev) => [row, ...prev]);
      void dbInsert(T.resources, row);
      return row;
    },
    [activeSchoolUuid],
  );

  const deleteResource = useCallback((id: string) => {
    setResources((prev) => prev.filter((r) => r.id !== id));
    dbDelete(T.resources, id);
  }, []);

  // ── enrollment ─────────────────────────────────────────────────────────────────
  const enroll = useCallback(
    (courseId: string, studentOverride?: LmsStudentOption) => {
      const targetId = studentOverride?.refId ?? currentStudent?.id;
      if (!targetId) return null;
      // Guard against duplicate enrollment.
      const existing = enrollments.find((e) => e.courseId === courseId && e.studentId === targetId);
      if (existing) return existing;

      const name = studentOverride
        ? studentOverride.name
        : currentStudent
          ? `${currentStudent.lastName}, ${currentStudent.firstName}`
          : null;
      const no = studentOverride?.no ?? currentStudent?.studentNo ?? null;

      const row: LmsEnrollment = {
        id: newId(),
        schoolId: activeSchoolUuid,
        courseId,
        studentId: targetId,
        studentName: name,
        studentNo: no,
        enrollmentStatus: "Active",
        progressPercentage: 0,
        startedAt: nowIso(),
        completedAt: null,
        isActive: true,
        createdAt: nowIso(),
      };
      setEnrollments((prev) => [row, ...prev]);
      void dbInsert(T.enrollments, row);
      logActivity({
        activityType: "COURSE_ENROLLED",
        description: `Enrolled in ${courseById(courseId)?.title ?? "a course"}`,
        courseId,
        userId: targetId,
        userName: name,
      });
      return row;
    },
    [activeSchoolUuid, currentStudent, enrollments, courseById, logActivity],
  );

  // ── lesson progress ──────────────────────────────────────────────────────────
  const markLessonComplete = useCallback(
    (courseId: string, lessonId: string, studentId?: string) => {
      const sid = studentId ?? currentStudent?.id;
      if (!sid) return;

      // 1. upsert lesson progress
      const existing = lessonProgress.find((p) => p.lessonId === lessonId && p.studentId === sid);
      let nextProgress: LmsLessonProgress[];
      if (existing) {
        const patch = {
          status: "Completed" as const,
          progressPercentage: 100,
          completedAt: nowIso(),
          lastAccessedAt: nowIso(),
        };
        nextProgress = lessonProgress.map((p) => (p.id === existing.id ? { ...p, ...patch } : p));
        void dbUpdate(T.lessonProgress, existing.id, patch);
      } else {
        const row: LmsLessonProgress = {
          id: newId(),
          schoolId: activeSchoolUuid,
          courseId,
          lessonId,
          studentId: sid,
          status: "Completed",
          progressPercentage: 100,
          completedAt: nowIso(),
          lastAccessedAt: nowIso(),
        };
        nextProgress = [row, ...lessonProgress];
        void dbInsert(T.lessonProgress, row);
      }
      setLessonProgress(nextProgress);

      // 2. recompute course progress from REQUIRED lessons
      const courseLessons = lessons.filter((l) => l.courseId === courseId);
      const required = courseLessons.filter((l) => l.isRequired);
      const denom = required.length > 0 ? required.length : courseLessons.length;
      const completedRequiredIds = new Set(
        nextProgress
          .filter((p) => p.courseId === courseId && p.studentId === sid && p.status === "Completed")
          .map((p) => p.lessonId),
      );
      const completedCount = (required.length > 0 ? required : courseLessons).filter((l) =>
        completedRequiredIds.has(l.id),
      ).length;
      const pct = denom > 0 ? Math.round((completedCount / denom) * 100) : 0;
      const isDone = pct >= 100;

      // 3. update the enrollment
      const enr = enrollments.find((e) => e.courseId === courseId && e.studentId === sid);
      if (enr) {
        const patch = {
          progressPercentage: pct,
          enrollmentStatus: isDone ? ("Completed" as const) : ("Active" as const),
          completedAt: isDone ? nowIso() : null,
        };
        setEnrollments((prev) => prev.map((e) => (e.id === enr.id ? { ...e, ...patch } : e)));
        void dbUpdate(T.enrollments, enr.id, patch);
      }

      // 4. log activity
      logActivity({
        activityType: isDone ? "COURSE_COMPLETED" : "LESSON_COMPLETED",
        description: isDone
          ? `Completed ${courseById(courseId)?.title ?? "a course"}`
          : `Completed a lesson in ${courseById(courseId)?.title ?? "a course"}`,
        courseId,
        lessonId,
        userId: sid,
      });

      return pct;
    },
    [activeSchoolUuid, currentStudent?.id, lessonProgress, lessons, enrollments, courseById, logActivity],
  );

  // ══════════════════════════════════════════════════════════════════════════
  //  ASSESSMENTS / EXAMS / CERTIFICATES (Phase 5–6)
  // ══════════════════════════════════════════════════════════════════════════

  // ── lookups ────────────────────────────────────────────────────────────────
  const assessmentById = useCallback(
    (id?: string | null) => assessments.find((a) => a.id === id),
    [assessments],
  );
  const assessmentsByCourse = useCallback(
    (courseId: string) => assessments.filter((a) => a.courseId === courseId),
    [assessments],
  );
  const questionsByAssessment = useCallback(
    (assessmentId: string) =>
      questions
        .filter((q) => q.assessmentId === assessmentId)
        .sort((a, b) => a.questionOrder - b.questionOrder),
    [questions],
  );
  const optionsByQuestion = useCallback(
    (questionId: string) =>
      options
        .filter((o) => o.questionId === questionId)
        .sort((a, b) => a.optionOrder - b.optionOrder),
    [options],
  );
  const attemptsFor = useCallback(
    (assessmentId: string, studentId?: string) =>
      attempts
        .filter(
          (t) => t.assessmentId === assessmentId && t.studentId === (studentId ?? currentStudent?.id),
        )
        .sort((a, b) => (b.startedAt ?? "").localeCompare(a.startedAt ?? "")),
    [attempts, currentStudent?.id],
  );
  const answersByAttempt = useCallback(
    (attemptId: string) => answers.filter((a) => a.attemptId === attemptId),
    [answers],
  );
  const resultForAttempt = useCallback(
    (attemptId: string) => results.find((r) => r.attemptId === attemptId),
    [results],
  );
  const latestResultFor = useCallback(
    (assessmentId: string, studentId?: string) => {
      const sid = studentId ?? currentStudent?.id;
      return results
        .filter((r) => r.assessmentId === assessmentId && r.studentId === sid)
        .sort((a, b) => (b.gradedAt ?? "").localeCompare(a.gradedAt ?? ""))[0];
    },
    [results, currentStudent?.id],
  );

  // ── assessment authoring CRUD ────────────────────────────────────────────
  const addAssessment = useCallback(
    (
      input: Omit<
        LmsAssessment,
        "id" | "isActive" | "status" | "assessmentType" | "timeLimitMinutes" | "passingScore" | "totalPoints" | "allowRetake" | "maxAttempts" | "randomizeQuestions"
      > & Partial<Pick<LmsAssessment, "status" | "assessmentType" | "timeLimitMinutes" | "passingScore" | "totalPoints" | "allowRetake" | "maxAttempts" | "randomizeQuestions" | "isActive">>,
    ) => {
      const row: LmsAssessment = {
        id: newId(),
        isActive: input.isActive ?? true,
        status: input.status ?? "Draft",
        assessmentType: input.assessmentType ?? "Quiz",
        timeLimitMinutes: input.timeLimitMinutes ?? 0,
        passingScore: input.passingScore ?? 60,
        totalPoints: input.totalPoints ?? 0,
        allowRetake: input.allowRetake ?? false,
        maxAttempts: input.maxAttempts ?? 1,
        randomizeQuestions: input.randomizeQuestions ?? false,
        ...input,
        schoolId: input.schoolId ?? activeSchoolUuid,
        createdBy: actor,
      };
      setAssessments((prev) => [row, ...prev]);
      void dbInsert(T.assessments, row);
      return row;
    },
    [activeSchoolUuid, actor],
  );

  const updateAssessment = useCallback(
    (id: string, updates: Partial<LmsAssessment>) => {
      const patch = { ...updates, updatedBy: actor };
      setAssessments((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
      void dbUpdate(T.assessments, id, patch);
    },
    [actor],
  );

  const deleteAssessment = useCallback((id: string) => {
    setAssessments((prev) => prev.filter((a) => a.id !== id));
    dbDelete(T.assessments, id);
  }, []);

  const publishAssessment = useCallback(
    (id: string, publish: boolean) => updateAssessment(id, { status: publish ? "Published" : "Draft" }),
    [updateAssessment],
  );

  // Recompute an assessment's total_points from its questions.
  const recomputeTotalPoints = useCallback(
    (assessmentId: string, nextQuestions: LmsQuestion[]) => {
      const total = nextQuestions
        .filter((q) => q.assessmentId === assessmentId)
        .reduce((s, q) => s + (q.points ?? 0), 0);
      setAssessments((prev) => prev.map((a) => (a.id === assessmentId ? { ...a, totalPoints: total } : a)));
      void dbUpdate(T.assessments, assessmentId, { totalPoints: total });
    },
    [],
  );

  // Save a question together with its options (create only, used by the builder).
  const addQuestion = useCallback(
    (
      input: Omit<LmsQuestion, "id" | "points" | "questionOrder"> & { points?: number; questionOrder?: number },
      optionInputs: { optionText: string; isCorrect: boolean }[] = [],
    ) => {
      const existing = questions.filter((q) => q.assessmentId === input.assessmentId);
      const question: LmsQuestion = {
        id: newId(),
        points: input.points ?? 1,
        questionOrder: input.questionOrder ?? existing.length + 1,
        ...input,
        schoolId: input.schoolId ?? activeSchoolUuid,
      };
      const nextQuestions = [...questions, question];
      setQuestions(nextQuestions);
      void dbInsert(T.questions, question);

      const newOptions: LmsQuestionOption[] = optionInputs.map((o, i) => ({
        id: newId(),
        questionId: question.id,
        optionText: o.optionText,
        isCorrect: o.isCorrect,
        optionOrder: i + 1,
      }));
      if (newOptions.length) {
        setOptions((prev) => [...prev, ...newOptions]);
        newOptions.forEach((o) => void dbInsert(T.options, o));
      }
      recomputeTotalPoints(input.assessmentId, nextQuestions);
      return question;
    },
    [questions, activeSchoolUuid, recomputeTotalPoints],
  );

  const deleteQuestion = useCallback(
    (id: string) => {
      const q = questions.find((x) => x.id === id);
      const nextQuestions = questions.filter((x) => x.id !== id);
      setQuestions(nextQuestions);
      setOptions((prev) => prev.filter((o) => o.questionId !== id));
      dbDelete(T.questions, id);
      if (q) recomputeTotalPoints(q.assessmentId, nextQuestions);
    },
    [questions, recomputeTotalPoints],
  );

  // ── attempt lifecycle ────────────────────────────────────────────────────
  const startAttempt = useCallback(
    (assessmentId: string) => {
      const sid = currentStudent?.id;
      if (!sid) return null;
      // Reuse an in-progress attempt if one exists.
      const open = attempts.find(
        (t) => t.assessmentId === assessmentId && t.studentId === sid && t.status === "InProgress",
      );
      if (open) return open;

      const prior = attempts.filter((t) => t.assessmentId === assessmentId && t.studentId === sid);
      const row: LmsAttempt = {
        id: newId(),
        schoolId: activeSchoolUuid,
        assessmentId,
        studentId: sid,
        attemptNumber: prior.length + 1,
        startedAt: nowIso(),
        submittedAt: null,
        status: "InProgress",
        score: 0,
        percentage: 0,
        timeSpentSeconds: 0,
      };
      setAttempts((prev) => [row, ...prev]);
      void dbInsert(T.attempts, row);
      logActivity({
        activityType: "ASSESSMENT_STARTED",
        description: `Started ${assessmentById(assessmentId)?.title ?? "an assessment"}`,
        courseId: assessmentById(assessmentId)?.courseId ?? null,
        userId: sid,
      });
      return row;
    },
    [attempts, currentStudent?.id, activeSchoolUuid, assessmentById, logActivity],
  );

  const saveAnswer = useCallback(
    (attemptId: string, questionId: string, value: { selectedOptionId?: string | null; answerText?: string | null }) => {
      const existing = answers.find((a) => a.attemptId === attemptId && a.questionId === questionId);
      if (existing) {
        const patch = {
          selectedOptionId: value.selectedOptionId ?? null,
          answerText: value.answerText ?? null,
        };
        setAnswers((prev) => prev.map((a) => (a.id === existing.id ? { ...a, ...patch } : a)));
        void dbUpdate(T.answers, existing.id, patch);
        return existing.id;
      }
      const row: LmsAnswer = {
        id: newId(),
        attemptId,
        questionId,
        selectedOptionId: value.selectedOptionId ?? null,
        answerText: value.answerText ?? null,
        isCorrect: null,
        pointsAwarded: 0,
      };
      setAnswers((prev) => [...prev, row]);
      void dbInsert(T.answers, row);
      return row.id;
    },
    [answers],
  );

  const submitAttempt = useCallback(
    (attemptId: string) => {
      const attempt = attempts.find((t) => t.id === attemptId);
      if (!attempt) return null;
      const assessment = assessmentById(attempt.assessmentId);
      const qs = questions.filter((q) => q.assessmentId === attempt.assessmentId);
      const attemptAnswers = answers.filter((a) => a.attemptId === attemptId);

      let earned = 0;
      let hasSubjective = false;
      const gradedAnswers = attemptAnswers.map((ans) => {
        const q = qs.find((x) => x.id === ans.questionId);
        if (!q) return ans;
        if (q.questionType === "Essay" || q.questionType === "ShortAnswer") {
          hasSubjective = true;
          return { ...ans, isCorrect: null, pointsAwarded: 0 };
        }
        let correct = false;
        if (q.questionType === "MultipleChoice" || q.questionType === "TrueFalse") {
          const opt = options.find((o) => o.id === ans.selectedOptionId);
          correct = !!opt?.isCorrect;
        } else if (q.questionType === "Identification") {
          correct = normalizeAnswer(ans.answerText) === normalizeAnswer(q.correctAnswer);
        }
        const awarded = correct ? q.points : 0;
        earned += awarded;
        return { ...ans, isCorrect: correct, pointsAwarded: awarded };
      });

      const totalPoints = qs.reduce((s, q) => s + (q.points ?? 0), 0);
      const percentage = totalPoints > 0 ? Math.round((earned / totalPoints) * 100) : 0;
      const passed = percentage >= (assessment?.passingScore ?? 60);
      const timeSpent = attempt.startedAt
        ? Math.max(0, Math.round((Date.now() - new Date(attempt.startedAt).getTime()) / 1000))
        : 0;
      const attemptStatus = hasSubjective ? "Submitted" : "Graded";

      // persist graded answers
      setAnswers((prev) =>
        prev.map((a) => {
          const g = gradedAnswers.find((x) => x.id === a.id);
          return g ? g : a;
        }),
      );
      gradedAnswers.forEach((g) =>
        void dbUpdate(T.answers, g.id, {
          isCorrect: g.isCorrect,
          pointsAwarded: g.pointsAwarded,
        }),
      );

      // update attempt
      const attemptPatch = {
        status: attemptStatus as LmsAttempt["status"],
        submittedAt: nowIso(),
        score: earned,
        percentage,
        timeSpentSeconds: timeSpent,
      };
      setAttempts((prev) => prev.map((t) => (t.id === attemptId ? { ...t, ...attemptPatch } : t)));
      void dbUpdate(T.attempts, attemptId, attemptPatch);

      // result row (auto for objective; provisional for subjective, teacher can regrade)
      const result: LmsResult = {
        id: newId(),
        schoolId: activeSchoolUuid,
        assessmentId: attempt.assessmentId,
        attemptId,
        studentId: attempt.studentId,
        score: earned,
        percentage,
        passed,
        feedback: hasSubjective ? "Awaiting instructor review for open-ended items." : null,
        gradedBy: hasSubjective ? null : "Auto-graded",
        gradedAt: hasSubjective ? null : nowIso(),
      };
      setResults((prev) => [result, ...prev.filter((r) => r.attemptId !== attemptId)]);
      void dbInsert(T.results, result);

      logActivity({
        activityType: "ASSESSMENT_SUBMITTED",
        description: `Submitted ${assessment?.title ?? "an assessment"} — ${percentage}%`,
        courseId: assessment?.courseId ?? null,
        userId: attempt.studentId,
      });

      // Auto-issue certificate if passed and a template exists for the course.
      if (passed && assessment?.courseId) {
        maybeIssueCertificate(assessment.courseId, attempt.studentId);
      }

      return { result, attemptStatus };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [attempts, assessmentById, questions, answers, options, activeSchoolUuid, logActivity],
  );

  // ── grading (subjective) ─────────────────────────────────────────────────
  const gradeResult = useCallback(
    (attemptId: string, patch: { score?: number; feedback?: string; passed?: boolean }) => {
      const attempt = attempts.find((t) => t.id === attemptId);
      const result = results.find((r) => r.attemptId === attemptId);
      const assessment = attempt ? assessmentById(attempt.assessmentId) : undefined;
      const total = assessment?.totalPoints ?? 0;
      const score = patch.score ?? result?.score ?? 0;
      const percentage = total > 0 ? Math.round((score / total) * 100) : (result?.percentage ?? 0);
      const passed = patch.passed ?? percentage >= (assessment?.passingScore ?? 60);
      const updates = {
        score,
        percentage,
        passed,
        feedback: patch.feedback ?? result?.feedback ?? null,
        gradedBy: actor,
        gradedAt: nowIso(),
      };
      if (result) {
        setResults((prev) => prev.map((r) => (r.id === result.id ? { ...r, ...updates } : r)));
        void dbUpdate(T.results, result.id, updates);
      }
      if (attempt) {
        const ap = { status: "Graded" as const, score, percentage };
        setAttempts((prev) => prev.map((t) => (t.id === attempt.id ? { ...t, ...ap } : t)));
        void dbUpdate(T.attempts, attempt.id, ap);
      }
      if (passed && assessment?.courseId && attempt) {
        maybeIssueCertificate(assessment.courseId, attempt.studentId);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [attempts, results, assessmentById, actor],
  );

  // ── certificates ─────────────────────────────────────────────────────────
  function maybeIssueCertificate(courseId: string, studentId: string) {
    const template = certificates.find((c) => c.courseId === courseId && c.isActive);
    const already = studentCertificates.find(
      (sc) => sc.courseId === courseId && sc.studentId === studentId,
    );
    if (already) return;
    const course = courses.find((c) => c.id === courseId);
    const row: LmsStudentCertificate = {
      id: newId(),
      schoolId: activeSchoolUuid,
      certificateId: template?.id ?? null,
      studentId,
      courseId,
      title: template?.title ?? `Certificate of Completion — ${course?.title ?? "Course"}`,
      issuedAt: nowIso(),
      certificateUrl: template?.templateUrl ?? null,
    };
    setStudentCertificates((prev) => [row, ...prev]);
    void dbInsert(T.studentCertificates, row);
    logActivity({
      activityType: "CERTIFICATE_ISSUED",
      description: `Earned a certificate for ${course?.title ?? "a course"}`,
      courseId,
      userId: studentId,
    });
  }

  // ── derived KPIs (for the current student where relevant) ──────────────────
  const kpis = useMemo(() => {
    const publishedCourses = scoped.courses.filter((c) => c.status === "Published");
    const myEnrollments = scoped.enrollments.filter((e) => e.studentId === currentStudent?.id);
    const myActive = myEnrollments.filter((e) => e.enrollmentStatus === "Active");
    const myCompleted = myEnrollments.filter((e) => e.enrollmentStatus === "Completed");
    const avgProgress =
      myEnrollments.length > 0
        ? Math.round(
            myEnrollments.reduce((s, e) => s + (e.progressPercentage ?? 0), 0) / myEnrollments.length,
          )
        : 0;
    const completionRate =
      myEnrollments.length > 0
        ? Math.round((myCompleted.length / myEnrollments.length) * 100)
        : 0;
    const myCertificates = studentCertificates.filter((c) => c.studentId === currentStudent?.id);
    return {
      publishedCourses: publishedCourses.length,
      totalCourses: scoped.courses.length,
      myEnrollmentCount: myEnrollments.length,
      myActiveCount: myActive.length,
      myCompletedCount: myCompleted.length,
      avgProgress,
      completionRate,
      publishedAssessments: scoped.assessments.filter((a) => a.status === "Published").length,
      myCertificateCount: myCertificates.length,
    };
  }, [scoped.courses, scoped.enrollments, scoped.assessments, studentCertificates, currentStudent?.id]);

  return {
    loading,
    error,
    reload: load,
    activeSchoolUuid,
    currentStudent,
    studentOptions,
    // scoped data
    categories: scoped.categories,
    courses: scoped.courses,
    modules,
    lessons,
    resources,
    enrollments: scoped.enrollments,
    lessonProgress,
    activity: scoped.activity,
    // lookups
    categoryById,
    courseById,
    moduleById,
    modulesByCourse,
    lessonsByCourse,
    resourcesByCourse,
    enrollmentFor,
    lessonProgressFor,
    // KPIs
    kpis,
    // course CRUD
    addCourse,
    updateCourse,
    deleteCourse,
    publishCourse,
    // module CRUD
    addModule,
    updateModule,
    deleteModule,
    // lesson CRUD
    addLesson,
    updateLesson,
    deleteLesson,
    // resource CRUD
    addResource,
    deleteResource,
    // workflows
    enroll,
    markLessonComplete,
    logActivity,
    // assessments — raw data
    assessments: scoped.assessments,
    questions,
    options,
    attempts,
    answers,
    results,
    certificates,
    studentCertificates,
    // assessments — lookups
    assessmentById,
    assessmentsByCourse,
    questionsByAssessment,
    optionsByQuestion,
    attemptsFor,
    answersByAttempt,
    resultForAttempt,
    latestResultFor,
    // assessments — authoring
    addAssessment,
    updateAssessment,
    deleteAssessment,
    publishAssessment,
    addQuestion,
    deleteQuestion,
    // assessments — attempts / grading
    startAttempt,
    saveAnswer,
    submitAttempt,
    gradeResult,
  };
}

export type LmsData = ReturnType<typeof useLmsData>;

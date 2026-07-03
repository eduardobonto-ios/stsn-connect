/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Circle,
  Plus,
  Paperclip,
  NotebookPen,
  MessageSquare,
  Play,
  Eye,
  HelpCircle,
  Send,
  Lock,
  ChevronDown,
  Layers,
} from "lucide-react";
import AppCard from "../../../../components/common/AppCard";
import AppButton from "../../../../components/common/AppButton";
import AppEmptyState from "../../../../components/common/AppEmptyState";
import AppStatusBadge from "../../../../components/common/AppStatusBadge";
import type { LmsData } from "../../data/useLmsData";
import type { LmsCourse, LmsLesson } from "../../types";
import { CONTENT_TYPE_ICON, ProgressBar, ASSESSMENT_TYPE_BADGE, formatDuration, formatDateTime } from "../shared";
import LessonForm from "./LessonForm";
import { useAssessmentRunner, AssessmentRunnerView } from "./assessmentRunner";

function LessonPlayerArea({ lesson }: { lesson: LmsLesson }) {
  if (lesson.contentType === "Video" && lesson.contentUrl) {
    return (
      <div className="aspect-video w-full bg-black rounded-xl overflow-hidden">
        <iframe
          src={lesson.contentUrl}
          title={lesson.title}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  if (lesson.contentType === "Text" && lesson.contentHtml) {
    return (
      <div
        className="prose prose-sm max-w-none rounded-xl border border-stone-200 bg-white p-5 text-stone-700"
        dangerouslySetInnerHTML={{ __html: lesson.contentHtml }}
      />
    );
  }
  if (lesson.contentType === "Link" && lesson.contentUrl) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-6 flex flex-col items-center gap-3 text-center">
        <ExternalLink className="w-8 h-8 text-stsn-gold" />
        <p className="text-sm text-stone-600">This lesson links to an external resource.</p>
        <a href={lesson.contentUrl} target="_blank" rel="noreferrer">
          <AppButton variant="primary" size="sm" leftIcon={ExternalLink}>Open Resource</AppButton>
        </a>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-stone-200 bg-gradient-to-br from-stsn-cream/60 to-white p-8 flex flex-col items-center gap-3 text-center">
      <FileText className="w-10 h-10 text-stsn-brown/50" />
      <p className="text-sm font-semibold text-stone-700">{lesson.title}</p>
      <p className="text-xs text-stone-500 max-w-md">{lesson.description || "Read through the lesson material below and mark it complete when finished."}</p>
      {lesson.contentUrl && (
        <a href={lesson.contentUrl} target="_blank" rel="noreferrer">
          <AppButton variant="secondary" size="sm" leftIcon={Download}>Download Material</AppButton>
        </a>
      )}
    </div>
  );
}

/** Per-lesson private notes, persisted to this browser's localStorage. */
function NotesPanel({ lessonId, studentId }: { lessonId: string; studentId?: string }) {
  const key = `lms-notes:${studentId ?? "anon"}:${lessonId}`;
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setText(localStorage.getItem(key) ?? "");
    setSaved(false);
  }, [key]);

  const save = () => {
    localStorage.setItem(key, text);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => { setText(e.target.value); setSaved(false); }}
        rows={6}
        placeholder="Jot down your notes for this lesson…"
        className="w-full border border-stone-200 rounded-xl py-2.5 px-3 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-stsn-brown/20 resize-none"
      />
      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] text-stone-400">Saved privately on this device.</span>
        <AppButton variant="secondary" size="sm" onClick={save}>{saved ? "Saved ✓" : "Save Notes"}</AppButton>
      </div>
    </div>
  );
}

type LocalComment = { id: string; author: string; text: string; at: string };

/** Lightweight per-course discussion thread, persisted to localStorage. */
function DiscussionPanel({ courseId, author }: { courseId: string; author: string }) {
  const key = `lms-discussion:${courseId}`;
  const [comments, setComments] = useState<LocalComment[]>([]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    try {
      setComments(JSON.parse(localStorage.getItem(key) ?? "[]"));
    } catch {
      setComments([]);
    }
  }, [key]);

  const post = () => {
    const body = draft.trim();
    if (!body) return;
    const next: LocalComment[] = [
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, author, text: body, at: new Date().toISOString() },
      ...comments,
    ];
    setComments(next);
    localStorage.setItem(key, JSON.stringify(next));
    setDraft("");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          placeholder="Ask a question or share a note with the class…"
          className="flex-1 border border-stone-200 rounded-xl py-2 px-3 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-stsn-brown/20 resize-none"
        />
        <AppButton variant="primary" size="sm" leftIcon={Send} disabled={!draft.trim()} onClick={post}>Post</AppButton>
      </div>
      {comments.length === 0 ? (
        <p className="text-xs text-stone-400">No messages yet. Start the discussion.</p>
      ) : (
        <div className="space-y-2">
          {comments.map((c) => (
            <div key={c.id} className="rounded-xl border border-stone-100 bg-stone-50/60 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-stone-800">{c.author}</span>
                <span className="text-[10px] font-mono text-stone-400">{formatDateTime(c.at)}</span>
              </div>
              <p className="text-xs text-stone-600 mt-0.5 whitespace-pre-wrap">{c.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type ContentTab = "resources" | "notes" | "discussion";

export default function CourseDetails({
  course,
  lms,
  canEdit,
  onBack,
  onToast,
}: {
  course: LmsCourse;
  lms: LmsData;
  canEdit: boolean;
  onBack: () => void;
  onToast: (msg: string, type?: "success" | "error") => void;
}) {
  const lessons = lms.lessonsByCourse(course.id);
  const resources = lms.resourcesByCourse(course.id);
  const enrollment = lms.enrollmentFor(course.id);
  const [activeLessonId, setActiveLessonId] = useState<string | undefined>(lessons[0]?.id);
  const [lessonFormOpen, setLessonFormOpen] = useState(false);
  const [tab, setTab] = useState<ContentTab>("resources");
  const [openOverride, setOpenOverride] = useState<Record<string, boolean>>({});

  const runner = useAssessmentRunner(lms, onToast);

  const activeIndex = lessons.findIndex((l) => l.id === activeLessonId);
  const activeLesson = activeIndex >= 0 ? lessons[activeIndex] : lessons[0];

  const completedIds = useMemo(() => {
    const sid = lms.currentStudent?.id;
    return new Set(
      lms.lessonProgress
        .filter((p) => p.courseId === course.id && p.studentId === sid && p.status === "Completed")
        .map((p) => p.lessonId),
    );
  }, [lms.lessonProgress, lms.currentStudent?.id, course.id]);

  // Published assessments tied to this course (for the module-quiz launcher).
  const courseAssessments = useMemo(
    () => lms.assessmentsByCourse(course.id).filter((a) => a.status === "Published"),
    [lms, course.id],
  );

  // Group lessons into modules with sequential-unlock state. Modules gate on the
  // completion of the previous module's required lessons (only when enrolled);
  // lessons without a module fall into a trailing, always-open group.
  const groups = useMemo(() => {
    const courseModules = lms.modulesByCourse(course.id);
    const out: { key: string; title: string; lessons: LmsLesson[]; locked: boolean; isModule: boolean }[] = [];
    if (courseModules.length > 0) {
      let prevComplete = true;
      for (const m of courseModules) {
        const ls = lessons.filter((l) => l.moduleId === m.id);
        const locked = !!enrollment && !prevComplete;
        out.push({ key: m.id, title: m.title, lessons: ls, locked, isModule: true });
        const requiredComplete = ls.filter((l) => l.isRequired).every((l) => completedIds.has(l.id));
        prevComplete = prevComplete && requiredComplete;
      }
      const ungrouped = lessons.filter((l) => !l.moduleId);
      if (ungrouped.length) {
        out.push({ key: "ungrouped", title: "Additional Lessons", lessons: ungrouped, locked: false, isModule: false });
      }
    } else {
      out.push({ key: "all", title: "Course Outline", lessons, locked: false, isModule: false });
    }
    return out;
  }, [lms, course.id, lessons, enrollment, completedIds]);

  const lockedLessonIds = useMemo(() => {
    const s = new Set<string>();
    groups.forEach((g) => g.locked && g.lessons.forEach((l) => s.add(l.id)));
    return s;
  }, [groups]);

  const activeGroupKey = groups.find((g) => g.lessons.some((l) => l.id === activeLesson?.id))?.key;
  const isGroupOpen = (g: { key: string; locked: boolean }) =>
    g.locked ? false : (openOverride[g.key] ?? g.key === activeGroupKey);
  const toggleGroup = (key: string) => setOpenOverride((prev) => ({ ...prev, [key]: !(prev[key] ?? key === activeGroupKey) }));

  const goToLesson = (id: string) => {
    if (lockedLessonIds.has(id)) return;
    setActiveLessonId(id);
  };
  const goPrev = () => activeIndex > 0 && setActiveLessonId(lessons[activeIndex - 1].id);
  const goNext = () => activeIndex < lessons.length - 1 && setActiveLessonId(lessons[activeIndex + 1].id);

  const handleComplete = () => {
    if (!activeLesson) return;
    if (!enrollment) {
      onToast("Enroll in this course first to track progress.", "error");
      return;
    }
    const pct = lms.markLessonComplete(course.id, activeLesson.id);
    onToast(pct != null && pct >= 100 ? "Course completed! 🎉" : "Lesson marked complete.");
    if (activeIndex < lessons.length - 1) goNext();
  };

  const studentName = lms.currentStudent
    ? `${lms.currentStudent.firstName} ${lms.currentStudent.lastName}`
    : "You";

  // When an assessment is being taken / reviewed, hand the whole view to the runner.
  if (runner.state.mode !== "list") {
    return (
      <div className="space-y-4">
        <button
          onClick={runner.exit}
          className="flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stsn-brown transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to {course.title}
        </button>
        <AssessmentRunnerView runner={runner} lms={lms} onToast={onToast} />
      </div>
    );
  }

  const CONTENT_TABS: { id: ContentTab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: "resources", label: "Resources", icon: Paperclip, count: resources.length },
    { id: "notes", label: "My Notes", icon: NotebookPen },
    { id: "discussion", label: "Discussion", icon: MessageSquare },
  ];

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stsn-brown transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Catalog
        </button>
        {canEdit && (
          <AppButton variant="secondary" size="sm" leftIcon={Plus} onClick={() => setLessonFormOpen(true)}>
            Add Lesson
          </AppButton>
        )}
      </div>

      {/* Title card */}
      <AppCard tone="brand" className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {lms.categoryById(course.categoryId) && (
                <span className="text-[9px] font-mono uppercase tracking-widest text-stsn-gold">
                  {lms.categoryById(course.categoryId)?.name}
                </span>
              )}
              <AppStatusBadge status={course.difficulty} />
              <AppStatusBadge status={course.status} />
            </div>
            <h2 className="text-lg font-display font-black text-stsn-brown-dark leading-tight">{course.title}</h2>
            <p className="text-xs text-stone-600 mt-1 max-w-2xl">{course.description}</p>
            <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-stone-500">
              <span>{lessons.length} lessons</span>
              <span>•</span>
              <span>{formatDuration(course.durationMinutes)}</span>
              {course.instructorName && (<><span>•</span><span>{course.instructorName}</span></>)}
            </div>
          </div>
          {enrollment && (
            <div className="w-40">
              <div className="flex items-center justify-between text-[9px] font-mono text-stone-500 mb-1">
                <span>Your Progress</span>
                <span>{Math.round(enrollment.progressPercentage)}%</span>
              </div>
              <ProgressBar value={enrollment.progressPercentage} />
              <p className="text-[9px] font-mono text-stone-400 mt-1 text-right">
                {completedIds.size} / {lessons.length} lessons complete
              </p>
            </div>
          )}
        </div>
      </AppCard>

      {lessons.length === 0 ? (
        <AppEmptyState
          icon={FileText}
          title="No lessons yet"
          description={canEdit ? "Add the first lesson to this course." : "Lessons will appear here once published."}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
          {/* Player + content */}
          <div className="space-y-3">
            {activeLesson && lockedLessonIds.has(activeLesson.id) ? (
              <AppCard tone="brand" className="p-8 flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-stone-400" />
                </div>
                <p className="text-sm font-bold text-stone-700">This module is locked</p>
                <p className="text-xs text-stone-500 max-w-sm">Complete the previous module's required lessons to unlock this content.</p>
              </AppCard>
            ) : (
              <>
                {activeLesson && <LessonPlayerArea lesson={activeLesson} />}
                {activeLesson && (
                  <AppCard tone="brand" className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-stone-800">{activeLesson.title}</h3>
                        <p className="text-xs text-stone-500 mt-1">{activeLesson.description}</p>
                      </div>
                      {completedIds.has(activeLesson.id) && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 flex-shrink-0">
                          <CheckCircle2 className="w-4 h-4" /> Completed
                        </span>
                      )}
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-2">
                      <AppButton variant="ghost" size="sm" leftIcon={ChevronLeft} disabled={activeIndex <= 0} onClick={goPrev}>
                        Previous
                      </AppButton>
                      <AppButton
                        variant="primary"
                        size="sm"
                        leftIcon={CheckCircle2}
                        disabled={completedIds.has(activeLesson.id)}
                        onClick={handleComplete}
                      >
                        {completedIds.has(activeLesson.id) ? "Completed" : "Mark Complete"}
                      </AppButton>
                      <AppButton variant="ghost" size="sm" rightIcon={ChevronRight} disabled={activeIndex >= lessons.length - 1} onClick={goNext}>
                        Next
                      </AppButton>
                    </div>
                  </AppCard>
                )}
              </>
            )}

            {/* Tabbed content: Resources / Notes / Discussion */}
            <AppCard tone="brand" className="p-0 overflow-hidden">
              <div className="flex items-stretch border-b border-stone-100">
                {CONTENT_TABS.map((t) => {
                  const Icon = t.icon;
                  const active = tab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold transition cursor-pointer ${
                        active ? "text-stsn-brown border-b-2 border-stsn-gold" : "text-stone-500 hover:text-stsn-brown"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {t.label}
                      {t.count != null && t.count > 0 && (
                        <span className="text-[9px] font-mono text-stone-400">({t.count})</span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="p-5">
                {tab === "resources" && (
                  resources.length === 0 ? (
                    <p className="text-xs text-stone-400">No resources attached to this course yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {resources.map((r) => (
                        <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-stone-100 bg-stone-50/60 px-3 py-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 text-stsn-gold flex-shrink-0" />
                            <span className="text-xs text-stone-700 truncate">{r.title}</span>
                          </div>
                          {(r.fileUrl || r.externalUrl) && (
                            <a href={r.fileUrl || r.externalUrl || "#"} target="_blank" rel="noreferrer" className="text-stone-400 hover:text-stsn-brown transition">
                              {r.externalUrl ? <ExternalLink className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                )}
                {tab === "notes" && activeLesson && (
                  <NotesPanel lessonId={activeLesson.id} studentId={lms.currentStudent?.id} />
                )}
                {tab === "discussion" && (
                  <DiscussionPanel courseId={course.id} author={studentName} />
                )}
              </div>
            </AppCard>

            {/* Module quiz launcher */}
            {courseAssessments.length > 0 && (
              <AppCard tone="brand" className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <HelpCircle className="w-4 h-4 text-stsn-gold" />
                  <h3 className="text-sm font-bold text-stone-800">Module Assessments</h3>
                  <span className="text-[10px] font-mono text-stone-400">Test what you've learned</span>
                </div>
                <div className="space-y-2">
                  {courseAssessments.map((a) => {
                    const attempt = lms.attemptsFor(a.id)[0];
                    const result = lms.latestResultFor(a.id);
                    const done = attempt && attempt.status !== "InProgress";
                    return (
                      <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-100 bg-stone-50/50 px-3 py-2.5">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${ASSESSMENT_TYPE_BADGE[a.assessmentType]}`}>{a.assessmentType}</span>
                            <p className="text-sm font-bold text-stone-800 truncate">{a.title}</p>
                          </div>
                          <p className="text-[10px] font-mono text-stone-500 mt-0.5">
                            {a.totalPoints} pts • Passing {a.passingScore}%{a.timeLimitMinutes > 0 ? ` • ${a.timeLimitMinutes} min` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {result && <span className="text-sm font-display font-black text-stsn-brown">{result.percentage}%</span>}
                          {done && attempt ? (
                            <AppButton variant="secondary" size="sm" leftIcon={Eye} onClick={() => runner.viewResult(a.id, attempt.id)}>
                              View Results
                            </AppButton>
                          ) : (
                            <AppButton variant="primary" size="sm" leftIcon={Play} onClick={() => runner.startExam(a)}>
                              Start Quiz
                            </AppButton>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </AppCard>
            )}
          </div>

          {/* Lesson sidebar / module outline */}
          <AppCard tone="brand" className="p-4 h-fit">
            <h3 className="text-xs font-bold uppercase tracking-wide text-stone-500 mb-3">Course Content</h3>
            <div className="space-y-2">
              {groups.map((g) => {
                const open = isGroupOpen(g);
                const doneCount = g.lessons.filter((l) => completedIds.has(l.id)).length;
                return (
                  <div key={g.key} className="rounded-xl border border-stone-100 overflow-hidden">
                    {/* Group header */}
                    <button
                      onClick={() => !g.locked && toggleGroup(g.key)}
                      disabled={g.locked}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 text-left transition ${
                        g.locked ? "bg-stone-50/60 cursor-not-allowed" : "hover:bg-stone-50 cursor-pointer"
                      }`}
                    >
                      {g.isModule ? (
                        g.locked ? <Lock className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" /> : <Layers className="w-3.5 h-3.5 text-stsn-gold flex-shrink-0" />
                      ) : (
                        <Layers className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className={`text-xs font-bold truncate block ${g.locked ? "text-stone-400" : "text-stone-700"}`}>{g.title}</span>
                        <span className="text-[10px] font-mono text-stone-400">{doneCount}/{g.lessons.length} complete</span>
                      </span>
                      {!g.locked && (
                        <ChevronDown className={`w-4 h-4 text-stone-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
                      )}
                    </button>

                    {/* Group lessons */}
                    {open && !g.locked && (
                      <div className="p-1.5 pt-0 space-y-1">
                        {g.lessons.map((l) => {
                          const Icon = CONTENT_TYPE_ICON[l.contentType];
                          const done = completedIds.has(l.id);
                          const active = l.id === activeLesson?.id;
                          const order = lessons.findIndex((x) => x.id === l.id) + 1;
                          return (
                            <button
                              key={l.id}
                              onClick={() => goToLesson(l.id)}
                              className={`w-full text-left flex items-start gap-2.5 rounded-lg px-2.5 py-2 transition cursor-pointer ${
                                active ? "bg-stsn-gold/15 border border-stsn-gold/30" : "hover:bg-stone-50 border border-transparent"
                              }`}
                            >
                              <span className="mt-0.5 flex-shrink-0">
                                {done ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                ) : (
                                  <Circle className="w-4 h-4 text-stone-300" />
                                )}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="flex items-center gap-1.5">
                                  <Icon className="w-3 h-3 text-stsn-gold flex-shrink-0" />
                                  <span className={`text-xs font-semibold truncate ${active ? "text-stsn-brown-dark" : "text-stone-700"}`}>
                                    {order}. {l.title}
                                  </span>
                                </span>
                                <span className="text-[10px] text-stone-400 mt-0.5 block">
                                  {l.contentType} • {formatDuration(l.durationMinutes)}
                                </span>
                              </span>
                            </button>
                          );
                        })}
                        {g.lessons.length === 0 && (
                          <p className="text-[10px] text-stone-400 px-2.5 py-2">No lessons in this module yet.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </AppCard>
        </div>
      )}

      {lessonFormOpen && (
        <LessonForm
          lms={lms}
          courseId={course.id}
          onClose={() => setLessonFormOpen(false)}
          onToast={onToast}
        />
      )}
    </div>
  );
}

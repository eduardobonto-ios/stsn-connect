/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import {
  Plus, Pencil, Trash2, Globe, Lock, ArrowLeft, Trash, ClipboardList, GraduationCap,
  CheckCircle2, HelpCircle,
} from "lucide-react";
import AppCard from "../../../../components/common/AppCard";
import AppKpiCard from "../../../../components/common/AppKpiCard";
import AppButton from "../../../../components/common/AppButton";
import AppEmptyState from "../../../../components/common/AppEmptyState";
import AppStatusBadge from "../../../../components/common/AppStatusBadge";
import type { SecurityAction } from "../../../../types/security-permissions.types";
import type { LmsData } from "../../data/useLmsData";
import type { LmsAssessment } from "../../types";
import { ASSESSMENT_TYPE_BADGE, QUESTION_TYPE_LABEL, formatDateTime } from "../shared";
import AssessmentForm from "./AssessmentForm";
import QuestionEditor from "./QuestionEditor";
import GradeDrawer from "./GradeDrawer";

export default function QuestionBuilder({
  lms,
  canPage,
  onToast,
}: {
  lms: LmsData;
  canPage: (page: string, action: SecurityAction) => boolean;
  onToast: (msg: string, type?: "success" | "error") => void;
}) {
  const canCreate = canPage("question-builder", "create");
  const canEdit = canPage("question-builder", "edit");
  const canDelete = canPage("question-builder", "delete");
  const canGrade = canPage("assessments", "manage");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LmsAssessment | null>(null);
  const [questionOpen, setQuestionOpen] = useState(false);
  const [gradeAttemptId, setGradeAttemptId] = useState<string | null>(null);

  const selected = selectedId ? lms.assessmentById(selectedId) : undefined;

  // Grading queue: submitted-but-not-graded attempts (subjective review).
  const gradingQueue = useMemo(
    () => lms.attempts.filter((t) => t.status === "Submitted"),
    [lms.attempts],
  );

  const summary = useMemo(
    () => ({
      total: lms.assessments.length,
      published: lms.assessments.filter((a) => a.status === "Published").length,
      questions: lms.questions.length,
    }),
    [lms.assessments, lms.questions],
  );

  // ── Detail (single assessment) view ─────────────────────────────────────
  if (selectedId && selected) {
    const questions = lms.questionsByAssessment(selected.id);
    return (
      <div className="space-y-4">
        <button onClick={() => setSelectedId(null)} className="flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stsn-brown transition cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Back to Assessments
        </button>

        <AppCard tone="brand" className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${ASSESSMENT_TYPE_BADGE[selected.assessmentType]}`}>{selected.assessmentType}</span>
                <AppStatusBadge status={selected.status} />
              </div>
              <h2 className="text-lg font-display font-black text-stsn-brown-dark">{selected.title}</h2>
              <p className="text-xs text-stone-600 mt-1">{selected.description}</p>
              <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-stone-500">
                <span>{questions.length} questions</span>
                <span>•</span>
                <span>{selected.totalPoints} pts</span>
                <span>•</span>
                <span>Passing {selected.passingScore}%</span>
                {selected.dueDate && (<><span>•</span><span>Due {formatDateTime(selected.dueDate)}</span></>)}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {canEdit && (
                <AppButton
                  variant="secondary"
                  size="sm"
                  leftIcon={selected.status === "Published" ? Lock : Globe}
                  onClick={() => {
                    lms.publishAssessment(selected.id, selected.status !== "Published");
                    onToast(selected.status === "Published" ? "Unpublished." : "Published.");
                  }}
                >
                  {selected.status === "Published" ? "Unpublish" : "Publish"}
                </AppButton>
              )}
              {canCreate && (
                <AppButton variant="primary" size="sm" leftIcon={Plus} onClick={() => setQuestionOpen(true)}>Add Question</AppButton>
              )}
            </div>
          </div>
        </AppCard>

        {questions.length === 0 ? (
          <AppEmptyState icon={ClipboardList} title="No questions yet" description="Add questions to build this assessment." />
        ) : (
          <div className="space-y-2">
            {questions.map((q, i) => (
              <AppCard key={q.id} tone="brand" className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono uppercase tracking-widest text-stsn-gold">{QUESTION_TYPE_LABEL[q.questionType]}</span>
                      <span className="text-[10px] font-mono text-stone-400">{q.points} pt</span>
                    </div>
                    <p className="text-sm font-semibold text-stone-800 mt-1">{i + 1}. {q.questionText}</p>
                    {(q.questionType === "MultipleChoice" || q.questionType === "TrueFalse") && (
                      <ul className="mt-1.5 space-y-0.5">
                        {lms.optionsByQuestion(q.id).map((o) => (
                          <li key={o.id} className={`text-xs ${o.isCorrect ? "text-emerald-700 font-semibold" : "text-stone-500"}`}>
                            {o.isCorrect ? "✓" : "•"} {o.optionText}
                          </li>
                        ))}
                      </ul>
                    )}
                    {q.correctAnswer && (
                      <p className="text-xs text-emerald-700 mt-1">Answer: {q.correctAnswer}</p>
                    )}
                  </div>
                  {canDelete && (
                    <button
                      onClick={() => { lms.deleteQuestion(q.id); onToast("Question removed."); }}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 cursor-pointer flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </AppCard>
            ))}
          </div>
        )}

        {questionOpen && (
          <QuestionEditor lms={lms} assessmentId={selected.id} onClose={() => setQuestionOpen(false)} onToast={onToast} />
        )}
      </div>
    );
  }

  // ── List view ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AppKpiCard label="Assessments" value={summary.total} icon={ClipboardList} tone="brand" hint="All types" />
        <AppKpiCard label="Published" value={summary.published} icon={CheckCircle2} tone="success" hint="Live for students" />
        <AppKpiCard label="Questions" value={summary.questions} icon={HelpCircle} tone="info" hint="In the bank" />
        <AppKpiCard label="To Grade" value={gradingQueue.length} icon={GraduationCap} tone={gradingQueue.length > 0 ? "danger" : "neutral"} hint="Awaiting review" />
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-stone-800">Assessment Management</h3>
        {canCreate && (
          <AppButton variant="primary" size="sm" leftIcon={Plus} onClick={() => { setEditing(null); setFormOpen(true); }}>
            New Assessment
          </AppButton>
        )}
      </div>

      {lms.assessments.length === 0 ? (
        <AppEmptyState icon={ClipboardList} title="No assessments" description="Create your first quiz, exam, or assignment." />
      ) : (
        <div className="bg-white rounded-xl border border-stsn-beige shadow-sm overflow-x-auto">
          <table className="stsn-plain-table">
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Title</th>
                <th style={{ textAlign: "left" }}>Type</th>
                <th style={{ textAlign: "left" }}>Course</th>
                <th>Questions</th>
                <th>Points</th>
                <th style={{ textAlign: "left" }}>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {lms.assessments.map((a) => (
                <tr key={a.id}>
                  <td>
                    <button onClick={() => setSelectedId(a.id)} className="font-semibold text-stone-800 hover:text-stsn-brown cursor-pointer text-left">
                      {a.title}
                    </button>
                  </td>
                  <td>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${ASSESSMENT_TYPE_BADGE[a.assessmentType]}`}>{a.assessmentType}</span>
                  </td>
                  <td className="text-stone-600 max-w-[160px] truncate">{lms.courseById(a.courseId)?.title ?? "—"}</td>
                  <td className="text-center text-stone-500">{lms.questionsByAssessment(a.id).length}</td>
                  <td className="text-center text-stone-500">{a.totalPoints}</td>
                  <td><AppStatusBadge status={a.status} /></td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setSelectedId(a.id)} className="p-1.5 rounded-lg text-stone-400 hover:text-stsn-brown hover:bg-stsn-cream cursor-pointer" title="Manage questions">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {canEdit && (
                        <button
                          onClick={() => { lms.publishAssessment(a.id, a.status !== "Published"); onToast(a.status === "Published" ? "Unpublished." : "Published."); }}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                          title={a.status === "Published" ? "Unpublish" : "Publish"}
                        >
                          {a.status === "Published" ? <Lock className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                        </button>
                      )}
                      {canDelete && (
                        <button onClick={() => { lms.deleteAssessment(a.id); onToast("Assessment deleted."); }} className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 cursor-pointer" title="Delete">
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Grading queue */}
      {canGrade && gradingQueue.length > 0 && (
        <AppCard tone="brand" className="p-5">
          <h3 className="text-sm font-bold text-stone-800 mb-3 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-stsn-gold" /> Awaiting Grading ({gradingQueue.length})
          </h3>
          <div className="space-y-2">
            {gradingQueue.map((t) => {
              const a = lms.assessmentById(t.assessmentId);
              return (
                <div key={t.id} className="flex items-center justify-between gap-3 rounded-xl border border-stone-100 p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-stone-800 truncate">{a?.title ?? "Assessment"}</p>
                    <p className="text-[10px] font-mono text-stone-500">Submitted {formatDateTime(t.submittedAt)} • auto {t.percentage}%</p>
                  </div>
                  <AppButton variant="secondary" size="sm" onClick={() => setGradeAttemptId(t.id)}>Review & Grade</AppButton>
                </div>
              );
            })}
          </div>
        </AppCard>
      )}

      {formOpen && (
        <AssessmentForm lms={lms} assessment={editing} onClose={() => setFormOpen(false)} onToast={onToast} />
      )}
      {gradeAttemptId && (
        <GradeDrawer lms={lms} attemptId={gradeAttemptId} onClose={() => setGradeAttemptId(null)} onToast={onToast} />
      )}
    </div>
  );
}

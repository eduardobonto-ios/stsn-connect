/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared "runner" that drives the Take-Exam and Results drill-in views used by
 * both the Assessments Hub and the Exam Center. Keeps the two list sections
 * free of duplicated attempt/result state wiring.
 */

import React, { useState } from "react";
import type { LmsData } from "../../data/useLmsData";
import type { LmsAssessment } from "../../types";
import TakeExam from "./TakeExam";
import AssessmentResults from "./AssessmentResults";

type RunnerState =
  | { mode: "list" }
  | { mode: "take"; assessmentId: string; attemptId: string }
  | { mode: "result"; assessmentId: string; attemptId: string };

export function useAssessmentRunner(lms: LmsData, onToast: (msg: string, type?: "success" | "error") => void) {
  const [state, setState] = useState<RunnerState>({ mode: "list" });

  const startExam = (assessment: LmsAssessment) => {
    if (!lms.currentStudent) {
      onToast("No student record is linked to this account.", "error");
      return;
    }
    const prior = lms.attemptsFor(assessment.id).length;
    const openAttempt = lms.attemptsFor(assessment.id).find((a) => a.status === "InProgress");
    if (!openAttempt && !assessment.allowRetake && prior >= assessment.maxAttempts) {
      onToast("You have used all attempts for this assessment.", "error");
      return;
    }
    const attempt = lms.startAttempt(assessment.id);
    if (attempt) setState({ mode: "take", assessmentId: assessment.id, attemptId: attempt.id });
  };

  const viewResult = (assessmentId: string, attemptId: string) =>
    setState({ mode: "result", assessmentId, attemptId });

  const exit = () => setState({ mode: "list" });

  return { state, startExam, viewResult, exit };
}

export function AssessmentRunnerView({
  runner,
  lms,
  onToast,
}: {
  runner: ReturnType<typeof useAssessmentRunner>;
  lms: LmsData;
  onToast: (msg: string, type?: "success" | "error") => void;
}) {
  const { state, viewResult, exit, startExam } = runner;
  if (state.mode === "list") return null;

  const assessment = lms.assessmentById(state.assessmentId);
  const attempt = lms.attempts.find((a) => a.id === state.attemptId);
  if (!assessment || !attempt) return null;

  if (state.mode === "take") {
    return (
      <TakeExam
        assessment={assessment}
        attempt={attempt}
        lms={lms}
        onSubmitted={(attemptId) => {
          onToast("Exam submitted.");
          viewResult(assessment.id, attemptId);
        }}
        onExit={exit}
      />
    );
  }

  return (
    <AssessmentResults
      assessment={assessment}
      attempt={attempt}
      lms={lms}
      onBack={exit}
      onRetake={() => startExam(assessment)}
    />
  );
}

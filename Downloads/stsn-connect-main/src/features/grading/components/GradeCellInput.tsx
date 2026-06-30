/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { isScoreInvalid } from "../utils/gradeValidation";

interface GradeCellInputProps {
  score: number | null;
  maxScore: number;
  isReadOnly: boolean;
  onChange: (newScore: number | null) => void;
}

export default function GradeCellInput({
  score,
  maxScore,
  isReadOnly,
  onChange,
}: GradeCellInputProps) {
  const invalid = isScoreInvalid(score, maxScore);

  if (isReadOnly) {
    return (
      <span className={`font-mono text-[11px] font-bold ${invalid ? "text-red-600" : score == null ? "text-stone-300" : "text-stone-700"}`}>
        {score == null ? "—" : score}
      </span>
    );
  }

  return (
    <input
      type="number"
      min={0}
      max={maxScore}
      step={0.5}
      value={score == null ? "" : score}
      placeholder="—"
      onChange={(e) => {
        const raw = e.target.value;
        if (raw === "" || raw === "-") {
          onChange(null);
          return;
        }
        const parsed = parseFloat(raw);
        onChange(Number.isNaN(parsed) ? null : parsed);
      }}
      className={[
        "w-14 text-center text-[11px] font-mono font-bold rounded border py-0.5 px-1",
        "focus:outline-none focus:ring-1",
        invalid
          ? "bg-red-50 border-red-400 text-red-700 focus:ring-red-400"
          : "bg-stone-50 border-stone-200 text-stone-800 focus:ring-stsn-brown",
      ].join(" ")}
    />
  );
}

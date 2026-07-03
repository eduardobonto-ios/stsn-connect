/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Video, FileText, FileIcon, Link2, HelpCircle } from "lucide-react";
import type { AppTone } from "../../../components/common/ui-variants";
import type {
  LmsDifficulty,
  LmsLessonContentType,
  LmsAssessmentType,
  LmsQuestionType,
} from "../types";

/** Short human date, e.g. "Jul 2, 2026". Falls back to em dash. */
export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

/** Short date + time, e.g. "Jul 2, 2026, 3:30 PM". */
export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

/** "mm:ss" from a seconds count (for exam timers). */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** "3h 20m" / "45m" from a minutes count. */
export function formatDuration(minutes?: number | null): string {
  const m = Math.max(0, Math.round(minutes ?? 0));
  if (m === 0) return "—";
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (h === 0) return `${rem}m`;
  if (rem === 0) return `${h}h`;
  return `${h}h ${rem}m`;
}

export const DIFFICULTY_TONE: Record<LmsDifficulty, AppTone> = {
  Beginner: "success",
  Intermediate: "warning",
  Advanced: "danger",
};

export const DIFFICULTY_BADGE: Record<LmsDifficulty, string> = {
  Beginner: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Intermediate: "bg-amber-100 text-amber-700 border-amber-200",
  Advanced: "bg-rose-100 text-rose-700 border-rose-200",
};

export const ASSESSMENT_TYPE_BADGE: Record<LmsAssessmentType, string> = {
  Assignment: "bg-blue-100 text-blue-700 border-blue-200",
  Quiz: "bg-violet-100 text-violet-700 border-violet-200",
  Exam: "bg-rose-100 text-rose-700 border-rose-200",
  Activity: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Project: "bg-amber-100 text-amber-700 border-amber-200",
};

export const QUESTION_TYPE_LABEL: Record<LmsQuestionType, string> = {
  MultipleChoice: "Multiple Choice",
  TrueFalse: "True / False",
  ShortAnswer: "Short Answer",
  Essay: "Essay",
  Identification: "Identification",
};

export const CONTENT_TYPE_ICON: Record<LmsLessonContentType, React.ElementType> = {
  Video: Video,
  Text: FileText,
  Document: FileIcon,
  Link: Link2,
  Quiz: HelpCircle,
};

/** A thin gold/brown progress bar consistent with the app theme. */
export function ProgressBar({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  const pct = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div className={`h-2 w-full rounded-full bg-stone-100 overflow-hidden ${className}`}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-stsn-brown to-stsn-gold transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/**
 * A circular progress ring (donut) using the brand navy→gold gradient.
 * Centre shows the rounded percentage; optional label sits beneath it.
 */
export function ProgressRing({
  value,
  size = 96,
  strokeWidth = 9,
  label,
  centerText,
  trackClassName = "text-stone-100",
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  /** Overrides the default "NN%" centre text. */
  centerText?: React.ReactNode;
  trackClassName?: string;
}) {
  const pct = Math.min(100, Math.max(0, Math.round(value)));
  const gradId = React.useId();
  const radius = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-stsn-brown)" />
            <stop offset="100%" stopColor="var(--color-stsn-gold)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={trackClassName}
          stroke="currentColor"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.7s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center leading-none">
        {centerText ?? <span className="text-xl font-black text-stsn-brown-dark">{pct}%</span>}
        {label && (
          <span className="mt-1 text-[8px] font-mono uppercase tracking-widest text-stone-400">{label}</span>
        )}
      </div>
    </div>
  );
}

/**
 * A responsive SVG line chart with a soft gold area fill — used for trend
 * views such as the GPA trajectory. Auto-scales to `max` (or the data max).
 */
export function LineChart({
  data,
  height = 180,
  max,
  className = "",
}: {
  data: { label: string; value: number }[];
  height?: number;
  /** Upper bound of the value axis (e.g. 4 for a 4.0 GPA scale). */
  max?: number;
  className?: string;
}) {
  const gradId = React.useId();
  if (data.length === 0) return null;

  const W = 600;
  const H = height;
  const padX = 18;
  const padTop = 14;
  const padBottom = 26;
  const maxV = max ?? Math.max(...data.map((d) => d.value), 1);
  const innerW = W - padX * 2;
  const innerH = H - padTop - padBottom;
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;

  const pts = data.map((d, i) => ({
    ...d,
    x: data.length > 1 ? padX + i * stepX : W / 2,
    y: padTop + innerH * (1 - Math.min(1, maxV > 0 ? d.value / maxV : 0)),
  }));

  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const baseline = padTop + innerH;
  const area = `${line} L${pts[pts.length - 1].x.toFixed(1)},${baseline} L${pts[0].x.toFixed(1)},${baseline} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="xMidYMid meet" className={className}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-stsn-gold)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--color-stsn-gold)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {pts.length > 1 && <path d={area} fill={`url(#${gradId})`} />}
      <path
        d={line}
        fill="none"
        stroke="var(--color-stsn-gold)"
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="#fff" stroke="var(--color-stsn-brown)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
      ))}
      {pts.map((p, i) => (
        <text key={`t${i}`} x={p.x} y={H - 8} textAnchor="middle" className="fill-stone-400" style={{ fontSize: 11, fontFamily: "monospace" }}>
          {p.label}
        </text>
      ))}
    </svg>
  );
}

/**
 * A compact vertical bar chart for small "at a glance" trends
 * (e.g. institutional progress by category). Values are 0–100.
 */
export function MiniBarChart({
  data,
  height = 120,
  className = "",
}: {
  data: { label: string; value: number; hint?: string }[];
  height?: number;
  className?: string;
}) {
  if (data.length === 0) return null;
  return (
    <div className={`flex items-end gap-3 ${className}`} style={{ height }}>
      {data.map((d, i) => {
        const pct = Math.min(100, Math.max(0, Math.round(d.value)));
        return (
          <div key={i} className="flex-1 min-w-0 flex flex-col items-center gap-1.5 h-full">
            <div className="flex-1 w-full flex items-end justify-center">
              <div className="relative w-full max-w-[38px] rounded-t-md bg-stone-100 overflow-hidden" style={{ height: "100%" }}>
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-t-md bg-gradient-to-t from-stsn-brown to-stsn-gold transition-all duration-700"
                  style={{ height: `${pct}%` }}
                  title={d.hint ?? `${pct}%`}
                />
              </div>
            </div>
            <span className="text-[9px] font-bold text-stone-500">{pct}%</span>
            <span className="text-[9px] font-mono text-stone-400 truncate w-full text-center" title={d.label}>{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

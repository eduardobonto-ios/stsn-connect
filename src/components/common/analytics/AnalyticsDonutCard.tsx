/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

export interface DonutSlice {
  label: string;
  count: number;
  pct: number;
  colorHex: string;
  colorTw: string;
  textColorTw: string;
  bgTw: string;
  borderTw: string;
}

interface AnalyticsDonutCardProps {
  title: string;
  subtitle?: string;
  total: number;
  slices: DonutSlice[];
  onSliceClick?: (label: string) => void;
}

function DonutSvg({ slices, total }: { slices: DonutSlice[]; total: number }) {
  const size = 110;
  const cx = size / 2;
  const cy = size / 2;
  const r = 38;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * r;
  let prevPct = 0;

  const activeSlices = slices.filter((s) => s.pct > 0);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
      {activeSlices.map((slice, i) => {
        const dashLen = (slice.pct / 100) * circumference;
        const offset = circumference * 0.25 - (prevPct / 100) * circumference;
        prevPct += slice.pct;
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={slice.colorHex}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dashLen} ${circumference - dashLen}`}
            strokeDashoffset={offset}
          />
        );
      })}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="15" fontWeight="700" fill="#1c1917">{total}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="7.5" fill="#a8a29e" fontFamily="monospace">TOTAL</text>
    </svg>
  );
}

export default function AnalyticsDonutCard({
  title,
  subtitle,
  total,
  slices,
  onSliceClick,
}: AnalyticsDonutCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 flex flex-col h-full">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-stone-800 leading-tight">{title}</h3>
        {subtitle && <p className="text-[10px] text-stone-400 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4 mb-4">
        <DonutSvg slices={slices} total={total} />
        <div className="flex-1 space-y-2 min-w-0">
          {slices.map((slice) => (
            <div key={slice.label} className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${slice.colorTw} flex-shrink-0`} />
              <span className="text-[10px] text-stone-600 flex-1 truncate">{slice.label}</span>
              <span className="text-[10px] font-mono font-bold text-stone-700 flex-shrink-0">{slice.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-1.5 flex-1">
        {slices.map((slice) => (
          <button
            key={slice.label}
            type="button"
            onClick={() => onSliceClick?.(slice.label)}
            className={`w-full text-left p-2.5 rounded-xl border ${slice.bgTw} ${slice.borderTw} flex items-center gap-2.5 cursor-pointer hover:shadow-sm hover:-translate-y-px transition-all duration-200`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <span className={`text-[10px] font-semibold ${slice.textColorTw}`}>{slice.label}</span>
                <span className={`text-[10px] font-mono font-bold ${slice.textColorTw}`}>
                  {slice.count} <span className="font-normal text-[9px]">({slice.pct}%)</span>
                </span>
              </div>
              <div className="w-full bg-white/60 rounded-full h-1 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${slice.pct}%`, backgroundColor: slice.colorHex }}
                />
              </div>
            </div>
          </button>
        ))}
      </div>

      <p className="text-[9px] text-stone-400 border-t border-stone-100 pt-3 mt-3 italic">
        Click a row to drill down into student records.
      </p>
    </div>
  );
}

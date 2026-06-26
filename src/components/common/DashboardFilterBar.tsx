/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Search, RotateCcw } from "lucide-react";

export interface FilterSelectOption {
  value: string;
  label: string;
}

export interface FilterSelectConfig {
  id: string;
  label: string;
  value: string;
  options: FilterSelectOption[];
  onChange: (value: string) => void;
  className?: string;
}

export interface DashboardFilterBarProps {
  selects?: FilterSelectConfig[];
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  dateRange?: {
    from: string;
    to: string;
    onFromChange: (value: string) => void;
    onToChange: (value: string) => void;
  };
  onReset?: () => void;
  /** Optional slot for extra actions (e.g. export button) on the right side */
  actions?: React.ReactNode;
  className?: string;
}

export default function DashboardFilterBar({
  selects = [],
  search,
  dateRange,
  onReset,
  actions,
  className = "",
}: DashboardFilterBarProps) {
  return (
    <div
      className={`flex flex-wrap items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 ${className}`}
    >
      {selects.map((sel) => (
        <div key={sel.id} className={`flex flex-col gap-0.5 ${sel.className ?? ""}`}>
          <label
            htmlFor={sel.id}
            className="text-[9px] uppercase font-mono tracking-wider text-stone-400"
          >
            {sel.label}
          </label>
          <select
            id={sel.id}
            value={sel.value}
            onChange={(e) => sel.onChange(e.target.value)}
            className="bg-white border border-stone-200 rounded-lg px-2 py-1 text-xs font-semibold text-stone-700 focus:outline-none focus:ring-1 focus:ring-stsn-brown focus:border-stsn-brown min-w-[120px]"
          >
            {sel.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      ))}

      {dateRange && (
        <>
          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] uppercase font-mono tracking-wider text-stone-400">
              From
            </label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => dateRange.onFromChange(e.target.value)}
              className="bg-white border border-stone-200 rounded-lg px-2 py-1 text-xs font-semibold text-stone-700 focus:outline-none focus:ring-1 focus:ring-stsn-brown focus:border-stsn-brown"
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] uppercase font-mono tracking-wider text-stone-400">
              To
            </label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => dateRange.onToChange(e.target.value)}
              className="bg-white border border-stone-200 rounded-lg px-2 py-1 text-xs font-semibold text-stone-700 focus:outline-none focus:ring-1 focus:ring-stsn-brown focus:border-stsn-brown"
            />
          </div>
        </>
      )}

      {search && (
        <div className="flex flex-col gap-0.5 flex-1 min-w-[160px]">
          <label className="text-[9px] uppercase font-mono tracking-wider text-stone-400">
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-stone-400" />
            <input
              type="text"
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
              placeholder={search.placeholder ?? "Search…"}
              className="w-full bg-white border border-stone-200 rounded-lg pl-6 pr-2 py-1 text-xs font-semibold text-stone-700 focus:outline-none focus:ring-1 focus:ring-stsn-brown focus:border-stsn-brown"
            />
          </div>
        </div>
      )}

      <div className="flex items-end gap-2 ml-auto">
        {onReset && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-[10px] font-semibold text-stone-500 hover:text-stsn-brown bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 transition hover:border-stsn-brown"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        )}
        {actions}
      </div>
    </div>
  );
}

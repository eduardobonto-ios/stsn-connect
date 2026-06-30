/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Lock } from "lucide-react";
import { GradePeriod, GradePeriodLabel } from "../../../types/grading";
import { departmentToAcademicUnit, getGradingPeriods } from "../../../config/grading-schemes.config";

interface GradePeriodSelectorProps {
  department: "Basic Education" | "College";
  periods: GradePeriod[];
  activePeriodId: string;
  onSelect: (periodId: string) => void;
}

export default function GradePeriodSelector({
  department,
  periods,
  activePeriodId,
  onSelect,
}: GradePeriodSelectorProps) {
  const labels: GradePeriodLabel[] = getGradingPeriods(departmentToAcademicUnit(department));

  return (
    <div className="flex flex-wrap gap-1.5">
      {labels.map((label) => {
        const period = periods.find((p) => p.label === label);
        const isActive = period?.id === activePeriodId;
        const isFinalized = period?.isFinalized ?? false;

        return (
          <button
            key={label}
            disabled={!period}
            onClick={() => period && onSelect(period.id)}
            className={[
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide transition cursor-pointer",
              !period
                ? "opacity-40 cursor-not-allowed bg-stone-50 text-stone-300 border border-stone-100"
                : isActive
                  ? "bg-stsn-brown text-stsn-cream border border-stsn-brown shadow-sm"
                  : "bg-white text-stone-600 border border-stone-200 hover:border-stsn-brown hover:text-stsn-brown",
            ].join(" ")}
          >
            {isFinalized && <Lock className="w-3 h-3" />}
            {label}
          </button>
        );
      })}
    </div>
  );
}

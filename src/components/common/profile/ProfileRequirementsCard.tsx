import React from "react";
import { FileCheck } from "lucide-react";
import AppButton from "../AppButton";
import AppCard from "../AppCard";

type RequirementsMetricTone = "brand" | "accent" | "success" | "muted";

interface RequirementsMetric {
  label: string;
  value: number | string;
  tone?: RequirementsMetricTone;
}

interface ProfileRequirementsCardProps {
  title: string;
  description?: string;
  metrics: RequirementsMetric[];
  actionLabel?: string;
  onAction?: () => void;
}

const METRIC_TONE_CLASSES: Record<RequirementsMetricTone, string> = {
  brand: "border-[#0F2744]/12 bg-[linear-gradient(180deg,rgba(10,39,72,0.08)_0%,rgba(255,255,255,0.98)_100%)]",
  accent: "border-[rgba(231,184,47,0.34)] bg-[linear-gradient(180deg,rgba(231,184,47,0.16)_0%,rgba(255,252,242,0.98)_100%)]",
  success: "border-emerald-200 bg-[linear-gradient(180deg,rgba(16,185,129,0.10)_0%,rgba(255,255,255,0.98)_100%)]",
  muted: "border-[var(--erp-border)] bg-white",
};

const METRIC_VALUE_CLASSES: Record<RequirementsMetricTone, string> = {
  brand: "text-[#0A2748]",
  accent: "text-[#7A520A]",
  success: "text-emerald-700",
  muted: "text-[var(--erp-text)]",
};

export default function ProfileRequirementsCard({
  title,
  description,
  metrics,
  actionLabel,
  onAction,
}: ProfileRequirementsCardProps) {
  return (
    <AppCard tone="brand" className="space-y-4">
      <div className="flex items-start gap-3 border-b border-[var(--erp-border)] pb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[rgba(231,184,47,0.28)] bg-[linear-gradient(180deg,rgba(231,184,47,0.18)_0%,rgba(255,255,255,0.96)_100%)] text-[var(--erp-brand)]">
          <FileCheck className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-[var(--erp-text)]">{title}</h4>
          {description ? <p className="mt-1 text-xs text-[var(--erp-text-muted)]">{description}</p> : null}
        </div>
      </div>

      <div className={`grid gap-3 ${metrics.length >= 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}>
        {metrics.map((metric) => {
          const tone = metric.tone ?? "muted";
          return (
            <div key={metric.label} className={`rounded-2xl border p-3 ${METRIC_TONE_CLASSES[tone]}`}>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">{metric.label}</p>
              <p className={`mt-2 text-2xl font-semibold ${METRIC_VALUE_CLASSES[tone]}`}>{metric.value}</p>
            </div>
          );
        })}
      </div>

      {actionLabel && onAction ? (
        <div className="flex justify-start">
          <AppButton type="button" variant="outline" size="sm" onClick={onAction} className="min-w-[152px]">
            {actionLabel}
          </AppButton>
        </div>
      ) : null}
    </AppCard>
  );
}

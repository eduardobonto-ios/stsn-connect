import React from "react";
import { Filter } from "lucide-react";
import AppCard from "../../../components/common/AppCard";
import AppSearchInput from "../../../components/common/AppSearchInput";
import AppSelect from "../../../components/common/AppSelect";
import type { ReportFilterValues, ReportRow } from "../types";

type ReportFilterPanelProps = {
  filters: ReportFilterValues;
  rows: ReportRow[];
  onChange: (filters: ReportFilterValues) => void;
};

function uniqueOptions(rows: ReportRow[], key: string) {
  return Array.from(new Set(rows.map((row) => String(row[key] ?? "")).filter(Boolean))).sort();
}

export default function ReportFilterPanel({ filters, rows, onChange }: ReportFilterPanelProps) {
  const setFilter = (key: keyof ReportFilterValues, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const schoolYears = uniqueOptions(rows, "schoolYear");
  const statuses = uniqueOptions(rows, "status");
  const yearLevels = uniqueOptions(rows, "yearLevel");
  const sections = uniqueOptions(rows, "section");
  const enrollmentTypes = uniqueOptions(rows, "enrollmentType");

  return (
    <AppCard tone="brand" className="border border-[var(--erp-border)]">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--erp-border)] bg-white shadow-sm">
            <Filter className="h-4 w-4 text-[var(--erp-brand)]" />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
              Report Filters
            </p>
            <h3 className="mt-1 text-base font-semibold text-[var(--erp-text)]">Shared Registrar Filters</h3>
            <p className="mt-1 text-xs leading-relaxed text-[var(--erp-text-muted)]">
              These filters only refine the displayed report rows and keep report logic unchanged.
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--erp-border)] bg-white px-4 py-3 shadow-sm">
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
            Filter Seed Rows
          </p>
          <p className="mt-1 text-lg font-semibold text-[var(--erp-text)]">{rows.length}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <label className="md:col-span-2 xl:col-span-2">
          <span className="block text-[10px] uppercase font-mono text-[var(--erp-text-muted)] mb-1">
            Search
          </span>
          <AppSearchInput
            value={filters.search}
            onChange={(event) => setFilter("search", event.target.value)}
            placeholder="Student no., name, section"
            uiSize="sm"
          />
        </label>
        <label>
          <span className="block text-[10px] uppercase font-mono text-[var(--erp-text-muted)] mb-1">
            School Year
          </span>
          <AppSelect value={filters.schoolYear} onChange={(event) => setFilter("schoolYear", event.target.value)} uiSize="sm">
            <option>All</option>
            {schoolYears.map((option) => <option key={option}>{option}</option>)}
          </AppSelect>
        </label>
        <label>
          <span className="block text-[10px] uppercase font-mono text-[var(--erp-text-muted)] mb-1">
            Status
          </span>
          <AppSelect value={filters.status} onChange={(event) => setFilter("status", event.target.value)} uiSize="sm">
            <option>All</option>
            {statuses.map((option) => <option key={option}>{option}</option>)}
          </AppSelect>
        </label>
        <label>
          <span className="block text-[10px] uppercase font-mono text-[var(--erp-text-muted)] mb-1">
            Year Level
          </span>
          <AppSelect value={filters.yearLevel} onChange={(event) => setFilter("yearLevel", event.target.value)} uiSize="sm">
            <option>All</option>
            {yearLevels.map((option) => <option key={option}>{option}</option>)}
          </AppSelect>
        </label>
        <label>
          <span className="block text-[10px] uppercase font-mono text-[var(--erp-text-muted)] mb-1">
            Section / Type
          </span>
          <AppSelect
            value={filters.section !== "All" ? filters.section : filters.enrollmentType}
            onChange={(event) => {
              const value = event.target.value;
              if (enrollmentTypes.includes(value)) onChange({ ...filters, enrollmentType: value, section: "All" });
              else onChange({ ...filters, section: value, enrollmentType: "All" });
            }}
            uiSize="sm"
          >
            <option>All</option>
            {sections.map((option) => <option key={`section-${option}`}>{option}</option>)}
            {enrollmentTypes.map((option) => <option key={`type-${option}`}>{option}</option>)}
          </AppSelect>
        </label>
      </div>
    </AppCard>
  );
}

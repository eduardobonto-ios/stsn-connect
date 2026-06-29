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
    <AppCard className="border border-stsn-beige">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-4 h-4 text-stsn-gold" />
        <h3 className="text-sm font-black text-stsn-brown uppercase">Report Filters</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <label className="md:col-span-2 xl:col-span-2">
          <span className="block text-[10px] uppercase font-mono text-stone-400 mb-1">Search</span>
          <AppSearchInput
            value={filters.search}
            onChange={(event) => setFilter("search", event.target.value)}
            placeholder="Student no., name, section"
            uiSize="sm"
          />
        </label>
        <label>
          <span className="block text-[10px] uppercase font-mono text-stone-400 mb-1">School Year</span>
          <AppSelect value={filters.schoolYear} onChange={(event) => setFilter("schoolYear", event.target.value)} uiSize="sm">
            <option>All</option>
            {schoolYears.map((option) => <option key={option}>{option}</option>)}
          </AppSelect>
        </label>
        <label>
          <span className="block text-[10px] uppercase font-mono text-stone-400 mb-1">Status</span>
          <AppSelect value={filters.status} onChange={(event) => setFilter("status", event.target.value)} uiSize="sm">
            <option>All</option>
            {statuses.map((option) => <option key={option}>{option}</option>)}
          </AppSelect>
        </label>
        <label>
          <span className="block text-[10px] uppercase font-mono text-stone-400 mb-1">Year Level</span>
          <AppSelect value={filters.yearLevel} onChange={(event) => setFilter("yearLevel", event.target.value)} uiSize="sm">
            <option>All</option>
            {yearLevels.map((option) => <option key={option}>{option}</option>)}
          </AppSelect>
        </label>
        <label>
          <span className="block text-[10px] uppercase font-mono text-stone-400 mb-1">Section / Type</span>
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

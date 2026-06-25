/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import { Award, ToggleLeft, ToggleRight } from "lucide-react";
import { useSTSNStore } from "../../../../services/store";
import STSNDataTable, { type STSNColumn } from "../../../../components/common/STSNDataTable";
import { BenefitPlan, StatutoryContributionRule } from "../../../../types";

const CATEGORY_COLORS: Record<string, string> = {
  Statutory: "bg-blue-100 text-blue-700",
  "Company Benefit": "bg-emerald-100 text-emerald-700",
  Allowance: "bg-amber-100 text-amber-700",
  Deduction: "bg-red-100 text-red-700",
};

function formatShare(type: string, value: number): string {
  if (type === "Fixed") return `PHP ${value.toLocaleString()}`;
  if (type === "Percentage") return `${value}%`;
  return "Configured";
}

export default function BenefitsPage() {
  const { benefitPlans, statutoryContributionRules, toggleBenefitPlanActive } = useSTSNStore();
  const [filterCategory, setFilterCategory] = useState("All");

  const categories = ["All", "Statutory", "Company Benefit", "Allowance", "Deduction"] as const;
  const filtered = filterCategory === "All"
    ? benefitPlans
    : benefitPlans.filter((benefit) => benefit.category === filterCategory);
  const activeCount = benefitPlans.filter((benefit) => benefit.isActive).length;
  const benefitPlanMap = useMemo(() => new Map(benefitPlans.map((plan) => [plan.id, plan])), [benefitPlans]);

  const columns: STSNColumn<BenefitPlan>[] = [
    { title: "Code", data: "code", render: (value) => <span className="font-mono text-xs font-bold text-stsn-brown">{value}</span>, width: "90px" },
    { title: "Name", data: "name", render: (value) => <span className="text-xs font-semibold">{value}</span> },
    {
      title: "Category",
      data: "category",
      render: (value) => <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${CATEGORY_COLORS[value] ?? "bg-gray-100 text-gray-600"}`}>{value}</span>,
      width: "120px",
    },
    {
      title: "Employee Share",
      render: (_, row) => (
        <span className="text-xs text-stone-600">
          {formatShare(row.employeeShareType, row.employeeShareValue)}
          <span className="text-[10px] text-stone-400 ml-1">({row.employeeShareType})</span>
        </span>
      ),
      width: "140px",
    },
    {
      title: "Employer Share",
      render: (_, row) => (
        <span className="text-xs text-stone-600">
          {formatShare(row.employerShareType, row.employerShareValue)}
          <span className="text-[10px] text-stone-400 ml-1">({row.employerShareType})</span>
        </span>
      ),
      width: "140px",
    },
    {
      title: "Taxable",
      data: "isTaxable",
      render: (value) => <span className={`text-[10px] font-semibold ${value ? "text-amber-600" : "text-stone-400"}`}>{value ? "Yes" : "No"}</span>,
      width: "65px",
    },
    {
      title: "Status",
      data: "isActive",
      render: (value, row) => (
        <button
          onClick={(event) => { event.stopPropagation(); toggleBenefitPlanActive(row.id); }}
          className="flex items-center gap-1 cursor-pointer"
        >
          {value
            ? <><ToggleRight className="w-5 h-5 text-emerald-500" /><span className="text-[10px] text-emerald-600 font-semibold">Active</span></>
            : <><ToggleLeft className="w-5 h-5 text-stone-300" /><span className="text-[10px] text-stone-400">Inactive</span></>}
        </button>
      ),
      width: "90px",
    },
  ];

  const statutoryRuleColumns: STSNColumn<StatutoryContributionRule>[] = [
    {
      title: "Plan",
      render: (_, row) => {
        const plan = benefitPlanMap.get(row.benefitPlanId);
        return <span className="text-xs font-semibold text-stone-800">{plan?.name ?? row.benefitPlanId}</span>;
      },
    },
    { title: "Year", data: "effectiveYear", render: (value) => <span className="font-mono text-xs text-stsn-brown">{value}</span>, width: "70px" },
    {
      title: "Salary Range",
      render: (_, row) => (
        <span className="font-mono text-xs text-stone-600">
          PHP {row.minSalary.toLocaleString()} - {row.maxSalary != null ? row.maxSalary.toLocaleString() : "above"}
        </span>
      ),
    },
    {
      title: "Employee Share",
      render: (_, row) => (
        <span className="text-xs text-stone-600">
          {row.employeeFixed > 0 ? `PHP ${row.employeeFixed.toLocaleString()}` : `${(row.employeeRate * 100).toFixed(2)}%`}
        </span>
      ),
      width: "130px",
    },
    {
      title: "Employer Share",
      render: (_, row) => (
        <span className="text-xs text-stone-600">
          {row.employerFixed > 0 ? `PHP ${row.employerFixed.toLocaleString()}` : `${(row.employerRate * 100).toFixed(2)}%`}
        </span>
      ),
      width: "130px",
    },
    { title: "Notes", data: "notes", render: (value) => <span className="text-xs text-stone-400">{value ?? "Effective-dated statutory rule"}</span> },
  ];

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-white border border-stsn-beige rounded-xl shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-display font-semibold text-stone-900 tracking-tight flex items-center gap-2">
            <Award className="w-5 h-5 text-stsn-brown" />
            Benefits
          </h2>
          <p className="text-stone-500 text-xs mt-1">Mandatory statutory and company benefit plan definitions.</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-display font-bold text-stsn-brown">{activeCount}</p>
          <p className="text-[10px] text-stone-400 uppercase font-mono tracking-wider">Active Plans</p>
        </div>
      </div>

      <div className="flex gap-1 bg-stone-100 p-1 rounded-xl w-fit flex-wrap">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setFilterCategory(category)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${filterCategory === category ? "bg-white text-stsn-brown shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
          >
            {category} {category !== "All" && <span className="text-stone-400">({benefitPlans.filter((benefit) => benefit.category === category).length})</span>}
          </button>
        ))}
      </div>

      <div className="bg-white border border-stsn-beige rounded-xl shadow-sm overflow-hidden p-1">
        <STSNDataTable<BenefitPlan>
          columns={columns}
          rows={filtered}
          emptyMessage="No benefit plans configured."
          pageLength={15}
        />
      </div>

      <div className="bg-white border border-stsn-beige rounded-xl shadow-sm overflow-hidden p-1">
        <div className="px-4 py-3 border-b border-stone-100">
          <p className="text-sm font-bold text-stone-900">Effective-Dated Statutory Contribution Rules</p>
          <p className="text-xs text-stone-500 mt-0.5">
            Payroll computation reads these rules first, then falls back to simplified defaults only when no active configured rule matches.
          </p>
        </div>
        <STSNDataTable<StatutoryContributionRule>
          columns={statutoryRuleColumns}
          rows={statutoryContributionRules}
          emptyMessage="No statutory contribution rules configured yet."
          pageLength={10}
        />
      </div>

      <div className="bg-stsn-cream border border-stsn-beige rounded-xl p-4 text-xs text-stone-600">
        <p className="font-semibold mb-1">Configuration Note</p>
        <p className="text-stone-500">
          Keep SSS, PhilHealth, Pag-IBIG, and other statutory contribution changes in effective-dated rule rows. Avoid changing React components for annual government schedule updates.
        </p>
      </div>
    </div>
  );
}

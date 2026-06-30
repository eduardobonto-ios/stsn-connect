/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import { Award, ToggleLeft, ToggleRight } from "lucide-react";
import { useSTSNStore } from "../../../../services/store";
import AppTable, { type AppTableColumn } from "../../../../components/common/AppTable";
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

  const columns: AppTableColumn<BenefitPlan>[] = [
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ getValue }) => <span className="font-mono text-xs font-bold text-stsn-brown">{String(getValue())}</span>,
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ getValue }) => <span className="text-xs font-semibold">{String(getValue())}</span>,
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ getValue }) => {
        const value = String(getValue());
        return <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${CATEGORY_COLORS[value] ?? "bg-gray-100 text-gray-600"}`}>{value}</span>;
      },
    },
    {
      id: "employeeShare",
      header: "Employee Share",
      cell: ({ row }) => (
        <span className="text-xs text-stone-600">
          {formatShare(row.original.employeeShareType, row.original.employeeShareValue)}
          <span className="text-[10px] text-stone-400 ml-1">({row.original.employeeShareType})</span>
        </span>
      ),
    },
    {
      id: "employerShare",
      header: "Employer Share",
      cell: ({ row }) => (
        <span className="text-xs text-stone-600">
          {formatShare(row.original.employerShareType, row.original.employerShareValue)}
          <span className="text-[10px] text-stone-400 ml-1">({row.original.employerShareType})</span>
        </span>
      ),
    },
    {
      accessorKey: "isTaxable",
      header: "Taxable",
      cell: ({ getValue }) => {
        const value = getValue<boolean>();
        return <span className={`text-[10px] font-semibold ${value ? "text-amber-600" : "text-stone-400"}`}>{value ? "Yes" : "No"}</span>;
      },
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ getValue, row }) => (
        <button
          type="button"
          onClick={(event) => { event.stopPropagation(); toggleBenefitPlanActive(row.original.id); }}
          className="flex items-center gap-1 cursor-pointer"
        >
          {getValue<boolean>()
            ? <><ToggleRight className="w-5 h-5 text-emerald-500" /><span className="text-[10px] text-emerald-600 font-semibold">Active</span></>
            : <><ToggleLeft className="w-5 h-5 text-stone-300" /><span className="text-[10px] text-stone-400">Inactive</span></>}
        </button>
      ),
    },
  ];

  const statutoryRuleColumns: AppTableColumn<StatutoryContributionRule>[] = [
    {
      accessorKey: "benefitPlanId",
      header: "Plan",
      cell: ({ row }) => {
        const plan = benefitPlanMap.get(row.original.benefitPlanId);
        return <span className="text-xs font-semibold text-stone-800">{plan?.name ?? row.original.benefitPlanId}</span>;
      },
    },
    {
      accessorKey: "effectiveYear",
      header: "Year",
      cell: ({ getValue }) => <span className="font-mono text-xs text-stsn-brown">{String(getValue())}</span>,
    },
    {
      id: "salaryRange",
      header: "Salary Range",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-stone-600">
          PHP {row.original.minSalary.toLocaleString()} - {row.original.maxSalary != null ? row.original.maxSalary.toLocaleString() : "above"}
        </span>
      ),
    },
    {
      id: "employeeShare",
      header: "Employee Share",
      cell: ({ row }) => (
        <span className="text-xs text-stone-600">
          {row.original.employeeFixed > 0 ? `PHP ${row.original.employeeFixed.toLocaleString()}` : `${(row.original.employeeRate * 100).toFixed(2)}%`}
        </span>
      ),
    },
    {
      id: "employerShare",
      header: "Employer Share",
      cell: ({ row }) => (
        <span className="text-xs text-stone-600">
          {row.original.employerFixed > 0 ? `PHP ${row.original.employerFixed.toLocaleString()}` : `${(row.original.employerRate * 100).toFixed(2)}%`}
        </span>
      ),
    },
    {
      accessorKey: "notes",
      header: "Notes",
      cell: ({ getValue }) => <span className="text-xs text-stone-400">{getValue<string | undefined>() ?? "Effective-dated statutory rule"}</span>,
    },
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

      <AppTable<BenefitPlan>
        data={filtered}
        columns={columns}
        title="Benefit Plans"
        emptyMessage="No benefit plans configured."
        emptyDescription="Adjust the search or category filter to find benefit plans."
        loading={false}
        enableColumnVisibility={false}
        initialPageSize={15}
        pageSizeOptions={[15]}
        getRowId={(row) => row.id}
      />

      <AppTable<StatutoryContributionRule>
        data={statutoryContributionRules}
        columns={statutoryRuleColumns}
        title="Statutory Contribution Rules"
        description="Payroll computation reads these rules first, then falls back to simplified defaults only when no active configured rule matches."
        emptyMessage="No statutory contribution rules configured yet."
        emptyDescription="Add effective-dated rules to drive statutory payroll computation."
        loading={false}
        enableColumnVisibility={false}
        initialPageSize={10}
        pageSizeOptions={[10]}
        getRowId={(row) => row.id}
      />

      <div className="bg-stsn-cream border border-stsn-beige rounded-xl p-4 text-xs text-stone-600">
        <p className="font-semibold mb-1">Configuration Note</p>
        <p className="text-stone-500">
          Keep SSS, PhilHealth, Pag-IBIG, and other statutory contribution changes in effective-dated rule rows. Avoid changing React components for annual government schedule updates.
        </p>
      </div>
    </div>
  );
}

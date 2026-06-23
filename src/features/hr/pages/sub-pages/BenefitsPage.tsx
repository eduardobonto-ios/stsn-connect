/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Award, ToggleLeft, ToggleRight } from "lucide-react";
import { useSTSNStore } from "../../../../services/store";
import STSNDataTable, { type STSNColumn } from "../../../../components/common/STSNDataTable";
import { BenefitPlan } from "../../../../types";

const CATEGORY_COLORS: Record<string, string> = {
  Statutory: "bg-blue-100 text-blue-700",
  "Company Benefit": "bg-emerald-100 text-emerald-700",
  Allowance: "bg-amber-100 text-amber-700",
  Deduction: "bg-red-100 text-red-700",
};

function formatShare(type: string, value: number): string {
  if (type === "Fixed") return `₱${value.toLocaleString()}`;
  if (type === "Percentage") return `${value}%`;
  return "Configured";
}

export default function BenefitsPage() {
  const { benefitPlans, toggleBenefitPlanActive } = useSTSNStore();
  const [filterCategory, setFilterCategory] = useState("All");

  const categories = ["All", "Statutory", "Company Benefit", "Allowance", "Deduction"] as const;

  const filtered = filterCategory === "All"
    ? benefitPlans
    : benefitPlans.filter((b) => b.category === filterCategory);

  const activeCount = benefitPlans.filter((b) => b.isActive).length;

  const columns: STSNColumn<BenefitPlan>[] = [
    { title: "Code", data: "code", render: (v) => <span className="font-mono text-xs font-bold text-stsn-brown">{v}</span>, width: "90px" },
    { title: "Name", data: "name", render: (v) => <span className="text-xs font-semibold">{v}</span> },
    {
      title: "Category",
      data: "category",
      render: (v) => <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${CATEGORY_COLORS[v] ?? "bg-gray-100 text-gray-600"}`}>{v}</span>,
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
      render: (v) => <span className={`text-[10px] font-semibold ${v ? "text-amber-600" : "text-stone-400"}`}>{v ? "Yes" : "No"}</span>,
      width: "65px",
    },
    {
      title: "Status",
      data: "isActive",
      render: (v, row) => (
        <button
          onClick={(e) => { e.stopPropagation(); toggleBenefitPlanActive(row.id); }}
          className="flex items-center gap-1 cursor-pointer"
        >
          {v
            ? <><ToggleRight className="w-5 h-5 text-emerald-500" /><span className="text-[10px] text-emerald-600 font-semibold">Active</span></>
            : <><ToggleLeft className="w-5 h-5 text-stone-300" /><span className="text-[10px] text-stone-400">Inactive</span></>}
        </button>
      ),
      width: "90px",
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

      {/* Category filter tabs */}
      <div className="flex gap-1 bg-stone-100 p-1 rounded-xl w-fit flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${filterCategory === cat ? "bg-white text-stsn-brown shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
          >
            {cat} {cat !== "All" && <span className="text-stone-400">({benefitPlans.filter((b) => b.category === cat).length})</span>}
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

      {/* Info block */}
      <div className="bg-stsn-cream border border-stsn-beige rounded-xl p-4 text-xs text-stone-600">
        <p className="font-semibold mb-1">Statutory Benefits Reference</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
          {[
            { name: "SSS", rate: "4.5% employee, 9.5% employer (2024)", cap: "₱30,000 MSC" },
            { name: "PhilHealth", rate: "2.5% employee, 2.5% employer", cap: "₱100,000 monthly" },
            { name: "Pag-IBIG", rate: "₱100/month employee", cap: "₱5,000 monthly salary cap" },
          ].map((b) => (
            <div key={b.name} className="bg-white rounded-lg p-3 border border-stone-100">
              <p className="font-bold text-stsn-brown">{b.name}</p>
              <p className="text-stone-500 mt-0.5">{b.rate}</p>
              <p className="text-stone-400 text-[10px] mt-0.5">Cap: {b.cap}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

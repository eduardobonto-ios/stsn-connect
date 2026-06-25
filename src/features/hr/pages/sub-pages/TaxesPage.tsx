/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import { Percent, ChevronDown, ChevronRight } from "lucide-react";
import { useSTSNStore } from "../../../../services/store";
import { TaxTable, TaxBracket } from "../../../../types";

function BracketTable({ brackets }: { brackets: TaxBracket[] }) {
  const sorted = [...brackets].sort((a, b) => a.incomeFrom - b.incomeFrom);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-stone-50 border-b border-stone-100">
            <th className="text-left px-3 py-2 text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Income From</th>
            <th className="text-left px-3 py-2 text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Income To</th>
            <th className="text-left px-3 py-2 text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Base Tax</th>
            <th className="text-left px-3 py-2 text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Rate on Excess</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((bracket, index) => (
            <tr key={bracket.id ?? index} className="border-b border-stone-50 hover:bg-stone-50">
              <td className="px-3 py-2 font-mono text-stone-700">PHP {bracket.incomeFrom.toLocaleString()}</td>
              <td className="px-3 py-2 font-mono text-stone-700">{bracket.incomeTo != null ? `PHP ${bracket.incomeTo.toLocaleString()}` : "and above"}</td>
              <td className="px-3 py-2 font-mono text-stone-700">PHP {bracket.baseTax.toLocaleString()}</td>
              <td className="px-3 py-2 font-mono text-stone-700">{(bracket.rateAbove * 100).toFixed(2)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const TaxTableCard: React.FC<{ table: TaxTable }> = ({ table }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-white border border-stsn-beige rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded((previous) => !previous)}
        className="w-full flex items-center justify-between p-4 hover:bg-stone-50 cursor-pointer transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          {expanded ? <ChevronDown className="w-4 h-4 text-stone-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-stone-400 shrink-0" />}
          <div>
            <p className="text-sm font-bold text-stone-800">{table.name}</p>
            <p className="text-xs text-stone-400">{table.effectiveYear} / {table.frequency} / {table.brackets?.length ?? 0} bracket(s)</p>
          </div>
        </div>
        {table.isActive && (
          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">Active</span>
        )}
      </button>
      {expanded && table.brackets && table.brackets.length > 0 && (
        <div className="border-t border-stone-100">
          <BracketTable brackets={table.brackets} />
        </div>
      )}
      {expanded && (!table.brackets || table.brackets.length === 0) && (
        <div className="border-t border-stone-100 p-4 text-xs text-stone-400 text-center">No brackets defined for this tax table.</div>
      )}
    </div>
  );
};

export default function TaxesPage() {
  const { taxTables } = useSTSNStore();
  const [filterYear, setFilterYear] = useState("All");

  const allTables = useMemo(() => taxTables, [taxTables]);
  const years = useMemo(() => {
    const resolvedYears = Array.from(new Set(allTables.map((table) => String(table.effectiveYear)))).sort((a, b) => Number(b) - Number(a));
    return ["All", ...resolvedYears];
  }, [allTables]);

  const filtered = filterYear === "All" ? allTables : allTables.filter((table) => String(table.effectiveYear) === filterYear);

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-white border border-stsn-beige rounded-xl shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-display font-semibold text-stone-900 tracking-tight flex items-center gap-2">
            <Percent className="w-5 h-5 text-stsn-brown" />
            Taxes
          </h2>
          <p className="text-stone-500 text-xs mt-1">Withholding tax tables used during payroll computation.</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-display font-bold text-stsn-brown">{allTables.length}</p>
          <p className="text-[10px] text-stone-400 uppercase font-mono tracking-wider">Tax Table(s)</p>
        </div>
      </div>

      <div className="flex gap-1 bg-stone-100 p-1 rounded-xl w-fit">
        {years.map((year) => (
          <button
            key={year}
            onClick={() => setFilterYear(year)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${filterYear === year ? "bg-white text-stsn-brown shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
          >
            {year}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0
          ? <div className="bg-white border border-stsn-beige rounded-xl p-12 text-center"><p className="text-sm text-stone-400">No configured tax tables for this year.</p></div>
          : filtered.map((table) => <TaxTableCard key={table.id} table={table} />)
        }
      </div>

      <div className="bg-stsn-cream border border-stsn-beige rounded-xl p-4 text-xs text-stone-600">
        <p className="font-semibold mb-1">Configuration Note</p>
        <p className="text-stone-500">
          Maintain BIR withholding tax tables as effective-dated configuration rows. Payroll computation uses configured brackets first and only falls back to simplified safety logic when no active table is available.
        </p>
      </div>
    </div>
  );
}

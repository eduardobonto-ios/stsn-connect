/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import { useSTSNStore } from "../../../services/store";
import {
  Banknote, Clock, FileText, AlertTriangle, Download, CheckCircle2,
} from "lucide-react";
import AnalyticsDashboardShell from "../../../components/common/analytics/AnalyticsDashboardShell";
import { CHART_SERIES_COLORS, CHART_THEME } from "../../../config/chart-theme.config";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const DEPT_PALETTE = [
  { hex: CHART_THEME.brand,   tw: "bg-stsn-brown",  light: "bg-stsn-cream", text: "text-stsn-brown",  border: "border-stsn-beige" },
  { hex: CHART_THEME.success, tw: "bg-emerald-500", light: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  { hex: CHART_THEME.info,    tw: "bg-blue-500",    light: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200" },
  { hex: CHART_THEME.warning, tw: "bg-amber-500",   light: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200" },
  { hex: CHART_THEME.neutral, tw: "bg-stone-500",   light: "bg-stone-50",   text: "text-stone-700",   border: "border-stone-200" },
  { hex: CHART_THEME.danger,  tw: "bg-red-500",     light: "bg-red-50",     text: "text-red-700",     border: "border-red-200" },
];

function DonutChart({
  slices,
  total,
}: {
  slices: { label: string; pct: number; hex: string }[];
  total: number;
}) {
  const size = 130;
  const cx = size / 2;
  const cy = size / 2;
  const r = 44;
  const sw = 20;
  const circ = 2 * Math.PI * r;
  let prev = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={CHART_SERIES_COLORS[7]} strokeOpacity="0.18" strokeWidth={sw} />
      {slices.filter((s) => s.pct > 0).map((s, i) => {
        const dash = (s.pct / 100) * circ;
        const offset = circ * 0.25 - (prev / 100) * circ;
        prev += s.pct;
        return (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.hex}
            strokeWidth={sw} strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={offset} />
        );
      })}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="9" fill={CHART_THEME.neutral} fontFamily="monospace">Total</text>
      <text x={cx} y={cy + 7} textAnchor="middle" fontSize="11" fontWeight="700" fill={CHART_THEME.brand}>
        ₱{(total / 1000).toFixed(0)}K
      </text>
    </svg>
  );
}

export default function PayrollDashboardPage() {
  const { employees, activeSchool } = useSTSNStore();
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [periodView, setPeriodView] = useState<"monthly" | "quarterly">("monthly");
  const [activeKpi, setActiveKpi] = useState("Total Payroll Processed");
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [reportReady, setReportReady] = useState(false);
  const currentMonth = new Date().getMonth();

  const scopedEmployees = useMemo(
    () => (activeSchool === "ALL" ? employees : employees.filter((e) => e.schoolId === activeSchool)),
    [employees, activeSchool],
  );

  const headcount = scopedEmployees.length || 24;
  const avgSalary = 25000;
  const totalPayroll = headcount * avgSalary;

  const monthlyData = useMemo(() => {
    return MONTHS.map((_, i) => {
      const variance = 0.78 + Math.sin(i * 0.85 + 0.3) * 0.18 + (i === currentMonth ? 0.12 : 0);
      return Math.round(totalPayroll * variance);
    });
  }, [totalPayroll, currentMonth]);

  const displayedMonthlyData = periodView === "quarterly"
    ? monthlyData.map((_, i) => {
      const quarterStart = Math.floor(i / 3) * 3;
      const quarterTotal = monthlyData
        .slice(quarterStart, quarterStart + 3)
        .reduce((sum, monthValue) => sum + monthValue, 0);
      return Math.round(quarterTotal / 3);
    })
    : monthlyData;
  const maxBar = Math.max(...displayedMonthlyData, 1);

  const deptSalaries = useMemo(() => {
    const grouped: Record<string, number> = {};
    scopedEmployees.forEach((e) => {
      const dept = (e as { department?: string }).department ?? "Admin";
      grouped[dept] = (grouped[dept] ?? 0) + ((e as { salary?: number }).salary ?? avgSalary);
    });
    if (Object.keys(grouped).length === 0) {
      Object.assign(grouped, { Teaching: 55000, Admin: 50000, Finance: 40000, HR: 35000, IT: 45000, Others: 25000 });
    }
    const total = Object.values(grouped).reduce((s, v) => s + v, 0) || 1;
    return Object.entries(grouped)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([label, salary], i) => ({
        label,
        salary,
        pct: Math.round((salary / total) * 100),
        ...DEPT_PALETTE[i % DEPT_PALETTE.length],
      }));
  }, [scopedEmployees]);

  const highestDept = deptSalaries[0];
  const lowestDept = deptSalaries[deptSalaries.length - 1];
  const totalDeptSalary = deptSalaries.reduce((s, d) => s + d.salary, 0);
  const monthAmount = displayedMonthlyData[selectedMonth] ?? 0;
  const monthBreakdown = [
    { label: "Base Salary", ratio: 0.45, color: "bg-emerald-500" },
    { label: "Overtime Pay", ratio: 0.35, color: "bg-blue-500" },
    { label: "Bonuses", ratio: 0.20, color: "bg-amber-500" },
  ];
  const selectedDeptData = deptSalaries.find((d) => d.label === selectedDept) ?? highestDept;

  const kpis = [
    {
      label: "Total Payroll Processed",
      value: `₱${totalPayroll.toLocaleString()}`,
      sub: "Total salary paid this period",
      icon: <Banknote className="w-5 h-5" />,
      bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800",
      chip: "bg-emerald-100", iconColor: "text-emerald-700", accent: "bg-emerald-600",
    },
    {
      label: "Payroll on Time Rate",
      value: "97%",
      sub: "Payrolls processed without delay",
      icon: <Clock className="w-5 h-5" />,
      bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800",
      chip: "bg-blue-100", iconColor: "text-blue-700", accent: "bg-blue-600",
    },
    {
      label: "Payslips Issued",
      value: "98%",
      sub: "Payslips generated and sent",
      icon: <FileText className="w-5 h-5" />,
      bg: "bg-stsn-cream", border: "border-stsn-beige", text: "text-stsn-brown",
      chip: "bg-white border border-stsn-beige", iconColor: "text-stsn-brown", accent: "bg-stsn-brown",
    },
    {
      label: "Payroll Error Rate",
      value: "2%",
      sub: "Transactions with errors or discrepancies",
      icon: <AlertTriangle className="w-5 h-5" />,
      bg: "bg-red-50", border: "border-red-200", text: "text-red-800",
      chip: "bg-red-100", iconColor: "text-red-700", accent: "bg-red-600",
    },
  ];
  const activeKpiData = kpis.find((kpi) => kpi.label === activeKpi) ?? kpis[0];

  return (
    <AnalyticsDashboardShell
      title="Payroll Analytics Dashboard"
      badge="Admin Only"
      subtitle="Payroll processing metrics, salary breakdown, and expense analytics."
      meta={
        <div className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-center min-w-[108px]">
          <span className="text-[9px] text-stone-400 uppercase block font-mono tracking-wider">Period</span>
          <span className="text-sm font-bold text-stone-900 mt-0.5 block">
            {new Date().toLocaleString("en-PH", { month: "long", year: "numeric" })}
          </span>
        </div>
      }
    >
      {/* ── KPI Row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <button
            key={kpi.label}
            type="button"
            onClick={() => setActiveKpi(kpi.label)}
            className={`relative overflow-hidden rounded-2xl border ${kpi.bg} ${kpi.border} p-5 flex flex-col gap-3 shadow-sm text-left transition hover:-translate-y-0.5 hover:shadow-md ${
              activeKpi === kpi.label ? "ring-2 ring-stsn-brown/25" : ""
            }`}
          >
            <div className={`absolute inset-x-0 top-0 h-1 ${kpi.accent}`} />
            <div className="flex items-start justify-between gap-2">
              <span className="text-[11px] font-semibold text-stone-500 leading-tight">{kpi.label}</span>
              <div className={`w-10 h-10 rounded-xl ${kpi.chip} flex items-center justify-center flex-shrink-0`}>
                <span className={kpi.iconColor}>{kpi.icon}</span>
              </div>
            </div>
            <div>
              <span className={`text-2xl font-display font-bold ${kpi.text} leading-none`}>{kpi.value}</span>
              <span className="text-[10px] font-mono text-stone-400 block mt-1">{kpi.sub}</span>
            </div>
          </button>
        ))}
      </div>

      {/* ── Charts Row ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-[9px] font-mono uppercase tracking-widest text-stone-400">Focused Metric</p>
          <p className="text-sm font-bold text-stone-900 mt-1">{activeKpiData.label}</p>
          <p className="text-[11px] text-stone-500">{activeKpiData.sub}</p>
        </div>
        <div className="flex items-center gap-2">
          {(["monthly", "quarterly"] as const).map((view) => (
            <button
              key={view}
              type="button"
              onClick={() => setPeriodView(view)}
              className={`px-3 py-2 rounded-lg border text-[10px] font-mono uppercase transition ${
                periodView === view
                  ? "bg-stsn-brown text-white border-stsn-brown"
                  : "bg-white text-stone-500 border-stone-200 hover:bg-stone-50"
              }`}
            >
              {view}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Bar Chart — Payroll Expenses Breakdown */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-stone-900">Payroll Expenses Breakdown</h3>
              <p className="text-[11px] text-stone-400 mt-0.5">Monthly salary expense distribution</p>
            </div>
            <button
              type="button"
              onClick={() => setReportReady(true)}
              className="p-2 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-500 cursor-pointer transition"
              title={reportReady ? "Report prepared" : "Prepare dashboard report"}
            >
              {reportReady ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Download className="w-4 h-4" />}
            </button>
          </div>

          {/* Bars */}
          <div className="relative mt-8">
            {/* Hover tooltip */}
            {hoveredBar !== null && (
              <div
                className="absolute z-10 pointer-events-none"
                style={{
                  left: `${(hoveredBar / (MONTHS.length - 1)) * 100}%`,
                  bottom: "100%",
                  transform: "translateX(-50%)",
                  marginBottom: "8px",
                }}
              >
                <div className="bg-stone-900 text-white rounded-xl px-4 py-3 shadow-lg text-xs whitespace-nowrap">
                  {[
                    { label: "Base Salary",   ratio: 0.45 },
                    { label: "Overtime Pay",  ratio: 0.35 },
                    { label: "Bonuses",       ratio: 0.20 },
                  ].map(({ label, ratio }) => (
                    <div key={label} className="flex items-center justify-between gap-6 mb-1 last:mb-0">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        {label}
                      </span>
                      <span className="font-mono">₱{Math.round(displayedMonthlyData[hoveredBar] * ratio).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="text-[9px] text-stone-400 mt-2 pt-2 border-t border-stone-700 font-mono text-center">
                    {MONTHS[hoveredBar]} — ₱{displayedMonthlyData[hoveredBar].toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-end gap-2 h-44">
              {displayedMonthlyData.map((val, i) => (
                <button
                  key={i}
                  type="button"
                  className="flex-1 flex flex-col items-center cursor-pointer group"
                  style={{ height: "100%" }}
                  onMouseEnter={() => setHoveredBar(i)}
                  onMouseLeave={() => setHoveredBar(null)}
                  onFocus={() => setHoveredBar(i)}
                  onBlur={() => setHoveredBar(null)}
                  onClick={() => setSelectedMonth(i)}
                  aria-label={`Select ${MONTHS[i]} payroll amount`}
                >
                  <div className="w-full flex items-end h-full">
                    <div
                      className={`w-full rounded-t-lg transition-all duration-200 ${
                        i === selectedMonth
                          ? "bg-gradient-to-t from-stsn-brown to-amber-500 shadow-sm"
                          : i === currentMonth
                          ? "bg-gradient-to-t from-emerald-700 to-emerald-400 shadow-sm"
                          : hoveredBar === i
                          ? "bg-emerald-300"
                          : "bg-stone-200"
                      }`}
                      style={{
                        height: `${(val / maxBar) * 100}%`,
                        backgroundImage:
                          i !== selectedMonth && i !== currentMonth && hoveredBar !== i
                            ? "repeating-linear-gradient(45deg,transparent,transparent 3px,rgba(0,0,0,.07) 3px,rgba(0,0,0,.07) 6px)"
                            : undefined,
                      }}
                    />
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              {MONTHS.map((m, i) => (
                <div key={i} className="flex-1 text-center">
                  <span className={`text-[9px] font-mono ${i === currentMonth ? "text-emerald-700 font-bold" : "text-stone-400"}`}>
                    {m}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-stone-100">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-gradient-to-t from-stsn-brown to-amber-500" />
              <span className="text-[10px] text-stone-500">Selected Month</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-gradient-to-t from-emerald-700 to-emerald-400" />
              <span className="text-[10px] text-stone-500">Current Month</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-sm bg-stone-200"
                style={{ backgroundImage: "repeating-linear-gradient(45deg,transparent,transparent 2px,rgba(0,0,0,.1) 2px,rgba(0,0,0,.1) 4px)" }}
              />
              <span className="text-[10px] text-stone-500">Other Months</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {monthBreakdown.map((item) => (
              <div key={item.label} className="rounded-xl border border-stone-100 bg-stone-50 p-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span className="text-[10px] text-stone-500">{item.label}</span>
                </div>
                <span className="text-sm font-bold text-stone-900 mt-1 block">
                  ₱{Math.round(monthAmount * item.ratio).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Salary Pie Chart — Department Breakdown */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-stone-900">Salary Pie Chart</h3>
            <p className="text-[11px] text-stone-400 mt-0.5">Department salary distribution</p>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <DonutChart
              slices={deptSalaries.map((d) => ({ label: d.label, pct: d.pct, hex: d.hex }))}
              total={totalDeptSalary}
            />
            <div className="flex-1 space-y-1.5 min-w-0">
              {deptSalaries.map((d) => (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => setSelectedDept(d.label)}
                  className={`w-full flex items-center gap-2 rounded-lg px-1.5 py-1 transition ${
                    selectedDept === d.label ? "bg-stone-100" : "hover:bg-stone-50"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${d.tw} flex-shrink-0`} />
                  <span className="text-[10px] text-stone-600 flex-1 truncate">{d.label}</span>
                  <span className="text-[10px] font-mono font-bold text-stone-500">{d.pct}%</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 mt-3">
            {deptSalaries.map((d) => (
              <button
                key={d.label}
                type="button"
                onClick={() => setSelectedDept(d.label)}
                className={`w-full p-2.5 rounded-xl border ${d.light} ${d.border} flex items-center justify-between text-left transition hover:shadow-sm ${
                  selectedDept === d.label ? "ring-2 ring-stsn-brown/20" : ""
                }`}
              >
                <div className="min-w-0">
                  <p className={`text-[10px] font-semibold ${d.text}`}>{d.label}</p>
                  <div className="w-24 bg-white/60 rounded-full h-1 mt-1 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${d.pct}%`, backgroundColor: d.hex }} />
                  </div>
                </div>
                <span className={`text-[11px] font-mono font-bold ${d.text} ml-2 flex-shrink-0`}>
                  ₱{(d.salary / 1000).toFixed(0)}K
                </span>
              </button>
            ))}
          </div>

          {selectedDeptData && (
            <div className="mt-4 rounded-xl bg-stone-900 text-white p-3">
              <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400">Department Focus</p>
              <div className="flex items-center justify-between gap-3 mt-1">
                <span className="text-sm font-bold truncate">{selectedDeptData.label}</span>
                <span className="text-sm font-mono font-bold">₱{selectedDeptData.salary.toLocaleString()}</span>
              </div>
              <p className="text-[10px] text-stone-300 mt-1">
                {selectedDeptData.pct}% of tracked payroll allocation.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Summary Strip ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
        <p className="text-[9px] font-mono uppercase tracking-widest text-stone-400 mb-4">Payroll Summary</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Payroll Amount", value: `₱${totalPayroll.toLocaleString()}`, tone: "text-emerald-700" },
            { label: "Highest-Paid Dept", value: highestDept ? `${highestDept.label} (${highestDept.pct}%)` : "—", tone: "text-stsn-brown" },
            { label: "Lowest-Paid Dept", value: lowestDept ? `${lowestDept.label} (${lowestDept.pct}%)` : "—", tone: "text-amber-700" },
            { label: "Active Employees", value: headcount, tone: "text-stone-900" },
          ].map((item) => (
            <div key={item.label} className="p-3 rounded-xl bg-stone-50 border border-stone-100">
              <span className="text-[9px] font-mono uppercase text-stone-400 block">{item.label}</span>
              <span className={`text-base font-display font-bold mt-1 block ${item.tone}`}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </AnalyticsDashboardShell>
  );
}

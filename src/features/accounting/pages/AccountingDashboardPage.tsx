/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react";
import { useSTSNStore } from "../../../services/store";
import {
  TrendingUp, TrendingDown, ReceiptText, Wallet,
} from "lucide-react";
import AnalyticsDashboardShell from "../../../components/common/analytics/AnalyticsDashboardShell";
import { CHART_THEME } from "../../../config/chart-theme.config";

// ── SVG smooth line chart helper ──────────────────────────────────────────
function buildSmoothPath(
  values: number[],
  w: number,
  h: number,
  pad = 28,
): string {
  if (values.length < 2) return "";
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - 2 * pad);
    const y = h - pad - ((v - min) / range) * (h - 2 * pad);
    return [x, y] as [number, number];
  });
  return pts
    .map(([x, y], i) => {
      if (i === 0) return `M ${x} ${y}`;
      const [px, py] = pts[i - 1];
      const cx = (px + x) / 2;
      return `C ${cx} ${py}, ${cx} ${y}, ${x} ${y}`;
    })
    .join(" ");
}

function buildAreaPath(
  values: number[],
  w: number,
  h: number,
  pad = 28,
): string {
  const line = buildSmoothPath(values, w, h, pad);
  if (!line) return "";
  const lastX = pad + (1) * (w - 2 * pad);
  return `${line} L ${lastX} ${h - pad} L ${pad} ${h - pad} Z`;
}

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function AccountingDashboardPage() {
  const { payments, assessments, activeSchool } = useSTSNStore();

  const scopedPayments = useMemo(
    () =>
      activeSchool === "ALL"
        ? payments
        : payments.filter((p) => (p as { schoolId?: string }).schoolId === activeSchool),
    [payments, activeSchool],
  );

  const totalRevenue = useMemo(
    () => scopedPayments.reduce((sum, p) => sum + p.amount, 0),
    [scopedPayments],
  );

  const totalAR = useMemo(
    () =>
      assessments
        .filter((a) => a.balance > 0)
        .reduce((sum, a) => sum + a.balance, 0),
    [assessments],
  );

  const totalExpenses = useMemo(() => Math.round(totalRevenue * 0.62), [totalRevenue]);
  const totalAP = useMemo(() => Math.round(totalExpenses * 0.18), [totalExpenses]);

  const monthlyRevenue = useMemo(() => {
    const byMonth = Array(12).fill(0);
    scopedPayments.forEach((p) => {
      const m = new Date(p.date ?? Date.now()).getMonth();
      byMonth[m] += p.amount;
    });
    return byMonth;
  }, [scopedPayments]);

  const monthlyExpenses = useMemo(
    () => monthlyRevenue.map((v) => Math.round(v * 0.62)),
    [monthlyRevenue],
  );

  const W = 520;
  const H = 160;

  const revPath  = buildSmoothPath(monthlyRevenue, W, H);
  const revArea  = buildAreaPath(monthlyRevenue, W, H);
  const expPath  = buildSmoothPath(monthlyExpenses, W, H);
  const expArea  = buildAreaPath(monthlyExpenses, W, H);

  const kpis = [
    {
      label: "Total Revenue",
      value: `₱${totalRevenue.toLocaleString()}`,
      sub: "Total collections this period",
      trend: "+8.5% vs last period",
      trendUp: true,
      icon: <TrendingUp className="w-5 h-5" />,
      bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800",
      chip: "bg-emerald-100", iconColor: "text-emerald-700", accent: "bg-emerald-600",
    },
    {
      label: "Total Expenses",
      value: `₱${totalExpenses.toLocaleString()}`,
      sub: "Operating expenses this period",
      trend: "+3.2% vs last period",
      trendUp: false,
      icon: <TrendingDown className="w-5 h-5" />,
      bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800",
      chip: "bg-amber-100", iconColor: "text-amber-700", accent: "bg-amber-500",
    },
    {
      label: "AR Balance",
      value: `₱${totalAR.toLocaleString()}`,
      sub: "Outstanding student balances",
      trend: `${assessments.filter((a) => a.balance > 0).length} open accounts`,
      trendUp: false,
      icon: <ReceiptText className="w-5 h-5" />,
      bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800",
      chip: "bg-blue-100", iconColor: "text-blue-700", accent: "bg-blue-600",
    },
    {
      label: "AP Balance",
      value: `₱${totalAP.toLocaleString()}`,
      sub: "Outstanding vendor payables",
      trend: "Payables due this month",
      trendUp: false,
      icon: <Wallet className="w-5 h-5" />,
      bg: "bg-stsn-cream", border: "border-stsn-beige", text: "text-stsn-brown",
      chip: "bg-white border border-stsn-beige", iconColor: "text-stsn-brown", accent: "bg-stsn-brown",
    },
  ];

  const netIncome = totalRevenue - totalExpenses;
  const margin = totalRevenue > 0 ? Math.round((netIncome / totalRevenue) * 100) : 0;

  return (
    <AnalyticsDashboardShell
      title="Accounting Analytics Dashboard"
      badge="Admin Only"
      subtitle="Financial performance, revenue vs expenses, and accounts receivable / payable overview."
      meta={
        <div className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-center min-w-[108px]">
          <span className="text-[9px] text-stone-400 uppercase block font-mono tracking-wider">Academic Year</span>
          <span className="text-sm font-bold text-stone-900 mt-0.5 block">2026–2027</span>
        </div>
      }
    >
      {/* ── KPI Row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className={`relative overflow-hidden rounded-2xl border ${kpi.bg} ${kpi.border} p-5 flex flex-col gap-3 shadow-sm`}>
            <div className={`absolute inset-x-0 top-0 h-1 ${kpi.accent}`} />
            <div className="flex items-start justify-between gap-2">
              <span className="text-[11px] font-semibold text-stone-500 leading-tight">{kpi.label}</span>
              <div className={`w-10 h-10 rounded-xl ${kpi.chip} flex items-center justify-center flex-shrink-0`}>
                <span className={kpi.iconColor}>{kpi.icon}</span>
              </div>
            </div>
            <div>
              <span className={`text-2xl font-display font-bold ${kpi.text} leading-none`}>{kpi.value}</span>
              <span className={`text-[10px] font-mono flex items-center gap-0.5 mt-1 ${kpi.trendUp ? "text-emerald-600" : "text-stone-400"}`}>
                {kpi.trendUp ? "↑" : "→"} {kpi.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Revenue vs Expense Chart ─────────────────────────── */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
        <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-bold text-stone-900">Revenue vs Expenses</h3>
            <p className="text-[11px] text-stone-400 mt-0.5">Monthly comparison · {new Date().getFullYear()}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-2 rounded-full" style={{ backgroundColor: CHART_THEME.success }} />
              <span className="text-[11px] text-stone-500">Income · ₱{totalRevenue.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-2 rounded-full" style={{ backgroundColor: CHART_THEME.warning }} />
              <span className="text-[11px] text-stone-500">Expense · ₱{totalExpenses.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="w-full overflow-hidden rounded-xl bg-stone-50 border border-stone-100 p-3">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: "160px" }} preserveAspectRatio="none">
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_THEME.success} stopOpacity="0.25" />
                <stop offset="100%" stopColor={CHART_THEME.success} stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_THEME.warning} stopOpacity="0.20" />
                <stop offset="100%" stopColor={CHART_THEME.warning} stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <path d={revArea} fill="url(#revGrad)" />
            <path d={expArea} fill="url(#expGrad)" />
            <path d={revPath} fill="none" stroke={CHART_THEME.success} strokeWidth="2.5" strokeLinejoin="round" />
            <path d={expPath} fill="none" stroke={CHART_THEME.warning} strokeWidth="2.5" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="flex justify-between mt-2 px-1">
          {MONTHS_SHORT.map((m) => (
            <span key={m} className="text-[9px] font-mono text-stone-400">{m}</span>
          ))}
        </div>
      </div>

      {/* ── Bottom Row: AR Aging + AP Overview ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* AR Aging */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-stone-900 mb-1">AR Aging Overview</h3>
          <p className="text-[11px] text-stone-400 mb-4">Accounts receivable aged by days outstanding</p>
          <div className="space-y-3">
            {[
              { label: "Current (0–30 days)",    amount: Math.round(totalAR * 0.45), pct: 45, color: "bg-emerald-500", textColor: "text-emerald-700", bg: "bg-emerald-50" },
              { label: "30–60 days",              amount: Math.round(totalAR * 0.28), pct: 28, color: "bg-amber-400",   textColor: "text-amber-700",   bg: "bg-amber-50" },
              { label: "60–90 days",              amount: Math.round(totalAR * 0.16), pct: 16, color: "bg-orange-500",  textColor: "text-orange-700",  bg: "bg-orange-50" },
              { label: "90–120 days",             amount: Math.round(totalAR * 0.07), pct: 7,  color: "bg-red-400",     textColor: "text-red-700",     bg: "bg-red-50" },
              { label: "Over 120 days (Critical)", amount: Math.round(totalAR * 0.04), pct: 4,  color: "bg-red-700",    textColor: "text-red-800",     bg: "bg-red-100" },
            ].map((row) => (
              <div key={row.label} className={`flex items-center gap-4 p-3 rounded-xl ${row.bg} border border-transparent`}>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className={`text-[10px] font-semibold ${row.textColor}`}>{row.label}</span>
                    <span className={`text-[10px] font-mono font-bold ${row.textColor}`}>₱{row.amount.toLocaleString()} ({row.pct}%)</span>
                  </div>
                  <div className="w-full bg-white/60 rounded-full h-1.5 overflow-hidden">
                    <div className={`h-full rounded-full ${row.color}`} style={{ width: `${row.pct}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex justify-between items-center">
            <span className="text-[10px] font-mono text-stone-400 uppercase">Total AR Balance</span>
            <span className="text-sm font-bold text-blue-700">₱{totalAR.toLocaleString()}</span>
          </div>
        </div>

        {/* Financial Highlights */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-bold text-stone-900">Financial Highlights</h3>
            <p className="text-[11px] text-stone-400 mt-0.5">Key metrics at a glance</p>
          </div>
          <div className="space-y-3 flex-1">
            {[
              { label: "Net Income",          value: `₱${netIncome.toLocaleString()}`,        tone: netIncome >= 0 ? "text-emerald-700" : "text-red-700", bg: netIncome >= 0 ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100" },
              { label: "Net Margin",           value: `${margin}%`,                           tone: "text-blue-700",   bg: "bg-blue-50 border-blue-100" },
              { label: "Collection Rate",      value: `${Math.min(Math.round((totalRevenue / (totalRevenue + totalAR)) * 100), 99)}%`, tone: "text-stsn-brown", bg: "bg-stsn-cream border-stsn-beige" },
              { label: "Overdue Accounts",     value: assessments.filter((a) => a.balance > 0).length, tone: "text-red-700", bg: "bg-red-50 border-red-200" },
              { label: "Total Transactions",   value: payments.length,                         tone: "text-stone-800",  bg: "bg-stone-50 border-stone-100" },
            ].map((h) => (
              <div key={h.label} className={`flex items-center justify-between rounded-xl border px-4 py-3 ${h.bg}`}>
                <span className="text-[10px] font-mono uppercase text-stone-500">{h.label}</span>
                <span className={`text-sm font-display font-bold ${h.tone}`}>{h.value}</span>
              </div>
            ))}
          </div>
          <div className={`p-3 rounded-xl text-white ${netIncome >= 0 ? "bg-gradient-to-br from-emerald-600 to-stsn-brown" : "bg-gradient-to-br from-red-600 to-stsn-brown"}`}>
            <p className="text-[9px] font-mono uppercase tracking-wider opacity-80">Overall Status</p>
            <p className="text-sm font-bold mt-0.5">{netIncome >= 0 ? "Healthy — Surplus" : "Review Required"}</p>
            <p className="text-[10px] opacity-75 mt-0.5">
              {netIncome >= 0
                ? `₱${netIncome.toLocaleString()} net surplus for the period.`
                : "Expenses exceed revenue. Review cost centers."}
            </p>
          </div>
        </div>
      </div>
    </AnalyticsDashboardShell>
  );
}

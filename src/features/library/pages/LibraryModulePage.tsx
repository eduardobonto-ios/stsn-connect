/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  Library, LayoutDashboard, BookOpen, Boxes, BookMarked, RotateCcw,
  Clock, AlertTriangle, Coins, BarChart3, Settings, AlertCircle, Loader2,
} from "lucide-react";
import ModulePageHeader from "../../../components/common/ModulePageHeader";
import AppKpiCard from "../../../components/common/AppKpiCard";
import { usePermissions } from "../../../hooks/usePermissions";
import { useLibraryData } from "../data/useLibraryData";
import { LIBRARY_SUB_PAGES, type LibrarySubPage } from "../types";
import { formatMoney } from "../components/shared";

import LibraryDashboard from "../components/sections/LibraryDashboard";
import LibraryCatalog from "../components/sections/LibraryCatalog";
import LibraryInventory from "../components/sections/LibraryInventory";
import LibraryBorrowing from "../components/sections/LibraryBorrowing";
import LibraryReturns from "../components/sections/LibraryReturns";
import LibraryOverdue from "../components/sections/LibraryOverdue";
import LibraryLostDamaged from "../components/sections/LibraryLostDamaged";
import LibraryFines from "../components/sections/LibraryFines";
import LibraryReports from "../components/sections/LibraryReports";
import LibraryMaintenance from "../components/sections/LibraryMaintenance";

const TABS: { id: LibrarySubPage; label: string; icon: React.ElementType }[] = [
  { id: "dashboard",    label: "Dashboard",     icon: LayoutDashboard },
  { id: "catalog",      label: "Book Catalog",  icon: BookOpen },
  { id: "inventory",    label: "Inventory",     icon: Boxes },
  { id: "borrowing",    label: "Borrowing",     icon: BookMarked },
  { id: "returns",      label: "Returns",       icon: RotateCcw },
  { id: "overdue",      label: "Overdue",       icon: Clock },
  { id: "lost-damaged", label: "Lost / Damaged", icon: AlertTriangle },
  { id: "fines",        label: "Fines",         icon: Coins },
  { id: "reports",      label: "Reports",       icon: BarChart3 },
  { id: "maintenance",  label: "Maintenance",   icon: Settings },
];

const isSubPage = (v: string): v is LibrarySubPage =>
  (LIBRARY_SUB_PAGES as readonly string[]).includes(v);

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function LibraryModulePage({
  subPage,
  onSubPageChange,
}: {
  subPage?: string;
  onSubPageChange?: (page: string) => void;
}) {
  const { canPage, hasPageAccess } = usePermissions();
  const lib = useLibraryData();

  const initial: LibrarySubPage = subPage && isSubPage(subPage) ? subPage : "dashboard";
  const [activeTab, setActiveTab] = useState<LibrarySubPage>(initial);

  useEffect(() => {
    if (subPage && isSubPage(subPage) && subPage !== activeTab) setActiveTab(subPage);
  }, [subPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const goTo = (tab: LibrarySubPage) => {
    setActiveTab(tab);
    onSubPageChange?.(tab);
  };

  const visibleTabs = useMemo(
    () => TABS.filter((t) => hasPageAccess("LIBRARY_SYSTEM", t.id)),
    [hasPageAccess],
  );

  // ── KPI figures ─────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const scopedTxnIds = new Set(lib.transactions.map((t) => t.id));
    const openItems = lib.items.filter(
      (i) => scopedTxnIds.has(i.transactionId) && (i.itemStatus === "BORROWED" || i.itemStatus === "OVERDUE"),
    );
    const today = todayStr();
    const overdue = openItems.filter((i) => i.dueDate && i.dueDate < today).length;
    const finesDue = lib.fines
      .filter((f) => f.status === "PENDING")
      .reduce((sum, f) => sum + f.amount, 0);
    return {
      titles: lib.books.length,
      copies: lib.copies.length,
      available: lib.copies.filter((c) => c.copyStatus === "AVAILABLE").length,
      borrowed: openItems.length,
      overdue,
      finesDue,
    };
  }, [lib.books, lib.copies, lib.items, lib.transactions, lib.fines]);

  const renderSection = () => {
    if (!hasPageAccess("LIBRARY_SYSTEM", activeTab)) {
      return (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <p className="text-xs text-amber-800">This library page is disabled for the current access profile.</p>
        </div>
      );
    }
    switch (activeTab) {
      case "dashboard":    return <LibraryDashboard lib={lib} onNavigate={goTo} />;
      case "catalog":      return <LibraryCatalog lib={lib} canPage={canPage} />;
      case "inventory":    return <LibraryInventory lib={lib} canPage={canPage} />;
      case "borrowing":    return <LibraryBorrowing lib={lib} canPage={canPage} />;
      case "returns":      return <LibraryReturns lib={lib} canPage={canPage} />;
      case "overdue":      return <LibraryOverdue lib={lib} />;
      case "lost-damaged": return <LibraryLostDamaged lib={lib} canPage={canPage} />;
      case "fines":        return <LibraryFines lib={lib} canPage={canPage} />;
      case "reports":      return <LibraryReports lib={lib} />;
      case "maintenance":  return <LibraryMaintenance lib={lib} canPage={canPage} />;
      default:             return null;
    }
  };

  return (
    <div className="space-y-5 animate-fade-in font-sans">
      <ModulePageHeader
        badge="Library System"
        badgeIcon={Library}
        title="Library Management"
        subtitle="Catalog, inventory, borrowing, returns, overdue tracking, and fines for the school library."
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <AppKpiCard label="Titles" value={kpis.titles} icon={BookOpen} tone="brand" hint="Catalog records" />
        <AppKpiCard label="Total Copies" value={kpis.copies} icon={Boxes} tone="neutral" hint="Physical inventory" />
        <AppKpiCard label="Available" value={kpis.available} icon={BookMarked} tone="success" hint="On the shelf" />
        <AppKpiCard label="Borrowed" value={kpis.borrowed} icon={RotateCcw} tone="info" hint="Currently out" />
        <AppKpiCard label="Overdue" value={kpis.overdue} icon={Clock} tone={kpis.overdue > 0 ? "danger" : "neutral"} hint="Past due date" />
        <AppKpiCard label="Fines Due" value={formatMoney(kpis.finesDue)} icon={Coins} tone={kpis.finesDue > 0 ? "warning" : "neutral"} hint="Pending settlement" />
      </div>

      {/* Tab bar */}
      <div className="bg-white rounded-xl border border-stsn-beige shadow-sm overflow-hidden">
        <div className="flex items-stretch overflow-x-auto">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => goTo(tab.id)}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  active ? "tab-active-gradient" : "text-stone-500 hover:bg-stone-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Body */}
      {lib.loading ? (
        <div className="rounded-2xl border border-stsn-beige bg-white/80 p-8 shadow-sm flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-stsn-gold animate-spin" />
          <p className="text-sm text-stone-500">Loading library records…</p>
        </div>
      ) : lib.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-red-800">Could not load the library</h3>
            <p className="text-xs text-red-700 mt-1">{lib.error}</p>
            <button
              onClick={() => void lib.reload()}
              className="mt-3 text-xs font-bold px-3 py-1.5 rounded-lg border border-red-300 text-red-700 hover:bg-red-100 cursor-pointer transition"
            >
              Retry
            </button>
          </div>
        </div>
      ) : (
        <div className="animate-fade-in">{renderSection()}</div>
      )}
    </div>
  );
}

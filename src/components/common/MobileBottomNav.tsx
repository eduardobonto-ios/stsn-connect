/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  ClipboardList, CalendarDays, Bell, User,
  Wallet, BarChart3, GraduationCap, DollarSign,
  Stethoscope, BookOpen, Receipt,
} from "lucide-react";
import type { UserRole } from "../../types";
import type { STSNModule } from "../../config/navigation.config";

interface BottomNavTab {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  module: STSNModule;
  subPage?: string;
}

const ROLE_TABS: Partial<Record<UserRole, BottomNavTab[]>> = {
  TEACHER: [
    { label: "Grades", icon: ClipboardList, module: "FACULTY_PORTAL" },
    { label: "Schedule", icon: CalendarDays, module: "SCHEDULING" },
    { label: "Notices", icon: Bell, module: "DASHBOARD" },
    { label: "Profile", icon: User, module: "FACULTY_PORTAL" },
  ],
  CASHIER: [
    { label: "Queue", icon: Receipt, module: "CASHIER", subPage: "queue" },
    { label: "History", icon: BarChart3, module: "CASHIER", subPage: "history" },
    { label: "Reports", icon: BarChart3, module: "CASHIER", subPage: "reports" },
    { label: "Profile", icon: User, module: "DASHBOARD" },
  ],
  NURSE: [
    { label: "Clinic", icon: Stethoscope, module: "NURSE_CLINIC" },
    { label: "Notices", icon: Bell, module: "DASHBOARD" },
    { label: "Profile", icon: User, module: "DASHBOARD" },
  ],
  STUDENT: [
    { label: "Grades", icon: GraduationCap, module: "STUDENT_PORTAL" },
    { label: "Fees", icon: DollarSign, module: "STUDENT_PORTAL" },
    { label: "Books", icon: BookOpen, module: "STUDENT_PORTAL" },
    { label: "Notices", icon: Bell, module: "DASHBOARD" },
  ],
  EMPLOYEE: [
    { label: "Payslip", icon: Wallet, module: "FACULTY_PORTAL" },
    { label: "Leave", icon: CalendarDays, module: "HR_MANAGEMENT" },
    { label: "Notices", icon: Bell, module: "DASHBOARD" },
    { label: "Profile", icon: User, module: "FACULTY_PORTAL" },
  ],
};

interface MobileBottomNavProps {
  role: UserRole;
  activeModule: STSNModule;
  onNavigate: (module: STSNModule, subPage?: string) => void;
}

export default function MobileBottomNav({ role, activeModule, onNavigate }: MobileBottomNavProps) {
  const tabs = ROLE_TABS[role];
  if (!tabs) return null;

  return (
    <nav className="lg:hidden flex-shrink-0 border-t border-stone-200/80 bg-white/95 backdrop-blur-sm shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
      <div className="flex items-stretch">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeModule === tab.module;
          return (
            <button
              key={`${tab.module}-${tab.label}`}
              onClick={() => onNavigate(tab.module, tab.subPage)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-all cursor-pointer ${
                isActive
                  ? "text-stsn-brown border-t-2 border-stsn-gold -mt-px"
                  : "text-stone-400 border-t-2 border-transparent -mt-px hover:text-stsn-brown/70"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-stsn-gold" : ""}`} />
              <span className={`text-[9px] font-bold leading-none ${isActive ? "text-stsn-brown" : ""}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/** Returns true if the role should get a mobile bottom nav instead of the hamburger sidebar. */
export function hasMobileBottomNav(role: UserRole): boolean {
  return role in ROLE_TABS;
}

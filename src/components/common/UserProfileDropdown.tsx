/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from "react";
import { ChevronDown, LogOut, User, Building2 } from "lucide-react";
import { useSTSNStore } from "../../services/store";
import { useAppDialog } from "./useAppDialog";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function UserProfileDropdown() {
  const { currentUser, logout, schools, activeSchool } = useSTSNStore();
  const { toast } = useAppDialog();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!currentUser) return null;

  const initials = getInitials(currentUser.name);
  const school = currentUser.schoolId
    ? schools.find((s) => s.id === currentUser.schoolId)
    : null;
  const schoolLabel =
    school?.shortName ?? (activeSchool === "ALL" ? "All Schools" : activeSchool);

  const handleLogout = () => {
    setOpen(false);
    logout();
    toast("Logged out of STSN Connect session.");
  };

  return (
    <div className="relative" ref={ref}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open user menu"
        aria-haspopup="true"
        aria-expanded={open}
        className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl border border-transparent hover:bg-stsn-cream/80 hover:border-stsn-gold/30 transition-all cursor-pointer"
      >
        {/* Initials avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
          style={{ background: "linear-gradient(135deg, #c5a059 0%, #9a7a44 100%)" }}
        >
          <span className="text-[11px] font-black text-white tracking-wide leading-none select-none">
            {initials}
          </span>
        </div>
        {/* First name — hidden on small screens */}
        <span className="hidden md:block text-xs font-bold text-stsn-brown max-w-[96px] truncate leading-none">
          {currentUser.name.split(" ")[0]}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-stone-200/80 z-50 overflow-hidden animate-fade-in">
          {/* User summary header */}
          <div className="px-4 pt-4 pb-3.5 bg-gradient-to-br from-stsn-cream/70 to-white border-b border-stone-100">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 shadow-md"
                style={{ background: "linear-gradient(135deg, #c5a059 0%, #9a7a44 100%)" }}
              >
                <span className="text-sm font-black text-white tracking-wide leading-none select-none">
                  {initials}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-stsn-brown-dark truncate leading-tight">
                  {currentUser.name}
                </p>
                <p className="text-[10px] font-mono text-stone-500 uppercase tracking-wide mt-0.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-stsn-gold animate-pulse flex-shrink-0" />
                  {currentUser.role.replace(/_/g, " ")}
                </p>
                {schoolLabel && (
                  <p className="text-[10px] text-stone-400 mt-0.5 flex items-center gap-1 truncate">
                    <Building2 className="w-2.5 h-2.5 flex-shrink-0 text-stone-300" />
                    {schoolLabel}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1.5">
            {/* Your Profile — no route exists yet */}
            <button
              disabled
              title="Profile management coming soon"
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-stone-300 cursor-not-allowed select-none"
            >
              <User className="w-3.5 h-3.5 flex-shrink-0" />
              Your Profile
              <span className="ml-auto text-[9px] font-mono uppercase text-stone-300 bg-stone-100 px-1.5 py-0.5 rounded leading-none">
                Soon
              </span>
            </button>

            <div className="mx-4 my-1 border-t border-stone-100" />

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-stone-600 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
              Exit Connect Session
            </button>
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-stone-100 bg-stone-50/60">
            <p className="text-[9px] font-mono text-stone-400 text-center tracking-wide uppercase">
              STSN Connect · Active Session
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

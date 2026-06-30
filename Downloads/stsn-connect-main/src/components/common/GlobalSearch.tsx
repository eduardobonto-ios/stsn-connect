/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, User, GraduationCap, Receipt, X, Keyboard } from "lucide-react";
import { useSTSNStore } from "../../services/store";

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

interface SearchResult {
  id: string;
  type: "student" | "employee" | "payment";
  label: string;
  sub: string;
  badge?: string;
}

const SHORTCUT_HELP = [
  { keys: ["Ctrl", "K"], desc: "Open global search" },
  { keys: ["Ctrl", "N"], desc: "New record (context-aware)" },
  { keys: ["Esc"], desc: "Close modal / search" },
  { keys: ["Ctrl", "Enter"], desc: "Submit current form" },
  { keys: ["?"], desc: "Toggle shortcut guide" },
];

export default function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const { students, employees, payments } = useSTSNStore();
  const [query, setQuery] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setShowHelp(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const out: SearchResult[] = [];

    for (const s of students) {
      const name = `${s.firstName} ${s.lastName}`.toLowerCase();
      if (name.includes(q) || s.studentNo.toLowerCase().includes(q) || (s.lrn || "").includes(q)) {
        out.push({
          id: s.id,
          type: "student",
          label: `${s.lastName}, ${s.firstName} ${s.middleName || ""}`.trim(),
          sub: `${s.studentNo} · ${s.yearLevel} ${s.trackOrCourse} · ${s.enrollmentStatus}`,
          badge: s.schoolId,
        });
        if (out.length >= 5) break;
      }
    }

    for (const emp of employees) {
      const name = `${emp.firstName} ${emp.lastName}`.toLowerCase();
      if (name.includes(q) || (emp.employeeNo || "").toLowerCase().includes(q)) {
        out.push({
          id: emp.id,
          type: "employee",
          label: `${emp.lastName}, ${emp.firstName}`,
          sub: `${emp.position} · ${emp.department}`,
          badge: emp.schoolId,
        });
        if (out.length >= 8) break;
      }
    }

    for (const pay of payments) {
      if (pay.orNumber.toLowerCase().includes(q)) {
        out.push({
          id: pay.id,
          type: "payment",
          label: `OR # ${pay.orNumber}`,
          sub: `₱${pay.amount.toLocaleString()} · ${pay.paymentDate} · ${pay.paymentMethod}`,
        });
        if (out.length >= 10) break;
      }
    }

    return out;
  }, [query, students, employees, payments]);

  if (!open) return null;

  const TYPE_ICON: Record<SearchResult["type"], React.ReactNode> = {
    student: <GraduationCap className="w-4 h-4 text-stsn-brown" />,
    employee: <User className="w-4 h-4 text-blue-500" />,
    payment: <Receipt className="w-4 h-4 text-emerald-500" />,
  };

  const TYPE_LABEL: Record<SearchResult["type"], string> = {
    student: "Student",
    employee: "Employee",
    payment: "Receipt",
  };

  return createPortal(
    <div
      className="app-modal-backdrop z-[200] animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-stone-200">
        {/* Search bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-100">
          <Search className="w-5 h-5 text-stone-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search students, employees, OR numbers..."
            className="flex-1 text-sm outline-none text-stone-800 placeholder-stone-400"
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "?") { e.preventDefault(); setShowHelp((v) => !v); }
            }}
          />
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowHelp((v) => !v)}
              className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600 cursor-pointer transition"
              title="Keyboard shortcuts (?)"
            >
              <Keyboard className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600 cursor-pointer transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Shortcut help panel */}
        {showHelp && (
          <div className="border-b border-stone-100 bg-stone-50 px-4 py-3 animate-fade-in">
            <p className="text-[10px] font-bold uppercase tracking-wide text-stone-400 mb-2">Keyboard Shortcuts</p>
            <div className="grid grid-cols-2 gap-1.5">
              {SHORTCUT_HELP.map(({ keys, desc }) => (
                <div key={desc} className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {keys.map((k) => (
                      <kbd key={k} className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-white border border-stone-200 text-stone-600 shadow-sm">
                        {k}
                      </kbd>
                    ))}
                  </div>
                  <span className="text-[11px] text-stone-500">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {query.length < 2 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <Search className="w-8 h-8 text-stone-200" />
              <p className="text-xs text-stone-400">Type at least 2 characters to search</p>
              <p className="text-[11px] text-stone-300">Students · Employees · OR Numbers</p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <Search className="w-8 h-8 text-stone-200" />
              <p className="text-xs font-semibold text-stone-400">No results for "{query}"</p>
              <p className="text-[11px] text-stone-300">Try a name, student number, or OR number</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-50">
              {results.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-stsn-cream/40 transition cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                    {TYPE_ICON[r.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-stone-800 truncate">{r.label}</span>
                      {r.badge && (
                        <span className="text-[8px] font-bold px-1.5 py-px rounded bg-stsn-cream text-stsn-brown border border-stsn-beige flex-shrink-0">
                          {r.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-500 truncate">{r.sub}</p>
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-500 flex-shrink-0">
                    {TYPE_LABEL[r.type]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-stone-100 bg-stone-50/40 flex items-center justify-between">
          <p className="text-[9.5px] text-stone-400 font-mono">
            {results.length > 0 ? `${results.length} result${results.length !== 1 ? "s" : ""}` : "No results"}
          </p>
          <div className="flex items-center gap-1.5">
            <kbd className="text-[9px] font-mono px-1.5 py-px rounded bg-white border border-stone-200 text-stone-500 shadow-sm">Esc</kbd>
            <span className="text-[9px] text-stone-400">to close</span>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

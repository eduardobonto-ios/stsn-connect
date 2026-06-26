/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { Download, FileText, Printer, Table2, ChevronDown } from "lucide-react";

export type ExportFormat = "pdf" | "print" | "csv" | "excel";

export interface ExportMenuProps {
  onExport: (format: ExportFormat) => void;
  /** Formats to show; defaults to all four */
  formats?: ExportFormat[];
  /** Button label; defaults to "Export" */
  label?: string;
  disabled?: boolean;
  className?: string;
}

const FORMAT_CONFIG: Record<
  ExportFormat,
  { label: string; icon: React.ElementType }
> = {
  pdf:   { label: "Export PDF",   icon: FileText },
  print: { label: "Print View",   icon: Printer  },
  csv:   { label: "Export CSV",   icon: Table2   },
  excel: { label: "Export Excel", icon: Table2   },
};

export default function ExportMenu({
  onExport,
  formats = ["pdf", "print", "csv", "excel"],
  label = "Export",
  disabled = false,
  className = "",
}: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stsn-brown bg-white border border-stone-200 hover:border-stsn-brown rounded-lg px-3 py-1.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Download className="w-3.5 h-3.5" />
        {label}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden min-w-[160px] animate-fade-in">
          {formats.map((fmt) => {
            const cfg = FORMAT_CONFIG[fmt];
            const Icon = cfg.icon;
            return (
              <button
                key={fmt}
                onClick={() => {
                  setOpen(false);
                  onExport(fmt);
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stsn-cream hover:text-stsn-brown transition text-left"
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                {cfg.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

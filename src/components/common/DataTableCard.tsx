/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Search, X } from "lucide-react";

interface DataTableCardProps {
  /** Section title shown on the left side of the card header */
  title: string;
  /** Optional lucide icon rendered beside the title */
  icon?: React.ElementType;
  /** Optional subtitle shown below the title */
  subtitle?: string;
  /**
   * Controlled search value. When provided together with onSearchChange,
   * a search input is rendered in the card header; filtering is handled
   * by the parent.
   */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  /** Placeholder text for the header search input */
  searchPlaceholder?: string;
  /**
   * Additional elements rendered to the right of the search input
   * (e.g. export buttons, filter selects, count badges).
   */
  actions?: React.ReactNode;
  /** The DataTable (and any other content) rendered in the card body */
  children: React.ReactNode;
  /** Extra classes applied to the outer card wrapper */
  className?: string;
  /** Extra classes applied to the card body div */
  bodyClassName?: string;
}

/**
 * Reusable card shell for DataTable pages.
 *
 * Renders a section title (left) and an optional search input + action
 * buttons (right) in a single header row, followed by a body area for
 * the table. This satisfies the STSN standard where every card that
 * contains a DataTable must align its search box with its section title.
 */
export default function DataTableCard({
  title,
  icon: Icon,
  subtitle,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search…",
  actions,
  children,
  className = "",
  bodyClassName = "",
}: DataTableCardProps) {
  const hasSearch = searchValue !== undefined && onSearchChange !== undefined;

  return (
    <div className={`bg-white rounded-xl border border-stsn-beige shadow-sm overflow-hidden ${className}`}>
      {/* ── Card Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 border-b border-stone-100">
        {/* Left: icon + title + subtitle */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {Icon && (
            <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-lg bg-stsn-cream border border-stsn-beige">
              <Icon className="w-3.5 h-3.5 text-stsn-brown" />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-stone-800 leading-none truncate">{title}</h3>
            {subtitle && (
              <p className="text-[10px] text-stone-400 mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right: search + actions */}
        {(hasSearch || actions) && (
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {hasSearch && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => onSearchChange!(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-8 w-52 bg-stone-50 border border-stone-200 rounded-lg pl-8 pr-8 text-xs focus:outline-none focus:ring-2 focus:ring-stsn-brown/20 focus:border-stsn-brown transition"
                />
                {searchValue && (
                  <button
                    type="button"
                    onClick={() => onSearchChange!("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
            {actions && (
              <div className="flex items-center gap-2">{actions}</div>
            )}
          </div>
        )}
      </div>

      {/* ── Card Body ───────────────────────────────────────────────────── */}
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}

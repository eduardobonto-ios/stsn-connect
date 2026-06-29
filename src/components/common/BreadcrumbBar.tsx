/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbCrumb {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbBarProps {
  crumbs: BreadcrumbCrumb[];
}

export default function BreadcrumbBar({ crumbs }: BreadcrumbBarProps) {
  if (crumbs.length === 0) return null;

  return (
    <div className="app-shell-breadcrumb flex-shrink-0">
      <div className="app-shell-breadcrumb-inner">
        <Home className="w-3 h-3 text-stone-400 flex-shrink-0" />
        <ChevronRight className="w-3 h-3 text-stone-300 flex-shrink-0" />
        <span className="text-stone-400 flex-shrink-0">Theresian Connect</span>
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <React.Fragment key={i}>
              <ChevronRight className="w-3 h-3 text-stone-300 flex-shrink-0" />
              {crumb.onClick && !isLast ? (
                <button
                  onClick={crumb.onClick}
                  className="text-stsn-brown hover:text-stsn-brown-dark hover:underline transition cursor-pointer truncate max-w-[200px] flex-shrink-0"
                >
                  {crumb.label}
                </button>
              ) : (
                <span
                  className={`truncate max-w-[240px] flex-shrink-0 ${isLast ? "text-stone-700 font-semibold" : "text-stone-500"}`}
                >
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

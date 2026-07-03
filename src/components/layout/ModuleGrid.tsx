/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import type { NavItem, STSNModule } from "../../config/navigation.config";

interface ModuleGridProps {
  items: NavItem[];
  onSelect: (item: NavItem) => void;
  getBadgeCount: (moduleId: STSNModule) => number;
}

const TILE_TONES = [
  { bg: "bg-stsn-brown-dark", icon: "text-stsn-gold-light" },
  { bg: "bg-stsn-gold/90", icon: "text-stsn-brown-dark" },
];

export default function ModuleGrid({
  items,
  onSelect,
  getBadgeCount,
}: ModuleGridProps) {
  if (items.length === 0) return null;

  return (
    <div className="mb-2">
      <div className="text-center mb-6">
        <h2 className="font-display text-2xl font-extrabold text-stsn-brown-dark tracking-tight">
          Enterprise Command Center
        </h2>
        <p className="text-sm text-stone-500 mt-1.5 max-w-xl mx-auto">
          Manage institutional operations across all departments with
          real-time analytics and unified control.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {items.map((item, index) => {
          const Icon = item.icon;
          const badge = getBadgeCount(item.id);
          const tone = TILE_TONES[index % TILE_TONES.length];
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              title={item.desc}
              className="relative flex flex-col items-center gap-3 rounded-2xl bg-white border border-stsn-beige/70 shadow-sm p-5 transition-all duration-200 cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-stsn-gold/50 group"
            >
              {badge > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold font-mono leading-none shadow">
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center ${tone.bg} shadow-inner transition-transform group-hover:scale-105`}
              >
                <Icon className={`w-6 h-6 ${tone.icon}`} />
              </div>
              <div className="text-center min-w-0 w-full">
                <p className="text-[13px] font-bold text-stsn-brown-dark leading-tight truncate">
                  {item.label}
                </p>
                <p className="text-[9px] font-mono uppercase tracking-widest text-stone-400 mt-0.5 truncate">
                  {item.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

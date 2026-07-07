/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { ArrowLeft, ChevronRight, Circle } from "lucide-react";
import type { NavItem, NavSubItem, STSNModule } from "../../config/navigation.config";
import { getPathForModule, getRouteForNavChild } from "../../config/app-routes.config";

interface ModuleGridProps {
  items: NavItem[];
  onNavigate: (path: string) => void;
  getBadgeCount: (moduleId: STSNModule, childId?: string) => number;
}

type LevelNode =
  | { kind: "leaf"; item: NavSubItem; route: string }
  | { kind: "group"; item: NavSubItem };

/**
 * True if a nav child (or any of its descendants) resolves to a real route.
 * Used to hide dead-end groups that were pruned empty upstream (RBAC filtering
 * in App.tsx's renderedSidebarItems already does this for whole modules, but
 * an intermediate group can still end up empty after per-page filtering).
 */
function hasVisibleLeaf(parentModuleId: STSNModule, node: NavSubItem): boolean {
  if (node.isSection) return false;
  if (node.children?.length) {
    return node.children.some((child) => hasVisibleLeaf(parentModuleId, child));
  }
  return getRouteForNavChild(parentModuleId, node) !== null;
}

/** One level of a module's submenu tree: leaf cards + drillable group cards. */
function buildLevel(parentModuleId: STSNModule, children: NavSubItem[]): LevelNode[] {
  const nodes: LevelNode[] = [];
  for (const child of children) {
    if (child.isSection) continue;
    if (child.children?.length) {
      if (hasVisibleLeaf(parentModuleId, child)) {
        nodes.push({ kind: "group", item: child });
      }
      continue;
    }
    const route = getRouteForNavChild(parentModuleId, child);
    if (route) {
      nodes.push({ kind: "leaf", item: child, route });
    }
  }
  return nodes;
}

/** Per-tile pastel accent, cycled by grid position — mirrors the reference
 * dashboard's distinct-color-per-card look. Each icon badge uses a soft
 * gradient + inner highlight for an embossed, raised appearance. */
const TILE_TONES = [
  { grad: "from-emerald-100 to-emerald-50", icon: "text-emerald-600" },
  { grad: "from-blue-100 to-blue-50", icon: "text-blue-600" },
  { grad: "from-indigo-100 to-indigo-50", icon: "text-indigo-600" },
  { grad: "from-rose-100 to-rose-50", icon: "text-rose-500" },
  { grad: "from-amber-100 to-amber-50", icon: "text-amber-600" },
  { grad: "from-sky-100 to-sky-50", icon: "text-sky-600" },
  { grad: "from-purple-100 to-purple-50", icon: "text-purple-600" },
  { grad: "from-teal-100 to-teal-50", icon: "text-teal-600" },
];

const EMBOSS_SHADOW =
  "shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),inset_0_-1px_2px_rgba(0,0,0,0.04),0_2px_4px_rgba(15,23,42,0.08)]";

function ModuleTile({
  icon: Icon,
  label,
  desc,
  badge,
  tone,
  onClick,
  isGroup = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc?: string;
  badge: number;
  tone: { grad: string; icon: string };
  onClick: () => void;
  isGroup?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={desc}
      className="flex flex-col items-center gap-2 cursor-pointer group"
    >
      <div
        className={`relative w-20 h-20 rounded-2xl flex items-center justify-center bg-gradient-to-br ${tone.grad} ${EMBOSS_SHADOW} transition-transform group-hover:scale-105`}
      >
        <Icon className={`w-9 h-9 ${tone.icon}`} />
        {badge > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold font-mono leading-none shadow">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
        {isGroup && (
          <span className="absolute -bottom-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-white shadow ring-1 ring-black/5">
            <ChevronRight className="w-3 h-3 text-stone-400" />
          </span>
        )}
      </div>
      <p className="text-[13px] font-bold text-slate-800 text-center leading-tight max-w-[6.5rem]">
        {label}
      </p>
    </button>
  );
}

export default function ModuleGrid({
  items,
  onNavigate,
  getBadgeCount,
}: ModuleGridProps) {
  // Drill-down path: the top-level module entered, then any nested submenu
  // groups entered beneath it (e.g. Accounting -> Student Accounts). The
  // route resolver always takes the top-level module id, regardless of depth.
  const [rootModule, setRootModule] = useState<NavItem | null>(null);
  const [groupStack, setGroupStack] = useState<NavSubItem[]>([]);

  if (items.length === 0) return null;

  const goBack = () => {
    if (groupStack.length > 0) {
      setGroupStack((stack) => stack.slice(0, -1));
    } else {
      setRootModule(null);
    }
  };

  if (rootModule) {
    const currentGroup = groupStack[groupStack.length - 1];
    const currentChildren = currentGroup ? currentGroup.children ?? [] : rootModule.children ?? [];
    const level = buildLevel(rootModule.id, currentChildren);
    const HeaderIcon = currentGroup?.icon ?? rootModule.icon;
    const headerLabel = currentGroup?.label ?? rootModule.label;
    const headerDesc = currentGroup?.desc ?? rootModule.desc;

    return (
      <div className="mb-2">
        <button
          onClick={goBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stsn-brown-dark mb-5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-stsn-brown-dark flex items-center justify-center">
            <HeaderIcon className="w-6 h-6 text-stsn-gold-light" />
          </div>
          <h2 className="font-display text-2xl font-extrabold text-stsn-brown-dark tracking-tight">
            {headerLabel}
          </h2>
          {headerDesc && (
            <p className="text-sm text-stone-500 mt-1.5 max-w-xl mx-auto">{headerDesc}</p>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-6">
          {level.map((node, index) =>
            node.kind === "leaf" ? (
              <ModuleTile
                key={node.item.id}
                icon={node.item.icon ?? Circle}
                label={node.item.label}
                desc={node.item.desc}
                badge={getBadgeCount(rootModule.id, node.item.id)}
                tone={TILE_TONES[index % TILE_TONES.length]}
                onClick={() => onNavigate(node.route)}
              />
            ) : (
              <ModuleTile
                key={node.item.id}
                icon={node.item.icon ?? Circle}
                label={node.item.label}
                desc={node.item.desc}
                badge={getBadgeCount(rootModule.id, node.item.id)}
                tone={TILE_TONES[index % TILE_TONES.length]}
                isGroup
                onClick={() => setGroupStack((stack) => [...stack, node.item])}
              />
            ),
          )}
        </div>
      </div>
    );
  }

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

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-6">
        {items.map((item, index) => {
          const canDrillDown =
            !!item.children?.length && buildLevel(item.id, item.children).length > 0;
          return (
            <ModuleTile
              key={item.id}
              icon={item.icon}
              label={item.label}
              desc={item.desc}
              badge={getBadgeCount(item.id)}
              tone={TILE_TONES[index % TILE_TONES.length]}
              isGroup={canDrillDown}
              onClick={() => {
                if (canDrillDown) {
                  setRootModule(item);
                  setGroupStack([]);
                } else {
                  onNavigate(getPathForModule(item.id));
                }
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

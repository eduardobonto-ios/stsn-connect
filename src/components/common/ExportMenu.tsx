/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Download, FileText, Printer, Table2 } from "lucide-react";
import AppActionMenu, { type AppActionMenuItem } from "./AppActionMenu";

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
  const items: AppActionMenuItem[] = formats.map((fmt) => {
    const cfg = FORMAT_CONFIG[fmt];
    return {
      id: fmt,
      label: cfg.label,
      icon: cfg.icon,
      onSelect: () => onExport(fmt),
    };
  });

  return (
    <AppActionMenu
      label={label}
      icon={Download}
      items={items}
      disabled={disabled}
      className={className}
    />
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { getStatusStyle } from "../../config/status-style.config";

interface AppStatusBadgeProps {
  status: string;
  className?: string;
}

export default function AppStatusBadge({ status, className = "" }: AppStatusBadgeProps) {
  const style = getStatusStyle(status);

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${style.badgeClass} ${className}`}>
      {style.label}
    </span>
  );
}

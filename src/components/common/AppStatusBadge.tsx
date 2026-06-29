/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { getStatusStyle } from "../../config/status-style.config";

interface AppStatusBadgeProps {
  status: string;
  className?: string;
  children?: React.ReactNode;
}

export default function AppStatusBadge({ status, className = "", children }: AppStatusBadgeProps) {
  const style = getStatusStyle(status);

  return (
    <span
      data-status-family={style.family}
      data-status-token={style.token}
      className={`stsn-status-badge inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${style.badgeClass} ${className}`}
    >
      {children ?? style.label}
    </span>
  );
}

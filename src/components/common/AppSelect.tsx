/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { CONTROL_BASE_CLASSES, CONTROL_SIZE_CLASSES, CONTROL_STATE_CLASSES } from "./controlStyles";

export interface AppSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  uiSize?: "sm" | "md";
}

export default function AppSelect({
  error = false,
  uiSize = "md",
  className = "",
  children,
  ...props
}: AppSelectProps) {
  return (
    <select
      {...props}
      className={[
        CONTROL_BASE_CLASSES,
        CONTROL_SIZE_CLASSES[uiSize],
        "cursor-pointer appearance-none bg-[right_0.875rem_center] bg-no-repeat pr-10",
        "[background-image:linear-gradient(45deg,transparent_50%,var(--erp-text-muted)_50%),linear-gradient(135deg,var(--erp-text-muted)_50%,transparent_50%)] [background-position:calc(100%-18px)_calc(50%-1px),calc(100%-13px)_calc(50%-1px)] [background-size:5px_5px,5px_5px]",
        error ? CONTROL_STATE_CLASSES.error : CONTROL_STATE_CLASSES.default,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </select>
  );
}

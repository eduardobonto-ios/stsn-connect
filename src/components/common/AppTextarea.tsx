/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { CONTROL_BASE_CLASSES, CONTROL_SIZE_CLASSES, CONTROL_STATE_CLASSES } from "./controlStyles";

export interface AppTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  uiSize?: "sm" | "md";
}

export default function AppTextarea({
  error = false,
  uiSize = "md",
  className = "",
  ...props
}: AppTextareaProps) {
  return (
    <textarea
      {...props}
      className={[
        CONTROL_BASE_CLASSES,
        CONTROL_SIZE_CLASSES[uiSize],
        "min-h-[110px] resize-y",
        error ? CONTROL_STATE_CLASSES.error : CONTROL_STATE_CLASSES.default,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}

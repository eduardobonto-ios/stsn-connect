/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { CONTROL_BASE_CLASSES, CONTROL_SIZE_CLASSES, CONTROL_STATE_CLASSES } from "./controlStyles";

export interface AppInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  uiSize?: "sm" | "md";
}

export default function AppInput({
  error = false,
  uiSize = "md",
  className = "",
  ...props
}: AppInputProps) {
  return (
    <input
      {...props}
      className={[
        CONTROL_BASE_CLASSES,
        CONTROL_SIZE_CLASSES[uiSize],
        error ? CONTROL_STATE_CLASSES.error : CONTROL_STATE_CLASSES.default,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}

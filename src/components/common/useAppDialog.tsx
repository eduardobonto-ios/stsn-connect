/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useContext } from "react";
import { AppDialogContext, type AppDialogContextValue } from "./DialogProvider";

export function useAppDialog(): AppDialogContextValue {
  const ctx = useContext(AppDialogContext);
  if (!ctx) {
    throw new Error("useAppDialog must be used within a DialogProvider");
  }
  return ctx;
}

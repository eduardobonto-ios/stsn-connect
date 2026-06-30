/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useCallback } from "react";

type ShortcutMap = Record<string, (e: KeyboardEvent) => void>;

/**
 * Registers global keyboard shortcuts. Keys are specified as:
 *   "Ctrl+K", "Meta+K", "Escape", "Enter", etc.
 * Meta refers to Cmd on macOS.
 */
export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
  const handler = useCallback(
    (e: KeyboardEvent) => {
      // Skip if typing in an input/textarea unless it's Escape
      const tag = (e.target as HTMLElement)?.tagName;
      const inInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if (inInput && e.key !== "Escape") return;

      const parts: string[] = [];
      if (e.ctrlKey) parts.push("Ctrl");
      if (e.metaKey) parts.push("Meta");
      if (e.altKey) parts.push("Alt");
      if (e.shiftKey) parts.push("Shift");
      parts.push(e.key);

      const key = parts.join("+");
      if (shortcuts[key]) {
        e.preventDefault();
        shortcuts[key](e);
      }
    },
    [shortcuts],
  );

  useEffect(() => {
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handler]);
}

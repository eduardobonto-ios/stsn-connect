/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

interface AppCardProps {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
  tone?: "default" | "muted" | "brand";
}

const TONE_CLASSES = {
  default: "bg-[var(--erp-surface)]",
  muted: "bg-[var(--erp-surface-muted)]",
  brand: "bg-[linear-gradient(180deg,#ffffff_0%,#fffdf6_100%)]",
} as const;

export default function AppCard({
  children,
  className = "",
  padded = true,
  tone = "default",
}: AppCardProps) {
  return (
    <section className={`app-card ${TONE_CLASSES[tone]} ${padded ? "p-5" : ""} ${className}`}>
      {children}
    </section>
  );
}

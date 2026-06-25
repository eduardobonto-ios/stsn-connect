/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

interface AppCardProps {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}

export default function AppCard({ children, className = "", padded = true }: AppCardProps) {
  return (
    <section className={`app-card ${padded ? "p-5" : ""} ${className}`}>
      {children}
    </section>
  );
}

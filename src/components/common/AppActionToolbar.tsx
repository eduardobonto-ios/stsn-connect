/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

interface AppActionToolbarProps {
  children: React.ReactNode;
  className?: string;
}

export default function AppActionToolbar({ children, className = "" }: AppActionToolbarProps) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-stsn-beige bg-white px-4 py-3 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

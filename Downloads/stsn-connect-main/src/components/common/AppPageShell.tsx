/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

interface AppPageShellProps {
  children: React.ReactNode;
  className?: string;
}

export default function AppPageShell({ children, className = "" }: AppPageShellProps) {
  return (
    <div className={`space-y-6 animate-fade-in font-sans ${className}`}>
      {children}
    </div>
  );
}

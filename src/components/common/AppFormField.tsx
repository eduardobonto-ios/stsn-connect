/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

interface AppFormFieldProps {
  label: string;
  children: React.ReactNode;
  hint?: string;
  error?: string;
}

export default function AppFormField({ label, children, hint, error }: AppFormFieldProps) {
  return (
    <label className="block space-y-1.5">
      <span className="stsn-form-label">{label}</span>
      {children}
      {error ? (
        <span className="block text-[10px] font-semibold text-red-600">{error}</span>
      ) : hint ? (
        <span className="stsn-helper-text block">{hint}</span>
      ) : null}
    </label>
  );
}

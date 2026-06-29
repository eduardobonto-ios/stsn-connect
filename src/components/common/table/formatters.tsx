/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import AppStatusBadge from "../AppStatusBadge";

export function formatEmptyValue(value: React.ReactNode, fallback = "—") {
  if (value === null || value === undefined || value === "") {
    return <span className="text-stone-400">{fallback}</span>;
  }

  return value;
}

export function formatPersonName(person: {
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  name?: string | null;
}) {
  if (person.name) return person.name;

  const parts = [person.firstName, person.middleName, person.lastName]
    .map((part) => part?.trim())
    .filter(Boolean);

  return parts.length > 0 ? parts.join(" ") : "—";
}

export function formatDateValue(value: string | number | Date | null | undefined) {
  if (!value) return <span className="text-stone-400">—</span>;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return <span className="text-stone-400">—</span>;

  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

export function formatCurrencyValue(
  value: number | null | undefined,
  currency = "PHP",
  locale = "en-PH",
) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return <span className="text-stone-400">—</span>;
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

export function renderStatusBadge(status: string | null | undefined) {
  if (!status) return <span className="text-stone-400">—</span>;
  return <AppStatusBadge status={status} />;
}

export function renderTableActions(actions: React.ReactNode) {
  return <div className="flex items-center justify-end gap-1">{actions}</div>;
}

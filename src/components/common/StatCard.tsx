import React from "react";
import AppKpiCard from "./AppKpiCard";
import type { AppTone } from "./ui-variants";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  tone?: AppTone;
  color?: string;
  textColor?: string;
}

export default function StatCard({ label, value, icon, tone = "brand" }: StatCardProps) {
  return <AppKpiCard label={label} value={value} icon={icon} tone={tone} />;
}

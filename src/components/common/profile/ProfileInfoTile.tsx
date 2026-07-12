import React from "react";
import { APP_TONE_STYLES, type AppTone } from "../ui-variants";

const normalizeStatusKey = (value?: string | null) => value?.trim().toLowerCase() ?? "";

export interface ProfileInfoTileProps {
  label: string;
  value: React.ReactNode;
  variant?: AppTone;
  helperText?: string;
  className?: string;
  statusValue?: string | null;
  statusVariantMap?: Partial<Record<string, AppTone>>;
}

export default function ProfileInfoTile({
  label,
  value,
  variant = "neutral",
  helperText,
  className = "",
  statusValue,
  statusVariantMap,
}: ProfileInfoTileProps) {
  const mappedVariant = statusVariantMap?.[normalizeStatusKey(statusValue)];
  const resolvedVariant = mappedVariant ?? variant;
  const style = APP_TONE_STYLES[resolvedVariant];

  return (
    <div
      className={["flex items-center justify-between gap-3 rounded-xl border px-4 py-3", style.card, className]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] font-mono opacity-75">{label}</p>
        {helperText ? <p className="mt-0.5 text-[11px] leading-4 opacity-70">{helperText}</p> : null}
      </div>
      <span className={`text-base font-black flex-shrink-0 ml-3 ${style.text}`}>{value}</span>
    </div>
  );
}

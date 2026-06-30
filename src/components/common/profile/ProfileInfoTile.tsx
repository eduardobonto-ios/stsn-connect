import React from "react";
import type { LucideIcon } from "lucide-react";

export type ProfileInfoTileVariant =
  | "primary"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "neutral";

const TILE_VARIANT_STYLES: Record<
  ProfileInfoTileVariant,
  {
    surface: string;
    accent: string;
    label: string;
    icon: string;
    helper: string;
  }
> = {
  primary: {
    surface: "border-[#e7d7a7] bg-[#fffdf5]",
    accent: "bg-[var(--erp-brand)]",
    label: "text-[#7d6840]",
    icon: "border-[#eadfbe] bg-[#fbf3d9] text-[var(--erp-brand)]",
    helper: "text-[#8b7a59]",
  },
  info: {
    surface: "border-[#d8e2ec] bg-[#f8fafc]",
    accent: "bg-[#56779f]",
    label: "text-[#5a7086]",
    icon: "border-[#d7e3ef] bg-[#eef4f9] text-[#48617d]",
    helper: "text-[#697f95]",
  },
  success: {
    surface: "border-[#dbe6da] bg-[#f7faf7]",
    accent: "bg-[#5f7f66]",
    label: "text-[#57715c]",
    icon: "border-[#d8e7d9] bg-[#eef6ef] text-[#4f6d56]",
    helper: "text-[#68836d]",
  },
  warning: {
    surface: "border-[#eadfbe] bg-[#fdfaf3]",
    accent: "bg-[#98753a]",
    label: "text-[#7c6339]",
    icon: "border-[#efdfbf] bg-[#f8f0dc] text-[#87662f]",
    helper: "text-[#8c7247]",
  },
  danger: {
    surface: "border-[#e8d9d5] bg-[#fcf8f7]",
    accent: "bg-[#98655d]",
    label: "text-[#7f5a54]",
    icon: "border-[#ead7d2] bg-[#f8efed] text-[#895b54]",
    helper: "text-[#8d6a64]",
  },
  neutral: {
    surface: "border-[#e5ddd2] bg-[#fbfaf8]",
    accent: "bg-[#9a8f7f]",
    label: "text-[#746b60]",
    icon: "border-[#e3ddd4] bg-[#f4f1ec] text-[#746b60]",
    helper: "text-[#83796e]",
  },
};

const normalizeStatusKey = (value?: string | null) => value?.trim().toLowerCase() ?? "";

export interface ProfileInfoTileProps {
  label: string;
  value: React.ReactNode;
  variant?: ProfileInfoTileVariant;
  icon?: LucideIcon;
  helperText?: string;
  readOnly?: boolean;
  className?: string;
  statusValue?: string | null;
  statusVariantMap?: Partial<Record<string, ProfileInfoTileVariant>>;
}

export default function ProfileInfoTile({
  label,
  value,
  variant = "neutral",
  icon: Icon,
  helperText,
  readOnly = false,
  className = "",
  statusValue,
  statusVariantMap,
}: ProfileInfoTileProps) {
  const mappedVariant = statusVariantMap?.[normalizeStatusKey(statusValue)];
  const resolvedVariant = mappedVariant ?? variant;
  const styles = TILE_VARIANT_STYLES[resolvedVariant];

  return (
    <div
      className={[
        "relative overflow-hidden rounded-2xl border p-4 shadow-[0_10px_30px_rgba(15,23,42,0.03)]",
        styles.surface,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${styles.accent}`} aria-hidden="true" />
      <div className="flex items-start gap-3">
        {Icon ? (
          <div className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border ${styles.icon}`}>
            <Icon className="h-4 w-4" />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className={`text-[10px] font-bold uppercase tracking-[0.16em] ${styles.label}`}>{label}</p>
            {readOnly ? (
              <span className="rounded-full border border-black/5 bg-white/75 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--erp-text-muted)]">
                Read only
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm font-semibold leading-5 text-[var(--erp-text)]">{value}</p>
          {helperText ? <p className={`mt-1 text-[11px] leading-4 ${styles.helper}`}>{helperText}</p> : null}
        </div>
      </div>
    </div>
  );
}

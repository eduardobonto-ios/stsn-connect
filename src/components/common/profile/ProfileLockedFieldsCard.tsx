import React from "react";
import { ShieldAlert } from "lucide-react";
import AppCard from "../AppCard";
import ProfileInfoTile, { type ProfileInfoTileProps } from "./ProfileInfoTile";

interface LockedFieldItem extends Pick<ProfileInfoTileProps, "helperText" | "icon" | "statusValue" | "statusVariantMap"> {
  label: string;
  value: React.ReactNode;
  variant?: ProfileInfoTileProps["variant"];
}

interface ProfileLockedFieldsCardProps {
  title: string;
  description: string;
  fields: LockedFieldItem[];
}

export default function ProfileLockedFieldsCard({
  title,
  description,
  fields,
}: ProfileLockedFieldsCardProps) {
  return (
    <AppCard tone="brand" className="space-y-4">
      <div className="flex items-center gap-2 border-b border-[var(--erp-border)] pb-3">
        <ShieldAlert className="h-4 w-4 text-red-500" />
        <h4 className="text-sm font-semibold text-[var(--erp-text)]">{title}</h4>
      </div>
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">{description}</div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {fields.map((item) => (
          <ProfileInfoTile
            key={item.label}
            label={item.label}
            value={item.value}
            variant={item.variant}
            icon={item.icon}
            helperText={item.helperText}
            readOnly
            statusValue={item.statusValue}
            statusVariantMap={item.statusVariantMap}
          />
        ))}
      </div>
    </AppCard>
  );
}

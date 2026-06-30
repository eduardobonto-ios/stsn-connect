import React from "react";
import AppTabs, { type AppTabItem } from "../AppTabs";

interface ProfileTabsProps<TValue extends string> {
  items: AppTabItem<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
  rightSlot?: React.ReactNode;
  className?: string;
}

export default function ProfileTabs<TValue extends string>({
  items,
  value,
  onChange,
  rightSlot,
  className = "",
}: ProfileTabsProps<TValue>) {
  return (
    <AppTabs
      items={items}
      value={value}
      onChange={onChange}
      variant="underline"
      rightSlot={rightSlot}
      className={className}
    />
  );
}

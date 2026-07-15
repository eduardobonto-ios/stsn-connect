import React from "react";
import AppTabs, { type AppTabItem } from "../../../components/common/AppTabs";

export type CashierTab = "queue" | "other-payments" | "vouchers" | "history" | "reports";

const LABELS: Record<CashierTab, string> = {
  queue: "Payment Queue",
  "other-payments": "Other Payments",
  vouchers: "Cash Vouchers",
  history: "Collection History",
  reports: "Reports",
};

export default function CashieringTabs({
  value,
  access,
  queueCount,
  pendingVoucherCount,
  onChange,
}: {
  value: CashierTab;
  access: Record<CashierTab, boolean>;
  queueCount: number;
  pendingVoucherCount: number;
  onChange: (tab: CashierTab) => void;
}) {
  const items = (Object.keys(LABELS) as CashierTab[])
    .filter((tab) => access[tab])
    .map<AppTabItem<CashierTab>>((tab) => ({
      value: tab,
      label: LABELS[tab],
      badge: tab === "queue" ? queueCount : tab === "vouchers" ? pendingVoucherCount : undefined,
    }));

  return <AppTabs items={items} value={value} onChange={onChange} variant="underline" className="rounded-xl" />;
}

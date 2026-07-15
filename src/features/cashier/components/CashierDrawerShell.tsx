import React from "react";
import DrilldownDrawer from "../../../components/common/DrilldownDrawer";

export default function CashierDrawerShell(props: React.ComponentProps<typeof DrilldownDrawer>) {
  return <DrilldownDrawer {...props} width={props.width ?? "cashier"} />;
}

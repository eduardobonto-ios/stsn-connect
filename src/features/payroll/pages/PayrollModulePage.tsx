/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import PayrollManagementPage from "./sub-pages/PayrollManagementPage";
import SalaryPayoutsPage from "./sub-pages/SalaryPayoutsPage";
import TaxesPage from "./sub-pages/TaxesPage";
import BenefitsPage from "./sub-pages/BenefitsPage";
import { usePermissions } from "../../../hooks/usePermissions";

interface Props {
  subPage: string;
}

export default function PayrollModulePage({ subPage }: Props) {
  const { hasPageAccess } = usePermissions();
  if (!hasPageAccess("PAYROLL_MANAGEMENT", subPage)) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
        <p className="text-xs text-amber-800">
          This payroll page is disabled for the current access profile.
        </p>
      </div>
    );
  }

  return (
    <>
      {subPage === "payroll-management" && <PayrollManagementPage />}
      {subPage === "salary-payouts" && <SalaryPayoutsPage />}
      {subPage === "taxes" && <TaxesPage />}
      {subPage === "benefits" && <BenefitsPage />}
    </>
  );
}

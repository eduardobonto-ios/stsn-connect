/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import PayrollManagementPage from "./sub-pages/PayrollManagementPage";
import SalaryPayoutsPage from "./sub-pages/SalaryPayoutsPage";
import TaxesPage from "./sub-pages/TaxesPage";
import BenefitsPage from "./sub-pages/BenefitsPage";

interface Props {
  subPage: string;
}

export default function PayrollModulePage({ subPage }: Props) {
  return (
    <>
      {subPage === "payroll-management" && <PayrollManagementPage />}
      {subPage === "salary-payouts" && <SalaryPayoutsPage />}
      {subPage === "taxes" && <TaxesPage />}
      {subPage === "benefits" && <BenefitsPage />}
    </>
  );
}

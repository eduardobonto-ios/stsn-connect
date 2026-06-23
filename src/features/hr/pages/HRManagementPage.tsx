/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import HRDashboardPage from "./sub-pages/HRDashboardPage";
import EmployeeLifecyclePage from "./sub-pages/EmployeeLifecyclePage";
import TimeManagementPage from "./sub-pages/TimeManagementPage";
import ShiftManagementPage from "./sub-pages/ShiftManagementPage";
import AttendancePage from "./sub-pages/AttendancePage";
import LeaveManagementPage from "./sub-pages/LeaveManagementPage";
import PayrollManagementPage from "./sub-pages/PayrollManagementPage";
import SalaryPayoutsPage from "./sub-pages/SalaryPayoutsPage";
import TaxesPage from "./sub-pages/TaxesPage";
import BenefitsPage from "./sub-pages/BenefitsPage";
import RecruitmentPage from "./sub-pages/RecruitmentPage";
import OnboardingPage from "./sub-pages/OnboardingPage";

interface Props {
  subPage: string;
  onSubPageChange: (subPage: string) => void;
}

export default function HRManagement({ subPage }: Props) {
  return (
    <>
      {subPage === "hr-dashboard" && <HRDashboardPage />}
      {subPage === "employee-life-cycles" && <EmployeeLifecyclePage />}
      {subPage === "time-management" && <TimeManagementPage />}
      {subPage === "shift-management" && <ShiftManagementPage />}
      {subPage === "attendance" && <AttendancePage />}
      {subPage === "leave-management" && <LeaveManagementPage />}
      {subPage === "payroll-management" && <PayrollManagementPage />}
      {subPage === "salary-payouts" && <SalaryPayoutsPage />}
      {subPage === "taxes" && <TaxesPage />}
      {subPage === "benefits" && <BenefitsPage />}
      {subPage === "recruitment" && <RecruitmentPage />}
      {subPage === "onboarding" && <OnboardingPage />}
    </>
  );
}

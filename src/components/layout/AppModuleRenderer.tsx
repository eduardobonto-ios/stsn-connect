/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {Suspense, lazy} from "react";
import type { STSNModule } from "../../config/navigation.config";
import type { NavigateTarget } from "../common/ApprovalInbox";

const Dashboard = lazy(() => import("../../features/dashboard/pages/DashboardPage"));
const ActionCenterPage = lazy(() => import("../../features/action-center/pages/ActionCenterPage"));
const PayrollDashboardPage = lazy(() => import("../../features/payroll/pages/PayrollDashboardPage"));
const AccountingDashboardPage = lazy(() => import("../../features/accounting/pages/AccountingDashboardPage"));
const RegistrarModule = lazy(() => import("../../features/registrar/pages/RegistrarModulePage"));
const AccountingModule = lazy(() => import("../../features/accounting/pages/AccountingModulePage"));
const GradingModule = lazy(() => import("../../features/grading/pages/GradingModulePage"));
const HRManagement = lazy(() => import("../../features/hr/pages/HRManagementPage"));
const PayrollModulePage = lazy(() => import("../../features/payroll/pages/PayrollModulePage"));
const CurriculumManagement = lazy(() => import("../../features/curriculum/pages/CurriculumManagementPage"));
const AccountsManagement = lazy(() => import("../../features/accounts/pages/AccountsManagementPage"));
const StudentPortal = lazy(() => import("../../features/student-portal/pages/StudentPortalPage"));
const FacultyPortal = lazy(() => import("../../features/faculty/pages/FacultyPortalPage"));
const FacultyAdminPage = lazy(() => import("../../features/faculty/pages/FacultyAdminPage"));
const CoreSetupModule = lazy(() => import("../../features/core-setup/pages/CoreSetupModulePage"));
const SchedulingModule = lazy(() => import("../../features/scheduling/pages/SchedulingModulePage"));
const OnlineLearning = lazy(() => import("../../features/online-learning/pages/OnlineLearningPage"));
const ClassSectioningModule = lazy(() => import("../../features/class-sectioning/pages/ClassSectioningModulePage"));
const BooksSetupPage = lazy(() => import("../../features/books/pages/BooksSetupPage"));
const CashierModule = lazy(() => import("../../features/cashier/pages/CashierModulePage"));
const ClinicModule = lazy(() => import("../../features/clinic/pages/ClinicModulePage"));
const GuidanceModule = lazy(() => import("../../features/guidance/pages/GuidanceModulePage"));
const ConsultationModule = lazy(() => import("../../features/consultation/pages/ConsultationModulePage"));
const RegistrarReportsPage = lazy(() => import("../../features/reports/pages/RegistrarReportsPage"));
const GuidanceReportsPage = lazy(() => import("../../features/reports/pages/GuidanceReportsPage"));
const ClinicReportsPage = lazy(() => import("../../features/reports/pages/ClinicReportsPage"));
const AdminReportsPage = lazy(() => import("../../features/reports/pages/AdminReportsPage"));
const StudentDirectoryPage = lazy(() => import("../../features/student-directory/pages/StudentDirectoryPage"));
const GuardianPortalPage = lazy(() => import("../../features/guardian/pages/GuardianPortalPage"));

interface AppModuleRendererProps {
  activeModule: STSNModule;
  allowedModules: STSNModule[];
  accountingSubPage: string;
  coreSetupSubPage: string;
  portalSubPage: string;
  facultySubPage: string;
  hrSubPage: string;
  payrollSubPage: string;
  cashierSubPage: string;
  accountsSubPage: "user-security" | "delegation-management" | "audit-log";
  portalStudentId?: string;
  onDashboardNavigate: () => void;
  onActionCenterNavigate: (target: NavigateTarget) => void;
  onStudentDirectoryNavigate: (subPage: string, studentId?: string) => void;
  onAccountingSubPageChange: (subPage: string) => void;
  onFacultySubPageChange: (subPage: string) => void;
  onHrSubPageChange: (subPage: string) => void;
  onCashierSubPageChange: (subPage: string) => void;
  onAccountsSubPageChange: (subPage: "user-security" | "delegation-management" | "audit-log") => void;
}

const RENDERED_MODULE_IDS: STSNModule[] = [
  "DASHBOARD",
  "ACTION_CENTER",
  "REGISTRAR",
  "REGISTRAR_REPORTS",
  "ACCOUNTING",
  "GRADING",
  "CURRICULUM",
  "STUDENT_DIRECTORY",
  "STUDENT_PORTAL",
  "FACULTY_ADMIN",
  "FACULTY_PORTAL",
  "HR_MANAGEMENT",
  "PAYROLL_DASHBOARD",
  "ACCOUNTING_DASHBOARD",
  "PAYROLL_MANAGEMENT",
  "ACCOUNTS_SECURITY",
  "CORE_SETUP",
  "SCHEDULING",
  "CLASS_SECTIONING",
  "ONLINE_LEARNING",
  "BOOKS_SETUP",
  "CASHIER",
  "NURSE_CLINIC",
  "GUIDANCE",
  "GUIDANCE_REPORTS",
  "CLINIC_REPORTS",
  "ADMIN_REPORTS",
  "CONSULTATION",
  "GUARDIAN_PORTAL",
];

function ModuleLoadingFallback() {
  return (
    <div className="rounded-2xl border border-stsn-beige bg-white/80 p-6 shadow-sm">
      <p className="text-xs font-mono uppercase tracking-widest text-stsn-gold">
        Loading module
      </p>
      <p className="mt-2 text-sm text-stone-600">
        Preparing the current workspace...
      </p>
    </div>
  );
}

export default function AppModuleRenderer({
  activeModule,
  allowedModules,
  accountingSubPage,
  coreSetupSubPage,
  portalSubPage,
  facultySubPage,
  hrSubPage,
  payrollSubPage,
  cashierSubPage,
  accountsSubPage,
  portalStudentId,
  onDashboardNavigate,
  onActionCenterNavigate,
  onStudentDirectoryNavigate,
  onAccountingSubPageChange,
  onFacultySubPageChange,
  onHrSubPageChange,
  onCashierSubPageChange,
  onAccountsSubPageChange,
}: AppModuleRendererProps) {
  return (
    <Suspense fallback={<ModuleLoadingFallback />}>
      <>
        {activeModule === "DASHBOARD" &&
          allowedModules.includes("DASHBOARD") && (
            <Dashboard onViewStudentList={onDashboardNavigate} />
          )}
        {activeModule === "ACTION_CENTER" &&
          allowedModules.includes("ACTION_CENTER") && (
            <ActionCenterPage onNavigate={onActionCenterNavigate} />
          )}
        {activeModule === "REGISTRAR" &&
          allowedModules.includes("REGISTRAR") && <RegistrarModule />}
        {activeModule === "REGISTRAR_REPORTS" &&
          allowedModules.includes("REGISTRAR_REPORTS") && <RegistrarReportsPage />}
        {activeModule === "ACCOUNTING" &&
          allowedModules.includes("ACCOUNTING") && (
            <AccountingModule subPage={accountingSubPage} onSubPageChange={onAccountingSubPageChange} />
          )}
        {activeModule === "GRADING" && allowedModules.includes("GRADING") && (
          <GradingModule />
        )}
        {activeModule === "CURRICULUM" &&
          allowedModules.includes("CURRICULUM") && <CurriculumManagement />}
        {activeModule === "STUDENT_DIRECTORY" &&
          allowedModules.includes("STUDENT_DIRECTORY") && (
            <StudentDirectoryPage onNavigate={onStudentDirectoryNavigate} />
          )}
        {activeModule === "STUDENT_PORTAL" &&
          allowedModules.includes("STUDENT_PORTAL") && (
            <StudentPortal subPage={portalSubPage} initialStudentId={portalStudentId} />
          )}
        {activeModule === "FACULTY_ADMIN" &&
          allowedModules.includes("FACULTY_ADMIN") && (
            <FacultyAdminPage />
          )}
        {activeModule === "FACULTY_PORTAL" &&
          allowedModules.includes("FACULTY_PORTAL") && (
            <FacultyPortal subPage={facultySubPage} onSubPageChange={onFacultySubPageChange} />
          )}
        {activeModule === "HR_MANAGEMENT" &&
          allowedModules.includes("HR_MANAGEMENT") && (
            <HRManagement subPage={hrSubPage} onSubPageChange={onHrSubPageChange} />
          )}
        {activeModule === "PAYROLL_DASHBOARD" &&
          allowedModules.includes("PAYROLL_DASHBOARD") && (
            <PayrollDashboardPage />
          )}
        {activeModule === "ACCOUNTING_DASHBOARD" &&
          allowedModules.includes("ACCOUNTING_DASHBOARD") && (
            <AccountingDashboardPage />
          )}
        {activeModule === "PAYROLL_MANAGEMENT" &&
          allowedModules.includes("PAYROLL_MANAGEMENT") && (
            <PayrollModulePage subPage={payrollSubPage} />
          )}
        {activeModule === "ACCOUNTS_SECURITY" &&
          allowedModules.includes("ACCOUNTS_SECURITY") && (
            <AccountsManagement subPage={accountsSubPage} onSubPageChange={onAccountsSubPageChange} />
          )}
        {activeModule === "CORE_SETUP" &&
          allowedModules.includes("CORE_SETUP") && (
            <CoreSetupModule initialCategoryKey={coreSetupSubPage} />
          )}
        {activeModule === "SCHEDULING" &&
          allowedModules.includes("SCHEDULING") && <SchedulingModule />}
        {activeModule === "CLASS_SECTIONING" &&
          allowedModules.includes("CLASS_SECTIONING") && (
            <ClassSectioningModule />
          )}
        {activeModule === "ONLINE_LEARNING" &&
          allowedModules.includes("ONLINE_LEARNING") && <OnlineLearning />}
        {activeModule === "BOOKS_SETUP" &&
          allowedModules.includes("BOOKS_SETUP") && <BooksSetupPage />}
        {activeModule === "CASHIER" &&
          allowedModules.includes("CASHIER") && (
            <CashierModule subPage={cashierSubPage} onSubPageChange={onCashierSubPageChange} />
          )}
        {activeModule === "NURSE_CLINIC" &&
          allowedModules.includes("NURSE_CLINIC") && <ClinicModule />}
        {activeModule === "GUIDANCE" &&
          allowedModules.includes("GUIDANCE") && <GuidanceModule />}
        {activeModule === "GUIDANCE_REPORTS" &&
          allowedModules.includes("GUIDANCE_REPORTS") && <GuidanceReportsPage />}
        {activeModule === "CLINIC_REPORTS" &&
          allowedModules.includes("CLINIC_REPORTS") && <ClinicReportsPage />}
        {activeModule === "ADMIN_REPORTS" &&
          allowedModules.includes("ADMIN_REPORTS") && <AdminReportsPage />}
        {activeModule === "CONSULTATION" &&
          allowedModules.includes("CONSULTATION") && <ConsultationModule />}
        {activeModule === "GUARDIAN_PORTAL" &&
          allowedModules.includes("GUARDIAN_PORTAL") && <GuardianPortalPage />}
        {(!allowedModules.includes(activeModule) || !RENDERED_MODULE_IDS.includes(activeModule)) && (
          <div className="rounded-xl border border-stone-200 bg-white/80 p-6 shadow-sm">
            <p className="text-xs font-mono uppercase tracking-widest text-stsn-gold mb-2">
              Module unavailable
            </p>
            <h2 className="text-lg font-display font-bold text-stsn-brown-dark">
              This page is not available for your current access.
            </h2>
            <p className="text-sm text-stone-600 mt-2">
              Select another module from the sidebar or ask an administrator to review your permissions.
            </p>
          </div>
        )}
      </>
    </Suspense>
  );
}

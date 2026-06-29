/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState, useRef } from "react";
import { useSTSNStore } from "../../../../services/store";
import { useAppDialog } from "../../../../components/common/useAppDialog";
import { Employee, PayrollLine, PayrollRow, PayrollRun } from "../../../../types";
import {
  Users,
  Layers,
  Banknote,
  FileCheck,
  CheckCircle,
  Plus,
  Scale,
  DollarSign,
  Briefcase,
  Sparkles,
  Award,
  Search,
  BookOpen,
  Upload,
  X,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Phone,
  MapPin,
  ShieldAlert
} from "lucide-react";
import { PreviewModal, PayslipPreview } from "../../../../components/ModalPreviews";
import AppTable, {
  appTableColumnsFromLegacy,
  type AppTableLegacyColumn,
} from "../../../../components/common/AppTable";
import AppStatusBadge from "../../../../components/common/AppStatusBadge";
import EmptyState from "../../../../components/common/EmptyState";
import { calculatePayrollLine } from "../../utils/payrollCalculations";

interface ImportRow {
  firstName: string;
  middleName: string;
  lastName: string;
  positionTitle: string;
  monthlySalary: string;
  department: string;
  contractStatus: string;
  contact: string;
  address: string;
  emergencyContact: string;
  _error?: string;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === "," && !inQuotes) { result.push(current.trim()); current = ""; }
    else { current += ch; }
  }
  result.push(current.trim());
  return result;
}

export default function PayrollManagementPage() {
  const {
    employees,
    payroll,
    payrollPeriods,
    payrollRuns,
    payrollLines,
    salaryPayoutBatches,
    benefitPlans,
    statutoryContributionRules,
    taxTables,
    addEmployee,
    updateEmployee,
    markPaidPayroll,
    processGlobalPayroll,
    addPayrollPeriod,
    addPayrollRun,
    updatePayrollRunStatus,
    addPayrollLines,
    addSalaryPayoutBatch,
    addSalaryPayoutLines,
    bulkImportEmployees,
    currentUser,
    activeSchool,
    setupData
  } = useSTSNStore();
  const positionTitleOptions = setupData.position_titles ?? [];
  const { toast } = useAppDialog();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmpId, setSelectedEmpId] = useState<string>("emp-registrar");

  // Registration Dialog States
  const [isNewEmpOpen, setIsNewEmpOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [position, setPosition] = useState("Instructor");
  const [positionTitle, setPositionTitle] = useState("Instructor I");
  const [dept, setDept] = useState<"Basic Education" | "College" | "Accounting" | "Registrar" | "HR" | "Administration">("College");
  const [status, setStatus] = useState<"Full-Time" | "Part-Time" | "Contractual">("Full-Time");
  const [salary, setSalary] = useState(0);
  const [empContact, setEmpContact] = useState("");
  const [empAddress, setEmpAddress] = useState("");
  const [empEmergencyContact, setEmpEmergencyContact] = useState("");

  // Import Dialog States
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [importStatus, setImportStatus] = useState<"idle" | "preview" | "success" | "error">("idle");
  const [importMessage, setImportMessage] = useState("");
  const fileImportRef = useRef<HTMLInputElement>(null);

  // Payslip Preview states
  const [isPayslipOpen, setIsPayslipOpen] = useState(false);
  const [selectedPayslipRow, setSelectedPayslipRow] = useState<PayrollRow | null>(null);

  const userSchool = currentUser?.schoolId;
  // School scope follows the user's own school assignment, or — for
  // school-agnostic accounts like Super Admin — the active school context.
  const effectiveSchool = userSchool ?? (activeSchool !== "ALL" ? activeSchool : undefined);
  const filteredEmployees = useMemo(() => employees.filter((e) => {
    if (effectiveSchool && e.schoolId && e.schoolId !== effectiveSchool) return false;
    const fullName = `${e.firstName} ${e.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || e.position.toLowerCase().includes(searchQuery.toLowerCase());
  }), [employees, effectiveSchool, searchQuery]);

  useEffect(() => {
    if (filteredEmployees.length === 0) {
      if (selectedEmpId) setSelectedEmpId("");
      return;
    }
    if (!filteredEmployees.some((employee) => employee.id === selectedEmpId)) {
      setSelectedEmpId(filteredEmployees[0].id);
    }
  }, [filteredEmployees, selectedEmpId]);

  const activeEmpObj = filteredEmployees.find((e) => e.id === selectedEmpId);
  const employeePayrollList = payroll.filter((p) => p.employeeId === selectedEmpId);
  const pendingRows = payroll.filter((p) => filteredEmployees.some((employee) => employee.id === p.employeeId) && p.status === "Pending").length;
  const paidRows = payroll.filter((p) => filteredEmployees.some((employee) => employee.id === p.employeeId) && p.status === "Paid").length;
  const projectedMonthlyPayroll = filteredEmployees.reduce((sum, employee) => sum + employee.salary, 0);
  const effectivePayrollSchool = (effectiveSchool as any) || "STSN";
  const employeeMap = useMemo(() => new Map(employees.map((employee) => [employee.id, employee])), [employees]);

  const scopedPayrollRuns = useMemo(
    () =>
      payrollRuns
        .filter((run) => !run.schoolId || run.schoolId === effectivePayrollSchool)
        .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")),
    [payrollRuns, effectivePayrollSchool],
  );
  const latestPayrollRun = scopedPayrollRuns[0];
  const latestPayrollRunLines = useMemo(
    () => payrollLines.filter((line) => line.payrollRunId === latestPayrollRun?.id),
    [payrollLines, latestPayrollRun?.id],
  );
  const latestPayrollPeriod = payrollPeriods.find((period) => period.id === latestPayrollRun?.payrollPeriodId);
  const latestRunHasPayout = latestPayrollRun
    ? salaryPayoutBatches.some((batch) => batch.payrollRunId === latestPayrollRun.id && batch.status !== "Cancelled")
    : false;
  const latestRunNetPay = latestPayrollRunLines.reduce((sum, line) => sum + line.netPay, 0);
  const payrollExceptionRows = useMemo(() => {
    const rows: Array<{ issue: string; detail: string; severity: "Warning" | "Blocking" }> = [];
    const missingSalaryEmployees = filteredEmployees.filter((employee) => employee.salary <= 0);
    if (missingSalaryEmployees.length > 0) {
      rows.push({
        issue: "Missing salary profile",
        detail: `${missingSalaryEmployees.length} employee(s) have zero or missing salary.`,
        severity: "Blocking",
      });
    }
    if (benefitPlans.filter((plan) => plan.category === "Statutory" && plan.isActive).length > 0 && statutoryContributionRules.length === 0) {
      rows.push({
        issue: "No statutory rule rows",
        detail: "Active statutory benefit plans exist, but no effective-dated contribution rules are configured.",
        severity: "Warning",
      });
    }
    if (taxTables.length === 0) {
      rows.push({
        issue: "No configured tax table",
        detail: "Payroll will use the simplified fallback withholding table.",
        severity: "Warning",
      });
    }
    const lineCounts = new Map<string, number>();
    latestPayrollRunLines.forEach((line) => lineCounts.set(line.employeeId, (lineCounts.get(line.employeeId) ?? 0) + 1));
    const duplicateLineCount = [...lineCounts.values()].filter((count) => count > 1).length;
    if (duplicateLineCount > 0) {
      rows.push({
        issue: "Duplicate employee payroll lines",
        detail: `${duplicateLineCount} employee(s) appear more than once in the latest payroll run.`,
        severity: "Blocking",
      });
    }
    const negativeNetLines = latestPayrollRunLines.filter((line) => line.netPay < 0);
    if (negativeNetLines.length > 0) {
      rows.push({
        issue: "Negative net pay",
        detail: `${negativeNetLines.length} line(s) computed below zero net pay.`,
        severity: "Blocking",
      });
    }
    return rows;
  }, [benefitPlans, filteredEmployees, latestPayrollRunLines, statutoryContributionRules.length, taxTables.length]);

  const getCurrentSemiMonthlyPeriodDraft = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const cutoff = today.getDate() <= 15 ? "A" : "B";
    const startDay = cutoff === "A" ? 1 : 16;
    const endDay = cutoff === "A" ? 15 : new Date(year, month + 1, 0).getDate();
    const start = new Date(year, month, startDay);
    const end = new Date(year, month, endDay);
    const payout = new Date(year, month, Math.min(endDay + 2, new Date(year, month + 1, 0).getDate()));
    const monthCode = String(month + 1).padStart(2, "0");

    return {
      periodCode: `${effectivePayrollSchool}-${year}-${monthCode}-${cutoff}`,
      label: `${today.toLocaleString("en-US", { month: "short" })} ${startDay}-${endDay}, ${year}`,
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
      payoutDate: payout.toISOString().split("T")[0],
    };
  };

  const resetForm = () => {
    setFirstName(""); setLastName(""); setMiddleName("");
    setPosition("Instructor"); setPositionTitle("Instructor I");
    setDept("College"); setStatus("Full-Time"); setSalary(0);
    setEmpContact(""); setEmpAddress(""); setEmpEmergencyContact("");
  };

  const handleRegisterEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName) return;

    addEmployee({
      firstName, lastName, middleName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@stsn.edu.ph`,
      position, positionTitle,
      department: dept,
      salary: Number(salary) || 0,
      status,
      leaveBalance: 15,
      contact: empContact,
      address: empAddress,
      emergencyContact: empEmergencyContact,
      schoolId: (effectiveSchool as any) || "STSN"
    });

    setIsNewEmpOpen(false);
    resetForm();
  };

  // ---- Excel/CSV Import ----
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (!text) { setImportStatus("error"); setImportMessage("Could not read file."); return; }

      const lines = text.split("\n").filter((l) => l.trim().length > 0);
      if (lines.length < 2) { setImportStatus("error"); setImportMessage("File is empty or has no data rows."); return; }

      const headerLine = lines[0];
      // Parse rows starting from index 1
      const rows: ImportRow[] = lines.slice(1).map((line) => {
        const cols = parseCSVLine(line);
        return {
          firstName: cols[0] || "",
          middleName: cols[1] || "",
          lastName: cols[2] || cols[0] || "",
          positionTitle: cols[3] || "Instructor",
          monthlySalary: cols[4] || "0",
          department: cols[5] || "Basic Education",
          contractStatus: cols[6] || "Full-Time",
          contact: cols[7] || "",
          address: cols[8] || "",
          emergencyContact: cols[9] || ""
        };
      });

      // Validate rows
      const validated = rows.map((r) => {
        if (!r.firstName) return { ...r, _error: "Missing First Name" };
        if (!r.positionTitle) return { ...r, _error: "Missing Position Title" };
        const salary = parseFloat(r.monthlySalary);
        if (isNaN(salary)) return { ...r, _error: "Invalid Monthly Salary" };
        const validDepts = ["Basic Education", "College", "Accounting", "Registrar", "HR", "Administration"];
        if (!validDepts.includes(r.department)) return { ...r, _error: `Invalid Department: "${r.department}"` };
        const validStatus = ["Full-Time", "Part-Time", "Contractual"];
        if (!validStatus.includes(r.contractStatus)) return { ...r, _error: `Invalid Contract Status: "${r.contractStatus}"` };
        return r;
      });

      setImportRows(validated);
      setImportStatus("preview");
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleConfirmImport = () => {
    const validRows = importRows.filter((r) => !r._error);
    if (validRows.length === 0) { setImportMessage("No valid rows to import."); return; }

    bulkImportEmployees(validRows.map((r) => ({
      firstName: r.firstName,
      lastName: r.lastName,
      middleName: r.middleName,
      email: `${r.firstName.toLowerCase()}.${r.lastName.toLowerCase()}@stsn.edu.ph`,
      position: r.positionTitle,
      positionTitle: r.positionTitle,
      department: r.department as any,
      salary: parseFloat(r.monthlySalary) || 0,
      status: r.contractStatus as any,
      leaveBalance: 15,
      contact: r.contact,
      address: r.address,
      emergencyContact: r.emergencyContact,
      schoolId: (effectiveSchool as any) || "STSN"
    })));

    setImportStatus("success");
    setImportMessage(`Successfully imported ${validRows.length} employees. ${importRows.length - validRows.length} rows had errors and were skipped.`);
  };

  const handleDownloadTemplate = () => {
    const headers = "First Name,Middle Name,Last Name,Position Title,Monthly Salary,Department,Contract Status,Contact,Address,Emergency Contact";
    const sample1 = "Maria,Santos,Dela Cruz,Instructor I,32000,Basic Education,Full-Time,+639171234567,#5 Rizal St. QC,Pedro Dela Cruz +639181234567";
    const sample2 = "Jose,Reyes,Garcia,HR Officer,38000,HR,Full-Time,+639281234567,#10 Mabini St. QC,Ana Garcia +639291234567";
    const csv = [headers, sample1, sample2].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "employee_import_template.csv";
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const handleGeneratePayrollRun = () => {
    const missingSalaryEmployees = filteredEmployees.filter((employee) => employee.salary <= 0);
    if (missingSalaryEmployees.length > 0) {
      toast(`${missingSalaryEmployees.length} employee(s) need salary profiles before payroll can be generated.`, { variant: "warning" });
      return;
    }
    const payableEmployees = filteredEmployees;
    if (payableEmployees.length === 0) {
      toast("No employees found for the current school scope.", { variant: "warning" });
      return;
    }

    const periodDraft = getCurrentSemiMonthlyPeriodDraft();
    const period =
      payrollPeriods.find((p) => p.periodCode === periodDraft.periodCode && (!p.schoolId || p.schoolId === effectivePayrollSchool)) ??
      addPayrollPeriod({
        schoolId: effectivePayrollSchool,
        ...periodDraft,
        status: "Open",
      });

    const duplicateRun = payrollRuns.find(
      (run) =>
        run.payrollPeriodId === period.id &&
        (!run.schoolId || run.schoolId === effectivePayrollSchool) &&
        run.status !== "Cancelled",
    );
    if (duplicateRun) {
      toast(`Payroll run ${duplicateRun.runNo} already exists for ${period.label ?? period.periodCode}.`, { variant: "warning" });
      return;
    }

    const year = new Date().getFullYear();
    const taxTable = [...taxTables]
      .filter((table) => table.effectiveYear <= year)
      .sort((a, b) => b.effectiveYear - a.effectiveYear)[0];
    const run = addPayrollRun({
      schoolId: effectivePayrollSchool,
      payrollPeriodId: period.id,
      runNo: `PR-${period.periodCode}`,
      status: "Computed",
      computedBy: currentUser?.name ?? "Payroll",
      computedAt: new Date().toISOString(),
      notes: `Generated from ${payableEmployees.length} scoped employee compensation profile(s).`,
    });

    addPayrollLines(
      payableEmployees.map((employee) => ({
        ...calculatePayrollLine({ employee, payrollRunId: run.id, taxTable, benefitPlans, statutoryContributionRules }),
        status: "Computed",
      })),
    );

    toast(`Payroll run ${run.runNo} computed for ${payableEmployees.length} employee(s).`);
  };

  const handleSubmitPayrollRunForReview = (run: PayrollRun) => {
    const runLines = payrollLines.filter((line) => line.payrollRunId === run.id);
    if (runLines.length === 0) {
      toast("Cannot submit this payroll run because it has no payroll lines.", { variant: "warning" });
      return;
    }
    if (run.id === latestPayrollRun?.id && payrollExceptionRows.some((row) => row.severity === "Blocking")) {
      toast("Resolve blocking payroll exceptions before submitting for review.", { variant: "warning" });
      return;
    }
    updatePayrollRunStatus(run.id, "For Review", currentUser?.name ?? "Payroll Staff");
    toast(`Payroll run ${run.runNo} submitted for review.`);
  };

  const handleApprovePayrollRun = (run: PayrollRun) => {
    if (run.status !== "For Review") {
      toast("Payroll run must be submitted for review before it can be approved.", { variant: "warning" });
      return;
    }
    updatePayrollRunStatus(run.id, "Approved", currentUser?.name ?? "Payroll Approver");
    toast(`Payroll run ${run.runNo} approved.`);
  };

  const handleCreatePayoutBatch = (run: PayrollRun) => {
    if (run.status !== "Approved") {
      toast("Only approved payroll runs can create payout batches.", { variant: "warning" });
      return;
    }
    if (run.id === latestPayrollRun?.id && payrollExceptionRows.some((row) => row.severity === "Blocking")) {
      toast("Resolve blocking payroll exceptions before payout batch creation.", { variant: "warning" });
      return;
    }
    if (salaryPayoutBatches.some((batch) => batch.payrollRunId === run.id && batch.status !== "Cancelled")) {
      toast(`A payout batch already exists for ${run.runNo}.`, { variant: "warning" });
      return;
    }
    const approvedLines = payrollLines.filter((line) => line.payrollRunId === run.id && line.status === "Approved");
    if (approvedLines.length === 0) {
      toast("No approved payroll lines are available for payout.", { variant: "warning" });
      return;
    }

    const batch = addSalaryPayoutBatch({
      payrollRunId: run.id,
      payoutNo: `PO-${run.runNo.replace(/^PR-/, "")}`,
      payoutMethod: "Bank Transfer",
      status: "Queued",
      notes: `Created from approved payroll run ${run.runNo}.`,
    });
    addSalaryPayoutLines(
      approvedLines.map((line) => ({
        payoutBatchId: batch.id,
        payrollLineId: line.id,
        employeeId: line.employeeId,
        amount: line.netPay,
        status: "Pending",
      })),
    );
    toast(`Payout batch ${batch.payoutNo} queued for ${approvedLines.length} employee(s).`);
  };

  const handleRunPayrollPeriod = () => {
    processGlobalPayroll();
    toast("Legacy bi-weekly payroll ledger processed. Use Generate Payroll Run for the approved payout workflow.");
  };

  const payrollRunColumns = useMemo<AppTableLegacyColumn<PayrollRun>[]>(() => [
    { title: "Run #", data: "runNo", render: (value) => <span className="font-mono text-xs font-bold text-stsn-brown">{value}</span> },
    {
      title: "Period",
      render: (_, row) => {
        const period = payrollPeriods.find((p) => p.id === row.payrollPeriodId);
        return <span className="text-xs text-stone-600">{period?.label ?? period?.periodCode ?? row.payrollPeriodId}</span>;
      },
    },
    {
      title: "Status",
      data: "status",
      render: (value) => <AppStatusBadge status={String(value)} className="text-[10px]" />,
      width: "95px",
    },
    {
      title: "Net Pay",
      render: (_, row) => {
        const total = payrollLines.filter((line) => line.payrollRunId === row.id).reduce((sum, line) => sum + line.netPay, 0);
        return <span className="payroll-money-cell font-mono text-xs font-bold text-stsn-brown">PHP {total.toLocaleString()}</span>;
      },
      className: "payroll-money-cell",
      width: "130px",
    },
    {
      title: "Actions",
      orderable: false,
      searchable: false,
      render: (_, row) => {
        const hasBatch = salaryPayoutBatches.some((batch) => batch.payrollRunId === row.id && batch.status !== "Cancelled");
        return (
          <div className="flex gap-1 justify-end">
            {row.status === "Computed" && (
              <button onClick={() => handleSubmitPayrollRunForReview(row)} className="px-2 py-1 text-[10px] bg-amber-600 text-white rounded font-bold cursor-pointer">
                Submit for Review
              </button>
            )}
            {row.status === "For Review" && (
              <button onClick={() => handleApprovePayrollRun(row)} className="px-2 py-1 text-[10px] bg-stsn-brown text-stsn-cream rounded font-bold cursor-pointer">
                Approve
              </button>
            )}
            {row.status === "Approved" && !hasBatch && (
              <button onClick={() => handleCreatePayoutBatch(row)} className="px-2 py-1 text-[10px] bg-stsn-brown text-white rounded font-bold cursor-pointer">
                Create Payout
              </button>
            )}
            {hasBatch && <span className="text-[10px] text-stone-400 font-semibold">Payout queued</span>}
          </div>
        );
      },
    },
  ], [payrollLines, payrollPeriods, salaryPayoutBatches]);

  const payrollLineColumns = useMemo<AppTableLegacyColumn<PayrollLine>[]>(() => [
    {
      title: "Employee",
      render: (_, row) => {
        const employee = employeeMap.get(row.employeeId);
        return <span className="text-xs font-semibold text-stone-800">{employee ? `${employee.lastName}, ${employee.firstName}` : row.employeeId}</span>;
      },
    },
    {
      title: "Gross",
      data: "grossPay",
      className: "payroll-money-cell",
      render: (value) => <span className="payroll-money-cell font-mono text-xs">PHP {Number(value).toLocaleString()}</span>,
      width: "120px",
    },
    {
      title: "Deductions",
      className: "payroll-money-cell",
      render: (_, row) => <span className="payroll-money-cell font-mono text-xs text-red-600">PHP {(row.sssDeduction + row.philhealthDeduction + row.pagibigDeduction + row.withholdingTax + row.otherDeductions).toLocaleString()}</span>,
      width: "130px",
    },
    {
      title: "Net Pay",
      data: "netPay",
      className: "payroll-money-cell",
      render: (value) => <span className="payroll-money-cell font-mono text-xs font-bold text-stsn-brown">PHP {Number(value).toLocaleString()}</span>,
      width: "120px",
    },
    { title: "Status", data: "status", render: (value) => <AppStatusBadge status={String(value)} className="text-[10px]" />, width: "90px" },
  ], [employeeMap]);

  const payrollExceptionColumns = useMemo<AppTableLegacyColumn<{ issue: string; detail: string; severity: "Warning" | "Blocking" }>[]>(() => [
    { title: "Issue", data: "issue", render: (value) => <span className="text-xs font-bold text-stone-800">{value}</span> },
    { title: "Detail", data: "detail", render: (value) => <span className="text-xs text-stone-500">{value}</span> },
    {
      title: "Severity",
      data: "severity",
      render: (value) => (
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${value === "Blocking" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
          {value}
        </span>
      ),
      width: "95px",
    },
  ], []);

  const payrollColumns = useMemo<AppTableLegacyColumn<PayrollRow>[]>(() => [
    { title: "Period Range", data: "period", className: "text-stone-800 font-semibold" },
    {
      title: "Gross Pay",
      data: "basicSalary",
      className: "payroll-money-cell font-mono text-stone-600",
      render: (value: number) => `₱${value.toLocaleString()}`,
    },
    {
      title: "Deduction",
      className: "payroll-money-cell font-mono text-red-500",
      orderable: false,
      render: (_value, row) => {
        const totalDeducts = row.sssDeduction + row.philhealthDeduction + row.pagibigDeduction + row.taxDeduction;
        return `-₱${totalDeducts.toLocaleString()}`;
      },
    },
    {
      title: "Net takehome",
      data: "netPay",
      className: "payroll-money-cell font-mono font-bold text-stsn-brown-dark",
      render: (value: number) => `₱${value.toLocaleString()}`,
    },
    {
      title: "Clearance Status",
      data: "status",
      className: "text-center",
      render: (value: PayrollRow["status"], row) => (
        <span
          className={`inline-block text-[9.5px] font-bold px-2 py-0.5 rounded-full ${
            value === "Paid" ? "bg-green-50 text-green-700 border border-green-200" : "bg-amber-50 text-amber-700 border border-red-200 cursor-pointer"
          }`}
          onClick={() => {
            if (value === "Pending") {
              markPaidPayroll(row.id);
              toast("Disbursement status marked as PAID!");
            }
          }}
        >
          {value === "Paid" ? "Cleared (Paid)" : "Disburse (Pending)"}
        </span>
      ),
    },
    {
      title: "Certificate",
      className: "text-right",
      orderable: false,
      searchable: false,
      render: (_value, row) => (
        <button
          onClick={() => {
            setSelectedPayslipRow(row);
            setIsPayslipOpen(true);
          }}
          className="bg-stsn-brown hover:bg-stsn-brown-dark text-stsn-cream text-[10px] font-bold py-1 px-2.5 rounded cursor-pointer transition"
        >
          View Payslip
        </button>
      ),
    },
  ], [markPaidPayroll, toast]);

  return (
    <div className="space-y-6 animate-fade-in font-sans">

      {/* Dynamic Title Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-white border border-stsn-beige rounded-xl shadow-sm gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-stsn-gold font-bold">
            HR Compensation Center
          </span>
          <h2 className="text-xl font-display font-semibold text-stone-900 tracking-tight flex items-center gap-2 mt-1">
            <Banknote className="w-5 h-5 text-stsn-brown" />
            Payroll Management
          </h2>
          <p className="text-stone-500 text-xs mt-1">
            Review scoped employee compensation, process payroll runs, and issue payslips from one controlled workspace.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleGeneratePayrollRun}
            className="bg-stsn-brown hover:bg-stsn-brown-dark text-stsn-cream text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer shadow flex items-center gap-1.5 transition"
          >
            <Sparkles className="w-4 h-4" />
            Generate Payroll Run
          </button>
          <button
            onClick={handleRunPayrollPeriod}
            className="bg-white hover:bg-stone-50 text-stsn-brown border border-stone-200 text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer shadow flex items-center gap-1.5 transition"
          >
            <Banknote className="w-4 h-4 text-stsn-gold-light" />
            Legacy Ledger Run
          </button>
          <button
            onClick={() => { setImportStatus("idle"); setImportRows([]); setImportMessage(""); setIsImportOpen(true); }}
            className="bg-stsn-brown hover:bg-stsn-brown-dark text-stsn-cream text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer flex items-center gap-1.5 transition shadow"
          >
            <Upload className="w-4 h-4" />
            Upload Employee
          </button>
          <button
            onClick={() => { resetForm(); setIsNewEmpOpen(true); }}
            className="bg-white hover:bg-stone-50 text-stsn-brown border border-stone-200 text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer flex items-center gap-1 transition"
          >
            <Plus className="w-4 h-4" />
            Add Employee
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            label: "Scoped Employees",
            value: filteredEmployees.length,
            sub: effectiveSchool || "All Schools",
            icon: Users,
            tone: "text-stsn-brown",
            tile: "bg-gradient-to-br from-white to-stsn-cream border-stsn-beige",
            iconTile: "bg-stsn-cream border-stsn-beige",
          },
          {
            label: "Monthly Payroll",
            value: `PHP ${projectedMonthlyPayroll.toLocaleString()}`,
            sub: "gross projection",
            icon: DollarSign,
            tone: "text-stsn-gold",
            tile: "bg-gradient-to-br from-white to-amber-50 border-stsn-gold/40",
            iconTile: "bg-amber-50 border-stsn-gold/30",
          },
          {
            label: "Latest Run Net",
            value: `PHP ${latestRunNetPay.toLocaleString()}`,
            sub: latestPayrollRun?.status ?? "no computed run",
            icon: Scale,
            tone: "text-stsn-brown",
            tile: "bg-gradient-to-br from-white to-stone-50 border-stsn-brown/20",
            iconTile: "bg-stone-50 border-stsn-brown/15",
          },
          {
            label: "Payout Readiness",
            value: latestRunHasPayout ? "Queued" : latestPayrollRun?.status === "Approved" ? "Ready" : "Locked",
            sub: latestPayrollPeriod?.label ?? "awaiting run",
            icon: FileCheck,
            tone: "text-stsn-gold",
            tile: "bg-gradient-to-br from-white to-stsn-cream border-stsn-gold/30",
            iconTile: "bg-white/80 border-stsn-gold/30",
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className={`${item.tile} rounded-xl border shadow-sm p-4 flex items-center gap-3`}>
              <div className={`${item.iconTile} w-10 h-10 rounded-lg border flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${item.tone}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-stone-400 uppercase font-mono">{item.label}</p>
                <p className="text-lg font-display font-black text-stone-900 truncate">{item.value}</p>
                <p className="text-[10px] text-stone-400">{item.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white p-6 rounded-xl border border-stsn-beige shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-stsn-gold font-bold">
              Payroll Run Workflow
            </span>
            <h3 className="text-sm font-display font-bold text-stone-900 mt-1">
              Periods, computed lines, approval, and payout handoff
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              New payroll processing now uses payroll periods, runs, and lines. Payout batches can only be created after approval.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {latestPayrollRun?.status === "Computed" && (
              <button
                onClick={() => handleSubmitPayrollRunForReview(latestPayrollRun)}
                className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Submit for Review
              </button>
            )}
            {latestPayrollRun?.status === "For Review" && (
              <button
                onClick={() => handleApprovePayrollRun(latestPayrollRun)}
                className="px-3 py-2 bg-stsn-brown hover:bg-stsn-brown-dark text-stsn-cream rounded-lg text-xs font-bold cursor-pointer"
              >
                Approve Latest Run
              </button>
            )}
            {latestPayrollRun?.status === "Approved" && !latestRunHasPayout && (
              <button
                onClick={() => handleCreatePayoutBatch(latestPayrollRun)}
                className="px-3 py-2 bg-stsn-brown hover:bg-stsn-brown-dark text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Create Payout Batch
              </button>
            )}
          </div>
        </div>

        <div className="border border-stone-100 rounded-xl overflow-hidden p-1">
          <div className="px-3 pt-3 pb-2 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-mono text-stone-400">Payroll Exceptions</p>
              <p className="text-xs text-stone-500">Review blocking and warning conditions before approval or payout.</p>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${payrollExceptionRows.some((row) => row.severity === "Blocking") ? "bg-red-50 text-red-700" : "bg-stsn-cream text-stsn-brown"}`}>
              {payrollExceptionRows.length} issue(s)
            </span>
          </div>
          <AppTable<{ issue: string; detail: string; severity: "Warning" | "Blocking" }>
            columns={appTableColumnsFromLegacy(payrollExceptionColumns)}
            data={payrollExceptionRows}
            emptyMessage="No payroll exceptions detected."
            loading={false}
            initialPageSize={5}
            pageSizeOptions={[5]}
            compact
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-stretch">
          <div className="payroll-workflow-table-card border border-stone-100 rounded-xl overflow-hidden p-1 flex flex-col min-h-[420px]">
            <div className="absolute left-4 top-4 z-10 pointer-events-none">
              <p className="text-[10px] uppercase font-mono text-stone-400">
                Payroll runs
              </p>
            </div>
            <AppTable<PayrollRun>
              columns={appTableColumnsFromLegacy(payrollRunColumns)}
              data={scopedPayrollRuns}
              emptyMessage="No payroll runs yet. Generate a payroll run to start the controlled workflow."
              loading={false}
              initialPageSize={5}
              pageSizeOptions={[5]}
              getRowId={(row) => row.id}
              compact
              className="payroll-workflow-table"
            />
          </div>
          <div className="payroll-workflow-table-card border border-stone-100 rounded-xl overflow-hidden p-1 flex flex-col min-h-[420px]">
            <div className="absolute left-4 top-4 z-10 pointer-events-none">
              <p className="text-[10px] uppercase font-mono text-stone-400">
                Latest run lines {latestPayrollRun ? `for ${latestPayrollRun.runNo}` : ""}
              </p>
            </div>
            <AppTable<PayrollLine>
              columns={appTableColumnsFromLegacy(payrollLineColumns)}
              data={latestPayrollRunLines}
              emptyMessage="No computed payroll lines for the latest run."
              loading={false}
              initialPageSize={5}
              pageSizeOptions={[5]}
              getRowId={(row) => row.id}
              compact
              className="payroll-workflow-table"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left column: Staff directory list */}
        <div className="bg-white p-5 rounded-xl border border-stsn-beige shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-display font-bold text-stone-900">Payroll Roster</h3>
              <p className="text-[10px] text-stone-400 font-mono uppercase tracking-wide">{filteredEmployees.length} employee records</p>
            </div>
            <span className="text-[10px] px-2 py-1 rounded-full bg-stsn-cream text-stsn-brown border border-stsn-beige font-bold">
              {effectiveSchool || "ALL"}
            </span>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 text-stone-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search faculty / support staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-md py-1.5 pl-8 pr-3 text-xs focus:ring-1 focus:ring-stsn-brown focus:outline-none focus:border-stsn-brown font-semibold text-stone-800"
            />
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredEmployees.map((emp) => {
              const isSelected = selectedEmpId === emp.id;

              return (
                <div
                  key={emp.id}
                  onClick={() => setSelectedEmpId(emp.id)}
                  className={`p-3 rounded-xl cursor-pointer transition flex items-center justify-between border ${
                    isSelected ? "bg-stsn-cream border-stsn-gold shadow-sm" : "bg-white border-stone-100 hover:bg-stone-50 hover:border-stsn-beige"
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-[10px] font-mono text-stone-400 block tracking-wider uppercase font-semibold">{emp.department} Bureau</span>
                    <span className="text-xs font-bold text-stone-900 truncate block">{emp.lastName}, {emp.firstName}</span>
                    <span className="text-[9.5px] text-stone-500 truncate block">{emp.position}</span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="bg-stsn-beige/40 text-[10px] text-stsn-brown font-bold rounded-full px-2 py-0.5">
                      {emp.status}
                    </span>
                    <span className="text-[9.5px] text-stone-400 block font-mono mt-1">₱{emp.salary.toLocaleString()}/mo</span>
                  </div>
                </div>
              );
            })}
            {filteredEmployees.length === 0 && (
              <EmptyState
                icon={Users}
                title="No Employees Found"
                description="No employees match the current search or school scope. Adjust your filters or add employee records first."
                compact
              />
            )}
          </div>
        </div>

        {/* Central & Right details */}
        {activeEmpObj ? (
          <div className="lg:col-span-2 space-y-6">

            <div className="bg-white p-6 rounded-xl border border-stsn-beige shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-stsn-brown text-stsn-cream flex items-center justify-center font-display font-black text-lg">
                  {activeEmpObj.firstName.charAt(0)}{activeEmpObj.lastName.charAt(0)}
                </div>
                <div>
                  <p className="text-[10px] uppercase font-mono tracking-wider text-stone-400 font-bold">
                    Selected Employee
                  </p>
                  <h3 className="text-lg font-display font-bold text-stone-900">
                    {activeEmpObj.lastName}, {activeEmpObj.firstName}
                  </h3>
                  <p className="text-xs text-stone-500">
                    {activeEmpObj.department} / {activeEmpObj.positionTitle || activeEmpObj.position}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-right">
                <div className="bg-stone-50 border border-stone-100 rounded-lg px-4 py-2">
                  <p className="text-[10px] text-stone-400 uppercase font-mono">Monthly Salary</p>
                  <p className="text-sm font-mono font-bold text-stsn-brown">PHP {activeEmpObj.salary.toLocaleString()}</p>
                </div>
                <div className="bg-stone-50 border border-stone-100 rounded-lg px-4 py-2">
                  <p className="text-[10px] text-stone-400 uppercase font-mono">Status</p>
                  <p className="text-sm font-bold text-stone-800">{activeEmpObj.status}</p>
                </div>
              </div>
            </div>

            {/* Overview Card */}
            <div className="bg-white p-6 rounded-xl border border-stsn-beige shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">

              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block">Position / Authority</span>
                <div className="flex items-center gap-2 mt-1.5">
                  <Briefcase className="w-4 h-4 text-stsn-gold" />
                  <span className="text-xs font-semibold text-stone-900">{activeEmpObj.position}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block">Bi-weekly Gross Salary</span>
                <div className="flex items-center gap-2 mt-1.5">
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-stone-900">₱{(activeEmpObj.salary / 2).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block">Vacation Leave Balance</span>
                <div className="flex items-center gap-2 mt-1.5">
                  <FileCheck className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-semibold text-stone-900">{activeEmpObj.leaveBalance} Days ACC</span>
                </div>
              </div>

            </div>

            {/* Payslips register table */}
            <div className="bg-white p-6 rounded-xl border border-stsn-beige shadow-sm">
              <h3 className="font-display font-bold text-sm text-stone-900 uppercase pb-2 border-b border-stone-100 flex justify-between items-center">
                <span>Personal Bi-weekly Payroll Ledger</span>
                <span className="text-[10px] text-stone-400 font-mono tracking-wide">Select payroll period to view/print slip</span>
              </h3>

              <div className="mt-4">
                <AppTable<PayrollRow>
                  columns={appTableColumnsFromLegacy(payrollColumns)}
                  data={employeePayrollList}
                  emptyMessage='No payroll schedules logged. Try hitting "Process Global Payroll" in the header bar above.'
                  loading={false}
                  initialPageSize={10}
                  pageSizeOptions={[10]}
                  getRowId={(row) => row.id}
                />
              </div>
            </div>

          </div>
        ) : (
          <div className="bg-white p-12 rounded-xl border border-stsn-beige shadow-sm text-center lg:col-span-2">
            <Users className="w-10 h-10 text-stone-300 mx-auto" />
            <p className="text-xs text-stone-400 mt-2 font-semibold">Ready to review personnel profile sheets.</p>
          </div>
        )}

      </div>

      {/* NEW EMPLOYEE REGISTER MODAL */}
      {isNewEmpOpen && (
        <div className="app-modal-backdrop z-50 animate-fade-in">
          <form onSubmit={handleRegisterEmployee} className="bg-white rounded-2xl shadow-2xl border border-stone-200 text-stone-800 w-full max-w-lg overflow-hidden animate-fade-in font-sans max-h-[90vh] flex flex-col">
            <div className="modal-header-gradient text-white p-4 flex items-center justify-between flex-shrink-0">
              <h3 className="font-display font-semibold text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-stsn-gold" />
                Register New Administrative Staff
              </h3>
              <button type="button" onClick={() => setIsNewEmpOpen(false)} className="text-white/70 hover:text-white hover:bg-white/10 rounded-lg p-1 cursor-pointer transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 bg-stsn-cream space-y-3 overflow-y-auto flex-1">
              {/* Name Row */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">First Name <span className="text-red-400">*</span></label>
                  <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Maria" className="w-full bg-white border border-stone-200 rounded-lg py-1.5 px-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Middle Name</label>
                  <input type="text" value={middleName} onChange={(e) => setMiddleName(e.target.value)} placeholder="Santos" className="w-full bg-white border border-stone-200 rounded-lg py-1.5 px-2.5 text-xs font-semibold focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Last Name <span className="text-red-400">*</span></label>
                  <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Dela Cruz" className="w-full bg-white border border-stone-200 rounded-lg py-1.5 px-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown" />
                </div>
              </div>

              {/* Position + Salary */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Position Title</label>
                  <select value={position} onChange={(e) => { setPosition(e.target.value); setPositionTitle(e.target.value); }} className="w-full bg-white border border-stone-200 rounded-lg py-1.5 px-2 text-xs font-semibold focus:outline-none">
                    {positionTitleOptions.map((p) => (
                      <option key={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Monthly Salary (PHP)</label>
                  <input type="number" min={0} value={salary} onChange={(e) => setSalary(Number(e.target.value))} className="w-full bg-white border border-stone-200 rounded-lg py-1.5 px-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown" />
                </div>
              </div>

              {/* Dept + Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Department</label>
                  <select value={dept} onChange={(e: any) => setDept(e.target.value)} className="w-full bg-white border border-stone-200 rounded-lg py-1.5 px-2 text-xs font-semibold focus:outline-none">
                    <option value="College">College</option>
                    <option value="Basic Education">Basic Education</option>
                    <option value="Accounting">Accounting</option>
                    <option value="Registrar">Registrar</option>
                    <option value="HR">HR Dept</option>
                    <option value="Administration">Administration</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Contract Status</label>
                  <select value={status} onChange={(e: any) => setStatus(e.target.value)} className="w-full bg-white border border-stone-200 rounded-lg py-1.5 px-2 text-xs font-semibold focus:outline-none">
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Contractual">Contractual</option>
                  </select>
                </div>
              </div>

              {/* Contact + Address */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1 flex items-center gap-1"><Phone className="w-3 h-3" /> Contact Number</label>
                <input type="text" value={empContact} onChange={(e) => setEmpContact(e.target.value)} placeholder="+639171234567" className="w-full bg-white border border-stone-200 rounded-lg py-1.5 px-2.5 text-xs font-semibold focus:outline-none" />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Address</label>
                <input type="text" value={empAddress} onChange={(e) => setEmpAddress(e.target.value)} placeholder="#5 Rizal St., Novaliches, QC" className="w-full bg-white border border-stone-200 rounded-lg py-1.5 px-2.5 text-xs font-semibold focus:outline-none" />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1 flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> Emergency Contact</label>
                <input type="text" value={empEmergencyContact} onChange={(e) => setEmpEmergencyContact(e.target.value)} placeholder="Pedro Santos +639281234567" className="w-full bg-white border border-stone-200 rounded-lg py-1.5 px-2.5 text-xs font-semibold focus:outline-none" />
              </div>

              <button type="submit" className="w-full bg-stsn-brown hover:bg-stsn-brown-dark text-stsn-cream text-xs font-bold py-2.5 rounded-xl transition mt-1 cursor-pointer">
                Register Employee Record
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EXCEL/CSV IMPORT MODAL */}
      {isImportOpen && (
        <div className="app-modal-backdrop z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col animate-fade-in">
            {/* Header */}
            <div className="modal-header-gradient text-white p-4 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-stsn-gold" />
                  Upload Employee Records — Excel / CSV Import
                </h3>
                <p className="text-[10px] text-white/60 mt-0.5 font-mono">Supports .CSV files. Download template for the correct column format.</p>
              </div>
              <button onClick={() => setIsImportOpen(false)} className="text-white cursor-pointer hover:bg-white/10 rounded-lg p-1.5 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {importStatus === "idle" && (
                <div className="space-y-4">
                  {/* Template download */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-emerald-800">Download Import Template</p>
                      <p className="text-[10px] text-emerald-600 mt-0.5">CSV format with required columns and 2 sample rows</p>
                    </div>
                    <button onClick={handleDownloadTemplate} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer transition">
                      <Download className="w-3.5 h-3.5" />
                      Download Template
                    </button>
                  </div>

                  {/* Required columns info */}
                  <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
                    <p className="text-xs font-bold text-stone-700 mb-2">Required Columns (in order):</p>
                    <div className="grid grid-cols-2 gap-1">
                      {["First Name", "Middle Name", "Last Name", "Position Title", "Monthly Salary", "Department", "Contract Status", "Contact", "Address", "Emergency Contact"].map((col, i) => (
                        <div key={col} className="flex items-center gap-1.5 text-[10px] text-stone-600">
                          <span className="w-5 h-5 rounded-full bg-stsn-brown text-white flex items-center justify-center font-bold text-[9px] flex-shrink-0">{i + 1}</span>
                          <span className="font-medium">{col}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Upload area */}
                  <div
                    className="border-2 border-dashed border-stone-200 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-400 transition-all"
                    onClick={() => fileImportRef.current?.click()}
                  >
                    <Upload className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-stone-600">Click to select CSV file</p>
                    <p className="text-xs text-stone-400 mt-1">Supports: .CSV files (XLSX/XLS coming soon)</p>
                    <input
                      ref={fileImportRef}
                      type="file"
                      accept=".csv,.txt"
                      className="hidden"
                      onChange={handleFileImport}
                    />
                  </div>
                </div>
              )}

              {importStatus === "preview" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-stone-800">{importRows.length} rows detected</p>
                    <div className="flex gap-2 text-[10px]">
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full font-bold">{importRows.filter((r) => !r._error).length} valid</span>
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full font-bold">{importRows.filter((r) => r._error).length} errors</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto max-h-80 rounded-xl border border-stone-200">
                    <table className="w-full text-[10px]">
                      <thead className="bg-stone-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left font-bold text-stone-500 uppercase tracking-wide">Import Status</th>
                          <th className="px-3 py-2 text-left font-bold text-stone-500 uppercase tracking-wide">Name</th>
                          <th className="px-3 py-2 text-left font-bold text-stone-500 uppercase tracking-wide">Position</th>
                          <th className="px-3 py-2 text-left font-bold text-stone-500 uppercase tracking-wide">Salary</th>
                          <th className="px-3 py-2 text-left font-bold text-stone-500 uppercase tracking-wide">Department</th>
                          <th className="px-3 py-2 text-left font-bold text-stone-500 uppercase tracking-wide">Contract Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-50">
                        {importRows.map((r, i) => (
                          <tr key={i} className={r._error ? "bg-red-50" : "hover:bg-stone-50"}>
                            <td className="px-3 py-2">
                              {r._error
                                ? <span className="flex items-center gap-1 text-red-600 font-bold"><AlertCircle className="w-3 h-3" /> Error</span>
                                : <span className="flex items-center gap-1 text-emerald-600 font-bold"><CheckCircle className="w-3 h-3" /> OK</span>
                              }
                              {r._error && <p className="text-[9px] text-red-500 mt-0.5">{r._error}</p>}
                            </td>
                            <td className="px-3 py-2 font-semibold text-stone-800">{r.firstName} {r.middleName} {r.lastName}</td>
                            <td className="px-3 py-2 text-stone-600">{r.positionTitle}</td>
                            <td className="px-3 py-2 font-mono text-stone-600">₱{parseFloat(r.monthlySalary || "0").toLocaleString()}</td>
                            <td className="px-3 py-2 text-stone-600">{r.department}</td>
                            <td className="px-3 py-2"><span className="px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-600 font-semibold">{r.contractStatus}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setImportStatus("idle"); setImportRows([]); }} className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-xs font-medium cursor-pointer hover:bg-stone-50 transition">
                      Cancel / Re-upload
                    </button>
                    <button
                      onClick={handleConfirmImport}
                      disabled={importRows.filter((r) => !r._error).length === 0}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition disabled:opacity-50"
                    >
                      Import {importRows.filter((r) => !r._error).length} Valid Records
                    </button>
                  </div>
                </div>
              )}

              {importStatus === "success" && (
                <div className="text-center py-8">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-7 h-7 text-emerald-600" />
                  </div>
                  <h3 className="text-base font-bold text-stone-800 mb-1">Import Successful!</h3>
                  <p className="text-xs text-stone-500">{importMessage}</p>
                  <button onClick={() => setIsImportOpen(false)} className="mt-4 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition">
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PAYSLIP MODAL DIRECT FORM PREVIEW */}
      {isPayslipOpen && selectedPayslipRow && activeEmpObj && (
        <PreviewModal
          isOpen={isPayslipOpen}
          onClose={() => setIsPayslipOpen(false)}
          title="Print official paycheck document coupon"
        >
          <PayslipPreview
            employee={activeEmpObj}
            row={selectedPayslipRow}
          />
        </PreviewModal>
      )}

    </div>
  );
}

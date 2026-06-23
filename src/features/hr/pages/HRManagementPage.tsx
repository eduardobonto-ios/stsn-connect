/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { useSTSNStore } from "../../../services/store";
import { useAppDialog } from "../../../components/common/useAppDialog";
import { Employee, PayrollRow } from "../../../types";
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
import { PreviewModal, PayslipPreview } from "../../../components/ModalPreviews";
import STSNDataTable, { type STSNColumn } from "../../../components/common/STSNDataTable";

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

export default function HRManagement() {
  const {
    employees,
    payroll,
    addEmployee,
    updateEmployee,
    markPaidPayroll,
    processGlobalPayroll,
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
  const filteredEmployees = employees.filter((e) => {
    if (effectiveSchool && e.schoolId && e.schoolId !== effectiveSchool) return false;
    const fullName = `${e.firstName} ${e.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || e.position.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const activeEmpObj = employees.find((e) => e.id === selectedEmpId);
  const employeePayrollList = payroll.filter((p) => p.employeeId === selectedEmpId);

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

  const handleRunPayrollPeriod = () => {
    processGlobalPayroll();
    toast("Bi-weekly payroll successfully processed for all active employees!");
  };

  const payrollColumns: STSNColumn<PayrollRow>[] = [
    { title: "Period Range", data: "period", className: "text-stone-800 font-semibold" },
    {
      title: "Gross Pay",
      data: "basicSalary",
      className: "text-center font-mono text-stone-600",
      render: (value: number) => `₱${value.toLocaleString()}`,
    },
    {
      title: "Deduction",
      className: "text-center font-mono text-red-500",
      orderable: false,
      render: (_value, row) => {
        const totalDeducts = row.sssDeduction + row.philhealthDeduction + row.pagibigDeduction + row.taxDeduction;
        return `-₱${totalDeducts.toLocaleString()}`;
      },
    },
    {
      title: "Net takehome",
      data: "netPay",
      className: "text-center font-mono font-bold text-stsn-brown-dark",
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
  ];

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* Dynamic Title Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-white border border-stsn-beige rounded-xl shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-display font-semibold text-stone-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-stsn-brown" />
            Human Resources & Staff Payroll Registry
          </h2>
          <p className="text-stone-500 text-xs mt-1">
            Maintain employee records, process automated salary disbursements, and clear municipal withholding deductions.
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleRunPayrollPeriod}
            className="bg-stsn-brown hover:bg-stsn-brown-dark text-stsn-cream text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer shadow flex items-center gap-1.5 transition"
          >
            <Banknote className="w-4 h-4 text-stsn-gold-light" />
            Process Global Payroll
          </button>
          <button
            onClick={() => { setImportStatus("idle"); setImportRows([]); setImportMessage(""); setIsImportOpen(true); }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer flex items-center gap-1.5 transition shadow"
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Staff directory list */}
        <div className="bg-white p-6 rounded-xl border border-stsn-beige shadow-sm space-y-4">
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

          <div className="divide-y divide-stone-100 max-h-[420px] overflow-y-auto pr-1">
            {filteredEmployees.map((emp) => {
              const worksInCollege = emp.department === "College" || emp.department === "Basic Education";
              const isSelected = selectedEmpId === emp.id;
              
              return (
                <div
                  key={emp.id}
                  onClick={() => setSelectedEmpId(emp.id)}
                  className={`p-3 rounded-lg cursor-pointer transition flex items-center justify-between ${
                    isSelected ? "bg-stsn-cream border border-stsn-beige" : "hover:bg-stone-50"
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-[10px] font-mono text-stone-400 block tracking-wider uppercase font-semibold">{emp.department} Bureau</span>
                    <span className="text-xs font-bold text-stone-900 truncate block">{emp.lastName}, {emp.firstName}</span>
                    <span className="text-[9.5px] text-stone-500 truncate block">{emp.position}</span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="bg-stsn-beige/40 text-[10px] text-stsn-brown font-bold rounded px-2 py-0.5">
                      {emp.status}
                    </span>
                    <span className="text-[9.5px] text-stone-400 block font-mono mt-1">₱{emp.salary.toLocaleString()}/mo</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Central & Right details */}
        {activeEmpObj ? (
          <div className="lg:col-span-2 space-y-6">
            
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
                <STSNDataTable<PayrollRow>
                  columns={payrollColumns}
                  rows={employeePayrollList}
                  emptyMessage='No payroll schedules logged. Try hitting "Process Global Payroll" in the header bar above.'
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
                          <th className="px-3 py-2 text-left font-bold text-stone-500 uppercase tracking-wide">Status</th>
                          <th className="px-3 py-2 text-left font-bold text-stone-500 uppercase tracking-wide">Name</th>
                          <th className="px-3 py-2 text-left font-bold text-stone-500 uppercase tracking-wide">Position</th>
                          <th className="px-3 py-2 text-left font-bold text-stone-500 uppercase tracking-wide">Salary</th>
                          <th className="px-3 py-2 text-left font-bold text-stone-500 uppercase tracking-wide">Department</th>
                          <th className="px-3 py-2 text-left font-bold text-stone-500 uppercase tracking-wide">Status</th>
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

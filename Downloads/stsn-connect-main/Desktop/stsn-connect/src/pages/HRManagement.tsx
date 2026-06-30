/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useSTSNStore } from "../services/store";
import { Employee, PayrollRow } from "../types";
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
  BookOpen
} from "lucide-react";
import { PreviewModal, PayslipPreview } from "../components/ModalPreviews";

export default function HRManagement() {
  const {
    employees,
    payroll,
    addEmployee,
    updateEmployee,
    markPaidPayroll,
    processGlobalPayroll
  } = useSTSNStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmpId, setSelectedEmpId] = useState<string>("emp-registrar");
  
  // Registration Dialog States
  const [isNewEmpOpen, setIsNewEmpOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [position, setPosition] = useState("Instructor");
  const [dept, setDept] = useState<"Basic Education" | "College" | "Accounting" | "Registrar" | "HR" | "Administration">("College");
  const [status, setStatus] = useState<"Full-Time" | "Part-Time" | "Contractual">("Full-Time");
  const [salary, setSalary] = useState(30000);

  // Payslip Preview states
  const [isPayslipOpen, setIsPayslipOpen] = useState(false);
  const [selectedPayslipRow, setSelectedPayslipRow] = useState<PayrollRow | null>(null);

  const filteredEmployees = employees.filter((e) => {
    const fullName = `${e.firstName} ${e.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || e.position.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const activeEmpObj = employees.find((e) => e.id === selectedEmpId);
  const employeePayrollList = payroll.filter((p) => p.employeeId === selectedEmpId);

  const handleRegisterEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || salary <= 0) return;

    addEmployee({
      firstName,
      lastName,
      middleName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@stsn.edu.ph`,
      position,
      department: dept,
      salary: Number(salary),
      status,
      leaveBalance: 15
    });

    setIsNewEmpOpen(false);
    setFirstName("");
    setLastName("");
    setMiddleName("");
    setSalary(30000);
  };

  const handleRunPayrollPeriod = () => {
    processGlobalPayroll();
    alert("Bi-weekly payroll successfully processed for all active employees!");
  };

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
            onClick={() => setIsNewEmpOpen(true)}
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

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs border border-stone-50 rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-100 font-bold text-stone-500 text-[10px] uppercase">
                      <th className="p-3">Period Range</th>
                      <th className="p-3 text-center">Gross Pay</th>
                      <th className="p-3 text-center text-red-500">Deduction</th>
                      <th className="p-3 text-center">Net takehome</th>
                      <th className="p-3 text-center">Clearance Status</th>
                      <th className="p-3 text-right">Certificate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-medium">
                    {employeePayrollList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-stone-400 italic">No payroll schedules logged. Try hitting "Process Global Payroll" in the header bar above.</td>
                      </tr>
                    ) : (
                      employeePayrollList.map((row) => {
                        const totalDeducts = row.sssDeduction + row.philhealthDeduction + row.pagibigDeduction + row.taxDeduction;
                        return (
                          <tr key={row.id} className="hover:bg-stone-50/50">
                            <td className="p-3 text-stone-800 font-semibold">{row.period}</td>
                            <td className="p-3 text-center font-mono text-stone-600">₱{row.basicSalary.toLocaleString()}</td>
                            <td className="p-3 text-center font-mono text-red-500">-₱{totalDeducts.toLocaleString()}</td>
                            <td className="p-3 text-center font-mono font-bold text-stsn-brown-dark">₱{row.netPay.toLocaleString()}</td>
                            <td className="p-3 text-center">
                              <span className={`inline-block text-[9.5px] font-bold px-2 py-0.5 rounded-full ${
                                row.status === "Paid" ? "bg-green-50 text-green-700 border border-green-200" : "bg-amber-50 text-amber-700 border border-red-200 cursor-pointer"
                              }`}
                                onClick={() => {
                                  if (row.status === "Pending") {
                                    markPaidPayroll(row.id);
                                    alert("Disbursement status marked as PAID!");
                                  }
                                }}
                              >
                                {row.status === "Paid" ? "Cleared (Paid)" : "Disburse (Pending)"}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => {
                                  setSelectedPayslipRow(row);
                                  setIsPayslipOpen(true);
                                }}
                                className="bg-stsn-brown hover:bg-stsn-brown-dark text-stsn-cream text-[10px] font-bold py-1 px-2.5 rounded cursor-pointer transition"
                              >
                                View Payslip
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <form onSubmit={handleRegisterEmployee} className="bg-white border text-stone-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in font-sans">
            <div className="bg-stsn-brown text-stsn-cream p-4 flex items-center justify-between">
              <h3 className="font-display font-semibold text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-stsn-gold" />
                Register New Administrative Staff
              </h3>
              <button type="button" onClick={() => setIsNewEmpOpen(false)} className="text-stsn-cream">
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <div className="p-6 bg-stsn-cream space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Gemma"
                    className="w-full bg-white border border-stone-200 rounded py-1.5 px-2.5 text-xs font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Santos"
                    className="w-full bg-white border border-stone-200 rounded py-1.5 px-2.5 text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Position Title</label>
                  <input
                    type="text"
                    required
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="Librarian"
                    className="w-full bg-white border border-stone-200 rounded py-1.5 px-2.5 text-xs font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Monthly Salary (PHP)</label>
                  <input
                    type="number"
                    required
                    min={18000}
                    value={salary}
                    onChange={(e) => setSalary(Number(e.target.value))}
                    className="w-full bg-white border border-stone-200 rounded py-1.5 px-2.5 text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Department</label>
                  <select
                    value={dept}
                    onChange={(e: any) => setDept(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded py-1.5 px-2 text-xs font-semibold focus:outline-none"
                  >
                    <option value="College">College</option>
                    <option value="Basic Education">Basic Education</option>
                    <option value="Accounting">Accounting</option>
                    <option value="Registrar">Registrar</option>
                    <option value="HR">HR Dept</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Contract Status</label>
                  <select
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded py-1.5 px-2 text-xs font-semibold focus:outline-none"
                  >
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Contractual">Contractual</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-stsn-brown hover:bg-stsn-brown-dark text-stsn-cream text-xs font-bold py-2 rounded-lg transition"
              >
                Assemble contract record
              </button>
            </div>
          </form>
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

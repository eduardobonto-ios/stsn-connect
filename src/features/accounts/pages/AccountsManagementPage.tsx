/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useSTSNStore } from "../../../services/store";
import { User } from "../../../types";
import { Shield, ShieldAlert, CheckCircle, Search, ToggleLeft, ToggleRight, Sparkles, Award } from "lucide-react";
import PageHeader from "../../../components/common/PageHeader";
import { useAppDialog } from "../../../components/common/useAppDialog";
import STSNDataTable, { type STSNColumn } from "../../../components/common/STSNDataTable";

export default function AccountsManagement() {
  const { users, toggleUserStatus, addUser } = useSTSNStore();
  const { toast } = useAppDialog();
  const [searchQuery, setSearchQuery] = useState("");

  // Registration Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"SUPER_ADMIN" | "REGISTRAR" | "ACCOUNTING" | "TEACHER" | "STUDENT" | "HR" | "EMPLOYEE" | "CASHIER" | "GUIDANCE" | "NURSE">("STUDENT");

  const filteredUsers = users.filter((u) => {
    return u.email.toLowerCase().includes(searchQuery.toLowerCase()) || u.role.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleCreateCredential = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;

    addUser({
      id: "user-" + Math.random().toString(36).substring(2, 9),
      name,
      email,
      role,
      isActive: true
    });

    setIsFormOpen(false);
    setEmail("");
    setName("");
  };

  const userColumns: STSNColumn<User>[] = [
    { title: "Personal User Email", data: "email", className: "font-mono font-bold text-stsn-brown" },
    {
      title: "Display Label",
      data: "name",
      className: "font-semibold text-stone-900",
      render: (value) => value || "Default user name",
    },
    {
      title: "Role",
      data: "role",
      render: (value: string) => (
        <span className="bg-stsn-beige text-stsn-brown font-mono text-[9px] font-bold rounded px-2.5 py-0.5 uppercase tracking-wide">
          {value.replace("_", " ")}
        </span>
      ),
    },
    {
      title: "Account Status",
      data: "isActive",
      className: "text-center",
      render: (value: boolean) => (
        <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full ${
          value ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-750 border border-red-200"
        }`}>
          {value ? "Active" : "Deactivated"}
        </span>
      ),
    },
    {
      title: "Actions",
      className: "text-right",
      orderable: false,
      searchable: false,
      render: (_value, u) => {
        const isActive = u.isActive;
        return (
          <button
            onClick={() => {
              toggleUserStatus(u.email);
              toast(`Successfully toggled account access for: ${u.email}`);
            }}
            className={`text-xs font-semibold py-1 px-3 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition ${
              isActive
                ? "bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 ml-auto"
                : "bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 ml-auto"
            }`}
          >
            {isActive ? (
              <>
                <ToggleRight className="w-4 h-4 text-red-550" />
                Block Access
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4 text-green-550" />
                Grant Access
              </>
            )}
          </button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in font-sans">

      <PageHeader
        icon={Shield}
        title="User Access & Authority"
        description="Audit credential levels, activate/deactivate user records, and assign digital workspace parameters."
      >
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-stsn-brown hover:bg-stsn-brown-dark text-stsn-cream text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer shadow flex items-center gap-2 transition"
        >
          <Award className="w-4 h-4 text-stsn-gold-light" />
          Provision New Authority
        </button>
      </PageHeader>

      <div className="bg-white p-6 rounded-xl border border-stsn-beige shadow-sm space-y-4">

        {/* Search header bar */}
        <div className="flex justify-between items-center bg-stone-50 p-2.5 rounded-lg border border-stone-200">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 text-stone-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search login profiles by email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-md py-1.5 pl-8 pr-3 text-xs focus:ring-1 focus:ring-stsn-brown focus:outline-none focus:border-stsn-brown font-semibold text-stone-800"
            />
          </div>
          <span className="text-[10px] text-stone-400 font-mono">Count: {filteredUsers.length} profiles</span>
        </div>

        {/* Credentials ledger list */}
        <STSNDataTable<User>
          columns={userColumns}
          rows={filteredUsers}
          emptyMessage="No login profiles found."
        />

      </div>

      {/* NEW PROVISIONING DIALOG FORM MODAL */}
      {isFormOpen && (
        <div className="app-modal-backdrop z-50 animate-fade-in">
          <form onSubmit={handleCreateCredential} className="bg-white rounded-2xl shadow-2xl border border-stone-200 text-stone-800 w-full max-w-md overflow-hidden animate-fade-in font-sans">
            <div className="modal-header-gradient text-white p-4 flex items-center justify-between">
              <h3 className="font-display font-semibold text-base flex items-center gap-2">
                <Shield className="w-5 h-5 text-stsn-gold" />
                Provision Workspace Credentials
              </h3>
              <button type="button" onClick={() => setIsFormOpen(false)} className="text-white/70 hover:text-white hover:bg-white/10 rounded-lg p-1 transition">
                <ShieldAlert className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <div className="p-6 bg-stsn-cream space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Display Username Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="E.g. Vice Chancellor of Academics"
                  className="w-full bg-white border border-stone-200 rounded py-2 px-3 text-xs font-semibold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Academic Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="chancellor@stsn.edu.ph"
                  className="w-full bg-white border border-stone-200 rounded py-2 px-3 text-xs font-semibold focus:outline-none"
                />
                <span className="text-[9px] text-stone-400 font-mono mt-1 block">Default preconfigured password: "password123"</span>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Assigned Security Clearance Role</label>
                <select
                  value={role}
                  onChange={(e: any) => setRole(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded py-1.5 px-2 text-xs font-semibold focus:outline-none"
                >
                  <option value="SUPER_ADMIN">SUPER_ADMIN (General Chancellor)</option>
                  <option value="REGISTRAR">REGISTRAR (Admissions Dean)</option>
                  <option value="ACCOUNTING">ACCOUNTING (Treasurer Bureau)</option>
                  <option value="CASHIER">CASHIER (Collection Window)</option>
                  <option value="TEACHER">TEACHER (Licensed Faculty LPT)</option>
                  <option value="HR">HR (Personnel Lead)</option>
                  <option value="GUIDANCE">GUIDANCE (Guidance Office)</option>
                  <option value="NURSE">NURSE (Clinic Office)</option>
                  <option value="STUDENT">STUDENT (Admitted Candidate)</option>
                  <option value="EMPLOYEE">EMPLOYEE (Support Staff)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-stsn-brown hover:bg-stsn-brown-dark text-stsn-cream text-xs font-bold py-2 rounded-lg transition"
              >
                Clear security check & Add User
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}

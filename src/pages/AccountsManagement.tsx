/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useSTSNStore } from "../services/store";
import { User } from "../types";
import { Shield, ShieldAlert, CheckCircle, Search, ToggleLeft, ToggleRight, Sparkles, Award } from "lucide-react";

export default function AccountsManagement() {
  const { users, toggleUserStatus, addUser } = useSTSNStore();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Registration Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"SUPER_ADMIN" | "REGISTRAR" | "ACCOUNTING" | "TEACHER" | "STUDENT" | "HR" | "EMPLOYEE">("STUDENT");

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

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-white border border-stsn-beige rounded-xl shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-display font-semibold text-stone-900 tracking-tight flex items-center gap-2">
            <Shield className="w-5 h-5 text-stsn-brown" />
            Educational Authority Accounts & Access Clearances
          </h2>
          <p className="text-stone-500 text-xs mt-1">
            Audit credential levels, activate/deactivate user records, and assign digital workspace parameters.
          </p>
        </div>

        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-stsn-brown hover:bg-stsn-brown-dark text-stsn-cream text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer shadow flex items-center gap-2 transition"
        >
          <Award className="w-4 h-4 text-stsn-gold-light" />
          Provision New Authority
        </button>
      </div>

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
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-stone-100 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100 font-bold text-stone-500 text-[10px] uppercase">
                <th className="p-3">Personal User Email</th>
                <th className="p-3">Display Label</th>
                <th className="p-3">Assigned Authority Level</th>
                <th className="p-3 text-center">Security Status</th>
                <th className="p-3 text-right">Access Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {filteredUsers.map((u) => {
                const isActive = u.isActive;
                return (
                  <tr key={u.email} className="hover:bg-stone-50/50">
                    <td className="p-3 font-mono font-bold text-stsn-brown">{u.email}</td>
                    <td className="p-3 font-semibold text-stone-900">{u.name || "Default user name"}</td>
                    <td className="p-3 text-left">
                      <span className="bg-stsn-beige text-stsn-brown font-mono text-[9px] font-bold rounded px-2.5 py-0.5 uppercase tracking-wide">
                        {u.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        isActive ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-750 border border-red-200"
                      }`}>
                        {isActive ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          toggleUserStatus(u.email);
                          alert(`Successfully toggled account access for: ${u.email}`);
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
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* NEW PROVISIONING DIALOG FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <form onSubmit={handleCreateCredential} className="bg-white border text-stone-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in font-sans">
            <div className="bg-stsn-brown text-stsn-cream p-4 flex items-center justify-between">
              <h3 className="font-display font-semibold text-base flex items-center gap-2">
                <Shield className="w-5 h-5 text-stsn-gold" />
                Provision Workspace Credentials
              </h3>
              <button type="button" onClick={() => setIsFormOpen(false)} className="text-stsn-cream">
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
                  <option value="TEACHER">TEACHER (Licensed Faculty LPT)</option>
                  <option value="HR">HR (Personnel Lead)</option>
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

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useSTSNStore } from "../../../services/store";
import type { User, UserRole } from "../../../types";
import {
  Shield, ShieldOff, Search, ToggleLeft, ToggleRight,
  Award, ArrowRightLeft, History, UserCircle2, Mail, Lock, Unlock,
} from "lucide-react";
import ModulePageHeader from "../../../components/common/ModulePageHeader";
import { useAppDialog } from "../../../components/common/useAppDialog";
import STSNDataTable, { type STSNColumn } from "../../../components/common/STSNDataTable";
import DataTableCard from "../../../components/common/DataTableCard";
import AppModal from "../../../components/common/AppModal";
import AppFormField from "../../../components/common/AppFormField";
import DrilldownDrawer from "../../../components/common/DrilldownDrawer";
import DelegationManagementPage from "../../admin/pages/DelegationManagementPage";
import AuditLogPage from "../../admin/pages/AuditLogPage";

export type AccountsSubPage = "user-security" | "delegation-management" | "audit-log";

interface AccountsManagementProps {
  subPage?: AccountsSubPage;
  onSubPageChange?: (subPage: AccountsSubPage) => void;
}

const TABS: { id: AccountsSubPage; label: string; icon: React.ElementType }[] = [
  { id: "user-security",         label: "User Security",    icon: Shield         },
  { id: "delegation-management", label: "Delegation Mgmt",  icon: ArrowRightLeft },
  { id: "audit-log",             label: "Audit Log",        icon: History        },
];

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "SUPER_ADMIN", label: "SUPER_ADMIN — General Chancellor"     },
  { value: "REGISTRAR",   label: "REGISTRAR — Admissions Dean"          },
  { value: "ACCOUNTING",  label: "ACCOUNTING — Treasurer Bureau"        },
  { value: "CASHIER",     label: "CASHIER — Collection Window"          },
  { value: "PAYROLL",     label: "PAYROLL — Payroll Officer"            },
  { value: "TEACHER",     label: "TEACHER — Licensed Faculty LPT"       },
  { value: "HR",          label: "HR — Personnel Lead"                  },
  { value: "GUIDANCE",    label: "GUIDANCE — Guidance Office"           },
  { value: "NURSE",       label: "NURSE — Clinic Office"                },
  { value: "STUDENT",     label: "STUDENT — Admitted Candidate"         },
  { value: "EMPLOYEE",    label: "EMPLOYEE — Support Staff"             },
];

export default function AccountsManagement({ subPage = "user-security", onSubPageChange }: AccountsManagementProps) {
  const { users, toggleUserStatus, addUser } = useSTSNStore();
  const { toast, confirm } = useAppDialog();
  const [searchQuery, setSearchQuery] = useState("");

  // Provisioning modal state
  const [isFormOpen, setIsFormOpen]   = useState(false);
  const [isSaving, setIsSaving]       = useState(false);
  const [email, setEmail]             = useState("");
  const [name, setName]               = useState("");
  const [role, setRole]               = useState<UserRole>("STUDENT");

  // Drilldown drawer state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const activeTab = subPage;
  const setActiveTab = (tab: AccountsSubPage) => onSubPageChange?.(tab);

  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleToggleStatus = async (u: User) => {
    const action = u.isActive ? "block" : "restore";
    const ok = await confirm(
      `${u.isActive ? "Block" : "Grant"} access for ${u.name ?? u.email}?\n\nThis will immediately ${u.isActive ? "prevent" : "restore"} their ability to sign in.`,
    );
    if (!ok) return;
    toggleUserStatus(u.email);
    toast(`Access ${action === "block" ? "blocked" : "granted"} for ${u.email}`, {
      variant: action === "block" ? "warning" : "success",
    });
    if (selectedUser?.id === u.id) {
      setSelectedUser((prev) => prev ? { ...prev, isActive: !prev.isActive } : null);
    }
  };

  const handleCreateCredential = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !name) return;
    setIsSaving(true);
    addUser({
      id: "user-" + Math.random().toString(36).substring(2, 9),
      name,
      email,
      role,
      isActive: true,
    });
    toast(`Credentials provisioned for ${name}`, { variant: "success" });
    setIsFormOpen(false);
    setEmail("");
    setName("");
    setRole("STUDENT");
    setIsSaving(false);
  };

  const inputClass =
    "w-full bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold text-stone-800 focus:outline-none focus:ring-1 focus:ring-stsn-gold/50 focus:border-stsn-gold/60 placeholder:text-stone-400 transition";

  const userColumns: STSNColumn<User>[] = [
    {
      title: "Email",
      data: "email",
      className: "font-mono font-bold text-stsn-brown text-xs",
    },
    {
      title: "Name",
      data: "name",
      className: "font-semibold text-stone-900",
      render: (v: string) => v || "—",
    },
    {
      title: "Role",
      data: "role",
      render: (v: string) => (
        <span className="bg-stsn-beige text-stsn-brown font-mono text-[9px] font-bold rounded px-2.5 py-0.5 uppercase tracking-wide">
          {v.replace("_", " ")}
        </span>
      ),
    },
    {
      title: "Status",
      data: "isActive",
      className: "text-center",
      render: (v: boolean) => (
        <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full ${
          v ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {v ? "Active" : "Deactivated"}
        </span>
      ),
    },
    {
      title: "Actions",
      className: "text-right",
      orderable: false,
      searchable: false,
      render: (_v: unknown, u: User) => (
        <button
          onClick={(e) => { e.stopPropagation(); handleToggleStatus(u); }}
          className={`text-xs font-semibold py-1 px-3 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition ml-auto ${
            u.isActive
              ? "bg-red-50 hover:bg-red-100 border border-red-200 text-red-700"
              : "bg-green-50 hover:bg-green-100 border border-green-200 text-green-700"
          }`}
        >
          {u.isActive
            ? <><ToggleRight className="w-4 h-4" />Block</>
            : <><ToggleLeft className="w-4 h-4" />Restore</>}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <ModulePageHeader
        badge="System Administration"
        badgeIcon={Shield}
        title="User Access & Authority"
        subtitle="Audit credential levels, activate/deactivate user records, manage delegation, and review audit history."
        actions={
          activeTab === "user-security" ? (
            <button
              onClick={() => setIsFormOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C5A059] hover:bg-[#d4af68] text-[#1C1512] rounded-xl text-sm font-bold shadow-lg transition cursor-pointer"
            >
              <Award className="w-4 h-4" />
              Provision New Authority
            </button>
          ) : undefined
        }
      />

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-stone-200">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-t-lg border border-b-0 transition -mb-px ${
                isActive
                  ? "bg-white border-stone-200 text-stsn-brown shadow-sm"
                  : "bg-transparent border-transparent text-stone-400 hover:text-stone-600"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* User Security tab */}
      {activeTab === "user-security" && (
        <DataTableCard
          title="Provisioned User Profiles"
          icon={Shield}
          subtitle="All credentialed system users — click a row to view details"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search by email, name, or role…"
          actions={
            <span className="text-[10px] text-stone-400 font-mono whitespace-nowrap">
              {filteredUsers.length} profile{filteredUsers.length !== 1 ? "s" : ""}
            </span>
          }
          bodyClassName="p-4"
        >
          <STSNDataTable<User>
            columns={userColumns}
            rows={filteredUsers}
            searchable={false}
            emptyMessage="No login profiles found."
            onRowClick={(u) => setSelectedUser(u)}
            tableId="accounts-users"
          />
        </DataTableCard>
      )}

      {/* Delegation Management tab */}
      {activeTab === "delegation-management" && <DelegationManagementPage />}

      {/* Audit Log tab */}
      {activeTab === "audit-log" && <AuditLogPage />}

      {/* Provisioning modal — AppModal with panelAs="form" */}
      <AppModal
        open={isFormOpen}
        title="Provision Workspace Credentials"
        eyebrow="User Management"
        icon={Shield}
        onClose={() => { setIsFormOpen(false); setEmail(""); setName(""); setRole("STUDENT"); }}
        panelAs="form"
        onSubmit={handleCreateCredential}
        maxWidthClass="max-w-md"
        bodyClassName="p-5 bg-stsn-cream space-y-4"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 text-xs font-bold rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !email || !name}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-stsn-brown hover:bg-stsn-brown-dark text-stsn-cream transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Provisioning…" : "Provision User"}
            </button>
          </div>
        }
      >
        <AppFormField label="Display Name *">
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Vice Chancellor of Academics"
            className={inputClass}
          />
        </AppFormField>
        <AppFormField
          label="Academic Email Address *"
          hint='Default password will be "password123" — instruct user to change immediately.'
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="chancellor@stsn.edu.ph"
            className={inputClass}
          />
        </AppFormField>
        <AppFormField label="Assigned Security Clearance Role *">
          <select
            value={role}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRole(e.target.value as UserRole)}
            className={inputClass}
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </AppFormField>
      </AppModal>

      {/* User detail drilldown drawer */}
      <DrilldownDrawer
        open={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title={selectedUser?.name ?? selectedUser?.email ?? "User Detail"}
        subtitle={selectedUser?.email}
        width="sm"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-3">
              <div className="flex items-center gap-3 pb-2 border-b border-stone-100">
                <div className="w-11 h-11 rounded-full bg-stsn-cream border border-stsn-beige flex items-center justify-center flex-shrink-0">
                  <UserCircle2 className="w-6 h-6 text-stsn-brown" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-stone-800 truncate">{selectedUser.name ?? "—"}</p>
                  <p className="text-[10px] font-mono text-stone-400 truncate">{selectedUser.email}</p>
                </div>
              </div>
              <dl className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <dt className="text-[10px] font-mono font-bold uppercase text-stone-400">Role</dt>
                  <dd>
                    <span className="bg-stsn-beige text-stsn-brown font-mono text-[9px] font-bold rounded px-2 py-0.5 uppercase tracking-wide">
                      {selectedUser.role.replace("_", " ")}
                    </span>
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-[10px] font-mono font-bold uppercase text-stone-400">Status</dt>
                  <dd>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      selectedUser.isActive
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}>
                      {selectedUser.isActive ? "Active" : "Deactivated"}
                    </span>
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-[10px] font-mono font-bold uppercase text-stone-400">User ID</dt>
                  <dd className="font-mono text-[10px] text-stone-400">{selectedUser.id}</dd>
                </div>
              </dl>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleToggleStatus(selectedUser)}
                className={`w-full flex items-center justify-center gap-2 text-xs font-bold py-2.5 px-4 rounded-xl border transition cursor-pointer ${
                  selectedUser.isActive
                    ? "bg-red-50 hover:bg-red-100 border-red-200 text-red-700"
                    : "bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
                }`}
              >
                {selectedUser.isActive
                  ? <><Lock className="w-3.5 h-3.5" /> Block Access</>
                  : <><Unlock className="w-3.5 h-3.5" /> Grant Access</>}
              </button>
              <p className="text-[10px] text-stone-400 text-center leading-snug">
                {selectedUser.isActive
                  ? "Blocking prevents this user from signing in immediately."
                  : "Granting access allows this user to sign in again."}
              </p>
            </div>

            <div className="bg-white rounded-xl border border-stone-200 p-4">
              <h3 className="text-[10px] font-mono font-bold uppercase text-stone-400 mb-2 flex items-center gap-1.5">
                <Mail className="w-3 h-3" /> Contact
              </h3>
              <a
                href={`mailto:${selectedUser.email}`}
                className="text-xs font-mono text-stsn-brown hover:underline break-all"
              >
                {selectedUser.email}
              </a>
            </div>
          </div>
        )}
      </DrilldownDrawer>
    </div>
  );
}

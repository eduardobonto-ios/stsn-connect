/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  ArrowRightLeft,
  Award,
  History,
  Lock,
  Mail,
  Shield,
  ToggleLeft,
  ToggleRight,
  Unlock,
  UserCircle2,
} from "lucide-react";
import AppCard from "../../../components/common/AppCard";
import ModulePageHeader from "../../../components/common/ModulePageHeader";
import AppButton from "../../../components/common/AppButton";
import AppFormField from "../../../components/common/AppFormField";
import AppInput from "../../../components/common/AppInput";
import AppModal from "../../../components/common/AppModal";
import AppSearchInput from "../../../components/common/AppSearchInput";
import AppSelect from "../../../components/common/AppSelect";
import AppStatusBadge from "../../../components/common/AppStatusBadge";
import AppTable, { type AppTableColumn } from "../../../components/common/AppTable";
import AppTabs from "../../../components/common/AppTabs";
import DrilldownDrawer from "../../../components/common/DrilldownDrawer";
import { useAppDialog } from "../../../components/common/useAppDialog";
import { useSTSNStore } from "../../../services/store";
import type { User, UserRole } from "../../../types";
import AuditLogPage from "../../admin/pages/AuditLogPage";
import DelegationManagementPage from "../../admin/pages/DelegationManagementPage";

export type AccountsSubPage = "user-security" | "delegation-management" | "audit-log";

interface AccountsManagementProps {
  subPage?: AccountsSubPage;
  onSubPageChange?: (subPage: AccountsSubPage) => void;
}

const TABS: { id: AccountsSubPage; label: string; icon: React.ElementType }[] = [
  { id: "user-security", label: "User Security", icon: Shield },
  { id: "delegation-management", label: "Delegation Mgmt", icon: ArrowRightLeft },
  { id: "audit-log", label: "Audit Log", icon: History },
];

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "SUPER_ADMIN", label: "SUPER_ADMIN - General Chancellor" },
  { value: "REGISTRAR", label: "REGISTRAR - Admissions Dean" },
  { value: "ACCOUNTING", label: "ACCOUNTING - Treasurer Bureau" },
  { value: "CASHIER", label: "CASHIER - Collection Window" },
  { value: "PAYROLL", label: "PAYROLL - Payroll Officer" },
  { value: "TEACHER", label: "TEACHER - Licensed Faculty LPT" },
  { value: "HR", label: "HR - Personnel Lead" },
  { value: "GUIDANCE", label: "GUIDANCE - Guidance Office" },
  { value: "NURSE", label: "NURSE - Clinic Office" },
  { value: "STUDENT", label: "STUDENT - Admitted Candidate" },
  { value: "EMPLOYEE", label: "EMPLOYEE - Support Staff" },
];

export default function AccountsManagement({
  subPage = "user-security",
  onSubPageChange,
}: AccountsManagementProps) {
  const { users, toggleUserStatus, addUser } = useSTSNStore();
  const { toast, confirm } = useAppDialog();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("STUDENT");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const activeTab = subPage;
  const setActiveTab = (tab: AccountsSubPage) => onSubPageChange?.(tab);

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleToggleStatus = async (user: User) => {
    const action = user.isActive ? "block" : "restore";
    const ok = await confirm(
      `${user.isActive ? "Block" : "Grant"} access for ${user.name ?? user.email}?\n\nThis will immediately ${
        user.isActive ? "prevent" : "restore"
      } their ability to sign in.`,
    );
    if (!ok) return;

    toggleUserStatus(user.email);
    toast(`Access ${action === "block" ? "blocked" : "granted"} for ${user.email}`, {
      variant: action === "block" ? "warning" : "success",
    });

    if (selectedUser?.id === user.id) {
      setSelectedUser((previous) => (previous ? { ...previous, isActive: !previous.isActive } : null));
    }
  };

  const handleCreateCredential = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || !name) return;

    setIsSaving(true);
    addUser({
      id: `user-${Math.random().toString(36).substring(2, 9)}`,
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

  const userColumns: AppTableColumn<User>[] = [
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ getValue }) => (
        <span className="font-mono font-bold text-stsn-brown text-xs">{String(getValue())}</span>
      ),
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ getValue }) => (
        <span className="font-semibold text-stone-900">{getValue<string | undefined>() || "-"}</span>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ getValue }) => (
        <AppStatusBadge status={String(getValue()).replace("_", " ")} className="text-[9px]">
          {String(getValue()).replace("_", " ")}
        </AppStatusBadge>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ getValue }) => {
        const isActive = getValue<boolean>();
        return (
          <AppStatusBadge status={isActive ? "Active" : "Inactive"} className="inline-flex text-[9px]">
            {isActive ? "Active" : "Deactivated"}
          </AppStatusBadge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      enableGlobalFilter: false,
      cell: ({ row }) => {
        const user = row.original;
        return (
          <AppButton
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              handleToggleStatus(user);
            }}
            variant={user.isActive ? "danger-outline" : "secondary"}
            size="xs"
            className={user.isActive ? "" : "text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200"}
          >
            {user.isActive ? (
              <>
                <ToggleRight className="w-4 h-4" />
                Block
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4" />
                Restore
              </>
            )}
          </AppButton>
        );
      },
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
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5">
                <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/55">
                  Provisioned Users
                </p>
                <p className="mt-1 text-lg font-semibold text-white">{users.length}</p>
              </div>
              <AppButton onClick={() => setIsFormOpen(true)} leftIcon={Award}>
                Provision New Authority
              </AppButton>
            </div>
          ) : undefined
        }
      />

      <AppTabs<AccountsSubPage>
        items={TABS.map((tab) => ({ value: tab.id, label: tab.label }))}
        value={activeTab}
        onChange={setActiveTab}
        variant="pill"
      />

      {activeTab === "user-security" && (
        <AppTable<User>
          data={filteredUsers}
          columns={userColumns}
          title="Provisioned User Profiles"
          description="All credentialed system users - click a row to view details"
          enableSearch={false}
          enableColumnVisibility={false}
          initialPageSize={10}
          pageSizeOptions={[10]}
          loading={false}
          emptyMessage="No login profiles found."
          emptyDescription="Adjust the search query to find user profiles."
          getRowId={(row) => row.id}
          onRowClick={(row) => setSelectedUser(row)}
          searchPlaceholder="Search by email, name, or role..."
          toolbar={
            <>
              <AppSearchInput
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onClear={() => setSearchQuery("")}
                placeholder="Search by email, name, or role..."
                aria-label="Search user profiles"
                uiSize="sm"
                wrapperClassName="min-w-[256px]"
              />
              <span className="text-[10px] text-stone-400 font-mono whitespace-nowrap">
                {filteredUsers.length} profile{filteredUsers.length !== 1 ? "s" : ""}
              </span>
            </>
          }
        />
      )}

      {activeTab === "delegation-management" && <DelegationManagementPage />}
      {activeTab === "audit-log" && <AuditLogPage />}

      <AppModal
        open={isFormOpen}
        title="Provision Workspace Credentials"
        eyebrow="User Management"
        icon={Shield}
        onClose={() => {
          setIsFormOpen(false);
          setEmail("");
          setName("");
          setRole("STUDENT");
        }}
        panelAs="form"
        onSubmit={handleCreateCredential}
        maxWidthClass="max-w-md"
        bodyClassName="p-5 bg-stsn-cream space-y-4"
        footer={
          <div className="flex justify-end gap-2">
            <AppButton type="button" onClick={() => setIsFormOpen(false)} variant="secondary" size="sm">
              Cancel
            </AppButton>
            <AppButton type="submit" loading={isSaving} disabled={!email || !name} size="sm">
              Provision User
            </AppButton>
          </div>
        }
      >
        <AppFormField label="Display Name *">
          <AppInput
            type="text"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Vice Chancellor of Academics"
            className="w-full"
          />
        </AppFormField>
        <AppFormField
          label="Academic Email Address *"
          hint='Default password will be "password123" - instruct user to change immediately.'
        >
          <AppInput
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="chancellor@stsn.edu.ph"
            className="w-full"
          />
        </AppFormField>
        <AppFormField label="Assigned Security Clearance Role *">
          <AppSelect
            value={role}
            onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setRole(event.target.value as UserRole)}
            className="w-full"
          >
            {ROLE_OPTIONS.map((roleOption) => (
              <option key={roleOption.value} value={roleOption.value}>
                {roleOption.label}
              </option>
            ))}
          </AppSelect>
        </AppFormField>
      </AppModal>

      <DrilldownDrawer
        open={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title={selectedUser?.name ?? selectedUser?.email ?? "User Detail"}
        subtitle={selectedUser?.email}
        width="sm"
      >
        {selectedUser && (
          <div className="space-y-4">
            <AppCard className="border border-[var(--erp-border)]">
              <div className="flex items-center gap-3 pb-2 border-b border-stone-100">
                <div className="w-11 h-11 rounded-full bg-stsn-cream border border-stsn-beige flex items-center justify-center flex-shrink-0">
                  <UserCircle2 className="w-6 h-6 text-stsn-brown" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-stone-800 truncate">{selectedUser.name ?? "-"}</p>
                  <p className="text-[10px] font-mono text-stone-400 truncate">{selectedUser.email}</p>
                </div>
              </div>
              <dl className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <dt className="text-[10px] font-mono font-bold uppercase text-stone-400">Role</dt>
                  <dd>
                    <AppStatusBadge status={selectedUser.role.replace("_", " ")} className="text-[9px]">
                      {selectedUser.role.replace("_", " ")}
                    </AppStatusBadge>
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-[10px] font-mono font-bold uppercase text-stone-400">Status</dt>
                  <dd>
                    <AppStatusBadge
                      status={selectedUser.isActive ? "Active" : "Inactive"}
                      className="text-[9px]"
                    >
                      {selectedUser.isActive ? "Active" : "Deactivated"}
                    </AppStatusBadge>
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-[10px] font-mono font-bold uppercase text-stone-400">User ID</dt>
                  <dd className="font-mono text-[10px] text-stone-400">{selectedUser.id}</dd>
                </div>
              </dl>
            </AppCard>

            <div className="space-y-2">
              <AppButton
                onClick={() => handleToggleStatus(selectedUser)}
                fullWidth
                variant={selectedUser.isActive ? "danger-outline" : "secondary"}
                size="sm"
                className={
                  selectedUser.isActive ? "" : "text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200"
                }
              >
                {selectedUser.isActive ? (
                  <>
                    <Lock className="w-3.5 h-3.5" /> Block Access
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5" /> Grant Access
                  </>
                )}
              </AppButton>
              <p className="text-[10px] text-stone-400 text-center leading-snug">
                {selectedUser.isActive
                  ? "Blocking prevents this user from signing in immediately."
                  : "Granting access allows this user to sign in again."}
              </p>
            </div>

            <AppCard className="border border-[var(--erp-border)]">
              <h3 className="text-[10px] font-mono font-bold uppercase text-stone-400 mb-2 flex items-center gap-1.5">
                <Mail className="w-3 h-3" /> Contact
              </h3>
              <a
                href={`mailto:${selectedUser.email}`}
                className="text-xs font-mono text-stsn-brown hover:underline break-all"
              >
                {selectedUser.email}
              </a>
            </AppCard>
          </div>
        )}
      </DrilldownDrawer>
    </div>
  );
}

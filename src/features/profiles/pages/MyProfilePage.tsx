/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Global "My Profile" page — available to every authenticated user (Student,
 * Teacher, HR, Admin, Super Admin, …). Presents the signed-in account in a clean
 * two-column layout: a profile summary + professional details on the left, and
 * personal information, security settings, and a danger zone on the right.
 *
 * Scope guardrails:
 *   • Every identity field (Full Name, Email, Employee ID, Role, Department, …)
 *     is DISPLAY-ONLY here — profile/role/rights management lives in User Access
 *     & Authority, never on a user's own profile.
 *   • No new auth, permission, or migration logic. The only editable controls are
 *     the Security Settings (password + 2FA), which surface as local UI state
 *     only, since no backend API exists yet.
 */

import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Camera,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Share2,
  ShieldCheck,
  User,
} from "lucide-react";
import AppButton from "../../../components/common/AppButton";
import AppCard from "../../../components/common/AppCard";
import AppEmptyState from "../../../components/common/AppEmptyState";
import AppFormField from "../../../components/common/AppFormField";
import AppInput from "../../../components/common/AppInput";
import AppToggle from "../../../components/common/AppToggle";
import { useAppDialog } from "../../../components/common/useAppDialog";
import { useSTSNStore } from "../../../services/store";

function normalizeEmail(value?: string) {
  return value?.trim().toLowerCase() ?? "";
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "U";
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

/** SUPER_ADMIN → "SUPER ADMIN" (used for the read-only Role field). */
function formatRole(role: string) {
  return role.replace(/_/g, " ");
}

/** SUPER_ADMIN → "Super Admin" (used for the subtitle line). */
function titleCaseRole(role: string) {
  return role
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(value?: string) {
  if (!value) return "Not on record";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default function MyProfilePage() {
  const navigate = useNavigate();
  const { toast } = useAppDialog();
  const { currentUser, schools, teachers, employees, students } = useSTSNStore();

  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactor, setTwoFactor] = useState(true);

  // Lightweight linked-record lookups — used only to populate read-only detail
  // fields (Employee ID, Department, Date Joined). No workflow logic here.
  const linkedEmployee = useMemo(
    () =>
      employees.find(
        (e) => e.userId === currentUser?.id || normalizeEmail(e.email) === normalizeEmail(currentUser?.email),
      ) ?? null,
    [employees, currentUser?.id, currentUser?.email],
  );
  const linkedTeacher = useMemo(
    () =>
      teachers.find(
        (t) => t.userId === currentUser?.id || normalizeEmail(t.email) === normalizeEmail(currentUser?.email),
      ) ?? null,
    [teachers, currentUser?.id, currentUser?.email],
  );
  const linkedStudent = useMemo(
    () =>
      students.find(
        (s) => s.userId === currentUser?.id || normalizeEmail(s.email) === normalizeEmail(currentUser?.email),
      ) ?? null,
    [students, currentUser?.id, currentUser?.email],
  );

  if (!currentUser) {
    return (
      <AppEmptyState
        icon={User}
        title="Profile unavailable"
        description="Sign in to continue to your profile workspace."
      />
    );
  }

  const schoolLabel = schools.find((school) => school.id === currentUser.schoolId)?.shortName ?? null;
  const department =
    currentUser.department ?? linkedEmployee?.department ?? linkedTeacher?.department ?? "General";
  const employeeId = linkedEmployee?.employeeNo ?? linkedStudent?.studentNo ?? "Not assigned";
  const dateJoined = formatDate(linkedEmployee?.hireDate);
  const title = linkedEmployee?.positionTitle ?? linkedEmployee?.position ?? schoolLabel ?? "Member";
  const isActive = currentUser.isActive;

  const handleBack = () => navigate("/dashboard");

  const handleUpdatePassword = () => {
    if (!newPassword.trim()) {
      toast("Enter a new password first.", { variant: "warning" });
      return;
    }
    // No password API exists yet — acknowledge without pretending to persist.
    toast("Password changes aren't connected to the server yet.", { variant: "info" });
    setNewPassword("");
  };

  const handleTwoFactor = (next: boolean) => {
    setTwoFactor(next);
    toast(`Two-factor authentication ${next ? "enabled" : "disabled"} for this session.`, {
      variant: "info",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <nav className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--erp-text-muted)]">
            <button type="button" onClick={handleBack} className="hover:text-stsn-brown transition-colors">
              Dashboard
            </button>
            <span className="text-stone-300">›</span>
            <span className="text-[var(--erp-text)]">My Profile</span>
          </nav>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-[var(--erp-text)]">My Profile</h1>
        </div>
        <AppButton type="button" variant="outline" size="sm" leftIcon={ArrowLeft} onClick={handleBack}>
          Back to Dashboard
        </AppButton>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        {/* ── Left column ─────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Profile summary */}
          <AppCard className="border border-[var(--erp-border)] text-center">
            <div className="relative mx-auto w-fit">
              <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-[linear-gradient(135deg,#153B6B_0%,#0A2748_100%)] shadow-lg ring-1 ring-[var(--erp-border)] flex items-center justify-center">
                {currentUser.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl font-black tracking-[0.12em] text-white">
                    {getInitials(currentUser.name)}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => toast("Avatar upload isn't available yet.", { variant: "info" })}
                aria-label="Change photo"
                className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#0A2748] text-white shadow-md ring-2 ring-white hover:brightness-110 transition"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>

            <h2 className="mt-4 text-lg font-bold text-[var(--erp-text)]">{currentUser.name}</h2>
            <p className="mt-0.5 text-xs text-[var(--erp-text-muted)]">
              {titleCaseRole(currentUser.role)} <span className="text-stone-300">•</span> {title}
            </p>

            <div className="mt-4">
              <AppButton
                type="button"
                variant="secondary"
                size="sm"
                fullWidth
                leftIcon={Share2}
                onClick={() => toast("Profile sharing isn't available yet.", { variant: "info" })}
              >
                Share Profile
              </AppButton>
            </div>
          </AppCard>

          {/* Professional details */}
          <AppCard className="border border-[var(--erp-border)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
              Professional Details
            </p>
            <dl className="mt-4 space-y-4 text-xs">
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2 text-[var(--erp-text-muted)]">
                  <Building2 className="h-3.5 w-3.5" /> Department
                </dt>
                <dd className="font-semibold text-[var(--erp-text)]">{department}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2 text-[var(--erp-text-muted)]">
                  <Calendar className="h-3.5 w-3.5" /> Date Joined
                </dt>
                <dd className="font-semibold text-[var(--erp-text)]">{dateJoined}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2 text-[var(--erp-text-muted)]">
                  <ShieldCheck className="h-3.5 w-3.5" /> Session Status
                </dt>
                <dd className="flex items-center gap-1.5 font-semibold">
                  <span
                    className={`h-2 w-2 rounded-full ${isActive ? "bg-emerald-500" : "bg-stone-300"}`}
                    aria-hidden
                  />
                  <span className={isActive ? "text-emerald-600" : "text-stone-500"}>
                    {isActive ? "Active Now" : "Deactivated"}
                  </span>
                </dd>
              </div>
            </dl>
          </AppCard>
        </div>

        {/* ── Right column ────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Personal information */}
          <AppCard className="border border-[var(--erp-border)]">
            <div className="flex items-center justify-between gap-3 border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-stsn-brown" />
                <h3 className="text-sm font-bold text-[var(--erp-text)]">Personal Information</h3>
              </div>
              <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-sky-700">
                {employeeId}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <AppFormField label="Full Name" hint="Managed in User Access & Authority.">
                <AppInput value={currentUser.name} readOnly disabled className="bg-stone-50 text-stone-500" />
              </AppFormField>
              <AppFormField label="Email Address" hint="Managed in User Access & Authority.">
                <AppInput
                  type="email"
                  value={currentUser.email}
                  readOnly
                  disabled
                  className="bg-stone-50 text-stone-500"
                />
              </AppFormField>
              <AppFormField label="Employee ID" hint="System-assigned identifier.">
                <AppInput value={employeeId} readOnly disabled className="bg-stone-50 text-stone-500" />
              </AppFormField>
              <AppFormField label="Department" hint="Managed in User Access & Authority.">
                <AppInput value={department} readOnly disabled className="bg-stone-50 text-stone-500" />
              </AppFormField>
              <AppFormField label="Role" hint="Managed in User Access & Authority.">
                <div className="relative">
                  <AppInput
                    value={formatRole(currentUser.role)}
                    readOnly
                    disabled
                    className="bg-stone-50 pr-9 text-stone-500 cursor-default"
                  />
                  <Lock className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
                </div>
              </AppFormField>
            </div>
          </AppCard>

          {/* Security settings */}
          <AppCard className="border border-[var(--erp-border)]">
            <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
              <ShieldCheck className="h-4 w-4 text-stsn-brown" />
              <h3 className="text-sm font-bold text-[var(--erp-text)]">Security Settings</h3>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <AppFormField label="Current Password">
                <div className="relative">
                  <AppInput
                    type={showPassword ? "text" : "password"}
                    value="password123"
                    readOnly
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stsn-brown transition"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </AppFormField>
              <AppFormField label="New Password">
                <AppInput
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </AppFormField>
            </div>

            <div className="mt-3 flex justify-end">
              <AppButton
                type="button"
                variant="secondary"
                size="xs"
                leftIcon={KeyRound}
                disabled={!newPassword.trim()}
                onClick={handleUpdatePassword}
              >
                Update Password
              </AppButton>
            </div>

            <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-[var(--erp-border)] bg-[var(--erp-surface-muted)] p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white border border-[var(--erp-border)]">
                  <KeyRound className="h-4 w-4 text-stsn-brown" />
                </span>
                <div>
                  <p className="text-xs font-bold text-[var(--erp-text)]">Two-Factor Authentication</p>
                  <p className="mt-0.5 text-[11px] text-[var(--erp-text-muted)]">
                    Add an extra layer of security to your account.
                  </p>
                </div>
              </div>
              <AppToggle checked={twoFactor} onChange={handleTwoFactor} aria-label="Toggle two-factor authentication" />
            </div>
          </AppCard>
        </div>
      </div>
    </div>
  );
}

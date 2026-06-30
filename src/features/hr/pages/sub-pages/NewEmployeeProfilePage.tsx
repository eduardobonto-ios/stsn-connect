import React, { useEffect, useMemo, useState } from "react";
import { Briefcase, Building2, CircleDot, Link, UserRoundSearch } from "lucide-react";
import AppAutocompleteSelect, { type AppAutocompleteOption } from "../../../../components/common/AppAutocompleteSelect";
import AppCard from "../../../../components/common/AppCard";
import AppEmptyState from "../../../../components/common/AppEmptyState";
import AppFormField from "../../../../components/common/AppFormField";
import AppStatusBadge from "../../../../components/common/AppStatusBadge";
import ProfileInfoTile, { type ProfileInfoTileVariant } from "../../../../components/common/profile/ProfileInfoTile";
import ModulePageHeader from "../../../../components/common/ModulePageHeader";
import StaffProfileWorkspace from "../../../profiles/components/StaffProfileWorkspace";
import { useSTSNStore } from "../../../../services/store";

const EMPLOYMENT_STATUS_VARIANTS: Record<string, ProfileInfoTileVariant> = {
  active: "success",
  inactive: "danger",
  pending: "warning",
};

function resolveEmploymentStatusVariant(status?: string | null): ProfileInfoTileVariant {
  return EMPLOYMENT_STATUS_VARIANTS[status?.trim().toLowerCase() ?? ""] ?? "neutral";
}

export default function NewEmployeeProfilePage() {
  const { employees, teachers, isLoading } = useSTSNStore();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");

  useEffect(() => {
    if (!employees.length) {
      setSelectedEmployeeId("");
      return;
    }
    if (!selectedEmployeeId || !employees.some((employee) => employee.id === selectedEmployeeId)) {
      setSelectedEmployeeId(employees[0].id);
    }
  }, [employees, selectedEmployeeId]);

  const employeeOptions = useMemo<AppAutocompleteOption[]>(
    () =>
      employees.map((employee) => {
        const fullName = `${employee.lastName}, ${employee.firstName}`;
        const positionLabel = employee.positionTitle || employee.position || "Position pending";
        const statusLabel = employee.employmentStatus || employee.status || "Unknown";

        return {
          value: employee.id,
          label: `${employee.employeeNo || "NO-ID"} — ${fullName}`,
          description: `${positionLabel} • ${employee.department || "Unassigned"} • ${statusLabel}`,
          keywords: [
            employee.employeeNo,
            employee.firstName,
            employee.lastName,
            fullName,
            employee.email,
            employee.department,
            employee.position,
            employee.positionTitle,
            employee.employmentStatus,
            employee.status,
          ]
            .filter(Boolean)
            .join(" "),
          helperText: employee.email || undefined,
        };
      }),
    [employees],
  );

  const selectedEmployee = employees.find((employee) => employee.id === selectedEmployeeId) ?? null;
  const linkedTeacher = teachers.find((teacher) => teacher.email === selectedEmployee?.email) ?? null;

  return (
    <div className="space-y-6">
      <ModulePageHeader
        badge="HR New Hire Profile Workspace"
        badgeIcon={Briefcase}
        title="New Employee Profile"
        subtitle="Use the shared profile framework for newly hired staff records, requirements, and onboarding-ready details."
      />

      <AppCard className="space-y-4">
        <div className="flex flex-col gap-4 border-b border-[var(--erp-border)] pb-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--erp-text)]">Select employee record</p>
            <p className="text-xs text-[var(--erp-text-muted)]">Choose an employee to continue profile completion and requirements review.</p>
          </div>
          <AppStatusBadge status={`${employees.length} Employee Record${employees.length === 1 ? "" : "s"}`} />
        </div>

        {!isLoading && employees.length === 0 ? (
          <AppEmptyState
            icon={UserRoundSearch}
            title="No employee records matched."
            description="Create or import employee records first, then continue profile completion here."
            compact
          />
        ) : (
          <div className="space-y-4">
            <AppFormField
              label="Employee Record"
              hint="Type an employee no., employee name, email, department, or position to filter the record list instantly."
            >
              <AppAutocompleteSelect
                value={selectedEmployeeId}
                onChange={setSelectedEmployeeId}
                options={employeeOptions}
                placeholder="Search employee no., name, email, department, or position..."
                emptyMessage="No employee records found."
                loading={isLoading}
              />
            </AppFormField>

            <div className="rounded-2xl border border-[var(--erp-border)] bg-[linear-gradient(180deg,#fffdf6_0%,#ffffff_100%)] p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">Selected Employee Snapshot</p>
              {selectedEmployee ? (
                <div className="mt-3 space-y-3">
                  <div>
                    <p className="text-base font-semibold text-[var(--erp-text)]">{selectedEmployee.firstName} {selectedEmployee.lastName}</p>
                    <p className="text-xs text-[var(--erp-text-muted)]">{selectedEmployee.employeeNo || "Employee number pending"}{selectedEmployee.email ? ` • ${selectedEmployee.email}` : ""}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <ProfileInfoTile
                      label="Position"
                      value={selectedEmployee.positionTitle || selectedEmployee.position || "Unassigned"}
                      variant="primary"
                      icon={Briefcase}
                    />
                    <ProfileInfoTile
                      label="Status"
                      value={selectedEmployee.employmentStatus || selectedEmployee.status || "Pending"}
                      variant={resolveEmploymentStatusVariant(selectedEmployee.employmentStatus || selectedEmployee.status)}
                      icon={CircleDot}
                    />
                    <ProfileInfoTile
                      label="Department"
                      value={selectedEmployee.department || "Unassigned"}
                      variant="info"
                      icon={Building2}
                    />
                    <ProfileInfoTile
                      label="Linked Faculty Record"
                      value={linkedTeacher ? "Linked" : "Not linked"}
                      variant={linkedTeacher ? "success" : "warning"}
                      icon={Link}
                      helperText={linkedTeacher ? `${linkedTeacher.firstName} ${linkedTeacher.lastName}` : "No faculty record is currently matched."}
                    />
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-xs text-[var(--erp-text-muted)]">Select an employee record to review the summary before editing the full profile.</p>
              )}
            </div>
          </div>
        )}
      </AppCard>

      <StaffProfileWorkspace
        mode="employee"
        employee={selectedEmployee}
        teacher={linkedTeacher}
        title={selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : "Employee profile"}
        eyebrow="HR / Employee Profile"
        emptyTitle="No employee selected"
        emptyDescription="Select an employee record above to continue the new employee profile workflow."
        requirementCardTitle="Employee Requirements"
        requirementCardDescription="Track HR document readiness and open the shared requirements workspace when follow-up is needed."
      />
    </div>
  );
}

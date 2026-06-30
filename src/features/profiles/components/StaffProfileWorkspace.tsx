import React, { useEffect, useMemo, useState } from "react";
import {
  Award,
  Briefcase,
  Building2,
  FileCheck,
  GraduationCap,
  Hash,
  Phone,
  ShieldAlert,
  User,
  UserCog,
  Users,
} from "lucide-react";
import AppCard from "../../../components/common/AppCard";
import AppButton from "../../../components/common/AppButton";
import AppEmptyState from "../../../components/common/AppEmptyState";
import AppFormField from "../../../components/common/AppFormField";
import AppInput from "../../../components/common/AppInput";
import AppSelect from "../../../components/common/AppSelect";
import AppStatusBadge from "../../../components/common/AppStatusBadge";
import AppTextarea from "../../../components/common/AppTextarea";
import ProfileActivityLogTable from "../../../components/common/profile/ProfileActivityLogTable";
import ProfileDocumentCard from "../../../components/common/profile/ProfileDocumentCard";
import ProfileInfoTile from "../../../components/common/profile/ProfileInfoTile";
import ProfileLockedFieldsCard from "../../../components/common/profile/ProfileLockedFieldsCard";
import ProfileRepeatableEntryCard from "../../../components/common/profile/ProfileRepeatableEntryCard";
import ProfileRequirementsCard from "../../../components/common/profile/ProfileRequirementsCard";
import ProfileSectionCard from "../../../components/common/profile/ProfileSectionCard";
import ProfileWorkspace from "../../../components/common/profile/ProfileWorkspace";
import { useSTSNStore } from "../../../services/store";
import type {
  Employee,
  EmployeeDocumentRecord,
  EmployeeEducationBackground,
  EmployeeLicenseCertification,
  EmployeeProfileContact,
  Teacher,
} from "../../../types";

type StaffProfileTab =
  | "personal"
  | "contact"
  | "employment"
  | "education"
  | "contacts"
  | "licenses"
  | "documents";

const STAFF_PROFILE_TABS: Array<{ value: StaffProfileTab; label: string }> = [
  { value: "personal", label: "Personal Info" },
  { value: "contact", label: "Contact & Address" },
  { value: "employment", label: "Employment Info" },
  { value: "education", label: "Educational Background" },
  { value: "contacts", label: "Dependents / Emergency Contacts" },
  { value: "licenses", label: "Licenses / Certifications" },
  { value: "documents", label: "Requirements / Documents" },
];

const CONTACT_TYPE_OPTIONS: EmployeeProfileContact["contactType"][] = [
  "Spouse",
  "Parent",
  "Sibling",
  "Relative",
  "Emergency Contact",
  "Other",
];

const EDUCATION_LEVEL_OPTIONS: EmployeeEducationBackground["educationLevel"][] = [
  "Elementary",
  "Junior High School",
  "Senior High School",
  "College",
  "Graduate Studies",
  "Vocational",
  "Other",
];

const LICENSE_STATUS_OPTIONS: NonNullable<EmployeeLicenseCertification["status"]>[] = [
  "Active",
  "Expired",
  "Pending Renewal",
  "Inactive",
];

interface StaffProfileWorkspaceProps {
  mode: "faculty" | "employee";
  teacher?: Teacher | null;
  employee?: Employee | null;
  title: string;
  eyebrow: string;
  emptyTitle: string;
  emptyDescription: string;
  requirementCardTitle: string;
  requirementCardDescription: string;
}

export default function StaffProfileWorkspace({
  mode,
  teacher,
  employee,
  title,
  eyebrow,
  emptyTitle,
  emptyDescription,
  requirementCardTitle,
  requirementCardDescription,
}: StaffProfileWorkspaceProps) {
  const {
    currentUser,
    employeeProfileContacts,
    employeeEducationBackgrounds,
    employeeLicenseCertifications,
    employeeDocuments,
    activityLogs,
    updateTeacher,
    updateEmployee,
    addEmployeeProfileContact,
    updateEmployeeProfileContact,
    deleteEmployeeProfileContact,
    addEmployeeEducationBackground,
    updateEmployeeEducationBackground,
    deleteEmployeeEducationBackground,
    addEmployeeLicenseCertification,
    updateEmployeeLicenseCertification,
    deleteEmployeeLicenseCertification,
    addActivityLog,
  } = useSTSNStore();

  const subjectPerson = employee ?? null;
  const employeeId = subjectPerson?.id;

  const [activeTab, setActiveTab] = useState<StaffProfileTab>("personal");
  const [successMessage, setSuccessMessage] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [department, setDepartment] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [position, setPosition] = useState("");
  const [positionTitle, setPositionTitle] = useState("");
  const [employmentStatus, setEmploymentStatus] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [salary, setSalary] = useState("");
  const [hireDate, setHireDate] = useState("");
  const [regularizationDate, setRegularizationDate] = useState("");
  const [leaveBalance, setLeaveBalance] = useState("");

  const [contactDrafts, setContactDrafts] = useState<EmployeeProfileContact[]>([]);
  const [educationDrafts, setEducationDrafts] = useState<EmployeeEducationBackground[]>([]);
  const [licenseDrafts, setLicenseDrafts] = useState<EmployeeLicenseCertification[]>([]);

  const relatedContacts = useMemo(
    () =>
      employeeId
        ? employeeProfileContacts
            .filter((entry) => entry.employeeId === employeeId)
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        : [],
    [employeeId, employeeProfileContacts],
  );
  const relatedEducation = useMemo(
    () =>
      employeeId
        ? employeeEducationBackgrounds
            .filter((entry) => entry.employeeId === employeeId)
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        : [],
    [employeeEducationBackgrounds, employeeId],
  );
  const relatedLicenses = useMemo(
    () =>
      employeeId
        ? employeeLicenseCertifications
            .filter((entry) => entry.employeeId === employeeId)
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        : [],
    [employeeId, employeeLicenseCertifications],
  );
  const relatedDocuments = useMemo(
    () => (employeeId ? employeeDocuments.filter((entry) => entry.employeeId === employeeId) : []),
    [employeeDocuments, employeeId],
  );

  const activityRows = useMemo(() => {
    const keywords = new Set(
      [
        employee?.employeeNo,
        employee?.email,
        teacher?.email,
        employee ? `${employee.firstName} ${employee.lastName}` : null,
        teacher ? `${teacher.firstName} ${teacher.lastName}` : null,
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase()),
    );

    return activityLogs.filter((entry) => {
      const subject = `${entry.subject ?? ""} ${entry.action ?? ""}`.toLowerCase();
      return Array.from(keywords).some((keyword) => subject.includes(keyword));
    });
  }, [activityLogs, employee, teacher]);

  const resetWorkspace = React.useCallback(() => {
    setFirstName(teacher?.firstName ?? employee?.firstName ?? "");
    setLastName(teacher?.lastName ?? employee?.lastName ?? "");
    setMiddleName(teacher?.middleName ?? employee?.middleName ?? "");
    setEmail(teacher?.email ?? employee?.email ?? "");
    setPhone(teacher?.phone ?? employee?.contact ?? "");
    setAddress(employee?.address ?? "");
    setDepartment(teacher?.department ?? employee?.department ?? "");
    setSpecialization(teacher?.specialization ?? "");
    setPosition(employee?.position ?? "");
    setPositionTitle(employee?.positionTitle ?? "");
    setEmploymentStatus(employee?.employmentStatus ?? "");
    setEmploymentType(employee?.status ?? "");
    setSalary(employee?.salary != null ? String(employee.salary) : "");
    setHireDate(employee?.hireDate ?? "");
    setRegularizationDate(employee?.regularizationDate ?? "");
    setLeaveBalance(employee?.leaveBalance != null ? String(employee.leaveBalance) : "");
    setContactDrafts(relatedContacts.map((entry) => ({ ...entry })));
    setEducationDrafts(relatedEducation.map((entry) => ({ ...entry })));
    setLicenseDrafts(relatedLicenses.map((entry) => ({ ...entry })));
    setSuccessMessage("");
  }, [employee, relatedContacts, relatedEducation, relatedLicenses, teacher]);

  useEffect(() => {
    resetWorkspace();
  }, [resetWorkspace]);

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();

    if (teacher) {
      updateTeacher(teacher.id, {
        firstName,
        lastName,
        middleName,
        email,
        phone,
        department: (department || teacher.department) as Teacher["department"],
        specialization,
      });
    }

    if (employee) {
      updateEmployee(employee.id, {
        firstName,
        lastName,
        middleName,
        email,
        contact: phone,
        address,
        department: (department || employee.department) as Employee["department"],
        position,
        positionTitle,
        employmentStatus,
        status: (employmentType || employee.status) as Employee["status"],
        salary: salary ? Number(salary) : employee.salary,
        hireDate: hireDate || undefined,
        regularizationDate: regularizationDate || undefined,
        leaveBalance: leaveBalance ? Number(leaveBalance) : employee.leaveBalance,
      });
    }

    if (employeeId) {
      const normalizedContacts = contactDrafts
        .map((entry, index) => ({
          ...entry,
          employeeId,
          fullName: entry.fullName.trim(),
          relationship: entry.relationship?.trim() || "",
          contactNo: entry.contactNo?.trim() || "",
          email: entry.email?.trim() || "",
          address: entry.address?.trim() || "",
          occupation: entry.occupation?.trim() || "",
          sortOrder: index,
          canReceiveNotifications: entry.canReceiveNotifications ?? true,
        }))
        .filter((entry) => entry.fullName || entry.contactNo || entry.email);

      if (normalizedContacts.length > 0 && !normalizedContacts.some((entry) => entry.isPrimaryContact)) {
        normalizedContacts[0] = { ...normalizedContacts[0], isPrimaryContact: true };
      }

      const existingContactIds = new Set(relatedContacts.map((entry) => entry.id));
      const keptContactIds = new Set<string>();
      normalizedContacts.forEach((entry) => {
        if (entry.id.startsWith("draft-")) {
          const { id: _draftId, createdAt: _createdAt, updatedAt: _updatedAt, ...payload } = entry;
          addEmployeeProfileContact(payload);
          return;
        }
        keptContactIds.add(entry.id);
        updateEmployeeProfileContact(entry.id, entry);
      });
      relatedContacts.filter((entry) => existingContactIds.has(entry.id) && !keptContactIds.has(entry.id)).forEach((entry) => deleteEmployeeProfileContact(entry.id));

      const normalizedEducation = educationDrafts
        .map((entry, index) => ({
          ...entry,
          employeeId,
          schoolName: entry.schoolName.trim(),
          schoolAddress: entry.schoolAddress?.trim() || "",
          yearAttended: entry.yearAttended?.trim() || "",
          yearGraduated: entry.yearGraduated?.trim() || "",
          degreeOrCourse: entry.degreeOrCourse?.trim() || "",
          majorOrSpecialization: entry.majorOrSpecialization?.trim() || "",
          honorsOrAwards: entry.honorsOrAwards?.trim() || "",
          prcEducationNote: entry.prcEducationNote?.trim() || "",
          sortOrder: index,
        }))
        .filter((entry) => entry.schoolName);

      const existingEducationIds = new Set(relatedEducation.map((entry) => entry.id));
      const keptEducationIds = new Set<string>();
      normalizedEducation.forEach((entry) => {
        if (entry.id.startsWith("draft-")) {
          const { id: _draftId, createdAt: _createdAt, updatedAt: _updatedAt, ...payload } = entry;
          addEmployeeEducationBackground(payload);
          return;
        }
        keptEducationIds.add(entry.id);
        updateEmployeeEducationBackground(entry.id, entry);
      });
      relatedEducation.filter((entry) => existingEducationIds.has(entry.id) && !keptEducationIds.has(entry.id)).forEach((entry) => deleteEmployeeEducationBackground(entry.id));

      const normalizedLicenses = licenseDrafts
        .map((entry, index) => ({
          ...entry,
          employeeId,
          title: entry.title.trim(),
          licenseNumber: entry.licenseNumber?.trim() || "",
          issuingAuthority: entry.issuingAuthority?.trim() || "",
          notes: entry.notes?.trim() || "",
          status: entry.status ?? "Active",
          isPrimary: entry.isPrimary ?? false,
          sortOrder: index,
        }))
        .filter((entry) => entry.title);

      const existingLicenseIds = new Set(relatedLicenses.map((entry) => entry.id));
      const keptLicenseIds = new Set<string>();
      normalizedLicenses.forEach((entry) => {
        if (entry.id.startsWith("draft-")) {
          const { id: _draftId, createdAt: _createdAt, updatedAt: _updatedAt, ...payload } = entry;
          addEmployeeLicenseCertification(payload);
          return;
        }
        keptLicenseIds.add(entry.id);
        updateEmployeeLicenseCertification(entry.id, entry);
      });
      relatedLicenses.filter((entry) => existingLicenseIds.has(entry.id) && !keptLicenseIds.has(entry.id)).forEach((entry) => deleteEmployeeLicenseCertification(entry.id));
    }

    addActivityLog({
      action: `${mode === "faculty" ? "Faculty" : "Employee"} profile updated`,
      subject: employee?.employeeNo
        ? `${firstName} ${lastName} (${employee.employeeNo})`
        : `${firstName} ${lastName}`,
      type: "Profile",
      actorName: currentUser?.name,
    });

    setSuccessMessage(`${mode === "faculty" ? "Faculty" : "Employee"} profile changes were saved.`);
  };

  const documentSummary = {
    total: relatedDocuments.length,
    submitted: relatedDocuments.filter((entry) => entry.status === "Submitted" || entry.status === "Verified").length,
    verified: relatedDocuments.filter((entry) => entry.status === "Verified").length,
  };

  const empty = !teacher && !employee;
  if (empty) {
    return (
      <AppEmptyState
        icon={mode === "faculty" ? GraduationCap : Users}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <form onSubmit={handleSave} className="min-w-0 space-y-6">
        <ProfileWorkspace<StaffProfileTab>
          eyebrow={eyebrow}
          title={title}
          successMessage={successMessage}
          statusBadges={
            <>
              {teacher?.advisorySection ? <AppStatusBadge status={`Adviser • ${teacher.advisorySection}`} /> : null}
              {employee?.employmentStatus ? <AppStatusBadge status={employee.employmentStatus} /> : null}
              {employee?.status ? <AppStatusBadge status={employee.status} /> : null}
            </>
          }
          actions={
            <>
              <AppButton type="button" variant="outline" size="sm" onClick={resetWorkspace}>
                Reset
              </AppButton>
              <AppButton type="submit" size="sm">
                Save Profile
              </AppButton>
            </>
          }
          tabs={STAFF_PROFILE_TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        >
          {activeTab === "personal" && (
            <ProfileSectionCard title="Personal Info" description="Maintain the shared identity details used across faculty and employee records.">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <AppFormField label="First Name"><AppInput value={firstName} onChange={(event) => setFirstName(event.target.value)} /></AppFormField>
                <AppFormField label="Last Name"><AppInput value={lastName} onChange={(event) => setLastName(event.target.value)} /></AppFormField>
                <AppFormField label="Middle Name"><AppInput value={middleName} onChange={(event) => setMiddleName(event.target.value)} /></AppFormField>
                <AppFormField label="Department"><AppInput value={department} onChange={(event) => setDepartment(event.target.value)} /></AppFormField>
                <AppFormField label="Email Address"><AppInput type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></AppFormField>
                <AppFormField label="Contact Number"><AppInput value={phone} onChange={(event) => setPhone(event.target.value)} /></AppFormField>
                {mode === "faculty" ? (
                  <div className="md:col-span-2 xl:col-span-3">
                    <AppFormField label="Teaching Specialization">
                      <AppTextarea value={specialization} onChange={(event) => setSpecialization(event.target.value)} className="min-h-[96px]" />
                    </AppFormField>
                  </div>
                ) : null}
              </div>
            </ProfileSectionCard>
          )}

          {activeTab === "contact" && (
            <ProfileSectionCard title="Contact & Address" description="Store the active communication and residence details for this profile.">
              <div className="grid gap-4 md:grid-cols-2">
                <AppFormField label="Primary Email"><AppInput type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></AppFormField>
                <AppFormField label="Primary Mobile"><AppInput value={phone} onChange={(event) => setPhone(event.target.value)} /></AppFormField>
                <div className="md:col-span-2">
                  <AppFormField label="Current Address">
                    <AppTextarea value={address} onChange={(event) => setAddress(event.target.value)} className="min-h-[110px]" />
                  </AppFormField>
                </div>
              </div>
            </ProfileSectionCard>
          )}

          {activeTab === "employment" && (
            <ProfileSectionCard title="Employment Info" description="Keep employment, payroll-facing, and faculty assignment details aligned.">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <AppFormField label="Position"><AppInput value={position} onChange={(event) => setPosition(event.target.value)} /></AppFormField>
                <AppFormField label="Position Title"><AppInput value={positionTitle} onChange={(event) => setPositionTitle(event.target.value)} /></AppFormField>
                <AppFormField label="Employment Status"><AppInput value={employmentStatus} onChange={(event) => setEmploymentStatus(event.target.value)} /></AppFormField>
                <AppFormField label="Employment Type"><AppInput value={employmentType} onChange={(event) => setEmploymentType(event.target.value)} /></AppFormField>
                <AppFormField label="Monthly Salary"><AppInput type="number" value={salary} onChange={(event) => setSalary(event.target.value)} /></AppFormField>
                <AppFormField label="Leave Balance"><AppInput type="number" value={leaveBalance} onChange={(event) => setLeaveBalance(event.target.value)} /></AppFormField>
                <AppFormField label="Hire Date"><AppInput type="date" value={hireDate} onChange={(event) => setHireDate(event.target.value)} /></AppFormField>
                <AppFormField label="Regularization Date"><AppInput type="date" value={regularizationDate} onChange={(event) => setRegularizationDate(event.target.value)} /></AppFormField>
                {mode === "faculty" ? <AppFormField label="Advisory Section"><AppInput value={teacher?.advisorySection ?? ""} disabled /></AppFormField> : null}
              </div>
            </ProfileSectionCard>
          )}

          {activeTab === "education" && (
            <ProfileSectionCard
              title="Educational Background"
              description="Reuse the same multi-entry academic-history workflow used by the Student Profile workspace."
              action={<AppButton type="button" variant="secondary" size="sm" onClick={() => setEducationDrafts((current) => [...current, { id: `draft-${crypto.randomUUID()}`, employeeId: employeeId ?? "", educationLevel: "College", schoolName: "", schoolAddress: "", yearAttended: "", yearGraduated: "", degreeOrCourse: "", majorOrSpecialization: "", honorsOrAwards: "", prcEducationNote: "", sortOrder: current.length }])}>Add Entry</AppButton>}
            >
              {educationDrafts.length === 0 ? (
                <AppEmptyState icon={GraduationCap} title="No education records yet." description="Add school history, degrees, and PRC-related academic notes when available." compact />
              ) : educationDrafts.map((record, index) => (
                <ProfileRepeatableEntryCard key={record.id} eyebrow={`Entry ${index + 1}`} title={record.schoolName || "New education record"} onRemove={() => setEducationDrafts((current) => current.filter((entry) => entry.id !== record.id))}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <AppFormField label="Education Level"><AppSelect value={record.educationLevel} onChange={(event) => setEducationDrafts((current) => current.map((entry) => entry.id === record.id ? { ...entry, educationLevel: event.target.value as EmployeeEducationBackground["educationLevel"] } : entry))}>{EDUCATION_LEVEL_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}</AppSelect></AppFormField>
                    <AppFormField label="School Name"><AppInput value={record.schoolName} onChange={(event) => setEducationDrafts((current) => current.map((entry) => entry.id === record.id ? { ...entry, schoolName: event.target.value } : entry))} /></AppFormField>
                    <AppFormField label="School Address"><AppInput value={record.schoolAddress ?? ""} onChange={(event) => setEducationDrafts((current) => current.map((entry) => entry.id === record.id ? { ...entry, schoolAddress: event.target.value } : entry))} /></AppFormField>
                    <AppFormField label="Year Attended"><AppInput value={record.yearAttended ?? ""} onChange={(event) => setEducationDrafts((current) => current.map((entry) => entry.id === record.id ? { ...entry, yearAttended: event.target.value } : entry))} /></AppFormField>
                    <AppFormField label="Year Graduated"><AppInput value={record.yearGraduated ?? ""} onChange={(event) => setEducationDrafts((current) => current.map((entry) => entry.id === record.id ? { ...entry, yearGraduated: event.target.value } : entry))} /></AppFormField>
                    <AppFormField label="Degree / Course"><AppInput value={record.degreeOrCourse ?? ""} onChange={(event) => setEducationDrafts((current) => current.map((entry) => entry.id === record.id ? { ...entry, degreeOrCourse: event.target.value } : entry))} /></AppFormField>
                    <AppFormField label="Major / Specialization"><AppInput value={record.majorOrSpecialization ?? ""} onChange={(event) => setEducationDrafts((current) => current.map((entry) => entry.id === record.id ? { ...entry, majorOrSpecialization: event.target.value } : entry))} /></AppFormField>
                    <div className="md:col-span-2"><AppFormField label="Honors / Awards"><AppTextarea value={record.honorsOrAwards ?? ""} onChange={(event) => setEducationDrafts((current) => current.map((entry) => entry.id === record.id ? { ...entry, honorsOrAwards: event.target.value } : entry))} className="min-h-[96px]" /></AppFormField></div>
                    <div className="md:col-span-2"><AppFormField label="PRC-related Education Note"><AppTextarea value={record.prcEducationNote ?? ""} onChange={(event) => setEducationDrafts((current) => current.map((entry) => entry.id === record.id ? { ...entry, prcEducationNote: event.target.value } : entry))} className="min-h-[96px]" /></AppFormField></div>
                  </div>
                </ProfileRepeatableEntryCard>
              ))}
            </ProfileSectionCard>
          )}

          {activeTab === "contacts" && (
            <ProfileSectionCard
              title="Dependents / Emergency Contacts"
              description="Track family and emergency contacts with the same repeatable-entry behavior used for student guardians."
              action={<AppButton type="button" variant="secondary" size="sm" onClick={() => setContactDrafts((current) => [...current, { id: `draft-${crypto.randomUUID()}`, employeeId: employeeId ?? "", contactType: "Emergency Contact", fullName: "", relationship: "", contactNo: "", email: "", address: "", occupation: "", isPrimaryContact: current.length === 0, isEmergencyContact: true, canReceiveNotifications: true, sortOrder: current.length }])}>Add Contact</AppButton>}
            >
              {contactDrafts.length === 0 ? (
                <AppEmptyState icon={Phone} title="No emergency contacts yet." description="Add spouse, family, or emergency contacts for this faculty or employee profile." compact />
              ) : contactDrafts.map((entry, index) => (
                <ProfileRepeatableEntryCard key={entry.id} eyebrow={`Contact ${index + 1}`} title={entry.fullName || "New contact"} onRemove={() => setContactDrafts((current) => current.filter((item) => item.id !== entry.id))}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <AppFormField label="Contact Type"><AppSelect value={entry.contactType} onChange={(event) => setContactDrafts((current) => current.map((item) => item.id === entry.id ? { ...item, contactType: event.target.value as EmployeeProfileContact["contactType"] } : item))}>{CONTACT_TYPE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}</AppSelect></AppFormField>
                    <AppFormField label="Full Name"><AppInput value={entry.fullName} onChange={(event) => setContactDrafts((current) => current.map((item) => item.id === entry.id ? { ...item, fullName: event.target.value } : item))} /></AppFormField>
                    <AppFormField label="Relationship"><AppInput value={entry.relationship ?? ""} onChange={(event) => setContactDrafts((current) => current.map((item) => item.id === entry.id ? { ...item, relationship: event.target.value } : item))} /></AppFormField>
                    <AppFormField label="Contact Number"><AppInput value={entry.contactNo ?? ""} onChange={(event) => setContactDrafts((current) => current.map((item) => item.id === entry.id ? { ...item, contactNo: event.target.value } : item))} /></AppFormField>
                    <AppFormField label="Email Address"><AppInput type="email" value={entry.email ?? ""} onChange={(event) => setContactDrafts((current) => current.map((item) => item.id === entry.id ? { ...item, email: event.target.value } : item))} /></AppFormField>
                    <AppFormField label="Occupation"><AppInput value={entry.occupation ?? ""} onChange={(event) => setContactDrafts((current) => current.map((item) => item.id === entry.id ? { ...item, occupation: event.target.value } : item))} /></AppFormField>
                    <div className="md:col-span-2"><AppFormField label="Address"><AppTextarea value={entry.address ?? ""} onChange={(event) => setContactDrafts((current) => current.map((item) => item.id === entry.id ? { ...item, address: event.target.value } : item))} className="min-h-[96px]" /></AppFormField></div>
                    <div className="md:col-span-2 flex flex-wrap gap-4 rounded-2xl border border-[var(--erp-border)] bg-[var(--erp-surface-muted)] px-4 py-3">
                      <label className="flex items-center gap-2 text-xs font-medium text-[var(--erp-text)]"><input type="checkbox" checked={entry.isPrimaryContact} onChange={(event) => setContactDrafts((current) => current.map((item) => ({ ...item, isPrimaryContact: item.id === entry.id ? event.target.checked : event.target.checked ? false : item.isPrimaryContact })))} />Primary Contact</label>
                      <label className="flex items-center gap-2 text-xs font-medium text-[var(--erp-text)]"><input type="checkbox" checked={entry.isEmergencyContact} onChange={(event) => setContactDrafts((current) => current.map((item) => item.id === entry.id ? { ...item, isEmergencyContact: event.target.checked } : item))} />Emergency Contact</label>
                      <label className="flex items-center gap-2 text-xs font-medium text-[var(--erp-text)]"><input type="checkbox" checked={entry.canReceiveNotifications ?? true} onChange={(event) => setContactDrafts((current) => current.map((item) => item.id === entry.id ? { ...item, canReceiveNotifications: event.target.checked } : item))} />Can Receive Notifications</label>
                    </div>
                  </div>
                </ProfileRepeatableEntryCard>
              ))}
            </ProfileSectionCard>
          )}

          {activeTab === "licenses" && (
            <ProfileSectionCard
              title="Licenses / Certifications"
              description="Capture PRC licenses, teaching certificates, and professional credentials."
              action={<AppButton type="button" variant="secondary" size="sm" onClick={() => setLicenseDrafts((current) => [...current, { id: `draft-${crypto.randomUUID()}`, employeeId: employeeId ?? "", title: "", licenseNumber: "", issuingAuthority: "", issuedAt: "", expiresAt: "", status: "Active", notes: "", isPrimary: current.length === 0 }])}>Add License</AppButton>}
            >
              {licenseDrafts.length === 0 ? (
                <AppEmptyState icon={Award} title="No licenses or certifications yet." description="Add PRC, training, and certification records when applicable." compact />
              ) : licenseDrafts.map((entry, index) => (
                <ProfileRepeatableEntryCard key={entry.id} eyebrow={`Credential ${index + 1}`} title={entry.title || "New credential"} onRemove={() => setLicenseDrafts((current) => current.filter((item) => item.id !== entry.id))}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <AppFormField label="Title"><AppInput value={entry.title} onChange={(event) => setLicenseDrafts((current) => current.map((item) => item.id === entry.id ? { ...item, title: event.target.value } : item))} /></AppFormField>
                    <AppFormField label="License / Certificate No."><AppInput value={entry.licenseNumber ?? ""} onChange={(event) => setLicenseDrafts((current) => current.map((item) => item.id === entry.id ? { ...item, licenseNumber: event.target.value } : item))} /></AppFormField>
                    <AppFormField label="Issuing Authority"><AppInput value={entry.issuingAuthority ?? ""} onChange={(event) => setLicenseDrafts((current) => current.map((item) => item.id === entry.id ? { ...item, issuingAuthority: event.target.value } : item))} /></AppFormField>
                    <AppFormField label="Status"><AppSelect value={entry.status ?? "Active"} onChange={(event) => setLicenseDrafts((current) => current.map((item) => item.id === entry.id ? { ...item, status: event.target.value as NonNullable<EmployeeLicenseCertification["status"]> } : item))}>{LICENSE_STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}</AppSelect></AppFormField>
                    <AppFormField label="Issued At"><AppInput type="date" value={entry.issuedAt ?? ""} onChange={(event) => setLicenseDrafts((current) => current.map((item) => item.id === entry.id ? { ...item, issuedAt: event.target.value } : item))} /></AppFormField>
                    <AppFormField label="Expires At"><AppInput type="date" value={entry.expiresAt ?? ""} onChange={(event) => setLicenseDrafts((current) => current.map((item) => item.id === entry.id ? { ...item, expiresAt: event.target.value } : item))} /></AppFormField>
                    <div className="md:col-span-2"><AppFormField label="Notes"><AppTextarea value={entry.notes ?? ""} onChange={(event) => setLicenseDrafts((current) => current.map((item) => item.id === entry.id ? { ...item, notes: event.target.value } : item))} className="min-h-[96px]" /></AppFormField></div>
                  </div>
                </ProfileRepeatableEntryCard>
              ))}
            </ProfileSectionCard>
          )}

          {activeTab === "documents" && (
            <ProfileSectionCard title="Requirements / Documents" description="Review faculty or employee document submissions using the same summary-card pattern adopted from student credentials.">
              {relatedDocuments.length === 0 ? (
                <AppEmptyState icon={FileCheck} title="No document records yet." description="Document submissions will appear here once HR or the faculty record receives requirement entries." compact />
              ) : relatedDocuments.map((document: EmployeeDocumentRecord) => (
                <ProfileDocumentCard
                  key={document.id}
                  title={document.documentName}
                  metadata={[
                    ...(document.documentType ? [{ label: "Type", value: document.documentType }] : []),
                    ...(document.submittedAt ? [{ label: "Submitted", value: document.submittedAt }] : []),
                    ...(document.verifiedBy ? [{ label: "Reviewed by", value: document.verifiedBy }] : []),
                  ]}
                  remarks={document.remarks}
                  badges={<AppStatusBadge status={document.status} />}
                />
              ))}
            </ProfileSectionCard>
          )}

        </ProfileWorkspace>

        <AppCard tone="brand" className="space-y-4">
          <div className="flex flex-col gap-2 border-b border-[var(--erp-border)] pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--erp-text-muted)]">Audit Trail</p>
              <h4 className="mt-1 text-lg font-semibold text-[var(--erp-text)]">Profile Activity Logs</h4>
              <p className="text-xs text-[var(--erp-text-muted)]">Profile saves, document reviews, and related actions are preserved here without crowding the main profile tabs.</p>
            </div>
            <AppStatusBadge status={`${activityRows.length} Activity Record${activityRows.length === 1 ? "" : "s"}`} />
          </div>

          <ProfileActivityLogTable
            data={activityRows}
            columns={[
              { id: "time", header: "Date / Time", accessorFn: (row) => row.time ?? "-" },
              { id: "type", header: "Category", accessorFn: (row) => row.type ?? "Profile" },
              { id: "action", header: "Action", accessorFn: (row) => row.action },
              { id: "subject", header: "Subject", accessorFn: (row) => row.subject },
            ]}
            getRowId={(row) => row.id}
            emptyMessage="No profile activity recorded yet."
            emptyDescription="Profile saves, document reviews, and related actions will appear here."
          />
        </AppCard>
      </form>

        <div className="space-y-5">
        <ProfileRequirementsCard
          title={requirementCardTitle}
          description={requirementCardDescription}
          metrics={[
            { label: "Total", value: documentSummary.total, tone: "brand" },
            { label: "Submitted", value: documentSummary.submitted, tone: "accent" },
            { label: "Verified", value: documentSummary.verified, tone: "success" },
          ]}
          actionLabel="Open Documents"
          onAction={() => setActiveTab("documents")}
        />

        <ProfileLockedFieldsCard
          title="Locked Administrative Fields"
          description="Roster ownership, advisory assignment, and core identifiers still follow existing registrar and HR governance."
          fields={[
            { label: "Employee No.", value: employee?.employeeNo || "—", variant: "primary", icon: Hash },
            { label: "Department", value: teacher?.department || employee?.department || "—", variant: "info", icon: Building2 },
            { label: "Advisory Section", value: teacher?.advisorySection || "—", variant: teacher?.advisorySection ? "warning" : "neutral", icon: ShieldAlert },
            { label: "Supervisor", value: employee?.supervisorId || "—", variant: "neutral", icon: UserCog },
          ]}
        />

        <ProfileSectionCard title="Profile Snapshot" description="Quick summary for current staffing and records readiness.">
          <div className="grid gap-3 sm:grid-cols-2">
            <ProfileInfoTile
              label="Role Track"
              value={mode === "faculty" ? "Faculty / Teacher" : "HR / Employee"}
              variant="primary"
              icon={Briefcase}
            />
            <ProfileInfoTile
              label="Emergency Contacts"
              value={relatedContacts.filter((entry) => entry.isEmergencyContact).length}
              variant="neutral"
              icon={Phone}
            />
            <ProfileInfoTile
              label="Education Entries"
              value={relatedEducation.length}
              variant="info"
              icon={GraduationCap}
            />
            <ProfileInfoTile
              label="Licenses Active"
              value={relatedLicenses.filter((entry) => (entry.status ?? "Active") === "Active").length}
              variant="success"
              icon={Award}
            />
          </div>
        </ProfileSectionCard>
        </div>
      </div>

    </div>
  );
}

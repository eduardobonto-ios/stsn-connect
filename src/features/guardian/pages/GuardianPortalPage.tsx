/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  Bell,
  BookOpen,
  CreditCard,
  FileCheck,
  GraduationCap,
  MessageSquare,
  ShieldAlert,
  User,
  Wallet,
} from "lucide-react";
import { useSTSNStore } from "../../../services/store";
import ModulePageHeader from "../../../components/common/ModulePageHeader";
import AppButton from "../../../components/common/AppButton";
import AppCard from "../../../components/common/AppCard";
import AppEmptyState from "../../../components/common/AppEmptyState";
import AppKpiCard from "../../../components/common/AppKpiCard";
import AppStatusBadge from "../../../components/common/AppStatusBadge";
import AppTable, { type AppTableColumn } from "../../../components/common/AppTable";
import AppTabs, { type AppTabItem } from "../../../components/common/AppTabs";
import AcademicSnapshotCard from "../components/AcademicSnapshotCard";
import BillingSnapshotCard from "../components/BillingSnapshotCard";
import ChildSummaryCard from "../components/ChildSummaryCard";
import ParentAnnouncementsCard from "../components/ParentAnnouncementsCard";
import ParentDocumentsCard from "../components/ParentDocumentsCard";
import ParentScheduleCard from "../components/ParentScheduleCard";
import ParentTasksCard from "../components/ParentTasksCard";
import type {
  ParentDocumentRow,
  ParentGradeRow,
  ParentPaymentRow,
  ParentPortalTab,
  ParentScheduleRow,
  ParentTaskItem,
} from "../types";

function formatCurrency(amount: number) {
  return `PHP ${amount.toLocaleString()}`;
}

function formatDate(value?: string) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function normalizeEmail(value?: string) {
  return value?.trim().toLowerCase() ?? "";
}

export default function GuardianPortalPage() {
  const {
    currentUser,
    students,
    assessments,
    payments,
    grades,
    announcements,
    requirements,
    classSchedules,
    financialHolds,
    enrollments,
    studentGuardians,
  } = useSTSNStore();
  const isAdminQaView = currentUser?.role === "ADMIN";

  const guardianLinkedStudentIds = useMemo(() => {
    const ids = new Set<string>();
    const currentGuardianId = currentUser?.id ?? "";
    const currentGuardianEmail = normalizeEmail(currentUser?.email);

    students.forEach((student) => {
      if (student.linkedGuardianIds?.includes(currentGuardianId)) {
        ids.add(student.id);
      }
    });

    if (currentGuardianEmail) {
      studentGuardians.forEach((guardian) => {
        if (normalizeEmail(guardian.email) === currentGuardianEmail) {
          ids.add(guardian.studentId);
        }
      });
    }

    return ids;
  }, [currentUser, studentGuardians, students]);

  const linkedStudents = useMemo(
    () =>
      students
        .filter((student) => {
          if (isAdminQaView) return true;
          return guardianLinkedStudentIds.has(student.id);
        })
        .sort((left, right) => {
          const byLastName = left.lastName.localeCompare(right.lastName);
          if (byLastName !== 0) return byLastName;
          return left.firstName.localeCompare(right.firstName);
        }),
    [guardianLinkedStudentIds, isAdminQaView, students],
  );

  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => linkedStudents[0]?.id ?? "");
  const [activeTab, setActiveTab] = useState<ParentPortalTab>("overview");
  const [consultRequested, setConsultRequested] = useState(false);

  useEffect(() => {
    if (!linkedStudents.some((student) => student.id === selectedStudentId)) {
      setSelectedStudentId(linkedStudents[0]?.id ?? "");
    }
  }, [linkedStudents, selectedStudentId]);

  useEffect(() => {
    setConsultRequested(false);
  }, [selectedStudentId]);

  if (linkedStudents.length === 0) {
    return (
      <AppEmptyState
        icon={GraduationCap}
        title={isAdminQaView ? "No Students Available" : "No Students Linked"}
        description={
          isAdminQaView
            ? "No student records are currently available for Parent Portal QA in this environment."
            : "Your account does not have any linked student records yet. Please contact the Registrar's office to complete the parent-to-student account linkage."
        }
      />
    );
  }

  const selectedStudent = linkedStudents.find((student) => student.id === selectedStudentId) ?? linkedStudents[0];
  const selectedStudentAssessments = assessments.filter((assessment) => assessment.studentId === selectedStudent.id);
  const latestAssessment = selectedStudentAssessments[selectedStudentAssessments.length - 1];
  const selectedStudentPayments = payments
    .filter((payment) => payment.studentId === selectedStudent.id)
    .sort((left, right) => right.paymentDate.localeCompare(left.paymentDate));
  const selectedStudentGrades = grades.filter((grade) => grade.studentId === selectedStudent.id);
  const finalizedGrades = selectedStudentGrades.filter((grade) => grade.finalGrade !== null);
  const selectedStudentRequirements = requirements
    .filter((requirement) => requirement.studentId === selectedStudent.id)
    .sort((left, right) => {
      const leftPending = left.status === "Pending" || left.verificationStatus === "Rejected";
      const rightPending = right.status === "Pending" || right.verificationStatus === "Rejected";
      if (leftPending === rightPending) return left.name.localeCompare(right.name);
      return leftPending ? -1 : 1;
    });
  const activeHolds = financialHolds.filter(
    (hold) => hold.studentId === selectedStudent.id && hold.status === "Active",
  );
  const currentEnrollment = enrollments.find(
    (enrollment) => enrollment.studentId === selectedStudent.id && enrollment.status === "Enrolled",
  );

  const activeAnnouncements = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return announcements.filter((announcement) => {
      if (announcement.expiresAt && announcement.expiresAt < today) return false;
      if (announcement.targetRoles && !announcement.targetRoles.includes("GUARDIAN")) return false;
      if (announcement.targetSchool && selectedStudent.schoolId && announcement.targetSchool !== selectedStudent.schoolId) return false;
      return true;
    });
  }, [announcements, selectedStudent.schoolId]);

  const scheduleRows = useMemo<ParentScheduleRow[]>(() => {
    return classSchedules
      .filter((schedule) => {
        if (schedule.section !== selectedStudent.section) return false;
        if (schedule.department !== selectedStudent.department) return false;
        if (currentEnrollment?.subjectCodes.length) {
          return currentEnrollment.subjectCodes.includes(schedule.subjectCode);
        }
        return true;
      })
      .map((schedule) => ({
        id: schedule.id,
        subjectName: schedule.subjectName,
        subjectCode: schedule.subjectCode,
        teacherName: schedule.teacherName,
        day: schedule.day,
        time: `${schedule.startTime} - ${schedule.endTime}`,
        room: schedule.roomName,
      }));
  }, [classSchedules, currentEnrollment?.subjectCodes, selectedStudent.department, selectedStudent.section]);

  const gpaLabel = finalizedGrades.length
    ? (
        finalizedGrades.reduce((sum, grade) => sum + grade.finalGrade, 0) /
        finalizedGrades.length
      ).toFixed(2)
    : "—";
  const passedCount = finalizedGrades.filter((grade) => (grade.finalGrade ?? 0) >= 75).length;
  const incompleteCount = Math.max(selectedStudentGrades.length - finalizedGrades.length, 0);
  const totalPaid = selectedStudentPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const pendingRequirements = selectedStudentRequirements.filter(
    (requirement) =>
      requirement.status === "Pending" ||
      requirement.verificationStatus === "Rejected" ||
      requirement.verificationStatus === "Pending",
  );
  const completedDocuments = selectedStudentRequirements.filter(
    (requirement) => requirement.status === "Submitted" && requirement.verificationStatus !== "Rejected",
  ).length;
  const rejectedDocuments = selectedStudentRequirements.filter(
    (requirement) => requirement.verificationStatus === "Rejected",
  ).length;

  const tasks = useMemo<ParentTaskItem[]>(() => {
    const nextTasks: ParentTaskItem[] = [];

    if (latestAssessment?.balance && latestAssessment.balance > 0) {
      nextTasks.push({
        id: "outstanding-balance",
        title: "Outstanding balance requires follow-up",
        description: `The latest assessment still shows ${formatCurrency(latestAssessment.balance)} unpaid. Coordinate with the Cashier's Office for settlement or billing clarification.`,
        tone: "danger",
      });
    }

    if (activeHolds.length > 0) {
      nextTasks.push({
        id: "financial-hold",
        title: "Active financial hold on record",
        description: `${activeHolds.length} active hold${activeHolds.length > 1 ? "s are" : " is"} attached to this child’s account. Review the finance tab and coordinate with school staff if needed.`,
        tone: "warning",
      });
    }

    if (pendingRequirements.length > 0) {
      nextTasks.push({
        id: "pending-requirements",
        title: "Document requirements still need attention",
        description: `${pendingRequirements.length} requirement record${pendingRequirements.length > 1 ? "s are" : " is"} still pending, under review, or rejected.`,
        tone: "info",
      });
    }

    if (!latestAssessment) {
      nextTasks.push({
        id: "assessment-missing",
        title: "Assessment record not available yet",
        description: "A posted assessment has not been loaded for this child yet, so finance details remain limited.",
        tone: "info",
      });
    }

    return nextTasks;
  }, [activeHolds.length, latestAssessment, pendingRequirements.length]);

  const gradeRows = useMemo<ParentGradeRow[]>(
    () =>
      selectedStudentGrades.map((grade) => ({
        id: grade.id,
        subjectCode: grade.subjectCode,
        subjectName: grade.subjectCode,
        schoolYear: grade.schoolYear,
        semester: grade.semester,
        finalGrade: grade.finalGrade,
        remarks: grade.remarks ?? (grade.finalGrade >= 75 ? "Passed" : "For Review"),
      })),
    [selectedStudentGrades],
  );

  const paymentRows = useMemo<ParentPaymentRow[]>(
    () =>
      selectedStudentPayments.map((payment) => ({
        id: payment.id,
        orNumber: payment.orNumber,
        paymentDate: payment.paymentDate,
        term: payment.term,
        paymentMethod: payment.paymentMethod,
        amount: payment.amount,
      })),
    [selectedStudentPayments],
  );

  const documentRows = useMemo<ParentDocumentRow[]>(
    () =>
      selectedStudentRequirements.map((requirement) => ({
        id: requirement.id,
        name: requirement.name,
        status: requirement.status,
        verificationStatus: requirement.verificationStatus ?? "Pending",
        uploadStatus: requirement.uploadStatus ?? "Not Uploaded",
        submittedDate: requirement.submittedDate,
      })),
    [selectedStudentRequirements],
  );

  const gradeColumns = useMemo<AppTableColumn<ParentGradeRow>[]>(
    () => [
      {
        accessorKey: "subjectCode",
        header: "Subject",
        cell: ({ row }) => (
          <div>
            <p className="font-semibold text-stone-800">{row.original.subjectCode}</p>
            <p className="text-[10px] text-stone-400">
              {row.original.schoolYear} • {row.original.semester}
            </p>
          </div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "finalGrade",
        header: "Final Grade",
        cell: ({ row }) => (
          <span className="font-mono font-bold text-stone-900">
            {row.original.finalGrade ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "remarks",
        header: "Remarks",
        cell: ({ row }) => <AppStatusBadge status={row.original.remarks} />,
        enableSorting: false,
      },
    ],
    [],
  );

  const paymentColumns = useMemo<AppTableColumn<ParentPaymentRow>[]>(
    () => [
      {
        accessorKey: "orNumber",
        header: "Receipt",
        cell: ({ row }) => (
          <div>
            <p className="font-semibold text-stone-800">{row.original.orNumber}</p>
            <p className="text-[10px] text-stone-400">{formatDate(row.original.paymentDate)}</p>
          </div>
        ),
      },
      {
        accessorKey: "term",
        header: "Term",
        enableSorting: false,
      },
      {
        accessorKey: "paymentMethod",
        header: "Method",
        enableSorting: false,
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => (
          <span className="font-mono font-bold text-emerald-700">
            {formatCurrency(row.original.amount)}
          </span>
        ),
      },
    ],
    [],
  );

  const documentColumns = useMemo<AppTableColumn<ParentDocumentRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Document",
        enableSorting: false,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <AppStatusBadge status={row.original.status} />,
        enableSorting: false,
      },
      {
        accessorKey: "verificationStatus",
        header: "Verification",
        cell: ({ row }) => <AppStatusBadge status={row.original.verificationStatus} />,
        enableSorting: false,
      },
      {
        accessorKey: "uploadStatus",
        header: "Upload",
        cell: ({ row }) => <AppStatusBadge status={row.original.uploadStatus} />,
        enableSorting: false,
      },
      {
        accessorKey: "submittedDate",
        header: "Submitted",
        cell: ({ row }) => formatDate(row.original.submittedDate),
      },
    ],
    [],
  );

  const tabItems = useMemo<AppTabItem<ParentPortalTab>[]>(
    () => [
      { value: "overview", label: "Overview" },
      { value: "academics", label: "Academics", badge: finalizedGrades.length || undefined },
      { value: "finance", label: "Finance", badge: latestAssessment?.balance ? formatCurrency(latestAssessment.balance) : undefined },
      { value: "documents", label: "Documents", badge: selectedStudentRequirements.length || undefined },
    ],
    [finalizedGrades.length, latestAssessment?.balance, selectedStudentRequirements.length],
  );

  return (
    <div className="space-y-5">
      <ModulePageHeader
        badge="Parent Portal"
        badgeIcon={User}
        title="Parent Portal"
        subtitle={
          isAdminQaView
            ? `Welcome, ${currentUser?.name}. Admin QA mode lets you review the read-only Parent Portal experience against student records without exposing staff-only tools.`
            : `Welcome, ${currentUser?.name}. Review your linked child records, school notices, billing summaries, and finalized academic information through a read-only parent view.`
        }
      />

      {isAdminQaView && (
        <AppCard className="border border-blue-200 bg-blue-50 px-4 py-3" tone="brand">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
            <div>
              <p className="text-xs font-bold text-blue-800">Admin QA / Support View</p>
              <p className="mt-1 text-[10px] leading-relaxed text-blue-700">
                This access is for validation and support only. The Parent Portal remains read-only here and does not expose registrar, accounting, payroll, setup, or other staff-only controls.
              </p>
            </div>
          </div>
        </AppCard>
      )}

      {linkedStudents.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {linkedStudents.map((student) => (
            <button
              key={student.id}
              type="button"
              onClick={() => setSelectedStudentId(student.id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition whitespace-nowrap ${
                selectedStudentId === student.id
                  ? "border-stsn-brown bg-stsn-brown text-white shadow-sm"
                  : "border-stone-200 bg-white text-stone-600 hover:border-stsn-brown hover:text-stsn-brown"
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold ${
                  selectedStudentId === student.id
                    ? "bg-white/20 text-white"
                    : "bg-stsn-cream text-stsn-brown"
                }`}
              >
                {student.firstName[0]}
                {student.lastName[0]}
              </span>
              {student.firstName} {student.lastName}
            </button>
          ))}
        </div>
      )}

      <ChildSummaryCard
        student={selectedStudent}
        latestAssessment={latestAssessment}
        pendingRequirementCount={pendingRequirements.length}
        activeHoldCount={activeHolds.length}
      />

      {tasks.length > 0 && (
        <AppCard className="border border-amber-200 bg-amber-50 px-4 py-3" tone="brand">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
            <div>
              <p className="text-xs font-bold text-amber-800">Required parent follow-up found</p>
              <p className="mt-1 text-[10px] leading-relaxed text-amber-700">
                This banner only appears when live student records show follow-up items such as open balances, active holds, or pending requirements.
              </p>
            </div>
          </div>
        </AppCard>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AppKpiCard
          label="Average Final Grade"
          value={gpaLabel}
          icon={GraduationCap}
          tone="warning"
          hint={finalizedGrades.length > 0 ? `${finalizedGrades.length} finalized subject record(s)` : "No finalized grades yet"}
        />
        <AppKpiCard
          label="Outstanding Balance"
          value={latestAssessment ? formatCurrency(latestAssessment.balance) : "—"}
          icon={Wallet}
          tone={latestAssessment && latestAssessment.balance > 0 ? "danger" : "success"}
          hint={latestAssessment ? `Assessment term: ${latestAssessment.paymentTerm}` : "Assessment not available"}
        />
        <AppKpiCard
          label="Document Records"
          value={selectedStudentRequirements.length}
          icon={FileCheck}
          tone="info"
          hint={`${pendingRequirements.length} needing parent attention`}
        />
        <AppKpiCard
          label="Open Tasks"
          value={tasks.length}
          icon={Bell}
          tone={tasks.length > 0 ? "warning" : "success"}
          hint={tasks.length > 0 ? "Live follow-up items detected" : "No immediate follow-up"}
        />
      </div>

      <AppTabs
        items={tabItems}
        value={activeTab}
        onChange={(value) => setActiveTab(value)}
        variant="pill"
      />

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
          <div className="space-y-5">
            <AcademicSnapshotCard
              gpaLabel={gpaLabel}
              passedCount={passedCount}
              incompleteCount={incompleteCount}
              finalizedCount={finalizedGrades.length}
            />
            <BillingSnapshotCard
              latestAssessment={latestAssessment}
              totalPaid={totalPaid}
              paymentCount={selectedStudentPayments.length}
              activeHoldCount={activeHolds.length}
            />
            <ParentAnnouncementsCard announcements={activeAnnouncements} />
          </div>

          <div className="space-y-5">
            <ParentTasksCard tasks={tasks} />
            <ParentScheduleCard schedule={scheduleRows} />
            <ParentDocumentsCard
              totalDocuments={selectedStudentRequirements.length}
              completedDocuments={completedDocuments}
              pendingDocuments={pendingRequirements.length}
              rejectedDocuments={rejectedDocuments}
            />
          </div>
        </div>
      )}

      {activeTab === "academics" && (
        <div className="space-y-5">
          <AcademicSnapshotCard
            gpaLabel={gpaLabel}
            passedCount={passedCount}
            incompleteCount={incompleteCount}
            finalizedCount={finalizedGrades.length}
          />
          <AppTable<ParentGradeRow>
            columns={gradeColumns}
            data={gradeRows}
            title="Finalized Academic Results"
            description="This view stays read-only and shows only the grade records currently available in the shared store."
            emptyMessage="No grade records available"
            emptyDescription="Finalized grade rows for this child will appear here when available."
            getRowId={(row) => row.id}
            initialPageSize={10}
            pageSizeOptions={[10]}
          />
        </div>
      )}

      {activeTab === "finance" && (
        <div className="space-y-5">
          <BillingSnapshotCard
            latestAssessment={latestAssessment}
            totalPaid={totalPaid}
            paymentCount={selectedStudentPayments.length}
            activeHoldCount={activeHolds.length}
          />
          <AppTable<ParentPaymentRow>
            columns={paymentColumns}
            data={paymentRows}
            title="Payment History"
            description="Receipt and posted payment records are shown from the current store-backed payment history."
            emptyMessage="No payment history available"
            emptyDescription="Posted payment records for this child will appear here once available."
            getRowId={(row) => row.id}
            initialPageSize={10}
            pageSizeOptions={[10]}
          />
          {activeHolds.length > 0 && (
            <AppCard className="border border-red-200 bg-red-50" tone="brand">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-red-600" />
                <h3 className="text-sm font-bold text-red-800">Active Financial Holds</h3>
              </div>
              <div className="mt-4 space-y-3">
                {activeHolds.map((hold) => (
                  <div key={hold.id} className="rounded-xl border border-red-200 bg-white px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <AppStatusBadge status={hold.status} />
                      <span className="text-xs font-semibold text-stone-800">{hold.holdType}</span>
                    </div>
                    <p className="mt-2 text-[11px] text-stone-600">{hold.reason}</p>
                    <p className="mt-1 text-[10px] font-mono text-stone-400">
                      Balance impact: {formatCurrency(hold.balanceAmount)}
                    </p>
                  </div>
                ))}
              </div>
            </AppCard>
          )}
        </div>
      )}

      {activeTab === "documents" && (
        <div className="space-y-5">
          <ParentDocumentsCard
            totalDocuments={selectedStudentRequirements.length}
            completedDocuments={completedDocuments}
            pendingDocuments={pendingRequirements.length}
            rejectedDocuments={rejectedDocuments}
          />
          <AppTable<ParentDocumentRow>
            columns={documentColumns}
            data={documentRows}
            title="Requirement And Document Status"
            description="Document rows are shown from existing requirement records only. This phase does not create new upload or download workflows."
            emptyMessage="No document records available"
            emptyDescription="Requirement tracking entries for this child will appear here once available."
            getRowId={(row) => row.id}
            initialPageSize={10}
            pageSizeOptions={[10]}
          />
        </div>
      )}

      <AppCard className="p-4" tone="brand">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50">
              <MessageSquare className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-800">Request a Consultation</p>
              <p className="mt-0.5 text-[10px] text-stone-400">
                Use the existing parent-facing consultation pattern without exposing staff-only operational tools.
              </p>
            </div>
          </div>
          <AppButton
            type="button"
            onClick={() => setConsultRequested((current) => !current)}
            variant="primary-college"
            size="sm"
            className="flex-shrink-0"
          >
            {consultRequested ? "Request Sent" : "Request"}
          </AppButton>
        </div>
        {consultRequested && (
          <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-[10px] font-semibold text-emerald-700">
              Consultation request noted for {selectedStudent.firstName} {selectedStudent.lastName}. The school can confirm the actual schedule through existing staff workflows.
            </p>
          </div>
        )}
      </AppCard>

      <AppCard className="flex gap-2 border border-blue-100 bg-blue-50 px-4 py-3" tone="muted">
        <BookOpen className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-blue-500" />
        <p className="text-[10px] leading-relaxed text-blue-700">
          This parent portal remains read-only. Attendance was intentionally deferred in Phase 11 because no student attendance data source is currently loaded in the shared store.
        </p>
      </AppCard>
    </div>
  );
}

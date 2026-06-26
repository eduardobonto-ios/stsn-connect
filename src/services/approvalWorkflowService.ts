/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Centralized Approval Workflow Service
 * Reference: STSN_APPROVAL_WORKFLOW_BEST_PRACTICE_PROCESS.md
 *
 * This service owns all approval lifecycle logic:
 *   - Creating approval requests + steps
 *   - Submitting, approving, returning, rejecting, cancelling
 *   - Authority validation (role + designation + school scope)
 *   - Audit trail writes (approval_actions table — append-only)
 *   - SLA due-date calculation
 *
 * The Zustand store handles in-memory UI state.
 * This service handles Supabase persistence for the approval engine tables.
 */

import { supabase } from "../lib/supabase";
import type { User } from "../types";

// ── Workflow types ────────────────────────────────────────────────────────────

export type WorkflowType =
  | "online_application"
  | "enrollment"
  | "assessment"
  | "discount"
  | "payment_void"
  | "leave_request"
  | "grade_period"
  | "payroll_run";

export type ApprovalRequestStatus =
  | "Draft"
  | "Submitted"
  | "In Review"
  | "Returned"
  | "Resubmitted"
  | "Approved"
  | "Rejected"
  | "Cancelled"
  | "Voided";

export type ApprovalStepStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Returned"
  | "Skipped"
  | "Delegated";

export type ApprovalActionType =
  | "SUBMITTED"
  | "REVIEWED"
  | "APPROVED_LEVEL_1"
  | "APPROVED_LEVEL_2"
  | "APPROVED_FINAL"
  | "RETURNED"
  | "RESUBMITTED"
  | "REJECTED"
  | "CANCELLED"
  | "OVERRIDDEN"
  | "DELEGATED";

export type ApprovalPriority = "Low" | "Normal" | "High" | "Urgent";

// ── DB row shapes (snake_case as returned by Supabase) ────────────────────────

export interface ApprovalRequestRow {
  id: string;
  workflow_type: WorkflowType;
  entity_type: string;
  entity_id: string;
  school_id?: string;
  requested_by?: string;
  requested_role?: string;
  request_title: string;
  request_summary?: string;
  status: ApprovalRequestStatus;
  current_step_level: number;
  priority: ApprovalPriority;
  due_at?: string;
  submitted_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ApprovalStepRow {
  id: string;
  approval_request_id: string;
  step_level: number;
  step_name: string;
  required_role?: string;
  required_designation?: string;
  required_approval_level?: number;
  assigned_to_user_id?: string;
  status: ApprovalStepStatus;
  acted_by?: string;
  acted_at?: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
}

export interface ApprovalActionRow {
  id: string;
  approval_request_id: string;
  approval_step_id?: string;
  action: ApprovalActionType;
  action_by: string;
  action_role: string;
  action_designation?: string;
  previous_status?: string;
  new_status?: string;
  remarks?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// ── Approval Matrix ───────────────────────────────────────────────────────────
// Defines the step configuration for each workflow type.
// Referenced from STSN_APPROVAL_WORKFLOW_BEST_PRACTICE_PROCESS.md §4 and §5.

interface StepConfig {
  stepLevel: number;
  stepName: string;
  requiredRole?: string;
  requiredDesignation?: string;
  requiredApprovalLevel?: number;
  isFinal: boolean;
}

const APPROVAL_MATRIX: Record<WorkflowType, StepConfig[]> = {
  online_application: [
    { stepLevel: 1, stepName: "Registrar Review", requiredRole: "REGISTRAR", isFinal: true },
  ],
  enrollment: [
    { stepLevel: 1, stepName: "Registrar Enrollment Approval", requiredRole: "REGISTRAR", requiredDesignation: "HEAD", isFinal: true },
  ],
  assessment: [
    { stepLevel: 1, stepName: "Accounting Review", requiredRole: "ACCOUNTING", isFinal: false },
    { stepLevel: 2, stepName: "Accounting Head Approval", requiredRole: "ACCOUNTING", requiredDesignation: "HEAD", isFinal: true },
  ],
  discount: [
    { stepLevel: 1, stepName: "Accounting Officer Review (L1)", requiredRole: "ACCOUNTING", requiredDesignation: "OFFICER", isFinal: false },
    { stepLevel: 2, stepName: "Accounting Head Final Approval (L2)", requiredRole: "ACCOUNTING", requiredDesignation: "HEAD", isFinal: true },
  ],
  payment_void: [
    { stepLevel: 1, stepName: "Accounting Officer Review", requiredRole: "ACCOUNTING", isFinal: false },
    { stepLevel: 2, stepName: "Accounting Head Approval", requiredRole: "ACCOUNTING", requiredDesignation: "HEAD", isFinal: true },
  ],
  leave_request: [
    { stepLevel: 1, stepName: "HR Review", requiredRole: "HR", isFinal: false },
    { stepLevel: 2, stepName: "HR Head Approval", requiredRole: "HR", requiredDesignation: "HEAD", isFinal: true },
  ],
  grade_period: [
    { stepLevel: 1, stepName: "Principal Approval", requiredRole: "PRINCIPAL", isFinal: true },
  ],
  payroll_run: [
    { stepLevel: 1, stepName: "Payroll Officer Review", requiredRole: "PAYROLL", isFinal: false },
    { stepLevel: 2, stepName: "Payroll Head Approval", requiredRole: "PAYROLL", requiredDesignation: "HEAD", isFinal: true },
  ],
};

// ── SLA helper ────────────────────────────────────────────────────────────────

async function fetchSlaHours(workflowType: WorkflowType): Promise<number> {
  const { data } = await supabase
    .from("approval_sla_rules")
    .select("sla_hours")
    .eq("workflow_type", workflowType)
    .single();
  return data?.sla_hours ?? 8;
}

function addBusinessHours(from: Date, hours: number): Date {
  const result = new Date(from);
  let remaining = hours;
  while (remaining > 0) {
    result.setHours(result.getHours() + 1);
    const day = result.getDay();
    const h = result.getHours();
    if (day !== 0 && day !== 6 && h >= 8 && h < 17) {
      remaining--;
    }
  }
  return result;
}

// ── Authority validation ──────────────────────────────────────────────────────

export interface AuthorityCheck {
  canAct: boolean;
  reason?: string;
}

export function validateApprovalAuthority(
  step: Pick<StepConfig, "requiredRole" | "requiredDesignation" | "isFinal">,
  user: Pick<User, "role" | "designation" | "schoolId" | "isActive">,
  requestSchoolId?: string,
): AuthorityCheck {
  if (!user.isActive) return { canAct: false, reason: "Your account is inactive." };

  // Super Admin can act on any step
  if (user.role === "SUPER_ADMIN") return { canAct: true };

  // School scope check
  if (requestSchoolId && user.schoolId && user.schoolId !== requestSchoolId) {
    return { canAct: false, reason: "This request belongs to a different school scope." };
  }

  // Role check
  if (step.requiredRole && user.role !== step.requiredRole) {
    return { canAct: false, reason: `This step requires ${step.requiredRole} role.` };
  }

  // Designation check for final / head-only steps
  if (step.requiredDesignation && user.designation !== step.requiredDesignation) {
    return {
      canAct: false,
      reason: `This step requires ${step.requiredDesignation} designation. Your current designation (${user.designation ?? "unset"}) does not have authority.`,
    };
  }

  return { canAct: true };
}

// ── Core service functions ────────────────────────────────────────────────────

export interface CreateApprovalRequestParams {
  workflowType: WorkflowType;
  entityType: string;
  entityId: string;
  schoolId?: string;
  requestedBy?: string;
  requestedRole?: string;
  requestTitle: string;
  requestSummary?: string;
  priority?: ApprovalPriority;
}

/**
 * Creates an approval_request row + all required approval_steps for the workflow.
 * Returns the created request id.
 */
export async function createApprovalRequest(params: CreateApprovalRequestParams): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const slaHours = await fetchSlaHours(params.workflowType);
  const dueAt = addBusinessHours(new Date(), slaHours).toISOString();

  const requestRow: Omit<ApprovalRequestRow, "created_at" | "updated_at"> = {
    id,
    workflow_type: params.workflowType,
    entity_type: params.entityType,
    entity_id: params.entityId,
    school_id: params.schoolId,
    requested_by: params.requestedBy,
    requested_role: params.requestedRole,
    request_title: params.requestTitle,
    request_summary: params.requestSummary,
    status: "Draft",
    current_step_level: 1,
    priority: params.priority ?? "Normal",
    due_at: dueAt,
  };

  const { error: reqError } = await supabase
    .from("approval_requests")
    .insert({ ...requestRow, created_at: now, updated_at: now });

  if (reqError) {
    console.error("[approvalWorkflow] createApprovalRequest failed:", reqError);
    throw new Error(reqError.message);
  }

  // Insert all steps for this workflow
  const steps = APPROVAL_MATRIX[params.workflowType];
  const stepRows = steps.map((s) => ({
    id: crypto.randomUUID(),
    approval_request_id: id,
    step_level: s.stepLevel,
    step_name: s.stepName,
    required_role: s.requiredRole,
    required_designation: s.requiredDesignation,
    required_approval_level: s.requiredApprovalLevel ?? 1,
    status: "Pending" as ApprovalStepStatus,
    created_at: now,
    updated_at: now,
  }));

  const { error: stepsError } = await supabase.from("approval_steps").insert(stepRows);
  if (stepsError) {
    console.error("[approvalWorkflow] insert approval_steps failed:", stepsError);
  }

  return id;
}

/**
 * Submits a Draft request. Transitions: Draft → Submitted.
 * Also records the SUBMITTED audit action.
 */
export async function submitApprovalRequest(
  requestId: string,
  user: Pick<User, "id" | "role" | "designation" | "name">,
): Promise<void> {
  const now = new Date().toISOString();

  await supabase
    .from("approval_requests")
    .update({ status: "Submitted", submitted_at: now, updated_at: now })
    .eq("id", requestId);

  await appendApprovalAction({
    approvalRequestId: requestId,
    action: "SUBMITTED",
    actionBy: user.id,
    actionRole: user.role,
    actionDesignation: user.designation,
    previousStatus: "Draft",
    newStatus: "Submitted",
  });
}

/**
 * Approves the current step. Advances to next step or marks the full request Approved.
 * Validates authority before acting.
 */
export async function approveStep(
  requestId: string,
  user: Pick<User, "id" | "role" | "designation" | "schoolId" | "isActive" | "name">,
  remarks?: string,
): Promise<{ advanced: boolean; completed: boolean; blocked: AuthorityCheck }> {
  const { data: req } = await supabase
    .from("approval_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (!req) throw new Error("Approval request not found.");

  const steps = APPROVAL_MATRIX[req.workflow_type as WorkflowType];
  const currentStep = steps.find((s) => s.stepLevel === req.current_step_level);
  if (!currentStep) throw new Error("No step config found for current level.");

  const auth = validateApprovalAuthority(currentStep, user, req.school_id);
  if (!auth.canAct) return { advanced: false, completed: false, blocked: auth };

  const now = new Date().toISOString();
  const isLastStep = currentStep.isFinal;
  const newRequestStatus: ApprovalRequestStatus = isLastStep ? "Approved" : "In Review";
  const nextStepLevel = req.current_step_level + 1;

  const actionType: ApprovalActionType =
    isLastStep ? "APPROVED_FINAL" :
    req.current_step_level === 1 ? "APPROVED_LEVEL_1" : "APPROVED_LEVEL_2";

  // Mark the current step as approved
  await supabase
    .from("approval_steps")
    .update({ status: "Approved", acted_by: user.id, acted_at: now, remarks: remarks ?? null, updated_at: now })
    .eq("approval_request_id", requestId)
    .eq("step_level", req.current_step_level);

  // Update the request
  await supabase
    .from("approval_requests")
    .update({
      status: newRequestStatus,
      current_step_level: isLastStep ? req.current_step_level : nextStepLevel,
      completed_at: isLastStep ? now : null,
      updated_at: now,
    })
    .eq("id", requestId);

  await appendApprovalAction({
    approvalRequestId: requestId,
    action: actionType,
    actionBy: user.id,
    actionRole: user.role,
    actionDesignation: user.designation,
    previousStatus: req.status,
    newStatus: newRequestStatus,
    remarks,
  });

  return { advanced: !isLastStep, completed: isLastStep, blocked: { canAct: true } };
}

/**
 * Returns a request for correction. Remarks are required.
 */
export async function returnRequest(
  requestId: string,
  user: Pick<User, "id" | "role" | "designation" | "schoolId" | "isActive">,
  remarks: string,
): Promise<AuthorityCheck> {
  const { data: req } = await supabase
    .from("approval_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (!req) throw new Error("Approval request not found.");

  const steps = APPROVAL_MATRIX[req.workflow_type as WorkflowType];
  const currentStep = steps.find((s) => s.stepLevel === req.current_step_level);
  if (!currentStep) throw new Error("No step config for current level.");

  const auth = validateApprovalAuthority(currentStep, user, req.school_id);
  if (!auth.canAct) return auth;

  const now = new Date().toISOString();

  await supabase
    .from("approval_steps")
    .update({ status: "Returned", acted_by: user.id, acted_at: now, remarks, updated_at: now })
    .eq("approval_request_id", requestId)
    .eq("step_level", req.current_step_level);

  await supabase
    .from("approval_requests")
    .update({ status: "Returned", updated_at: now })
    .eq("id", requestId);

  await appendApprovalAction({
    approvalRequestId: requestId,
    action: "RETURNED",
    actionBy: user.id,
    actionRole: user.role,
    actionDesignation: user.designation,
    previousStatus: req.status,
    newStatus: "Returned",
    remarks,
  });

  return { canAct: true };
}

/**
 * Rejects a request. Remarks are required.
 */
export async function rejectRequest(
  requestId: string,
  user: Pick<User, "id" | "role" | "designation" | "schoolId" | "isActive">,
  remarks: string,
): Promise<AuthorityCheck> {
  const { data: req } = await supabase
    .from("approval_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (!req) throw new Error("Approval request not found.");

  const steps = APPROVAL_MATRIX[req.workflow_type as WorkflowType];
  const currentStep = steps.find((s) => s.stepLevel === req.current_step_level);
  if (!currentStep) throw new Error("No step config for current level.");

  const auth = validateApprovalAuthority(currentStep, user, req.school_id);
  if (!auth.canAct) return auth;

  const now = new Date().toISOString();

  await supabase
    .from("approval_steps")
    .update({ status: "Rejected", acted_by: user.id, acted_at: now, remarks, updated_at: now })
    .eq("approval_request_id", requestId)
    .eq("step_level", req.current_step_level);

  await supabase
    .from("approval_requests")
    .update({ status: "Rejected", completed_at: now, updated_at: now })
    .eq("id", requestId);

  await appendApprovalAction({
    approvalRequestId: requestId,
    action: "REJECTED",
    actionBy: user.id,
    actionRole: user.role,
    actionDesignation: user.designation,
    previousStatus: req.status,
    newStatus: "Rejected",
    remarks,
  });

  return { canAct: true };
}

/**
 * Cancels a request. Only the requester or Super Admin can cancel.
 */
export async function cancelRequest(
  requestId: string,
  user: Pick<User, "id" | "role" | "designation">,
  remarks?: string,
): Promise<void> {
  const now = new Date().toISOString();

  const { data: req } = await supabase
    .from("approval_requests")
    .select("status, requested_by")
    .eq("id", requestId)
    .single();

  if (!req) throw new Error("Approval request not found.");

  const canCancel = user.role === "SUPER_ADMIN" || req.requested_by === user.id;
  if (!canCancel) throw new Error("Only the requester or Super Admin can cancel this request.");

  await supabase
    .from("approval_requests")
    .update({ status: "Cancelled", cancelled_at: now, updated_at: now })
    .eq("id", requestId);

  await appendApprovalAction({
    approvalRequestId: requestId,
    action: "CANCELLED",
    actionBy: user.id,
    actionRole: user.role,
    actionDesignation: user.designation,
    previousStatus: req.status,
    newStatus: "Cancelled",
    remarks,
  });
}

/**
 * Super Admin override — bypasses normal authority. Mandatory remarks required.
 */
export async function overrideApproval(
  requestId: string,
  user: Pick<User, "id" | "role" | "designation">,
  remarks: string,
): Promise<void> {
  if (user.role !== "SUPER_ADMIN") {
    throw new Error("Override approval is restricted to Super Admin only.");
  }
  if (!remarks?.trim()) {
    throw new Error("Override remarks are mandatory.");
  }

  const { data: req } = await supabase
    .from("approval_requests")
    .select("status, current_step_level")
    .eq("id", requestId)
    .single();

  if (!req) throw new Error("Approval request not found.");

  const now = new Date().toISOString();

  await supabase
    .from("approval_steps")
    .update({ status: "Skipped", acted_by: user.id, acted_at: now, remarks: `[OVERRIDE] ${remarks}`, updated_at: now })
    .eq("approval_request_id", requestId)
    .eq("status", "Pending");

  await supabase
    .from("approval_requests")
    .update({ status: "Approved", completed_at: now, updated_at: now })
    .eq("id", requestId);

  await appendApprovalAction({
    approvalRequestId: requestId,
    action: "OVERRIDDEN",
    actionBy: user.id,
    actionRole: user.role,
    actionDesignation: user.designation,
    previousStatus: req.status,
    newStatus: "Approved",
    remarks,
  });
}

/**
 * Resubmits a Returned request. Transitions: Returned → Resubmitted.
 */
export async function resubmitApprovalRequest(
  requestId: string,
  user: Pick<User, "id" | "role" | "designation">,
): Promise<void> {
  const { data: req } = await supabase
    .from("approval_requests")
    .select("status, current_step_level")
    .eq("id", requestId)
    .single();

  if (!req) throw new Error("Approval request not found.");
  if (req.status !== "Returned") throw new Error("Only Returned requests can be resubmitted.");

  const now = new Date().toISOString();

  // Reset the returned step back to Pending
  await supabase
    .from("approval_steps")
    .update({ status: "Pending", acted_by: null, acted_at: null, remarks: null, updated_at: now })
    .eq("approval_request_id", requestId)
    .eq("step_level", req.current_step_level);

  await supabase
    .from("approval_requests")
    .update({ status: "Resubmitted", updated_at: now })
    .eq("id", requestId);

  await appendApprovalAction({
    approvalRequestId: requestId,
    action: "RESUBMITTED",
    actionBy: user.id,
    actionRole: user.role,
    actionDesignation: user.designation,
    previousStatus: "Returned",
    newStatus: "Resubmitted",
  });
}

/**
 * Returns the approval timeline (all actions sorted ascending by created_at).
 */
export async function getApprovalTimeline(requestId: string): Promise<ApprovalActionRow[]> {
  const { data, error } = await supabase
    .from("approval_actions")
    .select("*")
    .eq("approval_request_id", requestId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[approvalWorkflow] getApprovalTimeline failed:", error);
    return [];
  }
  return data ?? [];
}

/**
 * Returns the full request record with its steps and latest action.
 */
export async function getApprovalRequestDetails(requestId: string): Promise<{
  request: ApprovalRequestRow | null;
  steps: ApprovalStepRow[];
  timeline: ApprovalActionRow[];
}> {
  const [{ data: req }, steps, timeline] = await Promise.all([
    supabase.from("approval_requests").select("*").eq("id", requestId).single(),
    supabase.from("approval_steps").select("*").eq("approval_request_id", requestId).order("step_level"),
    getApprovalTimeline(requestId),
  ]);

  return {
    request: req ?? null,
    steps: steps.data ?? [],
    timeline,
  };
}

// ── Role → workflow mapping (shared across all inbox queries) ─────────────────

function getRoleWorkflows(role: string): WorkflowType[] {
  const map: Record<string, WorkflowType[]> = {
    ACCOUNTING:  ["assessment", "discount", "payment_void"],
    REGISTRAR:   ["online_application", "enrollment"],
    HR:          ["leave_request"],
    PRINCIPAL:   ["grade_period"],
    PAYROLL:     ["payroll_run"],
    ADMIN:       ["online_application", "enrollment", "assessment", "discount", "payment_void", "leave_request", "grade_period", "payroll_run"],
    SUPER_ADMIN: ["online_application", "enrollment", "assessment", "discount", "payment_void", "leave_request", "grade_period", "payroll_run"],
  };
  return map[role] ?? [];
}

/**
 * Client-side check: can the given user act on the current step of a request?
 * Returns the same AuthorityCheck used by the service-layer validator.
 */
export function canUserActOnRequest(
  request: ApprovalRequestRow,
  user: Pick<User, "role" | "designation" | "schoolId" | "isActive">,
): AuthorityCheck {
  const steps = APPROVAL_MATRIX[request.workflow_type as WorkflowType];
  if (!steps) return { canAct: false, reason: "Unknown workflow type." };
  const currentStep = steps.find((s) => s.stepLevel === request.current_step_level);
  if (!currentStep) return { canAct: false, reason: "No step config for current level." };
  return validateApprovalAuthority(currentStep, user, request.school_id);
}

/**
 * Returns all pending requests visible to the given user (role + school scope).
 * Used by the DB-backed Action Center tabs.
 */
export async function getApprovalInbox(
  user: Pick<User, "role" | "schoolId">,
): Promise<ApprovalRequestRow[]> {
  let query = supabase
    .from("approval_requests")
    .select("*")
    .in("status", ["Submitted", "In Review", "Resubmitted"])
    .order("due_at", { ascending: true });

  if (user.role !== "SUPER_ADMIN" && user.schoolId) {
    query = query.or(`school_id.eq.${user.schoolId},school_id.is.null`);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[approvalWorkflow] getApprovalInbox failed:", error);
    return [];
  }

  const allowedWorkflows = getRoleWorkflows(user.role);
  return (data ?? []).filter((r) => allowedWorkflows.includes(r.workflow_type as WorkflowType));
}

/**
 * Returns requests with status "Returned" that belong to the user's role scope.
 * These are items returned to the user's module for correction.
 */
export async function getReturnedToMeRequests(
  user: Pick<User, "role" | "schoolId" | "id">,
): Promise<ApprovalRequestRow[]> {
  let query = supabase
    .from("approval_requests")
    .select("*")
    .eq("status", "Returned")
    .order("updated_at", { ascending: false });

  if (user.schoolId) {
    query = query.or(`school_id.eq.${user.schoolId},school_id.is.null`);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[approvalWorkflow] getReturnedToMeRequests failed:", error);
    return [];
  }

  const roleWorkflows = getRoleWorkflows(user.role);
  return (data ?? []).filter(
    (r) =>
      r.requested_by === user.id ||
      roleWorkflows.includes(r.workflow_type as WorkflowType),
  );
}

/**
 * Returns all requests created by the current user, ordered by most recent first.
 */
export async function getSubmittedByMeRequests(
  user: Pick<User, "id">,
): Promise<ApprovalRequestRow[]> {
  const { data, error } = await supabase
    .from("approval_requests")
    .select("*")
    .eq("requested_by", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[approvalWorkflow] getSubmittedByMeRequests failed:", error);
    return [];
  }
  return data ?? [];
}

/**
 * Returns completed requests (Approved / Rejected / Cancelled / Voided) visible to the role.
 */
export async function getCompletedRequests(
  user: Pick<User, "role" | "schoolId">,
): Promise<ApprovalRequestRow[]> {
  let query = supabase
    .from("approval_requests")
    .select("*")
    .in("status", ["Approved", "Rejected", "Cancelled", "Voided"])
    .order("completed_at", { ascending: false })
    .limit(50);

  if (user.role !== "SUPER_ADMIN" && user.schoolId) {
    query = query.or(`school_id.eq.${user.schoolId},school_id.is.null`);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[approvalWorkflow] getCompletedRequests failed:", error);
    return [];
  }

  const allowedWorkflows = getRoleWorkflows(user.role);
  return (data ?? []).filter((r) => allowedWorkflows.includes(r.workflow_type as WorkflowType));
}

/**
 * Returns active requests where due_at has passed (SLA breached).
 */
export async function getOverdueRequests(
  user: Pick<User, "role" | "schoolId">,
): Promise<ApprovalRequestRow[]> {
  let query = supabase
    .from("approval_requests")
    .select("*")
    .in("status", ["Submitted", "In Review", "Resubmitted"])
    .lt("due_at", new Date().toISOString())
    .order("due_at", { ascending: true });

  if (user.role !== "SUPER_ADMIN" && user.schoolId) {
    query = query.or(`school_id.eq.${user.schoolId},school_id.is.null`);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[approvalWorkflow] getOverdueRequests failed:", error);
    return [];
  }

  const allowedWorkflows = getRoleWorkflows(user.role);
  return (data ?? []).filter((r) => allowedWorkflows.includes(r.workflow_type as WorkflowType));
}

// ── Utility: append audit action ─────────────────────────────────────────────

interface AppendActionParams {
  approvalRequestId: string;
  approvalStepId?: string;
  action: ApprovalActionType;
  actionBy: string;
  actionRole: string;
  actionDesignation?: string;
  previousStatus?: string;
  newStatus?: string;
  remarks?: string;
  metadata?: Record<string, unknown>;
}

async function appendApprovalAction(params: AppendActionParams): Promise<void> {
  const row = {
    id: crypto.randomUUID(),
    approval_request_id: params.approvalRequestId,
    approval_step_id: params.approvalStepId ?? null,
    action: params.action,
    action_by: params.actionBy,
    action_role: params.actionRole,
    action_designation: params.actionDesignation ?? null,
    previous_status: params.previousStatus ?? null,
    new_status: params.newStatus ?? null,
    remarks: params.remarks ?? null,
    metadata: params.metadata ?? null,
    created_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("approval_actions").insert(row);
  if (error) {
    console.error("[approvalWorkflow] appendApprovalAction failed:", error);
  }
}

/**
 * Looks up an existing approval_request for a given entity.
 * Useful for checking whether a request has already been created before re-creating one.
 */
export async function findApprovalRequestByEntity(
  entityId: string,
  workflowType: WorkflowType,
): Promise<ApprovalRequestRow | null> {
  const { data, error } = await supabase
    .from("approval_requests")
    .select("*")
    .eq("entity_id", entityId)
    .eq("workflow_type", workflowType)
    .not("status", "in", '("Cancelled","Rejected")')
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("[approvalWorkflow] findApprovalRequestByEntity failed:", error);
  }
  return data ?? null;
}

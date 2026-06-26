/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * DB-backed approval inbox hook.
 * Fetches all six Action Center tab datasets from Supabase in parallel.
 * Reference: STSN_APPROVAL_WORKFLOW_BEST_PRACTICE_PROCESS.md §10.2
 */

import { useState, useEffect, useCallback } from "react";
import { useSTSNStore } from "../services/store";
import {
  getApprovalInbox,
  getReturnedToMeRequests,
  getSubmittedByMeRequests,
  getCompletedRequests,
  getOverdueRequests,
  canUserActOnRequest,
  type ApprovalRequestRow,
} from "../services/approvalWorkflowService";

export interface ApprovalInboxState {
  /** Active items where the current user has authority to approve/act. */
  forMyApproval: ApprovalRequestRow[];
  /** Active items in the user's role scope but where the user lacks final-approval designation. */
  forMyReview: ApprovalRequestRow[];
  /** Items returned to the user's module or submitted by this user that were returned. */
  returnedToMe: ApprovalRequestRow[];
  /** All requests created by the current user. */
  submittedByMe: ApprovalRequestRow[];
  /** Approved / Rejected / Cancelled / Voided requests in the user's scope. */
  completed: ApprovalRequestRow[];
  /** Active requests past their SLA due date. */
  overdue: ApprovalRequestRow[];
  loading: boolean;
  refresh: () => void;
}

export function useApprovalInbox(): ApprovalInboxState {
  const { currentUser } = useSTSNStore();

  const [loading, setLoading] = useState(false);
  const [forMyApproval, setForMyApproval] = useState<ApprovalRequestRow[]>([]);
  const [forMyReview, setForMyReview] = useState<ApprovalRequestRow[]>([]);
  const [returnedToMe, setReturnedToMe] = useState<ApprovalRequestRow[]>([]);
  const [submittedByMe, setSubmittedByMe] = useState<ApprovalRequestRow[]>([]);
  const [completed, setCompleted] = useState<ApprovalRequestRow[]>([]);
  const [overdue, setOverdue] = useState<ApprovalRequestRow[]>([]);

  const fetch = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [inbox, returned, submitted, completedItems, overdueItems] = await Promise.all([
        getApprovalInbox(currentUser),
        getReturnedToMeRequests(currentUser),
        getSubmittedByMeRequests(currentUser),
        getCompletedRequests(currentUser),
        getOverdueRequests(currentUser),
      ]);

      // Split inbox into "For My Approval" (user can act) vs "For My Review" (role matches, designation doesn't)
      const approval: ApprovalRequestRow[] = [];
      const review: ApprovalRequestRow[] = [];
      for (const item of inbox) {
        if (canUserActOnRequest(item, currentUser).canAct) {
          approval.push(item);
        } else {
          review.push(item);
        }
      }

      setForMyApproval(approval);
      setForMyReview(review);
      setReturnedToMe(returned);
      setSubmittedByMe(submitted);
      setCompleted(completedItems);
      setOverdue(overdueItems);
    } catch (err) {
      console.error("[useApprovalInbox] fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    forMyApproval,
    forMyReview,
    returnedToMe,
    submittedByMe,
    completed,
    overdue,
    loading,
    refresh: fetch,
  };
}

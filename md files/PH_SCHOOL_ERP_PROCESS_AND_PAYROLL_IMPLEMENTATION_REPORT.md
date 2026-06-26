# STSN Connect Payroll Routing Implementation Report

Date implemented: 2026-06-25  
Source review: `PH_SCHOOL_ERP_PROCESS_AND_PAYROLL_REVIEW.md`  
Scope implemented: Phase 1, Restore Payroll Rendering; Phase 2 Payroll Workflow Alignment foundation; Phase 3 Enrollment Hardening foundation; Phase 4 Role Approval Queues foundation; Phase 5 Philippine Statutory Payroll Configuration foundation

## Summary

The Payroll blank screen issue has been fixed by adding a dedicated Payroll rendering path and separate Payroll sub-page state. Payroll sidebar child clicks now route to Payroll pages instead of updating Accounting sub-page state.

This implementation intentionally stays within the review's requested Phase 1 scope. The later workflow alignment, enrollment hardening, approval queues, and Philippine statutory payroll configuration recommendations remain pending future phases.

Update: Phase 2 payroll workflow alignment is implemented at the foundation level. Payroll Management now supports the newer payroll period, run, line, exception review, approval, and payout-batch handoff path while keeping the old legacy payroll ledger visible for compatibility.

Update: Phase 3 and Phase 4 have started. Registrar enrollment actions now use actual enrollment records and scoped assessments, online applications have a Registrar review queue, enrollment statuses now track cross-office handoffs, and dashboard/faculty queue surfaces were added for role workflows.

Update: Phase 5 foundation is implemented. Statutory contribution rules and tax tables are loaded as effective-dated configuration, Benefits/Taxes display configured rows, payroll computation reads configured statutory rules first, and starter seed migrations were added for statutory rules and withholding brackets.

## Files Changed

- `src/App.tsx`
  - Added `PayrollModulePage` render branch for `PAYROLL_MANAGEMENT`.
  - Added `payrollSubPage` state with default `payroll-management`.
  - Routed Payroll sidebar children to `setPayrollSubPage`.
  - Routed Payroll-only users to `PAYROLL_MANAGEMENT` after login.
  - Added a fallback unavailable-module message to avoid future blank white content when a module is not rendered or is not permitted.

- `src/features/payroll/pages/PayrollModulePage.tsx`
  - Added a dedicated Payroll module shell.
  - Reused existing payroll-related pages:
    - Payroll Management
    - Salary Payouts
    - Taxes
    - Benefits

- `src/features/hr/pages/sub-pages/PayrollManagementPage.tsx`
  - Added payroll run generation using payroll periods, payroll runs, and payroll lines.
  - Added duplicate active-run prevention per school/payroll period.
  - Added computed-run approval.
  - Added payout batch creation only from approved payroll runs.
  - Kept the legacy payroll ledger path visible as a compatibility option.

- `src/services/store.ts`
  - Added salary payout line creation.
  - Updated payroll run approval/release behavior to propagate status to payroll lines.
  - Updated payout release behavior to mark payout lines, payroll lines, and the payroll run as released.
  - Added enrollment status update support.
  - Added online enrollment application review status support.
  - Updated Accounting assessment approval to move linked enrollments to `For Payment`.
  - Updated Cashier payment posting to move linked enrollments to `Partially Paid` or `Enrolled`.
  - Added statutory contribution rules to loaded application state.

- `src/features/registrar/pages/RegistrarModulePage.tsx`
  - Replaced generated enrollment-id approval/rejection assumptions with the selected enrollment id.
  - Scoped selected assessment lookup by enrollment-linked assessment, school year, semester, and school.
  - Added Online Review Queue for online enrollment applications.
  - Added Registrar status actions for For Completion, Accept, and Reject.

- `supabase/migrations/0031_enrollment_workflow_statuses.sql`
  - Expanded `students.enrollment_status` and `enrollments.status` constraints for standard workflow handoff states.

- `src/features/dashboard/pages/DashboardPage.tsx`
  - Added Principal/Admin oversight queue for enrollment handoffs, assessment review, payment queue, grade finalization, and sections without advisers.

- `src/features/faculty/pages/FacultyPortalPage.tsx`
  - Added Faculty grade submission queue for assigned teaching loads.

- `src/features/hr/utils/payrollCalculations.ts`
  - Updated statutory deductions to prefer configured effective-dated contribution rules.
  - Kept simplified fallback logic only for missing configuration.

- `src/features/hr/pages/sub-pages/BenefitsPage.tsx`
  - Added effective-dated statutory contribution rule table.
  - Removed hardcoded statutory rate cards from the React component.

- `src/features/hr/pages/sub-pages/TaxesPage.tsx`
  - Removed hardcoded default tax table from the React component.
  - Displays configured tax table rows from data only.

- `src/features/payroll/pages/sub-pages/*`
  - Added Payroll-owned sub-page entry files for Payroll Management, Salary Payouts, Taxes, and Benefits.

- `supabase/migrations/0032_statutory_contribution_rule_seed.sql`
  - Added starter effective-dated statutory contribution rule seed rows.

- `supabase/migrations/0033_withholding_tax_table_seed.sql`
  - Added starter effective-dated withholding tax table seed rows.

## Implemented Behavior

Payroll sidebar group now renders:

1. Payroll Management
2. Salary Payouts
3. Taxes
4. Benefits

Each child page uses separate Payroll module state, so selecting a Payroll child no longer changes Accounting navigation state.

Payroll Management now supports this Phase 2 foundation workflow:

1. Generate payroll run for the current semi-monthly period.
2. Block duplicate active runs for the same school and payroll period.
3. Approve the computed run.
4. Create a payout batch only after approval.
5. Release payout batch from Salary Payouts, updating related line/run statuses.

Registrar and role queues now support this partial Phase 3/4 workflow:

1. Registrar reviews online applications from a dedicated queue.
2. Registrar can mark applications For Completion, Accepted, or Rejected.
3. Enrollment approval/rejection uses the real enrollment id.
4. Assessment submission keeps enrollment in `For Assessment`.
5. Accounting approval moves enrollment to `For Payment`.
6. Cashier payment posting moves enrollment to `Partially Paid` or `Enrolled`.
7. Principal/Admin and Faculty dashboards expose queue-style workflow visibility.

Payroll statutory configuration now supports this Phase 5 foundation workflow:

1. Configure statutory benefit plans.
2. Maintain effective-year contribution rules per benefit plan.
3. Maintain effective-year withholding tax tables and brackets.
4. Payroll computation reads configured statutory contribution rules first.
5. Benefits and Taxes pages display configured data instead of hardcoded React reference cards.

## Verification

- `npm.cmd run lint`
  - Passed.
  - TypeScript check completed with `tsc --noEmit`.

- `npm.cmd run build`
  - First sandboxed attempt failed because Vite/esbuild could not read `vite.config.ts` due to access restrictions.
  - Escalated build completed successfully.
  - Vite reported only the existing large chunk size warning.
  - After the Phase 2 payroll workflow changes, the sandboxed build failed again for the same Vite/esbuild access restriction.
  - The follow-up escalation request was not approved, so production build verification for the Phase 2 changes remains pending.
- After the Phase 3/4 partial workflow changes, the sandboxed build failed for the same Vite/esbuild access restriction.
- The follow-up escalation request was not approved, so production build verification for the Phase 3/4 partial changes remains pending.
- After the Phase 5 foundation changes, `npm.cmd run lint` passed.
- Final production build verification remains pending because the sandbox blocks Vite/esbuild from reading `vite.config.ts`, and the final escalation request was not approved.

## Pending Items From Review

These were not changed because they are listed as later implementation phases:

- Move all Payroll pages fully into `src/features/payroll`.
- Finish retiring the legacy flat payroll ledger path after data migration/backfill.
- Finish deeper enrollment hardening around merge/create workflows for unlinked online applications.
- Add formal Principal academic exception approval actions.
- Add formal grade submission/review states beyond the current queue visibility.
- Add Cashier void/reversal approval flow and end-of-day closing controls.
- Validate annual statutory contribution and tax seed values against official SSS, PhilHealth, Pag-IBIG, and BIR schedules before production payroll release.

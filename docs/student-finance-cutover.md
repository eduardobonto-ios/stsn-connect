# Student finance production cutover

The finance migration must remain unapplied until a current production-data clone passes every gate below. A disposable local restore is sufficient; a permanent staging environment is not required. Do not manually edit canonical invoice, receipt, allocation, reversal, or journal facts to repair a failed cutover.

## Essential readiness gates

- Application build and TypeScript validation pass.
- Every active application user has one matching Supabase Auth account before finance writes are reopened. The finance migration can run earlier for an unreleased project, but it will keep `student_finance_writes` disabled and postflight will continue reporting unlinked users until provisioning is complete.
- Finance maintenance is visible and `student_finance_writes` is disabled.
- The read-only preflight returns zero for every issue category.
- The migration completes as one transaction without an assertion failure.
- The postflight returns `PASS` while writes are still disabled.
- Anonymous and incorrect-role finance operations fail.
- Authorized, school-scoped Registrar, Cashier, and Accounting operations succeed.
- Student and Guardian accounts can read only their linked canonical invoices, receipts, allocations, and installments.
- Realtime reports `connected` and a posted clone transaction refreshes every affected module.

1. Take and verify a restorable production snapshot.
2. Deploy the Supabase Auth-capable application while finance writes remain closed.
3. Apply `20260720110000_production_auth_bridge.sql`.
4. Run `npm run provision:auth-users` for a dry run, resolve every duplicate or missing email, then run `npm run provision:auth-users:apply`. The service-role key belongs only in the deployment secret store.
5. Run `npm run validate:auth-bridge` or `supabase/validation/production_auth_bridge_ui_users.sql`. Every auth bridge issue count must be zero before UI smoke tests. See [Production Auth Bridge UI validation](production-auth-bridge-ui-validation.md).
6. For unreleased-project UI validation only, set a temporary local `E2E_PASSWORD`, provide explicit test-account emails through `E2E_AUTH_TARGET_EMAILS` or role-specific `E2E_*_EMAIL` variables, and run `npm run provision:auth-users:e2e`. Do not commit or share the password; replace this with invitation/password-reset access before real production use.
7. Run `supabase/validation/student_finance_preflight.sql` on the clone. Every count must be zero.
8. Reset the complete migration chain on a clean local database and run `npm run test:db:finance`.
9. Apply `20260720120000_student_finance_production_posting.sql` to the clone.
10. Run `supabase/validation/student_finance_postflight.sql`, authorization tests, and Cashiering, Accounting, Registrar, Student, and Guardian smoke tests.
11. Repeat the controlled sequence in production during the approved maintenance window.
12. Only after all checks pass, enable writes as a database operator:

```sql
update public.system_runtime_controls
set enabled = true,
    changed_at = now(),
    remarks = 'Enabled after approved reconciliation and smoke tests'
where control_key = 'student_finance_writes';
```

If the migration fails, its transaction rolls back. Correct the identified source records and retry. If a post-commit gate fails, keep maintenance enabled and follow the [emergency rollback runbook](student-finance-emergency-rollback.md); restoring the verified snapshot remains the preferred recovery.

## When no clone is available

This is the minimum acceptable production-only fallback:

1. Verify the snapshot can be restored, not merely created.
2. Keep the application in maintenance and stop every finance writer, import, job, and integration.
3. Apply the Auth bridge, provision users, and require `validate:auth-bridge` to pass before UI testing.
4. Run the finance preflight before the finance migration.
5. Execute the finance migration and postflight without reopening the application.
6. Sign in with separate Registrar, Cashier, Accounting, Student, and Guardian test accounts.
7. Keep writes disabled until all smoke tests and realtime checks pass.
8. Restore the snapshot if any post-commit gate fails.

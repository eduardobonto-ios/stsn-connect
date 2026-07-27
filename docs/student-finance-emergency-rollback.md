# Student finance emergency rollback

Use this procedure only for `20260720120000_student_finance_production_posting.sql`.

## If migration execution reports an error

Do not run a rollback script. The migration is enclosed in one transaction, so PostgreSQL automatically rolls back its DDL and data changes. Record the complete error, correct the reported source data or migration defect, and retry.

Confirm the migration was not recorded as applied and that these archive objects do not exist:

```sql
select
  to_regclass('public.payments_legacy') as payments_archive,
  to_regclass('public.student_finance_invoices') as normalized_invoices;
```

## If migration committed but postflight failed

1. Keep application maintenance enabled.
2. Do not enable `student_finance_writes`.
3. Stop imports, jobs, integrations, and every finance user session.
4. Preserve the migration and postflight output.
5. Prefer restoring the verified pre-migration snapshot when available.
6. If no post-cutover finance activity occurred, execute [the guarded rollback SQL](../supabase/rollback/20260720120000_student_finance_production_posting_rollback.sql) as one complete script.

The rollback script aborts if it detects a new receipt, allocation, adjustment, reversal, void request, or reallocation request. This is deliberate: those facts cannot be safely flattened into the legacy one-payment-to-one-assessment model.

## After the guarded rollback

- Finance writes remain disabled.
- The six legacy finance tables are restored under their original names and exposed read-only to authenticated users.
- Normalized copied facts are removed only after the script proves no post-cutover activity exists.
- Supabase Auth/RBAC remains installed; this rollback does not restore demo login or anonymous finance access.
- Keep the application in maintenance while correcting the incompatibility.
- Before retrying, take another snapshot and rerun the Auth-link check and finance preflight.

## If the rollback script refuses to run

Do not bypass its checks or manually delete canonical facts. Restore the verified database snapshot. If no usable snapshot exists, preserve the database and build a targeted forward repair based on the reported records.


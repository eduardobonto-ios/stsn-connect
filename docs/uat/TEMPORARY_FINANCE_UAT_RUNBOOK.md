# Temporary Finance UAT Runbook

This runbook enables the demo-only `public.users` login posture for the walk-in
Registrar → Accounting → Cashier workflow. It is not a production authorization
model: finance RPCs are executable with the public anon key while UAT is open.

## Pre-deployment gates

1. Take a database snapshot and verify that it can be restored.
2. Link the Supabase CLI to the non-production project and run
   `supabase migration list --linked`.
3. Apply every missing migration in chronological order to a disposable clone.
   Do not cherry-pick only the anon grants: the finance posting schema and auth
   bridge are prerequisites even though Supabase Auth is not used by the demo UI.
4. Run `npm run test:db:finance`, `npm run lint`, and `npm run build`.
5. Run the finance postflight validation and confirm canonical invoice, receipt,
   allocation, and journal counts reconcile before enabling writes.

The UAT migrations add transactional walk-in/draft-assessment RPCs, restore anon
read access to the finance runtime control, and normalize the known Accounting
demo identities so they cannot enter Cashiering.

## Enable after smoke checks

```sql
update public.system_runtime_controls
set enabled = true,
    changed_at = now(),
    remarks = 'Temporary finance UAT enabled after reconciliation and smoke checks.'
where control_key = 'student_finance_writes';
```

Reload the application after changing the control so the store reads the new
value. Then rerun matrix scenarios 1.1b, 2.1–2.7, 3.2–3.10, 4.2–4.14, and
5.1–5.9. Online enrollment scenarios 1.3, 1.6, and 1.7 remain a separate scope.

## Immediate shutdown

Disable finance writes as soon as UAT ends or if reconciliation, permissions,
or posting behavior is unexpected:

```sql
update public.system_runtime_controls
set enabled = false,
    changed_at = now(),
    remarks = 'Temporary finance UAT disabled.'
where control_key = 'student_finance_writes';
```

Disabling the switch stops the transactional assessment and payment RPCs before
they mutate data. Restore the verified snapshot if canonical finance facts need
to be rolled back.

# Production Auth Bridge UI validation

Use this after `20260720110000_production_auth_bridge.sql` and before relying on UI smoke tests.

## 1. Validate current bridge state

Run with a service-role key in your local shell or deployment secret store:

```bash
VITE_SUPABASE_URL=your_supabase_url \
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key \
npm run validate:auth-bridge
```

Expected result:

- No `ACTIVE_USER_WITHOUT_AUTH_LINK`
- No `AUTH_EMAIL_LINK_MISMATCH`
- No active application user missing a matching Supabase Auth account

You can also run `supabase/validation/production_auth_bridge_ui_users.sql` in Supabase SQL Editor. Every `passed` value must be `true`.

## 2. Provision and link users

Dry run:

```bash
VITE_SUPABASE_URL=your_supabase_url \
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key \
npm run provision:auth-users
```

Apply:

```bash
VITE_SUPABASE_URL=your_supabase_url \
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key \
npm run provision:auth-users:apply
```

The provisioning workflow links `public.users.auth_user_id` by unique normalized email and invites missing Supabase Auth users.

## 3. Optional E2E password setup

For unreleased-project UI validation only, reset selected test accounts to a temporary local password.

Provide the target test emails explicitly through `E2E_*_EMAIL` variables or a comma-separated `E2E_AUTH_TARGET_EMAILS` value:

```bash
VITE_SUPABASE_URL=your_supabase_url \
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key \
E2E_PASSWORD=your_temporary_test_password \
E2E_AUTH_TARGET_EMAILS=cashier@stsn.edu.ph,accounting@stsn.edu.ph,registrar@stsn.edu.ph \
npm run provision:auth-users:e2e
```

Do not commit or share the temporary password. Replace this with normal Supabase invitation/password-reset access before real production use.

## 4. Run UI smoke tests

```bash
E2E_PASSWORD=your_temporary_test_password \
npm run test:e2e -- tests/e2e/auth.spec.ts tests/e2e/smoke.spec.ts tests/e2e/workflows.spec.ts tests/e2e/cashier.spec.ts
```

If the login screen still reports that the Supabase account is not linked to an active application user, rerun the validation query and resolve the listed account before retesting.

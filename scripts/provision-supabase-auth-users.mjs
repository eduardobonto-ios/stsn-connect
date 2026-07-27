import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const apply = process.argv.includes("--apply");
const validateOnly = process.argv.includes("--validate-only");
const setE2ePassword = process.argv.includes("--set-e2e-password");
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const e2ePassword = process.env.E2E_PASSWORD ?? "";

const e2eTargetAccounts = [
  process.env.E2E_SUPER_ADMIN_EMAIL,
  process.env.E2E_REGISTRAR_EMAIL,
  process.env.E2E_ACCOUNTING_EMAIL,
  process.env.E2E_CASHIER_EMAIL,
  process.env.E2E_STUDENT_EMAIL,
  process.env.E2E_PARENT_EMAIL,
  ...(process.env.E2E_AUTH_TARGET_EMAILS ?? "").split(","),
]
  .map((email) => email?.trim().toLowerCase() ?? "")
  .filter(Boolean);

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY are required.");
}
if (setE2ePassword && !apply) {
  throw new Error("--set-e2e-password requires --apply.");
}
if (setE2ePassword && !e2ePassword) {
  throw new Error("--set-e2e-password requires E2E_PASSWORD.");
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const normalizeEmail = (value) => value.trim().toLowerCase();
const maskEmail = (email) => email.replace(/^(.).+(@.*)$/, "$1***$2");

const { data: applicationUsers, error: applicationUsersError } = await admin
  .from("users")
  .select("id,email,name,role,is_active,auth_user_id")
  .eq("is_active", true)
  .order("email");
if (applicationUsersError) throw applicationUsersError;

const missingEmails = applicationUsers.filter((user) => !user.email?.trim());
if (missingEmails.length) {
  throw new Error(`Active application users without email: ${missingEmails.map((u) => u.id).join(", ")}`);
}

const emailCounts = new Map();
for (const user of applicationUsers) {
  const email = normalizeEmail(user.email);
  emailCounts.set(email, (emailCounts.get(email) ?? 0) + 1);
}
const duplicateEmails = [...emailCounts].filter(([, count]) => count > 1).map(([email]) => email);
if (duplicateEmails.length) {
  throw new Error(`Duplicate active application-user emails: ${duplicateEmails.join(", ")}`);
}

const authUsers = [];
for (let page = 1; ; page += 1) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
  if (error) throw error;
  authUsers.push(...data.users);
  if (data.users.length < 1000) break;
}

const authByEmail = new Map();
for (const authUser of authUsers) {
  if (!authUser.email) continue;
  const email = normalizeEmail(authUser.email);
  if (authByEmail.has(email)) {
    throw new Error(`Multiple Supabase Auth accounts use ${email}; resolve before provisioning.`);
  }
  authByEmail.set(email, authUser);
}

const issues = [];
for (const applicationUser of applicationUsers) {
  const email = normalizeEmail(applicationUser.email);
  const authUser = authByEmail.get(email);
  if (!authUser) {
    issues.push({ issue: "ACTIVE_USER_WITHOUT_AUTH_ACCOUNT", email });
    continue;
  }
  if (applicationUser.auth_user_id && applicationUser.auth_user_id !== authUser.id) {
    issues.push({ issue: "AUTH_LINK_POINTS_TO_DIFFERENT_EMAIL_MATCH", email });
  }
  if (!applicationUser.auth_user_id) {
    issues.push({ issue: "ACTIVE_USER_WITHOUT_AUTH_LINK", email });
  }
}

if (issues.length) {
  console.table(issues.map((issue) => ({ ...issue, email: maskEmail(issue.email) })));
  if (validateOnly) {
    process.exitCode = 1;
  }
} else {
  console.log("Auth bridge validation passed: all active application users are linked by unique email.");
}
if (validateOnly) {
  process.exit();
}

let linked = 0;
let invited = 0;
let passwordResets = 0;
for (const applicationUser of applicationUsers) {
  const email = normalizeEmail(applicationUser.email);
  let authUser = authByEmail.get(email);
  const action = authUser ? "link" : "invite";
  const shouldSetPassword = setE2ePassword && e2eTargetAccounts.includes(email);
  console.log(
    `${apply ? "APPLY" : "DRY-RUN"} ${action}${shouldSetPassword ? " + e2e-password-reset" : ""}: ${email}`,
  );
  if (!apply) continue;

  if (!authUser) {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { application_user_id: applicationUser.id, display_name: applicationUser.name },
    });
    if (error) throw new Error(`Invitation failed for ${email}: ${error.message}`);
    authUser = data.user;
    invited += 1;
  }

  if (applicationUser.auth_user_id && applicationUser.auth_user_id !== authUser.id) {
    throw new Error(`${email} is already linked to a different Auth account.`);
  }
  const { error: linkError } = await admin
    .from("users")
    .update({ auth_user_id: authUser.id })
    .eq("id", applicationUser.id);
  if (linkError) throw new Error(`Link failed for ${email}: ${linkError.message}`);
  linked += 1;

  if (shouldSetPassword) {
    const { error: passwordError } = await admin.auth.admin.updateUserById(authUser.id, {
      password: e2ePassword,
      email_confirm: true,
      user_metadata: {
        ...(authUser.user_metadata ?? {}),
        application_user_id: applicationUser.id,
        display_name: applicationUser.name,
      },
    });
    if (passwordError) throw new Error(`E2E password reset failed for ${email}: ${passwordError.message}`);
    passwordResets += 1;
  }
}

console.log(
  apply
    ? `Completed: ${linked} application users linked; ${invited} invitations sent; ${passwordResets} E2E passwords reset.`
    : `Dry run complete: ${applicationUsers.length} active users checked. Re-run with --apply to link and invite.`,
);

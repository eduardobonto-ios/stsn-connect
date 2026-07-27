/**
 * Safety guard + DB verification helpers for the Teacher→Employee **mutation**
 * UAT (docs/TEACHERS_TO_EMPLOYEES_UAT_CHECKLIST.md → "Mutation UAT Required
 * Before Phase 6").
 *
 * Unlike the rest of the E2E suite (read-only), this file backs a spec that
 * WRITES rows through the app UI, so it is fenced behind an explicit opt-in and
 * a "this is not production" target check. If either gate is not satisfied the
 * spec skips with a clear message rather than mutating an unknown database.
 *
 * No secrets are hard-coded here. The verification client uses a service-role
 * key ONLY if one is present in the local environment; otherwise it falls back
 * to the same anon client the app itself uses (RLS on these tables is currently
 * open — see the UAT checklist "RLS Risk" note — so anon reads/writes succeed).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { type Page } from "@playwright/test";
import { ensureLoggedOut } from "./auth";

/** Bridged faculty account used to drive the write flows. */
export const FACULTY_EMAIL =
  process.env.PLAYWRIGHT_TEST_USER_EMAIL ?? process.env.E2E_TEACHER_EMAIL ?? "teacher@stsn.edu.ph";
const FACULTY_PASSWORD =
  process.env.PLAYWRIGHT_TEST_USER_PASSWORD ?? process.env.E2E_PASSWORD ?? "";

/**
 * Target environments we consider safe to mutate. The runner must set
 * MUTATION_UAT_TARGET to one of these (case-insensitive). "production"/"prod"
 * are explicitly rejected even if the opt-in flag is set.
 */
const SAFE_TARGETS = new Set(["local", "demo", "uat", "test"]);
const PROD_URL_HINTS = [/\bprod\b/i, /production/i, /\blive\b/i];

/**
 * Returns a human-readable skip reason if the mutation UAT must NOT run in the
 * current environment, or `null` when it is safe to proceed.
 *
 * Gates (all required):
 *  1. ALLOW_MUTATION_UAT === "true" (explicit opt-in).
 *  2. MUTATION_UAT_TARGET names a known-safe environment (local/demo/uat/test).
 *  3. The Supabase URL does not look like a production project.
 *  4. A Supabase URL + at least the anon key are available for verification.
 */
export function mutationUatSkipReason(): string | null {
  if (process.env.ALLOW_MUTATION_UAT !== "true") {
    return "Mutation UAT is opt-in. Set ALLOW_MUTATION_UAT=true against a safe (local/demo/uat/test) database to run it.";
  }

  const target = (process.env.MUTATION_UAT_TARGET ?? "").trim().toLowerCase();
  if (!SAFE_TARGETS.has(target)) {
    return `MUTATION_UAT_TARGET must be one of ${[...SAFE_TARGETS].join(", ")} (got "${target || "unset"}"). Refusing to mutate an unconfirmed database.`;
  }

  const url = process.env.VITE_SUPABASE_URL ?? "";
  if (!url) {
    return "VITE_SUPABASE_URL is not set — cannot verify written rows. Point tests at a safe Supabase project.";
  }
  if (PROD_URL_HINTS.some((re) => re.test(url))) {
    return `VITE_SUPABASE_URL ("${url}") looks like a production project. Refusing to run mutation UAT against it.`;
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.VITE_SUPABASE_ANON_KEY) {
    return "No SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY available for post-write DB verification.";
  }

  return null;
}

/**
 * Supabase client used to VERIFY (and clean up) rows after the UI writes them.
 * Prefers a service-role key when present (bypasses RLS, enables safe teardown);
 * otherwise reuses the anon key. Never logs the key.
 */
export function getVerifyClient(): SupabaseClient {
  const url = process.env.VITE_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

/** True when a service-role key is available (so cleanup deletes are reliable). */
export function hasServiceRole(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** Unique, greppable marker for the rows a single test run touches. */
export function makeMarker(flow: string): string {
  return `MUTATION_UAT_${flow}_${Date.now()}`;
}

/**
 * ISO timestamp a few seconds in the past, used as a lower bound when locating
 * the row a UI action just created (`created_at >= boundary`). The small skew
 * absorbs clock differences between the test host and the DB.
 */
export function boundaryIso(): string {
  return new Date(Date.now() - 5000).toISOString();
}

/** Log in as the bridged faculty account (email + password, no secrets echoed). */
export async function loginAsFaculty(page: Page): Promise<void> {
  await ensureLoggedOut(page);
  await page.fill('input[type="email"]', FACULTY_EMAIL);
  await page.fill('input[type="password"]', FACULTY_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForSelector('input[type="email"]', { state: "detached", timeout: 30_000 });
  await page.waitForSelector("aside nav", { timeout: 30_000 });
}

/**
 * Resolve the signed-in faculty account's `teachers` row id + `employee_id`
 * straight from the DB, so verification/cleanup can key off ownership without
 * scraping the UI. Returns null if no teacher row matches the email.
 */
export async function resolveFacultyOwnership(
  client: SupabaseClient
): Promise<{ teacherId: string; employeeId: string | null } | null> {
  const { data } = await client
    .from("teachers")
    .select("id, employee_id, email")
    .ilike("email", FACULTY_EMAIL)
    .limit(1);
  const row = data?.[0];
  return row ? { teacherId: row.id, employeeId: row.employee_id ?? null } : null;
}

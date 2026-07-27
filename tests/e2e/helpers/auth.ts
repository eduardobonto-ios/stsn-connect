/**
 * Auth helpers for the STSN Connect E2E suite.
 *
 * Uses the restored demo login flow: active public.users email + password123.
 * E2E_PASSWORD may override the default for disposable UAT runs.
 */
import { expect, type Page } from "@playwright/test";
import { ACCOUNTS, E2E_PASSWORD, type Role } from "./test-data";

const APP_READY = "aside nav";
const LOGIN_EMAIL = 'input[type="email"]';
const DEMO_PASSWORD = E2E_PASSWORD || "password123";

/** True when the authenticated app shell (sidebar nav) is visible. */
async function isLoggedIn(page: Page): Promise<boolean> {
  return page
    .locator(APP_READY)
    .first()
    .isVisible()
    .catch(() => false);
}

/** Open the header user menu and click "Exit Connect Session". */
export async function logout(page: Page): Promise<void> {
  await page.getByRole("button", { name: /open user menu/i }).click();
  await page.getByRole("button", { name: /exit connect session/i }).click();
  await page.waitForSelector(LOGIN_EMAIL, { timeout: 15_000 });
}

/**
 * Guarantee we are on the login overlay.
 *
 * Supabase persists its own session. A reused browser context may therefore
 * begin authenticated; normalize it through the real logout flow.
 */
export async function ensureLoggedOut(page: Page): Promise<void> {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector(APP_READY, { timeout: 45_000 }).catch(() => {});
  if (await isLoggedIn(page)) {
    await logout(page);
  }
  await page.waitForSelector(LOGIN_EMAIL, { timeout: 15_000 });
}

/**
 * Fill the login form and submit; resolves once the demo login completed.
 * We wait for the overlay to detach and then for the app shell.
 */
export async function loginByEmail(page: Page, email: string): Promise<void> {
  await ensureLoggedOut(page);
  await page.fill(LOGIN_EMAIL, email);
  const password = page.locator('input[type="password"]');
  await password.fill(DEMO_PASSWORD);
  await password.press("Enter");
  await page.waitForSelector(LOGIN_EMAIL, { state: "detached", timeout: 30_000 });
  await page.waitForSelector(APP_READY, { timeout: 30_000 });
}

/** Log in as a named role using its provisioned test account. */
export async function login(page: Page, role: Role): Promise<void> {
  await loginByEmail(page, ACCOUNTS[role]);
}

/** Assert the authenticated app shell is present. */
export async function expectAppLoaded(page: Page): Promise<void> {
  await expect(page.locator(APP_READY).first()).toBeVisible();
}

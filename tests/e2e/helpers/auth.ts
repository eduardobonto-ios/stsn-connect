/**
 * Auth helpers for the STSN Connect E2E suite.
 *
 * Important behaviors this suite must handle (see discovery report §2):
 *  - Auth is a demo stub: active email + literal `password123`.
 *  - On an EMPTY session the app auto-seeds SUPER_ADMIN, so a fresh visit may
 *    boot already authenticated. `ensureLoggedOut` normalizes that.
 *  - Logout lives in the header user dropdown ("Open user menu" → "Exit Connect
 *    Session") and clears the localStorage session.
 */
import { expect, type Page } from "@playwright/test";
import { ACCOUNTS, E2E_PASSWORD, type Role } from "./test-data";

const APP_READY = "aside nav";
const LOGIN_EMAIL = 'input[type="email"]';

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
 * `initialize()` is async (it loads all data from Supabase) and, on a fresh
 * no-session context, AUTO-SEEDS SUPER_ADMIN once loading finishes. The login
 * overlay is shown transiently while that runs — logging in during that window
 * fails silently (users not loaded yet) and the auto-seed then masquerades as a
 * successful login. So we must wait for initialize() to fully settle (the
 * authenticated shell appears) BEFORE logging out and logging back in.
 */
export async function ensureLoggedOut(page: Page): Promise<void> {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  // Wait out the async initialize()/auto-seed so `users` is loaded.
  await page.waitForSelector(APP_READY, { timeout: 45_000 }).catch(() => {});
  if (await isLoggedIn(page)) {
    await logout(page);
  }
  await page.waitForSelector(LOGIN_EMAIL, { timeout: 15_000 });
}

/**
 * Fill the login form and submit; resolves once a REAL login completed.
 * We wait for the overlay to detach (guards against the auto-seed masquerade)
 * and then for the app shell.
 */
export async function loginByEmail(page: Page, email: string): Promise<void> {
  await ensureLoggedOut(page);
  await page.fill(LOGIN_EMAIL, email);
  await page.fill('input[type="password"]', E2E_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForSelector(LOGIN_EMAIL, { state: "detached", timeout: 30_000 });
  await page.waitForSelector(APP_READY, { timeout: 30_000 });
}

/** Log in as a named role using its configured demo account. */
export async function login(page: Page, role: Role): Promise<void> {
  await loginByEmail(page, ACCOUNTS[role]);
}

/** Log in via a "Quick Demo Accounts" button matching the given text. */
export async function loginByQuickButton(page: Page, buttonText: RegExp): Promise<void> {
  await ensureLoggedOut(page);
  await page.getByRole("button", { name: buttonText }).first().click();
  await page.waitForSelector(LOGIN_EMAIL, { state: "detached", timeout: 30_000 });
  await page.waitForSelector(APP_READY, { timeout: 30_000 });
}

/** Assert the authenticated app shell is present. */
export async function expectAppLoaded(page: Page): Promise<void> {
  await expect(page.locator(APP_READY).first()).toBeVisible();
}

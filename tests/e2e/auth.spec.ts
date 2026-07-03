import { test, expect } from "@playwright/test";
import { ensureLoggedOut, login, loginByEmail, loginByQuickButton, logout } from "./helpers/auth";
import { ACCOUNTS, E2E_PASSWORD } from "./helpers/test-data";

const AUTH_SESSION_KEY = "stsn-connect-auth-session";

test.describe("Authentication & session", () => {
  test("login via form with valid email + password lands in the app", async ({ page }) => {
    await login(page, "SUPER_ADMIN");
    await expect(page.locator("aside nav")).toBeVisible();
    // Super Admin's first allowed menu item is the Dashboard.
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("wrong password is rejected and stays on the login screen", async ({ page }) => {
    await ensureLoggedOut(page);
    await page.fill('input[type="email"]', ACCOUNTS.SUPER_ADMIN);
    await page.fill('input[type="password"]', "wrong-password");
    await page.click('button[type="submit"]');
    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator("aside nav")).toHaveCount(0);
  });

  test("Quick Demo Account button logs the student in", async ({ page }) => {
    await loginByQuickButton(page, /student/i);
    await expect(page).toHaveURL(/\/student-portal/);
  });

  test("login persists a session in localStorage", async ({ page }) => {
    await login(page, "REGISTRAR");
    const session = await page.evaluate((key) => window.localStorage.getItem(key), AUTH_SESSION_KEY);
    expect(session, "auth session should be written on login").toBeTruthy();
  });

  test("logout returns to the login screen and clears the session", async ({ page }) => {
    await login(page, "SUPER_ADMIN");
    await logout(page);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    const session = await page.evaluate((key) => window.localStorage.getItem(key), AUTH_SESSION_KEY);
    expect(session, "auth session should be cleared on logout").toBeFalsy();
  });

  test("first menu item is selected by default after login", async ({ page }) => {
    await login(page, "SUPER_ADMIN");
    const active = page.locator("aside nav button.app-shell-nav-item-active").first();
    await expect(active).toBeVisible();
    await expect(active).toContainText(/Dashboard/i);
  });

  test("user switch does not carry the previous user's page over", async ({ page }) => {
    // Super Admin visits a deep, admin-only page.
    await login(page, "SUPER_ADMIN");
    await page.goto("/core-setup", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/core-setup/);

    // Switch to a Student — must NOT inherit /core-setup, must land in their area.
    await loginByEmail(page, ACCOUNTS.STUDENT);
    await expect(page).not.toHaveURL(/\/core-setup/);
    await expect(page).toHaveURL(/\/student-portal/);
  });
});

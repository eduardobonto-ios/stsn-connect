import { test, expect } from "@playwright/test";
import { ensureLoggedOut, login, loginByEmail, logout } from "./helpers/auth";
import { moduleTile, moduleTileVisible } from "./helpers/navigation";
import { ACCOUNTS, E2E_PASSWORD } from "./helpers/test-data";

const COMMAND_CENTER_HEADING = /enterprise command center/i;

test.describe("Authentication & session", () => {
  test("login via form with valid email + password lands in the app", async ({ page }) => {
    await login(page, "SUPER_ADMIN");
    await expect(page.locator("aside nav")).toBeVisible();
    // Every role lands on the Enterprise Command Center grid at "/".
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: COMMAND_CENTER_HEADING })).toBeVisible();
  });

  test("wrong password is rejected and stays on the login screen", async ({ page }) => {
    await ensureLoggedOut(page);
    await page.fill('input[type="email"]', ACCOUNTS.SUPER_ADMIN);
    await page.fill('input[type="password"]', "wrong-password");
    await page.click('button[type="submit"]');
    await expect(page.getByText(/sign-in failed/i)).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator("aside nav")).toHaveCount(0);
  });

  test("Supabase Auth persists a session in localStorage", async ({ page }) => {
    await login(page, "REGISTRAR");
    const session = await page.evaluate(() =>
      Object.keys(window.localStorage).find((key) => key.startsWith("sb-") && key.endsWith("-auth-token")),
    );
    expect(session, "auth session should be written on login").toBeTruthy();
  });

  test("logout returns to the login screen and clears the session", async ({ page }) => {
    await login(page, "SUPER_ADMIN");
    await logout(page);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    const session = await page.evaluate(() =>
      Object.keys(window.localStorage).find((key) => key.startsWith("sb-") && key.endsWith("-auth-token")),
    );
    expect(session, "auth session should be cleared on logout").toBeFalsy();
  });

  test("login lands on the Enterprise Command Center grid with the role's tiles", async ({ page }) => {
    await login(page, "SUPER_ADMIN");
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: COMMAND_CENTER_HEADING })).toBeVisible();
    await expect(moduleTile(page, /Dashboard/i).first()).toBeVisible();
  });

  test("user switch does not carry the previous user's page over", async ({ page }) => {
    // Super Admin visits a deep, admin-only page.
    await login(page, "SUPER_ADMIN");
    await page.goto("/core-setup", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/core-setup/);

    // Switch to a Student — must NOT inherit /core-setup, must land on the grid
    // with the Student's own tiles (no Core Setup tile).
    await loginByEmail(page, ACCOUNTS.STUDENT);
    await expect(page).not.toHaveURL(/\/core-setup/);
    await expect(page).toHaveURL(/\/$/);
    await expect(moduleTile(page, /Student Portal/i).first()).toBeVisible();
    expect(await moduleTileVisible(page, /Core Setup/i)).toBe(false);
  });
});

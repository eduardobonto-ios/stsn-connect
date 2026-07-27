import { test, expect } from "@playwright/test";
import { login } from "./helpers/auth";
import { goto } from "./helpers/navigation";

test.describe("My Profile", () => {
  test("is reachable by a non-admin role", async ({ page }) => {
    await login(page, "STUDENT");
    await goto(page, "/profile");
    await expect(page.getByRole("heading", { name: /My Profile/i })).toBeVisible();
  });

  test("identity fields are read-only / disabled", async ({ page }) => {
    await login(page, "STUDENT");
    await goto(page, "/profile");

    // Name / Email / Employee ID / Department / Role are display-only, rendered as
    // disabled inputs (managed in User Access & Authority, never here).
    const disabledInputs = page.locator("input:disabled");
    await expect(disabledInputs.first()).toBeVisible();
    expect(await disabledInputs.count()).toBeGreaterThanOrEqual(3);

    // The New Password field must remain editable (not disabled).
    await expect(page.getByPlaceholder(/Enter new password/i)).toBeEnabled();
  });

  test("New Password is editable and enforces the production minimum length", async ({ page }) => {
    await login(page, "TEACHER");
    await goto(page, "/profile");

    const newPassword = page.getByPlaceholder(/Enter new password/i);
    await expect(newPassword).toBeEditable();
    await newPassword.fill("too-short");
    await expect(page.getByRole("button", { name: /Update Password/i })).toBeDisabled();
  });
});

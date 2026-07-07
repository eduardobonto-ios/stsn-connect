import { test, expect } from "@playwright/test";
import { loginByEmail } from "./helpers/auth";
import { expectModuleRendered } from "./helpers/assertions";
import { moduleTile } from "./helpers/navigation";
import { PARENT_EMAIL } from "./helpers/test-data";

/**
 * Parent / Guardian Portal.
 *
 * Blocked: no GUARDIAN user is seeded in the dev database (discovery report §10).
 * These tests self-skip until E2E_PARENT_EMAIL points at a real, active
 * role=GUARDIAN account. When enabled, they remain read-only.
 */
test.describe("Parent / Guardian Portal", () => {
  test.skip(!PARENT_EMAIL, "No GUARDIAN account seeded — set E2E_PARENT_EMAIL to enable.");

  test("guardian lands on the Enterprise Command Center and opens the Parent Portal", async ({ page }) => {
    await loginByEmail(page, PARENT_EMAIL);
    await expect(page).toHaveURL(/\/$/);
    await moduleTile(page, /Parent Portal/i).first().click();
    await expect(page).toHaveURL(/\/guardian-portal/);
    await expectModuleRendered(page);
  });
});

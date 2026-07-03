import { test } from "@playwright/test";
import { login } from "./helpers/auth";
import { expectModuleRendered } from "./helpers/assertions";
import { ALL_ROLES } from "./helpers/test-data";

/**
 * Per-role landing smoke: every role logs in and lands on a rendered module
 * (app shell present, not the access-denied or lazy-load fallback state).
 */
test.describe("Per-role landing smoke", () => {
  for (const role of ALL_ROLES) {
    test(`${role} lands on a rendered module`, async ({ page }) => {
      await login(page, role);
      await expectModuleRendered(page);
    });
  }
});

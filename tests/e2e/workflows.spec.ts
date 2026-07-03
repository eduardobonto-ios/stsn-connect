import { test } from "@playwright/test";
import { login } from "./helpers/auth";
import { goto } from "./helpers/navigation";
import { expectModuleRendered } from "./helpers/assertions";
import { WORKFLOW_ROUTES } from "./helpers/test-data";

/**
 * Read-only workflow smoke: navigate the primary business modules per role and
 * assert each page renders. NO data is created or mutated (per approved scope).
 */
test.describe("Read-only workflow smoke", () => {
  for (const { role, label, routes } of WORKFLOW_ROUTES) {
    test(`${role}: ${label} pages render`, async ({ page }) => {
      await login(page, role);
      for (const route of routes) {
        await goto(page, route);
        await expectModuleRendered(page);
      }
    });
  }
});

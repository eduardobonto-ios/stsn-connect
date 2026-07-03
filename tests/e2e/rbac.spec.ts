import { test, expect } from "@playwright/test";
import { login } from "./helpers/auth";
import { sidebarButton, sidebarHas, goto } from "./helpers/navigation";
import { expectAccessDenied, expectNotAccessDenied } from "./helpers/assertions";
import { ALL_ROLES, RBAC_URL_MATRIX, SIDEBAR_EXPECT } from "./helpers/test-data";

test.describe("RBAC — sidebar menu visibility", () => {
  for (const role of ALL_ROLES) {
    test(`${role} sees only its permitted modules`, async ({ page }) => {
      await login(page, role);
      await expect(page.locator("aside nav")).toBeVisible();

      const { present, absent } = SIDEBAR_EXPECT[role];
      for (const label of present) {
        await expect(sidebarButton(page, label).first(), `${role} should see ${label}`).toBeVisible();
      }
      for (const label of absent) {
        expect(await sidebarHas(page, label), `${role} should NOT see ${label}`).toBe(false);
      }
    });
  }

  test("Super Admin sidebar is broader than a scoped Cashier", async ({ page }) => {
    await login(page, "SUPER_ADMIN");
    const adminCount = await page.locator("aside nav > div, aside nav > button").count();
    await login(page, "CASHIER");
    const cashierCount = await page.locator("aside nav > div, aside nav > button").count();
    expect(adminCount).toBeGreaterThan(cashierCount);
  });
});

test.describe("RBAC — direct-URL enforcement", () => {
  for (const { role, deniedRoute, allowedRoute } of RBAC_URL_MATRIX) {
    test(`${role} is blocked from ${deniedRoute}`, async ({ page }) => {
      await login(page, role);
      await goto(page, deniedRoute);
      await expectAccessDenied(page);
    });

    test(`${role} can open ${allowedRoute}`, async ({ page }) => {
      await login(page, role);
      await goto(page, allowedRoute);
      await expectNotAccessDenied(page);
    });
  }
});

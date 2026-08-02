import { test, expect } from "@playwright/test";
import { login } from "./helpers/auth";
import { goto, moduleTile, moduleTileVisible } from "./helpers/navigation";
import { expectAccessDenied, expectNotAccessDenied } from "./helpers/assertions";
import { ALL_ROLES, RBAC_URL_MATRIX, SIDEBAR_EXPECT } from "./helpers/test-data";

test.describe("RBAC — Command Center tile visibility", () => {
  for (const role of ALL_ROLES) {
    test(`${role} sees only its permitted modules`, async ({ page }) => {
      await login(page, role);
      await expect(page.locator("main")).toBeVisible();

      const { present, absent } = SIDEBAR_EXPECT[role];
      for (const label of present) {
        await expect(moduleTile(page, label).first(), `${role} should see ${label}`).toBeVisible();
      }
      for (const label of absent) {
        expect(await moduleTileVisible(page, label), `${role} should NOT see ${label}`).toBe(false);
      }
    });
  }

  test("Super Admin sees more tiles than a scoped Cashier", async ({ page }) => {
    await login(page, "SUPER_ADMIN");
    const adminCount = await page.locator("main").getByRole("button").count();
    await login(page, "CASHIER");
    const cashierCount = await page.locator("main").getByRole("button").count();
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

  test("Accounting page-level voucher grants do not unlock Cashiering", async ({ page }) => {
    await login(page, "ACCOUNTING");
    for (const route of ["/cashier/queue", "/cashier/vouchers", "/cashier/history", "/cashier/reports"]) {
      await goto(page, route);
      await expectAccessDenied(page);
    }
  });
});

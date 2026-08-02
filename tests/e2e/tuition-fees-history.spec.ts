import { expect, test } from "@playwright/test";
import { login } from "./helpers/auth";
import { goto } from "./helpers/navigation";

test.describe("Tuition Fees published history", () => {
  test("shows Published history as read-only and keeps Drafts editable", async ({ page }) => {
    await login(page, "ACCOUNTING");
    await goto(page, "/accounting/tuition-fees");

    await expect(page.getByRole("heading", { name: "Tuition Fees" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Published Fees/ })).toHaveAttribute("data-active", "true");
    await expect(page.getByLabel("Published fee school year")).toBeVisible();
    await expect(page.getByLabel("Published fee academic unit")).toBeVisible();

    const currentPublished = page.getByRole("button", { name: /Current Published/ }).first();
    await expect(currentPublished).toBeVisible();
    await currentPublished.click();
    await expect(page.getByText("Read only", { exact: true })).toBeVisible();
    await expect(page.locator("table input")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Save Draft" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Publish Schedule" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Create Draft Version" })).toBeVisible();

    await page.getByRole("button", { name: /Drafts/ }).click();
    const draftSchedule = page.getByRole("button", { name: /Version .* Draft/ }).first();
    if (await draftSchedule.isVisible().catch(() => false)) {
      await draftSchedule.click();
      await expect(page.locator("table input").first()).toBeVisible();
      await expect(page.getByRole("button", { name: "Publish Schedule" })).toBeVisible();
    } else {
      await expect(page.getByText("No Draft fee schedules exist for this school.")).toBeVisible();
      await expect(page.locator("table input")).toHaveCount(0);
    }
  });
});

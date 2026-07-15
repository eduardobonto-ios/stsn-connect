import { expect, test } from "@playwright/test";
import { login } from "./helpers/auth";
import { goto } from "./helpers/navigation";

test.describe("Cashiering workspace", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "CASHIER");
  });

  test("permitted tabs route directly and retain the cashier shell", async ({ page }) => {
    const routes = [
      ["queue", "Payment Queue"],
      ["other-payments", "Other Payments"],
      ["vouchers", "Cash Vouchers"],
      ["history", "Collection History"],
      ["reports", "Reports"],
    ] as const;

    for (const [route, label] of routes) {
      await goto(page, `/cashier/${route}`);
      await expect(page.getByRole("heading", { name: "Cashiering Office" })).toBeVisible();
      const tab = page.locator("main").getByRole("button", { name: new RegExp(label, "i") }).first();
      await expect(tab).toBeVisible();
      await expect(tab).toHaveAttribute("data-active", "true");
    }
  });

  test("queue is master-detail, selection is read-only, and collect opens a drawer", async ({ page }) => {
    await goto(page, "/cashier/queue");
    await expect(page.getByLabel("Cashiering summary")).toBeVisible();
    await expect(page.getByLabel("Approved payment queue")).toBeVisible();

    const rows = page.getByRole("option");
    if (await rows.count() === 0) {
      await expect(page.getByText("Payment Queue is Empty")).toBeVisible();
      return;
    }

    const paymentsBefore = await page.getByRole("row").count();
    await rows.first().click();
    await expect(rows.first()).toHaveAttribute("aria-selected", "true");
    await expect(page.getByLabel("Selected student account")).toBeVisible();
    expect(await page.getByRole("row").count()).toBe(paymentsBefore);

    const collect = page.getByRole("button", { name: /^Collect ₱/ }).first();
    if (await collect.isVisible().catch(() => false)) {
      await collect.click();
      const drawer = page.getByRole("dialog", { name: "Collect Payment" });
      await expect(drawer).toBeVisible();
      await expect(drawer.getByText("Balance Due")).toBeVisible();
      await expect(drawer.locator('input[required]').first()).toBeVisible();
      await drawer.getByRole("button", { name: "Cancel" }).click();
    }
  });

  test("search shortcut focuses queue search and awaiting assessments stay read-only", async ({ page }) => {
    await goto(page, "/cashier/queue");
    await page.keyboard.press("/");
    const search = page.getByPlaceholder("Search student name or student number…");
    await expect(search).toBeFocused();
    await search.fill("unlikely-cashier-result-zzzz");
    await expect(page.getByText("Payment Queue is Empty")).toBeVisible();
    await search.clear();

    const awaiting = page.getByRole("heading", { name: "Awaiting Accounting Approval" });
    if (await awaiting.isVisible().catch(() => false)) {
      const section = awaiting.locator("xpath=ancestor::section");
      await expect(section.getByRole("button", { name: /collect/i })).toHaveCount(0);
    }
  });

  test("history exposes real summaries, filters, and transaction details", async ({ page }) => {
    await goto(page, "/cashier/history");
    await expect(page.getByText("Total collected")).toBeVisible();
    await expect(page.getByRole("button", { name: "Today" })).toBeVisible();
    await expect(page.getByRole("button", { name: "This Week" })).toBeVisible();
    await expect(page.getByRole("button", { name: "This Month" })).toBeVisible();

    const bodyRows = page.locator("tbody tr");
    if (await bodyRows.count() > 0) {
      await bodyRows.first().click();
      const drawer = page.getByRole("dialog", { name: /Receipt / });
      await expect(drawer).toBeVisible();
      await expect(drawer.getByRole("button", { name: "Preview Receipt" })).toBeVisible();
      await drawer.getByRole("button", { name: "Close", exact: true }).click();
    }
  });

  test("mobile drawer uses the viewport and keeps sticky actions visible", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/cashier/queue", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Cashiering Office" })).toBeVisible();
    await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");
    const collect = page.getByRole("button", { name: /^Collect ₱/ }).first();
    if (await collect.isVisible().catch(() => false)) {
      await collect.click();
      const drawer = page.getByRole("dialog", { name: "Collect Payment" });
      await expect(drawer).toBeVisible();
      await expect(drawer.getByRole("button", { name: "Cancel" })).toBeVisible();
      const box = await drawer.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(380);
    }
  });
});

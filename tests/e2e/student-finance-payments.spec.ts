import { expect, type Page, test } from "@playwright/test";
import { login } from "./helpers/auth";
import { goto } from "./helpers/navigation";

async function expectAnyVisible(page: Page, patterns: RegExp[], scope = page.locator("main")) {
  for (const pattern of patterns) {
    const matches = scope.getByText(pattern);
    const count = Math.min(await matches.count(), 5);
    for (let index = 0; index < count; index += 1) {
      const locator = matches.nth(index);
      try {
        await expect(locator).toBeVisible({ timeout: 750 });
        return;
      } catch {
        // Keep checking sibling matches/patterns. Some labels appear in hidden
        // responsive regions before the visible desktop surface.
      }
    }
  }
  throw new Error(`Expected one of these texts to be visible: ${patterns.map(String).join(", ")}`);
}

async function expectMoneySurface(page: Page) {
  await expect(page.locator("main").getByText(/₱/).first()).toBeVisible();
}

test.describe("Student finance payment workflow — read-only UI validation", () => {
  test("Cashier payment queue shows approved balances, books/discount/payment-term context, and safe collection validations", async ({ page }) => {
    await login(page, "CASHIER");
    await goto(page, "/cashier/queue");

    await expect(page.getByRole("heading", { name: "Cashiering Office" })).toBeVisible();
    await expect(page.getByLabel("Cashiering summary")).toBeVisible();
    await expect(page.getByLabel("Approved payment queue")).toBeVisible();
    await expectAnyVisible(page, [/Balance due/i, /Payment Queue is Empty/i]);

    const queueRows = page.getByRole("option");
    if ((await queueRows.count()) === 0) {
      await expect(page.getByText("Payment Queue is Empty")).toBeVisible();
      return;
    }

    await queueRows.first().click();
    const account = page.getByLabel("Selected student account");
    await expect(account).toBeVisible();
    await expect(account.getByText(/Net assessment/i)).toBeVisible();
    await expect(account.getByText(/Amount paid/i)).toBeVisible();
    await expect(account.getByText(/Discount/i)).toBeVisible();
    await expect(account.getByText(/Balance due/i)).toBeVisible();
    await expectMoneySurface(page);

    const collect = page.getByRole("button", { name: /^Collect ₱/ }).first();
    if (!(await collect.isVisible().catch(() => false))) return;

    await collect.click();
    const drawer = page.getByRole("dialog", { name: "Collect Payment" });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText(/BIR Official Receipt No/i)).toBeVisible();
    await expect(drawer.getByText(/Payment Method/i)).toBeVisible();
    await expect(drawer.getByText(/Payment Term/i)).toBeVisible();
    await expect(drawer.getByText(/Balance Due/i)).toBeVisible();
    await expect(drawer.getByText(/Books|Discount/i).first()).toBeVisible();

    const amountInput = drawer.locator('input[type="number"]').first();
    const max = Number(await amountInput.getAttribute("max"));
    if (Number.isFinite(max) && max > 0) {
      await amountInput.fill(String(max + 1));
      await expect(drawer.getByText(/does not allow overpayment|Maximum:/i)).toBeVisible();
    }

    await drawer.getByRole("button", { name: "Cancel" }).click();
    await expect(drawer).toBeHidden();
  });

  test("Cashier other-payment flow distinguishes direct OR collections from AR invoice allocations before posting", async ({ page }) => {
    await login(page, "CASHIER");
    await goto(page, "/cashier/other-payments");

    await expect(page.getByRole("heading", { name: "Cashiering Office" })).toBeVisible();
    await expect(page.getByText(/Other Payments/i).first()).toBeVisible();
    await expect(page.getByText(/standalone collection|outside the Payment Queue/i).first()).toBeVisible();

    const newCollection = page.getByRole("button", { name: /New Collection/i });
    if (!(await newCollection.isVisible().catch(() => false))) return;

    await newCollection.click();
    const drawer = page.getByRole("dialog", { name: /Other Payment|New Collection/i });
    await expect(drawer).toBeVisible();
    await expectAnyVisible(page, [/Transaction Type/i, /Direct Collection/i, /Invoice Allocation/i], drawer);
    await expectAnyVisible(page, [/Student/i, /BIR Official Receipt/i, /Payment Method/i], drawer);

    const submit = drawer.getByRole("button", { name: /Post|Collect|Save/i }).last();
    if (await submit.isEnabled().catch(() => false)) {
      await submit.click();
      await expectAnyVisible(page, [/Student is required/i, /Official Receipt/i, /Allocate the receipt/i, /required/i], drawer);
    } else if (await submit.isVisible().catch(() => false)) {
      await expect(submit).toBeDisabled();
    }

    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
  });

  test("Cashier collection history and reports expose receipt totals, student payment summary, methods, and cashier report outputs", async ({ page }) => {
    await login(page, "CASHIER");

    await goto(page, "/cashier/history");
    await expect(page.getByRole("heading", { name: "Cashiering Office" })).toBeVisible();
    await expect(page.getByText(/Total collected/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Today" })).toBeVisible();
    await expect(page.getByRole("button", { name: "This Week" })).toBeVisible();
    await expect(page.getByRole("button", { name: "This Month" })).toBeVisible();

    const historyRows = page.locator("tbody tr").filter({ hasNotText: /No payments recorded yet/i });
    if ((await historyRows.count()) > 0) {
      await historyRows.first().click();
      const drawer = page.getByRole("dialog", { name: /Receipt / });
      await expect(drawer).toBeVisible();
      await expect(drawer.getByRole("button", { name: /Preview Receipt/i })).toBeVisible();
      await drawer.getByRole("button", { name: "Close", exact: true }).click();
    } else {
      await expect(page.getByText(/No payments recorded yet/i)).toBeVisible();
    }

    await goto(page, "/cashier/reports");
    await expect(page.getByRole("heading", { name: "Cashiering Office" })).toBeVisible();
    await expectAnyVisible(page, [/Daily Collection Report/i, /OR Register/i, /Student Payment Summary/i]);
    const reportType = page.locator("main select").first();
    await expect(reportType).toContainText("Collection by Payment Method");
    await expect(reportType).toContainText("Collection by Cashier");
    await expect(reportType).toContainText("End-of-Day Cashier Summary");
    await expectAnyVisible(page, [/Total Amount/i, /Remaining Balance/i, /Transactions/i]);
  });

  test("Accounting financial pages show collections, ledgers, discounts, billing balances, holds, and report subpages", async ({ page }) => {
    await login(page, "ACCOUNTING");

    await goto(page, "/accounting/dashboard");
    await expect(page.getByRole("heading", { name: /Treasury & Accounting Office/i })).toBeVisible();
    await expect(page.getByText(/Total Assessed/i)).toBeVisible();
    await expect(page.getByText(/Total Collected/i)).toBeVisible();
    await expect(page.getByText(/Outstanding Balance/i).first()).toBeVisible();
    await expectAnyVisible(page, [/Unapplied credit/i, /Receipt reallocation/i, /Payment.*verification/i]);

    await goto(page, "/accounting/ledger");
    await expect(page.getByText(/Student Ledger/i).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /Transaction Ledger/i })).toBeVisible();
    await expectAnyVisible(page, [/Debit \(₱\)/i, /Credit \(₱\)/i, /Balance \(₱\)/i, /No transactions found/i]);

    await goto(page, "/accounting/discounts");
    await expect(page.getByText(/Discounts|Scholarships/i).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /New Request/i })).toBeVisible();

    await goto(page, "/accounting/billing");
    await expect(page.getByText(/Assessment & Billing/i).first()).toBeVisible();
    await expect(page.getByText(/Assessment Approval Queue/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Net Payable/i }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Payment Term/i }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Books/i }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Balance/i }).first()).toBeVisible();

    await expect(page.locator("aside nav").getByRole("button").filter({ hasText: /Financial Holds/i })).toBeVisible();
    await expect(page.locator("aside nav").getByRole("button").filter({ hasText: /Financial Reports/i })).toBeVisible();
  });

  test("Registrar and Student views expose the same finance concepts: fees, books, discounts, schedules, balances, and receipt history", async ({ page }) => {
    await login(page, "REGISTRAR");
    await goto(page, "/registrar");
    await expect(page.getByRole("heading", { name: /Admissions & Enrollment/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Status/i }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /COR/i }).first()).toBeVisible();
    await expect(page.getByText(/For Payment|Pending \/ For Assessment|Enrolled/i).first()).toBeVisible();

    const studentRows = page.locator("tbody tr").filter({ hasNotText: /No students|No records|No results/i });
    if ((await studentRows.count()) > 0) {
      await studentRows.first().click();
      const financeDetailVisible = await page
        .locator("main")
        .getByText(/Payment Schedule|Balance Outstanding|Payment Term|Avail Books Now/i)
        .first()
        .isVisible()
        .catch(() => false);
      if (financeDetailVisible) {
        await expectAnyVisible(page, [/Assessment/i, /Payment Schedule/i, /Balance Outstanding/i, /Avail Books Now/i]);
        await expectAnyVisible(page, [/Scholarship \/ Discount/i, /Discount Applied/i, /Payment Term/i, /Books/i]);
      }
    }

    await login(page, "STUDENT");
    await goto(page, "/student-portal/overview");
    await expect(page.getByText(/Outstanding Balance/i).first()).toBeVisible();
    await expectAnyVisible(page, [/₱/, /No outstanding balance/i]);

    await goto(page, "/student-portal/ledger");
    await expect(page.getByText(/Statement of Student Ledger/i)).toBeVisible();
    await expect(page.getByText(/Gross Assessed Billing Total/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: /Instalment Due Schedule/i })).toBeVisible();
    await expect(page.getByText(/Receipt Payment History Audit/i)).toBeVisible();
  });

  test("Books setup remains visible for Basic Ed book-package assessment support", async ({ page }) => {
    await login(page, "SUPER_ADMIN");
    await goto(page, "/books-setup");

    await expect(page.getByRole("heading", { name: /Books and Package Setup/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Book Packages/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Included Books/i })).toBeVisible();
  });
});

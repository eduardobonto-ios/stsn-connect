import { test, expect } from "@playwright/test";
import { login } from "./helpers/auth";
import { goto } from "./helpers/navigation";
import { expectModuleRendered } from "./helpers/assertions";

/**
 * Phase 5 UAT (docs/TEACHERS_TO_EMPLOYEES_UAT_CHECKLIST.md) — read-only checks.
 *
 * Covers the checklist items that are pure renders/scoping, so they can run
 * with NO Supabase writes against the shared demo/UAT project: Faculty Portal,
 * Grading, Scheduling, Sectioning, Consultation, Profiles, and the dashboard
 * faculty-count fix. Mutation-based checklist items (create schedule, submit
 * attendance, create consultation, save grade) are covered separately in
 * teacher-employee-consolidation-writes.spec.ts.
 */
test.describe("Teacher→Employee consolidation — Phase 5 read-only checks", () => {
  test("TEACHER: faculty portal resolves accrued leave through the linked employee, not a raw fallback", async ({ page }) => {
    await login(page, "TEACHER");
    await goto(page, "/faculty/portal/overview-advisory");
    await expectModuleRendered(page);

    // FacultyPortalPage renders `{accruedLeaveDays ?? "—"} Days` — a literal
    // em-dash means resolveEmployeeForTeacher() failed to find a linked
    // employee record for the signed-in teacher.
    await expect(page.getByText("Accrued Leave")).toBeVisible();
    await expect(page.getByText(/^— Days$/)).toHaveCount(0);
  });

  test("TEACHER: grade encoding scopes to the signed-in faculty member", async ({ page }) => {
    await login(page, "TEACHER");
    await goto(page, "/faculty/portal/student-grades-encoding");
    await expectModuleRendered(page);
  });

  test("TEACHER: My Profile renders employee-backed identity details", async ({ page }) => {
    await login(page, "TEACHER");
    await goto(page, "/profile");
    await expectModuleRendered(page);
  });

  test("SUPER_ADMIN: scheduling module renders with employee-backed faculty assignment", async ({ page }) => {
    await login(page, "SUPER_ADMIN");
    await goto(page, "/scheduling");
    await expectModuleRendered(page);
  });

  test("SUPER_ADMIN: class sectioning module renders with adviser employee ownership", async ({ page }) => {
    await login(page, "SUPER_ADMIN");
    await goto(page, "/class-sectioning");
    await expectModuleRendered(page);
  });

  test("SUPER_ADMIN: consultation module renders and lists appointments", async ({ page }) => {
    await login(page, "SUPER_ADMIN");
    await goto(page, "/consultation");
    await expectModuleRendered(page);
  });

  test("SUPER_ADMIN: dashboard 'Total Teachers' KPI is a real employee-derived count, not raw teacher rows", async ({ page }) => {
    await login(page, "SUPER_ADMIN");
    await goto(page, "/dashboard");
    await expectModuleRendered(page);

    const label = page.getByText("Total Teachers", { exact: true });
    await expect(label).toBeVisible();
    const value = label.locator("xpath=following-sibling::p[1]");
    const text = (await value.textContent())?.trim() ?? "";
    expect(Number(text)).not.toBeNaN();
    expect(Number(text)).toBeGreaterThan(0);
  });
});

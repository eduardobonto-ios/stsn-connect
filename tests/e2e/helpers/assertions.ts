/**
 * Shared assertions for the STSN Connect E2E suite.
 */
import { expect, type Page } from "@playwright/test";

const ACCESS_DENIED = /not available for your current access/i;
const MODULE_LOADING = /Preparing the current workspace/i;

/** The RBAC "module unavailable" empty state (AppModuleRenderer fallback). */
export async function expectAccessDenied(page: Page): Promise<void> {
  await expect(page.getByText(ACCESS_DENIED)).toBeVisible();
}

/** Assert the current module is NOT the access-denied state (i.e. it rendered). */
export async function expectNotAccessDenied(page: Page): Promise<void> {
  await expect(page.getByText(ACCESS_DENIED)).toHaveCount(0);
}

/**
 * Assert a module route actually rendered content: app shell present, not the
 * access-denied state, and not stuck on the lazy-load fallback.
 */
export async function expectModuleRendered(page: Page): Promise<void> {
  await expect(page.locator("aside nav").first()).toBeVisible();
  await expect(page.getByText(ACCESS_DENIED)).toHaveCount(0);
  await expect(page.getByText(MODULE_LOADING)).toHaveCount(0);
  // Main content region exists and is non-empty.
  await expect(page.locator("main").first()).toBeVisible();
}

/**
 * Sidebar navigation + reachability helpers.
 * All locators are scoped to the desktop sidebar (`aside nav`) and rely on
 * accessible button roles + visible text, per the plan's selector strategy.
 */
import { type Locator, type Page } from "@playwright/test";

/** All top-level sidebar buttons matching the given text regex. */
export function sidebarButton(page: Page, text: RegExp): Locator {
  return page.locator("aside nav").getByRole("button").filter({ hasText: text });
}

/** True if a sidebar button with the given text is currently visible. */
export async function sidebarHas(page: Page, text: RegExp): Promise<boolean> {
  return sidebarButton(page, text)
    .first()
    .isVisible()
    .catch(() => false);
}

/** Navigate directly to a route (full reload; session is restored from storage). */
export async function goto(page: Page, route: string): Promise<void> {
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("aside nav", { timeout: 30_000 });
}

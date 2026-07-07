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

/**
 * Enterprise Command Center grid tile locator, scoped to `main` so it never
 * collides with the (possibly empty) contextual sidebar. Tiles render the
 * same `label`/`desc` text as the sidebar buttons they're derived from.
 */
export function moduleTile(page: Page, text: RegExp): Locator {
  return page.locator("main").getByRole("button").filter({ hasText: text });
}

/** True if a grid tile with the given text is currently visible. */
export async function moduleTileVisible(page: Page, text: RegExp): Promise<boolean> {
  return moduleTile(page, text)
    .first()
    .isVisible()
    .catch(() => false);
}

/** Click a grid tile and wait for the resulting navigation to settle. */
export async function openModuleTile(page: Page, text: RegExp): Promise<void> {
  await moduleTile(page, text).first().click();
  await page.waitForLoadState("domcontentloaded");
}

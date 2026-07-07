import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// Load the project's local .env (dev/demo Supabase + optional E2E_* overrides).
// The app itself reads VITE_SUPABASE_* through Vite when `npm run dev` boots.
dotenv.config();

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

/**
 * STSN Connect — Playwright E2E configuration (Phase 3).
 *
 * Scope: P0–P2 read-only / RBAC tests only. No data mutation.
 * Target: local dev server (npm run dev, port 3000) against the dev Supabase
 * configured in .env. There is no mock-data fallback, so a reachable dev
 * Supabase is required for the app to boot and for login to succeed.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: BASE_URL,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

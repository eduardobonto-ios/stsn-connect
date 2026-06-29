/**
 * STSN Connect — Capture missing/failed screenshots
 * Fixes: accounting sentinel, teacher curriculum, student LMS/consultation
 */

import { chromium } from 'playwright';
import { join, dirname } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL  = 'http://localhost:3000';
const OUT_DIR   = join(__dirname, 'demo-screenshots');
const PASSWORD  = 'password123';
const VIEWPORT  = { width: 1920, height: 1080 };

const ACCOUNTS = {
  ACCOUNTING : 'accounting@stsn.edu.ph',
  TEACHER    : 'teacher@stsn.edu.ph',
  STUDENT    : 'student@stsn.edu.ph',
};

const captured = [];
const skipped  = [];
const pause    = ms => new Promise(r => setTimeout(r, ms));

async function shot(page, filename, label) {
  await pause(2500);
  await page.screenshot({ path: join(OUT_DIR, filename), fullPage: false });
  console.log(`  ✓  ${filename}`);
  captured.push({ filename, label });
}

async function safeShot(page, filename, label, navFn) {
  try {
    if (navFn) await navFn();
    await shot(page, filename, label);
  } catch (e) {
    const msg = e.message.split('\n')[0].substring(0, 120);
    console.error(`  ✗  ${filename}  →  ${msg}`);
    skipped.push({ filename, reason: msg });
  }
}

async function waitForApp(page) {
  await page.waitForSelector('aside nav', { timeout: 25000 });
  await pause(2500);
}

async function doLogout(page) {
  await page.locator('header').getByRole('button', { name: /open user menu/i }).click();
  await pause(500);
  await page.getByRole('button', { name: /exit connect session/i }).click();
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await pause(500);
}

async function doLogin(page, email) {
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await waitForApp(page);
}

function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

/** Find a sidebar button by text (first match in <aside>). */
function sBtn(page, text) {
  return page.locator('aside').getByRole('button')
    .filter({ hasText: new RegExp(escRe(text), 'i') }).first();
}

/** Click sidebar button — throw if not found within timeout. */
async function navClick(page, text, timeout = 15000) {
  await sBtn(page, text).click({ timeout });
  await pause(600);
}

/** Expand a group if sentinel child is not yet visible. */
async function ensureOpen(page, groupLabel, sentinel) {
  const visible = await sBtn(page, sentinel).isVisible({ timeout: 2000 }).catch(() => false);
  if (!visible) {
    await navClick(page, groupLabel);
  }
}

/**
 * Accounting nav — uses "Student Accounts" as sentinel (visible for all ACCOUNTING-
 * permissioned roles, unlike "Accounting Dashboard" which is SUPER_ADMIN only).
 */
async function navAccounting(page, ...path) {
  await ensureOpen(page, 'Accounting', 'Student Accounts');
  const aside = page.locator('aside');

  if (path.length === 1) {
    await navClick(page, path[0]);
  } else {
    // Check if leaf is already visible (sub-group already expanded)
    const leafVisible = await aside.getByRole('button')
      .filter({ hasText: new RegExp(escRe(path[1]), 'i') })
      .first().isVisible({ timeout: 1500 }).catch(() => false);
    if (!leafVisible) {
      await navClick(page, path[0]); // expand sub-group
      await pause(400);
    }
    await navClick(page, path[1]);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('─'.repeat(62));
  console.log('  STSN Connect — Capture Missing Screenshots');
  console.log('─'.repeat(62));

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  const ctx  = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1, colorScheme: 'light' });
  const page = await ctx.newPage();

  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  const isLogin = await page.locator('input[type="email"]').isVisible().catch(() => false);
  if (isLogin) {
    await doLogin(page, 'admin@stsn.edu.ph');
  } else {
    await waitForApp(page);
  }

  // ── TEACHER: Curriculum ────────────────────────────────────────────────────
  console.log('\n[ TEACHER — Curriculum ]');
  await doLogout(page);
  await doLogin(page, ACCOUNTS.TEACHER);

  await safeShot(page, 'curriculum-teacher.png', 'Curriculum / Syllabus Pathways — Teacher',
    async () => {
      // For teacher the Admission group exists but sentinel "Enrollment" is absent.
      // Expand manually: click the "Admission" group parent, then the child.
      const aside = page.locator('aside');
      const admBtn = aside.getByRole('button').filter({ hasText: /Admission/i }).first();
      // Ensure expanded: check if "Syllabus Pathways" child is visible
      const childVisible = await aside.getByRole('button')
        .filter({ hasText: /Syllabus Pathways/i }).first()
        .isVisible({ timeout: 2000 }).catch(() => false);
      if (!childVisible) {
        await admBtn.click({ timeout: 10000 });
        await pause(500);
      }
      await aside.getByRole('button').filter({ hasText: /Syllabus Pathways/i }).first().click({ timeout: 10000 });
      await pause(600);
    });

  // ── STUDENT: Online Learning & Consultation ────────────────────────────────
  console.log('\n[ STUDENT — Online Learning & Consultation ]');
  await doLogout(page);
  await doLogin(page, ACCOUNTS.STUDENT);

  await safeShot(page, 'online-learning-student.png', 'Online Learning — Student (via Student Portal sub-page)',
    async () => {
      // Student sidebar has "Student Portal" group with "Online Learning" child (showForRoles: STUDENT)
      const aside = page.locator('aside');
      // Ensure Student Portal group is expanded
      const olVisible = await aside.getByRole('button')
        .filter({ hasText: /Online Learning/i }).first()
        .isVisible({ timeout: 2000 }).catch(() => false);
      if (!olVisible) {
        // Expand Student Portal group
        await aside.getByRole('button').filter({ hasText: /Student Portal/i }).first().click({ timeout: 10000 });
        await pause(500);
      }
      await aside.getByRole('button').filter({ hasText: /Online Learning/i }).first().click({ timeout: 10000 });
      await pause(600);
    });

  await safeShot(page, 'consultation-student.png', 'Consultation — Student',
    async () => {
      // For student, CONSULTATION is under the "Clinic" group (only "Consultation" child visible)
      const aside = page.locator('aside');
      // First try direct click (group may auto-navigate if only one child)
      const consultVisible = await aside.getByRole('button')
        .filter({ hasText: /Consultation/i }).first()
        .isVisible({ timeout: 2000 }).catch(() => false);
      if (!consultVisible) {
        // Expand Clinic group first
        await aside.getByRole('button').filter({ hasText: /Clinic/i }).first().click({ timeout: 10000 });
        await pause(500);
      }
      await aside.getByRole('button').filter({ hasText: /Consultation/i }).first().click({ timeout: 10000 });
      await pause(600);
    });

  // ── ACCOUNTING STAFF: Failed sub-pages ────────────────────────────────────
  console.log('\n[ ACCOUNTING STAFF — Missing sub-pages ]');
  await doLogout(page);
  await doLogin(page, ACCOUNTS.ACCOUNTING);

  await safeShot(page, 'accounting-setup-accounting.png', 'Accounting Setup — Accounting Staff',
    () => navAccounting(page, 'Accounting Setup', 'Chart of Accounts'));

  await safeShot(page, 'accounts-receivable-accounting.png', 'Accounts Receivable — Accounting Staff',
    () => navAccounting(page, 'Accounts Receivable', 'Sales Invoice'));

  await safeShot(page, 'financial-reports-accounting.png', 'Financial Reports — Accounting Staff',
    () => navAccounting(page, 'Financial Reports', 'Income Statement'));

  // ── Finish ─────────────────────────────────────────────────────────────────
  await browser.close();

  console.log('\n' + '─'.repeat(62));
  console.log(`  Retry result: ${captured.length} captured, ${skipped.length} still failing`);
  console.log('─'.repeat(62));
  captured.forEach(s => console.log(`  ✓  ${s.filename}`));
  if (skipped.length) {
    skipped.forEach(s => console.log(`  ✗  ${s.filename}\n     ${s.reason}`));
  }

  // Merge into existing manifest
  const manifestPath = join(OUT_DIR, '_manifest.json');
  let manifest = { capturedAt: new Date().toISOString(), captured: [], skipped: [] };
  if (existsSync(manifestPath)) {
    try { manifest = JSON.parse(readFileSync(manifestPath, 'utf8')); } catch {}
  }
  // Add newly captured, remove from skipped
  const newFiles = new Set(captured.map(s => s.filename));
  manifest.captured = [
    ...manifest.captured.filter(s => !newFiles.has(s.filename)),
    ...captured,
  ];
  manifest.skipped = [
    ...manifest.skipped.filter(s => !newFiles.has(s.filename)),
    ...skipped,
  ];
  manifest.updatedAt = new Date().toISOString();
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('\n  Manifest updated → demo-screenshots/_manifest.json\n');
}

main().catch(err => {
  console.error('\nFATAL:', err.message);
  process.exit(1);
});

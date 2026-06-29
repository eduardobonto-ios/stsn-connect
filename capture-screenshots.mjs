/**
 * STSN Connect — Demo PDF Screenshot Capture Script (Phase 2)
 * ESM — run: node capture-screenshots.mjs
 * Requires dev server on http://localhost:3000
 */

import { chromium } from 'playwright';
import { join, dirname } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL  = 'http://localhost:3000';
const OUT_DIR   = join(__dirname, 'demo-screenshots');
const PASSWORD  = 'password123';
const VIEWPORT  = { width: 1920, height: 1080 };

const ACCOUNTS = {
  SUPER_ADMIN : 'admin@stsn.edu.ph',
  ADMIN       : 'admin@cdsta.edu.ph',
  REGISTRAR   : 'registrar@stsn.edu.ph',
  ACCOUNTING  : 'accounting@stsn.edu.ph',
  CASHIER     : 'cashier@stsn.edu.ph',
  TEACHER     : 'teacher@stsn.edu.ph',
  STUDENT     : 'student@stsn.edu.ph',
  HR          : 'hr@stsn.edu.ph',
  GUIDANCE    : 'guidance@stsn.edu.ph',
  NURSE       : 'nurse@stsn.edu.ph',
  PAYROLL     : 'payroll@stsn.edu.ph',
};

const captured = [];
const skipped  = [];

const pause = ms => new Promise(r => setTimeout(r, ms));

// ── Core helpers ──────────────────────────────────────────────────────────────

function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

/** Click a sidebar button containing text (case-insensitive, first match). */
async function navClick(page, text) {
  const re  = new RegExp(escRe(text), 'i');
  const btn = page.locator('aside').getByRole('button').filter({ hasText: re });
  await btn.first().click({ timeout: 15000 });
  await pause(600);
}

/** Return true if a sidebar button with given text is currently visible. */
async function sidebarVisible(page, text) {
  return page.locator('aside')
    .getByRole('button')
    .filter({ hasText: new RegExp(escRe(text), 'i') })
    .first()
    .isVisible({ timeout: 2000 })
    .catch(() => false);
}

/** Ensure a sidebar group is expanded; expand only if its sentinel child is hidden. */
async function ensureOpen(page, groupLabel, sentinelChild) {
  if (!await sidebarVisible(page, sentinelChild)) {
    await navClick(page, groupLabel);
  }
}

// ── Module navigation ─────────────────────────────────────────────────────────

async function navAdmission(page, child) {
  await ensureOpen(page, 'Admission', 'Enrollment');
  await navClick(page, child);
}

async function navAccounting(page, ...path) {
  // Ensure Accounting top-group is expanded (sentinel = "Accounting Dashboard")
  await ensureOpen(page, 'Accounting', 'Accounting Dashboard');
  if (path.length === 1) {
    await navClick(page, path[0]);
  } else {
    // path[0] = sub-group, path[1] = leaf
    // Expand sub-group only if its first leaf is not yet visible
    const leafRe = new RegExp(escRe(path[1]), 'i');
    const leafVisible = await page.locator('aside')
      .getByRole('button').filter({ hasText: leafRe }).first()
      .isVisible({ timeout: 2000 }).catch(() => false);
    if (!leafVisible) {
      await navClick(page, path[0]); // expand sub-group
      await pause(300);
    }
    await navClick(page, path[1]);
  }
}

async function navPayroll(page, child) {
  await ensureOpen(page, 'Payroll', 'Payroll Dashboard');
  await navClick(page, child);
}

async function navClinic(page, child) {
  await ensureOpen(page, 'Clinic', 'Nurse');
  await navClick(page, child);
}

async function navGuidance(page, child) {
  await ensureOpen(page, 'Guidance Office', 'Guidance Reports');
  // When group label == child label, get the last visible match
  const btns = page.locator('aside').getByRole('button')
    .filter({ hasText: new RegExp(escRe(child), 'i') });
  const count = await btns.count();
  await btns.nth(count > 1 ? 1 : 0).click({ timeout: 10000 });
  await pause(600);
}

async function navUserAccess(page, child) {
  await ensureOpen(page, 'User Access', 'User Security');
  await navClick(page, child);
}

async function navHR(page, child) {
  // HR is a non-category group: clicking parent sets module AND expands
  await ensureOpen(page, 'HR', 'Dashboard');
  const re  = new RegExp(escRe(child), 'i');
  const btn = page.locator('aside').getByRole('button').filter({ hasText: re });
  if (await btn.count() > 0) {
    await btn.first().click({ timeout: 10000 });
    await pause(600);
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────

async function waitForApp(page) {
  await page.waitForSelector('aside nav', { timeout: 25000 });
  await pause(2500);
}

async function doLogout(page) {
  await page.locator('header').getByRole('button', { name: /open user menu/i }).click();
  await pause(600);
  await page.getByRole('button', { name: /exit connect session/i }).click();
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await pause(600);
}

async function doLogin(page, email) {
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await waitForApp(page);
}

// ── Screenshot helpers ────────────────────────────────────────────────────────

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
    const msg = e.message.split('\n')[0].substring(0, 140);
    console.error(`  ✗  ${filename}  →  ${msg}`);
    skipped.push({ filename, reason: `nav error: ${msg}` });
  }
}

function skip(filename, reason) {
  console.log(`  ⚠  ${filename}  →  ${reason}`);
  skipped.push({ filename, reason });
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═'.repeat(62));
  console.log('  STSN Connect — Screenshot Capture (Phase 2)');
  console.log('═'.repeat(62));

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  const ctx  = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1, colorScheme: 'light' });
  const page = await ctx.newPage();

  // ── Boot app ───────────────────────────────────────────────────────────────
  console.log('\nBooting app…');
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  const isLogin = await page.locator('input[type="email"]').isVisible().catch(() => false);
  if (isLogin) {
    console.log('  Login screen — signing in as Super Admin…');
    await doLogin(page, ACCOUNTS.SUPER_ADMIN);
  } else {
    await waitForApp(page);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 1 — SUPER ADMIN  (auto-logged in)
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n[ 1 — SUPER ADMIN ]');

  await safeShot(page, 'dashboard-super-admin.png',       'Dashboard — Super Admin',
    () => navClick(page, 'Dashboard'));

  await safeShot(page, 'action-center-super-admin.png',   'Action Center — Super Admin',
    () => navClick(page, 'Action Center'));

  // Admission group
  await safeShot(page, 'enrollment-admissions-directory.png', 'Enrollment / Admission',
    () => navAdmission(page, 'Enrollment'));

  await safeShot(page, 'student-directory.png',           'Student Directory',
    () => navAdmission(page, 'Students'));

  await safeShot(page, 'class-sectioning.png',            'Class Sectioning',
    () => navAdmission(page, 'Class Sectioning'));

  await safeShot(page, 'class-scheduling.png',            'Class Scheduling',
    () => navAdmission(page, 'Class Scheduling'));

  await safeShot(page, 'faculty-management.png',          'Faculty Management',
    () => navAdmission(page, 'Faculty'));

  await safeShot(page, 'curriculum-syllabus-pathways.png','Curriculum / Syllabus Pathways',
    () => navAdmission(page, 'Syllabus Pathways'));

  await safeShot(page, 'grades-directory.png',            'Grades Directory',
    () => navAdmission(page, 'Grades Directory'));

  await safeShot(page, 'registrar-reports.png',           'Registrar Reports',
    () => navAdmission(page, 'Registrar Reports'));

  // Accounting group
  await safeShot(page, 'accounting-dashboard.png',        'Accounting Dashboard (KPI)',
    () => navAccounting(page, 'Accounting Dashboard'));

  await safeShot(page, 'student-accounts.png',            'Student Accounts — Ledger',
    () => navAccounting(page, 'Student Accounts', 'Student Ledger'));

  await safeShot(page, 'accounting-setup.png',            'Accounting Setup — Chart of Accounts',
    () => navAccounting(page, 'Accounting Setup', 'Chart of Accounts'));

  await safeShot(page, 'journal-entries.png',             'Journal Entries / General Ledger',
    () => navAccounting(page, 'General Ledger', 'Journal Entries'));

  await safeShot(page, 'accounts-receivable.png',         'Accounts Receivable — Sales Invoice',
    () => navAccounting(page, 'Accounts Receivable', 'Sales Invoice'));

  await safeShot(page, 'accounts-payable.png',            'Accounts Payable — Purchase Invoice',
    () => navAccounting(page, 'Accounts Payable', 'Purchase Invoice'));

  await safeShot(page, 'financial-reports.png',           'Financial Reports — Income Statement',
    () => navAccounting(page, 'Financial Reports', 'Income Statement'));

  // Payroll Dashboard
  await safeShot(page, 'payroll-dashboard.png',           'Payroll Dashboard',
    () => navPayroll(page, 'Payroll Dashboard'));

  // Online Learning
  await safeShot(page, 'online-learning.png',             'Online Learning / LMS',
    () => navClick(page, 'Online Learning'));

  // Clinic group
  await safeShot(page, 'clinic-module.png',               'Clinic Module — Nurse View',
    () => navClinic(page, 'Nurse'));

  await safeShot(page, 'consultation.png',                'Consultation / Appointments',
    () => navClinic(page, 'Consultation'));

  await safeShot(page, 'clinic-reports.png',              'Clinic Reports',
    () => navClinic(page, 'Clinic Reports'));

  // Guidance group
  await safeShot(page, 'guidance-office.png',             'Guidance Office',
    () => navGuidance(page, 'Guidance Office'));

  await safeShot(page, 'guidance-reports.png',            'Guidance Reports',
    () => navGuidance(page, 'Guidance Reports'));

  // User Access group
  await safeShot(page, 'user-access-authority.png',       'User Access & Authority — User Security',
    () => navUserAccess(page, 'User Security'));

  await safeShot(page, 'admin-reports.png',               'Admin Reports',
    () => navUserAccess(page, 'Admin Reports'));

  // Core Setup
  await safeShot(page, 'core-setup.png',                  'Core Setup / System Configuration',
    () => navClick(page, 'Core Setup'));

  // Student Portal preview (as super admin)
  await safeShot(page, 'student-portal-super-admin.png',  'Student Portal — Super Admin Preview',
    () => navClick(page, 'Student Portal'));

  // ══════════════════════════════════════════════════════════════════════════
  // 2 — SCHOOL ADMINISTRATOR  (admin@cdsta.edu.ph)
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n[ 2 — SCHOOL ADMINISTRATOR ]');
  await doLogout(page);
  await doLogin(page, ACCOUNTS.ADMIN);

  await safeShot(page, 'dashboard-school-admin.png',      'Dashboard — School Administrator',
    () => navClick(page, 'Dashboard'));

  await safeShot(page, 'action-center-school-admin.png',  'Action Center — School Admin',
    () => navClick(page, 'Action Center'));

  await safeShot(page, 'student-directory-school-admin.png', 'Student Directory — School Admin',
    async () => {
      try { await navAdmission(page, 'Students'); }
      catch { await navClick(page, 'Student Directory'); }
    });

  await safeShot(page, 'hr-management-school-admin.png',  'HR Management — School Admin',
    () => navHR(page, 'Dashboard'));

  await safeShot(page, 'registrar-reports-school-admin.png', 'Registrar Reports — School Admin',
    async () => {
      try { await navAdmission(page, 'Registrar Reports'); }
      catch { await navClick(page, 'Registrar Reports'); }
    });

  // ══════════════════════════════════════════════════════════════════════════
  // 3 — CASHIER
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n[ 3 — CASHIER ]');
  await doLogout(page);
  await doLogin(page, ACCOUNTS.CASHIER);
  // Cashier auto-navigates to CASHIER (payment queue)
  await safeShot(page, 'cashiering-office.png',           'Cashiering — Payment Queue');

  // ══════════════════════════════════════════════════════════════════════════
  // 4 — TEACHER / FACULTY
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n[ 4 — TEACHER / FACULTY ]');
  await doLogout(page);
  await doLogin(page, ACCOUNTS.TEACHER);
  // Teacher auto-navigates to FACULTY_PORTAL (overview tab)
  await safeShot(page, 'teacher-board.png',               'Teacher Board — Overview & Advisory');

  await safeShot(page, 'grade-encoding.png',              'Grade Encoding',
    () => page.getByRole('button', { name: /Student Grades Encoding/i }).click());

  await safeShot(page, 'curriculum-teacher.png',          'Curriculum — Teacher View',
    async () => {
      try { await navAdmission(page, 'Syllabus Pathways'); }
      catch { await navClick(page, 'Syllabus Pathways'); }
    });

  await safeShot(page, 'online-learning-teacher.png',     'Online Learning — Teacher View',
    () => navClick(page, 'Online Learning'));

  // ══════════════════════════════════════════════════════════════════════════
  // 5 — STUDENT
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n[ 5 — STUDENT ]');
  await doLogout(page);
  await doLogin(page, ACCOUNTS.STUDENT);
  // Student auto-navigates to STUDENT_PORTAL (overview)
  await safeShot(page, 'student-portal.png',              'Student Portal — Overview');

  await safeShot(page, 'online-learning-student.png',     'Online Learning — Student View',
    async () => {
      const btn = page.locator('aside nav').getByRole('button').filter({ hasText: /Online Learning/i });
      if (await btn.count() > 0) {
        await btn.first().click();
        await pause(600);
      } else {
        throw new Error('Online Learning button not in student sidebar');
      }
    });

  await safeShot(page, 'consultation-student.png',        'Consultation — Student View',
    () => navClick(page, 'Consultation'));

  // ══════════════════════════════════════════════════════════════════════════
  // 6 — ACCOUNTING STAFF
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n[ 6 — ACCOUNTING STAFF ]');
  await doLogout(page);
  await doLogin(page, ACCOUNTS.ACCOUNTING);

  await safeShot(page, 'action-center-accounting.png',    'Action Center — Accounting Staff',
    () => navClick(page, 'Action Center'));

  await safeShot(page, 'student-accounts-accounting.png', 'Student Accounts — Accounting Staff',
    () => navAccounting(page, 'Student Accounts', 'Student Ledger'));

  await safeShot(page, 'accounting-setup-accounting.png', 'Accounting Setup — Accounting Staff',
    () => navAccounting(page, 'Accounting Setup', 'Chart of Accounts'));

  await safeShot(page, 'journal-entries-accounting.png',  'Journal Entries — Accounting Staff',
    () => navAccounting(page, 'General Ledger', 'Journal Entries'));

  await safeShot(page, 'accounts-receivable-accounting.png', 'Accounts Receivable — Accounting Staff',
    () => navAccounting(page, 'Accounts Receivable', 'Sales Invoice'));

  await safeShot(page, 'accounts-payable-accounting.png', 'Accounts Payable — Accounting Staff',
    () => navAccounting(page, 'Accounts Payable', 'Purchase Invoice'));

  await safeShot(page, 'financial-reports-accounting.png','Financial Reports — Accounting Staff',
    () => navAccounting(page, 'Financial Reports', 'Income Statement'));

  // Books & Library Setup — check if nav item exists
  const booksBtn = page.locator('aside nav').getByRole('button').filter({ hasText: /Books|Library/i });
  if (await booksBtn.count() > 0) {
    await safeShot(page, 'books-setup.png', 'Books & Library Setup',
      async () => { await booksBtn.first().click(); await pause(600); });
  } else {
    skip('books-setup.png', 'BOOKS_SETUP has no sidebar nav entry in navigation.config.ts — not reachable via UI');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 7 — HR MANAGER
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n[ 7 — HR MANAGER ]');
  await doLogout(page);
  await doLogin(page, ACCOUNTS.HR);
  // HR auto-navigates to HR_MANAGEMENT
  await safeShot(page, 'hr-management.png',               'HR Management — HR Manager');

  await safeShot(page, 'action-center-hr.png',            'Action Center — HR Manager',
    () => navClick(page, 'Action Center'));

  // ══════════════════════════════════════════════════════════════════════════
  // 8 — PAYROLL OFFICER
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n[ 8 — PAYROLL OFFICER ]');
  await doLogout(page);
  await doLogin(page, ACCOUNTS.PAYROLL);

  await safeShot(page, 'action-center-payroll.png',       'Action Center — Payroll Officer',
    () => navClick(page, 'Action Center'));

  await safeShot(page, 'payroll-management.png',          'Payroll Management — Payroll Officer',
    () => navPayroll(page, 'Payroll Management'));

  // ══════════════════════════════════════════════════════════════════════════
  // 9 — GUIDANCE COUNSELOR
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n[ 9 — GUIDANCE COUNSELOR ]');
  await doLogout(page);
  await doLogin(page, ACCOUNTS.GUIDANCE);
  // Guidance auto-navigates to GUIDANCE
  await safeShot(page, 'guidance-office-counselor.png',   'Guidance Office — Counselor');

  await safeShot(page, 'guidance-reports-counselor.png',  'Guidance Reports — Counselor',
    () => navGuidance(page, 'Guidance Reports'));

  // ══════════════════════════════════════════════════════════════════════════
  // 10 — SCHOOL NURSE
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n[ 10 — SCHOOL NURSE ]');
  await doLogout(page);
  await doLogin(page, ACCOUNTS.NURSE);
  // Nurse auto-navigates to NURSE_CLINIC
  await safeShot(page, 'clinic-module-nurse.png',         'Clinic Module — School Nurse');

  await safeShot(page, 'clinic-reports-nurse.png',        'Clinic Reports — School Nurse',
    () => navClinic(page, 'Clinic Reports'));

  skip('consultation-nurse.png',
    'NURSE role lacks CONSULTATION permission — PDF placeholder can use consultation.png (Super Admin capture)');

  // ══════════════════════════════════════════════════════════════════════════
  // 11 — REGISTRAR
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n[ 11 — REGISTRAR ]');
  await doLogout(page);
  await doLogin(page, ACCOUNTS.REGISTRAR);
  // Registrar auto-navigates to REGISTRAR (enrollment module)
  await safeShot(page, 'enrollment-registrar.png',        'Enrollment — Registrar View');

  await safeShot(page, 'action-center-registrar.png',     'Action Center — Registrar',
    () => navClick(page, 'Action Center'));

  // ══════════════════════════════════════════════════════════════════════════
  // 12 — PARENT / GUARDIAN PORTAL  (no DB user — skip)
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n[ 12 — PARENT / GUARDIAN ]');
  skip('parent-portal.png',
    'No GUARDIAN role user in Supabase DB. Add a user with role=GUARDIAN and re-run, or capture manually.');

  // ── Finish ─────────────────────────────────────────────────────────────────
  await browser.close();

  const w = 62;
  console.log('\n' + '═'.repeat(w));
  console.log(`  RESULT: ${captured.length} captured, ${skipped.length} skipped/failed`);
  console.log('═'.repeat(w));
  console.log('\nSaved to demo-screenshots/:');
  captured.forEach(s => console.log(`  ✓  ${s.filename}`));
  if (skipped.length) {
    console.log('\nNeeds manual capture or fix:');
    skipped.forEach(s => console.log(`  ⚠  ${s.filename}\n     ${s.reason}`));
  }

  const manifest = { capturedAt: new Date().toISOString(), captured, skipped };
  writeFileSync(join(OUT_DIR, '_manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('\n  Manifest → demo-screenshots/_manifest.json\n');
}

main().catch(err => {
  console.error('\nFATAL:', err.message);
  process.exit(1);
});

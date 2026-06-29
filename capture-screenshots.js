/**
 * STSN Connect — Demo PDF Screenshot Capture Script
 * Phase 2: Automated screenshot capture via Playwright
 *
 * Run: node capture-screenshots.js
 * Requires: npm run dev running on http://localhost:3000
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL  = 'http://localhost:3000';
const OUT_DIR   = path.join(__dirname, 'demo-screenshots');
const PASSWORD  = 'password123';
const VIEWPORT  = { width: 1920, height: 1080 };

// ── Accounts ─────────────────────────────────────────────────────────────────
const ACCOUNTS = {
  SUPER_ADMIN : 'admin@stsn.edu.ph',
  ADMIN       : 'admin@cdsta.edu.ph',    // School Administrator (ADMIN role)
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

// ── Results ───────────────────────────────────────────────────────────────────
const captured = [];
const skipped  = [];

// ── Helpers ───────────────────────────────────────────────────────────────────
const pause = (ms) => new Promise(r => setTimeout(r, ms));

async function shot(page, filename, label) {
  await pause(2800); // let animations / data settle
  const file = path.join(OUT_DIR, filename);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  ✓  ${filename}`);
  captured.push({ filename, label });
}

function skip(filename, reason) {
  console.log(`  ⚠  SKIP ${filename} — ${reason}`);
  skipped.push({ filename, reason });
}

/**
 * Click a sidebar button whose visible text starts with `text`.
 * Searches only inside <aside> so header buttons are never matched.
 */
async function navClick(page, text, nth = 0) {
  const aside = page.locator('aside');
  const btn   = aside.getByRole('button').filter({ hasText: new RegExp(`^\\s*${escRe(text)}`, 'i') });
  await btn.nth(nth).click();
  await pause(700);
}

function escRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Ensure the Admission group is expanded, then click the named child.
 */
async function navAdmission(page, childText) {
  const aside = page.locator('aside');
  // Expand if not already
  const childVisible = await aside.getByRole('button')
    .filter({ hasText: new RegExp(`^\\s*${escRe(childText)}`, 'i') })
    .first().isVisible().catch(() => false);
  if (!childVisible) {
    await navClick(page, 'Admission');
  }
  await navClick(page, childText);
}

/**
 * Navigate to an Accounting sub-item.
 * path = ['Accounting Dashboard'] | ['Student Accounts', 'Student Ledger'] etc.
 */
async function navAccounting(page, ...navPath) {
  // Always open/re-open Accounting group first
  await navClick(page, 'Accounting');
  await pause(300);

  if (navPath.length === 1) {
    await navClick(page, navPath[0]);
  } else {
    // Expand sub-group
    await navClick(page, navPath[0]);
    await pause(300);
    // Click leaf
    await navClick(page, navPath[1]);
  }
}

/**
 * Navigate inside the Payroll group.
 */
async function navPayroll(page, childText) {
  await navClick(page, 'Payroll');
  await pause(300);
  await navClick(page, childText);
}

/**
 * Navigate inside the Clinic group (category group: children have targetModule).
 */
async function navClinic(page, childText) {
  const aside = page.locator('aside');
  const visible = await aside.getByRole('button')
    .filter({ hasText: new RegExp(`^\\s*${escRe(childText)}`, 'i') })
    .first().isVisible().catch(() => false);
  if (!visible) {
    await navClick(page, 'Clinic');
  }
  await navClick(page, childText);
}

/**
 * Navigate inside the Guidance Office group.
 */
async function navGuidance(page, childText) {
  const aside = page.locator('aside');
  const visible = await aside.getByRole('button')
    .filter({ hasText: new RegExp(`^\\s*${escRe(childText)}`, 'i') })
    .first().isVisible().catch(() => false);
  if (!visible) {
    await navClick(page, 'Guidance Office');
  }
  // When Guidance Office label appears twice (parent + child), click second one
  const btns = aside.getByRole('button')
    .filter({ hasText: new RegExp(`^\\s*${escRe(childText)}`, 'i') });
  const count = await btns.count();
  await btns.nth(count > 1 ? 1 : 0).click();
  await pause(700);
}

/**
 * Navigate inside the User Access & Authority group.
 */
async function navUserAccess(page, childText) {
  const aside = page.locator('aside');
  const visible = await aside.getByRole('button')
    .filter({ hasText: new RegExp(`^\\s*${escRe(childText)}`, 'i') })
    .first().isVisible().catch(() => false);
  if (!visible) {
    await navClick(page, 'User Access');
  }
  await navClick(page, childText);
}

/**
 * Navigate inside the HR group.
 */
async function navHR(page, childText) {
  // HR is a non-category group; clicking parent also sets activeModule
  await navClick(page, 'HR');
  await pause(300);
  const aside = page.locator('aside');
  const btns = aside.getByRole('button')
    .filter({ hasText: new RegExp(`^\\s*${escRe(childText)}`, 'i') });
  const count = await btns.count();
  if (count > 0) {
    await btns.first().click();
    await pause(700);
  }
}

// ── Auth helpers ──────────────────────────────────────────────────────────────
async function waitForApp(page) {
  await page.waitForSelector('aside nav', { timeout: 20000 });
  await pause(2500); // wait for Supabase data load
}

async function doLogout(page) {
  // Click profile dropdown trigger (aria-label="Open user menu")
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

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('─'.repeat(60));
  console.log('  STSN Connect — Demo PDF Screenshot Capture');
  console.log('─'.repeat(60));

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    colorScheme: 'light',
  });
  const page = await ctx.newPage();

  // ── LOAD APP ──────────────────────────────────────────────────────────────
  console.log('\nLoading app (auto-login as SUPER_ADMIN)…');
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // App auto-logs in as SUPER_ADMIN via store.initialize()
  // If login screen shows instead, manually log in
  const loginVisible = await page.locator('input[type="email"]').isVisible().catch(() => false);
  if (loginVisible) {
    console.log('  Login screen detected — logging in manually…');
    await doLogin(page, ACCOUNTS.SUPER_ADMIN);
  } else {
    await waitForApp(page);
  }

  // ════════════════════════════════════════════════════════════════════════
  // SECTION 1: SUPER ADMIN — top-level navigation
  // ════════════════════════════════════════════════════════════════════════
  console.log('\n[ SUPER ADMIN — General modules ]');

  await navClick(page, 'Dashboard');
  await shot(page, 'dashboard-super-admin.png', 'Dashboard — Super Admin');

  await navClick(page, 'Action Center');
  await shot(page, 'action-center-super-admin.png', 'Action Center — Super Admin');

  // ── Admission group ───────────────────────────────────────────────────
  console.log('\n[ SUPER ADMIN — Admission group ]');

  await navAdmission(page, 'Enrollment');
  await shot(page, 'enrollment-admissions-directory.png', 'Enrollment / Admission');

  await navAdmission(page, 'Students');
  await shot(page, 'student-directory.png', 'Student Directory');

  await navAdmission(page, 'Class Sectioning');
  await shot(page, 'class-sectioning.png', 'Class Sectioning');

  await navAdmission(page, 'Class Scheduling');
  await shot(page, 'class-scheduling.png', 'Class Scheduling');

  await navAdmission(page, 'Faculty');
  await shot(page, 'faculty-management.png', 'Faculty Management');

  await navAdmission(page, 'Syllabus Pathways');
  await shot(page, 'curriculum-syllabus-pathways.png', 'Curriculum / Syllabus Pathways');

  await navAdmission(page, 'Grades Directory');
  await shot(page, 'grades-directory.png', 'Grades Directory');

  await navAdmission(page, 'Registrar Reports');
  await shot(page, 'registrar-reports.png', 'Registrar Reports');

  // ── Accounting group ──────────────────────────────────────────────────
  console.log('\n[ SUPER ADMIN — Accounting group ]');

  await navAccounting(page, 'Accounting Dashboard');
  await shot(page, 'accounting-dashboard.png', 'Accounting Dashboard (KPI)');

  await navAccounting(page, 'Student Accounts', 'Student Ledger');
  await shot(page, 'student-accounts.png', 'Student Accounts — Ledger');

  await navAccounting(page, 'Accounting Setup', 'Chart of Accounts');
  await shot(page, 'accounting-setup.png', 'Accounting Setup — Chart of Accounts');

  await navAccounting(page, 'General Ledger', 'Journal Entries');
  await shot(page, 'journal-entries.png', 'Journal Entries / General Ledger');

  await navAccounting(page, 'Accounts Receivable', 'Sales Invoice');
  await shot(page, 'accounts-receivable.png', 'Accounts Receivable — Sales Invoice');

  await navAccounting(page, 'Accounts Payable', 'Purchase Invoice');
  await shot(page, 'accounts-payable.png', 'Accounts Payable — Purchase Invoice');

  await navAccounting(page, 'Financial Reports', 'Income Statement');
  await shot(page, 'financial-reports.png', 'Financial Reports — Income Statement');

  // ── Payroll group ─────────────────────────────────────────────────────
  console.log('\n[ SUPER ADMIN — Payroll ]');

  await navPayroll(page, 'Payroll Dashboard');
  await shot(page, 'payroll-dashboard.png', 'Payroll Dashboard');

  // ── Online Learning ───────────────────────────────────────────────────
  console.log('\n[ SUPER ADMIN — Online Learning ]');
  await navClick(page, 'Online Learning');
  await shot(page, 'online-learning.png', 'Online Learning / LMS');

  // ── Clinic group ──────────────────────────────────────────────────────
  console.log('\n[ SUPER ADMIN — Clinic group ]');

  await navClinic(page, 'Nurse');
  await shot(page, 'clinic-module.png', 'Clinic Module — School Nurse View');

  await navClinic(page, 'Consultation');
  await shot(page, 'consultation.png', 'Consultation / Appointments');

  await navClinic(page, 'Clinic Reports');
  await shot(page, 'clinic-reports.png', 'Clinic Reports');

  // ── Guidance Office group ─────────────────────────────────────────────
  console.log('\n[ SUPER ADMIN — Guidance group ]');

  await navGuidance(page, 'Guidance Office');
  await shot(page, 'guidance-office.png', 'Guidance Office');

  await navGuidance(page, 'Guidance Reports');
  await shot(page, 'guidance-reports.png', 'Guidance Reports');

  // ── User Access & Authority group ─────────────────────────────────────
  console.log('\n[ SUPER ADMIN — User Access group ]');

  await navUserAccess(page, 'User Security');
  await shot(page, 'user-access-authority.png', 'User Access & Authority — User Security');

  await navUserAccess(page, 'Admin Reports');
  await shot(page, 'admin-reports.png', 'Admin Reports');

  // ── Core Setup ────────────────────────────────────────────────────────
  console.log('\n[ SUPER ADMIN — Core Setup ]');
  await navClick(page, 'Core Setup');
  await shot(page, 'core-setup.png', 'Core Setup / System Configuration');

  // ── Student Portal (Super Admin view) ─────────────────────────────────
  console.log('\n[ SUPER ADMIN — Student Portal ]');
  await navClick(page, 'Student Portal');
  await shot(page, 'student-portal-super-admin.png', 'Student Portal — Super Admin View');

  // ════════════════════════════════════════════════════════════════════════
  // SECTION 2: SCHOOL ADMIN (ADMIN role)
  // ════════════════════════════════════════════════════════════════════════
  console.log('\n[ SCHOOL ADMINISTRATOR ]');
  await doLogout(page);
  await doLogin(page, ACCOUNTS.ADMIN);

  await navClick(page, 'Dashboard');
  await shot(page, 'dashboard-school-admin.png', 'Dashboard — School Administrator');

  await navClick(page, 'Action Center');
  await shot(page, 'action-center-school-admin.png', 'Action Center — School Administrator');

  await navClick(page, 'Student Directory');
  // For ADMIN, Student Directory might be a direct top-level link or in Admission group
  // Try direct first, fall back to Admission group
  await pause(500);
  const admDirectCheck = await page.locator('aside nav').getByRole('button')
    .filter({ hasText: /^\s*Students?/i }).first().isVisible().catch(() => false);
  if (!admDirectCheck) {
    // Direct nav item
    await navClick(page, 'Student Directory');
  }
  await shot(page, 'student-directory-school-admin.png', 'Student Directory — School Admin');

  await navHR(page, 'Dashboard');
  await shot(page, 'hr-management-school-admin.png', 'HR Management — School Administrator');

  await navClick(page, 'Registrar Reports');
  await shot(page, 'registrar-reports-school-admin.png', 'Registrar Reports — School Admin');

  // ════════════════════════════════════════════════════════════════════════
  // SECTION 3: CASHIER
  // ════════════════════════════════════════════════════════════════════════
  console.log('\n[ CASHIER ]');
  await doLogout(page);
  await doLogin(page, ACCOUNTS.CASHIER);

  // Cashier auto-navigates to CASHIER module (payment queue)
  await shot(page, 'cashiering-office.png', 'Cashiering — Payment Queue');

  // ════════════════════════════════════════════════════════════════════════
  // SECTION 4: TEACHER / FACULTY
  // ════════════════════════════════════════════════════════════════════════
  console.log('\n[ TEACHER / FACULTY ]');
  await doLogout(page);
  await doLogin(page, ACCOUNTS.TEACHER);

  // Teacher auto-navigates to FACULTY_PORTAL
  await shot(page, 'teacher-board.png', 'Teacher Board — Overview & Advisory');

  // Click "Student Grades Encoding" tab inside FacultyPortalPage
  await page.getByRole('button', { name: /Student Grades Encoding/i }).click();
  await shot(page, 'grade-encoding.png', 'Grade Encoding — Faculty Portal');

  // Curriculum (teacher has CURRICULUM permission)
  await navAdmission(page, 'Syllabus Pathways').catch(async () => {
    // Try direct nav (Admission group may not exist for teacher)
    await navClick(page, 'Syllabus Pathways');
  });
  await shot(page, 'curriculum-teacher.png', 'Curriculum — Teacher View');

  // Online Learning (teacher has ONLINE_LEARNING)
  await navClick(page, 'Online Learning');
  await shot(page, 'online-learning-teacher.png', 'Online Learning — Teacher View');

  // ════════════════════════════════════════════════════════════════════════
  // SECTION 5: STUDENT
  // ════════════════════════════════════════════════════════════════════════
  console.log('\n[ STUDENT ]');
  await doLogout(page);
  await doLogin(page, ACCOUNTS.STUDENT);

  // Student auto-navigates to STUDENT_PORTAL
  await shot(page, 'student-portal.png', 'Student Portal — Overview');

  // Online Learning sub-page (elearning) inside student portal
  await page.locator('aside nav').getByRole('button', { name: /Online Learning/i }).first().click();
  await shot(page, 'online-learning-student.png', 'Online Learning — Student View (inside Student Portal)');

  // Consultation
  await navClick(page, 'Consultation');
  await shot(page, 'consultation-student.png', 'Consultation — Student View');

  // ════════════════════════════════════════════════════════════════════════
  // SECTION 6: ACCOUNTING STAFF
  // ════════════════════════════════════════════════════════════════════════
  console.log('\n[ ACCOUNTING STAFF ]');
  await doLogout(page);
  await doLogin(page, ACCOUNTS.ACCOUNTING);

  // Accounting staff starts on ACCOUNTING module
  await navClick(page, 'Action Center');
  await shot(page, 'action-center-accounting.png', 'Action Center — Accounting Staff');

  // Navigate into Accounting group sub-pages
  await navAccounting(page, 'Student Accounts', 'Student Ledger');
  await shot(page, 'student-accounts-accounting.png', 'Student Accounts — Accounting View');

  await navAccounting(page, 'Accounting Setup', 'Chart of Accounts');
  await shot(page, 'accounting-setup-accounting.png', 'Accounting Setup — Chart of Accounts (Accounting Staff)');

  await navAccounting(page, 'General Ledger', 'Journal Entries');
  await shot(page, 'journal-entries-accounting.png', 'Journal Entries — Accounting Staff');

  await navAccounting(page, 'Accounts Receivable', 'Sales Invoice');
  await shot(page, 'accounts-receivable-accounting.png', 'Accounts Receivable — Accounting Staff');

  await navAccounting(page, 'Accounts Payable', 'Purchase Invoice');
  await shot(page, 'accounts-payable-accounting.png', 'Accounts Payable — Accounting Staff');

  await navAccounting(page, 'Financial Reports', 'Income Statement');
  await shot(page, 'financial-reports-accounting.png', 'Financial Reports — Accounting Staff');

  // Books Setup (BOOKS_SETUP is in accounting permissions — find it in sidebar)
  const booksBtn = page.locator('aside nav').getByRole('button', { name: /Books|Library/i });
  const booksCount = await booksBtn.count();
  if (booksCount > 0) {
    await booksBtn.first().click();
    await shot(page, 'books-setup.png', 'Books & Library Setup');
  } else {
    skip('books-setup.png', 'BOOKS_SETUP has no nav item in current sidebar — not reachable via UI nav');
  }

  // ════════════════════════════════════════════════════════════════════════
  // SECTION 7: HR MANAGER
  // ════════════════════════════════════════════════════════════════════════
  console.log('\n[ HR MANAGER ]');
  await doLogout(page);
  await doLogin(page, ACCOUNTS.HR);

  // HR auto-navigates to HR_MANAGEMENT
  await shot(page, 'hr-management.png', 'HR Management — HR Manager Role');

  await navClick(page, 'Action Center');
  await shot(page, 'action-center-hr.png', 'Action Center — HR Manager');

  // ════════════════════════════════════════════════════════════════════════
  // SECTION 8: PAYROLL OFFICER
  // ════════════════════════════════════════════════════════════════════════
  console.log('\n[ PAYROLL OFFICER ]');
  await doLogout(page);
  await doLogin(page, ACCOUNTS.PAYROLL);

  await navClick(page, 'Action Center');
  await shot(page, 'action-center-payroll.png', 'Action Center — Payroll Officer');

  await navPayroll(page, 'Payroll Management');
  await shot(page, 'payroll-management.png', 'Payroll Management');

  // ════════════════════════════════════════════════════════════════════════
  // SECTION 9: GUIDANCE COUNSELOR
  // ════════════════════════════════════════════════════════════════════════
  console.log('\n[ GUIDANCE COUNSELOR ]');
  await doLogout(page);
  await doLogin(page, ACCOUNTS.GUIDANCE);

  // Guidance auto-navigates to GUIDANCE module
  await shot(page, 'guidance-office-counselor.png', 'Guidance Office — Counselor View');

  await navGuidance(page, 'Guidance Reports');
  await shot(page, 'guidance-reports-counselor.png', 'Guidance Reports — Counselor View');

  // ════════════════════════════════════════════════════════════════════════
  // SECTION 10: SCHOOL NURSE
  // ════════════════════════════════════════════════════════════════════════
  console.log('\n[ SCHOOL NURSE ]');
  await doLogout(page);
  await doLogin(page, ACCOUNTS.NURSE);

  // Nurse auto-navigates to NURSE_CLINIC
  await shot(page, 'clinic-module-nurse.png', 'Clinic Module — Nurse View');

  await navClinic(page, 'Clinic Reports');
  await shot(page, 'clinic-reports-nurse.png', 'Clinic Reports — Nurse View');

  // Nurse doesn't have CONSULTATION permission — skip
  skip('consultation-nurse.png', 'NURSE role lacks CONSULTATION permission in current config — use super-admin or student screenshot');

  // ════════════════════════════════════════════════════════════════════════
  // SECTION 11: REGISTRAR (for role-specific sidebar context)
  // ════════════════════════════════════════════════════════════════════════
  console.log('\n[ REGISTRAR ]');
  await doLogout(page);
  await doLogin(page, ACCOUNTS.REGISTRAR);

  // Registrar auto-navigates to REGISTRAR module
  await shot(page, 'enrollment-registrar.png', 'Enrollment — Registrar View');

  await navClick(page, 'Action Center');
  await shot(page, 'action-center-registrar.png', 'Action Center — Registrar');

  // ════════════════════════════════════════════════════════════════════════
  // SECTION 12: GUARDIAN / PARENT PORTAL
  // ════════════════════════════════════════════════════════════════════════
  console.log('\n[ PARENT / GUARDIAN ]');
  skip('parent-portal.png', 'No GUARDIAN role user exists in the current Supabase database — needs manual creation or import');

  // ════════════════════════════════════════════════════════════════════════
  // DONE
  // ════════════════════════════════════════════════════════════════════════
  await browser.close();

  console.log('\n' + '═'.repeat(60));
  console.log(`  CAPTURED : ${captured.length} screenshots`);
  console.log(`  SKIPPED  : ${skipped.length}`);
  console.log('═'.repeat(60));

  console.log('\nCaptured files:');
  captured.forEach(s => console.log(`  ✓  demo-screenshots/${s.filename}`));

  if (skipped.length) {
    console.log('\nSkipped (manual action needed):');
    skipped.forEach(s => console.log(`  ⚠  ${s.filename}  →  ${s.reason}`));
  }

  // Write a JSON manifest for Phase 3 reference
  const manifest = { captured, skipped, capturedAt: new Date().toISOString() };
  fs.writeFileSync(
    path.join(__dirname, 'demo-screenshots', '_manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  console.log('\nManifest saved to demo-screenshots/_manifest.json');
}

main().catch(e => {
  console.error('\nFATAL:', e.message);
  console.error(e.stack);
  process.exit(1);
});
